import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { Loader2, ShieldOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import axiosWrapper from "@/lib/axiosWrapper";
import { patchUser } from "@/store/slices/authSlice";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TwoFactorDisableDialog = ({ open, onOpenChange }: Props) => {
  const dispatch = useDispatch();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setCode("");
  }, [open]);

  const handleDisable = async () => {
    if (code.length !== 6) return;
    setIsSubmitting(true);
    try {
      const response = await axiosWrapper.post("/auth/2fa/disable", { token: code });
      dispatch(patchUser({ is2FAEnabled: false }));
      toast.success(response?.data?.message);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message);
      setCode("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-4xl border-brand-border bg-background/95 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 sm:p-8 pb-4 border-b border-brand-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-red-500/10 text-red-600 shrink-0">
              <ShieldOff className="w-6 h-6" />
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-xl font-black tracking-tight">
                Turn off two-factor authentication?
              </DialogTitle>
              <DialogDescription className="font-medium">
                Confirm with a code from your authenticator app to disable 2FA.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              autoFocus
              inputMode="numeric"
              pattern="^[0-9]*$"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-full font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={code.length !== 6 || isSubmitting}
              onClick={handleDisable}
              className="rounded-full font-black bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Disabling…
                </>
              ) : (
                "Disable 2FA"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorDisableDialog;
