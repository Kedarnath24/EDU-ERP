import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LogIn,
  LogOut,
  Coffee,
  CheckCircle,
  Clock,
  MapPin,
  Home,
  Building2,
  Briefcase,
  Wifi,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  checkIn,
  checkOut,
  startBreak,
  endBreak,
  getTodayAttendance,
  type AttendanceRecord,
} from "@/lib/api";

type WorkLocation = "office" | "remote" | "home" | "field";

const locationMap: Record<WorkLocation, { label: string; icon: React.ElementType; apiMode: "office" | "remote" | "hybrid" | "onsite"; locationLabel: string }> = {
  office: { label: "Office", icon: Building2, apiMode: "office", locationLabel: "Office" },
  home: { label: "Work From Home", icon: Home, apiMode: "remote", locationLabel: "Work from Home" },
  remote: { label: "Remote", icon: Wifi, apiMode: "hybrid", locationLabel: "Remote" },
  field: { label: "Field Work", icon: Briefcase, apiMode: "onsite", locationLabel: "Field / Client" },
};

const breakTypes = [
  { value: "lunch", label: "Lunch Break", duration: 60 },
  { value: "tea", label: "Tea Break", duration: 15 },
  { value: "short", label: "Short Break", duration: 10 },
  { value: "meeting", label: "Meeting Break", duration: 30 },
  { value: "other", label: "Other", duration: 0 },
];

/** Format a UTC ISO time-string → HH:MM AM/PM local */
function fmt(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** HH:MM:SS elapsed timer */
function formatHMS(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

type DialogStatus = "not-checked-in" | "checked-in" | "on-break" | "checked-out";

export default function AttendanceTracker({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  // ── Remote state (from API) ───────────────────────────────
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);

  // ── Form fields ──────────────────────────────────────────
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation>("office");
  const [checkInNote, setCheckInNote] = useState("");
  const [checkOutNote, setCheckOutNote] = useState("");
  const [selectedBreakType, setSelectedBreakType] = useState("lunch");
  const [actionLoading, setActionLoading] = useState(false);

  // ── Timer ────────────────────────────────────────────────
  const [elapsedWork, setElapsedWork] = useState(0);  // seconds
  const [elapsedBreak, setElapsedBreak] = useState(0); // seconds

  // ── Derived status ────────────────────────────────────────
  const isCheckedIn = !!record?.check_in_time && !record?.check_out_time;
  const isOnBreak = isCheckedIn && !!record?.break_start_time && !record?.break_end_time;
  const isCheckedOut = !!record?.check_out_time;

  const dialogStatus: DialogStatus = isOnBreak
    ? "on-break"
    : isCheckedIn
      ? "checked-in"
      : isCheckedOut
        ? "checked-out"
        : "not-checked-in";

  // ── Fetch today's record when dialog opens ───────────────
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoadingRecord(true);
      const { data } = await getTodayAttendance();
      setRecord(data || null);
      setLoadingRecord(false);
    };
    load();
  }, [open]);

  // ── Elapsed work timer ────────────────────────────────────
  useEffect(() => {
    if (!isCheckedIn || !record?.check_in_time) return;
    const tick = () => {
      const totalMs = Date.now() - new Date(record.check_in_time!).getTime();
      const breakMs = (record.total_break_minutes || 0) * 60 * 1000;
      const currentBreakMs = isOnBreak && record.break_start_time
        ? Date.now() - new Date(record.break_start_time).getTime()
        : 0;
      const net = Math.max(0, totalMs - breakMs - currentBreakMs);
      setElapsedWork(Math.floor(net / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isCheckedIn, isOnBreak, record]);

  // ── Elapsed break timer ───────────────────────────────────
  useEffect(() => {
    if (!isOnBreak || !record?.break_start_time) return;
    const tick = () => {
      const ms = Date.now() - new Date(record.break_start_time!).getTime();
      setElapsedBreak(Math.floor(ms / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isOnBreak, record]);

  // ── Actions ───────────────────────────────────────────────
  const handleCheckIn = async () => {
    const loc = locationMap[selectedLocation];
    setActionLoading(true);
    const { data, error } = await checkIn({
      work_mode: loc.apiMode,
      note: checkInNote || undefined,
      location: loc.locationLabel,
    });
    setActionLoading(false);
    if (error) {
      toast({ title: "Check-in Failed", description: error, variant: "destructive" });
      return;
    }
    setRecord(data!);
    setCheckInNote("");
    toast({ title: "✅ Checked In", description: `At ${fmt(data!.check_in_time)} from ${loc.label}`, duration: 3000 });
    onOpenChange(false);
  };

  const handleStartBreak = async () => {
    setActionLoading(true);
    const { data, error } = await startBreak({ break_type: selectedBreakType as any });
    setActionLoading(false);
    if (error) {
      toast({ title: "Break Start Failed", description: error, variant: "destructive" });
      return;
    }
    setRecord(data!);
    toast({
      title: "☕ Break Started",
      description: `${breakTypes.find((b) => b.value === selectedBreakType)?.label} at ${fmt(data!.break_start_time)}`,
      duration: 3000,
    });
    onOpenChange(false);
  };

  const handleEndBreak = async () => {
    setActionLoading(true);
    const { data, error } = await endBreak();
    setActionLoading(false);
    if (error) {
      toast({ title: "Break End Failed", description: error, variant: "destructive" });
      return;
    }
    setRecord(data!.record);
    toast({
      title: "✅ Break Ended",
      description: `Duration: ${data!.break_duration_minutes} minutes`,
      duration: 3000,
    });
    onOpenChange(false);
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    const { data, error } = await checkOut({ note: checkOutNote || undefined });
    setActionLoading(false);
    if (error) {
      toast({ title: "Check-out Failed", description: error, variant: "destructive" });
      return;
    }
    setRecord(data!);
    setCheckOutNote("");
    toast({
      title: "👋 Checked Out",
      description: `Work time: ${formatHMS(elapsedWork)} | Breaks: ${data!.total_break_minutes || 0} min`,
      duration: 5000,
    });
    onOpenChange(false);
  };

  const getLocationIcon = (loc: WorkLocation) => {
    const Icon = locationMap[loc].icon;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Attendance Tracker
          </DialogTitle>
          <DialogDescription>
            {dialogStatus === "not-checked-in" && "Start your workday"}
            {dialogStatus === "checked-in" && "You're currently working"}
            {dialogStatus === "on-break" && "You're on a break"}
            {dialogStatus === "checked-out" && "You've checked out for today"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Time */}
          <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
            <div className="text-3xl font-bold text-blue-600">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          {/* Loading state */}
          {loadingRecord ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-blue-500" size={28} />
            </div>
          ) : (
            <>
              {/* Status Badge */}
              <div className="flex justify-center">
                <Badge
                  className={`text-sm px-4 py-2 text-white ${dialogStatus === "checked-in" ? "bg-green-600" :
                      dialogStatus === "on-break" ? "bg-yellow-600" :
                        dialogStatus === "checked-out" ? "bg-gray-600" :
                          "bg-slate-600"
                    }`}
                >
                  {dialogStatus === "not-checked-in" && "Not Checked In"}
                  {dialogStatus === "checked-in" && "✓ Working"}
                  {dialogStatus === "on-break" && "☕ On Break"}
                  {dialogStatus === "checked-out" && "✓ Checked Out"}
                </Badge>
              </div>

              {/* Work / Break Timers */}
              {(dialogStatus === "checked-in" || dialogStatus === "on-break") && record && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-xs text-green-700 font-medium mb-1">Working Time</div>
                    <div className="text-lg font-bold text-green-600 font-mono">{formatHMS(elapsedWork)}</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-xs text-orange-700 font-medium mb-1">Break Time</div>
                    <div className="text-lg font-bold text-orange-600 font-mono">
                      {formatHMS((record.total_break_minutes || 0) * 60 + (isOnBreak ? elapsedBreak : 0))}
                    </div>
                  </div>
                </div>
              )}

              {/* Break pulse indicator */}
              {dialogStatus === "on-break" && record?.break_start_time && (
                <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        {breakTypes.find((b) => b.value === record.break_type)?.label || "Break"}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-700 font-mono">{formatHMS(elapsedBreak)}</div>
                  </div>
                </div>
              )}

              {/* ── NOT CHECKED IN: Check-In Form ── */}
              {dialogStatus === "not-checked-in" && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Select Work Location</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(locationMap) as WorkLocation[]).map((loc) => {
                        const { label, icon: Icon } = locationMap[loc];
                        const selected = selectedLocation === loc;
                        return (
                          <button
                            key={loc}
                            onClick={() => setSelectedLocation(loc)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                              }`}
                          >
                            <Icon className={`w-5 h-5 mb-1 ${selected ? "text-blue-600" : "text-gray-500"}`} />
                            <div className={`text-xs font-medium ${selected ? "text-blue-700" : "text-gray-700"}`}>
                              {label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="at-checkin-note" className="text-sm">Note (Optional)</Label>
                    <Textarea
                      id="at-checkin-note"
                      placeholder="Add a note about today's plan..."
                      value={checkInNote}
                      onChange={(e) => setCheckInNote(e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
                    Check In Now
                  </Button>
                </div>
              )}

              {/* ── CHECKED IN: Break + Check-Out ── */}
              {dialogStatus === "checked-in" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    Working from:{" "}
                    <Badge variant="outline" className="gap-1">
                      {getLocationIcon(selectedLocation)}
                      {record?.location || "—"}
                    </Badge>
                    {record?.check_in_time && (
                      <span className="ml-auto text-gray-500">In: {fmt(record.check_in_time)}</span>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Start Break</Label>
                    <Select value={selectedBreakType} onValueChange={setSelectedBreakType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {breakTypes.map((b) => (
                          <SelectItem key={b.value} value={b.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{b.label}</span>
                              {b.duration > 0 && (
                                <span className="text-xs text-gray-500 ml-2">~{b.duration}min</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleStartBreak}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Coffee className="w-4 h-4 mr-2" />}
                    Start Break
                  </Button>

                  <div>
                    <Label htmlFor="at-checkout-note" className="text-sm">Check Out Note (Optional)</Label>
                    <Textarea
                      id="at-checkout-note"
                      placeholder="Summary of today's work..."
                      value={checkOutNote}
                      onChange={(e) => setCheckOutNote(e.target.value)}
                      rows={2}
                      className="text-sm mt-1"
                    />
                  </div>

                  <Button
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                    Check Out
                  </Button>
                </div>
              )}

              {/* ── ON BREAK: End Break ── */}
              {dialogStatus === "on-break" && (
                <div className="space-y-3">
                  <Button
                    onClick={handleEndBreak}
                    disabled={actionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    End Break & Resume Work
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onOpenChange(false)}
                  >
                    Keep Break Running
                  </Button>
                </div>
              )}

              {/* ── CHECKED OUT: Day Summary ── */}
              {dialogStatus === "checked-out" && record && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-900">Day Complete!</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check In:</span>
                      <span className="font-medium">{fmt(record.check_in_time)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check Out:</span>
                      <span className="font-medium">{fmt(record.check_out_time)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Work:</span>
                      <span className="font-medium text-green-600">{record.work_hours ?? 0}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Breaks:</span>
                      <span className="font-medium">{record.total_break_minutes || 0} min</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
