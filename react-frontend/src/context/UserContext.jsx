import { createContext, useEffect, useState } from "react";
import { authApi } from "../services/api";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // Ignore parse errors
        }
      }

      // Verify token with backend
      authApi
        .getMe()
        .then((res) => {
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem("user", JSON.stringify(res.user));
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    const res = await authApi.login(identifier, password);
    if (res?.user) {
      setUser(res.user);
      if (res.token) {
        setToken(res.token);
        localStorage.setItem("token", res.token);
      }
      localStorage.setItem("user", JSON.stringify(res.user));
      return res.user;
    }
    throw new Error("Login failed");
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setToken(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isTeacher: user?.role === "Teacher",
    isStudent: user?.role === "Student",
    role: user?.role || null,
    login,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
