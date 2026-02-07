import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

// TODO: REMOVE WHEN PROPER AUTHENTICATION IS CREATED
// Simple test credentials
const ADMIN_TEST_CREDENTIALS = {
  username: 'admin',
  password: 'password123'
};
const STAFF_TEST_CREDENTIALS = {
  username: 'staff',
  password: 'password123'
};
const GUEST_TEST_CREDENTIALS = {
  username: 'guest',
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

  const login = (username, password) => {
    //TODO: UPDATE WHEN AUTHENTICATION IS COMPLETED. SHOULD HAVE USER INFORMATION FROM DB CONTAINING USER INFORMATION
    let testUser = null;
    
    // Check admin credentials
    if (username === ADMIN_TEST_CREDENTIALS.username && password === ADMIN_TEST_CREDENTIALS.password) {
      testUser = {
        id: '1',
        username: username,
        role: 'admin',
        email: 'admin@test.com'
      };
    }
    // Check staff credentials
    else if (username === STAFF_TEST_CREDENTIALS.username && password === STAFF_TEST_CREDENTIALS.password) {
      testUser = {
        id: '2',
        username: username,
        role: 'staff',
        email: 'staff@test.com'
      };
    }
    // Check guest credentials
    else if (username === GUEST_TEST_CREDENTIALS.username && password === GUEST_TEST_CREDENTIALS.password) {
      testUser = {
        id: '3',
        username: username,
        role: 'guest',
        email: 'guest@test.com'
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
        message: 'Invalid username or password'
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
