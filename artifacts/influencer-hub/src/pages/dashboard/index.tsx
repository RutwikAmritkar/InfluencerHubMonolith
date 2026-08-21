import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import BrandDashboard from "./brand";
import InfluencerDashboard from "./influencer";

export default function DashboardRouter() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.role === "brand") {
      setLocation("/dashboard/brand");
    } else {
      setLocation("/dashboard/influencer");
    }
  }, [user, setLocation]);

  if (user?.role === "brand") {
    return <BrandDashboard />;
  }

  return <InfluencerDashboard />;
}
