import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/analytics/influencer/:id", async (req, res): Promise<void> => {
  // Rich sample analytics data
  res.json({
    followerGrowth: [
      { month: "Jan", followers: 32000 }, { month: "Feb", followers: 34500 },
      { month: "Mar", followers: 36200 }, { month: "Apr", followers: 38900 },
      { month: "May", followers: 41200 }, { month: "Jun", followers: 43800 },
      { month: "Jul", followers: 45200 }, { month: "Aug", followers: 47600 },
      { month: "Sep", followers: 50100 }, { month: "Oct", followers: 53400 },
      { month: "Nov", followers: 56200 }, { month: "Dec", followers: 59800 },
    ],
    engagementByMonth: [
      { month: "Jan", rate: 4.2 }, { month: "Feb", rate: 4.8 }, { month: "Mar", rate: 5.1 },
      { month: "Apr", rate: 4.6 }, { month: "May", rate: 5.3 }, { month: "Jun", rate: 4.9 },
      { month: "Jul", rate: 5.7 }, { month: "Aug", rate: 6.1 }, { month: "Sep", rate: 5.8 },
      { month: "Oct", rate: 6.4 }, { month: "Nov", rate: 5.9 }, { month: "Dec", rate: 6.2 },
    ],
    reachByMonth: [
      { month: "Jan", reach: 125000 }, { month: "Feb", reach: 138000 }, { month: "Mar", reach: 152000 },
      { month: "Apr", reach: 143000 }, { month: "May", reach: 167000 }, { month: "Jun", reach: 158000 },
      { month: "Jul", reach: 174000 }, { month: "Aug", reach: 189000 }, { month: "Sep", reach: 201000 },
      { month: "Oct", reach: 215000 }, { month: "Nov", reach: 198000 }, { month: "Dec", reach: 223000 },
    ],
    audienceGender: { male: 38, female: 57, other: 5 },
    ageDistribution: [
      { range: "13-17", percentage: 8 }, { range: "18-24", percentage: 34 },
      { range: "25-34", percentage: 29 }, { range: "35-44", percentage: 18 },
      { range: "45-54", percentage: 8 }, { range: "55+", percentage: 3 },
    ],
    countryDistribution: [
      { country: "India", percentage: 32 }, { country: "United States", percentage: 24 },
      { country: "United Kingdom", percentage: 11 }, { country: "Canada", percentage: 8 },
      { country: "Australia", percentage: 7 }, { country: "Others", percentage: 18 },
    ],
  });
});

router.get("/analytics/campaign/:id", async (req, res): Promise<void> => {
  res.json({
    totalReach: 2840000,
    totalEngagement: 187300,
    estimatedRoi: 3.8,
    impressions: 4200000,
    clicks: 94500,
    performanceByDay: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split("T")[0],
      reach: Math.floor(150000 + Math.random() * 80000),
      engagement: Math.floor(8000 + Math.random() * 5000),
    })),
  });
});

export default router;
