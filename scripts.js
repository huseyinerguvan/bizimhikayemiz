// ELEMENTLER
const startBtn = document.getElementById('start-button');
const loadingScreen = document.getElementById('loading-screen');

const photo1Screen = document.getElementById('photo1-screen');
const photo1 = document.getElementById('photo1');
const photo1Note = document.getElementById('photo1-note');

const photo2Screen = document.getElementById('photo2-screen');
const photo2 = document.getElementById('photo2');
const readyBtn = document.getElementById('ready-button');

const slideshowContainer = document.getElementById('slideshow-container');
const slides = document.querySelectorAll('.slide');
const song = document.getElementById('love-song');

const endScene = document.getElementById('end-scene');

// DURUMLAR
let started = false;
let slideIntervalRef = null;

// 1) Başlat -> Loading -> Foto1
startBtn.addEventListener('click', () => {
  if (started) return;
  started = true;

  document.getElementById('button-container').style.display = 'none';
  loadingScreen.style.display = 'block';

  setTimeout(() => {
    loadingScreen.style.display = 'none';
    showPhoto1();
  }, 3500); // 3.5s loading
});

function showPhoto1() {
  photo1Screen.style.display = 'block';
  photo1Note.style.display = 'none';
  // reset touch vars on transitions
  resetTouchVars();
}

// --- SWIPE UP / CLICK to reveal note under photo1 --- //
let touchStartX = 0, touchEndX = 0, touchStartY = 0, touchEndY = 0;
function resetTouchVars() { touchStartX = touchEndX = touchStartY = touchEndY = 0; }

// Touch events
document.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;

  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  // Up swipe (dy negative and sufficiently large)
  if (dy < -50 && Math.abs(dy) > Math.abs(dx)) {
    // If photo1 screen visible -> reveal note
    if (photo1Screen.style.display === 'block' && photo1Note.style.display !== 'block') {
      revealPhoto1Note();
      return;
    }
  }

  // Right swipe (dx positive and sufficiently large)
  if (dx > 70 && Math.abs(dx) > Math.abs(dy)) {
    // If note shown -> move to photo2
    if (photo1Note.style.display === 'block' && photo2Screen.style.display !== 'block') {
      goToPhoto2();
      return;
    }
  }

  // While on photo2 screen: right swipe should NOT trigger here; user uses button to continue
});

// Mouse fallback (desktop)
let mouseDown = false;
let mouseStartX = 0, mouseStartY = 0;
document.addEventListener('mousedown', (e) => {
  mouseDown = true; mouseStartX = e.screenX; mouseStartY = e.screenY;
});
document.addEventListener('mouseup', (e) => {
  if (!mouseDown) return;
  mouseDown = false;
  const dx = e.screenX - mouseStartX;
  const dy = e.screenY - mouseStartY;

  if (dy < -50 && Math.abs(dy) > Math.abs(dx)) {
    if (photo1Screen.style.display === 'block' && photo1Note.style.display !== 'block') {
      revealPhoto1Note();
      return;
    }
  }
  if (dx > 70 && Math.abs(dx) > Math.abs(dy)) {
    if (photo1Note.style.display === 'block' && photo2Screen.style.display !== 'block') {
      goToPhoto2();
      return;
    }
  }
});

// Also allow clicking photo1 to reveal the note (fallback)
photo1.addEventListener('click', () => {
  if (photo1Note.style.display !== 'block') revealPhoto1Note();
});

// reveal note below photo1
function revealPhoto1Note() {
  photo1Note.style.display = 'block';
  // keep photo1 visible; user sees the pink hint to swipe right
}

// go to photo2 (called on right swipe)
function goToPhoto2() {
  photo1Screen.style.display = 'none';
  photo1Note.style.display = 'none';
  photo2Screen.style.display = 'block';
}

// Also allow clicking photo2's note area to show ready button - but we already display it.
// The ready button triggers the slideshow + music
readyBtn.addEventListener('click', () => {
  // start music and slides
  tryPlaySongThenStartSlides();
});

// Fallback: allow tapping photo2 to start too
photo2.addEventListener('click', () => {
  // if user taps the photo2 area, don't accidentally start; require explicit ready button
});

// Play song with user interaction fallback
function tryPlaySongThenStartSlides() {
  // try to play; if blocked, show a small alert instructing user to tap to allow
  song.play().then(() => {
    startSlides();
  }).catch(() => {
    // show a quick clickable overlay to let user enable sound
    const allowDiv = document.createElement('div');
    allowDiv.style.position = 'fixed';
    allowDiv.style.inset = '0';
    allowDiv.style.display = 'flex';
    allowDiv.style.alignItems = 'center';
    allowDiv.style.justifyContent = 'center';
    allowDiv.style.background = 'rgba(0,0,0,0.45)';
    allowDiv.style.zIndex = '9999';

    const allowBtn = document.createElement('button');
    allowBtn.textContent = 'Müziği Başlatmak İçin Dokun';
    allowBtn.style.padding = '12px 18px';
    allowBtn.style.borderRadius = '10px';
    allowBtn.style.fontSize = '18px';
    allowBtn.style.border = 'none';
    allowBtn.style.cursor = 'pointer';
    allowBtn.style.background = '#ff9fb1';
    allowBtn.style.color = '#fff';
    allowDiv.appendChild(allowBtn);
    document.body.appendChild(allowDiv);

    allowBtn.addEventListener('click', () => {
      song.play().then(() => {
        document.body.removeChild(allowDiv);
        startSlides();
      }).catch(() => {
        alert('Müziği başlatamadım, lütfen tarayıcı ayarlarını kontrol et.');
      });
    }, { once: true });
  });
}

// Slideshow logic
function startSlides() {
  // hide photo2 screen
  photo2Screen.style.display = 'none';
  slideshowContainer.style.display = 'block';

  // reset slides
  slides.forEach((s, i) => {
    s.style.opacity = i === 0 ? '1' : '0';
    s.classList.remove('fade-in', 'fade-out');
    if (i === 0) s.classList.add('fade-in');
  });

  let index = 0;
  const total = slides.length;

  // play the song if not playing already
  if (song.paused) song.play().catch(() => {/* ignore */});

  slideIntervalRef = setInterval(() => {
    const current = slides[index];
    const nextIndex = (index + 1) % total;
    const next = slides[nextIndex];

    current.classList.add('fade-out');
    next.classList.add('fade-in');

    // after transition cleanup
    setTimeout(() => {
      current.style.opacity = '0';
      next.style.opacity = '1';
      current.classList.remove('fade-out');
      next.classList.remove('fade-in');
      index = nextIndex;

      // if we reached last slide (index === total-1), stop interval and schedule endScene after last slide visible time
      if (index === total - 1) {
        clearInterval(slideIntervalRef);
        // keep last slide for 5s, then final
        setTimeout(() => {
          endSequence();
        }, 5000);
      }
    }, 1800); // matches CSS transition ~1.8s
  }, 5000);
}

// Final sequence
function endSequence() {
  // fade out slideshow visuals (optional smoothing)
  slideshowContainer.style.display = 'none';

  // show end scene
  endScene.style.display = 'flex';

  // sequence: show heart -> show credits -> show final text
  setTimeout(() => endScene.classList.add('show-heart'), 800); // slight delay
  setTimeout(() => endScene.classList.add('show-credits'), 4200);
  setTimeout(() => endScene.classList.add('show-end'), 8200);

  // gently fade out music towards end (if playing)
  try {
    const fadeDuration = 7000; // ms
    const startVol = song.volume || 1;
    const steps = 35;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const newVol = Math.max(0, startVol * (1 - step / steps));
      song.volume = newVol;
      if (step >= steps) {
        clearInterval(interval);
        song.pause();
        song.currentTime = 0;
      }
    }, fadeDuration / steps);
  } catch (e) { /* ignore audio errors */ }
}

// reset touch vars when page focus changes etc
window.addEventListener('focus', resetTouchVars);
