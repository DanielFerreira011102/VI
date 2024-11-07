<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Term } from '$lib/stores/termStore';
    import MdClose from 'svelte-icons/md/MdClose.svelte';
  
    const props = $props<{
      term: Term;
      autofocus?: boolean;
      wasCompare?: boolean;
    }>();
  
    const dispatch = createEventDispatcher();
    let searchValue = $state(props.term.value);
    let inputElement = $state<HTMLInputElement | null>(null);
    let isProcessing = $state(false);
  
    $effect(() => {
      if (props.autofocus && inputElement) {
        setTimeout(() => {
          inputElement?.focus();
        }, 0);
      }
    });
  
    async function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Enter' && !isProcessing) {
        event.preventDefault();
        isProcessing = true;
  
        try {
          const trimmedValue = searchValue.trim();
          
          if (trimmedValue === '') {
            if (props.wasCompare) {
              dispatch('revert', { id: props.term.id });
            } else if (props.term.type === 'selected') {
              dispatch('delete', { id: props.term.id });
            } else {
              searchValue = '';
            }
          } else {
            dispatch('submit', { id: props.term.id, value: trimmedValue });
          }
        } finally {
          setTimeout(() => {
            isProcessing = false;
          }, 100);
        }
      }
    }
  
    function handleBlur(event: FocusEvent) {
      if (isProcessing) return;
      
      const relatedTarget = event.relatedTarget as HTMLElement;
      if (relatedTarget?.getAttribute('data-action') === 'clear') {
        return;
      }
  
      if (props.wasCompare) {
        dispatch('revert', { id: props.term.id });
        return;
      }
  
      const trimmedValue = searchValue.trim();
      if (trimmedValue === '') {
        if (props.term.type === 'selected') {
          dispatch('delete', { id: props.term.id });
        }
      } else if (props.term.type === 'selected') {
        dispatch('blur', { id: props.term.id, value: trimmedValue });
      }
    }
  
    function clearSearch() {
      searchValue = '';
      inputElement?.focus();
    }
  </script>
  
  <div class="relative flex-1 rounded-2xl overflow-hidden border border-neutral-200 bg-white">
    <input
      bind:this={inputElement}
      type="search"
      bind:value={searchValue}
      onkeydown={handleKeydown}
      onblur={handleBlur}
      class="relative w-full h-32 pl-6 pr-16 text-xl text-gray-900 leading-6 bg-inherit border-none outline-none z-10"
      placeholder="Add a search term"
    />
    {#if searchValue}
      <button
        data-action="clear"
        onclick={clearSearch}
        class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 z-20"
        aria-label="Clear search"
      >
        <div class="h-6 w-6">
          <MdClose />
        </div>
      </button>
    {/if}
  </div>