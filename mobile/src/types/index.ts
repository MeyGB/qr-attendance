export type Role = "employee" | "admin";

export type AttendanceStatus = "present" | "late" | "absent" | "half_day";
export type LeaveType = "annual" | "sick" | "unpaid" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  days: number;
}

export interface AdminLeaveRequest extends LeaveRequest {
  employee_id: number;
  full_name: string;
  employee_code: string;
}

export interface NewLeaveRequestInput {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface NewAnnouncementInput {
  title: string;
  body: string;
}

export interface Employee {
  id: number;
  full_name: string;
  email: string;
  employee_code: string;
  role: Role;
  department: string | null;
  shift_id?: number | null;
  is_active?: number;
}

export interface Shift {
  id: number;
  name: string;
  start_time: string; // 'HH:MM:SS'
  end_time: string;
  grace_minutes: number;
  is_default: number;
}

export interface NewEmployeeInput {
  full_name: string;
  email: string;
  password: string;
  employee_code: string;
  department?: string | null;
  shift_id?: number | null;
  role?: Role;
}

export interface UpdateEmployeeInput {
  full_name?: string;
  email?: string;
  employee_code?: string;
  department?: string | null;
  shift_id?: number | null;
  role?: Role;
  is_active?: boolean;
  password?: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string; // 'YYYY-MM-DD'
  check_in_time: string | null;
  check_out_time: string | null;
  status: AttendanceStatus;
}

export interface AdminAttendanceRecord extends AttendanceRecord {
  full_name: string;
  employee_code: string;
}

export interface LoginResponse {
  token: string;
  employee: Employee;
}

export interface CheckInResponse {
  message: string;
  status: AttendanceStatus;
}

export interface CheckOutResponse {
  message: string;
}

export interface ApiErrorBody {
  error?: string;
}

export type ScanMode = "check-in" | "check-out";

// Root stack: full-screen flows (auth, the two role-specific tab experiences, and the modal scanner)
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  AdminMain: undefined;
  Scan: { mode?: ScanMode } | undefined;
  // EmployeeList: undefined;
  EmployeeForm: { employee?: Employee } | undefined;
  LeaveForm: undefined;
  LeaveApproval: undefined;
  AnnouncementList: undefined;
  AdminAnnouncements: undefined;
  AnnouncementForm: { announcement?: Announcement } | undefined;
};

// Bottom tabs live inside "Main" (employee role)
export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  ScanTab: undefined; // intercepted to open the root Scan modal, see MainTabs.tsx
  Leave: undefined;
  Profile: undefined;
};

// Bottom tabs live inside "AdminMain" (admin role)
export type AdminTabParamList = {
  Dashboard: undefined;
  Employees: undefined;
  Attendance: undefined;
  Settings: undefined;
};
