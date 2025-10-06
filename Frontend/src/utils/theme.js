export function getStoredTheme() {
  return localStorage.getItem('theme') || 'light'
}
export function setStoredTheme(theme) {
  localStorage.setItem('theme', theme)
}
