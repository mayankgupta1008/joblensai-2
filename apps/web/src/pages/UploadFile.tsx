import { Button } from "@/components/ui/button";

const UploadFile = () => {
  const handleFileSelect = async () => {};

  const handleViewFile = async () => {};

  const handleDeleteFile = async () => {};

  return (
    <>
      <Button onClick={handleFileSelect}>Upload Resume</Button>
      <Button onClick={handleViewFile}>View Resume</Button>
      <Button onClick={handleDeleteFile}>Delete Resume</Button>
    </>
  );
};

export default UploadFile;
