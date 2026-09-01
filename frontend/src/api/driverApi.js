import axiosClient from './axiosClient';

export const driverApi = {
  getAll: (params) => axiosClient.get('/drivers', { params }),
  getById: (id) => axiosClient.get(`/drivers/${id}`),
  create: (data) => axiosClient.post('/drivers', data),
  update: (id, data) => axiosClient.put(`/drivers/${id}`, data),
  delete: (id) => axiosClient.delete(`/drivers/${id}`),
};

export default driverApi;
