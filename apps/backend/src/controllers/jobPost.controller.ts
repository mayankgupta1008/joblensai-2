import type { Request, Response } from "express";
import JobPost from "@joblensai/shared/src/models/jobDetail.model.js";

export const createJobPost = async (req: Request, res: Response) => {
  try {
    await JobPost.create(req.body);
    return res.status(201).json({ success: true, message: "Job Post Created Successfully" });
  } catch (error) {
    console.log("Error inside createJobPost controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const viewJobPost = async (req: Request, res: Response) => {
  try {
    await JobPost.findById(req.params.id);
    return res.status(200).json({ success: true, message: "Job Post Fetched Successfully" });
  } catch (error) {
    console.log("Error inside viewJobPost controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const deleteJobPost = async (req: Request, res: Response) => {
  try {
    await JobPost.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Job Post Deleted Successfully" });
  } catch (error) {
    console.log("Error inside deleteJobPost controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
