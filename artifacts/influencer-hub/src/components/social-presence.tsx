import { memo } from "react";
import { Link } from "wouter";
import { ArrowRight, ExternalLink, Plus, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SocialIcon, SocialPlatformId } from "@/components/social-icons";
import { cn } from "@/lib/utils";

export interface SocialAccountData {
  platform: SocialPlatformId;
  name: string;
  handle: string;
  followers: number | string;
  engagementRate: number | string;
  status: "VERIFIED" | "CONNECTED" | "UNCONNECTED";
  profileUrl?: string;
}

// 6 Core Platforms Configuration with Subtle Visual Identity Specs
const PLATFORM_THEMES: Record<
  SocialPlatformId,
  {
    name: string;
    iconBg: string;
    textAccent: string;
    hoverBorder: string;
    glowEffect: string;
    badgeColor: string;
  }
> = {
  instagram: {
    name: "Instagram",
    iconBg: "bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white shadow-sm",
    textAccent: "group-hover:text-pink-500 dark:group-hover:text-pink-400",
    hoverBorder: "hover:border-pink-500/40 dark:hover:border-pink-500/50",
    glowEffect: "group-hover:shadow-[0_0_25px_-5px_rgba(219,39,119,0.25)]",
    badgeColor: "bg-pink-50 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border-pink-200/80 dark:border-pink-800/80",
  },
  tiktok: {
    name: "TikTok",
    iconBg: "bg-slate-950 dark:bg-slate-900 border border-slate-800 text-white shadow-sm",
    textAccent: "group-hover:text-cyan-500 dark:group-hover:text-cyan-400",
    hoverBorder: "hover:border-cyan-400/40 dark:hover:border-cyan-400/50",
    glowEffect: "group-hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.25)]",
    badgeColor: "bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/80",
  },
  youtube: {
    name: "YouTube",
    iconBg: "bg-red-600 text-white shadow-sm",
    textAccent: "group-hover:text-red-600 dark:group-hover:text-red-400",
    hoverBorder: "hover:border-red-500/40 dark:hover:border-red-500/50",
    glowEffect: "group-hover:shadow-[0_0_25px_-5px_rgba(220,38,38,0.25)]",
    badgeColor: "bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-200/80 dark:border-red-800/80",
  },
  facebook: {
    name: "Facebook",
    iconBg: "bg-blue-600 text-white shadow-sm",
    textAccent: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
    hoverBorder: "hover:border-blue-500/40 dark:hover:border-blue-500/50",
    glowEffect: "group-hover:shadow-[0_0_25px_-5px_rgba(37,99,235,0.25)]",
    badgeColor: "bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80",
  },
  x: {
    name: "X (Twitter)",
    iconBg: "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm",
    textAccent: "group-hover:text-slate-900 dark:group-hover:text-slate-100",
    hoverBorder: "hover:border-slate-400/40 dark:hover:border-slate-500/50",
    glowEffect: "group-hover:shadow-[0_0_25px_-5px_rgba(148,163,184,0.2)]",
    badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
  },
  twitch: {
    name: "Twitch",
    iconBg: "bg-purple-600 text-white shadow-sm",
    textAccent: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
    hoverBorder: "hover:border-purple-500/40 dark:hover:border-purple-500/50",
    glowEffect: "group-hover:shadow-[0_0_25px_-5px_rgba(147,51,234,0.25)]",
    badgeColor: "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/80",
  },
  linkedin: {
    name: "LinkedIn",
    iconBg: "bg-sky-700 text-white shadow-sm",
    textAccent: "group-hover:text-sky-600",
    hoverBorder: "hover:border-sky-500/40",
    glowEffect: "group-hover:shadow-[0_0_25px_-5px_rgba(3,105,161,0.25)]",
    badgeColor: "bg-sky-50 dark:bg-sky-950/80 text-sky-700 border-sky-200",
  },
  snapchat: {
    name: "Snapchat",
    iconBg: "bg-amber-400 text-slate-900 shadow-sm",
    textAccent: "group-hover:text-amber-500",
    hoverBorder: "hover:border-amber-400/40",
    glowEffect: "group-hover:shadow-[0_0_25px_-5px_rgba(251,191,36,0.25)]",
    badgeColor: "bg-amber-50 dark:bg-amber-950/80 text-amber-700 border-amber-200",
  },
  pinterest: {
    name: "Pinterest",
    iconBg: "bg-red-700 text-white shadow-sm",
    textAccent: "group-hover:text-rose-600",
    hoverBorder: "hover:border-rose-500/40",
    glowEffect: "group-hover:shadow-[0_0_25px_-5px_rgba(225,29,72,0.25)]",
    badgeColor: "bg-rose-50 dark:bg-rose-950/80 text-rose-700 border-rose-200",
  },
  other: {
    name: "Other",
    iconBg: "bg-slate-700 text-white shadow-sm",
    textAccent: "group-hover:text-slate-600",
    hoverBorder: "hover:border-slate-500/40",
    glowEffect: "group-hover:shadow-[0_0_25px_-5px_rgba(100,116,139,0.25)]",
    badgeColor: "bg-slate-50 dark:bg-slate-800 text-slate-700 border-slate-200",
  },
};

// Default Accounts Roster representing Connected & Unconnected platforms
const defaultAccounts: SocialAccountData[] = [
  {
    platform: "instagram",
    name: "Instagram",
    handle: "@alexrivera",
    followers: "125.0K",
    engagementRate: "4.8%",
    status: "VERIFIED",
    profileUrl: "https://instagram.com/alexrivera",
  },
  {
    platform: "tiktok",
    name: "TikTok",
    handle: "@alexrivera.official",
    followers: "86.4K",
    engagementRate: "6.2%",
    status: "VERIFIED",
    profileUrl: "https://tiktok.com/@alexrivera.official",
  },
  {
    platform: "youtube",
    name: "YouTube",
    handle: "@alexriveravlogs",
    followers: "32.1K",
    engagementRate: "8.5%",
    status: "CONNECTED",
    profileUrl: "https://youtube.com/c/alexriveravlogs",
  },
  {
    platform: "facebook",
    name: "Facebook",
    handle: "Unconnected",
    followers: "-",
    engagementRate: "-",
    status: "UNCONNECTED",
  },
  {
    platform: "x",
    name: "X (Twitter)",
    handle: "Unconnected",
    followers: "-",
    engagementRate: "-",
    status: "UNCONNECTED",
  },
  {
    platform: "twitch",
    name: "Twitch",
    handle: "Unconnected",
    followers: "-",
    engagementRate: "-",
    status: "UNCONNECTED",
  },
];

export const SocialPresenceSection = memo(({ accounts }: { accounts?: SocialAccountData[] }) => {
  const socialList = accounts && accounts.length > 0 ? accounts : defaultAccounts;

  return (
    <div className="rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs space-y-5 text-slate-900 dark:text-slate-100 w-full">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-[#11182F] dark:text-slate-100 tracking-tight">
              Your Social Presence
            </h3>
            <Badge className="bg-blue-50 dark:bg-blue-950/80 text-[#315BEF] dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60 text-[10px] font-bold">
              Real-time Metrics
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Connected platforms, verified follower counts, and engagement rate performance.
          </p>
        </div>

        <Link href="/settings">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3.5 border-slate-200 dark:border-slate-700 text-xs font-bold text-[#315BEF] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl cursor-pointer transition-all shadow-xs"
          >
            Manage Accounts <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>

      {/* Responsive Grid Layout (Desktop: 3 columns | Tablet: 2 columns | Mobile: 1 column) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {socialList.map((acc) => {
          const theme = PLATFORM_THEMES[acc.platform] || PLATFORM_THEMES.other;
          const isConnected = acc.status === "VERIFIED" || acc.status === "CONNECTED";

          if (isConnected) {
            return (
              <div
                key={acc.platform}
                className={cn(
                  "group relative rounded-2xl p-4.5 bg-white dark:bg-[#0D1220] border border-slate-200/90 dark:border-slate-800/90",
                  "shadow-xs hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between space-y-4",
                  theme.hoverBorder,
                  theme.glowEffect
                )}
              >
                {/* Subtle Ambient Radial Glow in Top Right */}
                <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br from-current to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl pointer-events-none" />

                {/* Card Header: Platform Icon + Name + Verification Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0",
                        theme.iconBg
                      )}
                    >
                      <SocialIcon platform={acc.platform} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={cn("font-extrabold text-sm sm:text-base text-[#11182F] dark:text-slate-100 transition-colors", theme.textAccent)}>
                        {theme.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium truncate max-w-[140px]">
                        {acc.handle}
                      </p>
                    </div>
                  </div>

                  <Badge
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs shrink-0",
                      acc.status === "VERIFIED"
                        ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80"
                        : theme.badgeColor
                    )}
                  >
                    {acc.status === "VERIFIED" ? "✓ Verified" : "✓ Connected"}
                  </Badge>
                </div>

                {/* Card Body: Prominent Metrics Grid (Followers & Engagement) */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono block">
                      Followers
                    </span>
                    <span className="text-base sm:text-lg font-black text-[#11182F] dark:text-slate-100 font-mono block mt-0.5">
                      {acc.followers}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono block">
                      Engagement
                    </span>
                    <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                      {acc.engagementRate}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Action Link */}
                <div className="flex items-center justify-between pt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                  </span>

                  {acc.profileUrl ? (
                    <a
                      href={acc.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-1 font-bold text-xs text-slate-700 dark:text-slate-300 hover:text-[#315BEF] dark:hover:text-blue-400 transition-colors group/link"
                      )}
                    >
                      View Profile
                      <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                    </a>
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px]">Active</span>
                  )}
                </div>
              </div>
            );
          }

          // Unconnected Subdued Card State
          return (
            <Link key={acc.platform} href="/settings">
              <div
                className={cn(
                  "group relative rounded-2xl p-4.5 bg-slate-50/50 dark:bg-slate-900/40 border border-dashed border-slate-200/90 dark:border-slate-800/90",
                  "hover:bg-white dark:hover:bg-[#0D1220] hover:border-solid hover:border-slate-300 dark:hover:border-slate-700",
                  "shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 opacity-75 hover:opacity-100"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <SocialIcon platform={acc.platform} className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                        {theme.name}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">Not Connected</p>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[10px] font-semibold text-slate-400 border-slate-200 dark:border-slate-700">
                    Optional
                  </Badge>
                </div>

                <div className="py-2.5 px-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 text-center">
                  <span className="text-xs font-bold text-[#315BEF] dark:text-blue-400 inline-flex items-center gap-1 group-hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Connect {theme.name}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
});
SocialPresenceSection.displayName = "SocialPresenceSection";
