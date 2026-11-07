"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CalendarDays,
  Tags,
  PiggyBank,
  Wallet,
  RefreshCcw,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Moon,
  Sun,
  Search,
  UserRound,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/components/supabase-provider";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/hooks/use-settings";
import { setDefaultLocale, setDefaultCurrency } from "@/lib/utils";
import { purgeQueryCache } from "@/lib/query-persistence";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { RestoreGate } from "@/components/shared/restore-gate";
import { QuickAddFab } from "@/components/shared/quick-add-fab";
import { useEffect, useState } from "react";

const sidebarLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/categories", label: "Categories", icon: Tags },
  { href: "/dashboard/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/dashboard/accounts", label: "Accounts", icon: Wallet },
  { href: "/dashboard/subscriptions", label: "Subscriptions", icon: RefreshCcw },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const avatarGradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < (name?.length ?? 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

function DashboardSidebar({
  mobile = false,
  name,
  email,
  image,
  onNavigate,
}: {
  mobile?: boolean;
  name: string;
  email: string;
  image?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const initial = name.charAt(0)?.toUpperCase() ?? "U";

  return (
    <aside className="flex h-full w-60 flex-col border-r glass-sidebar">
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border/30 px-4">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2 font-display text-base font-semibold tracking-tight">
          <Image src="/icon.png" alt="SpendWise logo" width={28} height={28} className="rounded-lg bg-primary-foreground p-1.5" />
          <span>SpendWise</span>
        </Link>
        {mobile && (
          <Button variant="ghost" size="icon" aria-label="Close navigation" onClick={onNavigate}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      <nav aria-label="Dashboard" className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border/30 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-start gap-2.5 px-2.5 py-4 hover:bg-sidebar-accent">
              <div className="relative">
                <Avatar className="h-9 w-9 ring-1 ring-primary/20">
                  <AvatarImage src={image} />
                  <AvatarFallback style={{ background: getAvatarGradient(name), color: "#fff", fontSize: 13 }}>
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar-background bg-success" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 text-left text-sm">
                <p className="truncate font-medium">{name}</p>
                <p className="truncate text-xs text-sidebar-foreground/60">{email}</p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/40" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-64">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={image} />
                <AvatarFallback style={{ background: getAvatarGradient(name), color: "#fff", fontSize: 14 }}>
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm" asChild>
              <Link href="/dashboard/settings#profile" onClick={onNavigate}>
                <UserRound className="mr-2 h-4 w-4" aria-hidden="true" />
                Manage profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm" asChild>
              <Link href="/dashboard/settings" onClick={onNavigate}>
                <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-sm text-destructive focus:text-destructive"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                await purgeQueryCache();
                onNavigate?.();
                router.push("/");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const { data: settings } = useSettings();

  // The sidebar doubles as a mobile overlay. Nav links close it themselves,
  // but not every navigation goes through them (avatar menu, search, router
  // pushes) — so any route change closes it unconditionally.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // A mobile dialog should never survive a resize into the persistent desktop
  // layout, where its backdrop would otherwise keep the page inert.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setSidebarOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  // Formatting locale and display currency for the whole dashboard come from the user's settings.
  useEffect(() => {
    if (settings?.locale) setDefaultLocale(settings.locale);
    if (settings?.preferredCurrency) setDefaultCurrency(settings.preferredCurrency);
  }, [settings?.locale, settings?.preferredCurrency]);

  const name = user?.name ?? "User";
  const email = user?.email ?? "";
  return (
    <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <RestoreGate>
      <div className="flex h-screen overflow-hidden bg-background">
      <a
        href="#dashboard-content"
        className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-lg bg-background px-4 py-2 text-sm font-medium shadow-dialog transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <div className="hidden lg:block">
        <DashboardSidebar name={name} email={email} image={user?.image ?? undefined} />
      </div>
      <DialogContent className="left-0 top-0 h-dvh max-h-none w-60 max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-y-0 border-l-0 p-0 lg:hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Dashboard navigation</DialogTitle>
        <DashboardSidebar
          mobile
          name={name}
          email={email}
          image={user?.image ?? undefined}
          onNavigate={() => setSidebarOpen(false)}
        />
      </DialogContent>

      <div className="flex flex-1 flex-col overflow-hidden">
        <OfflineBanner />
        <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4">
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="Open navigation">
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DialogTrigger>
          <search
            className="relative flex-1 max-w-md hidden sm:block"
            onSubmit={(e) => {
              e.preventDefault();
              const q = headerSearch.trim();
              router.push(q ? `/dashboard/transactions?search=${encodeURIComponent(q)}` : "/dashboard/transactions");
            }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Search transactions"
              placeholder="Search transactions..."
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className="pl-9 h-9 bg-muted/40"
            />
          </search>
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </header>
        <main id="dashboard-content" tabIndex={-1} className="flex-1 overflow-y-auto p-4 pb-24 focus:outline-none md:p-6 md:pb-24">{children}</main>
      </div>

      <QuickAddFab />
      </div>
      </RestoreGate>
    </Dialog>
  );
}
