/**
 * iA Tech - JavaScript Interactive Logic & Course Viewer
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Header Height Measurement ---
  const header = document.getElementById('site-header') || document.querySelector('.navbar');
  function updateNavHeight() {
    if (header) {
      const height = header.offsetHeight;
      document.documentElement.style.setProperty('--nav-height', `${height}px`);
    }
  }
  updateNavHeight();
  window.addEventListener('resize', updateNavHeight);

  // --- Course Viewer Logic ---
  const courseContainer = document.getElementById('course-container');
  const courseFrame = document.getElementById('course-frame');
  const btnCursoPcGamer = document.getElementById('btn-curso-pcgamer');
  const navCursoLink = document.getElementById('nav-curso-link');
  const navLogoHome = document.getElementById('nav-logo-home');
  const portalNavLinks = document.querySelectorAll('.portal-nav-link');

  function openCourse() {
    updateNavHeight();
    if (courseContainer) {
      courseContainer.classList.remove('hidden');
    }
    if (courseFrame && (!courseFrame.src || courseFrame.src === 'about:blank' || courseFrame.getAttribute('src') === 'about:blank')) {
      const targetSrc = courseFrame.getAttribute('data-src') || 'pc-gamer/index.html';
      courseFrame.src = targetSrc;
    }
    document.body.classList.add('course-open');

    if (window.location.hash !== '#curso-pc-gamer') {
      history.pushState(null, '', '#curso-pc-gamer');
    }
  }

  function closeCourse() {
    if (courseContainer) {
      courseContainer.classList.add('hidden');
    }
    document.body.classList.remove('course-open');

    if (window.location.hash === '#curso-pc-gamer') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  // Trigger from Hero Yellow Button
  if (btnCursoPcGamer) {
    btnCursoPcGamer.addEventListener('click', (e) => {
      e.preventDefault();
      openCourse();
    });
  }

  // Trigger from Product Card Button
  const btnCardCursoPcGamer = document.getElementById('btn-card-curso-pcgamer');
  if (btnCardCursoPcGamer) {
    btnCardCursoPcGamer.addEventListener('click', (e) => {
      e.preventDefault();
      openCourse();
    });
  }

  // Trigger from Navbar Link
  if (navCursoLink) {
    navCursoLink.addEventListener('click', (e) => {
      e.preventDefault();
      openCourse();
    });
  }

  // Back to home on Logo click
  if (navLogoHome) {
    navLogoHome.addEventListener('click', (e) => {
      e.preventDefault();
      closeCourse();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Close course and scroll when standard navigation links are clicked
  portalNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeCourse();
    });
  });

  // Handle URL hash on initial load or popstate
  if (window.location.hash === '#curso-pc-gamer') {
    openCourse();
  }

  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#curso-pc-gamer') {
      openCourse();
    } else {
      closeCourse();
    }
  });

  // --- Email Obfuscation & Copy to Clipboard ---
  // Base64 encoded email string to protect from automated spam bots
  // Original email: atendimento.iatech@gmail.com.br
  const obfuscatedEmailB64 = "YXRlbmRpbWVudG8uaWF0ZWNoQGdtYWlsLmNvbS5icg==";
  
  const emailContainer = document.getElementById('email-placeholder');
  const emailMailtoBtn = document.getElementById('email-mailto-btn');
  const copyBtn = document.getElementById('copy-email-btn');
  const toast = document.getElementById('toast-copied');

  let decodedEmail = "";

  try {
    // Decode email string in browser memory only
    decodedEmail = atob(obfuscatedEmailB64);
  } catch (e) {
    decodedEmail = "atendimento.iatech [at] gmail.com.br";
  }

  // Inject decoded email into DOM dynamically
  if (emailContainer) {
    emailContainer.textContent = decodedEmail;
  }

  if (emailMailtoBtn) {
    emailMailtoBtn.setAttribute('href', 'mailto:' + decodedEmail);
  }

  // Handle Copy to Clipboard functionality
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!decodedEmail) return;

      navigator.clipboard.writeText(decodedEmail).then(() => {
        showToast("E-mail copiado para a área de transferência!");
      }).catch(err => {
        // Fallback copy method
        const tempInput = document.createElement('input');
        tempInput.value = decodedEmail;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast("E-mail copiado!");
      });
    });
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
});
