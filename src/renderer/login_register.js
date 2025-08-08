const $ = (s) => document.querySelector(s);

document.addEventListener("DOMContentLoaded", () => {
  // Тоггл пароля
  $("#toggle-eye").addEventListener("click", () => {
    const p = $("#password"); p.type = p.type === "password" ? "text" : "password";
  });

  // Вход
  const formLogin = $("#login-form");
  const loginBtn = $("#login-btn");
  const loginErr = $("#login-error");
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginErr.style.display = "none";
    const identifier = $("#identifier").value.trim();
    const password = $("#password").value;
    const remember = $("#remember").checked;

    if (!identifier || !password) {
      loginErr.textContent = "Введите логин/почту и пароль";
      loginErr.style.display = "block";
      return;
    }

    loginBtn.disabled = true; loginBtn.textContent = "Проверяем...";
    try {
      await window.api.auth.login({ identifier, password, remember });
      // дальше main откроет экран выбора роли
    } catch (err) {
      loginErr.textContent = err?.data?.error || "Ошибка входа";
      loginErr.style.display = "block";
    } finally {
      loginBtn.disabled = false; loginBtn.textContent = "Войти";
    }
  });
});