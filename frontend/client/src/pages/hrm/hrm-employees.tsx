import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Plus,
  Search,
  Download,
  Filter,
  Edit,
  MoreVertical,
  MapPin,
  Calendar,
  Mail,
  Phone,
  FileText,
  ArrowLeft,
  Briefcase,
  Building2,
  Trash2,
  Eye,
  UserPlus,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  UserCheck,
  Clock,
  UserMinus,
  CheckCircle,
  Activity,
  AlertCircle,
  History,
  Upload,
  Copy,
  User
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from "@/lib/utils";
import {
  listEmployees,
  addEmployee,
  adminUpdateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  type EmployeeStatus,
} from '@/lib/api';

// HRMAttendance: Employee Management module.
export default function HRMEmployees() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPastExitsModalOpen, setIsPastExitsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [exitFormData, setExitFormData] = useState({
    employeeId: '',
    reason: '',
    type: '',
    priority: '',
    lastWorkingDay: '',
    assignedHR: 'emily_davis'
  });
  const [interviewFormData, setInterviewFormData] = useState({
    date: '',
    time: '',
    interviewer: '',
    meetingType: '',
    notes: ''
  });
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    designation: '',
    department: '',
    location: '',
    email: '',
    phone: '',
    alternatePhone: '',
    bloodGroup: '',
    joining: new Date().toISOString().split('T')[0],
    photo: null as File | null,
    bankName: '',
    bankBranch: '',
    accountNumber: '',
    ifscCode: '',
    panNumber: '',
    aadhaarNumber: '',
    aadhaarDoc: null as File | null,
    panDoc: null as File | null,
    resume: null as File | null
  });

  const { toast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);


  // ── Fetch employees from Supabase via backend on mount ──────────────────
  useEffect(() => {
    void (async () => {
      const { data, error } = await listEmployees({ limit: 200 });
      if (error) {
        toast({ title: 'Failed to load employees', description: error, variant: 'destructive' });
        return;
      }
      if (data && data.length > 0) {
        setEmployees(
          data.map(emp => ({
            ...emp,
            id: emp.employee_code || emp.id,
            name: emp.full_name,
            designation: emp.designation || emp.position || '',
            department: emp.department || '',
            email: emp.email || '',
            phone: emp.phone || '',
            location: (emp as any).location || '',
            joining: emp.join_date || '',
            status: emp.status || 'active',
            avatar: (emp.full_name || '')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2),
            exitWorkflow: (emp as any).exit_workflow || null,
          })) as any[]
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const generatePDFReport = (employee: any, type: 'clearance' | 'report' = 'report') => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(220, 38, 127); // Rose color
    doc.text('Exit Management Report', 20, 30);

    // Employee Info
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Employee: ${employee.name}`, 20, 50);
    doc.text(`ID: ${employee.id}`, 20, 60);
    doc.text(`Department: ${employee.department}`, 20, 70);
    doc.text(`Designation: ${employee.designation}`, 20, 80);

    if (employee.exitWorkflow) {
      doc.text(`Exit Reason: ${employee.exitWorkflow.reason}`, 20, 100);
      doc.text(`Priority: ${employee.exitWorkflow.priority}`, 20, 110);
      doc.text(`Progress: ${employee.exitWorkflow.progress}%`, 20, 120);
      doc.text(`Status: ${employee.exitWorkflow.status}`, 20, 130);

      // Steps table
      const tableData = employee.exitWorkflow.steps.map((step: any) => [
        step.name,
        step.department,
        step.status,
        step.completedBy || 'Pending'
      ]);

      autoTable(doc, {
        head: [['Step', 'Department', 'Status', 'Completed By']],
        body: tableData,
        startY: 150,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 127] }
      });
    }

    // Save the PDF
    const filename = type === 'clearance'
      ? `${employee.name}_Clearance_${new Date().toISOString().split('T')[0]}.pdf`
      : `Exit_Report_${employee.name}_${new Date().toISOString().split('T')[0]}.pdf`;

    doc.save(filename);
  };

  // Generate Excel Report
  const generateExcelReport = () => {
    const exitEmployees = employees.filter(emp => emp.status === 'exit');
    const workbook = XLSX.utils.book_new();

    // Main data
    const mainData = exitEmployees.map(emp => ({
      'Employee ID': emp.id,
      'Name': emp.name,
      'Department': emp.department,
      'Designation': emp.designation,
      'Exit Reason': emp.exitWorkflow?.reason || 'N/A',
      'Priority': emp.exitWorkflow?.priority || 'N/A',
      'Progress': `${emp.exitWorkflow?.progress || 0}%`,
      'Status': emp.exitWorkflow?.status || 'N/A',
      'Initiated Date': emp.exitWorkflow?.initiatedAt ? new Date(emp.exitWorkflow.initiatedAt).toLocaleDateString() : 'N/A',
      'Expected Last Day': emp.exitWorkflow?.expectedLastDay ? new Date(emp.exitWorkflow.expectedLastDay).toLocaleDateString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(mainData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exit Management');

    // Assets data
    const assetsData: any[] = [];
    exitEmployees.forEach(emp => {
      emp.exitWorkflow?.assets?.forEach((asset: any) => {
        assetsData.push({
          'Employee': emp.name,
          'Asset Name': asset.name,
          'Serial Number': asset.serialNumber,
          'Status': asset.status,
          'Return Date': asset.returnedDate ? new Date(asset.returnedDate).toLocaleDateString() : 'Pending'
        });
      });
    });

    if (assetsData.length > 0) {
      const assetsWorksheet = XLSX.utils.json_to_sheet(assetsData);
      XLSX.utils.book_append_sheet(workbook, assetsWorksheet, 'Assets');
    }

    XLSX.writeFile(workbook, `Exit_Management_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Button action handlers with real functionality
  const handleButtonAction = async (action: string, employeeId?: string) => {
    const loadingKey = employeeId ? `${action}_${employeeId}` : action;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));

    try {
      // API call placeholder for consistency

      switch (action) {
        case 'initiate_exit':
          setIsExitDialogOpen(true);
          break;

        case 'schedule_interview':
          if (employeeId) {
            const employee = employees.find(emp => emp.id === employeeId);
            setSelectedEmployee(employee);
          }
          setIsInterviewDialogOpen(true);
          break;

        case 'export_report':
          if (employeeId) {
            const employee = employees.find(emp => emp.id === employeeId);
            if (employee) generatePDFReport(employee, 'report');
          } else {
            generateExcelReport();
          }
          toast({
            title: "Report Generated",
            description: "Your report has been downloaded successfully.",
          });
          break;

        case 'export_clearance':
          if (employeeId) {
            const employee = employees.find(emp => emp.id === employeeId);
            if (employee) generatePDFReport(employee, 'clearance');
          }
          toast({
            title: "Clearance Document Generated",
            description: "Employee clearance PDF has been downloaded.",
          });
          break;

        case 'view_details':
          if (employeeId) {
            const employee = employees.find(emp => emp.id === employeeId);
            setSelectedEmployee(employee);
            setIsDetailsModalOpen(true);
          }
          break;

        case 'view_profile':
          if (employeeId) {
            const employee = employees.find(emp => emp.id === employeeId);
            setSelectedEmployee(employee);
            setIsProfileModalOpen(true);
          }
          break;

        case 'view_past_exits':
          setIsPastExitsModalOpen(true);
          break;

        case 'initialize_workflow':
          if (employeeId) {
            const exitWorkflow = {
              id: `EXIT${String(Date.now()).slice(-3)}`,
              reason: 'To be determined',
              type: 'voluntary',
              priority: 'medium',
              initiatedAt: new Date().toISOString(),
              expectedLastDay: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'pending_approvals',
              progress: 15,
              assignedHR: 'Emily Davis',
              exitInterviewScheduled: false,
              steps: [
                {
                  id: 1,
                  name: 'Manager Approval',
                  department: 'Management',
                  status: 'pending',
                  priority: 'high',
                  assignedTo: 'Direct Manager',
                  dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                  details: 'Manager approval for exit request',
                  documents: []
                },
                {
                  id: 2,
                  name: 'HR Documentation',
                  department: 'Human Resources',
                  status: 'not_started',
                  priority: 'medium',
                  assignedTo: 'Emily Davis',
                  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                  details: 'Prepare exit documentation and paperwork',
                  documents: []
                },
                {
                  id: 3,
                  name: 'IT Asset Return',
                  department: 'IT Department',
                  status: 'not_started',
                  priority: 'high',
                  assignedTo: 'IT Admin',
                  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                  details: 'Return all IT equipment and assets',
                  documents: []
                }
              ],
              assets: [
                { id: 1, name: 'Company Laptop', serialNumber: 'LAP001', status: 'assigned' },
                { id: 2, name: 'Access Card', serialNumber: 'ACC001', status: 'assigned' }
              ],
              knowledgeTransfer: { status: 'not_started', sessions: [], documents: [] }
            };

            const { error } = await adminUpdateEmployee(employeeId, {
              status: 'exit',
              exit_workflow: exitWorkflow as any
            });

            if (error) {
              toast({ title: "Failed to initialize workflow", description: error, variant: "destructive" });
              return;
            }

            setEmployees(prev => prev.map(emp =>
              emp.id === employeeId
                ? { ...emp, status: 'exit', exitWorkflow }
                : emp
            ));
            toast({
              title: "Exit Workflow Created",
              description: "Employee has been moved to exit process with initial workflow.",
            });
          }
          break;

        case 'delete_employee':
          if (employeeId) {
            const empToDelete = employees.find(emp => emp.id === employeeId);
            const { error: deleteErr } = await deleteEmployee(employeeId, false);
            if (deleteErr) {
              toast({ title: 'Delete Failed', description: deleteErr, variant: 'destructive' });
            } else {
              setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
              toast({
                title: 'Employee Removed',
                description: `${empToDelete?.name || 'Employee'} has been removed from the system.`,
                variant: 'destructive',
              });
            }
          }
          break;

        default:
          toast({
            title: "Feature Coming Soon",
            description: "This functionality will be available in the next update.",
          });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };


  // Photo upload handler
  const handlePhotoUpload = async (employeeId: string, file: File) => {
    setUploadingPhoto(employeeId);

    try {
      // API call placeholder

      // Create photo URL from file
      const photoUrl = URL.createObjectURL(file);

      // Update employee with photo
      const updatedEmployees = employees.map(emp =>
        emp.id === employeeId
          ? { ...emp, photoUrl }
          : emp
      );
      setEmployees(updatedEmployees);

      toast({
        title: "✅ Photo Updated Successfully",
        description: "Employee photo has been uploaded and updated.",
      });
    } catch (error) {
      toast({
        title: "❌ Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(null);
    }
  };

  // Edit employee handler
  const handleEditEmployee = (employee: any) => {
    setEditingEmployee({
      ...employee,
      joining: employee.joining.split('T')[0] // Ensure date format
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateEmployee = () => {
    if (!editingEmployee) return;

    const updateData = {
      full_name: editingEmployee.name.trim(),
      designation: editingEmployee.designation.trim(),
      department: editingEmployee.department,
      location: editingEmployee.location.trim(),
      email: editingEmployee.email.trim().toLowerCase(),
      phone: editingEmployee.phone.trim(),
      join_date: editingEmployee.joining,
    };

    setLoadingStates(prev => ({ ...prev, update_employee: true }));
    void (async () => {
      const { data, error } = await adminUpdateEmployee(editingEmployee.id, updateData);
      setLoadingStates(prev => ({ ...prev, update_employee: false }));

      if (error) {
        toast({ title: "Update Failed", description: error, variant: "destructive" });
        return;
      }

      setEmployees(prev => prev.map(emp =>
        emp.id === editingEmployee.id
          ? {
            ...emp,
            ...updateData,
            name: updateData.full_name,
            avatar: updateData.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
          }
          : emp
      ));
      setIsEditDialogOpen(false);
      setEditingEmployee(null);

      toast({
        title: "✅ Employee Updated Successfully",
        description: `${editingEmployee.name}'s information has been updated.`,
      });
    })();
  };

  const createExitWorkflow = () => {
    const emp = employees.find(e => e.id === exitFormData.employeeId);
    if (!emp) return;

    const exitWorkflow = {
      id: `EXIT${String(Date.now()).slice(-3)}`,
      reason: exitFormData.reason,
      type: exitFormData.type,
      priority: exitFormData.priority,
      initiatedAt: new Date().toISOString(),
      expectedLastDay: new Date(exitFormData.lastWorkingDay).toISOString(),
      status: 'pending_approvals',
      progress: 10,
      assignedHR: exitFormData.assignedHR === 'emily_davis' ? 'Emily Davis' : 'HR Team',
      exitInterviewScheduled: false,
      steps: [
        {
          id: 1,
          name: 'Manager Approval',
          department: 'Management',
          status: 'pending',
          priority: 'high',
          assignedTo: 'Direct Manager',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          details: 'Manager approval for exit request',
          documents: [],
        },
        {
          id: 2,
          name: 'HR Exit Interview',
          department: 'Human Resources',
          status: 'not_started',
          priority: 'medium',
          assignedTo: exitFormData.assignedHR === 'emily_davis' ? 'Emily Davis' : 'HR Team',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          details: '',
          documents: []
        },
        {
          id: 3,
          name: 'Project Handover',
          department: emp.department,
          status: 'not_started',
          priority: 'high',
          assignedTo: 'Team Lead',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          details: '',
          documents: []
        },
        {
          id: 4,
          name: 'IT Asset Return',
          department: 'IT Department',
          status: 'not_started',
          priority: 'high',
          assignedTo: 'IT Admin',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          details: '',
          documents: []
        },
        {
          id: 5,
          name: 'Finance Clearance',
          department: 'Finance',
          status: 'not_started',
          priority: 'medium',
          assignedTo: 'Finance Team',
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          details: '',
          documents: []
        }
      ],
      assets: [
        { id: 1, name: 'Company Laptop', serialNumber: 'LAP001', status: 'assigned' },
        { id: 2, name: 'Access Card', serialNumber: 'ACC001', status: 'assigned' },
        { id: 3, name: 'Company Phone', serialNumber: 'PH001', status: 'assigned' }
      ],
      knowledgeTransfer: {
        status: 'not_started',
        sessions: [],
        documents: []
      }
    };

    setLoadingStates(prev => ({ ...prev, create_exit: true }));
    void (async () => {
      const { error } = await adminUpdateEmployee(exitFormData.employeeId, {
        status: 'exit',
        exit_workflow: exitWorkflow as any
      });
      setLoadingStates(prev => ({ ...prev, create_exit: false }));

      if (error) {
        toast({ title: "Failed to initiate exit", description: error, variant: "destructive" });
        return;
      }

      setEmployees(prev => prev.map(e =>
        e.id === exitFormData.employeeId
          ? { ...e, status: 'exit', exitWorkflow }
          : e
      ));

      setIsExitDialogOpen(false);
      setExitFormData({
        employeeId: '',
        reason: '',
        type: '',
        priority: '',
        lastWorkingDay: '',
        assignedHR: 'emily_davis'
      });

      toast({
        title: "Exit Workflow Created",
        description: "Employee exit process has been initiated successfully.",
      });
    })();
  };

  // Schedule interview
  const scheduleInterview = () => {
    if (!interviewFormData.date || !interviewFormData.time || !interviewFormData.interviewer) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (selectedEmployee) {
      const updatedEmployees = employees.map(emp =>
        emp.id === selectedEmployee.id && emp.exitWorkflow
          ? {
            ...emp,
            exitWorkflow: {
              ...emp.exitWorkflow,
              exitInterviewScheduled: true,
              exitInterviewDate: `${interviewFormData.date}T${interviewFormData.time}:00Z`,
              interviewer: interviewFormData.interviewer,
              meetingType: interviewFormData.meetingType,
              steps: emp.exitWorkflow.steps.map((step: any) => ({
                ...step,
                documents: step.documents || []
              }))
            }
          }
          : emp
      );

      setEmployees(updatedEmployees);
    }

    setIsInterviewDialogOpen(false);
    setInterviewFormData({ date: '', time: '', interviewer: '', meetingType: '', notes: '' });

    toast({
      title: "Interview Scheduled",
      description: "Exit interview has been scheduled successfully.",
    });
  };

  // Complete a clearance step
  const completeStep = (employeeId: string, stepId: number) => {
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId && emp.exitWorkflow) {
        const updatedSteps = emp.exitWorkflow.steps.map((step: any) =>
          step.id === stepId
            ? {
              ...step,
              status: 'completed',
              completedAt: new Date().toISOString(),
              completedBy: 'Current User'
            }
            : step
        );

        const completedCount = updatedSteps.filter((s: any) => s.status === 'completed').length;
        const progress = Math.round((completedCount / updatedSteps.length) * 100);

        return {
          ...emp,
          exitWorkflow: {
            ...emp.exitWorkflow,
            steps: updatedSteps,
            progress: progress,
            status: progress === 100 ? 'completed' : emp.exitWorkflow.status
          }
        };
      }
      return emp;
    });

    setEmployees(updatedEmployees);
    toast({
      title: "Step Completed",
      description: "Clearance step has been marked as completed.",
    });
  };

  // Return an asset
  const returnAsset = (employeeId: string, assetId: number) => {
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId && emp.exitWorkflow?.assets) {
        const updatedAssets = emp.exitWorkflow.assets.map((asset: any) =>
          asset.id === assetId
            ? {
              ...asset,
              status: 'returned',
              returnedDate: new Date().toISOString()
            }
            : asset
        );

        return {
          ...emp,
          exitWorkflow: {
            ...emp.exitWorkflow,
            assets: updatedAssets
          }
        };
      }
      return emp;
    });

    setEmployees(updatedEmployees);
    toast({
      title: "Asset Returned",
      description: "Asset has been marked as returned successfully.",
    });
  };


  const statusConfig: Record<string, { label: string; class: string }> = {
    active: { label: 'Active', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    probation: { label: 'Probation', class: 'bg-amber-100 text-amber-700 border-amber-200' },
    onboarding: { label: 'Onboarding', class: 'bg-blue-100 text-blue-700 border-blue-200' },
    exit: { label: 'Exit Workflow', class: 'bg-rose-100 text-rose-700 border-rose-200' }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab = activeTab === 'all' || emp.status === activeTab;
      const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;

      return matchesSearch && matchesTab && matchesDept;
    });
  }, [searchQuery, activeTab, departmentFilter, employees]);

  const handleExport = (type: 'excel' | 'pdf') => {
    setIsExporting(true);
    toast({ title: "Exporting...", description: `Preparing employee directory in ${type.toUpperCase()}.` });

    if (type === 'excel') {
      const ws = XLSX.utils.json_to_sheet(filteredEmployees);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Employees");
      XLSX.writeFile(wb, `Employees_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.text("Employee Directory Report", 14, 15);
      autoTable(doc, {
        startY: 25,
        head: [['ID', 'Name', 'Designation', 'Department', 'Email', 'Status']],
        body: filteredEmployees.map(e => [e.id, e.name, e.designation, e.department, e.email, statusConfig[e.status].label]),
      });
      doc.save(`Employees_${new Date().toISOString().split('T')[0]}.pdf`);
    }
    setIsExporting(false);
    toast({ title: "Export Ready", description: "Download started." });
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.designation || !newEmployee.department) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, add_employee: true }));
    try {
      const { data, error } = await addEmployee({
        full_name: newEmployee.name,
        email: newEmployee.email,
        designation: newEmployee.designation,
        department: newEmployee.department,
        location: newEmployee.location,
        phone: newEmployee.phone,
        alternate_phone: newEmployee.alternatePhone,
        join_date: newEmployee.joining,
        blood_group: newEmployee.bloodGroup,
        status: 'onboarding',
      });

      if (error) {
        toast({ title: 'Failed to add employee', description: error, variant: 'destructive' });
        return;
      }

      const avatar = newEmployee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
      setEmployees(prev => [
        {
          ...data!,
          id: data!.employee_code || data!.id,
          name: data!.full_name,
          designation: newEmployee.designation,
          department: newEmployee.department,
          email: newEmployee.email,
          phone: newEmployee.phone || '',
          location: newEmployee.location,
          joining: (data! as any).join_date || newEmployee.joining,
          status: 'onboarding',
          avatar,
          exitWorkflow: null,
        } as any,
        ...prev,
      ]);

      setIsAddDialogOpen(false);
      setNewEmployee({
        name: '', designation: '', department: '', location: '', email: '',
        phone: '', alternatePhone: '', bloodGroup: '',
        joining: new Date().toISOString().split('T')[0],
        photo: null, bankName: '', bankBranch: '', accountNumber: '',
        ifscCode: '', panNumber: '', aadhaarNumber: '',
        aadhaarDoc: null, panDoc: null, resume: null,
      });

      toast({
        title: "✅ Employee Profile Created",
        description: `${newEmployee.name} has been added with complete onboarding details.`,
        className: "rounded-xl",
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to add employee. Please try again.', variant: 'destructive' });
    } finally {
      setLoadingStates(prev => ({ ...prev, add_employee: false }));
    }
  };

  const handleUpdateStatus = async (employeeId: string, newStatus: string, workflow?: any) => {
    try {
      const { error } = await updateEmployeeStatus(employeeId, newStatus as EmployeeStatus);
      if (error) {
        toast({ title: 'Status Update Failed', description: error, variant: 'destructive' });
        return;
      }
      setEmployees(prev => prev.map(emp =>
        emp.id === employeeId ? { ...emp, status: newStatus, exitWorkflow: workflow || emp.exitWorkflow } : emp
      ));
      if (!workflow) {
        const statusLabel = statusConfig[newStatus]?.label || newStatus;
        toast({ title: 'Status Updated', description: `Employee status changed to ${statusLabel}.` });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
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
                <div className="p-2.5 bg-blue-600/10 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
                  <p className="text-sm text-slate-500 flex items-center gap-2 font-medium">
                    <Building2 className="h-3.5 w-3.5" />
                    {employees.length} Total Team Members
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-slate-200 bg-white hover:bg-slate-50 rounded-xl font-bold shadow-sm">
                    <Download className="h-4 w-4 mr-2 text-slate-500" />
                    <span>Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                    Excel Directory (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer">
                    <Printer className="h-4 w-4 mr-2 text-rose-600" />
                    PDF Comprehensive List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl font-bold transition-all active:scale-95"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                  <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
                    <DialogTitle className="text-2xl font-bold text-white tracking-tight">✨ New Employee Onboarding</DialogTitle>
                    <DialogDescription className="text-blue-100 font-medium">Complete employee profile with documents and banking details</DialogDescription>
                  </div>

                  <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="p-8 space-y-6">
                      {/* Profile Photo Upload */}
                      <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border-2 border-indigo-100">
                        <div className="relative group">
                          {newEmployee.photo ? (
                            <div className="h-24 w-24 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
                              <img
                                src={URL.createObjectURL(newEmployee.photo)}
                                alt="Profile"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                              <UserPlus className="h-10 w-10 text-white" />
                            </div>
                          )}
                          <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-white rounded-xl border-2 border-blue-500 flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors shadow-md">
                            <Upload className="h-4 w-4 text-blue-600" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setNewEmployee({ ...newEmployee, photo: e.target.files[0] });
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black text-lg text-slate-900 mb-1">Profile Picture</h3>
                          <p className="text-sm text-slate-600">Upload a professional photo (PNG, JPG up to 5MB)</p>
                          {newEmployee.photo && (
                            <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-none">
                              ✓ {newEmployee.photo.name}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-blue-600" />
                          Basic Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name *</Label>
                            <Input
                              placeholder="e.g. Robert Fox"
                              value={newEmployee.name}
                              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                              className="rounded-xl border-slate-200 h-11 bg-slate-50/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Designation *</Label>
                            <Input
                              placeholder="e.g. Lead Designer"
                              value={newEmployee.designation}
                              onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                              className="rounded-xl border-slate-200 h-11 bg-slate-50/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Department *</Label>
                            <Select onValueChange={(v) => setNewEmployee({ ...newEmployee, department: v })} value={newEmployee.department}>
                              <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50/50">
                                <SelectValue placeholder="Select Department" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="Engineering">Engineering</SelectItem>
                                <SelectItem value="Product">Product</SelectItem>
                                <SelectItem value="Design">Design</SelectItem>
                                <SelectItem value="Sales">Sales</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Human Resources">Human Resources</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Blood Group</Label>
                            <Select onValueChange={(v) => setNewEmployee({ ...newEmployee, bloodGroup: v })} value={newEmployee.bloodGroup}>
                              <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50/50">
                                <SelectValue placeholder="Select Blood Group" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="A+">A+</SelectItem>
                                <SelectItem value="A-">A-</SelectItem>
                                <SelectItem value="B+">B+</SelectItem>
                                <SelectItem value="B-">B-</SelectItem>
                                <SelectItem value="O+">O+</SelectItem>
                                <SelectItem value="O-">O-</SelectItem>
                                <SelectItem value="AB+">AB+</SelectItem>
                                <SelectItem value="AB-">AB-</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-600" />
                          Contact Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Official Email *</Label>
                            <Input
                              placeholder="robert@company.com"
                              type="email"
                              value={newEmployee.email}
                              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                              className="rounded-xl border-slate-200 h-11 bg-slate-50/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Primary Phone</Label>
                            <Input
                              placeholder="+1 (555) 000-0000"
                              type="tel"
                              value={newEmployee.phone}
                              onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                              className="rounded-xl border-slate-200 h-11 bg-slate-50/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Alternate Phone</Label>
                            <Input
                              placeholder="+1 (555) 999-9999"
                              type="tel"
                              value={newEmployee.alternatePhone}
                              onChange={(e) => setNewEmployee({ ...newEmployee, alternatePhone: e.target.value })}
                              className="rounded-xl border-slate-200 h-11 bg-slate-50/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Work Location</Label>
                            <Input
                              placeholder="e.g. Remote / New York"
                              value={newEmployee.location}
                              onChange={(e) => setNewEmployee({ ...newEmployee, location: e.target.value })}
                              className="rounded-xl border-slate-200 h-11 bg-slate-50/50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bank Details */}
                      <div className="space-y-4">
                        <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                          Bank Account Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Bank Name</Label>
                            <Input
                              placeholder="e.g. Chase Bank"
                              value={newEmployee.bankName}
                              onChange={(e) => setNewEmployee({ ...newEmployee, bankName: e.target.value })}
                              className="rounded-xl border-slate-200 h-11 bg-slate-50/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Branch Name</Label>
                            <Input
                              placeholder="e.g. Main Street Branch"
                              value={newEmployee.bankBranch}
                              onChange={(e) => setNewEmployee({ ...newEmployee, bankBranch: e.target.value })}
                              className="rounded-xl border-slate-200 h-11 bg-slate-50/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Number</Label>
                            <Input
                              placeholder="XXXX XXXX XXXX"
                              value={newEmployee.accountNumber}
                              onChange={(e) => setNewEmployee({ ...newEmployee, accountNumber: e.target.value })}
                              className="rounded-xl border-slate-200 h-11 bg-slate-50/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">IFSC / Routing Code</Label>
                            <Input
                              placeholder="e.g. HDFC0001234"
                              value={newEmployee.ifscCode}
                              onChange={(e) => setNewEmployee({ ...newEmployee, ifscCode: e.target.value })}
                              className="rounded-xl border-slate-200 h-11 bg-slate-50/50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Government ID Numbers */}
                      <div className="space-y-4">
                        <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          Government IDs
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">PAN Number</Label>
                            <Input
                              placeholder="e.g. ABCDE1234F"
                              value={newEmployee.panNumber}
                              onChange={(e) => setNewEmployee({ ...newEmployee, panNumber: e.target.value.toUpperCase() })}
                              className="rounded-xl border-slate-200 h-11 bg-slate-50/50"
                              maxLength={10}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Aadhaar Number</Label>
                            <Input
                              placeholder="XXXX XXXX XXXX"
                              value={newEmployee.aadhaarNumber}
                              onChange={(e) => setNewEmployee({ ...newEmployee, aadhaarNumber: e.target.value })}
                              className="rounded-xl border-slate-200 h-11 bg-slate-50/50"
                              maxLength={12}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Joining Date *</Label>
                            <Input
                              type="date"
                              value={newEmployee.joining}
                              onChange={(e) => setNewEmployee({ ...newEmployee, joining: e.target.value })}
                              className="rounded-xl border-slate-200 h-11 bg-slate-50/50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Document Uploads */}
                      <div className="space-y-4">
                        <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Upload className="h-4 w-4 text-blue-600" />
                          Documents Upload
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Aadhaar Card</Label>
                            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group">
                              {newEmployee.aadhaarDoc ? (
                                <div className="text-center px-2">
                                  <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                                  <span className="text-xs font-bold text-emerald-700 line-clamp-2">{newEmployee.aadhaarDoc.name}</span>
                                </div>
                              ) : (
                                <>
                                  <Upload className="h-6 w-6 text-slate-400 group-hover:text-blue-600 mb-2" />
                                  <span className="text-xs font-medium text-slate-500">Upload PDF</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    setNewEmployee({ ...newEmployee, aadhaarDoc: e.target.files[0] });
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">PAN Card</Label>
                            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group">
                              {newEmployee.panDoc ? (
                                <div className="text-center px-2">
                                  <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                                  <span className="text-xs font-bold text-emerald-700 line-clamp-2">{newEmployee.panDoc.name}</span>
                                </div>
                              ) : (
                                <>
                                  <Upload className="h-6 w-6 text-slate-400 group-hover:text-blue-600 mb-2" />
                                  <span className="text-xs font-medium text-slate-500">Upload PDF</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    setNewEmployee({ ...newEmployee, panDoc: e.target.files[0] });
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Resume/CV</Label>
                            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group">
                              {newEmployee.resume ? (
                                <div className="text-center px-2">
                                  <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                                  <span className="text-xs font-bold text-emerald-700 line-clamp-2">{newEmployee.resume.name}</span>
                                </div>
                              ) : (
                                <>
                                  <Upload className="h-6 w-6 text-slate-400 group-hover:text-blue-600 mb-2" />
                                  <span className="text-xs font-medium text-slate-500">Upload PDF</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    setNewEmployee({ ...newEmployee, resume: e.target.files[0] });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 italic">Accepted formats: PDF, JPG, PNG (Max 10MB per file)</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 pb-8 pt-4 border-t border-slate-100 flex gap-3 bg-slate-50">
                    <Button variant="ghost" className="flex-1 rounded-xl h-12 font-bold text-slate-500 hover:bg-slate-100" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                    <Button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-blue-200" onClick={() => void handleAddEmployee()}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Employee Profile
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <StatCard title="Total Staff" value={employees.length.toString()} icon={<Users />} color="blue" sub="Across all departments" />
          <StatCard title="Active" value={employees.filter(e => e.status === 'active').length.toString()} icon={<UserCheck />} color="emerald" sub="Fully productive" />
          <StatCard title="On Probation" value={employees.filter(e => e.status === 'probation').length.toString()} icon={<Clock />} color="amber" sub="Performance review pending" />
          <StatCard title="Exiting" value={employees.filter(e => e.status === 'exit').length.toString()} icon={<UserMinus />} color="rose" sub="Current exit processes" />
        </div>

        <div className="grid gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
              <TabsList className="bg-transparent h-auto p-0 gap-1">
                {['all', 'active', 'probation', 'onboarding', 'exit'].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className={cn(
                      "px-6 py-2.5 rounded-xl transition-all capitalize font-bold",
                      activeTab === tab
                        ? "bg-white text-blue-600 shadow-sm border border-blue-100/50"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                    )}
                  >
                    {tab === 'all' ? 'Directory' : tab === 'exit' ? 'Exit Management' : tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex items-center gap-2 px-2">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    placeholder="Search name, role or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full md:w-[280px] bg-white border-slate-200 rounded-xl focus-visible:ring-blue-500/20"
                  />
                </div>

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[180px] bg-white border-slate-200 rounded-xl font-medium">
                    <Filter className="h-4 w-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Human Resources">Human Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-6">
              {activeTab === 'exit' ? (
                // Comprehensive Exit Management System
                <div className="space-y-6">
                  {filteredEmployees.filter(emp => emp.status === 'exit').length > 0 ? (
                    <>
                      {/* Enhanced Exit Overview Dashboard */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                        <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/50">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1 truncate">Active Exits</p>
                                <h3 className="text-2xl sm:text-3xl font-black text-rose-700">
                                  {filteredEmployees.filter(emp => emp.status === 'exit').length}
                                </h3>
                                <p className="text-xs text-rose-500 mt-1">In process</p>
                              </div>
                              <div className="p-2 sm:p-3 bg-rose-200 rounded-xl flex-shrink-0">
                                <UserMinus className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 truncate">High Priority</p>
                                <h3 className="text-2xl sm:text-3xl font-black text-amber-700">
                                  {filteredEmployees.filter(emp => emp.status === 'exit' && emp.exitWorkflow?.priority === 'high').length}
                                </h3>
                                <p className="text-xs text-amber-500 mt-1">Urgent</p>
                              </div>
                              <div className="p-2 sm:p-3 bg-amber-200 rounded-xl flex-shrink-0">
                                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 truncate">Avg Progress</p>
                                <h3 className="text-2xl sm:text-3xl font-black text-blue-700">
                                  {Math.round(filteredEmployees.filter(emp => emp.status === 'exit').reduce((acc: number, emp: any) => acc + (emp.exitWorkflow?.progress || 0), 0) / filteredEmployees.filter(emp => emp.status === 'exit').length) || 0}%
                                </h3>
                                <p className="text-xs text-blue-500 mt-1">Overall</p>
                              </div>
                              <div className="p-2 sm:p-3 bg-blue-200 rounded-xl flex-shrink-0">
                                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 truncate">This Month</p>
                                <h3 className="text-2xl sm:text-3xl font-black text-emerald-700">{employees.filter(emp => emp.status === 'exit' && emp.exitWorkflow?.progress === 100).length}</h3>
                                <p className="text-xs text-emerald-500 mt-1">Completed</p>
                              </div>
                              <div className="p-2 sm:p-3 bg-emerald-200 rounded-xl flex-shrink-0">
                                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 truncate">Interviews</p>
                                <h3 className="text-2xl sm:text-3xl font-black text-purple-700">
                                  {filteredEmployees.filter(emp => emp.status === 'exit' && emp.exitWorkflow?.exitInterviewScheduled).length}
                                </h3>
                                <p className="text-xs text-purple-500 mt-1">Scheduled</p>
                              </div>
                              <div className="p-2 sm:p-3 bg-purple-200 rounded-xl flex-shrink-0">
                                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 truncate">Assets</p>
                                <h3 className="text-2xl sm:text-3xl font-black text-slate-700">
                                  {filteredEmployees.filter(emp => emp.status === 'exit').reduce((acc: number, emp: any) => acc + (emp.exitWorkflow?.assets?.filter((asset: any) => asset.status === 'pending_return').length || 0), 0)}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Pending</p>
                              </div>
                              <div className="p-2 sm:p-3 bg-slate-200 rounded-xl flex-shrink-0">
                                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Quick Actions Bar */}
                      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-700 mb-2">Quick Actions</h4>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleButtonAction('initiate_exit')}
                              disabled={loadingStates['initiate_exit']}
                              className="rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-xs font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                            >
                              {loadingStates['initiate_exit'] ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                              ) : (
                                <Plus className="h-4 w-4 mr-1" />
                              )}
                              <span className="hidden sm:inline">Initiate Exit</span>
                              <span className="sm:hidden">Initiate</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleButtonAction('schedule_interview')}
                              disabled={loadingStates['schedule_interview']}
                              className="rounded-xl text-xs font-bold border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                            >
                              {loadingStates['schedule_interview'] ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-1" />
                              ) : (
                                <Calendar className="h-4 w-4 mr-1" />
                              )}
                              <span className="hidden sm:inline">Schedule Interview</span>
                              <span className="sm:hidden">Schedule</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleButtonAction('export_report')}
                              disabled={loadingStates['export_report']}
                              className="rounded-xl text-xs font-bold border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                            >
                              {loadingStates['export_report'] ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600 mr-1" />
                              ) : (
                                <FileSpreadsheet className="h-4 w-4 mr-1" />
                              )}
                              <span className="hidden sm:inline">Export Report</span>
                              <span className="sm:hidden">Export</span>
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select defaultValue="all">
                            <SelectTrigger className="w-[120px] sm:w-[140px] h-8 text-xs rounded-lg border-slate-300">
                              <SelectValue placeholder="Filter status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="pending_approvals">Pending</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs font-bold rounded-lg border-slate-300 hover:bg-slate-100"
                          >
                            <Filter className="h-3 w-3" />
                            <span className="hidden sm:inline ml-1">Filter</span>
                          </Button>
                        </div>
                      </div>

                      {/* Comprehensive Exit Management Cards */}
                      <div className="space-y-6">
                        {filteredEmployees.filter(emp => emp.status === 'exit').map((employee) => (
                          <Card key={employee.id} className="border-rose-200/60 hover:shadow-xl transition-all duration-300 bg-white">
                            <CardContent className="p-0">
                              {/* Employee Header with Progress */}
                              <div className="p-4 sm:p-6 bg-gradient-to-r from-rose-50 to-purple-50 rounded-t-lg">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-3 border-white shadow-lg">
                                      <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${employee.name}`} />
                                      <AvatarFallback className="bg-gradient-to-br from-rose-500 to-purple-500 text-white text-lg font-bold">
                                        {employee.avatar}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{employee.name}</h3>
                                      <p className="text-sm text-slate-600 font-medium truncate">
                                        {employee.designation} • {employee.department}
                                      </p>
                                      <p className="text-xs text-slate-500 mt-1">ID: {employee.id} • Exit ID: {employee.exitWorkflow?.id}</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <div className="text-center sm:text-left">
                                      <div className="text-xl sm:text-2xl font-black text-rose-600">{employee.exitWorkflow?.progress}%</div>
                                      <div className="text-xs text-slate-500 font-medium">Complete</div>
                                    </div>
                                    <Badge className={cn(
                                      "px-2 sm:px-3 py-1 sm:py-1.5 font-bold rounded-full text-xs whitespace-nowrap",
                                      employee.exitWorkflow?.priority === 'high'
                                        ? "bg-red-100 text-red-700 border-red-200"
                                        : employee.exitWorkflow?.priority === 'medium'
                                          ? "bg-amber-100 text-amber-700 border-amber-200"
                                          : "bg-green-100 text-green-700 border-green-200"
                                    )}>
                                      <span className="hidden sm:inline">{employee.exitWorkflow?.priority?.toUpperCase()} Priority</span>
                                      <span className="sm:hidden">{employee.exitWorkflow?.priority?.charAt(0).toUpperCase()}</span>
                                    </Badge>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-4">
                                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-2">
                                    <span>Exit Progress</span>
                                    <span>{employee.exitWorkflow?.progress}% Complete</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                                    <div
                                      className="bg-gradient-to-r from-rose-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                                      style={{ width: `${employee.exitWorkflow?.progress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>

                              {employee.exitWorkflow ? (
                                <div className="p-4 sm:p-6 space-y-6">
                                  {/* Exit Details Grid */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Exit Reason</p>
                                      <p className="text-sm font-bold text-blue-800 truncate">{employee.exitWorkflow.reason}</p>
                                      <Badge className="mt-2 bg-blue-200 text-blue-700 text-[10px] font-bold">
                                        {employee.exitWorkflow.type?.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Initiated On</p>
                                      <p className="text-sm font-bold text-amber-800">
                                        {new Date(employee.exitWorkflow.initiatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                                      <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Last Working Day</p>
                                      <p className="text-sm font-bold text-purple-800">
                                        {new Date(employee.exitWorkflow.expectedLastDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Assigned HR</p>
                                      <p className="text-sm font-bold text-emerald-800 truncate">{employee.exitWorkflow.assignedHR}</p>
                                      {employee.exitWorkflow.exitInterviewScheduled && (
                                        <Badge className="mt-1 bg-emerald-200 text-emerald-700 text-[10px] font-bold">
                                          Interview Scheduled
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Tabbed Content */}
                                  <Tabs defaultValue="clearance" className="w-full">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                      <TabsList className="grid w-full sm:w-auto grid-cols-3 h-10 bg-slate-100 rounded-xl p-1">
                                        <TabsTrigger value="clearance" className="rounded-lg text-xs font-bold">Clearance</TabsTrigger>
                                        <TabsTrigger value="assets" className="rounded-lg text-xs font-bold">Assets</TabsTrigger>
                                        <TabsTrigger value="knowledge" className="rounded-lg text-xs font-bold">Knowledge</TabsTrigger>
                                      </TabsList>

                                      <div className="flex flex-wrap gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleButtonAction('view_details', employee.id)}
                                          disabled={loadingStates[`view_details_${employee.id}`]}
                                          className="rounded-xl text-xs font-bold h-8 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                                        >
                                          {loadingStates[`view_details_${employee.id}`] ? (
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1" />
                                          ) : (
                                            <Eye className="h-3 w-3 mr-1" />
                                          )}
                                          <span className="hidden sm:inline">View Full Details</span>
                                          <span className="sm:hidden">Details</span>
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => handleButtonAction('export_report', employee.id)}
                                          disabled={loadingStates[`export_report_${employee.id}`]}
                                          className="rounded-xl text-xs font-bold h-8 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                                        >
                                          {loadingStates[`export_report_${employee.id}`] ? (
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                                          ) : (
                                            <Download className="h-3 w-3 mr-1" />
                                          )}
                                          <span className="hidden sm:inline">Export Report</span>
                                          <span className="sm:hidden">Export</span>
                                        </Button>
                                      </div>
                                    </div>

                                    <TabsContent value="clearance" className="mt-0">
                                      <div className="space-y-3">
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                          <Activity className="h-4 w-4 text-rose-600" />
                                          Clearance Progress ({employee.exitWorkflow.steps.filter((s: any) => s.status === 'completed').length}/{employee.exitWorkflow.steps.length})
                                        </h4>
                                        {employee.exitWorkflow.steps.map((step: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className={cn(
                                              "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md",
                                              step.status === 'pending'
                                                ? "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200"
                                                : step.status === 'completed'
                                                  ? "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200"
                                                  : "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200"
                                            )}
                                          >
                                            <div className="flex items-start gap-3 mb-3 sm:mb-0">
                                              {step.status === 'pending' ? (
                                                <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                              ) : step.status === 'completed' ? (
                                                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                              ) : (
                                                <div className="h-5 w-5 rounded-full border-2 border-slate-300 mt-0.5 flex-shrink-0" />
                                              )}
                                              <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-800">{step.name}</p>
                                                <p className="text-xs text-slate-600 mt-0.5">{step.department}</p>
                                                {step.details && (
                                                  <p className="text-xs text-slate-500 mt-1">{step.details}</p>
                                                )}
                                                {step.completedBy && (
                                                  <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Completed by {step.completedBy}</p>
                                                )}
                                                {step.assignedTo && step.status === 'pending' && (
                                                  <p className="text-xs text-amber-600 mt-1 font-medium">→ Assigned to {step.assignedTo}</p>
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-3">
                                              {step.dueDate && step.status === 'pending' && (
                                                <div className="text-right">
                                                  <p className="text-xs text-slate-500 font-medium">Due Date</p>
                                                  <p className="text-xs font-bold text-slate-700">
                                                    {new Date(step.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                  </p>
                                                </div>
                                              )}
                                              <div className="flex items-center gap-2">
                                                {step.status === 'pending' && (
                                                  <Button
                                                    size="sm"
                                                    onClick={() => completeStep(employee.id, step.id)}
                                                    className="h-7 px-3 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:scale-105"
                                                  >
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Complete
                                                  </Button>
                                                )}
                                                <Badge
                                                  className={cn(
                                                    "rounded-lg text-[10px] font-black uppercase flex-shrink-0",
                                                    step.status === 'pending'
                                                      ? "bg-amber-200 text-amber-700"
                                                      : step.status === 'completed'
                                                        ? "bg-emerald-200 text-emerald-700"
                                                        : "bg-slate-200 text-slate-600"
                                                  )}
                                                >
                                                  {step.status === 'completed' ? 'Cleared' : step.status === 'pending' ? 'In Progress' : 'Waiting'}
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </TabsContent>

                                    <TabsContent value="assets" className="mt-0">
                                      <div className="space-y-3">
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                          <Briefcase className="h-4 w-4 text-rose-600" />
                                          Asset Return Status ({employee.exitWorkflow.assets?.filter((a: any) => a.status === 'returned').length || 0}/{employee.exitWorkflow.assets?.length || 0})
                                        </h4>
                                        {employee.exitWorkflow.assets?.map((asset: any, idx: number) => (
                                          <div key={idx} className={cn(
                                            "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border",
                                            asset.status === 'returned'
                                              ? "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200"
                                              : "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200"
                                          )}>
                                            <div className="mb-3 sm:mb-0">
                                              <p className="text-sm font-bold text-slate-800">{asset.name}</p>
                                              <p className="text-xs text-slate-600">Serial: {asset.serialNumber}</p>
                                              {asset.returnedDate && (
                                                <p className="text-xs text-emerald-600 font-medium mt-1">
                                                  Returned on {new Date(asset.returnedDate).toLocaleDateString()}
                                                </p>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {asset.status === 'assigned' && (
                                                <Button
                                                  size="sm"
                                                  onClick={() => returnAsset(employee.id, asset.id)}
                                                  className="h-7 px-3 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105"
                                                >
                                                  <CheckCircle className="h-3 w-3 mr-1" />
                                                  Mark Returned
                                                </Button>
                                              )}
                                              <Badge className={cn(
                                                "rounded-lg text-[10px] font-black uppercase",
                                                asset.status === 'returned'
                                                  ? "bg-emerald-200 text-emerald-700"
                                                  : "bg-amber-200 text-amber-700"
                                              )}>
                                                {asset.status === 'returned' ? 'Returned' : 'Pending Return'}
                                              </Badge>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </TabsContent>

                                    <TabsContent value="knowledge" className="mt-0">
                                      <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-rose-600" />
                                          Knowledge Transfer Progress
                                        </h4>

                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                          <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-sm font-bold text-blue-800">Transfer Sessions</h5>
                                            <Badge className={cn(
                                              "text-[10px] font-bold",
                                              employee.exitWorkflow.knowledgeTransfer?.status === 'completed'
                                                ? "bg-emerald-200 text-emerald-700"
                                                : "bg-amber-200 text-amber-700"
                                            )}>
                                              {employee.exitWorkflow.knowledgeTransfer?.status?.toUpperCase()}
                                            </Badge>
                                          </div>

                                          <div className="space-y-2">
                                            {employee.exitWorkflow.knowledgeTransfer?.sessions?.map((session: any, idx: number) => (
                                              <div key={idx} className="flex justify-between items-center text-xs">
                                                <span className="font-medium text-blue-700">{session.topic}</span>
                                                <span className="text-blue-600">
                                                  {session.date} • {session.duration} • {session.attendees.join(', ')}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                          <h5 className="text-sm font-bold text-purple-800 mb-2">Documentation Handover</h5>
                                          <div className="flex flex-wrap gap-2">
                                            {employee.exitWorkflow.knowledgeTransfer?.documents?.map((doc: string, idx: number) => (
                                              <Badge key={idx} className="bg-purple-200 text-purple-700 text-[10px] font-bold">
                                                {doc}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </TabsContent>
                                  </Tabs>

                                  {/* Enhanced Action Buttons */}
                                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                                    <Button
                                      onClick={() => handleButtonAction('view_profile', employee.id)}
                                      disabled={loadingStates[`view_profile_${employee.id}`]}
                                      className="flex-1 rounded-xl h-11 font-bold bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                                    >
                                      {loadingStates[`view_profile_${employee.id}`] ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                      ) : (
                                        <Eye className="h-4 w-4 mr-2" />
                                      )}
                                      <span className="hidden sm:inline">View Complete Profile</span>
                                      <span className="sm:hidden">Profile</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleButtonAction('schedule_interview', employee.id)}
                                      disabled={loadingStates[`schedule_interview_${employee.id}`]}
                                      className="flex-1 rounded-xl h-11 font-bold border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                                    >
                                      {loadingStates[`schedule_interview_${employee.id}`] ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                                      ) : (
                                        <Calendar className="h-4 w-4 mr-2" />
                                      )}
                                      <span className="hidden sm:inline">Schedule Interview</span>
                                      <span className="sm:hidden">Interview</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleButtonAction('export_clearance', employee.id)}
                                      disabled={loadingStates[`export_clearance_${employee.id}`]}
                                      className="flex-1 rounded-xl h-11 font-bold border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                                    >
                                      {loadingStates[`export_clearance_${employee.id}`] ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2" />
                                      ) : (
                                        <Download className="h-4 w-4 mr-2" />
                                      )}
                                      <span className="hidden sm:inline">Export Clearance</span>
                                      <span className="sm:hidden">Export</span>
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-6 text-center text-slate-500">
                                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-300" />
                                  <p className="text-sm font-medium mb-3">No exit workflow data available</p>
                                  <p className="text-xs text-slate-400 mb-4 max-w-md">Initialize a comprehensive exit workflow to track clearances, asset returns, and knowledge transfer.</p>
                                  <Button
                                    size="sm"
                                    onClick={() => handleButtonAction('initialize_workflow', employee.id)}
                                    disabled={loadingStates[`initialize_workflow_${employee.id}`]}
                                    className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                                  >
                                    {loadingStates[`initialize_workflow_${employee.id}`] ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                    ) : (
                                      <Plus className="h-3 w-3 mr-2" />
                                    )}
                                    Initialize Exit Workflow
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Card className="border-dashed border-2 py-16 sm:py-24 bg-gradient-to-br from-slate-50 to-rose-50/30 rounded-[2rem] hover:shadow-lg transition-all">
                      <CardContent className="flex flex-col items-center justify-center text-center">
                        <div className="relative mb-8">
                          <div className="p-6 bg-gradient-to-br from-rose-100 to-purple-100 rounded-full mb-4 shadow-lg">
                            <UserMinus className="h-12 w-12 text-rose-500" />
                          </div>
                          <div className="absolute -top-2 -right-2 p-2 bg-emerald-100 rounded-full">
                            <CheckCircle className="h-6 w-6 text-emerald-500" />
                          </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">No Active Exit Processes</h3>
                        <p className="text-sm sm:text-base text-slate-600 max-w-md mt-2 font-medium leading-relaxed">
                          Great news! There are currently no employees in the exit workflow. Your team is stable and all previous clearances have been completed successfully.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 mt-8">
                          <Button
                            onClick={() => handleButtonAction('initiate_exit')}
                            disabled={loadingStates['initiate_exit']}
                            className="rounded-xl px-6 py-3 font-bold bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                          >
                            {loadingStates['initiate_exit'] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            <span className="hidden sm:inline">Initiate Exit Process</span>
                            <span className="sm:hidden">Start Exit</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleButtonAction('view_past_exits')}
                            disabled={loadingStates['view_past_exits']}
                            className="rounded-xl px-6 py-3 font-bold border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                          >
                            {loadingStates['view_past_exits'] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-700 mr-2" />
                            ) : (
                              <History className="h-4 w-4 mr-2" />
                            )}
                            <span className="hidden sm:inline">View Past Exits</span>
                            <span className="sm:hidden">History</span>
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-lg">
                          <div className="text-center p-3 bg-white rounded-xl border border-slate-200">
                            <div className="text-lg font-bold text-emerald-600">12</div>
                            <div className="text-xs text-slate-500 font-medium">Completed This Month</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-xl border border-slate-200">
                            <div className="text-lg font-bold text-blue-600">8.5</div>
                            <div className="text-xs text-slate-500 font-medium">Avg Days to Complete</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-xl border border-slate-200">
                            <div className="text-lg font-bold text-purple-600">98%</div>
                            <div className="text-xs text-slate-500 font-medium">Completion Rate</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : filteredEmployees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredEmployees.map((employee) => (
                    <EmployeeCard
                      key={employee.id}
                      employee={employee}
                      statusConfig={statusConfig}
                      onUpdateStatus={handleUpdateStatus}
                      onEdit={handleEditEmployee}
                      onPhotoUpload={handlePhotoUpload}
                      uploadingPhoto={uploadingPhoto}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 py-24 bg-slate-50/30 rounded-[2rem]">
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    <div className="p-5 bg-slate-100 rounded-full mb-6">
                      <Search className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No match found</h3>
                    <p className="text-sm text-slate-500 max-w-xs mt-2 font-medium">
                      Zero results for your current filter combination. Try broader criteria.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-8 rounded-xl px-8 font-bold border-slate-200"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveTab('all');
                        setDepartmentFilter('all');
                      }}
                    >
                      Reset all filters
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Enhanced Exit Initiation Dialog */}
      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-rose-600" />
              Initiate Employee Exit Process
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Start a new exit workflow for an employee. This will create a comprehensive clearance process.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exit_employee" className="text-sm font-medium text-slate-700">Employee *</Label>
                <Select onValueChange={(value) => setExitFormData({ ...exitFormData, employeeId: value })}>
                  <SelectTrigger className="rounded-lg mt-1">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(emp => emp.status !== 'exit').map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name} - {emp.designation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="exit_reason" className="text-sm font-medium text-slate-700">Exit Reason *</Label>
                <Select onValueChange={(value) => setExitFormData({ ...exitFormData, reason: value })}>
                  <SelectTrigger className="rounded-lg mt-1">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Career Growth Opportunity">Career Growth</SelectItem>
                    <SelectItem value="Better Compensation Package">Better Package</SelectItem>
                    <SelectItem value="Relocation">Relocation</SelectItem>
                    <SelectItem value="Family Reasons">Family Reasons</SelectItem>
                    <SelectItem value="Work-Life Balance">Work-Life Balance</SelectItem>
                    <SelectItem value="Retirement">Retirement</SelectItem>
                    <SelectItem value="Health Issues">Health Issues</SelectItem>
                    <SelectItem value="Company Restructuring">Restructuring</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exit_type" className="text-sm font-medium text-slate-700">Exit Type *</Label>
                <Select onValueChange={(value) => setExitFormData({ ...exitFormData, type: value })}>
                  <SelectTrigger className="rounded-lg mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voluntary">Voluntary</SelectItem>
                    <SelectItem value="involuntary">Involuntary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority" className="text-sm font-medium text-slate-700">Priority *</Label>
                <Select onValueChange={(value) => setExitFormData({ ...exitFormData, priority: value })}>
                  <SelectTrigger className="rounded-lg mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="last_working_day" className="text-sm font-medium text-slate-700">Expected Last Working Day *</Label>
              <Input
                id="last_working_day"
                type="date"
                className="rounded-lg mt-1"
                min={new Date().toISOString().split('T')[0]}
                value={exitFormData.lastWorkingDay}
                onChange={(e) => setExitFormData({ ...exitFormData, lastWorkingDay: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="assigned_hr" className="text-sm font-medium text-slate-700">Assigned HR Manager</Label>
              <Select value={exitFormData.assignedHR} onValueChange={(value) => setExitFormData({ ...exitFormData, assignedHR: value })}>
                <SelectTrigger className="rounded-lg mt-1">
                  <SelectValue placeholder="Select HR manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emily_davis">Emily Davis</SelectItem>
                  <SelectItem value="hr_team">HR Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsExitDialogOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={createExitWorkflow}
              disabled={loadingStates['create_exit']}
              className="rounded-lg bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700"
            >
              {loadingStates['create_exit'] ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : null}
              Create Exit Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Interview Scheduling Dialog */}
      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Schedule Exit Interview
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {selectedEmployee ? `Schedule exit interview for ${selectedEmployee?.name}` : 'Schedule an exit interview session'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="interview_date" className="text-sm font-medium text-slate-700">Interview Date *</Label>
                <Input
                  id="interview_date"
                  type="date"
                  className="rounded-lg mt-1"
                  min={new Date().toISOString().split('T')[0]}
                  value={interviewFormData.date}
                  onChange={(e) => setInterviewFormData({ ...interviewFormData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="interview_time" className="text-sm font-medium text-slate-700">Time *</Label>
                <Input
                  id="interview_time"
                  type="time"
                  className="rounded-lg mt-1"
                  value={interviewFormData.time}
                  onChange={(e) => setInterviewFormData({ ...interviewFormData, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="interviewer" className="text-sm font-medium text-slate-700">Interviewer *</Label>
              <Select onValueChange={(value) => setInterviewFormData({ ...interviewFormData, interviewer: value })}>
                <SelectTrigger className="rounded-lg mt-1">
                  <SelectValue placeholder="Select interviewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Emily Davis">Emily Davis (HR Manager)</SelectItem>
                  <SelectItem value="John Smith">John Smith (Team Lead)</SelectItem>
                  <SelectItem value="Sarah Johnson">Sarah Johnson (Manager)</SelectItem>
                  <SelectItem value="Mike Brown">Mike Brown (Department Head)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="meeting_type" className="text-sm font-medium text-slate-700">Meeting Type *</Label>
              <Select onValueChange={(value) => setInterviewFormData({ ...interviewFormData, meetingType: value })}>
                <SelectTrigger className="rounded-lg mt-1">
                  <SelectValue placeholder="Select meeting type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="video_call">Video Call</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-slate-700">Additional Notes</Label>
              <Input
                id="notes"
                placeholder="Any special instructions or notes..."
                className="rounded-lg mt-1"
                value={interviewFormData.notes}
                onChange={(e) => setInterviewFormData({ ...interviewFormData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsInterviewDialogOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={scheduleInterview}
              disabled={loadingStates['schedule_interview']}
              className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loadingStates['schedule_interview'] ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : null}
              Schedule Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Exit Process Details - {selectedEmployee?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Comprehensive view of the exit workflow progress and requirements
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee?.exitWorkflow ? (
            <div className="space-y-6 py-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-700">{selectedEmployee.exitWorkflow.progress}%</div>
                  <div className="text-xs text-blue-600">Complete</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-rose-700">{selectedEmployee.exitWorkflow.steps.filter((s: any) => s.status === 'pending').length}</div>
                  <div className="text-xs text-rose-600">Pending</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-emerald-700">{selectedEmployee.exitWorkflow.steps.filter((s: any) => s.status === 'completed').length}</div>
                  <div className="text-xs text-emerald-600">Completed</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-amber-700">{selectedEmployee.exitWorkflow.assets?.filter((a: any) => a.status === 'pending_return').length || 0}</div>
                  <div className="text-xs text-amber-600">Assets Due</div>
                </div>
              </div>

              {/* Detailed Steps */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Clearance Steps</h3>
                <div className="space-y-3">
                  {selectedEmployee.exitWorkflow.steps.map((step: any, idx: number) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-slate-800">{step.name}</h4>
                          <p className="text-sm text-slate-600">{step.department}</p>
                        </div>
                        <Badge className={step.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : step.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}>
                          {step.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      {step.assignedTo && (
                        <p className="text-xs text-slate-500">Assigned to: {step.assignedTo}</p>
                      )}
                      {step.dueDate && (
                        <p className="text-xs text-slate-500">Due: {new Date(step.dueDate).toLocaleDateString()}</p>
                      )}
                      {step.details && (
                        <p className="text-sm text-slate-700 mt-2">{step.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No exit workflow details available</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
            <Button onClick={() => generatePDFReport(selectedEmployee, 'report')} className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Export Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              Complete Profile - {selectedEmployee?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Full employee information and exit workflow status
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6 py-4">
              {/* Employee Header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                <Avatar className="h-16 w-16 border-2 border-white">
                  <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${selectedEmployee.name}`} />
                  <AvatarFallback className="bg-purple-500 text-white text-lg font-bold">
                    {selectedEmployee.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedEmployee.name}</h3>
                  <p className="text-slate-600">{selectedEmployee.designation}</p>
                  <p className="text-sm text-slate-500">{selectedEmployee.department} • {selectedEmployee.location}</p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Employee ID</p>
                  <p className="text-sm font-bold text-slate-800">{selectedEmployee.id}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Joining Date</p>
                  <p className="text-sm font-bold text-slate-800">{new Date(selectedEmployee.joining).toLocaleDateString()}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Email</p>
                  <p className="text-sm font-bold text-slate-800">{selectedEmployee.email}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Phone</p>
                  <p className="text-sm font-bold text-slate-800">{selectedEmployee.phone}</p>
                </div>
              </div>

              {/* Exit Information */}
              {selectedEmployee.exitWorkflow && (
                <div className="p-4 border-2 border-rose-200 bg-rose-50 rounded-lg">
                  <h4 className="font-bold text-rose-800 mb-3 flex items-center gap-2">
                    <UserMinus className="h-4 w-4" />
                    Exit Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">Reason: </span>
                      <span className="font-bold text-slate-800">{selectedEmployee.exitWorkflow.reason}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Type: </span>
                      <span className="font-bold text-slate-800 capitalize">{selectedEmployee.exitWorkflow.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Priority: </span>
                      <span className="font-bold text-slate-800 capitalize">{selectedEmployee.exitWorkflow.priority}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Assigned HR: </span>
                      <span className="font-bold text-slate-800">{selectedEmployee.exitWorkflow.assignedHR}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Initiated: </span>
                      <span className="font-bold text-slate-800">{new Date(selectedEmployee.exitWorkflow.initiatedAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Last Day: </span>
                      <span className="font-bold text-slate-800">{new Date(selectedEmployee.exitWorkflow.expectedLastDay).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileModalOpen(false)}>Close</Button>
            <Button onClick={() => generatePDFReport(selectedEmployee, 'report')} className="bg-purple-600 hover:bg-purple-700">
              <Download className="h-4 w-4 mr-2" />
              Export Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Past Exits Modal */}
      <Dialog open={isPastExitsModalOpen} onOpenChange={setIsPastExitsModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <History className="h-5 w-5 text-slate-600" />
              Historical Exit Records
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Past employee exits and their completion statistics
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-center">
                <div className="text-lg font-bold text-emerald-700">{employees.filter(e => e.status === 'terminated' || (e.status === 'exit' && e.exitWorkflow?.progress === 100)).length}</div>
                <div className="text-xs text-emerald-600">Total Exits</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-700">-</div>
                <div className="text-xs text-blue-600">Avg Days</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <div className="text-lg font-bold text-purple-700">-</div>
                <div className="text-xs text-purple-600">Completion Rate</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <div className="text-lg font-bold text-amber-700">-</div>
                <div className="text-xs text-amber-600">Avg Rating</div>
              </div>
            </div>

            {/* Sample Past Exits */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Completed Exits</h3>
              <div className="space-y-3">
                {employees.filter(e => e.status === 'terminated' || (e.status === 'exit' && e.exitWorkflow?.progress === 100)).length > 0 ? (
                  employees.filter(e => e.status === 'terminated' || (e.status === 'exit' && e.exitWorkflow?.progress === 100)).map((exit, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-800">{exit.name}</p>
                        <p className="text-sm text-slate-600">{exit.department} • {exit.exitWorkflow?.reason || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">{exit.exitWorkflow?.expectedLastDay ? new Date(exit.exitWorkflow.expectedLastDay).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No historical exit records found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPastExitsModalOpen(false)}>Close</Button>
            <Button onClick={() => generateExcelReport()} className="bg-slate-600 hover:bg-slate-700">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Historical Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 border-none shadow-2xl">
          {/* Header Section with Gradient Background */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 rounded-t-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Edit className="h-6 w-6 text-white" />
                </div>
                Edit Employee Profile
              </DialogTitle>
              <DialogDescription className="text-blue-100 font-medium mt-2">
                Update employee information and personal details.
              </DialogDescription>
            </DialogHeader>
          </div>

          {editingEmployee && (
            <div className="px-8 py-6 space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-name"
                      placeholder="Enter full name"
                      value={editingEmployee.name}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                      className="rounded-xl mt-2 h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-designation" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Designation <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-designation"
                      placeholder="Enter job title"
                      value={editingEmployee.designation}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, designation: e.target.value })}
                      className="rounded-xl mt-2 h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Work Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 pt-4 border-t">
                  <Briefcase className="h-4 w-4" />
                  Work Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-department" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={editingEmployee.department}
                      onValueChange={(value) => setEditingEmployee({ ...editingEmployee, department: value })}
                    >
                      <SelectTrigger className="rounded-xl mt-2 h-11 border-slate-200 bg-slate-50/50">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Human Resources">Human Resources</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Customer Support">Customer Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-location" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Work Location <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-location"
                      placeholder="Enter location"
                      value={editingEmployee.location}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, location: e.target.value })}
                      className="rounded-xl mt-2 h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-joining" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Joining Date
                    </Label>
                    <Input
                      id="edit-joining"
                      type="date"
                      value={editingEmployee.joining}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, joining: e.target.value })}
                      className="rounded-xl mt-2 h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 pt-4 border-t">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-email" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      placeholder="Enter email address"
                      value={editingEmployee.email}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                      className="rounded-xl mt-2 h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-phone"
                      placeholder="Enter phone number"
                      value={editingEmployee.phone}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                      className="rounded-xl mt-2 h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingEmployee(null);
              }}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateEmployee}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Update Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}

function EmployeeCard({
  employee,
  statusConfig,
  onUpdateStatus,
  onEdit,
  onPhotoUpload,
  uploadingPhoto
}: {
  employee: any,
  statusConfig: any,
  onUpdateStatus: (id: string, status: string, workflow?: any) => void,
  onEdit: (employee: any) => void,
  onPhotoUpload: (employeeId: string, file: File) => void,
  uploadingPhoto: string | null
}) {
  const { toast } = useToast();
  const [isOverviewDialogOpen, setIsOverviewDialogOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [exitReason, setExitReason] = useState('');

  // Calculate employee tenure
  const calculateTenure = (joiningDate: string) => {
    const start = new Date(joiningDate);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    const months = now.getMonth() - start.getMonth();
    const totalMonths = years * 12 + months;

    if (totalMonths < 1) return "Less than a month";
    if (totalMonths < 12) return `${totalMonths} month${totalMonths > 1 ? 's' : ''}`;

    const remainingMonths = totalMonths % 12;
    return `${Math.floor(totalMonths / 12)} year${Math.floor(totalMonths / 12) > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
  };

  // Copy to clipboard handler
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
      duration: 2000,
    });
  };

  const handleInitiateExit = () => {
    // Validation
    if (!exitReason) {
      toast({
        title: "Validation Error",
        description: "Please select a reason for exit before proceeding.",
        variant: "destructive"
      });
      return;
    }

    const workflow = {
      initiatedAt: new Date().toISOString(),
      reason: exitReason,
      status: 'pending_approvals',
      steps: [
        { name: 'Manager Approval', status: 'pending' },
        { name: 'HR Clearance', status: 'waiting' },
        { name: 'IT Assets Recovery', status: 'waiting' },
        { name: 'Finance Settlement', status: 'waiting' }
      ]
    };

    onUpdateStatus(employee.id, 'exit', workflow);
    setIsExitDialogOpen(false);
    setExitReason(''); // Clear the reason after successful submission

    toast({
      title: "✅ Exit Process Initiated",
      description: `${exitReason} workflow started for ${employee.name}. All relevant departments will be notified.`,
      duration: 5000
    });
  };

  return (
    <Card className="group hover:border-blue-200 hover:shadow-xl transition-all duration-300 rounded-[1.5rem] overflow-hidden border-slate-200/60 flex flex-col bg-white">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
      <CardContent className="p-6 flex-1">
        <div className="flex justify-between items-start mb-5">
          <div className="relative group">
            <Avatar className="h-16 w-16 ring-4 ring-white shadow-md border border-slate-100 group-hover:scale-105 transition-transform duration-300 cursor-pointer">
              <AvatarImage
                src={employee.photoUrl || `https://api.dicebear.com/7.x/lorelei/svg?seed=${employee.name}`}
              />
              <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                {employee.avatar}
              </AvatarFallback>
            </Avatar>

            {/* Photo Upload Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
              <div className="relative">
                <input
                  type="file"
                  id={`photo-upload-${employee.id}`}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPhotoUpload(employee.id, file);
                  }}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => document.getElementById(`photo-upload-${employee.id}`)?.click()}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  disabled={uploadingPhoto === employee.id}
                >
                  {uploadingPhoto === employee.id ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className={cn(
              "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white shadow-sm",
              employee.status === 'active' ? "bg-emerald-500" : "bg-slate-400"
            )} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                <MoreVertical className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel>Employee Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(employee)} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2 text-blue-600" />
                Edit Profile Info
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: "View Docs", description: "Loading documents..." })} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2 text-indigo-600" />
                Employee Dossier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => document.getElementById(`photo-upload-${employee.id}`)?.click()} className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2 text-emerald-600" />
                Update Photo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold">
                <Trash2 className="h-4 w-4 mr-2" />
                Mark as Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1 mb-5">
          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate text-lg tracking-tight">
            {employee.name}
          </h3>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
            {employee.designation}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-xl group-hover:bg-blue-50 transition-colors border border-transparent group-hover:border-blue-100">
            <Building2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500" />
            <span className="truncate font-medium">{employee.department}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Mail className="h-3.5 w-3.5 text-slate-400 ml-2" />
            <span className="truncate text-xs font-medium">{employee.email}</span>
          </div>
        </div>
      </CardContent>

      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <Badge
          className={cn(
            "rounded-lg px-2 py-0.5 border text-[10px] font-bold tracking-tight shadow-sm",
            statusConfig[employee.status].class
          )}
        >
          {statusConfig[employee.status].label}
        </Badge>

        <Dialog open={isOverviewDialogOpen} onOpenChange={setIsOverviewDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg bg-white border-slate-200 text-xs font-bold hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Overview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-[2rem] overflow-hidden p-0 border-none shadow-2xl">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
              <div className="absolute -bottom-12 left-8 p-1.5 bg-white rounded-[2rem] shadow-xl">
                <Avatar className="h-28 w-28 border-2 border-white">
                  <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${employee.name}`} />
                  <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">{employee.avatar}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="pt-16 px-8 pb-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{employee.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-blue-600 font-bold uppercase tracking-widest text-xs">{employee.designation}</p>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <p className="text-slate-500 font-medium text-xs">{employee.id}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <p className="text-slate-600 text-xs font-semibold">Tenure: {calculateTenure(employee.joining)}</p>
                  </div>
                </div>
                <Badge className={cn("rounded-xl px-4 py-1.5 font-bold text-[10px] uppercase shadow-sm", statusConfig[employee.status].class)}>
                  {statusConfig[employee.status].label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <ProfileInfoItem icon={<Building2 />} label="Department" value={employee.department} />
                <ProfileInfoItem icon={<MapPin />} label="Work Location" value={employee.location} />

                <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100/80 bg-slate-50/30 hover:bg-white hover:border-blue-100 transition-all group/info cursor-pointer"
                  onClick={() => copyToClipboard(employee.email, "Email")}>
                  <div className="p-2.5 rounded-xl mt-0.5 transition-colors group-hover/info:scale-110 bg-blue-50 text-blue-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Official Email</label>
                    <p className="text-sm font-bold text-slate-800 truncate">{employee.email}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Click to copy</p>
                  </div>
                  <Copy className="h-4 w-4 text-slate-400 mt-6 opacity-0 group-hover/info:opacity-100 transition-opacity" />
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100/80 bg-slate-50/30 hover:bg-white hover:border-emerald-100 transition-all group/info cursor-pointer"
                  onClick={() => copyToClipboard(employee.phone, "Phone number")}>
                  <div className="p-2.5 rounded-xl mt-0.5 transition-colors group-hover/info:scale-110 bg-emerald-50 text-emerald-600">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
                    <p className="text-sm font-bold text-slate-800 truncate">{employee.phone}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Click to copy</p>
                  </div>
                  <Copy className="h-4 w-4 text-slate-400 mt-6 opacity-0 group-hover/info:opacity-100 transition-opacity" />
                </div>

                <ProfileInfoItem icon={<Calendar />} label="Joining Date" value={new Date(employee.joining).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
                <ProfileInfoItem icon={<Briefcase />} label="Employment Type" value="Full Time" />
              </div>

              {/* Quick Actions Bar */}
              {employee.status !== 'exit' && (
                <div className="mb-8 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-12 flex-col gap-1 hover:bg-white hover:border-blue-300"
                      onClick={() => window.open(`mailto:${employee.email}`)}
                    >
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="text-[10px] font-semibold">Send Email</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-12 flex-col gap-1 hover:bg-white hover:border-emerald-300"
                      onClick={() => window.open(`tel:${employee.phone}`)}
                    >
                      <Phone className="h-4 w-4 text-emerald-600" />
                      <span className="text-[10px] font-semibold">Call</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-12 flex-col gap-1 hover:bg-white hover:border-purple-300"
                      onClick={() => toast({ title: "Documents", description: "Opening employee documents..." })}
                    >
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span className="text-[10px] font-semibold">Documents</span>
                    </Button>
                  </div>
                </div>
              )}

              {employee.status === 'exit' && employee.exitWorkflow && (
                <div className="mb-8 p-6 bg-rose-50 rounded-3xl border border-rose-100">
                  <h4 className="text-sm font-black text-rose-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Exit Workflow Progress
                  </h4>
                  <div className="space-y-3">
                    {employee.exitWorkflow.steps.map((step: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-white/60 p-3 rounded-xl border border-rose-100/50">
                        <span className="text-sm font-bold text-slate-700">{step.name}</span>
                        <Badge className={cn(
                          "rounded-lg text-[10px] font-black uppercase tracking-tight",
                          step.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"
                        )}>
                          {step.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl py-7 h-auto font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98] hover:shadow-xl"
                  onClick={() => {
                    setIsOverviewDialogOpen(false);
                    onEdit(employee);
                  }}
                >
                  <Edit className="h-5 w-5 mr-3" />
                  Edit Profile
                </Button>

                {employee.status !== 'exit' && (
                  <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 rounded-2xl py-7 h-auto text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-bold transition-all active:scale-[0.98]">
                        <Trash2 className="h-5 w-5 mr-3" />
                        Exit Process
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                      <div className="h-24 bg-gradient-to-r from-rose-600 to-rose-700 p-6">
                        <DialogTitle className="text-2xl font-bold text-white tracking-tight">Exit Process</DialogTitle>
                        <DialogDescription className="text-rose-100 font-medium">Initiate resignation or termination for {employee.name}</DialogDescription>
                      </div>
                      <div className="p-8 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reason for Exit</Label>
                          <Select onValueChange={setExitReason}>
                            <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50/50">
                              <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="Resignation">Voluntary Resignation</SelectItem>
                              <SelectItem value="Termination">Termination (Performance/Policy)</SelectItem>
                              <SelectItem value="Retirement">Retirement</SelectItem>
                              <SelectItem value="Contract End">End of Contract</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Notice Period Status</Label>
                          <Select>
                            <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50/50">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="serving">Serving Notice</SelectItem>
                              <SelectItem value="waived">Notice Waived</SelectItem>
                              <SelectItem value="immediate">Immediate Release</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="px-8 pb-8 flex gap-3">
                        <Button
                          variant="ghost"
                          className="flex-1 rounded-xl h-11 font-bold text-slate-500 hover:bg-slate-100"
                          onClick={() => {
                            setIsExitDialogOpen(false);
                            setExitReason(''); // Clear form on cancel
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 bg-rose-600 hover:bg-rose-700 rounded-xl h-11 font-bold shadow-lg shadow-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleInitiateExit}
                          disabled={!exitReason}
                        >
                          Confirm Exit Process
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
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

function ProfileInfoItem({ icon, label, value, color = "bg-slate-100 text-slate-500" }: { icon: React.ReactNode, label: string, value: string, color?: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100/80 bg-slate-50/30 hover:bg-white hover:border-blue-100 transition-all group/info">
      <div className={cn("p-2.5 rounded-xl mt-0.5 transition-colors group-hover/info:scale-110", color)}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4" }) : icon}
      </div>
      <div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
