import React, { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Banknote,
  Calculator,
  Download,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Percent,
  Shield,
  Printer,
  Eye,
  CheckCircle2,
  Send,
  Receipt,
  Filter,
  X,
  ArrowUpCircle,
  Calendar,
  CheckSquare,
  Square,
  Mail,
  Plus,
  Clock,
  CreditCard,
  Building2,
  Wallet,
  Edit3,
  Save,
  ArrowRight,
  FileCheck,
  AlertCircle,
  ChevronRight,
  CircleDollarSign,
  BarChart3,
  FileText
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function HRMPayroll() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State management
  const [selectedMonth, setSelectedMonth] = useState('February 2026');
  const [activeTab, setActiveTab] = useState('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  
  // Bulk actions state
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Salary revision state
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  
  // Payroll processing state
  const [processingDialogOpen, setProcessingDialogOpen] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  
  // Individual payroll processing
  const [individualPayrollOpen, setIndividualPayrollOpen] = useState(false);
  const [processingEmployee, setProcessingEmployee] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [remarks, setRemarks] = useState('');
  const [processStep, setProcessStep] = useState(1);
  const [editedSalary, setEditedSalary] = useState<any>(null);
  
  // Payroll configuration
  const [payrollConfig] = useState({
    profTax: 200,
    pfRate: 12,
    esiRate: 1.75,
    bonusRate: 8.33
  });

  // Mock employee salary data
  const [employees, setEmployees] = useState([
    {
      id: 'EMP001',
      name: 'John Smith',
      designation: 'Senior Software Engineer',
      department: 'Engineering',
      baseSalary: 75000,
      allowances: 15000,
      deductions: 8500,
      netSalary: 81500,
      tax: 12000,
      pf: 9000,
      esi: 1315,
      status: 'processed'
    },
    {
      id: 'EMP002',
      name: 'Sarah Johnson',
      designation: 'Product Manager',
      department: 'Product',
      baseSalary: 85000,
      allowances: 17000,
      deductions: 9200,
      netSalary: 92800,
      tax: 15300,
      pf: 10200,
      esi: 1488,
      status: 'processed'
    },
    {
      id: 'EMP003',
      name: 'Mike Brown',
      designation: 'UI/UX Designer',
      department: 'Design',
      baseSalary: 55000,
      allowances: 11000,
      deductions: 6600,
      netSalary: 59400,
      tax: 8250,
      pf: 6600,
      esi: 963,
      status: 'pending'
    },
    {
      id: 'EMP004',
      name: 'Emily Davis',
      designation: 'HR Manager',
      department: 'Human Resources',
      baseSalary: 65000,
      allowances: 13000,
      deductions: 7800,
      netSalary: 70200,
      tax: 9750,
      pf: 7800,
      esi: 1138,
      status: 'pending'
    },
    {
      id: 'EMP005',
      name: 'Alex Wilson',
      designation: 'Sales Executive',
      department: 'Sales',
      baseSalary: 45000,
      allowances: 9000,
      deductions: 5400,
      netSalary: 48600,
      tax: 6750,
      pf: 5400,
      esi: 788,
      status: 'pending'
    },
    {
      id: 'EMP006',
      name: 'David Martinez',
      designation: 'Backend Developer',
      department: 'Engineering',
      baseSalary: 68000,
      allowances: 13600,
      deductions: 7344,
      netSalary: 74256,
      tax: 10200,
      pf: 8160,
      esi: 1190,
      status: 'pending'
    },
    {
      id: 'EMP007',
      name: 'Lisa Anderson',
      designation: 'Marketing Manager',
      department: 'Marketing',
      baseSalary: 72000,
      allowances: 14400,
      deductions: 7776,
      netSalary: 78624,
      tax: 10800,
      pf: 8640,
      esi: 1260,
      status: 'pending'
    },
    {
      id: 'EMP008',
      name: 'Robert Chen',
      designation: 'Data Analyst',
      department: 'Analytics',
      baseSalary: 58000,
      allowances: 11600,
      deductions: 6264,
      netSalary: 63336,
      tax: 8700,
      pf: 6960,
      esi: 1015,
      status: 'pending'
    }
  ]);

  // Calculate summary statistics
  const payrollSummary = useMemo(() => {
    const processedEmployees = employees.filter(emp => emp.status === 'processed');
    const totalGross = employees.reduce((sum, emp) => sum + emp.baseSalary + emp.allowances, 0);
    const totalNet = employees.reduce((sum, emp) => sum + emp.netSalary, 0);
    const totalTax = employees.reduce((sum, emp) => sum + emp.tax, 0);
    const totalPF = employees.reduce((sum, emp) => sum + emp.pf, 0);
    
    return {
      totalEmployees: employees.length,
      processedEmployees: processedEmployees.length,
      pendingEmployees: employees.length - processedEmployees.length,
      totalGross,
      totalNet,
      totalDeductions: totalGross - totalNet,
      totalTax,
      totalPF,
      totalProfTax: employees.length * payrollConfig.profTax
    };
  }, [employees, payrollConfig]);

  // Export functions
  const exportToExcel = async () => {
    setIsProcessing(true);
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Employee salary sheet
      const salaryData = employees.map(emp => ({
        'Employee ID': emp.id,
        'Name': emp.name,
        'Designation': emp.designation,
        'Department': emp.department,
        'Base Salary': emp.baseSalary,
        'Allowances': emp.allowances,
        'Gross Salary': emp.baseSalary + emp.allowances,
        'Tax Deduction': emp.tax,
        'PF Deduction': emp.pf,
        'ESI Deduction': emp.esi,
        'Professional Tax': payrollConfig.profTax,
        'Total Deductions': emp.deductions,
        'Net Salary': emp.netSalary,
        'Status': emp.status.toUpperCase()
      }));
      
      const salarySheet = XLSX.utils.json_to_sheet(salaryData);
      XLSX.utils.book_append_sheet(workbook, salarySheet, 'Salary Details');
      
      // Summary sheet
      const summaryData = [
        { Metric: 'Total Employees', Value: payrollSummary.totalEmployees },
        { Metric: 'Processed Employees', Value: payrollSummary.processedEmployees },
        { Metric: 'Pending Employees', Value: payrollSummary.pendingEmployees },
        { Metric: 'Total Gross Salary', Value: payrollSummary.totalGross },
        { Metric: 'Total Net Salary', Value: payrollSummary.totalNet },
        { Metric: 'Total Deductions', Value: payrollSummary.totalDeductions },
        { Metric: 'Total Tax', Value: payrollSummary.totalTax },
        { Metric: 'Total PF', Value: payrollSummary.totalPF },
        { Metric: 'Total Professional Tax', Value: payrollSummary.totalProfTax }
      ];
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      const filename = `Payroll_${selectedMonth.replace(' ', '_')}_${Date.now()}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      toast({
        title: "✅ Export Successful",
        description: `Payroll data exported to ${filename}`,
      });
    } catch (error) {
      toast({
        title: "❌ Export Failed",
        description: "Failed to export payroll data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToPDF = async () => {
    setIsProcessing(true);
    
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Payroll Report', 20, 30);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Period: ${selectedMonth}`, 20, 45);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);
      
      // Summary section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, 75);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Employees: ${payrollSummary.totalEmployees}`, 20, 90);
      doc.text(`Total Gross: $${payrollSummary.totalGross.toLocaleString()}`, 20, 100);
      doc.text(`Total Net: $${payrollSummary.totalNet.toLocaleString()}`, 20, 110);
      doc.text(`Total Deductions: $${payrollSummary.totalDeductions.toLocaleString()}`, 20, 120);
      
      // Employee details table
      const tableData = employees.map(emp => [
        emp.id,
        emp.name,
        emp.department,
        `$${emp.baseSalary.toLocaleString()}`,
        `$${emp.allowances.toLocaleString()}`,
        `$${emp.deductions.toLocaleString()}`,
        `$${emp.netSalary.toLocaleString()}`,
        emp.status.toUpperCase()
      ]);
      
      autoTable(doc, {
        head: [['ID', 'Name', 'Department', 'Base Salary', 'Allowances', 'Deductions', 'Net Salary', 'Status']],
        body: tableData,
        startY: 140,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8, cellPadding: 2 }
      });
      
      const filename = `Payroll_Report_${selectedMonth.replace(' ', '_')}_${Date.now()}.pdf`;
      doc.save(filename);
      
      toast({
        title: "✅ PDF Generated",
        description: `Report saved as ${filename}`,
      });
    } catch (error) {
      toast({
        title: "❌ PDF Generation Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processPayroll = async () => {
    setProcessingDialogOpen(true);
    setProcessingStep(0);
    setProcessingComplete(false);
    setIsProcessing(true);
    
    try {
      // Step 1: Validating employee data
      setProcessingStep(1);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 2: Calculating salaries
      setProcessingStep(2);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 3: Processing deductions
      setProcessingStep(3);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 4: Generating payslips
      setProcessingStep(4);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 5: Finalizing
      setProcessingStep(5);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingComplete(true);
      
      toast({
        title: "✅ Payroll Processed Successfully",
        description: `${selectedMonth} payroll has been processed for ${employees.length} employees.`,
      });
    } catch (error) {
      toast({
        title: "❌ Processing Failed",
        description: "Failed to process payroll. Please try again.",
        variant: "destructive"
      });
      setProcessingDialogOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const viewPayslip = (employee: any) => {
    setSelectedEmployee(employee);
    setPayslipDialogOpen(true);
  };

  const downloadPayslip = (employee: any) => {
    const doc = new jsPDF();
    
    // Company header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYSLIP', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(selectedMonth, 105, 30, { align: 'center' });
    
    // Employee details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Details', 20, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Employee ID: ${employee.id}`, 20, 65);
    doc.text(`Name: ${employee.name}`, 20, 72);
    doc.text(`Designation: ${employee.designation}`, 20, 79);
    doc.text(`Department: ${employee.department}`, 20, 86);
    
    // Salary details table
    const earnings = [
      ['Basic Salary', `$${employee.baseSalary.toLocaleString()}`],
      ['Allowances', `$${employee.allowances.toLocaleString()}`],
      ['Gross Salary', `$${(employee.baseSalary + employee.allowances).toLocaleString()}`]
    ];
    
    const deductions = [
      ['Income Tax', `$${employee.tax.toLocaleString()}`],
      ['PF Contribution', `$${employee.pf.toLocaleString()}`],
      ['ESI', `$${employee.esi.toLocaleString()}`],
      ['Professional Tax', `$${payrollConfig.profTax}`],
      ['Total Deductions', `$${employee.deductions.toLocaleString()}`]
    ];
    
    autoTable(doc, {
      head: [['Earnings', 'Amount']],
      body: earnings,
      startY: 100,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 20, right: 110 }
    });
    
    autoTable(doc, {
      head: [['Deductions', 'Amount']],
      body: deductions,
      startY: 100,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
      margin: { left: 110, right: 20 }
    });
    
    // Net salary
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFillColor(59, 130, 246);
    doc.rect(20, finalY, 170, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Net Salary:', 30, finalY + 10);
    doc.text(`$${employee.netSalary.toLocaleString()}`, 160, finalY + 10, { align: 'right' });
    
    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('This is a computer-generated payslip. No signature required.', 105, 280, { align: 'center' });
    
    doc.save(`Payslip_${employee.id}_${selectedMonth.replace(' ', '_')}.pdf`);
    
    toast({
      title: "✅ Payslip Downloaded",
      description: `Payslip for ${employee.name} has been downloaded.`,
    });
  };

  const sendPayslipToEmployee = async (employee: any) => {
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "✅ Payslip Sent Successfully",
        description: `Payslip sent to ${employee.name} at ${employee.id.toLowerCase()}@company.com`,
      });
    } catch (error) {
      toast({
        title: "❌ Failed to Send",
        description: "Failed to send payslip. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk action handlers
  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    }
  };

  const sendBulkPayslips = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "⚠️ No Employees Selected",
        description: "Please select at least one employee to send payslips.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "✅ Bulk Payslips Sent",
        description: `Successfully sent payslips to ${selectedEmployees.length} employee${selectedEmployees.length > 1 ? 's' : ''}.`,
      });
      
      setSelectedEmployees([]);
    } catch (error) {
      toast({
        title: "❌ Failed to Send",
        description: "Failed to send bulk payslips. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadBulkPayslips = () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "⚠️ No Employees Selected",
        description: "Please select at least one employee to download payslips.",
        variant: "destructive"
      });
      return;
    }

    const selectedEmps = employees.filter(emp => selectedEmployees.includes(emp.id));
    selectedEmps.forEach(emp => downloadPayslip(emp));
    
    toast({
      title: "✅ Bulk Download Complete",
      description: `Downloaded ${selectedEmployees.length} payslip${selectedEmployees.length > 1 ? 's' : ''}.`,
    });
    
    setSelectedEmployees([]);
  };

  // Individual payroll processing
  const openIndividualPayroll = (employee: any) => {
    setProcessingEmployee(employee);
    setEditedSalary({
      baseSalary: employee.baseSalary,
      allowances: employee.allowances,
      tax: employee.tax,
      pf: employee.pf,
      esi: employee.esi,
      profTax: payrollConfig.profTax
    });
    setPaymentMethod('bank_transfer');
    setRemarks('');
    setProcessStep(1);
    setIndividualPayrollOpen(true);
  };

  const processIndividualPayroll = async () => {
    if (!processingEmployee) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update employee status to processed
      setEmployees(prev => prev.map(emp => 
        emp.id === processingEmployee.id 
          ? { 
              ...emp, 
              status: 'processed',
              baseSalary: editedSalary.baseSalary,
              allowances: editedSalary.allowances,
              tax: editedSalary.tax,
              pf: editedSalary.pf,
              esi: editedSalary.esi,
              netSalary: calculateIndividualNet(),
              deductions: editedSalary.tax + editedSalary.pf + editedSalary.esi + editedSalary.profTax
            }
          : emp
      ));
      
      toast({
        title: "✅ Payroll Processed Successfully",
        description: `Processed payroll for ${processingEmployee.name} via ${paymentMethod.replace('_', ' ').toUpperCase()} - $${calculateIndividualNet().toLocaleString()} paid`,
      });
      
      setIndividualPayrollOpen(false);
      setProcessingEmployee(null);
      setProcessStep(1);
      setRemarks('');
    } catch (error) {
      toast({
        title: "❌ Processing Failed",
        description: "Failed to process payroll. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateIndividualNet = () => {
    if (!editedSalary) return 0;
    const gross = editedSalary.baseSalary + editedSalary.allowances;
    const deductions = editedSalary.tax + editedSalary.pf + editedSalary.esi + editedSalary.profTax;
    return gross - deductions;
  };

  // Filtering logic
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           emp.designation.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDepartment = departmentFilter === 'all' || emp.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, searchQuery, departmentFilter, statusFilter]);

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(emp => emp.department)));
  }, [employees]);

  // Salary revision data
  const salaryRevisions = [
    {
      id: 'REV001',
      employeeId: 'EMP001',
      employeeName: 'John Smith',
      type: 'Annual Increment',
      previousSalary: 70000,
      newSalary: 75000,
      percentage: 7.14,
      effectiveDate: '01 Feb 2026',
      approvedBy: 'HR Manager',
      status: 'Applied'
    },
    {
      id: 'REV002',
      employeeId: 'EMP002',
      employeeName: 'Sarah Johnson',
      type: 'Promotion',
      previousSalary: 75000,
      newSalary: 85000,
      percentage: 13.33,
      effectiveDate: '01 Feb 2026',
      approvedBy: 'CEO',
      status: 'Applied'
    },
    {
      id: 'REV003',
      employeeId: 'EMP004',
      employeeName: 'Emily Davis',
      type: 'Performance Bonus',
      previousSalary: 65000,
      newSalary: 65000,
      percentage: 0,
      effectiveDate: '15 Feb 2026',
      approvedBy: 'Department Head',
      status: 'Pending'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden group">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent_50%)]" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Banknote className="h-6 w-6" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
              </div>
              <p className="text-blue-100 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Manage employee salaries, deductions, and statutory compliance
              </p>
              {payrollSummary.pendingEmployees > 0 && (
                <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm border border-amber-300/30 rounded-lg px-3 py-1.5 text-sm font-semibold animate-pulse">
                  <AlertCircle className="h-4 w-4 text-amber-200" />
                  <span className="text-amber-100">{payrollSummary.pendingEmployees} pending payment{payrollSummary.pendingEmployees > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Pay Period</span>
              </div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white backdrop-blur-sm hover:bg-white/20 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="February 2026">February 2026</SelectItem>
                  <SelectItem value="January 2026">January 2026</SelectItem>
                  <SelectItem value="December 2025">December 2025</SelectItem>
                  <SelectItem value="November 2025">November 2025</SelectItem>
                  <SelectItem value="October 2025">October 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Summary Cards with Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="group">
            <StatCard 
              title="Total Employees"
              value={payrollSummary.totalEmployees.toString()}
              icon={<Users className="h-5 w-5" />}
              color="blue"
              trend="up"
            />
          </div>
          <div className="group">
            <StatCard 
              title="Gross Payroll"
              value={`$${payrollSummary.totalGross.toLocaleString()}`}
              icon={<DollarSign className="h-5 w-5" />}
              color="emerald"
              trend="up"
            />
          </div>
          <div className="group">
            <StatCard 
              title="Net Payroll"
              value={`$${payrollSummary.totalNet.toLocaleString()}`}
              icon={<Banknote className="h-5 w-5" />}
              color="indigo"
              trend="up"
            />
          </div>
          <div className="group">
            <StatCard 
              title="Total Deductions"
              value={`$${payrollSummary.totalDeductions.toLocaleString()}`}
              icon={<Percent className="h-5 w-5" />}
              color="orange"
              trend="none"
            />
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:w-fit">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2 relative">
              <Clock className="h-4 w-4" />
              Pending Payments
              {payrollSummary.pendingEmployees > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white h-5 px-1.5 text-xs">
                  {payrollSummary.pendingEmployees}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employee Details
            </TabsTrigger>
            <TabsTrigger value="revisions" className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              Salary Revisions
            </TabsTrigger>
            <TabsTrigger value="statutory" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6">
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Payroll Summary - {selectedMonth}
                  </CardTitle>
                  <CardDescription>
                    Comprehensive overview of current payroll cycle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                      <div className="text-2xl font-bold text-emerald-700">
                        {payrollSummary.processedEmployees}
                      </div>
                      <div className="text-sm text-emerald-600">Processed</div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <div className="text-2xl font-bold text-amber-700">
                        {payrollSummary.pendingEmployees}
                      </div>
                      <div className="text-sm text-amber-600">Pending</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">
                        ${payrollSummary.totalNet.toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-600">Total Net Pay</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={processPayroll} 
                      disabled={isProcessing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isProcessing ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Calculator className="h-4 w-4 mr-2" />
                          Process Payroll
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={exportToExcel} disabled={isProcessing}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button variant="outline" onClick={exportToPDF} disabled={isProcessing}>
                      <Printer className="h-4 w-4 mr-2" />
                      Generate PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Payroll Calendar */}
              <Card className="rounded-xl border-slate-200 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-slate-900">Monthly Payroll Expenditure</div>
                        <div className="text-sm text-slate-600 font-normal mt-0.5">Track spending across months</div>
                      </div>
                    </CardTitle>
                    <Select defaultValue="2026" onValueChange={(value) => {
                      toast({
                        title: "Year Changed",
                        description: `Viewing payroll data for ${value}`,
                      });
                    }}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2026">2026</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Monthly Calendar Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {[
                      { month: 'January', amount: 548230, employees: 142, status: 'paid', trend: '+2.3%', color: 'emerald' },
                      { month: 'February', amount: 568716, employees: 145, status: 'current', trend: '+3.7%', color: 'blue' },
                      { month: 'March', amount: 0, employees: 145, status: 'upcoming', trend: 'Est.', color: 'slate' },
                      { month: 'April', amount: 0, employees: 145, status: 'upcoming', trend: 'Est.', color: 'slate' },
                      { month: 'May', amount: 0, employees: 145, status: 'upcoming', trend: 'Est.', color: 'slate' },
                      { month: 'June', amount: 0, employees: 145, status: 'upcoming', trend: 'Est.', color: 'slate' },
                      { month: 'July', amount: 0, employees: 145, status: 'upcoming', trend: 'Est.', color: 'slate' },
                      { month: 'August', amount: 0, employees: 145, status: 'upcoming', trend: 'Est.', color: 'slate' },
                      { month: 'September', amount: 0, employees: 145, status: 'upcoming', trend: 'Est.', color: 'slate' },
                      { month: 'October', amount: 0, employees: 145, status: 'upcoming', trend: 'Est.', color: 'slate' },
                      { month: 'November', amount: 0, employees: 145, status: 'upcoming', trend: 'Est.', color: 'slate' },
                      { month: 'December', amount: 0, employees: 145, status: 'upcoming', trend: 'Est.', color: 'slate' },
                    ].map((monthData, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "relative p-5 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg",
                          monthData.status === 'paid' && "bg-emerald-50 border-emerald-200 hover:border-emerald-300",
                          monthData.status === 'current' && "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-md hover:border-blue-400",
                          monthData.status === 'upcoming' && "bg-slate-50 border-slate-200 hover:border-slate-300 opacity-60"
                        )}
                        onClick={() => {
                          if (monthData.status !== 'upcoming') {
                            toast({
                              title: `${monthData.month} 2026 Payroll`,
                              description: `Total spent: $${monthData.amount.toLocaleString()} for ${monthData.employees} employees`,
                            });
                          }
                        }}
                      >
                        {/* Status Badge */}
                        {monthData.status === 'current' && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-blue-600 text-white border-none text-[10px] px-2 py-0.5">
                              CURRENT
                            </Badge>
                          </div>
                        )}
                        {monthData.status === 'paid' && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          </div>
                        )}

                        {/* Month Name */}
                        <div className="mb-3">
                          <h4 className={cn(
                            "text-lg font-bold",
                            monthData.status === 'paid' && "text-emerald-900",
                            monthData.status === 'current' && "text-blue-900",
                            monthData.status === 'upcoming' && "text-slate-500"
                          )}>
                            {monthData.month}
                          </h4>
                          <p className="text-xs text-slate-500">2026</p>
                        </div>

                        {/* Amount */}
                        <div className="mb-3">
                          {monthData.status !== 'upcoming' ? (
                            <>
                              <div className={cn(
                                "text-2xl font-black mb-1",
                                monthData.status === 'paid' && "text-emerald-700",
                                monthData.status === 'current' && "text-blue-700"
                              )}>
                                ${monthData.amount.toLocaleString()}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-600">{monthData.employees} employees</span>
                                <Badge 
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] px-1.5 py-0",
                                    monthData.status === 'paid' && "border-emerald-300 text-emerald-700",
                                    monthData.status === 'current' && "border-blue-300 text-blue-700"
                                  )}
                                >
                                  {monthData.trend}
                                </Badge>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-2xl font-black text-slate-400 mb-1">
                                $---,---
                              </div>
                              <div className="text-xs text-slate-400">
                                {monthData.employees} employees (Est.)
                              </div>
                            </>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {monthData.status !== 'upcoming' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-600">
                              <span>Processed</span>
                              <span>{monthData.status === 'current' ? '75%' : '100%'}</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  monthData.status === 'paid' && "bg-emerald-500",
                                  monthData.status === 'current' && "bg-blue-500"
                                )}
                                style={{ width: monthData.status === 'current' ? '75%' : '100%' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Year Summary */}
                  <div className="grid md:grid-cols-4 gap-4 p-5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                    <div className="text-center">
                      <div className="text-sm text-slate-600 mb-2">Year to Date</div>
                      <div className="text-3xl font-black text-slate-900">
                        ${(548230 + 568716).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">2 months</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-slate-600 mb-2">Average Monthly</div>
                      <div className="text-3xl font-black text-blue-700">
                        ${Math.round((548230 + 568716) / 2).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">per month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-slate-600 mb-2">Remaining 2026</div>
                      <div className="text-3xl font-black text-amber-700">
                        ${Math.round(((548230 + 568716) / 2) * 10).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">estimated</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-slate-600 mb-2">Projected Annual</div>
                      <div className="text-3xl font-black text-purple-700">
                        ${Math.round(((548230 + 568716) / 2) * 12).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">total 2026</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 mt-6">
                    <Button 
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        toast({
                          title: "Monthly Analysis",
                          description: "Generating detailed month-by-month payroll analysis...",
                        });
                        setTimeout(() => {
                          toast({
                            title: "Analysis Ready",
                            description: "Total YTD: $1,116,946 | Avg: $558,473/month",
                          });
                        }, 1000);
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Trends
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => {
                        const monthlyData = [
                          ['Month', 'Amount', 'Employees', 'Status'],
                          ['January 2026', '$548,230', '142', 'Paid'],
                          ['February 2026', '$568,716', '145', 'Current'],
                        ];
                        toast({
                          title: "Export Complete",
                          description: "Monthly payroll data exported to Excel successfully.",
                        });
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Monthly Data
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => {
                        toast({
                          title: "Forecast Generated",
                          description: "Projected annual payroll: $6,701,676 based on current trends",
                        });
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Generate Forecast
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => {
                        toast({
                          title: "Comparison Report",
                          description: "Comparing February vs January: +3.7% increase ($20,486)",
                        });
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Compare Months
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pending Payments Tab */}
          <TabsContent value="pending" className="mt-6">
            <div className="grid gap-6">
              {/* Header Section */}
              <Card className="rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-amber-200 shadow-lg overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-3xl" />
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 text-amber-900">
                        <div className="p-2 bg-amber-600 rounded-xl shadow-lg shadow-amber-600/30">
                          <Clock className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">Pending Payroll Payments</div>
                          <div className="text-sm text-amber-700 font-normal mt-1">Ready for processing</div>
                        </div>
                      </CardTitle>
                      <CardDescription className="text-amber-700 mt-3 flex items-center gap-2">
                        <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                        Click on any employee to process their individual payroll payment
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-amber-600/30">
                        <AlertCircle className="h-6 w-6" />
                        <div>
                          <div className="text-3xl font-bold">{payrollSummary.pendingEmployees}</div>
                          <div className="text-xs text-amber-100">Awaiting Payment</div>
                        </div>
                      </div>
                      <div className="text-xs text-amber-600 font-semibold">
                        Last updated: Just now
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-amber-900">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="text-xs text-amber-600 font-medium">Total Pending Amount</div>
                          <div className="text-2xl font-bold text-amber-700">
                            ${employees
                              .filter(emp => emp.status === 'pending')
                              .reduce((sum, emp) => sum + emp.netSalary, 0)
                              .toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="h-12 w-px bg-amber-300" />
                      <div className="flex-1">
                        <div className="text-xs text-amber-700 font-medium mb-2">Processing Options</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-white border-amber-300 text-amber-700">
                            Individual Payment
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-white border-amber-300 text-amber-700">
                            Bulk Processing
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Employees Queue */}
              <Card className="rounded-2xl border-slate-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        Payment Queue
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Click on an employee card to start the payment process
                      </CardDescription>
                    </div>
                    <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                      {employees.filter(emp => emp.status === 'pending').length} in queue
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {employees.filter(emp => emp.status === 'pending').length === 0 ? (
                    <div className="text-center py-16 animate-in fade-in zoom-in duration-500">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-xl shadow-green-500/30 animate-bounce">
                        <CheckCircle2 className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">All Payments Processed!</h3>
                      <p className="text-slate-600 mb-4">
                        There are no pending payroll payments for {selectedMonth}
                      </p>
                      <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">100% Complete</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {employees
                        .filter(emp => emp.status === 'pending')
                        .map((employee, index) => (
                          <div
                            key={employee.id}
                            onClick={() => openIndividualPayroll(employee)}
                            className="group relative bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl p-6 border-2 border-slate-200 hover:border-teal-400 hover:shadow-2xl hover:shadow-teal-200/50 transition-all duration-500 cursor-pointer animate-in slide-in-from-bottom-8 fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            {/* Hover Glow Effect */}
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-600/0 via-emerald-600/0 to-teal-600/0 group-hover:from-teal-600/5 group-hover:via-emerald-600/5 group-hover:to-teal-600/5 transition-all duration-500" />
                            
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4 z-10">
                              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 font-bold shadow-lg shadow-amber-500/30 animate-pulse">
                                ⏳ Pending
                              </Badge>
                            </div>

                            {/* Employee Info */}
                            <div className="mb-5 relative z-10">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-purple-500/40 group-hover:scale-110 transition-transform duration-300">
                                  {employee.name.split(' ').map(n => n[0]).join('')}
                                  <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-purple-600 transition-colors duration-300 leading-tight">
                                    {employee.name}
                                  </h3>
                                  <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1">
                                    <span className="inline-block h-1.5 w-1.5 bg-slate-400 rounded-full" />
                                    {employee.id}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <p className="text-sm text-slate-700 font-semibold">{employee.designation}</p>
                                <Badge variant="outline" className="text-xs border-slate-300 bg-slate-50">
                                  {employee.department}
                                </Badge>
                              </div>
                            </div>

                            {/* Salary Breakdown */}
                            <div className="space-y-2.5 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-4 mb-5 border border-slate-200 relative z-10 group-hover:border-purple-200 transition-colors duration-300">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 flex items-center gap-1.5">
                                  <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                                  Gross Salary
                                </span>
                                <span className="font-bold text-slate-900">
                                  ${(employee.baseSalary + employee.allowances).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 flex items-center gap-1.5">
                                  <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                                  Deductions
                                </span>
                                <span className="font-bold text-red-600">
                                  -${employee.deductions.toLocaleString()}
                                </span>
                              </div>
                              <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent my-2" />
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-700">Net Payable</span>
                                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                  ${employee.netSalary.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {/* Process Button */}
                            <Button 
                              className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-all duration-300 h-11 rounded-xl relative z-10 overflow-hidden group/btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openIndividualPayroll(employee);
                              }}
                            >
                              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                              <CircleDollarSign className="h-4 w-4 mr-2" />
                              Process Payment
                              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border-slate-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
                        <AlertCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg mb-1">Need to process all at once?</h4>
                        <p className="text-sm text-slate-600">
                          You can also process multiple payments together using bulk payroll processing
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-white border-blue-200 text-blue-700">
                            <Clock className="h-3 w-3 mr-1" />
                            Faster Processing
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-white border-emerald-200 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Auto-verify
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={processPayroll}
                      className="whitespace-nowrap border-2 border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 font-bold shadow-sm hover:shadow-lg h-11 px-6 rounded-xl group"
                    >
                      <Calculator className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                      Bulk Process All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Employee Details Tab */}
          <TabsContent value="employees" className="mt-6">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Employee Salary Details</CardTitle>
                <CardDescription>
                  Detailed breakdown of individual employee salaries and deductions with advanced filtering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by name, ID, or designation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10"
                    />
                  </div>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  {(searchQuery || departmentFilter !== 'all' || statusFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearchQuery('');
                        setDepartmentFilter('all');
                        setStatusFilter('all');
                      }}
                      className="w-full md:w-auto"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Bulk Actions */}
                {selectedEmployees.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">
                        {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={downloadBulkPayslips}
                        className="bg-white hover:bg-blue-50"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download All
                      </Button>
                      <Button
                        size="sm"
                        onClick={sendBulkPayslips}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send All Payslips
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedEmployees([])}
                        className="hover:bg-blue-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Results Count */}
                <div className="text-sm text-slate-600">
                  Showing {filteredEmployees.length} of {employees.length} employees
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={toggleSelectAll}
                          >
                            {selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0 ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Base Salary</TableHead>
                        <TableHead className="text-right">Allowances</TableHead>
                        <TableHead className="text-right">Deductions</TableHead>
                        <TableHead className="text-right">Net Salary</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                            No employees found matching your filters
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEmployees.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toggleEmployeeSelection(employee.id)}
                              >
                                {selectedEmployees.includes(employee.id) ? (
                                  <CheckSquare className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{employee.name}</div>
                                <div className="text-sm text-slate-500">{employee.designation}</div>
                              </div>
                            </TableCell>
                            <TableCell>{employee.department}</TableCell>
                            <TableCell className="text-right">${employee.baseSalary.toLocaleString()}</TableCell>
                            <TableCell className="text-right">${employee.allowances.toLocaleString()}</TableCell>
                            <TableCell className="text-right">${employee.deductions.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-bold">${employee.netSalary.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge 
                                className={employee.status === 'processed' 
                                  ? 'bg-emerald-100 text-emerald-700 border-none' 
                                  : 'bg-amber-100 text-amber-700 border-none'
                                }
                              >
                                {employee.status === 'processed' ? 'Processed' : 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openIndividualPayroll(employee)}
                                  className="h-8 hover:bg-purple-50 hover:text-purple-700"
                                  title="Process Payroll"
                                >
                                  <Calculator className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => viewPayslip(employee)}
                                  className="h-8 hover:bg-blue-50 hover:text-blue-700"
                                  title="View Payslip"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => downloadPayslip(employee)}
                                  className="h-8 hover:bg-green-50 hover:text-green-700"
                                  title="Download Payslip"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => sendPayslipToEmployee(employee)}
                                  disabled={isProcessing}
                                  className="h-8 hover:bg-indigo-50 hover:text-indigo-700"
                                  title="Send Payslip"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Salary Revisions Tab */}
          <TabsContent value="revisions" className="mt-6">
            <Card className="rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowUpCircle className="h-5 w-5 text-green-600" />
                      Salary Revisions & Increments
                    </CardTitle>
                    <CardDescription>
                      Track salary adjustments, promotions, and performance bonuses
                    </CardDescription>
                  </div>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setShowRevisionDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Revision
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Revision ID</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Previous Salary</TableHead>
                        <TableHead className="text-right">New Salary</TableHead>
                        <TableHead className="text-right">Change</TableHead>
                        <TableHead>Effective Date</TableHead>
                        <TableHead>Approved By</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salaryRevisions.map((revision) => (
                        <TableRow key={revision.id}>
                          <TableCell className="font-medium">{revision.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{revision.employeeName}</div>
                              <div className="text-sm text-slate-500">{revision.employeeId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                              {revision.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            ${revision.previousSalary.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-700">
                            ${revision.newSalary.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {revision.percentage > 0 && (
                                <>
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                  <span className="font-semibold text-green-600">
                                    +{revision.percentage.toFixed(2)}%
                                  </span>
                                </>
                              )}
                              {revision.percentage === 0 && (
                                <span className="text-slate-500">No change</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {revision.effectiveDate}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">{revision.approvedBy}</TableCell>
                          <TableCell>
                            <Badge 
                              className={revision.status === 'Applied' 
                                ? 'bg-emerald-100 text-emerald-700 border-none' 
                                : 'bg-amber-100 text-amber-700 border-none'
                              }
                            >
                              {revision.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Revision Summary */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Total Revisions (Feb 2026)</div>
                    <div className="text-2xl font-bold text-green-700 mt-1">3</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Average Increment</div>
                    <div className="text-2xl font-bold text-blue-700 mt-1">6.82%</div>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="text-sm text-indigo-600 font-medium">Total Impact on Payroll</div>
                    <div className="text-2xl font-bold text-indigo-700 mt-1">+$15,000</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statutory Compliance Tab */}
          <TabsContent value="statutory" className="mt-6">
            <div className="space-y-6">
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Statutory Compliance Summary
                  </CardTitle>
                  <CardDescription>
                    Tax and statutory deduction details for government compliance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-lg font-bold text-blue-700">
                          ${payrollSummary.totalTax.toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-600">Total Income Tax (TDS)</div>
                        <div className="text-xs text-blue-500 mt-1">Avg: 16% of gross</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-lg font-bold text-green-700">
                          ${payrollSummary.totalPF.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-600">Total PF (Employee)</div>
                        <div className="text-xs text-green-500 mt-1">12% of basic</div>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-lg">
                        <div className="text-lg font-bold text-emerald-700">
                          ${payrollSummary.totalPF.toLocaleString()}
                        </div>
                        <div className="text-sm text-emerald-600">Total PF (Employer)</div>
                        <div className="text-xs text-emerald-500 mt-1">12% of basic</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-lg font-bold text-purple-700">
                          ${payrollSummary.totalProfTax.toLocaleString()}
                        </div>
                        <div className="text-sm text-purple-600">Professional Tax</div>
                        <div className="text-xs text-purple-500 mt-1">Fixed: $200/emp</div>
                      </div>
                    </div>

                    {/* Compliance Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border border-green-200 bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-green-900">PF Compliance</span>
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="text-xs text-green-700">
                          <div>✓ ECR filed for January 2026</div>
                          <div>✓ Payment deposited on time</div>
                          <div className="mt-2 font-semibold">Next Due: 15 Mar 2026</div>
                        </div>
                      </div>

                      <div className="border border-green-200 bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-green-900">TDS Compliance</span>
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="text-xs text-green-700">
                          <div>✓ TDS challan paid for Jan</div>
                          <div>✓ Form 24Q ready</div>
                          <div className="mt-2 font-semibold">Next Due: 07 Mar 2026</div>
                        </div>
                      </div>

                      <div className="border border-amber-200 bg-amber-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-amber-900">ESI Compliance</span>
                          <Calendar className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="text-xs text-amber-700">
                          <div>⚠ Return filing pending</div>
                          <div>✓ Contributions calculated</div>
                          <div className="mt-2 font-semibold text-amber-800">Due: 10 Feb 2026</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead className="text-right">Income Tax (TDS)</TableHead>
                            <TableHead className="text-right">PF (Employee)</TableHead>
                            <TableHead className="text-right">PF (Employer)</TableHead>
                            <TableHead className="text-right">ESI</TableHead>
                            <TableHead className="text-right">Prof. Tax</TableHead>
                            <TableHead className="text-right">Total Statutory</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.map((employee) => (
                            <TableRow key={employee.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{employee.name}</div>
                                  <div className="text-sm text-slate-500">{employee.id}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">${employee.tax.toLocaleString()}</TableCell>
                              <TableCell className="text-right">${employee.pf.toLocaleString()}</TableCell>
                              <TableCell className="text-right">${employee.pf.toLocaleString()}</TableCell>
                              <TableCell className="text-right">${employee.esi.toLocaleString()}</TableCell>
                              <TableCell className="text-right">${payrollConfig.profTax}</TableCell>
                              <TableCell className="text-right font-bold">
                                ${(employee.tax + employee.pf * 2 + employee.esi + payrollConfig.profTax).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    Upcoming Compliance Deadlines
                  </CardTitle>
                  <CardDescription>
                    Important filing and payment dates for statutory obligations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-orange-900">ESI Return Filing</div>
                          <div className="text-sm text-orange-700">Form ESI Challan</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-orange-700">10 Feb 2026</div>
                        <div className="text-xs text-orange-600">4 days remaining</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">TDS Payment (24Q)</div>
                          <div className="text-sm text-slate-600">Quarterly TDS Return</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-700">07 Mar 2026</div>
                        <div className="text-xs text-slate-500">29 days remaining</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">PF ECR Filing</div>
                          <div className="text-sm text-slate-600">Monthly PF Return</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-700">15 Mar 2026</div>
                        <div className="text-xs text-slate-500">37 days remaining</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-6">
            <div className="grid gap-6">
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle>Generate Reports</CardTitle>
                  <CardDescription>
                    Export payroll data in various formats for compliance and record-keeping
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">Excel Report</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            Detailed spreadsheet with all salary components and calculations
                          </p>
                          <Button 
                            className="mt-3" 
                            variant="outline" 
                            onClick={exportToExcel}
                            disabled={isProcessing}
                          >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Export Excel
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Printer className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">PDF Report</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            Professional formatted report suitable for official documentation
                          </p>
                          <Button 
                            className="mt-3" 
                            variant="outline" 
                            onClick={exportToPDF}
                            disabled={isProcessing}
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Generate PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payslip Preview Dialog */}
      <Dialog open={payslipDialogOpen} onOpenChange={setPayslipDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              Payslip - {selectedEmployee?.name}
            </DialogTitle>
            <DialogDescription>
              Salary details for February 2026
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6">
              {/* Company Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg">
                <h2 className="text-2xl font-bold">TechVision Solutions</h2>
                <p className="text-blue-100 mt-1">Monthly Salary Statement</p>
              </div>

              {/* Employee Details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-slate-600">Employee Name</p>
                  <p className="font-medium">{selectedEmployee.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Employee ID</p>
                  <p className="font-medium">{selectedEmployee.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Designation</p>
                  <p className="font-medium">{selectedEmployee.designation}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Department</p>
                  <p className="font-medium">{selectedEmployee.department}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Pay Period</p>
                  <p className="font-medium">February 2026</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Payment Date</p>
                  <p className="font-medium">28th February 2026</p>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earnings */}
                <div>
                  <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Earnings
                  </h3>
                  <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-sm">Basic Salary</span>
                      <span className="font-medium">${selectedEmployee.baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Allowances</span>
                      <span className="font-medium">${selectedEmployee.allowances.toLocaleString()}</span>
                    </div>
                    <div className="border-t-2 border-green-200 pt-2 mt-2">
                      <div className="flex justify-between font-bold text-green-700">
                        <span>Gross Salary</span>
                        <span>${(selectedEmployee.baseSalary + selectedEmployee.allowances).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Deductions
                  </h3>
                  <div className="space-y-2 bg-red-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-sm">Income Tax</span>
                      <span className="font-medium">${selectedEmployee.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Provident Fund</span>
                      <span className="font-medium">${selectedEmployee.pf.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">ESI</span>
                      <span className="font-medium">${selectedEmployee.esi.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Professional Tax</span>
                      <span className="font-medium">${payrollConfig.profTax.toLocaleString()}</span>
                    </div>
                    <div className="border-t-2 border-red-200 pt-2 mt-2">
                      <div className="flex justify-between font-bold text-red-700">
                        <span>Total Deductions</span>
                        <span>${selectedEmployee.deductions.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-blue-100 text-sm">Net Salary (Take Home)</p>
                    <p className="text-3xl font-bold mt-1">${selectedEmployee.netSalary.toLocaleString()}</p>
                  </div>
                  <CheckCircle2 className="h-12 w-12 text-blue-200" />
                </div>
              </div>

              {/* Footer */}
              <div className="text-xs text-slate-500 text-center border-t pt-4">
                <p>This is a system-generated payslip and does not require a signature.</p>
                <p className="mt-1">For any queries, please contact HR Department: hr@techvision.com</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => downloadPayslip(selectedEmployee)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => {
                    sendPayslipToEmployee(selectedEmployee);
                    setPayslipDialogOpen(false);
                  }}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send via Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Salary Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
              Create New Salary Revision
            </DialogTitle>
            <DialogDescription>
              Submit a salary revision request for employee promotion, increment, or adjustment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employee-select">Select Employee</Label>
              <Select>
                <SelectTrigger id="employee-select">
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} - {emp.id} ({emp.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Revision Type */}
            <div className="space-y-2">
              <Label htmlFor="revision-type">Revision Type</Label>
              <Select>
                <SelectTrigger id="revision-type">
                  <SelectValue placeholder="Select revision type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual-increment">Annual Increment</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="performance-bonus">Performance Bonus</SelectItem>
                  <SelectItem value="market-adjustment">Market Adjustment</SelectItem>
                  <SelectItem value="cost-of-living">Cost of Living Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Current and New Salary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-salary">Current Salary ($)</Label>
                <Input
                  id="current-salary"
                  type="number"
                  placeholder="65000"
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">Current monthly salary</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-salary">New Salary ($)</Label>
                <Input
                  id="new-salary"
                  type="number"
                  placeholder="70000"
                />
                <p className="text-xs text-slate-500">Proposed new salary</p>
              </div>
            </div>

            {/* Percentage Increase (Auto-calculated) */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Salary Increase</p>
                  <p className="text-2xl font-bold text-green-700">+7.69%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Additional Amount</p>
                  <p className="text-xl font-bold text-green-700">$5,000</p>
                </div>
              </div>
            </div>

            {/* Effective Date */}
            <div className="space-y-2">
              <Label htmlFor="effective-date">Effective Date</Label>
              <Input
                id="effective-date"
                type="date"
                defaultValue="2026-03-01"
              />
              <p className="text-xs text-slate-500">Date when the salary revision takes effect</p>
            </div>

            {/* Reason/Justification */}
            <div className="space-y-2">
              <Label htmlFor="revision-reason">Reason for Revision</Label>
              <Textarea
                id="revision-reason"
                placeholder="Provide justification for the salary revision (e.g., exceptional performance, market competitiveness, role expansion)"
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-slate-500">Minimum 20 characters required</p>
            </div>

            {/* Approver Selection */}
            <div className="space-y-2">
              <Label htmlFor="approver">Approver</Label>
              <Select>
                <SelectTrigger id="approver">
                  <SelectValue placeholder="Select approver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sarah-johnson">Sarah Johnson - HR Director</SelectItem>
                  <SelectItem value="michael-chen">Michael Chen - CFO</SelectItem>
                  <SelectItem value="david-wilson">David Wilson - CEO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Supporting Documents */}
            <div className="space-y-2">
              <Label>Supporting Documents (Optional)</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-blue-50 rounded-full">
                    <FileCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Upload Documents</p>
                    <p className="text-xs text-slate-500 mt-1">Performance reviews, market research, or other supporting files</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Choose Files
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowRevisionDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  toast({
                    title: "Draft Saved",
                    description: "Salary revision draft has been saved. You can continue editing later.",
                  });
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  toast({
                    title: "Revision Submitted!",
                    description: "Salary revision request has been submitted for approval.",
                  });
                  setShowRevisionDialog(false);
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payroll Processing Dialog */}
      <Dialog open={processingDialogOpen} onOpenChange={setProcessingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              {processingComplete ? 'Payroll Processing Complete' : 'Processing Payroll'}
            </DialogTitle>
            <DialogDescription>
              {processingComplete 
                ? `Successfully processed payroll for ${selectedMonth}` 
                : 'Please wait while we process the payroll for all employees'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Processing Steps */}
            <div className="space-y-4">
              {/* Step 1: Validation */}
              <div className={`flex items-start gap-4 p-4 rounded-lg border ${
                processingStep >= 1 ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  processingStep > 1 ? 'bg-green-500 text-white' : 
                  processingStep === 1 ? 'bg-blue-500 text-white animate-pulse' : 
                  'bg-slate-300 text-slate-500'
                }`}>
                  {processingStep > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">Validating Employee Data</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Checking employment status, bank details, and tax information
                  </p>
                  {processingStep >= 1 && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      ✓ {employees.length} employees validated • 0 errors found
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Salary Calculation */}
              <div className={`flex items-start gap-4 p-4 rounded-lg border ${
                processingStep >= 2 ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  processingStep > 2 ? 'bg-green-500 text-white' : 
                  processingStep === 2 ? 'bg-blue-500 text-white animate-pulse' : 
                  'bg-slate-300 text-slate-500'
                }`}>
                  {processingStep > 2 ? <CheckCircle2 className="h-5 w-5" /> : '2'}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">Calculating Salaries</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Computing base salary, allowances, and overtime payments
                  </p>
                  {processingStep >= 2 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs text-blue-600 font-medium">
                        ✓ Total Gross Salary: ${payrollSummary.totalGross.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        Example: John Smith - Base: $75,000 + Allowances: $15,000 = $90,000
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Deductions */}
              <div className={`flex items-start gap-4 p-4 rounded-lg border ${
                processingStep >= 3 ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  processingStep > 3 ? 'bg-green-500 text-white' : 
                  processingStep === 3 ? 'bg-blue-500 text-white animate-pulse' : 
                  'bg-slate-300 text-slate-500'
                }`}>
                  {processingStep > 3 ? <CheckCircle2 className="h-5 w-5" /> : '3'}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">Processing Deductions</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Calculating tax, PF, ESI, and other statutory deductions
                  </p>
                  {processingStep >= 3 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs text-blue-600 font-medium">
                        ✓ Total Deductions: ${payrollSummary.totalDeductions.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 space-y-0.5">
                        <div>• Income Tax: ${payrollSummary.totalTax.toLocaleString()}</div>
                        <div>• PF: ${payrollSummary.totalPF.toLocaleString()}</div>
                        <div>• Professional Tax: ${payrollSummary.totalProfTax.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4: Payslip Generation */}
              <div className={`flex items-start gap-4 p-4 rounded-lg border ${
                processingStep >= 4 ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  processingStep > 4 ? 'bg-green-500 text-white' : 
                  processingStep === 4 ? 'bg-blue-500 text-white animate-pulse' : 
                  'bg-slate-300 text-slate-500'
                }`}>
                  {processingStep > 4 ? <CheckCircle2 className="h-5 w-5" /> : '4'}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">Generating Payslips</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Creating detailed payslips for each employee
                  </p>
                  {processingStep >= 4 && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      ✓ {employees.length} payslips generated successfully
                    </div>
                  )}
                </div>
              </div>

              {/* Step 5: Finalization */}
              <div className={`flex items-start gap-4 p-4 rounded-lg border ${
                processingStep >= 5 ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  processingStep >= 5 ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-500'
                }`}>
                  {processingStep >= 5 ? <CheckCircle2 className="h-5 w-5" /> : '5'}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">Finalizing & Recording</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Updating records and preparing for disbursement
                  </p>
                  {processingStep >= 5 && (
                    <div className="mt-2 text-xs text-green-600 font-medium">
                      ✓ Payroll processing complete and recorded
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Card */}
            {processingComplete && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-900">Processing Complete!</h3>
                    <p className="text-sm text-green-700">Ready for final approval and disbursement</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-slate-600">Total Employees</div>
                    <div className="text-lg font-bold text-slate-900">{employees.length}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-slate-600">Net Payable</div>
                    <div className="text-lg font-bold text-green-700">
                      ${payrollSummary.totalNet.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              {processingComplete ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setProcessingDialogOpen(false);
                      setProcessingStep(0);
                      setProcessingComplete(false);
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      exportToExcel();
                      toast({
                        title: "📊 Exporting Payroll Data",
                        description: "Generating detailed Excel report..."
                      });
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </>
              ) : (
                <Button variant="outline" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Processing...
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Payroll Processing Dialog */}
      <Dialog open={individualPayrollOpen} onOpenChange={setIndividualPayrollOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-600" />
              Process Individual Payroll - {processingEmployee?.name}
            </DialogTitle>
            <DialogDescription>
              Complete payroll processing for {processingEmployee?.designation} ({processingEmployee?.id})
            </DialogDescription>
          </DialogHeader>

          {processingEmployee && editedSalary && (
            <div className="space-y-6 py-4">
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-6">
                <div className={`flex items-center gap-2 ${processStep >= 1 ? 'text-purple-600' : 'text-slate-400'}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    processStep >= 1 ? 'bg-purple-600 text-white' : 'bg-slate-200'
                  }`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Review Details</span>
                </div>
                <div className="flex-1 h-px bg-slate-200 mx-4" />
                <div className={`flex items-center gap-2 ${processStep >= 2 ? 'text-purple-600' : 'text-slate-400'}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    processStep >= 2 ? 'bg-purple-600 text-white' : 'bg-slate-200'
                  }`}>
                    2
                  </div>
                  <span className="text-sm font-medium">Payment Method</span>
                </div>
                <div className="flex-1 h-px bg-slate-200 mx-4" />
                <div className={`flex items-center gap-2 ${processStep >= 3 ? 'text-purple-600' : 'text-slate-400'}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    processStep >= 3 ? 'bg-purple-600 text-white' : 'bg-slate-200'
                  }`}>
                    3
                  </div>
                  <span className="text-sm font-medium">Confirm & Process</span>
                </div>
              </div>

              {/* Step 1: Review & Edit Salary Details */}
              {processStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-slate-900 mb-4">Employee Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Employee ID:</span>
                        <span className="ml-2 font-medium">{processingEmployee.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Name:</span>
                        <span className="ml-2 font-medium">{processingEmployee.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Designation:</span>
                        <span className="ml-2 font-medium">{processingEmployee.designation}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Department:</span>
                        <span className="ml-2 font-medium">{processingEmployee.department}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Earnings */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-green-700 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Earnings (Editable)
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-slate-600">Base Salary</Label>
                          <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="number"
                              value={editedSalary.baseSalary}
                              onChange={(e) => setEditedSalary({...editedSalary, baseSalary: Number(e.target.value)})}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Allowances</Label>
                          <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="number"
                              value={editedSalary.allowances}
                              onChange={(e) => setEditedSalary({...editedSalary, allowances: Number(e.target.value)})}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-700 font-medium">Gross Salary</span>
                            <span className="text-lg font-bold text-green-700">
                              ${(editedSalary.baseSalary + editedSalary.allowances).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-red-700 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Deductions (Editable)
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-slate-600">Income Tax</Label>
                          <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="number"
                              value={editedSalary.tax}
                              onChange={(e) => setEditedSalary({...editedSalary, tax: Number(e.target.value)})}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">PF (Employee)</Label>
                          <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="number"
                              value={editedSalary.pf}
                              onChange={(e) => setEditedSalary({...editedSalary, pf: Number(e.target.value)})}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">ESI</Label>
                          <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="number"
                              value={editedSalary.esi}
                              onChange={(e) => setEditedSalary({...editedSalary, esi: Number(e.target.value)})}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Professional Tax</Label>
                          <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="number"
                              value={editedSalary.profTax}
                              onChange={(e) => setEditedSalary({...editedSalary, profTax: Number(e.target.value)})}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-red-700 font-medium">Total Deductions</span>
                            <span className="text-lg font-bold text-red-700">
                              ${(editedSalary.tax + editedSalary.pf + editedSalary.esi + editedSalary.profTax).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Net Salary */}
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-purple-100 text-sm">Net Take Home Salary</div>
                        <div className="text-4xl font-bold mt-1">${calculateIndividualNet().toLocaleString()}</div>
                        <div className="text-purple-100 text-xs mt-2">
                          Gross - Deductions = ${(editedSalary.baseSalary + editedSalary.allowances).toLocaleString()} - ${(editedSalary.tax + editedSalary.pf + editedSalary.esi + editedSalary.profTax).toLocaleString()}
                        </div>
                      </div>
                      <CheckCircle2 className="h-16 w-16 text-purple-200" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {processStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Select Payment Method</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        onClick={() => setPaymentMethod('bank_transfer')}
                        className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'bank_transfer'
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${
                            paymentMethod === 'bank_transfer' ? 'bg-purple-600' : 'bg-slate-100'
                          }`}>
                            <Building2 className={`h-6 w-6 ${
                              paymentMethod === 'bank_transfer' ? 'text-white' : 'text-slate-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">Bank Transfer</h4>
                            <p className="text-sm text-slate-600 mt-1">
                              Direct deposit to employee bank account
                            </p>
                            <div className="mt-3 text-xs text-slate-500">
                              Processing time: 1-2 business days
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => setPaymentMethod('check')}
                        className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'check'
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${
                            paymentMethod === 'check' ? 'bg-purple-600' : 'bg-slate-100'
                          }`}>
                            <FileCheck className={`h-6 w-6 ${
                              paymentMethod === 'check' ? 'text-white' : 'text-slate-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">Check Payment</h4>
                            <p className="text-sm text-slate-600 mt-1">
                              Issue physical or digital check
                            </p>
                            <div className="mt-3 text-xs text-slate-500">
                              Processing time: Immediate
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => setPaymentMethod('cash')}
                        className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'cash'
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${
                            paymentMethod === 'cash' ? 'bg-purple-600' : 'bg-slate-100'
                          }`}>
                            <Wallet className={`h-6 w-6 ${
                              paymentMethod === 'cash' ? 'text-white' : 'text-slate-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">Cash Payment</h4>
                            <p className="text-sm text-slate-600 mt-1">
                              Direct cash disbursement
                            </p>
                            <div className="mt-3 text-xs text-slate-500">
                              Processing time: Immediate
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => setPaymentMethod('digital_wallet')}
                        className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'digital_wallet'
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${
                            paymentMethod === 'digital_wallet' ? 'bg-purple-600' : 'bg-slate-100'
                          }`}>
                            <CreditCard className={`h-6 w-6 ${
                              paymentMethod === 'digital_wallet' ? 'text-white' : 'text-slate-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">Digital Wallet</h4>
                            <p className="text-sm text-slate-600 mt-1">
                              Transfer to PayPal, Venmo, etc.
                            </p>
                            <div className="mt-3 text-xs text-slate-500">
                              Processing time: Instant
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Remarks / Notes (Optional)</Label>
                    <Textarea
                      placeholder="Add any additional notes or comments for this payment..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {processStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Review & Confirm Payment
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Employee:</span>
                          <span className="ml-2 font-medium text-slate-900">{processingEmployee.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Employee ID:</span>
                          <span className="ml-2 font-medium text-slate-900">{processingEmployee.id}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Payment Method:</span>
                          <span className="ml-2 font-medium text-slate-900 capitalize">
                            {paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-600">Payment Date:</span>
                          <span className="ml-2 font-medium text-slate-900">{new Date().toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="border-t border-blue-200 pt-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-white p-3 rounded">
                            <div className="text-slate-600 text-xs">Gross Salary</div>
                            <div className="font-bold text-slate-900 mt-1">
                              ${(editedSalary.baseSalary + editedSalary.allowances).toLocaleString()}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded">
                            <div className="text-slate-600 text-xs">Total Deductions</div>
                            <div className="font-bold text-red-700 mt-1">
                              -${(editedSalary.tax + editedSalary.pf + editedSalary.esi + editedSalary.profTax).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-purple-100">Net Payable Amount</span>
                            <span className="text-2xl font-bold">${calculateIndividualNet().toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {remarks && (
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                          <div className="text-xs text-slate-600 mb-1">Remarks:</div>
                          <div className="text-sm text-slate-900">{remarks}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-semibold">Important: Please verify all details before confirming</p>
                        <p className="mt-1">This action will process the payroll and cannot be undone. Ensure all amounts and payment details are correct.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 justify-between pt-4 border-t">
                <div>
                  {processStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setProcessStep(processStep - 1)}
                    >
                      <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIndividualPayrollOpen(false);
                      setProcessStep(1);
                    }}
                  >
                    Cancel
                  </Button>
                  {processStep < 3 ? (
                    <Button
                      onClick={() => setProcessStep(processStep + 1)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Next Step
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={processIndividualPayroll}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Confirm & Process Payment
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  trend = 'none' 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  color: string; 
  trend?: 'up' | 'down' | 'none';
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
  };

  const bgGradientMap: Record<string, string> = {
    blue: "from-blue-50 to-blue-100/50",
    emerald: "from-emerald-50 to-emerald-100/50",
    indigo: "from-indigo-50 to-indigo-100/50",
    orange: "from-orange-50 to-orange-100/50",
  };

  return (
    <Card className="rounded-2xl border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden group cursor-pointer">
      <CardContent className="p-6 relative">
        {/* Animated background gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          bgGradientMap[color]
        )} />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-slate-600 font-medium">{title}</p>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          </div>
          <div className={cn(
            "p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
            colorMap[color]
          )}>
            {icon}
          </div>
        </div>
        {trend !== 'none' && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-semibold",
              trend === 'up' ? "text-emerald-600" : "text-red-600"
            )}>
              <TrendingUp className={cn("h-3.5 w-3.5", trend === 'down' && "rotate-180")} />
              <span>{trend === 'up' ? '+5.2%' : '-2.1%'} from last month</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
