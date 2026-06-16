import { useState } from "react";
import axiosWrapper from "@/lib/axiosWrapper";

type FileType = "resume" | "profile-picture";

export function useFileUpload(type: FileType) {
  const [isUploading, setIsUploading] = useState(false);

  // opens the OS file selector and resolves with the chosen file
  // (null if the user cancels). `accept` filters the picker, e.g. ".pdf".
  const selectFile = (accept = "") =>
    new Promise<File | null>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.onchange = () => resolve(input.files?.[0] ?? null);
      input.oncancel = () => resolve(null);
      input.click();
    });

  // uploads the file to S3 via a presigned URL and returns the S3 key.
  // throws on failure so the caller can handle it with try/catch.
  const upload = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const { data } = await axiosWrapper.post(`/file/upload/${type}`, {
        fileName: file.name,
        contentType: file.type,
      });
      await fetch(data.presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      return data.key as string;
    } finally {
      setIsUploading(false);
    }
  };

  return { selectFile, upload, isUploading };
}
