import axiosClient from './axiosClient';

export const dashboardApi = {
  getMetrics: () => axiosClient.get('/dashboard/metrics'),
};

export default dashboardApi;
