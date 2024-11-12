<script lang="ts">
	import type { AutocompleteConfig } from '$lib/types/autocomplete';
	import type { Term } from '$lib/types/term';
	import MdClose from 'svelte-icons/md/MdClose.svelte';

	const props = $props<{
		term: Term;
		wasCompare?: boolean;
		autocomplete?: AutocompleteConfig;
		onSubmit: (value: string) => void;
		onDelete: () => void;
		onEdit?: () => void;
		onBlur: (value: string) => void;
		onRevert: () => void;
	}>();

	let searchValue = $state(props.term.value);
	let inputElement = $state<HTMLInputElement | null>(null);
	let isProcessing = $state(false);

	// Auto-focus input on mount
	$effect(() => {
		inputElement?.focus();
	});

	const handleSubmit = async (value: string) => {
		if (isProcessing) return;

		isProcessing = true;
		try {
			const trimmedValue = value.trim();

			if (!trimmedValue) {
				if (props.wasCompare) {
					props.onRevert();
				} else if (props.term.type === 'selected') {
					props.onDelete();
				} else {
					searchValue = '';
				}
				return;
			}

			props.onSubmit(trimmedValue);
		} finally {
			// Prevent rapid re-submissions
			setTimeout(() => {
				isProcessing = false;
			}, 100);
		}
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleSubmit(searchValue);
		}
	};

	const handleBlur = (event: FocusEvent) => {
		if (isProcessing) return;

		// Don't trigger blur when clicking clear button
		const relatedTarget = event.relatedTarget as HTMLElement;
		if (relatedTarget?.dataset.action === 'clear') return;

		if (props.wasCompare) {
			props.onRevert();
			return;
		}

		const trimmedValue = searchValue.trim();
		if (!trimmedValue && props.term.type === 'selected') {
			props.onDelete();
		} else if (props.term.type === 'selected') {
			props.onBlur(trimmedValue);
		}
	};

	const clearSearch = () => {
		searchValue = '';
		inputElement?.focus();
	};
</script>

<div class="relative w-full flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
	<input
		bind:this={inputElement}
		type="search"
		bind:value={searchValue}
		onkeydown={handleKeydown}
		onblur={handleBlur}
		class="relative z-10 h-32 w-full border-none bg-inherit pl-6 pr-16 text-xl leading-6 text-gray-900 outline-none"
		placeholder="Add a search term"
	/>

	{#if searchValue}
		<button
			data-action="clear"
			onclick={clearSearch}
			class="absolute right-6 top-1/2 z-20 -translate-y-1/2 text-gray-500"
			aria-label="Clear search"
		>
			<div class="h-6 w-6">
				<MdClose />
			</div>
		</button>
	{/if}
</div>
