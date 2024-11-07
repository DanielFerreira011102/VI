import type { RippleOptions } from "./constants.js";
import {
    INEVENTS,
    OUTEVENTS,
    ATTR_NAME,
    ATTR_CENTER_NAME,
    addEvent,
    removeEvent,
    findFurthestPoint,
} from "./constants.js";
import { onDestroy } from 'svelte';

export function ripple(node: HTMLElement, options: RippleOptions = {}) {
    let maximumRadius = 0;
    
    const addClassIfMissing = () => {
        if (!node.getAttribute(ATTR_NAME)) {
            node.setAttribute(ATTR_NAME, "");
        }

        if (options?.center) {
            node.setAttribute(ATTR_CENTER_NAME, "");
        } else {
            node.removeAttribute(ATTR_CENTER_NAME);
        }
    };

    const setOptions = (opts: RippleOptions) => {
        if (opts?.color) {
            node.style.setProperty("--ripple-color", opts.color);
        }
        if (opts?.duration) {
            node.style.setProperty("--ripple-duration", opts.duration + "s");
        }
        if (opts?.maxRadius) {
            maximumRadius = opts.maxRadius;
        }
    };

    const createRipple = (e: PointerEvent) => {
        if (options?.disabled) return;

        e.stopPropagation();
        addClassIfMissing();

        const rect = node.getBoundingClientRect();
        const radius = findFurthestPoint(
            e.clientX,
            node.offsetWidth,
            rect.left,
            e.clientY,
            node.offsetHeight,
            rect.top
        );

        const ripple = document.createElement("div");
        ripple.classList.add("ripple");

        let size = radius * 2;
        let top = e.clientY - rect.top - radius;
        let left = e.clientX - rect.left - radius;

        if (maximumRadius && size > maximumRadius) {
            size = maximumRadius * 2;
            top = e.clientY - rect.top - maximumRadius;
            left = e.clientX - rect.left - maximumRadius;
        }

        ripple.style.left = left + "px";
        ripple.style.top = top + "px";
        ripple.style.width = ripple.style.height = size + "px";

        node.appendChild(ripple);

        const removeRipple = () => {
            const timeOutDuration = options?.duration
                ? options.duration * 1000
                : 1000;

            setTimeout(() => {
                if (ripple) ripple.style.opacity = "0";
            }, timeOutDuration / 4);

            setTimeout(() => {
                if (ripple && ripple.parentNode === node) {
                    ripple.remove();
                }
            }, timeOutDuration);
        };

        OUTEVENTS.forEach((event) => {
            addEvent(node, event, removeRipple);
        });
    };

    // Initialize
    addClassIfMissing();
    setOptions(options);

    // Add event listeners
    INEVENTS.forEach((event) => {
        addEvent(node, event, createRipple);
    });

    // Cleanup on destroy
    onDestroy(() => {
        INEVENTS.forEach((event) => {
            removeEvent(node, event, createRipple);
        });
    });

    return {
        update(newOptions: RippleOptions) {
            options = newOptions;
            setOptions(newOptions);
        }
    };
}