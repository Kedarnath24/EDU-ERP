/**
 * api.ts
 * Centralised frontend → backend communication layer.
 * All backend calls go through this module. Components never
 * call fetch() directly; they use these typed callbacks instead.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Re-export BASE_URL for anything that needs it outside this module (e.g. AuthContext)
export { BASE_URL };

// ─────────────────────────────────────────────────────────────
// Token store
// AuthContext calls setApiToken() after login / logout so that
// every api.ts call automatically carries the right Bearer token.
// ─────────────────────────────────────────────────────────────

let _apiToken: string | null = null;

/**
 * Called by AuthContext immediately after login (set token) and
 * after logout (pass null).  Must be called before any API call.
 */
export function setApiToken(token: string | null): void {
    _apiToken = token;
}

function getAuthHeaders(): Record<string, string> {
    const base: Record<string, string> = { 'Content-Type': 'application/json' };
    if (_apiToken) {
        base['Authorization'] = `Bearer ${_apiToken}`;
    }
    return base;
}

async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: {
                ...getAuthHeaders(),
                ...(options.headers as Record<string, string>),
            },
        });

        const json = await res.json();

        if (!res.ok) {
            return { error: json.error || `Request failed with status ${res.status}` };
        }

        return { data: json as T };
    } catch (err) {
        console.error(`API fetch error [${path}]:`, err);
        return { error: 'Network error. Please check your connection.' };
    }
}


// ─────────────────────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────────────────────

export interface LoginResponse {
    message: string;
    session: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
    };
    user: {
        id: string;
        email: string;
        user_metadata?: Record<string, unknown>;
    };
}

/**
 * Authenticate with email + password.
 * Returns the Supabase session + user on success.
 */
export async function loginUser(
    email: string,
    password: string
): Promise<{ data?: LoginResponse; error?: string }> {
    return apiFetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

/**
 * Sign out the current session.
 * Requires the access token to be set via setApiToken() beforehand.
 */
export async function logoutUser(): Promise<{ error?: string }> {
    const result = await apiFetch<{ message: string }>('/api/auth/logout', {
        method: 'POST',
    });
    return result.error ? { error: result.error } : {};
}


// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface Employee {
    id: string;
    user_id: string;
    employee_code?: string;
    full_name: string;
    email: string;
    phone?: string;
    address?: string;
    department?: string;
    position?: string;
    manager?: string;
    join_date?: string;
    status?: string;
    avatar_url?: string;
    emergency_contact_name?: string;
    emergency_contact_relationship?: string;
    emergency_contact_phone?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_routing_number?: string;
    created_at?: string;
    updated_at?: string;
}

export interface AttendanceRecord {
    id: string;
    user_id: string;
    employee_id?: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
    check_in_time?: string;
    check_out_time?: string;
    check_in_note?: string;
    check_out_note?: string;
    break_start_time?: string;
    break_end_time?: string;
    break_type?: string;
    total_break_minutes?: number;
    work_mode?: 'office' | 'remote' | 'hybrid' | 'onsite';
    location?: string;
    work_hours?: number;
    created_at?: string;
    updated_at?: string;
}

export interface AttendanceStats {
    present_days: number;
    absent_days: number;
    total_hours: number;
    avg_hours_per_day: number;
    month: string;
}

// ─────────────────────────────────────────────────────────────
// Employee API
// ─────────────────────────────────────────────────────────────

/** Fetch the current user's employee profile */
export async function getMyEmployee(): Promise<{ data?: Employee; error?: string }> {
    const result = await apiFetch<{ employee: Employee }>('/api/employees/me');
    return result.error ? { error: result.error } : { data: result.data!.employee };
}

/** Update the current user's employee profile */
export async function updateMyEmployee(
    payload: Partial<Employee>
): Promise<{ data?: Employee; error?: string }> {
    const result = await apiFetch<{ employee: Employee }>('/api/employees/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
    return result.error ? { error: result.error } : { data: result.data!.employee };
}

/** Fetch all employees (admin) */
export async function getAllEmployees(): Promise<{ data?: Employee[]; error?: string }> {
    const result = await apiFetch<{ employees: Employee[] }>('/api/employees');
    return result.error ? { error: result.error } : { data: result.data!.employees };
}

// ─────────────────────────────────────────────────────────────
// Attendance API
// ─────────────────────────────────────────────────────────────

/** Check in for today */
export async function checkIn(payload: {
    work_mode?: 'office' | 'remote' | 'hybrid' | 'onsite';
    note?: string;
    location?: string;
}): Promise<{ data?: AttendanceRecord; error?: string }> {
    const result = await apiFetch<{ record: AttendanceRecord }>('/api/attendance/checkin', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return result.error ? { error: result.error } : { data: result.data!.record };
}

/** Check out for today */
export async function checkOut(payload?: {
    note?: string;
}): Promise<{ data?: AttendanceRecord; error?: string }> {
    const result = await apiFetch<{ record: AttendanceRecord }>('/api/attendance/checkout', {
        method: 'POST',
        body: JSON.stringify(payload || {}),
    });
    return result.error ? { error: result.error } : { data: result.data!.record };
}

/** Start a break */
export async function startBreak(payload?: {
    break_type?: 'lunch' | 'tea' | 'short' | 'meeting' | 'other';
}): Promise<{ data?: AttendanceRecord; error?: string }> {
    const result = await apiFetch<{ record: AttendanceRecord }>('/api/attendance/break/start', {
        method: 'POST',
        body: JSON.stringify(payload || {}),
    });
    return result.error ? { error: result.error } : { data: result.data!.record };
}

/** End the current break */
export async function endBreak(): Promise<{
    data?: { record: AttendanceRecord; break_duration_minutes: number };
    error?: string;
}> {
    const result = await apiFetch<{
        record: AttendanceRecord;
        break_duration_minutes: number;
    }>('/api/attendance/break/end', {
        method: 'POST',
    });
    return result.error ? { error: result.error } : { data: result.data };
}

/** Get today's attendance record */
export async function getTodayAttendance(): Promise<{
    data?: AttendanceRecord | null;
    error?: string;
}> {
    const result = await apiFetch<{ record: AttendanceRecord | null }>('/api/attendance/today');
    return result.error ? { error: result.error } : { data: result.data!.record };
}

/** Get attendance history */
export async function getAttendanceHistory(params?: {
    month?: string; // YYYY-MM
    limit?: number;
}): Promise<{ data?: AttendanceRecord[]; error?: string }> {
    const qs = new URLSearchParams();
    if (params?.month) qs.set('month', params.month);
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';

    const result = await apiFetch<{ records: AttendanceRecord[] }>(
        `/api/attendance/history${query}`
    );
    return result.error ? { error: result.error } : { data: result.data!.records };
}

/** Get attendance stats for the current month */
export async function getAttendanceStats(): Promise<{
    data?: AttendanceStats;
    error?: string;
}> {
    const result = await apiFetch<{ stats: AttendanceStats }>('/api/attendance/stats');
    return result.error ? { error: result.error } : { data: result.data!.stats };
}

// ─────────────────────────────────────────────────────────────
// HRM Attendance API (Admin — all employees)
// ─────────────────────────────────────────────────────────────

export interface TodayAttendanceRow {
    id: string;
    employee_id: string;
    name: string;
    department: string;
    checkIn: string;
    checkOut: string;
    status: string;
    hours: string;
    avatar: string;
    avatar_url?: string | null;
}

export interface TodayAttendanceSummary {
    total: number;
    present: number;
    absent: number;
    on_leave: number;
    late: number;
}

export interface AllTodayResponse {
    attendance: TodayAttendanceRow[];
    summary: TodayAttendanceSummary;
}

/** HRM: Fetch today's attendance for ALL employees */
export async function getAllTodayAttendance(): Promise<{
    data?: AllTodayResponse;
    error?: string;
}> {
    const result = await apiFetch<AllTodayResponse>('/api/attendance/all-today');
    return result.error ? { error: result.error } : { data: result.data! };
}

export interface DailyAttendanceEntry {
    date: string;
    checkIn: string;
    checkOut: string;
    status: string;
    hours: string;
    location: string;
}

export interface MonthlyEmployeeSummary {
    id: string;
    employee_id: string;
    name: string;
    department: string;
    email: string;
    joinDate: string | null;
    avatar: string;
    avatar_url?: string | null;
    present: number;
    absent: number;
    late: number;
    leave: number;
    overtime: string;
    dailyAttendance: DailyAttendanceEntry[];
}

export interface AllMonthlyResponse {
    month: string;
    summary: MonthlyEmployeeSummary[];
}

/** HRM: Fetch monthly attendance summary for ALL employees */
export async function getAllMonthlyAttendance(params?: {
    month?: string; // YYYY-MM
}): Promise<{
    data?: AllMonthlyResponse;
    error?: string;
}> {
    const qs = new URLSearchParams();
    if (params?.month) qs.set('month', params.month);
    const query = qs.toString() ? `?${qs.toString()}` : '';

    const result = await apiFetch<AllMonthlyResponse>(
        `/api/attendance/all-monthly${query}`
    );
    return result.error ? { error: result.error } : { data: result.data! };
}

// ─────────────────────────────────────────────────────────────
// Team / User Management API
// ─────────────────────────────────────────────────────────────

export interface CreateTeamMemberPayload {
    email: string;
    password: string;
    role?: 'admin' | 'manager' | 'member' | 'viewer';
    full_name?: string;
}

export interface CreateTeamMemberResponse {
    message: string;
    user: { id: string; email: string; role: string };
    employee: Employee | null;
}

/** Create a new team member (admin-only) */
export async function createTeamMember(
    payload: CreateTeamMemberPayload
): Promise<{ data?: CreateTeamMemberResponse; error?: string }> {
    const result = await apiFetch<CreateTeamMemberResponse>('/api/auth/create-user', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return result.error ? { error: result.error } : { data: result.data! };
}

// ───────────────────────────────────────────────────────────────
// HRM Employee Admin API
// ───────────────────────────────────────────────────────────────

export type EmployeeStatus =
    | 'active'
    | 'inactive'
    | 'on_leave'
    | 'terminated'
    | 'probation'
    | 'onboarding'
    | 'exit';

/** Extended employee type with HRM-specific fields */
export interface HRMEmployee extends Employee {
    designation?: string;
    location?: string;
    alternate_phone?: string;
    blood_group?: string;
    exit_workflow?: Record<string, unknown> | null;
}

export interface EmployeeFilters {
    search?: string;
    status?: EmployeeStatus | 'all';
    department?: string;
    limit?: number;
    offset?: number;
}

export interface AddEmployeePayload {
    full_name: string;
    email: string;
    designation?: string;
    department?: string;
    location?: string;
    phone?: string;
    alternate_phone?: string;
    join_date?: string;
    blood_group?: string;
    status?: EmployeeStatus;
}

/** List all employees with optional filters (admin) */
export async function listEmployees(
    filters: EmployeeFilters = {}
): Promise<{ data?: HRMEmployee[]; total?: number; error?: string }> {
    const qs = new URLSearchParams();
    if (filters.search) qs.set('search', filters.search);
    if (filters.status) qs.set('status', filters.status);
    if (filters.department) qs.set('department', filters.department);
    if (filters.limit != null) qs.set('limit', String(filters.limit));
    if (filters.offset != null) qs.set('offset', String(filters.offset));
    const query = qs.toString() ? `?${qs.toString()}` : '';

    const result = await apiFetch<{ employees: HRMEmployee[]; total: number }>(
        `/api/employees${query}`
    );
    return result.error
        ? { error: result.error }
        : { data: result.data!.employees, total: result.data!.total };
}

/** Admin: add a new employee (creates auth user + employee record) */
export async function addEmployee(
    payload: AddEmployeePayload
): Promise<{ data?: HRMEmployee; error?: string }> {
    const result = await apiFetch<{ employee: HRMEmployee }>('/api/employees', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return result.error ? { error: result.error } : { data: result.data!.employee };
}

/** Fetch a single employee by UUID */
export async function getEmployeeById(
    id: string
): Promise<{ data?: HRMEmployee; error?: string }> {
    const result = await apiFetch<{ employee: HRMEmployee }>(`/api/employees/${id}`);
    return result.error ? { error: result.error } : { data: result.data!.employee };
}

/** Admin: update any employee's profile */
export async function adminUpdateEmployee(
    id: string,
    payload: Partial<HRMEmployee>
): Promise<{ data?: HRMEmployee; error?: string }> {
    const result = await apiFetch<{ employee: HRMEmployee }>(`/api/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
    return result.error ? { error: result.error } : { data: result.data!.employee };
}

/** Admin: change an employee's status */
export async function updateEmployeeStatus(
    id: string,
    status: EmployeeStatus
): Promise<{ data?: HRMEmployee; error?: string }> {
    const result = await apiFetch<{ employee: HRMEmployee }>(`/api/employees/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
    return result.error ? { error: result.error } : { data: result.data!.employee };
}

/**
 * Admin: delete an employee record.
 * Pass deleteAuth=true to also remove the linked Supabase auth user.
 */
export async function deleteEmployee(
    id: string,
    deleteAuth = false
): Promise<{ error?: string }> {
    const result = await apiFetch<{ message: string }>(
        `/api/employees/${id}?deleteAuth=${deleteAuth}`,
        { method: 'DELETE' }
    );
    return result.error ? { error: result.error } : {};
}

// ─────────────────────────────────────────────────────────────
// Leave Request API
// ─────────────────────────────────────────────────────────────

export interface LeaveRequest {
    id: string;
    employee_id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    days: number;
    reason?: string | null;
    attachment_url?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    // Joined employee fields
    employee_name?: string | null;
    employee_email?: string | null;
    employee_department?: string | null;
    employee_avatar_url?: string | null;
    employee_code?: string | null;
}

export interface LeaveRequestSummary {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

export interface AllLeaveResponse {
    leave_requests: LeaveRequest[];
    summary: LeaveRequestSummary;
}

/** Employee: create a new leave request */
export async function createLeaveRequest(payload: {
    leave_type: string;
    start_date: string;
    end_date: string;
    reason?: string;
}): Promise<{ data?: LeaveRequest; error?: string }> {
    const result = await apiFetch<{ leave_request: LeaveRequest }>('/api/leave', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return result.error ? { error: result.error } : { data: result.data!.leave_request };
}

/** Employee: get own leave requests */
export async function getMyLeaveRequests(): Promise<{
    data?: LeaveRequest[];
    error?: string;
}> {
    const result = await apiFetch<{ leave_requests: LeaveRequest[] }>('/api/leave/my');
    return result.error ? { error: result.error } : { data: result.data!.leave_requests };
}

/** HRM Admin: get all leave requests */
export async function getAllLeaveRequests(params?: {
    status?: 'pending' | 'approved' | 'rejected' | 'all';
    limit?: number;
}): Promise<{ data?: AllLeaveResponse; error?: string }> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';

    const result = await apiFetch<AllLeaveResponse>(`/api/leave/all${query}`);
    return result.error ? { error: result.error } : { data: result.data! };
}

/** HRM Admin: approve a leave request */
export async function approveLeaveRequest(
    id: string
): Promise<{ data?: LeaveRequest; error?: string }> {
    const result = await apiFetch<{ leave_request: LeaveRequest }>(
        `/api/leave/${id}/approve`,
        { method: 'PATCH' }
    );
    return result.error ? { error: result.error } : { data: result.data!.leave_request };
}

/** HRM Admin: reject a leave request */
export async function rejectLeaveRequest(
    id: string
): Promise<{ data?: LeaveRequest; error?: string }> {
    const result = await apiFetch<{ leave_request: LeaveRequest }>(
        `/api/leave/${id}/reject`,
        { method: 'PATCH' }
    );
    return result.error ? { error: result.error } : { data: result.data!.leave_request };
}

/** Employee: cancel own pending leave request */
export async function cancelLeaveRequest(
    id: string
): Promise<{ error?: string }> {
    const result = await apiFetch<{ message: string }>(
        `/api/leave/${id}`,
        { method: 'DELETE' }
    );
    return result.error ? { error: result.error } : {};
}
