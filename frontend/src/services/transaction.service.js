import api from "./api";

export const transactionService = {
  create: async (businessId, data) => {
    const res = await api.post(
      `/businesses/${businessId}/transactions`,
      data
    );
    return res.data;
  },

  getAll: async (businessId, params) => {
    const res = await api.get(
      `/businesses/${businessId}/transactions`,
      { params }
    );
    return res.data;
  },

  getOne: async (businessId, transactionId) => {
    const res = await api.get(
      `/businesses/${businessId}/transactions/${transactionId}`
    );
    return res.data;
  },

  getSummary: async (businessId) => {
    const res = await api.get(
      `/businesses/${businessId}/transactions/summary`
    );
    return res.data;
  },
};