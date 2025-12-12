/**
 * File Upload API Route
 * Handles file uploads to Cloudflare R2 storage
 */

import express, { Request, Response } from "express";
import multer from "multer";
import { authenticateToken } from "../middleware/auth";
import prisma from "../prismaClient";
import { deleteFromR2, getPresignedUrl, uploadToR2 } from "../services/r2Storage";

const router = express.Router();

// Configure multer for memory storage (we'll upload directly to R2)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and documents allowed."));
    }
  },
});

/**
 * POST /api/files/upload
 * Upload a file to R2 storage
 */
router.post("/upload", authenticateToken, upload.single("file"), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const file = req.file;
    const { category = "documents" } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Upload to R2
    const fileMetadata = await uploadToR2({
      userId: user.id,
      category,
      filename: file.originalname,
      contentType: file.mimetype,
      buffer: file.buffer,
      metadata: {
        uploadedBy: user.email,
      },
    });

    // Save file record to database
    const fileRecord = await prisma.uploaded_files.create({
      data: {
        id: (await import("crypto")).randomUUID(),
        userId: user.id,
        category,
        filename: file.originalname,
        key: fileMetadata.key,
        url: fileMetadata.url,
        size: fileMetadata.size,
        contentType: fileMetadata.contentType,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        url: fileRecord.url,
        size: fileRecord.size,
        uploadedAt: fileRecord.createdAt,
      },
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      error: "Failed to upload file",
      metadata: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/files/:fileId
 * Get file metadata and generate presigned URL
 */
router.get("/:fileId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { fileId } = req.params;

    // Get file record from database
    const fileRecord = await prisma.uploaded_files.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check ownership
    if (fileRecord.userId !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized access to file" });
    }

    // Generate presigned URL for secure access
    const presignedUrl = await getPresignedUrl(fileRecord.key, 3600); // 1 hour

    res.json({
      id: fileRecord.id,
      filename: fileRecord.filename,
      url: presignedUrl, // Secure temporary URL
      size: fileRecord.size,
      contentType: fileRecord.contentType,
      uploadedAt: fileRecord.createdAt,
    });
  } catch (error) {
    console.error("File retrieval error:", error);
    res.status(500).json({ error: "Failed to retrieve file" });
  }
});

/**
 * GET /api/files
 * List user's uploaded files
 */
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { category, page = 1, limit = 20 } = req.query;

    const where: any = { userId: user.id };
    if (category) {
      where.category = category;
    }

    const files = await prisma.uploaded_files.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.uploaded_files.count({ where });

    res.json({
      files: files.map((f: any) => ({
        id: f.id,
        filename: f.filename,
        category: f.category,
        size: f.size,
        contentType: f.contentType,
        uploadedAt: f.createdAt,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("File list error:", error);
    res.status(500).json({ error: "Failed to list files" });
  }
});

/**
 * DELETE /api/files/:fileId
 * Delete a file from R2 and database
 */
router.delete("/:fileId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { fileId } = req.params;

    // Get file record
    const fileRecord = await prisma.uploaded_files.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check ownership
    if (fileRecord.userId !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized to delete file" });
    }

    // Delete from R2
    await deleteFromR2(fileRecord.key);

    // Delete from database
    await prisma.uploaded_files.delete({
      where: { id: fileId },
    });

    res.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("File deletion error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;
