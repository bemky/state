import { Window } from 'happy-dom';

const window = new Window();

// Copy all window properties to global
Object.getOwnPropertyNames(window).forEach(key => {
    if (!(key in global)) {
        global[key] = window[key];
    }
});

// Ensure common globals are set
global.window = window;
global.document = window.document;