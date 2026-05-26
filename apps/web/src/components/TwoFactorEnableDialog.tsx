import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { Copy, Loader2, ShieldCheck, Smartphone } from "lucide-react";
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

type SetupResponse = { secret: string; qrCode: string; otpAuthUrl: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TwoFactorEnableDialog = ({ open, onOpenChange }: Props) => {
  const dispatch = useDispatch();
  const [step, setStep] = useState<"scan" | "verify">("scan");
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  // Guards against StrictMode firing the setup effect twice and creating two
  // pending secrets server-side.
  const hasRequested = useRef(false);

  useEffect(() => {
    if (!open) {
      setStep("scan");
      setSetup(null);
      setCode("");
      hasRequested.current = false;
      return;
    }
    if (hasRequested.current) return;
    hasRequested.current = true;
    setIsFetching(true);
    axiosWrapper
      .post("/auth/2fa/setup", {
        secret: setup?.secret,
        otpAuthUrl: setup?.otpAuthUrl,
        qrCode: setup?.qrCode,
      })
      .then(({ data }) => setSetup(data))
      .catch((err) => {
        toast.error(err?.response.data.message ?? "Failed to start 2FA setup");
        onOpenChange(false);
      })
      .finally(() => setIsFetching(false));
  }, [open, onOpenChange]);

  const handleCopySecret = async () => {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      toast.success("Secret copied to clipboard");
    } catch {
      toast.error("Couldn't copy. Select and copy manually.");
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setIsVerifying(true);
    try {
      const response = await axiosWrapper.post("/auth/2fa/verify", { token: code });
      dispatch(patchUser({ is2FAEnabled: true }));
      toast.success(response.data.message);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response.data.message);
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-4xl border-brand-border bg-background/95 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 sm:p-8 pb-4 border-b border-brand-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shrink-0">
              {step === "scan" ? (
                <Smartphone className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-xl font-black tracking-tight">
                {step === "scan" ? "Scan with your authenticator" : "Enter the 6-digit code"}
              </DialogTitle>
              <DialogDescription className="font-medium">
                {step === "scan"
                  ? "Use Google Authenticator, 1Password, Authy, or any TOTP app."
                  : "Open your authenticator app and enter the code it shows."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 sm:p-8 space-y-6">
          {step === "scan" && (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-inner">
                  {isFetching || !setup ? (
                    <div className="w-44 h-44 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    </div>
                  ) : (
                    <img src={setup.qrCode} alt="2FA QR code" className="w-44 h-44" />
                  )}
                </div>
                <div className="w-full space-y-2">
                  <p className="text-xs font-bold tracking-tight text-muted-foreground uppercase">
                    Or enter this key manually
                  </p>
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted/40 border border-brand-border">
                    <code className="flex-1 text-sm font-mono tracking-wider break-all select-all">
                      {setup?.secret ?? "…"}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!setup}
                      onClick={handleCopySecret}
                      className="rounded-full text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600 shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
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
                  disabled={!setup || isFetching}
                  onClick={() => setStep("verify")}
                  className="rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === "verify" && (
            <>
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
                <p className="text-xs text-muted-foreground font-medium">
                  The code refreshes every 30 seconds.
                </p>
              </div>

              <div className="flex justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("scan")}
                  className="rounded-full font-bold"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={code.length !== 6 || isVerifying}
                  onClick={handleVerify}
                  className="rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify & enable"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorEnableDialog;
