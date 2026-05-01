import api from "./api";

export const authService = {
  register: async (data) => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  login: async (data) => {
    const res = await api.post("/auth/login", data);
    return res.data;
  },

  logout: async () => {
    const res = await api.post("/auth/logout");
    return res.data;
  },

  me: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },

  changePassword: async (data) => {
    const res = await api.post("/auth/change-password", data);
    return res.data;
  },
};