import { useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { ChevronLeft, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "zh", label: "Chinese (Simplified)" },
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  { value: "DD MMM YYYY", label: "DD MMM YYYY" },
];

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
];

const GeneralSettings = () => {
  const { toast } = useToast();

  const [workspaceName, setWorkspaceName] = useState("EDU-ERP Workspace");
  const [workspaceUrl, setWorkspaceUrl] = useState("edu-erp.app");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [language, setLanguage] = useState("en");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [currency, setCurrency] = useState("INR");
  const [weekStart, setWeekStart] = useState("monday");
  const [autoSave, setAutoSave] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your general settings have been updated successfully.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-slate-900 px-2">
              <ChevronLeft size={16} /> Settings
            </Button>
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-sm font-medium text-slate-700">General</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">General Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage workspace identity, localization and behavior.</p>
        </div>

        {/* Workspace Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace Identity</CardTitle>
            <CardDescription>Name and URL used across the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Company"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workspace-url">Workspace URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">https://</span>
                <Input
                  id="workspace-url"
                  value={workspaceUrl}
                  onChange={(e) => setWorkspaceUrl(e.target.value)}
                  placeholder="mycompany"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Localization</CardTitle>
            <CardDescription>Regional format preferences for dates, times and currency.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date Format</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DATE_FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Week Starts On</Label>
                <Select value={weekStart} onValueChange={setWeekStart}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Behavior</CardTitle>
            <CardDescription>Control how the application behaves for all users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Auto-save changes</p>
                <p className="text-xs text-slate-500 mt-0.5">Automatically save form changes every 30 seconds.</p>
              </div>
              <Switch checked={autoSave} onCheckedChange={setAutoSave} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Usage analytics</p>
                <p className="text-xs text-slate-500 mt-0.5">Share anonymous usage data to help improve the product.</p>
              </div>
              <Switch checked={analyticsEnabled} onCheckedChange={setAnalyticsEnabled} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Save size={16} /> Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GeneralSettings;
