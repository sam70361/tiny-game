/**
 * GameEngine — spawn loop, scoring, timer, lives
 */
(function (global) {
  class GameEngine {
    constructor({ board, store, toast, modal }) {
      this.board = board;
      this.store = store;
      this.toast = toast;
      this.modal = modal;

      this.state = "idle"; // idle | running | paused | over
      this.score = 0;
      this.lives = 0;
      this.timeLeft = 0;
      this.hits = 0;
      this.misses = 0;
      this.diff = null;

      this._raf = null;
      this._lastTs = 0;
      this._spawnTimer = null;
      this._hud = {
        score: Utils.$("[data-hud-score]"),
        time: Utils.$("[data-hud-time]"),
        lives: Utils.$("[data-hud-lives]"),
      };
    }

    start() {
      this.diff = this.store.getDifficultyConfig();
      this.score = 0;
      this.hits = 0;
      this.misses = 0;
      this.lives = this.diff.lives;
      this.timeLeft = this.diff.duration;
      this.state = "running";

      this.board.reset();
      this.board.setEnabled(true);
      this.renderHud(true);
      this.modal.close();

      this._lastTs = performance.now();
      this._raf = requestAnimationFrame((t) => this.tick(t));
      this.scheduleSpawn(200);
      EventBus.emit("game:start");
    }

    pause() {
      if (this.state !== "running") return;
      this.state = "paused";
      this.board.setEnabled(false);
      window.clearTimeout(this._spawnTimer);
      cancelAnimationFrame(this._raf);
      EventBus.emit("game:pause");
    }

    resume() {
      if (this.state !== "paused") return;
      this.state = "running";
      this.board.setEnabled(true);
      this._lastTs = performance.now();
      this._raf = requestAnimationFrame((t) => this.tick(t));
      this.scheduleSpawn(120);
      EventBus.emit("game:resume");
    }

    stop(reason = "time") {
      if (this.state === "over" || this.state === "idle") return;
      this.state = "over";
      window.clearTimeout(this._spawnTimer);
      cancelAnimationFrame(this._raf);
      this.board.reset();
      this.board.setEnabled(false);

      const isNewBest = this.store.updateBest(this.score);
      this.store.recordGame({
        score: this.score,
        hits: this.hits,
        misses: this.misses,
      });

      const labels = this.store.config.labels;
      const title = reason === "lives" ? labels.noLives : labels.gameOver;
      const best = this.store.getBest();
      const meta = isNewBest
        ? `新纪录 · ${labels.best} ${best}`
        : `${labels.best} ${best} · 命中 ${this.hits}`;

      this.modal.open({
        title,
        score: this.score,
        meta,
        body: `失误 ${this.misses} · 难度 ${this.diff.label}`,
      });

      EventBus.emit("game:over", { score: this.score, reason, isNewBest });
    }

    tick(ts) {
      if (this.state !== "running") return;
      const dt = (ts - this._lastTs) / 1000;
      this._lastTs = ts;
      this.timeLeft -= dt;

      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.renderHud();
        this.stop("time");
        return;
      }

      this.renderHud();
      if (this.timeLeft <= 5) {
        this._hud.time.classList.add("is-warn");
      } else {
        this._hud.time.classList.remove("is-warn");
      }

      this._raf = requestAnimationFrame((t) => this.tick(t));
    }

    scheduleSpawn(delay) {
      window.clearTimeout(this._spawnTimer);
      this._spawnTimer = window.setTimeout(() => this.spawn(), delay);
    }

    spawn() {
      if (this.state !== "running") return;

      const { maxActive, minUp, maxUp, minGap, maxGap } = this.diff;
      if (this.board.activeCount < maxActive) {
        const index = this.board.pickIdleIndex();
        if (index != null) {
          const upMs = Utils.randInt(minUp, maxUp);
          this.board.show(index, upMs);
        }
      }

      const gap = Utils.randInt(minGap, maxGap);
      this.scheduleSpawn(gap);
    }

    onHit() {
      if (this.state !== "running") return;
      this.score += this.diff.points;
      this.hits += 1;
      this.pulse(this._hud.score);
      this.renderHud();
      EventBus.emit("game:hit", { score: this.score });
    }

    onMiss() {
      if (this.state !== "running") return;
      this.misses += 1;
      this.lives -= 1;
      this.pulse(this._hud.lives);
      this.renderHud();
      this.toast.show(this.store.config.labels.miss, 700);

      if (this.lives <= 0) {
        this.lives = 0;
        this.stop("lives");
      }
    }

    pulse(el) {
      if (!el) return;
      el.classList.remove("is-pulse");
      void el.offsetWidth;
      el.classList.add("is-pulse");
    }

    renderHud(force) {
      if (this._hud.score) this._hud.score.textContent = String(this.score);
      if (this._hud.time) this._hud.time.textContent = Utils.formatTime(this.timeLeft);
      if (this._hud.lives) this._hud.lives.textContent = String(Math.max(0, this.lives));
      if (force) this._hud.time?.classList.remove("is-warn");
    }
  }

  global.GameEngine = GameEngine;
})(window);
