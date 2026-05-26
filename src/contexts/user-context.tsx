import React, { createContext, useContext, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useAuth } from '@/auth/AuthContext';

interface UserContextType {
    user: User | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

interface UserProviderProps {
    children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const { user, session, loading } = useAuth();

    const value = useMemo(() => ({
        user,
        session,
        isAuthenticated: !!user,
        isLoading: loading,
    }), [user, session, loading]);

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
