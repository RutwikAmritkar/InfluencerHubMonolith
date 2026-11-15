import { useState, useMemo, useEffect, memo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  BarChart3,
  Settings,
  Sparkles,
  LogOut,
  Bell,
  Menu,
  HelpCircle,
  FileCheck,
  ChevronDown,
  Compass,
  Search,
  User,
  Bookmark,
  Building2,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  FileText,
  Wallet,
} from "lucide-react";
import { Button } from "./ui/button";
import { useListNotifications } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Badge } from "./ui/badge";

// Memoized Role-Aware Sidebar Content Component
const SidebarContent = memo(
  ({
    location,
    role,
    userName,
    collapsed = false,
    onItemClick,
  }: {
    location: string;
    role?: string;
    userName?: string;
    collapsed?: boolean;
    onItemClick?: () => void;
  }) => {
    const isCreator = role === "influencer";

    const isItemActive = (href: string) => {
      if (href === "/dashboard") {
        return (
          location === "/dashboard" ||
          location === "/dashboard/brand" ||
          location === "/dashboard/influencer"
        );
      }
      if (href === "/find-creators") {
        return location === "/find-creators" || location.startsWith("/influencers");
      }
      if (href === "/campaigns") {
        return (
          location === "/campaigns" ||
          (location.startsWith("/campaigns/") && !location.startsWith("/campaigns/create"))
        );
      }
      if (href === "/brand/applications") {
        return location.startsWith("/brand/applications");
      }
      if (href === "/deals") {
        return location.startsWith("/deals") || location.startsWith("/requests");
      }
      if (href === "/payments") {
        return location.startsWith("/payments");
      }
      if (href === "/opportunities") {
        return location.startsWith("/opportunities");
      }
      if (href === "/applications") {
        return location === "/applications";
      }
      if (href === "/profile") {
        return location.startsWith("/profile");
      }
      if (href === "/settings") {
        return location.startsWith("/settings");
      }
      if (href === "/support") {
        return location.startsWith("/support");
      }
      if (href === "/analytics") {
        return location.startsWith("/analytics");
      }
      return location === href;
    };

    // ─── BRAND NAVIGATION: 8 MODULES ───────────────────────────────────────────
    // Dashboard, Campaigns, Creators, Applications, Deals, Payments, Analytics, Settings
    const brandGroups = [
      {
        header: "OVERVIEW",
        links: [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/campaigns", label: "Campaigns", icon: Megaphone },
          { href: "/find-creators", label: "Creators", icon: Search },
        ],
      },
      {
        header: "COMMERCIAL",
        links: [
          { href: "/brand/applications", label: "Applications", icon: FileCheck },
          { href: "/deals", label: "Deals", icon: FileText },
          { href: "/payments", label: "Payments", icon: Wallet },
        ],
      },
      {
        header: "MANAGEMENT",
        links: [
          { href: "/analytics", label: "Analytics", icon: BarChart3 },
          { href: "/settings", label: "Settings", icon: Settings },
        ],
      },
    ];

    // ─── CREATOR NAVIGATION: 8 MODULES ─────────────────────────────────────────
    // Dashboard, Opportunities, Applications, Deals, Payments, Profile, Settings, Support
    const creatorGroups = [
      {
        header: "DISCOVERY & FUNNEL",
        links: [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/opportunities", label: "Opportunities", icon: Compass },
          { href: "/applications", label: "Applications", icon: FileCheck, badge: "2" },
        ],
      },
      {
        header: "COMMERCIAL",
        links: [
          { href: "/deals", label: "Deals", icon: FileText },
          { href: "/payments", label: "Payments", icon: Wallet },
        ],
      },
      {
        header: "ACCOUNT",
        links: [
          { href: "/profile", label: "Profile", icon: User },
          { href: "/settings", label: "Settings", icon: Settings },
          { href: "/support", label: "Support", icon: ShieldAlert },
        ],
      },
    ];

    const activeGroups = isCreator ? creatorGroups : brandGroups;

    return (
      <div className="flex flex-col h-full py-3.5 antialiased font-sans space-y-4">
        {activeGroups.map((group) => (
          <div key={group.header}>
            {!collapsed && (
              <div className="px-4 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#52525B]/70 dark:text-slate-500">
                  {group.header}
                </span>
              </div>
            )}
            <nav className={cn("space-y-0.5", collapsed ? "px-2" : "px-3")}>
              {group.links.map((link) => {
                const isActive = isItemActive(link.href);
                return (
                  <Link key={link.href} href={link.href}>
                    <div
                      onClick={onItemClick}
                      title={collapsed ? link.label : undefined}
                      className={cn(
                        "relative flex items-center rounded-lg text-xs transition-colors cursor-pointer",
                        collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-2.5 px-3 py-2",
                        isActive
                          ? "bg-[#0A0A0A] text-white font-semibold shadow-xs"
                          : "text-[#52525B] dark:text-slate-400 font-medium hover:text-[#0A0A0A] dark:hover:text-white hover:bg-[#F2F1EC] dark:hover:bg-slate-800/60"
                      )}
                    >
                      <link.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-white" : "text-[#52525B]/70 dark:text-slate-500"
                        )}
                      />
                      {!collapsed && <span className="truncate flex-1">{link.label}</span>}
                      {!collapsed && (link as any).badge && (
                        <span
                          className={cn(
                            "ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-md font-tabular",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-blue-50 text-blue-700 border border-blue-200/60"
                          )}
                        >
                          {(link as any).badge}
                        </span>
                      )}
                      {collapsed && (link as any).badge && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#1D4ED8]" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    );
  }
);
SidebarContent.displayName = "SidebarContent";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { t, i18n } = useTranslation();

  // Responsive sidebar collapse: tablet/compact laptop (768 - 1279px) starts collapsed
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth >= 768 && window.innerWidth < 1280) {
          setSidebarCollapsed(true);
        } else if (window.innerWidth >= 1280) {
          setSidebarCollapsed(false);
        }
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { data: notifications } = useListNotifications({
    query: {
      enabled: !!user,
    } as any,
  });

  const unreadCount = useMemo(() => {
    return Array.isArray(notifications) ? notifications.filter((n) => !n.isRead).length : 0;
  }, [notifications]);

  const isCreator = user?.role === "influencer";

  const currentLangLabel =
    i18n.language === "hi" ? "हिन्दी" : i18n.language === "mr" ? "मराठी" : "English";

  const breadcrumbSection = useMemo(() => {
    if (location.startsWith("/dashboard"))
      return isCreator ? "Creator Workspace" : "Brand Workspace";
    if (location.startsWith("/find-creators") || location.startsWith("/influencers"))
      return "Creator Directory";
    if (location.startsWith("/campaigns")) return "Campaign Pipeline";
    if (location.startsWith("/opportunities")) return "Opportunities";
    if (location.startsWith("/brand/applications")) return "Application Review";
    if (location.startsWith("/applications")) return "Deal Applications";
    if (location.startsWith("/deals") || location.startsWith("/requests"))
      return "Commercial Deals";
    if (location.startsWith("/payments")) return "Payment Ledger";
    if (location.startsWith("/messages")) return "Direct Messaging";
    if (location.startsWith("/analytics")) return "Performance Analytics";
    if (location.startsWith("/ai-assistant")) return "AI Assistant";
    if (location.startsWith("/saved-creators")) return "Saved Roster";
    if (location.startsWith("/brand-profile")) return "Brand Media Kit";
    if (location.startsWith("/profile")) return "Creator Profile";
    if (location.startsWith("/settings")) return "Settings";
    if (location.startsWith("/support") || location.startsWith("/disputes"))
      return "Support & Disputes";
    return "Workspace";
  }, [location, isCreator]);

  const bottomNavLinks = useMemo(() => {
    if (isCreator) {
      return [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/opportunities", label: "Opportunities", icon: Compass },
        { href: "/applications", label: "Applications", icon: FileCheck, badge: "2" },
        { href: "/deals", label: "Deals", icon: FileText },
        { href: "/payments", label: "Payments", icon: Wallet },
      ];
    }
    return [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/brand/applications", label: "Applications", icon: FileCheck },
      { href: "/deals", label: "Deals", icon: FileText },
      { href: "/payments", label: "Payments", icon: Wallet },
    ];
  }, [isCreator]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-[#FAF9F6] flex flex-col font-sans selection:bg-[#1D4ED8] selection:text-white pb-16 md:pb-0 transition-colors antialiased">
      {/* ─── 1. TOP UTILITY & NAVIGATION BAR ────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-[#FAF9F6]/90 dark:bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#E5E4DF] dark:border-white/10 transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Left: CB Wordmark + Breadcrumb Context */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#52525B] dark:text-slate-400 -ml-1"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="p-0 w-72 bg-[#FAF9F6] dark:bg-[#0A0A0A] border-r border-[#E5E4DF] dark:border-white/10"
                >
                  <div className="flex items-center p-5 border-b border-[#E5E4DF] dark:border-white/10">
                    <div className="h-7 w-7 rounded-md bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs tracking-tighter shadow-xs mr-2.5">
                      CB
                    </div>
                    <span className="text-base font-bold tracking-tight text-[#0A0A0A] dark:text-white">
                      Creators
                      <span className="font-serif italic font-normal text-[#1D4ED8] ml-0.5">
                        Brand
                      </span>
                    </span>
                  </div>
                  <ScrollArea className="h-[calc(100vh-70px)]">
                    <SidebarContent
                      location={location}
                      role={user?.role}
                      userName={user?.name}
                      onItemClick={() => setIsMobileMenuOpen(false)}
                    />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>

            <Link href="/dashboard">
              <div className="inline-flex items-center gap-2 cursor-pointer group">
                <div className="h-7 w-7 rounded-md bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs tracking-tighter shadow-xs group-hover:bg-[#1D4ED8] transition-colors">
                  CB
                </div>
                <span className="text-base font-bold tracking-tight text-[#0A0A0A] dark:text-white">
                  Creators
                  <span className="font-serif italic font-normal text-[#1D4ED8] ml-0.5">Brand</span>
                </span>
              </div>
            </Link>

            {/* Editorial Breadcrumb Separator */}
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#52525B] dark:text-slate-400 pl-3 border-l border-[#E5E4DF] dark:border-white/10">
              <span className="text-[#52525B]/60">/</span>
              <span className="font-semibold text-[#0A0A0A] dark:text-white">
                {breadcrumbSection}
              </span>
            </div>
          </div>

          {/* Center/Left: Compact Search Bar */}
          <div className="hidden sm:flex items-center max-w-sm w-full relative mx-4">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3" />
            <input
              type="text"
              placeholder={t("campaigns.searchPlaceholder")}
              className="w-full h-8 pl-8 pr-3 bg-white dark:bg-slate-900 border border-[#E5E4DF] dark:border-white/10 focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] rounded-lg text-xs text-[#0A0A0A] dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          {/* Right: Role Switcher Indicator, Language, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Badge Indicator */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F2F1EC] dark:bg-slate-800 text-[#0A0A0A] dark:text-white border border-[#E5E4DF] dark:border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
              {isCreator ? "Creator View" : "Brand View"}
            </div>

            <button
              type="button"
              className="relative p-1.5 rounded-lg text-[#52525B] dark:text-slate-400 hover:text-[#0A0A0A] dark:hover:text-white hover:bg-[#F2F1EC] dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={t("notifications.title")}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#1D4ED8]" />
              )}
            </button>

            {/* Header Language Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E5E4DF] dark:border-white/10 hover:border-slate-400 bg-white dark:bg-slate-900 text-xs font-semibold text-[#0A0A0A] dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
                  title={t("settings.appLanguage")}
                >
                  <Globe className="h-3.5 w-3.5 text-[#1D4ED8]" />
                  <span className="hidden xs:inline">{currentLangLabel}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 rounded-xl p-1.5 glass-dropdown">
                <DropdownMenuItem
                  onClick={() => i18n.changeLanguage("en")}
                  className="rounded-lg text-xs font-semibold cursor-pointer py-2 px-3 flex items-center justify-between"
                >
                  <span>English</span>
                  {i18n.language === "en" && <span className="text-[#1D4ED8] font-bold">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => i18n.changeLanguage("hi")}
                  className="rounded-lg text-xs font-semibold cursor-pointer py-2 px-3 flex items-center justify-between"
                >
                  <span>हिन्दी</span>
                  {i18n.language === "hi" && <span className="text-[#1D4ED8] font-bold">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => i18n.changeLanguage("mr")}
                  className="rounded-lg text-xs font-semibold cursor-pointer py-2 px-3 flex items-center justify-between"
                >
                  <span>मराठी</span>
                  {i18n.language === "mr" && <span className="text-[#1D4ED8] font-bold">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-3.5 w-px bg-[#E5E4DF] dark:bg-slate-800 mx-0.5 hidden sm:block" />

            {/* User Avatar Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 p-1 sm:p-1 sm:pl-2 rounded-lg border border-[#E5E4DF] dark:border-white/10 hover:border-slate-400 bg-white dark:bg-slate-900 hover:bg-[#F2F1EC] dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                >
                  <Avatar className="h-6 w-6 border border-[#E5E4DF] dark:border-slate-700">
                    <AvatarImage
                      src={
                        user?.avatarUrl && user.avatarUrl.trim() !== "" ? user.avatarUrl : undefined
                      }
                    />
                    <AvatarFallback className="bg-[#0A0A0A] text-white font-semibold text-xs">
                      {user?.name?.charAt(0) || "D"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-[#0A0A0A] dark:text-slate-200 max-w-[80px] sm:max-w-[110px] truncate hidden xs:inline">
                    {user?.name || "Demo User"}
                  </span>
                  <span className="text-xs font-medium uppercase px-1.5 py-0.5 bg-[#F2F1EC] dark:bg-slate-800 text-[#52525B] dark:text-slate-400 rounded shrink-0 hidden sm:inline-flex">
                    {user?.role === "influencer" ? "CREATOR" : "BRAND"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 mr-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 glass-dropdown">
                <DropdownMenuLabel className="font-normal text-xs p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="font-bold text-[#0A0A0A] dark:text-slate-100">{user?.name}</p>
                    <p className="text-xs text-[#52525B] dark:text-slate-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#E5E4DF] dark:bg-slate-800" />
                {isCreator ? (
                  <Link href="/profile">
                    <DropdownMenuItem className="rounded-xl text-xs font-medium cursor-pointer py-2 px-3">
                      <User className="mr-2 h-4 w-4 text-slate-400" />
                      {t("navigation.profile")}
                    </DropdownMenuItem>
                  </Link>
                ) : (
                  <Link href="/brand-profile">
                    <DropdownMenuItem className="rounded-xl text-xs font-medium cursor-pointer py-2 px-3">
                      <Building2 className="mr-2 h-4 w-4 text-slate-400" />
                      {t("navigation.brandProfile")}
                    </DropdownMenuItem>
                  </Link>
                )}
                <Link href="/settings">
                  <DropdownMenuItem className="rounded-xl text-xs font-medium cursor-pointer py-2 px-3">
                    <Settings className="mr-2 h-4 w-4 text-slate-400" />
                    {t("navigation.settings")}
                  </DropdownMenuItem>
                </Link>
                <Link href="/support">
                  <DropdownMenuItem className="rounded-xl text-xs font-medium cursor-pointer py-2 px-3">
                    <ShieldAlert className="mr-2 h-4 w-4 text-slate-400" />
                    Support &amp; Disputes
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  onClick={logout}
                  className="rounded-xl text-xs font-medium text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer py-2 px-3"
                >
                  <LogOut className="mr-2 h-4 w-4 text-red-500" />
                  {t("navigation.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ─── 2. MAIN LAYOUT WITH ADAPTIVE EDITORIAL RAIL & WORKSPACE CONTENT ────────────── */}
      <div className="flex-1 flex w-full min-h-0">
        {/* EDITORIAL WORKSPACE RAIL: Collapsible w-[72px] on tablet/compact, w-60 on desktop */}
        <aside
          className={cn(
            "border-r border-[#E5E4DF] dark:border-white/10 bg-[#FAF9F6] dark:bg-[#0A0A0A] shrink-0 hidden md:flex flex-col transition-all duration-200 select-none",
            sidebarCollapsed ? "w-[72px]" : "w-60"
          )}
        >
          {/* Rail Header / Collapse Trigger */}
          <div
            className={cn(
              "h-11 flex items-center border-b border-[#E5E4DF] dark:border-white/10 px-3 shrink-0",
              sidebarCollapsed ? "justify-center" : "justify-between"
            )}
          >
            {!sidebarCollapsed && (
              <span className="text-[11px] font-bold tracking-widest uppercase text-[#52525B]/70 dark:text-slate-400">
                Workspace Rail
              </span>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded-md text-[#52525B] dark:text-slate-400 hover:text-[#0A0A0A] dark:hover:text-white hover:bg-[#F2F1EC] dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={sidebarCollapsed ? "Expand sidebar (w-60)" : "Collapse sidebar (w-72px)"}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <SidebarContent
              location={location}
              role={user?.role}
              userName={user?.name}
              collapsed={sidebarCollapsed}
            />
          </div>
        </aside>

        {/* Fluid Workspace Main Viewport: Uncapped & consuming 100% of remaining width */}
        <main className="flex-1 min-w-0 w-full overflow-x-hidden">{children}</main>
      </div>

      {/* ─── 3. MOBILE BOTTOM NAVIGATION BAR ───────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F6]/95 dark:bg-[#0A0A0A]/95 border-t border-[#E5E4DF] dark:border-white/10 backdrop-blur-xl px-3 py-1.5 flex items-center justify-around shadow-lg">
        {bottomNavLinks.map((link) => {
          const isActive =
            location === link.href ||
            (link.href === "/dashboard" &&
              (location === "/dashboard/brand" || location === "/dashboard/influencer")) ||
            (link.href === "/find-creators" && location === "/influencers");

          return (
            <Link key={link.href} href={link.href}>
              <div className="flex flex-col items-center gap-0.5 py-1 px-2 cursor-pointer">
                <div className="relative">
                  <link.icon
                    className={cn(
                      "h-4 w-4",
                      isActive
                        ? "text-[#1D4ED8] font-semibold"
                        : "text-[#52525B] dark:text-slate-400"
                    )}
                  />
                  {"badge" in link && Boolean(link.badge) && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-[#1D4ED8] text-white text-[11px] font-bold flex items-center justify-center font-tabular shadow-2xs">
                      {link.badge}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] truncate max-w-[70px]",
                    isActive ? "font-semibold text-[#1D4ED8]" : "text-[#52525B] dark:text-slate-400"
                  )}
                >
                  {link.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
