import type { Dimensions } from '$lib/types/chart';

export function measure(node: HTMLElement, callback: (dimensions: Dimensions) => void) {
	const updateDimensions = () => {
		const rect = node.getBoundingClientRect();
		const dimensions = {
			width: rect.width,
			height: rect.height
		};
		callback(dimensions);
		return dimensions;
	};

	// Initial measurement
	let dimensions = updateDimensions();

	// Set up a MutationObserver to detect content changes
	const observer = new MutationObserver(() => {
		dimensions = updateDimensions();
	});

	observer.observe(node, {
		childList: true,
		subtree: true,
		characterData: true
	});

	return {
		destroy() {
			observer.disconnect();
		},
		update(newCallback: (dimensions: Dimensions) => void) {
			callback = newCallback;
			dimensions = updateDimensions();
		}
	};
}
