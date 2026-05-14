(() => {
  const state = {
    qty: 0,
    scents: [],
    sizeLabel: '',
    blockId: ''
  };

  // @ts-ignore
  function safeQS(selector) {
    return document.querySelector(selector);
  }

  // @ts-ignore
  function safeQSA(selector) {
    return document.querySelectorAll(selector);
  }

  // @ts-ignore
  function startFlow(cardEl) {
    if (!cardEl) return;

    try {
      const scentsJson = cardEl.dataset.scents;
      const qty = parseInt(cardEl.dataset.qty, 10);
      const sizeLabel = cardEl.dataset.sizeLabel;
      const blockId = cardEl.dataset.blockId;

      if (!scentsJson || !qty || !sizeLabel) {
        console.warn('[Great Offer] Missing card data attributes');
        return;
      }

      state.scents = JSON.parse(scentsJson);
      state.qty = qty;
      state.sizeLabel = sizeLabel;
      state.blockId = blockId;
    } catch (e) {
      console.error('[Great Offer] Failed to parse card data:', e);
      return;
    }

    rebuildModal();
    updateSelectionCount();
    const modal = safeQS('#go-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    const modal = safeQS('#go-modal');
    if (modal) {
      modal.classList.remove('active');
    }
    document.body.style.overflow = '';
  }

  function rebuildModal() {
    const grid = safeQS('#go-scent-grid');
    const title = safeQS('#go-modal-title');
    const subtitle = safeQS('#go-modal-subtitle');

    if (!grid || !title || !subtitle) return;

    grid.innerHTML = '';

    state.scents.forEach((scent) => {
      const label = document.createElement('label');
      label.className = 'go-scent-item';
      // @ts-ignore
      if (!scent.available) {
        label.classList.add('go-scent-item--unavailable');
      }

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'go-scent-check';
      // @ts-ignore
      input.dataset.variantId = scent.id;
      // @ts-ignore
      input.disabled = !scent.available;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'go-scent-name';
      // @ts-ignore
      nameSpan.textContent = scent.title;

      label.appendChild(input);
      label.appendChild(nameSpan);
      grid.appendChild(label);

      input.addEventListener('change', handleCheckboxChange);
    });

    title.textContent = `Choose your ${state.qty} × ${state.sizeLabel} bottles`;
    subtitle.textContent = `Select exactly ${state.qty} scents from the list below.`;
  }

  // @ts-ignore
  function handleCheckboxChange(e) {
    const checked = safeQSA('#go-scent-grid .go-scent-check:checked');
    if (checked.length > state.qty) {
      e.target.checked = false;
      return;
    }
    updateSelectionCount();
  }

  function updateSelectionCount() {
    const checked = safeQSA('#go-scent-grid .go-scent-check:checked');
    const countEl = safeQS('#go-selection-count');
    const btnEl = safeQS('#go-confirm-btn');

    if (!countEl || !btnEl) return;

    const n = checked.length;
    countEl.textContent = `${n} of ${state.qty} selected`;
    btnEl.disabled = n !== state.qty;
  }

  function handleConfirm() {
    const btnEl = safeQS('#go-confirm-btn');
    if (!btnEl) return;

    const checked = safeQSA('#go-scent-grid .go-scent-check:checked');
    if (checked.length !== state.qty) {
      return;
    }

    const items = Array.from(checked).map((input) => ({
      id: parseInt(input.dataset.variantId, 10),
      quantity: 1
    }));

    const cartComponents = safeQSA('cart-items-component[data-section-id]');
    const sectionIds = Array.from(cartComponents).map(
      (el) => el.dataset.sectionId
    );

    const payload = {
      items: items,
      sections: sectionIds
    };

    btnEl.disabled = true;
    const originalText = btnEl.textContent;
    btnEl.textContent = 'Adding...';

    removeExistingError();

    fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          showError(
            data.message || 'Could not add to cart. Please try again.'
          );
          resetButton(btnEl, originalText);
          return;
        }

        closeModal();
        setTimeout(() => {
          dispatchCartAddEvent(items.length, data.sections || sectionIds);
        }, 400);
        resetButton(btnEl, originalText);
      })
      .catch((err) => {
        console.error('[Great Offer] ATC error:', err);
        showError('Something went wrong. Please try again.');
        resetButton(btnEl, originalText);
      });
  }

  // @ts-ignore
  function resetButton(btnEl, text) {
    if (!btnEl) return;
    btnEl.disabled = false;
    btnEl.textContent = text || 'Add to cart';
  }

  // @ts-ignore
  function showError(message) {
    removeExistingError();
    const footer = safeQS('.go-modal-footer');
    if (!footer) return;

    const errorEl = document.createElement('p');
    errorEl.className = 'go-atc-error';
    errorEl.textContent = message;
    footer.appendChild(errorEl);
  }

  function removeExistingError() {
    const existing = safeQS('.go-atc-error');
    if (existing) {
      existing.remove();
    }
  }

  // @ts-ignore
  function dispatchCartAddEvent(itemCount, sections) {
    // Event name matches CartAddEvent.eventName (ThemeEvents.cartUpdate = 'cart:update')
    const event = new CustomEvent('cart:update', {
      bubbles: true,
      detail: {
        resource: {},
        sourceId: '',
        data: {
          source: 'product-form-component',
          itemCount: itemCount,
          sections: sections || []
        }
      }
    });
    document.dispatchEvent(event);
  }

  function initEventListeners() {
    const cards = safeQS('.go-cards');
    if (cards) {
      // @ts-ignore
      cards.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="go-start-flow"]');
        if (btn) {
          const card = btn.closest('.go-card');
          startFlow(card);
        }
      });
    }

    const confirmBtn = safeQS('#go-confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', handleConfirm);
    }

    const closeBtn = safeQS('#go-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    const modal = safeQS('#go-modal');
    if (modal) {
      // @ts-ignore
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEventListeners);
  } else {
    initEventListeners();
  }

  // @ts-ignore
  window.goStartFlow = startFlow;
  // @ts-ignore
  window.goCloseModal = closeModal;
})();
