const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// PUBLIC ROUTES (no auth — used by career-landing page)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/forms/:id/public
 * Returns form structure (title, description, fields) for public rendering.
 */
router.get('/:id/public', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, title, description, status')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (formError || !form) {
      return res.status(404).json({ error: 'Form not found or inactive' });
    }

    const { data: fields, error: fieldsError } = await supabase
      .from('form_fields')
      .select('id, label, field_type, placeholder, required, options, field_order')
      .eq('form_id', id)
      .order('field_order', { ascending: true });

    if (fieldsError) throw fieldsError;

    return res.json({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        fields: (fields || []).map(f => ({
          id: f.id,
          label: f.label,
          type: f.field_type,
          placeholder: f.placeholder,
          required: f.required,
          options: f.options || [],
          order: f.field_order,
        })),
      },
    });
  } catch (err) {
    console.error('GET /forms/:id/public error:', err);
    return res.status(500).json({ error: 'Failed to fetch form' });
  }
});

/**
 * POST /api/forms/:id/submit
 * Public endpoint — submit a form response (from career-landing page).
 * Body: { jobId?, respondentName?, respondentEmail?, answers: { fieldId: value, ... } }
 */
router.post('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { jobId, respondentName, respondentEmail, answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'answers object is required' });
    }

    // Verify form exists and is active
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, status')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (formError || !form) {
      return res.status(404).json({ error: 'Form not found or inactive' });
    }

    // Get form fields to validate required fields
    const { data: fields, error: fieldsError } = await supabase
      .from('form_fields')
      .select('id, label, required')
      .eq('form_id', id);

    if (fieldsError) throw fieldsError;

    // Validate required fields
    for (const field of (fields || [])) {
      if (field.required) {
        const val = answers[field.id];
        if (val === undefined || val === null || String(val).trim() === '') {
          return res.status(400).json({ error: `"${field.label}" is required` });
        }
      }
    }

    // Create form response
    const { data: response, error: responseError } = await supabase
      .from('form_responses')
      .insert({
        form_id: id,
        job_id: jobId || null,
        respondent_name: respondentName?.trim() || null,
        respondent_email: respondentEmail?.toLowerCase().trim() || null,
      })
      .select()
      .single();

    if (responseError) throw responseError;

    // Insert response data for each answer
    const responseDataRows = Object.entries(answers)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([fieldId, value]) => ({
        response_id: response.id,
        field_id: fieldId,
        value: String(value),
      }));

    if (responseDataRows.length > 0) {
      const { error: dataError } = await supabase
        .from('form_response_data')
        .insert(responseDataRows);

      if (dataError) throw dataError;
    }

    return res.status(201).json({
      message: 'Form submitted successfully',
      responseId: response.id,
    });
  } catch (err) {
    console.error('POST /forms/:id/submit error:', err);
    return res.status(500).json({ error: 'Failed to submit form' });
  }
});


/**
 * GET /api/forms/:id/public-url
 * Returns the shareable public URL for a form.
 */
router.get('/:id/public-url', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, title, status')
      .eq('id', id)
      .single();

    if (formError || !form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Build the public form URL using the frontend origin
    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';
    const publicUrl = `${frontendUrl}/form/fill/${form.id}`;

    return res.json({
      formId: form.id,
      title: form.title,
      status: form.status,
      publicUrl,
    });
  } catch (err) {
    console.error('GET /forms/:id/public-url error:', err);
    return res.status(500).json({ error: 'Failed to generate form URL' });
  }
});


// ═══════════════════════════════════════════════════════════════
// PROTECTED ROUTES (require auth — admin dashboard)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/forms
 * List all forms with response counts.
 */
router.get('/', requireAuth, async (_req, res) => {
  try {
    const { data: forms, error } = await supabase
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get response counts per form
    const formIds = (forms || []).map(f => f.id);
    let responseCounts = {};

    if (formIds.length > 0) {
      const { data: responses, error: rError } = await supabase
        .from('form_responses')
        .select('form_id');

      if (!rError && responses) {
        responseCounts = responses.reduce((acc, r) => {
          acc[r.form_id] = (acc[r.form_id] || 0) + 1;
          return acc;
        }, {});
      }
    }

    const result = (forms || []).map(f => ({
      id: f.id,
      title: f.title,
      description: f.description,
      status: f.status,
      responseCount: responseCounts[f.id] || 0,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    }));

    return res.json({ forms: result });
  } catch (err) {
    console.error('GET /forms error:', err);
    return res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

/**
 * GET /api/forms/:id
 * Get a single form with its fields.
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', id)
      .single();

    if (formError || !form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const { data: fields, error: fieldsError } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', id)
      .order('field_order', { ascending: true });

    if (fieldsError) throw fieldsError;

    return res.json({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        status: form.status,
        createdAt: form.created_at,
        updatedAt: form.updated_at,
        fields: (fields || []).map(f => ({
          id: f.id,
          label: f.label,
          type: f.field_type,
          placeholder: f.placeholder,
          required: f.required,
          options: f.options || [],
          order: f.field_order,
        })),
      },
    });
  } catch (err) {
    console.error('GET /forms/:id error:', err);
    return res.status(500).json({ error: 'Failed to fetch form' });
  }
});

/**
 * POST /api/forms
 * Create a new form with fields.
 * Body: { title, description?, fields: [{ label, type, placeholder?, required?, options?, order }] }
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, fields } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data: form, error: formError } = await supabase
      .from('forms')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        status: 'active',
        created_by: req.user.id,
      })
      .select()
      .single();

    if (formError) throw formError;

    // Insert fields if provided
    let insertedFields = [];
    if (fields && Array.isArray(fields) && fields.length > 0) {
      const fieldRows = fields.map((f, idx) => ({
        form_id: form.id,
        label: f.label,
        field_type: f.type || 'text',
        placeholder: f.placeholder || null,
        required: f.required || false,
        options: f.options || [],
        field_order: f.order !== undefined ? f.order : idx,
      }));

      const { data: fData, error: fError } = await supabase
        .from('form_fields')
        .insert(fieldRows)
        .select();

      if (fError) throw fError;
      insertedFields = fData || [];
    }

    return res.status(201).json({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        status: form.status,
        createdAt: form.created_at,
        fields: insertedFields.map(f => ({
          id: f.id,
          label: f.label,
          type: f.field_type,
          placeholder: f.placeholder,
          required: f.required,
          options: f.options || [],
          order: f.field_order,
        })),
      },
    });
  } catch (err) {
    console.error('POST /forms error:', err);
    return res.status(500).json({ error: 'Failed to create form' });
  }
});

/**
 * PUT /api/forms/:id
 * Update form title/description/status and replace fields.
 * Body: { title?, description?, status?, fields?: [{ id?, label, type, placeholder?, required?, options?, order }] }
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, fields } = req.body;

    // Update form metadata
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('forms')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
    }

    // Replace fields if provided (delete old ones and insert new)
    if (fields && Array.isArray(fields)) {
      // Delete existing fields
      const { error: deleteError } = await supabase
        .from('form_fields')
        .delete()
        .eq('form_id', id);

      if (deleteError) throw deleteError;

      // Insert new fields
      if (fields.length > 0) {
        const fieldRows = fields.map((f, idx) => ({
          form_id: id,
          label: f.label,
          field_type: f.type || 'text',
          placeholder: f.placeholder || null,
          required: f.required || false,
          options: f.options || [],
          field_order: f.order !== undefined ? f.order : idx,
        }));

        const { error: insertError } = await supabase
          .from('form_fields')
          .insert(fieldRows);

        if (insertError) throw insertError;
      }
    }

    // Return updated form
    const { data: form, error: fetchError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { data: updatedFields } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', id)
      .order('field_order', { ascending: true });

    return res.json({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        status: form.status,
        createdAt: form.created_at,
        updatedAt: form.updated_at,
        fields: (updatedFields || []).map(f => ({
          id: f.id,
          label: f.label,
          type: f.field_type,
          placeholder: f.placeholder,
          required: f.required,
          options: f.options || [],
          order: f.field_order,
        })),
      },
    });
  } catch (err) {
    console.error('PUT /forms/:id error:', err);
    return res.status(500).json({ error: 'Failed to update form' });
  }
});

/**
 * DELETE /api/forms/:id
 * Delete a form and all its fields/responses.
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.json({ message: 'Form deleted successfully' });
  } catch (err) {
    console.error('DELETE /forms/:id error:', err);
    return res.status(500).json({ error: 'Failed to delete form' });
  }
});

/**
 * GET /api/forms/:id/responses
 * Get all responses for a form with their data.
 */
router.get('/:id/responses', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify form exists
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, title')
      .eq('id', id)
      .single();

    if (formError || !form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Get fields for column headers
    const { data: fields, error: fieldsError } = await supabase
      .from('form_fields')
      .select('id, label, field_type, field_order')
      .eq('form_id', id)
      .order('field_order', { ascending: true });

    if (fieldsError) throw fieldsError;

    // Get all responses
    const { data: responses, error: responsesError } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', id)
      .order('submitted_at', { ascending: false });

    if (responsesError) throw responsesError;

    // Get response data for all responses
    const responseIds = (responses || []).map(r => r.id);
    let allResponseData = [];

    if (responseIds.length > 0) {
      const { data: rData, error: rDataError } = await supabase
        .from('form_response_data')
        .select('*')
        .in('response_id', responseIds);

      if (!rDataError && rData) {
        allResponseData = rData;
      }
    }

    // Group response data by response_id
    const dataByResponse = allResponseData.reduce((acc, d) => {
      if (!acc[d.response_id]) acc[d.response_id] = {};
      acc[d.response_id][d.field_id] = d.value;
      return acc;
    }, {});

    const result = (responses || []).map(r => ({
      id: r.id,
      respondentName: r.respondent_name,
      respondentEmail: r.respondent_email,
      jobId: r.job_id,
      submittedAt: r.submitted_at,
      answers: dataByResponse[r.id] || {},
    }));

    return res.json({
      formTitle: form.title,
      fields: (fields || []).map(f => ({
        id: f.id,
        label: f.label,
        type: f.field_type,
        order: f.field_order,
      })),
      responses: result,
      total: result.length,
    });
  } catch (err) {
    console.error('GET /forms/:id/responses error:', err);
    return res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

module.exports = router;
