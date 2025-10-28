// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

const fetchBtn = document.getElementById('getImageBtn');
const gallery = document.getElementById('gallery');
const container = document.querySelector('.container');
const filters = document.querySelector('.filters');

// Simple “Did You Know?” facts
const DID_YOU_KNOW = [
  'The Milky Way is about 100,000 light-years across.',
  'A day on Venus is longer than a year on Venus.',
  'Neutron stars can spin hundreds of times per second.',
  'Jupiter has at least 95 known moons.',
  'Some exoplanets may have diamond rain.',
  'The Sun holds 99.86% of the solar system’s mass.',
  'On Mars, sunsets can appear blue.',
  'Saturn would float in water (if a big enough tub existed!).'
];

// ---------- Helpers ----------
const pad = (n) => String(n).padStart(2, '0');

const parseISO = (iso) => {
  // iso like "2025-10-01"
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatHumanDate = (iso) => {
  const d = parseISO(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
};

const isYouTube = (url) => /youtube\.com|youtu\.be/.test(url);

// Build a YouTube thumbnail if needed
const youTubeThumb = (url) => {
  const match =
    url.match(/embed\/([\w-]{6,})/) ||
    url.match(/[?&]v=([\w-]{6,})/) ||
    url.match(/youtu\.be\/([\w-]{6,})/);
  const id = match && match[1];
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
};

// ---------- UI: Loading + Error ----------
const showLoading = () => {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🔄</div>
      <p>Loading space photos…</p>
    </div>
  `;
};

const showError = (msg) => {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">⚠️</div>
      <p>${msg}</p>
    </div>
  `;
};

// ---------- Cards + Gallery ----------
const createCardHTML = (item) => {
  const isImg = item.media_type === 'image';
  const thumb = isImg
    ? item.url
    : (item.thumbnail_url || (isYouTube(item.url) ? youTubeThumb(item.url) : '') || item.url);

  const badge = isImg ? '' : `<span class="badge">Video</span>`;

  return `
    <div class="gallery-item" data-date="${item.date}">
      <div class="thumb-wrap">
        ${badge}
        <img src="${thumb}" alt="${item.title}">
      </div>
      <p><strong>${item.title}</strong><br>${formatHumanDate(item.date)}</p>
    </div>
  `;
};

const renderGallery = (items) => {
  // Sort by date (newest first) and take exactly 9
  const sorted = [...items].sort((a, b) => parseISO(b.date) - parseISO(a.date));
  const nine = sorted.slice(0, 9);

  // Build HTML
  gallery.innerHTML = nine.map(createCardHTML).join('');

  // Attach click → modal
  const cards = gallery.querySelectorAll('.gallery-item');
  cards.forEach((card, i) => {
    const item = nine[i];
    card.addEventListener('click', () => openModal(item));
  });
};

// ---------- Modal ----------
const ensureModalStyles = () => {
  if (document.getElementById('modal-style')) return;
  const style = document.createElement('style');
  style.id = 'modal-style';
  style.textContent = `
    .modal { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; }
    .modal__backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.65); }
    .modal__dialog { position: relative; background: #fff; color: #212121; max-width: 960px; width: calc(100% - 40px);
      border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.25); overflow: hidden; }
    .modal__close { position: absolute; top: 8px; right: 12px; font-size: 28px; line-height: 1; background: transparent; border: 0; cursor: pointer; }
    .modal__media { width: 100%; height: auto; display: block; }
    .modal__iframe { width: 100%; aspect-ratio: 16/9; border: 0; display: block; }
    .modal__body { padding: 12px 16px 18px; }
    .modal__title { margin: 0 0 4px; font-weight: bold; }
    .modal__date { margin: 0 0 10px; color: #666; font-size: 14px; }
    .modal__text { line-height: 1.55; font-size: 15px; }
  `;
  document.head.appendChild(style);
};

const openModal = (item) => {
  ensureModalStyles();

  // Remove existing
  document.getElementById('modal')?.remove();

  // Decide media
  let mediaHTML = '';
  if (item.media_type === 'image') {
    const large = item.hdurl || item.url;
    mediaHTML = `<img class="modal__media" src="${large}" alt="${item.title}">`;
  } else if (item.media_type === 'video') {
    if (isYouTube(item.url)) {
      mediaHTML = `<iframe class="modal__iframe" src="${item.url}" allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe>`;
    } else {
      const thumb = item.thumbnail_url || youTubeThumb(item.url) || '';
      mediaHTML = `
        ${thumb ? `<img class="modal__media" src="${thumb}" alt="${item.title} (video)">` : ''}
        <div style="padding:12px 16px 0;">
          <a href="${item.url}" target="_blank" rel="noreferrer">Open video ↗</a>
        </div>`;
    }
  } else {
    mediaHTML = `<div class="modal__body">Unsupported media type: ${item.media_type}</div>`;
  }

  // Build modal
  const html = `
    <div id="modal" class="modal" role="dialog" aria-label="${item.title}">
      <div class="modal__backdrop"></div>
      <div class="modal__dialog">
        <button class="modal__close" aria-label="Close modal">&times;</button>
        ${mediaHTML}
        <div class="modal__body">
          <h2 class="modal__title">${item.title}</h2>
          <p class="modal__date">${formatHumanDate(item.date)}</p>
          <p class="modal__text">${item.explanation}</p>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  // Close interactions
  const modal = document.getElementById('modal');
  modal.querySelector('.modal__close').addEventListener('click', () => modal.remove());
  modal.querySelector('.modal__backdrop').addEventListener('click', () => modal.remove());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.remove(); }, { once: true });
};

// ---------- Did You Know banner ----------
const injectFactBanner = () => {
  const fact = DID_YOU_KNOW[Math.floor(Math.random() * DID_YOU_KNOW.length)];
  const banner = document.createElement('div');
  banner.className = 'did-you-know';
  banner.innerHTML = `<strong>Did You Know?</strong> ${fact}`;
  container.insertBefore(banner, filters.nextSibling);
};

// ---------- Main button click ----------
fetchBtn.addEventListener('click', () => {
  showLoading();

  fetch(apodData)
    .then((res) => {
      if (!res.ok) throw new Error(`Network error: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      // Ensure it's an array and filter out invalid entries
      const items = Array.isArray(data) ? data.filter(Boolean) : [];
      if (!items.length) {
        showError('No APOD entries found.');
        return;
      }
      renderGallery(items); // renders exactly 9 newest
    })
    .catch((err) => {
      console.error(err);
      showError('Could not load NASA images. Please try again.');
    });
});

// ---------- On page load ----------
injectFactBanner();