import axiosClient from './axiosClient';

export const bookingApi = {
  getAll: (params) => axiosClient.get('/bookings', { params }),
  getById: (id) => axiosClient.get(`/bookings/${id}`),
  create: (data) => axiosClient.post('/bookings', data),
  assign: (id, data) => axiosClient.put(`/bookings/${id}/assign`, data),
  updateStatus: (id, data) => axiosClient.put(`/bookings/${id}/status`, data),
  getDriverTrips: (params) => axiosClient.get('/bookings/driver/my-trips', { params }),
  delete: (id) => axiosClient.delete(`/bookings/${id}`),
};

export default bookingApi;
