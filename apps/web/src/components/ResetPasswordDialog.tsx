import { useState, type SubmitEvent } from "react";
import axiosWrapper from "@/lib/axiosWrapper";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { logout } from "@/store/slices/authSlice";

interface ResetPasswordDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

const ResetPasswordDialog = ({ open, onOpenChange, onSuccess }: ResetPasswordDialogProps) => {
  const dispatch = useDispatch();
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [internalOpen, setInternalOpen] = useState(true);

  const renderRequirement = (text: string) => (
    <li className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
      <div className="size-1 rounded-full bg-emerald-500" />
      {text}
    </li>
  );
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  const handleSubmitPassword = async (e: SubmitEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await axiosWrapper.post("/auth/new-password", {
        newPassword,
        confirmNewPassword,
      });
      toast.success("Password successfully updated, login again");
      if (onSuccess) onSuccess();
      dispatch(logout());
      setIsOpen(false);
    } catch (error) {
      console.log("Error submitting password", error);
      toast.error("Error updating password");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md rounded-4xl border-brand-border bg-background/95 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-8 pb-4 border-b border-brand-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-2xl font-black tracking-tight">Set Password</DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground">
                Set a secure password to enable 2FA.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmitPassword} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-bold tracking-tight ml-1">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={passwordVisible ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-12 rounded-2xl bg-muted/30 border-brand-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {passwordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-bold tracking-tight ml-1">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={confirmPasswordVisible ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-12 rounded-2xl bg-muted/30 border-brand-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all pr-10"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setConfirmPasswordVisible((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {confirmPasswordVisible ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-brand-border">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
                Requirements
              </span>
            </div>
            <ul className="grid grid-cols-1 gap-1.5">
              {renderRequirement("Minimum 8 characters")}
              {renderRequirement("One uppercase letter")}
              {renderRequirement("One special character")}
            </ul>
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            Update Password
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
