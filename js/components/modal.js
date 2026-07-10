/**
 * Modal component
 */
(function (global) {
  class Modal {
    constructor(root) {
      this.root = root;
      this.panel = root.querySelector(".modal__panel");
      this.titleEl = root.querySelector("[data-modal-title]");
      this.scoreEl = root.querySelector("[data-modal-score]");
      this.metaEl = root.querySelector("[data-modal-meta]");
      this.bodyEl = root.querySelector("[data-modal-body]");
      this.onAction = null;

      root.addEventListener("click", (e) => {
        const action = e.target.closest("[data-modal-action]")?.dataset.modalAction;
        if (action && typeof this.onAction === "function") {
          this.onAction(action);
        }
      });
    }

    open({ title, score, meta, body }) {
      this.titleEl.textContent = title;
      this.scoreEl.textContent = String(score);
      this.metaEl.textContent = meta || "";
      this.bodyEl.textContent = body || "";
      this.root.classList.add("is-open");
      this.root.setAttribute("aria-hidden", "false");
      const focusBtn = this.root.querySelector("[data-modal-action]");
      focusBtn?.focus();
    }

    close() {
      this.root.classList.remove("is-open");
      this.root.setAttribute("aria-hidden", "true");
    }

    get isOpen() {
      return this.root.classList.contains("is-open");
    }
  }

  global.Modal = Modal;
})(window);
