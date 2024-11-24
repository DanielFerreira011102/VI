<script lang="ts">
	import type { Term } from '$lib/types/term';
	import type { Topic } from '$lib/types/topic';
	import MdWarning from 'svelte-icons/md/MdWarning.svelte';

	let { selectedTerms, selectedTopic } = $props<{ selectedTerms: Term[]; selectedTopic: Topic }>();
</script>

<div class="container mx-auto flex items-center justify-between p-4">
	<div class="w-full rounded-2xl bg-white p-4">
		<h2 class="mb-4 text-xl font-medium text-gray-900">
			Topic Dashboard: {selectedTopic.display_name}
		</h2>

		<div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
			<div class="flex items-center gap-3">
				<div class="h-5 w-5 text-amber-600">
					<MdWarning />
				</div>
				<h3 class="font-medium text-amber-800">Under Development</h3>
			</div>
			<p class="mt-2 text-amber-700">
				This feature is currently under development and not yet implemented. Please check back later
				for updates.
			</p>
		</div>
	</div>
</div>
