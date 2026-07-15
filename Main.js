gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

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
  
  const heroImgOverlay = document.querySelector(".hero-img-overlay");
  
  const heroBorderOverlay = document.querySelector(".hero-border-overlay");
  const heroBorderOverlay2 = document.querySelector(".hero-border-overlay-2");
  
  const borderWrapper = document.querySelector(".hero-content-item-wrapper");
  const contentItems = document.querySelectorAll(".hero-content-item");

  const itemDesc1 = document.querySelector(".hero-item-description:not(.hero-item-description-v2)");
  const itemDesc2 = document.querySelector(".hero-item-description-v2");

  if (!section || !wrap || !title1 || !title2 || !description1 || !heroImgContent) {
    return;
  }

  const heroImages = heroImgContent.querySelectorAll(".hero-img");
  const imgWrappers = heroImgContent.querySelectorAll(".hero-img-wrapper");

  let imagePositions = [];
  let tl;
  let mm = gsap.matchMedia();

  function calculateImagePositions(isMobileLayout) {
    imagePositions = [];
    if (!borderWrapper || heroImages.length === 0) return;

    const originalStyle = heroImgContent.getAttribute("style") || "";
    const originalContentItemsStyle = heroContentItems ? heroContentItems.getAttribute("style") || "" : "";
    
    gsap.set(heroImgContent, { clearProps: "transform,scale,x,y" });
    if (isMobileLayout) {
      gsap.set(heroImgContent, { width: "1500px" });
      if (heroContentItems) gsap.set(heroContentItems, { width: "1500px" });
    }

    const wrapperRect = borderWrapper.getBoundingClientRect();
    const imgContentRect = heroImgContent.getBoundingClientRect(); 
    
    heroImages.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const pctLeft = ((rect.left - imgContentRect.left) / imgContentRect.width) * 100;
      const pctWidth = (rect.width / imgContentRect.width) * 100;
      const imageCenterOffset = (rect.left - imgContentRect.left) + (rect.width / 2);
      
      imagePositions.push({
        left: rect.left - wrapperRect.left,
        right: rect.right - wrapperRect.left,
        width: rect.width,
        imgPctLeft: pctLeft,
        imgPctRight: pctLeft + pctWidth,
        centerOffset: imageCenterOffset
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
    const y = currentWrapRect.height / 2 - clones[0].offsetHeight / 2;

    clones.forEach((clone) => {
      clone.dataset.targetLeft = x;
      clone.dataset.targetTop = y;
      x += clone.offsetWidth + calculatedGap;
    });
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

  mm.add({
    isDesktop: "(min-width: 993px)",
    isMobile: "(max-width: 992px)"
  }, (context) => {
    const isMobileLayout = context.conditions.isMobile;
    
    calculateImagePositions(isMobileLayout);
    
    const firstLetters = gsap.utils.toArray(".first-letter", title1);
    let meraClones = buildMeraClones(firstLetters);
    const lettersByColumn = getLettersByColumn();

    gsap.set(title1, { opacity: 0, y: 0 }); 
    gsap.set(title2, { opacity: 0, y: 150 });      
    gsap.set(description1, { opacity: 0, y: 0 }); 
    if (description2) gsap.set(description2, { opacity: 0, xPercent: -50, y: 50 }); 
    if (heroContentItems) {
      gsap.set(heroContentItems, { 
        opacity: 0, 
        x: 0,
        width: isMobileLayout ? "100%" : "auto"
      });
    }

    if (heroOverlays) {
      gsap.set(heroOverlays, { 
        opacity: 0,
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none", 
        zIndex: 10
      });
    }
    
    if (heroBorderOverlay) gsap.set(heroBorderOverlay, { width: 0 });
    if (heroBorderOverlay2) gsap.set(heroBorderOverlay2, { width: 0 });
    if (itemDesc1) gsap.set(itemDesc1, { color: "#8a8a8a" });
    if (itemDesc2) gsap.set(itemDesc2, { color: "#8a8a8a" });

    contentItems.forEach(item => {
      const desc = item.querySelector(".hero-content-description");
      if (desc) gsap.set(desc, { color: "#8a8a8a" });
    });

    gsap.set(heroImgContent, {
      opacity: 0,
      yPercent: 70,
      scale: isMobileLayout ? 0.7 : 0.5, 
      x: 0,
      width: isMobileLayout ? "100%" : "auto", 
      transformOrigin: "center center",
    });

    tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=3200", 
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    const stepDuration = 0.035; 
    const totalColumns = lettersByColumn.length;
    const titleFadeDuration = 0.3; 

    tl.to(title1, {
      opacity: 1,
      duration: titleFadeDuration,
      ease: "power1.out"
    }, 0);

    lettersByColumn.forEach((letters, index) => {
      tl.to(letters, {
        opacity: 0,
        duration: stepDuration,
        ease: "none",
        delay: index * stepDuration, 
      }, titleFadeDuration); 
    });

    tl.to(firstLetters, {
      color: "#00dafd",
      duration: 0.2,
      ease: "none",
    }, titleFadeDuration + (totalColumns * stepDuration) + 0.1);

    tl.set(meraClones, { opacity: 1 });
    tl.set(firstLetters, { opacity: 0 });

    tl.to(meraClones, {
      left: (i, el) => Number(el.dataset.targetLeft),
      top: (i, el) => Number(el.dataset.targetTop),
      duration: 0.5,
      ease: "power2.inOut",
    });

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

    tl.to(heroImgContent, {
      opacity: 1,
      yPercent: 0,
      scale: 1,
      duration: 0.65,
      ease: "power2.inOut",
    });

    const finalMoveDuration = 0.55;

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

    if (heroContentItems) {
      tl.to(heroContentItems, {
        opacity: 1,
        duration: 0.4,
        ease: "power1.out"
      }, "<");
    }

    if (isMobileLayout) {
      tl.to([heroImgContent, heroContentItems], {
        width: "1500px",
        duration: 0.5,
        ease: "power2.inOut"
      });
    }

    if (heroOverlays) {
      tl.to(heroOverlays, {
        opacity: 1,
        duration: 0.5,
        ease: "power1.inOut"
      }, "-=0.2");

      if (heroImages.length > 0) {
        let cutoutTracker = { leftPct: 0, rightPct: 0 };

        heroImages.forEach((img, index) => {
          const matchingBlock = contentItems[index];
          const prevBlock = contentItems[index - 1]; 
          const isFirst = index === 0;

          const currentBorderTarget = index < 4 ? heroBorderOverlay : heroBorderOverlay2;
          const stepLabel = `step_${index}`;
          
          tl.add(stepLabel, isFirst ? "<" : "+=0.2");

          if (isMobileLayout) {
            tl.to([heroImgContent, heroContentItems], {
              x: () => {
                if (!imagePositions[index]) return 0;
                return (window.innerWidth / 2) - imagePositions[index].centerOffset;
              },
              duration: 0.7,
              ease: "power2.inOut"
            }, stepLabel);
          }

          if (heroImgOverlay) {
            tl.to(cutoutTracker, {
              leftPct: () => imagePositions[index] ? imagePositions[index].imgPctLeft : 0,
              rightPct: () => imagePositions[index] ? imagePositions[index].imgPctRight : 0,
              duration: 0.7,
              ease: "power2.inOut",
              onUpdate: () => {
                const x1 = cutoutTracker.leftPct;
                const x2 = cutoutTracker.rightPct;
                heroImgOverlay.style.clipPath = `polygon(
                  0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 
                  ${x1}% 0%, ${x1}% 100%, ${x2}% 100%, ${x2}% 0%, ${x1}% 0%
                )`;
              }
            }, stepLabel);
          }

          if (currentBorderTarget) {
            tl.to(currentBorderTarget, {
              width: () => {
                if (!borderWrapper || !imagePositions[index]) return 0;
                if (index < 4) {
                  return Math.max(0, Math.min(imagePositions[index].right, borderWrapper.offsetWidth));
                } else {
                  return Math.max(0, imagePositions[index].width);
                }
              },
              duration: 0.7,
              ease: "power2.inOut",
              onStart: () => {
                if (matchingBlock) matchingBlock.classList.add("active");
                if (prevBlock) prevBlock.classList.remove("active");
              },
              onReverseComplete: () => {
                if (matchingBlock) matchingBlock.classList.remove("active");
                if (prevBlock) prevBlock.classList.add("active");
              }
            }, stepLabel);
          }

          if (matchingBlock) {
            const titleText = matchingBlock.querySelector(".hero-content-title");
            if (titleText) {
              tl.to(titleText, { color: "#00dafd", duration: 0.4, ease: "power1.inOut" }, stepLabel);
            }

            const contentDescText = matchingBlock.querySelector(".hero-content-description");
            if (contentDescText) {
              tl.to(contentDescText, { color: "#ffffff", duration: 0.4, ease: "power1.inOut" }, stepLabel);
            }

            if (index < 4) {
              if (itemDesc1) tl.to(itemDesc1, { color: "#ffffff", duration: 0.4, ease: "power1.inOut" }, stepLabel);
              if (itemDesc2) tl.to(itemDesc2, { color: "#8a8a8a", duration: 0.4, ease: "power1.inOut" }, stepLabel);
            } else if (index === 4) {
              if (itemDesc1) tl.to(itemDesc1, { color: "#8a8a8a", duration: 0.4, ease: "power1.inOut" }, stepLabel);
              if (itemDesc2) tl.to(itemDesc2, { color: "#ffffff", duration: 0.4, ease: "power1.inOut" }, stepLabel);
            }
          }

          if (prevBlock) {
            const prevTitle = prevBlock.querySelector(".hero-content-title");
            if (prevTitle) {
              tl.to(prevTitle, { color: "#8a8a8a", duration: 0.4, ease: "power1.inOut" }, stepLabel);
            }

            const prevDescText = prevBlock.querySelector(".hero-content-description");
            if (prevDescText) {
              tl.to(prevDescText, { color: "#8a8a8a", duration: 0.4, ease: "power1.inOut" }, stepLabel);
            }
          }
        });
      }
    }
  });

  imgWrappers.forEach((wrapper, index) => {
    wrapper.style.cursor = "pointer";
    wrapper.style.pointerEvents = "auto"; 

    wrapper.addEventListener("click", () => {
      if (!tl) return;
      const labelTime = tl.labels[`step_${index}`];
      if (labelTime !== undefined) {
        const scrollST = tl.scrollTrigger;
        const finalTweenTime = labelTime + 0.65;
        const safeTime = Math.min(finalTweenTime, tl.duration());
        const progress = safeTime / tl.duration();
        const targetScroll = scrollST.start + progress * (scrollST.end - scrollST.start);
        
        gsap.killTweensOf(window);
        gsap.to(window, {
          scrollTo: { y: targetScroll, autoKill: false },
          duration: 0.8,
          ease: "power2.out"
        });
      }
    });
  });

  window.addEventListener("resize", () => {
    const isMobileLayout = window.innerWidth <= 992;
    calculateImagePositions(isMobileLayout);
    
    const clones = gsap.utils.toArray(".mera-clone");
    const firstLetters = gsap.utils.toArray(".first-letter", title1);
    const currentWrapRect = wrap.getBoundingClientRect();
    if (clones.length && firstLetters.length) {
      const titleStyle = window.getComputedStyle(title1);
      clones.forEach((clone, i) => {
        if(!firstLetters[i]) return;
        const origRect = firstLetters[i].getBoundingClientRect();
        gsap.set(clone, {
          fontSize: titleStyle.fontSize,
          fontFamily: titleStyle.fontFamily,
          fontWeight: titleStyle.fontWeight,
          lineHeight: titleStyle.lineHeight,
          letterSpacing: titleStyle.letterSpacing,
          left: origRect.left - currentWrapRect.left,
          top: origRect.top - currentWrapRect.top,
        });
      });
      updateMeraCloneTargets(clones, currentWrapRect, 4);
    }
    ScrollTrigger.refresh();
  });
});