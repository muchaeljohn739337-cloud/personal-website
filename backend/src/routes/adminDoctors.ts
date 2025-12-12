import { Request, Response, Router } from "express";
import { requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";
// import { DoctorStatus } from "@prisma/client";

const router = Router();

// Get all doctors with optional status filter
router.get("/doctors", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where = status && status !== "ALL" ? { status: status as string } : {};

    const doctors = await prisma.doctors.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({ doctors, count: doctors.length });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

// Verify doctor
router.post("/doctor/:id/verify", requireAdmin, async (req: Request, res: Response) => {
  try {
    const doctor = await prisma.doctors.update({
      where: { id: req.params.id },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    });

    res.json({ message: "Doctor verified successfully", doctor });
  } catch (error) {
    console.error("Error verifying doctor:", error);
    res.status(500).json({ error: "Failed to verify doctor" });
  }
});

// Suspend doctor
router.post("/doctor/:id/suspend", requireAdmin, async (req: Request, res: Response) => {
  try {
    const doctor = await prisma.doctors.update({
      where: { id: req.params.id },
      data: { status: "SUSPENDED" },
    });

    res.json({ message: "Doctor suspended successfully", doctor });
  } catch (error) {
    console.error("Error suspending doctor:", error);
    res.status(500).json({ error: "Failed to suspend doctor" });
  }
});

// Delete doctor
router.delete("/doctor/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.doctors.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Doctor deleted successfully" });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({ error: "Failed to delete doctor" });
  }
});

export default router;
