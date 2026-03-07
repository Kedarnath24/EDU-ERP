import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, Users, UserCheck, UserPlus, Building2, Phone, 
  Mail, Calendar, ArrowRight, Search, Filter, Download,
  History, CheckCircle, XCircle, Clock,
  MoreVertical, Edit, Eye, RefreshCw, Loader2,
  TrendingUp, Award, Target, AlertCircle, Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Team member type
interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  activeLeads: number;
  totalAssigned: number;
  conversionRate: number;
  availability: "Available" | "Busy" | "Offline";
}

// Lead type
interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  source: string;
  status: string;
  assignedTo: string | null;
  assignedDate: Date | null;
  createdAt: Date;
  priority: "High" | "Medium" | "Low";
}

// Assignment history type
interface AssignmentHistory {
  id: string;
  leadId: string;
  leadName: string;
  fromUser: string | null;
  toUser: string;
  assignedBy: string;
  notes: string;
  assignedAt: Date;
}

export default function LeadAssign() {
  const { toast } = useToast();

  // Team members data
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: "SE001",
      name: "Sales Executive 1",
      role: "Senior Sales Executive",
      email: "sales1@company.com",
      activeLeads: 12,
      totalAssigned: 45,
      conversionRate: 28.5,
      availability: "Available",
    },
    {
      id: "SE002",
      name: "Sales Executive 2",
      role: "Sales Executive",
      email: "sales2@company.com",
      activeLeads: 8,
      totalAssigned: 32,
      conversionRate: 31.2,
      availability: "Available",
    },
    {
      id: "SE003",
      name: "Sarah Johnson",
      role: "Lead Sales Executive",
      email: "sarah.j@company.com",
      activeLeads: 15,
      totalAssigned: 67,
      conversionRate: 35.8,
      availability: "Busy",
    },
    {
      id: "SE004",
      name: "Mike Chen",
      role: "Sales Executive",
      email: "mike.c@company.com",
      activeLeads: 10,
      totalAssigned: 38,
      conversionRate: 26.3,
      availability: "Available",
    },
    {
      id: "SE005",
      name: "Emily Rodriguez",
      role: "Junior Sales Executive",
      email: "emily.r@company.com",
      activeLeads: 5,
      totalAssigned: 18,
      conversionRate: 22.1,
      availability: "Available",
    },
  ]);

  // Leads data
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: "L001",
      name: "John Smith",
      company: "Tech Corp",
      email: "john@techcorp.com",
      phone: "+1-555-0101",
      value: 50000,
      source: "Website",
      status: "New",
      assignedTo: null,
      assignedDate: null,
      createdAt: new Date(2026, 1, 15),
      priority: "High",
    },
    {
      id: "L002",
      name: "Emily Davis",
      company: "Digital Solutions",
      email: "emily@digitalsol.com",
      phone: "+1-555-0102",
      value: 75000,
      source: "Referral",
      status: "New",
      assignedTo: null,
      assignedDate: null,
      createdAt: new Date(2026, 1, 14),
      priority: "High",
    },
    {
      id: "L003",
      name: "Michael Brown",
      company: "Innovation Inc",
      email: "michael@innovation.com",
      phone: "+1-555-0103",
      value: 100000,
      source: "LinkedIn",
      status: "Contacted",
      assignedTo: "Sales Executive 1",
      assignedDate: new Date(2026, 1, 13),
      createdAt: new Date(2026, 1, 12),
      priority: "High",
    },
    {
      id: "L004",
      name: "Sarah Wilson",
      company: "Future Systems",
      email: "sarah@futuresys.com",
      phone: "+1-555-0104",
      value: 120000,
      source: "Conference",
      status: "Qualified",
      assignedTo: "Sales Executive 2",
      assignedDate: new Date(2026, 1, 11),
      createdAt: new Date(2026, 1, 10),
      priority: "Medium",
    },
    {
      id: "L005",
      name: "David Lee",
      company: "Smart Enterprises",
      email: "david@smartent.com",
      phone: "+1-555-0105",
      value: 150000,
      source: "Cold Call",
      status: "New",
      assignedTo: null,
      assignedDate: null,
      createdAt: new Date(2026, 1, 16),
      priority: "High",
    },
    {
      id: "L006",
      name: "Lisa Anderson",
      company: "Global Tech",
      email: "lisa@globaltech.com",
      phone: "+1-555-0106",
      value: 80000,
      source: "Email Campaign",
      status: "New",
      assignedTo: null,
      assignedDate: null,
      createdAt: new Date(2026, 1, 15),
      priority: "Medium",
    },
    {
      id: "L007",
      name: "Robert Taylor",
      company: "NextGen Solutions",
      email: "robert@nextgen.com",
      phone: "+1-555-0107",
      value: 60000,
      source: "Website",
      status: "Contacted",
      assignedTo: "Sarah Johnson",
      assignedDate: new Date(2026, 1, 14),
      createdAt: new Date(2026, 1, 13),
      priority: "Low",
    },
    {
      id: "L008",
      name: "Jennifer White",
      company: "Cloud Dynamics",
      email: "jennifer@clouddyn.com",
      phone: "+1-555-0108",
      value: 90000,
      source: "Referral",
      status: "New",
      assignedTo: null,
      assignedDate: null,
      createdAt: new Date(2026, 1, 16),
      priority: "Medium",
    },
  ]);

  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistory[]>([
    {
      id: "AH001",
      leadId: "L003",
      leadName: "Michael Brown",
      fromUser: null,
      toUser: "Sales Executive 1",
      assignedBy: "Admin User",
      notes: "High-value lead from LinkedIn",
      assignedAt: new Date(2026, 1, 13, 10, 30),
    },
    {
      id: "AH002",
      leadId: "L004",
      leadName: "Sarah Wilson",
      fromUser: null,
      toUser: "Sales Executive 2",
      assignedBy: "Admin User",
      notes: "Met at conference, warm lead",
      assignedAt: new Date(2026, 1, 11, 14, 15),
    },
    {
      id: "AH003",
      leadId: "L007",
      leadName: "Robert Taylor",
      fromUser: null,
      toUser: "Sarah Johnson",
      assignedBy: "Admin User",
      notes: "Website inquiry, immediate follow-up needed",
      assignedAt: new Date(2026, 1, 14, 9, 0),
    },
  ]);

  // State management
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignment, setFilterAssignment] = useState<"All" | "Assigned" | "Unassigned">("All");
  const [filterPriority, setFilterPriority] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [isLoading, setIsLoading] = useState(false);

  // Calculate statistics
  const stats = {
    totalLeads: leads.length,
    assignedLeads: leads.filter(l => l.assignedTo !== null).length,
    unassignedLeads: leads.filter(l => l.assignedTo === null).length,
    highPriority: leads.filter(l => l.priority === "High" && l.assignedTo === null).length,
    totalValue: leads.reduce((sum, lead) => sum + lead.value, 0),
    unassignedValue: leads.filter(l => l.assignedTo === null).reduce((sum, lead) => sum + lead.value, 0),
  };

  // Handle single assignment
  const handleAssignLeads = async () => {
    if (selectedLeads.length === 0 || !selectedTeamMember) {
      toast({
        title: "Error",
        description: "Please select leads and a team member",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const teamMember = teamMembers.find(tm => tm.id === selectedTeamMember);
    if (!teamMember) return;

    // Update leads
    const updatedLeads = leads.map(lead => {
      if (selectedLeads.includes(lead.id)) {
        return {
          ...lead,
          assignedTo: teamMember.name,
          assignedDate: new Date(),
        };
      }
      return lead;
    });

    setLeads(updatedLeads);

    // Add to history
    const newHistory: AssignmentHistory[] = selectedLeads.map((leadId, index) => {
      const lead = leads.find(l => l.id === leadId);
      return {
        id: `AH${String(assignmentHistory.length + index + 1).padStart(3, '0')}`,
        leadId: leadId,
        leadName: lead?.name || "",
        fromUser: lead?.assignedTo || null,
        toUser: teamMember.name,
        assignedBy: "Current User",
        notes: assignmentNotes,
        assignedAt: new Date(),
      };
    });

    setAssignmentHistory([...newHistory, ...assignmentHistory]);

    setIsLoading(false);
    setAssignDialogOpen(false);
    setSelectedLeads([]);
    setSelectedTeamMember("");
    setAssignmentNotes("");

    toast({
      title: "Assignment Successful",
      description: `${selectedLeads.length} lead(s) assigned to ${teamMember.name}`,
    });
  };

  // Handle reassignment
  const handleReassignLead = async () => {
    if (!selectedLead || !selectedTeamMember) return;

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const teamMember = teamMembers.find(tm => tm.id === selectedTeamMember);
    if (!teamMember) return;

    // Update lead
    setLeads(leads.map(lead => 
      lead.id === selectedLead.id 
        ? { ...lead, assignedTo: teamMember.name, assignedDate: new Date() }
        : lead
    ));

    // Add to history
    const historyEntry: AssignmentHistory = {
      id: `AH${String(assignmentHistory.length + 1).padStart(3, '0')}`,
      leadId: selectedLead.id,
      leadName: selectedLead.name,
      fromUser: selectedLead.assignedTo,
      toUser: teamMember.name,
      assignedBy: "Current User",
      notes: assignmentNotes,
      assignedAt: new Date(),
    };

    setAssignmentHistory([historyEntry, ...assignmentHistory]);

    setIsLoading(false);
    setReassignDialogOpen(false);
    setSelectedTeamMember("");
    setAssignmentNotes("");

    toast({
      title: "Reassignment Successful",
      description: `Lead reassigned to ${teamMember.name}`,
    });
  };

  // Toggle lead selection
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  // Select all filtered leads
  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  // Open reassign dialog
  const openReassignDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setSelectedTeamMember("");
    setAssignmentNotes("");
    setReassignDialogOpen(true);
  };

  // Open detail dialog
  const openDetailDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailDialogOpen(true);
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAssignment = 
      filterAssignment === "All" ||
      (filterAssignment === "Assigned" && lead.assignedTo !== null) ||
      (filterAssignment === "Unassigned" && lead.assignedTo === null);

    const matchesPriority = 
      filterPriority === "All" || lead.priority === filterPriority;
    
    return matchesSearch && matchesAssignment && matchesPriority;
  });

  // Format currency (INR)
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  // Format date
  const formatDate = (date: Date) => 
    new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-700 border-red-300";
      case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "Low": return "bg-green-100 text-green-700 border-green-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  // Get availability color
  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "Available": return "bg-green-100 text-green-700";
      case "Busy": return "bg-yellow-100 text-yellow-700";
      case "Offline": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">CRM - Assign Lead</h1>
              <p className="text-sm text-gray-600">Assign leads to sales executives and track assignments</p>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalLeads}</p>
                  <p className="text-xs text-gray-500 mt-1">Total value: {formatCurrency(stats.totalValue)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unassigned</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{stats.unassignedLeads}</p>
                  <p className="text-xs text-orange-600 mt-1">Value: {formatCurrency(stats.unassignedValue)}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.assignedLeads}</p>
                  <p className="text-xs text-green-600 mt-1">To {teamMembers.length} team members</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.highPriority}</p>
                  <p className="text-xs text-red-600 mt-1">Unassigned urgent leads</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="leads" className="gap-2">
              <Users className="w-4 h-4" />
              All Leads
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <UserCheck className="w-4 h-4" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Assignment History
            </TabsTrigger>
          </TabsList>

          {/* All Leads Tab */}
          <TabsContent value="leads" className="space-y-4">
            {/* Actions Bar */}
            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search leads by name, company, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterAssignment} onValueChange={(value: any) => setFilterAssignment(value)}>
                    <SelectTrigger className="w-full lg:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Leads</SelectItem>
                      <SelectItem value="Assigned">Assigned</SelectItem>
                      <SelectItem value="Unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
                    <SelectTrigger className="w-full lg:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Priorities</SelectItem>
                      <SelectItem value="High">High Priority</SelectItem>
                      <SelectItem value="Medium">Medium Priority</SelectItem>
                      <SelectItem value="Low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      if (selectedLeads.length === 0) {
                        toast({
                          title: "No leads selected",
                          description: "Please select at least one lead to assign",
                          variant: "destructive",
                        });
                        return;
                      }
                      setAssignDialogOpen(true);
                    }}
                    disabled={selectedLeads.length === 0}
                    className="gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign ({selectedLeads.length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Leads List */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Leads ({filteredLeads.length})</CardTitle>
                    <CardDescription>Select leads to assign to team members</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <Label htmlFor="select-all" className="text-sm cursor-pointer">
                      Select All
                    </Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredLeads.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No leads found</p>
                      <p className="text-sm mt-2">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    filteredLeads.map((lead) => (
                      <Card key={lead.id} className={`border transition-all ${selectedLeads.includes(lead.id) ? 'bg-blue-50 border-blue-300' : 'hover:shadow-md'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <Checkbox
                              id={`lead-${lead.id}`}
                              checked={selectedLeads.includes(lead.id)}
                              onCheckedChange={() => toggleLeadSelection(lead.id)}
                            />

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                                <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                  <Building2 className="w-3 h-3" />
                                  {lead.company}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Mail className="w-3 h-3" />
                                  {lead.email}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <p className="text-xs text-gray-600">
                                  Value: <span className="font-semibold text-gray-900">{formatCurrency(lead.value)}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${getPriorityColor(lead.priority)} border text-xs`}>
                                    {lead.priority}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {lead.status}
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-1">
                                {lead.assignedTo ? (
                                  <>
                                    <div className="flex items-center gap-1 text-xs">
                                      <UserCheck className="w-3 h-3 text-green-600" />
                                      <span className="font-medium text-green-600">{lead.assignedTo}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {lead.assignedDate && formatDate(lead.assignedDate)}
                                    </p>
                                  </>
                                ) : (
                                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Unassigned
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openReassignDialog(lead)}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  {lead.assignedTo ? 'Reassign' : 'Assign'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDetailDialog(lead)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Members Tab */}
          <TabsContent value="team" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Team Members ({teamMembers.length})</CardTitle>
                <CardDescription>Sales executives and their workload</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {teamMembers.map((member) => (
                    <Card key={member.id} className="border-2 hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                            <p className="text-xs text-gray-600">{member.role}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{member.email}</span>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Active Leads:</span>
                                <span className="font-semibold">{member.activeLeads}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Total Assigned:</span>
                                <span className="font-semibold">{member.totalAssigned}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Conversion:</span>
                                <span className="font-semibold text-green-600">{member.conversionRate}%</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Status:</span>
                                <Badge className={`${getAvailabilityColor(member.availability)} text-xs`}>
                                  {member.availability}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignment History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Assignment History ({assignmentHistory.length})</CardTitle>
                <CardDescription>Track all lead assignments and reassignments</CardDescription>
              </CardHeader>
              <CardContent>
                {assignmentHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No assignment history yet</p>
                    <p className="text-sm mt-2">Assignments will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignmentHistory.map((entry) => (
                      <Card key={entry.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-gray-600" />
                                <span className="font-semibold text-gray-900">{entry.leadName}</span>
                                <span className="text-xs text-gray-500">#{entry.leadId}</span>
                              </div>

                              <div className="flex items-center gap-2 mb-2">
                                {entry.fromUser ? (
                                  <>
                                    <Badge variant="outline" className="text-xs">
                                      {entry.fromUser}
                                    </Badge>
                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-500">Unassigned →</span>
                                )}
                                <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  {entry.toUser}
                                </Badge>
                              </div>

                              {entry.notes && (
                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                  "{entry.notes}"
                                </p>
                              )}
                            </div>

                            <div className="text-right space-y-1">
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <User className="w-3 h-3" />
                                {entry.assignedBy}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {formatDate(entry.assignedAt)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assign Dialog (Bulk) */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Leads to Team Member</DialogTitle>
              <DialogDescription>
                Assign {selectedLeads.length} selected lead(s) to a sales executive
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Team Member Selection */}
              <div className="space-y-2">
                <Label htmlFor="team-member">Select Team Member *</Label>
                <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                  <SelectTrigger id="team-member">
                    <SelectValue placeholder="Choose a team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{member.name}</span>
                          <Badge className={`${getAvailabilityColor(member.availability)} text-xs ml-2`}>
                            {member.availability}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTeamMember && (() => {
                  const member = teamMembers.find(m => m.id === selectedTeamMember);
                  return member ? (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                      <p className="text-xs text-gray-600">Current Workload:</p>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Active Leads:</span>
                        <span className="font-semibold">{member.activeLeads}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Conversion Rate:</span>
                        <span className="font-semibold text-green-600">{member.conversionRate}%</span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Assignment Notes */}
              <div className="space-y-2">
                <Label htmlFor="assignment-notes">Assignment Notes</Label>
                <Textarea
                  id="assignment-notes"
                  placeholder="Add notes about this assignment (optional)..."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  {assignmentNotes.length} / 500 characters
                </p>
              </div>

              {/* Quick Notes Templates */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Quick Notes</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "High priority lead",
                    "Warm lead - quick follow-up",
                    "Requires immediate attention",
                    "Follow up within 24 hours",
                  ].map((template) => (
                    <Button
                      key={template}
                      variant="outline"
                      size="sm"
                      className="text-xs justify-start h-auto py-2"
                      onClick={() => setAssignmentNotes(template)}
                    >
                      {template}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Selected Leads Summary */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-2">
                  Selected Leads ({selectedLeads.length})
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedLeads.map(leadId => {
                    const lead = leads.find(l => l.id === leadId);
                    return lead ? (
                      <div key={leadId} className="text-xs text-blue-700 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3" />
                        {lead.name} - {lead.company}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleAssignLeads} disabled={isLoading || !selectedTeamMember} className="gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Assign Leads
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reassign Dialog (Single) */}
        <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedLead?.assignedTo ? 'Reassign Lead' : 'Assign Lead'}</DialogTitle>
              <DialogDescription>
                {selectedLead?.assignedTo 
                  ? `Reassign "${selectedLead?.name}" to a different team member`
                  : `Assign "${selectedLead?.name}" to a team member`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Current Assignment */}
              {selectedLead?.assignedTo && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Currently Assigned To</p>
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    <UserCheck className="w-3 h-3 mr-1" />
                    {selectedLead.assignedTo}
                  </Badge>
                </div>
              )}

              {/* New Team Member Selection */}
              <div className="space-y-2">
                <Label htmlFor="new-team-member">
                  {selectedLead?.assignedTo ? 'Reassign To' : 'Assign To'} *
                </Label>
                <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                  <SelectTrigger id="new-team-member">
                    <SelectValue placeholder="Choose a team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{member.name}</span>
                          <Badge className={`${getAvailabilityColor(member.availability)} text-xs ml-2`}>
                            {member.availability}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignment Notes */}
              <div className="space-y-2">
                <Label htmlFor="reassign-notes">Notes</Label>
                <Textarea
                  id="reassign-notes"
                  placeholder="Add notes about this assignment (optional)..."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setReassignDialogOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleReassignLead} disabled={isLoading || !selectedTeamMember} className="gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {selectedLead?.assignedTo ? 'Reassigning...' : 'Assigning...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {selectedLead?.assignedTo ? 'Reassign' : 'Assign'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lead Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lead Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedLead?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedLead && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">Name</p>
                    <p className="font-medium">{selectedLead.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">Company</p>
                    <p className="font-medium">{selectedLead.company}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="font-medium">{selectedLead.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">Phone</p>
                    <p className="font-medium">{selectedLead.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">Status</p>
                    <Badge variant="outline">{selectedLead.status}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">Priority</p>
                    <Badge className={`${getPriorityColor(selectedLead.priority)} border w-fit`}>
                      {selectedLead.priority}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">Deal Value</p>
                    <p className="font-medium text-green-600">{formatCurrency(selectedLead.value)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">Source</p>
                    <p className="font-medium">{selectedLead.source}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">Assigned To</p>
                    {selectedLead.assignedTo ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300 w-fit">
                        <UserCheck className="w-3 h-3 mr-1" />
                        {selectedLead.assignedTo}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 w-fit">
                        Unassigned
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">Created</p>
                    <p className="font-medium text-sm">{formatDate(selectedLead.createdAt)}</p>
                  </div>
                </div>

                {/* Assignment History for this lead */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-3">Assignment History</p>
                  <div className="space-y-2">
                    {assignmentHistory
                      .filter(h => h.leadId === selectedLead.id)
                      .map(entry => (
                        <div key={entry.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            {entry.fromUser && (
                              <>
                                <span className="text-gray-600">{entry.fromUser}</span>
                                <ArrowRight className="w-3 h-3" />
                              </>
                            )}
                            <span className="font-medium text-green-600">{entry.toUser}</span>
                          </div>
                          {entry.notes && <p className="text-xs text-gray-600 mb-1">"{entry.notes}"</p>}
                          <p className="text-xs text-gray-500">{formatDate(entry.assignedAt)} by {entry.assignedBy}</p>
                        </div>
                      ))}
                    {assignmentHistory.filter(h => h.leadId === selectedLead.id).length === 0 && (
                      <p className="text-xs text-gray-500">No assignment history</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setDetailDialogOpen(false);
                if (selectedLead) openReassignDialog(selectedLead);
              }} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                {selectedLead?.assignedTo ? 'Reassign' : 'Assign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
