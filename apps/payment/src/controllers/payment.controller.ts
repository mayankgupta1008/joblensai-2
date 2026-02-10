import { Request, Response } from "express";

export const createOrder = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log("Error inside createOrder controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyOrder = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log("Error inside verifyOrder controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
