import { useState, useRef } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import {
    ChevronLeft,
    Save,
    Building2,
    Upload,
    Globe,
    Phone,
    MapPin,
    Mail,
    Linkedin,
    Twitter,
    Facebook,
    X,
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
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const INDUSTRIES = [
    "Technology",
    "Healthcare",
    "Finance & Banking",
    "Education",
    "Real Estate",
    "Retail & E-Commerce",
    "Manufacturing",
    "Logistics & Supply Chain",
    "Consulting",
    "Media & Entertainment",
    "Construction",
    "Other",
];

const COMPANY_SIZES = [
    "1–10 (Startup)",
    "11–50 (Small)",
    "51–200 (Medium)",
    "201–500 (Growing)",
    "501–1000 (Large)",
    "1000+ (Enterprise)",
];

const OrganizationSettings = () => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Company Profile
    const [companyName, setCompanyName] = useState("EDU-ERP Inc.");
    const [companyTagline, setCompanyTagline] = useState("Powering next-gen enterprise workflows.");
    const [industry, setIndustry] = useState("Technology");
    const [companySize, setCompanySize] = useState("11–50 (Small)");
    const [founded, setFounded] = useState("2023");
    const [website, setWebsite] = useState("https://edu-erp.io");
    const [description, setDescription] = useState("EDU-ERP is a modern enterprise resource planning platform designed for growing businesses. We help teams streamline HR, CRM, and operations in one place.");

    // Logo
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Contact
    const [email, setEmail] = useState("contact@edu-erp.io");
    const [phone, setPhone] = useState("+91 98765 43210");
    const [address, setAddress] = useState("Level 12, Prestige Tower, Bandra Kurla Complex");
    const [city, setCity] = useState("Mumbai");
    const [state, setState] = useState("Maharashtra");
    const [country, setCountry] = useState("India");
    const [postalCode, setPostalCode] = useState("400051");

    // Social
    const [linkedin, setLinkedin] = useState("https://linkedin.com/company/zerp");
    const [twitter, setTwitter] = useState("https://twitter.com/zerp_io");
    const [facebook, setFacebook] = useState("");

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "File too large", description: "Please upload an image under 2 MB.", variant: "destructive" });
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setLogoPreview(result);
            // Persist to localStorage for DashboardLayout to pick up
            const orgSettings = { logo: result };
            localStorage.setItem("zervos_organization_settings", JSON.stringify(orgSettings));
            window.dispatchEvent(new CustomEvent("organization-settings-updated", { detail: orgSettings }));
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setLogoPreview(null);
        localStorage.removeItem("zervos_organization_settings");
        window.dispatchEvent(new CustomEvent("organization-settings-updated", { detail: {} }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = () => {
        toast({
            title: "Organization settings saved",
            description: "Your company profile has been updated successfully.",
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
                    <span className="text-sm font-medium text-slate-700">Organization</span>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Organization</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage your company profile, branding, and contact information.
                    </p>
                </div>

                {/* Company Logo */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Building2 size={18} className="text-orange-600" />
                            <CardTitle className="text-base">Company Logo</CardTitle>
                        </div>
                        <CardDescription>Upload your company logo. It will appear in the sidebar and reports. PNG or SVG, max 2 MB.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-5">
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden shrink-0">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                                ) : (
                                    <Building2 size={28} className="text-slate-300" />
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={14} /> Upload Logo
                                </Button>
                                {logoPreview && (
                                    <Button variant="ghost" size="sm" className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleRemoveLogo}>
                                        <X size={14} /> Remove
                                    </Button>
                                )}
                                <p className="text-xs text-slate-400">Recommended: 256×256 px, transparent background.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Company Profile */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Company Profile</CardTitle>
                        <CardDescription>Basic information about your organization.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="company-name">Company Name</Label>
                                <Input
                                    id="company-name"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Acme Inc."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="company-tagline">Tagline</Label>
                                <Input
                                    id="company-tagline"
                                    value={companyTagline}
                                    onChange={(e) => setCompanyTagline(e.target.value)}
                                    placeholder="Short company tagline"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Industry</Label>
                                <Select value={industry} onValueChange={setIndustry}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {INDUSTRIES.map((ind) => (
                                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Company Size</Label>
                                <Select value={companySize} onValueChange={setCompanySize}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COMPANY_SIZES.map((size) => (
                                            <SelectItem key={size} value={size}>{size}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="founded">Year Founded</Label>
                                <Input
                                    id="founded"
                                    value={founded}
                                    onChange={(e) => setFounded(e.target.value)}
                                    placeholder="2020"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="website">Website</Label>
                                <div className="relative">
                                    <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="website"
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        placeholder="https://yourcompany.com"
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="description">Company Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe what your company does..."
                                className="resize-none"
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Contact Information</CardTitle>
                        <CardDescription>Primary contact details for your organization.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="contact-email">Contact Email</Label>
                                <div className="relative">
                                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="contact-email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="contact@company.com"
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="contact-phone">Phone Number</Label>
                                <div className="relative">
                                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="contact-phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+91 98765 43210"
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-1.5">
                            <Label htmlFor="address">Street Address</Label>
                            <div className="relative">
                                <MapPin size={15} className="absolute left-3 top-3 text-slate-400" />
                                <Input
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="123 Main Street, Suite 400"
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="state">State</Label>
                                <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="country">Country</Label>
                                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="postal">Postal Code</Label>
                                <Input id="postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="000000" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Social Media */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Social Media</CardTitle>
                        <CardDescription>Add links to your company's social profiles.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: "LinkedIn", icon: Linkedin, value: linkedin, setter: setLinkedin, placeholder: "https://linkedin.com/company/..." },
                            { label: "Twitter / X", icon: Twitter, value: twitter, setter: setTwitter, placeholder: "https://twitter.com/..." },
                            { label: "Facebook", icon: Facebook, value: facebook, setter: setFacebook, placeholder: "https://facebook.com/..." },
                        ].map((social) => (
                            <div key={social.label} className="space-y-1.5">
                                <Label>{social.label}</Label>
                                <div className="relative">
                                    <social.icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={social.value}
                                        onChange={(e) => social.setter(e.target.value)}
                                        placeholder={social.placeholder}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        ))}
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

export default OrganizationSettings;
