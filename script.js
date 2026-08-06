(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  // Los consentimientos legales siempre parten desmarcados.
  const clearLegalConsent = (scope = document) => {
    $$('[data-legal-checkbox]', scope).forEach((checkbox) => {
      checkbox.checked = false;
      checkbox.defaultChecked = false;
      checkbox.setCustomValidity('');
      const error = checkbox.form ? $('[data-consent-error]', checkbox.form) : null;
      if (error) error.hidden = true;
    });
  };
  clearLegalConsent();
  window.addEventListener('pageshow', () => {
    window.setTimeout(() => clearLegalConsent(), 0);
  });

  // Mobile navigation
  const navToggle = $('[data-nav-toggle]');
  const nav = $('[data-nav]');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    $$('a', nav).forEach((link) => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Abrir menú');
    }));
  }

  // About accordion: one panel open at a time; image remains independent.
  $$('[data-accordion]').forEach((accordion) => {
    $$('.accordion-trigger', accordion).forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.accordion-item');
        const wasOpen = item.classList.contains('is-open');
        $$('.accordion-item', accordion).forEach((entry) => {
          entry.classList.remove('is-open');
          $('.accordion-trigger', entry)?.setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  });

  // Training tabs
  const trainingTabs = $$('.training-tab');
  const trainingPanels = $$('.training-panel');
  const selectTrainingTab = (name, scroll = false) => {
    const targetTab = trainingTabs.find((tab) => tab.dataset.tab === name);
    const targetPanel = trainingPanels.find((panel) => panel.dataset.panel === name);
    if (!targetTab || !targetPanel) return;

    trainingTabs.forEach((tab) => {
      const active = tab === targetTab;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    trainingPanels.forEach((panel) => {
      const active = panel === targetPanel;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
    if (scroll) {
      $('#entrena-conmigo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  trainingTabs.forEach((tab) => tab.addEventListener('click', () => selectTrainingTab(tab.dataset.tab)));
  $$('[data-go-online]').forEach((button) => button.addEventListener('click', () => selectTrainingTab('online', true)));

  // Conditional package field on every form
  const updateSessionField = (form, preferredSession = '') => {
    const serviceSelect = $('[data-service-select]', form);
    const sessionField = $('[data-session-field]', form);
    const sessionSelect = $('[data-session-select]', form);
    if (!serviceSelect || !sessionField || !sessionSelect) return;
    const needsSessions = serviceSelect.value === '1:1 Online' || serviceSelect.value === '1:1 Presencial';
    sessionField.hidden = !needsSessions;
    sessionSelect.required = needsSessions;
    sessionSelect.disabled = !needsSessions;
    if (!needsSessions) {
      sessionSelect.value = '';
    } else if (preferredSession) {
      sessionSelect.value = preferredSession;
    }
  };

  $$('[data-contact-form]').forEach((form) => {
    const serviceSelect = $('[data-service-select]', form);
    serviceSelect?.addEventListener('change', () => updateSessionField(form));
    updateSessionField(form);
  });

  // Contact modal
  const modal = $('[data-contact-modal]');
  const modalForm = modal ? $('[data-contact-form]', modal) : null;
  let lastFocused = null;

  const openModal = (service = '', sessions = '') => {
    if (!modal || !modalForm) return;
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    clearLegalConsent(modalForm);
    const serviceSelect = $('[data-service-select]', modalForm);
    const sessionSelect = $('[data-session-select]', modalForm);
    if (serviceSelect && service) serviceSelect.value = service;
    updateSessionField(modalForm, sessions);
    if (sessionSelect && sessions && !sessionSelect.disabled) sessionSelect.value = sessions;

    window.setTimeout(() => $('input[name="nombre"]', modalForm)?.focus(), 80);
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  };

  $$('.open-contact').forEach((button) => {
    button.addEventListener('click', () => openModal(button.dataset.service || '', button.dataset.sessions || ''));
  });
  $$('[data-modal-close]').forEach((element) => element.addEventListener('click', closeModal));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
  });

  const setStatus = (form, message, type = '') => {
    const status = $('[data-form-status]', form);
    if (!status) return;
    status.textContent = message;
    status.className = `form-status ${type}`.trim();
  };

  const validateConsent = (form) => {
    const checkbox = $('[data-legal-checkbox]', form);
    const error = $('[data-consent-error]', form);
    if (!checkbox) return true;
    if (!checkbox.checked) {
      checkbox.setCustomValidity('Debes aceptar los documentos legales para continuar.');
      if (error) error.hidden = false;
      return false;
    }
    checkbox.setCustomValidity('');
    if (error) error.hidden = true;
    return true;
  };

  $$('[data-legal-checkbox]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => validateConsent(checkbox.form));
  });

  // Formspree submission
  $$('[data-contact-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus(form, '');
      const consentOk = validateConsent(form);
      if (!consentOk || !form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const submit = $('button[type="submit"]', form);
      const originalText = submit?.textContent || 'Enviar Mensaje';
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Enviando...';
      }

      const data = new FormData(form);
      data.set('fecha_aceptacion_legal', new Date().toISOString());
      data.set('pagina', window.location.href);
      data.set('origen', form.dataset.origin || data.get('origen') || 'Formulario web');

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Formspree response was not successful');

        setStatus(form, '¡Mensaje enviado con éxito! Te responderemos en un plazo máximo de 24 a 48 horas.', 'success');
        form.reset();
        updateSessionField(form);
        const consent = $('[data-legal-checkbox]', form);
        const consentError = $('[data-consent-error]', form);
        consent?.setCustomValidity('');
        if (consentError) consentError.hidden = true;
      } catch (error) {
        setStatus(form, 'Hubo un error al enviar tu mensaje. Por favor, inténtalo nuevamente.', 'error');
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.textContent = originalText;
        }
      }
    });
  });
})();
