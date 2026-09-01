import axiosClient from './axiosClient';

export const authApi = {
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  register: (userData) => axiosClient.post('/auth/register', userData),
  getMe: () => axiosClient.get('/auth/me'),
  updatePassword: (passwordData) => axiosClient.put('/auth/password', passwordData),
  getAllUsers: () => axiosClient.get('/auth/users'),
};

export default authApi;
