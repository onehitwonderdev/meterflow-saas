"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Settings, Clock, BarChart2, Users, FileText, Shield, Search, Menu, ChevronRight, Sparkles, Brain, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CopilotDrawer } from "@/components/ai/CopilotDrawer";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/overview", icon: Box, description: "Revenue, usage, and key metrics" },
  { label: "Events", href: "/events", icon: Clock, description: "Live event stream & ingestion" },
  { label: "Metrics", href: "/metrics", icon: BarChart2, description: "Billable metrics definitions" },
  { label: "Plans", href: "/plans", icon: Settings, description: "Pricing plans & tier calculator" },
  { label: "Customers", href: "/customers", icon: Users, description: "Customer directory & details" },
  { label: "Invoices", href: "/invoices", icon: FileText, description: "Invoice management" },
  { label: "Webhooks", href: "/webhooks", icon: Shield, description: "Outbound webhook endpoints" },
  { label: "Simulator", href: "/simulator", icon: Zap, description: "Traffic & burst load generator" },
  { label: "Copilot", href: "/copilot", icon: Brain, description: "AI FinOps assistant" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = React.useState(false);
  const [copilotOpen, setCopilotOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdPaletteOpen(true);
      }
      if (e.key === "Escape") {
        setCmdPaletteOpen(false);
        setSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-zinc-900/95 border-r border-zinc-800 shadow-lg transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 pt-6 border-b border-zinc-800">
            <div>
              <h2 className="text-emerald-400 text-lg font-bold">MeterFlow</h2>
              <p className="text-zinc-400 text-xs">B2B SaaS Billing</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-emerald-600/20 text-emerald-300"
                      : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-emerald-400" : "text-zinc-500")} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{item.label}</span>
                    <span className="text-xs text-zinc-500 truncate block">{item.description}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-emerald-400" />}
                </Link>
              );
            })}
          </nav>

          {/* Organization badge */}
          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 p-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center">
                <span className="text-emerald-400 text-sm font-bold">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">Acme AI Cloud</p>
                <Badge variant="success" className="text-xs">Owner</Badge>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="h-16 bg-zinc-900/70 border-b border-zinc-800 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-white font-semibold text-lg hidden sm:block">MeterFlow</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Command palette trigger */}
            <Dialog open={cmdPaletteOpen} onOpenChange={setCmdPaletteOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Search className="h-5 w-5" />
                  <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-zinc-500 bg-zinc-800 rounded ml-1">
                    <span>⌘</span>K
                  </kbd>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Command Palette</DialogTitle>
                  <DialogDescription>Search and navigate to any page</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Input placeholder="Search..." className="text-lg" autoFocus />
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                        onClick={() => setCmdPaletteOpen(false)}
                      >
                        <item.icon className="h-5 w-5 text-zinc-500" />
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-zinc-500">{item.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Copilot button */}
            <Button
              variant="default"
              size="icon"
              className="relative h-9 w-9 rounded-full bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 lg:hidden sm:flex"
              onClick={() => setCopilotOpen(true)}
            >
              <Brain className="h-5 w-5" />
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="" alt="User" />
                    <AvatarFallback className="bg-emerald-600 text-zinc-950 font-bold">A</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-white font-medium">Demo User</p>
                    <p className="text-xs text-zinc-400">owner@acme.ai</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-zinc-300 hover:bg-zinc-800">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-zinc-300 hover:bg-zinc-800">
                  API Keys
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-rose-400 hover:bg-rose-900/20">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Copilot Drawer */}
      <CopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} orgId="00000000-0000-0000-0000-000000000000" />
    </div>
  );
}