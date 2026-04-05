import api from "./api";

export const teamService = {
  add: async (businessId, data) => {
    const res = await api.post(`/businesses/${businessId}/team`, data);
    return res.data;
  },

  getAll: async (businessId) => {
    const res = await api.get(`/businesses/${businessId}/team`);
    return res.data;
  },

  remove: async (businessId, businessUserId) => {
    const res = await api.delete(
      `/businesses/${businessId}/team/${businessUserId}`
    );
    return res.data;
  },

  updateRole: async (businessId, businessUserId, role) => {
    const res = await api.patch(
      `/businesses/${businessId}/team/${businessUserId}`,
      { role }
    );
    return res.data;
  },
};