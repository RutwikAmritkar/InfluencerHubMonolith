import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth-context";

export interface AdminUser {
  id: number;
  userId: string;
  roleId: number;
  roleSlug: string;
  roleName: string;
  permissions: string[];
}

export interface AdminContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  isError: boolean;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: boolean;
  refetch: () => Promise<any>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/admin/me", user?.id],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/me`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Not authorized as administrator");
      }
      return res.json();
    },
    enabled: Boolean(user?.id),
    staleTime: 60 * 1000,
    retry: false,
  });

  const admin: AdminUser | null = data?.admin ?? null;
  const isSuperAdmin = admin?.roleSlug === "super_admin";

  const hasPermission = (permission: string): boolean => {
    if (!admin) return false;
    if (isSuperAdmin) return true;
    return admin.permissions?.includes(permission) ?? false;
  };

  return (
    <AdminContext.Provider
      value={{
        admin,
        isLoading,
        isError,
        hasPermission,
        isSuperAdmin,
        refetch,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
