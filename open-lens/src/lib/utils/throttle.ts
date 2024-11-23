function throttle<T extends (...args: any[]) => void>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle = false;
	let lastArgs: Parameters<T> | null = null;

	return (...args: Parameters<T>) => {
		if (!inThrottle) {
			func.apply(null, args);
			inThrottle = true;

			setTimeout(() => {
				inThrottle = false;
				if (lastArgs) {
					func.apply(null, lastArgs);
					lastArgs = null;
				}
			}, limit);
		} else {
			lastArgs = args;
		}
	};
}

export { throttle };
