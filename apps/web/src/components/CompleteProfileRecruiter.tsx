import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FaMapMarkerAlt,
  FaBuilding,
  FaBriefcase,
  FaLink,
  FaUpload,
  FaCamera,
  FaFileAlt,
  FaSpinner,
  FaCheckCircle,
  FaEnvelope,
} from "react-icons/fa";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CompleteRecruiterProfileSchema,
  type CompleteRecruiterProfileInput,
} from "@joblensai/shared/src/schemas/user.schema";
import PhoneInput from "react-phone-number-input";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import axiosWrapper from "@/lib/axiosWrapper";
import { patchUser, setCredentials } from "@/store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { EMAIL_VERIFIED, type EmailVerifiedMessage } from "@/hooks/channels/emailVerified";
import { useBroadcastChannel } from "@/hooks/useBroadcastChannel";
import { getCountryDataList, getEmojiFlag } from "countries-list";

type RecruiterForm = z.input<typeof CompleteRecruiterProfileSchema.shape.body>;

const CompleteProfileRecruiter = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isEmailVerified = user?.emailVerified;

  useBroadcastChannel<EmailVerifiedMessage>(EMAIL_VERIFIED, (msg) => {
    if (msg.type === "EMAIL_VERIFIED") {
      dispatch(patchUser({ emailVerified: true }));
    }
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [counter, setCounter] = useState<number | null>(null);

  const photo = useFileUpload("profile-picture");

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const form = useForm<RecruiterForm, unknown, CompleteRecruiterProfileInput>({
    resolver: zodResolver(CompleteRecruiterProfileSchema.shape.body),
    defaultValues: {
      role: "recruiter",
      phoneNumber: "",
      email: "",
      companyName: "",
      position: "",
      profilePictureKey: "",
      location: "",
      bio: "",
      linkedinUrl: "",
    },
  });

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

  const handleVerifyEmail = async () => {
    try {
      await axiosWrapper.post("/auth/verify-email/request");
      toast.success("Email verification link sent!");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to send verification link.");
    }
  };
  const onSubmit = async (values: CompleteRecruiterProfileInput) => {
    try {
      await axiosWrapper.post("/account/complete", values);
      // Token still carries the old (empty) role — refresh to restamp it.
      const { data } = await axiosWrapper.post("/auth/refresh", {});
      dispatch(setCredentials({ user: data.user }));
      toast.success("Profile completed!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to complete profile.");
    }
  };

  const onInvalid = () => {
    toast.error("Some required fields are missing or invalid.");
  };

  useEffect(() => {
    if (counter === null) return;
    const id = setTimeout(() => setCounter((c) => (c && c > 1 ? c - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [counter]);

  // Email field is display-only (disabled), so seed the form state from the account email.
  useEffect(() => {
    if (user?.email) form.setValue("email", user.email, { shouldValidate: true });
  }, [user?.email, form]);

  return (
    <Form {...form}>
      <form
        id="recruiter-profile-form"
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="space-y-10"
      >
        {/* Basics */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FaCamera className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-black tracking-tight">Basic Details</h3>
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
                type="button"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold tracking-tight ml-1">
                    Phone number <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <PhoneInput
                      international
                      defaultCountry="US"
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? "")}
                      placeholder="(555) 000-0000"
                      className={cn(
                        "flex h-12 items-center gap-3 rounded-2xl border border-brand-border bg-muted/30 px-4 transition-all focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/20 [&_.PhoneInputInput]:h-full [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:placeholder:text-muted-foreground/40",
                        fieldState.error &&
                          "border-destructive ring-2 ring-destructive/20 focus-within:border-destructive"
                      )}
                    />
                  </FormControl>
                  <FormMessage className="ml-1 text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold tracking-tight ml-1">
                    Current location <span className="text-red-500">*</span>
                  </FormLabel>
                  <div className="relative group/input">
                    <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-12! w-full pl-11 rounded-2xl bg-muted/30 border-brand-border data-placeholder:text-muted-foreground/40! focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all">
                          <SelectValue placeholder="San Francisco, CA" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Country</SelectLabel>
                          {getCountryDataList().map((country) => (
                            <SelectItem key={country.iso2} value={country.iso2}>
                              {getEmojiFlag(country.iso2)} {country.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage className="ml-1 text-xs" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={() => (
              <FormItem>
                <FormLabel className="text-sm font-bold tracking-tight ml-1">
                  Email <span className="text-red-500">*</span>
                </FormLabel>
                <div className="relative group/input">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                  <Input
                    name="email"
                    placeholder="abcd@xyz.com"
                    value={user?.email}
                    className={cn(
                      "h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all",
                      isEmailVerified ? "pr-11" : "pr-24"
                    )}
                    disabled={true}
                  />
                  {isEmailVerified ? (
                    <FaCheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-5 h-5 text-emerald-500" />
                  ) : (
                    <Button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3 text-xs font-bold text-white"
                      onClick={() => {
                        void handleVerifyEmail();
                        setCounter(30);
                      }}
                      disabled={counter !== null && counter > 0}
                    >
                      {counter !== null && counter > 0 ? `Please wait ${counter}s` : "Verify"}
                    </Button>
                  )}
                </div>
                <FormMessage className="ml-1 text-xs" />
              </FormItem>
            )}
          />
        </div>

        <Separator className="bg-brand-border" />

        {/* Company */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FaBuilding className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-black tracking-tight">Company</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold tracking-tight ml-1">
                    Company Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <div className="relative group/input">
                    <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Acme Inc."
                        className={cn(
                          "h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all",
                          fieldState.error &&
                            "border-destructive ring-2 ring-destructive/20 focus-visible:border-destructive"
                        )}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="ml-1 text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold tracking-tight ml-1">
                    Your Position <span className="text-red-500">*</span>
                  </FormLabel>
                  <div className="relative group/input">
                    <FaBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Talent Acquisition Manager"
                        className={cn(
                          "h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all",
                          fieldState.error &&
                            "border-destructive ring-2 ring-destructive/20 focus-visible:border-destructive"
                        )}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="ml-1 text-xs" />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="bg-brand-border" />

        {/* About */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FaFileAlt className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-black tracking-tight">About</h3>
          </div>
          <FormField
            control={form.control}
            name="bio"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold tracking-tight ml-1">
                  Bio <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Tell candidates about your company, the roles you hire for, and what makes your team great..."
                    className={cn(
                      "min-h-28 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all resize-none p-4",
                      fieldState.error &&
                        "border-destructive ring-2 ring-destructive/20 focus-visible:border-destructive"
                    )}
                  />
                </FormControl>
                <p className="ml-1 text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-60">
                  Minimum 20 characters
                </p>
                <FormMessage className="ml-1 text-xs" />
              </FormItem>
            )}
          />
        </div>

        <Separator className="bg-brand-border" />

        {/* Links */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FaLink className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-black tracking-tight">Links</h3>
          </div>
          <FormField
            control={form.control}
            name="linkedinUrl"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold tracking-tight ml-1">
                  LinkedIn <span className="text-red-500">*</span>
                </FormLabel>
                <div className="relative group/input">
                  <FaLink className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="linkedin.com/in/you"
                      className={cn(
                        "h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all",
                        fieldState.error &&
                          "border-destructive ring-2 ring-destructive/20 focus-visible:border-destructive"
                      )}
                    />
                  </FormControl>
                </div>
                <FormMessage className="ml-1 text-xs" />
              </FormItem>
            )}
          />
        </div>
        {/* Submit */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground font-medium opacity-70">
            <FaCheckCircle className="w-4 h-4 text-emerald-500" />
            Your details stay private until you match with a role.
          </p>
          <Button className="h-14 w-full sm:w-auto px-12 rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
            Complete profile
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CompleteProfileRecruiter;
