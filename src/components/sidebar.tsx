// @ts-nocheck
import * as React from "react";
import { Menu, Settings, Box, LogOut, Shield, Clock, BarChart2, Users } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType;
  permission?: "owner" | "admin" | "developer" | "finance" | "viewer";
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/app/(dashboard)/overview", icon: Box },
  { label: "Events", href: "/app/(dashboard)/events", icon: Clock },
  { label: "Metrics", href: "/app/(dashboard)/metrics", icon: BarChart2 },
  { label: "Plans", href: "/app/(dashboard)/plans", icon: Settings },
  { label: "Customers", href: "/app/(dashboard)/customers", icon: Users },
  { label: "Invoices", href: "/app/(dashboard)/invoices", icon: LogOut },
  { label: "Webhooks", href: "/app/(dashboard)/webhooks", icon: Shield },
];

export default function Sidebar() {
  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-zinc-900/70 border-zinc-800 border-r border-zinc-700 shadow-lg z-20">
      <div className="p-4 pt-6 text-center">
        <h2 className="text-emerald-400 text-lg font-bold mb-4">MeterFlow</h2>
        <p className="text-zinc-400 text-xs">B2B SaaS Billing</p>
      </div>

      <div className="p-6">
        {navItems.map((item) => (
          <div
            key={item.label}
            onClick={() => window.location.href = item.href}
            className="flex items-center rounded-md px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors mb-2 cursor-pointer"
          >
            <item.icon className="h-4 w-4 mr-3" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </nav>
  );
}