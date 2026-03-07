import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  FileText,
  Trash2,
  Edit,
  Eye,
  BarChart3,
  Loader2,
  Search,
  ClipboardList,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { getForms, createForm, deleteForm, getFormPublicUrl } from '@/lib/api';
import type { Form } from '@/lib/api';
import { useLocation } from 'wouter';

export default function FormBuilderIndex() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const fetchForms = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getForms();
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      setForms(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const { data, error } = await createForm({
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
    });
    setCreating(false);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else if (data) {
      toast({ title: 'Success', description: 'Form created successfully' });
      setCreateOpen(false);
      setNewTitle('');
      setNewDesc('');
      navigate(`/form-builder/${data.id}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await deleteForm(deleteId);
    setDeleting(false);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Form deleted' });
      setDeleteId(null);
      fetchForms();
    }
  };

  const filtered = forms.filter(f =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-purple-600" />
              Form Builder
            </h1>
            <p className="text-gray-500 mt-1">Create and manage custom forms for job applications and more</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Form
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-xl bg-purple-100">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Forms</p>
                <p className="text-2xl font-bold">{forms.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-xl bg-green-100">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Forms</p>
                <p className="text-2xl font-bold">{forms.filter(f => f.status === 'active').length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Responses</p>
                <p className="text-2xl font-bold">{forms.reduce((sum, f) => sum + (f.responseCount || 0), 0)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search forms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Forms Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FileText className="h-12 w-12 mb-3" />
                <p className="text-lg font-medium">No forms found</p>
                <p className="text-sm">Create your first form to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responses</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((form) => (
                    <TableRow key={form.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{form.title}</p>
                          {form.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">{form.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={form.status === 'active' ? 'default' : 'secondary'}
                          className={form.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                        >
                          {form.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{form.responseCount || 0}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {form.createdAt ? new Date(form.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          }) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const { data, error } = await getFormPublicUrl(form.id);
                              if (error) {
                                toast({ title: 'Error', description: error, variant: 'destructive' });
                              } else if (data) {
                                await navigator.clipboard.writeText(data.publicUrl);
                                toast({ title: 'Copied!', description: 'Public form URL copied to clipboard' });
                              }
                            }}
                            title="Copy form URL"
                          >
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            URL
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const { data, error } = await getFormPublicUrl(form.id);
                              if (error) {
                                toast({ title: 'Error', description: error, variant: 'destructive' });
                              } else if (data) {
                                window.open(data.publicUrl, '_blank');
                              }
                            }}
                            title="Open form in new tab"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/form-builder/${form.id}`)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/form-builder/${form.id}/responses`)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Responses
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteId(form.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Form</DialogTitle>
              <DialogDescription>
                Give your form a title and optional description. You'll add fields next.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="form-title">Title *</Label>
                <Input
                  id="form-title"
                  placeholder="e.g. Job Application Form"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="form-desc">Description</Label>
                <Textarea
                  id="form-desc"
                  placeholder="Brief description of this form..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create & Build
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Form</DialogTitle>
              <DialogDescription>
                This will permanently delete the form and all its responses. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
