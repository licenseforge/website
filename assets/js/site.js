// LicenseForge landing page: progressive enhancement only. Without
// JavaScript every section still reads in order: .reveal hides content
// only under html.js, which the inline script in <head> sets.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Stagger indices for CSS animations.
  $$(".grid-machines .m, .timeline .lease, .cluster .pod").forEach((el) => el.style.setProperty("--i", [...el.parentElement.children].indexOf(el)));

  // Reveal on scroll.
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  // Nav background and the top progress bar.
  const nav = $(".nav"), bar = $(".progress");
  const onScroll = () => {
    const h = document.documentElement;
    nav.classList.toggle("scrolled", h.scrollTop > 20);
    bar.style.setProperty("--p", (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)).toFixed(4));
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Hero card: type the token, then show the claims and the verdict.
  const card = $(".hero-card"), typed = $(".typed");
  const text = typed.dataset.text;
  if (reduce) { typed.textContent = text; card.classList.add("signed"); }
  else {
    let i = 0;
    const tick = () => { typed.textContent = text.slice(0, i); i += 3; if (i <= text.length + 3) setTimeout(tick, 18); else card.classList.add("signed"); };
    setTimeout(tick, 700);
    // Gentle tilt toward the pointer.
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--ry", ((e.clientX - r.left) / r.width - .5) * 8 + "deg");
      card.style.setProperty("--rx", -((e.clientY - r.top) / r.height - .5) * 8 + "deg");
    });
    card.addEventListener("pointerleave", () => { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
  }

  // Embers rising behind the hero (paused when off screen or hidden).
  const cv = $(".embers");
  if (cv && !reduce) {
    const ctx = cv.getContext("2d");
    let w, h, dpr, parts = [], running = false, raf;
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const spawn = () => ({ x: Math.random() * w, y: h + 10, r: Math.random() * 1.8 + .4, vy: Math.random() * .6 + .25, vx: (Math.random() - .5) * .3, life: 0, max: 300 + Math.random() * 400, hue: 20 + Math.random() * 25 });
    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      if (parts.length < Math.min(90, w / 14)) parts.push(spawn());
      parts = parts.filter((p) => {
        p.life++; p.y -= p.vy; p.x += p.vx + Math.sin(p.life / 40) * .15;
        const a = Math.sin(Math.PI * p.life / p.max) * .8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fillStyle = `hsla(${p.hue},100%,62%,${a})`; ctx.shadowColor = `hsla(${p.hue},100%,55%,${a})`; ctx.shadowBlur = 8;
        ctx.fill();
        return p.life < p.max && p.y > -10;
      });
      raf = requestAnimationFrame(frame);
    };
    const set = (on) => { if (on && !running) { running = true; frame(); } else if (!on && running) { running = false; cancelAnimationFrame(raf); } };
    size(); addEventListener("resize", size);
    new IntersectionObserver(([e]) => set(e.isIntersecting && !document.hidden)).observe(cv);
    document.addEventListener("visibilitychange", () => set(!document.hidden && cv.getBoundingClientRect().bottom > 0));
  }

  // Problems: the step nearest the viewport's middle drives the stage.
  const steps = $$(".step"), scenes = $$(".scene");
  const show = (n) => { steps.forEach((s, i) => s.classList.toggle("on", i === n)); scenes.forEach((s, i) => s.classList.toggle("on", i === n)); };
  // The active step is the last whose heading has passed a line: lower on
  // narrow screens, where the stage sits on top. Computed from positions on
  // every scroll, so jumps (anchors, Back) never leave a stale scene.
  const narrow = matchMedia("(max-width: 900px)");
  let cur = -1;
  const pick = () => {
    const line = innerHeight * (narrow.matches ? .8 : .6);
    let n = 0;
    steps.forEach((s, i) => { if ($("h3", s).getBoundingClientRect().top < line) n = i; });
    if (n !== cur) { cur = n; show(n); }
  };
  addEventListener("scroll", pick, { passive: true });
  addEventListener("resize", pick);
  pick();

  // Code tabs (WAI-ARIA tabs pattern) and copy.
  const tabs = $$('[role="tab"]');
  const select = (t) => {
    tabs.forEach((x) => { const on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; $("#" + x.getAttribute("aria-controls")).hidden = !on; });
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { const n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus(); }
    });
  });
  $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    const panel = b.closest(".code, .term").querySelector('pre:not([hidden])');
    try { await navigator.clipboard.writeText(panel.innerText.replace(/^\$ /gm, "")); b.textContent = "Copied"; }
    catch { b.textContent = "Select to copy"; }
    setTimeout(() => (b.textContent = "Copy"), 1600);
  }));

  // Demo video: plays muted while visible, chapters seek.
  const video = $(".demo-video"), play = $(".play");
  if (video) {
    let userPaused = false;
    if (!reduce) video.controls = false; // the play button and chapters take over
    if (!reduce) new IntersectionObserver(([e]) => { if (e.isIntersecting && !userPaused) video.play().catch(() => {}); else video.pause(); }, { threshold: .4 }).observe(video);
    play.hidden = reduce;
    const label = () => { play.textContent = video.paused ? "▶" : "❚❚"; play.setAttribute("aria-label", video.paused ? "Play video" : "Pause video"); };
    video.addEventListener("play", label); video.addEventListener("pause", label);
    play.addEventListener("click", () => { userPaused = !video.paused; video.paused ? video.play() : video.pause(); });
    const chips = $$(".chapters button");
    chips.forEach((c) => c.addEventListener("click", () => { video.currentTime = +c.dataset.t; userPaused = false; video.play().catch(() => {}); }));
    video.addEventListener("timeupdate", () => {
      let cur = chips[0];
      chips.forEach((c) => { if (video.currentTime >= +c.dataset.t) cur = c; });
      chips.forEach((c) => c.classList.toggle("on", c === cur));
    });
  }

  // Screenshot lightbox.
  const lb = $(".lightbox");
  $$(".shot").forEach((s) => s.addEventListener("click", () => { const img = $("img", lb); img.src = s.dataset.full; img.alt = $("img", s).alt; lb.showModal(); }));
  lb?.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });

  // Cursor spotlight on feature tiles.
  $$(".tile").forEach((t) => t.addEventListener("pointermove", (e) => {
    const r = t.getBoundingClientRect();
    t.style.setProperty("--mx", e.clientX - r.left + "px"); t.style.setProperty("--my", e.clientY - r.top + "px");
  }));
})();
