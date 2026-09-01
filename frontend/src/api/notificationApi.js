import axiosClient from './axiosClient';

export const notificationApi = {
  getAll: (params) => axiosClient.get('/notifications', { params }),
  sendManual: (data) => axiosClient.post('/notifications/send', data),
};

export default notificationApi;
