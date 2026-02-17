import { Request, Response } from "express";

export const createJobPost = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log("Error inside createJobPost controller", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const viewJobPost = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log("Error inside viewJobPost controller", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteJobPost = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log("Error inside deleteJobPost controller", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
