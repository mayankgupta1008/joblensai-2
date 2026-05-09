import { useState } from "react";
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
import { Eye, EyeOff } from "lucide-react";
import { logout } from "@/store/slices/authSlice";

const ResetPasswordDialog = () => {
  const dispatch = useDispatch();
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [openDialog, setOpenDialog] = useState(true);

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmitPassword = async ({
    newPassword,
    confirmNewPassword,
  }: {
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    try {
      await axiosWrapper.post("/auth/new-password", {
        newPassword,
        confirmNewPassword,
      });
      toast.success("Password reset successfully, login again");
      setOpenDialog(false);
      dispatch(logout());
    } catch (error) {
      console.log("Error submitting password", error);
      toast.error("Error resetting password");
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-md rounded-3xl border-brand-border bg-background/95 backdrop-blur-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-black tracking-tight">Set New Password</DialogTitle>
          <DialogDescription>
            <p className="text-muted-foreground text-sm">
              Please enter new password to update your password.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={passwordVisible ? "text" : "password"}
                placeholder="New Password"
                className="rounded-xl pr-10 border-brand-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((v) => !v)}
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {passwordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={confirmPasswordVisible ? "text" : "password"}
                placeholder="Confirm Password"
                className="rounded-xl pr-10 border-brand-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setConfirmPasswordVisible((v) => !v)}
                aria-label={confirmPasswordVisible ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {confirmPasswordVisible ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <DialogDescription className="text-sm">
              1. Password must be minimum 8 characters long. <br />
              2. Password must contain at least one uppercase letter. <br />
              3. Password must contain at least one special character. <br />
              4. Password must contain at least one number. <br />
            </DialogDescription>
          </div>
          <Button
            className="w-full rounded-xl font-bold bg-background text-foreground border border-brand-border hover:border-brand-border/50 hover:bg-muted/50 transition-all"
            onClick={() => handleSubmitPassword({ newPassword, confirmNewPassword })}
          >
            Set New Password
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
