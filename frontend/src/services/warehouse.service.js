import api from "./api";

export const warehouseService = {
  create: async (businessId, data) => {
    const res = await api.post(`/businesses/${businessId}/warehouses`, data);
    return res.data;
  },

  getAll: async (businessId) => {
    const res = await api.get(`/businesses/${businessId}/warehouses`);
    return res.data;
  },

  getOne: async (businessId, warehouseId) => {
    const res = await api.get(
      `/businesses/${businessId}/warehouses/${warehouseId}`
    );
    return res.data;
  },

  setPrimary: async (businessId, warehouseId) => {
    const res = await api.patch(
      `/businesses/${businessId}/warehouses/${warehouseId}/primary`
    );
    return res.data;
  },

  update: async (businessId, warehouseId, data) => {
    const res = await api.patch(
      `/businesses/${businessId}/warehouses/${warehouseId}`,
      data
    );
    return res.data;
  },

  remove: async (businessId, warehouseId) => {
    const res = await api.delete(
      `/businesses/${businessId}/warehouses/${warehouseId}`
    );
    return res.data;
  },
};