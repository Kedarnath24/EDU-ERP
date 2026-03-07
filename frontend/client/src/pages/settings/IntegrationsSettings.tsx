import { useState, useEffect } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ChevronLeft,
  Plug,
  CheckCircle2,
  ExternalLink,
  Settings,
  Zap,
  Mail,
  MessageSquare,
  BarChart3,
  CloudUpload,
  Webhook,
  RefreshCw,
  X,
  Phone,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getAllIntegrationsConfig, saveIntegrationConfig } from "@/lib/api";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  iconColor: string;
  connected: boolean;
  configFields?: { key: string; label: string; type?: string; placeholder?: string; defaultValue?: string; }[];
  backendConfig?: Record<string, any>;
}

const integrationList: Integration[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Send notifications and updates to Slack channels.",
    category: "Communication",
    icon: MessageSquare,
    iconColor: "text-purple-600 bg-purple-100",
    connected: true,
    configFields: [
      { key: "webhook_url", label: "Webhook URL", placeholder: "https://hooks.slack.com/..." },
      { key: "channel", label: "Default Channel", placeholder: "#general" },
    ],
  },
  {
    id: "gmail",
    name: "Gmail / Google Workspace",
    description: "Send transactional and team emails via Gmail SMTP.",
    category: "Email",
    icon: Mail,
    iconColor: "text-red-600 bg-red-100",
    connected: false,
    configFields: [
      { key: "smtp_host", label: "SMTP Host", placeholder: "smtp.gmail.com", defaultValue: "smtp.gmail.com" },
      { key: "smtp_port", label: "Port", placeholder: "465 (SSL) or 587 (TLS)", defaultValue: "465" },
      { key: "username", label: "Username", placeholder: "yourname@gmail.com" },
      { key: "password", label: "Password", type: "password", placeholder: "Google App Password" },
    ],
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Automate workflows by connecting EDU-ERP to 5,000+ apps.",
    category: "Automation",
    icon: Zap,
    iconColor: "text-amber-600 bg-amber-100",
    connected: false,
    configFields: [
      { key: "api_key", label: "Zapier API Key", type: "password", placeholder: "zap_••••••••" },
    ],
  },
  {
    id: "google_analytics",
    name: "Google Analytics",
    description: "Track product usage metrics and user behavior.",
    category: "Analytics",
    icon: BarChart3,
    iconColor: "text-blue-600 bg-blue-100",
    connected: false,
    configFields: [
      { key: "measurement_id", label: "Measurement ID", placeholder: "G-XXXXXXXXXX" },
    ],
  },
  {
    id: "s3",
    name: "AWS S3",
    description: "Store file uploads and backups in your own S3 bucket.",
    category: "Storage",
    icon: CloudUpload,
    iconColor: "text-orange-600 bg-orange-100",
    connected: false,
    configFields: [
      { key: "bucket", label: "Bucket Name", placeholder: "my-erp-files" },
      { key: "region", label: "Region", placeholder: "ap-south-1" },
      { key: "access_key", label: "Access Key ID", placeholder: "AKIA..." },
      { key: "secret_key", label: "Secret Access Key", type: "password", placeholder: "••••••••" },
    ],
  },
  {
    id: "webhook",
    name: "Custom Webhooks",
    description: "Push real-time events to any external HTTP endpoint.",
    category: "Developer",
    icon: Webhook,
    iconColor: "text-slate-600 bg-slate-100",
    connected: false,
    configFields: [
      { key: "endpoint", label: "Endpoint URL", placeholder: "https://your-server.com/webhook" },
      { key: "secret", label: "Signing Secret", type: "password", placeholder: "whsec_••••••••" },
    ],
  },
  {
    id: "waha",
    name: "WAHA API (WhatsApp)",
    description: "Send & receive WhatsApp messages via WAHA HTTP API.",
    category: "Messaging",
    icon: Phone,
    iconColor: "text-green-600 bg-green-100",
    connected: false,
    configFields: [
      { key: "base_url", label: "WAHA API Base URL", placeholder: "https://waha.yourserver.com" },
      { key: "api_key", label: "API Key", type: "password", placeholder: "your-api-key" },
      { key: "session_name", label: "Session Name", placeholder: "default" },
    ],
  },
];

const categoryColors: Record<string, string> = {
  Communication: "bg-purple-100 text-purple-700",
  Email: "bg-red-100 text-red-700",
  Automation: "bg-amber-100 text-amber-700",
  Analytics: "bg-blue-100 text-blue-700",
  Storage: "bg-orange-100 text-orange-700",
  Developer: "bg-slate-100 text-slate-700",
  Messaging: "bg-green-100 text-green-700",
};

const IntegrationsSettings = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>(integrationList);
  const [configuring, setConfiguring] = useState<Integration | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load configs from backend on mount
  useEffect(() => {
    const fetchConfigs = async () => {
      setLoading(true);
      const { data, error } = await getAllIntegrationsConfig();
      if (!error && data) {
        setIntegrations(prev => prev.map(i => {
          const backendItem = data.find((d: any) => d.id === i.id);
          if (backendItem) {
            return {
              ...i,
              connected: backendItem.is_active,
              backendConfig: backendItem.config || {}
            };
          }
          return i;
        }));
      }
      setLoading(false);
    };
    fetchConfigs();
  }, []);

  const toggleConnect = async (id: string) => {
    const target = integrations.find(i => i.id === id);
    if (!target) return;

    const newConnectedStatus = !target.connected;
    const configToSave = target.backendConfig || {};

    const { error } = await saveIntegrationConfig(id, configToSave, newConnectedStatus);
    if (error) {
      toast({ title: "Failed to update integration", description: error, variant: "destructive" });
      return;
    }

    setIntegrations(prev =>
      prev.map(i => {
        if (i.id !== id) return i;
        const updated = { ...i, connected: newConnectedStatus };
        toast({
          title: updated.connected ? `${i.name} connected` : `${i.name} disconnected`,
          description: updated.connected ? "Integration is now active." : "Integration has been removed.",
        });
        return updated;
      })
    );
  };

  const openConfigure = (i: Integration) => {
    setConfiguring(i);
    // Initialize configValues from backendConfig or defaults
    const initialConfig: Record<string, string> = {};
    i.configFields?.forEach(f => {
      initialConfig[f.key] = (i.backendConfig?.[f.key]) ?? (f.defaultValue ?? "");
    });
    setConfigValues(initialConfig);
  };

  const saveConfig = async () => {
    if (!configuring) return;

    const { error } = await saveIntegrationConfig(configuring.id, configValues, true);
    if (error) {
      toast({ title: "Failed to save configuration", description: error, variant: "destructive" });
      return;
    }

    setIntegrations(prev =>
      prev.map(i => i.id === configuring.id ? { ...i, connected: true, backendConfig: configValues } : i)
    );
    toast({ title: `${configuring.name} configured`, description: "Settings saved and integration enabled." });
    setConfiguring(null);
  };

  const syncNow = (id: string) => {
    setSyncing(id);
    setTimeout(() => {
      setSyncing(null);
      toast({ title: "Sync complete" });
    }, 1500);
  };

  const connected = integrations.filter(i => i.connected);
  const notConnected = integrations.filter(i => !i.connected);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-slate-900 px-2">
              <ChevronLeft size={16} /> Settings
            </Button>
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-sm font-medium text-slate-700">Integrations</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Integrations
            {loading && <RefreshCw size={18} className="animate-spin text-slate-400" />}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Connect EDU-ERP with your favorite tools to automate workflows and sync data.
          </p>
        </div>

        {/* Connected */}
        {connected.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Connected ({connected.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {connected.map((i) => {
                const Icon = i.icon;
                return (
                  <Card key={i.id} className="border border-emerald-200 bg-emerald-50/40">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${i.iconColor}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800">{i.name}</p>
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <p className="text-xs text-slate-500 truncate">{i.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => syncNow(i.id)}
                          disabled={syncing === i.id}
                        >
                          <RefreshCw size={14} className={syncing === i.id ? "animate-spin" : ""} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openConfigure(i)}>
                          <Settings size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => toggleConnect(i.id)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Available */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Available ({notConnected.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notConnected.map((i) => {
              const Icon = i.icon;
              return (
                <Card key={i.id} className="border border-slate-200 hover:border-indigo-300 transition-all">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${i.iconColor}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{i.name}</p>
                        <Badge className={`text-xs ${categoryColors[i.category] ?? "bg-slate-100 text-slate-600"}`}>
                          {i.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{i.description}</p>
                    </div>
                    {i.id === "waha" ? (
                      <Link href="/settings/integrations/waha">
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 gap-1.5 text-xs border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <ArrowRight size={12} /> Configure
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5 text-xs"
                        onClick={() => i.configFields ? openConfigure(i) : toggleConnect(i.id)}
                      >
                        <Plug size={12} /> Connect
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Configure Dialog */}
        <Dialog open={!!configuring} onOpenChange={(open) => !open && setConfiguring(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configure — {configuring?.name}</DialogTitle>
              <DialogDescription>{configuring?.description}</DialogDescription>
            </DialogHeader>
            {configuring?.configFields && (
              <div className="space-y-4 mt-2">
                {configuring.configFields.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label>{f.label}</Label>
                    <Input
                      type={f.type ?? "text"}
                      placeholder={f.placeholder}
                      value={configValues[f.key] ?? ""}
                      onChange={(e) => setConfigValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
                <Separator />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setConfiguring(null)}>Cancel</Button>
                  <Button onClick={saveConfig} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Plug size={14} /> Connect & Save
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default IntegrationsSettings;
