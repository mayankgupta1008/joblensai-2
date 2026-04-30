import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lock, Smartphone, Monitor, ShieldCheck, Fingerprint, History } from "lucide-react";
import axiosWrapper from "@/lib/axiosWrapper";

type Session = {
  sid: string;
  deviceName: string | null;
  ip: string | null;
  lastUsedAt: string;
  current: boolean;
};

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const formatRelative = (iso: string): string => {
  const diffSec = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diffSec);
  if (abs < 60) return "Active now";
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  return rtf.format(Math.round(diffSec / 86400), "day");
};

const SecurityTab = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingSid, setRevokingSid] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axiosWrapper.get<Session[]>("/auth/sessions");
        if (!cancelled) setSessions(data);
      } catch {
        if (!cancelled) toast.error("Failed to load active sessions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRevoke = async (sid: string) => {
    setRevokingSid(sid);
    try {
      await axiosWrapper.delete(`/auth/sessions/${sid}`);
      setSessions((prev) => prev.filter((s) => s.sid !== sid));
      toast.success("Session revoked");
    } catch {
      toast.error("Failed to revoke session");
    } finally {
      setRevokingSid(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-brand-border bg-background/40 backdrop-blur-xl rounded-[2rem] shadow-xl overflow-hidden">
        <CardHeader className="p-8 border-b border-brand-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">
                Security Preferences
              </CardTitle>
              <CardDescription className="font-medium">
                Secure your account with the latest safety protocols.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          {/* Change Password */}
          <div className="space-y-6">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-500" />
              Update Password
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6 max-w-md">
                <div className="space-y-3">
                  <Label className="text-sm font-bold tracking-tight ml-1">Current Password</Label>
                  <Input
                    type="password"
                    className="h-12 rounded-2xl bg-muted/30 border-brand-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold tracking-tight ml-1">New Password</Label>
                  <Input
                    type="password"
                    className="h-12 rounded-2xl bg-muted/30 border-brand-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold tracking-tight ml-1">
                    Confirm New Password
                  </Label>
                  <Input
                    type="password"
                    className="h-12 rounded-2xl bg-muted/30 border-brand-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                  />
                </div>
                <Button className="h-12 px-8 rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                  Change Password
                </Button>
              </div>

              <div className="flex flex-col justify-center p-8 rounded-[2rem] bg-emerald-500/[0.03] border border-brand-border">
                <div className="flex items-center gap-3 mb-4">
                  <Fingerprint className="w-6 h-6 text-emerald-500" />
                  <h4 className="font-black tracking-tight text-emerald-600">
                    Password Requirements
                  </h4>
                </div>
                <ul className="space-y-3">
                  <Requirement text="Minimum 8 characters long" />
                  <Requirement text="At least one uppercase letter" />
                  <Requirement text="At least one special character" />
                  <Requirement text="Never used before" />
                </ul>
              </div>
            </div>
          </div>

          <Separator className="bg-brand-border" />

          {/* 2FA */}
          <div className="relative group/2fa overflow-hidden p-8 rounded-[2rem] border border-brand-border bg-background/60 backdrop-blur-md shadow-inner">
            <div className="absolute top-[-20%] right-[-10%] w-60 h-60 rounded-full bg-emerald-500/5 blur-[80px]" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground font-medium opacity-80 mt-1 max-w-md">
                    Secure your account with an extra layer of security. We'll ask for a code every
                    time you log in.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-muted-foreground">OFF</span>
                <Switch className="data-[state=checked]:bg-emerald-500" />
                <span className="text-sm font-bold text-emerald-600">ON</span>
              </div>
            </div>
          </div>

          <Separator className="bg-brand-border" />

          {/* Active Sessions */}
          <div className="space-y-6">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-500" />
              Active Sessions
            </h3>
            <div className="space-y-4">
              {loading && (
                <p className="text-sm text-muted-foreground font-medium">Loading sessions…</p>
              )}
              {!loading && sessions.length === 0 && (
                <p className="text-sm text-muted-foreground font-medium">No active sessions.</p>
              )}
              {sessions.map((s) => (
                <div
                  key={s.sid}
                  className="flex items-center justify-between p-6 rounded-2xl border border-brand-border bg-emerald-500/[0.02] group/session hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover/session:scale-110 transition-transform">
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-black tracking-tight truncate">{s.deviceName}</p>
                      <p className="text-sm text-muted-foreground font-medium opacity-80 truncate">
                        {formatRelative(s.lastUsedAt)} • {s.ip}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {s.current ? (
                      <Badge className="rounded-full px-4 py-1 font-black bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                        CURRENT
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        disabled={revokingSid === s.sid}
                        onClick={() => handleRevoke(s.sid)}
                        className="rounded-full font-bold text-red-500 hover:bg-red-500/10"
                      >
                        {revokingSid === s.sid ? "Revoking…" : "Revoke"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Requirement = ({ text }: { text: string }) => (
  <li className="flex items-center gap-2 text-sm font-medium text-emerald-700/80">
    <div className="size-1.5 rounded-full bg-emerald-500" />
    {text}
  </li>
);

export default SecurityTab;
