const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { body, query, validationResult } = require('express-validator');

const TABLE = 'attendance_records';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Look up the employee row for the authenticated user.
 * Creates a skeleton employee record if one doesn't exist yet.
 * Returns { employeeId, error }.
 */
async function resolveEmployeeId(reqUser) {
    const { data: emp, error: empErr } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', reqUser.id)
        .maybeSingle();

    if (empErr) return { error: empErr.message };

    if (emp) return { employeeId: emp.id };

    // Auto-create employee record on first use
    const fullName =
        reqUser.user_metadata?.full_name ||
        reqUser.user_metadata?.name ||
        reqUser.email?.split('@')[0] ||
        'Employee';

    const { data: created, error: createErr } = await supabase
        .from('employees')
        .insert({ user_id: reqUser.id, full_name: fullName, email: reqUser.email, status: 'active' })
        .select('id')
        .single();

    if (createErr) return { error: createErr.message };
    return { employeeId: created.id };
}

/**
 * Normalise a raw attendance_records DB row into the standard API shape.
 * - Renames DB columns to the names the frontend expects.
 * - Converts total_break_duration_ms → total_break_minutes.
 * - Computes work_hours from timestamps if both are present.
 */
function toApiRecord(row) {
    if (!row) return null;

    const breakMs = row.total_break_duration_ms || 0;
    const totalBreakMinutes = Math.round(breakMs / 60000);

    let workHours = 0;
    if (row.check_in && row.check_out) {
        const workedMs = new Date(row.check_out).getTime() - new Date(row.check_in).getTime() - breakMs;
        workHours = parseFloat((Math.max(0, workedMs) / 3600000).toFixed(2));
    }

    return {
        id: row.id,
        employee_id: row.employee_id,
        date: row.date,
        status: row.status,
        // Renamed for frontend consistency
        check_in_time: row.check_in || null,
        check_out_time: row.check_out || null,
        break_start_time: row.break_start || null,
        break_end_time: row.break_end || null,
        // Derived / computed
        total_break_minutes: totalBreakMinutes,
        work_mode: row.work_mode || null,
        location: row.location || null,
        work_hours: workHours,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

// ─────────────────────────────────────────────────────────────
// POST /api/attendance/checkin
// ─────────────────────────────────────────────────────────────
router.post(
    '/checkin',
    requireAuth,
    [
        body('work_mode')
            .optional()
            .isIn(['office', 'remote', 'hybrid', 'onsite'])
            .withMessage('work_mode must be one of: office, remote, hybrid, onsite'),
        body('note').optional().trim(),
        body('location').optional().trim(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
            });
        }

        try {
            // 1. Resolve employee_id (required by the table; NOT NULL + FK)
            const { employeeId, error: empError } = await resolveEmployeeId(req.user);
            if (empError) {
                console.error('Resolve employee error:', empError);
                return res.status(500).json({ error: 'Could not resolve employee record', details: empError });
            }

            const now = new Date().toISOString();
            const today = now.split('T')[0]; // YYYY-MM-DD

            // 2. Prevent double check-in (unique constraint: employee_id + date)
            const { data: existing } = await supabase
                .from(TABLE)
                .select('id, status, check_in')
                .eq('employee_id', employeeId)
                .eq('date', today)
                .maybeSingle();

            if (existing) {
                return res.status(409).json({
                    error: 'Already checked in today',
                    record: toApiRecord(existing),
                });
            }

            // 3. Insert new attendance record
            const { data, error } = await supabase
                .from(TABLE)
                .insert({
                    employee_id: employeeId,
                    date: today,
                    check_in: now,
                    work_mode: req.body.work_mode || 'office',
                    location: req.body.location || null,
                    status: 'present',
                    total_break_duration_ms: 0,
                })
                .select()
                .single();

            if (error) {
                console.error('Check-in Supabase error:', error);
                return res.status(500).json({ error: 'Failed to record check-in', details: error.message });
            }

            return res.status(201).json({
                message: 'Checked in successfully',
                record: toApiRecord(data),
            });
        } catch (err) {
            console.error('Check-in unexpected error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// ─────────────────────────────────────────────────────────────
// POST /api/attendance/checkout
// ─────────────────────────────────────────────────────────────
router.post(
    '/checkout',
    requireAuth,
    [body('note').optional().trim()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
            });
        }

        try {
            const { employeeId, error: empError } = await resolveEmployeeId(req.user);
            if (empError) return res.status(500).json({ error: 'Could not resolve employee record', details: empError });

            const now = new Date().toISOString();
            const today = now.split('T')[0];

            // Find today's open attendance record
            const { data: record, error: findErr } = await supabase
                .from(TABLE)
                .select('*')
                .eq('employee_id', employeeId)
                .eq('date', today)
                .maybeSingle();

            if (findErr || !record) {
                return res.status(404).json({ error: 'No active check-in found for today' });
            }
            if (record.check_out) {
                return res.status(409).json({ error: 'Already checked out today' });
            }

            // If still on break, end the break first and accumulate its duration
            let finalBreakMs = record.total_break_duration_ms || 0;
            let breakEndVal = record.break_end;

            if (record.break_start && !record.break_end) {
                const ongoingBreakMs = new Date(now).getTime() - new Date(record.break_start).getTime();
                finalBreakMs += ongoingBreakMs;
                breakEndVal = now;
            }

            const { data, error } = await supabase
                .from(TABLE)
                .update({
                    check_out: now,
                    break_end: breakEndVal,
                    total_break_duration_ms: finalBreakMs,
                    updated_at: now,
                })
                .eq('id', record.id)
                .select()
                .single();

            if (error) {
                console.error('Check-out Supabase error:', error);
                return res.status(500).json({ error: 'Failed to record check-out', details: error.message });
            }

            return res.json({
                message: 'Checked out successfully',
                record: toApiRecord(data),
            });
        } catch (err) {
            console.error('Check-out unexpected error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// ─────────────────────────────────────────────────────────────
// POST /api/attendance/break/start
// ─────────────────────────────────────────────────────────────
router.post(
    '/break/start',
    requireAuth,
    [
        body('break_type')
            .optional()
            .isIn(['lunch', 'tea', 'short', 'meeting', 'other']),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
            });
        }

        try {
            const { employeeId, error: empError } = await resolveEmployeeId(req.user);
            if (empError) return res.status(500).json({ error: 'Could not resolve employee record', details: empError });

            const now = new Date().toISOString();
            const today = now.split('T')[0];

            const { data: record, error: findErr } = await supabase
                .from(TABLE)
                .select('*')
                .eq('employee_id', employeeId)
                .eq('date', today)
                .maybeSingle();

            if (findErr || !record) {
                return res.status(404).json({ error: 'No active check-in found for today' });
            }
            if (record.check_out) {
                return res.status(409).json({ error: 'Cannot start a break after check-out' });
            }
            // Active break: break_start set and break_end is still null
            if (record.break_start && !record.break_end) {
                return res.status(409).json({ error: 'Already on a break' });
            }

            // Start a new break (overwrite break_start; clear break_end)
            const { data, error } = await supabase
                .from(TABLE)
                .update({
                    break_start: now,
                    break_end: null,
                    updated_at: now,
                })
                .eq('id', record.id)
                .select()
                .single();

            if (error) {
                console.error('Break start Supabase error:', error);
                return res.status(500).json({ error: 'Failed to start break', details: error.message });
            }

            return res.json({ message: 'Break started', record: toApiRecord(data) });
        } catch (err) {
            console.error('Break start unexpected error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// ─────────────────────────────────────────────────────────────
// POST /api/attendance/break/end
// Accumulates break duration into total_break_duration_ms
// ─────────────────────────────────────────────────────────────
router.post('/break/end', requireAuth, async (req, res) => {
    try {
        const { employeeId, error: empError } = await resolveEmployeeId(req.user);
        if (empError) return res.status(500).json({ error: 'Could not resolve employee record', details: empError });

        const now = new Date().toISOString();
        const today = now.split('T')[0];

        const { data: record, error: findErr } = await supabase
            .from(TABLE)
            .select('*')
            .eq('employee_id', employeeId)
            .eq('date', today)
            .maybeSingle();

        if (findErr || !record) {
            return res.status(404).json({ error: 'No active check-in found for today' });
        }
        // Must have an active break (break_start set, break_end null)
        if (!record.break_start || record.break_end) {
            return res.status(409).json({ error: 'No active break to end' });
        }

        // Calculate this break's duration in ms and add to running total
        const thisBreakMs = new Date(now).getTime() - new Date(record.break_start).getTime();
        const newTotalBreakMs = (record.total_break_duration_ms || 0) + thisBreakMs;
        const thisBreakMins = Math.round(thisBreakMs / 60000);

        const { data, error } = await supabase
            .from(TABLE)
            .update({
                break_end: now,
                total_break_duration_ms: newTotalBreakMs,
                updated_at: now,
            })
            .eq('id', record.id)
            .select()
            .single();

        if (error) {
            console.error('Break end Supabase error:', error);
            return res.status(500).json({ error: 'Failed to end break', details: error.message });
        }

        return res.json({
            message: 'Break ended',
            break_duration_minutes: thisBreakMins,
            record: toApiRecord(data),
        });
    } catch (err) {
        console.error('Break end unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/attendance/today
// ─────────────────────────────────────────────────────────────
router.get('/today', requireAuth, async (req, res) => {
    try {
        const { employeeId, error: empError } = await resolveEmployeeId(req.user);
        if (empError) return res.status(500).json({ error: 'Could not resolve employee record', details: empError });

        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('employee_id', employeeId)
            .eq('date', today)
            .maybeSingle();

        if (error) {
            console.error('Today attendance Supabase error:', error);
            return res.status(500).json({ error: "Failed to fetch today's attendance", details: error.message });
        }

        return res.json({ record: toApiRecord(data) });
    } catch (err) {
        console.error('Today attendance unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/attendance/history
// ?month=YYYY-MM  &limit=30
// ─────────────────────────────────────────────────────────────
router.get(
    '/history',
    requireAuth,
    [
        query('month')
            .optional()
            .matches(/^\d{4}-\d{2}$/)
            .withMessage('month must be YYYY-MM'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 365 })
            .withMessage('limit must be 1-365'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
            });
        }

        try {
            const { employeeId, error: empError } = await resolveEmployeeId(req.user);
            if (empError) return res.status(500).json({ error: 'Could not resolve employee record', details: empError });

            const limit = parseInt(req.query.limit) || 30;

            let q = supabase
                .from(TABLE)
                .select('*')
                .eq('employee_id', employeeId)
                .order('date', { ascending: false })
                .limit(limit);

            if (req.query.month) {
                const [year, mon] = req.query.month.split('-');
                const startDate = `${year}-${mon}-01`;
                const daysInMonth = new Date(parseInt(year), parseInt(mon), 0).getDate();
                const endDate = `${year}-${mon}-${String(daysInMonth).padStart(2, '0')}`;
                q = q.gte('date', startDate).lte('date', endDate);
            }

            const { data, error } = await q;

            if (error) {
                console.error('History Supabase error:', error);
                return res.status(500).json({ error: 'Failed to fetch attendance history', details: error.message });
            }

            return res.json({ records: (data || []).map(toApiRecord) });
        } catch (err) {
            console.error('History unexpected error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// ─────────────────────────────────────────────────────────────
// GET /api/attendance/stats
// Monthly stats for the logged-in employee
// ─────────────────────────────────────────────────────────────
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const { employeeId, error: empError } = await resolveEmployeeId(req.user);
        if (empError) return res.status(500).json({ error: 'Could not resolve employee record', details: empError });

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const startDate = `${year}-${month}-01`;
        const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
        const endDate = `${year}-${month}-${String(daysInMonth).padStart(2, '0')}`;

        const { data, error } = await supabase
            .from(TABLE)
            .select('status, check_in, check_out, total_break_duration_ms, date')
            .eq('employee_id', employeeId)
            .gte('date', startDate)
            .lte('date', endDate);

        if (error) {
            console.error('Stats Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch attendance stats', details: error.message });
        }

        const records = data || [];
        const presentDays = records.filter((r) => r.status === 'present' || r.status === 'late').length;
        const absentDays = records.filter((r) => r.status === 'absent').length;

        // Compute total work hours across all records
        let totalWorkMs = 0;
        for (const r of records) {
            if (r.check_in && r.check_out) {
                const workedMs = new Date(r.check_out).getTime() - new Date(r.check_in).getTime() - (r.total_break_duration_ms || 0);
                totalWorkMs += Math.max(0, workedMs);
            }
        }
        const totalHours = parseFloat((totalWorkMs / 3600000).toFixed(1));
        const avgHours = presentDays > 0 ? parseFloat((totalHours / presentDays).toFixed(1)) : 0;

        return res.json({
            stats: {
                present_days: presentDays,
                absent_days: absentDays,
                total_hours: totalHours,
                avg_hours_per_day: avgHours,
                month: `${year}-${month}`,
            },
        });
    } catch (err) {
        console.error('Stats unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
