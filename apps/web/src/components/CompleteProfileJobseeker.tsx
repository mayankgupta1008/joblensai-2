import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { MultiSelect } from "@/components/ui/multi-select";
import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaGraduationCap,
  FaDollarSign,
  FaLink,
  FaUpload,
  FaCamera,
  FaBrain,
  FaPlus,
  FaTimes,
  FaCheck,
  FaSpinner,
  FaTrash,
  FaGithub,
  FaLinkedin,
  FaCalendarAlt,
  FaCheckCircle,
  FaEnvelope,
} from "react-icons/fa";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "sonner";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { getCountryDataList, getEmojiFlag } from "countries-list";
import { useForm, useFieldArray, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import axiosWrapper from "@/lib/axiosWrapper";
import { cn } from "@/lib/utils";
import { setCredentials, patchUser } from "@/store/slices/authSlice";
import { useBroadcastChannel } from "@/hooks/useBroadcastChannel";
import { EMAIL_VERIFIED, type EmailVerifiedMessage } from "@/hooks/channels/emailVerified";
import {
  CompleteJobSeekerProfileSchema,
  type CompleteJobSeekerProfileInput,
} from "@joblensai/shared/src/schemas/user.schema";

// Field values use the schema's INPUT type (z.coerce.date is `unknown` before
// resolution); the resolved/submitted payload is the OUTPUT type (dates as Date).
type JobSeekerForm = z.input<typeof CompleteJobSeekerProfileSchema.shape.body>;
type AddressPrefix = "permanentAddress" | "currentAddress";

const CompleteProfileJobseeker = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isEmailVerified = user?.emailVerified;

  useBroadcastChannel<EmailVerifiedMessage>(EMAIL_VERIFIED, (msg) => {
    if (msg.type === "EMAIL_VERIFIED") {
      dispatch(patchUser({ emailVerified: true }));
    }
  });

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [skillsDraft, setSkillsDraft] = useState<Record<string, string>>({});
  const [counter, setCounter] = useState<number | null>(null);

  const photo = useFileUpload("profile-picture");
  const resume = useFileUpload("resume");

  const currencies = Intl.supportedValuesOf("currency");
  const currencyName = new Intl.DisplayNames(["en"], { type: "currency" });

  const form = useForm<JobSeekerForm, unknown, CompleteJobSeekerProfileInput>({
    resolver: zodResolver(CompleteJobSeekerProfileSchema.shape.body),
    defaultValues: {
      role: "jobseeker",
      phoneNumber: "",
      email: "",
      profilePictureKey: "",
      currentLocation: "",
      permanentAddress: { line1: "", line2: "", city: "", state: "", country: "", zip: "" },
      differentCurrentAddress: false,
      currentAddress: { line1: "", line2: "", city: "", state: "", country: "", zip: "" },
      experience: [
        {
          title: "",
          experienceRange: "",
          from: undefined,
          to: undefined,
          current: false,
          bio: "",
          skills: [],
        },
      ],
      education: [{ degree: "", university: "", from: undefined, to: undefined }],
      expectedSalary: { currency: "" },
      preferredLocations: [],
      jobTypes: [],
      noticePeriod: "",
      linkedinUrl: "",
      githubUrl: "",
      portfolioUrl: "",
      resumeKey: "",
    },
  });

  const experienceSections = useFieldArray({ control: form.control, name: "experience" });
  const educationSections = useFieldArray({ control: form.control, name: "education" });
  const differentAddress = useWatch({ control: form.control, name: "differentCurrentAddress" });
  const experienceValues = useWatch({ control: form.control, name: "experience" });

  const countryOptions = getCountryDataList().map((c) => ({
    value: c.iso2,
    label: `${getEmojiFlag(c.iso2)} ${c.name}`,
  }));

  const datePicker = (
    name: FieldPath<JobSeekerForm>,
    label: string,
    disabled = false,
    required = false
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-bold tracking-tight ml-1">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  disabled={disabled}
                  className="h-12 w-full justify-start rounded-2xl bg-muted/30 border-brand-border gap-2 font-normal hover:bg-muted/30"
                >
                  <FaCalendarAlt className="w-4 h-4 text-muted-foreground" />
                  {field.value ? (
                    format(field.value as Date, "MMM yyyy")
                  ) : (
                    <span className="text-muted-foreground/40">Pick a date</span>
                  )}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
              <Calendar
                mode="single"
                selected={field.value as Date | undefined}
                onSelect={field.onChange}
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
          <FormMessage className="ml-1 text-xs" />
        </FormItem>
      )}
    />
  );

  const addressDetails = (prefix: AddressPrefix, required = false) => {
    return (
      <>
        <FormField
          control={form.control}
          name={`${prefix}.line1`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-bold tracking-tight ml-1">
                Address line 1{required && <span className="text-red-500"> *</span>}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Street address, house no."
                  className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
                  {...field}
                />
              </FormControl>
              <FormMessage className="ml-1 text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.line2`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-bold tracking-tight ml-1">
                Address line 2
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Apartment, suite, landmark (optional)"
                  className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
                  {...field}
                />
              </FormControl>
              <FormMessage className="ml-1 text-xs" />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <FormField
            control={form.control}
            name={`${prefix}.city`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold tracking-tight ml-1">
                  City
                  {required && <span className="text-red-500"> *</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="San Francisco"
                    className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="ml-1 text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${prefix}.state`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold tracking-tight ml-1">
                  State / Province
                  {required && <span className="text-red-500"> *</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="California"
                    className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="ml-1 text-xs" />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <FormField
            control={form.control}
            name={`${prefix}.country`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold tracking-tight ml-1">
                  Country
                  {required && <span className="text-red-500"> *</span>}
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-12! w-full rounded-2xl bg-muted/30 border-brand-border data-placeholder:text-muted-foreground/40! focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getCountryDataList().map((country) => (
                      <SelectItem key={country.iso2} value={country.iso2}>
                        {getEmojiFlag(country.iso2)} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="ml-1 text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${prefix}.zip`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold tracking-tight ml-1">
                  ZIP / Postal code
                  {required && <span className="text-red-500"> *</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="94105"
                    className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="ml-1 text-xs" />
              </FormItem>
            )}
          />
        </div>
      </>
    );
  };

  const handleImageUpload = async () => {
    const file = await photo.selectFile(".jpg,.jpeg,.png,.webp");
    if (!file) return;
    try {
      const key = await photo.upload(file);
      form.setValue("profilePictureKey", key);
      setAvatarPreview(URL.createObjectURL(file));
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Failed to upload photo.");
    }
  };

  const handleResumeUpload = async () => {
    const file = await resume.selectFile(".pdf");
    if (!file) return;
    try {
      const key = await resume.upload(file);
      form.setValue("resumeKey", key, { shouldValidate: true });
      setResumeName(file.name);
      toast.success("Resume uploaded!");
    } catch {
      toast.error("Failed to upload resume.");
    }
  };

  const handleAddSkill = (index: number, fieldId: string) => {
    const val = (skillsDraft[fieldId] ?? "").trim().toLowerCase();
    if (!val) return;
    const list = form.getValues(`experience.${index}.skills`) ?? [];
    if (list.includes(val)) return;
    form.setValue(`experience.${index}.skills`, [...list, val], { shouldValidate: true });
    setSkillsDraft((prev) => ({ ...prev, [fieldId]: "" }));
  };

  const removeSkill = (index: number, skill: string) => {
    const list = form.getValues(`experience.${index}.skills`) ?? [];
    form.setValue(
      `experience.${index}.skills`,
      list.filter((s) => s !== skill),
      { shouldValidate: true }
    );
  };

  const onSubmit = async (values: CompleteJobSeekerProfileInput) => {
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

  const handleVerifyEmail = async () => {
    try {
      await axiosWrapper.post("/auth/verify-email/request");
      toast.success("Email verification link sent!");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to send verification link.");
    }
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
        id="jobseeker-profile-form"
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
                  A clear headshot helps employers recognize you.
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
              name="currentLocation"
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

        {/* Address */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FaMapMarkerAlt className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-black tracking-tight">Address Details</h3>
          </div>

          {/* Permanent address */}
          <div className="rounded-4xl border border-dashed border-brand-border bg-muted/10 p-6 space-y-6">
            <p className="font-black tracking-tight">Permanent address</p>
            {addressDetails("permanentAddress", true)}
          </div>

          {/* Different-address toggle */}
          <FormField
            control={form.control}
            name="differentCurrentAddress"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 ml-1 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="size-5 rounded-md border-brand-border data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                </FormControl>
                <FormLabel className="text-sm font-bold tracking-tight cursor-pointer">
                  Permanent address is different from current address
                </FormLabel>
              </FormItem>
            )}
          />

          {/* Current address — shown only when different from permanent */}
          {differentAddress && (
            <div className="rounded-4xl border border-dashed border-brand-border bg-muted/10 p-6 space-y-6">
              <p className="font-black tracking-tight">Current address</p>
              {addressDetails("currentAddress")}
            </div>
          )}
        </div>

        <Separator className="bg-brand-border" />

        {/* Professional */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FaBriefcase className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-black tracking-tight">Professional Details</h3>
          </div>
          {experienceSections.fields.map((item, i) => {
            const isCurrent = experienceValues?.[i]?.current;
            const skillList = experienceValues?.[i]?.skills ?? [];
            return (
              <div
                key={item.id}
                className="relative rounded-4xl border border-dashed border-brand-border bg-muted/10 p-6 space-y-6"
              >
                <button
                  type="button"
                  onClick={() => experienceSections.remove(i)}
                  disabled={i === 0}
                  aria-label="Remove section"
                  className="absolute top-4 right-4 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground"
                >
                  <FaTrash className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <FormField
                    control={form.control}
                    name={`experience.${i}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold tracking-tight ml-1">
                          Job Title <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="relative group/input">
                          <FaBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                          <FormControl>
                            <Input
                              placeholder="Senior Frontend Engineer"
                              className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="ml-1 text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`experience.${i}.experienceRange`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold tracking-tight ml-1">
                          Years of experience <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-12! w-full rounded-2xl bg-muted/30 border-brand-border data-placeholder:text-muted-foreground/40! focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all">
                              <SelectValue placeholder="Select experience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl border-brand-border">
                            <SelectItem value="0-1">0 - 1 years</SelectItem>
                            <SelectItem value="2-4">2 - 4 years</SelectItem>
                            <SelectItem value="5-7">5 - 7 years</SelectItem>
                            <SelectItem value="8+">8+ years</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="ml-1 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {datePicker(`experience.${i}.from`, "From", false, true)}
                  {datePicker(`experience.${i}.to`, "To", isCurrent === true)}
                </div>

                <FormField
                  control={form.control}
                  name={`experience.${i}.current`}
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 ml-1 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-bold tracking-tight cursor-pointer">
                        I currently work here
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`experience.${i}.bio`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold tracking-tight ml-1">
                        Bio <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about your background, what you're great at, and what you're looking for next..."
                          className="min-h-28 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all resize-none p-4"
                          {...field}
                        />
                      </FormControl>
                      <p className="ml-1 text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-60">
                        Minimum 20 characters
                      </p>
                      <FormMessage className="ml-1 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`experience.${i}.skills`}
                  render={({ fieldState }) => (
                    <FormItem>
                      <div className="relative group/input">
                        <FaBrain className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                        <Input
                          value={skillsDraft[item.id] ?? ""}
                          onChange={(e) =>
                            setSkillsDraft((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSkill(i, item.id);
                            }
                          }}
                          placeholder="Type a skill and press enter"
                          className={cn(
                            "h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all",
                            fieldState.error &&
                              "border-destructive ring-2 ring-destructive/20 focus-visible:border-destructive"
                          )}
                        />
                      </div>
                      {skillList.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {skillList.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="rounded-full pl-3 pr-2 py-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-bold gap-1.5"
                            >
                              {skill}
                              <button
                                type="button"
                                aria-label={`Remove ${skill}`}
                                onClick={() => removeSkill(i, skill)}
                                className="cursor-pointer opacity-60 hover:opacity-100"
                              >
                                <FaTimes className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <FormMessage className="ml-1 text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          className="rounded-full px-6 font-bold border-brand-border hover:bg-emerald-500/5 text-emerald-600 transition-all gap-2"
          onClick={() =>
            experienceSections.append({
              title: "",
              experienceRange: "",
              from: undefined,
              to: undefined,
              current: false,
              bio: "",
              skills: [],
            })
          }
        >
          <FaPlus className="w-4 h-4" />
          Add Experience
        </Button>

        <Separator className="bg-brand-border" />

        {/* Education */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FaGraduationCap className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-black tracking-tight">Education Details</h3>
          </div>
          {educationSections.fields.map((item, i) => (
            <div
              key={item.id}
              className="relative rounded-4xl border border-dashed border-brand-border bg-muted/10 p-6 space-y-6"
            >
              <button
                type="button"
                onClick={() => educationSections.remove(i)}
                disabled={i === 0}
                aria-label="Remove section"
                className="absolute top-4 right-4 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground"
              >
                <FaTrash className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <FormField
                  control={form.control}
                  name={`education.${i}.degree`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold tracking-tight ml-1">
                        Degree <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="B.S. Computer Science"
                          className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="ml-1 text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`education.${i}.university`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold tracking-tight ml-1">
                        University <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Stanford University"
                          className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="ml-1 text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {datePicker(`education.${i}.from`, "From", false, true)}
                {datePicker(`education.${i}.to`, "To", false, true)}
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="rounded-full px-6 font-bold border-brand-border hover:bg-emerald-500/5 text-emerald-600 transition-all gap-2"
            onClick={() =>
              educationSections.append({
                degree: "",
                university: "",
                from: undefined,
                to: undefined,
              })
            }
          >
            <FaPlus className="w-4 h-4" />
            Add education
          </Button>
        </div>

        <Separator className="bg-brand-border" />

        {/* Job Preferences */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FaDollarSign className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-black tracking-tight">Job Preferences</h3>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">
              Expected salary <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <FormField
                control={form.control}
                name="expectedSalary.min"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Min"
                        className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage className="ml-1 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedSalary.max"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Max"
                        className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage className="ml-1 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedSalary.currency"
                render={({ field }) => (
                  <FormItem>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-12! w-full rounded-2xl bg-muted/30 border-brand-border data-placeholder:text-muted-foreground/40! focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-brand-border">
                        {currencies.map((code) => (
                          <SelectItem key={code} value={code.toLowerCase()}>
                            {code} — {currencyName.of(code)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="ml-1 text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <FormField
              control={form.control}
              name="preferredLocations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold tracking-tight ml-1">
                    Preferred locations <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={countryOptions}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      placeholder="Select locations"
                      maxCount={3}
                      className="min-h-12 rounded-2xl bg-muted/30 border-brand-border"
                    />
                  </FormControl>
                  <FormMessage className="ml-1 text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="noticePeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold tracking-tight ml-1">
                    Notice period <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-12! w-full rounded-2xl bg-muted/30 border-brand-border data-placeholder:text-muted-foreground/40! focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all">
                        <SelectValue placeholder="Select notice period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-2xl border-brand-border">
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="15">15 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="ml-1 text-xs" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="jobTypes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold tracking-tight ml-1">
                  Job types <span className="text-red-500">*</span>
                </FormLabel>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Full-time", value: "fulltime" },
                    { label: "Part-time", value: "parttime" },
                    { label: "Contract", value: "contract" },
                    { label: "Internship", value: "internship" },
                    { label: "Remote", value: "remote" },
                  ].map((type) => {
                    const selected = field.value?.includes(type.value);
                    return (
                      <Badge
                        key={type.value}
                        variant="outline"
                        className={`rounded-full px-4 py-2 font-bold cursor-pointer transition-all ${
                          selected
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : "border-brand-border bg-muted/20 text-muted-foreground hover:bg-emerald-500/5 hover:text-emerald-600"
                        }`}
                        onClick={() => {
                          const cur = field.value ?? [];
                          field.onChange(
                            selected ? cur.filter((v) => v !== type.value) : [...cur, type.value]
                          );
                        }}
                      >
                        {selected && <FaCheck className="w-3 h-3 mr-1" strokeWidth={3} />}
                        {type.label}
                      </Badge>
                    );
                  })}
                </div>
                <FormMessage className="ml-1 text-xs" />
              </FormItem>
            )}
          />
        </div>

        <Separator className="bg-brand-border" />

        {/* Links & Resume */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FaLink className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-black tracking-tight">Links &amp; resume</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold tracking-tight ml-1">
                      LinkedIn <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative group/input">
                        <FaLinkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                        <Input
                          placeholder="linkedin.com/in/you"
                          className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="ml-1 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portfolioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative group/input">
                        <FaLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                        <Input
                          placeholder="Other links"
                          className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="ml-1 text-xs" />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="githubUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold tracking-tight ml-1">
                    GitHub <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative group/input">
                      <FaGithub className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
                      <Input
                        placeholder="github.com/you"
                        className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="ml-1 text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Resume dropzone */}
          <FormField
            control={form.control}
            name="resumeKey"
            render={({ fieldState }) => (
              <FormItem>
                <div
                  className={cn(
                    "relative group/upload border-2 border-dashed border-brand-border rounded-4xl p-10 flex flex-col items-center justify-center text-center space-y-5 hover:border-emerald-500/30 hover:bg-emerald-500/2 transition-all cursor-pointer",
                    fieldState.error && "border-destructive hover:border-destructive"
                  )}
                >
                  <div className="size-16 bg-emerald-500/10 rounded-[1.25rem] flex items-center justify-center shadow-inner group-hover/upload:scale-110 transition-transform">
                    <FaUpload className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-black tracking-tight">
                      Upload your resume <span className="text-red-500">*</span>
                    </p>
                    <p className="text-sm text-muted-foreground font-medium opacity-80 max-w-60">
                      {resumeName
                        ? `Selected: ${resumeName}`
                        : "Drop your PDF here or click to browse. Max size 4MB."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="rounded-full px-8 font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                    onClick={handleResumeUpload}
                    disabled={resume.isUploading}
                  >
                    {resume.isUploading ? (
                      <FaSpinner className="animate-spin w-4 h-4" />
                    ) : (
                      "Choose File"
                    )}
                  </Button>
                  <Badge
                    variant="outline"
                    className="rounded-full px-3 py-1 border-brand-border text-[10px] font-black uppercase tracking-[0.2em] opacity-40"
                  >
                    PDF ONLY • 4MB MAX
                  </Badge>
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
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-14 w-full sm:w-auto px-12 rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
          >
            {form.formState.isSubmitting ? <FaSpinner /> : "Complete profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CompleteProfileJobseeker;
