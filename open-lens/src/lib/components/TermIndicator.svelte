<script lang="ts">
    import { termStore, type Term } from '$lib/stores/termStore';
    import SearchTerm from '$lib/components/SearchTerm.svelte';
    import SelectedTerm from '$lib/components/SelectedTerm.svelte';
    import CompareTerm from '$lib/components/CompareTerm.svelte';
    
    let terms = $state<Term[]>([]);
    let editingId = $state<string | null>(null);
    let wasCompareMap = $state<Record<string, boolean>>({});
  
    $effect(() => {
      const unsubscribe = termStore.subscribe(value => {
        terms = value;
      });
      return unsubscribe;
    });
  
    function handleSubmit(event: CustomEvent) {
      const { id, value } = event.detail;
      if (!value.trim() && wasCompareMap[id]) {
        handleRevert(event);
        return;
      }
      termStore.updateTerm(id, value);
      editingId = null;
      wasCompareMap[id] = false;
    }
  
    function handleDelete(event: CustomEvent) {
      const { id } = event.detail;
      termStore.deleteEmptyTerm(id);
      editingId = null;
      delete wasCompareMap[id];
    }
  
    function handleEdit(event: CustomEvent) {
      const { id } = event.detail;
      editingId = id;
      wasCompareMap[id] = false;
    }
  
    function handleBlur(event: CustomEvent) {
      const { id, value } = event.detail;
      if (wasCompareMap[id]) {
        handleRevert(event);
        return;
      }
      if (!value.trim()) {
        handleDelete(event);
        return;
      }
      if (editingId === id) {
        termStore.setType(id, 'selected');
        editingId = null;
      }
    }
  
    function handleCompareClick(event: CustomEvent) {
      const { id } = event.detail;
      wasCompareMap[id] = true;
      termStore.convertCompareToSearch(id);
      editingId = id;
    }
  
    function handleRevert(event: CustomEvent) {
      const { id } = event.detail;
      termStore.setType(id, 'compare');
      editingId = null;
      delete wasCompareMap[id];
    }
  </script>
  
  <div class="w-full my-6 space-x-2 flex items-center">
    {#each terms as term (term.id)}
      {#if editingId === term.id}
        <SearchTerm
          {term}
          autofocus={true}
          wasCompare={wasCompareMap[term.id]}
          on:submit={handleSubmit}
          on:delete={handleDelete}
          on:blur={handleBlur}
          on:revert={handleRevert}
        />
      {:else if term.type === 'selected'}
        <SelectedTerm
          {term}
          on:edit={handleEdit}
          on:delete={handleDelete}
        />
      {:else if term.type === 'compare'}
        <CompareTerm
          {term}
          on:click={handleCompareClick}
        />
      {:else}
        <SearchTerm
          {term}
          wasCompare={wasCompareMap[term.id]}
          on:submit={handleSubmit}
          on:delete={handleDelete}
          on:blur={handleBlur}
          on:revert={handleRevert}
        />
      {/if}
    {/each}
  </div>