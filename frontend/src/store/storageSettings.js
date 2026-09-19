import { defineStore } from "pinia";
import { isFreeHostedOrigin } from "src/utils/hostUtils";
import { getAdapter } from "src/store/storageAdapters";

export const useStorageSettingsStore = defineStore("storageSettings", {
  state: () => ({
    mode: "local",
    fileBackendUrl: "http://localhost:8000",
    backendReachable: null
  }),
  getters: {
    isFreeHosted() {
      return isFreeHostedOrigin();
    },
    // The mode actually used by the app: on free static hosting there is no
    // server to reach, so File Storage is never available regardless of the
    // user's saved preference.
    effectiveMode(state) {
      return this.isFreeHosted ? "local" : state.mode;
    },
    save(state) {
      return {
        mode: state.mode,
        fileBackendUrl: state.fileBackendUrl
      };
    }
  },
  actions: {
    setMode(mode) {
      this.$patch({ mode });
    },
    setFileBackendUrl(url) {
      this.$patch({ fileBackendUrl: url });
    },
    async checkBackendHealth() {
      try {
        const ok = await getAdapter("file", this.fileBackendUrl).health();
        this.$patch({ backendReachable: ok });
        return ok;
      } catch (e) {
        this.$patch({ backendReachable: false });
        return false;
      }
    }
  }
});
