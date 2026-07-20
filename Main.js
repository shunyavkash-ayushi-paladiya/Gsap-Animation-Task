gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

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
  let tl;
  let mm = gsap.matchMedia();
  let isMobileLayout = false;
  let isShortDesktopLayout = false;
  let activeIndex = 0;

  function getImgContentTargetWidth() {
    if (window.innerWidth <= 375) return "1000px";
    if (window.innerWidth <= 575) return "1200px";
    return "1500px"; 
  }

  function getContentItemsWidth() {
    if (window.innerWidth <= 375) return "1000px";
    if (window.innerWidth <= 575) return "1200px";
    return "1500px";
  }

  function calculateImagePositions() {
    imagePositions = [];
    if (!borderWrapper || heroImages.length === 0) return;

    const originalStyle = heroImgContent.getAttribute("style") || "";
    const originalContentItemsStyle = heroContentItems
      ? heroContentItems.getAttribute("style") || ""
      : "";

    gsap.set(heroImgContent, { clearProps: "transform,scale,x,y" });
    if (heroContentItems)
      gsap.set(heroContentItems, { clearProps: "transform,scale,x,y" });

    if (isMobileLayout) {
      gsap.set(heroImgContent, { width: getImgContentTargetWidth() });
      if (heroContentItems)
        gsap.set(heroContentItems, { width: getContentItemsWidth() });
    }

    const wrapperRect = borderWrapper.getBoundingClientRect();
    const imgContentRect = heroImgContent.getBoundingClientRect();

    heroImages.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const pctLeft =
        ((rect.left - imgContentRect.left) / imgContentRect.width) * 100;
      const pctWidth = (rect.width / imgContentRect.width) * 100;
      const imageCenterOffset =
        rect.left - imgContentRect.left + rect.width / 2;

      imagePositions.push({
        left: rect.left - wrapperRect.left,
        right: rect.right - wrapperRect.left,
        width: rect.width,
        imgPctLeft: pctLeft,
        imgPctRight: pctLeft + pctWidth,
        centerOffset: imageCenterOffset,
      });
    });

    heroImgContent.setAttribute("style", originalStyle);
    if (heroContentItems && isMobileLayout) {
      heroContentItems.setAttribute("style", originalContentItemsStyle);
    }
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
    if (!imagePositions[index]) return;
    activeIndex = index;

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
        });
      if (contentDescText)
        gsap.to(contentDescText, {
          color: isCurrent ? "#ffffff" : "#66666682",
          duration: duration * 0.5,
        });
    });

    if (isMobileLayout) {
      const targetX =
        index === 0
          ? 0
          : imagePositions[0].centerOffset - imagePositions[index].centerOffset;

      gsap.to([heroImgContent, heroContentItems], {
        x: targetX,
        duration: duration,
        ease: "power2.inOut",
      });
    }

    if (heroImgOverlay) {
      gsap.to(heroImgOverlay, {
        opacity: 1,
        clipPath: `polygon(
          0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 
          ${imagePositions[index].imgPctLeft}% 0%, ${imagePositions[index].imgPctLeft}% 100%, ${imagePositions[index].imgPctRight}% 100%, ${imagePositions[index].imgPctRight}% 0%, ${imagePositions[index].imgPctLeft}% 0%
        )`,
        duration: duration,
        ease: "power2.inOut",
      });
    }

    if (heroBorderOverlay && heroBorderOverlay2) {
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
        });
        gsap.to(heroBorderOverlay2, {
          width: 0,
          duration: duration,
          ease: "power2.inOut",
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
        });
        gsap.to(heroBorderOverlay2, {
          opacity: 1,
          width: targetWidth2,
          duration: duration,
          ease: "power2.inOut",
        });
      }
    }

    if (itemDesc1)
      gsap.to(itemDesc1, {
        color: index < 4 ? "#ffffff" : "#66666682",
        duration: duration * 0.5,
      });
    if (itemDesc2)
      gsap.to(itemDesc2, {
        color: index === 4 ? "#ffffff" : "#66666682",
        duration: duration * 0.5,
      });
  }

  mm.add(
    {
      isDesktop: "(min-width: 993px) and (min-height: 701px)",
      isShortDesktop: "(min-width: 993px) and (max-height: 700px)",
      isMobile: "(max-width: 992px)",
    },
    (context) => {
      isMobileLayout = context.conditions.isMobile;
      isShortDesktopLayout = context.conditions.isShortDesktop;

      calculateImagePositions();

      const firstLetters = gsap.utils.toArray(".first-letter", title1);
      let meraClones = buildMeraClones(firstLetters);

      const naturalWrapHeight = wrap.offsetHeight;
      const naturalTitleHeight = title1.offsetHeight;

      const targetTitleHeight = naturalTitleHeight * 0.8;
      const targetWrapHeight = targetTitleHeight;

      gsap.set(wrap, { height: naturalWrapHeight });
      gsap.set(title1, { height: naturalTitleHeight, overflow: "hidden" });

      const handleResize = () => {
        calculateImagePositions();

        const wrapRect = wrap.getBoundingClientRect();
        const clones = gsap.utils.toArray(".mera-clone");
        if (clones.length) {
          updateMeraCloneTargets(clones, wrapRect, 4);
        }

        if (tl) {
          tl.invalidate();
        }
        ScrollTrigger.update();
      };

      window.addEventListener("resize", handleResize);

      gsap.set(title1, { opacity: 0, y: 0 });
      gsap.set(title2, { opacity: 0, y: 150 });
      gsap.set(description1, { opacity: 0, y: 0 });

      if (description2) gsap.set(description2, { opacity: 0, y: 50 });

      if (heroContentItems) {
        gsap.set(heroContentItems, {
          opacity: 0,
          x: 0,
          width: isMobileLayout ? getContentItemsWidth() : "auto",
        });
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

      contentItems.forEach((item, idx) => {
        if (idx === 0) item.classList.add("active");
        else item.classList.remove("active");
      });

      if (heroBorderOverlay) {
        gsap.set(heroBorderOverlay, {
          opacity: 0,
          width: () => {
            if (!borderWrapper || !imagePositions[0]) return 0;
            return Math.max(
              0,
              Math.min(imagePositions[0].right, borderWrapper.offsetWidth),
            );
          },
        });
      }
      if (heroBorderOverlay2) gsap.set(heroBorderOverlay2, { width: 0 });

      if (itemDesc1) gsap.set(itemDesc1, { color: "#66666682" });
      if (itemDesc2) gsap.set(itemDesc2, { color: "#66666682" });

      contentItems.forEach((item) => {
        const desc = item.querySelector(".hero-content-description");
        if (desc) gsap.set(desc, { color: "#66666682" });
      });

      gsap.set(heroImgContent, {
        opacity: 0,
        y: isMobileLayout ? 0 : 300,
        scale: isMobileLayout ? 1 : 0.5,
        x: 0,
        width: isMobileLayout ? "100%" : "auto",
        transformOrigin: "center bottom",
      });

      gsap.set(".char-rest", { "--position": "100%" });

      const totalSteps = heroImages.length;
      const scrollDistancePerStep = isShortDesktopLayout ? 300 : 700;
      const baseIntroDistance = isShortDesktopLayout ? 800 : 1200;
      const dynamicEndScroll = baseIntroDistance + (totalSteps * scrollDistancePerStep);

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
        {
          "--position": "0%",
          duration: 0.5,
          ease: "power1.inOut",
        },
        titleFadeDuration + 0.1,
      );

      tl.to(
        firstLetters,
        {
          color: "#00dafd",
          duration: 0.2,
          ease: "none",
        },
        ">",
      );

      tl.set(meraClones, { opacity: 1 });
      tl.set(firstLetters, { opacity: 0 });

      tl.to(
        meraClones,
        {
          left: (i, el) => Number(el.dataset.targetLeft),
          duration: 0.5,
          ease: "power2.inOut",
          onComplete: () => wrap.classList.remove("active"),
          onReverseComplete: () => wrap.classList.add("active"),
        },
        ">",
      );

      tl.to(
        wrap,
        { height: targetWrapHeight, duration: 1.15, ease: "power2.inOut" },
        ">",
      );
      tl.to(
        title1,
        { height: targetTitleHeight, duration: 1.15, ease: "power2.inOut" },
        "<",
      );

      if (isMobileLayout) {
        tl.to(
          heroImgContent,
          {
            opacity: 1,
            x: 0,
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
            y: -30,
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

      if (description2)
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
            width: getImgContentTargetWidth(),
            x: 0,
            duration: 0.6,
            ease: "power2.inOut",
          },
          ">",
        );
      }

      if (heroContentItems) {
        tl.to(
          heroContentItems,
          {
            opacity: 1,
            x: 0,
            width: isMobileLayout ? getContentItemsWidth() : "auto",
            duration: 0.5,
            ease: "power2.inOut",
          },
          isMobileLayout ? ">-=0.3" : "<",
        );
      }

      if (heroOverlays) {
        tl.add("overlaysEntry", "-=0.2");
        tl.to(
          heroOverlays,
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          "overlaysEntry",
        );

        if (heroImgOverlay) {
          tl.to(
            heroImgOverlay,
            { opacity: 1, duration: 0.6, ease: "power2.inOut" },
            "overlaysEntry+=0.2",
          );
        }

        tl.add("overlaysActiveStart", "overlaysEntry+=0.2");

        const firstTitle = contentItems[0]?.querySelector(
          ".hero-content-title",
        );
        const firstDesc = contentItems[0]?.querySelector(
          ".hero-content-description",
        );

        if (firstTitle)
          tl.to(
            firstTitle,
            { color: "#00dafd", duration: 0.4, ease: "power2.inOut" },
            "overlaysActiveStart",
          );
        if (firstDesc)
          tl.to(
            firstDesc,
            { color: "#ffffff", duration: 0.4, ease: "power2.inOut" },
            "overlaysActiveStart",
          );
        if (itemDesc1)
          tl.to(
            itemDesc1,
            { color: "#ffffff", duration: 0.4, ease: "power2.inOut" },
            "overlaysActiveStart",
          );
        if (heroBorderOverlay)
          tl.to(
            heroBorderOverlay,
            { opacity: 1, duration: 0.4, ease: "power2.inOut" },
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

            const currentBorderTarget =
              index < 4 ? heroBorderOverlay : heroBorderOverlay2;
            const stepLabel = `step_${index}`;

            tl.add(stepLabel, isFirst ? "overlaysActiveStart" : "+=0.6");

            tl.call(
              () => {
                if (isShortDesktopLayout) return;
                if (wrapper) wrapper.classList.add("active");
                if (prevWrapper) prevWrapper.classList.remove("active");
              },
              null,
              stepLabel,
            );

            tl.call(
              () => {
                if (isShortDesktopLayout) return;
                if (wrapper) wrapper.classList.remove("active");
                if (prevWrapper) prevWrapper.classList.add("active");
              },
              null,
              `${stepLabel}-=0.01`,
            );

            if (isLast) {
              tl.call(
                () => {
                  if (isShortDesktopLayout) return;
                  img.classList.add("hero-img-2");
                },
                null,
                `${stepLabel}+=0.3`,
              );

              tl.call(
                () => {
                  if (isShortDesktopLayout) return;
                  img.classList.remove("hero-img-2");
                },
                null,
                `${stepLabel}+=0.29`,
              );
            }

            tl.call(
              () => {
                if (isShortDesktopLayout) {
                  if (isFirst) animateToStepIndex(0, 0);
                }
              },
              null,
              stepLabel,
            );

            if (isMobileLayout) {
              tl.to(
                [heroImgContent, heroContentItems],
                {
                  x: () => {
                    if (!imagePositions[index] || index === 0) return 0;
                    return (
                      imagePositions[0].centerOffset -
                      imagePositions[index].centerOffset
                    );
                  },
                  duration: 0.8,
                  ease: "power2.inOut",
                },
                stepLabel,
              );
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
                    heroImgOverlay.style.clipPath = `polygon(
                      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 
                      ${cutoutTracker.leftPct}% 0%, ${cutoutTracker.leftPct}% 100%, ${cutoutTracker.rightPct}% 100%, ${cutoutTracker.rightPct}% 0%, ${cutoutTracker.leftPct}% 0%
                    )`;
                  },
                },
                stepLabel,
              );
            }

            if (currentBorderTarget && !isFirst) {
              tl.to(
                currentBorderTarget,
                {
                  opacity: 1,
                  width: () => {
                    if (isShortDesktopLayout) {
                      if (
                        activeIndex === index &&
                        currentBorderTarget ===
                          (activeIndex < 4
                            ? heroBorderOverlay
                            : heroBorderOverlay2)
                      ) {
                        return index < 4
                          ? Math.max(
                              0,
                              Math.min(
                                imagePositions[index].right,
                                borderWrapper.offsetWidth,
                              ),
                            )
                          : Math.max(0, imagePositions[index].width);
                      }
                      return currentBorderTarget.offsetWidth;
                    }
                    if (!borderWrapper || !imagePositions[index]) return 0;
                    return index < 4
                      ? Math.max(
                          0,
                          Math.min(
                            imagePositions[index].right,
                            borderWrapper.offsetWidth,
                          ),
                        )
                      : Math.max(0, imagePositions[index].width);
                  },
                  duration: 0.8,
                  ease: "power2.inOut",
                  onStart: () => {
                    if (isShortDesktopLayout) return;
                    if (matchingBlock) matchingBlock.classList.add("active");
                    if (prevBlock) prevBlock.classList.remove("active");
                  },
                  onReverseComplete: () => {
                    if (isShortDesktopLayout) return;
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
                    duration: 0.4,
                    ease: "power2.inOut",
                    modifiers: {
                      color: (c) =>
                        isShortDesktopLayout ? titleText.style.color : c,
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
                    duration: 0.4,
                    ease: "power2.inOut",
                    modifiers: {
                      color: (c) =>
                        isShortDesktopLayout ? contentDescText.style.color : c,
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
                      duration: 0.4,
                      ease: "power2.inOut",
                      modifiers: {
                        color: (c) =>
                          isShortDesktopLayout ? itemDesc1.style.color : c,
                      },
                    },
                    stepLabel,
                  );
                if (itemDesc2)
                  tl.to(
                    itemDesc2,
                    {
                      color: "#66666682",
                      duration: 0.4,
                      ease: "power2.inOut",
                      modifiers: {
                        color: (c) =>
                          isShortDesktopLayout ? itemDesc2.style.color : c,
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
                      duration: 0.4,
                      ease: "power2.inOut",
                      modifiers: {
                        color: (c) =>
                          isShortDesktopLayout ? itemDesc1.style.color : c,
                      },
                    },
                    stepLabel,
                  );
                if (itemDesc2)
                  tl.to(
                    itemDesc2,
                    {
                      color: "#ffffff",
                      duration: 0.4,
                      ease: "power2.inOut",
                      modifiers: {
                        color: (c) =>
                          isShortDesktopLayout ? itemDesc2.style.color : c,
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
                    duration: 0.4,
                    ease: "power2.inOut",
                    modifiers: {
                      color: (c) =>
                        isShortDesktopLayout ? prevTitle.style.color : c,
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
                    duration: 0.4,
                    ease: "power2.inOut",
                    modifiers: {
                      color: (c) =>
                        isShortDesktopLayout ? prevDescText.style.color : c,
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

      imgWrappers.forEach((wrapper, index) => {
        wrapper.style.cursor = "pointer";
        wrapper.style.pointerEvents = "auto";

        const clickHandler = () => {
          if (!tl) return;

          if (isShortDesktopLayout) {
            animateToStepIndex(index);
          } else {
            const labelTime = tl.labels[`step_${index}`];
            if (labelTime !== undefined) {
              const scrollST = tl.scrollTrigger;
              const finalTweenTime = labelTime + 0.65;
              const safeTime = Math.min(finalTweenTime, tl.duration());
              const progress = safeTime / tl.duration();
              const targetScroll =
                scrollST.start + progress * (scrollST.end - scrollST.start);

              gsap.killTweensOf(window);
              gsap.to(window, {
                scrollTo: { y: targetScroll, autoKill: false },
                duration: 0.8,
                ease: "power2.out",
              });
            }
          }
        };

        wrapper.addEventListener("click", clickHandler);
        clickHandlers.push({ wrapper, clickHandler });
      });

      return () => {
        window.removeEventListener("resize", handleResize);
        clickHandlers.forEach(({ wrapper, clickHandler }) => {
          wrapper.removeEventListener("click", clickHandler);
        });
        if (tl) tl.kill();
      };
    },
  );
});