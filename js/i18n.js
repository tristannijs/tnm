// Texts of the site in NL / EN / FR. Change a translation here; the keys are used in index.html
// (data-i18n / data-i18n-aria) and in main.js (I18N.t("key")).
(function(){
  const T = {
    "nav.main":        {nl:"Hoofdmenu",            en:"Main menu",            fr:"Menu principal"},
    "nav.video":       {nl:"Video",                en:"Video",                fr:"Vidéo"},
    "nav.ritcs":       {nl:"Film",                 en:"Film",                 fr:"Film"},
    "nav.contact":     {nl:"Contact",              en:"Contact",              fr:"Contact"},
    "ct.close":        {nl:"Sluiten",              en:"Close",                fr:"Fermer"},
    "ct.sub":          {nl:"Een project in gedachten? Laat iets weten.", en:"Got a project in mind? Let me know.", fr:"Un projet en tête ? Écrivez-moi."},
    "ct.name":         {nl:"Naam",                 en:"Name",                 fr:"Nom"},
    "ct.mail":         {nl:"E-mail",               en:"Email",                fr:"E-mail"},
    "ct.kind":         {nl:"Waarvoor",             en:"What for",             fr:"Pour quoi"},
    "ct.edit":         {nl:"Montage",              en:"Editing",              fr:"Montage"},
    "ct.other":        {nl:"Iets anders",          en:"Something else",       fr:"Autre chose"},
    "ct.msg":          {nl:"Bericht",              en:"Message",              fr:"Message"},
    "ct.sending":      {nl:"Bezig met versturen…", en:"Sending…",             fr:"Envoi en cours…"},
    "ct.sent":         {nl:"Verstuurd! Ik antwoord zo snel mogelijk.", en:"Sent! I’ll get back to you soon.", fr:"Envoyé ! Je vous réponds au plus vite."},
    "ct.fail":         {nl:"Dat lukte niet. Mail me gerust rechtstreeks.", en:"That didn’t work. Feel free to email me directly.", fr:"L’envoi a échoué. Écrivez-moi directement."},
    "ct.send":         {nl:"Versturen",            en:"Send",                 fr:"Envoyer"},
    "nav.other":       {nl:"Overig",               en:"Other",                fr:"Autres"},
    "nav.top":         {nl:"Tristan Nijs Media, naar boven", en:"Tristan Nijs Media, back to top", fr:"Tristan Nijs Media, retour en haut"},
    "lang.label":      {nl:"Taal",                 en:"Language",             fr:"Langue"},
    "menu.open":       {nl:"Menu openen",          en:"Open menu",            fr:"Ouvrir le menu"},
    "menu.close":      {nl:"Menu sluiten",         en:"Close menu",           fr:"Fermer le menu"},
    "hero.down":       {nl:"Naar beneden",         en:"Scroll down",          fr:"Défiler vers le bas"},
    "role.one":        {nl:"Rol",                  en:"Role",                 fr:"Rôle"},
    "role.many":       {nl:"Rollen",               en:"Roles",                fr:"Rôles"},
    "nav.start":       {nl:"Start",                en:"Home",                 fr:"Accueil"},
    "wk.all.a":        {nl:"Werk",                 en:"Work",                 fr:"Travaux"},
    "wk.video.a":      {nl:"Video",                en:"Video",                fr:"Vidéo"},
    "wk.video.b":      {nl:"grafie",               en:"graphy",               fr:"graphie"},
    "wk.film.a":       {nl:"Film",                 en:"Film",                 fr:"Film"},
    "wk.other.a":      {nl:"Overig",               en:"Other",                fr:"Autres"},
    "wk.all.s":        {nl:"Video, Film, Overig",  en:"Video, Film, Other",   fr:"Vidéo, film, autres"},
    "wk.video.s":      {nl:"Aftermovies, Trouwfilms, Promotioneel Werk", en:"Aftermovies, Wedding Films, Promotional Work", fr:"Aftermovies, films de mariage, vidéos promotionnelles"},
    "wk.film.s":       {nl:"Fictie, Documentaire, IAO", en:"Fiction, Documentary, IAO", fr:"Fiction, documentaire, IAO"},
    "wk.other.s":      {nl:"Fotografie",           en:"Photography",          fr:"Photographie"},
    "f.veld":          {nl:"Veld",                 en:"Field",                fr:"Domaine"},
    "f.ctx":           {nl:"Context",              en:"Context",              fr:"Contexte"},
    "f.jaar":          {nl:"Jaar",                 en:"Year",                 fr:"Année"},
    "ph.more":         {nl:"Meer laden",           en:"Load more",            fr:"Voir plus"},
    "ph.less":         {nl:"Minder tonen",         en:"Show less",            fr:"Voir moins"},
    "f.album":         {nl:"Album",                en:"Album",                fr:"Album"},
    "f.genre":         {nl:"Genre",                en:"Genre",                fr:"Genre"},
    "g.filmscore":     {nl:"Filmmuziek",           en:"Film score",           fr:"Musique de film"},
    "g.hiphop":        {nl:"Hiphop",               en:"Hip-hop",              fr:"Hip-hop"},
    "g.trap":          {nl:"Trap",                 en:"Trap",                 fr:"Trap"},
    "g.house":         {nl:"House",                en:"House",                fr:"House"},
    "g.pop":           {nl:"Pop",                  en:"Pop",                  fr:"Pop"},
    "g.ambient":       {nl:"Ambient",              en:"Ambient",              fr:"Ambient"},
    "mu.sample":       {nl:"Sample",               en:"Sample",               fr:"Sample"},
    "mu.acapella":     {nl:"Acapella",             en:"Acapella",             fr:"A cappella"},
    "mu.inspired by":  {nl:"Geïnspireerd op",      en:"Inspired by",          fr:"Inspiré de"},
    "f.rol":           {nl:"Rol",                  en:"Role",                 fr:"Rôle"},
    "f.all":           {nl:"Alles",                en:"All",                  fr:"Tout"},
    "f.event":         {nl:"Aftermovie",           en:"Aftermovie",           fr:"Aftermovie"},
    "f.trouw":         {nl:"Trouwfilm",            en:"Wedding film",         fr:"Film de mariage"},
    "f.promo":         {nl:"Promo’s",              en:"Promos",               fr:"Promos"},
    "f.ritcs":         {nl:"RITCS",                en:"RITCS",                fr:"RITCS"},
    "f.iao":           {nl:"IAO",                  en:"IAO",                  fr:"IAO"},
    "f.fictie":        {nl:"Fictie",               en:"Fiction",              fr:"Fiction"},
    "f.docu":          {nl:"Documentaire",         en:"Documentary",          fr:"Documentaire"},
    "f.event.p":       {nl:"Aftermovies",          en:"Aftermovies",          fr:"Aftermovies"},
    "f.trouw.p":       {nl:"Trouwfilms",           en:"Wedding Films",        fr:"Films de mariage"},
    "f.promo.p":       {nl:"Promotioneel Werk",    en:"Promotional Work",     fr:"Vidéos promotionnelles"},
    "f.ritcs.p":       {nl:"RITCS",                en:"RITCS",                fr:"RITCS"},
    "f.iao.p":         {nl:"IAO",                  en:"IAO",                  fr:"IAO"},
    "f.fictie.p":      {nl:"Fictie",               en:"Fiction",              fr:"Fiction"},
    "f.docu.p":        {nl:"Documentaire",         en:"Documentary",          fr:"Documentaire"},
    "more":            {nl:"Meer info",            en:"More info",            fr:"Plus d’infos"},
    "wk.back":         {nl:"Terug",                en:"Back",                 fr:"Retour"},
    "f.bio":           {nl:"Biografie",            en:"Biography",            fr:"Biographie"},
    "f.foto":          {nl:"Foto",                 en:"Photo",                fr:"Photo"},
    "f.muziek":        {nl:"Muziek",               en:"Music",                fr:"Musique"},
    "f.persoonlijk":   {nl:"Persoonlijk",          en:"Personal",             fr:"Personnel"},
    "f.bio.p":         {nl:"Biografie",            en:"Biography",            fr:"Biographie"},
    "f.foto.p":        {nl:"Foto",                 en:"Photo",                fr:"Photo"},
    "f.muziek.p":      {nl:"Muziek",               en:"Music",                fr:"Musique"},
    "f.persoonlijk.p": {nl:"Persoonlijk",          en:"Personal",             fr:"Personnel"},
    "f.none":          {nl:"Hier staat nog niets.", en:"Nothing here yet.",   fr:"Rien ici pour l’instant."},
    "f.vids":          {nl:"{n} video’s",          en:"{n} videos",           fr:"{n} vidéos"},
    "foot.mail":       {nl:"Mail",                 en:"Email",                fr:"E-mail"},
    "sec.about":       {nl:"Over",                 en:"About",                fr:"À propos"},
    "about.1": {nl:"Ik ben Tristan Nijs, videograaf en editor. Ik kom uit Gent en studeer filmmontage in Brussel aan het RITCS.",
                en:"I’m Tristan Nijs, videographer and editor. I’m from Ghent and study film editing at RITCS in Brussels.",
                fr:"Je suis Tristan Nijs, vidéaste et monteur. Je viens de Gand et j’étudie le montage à Bruxelles, au RITCS."},
    "about.2": {nl:"Als videograaf hou ik me vooral bezig met aftermovies, trouwfilms en creatief promotioneel werk. Als editor wissel ik graag af tussen docu en fictie. Daarnaast maak ik zelf graag foto’s en muziek.",
                en:"As a videographer I mostly make aftermovies, wedding films and creative promotional work. As an editor I like to switch between documentary and fiction. I also love making photos and music.",
                fr:"Comme vidéaste, je réalise surtout des aftermovies, des films de mariage et des projets promotionnels créatifs. Comme monteur, j’aime alterner entre documentaire et fiction. À côté, j’aime faire de la photo et de la musique."},
    "about.3": {nl:"Ik sta open voor eender welk project als videograaf of editor.",
                en:"I’m open to any project as a videographer or editor.",
                fr:"Je suis ouvert à tout projet, comme vidéaste ou comme monteur."},
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
    "type.persoonlijk":{nl:"Persoonlijk",          en:"Personal",             fr:"Personnel"},
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
  // what Tristan did on a project (data.js: roles, written in Dutch)
  const ROLE = {
    "Script":   {en:"Script",      fr:"Scénario"},
    "Scenario": {en:"Script",      fr:"Scénario"},
    "Regie":    {en:"Direction",   fr:"Réalisation"},
    "Camera":   {en:"Camera",      fr:"Caméra"},
    "Montage":  {en:"Editing",     fr:"Montage"},
    "Kleur":    {en:"Colour",      fr:"Étalonnage"},
    "Productie":{en:"Production",  fr:"Production"},
    "Geluid":   {en:"Sound",       fr:"Son"},
    "Concept":  {en:"Concept",     fr:"Concept"},
    "Acteur":   {en:"Actor",       fr:"Acteur"},
    "Videograaf":{en:"Videographer", fr:"Vidéaste"}
  };
  const LANGS = ["nl","en","fr"], LOCALE = {nl:"nl-BE", en:"en-GB", fr:"fr-BE"};
  // project titles from data.js: course names, "Film van" and the films with a translated title
  const LABEL = {
    en: [[/^Atelier Docu:/, "Documentary Studio:"], [/^Workshop Docu:/, "Documentary Workshop:"],
         [/^Atelier Fictie:/, "Fiction Studio:"], [/^Atelier Fictie (\d)/, "Fiction Studio $1"], [/\bFilm van\b/, "Film by"], [/\bNieuw Gent\b/, "New Ghent"], [/\bTen Anker\b/, "At Anchor"], [/\bDe Koffer\b/, "The Suitcase"]],
    fr: [[/^Atelier Docu:/, "Atelier documentaire :"], [/^Workshop Docu:/, "Workshop documentaire :"],
         [/^Atelier Fictie:/, "Atelier fiction :"], [/^Atelier Fictie (\d)/, "Atelier fiction $1"], [/\bFilm van\b/, "Film de"], [/\bNieuw Gent\b/, "Nouveau Gand"], [/\bTen Anker\b/, "Au mouillage"], [/\bDe Koffer\b/, "La Valise"]]
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
    role(s){ const e = ROLE[s]; return lang === "nl" || !e ? s : (e[lang] ?? s); },
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
