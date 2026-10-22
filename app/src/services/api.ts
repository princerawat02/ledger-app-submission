import axios, { isAxiosError } from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

export type Loan = {
  id: string;
  friendName: string;
  amount: string;
  dueDate: string;
  isRepaid: boolean;
  createdAt: string;
  isOverdue: boolean;
};

export type Summary = {
  totalLent: string;
  totalRepaid: string;
  overdueAmount: string;
  totalOutstanding: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { Accept: "application/json" },
});

async function request<T>(
  promise: Promise<{ data: ApiResponse<T> }>
): Promise<T> {
  try {
    const response = await promise;

    if (!response.data.success) {
      throw new Error(response.data.message || "Request failed.");
    }

    return response.data.data;
  } catch (error) {
    if (error instanceof Error && !isAxiosError(error)) {
      throw error;
    }

    if (isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        (error.code === "ECONNABORTED"
          ? "Request timed out."
          : error.request
            ? "Cannot connect to the backend."
            : "Request failed.");

      throw new Error(message);
    }

    throw new Error("Something went wrong.");
  }
}

const auth = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const api = {
  sendOtp: (phone: string) =>
    request(
      client.post<ApiResponse<null>>("/api/auth/send-otp", { phone })
    ),

  verifyOtp: (phone: string, otp: string) =>
    request(
      client.post<ApiResponse<{ token: string }>>(
        "/api/auth/verify-otp",
        { phone, otp }
      )
    ),

  getSummary: (token: string) =>
    request(
      client.get<ApiResponse<Summary>>("/api/summary", {
        headers: auth(token),
      })
    ),

  getLoans: (token: string) =>
    request(
      client.get<ApiResponse<Loan[]>>("/api/loans", {
        headers: auth(token),
      })
    ),

  createLoan: (
    token: string,
    body: { friendName: string; amount: number; dueDate: string }
  ) =>
    request(
      client.post<ApiResponse<Loan>>("/api/loans", body, {
        headers: auth(token),
      })
    ),

  repayLoan: (token: string, id: string) =>
    request(
      client.patch<ApiResponse<Loan>>(
        `/api/loans/${encodeURIComponent(id)}/repay`,
        undefined,
        { headers: auth(token) }
      )
    ),
};