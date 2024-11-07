<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { termStore } from '$lib/stores/termStore';
    import TermIndicator from '$lib/components/TermIndicator.svelte';
  
    onMount(() => termStore.initialize($page.url.search));
  </script>
  
  <div class="bg-white bg-gradient-to-t from-blue-500/10 to-blue-500/10">
    <div class="container mx-auto flex items-center justify-between px-16 py-2">
      <TermIndicator />
    </div>
  </div>