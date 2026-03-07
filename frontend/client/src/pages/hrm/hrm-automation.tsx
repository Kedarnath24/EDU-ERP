import React, { useState, useMemo } from 'react';
// Force re-parse
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Zap, 
  Bell, 
  Mail, 
  Clock, 
  UserPlus, 
  FileText, 
  Calendar,
  ArrowRight,
  Plus,
  Play,
  Save,
  Trash2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Workflow,
  Sparkles,
  Search,
  ArrowLeft,
  MoreVertical,
  Activity,
  History,
  Timer,
  Pause,
  Copy,
  Layout,
  ExternalLink,
  GitBranch,
  Filter
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Shared StatCard component
const StatCard = ({ title, value, icon: Icon, description, trend, color }: any) => (
  <Card className="overflow-hidden border-none shadow-sm bg-white/50 backdrop-blur-md">
    <CardContent className="p-6">
      <div className="flex justify-between items-start text-slate-600">
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold mt-2 text-slate-900">{value}</h3>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function HRMAutomation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('workflows');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newTrigger, setNewTrigger] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Mock data - Workflows
  const [workflows, setWorkflows] = useState([
    {
      id: 'WF-001',
      name: 'New Employee Onboarding',
      description: 'Triggered when a new employee record is created',
      trigger: 'Employee Created',
      steps: 8,
      active: true,
      lastRun: '1 hour ago',
      category: 'Onboarding'
    },
    {
      id: 'WF-002',
      name: 'Leave Approval Notification',
      description: 'Notify manager when a leave path is submitted',
      trigger: 'Leave Submitted',
      steps: 3,
      active: true,
      lastRun: '2 days ago',
      category: 'Leave Management'
    },
    {
      id: 'WF-003',
      name: 'Probation End Reminder',
      description: 'Send reminder 15 days before probation period ends',
      trigger: 'Date Condition',
      steps: 2,
      active: false,
      lastRun: 'Never',
      category: 'Reviews'
    },
    {
      id: 'WF-004',
      name: 'Document Expiry Alert',
      description: 'Notify HR when employee visas or passports are near expiry',
      trigger: 'Schedule',
      steps: 4,
      active: true,
      lastRun: '12 hours ago',
      category: 'Compliance'
    }
  ]);

  // Mock data - Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, event: 'Workflow WF-001 executed', status: 'success', time: '10:45 AM', user: 'System' },
    { id: 2, event: 'Rule "Late Login" triggered', status: 'success', time: '09:15 AM', user: 'System' },
    { id: 3, event: 'Workflow WF-004 failed', status: 'error', time: '08:00 AM', user: 'System', message: 'Email service unreachable' },
    { id: 4, event: 'New Automation Rule created', status: 'info', time: 'Yesterday', user: 'Admin' },
  ]);

  const filteredWorkflows = workflows.filter(wf => 
    wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wf.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRunWorkflow = (wf: any) => {
    setWorkflows(prev => prev.map(w => 
      w.id === wf.id ? { ...w, lastRun: 'Just now' } : w
    ));
    setAuditLogs(prev => [{
      id: Date.now(),
      event: `Workflow ${wf.id} manual trigger`,
      status: 'success',
      time: 'Just now',
      user: 'Admin'
    }, ...prev]);
    toast({
      title: "Workflow Triggered Manually",
      description: `Workflow "${wf.name}" has been added to the execution queue.`
    });
  };

  const handleToggleWorkflow = (wf: any) => {
    setWorkflows(prev => prev.map(w => 
      w.id === wf.id ? { ...w, active: !w.active } : w
    ));
    toast({
      title: wf.active ? "Workflow Paused" : "Workflow Activated",
      description: `${wf.name} status updated successfully.`
    });
  };

  const handleCreateWorkflow = () => {
    if (!newWorkflowName) return;
    const newWf = {
      id: `WF-00${workflows.length + 1}`,
      name: newWorkflowName,
      description: `Automated sequence for ${newCategory || 'General'}`,
      trigger: newTrigger || 'Manual',
      steps: 1,
      active: true,
      lastRun: 'Never',
      category: newCategory || 'General'
    };
    setWorkflows([newWf, ...workflows]);
    setNewWorkflowName('');
    toast({
      title: "Workflow Created",
      description: `"${newWorkflowName}" is now available in your engine.`
    });
  };

  const handleDeleteWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    toast({
      title: "Workflow Deleted",
      description: "Automated sequence removed permanently.",
      variant: "destructive"
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-slate-50/50 text-slate-900">
        {/* Modern Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-slate-100"
                onClick={() => setLocation('/hrm')}
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <Workflow className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HR Automation</h1>
                </div>
                <p className="text-sm text-slate-500 font-medium">Configure intelligent triggers and automated HR processes</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-900">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50">
                    <History className="h-4 w-4 mr-2" /> Execution Logs
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl rounded-3xl p-6 bg-white overflow-hidden text-slate-900">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                       <Activity className="h-5 w-5 text-indigo-500" />
                       Automation Engine History
                    </DialogTitle>
                    <DialogDescription className="font-medium text-slate-500">Live feed of active workflow executions</DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[400px] mt-4 pr-4">
                    <div className="space-y-3">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${
                              log.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                              log.status === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {log.status === 'success' ? <CheckCircle2 className="h-4 w-4" /> : 
                               log.status === 'error' ? <AlertCircle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{log.event}</p>
                              <p className="text-[10px] font-medium text-slate-500">Triggered by {log.user} • {log.time}</p>
                              {log.message && <p className="text-[10px] text-rose-500 mt-1 font-bold italic">{log.message}</p>}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter text-slate-400">ID: {log.id.toString().slice(-4)}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200 text-white font-bold h-10 px-6 rounded-xl transition-all active:scale-95">
                    <Plus className="h-4 w-4 mr-2" />
                    New Workflow
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                  <div className="bg-indigo-600 p-8 text-white">
                    <div className="flex justify-between items-start">
                       <div>
                          <DialogTitle className="text-2xl font-black">Create Automation</DialogTitle>
                          <DialogDescription className="text-indigo-100 font-medium tracking-tight mt-1">Design an intelligent chain of HR actions</DialogDescription>
                       </div>
                       <div className="p-3 bg-white/10 rounded-2xl">
                          <Sparkles className="h-6 w-6 text-indigo-200 fill-indigo-200/20" />
                       </div>
                    </div>
                  </div>
                  <div className="p-8 space-y-6 bg-white">
                    <div className="space-y-2 text-slate-900">
                      <Label className="text-xs font-black uppercase text-slate-400">Workflow Identity</Label>
                      <Input 
                        id="new-workflow-name"
                        placeholder="e.g. Employee Anniversary Blast" 
                        value={newWorkflowName}
                        onChange={(e) => setNewWorkflowName(e.target.value)}
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-700 focus-visible:ring-indigo-500" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6 bg-white text-slate-900">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-400">Trigger Event</Label>
                        <Select value={newTrigger} onValueChange={setNewTrigger}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-700">
                            <SelectValue placeholder="Select Trigger" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Employee Created">🎉 Employee Hired</SelectItem>
                            <SelectItem value="Leave Submitted">🏝️ Leave Approved</SelectItem>
                            <SelectItem value="Date Condition">📅 Specific Date</SelectItem>
                            <SelectItem value="Status Changed">🔄 Status Changed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-400">Category</Label>
                        <Select value={newCategory} onValueChange={setNewCategory}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-700">
                            <SelectValue placeholder="Classification" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Onboarding">Onboarding</SelectItem>
                            <SelectItem value="Engagement">Engagement</SelectItem>
                            <SelectItem value="Compliance">Compliance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3 italic">
                       <Zap className="h-5 w-5 text-indigo-600 shrink-0" />
                       <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
                          Pro Tip: You can chain up to 10 actions including delays, conditional branches (IF/ELSE), and cross-module webhooks.
                       </p>
                    </div>
                  </div>
                  <div className="px-8 pb-8 pt-4 flex gap-3 bg-white">
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="flex-1 rounded-xl h-12 font-bold text-slate-500 hover:bg-slate-50">Cancel</Button>
                    </DialogTrigger>
                    <Button 
                      onClick={() => {
                        if (!newWorkflowName.trim()) {
                          toast({
                            title: "Validation Error",
                            description: "Please enter a workflow name.",
                            variant: "destructive"
                          });
                          return;
                        }
                        handleCreateWorkflow();
                      }}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 rounded-xl h-12 font-bold shadow-lg shadow-teal-100 text-white"
                    >
                      Create Workflow
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 py-6 text-slate-900">
          <div className="max-w-[1600px] mx-auto space-y-6">
            
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Active Flows"
                value="12"
                description="Running in production"
                icon={Zap}
                color="bg-amber-100 text-amber-600"
              />
              <StatCard 
                title="Executions Today"
                value="148"
                trend={{ value: '+12% vs yesterday', positive: true }}
                icon={Activity}
                color="bg-emerald-100 text-emerald-600"
              />
              <StatCard 
                title="Success Rate"
                value="99.4%"
                description="Failed: 2 executions"
                icon={CheckCircle2}
                color="bg-blue-100 text-blue-600"
              />
              <StatCard 
                title="Time Saved"
                value="420 hrs"
                description="Calculated monthly"
                icon={Timer}
                color="bg-purple-100 text-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Workflows List */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-slate-200 shadow-sm overflow-hidden rounded-[1.5rem] bg-white">
                  <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="font-bold text-slate-900 flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-indigo-500" />
                      Active Engine Workflows
                    </h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Search workflows..." 
                        className="pl-10 w-full md:w-[250px] bg-white border-slate-200 rounded-xl font-medium focus-visible:ring-indigo-500 text-slate-900" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {filteredWorkflows.map((wf) => (
                      <div key={wf.id} className="p-6 hover:bg-slate-50/50 transition-all group relative">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4 cursor-pointer" onClick={() => { setSelectedWorkflow(wf); setIsDesignerOpen(true); }}>
                            <div className={`mt-1 h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl transition-all group-hover:scale-105 ${
                               wf.category === 'Onboarding' ? 'bg-blue-50 text-blue-600' : 
                               wf.category === 'Compliance' ? 'bg-amber-50 text-amber-600' : 
                               'bg-indigo-50 text-indigo-600'
                            }`}>
                              {wf.category === 'Onboarding' ? <UserPlus className="h-6 w-6" /> : 
                               wf.category === 'Compliance' ? <Settings className="h-6 w-6" /> : 
                               <Bell className="h-6 w-6" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-lg">{wf.name}</h3>
                                <Badge variant="outline" className="text-[10px] uppercase font-black bg-white border-slate-200 text-slate-500 h-5 px-2">
                                  {wf.id}
                                </Badge>
                                <Badge className={`${wf.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'} border-none font-black text-[9px] uppercase h-5`}>
                                   {wf.active ? 'Active' : 'Paused'}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500 mt-1 font-medium leading-relaxed max-w-xl">{wf.description}</p>
                              
                              <div className="flex items-center gap-5 mt-4">
                                 <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                    <Zap className="h-3.5 w-3.5" />
                                    {wf.trigger}
                                 </div>
                                 <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                    <GitBranch className="h-3.5 w-3.5" />
                                    {wf.steps} Steps
                                 </div>
                                 <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                    <Clock className="h-3.5 w-3.5" />
                                    Ran {wf.lastRun}
                                 </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600"
                                onClick={() => handleRunWorkflow(wf)}
                              >
                                <Play className="h-4 w-4 fill-current" />
                             </Button>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-400 font-bold">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-xl border-slate-100">
                                  <DropdownMenuItem className="rounded-xl font-bold gap-2 py-2.5 cursor-pointer text-slate-700" onClick={() => { setSelectedWorkflow(wf); setIsDesignerOpen(true); }}>
                                    <Layout className="h-4 w-4 text-slate-400" /> Open Designer
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-xl font-bold gap-2 py-2.5 cursor-pointer text-slate-700">
                                    <Copy className="h-4 w-4 text-slate-400" /> Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-xl font-bold gap-2 py-2.5 cursor-pointer text-slate-700" onClick={() => handleToggleWorkflow(wf)}>
                                    {wf.active ? <><Pause className="h-4 w-4 text-amber-500" /> Pause Flow</> : <><Play className="h-4 w-4 text-emerald-500" /> Resume Flow</>}
                                  </DropdownMenuItem>
                                  <Separator className="my-1" />
                                  <DropdownMenuItem 
                                    className="rounded-xl font-bold gap-2 py-2.5 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                    onClick={() => handleDeleteWorkflow(wf.id)}
                                  >
                                    <Trash2 className="h-4 w-4" /> Delete Permanently
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Designer Side Panel / Placeholder */}
              <div className="space-y-6">
                 <Card className="border-none shadow-xl bg-slate-900 overflow-hidden rounded-[2rem] text-white">
                    <CardHeader className="pb-2">
                       <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-4">
                          <Cpu className="h-6 w-6 text-indigo-400" />
                       </div>
                       <CardTitle className="text-xl">AI Flow Suggest</CardTitle>
                       <CardDescription className="text-slate-400 font-medium">Smart automation recommendations based on your workforce patterns</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                       <div className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group">
                          <p className="font-bold text-sm mb-1 group-hover:text-indigo-400 transition-colors">"Late Arrival" Webhook</p>
                          <p className="text-xs text-slate-400 leading-relaxed">Notify managers automatically when an employee is 30m+ late via Slack.</p>
                       </div>
                       <div className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group">
                          <p className="font-bold text-sm mb-1 group-hover:text-indigo-400 transition-colors">Birthdays & Anniversaries</p>
                          <p className="text-xs text-slate-400 leading-relaxed">Send a personalized email and post to company wall at 9:00 AM.</p>
                       </div>
                       <Button variant="ghost" className="w-full text-indigo-400 font-bold hover:bg-white/5 hover:text-indigo-300 transition-colors">
                          Explore AI Suggestions
                          <ArrowRight className="h-4 w-4 ml-2" />
                       </Button>
                    </CardContent>
                 </Card>

                 <Card className="border-slate-200 shadow-sm rounded-[1.5rem] bg-white overflow-hidden text-slate-900">
                   <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                     <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                       <History className="h-4 w-4 text-slate-400" />
                       Live Log Stream
                     </h3>
                     <Badge className="bg-emerald-50 text-emerald-600 border-none animate-pulse font-black text-[9px] uppercase">Live</Badge>
                   </div>
                   <div className="p-0">
                     <div className="divide-y divide-slate-100 text-slate-900">
                       {auditLogs.map((log) => (
                         <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                           <div className="flex items-start gap-3">
                             {log.status === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" /> : 
                              log.status === 'error' ? <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5" /> :
                              <Activity className="h-4 w-4 text-indigo-500 mt-0.5" />}
                             <div className="flex-1 min-w-0">
                               <p className="text-[12px] font-bold text-slate-900 truncate tracking-tight">{log.event}</p>
                               <div className="flex justify-between items-center mt-1">
                                 <span className="text-[10px] text-slate-400 font-bold">{log.time} • by {log.user}</span>
                                 {log.message && <span className="text-[10px] text-rose-500 font-black">FAIL</span>}
                               </div>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                   <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                      <Button variant="link" className="text-xs font-bold text-indigo-600 h-auto p-0">View All Execution Logs</Button>
                    </div>
                 </Card>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Workflow Designer Dialog */}
        <Dialog open={isDesignerOpen} onOpenChange={setIsDesignerOpen}>
          <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-[3rem]">
            <div className="flex h-full text-slate-900">
              {/* Left Sidebar - Nodes */}
              <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
                <div className="p-8 border-b border-slate-200">
                   <h2 className="text-xl font-black text-slate-900 tracking-tight">Logic Blocks</h2>
                   <p className="text-xs text-slate-500 font-medium">Drag and drop to build flow</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400 px-4">Core Actions</Label>
                      {[
                        { icon: Mail, label: 'Send Email', color: 'bg-blue-100 text-blue-600' },
                        { icon: Bell, label: 'Push Notify', color: 'bg-indigo-100 text-indigo-600' },
                        { icon: Settings, label: 'Update Record', color: 'bg-slate-100 text-slate-600' },
                        { icon: UserPlus, label: 'Add Role', color: 'bg-emerald-100 text-emerald-600' }
                      ].map((node, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-200 transition-all group">
                           <div className={`p-2 rounded-xl ${node.color} group-hover:scale-110 transition-transform`}>
                              <node.icon className="h-4 w-4" />
                           </div>
                           <span className="font-bold text-sm text-slate-700">{node.label}</span>
                        </div>
                      ))}
                   </div>

                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400 px-4">Logic & Filters</Label>
                      {[
                        { icon: GitBranch, label: 'Condition (IF)', color: 'bg-violet-100 text-violet-600' },
                        { icon: Clock, label: 'Wait/Delay', color: 'bg-amber-100 text-amber-600' },
                        { icon: Filter, label: 'Filter Data', color: 'bg-rose-100 text-rose-600' }
                      ].map((node, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-grab active:cursor-grabbing hover:border-violet-200 transition-all group">
                           <div className={`p-2 rounded-xl ${node.color} group-hover:scale-110 transition-transform`}>
                              <node.icon className="h-4 w-4" />
                           </div>
                           <span className="font-bold text-sm text-slate-700">{node.label}</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="p-6 bg-white border-t border-slate-100">
                   <Button variant="outline" className="w-full rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Documentation
                   </Button>
                </div>
              </div>

              {/* Main Canvas Area */}
              <div className="flex-1 bg-white relative flex flex-col">
                 <div className="h-20 border-b border-slate-100 px-8 flex items-center justify-between bg-white text-slate-900 border-none">
                    <div className="flex items-center gap-3">
                       <div className="p-2.5 bg-indigo-600 rounded-xl">
                          <Workflow className="h-5 w-5 text-white" />
                       </div>
                       <div>
                          <h2 className="font-black text-slate-900 leading-tight">Designer: {selectedWorkflow?.name || 'Untitled Flow'}</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                             <Badge className="bg-indigo-50 text-indigo-600 border-none text-[8px] font-black uppercase h-4">Draft v1.4</Badge>
                             <span className="text-[10px] text-slate-400 font-bold">Auto-saved 2m ago</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="ghost" className="rounded-xl font-black text-slate-500 hover:bg-slate-50" onClick={() => setIsDesignerOpen(false)}>Close</Button>
                       <Button 
                        className="bg-slate-900 hover:bg-slate-800 rounded-xl font-black px-6 shadow-lg shadow-slate-200 text-white"
                        onClick={() => {
                          toast({ title: "Workflow Saved", description: "Designer changes have been committed to the engine." });
                          setIsDesignerOpen(false);
                        }}
                       >
                          Save & Publish
                       </Button>
                    </div>
                 </div>

                 <div className="flex-1 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] p-20 flex flex-col items-center overflow-auto bg-white text-slate-900 border-none shadow-none">
                    {/* Trigger Node */}
                    <div className="w-72 bg-white border-2 border-slate-900 p-5 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,0.1)] relative group">
                       <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Trigger</div>
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 ring-4 ring-indigo-50 transition-all group-hover:scale-110">
                             <Zap className="h-6 w-6 fill-current text-indigo-600" />
                          </div>
                          <div>
                             <p className="font-black text-slate-900 leading-tight">{selectedWorkflow?.trigger || 'Event Trigger'}</p>
                             <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Core Engine</p>
                          </div>
                       </div>
                    </div>

                    <div className="h-16 w-0.5 bg-slate-200 relative">
                       <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 h-3 w-3 rounded-full bg-slate-200 border-2 border-white" />
                    </div>

                    {/* Step 1 Node */}
                    <div className="w-72 bg-white border border-slate-200 p-5 rounded-3xl shadow-xl shadow-slate-100 relative group hover:border-indigo-300 transition-all">
                       <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-50 text-indigo-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100">Step 1</div>
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:rotate-6 transition-transform">
                             <Mail className="h-6 w-6" />
                          </div>
                          <div>
                             <p className="font-bold text-slate-900 leading-tight">Send Welcome Email</p>
                             <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase italic">Template: Onboarding_v2</p>
                          </div>
                       </div>
                    </div>

                    <div className="h-16 w-0.5 bg-slate-200 relative">
                       <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 h-3 w-3 rounded-full bg-slate-200 border-2 border-white" />
                    </div>

                    {/* Logic Node */}
                    <div className="w-72 bg-violet-50 border border-violet-100 p-5 rounded-3xl shadow-xl shadow-violet-100/50 relative group">
                       <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Logic</div>
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-violet-600 shadow-sm border-none">
                             <GitBranch className="h-6 w-6" />
                          </div>
                          <div>
                             <p className="font-black text-violet-900 leading-tight">Branch If Manager</p>
                             <p className="text-[10px] text-violet-400 font-extrabold mt-1 italic uppercase tracking-tighter">Role Check</p>
                          </div>
                       </div>
                    </div>

                    <div className="mt-8">
                       <Button variant="outline" className="rounded-full h-10 w-10 p-0 border-dashed border-2 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                          <Plus className="h-4 w-4 text-slate-400" />
                       </Button>
                    </div>
                 </div>

                 {/* Canvas Controls */}
                 <div className="absolute bottom-8 right-8 flex gap-2">
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white shadow-lg border-slate-200 hover:bg-slate-50"><Layout className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white shadow-lg border-slate-200 hover:bg-slate-50"><Search className="h-4 w-4" /></Button>
                 </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
