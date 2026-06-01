import '../styles.css';

const nodes = {
  loading: document.getElementById('dash-loading'),
  gate: document.getElementById('dash-gate'),
  app: document.getElementById('dash-app'),
  userChip: document.getElementById('dash-user'),
  avatar: document.getElementById('dash-avatar'),
  userName: document.getElementById('dash-user-name'),
  greeting: document.getElementById('dash-greeting'),
  status: document.getElementById('dash-status'),
  count: document.getElementById('dash-count'),
  form: document.getElementById('submission-form'),
  feedback: document.getElementById('submission-feedback'),
  button: document.getElementById('submission-button'),
  list: document.getElementById('submission-list'),
  profileName: document.getElementById('profile-name'),
  profileEmail: document.getElementById('profile-email'),
  profileVerification: document.getElementById('profile-verification'),
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function show(node) {
  if (node) node.hidden = false;
}

function hide(node) {
  if (node) node.hidden = true;
}

function showGate() {
  hide(nodes.loading);
  hide(nodes.app);
  show(nodes.gate);
}

function showApp(user) {
  hide(nodes.loading);
  hide(nodes.gate);
  show(nodes.app);

  const displayName = user?.display_name || user?.first_name || user?.email || 'Hack Club member';

  if (nodes.userName) nodes.userName.textContent = displayName;
  if (nodes.greeting) nodes.greeting.textContent = `Welcome back, ${displayName.split(' ')[0]}`;
  show(nodes.userChip);

  if (nodes.avatar) {
    if (user?.avatar) {
      nodes.avatar.src = user.avatar;
    } else {
      nodes.avatar.hidden = true;
    }
  }

  if (nodes.profileName) nodes.profileName.textContent = displayName;
  if (nodes.profileEmail) nodes.profileEmail.textContent = user?.email || 'Not provided';
  if (nodes.profileVerification) {
    nodes.profileVerification.textContent = user?.verification_status
      ? user.verification_status.replace(/_/g, ' ')
      : 'Unknown';
  }
}

function renderSubmissionItem(submission) {
  const item = document.createElement('article');
  item.className = 'dashboard-list__item';
  const link = submission.url
    ? `<a href="${escapeHtml(submission.url)}" target="_blank" rel="noopener noreferrer">Open link</a>`
    : '';
  item.innerHTML = `
    <div class="dashboard-list__item-head">
      <h4>${escapeHtml(submission.title)}</h4>
      <span>${escapeHtml(submission.status || submission.category || 'Submitted')}</span>
    </div>
    <p>${escapeHtml(submission.notes || 'No notes provided.')}</p>
    ${link}
  `;
  return item;
}

async function loadSubmissions() {
  if (!nodes.list) return;

  try {
    const response = await fetch('/api/submissions', { credentials: 'include' });
    const data = response.ok ? await response.json() : { submissions: [] };
    const submissions = data.submissions || [];

    if (nodes.count) nodes.count.textContent = String(submissions.length);

    nodes.list.innerHTML = '';

    if (!submissions.length) {
      nodes.list.innerHTML = '<p class="dashboard-list__empty">No submissions yet. Log your first fix above.</p>';
      return;
    }

    submissions.forEach((submission) => {
      nodes.list.appendChild(renderSubmissionItem(submission));
    });
  } catch (error) {
    console.error('Error loading submissions:', error);
    nodes.list.innerHTML = '<p class="dashboard-list__empty">Could not load submissions.</p>';
  }
}

async function init() {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await response.json();

    if (data?.signedIn && data.user) {
      showApp(data.user);
      await loadSubmissions();
    } else {
      showGate();
    }
  } catch (error) {
    console.error('Error loading session:', error);
    showGate();
  }
}

if (nodes.form) {
  nodes.form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (nodes.button) nodes.button.disabled = true;
    if (nodes.feedback) nodes.feedback.textContent = 'Submitting...';

    const payload = Object.fromEntries(new FormData(nodes.form).entries());

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      nodes.form.reset();
      if (nodes.feedback) nodes.feedback.textContent = 'Submitted. Your contribution has been logged.';
      await loadSubmissions();
    } catch (error) {
      console.error('Error submitting form:', error);
      if (nodes.feedback) nodes.feedback.textContent = error.message || 'Could not submit right now.';
    } finally {
      if (nodes.button) nodes.button.disabled = false;
    }
  });
}

// Smooth scroll for the sidebar nav.
document.querySelectorAll('.dash-nav__link').forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    if (!targetId || !targetId.startsWith('#')) return;

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

init();
