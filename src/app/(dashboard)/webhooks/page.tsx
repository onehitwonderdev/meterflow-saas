"use client";

import * as React from "react";
import { Plus, Search, Filter, ChevronDown, ChevronRight, Eye, Download, RefreshCw, Shield, AlertTriangle, CheckCircle, X, Copy, RotateCcw } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatMicroDollars } from "@/lib/utils";

interface WebhookEndpoint {
  id: string;
  url: string;
  signingSecret: string;
  subscribedEvents: string[];
  isActive: boolean;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: "PENDING" | "DELIVERED" | "FAILED" | "DEAD_LETTER";
  attemptCount: number;
  responseStatus?: number;
  responseBody?: string;
  nextRetryAt?: string;
  createdAt: string;
}

const mockEndpoints: WebhookEndpoint[] = [
  {
    id: "we_001",
    url: "https://techcorp.io/webhooks/meterflow",
    signingSecret: "demo-signing-secret-endpoint-001",
    subscribedEvents: ["usage.threshold_breached", "invoice.finalized", "customer.blocked"],
    isActive: true,
    createdAt: "2026-01-10T10:00:00Z",
  },
  {
    id: "we_002",
    url: "https://dataflow.io/billing/webhooks",
    signingSecret: "demo-signing-secret-endpoint-002",
    subscribedEvents: ["invoice.finalized", "invoice.paid", "customer.created"],
    isActive: true,
    createdAt: "2026-01-12T14:30:00Z",
  },
  {
    id: "we_003",
    url: "https://internal.company.com/meterflow-events",
    signingSecret: "demo-signing-secret-endpoint-003",
    subscribedEvents: ["usage.threshold_breached", "customer.blocked"],
    isActive: false,
    createdAt: "2026-01-15T09:15:00Z",
  },
];

const mockDeliveries: WebhookDelivery[] = [
  {
    id: "wd_001",
    endpointId: "we_001",
    eventType: "usage.threshold_breached",
    payload: { customer_id: "cus_001", metric: "llm_input_tokens", current_spend: 42500000000, threshold: 40000000000 },
    status: "DELIVERED",
    attemptCount: 1,
    responseStatus: 200,
    responseBody: "OK",
    createdAt: "2026-01-15T14:32:18Z",
  },
  {
    id: "wd_002",
    endpointId: "we_001",
    eventType: "invoice.finalized",
    payload: { invoice_id: "inv_001", customer_id: "cus_001", total: 40000000000 },
    status: "DELIVERED",
    attemptCount: 1,
    responseStatus: 200,
    responseBody: "OK",
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "wd_003",
    endpointId: "we_002",
    eventType: "invoice.finalized",
    payload: { invoice_id: "inv_002", customer_id: "cus_002", total: 22500000000 },
    status: "FAILED",
    attemptCount: 3,
    responseStatus: 500,
    responseBody: "Internal Server Error",
    nextRetryAt: "2026-02-01T10:30:00Z",
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "wd_004",
    endpointId: "we_001",
    eventType: "customer.blocked",
    payload: { customer_id: "cus_004", reason: "hard_cap_exceeded" },
    status: "DEAD_LETTER",
    attemptCount: 5,
    responseStatus: 404,
    responseBody: "Not Found",
    createdAt: "2026-01-15T14:28:33Z",
  },
  {
    id: "wd_005",
    endpointId: "we_002",
    eventType: "invoice.paid",
    payload: { invoice_id: "inv_001", customer_id: "cus_001", amount: 40000000000 },
    status: "PENDING",
    attemptCount: 0,
    createdAt: "2026-02-03T14:22:00Z",
  },
];

const eventTypes = [
  "usage.threshold_breached",
  "invoice.finalized",
  "invoice.paid",
  "invoice.voided",
  "customer.created",
  "customer.blocked",
  "customer.unblocked",
  "credit.granted",
  "credit.expired",
];

const deliveryStatusConfig = {
  PENDING: { variant: "warning" as const, label: "Pending", icon: AlertTriangle },
  DELIVERED: { variant: "success" as const, label: "Delivered", icon: CheckCircle },
  FAILED: { variant: "destructive" as const, label: "Failed", icon: X },
  DEAD_LETTER: { variant: "secondary" as const, label: "Dead Letter", icon: Shield },
};

export default function WebhooksPage() {
  const [activeTab, setActiveTab] = React.useState<"endpoints" | "deliveries">("endpoints");
  const [isCreateEndpointOpen, setIsCreateEndpointOpen] = React.useState(false);
  const [selectedDelivery, setSelectedDelivery] = React.useState<WebhookDelivery | null>(null);

  const handleReplayDelivery = (delivery: WebhookDelivery) => {
    console.log("Replay delivery:", delivery.id);
    // In real implementation, this would call the replay API
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Outbound Webhooks</h1>
          <p className="text-zinc-400 mt-1">Manage webhook endpoints and inspect delivery attempts</p>
        </div>
        <Button onClick={() => setIsCreateEndpointOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Endpoint
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as "endpoints" | "deliveries")}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="deliveries">Delivery Logs</TabsTrigger>
        </TabsList>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockEndpoints.map((endpoint) => (
              <Card key={endpoint.id} className="hover:border-zinc-700 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{new URL(endpoint.url).hostname}</CardTitle>
                      <p className="text-sm text-zinc-400 font-mono truncate">{endpoint.url}</p>
                    </div>
                    <Badge variant={endpoint.isActive ? "success" : "secondary"}>
                      {endpoint.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Subscribed Events</p>
                    <div className="flex flex-wrap gap-1">
                      {endpoint.subscribedEvents.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Signing Secret</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono text-zinc-300 bg-zinc-900 px-2 py-1 rounded break-all">
                        {endpoint.signingSecret}
                      </code>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigator.clipboard.writeText(endpoint.signingSecret)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-zinc-800">
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => console.log("Test", endpoint.id)}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => console.log("Edit", endpoint.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 text-rose-400 hover:text-rose-300" onClick={() => console.log("Delete", endpoint.id)}>
                      <X className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {mockEndpoints.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-zinc-400 mb-4">No webhook endpoints configured</p>
                <Button onClick={() => setIsCreateEndpointOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Endpoint
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Deliveries Tab */}
        <TabsContent value="deliveries" className="mt-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value="all" onValueChange={() => {}}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Event Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Event Types</SelectItem>
                    {eventTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value="all" onValueChange={() => {}}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="DEAD_LETTER">Dead Letter</SelectItem>
                  </SelectContent>
                </Select>
                <Select value="all" onValueChange={() => {}}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Endpoints" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Endpoints</SelectItem>
                    {mockEndpoints.map((ep) => (
                      <SelectItem key={ep.id} value={ep.id}>{new URL(ep.url).hostname}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Deliveries Table */}
          <Card>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Attempts</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDeliveries.map((delivery) => {
                      const endpoint = mockEndpoints.find((ep) => ep.id === delivery.endpointId);
                      const statusConfig = deliveryStatusConfig[delivery.status];
                      return (
                        <TableRow key={delivery.id}>
                          <TableCell className="font-mono text-sm whitespace-nowrap">
                            {new Date(delivery.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{delivery.eventType}</TableCell>
                          <TableCell>
                            <p className="text-sm text-white">{endpoint ? new URL(endpoint.url).hostname : "Unknown"}</p>
                            <p className="text-xs text-zinc-400 font-mono">{delivery.endpointId}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusConfig.variant} className="gap-1">
                              <statusConfig.icon className="h-3 w-3" /> {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {delivery.attemptCount}
                          </TableCell>
                          <TableCell>
                            {delivery.responseStatus ? (
                              <span className={cn(
                                "font-mono text-sm",
                                delivery.responseStatus >= 200 && delivery.responseStatus < 300 ? "text-emerald-400" : "text-rose-400"
                              )}>
                                {delivery.responseStatus}
                              </span>
                            ) : (
                              <span className="text-zinc-500">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedDelivery(delivery)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(delivery.status === "FAILED" || delivery.status === "DEAD_LETTER") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleReplayDelivery(delivery)}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Endpoint Dialog */}
      <Dialog open={isCreateEndpointOpen} onOpenChange={setIsCreateEndpointOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Webhook Endpoint</DialogTitle>
            <DialogDescription>
              Configure an HTTP endpoint to receive MeterFlow events. All deliveries are signed with HMAC-SHA256.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4 py-4">
            <div>
              <Label htmlFor="webhookUrl">Endpoint URL</Label>
              <Input id="webhookUrl" placeholder="https://your-app.com/webhooks/meterflow" required />
            </div>
            <div>
              <Label htmlFor="subscribedEvents">Subscribed Events</Label>
              <div className="grid gap-2 sm:grid-cols-2 mt-2">
                {eventTypes.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input type="checkbox" className="rounded border-zinc-700 text-emerald-600 focus:ring-emerald-500" defaultChecked={["usage.threshold_breached", "invoice.finalized"].includes(type)} />
                    {type}
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateEndpointOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Endpoint</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delivery Detail Dialog */}
      <Dialog open={!!selectedDelivery} onOpenChange={(open) => !open && setSelectedDelivery(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
            <DialogDescription>
              Event: <code className="text-zinc-300 font-mono text-sm">{selectedDelivery?.eventType}</code>
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Delivery ID</label>
                  <p className="font-mono text-sm text-white mt-1">{selectedDelivery.id}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Endpoint</label>
                  <p className="text-sm text-white mt-1">{mockEndpoints.find(ep => ep.id === selectedDelivery.endpointId)?.url || "Unknown"}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Event Type</label>
                  <p className="font-mono text-sm text-white mt-1">{selectedDelivery.eventType}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Status</label>
                  <Badge variant={deliveryStatusConfig[selectedDelivery.status].variant} className="mt-1 gap-1">
                    {React.createElement(deliveryStatusConfig[selectedDelivery.status].icon, { className: "h-3 w-3" })} {deliveryStatusConfig[selectedDelivery.status].label}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Attempts</label>
                  <p className="font-mono text-sm text-white mt-1">{selectedDelivery.attemptCount}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Response Status</label>
                  <p className="font-mono text-sm text-white mt-1">
                    {selectedDelivery.responseStatus ? selectedDelivery.responseStatus.toString() : "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Next Retry</label>
                  <p className="text-sm text-white mt-1">
                    {selectedDelivery.nextRetryAt ? new Date(selectedDelivery.nextRetryAt).toLocaleString() : "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Created</label>
                  <p className="text-sm text-white mt-1">{new Date(selectedDelivery.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Payload (JSON)</label>
                <div className="mt-2 p-4 bg-zinc-950 border border-zinc-800 rounded-lg max-h-96 overflow-auto">
                  <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                    {JSON.stringify(selectedDelivery.payload, null, 2)}
                  </pre>
                </div>
              </div>

              {selectedDelivery.responseBody && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Response Body</label>
                  <div className="mt-2 p-4 bg-zinc-950 border border-zinc-800 rounded-lg max-h-96 overflow-auto">
                    <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                      {selectedDelivery.responseBody}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
