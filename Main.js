gsap.registerPlugin(ScrollTrigger);

window.addEventListener("load", () => {
  const section = document.querySelector(".hero-section");
  const wrap = document.querySelector(".hero-title-content");
  const title1 = document.querySelector(".hero-title:not(.hero-title-2)");
  const title2 = document.querySelector(".hero-title-2");
  const description1 = document.querySelector(".hero-description:not(.hero-description-2)");
  const description2 = document.querySelector(".hero-description-2"); 
  const heroImgContent = document.querySelector(".hero-img-content");
  const heroContentItems = document.querySelector(".hero-content-items");
  const heroOverlays = document.querySelector(".hero-overlays");

  // Safety break check
  if (!section || !wrap || !title1 || !title2 || !description1 || !heroImgContent) {
    return;
  }

  // --- IMAGE WIDTH LOGGER ---
  // Gathers image elements and outputs data to console prior to GSAP layout transforms.
  const heroImages = heroImgContent.querySelectorAll(".hero-img");
  console.log("%c--- HERO IMAGES WIDTH REPORT ---", "color: #00dafd; font-weight: bold;");
  heroImages.forEach((img, index) => {
    const srcName = img.getAttribute("src") || `Image ${index + 1}`;
    const layoutWidth = img.getBoundingClientRect().width;
    console.log(
      `Image ${index + 1} (${srcName}):\n` +
      `  -> Natural Asset Width = ${img.naturalWidth}px\n` +
      `  -> Current Rendered Width = ${layoutWidth}px`
    );
  });
  console.log("%c--------------------------------", "color: #00dafd; font-weight: bold;");


  function splitTitle(el) {
    const text = el.textContent.trim();
    const parts = text.split(/(\s+)/);
    let firstLetterIndex = 0;
    const meraLetters = ["M", "e", "R", "A"];

    el.innerHTML = "";

    parts.forEach((part) => {
      if (/^\s+$/.test(part)) {
        const space = document.createElement("span");
        space.className = "space";
        space.innerHTML = "&nbsp;";
        el.appendChild(space);
        return;
      }

      const word = document.createElement("span");
      word.className = "word";

      Array.from(part).forEach((letter, index) => {
        const span = document.createElement("span");
        span.className = "char";

        if (index === 0) {
          span.classList.add("first-letter");
          span.dataset.acronym = meraLetters[firstLetterIndex] || letter;
          firstLetterIndex++;
        }

        span.textContent = letter;
        word.appendChild(span);
      });

      el.appendChild(word);
    });
  }

  splitTitle(title1);

  const firstLetters = gsap.utils.toArray(".first-letter", title1);

  const cloneWrap = document.createElement("div");
  cloneWrap.className = "mera-clone-wrap";
  wrap.appendChild(cloneWrap);

  function buildMeraClones() {
    cloneWrap.innerHTML = "";

    const wrapRect = wrap.getBoundingClientRect();
    const titleStyle = window.getComputedStyle(title1);

    firstLetters.forEach((letter) => {
      const rect = letter.getBoundingClientRect();

      const clone = document.createElement("span");
      clone.className = "mera-clone";
      clone.textContent = letter.dataset.acronym;

      cloneWrap.appendChild(clone);

      gsap.set(clone, {
        position: "absolute",
        display: "inline-block",
        opacity: 0,
        whiteSpace: "nowrap",
        left: rect.left - wrapRect.left,
        top: rect.top - wrapRect.top,
        color: "#00dafd",
        fontSize: titleStyle.fontSize,
        fontFamily: titleStyle.fontFamily,
        fontWeight: titleStyle.fontWeight,
        lineHeight: titleStyle.lineHeight,
        letterSpacing: titleStyle.letterSpacing,
      });
    });

    const clones = gsap.utils.toArray(".mera-clone");
    const gap = 4;

    if (!clones.length) return clones;

    const totalWidth =
      clones.reduce((sum, clone) => sum + clone.offsetWidth, 0) +
      gap * (clones.length - 1);

    let x = wrapRect.width / 2 - totalWidth / 2;
    const y = wrapRect.height / 2 - clones[0].offsetHeight / 2;

    clones.forEach((clone) => {
      clone.dataset.targetLeft = x;
      clone.dataset.targetTop = y;
      x += clone.offsetWidth + gap;
    });

    return clones;
  }

  function getLettersByColumn() {
    const words = gsap.utils.toArray(".word", title1);
    const columns = [];

    words.forEach((word) => {
      const letters = gsap.utils
        .toArray(".char:not(.first-letter)", word)
        .reverse();

      letters.forEach((letter, index) => {
        if (!columns[index]) columns[index] = [];
        columns[index].push(letter);
      });
    });

    return columns;
  }

  let meraClones = buildMeraClones();
  const lettersByColumn = getLettersByColumn();

  // Initialization States
  gsap.set(title1, { opacity: 0, y: 0 }); 
  gsap.set(title2, { opacity: 0, y: 150 });     
  gsap.set(description1, { opacity: 0, y: 0 }); 
  if (description2) gsap.set(description2, { opacity: 0, xPercent: -50, y: 50 }); 
  if (heroContentItems) gsap.set(heroContentItems, { opacity: 0 });
  if (heroOverlays) gsap.set(heroOverlays, { opacity: 0 });

  gsap.set(heroImgContent, {
    opacity: 0,
    yPercent: 70,
    scale: 0.5,
    transformOrigin: "center center",
  });

  // Master Scroll Timeline Setup
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=1800", 
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });

  const stepDuration = 0.035; 
  const totalColumns = lettersByColumn.length;
  const titleFadeDuration = 0.3; 

  // STEP 1: Smoothly fade in .hero-title (opacity 0 to 1)
  tl.to(title1, {
    opacity: 1,
    duration: titleFadeDuration,
    ease: "power1.out"
  }, 0);

  // STEP 2: Start word-hide animation (column by column)
  lettersByColumn.forEach((letters, index) => {
    tl.to(letters, {
      opacity: 0,
      duration: stepDuration,
      ease: "none",
      delay: index * stepDuration, 
    }, titleFadeDuration); 
  });

  // Highlight remaining standalone acronym letters
  tl.to(firstLetters, {
    color: "#00dafd",
    duration: 0.2,
    ease: "none",
  }, titleFadeDuration + (totalColumns * stepDuration) + 0.1);

  tl.set(meraClones, { opacity: 1 });
  tl.set(firstLetters, { opacity: 0 });

  // Slide clones to center alignment
  tl.to(meraClones, {
    left: (i, el) => Number(el.dataset.targetLeft),
    top: (i, el) => Number(el.dataset.targetTop),
    duration: 0.5,
    ease: "power2.inOut",
  });

  // STEP 3: Show hero-img-content
  tl.to(heroImgContent, {
    opacity: 1,
    yPercent: 0,
    scale: 1,
    duration: 0.65,
    ease: "power2.inOut",
  });

  // STEP 4: Show descriptions
  tl.to(description1, {
    opacity: 1,
    duration: 0.4,
    ease: "power1.out",
  });

  if (description2) {
    tl.to(description2, {
      opacity: 1,
      duration: 0.4,
      ease: "power1.out",
    }, "<"); 
  }

  const finalMoveDuration = 0.55;

  // STEP 5: Transform layout elements positions (Vertical structural shifting)
  tl.to(description1, {
    y: -40, 
    duration: finalMoveDuration,
    ease: "power2.inOut",
  });

  if (description2) {
    tl.to(description2, {
      y: 0,
      duration: finalMoveDuration,
      ease: "power2.inOut",
    }, "<");
  }

  tl.to([title1, cloneWrap], {
    y: -70, 
    duration: finalMoveDuration,
    ease: "power2.inOut",
  }, "<");

  tl.to(title2, {
    opacity: 1,
    y: 0, 
    duration: finalMoveDuration,
    ease: "power2.inOut",
  }, "<");

  // STEP 6: Reveal auxiliary content pieces
  if (heroContentItems) {
    tl.to(heroContentItems, {
      opacity: 1,
      duration: 0.4,
      ease: "power1.out"
    }, "<");
  }

  // STEP 7: Fade in overlays (opacity 0 to 1) 
  if (heroOverlays) {
    tl.to(heroOverlays, {
      opacity: 1,
      duration: 0.5,
      ease: "power1.inOut"
    }, "-=0.2");
  }

  window.addEventListener("resize", () => {
    meraClones = buildMeraClones();
    ScrollTrigger.refresh();
  });
});