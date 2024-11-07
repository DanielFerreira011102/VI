<script lang="ts">
	import '../app.css';
	import '../lib/actions/ripple/styles.css';
	import Header from '$lib/components/Header.svelte';
	import Main from '$lib/components/Main.svelte';
	let { children } = $props();
</script>

<Header />

<Main>
	{@render children()}
</Main>
