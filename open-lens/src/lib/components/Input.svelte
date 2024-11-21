<script lang="ts">
    let {
        value = '',
        placeholder = '',
        type = 'text',
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
        className = '',
        // Optional props
        autoFocus = false,
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
        minWidth?: string;
        height?: string;
        padding?: string;
        borderRadius?: string;
        left?: string;
        top?: string;
        right?: string;
        bottom?: string;
        className?: string;
        autoFocus?: boolean;
        Icon?: new () => any;
        onInput?: (value: string) => void;
        onChange?: (value: string) => void;
        onKeydown?: (event: KeyboardEvent) => void;
        onFocus?: (event: FocusEvent) => void;
        onBlur?: (event: FocusEvent) => void;
    }>();

    let inputEl = $state<HTMLInputElement | null>(null);

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        onInput(target.value);
    }

    function handleChange(event: Event) {
        const target = event.target as HTMLInputElement;
        onChange(target.value);
    }

    // Handle autofocus
    $effect(() => {
        if (autoFocus && inputEl) {
            inputEl.focus();
        }
    });
</script>

<div class="relative inline-block">
    <div
        class="relative flex items-center border border-neutral-200 bg-white text-gray-900 outline-none {className}"
        style="
            min-width: {minWidth};
            height: {height};
            padding-left: {padding};
            padding-right: {padding};
            border-radius: {borderRadius};
            left: {left};
            top: {top};
            right: {right};
            bottom: {bottom};
        "
    >
        {#if Icon}
            <div class="absolute left-3 flex h-6 w-6 items-center justify-center text-gray-400">
                <Icon />
            </div>
        {/if}
        
        <input
            bind:this={inputEl}
            {type}
            bind:value
            {placeholder}
            oninput={handleInput}
            onchange={handleChange}
            onkeydown={onKeydown}
            onfocus={onFocus}
            onblur={onBlur}
            class="h-full w-full bg-transparent outline-none {Icon ? 'pl-8' : ''}"
        />
    </div>
</div>