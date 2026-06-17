import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaBriefcase,
  FaLink,
  FaUpload,
  FaCamera,
  FaFileAlt,
  FaSpinner,
} from "react-icons/fa";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { useState } from "react";
import { toast } from "sonner";

const CompleteProfileRecruiter = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const photo = useFileUpload("profile-picture");

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleImageUpload = async () => {
    const file = await photo.selectFile(".jpg,.jpeg,.png,.webp");
    if (!file) return;
    try {
      await photo.upload(file);
      setAvatarPreview(URL.createObjectURL(file));
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Failed to upload photo.");
    }
  };

  return (
    <>
      {/* Basics */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <FaCamera className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-black tracking-tight">The basics</h3>
        </div>

        {/* Avatar */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-4xl bg-emerald-500/2 border border-dashed border-brand-border">
          <div className="relative group/avatar">
            <Avatar className="w-24 h-24 border-4 border-background shadow-2xl transition-transform group-hover/avatar:scale-105">
              {avatarPreview || user?.avatar ? (
                <AvatarImage src={avatarPreview ?? user?.avatar} className="object-cover" />
              ) : (
                <AvatarFallback className="text-2xl bg-linear-to-br from-emerald-500 to-blue-600 text-white font-black">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
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
              onClick={handleImageUpload}
              disabled={photo.isUploading}
            >
              {photo.isUploading ? (
                <FaSpinner className="animate-spin w-4 h-4" />
              ) : (
                <>
                  <FaUpload className="w-4 h-4" />
                  Upload photo
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Phone number</Label>
            <div className="relative group/input">
              <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
              <Input
                placeholder="+1 (555) 000-0000"
                className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Location</Label>
            <div className="relative group/input">
              <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
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
          <FaBuilding className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-black tracking-tight">Company</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Company name</Label>
            <div className="relative group/input">
              <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
              <Input
                placeholder="Acme Inc."
                className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Your position</Label>
            <div className="relative group/input">
              <FaBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
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
          <FaFileAlt className="w-5 h-5 text-emerald-500" />
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
          <FaLink className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-black tracking-tight">Links</h3>
        </div>
        <div className="space-y-3">
          <Label className="text-sm font-bold tracking-tight ml-1">LinkedIn</Label>
          <div className="relative group/input">
            <FaLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
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
