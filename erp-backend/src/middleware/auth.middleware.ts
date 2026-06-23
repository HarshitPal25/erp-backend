import type { NextFunction, Request, Response } from "express";
import { getRoleForEmail, readSession, type Role } from "../config/auth";

export type AuthenticatedRequest = Request & {
  user?: {
    email: string;
    role: Role;
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

  const role = getRoleForEmail(session.email);

  if (!role) {
    res.status(403).json({
      success: false,
      message: "Your account has no assigned role",
    });
    return;
  }

  req.user = {
    email: session.email,
    role,
  };

  next();
}

export function requireRole(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole("admin");
