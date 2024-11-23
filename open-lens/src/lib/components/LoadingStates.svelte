<script lang="ts">
	import type { LoadingState } from '$lib/types/loading';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let { loadingState, fullScreen = false } = $props<{
		loadingState: LoadingState;
		fullScreen?: boolean;
	}>();
</script>

{#if loadingState.isLoading}
	<div class="absolute inset-0 z-100 flex items-center justify-center bg-white/50">
		<LoadingSpinner size={fullScreen ? 'lg' : 'md'} />
	</div>
{:else if loadingState.error}
	<div class="absolute inset-0 z-100 flex items-center justify-center bg-white/50">
		<div class="text-center">
			<h2 class="text-xl font-medium text-red-600">Error</h2>
			<p class="mt-2 text-gray-600">{loadingState.error}</p>
		</div>
	</div>
{/if}
