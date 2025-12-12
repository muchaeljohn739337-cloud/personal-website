import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import * as nodemailer from "nodemailer";
import { z } from "zod";
import { config } from "../config";
import { authenticateToken } from "../middleware/auth";
import { rateLimit } from "../middleware/security";
import prisma from "../prismaClient";
import { createNotification, notifyAllAdmins } from "../services/notificationService";
import { getRedis } from "../services/redisClient";

const router = express.Router();

// Optional API key guard - only enforce if API_KEY is explicitly set
// This allows public access to auth endpoints while still supporting
// API key validation when needed for testing/internal use
const validateApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const expectedKey = process.env.API_KEY;

  // If no API_KEY is configured, skip validation (public access)
  if (!expectedKey) {
    return next();
  }

  // If API_KEY is configured, validate it
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }
  next();
};

// POST /api/auth/register - WITH ADMIN APPROVAL WORKFLOW
router.post("/register", validateApiKey, async (req, res) => {
  try {
    const { email, password, username, firstName, lastName } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await prisma.users.findFirst({
      where: { OR: [{ email }, ...(username ? [{ username }] : [])] },
      select: { id: true },
    });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        id: (await import("crypto")).randomUUID(),
        email,
        username: username || email.split("@")[0],
        passwordHash,
        firstName: firstName || "",
        lastName: lastName || "",
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        active: false, // pending admin approval
        emailVerified: true,
        updatedAt: new Date(),
      },
    });

    // Notify admins of pending registration
    try {
      await notifyAllAdmins({
        type: "all",
        category: "admin",
        title: "New User Registration - Pending Approval",
        message: `User ${email} (${firstName} ${lastName}) has registered and is awaiting approval.`,
        priority: "high",
        data: { userId: user.id, email, firstName, lastName },
      });
    } catch (notifyErr) {
      console.error("Failed to notify admins of registration:", notifyErr);
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      message: "Registration submitted. Awaiting admin approval.",
      status: "pending_approval",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

// POST /api/auth/login
router.post("/login", validateApiKey, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.users.findFirst({
      where: { OR: [{ email }, { username: email }] },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        usdBalance: true,
        active: true,
        emailVerified: true,
        totpEnabled: true,
        totpVerified: true,
      },
    });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Email not verified. Please verify your email to continue.",
        status: "email_unverified",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        error: "Account pending admin approval.",
        status: "pending_approval",
      });
    }

    // Check if TOTP is enabled - require 2FA
    if (user.totpEnabled && user.totpVerified) {
      // Return temporary token for TOTP verification
      const tempToken = jwt.sign(
        { userId: user.id, email: user.email, requireTotp: true },
        config.jwtSecret,
        { expiresIn: "5m" } // Short expiry for TOTP step
      );

      return res.json({
        message: "TOTP required",
        status: "totp_required",
        tempToken,
        userId: user.id,
      });
    }

    // Update last login (best effort)
    try {
      await prisma.users.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    } catch {}

    const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        usdBalance: (user as any).usdBalance?.toString?.() ?? "0",
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Failed to login" });
  }
});

// ============================================
// TOTP LOGIN COMPLETION
// ============================================
router.post("/login/totp", validateApiKey, async (req, res) => {
  try {
    const { tempToken, totpCode } = req.body;

    if (!tempToken || !totpCode) {
      return res.status(400).json({ error: "tempToken and totpCode required" });
    }

    // Verify temp token
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, config.jwtSecret);
      if (!decoded.requireTotp) {
        return res.status(401).json({ error: "Invalid token" });
      }
    } catch {
      return res.status(401).json({ error: "Token expired or invalid" });
    }

    // Get user and verify TOTP
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        usdBalance: true,
        totpSecret: true,
        totpEnabled: true,
      },
    });

    if (!user || !user.totpSecret || !user.totpEnabled) {
      return res.status(400).json({ error: "TOTP not configured" });
    }

    // Verify TOTP code
    const speakeasy = require("speakeasy");
    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: "base32",
      token: totpCode,
      window: 2,
    });

    if (!verified) {
      return res.status(401).json({ 
        error: "Invalid TOTP code",
        message: "Incorrect code. Please try again."
      });
    }

    // Update last login
    try {
      await prisma.users.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    } catch {}

    // Generate full session token
    const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        usdBalance: (user as any).usdBalance?.toString?.() ?? "0",
      },
    });
  } catch (err) {
    console.error("TOTP login error:", err);
    return res.status(500).json({ error: "Failed to complete TOTP login" });
  }
});

// ============================================
// DOCTOR REGISTRATION (Invite-Only)
// ============================================

const registerDoctorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  specialization: z.string().min(1),
  licenseNumber: z.string().min(1),
  phoneNumber: z.string().optional(),
  inviteCode: z.string().min(1, "Invite code is required"),
});

// POST /api/auth/register-doctor
router.post("/register-doctor", validateApiKey, async (req, res) => {
  try {
    const data = registerDoctorSchema.parse(req.body);

    // Verify invite code
    const expectedCode = process.env.DOCTOR_INVITE_CODE;
    if (!expectedCode) {
      return res.status(500).json({
        error: "Server configuration error: DOCTOR_INVITE_CODE not set",
      });
    }

    if (data.inviteCode !== expectedCode) {
      return res.status(403).json({ error: "Invalid invite code" });
    }

    // Check if doctor already exists
    const existing = await prisma.doctors.findFirst({
      where: { email: data.email },
      select: { id: true },
    });
    if (existing) {
      return res.status(400).json({ error: "Doctor with this email already exists" });
    }

    // Check license number uniqueness
    const existingLicense = await prisma.doctors.findFirst({
      where: { licenseNumber: data.licenseNumber },
      select: { id: true },
    });
    if (existingLicense) {
      return res.status(400).json({ error: "License number already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create doctor (status: PENDING by default)
    const doctor = await prisma.doctors.create({
      data: {
        id: (await import("crypto")).randomUUID(),
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        specialization: data.specialization,
        licenseNumber: data.licenseNumber,
        phoneNumber: data.phoneNumber || null,
        inviteCode: data.inviteCode,
        status: "PENDING",
        updatedAt: new Date(),
      },
    });

    // Generate JWT for doctor
    const token = jwt.sign({ doctorId: doctor.id, email: doctor.email, type: "doctor" }, config.jwtSecret, {
      expiresIn: "7d",
    });

    // Notify all admins about new doctor registration
    try {
      await notifyAllAdmins({
        type: "all",
        category: "admin",
        title: "New Doctor Registration",
        message: `Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization}) has registered. Review their credentials and verify their account.`,
        priority: "high",
        data: {
          doctorId: doctor.id,
          email: doctor.email,
          specialization: doctor.specialization,
          licenseNumber: doctor.licenseNumber,
        },
      });
    } catch (e) {
      console.error("Admin notify failed (doctor registered):", e);
    }

    return res.status(201).json({
      message: "Doctor registered successfully. Awaiting admin verification.",
      token,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization,
        status: doctor.status,
      },
    });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("Doctor registration error:", err);
    return res.status(500).json({ error: "Failed to register doctor" });
  }
});

// POST /api/auth/login-doctor
router.post("/login-doctor", validateApiKey, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const doctor = await prisma.doctors.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        specialization: true,
        status: true,
        passwordHash: true,
      },
    });

    if (!doctor || !doctor.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, doctor.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ doctorId: doctor.id, email: doctor.email, type: "doctor" }, config.jwtSecret, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Doctor login successful",
      token,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization,
        status: doctor.status,
      },
    });
  } catch (err) {
    console.error("Doctor login error:", err);
    return res.status(500).json({ error: "Failed to login doctor" });
  }
});

// ------- OTP (Email Only) Flows (Redis-backed) ------- //
const otpLimiter = rateLimit({ windowMs: 60_000, maxRequests: 5 });

const sendOtpSchema = z.object({
  email: z.string().email({ message: "Valid email required" }),
});

const verifyOtpSchema = z.object({
  email: z.string().email({ message: "Valid email required" }),
  code: z.string().length(6),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Valid email required" }),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "Reset token is required" }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Simple SMTP test payload
const testSmtpSchema = z.object({
  to: z.string().email(),
  subject: z.string().optional(),
  message: z.string().optional(),
});

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateResetToken(): string {
  return require("crypto").randomBytes(32).toString("hex");
}

// POST /api/auth/send-otp
router.post("/send-otp", otpLimiter, async (req, res) => {
  try {
    const { email } = sendOtpSchema.parse(req.body || {});

    const user = await prisma.users.findFirst({
      where: { email },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const code = generateCode();
    const key = email;

    const redis = getRedis();
    const ttlSeconds = 5 * 60;
    const maxAttemptsWindow = 10 * 60; // 10 minutes
    const maxSendPerWindow = 5;
    const countKey = `otp:cnt:${key}`;
    const lockKey = `otp:lock:${key}`;

    // Fallback in-memory store when Redis not configured
    const mem: any = (global as any).__otpMem || ((global as any).__otpMem = new Map<string, any>());

    if (redis) {
      const locked = await redis.get(lockKey);
      if (locked) return res.status(429).json({ error: "Too many attempts. Try later." });
      const cnt = await redis.incr(countKey);
      if (cnt === 1) await redis.expire(countKey, maxAttemptsWindow);
      if (cnt > maxSendPerWindow) {
        await redis.set(lockKey, "1", "EX", 30 * 60); // 30 min lockout
        return res.status(429).json({ error: "Too many OTP requests. Try again later." });
      }
      await redis.setex(`otp:${key}`, ttlSeconds, code);
    } else {
      const now = Date.now();
      const entry = mem.get(key) || { count: 0, windowStart: now };
      if (now - entry.windowStart > maxAttemptsWindow * 1000) {
        entry.count = 0;
        entry.windowStart = now;
      }
      entry.count += 1;
      if (entry.count > maxSendPerWindow) {
        return res.status(429).json({ error: "Too many OTP requests. Try again later." });
      }
      mem.set(key, { ...entry, code, exp: now + ttlSeconds * 1000 });
    }

    // Send via nodemailer if configured, else log
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your verification code",
        text: `Your Advancia verification code is ${code}`,
      });
    } else {
      console.log(`[DEV] OTP for ${email}: ${code}`);
    }

    return res.json({ message: "OTP sent" });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("send-otp error:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

// POST /api/auth/test-smtp
// Sends a direct SMTP email using configured Gmail credentials; does NOT require DB
router.post("/test-smtp", validateApiKey, async (req, res) => {
  try {
    const { to, subject, message } = testSmtpSchema.parse(req.body || {});

    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
    const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
    const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || EMAIL_USER || undefined;

    if (!EMAIL_USER || !EMAIL_PASSWORD) {
      return res.status(500).json({
        error: "SMTP not configured. Set EMAIL_USER and EMAIL_PASSWORD (Gmail App Password) in backend/.env",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
    });

    await transporter.sendMail({
      from: EMAIL_FROM,
      replyTo: EMAIL_REPLY_TO,
      to,
      subject: subject || "SMTP Test from Advancia",
      text: message || "This is a direct SMTP test using Gmail. If you see this, your EMAIL_USER/EMAIL_PASSWORD work.",
    });

    return res.json({ message: "SMTP test email sent", to });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: err.issues });
    }
    console.error("test-smtp error:", err);
    return res.status(500).json({ error: "Failed to send SMTP test email" });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", otpLimiter, async (req, res) => {
  try {
    const { email, code } = verifyOtpSchema.parse(req.body || {});
    const key = email;

    const redis = getRedis();
    let stored: string | null = null;
    if (redis) {
      stored = await redis.get(`otp:${key}`);
      if (!stored) return res.status(400).json({ error: "No OTP requested or OTP expired" });
      if (String(code) !== stored) return res.status(400).json({ error: "Invalid OTP" });
      await redis.del(`otp:${key}`);
    } else {
      const mem: any = (global as any).__otpMem || ((global as any).__otpMem = new Map<string, any>());
      const entry = mem.get(key);
      if (!entry || Date.now() > entry.exp) return res.status(400).json({ error: "No OTP requested or OTP expired" });
      if (String(code) !== entry.code) return res.status(400).json({ error: "Invalid OTP" });
      mem.delete(key);
    }

    const user = await prisma.users.findFirst({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    await prisma.users.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, { expiresIn: "7d" });

    try {
      await notifyAllAdmins({
        type: "all",
        category: "admin",
        title: "User Email Verified",
        message: `User ${user.email} has verified their email and is awaiting approval.`,
        priority: "normal",
        data: { userId: user.id, email: user.email },
      });
    } catch (e) {
      console.error("Admin notify failed (email verified):", e);
    }

    return res.json({
      message: "OTP verified",
      status: "pending_approval",
      token,
    });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("verify-otp error:", err);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", otpLimiter, async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body || {});

    const user = await prisma.users.findFirst({
      where: { email },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const resetToken = generateResetToken();
    const key = `reset:${user.id}`;

    const redis = getRedis();
    const ttlSeconds = 60 * 60; // 1 hour
    const maxAttemptsWindow = 10 * 60; // 10 minutes
    const maxRequestsPerWindow = 3;
    const countKey = `reset:cnt:${email}`;
    const lockKey = `reset:lock:${email}`;

    // Fallback in-memory store when Redis not configured
    const mem: any = (global as any).__resetMem || ((global as any).__resetMem = new Map<string, any>());

    if (redis) {
      const locked = await redis.get(lockKey);
      if (locked) return res.status(429).json({ error: "Too many attempts. Try later." });
      const cnt = await redis.incr(countKey);
      if (cnt === 1) await redis.expire(countKey, maxAttemptsWindow);
      if (cnt > maxRequestsPerWindow) {
        await redis.set(lockKey, "1", "EX", 30 * 60); // 30 min lockout
        return res.status(429).json({
          error: "Too many password reset requests. Try again later.",
        });
      }
      await redis.setex(key, ttlSeconds, resetToken);
    } else {
      const now = Date.now();
      const entry = mem.get(key) || { count: 0, windowStart: now };
      if (now - entry.windowStart > maxAttemptsWindow * 1000) {
        entry.count = 0;
        entry.windowStart = now;
      }
      entry.count += 1;
      if (entry.count > maxRequestsPerWindow) {
        return res.status(429).json({
          error: "Too many password reset requests. Try again later.",
        });
      }
      mem.set(key, {
        ...entry,
        token: resetToken,
        exp: now + ttlSeconds * 1000,
      });
    }

    // Send reset email
    const resetLink = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset your Advancia password",
        html: `<p>Hi ${
          user.firstName || "there"
        },</p><p>You requested a password reset for your Advancia account.</p><p>Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p><p>This link will expire in 1 hour.</p><p>If you didn't request this reset, please ignore this email.</p><p>Best,<br>The Advancia Team</p>`,
      });
    } else {
      console.log(`[DEV] Password reset for ${email}: ${resetLink}`);
    }

    return res.json({ message: "Password reset email sent" });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("forgot-password error:", err);
    return res.status(500).json({ error: "Failed to send reset email" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body || {});

    const redis = getRedis();
    const mem: any = (global as any).__resetMem || ((global as any).__resetMem = new Map<string, any>());

    let userId: string | null = null;
    let storedToken: string | null = null;

    if (redis) {
      // Find the user ID by scanning all reset:* keys
      const keys = await redis.keys("reset:*");
      for (const key of keys) {
        if (key.startsWith("reset:") && !key.includes(":cnt:") && !key.includes(":lock:")) {
          const stored = await redis.get(key);
          if (stored === token) {
            userId = key.replace("reset:", "");
            storedToken = stored;
            break;
          }
        }
      }
    } else {
      // Check in-memory store
      for (const [key, entry] of mem.entries()) {
        if (key.startsWith("reset:") && entry.token === token && entry.exp > Date.now()) {
          userId = key.replace("reset:", "");
          storedToken = entry.token;
          break;
        }
      }
    }

    if (!userId || !storedToken) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Update user password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    // Clean up the token
    if (redis) {
      await redis.del(`reset:${userId}`);
    } else {
      mem.delete(`reset:${userId}`);
    }

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("reset-password error:", err);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

// POST /api/auth/test-email// POST /api/auth/test-email
// Sends a simple email notification to the authenticated user to verify SMTP configuration
router.post("/test-email", validateApiKey, authenticateToken, async (req: any, res) => {
  try {
    const user = req.user;
    if (!user?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const subject = req.body?.subject || "Test Email from Advancia";
    const message = req.body?.message || "This is a test email sent from the Advancia backend to verify SMTP settings.";

    await createNotification({
      userId: user.userId,
      type: "email",
      category: "system",
      title: subject,
      message,
    });

    return res.json({ message: "Test email enqueued" });
  } catch (err) {
    console.error("test-email error:", err);
    return res.status(500).json({ error: "Failed to send test email" });
  }
});

// GET /api/auth/me - Get current user data from token
router.get("/me", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (err) {
    console.error("auth/me error:", err);
    return res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// PUT /api/auth/me - Update current user profile (self-edit)
// Users can update: firstName, lastName, phone, username
// Users CANNOT update: email, role, balance, active (admin-only)
router.put("/me", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { firstName, lastName, username } = req.body;

    // Validate input - at least one field must be provided
    if (!firstName && !lastName && !username) {
      return res.status(400).json({
        error: "At least one field must be provided: firstName, lastName, username",
      });
    }

    // Check if username is already taken (if being updated)
    if (username) {
      const existingUser = await prisma.users.findFirst({
        where: {
          username: username,
          NOT: { id: userId },
        },
      });
      if (existingUser) {
        return res.status(409).json({ error: "Username already taken" });
      }
    }

    // Build update data - only include provided fields
    const updateData: Record<string, string> = {};
    if (firstName !== undefined) updateData.firstName = String(firstName).trim();
    if (lastName !== undefined) updateData.lastName = String(lastName).trim();
    if (username !== undefined) updateData.username = String(username).trim();

    // Validate field lengths
    if (updateData.firstName && updateData.firstName.length > 50) {
      return res.status(400).json({ error: "First name must be 50 characters or less" });
    }
    if (updateData.lastName && updateData.lastName.length > 50) {
      return res.status(400).json({ error: "Last name must be 50 characters or less" });
    }
    if (updateData.username && (updateData.username.length < 3 || updateData.username.length > 30)) {
      return res.status(400).json({ error: "Username must be between 3 and 30 characters" });
    }

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("auth/me PUT error:", err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

// ===== PASSWORD RESET ROUTES =====

// Helper function to send password reset email
async function sendPasswordResetEmail(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset - Advancia PayLedger",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your Advancia PayLedger account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this reset, please ignore this email.</p>
    `,
  });
}

// Password reset routes removed - use Redis-based implementation

/**
 * GET /api/auth/error
 * Handle authentication error callbacks
 * Used by frontend auth flow for OAuth errors, NextAuth errors, etc.
 */
router.get("/error", (req, res) => {
  const { error, error_description, code, message } = req.query;

  // Log the error for debugging
  console.error("Authentication error:", {
    error: error || code,
    description: error_description || message,
    query: req.query,
  });

  // Return standardized error response
  res.status(400).json({
    success: false,
    error: error || code || "authentication_error",
    message: error_description || message || "Authentication failed",
    metadata: req.query,
  });
});

export default router;
