/**
 * iA Tech - JavaScript Interactive Logic & Email Obfuscation
 */

document.addEventListener('DOMContentLoaded', () => {
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
