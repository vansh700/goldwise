/**
 * animations.js — GoldWise Scroll & Interaction Animations
 * Uses IntersectionObserver for scroll-reveal. No external libraries needed.
 */

/* ─── Scroll Reveal ─────────────────────────────────────────────────────── */
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.animateDelay || 0;
          setTimeout(() => {
            el.classList.add("animate-in");
          }, delay);
          observer.unobserve(el); // animate only once
        }
      });
    },
    { threshold: 0.12 }
  );

  // Attach to all elements with data-animate
  document.querySelectorAll("[data-animate]").forEach((el) => {
    const type = el.dataset.animate || "fade-up";
    el.classList.add("animate-ready", `animate-${type}`);
    observer.observe(el);
  });

  // Stagger children of data-animate-group containers
  document.querySelectorAll("[data-animate-group]").forEach((group) => {
    const children = group.children;
    Array.from(children).forEach((child, i) => {
      child.dataset.animate = child.dataset.animate || "fade-up";
      child.dataset.animateDelay = i * 100;
      child.classList.add("animate-ready", `animate-${child.dataset.animate}`);
      observer.observe(child);
    });
  });
}

/* ─── Sticky Navbar Shrink ───────────────────────────────────────────────── */
function initStickyHeader() {
  const header = document.querySelector(".header");
  if (!header) return;

  let lastScroll = 0;
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    if (scrollY > 60) {
      header.classList.add("header-shrunk");
    } else {
      header.classList.remove("header-shrunk");
    }
    // Hide on scroll down, show on scroll up
    if (scrollY > lastScroll + 5) {
      header.classList.add("header-hidden");
    } else if (scrollY < lastScroll - 5) {
      header.classList.remove("header-hidden");
    }
    lastScroll = scrollY;
  }, { passive: true });
}

/* ─── Card Ripple / Hover Glow ──────────────────────────────────────────── */
function initCardEffects() {
  document.querySelectorAll(".card, .category, .category-card").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.classList.add("card-hovered");
    });
    card.addEventListener("mouseleave", () => {
      card.classList.remove("card-hovered");
    });

    // Ripple on click
    card.addEventListener("click", function (e) {
      const ripple = document.createElement("span");
      ripple.classList.add("ripple");
      const rect = this.getBoundingClientRect();
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });
}

/* ─── Page Entrance (fade in body) ─────────────────────────────────────── */
function initPageEntrance() {
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.4s ease";
  window.addEventListener("load", () => {
    document.body.style.opacity = "1";
  });
}

/* ─── Smooth counter for numbers (e.g., gold rate) ─────────────────────── */
function animateCounter(el, target, duration = 1500) {
  const start = 0;
  const step = (timestamp) => {
    if (!el._startTime) el._startTime = timestamp;
    const progress = Math.min((timestamp - el._startTime) / duration, 1);
    el.textContent = Math.floor(progress * target).toLocaleString("en-IN");
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initCounters() {
  document.querySelectorAll("[data-counter]").forEach((el) => {
    const target = parseInt(el.dataset.counter, 10);
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(el, target);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    obs.observe(el);
  });
}

/* ─── Typewriter effect ──────────────────────────────────────────────────── */
function initTypewriter() {
  document.querySelectorAll("[data-typewriter]").forEach((el) => {
    const text = el.dataset.typewriter || el.textContent;
    el.textContent = "";
    el.setAttribute("aria-label", text);
    let i = 0;
    const type = () => {
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(type, 60);
      }
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { type(); obs.unobserve(el); }
      });
    }, { threshold: 0.5 });
    obs.observe(el);
  });
}

/* ─── Boot ───────────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initPageEntrance();
  initScrollReveal();
  initStickyHeader();
  initCardEffects();
  initCounters();
  initTypewriter();
});
