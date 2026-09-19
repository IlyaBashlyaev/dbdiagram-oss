import { defineStore } from "pinia";
import { Notify } from "quasar";
import { useEditorStore } from "src/store/editor";
import { useChartStore } from "src/store/chart";
import { useStorageSettingsStore } from "src/store/storageSettings";
import { getAdapter, isValidDiagramName } from "src/store/storageAdapters";

function currentAdapter() {
  const storageSettings = useStorageSettingsStore();
  return getAdapter(storageSettings.effectiveMode, storageSettings.fileBackendUrl);
}

function notifyError(message) {
  Notify.create({
    caption: "Storage",
    message,
    color: "red",
    icon: "warning",
    position: "bottom-right"
  });
}

export const useFilesStore = defineStore("files", {
  state: () => ({
    saving: false,
    lastSave: 0,
    currentFile: "",
    files: []
  }),
  getters: {
    getFiles(state) {
      return state.files;
    },
    getCurrentFile(state) {
      return state.currentFile;
    }
  },
  actions: {
    loadFileList() {
      currentAdapter().list()
        .then((files) => {
          this.files = files;
        })
        .catch((e) => {
          notifyError(e.message);
        });
    },
    loadFile(fileName) {
      this.loadFileList();

      currentAdapter().load(fileName)
        .then((file) => {
          if (file) {
            this.$patch({
              currentFile: fileName
            });
            const editor = useEditorStore();
            const chart = useChartStore();

            editor.load({
              source: {
                format: "dbml",
                text: file.dbml || "",
                markers: {
                  selection: {
                    start: { row: null, col: null },
                    end: { row: null, col: null }
                  }
                }
              }
            });
            chart.load(file.coords || {});
          }
        })
        .catch((e) => {
          notifyError(e.message);
        });
    },
    saveFile(fileName) {
      if (!fileName) {
        fileName = this.currentFile;
      }
      if (!fileName) {
        const list = this.files;
        let i = 1;
        fileName = `Untitled (${i})`;

        while (list.indexOf(fileName) >= 0) {
          fileName = `Untitled (${i++})`;
        }
      }

      if (!isValidDiagramName(fileName)) {
        notifyError(`Invalid diagram name: '${fileName}'`);
        return;
      }

      this.saving = true;

      const editor = useEditorStore();
      const chart = useChartStore();

      const dbml = editor.getSourceText;
      const coords = chart.save;

      currentAdapter().save(fileName, {
        dbml,
        coords: JSON.parse(JSON.stringify(coords))
      }).then(() => {
        this.loadFileList();
        this.saving = false;
        this.lastSave = new Date();
        if (this.currentFile !== fileName) {
          this.$patch({
            currentFile: fileName
          });
        }
      }).catch((e) => {
        this.saving = false;
        notifyError(e.message);
      });
    },
    newFile() {
      this.$patch({
        currentFile: undefined
      });

      const editor = useEditorStore();
      const chart = useChartStore();

      editor.$reset();
      chart.$reset();
      this.saveFile();
    },
    newImportFile(name) {
      if (!isValidDiagramName(name)) {
        notifyError(`Invalid diagram name: '${name}'`);
        return;
      }

      this.$patch({
        currentFile: name
      });

      const editor = useEditorStore();
      const chart = useChartStore();

      editor.$reset();
      chart.$reset();
      this.saveFile();
    },
    deleteFile(fileName) {
      if (!fileName) return;
      currentAdapter().delete(fileName).then(() => {
        this.loadFileList();
        if (fileName === this.currentFile) {
          if (this.files.length > 0) {
            this.loadFile(this.files[0]);
          }
        }
      }).catch((e) => {
        notifyError(e.message);
      });
    },
    renameFile(newName) {
      const oldName = this.currentFile;

      if (!isValidDiagramName(newName)) {
        notifyError(`Invalid diagram name: '${newName}'`);
        return;
      }

      if (oldName === newName) return;

      currentAdapter().rename(oldName, newName).then(() => {
        this.$patch({
          currentFile: newName
        });
        this.loadFileList();
      }).catch((e) => {
        notifyError(e.message);
      });
    }
  }
});
