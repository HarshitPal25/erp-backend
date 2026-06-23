import { Router } from "express";
import {
  createSessionToken,
  getExpiredSessionCookie,
  getRoleForEmail,
  getSessionCookie,
  isAllowedEmail,
  isValidPassword,
} from "../../config/auth";
import { requireAuth, type AuthenticatedRequest } from "../../middleware/auth.middleware";

const router = Router();

router.post("/login", (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!isAllowedEmail(email) || !isValidPassword(password)) {
    res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
    return;
  }

  res.setHeader("Set-Cookie", getSessionCookie(createSessionToken(email)));
  res.status(200).json({
    success: true,
    data: {
      email,
      role: getRoleForEmail(email),
    },
  });
});

router.get("/me", requireAuth, (req: AuthenticatedRequest, res) => {
  res.status(200).json({
    success: true,
    data: {
      email: req.user?.email,
      role: req.user?.role,
    },
  });
});

router.post("/logout", (_req, res) => {
  res.setHeader("Set-Cookie", getExpiredSessionCookie());
  res.status(200).json({
    success: true,
  });
});

export default router;
