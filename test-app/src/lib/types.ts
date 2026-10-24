export type UserRole = 'employee' | 'employer' | 'administrator';

export type AccountStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  employeeId: string;
  email?: string;
  passwordHash: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  /** Who must approve this account (employer user id) */
  pendingEmployerApproval?: boolean;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  timestamp: string;
}

export interface DwellSegment {
  latitude: number;
  longitude: number;
  altitude: number | null;
  startedAt: string;
  endedAt: string | null;
  durationMs: number;
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  startedAt: string;
  endedAt: string | null;
  startLocation: LocationPoint | null;
  endLocation: LocationPoint | null;
  path: LocationPoint[];
  dwells: DwellSegment[];
  totalDistanceMeters: number;
  active: boolean;
}

export type ReportType =
  | 'daily'
  | 'incident'
  | 'suggestion'
  | 'request'
  | 'activity';

export interface Report {
  id: string;
  type: ReportType;
  employeeId: string;
  employeeName: string;
  shiftId: string | null;
  body: string;
  createdAt: string;
}

export interface AppSettings {
  /** Designated employer email that receives admin confirmations */
  employerEmail: string | null;
  employerUserId: string | null;
  initialized: boolean;
}

export interface AuthSession {
  userId: string;
}
