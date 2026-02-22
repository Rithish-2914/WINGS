import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  LogOut,
  MapPin,
  Menu,
  Calendar,
  MessageSquare,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const links = isAdmin
    ? [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/orders", label: "Orders", icon: FileText },
        { href: "/admin/leaves", label: "Leaves", icon: Calendar },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/orders", label: "Orders", icon: FileText },
        { href: "/support", label: "Support", icon: MessageSquare },
        { href: "/visits/new", label: "New Visit", icon: PlusCircle },
        { href: "/visits/history", label: "My History", icon: MapPin },
        { href: "/leaves", label: "Apply Leave", icon: Calendar },
      ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Mobile Menu */}
        <div className="mr-4 md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <div className="flex flex-col gap-6 py-4">
                <div className="flex items-center gap-2 px-2">
                  <img src="/logo.png" alt="Master Brains" className="h-8 w-auto" />
                </div>
                <nav className="flex flex-col gap-2">
                  {links.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link key={link.href} href={link.href}>
                        <div
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                            location === link.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {link.label}
                        </div>
                      </Link>
                    );
                  })}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Logo */}
        <div className="mr-4 hidden md:flex">
          <Link href={isAdmin ? "/admin" : "/dashboard"} className="mr-6 flex items-center space-x-2">
            <img src="/logo.png" alt="Master Brains" className="h-8 w-auto" />
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={cn(
                "transition-colors hover:text-foreground/80",
                location === link.href ? "text-foreground" : "text-foreground/60"
              )}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search or other header items can go here */}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline-block text-sm text-muted-foreground">
              {user.name} ({user.role})
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
