import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@/store/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  FaUser,
  FaEnvelope,
  FaUpload,
  FaClock,
  FaExclamationTriangle,
  FaTrash,
  FaCamera,
  FaCheckCircle,
  FaPhone,
} from "react-icons/fa";
import { toast } from "sonner";
import axiosWrapper from "@/lib/axiosWrapper";
import { logout } from "@/store/slices/authSlice";
import { useBroadcastChannel } from "@/hooks/useBroadcastChannel";

const ProfileTab = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const postAuth = useBroadcastChannel<{ type: "LOGOUT" }>("auth");

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [isAccountDelete, setIsAccountDelete] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setIsAccountDelete(true);
      const response = await axiosWrapper.delete("/account", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      dispatch(logout());
      postAuth({ type: "LOGOUT" });
      toast.success(response.data.message);
      navigate("/");
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setIsAccountDelete(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-brand-border bg-background/40 backdrop-blur-xl rounded-4xl shadow-xl overflow-hidden dark:bg-white/5 dark:ring-1 dark:ring-white/10">
        <CardHeader className="p-8 border-b border-brand-border">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
              <FaUser className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">
                Profile Information
              </CardTitle>
              <CardDescription className="font-medium">
                Manage your personal details and resume.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          {/* Avatar Section */}
          <div className="flex flex-col md:flex-row items-center gap-10 p-8 rounded-4xl bg-emerald-500/2 border border-brand-border border-dashed">
            <div className="relative group/avatar">
              <Avatar className="w-32 h-32 border-4 border-white shadow-2xl transition-transform group-hover/avatar:scale-105">
                <AvatarImage src={user?.avatar ?? undefined} />
                <AvatarFallback className="text-3xl bg-linear-to-br from-emerald-500 to-blue-600 text-white font-black">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                <FaCamera className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h3 className="text-xl font-black tracking-tight">Profile Picture</h3>
                <p className="text-sm text-muted-foreground font-medium opacity-80 mt-1">
                  Upload a high-resolution photo to help employers recognize you.
                </p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <Button className="rounded-full px-6 font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                  Upload New Photo
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full px-6 font-bold border-brand-border hover:bg-emerald-500/5 text-muted-foreground transition-all"
                >
                  Remove
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-60">
                ALLOWED JPG, GIF OR PNG. MAX 800KB.
              </p>
            </div>
          </div>

          <Separator className="bg-brand-border" />

          {/* Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="fullName" className="text-sm font-bold tracking-tight ml-1">
                Full Name
              </Label>
              <div className="relative group/input">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                <Input
                  id="fullName"
                  placeholder="Taylor Morgan"
                  defaultValue={user?.fullName || ""}
                  className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all font-medium"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 ml-1">
                <Label htmlFor="email" className="text-sm font-bold tracking-tight">
                  Work Email
                </Label>
                {user?.emailVerified && (
                  <Badge
                    variant="outline"
                    className="rounded-full px-2 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest gap-1"
                  >
                    <FaCheckCircle className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="relative group/input opacity-70">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
            <div className="space-y-3">
              <div className="flex items-center gap-2 ml-1">
                <Label htmlFor="fullName" className="text-sm font-bold tracking-tight ml-1">
                  Mobile Number
                </Label>
                {user?.phoneNumberVerified && (
                  <Badge
                    variant="outline"
                    className="rounded-full px-2 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest gap-1"
                  >
                    <FaCheckCircle className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="relative group/input">
                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                <Input
                  id="fullName"
                  placeholder="xxxxx-xxxxx"
                  defaultValue={user?.phoneNumber || ""}
                  disabled
                  className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-brand-border" />

          {/* Rate Limit */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FaClock className="w-5 h-5 text-emerald-500" />
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

          {user?.role === "jobseeker" && (
            <>
              <Separator className="bg-brand-border" />

              {/* Resume */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaUpload className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-black tracking-tight">Resume Management</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                  <div className="relative group/upload border-2 border-dashed border-brand-border rounded-4xl p-10 flex flex-col items-center justify-center text-center space-y-5 hover:border-emerald-500/30 hover:bg-emerald-500/2 transition-all cursor-pointer">
                    <div className="size-16 bg-emerald-500/10 rounded-[1.25rem] flex items-center justify-center shadow-inner group-hover/upload:scale-110 transition-transform">
                      <FaUpload className="w-8 h-8 text-emerald-500" />
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
                </div>
              </div>
            </>
          )}

          <Separator className="bg-brand-border" />

          {/* Danger Zone */}
          <div className="relative overflow-hidden p-8 rounded-4xl border border-red-500/20 bg-red-500/2">
            <div className="absolute top-[-10%] right-[-5%] w-40 h-40 rounded-full bg-red-500/5 blur-[60px]" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-red-600 font-black tracking-tighter text-xl">
                  <FaExclamationTriangle className="w-5 h-5" />
                  Danger Zone
                </div>
                <p className="text-sm text-muted-foreground font-medium opacity-80 max-w-md">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
              </div>
              <Button
                variant="destructive"
                className="h-12 px-8 rounded-full font-black shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                onClick={() => setConfirmOpen(true)}
              >
                <FaTrash className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-4xl border-brand-border bg-background/95 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 pb-4 border-b border-brand-border">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-600 shrink-0">
                <FaExclamationTriangle className="w-6 h-6" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-2xl font-black tracking-tight">
                  Delete account?
                </DialogTitle>
                <DialogDescription className="font-medium text-muted-foreground">
                  This action is permanent. Your profile, data, and history will be removed.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogFooter className="p-6 gap-3 sm:gap-3">
            <Button
              variant="outline"
              className="rounded-full px-6 font-bold border-brand-border"
              onClick={() => setConfirmOpen(false)}
              disabled={isAccountDelete}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-full px-6 font-black shadow-lg shadow-red-500/20"
              onClick={handleDeleteAccount}
              disabled={isAccountDelete}
            >
              <FaTrash className="w-4 h-4 mr-2" />
              {isAccountDelete ? "Deleting..." : "Yes, delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileTab;
