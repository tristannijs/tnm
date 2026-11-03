(function(){
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const D = s => Date.parse(s+"T12:00:00Z");
  const DAY = 864e5;
  const P = window.PROJECTS;
  const BY = Object.fromEntries(P.map(p=>[p.id,p]));
  const COLOR = c => "var(--c-"+(["fictie","docu","iao"].includes(c)?"ritcs":c)+")";
  const yt = (id,q) => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
  const flat = s => s.replace(/\s*\n\s*/g, " ");
  const L = window.I18N, t = (k, v) => L.t(k, v);
  const sub = p => L.sub(p.sub), when = p => L.date(p), lab = p => L.label(p.label);

  // image for a card: own cover, else YouTube's (maxres, falling back to hq)
  function coverImg(p){
    const img = new Image(); img.alt = ""; img.loading = "lazy"; img.draggable = false;
    const gone = () => { img.onerror = null; img.remove(); };
    if(p.cover){ img.src = p.cover; img.onerror = gone; }
    else if(p.yt){ img.src = yt(p.yt,"maxresdefault"); img.onerror = ()=>{ img.onerror = gone; img.src = yt(p.yt,"hqdefault"); }; }
    return img;
  }
  function face(p){
    const f = document.createElement("div"); f.className = "face";
    if(p.cover || p.yt) f.appendChild(coverImg(p));
    return f;
  }
  // a card on the page only shows its title; what it is, the year and the roles are in the opened preview
  const RITCS = {fictie:1, docu:1, iao:1};
  const kind = p => p.cat === "iao" ? "IAO" : RITCS[p.cat] ? "RITCS" : t("type." + p.cat);
  const year = p => (p.t1 || p.t0 || "").slice(0, 4);
  const title = p => p.name ? L.label(p.name) : flat(lab(p));
  const capHTML = p => `<b>${esc(title(p))}</b>`;
  // what Tristan did on it, bottom right of a featured card
  const VIDCAT = {event:1, trouw:1, promo:1};
  // a project's tags: film projects list theirs (fictie / docu, ritcs, iao), videography uses its kind
  const tagsOf = p => p.tags || (VIDCAT[p.cat] ? [p.cat] : []);
  const TAGC = {event:1, trouw:1, promo:1, ritcs:1, iao:1, fictie:1, docu:1};
  const rolesOf = p => (p.roles || []).map(L.role);
  function roles(p){
    const r = document.createElement("i"); r.className = "roles"; r.dataset.pid = p.id;
    r.textContent = rolesOf(p).join(", ");
    return r;
  }
  function cap(p){
    const c = document.createElement("div"); c.className = "cap"; c.dataset.pid = p.id;
    c.innerHTML = capHTML(p);
    return c;
  }

  // ---------- top bar ----------
  const bar = $("#bar");
  // black as soon as the page scrolls; Video / Film / Overig only come in once the hero words have
  // scrolled away under the bar
  const doorsEl = $("#doors");
  const onScroll = () => {
    bar.classList.toggle("solid", scrollY > 8);
    bar.classList.toggle("links", document.body.classList.contains("is-work") || doorsEl.getBoundingClientRect().bottom < bar.offsetHeight);
  };
  addEventListener("scroll", onScroll, {passive:true}); addEventListener("resize", onScroll); onScroll();

  const menuBtn = $("#menuBtn"), drawer = $("#drawer");
  function setMenu(open){
    drawer.hidden = !open;
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.setAttribute("aria-label", t(open ? "menu.close" : "menu.open"));
  }
  menuBtn.addEventListener("click", e => { e.stopPropagation(); setMenu(drawer.hidden); });
  drawer.addEventListener("click", e => { if(e.target.closest("a")) setMenu(false); });
  document.addEventListener("click", e => { if(!drawer.hidden && !e.target.closest("#drawer")) setMenu(false); });
  document.addEventListener("keydown", e => { if(e.key === "Escape") setMenu(false); });

  // ---------- language: NL / EN / FR ----------
  const langBtn = $("#langBtn"), langMenu = $("#langMenu");
  function setLangMenu(open){ langMenu.hidden = !open; langBtn.setAttribute("aria-expanded", open); }
  function showLang(){
    langBtn.textContent = L.lang.toUpperCase();
    langBtn.setAttribute("aria-label", `${t("lang.label")}: ${L.lang.toUpperCase()}`);
    langMenu.querySelectorAll("[data-lang]").forEach(b => b.setAttribute("aria-current", b.dataset.lang === L.lang ? "true" : "false"));
  }
  langBtn.addEventListener("click", e => { e.stopPropagation(); setLangMenu(langMenu.hidden); });
  langMenu.addEventListener("click", e => { const b = e.target.closest("[data-lang]"); if(!b) return; setLangMenu(false); L.set(b.dataset.lang); });
  document.addEventListener("click", e => { if(!langMenu.hidden && !e.target.closest(".lang-wrap")) setLangMenu(false); });
  document.addEventListener("keydown", e => { if(e.key === "Escape") setLangMenu(false); });
  L.apply(); showLang();
  L.onChange(() => {
    showLang(); setMenu(!drawer.hidden);
    document.querySelectorAll(".cap[data-pid]").forEach(c => { const p = BY[c.dataset.pid]; if(p) c.innerHTML = capHTML(p); });
    document.querySelectorAll(".roles[data-pid]").forEach(r => { const p = BY[r.dataset.pid]; if(p) r.textContent = rolesOf(p).join(", "); });
    cfItems.forEach(({el}, i) => el.setAttribute("aria-label", `${title(feat[i])}, ${kind(feat[i])} ${year(feat[i])}`));
  });

  // ---------- hero: a layer per background; hovering a door swaps to its layer ----------
  const layers = [...document.querySelectorAll(".hero-bg .layer")];
  // each layer shows its still right away; a layer with a video plays that on top of it.
  // Videos of layers you don't see yet only start downloading once the page itself has loaded,
  // so they never slow down the first view but are ready by the time you hover a button.
  // A layer can offer an AV1 file (data-video-av1) next to the H.264 one (data-video): AV1 looks
  // better at half the size, but is only used where the browser says it can play it smoothly.
  const AV1 = 'video/mp4; codecs="av01.0.08M.10"';
  const av1ok = (async () => {
    if(!navigator.mediaCapabilities) return false;
    try{
      const r = await navigator.mediaCapabilities.decodingInfo({type:"file", video:{contentType:AV1, width:1920, height:1080, bitrate:3700000, framerate:25}});
      return !!(r.supported && r.smooth);
    }catch(e){ return false; }
  })();
  async function pickVideo(l){ return l.dataset.videoAv1 && await av1ok ? l.dataset.videoAv1 : l.dataset.video; }
  const hoverable = matchMedia("(any-hover: hover)").matches;
  const afterLoad = fn => document.readyState === "complete" ? fn() : addEventListener("load", fn, {once:true});

  // A layer with data-clips="ritcs" plays that category's short clips from assets/clips/clips.js in a random
  // order, cut hard one after the other. Two <video>s take turns: one plays, the other has the next clip ready.
  // Each clip says where its point of interest is (and, for clips with a cut or a move, how that changes over
  // time), so a screen narrower than 16:9 crops around it instead of around the middle.
  function clipLayer(l){
    const C = window.CLIPS || {};
    // data-clips="all": every category's clips in one pool (the background when no button is hovered)
    // data-skip leaves out projects by name, e.g. data-skip="jonathan nelson"
    const skip = (l.dataset.skip || "").toLowerCase().split(/\s+/).filter(Boolean);
    const list = (l.dataset.clips === "all" ? Object.values(C).flat() : C[l.dataset.clips] || []).filter(c => !skip.includes(c.project));
    if(!list.length) return null;
    const vids = [0, 1].map(() => {
      const v = document.createElement("video");
      v.muted = true; v.setAttribute("muted", ""); v.playsInline = true; v.setAttribute("playsinline", "");
      v.preload = "none"; v.className = "clip";
      l.appendChild(v); return v;
    });
    let bag = [], last = null, cur = 0, playing = false, raf = 0, useAv1 = false;
    av1ok.then(ok => useAv1 = ok);
    // random order: every clip once before any repeats, never two clips of the same project in a row
    function next(){
      if(!bag.length){ bag = list.slice(); for(let i = bag.length - 1; i > 0; i--){ const j = Math.random() * (i + 1) | 0; [bag[i], bag[j]] = [bag[j], bag[i]]; } }
      let k = bag.findIndex(c => !last || c.project !== last.project || list.length < 2);
      if(k < 0) k = 0;
      return last = bag.splice(k, 1)[0];
    }
    function load(v, c){ v.clip = c; v.src = useAv1 ? c.av1 : c.src; v.poster = c.poster; v.preload = "auto"; v.load(); }
    // where the point of interest is at time t. Key points are [t, x, y, glide]: from a key point the spot
    // stays put until the next one (a cut: the new shot is framed from its first frame), unless glide is set,
    // then it moves in a straight line to the next one (a subject walking through one shot)
    function at(c, t){
      const f = c.focus;
      if(!f) return [c.x, c.y];
      t += .01;                                   // frame times can come in a hair early
      let i = 0; while(i < f.length - 1 && f[i + 1][0] <= t) i++;
      if(i === f.length - 1 || !f[i][3]) return [f[i][1], f[i][2]];
      const [t0, x0, y0] = f[i], [t1, x1, y1] = f[i + 1], k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
      return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
    }
    // the crop window centred on the point as far as the frame allows, as a fraction 0..1 of the room to move
    const pos = (p, vis) => vis >= 1 ? .5 : Math.min(1, Math.max(0, (p - vis / 2) / (1 - vis)));
    function place(v, t){
      const c = v.clip; if(!c) return;
      const W = l.clientWidth, H = l.clientHeight, va = (v.videoWidth / v.videoHeight) || 16 / 9, ca = W / H;
      const [x, y] = at(c, t ?? v.currentTime ?? 0);
      const op = `${(pos(x, ca / va) * 100).toFixed(2)}% ${(pos(y, va / ca) * 100).toFixed(2)}%`;
      if(v.style.objectPosition !== op) v.style.objectPosition = op;
    }
    // Where the browser reports every video frame (requestVideoFrameCallback), each frame is painted into a
    // canvas together with its own crop. Moving the crop with CSS instead lands one frame late on phones, so
    // the first frame after a cut still showed the old framing. The <video> keeps playing underneath.
    const RVFC = "requestVideoFrameCallback" in HTMLVideoElement.prototype;
    const cv = RVFC ? document.createElement("canvas") : null, g = cv && cv.getContext("2d", {alpha:false});
    if(cv){ cv.className = "clip-canvas"; l.appendChild(cv); }
    function paint(v, t){
      if(!v.clip || v.readyState < 2) return false;
      const dpr = Math.min(devicePixelRatio || 1, 2), W = Math.round(l.clientWidth * dpr), H = Math.round(l.clientHeight * dpr);
      if(!W || !H) return false;
      if(cv.width !== W || cv.height !== H){ cv.width = W; cv.height = H; }
      const vw = v.videoWidth, vh = v.videoHeight, s = Math.max(W / vw, H / vh), sw = W / s, sh = H / s;
      const [x, y] = at(v.clip, t);
      g.drawImage(v, pos(x, sw / vw) * (vw - sw), pos(y, sh / vh) * (vh - sh), sw, sh, 0, 0, W, H);
      if(!l.classList.contains("painted")) l.classList.add("painted");
      return true;
    }
    function tick(){
      const v = vids[cur];
      place(v);
      if(!playing){ raf = 0; return; }
      if(RVFC){ const me = rv = v; raf = me.requestVideoFrameCallback((now, m) => { raf = 0; if(me !== vids[cur]) return; paint(me, m.mediaTime); tick(); }); }
      else if(v.clip && v.clip.focus) raf = requestAnimationFrame(tick);
      else raf = 0;
    }
    let rv = null;
    function stop(){ if(!raf) return; if(RVFC) rv.cancelVideoFrameCallback(raf); else cancelAnimationFrame(raf); raf = 0; }
    function track(){ stop(); tick(); }
    function show(i){
      vids.forEach((v, k) => v.classList.toggle("cur", k === i));
    }
    vids.forEach((v, i) => v.addEventListener("ended", () => {
      if(i !== cur) return;
      const n = vids[1 - cur];
      cur = 1 - cur;
      place(n);
      // cut as soon as the next clip has a frame; until then the last frame of this one stays
      const go = () => { show(cur); track(); load(v, next()); };
      if(playing){ n.play().catch(() => {}); }
      if(n.readyState >= 2) go(); else n.addEventListener("loadeddata", go, {once:true});
    }));
    vids.forEach(v => v.addEventListener("loadedmetadata", () => place(v)));
    addEventListener("resize", () => { vids.forEach(v => place(v)); if(cv) paint(vids[cur], vids[cur].currentTime); });
    let started = false;
    async function start(){
      if(started) return; started = true;
      useAv1 = await av1ok;
      load(vids[0], next()); load(vids[1], next());
      show(0);
    }
    const p = {
      play(){ start().then(() => { playing = true; vids[cur].play().catch(() => {}); track(); }); },
      pause(){ playing = false; vids[cur].pause(); stop(); }
    };
    // the layer you see first plays straight away, on every device; the hover layers fetch their first clips
    // once the page has loaded, and only where hovering exists (not on phones)
    if(l.classList.contains("on")) p.play();
    else if(hoverable) afterLoad(start);
    return p;
  }

  layers.forEach(l => {
    if(l.dataset.img){ const i = new Image(); i.src = l.dataset.img; i.alt = ""; l.appendChild(i); }
    if(l.dataset.clips){ l.player = clipLayer(l); return; }
    if(l.dataset.video){
      const on = l.classList.contains("on"), v = document.createElement("video");
      v.muted = true; v.setAttribute("muted", ""); v.loop = true; v.playsInline = true; v.setAttribute("playsinline", "");
      v.preload = on ? "auto" : "none"; v.autoplay = on;
      l.appendChild(v);
      l.player = { play: () => v.play().catch(() => {}), pause: () => v.pause() };
      pickVideo(l).then(src => {
        v.src = src;
        if(l.classList.contains("on")) v.play().catch(() => {});
        // the hover-only layers are fetched ahead only where hovering exists (not on phones)
        else if(hoverable) afterLoad(() => { v.preload = "auto"; v.load(); });
      });
    }
  });
  // the background stays put while the page scrolls over it; once the hero is out of sight it stops playing
  let heroSeen = true, curKey = "home";
  new IntersectionObserver(([e]) => {
    heroSeen = e.isIntersecting;
    $(".hero-bg").style.visibility = heroSeen ? "" : "hidden";
    layers.forEach(l => { if(l.player && l.dataset.key === curKey){ heroSeen ? l.player.play() : l.player.pause(); } });
  }).observe($("#hero"));
  function showLayer(key){
    curKey = key;
    layers.forEach(l => {
      const on = l.dataset.key === key;
      l.classList.toggle("on", on);
      if(l.player){ if(on && heroSeen) l.player.play(); else l.player.pause(); }
    });
  }
  const doors = $("#doors");
  // hovering a door previews its background (only on the start page)
  const onHome = () => !document.body.classList.contains("is-work");
  doors.querySelectorAll(".door").forEach(d => {
    d.addEventListener("mouseenter", () => { if(onHome()) showLayer(d.dataset.bg); });
    d.addEventListener("focus", () => { if(onHome()) showLayer(d.dataset.bg); });
    d.addEventListener("blur", () => { if(onHome()) showLayer("home"); });
  });
  doors.addEventListener("mouseleave", () => { if(onHome()) showLayer("home"); });

  // ---------- Uitgelicht: cards on a turntable that follows your fingers ----------
  const cf = $("#cf"), track = $("#cfTrack");
  const feat = window.FEATURED.map(id => BY[id]).filter(Boolean);
  const n = feat.length;
  $("#featN").textContent = `[${n}]`;
  // `offset` is which card is in the middle, as a continuous number (1.4 = 40% of the way
  // from card 1 to card 2). Input moves `goal`; every frame `offset` glides toward it.
  let offset = 0, goal = 0;
  const wrap = d => { d = ((d % n) + n) % n; return d >= n/2 ? d - n : d; };
  const centerIdx = () => ((Math.round(offset) % n) + n) % n;
  const cfItems = feat.map((p,i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "cf-item"; b.style.setProperty("--c", COLOR(p.cat));
    b.setAttribute("aria-label", `${title(p)}, ${kind(p)} ${year(p)}`); b.dataset.id = p.id;
    const shade = document.createElement("span"); shade.className = "shade";
    b.append(face(p), cap(p), roles(p), shade);
    b.addEventListener("click", () => {
      if(moved) return;
      const d = wrap(i - offset);
      // the front card opens into its preview right away (hovering 1 s does the same)
      if(Math.abs(d) < .5){ if(!pv || pv.card !== b) openPeek(b); } else { goal = Math.round(goal) + Math.sign(d); run(); }
    });
    track.appendChild(b);
    return {el:b, shade};
  });
  // ---- the cards' drop shadow, drawn per pixel ----
  // A CSS shadow this dark only spans about 11 grey levels on #111, and browsers round every pixel to the
  // nearest level, so the soft edge shows as rings. Photoshop dithers when it writes 8-bit; browsers don't.
  // So the shadow is drawn here into a canvas at the screen's own pixel size, with each pixel's level
  // chosen by dithering, the way Photoshop would. Same shape as the CSS shadow it replaces
  // (0 18px 50px rgba(0,0,0,.66) at 1440 px), scaled with the card.
  const BG = 17;                                   // #111
  const erf = x => { const t = 1 / (1 + .3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const shadowCache = new Map();     // one computed shadow per card size: the grid's cards share it
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
      const v = BG * (1 - .66 * fx[x] * fy[y]);              // the grey this pixel should be over #111
      const lv = Math.min(BG, Math.floor(v + Math.random()));  // dithered to a whole level
      d[i + 3] = 15 * (BG - lv);                               // black at the alpha that gives exactly that level
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
    // turning the carousel closes a preview that is open on it
    if(pv && pv.ctx === cfCtx && Math.abs(offset - pv.off) > .01) closePeek();
    cfItems.forEach(({el, shade}, i) => {
      const p = n > 1 ? wrap(i - offset) : 0, a = Math.abs(p), sg = Math.sign(p);
      let X, Z, R, B, O;
      if(a <= 1){ X = sx*p; Z = -600*a; R = -22*p; B = .4*a; O = 1; }
      else { X = sg*(sx + (a-1)*sx*.6); Z = -600 - (a-1)*400; R = -22*sg; B = .4; O = Math.max(0, Math.min(1, (1.5 - a)/.45)); }
      el.style.transform = `translate(-50%,-50%) translate3d(${X.toFixed(3)}%,0,${Z.toFixed(2)}px) rotateY(${R.toFixed(3)}deg)`;
      el.style.opacity = O.toFixed(3);
      el.style.zIndex = 100 - Math.round(a * 10);     // nearest card on top (the track is drawn flat)
      el.style.visibility = O < .01 ? "hidden" : "";
      el.style.pointerEvents = O < .5 ? "none" : "";
      shade.style.opacity = B.toFixed(3);
      el.tabIndex = i === front ? 0 : -1;
      el.setAttribute("aria-hidden", i === front ? "false" : "true");
    });
  }
  // the glide: frame-rate independent easing of offset toward goal
  let raf = 0, last = 0, tau = 90;
  function frame(now){
    const dt = Math.min(64, now - (last || now)); last = now;
    const d = goal - offset;
    if(Math.abs(d) < .0008){ offset = goal; render(); raf = 0; last = 0; cfSettled(); return; }
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
  // sideways scroll (trackpad, shift + wheel) turns it as far and fast as you scroll;
  // plain up/down keeps scrolling the page. When the scrolling stops it settles on a card.
  let quiet = null;
  cf.addEventListener("wheel", e => {
    const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
    if(Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? cf.clientWidth : 1;
    goal += dx * unit / pxPerCard();
    run(60);
    clearTimeout(quiet); quiet = setTimeout(snap, 90);
  }, {passive:false});
  // drag or swipe: follows the finger, and a flick carries on in proportion to its speed
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


  // ---------- Uitgelicht: rest 1 s on the front card and it opens up and plays ----------
  // The card grows a little into a playing preview with its details underneath; the page dims.
  const VIDEO = {event:1, trouw:1, promo:1};
  const pvType = p => p.type || (VIDEO[p.cat] ? t("type." + p.cat) : sub(p));
  const pvTitle = p => {
    if(p.title) return p.title;
    const n = flat(lab(p));
    // videography: add the subtitle unless it only repeats the type ("Wejo × Bocco: Pop-up opening")
    return VIDEO[p.cat] && p.sub && sub(p).toLowerCase() !== pvType(p).toLowerCase() ? `${n}: ${sub(p)}` : n;
  };
  const mmss = s => { s = Math.round(s); return Math.floor(s/60) + ":" + String(s%60).padStart(2,"0"); };
  const ICON = {
    clock:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M12 5.5V12l4.2 2.6" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round"/></svg>`,
    audio:`<svg viewBox="0 0 30 24" aria-hidden="true"><path d="M2 8.5h5L13 3v18l-6-5.5H2z" fill="currentColor"/><path d="M17 8.2a5.3 5.3 0 0 1 0 7.6M20.3 5a9.8 9.8 0 0 1 0 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    subs:`<svg viewBox="0 0 26 24" aria-hidden="true"><path d="M2 2h22v15H9l-5 5v-5H2z" fill="currentColor"/><path d="M6.5 7.5h13M6.5 11.5h13" stroke="#000" stroke-width="1.8"/></svg>`
  };
  // any device with a mouse or trackpad (touch-only screens tap straight to the player)
  var cfSettled = () => {};
  const shade = document.createElement("div"); shade.className = "pv-shade"; document.body.appendChild(shade);
  // var, not let: the carousel above already checks `pv` while it draws its first frame
  var pv = null, peekTimer = 0, peekLeft = 0;
  const cfCtx = {
    grow: 1.12, cls: "pv-cf",
    home: c => c.getBoundingClientRect(),
    shift: () => 0,
    begin(){}, open(){}, close(){},
    // sideways scrolling keeps turning the carousel; the preview closes as soon as it moves
    wheel(dx){ goal += dx / pxPerCard(); run(60); clearTimeout(quiet); quiet = setTimeout(snap, 90); }
  };

  function rowHTML(p){
    const hd = p.hd ?? p._hd, dur = p.dur || (p._dur ? mmss(p._dur) : "");
    const bits = [];
    if(hd) bits.push(`<span class="hd">HD</span>`);
    if(dur) bits.push(`<span>${ICON.clock}${esc(dur)}</span>`);
    if(p.lang) bits.push(`<span>${ICON.audio}${esc(p.lang)}</span>`);
    if(p.subs) bits.push(`<span>${ICON.subs}${esc(p.subs)}</span>`);
    return bits.join("");
  }
  function refreshRow(p){
    if(!pv || pv.p !== p) return;
    const r = pv.el.querySelector(".pv-r"); r.innerHTML = rowHTML(p); r.hidden = !r.innerHTML;
  }

  function openPeek(card, ctx = cfCtx){
    if(pv) closePeek(true);
    const p = BY[card.dataset.id]; if(!p) return;
    const r = ctx.home(card);
    // where the preview ends up: grown around the card's centre, kept inside the window
    const W = Math.min(r.width * ctx.grow, innerWidth - 32), H = W * 9/16;
    const L = Math.max(16, Math.min(innerWidth - 16 - W, r.left + r.width/2 - W/2));
    const T = r.top + r.height/2 - H/2;
    const el = document.createElement("div");
    el.className = "pv " + ctx.cls; el.style.setProperty("--c", COLOR(p.cat));
    el.setAttribute("role", "button"); el.setAttribute("aria-label", t("play", {t:pvTitle(p)}));
    el.innerHTML = `<div class="pv-media"></div>
      <div class="pv-info"><div class="pv-t">${esc(p.gt ? p.gt + (p.gs ? ": " + p.gs : "") : RITCS[p.cat] ? title(p) : pvTitle(p))}</div>${rolesOf(p).length ? `<div class="pv-role">${esc(rolesOf(p).join(", "))}${(p.credits || []).map(([r, n]) => `<small>${esc(L.role(r))}: ${esc(n)}</small>`).join("")}</div>` : ""}
        <div class="pv-m">${esc(when(p))}</div>
        <div class="pv-tags">${tagsOf(p).slice().sort((a, b) => !!TAGC[b] - !!TAGC[a]).map(g => `<span class="pv-tag">${TAGC[g] ? `<i class="sq" style="background:var(--c-${g})"></i>` : ""}${esc(t("f." + g))}</span>`).join("")}</div>
        <div class="pv-r"></div></div>`;
    const media = el.querySelector(".pv-media");
    // reuse the card's own, already decoded picture so the first frame is never empty
    const own = card.querySelector(".face img"), f = face(p), fi = f.querySelector("img");
    if(own && fi){ fi.src = own.currentSrc || own.src; fi.loading = "eager"; }
    media.append(f, cap(p));
    // the preview is laid out once at its final size; growing is a pure scale from the card,
    // which the graphics card animates without the page having to re-lay out every frame
    el.style.left = L + "px"; el.style.top = (T + scrollY) + "px"; el.style.width = W + "px";
    el.style.fontSize = Math.min(24, Math.max(W, 300) / 375 * 16) + "px";
    el.style.setProperty("--k", (W / r.width).toFixed(4));
    ctx.begin();
    const shrunk = () => { const q = ctx.home(card), dx = ctx.shift(); return `translate(${(q.left - L - dx).toFixed(2)}px,${(q.top - T).toFixed(2)}px) scale(${(q.width / W).toFixed(4)})`; };
    el.style.transform = shrunk();
    el.style.visibility = "hidden";
    document.body.appendChild(el);
    const me = pv = {el, card, p, shrunk, ctx, off: offset};
    refreshRow(p);
    // sideways scrolling over the open preview keeps turning the carousel underneath it
    el.addEventListener("wheel", e => {
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      if(Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerWidth : 1;
      ctx.wheel(dx * unit);
    }, {passive:false});
    // start the moment the picture is ready to draw (a cached one is ready within a frame)
    const ready = fi && fi.decode ? fi.decode().catch(() => {}) : Promise.resolve();
    Promise.race([ready, new Promise(res => setTimeout(res, 150))]).then(() => {
      if(pv !== me) return;
      el.style.visibility = "";
      card.classList.add("lifted");
      requestAnimationFrame(() => {
        if(pv !== me) return;
        el.classList.add("open"); el.style.transform = "none";
        shade.classList.add("on");
        ctx.open(card, {left:L + ctx.shift(), right:L + W + ctx.shift(), mid:T + H/2});
        // the clip starts loading right away (YouTube loads in its own process, the motion stays smooth)
        setTimeout(() => { if(pv === me) startClip(p, media); }, 60);
      });
    });
  }
  addEventListener("keydown", e => { if(e.key === "Escape") closePeek(); });
  // an open preview closes with Escape or a click anywhere else on the page (hovering does nothing)
  let swallow = false;
  document.addEventListener("pointerdown", e => {
    if(pv && !pv.el.contains(e.target) && !pv.card.contains(e.target)){ closePeek(); swallow = !e.target.closest(".bar,#drawer"); }
  }, true);
  document.addEventListener("click", e => { if(swallow){ swallow = false; e.preventDefault(); e.stopPropagation(); } }, true);
  // The preview is the player, as the old player window was: YouTube's own player with sound and its own
  // controls (or the video file with the browser's controls)
  function startClip(p, media){
    if(p.vids){
      const v = document.createElement("video");
      Object.assign(v, {src:p.vids[0].src, autoplay:true, controls:true, playsInline:true});
      v.addEventListener("loadedmetadata", () => { p._dur = v.duration; if(p.hd == null) p._hd = v.videoHeight >= 720; refreshRow(p); });
      // a project made of several videos: numbered buttons to switch between them
      if(p.vids.length > 1){
        const parts = document.createElement("div"); parts.className = "pv-parts";
        parts.innerHTML = p.vids.map((x, i) => `<button type="button"${i ? "" : ' aria-current="true"'}>${i + 1}</button>`).join("");
        parts.addEventListener("click", e => {
          const b = e.target.closest("button"); if(!b) return;
          parts.querySelectorAll("button").forEach(x => x.removeAttribute("aria-current")); b.setAttribute("aria-current", "true");
          v.src = p.vids[[...parts.children].indexOf(b)].src; p._dur = 0; v.play().catch(() => {});
        });
        media.closest(".pv").querySelector(".pv-info").appendChild(parts);
      }
      v.addEventListener("playing", () => v.classList.add("on"));
      media.appendChild(v);
    } else if(p.yt){
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${p.yt}?autoplay=1&rel=0&playsinline=1&modestbranding=1&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
      f.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture"; f.allowFullscreen = true; f.title = pvTitle(p);
      // ask the player for its state, duration and quality levels
      f.addEventListener("load", () => {
        try{ f.contentWindow.postMessage(JSON.stringify({event:"listening", id:p.id, channel:"widget"}), "*"); }catch(e){}
      });
      media.appendChild(f);
      // if the browser holds autoplay back, show the player anyway so its play button can be used
      setTimeout(() => f.classList.add("on"), 2500);
    }
  }
  function closePeek(now){
    clearTimeout(peekTimer);
    if(!pv) return;
    const {el, card, shrunk, ctx} = pv; pv = null;
    shade.classList.remove("on"); ctx.close();
    let gone = false;
    const done = () => { if(gone) return; gone = true; el.remove(); card.classList.remove("lifted"); };
    if(now || el.style.visibility === "hidden"){ done(); return; }
    const m = el.querySelector("iframe,video"); if(m) m.remove();
    el.classList.remove("open");
    el.style.transform = shrunk();
    el.addEventListener("transitionend", e => { if(e.target === el && e.propertyName === "transform") done(); });
    setTimeout(done, 520);
  }
  addEventListener("message", e => {
    if(!/youtube/.test(e.origin) || !pv) return;
    let d; try{ d = typeof e.data === "string" ? JSON.parse(e.data) : e.data; }catch(err){ return; }
    if(!d || d.event !== "infoDelivery" || !d.info) return;
    const p = pv.p; let ch = false;
    // only show the player once it is really playing; until then the cover stays
    if(d.info.playerState === 1){ const f = pv.el.querySelector("iframe"); if(f) f.classList.add("on"); }
    if(d.info.duration && !p._dur){ p._dur = d.info.duration; ch = true; }
    const q = d.info.availableQualityLevels;
    if(Array.isArray(q) && q.length && p.hd == null && p._hd == null){ p._hd = q.some(l => /hd|highres/.test(l)); ch = true; }
    if(ch) refreshRow(p);
  });
  // a resize moves the cards, so an open preview closes, except the resize that going into or out of
  // full screen causes (that closed the player the moment its full-screen button was pressed)
  let fsQuiet = 0;
  const fsChange = () => { fsQuiet = performance.now() + 1500; };
  document.addEventListener("fullscreenchange", fsChange); document.addEventListener("webkitfullscreenchange", fsChange);
  addEventListener("resize", () => {
    if(document.fullscreenElement || document.webkitFullscreenElement || performance.now() < fsQuiet) return;
    closePeek(true);
  });




  // ---------- work page: Video / Film / Overig ----------
  // One page for all work, reached from the hero words, the top bar or a link (#video, #film, #overig,
  // #werk). The hero word grows into the page title; the filters below narrow the grid. Each filter only
  // offers what still has results given the others, with the count; picking a context also sets its field.
  const VELD = {video:1, film:1, overig:1};
  const veldOf = p => VIDCAT[p.cat] ? "video" : RITCS[p.cat] ? "film" : "overig";
  const CTX = {video:["event", "trouw", "promo"], film:["fictie", "docu", "ritcs", "iao"], overig:[]};
  const CTXC = {event:"event", trouw:"trouw", promo:"promo", ritcs:"ritcs", iao:"iao", fictie:"fictie", docu:"docu"};
  const yearsOf = p => { const a = +p.t0.slice(0, 4), b = +(p.t1 || p.t0).slice(0, 4), r = []; for(let y = b; y >= a; y--) r.push(String(y)); return r; };
  const LAYER = {alle:"home", video:"videografie", film:"ritcs", overig:"overig"};
  const TITLE = {alle:["wk.all.a", ""], video:["wk.video.a", "wk.video.b"], film:["wk.film.a", ""], overig:["wk.other.a", ""]};
  const SUB = {alle:"wk.all.s", video:"wk.video.s", film:"wk.film.s", overig:"wk.other.s"};
  const ALL = P.slice().sort((a, b) => D(b.t1 || b.t0) - D(a.t1 || a.t0));
  const st = {veld:"alle", ctx:"alle", jaar:"alle", rol:"alle"};
  // (a context belongs to one field, so the field list ignores the context: switching field resets it)
  const hit = (p, skip) =>
    (skip === "veld" || st.veld === "alle" || veldOf(p) === st.veld) &&
    (skip === "ctx" || skip === "veld" || st.ctx === "alle" || tagsOf(p).includes(st.ctx)) &&
    (skip === "jaar" || st.jaar === "alle" || yearsOf(p).includes(st.jaar)) &&
    (skip === "rol" || st.rol === "alle" || (p.roles || []).includes(st.rol));
  // the choices of one filter, with how many projects each would show
  function options(key){
    const pool = ALL.filter(p => hit(p, key)), n = f => pool.filter(f).length;
    let o;
    if(key === "veld") o = ["video", "film", "overig"].map(v => [v, n(p => veldOf(p) === v)]);
    else if(key === "ctx") o = (st.veld === "alle" ? [...CTX.video, ...CTX.film] : CTX[st.veld]).map(c => [c, n(p => tagsOf(p).includes(c))]);
    else if(key === "jaar") o = [...new Set(ALL.flatMap(yearsOf))].sort((a, b) => b - a).map(y => [y, n(p => yearsOf(p).includes(y))]);
    else { const r = [...new Set(pool.flatMap(p => p.roles || []))]; const ord = ["Camera", "Montage", "Regie", "Script", "Concept", "Acteur"]; r.sort((a, b) => (ord.indexOf(a) + 99) % 99 - (ord.indexOf(b) + 99) % 99); o = r.map(x => [x, n(p => (p.roles || []).includes(x))]); }
    return [["alle", pool.length], ...o.filter(([v, c]) => c || v === st[key])];
  }
  const label = (key, v) => v === "alle" ? t("f.all") : key === "veld" ? t({video:"nav.video", film:"nav.ritcs", overig:"nav.other"}[v]) : key === "ctx" ? t("f." + v) : key === "rol" ? L.role(v) : v;
  const sq = (key, v) => key === "ctx" && CTXC[v] ? `<i class="sq" style="background:var(--c-${CTXC[v]})"></i>` : "";
  const filtersEl = $("#filters"), grid = $("#wkGrid");
  // the contexts under each hero word (shown on hover)
  function drawDoorMenus(){
    document.querySelectorAll(".door-wrap").forEach(w => {
      const v = w.dataset.for;
      w.querySelector(".door-menu").innerHTML = CTX[v].map(c => `<li><a href="#${v}?context=${c}" data-view="${v}">${sq("ctx", c)}${esc(label("ctx", c))}</a></li>`).join("");
    });
  }
  drawDoorMenus();
  L.onChange(drawDoorMenus);
  function drawFilters(){
    filtersEl.innerHTML = ["veld", "ctx", "jaar", "rol"].map(key => {
      const opts = options(key);
      return `<div class="flt" data-key="${key}"><span class="flt-l">${esc(t("f." + key))}</span>
        <button type="button" class="flt-v" aria-haspopup="listbox" aria-expanded="false">${sq(key, st[key])}<span>${esc(label(key, st[key]))}</span><svg viewBox="0 0 16 10" aria-hidden="true"><path d="M1 1.5l7 7 7-7" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button>
        <ul class="flt-o" role="listbox" hidden>${opts.map(([v, c]) => `<li role="option" data-v="${esc(v)}"${v === st[key] ? ' aria-selected="true"' : ""}>${sq(key, v)}${esc(label(key, v))}<sup>[${c}]</sup></li>`).join("")}</ul></div>`;
    }).join("");
  }
  filtersEl.addEventListener("click", e => {
    const f = e.target.closest(".flt"); if(!f) return;
    const li = e.target.closest("li[data-v]");
    if(li){ choose(f.dataset.key, li.dataset.v); return; }
    if(e.target.closest(".flt-v")){
      const open = f.querySelector(".flt-o").hidden;
      closeFilters(); if(open){ f.querySelector(".flt-o").hidden = false; f.classList.add("open"); f.querySelector(".flt-v").setAttribute("aria-expanded", "true"); }
    }
  });
  const closeFilters = () => filtersEl.querySelectorAll(".flt").forEach(f => { f.classList.remove("open"); f.querySelector(".flt-o").hidden = true; f.querySelector(".flt-v").setAttribute("aria-expanded", "false"); });
  document.addEventListener("click", e => { if(!e.target.closest("#filters")) closeFilters(); });
  addEventListener("keydown", e => { if(e.key === "Escape") closeFilters(); });
  function choose(key, v){
    st[key] = v;
    if(key === "ctx" && v !== "alle") st.veld = CTX.video.includes(v) ? "video" : "film";     // a tag belongs to one field
    if(key === "veld" && st.ctx !== "alle" && v !== "alle" && !CTX[v].includes(st.ctx)) st.ctx = "alle";
    // a choice the others no longer allow falls back to "all"
    for(const k of ["ctx", "jaar", "rol"]) if(st[k] !== "alle" && !options(k).some(([x, c]) => x === st[k] && c)) st[k] = "alle";
    writeHash(); renderWork();
  }
  function writeHash(){
    const q = new URLSearchParams();
    if(st.ctx !== "alle") q.set("context", st.ctx);
    if(st.jaar !== "alle") q.set("jaar", st.jaar);
    if(st.rol !== "alle") q.set("rol", st.rol);
    const h = "#" + (st.veld === "alle" ? "werk" : st.veld) + (q.toString() ? "?" + q : "");
    if(location.hash !== h) history.replaceState(null, "", h);   // replaceState fires no hashchange
    routed = location.hash;
  }
  const cardTitle = p => p.gt || title(p);
  function drawGrid(){
    const list = ALL.filter(p => hit(p));
    grid.innerHTML = "";
    list.forEach(p => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "wk-card"; b.dataset.id = p.id; b.style.setProperty("--c", COLOR(p.cat));
      b.setAttribute("aria-label", `${cardTitle(p)}${p.gs ? ", " + p.gs : ""}, ${kind(p)} ${year(p)}`);
      const c = document.createElement("div"); c.className = "cap";
      c.innerHTML = `<b>${esc(cardTitle(p))}</b>${p.gs ? `<span>${esc(p.gs)}</span>` : ""}`;
      b.append(face(p), c);
      if(p.vids && p.vids.length > 1){ const n = document.createElement("i"); n.className = "wk-n"; n.textContent = t("f.vids", {n:p.vids.length}); b.append(n); }
      b.addEventListener("click", () => { if(!pv || pv.card !== b) openPeek(b, wkCtx); });
      grid.appendChild(b);
    });
    $("#wkNone").hidden = list.length > 0;
    requestAnimationFrame(() => grid.querySelectorAll(".wk-card").forEach(drawShadow));
  }
  function drawTitle(){
    const [a, b] = TITLE[st.veld];
    $("#wkT .a").textContent = t(a); $("#wkT .b").textContent = b ? t(b) : "";
    // the line under the title: each context is a link that applies that filter
    const ctxs = st.veld === "alle" ? null : CTX[st.veld];
    if(st.veld === "alle") $("#wkS").innerHTML = ["video", "film", "overig"].map(v => `<a href="#${v}" data-f="veld" data-v="${v}">${esc(label("veld", v))}</a>`).join(", ");
    else if(ctxs.length) $("#wkS").innerHTML = ctxs.map(c => `<a href="#${st.veld}?context=${c}" data-f="ctx" data-v="${c}"${st.ctx === c ? ' aria-current="true"' : ""}>${esc(t("f." + c + ".p"))}</a>`).join(", ");
    else $("#wkS").textContent = t(SUB[st.veld]);
    document.title = (st.veld === "alle" ? t(a) : t(a) + (b ? t(b) : "")) + " — Tristan Nijs Media";
    document.querySelectorAll("[data-view]").forEach(a => a.toggleAttribute("aria-current", a.dataset.view === (document.body.classList.contains("is-work") ? st.veld : "home")));
  }
  let lastVeld = null;
  function renderWork(){
    drawFilters(); drawGrid(); drawTitle();
    if(st.veld !== lastVeld){ showLayer(LAYER[st.veld]); lastVeld = st.veld; }
  }
  // a preview from the grid grows more than one from the carousel
  const wkCtx = {
    grow: 1.6, cls: "pv-wk",
    home: c => c.getBoundingClientRect(),
    shift: () => 0, begin(){}, open(){}, close(){}, wheel(){}
  };
  addEventListener("resize", () => { if(document.body.classList.contains("is-work")) grid.querySelectorAll(".wk-card").forEach(drawShadow); });

  // ---- going between the start page and the work page ----
  const hero = $("#hero"), heroWork = $("#heroWork"), werk = $("#werk");
  const homeParts = [$("#uitgelicht"), $("#over")];
  function readHash(){
    const h = decodeURIComponent(location.hash.slice(1)), [path, qs] = h.split("?");
    const v = {video:"video", videografie:"video", film:"film", ritcs:"film", overig:"overig", werk:"alle"}[path.toLowerCase()];
    if(!v) return null;
    const q = new URLSearchParams(qs || "");
    return {veld:v, ctx:q.get("context") || "alle", jaar:q.get("jaar") || "alle", rol:q.get("rol") || "alle"};
  }
  function toWork(next, door){
    closePeek(true); closeFilters();
    const wasWork = document.body.classList.contains("is-work");
    Object.assign(st, next);
    for(const k of ["ctx", "jaar", "rol"]) if(st[k] !== "alle" && !options(k).some(([x, c]) => x === st[k] && c)) st[k] = "alle";
    // the hero word the visitor clicked, if it is in view: the title grows out of it
    const word = !wasWork && door && door.querySelector("span"), r0 = word && word.getBoundingClientRect();
    const fly = r0 && r0.bottom > 0 && r0.top < innerHeight;
    if(fly){   // keep the words where they are while they fade
      doors.style.cssText = `position:absolute;left:0;right:0;top:${doors.offsetTop}px;margin:0`;
      word.style.visibility = "hidden";
    }
    document.body.classList.add("is-work");
    heroWork.hidden = false; werk.hidden = false; homeParts.forEach(x => x.hidden = true);
    renderWork(); writeHash(); onScroll();
    if(!wasWork && !fly) scrollTo({top:0, behavior:"instant"});
    if(fly){
      const h1 = $("#wkT"), a = h1.querySelector(".a"), r1 = a.getBoundingClientRect(), rh = h1.getBoundingClientRect(), s = r0.height / r1.height;
      h1.style.transformOrigin = `${r1.left - rh.left}px ${r1.top - rh.top}px`;
      h1.style.transition = "none";
      h1.style.transform = `translate(${r0.left - r1.left}px,${r0.top - r1.top}px) scale(${s})`;
      heroWork.classList.add("flying");
      h1.getBoundingClientRect();
      requestAnimationFrame(() => {
        h1.style.transition = ""; h1.style.transform = "";
        heroWork.classList.remove("flying");
        setTimeout(() => { doors.style.cssText = ""; word.style.visibility = ""; }, 700);
      });
    }
    werk.classList.remove("in"); werk.getBoundingClientRect(); werk.classList.add("in");
    if(!wasWork && scrollY < 40){          // a little hop of the arrow: there is more below
      const dn = $(".hero-down"); dn.classList.remove("nudge");
      setTimeout(() => { dn.getBoundingClientRect(); dn.classList.add("nudge"); }, 750);
      dn.addEventListener("animationend", () => dn.classList.remove("nudge"), {once:true});
    }
    routed = location.hash;
  }
  function toHome(){
    if(!document.body.classList.contains("is-work")) return;
    closePeek(true); closeFilters();
    document.body.classList.remove("is-work");
    heroWork.hidden = true; werk.hidden = true; homeParts.forEach(x => x.hidden = false);
    doors.classList.remove("back"); doors.getBoundingClientRect(); doors.classList.add("back");
    showLayer("home"); lastVeld = null; document.title = "Tristan Nijs Media";
    document.querySelectorAll("[data-view]").forEach(a => a.toggleAttribute("aria-current", a.dataset.view === "home"));
    scrollTo({top:0, behavior:"instant"});
    readSx(); render(); shadows(); onScroll();
    routed = location.hash;
  }
  let pendingDoor = null;
  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-view]"); if(!a) return;
    const wrap = a.closest(".door-wrap");
    pendingDoor = wrap ? wrap.querySelector(".door") : null;
    if(a.dataset.view === "home"){ e.preventDefault(); if(location.hash) history.pushState(null, "", location.pathname + location.search); toHome(); }
  });
  let routed = null;      // hashchange and popstate both fire for one click: handle it once
  function route(){
    if(location.hash === routed) return;
    routed = location.hash;
    const next = readHash();
    if(next){ toWork(next, pendingDoor); pendingDoor = null; return; }
    pendingDoor = null;
    if(!document.body.classList.contains("is-work")) return;      // plain anchors on the start page scroll as usual
    const anchor = /^#(uitgelicht|over)$/.test(location.hash) && $(location.hash);
    toHome();
    if(anchor) anchor.scrollIntoView();
  }
  addEventListener("hashchange", route);
  addEventListener("popstate", route);
  $("#wkS").addEventListener("click", e => {
    const a = e.target.closest("a[data-f]"); if(!a) return;
    e.preventDefault(); e.stopPropagation();
    choose(a.dataset.f, a.dataset.f === "ctx" && st.ctx === a.dataset.v ? "alle" : a.dataset.v);   // clicking the active one again clears it
  }, true);
  $("#wkBack").addEventListener("click", e => { e.preventDefault(); if(location.hash) history.pushState(null, "", location.pathname + location.search); toHome(); });
  // the arrow under the title: down to the grid
  $(".hero-down").addEventListener("click", e => { if(document.body.classList.contains("is-work")){ e.preventDefault(); werk.scrollIntoView({behavior:"smooth"}); } });
  L.onChange(() => { if(document.body.classList.contains("is-work")) renderWork(); });
  { const start = readHash(); if(start) toWork(start, null); }

  // ---------- player ----------
  const dlg = $("#player");
  const ytFrame = (id,title) => `<iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  function show(p,k){
    const scr = $("#plScreen"), link = $("#plLink");
    if(p.vids){ const v = p.vids[k]; scr.innerHTML = `<video src="${v.src}" poster="${v.poster}" controls autoplay playsinline></video>`; link.hidden = true; }
    else { scr.innerHTML = ytFrame(p.yt, flat(lab(p))); link.hidden = false; link.href = "https://www.youtube.com/watch?v=" + p.yt; }
    $("#plParts").querySelectorAll("button").forEach((b,i) => b.setAttribute("aria-pressed", i === k));
  }
  function openPlayer(p){
    $("#plTitle").textContent = flat(lab(p));
    $("#plMeta").textContent = sub(p) + " · " + when(p);
    const parts = $("#plParts"); parts.innerHTML = "";
    if(p.vids && p.vids.length > 1) p.vids.forEach((v,k) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "pthumb";
      b.setAttribute("aria-label", t("videoOf", {k:k+1, n:p.vids.length})); b.innerHTML = `<img src="${v.poster}" alt="">`;
      b.onclick = () => show(p,k); parts.appendChild(b);
    });
    show(p,0); dlg.showModal();
  }
  $("#plClose").onclick = () => dlg.close();
  dlg.addEventListener("click", e => { if(e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => { $("#plScreen").innerHTML = ""; });
})();
