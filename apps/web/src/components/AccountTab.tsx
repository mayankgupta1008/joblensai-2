import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { User, Globe, AlertTriangle, Trash2, Camera } from "lucide-react";
import { toast } from "sonner";
import axiosWrapper from "@/lib/axiosWrapper";
import { useNavigate } from "react-router-dom";
import { logout } from "@/store/slices/authSlice";
import { useBroadcastChannel } from "@/hooks/useBroadcastChannel";

const AccountTab = () => {
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
      await axiosWrapper.delete("/account", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      dispatch(logout());
      postAuth({ type: "LOGOUT" });
      toast.success("Account deleted successfully");
      navigate("/");
    } catch (error: any) {
      toast.error(error?.message ?? "Error deleting account");
    } finally {
      setIsAccountDelete(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-brand-border bg-background/40 backdrop-blur-xl rounded-4xl shadow-xl overflow-hidden">
        <CardHeader className="p-8 border-b border-brand-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">Account Settings</CardTitle>
              <CardDescription className="font-medium">
                Manage your identity and core preferences.
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
                <Camera className="w-8 h-8 text-white" />
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

          {/* Basic Details */}
          <div className="space-y-6">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-500" />
              Regional & Display
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-sm font-bold tracking-tight ml-1">Username</Label>
                <Input
                  className="h-12 rounded-2xl bg-muted/30 border-brand-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all font-medium"
                  placeholder="username"
                  defaultValue={user?.email?.split("@")[0]}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-bold tracking-tight ml-1">Preferred Language</Label>
                <Input
                  className="h-12 rounded-2xl bg-muted/30 border-brand-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all font-medium"
                  placeholder="English (US)"
                  defaultValue="English (US)"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-brand-border" />

          {/* Danger Zone */}
          <div className="relative overflow-hidden p-8 rounded-4xl border border-red-500/20 bg-red-500/2">
            <div className="absolute top-[-10%] right-[-5%] w-40 h-40 rounded-full bg-red-500/5 blur-[60px]" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-red-600 font-black tracking-tighter text-xl">
                  <AlertTriangle className="w-5 h-5" />
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
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="h-14 px-12 rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
          Save Account Changes
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-4xl border-brand-border bg-background/95 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 pb-4 border-b border-brand-border">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
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
              <Trash2 className="w-4 h-4 mr-2" />
              {isAccountDelete ? "Deleting..." : "Yes, delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountTab;
