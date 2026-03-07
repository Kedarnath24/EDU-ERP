const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// PUBLIC ROUTES (no auth required — used by career-landing page)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/recruitment/jobs/public
 * Returns all Active / Closing Soon jobs for the public careers page.
 */
router.get('/jobs/public', async (_req, res) => {
    try {
        const { data, error } = await supabase
            .from('job_postings')
            .select('*')
            .in('status', ['Active', 'Closing Soon'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map DB rows → the shape the career-landing page expects
        const jobs = (data || []).map(row => ({
            id: row.id,
            title: row.title,
            department: row.department,
            location: row.location,
            type: row.employment_type,
            workMode: row.work_mode,
            salaryMin: row.salary_min,
            salaryMax: row.salary_max,
            description: row.description,
            skills: row.skills || [],
            duration: row.duration,
            experience: row.experience,
            openings: row.openings,
            deadline: row.deadline,
            responsibilities: row.responsibilities,
            requirements: row.requirements,
            benefits: row.benefits,
            education: row.education,
            status: row.status,
            postedDate: formatRelativeDate(row.created_at),
        }));

        return res.json({ jobs });
    } catch (err) {
        console.error('GET /jobs/public error:', err);
        return res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

/**
 * POST /api/recruitment/apply
 * Public endpoint — anyone can submit an application from the career page.
 * Body: { job_id, name, email, phone }
 */
router.post('/apply', async (req, res) => {
    try {
        const { job_id, name, email, phone } = req.body;

        if (!job_id || !name || !email) {
            return res.status(400).json({ error: 'job_id, name, and email are required' });
        }

        // Verify the job exists and is still active
        const { data: job, error: jobError } = await supabase
            .from('job_postings')
            .select('id, title, status')
            .eq('id', job_id)
            .single();

        if (jobError || !job) {
            return res.status(404).json({ error: 'Job posting not found' });
        }

        if (!['Active', 'Closing Soon'].includes(job.status)) {
            return res.status(400).json({ error: 'This position is no longer accepting applications' });
        }

        // Check for duplicate application
        const { data: existing } = await supabase
            .from('job_applications')
            .select('id')
            .eq('job_id', job_id)
            .eq('applicant_email', email.toLowerCase().trim())
            .maybeSingle();

        if (existing) {
            return res.status(409).json({ error: 'You have already applied for this position' });
        }

        // Insert application
        const { data: application, error: insertError } = await supabase
            .from('job_applications')
            .insert({
                job_id,
                applicant_name: name.trim(),
                applicant_email: email.toLowerCase().trim(),
                applicant_phone: phone?.trim() || null,
                status: 'Screening',
                source: 'Career Site',
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return res.status(201).json({
            message: 'Application submitted successfully!',
            application,
        });
    } catch (err) {
        console.error('POST /apply error:', err);
        return res.status(500).json({ error: 'Failed to submit application' });
    }
});


// ═══════════════════════════════════════════════════════════════
// PROTECTED ROUTES (require auth — used by the admin dashboard)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/recruitment/jobs
 * Returns ALL job postings (including Closed/Draft) for the admin.
 */
router.get('/jobs', requireAuth, async (_req, res) => {
    try {
        const { data, error } = await supabase
            .from('job_postings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Count applicants per job
        const jobIds = (data || []).map(j => j.id);
        let applicantCounts = {};

        if (jobIds.length > 0) {
            const { data: apps, error: appsError } = await supabase
                .from('job_applications')
                .select('job_id');

            if (!appsError && apps) {
                applicantCounts = apps.reduce((acc, app) => {
                    acc[app.job_id] = (acc[app.job_id] || 0) + 1;
                    return acc;
                }, {});
            }
        }

        const jobs = (data || []).map(row => ({
            id: row.id,
            title: row.title,
            department: row.department,
            location: row.location,
            type: row.employment_type,
            workMode: row.work_mode,
            salaryMin: row.salary_min,
            salaryMax: row.salary_max,
            description: row.description,
            skills: row.skills || [],
            duration: row.duration,
            experience: row.experience,
            openings: row.openings,
            deadline: row.deadline,
            responsibilities: row.responsibilities,
            requirements: row.requirements,
            benefits: row.benefits,
            education: row.education,
            applicants: applicantCounts[row.id] || 0,
            status: row.status,
            postedDate: formatRelativeDate(row.created_at),
        }));

        return res.json({ jobs });
    } catch (err) {
        console.error('GET /jobs error:', err);
        return res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

/**
 * POST /api/recruitment/jobs
 * Create a new job posting.
 */
router.post('/jobs', requireAuth, async (req, res) => {
    try {
        const {
            title, department, location, employmentType, workMode,
            salaryMin, salaryMax, description, skills, duration,
            experience, openings, deadline, responsibilities,
            requirements, benefits, education,
        } = req.body;

        if (!title || !department || !employmentType) {
            return res.status(400).json({
                error: 'title, department, and employmentType are required',
            });
        }

        const { data, error } = await supabase
            .from('job_postings')
            .insert({
                title: title.trim(),
                department,
                location: location || 'Not specified',
                employment_type: employmentType,
                work_mode: workMode || 'Not specified',
                salary_min: salaryMin || null,
                salary_max: salaryMax || null,
                description: description || null,
                skills: skills || [],
                duration: duration || 'Permanent',
                experience: experience || 'Not specified',
                openings: parseInt(openings) || 1,
                deadline: deadline || null,
                responsibilities: responsibilities || null,
                requirements: requirements || null,
                benefits: benefits || null,
                education: education || 'Not specified',
                status: 'Active',
                created_by: req.user.id,
            })
            .select()
            .single();

        if (error) throw error;

        const job = {
            id: data.id,
            title: data.title,
            department: data.department,
            location: data.location,
            type: data.employment_type,
            workMode: data.work_mode,
            salaryMin: data.salary_min,
            salaryMax: data.salary_max,
            description: data.description,
            skills: data.skills || [],
            duration: data.duration,
            experience: data.experience,
            openings: data.openings,
            deadline: data.deadline,
            responsibilities: data.responsibilities,
            requirements: data.requirements,
            benefits: data.benefits,
            education: data.education,
            applicants: 0,
            status: data.status,
            postedDate: 'Just now',
        };

        return res.status(201).json({ job });
    } catch (err) {
        console.error('POST /jobs error:', err);
        return res.status(500).json({ error: 'Failed to create job posting' });
    }
});

/**
 * PUT /api/recruitment/jobs/:id
 * Update an existing job posting.
 */
router.put('/jobs/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {};
        const fieldMap = {
            title: 'title',
            department: 'department',
            location: 'location',
            employmentType: 'employment_type',
            workMode: 'work_mode',
            salaryMin: 'salary_min',
            salaryMax: 'salary_max',
            description: 'description',
            skills: 'skills',
            duration: 'duration',
            experience: 'experience',
            openings: 'openings',
            deadline: 'deadline',
            responsibilities: 'responsibilities',
            requirements: 'requirements',
            benefits: 'benefits',
            education: 'education',
            status: 'status',
        };

        for (const [clientKey, dbKey] of Object.entries(fieldMap)) {
            if (req.body[clientKey] !== undefined) {
                updates[dbKey] = req.body[clientKey];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const { data, error } = await supabase
            .from('job_postings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.json({ job: data });
    } catch (err) {
        console.error('PUT /jobs/:id error:', err);
        return res.status(500).json({ error: 'Failed to update job posting' });
    }
});

/**
 * DELETE /api/recruitment/jobs/:id
 * Delete a job posting and all its applications.
 */
router.delete('/jobs/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('job_postings')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return res.json({ message: 'Job posting deleted' });
    } catch (err) {
        console.error('DELETE /jobs/:id error:', err);
        return res.status(500).json({ error: 'Failed to delete job posting' });
    }
});


// ═══════════════════════════════════════════════════════════════
// CANDIDATES (applications) — Admin
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/recruitment/candidates
 * List all candidates (applications) with job title info.
 * Query params: ?job_title=... &status=... &search=...
 */
router.get('/candidates', requireAuth, async (req, res) => {
    try {
        const { job_title, status, search } = req.query;

        let query = supabase
            .from('job_applications')
            .select(`
        *,
        job_postings ( id, title, department )
      `)
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        let candidates = (data || []).map(row => ({
            id: row.id,
            name: row.applicant_name,
            email: row.applicant_email,
            phone: row.applicant_phone,
            position: row.job_postings?.title || 'Unknown',
            department: row.job_postings?.department || 'Unknown',
            status: row.status,
            source: row.source,
            experience: row.experience || 'Not specified',
            skills: row.skills || [],
            notes: row.notes,
            appliedDate: row.created_at,
            jobId: row.job_id,
        }));

        // Client-side filtering for job_title and search
        if (job_title) {
            candidates = candidates.filter(
                c => c.position.toLowerCase() === job_title.toLowerCase()
            );
        }

        if (search) {
            const q = search.toLowerCase();
            candidates = candidates.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.position.toLowerCase().includes(q) ||
                c.skills.some(s => s.toLowerCase().includes(q))
            );
        }

        return res.json({ candidates, total: candidates.length });
    } catch (err) {
        console.error('GET /candidates error:', err);
        return res.status(500).json({ error: 'Failed to fetch candidates' });
    }
});

/**
 * PATCH /api/recruitment/candidates/:id/status
 * Update a candidate's pipeline status.
 * Body: { status: 'Screening' | 'Interviewing' | 'Offer Sent' | 'Hired' | 'Rejected' }
 */
router.patch('/candidates/:id/status', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['Screening', 'Interviewing', 'Offer Sent', 'Hired', 'Rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
        }

        const { data, error } = await supabase
            .from('job_applications')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.json({ candidate: data });
    } catch (err) {
        console.error('PATCH /candidates/:id/status error:', err);
        return res.status(500).json({ error: 'Failed to update candidate status' });
    }
});

/**
 * POST /api/recruitment/candidates
 * Admin: manually add a candidate to the pipeline.
 * Body: { name, email, phone?, position (job title), experience?, source?, skills? }
 */
router.post('/candidates', requireAuth, async (req, res) => {
    try {
        const { name, email, phone, position, experience, source, skills } = req.body;

        if (!name || !email || !position) {
            return res.status(400).json({ error: 'name, email, and position are required' });
        }

        // Find the job by title
        const { data: job, error: jobError } = await supabase
            .from('job_postings')
            .select('id')
            .eq('title', position)
            .maybeSingle();

        if (jobError) throw jobError;

        if (!job) {
            return res.status(404).json({ error: `No job posting found with title "${position}"` });
        }

        // Check duplicate
        const { data: existing } = await supabase
            .from('job_applications')
            .select('id')
            .eq('job_id', job.id)
            .eq('applicant_email', email.toLowerCase().trim())
            .maybeSingle();

        if (existing) {
            return res.status(409).json({ error: 'This candidate has already been added for this position' });
        }

        const { data, error } = await supabase
            .from('job_applications')
            .insert({
                job_id: job.id,
                applicant_name: name.trim(),
                applicant_email: email.toLowerCase().trim(),
                applicant_phone: phone?.trim() || null,
                status: 'Screening',
                source: source || 'Manual',
                experience: experience || null,
                skills: skills || [],
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            candidate: {
                id: data.id,
                name: data.applicant_name,
                email: data.applicant_email,
                phone: data.applicant_phone,
                position,
                status: data.status,
                source: data.source,
                experience: data.experience || 'Not specified',
                skills: data.skills || [],
                appliedDate: data.created_at,
                jobId: data.job_id,
            },
        });
    } catch (err) {
        console.error('POST /candidates error:', err);
        return res.status(500).json({ error: 'Failed to add candidate' });
    }
});

/**
 * GET /api/recruitment/stats
 * Dashboard statistics.
 */
router.get('/stats', requireAuth, async (_req, res) => {
    try {
        // Active jobs count
        const { count: activeJobs } = await supabase
            .from('job_postings')
            .select('*', { count: 'exact', head: true })
            .in('status', ['Active', 'Closing Soon']);

        // Total candidates
        const { count: totalCandidates } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true });

        // Candidates by status (pipeline)
        const { data: allApps } = await supabase
            .from('job_applications')
            .select('status');

        const pipeline = {
            Screening: 0,
            Interviewing: 0,
            'Offer Sent': 0,
            Hired: 0,
            Rejected: 0,
        };
        (allApps || []).forEach(a => {
            if (pipeline[a.status] !== undefined) {
                pipeline[a.status]++;
            }
        });

        // Recent activity (last 5 applications)
        const { data: recentApps } = await supabase
            .from('job_applications')
            .select(`
        id, applicant_name, status, created_at,
        job_postings ( title )
      `)
            .order('created_at', { ascending: false })
            .limit(5);

        const recentActivity = (recentApps || []).map(a => ({
            id: a.id,
            user: a.applicant_name,
            action: 'applied for',
            target: a.job_postings?.title || 'Unknown',
            time: formatRelativeDate(a.created_at),
        }));

        return res.json({
            stats: {
                activeJobs: activeJobs || 0,
                totalCandidates: totalCandidates || 0,
                hired: pipeline.Hired,
                interviewing: pipeline.Interviewing,
            },
            pipeline: [
                { name: 'Applied', value: totalCandidates || 0, color: '#94a3b8' },
                { name: 'Screening', value: pipeline.Screening, color: '#f59e0b' },
                { name: 'Interview', value: pipeline.Interviewing, color: '#8b5cf6' },
                { name: 'Offer', value: pipeline['Offer Sent'], color: '#3b82f6' },
                { name: 'Hired', value: pipeline.Hired, color: '#10b981' },
            ],
            recentActivity,
        });
    } catch (err) {
        console.error('GET /stats error:', err);
        return res.status(500).json({ error: 'Failed to fetch stats' });
    }
});


// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function formatRelativeDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

module.exports = router;
