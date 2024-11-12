function debounce(func: (...args: any[]) => void, wait: number): (...args: any[]) => void {
	let timeout: number;
	return (...args: any[]) => {
		clearTimeout(timeout);
		timeout = window.setTimeout(() => func(...args), wait);
	};
}

export { debounce };
