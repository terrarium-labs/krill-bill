import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: any }>
    signUp: (email: string, password: string,) => Promise<{ error: any }>
    resetPassword: (email: string) => Promise<{ error: any }>
    updatePassword: (password: string) => Promise<{ error: any }>
    signOut: () => Promise<void>
    loginWithGoogle: () => Promise<{ error: any }>
    loginWithMicrosoft: () => Promise<{ error: any }>
    refreshToken: () => Promise<{ data: any, error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

interface AuthProviderProps {
    children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setUser(session.user);
                localStorage.setItem('x-auth-token', session.access_token);
            } else {
                setUser(null);
                localStorage.removeItem('x-auth-token');
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { error }
    }

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        })
        return { error }
    }

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        })
        return { error }
    }

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({
            password: password
        })
        return { error }
    }

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        })
        return { error }
    }

    const loginWithMicrosoft = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'azure',
            options: {
                redirectTo: window.location.origin,
                scopes: 'email',
            },
        })
        return { error }
    }

    const signOut = async () => {
        localStorage.removeItem('sidebar-open')
        localStorage.removeItem('chat-visible')
        localStorage.removeItem('last-org-id')
        await supabase.auth.signOut()
        navigate('/')
    }

    const refreshToken = async () => {
        const { data, error } = await supabase.auth.refreshSession()
        return { data, error }
    }

    const value = {
        user,
        session,
        loading,
        signIn,
        signUp,
        resetPassword,
        updatePassword,
        signOut,
        loginWithGoogle,
        loginWithMicrosoft,
        refreshToken
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 