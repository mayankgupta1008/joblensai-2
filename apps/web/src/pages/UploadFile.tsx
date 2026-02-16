import { Button } from "@/components/ui/button";
import axiosWrapper from "@/lib/axiosWrapper";
import { useRef } from "react";

const getFileType = (mimeType: string): "resume" | "profile-picture" | null => {
  if (mimeType === "application/pdf") return "resume";
  if (mimeType.startsWith("image/")) return "profile-picture";
  return null;
};

const UploadFile = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = getFileType(file.type);
    if (!fileType) {
      console.error("Unsupported file type:", file.type);
      return;
    }

    const { data } = await axiosWrapper.post("/files/upload", {
      fileType,
      fileName: file.name,
      contentType: file.type,
    });

    await fetch(data.presignedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
  };

  const handleViewFile = async () => {
    const { data } = await axiosWrapper.get("/files/view", {
      params: { fileType: "resume" },
    });

    window.open(data.presignedUrl, "_blank");
  };

  const handleDeleteFile = async () => {
    await axiosWrapper.delete("/files", {
      params: { fileType: "resume" },
    });
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelected}
        accept=".pdf, .jpg, .png, .webp, .jpeg"
        hidden
      />
      <Button onClick={handleFileUpload}>Upload Resume</Button>
      <Button onClick={handleViewFile}>View Resume</Button>
      <Button onClick={handleDeleteFile}>Delete Resume</Button>
    </>
  );
};

export default UploadFile;
