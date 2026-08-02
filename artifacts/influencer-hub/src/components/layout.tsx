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
  Menu
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
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Badge } from "./ui/badge";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { data: notifications } = useListNotifications({
    query: {
      enabled: !!user
    }
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/influencers", label: "Discovery", icon: Users },
    { href: "/campaigns", label: "Campaigns", icon: Megaphone },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const NavLinks = () => (
    <div className="flex flex-col gap-2 p-4">
      {links.map((link) => {
        const isActive = location.startsWith(link.href) && (link.href !== "/dashboard" || location === "/dashboard/brand" || location === "/dashboard/influencer" || location === "/dashboard");
        return (
          <Button
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start font-medium",
              isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground hover:bg-muted"
            )}
            onClick={() => setIsMobileMenuOpen(false)}
            asChild
          >
            <Link href={link.href}>
              <link.icon className="mr-3 h-5 w-5" />
              {link.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between border-b p-4 bg-card z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <div className="flex items-center p-6 border-b">
                <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold mr-3">
                  I
                </div>
                <span className="text-xl font-bold tracking-tight">Influencer<span className="text-primary">Hub</span></span>
              </div>
              <ScrollArea className="h-[calc(100vh-80px)]">
                <NavLinks />
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <div className="font-bold text-lg">InfluencerHub</div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive"></span>
            )}
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl || ""} />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-card border-r shadow-sm">
        <div className="h-16 flex items-center px-6 border-b">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold mr-3">
            I
          </div>
          <span className="text-xl font-bold tracking-tight">Influencer<span className="text-primary">Hub</span></span>
        </div>
        
        <ScrollArea className="flex-1">
          <NavLinks />
        </ScrollArea>

        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start h-auto p-2">
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatarUrl || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 items-start text-left text-sm overflow-hidden">
                    <span className="font-medium truncate w-full">{user?.name}</span>
                    <span className="text-xs text-muted-foreground truncate w-full capitalize">{user?.role}</span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer">
                  Profile Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 items-center justify-between px-8">
          <div className="flex items-center text-sm text-muted-foreground">
            {location.replace("/", "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Dashboard"}
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-full">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-8 w-full max-w-[1400px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
