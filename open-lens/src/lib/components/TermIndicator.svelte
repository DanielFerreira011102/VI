<script lang="ts">
	import { termStore } from '$lib/stores/termStore';
	import type { Term } from '$lib/types/term';
	import SearchTerm from '$lib/components/SearchTerm.svelte';
	import SelectedTerm from '$lib/components/SelectedTerm.svelte';
	import CompareTerm from '$lib/components/CompareTerm.svelte';

	let terms = $state<Term[]>([]);
	let editingId = $state<string | null>(null);
	let wasCompareMap = $state<Record<string, boolean>>({});

	$effect(() => {
		return termStore.subscribe((value) => {
			terms = value;
		});
	});

	const handleSubmit = (id: string, value: string) => {
		if (!value.trim() && wasCompareMap[id]) {
			handleRevert(id);
			return;
		}
		termStore.updateTerm(id, value);
		editingId = null;
		wasCompareMap[id] = false;
	};

	const handleEdit = (id: string) => {
		editingId = id;
		wasCompareMap[id] = false;
	};

	const handleDelete = (id: string) => {
		termStore.deleteTerm(id, true);
		editingId = null;
		delete wasCompareMap[id];
	};

	const handleBlur = (id: string, value: string) => {
		if (wasCompareMap[id]) {
			handleRevert(id);
			return;
		}
		if (!value.trim()) {
			handleDelete(id);
			return;
		}
		if (editingId === id) {
			termStore.setType(id, 'selected');
			editingId = null;
		}
	};

	const handleCompareClick = (id: string) => {
		wasCompareMap[id] = true;
		termStore.convertCompareToSearch(id);
		editingId = id;
	};

	const handleRevert = (id: string) => {
		termStore.setType(id, 'compare');
		editingId = null;
		delete wasCompareMap[id];
	};
</script>

<div
	class="flex w-full flex-col items-center space-x-0 space-y-2 lg:flex-row lg:space-x-2 lg:space-y-0"
>
	{#each terms as term (term.id)}
		{#if editingId === term.id}
			<SearchTerm
				{term}
				wasCompare={wasCompareMap[term.id]}
				onSubmit={(value) => handleSubmit(term.id, value)}
				onDelete={() => handleDelete(term.id)}
				onBlur={(value) => handleBlur(term.id, value)}
				onRevert={() => handleRevert(term.id)}
			/>
		{:else if term.type === 'selected'}
			<SelectedTerm
				{term}
				onEdit={() => handleEdit(term.id)}
				onDelete={() => handleDelete(term.id)}
			/>
		{:else if term.type === 'compare'}
			<CompareTerm {term} onClick={() => handleCompareClick(term.id)} />
		{:else}
			<SearchTerm
				{term}
				wasCompare={wasCompareMap[term.id]}
				onSubmit={(value) => handleSubmit(term.id, value)}
				onDelete={() => handleDelete(term.id)}
				onBlur={(value) => handleBlur(term.id, value)}
				onRevert={() => handleRevert(term.id)}
			/>
		{/if}
	{/each}
</div>
