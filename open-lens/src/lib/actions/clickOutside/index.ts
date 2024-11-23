type ClickOutsideParams = {
	callback: () => void;
	enabled?: boolean;
};

export function clickOutside(node: HTMLElement, { callback, enabled = true }: ClickOutsideParams) {
	function handleClick(event: MouseEvent) {
		if (!enabled) return;
		if (!node.contains(event.target as Node)) {
			callback();
		}
	}

	document.addEventListener('click', handleClick, true);

	return {
		update({ enabled: newEnabled = true }: ClickOutsideParams) {
			enabled = newEnabled;
		},
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}
