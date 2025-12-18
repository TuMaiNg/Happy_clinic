import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { AppointmentModel } from '../models/Appointment';
import { ServiceModel } from '../models/Service';
import { PaymentModel } from '../models/Payment';
import { createPaymentLink, verifyWebhookSignature } from '../services/payos.service';

function generateOrderCode(appointmentId: number): number {
  const ts = String(Date.now());
  const randomSuffix = String(Math.floor(Math.random() * 100)).padStart(2, '0'); 
  const uniqueString = `${ts.substring(ts.length - 8)}${appointmentId % 1000}${randomSuffix}`;
  return parseInt(uniqueString.substring(0, 15), 10); 
}

export const createLink = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Không có quyền truy cập', 403);

  const { appointmentId, amount, description } = req.body as {
    appointmentId: number;
    amount?: number;
    description?: string;
  };

  if (!appointmentId) throw new AppError('Thiếu appointmentId', 400);

  const appointment = await AppointmentModel.findById(appointmentId);
  if (!appointment) throw new AppError('Không tìm thấy lịch hẹn', 404);

  // Patient can only create link for own appointment
  if (req.user.role === 'patient') {
    const { PatientModel } = await import('../models/Patient');
    const patient = await PatientModel.findByUserId(req.user.id);
    if (!patient || patient.id !== appointment.patientId) {
      throw new AppError('Không có quyền thanh toán cho lịch hẹn này', 403);
    }
  }

  const service = await ServiceModel.findById(appointment.serviceId);
  if (!service) throw new AppError('Không tìm thấy dịch vụ', 404);

  const paymentAmount = amount || service.price;
  if (paymentAmount <= 0) throw new AppError('Số tiền không hợp lệ', 400);

  const orderCode = generateOrderCode(appointmentId);

  const { payUrl, data } = await createPaymentLink({
    orderCode,
    amount: Math.round(paymentAmount),
    description: description || `Thanh toán lịch hẹn #${appointmentId}`,
  });

  // Lưu payment ở trạng thái pending theo hình thức bank_transfer (PayOS)
  await PaymentModel.create({
    appointmentId,
    amount: paymentAmount,
    paymentMethod: 'bank_transfer',
    status: 'pending',
    transactionId: null as any, // sẽ cập nhật transactionId thực nhận từ webhook
    orderCode: String(orderCode),
    gateway: 'payos',
    meta: { createResponse: data },
    notes: 'PayOS pending',
  });

  res.status(201).json({
    success: true,
    message: 'Tạo link thanh toán thành công',
    data: {
      payUrl,
      orderCode,
      gatewayResponse: data,
    },
  });
};

export const status = async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Không có quyền truy cập', 403);

  const orderCode = String(req.query.orderCode || '').trim();
  if (!orderCode) throw new AppError('Thiếu orderCode', 400);

  // Tìm payment theo order_code trước, fallback theo transaction_id
  let payment = await PaymentModel.findByOrderCode(orderCode);
  if (!payment) {
    payment = await PaymentModel.findByTransactionId(orderCode);
  }
  if (!payment) throw new AppError('Không tìm thấy thanh toán', 404);

  // Kiểm tra quyền (nếu là patient)
  if (req.user.role === 'patient') {
    const { PatientModel } = await import('../models/Patient');
    const patient = await PatientModel.findByUserId(req.user.id);
    const appointment = await AppointmentModel.findById(payment.appointmentId);
    if (!patient || !appointment || patient.id !== appointment.patientId) {
      throw new AppError('Không có quyền truy cập', 403);
    }
  }

  res.json({
    success: true,
    data: {
      orderCode,
      status: payment.status,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      gateway: (payment as any).gateway || null,
      transactionId: payment.transactionId || null,
      paidAt: payment.paidAt || null,
    },
  });
};

export const webhook = async (req: Request, res: Response) => {
  try {
    // req.body is Buffer when using express.raw()
    const rawBody: Buffer = Buffer.isBuffer(req.body) ? (req.body as Buffer) : Buffer.from(req.body as any);
    const signature = (req.headers['x-signature'] || req.headers['X-Signature']) as string | undefined;

    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const payload = JSON.parse(rawBody.toString('utf8')) as any;

    // Normalize fields (adjust with real PayOS fields)
    const orderCode: string | undefined = payload?.data?.orderCode || payload?.orderCode || payload?.data?.order_id;
    const status: string | undefined = payload?.data?.status || payload?.status || payload?.code;
    const transactionId: string | undefined = payload?.data?.transactionId || payload?.transactionId;

    if (!orderCode) {
      return res.status(200).json({ success: true, message: 'No orderCode, ignored' });
    }

    // Ưu tiên tìm theo order_code (đã lưu khi tạo link)
    let payment = await PaymentModel.findByOrderCode(orderCode);

    // Fallback theo transaction_id (trường hợp cũ)
    if (!payment) {
      payment = await PaymentModel.findByTransactionId(orderCode);
    }

    if (!payment) {
      return res.status(200).json({ success: true, message: 'Payment not found, ignored' });
    }

    // If already paid, return OK
    if (payment.status === 'paid') return res.status(200).json({ success: true });

    const isPaid = ['PAID', 'SUCCESS', '00', 'COMPLETED'].includes(String(status || '').toUpperCase());

    await PaymentModel.update(payment.id!, {
      status: isPaid ? 'paid' : 'failed',
      paidAt: isPaid ? new Date() : undefined,
      transactionId: transactionId || payment.transactionId,
      notes: `PayOS webhook status=${status}`,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    // Always return 200 to avoid retries storm if your policy requires; here we return 500 to detect issues
    return res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
};

