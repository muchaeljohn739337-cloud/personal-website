"use client";

import { AIThreatMonitor } from "@/components/admin/AISecurityWidgets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Shield,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface SecurityStatus {
  guardian_active: boolean;
  anti_detect_active: boolean;
  protect_mode: boolean;
  threat_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  active_threats: number;
  pending_approvals: number;
  threat_intelligence: {
    blocked_ips: number;
    attack_patterns: number;
    forensic_entries: number;
  };
}

interface Approval {
  id: string;
  operation_type: string;
  description: string;
  user?: { email: string; name?: string };
  created_at: string;
  expires_at: string;
  requires_admin: boolean;
  requires_2fa: boolean;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  ip_address?: string;
  created_at: string;
  action_taken?: string;
}

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at: string;
}

export default function SecurityDashboard() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [statusRes, approvalsRes, eventsRes, ipsRes] = await Promise.all([
        fetch("/api/admin/security/status"),
        fetch("/api/admin/security/approvals?status=PENDING"),
        fetch("/api/admin/security/events?limit=20"),
        fetch("/api/admin/security/blocked-ips"),
      ]);

      if (statusRes.ok) setStatus(await statusRes.json());
      if (approvalsRes.ok) setApprovals(await approvalsRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (ipsRes.ok) setBlockedIPs(await ipsRes.json());

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch security data:", error);
      setLoading(false);
    }
  }

  async function handleApproval(approvalId: string, approved: boolean) {
    const reason = approved
      ? prompt("Approval reason (optional):") || "Approved by admin"
      : prompt("Rejection reason (required):");

    if (!approved && !reason) return;

    try {
      const res = await fetch(`/api/admin/security/approvals/${approvalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, reason }),
      });

      if (res.ok) {
        await fetchData();
      } else {
        alert("Failed to process approval");
      }
    } catch (error) {
      alert("Error processing approval");
    }
  }

  async function handleUnblockIP(ip: string) {
    if (!confirm(`Unblock IP ${ip}?`)) return;

    try {
      const res = await fetch(`/api/admin/security/unblock-ip/${ip}`, {
        method: "POST",
      });

      if (res.ok) {
        await fetchData();
      } else {
        alert("Failed to unblock IP");
      }
    } catch (error) {
      alert("Error unblocking IP");
    }
  }

  async function disableProtectMode() {
    if (
      !confirm(
        "Disable Protect Mode? This should only be done if threats are resolved.",
      )
    )
      return;

    try {
      const res = await fetch("/api/admin/security/disable-protect-mode", {
        method: "POST",
      });

      if (res.ok) {
        await fetchData();
      } else {
        alert("Failed to disable protect mode");
      }
    } catch (error) {
      alert("Error disabling protect mode");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 animate-pulse mx-auto mb-4" />
          <p>Loading Security Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-center">
              Security system not responding. Check backend.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getThreatColor = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      CRITICAL: "destructive",
      HIGH: "destructive",
      MEDIUM: "default",
      LOW: "secondary",
    };
    return variants[severity] || "secondary";
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security Control Center
          </h1>
          <p className="text-muted-foreground">
            Guardian AI + Anti-Detect Layer Protection
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-lg py-2 px-4">
            <div
              className={`w-2 h-2 rounded-full ${getThreatColor(
                status.threat_level,
              )} mr-2`}
            />
            Threat Level: {status.threat_level}
          </Badge>
        </div>
      </div>

      {/* AI-Powered Threat Intelligence */}
      <AIThreatMonitor />

      {/* Protect Mode Alert */}
      {status.protect_mode && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="text-xl font-bold text-red-900">
                    🚨 PROTECT MODE ACTIVE
                  </h3>
                  <p className="text-red-700">
                    System locked down due to critical threat detection
                  </p>
                </div>
              </div>
              <Button variant="destructive" onClick={disableProtectMode}>
                Disable Protect Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Guardian AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {status.guardian_active ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    Active
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">
                    Inactive
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Anti-Detect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {status.anti_detect_active ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    Active
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">
                    Inactive
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Active Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{status.active_threats}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-3xl font-bold text-yellow-600">
                {status.pending_approvals}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Intelligence */}
      <Card>
        <CardHeader>
          <CardTitle>Threat Intelligence</CardTitle>
          <CardDescription>Real-time security metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600">
                {status.threat_intelligence.blocked_ips}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Blocked IPs</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">
                {status.threat_intelligence.attack_patterns}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Attack Patterns
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">
                {status.threat_intelligence.forensic_entries}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Forensic Entries
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="approvals">
            Pending Approvals ({approvals.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            Security Events ({events.length})
          </TabsTrigger>
          <TabsTrigger value="blocked">
            Blocked IPs ({blockedIPs.length})
          </TabsTrigger>
        </TabsList>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          {approvals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending approvals</p>
              </CardContent>
            </Card>
          ) : (
            approvals.map((approval) => (
              <Card key={approval.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge>{approval.operation_type}</Badge>
                        {approval.requires_2fa && (
                          <Badge variant="outline">2FA Required</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">
                        {approval.description}
                      </h3>
                      {approval.user && (
                        <p className="text-sm text-muted-foreground">
                          Requested by:{" "}
                          {approval.user.name || approval.user.email}
                        </p>
                      )}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>
                          Created:{" "}
                          {new Date(approval.created_at).toLocaleString()}
                        </span>
                        <span>
                          Expires:{" "}
                          {new Date(approval.expires_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproval(approval.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleApproval(approval.id, false)}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getSeverityBadge(event.severity)}>
                        {event.severity}
                      </Badge>
                      <span className="font-mono text-sm">
                        {event.event_type}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {event.ip_address && <span>IP: {event.ip_address}</span>}
                      <span>{new Date(event.created_at).toLocaleString()}</span>
                      {event.action_taken && (
                        <span>Action: {event.action_taken}</span>
                      )}
                    </div>
                  </div>
                  <Eye className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Blocked IPs Tab */}
        <TabsContent value="blocked" className="space-y-4">
          {blockedIPs.map((blocked) => (
            <Card key={blocked.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-mono font-semibold text-lg mb-1">
                      {blocked.ip_address}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {blocked.reason}
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>
                        Blocked: {new Date(blocked.blocked_at).toLocaleString()}
                      </span>
                      <span>
                        Expires: {new Date(blocked.expires_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblockIP(blocked.ip_address)}
                  >
                    Unblock
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
