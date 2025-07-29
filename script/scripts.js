// Variáveis globais para o slider
let currentSlide = 0;
let slides = [];
let indicators = [];
let totalSlides = 0;
let slideInterval;
let isTransitioning = false;
let touchStartX = 0;
let touchEndX = 0;

// Configurações
const SLIDE_DURATION = 5000; // 5 segundos
const TRANSITION_DURATION = 1000; // 1 segundo
const TOUCH_THRESHOLD = 50; // Mínimo de pixels para swipe

// Debounce function para otimização
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function para eventos de scroll
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Inicialização quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", function () {
  initializeSlider();
  initializeScrollEffects();
  initializeMobileMenu();
  initializeFormSubmission();
  initializeSmoothScrolling();
  initializeTouchEvents();
  initializeKeyboardNavigation();
  initializeResizeHandler();
});

// ===== SLIDER FUNCTIONS - OTIMIZADAS =====

// Inicializar slider
function initializeSlider() {
  // Atualizar referências dos elementos
  slides = document.querySelectorAll(".slide");
  indicators = document.querySelectorAll(".indicator");
  totalSlides = slides.length;

  if (totalSlides === 0) return;

  // Preload da primeira imagem
  preloadSlideImage(0);

  showSlide(0);
  startAutoSlide();

  // Pausar auto-slide quando hover no slider (apenas desktop)
  const sliderContainer = document.querySelector(".hero-slider");
  if (sliderContainer && !isMobileDevice()) {
    sliderContainer.addEventListener("mouseenter", stopAutoSlide);
    sliderContainer.addEventListener("mouseleave", startAutoSlide);
  }

  // Lazy load das outras imagens
  setTimeout(() => {
    for (let i = 1; i < totalSlides; i++) {
      preloadSlideImage(i);
    }
  }, 100);
}

// Preload de imagem específica
function preloadSlideImage(index) {
  if (slides[index]) {
    const img = slides[index].querySelector("img");
    if (img && !img.complete) {
      img.loading = "lazy";
    }
  }
}

// Mostrar slide específico com melhor performance
function showSlide(index) {
  if (isTransitioning || index === currentSlide) return;

  isTransitioning = true;

  // Remover classe active de todos os slides e indicadores
  slides.forEach((slide, i) => {
    slide.classList.remove("active");
    // Otimização: apenas aplicar transform se necessário
    if (i === index) {
      slide.style.zIndex = "2";
    } else {
      slide.style.zIndex = "1";
    }
  });

  indicators.forEach((indicator) => indicator.classList.remove("active"));

  // Adicionar classe active ao slide e indicador atual
  if (slides[index]) {
    slides[index].classList.add("active");
    // Preload da próxima imagem
    const nextIndex = (index + 1) % totalSlides;
    preloadSlideImage(nextIndex);
  }

  if (indicators[index]) {
    indicators[index].classList.add("active");
  }

  currentSlide = index;

  // Reset do flag de transição
  setTimeout(() => {
    isTransitioning = false;
  }, TRANSITION_DURATION);
}

// Mudar slide (próximo/anterior) com validação
function changeSlide(direction) {
  if (isTransitioning) return;

  let newSlide = currentSlide + direction;

  if (newSlide >= totalSlides) {
    newSlide = 0;
  } else if (newSlide < 0) {
    newSlide = totalSlides - 1;
  }

  showSlide(newSlide);
  resetAutoSlide();
}

// Ir para slide específico
function currentSlideFunc(index) {
  if (isTransitioning) return;

  const slideIndex = index - 1;
  if (slideIndex >= 0 && slideIndex < totalSlides) {
    showSlide(slideIndex);
    resetAutoSlide();
  }
}

// Iniciar auto-slide com verificação de visibilidade
function startAutoSlide() {
  // Não iniciar se a página não estiver visível
  if (document.hidden) return;

  stopAutoSlide(); // Limpar qualquer interval existente

  slideInterval = setInterval(() => {
    // Verificar se a página ainda está visível
    if (!document.hidden) {
      changeSlide(1);
    }
  }, SLIDE_DURATION);
}

// Parar auto-slide
function stopAutoSlide() {
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = null;
  }
}

// Resetar auto-slide
function resetAutoSlide() {
  stopAutoSlide();
  startAutoSlide();
}

// ===== TOUCH EVENTS PARA MOBILE =====

function initializeTouchEvents() {
  const sliderContainer = document.querySelector(".hero-slider");
  if (!sliderContainer) return;

  // Touch events
  sliderContainer.addEventListener("touchstart", handleTouchStart, {
    passive: true,
  });
  sliderContainer.addEventListener("touchend", handleTouchEnd, {
    passive: true,
  });

  // Mouse events para desktop (drag)
  sliderContainer.addEventListener("mousedown", handleMouseDown);
  sliderContainer.addEventListener("mouseup", handleMouseUp);
}

function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX;
}

function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].clientX;
  handleSwipe();
}

function handleMouseDown(e) {
  touchStartX = e.clientX;
  document.addEventListener("mouseup", handleMouseUp);
}

function handleMouseUp(e) {
  touchEndX = e.clientX;
  handleSwipe();
  document.removeEventListener("mouseup", handleMouseUp);
}

function handleSwipe() {
  const swipeDistance = touchStartX - touchEndX;

  if (Math.abs(swipeDistance) > TOUCH_THRESHOLD) {
    if (swipeDistance > 0) {
      // Swipe left - próximo slide
      changeSlide(1);
    } else {
      // Swipe right - slide anterior
      changeSlide(-1);
    }
  }
}

// ===== NAVEGAÇÃO POR TECLADO =====

function initializeKeyboardNavigation() {
  document.addEventListener("keydown", (e) => {
    // Apenas funcionar se o slider estiver visível
    const sliderContainer = document.querySelector(".hero-slider");
    if (!sliderContainer || !isElementInViewport(sliderContainer)) return;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        changeSlide(-1);
        break;
      case "ArrowRight":
        e.preventDefault();
        changeSlide(1);
        break;
      case "Home":
        e.preventDefault();
        currentSlideFunc(1);
        break;
      case "End":
        e.preventDefault();
        currentSlideFunc(totalSlides);
        break;
    }
  });
}

// ===== HANDLER DE REDIMENSIONAMENTO =====

function initializeResizeHandler() {
  const debouncedResize = debounce(() => {
    // Recalcular dimensões se necessário
    adjustSliderHeight();
  }, 250);

  window.addEventListener("resize", debouncedResize);
  window.addEventListener("orientationchange", debouncedResize);
}

function adjustSliderHeight() {
  const slider = document.querySelector(".hero-slider");
  if (!slider) return;

  // Ajustar altura baseado na orientação em mobile
  if (isMobileDevice()) {
    const isLandscape = window.innerWidth > window.innerHeight;
    if (isLandscape && window.innerHeight < 500) {
      slider.style.height = "100vh";
    } else {
      slider.style.height = ""; // Reset para CSS
    }
  }
}

// ===== VISIBILITY API PARA PERFORMANCE =====

// Pausar/retomar slider baseado na visibilidade da página
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAutoSlide();
  } else {
    startAutoSlide();
  }
});

// ===== UTILITY FUNCTIONS =====

function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768
  );
}

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// ===== OUTRAS FUNCIONALIDADES (MANTIDAS E OTIMIZADAS) =====

// Efeitos de scroll otimizados
function initializeScrollEffects() {
  // Observador de interseção para animações
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in-up");
      }
    });
  }, observerOptions);

  // Observar elementos para animação
  const elementsToAnimate = document.querySelectorAll(
    ".servico-card, .empresa-text, .empresa-image, .contato-form, .info-item"
  );
  elementsToAnimate.forEach((el) => observer.observe(el));

  // Efeito parallax no header (throttled)
  const throttledScroll = throttle(() => {
    const scrolled = window.pageYOffset;
    const header = document.querySelector(".header");

    if (header) {
      if (scrolled > 100) {
        header.style.background = "rgba(255, 255, 255, 0.98)";
        header.style.boxShadow = "0 2px 30px rgba(0, 0, 0, 0.15)";
      } else {
        header.style.background = "rgba(255, 255, 255, 0.95)";
        header.style.boxShadow = "0 2px 20px rgba(0, 0, 0, 0.1)";
      }
    }
  }, 16); // ~60fps

  window.addEventListener("scroll", throttledScroll, { passive: true });
}

// Menu mobile otimizado
function initializeMobileMenu() {
  const mobileToggle = document.querySelector(".mobile-menu-toggle");
  const nav = document.querySelector(".nav");

  if (mobileToggle && nav) {
    mobileToggle.addEventListener("click", (e) => {
      e.preventDefault();
      nav.classList.toggle("active");
      mobileToggle.classList.toggle("active");

      // Melhor acessibilidade
      const isOpen = nav.classList.contains("active");
      mobileToggle.setAttribute("aria-expanded", isOpen);
      nav.setAttribute("aria-hidden", !isOpen);
    });

    // Fechar menu ao clicar em um link
    const navLinks = document.querySelectorAll(".nav a");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("active");
        mobileToggle.classList.remove("active");
        mobileToggle.setAttribute("aria-expanded", "false");
        nav.setAttribute("aria-hidden", "true");
      });
    });

    // Fechar menu ao clicar fora
    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && !mobileToggle.contains(e.target)) {
        nav.classList.remove("active");
        mobileToggle.classList.remove("active");
        mobileToggle.setAttribute("aria-expanded", "false");
        nav.setAttribute("aria-hidden", "true");
      }
    });
  }
}

// Submissão do formulário (mantida)
function initializeFormSubmission() {
  const form = document.querySelector(".contato-form form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Simular envio do formulário
      const submitBtn = form.querySelector(".btn-submit");
      const originalText = submitBtn.textContent;

      submitBtn.textContent = "Enviando...";
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.textContent = "Mensagem Enviada!";
        submitBtn.style.background =
          "linear-gradient(135deg, #28a745, #20c997)";

        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          submitBtn.style.background =
            "linear-gradient(135deg, var(--primary-brown), var(--dark-brown))";
          form.reset();
        }, 2000);
      }, 1500);
    });
  }
}

// Scroll suave otimizado
function initializeSmoothScrolling() {
  const navLinks = document.querySelectorAll('a[href^="#"]');

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const targetId = link.getAttribute("href");
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const headerHeight =
          document.querySelector(".header")?.offsetHeight || 80;
        const targetPosition = targetSection.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    });
  });
}

// Função para adicionar efeito de hover nos cards de serviço (otimizada)
function initializeServiceCards() {
  const serviceCards = document.querySelectorAll(".servico-card");

  serviceCards.forEach((card) => {
    // Usar apenas CSS para hover em dispositivos touch
    if (!isMobileDevice()) {
      card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-10px) scale(1.02)";
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0) scale(1)";
      });
    }
  });
}

// Função para animar números das estatísticas (otimizada)
function animateStats() {
  const stats = document.querySelectorAll(".stat h4");

  const animateNumber = (element, target) => {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current) + (target >= 100 ? "+" : "");
    }, 30);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const text = entry.target.textContent;
        const number = parseInt(text.replace(/\D/g, ""));
        if (!isNaN(number)) {
          animateNumber(entry.target, number);
          observer.unobserve(entry.target);
        }
      }
    });
  });

  stats.forEach((stat) => observer.observe(stat));
}

// Lazy loading otimizado
function initializeLazyLoading() {
  // Usar Intersection Observer nativo se disponível
  if ("IntersectionObserver" in window) {
    const images = document.querySelectorAll("img[data-src]");

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove("lazy");
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  }
}

// CSS dinâmico para mobile menu
const style = document.createElement("style");
style.textContent = `
  .nav.active {
    display: flex !important;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.98);
    flex-direction: column;
    padding: 20px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    z-index: 999;
  }
  
  .nav.active ul {
    flex-direction: column;
    gap: 20px;
  }
  
  .mobile-menu-toggle.active span:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
  }
  
  .mobile-menu-toggle.active span:nth-child(2) {
    opacity: 0;
  }
  
  .mobile-menu-toggle.active span:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -6px);
  }
  
  /* Melhorias para performance */
  .slide {
    will-change: opacity;
  }
  
  .slide img {
    will-change: transform;
  }
  
  /* Prevenção de layout shift */
  .hero-slider {
    contain: layout style paint;
  }
`;
document.head.appendChild(style);

// Inicializar funcionalidades adicionais quando a página carregar
window.addEventListener("load", () => {
  initializeServiceCards();
  animateStats();
  initializeLazyLoading();
  adjustSliderHeight();
});

// Funções globais para compatibilidade com HTML
window.changeSlide = changeSlide;
window.currentSlide = currentSlideFunc;

// Performance monitoring (opcional - apenas em desenvolvimento)
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  console.log("Slider inicializado com", totalSlides, "slides");

  // Monitor de performance
  let slideChangeCount = 0;
  const originalChangeSlide = changeSlide;
  window.changeSlide = function (direction) {
    slideChangeCount++;
    console.log("Slide change #", slideChangeCount, "Direction:", direction);
    return originalChangeSlide(direction);
  };
}
