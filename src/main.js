import '../styles.css';

const toggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (toggle && navLinks) {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href');

      if (!targetId || targetId === '#') {
        return;
      }

      const targetElement = document.querySelector(targetId);

      if (!targetElement) {
        return;
      }

      event.preventDefault();
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function getAuthNodes() {
  return {
    form: document.getElementById('auth-form'),
    button: document.getElementById('auth-button'),
    status: document.getElementById('auth-status'),
    title: document.getElementById('auth-title'),
    copy: document.getElementById('auth-copy'),
  };
}

function getDashboardNodes() {
  return {
    title: document.getElementById('dashboard-title'),
    copy: document.getElementById('dashboard-copy'),
    status: document.getElementById('dashboard-status'),
    user: document.getElementById('dashboard-user'),
    form: document.getElementById('submission-form'),
    feedback: document.getElementById('submission-feedback'),
    button: document.getElementById('submission-button'),
    list: document.getElementById('submission-list'),
    shell: document.getElementById('dashboard-shell'),
  };
}

function renderSubmissionItem(submission) {
  const item = document.createElement('article');
  item.className = 'dashboard-list__item';
  item.innerHTML = `
    <div class="dashboard-list__item-head">
      <h4>${submission.title}</h4>
      <span>${submission.category || 'Other'}</span>
    </div>
    <p>${submission.notes || 'No notes provided.'}</p>
    <a href="${submission.url}" target="_blank" rel="noopener noreferrer">Open link</a>
  `;
  return item;
}

async function loadSubmissions() {
  const nodes = getDashboardNodes();

  if (!nodes.list) {
    return;
  }

  try {
    const response = await fetch('/api/submissions', { credentials: 'include' });
    const data = response.ok ? await response.json() : { submissions: [] };

    nodes.list.innerHTML = '';

    if (!data.submissions?.length) {
      nodes.list.innerHTML = '<p class="dashboard-list__empty">No submissions yet.</p>';
      return;
    }

    data.submissions.forEach((submission) => {
      nodes.list.appendChild(renderSubmissionItem(submission));
    });
  } catch (error) {
    console.error('Error loading submissions:', error);
    nodes.list.innerHTML = '<p class="dashboard-list__empty">Could not load submissions.</p>';
  }
}

async function loadAuthState() {
  const nodes = getAuthNodes();
  const dashboard = getDashboardNodes();

  if (!nodes.form || !nodes.button || !nodes.status || !nodes.title || !nodes.copy) {
    return;
  }

  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await response.json();

    if (data?.signedIn) {
      const displayName = data.user?.display_name || data.user?.name || data.user?.email || 'Hack Club member';
      const email = data.user?.email ? ` ${data.user.email}` : '';

      nodes.title.textContent = `Signed in as ${displayName}`;
      nodes.copy.textContent = `Your Hack Club account is linked.${email}`;
      nodes.status.textContent = 'Profile synced from Hack Club and Airtable.';
      nodes.form.action = '/api/auth/logout';
      nodes.button.textContent = 'Sign out';

      if (dashboard.title && dashboard.copy && dashboard.status && dashboard.user && dashboard.form && dashboard.feedback && dashboard.button) {
        dashboard.title.textContent = 'Ready to submit';
        dashboard.copy.textContent = 'Use this dashboard to send fixes, ideas, and repo details to Airtable.';
        dashboard.status.textContent = 'Signed in';
        dashboard.user.textContent = displayName;
        dashboard.form.classList.add('is-active');
        dashboard.shell?.classList.add('is-signed-in');
        dashboard.feedback.textContent = 'Send a submission to save it to Airtable.';
        dashboard.button.disabled = false;
      }

      loadSubmissions();
    } else {
      nodes.title.textContent = 'Sign in with Hack Club';
      nodes.copy.textContent = 'Link your Hack Club account to save your profile and sync it to Airtable.';
      nodes.status.textContent = 'Not signed in yet.';
      nodes.form.action = '/api/auth/start';
      nodes.button.textContent = 'Link or create Hack Club Account';

      if (dashboard.title && dashboard.copy && dashboard.status && dashboard.user && dashboard.form && dashboard.feedback && dashboard.button) {
        dashboard.title.textContent = 'Sign in to submit a fix';
        dashboard.copy.textContent = 'Once you sign in, you can submit ideas, links, and repo details to the FixHC Airtable base.';
        dashboard.status.textContent = 'Locked';
        dashboard.user.textContent = 'Guest';
        dashboard.form.classList.remove('is-active');
        dashboard.shell?.classList.remove('is-signed-in');
        dashboard.feedback.textContent = 'Sign in to submit.';
        dashboard.button.disabled = true;
      }

      if (dashboard.list) {
        dashboard.list.innerHTML = '<p class="dashboard-list__empty">Sign in to see your submissions.</p>';
      }
    }
  } catch (error) {
    console.error('Error loading auth state:', error);
    nodes.status.textContent = 'Could not load sign-in status right now.';
  }
}

async function loadListings() {
  try {
    const response = await fetch('/api/listings');
    const data = response.ok ? await response.json() : null;
    const fallbackResponse = data?.listings ? null : await fetch('/listings.json');
    const fallbackData = fallbackResponse ? await fallbackResponse.json() : null;
    const listings = data?.listings || fallbackData?.listings || [];
    const container = document.getElementById('job-listings-container');

    if (!container || !listings.length) return;

    listings.forEach((listing) => {
      const ticket = document.createElement('div');
      ticket.className = 'ticketA';
      if (listing.status === 'finished') {
        ticket.classList.add('finished');
      }
      ticket.innerHTML = `
        <div class="ticket-idA">${listing.id}</div>
        <h3><a href="${listing.url}" target="_blank" style="text-decoration: none; color: #ffffff;">${listing.title}</a></h3>
        <p>${listing.description}</p>
        <br>
        <ul style="font-size: 25px;">
          ${listing.requirements.map(req => `<li>${req}</li>`).join('<br>')}
        </ul>
        <div class="btn-row" style="margin-top: 50px;">
          <a href="${listing.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Page Link</a>
          <a href="${listing.github_url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">Github Repository</a>
        </div>
      `;
      container.appendChild(ticket);
    });
  } catch (error) {
    console.error('Error loading listings:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadAuthState();
  loadListings();

  const dashboard = getDashboardNodes();
  if (dashboard.form) {
    dashboard.form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (dashboard.button) {
        dashboard.button.disabled = true;
      }

      if (dashboard.feedback) {
        dashboard.feedback.textContent = 'Submitting...';
      }

      const formData = new FormData(dashboard.form);
      const payload = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('/api/submissions', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Submission failed');
        }

        dashboard.form.reset();
        if (dashboard.feedback) {
          dashboard.feedback.textContent = 'Submitted. It has been saved to Airtable.';
        }
        await loadSubmissions();
      } catch (error) {
        console.error('Error submitting dashboard form:', error);
        if (dashboard.feedback) {
          dashboard.feedback.textContent = error.message || 'Could not submit right now.';
        }
      } finally {
        if (dashboard.button) {
          dashboard.button.disabled = false;
        }
      }
    });
  }
});

const revealItems = document.querySelectorAll(
  '.hero h1, .hero-desc, .btn-row, .hero-note, .section-label, .ticket, .job, .code-block'
);

revealItems.forEach((item, index) => {
  item.classList.add('reveal');
  item.style.transitionDelay = `${(index % 6) * 0.06}s`;
});

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('reveal-show');
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  revealItems.forEach((item) => {
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => {
    item.classList.add('reveal-show');
  });
}