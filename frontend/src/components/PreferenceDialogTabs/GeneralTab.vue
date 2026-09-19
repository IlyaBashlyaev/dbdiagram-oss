<template>
  <div class="q-gutter-y-lg">
    <div class="q-gutter-y-md">
      <div class="text-subtitle1">Grid</div>
      <div class="row q-col-gutter-x-sm">
        <q-input class="col-md-4 col-lg-3"
                 v-model.number="store.grid.size"
                 type="number"
                 stack-label
                 :label="`Grid Size`"
        />
        <q-input class="col-md-3 col-lg-2 col-xl-2"
                 v-model.number="store.grid.divisions"
                 type="number"
                 stack-label
                 :label="`Divisions`"
        />
      </div>
      <div class="row q-col-gutter-x-sm">
        <q-input class="col-md-3 col-lg-2 col-xl-2"
                 v-model.number="store.grid.snap"
                 type="number"
                 stack-label
                 :label="`Snap`"
        />
      </div>
    </div>

    <q-separator/>

    <div>
      <div class="text-subtitle1">Storage</div>
      <div class="row q-col-gutter-md items-center">
        <q-select class="col-md-4 col-lg-3"
                  v-model="storageMode"
                  :options="storageOptions"
                  emit-value
                  map-options
                  :disable="isFreeHosted"
                  stack-label
                  :label="`Storage backend`"
        >
          <template v-if="isFreeHosted" #append>
            <q-icon name="info">
              <q-tooltip>Disabled on GitHub Pages / Netlify — no server to connect to.</q-tooltip>
            </q-icon>
          </template>
        </q-select>
        <q-input class="col-md-4 col-lg-3"
                 v-model.trim="fileBackendUrl"
                 type="string"
                 :disable="isFreeHosted || storageSettings.mode !== 'file'"
                 stack-label
                 :label="`File storage server URL`"
        />
        <q-btn v-if="storageSettings.mode === 'file' && !isFreeHosted"
               flat dense no-caps
               icon="wifi_tethering"
               label="Test connection"
               @click="testConnection"
        />
        <q-badge v-if="storageSettings.mode === 'file' && !isFreeHosted"
                 :color="storageSettings.backendReachable ? 'green' : 'red'"
        >
          {{ storageSettings.backendReachable ? 'Server reachable' : 'Server unreachable' }}
        </q-badge>
      </div>
      <div v-if="isFreeHosted" class="text-caption text-warning">
        File Storage is unavailable on GitHub Pages / Netlify hosting (no local server to reach). Local Storage is enforced.
      </div>
    </div>

    <q-separator/>

    <div>
      <div class="text-subtitle1">Repository (S3)     <q-btn class="q-ma-sm" color="purple" label="save" @click="()=>save()"  /></div>
      <div class="row q-col-gutter-md">
        <q-input class="col-md-4 col-lg-3"
                 v-model.trim="repo.host"
                 type="string"
                 stack-label
                 :label="`Host`"
        />
        <q-input class="col-md-4 col-lg-3"
                 v-model.trim="repo.bucket"
                 type="string"
                 stack-label
                 :label="`Bucket`"
        />
        <q-input class="col-md-4 col-lg-3"
                 v-model.trim="repo.path"
                 type="string"
                 stack-label
                 :label="`Comma-separated folders`"
        />
      </div>
      <div class="row q-col-gutter-x-md">
        <q-input class="col-md-4 col-lg-3"
                 v-model.trim="repo.region"
                 type="string"
                 stack-label
                 :label="`Region`"
        />
        <q-input class="col-md-4 col-lg-3"
                 v-model.trim="repo.access_key"
                 type="string"
                 stack-label
                 :label="`Access_key`"
        />
        <q-input class="col-md-4 col-lg-3"
                 v-model.trim="repo.secret_key"
                 type="string"
                 stack-label
                 :label="`Secret_key`"
        />
        
      </div>
  
    </div>

    <q-space/>
  </div>
</template>

<script setup>

  import { computed } from 'vue'
  import { useQuasar } from 'quasar'
  import { useChartStore } from '../../store/chart'
  import { useRepoStore } from '../../store/repo';
  import { useStorageSettingsStore } from '../../store/storageSettings';
  import { useFilesStore } from '../../store/files';

  const store = useChartStore();
  const repo = useRepoStore();
  const storageSettings = useStorageSettingsStore();
  const files = useFilesStore();
  const $q = useQuasar();

  repo.loadRepoConfig();

  const isFreeHosted = computed(() => storageSettings.isFreeHosted);

  const storageOptions = [
    { label: 'Local Storage', value: 'local' },
    { label: 'File Storage', value: 'file' }
  ];

  const storageMode = computed({
    get: () => storageSettings.mode,
    set: (mode) => {
      if (mode === storageSettings.mode) return;
      $q.dialog({
        title: 'Switch storage',
        message: 'Local Storage and File Storage hold independent sets of diagrams. Switching will show whatever diagrams already exist in the other storage. Continue?',
        cancel: true,
        persistent: true
      }).onOk(() => {
        storageSettings.setMode(mode);
        files.loadFileList();
        files.loadFile(files.getCurrentFile);
      });
    }
  });

  const fileBackendUrl = computed({
    get: () => storageSettings.fileBackendUrl,
    set: (url) => storageSettings.setFileBackendUrl(url)
  });

  function testConnection() {
    storageSettings.checkBackendHealth();
  }

  function save(){
    if (repo.checkSettings()){
      repo.saveRepoConfig();
    }
  }

</script>
