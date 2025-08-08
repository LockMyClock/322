document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("role-form");
  const code = document.getElementById("code");
  const err = document.getElementById("role-error");
  const btn = document.getElementById("go-btn");
  const logout = document.getElementById("logout");

  logout.addEventListener("click", async () => { await window.api.auth.logout(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.style.display = "none";
    const role = document.querySelector('input[name="role"]:checked').value;
    const value = String(code.value || "").trim();
    if (!value) {
      err.textContent = "Введите код доступа";
      err.style.display = "block";
      code.focus();
      return;
    }
    btn.disabled = true; btn.textContent = "Проверяем...";
    try {
      const res = await window.api.role.check(role, value);
      if (!res?.ok) {
        err.textContent = res?.error || "Код не принят";
        err.style.display = "block";
      }
      // при успехе окно переключит main на нужную страницу
    } catch (e2) {
      err.textContent = "Ошибка. Попробуйте ещё раз.";
      err.style.display = "block";
    } finally {
      btn.disabled = false; btn.textContent = "Продолжить";
    }
  });
});