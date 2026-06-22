import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FaMagic, FaUser, FaBuilding, FaCheck } from "react-icons/fa";
import logo from "@/assets/joblensai.svg";
import CompleteProfileJobseeker from "@/components/CompleteProfileJobseeker";
import CompleteProfileRecruiter from "@/components/CompleteProfileRecruiter";

type Role = "jobseeker" | "recruiter";

const CompleteProfile = () => {
  const [role, setRole] = useState<Role>("jobseeker");

  return (
    <section className="relative min-h-screen overflow-hidden bg-background px-4 py-12 md:py-16 selection:bg-emerald-500/30">
      {/* Background Blobs - Emerald & Blue premium vibe */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-linear-to-bl from-emerald-500/15 to-blue-500/5 blur-[130px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[5%] left-[-15%] w-[50%] h-[50%] rounded-full bg-linear-to-tr from-blue-600/8 to-emerald-500/15 blur-[110px] opacity-30" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className="px-4 py-1.5 border-brand-border bg-emerald-500/5 text-emerald-600 tracking-wide transition-all hover:bg-emerald-500/10"
            >
              <FaMagic className="w-3.5 h-3.5 mr-2 inline-block animate-pulse text-emerald-500" />
              One last step
            </Badge>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <img src={logo} alt="JobLens AI" className="w-9 h-9" />
            <span className="font-black text-xl tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
              JobLens AI
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tighter sm:text-5xl leading-none">
            Complete your{" "}
            <span className="bg-clip-text text-transparent bg-linear-to-r from-emerald-500 to-blue-600">
              profile.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base font-medium opacity-90">
            Tell us about yourself so we can match you with roles built around your strengths.
          </p>
        </div>

        {/* Form Card */}
        <div className="relative mt-10 group">
          <div className="absolute -inset-1 bg-linear-to-r from-emerald-500/40 via-blue-500/25 to-emerald-500/40 rounded-4xl blur-lg opacity-20 group-hover:opacity-40 transition duration-1000" />

          <Card className="relative overflow-hidden rounded-4xl border border-brand-border bg-background/40 backdrop-blur-xl shadow-2xl dark:bg-white/5 dark:ring-1 dark:ring-white/10">
            <div className="h-1.5 w-full bg-linear-to-r from-emerald-500 via-blue-500 to-emerald-500" />

            <CardContent className="p-8 md:p-10 space-y-10">
              {/* Role selection */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <FaUser className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-black tracking-tight">I am a...</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Job Seeker */}
                  <button
                    type="button"
                    onClick={() => setRole("jobseeker")}
                    className={`relative text-left rounded-3xl border-2 p-6 transition-all cursor-pointer ${
                      role === "jobseeker"
                        ? "border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500/70"
                        : "border-brand-border bg-muted/20 hover:border-emerald-500/30 hover:bg-emerald-500/2"
                    }`}
                  >
                    {role === "jobseeker" && (
                      <div className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                        <FaCheck className="w-3.5 h-3.5" strokeWidth={3} />
                      </div>
                    )}
                    <div
                      className={`size-12 rounded-2xl flex items-center justify-center shadow-inner ${
                        role === "jobseeker"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <FaUser className="w-6 h-6" />
                    </div>
                    <p className="mt-4 font-black tracking-tight">Job Seeker</p>
                    <p className="mt-1 text-sm text-muted-foreground font-medium opacity-80">
                      Find roles, get matched, and let AI write the intro.
                    </p>
                  </button>
                  {/* Recruiter */}
                  <button
                    type="button"
                    onClick={() => setRole("recruiter")}
                    className={`relative text-left rounded-3xl border-2 p-6 transition-all cursor-pointer ${
                      role === "recruiter"
                        ? "border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500/70"
                        : "border-brand-border bg-muted/20 hover:border-emerald-500/30 hover:bg-emerald-500/2"
                    }`}
                  >
                    {role === "recruiter" && (
                      <div className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                        <FaCheck className="w-3.5 h-3.5" strokeWidth={3} />
                      </div>
                    )}
                    <div
                      className={`size-12 rounded-2xl flex items-center justify-center shadow-inner ${
                        role === "recruiter"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <FaBuilding className="w-6 h-6" />
                    </div>
                    <p className="mt-4 font-black tracking-tight">Recruiter</p>
                    <p className="mt-1 text-sm text-muted-foreground font-medium opacity-80">
                      Source talent, review matches, and reach out faster.
                    </p>
                  </button>
                </div>
              </div>

              <Separator className="bg-brand-border" />

              {/* Role-specific form */}
              {role === "jobseeker" ? <CompleteProfileJobseeker /> : <CompleteProfileRecruiter />}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CompleteProfile;
