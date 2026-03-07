import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      toast({ title: 'Email required', description: 'Please enter your email address.' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || 'Something went wrong. Please try again.';
        setErrorMsg(msg);
        toast({ title: 'Error', description: msg, variant: 'destructive' });
        return;
      }

      setSent(true);
      toast({
        title: 'Check your inbox',
        description: data.message || `If ${email} is registered, a reset link was sent.`,
      });
    } catch {
      setErrorMsg('Network error. Please try again.');
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      {/* soft lights behind - matching Login page ambient lights */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-10 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-20 w-80 h-80 bg-purple-400/25 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-72 h-72 bg-violet-300/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <Card className="shadow-lg p-8">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold">Forgot your password?</CardTitle>
            <CardDescription className="text-slate-500">Enter your email and we'll send a reset link.</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <p className="text-slate-700 font-medium">Reset link sent!</p>
                <p className="text-slate-500 text-sm max-w-sm">
                  If <strong>{email}</strong> is registered, you'll receive an email with a link to reset your password. Check your spam folder if you don't see it.
                </p>
                <a href="/login" className="text-sm text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-2 mt-2">
                  <ArrowLeft className="h-4 w-4" /> Back to sign in
                </a>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="fp-email" className="text-sm text-slate-700">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input id="fp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-14" placeholder="name@company.com" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <a href="/login" className="text-sm text-slate-600 hover:text-slate-800 inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to sign in
                  </a>
                  <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white" disabled={loading}>
                    {loading ? 'Sending...' : 'Send reset link'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
