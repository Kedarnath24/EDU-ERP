import { useState, useEffect, useCallback } from 'react';
import { useRoute } from 'wouter';
import { getPublicForm, submitPublicForm } from '@/lib/api';
import type { FormField } from '@/lib/api';

export default function PublicFormPage() {
  const [, params] = useRoute('/form/fill/:id');
  const formId = params?.id || '';

  const [form, setForm] = useState<{ id: string; title: string; description?: string; fields: FormField[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchForm = useCallback(async () => {
    if (!formId) return;
    setLoading(true);
    const { data, error: err } = await getPublicForm(formId);
    if (err) {
      setError(err);
    } else if (data) {
      setForm(data);
    }
    setLoading(false);
  }, [formId]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const updateAnswer = (fieldId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // Validate required fields
    for (const field of form.fields) {
      if (field.required && field.id) {
        const val = answers[field.id];
        if (!val || val.trim() === '') {
          setSubmitError(`"${field.label}" is required`);
          return;
        }
      }
    }

    setSubmitting(true);
    setSubmitError('');
    const { error: err } = await submitPublicForm(formId, {
      respondentName: respondentName.trim() || undefined,
      respondentEmail: respondentEmail.trim() || undefined,
      answers,
    });
    setSubmitting(false);

    if (err) {
      setSubmitError(err);
    } else {
      setSubmitted(true);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <div style={styles.loadingWrapper}>
            <div style={styles.spinner} />
            <p style={{ color: '#6b7280', marginTop: 16 }}>Loading form...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error / not found
  if (error || !form) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <div style={styles.errorCard}>
            <div style={styles.errorIcon}>!</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1f2937', margin: '16px 0 8px' }}>
              Form Not Available
            </h2>
            <p style={{ color: '#6b7280' }}>
              {error || 'This form does not exist or is no longer accepting responses.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1f2937', margin: '16px 0 8px' }}>
              Thank You!
            </h2>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
              Your response has been submitted successfully.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setAnswers({});
                setRespondentName('');
                setRespondentEmail('');
              }}
              style={styles.secondaryBtn}
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {/* Form Header */}
        <div style={styles.formHeader}>
          <h1 style={styles.formTitle}>{form.title}</h1>
          {form.description && (
            <p style={styles.formDescription}>{form.description}</p>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={styles.formBody}>
          {/* Name & Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Your Name
            </label>
            <input
              type="text"
              value={respondentName}
              onChange={e => setRespondentName(e.target.value)}
              placeholder="Enter your full name"
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Your Email
            </label>
            <input
              type="email"
              value={respondentEmail}
              onChange={e => setRespondentEmail(e.target.value)}
              placeholder="Enter your email address"
              style={styles.input}
            />
          </div>

          <hr style={styles.divider} />

          {/* Dynamic Fields */}
          {form.fields.map(field => (
            <div key={field.id} style={styles.fieldGroup}>
              <label style={styles.label}>
                {field.label}
                {field.required && <span style={styles.required}> *</span>}
              </label>
              {renderField(field, answers[field.id || ''] || '', (val) => updateAnswer(field.id || '', val))}
            </div>
          ))}

          {/* Error */}
          {submitError && (
            <div style={styles.errorMsg}>
              {submitError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.submitBtn,
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Response'}
          </button>
        </form>
      </div>
    </div>
  );
}

function renderField(
  field: FormField,
  value: string,
  onChange: (val: string) => void
) {
  const type = field.type;

  if (type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || ''}
        rows={4}
        style={{ ...styles.input, minHeight: 100, resize: 'vertical' as const }}
      />
    );
  }

  if (type === 'select') {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={styles.input}
      >
        <option value="">{field.placeholder || 'Select an option'}</option>
        {(field.options || []).map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (type === 'radio') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(field.options || []).map((opt, i) => (
          <label key={i} style={styles.radioLabel}>
            <input
              type="radio"
              name={`field-${field.id}`}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              style={{ marginRight: 8 }}
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  if (type === 'checkbox') {
    const selected = value ? value.split(',').filter(Boolean) : [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(field.options || []).map((opt, i) => (
          <label key={i} style={styles.radioLabel}>
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={e => {
                const next = e.target.checked
                  ? [...selected, opt]
                  : selected.filter(s => s !== opt);
                onChange(next.join(','));
              }}
              style={{ marginRight: 8 }}
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  // Default: text, email, phone, number, date, url, file
  const inputType =
    type === 'email' ? 'email' :
    type === 'phone' ? 'tel' :
    type === 'number' ? 'number' :
    type === 'date' ? 'date' :
    type === 'url' ? 'url' :
    'text';

  return (
    <input
      type={inputType}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder || ''}
      style={styles.input}
    />
  );
}

// ─── Inline Styles (standalone page, no Tailwind dependency) ───

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    width: '100%',
    maxWidth: 640,
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e5e7eb',
    borderTopColor: '#7c3aed',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '48px 32px',
    textAlign: 'center' as const,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#fef2f2',
    color: '#ef4444',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: 700,
  },
  successCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '48px 32px',
    textAlign: 'center' as const,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#f0fdf4',
    color: '#22c55e',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
  },
  formHeader: {
    background: '#7c3aed',
    borderRadius: '12px 12px 0 0',
    padding: '32px 28px',
    color: '#fff',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
  },
  formDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
    lineHeight: 1.5,
  },
  formBody: {
    background: '#fff',
    borderRadius: '0 0 12px 12px',
    padding: '28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    display: 'block',
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
    background: '#fff',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 14,
    color: '#374151',
    cursor: 'pointer',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '24px 0',
  },
  errorMsg: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    background: '#7c3aed',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  secondaryBtn: {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#7c3aed',
    background: '#f5f3ff',
    border: '1px solid #ddd6fe',
    borderRadius: 8,
    cursor: 'pointer',
  },
};
