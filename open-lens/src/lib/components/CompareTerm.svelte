<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import MdAdd from 'svelte-icons/md/MdAdd.svelte';
    import { ripple } from '$lib/actions/ripple';
    import type { Term } from '$lib/stores/termStore';
  
    const props = $props<{
      term: Term;
    }>();
  
    const dispatch = createEventDispatcher();
  </script>
  
  <div class="relative flex-1 rounded-2xl overflow-hidden bg-blue-500 bg-opacity-10 border border-blue-100">
    <button
      use:ripple
      onclick={() => dispatch('click', { id: props.term.id })}
      class="relative w-full h-32 pl-6 pr-16 flex items-center text-xl text-left text-gray-500 leading-6 bg-inherit border-none outline-none z-10"
    >
      <div class="h-6 w-6">
        <MdAdd />
      </div>
      <span class="pl-4">Compare</span>
    </button>
  </div>