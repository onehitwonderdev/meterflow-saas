"use client";

import * as React from "react";
import { Search, Mic, Sparkles, X, Loader2, Filter as FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NaturalLanguageSearchProps {
  onFilterChange: (filters: Record<string, unknown>, humanReadable: string) => void;
  currentFilters: Record<string, unknown>;
  schema: "events" | "customers" | "invoices" | "metrics";
  placeholder?: string;
}

const EXAMPLE_QUERIES = {
  events: [
    "show me rate limited events for TechCorp last week",
    "duplicate events from the last 7 days",
    "hard cap blocked events",
    "accepted llm token events yesterday",
  ],
  customers: [
    "active customers on Pro plan",
    "past due customers over $10k",
    "churned customers last quarter",
    "customers with spend over 50000",
  ],
  invoices: [
    "draft invoices this month",
    "unpaid invoices over 10000",
    "finalized invoices january 2026",
    "void invoices last week",
  ],
  metrics: [
    "metrics with graduated tiered pricing",
    "per unit pricing metrics",
    "metrics with free units over 1000000",
    "sum aggregation metrics",
  ],
};

export function NaturalLanguageSearch({
  onFilterChange,
  currentFilters,
  schema,
  placeholder = "Search with natural language...",
}: NaturalLanguageSearchProps) {
  const [query, setQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showExamples, setShowExamples] = React.useState(false);
  const [appliedFilter, setAppliedFilter] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naturalLanguage: query,
          schema,
          orgId: "00000000-0000-0000-0000-000000000000", // Demo org
        }),
      });

      const data = await response.json();
      if (data.filters && data.humanReadable) {
        onFilterChange(data.filters, data.humanReadable);
        setAppliedFilter(data.humanReadable);
        setShowExamples(false);
      }
    } catch (error) {
      console.error("Natural language search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    handleSearch();
  };

  const clearFilter = () => {
    onFilterChange({}, "");
    setAppliedFilter(null);
    setQuery("");
  };

  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  return (
    <div className="relative">
      <Popover open={showExamples} onOpenChange={setShowExamples}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500">
              <Sparkles className="h-4 w-4" />
            </div>
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value) setShowExamples(true);
              }}
              onFocus={() => setShowExamples(true)}
              onBlur={() => setTimeout(() => setShowExamples(false), 200)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10"
              disabled={isLoading}
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-8 top-1/2 -translate-y-1/2 h-8 w-8 text-zinc-500 hover:text-zinc-300"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-zinc-500 hover:text-zinc-300"
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-[320px] p-2"
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <div className="space-y-1">
            <p className="px-2 py-1 text-xs text-zinc-500 uppercase tracking-wider">
              Try asking:
            </p>
            {EXAMPLE_QUERIES[schema].map((example, i) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left px-2 py-1.5 text-xs hover:bg-zinc-800"
                onClick={() => handleExampleClick(example)}
              >
                {example}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter display */}
      {(appliedFilter || hasActiveFilters) && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
            <FilterIcon className="h-3 w-3" />
            {appliedFilter || "Custom filters applied"}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 text-emerald-300 hover:text-emerald-200"
              onClick={clearFilter}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
      )}
    </div>
  );
}