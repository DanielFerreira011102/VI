<script lang="ts">
	const props = $props<{
		size?: 'sm' | 'md' | 'lg';
	}>();

	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-8 h-8',
		lg: 'w-12 h-12'
	};
</script>

<div class="flex items-center justify-center">
	<div
		class={`${sizeClasses[props.size ?? 'md']} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`}
	></div>
</div>
