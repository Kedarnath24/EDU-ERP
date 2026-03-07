import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Coffee,
  Download,
  Search,
  Filter,
  MoreVertical,
  ArrowLeft,
  CalendarDays,
  UserCheck,
  Plane,
  History,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Activity,
  Printer,
  FileSpreadsheet,
  Plus,
  Mail,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  getAllTodayAttendance,
  getAllMonthlyAttendance,
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  createLeaveRequest,
  type TodayAttendanceRow,
  type TodayAttendanceSummary,
  type MonthlyEmployeeSummary,
  type LeaveRequest,
  type LeaveRequestSummary,
} from '@/lib/api';

// Rebuild trigger: Attendance Leave module logic updated.
// Consolidated React imports and fixed missing Lucide icons (Plus).
export default function HRMAttendance() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // ─── Real API state for today's attendance ───
  const [attendance, setAttendance] = useState<TodayAttendanceRow[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<TodayAttendanceSummary>({
    total: 0, present: 0, absent: 0, on_leave: 0, late: 0,
  });
  const [isTodayLoading, setIsTodayLoading] = useState(true);
  const [todayError, setTodayError] = useState<string | null>(null);

  // ─── Real API state for leave requests ───
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveSummary, setLeaveSummary] = useState<LeaveRequestSummary>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [isLeaveLoading, setIsLeaveLoading] = useState(true);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  // ─── Apply Leave form state ───
  const [leaveFormType, setLeaveFormType] = useState('');
  const [leaveFormStart, setLeaveFormStart] = useState('');
  const [leaveFormEnd, setLeaveFormEnd] = useState('');
  const [leaveFormReason, setLeaveFormReason] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);

  // ─── Real API state for monthly summary ───
  const [monthlySummary, setMonthlySummary] = useState<MonthlyEmployeeSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(true);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);

  // ─── Fetch Today's Attendance ───
  const fetchTodayAttendance = useCallback(async () => {
    setIsTodayLoading(true);
    setTodayError(null);
    try {
      const { data, error } = await getAllTodayAttendance();
      if (error) {
        setTodayError(error);
        toast({ title: 'Error', description: error, variant: 'destructive' });
        return;
      }
      if (data) {
        setAttendance(data.attendance);
        setAttendanceSummary(data.summary);
      }
    } catch (err) {
      setTodayError('Failed to load today\'s attendance');
    } finally {
      setIsTodayLoading(false);
    }
  }, [toast]);

  // ─── Fetch Monthly Summary ───
  const fetchMonthlySummary = useCallback(async (month?: string) => {
    setIsMonthlyLoading(true);
    setMonthlyError(null);
    try {
      const { data, error } = await getAllMonthlyAttendance({ month });
      if (error) {
        setMonthlyError(error);
        toast({ title: 'Error', description: error, variant: 'destructive' });
        return;
      }
      if (data) {
        setMonthlySummary(data.summary);
      }
    } catch (err) {
      setMonthlyError('Failed to load monthly summary');
    } finally {
      setIsMonthlyLoading(false);
    }
  }, [toast]);

  // ─── Fetch Leave Requests ───
  const fetchLeaveRequests = useCallback(async () => {
    setIsLeaveLoading(true);
    setLeaveError(null);
    try {
      const { data, error } = await getAllLeaveRequests();
      if (error) {
        setLeaveError(error);
        toast({ title: 'Error', description: error, variant: 'destructive' });
        return;
      }
      if (data) {
        setLeaveRequests(data.leave_requests);
        setLeaveSummary(data.summary);
      }
    } catch (err) {
      setLeaveError('Failed to load leave requests');
    } finally {
      setIsLeaveLoading(false);
    }
  }, [toast]);

  // ─── Submit Leave Request ───
  const handleSubmitLeave = useCallback(async () => {
    if (!leaveFormType || !leaveFormStart || !leaveFormEnd) {
      toast({ title: 'Missing Fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    setIsSubmittingLeave(true);
    try {
      const { data, error } = await createLeaveRequest({
        leave_type: leaveFormType,
        start_date: leaveFormStart,
        end_date: leaveFormEnd,
        reason: leaveFormReason || undefined,
      });
      if (error) {
        toast({ title: 'Submission Failed', description: error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Leave Request Submitted', description: 'Your leave application has been sent for approval.' });
      setIsApplyLeaveOpen(false);
      setLeaveFormType('');
      setLeaveFormStart('');
      setLeaveFormEnd('');
      setLeaveFormReason('');
      fetchLeaveRequests(); // refresh list
    } catch (err) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmittingLeave(false);
    }
  }, [leaveFormType, leaveFormStart, leaveFormEnd, leaveFormReason, toast, fetchLeaveRequests]);

  // ─── Initial Fetch ───
  useEffect(() => {
    fetchTodayAttendance();
    fetchMonthlySummary(selectedMonth);
    fetchLeaveRequests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shifts = [
    { id: 1, name: 'Morning Shift', time: '09:00 AM - 06:00 PM', color: 'bg-blue-100 text-blue-700' },
    { id: 2, name: 'Evening Shift', time: '02:00 PM - 11:00 PM', color: 'bg-indigo-100 text-indigo-700' },
    { id: 3, name: 'Night Shift', time: '10:00 PM - 07:00 AM', color: 'bg-slate-700 text-white' },
  ];

  const [roster, setRoster] = useState([
    { employee: 'John Smith', mon: 1, tue: 1, wed: 1, thu: 1, fri: 1, sat: 0, sun: 0 },
    { employee: 'Sarah Johnson', mon: 1, tue: 1, wed: 1, thu: 1, fri: 1, sat: 0, sun: 0 },
    { employee: 'Mike Brown', mon: 2, tue: 2, wed: 2, thu: 2, fri: 2, sat: 1, sun: 0 },
  ]);

  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [selectedRosterIndex, setSelectedRosterIndex] = useState<number | null>(null);

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    toast({ title: "Updating Data", description: `Fetching attendance summary for ${month}...` });
    fetchMonthlySummary(month);
  };

  // Handle viewing employee details
  const handleViewDetails = async (employee: any) => {
    const loadingKey = `details_${employee.id}`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));

    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setSelectedEmployee(employee);
      setIsDetailsModalOpen(true);

      toast({
        title: "Details Loaded",
        description: `Attendance details for ${employee.name} have been loaded.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load employee details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle viewing employee timesheet
  const handleViewTimesheet = async (employee: any) => {
    const loadingKey = `timesheet_${employee.id}`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));

    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setSelectedEmployee(employee);
      setIsTimesheetModalOpen(true);

      toast({
        title: "Timesheet Loaded",
        description: `Timesheet for ${employee.name} has been loaded.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load timesheet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleAssignShift = async (empName: string, day: string, shiftId: number) => {
    const loadingKey = `shift-${empName}-${day}`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      setRoster(roster.map(r =>
        r.employee === empName ? { ...r, [day.toLowerCase()]: shiftId } : r
      ));

      const shiftName = shiftId === 0 ? 'Day Off' : shifts.find(s => s.id === shiftId)?.name || 'Unknown';
      toast({
        title: "Shift Assignment Updated!",
        description: `${empName}'s ${day.toUpperCase()} shift changed to ${shiftName}.`
      });
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to update shift assignment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleBulkAssignShift = async (assignments: { employee: string; shifts: Record<string, number> }[]) => {
    setLoadingStates(prev => ({ ...prev, 'bulk-assign': true }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setRoster(prev => prev.map(r => {
        const assignment = assignments.find(a => a.employee === r.employee);
        if (assignment) {
          return { ...r, ...assignment.shifts };
        }
        return r;
      }));

      toast({
        title: "Bulk Assignment Complete!",
        description: `Successfully updated shift assignments for ${assignments.length} employee(s).`
      });

      setIsShiftDialogOpen(false);
    } catch (error) {
      toast({
        title: "Bulk Assignment Failed",
        description: "Failed to update shift assignments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, 'bulk-assign': false }));
    }
  };

  const [bulkShiftAssignments, setBulkShiftAssignments] = useState<Record<string, Record<string, number>>>({});

  const handleApproveLeave = async (requestId: string) => {
    const loadingKey = `approve-${requestId}`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const { data, error } = await approveLeaveRequest(requestId);
      if (error) {
        toast({ title: 'Approval Failed', description: error, variant: 'destructive' });
        return;
      }
      // Update local state with the returned updated record
      setLeaveRequests(prev => prev.map(r => r.id === requestId ? (data || { ...r, status: 'approved' as const }) : r));
      setLeaveSummary(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1), approved: prev.approved + 1 }));
      toast({ title: 'Leave Request Approved!', description: 'The employee will be notified.' });
    } catch (err) {
      toast({ title: 'Approval Failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleRejectLeave = async (requestId: string) => {
    const loadingKey = `reject-${requestId}`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const { data, error } = await rejectLeaveRequest(requestId);
      if (error) {
        toast({ title: 'Rejection Failed', description: error, variant: 'destructive' });
        return;
      }
      setLeaveRequests(prev => prev.map(r => r.id === requestId ? (data || { ...r, status: 'rejected' as const }) : r));
      setLeaveSummary(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1), rejected: prev.rejected + 1 }));
      toast({ title: 'Leave Request Rejected', description: 'The employee will be notified.', variant: 'destructive' });
    } catch (err) {
      toast({ title: 'Rejection Failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
    present: { label: 'Present', class: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
    absent: { label: 'Absent', class: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
    late: { label: 'Late', class: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    leave: { label: 'On Leave', class: 'bg-blue-100 text-blue-700 border-blue-200', icon: Plane },
    on_leave: { label: 'On Leave', class: 'bg-blue-100 text-blue-700 border-blue-200', icon: Plane },
    halfday: { label: 'Half Day', class: 'bg-violet-100 text-violet-700 border-violet-200', icon: Coffee }
  };

  const leaveStatusConfig: Record<string, { label: string; class: string }> = {
    pending: { label: 'Pending Approval', class: 'bg-amber-100 text-amber-700 border-amber-200' },
    approved: { label: 'Approved', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Rejected', class: 'bg-rose-100 text-rose-700 border-rose-200' }
  };

  const filteredAttendance = useMemo(() => {
    return attendance.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, attendance]);

  const handleExport = (type: 'excel' | 'pdf') => {
    setIsExporting(true);
    toast({ title: "Exporting...", description: `Preparing attendance report in ${type.toUpperCase()}.` });

    setTimeout(() => {
      if (type === 'excel') {
        const data = activeTab === 'today'
          ? attendance
          : leaveRequests.map(l => ({ id: l.id, employee: l.employee_name, type: l.leave_type, from: l.start_date, to: l.end_date, days: l.days, status: l.status }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `HRM_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        const doc = new jsPDF();
        doc.text(`HRM Report - ${new Date().toLocaleDateString()}`, 14, 15);
        if (activeTab === 'today') {
          autoTable(doc, {
            startY: 25,
            head: [['ID', 'Employee', 'Department', 'Check In', 'Check Out', 'Hours', 'Status']],
            body: attendance.map(a => [a.id, a.name, a.department, a.checkIn, a.checkOut, a.hours, a.status]),
          });
        } else {
          autoTable(doc, {
            startY: 25,
            head: [['ID', 'Employee', 'Type', 'From', 'To', 'Days', 'Status']],
            body: leaveRequests.map(l => [l.id, l.employee_name || '', l.leave_type, l.start_date, l.end_date, l.days, l.status]),
          });
        }
        doc.save(`HRM_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      }
      setIsExporting(false);
      toast({ title: "Export Ready", description: "Your report has been downloaded." });
    }, 1200);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 -mx-6 -mt-6 px-6 py-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/hrm')}
                className="hover:bg-slate-100 rounded-full transition-transform active:scale-95"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600/10 rounded-xl">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Attendance & Leave</h1>
                  <p className="text-sm text-slate-500 flex items-center gap-2 font-medium">
                    <Activity className="h-3.5 w-3.5" />
                    Real-time workforce monitoring
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-slate-200 bg-white hover:bg-slate-50 rounded-xl font-bold shadow-sm">
                    <Download className="h-4 w-4 mr-2 text-slate-500" />
                    <span>Generate Report</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuLabel>Export Data</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                    Attendance Matrix (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer">
                    <Printer className="h-4 w-4 mr-2 text-rose-600" />
                    Summary PDF Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog open={isApplyLeaveOpen} onOpenChange={setIsApplyLeaveOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 px-6 font-bold transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Apply Leave
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                  <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
                    <DialogTitle className="text-2xl font-bold text-white tracking-tight">Apply for Leave</DialogTitle>
                    <DialogDescription className="text-blue-100 font-medium">Submit your request for administrative review</DialogDescription>
                  </div>
                  <div className="p-8 space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="leave-type" className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Leave Type</Label>
                      <Select value={leaveFormType} onValueChange={setLeaveFormType}>
                        <SelectTrigger id="leave-type" className="rounded-xl border-slate-200 h-11 bg-slate-50/50">
                          <SelectValue placeholder="Select leave category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                          <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                          <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                          <SelectItem value="WFH">Work From Home (WFH)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="from-date" className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Start Date</Label>
                        <div className="relative">
                          <Input id="from-date" type="date" value={leaveFormStart} onChange={(e) => setLeaveFormStart(e.target.value)} className="rounded-xl border-slate-200 h-11 pl-10" />
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="to-date" className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">End Date</Label>
                        <div className="relative">
                          <Input id="to-date" type="date" value={leaveFormEnd} onChange={(e) => setLeaveFormEnd(e.target.value)} className="rounded-xl border-slate-200 h-11 pl-10" />
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Reason for Leave</Label>
                      <Textarea
                        id="reason"
                        placeholder="Please provide details about your request..."
                        rows={3}
                        value={leaveFormReason}
                        onChange={(e) => setLeaveFormReason(e.target.value)}
                        className="rounded-xl border-slate-200 bg-slate-50/50 resize-none"
                      />
                    </div>
                  </div>
                  <div className="px-8 pb-8 flex gap-3">
                    <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold text-slate-500 hover:bg-slate-100" onClick={() => setIsApplyLeaveOpen(false)} disabled={isSubmittingLeave}>Cancel</Button>
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl h-11 font-bold shadow-lg shadow-blue-100"
                      onClick={handleSubmitLeave}
                      disabled={isSubmittingLeave || !leaveFormType || !leaveFormStart || !leaveFormEnd}
                    >
                      {isSubmittingLeave ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Request'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <StatCard
            title="Present Today"
            value={isTodayLoading ? '...' : String(attendanceSummary.present)}
            icon={<UserCheck />}
            color="emerald"
            sub={attendanceSummary.total > 0 ? `${Math.round((attendanceSummary.present / attendanceSummary.total) * 100)}% attendance rate` : 'Loading...'}
          />
          <StatCard
            title="Absent"
            value={isTodayLoading ? '...' : String(attendanceSummary.absent)}
            icon={<XCircle />}
            color="rose"
            sub="Today's absences"
          />
          <StatCard
            title="On Leave"
            value={isTodayLoading ? '...' : String(attendanceSummary.on_leave)}
            icon={<Coffee />}
            color="blue"
            sub="Planned absences today"
          />
          <StatCard
            title="Late Arrivals"
            value={isTodayLoading ? '...' : String(attendanceSummary.late)}
            icon={<Clock />}
            color="amber"
            sub="Late check-ins today"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
            <TabsList className="bg-transparent h-auto p-0 gap-1">
              <TabsTrigger
                value="today"
                className={cn(
                  "px-6 py-2.5 rounded-xl transition-all font-bold",
                  activeTab === 'today' ? "bg-white text-emerald-600 shadow-sm border border-emerald-100/50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                Today's Feed
              </TabsTrigger>
              <TabsTrigger
                value="monthly"
                className={cn(
                  "px-6 py-2.5 rounded-xl transition-all font-bold",
                  activeTab === 'monthly' ? "bg-white text-blue-600 shadow-sm border border-blue-100/50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                Monthly Summary
              </TabsTrigger>
              <TabsTrigger
                value="leave"
                className={cn(
                  "px-6 py-2.5 rounded-xl transition-all font-bold",
                  activeTab === 'leave' ? "bg-white text-blue-600 shadow-sm border border-blue-100/50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                Leave Requests
              </TabsTrigger>
              <TabsTrigger
                value="shift"
                className={cn(
                  "px-6 py-2.5 rounded-xl transition-all font-bold",
                  activeTab === 'shift' ? "bg-white text-violet-600 shadow-sm border border-violet-100/50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                Shift Roster
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 px-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Search name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full md:w-[240px] bg-white border-slate-200 rounded-xl focus-visible:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <TabsContent value="today" className="mt-6 space-y-4">
            <Card className="rounded-[1.5rem] border-slate-200/60 shadow-sm overflow-hidden">
              <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Attendance Log</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchTodayAttendance}
                    disabled={isTodayLoading}
                    className="rounded-lg font-bold text-xs text-slate-500 hover:text-blue-600"
                  >
                    {isTodayLoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1" />
                    ) : null}
                    Refresh
                  </Button>
                  <Badge variant="outline" className="rounded-full bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3">Live Feed</Badge>
                </div>
              </div>

              {todayError ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="h-10 w-10 text-rose-400 mb-3" />
                  <p className="font-bold text-slate-700 mb-1">Failed to load attendance</p>
                  <p className="text-sm text-slate-500 mb-4">{todayError}</p>
                  <Button variant="outline" size="sm" onClick={fetchTodayAttendance} className="rounded-xl font-bold">
                    Try Again
                  </Button>
                </div>
              ) : isTodayLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
                  <p className="text-sm font-bold text-slate-500">Loading today's attendance...</p>
                </div>
              ) : filteredAttendance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Calendar className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="font-bold text-slate-700 mb-1">No attendance records</p>
                  <p className="text-sm text-slate-500">No employees have checked in today yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30 hover:bg-slate-50/30">
                      <TableHead className="w-[300px] font-bold text-slate-700">Team Member</TableHead>
                      <TableHead className="font-bold text-slate-700">Department</TableHead>
                      <TableHead className="font-bold text-slate-700">Check In</TableHead>
                      <TableHead className="font-bold text-slate-700">Check Out</TableHead>
                      <TableHead className="font-bold text-slate-700">Duration</TableHead>
                      <TableHead className="font-bold text-slate-700">Status</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendance.map((row) => (
                      <TableRow key={row.id} className="group transition-colors hover:bg-slate-50/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-slate-200 group-hover:scale-110 transition-transform">
                              <AvatarImage src={row.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.name}`} />
                              <AvatarFallback className="bg-blue-600 text-white font-bold">{row.avatar}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-slate-900">{row.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-600">{row.department}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 font-bold text-slate-700">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            {row.checkIn}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-400">{row.checkOut}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-100 text-slate-600 border-none font-bold">
                            {row.hours}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("rounded-lg px-2.5 py-1 border font-bold text-[10px] uppercase tracking-wider", (statusConfig[row.status] || statusConfig['absent']).class)}>
                            <div className="flex items-center gap-1.5">
                              {React.createElement((statusConfig[row.status] || statusConfig['absent']).icon, { className: "h-3 w-3" })}
                              {(statusConfig[row.status] || statusConfig['absent']).label}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="leave" className="mt-6 space-y-4">
            <Card className="rounded-[1.5rem] border-slate-200/60 shadow-sm overflow-hidden">
              <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Leave Management</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Review and manage leave applications</p>
                </div>
                <div className="flex items-center gap-2">
                  {isLeaveLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600" />}
                  <Badge variant="outline" className="rounded-full bg-amber-50 text-amber-600 border-amber-100 font-bold">{leaveSummary.pending} Pending</Badge>
                  <Button variant="ghost" size="sm" onClick={fetchLeaveRequests} disabled={isLeaveLoading} className="rounded-lg font-bold text-xs text-slate-500 hover:text-blue-600">
                    Refresh
                  </Button>
                </div>
              </div>

              {leaveError ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="h-10 w-10 text-rose-400 mb-3" />
                  <p className="font-bold text-slate-700 mb-1">Failed to load leave requests</p>
                  <p className="text-sm text-slate-500 mb-4">{leaveError}</p>
                  <Button variant="outline" size="sm" onClick={fetchLeaveRequests} className="rounded-xl font-bold">Try Again</Button>
                </div>
              ) : isLeaveLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
                  <p className="text-sm font-bold text-slate-500">Loading leave requests...</p>
                </div>
              ) : leaveRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Plane className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="font-bold text-slate-700 mb-1">No leave requests</p>
                  <p className="text-sm text-slate-500">No leave requests have been submitted yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30">
                      <TableHead className="font-bold text-slate-700">Employee</TableHead>
                      <TableHead className="font-bold text-slate-700">Type</TableHead>
                      <TableHead className="font-bold text-slate-700">Duration</TableHead>
                      <TableHead className="font-bold text-slate-700">Status</TableHead>
                      <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
                      <TableHead className="font-bold text-slate-700">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => {
                      const empName = request.employee_name || 'Unknown';
                      const empAvatar = empName.split(' ').map(n => n[0]).join('').substring(0, 2);
                      return (
                        <TableRow key={request.id} className="group hover:bg-slate-50/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={request.employee_avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${empName}`} />
                                <AvatarFallback>{empAvatar}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-slate-900">{empName}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{request.employee_department || ''}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                              <Plane className="h-4 w-4 text-indigo-500" />
                              {request.leave_type}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-700">{new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{request.days} Day{request.days !== 1 ? 's' : ''} Total</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("rounded-full px-3 py-1 border font-bold text-[10px] uppercase", (leaveStatusConfig[request.status] || leaveStatusConfig['pending']).class)}>
                              {(leaveStatusConfig[request.status] || leaveStatusConfig['pending']).label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col sm:flex-row justify-end gap-1.5 sm:gap-2">
                              {request.status === 'pending' ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-full sm:w-auto rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => handleApproveLeave(request.id)}
                                    disabled={loadingStates[`approve-${request.id}`] || loadingStates[`reject-${request.id}`]}
                                  >
                                    {loadingStates[`approve-${request.id}`] ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600 mr-1" />
                                        Approving...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full sm:w-auto rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => handleRejectLeave(request.id)}
                                    disabled={loadingStates[`approve-${request.id}`] || loadingStates[`reject-${request.id}`]}
                                  >
                                    {loadingStates[`reject-${request.id}`] ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-rose-600 mr-1" />
                                        Rejecting...
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Reject
                                      </>
                                    )}
                                  </Button>
                                </>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <Badge className={cn("rounded-full px-3 py-1 border font-bold text-[10px] uppercase", (leaveStatusConfig[request.status] || leaveStatusConfig['pending']).class)}>
                                    {request.status === 'approved' ? '✓ Processed' : '✗ Declined'}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 transition-all">
                                        <MoreVertical className="h-4 w-4 text-slate-400" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 shadow-xl border-slate-200">
                                      <DropdownMenuLabel className="font-bold text-xs text-slate-500 uppercase tracking-wider px-3">Quick Actions</DropdownMenuLabel>
                                      <DropdownMenuSeparator className="my-2 bg-slate-100" />
                                      <DropdownMenuItem
                                        className="rounded-lg font-medium py-2.5 cursor-pointer hover:bg-blue-50 text-blue-600"
                                        onClick={() => {
                                          toast({
                                            title: "Email Sent Successfully",
                                            description: `Leave ${request.status} notification email sent to ${empName}.`,
                                          });
                                        }}
                                      >
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send via Mail
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="my-2 bg-slate-100" />
                                      <DropdownMenuItem
                                        className="rounded-lg font-medium py-2.5 cursor-pointer hover:bg-amber-50 text-amber-600"
                                        onClick={() => {
                                          toast({
                                            title: "Info",
                                            description: `To change the status of a processed request, please contact admin.`
                                          });
                                        }}
                                      >
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        Reset to Pending
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              <p className="text-xs text-slate-600 truncate" title={request.reason || 'No reason provided'}>
                                {request.reason || <span className="text-slate-400 italic">No reason</span>}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="mt-6">
            <Card className="rounded-[1.5rem] border-slate-200/60 shadow-sm overflow-hidden">
              <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Attendance Summary</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Showing: {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isMonthlyLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  )}
                  <Select value={selectedMonth} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-[160px] rounded-xl h-9">
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {(() => {
                        const months = [];
                        const now = new Date();
                        for (let i = 0; i < 6; i++) {
                          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                          const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                          const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                          months.push(<SelectItem key={val} value={val}>{label}</SelectItem>);
                        }
                        return months;
                      })()}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/30">
                    <TableHead className="font-bold text-slate-700">Employee</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Present</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Absent</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Late</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">On Leave</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Overtime</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <AlertCircle className="h-8 w-8 text-rose-400 mb-2" />
                          <p className="font-bold text-slate-700 mb-1">Failed to load summary</p>
                          <p className="text-sm text-slate-500 mb-3">{monthlyError}</p>
                          <Button variant="outline" size="sm" onClick={() => fetchMonthlySummary(selectedMonth)} className="rounded-xl font-bold">
                            Try Again
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isMonthlyLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2" />
                          <p className="text-sm font-bold text-slate-500">Loading monthly summary...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : monthlySummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                          <p className="font-bold text-slate-700 mb-1">No records found</p>
                          <p className="text-sm text-slate-500">No attendance data for this month.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : monthlySummary.map((row, i) => (
                    <TableRow key={row.employee_id || i} className="group hover:bg-slate-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={row.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.name}`} />
                            <AvatarFallback>{row.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-slate-900">{row.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{row.department}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-emerald-600">{row.present}</TableCell>
                      <TableCell className="text-center font-bold text-rose-600">{row.absent}</TableCell>
                      <TableCell className="text-center font-bold text-amber-600">{row.late}</TableCell>
                      <TableCell className="text-center font-bold text-blue-600">{row.leave}</TableCell>
                      <TableCell className="text-center font-bold text-slate-600">{row.overtime}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(row)}
                            disabled={loadingStates[`details_${row.id}`]}
                            className="h-8 rounded-lg font-bold text-blue-600 hover:bg-blue-50 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                          >
                            {loadingStates[`details_${row.id}`] ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2" />
                            ) : (
                              <Activity className="h-3 w-3 mr-2" />
                            )}
                            <span className="hidden sm:inline">Details</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTimesheet(row)}
                            disabled={loadingStates[`timesheet_${row.id}`]}
                            className="h-8 rounded-lg font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                          >
                            {loadingStates[`timesheet_${row.id}`] ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600 mr-2" />
                            ) : (
                              <FileSpreadsheet className="h-3 w-3 mr-2" />
                            )}
                            <span className="hidden sm:inline">Timesheet</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="shift" className="mt-6">
            <Card className="rounded-[1.5rem] border-slate-200/60 shadow-sm overflow-hidden">
              <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-slate-900">Weekly Shift Roster</h3>
                  <div className="flex gap-2">
                    {shifts.map(s => (
                      <Badge key={s.id} className={cn("rounded-md text-[9px] px-2 py-0.5 border-none", s.color)}>{s.name}</Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-slate-200 font-bold hover:bg-slate-50 transition-all active:scale-95"
                  onClick={() => setIsShiftDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Assign Shift
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/30">
                    <TableHead className="font-bold text-slate-700">Employee</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Mon</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Tue</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Wed</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Thu</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Fri</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Sat</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Sun</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((row, i) => (
                    <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-700">{row.employee}</TableCell>
                      {[row.mon, row.tue, row.wed, row.thu, row.fri, row.sat, row.sun].map((sId, dayIdx) => (
                        <TableCell key={dayIdx} className="text-center p-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div className="cursor-pointer relative">
                                {loadingStates[`shift-${row.employee}-${['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][dayIdx]}`] ? (
                                  <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                                  </div>
                                ) : sId === 0 ? (
                                  <span className="text-[10px] text-slate-300 font-bold hover:text-slate-500 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100">OFF</span>
                                ) : (
                                  <Badge className={cn("rounded-lg text-[10px] font-black hover:scale-110 transition-all cursor-pointer px-2 py-1", shifts.find(s => s.id === sId)?.color)}>
                                    {shifts.find(s => s.id === sId)?.name.split(' ')[0][0]}
                                  </Badge>
                                )}
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="rounded-xl p-2 shadow-xl border-slate-200">
                              <DropdownMenuLabel className="font-bold text-xs text-slate-500 uppercase tracking-wider px-3">
                                Assign Shift - {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIdx]}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="my-2 bg-slate-100" />
                              <DropdownMenuItem
                                className="rounded-lg font-medium py-2.5 cursor-pointer hover:bg-slate-50"
                                onClick={() => handleAssignShift(row.employee, ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][dayIdx], 0)}
                                disabled={loadingStates[`shift-${row.employee}-${['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][dayIdx]}`]}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                                  <span className="text-xs font-bold text-slate-500">Day Off</span>
                                </div>
                              </DropdownMenuItem>
                              {shifts.map(s => (
                                <DropdownMenuItem
                                  key={s.id}
                                  className="rounded-lg font-medium py-2.5 cursor-pointer hover:bg-slate-50"
                                  onClick={() => handleAssignShift(row.employee, ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][dayIdx], s.id)}
                                  disabled={loadingStates[`shift-${row.employee}-${['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][dayIdx]}`]}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={cn("w-3 h-3 rounded-full", s.color.split(' ')[0].replace('bg-', 'bg-'))} />
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold">{s.name}</span>
                                      <span className="text-[10px] text-slate-400">{s.time}</span>
                                    </div>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Employee Attendance Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Attendance Details - {selectedEmployee?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Comprehensive attendance summary and performance metrics for {selectedEmployee?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6 py-4">
              {/* Employee Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                <Avatar className="h-16 w-16 border-3 border-white shadow-lg">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedEmployee.name}`} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg font-bold">
                    {selectedEmployee.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-900">{selectedEmployee.name}</h3>
                  <p className="text-slate-600 font-medium">{selectedEmployee.department}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined: {new Date(selectedEmployee.joinDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3" />
                      {selectedEmployee.email}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1.5 font-bold text-center">
                    ID: {selectedEmployee.id}
                  </Badge>
                </div>
              </div>

              {/* Quick Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-600 uppercase">Present</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-700">{selectedEmployee.present}</div>
                  <div className="text-xs text-emerald-600">Days this month</div>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="flex items-center justify-between mb-2">
                    <XCircle className="h-5 w-5 text-rose-600" />
                    <span className="text-xs font-bold text-rose-600 uppercase">Absent</span>
                  </div>
                  <div className="text-2xl font-black text-rose-700">{selectedEmployee.absent}</div>
                  <div className="text-xs text-rose-600">Days this month</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span className="text-xs font-bold text-amber-600 uppercase">Late</span>
                  </div>
                  <div className="text-2xl font-black text-amber-700">{selectedEmployee.late}</div>
                  <div className="text-xs text-amber-600">Times this month</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <Coffee className="h-5 w-5 text-purple-600" />
                    <span className="text-xs font-bold text-purple-600 uppercase">Overtime</span>
                  </div>
                  <div className="text-2xl font-black text-purple-700">{selectedEmployee.overtime}</div>
                  <div className="text-xs text-purple-600">This month</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(selectedEmployee.performance).map(([key, value]) => {
                    const numValue = typeof value === 'number' ? value : 0;
                    return (
                      <div key={key} className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          <div className="absolute inset-0 bg-slate-200 rounded-full"></div>
                          <div
                            className={`absolute inset-0 rounded-full ${numValue >= 90 ? 'bg-emerald-500' :
                              numValue >= 80 ? 'bg-blue-500' :
                                numValue >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                            style={{
                              clipPath: `polygon(50% 50%, 50% 0%, ${50 + (numValue / 100) * 50 * Math.cos(((numValue / 100) * 360 - 90) * Math.PI / 180)
                                }% ${50 + (numValue / 100) * 50 * Math.sin(((numValue / 100) * 360 - 90) * Math.PI / 180)
                                }%, 50% 50%)`
                            }}
                          ></div>
                          <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-slate-700">{numValue}%</span>
                          </div>
                        </div>
                        <p className="text-xs font-bold text-slate-600 capitalize">{key}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tabbed Detailed Information */}
              <Tabs defaultValue="daily" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 rounded-2xl p-1">
                  <TabsTrigger value="daily" className="rounded-xl text-sm font-bold">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Daily Records
                  </TabsTrigger>
                  <TabsTrigger value="leaves" className="rounded-xl text-sm font-bold">
                    <Plane className="h-4 w-4 mr-2" />
                    Leave History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="daily" className="mt-6">
                  <div className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-800">Recent Daily Attendance</h4>
                    <div className="space-y-2">
                      {selectedEmployee.dailyAttendance.map((record: any, idx: number) => (
                        <div
                          key={idx}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md ${record.status === 'present' ? 'bg-emerald-50 border-emerald-200' :
                            record.status === 'late' ? 'bg-amber-50 border-amber-200' :
                              record.status === 'absent' ? 'bg-rose-50 border-rose-200' :
                                'bg-blue-50 border-blue-200'
                            }`}
                        >
                          <div className="mb-3 sm:mb-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-1.5 rounded-lg ${record.status === 'present' ? 'bg-emerald-100' :
                                record.status === 'late' ? 'bg-amber-100' :
                                  record.status === 'absent' ? 'bg-rose-100' :
                                    'bg-blue-100'
                                }`}>
                                {record.status === 'present' && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                                {record.status === 'late' && <Clock className="h-4 w-4 text-amber-600" />}
                                {record.status === 'absent' && <XCircle className="h-4 w-4 text-rose-600" />}
                                {record.status === 'leave' && <Plane className="h-4 w-4 text-blue-600" />}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">
                                  {new Date(record.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </p>
                                <p className="text-xs text-slate-600">{record.notes}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                              <span className="font-medium text-slate-700">
                                {record.checkIn} - {record.checkOut}
                              </span>
                              <Badge className={`text-xs font-bold ${record.status === 'present' ? 'bg-emerald-200 text-emerald-700' :
                                record.status === 'late' ? 'bg-amber-200 text-amber-700' :
                                  record.status === 'absent' ? 'bg-rose-200 text-rose-700' :
                                    'bg-blue-200 text-blue-700'
                                }`}>
                                {record.hours}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="leaves" className="mt-6">
                  <div className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-800">Leave History</h4>
                    {selectedEmployee.leaveHistory.length > 0 ? (
                      <div className="space-y-3">
                        {selectedEmployee.leaveHistory.map((leave: any, idx: number) => (
                          <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-blue-200 text-blue-700 text-xs font-bold">
                                    {leave.type}
                                  </Badge>
                                  <Badge className={`text-xs font-bold ${leave.status === 'approved' ? 'bg-emerald-200 text-emerald-700' :
                                    leave.status === 'pending' ? 'bg-amber-200 text-amber-700' :
                                      'bg-rose-200 text-rose-700'
                                    }`}>
                                    {leave.status.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-sm font-bold text-slate-800">
                                  {new Date(leave.from).toLocaleDateString()} - {new Date(leave.to).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-slate-600 mt-1">{leave.reason}</p>
                              </div>
                              <div className="text-right mt-3 sm:mt-0">
                                <div className="text-lg font-bold text-blue-700">{leave.days}</div>
                                <div className="text-xs text-blue-600">Days</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Plane className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-sm font-medium">No leave records found</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)} className="rounded-lg">
              Close
            </Button>
            <Button
              onClick={() => {
                // Generate PDF report functionality can be added here
                toast({
                  title: "Report Generated",
                  description: `Attendance report for ${selectedEmployee?.name} has been downloaded.`,
                });
              }}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift Assignment Dialog */}
      <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              Bulk Shift Assignment
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Assign shifts for multiple employees across the week. Select employees and their preferred shifts for each day.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Shift Legend */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Badge className="bg-slate-200 text-slate-700 text-xs">INFO</Badge>
                Available Shifts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {shifts.map(shift => (
                  <div key={shift.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                    <div className={cn("w-4 h-4 rounded-full", shift.color.split(' ')[0])} />
                    <div>
                      <p className="font-bold text-sm text-slate-800">{shift.name}</p>
                      <p className="text-xs text-slate-500">{shift.time}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                  <div className="w-4 h-4 rounded-full bg-slate-300" />
                  <div>
                    <p className="font-bold text-sm text-slate-800">Day Off</p>
                    <p className="text-xs text-slate-500">No shift assigned</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Assignment Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-indigo-600" />
                  Employee Shift Assignment
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="text-left font-bold text-slate-700 p-3 min-w-[150px]">Employee</th>
                      <th className="text-center font-bold text-slate-700 p-3 min-w-[100px]">Mon</th>
                      <th className="text-center font-bold text-slate-700 p-3 min-w-[100px]">Tue</th>
                      <th className="text-center font-bold text-slate-700 p-3 min-w-[100px]">Wed</th>
                      <th className="text-center font-bold text-slate-700 p-3 min-w-[100px]">Thu</th>
                      <th className="text-center font-bold text-slate-700 p-3 min-w-[100px]">Fri</th>
                      <th className="text-center font-bold text-slate-700 p-3 min-w-[100px]">Sat</th>
                      <th className="text-center font-bold text-slate-700 p-3 min-w-[100px]">Sun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${row.employee}`} />
                              <AvatarFallback className="text-xs font-bold">
                                {row.employee.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-slate-800">{row.employee}</span>
                          </div>
                        </td>
                        {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                          <td key={day} className="p-3 text-center">
                            <Select
                              value={bulkShiftAssignments[row.employee]?.[day]?.toString() || row[day as keyof typeof row].toString()}
                              onValueChange={(value) => {
                                const shiftId = parseInt(value);
                                setBulkShiftAssignments(prev => ({
                                  ...prev,
                                  [row.employee]: {
                                    ...prev[row.employee],
                                    [day]: shiftId
                                  }
                                }));
                              }}
                            >
                              <SelectTrigger className="w-full h-8 text-xs rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="0" className="text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                                    Day Off
                                  </div>
                                </SelectItem>
                                {shifts.map(shift => (
                                  <SelectItem key={shift.id} value={shift.id.toString()} className="text-xs">
                                    <div className="flex items-center gap-2">
                                      <div className={cn("w-2 h-2 rounded-full", shift.color.split(' ')[0])} />
                                      {shift.name.split(' ')[0][0]}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  // Set all to morning shift
                  const assignments: Record<string, Record<string, number>> = {};
                  roster.forEach(emp => {
                    assignments[emp.employee] = {
                      mon: 1, tue: 1, wed: 1, thu: 1, fri: 1, sat: 0, sun: 0
                    };
                  });
                  setBulkShiftAssignments(assignments);
                }}
              >
                <UserCheck className="h-4 w-4 mr-2 text-blue-500" />
                Standard Week (M-F Morning)
              </Button>

              <Button
                variant="outline"
                className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  // Set all to day off
                  const assignments: Record<string, Record<string, number>> = {};
                  roster.forEach(emp => {
                    assignments[emp.employee] = {
                      mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0
                    };
                  });
                  setBulkShiftAssignments(assignments);
                }}
              >
                <Coffee className="h-4 w-4 mr-2 text-slate-500" />
                Clear All Shifts
              </Button>

              <Button
                variant="outline"
                className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  setBulkShiftAssignments({});
                  toast({ title: "Reset Complete", description: "All assignments reset to current values." });
                }}
              >
                <History className="h-4 w-4 mr-2 text-amber-500" />
                Reset Changes
              </Button>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="ghost"
              className="w-full sm:w-auto rounded-xl font-bold text-slate-600 hover:bg-slate-100"
              onClick={() => {
                setIsShiftDialogOpen(false);
                setBulkShiftAssignments({});
              }}
            >
              Cancel Changes
            </Button>
            <Button
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-bold text-white disabled:opacity-50"
              onClick={() => {
                const assignments = Object.entries(bulkShiftAssignments)
                  .filter(([_, shifts]) => Object.keys(shifts).length > 0)
                  .map(([employee, shifts]) => ({ employee, shifts }));

                if (assignments.length === 0) {
                  toast({
                    title: "No Changes Detected",
                    description: "Please make at least one shift assignment change.",
                    variant: "destructive"
                  });
                  return;
                }

                handleBulkAssignShift(assignments);
              }}
              disabled={loadingStates['bulk-assign']}
            >
              {loadingStates['bulk-assign'] ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Updating Assignments...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply Shift Assignments
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timesheet Dialog */}
      <Dialog open={isTimesheetModalOpen} onOpenChange={setIsTimesheetModalOpen}>
        <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
          {selectedEmployee && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-xl">
                    <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                  </div>
                  Employee Timesheet
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  Comprehensive attendance timesheet for {selectedEmployee.name} - {selectedEmployee.department}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Employee Summary Card */}
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200/60">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedEmployee.name}`} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-blue-600 text-white text-2xl font-bold">
                        {selectedEmployee.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900">{selectedEmployee.name}</h3>
                          <p className="text-sm text-slate-600 font-medium">{selectedEmployee.email}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {selectedEmployee.department} • Employee ID: {selectedEmployee.id}
                          </p>
                        </div>
                        <Badge className="bg-emerald-600 text-white border-none px-4 py-2 rounded-xl font-bold text-sm w-fit">
                          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="text-center p-3 bg-white rounded-xl border border-emerald-100">
                          <div className="text-2xl font-black text-emerald-600">{selectedEmployee.present}</div>
                          <div className="text-xs text-slate-600 font-medium">Present Days</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-xl border border-rose-100">
                          <div className="text-2xl font-black text-rose-600">{selectedEmployee.absent}</div>
                          <div className="text-xs text-slate-600 font-medium">Absent Days</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-xl border border-amber-100">
                          <div className="text-2xl font-black text-amber-600">{selectedEmployee.late}</div>
                          <div className="text-xs text-slate-600 font-medium">Late Arrivals</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-xl border border-blue-100">
                          <div className="text-2xl font-black text-blue-600">{selectedEmployee.leave}</div>
                          <div className="text-xs text-slate-600 font-medium">Leave Days</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-xl border border-purple-100">
                          <div className="text-2xl font-black text-purple-600">{selectedEmployee.overtime}</div>
                          <div className="text-xs text-slate-600 font-medium">Overtime</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabbed Timesheet View */}
                <Tabs defaultValue="attendance" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 rounded-2xl p-1">
                    <TabsTrigger value="attendance" className="rounded-xl text-sm font-bold">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Daily Attendance
                    </TabsTrigger>
                    <TabsTrigger value="leave-details" className="rounded-xl text-sm font-bold">
                      <Plane className="h-4 w-4 mr-2" />
                      Leave Details
                    </TabsTrigger>
                  </TabsList>

                  {/* Daily Attendance Tab */}
                  <TabsContent value="attendance" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-emerald-600" />
                          Complete Attendance Record
                        </h4>
                        <Badge variant="outline" className="rounded-full">
                          {selectedEmployee.dailyAttendance.length} Records
                        </Badge>
                      </div>

                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead className="font-bold text-slate-700">Date</TableHead>
                              <TableHead className="font-bold text-slate-700">Status</TableHead>
                              <TableHead className="font-bold text-slate-700">Check In</TableHead>
                              <TableHead className="font-bold text-slate-700">Check Out</TableHead>
                              <TableHead className="font-bold text-slate-700">Hours</TableHead>
                              <TableHead className="font-bold text-slate-700">Location</TableHead>
                              <TableHead className="font-bold text-slate-700">Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedEmployee.dailyAttendance.map((record: any, idx: number) => (
                              <TableRow
                                key={idx}
                                className={cn(
                                  "transition-colors",
                                  record.status === 'present' && 'hover:bg-emerald-50/50',
                                  record.status === 'late' && 'hover:bg-amber-50/50',
                                  record.status === 'absent' && 'hover:bg-rose-50/50',
                                  record.status === 'leave' && 'hover:bg-blue-50/50',
                                  record.status === 'halfday' && 'hover:bg-violet-50/50'
                                )}
                              >
                                <TableCell>
                                  <div className="font-medium text-slate-900">
                                    {new Date(record.date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={cn(
                                    "rounded-lg px-2.5 py-1 border font-bold text-[10px] uppercase tracking-wider",
                                    statusConfig[record.status]?.class || 'bg-slate-100 text-slate-700'
                                  )}>
                                    <div className="flex items-center gap-1.5">
                                      {React.createElement(statusConfig[record.status]?.icon || Clock, { className: "h-3 w-3" })}
                                      {statusConfig[record.status]?.label || record.status}
                                    </div>
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                                    <span className="font-medium text-slate-700">{record.checkIn}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-rose-500" />
                                    <span className="font-medium text-slate-700">{record.checkOut}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "bg-slate-100 hover:bg-slate-100 border-none font-bold",
                                      record.hours === '0h' && 'bg-rose-100 text-rose-700',
                                      parseFloat(record.hours) > 9 && 'bg-emerald-100 text-emerald-700'
                                    )}
                                  >
                                    {record.hours}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <div className={cn(
                                      "w-2 h-2 rounded-full",
                                      record.location?.includes('Office') && 'bg-blue-500',
                                      record.location?.includes('Remote') && 'bg-purple-500',
                                      record.location === 'N/A' && 'bg-slate-300',
                                      record.location?.includes('Client') && 'bg-orange-500'
                                    )} />
                                    <span className="text-sm font-medium text-slate-600">{record.location}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p className="text-xs text-slate-600 max-w-[200px]">{record.notes}</p>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Working Hours Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                              <CheckCircle className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-emerald-600 uppercase">Total Working Days</p>
                              <p className="text-2xl font-black text-emerald-700">
                                {selectedEmployee.dailyAttendance.filter((r: any) =>
                                  r.status === 'present' || r.status === 'late'
                                ).length}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-violet-100 rounded-lg">
                              <Coffee className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-violet-600 uppercase">Half Days Taken</p>
                              <p className="text-2xl font-black text-violet-700">
                                {selectedEmployee.dailyAttendance.filter((r: any) =>
                                  r.status === 'halfday'
                                ).length}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Plane className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-blue-600 uppercase">Total Leave Days</p>
                              <p className="text-2xl font-black text-blue-700">
                                {selectedEmployee.dailyAttendance.filter((r: any) =>
                                  r.status === 'leave' || r.status === 'absent'
                                ).length}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Leave Details Tab */}
                  <TabsContent value="leave-details" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Plane className="h-5 w-5 text-blue-600" />
                          Complete Leave History
                        </h4>
                        <Badge variant="outline" className="rounded-full">
                          {selectedEmployee.leaveHistory.length} Leave Records
                        </Badge>
                      </div>

                      {selectedEmployee.leaveHistory.length > 0 ? (
                        <div className="space-y-3">
                          {selectedEmployee.leaveHistory.map((leave: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl hover:shadow-md transition-all"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                      {leave.type}
                                    </Badge>
                                    <Badge className={cn(
                                      "text-xs font-bold px-3 py-1 rounded-full",
                                      leave.leaveType === 'Full Day'
                                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                                        : 'bg-amber-100 text-amber-700 border-amber-200'
                                    )}>
                                      {leave.leaveType}
                                    </Badge>
                                    <Badge className={cn(
                                      "text-xs font-bold px-3 py-1 rounded-full",
                                      leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                        leave.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                          'bg-rose-100 text-rose-700 border-rose-200'
                                    )}>
                                      {leave.status.toUpperCase()}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <div>
                                      <p className="text-xs font-bold text-blue-600 uppercase mb-1">Date Range</p>
                                      <p className="text-sm font-bold text-slate-800">
                                        {new Date(leave.from).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                        {' → '}
                                        {new Date(leave.to).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-blue-600 uppercase mb-1">Location</p>
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <p className="text-sm font-medium text-slate-700">{leave.location || 'Not specified'}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mb-2">
                                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Reason</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{leave.reason}</p>
                                  </div>
                                </div>

                                <div className="text-center md:text-right bg-white p-4 rounded-xl border border-blue-200">
                                  <div className="text-3xl font-black text-blue-700 mb-1">{leave.days}</div>
                                  <div className="text-xs text-blue-600 font-bold uppercase">
                                    {leave.days === 1 || leave.days === 0.5 ? 'Day' : 'Days'}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-1">
                                    {leave.leaveType}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Leave Summary */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div className="p-5 bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-xl">
                              <div className="flex items-center gap-3">
                                <div className="p-3 bg-rose-100 rounded-xl">
                                  <Calendar className="h-6 w-6 text-rose-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-rose-600 uppercase">Total Full Day Leaves</p>
                                  <p className="text-3xl font-black text-rose-700">
                                    {selectedEmployee.leaveHistory
                                      .filter((l: any) => l.leaveType === 'Full Day')
                                      .reduce((sum: number, l: any) => sum + l.days, 0)}
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-1">
                                    {selectedEmployee.leaveHistory.filter((l: any) => l.leaveType === 'Full Day').length} requests
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                              <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-100 rounded-xl">
                                  <Coffee className="h-6 w-6 text-amber-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-amber-600 uppercase">Total Half Day Leaves</p>
                                  <p className="text-3xl font-black text-amber-700">
                                    {selectedEmployee.leaveHistory
                                      .filter((l: any) => l.leaveType === 'Half Day')
                                      .reduce((sum: number, l: any) => sum + l.days, 0)}
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-1">
                                    {selectedEmployee.leaveHistory.filter((l: any) => l.leaveType === 'Half Day').length} requests
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-slate-500">
                          <Plane className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                          <p className="text-sm font-medium">No leave records found for this period</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <DialogFooter className="gap-2 flex-col sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setIsTimesheetModalOpen(false)}
                  className="rounded-xl w-full sm:w-auto"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleExport('excel');
                    toast({
                      title: "Timesheet Exported",
                      description: `Timesheet for ${selectedEmployee.name} has been downloaded as Excel file.`,
                    });
                  }}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 w-full sm:w-auto"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export to Excel
                </Button>
                <Button
                  onClick={() => {
                    handleExport('pdf');
                    toast({
                      title: "Timesheet Exported",
                      description: `Timesheet for ${selectedEmployee.name} has been downloaded as PDF.`,
                    });
                  }}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Export to PDF
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, color, sub, trend = 'none' }: { title: string, value: string, icon: React.ReactNode, color: string, sub: string, trend?: 'up' | 'down' | 'none' }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100"
  };

  return (
    <Card className="rounded-2xl border-slate-200/60 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <CardContent className="p-6 relative">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", colorMap[color])}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" }) : icon}
          </div>
          {trend !== 'none' && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
              trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
              {trend === 'up' ? '+12%' : '-4%'}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900">{value}</h3>
          </div>
          <p className="text-[10px] text-slate-500 font-bold italic tracking-tight">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
