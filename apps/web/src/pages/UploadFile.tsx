import { Button } from "@/components/ui/button";
import axiosWrapper from "@/lib/axiosWrapper";
import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FaUpload,
  FaFileAlt,
  FaImage,
  FaTrash,
  FaEye,
  FaMagic,
  FaArrowRight,
} from "react-icons/fa";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FileType = "resume" | "profile-picture";

const getFileType = (mimeType: string): FileType | null => {
  if (mimeType === "application/pdf") return "resume";
  if (mimeType.startsWith("image/")) return "profile-picture";
  return null;
};

const UploadFile = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = getFileType(file.type);
    if (!fileType) {
      toast.error("Unsupported file type. Please upload PDF or Images.");
      return;
    }

    setIsUploading(true);
    try {
      const { data } = await axiosWrapper.post(`/file/upload/${fileType}`, {
        fileName: file.name,
        contentType: file.type,
      });

      await fetch(data.presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      toast.success(`${fileType} uploaded successfully!`);
    } catch (error) {
      console.log(error);
      toast.error("Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewFile = async (type: FileType) => {
    try {
      const { data } = await axiosWrapper.get(`/file/${type}`);
      window.open(data.presignedUrl, "_blank");
    } catch (error) {
      console.log(error);
      toast.error(`Failed to fetch ${type}.`);
    }
  };

  const handleDeleteFile = async (type: FileType) => {
    try {
      await axiosWrapper.delete(`/file/${type}`);
      toast.success(`${type} deleted successfully.`);
    } catch (error) {
      console.log(error);
      toast.error(`Failed to delete ${type}.`);
    }
  };

  return (
    <div className="relative min-h-screen selection:bg-emerald-500/30 overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-linear-to-br from-emerald-500/15 to-blue-500/5 blur-[130px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[5%] left-[-10%] w-[40%] h-[40%] rounded-full bg-linear-to-tr from-blue-600/8 to-emerald-500/15 blur-[110px] opacity-30" />
      </div>

      <div className="container mx-auto px-4 md:px-8 py-10 md:py-16 max-w-7xl">
        <section className="relative overflow-hidden rounded-4xl border border-brand-border bg-background/40 backdrop-blur-xl p-8 md:p-12 mb-10 shadow-2xl">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] opacity-60" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge
                variant="outline"
                className="mb-6 px-4 py-1.5 border-brand-border bg-emerald-500/5 text-emerald-600 tracking-wide font-bold"
              >
                <FaMagic className="w-3.5 h-3.5 mr-2 text-emerald-500 animate-pulse" />
                ASSET MANAGER
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60 leading-none">
                File Center
              </h1>
              <p className="mt-6 text-muted-foreground text-lg md:text-xl max-w-2xl font-medium opacity-90 leading-relaxed">
                Upload your latest resume and profile assets. AI optimization works best with
                up-to-date data.
              </p>
            </div>

            <Button
              size="lg"
              className="h-14 px-10 rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95 group transition-all shrink-0"
              onClick={openFilePicker}
              disabled={isUploading}
            >
              <FaUpload className="w-5 h-5 mr-3" />
              {isUploading ? "Uploading..." : "Upload New File"}
            </Button>
          </div>
        </section>

        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelected}
          accept=".pdf, .jpg, .png, .webp, .jpeg"
          className="hidden"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Resume Card */}
          <AssetCard
            title="Professional Resume"
            description="Used for AI matching and company applications."
            icon={FaFileAlt}
            badge="PDF ONLY"
            onView={() => handleViewFile("resume")}
            onDelete={() => handleDeleteFile("resume")}
            tone="emerald"
          />

          {/* Profile Picture Card */}
          <AssetCard
            title="Profile Picture"
            description="Displayed on your profile and to recruiters."
            icon={FaImage}
            badge="JPG, PNG, WEBP"
            onView={() => handleViewFile("profile-picture")}
            onDelete={() => handleDeleteFile("profile-picture")}
            tone="blue"
          />
        </div>

        {/* Tip Section */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/5 border border-brand-border shadow-sm animate-in fade-in zoom-in duration-1000">
            <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <FaMagic className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">
              Tip: Keep your resume under 4MB for the fastest AI processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AssetCard = ({ title, description, icon: Icon, badge, onView, onDelete, tone }: any) => (
  <Card
    className={cn(
      "relative overflow-hidden rounded-4xl border-brand-border bg-background/40 backdrop-blur-xl shadow-xl group/card",
      tone === "emerald" ? "hover:border-emerald-500/30" : "hover:border-blue-500/30"
    )}
  >
    <CardHeader className="p-8 pb-4">
      <div className="flex justify-between items-start">
        <div
          className={cn(
            "size-16 rounded-[1.25rem] flex items-center justify-center shadow-inner group-hover/card:scale-110 transition-transform",
            tone === "emerald"
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-blue-500/10 text-blue-600"
          )}
        >
          <Icon className="w-8 h-8" />
        </div>
        <Badge
          variant="outline"
          className={cn(
            "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest opacity-60",
            tone === "emerald" ? "border-brand-border" : "border-blue-500/20"
          )}
        >
          {badge}
        </Badge>
      </div>
      <CardTitle className="text-2xl font-black tracking-tight mt-6 group-hover/card:text-emerald-600 transition-colors">
        {title}
      </CardTitle>
      <CardDescription className="text-base font-medium opacity-80 mt-2">
        {description}
      </CardDescription>
    </CardHeader>
    <CardContent className="p-8 pt-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-xl font-bold border-brand-border hover:bg-emerald-500/5 group/btn"
          onClick={onView}
        >
          <FaEye className="w-4 h-4 mr-2" />
          View Current
          <FaArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
        </Button>
        <Button
          variant="ghost"
          className="h-12 px-6 rounded-xl font-bold text-red-500 hover:bg-red-500/10"
          onClick={onDelete}
        >
          <FaTrash className="w-4 h-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default UploadFile;
