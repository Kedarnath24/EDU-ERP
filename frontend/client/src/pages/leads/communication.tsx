import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Phone, Mail, MessageCircle, Send, History, User,
  Clock, CheckCircle, XCircle, Sparkles, Copy,
  ExternalLink, Calendar, FileText, Loader2, Video,
  PhoneCall, PhoneIncoming, PhoneOutgoing, MailOpen, Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EmailTemplateDialog from "@/components/crm/EmailTemplateDialog";

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
}

interface CommunicationLog {
  id: string;
  leadId: string;
  leadName: string;
  type: "whatsapp" | "email" | "call";
  direction?: "incoming" | "outgoing";
  status: "success" | "failed" | "pending";
  message?: string;
  subject?: string;
  duration?: string;
  timestamp: string;
  createdBy: string;
}

export default function LeadCommunication() {
  const { toast } = useToast();
  
  // State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState("quick-actions");
  
  // Dialog states
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  
  // Form states
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [callDirection, setCallDirection] = useState<"incoming" | "outgoing">("outgoing");
  
  // Loading states
  const [isSending, setIsSending] = useState(false);
  
  // Demo leads data
  const leads: Lead[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      company: "TechCorp Solutions",
      email: "sarah.j@techcorp.com",
      phone: "+1 (555) 123-4567"
    },
    {
      id: "2",
      name: "Michael Chen",
      company: "Startup Inc",
      email: "m.chen@startup.io",
      phone: "+1 (555) 234-5678"
    },
    {
      id: "3",
      name: "Emma Rodriguez",
      company: "Global Manufacturing",
      email: "e.rodriguez@global-mfg.com",
      phone: "+1 (555) 345-6789"
    }
  ];

  // Communication logs
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([
    {
      id: "1",
      leadId: "1",
      leadName: "Sarah Johnson - TechCorp Solutions",
      type: "email",
      status: "success",
      subject: "Pricing Proposal Follow-up",
      message: "Sent detailed pricing proposal with enterprise features",
      timestamp: "2 hours ago",
      createdBy: "John Smith"
    },
    {
      id: "2",
      leadId: "1",
      leadName: "Sarah Johnson - TechCorp Solutions",
      type: "call",
      direction: "outgoing",
      status: "success",
      duration: "15 min",
      message: "Discussed implementation timeline and next steps",
      timestamp: "1 day ago",
      createdBy: "John Smith"
    },
    {
      id: "3",
      leadId: "2",
      leadName: "Michael Chen - Startup Inc",
      type: "whatsapp",
      status: "success",
      message: "Shared product demo link and scheduling options",
      timestamp: "3 hours ago",
      createdBy: "Emily Davis"
    }
  ]);

  // WhatsApp Handler
  const handleSendWhatsApp = async () => {
    if (!selectedLead || !whatsappMessage.trim()) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please select a lead and enter a message.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Create WhatsApp URL
    const phoneNumber = selectedLead.phone.replace(/\D/g, '');
    const message = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Log the communication
    const newLog: CommunicationLog = {
      id: String(Date.now()),
      leadId: selectedLead.id,
      leadName: `${selectedLead.name} - ${selectedLead.company}`,
      type: "whatsapp",
      status: "success",
      message: whatsappMessage,
      timestamp: "Just now",
      createdBy: "Current User"
    };

    setCommunicationLogs([newLog, ...communicationLogs]);

    toast({
      title: "✅ WhatsApp Opened",
      description: `Message ready to send to ${selectedLead.name}`,
      duration: 3000,
    });

    setWhatsappMessage("");
    setWhatsappDialogOpen(false);
    setIsSending(false);
  };

  // Email Handler
  const handleSendEmail = async (subject: string, body: string) => {
    if (!selectedLead) return;

    // Create mailto link
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const mailtoUrl = `mailto:${selectedLead.email}?subject=${encodedSubject}&body=${encodedBody}`;
    
    // Open email client
    window.location.href = mailtoUrl;

    // Log the communication
    const newLog: CommunicationLog = {
      id: String(Date.now()),
      leadId: selectedLead.id,
      leadName: `${selectedLead.name} - ${selectedLead.company}`,
      type: "email",
      status: "success",
      subject: subject,
      message: body,
      timestamp: "Just now",
      createdBy: "Current User"
    };

    setCommunicationLogs([newLog, ...communicationLogs]);

    toast({
      title: "✅ Email Client Opened",
      description: `Email draft ready for ${selectedLead.name}`,
      duration: 3000,
    });

    setEmailDialogOpen(false);
  };

  // Call Handler
  const handleLogCall = async () => {
    if (!selectedLead || !callNotes.trim()) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please select a lead and add call notes.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Create tel link
    const telUrl = `tel:${selectedLead.phone}`;
    window.location.href = telUrl;

    // Log the communication
    const newLog: CommunicationLog = {
      id: String(Date.now()),
      leadId: selectedLead.id,
      leadName: `${selectedLead.name} - ${selectedLead.company}`,
      type: "call",
      direction: callDirection,
      status: "success",
      duration: callDuration || "N/A",
      message: callNotes,
      timestamp: "Just now",
      createdBy: "Current User"
    };

    setCommunicationLogs([newLog, ...communicationLogs]);

    toast({
      title: "✅ Call Logged",
      description: `Call details saved for ${selectedLead.name}`,
      duration: 3000,
    });

    setCallNotes("");
    setCallDuration("");
    setCallDialogOpen(false);
    setIsSending(false);
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">CRM - Communication Actions</h1>
              <p className="text-sm text-gray-600">Send WhatsApp, Email, or make Calls to your leads</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-2 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <Badge className="bg-green-600">{communicationLogs.filter(l => l.type === "whatsapp").length}</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900">{communicationLogs.filter(l => l.type === "whatsapp").length}</p>
              <p className="text-sm text-gray-600">WhatsApp Messages</p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <Badge className="bg-blue-600">{communicationLogs.filter(l => l.type === "email").length}</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900">{communicationLogs.filter(l => l.type === "email").length}</p>
              <p className="text-sm text-gray-600">Emails Sent</p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-purple-600" />
                </div>
                <Badge className="bg-purple-600">{communicationLogs.filter(l => l.type === "call").length}</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900">{communicationLogs.filter(l => l.type === "call").length}</p>
              <p className="text-sm text-gray-600">Calls Made</p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <History className="w-5 h-5 text-orange-600" />
                </div>
                <Badge className="bg-orange-600">{communicationLogs.length}</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900">{communicationLogs.length}</p>
              <p className="text-sm text-gray-600">Total Activities</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="quick-actions" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Quick Actions
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Communication History
            </TabsTrigger>
          </TabsList>

          {/* Quick Actions Tab */}
          <TabsContent value="quick-actions" className="space-y-6">
            {/* Lead Selector */}
            <Card className="border-2 border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-lg">Select Lead</CardTitle>
                <CardDescription>Choose a lead to communicate with</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Select
                  value={selectedLead?.id || ""}
                  onValueChange={(value) => {
                    const lead = leads.find(l => l.id === value);
                    setSelectedLead(lead || null);
                  }}
                >
                  <SelectTrigger className="w-full border-purple-200">
                    <SelectValue placeholder="Select a lead..." />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{lead.name}</span>
                          <span className="text-gray-500">- {lead.company}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedLead && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">{selectedLead.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{selectedLead.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{selectedLead.phone}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Communication Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* WhatsApp Card */}
              <Card className="border-2 border-green-200 hover:border-green-400 transition-all cursor-pointer group"
                    onClick={() => selectedLead && setWhatsappDialogOpen(true)}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-all">
                    <MessageCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">WhatsApp Message</h3>
                  <p className="text-sm text-gray-600 mb-4">Send instant message via WhatsApp</p>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!selectedLead}
                    onClick={(e) => {
                      e.stopPropagation();
                      setWhatsappDialogOpen(true);
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send WhatsApp
                  </Button>
                </CardContent>
              </Card>

              {/* Email Card */}
              <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer group"
                    onClick={() => selectedLead && setEmailDialogOpen(true)}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-all">
                    <Mail className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Send Email</h3>
                  <p className="text-sm text-gray-600 mb-4">Compose and send professional email</p>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!selectedLead}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEmailDialogOpen(true);
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </CardContent>
              </Card>

              {/* Call Card */}
              <Card className="border-2 border-purple-200 hover:border-purple-400 transition-all cursor-pointer group"
                    onClick={() => selectedLead && setCallDialogOpen(true)}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-all">
                    <Phone className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Make Call</h3>
                  <p className="text-sm text-gray-600 mb-4">Call lead and log activity</p>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={!selectedLead}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCallDialogOpen(true);
                    }}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Make Call
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Communication History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Communication History
                </CardTitle>
                <CardDescription>All communication activities with leads</CardDescription>
              </CardHeader>
              <CardContent>
                {communicationLogs.length > 0 ? (
                  <div className="space-y-3">
                    {communicationLogs.map(log => (
                      <div key={log.id} className="p-4 border-2 rounded-lg hover:shadow-md transition-all">
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            log.type === "whatsapp" 
                              ? "bg-green-100" 
                              : log.type === "email" 
                                ? "bg-blue-100" 
                                : "bg-purple-100"
                          }`}>
                            {log.type === "whatsapp" && <MessageCircle className="w-5 h-5 text-green-600" />}
                            {log.type === "email" && <Mail className="w-5 h-5 text-blue-600" />}
                            {log.type === "call" && (
                              log.direction === "incoming" 
                                ? <PhoneIncoming className="w-5 h-5 text-purple-600" />
                                : <PhoneOutgoing className="w-5 h-5 text-purple-600" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={
                                log.type === "whatsapp" 
                                  ? "border-green-300 bg-green-50 text-green-700"
                                  : log.type === "email"
                                    ? "border-blue-300 bg-blue-50 text-blue-700"
                                    : "border-purple-300 bg-purple-50 text-purple-700"
                              }>
                                {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                              </Badge>
                              {log.direction && (
                                <Badge variant="outline" className="text-xs">
                                  {log.direction === "incoming" ? "Incoming" : "Outgoing"}
                                </Badge>
                              )}
                              <Badge 
                                variant={log.status === "success" ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {log.status === "success" ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                {log.status}
                              </Badge>
                            </div>
                            
                            <p className="text-sm font-medium text-gray-900 mb-1">{log.leadName}</p>
                            
                            {log.subject && (
                              <p className="text-sm font-medium text-gray-700 mb-1">📧 {log.subject}</p>
                            )}
                            
                            {log.message && (
                              <p className="text-sm text-gray-600 mb-2">{log.message}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {log.timestamp}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {log.createdBy}
                              </span>
                              {log.duration && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {log.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No communication history yet</p>
                    <p className="text-sm mt-2">Start communicating with your leads</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* WhatsApp Dialog */}
        <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                Send WhatsApp Message
              </DialogTitle>
              <DialogDescription>
                {selectedLead && `Send a WhatsApp message to ${selectedLead.name}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {selectedLead && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="font-medium">{selectedLead.phone}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="whatsapp-message">Message</Label>
                <Textarea
                  id="whatsapp-message"
                  placeholder="Enter your WhatsApp message..."
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">{whatsappMessage.length} characters</p>
              </div>

              {/* Quick Templates */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Quick Templates:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWhatsappMessage("Hi! I wanted to follow up on our previous conversation. Are you available for a quick call?")}
                    className="text-xs"
                  >
                    Follow-up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWhatsappMessage("Thank you for your interest! I'd love to schedule a demo. When would be a good time for you?")}
                    className="text-xs"
                  >
                    Demo Request
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWhatsappMessage("I've sent you the pricing information via email. Please let me know if you have any questions!")}
                    className="text-xs"
                  >
                    Pricing Info
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setWhatsappDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendWhatsApp}
                disabled={isSending}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opening WhatsApp...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send via WhatsApp
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Dialog - Enhanced Template */}
        {selectedLead && (
          <EmailTemplateDialog
            open={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            leadName={selectedLead.name}
            leadEmail={selectedLead.email}
            leadCompany={selectedLead.company}
            onSend={handleSendEmail}
          />
        )}

        {/* Call Dialog */}
        <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-purple-600" />
                Make Call & Log Activity
              </DialogTitle>
              <DialogDescription>
                {selectedLead && `Call ${selectedLead.name} and log the activity`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {selectedLead && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">{selectedLead.phone}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => window.location.href = `tel:${selectedLead.phone}`}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <PhoneCall className="w-4 h-4 mr-2" />
                      Call Now
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="call-direction">Call Direction</Label>
                <Select value={callDirection} onValueChange={(value: "incoming" | "outgoing") => setCallDirection(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outgoing">
                      <div className="flex items-center gap-2">
                        <PhoneOutgoing className="w-4 h-4" />
                        Outgoing Call
                      </div>
                    </SelectItem>
                    <SelectItem value="incoming">
                      <div className="flex items-center gap-2">
                        <PhoneIncoming className="w-4 h-4" />
                        Incoming Call
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="call-duration">Call Duration (optional)</Label>
                <Input
                  id="call-duration"
                  placeholder="e.g., 15 min"
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="call-notes">Call Notes</Label>
                <Textarea
                  id="call-notes"
                  placeholder="What was discussed during the call..."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              {/* Quick Note Templates */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Quick Notes:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCallNotes("Discussed pricing and features. Lead is interested in enterprise plan. Follow up next week.")}
                    className="text-xs"
                  >
                    Pricing Discussion
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCallNotes("Demo completed successfully. Lead impressed with features. Requested proposal.")}
                    className="text-xs"
                  >
                    Demo Completed
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCallNotes("Lead not available. Left voicemail requesting callback.")}
                    className="text-xs"
                  >
                    Voicemail
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCallDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleLogCall}
                disabled={isSending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging Call...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Log Call Activity
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
