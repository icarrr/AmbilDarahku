"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type User = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  blood_type: string;
  city: string;
  total_donations: number;
  total_points: number;
  avatar_url?: string;
  username?: string;
  email_verified: boolean;
  province?: string;
  province_name?: string;
  city_name?: string;
  district?: string;
  district_name?: string;
  date_of_birth?: string;
  gender?: string;
  latitude?: number;
  longitude?: number;
  weight_kg?: number;
  height_cm?: number;
  verification_level?: number;
  trust_score?: number;
  last_donation_date?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isUnverified: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

type RegisterData = {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  date_of_birth: string;
  gender: string;
  blood_type: string;
  weight_kg: number;
  height_cm: number;
  province: string;
  city: string;
  district: string;
  latitude?: number;
  longitude?: number;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const data = await api.get<{ user: User }>("/auth/me");
      setUser(data.user);
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await api.post<{
      user: User;
      access_token: string;
      refresh_token: string;
    }>("/auth/login", { email, password }, false);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setUser(data.user);
  };

  const register = async (regData: RegisterData) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regData),
    });
    if (res.status === 409) {
      const errBody = await res.json().catch(() => ({ error: "already_registered" }));
      const e = new Error(errBody.error) as any;
      e.statusCode = 409;
      e.can_reset = errBody.can_reset;
      e.friendlyMessage = errBody.message;
      throw e;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error);
    }
    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: user?.role === "super_admin", isUnverified: user ? !user.email_verified : false, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
