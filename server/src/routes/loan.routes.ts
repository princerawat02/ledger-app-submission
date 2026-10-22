import { Router } from "express";
import { pool } from "../config/db";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";

const router = Router();

type LoanRow = {
  id: string;
  friend_name: string;
  amount: string;
  due_date: string;
  is_repaid: boolean;
  created_at: Date;
};

function serializeLoan(row: LoanRow) {
  return {
    id: row.id,
    friendName: row.friend_name,
    amount: row.amount,
    dueDate: row.due_date,
    isRepaid: row.is_repaid,
    createdAt: row.created_at,
    isOverdue: !row.is_repaid && row.due_date < new Date().toISOString().slice(0, 10),
  };
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

router.use(requireAuth);

router.post("/", async (request: AuthenticatedRequest, response, next) => {
  try {
    const { friendName, amount, dueDate } = request.body as {
      friendName?: unknown;
      amount?: unknown;
      dueDate?: unknown;
    };
    const numericAmount =
      typeof amount === "number"
        ? amount
        : typeof amount === "string" && amount.trim() !== ""
          ? Number(amount)
          : NaN;

    if (
      typeof friendName !== "string" ||
      friendName.trim().length === 0 ||
      friendName.trim().length > 100 ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !isValidDate(dueDate)
    ) {
      response.status(400).json({
        success: false,
        message: "friendName, a positive amount, and a valid dueDate (YYYY-MM-DD) are required.",
      });
      return;
    }

    const result = await pool.query<LoanRow>(
      `INSERT INTO loans (user_id, friend_name, amount, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, friend_name, amount, due_date::text AS due_date, is_repaid, created_at`,
      [request.userId, friendName.trim(), numericAmount, dueDate],
    );

    response.status(201).json({
      success: true,
      message: "Loan created successfully.",
      data: serializeLoan(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (request: AuthenticatedRequest, response, next) => {
  try {
    const result = await pool.query<LoanRow>(
      `SELECT id, friend_name, amount, due_date::text AS due_date, is_repaid, created_at
       FROM loans
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [request.userId],
    );

    response.status(200).json({
      success: true,
      message: "Loans retrieved successfully.",
      data: result.rows.map(serializeLoan),
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/repay", async (request: AuthenticatedRequest, response, next) => {
  try {
    const loanResult = await pool.query<{ is_repaid: boolean }>(
      "SELECT is_repaid FROM loans WHERE id = $1 AND user_id = $2",
      [request.params.id, request.userId],
    );

    if (loanResult.rowCount === 0) {
      response.status(404).json({
        success: false,
        message: "Loan not found.",
      });
      return;
    }
    if (loanResult.rows[0].is_repaid) {
      response.status(409).json({
        success: false,
        message: "This loan has already been repaid.",
      });
      return;
    }

    const result = await pool.query<LoanRow>(
      `UPDATE loans
       SET is_repaid = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, friend_name, amount, due_date::text AS due_date, is_repaid, created_at`,
      [request.params.id, request.userId],
    );

    response.status(200).json({
      success: true,
      message: "Loan marked as repaid.",
      data: serializeLoan(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
