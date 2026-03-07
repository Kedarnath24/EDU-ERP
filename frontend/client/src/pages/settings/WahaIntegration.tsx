import { useState, useCallback } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import {
    ChevronLeft,
    Phone,
    Key,
    Link2,
    Webhook,
    QrCode,
    ShieldCheck,
    Eye,
    EyeOff,
    Copy,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Save,
    Loader2,
    Info,
    ExternalLink,
    Wifi,
    WifiOff,
    User,
    Lock,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

/* ─────────── Types ─────────── */
interface WahaConfig {
    baseUrl: string;
    apiKey: string;
    sessionName: string;
    webhookUrl: string;
    dashboardUsername: string;
    dashboardPassword: string;
}

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

const defaultConfig: WahaConfig = {
    baseUrl: "",
    apiKey: "",
    sessionName: "default",
    webhookUrl: "",
    dashboardUsername: "",
    dashboardPassword: "",
};

/* ─────────── Component ─────────── */
const WahaIntegration = () => {
    const { toast } = useToast();

    // Form state
    const [config, setConfig] = useState<WahaConfig>(defaultConfig);
    const [showApiKey, setShowApiKey] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [webhookEnabled, setWebhookEnabled] = useState(false);
    const [dashboardEnabled, setDashboardEnabled] = useState(false);

    // Connection state
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Active tab
    const [activeTab, setActiveTab] = useState("connection");

    /* ── Handlers ── */
    const updateConfig = (field: keyof WahaConfig, value: string) => {
        setConfig((prev) => ({ ...prev, [field]: value }));
    };

    const copyToClipboard = useCallback((text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
        toast({ title: "Copied!", description: `${fieldName} copied to clipboard.` });
    }, [toast]);

    const handleTestConnection = () => {
        if (!config.baseUrl.trim()) {
            toast({ title: "Missing URL", description: "Please enter the WAHA API Base URL.", variant: "destructive" });
            return;
        }
        if (!config.apiKey.trim()) {
            toast({ title: "Missing API Key", description: "Please enter the API Key.", variant: "destructive" });
            return;
        }

        setTesting(true);
        setConnectionStatus("connecting");

        // Simulate API test — will be replaced by actual backend callback
        setTimeout(() => {
            setTesting(false);
            setConnectionStatus("connected");
            toast({ title: "Connection Successful", description: "WAHA API is reachable and authenticated." });
        }, 2000);
    };

    const handleGenerateQR = () => {
        if (!config.baseUrl.trim() || !config.apiKey.trim()) {
            toast({
                title: "Configuration Required",
                description: "Please provide the Base URL and API Key first.",
                variant: "destructive",
            });
            return;
        }

        setQrLoading(true);

        // Simulate QR generation — will be replaced by backend callback
        setTimeout(() => {
            setQrCode("placeholder-qr");
            setQrLoading(false);
            toast({ title: "QR Code Generated", description: "Scan the QR code with WhatsApp to authenticate." });
        }, 2500);
    };

    const handleSaveConfig = () => {
        if (!config.baseUrl.trim()) {
            toast({ title: "Missing URL", description: "WAHA API Base URL is required.", variant: "destructive" });
            return;
        }
        if (!config.apiKey.trim()) {
            toast({ title: "Missing API Key", description: "API Key is required.", variant: "destructive" });
            return;
        }
        if (!config.sessionName.trim()) {
            toast({ title: "Missing Session", description: "Session Name is required.", variant: "destructive" });
            return;
        }

        setSaving(true);

        // Simulate save — will be replaced by backend callback
        setTimeout(() => {
            setSaving(false);
            toast({ title: "Configuration Saved", description: "WAHA API settings have been saved successfully." });
        }, 1500);
    };

    const handleResetConfig = () => {
        setConfig(defaultConfig);
        setConnectionStatus("disconnected");
        setQrCode(null);
        setWebhookEnabled(false);
        setDashboardEnabled(false);
        toast({ title: "Configuration Reset", description: "All fields have been cleared." });
    };

    /* ── Helper Components ── */
    const StatusBadge = () => {
        switch (connectionStatus) {
            case "connected":
                return (
                    <Badge className="bg-emerald-100 text-emerald-700 gap-1.5 px-3 py-1">
                        <Wifi size={12} /> Connected
                    </Badge>
                );
            case "connecting":
                return (
                    <Badge className="bg-amber-100 text-amber-700 gap-1.5 px-3 py-1">
                        <Loader2 size={12} className="animate-spin" /> Connecting…
                    </Badge>
                );
            case "error":
                return (
                    <Badge className="bg-red-100 text-red-700 gap-1.5 px-3 py-1">
                        <WifiOff size={12} /> Error
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-slate-100 text-slate-600 gap-1.5 px-3 py-1">
                        <WifiOff size={12} /> Disconnected
                    </Badge>
                );
        }
    };

    const FieldInfo = ({ text }: { text: string }) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Info size={14} className="text-slate-400 cursor-help ml-1 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[260px] text-xs">
                    {text}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    /* ─────────── Render ─────────── */
    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-4xl">
                {/* ── Breadcrumb ── */}
                <div className="flex items-center gap-2">
                    <Link href="/settings">
                        <Button variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-slate-900 px-2">
                            <ChevronLeft size={16} /> Settings
                        </Button>
                    </Link>
                    <span className="text-slate-400">/</span>
                    <Link href="/settings/integrations">
                        <Button variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-slate-900 px-2">
                            Integrations
                        </Button>
                    </Link>
                    <span className="text-slate-400">/</span>
                    <span className="text-sm font-medium text-slate-700">WAHA API</span>
                </div>

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                            <Phone size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-900">WAHA API Integration</h1>
                                <StatusBadge />
                            </div>
                            <p className="mt-0.5 text-sm text-slate-500">
                                Connect WhatsApp messaging via WAHA (WhatsApp HTTP API)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleResetConfig} className="gap-1.5 text-xs">
                            <RefreshCw size={13} /> Reset
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSaveConfig}
                            disabled={saving}
                            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs px-5"
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                            {saving ? "Saving…" : "Save Configuration"}
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* ── Tabs ── */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-slate-100/80 p-1 border border-slate-200">
                        <TabsTrigger
                            value="connection"
                            className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm px-5 gap-1.5 text-xs"
                        >
                            <Link2 size={13} /> Connection
                        </TabsTrigger>
                        <TabsTrigger
                            value="authentication"
                            className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm px-5 gap-1.5 text-xs"
                        >
                            <QrCode size={13} /> WhatsApp Auth
                        </TabsTrigger>
                        <TabsTrigger
                            value="webhook"
                            className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm px-5 gap-1.5 text-xs"
                        >
                            <Webhook size={13} /> Webhook
                        </TabsTrigger>
                        <TabsTrigger
                            value="dashboard"
                            className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm px-5 gap-1.5 text-xs"
                        >
                            <ShieldCheck size={13} /> Dashboard
                        </TabsTrigger>
                    </TabsList>

                    {/* ════════════════ TAB: Connection ════════════════ */}
                    <TabsContent value="connection" className="space-y-5">
                        <Card className="border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Link2 size={18} className="text-green-600" />
                                    API Connection Settings
                                </CardTitle>
                                <CardDescription>
                                    Configure the base URL and credentials to connect to your WAHA instance.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Base URL */}
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="waha-base-url" className="text-sm font-medium">
                                            WAHA API Base URL <span className="text-red-500">*</span>
                                        </Label>
                                        <FieldInfo text="The base URL of your WAHA instance, e.g. http://localhost:3000 or https://waha.yourserver.com" />
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="waha-base-url"
                                            placeholder="https://waha.yourserver.com"
                                            value={config.baseUrl}
                                            onChange={(e) => updateConfig("baseUrl", e.target.value)}
                                            className="pr-10"
                                        />
                                        {config.baseUrl && (
                                            <button
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                onClick={() => copyToClipboard(config.baseUrl, "Base URL")}
                                            >
                                                {copiedField === "Base URL" ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        The HTTP endpoint where your WAHA server is running
                                    </p>
                                </div>

                                {/* API Key */}
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="waha-api-key" className="text-sm font-medium">
                                            API Key <span className="text-red-500">*</span>
                                        </Label>
                                        <FieldInfo text="Your WAHA API key for authentication. Found in WAHA environment configuration (WHATSAPP_API_KEY)." />
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="waha-api-key"
                                            type={showApiKey ? "text" : "password"}
                                            placeholder="your-api-key-here"
                                            value={config.apiKey}
                                            onChange={(e) => updateConfig("apiKey", e.target.value)}
                                            className="pr-20"
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button
                                                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                            >
                                                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                            {config.apiKey && (
                                                <button
                                                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                                    onClick={() => copyToClipboard(config.apiKey, "API Key")}
                                                >
                                                    {copiedField === "API Key" ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Used to authenticate API requests to the WAHA server
                                    </p>
                                </div>

                                {/* Session Name */}
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="waha-session" className="text-sm font-medium">
                                            Session Name <span className="text-red-500">*</span>
                                        </Label>
                                        <FieldInfo text="The WAHA session identifier. Use 'default' for single-session setups, or a custom name for multi-session." />
                                    </div>
                                    <Input
                                        id="waha-session"
                                        placeholder="default"
                                        value={config.sessionName}
                                        onChange={(e) => updateConfig("sessionName", e.target.value)}
                                    />
                                    <p className="text-xs text-slate-400">
                                        Identifies the WhatsApp session on the WAHA server
                                    </p>
                                </div>

                                <Separator />

                                {/* Test Connection */}
                                <div className="flex items-center justify-between bg-slate-50 rounded-lg border border-slate-200 p-4">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">Test Connection</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Verify that your WAHA instance is reachable with the provided credentials
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleTestConnection}
                                        disabled={testing}
                                        className="gap-1.5 text-xs min-w-[130px]"
                                    >
                                        {testing ? (
                                            <>
                                                <Loader2 size={13} className="animate-spin" /> Testing…
                                            </>
                                        ) : (
                                            <>
                                                <Wifi size={13} /> Test Connection
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {connectionStatus === "connected" && (
                                    <Alert className="border-emerald-200 bg-emerald-50">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        <AlertTitle className="text-emerald-800 text-sm">Connection Verified</AlertTitle>
                                        <AlertDescription className="text-emerald-700 text-xs">
                                            WAHA API is reachable and authenticated. You can proceed to the WhatsApp Auth tab to scan the QR code.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {connectionStatus === "error" && (
                                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle className="text-sm">Connection Failed</AlertTitle>
                                        <AlertDescription className="text-xs">
                                            Could not reach the WAHA server. Check your URL, API key, and ensure the server is running.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ════════════════ TAB: WhatsApp Authentication ════════════════ */}
                    <TabsContent value="authentication" className="space-y-5">
                        <Card className="border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <QrCode size={18} className="text-green-600" />
                                    WhatsApp QR Authentication
                                </CardTitle>
                                <CardDescription>
                                    Scan the QR code with your WhatsApp mobile app to link this session.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Alert className="border-blue-200 bg-blue-50">
                                    <Info className="h-4 w-4 text-blue-600" />
                                    <AlertTitle className="text-blue-800 text-sm">How it works</AlertTitle>
                                    <AlertDescription className="text-blue-700 text-xs">
                                        <ol className="list-decimal list-inside space-y-1 mt-1">
                                            <li>Ensure your WAHA connection is configured and tested</li>
                                            <li>Click "Generate QR Code" below</li>
                                            <li>Open WhatsApp on your phone → Settings → Linked Devices</li>
                                            <li>Tap "Link a Device" and scan the QR code displayed here</li>
                                        </ol>
                                    </AlertDescription>
                                </Alert>

                                <div className="flex flex-col items-center gap-6 py-4">
                                    {/* QR Display Area */}
                                    <div className="w-64 h-64 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                                        {qrLoading ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 size={32} className="animate-spin text-green-500" />
                                                <span className="text-xs text-slate-500 font-medium">Generating QR…</span>
                                            </div>
                                        ) : qrCode ? (
                                            <div className="flex flex-col items-center gap-3 p-4">
                                                {/* Simulated QR pattern */}
                                                <div className="w-48 h-48 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
                                                    <div className="grid grid-cols-8 gap-[2px]">
                                                        {Array.from({ length: 64 }).map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className={`w-4 h-4 rounded-sm ${Math.random() > 0.4 ? "bg-slate-800" : "bg-white"
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-500">Scan with WhatsApp</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 text-center px-6">
                                                <QrCode size={40} className="text-slate-300" />
                                                <p className="text-xs text-slate-400">
                                                    Click the button below to generate a QR code
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={handleGenerateQR}
                                            disabled={qrLoading}
                                            className="gap-2 bg-green-600 hover:bg-green-700 text-white px-6"
                                        >
                                            {qrLoading ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <QrCode size={14} />
                                            )}
                                            {qrCode ? "Refresh QR Code" : "Generate QR Code"}
                                        </Button>
                                        {qrCode && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setQrCode(null);
                                                    toast({ title: "QR cleared" });
                                                }}
                                                className="text-xs"
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldCheck size={14} className="text-slate-600" />
                                        <p className="text-sm font-medium text-slate-700">Session Status</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Status</p>
                                            <p className="text-sm font-semibold text-slate-700 mt-0.5">
                                                {qrCode ? "QR Generated" : "Not Started"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Session</p>
                                            <p className="text-sm font-semibold text-slate-700 mt-0.5">{config.sessionName || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Phone</p>
                                            <p className="text-sm font-semibold text-slate-700 mt-0.5">Not linked</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ════════════════ TAB: Webhook ════════════════ */}
                    <TabsContent value="webhook" className="space-y-5">
                        <Card className="border-slate-200">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Webhook size={18} className="text-green-600" />
                                            Webhook Configuration
                                        </CardTitle>
                                        <CardDescription>
                                            Receive real-time message events from WAHA at your endpoint.
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="webhook-toggle" className="text-xs text-slate-500 font-medium">
                                            {webhookEnabled ? "Enabled" : "Disabled"}
                                        </Label>
                                        <Switch
                                            id="webhook-toggle"
                                            checked={webhookEnabled}
                                            onCheckedChange={setWebhookEnabled}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {webhookEnabled ? (
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <Label htmlFor="waha-webhook-url" className="text-sm font-medium">
                                                    Webhook URL
                                                </Label>
                                                <FieldInfo text="The endpoint where WAHA will send event notifications (incoming messages, status updates, etc.)." />
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    id="waha-webhook-url"
                                                    placeholder="https://your-app.com/api/waha/webhook"
                                                    value={config.webhookUrl}
                                                    onChange={(e) => updateConfig("webhookUrl", e.target.value)}
                                                    className="pr-10"
                                                />
                                                {config.webhookUrl && (
                                                    <button
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                        onClick={() => copyToClipboard(config.webhookUrl, "Webhook URL")}
                                                    >
                                                        {copiedField === "Webhook URL" ? (
                                                            <CheckCircle2 size={14} className="text-green-500" />
                                                        ) : (
                                                            <Copy size={14} />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                WAHA will POST event data to this URL for incoming messages and status changes
                                            </p>
                                        </div>

                                        <Alert className="border-amber-200 bg-amber-50">
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                            <AlertTitle className="text-amber-800 text-sm">Important</AlertTitle>
                                            <AlertDescription className="text-amber-700 text-xs">
                                                Your webhook endpoint must be publicly accessible and respond with a 200 status.
                                                WAHA will retry failed deliveries up to 3 times.
                                            </AlertDescription>
                                        </Alert>

                                        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                                            <p className="text-xs font-medium text-slate-600 mb-2">Webhook Events</p>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    "message",
                                                    "message.ack",
                                                    "state.change",
                                                    "group.join",
                                                    "group.leave",
                                                    "call.received",
                                                ].map((evt) => (
                                                    <Badge key={evt} variant="secondary" className="text-xs font-mono">
                                                        {evt}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-8 text-center">
                                        <Webhook size={36} className="text-slate-300 mb-3" />
                                        <p className="text-sm text-slate-500 font-medium">Webhook is disabled</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                                            Enable the webhook toggle above to configure event notifications from WAHA
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ════════════════ TAB: Dashboard Credentials ════════════════ */}
                    <TabsContent value="dashboard" className="space-y-5">
                        <Card className="border-slate-200">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <ShieldCheck size={18} className="text-green-600" />
                                            Dashboard Credentials
                                        </CardTitle>
                                        <CardDescription>
                                            Optional credentials for accessing the WAHA web dashboard.
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="dashboard-toggle" className="text-xs text-slate-500 font-medium">
                                            {dashboardEnabled ? "Enabled" : "Disabled"}
                                        </Label>
                                        <Switch
                                            id="dashboard-toggle"
                                            checked={dashboardEnabled}
                                            onCheckedChange={setDashboardEnabled}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {dashboardEnabled ? (
                                    <div className="space-y-5">
                                        {/* Username */}
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <Label htmlFor="waha-dash-user" className="text-sm font-medium">
                                                    Dashboard Username
                                                </Label>
                                                <FieldInfo text="Username for the WAHA dashboard web interface (WAHA_DASHBOARD_USERNAME env variable)." />
                                            </div>
                                            <div className="relative">
                                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    id="waha-dash-user"
                                                    placeholder="admin"
                                                    value={config.dashboardUsername}
                                                    onChange={(e) => updateConfig("dashboardUsername", e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>

                                        {/* Password */}
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <Label htmlFor="waha-dash-pass" className="text-sm font-medium">
                                                    Dashboard Password
                                                </Label>
                                                <FieldInfo text="Password for the WAHA dashboard (WAHA_DASHBOARD_PASSWORD env variable)." />
                                            </div>
                                            <div className="relative">
                                                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    id="waha-dash-pass"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    value={config.dashboardPassword}
                                                    onChange={(e) => updateConfig("dashboardPassword", e.target.value)}
                                                    className="pl-9 pr-10"
                                                />
                                                <button
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between bg-slate-50 rounded-lg border border-slate-200 p-4">
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">Open WAHA Dashboard</p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Access the WAHA web UI in a new tab
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5 text-xs"
                                                onClick={() => {
                                                    if (config.baseUrl) {
                                                        window.open(config.baseUrl + "/dashboard", "_blank");
                                                    } else {
                                                        toast({
                                                            title: "Base URL Required",
                                                            description: "Please configure the WAHA Base URL first.",
                                                            variant: "destructive",
                                                        });
                                                    }
                                                }}
                                            >
                                                <ExternalLink size={13} /> Open Dashboard
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-8 text-center">
                                        <ShieldCheck size={36} className="text-slate-300 mb-3" />
                                        <p className="text-sm text-slate-500 font-medium">Dashboard credentials are disabled</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                                            Enable the toggle above if you want to store credentials for the WAHA dashboard
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* ── Quick Reference ── */}
                <Card className="border-slate-200 bg-slate-50/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                            <Info size={14} className="text-slate-500" />
                            Quick Reference
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Common API Endpoints</p>
                                <div className="space-y-1">
                                    {[
                                        { method: "GET", path: "/api/sessions", desc: "List sessions" },
                                        { method: "POST", path: "/api/sendText", desc: "Send message" },
                                        { method: "GET", path: "/api/sessions/:name/me", desc: "Session info" },
                                        { method: "POST", path: "/api/startSession", desc: "Start session" },
                                    ].map((ep) => (
                                        <div key={ep.path} className="flex items-center gap-2 text-xs">
                                            <Badge variant="outline" className={`font-mono text-[10px] px-1.5 py-0 ${ep.method === "GET" ? "text-blue-600 border-blue-200" : "text-green-600 border-green-200"
                                                }`}>
                                                {ep.method}
                                            </Badge>
                                            <code className="text-slate-600 font-mono">{ep.path}</code>
                                            <span className="text-slate-400">— {ep.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Useful Links</p>
                                <div className="space-y-1.5">
                                    {[
                                        { label: "WAHA Documentation", url: "https://waha.devlike.pro/docs/" },
                                        { label: "API Reference", url: "https://waha.devlike.pro/docs/how-to/send-messages/" },
                                        { label: "GitHub Repository", url: "https://github.com/devlikeapro/waha" },
                                    ].map((link) => (
                                        <a
                                            key={link.url}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                        >
                                            <ExternalLink size={11} />
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default WahaIntegration;
