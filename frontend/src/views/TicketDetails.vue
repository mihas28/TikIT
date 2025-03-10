<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <div class="content-wrapper">
    <h2>Podrobnosti zahtevka</h2>
    <p>ID zahtevka: {{ route.params.id }}</p>
  </div>
</template>

<style scoped>
/* Poskrbi, da vsebina ni prekrita s sidebarjem */
.content-wrapper {
    margin-left: 250px; /* Enako širini sidebarja */
    padding: 20px;
    width: calc(100% - 250px);
}

@media (max-width: 768px) {
    .content-wrapper {
        margin-top: 50px;
        margin-left: 0; /* Če je sidebar skrit */
        width: 100%;
    }
}
</style>