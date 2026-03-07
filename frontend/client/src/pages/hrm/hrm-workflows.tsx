import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  GitBranch, 
  Plus, 
  Search, 
  ArrowLeft, 
  MoreVertical, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Users,
  Shield,
  Zap,
  Layout,
  Play,
  Settings,
  Trash2,
  Copy,
  PlusCircle,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';

export default function HRMWorkflows() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [newWfName, setNewWfName] = useState('');
  const [newWfCategory, setNewWfCategory] = useState('');

  const [workflows, setWorkflows] = useState([
    {
      id: 'WF-001',
      name: 'Leave Approval Chain',
      category: 'Time & Attendance',
      status: 'Active',
      stages: 3,
      approvers: ['Reporting Manager', 'Department Head', 'HR Admin'],
      description: 'Standard multi-level approval for annual and sick leaves.',
      lastModified: '2 days ago',
      executions: 450
    },
    {
      id: 'WF-002',
      name: 'Expense Reimbursement',
      category: 'Finance',
      status: 'Active',
      stages: 2,
      approvers: ['Finance Controller', 'CEO (if > $5000)'],
      description: 'Automated routing for travel and operational expenses.',
      lastModified: '1 week ago',
      executions: 128
    },
    {
      id: 'WF-003',
      name: 'Promotion Request',
      category: 'Performance',
      status: 'Draft',
      stages: 4,
      approvers: ['Manager', 'skip-level Manager', 'HR BP', 'C-Suite'],
      description: 'Review cycle for internal promotions and salary adjustments.',
      lastModified: 'Just now',
      executions: 0
    }
  ]);

  const filteredWorkflows = workflows.filter(wf => 
    wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wf.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRunTest = (wf: any) => {
    setWorkflows(prev => prev.map(w => 
      w.id === wf.id ? { ...w, executions: w.executions + 1, lastModified: 'Just now' } : w
    ));
    toast({
      title: "Test Mode Initiated",
      description: `Simulating "${wf.name}" with mock payload.`
    });
  };

  const handleCreateWorkflow = () => {
    if (!newWfName) return;
    const newWf = {
      id: `WF-00${workflows.length + 1}`,
      name: newWfName,
      category: newWfCategory || 'General',
      status: 'Active',
      stages: 2,
      approvers: ['Department Lead', 'HR Partner'],
      description: `Approval sequence for ${newWfName} events.`,
      lastModified: 'Just now',
      executions: 0
    };
    setWorkflows([newWf, ...workflows]);
    setNewWfName('');
    setIsBuilderOpen(false);
    toast({
      title: "Workflow Sequence Built",
      description: "Your new approval logic is now live."
    });
  };

  const handleArchive = (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    toast({
      title: "Workflow Archived",
      description: "The logic path has been moved to archives.",
      variant: "destructive"
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-slate-50/50 text-slate-900">
        {/* Advanced Header */}
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
                    <GitBranch className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Approval Workflows</h1>
                </div>
                <p className="text-sm text-slate-500 font-medium italic">Design visual business logic and human-in-the-loop approvals</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="bg-white border-slate-200 text-slate-600 font-bold rounded-xl h-10 px-4 transition-all hover:bg-slate-50">
                <Layout className="h-4 w-4 mr-2" /> Global Rules
              </Button>
              <Button 
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95"
                onClick={() => { setSelectedWorkflow(null); setIsBuilderOpen(true); }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Build Workflow
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="border-none bg-teal-600 text-white shadow-xl shadow-teal-100 rounded-[2rem] overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                     <UserCheck className="h-32 w-32" />
                  </div>
                  <CardContent className="p-8">
                     <p className="text-indigo-100 font-black text-xs uppercase tracking-widest mb-1">Active Approvals</p>
                     <h3 className="text-4xl font-black">24</h3>
                     <p className="text-indigo-100/70 text-sm mt-4 font-medium leading-relaxed">Most active: Leave Requests (12 pending)</p>
                     <Button variant="ghost" className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white border-none rounded-xl font-bold">
                        View Pending Queue
                     </Button>
                  </CardContent>
               </Card>

               <Card className="border-slate-200 shadow-sm rounded-[2rem] bg-white overflow-hidden">
                  <CardContent className="p-8">
                     <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-emerald-50 rounded-2xl">
                           <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px]">98% SUCCESS</Badge>
                     </div>
                     <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-1">Avg Completion Time</p>
                     <h3 className="text-3xl font-black text-slate-900 tracking-tighter">4.2 Hours</h3>
                     <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[85%]" />
                     </div>
                  </CardContent>
               </Card>

               <Card className="border-slate-200 shadow-sm rounded-[2rem] bg-white overflow-hidden">
                  <CardContent className="p-8">
                     <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-rose-50 rounded-2xl">
                           <AlertCircle className="h-6 w-6 text-rose-600" />
                        </div>
                        <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[10px]">3 REJECTED</Badge>
                     </div>
                     <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-1">Stalled Workflows</p>
                     <h3 className="text-3xl font-black text-slate-900 tracking-tighter">2 Active</h3>
                     <p className="text-slate-500 text-xs mt-4 font-medium italic">Pending escalated manager review</p>
                  </CardContent>
               </Card>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 px-2">
                <Layout className="h-5 w-5 text-indigo-500" />
                Workflow Inventory
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Filter by name or category..." 
                  className="pl-10 w-full md:w-[320px] bg-white border-slate-200 rounded-xl font-medium focus-visible:ring-indigo-500" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredWorkflows.map((wf) => (
                <Card key={wf.id} className="group border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-teal-50 transition-all duration-300 rounded-[2rem] overflow-hidden bg-white">
                  <CardContent className="p-0">
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4">
                          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${
                            wf.status === 'Active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <Zap className="h-7 w-7" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{wf.name}</h3>
                              {wf.status === 'Active' ? (
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              ) : null}
                            </div>
                            <Badge variant="outline" className="text-[10px] font-black bg-slate-50 border-slate-200 text-slate-500 px-2 h-5">
                              {wf.category}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                              <MoreVertical className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-none">
                            <DropdownMenuItem className="rounded-xl font-bold py-3 cursor-pointer" onClick={() => { setSelectedWorkflow(wf); setIsBuilderOpen(true); }}>
                              <Settings className="h-4 w-4 mr-2 text-slate-400" /> Configure Steps
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl font-bold py-3 cursor-pointer">
                              <Copy className="h-4 w-4 mr-2 text-slate-400" /> Clone Template
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl font-bold py-3 cursor-pointer" onClick={() => handleRunTest(wf)}>
                              <Play className="h-4 w-4 mr-2 text-emerald-500" /> Run Simulation
                            </DropdownMenuItem>
                            <Separator className="my-1" />
                            <DropdownMenuItem 
                              className="rounded-xl font-bold py-3 text-rose-500 focus:text-rose-500 focus:bg-rose-50 cursor-pointer"
                              onClick={() => handleArchive(wf.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <p className="text-sm text-slate-500 font-medium leading-relaxed italic mb-8">
                        "{wf.description}"
                      </p>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Path</Label>
                           <div className="flex-1 h-px bg-slate-100" />
                        </div>
                        <div className="flex items-center gap-3">
                          {wf.approvers.map((approver, i) => (
                            <React.Fragment key={i}>
                              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl group/step cursor-help hover:bg-indigo-50 transition-colors">
                                <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm">
                                  {i + 1}
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">{approver}</span>
                              </div>
                              {i < wf.approvers.length - 1 && (
                                <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                       <div className="flex items-center gap-6">
                         <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                           <Clock className="h-3.5 w-3.5" />
                           Edited {wf.lastModified}
                         </div>
                         <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                           <Layout className="h-3.5 w-3.5" />
                           {wf.executions} Executions
                         </div>
                       </div>
                       <Button variant="ghost" className="text-xs font-black text-indigo-600 hover:bg-indigo-50 rounded-xl">
                         Analytics <ArrowRight className="h-3 w-3 ml-1" />
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card 
                className="border-2 border-dashed border-slate-200 bg-slate-50/30 rounded-[2rem] flex flex-col items-center justify-center p-12 transition-all hover:bg-slate-50 hover:border-slate-300 cursor-pointer group"
                onClick={() => setIsBuilderOpen(true)}
              >
                  <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                     <PlusCircle className="h-8 w-8 text-slate-400 group-hover:text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Create Custom Sequence</h3>
                  <p className="text-sm text-slate-500 font-medium text-center mt-2 max-w-[240px]">
                    Drag and drop modules to build a bespoke approval process.
                  </p>
                  <Button variant="outline" className="mt-8 rounded-xl font-bold border-slate-200 text-slate-600">
                    Explore Templates
                  </Button>
              </Card>
            </div>
          </div>
        </ScrollArea>

        {/* Workflow Visual Designer Dialog */}
        <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
          <DialogContent className="max-w-[1500px] w-[95vw] h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-[3rem] bg-white text-slate-900">
            <div className="flex h-full">
              {/* Left Bar - Triggers & Modules */}
              <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
                <div className="p-10">
                   <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Chain Builder</h2>
                   <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">v2.4 - Canvas</p>
                </div>
                
                <ScrollArea className="flex-1 px-6">
                   <div className="space-y-8">
                      <div className="space-y-4 px-4 pt-4">
                         <div className="space-y-2">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Name</Label>
                           <Input 
                             id="workflow-name-input"
                             placeholder="Workflow name..." 
                             value={newWfName}
                             onChange={(e) => setNewWfName(e.target.value)}
                             className="h-10 rounded-xl bg-white border-slate-200 font-bold text-slate-700"
                           />
                         </div>
                         <div className="space-y-2">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</Label>
                           <Select value={newWfCategory} onValueChange={setNewWfCategory}>
                             <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 font-bold text-slate-700">
                               <SelectValue placeholder="Category" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="Finance">Finance</SelectItem>
                               <SelectItem value="HR Ops">HR Ops</SelectItem>
                               <SelectItem value="Compliance">Compliance</SelectItem>
                               <SelectItem value="Performance">Performance</SelectItem>
                               <SelectItem value="Time & Attendance">Time & Attendance</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                         <Button 
                           onClick={() => {
                             if (!newWfName.trim()) {
                               toast({
                                 title: "Validation Error",
                                 description: "Please enter a workflow name.",
                                 variant: "destructive"
                               });
                               return;
                             }
                             handleCreateWorkflow();
                           }} 
                           className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 rounded-xl mt-2"
                         >
                            Deploy Sequence
                         </Button>
                      </div>

                      <div className="space-y-3">
                         <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Starting Event</Label>
                         <div className="p-4 bg-white border-2 border-slate-900 rounded-[1.5rem] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden group cursor-pointer">
                            <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-1/3 -translate-y-1/3"><Zap className="h-16 w-16" /></div>
                            <div className="flex items-center gap-3">
                               <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><PlusCircle className="h-5 w-5" /></div>
                               <span className="font-black text-sm uppercase tracking-tight">Form Submission</span>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Approval Steps</Label>
                         {[
                           { label: 'Role-based Review', icon: UserCheck, desc: 'Assign to specific HR level' },
                           { label: 'Conditional Filter', icon: GitBranch, desc: 'IF/ELSE logic based on data' },
                           { label: 'Time Delay', icon: Clock, desc: 'Wait for specific duration' },
                           { label: 'Security Check', icon: Shield, desc: 'Validate credentials/policy' }
                         ].map((item, i) => (
                           <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-lg transition-all cursor-grab group">
                              <div className="flex items-center gap-3 mb-1">
                                 <item.icon className="h-4 w-4 text-indigo-500" />
                                 <span className="font-bold text-sm text-slate-800">{item.label}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium px-7">{item.desc}</p>
                           </div>
                         ))}
                      </div>

                      <div className="space-y-4">
                         <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Notifications</Label>
                         {[
                           { label: 'Email Outreach', icon: Mail },
                           { label: 'Mobile Push', icon: Smartphone },
                           { label: 'Slack/Teams', icon: MessageSquare }
                         ].map((item, i) => (
                           <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all cursor-grab flex items-center gap-3">
                              <item.icon className="h-4 w-4 text-blue-500" />
                              <span className="font-bold text-sm text-slate-800">{item.label}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </ScrollArea>
                <div className="p-8 bg-slate-100/50 border-t border-slate-200">
                    <Button variant="ghost" className="w-full text-indigo-600 font-black text-xs hover:bg-white rounded-xl h-12">
                       <ExternalLink className="h-4 w-4 mr-2" />
                       VIEW DESIGN DOCS
                    </Button>
                </div>
              </div>

              {/* Designer Canvas */}
              <div className="flex-1 bg-slate-50 relative flex flex-col">
                <div className="h-24 px-12 flex items-center justify-between bg-white/50 backdrop-blur-md border-b border-slate-100">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                         <GitBranch className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                         <h3 className="font-black text-xl text-slate-900 tracking-tight">{selectedWorkflow?.name || 'New Workflow System'}</h3>
                         <div className="flex items-center gap-3 mt-1">
                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest h-4">Validated Flow</Badge>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider underline">Draft Auto-Saved</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <Button variant="ghost" className="font-black text-slate-400 hover:bg-slate-100 rounded-xl h-11 px-6" onClick={() => setIsBuilderOpen(false)}>Discard Changes</Button>
                      <Button 
                        className="bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl h-11 px-8 shadow-xl shadow-teal-100"
                        onClick={() => {
                          toast({ title: "Workflow Published", description: "The new approval sequence is now live for all users." });
                          setIsBuilderOpen(false);
                        }}
                      >
                         Publish & Deploy
                      </Button>
                   </div>
                </div>

                <div className="flex-1 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:32px_32px] overflow-auto p-24 flex flex-col items-center">
                   {/* Visual Flow Start */}
                   <div className="w-80 bg-white border-2 border-slate-900 p-8 rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] relative z-10">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Entry Point</div>
                      <div className="flex items-center gap-5">
                         <div className="h-14 w-14 bg-indigo-50 rounded-[1.2rem] flex items-center justify-center text-indigo-600"><PlusCircle className="h-7 w-7" /></div>
                         <div>
                            <p className="font-black text-slate-900 tracking-tight uppercase text-sm">Leave Request</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Trigger: All Roles</p>
                         </div>
                      </div>
                   </div>

                   <div className="h-20 w-0.5 bg-slate-300 relative">
                      <div className="absolute top-1/2 -translate-y-1/2 -left-2 h-4 w-4 bg-indigo-600 rounded-full border-4 border-white shadow-sm" />
                   </div>

                   {/* Step 1 */}
                   <div className="w-80 bg-white border border-slate-200 p-8 rounded-[2rem] shadow-2xl shadow-slate-200/50 relative hover:border-indigo-400 transition-all group">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white border border-slate-100 text-indigo-600 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-sm">Level 1 Review</div>
                      <div className="flex items-center gap-5">
                         <Avatar className="h-14 w-14 rounded-2xl border-2 border-white shadow-md">
                            <AvatarFallback className="bg-indigo-600 text-white font-black">RM</AvatarFallback>
                         </Avatar>
                         <div>
                            <p className="font-black text-slate-900 tracking-tight uppercase text-sm">Reporting Manager</p>
                            <p className="text-[10px] text-emerald-500 font-black uppercase mt-1 tracking-tighter italic">Auto-Accept: If 1 day</p>
                         </div>
                      </div>
                   </div>

                   <div className="h-20 w-px border-l-2 border-dashed border-slate-300" />

                   {/* Logic Choice */}
                   <div className="flex gap-20 relative">
                       <div className="w-40 h-px bg-slate-300 absolute -left-20 top-0" />
                       <div className="w-40 h-px bg-slate-300 absolute -right-20 top-0" />
                       
                       <div className="w-64 bg-rose-50 border-2 border-rose-100 p-6 rounded-[2rem] relative group cursor-pointer hover:bg-rose-100 transition-colors">
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Rejected</div>
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm"><AlertCircle className="h-5 w-5" /></div>
                             <span className="font-black text-xs text-rose-900 uppercase">Notify Staff</span>
                          </div>
                       </div>

                       <div className="w-64 bg-emerald-50 border-2 border-emerald-100 p-6 rounded-[2rem] relative group cursor-pointer hover:bg-emerald-100 transition-colors">
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Approved</div>
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><CheckCircle2 className="h-5 w-5" /></div>
                             <span className="font-black text-xs text-emerald-900 uppercase">Update Payroll</span>
                          </div>
                       </div>
                   </div>

                   <div className="mt-16">
                      <Button variant="outline" className="h-14 w-14 rounded-full border-dashed border-2 p-0 hover:bg-white hover:border-indigo-400 transition-all">
                         <Plus className="h-6 w-6 text-slate-400" />
                      </Button>
                   </div>
                </div>

                <div className="absolute bottom-10 left-10 p-5 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-xl max-w-sm">
                   <div className="flex gap-3 items-start">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                         <p className="font-black text-xs text-slate-900 uppercase tracking-tight">AI Flow Analysis</p>
                         <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">
                            We detected a potential bottleneck at Step 3. Consider adding a 24h auto-escalation rule.
                         </p>
                         <Button variant="link" className="text-[10px] font-black p-0 h-auto text-indigo-600 mt-2">OPTIMIZE NOW</Button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
