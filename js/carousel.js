/**
 * Universal Carousel Module
 * 
 * Features:
 * - Infinite loop (clones slides)
 * - Responsive (adjusts slides count based on viewport)
 * - Touch/Mouse drag support
 * - Autoplay with pause on hover
 * - Configurable via data attributes
 * 
 * Usage:
 * Add `data-carousel` to container element with optional:
 * - data-autoplay="true|false"
 * - data-autoplay-speed="4000" (ms)
 * - data-slides-mobile="1" (number of slides on mobile, default: 1)
 * - data-slides-desktop="2" (number of slides on desktop, default: 2)
 * 
 * Required child elements:
 * - [data-carousel-track] - slides container
 * - [data-carousel-viewport] - visible area
 * - [data-carousel-prev] - previous button (optional)
 * - [data-carousel-next] - next button (optional)
 * - [data-carousel-dot] - dot button (optional)
 */

export function initCarousel() {
  const carousels = document.querySelectorAll("[data-carousel]");
  if (!carousels.length) return;

  carousels.forEach((carousel) => {
    const track = carousel.querySelector("[data-carousel-track]");
    const prevButton = carousel.querySelector("[data-carousel-prev]");
    const nextButton = carousel.querySelector("[data-carousel-next]");
    const viewport = carousel.querySelector("[data-carousel-viewport]");
    const dotsContainer = carousel.querySelector("[data-carousel-dots]");
    if (!track || !viewport) return;

    let slides = Array.from(track.children);
    const originalCount = slides.length;
    
    // Read slides count configuration from data attributes
    const slidesMobile = Number(carousel.getAttribute("data-slides-mobile")) || 1;
    const slidesDesktop = Number(carousel.getAttribute("data-slides-desktop")) || 2;
    
    let slidesToShow = window.innerWidth < 768 ? slidesMobile : slidesDesktop;
    let currentIndex = slidesToShow; // Start after prepended clones
    let isTransitioning = false;
    let autoplayTimer = null;

    // Drag/Swipe state
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;

    // Clone slides for infinite loop
    const cloneSlides = () => {
      // Clear existing clones if any (e.g., on re-init)
      const existingClones = track.querySelectorAll(".is-clone");
      existingClones.forEach((clone) => clone.remove());

      // Prepend last items and append first items
      slides.slice(-slidesToShow).reverse().forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add("is-clone");
        track.prepend(clone);
      });

      slides.slice(0, slidesToShow).forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add("is-clone");
        track.append(clone);
      });
    };

    cloneSlides();

    const getSlideWidth = () => {
      const viewportWidth = viewport.getBoundingClientRect().width;
      const gapValue = parseFloat(getComputedStyle(track).gap) || 0;
      return (viewportWidth - gapValue * (slidesToShow - 1)) / slidesToShow;
    };

    const update = (withTransition = true) => {
      const slideWidth = getSlideWidth();
      const gapValue = parseFloat(getComputedStyle(track).gap) || 0;
      const allItems = Array.from(track.children);

      allItems.forEach((slide) => {
        slide.style.width = `${slideWidth}px`;
      });

      if (!withTransition) {
        track.style.transition = "none";
      } else {
        track.style.transition = "transform 0.5s ease";
      }

      const offset = currentIndex * (slideWidth + gapValue);
      track.style.transform = `translateX(-${offset}px)`;
      prevTranslate = -offset;

      // Update dots
      updateDots();

      if (!withTransition) {
        // Force reflow
        track.offsetHeight;
      }
    };

    const handleTransitionEnd = () => {
      isTransitioning = false;
      const totalItems = track.children.length;
      
      // Jump forward: when we reach the cloned slides at the end
      if (currentIndex >= totalItems - slidesToShow) {
        currentIndex = slidesToShow;
        update(false);
      } 
      // Jump backward: when we reach the cloned slides at the beginning
      else if (currentIndex < slidesToShow) {
        currentIndex = currentIndex + originalCount;
        update(false);
      }
    };

    track.addEventListener("transitionend", handleTransitionEnd);

    const move = (direction) => {
      if (isTransitioning) return;
      isTransitioning = true;
      
      if (direction === "next") {
        currentIndex++;
      } else {
        currentIndex--;
      }
      update();
    };

    // Control buttons
    if (prevButton) {
      prevButton.addEventListener("click", () => {
        stopAutoplay();
        move("prev");
        startAutoplay();
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        stopAutoplay();
        move("next");
        startAutoplay();
      });
    }

    // Drag and Swipe logic
    const onStart = (e) => {
      if (isTransitioning) return;
      isDragging = true;
      startX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
      viewport.style.cursor = "grabbing";
      stopAutoplay();
      track.style.transition = "none";
    };

    const onMove = (e) => {
      if (!isDragging) return;
      const currentX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
      const diff = currentX - startX;
      currentTranslate = prevTranslate + diff;
      track.style.transform = `translateX(${currentTranslate}px)`;
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      viewport.style.cursor = "grab";
      
      const movedBy = currentTranslate - prevTranslate;
      const slideWidth = getSlideWidth() + (parseFloat(getComputedStyle(track).gap) || 0);

      if (movedBy < -100) {
        currentIndex++;
      } else if (movedBy > 100) {
        currentIndex--;
      }

      isTransitioning = true;
      update();
      startAutoplay();
    };

    viewport.addEventListener("mousedown", onStart);
    viewport.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);

    viewport.addEventListener("touchstart", onStart);
    viewport.addEventListener("touchmove", onMove);
    viewport.addEventListener("touchend", onEnd);

    // Prevent context menu and dragging images
    viewport.addEventListener("dragstart", (e) => e.preventDefault());

    // Dots navigation
    const updateDots = () => {
      if (!dotsContainer) return;
      const dots = dotsContainer.querySelectorAll("[data-carousel-dot]");
      const activeSlide = (currentIndex - slidesToShow) % originalCount;
      
      dots.forEach((dot, index) => {
        if (index === activeSlide) {
          dot.classList.add(dot.className.split(' ')[0] + '--active');
        } else {
          dot.classList.remove(dot.className.split(' ')[0] + '--active');
        }
      });
    };

    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll("[data-carousel-dot]");
      dots.forEach((dot) => {
        dot.addEventListener("click", () => {
          const targetIndex = Number(dot.getAttribute("data-carousel-dot"));
          stopAutoplay();
          currentIndex = targetIndex + slidesToShow;
          isTransitioning = true;
          update();
          startAutoplay();
        });
      });
    }

    // Autoplay
    const autoplay = carousel.getAttribute("data-autoplay") === "true";
    const autoplaySpeed = Number(carousel.getAttribute("data-autoplay-speed")) || 4000;

    const stopAutoplay = () => {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    };

    const startAutoplay = () => {
      if (!autoplay || autoplayTimer || isDragging) return;
      autoplayTimer = setInterval(() => move("next"), autoplaySpeed);
    };

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);

    window.addEventListener("resize", () => {
      slidesToShow = window.innerWidth < 768 ? slidesMobile : slidesDesktop;
      // Re-clone to match new slidesToShow if needed, 
      // but for simplicity we can just update layout
      update(false);
    });

    update(false);
    startAutoplay();
  });
}
