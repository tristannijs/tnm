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
  const capHTML = p => `<b>${lab(p).split("\n").map(esc).join("<br>")}</b><span>${esc(sub(p))}</span>`;
  function cap(p){
    const c = document.createElement("div"); c.className = "cap"; c.dataset.pid = p.id;
    c.innerHTML = capHTML(p);
    return c;
  }

  // ---------- top bar ----------
  const bar = $("#bar");
  const onScroll = () => bar.classList.toggle("solid", scrollY > 8);
  addEventListener("scroll", onScroll, {passive:true}); onScroll();

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
    buildTimeline();
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
    // where the point of interest is at time t: straight lines between key points; a cut is two key points
    // 0.04 s apart, so it jumps
    function at(c, t){
      const f = c.focus;
      if(!f) return [c.x, c.y];
      let i = 0; while(i < f.length - 1 && f[i + 1][0] <= t) i++;
      if(i === f.length - 1) return [f[i][1], f[i][2]];
      const [t0, x0, y0] = f[i], [t1, x1, y1] = f[i + 1], k = (t - t0) / (t1 - t0);
      return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
    }
    // object-position for a point: the crop window centred on it as far as the frame allows
    function place(v){
      const c = v.clip; if(!c) return;
      const W = l.clientWidth, H = l.clientHeight, va = (v.videoWidth / v.videoHeight) || 16 / 9, ca = W / H;
      const [x, y] = at(c, v.currentTime || 0);
      const pos = (p, vis) => vis >= 1 ? 50 : Math.min(100, Math.max(0, (p - vis / 2) / (1 - vis) * 100));
      v.style.objectPosition = `${pos(x, ca / va).toFixed(2)}% ${pos(y, va / ca).toFixed(2)}%`;
    }
    function tick(){ place(vids[cur]); raf = playing && vids[cur].clip && vids[cur].clip.focus ? requestAnimationFrame(tick) : 0; }
    function track(){ cancelAnimationFrame(raf); tick(); }
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
    addEventListener("resize", () => vids.forEach(place));
    let started = false;
    async function start(){
      if(started) return; started = true;
      useAv1 = await av1ok;
      load(vids[0], next()); load(vids[1], next());
      show(0);
    }
    const p = {
      play(){ start().then(() => { playing = true; vids[cur].play().catch(() => {}); track(); }); },
      pause(){ playing = false; vids[cur].pause(); cancelAnimationFrame(raf); }
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
  function showLayer(key){
    layers.forEach(l => {
      const on = l.dataset.key === key;
      l.classList.toggle("on", on);
      if(l.player){ if(on) l.player.play(); else l.player.pause(); }
    });
  }
  const doors = $("#doors");
  doors.querySelectorAll(".door").forEach(d => {
    d.addEventListener("mouseenter", () => showLayer(d.dataset.bg));
    d.addEventListener("focus", () => showLayer(d.dataset.bg));
    d.addEventListener("blur", () => showLayer("home"));
  });
  doors.addEventListener("mouseleave", () => showLayer("home"));

  // ---------- Tijdlijn ----------
  const iso = t => new Date(t).toISOString().slice(0,10);
  const TODAY = Date.now();
  const tlName = p => p.name ? L.label(p.name) : flat(lab(p));

  const hoverThumb = (() => {
    const el = document.createElement("div"); el.className = "hthumb"; el.setAttribute("aria-hidden","true");
    el.innerHTML = `<div class="im"></div><div class="tx"><b></b><span></span></div>`;
    document.body.appendChild(el);
    const im = el.querySelector(".im"), b = el.querySelector("b"), s = el.querySelector("span");
    let cur = null;
    return {
      show(p, cx, cy){
        if(cur !== p.id + L.lang){
          cur = p.id + L.lang; el.style.setProperty("--c", COLOR(p.cat));
          b.textContent = flat(lab(p)); s.textContent = sub(p) + " · " + when(p);
          im.innerHTML = ""; if(p.cover || p.yt) im.appendChild(coverImg(p));
        }
        el.classList.add("on");
        const W = el.offsetWidth, H = el.offsetHeight, pad = 18;
        let left = cx + pad, top = cy + pad;
        if(left + W > innerWidth - 8) left = cx - W - pad;
        if(top + H > innerHeight - 8) top = cy - H - pad;
        el.style.transform = `translate(${Math.max(8,left)}px,${Math.max(8,top)}px)`;
      },
      hide(){ el.classList.remove("on"); }
    };
  })();

  function timeline(sec, host, o){
    const start = D(o.start), stop = D(o.end), span = stop - start;
    const x = t => ((t - start) / span * 100) + "%", w = d => (d / span * 100) + "%";
    host.innerHTML = `<div class="tl"><div class="heads"><div class="sp"><span class="tc"></span></div></div>
      <div class="tl-scroll"><div class="tl-in"><div class="ruler"></div><div class="trks"></div><div class="now"></div><div class="playhead"></div></div></div>
      <div class="fade l"></div><div class="fade r"></div></div>`;
    const tl = host.querySelector(".tl"), heads = host.querySelector(".heads"), trks = host.querySelector(".trks"), ruler = host.querySelector(".ruler"), inner = host.querySelector(".tl-in");
    const ph = host.querySelector(".playhead"), tcEl = host.querySelector(".tc");
    const p2 = v => String(v).padStart(2,"0");
    const tcOf = t => { const d = new Date(t); return p2(d.getUTCDate())+":"+p2(d.getUTCMonth()+1)+":"+d.getUTCFullYear(); };
    let phT = D(o.now);
    const placePH = t => { ph.style.left = x(t); tcEl.textContent = tcOf(t); };
    const park = () => placePH(phT);

    // ----- build: group headers, tracks, clips -----
    const items = [], rows = [], seps = [];
    o.groups.forEach(g => {
      const gh = document.createElement("div"); gh.className = "grp"; gh.textContent = t(g.label); heads.appendChild(gh);
      const gr = document.createElement("div"); gr.className = "grp-row"; trks.appendChild(gr);
      const line = document.createElement("div"); line.className = "sep"; tl.appendChild(line);
      seps.push({row:gr, el:line});
      g.tracks.forEach(tr => {
        const h = document.createElement("div"); h.className = "head"; h.style.setProperty("--c", COLOR(tr.cat));
        h.innerHTML = `<span class="sw"></span><span class="nm-l">${esc(t(tr.name))}</span><span class="nm-s">${esc(t(tr.short || tr.name))}</span>`; heads.appendChild(h);
        const row = document.createElement("div"); row.className = "trk"; row.dataset.cat = tr.cat;
        // projects that overlap in time get their own lane inside the track
        const its = P.filter(p => p.cat === tr.cat).map(p => { const a = D(p.t0); return {p, a, b:Math.max(p.t1 ? D(p.t1) : a, a + o.minDays*DAY)}; }).sort((m,k) => m.a - k.a);
        const laneEnd = [];
        its.forEach(it => { let l = laneEnd.findIndex(e => e <= it.a); if(l < 0){ l = laneEnd.length; laneEnd.push(0); } laneEnd[l] = it.b; it.lane = l; });
        its.forEach(it => {
          items.push(it); const p = it.p;
          const c = document.createElement("button"); c.type = "button"; c.className = "clip"; c.dataset.id = p.id; c.style.setProperty("--c", COLOR(p.cat));
          c.style.left = x(it.a); c.style.width = w(it.b - it.a); c.setAttribute("aria-label", `${flat(lab(p))}, ${when(p)}`);
          c.innerHTML = `<span class="film"></span><span class="nm"><span>${esc(tlName(p))}</span></span>`;
          it.el = c; row.appendChild(c);
        });
        rows.push({head:h, row, its, lanes:Math.max(1, laneEnd.length)});
        trks.appendChild(row);
      });
    });
    const clips = items.map(it => it.el);
    const d0 = new Date(start); let yy = d0.getUTCFullYear(), mm = d0.getUTCMonth();
    for(;;){ const t = Date.UTC(yy,mm,1,12); if(t > stop) break;
      if(t >= start - DAY){ const el = document.createElement("div"); el.className = "tick"+(mm===0?" y":""); el.dataset.m = mm; el.style.left = x(Math.max(t,start)); el.textContent = mm===0 ? yy : L.monthShort(mm); ruler.appendChild(el); }
      mm++; if(mm > 11){ mm = 0; yy++; } }
    const ticks = [...ruler.querySelectorAll(".tick")];
    const months = span / (30.44*DAY);
    host.querySelector(".now").style.left = x(D(o.now));

    // ----- track height: shift + scroll makes the tracks taller, like in Resolve -----
    const HMIN = 30, HMAX = 132, EXPAND = 46, BAR = 18;
    let clipH = HMIN;
    function films(){
      items.forEach(it => {
        const c = it.el, film = c.querySelector(".film");
        const fh = Math.max(1, it.h - BAR - 3), tw = fh * 16/9;
        const n = Math.max(1, Math.ceil(c.offsetWidth / tw));
        film.style.height = fh + "px";
        if(+film.dataset.n !== n){
          const src = it.p.frames && it.p.frames.length ? it.p.frames : [it.p.cover].filter(Boolean);
          film.dataset.n = n; film.innerHTML = "";
          for(let i = 0; i < n && src.length; i++){
            const im = new Image(); im.alt = ""; im.decoding = "async"; im.draggable = false;
            im.src = src[Math.floor(i * src.length / n)];
            film.appendChild(im);
          }
        }
        film.querySelectorAll("img").forEach(im => im.style.width = tw + "px");
      });
    }
    function layoutV(){
      rows.forEach(r => {
        const multi = r.lanes > 1, rowH = multi ? 10 + r.lanes*clipH : clipH + 8;
        r.row.style.height = r.head.style.height = rowH + "px";
        r.its.forEach(it => {
          it.h = multi ? clipH - 4 : clipH;
          it.el.style.top = (multi ? 7 + it.lane*clipH : 4) + "px";
          it.el.style.height = it.h + "px";
        });
      });
      const ex = clipH >= EXPAND;
      clips.forEach(c => c.classList.toggle("x", ex));
      if(ex) films();
      seps.forEach(sp => sp.el.style.top = (inner.offsetTop + sp.row.offsetTop + 10) + "px");
    }
    function setH(h){
      h = Math.round(Math.max(HMIN, Math.min(HMAX, h)));
      if(h === clipH) return;
      clipH = h; layoutV();
    }
    tl.addEventListener("wheel", e => {
      if(!e.shiftKey || e.altKey || e.ctrlKey) return;
      e.preventDefault();
      // with shift held, browsers often report the wheel as sideways; either way, up = taller
      const d = e.deltaY || e.deltaX;
      setH(clipH - d * .25);
    }, {passive:false});

    // ----- hover, click -----
    function hl(id){ clips.forEach(c => c.classList.toggle("hl", c.dataset.id === id)); }
    inner.addEventListener("mousemove", e => {
      const r = inner.getBoundingClientRect(), f = Math.max(0, Math.min(1, (e.clientX - r.left)/r.width)), t = start + f*span;
      ph.style.left = (f*100) + "%"; tcEl.textContent = tcOf(t);
      const row = e.target.closest(".trk"), rr = row && rows.find(q => q.row === row);
      let lane = null;
      if(rr && rr.lanes > 1) lane = Math.max(0, Math.floor((e.clientY - row.getBoundingClientRect().top - 7)/clipH));
      const vis = items.filter(it => (!row || row.dataset.cat === it.p.cat) && (lane == null || it.lane === lane));
      let hit = vis.filter(it => t >= it.a && t <= it.b).sort((a,b) => (a.b-a.a) - (b.b-b.a))[0];
      if(!hit && row){ let best = null, bd = 25*DAY; vis.forEach(it => { const dd = Math.abs((it.a+it.b)/2 - t); if(dd < bd){ bd = dd; best = it; } }); hit = best; }
      hl(hit ? hit.p.id : null);
      const over = e.target.closest(".clip");
      if(over && !drag.moved) hoverThumb.show(BY[over.dataset.id], e.clientX, e.clientY); else hoverThumb.hide();
    });
    inner.addEventListener("mouseleave", () => { hl(null); hoverThumb.hide(); park(); });
    inner.addEventListener("click", e => {
      if(drag.suppress){ drag.suppress = false; return; }
      const c = e.target.closest(".clip");
      if(c){ hoverThumb.hide(); phT = items.find(i => i.p.id === c.dataset.id).a; openPlayer(BY[c.dataset.id]); return; }
      // clicking empty space parks the playhead there, like in an editor
      const r = inner.getBoundingClientRect(); phT = start + Math.max(0, Math.min(1, (e.clientX - r.left)/r.width))*span;
    });
    inner.addEventListener("focusin", e => { const c = e.target.closest(".clip"); if(c) hl(c.dataset.id); });

    // ----- zoom + pan -----
    const sc = host.querySelector(".tl-scroll"), zoomEl = sec.querySelector(".zoom"), zl = zoomEl.querySelector(".zl");
    const ZMIN = 1, ZMAX = 8; let zoom = 1;
    const baseW = () => Math.max(760, sc.clientWidth);
    function labelTicks(){
      const pxm = inner.offsetWidth / months;
      const stp = [1,2,3,6].find(s => pxm*s >= 46) || 12;
      ticks.forEach(t => { const m = +t.dataset.m; t.style.visibility = (m === 0 || m % stp === 0) ? "visible" : "hidden"; });
      const minor = pxm/4.35 >= 9 ? pxm/4.35 : pxm/2;
      ruler.style.backgroundSize = Math.max(4, minor) + "px 5px";
      clips.forEach(c => c.classList.toggle("narrow", c.offsetWidth < 56));
      if(clipH >= EXPAND) films();
    }
    function setZoom(z, ax){
      z = Math.max(ZMIN, Math.min(ZMAX, z));
      if(ax == null) ax = sc.clientWidth/2;
      const f = (sc.scrollLeft + ax) / inner.offsetWidth;
      zoom = z; inner.style.width = (baseW()*z) + "px";
      sc.scrollLeft = f*inner.offsetWidth - ax;
      zl.textContent = Math.round(z*100) + "%";
      zoomEl.querySelector('[data-z="out"]').disabled = z <= ZMIN;
      zoomEl.querySelector('[data-z="in"]').disabled = z >= ZMAX;
      labelTicks();
    }
    zoomEl.addEventListener("click", e => {
      const b = e.target.closest(".zb"); if(!b) return; userMoved = true;
      if(b.dataset.z === "in") setZoom(zoom*1.5); else if(b.dataset.z === "out") setZoom(zoom/1.5); else { setZoom(1); setH(HMIN); }
    });
    sc.addEventListener("wheel", e => {
      if(!(e.altKey || e.ctrlKey)) return;
      e.preventDefault(); userMoved = true;
      const r = sc.getBoundingClientRect(), d = e.deltaY || e.deltaX;
      setZoom(zoom*Math.exp(-d*(e.ctrlKey ? .01 : .004)), e.clientX - r.left);
    }, {passive:false});
    // touch: slide along the ruler to scrub
    let scrubbing = false;
    const scrubTo = cx => {
      const r = inner.getBoundingClientRect(), t = start + Math.max(0, Math.min(1, (cx - r.left)/r.width))*span;
      phT = t; placePH(t);
      const hit = items.filter(it => t >= it.a && t <= it.b).sort((a,b) => (a.b-a.a) - (b.b-b.a))[0];
      hl(hit ? hit.p.id : null);
    };
    ruler.addEventListener("touchstart", e => { if(e.touches.length !== 1) return; scrubbing = true; scrubTo(e.touches[0].clientX); }, {passive:true});
    ruler.addEventListener("touchmove", e => { if(!scrubbing || e.touches.length !== 1) return; e.preventDefault(); scrubTo(e.touches[0].clientX); }, {passive:false});
    ruler.addEventListener("touchend", () => { scrubbing = false; });
    // pinch: sideways zooms time, upright spreads the tracks
    let pinch = null;
    const spread = t => ({x:Math.abs(t[0].clientX - t[1].clientX), y:Math.abs(t[0].clientY - t[1].clientY)});
    sc.addEventListener("touchstart", e => { if(e.touches.length === 2) pinch = {s:spread(e.touches), z:zoom, h:clipH}; }, {passive:true});
    sc.addEventListener("touchmove", e => {
      if(!pinch || e.touches.length !== 2) return; e.preventDefault(); userMoved = true;
      const s = spread(e.touches), r = sc.getBoundingClientRect(), mid = (e.touches[0].clientX + e.touches[1].clientX)/2 - r.left;
      if(pinch.s.x >= pinch.s.y) setZoom(pinch.z * Math.max(1,s.x)/Math.max(1,pinch.s.x), mid);
      else setH(pinch.h + (s.y - pinch.s.y) * .6);
    }, {passive:false});
    sc.addEventListener("touchend", e => { if(e.touches.length < 2) pinch = null; });
    // drag to pan
    const drag = {on:false, moved:false, suppress:false, x:0, s:0};
    inner.addEventListener("mousedown", e => { if(e.button !== 0) return; drag.on = true; drag.moved = false; drag.x = e.clientX; drag.s = sc.scrollLeft; });
    addEventListener("mousemove", e => {
      if(!drag.on) return;
      const dx = e.clientX - drag.x;
      if(!drag.moved && Math.abs(dx) > 4){ drag.moved = true; userMoved = true; inner.classList.add("dragging"); hoverThumb.hide(); }
      if(drag.moved) sc.scrollLeft = drag.s - dx;
    });
    addEventListener("mouseup", () => { if(!drag.on) return; drag.on = false; if(drag.moved){ drag.suppress = true; setTimeout(() => drag.suppress = false, 0); } drag.moved = false; inner.classList.remove("dragging"); });
    // open on the most recent part when the timeline is wider than its box
    let userMoved = false;
    const showRecent = () => { sc.scrollLeft = Math.max(0, (phT - start)/span*inner.offsetWidth - sc.clientWidth*.85); };
    new ResizeObserver(() => { setZoom(zoom); layoutV(); if(!userMoved && sc.clientWidth > 0) showRecent(); }).observe(sc);
    setZoom(1); layoutV(); park(); showRecent();
  }

  // built again when the language changes; the zoom buttons are swapped for fresh copies
  // so the old timeline's click handlers go with it
  function buildTimeline(){
    const z = $("#tijdlijn .zoom"); z.replaceWith(z.cloneNode(true));
    timeline($("#tijdlijn"), $("#tl"), {
      start:"2024-09-01", end:iso(TODAY + 40*DAY), now:iso(TODAY), minDays:18,
      groups:[
        {label:"tl.video", tracks:[{cat:"event",name:"tl.event"},{cat:"trouw",name:"tl.trouw",short:"tl.trouw.s"},{cat:"promo",name:"tl.promo",short:"tl.promo.s"}]},
        {label:"tl.ritcs", tracks:[{cat:"fictie",name:"tl.fictie"},{cat:"docu",name:"tl.docu",short:"tl.docu.s"},{cat:"iao",name:"tl.iao"}]}
      ]
    });
  }
  buildTimeline();

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
