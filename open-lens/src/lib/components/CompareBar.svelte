<script lang="ts">
    import { compareStore } from '$lib/stores/compareStore';
    import { goto } from '$app/navigation';
    import MdClose from 'svelte-icons/md/MdClose.svelte';
    import MdCompare from 'svelte-icons/md/MdCompareArrows.svelte';
	import type { Institution } from '$lib/types/institution';
    
    // Create a reactive variable from the store
    let compareState = $state({
        institutions: [] as Institution[],
        maxItems: 5
    });
    
    // Subscribe to store changes
    $effect(() => {
        const unsubscribe = compareStore.subscribe(state => {
            compareState.institutions = state.institutions;
            compareState.maxItems = state.maxItems;
        });
        
        return unsubscribe;
    });
    
    function handleCompare() {
        const institutionNames = compareState.institutions
            .map(i => encodeURIComponent(i.display_name))
            .join(',');
        goto(`/explore?q=${institutionNames}`);
    }
    
    function removeInstitution(institutionId: string) {
        compareStore.remove(institutionId);
    }
    
    function clearAll() {
        compareStore.clear();
    }
</script>

{#if compareState.institutions.length > 0}
    <div class="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200">
        <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <span class="text-sm text-gray-600">
                        Comparing {compareState.institutions.length}/{compareState.maxItems}
                    </span>
                    <div class="flex gap-2">
                        {#each compareState.institutions as institution (institution.id)}
                            <div class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                <span class="text-sm font-medium">
                                    {institution.display_name}
                                </span>
                                <button
                                    class="h-4 w-4 text-gray-400 hover:text-gray-600"
                                    onclick={() => removeInstitution(institution.id)}
                                >
                                    <MdClose />
                                </button>
                            </div>
                        {/each}
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <button
                        class="text-sm text-gray-600 hover:text-gray-900"
                        onclick={clearAll}
                    >
                        Clear all
                    </button>
                    <button
                        class="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        onclick={handleCompare}
                        disabled={compareState.institutions.length < 2}
                    >
                        <div class="h-4 w-4">
                            <MdCompare />
                        </div>
                        Compare ({compareState.institutions.length})
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}