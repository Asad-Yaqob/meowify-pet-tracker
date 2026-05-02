import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentAdmin, loginAdmin as apiLogin, logoutAdmin as apiLogout } from '../../lib/services/api/adminAuth';
import { AdminResponse, LoginData } from '../../lib/types/adminAuthTypes';

interface AuthContextType {
    user: AdminResponse | null;
    loading: boolean;
    login: (data: LoginData) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AdminResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await getCurrentAdmin();
                setUser(response.data);
            } catch (_error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (data: LoginData) => {
        const response = await apiLogin(data);
        setUser(response.data);
    };

    const logout = async () => {
        try {
            await apiLogout();
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
