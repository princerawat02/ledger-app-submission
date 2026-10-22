import cors from "cors";
import dotenv from "dotenv";
import express, { ErrorRequestHandler } from "express";
import authRoutes from "./routes/auth.routes";
import loanRoutes from "./routes/loan.routes";
import summaryRoutes from "./routes/summary.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.status(200).json({ success: true, message: "MiniLedger API is running." });
});
app.use("/api/auth", authRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/summary", summaryRoutes);

app.use((_request, response) => {
  response.status(404).json({
    success: false,
    message: "The requested endpoint was not found.",
  });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error("Unhandled server error:", error);
  response.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
};

app.use(errorHandler);

export default app;
