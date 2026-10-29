(() => {
  "use strict";

  const article = document.getElementById("story-body");
  const toc = document.getElementById("toc");
  const sidebar = document.getElementById("toc-sidebar");
  const menuToggle = document.getElementById("toc-toggle");
  const progress = document.getElementById("reading-progress");
  const backToTop = document.getElementById("back-to-top");
  const headings = Array.from(article.querySelectorAll("h2, h3"));

  // Keep Jekyll's generated heading IDs so copied links work without JavaScript.
  const list = document.createElement("ol");
  list.className = "toc-list";
  headings.forEach((heading, index) => {
    if (!heading.id) heading.id = "section-" + (index + 1);
    const item = document.createElement("li");
    item.className = heading.tagName === "H3" ? "toc-subsection" : "toc-section";
    const link = document.createElement("a");
    link.href = "#" + encodeURIComponent(heading.id);
    link.textContent = heading.textContent.trim();
    link.dataset.headingId = heading.id;
    item.appendChild(link);
    list.appendChild(item);
  });
  toc.appendChild(list);
  const links = Array.from(toc.querySelectorAll("a"));

  function setMenuOpen(open) {
    sidebar.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  }
  menuToggle.addEventListener("click", () => {
    setMenuOpen(!sidebar.classList.contains("is-open"));
  });
  toc.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenuOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
  });
  document.addEventListener("click", (event) => {
    if (sidebar.classList.contains("is-open") &&
        !sidebar.contains(event.target) &&
        !menuToggle.contains(event.target)) setMenuOpen(false);
  });

  let scheduled = false;
  function updateReadingState() {
    scheduled = false;
    const top = article.getBoundingClientRect().top + window.scrollY;
    const bottom = top + article.offsetHeight;
    const distance = Math.max(1, bottom - top - window.innerHeight);
    const value = Math.max(0, Math.min(100, Math.round(((window.scrollY - top) / distance) * 100)));
    progress.style.width = value + "%";
    progress.setAttribute("aria-valuenow", String(value));
    backToTop.classList.toggle("is-visible", window.scrollY > 600);

    let activeIndex = 0;
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].getBoundingClientRect().top <= 135) activeIndex = i;
      else break;
    }
    links.forEach((link, i) => {
      const active = i === activeIndex;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  function scheduleUpdate() {
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(updateReadingState);
    }
  }
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("load", scheduleUpdate);
  updateReadingState();
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  const lightbox = document.getElementById("image-lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose = document.getElementById("lightbox-close");
  const images = Array.from(article.querySelectorAll("img"));

  function openImage(image) {
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || "文章配图";
    lightboxCaption.textContent = image.alt || "";
    lightbox.showModal();
    lightboxClose.focus();
  }
  images.forEach((image) => {
    image.classList.add("zoomable");
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", "放大图片：" + (image.alt || "文章配图"));
    image.addEventListener("click", () => openImage(image));
    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openImage(image);
      }
    });
  });
  function closeImage() {
    lightbox.close();
  }
  lightboxClose.addEventListener("click", closeImage);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeImage();
  });
  lightbox.addEventListener("close", () => {
    lightboxImage.removeAttribute("src");
  });
})();
