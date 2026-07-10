/**
 * Toast component
 */
(function (global) {
  class Toast {
    constructor(host) {
      this.host = host;
    }

    show(message, duration = 1400) {
      const el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      el.textContent = message;
      this.host.appendChild(el);

      window.setTimeout(() => {
        el.classList.add("is-out");
        window.setTimeout(() => el.remove(), 160);
      }, duration);
    }
  }

  global.Toast = Toast;
})(window);
