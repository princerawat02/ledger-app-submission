import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  userId?: string;
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

export function requireAuth(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): void {
  const authorization = request.header("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : undefined;

  if (!token) {
    response.status(401).json({
      success: false,
      message: "A Bearer token is required.",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      response.status(401).json({
        success: false,
        message: "The authentication token is invalid.",
      });
      return;
    }

    request.userId = payload.sub;
    next();
  } catch {
    response.status(401).json({
      success: false,
      message: "The authentication token is invalid or expired.",
    });
  }
}
