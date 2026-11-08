/* Silent previews and one accessible, cinematic research player. */
(() => {
  'use strict';
  const dialog = document.getElementById('film-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const player = dialog.querySelector('#film-player');
  const error = dialog.querySelector('.film-error');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let opener = null;
  let playbackSession = 0;
  const cards = [...document.querySelectorAll('.film-card')].map(element => ({
    element,
    trigger: element.querySelector('.film-trigger'),
    video: element.querySelector('.film-preview'),
    toggle: element.querySelector('.film-preview-toggle'),
    visible: false,
    userPaused: false,
    optedIn: false,
  }));

  const shouldPlay = card => card.visible && !document.hidden && !dialog.open &&
    !card.userPaused && (card.optedIn || (!reduced.matches && !connection?.saveData));
  function syncPreview(card) {
    if (!shouldPlay(card)) { card.video.pause(); return; }
    card.video.play().then(() => {
      // An observer/visibility event may have arrived while play() was pending.
      if (!shouldPlay(card)) card.video.pause();
    }).catch(() => { /* Poster and explicit playback remain available. */ });
  }
  const syncPreviews = () => cards.forEach(syncPreview);

  function openFilm(card) {
    if (dialog.open) return;
    const from = card.trigger.getBoundingClientRect();
    opener = card.trigger;
    const session = ++playbackSession;
    error.hidden = true;
    dialog.querySelector('#film-title').textContent = card.trigger.dataset.filmTitle;
    dialog.querySelector('#film-direct').href = card.trigger.dataset.filmSrc;
    player.setAttribute('aria-label', `${card.trigger.dataset.filmTitle} full video`);
    player.poster = card.video.poster;
    player.src = card.trigger.dataset.filmSrc;
    player.muted = false;
    document.documentElement.classList.add('film-open');
    dialog.showModal();
    const to = dialog.getBoundingClientRect();
    dialog.style.setProperty('--film-from-x', `${from.left + from.width/2 - (to.left + to.width/2)}px`);
    dialog.style.setProperty('--film-from-y', `${from.top + from.height/2 - (to.top + to.height/2)}px`);
    dialog.style.setProperty('--film-from-scale', String(Math.max(.3, Math.min(.85, from.width/to.width))));
    syncPreviews();
    // Start inside the click event so sound is permitted. Full films start at 0.
    player.play().catch(() => {
      if (dialog.open && session === playbackSession) error.hidden = false;
    });
  }
  dialog.querySelector('.film-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const stops = [...dialog.querySelectorAll('button:not([disabled]),a[href],video[controls]')]
      .filter(element => element.getClientRects().length);
    const first = stops[0], last = stops[stops.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  let backdropPress = false;
  const outside = event => {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  dialog.addEventListener('pointerdown', event => { backdropPress = outside(event); });
  dialog.addEventListener('click', event => {
    if (backdropPress && outside(event)) dialog.close();
    backdropPress = false;
  });
  dialog.addEventListener('close', () => {
    ++playbackSession;
    player.pause();
    player.removeAttribute('src');
    player.load();
    error.hidden = true;
    document.documentElement.classList.remove('film-open');
    opener?.focus({preventScroll:true});
    syncPreviews();
  });
  player.addEventListener('error', () => { if (dialog.open) error.hidden = false; });
  player.addEventListener('playing', () => { error.hidden = true; });

  cards.forEach(card => {
    card.video.muted = true;
    card.trigger.addEventListener('click', () => openFilm(card));
    const updateToggle = () => {
      const action = card.video.paused ? 'Play' : 'Pause';
      card.toggle.textContent = `${action} preview`;
      card.toggle.setAttribute('aria-label', `${action} ${card.trigger.dataset.filmTitle} preview`);
    };
    card.video.addEventListener('play', updateToggle);
    card.video.addEventListener('pause', updateToggle);
    card.video.addEventListener('playing', () => {
      card.element.querySelector('.video-status').hidden = true;
    });
    const showPreviewError = () => { card.element.querySelector('.video-status').hidden = false; };
    card.video.addEventListener('error', showPreviewError);
    card.video.querySelector('source')?.addEventListener('error', showPreviewError);
    card.toggle.addEventListener('click', () => {
      card.userPaused = !card.video.paused;
      card.optedIn = true;
      syncPreview(card);
    });
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const card = cards.find(item => item.trigger === entry.target);
        card.visible = entry.isIntersecting && entry.intersectionRatio >= .2;
        syncPreview(card);
      });
    }, {threshold:[0,.2]});
    cards.forEach(card => observer.observe(card.trigger));
  } else {
    cards.forEach(card => { card.visible = true; });
    syncPreviews();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) player.pause();
    syncPreviews();
  });
  const preferenceChanged = () => {
    cards.forEach(card => { card.optedIn = false; });
    syncPreviews();
  };
  reduced.addEventListener('change', preferenceChanged);
  connection?.addEventListener('change', preferenceChanged);
})();
