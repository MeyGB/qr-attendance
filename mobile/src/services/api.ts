import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  LoginResponse,
  CheckInResponse,
  CheckOutResponse,
  AttendanceRecord,
  Employee,
  ApiErrorBody,
} from "../types";

// Your live backend's base URL.
const BASE_URL = "https://demo.lionkingfc.com/api";

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("authToken");
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
}

async function request<T>(
  path: string,
  { method = "GET", body }: RequestOptions = {},
): Promise<T> {
  const token = await getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json().catch(() => ({}))) as T & ApiErrorBody;

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

export const api = {
  login: (email: string, password: string): Promise<LoginResponse> =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  checkIn: (token: string): Promise<CheckInResponse> =>
    request<CheckInResponse>("/attendance/check-in", {
      method: "POST",
      body: { token },
    }),

  checkOut: (token: string): Promise<CheckOutResponse> =>
    request<CheckOutResponse>("/attendance/check-out", {
      method: "POST",
      body: { token },
    }),

  getHistory: (): Promise<AttendanceRecord[]> =>
    request<AttendanceRecord[]>("/attendance/history"),

  getMe: (): Promise<Employee> => request<Employee>("/employees/me"),
};

export async function saveSession(token: string): Promise<void> {
  await AsyncStorage.setItem("authToken", token);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem("authToken");
}

export async function hasSession(): Promise<boolean> {
  const token = await getToken();
  return Boolean(token);
}
