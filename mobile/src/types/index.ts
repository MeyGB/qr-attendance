export type Role = 'employee' | 'admin';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day';

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

export type ScanMode = 'check-in' | 'check-out';

// Root stack: full-screen flows (auth, the two role-specific tab experiences, and the modal scanner)
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  AdminMain: undefined;
  Scan: { mode?: ScanMode } | undefined;
  EmployeeList: undefined;
  EmployeeForm: { employee?: Employee } | undefined;
};

// Bottom tabs live inside "Main" (employee role)
export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

// Bottom tabs live inside "AdminMain" (admin role)
export type AdminTabParamList = {
  Dashboard: undefined;
  Manage: undefined;
  Profile: undefined;
};