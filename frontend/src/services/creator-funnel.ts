/**
 * CREATOR FUNNEL SERVICE
 * Shared domain logic, persistent state, and event coordination connecting:
 * Stage 1: Opportunities (/opportunities - Discovery Grid)
 * Stage 2: Applications (/applications - Pipeline Ledger)
 * Stage 3: My Campaigns (/my-campaigns - Execution Workspace)
 */

export interface OpportunityItem {
  id: string;
  title: string;
  brandName: string;
  brandInitials: string;
  brandLogoUrl?: string;
  deliverable: string;
  format: "9:16 Reels" | "YT Shorts" | "Carousels";
  category: "Beauty & Lifestyle" | "Tech & Gadgets" | "Fashion & Apparel" | "Food & Fitness";
  city: "Mumbai" | "Bengaluru" | "Delhi NCR" | "Pune" | "Hyderabad";
  minPayout: number;
  maxPayout: number;
  deadline: string;
  description: string;
  escrowStatus: string;
}

export interface ApplicationItem {
  id: string;
  campaignId: string;
  campaignTitle: string;
  brandName: string;
  brandInitials: string;
  brandLogoUrl?: string;
  deliverableProposed: string;
  quotedRate: number;
  appliedDate: string;
  status: "pending" | "shortlisted" | "accepted" | "declined" | "withdrawn";
  pitchMessage: string;
  platform: string;
}

export interface ActiveCollaborationItem {
  id: string;
  linkedCampaignId: string;
  title: string;
  brandName: string;
  brandInitials: string;
  brandLogoUrl?: string;
  escrowAmount: string;
  escrowStatus: string;
  deliverableScope: string;
  currentStep: number; // 1 to 4
  steps: Array<{
    name: string;
    description: string;
    completed: boolean;
    date?: string;
  }>;
  submittedDraftUrl?: string;
  deadlineDate: string;
  status: "active" | "completed";
  messagesThreadId: string;
}

export const INITIAL_OPPORTUNITIES: OpportunityItem[] = [
  {
    id: "op-1",
    title: "Summer Skincare Launch",
    brandName: "Glow Cosmetics",
    brandInitials: "GC",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=150&auto=format&fit=crop",
    deliverable: "1× Instagram Reel (30–45s)",
    format: "9:16 Reels",
    category: "Beauty & Lifestyle",
    city: "Mumbai",
    minPayout: 40000,
    maxPayout: 50000,
    deadline: "Nov 24, 2026",
    description:
      "Looking for beauty & aesthetic creators in Mumbai to demonstrate daily morning SPF routines with authentic UGC video and product texture closeups.",
    escrowStatus: "Terms Confirmed",
  },
  {
    id: "op-2",
    title: "Everyday Desk Setup & Unboxing",
    brandName: "NovaTech Gear",
    brandInitials: "NT",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=150&auto=format&fit=crop",
    deliverable: "1× YT Short + 2× IG Stories",
    format: "YT Shorts",
    category: "Tech & Gadgets",
    city: "Bengaluru",
    minPayout: 30000,
    maxPayout: 38000,
    deadline: "Nov 20, 2026",
    description:
      "Showcase minimalist workspace ergonomics featuring our wireless charging desk mat, cable organizers, and active noise-canceling headset.",
    escrowStatus: "Terms Confirmed",
  },
  {
    id: "op-3",
    title: "Winter Athleisure Drop",
    brandName: "UrbanFit Apparel",
    brandInitials: "UF",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=150&auto=format&fit=crop",
    deliverable: "2× 9:16 Styling Reels",
    format: "9:16 Reels",
    category: "Fashion & Apparel",
    city: "Delhi NCR",
    minPayout: 50000,
    maxPayout: 65000,
    deadline: "Nov 30, 2026",
    description:
      "High-energy transitions styling our thermal activewear sets for morning gym sessions and urban commutes with contemporary aesthetics.",
    escrowStatus: "Terms Confirmed",
  },
  {
    id: "op-4",
    title: "Organic Morning Cold-Brew Story",
    brandName: "FreshBite Organics",
    brandInitials: "FB",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=150&auto=format&fit=crop",
    deliverable: "3× IG Carousels + Story Set",
    format: "Carousels",
    category: "Food & Fitness",
    city: "Pune",
    minPayout: 25000,
    maxPayout: 32000,
    deadline: "Dec 05, 2026",
    description:
      "Organic lifestyle creators to share simple, wholesome morning routines using artisanal cold brew concentrates and roasted seed blends.",
    escrowStatus: "Budget Confirmed",
  },
  {
    id: "op-5",
    title: "Flagship Smartphone Camera Audit",
    brandName: "Aura Mobile",
    brandInitials: "AM",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02560?q=80&w=150&auto=format&fit=crop",
    deliverable: "1× Dedicated YT Review (8-10m)",
    format: "YT Shorts",
    category: "Tech & Gadgets",
    city: "Hyderabad",
    minPayout: 70000,
    maxPayout: 90000,
    deadline: "Dec 12, 2026",
    description:
      "Low-light stabilization benchmarking and cinematic 4K color profile comparison against current market flagships.",
    escrowStatus: "Terms Confirmed",
  },
  {
    id: "op-6",
    title: "Ayurvedic Haircare Rituals",
    brandName: "Vedika Botanics",
    brandInitials: "VB",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1526947425960-945c6e72858f?q=80&w=150&auto=format&fit=crop",
    deliverable: "1× 9:16 Reel (45s) + 2 Stories",
    format: "9:16 Reels",
    category: "Beauty & Lifestyle",
    city: "Mumbai",
    minPayout: 38000,
    maxPayout: 46000,
    deadline: "Dec 18, 2026",
    description:
      "Traditional scalp oiling rituals and modern botanical formulations explained with soothing ASMR audio and macro botanical shots.",
    escrowStatus: "Terms Confirmed",
  },
];

export const INITIAL_APPLICATIONS: ApplicationItem[] = [
  {
    id: "app-1",
    campaignId: "op-1",
    campaignTitle: "Summer Skincare Launch",
    brandName: "Glow Cosmetics",
    brandInitials: "GC",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=150&auto=format&fit=crop",
    deliverableProposed: "1× Instagram Reel (30–45s)",
    quotedRate: 45000,
    appliedDate: "2026-11-10",
    status: "accepted",
    pitchMessage:
      "Loved your clean skincare line! My Mumbai audience of 125K engages heavily with daily skincare reels and sun-protection routines. 5.8% verified ER.",
    platform: "instagram",
  },
  {
    id: "app-2",
    campaignId: "op-2",
    campaignTitle: "Everyday Desk Setup & Unboxing",
    brandName: "NovaTech Gear",
    brandInitials: "NT",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=150&auto=format&fit=crop",
    deliverableProposed: "1× YT Short + 2× IG Stories",
    quotedRate: 32000,
    appliedDate: "2026-11-12",
    status: "pending",
    pitchMessage:
      "Super excited about this rollout. I can deliver high-retention desk cable setup footage and wireless charging speed diagnostics.",
    platform: "youtube",
  },
  {
    id: "app-3",
    campaignId: "op-3",
    campaignTitle: "Winter Athleisure Drop",
    brandName: "UrbanFit Apparel",
    brandInitials: "UF",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=150&auto=format&fit=crop",
    deliverableProposed: "2× 9:16 Styling Reels",
    quotedRate: 55000,
    appliedDate: "2026-11-14",
    status: "pending",
    pitchMessage:
      "Fashion and activewear styling is my core demographic focus. Proposing 2 high-energy transition Reels showcasing versatile layering.",
    platform: "instagram",
  },
];

export const INITIAL_MY_CAMPAIGNS: ActiveCollaborationItem[] = [
  {
    id: "mc-1",
    linkedCampaignId: "op-1",
    title: "Summer Skincare Launch",
    brandName: "Glow Cosmetics",
    brandInitials: "GC",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=150&auto=format&fit=crop",
    escrowAmount: "₹45,000",
    escrowStatus: "Terms Confirmed",
    deliverableScope: "1× Instagram Reel (30–45s) • 30-day organic usage rights",
    currentStep: 2, // 1: Funded, 2: Draft Due, 3: Approved, 4: Paid
    steps: [
      {
        name: "Terms Confirmed",
        description: "Glow Cosmetics committed ₹45,000 for milestone release",
        completed: true,
        date: "Nov 10, 2026",
      },
      {
        name: "Draft Submitted",
        description: "Submit video hook script or rough cut link for feedback",
        completed: false,
        date: "Due Nov 20, 2026",
      },
      {
        name: "Brand Approved",
        description: "Brand team validates deliverable meets brief guidelines",
        completed: false,
      },
      {
        name: "Payout Released",
        description: "Instant T+0 milestone release to your registered UPI",
        completed: false,
      },
    ],
    submittedDraftUrl: "",
    deadlineDate: "Nov 24, 2026",
    status: "active",
    messagesThreadId: "t1",
  },
  {
    id: "mc-2",
    linkedCampaignId: "hist-0",
    title: "Monsoon Hydration Essentials",
    brandName: "PureDew Skin",
    brandInitials: "PD",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=150&auto=format&fit=crop",
    escrowAmount: "₹38,000",
    escrowStatus: "Payout Released",
    deliverableScope: "1× 9:16 Reel + 2 Stories",
    currentStep: 4,
    steps: [
      {
        name: "Terms Confirmed",
        description: "₹38,000 agreed payout confirmed",
        completed: true,
        date: "Oct 05, 2026",
      },
      {
        name: "Draft Submitted",
        description: "Draft Reel approved with 0 revisions",
        completed: true,
        date: "Oct 12, 2026",
      },
      {
        name: "Brand Approved",
        description: "Live post verified (42K reach)",
        completed: true,
        date: "Oct 15, 2026",
      },
      {
        name: "Payout Released",
        description: "Disbursed to maya.creates@okicici",
        completed: true,
        date: "Oct 18, 2026",
      },
    ],
    submittedDraftUrl: "https://instagram.com/reel/C89218_demo",
    deadlineDate: "Oct 18, 2026",
    status: "completed",
    messagesThreadId: "t1",
  },
];

const STORAGE_KEYS = {
  APPLICATIONS: "cb_creator_applications_v1",
  CAMPAIGNS: "cb_creator_my_campaigns_v1",
};

// Storage Helpers
export function getSavedApplications(): ApplicationItem[] {
  if (typeof window === "undefined") return INITIAL_APPLICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(INITIAL_APPLICATIONS));
      return INITIAL_APPLICATIONS;
    }
    return JSON.parse(raw);
  } catch (_e) {
    return INITIAL_APPLICATIONS;
  }
}

export function saveApplication(item: ApplicationItem): ApplicationItem[] {
  const current = getSavedApplications();
  const existingIdx = current.findIndex((a) => a.campaignId === item.campaignId);
  let updated: ApplicationItem[];
  if (existingIdx >= 0) {
    updated = current.map((a, i) => (i === existingIdx ? item : a));
  } else {
    updated = [item, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("cb_applications_updated"));
  } catch (_e) {}
  return updated;
}

export function withdrawApplication(appId: string): ApplicationItem[] {
  const current = getSavedApplications();
  const updated = current.map((a) => (a.id === appId ? { ...a, status: "withdrawn" as const } : a));
  try {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("cb_applications_updated"));
  } catch (_e) {}
  return updated;
}

export function getSavedMyCampaigns(): ActiveCollaborationItem[] {
  if (typeof window === "undefined") return INITIAL_MY_CAMPAIGNS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(INITIAL_MY_CAMPAIGNS));
      return INITIAL_MY_CAMPAIGNS;
    }
    return JSON.parse(raw);
  } catch (_e) {
    return INITIAL_MY_CAMPAIGNS;
  }
}

export function updateCampaignDraft(
  campaignId: string,
  draftUrl: string
): ActiveCollaborationItem[] {
  const current = getSavedMyCampaigns();
  const updated = current.map((c) => {
    if (c.id === campaignId) {
      const steps = [...c.steps];
      if (steps[1]) {
        steps[1].completed = true;
        steps[1].date = "Submitted today";
      }
      return {
        ...c,
        submittedDraftUrl: draftUrl,
        currentStep: 3,
        steps,
      };
    }
    return c;
  });
  try {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("cb_my_campaigns_updated"));
  } catch (_e) {}
  return updated;
}
