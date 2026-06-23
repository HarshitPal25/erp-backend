import { Router } from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "./customer.controller";
import { requireAuth, requireAdmin, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.post("/", requireRole("admin", "delhi"), createCustomer);
router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.put("/:id", requireAdmin, updateCustomer);
router.delete("/:id", requireAdmin, deleteCustomer);

export default router;
