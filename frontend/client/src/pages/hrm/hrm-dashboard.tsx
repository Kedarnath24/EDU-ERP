import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Users,
  Calendar,
  DollarSign,
  Shield,
  TrendingUp,
  FileText,
  Plane,
  Zap,
  UserCheck,
  Clock,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  Package
} from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function HRMDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState('');

  const kpiStats = [
    { title: 'Total Employees', value: '248', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50', gradient: 'from-blue-500/10 to-indigo-500/10' },
    { title: 'Active Now', value: '235', icon: UserCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-50', gradient: 'from-emerald-500/10 to-teal-500/10' },
    { title: 'On Leave', value: '12', icon: Calendar, color: 'text-amber-600', bgColor: 'bg-amber-50', gradient: 'from-amber-500/10 to-orange-500/10' },
    { title: 'Payroll', value: '$485K', icon: DollarSign, color: 'text-violet-600', bgColor: 'bg-violet-50', gradient: 'from-violet-500/10 to-purple-500/10' },
    { title: 'Pending', value: '18', icon: AlertCircle, color: 'text-rose-600', bgColor: 'bg-rose-50', gradient: 'from-rose-500/10 to-pink-500/10' }
  ];

  const hrmModules = [
    {
      icon: Users,
      title: 'Directory',
      description: 'Manage employee profiles, documents, and lifecycle',
      route: '/hrm/employees',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      accent: 'border-blue-200'
    },
    {
      icon: Calendar,
      title: 'Attendance',
      description: 'Track attendance, shifts, and manage leave requests',
      route: '/hrm/attendance',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      accent: 'border-emerald-200'
    },
    {
      icon: DollarSign,
      title: 'Payroll',
      description: 'Process salaries, statutory compliance, and payslips',
      route: '/hrm/payroll',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      accent: 'border-violet-200'
    },
    {
      icon: Shield,
      title: 'Insurance',
      description: 'Manage employee insurance policies and claims',
      route: '/hrm/insurance',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      accent: 'border-indigo-200'
    },
    {
      icon: Package,
      title: 'Assets',
      description: 'Track company assets, assignments, and inventory',
      route: '/hrm/assets',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      accent: 'border-blue-200'
    },
    {
      icon: GitBranch,
      title: 'Automation',
      description: 'Multi-stage approval processes and business logic',
      route: '/hrm/automation',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      accent: 'border-indigo-200'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">Management Hub</span>
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Human Resources</h1>
            <p className="text-slate-500 font-medium mt-1">Operational overview and strategic HR management</p>
          </div>
          <div className="flex items-center gap-3">

            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold px-6"
            >
              Create Request
            </Button>
          </div>
        </div>

        {/* High-Fidelity KPI Grid */}
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {kpiStats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", stat.gradient)} />
              <CardContent className="p-5 md:p-6 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110 duration-300 shadow-sm", stat.bgColor)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    <TrendingUp className="h-3 w-3" />
                    +4%
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs md:text-sm font-semibold text-slate-600 uppercase tracking-wide">{stat.title}</p>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modular Navigation Grid */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
              <Zap className="h-5 w-5 md:h-6 md:w-6 text-amber-500 fill-amber-500" />
              Core Modules
            </h2>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {hrmModules.map((module, index) => (
              <Card
                key={index}
                className={cn(
                  "group relative overflow-hidden cursor-pointer border-2 border-slate-200 hover:border-blue-300 transition-all duration-300",
                  "hover:shadow-xl hover:shadow-blue-100/50 hover:-translate-y-1"
                )}
                onClick={() => setLocation(module.route)}
              >
                <div className={cn("absolute top-0 left-0 w-1.5 h-full opacity-0 group-hover:opacity-100 transition-opacity", module.bgColor.replace('bg-', 'bg-').replace('50', '500'))} />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className={cn("p-3 rounded-2xl transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-sm", module.bgColor)}>
                      <module.icon className={cn("h-6 w-6 md:h-7 md:w-7", module.color)} />
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <CardTitle className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 leading-relaxed">
                    {module.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enhanced Insight Footer */}
        <div className="grid gap-6 md:grid-cols-3">
          <InsightCard
            title="Recent Activity"
            icon={<Activity className="h-4 w-4 text-blue-600" />}
            items={[
              { label: "5 New employees joined", detail: "View Profiles", type: "success" },
              { label: "18 Leave requests pending", detail: "Review Now", type: "warning" },
              { label: "Payroll January processed", detail: "Download Report", type: "info" }
            ]}
          />
          <InsightCard
            title="Upcoming Events"
            icon={<CalendarDays className="h-4 w-4 text-amber-600" />}
            items={[
              { label: "Performance Reviews", detail: "Jan 25, 2024", type: "info" },
              { label: "Insurance Policy Renewal", detail: "Feb 01, 2024", type: "info" },
              { label: "Quarterly Team Meeting", detail: "Jan 20, 2024", type: "info" }
            ]}
          />
          <InsightCard
            title="Compliance & Action"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            items={[
              { label: "Update Tax Documents", detail: "Critical", type: "danger" },
              { label: "Probation Confirmation", detail: "3 employees", type: "warning" },
              { label: "Insurance Card Printing", detail: "In Progress", type: "info" }
            ]}
          />
        </div>
      </div>

      {/* Create Request Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white">
            <DialogTitle className="text-3xl font-black flex items-center gap-2">
              <Sparkles className="h-7 w-7" />
              Create HR Request
            </DialogTitle>
            <DialogDescription className="text-blue-100 font-medium mt-2">
              Submit a new request for HR operations and employee services
            </DialogDescription>
          </div>

          <ScrollArea className="max-h-[calc(85vh-180px)]">
            <div className="p-8 space-y-6">
              {/* Request Type Selection */}
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase text-slate-400 ml-1">Request Type</Label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-14 font-bold text-base">
                    <SelectValue placeholder="Select what you need..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leave">Leave Application</SelectItem>
                    <SelectItem value="travel">Travel Request</SelectItem>
                    <SelectItem value="expense">Expense Claim</SelectItem>
                    <SelectItem value="certificate">Work Certificate</SelectItem>
                    <SelectItem value="advance">Salary Advance</SelectItem>
                    <SelectItem value="resignation">Resignation</SelectItem>
                    <SelectItem value="complaint">Complaint/Grievance</SelectItem>
                    <SelectItem value="other">Other Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Form Based on Request Type */}
              {requestType === 'leave' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-slate-400 ml-1">From Date</Label>
                      <Input id="leave-from" type="date" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-slate-400 ml-1">To Date</Label>
                      <Input id="leave-to" type="date" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Leave Type</Label>
                    <Select onValueChange={(val) => (document.getElementById('leave-type') as any).value = val}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold">
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="earned">Earned Leave</SelectItem>
                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                        <SelectItem value="paternity">Paternity Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" id="leave-type" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Reason</Label>
                    <Textarea id="leave-reason" placeholder="Brief description of your leave request..." className="rounded-xl bg-slate-50 border-slate-200 min-h-24 font-medium" />
                  </div>
                </div>
              )}

              {requestType === 'travel' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Destination</Label>
                    <Input id="travel-destination" placeholder="City, Country" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-slate-400 ml-1">Departure Date</Label>
                      <Input id="travel-from" type="date" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-slate-400 ml-1">Return Date</Label>
                      <Input id="travel-to" type="date" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Purpose</Label>
                    <Textarea id="travel-purpose" placeholder="Business purpose and expected outcomes..." className="rounded-xl bg-slate-50 border-slate-200 min-h-24 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Estimated Budget (USD)</Label>
                    <Input id="travel-budget" type="number" placeholder="0.00" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold" />
                  </div>
                </div>
              )}

              {requestType === 'expense' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Expense Category</Label>
                    <Select onValueChange={(val) => (document.getElementById('expense-category') as any).value = val}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="travel">Travel & Transport</SelectItem>
                        <SelectItem value="meals">Meals & Entertainment</SelectItem>
                        <SelectItem value="accommodation">Accommodation</SelectItem>
                        <SelectItem value="supplies">Office Supplies</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" id="expense-category" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Amount (USD)</Label>
                    <Input id="expense-amount" type="number" placeholder="0.00" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Description</Label>
                    <Textarea id="expense-description" placeholder="Describe the expense with details..." className="rounded-xl bg-slate-50 border-slate-200 min-h-24 font-medium" />
                  </div>
                </div>
              )}

              {requestType === 'certificate' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Certificate Type</Label>
                    <Select onValueChange={(val) => (document.getElementById('cert-type') as any).value = val}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold">
                        <SelectValue placeholder="Select certificate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employment">Employment Certificate</SelectItem>
                        <SelectItem value="experience">Experience Certificate</SelectItem>
                        <SelectItem value="salary">Salary Certificate</SelectItem>
                        <SelectItem value="noc">No Objection Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" id="cert-type" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Purpose</Label>
                    <Textarea id="cert-purpose" placeholder="Why do you need this certificate?" className="rounded-xl bg-slate-50 border-slate-200 min-h-24 font-medium" />
                  </div>
                </div>
              )}

              {requestType === 'advance' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Amount Required (USD)</Label>
                    <Input id="advance-amount" type="number" placeholder="0.00" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Repayment Installments</Label>
                    <Input id="advance-installments" type="number" placeholder="Number of months" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Reason</Label>
                    <Textarea id="advance-reason" placeholder="Explain why you need this advance..." className="rounded-xl bg-slate-50 border-slate-200 min-h-24 font-medium" />
                  </div>
                </div>
              )}

              {requestType === 'resignation' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Last Working Date</Label>
                    <Input id="resign-date" type="date" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Notice Period (Days)</Label>
                    <Input id="resign-notice" type="number" placeholder="e.g., 30, 60, 90" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Reason for Leaving</Label>
                    <Textarea id="resign-reason" placeholder="Optional: Share your feedback..." className="rounded-xl bg-slate-50 border-slate-200 min-h-24 font-medium" />
                  </div>
                </div>
              )}

              {requestType === 'complaint' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Category</Label>
                    <Select onValueChange={(val) => (document.getElementById('complaint-category') as any).value = val}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="harassment">Harassment</SelectItem>
                        <SelectItem value="discrimination">Discrimination</SelectItem>
                        <SelectItem value="workplace">Workplace Safety</SelectItem>
                        <SelectItem value="management">Management Issue</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" id="complaint-category" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Subject</Label>
                    <Input id="complaint-subject" placeholder="Brief subject line" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Details</Label>
                    <Textarea id="complaint-details" placeholder="Describe the situation in detail..." className="rounded-xl bg-slate-50 border-slate-200 min-h-32 font-medium" />
                  </div>
                </div>
              )}

              {requestType === 'other' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Subject</Label>
                    <Input id="other-subject" placeholder="What is your request about?" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Details</Label>
                    <Textarea id="other-details" placeholder="Describe your request in detail..." className="rounded-xl bg-slate-50 border-slate-200 min-h-32 font-medium" />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setRequestType('');
                  }}
                  className="flex-1 rounded-xl h-12 font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitRequest}
                  disabled={!requestType}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl h-12 font-bold shadow-lg shadow-blue-100"
                >
                  Submit Request
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );

  function handleSubmitRequest() {
    if (!requestType) {
      toast({
        title: "Validation Error",
        description: "Please select a request type first.",
        variant: "destructive"
      });
      return;
    }

    // Validation and submission logic based on request type
    let isValid = false;
    let requestId = '';
    let message = '';

    switch (requestType) {
      case 'leave':
        const leaveFrom = (document.getElementById('leave-from') as HTMLInputElement)?.value;
        const leaveTo = (document.getElementById('leave-to') as HTMLInputElement)?.value;
        const leaveType = (document.getElementById('leave-type') as HTMLInputElement)?.value;
        const leaveReason = (document.getElementById('leave-reason') as HTMLTextAreaElement)?.value;

        if (!leaveFrom || !leaveTo || !leaveType || !leaveReason) {
          toast({
            title: "Incomplete Form",
            description: "Please fill in all leave request fields.",
            variant: "destructive"
          });
          return;
        }

        requestId = `LV-${Date.now().toString().slice(-6)}`;
        message = `Leave application submitted for ${new Date(leaveFrom).toLocaleDateString()} to ${new Date(leaveTo).toLocaleDateString()}`;
        isValid = true;
        break;

      case 'travel':
        const travelDest = (document.getElementById('travel-destination') as HTMLInputElement)?.value;
        const travelFrom = (document.getElementById('travel-from') as HTMLInputElement)?.value;
        const travelTo = (document.getElementById('travel-to') as HTMLInputElement)?.value;
        const travelPurpose = (document.getElementById('travel-purpose') as HTMLTextAreaElement)?.value;

        if (!travelDest || !travelFrom || !travelTo || !travelPurpose) {
          toast({
            title: "Incomplete Form",
            description: "Please fill in all travel request fields.",
            variant: "destructive"
          });
          return;
        }

        requestId = `TRV-${Date.now().toString().slice(-6)}`;
        message = `Travel request to ${travelDest} submitted successfully`;
        isValid = true;
        break;

      case 'expense':
        const expenseCategory = (document.getElementById('expense-category') as HTMLInputElement)?.value;
        const expenseAmount = (document.getElementById('expense-amount') as HTMLInputElement)?.value;
        const expenseDesc = (document.getElementById('expense-description') as HTMLTextAreaElement)?.value;

        if (!expenseCategory || !expenseAmount || !expenseDesc || parseFloat(expenseAmount) <= 0) {
          toast({
            title: "Incomplete Form",
            description: "Please fill in all expense claim fields with valid amount.",
            variant: "destructive"
          });
          return;
        }

        requestId = `EXP-${Date.now().toString().slice(-6)}`;
        message = `Expense claim of $${expenseAmount} submitted for approval`;
        isValid = true;
        break;

      case 'certificate':
        const certType = (document.getElementById('cert-type') as HTMLInputElement)?.value;
        const certPurpose = (document.getElementById('cert-purpose') as HTMLTextAreaElement)?.value;

        if (!certType || !certPurpose) {
          toast({
            title: "Incomplete Form",
            description: "Please fill in all certificate request fields.",
            variant: "destructive"
          });
          return;
        }

        requestId = `CERT-${Date.now().toString().slice(-6)}`;
        message = `Certificate request submitted - will be processed in 2-3 business days`;
        isValid = true;
        break;

      case 'advance':
        const advAmount = (document.getElementById('advance-amount') as HTMLInputElement)?.value;
        const advInstallments = (document.getElementById('advance-installments') as HTMLInputElement)?.value;
        const advReason = (document.getElementById('advance-reason') as HTMLTextAreaElement)?.value;

        if (!advAmount || !advInstallments || !advReason || parseFloat(advAmount) <= 0) {
          toast({
            title: "Incomplete Form",
            description: "Please fill in all salary advance fields.",
            variant: "destructive"
          });
          return;
        }

        requestId = `ADV-${Date.now().toString().slice(-6)}`;
        message = `Salary advance request of $${advAmount} submitted for approval`;
        isValid = true;
        break;

      case 'resignation':
        const resignDate = (document.getElementById('resign-date') as HTMLInputElement)?.value;
        const resignNotice = (document.getElementById('resign-notice') as HTMLInputElement)?.value;

        if (!resignDate || !resignNotice) {
          toast({
            title: "Incomplete Form",
            description: "Please fill in last working date and notice period.",
            variant: "destructive"
          });
          return;
        }

        requestId = `RESIGN-${Date.now().toString().slice(-6)}`;
        message = `Resignation submitted - HR will contact you shortly`;
        isValid = true;
        break;

      case 'complaint':
        const complaintCategory = (document.getElementById('complaint-category') as HTMLInputElement)?.value;
        const complaintSubject = (document.getElementById('complaint-subject') as HTMLInputElement)?.value;
        const complaintDetails = (document.getElementById('complaint-details') as HTMLTextAreaElement)?.value;

        if (!complaintCategory || !complaintSubject || !complaintDetails) {
          toast({
            title: "Incomplete Form",
            description: "Please fill in all complaint/grievance fields.",
            variant: "destructive"
          });
          return;
        }

        requestId = `COMP-${Date.now().toString().slice(-6)}`;
        message = `Your complaint has been registered - ID: ${requestId}`;
        isValid = true;
        break;

      case 'other':
        const otherSubject = (document.getElementById('other-subject') as HTMLInputElement)?.value;
        const otherDetails = (document.getElementById('other-details') as HTMLTextAreaElement)?.value;

        if (!otherSubject || !otherDetails) {
          toast({
            title: "Incomplete Form",
            description: "Please provide subject and details for your request.",
            variant: "destructive"
          });
          return;
        }

        requestId = `REQ-${Date.now().toString().slice(-6)}`;
        message = `Your request has been submitted - ID: ${requestId}`;
        isValid = true;
        break;
    }

    if (isValid) {
      toast({
        title: "✅ Request Submitted Successfully",
        description: message,
        duration: 5000
      });

      setIsCreateDialogOpen(false);
      setRequestType('');

      // Clear all form fields
      const allInputs = document.querySelectorAll('input[type="text"], input[type="date"], input[type="number"], textarea, input[type="hidden"]');
      allInputs.forEach((input: any) => {
        if (input.id) input.value = '';
      });
    }
  }
}

function InsightCard({ title, icon, items }: { title: string, icon: React.ReactNode, items: any[] }) {
  return (
    <Card className="border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-slate-100/50">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-5 pb-5">
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-start gap-4 group/item cursor-pointer">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800 group-hover/item:text-blue-600 transition-colors">{item.label}</p>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    item.type === 'success' ? "bg-emerald-500" :
                      item.type === 'warning' ? "bg-amber-500" :
                        item.type === 'danger' ? "bg-rose-500" : "bg-blue-500"
                  )} />
                  <span className="text-[11px] font-semibold text-slate-500">{item.detail}</span>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover/item:opacity-100 group-hover/item:text-blue-600 transition-all" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
