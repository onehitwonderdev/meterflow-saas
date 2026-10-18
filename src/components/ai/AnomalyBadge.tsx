"use client";

import * as React from "react";
import { AlertTriangle, Zap, Brain, ChevronRight, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Anomaly {
  id: string;
  title: string;
  customerName: string;
  customerId: string;
  metricCode: string;
  zScore: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detectedAt: string;
  summaryMarkdown: string;
  rootCause: string;
  contributingFactors: string[];
  recommendedActions: string[];
  chartConfig?: { type: string; xAxisKey: string; yAxisKey: string };
}

interface AnomalyBadgeProps {
  anomalies: Anomaly[];
  onViewDetails?: (anomaly: Anomaly) => void;
}

const severityIcons = {
  LOW: AlertTriangle,
  MEDIUM: AlertTriangle,
  HIGH: Zap,
  CRITICAL: Zap,
};

const severityConfig = {
  LOW: { variant: "secondary" as const, color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30" },
  MEDIUM: { variant: "default" as const, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  HIGH: { variant: "destructive" as const, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  CRITICAL: { variant: "destructive" as const, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" },
};

export function AnomalyBadge({ anomalies, onViewDetails }: AnomalyBadgeProps) {
  const [selectedAnomaly, setSelectedAnomaly] = React.useState<Anomaly | null>(null);

  if (anomalies.length === 0) return null;

  const criticalCount = anomalies.filter((a) => a.severity === "CRITICAL").length;
  const highCount = anomalies.filter((a) => a.severity === "HIGH").length;

  return (
    <div className="space-y-3">
      {/* Summary Banner */}
      {(criticalCount > 0 || highCount > 0) && (
        <Card className={cn("border-l-4", criticalCount > 0 ? "border-l-rose-500" : "border-l-orange-500", "bg-zinc-900/50")}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn("p-2 rounded-lg flex-shrink-0", criticalCount > 0 ? "bg-rose-500/20" : "bg-orange-500/20")}>
                {criticalCount > 0 ? <Zap className="h-5 w-5 text-rose-400" /> : <Zap className="h-5 w-5 text-orange-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">
                  {criticalCount > 0
                    ? `${criticalCount} critical anomal${criticalCount === 1 ? "y" : "ies"} detected`
                    : `${highCount} high-severity anomal${highCount === 1 ? "y" : "ies"} detected`}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  Immediate attention recommended. Click to investigate root causes.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAnomaly(anomalies.find((a) => a.severity === "CRITICAL" || a.severity === "HIGH") || null)}
                className={cn("text-sm", criticalCount > 0 ? "text-rose-400 hover:text-rose-300" : "text-orange-400 hover:text-orange-300")}
              >
                View Details
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomaly Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {anomalies.slice(0, 6).map((anomaly) => {
          const config = severityConfig[anomaly.severity];
          const Icon = severityIcons[anomaly.severity];

          return (
            <Card
              key={anomaly.id}
              className={cn(
                "hover:border-zinc-700 transition-colors cursor-pointer",
                config.border,
                "bg-zinc-900/50"
              )}
              onClick={() => setSelectedAnomaly(anomaly)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("p-1.5 rounded", config.bg)}>
                        {React.createElement(Icon, { className: cn("h-3 w-3", config.color) })}
                      </div>
                      <Badge
                        variant={config.variant}
                        className={cn("text-xs", config.color)}
                      >
                        {anomaly.severity}
                      </Badge>
                      <span className="text-xs text-zinc-500">Z: {anomaly.zScore.toFixed(1)}</span>
                    </div>
                    <h4 className="font-medium text-white truncate mb-1">{anomaly.title}</h4>
                    <p className="text-xs text-zinc-400 font-mono">{anomaly.customerName} • {anomaly.metricCode}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(anomaly.detectedAt).toLocaleString()}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {anomalies.length > 6 && (
        <Button variant="ghost" size="sm" className="w-full text-zinc-400 hover:text-zinc-300">
          +{anomalies.length - 6} more anomalies
        </Button>
      )}

      {/* Anomaly Detail Dialog */}
      <Dialog open={!!selectedAnomaly} onOpenChange={(open) => !open && setSelectedAnomaly(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          {selectedAnomaly && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded", severityConfig[selectedAnomaly.severity].bg)}>
                        {React.createElement(severityIcons[selectedAnomaly.severity], { className: cn("h-4 w-4", severityConfig[selectedAnomaly.severity].color) })}
                      </div>
                      {selectedAnomaly.title}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Badge variant={severityConfig[selectedAnomaly.severity].variant} className={severityConfig[selectedAnomaly.severity].color}>
                        {selectedAnomaly.severity}
                      </Badge>
                      <span className="text-zinc-400">Z-Score: {selectedAnomaly.zScore.toFixed(1)}</span>
                      <span className="text-zinc-400">•</span>
                      <span className="text-zinc-400 font-mono">{selectedAnomaly.customerName}</span>
                    </DialogDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedAnomaly(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Summary */}
                <div className="prose prose-invert prose-sm max-w-none text-zinc-300 border border-zinc-800 rounded-lg p-4 bg-zinc-950">
                  {selectedAnomaly.summaryMarkdown.split("\n").map((line, i) => {
                    if (line.startsWith("## ")) {
                      return <h3 key={i} className="text-lg font-semibold text-white mt-4 mb-2">{line.slice(3)}</h3>;
                    }
                    if (line.startsWith("### ")) {
                      return <h4 key={i} className="text-base font-medium text-white mt-3 mb-1">{line.slice(4)}</h4>;
                    }
                    if (line.startsWith("- ") || line.startsWith("* ")) {
                      return <li key={i} className="ml-4 mb-1">{line.slice(2)}</li>;
                    }
                    if (line.trim() === "") {
                      return <br key={i} />;
                    }
                    return <p key={i} className="mb-2">{line}</p>;
                  })}
                </div>

                <Separator />

                {/* Root Cause */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                    <Brain className="h-4 w-4 text-emerald-400" />
                    Root Cause Analysis
                  </h4>
                  <p className="text-zinc-300 text-sm bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                    {selectedAnomaly.rootCause}
                  </p>
                </div>

                {/* Contributing Factors */}
                {selectedAnomaly.contributingFactors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-2">Contributing Factors</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAnomaly.contributingFactors.map((factor, i) => (
                        <Badge key={i} variant="outline" className="text-xs text-zinc-300 border-zinc-700">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Actions */}
                {selectedAnomaly.recommendedActions.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                      <Zap className="h-4 w-4 text-emerald-400" />
                      Recommended Actions
                    </h4>
                    <div className="space-y-2">
                      {selectedAnomaly.recommendedActions.map((action, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg"
                        >
                          <span className="text-emerald-400 mt-0.5">→</span>
                          <p className="text-sm text-zinc-300 flex-1">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chart Config */}
                {selectedAnomaly.chartConfig && (
                  <div className="pt-4 border-t border-zinc-800">
                    <h4 className="text-sm font-medium text-white mb-2">Suggested Visualization</h4>
                    <Badge variant="outline" className="gap-1 text-zinc-300 border-zinc-700">
                      {selectedAnomaly.chartConfig.type} chart: {selectedAnomaly.chartConfig.xAxisKey} vs {selectedAnomaly.chartConfig.yAxisKey}
                    </Badge>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inline anomaly cards for overview page
export function InlineAnomalyCards({ anomalies, maxVisible = 3, onViewDetails }: { anomalies: Anomaly[]; maxVisible?: number; onViewDetails?: (anomaly: Anomaly) => void }) {
  if (anomalies.length === 0) return null;

  return (
    <Card className="border-l-4 border-amber-500/50 bg-zinc-900/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Anomalies Detected
          </CardTitle>
          <Badge variant="outline" className="text-amber-400 border-amber-500/30">
            {anomalies.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {anomalies.slice(0, maxVisible).map((anomaly) => {
            const config = severityConfig[anomaly.severity];
            const Icon = severityIcons[anomaly.severity];

            return (
              <Button
                key={anomaly.id}
                variant="ghost"
                className={cn("w-full justify-start gap-3 p-3 hover:bg-zinc-800/50", config.border)}
                onClick={() => onViewDetails?.(anomaly)}
              >
                <div className={cn("p-1.5 rounded", config.bg)}>
                  {React.createElement(Icon, { className: cn("h-4 w-4", config.color) })}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-white truncate">{anomaly.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{anomaly.customerName} • {anomaly.metricCode}</p>
                </div>
                <Badge variant={config.variant} className={cn("text-xs", config.color)}>
                  {anomaly.severity}
                </Badge>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Button>
            );
          })}
        </div>
        {anomalies.length > maxVisible && (
          <Button variant="ghost" size="sm" className="w-full mt-2 text-zinc-400 hover:text-zinc-300">
            View all {anomalies.length} anomalies
          </Button>
        )}
      </CardContent>
    </Card>
  );
}