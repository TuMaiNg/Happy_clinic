import api from '../config/api';

export interface Payment {
  id: number;
  appointmentId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface CreatePaymentRequest {
  appointmentId: number;
  paymentMethod: 'cash' | 'credit' | 'bank_transfer' | 'online';
  amount: number;
  notes?: string;
}

export interface CreatePayOSLinkResponse {
  success: boolean;
  data: {
    payUrl: string;
    orderCode: string;
    gatewayResponse?: any;
  };
}

export interface PayOSStatusResponse {
  success: boolean;
  data: {
    orderCode: string;
    status: string;
    amount: number;
    paymentMethod: string;
    gateway: string | null;
    transactionId: string | null;
    paidAt: string | null;
  };
}

export const paymentService = {
  async create(data: CreatePaymentRequest): Promise<{ success: boolean; data: Payment }> {
    const response = await api.post('/payments', data);
    return response.data;
  },

  async getAll(params?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<{ success: boolean; data: Payment[] }> {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  async getById(id: number): Promise<{ success: boolean; data: Payment }> {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  async confirm(id: number, transactionId?: string): Promise<{ success: boolean; data: Payment }> {
    const response = await api.put(`/payments/${id}/confirm`, { transactionId });
    return response.data;
  },

  async createPayOSLink(appointmentId: number, amount?: number, description?: string): Promise<CreatePayOSLinkResponse> {
    const response = await api.post('/payments/payos/create', { appointmentId, amount, description });
    return response.data;
  },

  async getPayOSStatus(orderCode: string): Promise<PayOSStatusResponse> {
    const response = await api.get('/payments/payos/status', { params: { orderCode } });
    return response.data;
  },
};

