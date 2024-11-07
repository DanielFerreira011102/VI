<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Term } from '$lib/stores/termStore';
    import MdMoreVert from 'svelte-icons/md/MdMoreVert.svelte';
  
    const props = $props<{
      term: Term;
    }>();
  
    const dispatch = createEventDispatcher();
  </script>
  
  <div class="relative flex-1 rounded-2xl overflow-hidden border border-neutral-200 bg-white hover:bg-neutral-100">
    <div 
      class="absolute top-11 left-6 rounded-full h-5 w-5 z-20 pointer-events-none"
      style:background-color={props.term.color}
    ></div>
    <button
      onclick={() => dispatch('edit', { id: props.term.id })}
      class="relative w-full h-32 pl-16 pb-16 pt-10 pr-16 text-xl text-left text-ellipsis text-gray-900 whitespace-nowrap leading-6 bg-inherit border-none outline-none overflow-hidden z-10"
    >
      {props.term.value}
    </button>
    <div class="absolute top-17 w-full pl-16 pr-16 text-sm text-ellipsis text-gray-500 whitespace-nowrap overflow-hidden z-20 pointer-events-none">
      Search term
    </div>
    <button 
      onclick={() => dispatch('delete', { id: props.term.id })}
      class="absolute h-6 w-6 top-1/2 -translate-y-1/2 right-6 text-gray-500 z-20"
    >
      <MdMoreVert />
    </button>
  </div>