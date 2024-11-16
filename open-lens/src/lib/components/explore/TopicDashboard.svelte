<script lang="ts">
	import type { Term } from '$lib/types/term';
	import type { Topic } from '$lib/types/topic';

	let { selectedTerms, selectedTopic } = $props<{ selectedTerms: Term[]; selectedTopic: Topic }>();

	$effect(() => {
		console.log('Selected topic:', selectedTopic);
		selectedTerms.forEach((term: Term) => {
			console.log(term.data);
		});
	});
</script>

<div class="container mx-auto flex items-center justify-between p-4">
	<div class="w-full rounded-2xl bg-white p-4">
		<!-- Topic-specific dashboard content will go here -->
		<h2 class="text-xl font-medium text-gray-900">Topic Dashboard: {selectedTopic.display_name}</h2>
		<!-- Add your topic-specific visualizations and components here -->
	</div>
</div>
