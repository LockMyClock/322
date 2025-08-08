document.addEventListener("DOMContentLoaded", () => {
  console.log("[activation] script loaded");
  const form = document.getElementById("act-form");
  const input = document.getElementById("key");
  const btn = document.getElementById("act-btn");
  const err = document.getElementById("act-error");
  const logout = document.getElementById("logout");

  logout.addEventListener("click", async () => {
    await window.api.auth.logout();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // не перезагружаем страницу
    err.style.display = "none";

    const key = String(input.value || "").trim();
    if (!key) {
      err.textContent = "Введите ключ";
      err.style.display = "block";
      input.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = "Проверяем...";

    try {
      const r = await window.api.license.activate(key);
      if (r?.ok) return; // main откроет меню
      err.textContent = r?.error || "Ключ не принят";
      err.style.display = "block";
    } catch (e2) {
      console.error(e2);
      err.textContent = e2?.data?.error || "Ошибка активации";
      err.style.display = "block";
    } finally {
      btn.disabled = false;
      btn.textContent = "Активировать";
    }
  });
});