import dotenv from "dotenv";
import app from "./app";
import { pool } from "./config/db";

dotenv.config();

const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, () => {
  console.log(`MiniLedger API listening on http://localhost:${port}`);
});

function shutDown(signal: string): void {
  console.log(`${signal} received. Closing server...`);
  server.close(() => {
    void pool.end().then(() => process.exit(0));
  });
}

process.once("SIGINT", () => shutDown("SIGINT"));
process.once("SIGTERM", () => shutDown("SIGTERM"));
