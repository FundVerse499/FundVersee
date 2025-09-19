import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthClient } from '@dfinity/auth-client';

interface User {
  principal: string;
  name: string;
  email: string;
  registered_at_ns: bigint;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  identity: any;
  login: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [identity, setIdentity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Internet Identity
  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error("Auth initialization timed out after 15 seconds");
      setLoading(false);
    }, 15000);

    initializeAuth().finally(() => {
      clearTimeout(timeoutId);
    });
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('Starting auth initialization...');
      const authClient = await AuthClient.create();
      console.log('Auth client created');
      
      // Check if user is already authenticated
      const isAuthenticated = await authClient.isAuthenticated();
      console.log('Is authenticated:', isAuthenticated);
      
      if (isAuthenticated) {
        const identity = authClient.getIdentity();
        console.log('Identity obtained:', identity.getPrincipal().toText());
        setIdentity(identity);
        setIsAuthenticated(true);
        
        // Set basic user info
        setUser({
          principal: identity.getPrincipal().toText(),
          name: "User",
          email: "",
          registered_at_ns: BigInt(Date.now() * 1000000)
        });
        console.log('User info set');
      } else {
        console.log('User not authenticated');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      console.log('Auth initialization completed, setting loading to false');
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      console.log('Starting login process...');
      setLoading(true);
      
      const authClient = await AuthClient.create();
      console.log('Auth client created for login');
      
      // Start authentication flow
      await new Promise<void>((resolve, reject) => {
        console.log('Starting Internet Identity login...');
        authClient.login({
          identityProvider: process.env.DFX_NETWORK === 'ic' 
            ? 'https://identity.ic0.app' 
            : 'http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943',
          onSuccess: () => {
            console.log('Login successful');
            resolve();
          },
          onError: (error: any) => {
            console.error('Login failed:', error);
            reject(error);
          },
        });
      });

      const identity = authClient.getIdentity();
      console.log('Identity obtained after login:', identity.getPrincipal().toText());
      setIdentity(identity);
      setIsAuthenticated(true);
      
      // Set basic user info
      setUser({
        principal: identity.getPrincipal().toText(),
        name: "User",
        email: "",
        registered_at_ns: BigInt(Date.now() * 1000000)
      });
      console.log('Login process completed successfully');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      console.log('Login process finished, setting loading to false');
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIdentity(null);
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    identity,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Basic authentication hook
export const useRequireAuth = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return { loading: true };
  }
  
  if (!isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  return { loading: false };
};

