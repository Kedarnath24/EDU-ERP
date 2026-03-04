const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// ──────────────────────────────────────────────────────────
// GET /api/employees/me
// Returns the logged-in user's employee profile
// ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Fetch employee error:', error);
            return res.status(500).json({ error: 'Failed to fetch employee profile' });
        }

        if (!data) {
            // Auto-create a skeleton employee record for new users
            const authUser = req.user;
            const fullName =
                authUser.user_metadata?.full_name ||
                authUser.user_metadata?.name ||
                authUser.email?.split('@')[0] ||
                'Employee';

            const { data: created, error: createErr } = await supabase
                .from('employees')
                .insert({
                    user_id: userId,
                    full_name: fullName,
                    email: authUser.email,
                    status: 'active',
                })
                .select()
                .single();

            if (createErr) {
                console.error('Create employee error:', createErr);
                return res.status(500).json({ error: 'Failed to create employee profile' });
            }

            return res.json({ employee: created });
        }

        return res.json({ employee: data });
    } catch (err) {
        console.error('Get employee error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ──────────────────────────────────────────────────────────
// PUT /api/employees/me
// Update the logged-in user's employee profile
// ──────────────────────────────────────────────────────────
const validateUpdateEmployee = [
    body('full_name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('department').optional().trim(),
    body('position').optional().trim(),
    body('emergency_contact_name').optional().trim(),
    body('emergency_contact_relationship').optional().trim(),
    body('emergency_contact_phone').optional().trim(),
];

router.put('/me', requireAuth, validateUpdateEmployee, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }

    try {
        const userId = req.user.id;

        const allowedFields = [
            'full_name',
            'phone',
            'address',
            'department',
            'position',
            'manager',
            'emergency_contact_name',
            'emergency_contact_relationship',
            'emergency_contact_phone',
            'bank_name',
            'bank_account_number',
            'bank_routing_number',
            'avatar_url',
        ];

        // Only pick allowed fields from request body
        const updates = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('employees')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Update employee error:', error);
            return res.status(500).json({ error: 'Failed to update employee profile' });
        }

        return res.json({ employee: data, message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Update employee error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ──────────────────────────────────────────────────────────
// POST /api/employees
// Admin: create a new employee. Automatically provisions a
// Supabase Auth account with a temporary password; the user
// should reset it on first login.
// ──────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            full_name,
            email,
            designation,
            department,
            location,
            phone,
            alternate_phone,
            join_date,
            blood_group,
            status = 'onboarding',
        } = req.body;

        if (!full_name || !email) {
            return res.status(400).json({ error: 'full_name and email are required' });
        }

        // Generate a secure temporary password
        const tempPassword = `Tmp${Math.random().toString(36).slice(2, 10)}#2`;

        // Create Supabase auth user (auto-confirmed so they can log in immediately)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name, designation, role: 'member' },
        });

        if (authError) {
            const statusCode = authError.status || 400;
            return res.status(statusCode).json({ error: authError.message });
        }

        const userId = authData.user.id;

        // Upsert employee record with all provided HRM fields
        const { data: employee, error: empError } = await supabase
            .from('employees')
            .upsert({
                user_id: userId,
                full_name,
                email,
                designation: designation || null,
                position: designation || null,
                department: department || null,
                location: location || null,
                phone: phone || null,
                alternate_phone: alternate_phone || null,
                join_date: join_date || new Date().toISOString().split('T')[0],
                blood_group: blood_group || null,
                status,
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (empError) {
            console.error('Create employee record error:', empError);
            return res.status(500).json({
                error: 'Auth user created but employee record failed. Contact admin.',
            });
        }

        return res.status(201).json({
            message: `Employee "${full_name}" created successfully.`,
            employee,
        });
    } catch (err) {
        console.error('Add employee error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ──────────────────────────────────────────────────────────
// GET /api/employees
// Returns all employees with optional filters (admin view)
// Query params: search, status, department, limit, offset
// ──────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
    try {
        const {
            search,
            status,
            department,
            limit = 100,
            offset = 0,
        } = req.query;

        let query = supabase
            .from('employees')
            .select('*', { count: 'exact' })
            .order('full_name', { ascending: true })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (department && department !== 'all') {
            query = query.eq('department', department);
        }

        if (search) {
            query = query.or(
                `full_name.ilike.%${search}%,email.ilike.%${search}%,department.ilike.%${search}%,position.ilike.%${search}%,designation.ilike.%${search}%,employee_code.ilike.%${search}%`
            );
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Fetch employees error:', error);
            return res.status(500).json({ error: 'Failed to fetch employees' });
        }

        return res.json({ employees: data || [], total: count ?? 0 });
    } catch (err) {
        console.error('Get employees error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ──────────────────────────────────────────────────────────
// GET /api/employees/:id
// Returns a specific employee by their UUID id
// ──────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        return res.json({ employee: data });
    } catch (err) {
        console.error('Get employee by ID error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ──────────────────────────────────────────────────────────
// PUT /api/employees/:id
// Admin: update any employee's profile fields
// ──────────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const allowedFields = [
            'full_name',
            'email',
            'phone',
            'alternate_phone',
            'address',
            'location',
            'department',
            'position',
            'designation',
            'manager',
            'join_date',
            'status',
            'avatar_url',
            'blood_group',
            'emergency_contact_name',
            'emergency_contact_relationship',
            'emergency_contact_phone',
            'bank_name',
            'bank_account_number',
            'bank_routing_number',
            'exit_workflow',
        ];

        const updates = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }

        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('employees')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error || !data) {
            console.error('Admin update employee error:', error);
            return res.status(404).json({ error: 'Employee not found or update failed' });
        }

        return res.json({ employee: data, message: 'Employee updated successfully' });
    } catch (err) {
        console.error('Admin update employee error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ──────────────────────────────────────────────────────────
// PATCH /api/employees/:id/status
// Admin: change an employee's status only
// Body: { status: 'active' | 'inactive' | 'on_leave' |
//                'terminated' | 'probation' | 'onboarding' | 'exit' }
// ──────────────────────────────────────────────────────────
router.patch('/:id/status', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = [
            'active', 'inactive', 'on_leave', 'terminated',
            'probation', 'onboarding', 'exit',
        ];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
        }

        const { data, error } = await supabase
            .from('employees')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        return res.json({ employee: data, message: `Status updated to ${status}` });
    } catch (err) {
        console.error('Update employee status error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ──────────────────────────────────────────────────────────
// DELETE /api/employees/:id
// Admin: permanently remove an employee record (and optionally
// delete the linked Supabase auth user)
// Query param: deleteAuth=true to also delete the auth user
// ──────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { deleteAuth } = req.query;

        // Fetch employee first to get the user_id
        const { data: employee, error: fetchErr } = await supabase
            .from('employees')
            .select('id, user_id, full_name')
            .eq('id', id)
            .single();

        if (fetchErr || !employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Delete employee record
        const { error: deleteErr } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);

        if (deleteErr) {
            console.error('Delete employee error:', deleteErr);
            return res.status(500).json({ error: 'Failed to delete employee record' });
        }

        // Optionally delete the Supabase auth user
        if (deleteAuth === 'true' && employee.user_id) {
            const { error: authDeleteErr } = await supabase.auth.admin.deleteUser(
                employee.user_id
            );
            if (authDeleteErr) {
                console.warn('Auth user deletion warning:', authDeleteErr.message);
                // Employee row is already deleted; report partial success
                return res.json({
                    message: `Employee record deleted but auth user removal failed: ${authDeleteErr.message}`,
                });
            }
        }

        return res.json({
            message: `Employee "${employee.full_name}" has been removed successfully.`,
        });
    } catch (err) {
        console.error('Delete employee error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
