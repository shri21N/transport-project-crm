import axiosClient from './axiosClient';

export const invoiceApi = {
  getAll: (params) => axiosClient.get('/invoices', { params }),
  getById: (id) => axiosClient.get(`/invoices/${id}`),
  createRazorpayOrder: (id) => axiosClient.post(`/invoices/${id}/create-order`),
  verifyPayment: (id, paymentData) => axiosClient.post(`/invoices/${id}/verify-payment`, paymentData),
  markPaidManual: (id, data) => axiosClient.put(`/invoices/${id}/mark-paid`, data),
};

export default invoiceApi;
