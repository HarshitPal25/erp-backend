import type { NextFunction, Request, Response } from "express";
import { readSession } from "../config/auth";

export type AuthenticatedRequest = Request & {
  user?: {
    email: string;
  };
};

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const session = readSession(req);

  if (!session) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  req.user = {
    email: session.email,
  };

  next();
}
