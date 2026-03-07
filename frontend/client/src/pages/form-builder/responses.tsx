import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Loader2,
  Eye,
  Search,
  FileText,
  Download,
  Inbox,
} from 'lucide-react';
import { getFormResponses } from '@/lib/api';
import type { FormResponsesResult, FormResponse } from '@/lib/api';
import { useLocation, useRoute } from 'wouter';

export default function FormResponses() {
  const [, params] = useRoute('/form-builder/:id/responses');
  const formId = params?.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<FormResponsesResult | null>(null);
  const [search, setSearch] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);

  const fetchResponses = useCallback(async () => {
    if (!formId) return;
    setLoading(true);
    const { data, error } = await getFormResponses(formId);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
      navigate('/form-builder');
      return;
    }
    if (data) setResult(data);
    setLoading(false);
  }, [formId, toast, navigate]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const filtered = (result?.responses || []).filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.respondentName || '').toLowerCase().includes(q) ||
      (r.respondentEmail || '').toLowerCase().includes(q) ||
      Object.values(r.answers).some(v => v.toLowerCase().includes(q))
    );
  });

  const handleExportCSV = () => {
    if (!result || result.responses.length === 0) return;

    const headers = [
      'Respondent Name',
      'Respondent Email',
      'Submitted At',
      ...result.fields.map(f => f.label),
    ];

    const rows = result.responses.map(r => [
      r.respondentName || '',
      r.respondentEmail || '',
      r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '',
      ...result.fields.map(f => r.answers[f.id] || ''),
    ]);

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.formTitle || 'form'}-responses.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/form-builder')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {result?.formTitle || 'Form'} — Responses
              </h1>
              <p className="text-sm text-gray-500">{result?.total || 0} total responses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/form-builder/${formId}`)}
            >
              <FileText className="h-4 w-4 mr-1" /> Edit Form
            </Button>
            {(result?.responses.length || 0) > 0 && (
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-1" /> Export CSV
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-xl bg-purple-100">
                <Inbox className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Responses</p>
                <p className="text-2xl font-bold">{result?.total || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Form Fields</p>
                <p className="text-2xl font-bold">{result?.fields.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-xl bg-green-100">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Latest Response</p>
                <p className="text-sm font-medium">
                  {result && result.responses.length > 0
                    ? new Date(result.responses[0].submittedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })
                    : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search responses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Responses Table */}
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Inbox className="h-12 w-12 mb-3" />
                <p className="text-lg font-medium">No responses yet</p>
                <p className="text-sm">Responses will appear here when submitted</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Submitted</TableHead>
                      {(result?.fields || []).slice(0, 3).map(f => (
                        <TableHead key={f.id}>{f.label}</TableHead>
                      ))}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((response, idx) => (
                      <TableRow key={response.id} className="hover:bg-gray-50">
                        <TableCell className="text-gray-500">{idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          {response.respondentName || '—'}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {response.respondentEmail || '—'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(response.submittedAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </TableCell>
                        {(result?.fields || []).slice(0, 3).map(f => (
                          <TableCell key={f.id} className="max-w-[200px] truncate">
                            {response.answers[f.id] || '—'}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedResponse(response)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Detail Dialog */}
        <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Response Details</DialogTitle>
            </DialogHeader>
            {selectedResponse && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {selectedResponse.respondentName && (
                    <span><strong>Name:</strong> {selectedResponse.respondentName}</span>
                  )}
                  {selectedResponse.respondentEmail && (
                    <span><strong>Email:</strong> {selectedResponse.respondentEmail}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Submitted: {new Date(selectedResponse.submittedAt).toLocaleString()}
                </p>
                <Separator />
                <div className="space-y-3">
                  {(result?.fields || []).map(field => (
                    <div key={field.id}>
                      <p className="text-sm font-medium text-gray-700">{field.label}</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {selectedResponse.answers[field.id] || <span className="italic text-gray-400">No answer</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
