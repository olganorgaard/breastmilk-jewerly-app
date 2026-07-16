// script.js

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.getElementById("site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("nav--open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!siteNav.contains(event.target) && !navToggle.contains(event.target)) {
      siteNav.classList.remove("nav--open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

// Animations (safe)
gsap.from(".nav", { delay: 1, duration: 2, y: 50, opacity: 0 });
gsap.from(".item_description", { delay: 1, duration: 2, y: -50, opacity: 0 });
gsap.from(".product", { delay: 0.4, duration: 2, y: -20, opacity: 0, stagger: 0.3 });

// Change text (safe)
gsap.registerPlugin(TextPlugin);
gsap.to(".main", {
  duration: 3,
  delay: 3,
  text: { type: "diff", value: "New collection for you!" },
});

// ---------------- POPUP (Flip) ----------------
const allItems = gsap.utils.toArray(".gallery__item"); // all cards
const details = document.querySelector(".detail");
const detailContent = document.querySelector(".detail .content");
const detailMainImage = document.querySelector(".detail__main-img");
const thumbsContainer = document.querySelector(".detail__thumbs");
const detailTitle = document.querySelector(".detail .title");
const detailSecondary = document.querySelector(".detail .secondary");
const detailDescription = document.querySelector(".detail .description");
const detailMetaLine = document.querySelector("#detailMetaLine");
const prevBtn = document.querySelector(".detail__prev");
const nextBtn = document.querySelector(".detail__next");
const closeBtn = document.querySelector(".detail__close");
const orderBtn = document.querySelector(".detail__order");

let activeItem = null;
let activeVisibleIndex = -1;

const hasPopup = Boolean(details && detailContent && detailMainImage && thumbsContainer && detailTitle && detailSecondary && detailDescription && detailMetaLine);
if (hasPopup) {
  gsap.set(detailContent, { yPercent: -100 });
}

// helper: which items are currently visible (not hidden by filter)
function getVisibleItems() {
  return allItems.filter((el) => !el.classList.contains("is-hidden"));
}

// helper: parse images list from dataset
function getItemImages(item) {
  const raw = (item.dataset.images || "").trim();
  if (!raw) {
    const src = item.querySelector("img")?.getAttribute("src");
    return src ? [src] : [];
  }
  return raw.split("|").map(s => s.trim()).filter(Boolean);
}

function buildThumbs(images, activeSrc) {
  thumbsContainer.innerHTML = "";
  if (images.length <= 1) return;

  images.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";

    img.className = "detail__thumb" + (src === activeSrc ? " is-active" : "");
    img.addEventListener("click", (e) => {
      e.stopPropagation();
      setMainImage(src);
      thumbsContainer.querySelectorAll(".detail__thumb").forEach(t => t.classList.remove("is-active"));
      img.classList.add("is-active");
    });
    thumbsContainer.appendChild(img);
  });
}

function setMainImage(src) {
  detailMainImage.src = src;
}

function updatePopupContent(item) {
  const data = item.dataset;

  detailTitle.innerText = data.title || "";
  detailSecondary.innerText = data.secondary || "";

  const price = data.price || "";
  const material = data.material || "";
  const weight = data.weight || "";
  const meta = [price, material, weight].filter(Boolean).join(" • ");
  detailMetaLine.textContent = meta;

  detailDescription.innerText = data.text || "";

  const images = getItemImages(item);
  const first = images[0] || item.querySelector("img")?.src || "";
  setMainImage(first);
  buildThumbs(images, first);
}

function showDetails(item) {
  if (activeItem) return hideDetails();

  const visible = getVisibleItems();
  activeVisibleIndex = visible.indexOf(item);

  const onLoad = () => {
    Flip.fit(details, item, { scale: true, fitChild: detailMainImage });

    const state = Flip.getState(details);

    gsap.set(details, { clearProps: true });
    gsap.set(details, {
      xPercent: -50,
      top: "50%",
      yPercent: -50,
      visibility: "visible",
      overflow: "hidden",
    });

    Flip.from(state, {
      duration: 0.5,
      ease: "power2.inOut",
      scale: true,
      onComplete: () => gsap.set(details, { overflow: "auto" }),
    }).to(detailContent, { yPercent: 0 }, 0.2);

    detailMainImage.removeEventListener("load", onLoad);
    document.addEventListener("click", hideDetails);
  };

  updatePopupContent(item);
  detailMainImage.addEventListener("load", onLoad);

  gsap.to(allItems, {
    opacity: 0.3,
    stagger: { amount: 0.7, from: allItems.indexOf(item), grid: "auto" },
  }).kill(item);

  gsap.to(".app", { backgroundColor: "#888", duration: 1, delay: 0.3 });

  details?.setAttribute("aria-hidden", "false");
  activeItem = item;
}

function hideDetails() {
  if (!activeItem) return;

  document.removeEventListener("click", hideDetails);
  gsap.set(details, { overflow: "hidden" });

  const state = Flip.getState(details);

  Flip.fit(details, activeItem, { scale: true, fitChild: detailMainImage });

  const tl = gsap.timeline();
  tl.set(details, { overflow: "hidden" })
    .to(detailContent, { yPercent: -100 })
    .to(allItems, {
      opacity: 1,
      stagger: { amount: 0.7, from: allItems.indexOf(activeItem), grid: "auto" },
    })
    .to(".app", { backgroundColor: "#feffef" }, "<");

  Flip.from(state, {
    scale: true,
    duration: 0.5,
    delay: 0.2,
    onInterrupt: () => tl.kill(),
  }).set(details, { visibility: "hidden" });

  details?.setAttribute("aria-hidden", "true");
  activeItem = null;
  activeVisibleIndex = -1;
}

// Click listeners for popup
allItems.forEach((item) => item.addEventListener("click", () => showDetails(item)));

// prevent closing when clicking inside popup
details?.addEventListener("click", (e) => {
  e.stopPropagation();
});

// Close by X
closeBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  hideDetails();
});

// Close by ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideDetails();
});

// Next/Prev within visible items
function goToRelative(delta) {
  const visible = getVisibleItems();
  if (!activeItem || visible.length === 0) return;

  let idx = activeVisibleIndex;
  if (idx === -1) idx = visible.indexOf(activeItem);
  if (idx === -1) return;

  idx = (idx + delta + visible.length) % visible.length;
  activeVisibleIndex = idx;

  const nextItem = visible[idx];
  activeItem = nextItem;
  updatePopupContent(nextItem);
}

prevBtn?.addEventListener("click", (e) => { e.stopPropagation(); goToRelative(-1); });
nextBtn?.addEventListener("click", (e) => { e.stopPropagation(); goToRelative(1); });

// Order button: close popup + scroll down
orderBtn?.addEventListener("click", (e) => {
  e.stopPropagation();

  const href = orderBtn.getAttribute("href") || "#contact_us";
  if (href.startsWith("#")) {
    e.preventDefault();
    hideDetails();

    setTimeout(() => {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", href);
      }
    }, 250);
  } else {
    hideDetails();
  }
});

// Intro animation
window.addEventListener("load", () => {
  gsap.to(".app", { autoAlpha: 1, duration: 0.2 });
  gsap.from(".gallery__item", { autoAlpha: 0, duration: 0.35, stagger: 0.04 }); 
});


// ---------------- FILTERS ----------------
const filterButtons = document.querySelectorAll(".filter-btn");

function setActiveFilterButton(activeBtn) {
  filterButtons.forEach((btn) => btn.classList.remove("filter-btn--active"));
  activeBtn.classList.add("filter-btn--active");
}

function applyFilter(filterValue) {
  if (activeItem) hideDetails();

  allItems.forEach((card) => {
    const category = (card.dataset.category || "").toLowerCase();
    const shouldShow = filterValue === "all" || category === filterValue;
    card.classList.toggle("is-hidden", !shouldShow);
  });
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const filterValue = btn.dataset.filter;
    setActiveFilterButton(btn);
    applyFilter(filterValue);
  });
});

// ---------------- FAQ (FIX) ----------------
const faqButtons = document.querySelectorAll(".faq__question");

faqButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq__item");
    const answer = item?.querySelector(".faq__answer");
    if (!item || !answer) return;

    const isOpen = item.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(isOpen));
    answer.hidden = !isOpen;
  });
});
