import jwt from "jsonwebtoken";

// Helper to sign Token
export const signToken = (user: any) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" },
  );
};
