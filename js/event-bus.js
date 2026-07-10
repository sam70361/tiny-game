/**
 * EventBus — decoupled pub/sub
 */
(function (global) {
  const listeners = new Map();

  const EventBus = {
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
      return () => this.off(event, handler);
    },

    off(event, handler) {
      listeners.get(event)?.delete(handler);
    },

    emit(event, payload) {
      listeners.get(event)?.forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[EventBus] ${event}`, err);
        }
      });
    },

    clear() {
      listeners.clear();
    },
  };

  global.EventBus = EventBus;
})(window);
