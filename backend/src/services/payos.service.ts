import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/env';

function normalizeDescription(str: string): string {
  // 1. Chuyển sang tiếng Việt không dấu
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  str = str.replace(/đ/g, 'd').replace(/Đ/g, 'D');

  // 2. Chỉ giữ lại chữ cái, số và khoảng trắng (Loại bỏ #, @, %, ...)
  str = str.replace(/[^a-zA-Z0-9 ]/g, '');

  // 3. Cắt ngắn nếu cần (PayOS thường giới hạn khoảng 25-50 ký tự hiển thị tốt trên app ngân hàng)
  return str.substring(0, 50);
}

export interface CreatePaymentParams {
  orderCode: number;
  amount: number;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  expiredAt?: number; // unix seconds
}

export interface CreatePaymentResult {
  payUrl: string;
  data: any;
}

function hmacSHA256(key: string, data: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}
// Sort object keys alphabetically a-z
function sortObjDataByKey(object: any) {
  const orderedObject = Object.keys(object)
    .sort()
    .reduce((obj: any, key: string) => {
      obj[key] = object[key];
      return obj;
    }, {} as any);
  return orderedObject;
}

// Convert object to query string key=value&key=value
function convertObjToQueryStr(object: any) {
  return Object.keys(object)
    .filter((key) => object[key] !== undefined && object[key] !== '' && object[key] !== null)
    .map((key) => `${key}=${object[key]}`)
    .join('&');
}

export function signPayload(payload: any): string {
  // Sign by sorting keys and building query string per PayOS spec
  const sortedData = sortObjDataByKey(payload);
  const dataToSign = convertObjToQueryStr(sortedData);
  return hmacSHA256(config.payos.checksumKey, dataToSign);
}

function signRaw(data: string): string {
  // For webhook verification: sign raw body string
  return hmacSHA256(config.payos.checksumKey, data);
}

export function verifyWebhookSignature(rawBody: Buffer | string, signature?: string): boolean {
  if (!signature) return false;
  const raw = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  const expected = signRaw(raw);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function createPaymentLink(params: CreatePaymentParams): Promise<CreatePaymentResult> {
  // Normalize base URL to always include protocol and no trailing slash
  const rawBaseUrl = config.payos.baseUrl || 'https://api.payos.vn';
  const baseUrl = (/^https?:\/\//i.test(rawBaseUrl) ? rawBaseUrl : `https://${rawBaseUrl}`).replace(/\/+$/,'');
  const url = `${baseUrl}/v2/payment-requests`;

  const payload: any = {
    orderCode: params.orderCode,
    amount: params.amount,
    description: normalizeDescription(params.description || `Thanh toan don hang ${params.orderCode}`),
    returnUrl: params.returnUrl || config.payos.returnUrl,
    cancelUrl: params.cancelUrl || config.payos.cancelUrl,
    buyerName: params.buyerName,
    buyerEmail: params.buyerEmail,
    buyerPhone: params.buyerPhone,
    expiredAt: params.expiredAt,
  };

  // Remove undefined/null to avoid signature mismatch
  Object.keys(payload).forEach((k) => (payload[k] === undefined || payload[k] === null) && delete payload[k]);

  // Create signature from cleaned payload
  const signature = signPayload(payload);

  // Attach signature into payload body (required by PayOS)
  payload.signature = signature;

  const headers = {
    'Content-Type': 'application/json',
    'x-client-id': config.payos.clientId,
    'x-api-key': config.payos.apiKey,
  } as any;

  try {
    const res = await axios.post(url, payload, { headers });

    const payUrl = res.data?.data?.checkoutUrl || res.data?.data?.payUrl || res.data?.checkoutUrl || res.data?.payUrl;
    if (!payUrl) {
      console.error('PayOS Response Data:', JSON.stringify(res.data, null, 2));
      throw new Error('Không nhận được payUrl từ PayOS');
    }

    return { payUrl, data: res.data };
  } catch (err: any) {
    // Surface clearer error to client, typical when DNS/Network fails
    // Log the detailed error from PayOS
    console.error('PayOS API Error:', JSON.stringify(err?.response?.data, null, 2));

    const msg = err?.code === 'ENOTFOUND' || /ENOTFOUND/i.test(String(err?.message))
      ? 'Không thể kết nối tới PayOS (lỗi DNS). Vui lòng kiểm tra mạng/DNS hoặc PAYOS_BASE_URL.'
      : (err?.response?.data?.message || err?.message || 'Lỗi gọi API PayOS');
    throw new Error(msg);
  }
}

