<script lang="ts">
	import type { Term } from '$lib/types/term';
	import type { Topic } from '$lib/types/topic';
	import type { LoadingState } from '$lib/types/loading';

	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { termStore } from '$lib/stores/termStore';
	import { topicStore } from '$lib/stores/topicStore';
	import { loadingStore } from '$lib/stores/loadingStore';

	import LoadingStates from '$lib/components/LoadingStates.svelte';
	import SearchHeader from '$lib/components/explore/SearchHeader.svelte';
	import DefaultDashboard from '$lib/components/explore/DefaultDashboard.svelte';
	import TopicDashboard from '$lib/components/explore/TopicDashboard.svelte';

	// Component state
	let terms = $state<Term[]>([]);
	let selectedTerms = $derived(terms.filter((term) => term.type === 'selected'));
	let selectedTopic = $state<Topic>({ id: 'allTopics', display_name: 'All Topics' });
	let loadingState = $state<LoadingState>({ isLoading: true, error: null });

	// Initialization and store subscriptions
	onMount(async () => {
		await Promise.all([
			termStore.initialize($page.url.search),
			topicStore.initialize($page.url.search)
		]);
	});

	termStore.subscribe((value) => {
		terms = value;
	});

	topicStore.subscribe((topic) => {
		selectedTopic = topic;
		if (terms.some((term) => term.type === 'selected')) {
			termStore.refreshTopicData(topic.id);
		}
	});

	loadingStore.subscribe((value) => {
		loadingState = value;
	});
</script>

<LoadingStates {loadingState} fullScreen={true} />

{#if !loadingState.isLoading && !loadingState.error}
	<SearchHeader />

	<div class="bg-blue-400 bg-opacity-10 py-4">
		{#if selectedTerms.length > 0}
			{#if selectedTopic.id === 'allTopics'}
				<DefaultDashboard {selectedTerms} />
			{:else}
				<TopicDashboard {selectedTerms} {selectedTopic} />
			{/if}
		{:else}
			<div class="container mx-auto p-4">
				<div class="w-full rounded-2xl bg-white p-12 text-center">
					<h2 class="mb-2 text-xl font-medium text-gray-900">No Terms Selected</h2>
					<p class="text-gray-600">
						Use the search box above to select terms and visualize their data.
					</p>
				</div>
			</div>
		{/if}
	</div>
{/if}
