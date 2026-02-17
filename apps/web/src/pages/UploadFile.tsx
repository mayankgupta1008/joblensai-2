import { Button } from "@/components/ui/button";
import axiosWrapper from "@/lib/axiosWrapper";
import { useRef } from "react";

type FileType = "resume" | "profile-picture";

const getFileType = (mimeType: string): FileType | null => {
  if (mimeType === "application/pdf") return "resume";
  if (mimeType.startsWith("image/")) return "profile-picture";
  return null;
};

const UploadFile = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
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

    const { data } = await axiosWrapper.post(`/file/upload/${fileType}`, {
      fileName: file.name,
      contentType: file.type,
    });

    await fetch(data.presignedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
  };

  const handleViewResume = async () => {
    const { data } = await axiosWrapper.get("/file/resume");
    window.open(data.presignedUrl, "_blank");
  };

  const handleViewProfilePicture = async () => {
    const { data } = await axiosWrapper.get("/file/profile-picture");
    window.open(data.presignedUrl, "_blank");
  };

  const handleDeleteResume = async () => {
    await axiosWrapper.delete("/file/resume");
  };

  const handleDeleteProfilePicture = async () => {
    await axiosWrapper.delete("/file/profile-picture");
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
      <Button onClick={openFilePicker}>Upload File</Button>
      <Button onClick={handleViewResume}>View Resume</Button>
      <Button onClick={handleDeleteResume}>Delete Resume</Button>
      <Button onClick={handleViewProfilePicture}>View Profile Picture</Button>
      <Button onClick={handleDeleteProfilePicture}>
        Delete Profile Picture
      </Button>
    </>
  );
};

export default UploadFile;
