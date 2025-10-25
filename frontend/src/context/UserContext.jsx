import React, { createContext, useState, useContext, useEffect } from 'react';
import { generateAnonymousUser } from '../utils/api';

const UserContext = createContext();

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const savedUser = localStorage.getItem('anonymousUser');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          const newUser = await generateAnonymousUser();
          if (newUser) {
            setUser(newUser);
            localStorage.setItem('anonymousUser', JSON.stringify(newUser));
          }
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('anonymousUser', JSON.stringify(newUserData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('anonymousUser');
  };

  const value = {
    user,
    setUser: updateUser,
    logout,
    loading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Export the context itself for advanced usage
export default UserContext;