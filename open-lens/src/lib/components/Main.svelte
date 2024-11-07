<script lang="ts">
	import { type Snippet } from 'svelte';
	let { children }: { children: Snippet } = $props();
</script>

<main class="pt-16">
	{#if children}
		{@render children()}
	{:else}
		<p>Nothing to see here.</p>
	{/if}
</main>
