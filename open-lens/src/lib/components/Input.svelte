<script lang="ts">
	import MdClose from 'svelte-icons/md/MdClose.svelte';

	let {
		value = '',
		placeholder = '',
		type = 'text',
		disabled = false,
		// Input styling
		minWidth = '',
		height = '',
		padding = '',
		borderRadius = '',
		// Input positioning
		left = '',
		top = '',
		right = '',
		bottom = '',
		// Optional class names
		wrapperClassName = '',
		inputClassName = '',
		// Optional props
		autoFocus = false,
		showClear = true,
		Icon = null,
		onInput = (value: string) => {},
		onChange = (value: string) => {},
		onKeydown = (event: KeyboardEvent) => {},
		onFocus = (event: FocusEvent) => {},
		onBlur = (event: FocusEvent) => {}
	} = $props<{
		value: string;
		placeholder?: string;
		type?: string;
		disabled?: boolean;
		minWidth?: string;
		height?: string;
		padding?: string;
		borderRadius?: string;
		left?: string;
		top?: string;
		right?: string;
		bottom?: string;
		wrapperClassName?: string;
		inputClassName?: string;
		autoFocus?: boolean;
		showClear?: boolean;
		Icon?: new () => any;
		onInput?: (value: string) => void;
		onChange?: (value: string) => void;
		onKeydown?: (event: KeyboardEvent) => void;
		onFocus?: (event: FocusEvent) => void;
		onBlur?: (event: FocusEvent) => void;
	}>();

	let inputEl = $state<HTMLInputElement | null>(null);

	function buildWrapperStyle() {
		const styles = [];
		
		if (minWidth) styles.push(`min-width: ${minWidth}`);
		if (left) styles.push(`left: ${left}`);
		if (top) styles.push(`top: ${top}`);
		if (right) styles.push(`right: ${right}`);
		if (bottom) styles.push(`bottom: ${bottom}`);
		
		return styles.join(';');
	}

	function buildInputContainerStyle() {
		const styles = [];
		
		if (height) styles.push(`height: ${height}`);
		if (padding) {
			styles.push(`padding-left: ${padding}`);
			styles.push(`padding-right: ${padding}`);
		}
		if (borderRadius) styles.push(`border-radius: ${borderRadius}`);
		
		return styles.join(';');
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onInput(target.value);
	}

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		onChange(target.value);
	}

	function handleClear() {
		onInput('');
		onChange('');
		value = '';
		if (inputEl) {
			inputEl.focus();
		}
	}

	$effect(() => {
		if (autoFocus && inputEl) {
			inputEl.focus();
		}
	});
</script>

<div 
	class="relative {wrapperClassName}"
	style={buildWrapperStyle()}
>
	<div 
		class="flex items-center border bg-white {disabled ? 'cursor-not-allowed opacity-50' : ''}"
		style={buildInputContainerStyle()}
	>
		{#if Icon}
			<div class="flex h-6 w-6 items-center justify-center text-gray-400">
				<Icon />
			</div>
		{/if}

		<input
			bind:this={inputEl}
			{type}
			{disabled}
			{placeholder}
			bind:value
			oninput={handleInput}
			onchange={handleChange}
			onkeydown={onKeydown}
			onfocus={onFocus}
			onblur={onBlur}
			class="w-full bg-transparent outline-none disabled:cursor-not-allowed {Icon ? 'mx-3' : ''} {inputClassName}"
		/>

		{#if showClear && value && !disabled}
			<button
				type="button"
				onclick={handleClear}
				class="flex h-6 w-6 items-center justify-center text-gray-500"
			>
				<MdClose />
			</button>
		{/if}
	</div>
</div>