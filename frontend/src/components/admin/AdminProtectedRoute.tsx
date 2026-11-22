import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { AdminProvider, useAdmin } from "@/contexts/admin-context";
import { AdminLayout } from "./AdminLayout";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { admin, isLoading: adminLoading, isError } = useAdmin();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        setLocation("/login");
      } else if (isError || !admin) {
        toast.error("Access denied. Administrative privileges required.");
        setLocation("/dashboard");
      }
    }
  }, [user, admin, authLoading, adminLoading, isError, setLocation]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen w-full bg-[#FAF9F6] dark:bg-[#09090B] text-[#0A0A0A] dark:text-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6A0D18] dark:text-[#E87985] mb-3" />
        <p className="text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA]">
          Authenticating Administrative Credentials...
        </p>
      </div>
    );
  }

  if (!user || isError || !admin) {
    return (
      <div className="min-h-screen w-full bg-[#FAF9F6] dark:bg-[#09090B] text-[#0A0A0A] dark:text-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6A0D18] dark:text-[#E87985] mb-3" />
        <p className="text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA]">
          Redirecting to authorized workspace...
        </p>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}

export function AdminProtectedRoute({ component: Component, ...rest }: any) {
  return (
    <AdminProvider>
      <AdminGuard>
        <Component {...rest} />
      </AdminGuard>
    </AdminProvider>
  );
}
