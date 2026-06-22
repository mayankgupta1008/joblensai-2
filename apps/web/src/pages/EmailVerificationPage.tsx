import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaMagic, FaCheckCircle } from "react-icons/fa";
import logo from "@/assets/joblensai.svg";
import { useBroadcastChannel } from "@/hooks/useBroadcastChannel";
import { EMAIL_VERIFIED, type EmailVerifiedMessage } from "@/hooks/channels/emailVerified";

const EmailVerificationPage = () => {
  const [counter, setCounter] = useState(5);

  const status = new URLSearchParams(window.location.search).get("status");
  const isVerified = status !== "invalid";

  const postVerified = useBroadcastChannel<EmailVerifiedMessage>(EMAIL_VERIFIED);

  useEffect(() => {
    if (isVerified) postVerified({ type: "EMAIL_VERIFIED" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerified]);

  useEffect(() => {
    if (counter <= 0) {
      window.close();
      return;
    }
    const id = setTimeout(() => setCounter((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [counter]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 md:py-16 selection:bg-emerald-500/30">
      {/* Background Blobs - Emerald & Blue premium vibe */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-linear-to-br from-emerald-500/15 to-blue-500/5 blur-[130px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[5%] right-[-10%] w-[45%] h-[45%] rounded-full bg-linear-to-tr from-blue-600/8 to-emerald-500/15 blur-[110px] opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="relative group">
          <div className="absolute -inset-1 bg-linear-to-r from-emerald-500/40 via-blue-500/25 to-emerald-500/40 rounded-4xl blur-lg opacity-30 group-hover:opacity-50 transition duration-1000" />

          <Card className="relative overflow-hidden rounded-4xl border border-brand-border bg-background/40 backdrop-blur-xl shadow-2xl dark:bg-white/5 dark:ring-1 dark:ring-white/10">
            <div className="h-1.5 w-full bg-linear-to-r from-emerald-500 via-blue-500 to-emerald-500" />

            <CardHeader className="pt-10 pb-2 px-8 text-center">
              <Link to="/" className="flex items-center justify-center gap-2 mb-8 group/logo">
                <img
                  src={logo}
                  alt="JobLens AI"
                  className="w-10 h-10 group-hover/logo:scale-110 transition-transform"
                />
                <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70 group-hover/logo:from-emerald-500 group-hover/logo:to-blue-600 transition-all">
                  JobLens AI
                </span>
              </Link>

              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
                  <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
                    <FaCheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="px-4 py-1.5 border-brand-border bg-emerald-500/5 text-emerald-600 tracking-wide mb-4"
                >
                  <FaMagic className="w-3.5 h-3.5 mr-2 inline-block animate-pulse text-emerald-500" />
                  Verified
                </Badge>

                <h1 className="text-3xl font-black tracking-tighter sm:text-4xl leading-none">
                  {isVerified ? "Email Verified Successfully" : "Invalid or Expired Token"}
                </h1>
                <p className="text-sm text-muted-foreground mt-3 font-medium leading-relaxed">
                  {isVerified
                    ? "Your email address is verified."
                    : "Your email verification link is invalid or expired. Please try again by clicking the verification link in the email."}
                </p>
                <p className="text-sm text-muted-foreground mt-3 font-medium leading-relaxed">
                  This window will close in{" "}
                  <span className="font-semibold text-green-500" id="counter">
                    {counter}
                  </span>{" "}
                  seconds.
                </p>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default EmailVerificationPage;
