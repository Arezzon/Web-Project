// Get DOM elements
const burger = document.querySelector(".header__burger");
const nav = document.querySelector(".header__nav");
const menuLinks = document.querySelectorAll(".nav__link");

// Toggle menu function
function toggleMenu() {
  burger.classList.toggle("is-active");
  nav.classList.toggle("is-open");
  document.body.classList.toggle("no-scroll");
}

// Close menu function
function closeMenu() {
  burger.classList.remove("is-active");
  nav.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
}

// Add click event listener to burger button
burger.addEventListener("click", toggleMenu);

// Add click event listeners to all menu links
menuLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

// Close menu on window resize to desktop width
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    closeMenu();
  }
});