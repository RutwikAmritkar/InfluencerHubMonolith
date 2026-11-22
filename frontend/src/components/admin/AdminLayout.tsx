import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useAdmin } from "@/contexts/admin-context";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  KeyRound,
  Megaphone,
  Inbox,
  Briefcase,
  CreditCard,
  TrendingUp,
  ShieldAlert,
  FileText,
  Activity,
  Settings,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Search,
  ExternalLink,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "COMMAND",
    items: [
      { name: "Overview", href: "/admin", icon: LayoutDashboard },
      {
        name: "Active User Activity",
        href: "/admin/activity-logs",
        icon: Activity,
        permission: "admin.dashboard.view",
      },
    ],
  },
  {
    title: "DIRECTORY & ACCESS",
    items: [
      {
        name: "Users & Roles",
        href: "/admin/users",
        icon: Users,
        permission: "admin.users.view",
      },
      {
        name: "Creators",
        href: "/admin/creators",
        icon: UserCheck,
        permission: "admin.users.view",
      },
      {
        name: "Brands",
        href: "/admin/brands",
        icon: Building2,
        permission: "admin.users.view",
      },
    ],
  },
  {
    title: "MARKETPLACE OPS",
    items: [
      {
        name: "Campaigns",
        href: "/admin/campaigns",
        icon: Megaphone,
        permission: "admin.campaigns.view",
      },
      {
        name: "Deals & Disputes",
        href: "/admin/deals",
        icon: Briefcase,
        permission: "admin.deals.view",
      },
      {
        name: "Payments & Payouts",
        href: "/admin/payments",
        icon: CreditCard,
        permission: "admin.deals.view",
      },
    ],
  },
  {
    title: "GOVERNANCE",
    items: [
      {
        name: "Reports & Moderation",
        href: "/admin/reports",
        icon: ShieldAlert,
        permission: "admin.reports.view",
      },
      {
        name: "Admin Audit Logs",
        href: "/admin/audit-logs",
        icon: FileText,
        permission: "admin.audit_logs.view",
      },
      {
        name: "Platform Settings",
        href: "/admin/settings",
        icon: Settings,
        permission: "admin.settings.manage",
      },
    ],
  },
];

interface SearchResultItem {
  id: string | number;
  label: string;
  sublabel: string;
  href: string;
  type: string;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { admin, hasPermission, isSuperAdmin } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    users: SearchResultItem[];
    creators: SearchResultItem[];
    brands: SearchResultItem[];
    campaigns: SearchResultItem[];
    deals: SearchResultItem[];
  }>({
    users: [],
    creators: [],
    brands: [],
    campaigns: [],
    deals: [],
  });

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ users: [], creators: [], brands: [], campaigns: [], deals: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const res = await fetch(
          `${apiUrl}/api/admin/search?q=${encodeURIComponent(searchQuery.trim())}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults({
            users: (data.users || []).map((u: any) => ({
              id: u.id,
              label: u.name || u.email,
              sublabel: `${u.role} • ${u.email}`,
              href: `/admin/users`,
              type: "User",
            })),
            creators: (data.creators || []).map((c: any) => ({
              id: c.id,
              label: c.name || "Creator",
              sublabel: `${c.category || "General"} • ${c.followers?.toLocaleString() || 0} followers`,
              href: `/admin/creators`,
              type: "Creator",
            })),
            brands: (data.brands || []).map((b: any) => ({
              id: b.id,
              label: b.name,
              sublabel: b.industry || "Brand Partner",
              href: `/admin/brands`,
              type: "Brand",
            })),
            campaigns: (data.campaigns || []).map((c: any) => ({
              id: c.id,
              label: c.title,
              sublabel: `${c.platform} • ${c.status}`,
              href: `/admin/campaigns`,
              type: "Campaign",
            })),
            deals: (data.deals || []).map((d: any) => ({
              id: d.id,
              label: d.title,
              sublabel: d.agreementStatus,
              href: `/admin/deals`,
              type: "Deal",
            })),
          });
        }
      } catch (e) {
        console.error("Search query failed:", e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filterSection = (section: NavSection) => {
    const items = section.items.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(item.permission);
    });
    return { ...section, items };
  };

  const visibleSections = NAV_SECTIONS.map(filterSection).filter((sec) => sec.items.length > 0);

  // Compute active breadcrumb
  let activeSectionTitle = "Command";
  let activeItemName = "Overview";
  for (const sec of NAV_SECTIONS) {
    for (const item of sec.items) {
      if (item.href === "/admin" ? location === "/admin" : location.startsWith(item.href)) {
        activeSectionTitle = sec.title;
        activeItemName = item.name;
        break;
      }
    }
  }

  const hasAnyResults =
    searchResults.users.length > 0 ||
    searchResults.creators.length > 0 ||
    searchResults.brands.length > 0 ||
    searchResults.campaigns.length > 0 ||
    searchResults.deals.length > 0;

  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#09090B] text-[#0A0A0A] dark:text-[#F8FAFC] flex flex-col lg:flex-row font-sans selection:bg-[#6A0D18] selection:text-white">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col justify-between border-r border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#0E0E12] p-5 shadow-xs select-none h-screen sticky top-0 overflow-y-auto">
        <div className="space-y-5">
          <div className="flex flex-col space-y-1.5 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
            <Link href="/admin">
              <div className="flex items-center gap-2.5 cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B1524] via-[#6A0D18] to-[#4A0710] border border-white/25 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-xs group-hover:scale-105 transition-transform">
                  CB
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
                    Creators
                    <span className="italic font-serif font-normal text-[#6A0D18] dark:text-[#E87985]">
                      Brand
                    </span>
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider text-[#6A0D18] dark:text-[#E87985] uppercase">
                    Platform Control Center
                  </span>
                </div>
              </div>
            </Link>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-white via-[#FAF9F6] to-[#F5EAEB]/40 dark:from-[#18181E] dark:via-[#121216] dark:to-[#6A0D18]/15 border border-[#6A0D18]/25 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-zinc-400">
                Active Operator
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#6A0D18] text-white border border-white/20 shadow-xs">
                <ShieldCheck className="w-3 h-3" />
                {admin?.roleName?.toUpperCase() || (isSuperAdmin ? "SUPER ADMIN" : "ADMIN")}
              </span>
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC] truncate">
                {user?.name || "Admin Operator"}
              </p>
              <p className="text-[11px] text-[#52525B] dark:text-zinc-400 truncate font-mono">
                {user?.email}
              </p>
            </div>
          </div>

          <nav className="space-y-4">
            {visibleSections.map((sec) => (
              <div key={sec.title} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-zinc-400">
                  {sec.title}
                </p>
                {sec.items.map((item) => {
                  const isActive =
                    item.href === "/admin" ? location === "/admin" : location.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                          isActive
                            ? "liquid-burgundy-metal shadow-xs font-bold"
                            : "text-[#52525B] dark:text-zinc-400 hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC] hover:bg-[#FAF9F6] dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 ${isActive ? "text-white" : "text-[#52525B] dark:text-zinc-400"}`}
                          />
                          <span>{item.name}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#E5E4DF] dark:border-white/10 space-y-2 mt-4">
          <Link href="/dashboard">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs font-semibold border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-[#FAF9F6] dark:hover:bg-white/[0.06] bg-transparent h-8 gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#52525B] dark:text-zinc-400" />
              Switch to Marketplace
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className="w-full justify-start text-xs font-medium text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-8 gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Command Header Bar */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0E0E12]/95 backdrop-blur-md border-b border-[#E5E4DF] dark:border-white/10 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-8 w-8 p-0 border-[#E5E4DF] dark:border-white/10 bg-transparent text-[#0A0A0A] dark:text-[#F8FAFC]"
            >
              <Menu className="w-4 h-4 text-[#0A0A0A]" />
            </Button>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-[#52525B] hidden sm:inline">
                {activeSectionTitle}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#52525B] hidden sm:inline" />
              <span className="font-extrabold text-[#0A0A0A]">{activeItemName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Global Search */}
            <div ref={searchRef} className="relative hidden md:block w-72">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B] dark:text-zinc-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Quick search (Users, Deals, Briefs)..."
                  className="pl-8.5 h-8.5 text-xs bg-[#FAF9F6] dark:bg-[#121216] border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC] placeholder:text-[#52525B] dark:placeholder:text-[#A1A1AA] rounded-lg focus:bg-white dark:focus:bg-[#18181E] transition-colors"
                />
                {isSearching && (
                  <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#6A0D18] dark:text-[#E87985]" />
                )}
              </div>

              {/* Search dropdown results */}
              {searchOpen && searchQuery.trim().length >= 2 && (
                <div className="absolute top-full mt-1.5 left-0 w-80 bg-white dark:bg-[#121216] border border-[#6A0D18]/30 dark:border-[#E87985]/30 rounded-xl shadow-xl overflow-hidden z-50 text-xs divide-y divide-[#E5E4DF] dark:divide-white/10">
                  {!hasAnyResults && !isSearching ? (
                    <div className="p-4 text-center text-[#52525B] dark:text-zinc-400">
                      No matching records found for "{searchQuery}".
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                      {searchResults.users.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-zinc-400 px-2 py-1">
                            Users &amp; Accounts
                          </p>
                          {searchResults.users.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                setLocation(item.href);
                                setSearchOpen(false);
                              }}
                              className="px-2 py-1.5 rounded-lg hover:bg-[#FAF9F6] dark:hover:bg-white/[0.06] cursor-pointer flex items-center justify-between"
                            >
                              <div className="truncate">
                                <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC] truncate">
                                  {item.label}
                                </p>
                                <p className="text-[10px] text-[#52525B] dark:text-zinc-400 truncate">
                                  {item.sublabel}
                                </p>
                              </div>
                              <span className="text-[10px] font-semibold text-[#6A0D18] dark:text-[#E87985] shrink-0">
                                View
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.creators.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-zinc-400 px-2 py-1">
                            Creators
                          </p>
                          {searchResults.creators.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                setLocation(item.href);
                                setSearchOpen(false);
                              }}
                              className="px-2 py-1.5 rounded-lg hover:bg-[#FAF9F6] dark:hover:bg-white/[0.06] cursor-pointer flex items-center justify-between"
                            >
                              <div className="truncate">
                                <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC] truncate">
                                  {item.label}
                                </p>
                                <p className="text-[10px] text-[#52525B] dark:text-zinc-400 truncate">
                                  {item.sublabel}
                                </p>
                              </div>
                              <span className="text-[10px] font-semibold text-[#6A0D18] dark:text-[#E87985] shrink-0">
                                View
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.campaigns.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-zinc-400 px-2 py-1">
                            Campaign Briefs
                          </p>
                          {searchResults.campaigns.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                setLocation(item.href);
                                setSearchOpen(false);
                              }}
                              className="px-2 py-1.5 rounded-lg hover:bg-[#FAF9F6] dark:hover:bg-white/[0.06] cursor-pointer flex items-center justify-between"
                            >
                              <div className="truncate">
                                <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC] truncate">
                                  {item.label}
                                </p>
                                <p className="text-[10px] text-[#52525B] dark:text-zinc-400 truncate">
                                  {item.sublabel}
                                </p>
                              </div>
                              <span className="text-[10px] font-semibold text-[#6A0D18] dark:text-[#E87985] shrink-0">
                                View
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults.deals.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-zinc-400 px-2 py-1">
                            Deals
                          </p>
                          {searchResults.deals.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                setLocation(item.href);
                                setSearchOpen(false);
                              }}
                              className="px-2 py-1.5 rounded-lg hover:bg-[#FAF9F6] dark:hover:bg-white/[0.06] cursor-pointer flex items-center justify-between"
                            >
                              <div className="truncate">
                                <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC] truncate">
                                  {item.label}
                                </p>
                                <p className="text-[10px] text-[#52525B] dark:text-zinc-400 truncate">
                                  {item.sublabel}
                                </p>
                              </div>
                              <span className="text-[10px] font-semibold text-[#6A0D18] dark:text-[#E87985] shrink-0">
                                View
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Operator Role Badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#6A0D18]/10 dark:bg-[#6A0D18]/25 text-[#6A0D18] dark:text-[#E87985] border border-[#6A0D18]/25 dark:border-[#6A0D18]/40 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6A0D18] dark:bg-[#E87985] animate-pulse" />
              {admin?.roleName?.toUpperCase() || (isSuperAdmin ? "SUPER ADMIN" : "ADMIN")}
            </span>

            {/* Quick Theme Toggle in Admin Header */}
            <ThemeToggle />

            {/* Switch to Marketplace */}
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex text-xs h-8 border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#121216] text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-[#FAF9F6] dark:hover:bg-white/[0.06] cursor-pointer gap-1.5 shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#52525B] dark:text-zinc-400" />
                Marketplace
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Canvas with Ambient Burgundy / Silver Radial Gradient */}
        <main
          className="flex-1 min-w-0 overflow-y-auto bg-[#FAF9F6] dark:bg-[#09090B]"
          style={{
            background: isDark
              ? "radial-gradient(circle at 85% 15%, rgba(106, 13, 24, 0.16) 0%, transparent 45%), radial-gradient(circle at 15% 85%, rgba(168, 40, 48, 0.10) 0%, transparent 50%), #09090B"
              : "radial-gradient(circle at 85% 15%, rgba(106, 13, 24, 0.05) 0%, transparent 45%), radial-gradient(circle at 15% 85%, rgba(168, 40, 48, 0.03) 0%, transparent 50%), #FAF9F6",
          }}
        >
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">{children}</div>
        </main>
      </div>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start animate-in fade-in-0 duration-200">
          <div className="w-80 max-w-full bg-white dark:bg-[#0E0E12] border-r border-[#E5E4DF] dark:border-white/10 h-full shadow-2xl flex flex-col justify-between p-5 overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E4DF] dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8B1524] via-[#6A0D18] to-[#4A0710] flex items-center justify-center text-white font-bold text-xs">
                    CB
                  </div>
                  <span className="text-xs font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC]">
                    Control Center
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 p-0 text-[#0A0A0A] dark:text-[#F8FAFC]"
                >
                  <X className="w-4 h-4 text-[#0A0A0A] dark:text-[#F8FAFC]" />
                </Button>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#121216] border border-[#6A0D18]/20 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6A0D18] dark:text-[#E87985]">
                  {admin?.roleName?.toUpperCase() || "ADMIN OPERATOR"}
                </span>
                <p className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC] truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-[#52525B] dark:text-zinc-400 truncate font-mono">
                  {user?.email}
                </p>
              </div>

              <nav className="space-y-4">
                {visibleSections.map((sec) => (
                  <div key={sec.title} className="space-y-1">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-zinc-400">
                      {sec.title}
                    </p>
                    {sec.items.map((item) => {
                      const isActive =
                        item.href === "/admin"
                          ? location === "/admin"
                          : location.startsWith(item.href);
                      const Icon = item.icon;

                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                              isActive
                                ? "liquid-burgundy-metal font-bold shadow-xs text-white"
                                : "text-[#52525B] dark:text-zinc-400 hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC] hover:bg-[#FAF9F6] dark:hover:bg-white/[0.06]"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? "text-white" : ""}`} />
                            {item.name}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#E5E4DF] space-y-2 mt-4">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Switch to Marketplace
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="w-full text-xs text-rose-700 hover:bg-rose-50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;
