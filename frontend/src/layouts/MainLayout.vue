<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container class="page-container">
      <router-view v-slot="{ Component }">
        <transition :name="transitionName">
          <component :is="Component" :key="$route.path" class="page-view" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from 'stores/app-store';

const appStore = useAppStore();
const router = useRouter();

const transitionName = ref('slide-forward');

// Track navigation direction based on navigation hierarchy
// home -> bot-detail -> worker-detail (forward = deeper)
// worker-detail -> bot-detail -> home (back = shallower)
const routeDepth: Record<string, number> = {
  'home': 0,
  'bot-detail': 1,
  'worker-detail': 2,
  'statistics': 1,
};

router.beforeEach((to, from) => {
  const toDepth = routeDepth[to.name as string] ?? 0;
  const fromDepth = routeDepth[from.name as string] ?? 0;

  if (toDepth > fromDepth) {
    transitionName.value = 'slide-forward';
  } else if (toDepth < fromDepth) {
    transitionName.value = 'slide-back';
  } else {
    transitionName.value = 'slide-forward';
  }
});

onMounted(() => {
  appStore.initializeApp();
});
</script>

<style lang="scss">
// Global styles for the app
.body--light {
  background: #f8fafc;
}

.body--dark {
  background: #0f0f14;
}

.page-container {
  position: relative;
  overflow-x: hidden;
  min-height: 100vh;
}

.page-view {
  width: 100%;
  min-height: 100vh;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;

  .body--light & {
    background: #f8fafc;
  }

  .body--dark & {
    background: #0f0f14;
  }
}

// Forward transition: new page slides in from right, covering the old page
.slide-forward-enter-active,
.slide-forward-leave-active {
  transition: transform 0.3s ease-out;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);
}

.slide-forward-enter-active {
  z-index: 2;
}

.slide-forward-leave-active {
  z-index: 1;
}

.slide-forward-enter-from {
  transform: translate3d(100%, 0, 0);
}

.slide-forward-enter-to,
.slide-forward-leave-from,
.slide-forward-leave-to {
  transform: translate3d(0, 0, 0);
}

// Back transition: current page slides out to right, uncovering the page below
.slide-back-enter-active,
.slide-back-leave-active {
  transition: transform 0.3s ease-out;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);
}

.slide-back-enter-active {
  z-index: 1;
}

.slide-back-leave-active {
  z-index: 2;
}

.slide-back-enter-from,
.slide-back-enter-to,
.slide-back-leave-from {
  transform: translate3d(0, 0, 0);
}

.slide-back-leave-to {
  transform: translate3d(100%, 0, 0);
}
</style>
