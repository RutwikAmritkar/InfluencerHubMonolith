import { NormalizedSocialContent, NormalizedSocialProfile } from "./base.provider";

export interface CalculatedAnalytics {
  engagementRate: string; // e.g. "4.85" or "0.00"
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  viewToFollowerRatio: string; // e.g. "0.52" or "0.00"
  totalContentAnalyzed: number;
}

export function calculateVerifiedAnalytics(
  profile: NormalizedSocialProfile,
  contentList: NormalizedSocialContent[]
): CalculatedAnalytics {
  if (!contentList || contentList.length === 0) {
    return {
      engagementRate: "0.00",
      avgViews: 0,
      avgLikes: 0,
      avgComments: 0,
      viewToFollowerRatio: "0.00",
      totalContentAnalyzed: 0,
    };
  }

  const sampleSize = contentList.length;
  const totalLikes = contentList.reduce((sum, item) => sum + (item.likes || 0), 0);
  const totalComments = contentList.reduce((sum, item) => sum + (item.comments || 0), 0);
  const totalViews = contentList.reduce((sum, item) => sum + (item.views || 0), 0);

  const avgLikes = Math.round(totalLikes / sampleSize);
  const avgComments = Math.round(totalComments / sampleSize);
  const avgViews = Math.round(totalViews / sampleSize);

  // Legitimate Engagement Rate = (avgLikes + avgComments) / followers * 100
  let engagementRate = "0.00";
  if (profile.followers && profile.followers > 0) {
    const rawRate = ((avgLikes + avgComments) / profile.followers) * 100;
    engagementRate = rawRate.toFixed(2);
  }

  // Legitimate View to Follower Ratio = avgViews / followers
  let viewToFollowerRatio = "0.00";
  if (profile.followers && profile.followers > 0) {
    const rawRatio = avgViews / profile.followers;
    viewToFollowerRatio = rawRatio.toFixed(2);
  }

  return {
    engagementRate,
    avgViews,
    avgLikes,
    avgComments,
    viewToFollowerRatio,
    totalContentAnalyzed: sampleSize,
  };
}
