import type { Request, Response } from "express";
import Notification from "@joblensai/shared/src/models/notification.model.js";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      unreadCount,
    });
  } catch (error) {
    console.error("Error in getNotifications:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        userId,
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.log("Error inside markAsRead controller", error);
    return res.status(401).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    const result = await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    return res.status(200).json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error in markAllAsRead:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
