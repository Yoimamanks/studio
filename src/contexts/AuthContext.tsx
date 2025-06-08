"use client";

import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import { useRouter, usePathname } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === "/login" || pathname === "/signup";
    const isLandingPage = pathname === "/";
    const isDashboardPage = pathname?.startsWith("/dashboard");

    if (!user && isDashboardPage) {
      router.push("/login");
    } else if (user && (isAuthPage || isLandingPage)) {
      // If user is logged in and on auth page or landing, redirect to dashboard
      router.push("/dashboard");
    }
    // Allow access to landing page if not logged in
    // Allow access to auth pages if not logged in
  }, [user, loading, router, pathname]);
  
  if (loading && (pathname?.startsWith("/dashboard") || pathname === "/login" || pathname === "/signup")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
