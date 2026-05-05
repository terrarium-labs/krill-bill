import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { getMe } from '@/api/me/me';
import { useAuth } from '@/auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { Me } from '@/types/general/user';

interface UserContextType {
  user: Me,
  setUser: (user: Me) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { user: supabaseUser } = useAuth();
  const [user, setUser] = useState<Me | null>(null);
  const { i18n } = useTranslation();

  const [loading, setLoading] = useState(false);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await getMe();
      if (response.success && response.success.user) {
        setUser(response.success.user);
        if (!response.success.user.photo_url) {
          setUser({
            ...response.success.user,
            photo_url: supabaseUser?.user_metadata.avatar_url ?? null
          });
        }
        i18n.changeLanguage(response.success.user.lang);
      }
    } catch (error) {
      console.error("Error getting user:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (supabaseUser && !loading) {
      fetchUser();
    }
  }, [supabaseUser]);

  const contextValue: UserContextType = {
    user: user as Me,
    setUser,
  };

  if (!user) {
    return null;
  }

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
