import jsdomGlobal from 'jsdom-global';

jsdomGlobal();

// Mock IntersectionObserver since JSDOM doesn't provide it
globalThis.IntersectionObserver = class IntersectionObserver {
    constructor(callback, options) {
        this.callback = callback;
        this.options = options;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
};