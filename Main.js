gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 0.8,
  touchMultiplier: 2.0,
});

lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

window.addEventListener("load", () => {
  const section = document.querySelector(".hero-section");
  const wrap = document.querySelector(".hero-title-content");
  const title1 = document.querySelector(".hero-title:not(.hero-title-2)");
  const title2 = document.querySelector(".hero-title-2");
  const description1 = document.querySelector(".hero-description:not(.hero-description-2)");
  const description2 = document.querySelector(".hero-description-2");
  const heroDescriptionContent = document.querySelector(".hero-description-content");
  const heroImgContent = document.querySelector(".hero-img-content");
  const heroContentItems = document.querySelector(".hero-content-items");
  const heroOverlays = document.querySelector(".hero-overlays");
  const heroImgOverlay = document.querySelector(".hero-img-overlay");
  const heroBorderOverlay = document.querySelector(".hero-border-overlay");
  const heroBorderOverlay2 = document.querySelector(".hero-border-overlay-2");
  const borderWrapper = document.querySelector(".hero-content-item-wrapper");
  const contentItems = document.querySelectorAll(".hero-content-item");
  const itemDesc1 = document.querySelector(".hero-item-description:not(.hero-item-description-v2)");
  const itemDesc2 = document.querySelector(".hero-item-description-v2");
  const heroContent = document.querySelector(".hero-content");
  const heroBtns = document.querySelectorAll(".hero-btn");

  if (!section || !wrap || !title1 || !title2 || !description1 || !heroImgContent || !heroContent) {
    console.warn("Hero animation skipped: Core DOM elements missing.");
    return;
  }

  const heroImages = heroImgContent.querySelectorAll(".hero-img");
  const imgWrappers = heroImgContent.querySelectorAll(".hero-img-wrapper");
  let imagePositions = [];
  let itemOffsets = [];
  let imgOffsetsMobile = [];
  let itemCumulativeWidths = [];
  let tl;
  let mm = gsap.matchMedia();
  let isMobileLayout = false;
  let isTabletMobileLayout = false;
  let isMediumMobileLayout = false;
  let isSmallMobileLayout = false;
  let isMobileXSLayout = false;
  let isMobileXXSLayout = false;
  let isShortDesktopLayout = false;
  let activeIndex = 0;
  let isClickScrolling = false;

  function getResponsiveTargetWidth() {
    if (isSmallMobileLayout) return "265%";
    if (isMediumMobileLayout) return "150%";
    if (isTabletMobileLayout) return "120%";
    return "auto";
  }

  function calculateImagePositions() {
    imagePositions = [];
    itemOffsets = [];
    imgOffsetsMobile = [];
    itemCumulativeWidths = [];
    if (!borderWrapper || imgWrappers.length === 0) return;

    const originalImgStyle = heroImgContent.getAttribute("style") || "";
    const originalContentItemsStyle = heroContentItems ? heroContentItems.getAttribute("style") || "" : "";
    const originalOverlaysStyle = heroOverlays ? heroOverlays.getAttribute("style") || "" : "";

    gsap.set([heroImgContent, heroContentItems, heroOverlays], {
      clearProps: "transform,scale,x,y,width,height",
    });

    if (isMobileLayout) {
      gsap.set(heroImgContent, { width: getResponsiveTargetWidth() });
    }

    const wrapperRect = borderWrapper.getBoundingClientRect();
    const imgContentRect = heroImgContent.getBoundingClientRect();

    imgWrappers.forEach((wrapper) => {
      const rect = wrapper.getBoundingClientRect();
      const pctLeft = imgContentRect.width > 0 ? Math.max(0, Math.min(100, ((rect.left - imgContentRect.left) / imgContentRect.width) * 100)) : 0;
      const pctWidth = imgContentRect.width > 0 ? Math.max(0, Math.min(100, (rect.width / imgContentRect.width) * 100)) : 0;
      const centerOffset = rect.left - imgContentRect.left + rect.width / 2;

      imagePositions.push({
        left: rect.left - wrapperRect.left,
        right: rect.right - wrapperRect.left,
        width: rect.width,
        imgPctLeft: pctLeft,
        imgPctRight: Math.min(100, pctLeft + pctWidth),
        centerOffset: centerOffset,
      });

      const imgXOffset = -(rect.left - imgContentRect.left);
      imgOffsetsMobile.push(imgXOffset);
    });

    let accumX = 0;
    const gap = 30;
    contentItems.forEach((item) => {
      itemOffsets.push(-accumX);
      const itemWidth = item.getBoundingClientRect().width;
      accumX += itemWidth + gap;
      itemCumulativeWidths.push(accumX);
    });

    heroImgContent.setAttribute("style", originalImgStyle);
    if (heroContentItems) heroContentItems.setAttribute("style", originalContentItemsStyle);
    if (heroOverlays) heroOverlays.setAttribute("style", originalOverlaysStyle);
  }

  function setInteractiveState(enabled, targetIndex = activeIndex) {
    imgWrappers.forEach((wrapper, idx) => {
      if (wrapper) {
        wrapper.style.pointerEvents = !enabled || idx === targetIndex ? "none" : "auto";
        wrapper.style.cursor = !enabled || idx === targetIndex ? "default" : "pointer";
      }
    });
    contentItems.forEach((item, idx) => {
      if (item) {
        item.style.pointerEvents = !enabled || idx === targetIndex ? "none" : "auto";
        item.style.cursor = !enabled || idx === targetIndex ? "default" : "pointer";
      }
    });
  }

  function splitTitle(el) {
    if (el.querySelectorAll(".word").length > 0) return;
    const text = el.textContent.trim();
    const parts = text.split(/(\s+)/);
    let firstLetterIndex = 0;
    const meraLetters = ["M", "e", "R", "A"];
    el.innerHTML = "";

    parts.forEach((part) => {
      if (/^\s+$/.test(part)) {
        const space = document.createElement("span");
        space.className = "space";
        space.innerHTML = " ";
        el.appendChild(space);
        return;
      }
      const word = document.createElement("span");
      word.className = "word";
      word.style.display = "inline-block";
      word.style.whiteSpace = "nowrap";

      const firstLetterSpan = document.createElement("span");
      firstLetterSpan.className = "char first-letter";
      firstLetterSpan.dataset.acronym = meraLetters[firstLetterIndex] || part[0];
      firstLetterSpan.textContent = part[0];
      firstLetterSpan.style.display = "inline-block";
      word.appendChild(firstLetterSpan);
      firstLetterIndex++;

      if (part.length > 1) {
        const restSpan = document.createElement("span");
        restSpan.className = "char-rest";
        restSpan.style.display = "inline-block";
        restSpan.textContent = part.slice(1);
        word.appendChild(restSpan);
      }
      el.appendChild(word);
    });
  }

  let cloneWrap = wrap.querySelector(".mera-clone-wrap");
  if (!cloneWrap) {
    cloneWrap = document.createElement("div");
    cloneWrap.className = "mera-clone-wrap";
    wrap.appendChild(cloneWrap);
  }

  splitTitle(title1);

  function syncMeraClonesPosition() {
    const wrapRect = wrap.getBoundingClientRect();
    const titleStyle = window.getComputedStyle(title1);
    const firstLetters = gsap.utils.toArray(".first-letter", title1);
    const clones = gsap.utils.toArray(".mera-clone");

    firstLetters.forEach((letter, idx) => {
      const clone = clones[idx];
      if (clone && letter) {
        const rect = letter.getBoundingClientRect();
        gsap.set(clone, {
          left: rect.left - wrapRect.left,
          top: rect.top - wrapRect.top,
          fontSize: titleStyle.fontSize,
          fontFamily: titleStyle.fontFamily,
          fontWeight: titleStyle.fontWeight,
          lineHeight: titleStyle.lineHeight,
          letterSpacing: titleStyle.letterSpacing,
        });
      }
    });

    if (clones.length) {
      updateMeraCloneTargets(clones, wrapRect, 4);
    }
  }

  function buildMeraClones(firstLetters) {
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
        willChange: "transform, opacity, left, top",
      });
    });

    const clones = gsap.utils.toArray(".mera-clone");
    if (!clones.length) return clones;
    updateMeraCloneTargets(clones, wrapRect, 4);
    return clones;
  }

  function updateMeraCloneTargets(clones, wrapRect, gap = 4) {
    const currentWrapRect = wrapRect || wrap.getBoundingClientRect();
    const totalWidth = clones.reduce((sum, clone) => sum + clone.offsetWidth, 0) + gap * (clones.length - 1);
    let x = currentWrapRect.width / 2 - totalWidth / 2;
    clones.forEach((clone) => {
      clone.dataset.targetLeft = x;
      x += clone.offsetWidth + gap;
    });
  }

  function animateToStepIndex(index, duration = 0.6) {
    if (!imagePositions[index]) calculateImagePositions();
    if (!imagePositions[index]) return;

    activeIndex = index;
    setInteractiveState(true, index);

    imgWrappers.forEach((wrapper, idx) => {
      if (wrapper) wrapper.classList.toggle("active", idx === index);
    });

    const lastImg = heroImages[heroImages.length - 1];
    if (lastImg) {
      if (index === heroImages.length - 1) {
        gsap.delayedCall(0.3, () => {
          if (activeIndex === heroImages.length - 1) {
            lastImg.classList.add("hero-img-2");
          }
        });
      } else {
        gsap.killTweensOf(lastImg);
        lastImg.classList.remove("hero-img-2");
      }
    }

    contentItems.forEach((item, idx) => {
      const isCurrent = idx === index;
      const titleText = item.querySelector(".hero-content-title");
      const contentDescText = item.querySelector(".hero-content-description");
      item.classList.toggle("active", isCurrent);

      if (titleText) {
        gsap.to(titleText, {
          color: isCurrent ? "#00dafd" : "#66666682",
          duration: duration * 0.6,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
      if (contentDescText) {
        gsap.to(contentDescText, {
          color: isCurrent ? "#ffffff" : "#66666682",
          duration: duration * 0.6,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    });

    if (isMobileLayout) {
      const imgTargetX = imgOffsetsMobile[index] || 0;
      const contentTargetX = itemOffsets[index] || 0;
      gsap.to(heroImgContent, {
        x: imgTargetX,
        duration: duration,
        ease: "power2.inOut",
        overwrite: "auto",
      });
      if (heroContentItems) {
        gsap.to(heroContentItems, {
          x: contentTargetX,
          duration: duration,
          ease: "power2.inOut",
          overwrite: "auto",
        });
      }
    }

    if (heroImgOverlay) {
      const pos = imagePositions[index];
      gsap.to(heroImgOverlay, {
        opacity: 1,
        clipPath: `polygon(
          0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 
          ${pos.imgPctLeft}% 0%, ${pos.imgPctLeft}% 100%, ${pos.imgPctRight}% 100%, ${pos.imgPctRight}% 0%, ${pos.imgPctLeft}% 0%
        )`,
        duration: duration,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    }

    if (heroBorderOverlay && heroBorderOverlay2) {
      if (isMobileLayout) {
        const targetWidth = itemCumulativeWidths[index] || 0;
        gsap.to(heroBorderOverlay, {
          opacity: 1,
          width: targetWidth,
          duration: duration,
          ease: "power2.inOut",
          overwrite: "auto",
        });
        gsap.to(heroBorderOverlay2, {
          opacity: index >= 4 ? 1 : 0,
          width: index >= 4 ? targetWidth : 0,
          duration: duration,
          ease: "power2.inOut",
          overwrite: "auto",
        });
      } else {
        if (index < 4) {
          const targetWidth = Math.max(0, Math.min(imagePositions[index].right, borderWrapper.offsetWidth));
          gsap.to(heroBorderOverlay, {
            opacity: 1,
            width: targetWidth,
            duration: duration,
            ease: "power2.inOut",
            overwrite: "auto",
          });
          gsap.to(heroBorderOverlay2, {
            width: 0,
            opacity: 0,
            duration: duration,
            ease: "power2.inOut",
            overwrite: "auto",
          });
        } else {
          const maxOverlay1Width = Math.max(0, Math.min(imagePositions[3].right, borderWrapper.offsetWidth));
          const targetWidth2 = Math.max(0, imagePositions[index].width);
          gsap.to(heroBorderOverlay, {
            opacity: 1,
            width: maxOverlay1Width,
            duration: duration,
            ease: "power2.inOut",
            overwrite: "auto",
          });
          gsap.to(heroBorderOverlay2, {
            opacity: 1,
            width: targetWidth2,
            duration: duration,
            ease: "power2.inOut",
            overwrite: "auto",
          });
        }
      }
    }

    if (itemDesc1) {
      gsap.to(itemDesc1, {
        color: index < 4 ? "#ffffff" : "#66666682",
        duration: duration * 0.5,
        overwrite: "auto",
      });
    }
    if (itemDesc2) {
      gsap.to(itemDesc2, {
        color: index === 4 ? "#ffffff" : "#66666682",
        duration: duration * 0.5,
        overwrite: "auto",
      });
    }
  }

  mm.add(
    {
      isDesktop: "(min-width: 992px) and (min-height: 701px)",
      isShortDesktop: "(min-width: 992px) and (max-height: 700px)",
      isMobile: "(max-width: 991px)",
      isTabletMobile: "(max-width: 991px) and (min-width: 768px)",
      isMediumMobile: "(max-width: 767px) and (min-width: 480px)",
      isSmallMobile: "(max-width: 479px)",
      isMobileXS: "(max-width: 575px)",
      isMobileXXS: "(max-width: 335px)",
      isShortScreen: "(max-height: 700px)",
    },
    (context) => {
      isMobileLayout = context.conditions.isMobile;
      isTabletMobileLayout = context.conditions.isTabletMobile;
      isMediumMobileLayout = context.conditions.isMediumMobile;
      isSmallMobileLayout = context.conditions.isSmallMobile;
      isMobileXSLayout = context.conditions.isMobileXS;
      isMobileXXSLayout = context.conditions.isMobileXXS;
      isShortDesktopLayout = context.conditions.isShortDesktop;

      if (context.conditions.isMobile || context.conditions.isShortScreen) {
        gsap.set(section, { clearProps: "height,maxHeight,minHeight" });
      }

      if (isShortDesktopLayout) {

        gsap.set(section, { clearProps: "height,maxHeight,minHeight" });
        section.style.minHeight = "auto";

        gsap.set([wrap, title1, description1], { clearProps: "all" });
        wrap.classList.remove("active");

        gsap.set(title1, { display: "none" });
        gsap.set(description1, { display: "none" });

        gsap.set(title2, {
          display: "block",
          opacity: 1,
          position: "relative",
          left: 0,
          x: 0,
          y: 0,
          transform: "none",
        });

        if (description2) {
          gsap.set(description2, {
            display: "block",
            opacity: 1,
            position: "relative",
            left: 0,
            x: 0,
            y: 0,
            transform: "none",
          });
        }

        if (heroDescriptionContent) {
          gsap.set(heroDescriptionContent, { overflow: "visible" });
        }

        gsap.set(heroImgContent, {
          opacity: 1,
          y: 0,
          scale: 1,
          x: 0,
          width: "auto",
          clearProps: "transform",
        });

        if (heroContentItems) {
          gsap.set(heroContentItems, { opacity: 1, x: 0 });
        }

        if (heroOverlays) {
          gsap.set(heroOverlays, { opacity: 1, y: 0 });
        }

        calculateImagePositions();

        animateToStepIndex(0, 0.4);

        const clickHandlers = [];

        const handleItemClick = (index) => {
          calculateImagePositions();
          animateToStepIndex(index, 0.8);
        };

        imgWrappers.forEach((wrapper, index) => {
          const clickHandler = () => handleItemClick(index);
          wrapper.addEventListener("click", clickHandler);
          clickHandlers.push({ element: wrapper, clickHandler });
        });

        contentItems.forEach((item, index) => {
          const clickHandler = () => handleItemClick(index);
          item.addEventListener("click", clickHandler);
          clickHandlers.push({ element: item, clickHandler });
        });

        heroBtns.forEach((btn) => {
          const btnHandler = (e) => {
            e.stopPropagation();
            const lastIndex = heroImages.length - 1;
            const lastImg = heroImages[lastIndex];
            if (lastImg) {
              gsap.killTweensOf(lastImg);
              lastImg.classList.remove("hero-img-2");
            }
            if (imgWrappers[lastIndex]) imgWrappers[lastIndex].classList.remove("active");
            if (contentItems[lastIndex]) contentItems[lastIndex].classList.remove("active");
            if (activeIndex === lastIndex) {
              const fallbackIndex = Math.max(0, lastIndex - 1);
              animateToStepIndex(fallbackIndex);
            }
          };
          btn.addEventListener("click", btnHandler);
          clickHandlers.push({ element: btn, clickHandler: btnHandler });
        });

        return () => {
          clickHandlers.forEach(({ element, clickHandler }) => {
            if (element) element.removeEventListener("click", clickHandler);
          });
        };
      }

      calculateImagePositions();
      setInteractiveState(false);

      const firstLetters = gsap.utils.toArray(".first-letter", title1);
      let meraClones = buildMeraClones(firstLetters);

      function recalculateHeights() {
        gsap.set([wrap, title2], { clearProps: "height,overflow" });
        const naturalWrapHeight = wrap.getBoundingClientRect().height;
        const naturalTitle2Height = title2.getBoundingClientRect().height;
        const targetWrapHeight = naturalTitle2Height;
        return { naturalWrapHeight, targetWrapHeight };
      }

      let { naturalWrapHeight, targetWrapHeight } = recalculateHeights();

      const handleResize = () => {
        calculateImagePositions();
        const heights = recalculateHeights();
        naturalWrapHeight = heights.naturalWrapHeight;
        targetWrapHeight = heights.targetWrapHeight;
        syncMeraClonesPosition();
        if (tl) tl.invalidate();
        ScrollTrigger.refresh();
      };

      window.addEventListener("resize", handleResize);

      gsap.set(title1, { opacity: 0, y: 0 });
      
      const title2InitialY = isMobileXSLayout ? 35 : isMobileLayout ? 46 : 60;
      gsap.set(title2, { opacity: 0, y: title2InitialY });

      gsap.set(description1, { opacity: 0, y: 0 });

      if (description2) {
        const desc2InitialY = isMobileXXSLayout ? 40 : isMobileXSLayout ? 22 : isMobileLayout ? 34 : 40;
        gsap.set(description2, { opacity: 0, y: desc2InitialY });
      }

      const startImgXMobile = isMobileLayout && imgOffsetsMobile[0] !== undefined ? imgOffsetsMobile[0] : 0;

      if (heroContentItems) {
        gsap.set(heroContentItems, { opacity: 0, x: 0 });
      }

      if (heroOverlays) {
        gsap.set(heroOverlays, {
          opacity: 0,
          y: 30,
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 10,
        });
      }

      contentItems.forEach((item) => item.classList.remove("active"));
      imgWrappers.forEach((wrapper) => wrapper.classList.remove("active"));

      if (heroImgOverlay) {
        gsap.set(heroImgOverlay, { opacity: 0 });
        if (imagePositions[0]) {
          const x1 = imagePositions[0].imgPctLeft;
          const x2 = imagePositions[0].imgPctRight;
          heroImgOverlay.style.clipPath = `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 
            ${x1}% 0%, ${x1}% 100%, ${x2}% 100%, ${x2}% 0%, ${x1}% 0%
          )`;
        }
      }

      if (heroBorderOverlay) {
        const firstCardWidth = () => {
          if (isMobileLayout) return itemCumulativeWidths[0] || 0;
          if (!borderWrapper || !imagePositions[0]) return 0;
          return Math.max(0, Math.min(imagePositions[0].right, borderWrapper.offsetWidth));
        };
        gsap.set(heroBorderOverlay, {
          opacity: 0,
          width: firstCardWidth,
        });
      }

      if (heroBorderOverlay2) gsap.set(heroBorderOverlay2, { width: 0, opacity: 0 });
      if (itemDesc1) gsap.set(itemDesc1, { color: "#66666682" });
      if (itemDesc2) gsap.set(itemDesc2, { color: "#66666682" });

      contentItems.forEach((item) => {
        const titleText = item.querySelector(".hero-content-title");
        const descText = item.querySelector(".hero-content-description");
        if (titleText) gsap.set(titleText, { color: "#66666682" });
        if (descText) gsap.set(descText, { color: "#66666682" });
      });

      gsap.set(heroImgContent, {
        opacity: 0,
        y: isMobileLayout ? 0 : 70,
        scale: isMobileLayout ? 1 : 0.5,
        x: startImgXMobile,
        width: isMobileLayout ? "100%" : "auto",
        transformOrigin: "center bottom",
      });

      const totalSteps = heroImages.length;
      const scrollDistancePerStep = 700;
      const baseIntroDistance = 1200;
      const dynamicEndScroll = baseIntroDistance + totalSteps * scrollDistancePerStep;
      const stepLabels = Array.from({ length: totalSteps }, (_, i) => `step_${i}`);

      tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${dynamicEndScroll}`,
          pin: true,
          scrub: 0.5,
          invalidateOnRefresh: true,
          snap: {
            snapTo: (progress) => {
              if (isClickScrolling) return progress;
              if (!tl || !tl.duration()) return progress;

              const activeStartProgress = tl.labels.overlaysActiveStart / tl.duration();
              const activeEndProgress = tl.labels[`step_${totalSteps - 1}`] / tl.duration();

              if (progress >= activeStartProgress && progress <= activeEndProgress) {
                const stepPositions = stepLabels
                  .map((label) => (tl.labels[label] !== undefined ? tl.labels[label] / tl.duration() : null))
                  .filter((val) => val !== null);

                return gsap.utils.snap(stepPositions, progress);
              }
              return progress;
            },
            duration: { min: 0.2, max: 0.5 },
            delay: 0.05,
            directional: true,
            ease: "power2.out",
          },
        },
      });

      const titleFadeDuration = 0.3;
      tl.to(title1, { opacity: 1, duration: titleFadeDuration, ease: "power1.out" }, 0);
      tl.to(".char-rest", { "--position": "0%", duration: 0.5, ease: "power1.inOut" }, titleFadeDuration + 0.1);
      tl.to(firstLetters, { color: "#00dafd", duration: 0.2, ease: "none" }, ">");

      tl.add(() => syncMeraClonesPosition(), ">");
      tl.to(meraClones, { opacity: 1, duration: 0.15, ease: "linear" }, ">");
      tl.to(firstLetters, { opacity: 0, duration: 0.15, ease: "linear" }, "<");

      tl.to(
        meraClones,
        {
          left: (i, el) => {
            const wrapRect = wrap.getBoundingClientRect();
            const clones = gsap.utils.toArray(".mera-clone");
            if (clones.length) updateMeraCloneTargets(clones, wrapRect, 4);
            return Number(el.dataset.targetLeft);
          },
          top: "50%",
          yPercent: -50,
          duration: 0.5,
          ease: "power2.inOut",
          onComplete: () => wrap.classList.remove("active"),
          onReverseComplete: () => wrap.classList.add("active"),
        },
        ">"
      );

      tl.to(
        wrap,
        {
          height: () => targetWrapHeight,
          duration: 1.15,
          ease: "power2.inOut",
        },
        ">"
      );

      if (isMobileLayout) {
        tl.to(
          heroImgContent,
          {
            opacity: 1,
            x: () => startImgXMobile,
            duration: 0.8,
            ease: "power2.inOut",
          },
          ">"
        );
      } else {
        tl.to(
          heroImgContent,
          {
            opacity: 1,
            y: -36,
            scale: 1,
            duration: 1.15,
            ease: "power2.inOut",
          },
          "<"
        );
      }

      tl.to(description1, { opacity: 1, duration: 0.4, ease: "power1.out" }, ">+=0.2");
      if (description2) {
        tl.to(description2, { opacity: 1, duration: 0.4, ease: "power1.out" }, "<");
      }

      const finalMoveDuration = 0.55;
      tl.to(description1, { y: 0, opacity: 0, duration: finalMoveDuration, ease: "power2.inOut" }, ">");
      if (description2) {
        tl.to(
          description2,
          {
            y: 0,
            opacity: 1,
            duration: finalMoveDuration,
            ease: "power2.inOut",
          },
          "<"
        );
      }
      tl.to([title1, cloneWrap], { y: -60, duration: finalMoveDuration, ease: "power2.inOut" }, "<");
      tl.to(title2, { opacity: 1, y: 0, duration: finalMoveDuration, ease: "power2.inOut" }, "<");

      if (heroContentItems) {
        tl.to(heroContentItems, { opacity: 1, x: 0, duration: finalMoveDuration, ease: "power2.inOut" }, "<");
      }

      if (isMobileLayout) {
        tl.to(
          heroImgContent,
          {
            width: () => getResponsiveTargetWidth(),
            x: () => startImgXMobile,
            duration: 0.8,
            ease: "power2.inOut",
          },
          ">"
        );
      }

      tl.add("overlaysEntry", ">");
      tl.call(() => calculateImagePositions(), null, "overlaysEntry-=0.05");

      if (heroOverlays) {
        tl.to(heroOverlays, { opacity: 0.5, y: 0, duration: 0.4, ease: "power2.out" }, "overlaysEntry");
      }

      if (heroImgOverlay) {
        tl.to(heroImgOverlay, { opacity: 0.5, duration: 0.4, ease: "power2.out" }, "overlaysEntry");
      }

      const firstItem = contentItems[0];
      if (firstItem) {
        const firstTitle = firstItem.querySelector(".hero-content-title");
        const firstDesc = firstItem.querySelector(".hero-content-description");
        if (firstTitle) {
          tl.to(firstTitle, { color: "#00dafd", duration: 0.4, ease: "power2.out" }, "overlaysEntry");
        }
        if (firstDesc) {
          tl.to(firstDesc, { color: "#ffffff", duration: 0.4, ease: "power2.out" }, "overlaysEntry");
        }
      }

      if (heroBorderOverlay) {
        tl.to(heroBorderOverlay, { opacity: 1, duration: 0.4, ease: "power2.out" }, "overlaysEntry");
      }

      if (itemDesc1) {
        tl.to(itemDesc1, { color: "#ffffff", duration: 0.4, ease: "power2.out" }, "overlaysEntry");
      }

      if (heroOverlays) {
        tl.to(heroOverlays, { opacity: 1, duration: 0.4, ease: "power2.out" }, ">");
      }
      if (heroImgOverlay) {
        tl.to(heroImgOverlay, { opacity: 1, duration: 0.4, ease: "power2.out" }, "<");
      }

      tl.add("overlaysActiveStart", ">");

      tl.call(() => {
        if (isClickScrolling) return;
        animateToStepIndex(0, 0.4);
      }, null, "overlaysActiveStart");

      if (heroImages.length > 0) {
        heroImages.forEach((_, index) => {
          const isFirst = index === 0;
          const stepLabel = `step_${index}`;

          tl.add(stepLabel, isFirst ? "overlaysActiveStart" : "+=0.6");

          tl.call(() => {
            if (isClickScrolling) return;
            animateToStepIndex(index, 0.6);
          }, null, stepLabel);
        });
      }

      tl.to({}, { duration: 1.0 });

      const clickHandlers = [];

      const handleItemClick = (index) => {
        if (!tl || index === activeIndex) return;
        calculateImagePositions();

        const labelTime = tl.labels[`step_${index}`];
        if (labelTime !== undefined) {
          isClickScrolling = true;
          animateToStepIndex(index, 0.8);

          const scrollST = tl.scrollTrigger;
          const stepOffset = index === 0 ? 0.5 : 0.8;
          const finalTweenTime = labelTime + stepOffset;
          const safeTime = Math.min(finalTweenTime, tl.duration());
          const progress = safeTime / tl.duration();
          const targetScroll = scrollST.start + progress * (scrollST.end - scrollST.start);

          gsap.to(window, {
            scrollTo: { y: targetScroll, autoKill: true },
            duration: 1.0,
            ease: "power2.inOut",
            onStart: () => {
              isClickScrolling = true;
            },
            onComplete: () => {
              isClickScrolling = false;
            },
            onInterrupt: () => {
              isClickScrolling = false;
            },
          });
        }
      };

      imgWrappers.forEach((wrapper, index) => {
        const clickHandler = () => handleItemClick(index);
        wrapper.addEventListener("click", clickHandler);
        clickHandlers.push({ element: wrapper, clickHandler });
      });

      contentItems.forEach((item, index) => {
        const clickHandler = () => handleItemClick(index);
        item.addEventListener("click", clickHandler);
        clickHandlers.push({ element: item, clickHandler });
      });

      heroBtns.forEach((btn) => {
        const btnHandler = (e) => {
          e.stopPropagation();
          const lastIndex = heroImages.length - 1;
          const lastImg = heroImages[lastIndex];
          if (lastImg) {
            gsap.killTweensOf(lastImg);
            lastImg.classList.remove("hero-img-2");
          }
          if (imgWrappers[lastIndex]) {
            imgWrappers[lastIndex].classList.remove("active");
          }
          if (contentItems[lastIndex]) {
            contentItems[lastIndex].classList.remove("active");
          }
          if (activeIndex === lastIndex) {
            const fallbackIndex = Math.max(0, lastIndex - 1);
            animateToStepIndex(fallbackIndex);
          }
        };
        btn.addEventListener("click", btnHandler);
        clickHandlers.push({ element: btn, clickHandler: btnHandler });
      });

      return () => {
        window.removeEventListener("resize", handleResize);
        clickHandlers.forEach(({ element, clickHandler }) => {
          if (element) element.removeEventListener("click", clickHandler);
        });
        if (tl) tl.kill();
      };
    }
  );
});


document.addEventListener("DOMContentLoaded", () => {
  const heroBtn = document.querySelector(".hero-btn");
  const modalSection = document.querySelector(".hero-model-section");
  const heroContainer = document.querySelector(".hero-container");
  const closeBtn = document.querySelector(".close-modal-btn");
  const nextBtn = document.querySelector(".next-arrow");
  const prevBtn = document.querySelector(".previous-arrow");
  const contentContainer = document.querySelector(".hero-model-content");
  const imgContentContainer = document.querySelector(".hero-img-content-2");

  const mainHeader = document.querySelector(
    ".hero-model-title:not(.hero-process-title)"
  );
  const titles = Array.from(document.querySelectorAll(".hero-process-title"));
  const descriptions = Array.from(
    document.querySelectorAll(".hero-model-content-title")
  );
  const mainImgs = Array.from(document.querySelectorAll(".hero-model-img"));

  let currentIndex = 0;
  let autoplayTimer = null;
  let filterTimer = null;
  let resizeDebounceTimer = null;
  const AUTOPLAY_DELAY = 5000;

  const getOffscreenLeftPosition = (targetImg) => {
    const imgWidth = getTargetImageWidth(targetImg);
    const containerWidth = imgContentContainer
      ? imgContentContainer.parentElement?.getBoundingClientRect().width || window.innerWidth
      : window.innerWidth;
    
    return `${containerWidth + imgWidth + 100}px`;
  };

  const getTargetImageWidth = (img) => {
    if (!img) return 0;

    const rectWidth = img.getBoundingClientRect().width;
    if (rectWidth > 0) return rectWidth;
    if (img.naturalWidth && img.naturalHeight && imgContentContainer) {
      const containerHeight = imgContentContainer.offsetHeight || 300;
      return (img.naturalWidth / img.naturalHeight) * containerHeight;
    }

    return img.naturalWidth || img.offsetWidth || 300;
  };

  const updateImgWidthVariable = (img) => {
    if (!img) return 0;
    const width = getTargetImageWidth(img);
    if (imgContentContainer && width > 0) {
      imgContentContainer.style.setProperty(
        "--processSliderImgWrapperWidth",
        `${width}px`
      );
    }
    return width;
  };

  const getCharts = () => {
    const isDesktop = window.innerWidth > 991;
    const containerSelector = isDesktop
      ? ".hero-process-chart-content.md-none"
      : ".hero-process-chart-content.lg-none";

    const inactiveSelector = isDesktop
      ? ".hero-process-chart-content.lg-none .hero-process-chart-items"
      : ".hero-process-chart-content.md-none .hero-process-chart-items";

    document.querySelectorAll(inactiveSelector).forEach((item) => {
      gsap.set(item, { opacity: 0, pointerEvents: "none" });
    });

    return Array.from(
      document.querySelectorAll(
        `${containerSelector} .hero-process-chart-items`
      )
    );
  };

  const totalSlides = Math.min(
    titles.length,
    descriptions.length,
    mainImgs.length
  );

  const updateContentHeight = (index, duration = 0.5) => {
    if (contentContainer && descriptions[index]) {
      const targetHeight = descriptions[index].offsetHeight;
      gsap.to(contentContainer, {
        height: targetHeight,
        duration: duration,
        ease: "power1.inOut",
      });
    }
  };

  const updateImageContainerWidth = (index, duration = 0.5) => {
    return new Promise((resolve) => {
      const currentImg = mainImgs[index];

      if (!imgContentContainer || !currentImg) {
        resolve();
        return;
      }

      const applyWidth = () => {
        const targetWidth = updateImgWidthVariable(currentImg);

        if (targetWidth > 0) {
          gsap.to(imgContentContainer, {
            width: `${targetWidth}px`,
            duration: duration,
            ease: "power1.inOut",
            onComplete: resolve,
          });
        } else {
          resolve();
        }
      };

      if (currentImg.complete && currentImg.naturalWidth > 0) {
        applyWidth();
      } else {
        currentImg.addEventListener("load", applyWidth, { once: true });
      }
    });
  };

  const updateActiveImage = (activeIndex) => {
    if (filterTimer) {
      clearTimeout(filterTimer);
      filterTimer = null;
    }

    mainImgs.forEach((img, idx) => {
      img.classList.remove("show-filter");
      if (idx === activeIndex) {
        img.classList.add("active");
      } else {
        img.classList.remove("active");
      }
    });

    filterTimer = setTimeout(() => {
      if (mainImgs[activeIndex]) {
        mainImgs[activeIndex].classList.add("show-filter");
      }
    }, 900);
  };

  const resetSlideshow = () => {
    stopAutoplay();
    currentIndex = -1;

    if (mainHeader) {
      gsap.set(mainHeader, { opacity: 1, pointerEvents: "auto" });
    }

    titles.forEach((title) => {
      gsap.set(title, { opacity: 0, pointerEvents: "none" });
    });

    const currentCharts = getCharts();

    [descriptions, currentCharts].forEach((group) => {
      group.forEach((item) => {
        gsap.set(item, { opacity: 0, pointerEvents: "none" });
      });
    });

    if (mainImgs[0]) {
      updateImgWidthVariable(mainImgs[0]);
    }

    mainImgs.forEach((img, idx) => {
      const offscreenPos = getOffscreenLeftPosition(img);
      gsap.set(img, { xPercent: 0, x: 0 });

      if (idx === 0) {
        gsap.set(img, { opacity: 1, left: "0px", pointerEvents: "auto" });
      } else {
        gsap.set(img, { opacity: 0, left: offscreenPos, pointerEvents: "none" });
      }
    });

    updateActiveImage(0);
    updateContentHeight(0, 0);
    updateImageContainerWidth(0, 0);
  };

  const goToSlide = async (nextIndex) => {
    if (nextIndex === currentIndex) return;

    await updateImageContainerWidth(nextIndex, 0.4);
    updateContentHeight(nextIndex, 0.4);

    const currentCharts = getCharts();

    if (currentIndex === -1) {
      if (mainHeader) {
        gsap.to(mainHeader, {
          opacity: 0,
          duration: 0.5,
          ease: "power1.inOut",
          onComplete: () => {
            mainHeader.style.pointerEvents = "none";
          },
        });
      }

      const incomingTextElements = [
        titles[nextIndex],
        descriptions[nextIndex],
        currentCharts[nextIndex],
      ].filter(Boolean);

      gsap.to(incomingTextElements, {
        opacity: 1,
        duration: 0.5,
        delay: 0.1,
        ease: "power1.inOut",
        onStart: () => {
          incomingTextElements.forEach(
            (el) => (el.style.pointerEvents = "auto")
          );
        },
      });

      currentIndex = nextIndex;
      return;
    }

    const outgoingTextElements = [
      titles[currentIndex],
      descriptions[currentIndex],
      currentCharts[currentIndex],
    ].filter(Boolean);

    const incomingTextElements = [
      titles[nextIndex],
      descriptions[nextIndex],
      currentCharts[nextIndex],
    ].filter(Boolean);

    const outgoingImg = mainImgs[currentIndex];
    const incomingImg = mainImgs[nextIndex];

    updateActiveImage(nextIndex);

    gsap.to(outgoingTextElements, {
      opacity: 0,
      duration: 0.5,
      ease: "power1.inOut",
      onComplete: () => {
        outgoingTextElements.forEach((el) => (el.style.pointerEvents = "none"));
      },
    });

    gsap.to(incomingTextElements, {
      opacity: 1,
      duration: 0.5,
      delay: 0.1,
      ease: "power1.inOut",
      onStart: () => {
        incomingTextElements.forEach((el) => (el.style.pointerEvents = "auto"));
      },
    });

    if (outgoingImg) {
      const offscreenPosOut = getOffscreenLeftPosition(outgoingImg);
      gsap.to(outgoingImg, {
        left: offscreenPosOut,
        opacity: 0,
        duration: 0.4,
        ease: "power1.inOut",
        onComplete: () => {
          outgoingImg.style.pointerEvents = "none";
        },
      });
    }

    if (incomingImg) {
      const offscreenPosIn = getOffscreenLeftPosition(incomingImg);
      gsap.set(incomingImg, { left: offscreenPosIn, opacity: 0, xPercent: 0, x: 0 });
      gsap.to(incomingImg, {
        left: "0px",
        opacity: 1,
        duration: 0.9,
        ease: "power1.inOut",
        onStart: () => {
          incomingImg.style.pointerEvents = "auto";
        },
      });
    }

    currentIndex = nextIndex;
  };

  const nextSlide = () => {
    const nextIndex = (currentIndex + 1) % totalSlides;
    goToSlide(nextIndex);
  };

  const prevSlide = () => {
    const prevIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    goToSlide(prevIndex < 0 ? totalSlides - 1 : prevIndex);
  };

  const startAutoplay = () => {
    stopAutoplay();
    autoplayTimer = setInterval(nextSlide, AUTOPLAY_DELAY);
  };

  const stopAutoplay = () => {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  const openModal = () => {
    if (!modalSection) return;

    modalSection.classList.add("is-open");
    document.body.style.overflow = "hidden";

    if (heroContainer) {
      heroContainer.style.opacity = "0";
      heroContainer.style.pointerEvents = "none";
    }

    resetSlideshow();

    setTimeout(() => {
      goToSlide(0);
      startAutoplay();
    }, 1500);
  };

  const closeModal = () => {
    if (!modalSection) return;

    modalSection.classList.remove("is-open");
    document.body.style.overflow = "";

    if (heroContainer) {
      heroContainer.style.opacity = "1";
      heroContainer.style.pointerEvents = "auto";
    }

    stopAutoplay();
  };

  heroBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  closeBtn?.addEventListener("click", closeModal);

  nextBtn?.addEventListener("click", () => {
    nextSlide();
    startAutoplay();
  });

  prevBtn?.addEventListener("click", () => {
    prevSlide();
    startAutoplay();
  });

  modalSection?.addEventListener("mouseenter", stopAutoplay);
  modalSection?.addEventListener("mouseleave", () => {
    if (modalSection.classList.contains("is-open")) {
      startAutoplay();
    }
  });

  window.addEventListener("resize", () => {
    clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(() => {
      const currentCharts = getCharts();
      const activeIdx = currentIndex >= 0 ? currentIndex : 0;

      currentCharts.forEach((chart, idx) => {
        if (idx === activeIdx) {
          gsap.set(chart, { opacity: 1, pointerEvents: "auto" });
        } else {
          gsap.set(chart, { opacity: 0, pointerEvents: "none" });
        }
      });

      updateContentHeight(activeIdx, 0.2);
      updateImageContainerWidth(activeIdx, 0.2);
    }, 100);
  });

  window.addEventListener("load", () => {
    const activeIdx = currentIndex >= 0 ? currentIndex : 0;
    updateImageContainerWidth(activeIdx, 0);
  });

  resetSlideshow();
});