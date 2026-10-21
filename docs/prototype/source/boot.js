/* ================= Boot ================= */
(function boot() {
  applyTheme();
  const id = decodeURIComponent(location.hash.slice(1));
  S.route = SCREENS[id] ? id : 'home';
  render();
})();
