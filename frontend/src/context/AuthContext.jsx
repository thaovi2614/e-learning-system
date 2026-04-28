import { createContext, useContext, useEffect, useState } from "react";
import { loginApi, registerApi, logoutApi, getProfile } from "../services/authApi";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const isLoggedIn = localStorage.getItem("isLoggedIn");

        if (isLoggedIn) {
            fetchProfile().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
        
    }, []);

    const login = async (data) => {
        try {
            await loginApi(data);

            const user = await fetchProfile();

            if (!user) {
                return { success: false, message: "Không lấy được user" };
            }
            
            localStorage.setItem("isLoggedIn", "true");
            return { success: true, user };
        } catch (err) {
            return {
                success: false,
                message:
                err.response?.data?.message || "Đăng nhập thất bại",
            };
        }
    };

    const register = async (data) => {
        try {
            await registerApi(data);

            return await login({
                username: data.username,
                password: data.password
            });

        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Đăng ký thất bại"
            };
        }
    };

    const logout = async () => {
        await logoutApi();
        localStorage.removeItem("isLoggedIn");
        setUser(null);
    };

    const fetchProfile = async () => {
        try {
            const res = await getProfile();
            setUser(res.data);
            return res.data;
        } catch {
            setUser(null);
            return null;
        }
    };

    if (loading) return null;

    return (
        <AuthContext.Provider value={{ user, login, register, logout, fetchProfile }}>
        {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}