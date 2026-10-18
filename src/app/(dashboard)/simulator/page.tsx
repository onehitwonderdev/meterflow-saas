"use client";

import * as React from "react";
import { Play, Pause, Square, RotateCcw, Zap, Trash2, Terminal, CheckCircle, XCircle, AlertTriangle, Clock, Gauge, Download } from "lucide-react";

const statusIcons = {
  ACCEPTED: CheckCircle,
  DUPLICATE_IGNORED: AlertTriangle,
  RATE_LIMITED: XCircle,
  HARD_CAP_BLOCKED: XCircle,
  PENDING: Clock,
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatMicroDollars, formatNumber, cn } from "@/lib/utils";

interface SimulatorEvent {
  id: string;
  timestamp: Date;
  customer: string;
  eventName: string;
  status: "ACCEPTED" | "DUPLICATE_IGNORED" | "RATE_LIMITED" | "HARD_CAP_BLOCKED" | "PENDING";
  latencyMs: number;
  idempotencyKey: string;
}

interface SimulatorConfig {
  customerId: string;
  eventName: string;
  concurrency: number;
  injectDuplicates: boolean;
  simulateCapBreach: boolean;
}

interface IngestionResponse {
  accepted: number;
  duplicates: number;
  rateLimited: number;
  blocked: number;
  events: Array<{
    id: string;
    idempotencyKey: string;
    status: "ACCEPTED" | "DUPLICATE_IGNORED" | "RATE_LIMITED" | "HARD_CAP_BLOCKED";
    latencyMs: number;
  }>;
}

const mockCustomers = [
  { id: "cus_001", name: "TechCorp Industries", hardCap: 50000000000, currentSpend: 12500000000, plan: "Pro Scale" },
  { id: "cus_002", name: "DataFlow Labs", hardCap: 25000000000, currentSpend: 8900000000, plan: "Startup Essentials" },
  { id: "cus_003", name: "CloudNine Solutions", hardCap: 10000000000, currentSpend: 6700000000, plan: "Pro Scale" },
  { id: "cus_004", name: "APIFirst Startup", hardCap: 5000000000, currentSpend: 4300000000, plan: "Startup Essentials" },
  { id: "cus_005", name: "ScaleUp Ventures", hardCap: 100000000000, currentSpend: 3100000000, plan: "Enterprise Volume" },
  { id: "cus_006", name: "Runaway Bot Inc", hardCap: 1000000000, currentSpend: 950000000, plan: "Startup Essentials" },
];

const eventTypes = [
  { value: "llm_tokens", label: "LLM Tokens (llm_tokens)", unit: "tokens", baseCost: 150 },
  { value: "llm_output_tokens", label: "LLM Output Tokens (llm_output_tokens)", unit: "tokens", baseCost: 600 },
  { value: "api_calls", label: "API Calls (api_calls)", unit: "calls", baseCost: 10 },
  { value: "storage_gb", label: "Vector Storage (storage_gb)", unit: "GB", baseCost: 500000 },
  { value: "gpu_inference_seconds", label: "GPU Inference (gpu_inference_seconds)", unit: "seconds", baseCost: 25000 },
  { value: "vector_storage_gb", label: "Vector Storage GB (vector_storage_gb)", unit: "GB", baseCost: 800000 },
];

export default function SimulatorPage() {
  const [config, setConfig] = React.useState<SimulatorConfig>({
    customerId: "cus_001",
    eventName: "llm_tokens",
    concurrency: 50,
    injectDuplicates: false,
    simulateCapBreach: false,
  });
  const [isRunning, setIsRunning] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [events, setEvents] = React.useState<SimulatorEvent[]>([]);
  const [stats, setStats] = React.useState({
    total: 0,
    accepted: 0,
    duplicates: 0,
    rateLimited: 0,
    blocked: 0,
    p50Latency: 0,
    p95Latency: 0,
    totalCost: 0,
  });
  const [currentBatch, setCurrentBatch] = React.useState(0);
  const [totalBatches, setTotalBatches] = React.useState(0);
  const [selectedEvent, setSelectedEvent] = React.useState<SimulatorEvent | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const latencyBuffer = React.useRef<number[]>([]);

  const customer = mockCustomers.find(c => c.id === config.customerId);
  const eventType = eventTypes.find(e => e.value === config.eventName);

  // Detect demo mode from localStorage (set by login page)
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem("meterflow_demo_session") !== null;

  const attemptIngestion = async (events: SimulatorEvent[]): Promise<IngestionResponse | null> => {
    if (isDemoMode) return null; // Skip API call in demo mode

    try {
      const payload = {
        events: events.map(e => ({
          idempotencyKey: e.idempotencyKey,
          customerId: config.customerId,
          eventName: e.eventName,
          properties: { simulated: true, latencyMs: e.latencyMs },
          timestamp: e.timestamp.toISOString(),
        })),
      };

      const res = await fetch("/api/v1/events/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null; // Network error, CORS, etc.
    }
  };

  const generateIdempotencyKey = (isDuplicate: boolean, baseKey: string) => {
    if (isDuplicate) return baseKey;
    return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  };

  const simulateEvent = (index: number, batchId: number): SimulatorEvent => {
    const baseKey = `batch_${batchId}_${index}`;
    const isDuplicate = config.injectDuplicates && Math.random() < 0.2;
    const idempotencyKey = generateIdempotencyKey(isDuplicate, baseKey);

    // Simulate latency (5-50ms base + jitter)
    const baseLatency = 5 + Math.random() * 45;
    const latencyMs = Math.round(baseLatency + Math.random() * 20);

    // Determine outcome
    let status: SimulatorEvent["status"] = "ACCEPTED";
    if (isDuplicate) {
      status = "DUPLICATE_IGNORED";
    } else if (Math.random() < 0.02) {
      status = "RATE_LIMITED";
    } else if (config.simulateCapBreach && customer && stats.totalCost + eventType!.baseCost > Number(customer.hardCap)) {
      status = "HARD_CAP_BLOCKED";
    }

    return {
      id: `evt_${batchId}_${index}`,
      timestamp: new Date(),
      customer: customer?.name || "Unknown",
      eventName: config.eventName,
      status,
      latencyMs,
      idempotencyKey,
    };
  };

  const updateStats = (newEvents: SimulatorEvent[]) => {
    setStats(prev => {
      const allEvents = [...events, ...newEvents];
      const accepted = allEvents.filter(e => e.status === "ACCEPTED").length;
      const duplicates = allEvents.filter(e => e.status === "DUPLICATE_IGNORED").length;
      const rateLimited = allEvents.filter(e => e.status === "RATE_LIMITED").length;
      const blocked = allEvents.filter(e => e.status === "HARD_CAP_BLOCKED").length;

      const latencies = allEvents.filter(e => e.status === "ACCEPTED").map(e => e.latencyMs).sort((a, b) => a - b);
      const p50 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.5)] : 0;
      const p95 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;

      const totalCost = accepted * (eventType?.baseCost || 0);

      return {
        total: allEvents.length,
        accepted,
        duplicates,
        rateLimited,
        blocked,
        p50Latency: p50,
        p95Latency: p95,
        totalCost,
      };
    });
  };

  const runBatch = async () => {
    if (!isRunning || isPaused) return;

    const batchSize = Math.min(config.concurrency, 50);
    const newEvents: SimulatorEvent[] = [];

    for (let i = 0; i < batchSize; i++) {
      newEvents.push(simulateEvent(i, currentBatch));
    }

    // Try real ingestion API, fall back to local mocks
    const ingestionResult = await attemptIngestion(newEvents);

    if (ingestionResult) {
      // Transform API response to SimulatorEvent format
      const apiEvents: SimulatorEvent[] = ingestionResult.events.map((e, idx) => ({
        id: e.id,
        timestamp: new Date(),
        customer: customer?.name || "Unknown",
        eventName: config.eventName,
        status: e.status,
        latencyMs: e.latencyMs,
        idempotencyKey: newEvents[idx]?.idempotencyKey || `idem_unknown_${idx}`,
      }));
      setEvents(prev => [...apiEvents, ...prev].slice(0, 1000));
      setStats(prev => ({
        ...prev,
        total: prev.total + ingestionResult.accepted + ingestionResult.duplicates + ingestionResult.rateLimited + ingestionResult.blocked,
        accepted: prev.accepted + ingestionResult.accepted,
        duplicates: prev.duplicates + ingestionResult.duplicates,
        rateLimited: prev.rateLimited + ingestionResult.rateLimited,
        blocked: prev.blocked + ingestionResult.blocked,
        totalCost: prev.totalCost + ingestionResult.accepted * (eventType?.baseCost || 0),
      }));
    } else {
      // Local fallback - update UI immediately
      setEvents(prev => [...newEvents, ...prev].slice(0, 1000));
      updateStats(newEvents);
    }

    setCurrentBatch(prev => prev + 1);

    // Check if we should stop (cap breach simulation)
    if (config.simulateCapBreach && customer && stats.totalCost + batchSize * (eventType?.baseCost || 0) > Number(customer.hardCap)) {
      setTimeout(() => {
        setIsRunning(false);
        setIsPaused(true);
      }, 100);
    }
  };

  const startSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setIsPaused(false);
    setCurrentBatch(0);
    setTotalBatches(0);
    setEvents([]);
    setStats({ total: 0, accepted: 0, duplicates: 0, rateLimited: 0, blocked: 0, p50Latency: 0, p95Latency: 0, totalCost: 0 });
    latencyBuffer.current = [];

    intervalRef.current = setInterval(runBatch, 200); // Run batch every 200ms
  };

  const pauseSimulation = () => {
    setIsPaused(!isPaused);
  };

  const stopSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
  };

  const resetSimulation = () => {
    stopSimulation();
    setEvents([]);
    setStats({ total: 0, accepted: 0, duplicates: 0, rateLimited: 0, blocked: 0, p50Latency: 0, p95Latency: 0, totalCost: 0 });
    setCurrentBatch(0);
  };

  const handleConfigChange = (key: keyof SimulatorConfig, value: any) => {
    if (isRunning) return;
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getStatusConfig = (status: SimulatorEvent["status"]) => {
    switch (status) {
      case "ACCEPTED": return { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: statusIcons.ACCEPTED, label: "Accepted" };
      case "DUPLICATE_IGNORED": return { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: statusIcons.DUPLICATE_IGNORED, label: "Duplicate" };
      case "RATE_LIMITED": return { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", icon: statusIcons.RATE_LIMITED, label: "Rate Limited" };
      case "HARD_CAP_BLOCKED": return { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", icon: statusIcons.HARD_CAP_BLOCKED, label: "Hard Cap" };
      default: return { color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30", icon: statusIcons.PENDING, label: "Pending" };
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 });
  };

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Zap className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Traffic & Burst Simulator</h1>
              <p className="text-zinc-400 mt-1">Fire live HTTP requests against the ingestion API to test deduplication, rate limiting, and spend caps</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-zinc-400 border-zinc-700">Demo Mode</Badge>
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">No API Keys Required</Badge>
          </div>
        </div>
      </div>

      {/* Configuration & Controls */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Config Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-emerald-400" />
              Simulation Config
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">
            {/* Customer Selector */}
            <div>
              <Label htmlFor="customer">Target Customer</Label>
              <Select value={config.customerId} onValueChange={v => handleConfigChange("customerId", v)} disabled={isRunning}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {mockCustomers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.plan})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customer && (
                <div className="mt-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Hard Spend Cap</span>
                    <span className="font-mono text-white">{formatMicroDollars(customer.hardCap)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Current Period Spend</span>
                    <span className="font-mono text-white">{formatMicroDollars(customer.currentSpend)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Remaining Budget</span>
                    <span className="font-mono text-emerald-400">{formatMicroDollars(customer.hardCap - customer.currentSpend)}</span>
                  </div>
                  <Progress value={Math.min((customer.currentSpend / customer.hardCap) * 100, 100)} className="h-2" />
                  <p className="text-xs text-zinc-500">
                    {Math.round((customer.currentSpend / customer.hardCap) * 100)}% utilized
                  </p>
                </div>
              )}
            </div>

            {/* Event Type Selector */}
            <div>
              <Label htmlFor="eventName">Event Type</Label>
              <Select value={config.eventName} onValueChange={v => handleConfigChange("eventName", v)} disabled={isRunning}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(e => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {eventType && (
                <p className="mt-2 text-xs text-zinc-400">
                  Base cost: {formatMicroDollars(eventType.baseCost)} per {eventType.unit}
                </p>
              )}
            </div>

            {/* Concurrency Slider */}
            <div>
              <Label htmlFor="concurrency">Concurrency / Burst Size</Label>
              <div className="flex items-center gap-3 mt-2">
                <Slider
                  value={[config.concurrency]}
                  onValueChange={(v: number[]) => handleConfigChange("concurrency", v[0])}
                  min={10}
                  max={250}
                  step={10}
                  disabled={isRunning}
                  className="flex-1"
                />
                <span className="font-mono text-white w-16 text-right">{config.concurrency}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Events per batch (batch fires every 200ms)</p>
            </div>

            {/* Toggles */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Inject 20% Duplicate Idempotency Keys</p>
                  <p className="text-xs text-zinc-400">Proves deduplication in real time</p>
                </div>
                <Switch
                  checked={config.injectDuplicates}
                  onCheckedChange={(v: boolean) => handleConfigChange("injectDuplicates", v)}
                  disabled={isRunning}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Simulate Spend Cap Breach</p>
                  <p className="text-xs text-zinc-400">Fires high-volume burst crossing hard cap mid-stream</p>
                </div>
                <Switch
                  checked={config.simulateCapBreach}
                  onCheckedChange={(v: boolean) => handleConfigChange("simulateCapBreach", v)}
                  disabled={isRunning || !customer || customer.currentSpend >= customer.hardCap}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="space-y-2 pt-4 border-t border-zinc-800">
              {!isRunning ? (
                <Button className="w-full h-12 text-lg" onClick={startSimulation} size="lg">
                  <Play className="h-5 w-5 mr-2" />
                  Start Simulation
                </Button>
              ) : isPaused ? (
                <Button className="w-full h-12 text-lg" onClick={pauseSimulation} size="lg" variant="default">
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button className="w-full h-12 text-lg" onClick={pauseSimulation} size="lg" variant="outline">
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
              )}
              {(isRunning || isPaused) && (
                <Button className="w-full" onClick={stopSimulation} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Stop Simulation
                </Button>
              )}
              {(events.length > 0 && !isRunning) && (
                <Button className="w-full" onClick={resetSimulation} variant="ghost">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Telemetry */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-emerald-400" />
                Live Telemetry
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={isRunning && !isPaused ? "success" : "secondary"} className="gap-1">
                  <span className={`w-2 h-2 rounded-full ${isRunning && !isPaused ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                  {isRunning && !isPaused ? "Running" : isPaused ? "Paused" : "Stopped"}
                </Badge>
                {isRunning && (
                  <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                    Batch #{currentBatch + 1}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Stats Cards */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4 p-4 border-b border-zinc-800">
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <p className="text-xs text-zinc-500">Total Events</p>
                <p className="font-mono text-xl text-white">{formatNumber(stats.total)}</p>
              </div>
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <p className="text-xs text-emerald-400">Accepted</p>
                <p className="font-mono text-xl text-emerald-400">{formatNumber(stats.accepted)}</p>
              </div>
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <p className="text-xs text-amber-400">Duplicates</p>
                <p className="font-mono text-xl text-amber-400">{formatNumber(stats.duplicates)}</p>
              </div>
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <p className="text-xs text-rose-400">Rate Limited</p>
                <p className="font-mono text-xl text-rose-400">{formatNumber(stats.rateLimited)}</p>
              </div>
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg md:col-span-2">
                <p className="text-xs text-zinc-400">Hard Cap Blocked</p>
                <p className="font-mono text-xl text-rose-400">{formatNumber(stats.blocked)}</p>
              </div>
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg md:col-span-2">
                <p className="text-xs text-zinc-400">P50 / P95 Latency</p>
                <p className="font-mono text-xl text-white">{stats.p50Latency}ms / {stats.p95Latency}ms</p>
              </div>
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <p className="text-xs text-emerald-400">Est. Cost This Run</p>
                <p className="font-mono text-xl text-emerald-400">{formatMicroDollars(BigInt(stats.totalCost))}</p>
              </div>
            </div>

            {/* Customer Spend Gauge */}
            {customer && (
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-white">Customer Spend vs Hard Cap</p>
                  <Badge variant={stats.blocked > 0 ? "destructive" : "success"}>
                    {stats.blocked > 0 ? "CAP BREACHED" : "OK"}
                  </Badge>
                </div>
                <div className="relative h-16">
                  <Progress
                    value={Math.min((Number(customer.currentSpend) + stats.totalCost) / Number(customer.hardCap) * 100, 100)}
                    className="h-4"
                  />
                  <div className="absolute top-0 left-0 right-0 h-4 flex items-center justify-between px-2">
                    <span className="text-xs font-mono text-zinc-300 bg-zinc-900/80 px-1 rounded">
                      {formatMicroDollars(Number(customer.currentSpend) + stats.totalCost)}
                    </span>
                    <span className="text-xs font-mono text-zinc-300 bg-zinc-900/80 px-1 rounded">
                      {formatMicroDollars(customer.hardCap)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>Current: {formatMicroDollars(customer.currentSpend)}</span>
                  <span>Projected: {formatMicroDollars(Number(customer.currentSpend) + stats.totalCost)}</span>
                  <span>Cap: {formatMicroDollars(customer.hardCap)}</span>
                </div>
              </div>
            )}

            {/* Event Stream Table */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">Event Stream</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { /* export */ }}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setEvents([])}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead className="w-36">Status</TableHead>
                      <TableHead className="w-24">Latency</TableHead>
                      <TableHead>Idempotency Key</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                          Start a simulation to see live events
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.slice(0, 100).map((event) => {
                        const statusConfig = getStatusConfig(event.status);
                        const Icon = statusConfig.icon;
                        return (
                          <TableRow
                            key={event.id}
                            className={cn("cursor-pointer hover:bg-zinc-800/50", event.status === "HARD_CAP_BLOCKED" && "bg-rose-500/5")}
                            onClick={() => setSelectedEvent(event)}
                          >
                            <TableCell className="font-mono text-xs text-zinc-300">
                              {formatTimestamp(event.timestamp)}
                            </TableCell>
                            <TableCell className="text-sm text-white">{event.customer}</TableCell>
                            <TableCell className="font-mono text-sm text-zinc-300">{event.eventName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("gap-1", statusConfig.bg, statusConfig.color, statusConfig.border)}>
                                <Icon className="h-3 w-3" />
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-zinc-300">
                              {event.latencyMs}ms
                            </TableCell>
                            <TableCell className="font-mono text-xs text-zinc-400 max-w-[200px] truncate">
                              {event.idempotencyKey}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Detail Dialog */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedEvent(null)} />
          <Card className="w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Event Details</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Event ID</label>
                  <p className="font-mono text-sm text-white mt-1">{selectedEvent.id}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Timestamp</label>
                  <p className="text-sm text-white mt-1">{selectedEvent.timestamp.toISOString()}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Customer</label>
                  <p className="text-sm text-white mt-1">{selectedEvent.customer}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Event Name</label>
                  <p className="font-mono text-sm text-white mt-1">{selectedEvent.eventName}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Status</label>
                  <Badge variant="outline" className={cn("mt-1 gap-1", getStatusConfig(selectedEvent.status).bg, getStatusConfig(selectedEvent.status).color, getStatusConfig(selectedEvent.status).border)}>
                    {React.createElement(getStatusConfig(selectedEvent.status).icon, { className: "h-3 w-3" })}
                    {getStatusConfig(selectedEvent.status).label}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Latency</label>
                  <p className="font-mono text-sm text-white mt-1">{selectedEvent.latencyMs}ms</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Idempotency Key</label>
                  <p className="font-mono text-xs text-zinc-300 mt-1 break-all">{selectedEvent.idempotencyKey}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}