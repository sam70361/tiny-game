/**
 * Board — 3x3 holes with mole pop animation
 */
(function (global) {
  class Board {
    constructor(container, options = {}) {
      this.container = container;
      this.options = {
        holes: 9,
        moleIdle: "assets/images/mole-idle.png",
        moleHit: "assets/images/mole-hit.png",
        hammerHit: "assets/images/hammer.svg",
        ...options,
      };
      this.holes = [];
      this.active = new Set();
      this.onHit = null;
      this.onMiss = null;
      this.enabled = false;
      this._onDown = null;
    }

    mount() {
      const grid = document.createElement("div");
      grid.className = "board__grid";
      grid.setAttribute("role", "group");
      grid.setAttribute("aria-label", "地鼠洞");

      this.holes = [];
      for (let i = 0; i < this.options.holes; i++) {
        const hole = this.createHole(i);
        this.holes.push(hole);
        grid.appendChild(hole.el);
      }

      this.container.innerHTML = "";
      this.container.appendChild(grid);
      this.bindEvents();
    }

    createHole(index) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "hole";
      el.dataset.index = String(index);
      el.setAttribute("aria-label", `地洞 ${index + 1}`);

      const { moleIdle, moleHit, hammerHit } = this.options;
      el.innerHTML = `
        <img
          class="hole__grass"
          src="assets/images/grass.png"
          alt=""
          width="1024"
          height="391"
          draggable="false"
          decoding="async"
          aria-hidden="true"
        />
        <span class="hole__well" aria-hidden="true">
          <span class="mole">
            <img
              class="mole__img mole__img--idle"
              src="${moleIdle}"
              alt=""
              width="800"
              height="640"
              draggable="false"
              decoding="async"
            />
            <img
              class="mole__img mole__img--hit"
              src="${moleHit}"
              alt=""
              width="800"
              height="640"
              draggable="false"
              decoding="async"
            />
          </span>
        </span>
        <span class="fx-burst" aria-hidden="true">
          <img
            class="fx-burst__hammer"
            src="${hammerHit}"
            alt=""
            width="48"
            height="48"
            draggable="false"
          />
        </span>
      `;

      return {
        el,
        index,
        up: false,
        timer: null,
        hitTimer: null,
      };
    }

    bindEvents() {
      if (this._onDown) this.container.removeEventListener("pointerdown", this._onDown);

      this._onDown = (e) => {
        if (!this.enabled) return;
        const holeEl = e.target.closest(".hole");
        if (!holeEl) return;
        e.preventDefault();
        const index = Number(holeEl.dataset.index);
        this.handleWhack(index);
      };

      this.container.addEventListener("pointerdown", this._onDown);
    }

    handleWhack(index) {
      const hole = this.holes[index];
      if (!hole) return;

      if (hole.up) {
        this.hide(index, true);
        if (typeof this.onHit === "function") this.onHit(index);
      } else {
        if (typeof this.onMiss === "function") this.onMiss(index);
      }
    }

    show(index, durationMs) {
      const hole = this.holes[index];
      if (!hole || hole.up) return false;

      hole.up = true;
      this.active.add(index);
      hole.el.classList.remove("is-hit");
      hole.el.classList.add("is-up");

      window.clearTimeout(hole.timer);
      window.clearTimeout(hole.hitTimer);
      hole.timer = window.setTimeout(() => {
        if (hole.up) this.hide(index, false);
      }, durationMs);

      return true;
    }

    hide(index, wasHit) {
      const hole = this.holes[index];
      if (!hole || !hole.up) return;

      hole.up = false;
      this.active.delete(index);
      window.clearTimeout(hole.timer);
      hole.timer = null;

      if (wasHit) {
        // Show smile + hammer burst on head, then retreat
        hole.el.classList.remove("is-hit");
        void hole.el.offsetWidth; // restart CSS animation
        hole.el.classList.add("is-hit");
        window.clearTimeout(hole.hitTimer);
        hole.hitTimer = window.setTimeout(() => {
          hole.el.classList.remove("is-up");
          window.setTimeout(() => hole.el.classList.remove("is-hit"), 260);
        }, 180);
      } else {
        hole.el.classList.remove("is-up", "is-hit");
      }
    }

    pickIdleIndex() {
      const idle = this.holes.filter((h) => !h.up).map((h) => h.index);
      if (!idle.length) return null;
      return Utils.pick(idle);
    }

    get activeCount() {
      return this.active.size;
    }

    reset() {
      this.holes.forEach((hole) => {
        window.clearTimeout(hole.timer);
        window.clearTimeout(hole.hitTimer);
        hole.timer = null;
        hole.hitTimer = null;
        hole.up = false;
        hole.el.classList.remove("is-up", "is-hit");
      });
      this.active.clear();
    }

    setEnabled(value) {
      this.enabled = value;
      this.container.classList.toggle("is-paused", !value);
    }

    destroy() {
      this.reset();
      if (this._onDown) this.container.removeEventListener("pointerdown", this._onDown);
      this.container.innerHTML = "";
      this.holes = [];
    }
  }

  global.Board = Board;
})(window);
