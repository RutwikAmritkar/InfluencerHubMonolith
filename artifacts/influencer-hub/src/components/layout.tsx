import { useState, useMemo, memo } from "react";
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
  Building2
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
const SidebarContent = memo(({ location, role, onItemClick }: { location: string; role?: string; onItemClick?: () => void }) => {
  const { t } = useTranslation();
  const isCreator = role === "influencer";

  if (!isCreator) {
    const brandGroups = [
      {
        header: "OVERVIEW",
        links: [{ href: "/dashboard", label: t('navigation.dashboard'), icon: LayoutDashboard }]
      },
      {
        header: "DISCOVER",
        links: [
          { href: "/find-creators", label: t('navigation.findCreators'), icon: Search },
          { href: "/saved-creators", label: t('navigation.savedCreators'), icon: Bookmark },
        ]
      },
      {
        header: "CAMPAIGNS",
        links: [
          { href: "/campaigns", label: t('navigation.campaigns'), icon: Megaphone },
        ]
      },
      {
        header: "COMMUNICATION",
        links: [
          { href: "/messages", label: t('navigation.messages'), icon: MessageSquare },
        ]
      },
      {
        header: "INSIGHTS",
        links: [
          { href: "/analytics", label: t('navigation.analytics'), icon: BarChart3 },
          { href: "/ai-assistant", label: t('navigation.aiAssistant'), icon: Sparkles },
        ]
      },
      {
        header: "BRAND",
        links: [
          { href: "/brand-profile", label: t('navigation.brandProfile'), icon: Building2 },
          { href: "/settings", label: t('navigation.settings'), icon: Settings },
        ]
      }
    ];

    return (
      <div className="flex flex-col h-full py-3.5 antialiased font-sans space-y-4">
        {brandGroups.map((group) => (
          <div key={group.header}>
            <div className="px-4 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500 font-mono">
                {group.header}
              </span>
            </div>
            <nav className="space-y-0.5 px-3">
              {group.links.map((link) => {
                const isActive =
                  location === link.href ||
                  (link.href === "/dashboard" &&
                    (location === "/dashboard/brand" || location === "/dashboard/influencer")) ||
                  (link.href === "/find-creators" && location === "/influencers");

                return (
                  <Link key={link.href} href={link.href}>
                    <div
                      onClick={onItemClick}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all cursor-pointer",
                        isActive
                          ? "bg-[#EEF3FF] dark:bg-blue-950/50 text-[#315BEF] dark:text-blue-400 font-bold shadow-2xs border-l-4 border-l-[#315BEF] pl-2.5"
                          : "text-[#64748B] dark:text-slate-400 font-medium hover:text-[#0F172A] dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/80"
                      )}
                    >
                      <link.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-[#315CF5] dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                        )}
                      />
                      <span className="truncate">{link.label}</span>
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

  const creatorOverviewLinks = [
    { href: "/dashboard", label: t('navigation.dashboard'), icon: LayoutDashboard },
    { href: "/opportunities", label: t('navigation.opportunities'), icon: Compass },
    { href: "/my-campaigns", label: t('navigation.myCampaigns'), icon: Megaphone },
    { href: "/applications", label: t('navigation.applications'), icon: FileCheck },
    { href: "/messages", label: t('navigation.messages'), icon: MessageSquare },
  ];

  const creatorInsightsLinks = [
    { href: "/analytics", label: t('navigation.analytics'), icon: BarChart3 },
    { href: "/ai-assistant", label: t('navigation.aiAssistant'), icon: Sparkles },
  ];

  const creatorProfileLinks = [
    { href: "/profile", label: t('navigation.profile'), icon: User },
    { href: "/settings", label: t('navigation.settings'), icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full py-3.5 antialiased font-sans space-y-4">
      {/* OVERVIEW GROUP */}
      <div>
        <div className="px-4 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500 font-mono">
            OVERVIEW
          </span>
        </div>
        <nav className="space-y-0.5 px-3">
          {creatorOverviewLinks.map((link) => {
            const isActive =
              location === link.href ||
              (link.href === "/dashboard" &&
                (location === "/dashboard/brand" || location === "/dashboard/influencer")) ||
              (link.href === "/opportunities" && location === "/campaigns");

            return (
              <Link key={link.href} href={link.href}>
                <div
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all cursor-pointer",
                    isActive
                      ? "bg-[#F2F5FF] dark:bg-blue-950/50 text-[#315CF5] dark:text-blue-400 font-bold shadow-2xs border-l-4 border-l-[#315CF5] pl-2.5"
                      : "text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                  )}
                >
                  <link.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-[#315CF5] dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                    )}
                  />
                  <span className="truncate">{link.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* INSIGHTS GROUP */}
      <div>
        <div className="px-4 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500 font-mono">
            INSIGHTS
          </span>
        </div>
        <nav className="space-y-0.5 px-3">
          {creatorInsightsLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <div
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all cursor-pointer",
                    isActive
                      ? "bg-[#F2F5FF] dark:bg-blue-950/50 text-[#315CF5] dark:text-blue-400 font-bold shadow-2xs border-l-4 border-l-[#315CF5] pl-2.5"
                      : "text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                  )}
                >
                  <link.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-[#315CF5] dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                    )}
                  />
                  <span className="truncate">{link.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* PROFILE GROUP */}
      <div>
        <div className="px-4 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500 font-mono">
            PROFILE
          </span>
        </div>
        <nav className="space-y-0.5 px-3">
          {creatorProfileLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <div
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all cursor-pointer",
                    isActive
                      ? "bg-[#F2F5FF] dark:bg-blue-950/50 text-[#315CF5] dark:text-blue-400 font-bold shadow-2xs border-l-4 border-l-[#315CF5] pl-2.5"
                      : "text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                  )}
                >
                  <link.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-[#315CF5] dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                    )}
                  />
                  <span className="truncate">{link.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
});
SidebarContent.displayName = "SidebarContent";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  
  const { data: notifications } = useListNotifications({
    query: {
      enabled: !!user
    } as any
  });

  const unreadCount = useMemo(() => {
    return Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;
  }, [notifications]);

  const isCreator = user?.role === "influencer";

  const bottomNavLinks = useMemo(() => {
    if (isCreator) {
      return [
        { href: "/dashboard", label: t('navigation.home'), icon: LayoutDashboard },
        { href: "/opportunities", label: t('navigation.opportunities'), icon: Compass },
        { href: "/my-campaigns", label: t('navigation.myCampaigns'), icon: Megaphone },
        { href: "/applications", label: t('navigation.applications'), icon: FileCheck },
        { href: "/messages", label: t('navigation.messages'), icon: MessageSquare },
      ];
    }
    return [
      { href: "/dashboard", label: t('navigation.home'), icon: LayoutDashboard },
      { href: "/find-creators", label: t('navigation.findCreators'), icon: Search },
      { href: "/campaigns", label: t('navigation.campaigns'), icon: Megaphone },
      { href: "/messages", label: t('navigation.messages'), icon: MessageSquare },
      { href: "/brand-profile", label: t('navigation.brandProfile'), icon: Building2 },
    ];
  }, [isCreator, t]);

  return (
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-[#0B0F19] text-[#0F172A] dark:text-slate-100 flex flex-col font-sans selection:bg-[#315BEF] selection:text-white pb-16 md:pb-0 transition-colors antialiased">
      
      {/* ─── 1. TOP NAVIGATION BAR ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#11172A] border-b border-[#E2E8F0] dark:border-slate-800/80 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          
          {/* Left: Brand Logo + Mobile Drawer Trigger */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748B] dark:text-slate-400 -ml-1">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 bg-white dark:bg-[#11172A] border-r border-[#E2E8F0] dark:border-slate-800">
                  <div className="flex items-center p-5 border-b border-[#E2E8F0] dark:border-slate-800">
                    <div className="h-8 w-8 bg-[#315BEF] rounded-xl flex items-center justify-center text-white font-black text-base shadow-md mr-2.5">
                      I
                    </div>
                    <span className="text-lg font-bold tracking-tight text-[#0F172A] dark:text-slate-100">
                      Influencer<span className="text-[#315BEF] dark:text-blue-400">Hub</span>
                    </span>
                  </div>
                  <ScrollArea className="h-[calc(100vh-70px)]">
                    <SidebarContent location={location} role={user?.role} onItemClick={() => setIsMobileMenuOpen(false)} />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>

            <Link href="/dashboard">
              <div className="inline-flex items-center gap-2 cursor-pointer group">
                <div className="h-8 w-8 bg-gradient-to-br from-[#315BEF] via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform duration-300">
                  I
                </div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-[#0F172A] dark:text-slate-100">
                  Influencer<span className="text-[#315BEF] dark:text-blue-400">Hub</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Center/Left: Compact Search Bar */}
          <div className="hidden sm:flex items-center max-w-sm w-full relative mx-4">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] dark:text-slate-500 absolute left-3" />
            <input
              type="text"
              placeholder={t('campaigns.searchPlaceholder')}
              className="w-full h-8 pl-8 pr-3 bg-[#F6F8FC] dark:bg-slate-800/80 hover:bg-[#EEF3FF] dark:hover:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 focus:border-[#315BEF] dark:focus:border-blue-400 rounded-full text-xs text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] outline-none transition-all"
            />
          </div>

          {/* Right: Notifications, Help, User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              className="relative p-1.5 rounded-full text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={t('notifications.title')}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#315BEF] animate-pulse" />
              )}
            </button>

            <button
              type="button"
              className="p-1.5 rounded-full text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer hidden sm:block"
              title={t('settings.help')}
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            <div className="h-3.5 w-px bg-[#E2E8F0] dark:bg-slate-800 mx-0.5 hidden sm:block" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 p-1 sm:p-1 sm:pl-2 rounded-full border border-[#E2E8F0] dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#11172A] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
                >
                  <Avatar className="h-6.5 w-6.5 border border-[#E2E8F0] dark:border-slate-700">
                    <AvatarImage src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"} />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-950 text-[#315BEF] dark:text-blue-300 font-bold text-xs">
                      {user?.name?.charAt(0) || "D"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-bold text-[#0F172A] dark:text-slate-200 max-w-[80px] sm:max-w-[110px] truncate hidden xs:inline">
                    {user?.name || "Demo User"}
                  </span>
                  <Badge variant="secondary" className="text-[9px] font-extrabold uppercase px-1.5 py-0 h-4 bg-blue-50 dark:bg-blue-950 text-[#315BEF] dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shrink-0 hidden sm:inline-flex">
                    {user?.role === "influencer" ? "CREATOR" : "BRAND"}
                  </Badge>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 mr-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl bg-white dark:bg-[#11172A] border-[#E2E8F0] dark:border-slate-800">
                <DropdownMenuLabel className="font-normal text-xs p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="font-bold text-[#0F172A] dark:text-slate-100">{user?.name}</p>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#E2E8F0] dark:bg-slate-800" />
                {isCreator ? (
                  <Link href="/profile">
                    <DropdownMenuItem className="rounded-xl text-xs font-medium cursor-pointer py-2 px-3">
                      <User className="mr-2 h-4 w-4 text-slate-400" />
                      {t('navigation.profile')}
                    </DropdownMenuItem>
                  </Link>
                ) : (
                  <Link href="/brand-profile">
                    <DropdownMenuItem className="rounded-xl text-xs font-medium cursor-pointer py-2 px-3">
                      <Building2 className="mr-2 h-4 w-4 text-slate-400" />
                      {t('navigation.brandProfile')}
                    </DropdownMenuItem>
                  </Link>
                )}
                <Link href="/settings">
                  <DropdownMenuItem className="rounded-xl text-xs font-medium cursor-pointer py-2 px-3">
                    <Settings className="mr-2 h-4 w-4 text-slate-400" />
                    {t('navigation.settings')}
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={logout} className="rounded-xl text-xs font-medium text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer py-2 px-3">
                  <LogOut className="mr-2 h-4 w-4 text-red-500" />
                  {t('navigation.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>

      {/* ─── 2. MAIN LAYOUT WITH COMPACT SIDEBAR & WORKSPACE CONTENT ────────────── */}
      <div className="flex-1 flex w-full">
        
        {/* SIDEBAR PANEL */}
        <aside className="w-60 border-r border-[#E2E8F0] dark:border-slate-800/80 bg-[#F1F4F9] dark:bg-[#11172A]/60 shrink-0 hidden md:block overflow-y-auto">
          <SidebarContent location={location} role={user?.role} />
        </aside>

        {/* Fluid Workspace Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* ─── 3. MOBILE BOTTOM NAVIGATION BAR ───────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#11172A]/95 border-t border-slate-200/90 dark:border-slate-800/90 backdrop-blur-md px-3 py-1.5 flex items-center justify-around shadow-lg">
        {bottomNavLinks.map((link) => {
          const isActive =
            location === link.href ||
            (link.href === "/dashboard" &&
              (location === "/dashboard/brand" || location === "/dashboard/influencer")) ||
            (link.href === "/find-creators" && location === "/influencers");

          return (
            <Link key={link.href} href={link.href}>
              <div className="flex flex-col items-center gap-0.5 py-1 px-2 cursor-pointer">
                <link.icon className={cn("h-4 w-4", isActive ? "text-[#315CF5] dark:text-blue-400 font-bold" : "text-slate-400 dark:text-slate-500")} />
                <span className={cn("text-[10px] truncate max-w-[64px]", isActive ? "font-bold text-[#315CF5] dark:text-blue-400" : "text-slate-500 dark:text-slate-400")}>
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
