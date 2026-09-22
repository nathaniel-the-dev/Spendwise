"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  Tags,
  PiggyBank,
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
  { href: "/dashboard/categories", label: "Categories", icon: Tags },
  { href: "/dashboard/budgets", label: "Budgets", icon: PiggyBank },
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

  // Formatting locale and display currency for the whole dashboard come from the user's settings.
  useEffect(() => {
    if (settings?.locale) setDefaultLocale(settings.locale);
    if (settings?.preferredCurrency) setDefaultCurrency(settings.preferredCurrency);
  }, [settings?.locale, settings?.preferredCurrency]);

  const name = user?.name ?? "User";
  const email = user?.email ?? "";
  const initial = name.charAt(0)?.toUpperCase() ?? "U";

  return (
    <RestoreGate>
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r glass-sidebar transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border/30">
          <Link href="/" className="flex items-center gap-2 font-display text-base font-semibold tracking-tight">
            <Image src="/icon.png" alt="SpendWise logo" width={28} height={28} className="rounded-lg bg-primary-foreground p-1.5" />
            <span>SpendWise</span>
          </Link>
          <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
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
              <Button variant="ghost" className="w-full justify-start gap-2.5 px-2.5 py-4 h-auto hover:bg-sidebar-accent transition-all duration-150">
                <div className="relative">
                  <Avatar className="h-9 w-9 ring-1 ring-primary/20">
                    <AvatarImage src={user?.image ?? undefined} />
                    <AvatarFallback style={{ background: getAvatarGradient(name), color: "#fff", fontSize: 13 }}>
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-sidebar-background" />
                </div>
                <div className="flex-1 text-left text-sm min-w-0">
                  <p className="font-medium truncate">{name}</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">{email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-sidebar-foreground/40 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-64">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarImage src={user?.image ?? undefined} />
                  <AvatarFallback
                    style={{ background: getAvatarGradient(name), color: "#fff", fontSize: 14 }}
                  >
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
                <Link href="/dashboard/settings#profile">
                  <UserRound className="h-4 w-4 mr-2" />
                  Manage profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm" asChild>
                <Link href="/dashboard/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-sm text-destructive focus:text-destructive"
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  // Drop the disposable cached reads so the next account on
                  // this device never sees them. The offline outbox survives:
                  // those are this user's unsynced writes, not cache.
                  await purgeQueryCache();
                  router.push("/");
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <OfflineBanner />
        <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4">
          <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden shrink-0" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
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
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-24">{children}</main>
      </div>

      <QuickAddFab />
    </div>
    </RestoreGate>
  );
}
