import { writable } from 'svelte/store';
import { goto } from '$app/navigation';
import type { Topic } from '$lib/types/topic';

function createTopicStore() {
	const { subscribe, set } = writable<Topic>({ id: 'allTopics', display_name: 'All Topics' });

	const updateURL = (topic: Topic) => {
		const searchParams = new URLSearchParams(window.location.search);

		if (topic.id !== 'allTopics') {
			searchParams.set('topic', topic.id);
		} else {
			searchParams.delete('topic');
		}

		const newURL = `/explore${searchParams.toString() ? `?${searchParams}` : ''}`;
		goto(decodeURI(newURL), { replaceState: true });
	};

	return {
		subscribe,
		initialize: async (queryString: string) => {
			const params = new URLSearchParams(queryString);
			const topicId = params.get('topic');

			if (!topicId) {
				set({ id: 'allTopics', display_name: 'All Topics' });
				return;
			}

			try {
				const response = await fetch(`https://api.openalex.org/topics/${topicId}`);
				const data = await response.json();
				set({ id: topicId, display_name: data.display_name });
			} catch (error) {
				console.error('Error fetching topic:', error);
				set({ id: 'allTopics', display_name: 'All Topics' });
			}
		},

		updateTopic: (topic: Topic) => {
			set(topic);
			updateURL(topic);
		}
	};
}

export const topicStore = createTopicStore();
