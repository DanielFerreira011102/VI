<script lang="ts">
	import { compareStore } from '$lib/stores/compareStore';
	import { goto } from '$app/navigation';
	import MdClose from 'svelte-icons/md/MdClose.svelte';
	import MdCompare from 'svelte-icons/md/MdCompareArrows.svelte';
	import MdExpandMore from 'svelte-icons/md/MdExpandMore.svelte';
	import MdExpandLess from 'svelte-icons/md/MdExpandLess.svelte';

	let compareState = $state({
		institutions: [] as Institution[],
		maxItems: 4
	});

	let isExpanded = $state(false);

	$effect(() => {
		const unsubscribe = compareStore.subscribe((state) => {
			compareState.institutions = state.institutions;
			compareState.maxItems = state.maxItems;
		});

		return unsubscribe;
	});

	function handleCompare() {
		const institutionNames = compareState.institutions
			.map((i) => encodeURIComponent(i.display_name))
			.join(',');
		goto(`/explore?q=${institutionNames}`);
	}

	function removeInstitution(institutionId: string) {
		compareStore.remove(institutionId);
	}

	function clearAll() {
		compareStore.clear();
	}

	function toggleExpand() {
		isExpanded = !isExpanded;
	}
</script>

{#if compareState.institutions.length > 0}
	<div class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg">
		<!-- Mobile View (Collapsed) -->
		<div class="lg:hidden">
			<div class="p-4">
				<div class="flex items-center justify-between">
					<button class="flex items-center gap-2 text-gray-600" onclick={toggleExpand}>
						<span class="text-sm font-medium">
							Comparing {compareState.institutions.length}/{compareState.maxItems}
						</span>
						<div class="h-4 w-4">
							{#if isExpanded}
								<MdExpandLess />
							{:else}
								<MdExpandMore />
							{/if}
						</div>
					</button>
					<div class="flex items-center gap-2">
						<button class="text-sm text-gray-600 hover:text-gray-900" onclick={clearAll}>
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
							Compare
						</button>
					</div>
				</div>

				{#if isExpanded}
					<div class="mt-4 space-y-2">
						{#each compareState.institutions as institution (institution.id)}
							<div
								class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
							>
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
				{/if}
			</div>
		</div>

		<!-- Desktop View -->
		<div class="hidden lg:block">
			<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
				<div class="flex flex-col gap-4">
					<div class="flex items-center justify-between border-b border-gray-200 pb-4">
						<span class="text-sm text-gray-600">
							Comparing {compareState.institutions.length}/{compareState.maxItems}
						</span>
						<div class="flex items-center gap-4">
							<button class="text-sm text-gray-600 hover:text-gray-900" onclick={clearAll}>
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
					<div class="flex flex-wrap gap-2">
						{#each compareState.institutions as institution (institution.id)}
							<div
								class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
							>
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
			</div>
		</div>
	</div>
{/if}
