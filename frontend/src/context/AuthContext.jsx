import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUser = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Basic check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser({ username: decoded.sub });
        }
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkUser();
  }, []);

  const login = async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const res = await api.post('/auth/token', formData);
    localStorage.setItem('token', res.data.access_token);
    checkUser();
    return true;
  };

  const signup = async (username, password) => {
    await api.post('/auth/signup', { username, password });
    // Auto login after signup
    return login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);