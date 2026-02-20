import type { Request, Response } from "express";
import JobPost from "@joblensai/shared/src/models/jobDetail.model.js";

export const createJobPost = async (req: Request, res: Response) => {
  try {
    await JobPost.create(req.body);
    return res.status(201).json({ message: "Job post created successfully" });
  } catch (error) {
    console.log("Error inside createJobPost controller", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const viewJobPost = async (req: Request, res: Response) => {
  try {
    await JobPost.findById(req.params.id);
    return res.status(200).json({ message: "Job post fetched successfully" });
  } catch (error) {
    console.log("Error inside viewJobPost controller", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteJobPost = async (req: Request, res: Response) => {
  try {
    await JobPost.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Job post deleted successfully" });
  } catch (error) {
    console.log("Error inside deleteJobPost controller", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
