import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Users,
  AlertCircle
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { toast } = useToast();
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!email.trim() || !password.trim()) {
      toast({ title: 'Missing fields', description: 'Please enter both email and password.' });
      return;
    }

    setIsLoading(true);

    const { error } = await login(email.trim(), password);

    if (error) {
      setIsLoading(false);
      setLoginError(error);
      toast({ title: 'Login failed', description: error, variant: 'destructive' });
      return;
    }

    toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
    setLocation('/');
  };

  const features = [
    { icon: Zap, title: 'Lightning Fast', description: 'Optimized for peak performance' },
    { icon: Shield, title: 'Enterprise Security', description: 'Bank-grade encryption & compliance' },
    { icon: Users, title: 'Team Collaboration', description: 'Seamless multi-user workflows' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-950 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full blur-3xl opacity-5" />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">EDU-ERP</h1>
              <p className="text-emerald-300 text-sm">Enterprise Resource Planning</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm">
                <Sparkles className="h-4 w-4" />
                Trusted by 500+ Organizations
              </div>
              <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
                Streamline Your<br />
                <span className="text-emerald-300">Business Operations</span>
              </h2>
              <p className="text-emerald-200 text-lg max-w-md">
                All-in-one platform for HR, Sales, Projects, Finance, and more.
                Built for modern enterprises.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors"
                >
                  <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-emerald-300 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-emerald-300 text-sm">
            © 2026 EDU-ERP. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50 relative overflow-hidden">
        {/* Background Lights */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-300/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-20 w-80 h-80 bg-emerald-400/25 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/3 w-72 h-72 bg-teal-300/20 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="h-12 w-12 rounded-xl bg-emerald-700 flex items-center justify-center">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">EDU-ERP</h1>
              <p className="text-slate-500 text-sm">Enterprise Resource Planning</p>
            </div>
          </div>

          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-slate-900">Welcome back</CardTitle>
              <CardDescription className="text-slate-500">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Error Banner */}
                {loginError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      className="pl-11 h-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-700 font-medium">
                      Password
                    </Label>
                    <a
                      href="/forgot-password"
                      className="text-sm text-emerald-800 hover:text-emerald-900 font-medium"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-11 pr-11 h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-slate-300 data-[state=checked]:bg-emerald-700 data-[state=checked]:border-emerald-700"
                  />
                  <Label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">
                    Remember me
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-base gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>

              </form>
            </CardContent>
          </Card>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-slate-500 text-sm">
            <Shield className="h-4 w-4" />
            <span>Protected by enterprise-grade security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
