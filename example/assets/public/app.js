(function initExampleSite() {
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');
  var backdrop = document.getElementById('nav-backdrop');
  var route = document.body.getAttribute('data-route') || location.pathname;
  var lightbox = document.getElementById('photo-lightbox');
  var lightboxImage = document.getElementById('lightbox-img');
  var scrollHint = document.querySelector('.scroll-hint');
  var imageLoadingObserver = null;

  if (nav) {
    var links = nav.querySelectorAll('a[href]');
    for (var index = 0; index < links.length; index += 1) {
      var link = links[index];
      var href = link.getAttribute('href');
      if ((href === '/' && route === '/') || (href !== '/' && route.indexOf(href) === 0)) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      }
    }
  }

  function closeNav() {
    document.body.classList.remove('nav-open');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation');
    }
  }

  function syncHeaderState() {
    document.body.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  function getHomeStageScrollMinHeight() {
    var rawValue = window.getComputedStyle(document.body).getPropertyValue('--home-stage-scroll-min-height');
    var minHeight = parseFloat(rawValue);
    return Number.isFinite(minHeight) ? minHeight : 820;
  }

  function isHomeStageScrollReady() {
    return route === '/'
      && window.innerWidth >= 981
      && window.innerHeight >= getHomeStageScrollMinHeight();
  }

  function syncHomeStageState() {
    document.body.classList.toggle('home-stage-scroll-ready', isHomeStageScrollReady());
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function toggleNav() {
      var isOpen = document.body.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeNav);
  }

  if (nav) {
    nav.addEventListener('click', function handleNavClick(event) {
      if (event.target.closest('a')) {
        closeNav();
      }
    });
  }

  window.addEventListener('resize', function handleResize() {
    if (window.innerWidth > 860) {
      closeNav();
    }

    syncHomeStageState();
  });

  window.addEventListener('scroll', syncHeaderState, { passive: true });

  function initSmoothScroll() {
    if (route !== '/') {
      return;
    }

    var markdownWrap = document.querySelector('.markdown-wrap');
    var scrollTarget = document.querySelector('.query-block') || markdownWrap;
    if (!markdownWrap) {
      return;
    }

    var isScrolling = false;
    var scrollTimeout = null;

    window.addEventListener('wheel', function handleWheel(event) {
      if (!isHomeStageScrollReady()) {
        return;
      }

      if (isScrolling) {
        event.preventDefault();
        return;
      }

      if (window.scrollY <= 30 && event.deltaY > 0) {
        event.preventDefault();
        isScrolling = true;

        var targetY = scrollTarget.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function releaseScrollLock() {
          isScrolling = false;
        }, 850);
      }
    }, { passive: false });
  }

  function initScrollHint() {
    if (!scrollHint || route !== '/') {
      return;
    }

    function toggleScrollHint() {
      if (!document.body.classList.contains('home-stage-scroll-ready') || window.scrollY > 100) {
        scrollHint.classList.remove('visible');
      } else {
        scrollHint.classList.add('visible');
      }
    }

    toggleScrollHint();
    window.addEventListener('scroll', toggleScrollHint, { passive: true });
  }

  function fallbackCopyText(text) {
    var input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', 'readonly');
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }

  function copyText(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text);
    }

    fallbackCopyText(text);
    return Promise.resolve();
  }

  function initCommandCopy() {
    var copyButtons = document.querySelectorAll('[data-copy-command]');
    for (var buttonIndex = 0; buttonIndex < copyButtons.length; buttonIndex += 1) {
      var button = copyButtons[buttonIndex];
      if (button.dataset.copyBound === 'true') {
        continue;
      }

      button.dataset.copyBound = 'true';
      button.addEventListener('click', function handleCopyClick(event) {
        var currentButton = event.currentTarget;
        var container = currentButton.closest('[data-copy-text]');
        var text = container ? container.getAttribute('data-copy-text') : '';
        var originalLabel = currentButton.getAttribute('data-copy-label') || currentButton.textContent;

        if (!currentButton.getAttribute('data-copy-label')) {
          currentButton.setAttribute('data-copy-label', originalLabel);
        }

        if (!text) {
          return;
        }

        copyText(text).then(function handleCopySuccess() {
          currentButton.textContent = 'Copied';
          currentButton.classList.add('is-copied');
          window.setTimeout(function restoreCopyLabel() {
            currentButton.textContent = originalLabel;
            currentButton.classList.remove('is-copied');
          }, 1400);
        }).catch(function handleCopyFailure() {
          currentButton.textContent = 'Retry';
          currentButton.classList.remove('is-copied');
          window.setTimeout(function restoreFailedLabel() {
            currentButton.textContent = originalLabel;
          }, 1400);
        });
      });
    }
  }

  function setAccordionState(item, isOpen) {
    if (!item) {
      return;
    }

    var trigger = item.querySelector('.accordion-item__trigger');
    var panel = item.querySelector('.accordion-item__panel');
    if (!trigger || !panel) {
      return;
    }

    item.classList.toggle('is-open', isOpen);
    trigger.setAttribute('aria-expanded', String(isOpen));
    panel.hidden = !isOpen;
  }

  function closeSiblingAccordionItems(currentItem) {
    var group = currentItem && currentItem.parentElement;
    if (!group) {
      return;
    }

    var items = group.querySelectorAll('.accordion-item');
    for (var itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
      var item = items[itemIndex];
      if (item !== currentItem) {
        setAccordionState(item, false);
      }
    }
  }

  function initAccordions() {
    var groups = document.querySelectorAll('.accordion-list');
    for (var groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      var group = groups[groupIndex];
      var items = group.querySelectorAll('.accordion-item');
      for (var itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
        var item = items[itemIndex];
        var trigger = item.querySelector('.accordion-item__trigger');
        if (!trigger || trigger.dataset.accordionBound === 'true') {
          continue;
        }

        trigger.dataset.accordionBound = 'true';
        setAccordionState(item, false);
        trigger.addEventListener('click', function handleAccordionClick(event) {
          var currentTrigger = event.currentTarget;
          var currentItem = currentTrigger.closest('.accordion-item');
          var isOpen = currentTrigger.getAttribute('aria-expanded') === 'true';

          closeSiblingAccordionItems(currentItem);
          setAccordionState(currentItem, !isOpen);
        });
      }
    }
  }

  function updateImageFrameState(img, isLoaded) {
    var frame = img.closest('.hero-visual, .member-card__avatar, .latest-news__photo, .news-card__photo, .photo-card');
    if (!frame) {
      return;
    }

    frame.classList.toggle('is-loading', !isLoaded);
  }

  function markImageLoaded(img) {
    img.classList.add('loaded');
    updateImageFrameState(img, true);
  }

  function bindImageLoading(img) {
    if (img.dataset.imageLoadingBound === 'true') {
      return;
    }

    img.dataset.imageLoadingBound = 'true';
    img.addEventListener('load', function handleImageLoad() {
      markImageLoaded(img);
    }, { once: true });
    img.addEventListener('error', function handleImageError() {
      markImageLoaded(img);
    }, { once: true });
  }

  function initImageLoading() {
    var images = document.querySelectorAll('img');
    for (var imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
      var img = images[imageIndex];
      if (img.complete) {
        markImageLoaded(img);
      } else {
        updateImageFrameState(img, false);
        bindImageLoading(img);
      }
    }
  }

  function shouldRefreshImageLoading(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    if (node.matches('img, .hero-visual, .member-card__avatar, .latest-news__photo, .news-card__photo, .photo-card')) {
      return true;
    }

    return Boolean(node.querySelector('img'));
  }

  function initImageLoadingObserver() {
    if (typeof MutationObserver !== 'function' || imageLoadingObserver || !document.body) {
      return;
    }

    imageLoadingObserver = new MutationObserver(function handleImageMutations(mutations) {
      for (var mutationIndex = 0; mutationIndex < mutations.length; mutationIndex += 1) {
        var mutation = mutations[mutationIndex];
        for (var nodeIndex = 0; nodeIndex < mutation.addedNodes.length; nodeIndex += 1) {
          if (shouldRefreshImageLoading(mutation.addedNodes[nodeIndex])) {
            initImageLoading();
            return;
          }
        }
      }
    });

    imageLoadingObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  document.addEventListener('click', function handlePhotoCard(event) {
    var card = event.target.closest('.photo-card');
    if (!lightbox || !lightboxImage) {
      return;
    }

    if (!card) {
      if (lightbox.classList.contains('open') && event.target === lightbox) {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
      }
      return;
    }

    var src = card.getAttribute('data-src');
    var image = card.querySelector('img');
    if (!src || !image) {
      return;
    }

    lightboxImage.src = src;
    lightboxImage.alt = image.alt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  });

  if (lightbox) {
    lightbox.addEventListener('click', function closeLightbox() {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
    });
  }

  document.addEventListener('keydown', function handleEscape(event) {
    if (event.key === 'Escape') {
      if (lightbox && lightbox.classList.contains('open')) {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
      }

      if (document.body.classList.contains('nav-open')) {
        closeNav();
      }
    }
  });

  initImageLoadingObserver();
  initImageLoading();
  initAccordions();
  initCommandCopy();
  syncHomeStageState();
  initSmoothScroll();
  initScrollHint();
  syncHeaderState();
}());
