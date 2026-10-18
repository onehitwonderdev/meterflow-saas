"use client";

import * as React from "react";
import { Search, Filter, ChevronDown, ChevronRight, Copy, Eye, Download, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { NaturalLanguageSearch } from "@/components/ai/NaturalLanguageSearch";

interface Event {
  id: string;
  idempotencyKey: string;
  customerId: string;
  customerName: string;
  eventName: string;
  timestamp: string;
  outcome: "ACCEPTED" | "DUPLICATE_IGNORED" | "RATE_LIMITED" | "HARD_CAP_BLOCKED" | "INVALID";
  properties: Record<string, unknown>;
}

const mockEvents: Event[] = [
  {
    id: "evt_001",
    idempotencyKey: "idem_abc123def456",
    customerId: "cus_001",
    customerName: "TechCorp Industries",
    eventName: "llm_tokens",
    timestamp: "2026-01-15T14:32:18.000Z",
    outcome: "ACCEPTED",
    properties: { model: "gpt-4o", tokens: 1500, prompt: "Analyze quarterly revenue..." },
  },
  {
    id: "evt_002",
    idempotencyKey: "idem_abc123def456",
    customerId: "cus_001",
    customerName: "TechCorp Industries",
    eventName: "llm_tokens",
    timestamp: "2026-01-15T14:32:19.000Z",
    outcome: "DUPLICATE_IGNORED",
    properties: { model: "gpt-4o", tokens: 1500, prompt: "Analyze quarterly revenue..." },
  },
  {
    id: "evt_003",
    idempotencyKey: "idem_xyz789uvw012",
    customerId: "cus_002",
    customerName: "DataFlow Labs",
    eventName: "api_calls",
    timestamp: "2026-01-15T14:31:45.000Z",
    outcome: "ACCEPTED",
    properties: { endpoint: "/v1/embeddings", method: "POST", latency_ms: 245 },
  },
  {
    id: "evt_004",
    idempotencyKey: "idem_rate_limit_001",
    customerId: "cus_003",
    customerName: "CloudNine Solutions",
    eventName: "storage_gb",
    timestamp: "2026-01-15T14:30:12.000Z",
    outcome: "RATE_LIMITED",
    properties: { bucket: "uploads", gb: 5.2 },
  },
  {
    id: "evt_005",
    idempotencyKey: "idem_cap_blocked_001",
    customerId: "cus_004",
    customerName: "APIFirst Startup",
    eventName: "llm_tokens",
    timestamp: "2026-01-15T14:28:33.000Z",
    outcome: "HARD_CAP_BLOCKED",
    properties: { model: "gpt-4o", tokens: 10000 },
  },
  {
    id: "evt_006",
    idempotencyKey: "idem_invalid_001",
    customerId: "cus_005",
    customerName: "ScaleUp Ventures",
    eventName: "unknown_event",
    timestamp: "2026-01-15T14:25:01.000Z",
    outcome: "INVALID",
    properties: {},
  },
];

const outcomeBadges = {
  ACCEPTED: { variant: "success" as const, label: "Accepted", icon: "✓" },
  DUPLICATE_IGNORED: { variant: "warning" as const, label: "Duplicate", icon: "⚠" },
  RATE_LIMITED: { variant: "destructive" as const, label: "Rate Limited", icon: "⏱" },
  HARD_CAP_BLOCKED: { variant: "destructive" as const, label: "Hard Cap", icon: "🚫" },
  INVALID: { variant: "secondary" as const, label: "Invalid", icon: "✗" },
};

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [outcomeFilter, setOutcomeFilter] = React.useState<string>("all");
  const [customerFilter, setCustomerFilter] = React.useState<string>("all");
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: "asc" | "desc" }>({ key: "timestamp", direction: "desc" });

  const filteredEvents = React.useMemo(() => {
    return mockEvents
      .filter((event) => {
        if (searchQuery && !event.idempotencyKey.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !event.customerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !event.eventName.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        if (outcomeFilter !== "all" && event.outcome !== outcomeFilter) {
          return false;
        }
        if (customerFilter !== "all" && event.customerId !== customerFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aVal = a[sortConfig.key as keyof Event];
        const bVal = b[sortConfig.key as keyof Event];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [searchQuery, outcomeFilter, customerFilter, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const SortableHeader = ({ children, sortKey }: { children: React.ReactNode; sortKey: string }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-zinc-800"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortConfig.key === sortKey && (
          sortConfig.direction === "asc" ? <ChevronDown className="h-3 w-3" /> : <ChevronDown className="h-3 w-3 rotate-180" />
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Live Event Stream</h1>
          <p className="text-zinc-400 mt-1">Monitor ingestion, debug duplicates, and track idempotency</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <NaturalLanguageSearch
              schema="events"
              currentFilters={{ outcome: outcomeFilter !== "all" ? outcomeFilter : undefined, customerId: customerFilter !== "all" ? customerFilter : undefined }}
              onFilterChange={(filters, humanReadable) => {
                if (filters.outcome) setOutcomeFilter(filters.outcome as string);
                if (filters.customerName) setCustomerFilter(filters.customerName as string);
                if (filters.dateRange) {
                  // Could add date range filter here
                }
              }}
              placeholder="Search events: 'rate limited for TechCorp last week'..."
            />
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Outcomes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="DUPLICATE_IGNORED">Duplicate Ignored</SelectItem>
                <SelectItem value="RATE_LIMITED">Rate Limited</SelectItem>
                <SelectItem value="HARD_CAP_BLOCKED">Hard Cap Blocked</SelectItem>
                <SelectItem value="INVALID">Invalid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="cus_001">TechCorp Industries</SelectItem>
                <SelectItem value="cus_002">DataFlow Labs</SelectItem>
                <SelectItem value="cus_003">CloudNine Solutions</SelectItem>
                <SelectItem value="cus_004">APIFirst Startup</SelectItem>
                <SelectItem value="cus_005">ScaleUp Ventures</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="whitespace-nowrap">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader sortKey="timestamp">Timestamp</SortableHeader>
                  <SortableHeader sortKey="customerName">Customer</SortableHeader>
                  <SortableHeader sortKey="eventName">Event</SortableHeader>
                  <SortableHeader sortKey="outcome">Outcome</SortableHeader>
                  <SortableHeader sortKey="idempotencyKey">Idempotency Key</SortableHeader>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                      No events match your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => {
                    const badge = outcomeBadges[event.outcome];
                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-mono text-sm text-zinc-300 whitespace-nowrap">
                          {formatTimestamp(event.timestamp)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-white">{event.customerName}</p>
                            <p className="text-xs text-zinc-400 font-mono">{event.customerId}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-zinc-300">{event.eventName}</TableCell>
                        <TableCell>
                          <Badge variant={badge.variant} className="gap-1">
                            {badge.icon} {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-400 max-w-[200px] truncate">
                          {event.idempotencyKey}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedEvent(event)}
                              className="h-8 w-8"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigator.clipboard.writeText(event.idempotencyKey)}
                              className="h-8 w-8"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Idempotency key: <code className="text-zinc-300 font-mono text-sm">{selectedEvent?.idempotencyKey}</code>
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Event ID</label>
                  <p className="font-mono text-sm text-white mt-1">{selectedEvent.id}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Customer</label>
                  <p className="text-sm text-white mt-1">{selectedEvent.customerName} <span className="text-zinc-400">({selectedEvent.customerId})</span></p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Event Name</label>
                  <p className="font-mono text-sm text-white mt-1">{selectedEvent.eventName}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Timestamp</label>
                  <p className="text-sm text-white mt-1">{formatTimestamp(selectedEvent.timestamp)}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Outcome</label>
                  <Badge variant={outcomeBadges[selectedEvent.outcome].variant} className="mt-1 gap-1">
                    {outcomeBadges[selectedEvent.outcome].icon} {outcomeBadges[selectedEvent.outcome].label}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Properties (JSON)</label>
                <div className="mt-2 p-4 bg-zinc-950 border border-zinc-800 rounded-lg max-h-96 overflow-auto">
                  <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                    {JSON.stringify(selectedEvent.properties, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}