// All projects. `label` and `sub` are the two lines shown on the cards.
// t0 / t1 are start and end dates (ISO); they drive "Recent" order and the timeline.
window.PROJECTS = [
  // ----- videografie -----
  {id:"dokfeesten-2026", cat:"event", label:"Dokfeesten 2026", sub:"Aftermovie", date:"29 augustus 2026", t0:"2026-08-29", yt:"JdYwGTit_-c", cover:"assets/covers/dokfeesten.jpg"},
  {id:"wejo-bocco", cat:"event", label:"Wejo × Bocco", sub:"Pop-up opening", date:"22 juli 2026", t0:"2026-07-22", yt:"4to_bSMjv98", cover:"assets/covers/wejo-bocco.jpg"},
  {id:"joachim-felien", cat:"trouw", label:"Joachim & Felien", sub:"Trouwfilm", date:"2 mei 2026", t0:"2026-05-02", yt:"JYeob-Q2qRs", cover:"assets/covers/joachim-felien.jpg"},
  {id:"raw-collection", cat:"promo", label:"Raw Collection", sub:"WEJO Jewelry", date:"April 2026", t0:"2026-04-08", cover:"assets/wejo/TzAXosEGRPz.jpg",
    vids:["TzAXosEGRPz","HB4CC_BQhiI","6S5RmmwFN_o","ILPkMp435iz"].map(id=>({src:`assets/wejo/${id}.mp4`, poster:`assets/wejo/${id}.jpg`}))},
  {id:"spring-drop", cat:"promo", label:"Spring Drop\nAnnouncement", sub:"Docho Vintage", date:"21 maart 2026", t0:"2026-03-21", yt:"5VXlWdZdW1A", cover:"assets/covers/spring-drop.jpg"},
  {id:"fairtrade", cat:"event", label:"Fairtrade Banana Run", sub:"Aftermovie", date:"8 maart 2026", t0:"2026-03-08", yt:"hqw-YgsIId4", cover:"assets/covers/fairtrade.jpg"},
  {id:"elien-jens", cat:"trouw", label:"Elien & Jens", sub:"Trouwfilm", date:"20 september 2025", t0:"2025-09-20", yt:"hvcm7aHr_Dc", cover:"assets/covers/elien-jens.jpg"},
  {id:"icds-7", cat:"event", label:"ICDS 7", sub:"Aftermovie", date:"28–31 juli 2025", t0:"2025-07-28", t1:"2025-07-31", yt:"laxZ4am0Qrw", cover:"assets/covers/icds.jpg"},
  {id:"mens-sana-2025", cat:"event", label:"Mens Sana 2025", sub:"Aftermovie", date:"3 mei 2025", t0:"2025-05-03", yt:"cd96lB5AD2k", cover:"assets/covers/mens-sana.jpg"},

  // ----- RITCS -----
  {id:"nieuw-gent", cat:"docu", name:"Nieuw Gent", label:"Atelier Docu: Nieuw Gent", sub:"BA2 Editing", date:"Maart – april 2026", t0:"2026-03-01", t1:"2026-04-30", yt:"TKK0UC2sbbE"},
  {id:"87-seconds", cat:"docu", name:"87 Seconds", label:"Atelier Docu: 87 Seconds", sub:"BA2 Editing", date:"Maart – april 2026", t0:"2026-03-01", t1:"2026-04-30", yt:"rhwQRYKQXOY"},
  {id:"filippenzen", cat:"docu", name:"Filippenzen 3:13", label:"Workshop Docu:\nFilippenzen 3:13", sub:"BA2 Editing", date:"Oktober – november 2025", t0:"2025-10-01", t1:"2025-11-30", yt:"WrqVQPR2veo"},
  {id:"ten-anker", cat:"iao", name:"Ten Anker", label:"IAO: Ten Anker", sub:"BA1 Editing", date:"2024 – 2025", t0:"2024-09-16", t1:"2025-06-30", yt:"nZM5mqWff8g", cover:"assets/covers/ten-anker.jpg"},
  {id:"maxence", cat:"docu", name:"Film van Maxence", label:"Atelier Docu:\nFilm van Maxence Rubbens", sub:"BA1 Editing", date:"Mei – juni 2025", t0:"2025-05-01", t1:"2025-06-30", yt:"5RBhmR-tjOM", cover:"assets/covers/maxence.jpg"},
  {id:"nelson", cat:"docu", name:"Film van Nelson Van Herzele", label:"Atelier Docu:\nFilm van Nelson Van Herzele", sub:"BA1 Editing", date:"Mei – juni 2025", t0:"2025-05-01", t1:"2025-06-30", yt:"FM4PBAvugTw", cover:"assets/covers/nelson.jpg"},
  {id:"fictie-1", cat:"fictie", name:"Atelier Fictie 1", label:"Atelier Fictie:\nFilm van Jonathan Leyssens", sub:"BA1 Editing", date:"Maart – april 2025", t0:"2025-03-01", t1:"2025-04-30", yt:"8EF8p7EGLOc", cover:"assets/covers/fictie1.jpg"},
  {id:"de-koffer", cat:"fictie", name:"De Koffer", label:"Atelier Fictie: De Koffer", sub:"BA1 Editing", date:"December 2024", t0:"2024-12-01", t1:"2024-12-31", yt:"pkkMk5IcIpE", cover:"assets/covers/de-koffer.jpg"}
];

// "Uitgelicht": exactly three project ids. The first one starts in the middle,
// the second sits on the right, the third on the left.
window.FEATURED = ["ten-anker", "filippenzen", "dokfeesten-2026"];
