import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, MapPin, Building2, Briefcase, Link2, Upload, Camera, FileText } from "lucide-react";

const CompleteProfileRecruiter = () => {
  return (
    <>
      {/* Basics */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-black tracking-tight">The basics</h3>
        </div>

        {/* Avatar */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-4xl bg-emerald-500/2 border border-dashed border-brand-border">
          <div className="relative group/avatar">
            <Avatar className="w-24 h-24 border-4 border-background shadow-2xl transition-transform group-hover/avatar:scale-105">
              <AvatarFallback className="text-2xl bg-linear-to-br from-emerald-500 to-blue-600 text-white font-black">
                TM
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <p className="font-black tracking-tight">Profile picture</p>
              <p className="text-sm text-muted-foreground font-medium opacity-80 mt-1">
                A professional photo builds trust with candidates.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-full px-6 font-bold border-brand-border hover:bg-emerald-500/5 transition-all gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload photo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Phone number</Label>
            <div className="relative group/input">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
              <Input
                placeholder="+1 (555) 000-0000"
                className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Location</Label>
            <div className="relative group/input">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
              <Input
                placeholder="San Francisco, CA"
                className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-brand-border" />

      {/* Company */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-black tracking-tight">Company</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Company name</Label>
            <div className="relative group/input">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
              <Input
                placeholder="Acme Inc."
                className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Your position</Label>
            <div className="relative group/input">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
              <Input
                placeholder="Talent Acquisition Lead"
                className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-brand-border" />

      {/* About */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-black tracking-tight">About</h3>
        </div>
        <div className="space-y-3">
          <Label className="text-sm font-bold tracking-tight ml-1">Bio</Label>
          <Textarea
            placeholder="Tell candidates about your company, the roles you hire for, and what makes your team great..."
            className="min-h-28 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all resize-none p-4"
          />
          <p className="ml-1 text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-60">
            Minimum 20 characters
          </p>
        </div>
      </div>

      <Separator className="bg-brand-border" />

      {/* Links */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-black tracking-tight">Links</h3>
        </div>
        <div className="space-y-3">
          <Label className="text-sm font-bold tracking-tight ml-1">LinkedIn</Label>
          <div className="relative group/input">
            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
            <Input
              placeholder="linkedin.com/in/you"
              className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default CompleteProfileRecruiter;
