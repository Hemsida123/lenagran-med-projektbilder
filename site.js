(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Hero-bildspel (startsidan) ---------- */
  var slides = $$('.slide');
  var segs = $$('#segs .seg');
  if (slides.length > 1 && segs.length) {
    var caps = $$('#caps .cap');
    var hn = $('#hn');
    var cur = 0, timer = null;
    var restart = function () {
      clearTimeout(timer);
      if (!reduce) timer = setTimeout(function () { go(cur + 1); }, 6500);
    };
    var go = function (i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, j) { s.classList.toggle('on', j === cur); });
      slides[0].classList.remove('first');
      caps.forEach(function (c, j) { c.classList.toggle('on', j === cur); });
      segs.forEach(function (s, j) {
        s.classList.remove('on');
        s.classList.toggle('done', j < cur);
        if (j === cur) { void s.offsetWidth; s.classList.add('on'); }
      });
      if (hn) hn.textContent = cur + 1;
      restart();
    };
    segs.forEach(function (s, j) { s.addEventListener('click', function () { go(j); }); });
    var pv = $('#prev'), nx = $('#next');
    if (pv) pv.addEventListener('click', function () { go(cur - 1); });
    if (nx) nx.addEventListener('click', function () { go(cur + 1); });
    setTimeout(function () { go(0); }, reduce ? 0 : 2000);

    var frame = $('.frame'), sx = null;
    frame.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    frame.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }

  /* ---------- Header, mobilbar, parallax ---------- */
  var hdr = $('#hdr');
  var mbar = $('#mbar');
  var hero = $('.hero');
  var pars = $$('[data-par]');
  var lastY = 0;
  var parallax = function () {
    if (reduce) return;
    var vh = window.innerHeight;
    pars.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = 'translate3d(0,' + (-p * parseFloat(el.dataset.par) * 100 - 8) + '%,0)';
    });
  };
  var onScroll = function () {
    var y = window.scrollY;
    var limit = hero ? hero.offsetHeight : 0;
    if (hdr && hero) {
      var past = y > limit - 90;
      hdr.classList.toggle('solid', past);
      hdr.classList.toggle('away', past && y > lastY + 4 && y > limit + 200);
      if (y < lastY - 4) hdr.classList.remove('away');
    } else if (hdr) {
      hdr.classList.toggle('away', y > lastY + 4 && y > 200);
      if (y < lastY - 4) hdr.classList.remove('away');
    }
    if (mbar) mbar.classList.toggle('show', y > (hero ? limit * 0.6 : 300));
    lastY = y;
    parallax();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', parallax);
  onScroll();

  /* ---------- Mobilmeny ---------- */
  var mm = $('#mm'), ob = $('#openMenu'), cb = $('#closeMenu');
  if (mm && ob && cb) {
    var menu = function (open) {
      mm.hidden = !open;
      mm.classList.toggle('open', open);
      ob.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.style.overflow = open ? 'hidden' : '';
      (open ? cb : ob).focus();
    };
    ob.addEventListener('click', function () { menu(true); });
    cb.addEventListener('click', function () { menu(false); });
    $$('[data-close]', mm).forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mm.hidden) menu(false); });
  }

  /* ---------- Horisontellt galleri (startsidan) ---------- */
  var gal = $('#gal');
  if (gal) {
    var tr = $('#gtrack');
    var step = function () { return Math.max(300, gal.clientWidth * 0.6); };
    $('#gprev').addEventListener('click', function () { gal.scrollBy({ left: -step(), behavior: 'smooth' }); });
    $('#gnext').addEventListener('click', function () { gal.scrollBy({ left: step(), behavior: 'smooth' }); });
    var prog = function () {
      var max = gal.scrollWidth - gal.clientWidth;
      var w = gal.clientWidth / gal.scrollWidth;
      tr.style.width = (w * 100) + '%';
      tr.style.transform = 'translateX(' + (max > 0 ? (gal.scrollLeft / max) * ((1 - w) / w) * 100 : 0) + '%)';
    };
    gal.addEventListener('scroll', prog, { passive: true });
    window.addEventListener('resize', prog);
    prog();
    var down = false, startX = 0, startL = 0;
    gal.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; startX = e.clientX; startL = gal.scrollLeft; gal.classList.add('drag');
    });
    window.addEventListener('pointermove', function (e) { if (down) gal.scrollLeft = startL - (e.clientX - startX); });
    window.addEventListener('pointerup', function () { if (down) { down = false; gal.classList.remove('drag'); } });
    gal.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { gal.scrollBy({ left: step(), behavior: 'smooth' }); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { gal.scrollBy({ left: -step(), behavior: 'smooth' }); e.preventDefault(); }
    });
  }

  /* ---------- Före/efter ---------- */
  $$('.ba').forEach(function (ba) {
    var input = $('input', ba);
    var set = function () { ba.style.setProperty('--x', input.value + '%'); };
    input.addEventListener('input', set);
    set();
  });

  /* ---------- Lightbox (projektsidor) ---------- */
  var lbBtns = $$('[data-lb]');
  if (lbBtns.length) {
    var lb = document.createElement('div');
    lb.className = 'lb';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Bildvisning');
    lb.innerHTML =
      '<div class="lb-top"><span class="lb-c"></span><button type="button" class="lb-x" aria-label="Stäng"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14"/></svg></button></div>' +
      '<img alt="">' +
      '<button type="button" class="arw lb-p" aria-label="Föregående bild"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M9 2L4 7l5 5"/></svg></button>' +
      '<button type="button" class="arw lb-n" aria-label="Nästa bild"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M5 2l5 5-5 5"/></svg></button>' +
      '<div class="lb-cap"></div>';
    document.body.appendChild(lb);
    var lbImg = $('img', lb), lbC = $('.lb-c', lb), lbCap = $('.lb-cap', lb);
    var idx = 0, opener = null;
    var items = function () { return lbBtns.filter(function (b) { return b.isConnected && $('img', b); }); };
    var show = function (i) {
      var list = items();
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      var b = list[idx], im = $('img', b);
      lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
      lbImg.src = b.dataset.full || im.currentSrc || im.src;
      lbImg.alt = im.alt;
      lbC.textContent = (idx + 1) + ' av ' + list.length;
      lbCap.textContent = b.dataset.cap || '';
    };
    var open = function (b) {
      opener = b;
      lb.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      show(items().indexOf(b));
      $('.lb-x', lb).focus();
    };
    var close = function () {
      lb.hidden = true;
      document.documentElement.style.overflow = '';
      if (opener) opener.focus();
    };
    lbBtns.forEach(function (b) { b.addEventListener('click', function () { if ($('img', b)) open(b); }); });
    $('.lb-x', lb).addEventListener('click', close);
    $('.lb-p', lb).addEventListener('click', function () { show(idx - 1); });
    $('.lb-n', lb).addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
    var lsx = null;
    lb.addEventListener('touchstart', function (e) { lsx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (lsx === null) return;
      var dx = e.changedTouches[0].clientX - lsx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      lsx = null;
    });
  }
})();
