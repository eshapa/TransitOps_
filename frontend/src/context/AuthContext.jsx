import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('transitops_user');
    const storedToken = localStorage.getItem('transitops_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    } else {
      // Clear incomplete storage
      localStorage.removeItem('transitops_user');
      localStorage.removeItem('transitops_token');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('transitops_token', token);
      localStorage.setItem('transitops_user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Login failed. Please try again.';
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('transitops_token');
    localStorage.removeItem('transitops_user');
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
