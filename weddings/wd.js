(function(){
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const T = {
    "Contact": ["Contact", "Contact"],
    "Films": ["Films", "Films"],
    "Werkwijze": ["How I work", "Méthode"],
    "Prijzen": ["Prices", "Tarifs"],
    "Tristan Nijs Media: Weddings": ["Tristan Nijs Media: Weddings", "Tristan Nijs Media : Mariages"],
    "Zijn jullie op zoek naar een videograaf die jullie trouwdag kan vastleggen en omtoveren naar een aftermovie die je nauw bij het hart zal liggen? Dan stel ik mezelf graag even voor!":
      ["Are you looking for a videographer who can capture your wedding day and turn it into a film you will hold close to your heart? Then let me introduce myself!",
       "Vous cherchez un vidéaste qui saura capturer le jour de votre mariage et en faire un film qui vous tiendra à cœur ? Alors permettez-moi de me présenter !"],
    "Mijn naam is Tristan Nijs, 20 jaar oud en ik zit momenteel in mijn derde jaar filmmontage aan het RITCS in Brussel. Naast mijn studies ben ik freelance videograaf actief in evenementen, promotievideo’s en uiteraard ook trouwfilms. Buiten het filmgebeuren maak ik zelf graag foto’s en muziek.":
      ["My name is Tristan Nijs, I’m 20 and currently in my third year of film editing at RITCS in Brussels. Alongside my studies I work as a freelance videographer for events, promotional videos and, of course, weddings. Outside of film, I love taking photos and making music.",
       "Je m’appelle Tristan Nijs, j’ai 20 ans et je suis actuellement en troisième année de montage au RITCS à Bruxelles. En parallèle de mes études, je suis vidéaste indépendant pour des événements, des vidéos promotionnelles et, bien sûr, des mariages. En dehors du cinéma, j’aime faire de la photo et de la musique."],
    "Wat mij aanspreekt aan trouwfilms, is dat ze om pure emotie en menselijke verbintenis draaien. Er is ook geen commercieel doel en de video zou eeuwig moeten meegaan. Dat geeft me de artistieke vrijheid en de rust om elke film met zorg en geduld op te bouwen tot een film die zijn eeuwigheid verdient. Ik wil dat jullie de film kunnen koesteren voor het leven, en dat het kan dienen als een herbeleving van de talrijke emoties die jullie op die dag gevoeld zullen hebben.":
      ["What draws me to wedding films is that they are about pure emotion and human connection. There is no commercial goal, and the film should last forever. That gives me the artistic freedom and the calm to build every film with care and patience, into a film worthy of that forever. I want you to treasure it for life, and to be able to relive the many emotions you felt that day.",
       "Ce qui me plaît dans les films de mariage, c’est qu’ils parlent d’émotion pure et de lien humain. Il n’y a pas de but commercial, et le film doit durer pour toujours. Cela me donne la liberté artistique et le calme pour construire chaque film avec soin et patience, jusqu’à ce qu’il mérite cette éternité. Je veux que vous puissiez le chérir toute votre vie et y revivre les nombreuses émotions ressenties ce jour-là."],
    "In mijn trouwfilms focus ik op emotie en een verhaal zodanig opgebouwd dat die emotie helemaal overkomt. Ik wil dat elke film uniek is en de persoonlijkheid draagt van het koppel. Muziek en klank krijgen evenveel aandacht als het beeld. Dankzij mijn studies en een muzikale achtergrond kan ik doelbewust die zaken hanteren.":
      ["In my wedding films I focus on emotion, with a story built so that the emotion fully comes across. I want every film to be unique and to carry the personality of the couple. Music and sound get as much attention as the image. My studies and a musical background let me use them with intention.",
       "Dans mes films de mariage, je mise sur l’émotion et sur une histoire construite pour que cette émotion passe pleinement. Je veux que chaque film soit unique et porte la personnalité du couple. La musique et le son reçoivent autant d’attention que l’image. Mes études et mon parcours musical me permettent de les utiliser de façon réfléchie."],
    "Tijdens het proces probeer ik het zo aangenaam mogelijk te maken voor het koppel. Aan de hand van een kennismakingsgesprek leer ik jullie beter kennen en krijg ik een idee welke personaliteit de film zal dragen. De dag zelf blijf ik zo discreet mogelijk. Wil ik iets in beeld brengen dat planning vraagt, dan bespreken we dat ruim op voorhand. Zo kunnen jullie op de dag zelf gewoon genieten.":
      ["Throughout the process I try to make things as easy as possible for the couple. In a first meeting I get to know you and get a feel for the personality the film should carry. On the day itself I stay as discreet as possible. If I want to film something that needs planning, we discuss it well in advance. That way you can simply enjoy your day.",
       "Tout au long du processus, j’essaie de rendre les choses aussi agréables que possible pour le couple. Lors d’un premier rendez-vous, j’apprends à vous connaître et je me fais une idée de la personnalité que portera le film. Le jour même, je reste aussi discret que possible. Si je veux filmer quelque chose qui demande de la préparation, nous en parlons bien à l’avance. Ainsi, vous profitez simplement de votre journée."],
    "Kennismaking": ["First meeting", "Rencontre"],
    "We bespreken jullie dag, de planning en wat jullie belangrijk vinden.": ["We talk about your day, the schedule and what matters to you.", "Nous parlons de votre journée, du planning et de ce qui compte pour vous."],
    "Datum vast": ["Date booked", "Date réservée"],
    "Na ondertekening en een voorschot van 25% staat jullie datum vast.": ["Once signed and with a 25% deposit, your date is booked.", "Après signature et un acompte de 25 %, votre date est réservée."],
    "De dag": ["The day", "Le jour J"],
    "Ik film de dag zoals hij is, van voorbereiding tot feest.": ["I film the day as it is, from getting ready to the party.", "Je filme la journée telle qu’elle est, des préparatifs à la fête."],
    "Montage": ["Editing", "Montage"],
    "De film wordt zorgvuldig gemonteerd.": ["The film is carefully edited.", "Le film est monté avec soin."],
    "Levering": ["Delivery", "Livraison"],
    "Binnen 4 tot 6 weken, via een downloadlink.": ["Within 4 to 6 weeks, via a download link.", "Sous 4 à 6 semaines, via un lien de téléchargement."],
    "Werkethiek": ["Work ethic", "Éthique de travail"],
    "In mijn werkethiek vind ik het uiterst belangrijk om eerlijk te zijn. Ik ben me bewust van mijn jonge leeftijd en mijn eerder beperkt trouwportfolio. Daar staat wel tegenover dat elke trouwfilm voor mij een project is waar ik volledig in duik, zonder de routine van iemand die er twintig per jaar maakt. Zoeken jullie een persoonlijke trouwfilm met een frisse blik, dan ben ik graag jullie videograaf.":
      ["Honesty matters a great deal to me. I’m aware of my young age and my still limited wedding portfolio. In return, every wedding film is a project I dive into completely, without the routine of someone who makes twenty a year. If you’re looking for a personal wedding film with a fresh eye, I’d love to be your videographer.",
       "L’honnêteté est essentielle pour moi. Je suis conscient de mon jeune âge et de mon portfolio de mariages encore limité. En contrepartie, chaque film de mariage est pour moi un projet dans lequel je me plonge entièrement, sans la routine de quelqu’un qui en fait vingt par an. Si vous cherchez un film de mariage personnel avec un regard neuf, je serai ravi d’être votre vidéaste."],
    "Kennismakingsgesprek": ["First meeting", "Premier rendez-vous"],
    "8u filmen (overuren €50/u)": ["8h of filming (overtime €50/h)", "8 h de tournage (heures sup. 50 €/h)"],
    "Recap 2-3 minuten": ["2-3 minute recap", "Récap de 2-3 minutes"],
    "Kies LITE": ["Choose LITE", "Choisir LITE"],
    "Volledige dag filmen": ["Full day of filming", "Tournage de toute la journée"],
    "Voorbereiding t.e.m. nachtfeest": ["Getting ready through the evening party", "Des préparatifs à la soirée"],
    "Aftermovie van 7-10min": ["7-10 min film", "Film de 7-10 min"],
    "Kies STANDARD": ["Choose STANDARD", "Choisir STANDARD"],
    "Teaser van ~30sec": ["~30 sec teaser", "Teaser de ~30 s"],
    "3 shortform video’s (~20sec/video)": ["3 short-form videos (~20 sec each)", "3 vidéos courtes (~20 s chacune)"],
    "Kies PREMIUM": ["Choose PREMIUM", "Choisir PREMIUM"],
    "Opname volledige ceremonie (statisch)": ["Full ceremony recording (static)", "Captation complète de la cérémonie (fixe)"],
    "Opmerkingen:": ["Notes:", "Remarques :"],
    "Aflevering binnen de 4-6 weken": ["Delivery within 4-6 weeks", "Livraison sous 4-6 semaines"],
    "Voorschot van 25% om de datum te reserveren": ["25% deposit to book the date", "Acompte de 25 % pour réserver la date"],
    "Een definitieve offerte volgt na contact": ["A final quote follows after we talk", "Un devis définitif suit après prise de contact"],
    "Geen btw (vrijstellingsregeling kleine ondernemingen)": ["No VAT (small business exemption)", "Pas de TVA (régime de franchise des petites entreprises)"],
    "Is jullie datum nog vrij? Laat jullie datum en locatie weten, dan antwoord ik zo snel mogelijk.": ["Is your date still free? Let me know your date and venue and I’ll get back to you as soon as possible.", "Votre date est-elle encore libre ? Indiquez-moi votre date et le lieu, je vous réponds au plus vite."],
    "Jullie namen": ["Your names", "Vos prénoms"],
    "E-mail": ["Email", "E-mail"],
    "Trouwdatum": ["Wedding date", "Date du mariage"],
    "Locatie": ["Venue", "Lieu"],
    "Pakket": ["Package", "Formule"],
    "Nog niet zeker": ["Not sure yet", "Pas encore sûr"],
    "Bericht": ["Message", "Message"],
    "Versturen": ["Send", "Envoyer"],
    "Trouwfilm": ["Wedding film", "Film de mariage"],
    "Bezig met versturen…": ["Sending…", "Envoi en cours…"],
    "Verstuurd. Ik antwoord jullie zo snel mogelijk.": ["Sent. I’ll get back to you as soon as possible.", "Envoyé. Je vous réponds au plus vite."],
    "Versturen lukte niet. Mail gerust naar tristannijs.media@gmail.com.": ["Sending didn’t work. Feel free to email tristannijs.media@gmail.com.", "L’envoi a échoué. Écrivez-moi à tristannijs.media@gmail.com."]
  };
  const LANGS = ["nl", "en", "fr"];
  let lang = (() => {
    let q = null; try{ q = new URLSearchParams(location.search).get("lang"); }catch(e){}
    if(LANGS.includes(q)) return q;
    try{ const s = localStorage.getItem("tnm-lang"); if(LANGS.includes(s)) return s; }catch(e){}
    return "nl";
  })();
  const tr = s => lang === "nl" || !T[s] ? s : T[s][lang === "en" ? 0 : 1];
  const fmtDate = iso => new Intl.DateTimeFormat({nl:"nl-BE", en:"en-GB", fr:"fr-BE"}[lang], {day:"numeric", month:"long", year:"numeric", timeZone:"UTC"}).format(new Date(iso + "T12:00:00Z"));
  const textNodes = [];
  { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while(n = w.nextNode()){ const k = n.textContent.trim(); if(T[k] && !n.parentElement.closest("script")){ const m = n.textContent.match(/^(\s*)[\s\S]*?(\s*)$/); textNodes.push({n, k, a:m[1], z:m[2]}); } } }
  const langHooks = [];
  function applyLang(){
    document.documentElement.lang = lang;
    textNodes.forEach(({n, k, a, z}) => { n.textContent = a + tr(k) + z; });
    document.querySelectorAll("[data-lang]").forEach(b => b.setAttribute("aria-current", b.dataset.lang === lang ? "true" : "false"));
    document.querySelectorAll(".lang").forEach(b => b.textContent = lang.toUpperCase());
    langHooks.forEach(f => f());
  }
  function setLang(l){ if(!LANGS.includes(l)) return; lang = l; try{ localStorage.setItem("tnm-lang", l); }catch(e){} applyLang(); }

  const FILMS = [
    {id:"elien-jens", t:"Elien & Jens", t0:"2025-09-20", yt:"hvcm7aHr_Dc", cover:"../assets/covers/elien-jens.jpg", ar:1.896, lang:"NL"},
    {id:"joachim-felien", t:"Joachim & Felien", t0:"2026-05-02", yt:"JYeob-Q2qRs", cover:"../assets/clips/videografie/joachimFelien_1.jpg", lang:"NL"}
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
  const cap = p => { const c = document.createElement("div"); c.className = "cap"; c.dataset.id = p.id; c.innerHTML = `<b>${esc(p.t)}</b><span>${esc(fmtDate(p.t0))}</span>`; return c; };
  langHooks.push(() => document.querySelectorAll(".cap[data-id] span").forEach(sp => { sp.textContent = fmtDate(BY[sp.parentElement.dataset.id].t0); }));
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
    b.setAttribute("aria-label", `${p.t}, ${fmtDate(p.t0)}`);
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
    el.innerHTML = `<div class="pv-media"></div><div class="pv-info"><div class="pv-t">${esc(p.t)}</div><div class="pv-m">${esc(tr("Trouwfilm"))} · ${esc(fmtDate(p.t0))}</div><div class="pv-r"></div></div>`;
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

  const langBtn = $("#langBtn"), langMenu = $("#langMenu");
  const setLangMenu = open => { langMenu.hidden = !open; langBtn.setAttribute("aria-expanded", open); };
  langBtn.addEventListener("click", e => { e.stopPropagation(); setLangMenu(langMenu.hidden); });
  langMenu.addEventListener("click", e => { const b = e.target.closest("[data-lang]"); if(!b) return; setLangMenu(false); setLang(b.dataset.lang); });
  document.addEventListener("click", e => { if(!langMenu.hidden && !e.target.closest(".lang-wrap")) setLangMenu(false); });
  drawer.addEventListener("click", e => { const b = e.target.closest(".dr-lang [data-lang]"); if(b){ e.stopPropagation(); setLang(b.dataset.lang); } }, true);
  applyLang();

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
    btn.disabled = true; say(tr("Bezig met versturen…"));
    try{
      const r = await fetch("https://api.web3forms.com/submit", {method:"POST", headers:{"Content-Type":"application/json", Accept:"application/json"}, body:JSON.stringify(data)});
      const j = await r.json().catch(() => ({}));
      if(!r.ok || !j.success) throw 0;
      form.reset(); say(tr("Verstuurd. Ik antwoord jullie zo snel mogelijk."));
    }catch(err){ say(tr("Versturen lukte niet. Mail gerust naar tristannijs.media@gmail.com."), true); }
    btn.disabled = false;
  });
})();
