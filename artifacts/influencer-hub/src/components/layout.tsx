import { useState, useMemo, memo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { 
  LayoutDashboard, 
  Users, 
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

// Static Navigation Definitions (Outside Component to prevent re-creation)
const OVERVIEW_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/influencers", label: "Discover", icon: Compass },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/applications", label: "Applications", icon: FileCheck },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const INTELLIGENCE_LINKS = [
  { href: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
];

const ACCOUNT_LINKS = [
  { href: "/settings", label: "Settings", icon: Settings },
];

const BOTTOM_NAV_LINKS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/influencers", label: "Discover", icon: Compass },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Memoized Sidebar Content Component
const SidebarContent = memo(({ location, onItemClick }: { location: string; onItemClick?: () => void }) => (
  <div className="flex flex-col h-full py-3.5 antialiased font-sans">
    {/* OVERVIEW GROUP */}
    <div className="px-4 mb-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500 font-mono">OVERVIEW</span>
    </div>
    <nav className="space-y-0.5 px-3">
      {OVERVIEW_LINKS.map((link) => {
        const isActive = location === link.href || (link.href === "/dashboard" && (location === "/dashboard/brand" || location === "/dashboard/influencer"));
        return (
          <Link key={link.href} href={link.href}>
            <div
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all cursor-pointer",
                isActive
                  ? "bg-blue-50/90 dark:bg-blue-950/50 text-[#315BEF] dark:text-blue-400 font-semibold shadow-2xs border-l-3 border-[#315BEF] pl-2.5"
                  : "text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
              )}
            >
              <link.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#315BEF] dark:text-blue-400" : "text-slate-400 dark:text-slate-500")} />
              <span>{link.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>

    {/* INTELLIGENCE GROUP */}
    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 px-4 mb-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500 font-mono">INTELLIGENCE</span>
    </div>
    <nav className="space-y-0.5 px-3">
      {INTELLIGENCE_LINKS.map((link) => {
        const isActive = location === link.href;
        return (
          <Link key={link.href} href={link.href}>
            <div
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all cursor-pointer",
                isActive
                  ? "bg-blue-50/90 dark:bg-blue-950/50 text-[#315BEF] dark:text-blue-400 font-semibold shadow-2xs border-l-3 border-[#315BEF] pl-2.5"
                  : "text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
              )}
            >
              <link.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#315BEF] dark:text-blue-400" : "text-slate-400 dark:text-slate-500")} />
              <span>{link.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>

    {/* ACCOUNT GROUP */}
    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 px-4 mb-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500 font-mono">ACCOUNT</span>
    </div>
    <nav className="space-y-0.5 px-3">
      {ACCOUNT_LINKS.map((link) => {
        const isActive = location === link.href;
        return (
          <Link key={link.href} href={link.href}>
            <div
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all cursor-pointer",
                isActive
                  ? "bg-blue-50/90 dark:bg-blue-950/50 text-[#315BEF] dark:text-blue-400 font-semibold shadow-2xs border-l-3 border-[#315BEF] pl-2.5"
                  : "text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
              )}
            >
              <link.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#315BEF] dark:text-blue-400" : "text-slate-400 dark:text-slate-500")} />
              <span>{link.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  </div>
));
SidebarContent.displayName = "SidebarContent";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { data: notifications } = useListNotifications({
    query: {
      enabled: !!user
    } as any
  });

  const unreadCount = useMemo(() => {
    return notifications?.filter(n => !n.isRead).length || 0;
  }, [notifications]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white pb-16 md:pb-0 transition-colors antialiased">
      
      {/* ─── 1. TOP NAVIGATION BAR ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#11172A]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          
          {/* Left: Brand Logo + Mobile Drawer Trigger */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-400 -ml-1">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 bg-white dark:bg-[#11172A] border-r border-slate-200 dark:border-slate-800">
                  <div className="flex items-center p-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="h-8 w-8 bg-[#315BEF] rounded-xl flex items-center justify-center text-white font-black text-base shadow-md mr-2.5">
                      I
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      Influencer<span className="text-[#315BEF] dark:text-blue-400">Hub</span>
                    </span>
                  </div>
                  <ScrollArea className="h-[calc(100vh-70px)]">
                    <SidebarContent location={location} onItemClick={() => setIsMobileMenuOpen(false)} />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>

            <Link href="/dashboard">
              <div className="inline-flex items-center gap-2 cursor-pointer group">
                <div className="h-8 w-8 bg-gradient-to-br from-[#315BEF] via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform duration-300">
                  I
                </div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Influencer<span className="text-[#315BEF] dark:text-blue-400">Hub</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Center/Left: Compact Search Bar */}
          <div className="hidden sm:flex items-center max-w-sm w-full relative mx-4">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3" />
            <input
              type="text"
              placeholder="Search creators, campaigns, or metrics..."
              className="w-full h-8 pl-8 pr-3 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 focus:border-[#315BEF] dark:focus:border-blue-400 rounded-full text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all"
            />
          </div>

          {/* Right: Notifications, Help, User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              className="relative p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#315BEF] animate-pulse" />
              )}
            </button>

            <button
              type="button"
              className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer hidden sm:block"
              title="Help & Support"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 p-1 sm:p-1 sm:pl-2 rounded-full border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#11172A] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
                >
                  <Avatar className="h-6.5 w-6.5 border border-slate-200 dark:border-slate-700">
                    <AvatarImage src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"} />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs">
                      {user?.name?.charAt(0) || "D"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[12px] font-semibold text-slate-900 dark:text-slate-100 max-w-[80px] sm:max-w-[100px] truncate hidden sm:inline-block">
                    {user?.name || "Demo User"}
                  </span>
                  <Badge variant="secondary" className="text-[9px] uppercase font-mono font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60 px-1.5 py-0 hidden sm:inline-flex">
                    {user?.role || "Brand"}
                  </Badge>
                  <ChevronDown className="h-3 w-3 text-slate-400 dark:text-slate-500 mr-0.5 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11172A] text-slate-900 dark:text-slate-100">
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user?.name || "Demo User"}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">{user?.email || "demo@influencerhub.com"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                <Link href="/settings">
                  <DropdownMenuItem className="rounded-xl text-xs font-medium cursor-pointer py-2 px-3 focus:bg-slate-100 dark:focus:bg-slate-800">
                    <Settings className="mr-2 h-4 w-4 text-slate-400" />
                    Profile & Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={logout} className="rounded-xl text-xs font-medium text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer py-2 px-3">
                  <LogOut className="mr-2 h-4 w-4 text-red-500" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>

      {/* ─── 2. MAIN LAYOUT WITH COMPACT SIDEBAR & WORKSPACE CONTENT ────────────── */}
      <div className="flex-1 flex w-full">
        
        {/* Compact Desktop Sidebar */}
        <aside className="hidden md:block w-56 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-[#11172A]/60 min-h-[calc(100vh-3.5rem)]">
          <SidebarContent location={location} />
        </aside>

        {/* Fluid Workspace Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* ─── 3. MOBILE BOTTOM NAVIGATION BAR ───────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#11172A]/95 border-t border-slate-200/90 dark:border-slate-800/90 backdrop-blur-md px-3 py-1.5 flex items-center justify-around shadow-lg">
        {BOTTOM_NAV_LINKS.map((link) => {
          const isActive = location === link.href || (link.href === "/dashboard" && (location === "/dashboard/brand" || location === "/dashboard/influencer"));
          return (
            <Link key={link.href} href={link.href}>
              <div className="flex flex-col items-center gap-0.5 cursor-pointer py-1 px-2.5">
                <link.icon className={cn("h-4.5 w-4.5 transition-transform", isActive ? "text-[#315BEF] dark:text-blue-400 scale-110" : "text-slate-400 dark:text-slate-500")} />
                <span className={cn("text-[10px] tracking-tight", isActive ? "text-[#315BEF] dark:text-blue-400 font-semibold" : "text-slate-500 dark:text-slate-400 font-medium")}>
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
