const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard/stats
// Returns aggregated dashboard overview stats:
//   - activeEmployees  (employees with status='active')
//   - totalEmployees   (all employees)
//   - leaveRequests    { total, pending, approved, rejected }
//
// CRM leads data is intentionally NOT included here — the
// dashboard frontend supplies those from its own mock data.
// ─────────────────────────────────────────────────────────────
router.get('/stats', requireAuth, async (_req, res) => {
    try {
        // ── 1. Employee counts ──
        const { data: employees, error: empErr } = await supabase
            .from('employees')
            .select('id, status');

        if (empErr) {
            console.error('Dashboard stats – employees error:', empErr);
            return res.status(500).json({ error: 'Failed to fetch employee stats' });
        }

        const totalEmployees = employees?.length ?? 0;
        const activeEmployees = employees?.filter(e => e.status === 'active').length ?? 0;
        const onLeaveEmployees = employees?.filter(e => e.status === 'on_leave').length ?? 0;

        // ── 2. Leave request summary ──
        const { data: leaveRows, error: leaveErr } = await supabase
            .from('leave_requests')
            .select('id, status');

        if (leaveErr) {
            console.error('Dashboard stats – leave error:', leaveErr);
            return res.status(500).json({ error: 'Failed to fetch leave stats' });
        }

        const totalLeave = leaveRows?.length ?? 0;
        const pendingLeave = leaveRows?.filter(l => l.status === 'pending').length ?? 0;
        const approvedLeave = leaveRows?.filter(l => l.status === 'approved').length ?? 0;
        const rejectedLeave = leaveRows?.filter(l => l.status === 'rejected').length ?? 0;

        return res.json({
            employees: {
                total: totalEmployees,
                active: activeEmployees,
                on_leave: onLeaveEmployees,
                inactive: totalEmployees - activeEmployees - onLeaveEmployees,
            },
            leave_requests: {
                total: totalLeave,
                pending: pendingLeave,
                approved: approvedLeave,
                rejected: rejectedLeave,
            },
        });
    } catch (err) {
        console.error('Dashboard stats unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
