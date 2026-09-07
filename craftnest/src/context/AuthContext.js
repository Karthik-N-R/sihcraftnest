"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const DEMO_USERS = [
  {
    id: "u_demo_seller",
    name: "Rajesh Kumar (Artisan)",
    email: "seller@craftnest.dev",
    password: "password123",
    role: "seller"
  },
  {
    id: "u_demo_buyer",
    name: "Rohan Sharma (Buyer)",
    email: "buyer@craftnest.dev",
    password: "password123",
    role: "buyer"
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState(DEMO_USERS);
  const [isLoading, setIsLoading] = useState(true);

  // Load user & registered users from localStorage on mount
  useEffect(() => {
    try {
      const savedUsersList = localStorage.getItem('craftnest_users_db');
      let currentUsers = DEMO_USERS;
      if (savedUsersList) {
        const parsed = JSON.parse(savedUsersList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentUsers = parsed;
        }
      }
      setRegisteredUsers(currentUsers);

      const savedSessionUser = localStorage.getItem('craftnest_user_session');
      if (savedSessionUser) {
        setUser(JSON.parse(savedSessionUser));
      }
    } catch (err) {
      console.error("Failed to load auth session", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save session when user state changes
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        localStorage.setItem('craftnest_user_session', JSON.stringify(user));
      } else {
        localStorage.removeItem('craftnest_user_session');
      }
    }
  }, [user, isLoading]);

  // Save registered users database
  useEffect(() => {
    if (!isLoading && registeredUsers.length > 0) {
      localStorage.setItem('craftnest_users_db', JSON.stringify(registeredUsers));
    }
  }, [registeredUsers, isLoading]);

  const login = (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    const found = registeredUsers.find(
      u => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword
    );

    if (found) {
      const sessionUser = {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
        preferredLanguage: found.preferredLanguage || 'en'
      };
      setUser(sessionUser);
      return { success: true, user: sessionUser };
    }

    return { success: false, error: 'Invalid email or password. Try demo accounts below.' };
  };

  const signup = ({ name, email, password, role = 'buyer', preferredLanguage = 'en' }) => {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const cleanRole = role === 'seller' ? 'seller' : 'buyer';
    const cleanLang = (preferredLanguage === 'ta' || preferredLanguage === 'hi') ? preferredLanguage : 'en';

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return { success: false, error: 'All fields are required.' };
    }

    const existing = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email already exists. Please log in.' };
    }

    const newUser = {
      id: `u_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role: cleanRole,
      preferredLanguage: cleanLang
    };

    setRegisteredUsers(prev => [...prev, newUser]);

    const sessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      preferredLanguage: newUser.preferredLanguage
    };

    setUser(sessionUser);
    return { success: true, user: sessionUser };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      isSeller: user?.role === 'seller',
      isBuyer: user?.role === 'buyer',
      login,
      signup,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
