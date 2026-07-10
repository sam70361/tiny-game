/**
 * App bootstrap — screens, wiring, difficulty
 */
(function () {
  const SCREENS = ["home", "play"];

  const App = {
    store: null,
    board: null,
    engine: null,
    toast: null,
    modal: null,
    currentScreen: "home",

    async init() {
      this.store = new Store();
      try {
        await this.store.load();
      } catch (err) {
        console.error(err);
        document.body.innerHTML =
          '<p style="padding:2rem;font-family:monospace">配置加载失败，请通过本地服务器打开 index.html</p>';
        return;
      }

      this.applyStaticCopy();
      this.mountPreview();
      this.mountDifficulty();

      this.toast = new Toast(Utils.$("#toast-host"));
      this.modal = new Modal(Utils.$("#modal-result"));
      this.pauseModal = Utils.$("#modal-pause");
      this.board = new Board(Utils.$("#board"), {
        holes: this.store.config.holes,
        moleIdle: this.store.config.moleIdle || this.store.config.moleImage,
        moleHit: this.store.config.moleHit,
      });
      this.board.mount();

      this.engine = new GameEngine({
        board: this.board,
        store: this.store,
        toast: this.toast,
        modal: this.modal,
      });

      this.board.onHit = () => this.engine.onHit();
      this.board.onMiss = () => this.engine.onMiss();

      this.modal.onAction = (action) => this.handleModalAction(action);
      this.bindUi();
      this.showScreen("home");
      this.updateSaveLabels();
    },

    applyStaticCopy() {
      const { title, tagline, labels } = this.store.config;
      document.title = title;
      const brand = Utils.$("[data-brand]");
      const tag = Utils.$("[data-tagline]");
      if (brand) brand.textContent = title;
      if (tag) tag.textContent = tagline;

      const rules = Utils.$("[data-rules]");
      if (rules) {
        rules.innerHTML = labels.rules
          .map((text, i) => `<li data-n="${String(i + 1).padStart(2, "0")}">${text}</li>`)
          .join("");
      }

      Utils.$("[data-label-score]") && (Utils.$("[data-label-score]").textContent = labels.score);
      Utils.$("[data-label-time]") && (Utils.$("[data-label-time]").textContent = labels.time);
      Utils.$("[data-label-lives]") && (Utils.$("[data-label-lives]").textContent = labels.lives);
      Utils.$("[data-btn-start]") && (Utils.$("[data-btn-start]").textContent = labels.start);
      Utils.$("[data-btn-pause]") && (Utils.$("[data-btn-pause]").textContent = labels.pause);

      const pauseTitle = Utils.$("#pause-title");
      const pauseHint = Utils.$(".pause-hint");
      if (pauseTitle) pauseTitle.textContent = labels.paused || "暂停中";
      if (pauseHint) pauseHint.textContent = labels.pauseHint || "地鼠也在歇口气";
      const resumeBtn = Utils.$('[data-pause-action="resume"]');
      const homeBtn = Utils.$('[data-pause-action="home"]');
      if (resumeBtn) resumeBtn.textContent = labels.resume;
      if (homeBtn) homeBtn.textContent = labels.home;
    },

    mountPreview() {
      const idle = Utils.$("[data-mole-preview-idle]");
      const hit = Utils.$("[data-mole-preview-hit]");
      const idleSrc = this.store.config.moleIdle || this.store.config.moleImage;
      const hitSrc = this.store.config.moleHit;
      if (idle) idle.src = idleSrc;
      if (hit) hit.src = hitSrc;
    },

    mountDifficulty() {
      const host = Utils.$("[data-diff]");
      if (!host) return;
      const keys = this.store.getDifficultyOrder();
      host.innerHTML = keys
        .map((key) => {
          const cfg = this.store.config.difficulties[key];
          const active = key === this.store.difficulty;
          return `<button type="button" class="diff__btn${
            active ? " is-active" : ""
          }" data-diff-key="${key}" data-rank="${cfg.rank || ""}" aria-pressed="${active}" title="${cfg.label} · ${cfg.duration}s · 生命${cfg.lives}">${
            cfg.label
          }</button>`;
        })
        .join("");

      host.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-diff-key]");
        if (!btn) return;
        this.store.setDifficulty(btn.dataset.diffKey);
        Utils.$$("[data-diff-key]", host).forEach((el) => {
          const active = el.dataset.diffKey === this.store.difficulty;
          el.classList.toggle("is-active", active);
          el.setAttribute("aria-pressed", String(active));
        });
        this.updateSaveLabels();
      });
    },

    updateBestLabel() {
      this.updateSaveLabels();
    },

    updateSaveLabels() {
      const labels = this.store.config.labels;
      const bestEl = Utils.$("[data-best]");
      const statsEl = Utils.$("[data-stats]");
      const hintEl = Utils.$("[data-save-hint]");
      const best = this.store.getBest();
      const diff = this.store.getDifficultyConfig();

      if (bestEl) {
        bestEl.textContent = `${diff.label} · ${labels.best} ${best}`;
      }
      if (statsEl) {
        const { gamesPlayed, totalHits } = this.store.stats;
        statsEl.textContent = `${labels.games} ${gamesPlayed} · 命中 ${totalHits}`;
      }
      if (hintEl) {
        hintEl.textContent = labels.saveHint || "本地存档已启用";
      }
    },

    bindUi() {
      Utils.$("[data-btn-start]")?.addEventListener("click", () => {
        this.showScreen("play");
        this.engine.start();
        this.syncPauseButton();
      });

      Utils.$("[data-btn-pause]")?.addEventListener("click", () => {
        if (this.engine.state === "running") {
          this.engine.pause();
          this.openPauseModal();
        } else if (this.engine.state === "paused") {
          this.closePauseModal();
          this.engine.resume();
        }
        this.syncPauseButton();
      });

      this.pauseModal?.addEventListener("click", (e) => {
        const action = e.target.closest("[data-pause-action]")?.dataset.pauseAction;
        if (!action) return;
        if (action === "resume") {
          this.closePauseModal();
          this.engine.resume();
          this.syncPauseButton();
        } else if (action === "home") {
          this.closePauseModal();
          this.engine.state = "idle";
          this.board.reset();
          this.board.setEnabled(false);
          this.showScreen("home");
          this.updateSaveLabels();
          this.syncPauseButton();
        }
      });

      Utils.$("[data-btn-home]")?.addEventListener("click", () => {
        this.closePauseModal();
        this.engine.pause();
        this.engine.state = "idle";
        this.board.reset();
        this.board.setEnabled(false);
        this.showScreen("home");
        this.updateSaveLabels();
        this.syncPauseButton();
      });

      Utils.$("[data-btn-clear-save]")?.addEventListener("click", () => {
        const ok = window.confirm("清除本地存档？各难度最高分与对局统计将重置。");
        if (!ok) return;
        this.store.clearSave();
        // Refresh difficulty active state to default
        const host = Utils.$("[data-diff]");
        if (host) {
          Utils.$$("[data-diff-key]", host).forEach((el) => {
            const active = el.dataset.diffKey === this.store.difficulty;
            el.classList.toggle("is-active", active);
            el.setAttribute("aria-pressed", String(active));
          });
        }
        this.updateSaveLabels();
        this.toast.show("存档已清除", 1200);
      });

      document.addEventListener("keydown", (e) => {
        if (e.code === "Space" && this.currentScreen === "play") {
          e.preventDefault();
          Utils.$("[data-btn-pause]")?.click();
        }
        if (e.key === "Escape") {
          if (this.isPauseOpen()) {
            this.closePauseModal();
            if (this.engine.state === "paused") {
              this.engine.resume();
              this.syncPauseButton();
            }
            return;
          }
          if (this.modal.isOpen) {
            this.handleModalAction("home");
          }
        }
      });
    },

    openPauseModal() {
      if (!this.pauseModal) return;
      this.pauseModal.classList.add("is-open");
      this.pauseModal.setAttribute("aria-hidden", "false");
      this.pauseModal.querySelector("[data-pause-action]")?.focus();
    },

    closePauseModal() {
      if (!this.pauseModal) return;
      this.pauseModal.classList.remove("is-open");
      this.pauseModal.setAttribute("aria-hidden", "true");
    },

    isPauseOpen() {
      return !!this.pauseModal?.classList.contains("is-open");
    },

    syncPauseButton() {
      const btn = Utils.$("[data-btn-pause]");
      if (!btn) return;
      const labels = this.store.config.labels;
      if (this.engine.state === "paused") {
        btn.textContent = labels.resume;
      } else {
        btn.textContent = labels.pause;
      }
    },

    handleModalAction(action) {
      this.modal.close();
      if (action === "restart") {
        this.showScreen("play");
        this.engine.start();
        this.syncPauseButton();
      } else {
        this.engine.state = "idle";
        this.showScreen("home");
        this.updateSaveLabels();
      }
    },

    showScreen(name) {
      if (!SCREENS.includes(name)) return;
      this.currentScreen = name;
      Utils.$$("[data-screen]").forEach((el) => {
        el.classList.toggle("is-active", el.dataset.screen === name);
      });
    },
  };

  document.addEventListener("DOMContentLoaded", () => App.init());
})();
