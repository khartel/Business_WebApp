import api from "./api";

export const businessService = {
  getCountries: async () => {
    const res = await api.get("/businesses/countries");
    return res.data;
  },

  create: async (data) => {
    const res = await api.post("/businesses", data);
    return res.data;
  },

  getAll: async () => {
    const res = await api.get("/businesses");
    return res.data;
  },

  getOne: async (id) => {
    const res = await api.get(`/businesses/${id}`);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/businesses/${id}`, data);
    return res.data;
  },
};