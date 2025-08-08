document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logout").addEventListener("click", async () => {
    await window.api.auth.logout();
  });
});