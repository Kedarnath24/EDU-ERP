import { useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import {
    ChevronLeft,
    Save,
    Users,
    UserPlus,
    Shield,
    Pencil,
    Trash2,
    Crown,
    Eye,
    CheckCircle2,
    XCircle,
    Mail,
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createTeamMember } from "@/lib/api";

type Role = "admin" | "manager" | "member" | "viewer";

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: "active" | "invited" | "inactive";
    initials: string;
    color: string;
    lastActive: string;
}

const roleColors: Record<Role, string> = {
    admin: "bg-red-100 text-red-700 border-red-200",
    manager: "bg-blue-100 text-blue-700 border-blue-200",
    member: "bg-green-100 text-green-700 border-green-200",
    viewer: "bg-slate-100 text-slate-600 border-slate-200",
};

const roleIcons: Record<Role, React.ElementType> = {
    admin: Crown,
    manager: Shield,
    member: Users,
    viewer: Eye,
};

const rolePermissions: Record<Role, { label: string; allowed: boolean }[]> = {
    admin: [
        { label: "Manage billing & plans", allowed: true },
        { label: "Manage team members", allowed: true },
        { label: "Access all modules", allowed: true },
        { label: "Change settings", allowed: true },
        { label: "Export data", allowed: true },
        { label: "Delete records", allowed: true },
    ],
    manager: [
        { label: "Manage billing & plans", allowed: false },
        { label: "Manage team members", allowed: true },
        { label: "Access all modules", allowed: true },
        { label: "Change settings", allowed: true },
        { label: "Export data", allowed: true },
        { label: "Delete records", allowed: true },
    ],
    member: [
        { label: "Manage billing & plans", allowed: false },
        { label: "Manage team members", allowed: false },
        { label: "Access all modules", allowed: true },
        { label: "Change settings", allowed: false },
        { label: "Export data", allowed: true },
        { label: "Delete records", allowed: false },
    ],
    viewer: [
        { label: "Manage billing & plans", allowed: false },
        { label: "Manage team members", allowed: false },
        { label: "Access all modules", allowed: false },
        { label: "Change settings", allowed: false },
        { label: "Export data", allowed: false },
        { label: "Delete records", allowed: false },
    ],
};

const initialMembers: TeamMember[] = [
    { id: "1", name: "Ragini Shah", email: "ragini@zerp.io", role: "admin", status: "active", initials: "RS", color: "bg-purple-500", lastActive: "Now" },
    { id: "2", name: "Kedar Patil", email: "kedar@zerp.io", role: "manager", status: "active", initials: "KP", color: "bg-blue-500", lastActive: "2 hours ago" },
    { id: "3", name: "Anjali Mehta", email: "anjali@zerp.io", role: "member", status: "active", initials: "AM", color: "bg-emerald-500", lastActive: "1 day ago" },
    { id: "4", name: "Sameer Joshi", email: "sameer@zerp.io", role: "viewer", status: "invited", initials: "SJ", color: "bg-amber-500", lastActive: "—" },
];

const TeamPermissionsSettings = () => {
    const { toast } = useToast();
    const [members, setMembers] = useState<TeamMember[]>(initialMembers);
    const [selectedRole, setSelectedRole] = useState<Role>("member");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<Role>("member");
    const [invitePassword, setInvitePassword] = useState("");
    const [inviteConfirmPassword, setInviteConfirmPassword] = useState("");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [previewRole, setPreviewRole] = useState<Role>("member");

    const handleRoleChange = (id: string, newRole: Role) => {
        setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
        toast({ title: "Role updated", description: "The member's role has been changed." });
    };

    const handleRemoveMember = (id: string) => {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        toast({ title: "Member removed", description: "The member has been removed from the workspace." });
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) {
            toast({ title: "Email required", description: "Please enter an email address.", variant: "destructive" });
            return;
        }
        if (!invitePassword || !inviteConfirmPassword) {
            toast({ title: "Password required", description: "Please provide a password and confirmation.", variant: "destructive" });
            return;
        }
        if (invitePassword.length < 8) {
            toast({ title: "Weak password", description: "Password must be at least 8 characters.", variant: "destructive" });
            return;
        }
        if (invitePassword !== inviteConfirmPassword) {
            toast({ title: "Password mismatch", description: "Password and confirmation do not match.", variant: "destructive" });
            return;
        }

        setInviteLoading(true);
        const { data, error } = await createTeamMember({
            email: inviteEmail,
            password: invitePassword,
            role: inviteRole,
            full_name: inviteEmail.split("@")[0],
        });
        setInviteLoading(false);

        if (error) {
            toast({ title: "Failed to create member", description: typeof error === "string" ? error : "An unexpected error occurred.", variant: "destructive" });
            return;
        }

        const initials = inviteEmail.slice(0, 2).toUpperCase();
        const colors = ["bg-indigo-500", "bg-pink-500", "bg-teal-500", "bg-orange-500"];
        const color = colors[members.length % colors.length];
        setMembers((prev) => [
            ...prev,
            {
                id: data!.user.id,
                name: data!.employee?.full_name || inviteEmail.split("@")[0],
                email: inviteEmail,
                role: inviteRole,
                status: "active",
                initials,
                color,
                lastActive: "—",
            },
        ]);
        toast({ title: "Member created", description: `${inviteEmail} has been added to the workspace.` });
        setInviteEmail("");
        setInvitePassword("");
        setInviteConfirmPassword("");
    };

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
                    <span className="text-sm font-medium text-slate-700">Team & Permissions</span>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Team & Permissions</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage team members, assign roles, and configure access permissions.
                    </p>
                </div>

                {/* Invite Member */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <UserPlus size={18} className="text-indigo-600" />
                            <CardTitle className="text-base">Invite Team Member</CardTitle>
                        </div>
                        <CardDescription>Send an email invitation for someone to join this workspace.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 space-y-1.5">
                                    <Label htmlFor="invite-email">Email Address</Label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="invite-email"
                                            placeholder="colleague@company.com"
                                            className="pl-9"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && void handleInvite()}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Role</Label>
                                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                                        <SelectTrigger className="w-36">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                            <SelectItem value="member">Member</SelectItem>
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 sm:ml-auto">
                                    <Label className="opacity-0 select-none">Send</Label>
                                    <Button onClick={() => void handleInvite()} disabled={inviteLoading} className="bg-indigo-600 hover:bg-indigo-700 gap-2 w-full sm:w-auto">
                                        <UserPlus size={16} /> {inviteLoading ? "Creating…" : "Send Invite"}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 space-y-1.5">
                                    <Label htmlFor="invite-password">Password</Label>
                                    <Input
                                        id="invite-password"
                                        type="password"
                                        placeholder="Set password"
                                        value={invitePassword}
                                        onChange={(e) => setInvitePassword(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <Label htmlFor="invite-confirm">Confirm</Label>
                                    <Input
                                        id="invite-confirm"
                                        type="password"
                                        placeholder="Confirm password"
                                        value={inviteConfirmPassword}
                                        onChange={(e) => setInviteConfirmPassword(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && void handleInvite()}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Members Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-blue-600" />
                            <CardTitle className="text-base">Team Members</CardTitle>
                        </div>
                        <CardDescription>{members.length} members in this workspace.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {members.map((member) => {
                                const RoleIcon = roleIcons[member.role];
                                return (
                                    <div
                                        key={member.id}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar className="h-9 w-9 shrink-0">
                                                <AvatarFallback className={`${member.color} text-white text-xs font-semibold`}>
                                                    {member.initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-semibold text-slate-800 truncate">{member.name}</p>
                                                    {member.status === "invited" && (
                                                        <Badge variant="outline" className="text-xs border-amber-200 text-amber-600 bg-amber-50">
                                                            Invited
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 truncate">{member.email} · Last active: {member.lastActive}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-12 sm:ml-0 shrink-0">
                                            <Badge variant="outline" className={`text-xs gap-1 ${roleColors[member.role]}`}>
                                                <RoleIcon size={11} />
                                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                            </Badge>
                                            <Select
                                                value={member.role}
                                                onValueChange={(v) => handleRoleChange(member.id, v as Role)}
                                            >
                                                <SelectTrigger className="h-8 w-28 text-xs border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="manager">Manager</SelectItem>
                                                    <SelectItem value="member">Member</SelectItem>
                                                    <SelectItem value="viewer">Viewer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleRemoveMember(member.id)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Role Permissions Preview */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Shield size={18} className="text-teal-600" />
                                    <CardTitle className="text-base">Role Permissions</CardTitle>
                                </div>
                                <CardDescription className="mt-1">Review what each role is allowed to do.</CardDescription>
                            </div>
                            <Select value={previewRole} onValueChange={(v) => setPreviewRole(v as Role)}>
                                <SelectTrigger className="w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {rolePermissions[previewRole].map((perm) => (
                                <div key={perm.label} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                                    {perm.allowed ? (
                                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                    ) : (
                                        <XCircle size={16} className="text-slate-300 shrink-0" />
                                    )}
                                    <span className={`text-sm ${perm.allowed ? "text-slate-800" : "text-slate-400"}`}>
                                        {perm.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default TeamPermissionsSettings;
