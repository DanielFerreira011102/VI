<script lang="ts">
	import type { LoadingState } from '$lib/types/loading';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let { loadingState } = $props<{ loadingState: LoadingState }>();
</script>

{#if loadingState.isLoading}
	<div class="flex h-screen items-center justify-center">
		<LoadingSpinner size="lg" />
	</div>
{:else if loadingState.error}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<h2 class="text-xl font-medium text-red-600">Error</h2>
			<p class="mt-2 text-gray-600">{loadingState.error}</p>
		</div>
	</div>
{/if}
