import axios from "axios";

// Separate axios instance — no auth token, uses master key instead
const platformApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

export const platformService = {
  getAll: async (masterKey) => {
    const res = await platformApi.get("/platform/superadmins", {
      headers: { "x-master-key": masterKey },
    });
    return res.data;
  },

  deleteSuperAdmin: async (masterKey, userId) => {
    const res = await platformApi.delete(
      `/platform/superadmins/${userId}`,
      {
        headers: { "x-master-key": masterKey },
      }
    );
    return res.data;
  },
};