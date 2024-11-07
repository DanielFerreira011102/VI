<script lang="ts">
	import type { Term } from '$lib/types/term';
	import MdAdd from 'svelte-icons/md/MdAdd.svelte';
	import { ripple } from '$lib/actions/ripple';

	const props = $props<{
		term: Term;
		onClick: () => void;
	}>();
</script>

<div
	class="relative w-full flex-1 overflow-hidden rounded-2xl border border-blue-100 bg-blue-500 bg-opacity-10"
>
	<button
		use:ripple
		onclick={props.onClick}
		class="relative z-10 flex h-32 w-full items-center justify-center border-none bg-inherit text-left text-xl leading-6 text-gray-500 outline-none lg:justify-normal lg:pl-6 lg:pr-6"
	>
		<div class="h-6 w-6">
			<MdAdd />
		</div>
		<span class="block pl-4 md:hidden lg:block">Compare</span>
	</button>
</div>
