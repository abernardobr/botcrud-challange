<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <router-view v-slot="{ Component, route }">
        <transition :name="transitionName" mode="out-in">
          <component :is="Component" :key="route.path" />
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

const transitionName = ref('slide-left');

// Track navigation direction based on route hierarchy depth
const routeDepth: Record<string, number> = {
  'home': 0,
  'workers': 1,
  'logs': 1,
  'statistics': 1,
  'bot-detail': 1,
  'worker-detail': 2,
};

router.beforeEach((to, from) => {
  const toDepth = routeDepth[to.name as string] ?? 0;
  const fromDepth = routeDepth[from.name as string] ?? 0;

  if (toDepth > fromDepth) {
    // Going deeper - slide left (new page comes from right)
    transitionName.value = 'slide-left';
  } else if (toDepth < fromDepth) {
    // Going back - slide right (new page comes from left)
    transitionName.value = 'slide-right';
  } else {
    // Same level - simple fade
    transitionName.value = 'fade';
  }
});

onMounted(() => {
  appStore.initializeApp();
});
</script>

<style lang="scss">
// Global body backgrounds
.body--light {
  background: #f8fafc;
}

.body--dark {
  background: #0f0f14;
}

// Ensure q-page-container fills viewport and has consistent background
.q-page-container {
  min-height: 100vh;

  .body--light & {
    background: #f8fafc;
  }

  .body--dark & {
    background: #0f0f14;
  }
}

// ============================================
// SLIDE LEFT - Forward navigation (out-in mode)
// Old page exits left, new page enters from right
// ============================================
.slide-left-enter-active {
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              opacity 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-left-leave-active {
  transition: transform 0.2s cubic-bezier(0.55, 0.055, 0.675, 0.19),
              opacity 0.2s cubic-bezier(0.55, 0.055, 0.675, 0.19);
}

.slide-left-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-left-enter-to {
  transform: translateX(0);
  opacity: 1;
}

.slide-left-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.slide-left-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

// ============================================
// SLIDE RIGHT - Back navigation (out-in mode)
// Old page exits right, new page enters from left
// ============================================
.slide-right-enter-active {
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              opacity 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-right-leave-active {
  transition: transform 0.2s cubic-bezier(0.55, 0.055, 0.675, 0.19),
              opacity 0.2s cubic-bezier(0.55, 0.055, 0.675, 0.19);
}

.slide-right-enter-from {
  transform: translateX(-30px);
  opacity: 0;
}

.slide-right-enter-to {
  transform: translateX(0);
  opacity: 1;
}

.slide-right-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.slide-right-leave-to {
  transform: translateX(30px);
  opacity: 0;
}

// ============================================
// FADE - Same level navigation (out-in mode)
// ============================================
.fade-enter-active {
  transition: opacity 0.2s ease-out;
}

.fade-leave-active {
  transition: opacity 0.15s ease-in;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
