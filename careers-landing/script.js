/* ═══════════════════════════════════════════════════════
   EDU-ERP Careers Landing Page — JavaScript
   Fetches real job data from the backend API.
   Handles rendering, filtering, search, modals, applications.
   ═══════════════════════════════════════════════════════ */

// ─── Configuration ───
const API_BASE_URL = 'http://localhost:5001';

// ─── State ───
let JOBS = [];

// ─── DOM References ───
const jobsGrid = document.getElementById('jobs-grid');
const noResults = document.getElementById('no-results');
const searchInput = document.getElementById('search-input');
const filterDept = document.getElementById('filter-department');
const filterType = document.getElementById('filter-type');
const filterMode = document.getElementById('filter-mode');
const resultsCount = document.getElementById('results-count');
const clearFiltersBtn = document.getElementById('clear-filters');
const modalOverlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const navbar = document.getElementById('navbar');

// ─── Fetch Jobs from Backend ───
async function fetchJobs() {
    try {
        resultsCount.textContent = 'Loading positions...';
        const res = await fetch(`${API_BASE_URL}/api/recruitment/jobs/public`);
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const data = await res.json();
        JOBS = data.jobs || [];
        populateFilters();
        renderJobs(JOBS);
        initHeroStats();
    } catch (err) {
        console.error('Error fetching jobs:', err);
        resultsCount.textContent = 'Unable to load positions. Please try again later.';
        JOBS = [];
        renderJobs([]);
    }
}

// ─── Populate Filter Dropdowns ───
function populateFilters() {
    const departments = [...new Set(JOBS.map(j => j.department))].sort();
    const types = [...new Set(JOBS.map(j => j.type))].sort();
    const modes = [...new Set(JOBS.map(j => j.workMode))].sort();

    // Clear existing options (except first "All" option)
    [filterDept, filterType, filterMode].forEach(sel => {
        while (sel.options.length > 1) sel.remove(1);
    });

    departments.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        filterDept.appendChild(opt);
    });

    types.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        filterType.appendChild(opt);
    });

    modes.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        filterMode.appendChild(opt);
    });
}

// ─── SVG Icons ───
const ICONS = {
    location: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    briefcase: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
    clock: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    type: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    mode: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
    users: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    arrow: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
    check: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    loader: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><circle cx="12" cy="12" r="10" opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" opacity="1"></path></svg>`,
};

// ─── Helpers ───
function getStatusClass(status) {
    if (status === 'Active') return 'active';
    if (status === 'Closing Soon') return 'closing';
    return 'closed';
}

function formatSalary(min, max) {
    if (!min && !max) return 'Competitive';
    if (min && max) return `$${min} – $${max}`;
    return min ? `From $${min}` : `Up to $${max}`;
}

// ─── Render Job Cards ───
function renderJobs(jobs) {
    jobsGrid.innerHTML = '';

    if (jobs.length === 0) {
        noResults.style.display = 'block';
        resultsCount.textContent = 'No positions found';
        return;
    }

    noResults.style.display = 'none';
    resultsCount.textContent = `Showing ${jobs.length} position${jobs.length > 1 ? 's' : ''}`;

    jobs.forEach((job, i) => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.style.animationDelay = `${i * 0.06}s`;
        card.onclick = () => openModal(job);

        const skillsHtml = job.skills.slice(0, 4).map(s => `<span class="skill-tag">${s}</span>`).join('');
        const extraSkills = job.skills.length > 4 ? `<span class="skill-tag">+${job.skills.length - 4}</span>` : '';

        card.innerHTML = `
      <div class="job-card-header">
        <h3 class="job-card-title">${job.title}</h3>
        <span class="job-status-badge ${getStatusClass(job.status)}">${job.status}</span>
      </div>
      <div class="job-card-dept">${ICONS.briefcase} ${job.department}</div>
      <div class="job-card-meta">
        <span class="meta-tag">${ICONS.location} ${job.location}</span>
        <span class="meta-tag">${ICONS.type} ${job.type}</span>
        <span class="meta-tag">${ICONS.mode} ${job.workMode}</span>
        ${job.openings > 1 ? `<span class="meta-tag">${ICONS.users} ${job.openings} openings</span>` : ''}
      </div>
      <p class="job-card-desc">${job.description || ''}</p>
      <div class="job-card-skills">${skillsHtml}${extraSkills}</div>
      <div class="job-card-footer">
        <span class="job-salary">${formatSalary(job.salaryMin, job.salaryMax)} <span>/ yr</span></span>
        <span class="job-posted">${ICONS.clock} ${job.postedDate}</span>
      </div>
    `;

        jobsGrid.appendChild(card);
    });
}

// ─── Filter Logic ───
function getFilteredJobs() {
    const query = searchInput.value.toLowerCase().trim();
    const dept = filterDept.value;
    const type = filterType.value;
    const mode = filterMode.value;

    const hasFilter = query || dept || type || mode;
    clearFiltersBtn.style.display = hasFilter ? 'inline-flex' : 'none';

    return JOBS.filter(job => {
        if (dept && job.department !== dept) return false;
        if (type && job.type !== type) return false;
        if (mode && job.workMode !== mode) return false;
        if (query) {
            const searchable = [
                job.title,
                job.department,
                job.location,
                job.type,
                job.description,
                ...job.skills,
            ].join(' ').toLowerCase();
            if (!searchable.includes(query)) return false;
        }
        return true;
    });
}

function applyFilters() {
    const filtered = getFilteredJobs();
    renderJobs(filtered);
}

// ─── Event Listeners ───
searchInput.addEventListener('input', applyFilters);
filterDept.addEventListener('change', applyFilters);
filterType.addEventListener('change', applyFilters);
filterMode.addEventListener('change', applyFilters);

clearFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    filterDept.value = '';
    filterType.value = '';
    filterMode.value = '';
    applyFilters();
});

// ─── Modal ───
function openModal(job) {
    const responsibilitiesList = job.responsibilities
        ? job.responsibilities.split('\n').filter(Boolean).map(r => `<li>${r}</li>`).join('')
        : '';
    const requirementsList = job.requirements
        ? job.requirements.split('\n').filter(Boolean).map(r => `<li>${r}</li>`).join('')
        : '';
    const benefitsList = job.benefits
        ? job.benefits.split('\n').filter(Boolean).map(b => `<li>${b}</li>`).join('')
        : '';
    const skillsHtml = job.skills.map(s => `<span class="modal-skill-tag">${s}</span>`).join('');

    modalBody.innerHTML = `
    <div class="modal-header-gradient"></div>
    <h2 class="modal-job-title">${job.title}</h2>
    <div class="modal-job-dept">${job.department}</div>

    <div class="modal-meta-grid">
      <div class="modal-meta-item">
        <div class="modal-meta-label">Location</div>
        <div class="modal-meta-value">${job.location}</div>
      </div>
      <div class="modal-meta-item">
        <div class="modal-meta-label">Type</div>
        <div class="modal-meta-value">${job.type}</div>
      </div>
      <div class="modal-meta-item">
        <div class="modal-meta-label">Work Mode</div>
        <div class="modal-meta-value">${job.workMode}</div>
      </div>
      <div class="modal-meta-item">
        <div class="modal-meta-label">Experience</div>
        <div class="modal-meta-value">${job.experience}</div>
      </div>
      <div class="modal-meta-item">
        <div class="modal-meta-label">Salary</div>
        <div class="modal-meta-value">${formatSalary(job.salaryMin, job.salaryMax)}</div>
      </div>
      <div class="modal-meta-item">
        <div class="modal-meta-label">Openings</div>
        <div class="modal-meta-value">${job.openings}</div>
      </div>
      <div class="modal-meta-item">
        <div class="modal-meta-label">Education</div>
        <div class="modal-meta-value">${job.education}</div>
      </div>
      <div class="modal-meta-item">
        <div class="modal-meta-label">Deadline</div>
        <div class="modal-meta-value">${job.deadline ? new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Open'}</div>
      </div>
    </div>

    <div class="modal-section">
      <h3 class="modal-section-title">About This Role</h3>
      <p>${job.description || 'No description provided.'}</p>
    </div>

    ${responsibilitiesList ? `
    <div class="modal-section">
      <h3 class="modal-section-title">Key Responsibilities</h3>
      <ul>${responsibilitiesList}</ul>
    </div>` : ''}

    ${requirementsList ? `
    <div class="modal-section">
      <h3 class="modal-section-title">Requirements</h3>
      <ul>${requirementsList}</ul>
    </div>` : ''}

    ${job.skills.length ? `
    <div class="modal-section">
      <h3 class="modal-section-title">Required Skills</h3>
      <div class="modal-skills-wrap">${skillsHtml}</div>
    </div>` : ''}

    ${benefitsList ? `
    <div class="modal-section">
      <h3 class="modal-section-title">Benefits & Perks</h3>
      <ul>${benefitsList}</ul>
    </div>` : ''}

    <!-- ═══════════ Application Form ═══════════ -->
    <div class="apply-form-section">
      <h3 class="modal-section-title">Apply for this Position</h3>
      <form id="apply-form" class="apply-form" onsubmit="return false;">
        <div class="apply-form-grid">
          <div class="apply-form-field">
            <label for="apply-name">Full Name <span class="required">*</span></label>
            <input type="text" id="apply-name" placeholder="Enter your full name" required />
          </div>
          <div class="apply-form-field">
            <label for="apply-email">Email Address <span class="required">*</span></label>
            <input type="email" id="apply-email" placeholder="you@example.com" required />
          </div>
          <div class="apply-form-field apply-form-field-full">
            <label for="apply-phone">Phone Number</label>
            <input type="tel" id="apply-phone" placeholder="+91 98765 43210" />
          </div>
        </div>
        <button type="button" id="apply-submit-btn" class="modal-apply-btn" onclick="submitApplication('${job.id}')">
          Apply Now ${ICONS.arrow}
        </button>
        <div id="apply-status" class="apply-status"></div>
      </form>
    </div>
  `;

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

// ─── Submit Application ───
async function submitApplication(jobId) {
    const nameInput = document.getElementById('apply-name');
    const emailInput = document.getElementById('apply-email');
    const phoneInput = document.getElementById('apply-phone');
    const submitBtn = document.getElementById('apply-submit-btn');
    const statusDiv = document.getElementById('apply-status');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();

    // Validation
    if (!name) {
        showApplyStatus('Please enter your full name.', 'error');
        nameInput.focus();
        return;
    }
    if (!email || !email.includes('@')) {
        showApplyStatus('Please enter a valid email address.', 'error');
        emailInput.focus();
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `${ICONS.loader} Submitting...`;
    statusDiv.textContent = '';
    statusDiv.className = 'apply-status';

    try {
        const res = await fetch(`${API_BASE_URL}/api/recruitment/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_id: jobId, name, email, phone: phone || null }),
        });

        const data = await res.json();

        if (!res.ok) {
            showApplyStatus(data.error || 'Something went wrong. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Apply Now ${ICONS.arrow}`;
            return;
        }

        // Success!
        showApplyStatus('🎉 Application submitted successfully! We\'ll be in touch soon.', 'success');
        submitBtn.innerHTML = `${ICONS.check} Applied!`;
        submitBtn.classList.add('applied');

        // Clear fields
        nameInput.value = '';
        emailInput.value = '';
        phoneInput.value = '';

        // Keep button disabled — user has applied
    } catch (err) {
        console.error('Application error:', err);
        showApplyStatus('Network error. Please check your connection and try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Apply Now ${ICONS.arrow}`;
    }
}

function showApplyStatus(message, type) {
    const statusDiv = document.getElementById('apply-status');
    statusDiv.textContent = message;
    statusDiv.className = `apply-status apply-status-${type}`;
}

function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ─── Navbar Scroll Effect ───
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 60) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    lastScroll = scrollY;
});

// ─── Hero Stats Counter Animation ───
function animateCounter(el, target) {
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 30));
    const interval = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        el.textContent = current;
    }, 40);
}

function initHeroStats() {
    const departments = new Set(JOBS.map(j => j.department));
    const locations = new Set(JOBS.map(j => j.location));

    animateCounter(document.getElementById('stat-jobs'), JOBS.length);
    animateCounter(document.getElementById('stat-departments'), departments.size);
    animateCounter(document.getElementById('stat-locations'), locations.size);
}

// ─── Scroll Reveal Animations ───
function initScrollAnimations() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const delay = entry.target.getAttribute('data-delay') || 0;
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, parseInt(delay));
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
}

// ─── Initialize ───
function init() {
    fetchJobs();
    initScrollAnimations();
}

document.addEventListener('DOMContentLoaded', init);
