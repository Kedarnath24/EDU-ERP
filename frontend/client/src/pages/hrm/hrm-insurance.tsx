import React, { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield,
  Plus,
  Download,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  ArrowLeft,
  FileSpreadsheet,
  Printer,
  Heart,
  Users,
  TrendingUp,
  PieChart,
  BarChart3
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Insurance() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('policies');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const { toast } = useToast();

  // Initializing empty data - to be fetched from API
  const [policies, setPolicies] = useState<any[]>([]);

  // Initializing empty data
  const [claims, setClaims] = useState<any[]>([]);

  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const matchesSearch = p.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.policyNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || p.policyType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [policies, searchQuery, typeFilter]);

  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      const matchesSearch = c.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || c.policyType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [claims, searchQuery, typeFilter]);

  const handleExport = (format: 'excel' | 'pdf') => {
    toast({ title: `Exporting ${activeTab}...` });

    if (format === 'excel') {
      const data = activeTab === 'policies' ? filteredPolicies : filteredClaims;
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeTab);
      XLSX.writeFile(wb, `Insurance_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.text(`Insurance ${activeTab} Report`, 14, 15);
      if (activeTab === 'policies') {
        autoTable(doc, {
          startY: 25,
          head: [['ID', 'Employee', 'Policy Type', 'Policy #', 'Coverage', 'Status']],
          body: filteredPolicies.map(item => [item.id, item.employee, item.policyType, item.policyNumber, item.coverage, item.status]),
        });
      } else {
        autoTable(doc, {
          startY: 25,
          head: [['ID', 'Employee', 'Policy Type', 'Amount', 'Date', 'Status']],
          body: filteredClaims.map(item => [item.id, item.employee, item.policyType, item.claimAmount, item.claimDate, item.status]),
        });
      }
      doc.save(`Insurance_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  const handleClaimAction = (claimId: string, status: 'approved' | 'rejected') => {
    setClaims(claims.map(c =>
      c.id === claimId ? { ...c, status, approvedAmount: status === 'approved' ? c.claimAmount : '$0' } : c
    ));
    toast({
      title: `Claim ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      description: `Claim ${claimId} has been ${status}.`
    });
  };

  const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
    active: { label: 'Active', class: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
    expired: { label: 'Expired', class: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
    approved: { label: 'Approved', class: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    rejected: { label: 'Rejected', class: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 -mx-6 -mt-6 px-6 py-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/hrm')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Insurance Management</h1>
                <p className="text-sm text-slate-600">Manage employee insurance policies and claims</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or ID..."
                className="pl-9 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] bg-white font-medium">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Insurance Type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Insurance Types</SelectItem>
                <SelectItem value="Health Insurance">Health Insurance</SelectItem>
                <SelectItem value="Life Insurance">Life Insurance</SelectItem>
                <SelectItem value="Accident Insurance">Accident Insurance</SelectItem>
                <SelectItem value="Disability Insurance">Disability Insurance</SelectItem>
                <SelectItem value="Dental Insurance">Dental Insurance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                  Excel Format
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <Printer className="h-4 w-4 mr-2 text-rose-600" />
                  PDF Summary
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Policy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Insurance Policy</DialogTitle>
                  <DialogDescription>Create a new insurance policy for an employee</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee">Employee</Label>
                    <Select>
                      <SelectTrigger id="employee">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emp1">John Smith (EMP001)</SelectItem>
                        <SelectItem value="emp2">Sarah Johnson (EMP002)</SelectItem>
                        <SelectItem value="emp3">Mike Brown (EMP003)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policy-type">Policy Type</Label>
                    <Select>
                      <SelectTrigger id="policy-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="health">Health Insurance</SelectItem>
                        <SelectItem value="life">Life Insurance</SelectItem>
                        <SelectItem value="accident">Accident Insurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Input id="provider" placeholder="Insurance provider name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coverage">Coverage Amount</Label>
                      <Input id="coverage" placeholder="$50,000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="premium">Premium</Label>
                      <Input id="premium" placeholder="$200/month" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input id="start-date" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input id="end-date" type="date" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Add Policy</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{policies.filter(p => p.status === 'active').length}</p>
                  <p className="text-xs text-slate-600">Active Policies</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{claims.filter(c => c.status === 'approved').length}</p>
                  <p className="text-xs text-slate-600">Claims Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{claims.filter(c => c.status === 'pending').length}</p>
                  <p className="text-xs text-slate-600">Pending Claims</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">${Math.round(policies.reduce((acc, p) => acc + parseInt(p.coverage?.replace(/[$, ]/g, '') || '0'), 0) / 1000)}K</p>
                  <p className="text-xs text-slate-600">Total Coverage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="policies">Active Policies</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="types">Insurance Types</TabsTrigger>
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
          </TabsList>

          {/* Active Policies */}
          <TabsContent value="policies" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Active Insurance Policies</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search policies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-48"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Policy Type</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Policy Number</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPolicies.map((policy) => {
                      const StatusIcon = statusConfig[policy.status].icon;
                      return (
                        <TableRow key={policy.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                                  {policy.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{policy.employee}</p>
                                <p className="text-xs text-slate-600">{policy.empId}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{policy.policyType}</TableCell>
                          <TableCell className="text-sm">{policy.provider}</TableCell>
                          <TableCell className="text-sm font-mono">{policy.policyNumber}</TableCell>
                          <TableCell className="text-sm font-semibold">{policy.coverage}</TableCell>
                          <TableCell className="text-sm">{policy.premium}</TableCell>
                          <TableCell className="text-sm">{policy.endDate}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusConfig[policy.status].class}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[policy.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-blue-600">
                              <FileText className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Claims */}
          <TabsContent value="claims" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Insurance Claims</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      File Claim
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>File Insurance Claim</DialogTitle>
                      <DialogDescription>Submit a new insurance claim for review</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="claim-employee">Employee</Label>
                        <Select>
                          <SelectTrigger id="claim-employee">
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="emp1">John Smith (EMP001)</SelectItem>
                            <SelectItem value="emp2">Sarah Johnson (EMP002)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="claim-policy">Policy</Label>
                        <Select>
                          <SelectTrigger id="claim-policy">
                            <SelectValue placeholder="Select policy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pol1">Health Insurance - HI-2025-001</SelectItem>
                            <SelectItem value="pol2">Life Insurance - LI-2025-002</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="claim-amount">Claim Amount</Label>
                        <Input id="claim-amount" placeholder="$2,500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="claim-description">Description</Label>
                        <Textarea id="claim-description" placeholder="Provide details about the claim..." rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="claim-documents">Supporting Documents</Label>
                        <div className="flex items-center gap-2">
                          <Input id="claim-documents" type="file" />
                          <Button variant="outline" size="icon">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">Cancel</Button>
                      <Button>Submit Claim</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Policy Type</TableHead>
                      <TableHead>Claim Amount</TableHead>
                      <TableHead>Claim Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Approved Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClaims.map((claim) => {
                      const StatusIcon = statusConfig[claim.status].icon;
                      return (
                        <TableRow key={claim.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                                  {claim.avatar}
                                  {claim.employee.split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{claim.employee}</p>
                                <p className="text-xs text-slate-600">{claim.empId}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{claim.policyType}</TableCell>
                          <TableCell className="text-sm font-semibold">{claim.claimAmount}</TableCell>
                          <TableCell className="text-sm">{claim.claimDate}</TableCell>
                          <TableCell className="text-sm text-slate-600 max-w-xs truncate">{claim.description}</TableCell>
                          <TableCell className="text-sm font-semibold text-green-600">{claim.approvedAmount}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusConfig[claim.status].class}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[claim.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {claim.status === 'pending' ? (
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="text-green-600 font-bold" onClick={() => handleClaimAction(claim.id, 'approved')}>
                                  Approve
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600 font-bold" onClick={() => handleClaimAction(claim.id, 'rejected')}>
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <Button variant="ghost" size="sm" className="text-blue-600">
                                <FileText className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insurance Types */}
          <TabsContent value="types" className="space-y-4 mt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Health Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Active Policies</span>
                      <span className="font-semibold">{policies.filter(p => p.policyType === 'Health Insurance').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Coverage</span>
                      <span className="font-semibold">${(policies.filter(p => p.policyType === 'Health Insurance').reduce((acc, p) => acc + parseInt(p.coverage?.replace(/[$, ]/g, '') || '0'), 0) / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Monthly Premium</span>
                      <span className="font-semibold">${(policies.filter(p => p.policyType === 'Health Insurance').reduce((acc, p) => acc + parseInt(p.premium?.replace(/[A-Za-z$/, ]/g, '') || '0'), 0) / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Life Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Active Policies</span>
                      <span className="font-semibold">{policies.filter(p => p.policyType === 'Life Insurance').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Coverage</span>
                      <span className="font-semibold">${(policies.filter(p => p.policyType === 'Life Insurance').reduce((acc, p) => acc + parseInt(p.coverage?.replace(/[$, ]/g, '') || '0'), 0) / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Monthly Premium</span>
                      <span className="font-semibold">${(policies.filter(p => p.policyType === 'Life Insurance').reduce((acc, p) => acc + parseInt(p.premium?.replace(/[A-Za-z$/, ]/g, '') || '0'), 0) / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-5 w-5 text-orange-600" />
                    Accident Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Active Policies</span>
                      <span className="font-semibold">{policies.filter(p => p.policyType === 'Accident Insurance').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Coverage</span>
                      <span className="font-semibold">${(policies.filter(p => p.policyType === 'Accident Insurance').reduce((acc, p) => acc + parseInt(p.coverage?.replace(/[$, ]/g, '') || '0'), 0) / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Monthly Premium</span>
                      <span className="font-semibold">${(policies.filter(p => p.policyType === 'Accident Insurance').reduce((acc, p) => acc + parseInt(p.premium?.replace(/[A-Za-z$/, ]/g, '') || '0'), 0) / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Coverage */}
          <TabsContent value="coverage" className="space-y-6 mt-6">
            {/* Coverage Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-blue-200 bg-blue-50/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Total Coverage</p>
                      <h3 className="text-3xl font-black text-blue-700">
                        ${Math.round(policies.reduce((acc, p) => acc + parseInt(p.coverage.replace(/[$, ]/g, '')), 0) / 1000)}K
                      </h3>
                      <p className="text-xs text-blue-600 mt-1">across all policies</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 bg-emerald-50/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Health Coverage</p>
                      <h3 className="text-3xl font-black text-emerald-700">
                        ${Math.round(policies.filter(p => p.policyType === 'Health Insurance').reduce((acc, p) => acc + parseInt(p.coverage?.replace(/[$, ]/g, '') || '0'), 0) / 1000)}K
                      </h3>
                      <p className="text-xs text-emerald-600 mt-1">{policies.filter(p => p.policyType === 'Health Insurance').length} policies</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <Heart className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-violet-200 bg-violet-50/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">Life Coverage</p>
                      <h3 className="text-3xl font-black text-violet-700">
                        ${Math.round(policies.filter(p => p.policyType === 'Life Insurance').reduce((acc, p) => acc + parseInt(p.coverage?.replace(/[$, ]/g, '') || '0'), 0) / 1000)}K
                      </h3>
                      <p className="text-xs text-violet-600 mt-1">{policies.filter(p => p.policyType === 'Life Insurance').length} policies</p>
                    </div>
                    <div className="p-3 bg-violet-100 rounded-xl">
                      <Users className="h-6 w-6 text-violet-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Avg Per Employee</p>
                      <h3 className="text-3xl font-black text-amber-700">
                        ${Math.round((policies.reduce((acc, p) => acc + parseInt(p.coverage?.replace(/[$, ]/g, '') || '0'), 0) / (policies.length || 1)) / 1000)}K
                      </h3>
                      <p className="text-xs text-amber-600 mt-1">coverage amount</p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coverage by Type Breakdown */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    Coverage Distribution
                  </CardTitle>
                  <CardDescription>Insurance coverage breakdown by type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['Health Insurance', 'Life Insurance', 'Accident Insurance'].map(type => {
                    const typePolicies = policies.filter(p => p.policyType === type);
                    const totalCoverage = typePolicies.reduce((acc, p) => acc + parseInt(p.coverage?.replace(/[$, ]/g, '') || '0'), 0);
                    const allCoverage = policies.reduce((acc, p) => acc + parseInt(p.coverage?.replace(/[$, ]/g, '') || '0'), 0);
                    const percentage = allCoverage > 0 ? (totalCoverage / allCoverage) * 100 : 0;

                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{type}</span>
                          <span className="font-bold text-slate-900">${(totalCoverage / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress
                            value={percentage}
                            className={cn(
                              "h-2 flex-1",
                              type === 'Health Insurance' ? "[&>div]:bg-emerald-500" :
                                type === 'Life Insurance' ? "[&>div]:bg-violet-500" : "[&>div]:bg-blue-500"
                            )}
                          />
                          <span className="text-xs font-bold text-slate-500 w-12 text-right">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-violet-600" />
                    Provider Analysis
                  </CardTitle>
                  <CardDescription>Coverage amount by insurance provider</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from(new Set(policies.map(p => p.provider))).map(provider => {
                    const providerPolicies = policies.filter(p => p.provider === provider);
                    const totalCoverage = providerPolicies.reduce((acc, p) => acc + parseInt(p.coverage?.replace(/[$, ]/g, '') || '0'), 0);
                    const providerCoverages = Array.from(new Set(policies.map(p => p.provider))).map(prov =>
                      policies.filter(p => p.provider === prov).reduce((acc, p) => acc + parseInt(p.coverage?.replace(/[$, ]/g, '') || '0'), 0)
                    );
                    const maxCoverage = providerCoverages.length > 0 ? Math.max(...providerCoverages) : 0;
                    const percentage = maxCoverage > 0 ? (totalCoverage / maxCoverage) * 100 : 0;

                    return (
                      <div key={provider} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{provider}</span>
                          <div className="text-right">
                            <span className="font-bold text-slate-900">${(totalCoverage / 1000).toFixed(0)}K</span>
                            <span className="text-xs text-slate-500 ml-2">({providerPolicies.length} policies)</span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2 [&>div]:bg-violet-500" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Coverage Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Employee Coverage Details</CardTitle>
                <CardDescription>Individual coverage amounts and policy information</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Employee</TableHead>
                      <TableHead className="font-bold">Policy Type</TableHead>
                      <TableHead className="font-bold">Provider</TableHead>
                      <TableHead className="text-right font-bold">Coverage Amount</TableHead>
                      <TableHead className="text-right font-bold">Premium</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map(policy => (
                      <TableRow key={policy.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">{policy.avatar}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-slate-900">{policy.employee}</p>
                              <p className="text-xs text-slate-500">{policy.empId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {policy.policyType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">{policy.provider}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-blue-700 text-lg">{policy.coverage}</span>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-slate-700">{policy.premium}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "font-bold text-xs",
                              policy.status === 'active' ? "bg-emerald-100 text-emerald-700" :
                                policy.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                            )}
                          >
                            {policy.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </DashboardLayout>
  );
}
