// 手機版漢堡選單：點按鈕展開／收合，點選連結或選單外面就收合
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  const toggle = document.querySelector(".nav-toggle");

  function setOpen(open) {
    header.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "關閉選單" : "開啟選單");
  }

  toggle.addEventListener("click", () =>
    setOpen(!header.classList.contains("nav-open"))
  );

  document
    .querySelectorAll("#site-nav a")
    .forEach((link) => link.addEventListener("click", () => setOpen(false)));

  document.addEventListener("click", (e) => {
    if (!header.contains(e.target)) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
});
