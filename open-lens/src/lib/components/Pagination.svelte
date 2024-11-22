<script lang="ts">
	import Input from '$lib/components/Input.svelte';

	let {
		currentPage = 1,
		totalPages = 1,
		onPageChange = (page: number) => {},
		className = '',
		showInput = true,
		showFirstLast = false,
		disabled = false
	} = $props<{
		currentPage: number;
		totalPages: number;
		onPageChange: (page: number) => void;
		className?: string;
		showInput?: boolean;
		showFirstLast?: boolean;
		disabled?: boolean;
	}>();

	let pageInput = $state(String(currentPage));

	$effect(() => {
		pageInput = String(currentPage);
	});

	function handlePageInput(value: string) {
		pageInput = value;
	}

	function handlePageKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			const newPage = parseInt(pageInput);
			if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
				onPageChange(newPage);
			}
		}
	}
</script>

<div class="flex flex-wrap items-center justify-center gap-2 {className}">
	{#if showFirstLast}
		<button
			class="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
			disabled={disabled || currentPage === 1}
			onclick={() => onPageChange(1)}
		>
			First
		</button>
	{/if}

	<button
		class="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
		disabled={disabled || currentPage === 1}
		onclick={() => onPageChange(currentPage - 1)}
	>
		Previous
	</button>

	{#if showInput}
		<div class="flex items-center gap-2">
			<Input
				value={pageInput}
				onInput={handlePageInput}
				onKeydown={handlePageKeydown}
				{disabled}
				showClear={false}
				height="2.5rem"
				padding="0.5rem"
				borderRadius="0.375rem"
				wrapperClassName="w-16"
				inputClassName="text-center text-sm"
			/>
			<span class="text-sm text-gray-600">
				of {totalPages}
			</span>
		</div>
	{:else}
		<span class="text-sm text-gray-600">
			Page {currentPage} of {totalPages}
		</span>
	{/if}

	<button
		class="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
		disabled={disabled || currentPage === totalPages}
		onclick={() => onPageChange(currentPage + 1)}
	>
		Next
	</button>

	{#if showFirstLast}
		<button
			class="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
			disabled={disabled || currentPage === totalPages}
			onclick={() => onPageChange(totalPages)}
		>
			Last
		</button>
	{/if}
</div>