(function () {
  let currentStrings = {};
  const $ = (s) => document.querySelector(s);

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function applyStrings(strings) {
    currentStrings = strings;
    document.querySelectorAll("[data-i18n-key]").forEach(el => {
      const key = el.getAttribute("data-i18n-key");
      if (strings[key]) el.textContent = strings[key];
    });
  }

  async function reloadLang(lang) {
    const strings = await window.api.i18n.get(lang);
    applyStrings(strings);
  }

  async function init() {
    const prefs = await window.api.settings.get();
    window.appPrefs = prefs;

    applyTheme(prefs.theme || "dark");

    // заполнение селектора языка (если есть)
    const langSel = $("#lang");
    if (langSel) {
      langSel.innerHTML = `
        <option value="ru">Русский</option>
        <option value="en">English</option>
      `;
      langSel.value = prefs.lang || "ru";
      langSel.addEventListener("change", async () => {
        const next = langSel.value;
        await window.api.settings.set({ lang: next });
        window.appPrefs.lang = next;
        await reloadLang(next);
      });
    }

    // переключатель темы (если есть)
    const themeBtn = $("#theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", async () => {
        const next = (window.appPrefs.theme === "dark") ? "light" : "dark";
        await window.api.settings.set({ theme: next });
        window.appPrefs.theme = next;
        applyTheme(next);
      });
    }

    await reloadLang(prefs.lang || "ru");
  }

  document.addEventListener("DOMContentLoaded", init);
})();