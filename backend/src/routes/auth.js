const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { validateLogin, validateForgotPassword, validateCreateUser } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

// ─────────────────────────────────────────────
// POST /api/auth/create-user
// Admin creates a new user with credentials and
// inserts a matching employee record.
// ─────────────────────────────────────────────
router.post('/create-user', requireAuth, validateCreateUser, async (req, res) => {
  try {
    const { email, password, role, full_name } = req.body;

    // 1. Create Supabase Auth user (admin API – no confirmation email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm so the user can log in immediately
      user_metadata: {
        full_name: full_name || email.split('@')[0],
        role: role || 'member',
      },
    });

    if (authError) {
      console.error('Create auth user error:', authError);
      const status = authError.status || 400;
      return res.status(status).json({ error: authError.message });
    }

    const newUser = authData.user;

    // 2. Insert a matching employee record
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .insert({
        user_id: newUser.id,
        full_name: full_name || email.split('@')[0],
        email: newUser.email,
        status: 'active',
      })
      .select()
      .single();

    if (empError) {
      console.error('Create employee error:', empError);
      // Auth user was created – still return partial success
      return res.status(201).json({
        message: 'User created but employee profile failed. Contact admin.',
        user: newUser,
        employee: null,
      });
    }

    return res.status(201).json({
      message: 'Team member created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: role || 'member',
      },
      employee,
    });
  } catch (err) {
    console.error('Create user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Supabase returns descriptive messages – map common ones for UX
      const status = error.status || 401;
      return res.status(status).json({
        error: error.message || 'Invalid login credentials',
      });
    }

    // Return session + user to the frontend
    return res.json({
      message: 'Login successful',
      session: data.session,
      user: data.user,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────
router.post('/forgot-password', validateForgotPassword, async (req, res) => {
  try {
    const { email } = req.body;

    const redirectTo = `${process.env.FRONTEND_URL || 'http://localhost:5176'}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error('Forgot password error:', error);
      // Don't reveal whether the email exists – always respond with success
      // unless it's a rate-limit or server error
      if (error.status && error.status >= 500) {
        return res.status(500).json({ error: 'Failed to send reset email. Try again later.' });
      }
    }

    // Always return success to prevent email enumeration
    return res.json({
      message: 'If that email is registered, a password reset link has been sent.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.split(' ')[1];

    // Sign out the user's session via Supabase Admin API
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      console.error('Logout error:', error);
      // Still return success – the frontend will clear local state regardless
    }

    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/me
// Returns the current user from a valid access token
// ─────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.split(' ')[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    return res.json({ user: data.user });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/refresh
// Refresh the session using a refresh token
// ─────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      return res.status(401).json({ error: 'Failed to refresh session' });
    }

    return res.json({
      session: data.session,
      user: data.user,
    });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
