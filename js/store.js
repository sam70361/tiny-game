/**
 * Store — config + local save (localStorage)
 *
 * Persists:
 * - selected difficulty
 * - best score per difficulty
 * - aggregate play stats
 */
(function (global) {
  const SAVE_KEY = "dadishu:save";
  const LEGACY_BEST_KEY = "dadishu:bestScores";
  const SAVE_VERSION = 1;

  function emptyStats() {
    return {
      gamesPlayed: 0,
      totalHits: 0,
      totalMisses: 0,
      totalScore: 0,
      lastPlayedAt: null,
    };
  }

  function emptySave(defaultDifficulty) {
    return {
      version: SAVE_VERSION,
      difficulty: defaultDifficulty || "normal",
      bestScores: {},
      stats: emptyStats(),
    };
  }

  class Store {
    constructor() {
      this.config = null;
      this.difficulty = "normal";
      this.bestScores = {};
      this.stats = emptyStats();
    }

    async load() {
      // Prefer inline config so file:// (double-click index.html) works.
      const inline = document.getElementById("game-config");
      if (inline && inline.textContent.trim()) {
        this.config = JSON.parse(inline.textContent);
      } else {
        const res = await fetch("data/config.json");
        if (!res.ok) throw new Error("无法加载游戏配置");
        this.config = await res.json();
      }
      this.hydrateSave();
      return this.config;
    }

    hydrateSave() {
      const defaults = emptySave(this.config.defaultDifficulty);
      let save = Utils.storageGet(SAVE_KEY, null);

      // Migrate legacy best-only key
      if (!save) {
        const legacy = Utils.storageGet(LEGACY_BEST_KEY, null);
        if (legacy && typeof legacy === "object") {
          save = { ...defaults, bestScores: legacy };
        }
      }

      if (!save || typeof save !== "object") {
        save = defaults;
      }

      this.bestScores = { ...save.bestScores };
      this.stats = { ...emptyStats(), ...(save.stats || {}) };

      const preferred = save.difficulty || this.config.defaultDifficulty;
      this.difficulty = this.config.difficulties[preferred]
        ? preferred
        : this.config.defaultDifficulty || "normal";

      this.persist();
    }

    persist() {
      Utils.storageSet(SAVE_KEY, {
        version: SAVE_VERSION,
        difficulty: this.difficulty,
        bestScores: this.bestScores,
        stats: this.stats,
      });
    }

    getDifficultyOrder() {
      if (Array.isArray(this.config.difficultyOrder)) {
        return this.config.difficultyOrder.filter((k) => this.config.difficulties[k]);
      }
      return Object.keys(this.config.difficulties);
    }

    getDifficultyConfig(key = this.difficulty) {
      return this.config.difficulties[key];
    }

    setDifficulty(key) {
      if (!this.config.difficulties[key]) return;
      this.difficulty = key;
      this.persist();
      EventBus.emit("difficulty:changed", { key, config: this.getDifficultyConfig(key) });
    }

    getBest(key = this.difficulty) {
      return this.bestScores[key] || 0;
    }

    getAllBests() {
      return { ...this.bestScores };
    }

    updateBest(score, key = this.difficulty) {
      const prev = this.getBest(key);
      if (score > prev) {
        this.bestScores[key] = score;
        this.persist();
        EventBus.emit("best:updated", { key, score });
        return true;
      }
      return false;
    }

    recordGame({ score, hits, misses }) {
      this.stats.gamesPlayed += 1;
      this.stats.totalHits += hits || 0;
      this.stats.totalMisses += misses || 0;
      this.stats.totalScore += score || 0;
      this.stats.lastPlayedAt = new Date().toISOString();
      this.persist();
      EventBus.emit("stats:updated", { ...this.stats });
    }

    clearSave() {
      this.bestScores = {};
      this.stats = emptyStats();
      this.difficulty = this.config.defaultDifficulty || "normal";
      this.persist();
      EventBus.emit("save:cleared");
    }
  }

  global.Store = Store;
})(window);
