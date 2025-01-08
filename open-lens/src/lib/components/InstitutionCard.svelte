<script lang="ts">
	import type { Institution } from '$lib/types/institution';
	import { goto } from '$app/navigation';
	import { compareStore } from '$lib/stores/compareStore';
	import { loadingStore } from '$lib/stores/loadingStore';
	import MdCompare from 'svelte-icons/md/MdCompareArrows.svelte';
	import MdSchool from 'svelte-icons/md/MdSchool.svelte';
	import MdCheck from 'svelte-icons/md/MdCheck.svelte';

	let { institution } = $props<{ institution: Institution }>();
	let isComparing = $state(false);

	// Subscribe to store changes to update isComparing
	$effect(() => {
		const unsubscribe = compareStore.subscribe((state) => {
			isComparing = state.institutions.some((i) => i.id === institution.id);
		});

		return unsubscribe;
	});

	function handleCompare(e: Event) {
		e.stopPropagation();
		e.preventDefault();
		if (isComparing) {
			compareStore.remove(institution.id);
		} else {
			compareStore.add(institution);
		}
	}

	function handleCardClick() {
		loadingStore.startLoading();
		const institutionId = institution.id.replace('https://openalex.org/', '');
		goto(`/institutions/${institutionId}`, { replaceState: false });
	}
</script>

<div
	class="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
>
	<div
		role="button"
		tabindex="0"
		class="flex-1 cursor-pointer p-6"
		onclick={handleCardClick}
		onkeydown={(e) => e.key === 'Enter' && handleCardClick()}
	>
		<div class="mb-2 flex items-center gap-2">
			<div class="h-6 w-6 text-gray-600">
				<MdSchool />
			</div>
			<h3 class="line-clamp-2 text-xl font-semibold text-gray-900">
				{institution.display_name}
			</h3>
		</div>
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
		{#if institution.geo}
			<div class="text-sm text-gray-600">
				<p>{institution.geo.city}, {institution.geo.country}</p>
			</div>
		{/if}
	</div>
	<div class="mt-auto border-t border-gray-200 p-4">
		<button
			onclick={handleCompare}
			class="flex w-full items-center justify-center gap-2 rounded-md {isComparing
				? 'bg-green-50 text-green-600 hover:bg-green-100'
				: 'bg-blue-50 text-blue-600 hover:bg-blue-100'} px-4 py-2 text-sm font-medium"
		>
			<div class="h-4 w-4">
				{#if isComparing}
					<MdCheck />
				{:else}
					<MdCompare />
				{/if}
			</div>
			{isComparing ? 'Added to Compare' : 'Compare'}
		</button>
	</div>
</div>
