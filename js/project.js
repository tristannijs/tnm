// A film's own page: the bar, the menu and the one film-score player. (The rest of the site lives in main.js.)
(() => {
  const $ = s => document.querySelector(s);
  const menuBtn = $("#menuBtn"), drawer = $("#drawer");
  const setMenu = open => { drawer.hidden = !open; menuBtn.setAttribute("aria-expanded", open); };
  menuBtn.addEventListener("click", e => { e.stopPropagation(); setMenu(drawer.hidden); });
  document.addEventListener("click", e => { if(!drawer.hidden && !e.target.closest("#drawer")) setMenu(false); });

  // our own video files: no download, speed or picture-in-picture, no right-click save
  document.querySelectorAll("video").forEach(v => { v.disablePictureInPicture = true; v.addEventListener("contextmenu", e => e.preventDefault()); });

  const mm = s => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  document.querySelectorAll(".mu").forEach(c => {
    const au = new Audio(); au.preload = "none"; let loaded = false;
    const t = c.querySelector(".mu-t"), bar = c.querySelector(".mu-bar i");
    const load = () => { if(!loaded){ au.src = c.dataset.src; loaded = true; } };
    const state = () => { c.classList.toggle("cur", loaded); c.classList.toggle("on", !au.paused); };
    c.querySelector(".mu-play").addEventListener("click", () => { load(); au.paused ? au.play().catch(() => {}) : au.pause(); });
    c.querySelector(".mu-bar").addEventListener("click", e => {
      const r = e.currentTarget.getBoundingClientRect(), f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      load(); const go = () => { au.currentTime = f * (au.duration || +c.dataset.dur); };
      au.readyState ? go() : au.addEventListener("loadedmetadata", go, {once:true}); au.play().catch(() => {});
    });
    ["play", "pause", "ended"].forEach(ev => au.addEventListener(ev, state));
    au.addEventListener("timeupdate", () => { if(!au.duration) return; bar.style.width = (au.currentTime / au.duration * 100) + "%"; t.textContent = mm(au.currentTime) + " / " + mm(au.duration); });
    au.addEventListener("ended", () => { bar.style.width = "0%"; t.textContent = mm(au.duration); });
    // pause the music when a video starts
    document.querySelectorAll("video").forEach(v => v.addEventListener("play", () => au.pause()));
  });
})();
