<script lang="ts">
	import MdHelpOutline from 'svelte-icons/md/MdHelpOutline.svelte';
	let { content, popupTemplate } = $props<{
		content: any;
		popupTemplate?: (content: any) => string;
	}>();

	let isOpen = $state(false);
	let buttonEl: HTMLElement;
	let popupEl: HTMLElement;
	let popupPosition = $state({ left: 0 });

	const POPUP_PADDING = 16; // Padding from viewport edges

	function calculatePopupPosition() {
		if (!buttonEl || !popupEl) return { left: 0 };

		const buttonRect = buttonEl.getBoundingClientRect();
		const popupWidth = popupEl.offsetWidth;
		const windowWidth = window.innerWidth;

		// Try right-aligned with button first (left edge of popup = left edge of button)
		let left = buttonRect.left;

		// If overflowing right
		if (left + popupWidth + POPUP_PADDING > windowWidth) {
			// Try left of the button
			left = buttonRect.left - popupWidth;

			// If overflowing left, try center
			if (left < POPUP_PADDING) {
				left = buttonRect.left + buttonRect.width / 2 - popupWidth / 2;

				// If center also overflows, stick to nearest viewport edge
				if (left + popupWidth + POPUP_PADDING > windowWidth) {
					left = windowWidth - popupWidth - POPUP_PADDING;
				} else if (left < POPUP_PADDING) {
					left = POPUP_PADDING;
				}
			}
		}

		return { left };
	}

	$effect(() => {
		if (isOpen) {
			popupPosition = calculatePopupPosition();

			const handleResize = () => {
				popupPosition = calculatePopupPosition();
			};

			window.addEventListener('resize', handleResize);
			return () => window.removeEventListener('resize', handleResize);
		}
	});

	const defaultTemplate = $derived(
		popupTemplate ??
			((content: any) => `
				<div class="text-sm text-gray-600">
					${typeof content === 'string' ? content : JSON.stringify(content)}
				</div>
			`)
	);
</script>

<div
	class="relative inline-flex"
	bind:this={buttonEl}
	onmouseenter={() => (isOpen = true)}
	onmouseleave={() => (isOpen = false)}
	role="group"
>
	<button class="h-8 w-8 text-gray-500 transition-colors hover:text-gray-700" aria-label="Help">
		<MdHelpOutline />
	</button>

	{#if isOpen}
		<div
			bind:this={popupEl}
			class="fixed z-100 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
			role="tooltip"
			style="left: {popupPosition.left}px; top: {buttonEl?.getBoundingClientRect().bottom}px"
		>
			{@html defaultTemplate(content)}
		</div>
	{/if}
</div>
