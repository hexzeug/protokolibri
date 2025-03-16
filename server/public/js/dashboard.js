const colorThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
const updateColorTheme = () =>
  document.documentElement.setAttribute(
    'data-bs-theme',
    colorThemeMediaQuery.matches ? 'dark' : 'light'
  );
colorThemeMediaQuery.addEventListener('change', updateColorTheme);
updateColorTheme();
