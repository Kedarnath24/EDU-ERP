const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

const TABLE = 'leave_requests';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Look up the employee row for the authenticated user.
 * Returns { employeeId, employee, error }.
 */
async function resolveEmployee(reqUser) {
    const { data: emp, error: empErr } = await supabase
        .from('employees')
        .select('id, full_name, email, department, position, avatar_url, employee_code')
        .eq('user_id', reqUser.id)
        .maybeSingle();

    if (empErr) return { error: empErr.message };
    if (!emp) return { error: 'No employee record found for this user' };

    return { employeeId: emp.id, employee: emp };
}

/**
 * Normalise a leave_request DB row into the standard API shape.
 */
function toApiRecord(row) {
    if (!row) return null;
    return {
        id: row.id,
        employee_id: row.employee_id,
        leave_type: row.leave_type,
        start_date: row.start_date,
        end_date: row.end_date,
        days: row.days,
        reason: row.reason || null,
        attachment_url: row.attachment_url || null,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        // Joined employee fields (if present from join query)
        employee_name: row.employees?.full_name || null,
        employee_email: row.employees?.email || null,
        employee_department: row.employees?.department || null,
        employee_avatar_url: row.employees?.avatar_url || null,
        employee_code: row.employees?.employee_code || null,
    };
}

/**
 * Calculate business days between two dates.
 */
function calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let days = 0;
    const current = new Date(start);
    while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            days++;
        }
        current.setDate(current.getDate() + 1);
    }
    return days || 1; // At least 1 day
}

// ─────────────────────────────────────────────────────────────
// POST /api/leave
// Employee: create a new leave request
// ─────────────────────────────────────────────────────────────
router.post(
    '/',
    requireAuth,
    [
        body('leave_type')
            .notEmpty()
            .withMessage('leave_type is required'),
        body('start_date')
            .notEmpty()
            .isISO8601()
            .withMessage('start_date must be a valid date (YYYY-MM-DD)'),
        body('end_date')
            .notEmpty()
            .isISO8601()
            .withMessage('end_date must be a valid date (YYYY-MM-DD)'),
        body('reason')
            .optional()
            .trim(),
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
            const { employeeId, error: empError } = await resolveEmployee(req.user);
            if (empError) {
                return res.status(500).json({ error: 'Could not resolve employee record', details: empError });
            }

            const { leave_type, start_date, end_date, reason } = req.body;

            // Validate dates
            if (new Date(end_date) < new Date(start_date)) {
                return res.status(400).json({ error: 'end_date must be after or equal to start_date' });
            }

            const days = calculateDays(start_date, end_date);

            // Check for overlapping leave requests
            const { data: overlapping } = await supabase
                .from(TABLE)
                .select('id')
                .eq('employee_id', employeeId)
                .in('status', ['pending', 'approved'])
                .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`)
                .limit(1);

            if (overlapping && overlapping.length > 0) {
                return res.status(409).json({
                    error: 'You already have a leave request that overlaps with these dates',
                });
            }

            const { data, error } = await supabase
                .from(TABLE)
                .insert({
                    employee_id: employeeId,
                    leave_type,
                    start_date,
                    end_date,
                    days,
                    reason: reason || null,
                    status: 'pending',
                })
                .select(`*, employees ( full_name, email, department, avatar_url, employee_code )`)
                .single();

            if (error) {
                console.error('Create leave request Supabase error:', error);
                return res.status(500).json({ error: 'Failed to create leave request', details: error.message });
            }

            return res.status(201).json({
                message: 'Leave request submitted successfully',
                leave_request: toApiRecord(data),
            });
        } catch (err) {
            console.error('Create leave request unexpected error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// ─────────────────────────────────────────────────────────────
// GET /api/leave/my
// Employee: get own leave requests
// ─────────────────────────────────────────────────────────────
router.get('/my', requireAuth, async (req, res) => {
    try {
        const { employeeId, error: empError } = await resolveEmployee(req.user);
        if (empError) {
            return res.status(500).json({ error: 'Could not resolve employee record', details: empError });
        }

        const { data, error } = await supabase
            .from(TABLE)
            .select(`*, employees ( full_name, email, department, avatar_url, employee_code )`)
            .eq('employee_id', employeeId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('My leave requests Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch leave requests', details: error.message });
        }

        return res.json({
            leave_requests: (data || []).map(toApiRecord),
        });
    } catch (err) {
        console.error('My leave requests unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/leave/all
// HRM Admin: get ALL leave requests with optional filters
// ?status=pending|approved|rejected  &limit=50
// ─────────────────────────────────────────────────────────────
router.get(
    '/all',
    requireAuth,
    [
        query('status')
            .optional()
            .isIn(['pending', 'approved', 'rejected', 'all'])
            .withMessage('status must be: pending, approved, rejected, or all'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 500 })
            .withMessage('limit must be 1-500'),
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
            const limit = parseInt(req.query.limit) || 100;

            let q = supabase
                .from(TABLE)
                .select(`*, employees ( full_name, email, department, avatar_url, employee_code )`)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (req.query.status && req.query.status !== 'all') {
                q = q.eq('status', req.query.status);
            }

            const { data, error } = await q;

            if (error) {
                console.error('All leave requests Supabase error:', error);
                return res.status(500).json({ error: 'Failed to fetch leave requests', details: error.message });
            }

            const requests = (data || []).map(toApiRecord);

            // Summary counts
            const pendingCount = requests.filter(r => r.status === 'pending').length;
            const approvedCount = requests.filter(r => r.status === 'approved').length;
            const rejectedCount = requests.filter(r => r.status === 'rejected').length;

            return res.json({
                leave_requests: requests,
                summary: {
                    total: requests.length,
                    pending: pendingCount,
                    approved: approvedCount,
                    rejected: rejectedCount,
                },
            });
        } catch (err) {
            console.error('All leave requests unexpected error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// ─────────────────────────────────────────────────────────────
// PATCH /api/leave/:id/approve
// HRM Admin: approve a leave request
// ─────────────────────────────────────────────────────────────
router.patch(
    '/:id/approve',
    requireAuth,
    [
        param('id').isUUID().withMessage('Invalid leave request ID'),
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
            // First verify the request exists and is pending
            const { data: existing, error: findErr } = await supabase
                .from(TABLE)
                .select('id, status')
                .eq('id', req.params.id)
                .maybeSingle();

            if (findErr || !existing) {
                return res.status(404).json({ error: 'Leave request not found' });
            }

            if (existing.status !== 'pending') {
                return res.status(409).json({
                    error: `Cannot approve a leave request that is already ${existing.status}`,
                });
            }

            const { data, error } = await supabase
                .from(TABLE)
                .update({
                    status: 'approved',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', req.params.id)
                .select(`*, employees ( full_name, email, department, avatar_url, employee_code )`)
                .single();

            if (error) {
                console.error('Approve leave Supabase error:', error);
                return res.status(500).json({ error: 'Failed to approve leave request', details: error.message });
            }

            return res.json({
                message: 'Leave request approved successfully',
                leave_request: toApiRecord(data),
            });
        } catch (err) {
            console.error('Approve leave unexpected error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// ─────────────────────────────────────────────────────────────
// PATCH /api/leave/:id/reject
// HRM Admin: reject a leave request
// ─────────────────────────────────────────────────────────────
router.patch(
    '/:id/reject',
    requireAuth,
    [
        param('id').isUUID().withMessage('Invalid leave request ID'),
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
            const { data: existing, error: findErr } = await supabase
                .from(TABLE)
                .select('id, status')
                .eq('id', req.params.id)
                .maybeSingle();

            if (findErr || !existing) {
                return res.status(404).json({ error: 'Leave request not found' });
            }

            if (existing.status !== 'pending') {
                return res.status(409).json({
                    error: `Cannot reject a leave request that is already ${existing.status}`,
                });
            }

            const { data, error } = await supabase
                .from(TABLE)
                .update({
                    status: 'rejected',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', req.params.id)
                .select(`*, employees ( full_name, email, department, avatar_url, employee_code )`)
                .single();

            if (error) {
                console.error('Reject leave Supabase error:', error);
                return res.status(500).json({ error: 'Failed to reject leave request', details: error.message });
            }

            return res.json({
                message: 'Leave request rejected',
                leave_request: toApiRecord(data),
            });
        } catch (err) {
            console.error('Reject leave unexpected error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// ─────────────────────────────────────────────────────────────
// DELETE /api/leave/:id
// Employee: cancel/delete own pending leave request
// ─────────────────────────────────────────────────────────────
router.delete(
    '/:id',
    requireAuth,
    [
        param('id').isUUID().withMessage('Invalid leave request ID'),
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
            const { employeeId, error: empError } = await resolveEmployee(req.user);
            if (empError) {
                return res.status(500).json({ error: 'Could not resolve employee record', details: empError });
            }

            // Verify the request belongs to this employee and is still pending
            const { data: existing, error: findErr } = await supabase
                .from(TABLE)
                .select('id, employee_id, status')
                .eq('id', req.params.id)
                .maybeSingle();

            if (findErr || !existing) {
                return res.status(404).json({ error: 'Leave request not found' });
            }

            if (existing.employee_id !== employeeId) {
                return res.status(403).json({ error: 'You can only cancel your own leave requests' });
            }

            if (existing.status !== 'pending') {
                return res.status(409).json({
                    error: `Cannot cancel a leave request that is already ${existing.status}`,
                });
            }

            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq('id', req.params.id);

            if (error) {
                console.error('Delete leave Supabase error:', error);
                return res.status(500).json({ error: 'Failed to cancel leave request', details: error.message });
            }

            return res.json({ message: 'Leave request cancelled successfully' });
        } catch (err) {
            console.error('Delete leave unexpected error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

module.exports = router;
