import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Upload, Clock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ProfileTab = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="space-y-8">
      <Card className="border-brand-border bg-background/40 backdrop-blur-xl rounded-4xl shadow-xl overflow-hidden">
        <CardHeader className="p-8 border-b border-brand-border">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">
                Profile Information
              </CardTitle>
              <CardDescription className="font-medium">
                Update your personal details and resume.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="fullName" className="text-sm font-bold tracking-tight ml-1">
                Full Name
              </Label>
              <div className="relative group/input">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                <Input
                  id="fullName"
                  placeholder="Taylor Morgan"
                  defaultValue={user?.fullName || ""}
                  className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all font-medium"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-bold tracking-tight ml-1">
                Work Email
              </Label>
              <div className="relative group/input opacity-70">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  defaultValue={user?.email || ""}
                  disabled
                  className="h-12 pl-11 rounded-2xl bg-muted/50 border-emerald-500/5 cursor-not-allowed font-medium"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase ml-1 opacity-60">
                EMAIL CANNOT BE CHANGED
              </p>
            </div>
          </div>

          <Separator className="bg-brand-border" />

          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-black tracking-tight">Rate Limit</h3>
            </div>
            <div className="relative group/limit overflow-hidden bg-emerald-500/3 rounded-3xl p-6 border border-dashed border-brand-border hover:border-emerald-500/40 transition-all">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-lg font-black text-red-600 tracking-tight flex items-center justify-center sm:justify-start gap-2">
                    0 requests remaining
                  </p>
                  <p className="text-sm text-muted-foreground font-medium opacity-80">
                    Your limit resets automatically every 24 hours.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full font-bold border-brand-border text-emerald-600 hover:bg-emerald-500/5 shadow-sm"
                >
                  Upgrade to Pro for more
                </Button>
              </div>
            </div>
          </div>

          <Separator className="bg-brand-border" />

          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-black tracking-tight">Resume Management</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative group/upload border-2 border-dashed border-brand-border rounded-4xl p-10 flex flex-col items-center justify-center text-center space-y-5 hover:border-emerald-500/30 hover:bg-emerald-500/2 transition-all cursor-pointer">
                <div className="size-16 bg-emerald-500/10 rounded-[1.25rem] flex items-center justify-center shadow-inner group-hover/upload:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-black tracking-tight">No resume uploaded</p>
                  <p className="text-sm text-muted-foreground font-medium opacity-80 max-w-60">
                    Drop your PDF here or click to browse. Max size 4MB.
                  </p>
                </div>
                <Button className="rounded-full px-8 font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                  Choose File
                </Button>
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 border-brand-border text-[10px] font-black uppercase tracking-[0.2em] opacity-40"
                >
                  PDF ONLY • 4MB MAX
                </Badge>
              </div>

              <div className="flex flex-col justify-center space-y-6 bg-blue-500/3 rounded-4xl p-8 border border-blue-500/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-black tracking-tight text-blue-600">AI Privacy Mask</h4>
                </div>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                  Your contact details are automatically masked when matching with companies. We
                  only reveal your identity after you approve the match.
                </p>
                <Badge className="w-fit bg-blue-500 text-white rounded-full px-4 font-bold shadow-lg shadow-blue-500/20">
                  ENCRYPTED
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end items-center gap-6 pt-4">
        <p className="text-sm text-muted-foreground font-medium opacity-60">
          Last saved: 2 hours ago
        </p>
        <Button className="h-14 px-12 rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ProfileTab;
