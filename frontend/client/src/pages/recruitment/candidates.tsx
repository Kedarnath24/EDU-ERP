import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Plus,
  User,
  MoreVertical,
  Mail,
  Phone,
  FileText,
  Building,
  ExternalLink,
  CalendarClock,
  X,
  Eye,
  Download,
  Loader2
} from 'lucide-react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Job } from './recruitment-dashboard';
import {
  getCandidates,
  addCandidate,
  updateCandidateStatus,
  type Candidate,
} from '@/lib/api';

interface Props {
  filterByJob: string | null;
  onScheduleInterview: (candidateName: string, position: string) => void;
  onClearFilter: () => void;
  jobs: Job[];
  onRefreshStats?: () => void;
}

export default function CandidatesModule({ filterByJob, onScheduleInterview, onClearFilter, jobs, onRefreshStats }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isViewCVOpen, setIsViewCVOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  // New candidate form state
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    source: 'LinkedIn',
    skills: '',
  });

  // Fetch candidates from backend
  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getCandidates({
      job_title: filterByJob || undefined,
    });
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else if (data) {
      setCandidates(data);
    }
    setLoading(false);
  }, [filterByJob, toast]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleAddCandidate = async () => {
    if (!newCandidate.name || !newCandidate.email || !newCandidate.position) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setAdding(true);
    const { data, error } = await addCandidate({
      name: newCandidate.name,
      email: newCandidate.email,
      phone: newCandidate.phone || undefined,
      position: newCandidate.position,
      experience: newCandidate.experience || undefined,
      source: newCandidate.source,
      skills: newCandidate.skills ? newCandidate.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
    });
    setAdding(false);

    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
      return;
    }

    if (data) {
      setCandidates(prev => [data, ...prev]);
      setIsAddCandidateOpen(false);
      setNewCandidate({
        name: '', email: '', phone: '', position: '',
        experience: '', source: 'LinkedIn', skills: '',
      });
      toast({
        title: "Candidate Added",
        description: `${data.name} has been added to the pipeline.`
      });
      onRefreshStats?.();
    }
  };

  const handleViewCV = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsViewCVOpen(true);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await updateCandidateStatus(id, status);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
      return;
    }
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    toast({ title: 'Status Updated', description: `Candidate moved to ${status}` });
    onRefreshStats?.();
  };

  // Client-side filtering for search, status, and source
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || c.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSource = sourceFilter === 'all' || c.source.toLowerCase() === sourceFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesSource;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Interviewing': return 'bg-blue-100 text-blue-700';
      case 'Screening': return 'bg-yellow-100 text-yellow-700';
      case 'Offer Sent': return 'bg-green-100 text-green-700';
      case 'Hired': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Job Filter Banner */}
      {filterByJob && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">
                Showing candidates for: <strong>{filterByJob}</strong>
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClearFilter} className="text-purple-600 hover:text-purple-800 hover:bg-purple-100">
              <X className="h-4 w-4 mr-1" /> Clear Filter
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Candidate Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search candidates by name, skills, position..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interviewing">Interviewing</SelectItem>
                  <SelectItem value="offer sent">Offer Sent</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="indeed">Indeed</SelectItem>
                  <SelectItem value="career site">Career Site</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => setIsAddCandidateOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Candidate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Candidate Dialog */}
      <Dialog open={isAddCandidateOpen} onOpenChange={setIsAddCandidateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Candidate</DialogTitle>
            <DialogDescription>Enter candidate details to add them to the pipeline</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cand-name">Full Name *</Label>
                <Input
                  id="cand-name"
                  placeholder="John Doe"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cand-email">Email *</Label>
                <Input
                  id="cand-email"
                  type="email"
                  placeholder="john@example.com"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cand-phone">Phone</Label>
                <Input
                  id="cand-phone"
                  placeholder="+1 555-0100"
                  value={newCandidate.phone}
                  onChange={(e) => setNewCandidate(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cand-position">Position Applied *</Label>
                <Select
                  value={newCandidate.position}
                  onValueChange={(value) => setNewCandidate(prev => ({ ...prev, position: value }))}
                >
                  <SelectTrigger id="cand-position">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map(job => (
                      <SelectItem key={job.id} value={job.title}>{job.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cand-exp">Experience</Label>
                <Select
                  value={newCandidate.experience}
                  onValueChange={(value) => setNewCandidate(prev => ({ ...prev, experience: value }))}
                >
                  <SelectTrigger id="cand-exp">
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1 years">0-1 years</SelectItem>
                    <SelectItem value="1-3 years">1-3 years</SelectItem>
                    <SelectItem value="3-5 years">3-5 years</SelectItem>
                    <SelectItem value="5-7 years">5-7 years</SelectItem>
                    <SelectItem value="7+ years">7+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cand-source">Source</Label>
                <Select
                  value={newCandidate.source}
                  onValueChange={(value) => setNewCandidate(prev => ({ ...prev, source: value }))}
                >
                  <SelectTrigger id="cand-source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Indeed">Indeed</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Career Site">Career Site</SelectItem>
                    <SelectItem value="Job Fair">Job Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cand-skills">Skills (comma separated)</Label>
              <Input
                id="cand-skills"
                placeholder="React, Node.js, TypeScript..."
                value={newCandidate.skills}
                onChange={(e) => setNewCandidate(prev => ({ ...prev, skills: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCandidateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCandidate} disabled={adding} className="bg-blue-600 hover:bg-blue-700">
              {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Plus className="h-4 w-4 mr-2" />
              Add Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View CV Dialog */}
      <Dialog open={isViewCVOpen} onOpenChange={setIsViewCVOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Candidate Profile</DialogTitle>
            <DialogDescription>
              Application details for {selectedCandidate?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-6 py-4">
              {/* Candidate Header */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                  {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{selectedCandidate.name}</h3>
                  <p className="text-sm text-slate-600">{selectedCandidate.position}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedCandidate.email}
                    </span>
                    {selectedCandidate.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {selectedCandidate.phone}
                      </span>
                    )}
                    <span>{selectedCandidate.experience}</span>
                  </div>
                </div>
                <Badge className={`${getStatusColor(selectedCandidate.status)} font-semibold border-0`}>
                  {selectedCandidate.status}
                </Badge>
              </div>

              {/* Skills */}
              {selectedCandidate.skills.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Skills & Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="bg-blue-50 text-blue-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Source</p>
                  <p className="font-medium">{selectedCandidate.source}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Applied Date</p>
                  <p className="font-medium">{new Date(selectedCandidate.appliedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewCVOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                if (selectedCandidate) {
                  onScheduleInterview(selectedCandidate.name, selectedCandidate.position);
                  setIsViewCVOpen(false);
                }
              }}
            >
              <CalendarClock className="h-4 w-4 mr-2" />
              Schedule Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate List */}
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="h-8 w-8 text-slate-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading candidates...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="hover:shadow-sm transition-shadow group">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                      {candidate.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        {candidate.name}
                        <Button variant="ghost" size="icon" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </h3>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <Building className="h-3 w-3" /> {candidate.position}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Mail className="h-3.5 w-3.5" />
                      {candidate.email}
                    </div>
                    {candidate.phone && (
                      <div className="flex items-center gap-1 text-slate-600">
                        <Phone className="h-3.5 w-3.5" />
                        {candidate.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-slate-600">
                      <Badge variant="outline" className="font-normal">{candidate.experience}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="text-xs text-slate-400 capitalize">Source:</span>
                      <span className="font-medium text-slate-700">{candidate.source}</span>
                    </div>
                    <Badge className={`${getStatusColor(candidate.status)} font-semibold border-0`}>
                      {candidate.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      onClick={() => onScheduleInterview(candidate.name, candidate.position)}
                    >
                      <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                      Schedule Interview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCV(candidate)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Details
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateStatus(candidate.id, 'Screening')}>Move to Screening</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(candidate.id, 'Interviewing')}>Move to Interviewing</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(candidate.id, 'Offer Sent')}>Send Offer</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(candidate.id, 'Hired')}>Mark as Hired</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus(candidate.id, 'Rejected')}>Reject</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {candidate.skills.length > 0 && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Top Skills:</span>
                    <div className="flex gap-2">
                      {candidate.skills.map(skill => (
                        <Badge key={skill} variant="secondary" className="bg-slate-50 text-slate-600 text-[10px] px-2 py-0">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filteredCandidates.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed rounded-lg">
              <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No candidates found</h3>
              <p className="text-slate-500">No candidates match your current filter settings.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
