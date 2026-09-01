import axiosClient from './axiosClient';

export const vehicleApi = {
  getAll: (params) => axiosClient.get('/vehicles', { params }),
  getById: (id) => axiosClient.get(`/vehicles/${id}`),
  create: (data) => axiosClient.post('/vehicles', data),
  update: (id, data) => axiosClient.put(`/vehicles/${id}`, data),
  delete: (id) => axiosClient.delete(`/vehicles/${id}`),
};

export default vehicleApi;
