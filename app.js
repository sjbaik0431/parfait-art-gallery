'use strict';
// === PARFAIT ART GALLERY APP ===

// ── 상수 ──────────────────────────────────────────────────────────────────────
const INVITE_CODE = '2026';

const GALLERY_DATA = {
  character: [
    { id: 'char1', type: 'image', src: 'assets/images/char1.png', title: '파르페 캐릭터 Vol.1' },
    { id: 'char2', type: 'image', src: 'assets/images/char2.png', title: '파르페 캐릭터 Vol.2' },
    { id: 'char3', type: 'image', src: 'assets/images/char3.png', title: '파르페 캐릭터 Vol.3' },
    { id: 'char4', type: 'image', src: 'assets/images/char4.jpg', title: '파르페 캐릭터 Vol.4' },
  ],
  animation: [
    { id: 'anim1', type: 'video', src: 'assets/videos/tebi-omni.mp4', title: '전방향 미소년 테비' },
    { id: 'anim2', type: 'drive', driveId: 'DRIVE_ID_1', title: '에이멜쇼츠 완성본' },
    { id: 'anim3', type: 'drive', driveId: 'DRIVE_ID_2', title: '에이멜 테비 롱폼' },
    { id: 'anim4', type: 'drive', driveId: 'DRIVE_ID_3', title: '테비 절제 보스전' },
  ],
  emoticon: Array.from({ length: 24 }, (_, i) => ({
    id: `emo${i + 1}`,
    type: 'image',
    src: `assets/emoticons/${i + 1}.png`,
    title: `이모티콘 #${i + 1}`,
  })),
  video: [
    { id: 'vid1', type: 'placeholder', title: '영상편집 작품 #1', desc: 'Google Drive 업로드 예정' },
    { id: 'vid2', type: 'placeholder', title: '영상편집 작품 #2', desc: 'Google Drive 업로드 예정' },
    { id: 'vid3', type: 'placeholder', title: '영상편집 작품 #3', desc: 'Google Drive 업로드 예정' },
  ],
};

const PUBLIC_FILES = [
  { name: '파르페 이모티콘 세트 (미리보기)', size: '6.5MB', url: '#' },
  { name: '전방향 미소년 테비 (홍보용)', size: '6.3MB', url: 'assets/videos/tebi-omni.mp4' },
];

const TIMELINE = [
  { date: '2024.03', text: '3D 모델링 독학 시작' },
  { date: '2024.12', text: 'OGQ 이모티콘 24종 완성' },
  { date: '2025.06', text: '테비 팬아트 영상 "전방향 미소년 테비" 완성' },
  { date: '2026.02', text: '플레이브 세계관 애니메이션 프로젝트 착수' },
  { date: '2026.06', text: '파르페 아트 갤러리 오픈' },
];

const TIPS = [
  { icon: '🎯', title: '꾸준한 업로드 루틴', desc: '주 1회 이상 작품 공개로 알고리즘 타기' },
  { icon: '📱', title: '멀티 플랫폼 전략', desc: '유튜브 쇼츠, 트위터, 인스타그램 동시 운영' },
  { icon: '🤝', title: '콜라보 & 팬 소통', desc: '버튜버 커뮤니티 적극 참여, 팬아트 반응' },
  { icon: '🎨', title: '시그니처 스타일', desc: '파르페만의 색감·캐릭터 일관성으로 브랜딩' },
  { icon: '📊', title: '성과 분석 & 피드백', desc: '댓글·조회수 분석으로 인기 콘텐츠 파악' },
];

// ── 유틸 ──────────────────────────────────────────────────────────────────────
const qs  = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

// ── 1. 락스크린 ───────────────────────────────────────────────────────────────
// [FIX-HIGH] ID 불일치 수정: #invite-input→#lock-code-input, #invite-btn→#lock-submit-btn, #invite-error→#lock-error-msg
function initLockScreen() {
  const lockScreen = qs('#lock-screen');
  if (!lockScreen) return;

  if (localStorage.getItem('parfait_invited') === 'true') {
    lockScreen.style.display = 'none';
    return;
  }

  lockScreen.style.display = 'flex';

  const input  = qs('#lock-code-input', lockScreen);
  const btn    = qs('#lock-submit-btn', lockScreen);
  const errMsg = qs('#lock-error-msg',  lockScreen);

  function tryUnlock() {
    const val = (input ? input.value : '').trim().toLowerCase();
    if (val === INVITE_CODE) {
      localStorage.setItem('parfait_invited', 'true');
      lockScreen.classList.add('lock-exit');
      lockScreen.addEventListener('transitionend', () => {
        lockScreen.style.display = 'none';
      }, { once: true });
      setTimeout(initAfterUnlock, 50);
    } else {
      if (errMsg) {
        errMsg.textContent = '초대코드가 올바르지 않습니다. 다시 확인해주세요.';
        errMsg.style.display = 'block';
      }
      if (input) {
        input.classList.add('shake');
        input.addEventListener('animationend', () => input.classList.remove('shake'), { once: true });
        input.value = '';
        input.focus();
      }
    }
  }

  if (btn) btn.addEventListener('click', tryUnlock);
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryUnlock();
    });
  }
}

// ── 2. 파티클 배경 ────────────────────────────────────────────────────────────
function initParticles() {
  const canvas = qs('#hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles, mouse = { x: -9999, y: -9999 };

  const COLORS = ['#00CED1', '#7B2FBE', '#00CED1', '#FF006E'];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticles() {
    particles = Array.from({ length: 80 }, () => ({
      x:    Math.random() * W,
      y:    Math.random() * H,
      vx:   (Math.random() - 0.5) * 0.8,
      vy:   (Math.random() - 0.5) * 0.8,
      r:    Math.random() * 2.5 + 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / 100) * 0.3;
          ctx.strokeStyle = '#00CED1';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    particles.forEach((p) => {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100 && dist > 0) {
        const force = (100 - dist) / 100;
        p.vx += (dx / dist) * force * 0.5;
        p.vy += (dy / dist) * force * 0.5;
      }

      p.vx *= 0.99;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      p.x = Math.max(0, Math.min(W, p.x));
      p.y = Math.max(0, Math.min(H, p.y));

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  window.addEventListener('resize', () => { resize(); createParticles(); });

  const heroSection = qs('#hero');
  if (heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    heroSection.addEventListener('mouseleave', () => {
      mouse.x = -9999; mouse.y = -9999;
    });
  }
}

// ── 3. 타이핑 효과 ────────────────────────────────────────────────────────────
// [FIX-HIGH] #typing-title, #typing-subtitle ID 없음 → 클래스 선택자로 변경
function initTyping() {
  const titleEl    = qs('.hero-title');
  const subtitleEl = qs('.hero-subtitle');

  function typeText(el, text, delay, callback) {
    if (!el) { if (callback) callback(); return; }
    el.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        if (callback) callback();
      }
    }, delay);
  }

  typeText(titleEl, 'PARFAIT ART GALLERY', 50, () => {
    if (titleEl) {
      const cursor = document.createElement('span');
      cursor.className = 'typing-cursor';
      cursor.textContent = '│';
      titleEl.appendChild(cursor);
    }
    typeText(subtitleEl, '버튜버 팬아트 × 3D 모델링 × 이모티콘 아트', 40);
  });
}

// ── 4. 갤러리 렌더링 ──────────────────────────────────────────────────────────
function buildGalleryCard(item, index, tabName) {
  const card = document.createElement('div');
  const isEmo = tabName === 'emoticon';
  card.className = 'gallery-card reveal' + (isEmo ? ' emo-card' : '');
  card.dataset.index = index;
  card.dataset.tab   = tabName;
  if (isEmo) card.dataset.emoNum = String(index + 1); // 1~24

  if (item.type === 'image') {
    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${item.src}" alt="${item.title}" loading="lazy">
      </div>
      <div class="card-info"><span class="card-title">${item.title}</span>${isEmo ? '<span class="emo-tap-hint">🔊 탭해서 들어보기</span>' : ''}</div>`;
  } else if (item.type === 'video') {
    card.innerHTML = `
      <div class="card-img-wrap card-video-thumb">
        <video src="${item.src}" muted preload="metadata"></video>
        <span class="play-icon">▶</span>
      </div>
      <div class="card-info"><span class="card-title">${item.title}</span></div>`;
  } else if (item.type === 'drive') {
    card.innerHTML = `
      <div class="card-img-wrap card-drive">
        <span class="drive-icon">▶</span>
      </div>
      <div class="card-info"><span class="card-title">${item.title}</span>
      <span class="card-sub">Google Drive</span></div>`;
  } else {
    card.innerHTML = `
      <div class="card-img-wrap card-placeholder">
        <span class="placeholder-icon">🎬</span>
        <p>${item.desc || ''}</p>
      </div>
      <div class="card-info"><span class="card-title">${item.title}</span></div>`;
    card.style.cursor = 'default';
    card.dataset.noLightbox = 'true';
  }

  return card;
}

function initGallery() {
  const tabBtns     = qsa('.tab-btn');
  const tabContents = qsa('.tab-content');

  const tabMap = {
    character: GALLERY_DATA.character,
    animation: GALLERY_DATA.animation,
    emoticon:  GALLERY_DATA.emoticon,
    video:     GALLERY_DATA.video,
  };

  Object.entries(tabMap).forEach(([tabName, items]) => {
    const container = qs(`.tab-content[data-tab="${tabName}"] .gallery-grid`);
    if (!container) return;
    container.innerHTML = '';
    items.forEach((item, i) => {
      container.appendChild(buildGalleryCard(item, i, tabName));
    });
  });

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach((b)    => b.classList.remove('active'));
      tabContents.forEach((c) => {
        c.classList.remove('active');
        c.style.opacity = '0';
      });
      btn.classList.add('active');
      const activeContent = qs(`.tab-content[data-tab="${target}"]`);
      if (activeContent) {
        activeContent.classList.add('active');
        setTimeout(() => { activeContent.style.opacity = '1'; }, 10);
      }
      observeReveal();
    });
  });
}

// ── 5. 라이트박스 ─────────────────────────────────────────────────────────────
let lightboxItems = [];
let lightboxIndex = 0;

function initLightbox() {
  const lb        = qs('#lightbox');
  const lbContent = qs('#lightbox-content');
  const lbClose   = qs('#lightbox-close');
  const lbPrev    = qs('#lightbox-prev');
  const lbNext    = qs('#lightbox-next');
  const lbTitle   = qs('#lightbox-title');

  if (!lb) return;

  function openLightbox(items, index) {
    lightboxItems = items;
    lightboxIndex = index;
    renderLightboxItem();
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lb.classList.remove('active');
    document.body.style.overflow = '';
    if (lbContent) {
      const vid = qs('video', lbContent);
      if (vid) vid.pause();
      lbContent.innerHTML = '';
    }
  }

  function renderLightboxItem() {
    if (!lbContent) return;
    const vid = qs('video', lbContent);
    if (vid) vid.pause();
    lbContent.innerHTML = '';

    const item = lightboxItems[lightboxIndex];
    if (!item) return;
    if (lbTitle) lbTitle.textContent = item.title || '';

    if (item.type === 'image') {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title;
      img.style.maxWidth  = '90vw';
      img.style.maxHeight = '80vh';
      img.style.objectFit = 'contain';
      lbContent.appendChild(img);
    } else if (item.type === 'video') {
      const video = document.createElement('video');
      video.src      = item.src;
      video.controls = true;
      video.autoplay = true;
      video.style.maxWidth  = '90vw';
      video.style.maxHeight = '80vh';
      lbContent.appendChild(video);
    } else if (item.type === 'drive') {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'text-align:center;padding:2rem;';
      if (item.driveId && !item.driveId.startsWith('DRIVE_ID')) {
        const iframe = document.createElement('iframe');
        iframe.src    = `https://drive.google.com/file/d/${item.driveId}/preview`;
        iframe.width  = '720';
        iframe.height = '480';
        iframe.style.maxWidth  = '90vw';
        iframe.style.maxHeight = '80vh';
        iframe.allow = 'autoplay';
        wrap.appendChild(iframe);
      } else {
        wrap.innerHTML = `<p style="color:var(--color-text);font-size:1.1rem;">Google Drive 영상<br>곧 업로드 예정입니다.</p>`;
      }
      lbContent.appendChild(wrap);
    }

    if (lbPrev) lbPrev.style.display = lightboxItems.length > 1 ? 'flex' : 'none';
    if (lbNext) lbNext.style.display = lightboxItems.length > 1 ? 'flex' : 'none';
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.gallery-card');
    if (!card || card.dataset.noLightbox) return;

    const tabName = card.dataset.tab;
    const index   = parseInt(card.dataset.index, 10);
    const items   = GALLERY_DATA[tabName];
    if (!items) return;

    const clickable = items.filter((it) => it.type !== 'placeholder');
    const clickableIndex = clickable.findIndex((it) => items.indexOf(it) === index);
    openLightbox(clickable, clickableIndex >= 0 ? clickableIndex : 0);
  });

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });

  if (lbPrev) lbPrev.addEventListener('click', () => {
    lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
    renderLightboxItem();
  });
  if (lbNext) lbNext.addEventListener('click', () => {
    lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
    renderLightboxItem();
  });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  { lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length; renderLightboxItem(); }
    if (e.key === 'ArrowRight') { lightboxIndex = (lightboxIndex + 1) % lightboxItems.length; renderLightboxItem(); }
  });
}

// ── 6. 3D 카드 틸트 ───────────────────────────────────────────────────────────
function initCardTilt() {
  document.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.gallery-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const rx   = ((e.clientY - cy) / (rect.height / 2)) * 15;
    const ry   = ((e.clientX - cx) / (rect.width  / 2)) * -15;
    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.06) translateY(-8px)`;
  });

  document.addEventListener('mouseleave', (e) => {
    const card = e.target.closest('.gallery-card');
    if (card) card.style.transform = '';
  }, true);

  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.gallery-card');
    if (card && !card.contains(e.relatedTarget)) {
      card.style.transform = '';
    }
  });
}

// ── 6b. 금가루 파티클 시스템 ──────────────────────────────────────────────────
const GOLD_COLORS = ['#FFD700','#FFA500','#FFEC8B','#FFB347','#FFF8DC','#FFFACD'];
const STARS_CHARS  = ['✦','★','✧','⭐','✨','💫','🌟'];

function spawnGoldParticles(card, count = 8) {
  const rect = card.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  for (let i = 0; i < count; i++) {
    const isStar = Math.random() < 0.35;
    const el = document.createElement('div');
    el.className = isStar ? 'gold-star' : 'gold-particle';

    const x = rect.left + scrollX + Math.random() * rect.width;
    const y = rect.top  + scrollY + Math.random() * rect.height * 0.7;
    const gx = (Math.random() - 0.5) * 60;
    const dur = (0.7 + Math.random() * 0.8).toFixed(2);
    const size = isStar ? '' : `${3 + Math.random() * 6}px`;
    const color = GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)];

    el.style.cssText = [
      `left:${x}px`, `top:${y}px`,
      `--gx:${gx}px`, `--dur:${dur}s`,
      isStar
        ? `color:${color};font-size:${10 + Math.random()*10}px`
        : `width:${size};height:${size};background:${color};box-shadow:0 0 6px ${color}`,
    ].join(';');

    if (isStar) el.textContent = STARS_CHARS[Math.floor(Math.random() * STARS_CHARS.length)];

    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

function initGoldDust() {
  // 호버 시 금가루 폭발
  document.addEventListener('mouseenter', (e) => {
    const card = e.target.closest('.gallery-card');
    if (card) spawnGoldParticles(card, 12);
  }, true);

  // 클릭 시 더 강한 금가루
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.gallery-card');
    if (card) spawnGoldParticles(card, 20);
  });

  // 캐릭터/이모티콘 탭에서 주기적으로 랜덤 카드에 금가루
  function periodicGold() {
    const activePanel = qs('.tab-content.active');
    if (!activePanel) return;
    const cards = qsa('.gallery-card', activePanel);
    if (!cards.length) return;
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    spawnGoldParticles(randomCard, 5);
  }
  setInterval(periodicGold, 1800);
}

// ── 6c. 이모티콘 음성 표현 (Web Speech API) ───────────────────────────────────
const EMOTICON_SPEECH = {
  1:  '안녕~!',
  2:  '으음~',
  3:  '어디가~?',
  4:  '큭큭큭!',
  5:  '힝~',
  6:  '응!',
  7:  '퍼~엉!',
  8:  '비~상!',
  9:  '...',
  10: '어머나!',
  11: '어쩔티비~',
  12: '안 봐도 됨!',
  13: '화났어!!!',
  14: '짜~증나!',
  15: '찰칵!',
  16: '음양영~',
  17: '몇 개야?',
  18: '빠이빠이~!',
  19: '낼름~',
  20: '문 열어!! 열어!!',
  21: '한 끔만~!',
  22: '힘내!!!',
  23: '총! 섧!',
  24: '가져가!! 다 가져가!!',
};

let speechVoice = null;

function loadKorVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  speechVoice = voices.find(v => v.lang.startsWith('ko')) || voices[0] || null;
}

function speakEmoticon(numStr) {
  if (!window.speechSynthesis) return;
  const num = parseInt(numStr, 10);
  const text = EMOTICON_SPEECH[num] || `이모티콘 ${num}번!`;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang   = 'ko-KR';
  utt.pitch  = 1.7 + Math.random() * 0.3;   // 높은 음
  utt.rate   = 1.1 + Math.random() * 0.25;  // 약간 빠르게
  utt.volume = 1;
  if (speechVoice) utt.voice = speechVoice;
  window.speechSynthesis.speak(utt);
}

function initEmoticonsVoice() {
  if (window.speechSynthesis) {
    loadKorVoice();
    window.speechSynthesis.onvoiceschanged = loadKorVoice;
  }

  // 이모티콘 탭 카드 클릭 감지
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.gallery-card.emo-card');
    if (!card) return;
    const num = card.dataset.emoNum;
    if (!num) return;

    // 말하는 동안 카드 강조
    card.classList.add('speaking');
    speakEmoticon(num);

    const utt = window._lastUtt;
    setTimeout(() => card.classList.remove('speaking'), 1500);
  });
}

// ── 7. 스크롤 스파이 ──────────────────────────────────────────────────────────
// [FIX-MED] header[id] 제거 — 고정 헤더가 항상 intersecting돼 충돌 발생
function initScrollSpy() {
  const sections = qsa('section[id]');
  const navLinks = qsa('#nav-links a, .nav-links a');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach((a) => {
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach((s) => observer.observe(s));
}

// ── 8. 스크롤 리빌 ────────────────────────────────────────────────────────────
let revealObserver = null;

function observeReveal() {
  // [FIX-MED] 이미 observer 존재 시 disconnect 후 재생성 (중복 방지)
  if (revealObserver) revealObserver.disconnect();

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  qsa('.reveal').forEach((el) => revealObserver.observe(el));
}

function initScrollReveal() {
  observeReveal();
}

// ── 9. 햄버거 메뉴 ────────────────────────────────────────────────────────────
function initHamburger() {
  const toggle   = qs('#nav-toggle');
  const navLinks = qs('.nav-links');

  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  });

  qsa('.nav-links a').forEach((a) => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ── 10 & 11. 자료실 ───────────────────────────────────────────────────────────
function initRepository() {
  const repoBtns     = qsa('.repo-tab-btn');
  const repoContents = qsa('.repo-content');

  const publicGrid = qs('#repo-public .file-list');
  if (publicGrid) {
    PUBLIC_FILES.forEach((f) => {
      const item = document.createElement('div');
      item.className = 'file-item reveal';
      item.innerHTML = `
        <span class="file-name">${f.name}</span>
        <span class="file-size">${f.size}</span>
        <a class="file-download" href="${f.url}" ${f.url !== '#' ? 'download target="_blank"' : ''}>다운로드</a>`;
      publicGrid.appendChild(item);
    });
  }

  const privateContent = qs('#repo-private');
  if (privateContent) {
    const isAuth = localStorage.getItem('parfait_invited') === 'true';
    const lockedMsg   = qs('#private-locked', privateContent);
    const privateBody = qs('#private-body',   privateContent);
    if (lockedMsg && privateBody) {
      if (isAuth) {
        lockedMsg.style.display   = 'none';
        privateBody.style.display = 'block';
      } else {
        lockedMsg.style.display   = 'block';
        privateBody.style.display = 'none';
      }
    }
  }

  repoBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.repo;
      repoBtns.forEach((b)     => b.classList.remove('active'));
      repoContents.forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      const targetContent = qs(`#repo-${target}`);
      if (targetContent) targetContent.classList.add('active');
      observeReveal();
    });
  });
}

// ── 12. 글리치 효과 ───────────────────────────────────────────────────────────
function initGlitch() {
  qsa('.glitch').forEach((el) => {
    if (!el.dataset.text) el.dataset.text = el.textContent;

    function triggerGlitch() {
      el.classList.add('glitching');
      setTimeout(() => el.classList.remove('glitching'), 400);
      const next = 3000 + Math.random() * 5000;
      setTimeout(triggerGlitch, next);
    }
    setTimeout(triggerGlitch, Math.random() * 3000);
  });
}

// ── 13. 헤더 스크롤 ───────────────────────────────────────────────────────────
function initHeaderScroll() {
  const header = qs('#header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

// ── 14. 음악 플레이어 버튼 ────────────────────────────────────────────────────
// [FIX-LOW] window.parfaitMusic 메서드 존재 여부 방어 체크 추가
function initMusicPlayer() {
  const toggleBtn = qs('#music-toggle');
  const volSlider = qs('#music-vol');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (window.parfaitMusic && typeof window.parfaitMusic.toggle === 'function') {
        window.parfaitMusic.toggle();
        const playing = toggleBtn.dataset.playing === 'true';
        toggleBtn.dataset.playing = (!playing).toString();
        toggleBtn.textContent = !playing ? '⏸' : '▶';
        toggleBtn.title       = !playing ? '음악 정지' : '음악 재생';
      }
    });
  }

  if (volSlider) {
    volSlider.addEventListener('input', () => {
      if (window.parfaitMusic && typeof window.parfaitMusic.setVolume === 'function') {
        window.parfaitMusic.setVolume(parseFloat(volSlider.value));
      }
    });
  }
}

// ── 15. 비주얼라이저 ──────────────────────────────────────────────────────────
// [FIX-HIGH] { once: true } 제거 → 재생 재시작 후에도 비주얼라이저 재연결 가능
function initVisualizer() {
  const canvas = qs('#viz-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let analyser  = null;
  let dataArray = null;
  let animId    = null;

  function getAnalyser() {
    if (!window.parfaitMusic) return null;
    return (typeof window.parfaitMusic.getAnalyser === 'function')
      ? window.parfaitMusic.getAnalyser()
      : null;
  }

  function drawVisualizer() {
    animId = requestAnimationFrame(drawVisualizer);

    if (!analyser) {
      analyser = getAnalyser();
      if (!analyser) return;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }

    analyser.getByteFrequencyData(dataArray);

    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);

    const bars = 64;
    const barW = W / bars;
    const step = Math.floor(dataArray.length / bars);

    for (let i = 0; i < bars; i++) {
      const val  = dataArray[i * step] / 255;
      const barH = val * H;
      const x    = i * barW;

      const gradient = ctx.createLinearGradient(0, H, 0, H - barH);
      gradient.addColorStop(0, '#00CED1');
      gradient.addColorStop(1, '#7B2FBE');

      ctx.fillStyle  = gradient;
      ctx.shadowBlur  = 8;
      ctx.shadowColor = '#00CED1';
      ctx.fillRect(x + 1, H - barH, barW - 2, barH);
    }
    ctx.shadowBlur = 0;
  }

  // [FIX-HIGH] { once: true } 제거, animId 체크로만 중복 방지
  const toggleBtn = qs('#music-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (!animId) drawVisualizer();
    });
  }

  setTimeout(() => {
    if (!animId) drawVisualizer();
  }, 2000);
}

// ── 16. 팬레터 폼 검증 ────────────────────────────────────────────────────────
function initFanmail() {
  const form     = qs('#fanmail-form');
  const nameIn   = qs('#fan-name');
  const msgIn    = qs('#fan-message');
  const thankMsg = qs('#fanmail-thanks');
  const errMsg   = qs('#fanmail-error');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    const name = nameIn ? nameIn.value.trim() : '';
    const msg  = msgIn  ? msgIn.value.trim()  : '';

    if (errMsg) errMsg.style.display = 'none';

    if (!name) {
      e.preventDefault();
      if (errMsg) { errMsg.textContent = '이름을 입력해주세요.'; errMsg.style.display = 'block'; }
      if (nameIn) nameIn.focus();
      return;
    }
    if (msg.length < 10) {
      e.preventDefault();
      if (errMsg) { errMsg.textContent = '메시지를 10자 이상 입력해주세요.'; errMsg.style.display = 'block'; }
      if (msgIn) msgIn.focus();
      return;
    }

    if (thankMsg) {
      e.preventDefault();
      form.style.display  = 'none';
      thankMsg.style.display = 'block';
      thankMsg.textContent   = `${name}님, 팬레터를 보내주셔서 감사합니다! 💙`;

      const data = new FormData(form);
      fetch(form.action, { method: 'POST', body: data }).catch(() => {});
    }
  });
}

// ── 타임라인 렌더링 ───────────────────────────────────────────────────────────
function initTimeline() {
  const container = qs('#story .timeline');
  if (!container) return;

  TIMELINE.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = `timeline-item reveal ${i % 2 === 0 ? 'left' : 'right'}`;
    el.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <span class="timeline-date">${item.date}</span>
        <p>${item.text}</p>
      </div>`;
    container.appendChild(el);
  });
}

// ── 셀럽 팁 렌더링 ────────────────────────────────────────────────────────────
function initTips() {
  const container = qs('#tips .tips-grid');
  if (!container) return;

  TIPS.forEach((tip) => {
    const card = document.createElement('div');
    card.className = 'tip-card reveal';
    card.innerHTML = `
      <span class="tip-icon">${tip.icon}</span>
      <h3>${tip.title}</h3>
      <p>${tip.desc}</p>`;
    container.appendChild(card);
  });
}

// ── SNS 카드 ──────────────────────────────────────────────────────────────────
function initSNS() {
  const SNS_LINKS = [
    { name: 'YouTube',    icon: '▶',  url: '#', color: '#FF0000' },
    { name: 'Twitter / X', icon: '𝕏', url: '#', color: '#1DA1F2' },
    { name: 'Instagram',  icon: '📷', url: '#', color: '#E1306C' },
    { name: 'OGQ Market', icon: '🎨', url: '#', color: '#00CED1' },
  ];

  const container = qs('#sns .sns-grid');
  if (!container) return;

  SNS_LINKS.forEach((s) => {
    const card = document.createElement('a');
    card.href      = s.url;
    card.target    = '_blank';
    card.rel       = 'noopener noreferrer';
    card.className = 'sns-card reveal';
    card.style.setProperty('--sns-color', s.color);
    card.innerHTML = `<span class="sns-icon">${s.icon}</span><span class="sns-name">${s.name}</span>`;
    container.appendChild(card);
  });
}

// ── Giscus 댓글 (GitHub Discussions 활성화 후 동작) ─────────────────────────
function initGiscus() {
  const container = qs('#giscus-container');
  if (!container || container.dataset.loaded) return;  // 중복 방지

  // IntersectionObserver: 댓글 섹션이 뷰포트에 들어올 때만 로드
  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    if (container.dataset.loaded) return;
    container.dataset.loaded = 'true';

    const script = document.createElement('script');
    script.src                     = 'https://giscus.app/client.js';
    script.dataset.repo            = 'sjbaik0431/parfait-art-gallery';
    script.dataset.repoId          = '';   // GitHub Discussions 활성화 후 입력
    script.dataset.category        = 'General';
    script.dataset.categoryId      = '';   // GitHub Discussions 활성화 후 입력
    script.dataset.mapping         = 'pathname';
    script.dataset.strict          = '0';
    script.dataset.reactionsEnabled = '1';
    script.dataset.emitMetadata    = '0';
    script.dataset.inputPosition   = 'top';
    script.dataset.theme           = 'dark_dimmed';
    script.dataset.lang            = 'ko';
    script.crossOrigin             = 'anonymous';
    script.async                   = true;
    container.appendChild(script);
  }, { threshold: 0.1 });

  const section = qs('#comments');
  if (section) observer.observe(section);
}

// ── 스무스 스크롤 ─────────────────────────────────────────────────────────────
function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = qs(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

// ── 인증 후 실행되는 초기화 ──────────────────────────────────────────────────
// [FIX-MED] observeReveal() 제거 — initScrollReveal()과 중복, 성능 낭비
function initAfterUnlock() {
  initParticles();
  initTyping();
  initGoldDust();
  initEmoticonsVoice();
}

// ── 메인 초기화 ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLockScreen();

  if (localStorage.getItem('parfait_invited') === 'true') {
    initParticles();
    initTyping();
  }

  initHeaderScroll();
  initHamburger();
  initSmoothScroll();
  initGallery();
  initLightbox();
  initCardTilt();
  initScrollSpy();
  initScrollReveal();
  initTimeline();
  initTips();
  initSNS();
  initRepository();
  initGlitch();
  initFanmail();
  initMusicPlayer();
  initVisualizer();
  initGiscus();
});