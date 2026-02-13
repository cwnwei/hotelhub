import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

// TODO: REMOVE WHEN PROPER AUTHENTICATION IS CREATED
// Simple test credentials
const ADMIN_TEST_CREDENTIALS = {
  email: 'admin@test.com',
  password: 'password123'
};
const STAFF_TEST_CREDENTIALS = {
  email: 'staff@test.com',
  password: 'password123'
};
const GUEST_TEST_CREDENTIALS = {
  email: 'guest@test.com',
  password: 'password123'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setAuthError(null);
      
      // Check if there's a stored token in localStorage for testing
      const storedUser = localStorage.getItem('testUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
      
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('App state check failed:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'Failed to load app'
      });
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  };

  const login = (email, password) => {
    //TODO: UPDATE WHEN AUTHENTICATION IS COMPLETED. SHOULD HAVE USER INFORMATION FROM DB CONTAINING USER INFORMATION
    let testUser = null;
    
    // Check admin credentials
    if (email === ADMIN_TEST_CREDENTIALS.email && password === ADMIN_TEST_CREDENTIALS.password) {
      testUser = {
        id: '1',
        email: email,
        name: 'Admin User',
        phone: '+1 (555) 001-0001',
        role: 'admin'
      };
    }
    // Check staff credentials
    else if (email === STAFF_TEST_CREDENTIALS.email && password === STAFF_TEST_CREDENTIALS.password) {
      testUser = {
        id: '2',
        email: email,
        name: 'Staff User',
        phone: '+1 (555) 002-0002',
        role: 'admin'
      };
    }
    // Check guest credentials
    else if (email === GUEST_TEST_CREDENTIALS.email && password === GUEST_TEST_CREDENTIALS.password) {
      testUser = {
        id: '3',
        email: email,
        name: 'Guest User',
        phone: '+1 (555) 003-0003',
        role: 'user'
      };
    }
    
    if (testUser) {
      setUser(testUser);
      setIsAuthenticated(true);
      localStorage.setItem('testUser', JSON.stringify(testUser));
      setAuthError(null);
      return testUser;
    } else {
      setAuthError({
        type: 'invalid_credentials',
        message: 'Invalid email or password'
      });
      return null;
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('testUser');
    setAuthError(null);
    
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      login,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
