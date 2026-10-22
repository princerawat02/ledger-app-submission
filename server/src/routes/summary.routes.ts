import { Router } from "express";
import { pool } from "../config/db";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (request: AuthenticatedRequest, response, next) => {
  try {
    const result = await pool.query<{
      total_lent: string;
      total_repaid: string;
      overdue_amount: string;
      total_outstanding: string;
    }>(
      `SELECT
         COALESCE(SUM(amount), 0)::numeric(12, 2) AS total_lent,
         COALESCE(SUM(amount) FILTER (WHERE is_repaid), 0)::numeric(12, 2) AS total_repaid,
         COALESCE(SUM(amount) FILTER (WHERE NOT is_repaid AND due_date < CURRENT_DATE), 0)::numeric(12, 2) AS overdue_amount,
         COALESCE(SUM(amount) FILTER (WHERE NOT is_repaid), 0)::numeric(12, 2) AS total_outstanding
       FROM loans
       WHERE user_id = $1`,
      [request.userId],
    );
    const summary = result.rows[0];

    response.status(200).json({
      success: true,
      message: "Summary retrieved successfully.",
      data: {
        totalLent: summary.total_lent,
        totalRepaid: summary.total_repaid,
        overdueAmount: summary.overdue_amount,
        totalOutstanding: summary.total_outstanding,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
