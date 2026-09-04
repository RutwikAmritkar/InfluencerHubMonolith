import { useAuth } from "@/contexts/auth-context";
import InfluencerDetail from "@/pages/influencers/detail";

export default function MyProfile() {
  const { user } = useAuth();
  
  // Reuses existing creator profile detail view, defaulting to current creator profile ID
  const profileId = String(user?.profileId || user?.id || 1);

  return <InfluencerDetail params={{ id: profileId }} />;
}
