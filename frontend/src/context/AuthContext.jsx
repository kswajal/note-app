import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const readStoredSession = () => {
  try {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!user || !token) {
      return { user: null, token: null };
    }

    return { user: JSON.parse(user), token };
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return { user: null, token: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = readStoredSession();
    setUser(session.user);
    setToken(session.token);
    setLoading(false);
  }, []);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
