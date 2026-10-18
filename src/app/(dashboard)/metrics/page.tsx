"use client";

import * as React from "react";
import { Plus, Search, Filter, Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface BillableMetric {
  id: string;
  name: string;
  code: string;
  aggregationType: "COUNT" | "SUM" | "MAX" | "UNIQUE_COUNT";
  aggregationProperty?: string;
  dimensionFilters: Record<string, string>;
  unitName: string;
  createdAt: string;
}

const mockMetrics: BillableMetric[] = [
  {
    id: "met_001",
    name: "LLM Input Tokens",
    code: "llm_input_tokens",
    aggregationType: "SUM",
    aggregationProperty: "tokens",
    dimensionFilters: { type: "input", model: "gpt-4o" },
    unitName: "tokens",
    createdAt: "2026-01-10T10:00:00Z",
  },
  {
    id: "met_002",
    name: "LLM Output Tokens",
    code: "llm_output_tokens",
    aggregationType: "SUM",
    aggregationProperty: "tokens",
    dimensionFilters: { type: "output", model: "gpt-4o" },
    unitName: "tokens",
    createdAt: "2026-01-10T10:00:00Z",
  },
  {
    id: "met_003",
    name: "API Calls",
    code: "api_calls",
    aggregationType: "COUNT",
    dimensionFilters: {},
    unitName: "calls",
    createdAt: "2026-01-08T14:30:00Z",
  },
  {
    id: "met_004",
    name: "Storage (GB)",
    code: "storage_gb",
    aggregationType: "MAX",
    aggregationProperty: "gb",
    dimensionFilters: {},
    unitName: "GB",
    createdAt: "2026-01-05T09:15:00Z",
  },
  {
    id: "met_005",
    name: "Unique Users",
    code: "unique_users",
    aggregationType: "UNIQUE_COUNT",
    aggregationProperty: "user_id",
    dimensionFilters: {},
    unitName: "users",
    createdAt: "2026-01-12T16:45:00Z",
  },
];

const aggregationLabels = {
  COUNT: "Count",
  SUM: "Sum",
  MAX: "Max",
  UNIQUE_COUNT: "Unique Count",
};

export default function MetricsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [aggregationFilter, setAggregationFilter] = React.useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingMetric, setEditingMetric] = React.useState<BillableMetric | null>(null);

  const formState = React.useRef({
    name: "",
    code: "",
    aggregationType: "COUNT" as "COUNT" | "SUM" | "MAX" | "UNIQUE_COUNT",
    aggregationProperty: "",
    dimensionFilters: "",
    unitName: "units",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Create/Update metric:", formState.current);
    setIsCreateOpen(false);
    setEditingMetric(null);
    // Reset form
    formState.current = {
      name: "",
      code: "",
      aggregationType: "COUNT",
      aggregationProperty: "",
      dimensionFilters: "",
      unitName: "units",
    };
  };

  const handleEdit = (metric: BillableMetric) => {
    formState.current = {
      name: metric.name,
      code: metric.code,
      aggregationType: metric.aggregationType,
      aggregationProperty: metric.aggregationProperty || "",
      dimensionFilters: JSON.stringify(metric.dimensionFilters, null, 2),
      unitName: metric.unitName,
    };
    setEditingMetric(metric);
    setIsCreateOpen(true);
  };

  const handleNew = () => {
    formState.current = {
      name: "",
      code: "",
      aggregationType: "COUNT",
      aggregationProperty: "",
      dimensionFilters: "{}",
      unitName: "units",
    };
    setEditingMetric(null);
    setIsCreateOpen(true);
  };

  const filteredMetrics = React.useMemo(() => {
    return mockMetrics.filter((metric) => {
      if (searchQuery && !metric.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !metric.code.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (aggregationFilter !== "all" && metric.aggregationType !== aggregationFilter) {
        return false;
      }
      return true;
    });
  }, [searchQuery, aggregationFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Billable Metrics</h1>
          <p className="text-zinc-400 mt-1">Define how raw events translate into billable quantities</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Metric
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockMetrics.map((metric) => (
          <Card key={metric.id} className="hover:border-zinc-700 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{metric.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {metric.aggregationType}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400 font-mono mb-1">{metric.code}</p>
                  <p className="text-xs text-zinc-500">Unit: {metric.unitName}</p>
                  {metric.aggregationProperty && (
                    <p className="text-xs text-zinc-500 mt-1">Property: {metric.aggregationProperty}</p>
                  )}
                  {Object.keys(metric.dimensionFilters).length > 0 && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Filters: {Object.entries(metric.dimensionFilters).map(([k, v]) => `${k}=${v}`).join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-zinc-800">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(metric)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-rose-400 hover:text-rose-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {mockMetrics.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-400 mb-4">No billable metrics defined yet</p>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Metric
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Metric Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMetric ? "Edit Metric" : "Create New Metric"}</DialogTitle>
            <DialogDescription>
              Define how raw events are aggregated into billable quantities for pricing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., LLM Input Tokens"
                    value={formState.current.name}
                    onChange={(e) => (formState.current.name = e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Code (Event Name)</Label>
                  <Input
                    id="code"
                    placeholder="e.g., llm_input_tokens"
                    value={formState.current.code}
                    onChange={(e) => (formState.current.code = e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label htmlFor="aggregationType">Aggregation Type</Label>
                  <Select
                    value={formState.current.aggregationType}
                    onValueChange={(v) => (formState.current.aggregationType = v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select aggregation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COUNT">Count — Number of events</SelectItem>
                      <SelectItem value="SUM">Sum — Sum of a numeric property</SelectItem>
                      <SelectItem value="MAX">Max — Maximum value of a property</SelectItem>
                      <SelectItem value="UNIQUE_COUNT">Unique Count — Distinct values of a property</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unitName">Unit Name</Label>
                  <Input
                    id="unitName"
                    placeholder="e.g., tokens, calls, GB"
                    value={formState.current.unitName}
                    onChange={(e) => (formState.current.unitName = e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="aggregationProperty">Aggregation Property (for SUM, MAX, UNIQUE_COUNT)</Label>
                <Input
                  id="aggregationProperty"
                  placeholder="e.g., tokens, latency_ms, user_id"
                  value={formState.current.aggregationProperty}
                  onChange={(e) => (formState.current.aggregationProperty = e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dimensionFilters">Dimension Filters (JSON)</Label>
                <Input
                  id="dimensionFilters"
                  placeholder='e.g., {"model": "gpt-4o", "type": "input"}'
                  value={formState.current.dimensionFilters}
                  onChange={(e) => (formState.current.dimensionFilters = e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingMetric ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}