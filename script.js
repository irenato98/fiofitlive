const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('#nav-links');
menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!open));
  navLinks.classList.toggle('is-open', !open);
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('[data-accordion] .accordion-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.accordion-item');
    const panel = item.querySelector('.accordion-panel');
    const group = item.parentElement;
    const willOpen = !item.classList.contains('is-open');

    group.querySelectorAll('.accordion-item').forEach(other => {
      other.classList.remove('is-open');
      const otherTrigger = other.querySelector('.accordion-trigger');
      const otherPanel = other.querySelector('.accordion-panel');
      otherTrigger.setAttribute('aria-expanded', 'false');
      otherTrigger.querySelector('.circle-arrow').textContent = '→';
      otherPanel.hidden = true;
    });

    if (willOpen) {
      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      trigger.querySelector('.circle-arrow').textContent = '↑';
      panel.hidden = false;
    }
  });
});

const contactModal = document.querySelector('#contact-modal');
const contactForm = document.querySelector('#contact-form');
const planSelect = document.querySelector('#plan-select');
const status = document.querySelector('.form-status');

function openContact(plan = '') {
  if (plan && ![...planSelect.options].some(option => option.value === plan)) {
    const option = new Option(plan, plan, true, true);
    planSelect.add(option);
  } else if (plan) {
    planSelect.value = plan;
  }
  status.textContent = '';
  contactModal.showModal();
  setTimeout(() => contactForm.querySelector('input')?.focus(), 50);
}

document.querySelectorAll('.open-contact').forEach(button => {
  button.addEventListener('click', () => openContact(button.dataset.plan || ''));
});

document.querySelector('#contact-modal .modal-close').addEventListener('click', () => contactModal.close());
contactModal.addEventListener('click', event => {
  if (event.target === contactModal) contactModal.close();
});

contactForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;

  const data = new FormData(contactForm);
  const name = String(data.get('name') || '').trim();
  const submitButton = contactForm.querySelector('[type="submit"]');
  const originalText = submitButton.textContent;

  submitButton.disabled = true;
  submitButton.textContent = 'Enviando…';
  status.textContent = '';

  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      body: data,
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Formspree rechazó el envío');
    }

    status.textContent = `¡Gracias, ${name}! Tu solicitud fue enviada correctamente.`;
    contactForm.reset();

    setTimeout(() => {
      if (contactModal.open) contactModal.close();
      status.textContent = '';
    }, 2400);
  } catch (error) {
    console.error(error);
    status.textContent = 'No se pudo enviar. Revisa tu conexión e inténtalo nuevamente.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
});

const imageModal = document.querySelector('#image-modal');
const lightboxImage = document.querySelector('#lightbox-image');
document.querySelectorAll('.gallery-item').forEach(button => {
  button.addEventListener('click', () => {
    lightboxImage.src = button.dataset.image;
    lightboxImage.alt = button.querySelector('img').alt;
    imageModal.showModal();
  });
});
document.querySelector('.image-close').addEventListener('click', () => imageModal.close());
imageModal.addEventListener('click', event => {
  if (event.target === imageModal) imageModal.close();
});

const legalModal = document.querySelector('#legal-modal');
const legalTitle = document.querySelector('#legal-title');
document.querySelectorAll('.legal-link').forEach(button => {
  button.addEventListener('click', () => {
    legalTitle.textContent = button.dataset.legal;
    legalModal.showModal();
  });
});
document.querySelectorAll('.legal-close').forEach(button => button.addEventListener('click', () => legalModal.close()));
legalModal.addEventListener('click', event => {
  if (event.target === legalModal) legalModal.close();
});
