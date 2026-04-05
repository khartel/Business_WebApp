import api from "./api";

export const reportService = {
  daily: async (businessId, date) => {
    const res = await api.get(
      `/businesses/${businessId}/reports/daily`,
      { params: { date } }
    );
    return res.data;
  },

  weekly: async (businessId, date) => {
    const res = await api.get(
      `/businesses/${businessId}/reports/weekly`,
      { params: { date } }
    );
    return res.data;
  },

  monthly: async (businessId, year, month) => {
    const res = await api.get(
      `/businesses/${businessId}/reports/monthly`,
      { params: { year, month } }
    );
    return res.data;
  },

  employees: async (businessId, startDate, endDate) => {
    const res = await api.get(
      `/businesses/${businessId}/reports/employees`,
      { params: { startDate, endDate } }
    );
    return res.data;
  },

  products: async (businessId, startDate, endDate) => {
    const res = await api.get(
      `/businesses/${businessId}/reports/products`,
      { params: { startDate, endDate } }
    );
    return res.data;
  },

  stockAlerts: async (businessId) => {
    const res = await api.get(
      `/businesses/${businessId}/reports/stock`
    );
    return res.data;
  },
};