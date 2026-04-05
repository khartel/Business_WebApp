import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/auth.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    const { token, user } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);

    return user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // continue logout even if api fails
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeBusiness");
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  // Get businesses based on role
  const getUserBusinesses = (userData) => {
    if (!userData) return [];

    if (userData.role === "SUPERADMIN") {
      return userData.ownedBusinesses || [];
    }

    // For Admin and Employee
    return userData.businesses || [];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        getUserBusinesses,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === "SUPERADMIN",
        isAdmin: user?.role === "ADMIN",
        isEmployee: user?.role === "EMPLOYEE",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};