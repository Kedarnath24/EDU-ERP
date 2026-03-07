import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  MapPin,
  Clock,
  DollarSign,
  Users,
  MoreVertical,
  Filter,
  ArrowUpDown,
  Building,
  Calendar,
  Eye,
  Edit,
  Trash,
  Briefcase,
  GraduationCap,
  Target
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Job } from './recruitment-dashboard';

interface Props {
  jobs: Job[];
  onViewApplicants: (jobTitle: string) => void;
  onDeleteJob?: (jobId: string) => void;
}

export default function JobDescriptionsModule({ jobs, onViewApplicants, onDeleteJob }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = deptFilter === 'all' || job.department.toLowerCase() === deptFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || job.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesDept && matchesType;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by job title or department..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-[140px]">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="All..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="All Types" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Advanced Filtering</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setSearchTerm(''); setDeptFilter('all'); setTypeFilter('all'); }}>
                    Clear All Filters
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Experience Level</DropdownMenuItem>
                  <DropdownMenuItem>Salary Range</DropdownMenuItem>
                  <DropdownMenuItem>Posting Date</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="icon">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold">{job.title}</CardTitle>
                  <p className="text-sm font-medium text-slate-500">{job.department}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center">
                      <Eye className="h-4 w-4 mr-2" /> View Listing
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center">
                      <Edit className="h-4 w-4 mr-2" /> Edit Position
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center">
                      <Users className="h-4 w-4 mr-2" /> View Applicants
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center" onClick={() => onViewApplicants(job.title)}>
                      <Eye className="h-4 w-4 mr-2" /> View Candidates
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 flex items-center" onClick={() => onDeleteJob?.(String(job.id))}>
                      <Trash className="h-4 w-4 mr-2" /> Close Position
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
                  <div className="flex items-center text-sm text-slate-600">
                    <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                    {job.location}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Clock className="h-4 w-4 mr-2 text-slate-400" />
                    {job.type} {job.workMode && job.workMode !== 'Not specified' && `• ${job.workMode}`}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <DollarSign className="h-4 w-4 mr-2 text-slate-400" />
                    {job.salaryMin && job.salaryMax ? `$${job.salaryMin} - $${job.salaryMax}` : 'Not specified'}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                    Posted {job.postedDate}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Briefcase className="h-4 w-4 mr-2 text-slate-400" />
                    {job.experience}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <GraduationCap className="h-4 w-4 mr-2 text-slate-400" />
                    {job.education}
                  </div>
                  {job.duration && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Target className="h-4 w-4 mr-2 text-slate-400" />
                      {job.duration}
                    </div>
                  )}
                  {job.openings > 0 && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Users className="h-4 w-4 mr-2 text-slate-400" />
                      {job.openings} opening{job.openings > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="bg-purple-50 text-purple-700 text-[11px] px-2 py-0.5 border-0">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Badge variant={job.status === 'Active' ? 'default' : 'secondary'} className={job.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-0' : ''}>
                      {job.status}
                    </Badge>
                    <div className="flex items-center text-sm text-slate-500">
                      <Users className="h-4 w-4 mr-1 text-slate-400" />
                      {job.applicants} applicants
                    </div>
                  </div>
                  <Button variant="link" className="p-0 h-auto text-purple-600 font-semibold hover:no-underline" onClick={() => onViewApplicants(job.title)}>
                    View Candidates
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg bg-slate-50/50">
            <Building className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No jobs found</h3>
            <p className="text-slate-500">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
