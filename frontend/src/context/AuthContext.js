// Location: frontend/src/context/AuthContext.js

import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Check if user is logged in on initial load
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await apiClient.get('/auth/me');
          setUser(response.data.data.user);
        } catch (error) {
          console.error('Error checking auth status:', error);
          localStorage.removeItem('token');
        }
      }
      
      setLoading(false);
    };
    
    checkLoggedIn();
  }, []);
  
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await apiClient.post('/auth/login', { email, password });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.data.token);
      
      // Set user in state
      setUser(response.data.data.user);
      
      return response.data.data.user;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };
  
  const register = async (name, email, password) => {
    try {
      setError(null);
      const response = await apiClient.post('/auth/register', { name, email, password });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.data.token);
      
      // Set user in state
      setUser(response.data.data.user);
      
      return response.data.data.user;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };
  
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Clear user from state
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;