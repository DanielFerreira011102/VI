<script lang="ts">
	import type { Institution } from '$lib/types/institution';
	import { goto } from '$app/navigation';
	import MdCompare from 'svelte-icons/md/MdCompareArrows.svelte';
	import MdSchool from 'svelte-icons/md/MdSchool.svelte';

	let { institution } = $props<{ institution: Institution }>();

	function handleCompare() {
		console.log('Compare clicked for institution:', institution.id);
	}

	function handleCardClick() {
		goto(`/institutions/${institution.id.replace('https://openalex.org/', '')}`);
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
			class="flex w-full items-center justify-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
		>
			<div class="h-4 w-4">
				<MdCompare />
			</div>
			Compare
		</button>
	</div>
</div>
