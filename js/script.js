// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

const fetchBtn = document.getElementById('getImageBtn');
const gallery = document.getElementById('gallery');
const container = document.querySelector('.container');
const filters = document.querySelector('.filters');

// Fun Facts
const FACTS = [
  "The Milky Way is about 100,000 light-years across.",
  "A day on Venus is longer than a year on Venus.",
  "Neutron stars can spin hundreds of times per second.",
  "Jupiter has at least 95 known moons.",
  "Some exoplanets may have diamond rain.",
  "The Sun holds 99.86% of the solar system’s mass.",
  "On Mars, sunsets can appear blue.",
  "Saturn would float in water (if a big enough tub existed!)."
];

// Helpers
const parseISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDate = (iso) => {
  const d = parseISO(iso);
  return isNaN(d)
    ? iso
    : d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
};

const isYouTube = (url) =>
  /youtube\.com|youtu\.be/.test(url);

const ytThumb = (url) => {
  const match =
    url.match(/embed\/([\w-]+)/) ||
    url.match(/[?&]v=([\w-]+)/) ||
    url.match(/youtu\.be\/([\w-]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
};

// Loading UI
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

// Build card for gallery
const createCardHTML = (item) => {
  const isImage = item.media_type === "image";
  const thumb = isImage
    ? item.url
    : item.thumbnail_url || ytThumb(item.url) || item.url;

  const videoBadge = isImage ? "" : `<span class="badge">Video</span>`;

  return `
    <div class="gallery-item">
      <div class="thumb-wrap">
        ${videoBadge}
        <img src="${thumb}" alt="${item.title}">
      </div>
      <p>
        <strong>${item.title}</strong>
        ${formatDate(item.date)}
      </p>
    </div>
  `;
};

// Render gallery
const renderGallery = (items) => {
  const newestNine = [...items]
    .sort((a, b) => parseISO(b.date) - parseISO(a.date))
    .slice(0, 9);

  gallery.innerHTML = newestNine.map(createCardHTML).join("");

  gallery.querySelectorAll('.gallery-item').forEach((card, index) => {
    card.addEventListener('click', () => openModal(newestNine[index]));
  });
};

// Modal (full-size image / video + explanation)
const ensureModalStyles = () => {
  if (document.getElementById('modal-style')) return;

  const style = document.createElement('style');
  style.id = 'modal-style';

  style.textContent = `
    .modal { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; }
    .modal__backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.65); }
    .modal__dialog { background: #fff; border-radius: 8px; max-width: 960px; width: calc(100% - 40px); overflow: hidden; position: relative; }
    .modal__close { position: absolute; top: 8px; right: 12px; font-size: 28px; background: transparent; border: none; cursor: pointer; }
    .modal__media { width: 100%; display: block; }
    .modal__iframe { width: 100%; aspect-ratio: 16/9; border: 0; }
    .modal__body { padding: 16px; }
    .modal__title { font-weight: bold; margin-bottom: 6px; }
    .modal__date { color: #666; margin-bottom: 10px; }
    .modal__text { line-height: 1.55; }
  `;
  document.head.appendChild(style);
};

const openModal = (item) => {
  ensureModalStyles();

  document.getElementById('modal')?.remove();

  let mediaHTML = "";

  if (item.media_type === "image") {
    mediaHTML = `<img class="modal__media" src="${item.hdurl || item.url}" alt="${item.title}">`;
  } else {
    if (isYouTube(item.url)) {
      mediaHTML = `<iframe class="modal__iframe" src="${item.url}" allowfullscreen></iframe>`;
    } else {
      mediaHTML = `
        <img class="modal__media" src="${ytThumb(item.url)}" alt="">
        <div style="padding: 12px;">
          <a href="${item.url}" target="_blank">Open video ↗</a>
        </div>
      `;
    }
  }

  const modalHTML = `
    <div id="modal" class="modal">
      <div class="modal__backdrop"></div>
      <div class="modal__dialog">

        <button class="modal__close">&times;</button>

        ${mediaHTML}

        <div class="modal__body">
          <h2 class="modal__title">${item.title}</h2>
          <p class="modal__date">${formatDate(item.date)}</p>
          <p class="modal__text">${item.explanation}</p>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const modal = document.getElementById("modal");
  modal.querySelector('.modal__close').onclick = () => modal.remove();
  modal.querySelector('.modal__backdrop').onclick = () => modal.remove();
};

// Fact banner
const injectFactBanner = () => {
  const fact = FACTS[Math.floor(Math.random() * FACTS.length)];
  const banner = document.createElement('div');
  banner.className = 'did-you-know';
  banner.innerHTML = `<strong>Did You Know?</strong> ${fact}`;
  container.insertBefore(banner, filters.nextSibling);
};

// Fetch Data
fetchBtn.addEventListener('click', () => {
  showLoading();

  fetch(apodData)
    .then(res => res.json())
    .then(items => {
      if (!items.length) {
        showError("No APOD entries found.");
        return;
      }
      renderGallery(items);
    })
    .catch(() => showError("Could not load NASA images."));
});

// Load random fact immediately
injectFactBanner();
