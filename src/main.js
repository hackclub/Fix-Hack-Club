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

async function loadListings() {
  try {
    const response = await fetch('/listings.json');
    const data = await response.json();
    const container = document.getElementById('job-listings-container');

    if (!container || !data.listings) return;

    data.listings.forEach((listing) => {
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
async function loadLeaderboard() {
  const response = await fetch(
    "/leaderboard.json"
  );

  const players = await response.json();

  renderLeaderboard(players);
}
function renderLeaderboard(players) {
  const container = document.getElementById(
    "leaderboard-list"
  );

  container.innerHTML = players
    .map(
      (player, index) => `
        <div class="leaderboard-entry ${
          index < 3 ? "top-three" : ""
        }">

          <div class="rank">
            #${index + 1}
          </div>

          <div class="player-info">
            <div class="player-name">
              ${player.name}
            </div>
          </div>

          <div class="player-score">
            ${player.score}
          </div>

        </div>
      `
    )
    .join("");
}

document.addEventListener('DOMContentLoaded', loadListings);

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
loadLeaderboard()
