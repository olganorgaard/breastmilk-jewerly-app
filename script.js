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
const detailTitle = document.querySelector(".detail .title");
const detailSecondary = document.querySelector(".detail .secondary");
const detailDescription = document.querySelector(".detail .description");
const detailMetaLine = document.querySelector("#detailMetaLine");
const closeBtn = document.querySelector(".detail__close");
const orderBtn = document.querySelector(".detail__order");
const imagePrevBtn = document.querySelector(".detail__image-prev");
const imageNextBtn = document.querySelector(".detail__image-next");
const imageCount = document.querySelector(".detail__image-count");

let activeItem = null;
let activeVisibleIndex = -1;
let activeImages = [];
let activeImageIndex = 0;

const hasPopup = Boolean(details && detailContent && detailMainImage && detailTitle && detailSecondary && detailDescription && detailMetaLine);
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

function toSentenceCase(value) {
  const lower = value.trim().toLocaleLowerCase();
  return lower.replace(/\p{L}/u, (letter) => letter.toLocaleUpperCase());
}

function setActiveImage(index) {
  if (!activeImages.length) return;
  activeImageIndex = (index + activeImages.length) % activeImages.length;
  detailMainImage.src = activeImages[activeImageIndex];
  detailMainImage.alt = `${detailTitle.textContent}, image ${activeImageIndex + 1} of ${activeImages.length}`;
  imageCount.textContent = `${activeImageIndex + 1} / ${activeImages.length}`;
  const hasMultipleImages = activeImages.length > 1;
  imagePrevBtn.hidden = !hasMultipleImages;
  imageNextBtn.hidden = !hasMultipleImages;
  imageCount.hidden = !hasMultipleImages;
}

function updatePopupContent(item) {
  const data = item.dataset;

  detailTitle.innerText = toSentenceCase(data.title || "");
  detailSecondary.innerText = data.secondary || "";

  const price = data.price || "";
  const material = data.material || "";
  const weight = data.weight || "";
  const meta = [price, material, weight].filter(Boolean).join(" • ");
  detailMetaLine.textContent = meta;

  detailDescription.innerText = data.text || "";

  activeImages = getItemImages(item);
  if (!activeImages.length && item.querySelector("img")?.src) activeImages = [item.querySelector("img").src];
  setActiveImage(0);
}

function showDetails(item) {
  if (activeItem) return;

  const visible = getVisibleItems();
  activeVisibleIndex = visible.indexOf(item);
  const isMobilePopup = window.matchMedia("(max-width: 820px)").matches;
  updatePopupContent(item);
  activeItem = item;
  details.setAttribute("aria-hidden", "false");
  document.body.classList.add("popup-open");

  gsap.killTweensOf([details, detailContent]);
  gsap.set(detailContent, { yPercent: 0 });
  gsap.set(details, {
    clearProps: "width,height",
    xPercent: -50,
    top: isMobilePopup ? "calc(env(safe-area-inset-top, 0px) + 6px)" : "50%",
    yPercent: isMobilePopup ? 0 : -50,
    visibility: "visible",
    overflowX: "hidden",
    overflowY: "auto",
  });
  details.scrollTop = 0;
  gsap.fromTo(details, { autoAlpha: 0, scale: 0.96 }, {
    autoAlpha: 1,
    scale: 1,
    duration: 0.25,
    ease: "power2.out",
  });

  gsap.to(allItems, {
    opacity: 0.3,
    duration: 0.25,
  });

  gsap.to(".app", { backgroundColor: "#888", duration: 0.25 });
  setTimeout(() => document.addEventListener("click", hideDetails), 0);
}

function hideDetails() {
  if (!activeItem) return;

  document.removeEventListener("click", hideDetails);
  gsap.killTweensOf(details);
  gsap.to(details, {
    autoAlpha: 0,
    scale: 0.97,
    duration: 0.2,
    ease: "power2.in",
    onComplete: () => gsap.set(details, { visibility: "hidden" }),
  });
  gsap.to(allItems, { opacity: 1, duration: 0.25 });
  gsap.to(".app", { backgroundColor: "#feffef", duration: 0.25 });

  details?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("popup-open");
  activeItem = null;
  activeVisibleIndex = -1;
}

// Click listeners for popup
allItems.forEach((item) => item.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  showDetails(item);
}));

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

imagePrevBtn?.addEventListener("click", (e) => { e.stopPropagation(); setActiveImage(activeImageIndex - 1); });
imageNextBtn?.addEventListener("click", (e) => { e.stopPropagation(); setActiveImage(activeImageIndex + 1); });

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
