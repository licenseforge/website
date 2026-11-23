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

  // Molten metal behind the hero: a WebGL fragment shader (domain-warped
  // noise on a blackbody palette), drawn at half resolution. The pointer
  // heats the metal near it; scrolling away cools it. One still frame with
  // reduced motion; the CSS gradient shows if WebGL is unavailable.
  const cv = $(".molten"), hero = $(".hero");
  const gl = cv && cv.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" });
  const prog = gl && (() => {
    const pr = gl.createProgram();
    const add = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); gl.attachShader(pr, s); };
    add(gl.VERTEX_SHADER, "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}");
    add(gl.FRAGMENT_SHADER, `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 r; uniform float t, h; uniform vec2 m;
float hs(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r.y;
  vec2 q=vec2(fbm(uv*1.4+vec2(0.,t*.04)),fbm(uv*1.4+vec2(5.2,1.3)-t*.03));
  float f=fbm(uv*1.8+2.6*q+vec2(t*.02,-t*.05));
  float v=pow(1.-abs(2.*f-1.),7.);
  float g=smoothstep(.45,0.,distance(uv,m));
  float k=(v*(.45+.8*q.y)+g*(.2+.7*v))*h
    *mix(.3,1.,smoothstep(.1,.85,gl_FragCoord.x/r.x))
    *smoothstep(0.,.45,gl_FragCoord.y/r.y)*(1.-.65*smoothstep(.78,1.,gl_FragCoord.y/r.y));
  vec3 c=vec3(.047,.039,.035)+vec3(1.,.42,.12)*smoothstep(0.,.55,k)
    +vec3(0.,.3,.25)*smoothstep(.45,1.,k)+vec3(0.,0.,.35)*smoothstep(.8,1.3,k);
  gl_FragColor=vec4(c,1.);
}`);
    gl.bindAttribLocation(pr, 0, "a");
    gl.linkProgram(pr);
    return gl.getProgramParameter(pr, gl.LINK_STATUS) ? pr : null;
  })();
  if (!prog) cv?.remove();
  else {
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const u = (n) => gl.getUniformLocation(prog, n);
    const uR = u("r"), uT = u("t"), uH = u("h"), uM = u("m");
    const scale = .5;
    let H = 1, mx = -9, my = -9, tx = -9, ty = -9, running = false, raf;
    const size = () => {
      cv.width = Math.max(1, Math.round(cv.clientWidth * scale)); H = cv.height = Math.max(1, Math.round(cv.clientHeight * scale));
      gl.viewport(0, 0, cv.width, H); gl.uniform2f(uR, cv.width, H);
    };
    const draw = (now) => {
      mx += (tx - mx) * .06; my += (ty - my) * .06;
      gl.uniform1f(uT, (now / 1000) % 1000);
      gl.uniform1f(uH, 1 - .65 * Math.min(1, scrollY / hero.offsetHeight));
      gl.uniform2f(uM, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    size();
    if (reduce) { draw(40000); addEventListener("resize", () => { size(); draw(40000); }); }
    else {
      const frame = (now) => { draw(now); raf = requestAnimationFrame(frame); };
      const set = (on) => { if (on && !running) { running = true; raf = requestAnimationFrame(frame); } else if (!on && running) { running = false; cancelAnimationFrame(raf); } };
      addEventListener("resize", size);
      hero.addEventListener("pointermove", (e) => {
        const r = cv.getBoundingClientRect();
        tx = (e.clientX - r.left) * scale / H; ty = (r.bottom - e.clientY) * scale / H;
        if (mx < -1) { mx = tx; my = ty; }
      });
      new IntersectionObserver(([e]) => set(e.isIntersecting && !document.hidden)).observe(cv);
      document.addEventListener("visibilitychange", () => set(!document.hidden && cv.getBoundingClientRect().bottom > 0));
    }
  }

  // The forge: progress through the pinned section moves the ingot from hot
  // claims to a signed token (CSS reads --p); entering step 2 strikes it,
  // step 3 seals it. The matching step card lights up.
  const forge = $(".forge");
  if (forge && !reduce) {
    forge.classList.add("forging");
    const cards = $$(".flow-step", forge);
    cards.forEach((c) => c.classList.remove("reveal"));
    $$(".spark", forge).forEach((el, i) => el.style.setProperty("--i", i));
    let phase = -1;
    const onForge = () => {
      const r = forge.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      forge.style.setProperty("--p", p.toFixed(4));
      const n = p < .3 ? 0 : p < .62 ? 1 : 2;
      if (n === phase) return;
      phase = n;
      cards.forEach((c, i) => c.classList.toggle("on", i === n));
      forge.classList.toggle("struck", n >= 1);
      forge.classList.toggle("sealed", n === 2);
    };
    addEventListener("scroll", onForge, { passive: true });
    addEventListener("resize", onForge);
    onForge();
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
      const j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (j !== undefined) { e.preventDefault(); const n = tabs[(j + tabs.length) % tabs.length]; select(n); n.focus(); }
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
