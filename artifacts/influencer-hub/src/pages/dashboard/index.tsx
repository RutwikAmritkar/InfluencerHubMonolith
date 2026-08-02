import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardRouter() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.role === "brand") {
      setLocation("/dashboard/brand");
    } else if (user?.role === "influencer") {
      setLocation("/dashboard/influencer");
    }
  }, [user, setLocation]);

  return null;
}
