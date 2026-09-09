import { createContext, useContext, useEffect, useState } from "react";
import { api, getSession } from "../lib/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getSession()
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const signIn = async (type, body) => {
    const result = await api(`/auth/${type}`, { method: "POST", body });
    setUser(result.user);
    setError("");
    return result.user;
  };
  const logout = async () => {
    await api("/auth/logout", { method: "POST", body: {} });
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
// Context and its hook intentionally share a module.
// oxlint-disable-next-line react/only-export-components
export const useAuth = () => useContext(AuthContext);
