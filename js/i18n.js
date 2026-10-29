// Texts of the site in NL / EN / FR. Change a translation here; the keys are used in index.html
// (data-i18n / data-i18n-aria) and in main.js (I18N.t("key")).
(function(){
  const T = {
    "nav.main":        {nl:"Hoofdmenu",            en:"Main menu",            fr:"Menu principal"},
    "nav.video":       {nl:"Videografie",          en:"Videography",          fr:"Vidéographie"},
    "nav.ritcs":       {nl:"RITCS",                en:"RITCS",                fr:"RITCS"},
    "nav.other":       {nl:"Overig",               en:"Other",                fr:"Autres"},
    "nav.top":         {nl:"Tristan Nijs Media, naar boven", en:"Tristan Nijs Media, back to top", fr:"Tristan Nijs Media, retour en haut"},
    "lang.label":      {nl:"Taal",                 en:"Language",             fr:"Langue"},
    "menu.open":       {nl:"Menu openen",          en:"Open menu",            fr:"Ouvrir le menu"},
    "menu.close":      {nl:"Menu sluiten",         en:"Close menu",           fr:"Fermer le menu"},
    "hero.down":       {nl:"Naar beneden",         en:"Scroll down",          fr:"Défiler vers le bas"},
    "sec.featured":    {nl:"Uitgelicht",           en:"Featured",             fr:"À la une"},
    "sec.recent":      {nl:"Recent",               en:"Recent",               fr:"Récent"},
    "sec.timeline":    {nl:"Tijdlijn",             en:"Timeline",             fr:"Chronologie"},
    "cf.label":        {nl:"Uitgelichte projecten", en:"Featured projects",   fr:"Projets à la une"},
    "prev":            {nl:"Vorige",               en:"Previous",             fr:"Précédent"},
    "next":            {nl:"Volgende",             en:"Next",                 fr:"Suivant"},
    "tl.video":        {nl:"Videografie",          en:"Videography",          fr:"Vidéographie"},
    "tl.ritcs":        {nl:"RITCS",                en:"RITCS",                fr:"RITCS"},
    "tl.event":        {nl:"Aftermovies",          en:"Aftermovies",          fr:"Aftermovies"},
    "tl.trouw":        {nl:"Trouwfilms",           en:"Wedding films",        fr:"Films de mariage"},
    "tl.trouw.s":      {nl:"Trouwfilms",           en:"Weddings",             fr:"Mariages"},
    "tl.promo":        {nl:"Promotievideo's",      en:"Promo videos",         fr:"Vidéos promo"},
    "tl.promo.s":      {nl:"Promo",                en:"Promo",                fr:"Promo"},
    "tl.fictie":       {nl:"Fictie",               en:"Fiction",              fr:"Fiction"},
    "tl.docu":         {nl:"Documentaire",         en:"Documentary",          fr:"Documentaire"},
    "tl.docu.s":       {nl:"Docu",                 en:"Docu",                 fr:"Docu"},
    "tl.iao":          {nl:"IAO",                  en:"IAO",                  fr:"IAO"},
    "tl.fit":          {nl:"Passend",              en:"Fit",                  fr:"Ajuster"},
    "tl.zoomIn":       {nl:"Inzoomen",             en:"Zoom in",              fr:"Zoom avant"},
    "tl.zoomOut":      {nl:"Uitzoomen",            en:"Zoom out",             fr:"Zoom arrière"},
    "tl.zoom":         {nl:"Zoom",                 en:"Zoom",                 fr:"Zoom"},
    "type.event":      {nl:"Aftermovie",           en:"Aftermovie",           fr:"Aftermovie"},
    "type.trouw":      {nl:"Trouwfilm",            en:"Wedding film",         fr:"Film de mariage"},
    "type.promo":      {nl:"Promotievideo",        en:"Promo video",          fr:"Vidéo promotionnelle"},
    "play":            {nl:"{t} afspelen",         en:"Play {t}",             fr:"Lire {t}"},
    "close":           {nl:"Sluiten",              en:"Close",                fr:"Fermer"},
    "videoOf":         {nl:"Video {k} van {n}",    en:"Video {k} of {n}",     fr:"Vidéo {k} sur {n}"}
  };
  // card subtitles from data.js (written in Dutch) that need translating; anything else stays as is
  const SUB = {
    "Trouwfilm":      {en:"Wedding film",  fr:"Film de mariage"},
    "Pop-up opening": {en:"Pop-up opening", fr:"Ouverture pop-up"}
  };
  const LANGS = ["nl","en","fr"], LOCALE = {nl:"nl-BE", en:"en-GB", fr:"fr-BE"};
  // project titles from data.js: course names and "Film van" are translated, names of films stay
  const LABEL = {
    en: [[/^Atelier Docu:/, "Documentary Studio:"], [/^Workshop Docu:/, "Documentary Workshop:"],
         [/^Atelier Fictie:/, "Fiction Studio:"], [/^Atelier Fictie (\d)/, "Fiction Studio $1"], [/\bFilm van\b/, "Film by"]],
    fr: [[/^Atelier Docu:/, "Atelier documentaire :"], [/^Workshop Docu:/, "Workshop documentaire :"],
         [/^Atelier Fictie:/, "Atelier fiction :"], [/^Atelier Fictie (\d)/, "Atelier fiction $1"], [/\bFilm van\b/, "Film de"]]
  };
  const DESC = {
    nl: "Tristan Nijs is monteur en videograaf uit Gent: aftermovies, trouwfilms en promo's, en student montage aan het RITCS.",
    en: "Tristan Nijs is an editor and videographer from Ghent: aftermovies, wedding films and promo videos, and an editing student at RITCS.",
    fr: "Tristan Nijs est monteur et vidéaste à Gand : aftermovies, films de mariage et vidéos promo, et étudiant en montage au RITCS."
  };

  function pick(){
    let q = null; try{ q = new URLSearchParams(location.search).get("lang"); }catch(e){}
    if(LANGS.includes(q)) return q;
    try{ const s = localStorage.getItem("tnm-lang"); if(LANGS.includes(s)) return s; }catch(e){}
    // Dutch unless the visitor picked another language
    return "nl";
  }
  let lang = pick();
  const hooks = [];
  const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
  const monthName = (t, l) => new Intl.DateTimeFormat(LOCALE[l], {month:"long", timeZone:"UTC"}).format(new Date(t));
  const D = s => Date.parse(s + "T12:00:00Z");

  const I = {
    LANGS,
    get lang(){ return lang; },
    t(key, vars){
      const e = T[key]; let s = e ? (e[lang] ?? e.nl) : key;
      if(vars) for(const k in vars) s = s.replace("{" + k + "}", vars[k]);
      return s;
    },
    sub(s){ const e = SUB[s]; return lang === "nl" || !e ? s : (e[lang] ?? s); },
    label(s){ return lang === "nl" ? s : (LABEL[lang] || []).reduce((a, [re, to]) => a.replace(re, to), s); },
    // short month for the timeline ruler
    monthShort(m){
      if(lang === "nl") return ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"][m];
      return new Intl.DateTimeFormat(LOCALE[lang], {month:"short", timeZone:"UTC"}).format(Date.UTC(2020, m, 15)).replace(/\.$/, "");
    },
    // a project's date in the current language, in the same form as the Dutch one in data.js
    date(p){
      const nl = p.date || "";
      if(lang === "nl") return nl;
      const a = D(p.t0), b = p.t1 ? D(p.t1) : a, A = new Date(a), B = new Date(b), Y = B.getUTCFullYear();
      if(/^\d{4}\s*[–-]\s*\d{4}$/.test(nl)) return nl;
      if(/^\d{1,2}\s*[–-]\s*\d{1,2}\s+\S+\s+\d{4}$/.test(nl)) return `${A.getUTCDate()}–${B.getUTCDate()} ${monthName(b, lang)} ${Y}`;
      if(/^\d{1,2}\s+\S+\s+\d{4}$/.test(nl)) return `${A.getUTCDate()} ${monthName(a, lang)} ${A.getUTCFullYear()}`;
      if(/^\S+\s*[–-]\s*\S+\s+\d{4}$/.test(nl)) return cap1(`${monthName(a, lang)} – ${monthName(b, lang)} ${Y}`);
      if(/^\S+\s+\d{4}$/.test(nl)) return cap1(`${monthName(a, lang)} ${A.getUTCFullYear()}`);
      return nl;
    },
    onChange(fn){ hooks.push(fn); },
    set(l){
      if(!LANGS.includes(l) || l === lang) return;
      lang = l;
      try{ localStorage.setItem("tnm-lang", l); }catch(e){}
      I.apply();
      hooks.forEach(fn => fn(l));
    },
    // static texts in the page
    apply(){
      document.documentElement.lang = lang;
      const md = document.querySelector('meta[name="description"]'); if(md) md.setAttribute("content", DESC[lang]);
      document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = I.t(el.dataset.i18n));
      document.querySelectorAll("[data-i18n-aria]").forEach(el => el.setAttribute("aria-label", I.t(el.dataset.i18nAria)));
    }
  };
  window.I18N = I;
})();
