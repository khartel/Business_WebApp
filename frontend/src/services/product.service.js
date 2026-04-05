import api from "./api";

export const productService = {
  create: async (businessId, data) => {
    const res = await api.post(`/businesses/${businessId}/products`, data);
    return res.data;
  },

  getAll: async (businessId) => {
    const res = await api.get(`/businesses/${businessId}/products`);
    return res.data;
  },

  getOne: async (businessId, productId) => {
    const res = await api.get(
      `/businesses/${businessId}/products/${productId}`
    );
    return res.data;
  },

  update: async (businessId, productId, data) => {
    const res = await api.patch(
      `/businesses/${businessId}/products/${productId}`,
      data
    );
    return res.data;
  },

  remove: async (businessId, productId) => {
    const res = await api.delete(
      `/businesses/${businessId}/products/${productId}`
    );
    return res.data;
  },

  addStock: async (businessId, productId, data) => {
    const res = await api.post(
      `/businesses/${businessId}/products/${productId}/stock`,
      data
    );
    return res.data;
  },
};