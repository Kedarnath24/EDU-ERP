import ErrorBoundary from "@/components/ErrorBoundary";
import TopProgressBar from "@/components/TopProgressBar";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

// Dashboard Module
import Dashboard from "@/pages/dashboard/Dashboard";

// HRM Module Pages
import HRMDashboard from "@/pages/hrm/hrm-dashboard";
import HRMEmployees from "@/pages/hrm/hrm-employees";
import HRMAttendance from "@/pages/hrm/hrm-attendance";
import HRMPayroll from "@/pages/hrm/hrm-payroll";
import HRMInsurance from "@/pages/hrm/hrm-insurance";
import HRMAssets from "@/pages/hrm/hrm-assets";
import HRMPerformance from "@/pages/hrm/hrm-performance";


import HRMAutomation from "@/pages/hrm/hrm-automation";
import HRMWorkflows from "@/pages/hrm/hrm-workflows";

// Recruitment Module Pages
import RecruitmentDashboard from "@/pages/recruitment/recruitment-dashboard";

// Profile Module Pages
import EmployeeProfile from "@/pages/profile/EmployeeProfile";

// Settings Pages
import SettingsDashboard from "@/pages/settings/SettingsDashboard";
import GeneralSettings from "@/pages/settings/GeneralSettings";
import AppearanceSettings from "@/pages/settings/AppearanceSettings";
import NotificationsSettings from "@/pages/settings/NotificationsSettings";
import DataBackupSettings from "@/pages/settings/DataBackupSettings";
import EmailTemplatesSettings from "@/pages/settings/EmailTemplatesSettings";
import ApiKeysSettings from "@/pages/settings/ApiKeysSettings";
import IntegrationsSettings from "@/pages/settings/IntegrationsSettings";
import WahaIntegration from "@/pages/settings/WahaIntegration";
import SecuritySettings from "@/pages/settings/SecuritySettings";
import TeamPermissionsSettings from "@/pages/settings/TeamPermissionsSettings";
import OrganizationSettings from "@/pages/settings/OrganizationSettings";

// Attendance Module
import AttendanceDashboard from "@/pages/attendance/AttendanceDashboard";

// Lead Management Pages
import LeadsWorkflow from "@/pages/leads/index";
import LeadStatus from "@/pages/leads/lead-status";
import LeadStatusNew from "@/pages/leads/lead-status-new";
import LeadNotes from "@/pages/leads/notes";
import LeadCommunication from "@/pages/leads/communication";
import LeadAssign from "@/pages/leads/assign";
import LeadCallStatus from "@/pages/leads/call-status";
import LeadProposals from "@/pages/leads/proposals";
import BulkImport from "@/pages/leads/bulk-import";

// Auth Pages
import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

function AppRouter() {
  const { session, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // If we're not landing on an auth page and there's no session, redirect to login
    if (!loading && !session && location !== "/login" && location !== "/forgot-password") {
      setLocation("/login");
    }
    // If we are on an auth page but already have a session, redirect to home
    if (!loading && session && (location === "/login" || location === "/forgot-password")) {
      setLocation("/");
    }
  }, [session, loading, location, setLocation]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-12 w-12 border-4 border-purple-900/30 border-t-purple-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />

      {/* Default root → Dashboard */}
      <Route path="/">
        {!session ? <Login /> : <Dashboard />}
      </Route>

      {/* HRM Module Routes */}
      <Route path="/hrm/employees" component={HRMEmployees} />
      <Route path="/hrm/attendance" component={HRMAttendance} />
      <Route path="/hrm/payroll" component={HRMPayroll} />
      <Route path="/hrm/insurance" component={HRMInsurance} />
      <Route path="/hrm/assets" component={HRMAssets} />
      <Route path="/hrm/performance" component={HRMPerformance} />
      {/* Removed HRM Letters (deleted) and Travel Expense routes */}
      <Route path="/hrm/automation" component={HRMAutomation} />
      <Route path="/hrm/workflows" component={HRMWorkflows} />
      <Route path="/hrm/*" component={HRMDashboard} />
      <Route path="/hrm" component={HRMDashboard} />

      {/* Recruitment Module Routes */}
      <Route path="/recruitment/*" component={RecruitmentDashboard} />
      <Route path="/recruitment" component={RecruitmentDashboard} />

      {/* Profile Module */}
      <Route path="/profile/*" component={EmployeeProfile} />
      <Route path="/profile" component={EmployeeProfile} />

      {/* Settings Module */}
      <Route path="/settings/general" component={GeneralSettings} />
      <Route path="/settings/appearance" component={AppearanceSettings} />
      <Route path="/settings/notifications" component={NotificationsSettings} />
      <Route path="/settings/security" component={SecuritySettings} />
      <Route path="/settings/team" component={TeamPermissionsSettings} />
      <Route path="/settings/organization" component={OrganizationSettings} />
      <Route path="/settings/data" component={DataBackupSettings} />
      <Route path="/settings/email-templates" component={EmailTemplatesSettings} />
      <Route path="/settings/api-keys" component={ApiKeysSettings} />
      <Route path="/settings/integrations/waha" component={WahaIntegration} />
      <Route path="/settings/integrations" component={IntegrationsSettings} />
      <Route path="/settings/*" component={SettingsDashboard} />
      <Route path="/settings" component={SettingsDashboard} />

      {/* Attendance Module */}
      <Route path="/attendance/*" component={AttendanceDashboard} />
      <Route path="/attendance" component={AttendanceDashboard} />

      {/* Leads & Workflow Module */}
      <Route path="/leads/notes" component={LeadNotes} />
      <Route path="/leads/communication" component={LeadCommunication} />
      <Route path="/leads/lead-status-new" component={LeadStatusNew} />
      <Route path="/leads/lead-status" component={LeadStatus} />
      <Route path="/leads/assign" component={LeadAssign} />
      <Route path="/leads/call-status" component={LeadCallStatus} />
      <Route path="/leads/proposals" component={LeadProposals} />
      <Route path="/leads/bulk-import" component={BulkImport} />
      <Route path="/leads/*" component={LeadsWorkflow} />
      <Route path="/leads" component={LeadsWorkflow} />

      {/* Dashboard Module */}
      <Route path="/dashboard" component={Dashboard} />

      {/* Fallback */}
      <Route component={Dashboard} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global Error:", {
        message: event.message,
        error: event.error,
        location: `${event.filename}:${event.lineno}:${event.colno}`
      });
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled Promise Rejection:", event.reason);
      event.preventDefault();
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <NotificationProvider>
            <TooltipProvider>
              <ErrorBoundary>
                <Toaster />
                <AppRouter />
              </ErrorBoundary>
            </TooltipProvider>
          </NotificationProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
