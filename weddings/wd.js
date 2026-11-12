(function(){
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  const FILMS = [
    {id:"elien-jens", t:"Elien & Jens", date:"20 september 2025", yt:"hvcm7aHr_Dc", cover:"../assets/covers/elien-jens.jpg", ar:1.896, roles:"Camera, Montage", lang:"NL"},
    {id:"joachim-felien", t:"Joachim & Felien", date:"2 mei 2026", yt:"JYeob-Q2qRs", cover:"../assets/clips/videografie/joachimFelien_1.jpg", roles:"Camera, Montage", lang:"NL"}
  ];
  const BY = Object.fromEntries(FILMS.map(f => [f.id, f]));
  const HERO = ["elienJens_4", "joachimFelien_1", "elienJens_3", "joachimFelien_2", "elienJens_1", "joachimFelien_3", "elienJens_2"]
    .map(k => ({src:`../assets/clips/videografie/${k}.mp4`, av1:`../assets/clips/videografie/${k}-av1.mp4`, poster:`../assets/clips/videografie/${k}.jpg`}));

  const bar = $("#bar");
  const onScroll = () => bar.classList.toggle("solid", scrollY > 8);
  addEventListener("scroll", onScroll, {passive:true}); onScroll();

  const menuBtn = $("#menuBtn"), drawer = $("#drawer");
  function setMenu(open){
    drawer.hidden = !open; document.body.classList.toggle("menu", open);
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.setAttribute("aria-label", open ? "Menu sluiten" : "Menu openen");
  }
  menuBtn.addEventListener("click", e => { e.stopPropagation(); setMenu(drawer.hidden); });
  drawer.addEventListener("click", e => { if(e.target.closest("a")) setMenu(false); });
  document.addEventListener("click", e => { if(!drawer.hidden && !drawer.contains(e.target)) setMenu(false); });
  addEventListener("keydown", e => { if(e.key === "Escape" && !drawer.hidden) setMenu(false); });

  // hero: the wedding clips cut one after another
  const AV1 = 'video/mp4; codecs="av01.0.08M.08"';
  const av1ok = (async () => {
    if(!navigator.mediaCapabilities) return false;
    try{
      const r = await navigator.mediaCapabilities.decodingInfo({type:"file", video:{contentType:AV1, width:1920, height:1080, bitrate:3700000, framerate:25}});
      return !!(r.supported && r.smooth && r.powerEfficient);
    }catch(e){ return false; }
  })();
  (async () => {
    const bg = $("#heroBg");
    const poster = new Image(); poster.src = HERO[0].poster; poster.alt = ""; bg.appendChild(poster);
    if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const useAv1 = await av1ok;
    const vids = [0, 1].map(() => {
      const v = document.createElement("video");
      v.muted = true; v.setAttribute("muted", ""); v.playsInline = true; v.setAttribute("playsinline", ""); v.preload = "auto";
      bg.appendChild(v); return v;
    });
    let k = 0, cur = 0, seen = true;
    const load = (v, c) => { v.src = useAv1 ? c.av1 : c.src; v.load(); };
    load(vids[0], HERO[k]); load(vids[1], HERO[(k + 1) % HERO.length]);
    const play = v => { if(seen) v.play().catch(() => {}); };
    vids[0].addEventListener("loadeddata", () => { vids[0].classList.add("on"); play(vids[0]); }, {once:true});
    vids.forEach((v, i) => v.addEventListener("ended", () => {
      if(i !== cur) return;
      const n = vids[1 - cur]; cur = 1 - cur; k = (k + 1) % HERO.length;
      const go = () => { n.classList.add("on"); v.classList.remove("on"); load(v, HERO[(k + 1) % HERO.length]); };
      play(n);
      if(n.readyState >= 2) go(); else n.addEventListener("loadeddata", go, {once:true});
    }));
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; seen ? play(vids[cur]) : vids[cur].pause(); }).observe($("#hero"));
  })();

  // portfolio: the coverflow from Uitgelicht on the portfolio
  const face = p => { const f = document.createElement("div"); f.className = "face"; const i = new Image(); i.alt = ""; i.draggable = false; i.src = p.cover; f.appendChild(i); return f; };
  const cap = p => { const c = document.createElement("div"); c.className = "cap"; c.innerHTML = `<b>${esc(p.t)}</b><span>${esc(p.date)}</span>`; return c; };
  let pv = null;
  const cf = $("#cf"), track = $("#cfTrack");
  const feat = FILMS.length < 4 ? FILMS.concat(FILMS) : FILMS;
  const n = feat.length;
  let offset = 0, goal = 0;
  const wrap = d => { d = ((d % n) + n) % n; return d >= n/2 ? d - n : d; };
  const centerIdx = () => ((Math.round(offset) % n) + n) % n;
  const cfItems = feat.map((p, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "cf-item"; b.dataset.id = p.id;
    b.setAttribute("aria-label", `${p.t}, trouwfilm ${p.date}`);
    const shade = document.createElement("span"); shade.className = "shade";
    b.append(face(p), cap(p), shade);
    b.addEventListener("click", () => {
      if(moved) return;
      const d = wrap(i - offset);
      if(Math.abs(d) < .5){ if(!pv || pv.card !== b) openPeek(b); } else { goal = Math.round(goal) + Math.sign(d); run(); }
    });
    track.appendChild(b);
    return {el:b, shade};
  });
  const erf = x => { const t = 1 / (1 + .3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const shadowCache = new Map();
  function drawShadow(el){
    let cv = el.querySelector("canvas.drop");
    if(!cv){ cv = document.createElement("canvas"); cv.className = "drop"; cv.setAttribute("aria-hidden", "true"); el.prepend(cv); }
    const w = el.offsetWidth, h = el.offsetHeight; if(!w) return;
    const k = w / 657, sig = 25 * k, off = 18 * k, m = Math.ceil(sig * 3.2), dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.round((w + 2 * m) * dpr), H = Math.round((h + 2 * m) * dpr);
    cv.style.left = cv.style.top = -m + "px"; cv.style.width = (w + 2 * m) + "px"; cv.style.height = (h + 2 * m) + "px";
    cv.width = W; cv.height = H;
    const key = W + "x" + H + "x" + w;
    if(shadowCache.has(key)){ cv.getContext("2d").putImageData(shadowCache.get(key), 0, 0); return; }
    const g = cv.getContext("2d"), img = g.createImageData(W, H), d = img.data, s2 = sig * Math.SQRT2;
    const fx = new Float32Array(W), fy = new Float32Array(H);
    for(let x = 0; x < W; x++){ const X = x / dpr - m; fx[x] = .5 * (erf(X / s2) - erf((X - w) / s2)); }
    for(let y = 0; y < H; y++){ const Y = y / dpr - m - off; fy[y] = .5 * (erf(Y / s2) - erf((Y - h) / s2)); }
    for(let y = 0, i = 0; y < H; y++) for(let x = 0; x < W; x++, i += 4){
      d[i] = 40; d[i + 1] = 28; d[i + 2] = 20;
      d[i + 3] = Math.min(255, Math.round(255 * .55 * fx[x] * fy[y] + Math.random()));
    }
    g.putImageData(img, 0, 0);
    shadowCache.set(key, img);
  }
  let shT = 0;
  const shadows = () => cfItems.forEach(({el}) => drawShadow(el));
  addEventListener("resize", () => { clearTimeout(shT); shT = setTimeout(shadows, 150); });
  requestAnimationFrame(shadows);

  let sx = 118;
  const readSx = () => { sx = parseFloat(getComputedStyle(cf).getPropertyValue("--sx")) || 118; };
  function render(){
    const front = centerIdx();
    if(pv && Math.abs(offset - pv.off) > .16) closePeek(false, true);
    cfItems.forEach(({el, shade}, i) => {
      const p = n > 1 ? wrap(i - offset) : 0, a = Math.abs(p), sg = Math.sign(p);
      let X, Z, R, B, O;
      if(a <= 1){ X = sx*p; Z = -600*a; R = -22*p; B = .25*a; O = 1; }
      else { X = sg*(sx + (a-1)*sx*.6); Z = -600 - (a-1)*400; R = -22*sg; B = .25; O = Math.max(0, Math.min(1, (1.5 - a)/.45)); }
      el.style.transform = `translate(-50%,-50%) translate3d(${X.toFixed(3)}%,0,${Z.toFixed(2)}px) rotateY(${R.toFixed(3)}deg)`;
      el.style.opacity = O.toFixed(3);
      el.style.zIndex = 100 - Math.round(a * 10);
      el.style.visibility = O < .01 ? "hidden" : "";
      el.style.pointerEvents = O < .5 ? "none" : "";
      shade.style.opacity = B.toFixed(3);
      el.tabIndex = i === front ? 0 : -1;
      el.setAttribute("aria-hidden", i === front ? "false" : "true");
    });
  }
  let raf = 0, last = 0, tau = 90;
  function frame(now){
    const dt = Math.min(64, now - (last || now)); last = now;
    const d = goal - offset;
    if(Math.abs(d) < .0008){ offset = goal; render(); raf = 0; last = 0; return; }
    offset += d * (1 - Math.exp(-dt / tau));
    render();
    raf = requestAnimationFrame(frame);
  }
  const run = (t = 90) => { tau = t; if(!raf){ last = 0; raf = requestAnimationFrame(frame); } };
  const snap = () => { goal = Math.round(goal); run(110); };
  readSx(); render();
  addEventListener("resize", () => { readSx(); render(); });
  cf.querySelectorAll(".arrow").forEach(a => a.addEventListener("click", () => { goal = Math.round(goal) + (+a.dataset.dir); run(110); }));
  cf.addEventListener("keydown", e => {
    if(e.key === "ArrowRight" || e.key === "ArrowLeft"){ goal = Math.round(goal) + (e.key === "ArrowRight" ? 1 : -1); run(110); }
  });
  const pxPerCard = () => Math.max(220, cf.clientWidth * .26);
  let quiet = null;
  const sideways = e => { const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX; return Math.abs(dx) > 2 * Math.abs(e.shiftKey ? 0 : e.deltaY) ? dx : 0; };
  const wheelBy = dx => { goal += dx / pxPerCard(); run(60); clearTimeout(quiet); quiet = setTimeout(snap, 90); };
  cf.addEventListener("wheel", e => {
    const dx = sideways(e); if(!dx) return;
    e.preventDefault();
    wheelBy(dx * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? cf.clientWidth : 1));
  }, {passive:false});
  let moved = false;
  const drag = {on:false, x:0, start:0, lx:0, lt:0, v:0};
  cf.addEventListener("pointerdown", e => {
    if(e.button !== 0 || e.target.closest(".arrow")) return;
    drag.on = true; drag.x = drag.lx = e.clientX; drag.lt = performance.now(); drag.v = 0; moved = false; drag.start = goal;
  });
  addEventListener("pointermove", e => {
    if(!drag.on) return;
    const dx = e.clientX - drag.x;
    if(!moved && Math.abs(dx) > 5) moved = true;
    if(!moved) return;
    const now = performance.now(), dt = Math.max(1, now - drag.lt);
    drag.v = drag.v*.6 + ((e.clientX - drag.lx) / dt)*.4; drag.lx = e.clientX; drag.lt = now;
    goal = drag.start - dx / pxPerCard();
    run(35);
  });
  addEventListener("pointerup", () => {
    if(!drag.on) return; drag.on = false;
    if(moved){ goal = Math.round(goal - drag.v * 180 / pxPerCard()); run(120); }
    setTimeout(() => moved = false, 0);
  });
  cf.addEventListener("dragstart", e => e.preventDefault());

  // the preview: the card grows in place and the film starts
  const pvShade = document.createElement("div"); pvShade.className = "pv-shade"; document.body.appendChild(pvShade);
  const mmss = s => { s = Math.round(s); return Math.floor(s/60) + ":" + String(s%60).padStart(2,"0"); };
  function rowHTML(p){
    const bits = [];
    if(p._hd) bits.push(`<span class="hd">HD</span>`);
    if(p._dur) bits.push(`<span>${esc(mmss(p._dur))}</span>`);
    if(p.lang) bits.push(`<span>${esc(p.lang)}</span>`);
    bits.push(`<a href="https://www.youtube.com/watch?v=${esc(p.yt)}" target="_blank" rel="noopener">YouTube ↗</a>`);
    return bits.join("");
  }
  const refreshRow = p => { if(pv && pv.p === p) pv.el.querySelector(".pv-r").innerHTML = rowHTML(p); };
  function openPeek(card){
    if(pv) closePeek(true);
    const p = BY[card.dataset.id]; if(!p) return;
    const r = card.getBoundingClientRect();
    const ar = p.ar || 16/9, odd = Math.abs(ar - 16/9) > .01;
    let W = Math.min(r.width * 1.12, innerWidth - 32), H = W / ar;
    if(odd){ H = Math.min(H, innerHeight - 260); W = Math.min(H * ar, innerWidth - 32); H = W / ar; }
    const L = Math.max(16, Math.min(innerWidth - 16 - W, r.left + r.width/2 - W/2));
    let T = r.top + r.height/2 - H/2;
    if(odd) T = Math.max(84, Math.min(T, innerHeight - H - 190));
    const el = document.createElement("div");
    el.className = "pv";
    el.innerHTML = `<div class="pv-media"></div><div class="pv-info"><div class="pv-t">${esc(p.t)}</div><div class="pv-role">${esc(p.roles)}</div><div class="pv-m">Trouwfilm · ${esc(p.date)}</div><div class="pv-r"></div></div>`;
    const media = el.querySelector(".pv-media");
    if(odd) media.style.aspectRatio = String(ar);
    media.append(face(p), cap(p));
    const top0 = T + scrollY;
    el.style.left = L + "px"; el.style.top = top0 + "px"; el.style.width = W + "px";
    el.style.fontSize = Math.min(24, Math.max(W, 300) / 375 * 16) + "px";
    el.style.setProperty("--k", (W / r.width).toFixed(4));
    const shrunk = () => {
      const q = card.getBoundingClientRect(), k = ar < 16/9 ? q.height / H : q.width / W;
      const x = q.left + q.width/2 - W*k/2, y = q.top + scrollY + q.height/2 - H*k/2;
      return `translate(${(x - L).toFixed(2)}px,${(y - top0).toFixed(2)}px) scale(${k.toFixed(4)})`;
    };
    el.style.transform = shrunk();
    el.style.visibility = "hidden";
    document.body.appendChild(el);
    const me = pv = {el, card, p, shrunk, off: offset};
    refreshRow(p);
    el.addEventListener("wheel", e => { const dx = sideways(e); if(!dx) return; e.preventDefault(); wheelBy(dx); }, {passive:false});
    const fi = media.querySelector("img");
    Promise.race([fi.decode ? fi.decode().catch(() => {}) : 0, new Promise(res => setTimeout(res, 150))]).then(() => {
      if(pv !== me) return;
      el.style.visibility = "";
      card.classList.add("lifted");
      requestAnimationFrame(() => {
        if(pv !== me) return;
        el.classList.add("open"); el.style.transform = "none";
        pvShade.classList.add("on");
        setTimeout(() => { if(pv === me) startClip(p, media); }, 60);
      });
    });
  }
  function startClip(p, media){
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${p.yt}?autoplay=1&rel=0&playsinline=1&modestbranding=1&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
    f.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture"; f.allowFullscreen = true; f.title = p.t;
    f.addEventListener("load", () => { try{ f.contentWindow.postMessage(JSON.stringify({event:"listening", id:p.id, channel:"widget"}), "*"); }catch(e){} });
    media.appendChild(f);
    setTimeout(() => f.classList.add("on"), 2500);
  }
  function closePeek(now, fade){
    if(!pv) return;
    const {el, card, shrunk} = pv; pv = null;
    pvShade.classList.remove("on");
    let gone = false;
    const done = () => { if(gone) return; gone = true; el.remove(); card.classList.remove("lifted"); };
    if(now || el.style.visibility === "hidden"){ done(); return; }
    const m = el.querySelector("iframe"); if(m) m.remove();
    el.classList.remove("open");
    if(fade){
      el.style.transition = "opacity .22s ease"; el.style.opacity = "0";
      setTimeout(done, 320); return;
    }
    el.style.transform = shrunk();
    el.addEventListener("transitionend", e => { if(e.target === el && e.propertyName === "transform") done(); });
    setTimeout(done, 520);
  }
  addEventListener("keydown", e => { if(e.key === "Escape") closePeek(); });
  let swallow = false;
  document.addEventListener("pointerdown", e => {
    if(pv && !pv.el.contains(e.target) && !pv.card.contains(e.target)){ closePeek(); swallow = !e.target.closest(".bar,#drawer"); }
  }, true);
  document.addEventListener("click", e => { if(swallow){ swallow = false; e.preventDefault(); e.stopPropagation(); } }, true);
  addEventListener("message", e => {
    if(!/youtube/.test(e.origin) || !pv) return;
    let d; try{ d = typeof e.data === "string" ? JSON.parse(e.data) : e.data; }catch(err){ return; }
    if(!d || d.event !== "infoDelivery" || !d.info) return;
    const p = pv.p; let ch = false;
    if(d.info.playerState === 1){ const f = pv.el.querySelector("iframe"); if(f) f.classList.add("on"); }
    if(d.info.duration && !p._dur){ p._dur = d.info.duration; ch = true; }
    const q = d.info.availableQualityLevels;
    if(Array.isArray(q) && q.length && p._hd == null){ p._hd = q.some(l => /hd|highres/.test(l)); ch = true; }
    if(ch) refreshRow(p);
  });
  let fsQuiet = 0;
  const fsChange = () => { fsQuiet = performance.now() + 1500; };
  document.addEventListener("fullscreenchange", fsChange); document.addEventListener("webkitfullscreenchange", fsChange);
  addEventListener("resize", () => { if(document.fullscreenElement || document.webkitFullscreenElement || performance.now() < fsQuiet) return; closePeek(true); });

  // a package button picks that package in the form
  document.querySelectorAll("[data-pk]").forEach(b => b.addEventListener("click", () => {
    const r = document.querySelector(`input[name=pakket][value="${b.dataset.pk}"]`); if(r) r.checked = true;
  }));

  // a package can be picked and clicked off again
  document.querySelectorAll(".kind input").forEach(r => {
    let was = false;
    r.closest("label").addEventListener("pointerdown", () => { was = r.checked; });
    r.addEventListener("click", () => { if(was){ r.checked = false; was = false; } });
  });

  // the request, through the same mailbox as the contact form on the portfolio
  const W3F = "60a154af-3604-416d-95fd-a40dd07668a2";
  const form = $("#req"), msg = $("#reqMsg"), btn = form.querySelector("[type=submit]");
  const say = (s, bad) => { msg.textContent = s; msg.hidden = false; msg.classList.toggle("bad", !!bad); };
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if(!form.reportValidity()) return;
    const f = new FormData(form);
    if(f.get("_honey")) return;
    const datum = f.get("datum") ? new Date(f.get("datum") + "T12:00:00").toLocaleDateString("nl-BE", {day:"numeric", month:"long", year:"numeric"}) : "";
    const data = {access_key:W3F, subject:`Trouwfilm: ${f.get("namen")} – ${datum}`, from_name:"tristannijs.media/weddings",
      name:f.get("namen"), email:f.get("email"), replyto:f.get("email"), trouwdatum:datum, locatie:f.get("locatie") || "-", pakket:f.get("pakket") || "-", message:f.get("bericht") || "-"};
    btn.disabled = true; say("Bezig met versturen…");
    try{
      const r = await fetch("https://api.web3forms.com/submit", {method:"POST", headers:{"Content-Type":"application/json", Accept:"application/json"}, body:JSON.stringify(data)});
      const j = await r.json().catch(() => ({}));
      if(!r.ok || !j.success) throw 0;
      form.reset(); say("Verstuurd. Ik antwoord jullie zo snel mogelijk.");
    }catch(err){ say("Versturen lukte niet. Mail gerust naar tristannijs.media@gmail.com.", true); }
    btn.disabled = false;
  });
})();
