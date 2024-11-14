<script lang="ts">
	import type { Term } from '$lib/types/term';
	import MdMoreVert from 'svelte-icons/md/MdMoreVert.svelte';

	const props = $props<{
		term: Term;
		onEdit: () => void;
		onDelete: () => void;	
	}>();
</script>

<div
	class="relative w-full flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-100"
>
	<div
		class="pointer-events-none absolute left-6 top-11 z-20 h-5 w-5 rounded-full"
		style:background-color={props.term.color}
	></div>
	<button
		onclick={props.onEdit}
		class="relative z-10 h-32 w-full overflow-hidden text-ellipsis whitespace-nowrap border-none bg-inherit pb-16 pl-16 pr-16 pt-10 text-left text-xl leading-6 text-gray-900 outline-none"
	>
		{props.term.value}
	</button>
	<div
		class="pointer-events-none absolute top-17 z-20 w-full overflow-hidden text-ellipsis whitespace-nowrap pl-16 pr-16 text-sm text-gray-500"
	>
		Search term
	</div>
	<button
		onclick={props.onDelete}
		class="absolute right-6 top-1/2 z-20 h-6 w-6 -translate-y-1/2 text-gray-500"
	>
		<MdMoreVert />
	</button>
</div>
