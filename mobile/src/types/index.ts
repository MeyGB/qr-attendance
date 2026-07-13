export type Role = 'employee' | 'admin';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day';

export interface Employee {
  id: number;
  full_name: string;
  email: string;
  employee_code: string;
  role: Role;
  department: string | null;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string; // 'YYYY-MM-DD'
  check_in_time: string | null;
  check_out_time: string | null;
  status: AttendanceStatus;
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

// Root stack: full-screen flows (auth, the tab experience, and the modal scanner)
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Scan: { mode?: ScanMode } | undefined;
};

// Bottom tabs live inside "Main"
export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};
