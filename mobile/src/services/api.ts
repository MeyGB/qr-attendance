import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  LoginResponse,
  CheckInResponse,
  CheckOutResponse,
  AttendanceRecord,
  AdminAttendanceRecord,
  Employee,
  ApiErrorBody,
} from "../types";

// Your live backend's base URL.
const BASE_URL = "https://demo.lionkingfc.com/api";

const TOKEN_KEY = "authToken";
const EMPLOYEE_KEY = "employeeProfile";

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
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

  // Admin-only reads, used by the admin dashboard (see auth middleware on the backend).
  getEmployees: (): Promise<Employee[]> => request<Employee[]>("/employees"),

  getAllAttendance: (): Promise<AdminAttendanceRecord[]> =>
    request<AdminAttendanceRecord[]>("/attendance/all"),
};

export async function saveSession(
  token: string,
  employee: Employee,
): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [EMPLOYEE_KEY, JSON.stringify(employee)],
  ]);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, EMPLOYEE_KEY]);
}

export async function hasSession(): Promise<boolean> {
  const token = await getToken();
  return Boolean(token);
}

// Reads the role saved at login time, without a network round-trip.
// Used purely to pick which tab set to show on app launch — the actual
// token is still verified server-side on every API call.
export async function getStoredRole(): Promise<Employee["role"] | null> {
  const raw = await AsyncStorage.getItem(EMPLOYEE_KEY);
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as Employee).role ?? null;
  } catch {
    return null;
  }
}
