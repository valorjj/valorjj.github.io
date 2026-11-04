// Applies the saved theme before the first paint, so a dark page never flashes white. A file, not an inline script:
// the CSP allows same-origin scripts only. Mirrors src/lib/theme.ts (key, values, dark unless `light` is saved).
;(function () {
  var theme = 'dark'
  try {
    if (JSON.parse(localStorage.getItem('llm-serving.theme.v1')) === 'light') theme = 'light'
  } catch {
    // storage unavailable: dark
  }
  document.documentElement.dataset.theme = theme
})()
