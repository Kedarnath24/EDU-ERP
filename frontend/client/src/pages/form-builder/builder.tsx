import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  ArrowLeft,
  Loader2,
  Type,
  Mail,
  Phone,
  Hash,
  AlignLeft,
  List,
  CheckSquare,
  Circle,
  Calendar,
  Link,
  FileUp,
  Eye,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { getForm, updateForm, getFormPublicUrl } from '@/lib/api';
import type { FormField } from '@/lib/api';
import { useLocation, useRoute } from 'wouter';

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'textarea', label: 'Text Area', icon: AlignLeft },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'radio', label: 'Radio', icon: Circle },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'url', label: 'URL', icon: Link },
  { value: 'file', label: 'File Upload', icon: FileUp },
];

interface LocalField extends FormField {
  _key: string; // local key for React rendering
}

let fieldKeyCounter = 0;
function nextKey() {
  return `field_${++fieldKeyCounter}`;
}

export default function FormBuilderEditor() {
  const [, params] = useRoute('/form-builder/:id');
  const formId = params?.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [fields, setFields] = useState<LocalField[]>([]);
  const [preview, setPreview] = useState(false);

  const fetchForm = useCallback(async () => {
    if (!formId) return;
    setLoading(true);
    const { data, error } = await getForm(formId);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
      navigate('/form-builder');
      return;
    }
    if (data) {
      setTitle(data.title);
      setDescription(data.description || '');
      setStatus(data.status);
      setFields(
        (data.fields || []).map(f => ({ ...f, _key: nextKey() }))
      );
    }
    setLoading(false);
  }, [formId, toast, navigate]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const addField = (type: string) => {
    const typeInfo = FIELD_TYPES.find(t => t.value === type);
    setFields(prev => [
      ...prev,
      {
        _key: nextKey(),
        label: typeInfo?.label || 'New Field',
        type,
        placeholder: '',
        required: false,
        options: type === 'select' || type === 'radio' || type === 'checkbox' ? ['Option 1', 'Option 2'] : [],
        order: prev.length,
      },
    ]);
  };

  const updateField = (key: string, updates: Partial<LocalField>) => {
    setFields(prev =>
      prev.map(f => (f._key === key ? { ...f, ...updates } : f))
    );
  };

  const removeField = (key: string) => {
    setFields(prev => prev.filter(f => f._key !== key));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    setFields(prev => {
      const arr = [...prev];
      const swapIdx = direction === 'up' ? index - 1 : index + 1;
      if (swapIdx < 0 || swapIdx >= arr.length) return prev;
      [arr[index], arr[swapIdx]] = [arr[swapIdx], arr[index]];
      return arr;
    });
  };

  const addOption = (key: string) => {
    setFields(prev =>
      prev.map(f => {
        if (f._key === key) {
          const opts = [...(f.options || []), `Option ${(f.options || []).length + 1}`];
          return { ...f, options: opts };
        }
        return f;
      })
    );
  };

  const updateOption = (key: string, optIndex: number, value: string) => {
    setFields(prev =>
      prev.map(f => {
        if (f._key === key) {
          const opts = [...(f.options || [])];
          opts[optIndex] = value;
          return { ...f, options: opts };
        }
        return f;
      })
    );
  };

  const removeOption = (key: string, optIndex: number) => {
    setFields(prev =>
      prev.map(f => {
        if (f._key === key) {
          const opts = (f.options || []).filter((_, i) => i !== optIndex);
          return { ...f, options: opts };
        }
        return f;
      })
    );
  };

  const handleSave = async () => {
    if (!formId || !title.trim()) {
      toast({ title: 'Error', description: 'Form title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await updateForm(formId, {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      fields: fields.map((f, idx) => ({
        label: f.label,
        type: f.type,
        placeholder: f.placeholder,
        required: f.required,
        options: f.options,
        order: idx,
      })),
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Form updated successfully' });
    }
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
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/form-builder')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-xl font-bold text-gray-900">Edit Form</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!formId) return;
                const { data, error } = await getFormPublicUrl(formId);
                if (error) {
                  toast({ title: 'Error', description: error, variant: 'destructive' });
                } else if (data) {
                  await navigator.clipboard.writeText(data.publicUrl);
                  toast({ title: 'Copied!', description: 'Public form URL copied to clipboard' });
                }
              }}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy URL
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!formId) return;
                const { data, error } = await getFormPublicUrl(formId);
                if (error) {
                  toast({ title: 'Error', description: error, variant: 'destructive' });
                } else if (data) {
                  window.open(data.publicUrl, '_blank');
                }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open Form
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreview(!preview)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {preview ? 'Editor' : 'Preview'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Form
            </Button>
          </div>
        </div>

        {preview ? (
          /* ─── Preview Mode ─── */
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>{title || 'Untitled Form'}</CardTitle>
              {description && <p className="text-gray-500 text-sm">{description}</p>}
            </CardHeader>
            <CardContent className="space-y-5">
              {fields.length === 0 && (
                <p className="text-gray-400 text-center py-8">No fields added yet</p>
              )}
              {fields.map((field) => (
                <div key={field._key} className="space-y-1.5">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderPreviewField(field)}
                </div>
              ))}
              {fields.length > 0 && (
                <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled>
                  Submit
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* ─── Editor Mode ─── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Form Settings + Fields */}
            <div className="lg:col-span-2 space-y-4">
              {/* Form Metadata */}
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <Label htmlFor="form-title">Form Title *</Label>
                    <Input
                      id="form-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter form title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="form-desc">Description</Label>
                    <Textarea
                      id="form-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe this form..."
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label>Status:</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Fields List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700">
                  Form Fields ({fields.length})
                </h3>
                {fields.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Plus className="h-10 w-10 mb-2" />
                      <p className="font-medium">No fields yet</p>
                      <p className="text-sm">Add fields from the panel on the right</p>
                    </CardContent>
                  </Card>
                )}
                {fields.map((field, index) => {
                  const typeInfo = FIELD_TYPES.find(t => t.value === field.type);
                  const Icon = typeInfo?.icon || Type;
                  const hasOptions = ['select', 'radio', 'checkbox'].includes(field.type);

                  return (
                    <Card key={field._key} className="border-l-4 border-l-purple-400">
                      <CardContent className="p-4 space-y-3">
                        {/* Field header */}
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => moveField(index, 'up')}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <GripVertical className="h-3 w-3 rotate-180" />
                            </button>
                            <button
                              onClick={() => moveField(index, 'down')}
                              disabled={index === fields.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <GripVertical className="h-3 w-3" />
                            </button>
                          </div>
                          <Badge variant="outline" className="gap-1">
                            <Icon className="h-3 w-3" />
                            {typeInfo?.label}
                          </Badge>
                          <span className="text-xs text-gray-400">#{index + 1}</span>
                          <div className="flex-1" />
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`req-${field._key}`} className="text-xs">Required</Label>
                            <Switch
                              id={`req-${field._key}`}
                              checked={field.required || false}
                              onCheckedChange={(checked) => updateField(field._key, { required: checked })}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeField(field._key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Field settings */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Label</Label>
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(field._key, { label: e.target.value })}
                              placeholder="Field label"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Placeholder</Label>
                            <Input
                              value={field.placeholder || ''}
                              onChange={(e) => updateField(field._key, { placeholder: e.target.value })}
                              placeholder="Placeholder text"
                            />
                          </div>
                        </div>

                        {/* Options for select/radio/checkbox */}
                        {hasOptions && (
                          <div className="space-y-2">
                            <Label className="text-xs">Options</Label>
                            {(field.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <Input
                                  value={opt}
                                  onChange={(e) => updateOption(field._key, optIdx, e.target.value)}
                                  placeholder={`Option ${optIdx + 1}`}
                                  className="text-sm"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-red-500"
                                  onClick={() => removeOption(field._key, optIdx)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(field._key)}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Option
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Right: Add Field Panel */}
            <div>
              <Card className="sticky top-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Add Field</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {FIELD_TYPES.map((ft) => {
                    const Icon = ft.icon;
                    return (
                      <button
                        key={ft.value}
                        onClick={() => addField(ft.value)}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 p-2.5 text-sm text-gray-700 hover:border-purple-400 hover:bg-purple-50 transition-colors text-left"
                      >
                        <Icon className="h-4 w-4 text-purple-500 shrink-0" />
                        {ft.label}
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function renderPreviewField(field: LocalField) {
  switch (field.type) {
    case 'textarea':
      return <Textarea placeholder={field.placeholder || ''} disabled className="bg-gray-50" rows={3} />;
    case 'select':
      return (
        <Select disabled>
          <SelectTrigger className="bg-gray-50">
            <SelectValue placeholder={field.placeholder || 'Select...'} />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((opt, i) => (
              <SelectItem key={i} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'radio':
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <input type="radio" name={field._key} disabled className="accent-purple-600" />
              {opt}
            </label>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" disabled className="accent-purple-600" />
              {opt}
            </label>
          ))}
        </div>
      );
    case 'date':
      return <Input type="date" disabled className="bg-gray-50" />;
    case 'number':
      return <Input type="number" placeholder={field.placeholder || ''} disabled className="bg-gray-50" />;
    case 'email':
      return <Input type="email" placeholder={field.placeholder || 'you@example.com'} disabled className="bg-gray-50" />;
    case 'phone':
      return <Input type="tel" placeholder={field.placeholder || '+91 98765 43210'} disabled className="bg-gray-50" />;
    case 'url':
      return <Input type="url" placeholder={field.placeholder || 'https://'} disabled className="bg-gray-50" />;
    case 'file':
      return <Input type="file" disabled className="bg-gray-50" />;
    default:
      return <Input placeholder={field.placeholder || ''} disabled className="bg-gray-50" />;
  }
}
