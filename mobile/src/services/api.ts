import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  LoginResponse,
  CheckInResponse,
  CheckOutResponse,
  AttendanceRecord,
  AdminAttendanceRecord,
  Employee,
  Shift,
  NewEmployeeInput,
  UpdateEmployeeInput,
  LeaveRequest,
  AdminLeaveRequest,
  NewLeaveRequestInput,
  LeaveStatus,
  Announcement,
  NewAnnouncementInput,
  ApiErrorBody,
  TodayAttendance,
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

  getToday: (): Promise<TodayAttendance> =>
    request<TodayAttendance>("/attendance/today"),

  getMe: (): Promise<Employee> => request<Employee>("/employees/me"),

  // Admin-only reads, used by the admin dashboard (see auth middleware on the backend).
  getEmployees: (): Promise<Employee[]> => request<Employee[]>("/employees"),

  getAllAttendance: (): Promise<AdminAttendanceRecord[]> =>
    request<AdminAttendanceRecord[]>("/attendance/all"),

  // Admin-only writes for Employee Management.
  createEmployee: (
    data: NewEmployeeInput,
  ): Promise<{ id: number; message: string }> =>
    request("/employees", {
      method: "POST",
      body: data as unknown as Record<string, unknown>,
    }),

  updateEmployee: (
    id: number,
    data: UpdateEmployeeInput,
  ): Promise<{ message: string }> =>
    request(`/employees/${id}`, {
      method: "PUT",
      body: data as unknown as Record<string, unknown>,
    }),

  getShifts: (): Promise<Shift[]> => request<Shift[]>("/shifts"),

  submitLeaveRequest: (
    data: NewLeaveRequestInput,
  ): Promise<{ id: number; message: string }> =>
    request("/leave", {
      method: "POST",
      body: data as unknown as Record<string, unknown>,
    }),

  getMyLeaveRequests: (): Promise<LeaveRequest[]> =>
    request<LeaveRequest[]>("/leave/mine"),

  // Leave requests (admin)
  getAllLeaveRequests: (status?: LeaveStatus): Promise<AdminLeaveRequest[]> =>
    request<AdminLeaveRequest[]>(`/leave${status ? `?status=${status}` : ""}`),

  reviewLeaveRequest: (
    id: number,
    status: "approved" | "rejected",
    review_note?: string,
  ): Promise<{ message: string }> =>
    request(`/leave/${id}`, { method: "PUT", body: { status, review_note } }),

  // Announcements (everyone can read, only admins can write)
  getAnnouncements: (): Promise<Announcement[]> =>
    request<Announcement[]>("/announcements"),

  createAnnouncement: (
    data: NewAnnouncementInput,
  ): Promise<{ id: number; message: string }> =>
    request("/announcements", {
      method: "POST",
      body: data as unknown as Record<string, unknown>,
    }),

  updateAnnouncement: (
    id: number,
    data: NewAnnouncementInput,
  ): Promise<{ message: string }> =>
    request(`/announcements/${id}`, {
      method: "PUT",
      body: data as unknown as Record<string, unknown>,
    }),

  deleteAnnouncement: (id: number): Promise<{ message: string }> =>
    request(`/announcements/${id}`, { method: "DELETE" }),
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
