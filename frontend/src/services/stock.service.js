import api from "./api";

export const stockService = {
  getAll: async (businessId) => {
    const res = await api.get(`/businesses/${businessId}/stock`);
    return res.data;
  },

  move: async (businessId, data) => {
    const res = await api.post(
      `/businesses/${businessId}/stock/move`,
      data
    );
    return res.data;
  },

  getMovements: async (businessId) => {
    const res = await api.get(
      `/businesses/${businessId}/stock/movements`
    );
    return res.data;
  },
};