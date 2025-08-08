const $ = (sel) => document.querySelector(sel);
let STR = {};

document.addEventListener("DOMContentLoaded", async () => {
  const form = $("#login-form");
  const btn = $("#submit-btn");
  const err = $("#error");
  const eye = $("#toggle-eye");
  const pass = $("#password");
  const user = $("#username");
  const remember = $("#remember");

  // локализация для динамических текстов
  const prefs = await window.api.settings.get();
  STR = await window.api.i18n.get(prefs.lang || "ru");

  // Тоггл пароля
  eye.addEventListener("click", () => {
    pass.type = pass.type === "password" ? "text" : "password";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.style.display = "none";
    btn.disabled = true;
    btn.textContent = STR.checking || "Проверяем...";

    const role = document.querySelector('input[name="role"]:checked').value;
    const res = await window.api.login(user.value.trim(), pass.value, role, remember.checked);

    if (res?.ok) {
      // Главное окно откроет нужную страницу, текущее закроется в main
      return;
    } else {
      err.textContent = res?.message || STR.invalid || "Неверный логин/пароль/роль";
      err.style.display = "block";
      btn.disabled = false;
      btn.textContent = STR.login || "Войти";
    }
  });
});