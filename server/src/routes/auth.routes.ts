import { Router } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";

const router = Router();
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const pendingOtps = new Map<
  string,
  { otp: string; expiresAt: number; attempts: number }
>();

function isValidPhone(phone: unknown): phone is string {
  return typeof phone === "string" && /^\+[1-9]\d{7,14}$/.test(phone);
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET is missing. Add it to server/.env before starting the server.",
    );
  }
  return secret;
}

router.post("/send-otp", (request, response) => {
  const { phone } = request.body as { phone?: unknown };

  if (!isValidPhone(phone)) {
    response.status(400).json({
      success: false,
      message: "Phone must be a valid international number, such as +919876543210.",
    });
    return;
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  pendingOtps.set(phone, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });

  console.log(`[MiniLedger development OTP] ${phone}: ${otp}`);
  response.status(200).json({
    success: true,
    message: "OTP generated. Check the server terminal in development.",
    data: null,
  });
});

router.post("/verify-otp", async (request, response, next) => {
  try {
    const { phone, otp } = request.body as {
      phone?: unknown;
      otp?: unknown;
    };

    if (!isValidPhone(phone) || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      response.status(400).json({
        success: false,
        message: "A valid phone number and six-digit OTP are required.",
      });
      return;
    }

    const pending = pendingOtps.get(phone);
    if (!pending || pending.expiresAt <= Date.now()) {
      pendingOtps.delete(phone);
      response.status(401).json({
        success: false,
        message: "The OTP is invalid or expired.",
      });
      return;
    }

    pending.attempts += 1;
    if (pending.attempts > MAX_VERIFY_ATTEMPTS) {
      pendingOtps.delete(phone);
      response.status(429).json({
        success: false,
        message: "Too many OTP attempts. Request a new OTP.",
      });
      return;
    }

    if (pending.otp !== otp) {
      response.status(401).json({
        success: false,
        message: "The OTP is incorrect.",
      });
      return;
    }

    pendingOtps.delete(phone);
    const userResult = await pool.query<{
      id: string;
      phone: string;
      created_at: Date;
    }>(
      `INSERT INTO users (phone)
       VALUES ($1)
       ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
       RETURNING id, phone, created_at`,
      [phone],
    );
    const user = userResult.rows[0];
    const token = jwt.sign({ sub: user.id }, getJwtSecret(), {
      expiresIn: "7d",
    });

    response.status(200).json({
      success: true,
      message: "Phone number verified successfully.",
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          createdAt: user.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
