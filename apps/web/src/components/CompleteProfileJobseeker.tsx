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
  MapPin,
  Briefcase,
  GraduationCap,
  Building2,
  DollarSign,
  Link2,
  Upload,
  Camera,
  Brain,
  Plus,
  X,
  Check,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { useState } from "react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "sonner";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { getCountryDataList, getEmojiFlag } from "countries-list";

const CompleteProfileJobseeker = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>();
  const [differentAddress, setDifferentAddress] = useState(false);
  const [professionalSections, setProfessionalSections] = useState<string[]>([]);

  const photo = useFileUpload("profile-picture");
  const resume = useFileUpload("resume");

  const addressDetails = () => {
    return (
      <>
        <div className="space-y-3">
          <Label className="text-sm font-bold tracking-tight ml-1">Address line 1</Label>
          <Input
            placeholder="Street address, house no."
            className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-sm font-bold tracking-tight ml-1">Address line 2</Label>
          <Input
            placeholder="Apartment, suite, landmark (optional)"
            className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">City</Label>
            <Input
              placeholder="San Francisco"
              className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">State / Province</Label>
            <Input
              placeholder="California"
              className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Country</Label>
            <Select>
              <SelectTrigger className="h-12! w-full rounded-2xl bg-muted/30 border-brand-border data-placeholder:text-muted-foreground/40! focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {getCountryDataList().map((country) => (
                  <SelectItem key={country.iso2} value={country.iso2}>
                    {getEmojiFlag(country.iso2)} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">ZIP / Postal code</Label>
            <Input
              placeholder="94105"
              className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
            />
          </div>
        </div>
      </>
    );
  };

  const professionalDetails = () => {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Job Title</Label>
            <div className="relative group/input">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
              <Input
                placeholder="Senior Frontend Engineer"
                className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Years of experience</Label>
            <Select>
              <SelectTrigger className="h-12! w-full rounded-2xl bg-muted/30 border-brand-border data-placeholder:text-muted-foreground/40! focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all">
                <SelectValue placeholder="Select experience" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-brand-border">
                <SelectItem value="0-1">0 - 1 years</SelectItem>
                <SelectItem value="2-4">2 - 4 years</SelectItem>
                <SelectItem value="5-7">5 - 7 years</SelectItem>
                <SelectItem value="8+">8+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-bold tracking-tight ml-1">Bio</Label>
          <Textarea
            placeholder="Tell us about your background, what you're great at, and what you're looking for next..."
            className="min-h-28 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all resize-none p-4"
          />
          <p className="ml-1 text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-60">
            Minimum 20 characters
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-bold tracking-tight ml-1">Skills</Label>
          <div className="relative group/input">
            <Brain className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
            <Input
              placeholder="Type a skill and press enter"
              className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {["React", "TypeScript", "Node.js", "GraphQL"].map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="rounded-full pl-3 pr-2 py-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-bold gap-1.5"
              >
                {skill}
                <X className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100" />
              </Badge>
            ))}
          </div>
        </div>
      </>
    );
  };

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

  const handleResumeUpload = async () => {
    const file = await resume.selectFile(".pdf");
    if (!file) return;
    try {
      await resume.upload(file);
      setResumeName(file.name);
      toast.success("Resume uploaded!");
    } catch {
      toast.error("Failed to upload resume.");
    }
  };

  const handleExperienceSection = () => {
    setProfessionalSections((prev) => [...prev, crypto.randomUUID()]);
  };

  const removeProfessionalSection = (id: string) => {
    setProfessionalSections((prev) => prev.filter((x) => x !== id));
  };

  return (
    <>
      {/* Basics */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-500" />
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
              variant="outline"
              className="rounded-full px-6 font-bold border-brand-border hover:bg-emerald-500/5 transition-all gap-2"
              onClick={handleImageUpload}
              disabled={photo.isUploading}
            >
              {photo.isUploading ? (
                <LoaderCircle className="animate-spin w-4 h-4" />
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload photo
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Phone number</Label>
            <PhoneInput
              international
              defaultCountry="US"
              value={phone}
              onChange={setPhone}
              placeholder="(555) 000-0000"
              className="flex h-12 items-center gap-3 rounded-2xl border border-brand-border bg-muted/30 px-4 transition-all focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/20 [&_.PhoneInputInput]:h-full [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:placeholder:text-muted-foreground/40"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Current location</Label>
            <div className="relative group/input">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
              <Select>
                <SelectTrigger className="h-12! w-full pl-11 rounded-2xl bg-muted/30 border-brand-border data-placeholder:text-muted-foreground/40! focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all">
                  <SelectValue placeholder="San Francisco, CA" />
                </SelectTrigger>
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
          </div>
        </div>
      </div>

      <Separator className="bg-brand-border" />

      {/* Address */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-black tracking-tight">Address Details</h3>
        </div>

        {/* Permanent address */}
        <div className="rounded-4xl border border-dashed border-brand-border bg-muted/10 p-6 space-y-6">
          <p className="font-black tracking-tight">Permanent address</p>
          {addressDetails()}
        </div>

        {/* Different-address toggle */}
        <div className="flex items-center gap-3 ml-1">
          <Checkbox
            id="differentCurrent"
            checked={differentAddress}
            onCheckedChange={(checked) => setDifferentAddress(checked === true)}
            className="size-5 rounded-md border-brand-border data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
          />
          <Label
            htmlFor="differentCurrent"
            className="text-sm font-bold tracking-tight cursor-pointer"
          >
            Permanent address is different from current address
          </Label>
        </div>

        {/* Current address — shown only when different from permanent */}
        {differentAddress && (
          <div className="rounded-4xl border border-dashed border-brand-border bg-muted/10 p-6 space-y-6">
            <p className="font-black tracking-tight">Current address</p>
            {addressDetails()}
          </div>
        )}
      </div>

      <Separator className="bg-brand-border" />

      {/* Professional */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-black tracking-tight">Professional Details</h3>
        </div>
        {professionalSections.map((id) => (
          <div
            key={id}
            className="relative rounded-4xl border border-dashed border-brand-border bg-muted/10 p-6 space-y-6"
          >
            <button
              type="button"
              onClick={() => removeProfessionalSection(id)}
              aria-label="Remove section"
              className="absolute top-4 right-4 cursor-pointer text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {professionalDetails()}
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="rounded-full px-6 font-bold border-brand-border hover:bg-emerald-500/5 text-emerald-600 transition-all gap-2"
        onClick={handleExperienceSection}
      >
        <Plus className="w-4 h-4" />
        Add Experience
      </Button>

      <Separator className="bg-brand-border" />

      {/* Education */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-black tracking-tight">Education Details</h3>
        </div>
        <div className="rounded-4xl border border-dashed border-brand-border bg-muted/10 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold tracking-tight ml-1">Degree</Label>
              <Input
                placeholder="B.S. Computer Science"
                className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-bold tracking-tight ml-1">University</Label>
              <Input
                placeholder="Stanford University"
                className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold tracking-tight ml-1">Graduation year</Label>
              <Input
                placeholder="2020"
                className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
              />
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="rounded-full px-6 font-bold border-brand-border hover:bg-emerald-500/5 text-emerald-600 transition-all gap-2"
        >
          <Plus className="w-4 h-4" />
          Add education
        </Button>
      </div>

      <Separator className="bg-brand-border" />

      {/* Experience */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-black tracking-tight">Experience Details</h3>
        </div>
        <div className="rounded-4xl border border-dashed border-brand-border bg-muted/10 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold tracking-tight ml-1">Company</Label>
              <Input
                placeholder="Acme Inc."
                className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-bold tracking-tight ml-1">Title</Label>
              <Input
                placeholder="Frontend Engineer"
                className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Duration</Label>
            <Input
              placeholder="Jan 2021 - Present"
              className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Description</Label>
            <Textarea
              placeholder="What did you work on? Key wins, scope, and impact..."
              className="min-h-24 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all resize-none p-4"
            />
          </div>
        </div>
        <Button
          variant="outline"
          className="rounded-full px-6 font-bold border-brand-border hover:bg-emerald-500/5 text-emerald-600 transition-all gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Experience
        </Button>
      </div>

      <Separator className="bg-brand-border" />

      {/* Job Preferences */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-black tracking-tight">Job Preferences</h3>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-bold tracking-tight ml-1">Expected salary</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              placeholder="Min"
              className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
            />
            <Input
              placeholder="Max"
              className="h-12 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all px-4"
            />
            <Select>
              <SelectTrigger className="h-12! w-full rounded-2xl bg-muted/30 border-brand-border data-placeholder:text-muted-foreground/40! focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-brand-border">
                <SelectItem value="usd">USD</SelectItem>
                <SelectItem value="eur">EUR</SelectItem>
                <SelectItem value="gbp">GBP</SelectItem>
                <SelectItem value="inr">INR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Preferred locations</Label>
            <div className="relative group/input">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
              <Input
                placeholder="Remote, New York, London"
                className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">Notice period</Label>
            <Select>
              <SelectTrigger className="h-12! w-full rounded-2xl bg-muted/30 border-brand-border data-placeholder:text-muted-foreground/40! focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all">
                <SelectValue placeholder="Select notice period" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-brand-border">
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="15">15 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-bold tracking-tight ml-1">Job types</Label>
          <div className="flex flex-wrap gap-2">
            {["Full-time", "Part-time", "Contract", "Internship", "Remote"].map((type, i) => (
              <Badge
                key={type}
                variant="outline"
                className={`rounded-full px-4 py-2 font-bold cursor-pointer transition-all ${
                  i < 2
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    : "border-brand-border bg-muted/20 text-muted-foreground hover:bg-emerald-500/5 hover:text-emerald-600"
                }`}
              >
                {i < 2 && <Check className="w-3 h-3 mr-1" strokeWidth={3} />}
                {type}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Separator className="bg-brand-border" />

      {/* Links & Resume */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-black tracking-tight">Links &amp; resume</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">LinkedIn</Label>
            <div className="relative group/input">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
              <Input
                placeholder="linkedin.com/in/you"
                className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-bold tracking-tight ml-1">GitHub</Label>
            <div className="relative group/input">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-emerald-500 transition-colors" />
              <Input
                placeholder="github.com/you"
                className="h-12 pl-11 rounded-2xl bg-muted/30 border-brand-border placeholder:text-muted-foreground/40 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Resume dropzone */}
        <div className="relative group/upload border-2 border-dashed border-brand-border rounded-4xl p-10 flex flex-col items-center justify-center text-center space-y-5 hover:border-emerald-500/30 hover:bg-emerald-500/2 transition-all cursor-pointer">
          <div className="size-16 bg-emerald-500/10 rounded-[1.25rem] flex items-center justify-center shadow-inner group-hover/upload:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-black tracking-tight">Upload your resume</p>
            <p className="text-sm text-muted-foreground font-medium opacity-80 max-w-60">
              {resumeName
                ? `Selected: ${resumeName}`
                : "Drop your PDF here or click to browse. Max size 4MB."}
            </p>
          </div>
          <Button
            className="rounded-full px-8 font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            onClick={handleResumeUpload}
            disabled={resume.isUploading}
          >
            {resume.isUploading ? <LoaderCircle className="animate-spin w-4 h-4" /> : "Choose File"}
          </Button>
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 border-brand-border text-[10px] font-black uppercase tracking-[0.2em] opacity-40"
          >
            PDF ONLY • 4MB MAX
          </Badge>
        </div>
      </div>
    </>
  );
};

export default CompleteProfileJobseeker;
