export function initLastWorksCarousel() {
  const carousels = document.querySelectorAll("[data-carousel]");
  if (!carousels.length) return;

  carousels.forEach((carousel) => {
    const track = carousel.querySelector("[data-carousel-track]");
    const prevButton = carousel.querySelector("[data-carousel-prev]");
    const nextButton = carousel.querySelector("[data-carousel-next]");
    const viewport = carousel.querySelector("[data-carousel-viewport]");
    if (!track || !viewport) return;

    let slides = Array.from(track.children);
    const originalCount = slides.length;
    let slidesToShow = window.innerWidth < 768 ? 1 : 2;
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

      const startClones = slides.map((s) => {
        const clone = s.cloneNode(true);
        clone.classList.add("is-clone");
        return clone;
      });
      const endClones = slides.map((s) => {
        const clone = s.cloneNode(true);
        clone.classList.add("is-clone");
        return clone;
      });

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

      if (!withTransition) {
        // Force reflow
        track.offsetHeight;
      }
    };

    const handleTransitionEnd = () => {
      isTransitioning = false;
      const totalItems = track.children.length;
      
      if (currentIndex >= totalItems - slidesToShow) {
        currentIndex = slidesToShow;
        update(false);
      } else if (currentIndex < slidesToShow) {
        currentIndex = totalItems - (slidesToShow * 2);
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
      slidesToShow = window.innerWidth < 768 ? 1 : 2;
      // Re-clone to match new slidesToShow if needed, 
      // but for simplicity we can just update layout
      update(false);
    });

    update(false);
    startAutoplay();
  });
}
