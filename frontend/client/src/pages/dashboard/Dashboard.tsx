/**
 * pages/dashboard/Dashboard.tsx
 *
 * Main app dashboard — overview of the entire platform.
 *
 * Backend data (via api.ts callbacks):
 *   • getDashboardStats()  → active employees, leave request summary
 *
 * Mock data (CRM has no backend yet):
 *   • Total Leads
 *   • Leads Achieved / Closed-Won leads
 *   • Lead pipeline breakdown
 */

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import {
    Users,
    UserCheck,
    Target,
    Award,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    RefreshCw,
    BarChart3,
    Briefcase,
    Loader2,
    AlertCircle,
    Sparkles,
    Activity,
    Building2,
    ChevronRight,
} from 'lucide-react';
import { getDashboardStats, DashboardStats } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Mock CRM Leads data (no backend yet) ─────────────────────────────────
const MOCK_LEADS = {
    total: 148,
    achieved: 37,          // closed-won
    inProgress: 52,        // active pipeline
    lost: 22,
    newThisMonth: 29,
    conversionRate: 24.9,  // achieved / (achieved + lost) approx
    pipeline: [
        { stage: 'New Lead', count: 29, color: 'bg-slate-400', bar: 'bg-slate-500' },
        { stage: 'Interested', count: 24, color: 'bg-blue-400', bar: 'bg-blue-500' },
        { stage: 'Follow-up', count: 18, color: 'bg-indigo-400', bar: 'bg-indigo-500' },
        { stage: 'Counselling', count: 10, color: 'bg-violet-400', bar: 'bg-violet-500' },
        { stage: 'Admission Done', count: 37, color: 'bg-emerald-400', bar: 'bg-emerald-500' },
        { stage: 'Lost', count: 22, color: 'bg-rose-400', bar: 'bg-rose-500' },
    ],
};

// ─── Types ────────────────────────────────────────────────────────────────
interface StatCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    gradient: string;
    trend?: { value: string; positive: boolean };
    loading?: boolean;
    onClick?: () => void;
}

// ─── Stat Card Component ──────────────────────────────────────────────────
function StatCard({
    title, value, subValue, icon: Icon, iconBg, iconColor, gradient,
    trend, loading, onClick,
}: StatCardProps) {
    return (
        <Card
            className={cn(
                'relative overflow-hidden border-slate-200 shadow-sm transition-all duration-300 group',
                onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''
            )}
            onClick={onClick}
        >
            {/* Hover gradient layer */}
            <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br',
                gradient
            )} />

            <CardContent className="p-5 md:p-6 relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn('p-3 rounded-2xl shadow-sm transition-transform group-hover:scale-110 duration-300', iconBg)}>
                        <Icon className={cn('h-5 w-5', iconColor)} />
                    </div>
                    {trend && (
                        <div className={cn(
                            'flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg',
                            trend.positive
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                        )}>
                            {trend.positive
                                ? <TrendingUp className="h-3 w-3" />
                                : <TrendingDown className="h-3 w-3" />
                            }
                            {trend.value}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
                    {loading ? (
                        <div className="flex items-center gap-2 py-1">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            <span className="text-slate-400 text-sm">Loading…</span>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-3xl font-black text-slate-900">{value}</h3>
                            {subValue && (
                                <p className="text-xs font-medium text-slate-500">{subValue}</p>
                            )}
                        </>
                    )}
                </div>

                {onClick && (
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Leave Badge ─────────────────────────────────────────────────────────
function LeaveBadge({ status }: { status: string }) {
    const cfg: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700 border-amber-200',
        approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        rejected: 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return (
        <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
            cfg[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
        )}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────
export default function Dashboard() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error: err } = await getDashboardStats();
        if (err) {
            setError(err);
            toast({ title: 'Error loading dashboard', description: err, variant: 'destructive' });
        } else if (data) {
            setStats(data);
        }
        setLoading(false);
        setLastRefreshed(new Date());
    }, [toast]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    // ── Derived numbers ──────────────────────────────────────────────────
    const activeEmployees = stats?.employees.active ?? 0;
    const totalEmployees = stats?.employees.total ?? 0;
    const pendingLeave = stats?.leave_requests.pending ?? 0;
    const approvedLeave = stats?.leave_requests.approved ?? 0;
    const rejectedLeave = stats?.leave_requests.rejected ?? 0;
    const totalLeave = stats?.leave_requests.total ?? 0;

    const maxPipelineCount = Math.max(...MOCK_LEADS.pipeline.map(p => p.count), 1);

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                                Overview
                            </span>
                            <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard</h1>
                        <p className="text-slate-500 font-medium mt-1">
                            Real-time snapshot of your organisation's performance
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <p className="text-xs text-slate-400 hidden sm:block">
                            Last updated: {lastRefreshed.toLocaleTimeString()}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchStats}
                            disabled={loading}
                            className="rounded-xl font-bold gap-2"
                        >
                            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* ── Error banner ───────────────────────────────────── */}
                {error && (
                    <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-rose-700 text-sm font-medium">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error} — Some figures below may be unavailable. Please refresh.
                    </div>
                )}

                {/* ── KPI Grid ───────────────────────────────────────── */}
                <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {/* 1 — Total Leads (mock) */}
                    <StatCard
                        title="Total Leads"
                        value={MOCK_LEADS.total}
                        subValue={`+${MOCK_LEADS.newThisMonth} this month`}
                        icon={Target}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                        gradient="from-blue-500/10 to-indigo-500/10"
                        trend={{ value: '+24%', positive: true }}
                        onClick={() => setLocation('/leads')}
                    />

                    {/* 2 — Leads Achieved (mock) */}
                    <StatCard
                        title="Leads Achieved"
                        value={MOCK_LEADS.achieved}
                        subValue={`${MOCK_LEADS.conversionRate}% conversion rate`}
                        icon={Award}
                        iconBg="bg-emerald-50"
                        iconColor="text-emerald-600"
                        gradient="from-emerald-500/10 to-teal-500/10"
                        trend={{ value: '+8%', positive: true }}
                        onClick={() => setLocation('/leads')}
                    />

                    {/* 3 — Pending Leave Requests (backend) */}
                    <StatCard
                        title="Leave Requests"
                        value={loading ? '—' : totalLeave}
                        subValue={loading ? undefined : `${pendingLeave} pending · ${approvedLeave} approved`}
                        icon={Calendar}
                        iconBg="bg-amber-50"
                        iconColor="text-amber-600"
                        gradient="from-amber-500/10 to-orange-500/10"
                        trend={rejectedLeave > 0
                            ? { value: `${rejectedLeave} rejected`, positive: false }
                            : undefined
                        }
                        loading={loading}
                        onClick={() => setLocation('/hrm/attendance')}
                    />

                    {/* 4 — Active Employees (backend) */}
                    <StatCard
                        title="Active Employees"
                        value={loading ? '—' : activeEmployees}
                        subValue={loading ? undefined : `out of ${totalEmployees} total`}
                        icon={UserCheck}
                        iconBg="bg-violet-50"
                        iconColor="text-violet-600"
                        gradient="from-violet-500/10 to-purple-500/10"
                        trend={totalEmployees > 0
                            ? { value: `${Math.round((activeEmployees / totalEmployees) * 100)}% active`, positive: true }
                            : undefined
                        }
                        loading={loading}
                        onClick={() => setLocation('/hrm/employees')}
                    />
                </div>

                {/* ── Two-column content area ────────────────────────── */}
                <div className="grid gap-6 lg:grid-cols-3">

                    {/* CRM Lead Pipeline  — 2/3 width */}
                    <Card className="lg:col-span-2 border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-indigo-500" />
                                        CRM Lead Pipeline
                                    </CardTitle>
                                    <CardDescription className="text-slate-500 mt-0.5">
                                        Stage-by-stage breakdown · mock data (backend not yet implemented)
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-indigo-600 font-bold rounded-xl gap-1"
                                    onClick={() => setLocation('/leads')}
                                >
                                    View CRM <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2 space-y-3">
                            {MOCK_LEADS.pipeline.map((stage) => (
                                <div key={stage.stage} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={cn('h-2.5 w-2.5 rounded-full', stage.color)} />
                                            <span className="font-semibold text-slate-700">{stage.stage}</span>
                                        </div>
                                        <span className="font-black text-slate-900">{stage.count}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn('h-full rounded-full transition-all duration-700', stage.bar)}
                                            style={{ width: `${(stage.count / maxPipelineCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Summary row */}
                            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 mt-2">
                                {[
                                    { label: 'In Progress', value: MOCK_LEADS.inProgress, color: 'text-blue-600' },
                                    { label: 'Won', value: MOCK_LEADS.achieved, color: 'text-emerald-600' },
                                    { label: 'Lost', value: MOCK_LEADS.lost, color: 'text-rose-600' },
                                ].map(item => (
                                    <div key={item.label} className="text-center bg-slate-50 rounded-xl py-3">
                                        <div className={cn('text-2xl font-black', item.color)}>{item.value}</div>
                                        <div className="text-xs font-semibold text-slate-500 mt-0.5">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Leave Requests breakdown — 1/3 width */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-amber-500" />
                                        Leave Requests
                                    </CardTitle>
                                    <CardDescription className="text-slate-500 mt-0.5">
                                        Live from backend
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-amber-600 font-bold rounded-xl gap-1"
                                    onClick={() => setLocation('/hrm/attendance')}
                                >
                                    View <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {loading ? (
                                <div className="flex items-center justify-center h-40">
                                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Donut-style visual */}
                                    {totalLeave > 0 && (
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                            <div
                                                className="h-full bg-amber-400 transition-all duration-700"
                                                style={{ width: `${(pendingLeave / totalLeave) * 100}%` }}
                                            />
                                            <div
                                                className="h-full bg-emerald-400 transition-all duration-700"
                                                style={{ width: `${(approvedLeave / totalLeave) * 100}%` }}
                                            />
                                            <div
                                                className="h-full bg-rose-400 transition-all duration-700"
                                                style={{ width: `${(rejectedLeave / totalLeave) * 100}%` }}
                                            />
                                        </div>
                                    )}

                                    {/* Status rows */}
                                    {[
                                        { icon: Clock, label: 'Pending', value: pendingLeave, badge: 'pending' },
                                        { icon: CheckCircle2, label: 'Approved', value: approvedLeave, badge: 'approved' },
                                        { icon: XCircle, label: 'Rejected', value: rejectedLeave, badge: 'rejected' },
                                    ].map(({ icon: Icon, label, value, badge }) => (
                                        <div
                                            key={label}
                                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className="h-4 w-4 text-slate-400" />
                                                <span className="text-sm font-semibold text-slate-700">{label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-black text-slate-900">{value}</span>
                                                <LeaveBadge status={badge} />
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white mt-1">
                                        <span className="text-sm font-bold text-slate-700">Total</span>
                                        <span className="text-2xl font-black text-slate-900">{totalLeave}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Employee & Module Quick Links ──────────────────── */}
                <div className="grid gap-6 md:grid-cols-2">

                    {/* Employee status breakdown */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <Users className="h-5 w-5 text-violet-500" />
                                    Employee Status
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-violet-600 font-bold rounded-xl gap-1"
                                    onClick={() => setLocation('/hrm/employees')}
                                >
                                    Directory <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Active', value: activeEmployees, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                                        { label: 'On Leave', value: stats?.employees.on_leave ?? 0, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                                        { label: 'Inactive', value: stats?.employees.inactive ?? 0, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
                                        { label: 'Total', value: totalEmployees, bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
                                    ].map(item => (
                                        <div key={item.label} className={cn('flex flex-col items-center justify-center p-4 rounded-2xl border', item.bg, item.border)}>
                                            <span className={cn('text-3xl font-black', item.text)}>{item.value}</span>
                                            <span className={cn('text-xs font-semibold mt-1', item.text, 'opacity-70')}>{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick links to all modules */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <Activity className="h-5 w-5 text-indigo-500" />
                                Quick Access
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'CRM / Leads', route: '/leads', icon: Target, bg: 'bg-blue-50', text: 'text-blue-700' },
                                    { label: 'HR Management', route: '/hrm', icon: Briefcase, bg: 'bg-indigo-50', text: 'text-indigo-700' },
                                    { label: 'Recruitment', route: '/recruitment', icon: UserCheck, bg: 'bg-teal-50', text: 'text-teal-700' },
                                    { label: 'Attendance', route: '/attendance', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700' },
                                    { label: 'Employees', route: '/hrm/employees', icon: Users, bg: 'bg-violet-50', text: 'text-violet-700' },
                                    { label: 'Organisation', route: '/settings/organization', icon: Building2, bg: 'bg-rose-50', text: 'text-rose-700' },
                                ].map(item => (
                                    <button
                                        key={item.route}
                                        onClick={() => setLocation(item.route)}
                                        className={cn(
                                            'flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-105 active:scale-95 group',
                                            item.bg
                                        )}
                                    >
                                        <item.icon className={cn('h-4 w-4 shrink-0', item.text)} />
                                        <span className={cn('text-sm font-bold leading-tight', item.text)}>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </DashboardLayout>
    );
}
