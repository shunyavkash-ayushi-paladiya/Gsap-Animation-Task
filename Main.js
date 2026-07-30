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
  const description1 = document.querySelector(
    ".hero-description:not(.hero-description-2)",
  );
  const description2 = document.querySelector(".hero-description-2");
  const heroImgContent = document.querySelector(".hero-img-content");
  const heroContentItems = document.querySelector(".hero-content-items");
  const heroOverlays = document.querySelector(".hero-overlays");
  const heroImgOverlay = document.querySelector(".hero-img-overlay");
  const heroBorderOverlay = document.querySelector(".hero-border-overlay");
  const heroBorderOverlay2 = document.querySelector(".hero-border-overlay-2");
  const borderWrapper = document.querySelector(".hero-content-item-wrapper");
  const contentItems = document.querySelectorAll(".hero-content-item");
  const itemDesc1 = document.querySelector(
    ".hero-item-description:not(.hero-item-description-v2)",
  );
  const itemDesc2 = document.querySelector(".hero-item-description-v2");
  const heroContent = document.querySelector(".hero-content");
  const heroBtns = document.querySelectorAll(".hero-btn");

  if (
    !section ||
    !wrap ||
    !title1 ||
    !title2 ||
    !description1 ||
    !heroImgContent ||
    !heroContent
  ) {
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
    const originalContentItemsStyle = heroContentItems
      ? heroContentItems.getAttribute("style") || ""
      : "";
    const originalOverlaysStyle = heroOverlays
      ? heroOverlays.getAttribute("style") || ""
      : "";

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
      const pctLeft =
        imgContentRect.width > 0
          ? Math.max(
              0,
              Math.min(
                100,
                ((rect.left - imgContentRect.left) / imgContentRect.width) *
                  100,
              ),
            )
          : 0;
      const pctWidth =
        imgContentRect.width > 0
          ? Math.max(
              0,
              Math.min(100, (rect.width / imgContentRect.width) * 100),
            )
          : 0;
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
    const gap = 25;
    contentItems.forEach((item) => {
      itemOffsets.push(-accumX);
      const itemWidth = item.getBoundingClientRect().width;
      accumX += itemWidth + gap;
      itemCumulativeWidths.push(accumX);
    });

    heroImgContent.setAttribute("style", originalImgStyle);
    if (heroContentItems)
      heroContentItems.setAttribute("style", originalContentItemsStyle);
    if (heroOverlays) heroOverlays.setAttribute("style", originalOverlaysStyle);
  }

  function setInteractiveState(enabled, targetIndex = activeIndex) {
    imgWrappers.forEach((wrapper, idx) => {
      if (wrapper) {
        if (!enabled || idx === targetIndex) {
          wrapper.style.pointerEvents = "none";
          wrapper.style.cursor = "default";
        } else {
          wrapper.style.pointerEvents = "auto";
          wrapper.style.cursor = "pointer";
        }
      }
    });

    contentItems.forEach((item, idx) => {
      if (item) {
        if (!enabled || idx === targetIndex) {
          item.style.pointerEvents = "none";
          item.style.cursor = "default";
        } else {
          item.style.pointerEvents = "auto";
          item.style.cursor = "pointer";
        }
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
      firstLetterSpan.dataset.acronym =
        meraLetters[firstLetterIndex] || part[0];
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
        top: "50%",
        yPercent: -50,
        color: "#00dafd",
        fontSize: titleStyle.fontSize,
        fontFamily: titleStyle.fontFamily,
        fontWeight: titleStyle.fontWeight,
        lineHeight: titleStyle.lineHeight,
        letterSpacing: titleStyle.letterSpacing,
        willChange: "transform, opacity",
      });
    });

    const clones = gsap.utils.toArray(".mera-clone");
    const gap = 4;
    if (!clones.length) return clones;

    updateMeraCloneTargets(clones, wrapRect, gap);
    return clones;
  }

  function updateMeraCloneTargets(clones, wrapRect, gap) {
    const currentWrapRect = wrapRect || wrap.getBoundingClientRect();
    const calculatedGap = gap !== undefined ? gap : 4;
    const totalWidth =
      clones.reduce((sum, clone) => sum + clone.offsetWidth, 0) +
      calculatedGap * (clones.length - 1);

    let x = currentWrapRect.width / 2 - totalWidth / 2;

    clones.forEach((clone) => {
      clone.dataset.targetLeft = x;
      x += clone.offsetWidth + calculatedGap;
    });
  }

  function animateToStepIndex(index, duration = 0.8) {
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

      if (titleText)
        gsap.to(titleText, {
          color: isCurrent ? "#00dafd" : "#66666682",
          duration: duration * 0.5,
          overwrite: "auto",
        });

      if (contentDescText)
        gsap.to(contentDescText, {
          color: isCurrent ? "#ffffff" : "#66666682",
          duration: duration * 0.5,
          overwrite: "auto",
        });
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
          const targetWidth = Math.max(
            0,
            Math.min(imagePositions[index].right, borderWrapper.offsetWidth),
          );
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
          const maxOverlay1Width = Math.max(
            0,
            Math.min(imagePositions[3].right, borderWrapper.offsetWidth),
          );
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

    if (itemDesc1)
      gsap.to(itemDesc1, {
        color: index < 4 ? "#ffffff" : "#66666682",
        duration: duration * 0.5,
        overwrite: "auto",
      });

    if (itemDesc2)
      gsap.to(itemDesc2, {
        color: index === 4 ? "#ffffff" : "#66666682",
        duration: duration * 0.5,
        overwrite: "auto",
      });
  }

  mm.add(
    {
      isDesktop: "(min-width: 992px) and (min-height: 701px)",
      isShortDesktop: "(min-width: 992px) and (max-height: 700px)",
      isMobile: "(max-width: 991px)",
      isTabletMobile: "(max-width: 991px) and (min-width: 768px)",
      isMediumMobile: "(max-width: 767px) and (min-width: 480px)",
      isSmallMobile: "(max-width: 479px)",
    },
    (context) => {
      isMobileLayout = context.conditions.isMobile;
      isTabletMobileLayout = context.conditions.isTabletMobile;
      isMediumMobileLayout = context.conditions.isMediumMobile;
      isSmallMobileLayout = context.conditions.isSmallMobile;
      isShortDesktopLayout = context.conditions.isShortDesktop;

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

        const wrapRect = wrap.getBoundingClientRect();
        const titleStyle = window.getComputedStyle(title1);
        const clones = gsap.utils.toArray(".mera-clone");

        if (clones.length) {
          clones.forEach((clone, idx) => {
            const letter = firstLetters[idx];
            if (letter) {
              const rect = letter.getBoundingClientRect();
              gsap.set(clone, {
                left: rect.left - wrapRect.left,
                fontSize: titleStyle.fontSize,
                fontFamily: titleStyle.fontFamily,
                fontWeight: titleStyle.fontWeight,
                lineHeight: titleStyle.lineHeight,
                letterSpacing: titleStyle.letterSpacing,
              });
            }
          });
          updateMeraCloneTargets(clones, wrapRect, 4);
        }

        if (tl) tl.invalidate();
        ScrollTrigger.refresh();
      };

      window.addEventListener("resize", handleResize);

      gsap.set(title1, { opacity: 0, y: 0 });
      gsap.set(title2, { opacity: 0, y: 150 });
      gsap.set(description1, { opacity: 0, y: 0 });
      if (description2) gsap.set(description2, { opacity: 0, y: 50 });

      const startImgXMobile =
        isMobileLayout && imgOffsetsMobile[0] !== undefined
          ? imgOffsetsMobile[0]
          : 0;

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

      contentItems.forEach((item) => item.classList.remove("active"));
      imgWrappers.forEach((wrapper) => wrapper.classList.remove("active"));

      if (heroBorderOverlay) {
        gsap.set(heroBorderOverlay, {
          opacity: 0,
          width: () => {
            if (isMobileLayout) return itemCumulativeWidths[0] || 0;
            if (!borderWrapper || !imagePositions[0]) return 0;
            return Math.max(
              0,
              Math.min(imagePositions[0].right, borderWrapper.offsetWidth),
            );
          },
        });
      }

      if (heroBorderOverlay2)
        gsap.set(heroBorderOverlay2, { width: 0, opacity: 0 });
      if (itemDesc1) gsap.set(itemDesc1, { color: "#66666682" });
      if (itemDesc2) gsap.set(itemDesc2, { color: "#66666682" });

      contentItems.forEach((item) => {
        const desc = item.querySelector(".hero-content-description");
        if (desc) gsap.set(desc, { color: "#66666682" });
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
      const scrollDistancePerStep = isShortDesktopLayout ? 300 : 700;
      const baseIntroDistance = isShortDesktopLayout ? 800 : 1200;
      const dynamicEndScroll =
        baseIntroDistance + totalSteps * scrollDistancePerStep;

      tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${dynamicEndScroll}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      const titleFadeDuration = 0.3;
      tl.to(
        title1,
        { opacity: 1, duration: titleFadeDuration, ease: "power1.out" },
        0,
      );
      tl.to(
        ".char-rest",
        { "--position": "0%", duration: 0.5, ease: "power1.inOut" },
        titleFadeDuration + 0.1,
      );
      tl.to(
        firstLetters,
        { color: "#00dafd", duration: 0.2, ease: "none" },
        ">",
      );
      tl.set(meraClones, { opacity: 1 });
      tl.set(firstLetters, { opacity: 0 });
      tl.to(
        meraClones,
        {
          left: (i, el) => {
            const wrapRect = wrap.getBoundingClientRect();
            const clones = gsap.utils.toArray(".mera-clone");
            if (clones.length) updateMeraCloneTargets(clones, wrapRect, 4);
            return Number(el.dataset.targetLeft);
          },
          duration: 0.5,
          ease: "power2.inOut",
          onComplete: () => wrap.classList.remove("active"),
          onReverseComplete: () => wrap.classList.add("active"),
        },
        ">",
      );
      tl.to(
        wrap,
        {
          height: () => targetWrapHeight,
          duration: 1.15,
          ease: "power2.inOut",
        },
        ">",
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
          ">",
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
          "<",
        );
      }

      tl.to(
        description1,
        { opacity: 1, duration: 0.4, ease: "power1.out" },
        ">+=0.2",
      );
      if (description2) {
        tl.to(
          description2,
          { opacity: 1, duration: 0.4, ease: "power1.out" },
          "<",
        );
      }

      const finalMoveDuration = 0.55;
      tl.to(
        description1,
        { y: 0, opacity: 0, duration: finalMoveDuration, ease: "power2.inOut" },
        ">",
      );
      if (description2) {
        tl.to(
          description2,
          {
            y: 0,
            opacity: 1,
            duration: finalMoveDuration,
            ease: "power2.inOut",
          },
          "<",
        );
      }
      tl.to(
        [title1, cloneWrap],
        { y: -70, duration: finalMoveDuration, ease: "power2.inOut" },
        "<",
      );
      tl.to(
        title2,
        { opacity: 1, y: 0, duration: finalMoveDuration, ease: "power2.inOut" },
        "<",
      );

      if (isMobileLayout) {
        tl.to(
          heroImgContent,
          {
            width: () => getResponsiveTargetWidth(),
            x: () => startImgXMobile,
            duration: 0.8,
            ease: "power2.inOut",
          },
          ">",
        );
      }

      if (heroContentItems) {
        tl.to(
          heroContentItems,
          { opacity: 1, x: 0, duration: 0.5, ease: "power2.inOut" },
          isMobileLayout ? ">-=0.3" : "<",
        );
      }

      if (heroOverlays) {
        tl.add("overlaysEntry", "-=0.2");
        tl.call(() => calculateImagePositions(), null, "overlaysEntry-=0.05");
        tl.to(
          heroOverlays,
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          "overlaysEntry",
        );
        tl.call(
          () => {
            if (isShortDesktopLayout || isClickScrolling) return;
            if (contentItems[0]) contentItems[0].classList.add("active");
            if (imgWrappers[0]) imgWrappers[0].classList.add("active");
          },
          null,
          "overlaysEntry",
        );
        tl.call(
          () => {
            if (isShortDesktopLayout || isClickScrolling) return;
            if (contentItems[0]) contentItems[0].classList.remove("active");
            if (imgWrappers[0]) imgWrappers[0].classList.remove("active");
          },
          null,
          "overlaysEntry-=0.01",
        );

        if (heroImgOverlay) {
          tl.to(
            heroImgOverlay,
            { opacity: 1, duration: 0.6, ease: "power2.inOut" },
            "overlaysEntry+=0.2",
          );
        }

        tl.add("overlaysActiveStart", "overlaysEntry+=0.3");
        tl.set(heroOverlays, { opacity: 1, y: 0 }, "overlaysActiveStart");
        tl.call(
          () => {
            if (isClickScrolling) return;
            setInteractiveState(true, activeIndex);
          },
          null,
          "overlaysActiveStart",
        );
        tl.call(
          () => {
            if (isClickScrolling) return;
            setInteractiveState(false);
          },
          null,
          "overlaysActiveStart-=0.01",
        );

        const firstTitle = contentItems[0]?.querySelector(
          ".hero-content-title",
        );
        const firstDesc = contentItems[0]?.querySelector(
          ".hero-content-description",
        );

        if (firstTitle)
          tl.to(
            firstTitle,
            { color: "#00dafd", duration: 0.2, ease: "power2.inOut" },
            "overlaysActiveStart",
          );

        if (firstDesc)
          tl.to(
            firstDesc,
            { color: "#ffffff", duration: 0.2, ease: "power2.inOut" },
            "overlaysActiveStart",
          );

        if (itemDesc1)
          tl.to(
            itemDesc1,
            { color: "#ffffff", duration: 0.2, ease: "power2.inOut" },
            "overlaysActiveStart",
          );

        if (heroBorderOverlay)
          tl.to(
            heroBorderOverlay,
            { opacity: 1, duration: 0.2, ease: "power2.inOut" },
            "overlaysActiveStart",
          );

        if (heroImages.length > 0) {
          let cutoutTracker = {
            leftPct: imagePositions[0] ? imagePositions[0].imgPctLeft : 0,
            rightPct: imagePositions[0] ? imagePositions[0].imgPctRight : 0,
          };

          heroImages.forEach((img, index) => {
            const matchingBlock = contentItems[index];
            const prevBlock = contentItems[index - 1];
            const wrapper = imgWrappers[index];
            const prevWrapper = imgWrappers[index - 1];
            const isFirst = index === 0;
            const isLast = index === heroImages.length - 1;
            const stepLabel = `step_${index}`;

            tl.add(stepLabel, isFirst ? "overlaysActiveStart" : "+=0.6");
            tl.call(
              () => {
                if (isClickScrolling) return;
                activeIndex = index;
                setInteractiveState(true, index);
              },
              null,
              stepLabel,
            );

            if (!isFirst) {
              tl.call(
                () => {
                  if (isShortDesktopLayout || isClickScrolling) return;
                  if (wrapper) wrapper.classList.add("active");
                  if (prevWrapper) prevWrapper.classList.remove("active");
                },
                null,
                stepLabel,
              );
              tl.call(
                () => {
                  if (isShortDesktopLayout || isClickScrolling) return;
                  if (wrapper) wrapper.classList.remove("active");
                  if (prevWrapper) prevWrapper.classList.add("active");
                },
                null,
                `${stepLabel}-=0.01`,
              );
            }

            if (isLast) {
              tl.call(
                () => {
                  if (isShortDesktopLayout || isClickScrolling) return;
                  img.classList.add("hero-img-2");
                },
                null,
                `${stepLabel}+=0.3`,
              );
              tl.call(
                () => {
                  if (isShortDesktopLayout || isClickScrolling) return;
                  img.classList.remove("hero-img-2");
                },
                null,
                `${stepLabel}+=0.29`,
              );
            }

            if (isShortDesktopLayout) {
              tl.call(
                () => {
                  if (isFirst) animateToStepIndex(0, 0);
                },
                null,
                stepLabel,
              );
            }

            if (isMobileLayout) {
              tl.to(
                heroImgContent,
                {
                  x: () =>
                    imgOffsetsMobile[index] !== undefined
                      ? imgOffsetsMobile[index]
                      : 0,
                  duration: 0.8,
                  ease: "power2.inOut",
                },
                stepLabel,
              );

              if (heroContentItems) {
                tl.to(
                  heroContentItems,
                  {
                    x: () => itemOffsets[index] || 0,
                    duration: 0.8,
                    ease: "power2.inOut",
                  },
                  stepLabel,
                );
              }
            }

            if (heroImgOverlay && !isFirst) {
              tl.to(
                cutoutTracker,
                {
                  leftPct: () =>
                    imagePositions[index]
                      ? imagePositions[index].imgPctLeft
                      : 0,
                  rightPct: () =>
                    imagePositions[index]
                      ? imagePositions[index].imgPctRight
                      : 0,
                  duration: 0.8,
                  ease: "power2.inOut",
                  modifiers: {
                    leftPct: (value) =>
                      isShortDesktopLayout ? cutoutTracker.leftPct : value,
                    rightPct: (value) =>
                      isShortDesktopLayout ? cutoutTracker.rightPct : value,
                  },
                  onUpdate: () => {
                    if (isClickScrolling) return;
                    heroImgOverlay.style.clipPath = `polygon(
                      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 
                      ${cutoutTracker.leftPct}% 0%, ${cutoutTracker.leftPct}% 100%, ${cutoutTracker.rightPct}% 100%, ${cutoutTracker.rightPct}% 0%, ${cutoutTracker.leftPct}% 0%
                    )`;
                  },
                },
                stepLabel,
              );
            }

            if (heroBorderOverlay && !isFirst) {
              tl.to(
                heroBorderOverlay,
                {
                  opacity: 1,
                  width: () => {
                    if (isShortDesktopLayout || isClickScrolling)
                      return heroBorderOverlay.offsetWidth;
                    if (isMobileLayout) return itemCumulativeWidths[index] || 0;
                    if (!borderWrapper || !imagePositions[index]) return 0;
                    return index < 4
                      ? Math.max(
                          0,
                          Math.min(
                            imagePositions[index].right,
                            borderWrapper.offsetWidth,
                          ),
                        )
                      : Math.max(
                          0,
                          Math.min(
                            imagePositions[3].right,
                            borderWrapper.offsetWidth,
                          ),
                        );
                  },
                  duration: 0.8,
                  ease: "power2.inOut",
                },
                stepLabel,
              );
            }

            if (heroBorderOverlay2 && !isFirst) {
              tl.to(
                heroBorderOverlay2,
                {
                  opacity: () => (index >= 4 ? 1 : 0),
                  width: () => {
                    if (isShortDesktopLayout || isClickScrolling)
                      return heroBorderOverlay2.offsetWidth;
                    if (isMobileLayout)
                      return index >= 4 ? itemCumulativeWidths[index] || 0 : 0;
                    if (!borderWrapper || !imagePositions[index]) return 0;
                    return index >= 4
                      ? Math.max(0, imagePositions[index].width)
                      : 0;
                  },
                  duration: 0.8,
                  ease: "power2.inOut",
                  onStart: () => {
                    if (isShortDesktopLayout || isClickScrolling) return;
                    if (matchingBlock) matchingBlock.classList.add("active");
                    if (prevBlock) prevBlock.classList.remove("active");
                  },
                  onReverseComplete: () => {
                    if (isShortDesktopLayout || isClickScrolling) return;
                    if (matchingBlock) matchingBlock.classList.remove("active");
                    if (prevBlock) prevBlock.classList.add("active");
                  },
                },
                stepLabel,
              );
            }

            if (matchingBlock && !isFirst) {
              const titleText = matchingBlock.querySelector(
                ".hero-content-title",
              );
              if (titleText) {
                tl.to(
                  titleText,
                  {
                    color: "#00dafd",
                    modifiers: {
                      color: (c) =>
                        isShortDesktopLayout || isClickScrolling
                          ? titleText.style.color
                          : c,
                    },
                  },
                  stepLabel,
                );
              }

              const contentDescText = matchingBlock.querySelector(
                ".hero-content-description",
              );
              if (contentDescText) {
                tl.to(
                  contentDescText,
                  {
                    color: "#ffffff",
                    modifiers: {
                      color: (c) =>
                        isShortDesktopLayout || isClickScrolling
                          ? contentDescText.style.color
                          : c,
                    },
                  },
                  stepLabel,
                );
              }

              if (index < 4) {
                if (itemDesc1)
                  tl.to(
                    itemDesc1,
                    {
                      color: "#ffffff",
                      modifiers: {
                        color: (c) =>
                          isShortDesktopLayout || isClickScrolling
                            ? itemDesc1.style.color
                            : c,
                      },
                    },
                    stepLabel,
                  );
                if (itemDesc2)
                  tl.to(
                    itemDesc2,
                    {
                      color: "#66666682",
                      modifiers: {
                        color: (c) =>
                          isShortDesktopLayout || isClickScrolling
                            ? itemDesc2.style.color
                            : c,
                      },
                    },
                    stepLabel,
                  );
              } else if (index === 4) {
                if (itemDesc1)
                  tl.to(
                    itemDesc1,
                    {
                      color: "#66666682",
                      modifiers: {
                        color: (c) =>
                          isShortDesktopLayout || isClickScrolling
                            ? itemDesc1.style.color
                            : c,
                      },
                    },
                    stepLabel,
                  );
                if (itemDesc2)
                  tl.to(
                    itemDesc2,
                    {
                      color: "#ffffff",
                      modifiers: {
                        color: (c) =>
                          isShortDesktopLayout || isClickScrolling
                            ? itemDesc2.style.color
                            : c,
                      },
                    },
                    stepLabel,
                  );
              }
            }

            if (prevBlock) {
              const prevTitle = prevBlock.querySelector(".hero-content-title");
              if (prevTitle)
                tl.to(
                  prevTitle,
                  {
                    color: "#66666682",
                    modifiers: {
                      color: (c) =>
                        isShortDesktopLayout || isClickScrolling
                          ? prevTitle.style.color
                          : c,
                    },
                  },
                  stepLabel,
                );

              const prevDescText = prevBlock.querySelector(
                ".hero-content-description",
              );
              if (prevDescText)
                tl.to(
                  prevDescText,
                  {
                    color: "#66666682",
                    modifiers: {
                      color: (c) =>
                        isShortDesktopLayout || isClickScrolling
                          ? prevDescText.style.color
                          : c,
                    },
                  },
                  stepLabel,
                );
            }
          });
        }
      }

      tl.to({}, { duration: 1.0 });

      const clickHandlers = [];

      const handleItemClick = (index) => {
        if (!tl || index === activeIndex) return;
        calculateImagePositions();

        if (isShortDesktopLayout) {
          animateToStepIndex(index);
        } else {
          const labelTime = tl.labels[`step_${index}`];
          if (labelTime !== undefined) {
            isClickScrolling = true;
            animateToStepIndex(index, 0.8);

            const scrollST = tl.scrollTrigger;
            const stepOffset = index === 0 ? 0.5 : 0.8;
            const finalTweenTime = labelTime + stepOffset;
            const safeTime = Math.min(finalTweenTime, tl.duration());
            const progress = safeTime / tl.duration();
            const targetScroll =
              scrollST.start + progress * (scrollST.end - scrollST.start);

            lenis.scrollTo(targetScroll, {
              duration: 1.0,
              easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
              onComplete: () => {
                isClickScrolling = false;
              },
            });
          }
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
    },
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
    ".hero-model-title:not(.hero-process-title)",
  );
  const titles = Array.from(document.querySelectorAll(".hero-process-title"));
  const descriptions = Array.from(
    document.querySelectorAll(".hero-model-content-title"),
  );
  const mainImgs = Array.from(document.querySelectorAll(".hero-model-img"));

  let currentIndex = 0;
  let autoplayTimer = null;
  let filterTimer = null;
  const AUTOPLAY_DELAY = 3000;

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
        `${containerSelector} .hero-process-chart-items`,
      ),
    );
  };

  const charts = getCharts();

  const totalSlides = Math.min(
    titles.length,
    descriptions.length,
    charts.length,
    mainImgs.length,
  );

  const originalImgWidths = [];

  const storeOriginalImgWidths = () => {
    mainImgs.forEach((img, index) => {
      const intrinsicWidth = img.naturalWidth;

      if (intrinsicWidth > 0) {
        originalImgWidths[index] = intrinsicWidth;
        img.setAttribute("data-original-width", intrinsicWidth);
      } else {
        img.addEventListener(
          "load",
          () => {
            const loadedWidth = img.naturalWidth;
            originalImgWidths[index] = loadedWidth;
            img.setAttribute("data-original-width", loadedWidth);

            if (index === currentIndex) {
              updateImageContainerWidth(index, 0);
            }
          },
          { once: true },
        );
      }
    });
  };

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
      if (!imgContentContainer || !mainImgs[index]) {
        resolve();
        return;
      }

      const targetWidth =
        mainImgs[index].naturalWidth ||
        originalImgWidths[index] ||
        mainImgs[index].getAttribute("data-original-width");

      if (targetWidth && targetWidth > 0) {
        gsap.to(imgContentContainer, {
          width: `${targetWidth}px`,
          duration: duration,
          ease: "power1.inOut",
          onComplete: resolve,
        });
      } else {
        resolve();
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

    storeOriginalImgWidths();

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

    mainImgs.forEach((img, idx) => {
      if (idx === 0) {
        gsap.set(img, { opacity: 1, xPercent: 0, pointerEvents: "auto" });
      } else {
        gsap.set(img, { opacity: 0, xPercent: 100, pointerEvents: "none" });
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
            (el) => (el.style.pointerEvents = "auto"),
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
      gsap.to(outgoingImg, {
        xPercent: 100,
        opacity: 0,
        duration: 0.4,
        ease: "power1.inOut",
        onComplete: () => {
          outgoingImg.style.pointerEvents = "none";
        },
      });
    }

    if (incomingImg) {
      gsap.set(incomingImg, { xPercent: 100, opacity: 0 });
      gsap.to(incomingImg, {
        xPercent: 0,
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
    storeOriginalImgWidths();

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
  });

  window.addEventListener("load", () => {
    storeOriginalImgWidths();
    updateImageContainerWidth(0, 0);
  });

  resetSlideshow();
});
