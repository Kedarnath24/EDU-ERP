import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, Users, TrendingUp, Award, Plus, Search, Filter,
  Phone, Mail, Calendar, MessageCircle, Send, Clock, Edit,
  CheckCircle, XCircle, AlertCircle, BarChart3, Zap, User, 
  Settings, GitBranch, Flag, MapPin, Paperclip, Trash2, Eye, 
  ArrowRight, Upload, FileText, X, ChevronDown, MoreVertical,
  Grid3x3, Columns3, LayoutGrid, Star, Flame, Download, Import,
  Bell, Activity, SlidersHorizontal, Tag as TagIcon, DollarSign,
  Building2, Globe, Linkedin, Twitter, Facebook, Video, Copy,
  CheckCheck, AlertTriangle, Sparkles, Brain, TrendingDown,
  ArrowUpRight, ArrowDownRight, Clock3, Users2, FileCheck,
  MessageSquare, PlusCircle, Save, Briefcase, MapPinned, History,
  Loader2, ExternalLink, PhoneCall, RotateCw, ListChecks, Archive,
  CalendarClock, BookOpen
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import WorkflowGuide from "@/components/crm/WorkflowGuide";
import QuickActionsPanel from "@/components/crm/QuickActionsPanel";
import LeadJourney from "@/components/crm/LeadJourney";
import EmailTemplateDialog from "@/components/crm/EmailTemplateDialog";
import {
  LeadStatus,
  LEAD_STATUS_CONFIG,
  LEAD_STATUS_LABELS,
  getStatusLabel,
  getAllStatusesSorted
} from "@/lib/lead-status-config";

// ==================== TYPES ====================
interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  addedDate: string;
}

interface Activity {
  id: string;
  type: "email" | "call" | "meeting" | "status_change" | "note" | "task";
  title: string;
  description: string;
  timestamp: string;
  user: string;
  icon?: any;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
  assignedTo: string;
}

interface Note {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

interface Reminder {
  id: string;
  date: string;
  time: string;
  message: string;
  createdBy: string;
  createdAt: string;
  completed?: boolean;
  priority?: "high" | "medium" | "low";
  category?: string;
  notifyBefore?: number; // minutes before to notify
  snoozedUntil?: string;
  status: "pending" | "completed" | "cancelled" | "rescheduled";
  recurrence: "once" | "daily" | "weekly" | "monthly";
  cancellationReason?: string;
  parentReminderId?: string;
  rescheduledCount: number;
  rescheduledTo?: string;
}

interface ProposalLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Proposal {
  id: string;
  title: string;
  version: number;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected";
  lineItems: ProposalLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  sentAt?: string | null;
  viewedAt?: string;
  respondedAt?: string;
  validUntil?: string;
}

type CallStatus = "not_called" | "called" | "no_answer" | "interested" | "not_interested";

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  priority: "high" | "medium" | "low";
  assignedTo: string;
  createdDate: string;
  lastContact: string;
  tags?: string[];
  address?: string;
  position?: string;
  city?: string;
  state?: string;
  website?: string;
  country?: string;
  zipCode?: string;
  leadValue?: number;
  leadScore?: number; // 0-100
  temperature?: "cold" | "warm" | "hot";
  defaultLanguage?: string;
  description?: string;
  dateContacted?: string;
  isPublic?: boolean;
  contactedToday?: boolean;
  attachments?: Attachment[];
  activities?: Activity[];
  tasks?: Task[];
  notes?: Note[];
  aiSummary?: string;
  // New fields for enhanced lead management
  industry?: string;
  companySize?: string;
  budget?: number;
  decisionTimeline?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  facebookPage?: string;
  alternatePhone?: string;
  alternateEmail?: string;
  preferredContactMethod?: "email" | "phone" | "linkedin" | "meeting";
  lastActivity?: string;
  nextFollowUp?: string;
  campaignSource?: string;
  referredBy?: string;
  // Enhanced lead management fields
  callStatus?: CallStatus;
  reminders?: Reminder[];
  proposals?: Proposal[];
}

type ViewMode = "table" | "kanban" | "grid";
type LeadFilterTab = "all" | "my" | "new" | "recent" | "hot" | "qualified" | "won" | "lost";

// ==================== COMPONENT ====================
export default function LeadsModule() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [leadFilterTab, setLeadFilterTab] = useState<LeadFilterTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("overview");
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const [emailDialogLead, setEmailDialogLead] = useState<Lead | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [assignedFilter, setAssignedFilter] = useState<string[]>([]);
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Lead Report states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDateRange, setReportDateRange] = useState<"today" | "week" | "month" | "year" | "custom">("month");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);

  // Demo data
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      company: "TechCorp Solutions",
      email: "sarah.j@techcorp.com",
      phone: "+1 (555) 123-4567",
      source: "Website",
      status: "counselling_done" as LeadStatus,
      priority: "high",
      assignedTo: "John Smith",
      createdDate: "Feb 10, 2026",
      lastContact: "2 hours ago",
      leadValue: 50000,
      leadScore: 85,
      temperature: "hot",
      position: "VP of Sales",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      tags: ["Enterprise", "SaaS", "High Priority"],
      aiSummary: "Sarah Johnson is VP of Sales at TechCorp Solutions. High-value enterprise lead with strong buying signals. Recently engaged with pricing page and requested demo.",
      activities: [
        {
          id: "a1",
          type: "email",
          title: "Email sent",
          description: "Sent pricing proposal",
          timestamp: "2 hours ago",
          user: "John Smith"
        },
        {
          id: "a2",
          type: "meeting",
          title: "Demo scheduled",
          description: "Product demo scheduled for Feb 15",
          timestamp: "1 day ago",
          user: "John Smith"
        },
        {
          id: "a3",
          type: "status_change",
          title: "Status changed",
          description: "Changed from Contacted to Qualified",
          timestamp: "2 days ago",
          user: "John Smith"
        }
      ],
      tasks: [
        {
          id: "t1",
          title: "Follow up on proposal",
          dueDate: "Feb 14, 2026",
          priority: "high",
          completed: false,
          assignedTo: "John Smith"
        },
        {
          id: "t2",
          title: "Prepare demo environment",
          dueDate: "Feb 15, 2026",
          priority: "medium",
          completed: false,
          assignedTo: "John Smith"
        }
      ],
      notes: [
        {
          id: "n1",
          content: "Very interested in enterprise plan. Mentioned they're evaluating 3 solutions.",
          createdBy: "John Smith",
          createdAt: "Feb 12, 2026 at 3:45 PM"
        }
      ],
      proposals: [
        {
          id: "PROP-001",
          title: "Enterprise ERP Solution Package",
          status: "sent",
          version: 1,
          lineItems: [
            {
              id: "item-1",
              description: "ERP Software License - Annual Subscription (50 users)",
              quantity: 1,
              unitPrice: 25000,
              total: 25000
            },
            {
              id: "item-2",
              description: "Implementation & Setup Services",
              quantity: 1,
              unitPrice: 15000,
              total: 15000
            },
            {
              id: "item-3",
              description: "Training Sessions (5 days on-site)",
              quantity: 5,
              unitPrice: 1000,
              total: 5000
            },
            {
              id: "item-4",
              description: "Premium Support Package (1 year)",
              quantity: 1,
              unitPrice: 5000,
              total: 5000
            }
          ],
          subtotal: 50000,
          tax: 5000,
          total: 55000,
          notes: "Enterprise package with complete setup, training, and premium support. Price includes migration from existing system.",
          createdBy: "John Smith",
          createdAt: "Feb 11, 2026",
          sentAt: "Feb 11, 2026 at 2:30 PM",
          validUntil: "Mar 15, 2026"
        },
        {
          id: "PROP-002",
          title: "Add-on: Advanced Analytics Module",
          status: "draft",
          version: 1,
          lineItems: [
            {
              id: "item-1",
              description: "Advanced Analytics & Reporting Module",
              quantity: 1,
              unitPrice: 8000,
              total: 8000
            },
            {
              id: "item-2",
              description: "Custom Dashboard Development",
              quantity: 3,
              unitPrice: 1500,
              total: 4500
            }
          ],
          subtotal: 12500,
          tax: 1250,
          total: 13750,
          notes: "Optional add-on for advanced analytics capabilities. Can be purchased separately or bundled.",
          createdBy: "John Smith",
          createdAt: "Feb 13, 2026",
          sentAt: null,
          validUntil: "Mar 15, 2026"
        }
      ],
      reminders: [
        {
          id: "rem-1",
          date: "2026-02-21",
          time: "10:00",
          message: "Follow up on pricing proposal - discuss implementation timeline",
          priority: "high",
          category: "follow-up",
          notifyBefore: 30,
          recurrence: "once",
          createdBy: "John Smith",
          createdAt: "Feb 18, 2026 at 9:15 AM",
          completed: false,
          status: "pending",
          rescheduledCount: 0
        },
        {
          id: "rem-2",
          date: "2026-02-15",
          time: "14:00",
          message: "Send product demo preparation email",
          priority: "medium",
          category: "email",
          notifyBefore: 60,
          recurrence: "once",
          createdBy: "John Smith",
          createdAt: "Feb 13, 2026 at 11:30 AM",
          completed: true,
          status: "completed",
          rescheduledCount: 0
        },
        {
          id: "rem-3",
          date: "2026-02-25",
          time: "15:30",
          message: "Weekly check-in call with Sarah - discuss any concerns",
          priority: "medium",
          category: "meeting",
          notifyBefore: 1440,
          recurrence: "weekly",
          createdBy: "John Smith",
          createdAt: "Feb 12, 2026 at 3:00 PM",
          completed: false,
          status: "pending",
          rescheduledCount: 1
        }
      ]
    },
    {
      id: "2",
      name: "Michael Chen",
      company: "Startup Inc",
      email: "m.chen@startup.io",
      phone: "+1 (555) 234-5678",
      source: "LinkedIn",
      status: "new_lead" as LeadStatus,
      priority: "medium",
      assignedTo: "Emily Davis",
      createdDate: "Feb 11, 2026",
      lastContact: "5 hours ago",
      leadValue: 15000,
      leadScore: 45,
      temperature: "warm",
      position: "Founder & CEO",
      city: "Austin",
      state: "TX",
      country: "USA",
      tags: ["Startup", "SMB"],
      aiSummary: "Michael Chen is Founder at Startup Inc. Mid-value startup lead. Initial contact made via LinkedIn. Needs follow-up.",
      activities: [],
      tasks: [],
      notes: [],
      reminders: [
        {
          id: "rem-6",
          date: "2026-02-21",
          time: "11:00",
          message: "Initial follow-up call to discuss ERP needs and timeline",
          priority: "high",
          category: "follow-up",
          notifyBefore: 15,
          recurrence: "once",
          createdBy: "Emily Davis",
          createdAt: "Feb 19, 2026 at 4:30 PM",
          completed: false,
          status: "pending",
          rescheduledCount: 0
        },
        {
          id: "rem-7",
          date: "2026-02-23",
          time: "14:00",
          message: "Send product brochure and pricing information",
          priority: "medium",
          category: "email",
          notifyBefore: 30,
          recurrence: "once",
          createdBy: "Emily Davis",
          createdAt: "Feb 19, 2026 at 4:35 PM",
          completed: false,
          status: "pending",
          rescheduledCount: 0
        }
      ]
    },
    {
      id: "3",
      name: "Emma Rodriguez",
      company: "Global Manufacturing Co",
      email: "e.rodriguez@global-mfg.com",
      phone: "+1 (555) 345-6789",
      source: "Referral",
      status: "interested" as LeadStatus,
      priority: "high",
      assignedTo: "John Smith",
      createdDate: "Feb 8, 2026",
      lastContact: "1 day ago",
      leadValue: 120000,
      leadScore: 92,
      temperature: "hot",
      position: "Director of Operations",
      city: "Chicago",
      state: "IL",
      country: "USA",
      tags: ["Manufacturing", "Enterprise", "Referral"],
      aiSummary: "Emma Rodriguez is Director of Operations at Global Manufacturing. High-value referral lead with urgent timeline. Proposal sent, awaiting response.",
      activities: [],
      tasks: [],
      notes: [],
      proposals: [
        {
          id: "PROP-003",
          title: "Complete Manufacturing ERP Solution",
          status: "viewed",
          version: 2,
          lineItems: [
            {
              id: "item-1",
              description: "Manufacturing ERP Suite - Enterprise License (200 users)",
              quantity: 1,
              unitPrice: 85000,
              total: 85000
            },
            {
              id: "item-2",
              description: "Supply Chain Management Module",
              quantity: 1,
              unitPrice: 15000,
              total: 15000
            },
            {
              id: "item-3",
              description: "Quality Control & Compliance Module",
              quantity: 1,
              unitPrice: 12000,
              total: 12000
            },
            {
              id: "item-4",
              description: "Implementation Services (Full deployment)",
              quantity: 1,
              unitPrice: 25000,
              total: 25000
            },
            {
              id: "item-5",
              description: "Training & Documentation",
              quantity: 10,
              unitPrice: 800,
              total: 8000
            },
            {
              id: "item-6",
              description: "12-Month Premium Support & Maintenance",
              quantity: 1,
              unitPrice: 10000,
              total: 10000
            }
          ],
          subtotal: 155000,
          tax: 15500,
          total: 170500,
          notes: "Comprehensive manufacturing solution with all modules included. Revised proposal with extended support period and additional training sessions based on client feedback.",
          createdBy: "Emily Davis",
          createdAt: "Feb 8, 2026",
          sentAt: "Feb 9, 2026 at 11:00 AM",
          validUntil: "Mar 10, 2026"
        }
      ],
      reminders: [
        {
          id: "rem-4",
          date: "2026-02-22",
          time: "09:00",
          message: "Follow up on proposal - check if they have questions",
          priority: "high",
          category: "follow-up",
          notifyBefore: 15,
          recurrence: "once",
          createdBy: "Emily Davis",
          createdAt: "Feb 17, 2026 at 2:15 PM",
          completed: false,
          status: "pending",
          rescheduledCount: 0
        },
        {
          id: "rem-5",
          date: "2026-02-16",
          time: "16:00",
          message: "Call to discuss contract terms",
          priority: "high",
          category: "meeting",
          notifyBefore: 30,
          recurrence: "once",
          createdBy: "Emily Davis",
          createdAt: "Feb 14, 2026 at 10:00 AM",
          completed: false,
          status: "cancelled",
          cancellationReason: "Client requested to postpone",
          rescheduledCount: 1,
          rescheduledTo: "rem-4"
        }
      ]
    },
    {
      id: "4",
      name: "David Park",
      company: "E-Commerce Plus",
      email: "d.park@ecomplus.com",
      phone: "+1 (555) 456-7890",
      source: "Trade Show",
      status: "contacted",
      priority: "medium",
      assignedTo: "Emily Davis",
      createdDate: "Feb 9, 2026",
      lastContact: "3 days ago",
      leadValue: 30000,
      leadScore: 62,
      temperature: "warm",
      position: "CTO",
      city: "Seattle",
      state: "WA",
      country: "USA",
      tags: ["E-Commerce", "Tech"],
      aiSummary: "David Park is CTO at E-Commerce Plus. Met at recent trade show. Moderate interest, needs nurturing.",
      activities: [],
      tasks: [],
      notes: [],
      reminders: [
        {
          id: "rem-8",
          date: "2026-02-20",
          time: "16:00",
          message: "URGENT: Follow up on inventory management demo request",
          priority: "high",
          category: "follow-up",
          notifyBefore: 60,
          recurrence: "once",
          createdBy: "Emily Davis",
          createdAt: "Feb 18, 2026 at 11:00 AM",
          completed: false,
          status: "pending",
          rescheduledCount: 0
        },
        {
          id: "rem-9",
          date: "2026-02-24",
          time: "10:30",
          message: "Schedule product demo - inventory module focus",
          priority: "high",
          category: "demo",
          notifyBefore: 1440,
          recurrence: "once",
          createdBy: "Emily Davis",
          createdAt: "Feb 19, 2026 at 2:00 PM",
          completed: false,
          status: "pending",
          rescheduledCount: 0
        },
        {
          id: "rem-10",
          date: "2026-03-01",
          time: "15:00",
          message: "Weekly check-in call with David",
          priority: "medium",
          category: "meeting",
          notifyBefore: 120,
          recurrence: "weekly",
          createdBy: "Emily Davis",
          createdAt: "Feb 19, 2026 at 3:15 PM",
          completed: false,
          status: "pending",
          rescheduledCount: 0
        }
      ]
    },
    {
      id: "5",
      name: "Lisa Anderson",
      company: "Healthcare Solutions",
      email: "l.anderson@healthsol.com",
      phone: "+1 (555) 567-8901",
      source: "Cold Call",
      status: "negotiation",
      priority: "high",
      assignedTo: "John Smith",
      createdDate: "Feb 5, 2026",
      lastContact: "Just now",
      leadValue: 85000,
      leadScore: 88,
      temperature: "hot",
      position: "VP of Technology",
      city: "Boston",
      state: "MA",
      country: "USA",
      tags: ["Healthcare", "Enterprise", "Hot Lead"],
      aiSummary: "Lisa Anderson is VP of Technology at Healthcare Solutions. In final negotiation stage. Price negotiation ongoing.",
      activities: [],
      tasks: [],
      notes: [],
      proposals: [
        {
          id: "PROP-004",
          title: "Healthcare Management System - Enterprise",
          status: "accepted",
          version: 3,
          lineItems: [
            {
              id: "item-1",
              description: "Healthcare ERP Platform (150 users)",
              quantity: 1,
              unitPrice: 65000,
              total: 65000
            },
            {
              id: "item-2",
              description: "Patient Management Module",
              quantity: 1,
              unitPrice: 12000,
              total: 12000
            },
            {
              id: "item-3",
              description: "HIPAA Compliance & Security Package",
              quantity: 1,
              unitPrice: 8000,
              total: 8000
            },
            {
              id: "item-4",
              description: "Data Migration & Integration Services",
              quantity: 1,
              unitPrice: 15000,
              total: 15000
            },
            {
              id: "item-5",
              description: "24/7 Support Package (Annual)",
              quantity: 1,
              unitPrice: 12000,
              total: 12000
            }
          ],
          subtotal: 112000,
          tax: 11200,
          total: 123200,
          notes: "Final negotiated price with 10% discount applied. Includes priority implementation timeline and extended warranty. Client accepted on Feb 15, 2026.",
          createdBy: "John Smith",
          createdAt: "Feb 5, 2026",
          sentAt: "Feb 12, 2026 at 9:15 AM",
          validUntil: "Mar 5, 2026"
        }
      ],
      reminders: [
        {
          id: "rem-11",
          date: "2026-02-21",
          time: "09:00",
          message: "Call to finalize contract signing and implementation schedule",
          priority: "high",
          category: "meeting",
          notifyBefore: 30,
          recurrence: "once",
          createdBy: "John Smith",
          createdAt: "Feb 19, 2026 at 5:00 PM",
          completed: false,
          status: "pending",
          rescheduledCount: 0
        },
        {
          id: "rem-12",
          date: "2026-02-22",
          time: "14:00",
          message: "Send contract documents for legal review",
          priority: "high",
          category: "email",
          notifyBefore: 60,
          recurrence: "once",
          createdBy: "John Smith",
          createdAt: "Feb 19, 2026 at 5:05 PM",
          completed: false,
          status: "pending",
          rescheduledCount: 0
        },
        {
          id: "rem-13",
          date: "2026-02-18",
          time: "10:00",
          message: "Sent compliance documentation and security certifications",
          priority: "medium",
          category: "email",
          notifyBefore: 15,
          recurrence: "once",
          createdBy: "John Smith",
          createdAt: "Feb 17, 2026 at 3:00 PM",
          completed: true,
          status: "completed",
          rescheduledCount: 0
        }
      ]
    }
  ]);

  // ==================== COMPUTED VALUES ====================
  const filteredLeads = leads.filter(lead => {
    // Apply tab filter first
    let matchesTab = true;
    const currentUser = "John Smith"; // In real app, get from auth context
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);
    
    switch (leadFilterTab) {
      case "my":
        matchesTab = lead.assignedTo === currentUser;
        break;
      case "new":
        matchesTab = lead.status === "new";
        break;
      case "recent":
        // Leads with activity in last 3 days
        const leadDate = new Date(lead.lastContact || lead.createdDate);
        matchesTab = leadDate >= threeDaysAgo;
        break;
      case "hot":
        matchesTab = lead.temperature === "hot";
        break;
      case "qualified":
        matchesTab = lead.status === "qualified";
        break;
      case "won":
        matchesTab = lead.status === "won";
        break;
      case "lost":
        matchesTab = lead.status === "lost";
        break;
      case "all":
      default:
        matchesTab = true;
    }
    
    const matchesSearch = 
      (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(lead.status);
    const matchesSource = sourceFilter.length === 0 || sourceFilter.includes(lead.source);
    const matchesAssigned = assignedFilter.length === 0 || assignedFilter.includes(lead.assignedTo);
    const matchesScore = (lead.leadScore || 0) >= scoreRange[0] && (lead.leadScore || 0) <= scoreRange[1];

    return matchesTab && matchesSearch && matchesStatus && matchesSource && matchesAssigned && matchesScore;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === "new").length,
    qualified: leads.filter(l => l.status === "qualified").length,
    won: leads.filter(l => l.status === "won").length,
    avgScore: Math.round(leads.reduce((sum, l) => sum + (l.leadScore || 0), 0) / leads.length),
    totalValue: leads.reduce((sum, l) => sum + (l.leadValue || 0), 0),
    hotLeads: leads.filter(l => l.temperature === "hot").length,
  };

  // ==================== HANDLERS ====================
  const openDetailModal = (lead: Lead) => {
    setSelectedLead(lead);
    setActiveDetailTab("overview");
    setDetailModalOpen(true);
  };

  const openAddLeadModal = () => {
    setFormData({
      status: "new",
      priority: "medium",
      assignedTo: "John Smith",
      country: "USA",
      temperature: "warm",
      leadScore: 50,
    });
    setTags([]);
    setTagsInput("");
    setAddLeadModalOpen(true);
  };

  const openEditModal = (lead: Lead) => {
    setFormData({
      ...lead,
    });
    setTags(lead.tags || []);
    setSelectedLead(lead);
    setAddLeadModalOpen(true);
  };

  // Contact Actions
  const handleCall = (lead: Lead, e?: React.MouseEvent) => {
    e?.stopPropagation();
    console.log("📞 Initiating call to:", lead.name, lead.phone);
    
    if (!lead.phone) {
      toast({
        title: "⚠️ No Phone Number",
        description: `${lead.name} doesn't have a phone number on record.`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // In a real app, this would integrate with a phone system (Twilio, etc.)
    toast({
      title: "📞 Calling " + lead.name,
      description: `Dialing ${lead.phone}...`,
      duration: 4000,
    });

    // Add activity
    setLeads(prev => prev.map(l => {
      if (l.id === lead.id) {
        return {
          ...l,
          lastContact: "Just now",
          activities: [{
            id: String(Date.now()),
            type: "call" as const,
            title: "Phone Call",
            description: `Outbound call to ${lead.phone}`,
            timestamp: "Just now",
            user: "Current User"
          }, ...(l.activities || [])]
        };
      }
      return l;
    }));

    // Simulate opening phone dialer
    window.location.href = `tel:${lead.phone}`;
  };

  const handleEmail = (lead: Lead, e?: React.MouseEvent) => {
    e?.stopPropagation();
    console.log("📧 Opening email template for:", lead.name, lead.email);
    
    if (!lead.email) {
      toast({
        title: "⚠️ No Email Address",
        description: `${lead.name} doesn't have an email address on record.`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Open the enhanced email template dialog
    setEmailDialogLead(lead);
  };

  const handleSendEmail = (subject: string, body: string) => {
    if (!emailDialogLead) return;

    toast({
      title: "✉️ Opening Email Client",
      description: `Email draft ready for ${emailDialogLead.name}...`,
      duration: 3000,
    });

    // Add activity
    setLeads(prev => prev.map(l => {
      if (l.id === emailDialogLead.id) {
        return {
          ...l,
          lastContact: "Just now",
          activities: [{
            id: String(Date.now()),
            type: "email" as const,
            title: "Email Sent",
            description: `Email sent: ${subject}`,
            timestamp: "Just now",
            user: "Current User"
          }, ...(l.activities || [])]
        };
      }
      return l;
    }));

    // Open email client with pre-filled data
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    window.location.href = `mailto:${emailDialogLead.email}?subject=${encodedSubject}&body=${encodedBody}`;

    // Close dialog
    setEmailDialogLead(null);
  };

  const handleWhatsApp = (lead: Lead, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!lead.phone) {
      toast({
        title: "⚠️ No Phone Number",
        description: "Cannot open WhatsApp without a phone number.",
        variant: "destructive",
      });
      return;
    }

    const phoneNumber = lead.phone.replace(/\D/g, ''); // Remove non-digits
    const message = encodeURIComponent(`Hi ${lead.name.split(' ')[0]}, following up on your inquiry...`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    
    toast({
      title: "💬 Opening WhatsApp",
      description: `Messaging ${lead.name}...`,
      duration: 3000,
    });
  };

  // CRUD Actions
  const handleDelete = (leadId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) return;

    if (confirm(`Are you sure you want to delete ${lead.name}? This action cannot be undone.`)) {
      setLeads(prev => prev.filter(l => l.id !== leadId));
      
      toast({
        title: "🗑️ Lead Deleted",
        description: `${lead.name} has been removed from your leads.`,
        duration: 3000,
      });

      // Close detail modal if it's open for this lead
      if (selectedLead?.id === leadId) {
        setDetailModalOpen(false);
        setSelectedLead(null);
      }
    }
  };

  const handleDuplicate = (lead: Lead, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    const duplicatedLead: Lead = {
      ...lead,
      id: String(Date.now()),
      name: `${lead.name} (Copy)`,
      createdDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      lastContact: "Never",
      activities: [],
      tasks: [],
      notes: [],
    };

    setLeads(prev => [duplicatedLead, ...prev]);

    toast({
      title: "📋 Lead Duplicated",
      description: `Created a copy of ${lead.name}`,
      duration: 3000,
    });
  };

  // Import/Export
  const handleImport = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        toast({
          title: "📥 Importing Leads",
          description: `Processing ${file.name}...`,
          duration: 3000,
        });

        // In a real app, this would parse the CSV/Excel file
        // For now, just show success
        setTimeout(() => {
          toast({
            title: "✅ Import Complete",
            description: "Leads have been imported successfully.",
            duration: 3000,
          });
        }, 1500);
      }
    };
    
    input.click();
  };

  const handleExport = () => {
    const csvHeaders = "Name,Company,Email,Phone,Status,Source,Priority,Lead Value,Score,Assigned To\n";
    const csvData = filteredLeads.map(lead => 
      `"${lead.name}","${lead.company || ''}","${lead.email}","${lead.phone}","${lead.status}","${lead.source}","${lead.priority}","${lead.leadValue || 0}","${lead.leadScore || 0}","${lead.assignedTo}"`
    ).join('\n');
    
    const csv = csvHeaders + csvData;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "📥 Export Complete",
      description: `Exported ${filteredLeads.length} leads to CSV`,
      duration: 3000,
    });
  };

  // Report Generation Functions
  const getReportDateRange = () => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (reportDateRange) {
      case "today":
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date(today.setHours(23, 59, 59, 999));
        break;
      case "week":
        const dayOfWeek = today.getDay();
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case "custom":
        if (reportStartDate && reportEndDate) {
          startDate = new Date(reportStartDate);
          endDate = new Date(reportEndDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
    }

    return { startDate, endDate };
  };

  const parseLeadDate = (dateStr: string): Date => {
    // Handle various date formats: "Feb 10, 2026", "2 hours ago", etc.
    if (dateStr.includes("ago")) {
      const now = new Date();
      if (dateStr.includes("hour")) return now;
      if (dateStr.includes("day")) {
        const days = parseInt(dateStr);
        now.setDate(now.getDate() - days);
        return now;
      }
      return now;
    }
    return new Date(dateStr);
  };

  const getFilteredLeadsForReport = () => {
    const { startDate, endDate } = getReportDateRange();
    return leads.filter(lead => {
      const leadDate = parseLeadDate(lead.createdDate);
      return leadDate >= startDate && leadDate <= endDate;
    });
  };

  const generateReportStatistics = () => {
    const reportLeads = getFilteredLeadsForReport();
    const totalLeads = reportLeads.length;
    const totalValue = reportLeads.reduce((sum, lead) => sum + (lead.leadValue || 0), 0);
    const avgLeadScore = totalLeads > 0 
      ? reportLeads.reduce((sum, lead) => sum + (lead.leadScore || 0), 0) / totalLeads 
      : 0;

    const statusBreakdown = reportLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sourceBreakdown = reportLeads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const temperatureBreakdown = reportLeads.reduce((acc, lead) => {
      const temp = lead.temperature || "cold";
      acc[temp] = (acc[temp] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const wonLeads = reportLeads.filter(l => l.status === "won").length;
    const lostLeads = reportLeads.filter(l => l.status === "lost").length;
    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0";

    return {
      totalLeads,
      totalValue,
      avgLeadScore: avgLeadScore.toFixed(1),
      statusBreakdown,
      sourceBreakdown,
      temperatureBreakdown,
      wonLeads,
      lostLeads,
      conversionRate,
      reportLeads
    };
  };

  const handleExportReport = () => {
    setGeneratingReport(true);
    
    setTimeout(() => {
      const { reportLeads, ...stats } = generateReportStatistics();
      const { startDate, endDate } = getReportDateRange();
      
      const csvHeaders = "Name,Company,Email,Phone,Status,Source,Priority,Lead Value,Score,Temperature,Assigned To,Created Date\n";
      const csvData = reportLeads.map(lead => 
        `"${lead.name}","${lead.company || ''}","${lead.email}","${lead.phone}","${lead.status}","${lead.source}","${lead.priority}","${lead.leadValue || 0}","${lead.leadScore || 0}","${lead.temperature || 'cold'}","${lead.assignedTo}","${lead.createdDate}"`
      ).join('\n');
      
      const csv = csvHeaders + csvData;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lead-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      setGeneratingReport(false);
      toast({
        title: "📊 Report Exported",
        description: `Generated report for ${reportLeads.length} leads`,
        duration: 3000,
      });
    }, 500);
  };

  // Bulk Actions
  const handleBulkAssign = (assignTo: string) => {
    toast({
      title: "👥 Bulk Assignment",
      description: `This feature will assign selected leads to ${assignTo}`,
      duration: 3000,
    });
  };

  const handleBulkStatusChange = (newStatus: string) => {
    toast({
      title: "🔄 Status Update",
      description: `This feature will change status of selected leads to ${newStatus}`,
      duration: 3000,
    });
  };

  const handleBulkAddTags = () => {
    toast({
      title: "🏷️ Bulk Tag Addition",
      description: "This feature will add tags to selected leads",
      duration: 3000,
    });
  };

  const handleBulkDelete = () => {
    if (confirm("Are you sure you want to delete the selected leads?")) {
      toast({
        title: "🗑️ Bulk Delete",
        description: "Selected leads will be deleted",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const createLeadObject = (): Lead => {
    return {
      id: String(Date.now()),
      name: formData.name || "",
      company: formData.company || "",
      email: formData.email || "",
      phone: formData.phone || "",
      source: formData.source || "",
      status: (formData.status as Lead["status"]) || "new",
      priority: (formData.priority as Lead["priority"]) || "medium",
      assignedTo: formData.assignedTo || "John Smith",
      createdDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      lastContact: "Just now",
      leadValue: formData.leadValue,
      leadScore: formData.leadScore || 50,
      temperature: (formData.temperature as Lead["temperature"]) || "warm",
      position: formData.position,
      city: formData.city,
      state: formData.state,
      country: formData.country || "USA",
      website: formData.website,
      zipCode: formData.zipCode,
      address: formData.address,
      description: formData.description,
      tags,
      activities: [],
      tasks: [],
      notes: [],
    };
  };

  const resetForm = () => {
    setFormData({
      status: "new",
      priority: "medium",
      assignedTo: "John Smith",
      country: "USA",
      temperature: "warm",
      leadScore: 50,
    });
    setTags([]);
    setTagsInput("");
  };

  const saveNewLead = async () => {
    const isEditing = !!formData.id;
    console.log(isEditing ? "✏️ saveNewLead (EDIT MODE)" : "🔥 saveNewLead (CREATE MODE)", { formData, name: formData.name, source: formData.source });
    
    if (!formData.name || !formData.source) {
      console.log("❌ Validation failed", { name: formData.name, source: formData.source });
      
      // Scroll to top to show required fields
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = 0;
      }
      
      toast({
        title: "⚠️ Missing Required Fields",
        description: !formData.name && !formData.source 
          ? "Please fill in both Full Name and Lead Source to continue." 
          : !formData.name 
          ? "Please enter the lead's Full Name."
          : "Please select where this lead came from (Lead Source).",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    console.log("✅ Validation passed, starting to save...");
    setIsSaving(true);
    
    try {
      // Small delay for UX (shows loading state)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (isEditing) {
        // UPDATE existing lead
        console.log("📝 Updating existing lead:", formData.id);
        setLeads(prev => prev.map(l => {
          if (l.id === formData.id) {
            return {
              ...l,
              ...formData,
              tags: tags,
            };
          }
          return l;
        }));
        
        console.log("🎉 Lead update complete!");
        toast({
          title: "✅ Lead Updated Successfully!",
          description: `${formData.name} has been updated.`,
          duration: 3000,
        });
      } else {
        // CREATE new lead
        console.log("💾 Creating new lead object...");
        const newLead = createLeadObject();
        console.log("📝 New lead created:", newLead);
        
        setLeads(prev => {
          console.log("📋 Current leads count:", prev.length);
          const updated = [newLead, ...prev];
          console.log("📋 Updated leads count:", updated.length);
          return updated;
        });
        
        console.log("🎉 Lead save complete!");
        toast({
          title: "✨ Lead Created Successfully!",
          description: `${newLead.name} from ${newLead.company || 'Unknown Company'} has been added to your pipeline.`,
          duration: 5000,
        });
      }
      
      // Close modal and reset
      setAddLeadModalOpen(false);
      resetForm();
      setSelectedLead(null);
      
    } catch (error) {
      console.error("❌ Error saving lead:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} lead. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveAndAddAnother = async () => {
    console.log("🔄 saveAndAddAnother called", { formData });
    
    if (!formData.name || !formData.source) {
      // Scroll to top to show required fields
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = 0;
      }
      
      toast({
        title: "⚠️ Missing Required Fields",
        description: !formData.name && !formData.source 
          ? "Please fill in both Full Name and Lead Source to continue." 
          : !formData.name 
          ? "Please enter the lead's Full Name."
          : "Please select where this lead came from (Lead Source).",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create lead
      const newLead = createLeadObject();
      console.log("📝 New lead created:", newLead);
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setLeads(prev => [newLead, ...prev]);
      
      // Reset form but keep modal open
      resetForm();
      
      // Success toast
      toast({
        title: "✅ Lead Saved!",
        description: `${newLead.name} has been saved. Ready to add another lead.`,
        duration: 3000,
      });
      
      // Scroll to top of form
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = 0;
      }
      
      console.log("🎉 Lead saved, ready for next entry");
    } catch (error) {
      console.error("❌ Error saving lead:", error);
      toast({
        title: "Error",
        description: "Failed to create lead. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = (value: string) => {
    const v = value.trim();
    if (!v || tags.includes(v)) return;
    setTags(prev => [...prev, v]);
    setTagsInput("");
  };

  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagsInput);
    } else if (e.key === "Backspace" && tagsInput === "") {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const removeFilter = (type: string, value?: string) => {
    if (type === "status" && value) {
      setStatusFilter(prev => prev.filter(s => s !== value));
    } else if (type === "source" && value) {
      setSourceFilter(prev => prev.filter(s => s !== value));
    } else if (type === "assigned" && value) {
      setAssignedFilter(prev => prev.filter(s => s !== value));
    }
  };

  const clearAllFilters = () => {
    setStatusFilter([]);
    setSourceFilter([]);
    setAssignedFilter([]);
    setScoreRange([0, 100]);
    setSearchTerm("");
  };

  // ==================== HELPER FUNCTIONS ====================
  const getStatusColor = (status: string | LeadStatus) => {
    const config = LEAD_STATUS_CONFIG[status as LeadStatus];
    if (!config) return "bg-gray-500";
    
    // Return color hex value or convert to Tailwind class
    return config.bgColor.replace('bg-', 'bg-').replace('-50', '-500');
  };

  const getStatusColorText = (status: string | LeadStatus) => {
    const config = LEAD_STATUS_CONFIG[status as LeadStatus];
    if (!config) return "text-gray-600 bg-gray-50";
    
    return `${config.textColor} ${config.bgColor}`;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "text-red-600 bg-red-50 border-red-200",
      medium: "text-amber-600 bg-amber-50 border-amber-200",
      low: "text-gray-600 bg-gray-50 border-gray-200",
    };
    return colors[priority as keyof typeof colors] || "text-gray-600 bg-gray-50";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTemperatureIcon = (temp?: string) => {
    if (temp === "hot") return <Flame className="w-4 h-4 text-red-500" />;
    if (temp === "warm") return <TrendingUp className="w-4 h-4 text-yellow-500" />;
    return <TrendingDown className="w-4 h-4 text-blue-500" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // ==================== RENDER ====================
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">CRM</h1>
                <p className="text-sm sm:text-base text-gray-500 mt-1">Leads Management</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowWorkflowGuide(true)} 
                  className="hover:bg-purple-50 hover:border-purple-500"
                >
                  <BookOpen className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">View Workflow</span>
                </Button>
                <Link href="/leads/bulk-import">
                  <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-500">
                    <Import className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Import</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleExport} className="hover:bg-green-50 hover:border-green-500">
                  <Download className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Export</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowReportModal(true)} 
                  className="hover:bg-emerald-50 hover:border-emerald-500"
                >
                  <BarChart3 className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Lead Report</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hover:bg-purple-50 hover:border-purple-500">
                      <MoreVertical className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Bulk Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-xs text-gray-500 font-semibold">Bulk Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAssign("John Smith")}>
                      <User className="w-4 h-4 mr-2" />
                      Assign to user
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange("qualified")}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Change status
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBulkAddTags}>
                      <TagIcon className="w-4 h-4 mr-2" />
                      Add tags
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleBulkDelete} className="text-red-600 focus:text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={openAddLeadModal} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Lead</span>
                </Button>
              </div>
            </div>

            {/* Lead Filter Tabs - Step-by-Step Enhancement */}
            <div className="mb-6">
              {/* Mobile: Dropdown Selector */}
              <div className="block lg:hidden">
                <Select value={leadFilterTab} onValueChange={(value) => setLeadFilterTab(value as LeadFilterTab)}>
                  <SelectTrigger className="w-full h-12 border-2 border-gray-200 shadow-sm">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {leadFilterTab === "all" && <><Users className="w-4 h-4" /> All Leads ({leads.length})</>}
                        {leadFilterTab === "my" && <><User className="w-4 h-4" /> My Leads ({leads.filter(l => l.assignedTo === "John Smith").length})</>}
                        {leadFilterTab === "new" && <><Sparkles className="w-4 h-4" /> New Leads ({leads.filter(l => l.status === "new").length})</>}
                        {leadFilterTab === "recent" && <><Activity className="w-4 h-4" /> Recently Engaged</>}
                        {leadFilterTab === "hot" && <><Flame className="w-4 h-4" /> Hot Leads ({leads.filter(l => l.temperature === "hot").length})</>}
                        {leadFilterTab === "qualified" && <><CheckCircle className="w-4 h-4" /> Qualified ({leads.filter(l => l.status === "qualified").length})</>}
                        {leadFilterTab === "won" && <><Award className="w-4 h-4" /> Won ({leads.filter(l => l.status === "won").length})</>}
                        {leadFilterTab === "lost" && <><XCircle className="w-4 h-4" /> Lost ({leads.filter(l => l.status === "lost").length})</>}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> All Leads
                        <Badge variant="secondary" className="ml-2">{leads.length}</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="my">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" /> My Leads
                        <Badge variant="secondary" className="ml-2">{leads.filter(l => l.assignedTo === "John Smith").length}</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="new">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-green-600" /> New Leads
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">{leads.filter(l => l.status === "new").length}</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="recent">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-600" /> Recently Engaged
                      </div>
                    </SelectItem>
                    <SelectItem value="hot">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-red-600" /> Hot Leads
                        <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700">{leads.filter(l => l.temperature === "hot").length}</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="qualified">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-indigo-600" /> Qualified
                        <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700">{leads.filter(l => l.status === "qualified").length}</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="won">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600" /> Won
                        <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700">{leads.filter(l => l.status === "won").length}</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="lost">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-gray-600" /> Lost
                        <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-700">{leads.filter(l => l.status === "lost").length}</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop: Tab Navigation */}
              <div className="hidden lg:block bg-white rounded-lg border-2 border-gray-200 p-1 shadow-sm overflow-hidden">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {/* All Leads Tab */}
                  <button
                    onClick={() => setLeadFilterTab("all")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      leadFilterTab === "all"
                        ? "bg-blue-600 text-white shadow-md transform scale-105"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>All Leads</span>
                    <Badge variant="secondary" className={`ml-1 ${leadFilterTab === "all" ? "bg-blue-500 text-white border-0" : "bg-gray-200 text-gray-700"}`}>
                      {leads.length}
                    </Badge>
                  </button>

                  {/* My Leads Tab */}
                  <button
                    onClick={() => setLeadFilterTab("my")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      leadFilterTab === "my"
                        ? "bg-blue-600 text-white shadow-md transform scale-105"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>My Leads</span>
                    <Badge variant="secondary" className={`ml-1 ${leadFilterTab === "my" ? "bg-blue-500 text-white border-0" : "bg-gray-200 text-gray-700"}`}>
                      {leads.filter(l => l.assignedTo === "John Smith").length}
                    </Badge>
                  </button>

                  {/* New Leads Tab */}
                  <button
                    onClick={() => setLeadFilterTab("new")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      leadFilterTab === "new"
                        ? "bg-green-600 text-white shadow-md transform scale-105"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>New Leads</span>
                    <Badge variant="secondary" className={`ml-1 ${leadFilterTab === "new" ? "bg-green-500 text-white border-0" : "bg-green-100 text-green-700"}`}>
                      {leads.filter(l => l.status === "new").length}
                    </Badge>
                  </button>

                  {/* Recently Engaged Tab */}
                  <button
                    onClick={() => setLeadFilterTab("recent")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      leadFilterTab === "recent"
                        ? "bg-purple-600 text-white shadow-md transform scale-105"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Recently Engaged</span>
                    <Badge variant="secondary" className={`ml-1 ${leadFilterTab === "recent" ? "bg-purple-500 text-white border-0" : "bg-purple-100 text-purple-700"}`}>
                      {(() => {
                        const today = new Date();
                        const threeDaysAgo = new Date(today);
                        threeDaysAgo.setDate(today.getDate() - 3);
                        return leads.filter(l => {
                          const leadDate = new Date(l.lastContact || l.createdDate);
                          return leadDate >= threeDaysAgo;
                        }).length;
                      })()}
                    </Badge>
                  </button>

                  {/* Hot Leads Tab */}
                  <button
                    onClick={() => setLeadFilterTab("hot")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      leadFilterTab === "hot"
                        ? "bg-red-600 text-white shadow-md transform scale-105"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    <span>Hot Leads</span>
                    <Badge variant="secondary" className={`ml-1 ${leadFilterTab === "hot" ? "bg-red-500 text-white border-0" : "bg-red-100 text-red-700"}`}>
                      {leads.filter(l => l.temperature === "hot").length}
                    </Badge>
                  </button>

                  {/* Qualified Tab */}
                  <button
                    onClick={() => setLeadFilterTab("qualified")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      leadFilterTab === "qualified"
                        ? "bg-indigo-600 text-white shadow-md transform scale-105"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Qualified</span>
                    <Badge variant="secondary" className={`ml-1 ${leadFilterTab === "qualified" ? "bg-indigo-500 text-white border-0" : "bg-indigo-100 text-indigo-700"}`}>
                      {leads.filter(l => l.status === "qualified").length}
                    </Badge>
                  </button>

                  {/* Won Tab */}
                  <button
                    onClick={() => setLeadFilterTab("won")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      leadFilterTab === "won"
                        ? "bg-emerald-600 text-white shadow-md transform scale-105"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Won</span>
                    <Badge variant="secondary" className={`ml-1 ${leadFilterTab === "won" ? "bg-emerald-500 text-white border-0" : "bg-emerald-100 text-emerald-700"}`}>
                      {leads.filter(l => l.status === "won").length}
                    </Badge>
                  </button>

                  {/* Lost Tab */}
                  <button
                    onClick={() => setLeadFilterTab("lost")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      leadFilterTab === "lost"
                        ? "bg-gray-600 text-white shadow-md transform scale-105"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Lost</span>
                    <Badge variant="secondary" className={`ml-1 ${leadFilterTab === "lost" ? "bg-gray-500 text-white border-0" : "bg-gray-200 text-gray-700"}`}>
                      {leads.filter(l => l.status === "lost").length}
                    </Badge>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 md:gap-4 mb-6">
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-2">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs md:text-sm text-gray-600 font-medium mt-1">Total Leads</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-2">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.new}</p>
                  <p className="text-xs md:text-sm text-gray-600 font-medium mt-1">New</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-2">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.qualified}</p>
                  <p className="text-xs md:text-sm text-gray-600 font-medium mt-1">Qualified</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-2">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Award className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.won}</p>
                  <p className="text-xs md:text-sm text-gray-600 font-medium mt-1">Won</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-2">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <Flame className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.hotLeads}</p>
                  <p className="text-xs md:text-sm text-gray-600 font-medium mt-1">Hot Leads</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-2">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.avgScore}</p>
                  <p className="text-xs md:text-sm text-gray-600 font-medium mt-1">Avg Score</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-2">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                  <p className="text-sm text-gray-600">Total Value</p>
                </CardContent>
              </Card>
            </div>

            {/* Active Filter Indicator */}
            {leadFilterTab !== "all" && (
              <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                      {leadFilterTab === "my" && <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
                      {leadFilterTab === "new" && <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
                      {leadFilterTab === "recent" && <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />}
                      {leadFilterTab === "hot" && <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />}
                      {leadFilterTab === "qualified" && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />}
                      {leadFilterTab === "won" && <Award className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />}
                      {leadFilterTab === "lost" && <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Viewing:</p>
                      <p className="text-base sm:text-lg font-bold text-gray-900 truncate">
                        {leadFilterTab === "my" && "My Leads"}
                        {leadFilterTab === "new" && "New Leads"}
                        {leadFilterTab === "recent" && "Recently Engaged"}
                        {leadFilterTab === "hot" && "Hot Leads"}
                        {leadFilterTab === "qualified" && "Qualified Leads"}
                        {leadFilterTab === "won" && "Won Deals"}
                        {leadFilterTab === "lost" && "Lost Leads"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-initial text-left sm:text-right">
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{filteredLeads.length}</p>
                      <p className="text-xs text-gray-600">Leads in this view</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLeadFilterTab("all")}
                      className="hover:bg-white flex-shrink-0"
                    >
                      <X className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Clear Filter</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-11 bg-gray-50 border-gray-300 text-sm sm:text-base"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-10 sm:h-11 flex-1 sm:flex-initial"
                >
                  <SlidersHorizontal className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                  {(statusFilter.length + sourceFilter.length + assignedFilter.length) > 0 && (
                    <Badge className="ml-2 bg-blue-600">
                      {statusFilter.length + sourceFilter.length + assignedFilter.length}
                    </Badge>
                  )}
                </Button>
                <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1 bg-gray-50">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === "table" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("table")}
                          className="h-9"
                        >
                          <Columns3 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Table View</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === "kanban" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("kanban")}
                          className="h-9"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Kanban View</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === "grid" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                          className="h-9"
                        >
                          <Grid3x3 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Grid View</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Status</Label>
                    <Select onValueChange={(v) => setStatusFilter(prev => prev.includes(v) ? prev : [...prev, v])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAllStatusesSorted().map(status => (
                          <SelectItem key={status} value={status}>
                            {getStatusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Source</Label>
                    <Select onValueChange={(v) => setSourceFilter(prev => prev.includes(v) ? prev : [...prev, v])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Trade Show">Trade Show</SelectItem>
                        <SelectItem value="Cold Call">Cold Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Assigned To</Label>
                    <Select onValueChange={(v) => setAssignedFilter(prev => prev.includes(v) ? prev : [...prev, v])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="John Smith">John Smith</SelectItem>
                        <SelectItem value="Emily Davis">Emily Davis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Lead Score Range</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={scoreRange[0]}
                        onChange={(e) => setScoreRange([parseInt(e.target.value) || 0, scoreRange[1]])}
                        className="w-20"
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={scoreRange[1]}
                        onChange={(e) => setScoreRange([scoreRange[0], parseInt(e.target.value) || 100])}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Filters */}
                {(statusFilter.length + sourceFilter.length + assignedFilter.length) > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Active filters:</span>
                    {statusFilter.map(status => (
                      <Badge key={status} variant="secondary" className="gap-1">
                        Status: {status}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("status", status)} />
                      </Badge>
                    ))}
                    {sourceFilter.map(source => (
                      <Badge key={source} variant="secondary" className="gap-1">
                        Source: {source}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("source", source)} />
                      </Badge>
                    ))}
                    {assignedFilter.map(assigned => (
                      <Badge key={assigned} variant="secondary" className="gap-1">
                        Assigned: {assigned}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("assigned", assigned)} />
                      </Badge>
                    ))}
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6">
                      Clear all
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-3 sm:p-4 md:p-6">
          {/* TABLE VIEW */}
          {viewMode === "table" && (
            <div className="space-y-3">
              {filteredLeads.map(lead => (
                <Card 
                  key={lead.id} 
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 bg-white"
                  onClick={() => openDetailModal(lead)}
                >
                  <CardContent className="p-3 sm:p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 md:gap-6">
                      {/* Avatar & Name */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <Avatar className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {getInitials(lead.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-container">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-base truncate flex-1 min-w-0" title={lead.name}>{lead.name}</h3>
                            {lead.temperature && <span className="flex-shrink-0">{getTemperatureIcon(lead.temperature)}</span>}
                          </div>
                          <p className="text-sm text-gray-600 truncate" title={lead.company}>{lead.company}</p>
                          <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1 min-w-0">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[150px]" title={lead.email}>{lead.email}</span>
                            </span>
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span>{lead.phone}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tags & Badges */}
                      <div className="hidden lg:flex items-center gap-2 flex-wrap max-w-[200px] xl:max-w-xs flex-shrink-0">
                        <Badge className={`${getStatusColor(lead.status)} text-white font-medium capitalize flex-shrink-0`}>
                          {lead.status}
                        </Badge>
                        <Badge variant="outline" className={`${getPriorityColor(lead.priority)} flex-shrink-0`}>
                          {lead.priority}
                        </Badge>
                        {lead.tags?.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs flex-shrink-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Score */}
                      <div className="hidden md:flex flex-col items-center text-center min-w-[80px] flex-shrink-0">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <div className={`text-2xl font-bold ${getScoreColor(lead.leadScore || 0)}`}>
                            {lead.leadScore}
                          </div>
                        </div>
                        <Progress value={lead.leadScore} className="h-2 w-16 mx-auto" />
                        <p className="text-xs text-gray-500 mt-1">Score</p>
                      </div>

                      {/* Value */}
                      <div className="hidden sm:flex flex-col items-end text-right min-w-[100px] flex-shrink-0">
                        <p className="text-base sm:text-lg font-bold text-green-600">
                          {formatCurrency(lead.leadValue || 0)}
                        </p>
                        <p className="text-xs text-gray-500">Lead Value</p>
                      </div>

                      {/* Assigned */}
                      <div className="hidden xl:flex flex-col items-center text-center min-w-[100px] max-w-[120px] flex-shrink-0">
                        <Avatar className="w-8 h-8 mx-auto mb-1">
                          <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                            {getInitials(lead.assignedTo)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs text-gray-600 truncate max-w-full" title={lead.assignedTo}>{lead.assignedTo}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => handleCall(lead, e)}
                                className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Call {lead.name}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => handleEmail(lead, e)}
                                className="h-9 w-9 hover:bg-purple-50 hover:text-purple-600"
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Email {lead.name}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-gray-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetailModal(lead); }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditModal(lead); }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Lead
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleDuplicate(lead, e)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => handleDelete(lead.id, e)} 
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredLeads.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    {leadFilterTab === "all" && <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />}
                    {leadFilterTab === "my" && <User className="w-16 h-16 text-blue-300 mx-auto mb-4" />}
                    {leadFilterTab === "new" && <Sparkles className="w-16 h-16 text-green-300 mx-auto mb-4" />}
                    {leadFilterTab === "recent" && <Activity className="w-16 h-16 text-purple-300 mx-auto mb-4" />}
                    {leadFilterTab === "hot" && <Flame className="w-16 h-16 text-red-300 mx-auto mb-4" />}
                    {leadFilterTab === "qualified" && <CheckCircle className="w-16 h-16 text-indigo-300 mx-auto mb-4" />}
                    {leadFilterTab === "won" && <Award className="w-16 h-16 text-emerald-300 mx-auto mb-4" />}
                    {leadFilterTab === "lost" && <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />}
                    
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {leadFilterTab === "all" && "No leads found"}
                      {leadFilterTab === "my" && "No leads assigned to you"}
                      {leadFilterTab === "new" && "No new leads at the moment"}
                      {leadFilterTab === "recent" && "No recently engaged leads"}
                      {leadFilterTab === "hot" && "No hot leads right now"}
                      {leadFilterTab === "qualified" && "No qualified leads yet"}
                      {leadFilterTab === "won" && "No won deals to display"}
                      {leadFilterTab === "lost" && "No lost leads found"}
                    </h3>
                    
                    <p className="text-gray-500 mb-4">
                      {leadFilterTab === "all" && "Get started by adding your first lead to the pipeline"}
                      {leadFilterTab === "my" && "Leads will appear here when they're assigned to you"}
                      {leadFilterTab === "new" && "New leads will appear here when they're added to the system"}
                      {leadFilterTab === "recent" && "Leads with activity in the last 3 days will appear here"}
                      {leadFilterTab === "hot" && "Leads marked as 'Hot' will appear here"}
                      {leadFilterTab === "qualified" && "Qualified leads will appear here as they progress through the pipeline"}
                      {leadFilterTab === "won" && "Closed-won deals will appear here"}
                      {leadFilterTab === "lost" && "Lost opportunities will be tracked here"}
                    </p>
                    
                    <div className="flex gap-2 justify-center">
                      <Button onClick={openAddLeadModal}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Lead
                      </Button>
                      {leadFilterTab !== "all" && (
                        <Button variant="outline" onClick={() => setLeadFilterTab("all")}>
                          <Users className="w-4 h-4 mr-2" />
                          View All Leads
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* KANBAN VIEW */}
          {viewMode === "kanban" && (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"].map(status => {
                  const statusLeads = filteredLeads.filter(l => l.status === status);
                  const totalValue = statusLeads.reduce((sum, l) => sum + (l.leadValue || 0), 0);
                  
                  return (
                    <div key={status} className="w-80 flex-shrink-0">
                      <Card className="h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                              <CardTitle className="text-base capitalize">{status}</CardTitle>
                            </div>
                            <Badge variant="secondary">{statusLeads.length}</Badge>
                          </div>
                          {totalValue > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              {formatCurrency(totalValue)}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[600px] pr-4">
                            <div className="space-y-3">
                              {statusLeads.map(lead => (
                                <Card 
                                  key={lead.id}
                                  className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                                  onClick={() => openDetailModal(lead)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                      <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                                          {getInitials(lead.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1 mb-1">
                                          <h4 className="font-semibold text-sm truncate flex-1 min-w-0" title={lead.name}>{lead.name}</h4>
                                          {lead.temperature && <span className="flex-shrink-0">{getTemperatureIcon(lead.temperature)}</span>}
                                        </div>
                                        <p className="text-xs text-gray-600 truncate" title={lead.company}>{lead.company}</p>
                                      </div>
                                    </div>
                                    
                                    {lead.leadValue && (
                                      <div className="bg-green-50 rounded px-2 py-1 mb-2">
                                        <p className="text-sm font-semibold text-green-700">
                                          {formatCurrency(lead.leadValue)}
                                        </p>
                                      </div>
                                    )}

                                    {lead.leadScore !== undefined && (
                                      <div className="mb-2">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                          <span className="text-gray-600">Score</span>
                                          <span className={`font-semibold ${getScoreColor(lead.leadScore)}`}>
                                            {lead.leadScore}/100
                                          </span>
                                        </div>
                                        <Progress value={lead.leadScore} className="h-1.5" />
                                      </div>
                                    )}

                                    {lead.tags && lead.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mb-2">
                                        {lead.tags.slice(0, 2).map(tag => (
                                          <Badge key={tag} variant="secondary" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2 border-t gap-2">
                                      <div className="flex items-center gap-1 min-w-0 flex-1">
                                        <Avatar className="w-5 h-5 flex-shrink-0">
                                          <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                            {getInitials(lead.assignedTo)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-gray-600 truncate" title={lead.assignedTo}>{lead.assignedTo.split(' ')[0]}</span>
                                      </div>
                                      <span className="text-xs text-gray-500 flex-shrink-0">{lead.lastContact}</span>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                              
                              {statusLeads.length === 0 && (
                                <div className="text-center py-8 px-4">
                                  <div className="text-gray-300 mb-2">
                                    {status === "new" && <Sparkles className="w-8 h-8 mx-auto" />}
                                    {status === "contacted" && <Phone className="w-8 h-8 mx-auto" />}
                                    {status === "qualified" && <CheckCircle className="w-8 h-8 mx-auto" />}
                                    {status === "proposal" && <FileText className="w-8 h-8 mx-auto" />}
                                    {status === "negotiation" && <MessageSquare className="w-8 h-8 mx-auto" />}
                                    {status === "won" && <Award className="w-8 h-8 mx-auto" />}
                                    {status === "lost" && <XCircle className="w-8 h-8 mx-auto" />}
                                  </div>
                                  <p className="text-gray-400 text-sm">
                                    {leadFilterTab !== "all" ? `No ${leadFilterTab} leads` : "No leads"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GRID VIEW */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredLeads.map(lead => (
                <Card 
                  key={lead.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200"
                  onClick={() => openDetailModal(lead)}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="text-center mb-4">
                      <Avatar className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                          {getInitials(lead.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center justify-center gap-2 mb-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate px-2" title={lead.name}>{lead.name}</h3>
                        {lead.temperature && <span className="flex-shrink-0">{getTemperatureIcon(lead.temperature)}</span>}
                      </div>
                      <p className="text-sm text-gray-600 truncate px-2" title={lead.position}>{lead.position}</p>
                      <p className="text-sm text-gray-500 truncate px-2" title={lead.company}>{lead.company}</p>
                      <Badge className={`${getStatusColor(lead.status)} text-white mt-2 capitalize inline-flex`}>
                        {lead.status}
                      </Badge>
                    </div>

                    <Separator className="my-3" />

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 min-w-0">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate" title={lead.email}>{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 min-w-0">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="break-all">{lead.phone}</span>
                      </div>
                      {lead.leadValue && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {formatCurrency(lead.leadValue)}
                          </span>
                        </div>
                      )}
                    </div>

                    {lead.leadScore !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">Lead Score</span>
                          <span className={`font-semibold ${getScoreColor(lead.leadScore)}`}>
                            {lead.leadScore}/100
                          </span>
                        </div>
                        <Progress value={lead.leadScore} className="h-2" />
                      </div>
                    )}

                    {lead.tags && lead.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {lead.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Separator className="my-3" />

                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                            {getInitials(lead.assignedTo)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-600 truncate" title={lead.assignedTo}>{lead.assignedTo}</span>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">{lead.lastContact}</span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700" 
                        onClick={(e) => handleCall(lead, e)}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 hover:bg-purple-50 hover:border-purple-500 hover:text-purple-700" 
                        onClick={(e) => handleEmail(lead, e)}
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Email
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="hover:bg-gray-100">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditModal(lead); }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleDuplicate(lead, e)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => handleDelete(lead.id, e)} 
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredLeads.length === 0 && (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="p-12 text-center">
                      {leadFilterTab === "all" && <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />}
                      {leadFilterTab === "my" && <User className="w-16 h-16 text-blue-300 mx-auto mb-4" />}
                      {leadFilterTab === "new" && <Sparkles className="w-16 h-16 text-green-300 mx-auto mb-4" />}
                      {leadFilterTab === "recent" && <Activity className="w-16 h-16 text-purple-300 mx-auto mb-4" />}
                      {leadFilterTab === "hot" && <Flame className="w-16 h-16 text-red-300 mx-auto mb-4" />}
                      {leadFilterTab === "qualified" && <CheckCircle className="w-16 h-16 text-indigo-300 mx-auto mb-4" />}
                      {leadFilterTab === "won" && <Award className="w-16 h-16 text-emerald-300 mx-auto mb-4" />}
                      {leadFilterTab === "lost" && <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />}
                      
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        {leadFilterTab === "all" && "No leads found"}
                        {leadFilterTab === "my" && "No leads assigned to you"}
                        {leadFilterTab === "new" && "No new leads at the moment"}
                        {leadFilterTab === "recent" && "No recently engaged leads"}
                        {leadFilterTab === "hot" && "No hot leads right now"}
                        {leadFilterTab === "qualified" && "No qualified leads yet"}
                        {leadFilterTab === "won" && "No won deals to display"}
                        {leadFilterTab === "lost" && "No lost leads found"}
                      </h3>
                      
                      <p className="text-gray-500 mb-4">
                        {leadFilterTab === "all" && "Get started by adding your first lead to the pipeline"}
                        {leadFilterTab === "my" && "Leads will appear here when they're assigned to you"}
                        {leadFilterTab === "new" && "New leads will appear here when they're added to the system"}
                        {leadFilterTab === "recent" && "Leads with activity in the last 3 days will appear here"}
                        {leadFilterTab === "hot" && "Leads marked as 'Hot' will appear here"}
                        {leadFilterTab === "qualified" && "Qualified leads will appear here as they progress through the pipeline"}
                        {leadFilterTab === "won" && "Closed-won deals will appear here"}
                        {leadFilterTab === "lost" && "Lost opportunities will be tracked here"}
                      </p>
                      
                      <div className="flex gap-2 justify-center">
                        <Button onClick={openAddLeadModal}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Lead
                        </Button>
                        {leadFilterTab !== "all" && (
                          <Button variant="outline" onClick={() => setLeadFilterTab("all")}>
                            <Users className="w-4 h-4 mr-2" />
                            View All Leads
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ENHANCED ADD LEAD MODAL WITH ADVANCED FEATURES */}
        <Dialog open={addLeadModalOpen} onOpenChange={setAddLeadModalOpen}>
          <DialogContent 
            className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[95vh] sm:max-h-[92vh] overflow-hidden flex flex-col p-0"
            onKeyDown={(e) => {
              // Ctrl/Cmd + Enter to save
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (formData.name && formData.source && !isSaving) {
                  console.log("⏎ Keyboard shortcut triggered!");
                  saveNewLead();
                }
              }
            }}
          >
            {/* Header - Fixed */}
            <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b-2 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
                    {formData.id ? '✏️ Edit Lead' : '✨ Add New Lead'}
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-xs sm:text-sm text-gray-700 font-medium">
                    {formData.id ? 'Update lead information and keep your pipeline organized' : 'Create a new lead and start tracking your sales opportunity'}
                    <span className="hidden sm:inline text-blue-700 ml-2 font-semibold">• Press Ctrl+Enter to save quickly ⚡</span>
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  {formData.name && formData.source && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 text-xs sm:text-sm px-3 py-1.5 shadow-md">
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      <span className="hidden sm:inline font-semibold">Ready to Save</span>
                      <span className="sm:hidden font-semibold">Ready</span>
                    </Badge>
                  )}
                </div>
              </div>
              {/* Progress Indicator */}
              <div className="mt-3 sm:mt-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span className="font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Form Completion
                  </span>
                  <span className="font-bold text-blue-700">
                    {Math.round(
                      (Object.values(formData).filter(v => v !== undefined && v !== "").length / 15) * 100
                    )}%
                  </span>
                </div>
                <Progress 
                  value={Math.round(
                    (Object.values(formData).filter(v => v !== undefined && v !== "").length / 15) * 100
                  )}
                  className="h-2.5 bg-gray-200"
                />
              </div>
            </DialogHeader>
            
            {/* Scrollable Content with Fixed Height */}
            <ScrollArea className="h-[calc(95vh-280px)] sm:h-[calc(92vh-280px)] px-4 sm:px-6 overflow-y-auto">
              <div className="space-y-4 sm:space-y-6 py-4 sm:py-6 pb-8">
                
                {/* Quick Guide Alert */}
                {(!formData.name || !formData.source) && (
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-xl p-4 sm:p-5 flex items-start gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-900 text-sm sm:text-base mb-2 flex items-center gap-2">
                        Quick Start Guide
                        <Badge className="bg-blue-600 text-white text-xs">Required</Badge>
                      </h4>
                      <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                        To create a lead, you must fill in: <strong className="text-blue-900">Full Name</strong> and <strong className="text-blue-900">Lead Source</strong>. 
                        All other fields are optional but help you track leads better!
                      </p>
                    </div>
                  </div>
                )}

                {/* Basic Information Section */}
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-white shadow-lg">
                  <CardHeader className="pb-4 bg-gradient-to-r from-blue-100/50 to-purple-100/50">
                    <CardTitle className="text-base flex items-center gap-3 text-blue-900">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold">Basic Information</span>
                      <span className="text-xs text-red-600 ml-auto font-bold bg-red-50 px-2 py-1 rounded-md">* Required</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="name" className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                          Full Name <span className="text-red-500 text-base">*</span>
                          {formData.name && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </Label>
                        <Input
                          id="name"
                          value={formData.name || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., John Doe"
                          className={`mt-1 transition-all duration-200 ${!formData.name ? 'border-2 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-green-50/30'}`}
                          autoFocus
                        />
                      </div>
                      <div>
                        <Label htmlFor="source" className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                          Lead Source <span className="text-red-500 text-base">*</span>
                          {formData.source && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </Label>
                        <Select value={formData.source || ""} onValueChange={(v) => setFormData(prev => ({ ...prev, source: v }))}>
                          <SelectTrigger className={`mt-1 transition-all duration-200 ${!formData.source ? 'border-2 border-red-300 focus:border-red-500' : 'border-2 border-green-300 focus:border-green-500 bg-green-50/30'}`}>
                            <SelectValue placeholder="Select where this lead came from *" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Website">🌐 Website</SelectItem>
                            <SelectItem value="LinkedIn">💼 LinkedIn</SelectItem>
                            <SelectItem value="Referral">🤝 Referral</SelectItem>
                            <SelectItem value="Trade Show">🎪 Trade Show</SelectItem>
                            <SelectItem value="Cold Call">📞 Cold Call</SelectItem>
                            <SelectItem value="Email Campaign">📧 Email Campaign</SelectItem>
                            <SelectItem value="Social Media">📱 Social Media</SelectItem>
                            <SelectItem value="Advertisement">📺 Advertisement</SelectItem>
                            <SelectItem value="Partner">🔗 Partner</SelectItem>
                            <SelectItem value="Other">📋 Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="position" className="font-medium text-gray-700">Job Position</Label>
                        <Input
                          id="position"
                          value={formData.position || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                          placeholder="e.g., CEO, VP of Sales"
                          className="mt-1.5 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                      </div>
                      <div>
                        <Label htmlFor="company" className="font-medium text-gray-700">Company Name</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-[50%] -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="company"
                            value={formData.company || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                            placeholder="e.g., TechCorp Inc"
                            className="mt-1.5 pl-10 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Details Section */}
                <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50/50 to-white shadow-lg">
                  <CardHeader className="pb-4 bg-gradient-to-r from-teal-100/50 to-cyan-100/50">
                    <CardTitle className="text-base flex items-center gap-3 text-teal-900">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold">Contact Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-[50%] -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="email@company.com"
                            className="mt-1.5 pl-9 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-[50%] -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+1 (555) 123-4567"
                            className="mt-1.5 pl-9 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="alternateEmail">Alternate Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-[50%] -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="alternateEmail"
                            type="email"
                            value={formData.alternateEmail || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, alternateEmail: e.target.value }))}
                            placeholder="secondary@company.com"
                            className="mt-1.5 pl-9 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="alternatePhone">Alternate Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-[50%] -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="alternatePhone"
                            type="tel"
                            value={formData.alternatePhone || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, alternatePhone: e.target.value }))}
                            placeholder="+1 (555) 987-6543"
                            className="mt-1.5 pl-9 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="preferredContact">Preferred Contact Method</Label>
                        <Select 
                          value={formData.preferredContactMethod || "email"} 
                          onValueChange={(v) => setFormData(prev => ({ ...prev, preferredContactMethod: v as Lead["preferredContactMethod"] }))}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">📧 Email</SelectItem>
                            <SelectItem value="phone">📞 Phone Call</SelectItem>
                            <SelectItem value="linkedin">💼 LinkedIn Message</SelectItem>
                            <SelectItem value="meeting">🤝 In-Person Meeting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="nextFollowUp">Next Follow-up Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-[50%] -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="nextFollowUp"
                            type="date"
                            value={formData.nextFollowUp || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, nextFollowUp: e.target.value }))}
                            className="mt-1.5 pl-9"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="website">Website / LinkedIn URL</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-[50%] -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="website"
                          value={formData.website || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://company.com"
                          className="mt-1.5 pl-9 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lead Intelligence Section */}
                <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 to-white shadow-lg">
                  <CardHeader className="pb-4 bg-gradient-to-r from-amber-100/50 to-orange-100/50">
                    <CardTitle className="text-base flex items-center gap-3 text-amber-900">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold">Lead Intelligence & Scoring</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="status" className="flex items-center gap-1">
                          Lead Status
                        </Label>
                        <Select value={formData.status || "new_lead"} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as Lead["status"] }))}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getAllStatusesSorted().map(status => {
                              const config = LEAD_STATUS_CONFIG[status];
                              const Icon = config.icon;
                              return (
                                <SelectItem key={status} value={status}>
                                  <div className="flex items-center gap-2">
                                    <Icon className={`w-4 h-4 ${config.textColor}`} />
                                    {config.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="assignedTo">Assign To</Label>
                        <Select value={formData.assignedTo || "John Smith"} onValueChange={(v) => setFormData(prev => ({ ...prev, assignedTo: v }))}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="John Smith">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="text-xs bg-blue-100">JS</AvatarFallback>
                                </Avatar>
                                John Smith
                              </div>
                            </SelectItem>
                            <SelectItem value="Emily Davis">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="text-xs bg-purple-100">ED</AvatarFallback>
                                </Avatar>
                                Emily Davis
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="priority">Priority Level</Label>
                        <Select value={formData.priority || "medium"} onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v as Lead["priority"] }))}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                High Priority
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                Medium Priority
                              </div>
                            </SelectItem>
                            <SelectItem value="low">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-gray-500" />
                                Low Priority
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="temperature">Temperature</Label>
                        <Select 
                          value={formData.temperature || "warm"} 
                          onValueChange={(v) => setFormData(prev => ({ ...prev, temperature: v as Lead["temperature"] }))}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hot">
                              <div className="flex items-center gap-2">
                                <Flame className="w-4 h-4 text-red-500" />
                                Hot 🔥
                              </div>
                            </SelectItem>
                            <SelectItem value="warm">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-yellow-500" />
                                Warm
                              </div>
                            </SelectItem>
                            <SelectItem value="cold">
                              <div className="flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-blue-500" />
                                Cold
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="assigned">Assign To</Label>
                        <Select value={formData.assignedTo || ""} onValueChange={(v) => setFormData(prev => ({ ...prev, assignedTo: v }))}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="John Smith">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="text-xs bg-blue-100">JS</AvatarFallback>
                                </Avatar>
                                John Smith
                              </div>
                            </SelectItem>
                            <SelectItem value="Emily Davis">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="text-xs bg-purple-100">ED</AvatarFallback>
                                </Avatar>
                                Emily Davis
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="leadValue" className="flex items-center gap-2">
                          Expected Deal Value
                          {formData.leadValue && formData.leadValue > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(formData.leadValue)}
                            </Badge>
                          )}
                        </Label>
                        <div className="relative mt-1.5">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="leadValue"
                            type="number"
                            value={formData.leadValue || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, leadValue: Number(e.target.value) || undefined }))}
                            placeholder="50000"
                            className="pl-9 border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="leadScore" className="flex items-center gap-2">
                          Lead Score
                          {formData.leadScore !== undefined && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${
                                formData.leadScore >= 80 ? 'bg-green-100 text-green-700' :
                                formData.leadScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                formData.leadScore >= 40 ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}
                            >
                              {formData.leadScore}/100
                            </Badge>
                          )}
                        </Label>
                        <div className="space-y-2 mt-1.5">
                          <Input
                            id="leadScore"
                            type="range"
                            min="0"
                            max="100"
                            value={formData.leadScore || 50}
                            onChange={(e) => setFormData(prev => ({ ...prev, leadScore: Number(e.target.value) }))}
                            className="w-full"
                          />
                          <Progress value={formData.leadScore || 50} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Company & Industry Details Section - NEW */}
                <Card className="border-2 border-cyan-100 bg-cyan-50/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-cyan-900">
                      <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      Company & Industry Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Select value={formData.industry || ""} onValueChange={(v) => setFormData(prev => ({ ...prev, industry: v }))}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Technology">💻 Technology</SelectItem>
                            <SelectItem value="Finance">💰 Finance</SelectItem>
                            <SelectItem value="Healthcare">🏥 Healthcare</SelectItem>
                            <SelectItem value="Manufacturing">🏭 Manufacturing</SelectItem>
                            <SelectItem value="Retail">🛍️ Retail</SelectItem>
                            <SelectItem value="Education">🎓 Education</SelectItem>
                            <SelectItem value="Real Estate">🏢 Real Estate</SelectItem>
                            <SelectItem value="Marketing">📢 Marketing</SelectItem>
                            <SelectItem value="Consulting">🤝 Consulting</SelectItem>
                            <SelectItem value="Other">📋 Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="companySize">Company Size</Label>
                        <Select value={formData.companySize || ""} onValueChange={(v) => setFormData(prev => ({ ...prev, companySize: v }))}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10">👤 1-10 employees</SelectItem>
                            <SelectItem value="11-50">👥 11-50 employees</SelectItem>
                            <SelectItem value="51-200">👨‍👩‍👧‍👦 51-200 employees</SelectItem>
                            <SelectItem value="201-500">🏢 201-500 employees</SelectItem>
                            <SelectItem value="501-1000">🏭 501-1000 employees</SelectItem>
                            <SelectItem value="1000+">🌐 1000+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="budget" className="flex items-center gap-2">
                          Budget Range
                          {formData.budget && formData.budget > 0 && (
                            <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-700">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(formData.budget)}
                            </Badge>
                          )}
                        </Label>
                        <div className="relative mt-1.5">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="budget"
                            type="number"
                            value={formData.budget || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, budget: Number(e.target.value) || undefined }))}
                            placeholder="Annual budget"
                            className="pl-9 border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="decisionTimeline">Decision Timeline</Label>
                        <Select value={formData.decisionTimeline || ""} onValueChange={(v) => setFormData(prev => ({ ...prev, decisionTimeline: v }))}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="When will they decide?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Immediate">⚡ Immediate (This week)</SelectItem>
                            <SelectItem value="1-month">📅 Within 1 month</SelectItem>
                            <SelectItem value="1-3-months">🗓️ 1-3 months</SelectItem>
                            <SelectItem value="3-6-months">📆 3-6 months</SelectItem>
                            <SelectItem value="6-12-months">📊 6-12 months</SelectItem>
                            <SelectItem value="Not sure">❓ Not sure yet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="campaignSource">Campaign Source</Label>
                        <Input
                          id="campaignSource"
                          value={formData.campaignSource || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, campaignSource: e.target.value }))}
                          placeholder="e.g., Summer Promo 2026"
                          className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                        />
                      </div>
                      <div>
                        <Label htmlFor="referredBy">Referred By</Label>
                        <Input
                          id="referredBy"
                          value={formData.referredBy || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, referredBy: e.target.value }))}
                          placeholder="Name of referrer"
                          className="mt-1.5 border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media & Online Presence - NEW */}
                <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50/50 to-white shadow-lg">
                  <CardHeader className="pb-4 bg-gradient-to-r from-pink-100/50 to-rose-100/50">
                    <CardTitle className="text-base flex items-center gap-3 text-pink-900">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-md">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold">Social Media & Online Presence</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
                        <div className="relative">
                          <Linkedin className="absolute left-3 top-[50%] -translate-y-1/2 w-4 h-4 text-blue-600" />
                          <Input
                            id="linkedinUrl"
                            value={formData.linkedinUrl || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                            placeholder="https://linkedin.com/in/username"
                            className="mt-1.5 pl-9 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="twitterHandle">Twitter/X Handle</Label>
                        <div className="relative">
                          <Twitter className="absolute left-3 top-[50%] -translate-y-1/2 w-4 h-4 text-sky-500" />
                          <Input
                            id="twitterHandle"
                            value={formData.twitterHandle || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, twitterHandle: e.target.value }))}
                            placeholder="@username"
                            className="mt-1.5 pl-9 border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="facebookPage">Facebook Page</Label>
                        <div className="relative">
                          <Facebook className="absolute left-3 top-[50%] -translate-y-1/2 w-4 h-4 text-blue-600" />
                          <Input
                            id="facebookPage"
                            value={formData.facebookPage || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, facebookPage: e.target.value }))}
                            placeholder="facebook.com/company"
                            className="mt-1.5 pl-9 border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags & Categories Section */}
                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50/50 to-white shadow-lg">
                  <CardHeader className="pb-4 bg-gradient-to-r from-green-100/50 to-emerald-100/50">
                    <CardTitle className="text-base flex items-center gap-3 text-green-900">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                        <TagIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold">Tags & Categories</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Label>Add Tags (press Enter or comma to add)</Label>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap border-2 border-gray-300 rounded-lg px-3 py-2.5 bg-white min-h-[50px] focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200 transition-all">
                      {tags.map((tag, idx) => (
                        <Badge key={idx} className="gap-1.5 bg-green-100 text-green-700 hover:bg-green-200">
                          <TagIcon className="w-3 h-3" />
                          {tag}
                          <X className="w-3 h-3 cursor-pointer hover:text-green-900" onClick={() => removeTag(idx)} />
                        </Badge>
                      ))}
                      <input
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={() => { if (tagsInput.trim()) addTag(tagsInput); }}
                        placeholder={tags.length === 0 ? "e.g., Enterprise, SaaS, High Value" : "Add another tag..."}
                        className="flex-1 min-w-[180px] bg-transparent outline-none text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Tip: Use tags like "Enterprise", "Hot Lead", "Follow Up", etc. for better organization
                    </p>
                  </CardContent>
                </Card>

                {/* Address Section */}
                <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white shadow-lg">
                  <CardHeader className="pb-4 bg-gradient-to-r from-indigo-100/50 to-blue-100/50">
                    <CardTitle className="text-base flex items-center gap-3 text-indigo-900">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
                        <MapPinned className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold">Location & Address</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        value={formData.address || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="123 Main Street, Suite 100"
                        className="mt-1.5 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="San Francisco"
                          className="mt-1.5 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State / Province</Label>
                        <Input
                          id="state"
                          value={formData.state || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="CA"
                          className="mt-1.5 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Select value={formData.country || "USA"} onValueChange={(v) => setFormData(prev => ({ ...prev, country: v }))}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USA">🇺🇸 United States</SelectItem>
                            <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                            <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                            <SelectItem value="India">🇮🇳 India</SelectItem>
                            <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                            <SelectItem value="Germany">🇩🇪 Germany</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="zipCode">Zip / Postal Code</Label>
                        <Input
                          id="zipCode"
                          value={formData.zipCode || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                          placeholder="94105"
                          className="mt-1.5 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Information Section */}
                <Card className="border-2 border-slate-200 bg-gradient-to-br from-slate-50/50 to-white shadow-lg">
                  <CardHeader className="pb-4 bg-gradient-to-r from-slate-100/50 to-gray-100/50">
                    <CardTitle className="text-base flex items-center gap-3 text-slate-900">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-md">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold">Additional Notes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Label htmlFor="description">Description / Notes</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Add any additional information about this lead, conversation notes, special requirements, or next steps..."
                      rows={5}
                      className="mt-1.5 resize-none border-2 border-gray-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {formData.description?.length || 0} characters
                    </p>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            {/* Footer - Fixed */}
            <Separator className="bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200" />
            <DialogFooter className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-gray-50 via-blue-50 to-purple-50 border-t-2 border-gray-200">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-3 sm:gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 justify-center sm:justify-start bg-white px-4 py-2.5 rounded-lg border-2 border-gray-200 shadow-sm">
                  {!formData.name || !formData.source ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-gray-700">
                        {!formData.name && !formData.source ? 'Fill Name & Source' : 
                         !formData.name ? 'Name is required' : 'Source is required'}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-green-700 font-bold text-xs sm:text-sm">✓ Ready to {formData.id ? 'update' : 'create'} lead</span>
                    </>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault();
                      setAddLeadModalOpen(false);
                    }}
                    disabled={isSaving}
                    className="w-full sm:w-auto order-3 sm:order-1 bg-white hover:bg-red-50 hover:border-red-500 hover:text-red-700 transition-all duration-200 border-2 shadow-sm hover:shadow-md"
                  >
                    <X className="w-4 h-4 mr-2" />
                    <span className="text-xs sm:text-sm font-semibold">Cancel</span>
                  </Button>
                  <Button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("🖱️ Save & Add Another clicked!", e);
                      saveAndAddAnother();
                    }}
                    disabled={!formData.name || !formData.source || isSaving}
                    variant="outline"
                    className="bg-white hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 cursor-pointer w-full sm:w-auto order-2 transition-all duration-200 border-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span className="text-xs sm:text-sm font-semibold">Saving...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        <span className="text-xs sm:text-sm font-semibold">Save & Add Another</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("🖱️ Create Lead Button clicked!", e);
                      console.log("Form data at click:", formData);
                      saveNewLead();
                    }}
                    disabled={!formData.name || !formData.source || isSaving}
                    className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg cursor-pointer w-full sm:w-auto order-1 sm:order-3 transition-all duration-300 ${
                      formData.name && formData.source && !isSaving 
                        ? 'hover:scale-105 shadow-purple-400/50 ring-2 ring-purple-300/50 hover:ring-purple-400' 
                        : ''
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span className="text-xs sm:text-sm font-medium">Creating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        <span className="text-xs sm:text-sm font-semibold">
                          {formData.id ? 'Update Lead' : 'Create Lead'}
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* LEAD DETAIL MODAL - Continuing from Part 1 */}
        {selectedLead && (
          <LeadDetailModal
            lead={selectedLead}
            open={detailModalOpen}
            onOpenChange={setDetailModalOpen}
            activeTab={activeDetailTab}
            onTabChange={setActiveDetailTab}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onCall={handleCall}
            onEmail={handleEmail}
            onWhatsApp={handleWhatsApp}
            onUpdateLead={(leadId, updater) => {
              setLeads(prev => prev.map(l => {
                if (l.id === leadId) {
                  return { ...l, ...updater(l) };
                }
                return l;
              }));
              // Update selectedLead to reflect changes in modal
              setSelectedLead(prev => {
                if (prev && prev.id === leadId) {
                  return { ...prev, ...updater(prev) };
                }
                return prev;
              });
            }}
          />
        )}
      </div>

      {/* Workflow Guide Modal */}
      {showWorkflowGuide && (
        <WorkflowGuide
          onClose={() => setShowWorkflowGuide(false)}
          onStartLead={() => {
            setShowWorkflowGuide(false);
            openAddLeadModal();
          }}
        />
      )}

      {/* Enhanced Email Template Dialog */}
      {emailDialogLead && (
        <EmailTemplateDialog
          open={emailDialogLead !== null}
          onOpenChange={(open) => !open && setEmailDialogLead(null)}
          leadName={emailDialogLead.name}
          leadEmail={emailDialogLead.email}
          leadCompany={emailDialogLead.company}
          onSend={handleSendEmail}
        />
      )}

      {/* Lead Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
              Lead Report Generator
            </DialogTitle>
            <DialogDescription>
              Generate comprehensive reports with customizable date ranges and export data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date Range Selection */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Select Date Range
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                <Button
                  variant={reportDateRange === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReportDateRange("today")}
                  className={reportDateRange === "today" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  <Clock3 className="w-4 h-4 mr-2" />
                  Today
                </Button>
                <Button
                  variant={reportDateRange === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReportDateRange("week")}
                  className={reportDateRange === "week" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  <CalendarClock className="w-4 h-4 mr-2" />
                  This Week
                </Button>
                <Button
                  variant={reportDateRange === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReportDateRange("month")}
                  className={reportDateRange === "month" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  This Month
                </Button>
                <Button
                  variant={reportDateRange === "year" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReportDateRange("year")}
                  className={reportDateRange === "year" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  This Year
                </Button>
                <Button
                  variant={reportDateRange === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReportDateRange("custom")}
                  className={reportDateRange === "custom" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Custom
                </Button>
              </div>

              {/* Custom Date Range Inputs */}
              {reportDateRange === "custom" && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="reportStartDate" className="text-sm font-semibold text-emerald-900">
                      Start Date
                    </Label>
                    <Input
                      id="reportStartDate"
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportEndDate" className="text-sm font-semibold text-emerald-900">
                      End Date
                    </Label>
                    <Input
                      id="reportEndDate"
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Report Statistics */}
            {(() => {
              const stats = generateReportStatistics();
              const { startDate, endDate } = getReportDateRange();
              
              return (
                <>
                  {/* Date Range Display */}
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-teal-800">
                      <strong>Report Period:</strong> {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                    </p>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-2 border-emerald-200 hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Users className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                          <p className="text-3xl font-bold text-emerald-600">{stats.totalLeads}</p>
                          <p className="text-sm text-gray-600 mt-1">Total Leads</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-teal-200 hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <DollarSign className="w-8 h-8 mx-auto mb-2 text-teal-600" />
                          <p className="text-3xl font-bold text-teal-600">
                            ${(stats.totalValue / 1000).toFixed(0)}k
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Total Value</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-cyan-200 hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Target className="w-8 h-8 mx-auto mb-2 text-cyan-600" />
                          <p className="text-3xl font-bold text-cyan-600">{stats.avgLeadScore}</p>
                          <p className="text-sm text-gray-600 mt-1">Avg Lead Score</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-green-200 hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                          <p className="text-3xl font-bold text-green-600">{stats.conversionRate}%</p>
                          <p className="text-sm text-gray-600 mt-1">Conversion Rate</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Status Breakdown */}
                    <Card className="border-emerald-200">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Activity className="w-5 h-5 text-emerald-600" />
                          Status Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center">
                              <span className="text-sm capitalize">{getStatusLabel(status as LeadStatus)}</span>
                              <Badge variant="outline" className="font-semibold">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Source Breakdown */}
                    <Card className="border-teal-200">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Globe className="w-5 h-5 text-teal-600" />
                          Lead Sources
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(stats.sourceBreakdown).map(([source, count]) => (
                            <div key={source} className="flex justify-between items-center">
                              <span className="text-sm">{source}</span>
                              <Badge variant="outline" className="font-semibold">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Temperature Breakdown */}
                    <Card className="border-cyan-200">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Flame className="w-5 h-5 text-cyan-600" />
                          Lead Temperature
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(stats.temperatureBreakdown).map(([temp, count]) => (
                            <div key={temp} className="flex justify-between items-center">
                              <span className="text-sm capitalize flex items-center gap-2">
                                {temp === "hot" && <Flame className="w-4 h-4 text-red-500" />}
                                {temp === "warm" && <TrendingUp className="w-4 h-4 text-orange-500" />}
                                {temp === "cold" && <TrendingDown className="w-4 h-4 text-blue-500" />}
                                {temp}
                              </span>
                              <Badge variant="outline" className="font-semibold">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Performance Summary */}
                  <Card className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-emerald-800">
                        <Award className="w-5 h-5" />
                        Performance Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                          <p className="text-2xl font-bold text-green-600">{stats.wonLeads}</p>
                          <p className="text-xs text-gray-600">Won Leads</p>
                        </div>
                        <div className="text-center">
                          <XCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
                          <p className="text-2xl font-bold text-red-600">{stats.lostLeads}</p>
                          <p className="text-xs text-gray-600">Lost Leads</p>
                        </div>
                        <div className="text-center">
                          <Clock className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                          <p className="text-2xl font-bold text-orange-600">
                            {stats.totalLeads - stats.wonLeads - stats.lostLeads}
                          </p>
                          <p className="text-xs text-gray-600">In Progress</p>
                        </div>
                        <div className="text-center">
                          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                          <p className="text-2xl font-bold text-emerald-600">{stats.conversionRate}%</p>
                          <p className="text-xs text-gray-600">Win Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReportModal(false)}>
              Close
            </Button>
            <Button
              onClick={handleExportReport}
              disabled={generatingReport || (reportDateRange === "custom" && (!reportStartDate || !reportEndDate))}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {generatingReport ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report (CSV)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ==================== LEAD DETAIL MODAL COMPONENT ====================
function LeadDetailModal({
  lead,
  open,
  onOpenChange,
  activeTab,
  onTabChange,
  onEdit,
  onDelete,
  onCall,
  onEmail,
  onWhatsApp,
  onUpdateLead,
}: {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onEdit?: (lead: Lead) => void;
  onDelete?: (leadId: string) => void;
  onCall?: (lead: Lead) => void;
  onEmail?: (lead: Lead) => void;
  onWhatsApp?: (lead: Lead) => void;
  onUpdateLead?: (leadId: string, updater: (lead: Lead) => Partial<Lead>) => void;
}) {
  const { toast } = useToast();
  
  // State management for tabs
  const [noteContent, setNoteContent] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderPriority, setReminderPriority] = useState<"high" | "medium" | "low">("medium");
  const [reminderCategory, setReminderCategory] = useState("follow-up");
  const [reminderNotifyBefore, setReminderNotifyBefore] = useState(15);
  const [reminderRecurrence, setReminderRecurrence] = useState<"once" | "daily" | "weekly" | "monthly">("once");
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  
  // Dialog states for cancellation and rescheduling
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedReminderForAction, setSelectedReminderForAction] = useState<Reminder | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  
  const [currentStatus, setCurrentStatus] = useState(lead.status);
  const [currentPriority, setCurrentPriority] = useState(lead.priority);
  const [statusNotes, setStatusNotes] = useState("");
  const [currentAssignee, setCurrentAssignee] = useState(lead.assignedTo);
  const [assignmentReason, setAssignmentReason] = useState("");
  const [notifyAssignee, setNotifyAssignee] = useState(true);
  const [teamMembers, setTeamMembers] = useState([
    "John Smith",
    "Sarah Wilson",
    "Michael Chen",
    "Emily Davis",
    "David Brown"
  ]);
  const [showAddAssigneeDialog, setShowAddAssigneeDialog] = useState(false);
  const [newAssigneeName, setNewAssigneeName] = useState("");
  const [currentCallStatus, setCurrentCallStatus] = useState<CallStatus>(lead.callStatus || "not_called");
  const [callOutcome, setCallOutcome] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [callDate, setCallDate] = useState(new Date().toISOString().split('T')[0]);
  const [callNotes, setCallNotes] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [proposalForm, setProposalForm] = useState({
    title: "",
    lineItems: [] as ProposalLineItem[],
    notes: "",
  });
  const [newLineItem, setNewLineItem] = useState({
    description: "",
    quantity: 1,
    unitPrice: 0,
  });
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [viewingProposal, setViewingProposal] = useState<Proposal | null>(null);
  
  // Handler functions
  const handleUpdateStatus = () => {
    if (onUpdateLead) {
      onUpdateLead(lead.id, () => ({
        status: currentStatus,
        priority: currentPriority,
        lastContact: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        })
      }));
    }
    toast({
      title: "✅ Status Updated",
      description: `Lead status changed to ${currentStatus}`,
      duration: 3000,
    });
    setStatusNotes("");
  };

  const handleAssignLead = () => {
    if (onUpdateLead) {
      onUpdateLead(lead.id, () => ({
        assignedTo: currentAssignee
      }));
    }
    toast({
      title: "✅ Lead Assigned",
      description: `Lead assigned to ${currentAssignee}`,
      duration: 3000,
    });
    setAssignmentReason("");
  };

  const handleAddNewAssignee = () => {
    if (!newAssigneeName.trim()) {
      toast({
        title: "⚠️ Name Required",
        description: "Please enter a name for the new assignee",
        duration: 3000,
      });
      return;
    }
    
    if (teamMembers.includes(newAssigneeName.trim())) {
      toast({
        title: "⚠️ Already Exists",
        description: "This assignee name already exists",
        duration: 3000,
      });
      return;
    }

    setTeamMembers([...teamMembers, newAssigneeName.trim()]);
    setCurrentAssignee(newAssigneeName.trim());
    toast({
      title: "✅ Assignee Added",
      description: `${newAssigneeName.trim()} has been added to the team`,
      duration: 3000,
    });
    setNewAssigneeName("");
    setShowAddAssigneeDialog(false);
  };

  const handleSaveCallLog = () => {
    if (onUpdateLead) {
      onUpdateLead(lead.id, () => ({
        callStatus: currentCallStatus,
        lastContact: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        })
      }));
    }
    toast({
      title: "✅ Call Log Saved",
      description: `Call status updated to ${currentCallStatus.replace('_', ' ')}`,
      duration: 3000,
    });
    setCallNotes("");
    setNextSteps("");
    setCallDuration("");
  };

  // Reminder Helper Functions
  const calculateNextReminderDate = (currentDate: string, recurrence: string): string => {
    const date = new Date(currentDate);
    
    switch (recurrence) {
      case "daily":
        date.setDate(date.getDate() + 1);
        break;
      case "weekly":
        date.setDate(date.getDate() + 7);
        break;
      case "monthly":
        date.setMonth(date.getMonth() + 1);
        break;
      default:
        return currentDate;
    }
    
    return date.toISOString().split('T')[0];
  };

  const handleCancelAndReschedule = async (reminderId: string, reason?: string) => {
    const reminder = lead.reminders?.find(r => r.id === reminderId);
    if (!reminder) return;

    // Open cancellation dialog
    setSelectedReminderForAction(reminder);
    setCancelDialogOpen(true);
  };
  
  const confirmCancelReminder = () => {
    if (!selectedReminderForAction) return;

    const shouldAutoReschedule = selectedReminderForAction.recurrence !== "once";

    // Cancel current reminder
    const cancelledReminder = {
      ...selectedReminderForAction,
      status: "cancelled" as const,
      cancelledAt: new Date().toISOString(),
      cancellationReason: cancellationReason || "Cancelled by user",
    };

    if (shouldAutoReschedule) {
      // Create rescheduled reminder automatically for recurring reminders
      const nextDate = calculateNextReminderDate(selectedReminderForAction.date, selectedReminderForAction.recurrence);
      
      const rescheduledReminder: Reminder = {
        ...selectedReminderForAction,
        id: String(Date.now()),
        date: nextDate,
        status: "pending",
        parentReminderId: selectedReminderForAction.id,
        rescheduledCount: selectedReminderForAction.rescheduledCount + 1,
        createdAt: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }),
      };

      // Update cancelled reminder to reference the new one
      cancelledReminder.rescheduledTo = rescheduledReminder.id;

      // Update lead with both cancelled and rescheduled reminders
      if (onUpdateLead) {
        onUpdateLead(lead.id, (l) => ({
          reminders: [
            ...(l.reminders?.map(r => r.id === selectedReminderForAction.id ? cancelledReminder : r) || []),
            rescheduledReminder
          ]
        }));
      }

      toast({
        title: "🔄 Reminder Auto-Rescheduled",
        description: `Cancelled and automatically rescheduled to ${new Date(nextDate).toLocaleDateString()} at ${selectedReminderForAction.time}`,
        duration: 4000,
      });
    } else {
      // Just cancel without auto-rescheduling
      if (onUpdateLead) {
        onUpdateLead(lead.id, (l) => ({
          reminders: l.reminders?.map(r => r.id === selectedReminderForAction.id ? cancelledReminder : r)
        }));
      }

      toast({
        title: "🚫 Reminder Cancelled",
        description: "Reminder has been cancelled. You can reschedule it if needed.",
        duration: 3000,
      });
    }

    setCancelDialogOpen(false);
    setCancellationReason("");
    setSelectedReminderForAction(null);
  };
  
  const handleRescheduleReminder = (reminder: Reminder) => {
    setSelectedReminderForAction(reminder);
    setRescheduleDate(reminder.date);
    setRescheduleTime(reminder.time);
    setRescheduleDialogOpen(true);
  };
  
  const confirmReschedule = () => {
    if (!selectedReminderForAction || !rescheduleDate || !rescheduleTime) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please select new date and time.",
        variant: "destructive",
      });
      return;
    }

    // Validate date is not in the past
    const newDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`);
    if (newDateTime < new Date()) {
      toast({
        title: "⚠️ Invalid Date/Time",
        description: "Rescheduled date and time cannot be in the past.",
        variant: "destructive",
      });
      return;
    }

    if (onUpdateLead) {
      onUpdateLead(lead.id, (l) => ({
        reminders: l.reminders?.map(r =>
          r.id === selectedReminderForAction.id
            ? {
                ...r,
                date: rescheduleDate,
                time: rescheduleTime,
                status: "pending",
                rescheduledCount: r.rescheduledCount + 1,
              }
            : r
        )
      }));
    }

    toast({
      title: "🔄 Reminder Rescheduled",
      description: `Reminder rescheduled to ${new Date(`${rescheduleDate}T${rescheduleTime}`).toLocaleString()}`,
    });

    setRescheduleDialogOpen(false);
    setRescheduleDate("");
    setRescheduleTime("");
    setSelectedReminderForAction(null);
  };

  const handleAddLineItem = () => {
    if (!newLineItem.description || newLineItem.quantity <= 0 || newLineItem.unitPrice <= 0) {
      toast({
        title: "❌ Invalid Line Item",
        description: "Please fill in all fields with valid values",
        duration: 3000,
      });
      return;
    }

    const lineItem: ProposalLineItem = {
      id: String(Date.now()),
      description: newLineItem.description,
      quantity: newLineItem.quantity,
      unitPrice: newLineItem.unitPrice,
      total: newLineItem.quantity * newLineItem.unitPrice
    };

    setProposalForm(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, lineItem]
    }));

    setNewLineItem({ description: "", quantity: 1, unitPrice: 0 });
  };

  const handleRemoveLineItem = (itemId: string) => {
    setProposalForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== itemId)
    }));
  };

  const handleSaveProposal = () => {
    if (!proposalForm.title || proposalForm.lineItems.length === 0) {
      toast({
        title: "❌ Invalid Proposal",
        description: "Please add a title and at least one line item",
        duration: 3000,
      });
      return;
    }

    const subtotal = proposalForm.lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    const newProposal: Proposal = {
      id: String(Date.now()),
      title: proposalForm.title,
      version: editingProposal ? editingProposal.version + 1 : 1,
      status: "draft",
      lineItems: proposalForm.lineItems,
      subtotal,
      tax,
      total,
      notes: proposalForm.notes,
      createdBy: "Current User",
      createdAt: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })
    };

    if (onUpdateLead) {
      onUpdateLead(lead.id, (l) => ({
        proposals: editingProposal
          ? l.proposals?.map(p => p.id === editingProposal.id ? newProposal : p)
          : [newProposal, ...(l.proposals || [])]
      }));
    }

    toast({
      title: "✅ Proposal Saved",
      description: editingProposal ? "Proposal updated successfully" : "New proposal created",
      duration: 3000,
    });

    setProposalForm({ title: "", lineItems: [], notes: "" });
    setEditingProposal(null);
    setShowProposalForm(false);
  };

  const handleEditProposal = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setProposalForm({
      title: proposal.title,
      lineItems: proposal.lineItems,
      notes: proposal.notes || ""
    });
    setShowProposalForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendProposal = (proposalId: string) => {
    if (onUpdateLead) {
      onUpdateLead(lead.id, (l) => ({
        proposals: l.proposals?.map(p => 
          p.id === proposalId 
            ? { 
                ...p, 
                status: "sent",
                sentAt: new Date().toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true
                })
              }
            : p
        )
      }));
    }
    toast({
      title: "✅ Proposal Sent",
      description: "Proposal has been sent to the lead",
      duration: 3000,
    });
  };

  const handleViewProposal = (proposal: Proposal) => {
    // Show proposal in detail view
    setViewingProposal(proposal);
    onTabChange('proposals');
    toast({
      title: "📄 Viewing Proposal",
      description: `Opened ${proposal.title}`,
      duration: 2000,
    });
  };

  const handleDownloadProposal = (proposal: Proposal) => {
    // Generate proposal content for download
    const proposalContent = `
======================================
PROPOSAL: ${proposal.title}
======================================

Lead: ${lead.name}
Company: ${lead.company}
Version: ${proposal.version}
Status: ${proposal.status.toUpperCase()}

--------------------------------------
LINE ITEMS:
--------------------------------------
${proposal.lineItems.map((item, index) => 
  `${index + 1}. ${item.description}\n   Quantity: ${item.quantity} x $${item.unitPrice} = $${item.total}`
).join('\n\n')}

--------------------------------------
SUMMARY:
--------------------------------------
Subtotal: $${proposal.subtotal.toFixed(2)}
Tax (10%): $${proposal.tax.toFixed(2)}
Total: $${proposal.total.toFixed(2)}

${proposal.notes ? `--------------------------------------\nNOTES:\n--------------------------------------\n${proposal.notes}` : ''}

--------------------------------------
Generated: ${new Date().toLocaleString()}
======================================
    `;

    // Create a blob and download
    const blob = new Blob([proposalContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Proposal_${proposal.title.replace(/\s+/g, '_')}_${lead.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "⬇️ Download Started",
      description: `Downloading ${proposal.title}`,
      duration: 3000,
    });
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) {
      toast({
        title: "❌ Empty Note",
        description: "Please enter some content for the note",
        duration: 3000,
      });
      return;
    }

    const newNote: Note = {
      id: String(Date.now()),
      content: noteContent,
      createdBy: "Current User",
      createdAt: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })
    };

    if (onUpdateLead) {
      onUpdateLead(lead.id, (l) => ({
        notes: [newNote, ...(l.notes || [])]
      }));
    }

    toast({
      title: "✅ Note Added",
      description: "Note saved successfully",
      duration: 3000,
    });

    setNoteContent("");
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: "bg-blue-500",
      contacted: "bg-yellow-500",
      qualified: "bg-purple-500",
      proposal: "bg-orange-500",
      negotiation: "bg-pink-500",
      won: "bg-green-500",
      lost: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      email: <Mail className="w-4 h-4" />,
      call: <Phone className="w-4 h-4" />,
      meeting: <Video className="w-4 h-4" />,
      status_change: <Activity className="w-4 h-4" />,
      note: <MessageSquare className="w-4 h-4" />,
      task: <CheckCheck className="w-4 h-4" />,
    };
    return icons[type as keyof typeof icons] || <Activity className="w-4 h-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] sm:max-w-7xl max-h-[96vh] overflow-hidden p-0">
        <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] h-full max-h-[95vh]">
          {/* LEFT PANEL - Lead Profile */}
          <div className="bg-gradient-to-br from-gray-50 to-white border-b md:border-b-0 md:border-r border-gray-200">
            <ScrollArea className="h-full max-h-[95vh]">
              <div className="p-4 sm:p-6">
                {/* Lead Identity Card */}
                <div className="text-center mb-6">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 ring-4 ring-blue-100">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl sm:text-2xl">
                      {getInitials(lead.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{lead.name}</h2>
                  {lead.position && <p className="text-gray-600 mb-1 capitalize text-sm sm:text-base">{lead.position}</p>}
                  {lead.company && (
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-500 text-sm">{lead.company}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                    <Badge className={`${getStatusColor(lead.status)} text-white capitalize`}>
                      {lead.status}
                    </Badge>
                    {lead.priority && (
                      <Badge variant="outline" className={`${
                        lead.priority === 'high' ? 'border-red-500 text-red-700' :
                        lead.priority === 'medium' ? 'border-yellow-500 text-yellow-700' :
                        'border-gray-500 text-gray-700'
                      }`}>
                        {lead.priority === 'high' && '🔴'}
                        {lead.priority === 'medium' && '🟡'}
                        {lead.priority === 'low' && '⚪'}
                        {' '}{lead.priority}
                      </Badge>
                    )}
                    {lead.temperature === "hot" && (
                      <Badge className="bg-red-100 text-red-700">
                        <Flame className="w-3 h-3 mr-1" />
                        Hot Lead
                      </Badge>
                    )}
                    {lead.temperature === "warm" && (
                      <Badge className="bg-yellow-100 text-yellow-700">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Warm
                      </Badge>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mb-4">
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700"
                        onClick={() => {
                          onEdit(lead);
                          onOpenChange(false);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-red-50 hover:border-red-500 hover:text-red-700"
                        onClick={() => {
                          if (confirm(`Delete ${lead.name}?`)) {
                            onDelete(lead.id);
                            onOpenChange(false);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>

                  {/* Lead Score */}
                  {lead.leadScore !== undefined && (
                    <div className="bg-white rounded-xl p-4 mb-4 shadow-md border-2 border-gray-100">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <div className={`text-3xl sm:text-4xl font-bold ${getScoreColor(lead.leadScore)}`}>
                          {lead.leadScore}
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-gray-500 font-semibold">Lead Score</p>
                          <p className="text-xs text-gray-400">out of 100</p>
                        </div>
                      </div>
                      <Progress value={lead.leadScore} className="h-2.5" />
                      <p className="text-xs text-center mt-2 text-gray-500">
                        {lead.leadScore >= 80 ? '🎯 Excellent' :
                         lead.leadScore >= 60 ? '✅ Good' :
                         lead.leadScore >= 40 ? '⚠️ Fair' : '📉 Needs attention'}
                      </p>
                    </div>
                  )}

                  {/* Contact Buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 transition-all"
                      onClick={(e) => { e.stopPropagation(); onCall?.(lead); }}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full hover:bg-purple-50 hover:border-purple-500 hover:text-purple-700 transition-all"
                      onClick={(e) => { e.stopPropagation(); onEmail?.(lead); }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full hover:bg-green-50 hover:border-green-500 hover:text-green-700 transition-all"
                      onClick={(e) => { e.stopPropagation(); onWhatsApp?.(lead); }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full hover:bg-orange-50 hover:border-orange-500 hover:text-orange-700 transition-all"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Key Information */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Key Information
                  </h3>
                  
                  {lead.leadValue && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                      <p className="text-xs text-green-600 font-semibold mb-1 uppercase tracking-wide">Deal Value</p>
                      <p className="text-2xl font-bold text-green-700">{formatCurrency(lead.leadValue)}</p>
                    </div>
                  )}

                  <div className="space-y-3 text-sm">
                    {/* Email */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </p>
                      <p className="text-gray-900 font-medium break-all">{lead.email}</p>
                    </div>
                    
                    {/* Phone */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Phone
                      </p>
                      <p className="text-gray-900 font-medium">{lead.phone}</p>
                    </div>
                    
                    {/* Alternate Email */}
                    {lead.alternateEmail && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Alternate Email
                        </p>
                        <p className="text-gray-900 font-medium break-all">{lead.alternateEmail}</p>
                      </div>
                    )}
                    
                    {/* Alternate Phone */}
                    {lead.alternatePhone && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Alternate Phone
                        </p>
                        <p className="text-gray-900 font-medium">{lead.alternatePhone}</p>
                      </div>
                    )}
                    
                    {/* Website */}
                    {lead.website && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Website
                        </p>
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline break-all">
                          {lead.website}
                        </a>
                      </div>
                    )}
                    
                    {/* LinkedIn */}
                    {lead.linkedinUrl && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                          <Linkedin className="w-3 h-3" /> LinkedIn
                        </p>
                        <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline break-all">
                          {lead.linkedinUrl}
                        </a>
                      </div>
                    )}
                    
                    {/* Source */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold">Source</p>
                      <Badge variant="outline" className="font-medium">{lead.source}</Badge>
                    </div>
                    
                    {/* Industry */}
                    {lead.industry && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> Industry
                        </p>
                        <Badge variant="secondary" className="font-medium">{lead.industry}</Badge>
                      </div>
                    )}
                    
                    {/* Company Size */}
                    {lead.companySize && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                          <Users2 className="w-3 h-3" /> Company Size
                        </p>
                        <p className="text-gray-900 font-medium">{lead.companySize}</p>
                      </div>
                    )}
                    
                    {/* Budget */}
                    {lead.budget && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Budget Range
                        </p>
                        <p className="text-gray-900 font-bold">{formatCurrency(lead.budget)}</p>
                      </div>
                    )}
                    
                    {/* Decision Timeline */}
                    {lead.decisionTimeline && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Decision Timeline
                        </p>
                        <Badge variant="outline" className="font-medium">{lead.decisionTimeline}</Badge>
                      </div>
                    )}
                    
                    {/* Assigned To */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold">Assigned To</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {getInitials(lead.assignedTo)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-900 font-medium">{lead.assignedTo}</span>
                      </div>
                    </div>
                    
                    {/* Created Date */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Created
                      </p>
                      <p className="text-gray-900 font-medium">{lead.createdDate}</p>
                    </div>
                    
                    {/* Last Contact */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Last Contact
                      </p>
                      <p className="text-gray-900 font-medium">{lead.lastContact}</p>
                    </div>
                    
                    {/* Next Follow-up */}
                    {lead.nextFollowUp && (
                      <div className="bg-amber-50 rounded-lg p-3 border-2 border-amber-200">
                        <p className="text-xs text-amber-600 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                          <Bell className="w-3 h-3" /> Next Follow-up
                        </p>
                        <p className="text-amber-900 font-bold">{lead.nextFollowUp}</p>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {lead.tags && lead.tags.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold flex items-center gap-1">
                        <TagIcon className="w-3 h-3" /> Tags
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {lead.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs font-medium">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {(lead.address || lead.city) && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Address
                      </p>
                      <p className="text-gray-900 text-sm leading-relaxed">
                        {[lead.address, lead.city, lead.state, lead.zipCode, lead.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT PANEL - Tabbed Content */}
          <div className="flex flex-col overflow-hidden h-full max-h-[95vh]">
            <div className="border-b border-gray-200 px-4 sm:px-6 pt-4 sm:pt-6 bg-white sticky top-0 z-10">
              <Tabs value={activeTab} onValueChange={onTabChange}>
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto bg-gray-100 gap-1">
                  <TabsTrigger value="overview" className="text-xs py-2 data-[state=active]:bg-white">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs py-2 data-[state=active]:bg-white">
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Notes</span>
                  </TabsTrigger>
                  <TabsTrigger value="reminders" className="text-xs py-2 data-[state=active]:bg-white">
                    <Bell className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Reminder</span>
                  </TabsTrigger>
                  <TabsTrigger value="lead-status" className="text-xs py-2 data-[state=active]:bg-white">
                    <Flag className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Status</span>
                  </TabsTrigger>
                  <TabsTrigger value="assign" className="text-xs py-2 data-[state=active]:bg-white">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Assign</span>
                  </TabsTrigger>
                  <TabsTrigger value="call-status" className="text-xs py-2 data-[state=active]:bg-white">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Call</span>
                  </TabsTrigger>
                  <TabsTrigger value="proposals" className="text-xs py-2 data-[state=active]:bg-white">
                    <FileCheck className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Proposal</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs py-2 data-[state=active]:bg-white">
                    <Activity className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Activity</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <ScrollArea className="flex-1 px-4 sm:px-6 py-4">
              <Tabs value={activeTab}>
                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="mt-0 space-y-4 sm:space-y-6">
                  {/* AI Summary */}
                  {lead.aiSummary && (
                    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-blue-900">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          AI-Powered Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{lead.aiSummary}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Notes Section */}
                  <Card className="border-2 border-slate-300 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 rounded-t-lg border-b-2 border-slate-200">
                      <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                        <span className="flex items-center gap-3 text-slate-900">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg">
                            <MessageSquare className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              📝 Notes
                              {lead.notes && lead.notes.length > 0 && (
                                <Badge className="bg-slate-600 text-white text-xs px-2 py-0.5">
                                  {lead.notes.length}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 font-normal mt-0.5">Quick notes and observations</p>
                          </div>
                        </span>
                        <Link href="/leads/notes">
                          <Button size="sm" className="text-xs bg-slate-600 hover:bg-slate-700 text-white shadow-md">
                            <Eye className="w-3 h-3 mr-1" />
                            View All
                          </Button>
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 pb-5">
                      {lead.notes && lead.notes.length > 0 ? (
                        <div className="space-y-3">
                          {lead.notes.slice(0, 2).map(note => (
                            <div key={note.id} className="p-4 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200">
                              <p className="text-sm sm:text-base text-gray-800 mb-3 leading-relaxed font-medium">{note.content}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Avatar className="w-5 h-5 ring-2 ring-slate-200">
                                  <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white text-xs font-semibold">
                                    {getInitials(note.createdBy)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-gray-700">{note.createdBy}</span>
                                <span className="text-gray-400">•</span>
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span className="text-gray-600">{note.createdAt}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-slate-100 to-gray-100 flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-500">No notes added yet</p>
                          <p className="text-xs text-gray-400 mt-1">Add your first note to track important information</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Follow Up Reminder Section */}
                  <Card className="border-2 border-orange-300 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 rounded-t-lg border-b-2 border-orange-200">
                      <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                        <span className="flex items-center gap-3 text-orange-900">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg animate-pulse">
                            <Bell className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              🔔 Follow Up Reminder
                              {lead.reminders && lead.reminders.length > 0 && (
                                <Badge className="bg-orange-600 text-white text-xs px-2 py-0.5">
                                  {lead.reminders.length}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 font-normal mt-0.5">Scheduled follow-ups and reminders</p>
                          </div>
                        </span>
                        <Button 
                          size="sm" 
                          onClick={() => onTabChange("reminders")}
                          className="text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-md"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View All
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 pb-5">
                      {lead.reminders && lead.reminders.length > 0 ? (
                        <div className="space-y-3">
                          {lead.reminders.slice(0, 2).map(reminder => (
                            <div key={reminder.id} className="p-4 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 rounded-xl border-2 border-orange-200 hover:border-orange-300 hover:shadow-md transition-all duration-200">
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <p className="text-sm sm:text-base font-semibold text-gray-900 leading-relaxed">{reminder.message}</p>
                                {reminder.priority && (
                                  <Badge className={`text-xs font-semibold shadow-sm ${
                                    reminder.priority === 'high' ? 'bg-red-500 text-white' :
                                    reminder.priority === 'medium' ? 'bg-yellow-500 text-white' :
                                    'bg-gray-500 text-white'
                                  }`}>
                                    {reminder.priority === 'high' ? '🔥' : reminder.priority === 'medium' ? '⚡' : '📌'} {reminder.priority.toUpperCase()}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-orange-200 text-gray-700 font-medium">
                                  <Calendar className="w-3.5 h-3.5 text-orange-600" />
                                  {reminder.date}
                                </span>
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-orange-200 text-gray-700 font-medium">
                                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                                  {reminder.time}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                            <Bell className="w-8 h-8 text-orange-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-500">No reminders set</p>
                          <p className="text-xs text-gray-400 mt-1">Schedule a reminder to stay on track with follow-ups</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Communication Actions Section */}
                  <Card className="border-2 border-cyan-300 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-3 bg-gradient-to-r from-cyan-50 via-blue-50 to-cyan-50 rounded-t-lg border-b-2 border-cyan-200">
                      <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                        <span className="flex items-center gap-3 text-cyan-900">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-lg">
                            <Send className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              📨 Communication Actions
                            </div>
                            <p className="text-xs text-gray-600 font-normal mt-0.5">Quick communication options</p>
                          </div>
                        </span>
                        <Link href="/leads/communication">
                          <Button size="sm" className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white shadow-md">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Open
                          </Button>
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 pb-5">
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <Button 
                          variant="outline" 
                          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-400 bg-gradient-to-b from-white to-green-50/50 border-2 border-green-200 shadow-sm hover:shadow-md transition-all duration-200"
                          onClick={() => onWhatsApp?.(lead)}
                        >
                          <MessageCircle className="w-6 h-6 text-green-600" />
                          <span className="text-xs font-semibold text-gray-700">WhatsApp</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-400 bg-gradient-to-b from-white to-blue-50/50 border-2 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200"
                          onClick={() => onEmail?.(lead)}
                        >
                          <Mail className="w-6 h-6 text-blue-600" />
                          <span className="text-xs font-semibold text-gray-700">Email</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-400 bg-gradient-to-b from-white to-purple-50/50 border-2 border-purple-200 shadow-sm hover:shadow-md transition-all duration-200"
                          onClick={() => onCall?.(lead)}
                        >
                          <Phone className="w-6 h-6 text-purple-600" />
                          <span className="text-xs font-semibold text-gray-700">Call</span>
                        </Button>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-cyan-50 via-blue-50 to-cyan-50 rounded-xl border-2 border-cyan-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-cyan-600" />
                            Last Contact:
                          </span>
                          <span className="text-sm font-bold text-gray-900">{lead.lastContact}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lead Status Section */}
                  <Card className="border-2 border-teal-300 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-3 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 rounded-t-lg border-b-2 border-teal-200">
                      <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                        <span className="flex items-center gap-3 text-teal-900">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg">
                            <Flag className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              🏁 Lead Status
                            </div>
                            <p className="text-xs text-gray-600 font-normal mt-0.5">Current status and pipeline stage</p>
                          </div>
                        </span>
                        <Link href="/leads/lead-status">
                          <Button size="sm" className="text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md">
                            <Edit className="w-3 h-3 mr-1" />
                            Update
                          </Button>
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 pb-5">
                      <div className="p-4 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 rounded-xl border-2 border-teal-200">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <Flag className="w-4 h-4 text-teal-600" />
                              Status:
                            </span>
                            <Badge className={`font-semibold text-xs shadow-sm ${
                              lead.status === 'new' ? 'bg-blue-500 text-white' :
                              lead.status === 'contacted' ? 'bg-cyan-500 text-white' :
                              lead.status === 'qualified' ? 'bg-purple-500 text-white' :
                              lead.status === 'proposal' ? 'bg-orange-500 text-white' :
                              lead.status === 'negotiation' ? 'bg-yellow-500 text-white' :
                              lead.status === 'won' ? 'bg-green-500 text-white' :
                              'bg-red-500 text-white'
                            }`}>
                              {lead.status === 'new' ? '🆕' :
                               lead.status === 'contacted' ? '📞' :
                               lead.status === 'qualified' ? '✅' :
                               lead.status === 'proposal' ? '📄' :
                               lead.status === 'negotiation' ? '💬' :
                               lead.status === 'won' ? '🎉' : '❌'} {lead.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-teal-600" />
                              Priority:
                            </span>
                            <Badge className={`font-semibold text-xs shadow-sm ${
                              lead.priority === 'high' ? 'bg-red-500 text-white' :
                              lead.priority === 'medium' ? 'bg-yellow-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {lead.priority === 'high' ? '🔥' : lead.priority === 'medium' ? '⚡' : '📌'} {lead.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Assign Lead Section */}
                  <Card className="border-2 border-indigo-300 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 rounded-t-lg border-b-2 border-indigo-200">
                      <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                        <span className="flex items-center gap-3 text-indigo-900">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              👤 Assign Lead
                            </div>
                            <p className="text-xs text-gray-600 font-normal mt-0.5">Manage lead ownership</p>
                          </div>
                        </span>
                        <Link href="/leads/assign">
                          <Button size="sm" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                            <Edit className="w-3 h-3 mr-1" />
                            Reassign
                          </Button>
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 pb-5">
                      <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 rounded-xl border-2 border-indigo-200">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-3 border-white shadow-lg ring-2 ring-indigo-200">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-base">
                              {getInitials(lead.assignedTo)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">Assigned To:</span>
                              <Badge className="bg-indigo-500 text-white font-semibold shadow-sm">
                                👤 {lead.assignedTo || 'Unassigned'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Team member responsible for this lead</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Call Status Section */}
                  <Card className="border-2 border-violet-300 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-3 bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 rounded-t-lg border-b-2 border-violet-200">
                      <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                        <span className="flex items-center gap-3 text-violet-900">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg">
                            <PhoneCall className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              📞 Call Status
                            </div>
                            <p className="text-xs text-gray-600 font-normal mt-0.5">Track call activities</p>
                          </div>
                        </span>
                        <Link href="/leads/call-status">
                          <Button size="sm" className="text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-md">
                            <Plus className="w-3 h-3 mr-1" />
                            Log Call
                          </Button>
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 pb-5">
                      <div className="p-4 bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 rounded-xl border-2 border-violet-200">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <PhoneCall className="w-4 h-4 text-violet-600" />
                              Call Status:
                            </span>
                            <Badge className={`font-semibold text-xs shadow-sm ${
                              lead.callStatus === 'called' ? 'bg-green-500 text-white' :
                              lead.callStatus === 'not_called' ? 'bg-gray-500 text-white' :
                              lead.callStatus === 'no_answer' ? 'bg-yellow-500 text-white' :
                              lead.callStatus === 'interested' ? 'bg-blue-500 text-white' :
                              'bg-red-500 text-white'
                            }`}>
                              {lead.callStatus === 'called' ? '✅' :
                               lead.callStatus === 'not_called' ? '❓' :
                               lead.callStatus === 'no_answer' ? '⚠️' :
                               lead.callStatus === 'interested' ? '🔵' : '🔴'} {lead.callStatus?.replace('_', ' ').toUpperCase() || 'NO CALLS'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-violet-600" />
                              Last Call:
                            </span>
                            <span className="text-sm font-bold text-gray-900">{lead.lastContact || 'Never'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Proposal Section */}
                  <Card className="border-2 border-rose-300 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-3 bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 rounded-t-lg border-b-2 border-rose-200">
                      <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                        <span className="flex items-center gap-3 text-rose-900">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg">
                            <FileCheck className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              📄 Proposal
                              {lead.proposals && lead.proposals.length > 0 && (
                                <Badge className="bg-rose-600 text-white text-xs font-bold shadow-sm">
                                  {lead.proposals.length}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 font-normal mt-0.5">Manage proposals and quotes</p>
                          </div>
                        </span>
                        <Link href="/leads/proposals">
                          <Button size="sm" className="text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md">
                            <Plus className="w-3 h-3 mr-1" />
                            Create
                          </Button>
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 pb-5">
                      {lead.proposals && lead.proposals.length > 0 ? (
                        <div className="space-y-4">
                          {lead.proposals.slice(0, 2).map(proposal => (
                            <div key={proposal.id} className="p-5 bg-gradient-to-br from-rose-50 via-pink-50 to-rose-50 rounded-xl border-2 border-rose-200 hover:shadow-lg transition-all duration-300">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h4 className="font-bold text-base text-gray-900 mb-1.5 flex items-center gap-2">
                                    📄 {proposal.title}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-md border border-gray-200">
                                      Version {proposal.version}
                                    </span>
                                    <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-md border border-gray-200">
                                      ID: {proposal.id}
                                    </span>
                                    {proposal.lineItems && proposal.lineItems.length > 0 && (
                                      <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-md border border-gray-200">
                                        {proposal.lineItems.length} items
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Badge className={`font-semibold text-xs shadow-md px-3 py-1 ${
                                  proposal.status === 'draft' ? 'bg-gray-500 text-white' :
                                  proposal.status === 'sent' ? 'bg-blue-500 text-white' :
                                  proposal.status === 'viewed' ? 'bg-purple-500 text-white' :
                                  proposal.status === 'accepted' ? 'bg-green-500 text-white' :
                                  'bg-red-500 text-white'
                                }`}>
                                  {proposal.status === 'draft' ? '📝' :
                                   proposal.status === 'sent' ? '📤' :
                                   proposal.status === 'viewed' ? '👁️' :
                                   proposal.status === 'accepted' ? '✅' : '❌'} {proposal.status.toUpperCase()}
                                </Badge>
                              </div>

                              {/* Line Items Preview */}
                              {proposal.lineItems && proposal.lineItems.length > 0 && (
                                <div className="mb-4 space-y-2">
                                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    Items Included:
                                  </p>
                                  <div className="space-y-1.5">
                                    {proposal.lineItems.slice(0, 3).map((item, index) => (
                                      <div key={item.id} className="flex items-start justify-between p-2.5 bg-white rounded-lg border border-rose-100 hover:border-rose-200 transition-colors">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-800 truncate">
                                            {index + 1}. {item.description}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-0.5">
                                            Qty: {item.quantity} × ${item.unitPrice.toLocaleString()}
                                          </p>
                                        </div>
                                        <span className="text-xs font-bold text-gray-900 ml-2 whitespace-nowrap">
                                          ${item.total.toLocaleString()}
                                        </span>
                                      </div>
                                    ))}
                                    {proposal.lineItems.length > 3 && (
                                      <p className="text-xs text-gray-500 italic pl-2">
                                        +{proposal.lineItems.length - 3} more items...
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Pricing Breakdown */}
                              <div className="p-4 bg-white rounded-xl border-2 border-rose-200 mb-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Subtotal:</span>
                                  <span className="font-semibold text-gray-800">${proposal.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Tax (10%):</span>
                                  <span className="font-semibold text-gray-800">${proposal.tax.toLocaleString()}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex items-center justify-between">
                                  <span className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    💰 Total Amount:
                                  </span>
                                  <span className="text-xl font-bold text-rose-600">
                                    ${proposal.total.toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              {/* Timeline */}
                              <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Created:
                                  </p>
                                  <p className="text-xs font-semibold text-gray-900">{proposal.createdAt || 'N/A'}</p>
                                </div>
                                {proposal.sentAt && (
                                  <div className="p-2.5 bg-white rounded-lg border border-blue-200">
                                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                      <Send className="w-3 h-3 text-blue-600" />
                                      Sent:
                                    </p>
                                    <p className="text-xs font-semibold text-blue-900">{proposal.sentAt}</p>
                                  </div>
                                )}
                                {proposal.validUntil && (
                                  <div className="p-2.5 bg-white rounded-lg border border-orange-200">
                                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-orange-600" />
                                      Valid Until:
                                    </p>
                                    <p className="text-xs font-semibold text-orange-900">{proposal.validUntil}</p>
                                  </div>
                                )}
                              </div>

                              {/* Notes Preview */}
                              {proposal.notes && (
                                <div className="p-3 bg-white rounded-lg border border-gray-200 mb-4">
                                  <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    Notes:
                                  </p>
                                  <p className="text-xs text-gray-600 line-clamp-2">{proposal.notes}</p>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="grid grid-cols-2 gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-400 text-blue-700 font-semibold"
                                  onClick={() => handleViewProposal(proposal)}
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                                  View Details
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs bg-white hover:bg-green-50 border-2 border-green-200 hover:border-green-400 text-green-700 font-semibold"
                                  onClick={() => handleDownloadProposal(proposal)}
                                >
                                  <Download className="w-3.5 h-3.5 mr-1.5" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          ))}
                          {lead.proposals.length > 2 && (
                            <Link href="/leads/proposals">
                              <Button variant="outline" className="w-full text-xs border-2 border-rose-300 hover:bg-rose-50 hover:border-rose-400 font-semibold">
                                <ArrowRight className="w-3 h-3 mr-1" />
                                View all {lead.proposals.length} proposals
                              </Button>
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="p-6 text-center bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 rounded-xl border-2 border-rose-200">
                          <FileCheck className="w-16 h-16 mx-auto text-rose-300 mb-3" />
                          <p className="text-sm text-gray-600 font-medium">No proposals yet</p>
                          <p className="text-xs text-gray-500 mt-1">Create your first proposal to get started</p>
                          <Link href="/leads/proposals">
                            <Button size="sm" className="mt-3 bg-rose-600 hover:bg-rose-700 text-white">
                              <Plus className="w-3 h-3 mr-1" />
                              Create Proposal
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Upcoming Tasks */}
                  {lead.tasks && lead.tasks.length > 0 && (
                    <Card className="border-2 border-teal-200 shadow-md">
                      <CardHeader className="pb-3 bg-teal-50 rounded-t-lg">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2 text-teal-900">
                            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                              <CheckCheck className="w-4 h-4 text-white" />
                            </div>
                            Upcoming Tasks
                          </span>
                          <Badge className="bg-teal-600 text-white">{lead.tasks.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          {lead.tasks.map(task => (
                            <div key={task.id} className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-purple-300 transition-all">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                className="mt-1 w-4 h-4"
                                readOnly
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm sm:text-base">{task.title}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {task.dueDate}
                                  </span>
                                  <Badge variant="outline" className={`text-xs ${
                                    task.priority === 'high' ? 'border-red-500 text-red-700 bg-red-50' :
                                    task.priority === 'medium' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                    'border-gray-500 text-gray-700 bg-gray-50'
                                  }`}>
                                    {task.priority}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recent Activity Preview */}
                  {lead.activities && lead.activities.length > 0 && (
                    <Card className="border-2 border-green-200 shadow-md">
                      <CardHeader className="pb-3 bg-green-50 rounded-t-lg">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2 text-green-900">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <History className="w-4 h-4 text-white" />
                            </div>
                            Recent Activity
                          </span>
                          <Badge variant="outline" className="border-green-600 text-green-700">Last {lead.activities.slice(0, 3).length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          {lead.activities.slice(0, 3).map(activity => (
                            <div key={activity.id} className="flex gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-green-300 transition-all">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white">
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm sm:text-base truncate">{activity.title}</p>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{activity.description}</p>
                                <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Description */}
                  {lead.description && (
                    <Card className="border-2 border-gray-200 shadow-md">
                      <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
                        <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                          <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          Description & Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                          <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{lead.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* ACTIVITY TAB */}
                <TabsContent value="activity" className="mt-0">
                  <div className="space-y-4 sm:space-y-6">
                    {lead.activities && lead.activities.length > 0 ? (
                      <div className="relative">
                        <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-purple-300 to-pink-300"></div>
                        <div className="space-y-4 sm:space-y-6">
                          {lead.activities.map((activity, index) => (
                            <div key={activity.id} className="relative flex gap-3 sm:gap-4">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 relative z-10 text-white shadow-md ring-2 ring-white">
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-300 hover:shadow-md transition-all">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-sm sm:text-base text-gray-900">{activity.title}</h4>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{activity.description}</p>
                                  </div>
                                  <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {activity.timestamp}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                                  <Avatar className="w-5 h-5 ring-1 ring-gray-200">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs font-semibold">
                                      {getInitials(activity.user)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{activity.user}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 sm:py-16 text-gray-400">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <Activity className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-sm sm:text-base font-medium">No activity yet</p>
                        <p className="text-xs mt-1">Activity will appear here as you interact with the lead</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TASKS TAB */}
                <TabsContent value="tasks" className="mt-0">
                  <div className="space-y-3 sm:space-y-4">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add New Task
                    </Button>
                    {lead.tasks && lead.tasks.length > 0 ? (
                      lead.tasks.map(task => (
                        <Card key={task.id} className={`border-2 transition-all hover:shadow-md ${
                          task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200 hover:border-blue-300'
                        }`}>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                className="mt-1 w-4 h-4 rounded border-gray-300"
                                readOnly
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-sm sm:text-base ${
                                  task.completed ? 'line-through text-gray-400' : 'text-gray-900'
                                }`}>{task.title}</h4>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                                  <span className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                    {task.dueDate}
                                  </span>
                                  <Badge variant="outline" className={`text-xs ${
                                    task.priority === 'high' ? 'border-red-500 text-red-700 bg-red-50' :
                                    task.priority === 'medium' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                    'border-gray-500 text-gray-700 bg-gray-50'
                                  }`}>
                                    {task.priority === 'high' ? '🔴 ' : task.priority === 'medium' ? '🟡 ' : '⚪ '}
                                    {task.priority}
                                  </Badge>
                                  <span className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                                    {task.assignedTo}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12 sm:py-16 text-gray-400">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <CheckCheck className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-sm sm:text-base font-medium">No tasks yet</p>
                        <p className="text-xs mt-1">Create tasks to track your work with this lead</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* PROPOSALS TAB */}
                <TabsContent value="proposals" className="mt-0 space-y-4 sm:space-y-6">
                  {/* Create/Edit Proposal Form */}
                  {showProposalForm ? (
                    <Card className="border-2 border-rose-200 shadow-md">
                      <CardHeader className="pb-3 bg-gradient-to-r from-rose-50 to-pink-50">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-rose-900">
                          <FileCheck className="w-5 h-5" />
                          {editingProposal ? "Edit Proposal" : "Create New Proposal"}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {editingProposal ? "Update proposal details" : "Create a proposal for"} {lead.name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 space-y-4">
                        {/* Proposal Title */}
                        <div className="space-y-2">
                          <Label htmlFor="proposal-title" className="text-sm font-medium">
                            Proposal Title <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="proposal-title"
                            value={proposalForm.title}
                            onChange={(e) => setProposalForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Annual Software License Proposal"
                            className="text-sm border-rose-200"
                          />
                        </div>

                        {/* Line Items */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Line Items</Label>
                          
                          {/* Existing Line Items */}
                          {proposalForm.lineItems.length > 0 && (
                            <div className="space-y-2 mb-3">
                              {proposalForm.lineItems.map(item => (
                                <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{item.description}</p>
                                    <p className="text-xs text-gray-600">{item.quantity} x ${item.unitPrice} = ${item.total}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveLineItem(item.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Line Item */}
                          <div className="grid grid-cols-12 gap-2">
                            <Input
                              placeholder="Description"
                              value={newLineItem.description}
                              onChange={(e) => setNewLineItem(prev => ({ ...prev, description: e.target.value }))}
                              className="col-span-6 text-sm"
                            />
                            <Input
                              type="number"
                              placeholder="Qty"
                              value={newLineItem.quantity}
                              onChange={(e) => setNewLineItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                              className="col-span-2 text-sm"
                              min="1"
                            />
                            <Input
                              type="number"
                              placeholder="Price"
                              value={newLineItem.unitPrice}
                              onChange={(e) => setNewLineItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                              className="col-span-3 text-sm"
                              min="0"
                            />
                            <Button
                              size="sm"
                              onClick={handleAddLineItem}
                              className="col-span-1 bg-rose-600 hover:bg-rose-700 text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Proposal Notes */}
                        <div className="space-y-2">
                          <Label htmlFor="proposal-notes" className="text-sm font-medium">
                            Additional Notes
                          </Label>
                          <Textarea
                            id="proposal-notes"
                            value={proposalForm.notes}
                            onChange={(e) => setProposalForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Terms, conditions, or additional information..."
                            className="min-h-[100px] text-sm border-rose-200"
                          />
                        </div>

                        {/* Pricing Summary */}
                        {proposalForm.lineItems.length > 0 && (
                          <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>${proposalForm.lineItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tax (10%):</span>
                                <span>${(proposalForm.lineItems.reduce((sum, item) => sum + item.total, 0) * 0.1).toLocaleString()}</span>
                              </div>
                              <Separator className="my-2" />
                              <div className="flex justify-between font-bold text-base">
                                <span>Total:</span>
                                <span className="text-rose-700">${(proposalForm.lineItems.reduce((sum, item) => sum + item.total, 0) * 1.1).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setShowProposalForm(false);
                              setProposalForm({ title: "", lineItems: [], notes: "" });
                              setEditingProposal(null);
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveProposal}
                            className="flex-1 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {editingProposal ? "Update" : "Create"} Proposal
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Button 
                      onClick={() => setShowProposalForm(true)}
                      className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-md"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create New Proposal
                    </Button>
                  )}

                  {/* Proposal Detail View */}
                  {viewingProposal && !showProposalForm && (
                    <Card className="border-3 border-rose-400 shadow-2xl">
                      <CardHeader className="pb-4 bg-gradient-to-r from-rose-100 via-pink-100 to-rose-100 border-b-2 border-rose-300">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl font-bold text-rose-900 flex items-center gap-2 mb-2">
                              <FileCheck className="w-6 h-6" />
                              {viewingProposal.title}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <Badge className="bg-white text-rose-900 border-2 border-rose-300 font-semibold">
                                Version {viewingProposal.version}
                              </Badge>
                              <Badge className={`font-semibold ${
                                viewingProposal.status === 'draft' ? 'bg-gray-500 text-white' :
                                viewingProposal.status === 'sent' ? 'bg-blue-500 text-white' :
                                viewingProposal.status === 'viewed' ? 'bg-purple-500 text-white' :
                                viewingProposal.status === 'accepted' ? 'bg-green-500 text-white' :
                                'bg-red-500 text-white'
                              }`}>
                                {viewingProposal.status.toUpperCase()}
                              </Badge>
                              <span className="text-gray-700 font-medium">{viewingProposal.id}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingProposal(null)}
                            className="border-2"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Close
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {/* Lead Information */}
                        <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200">
                          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4 text-cyan-600" />
                            Client Information
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-600">Name</p>
                              <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Company</p>
                              <p className="text-sm font-semibold text-gray-900">{lead.company}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Email</p>
                              <p className="text-sm font-semibold text-gray-900">{lead.email}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Phone</p>
                              <p className="text-sm font-semibold text-gray-900">{lead.phone}</p>
                            </div>
                          </div>
                        </div>

                        {/* Line Items Detailed View */}
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-rose-600" />
                            Line Items
                          </h3>
                          <div className="space-y-3">
                            {viewingProposal.lineItems.map((item, index) => (
                              <div key={item.id} className="p-4 bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 rounded-xl border-2 border-rose-200">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900 text-base">
                                      {index + 1}. {item.description}
                                    </p>
                                  </div>
                                  <Badge className="bg-rose-600 text-white font-bold">
                                    ${item.total.toLocaleString()}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>Quantity: <strong className="text-gray-900">{item.quantity}</strong></span>
                                  <span>×</span>
                                  <span>Unit Price: <strong className="text-gray-900">${item.unitPrice.toLocaleString()}</strong></span>
                                  <span>=</span>
                                  <span className="font-bold text-gray-900">${item.total.toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Pricing Summary */}
                        <div className="p-6 bg-gradient-to-br from-rose-100 via-pink-100 to-rose-100 rounded-2xl border-3 border-rose-300 shadow-lg">
                          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-rose-600" />
                            Pricing Summary
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <span className="text-gray-700 font-medium">Subtotal:</span>
                              <span className="text-lg font-semibold text-gray-900">${viewingProposal.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <span className="text-gray-700 font-medium">Tax (10%):</span>
                              <span className="text-lg font-semibold text-gray-900">${viewingProposal.tax.toLocaleString()}</span>
                            </div>
                            <Separator className="bg-rose-300" />
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-200 to-pink-200 rounded-xl border-2 border-rose-400">
                              <span className="text-xl font-bold text-rose-900">Total Amount:</span>
                              <span className="text-3xl font-bold text-rose-700">${viewingProposal.total.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Timeline & Notes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              Timeline
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Created:</span>
                                <span className="font-semibold text-gray-900">{viewingProposal.createdAt}</span>
                              </div>
                              {viewingProposal.sentAt && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Sent:</span>
                                  <span className="font-semibold text-gray-900">{viewingProposal.sentAt}</span>
                                </div>
                              )}
                              {viewingProposal.validUntil && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Valid Until:</span>
                                  <span className="font-semibold text-orange-900">{viewingProposal.validUntil}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600">Created By:</span>
                                <span className="font-semibold text-gray-900">{viewingProposal.createdBy}</span>
                              </div>
                            </div>
                          </div>

                          {viewingProposal.notes && (
                            <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-yellow-600" />
                                Notes
                              </h4>
                              <p className="text-sm text-gray-700 leading-relaxed">{viewingProposal.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <Button
                            onClick={() => {
                              if (viewingProposal) {
                                setEditingProposal(viewingProposal);
                                setProposalForm({
                                  title: viewingProposal.title,
                                  lineItems: viewingProposal.lineItems,
                                  notes: viewingProposal.notes || ""
                                });
                                setShowProposalForm(true);
                                setViewingProposal(null);
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => viewingProposal && handleDownloadProposal(viewingProposal)}
                            variant="outline"
                            className="border-2 border-green-500 text-green-700 hover:bg-green-50"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          {viewingProposal?.status === 'draft' && (
                            <Button
                              onClick={() => viewingProposal && handleSendProposal(viewingProposal.id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Send
                            </Button>
                          )}
                          <Button
                            onClick={() => setViewingProposal(null)}
                            variant="outline"
                            className="border-2"
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Back to List
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Proposals List */}
                  {!viewingProposal && lead.proposals && lead.proposals.length > 0 ? (
                    <div className="space-y-4">
                      {lead.proposals.map(proposal => (
                          <Card key={proposal.id} className="border-2 border-rose-200 shadow-md hover:shadow-lg transition-all">
                            <CardHeader className="pb-3 bg-gradient-to-r from-rose-50 to-pink-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-base sm:text-lg text-rose-900">
                                    {proposal.title}
                                  </CardTitle>
                                  <CardDescription className="text-sm mt-1">
                                    Version {proposal.version} • Created by {proposal.createdBy}
                                  </CardDescription>
                                </div>
                                <Badge className={`${
                                  proposal.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                  proposal.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                  proposal.status === 'viewed' ? 'bg-purple-100 text-purple-800' :
                                  proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {proposal.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                              {/* Line Items Summary */}
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Line Items</h4>
                                <div className="space-y-2">
                                  {proposal.lineItems.slice(0, 3).map(item => (
                                    <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                                      <span className="text-gray-700">{item.description}</span>
                                      <span className="font-medium text-gray-900">${item.total.toLocaleString()}</span>
                                    </div>
                                  ))}
                                  {proposal.lineItems.length > 3 && (
                                    <p className="text-xs text-gray-500 text-center">
                                      +{proposal.lineItems.length - 3} more items
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Pricing Summary */}
                              <div className="p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-200">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-medium">${proposal.subtotal.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Tax:</span>
                                    <span className="font-medium">${proposal.tax.toLocaleString()}</span>
                                  </div>
                                  <Separator className="my-2" />
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-900">Total:</span>
                                    <span className="text-lg font-bold text-rose-700">${proposal.total.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Timeline */}
                              <div className="mt-4 space-y-2 text-xs text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  <span>Created: {proposal.createdAt}</span>
                                </div>
                                {proposal.sentAt && (
                                  <div className="flex items-center gap-2">
                                    <Send className="w-3 h-3 text-blue-600" />
                                    <span>Sent: {proposal.sentAt}</span>
                                  </div>
                                )}
                                {proposal.viewedAt && (
                                  <div className="flex items-center gap-2">
                                    <Eye className="w-3 h-3 text-purple-600" />
                                    <span>Viewed: {proposal.viewedAt}</span>
                                  </div>
                                )}
                                {proposal.respondedAt && (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                    <span>Responded: {proposal.respondedAt}</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="mt-4 flex flex-wrap gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="flex-1 hover:bg-blue-50 hover:border-blue-400"
                                  onClick={() => setViewingProposal(proposal)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="flex-1 hover:bg-purple-50 hover:border-purple-400"
                                  onClick={() => handleEditProposal(proposal)}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="flex-1 hover:bg-green-50 hover:border-green-400"
                                  onClick={() => handleSendProposal(proposal.id)}
                                  disabled={proposal.status !== "draft"}
                                >
                                  <Send className="w-3 h-3 mr-1" />
                                  {proposal.status === "draft" ? "Send" : "Sent"}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="flex-1 hover:bg-orange-50 hover:border-orange-400"
                                  onClick={() => handleDownloadProposal(proposal)}
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  PDF
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                  ) : !showProposalForm ? (
                    <div className="text-center py-12 sm:py-16 text-gray-400">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                        <FileCheck className="w-8 h-8 text-rose-600" />
                      </div>
                      <p className="text-sm sm:text-base font-medium">No proposals yet</p>
                      <p className="text-xs mt-1 mb-4">Create your first proposal for this lead</p>
                    </div>
                  ) : null}
                </TabsContent>

                {/* NOTES TAB */}
                <TabsContent value="notes" className="mt-0 space-y-4 sm:space-y-6">
                  <Card className="border-2 border-blue-200 shadow-md">
                    <CardContent className="p-3 sm:p-4">
                      <Textarea 
                        placeholder="Add a note about this lead..."
                        rows={3}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        className="mb-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-400"
                      />
                      <div className="flex justify-end">
                        <Button 
                          size="sm" 
                          onClick={handleAddNote}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Note
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  {lead.notes && lead.notes.length > 0 ? (
                    <div className="space-y-3">
                      {lead.notes.map(note => (
                        <Card key={note.id} className="border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                          <CardContent className="p-3 sm:p-4">
                            <p className="text-sm sm:text-base text-gray-700 mb-3 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                              <Avatar className="w-5 h-5 ring-1 ring-gray-200">
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs font-semibold">
                                  {getInitials(note.createdBy)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{note.createdBy}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {note.createdAt}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 sm:py-16 text-gray-400">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="text-sm sm:text-base font-medium">No notes yet</p>
                      <p className="text-xs mt-1">Add notes to keep track of important information</p>
                    </div>
                  )}
                </TabsContent>

                {/* FILES TAB */}
                <TabsContent value="files" className="mt-0">
                  <div className="text-center py-12 sm:py-16 text-gray-400">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                      <Paperclip className="w-8 h-8 text-orange-600" />
                    </div>
                    <p className="text-sm sm:text-base font-medium">No files yet</p>
                    <p className="text-xs mt-1 mb-4">Upload files related to this lead</p>
                    <Button className="mt-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-md">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                  </div>
                </TabsContent>

                {/* REMINDERS TAB - Follow-up System */}
                <TabsContent value="reminders" className="mt-0 space-y-4 sm:space-y-6">

                  {/* Reminder Form */}
                  <Card className="border-2 border-teal-200 shadow-md">
                    <CardHeader className="pb-3 bg-gradient-to-r from-teal-50 to-cyan-50">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-teal-900">
                        <Bell className="w-5 h-5" />
                        {editingReminder ? "Edit Follow-up Reminder" : "Schedule Follow-up Reminder"}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {editingReminder ? `Update reminder for ${lead.name}` : `Set a reminder to follow up with ${lead.name}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Date Picker */}
                        <div className="space-y-2">
                          <Label htmlFor="reminder-date" className="text-sm font-medium flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            Date <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="reminder-date"
                            type="date"
                            value={reminderDate}
                            onChange={(e) => setReminderDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="text-sm w-full border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                          />
                          {reminderDate && new Date(reminderDate) < new Date(new Date().setHours(0, 0, 0, 0)) && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Date cannot be in the past
                            </p>
                          )}
                        </div>
                        
                        {/* Time Picker */}
                        <div className="space-y-2">
                          <Label htmlFor="reminder-time" className="text-sm font-medium flex items-center gap-1">
                            <Clock className="w-4 h-4 text-purple-600" />
                            Time <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="reminder-time"
                            type="time"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="text-sm w-full border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Priority Selector */}
                        <div className="space-y-2">
                          <Label htmlFor="reminder-priority" className="text-sm font-medium flex items-center gap-1">
                            <Flag className="w-4 h-4 text-purple-600" />
                            Priority
                          </Label>
                          <Select
                            value={reminderPriority}
                            onValueChange={(value: "high" | "medium" | "low") => setReminderPriority(value)}
                          >
                            <SelectTrigger className="w-full text-sm border-purple-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high" className="text-sm">
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                  High Priority
                                </span>
                              </SelectItem>
                              <SelectItem value="medium" className="text-sm">
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                  Medium Priority
                                </span>
                              </SelectItem>
                              <SelectItem value="low" className="text-sm">
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  Low Priority
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Category Selector */}
                        <div className="space-y-2">
                          <Label htmlFor="reminder-category" className="text-sm font-medium flex items-center gap-1">
                            <TagIcon className="w-4 h-4 text-purple-600" />
                            Category
                          </Label>
                          <Select
                            value={reminderCategory}
                            onValueChange={setReminderCategory}
                          >
                            <SelectTrigger className="w-full text-sm border-purple-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="follow-up" className="text-sm">Follow-up Call</SelectItem>
                              <SelectItem value="meeting" className="text-sm">Schedule Meeting</SelectItem>
                              <SelectItem value="email" className="text-sm">Send Email</SelectItem>
                              <SelectItem value="proposal" className="text-sm">Send Proposal</SelectItem>
                              <SelectItem value="demo" className="text-sm">Product Demo</SelectItem>
                              <SelectItem value="contract" className="text-sm">Contract Review</SelectItem>
                              <SelectItem value="other" className="text-sm">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Notify Before */}
                        <div className="space-y-2">
                          <Label htmlFor="reminder-notify" className="text-sm font-medium flex items-center gap-1">
                            <Bell className="w-4 h-4 text-purple-600" />
                            Notify Before
                          </Label>
                          <Select
                            value={String(reminderNotifyBefore)}
                            onValueChange={(value) => setReminderNotifyBefore(Number(value))}
                          >
                            <SelectTrigger className="w-full text-sm border-purple-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5" className="text-sm">5 minutes</SelectItem>
                              <SelectItem value="15" className="text-sm">15 minutes</SelectItem>
                              <SelectItem value="30" className="text-sm">30 minutes</SelectItem>
                              <SelectItem value="60" className="text-sm">1 hour</SelectItem>
                              <SelectItem value="120" className="text-sm">2 hours</SelectItem>
                              <SelectItem value="1440" className="text-sm">1 day</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Recurrence Selector - NEW */}
                      <div className="space-y-2">
                        <Label htmlFor="reminder-recurrence" className="text-sm font-medium flex items-center gap-1">
                          <RotateCw className="w-4 h-4 text-purple-600" />
                          Recurrence Pattern
                        </Label>
                        <Select
                          value={reminderRecurrence}
                          onValueChange={(value: "once" | "daily" | "weekly" | "monthly") => setReminderRecurrence(value)}
                        >
                          <SelectTrigger className="w-full text-sm border-purple-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once" className="text-sm">
                              <span className="flex items-center gap-2">
                                Once (No repeat)
                              </span>
                            </SelectItem>
                            <SelectItem value="daily" className="text-sm">
                              <span className="flex items-center gap-2">
                                🔄 Daily (Auto-reschedule every day)
                              </span>
                            </SelectItem>
                            <SelectItem value="weekly" className="text-sm">
                              <span className="flex items-center gap-2">
                                🔄 Weekly (Auto-reschedule every week)
                              </span>
                            </SelectItem>
                            <SelectItem value="monthly" className="text-sm">
                              <span className="flex items-center gap-2">
                                🔄 Monthly (Auto-reschedule every month)
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {reminderRecurrence !== "once" && (
                          <p className="text-xs text-blue-600 flex items-center gap-1 bg-blue-50 p-2 rounded mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            When cancelled, this reminder will automatically reschedule to the next {reminderRecurrence === "daily" ? "day" : reminderRecurrence === "weekly" ? "week" : "month"}
                          </p>
                        )}
                      </div>
                      
                      {/* Reminder Message */}
                      <div className="space-y-2">
                        <Label htmlFor="reminder-message" className="text-sm font-medium flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-purple-600" />
                          Reminder Message <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="reminder-message"
                          placeholder="Enter reminder message... (e.g., 'Follow up on pricing proposal')" 
                          value={reminderMessage}
                          onChange={(e) => setReminderMessage(e.target.value)}
                          rows={3}
                          className="text-sm resize-none border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                        />
                        <p className="text-xs text-gray-500">{reminderMessage.length} / 500 characters</p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                        {editingReminder && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingReminder(null);
                              setReminderDate("");
                              setReminderTime("");
                              setReminderMessage("");
                              setReminderPriority("medium");
                              setReminderCategory("follow-up");
                              setReminderNotifyBefore(15);
                              setReminderRecurrence("once");
                            }}
                            className="w-full sm:w-auto border-gray-300"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                        <Button
                          onClick={() => {
                            // Validation
                            if (!reminderDate || !reminderTime || !reminderMessage.trim()) {
                              toast({
                                title: "⚠️ Missing Information",
                                description: "Please fill in date, time, and message to set a reminder.",
                                variant: "destructive",
                                duration: 3000,
                              });
                              return;
                            }

                            // Validate date is not in the past
                            const reminderDateTime = new Date(`${reminderDate}T${reminderTime}`);
                            if (reminderDateTime < new Date()) {
                              toast({
                                title: "⚠️ Invalid Date/Time",
                                description: "Reminder date and time cannot be in the past.",
                                variant: "destructive",
                                duration: 3000,
                              });
                              return;
                            }

                            if (editingReminder) {
                              // Update existing reminder
                              if (onUpdateLead) {
                                onUpdateLead(lead.id, (l) => ({
                                  reminders: l.reminders?.map(r => 
                                    r.id === editingReminder.id
                                      ? {
                                          ...r,
                                          date: reminderDate,
                                          time: reminderTime,
                                          message: reminderMessage,
                                          priority: reminderPriority,
                                          category: reminderCategory,
                                          notifyBefore: reminderNotifyBefore,
                                          recurrence: reminderRecurrence
                                        }
                                      : r
                                  )
                                }));
                              }

                              toast({
                                title: "✅ Reminder Updated",
                                description: `Reminder updated successfully`,
                                duration: 3000,
                              });

                              setEditingReminder(null);
                            } else {
                              // Create new reminder
                              const newReminder: Reminder = {
                                id: String(Date.now()),
                                date: reminderDate,
                                time: reminderTime,
                                message: reminderMessage,
                                priority: reminderPriority,
                                category: reminderCategory,
                                notifyBefore: reminderNotifyBefore,
                                recurrence: reminderRecurrence,
                                createdBy: "Current User",
                                createdAt: new Date().toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true
                                }),
                                completed: false,
                                status: "pending",
                                rescheduledCount: 0
                              };

                              // Update lead with new reminder
                              if (onUpdateLead) {
                                onUpdateLead(lead.id, (l) => ({
                                  reminders: [newReminder, ...(l.reminders || [])]
                                }));
                              }

                              // Success toast
                              toast({
                                title: "✅ Reminder Set",
                                description: `Follow-up reminder scheduled for ${new Date(reminderDate).toLocaleDateString()} at ${reminderTime}`,
                                duration: 3000,
                              });
                            }

                            // Clear form
                            setReminderDate("");
                            setReminderTime("");
                            setReminderMessage("");
                            setReminderPriority("medium");
                            setReminderCategory("follow-up");
                            setReminderNotifyBefore(15);
                            setReminderRecurrence("once");
                          }}
                          className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingReminder ? "Update Reminder" : "Save Reminder"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reminders List */}
                  {lead.reminders && lead.reminders.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                          <History className="w-4 h-4" />
                          Scheduled Reminders ({lead.reminders.filter(r => r.status === "pending").length} active)
                        </h3>
                        <div className="flex items-center gap-2">
                          {lead.reminders.filter(r => r.completed).length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {lead.reminders.filter(r => r.completed).length} completed
                            </Badge>
                          )}
                          {lead.reminders.filter(r => r.status === "cancelled").length > 0 && (
                            <Badge variant="outline" className="text-xs bg-gray-100">
                              {lead.reminders.filter(r => r.status === "cancelled").length} cancelled
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {lead.reminders
                        .sort((a, b) => {
                          // Sort by status first, then by date/time
                          if (a.status === "cancelled" && b.status !== "cancelled") return 1;
                          if (a.status !== "cancelled" && b.status === "cancelled") return -1;
                          if (a.completed && !b.completed) return 1;
                          if (!a.completed && b.completed) return -1;
                          return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
                        })
                        .map(reminder => {
                          const reminderDateTime = new Date(`${reminder.date}T${reminder.time}`);
                          const isOverdue = reminderDateTime < new Date() && !reminder.completed && reminder.status === "pending";
                          const isUpcoming = reminderDateTime > new Date() && reminderDateTime < new Date(Date.now() + 24 * 60 * 60 * 1000);
                          const isCancelled = reminder.status === "cancelled";
                          
                          return (
                            <Card key={reminder.id} className={`border-2 transition-all ${
                              isCancelled
                                ? 'border-gray-300 bg-gray-50 opacity-70'
                                : reminder.completed 
                                  ? 'border-gray-200 bg-gray-50' 
                                  : isOverdue
                                    ? 'border-red-300 bg-red-50 hover:border-red-400 hover:shadow-md'
                                    : isUpcoming
                                      ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-400 hover:shadow-md'
                                      : 'border-purple-200 hover:border-purple-300 hover:shadow-md bg-white'
                            }`}>
                              <CardContent className="p-3 sm:p-4">
                                <div className="flex flex-col sm:flex-row items-start gap-3">
                                  {/* Completion Checkbox - for non-cancelled */}
                                  {!isCancelled && (
                                    <div className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={reminder.completed || false}
                                        onChange={() => {
                                          if (onUpdateLead) {
                                            onUpdateLead(lead.id, (l) => ({
                                              reminders: l.reminders?.map(r => 
                                                r.id === reminder.id 
                                                  ? { ...r, completed: !r.completed, status: !r.completed ? "completed" : "pending" } 
                                                  : r
                                              )
                                            }));
                                          }
                                        }}
                                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer flex-shrink-0"
                                        title={reminder.completed ? "Mark as incomplete" : "Mark as complete"}
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Content */}
                                  <div className="flex-1 min-w-0 w-full">
                                    {/* Priority and Category Badges */}
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      {reminder.priority && (
                                        <Badge 
                                          variant="outline"
                                          className={`text-xs ${
                                            reminder.priority === "high"
                                              ? "border-red-300 bg-red-50 text-red-700"
                                              : reminder.priority === "medium"
                                                ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                                                : "border-green-300 bg-green-50 text-green-700"
                                          }`}
                                        >
                                          <Flag className="w-3 h-3 mr-1" />
                                          {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
                                        </Badge>
                                      )}
                                      {reminder.category && (
                                        <Badge variant="outline" className="text-xs border-purple-300 bg-purple-50 text-purple-700">
                                          <TagIcon className="w-3 h-3 mr-1" />
                                          {reminder.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </Badge>
                                      )}
                                      {reminder.recurrence && reminder.recurrence !== "once" && (
                                        <Badge variant="outline" className="text-xs border-blue-300 bg-blue-50 text-blue-700">
                                          <RotateCw className="w-3 h-3 mr-1" />
                                          {reminder.recurrence.charAt(0).toUpperCase() + reminder.recurrence.slice(1)}
                                        </Badge>
                                      )}
                                      {isCancelled && (
                                        <Badge variant="outline" className="text-xs border-gray-400 bg-gray-200 text-gray-700">
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Cancelled
                                        </Badge>
                                      )}
                                      {reminder.rescheduledCount > 0 && (
                                        <Badge variant="outline" className="text-xs border-orange-300 bg-orange-50 text-orange-700">
                                          <Archive className="w-3 h-3 mr-1" />
                                          Rescheduled {reminder.rescheduledCount}x
                                        </Badge>
                                      )}
                                      {isOverdue && !reminder.completed && !isCancelled && (
                                        <Badge variant="destructive" className="text-xs">
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          Overdue
                                        </Badge>
                                      )}
                                      {isUpcoming && !reminder.completed && !isCancelled && (
                                        <Badge className="text-xs bg-yellow-500">
                                          <Zap className="w-3 h-3 mr-1" />
                                          Due Soon
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Lead Name */}
                                    <p className="text-xs text-gray-500 mb-1 font-medium">
                                      {lead.name} - {lead.company}
                                    </p>

                                    {/* Message */}
                                    <p className={`text-sm sm:text-base mb-2 leading-relaxed ${
                                      reminder.completed || isCancelled ? 'line-through text-gray-400' : 'text-gray-700 font-medium'
                                    }`}>
                                      {reminder.message}
                                    </p>

                                    {/* Cancellation Reason */}
                                    {isCancelled && reminder.cancellationReason && (
                                      <div className="mb-2 p-2 bg-gray-100 border-l-2 border-gray-400 rounded text-xs text-gray-600">
                                        <strong>Reason:</strong> {reminder.cancellationReason}
                                        {reminder.rescheduledTo && (
                                          <span className="block mt-1 text-blue-600">
                                            → Rescheduled automatically
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                      <span className={`flex items-center gap-1 px-2 py-1 rounded ${
                                        isOverdue && !reminder.completed ? 'bg-red-100 text-red-700' : 'bg-purple-50'
                                      }`}>
                                        <Calendar className="w-3 h-3" />
                                        {new Date(reminder.date).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric', 
                                          year: 'numeric' 
                                        })}
                                      </span>
                                      <span className={`flex items-center gap-1 px-2 py-1 rounded ${
                                        isOverdue && !reminder.completed ? 'bg-red-100 text-red-700' : 'bg-pink-50'
                                      }`}>
                                        <Clock className="w-3 h-3" />
                                        {reminder.time}
                                      </span>
                                      {reminder.notifyBefore && (
                                        <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                                          <Bell className="w-3 h-3" />
                                          {reminder.notifyBefore >= 1440 
                                            ? `${reminder.notifyBefore / 1440} day${reminder.notifyBefore / 1440 > 1 ? 's' : ''} before`
                                            : reminder.notifyBefore >= 60
                                              ? `${reminder.notifyBefore / 60} hr${reminder.notifyBefore / 60 > 1 ? 's' : ''} before`
                                              : `${reminder.notifyBefore} min before`
                                          }
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {reminder.createdBy}
                                      </span>
                                      {reminder.createdAt && (
                                        <>
                                          <span>•</span>
                                          <span className="text-gray-400">{reminder.createdAt}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 mt-3 sm:mt-0 justify-end sm:justify-start w-full sm:w-auto">
                                    {!reminder.completed && reminder.status === "pending" && (
                                      <>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  setEditingReminder(reminder);
                                                  setReminderDate(reminder.date);
                                                  setReminderTime(reminder.time);
                                                  setReminderMessage(reminder.message);
                                                  setReminderPriority(reminder.priority || "medium");
                                                  setReminderCategory(reminder.category || "follow-up");
                                                  setReminderNotifyBefore(reminder.notifyBefore || 15);
                                                  setReminderRecurrence(reminder.recurrence || "once");
                                                  
                                                  // Scroll to form
                                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 sm:h-9"
                                              >
                                                <Edit className="w-4 h-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Edit reminder</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRescheduleReminder(reminder)}
                                                className="text-purple-500 hover:text-purple-700 hover:bg-purple-50 h-8 sm:h-9"
                                              >
                                                <CalendarClock className="w-4 h-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Reschedule reminder</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCancelAndReschedule(reminder.id)}
                                                className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 h-8 sm:h-9"
                                              >
                                                {reminder.recurrence !== "once" ? (
                                                  <RotateCw className="w-4 h-4" />
                                                ) : (
                                                  <XCircle className="w-4 h-4" />
                                                )}
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>
                                                {reminder.recurrence !== "once" 
                                                  ? `Cancel & auto-reschedule (${reminder.recurrence})`
                                                  : "Cancel reminder"
                                                }
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  const tomorrow = new Date();
                                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                                  
                                                  if (onUpdateLead) {
                                                    onUpdateLead(lead.id, (l) => ({
                                                      reminders: l.reminders?.map(r => 
                                                        r.id === reminder.id
                                                          ? {
                                                              ...r,
                                                              date: tomorrow.toISOString().split('T')[0],
                                                              snoozedUntil: tomorrow.toISOString()
                                                            }
                                                          : r
                                                      )
                                                    }));
                                                  }
                                                  
                                                  toast({
                                                    title: "⏰ Reminder Snoozed",
                                                    description: "Reminder postponed until tomorrow",
                                                    duration: 2000,
                                                  });
                                                }}
                                                className="text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 h-8 sm:h-9"
                                              >
                                                <Clock3 className="w-4 h-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Snooze until tomorrow</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </>
                                    )}

                                    {/* Reschedule button for cancelled reminders */}
                                    {isCancelled && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleRescheduleReminder(reminder)}
                                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 sm:h-9"
                                            >
                                              <RotateCw className="w-4 h-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Reschedule cancelled reminder</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}

                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              if (confirm('Delete this reminder permanently?')) {
                                                if (onUpdateLead) {
                                                  onUpdateLead(lead.id, (l) => ({
                                                    reminders: l.reminders?.filter(r => r.id !== reminder.id)
                                                  }));
                                                }
                                                toast({
                                                  title: "🗑️ Reminder Deleted",
                                                  description: "The reminder has been removed.",
                                                  duration: 2000,
                                                });
                                              }
                                            }}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 sm:h-9"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Delete reminder permanently</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      }
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12 text-gray-400">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <Bell className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-sm sm:text-base font-medium">No reminders scheduled yet</p>
                      <p className="text-xs mt-1">Create your first reminder above to stay on top of follow-ups</p>
                    </div>
                  )}

                  {/* Cancel Reminder Dialog */}
                  <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Reminder</AlertDialogTitle>
                        <AlertDialogDescription>
                          {selectedReminderForAction?.recurrence !== "once" 
                            ? `This is a ${selectedReminderForAction?.recurrence} recurring reminder. Cancelling will automatically create the next occurrence.`
                            : "Are you sure you want to cancel this reminder? You can provide a reason below."
                          }
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      
                      <div className="space-y-2 py-4">
                        <Label htmlFor="cancellation-reason">Cancellation Reason (Optional)</Label>
                        <Textarea
                          id="cancellation-reason"
                          placeholder="Enter reason for cancellation..."
                          value={cancellationReason}
                          onChange={(e) => setCancellationReason(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>

                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                          setCancelDialogOpen(false);
                          setSelectedReminderForAction(null);
                          setCancellationReason("");
                        }}>
                          Keep Reminder
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={confirmCancelReminder}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          Cancel Reminder
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Reschedule Reminder Dialog */}
                  <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reschedule Reminder</DialogTitle>
                        <DialogDescription>
                          Update the date and time for this reminder.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        {selectedReminderForAction && (
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-1">Current Schedule</p>
                            <p className="text-xs text-gray-500">
                              {new Date(selectedReminderForAction.date).toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })} at {selectedReminderForAction.time}
                            </p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="reschedule-date">New Date</Label>
                          <Input
                            id="reschedule-date"
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reschedule-time">New Time</Label>
                          <Input
                            id="reschedule-time"
                            type="time"
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setRescheduleDialogOpen(false);
                            setSelectedReminderForAction(null);
                            setRescheduleDate("");
                            setRescheduleTime("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={confirmReschedule}
                          className="bg-purple-500 hover:bg-purple-600"
                        >
                          <CalendarClock className="w-4 h-4 mr-2" />
                          Reschedule
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Add Assignee Dialog */}
                  <Dialog open={showAddAssigneeDialog} onOpenChange={setShowAddAssigneeDialog}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Assignee</DialogTitle>
                        <DialogDescription>
                          Add a new team member to the assignee list.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-assignee-name">Full Name</Label>
                          <Input
                            id="new-assignee-name"
                            type="text"
                            placeholder="Enter full name..."
                            value={newAssigneeName}
                            onChange={(e) => setNewAssigneeName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddNewAssignee();
                              }
                            }}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddAssigneeDialog(false);
                            setNewAssigneeName("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddNewAssignee}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Assignee
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TabsContent>

                {/* LEAD STATUS TAB */}
                <TabsContent value="lead-status" className="mt-0 space-y-4 sm:space-y-6">
                  <Card className="border-2 border-teal-200 shadow-md">
                    <CardHeader className="pb-3 bg-gradient-to-r from-teal-50 to-emerald-50">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-teal-900">
                        <Flag className="w-5 h-5" />
                        Update Lead Status
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Manage status, priority, and pipeline stage for {lead.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Lead Status */}
                        <div className="space-y-2">
                          <Label htmlFor="lead-status-select" className="text-sm font-medium flex items-center gap-1">
                            <Flag className="w-4 h-4 text-teal-600" />
                            Lead Status
                          </Label>
                          <Select value={currentStatus} onValueChange={(value: any) => setCurrentStatus(value)}>
                            <SelectTrigger id="lead-status-select" className="w-full text-sm border-teal-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getAllStatusesSorted().map(status => {
                                const config = LEAD_STATUS_CONFIG[status];
                                const Icon = config.icon;
                                return (
                                  <SelectItem key={status} value={status}>
                                    <div className="flex items-center gap-2">
                                      <Icon className={`w-4 h-4 ${config.textColor}`} />
                                      {config.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                          <Label htmlFor="priority-select" className="text-sm font-medium flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-teal-600" />
                            Priority Level
                          </Label>
                          <Select value={currentPriority} onValueChange={(value: any) => setCurrentPriority(value)}>
                            <SelectTrigger id="priority-select" className="w-full text-sm border-teal-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">🔥 High Priority</SelectItem>
                              <SelectItem value="medium">⚡ Medium Priority</SelectItem>
                              <SelectItem value="low">📌 Low Priority</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Current Status Display */}
                      <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border-2 border-teal-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Status</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <Badge className={`${
                              lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                              lead.status === 'contacted' ? 'bg-cyan-100 text-cyan-800' :
                              lead.status === 'qualified' ? 'bg-purple-100 text-purple-800' :
                              lead.status === 'proposal' ? 'bg-orange-100 text-orange-800' :
                              lead.status === 'negotiation' ? 'bg-yellow-100 text-yellow-800' :
                              lead.status === 'won' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {lead.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Priority:</span>
                            <Badge variant="outline" className={`${
                              lead.priority === 'high' ? 'border-red-500 text-red-700 bg-red-50' :
                              lead.priority === 'medium' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                              'border-gray-500 text-gray-700 bg-gray-50'
                            }`}>
                              {lead.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Last Updated:</span>
                            <span className="text-sm font-medium text-gray-900">{lead.lastContact}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="status-notes" className="text-sm font-medium">
                          Status Update Notes
                        </Label>
                        <Textarea
                          id="status-notes"
                          value={statusNotes}
                          onChange={(e) => setStatusNotes(e.target.value)}
                          placeholder="Add notes about this status change..."
                          className="min-h-[100px] text-sm border-teal-200 focus:border-teal-400 focus:ring-teal-400"
                        />
                      </div>

                      <Button 
                        onClick={handleUpdateStatus}
                        className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Update Status
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Status History */}
                  <Card className="border-2 border-gray-200 shadow-md">
                    <CardHeader className="pb-3 bg-gray-50">
                      <CardTitle className="text-base flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Status History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Status changed to <Badge className="ml-1">{lead.status}</Badge></p>
                            <p className="text-xs text-gray-500 mt-1">Updated on {lead.lastContact}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ASSIGN TAB */}
                <TabsContent value="assign" className="mt-0 space-y-4 sm:space-y-6">
                  <Card className="border-2 border-indigo-200 shadow-md">
                    <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-purple-50">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-indigo-900">
                        <User className="w-5 h-5" />
                        Assign Lead
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Assign {lead.name} to a team member
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4">
                      {/* Current Assignment */}
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Currently Assigned To</h4>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 ring-2 ring-indigo-200">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-semibold text-lg">
                              {getInitials(lead.assignedTo)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{lead.assignedTo}</p>
                            <p className="text-xs text-gray-600">Sales Representative</p>
                          </div>
                          <Badge className="bg-indigo-100 text-indigo-800">Active</Badge>
                        </div>
                      </div>

                      {/* Reassign Section */}
                      <div className="space-y-2">
                        <Label htmlFor="assign-to" className="text-sm font-medium flex items-center gap-1">
                          <Users className="w-4 h-4 text-indigo-600" />
                          Reassign To
                        </Label>
                        <div className="flex gap-2">
                          <Select value={currentAssignee} onValueChange={setCurrentAssignee}>
                            <SelectTrigger id="assign-to" className="w-full text-sm border-indigo-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {teamMembers.map((member) => (
                                <SelectItem key={member} value={member}>👤 {member}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddAssigneeDialog(true)}
                            className="shrink-0 border-indigo-200 hover:bg-indigo-50"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Assignment Reason */}
                      <div className="space-y-2">
                        <Label htmlFor="assign-reason" className="text-sm font-medium">
                          Reason for Assignment/Reassignment
                        </Label>
                        <Textarea
                          id="assign-reason"
                          value={assignmentReason}
                          onChange={(e) => setAssignmentReason(e.target.value)}
                          placeholder="Why is this lead being assigned to this team member..."
                          className="min-h-[100px] text-sm border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
                        />
                      </div>

                      {/* Send Notification */}
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <input 
                          type="checkbox" 
                          id="notify-assignee" 
                          className="w-4 h-4" 
                          checked={notifyAssignee}
                          onChange={(e) => setNotifyAssignee(e.target.checked)}
                        />
                        <Label htmlFor="notify-assignee" className="text-sm cursor-pointer">
                          Send notification email to assignee
                        </Label>
                      </div>

                      <Button 
                        onClick={handleAssignLead}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Assign Lead
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Assignment History */}
                  <Card className="border-2 border-gray-200 shadow-md">
                    <CardHeader className="pb-3 bg-gray-50">
                      <CardTitle className="text-base flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Assignment History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <User className="w-5 h-5 text-indigo-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Assigned to {lead.assignedTo}</p>
                            <p className="text-xs text-gray-500 mt-1">On {lead.createdDate}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* CALL STATUS TAB */}
                <TabsContent value="call-status" className="mt-0 space-y-4 sm:space-y-6">
                  <Card className="border-2 border-violet-200 shadow-md">
                    <CardHeader className="pb-3 bg-gradient-to-r from-violet-50 to-purple-50">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-violet-900">
                        <Phone className="w-5 h-5" />
                        Update Call Status
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Log call outcomes and notes for {lead.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4">
                      {/* Current Call Status */}
                      <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border-2 border-violet-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Call Status</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <Badge className={`${
                            lead.callStatus === 'called' ? 'bg-green-100 text-green-800' :
                            lead.callStatus === 'not_called' ? 'bg-gray-100 text-gray-800' :
                            lead.callStatus === 'no_answer' ? 'bg-yellow-100 text-yellow-800' :
                            lead.callStatus === 'interested' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {lead.callStatus?.replace('_', ' ') || 'Not Called'}
                          </Badge>
                        </div>
                      </div>

                      {/* Call Status Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="call-status-select" className="text-sm font-medium flex items-center gap-1">
                          <Phone className="w-4 h-4 text-violet-600" />
                          Call Status
                        </Label>
                        <Select value={currentCallStatus} onValueChange={(value: any) => setCurrentCallStatus(value)}>
                          <SelectTrigger id="call-status-select" className="w-full text-sm border-violet-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_called">📵 Not Called</SelectItem>
                            <SelectItem value="called">✅ Called</SelectItem>
                            <SelectItem value="no_answer">📞 No Answer</SelectItem>
                            <SelectItem value="interested">👍 Interested</SelectItem>
                            <SelectItem value="not_interested">👎 Not Interested</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Call Outcome */}
                      <div className="space-y-2">
                        <Label htmlFor="call-outcome" className="text-sm font-medium">
                          Call Outcome
                        </Label>
                        <Select value={callOutcome} onValueChange={setCallOutcome}>
                          <SelectTrigger id="call-outcome" className="w-full text-sm border-violet-200">
                            <SelectValue placeholder="Select outcome..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="positive">✅ Positive - Interested</SelectItem>
                            <SelectItem value="followup">📅 Schedule Follow-up</SelectItem>
                            <SelectItem value="voicemail">📧 Left Voicemail</SelectItem>
                            <SelectItem value="callback">🔄 Requested Callback</SelectItem>
                            <SelectItem value="nointerest">❌ Not Interested</SelectItem>
                            <SelectItem value="wrongnumber">📵 Wrong Number</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Call Duration */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="call-duration" className="text-sm font-medium flex items-center gap-1">
                            <Clock className="w-4 h-4 text-violet-600" />
                            Duration (minutes)
                          </Label>
                          <Input
                            id="call-duration"
                            type="number"
                            value={callDuration}
                            onChange={(e) => setCallDuration(e.target.value)}
                            placeholder="5"
                            min="0"
                            className="text-sm border-violet-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="call-date" className="text-sm font-medium flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-violet-600" />
                            Call Date
                          </Label>
                          <Input
                            id="call-date"
                            type="date"
                            value={callDate}
                            onChange={(e) => setCallDate(e.target.value)}
                            className="text-sm border-violet-200"
                          />
                        </div>
                      </div>

                      {/* Call Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="call-notes" className="text-sm font-medium">
                          Call Notes
                        </Label>
                        <Textarea
                          id="call-notes"
                          value={callNotes}
                          onChange={(e) => setCallNotes(e.target.value)}
                          placeholder="Key points discussed during the call..."
                          className="min-h-[120px] text-sm border-violet-200 focus:border-violet-400 focus:ring-violet-400"
                        />
                      </div>

                      {/* Next Steps */}
                      <div className="space-y-2">
                        <Label htmlFor="next-steps" className="text-sm font-medium">
                          Next Steps
                        </Label>
                        <Textarea
                          id="next-steps"
                          value={nextSteps}
                          onChange={(e) => setNextSteps(e.target.value)}
                          placeholder="What are the next actions to take..."
                          className="min-h-[80px] text-sm border-violet-200 focus:border-violet-400 focus:ring-violet-400"
                        />
                      </div>

                      <Button 
                        onClick={handleSaveCallLog}
                        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Call Log
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Call History */}
                  <Card className="border-2 border-gray-200 shadow-md">
                    <CardHeader className="pb-3 bg-gray-50">
                      <CardTitle className="text-base flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Call History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <PhoneCall className="w-5 h-5 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Last Call: {lead.lastContact}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Status: <Badge className="ml-1 text-xs">{lead.callStatus?.replace('_', ' ') || 'Not Called'}</Badge>
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
