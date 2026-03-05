import { Window } from 'happy-dom';
import { register } from 'node:module';

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

// Register resolve hook to handle extensionless imports (e.g. viking)
register('./resolve-hooks.js', import.meta.url);