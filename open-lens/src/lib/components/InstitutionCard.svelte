<script lang="ts">
    import type { Institution } from '$lib/types/institution';
    import { goto } from '$app/navigation';
    import MdCompare from 'svelte-icons/md/MdCompareArrows.svelte';

    let { institution } = $props<{ institution: Institution }>();

    function handleCompare() {
        // Template for compare functionality
        console.log('Compare clicked for institution:', institution.id);
    }

    function handleCardClick() {
        goto(`/institutions/${institution.id}`);
    }
</script>

<div class="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
    <div
        role="button"
        tabindex="0"
        class="cursor-pointer p-6"
        onclick={handleCardClick}
        onkeydown={(e) => e.key === 'Enter' && handleCardClick()}
    >
        <h3 class="mb-2 text-xl font-semibold text-gray-900 line-clamp-2">
            {institution.display_name}
        </h3>
        
        <div class="mb-4 space-y-2">
            <p class="text-sm text-gray-600">
                Works: {institution.works_count.toLocaleString()}
            </p>
            <p class="text-sm text-gray-600">
                Citations: {institution.cited_by_count.toLocaleString()}
            </p>
            <p class="text-sm text-gray-600">
                h-index: {institution.summary_stats.h_index}
            </p>
        </div>

        {#if institution.topics}
            <div class="flex flex-wrap gap-2">
                {#each Object.entries(institution.topics).slice(0, 3) as [_, topic]}
                    <span class="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800">
                        {topic.display_name}
                    </span>
                {/each}
            </div>
        {/if}
    </div>

    <div class="border-t border-gray-200 p-4">
        <button
            onclick={handleCompare}
            class="flex w-full items-center justify-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
        >
            <div class="h-4 w-4">
                <MdCompare />
            </div>
            Compare
        </button>
    </div>
</div>