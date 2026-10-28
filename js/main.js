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
  function cap(p){
    const c = document.createElement("div"); c.className = "cap";
    c.innerHTML = `<b>${p.label.split("\n").map(esc).join("<br>")}</b><span>${esc(p.sub)}</span>`;
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
    menuBtn.setAttribute("aria-label", open ? "Menu sluiten" : "Menu openen");
  }
  menuBtn.addEventListener("click", e => { e.stopPropagation(); setMenu(drawer.hidden); });
  drawer.addEventListener("click", e => { if(e.target.closest("a")) setMenu(false); });
  document.addEventListener("click", e => { if(!drawer.hidden && !e.target.closest("#drawer")) setMenu(false); });
  document.addEventListener("keydown", e => { if(e.key === "Escape") setMenu(false); });
  $(".lang").addEventListener("click", e => e.preventDefault());

  // ---------- hero: a layer per background; hovering a door swaps to its layer ----------
  const layers = [...document.querySelectorAll(".hero-bg .layer")];
  layers.forEach(l => {
    if(l.dataset.video){
      const v = document.createElement("video");
      Object.assign(v, {src:l.dataset.video, muted:true, loop:true, playsInline:true, autoplay:l.classList.contains("on"), preload:"auto"});
      if(l.dataset.img) v.poster = l.dataset.img;
      l.appendChild(v);
    } else if(l.dataset.img){
      const i = new Image(); i.src = l.dataset.img; i.alt = ""; l.appendChild(i);
    }
  });
  function showLayer(key){
    layers.forEach(l => {
      const on = l.dataset.key === key;
      l.classList.toggle("on", on);
      const v = l.querySelector("video");
      if(v){ if(on){ v.play().catch(()=>{}); } else v.pause(); }
    });
  }
  const doors = $("#doors");
  doors.querySelectorAll(".door").forEach(d => {
    d.addEventListener("mouseenter", () => showLayer(d.dataset.bg));
    d.addEventListener("focus", () => showLayer(d.dataset.bg));
    d.addEventListener("blur", () => showLayer("home"));
  });
  doors.addEventListener("mouseleave", () => showLayer("home"));

  // ---------- Uitgelicht: cards on a turntable that follows your fingers ----------
  const cf = $("#cf"), track = $("#cfTrack");
  const feat = window.FEATURED.map(id => BY[id]).filter(Boolean);
  const n = feat.length;
  // `offset` is which card is in the middle, as a continuous number (1.4 = 40% of the way
  // from card 1 to card 2). Input moves `goal`; every frame `offset` glides toward it.
  let offset = 0, goal = 0;
  const wrap = d => { d = ((d % n) + n) % n; return d >= n/2 ? d - n : d; };
  const centerIdx = () => ((Math.round(offset) % n) + n) % n;
  const cfItems = feat.map((p,i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "cf-item"; b.style.setProperty("--c", COLOR(p.cat));
    b.setAttribute("aria-label", `${flat(p.label)}, ${p.sub}`);
    const shade = document.createElement("span"); shade.className = "shade";
    b.append(face(p), cap(p), shade);
    b.addEventListener("click", () => {
      if(moved) return;
      const d = wrap(i - offset);
      if(Math.abs(d) < .5) openPlayer(p); else { goal = Math.round(goal) + Math.sign(d); run(); }
    });
    track.appendChild(b);
    return {el:b, shade};
  });
  let sx = 118;
  const readSx = () => { sx = parseFloat(getComputedStyle(cf).getPropertyValue("--sx")) || 118; };
  function render(){
    const front = centerIdx();
    cfItems.forEach(({el, shade}, i) => {
      const p = n > 1 ? wrap(i - offset) : 0, a = Math.abs(p), sg = Math.sign(p);
      let X, Z, R, B, O;
      if(a <= 1){ X = sx*p; Z = -600*a; R = -22*p; B = .4*a; O = 1; }
      else { X = sg*(sx + (a-1)*sx*.6); Z = -600 - (a-1)*400; R = -22*sg; B = .4; O = Math.max(0, Math.min(1, (1.5 - a)/.45)); }
      el.style.transform = `translate(-50%,-50%) translate3d(${X.toFixed(3)}%,0,${Z.toFixed(2)}px) rotateY(${R.toFixed(3)}deg)`;
      el.style.opacity = O.toFixed(3);
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

  // ---------- Recent: newest left ----------
  const rc = $("#rc"), list = $("#rcList");
  const end = p => D(p.t1 || p.t0);
  [...P].sort((a,b) => end(b) - end(a) || D(b.t0) - D(a.t0)).forEach(p => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "rc-card"; b.dataset.id = p.id; b.style.setProperty("--c", COLOR(p.cat));
    b.setAttribute("aria-label", `${flat(p.label)}, ${p.sub}, ${p.date}`);
    b.append(face(p), cap(p));
    b.addEventListener("click", () => { if(!rcDrag.moved) openPlayer(p); });
    list.appendChild(b);
  });
  const rPrev = rc.querySelector(".prev"), rNext = rc.querySelector(".next");
  function rcState(){
    const atStart = list.scrollLeft <= 2;
    const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
    rc.classList.toggle("scrolled", !atStart);
    rPrev.hidden = atStart;
    rNext.hidden = atEnd;
  }
  list.addEventListener("scroll", rcState, {passive:true});
  new ResizeObserver(rcState).observe(list);
  const step = () => { const c = list.querySelector(".rc-card"); const w = c ? c.offsetWidth + 12 : 300; return Math.max(w, Math.floor(list.clientWidth / w) * w - w); };
  rPrev.addEventListener("click", () => list.scrollBy({left:-step(), behavior:"smooth"}));
  rNext.addEventListener("click", () => list.scrollBy({left: step(), behavior:"smooth"}));
  // drag with the mouse (touch and trackpads scroll natively)
  const rcDrag = {on:false, x:0, s:0, moved:false};
  list.addEventListener("pointerdown", e => { if(e.pointerType !== "mouse" || e.button !== 0) return; rcDrag.on = true; rcDrag.x = e.clientX; rcDrag.s = list.scrollLeft; rcDrag.moved = false; });
  addEventListener("pointermove", e => {
    if(!rcDrag.on) return;
    const dx = e.clientX - rcDrag.x;
    if(!rcDrag.moved && Math.abs(dx) > 5){ rcDrag.moved = true; }
    if(rcDrag.moved) list.scrollLeft = rcDrag.s - dx;
  });
  addEventListener("pointerup", () => {
    if(!rcDrag.on) return; rcDrag.on = false;
    setTimeout(() => rcDrag.moved = false, 0);
  });
  list.addEventListener("dragstart", e => e.preventDefault());
  rcState();

  // ---------- Recent: rest on a card for 1 s and it opens up and plays ----------
  // The card grows into a playing preview with its details underneath; the page dims
  // and the other cards turn in 3D and slide in against it, like Uitgelicht.
  const VTYPE = {event:"Aftermovie", trouw:"Trouwfilm", promo:"Promotievideo"};
  const pvType = p => p.type || VTYPE[p.cat] || p.sub;
  const pvTitle = p => {
    if(p.title) return p.title;
    const t = flat(p.label);
    // videography: add the subtitle unless it only repeats the type ("Wejo × Bocco: Pop-up opening")
    return VTYPE[p.cat] && p.sub && p.sub.toLowerCase() !== pvType(p).toLowerCase() ? `${t}: ${p.sub}` : t;
  };
  const mmss = s => { s = Math.round(s); return Math.floor(s/60) + ":" + String(s%60).padStart(2,"0"); };
  const ICON = {
    clock:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M12 5.5V12l4.2 2.6" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round"/></svg>`,
    audio:`<svg viewBox="0 0 30 24" aria-hidden="true"><path d="M2 8.5h5L13 3v18l-6-5.5H2z" fill="currentColor"/><path d="M17 8.2a5.3 5.3 0 0 1 0 7.6M20.3 5a9.8 9.8 0 0 1 0 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    subs:`<svg viewBox="0 0 26 24" aria-hidden="true"><path d="M2 2h22v15H9l-5 5v-5H2z" fill="currentColor"/><path d="M6.5 7.5h13M6.5 11.5h13" stroke="#000" stroke-width="1.8"/></svg>`
  };
  // any device with a mouse or trackpad (touch-only screens tap straight to the player)
  const canPeek = matchMedia("(any-hover: hover)").matches;
  const shade = document.createElement("div"); shade.className = "pv-shade"; document.body.appendChild(shade);
  let pv = null, peekTimer = 0, fanRaf = 0, peekLeft = 0;
  const PEEK_MS = 1000, GROW = 1.55;

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

  function openPeek(card){
    if(pv) closePeek(true);
    const p = BY[card.dataset.id]; if(!p) return;
    const r = card.getBoundingClientRect();
    // where the preview ends up: grown around the card's centre, kept inside the window
    const W = Math.min(r.width * GROW, innerWidth - 32), H = W * 9/16;
    const L = Math.max(16, Math.min(innerWidth - 16 - W, r.left + r.width/2 - W/2));
    const T = r.top + r.height/2 - H/2;
    const el = document.createElement("div");
    el.className = "pv"; el.style.setProperty("--c", COLOR(p.cat));
    el.setAttribute("role", "button"); el.setAttribute("aria-label", `${pvTitle(p)} afspelen`);
    el.innerHTML = `<div class="pv-media"></div>
      <div class="pv-info"><div class="pv-t">${esc(pvTitle(p))}</div>
        <div class="pv-m">${esc(pvType(p))}<span class="dot">•</span>${esc(p.date)}</div>
        <div class="pv-r"></div></div>`;
    const media = el.querySelector(".pv-media");
    media.append(face(p), cap(p));
    // the preview is laid out once at its final size; growing is a pure scale from the card,
    // which the graphics card animates without the page having to re-lay out every frame
    el.style.left = L + "px"; el.style.top = (T + scrollY) + "px"; el.style.width = W + "px";
    el.style.fontSize = (Math.max(W, 300) / 375 * 16) + "px";
    el.style.setProperty("--k", (W / r.width).toFixed(4));
    const shrunk = () => { const q = card.getBoundingClientRect(), dx = peekLeft - list.scrollLeft; return `translate(${(q.left - L - dx).toFixed(2)}px,${(q.top - T).toFixed(2)}px) scale(${(q.width / W).toFixed(4)})`; };
    el.style.transform = shrunk();
    document.body.appendChild(el);
    pv = {el, card, p, shrunk}; peekLeft = list.scrollLeft;
    refreshRow(p);
    card.classList.add("lifted");
    void el.offsetWidth;
    el.classList.add("open"); el.style.transform = "none";
    shade.classList.add("on"); rc.classList.add("peek");
    fan(card, {left:L, right:L + W, mid:T + H/2});
    // the clip itself starts once the preview has opened, so loading it doesn't stutter the motion
    const me = pv;
    setTimeout(() => { if(pv === me) startClip(p, media); }, 600);
    el.addEventListener("mouseleave", () => closePeek());
    // sideways scrolling over the open preview scrolls the row underneath it
    el.addEventListener("wheel", e => {
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      if(Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      e.preventDefault(); list.scrollLeft += dx;
    }, {passive:false});
    el.addEventListener("click", () => { const q = pv && pv.p; closePeek(true); if(q) openPlayer(q); });
  }
  function startClip(p, media){
    // muted, because browsers only autoplay muted video
    if(p.vids){
      const v = document.createElement("video");
      Object.assign(v, {src:p.vids[0].src, muted:true, loop:true, autoplay:true, playsInline:true});
      v.addEventListener("loadedmetadata", () => { p._dur = v.duration; if(p.hd == null) p._hd = v.videoHeight >= 720; refreshRow(p); });
      v.addEventListener("playing", () => v.classList.add("on"));
      media.appendChild(v);
    } else if(p.yt){
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${p.yt}?autoplay=1&mute=1&controls=0&rel=0&playsinline=1&loop=1&playlist=${p.yt}&modestbranding=1&iv_load_policy=3&disablekb=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
      f.allow = "autoplay; encrypted-media"; f.tabIndex = -1; f.title = pvTitle(p);
      // ask the player for its state, duration and quality levels
      f.addEventListener("load", () => {
        try{ f.contentWindow.postMessage(JSON.stringify({event:"listening", id:p.id, channel:"widget"}), "*"); }catch(e){}
      });
      media.appendChild(f);
    }
  }
  // the other cards turn in perspective (each around its own centre, nothing stretched)
  // and slide in against the sides of the open one
  const PERSP = 700, TURN = 28, GAP = 6;
  function fan(card, E){
    const cards = [...list.children], i0 = cards.indexOf(card), tuck = card.offsetWidth * .05, finals = [];
    cards.forEach(c => { c.style.transition = "none"; c.style.transform = ""; });
    for(const side of [1, -1]){
      let edge = side > 0 ? E.right - tuck : E.left + tuck;
      for(let i = i0 + side; i >= 0 && i < cards.length; i += side){
        const c = cards[i], r = c.getBoundingClientRect();
        const ty = E.mid - (r.top + r.height/2);
        const T = tx => `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) perspective(${PERSP}px) rotateY(${side > 0 ? -TURN : TURN}deg)`;
        c.style.transform = T(0);
        const q = c.getBoundingClientRect(), tx = edge - (side > 0 ? q.left : q.right);
        edge = side > 0 ? q.right + tx + GAP : q.left + tx - GAP;
        finals.push([c, T(tx)]);
      }
    }
    // start flat, then let them glide into place
    cards.forEach(c => c.style.transform = "");
    void list.offsetWidth;
    cards.forEach(c => c.style.transition = "");
    fanRaf = requestAnimationFrame(() => { if(pv) finals.forEach(([c, t]) => c.style.transform = t); });
  }
  function closePeek(now){
    clearTimeout(peekTimer); cancelAnimationFrame(fanRaf);
    if(!pv) return;
    const {el, card, shrunk} = pv; pv = null;
    shade.classList.remove("on"); rc.classList.remove("peek");
    [...list.children].forEach(c => c.style.transform = "");
    let gone = false;
    const done = () => { if(gone) return; gone = true; el.remove(); card.classList.remove("lifted"); };
    if(now){ done(); return; }
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
  if(canPeek){
    list.addEventListener("mouseover", e => {
      const c = e.target.closest(".rc-card"); if(!c || c.contains(e.relatedTarget) || rcDrag.on) return;
      clearTimeout(peekTimer);
      peekTimer = setTimeout(() => { if(!rcDrag.on && c.matches(":hover")) openPeek(c); }, PEEK_MS);
    });
    list.addEventListener("mouseout", e => { const c = e.target.closest(".rc-card"); if(c && !c.contains(e.relatedTarget)) clearTimeout(peekTimer); });
    list.addEventListener("pointerdown", () => clearTimeout(peekTimer));
    // scrolling the row: an open preview travels with its card (it closes once it slides out from
    // under the pointer); otherwise the 1 s wait restarts for whichever card ends up under the pointer
    list.addEventListener("scroll", () => {
      clearTimeout(peekTimer);
      if(pv){ pv.el.style.translate = `${(peekLeft - list.scrollLeft).toFixed(1)}px 0`; return; }
      const c = list.querySelector(".rc-card:hover");
      if(c) peekTimer = setTimeout(() => { if(!rcDrag.on && c.matches(":hover")) openPeek(c); }, PEEK_MS);
    }, {passive:true});
    addEventListener("resize", () => closePeek(true));
    addEventListener("keydown", e => { if(e.key === "Escape") closePeek(); });
  }

  // ---------- Tijdlijn ----------
  const MN = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
  const iso = t => new Date(t).toISOString().slice(0,10);
  const TODAY = Date.now();
  const tlName = p => p.name || flat(p.label);

  const hoverThumb = (() => {
    const el = document.createElement("div"); el.className = "hthumb"; el.setAttribute("aria-hidden","true");
    el.innerHTML = `<div class="im"></div><div class="tx"><b></b><span></span></div>`;
    document.body.appendChild(el);
    const im = el.querySelector(".im"), b = el.querySelector("b"), s = el.querySelector("span");
    let cur = null;
    return {
      show(p, cx, cy){
        if(cur !== p.id){
          cur = p.id; el.style.setProperty("--c", COLOR(p.cat));
          b.textContent = flat(p.label); s.textContent = p.sub + " · " + p.date;
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
      const gh = document.createElement("div"); gh.className = "grp"; gh.textContent = g.label; heads.appendChild(gh);
      const gr = document.createElement("div"); gr.className = "grp-row"; trks.appendChild(gr);
      const line = document.createElement("div"); line.className = "sep"; tl.appendChild(line);
      seps.push({row:gr, el:line});
      g.tracks.forEach(tr => {
        const h = document.createElement("div"); h.className = "head"; h.style.setProperty("--c", COLOR(tr.cat));
        h.innerHTML = `<span class="sw"></span><span class="nm-l">${tr.name}</span><span class="nm-s">${tr.short || tr.name}</span>`; heads.appendChild(h);
        const row = document.createElement("div"); row.className = "trk"; row.dataset.cat = tr.cat;
        // projects that overlap in time get their own lane inside the track
        const its = P.filter(p => p.cat === tr.cat).map(p => { const a = D(p.t0); return {p, a, b:Math.max(p.t1 ? D(p.t1) : a, a + o.minDays*DAY)}; }).sort((m,k) => m.a - k.a);
        const laneEnd = [];
        its.forEach(it => { let l = laneEnd.findIndex(e => e <= it.a); if(l < 0){ l = laneEnd.length; laneEnd.push(0); } laneEnd[l] = it.b; it.lane = l; });
        its.forEach(it => {
          items.push(it); const p = it.p;
          const c = document.createElement("button"); c.type = "button"; c.className = "clip"; c.dataset.id = p.id; c.style.setProperty("--c", COLOR(p.cat));
          c.style.left = x(it.a); c.style.width = w(it.b - it.a); c.setAttribute("aria-label", `${flat(p.label)}, ${p.date}`);
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
      if(t >= start - DAY){ const el = document.createElement("div"); el.className = "tick"+(mm===0?" y":""); el.dataset.m = mm; el.style.left = x(Math.max(t,start)); el.textContent = mm===0 ? yy : MN[mm]; ruler.appendChild(el); }
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

  timeline($("#tijdlijn"), $("#tl"), {
    start:"2024-09-01", end:iso(TODAY + 40*DAY), now:iso(TODAY), minDays:18,
    groups:[
      {label:"Videografie", tracks:[{cat:"event",name:"Aftermovies"},{cat:"trouw",name:"Trouwfilms"},{cat:"promo",name:"Promotievideo's",short:"Promo"}]},
      {label:"RITCS", tracks:[{cat:"fictie",name:"Fictie"},{cat:"docu",name:"Documentaire",short:"Docu"},{cat:"iao",name:"IAO"}]}
    ]
  });

  // ---------- player ----------
  const dlg = $("#player");
  const ytFrame = (id,title) => `<iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  function show(p,k){
    const scr = $("#plScreen"), link = $("#plLink");
    if(p.vids){ const v = p.vids[k]; scr.innerHTML = `<video src="${v.src}" poster="${v.poster}" controls autoplay playsinline></video>`; link.hidden = true; }
    else { scr.innerHTML = ytFrame(p.yt, flat(p.label)); link.hidden = false; link.href = "https://www.youtube.com/watch?v=" + p.yt; }
    $("#plParts").querySelectorAll("button").forEach((b,i) => b.setAttribute("aria-pressed", i === k));
  }
  function openPlayer(p){
    $("#plTitle").textContent = flat(p.label);
    $("#plMeta").textContent = p.sub + " · " + p.date;
    const parts = $("#plParts"); parts.innerHTML = "";
    if(p.vids && p.vids.length > 1) p.vids.forEach((v,k) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "pthumb";
      b.setAttribute("aria-label", `Video ${k+1} van ${p.vids.length}`); b.innerHTML = `<img src="${v.poster}" alt="">`;
      b.onclick = () => show(p,k); parts.appendChild(b);
    });
    show(p,0); dlg.showModal();
  }
  $("#plClose").onclick = () => dlg.close();
  dlg.addEventListener("click", e => { if(e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => { $("#plScreen").innerHTML = ""; });
})();
