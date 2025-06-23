import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verify token on mount
    const verifyAuth = async () => {
      if (authService.isAuthenticated()) {
        const isValid = await authService.verifyToken();
        if (!isValid) {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await authService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    }
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      setError(null);
      const response = await authService.register(email, password, username);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};