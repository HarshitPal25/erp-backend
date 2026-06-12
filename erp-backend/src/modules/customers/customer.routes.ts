import { Router } from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
} from "./customer.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.post("/", createCustomer);
router.get("/", getCustomers);
router.get("/:id", getCustomerById);

export default router;
