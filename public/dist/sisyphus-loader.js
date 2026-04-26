/**
 * Loader shim for the Sisyphus widget.
 * This file exists as a separate .js file in /public/dist/ so that
 * Vite doesn't try to statically analyze the import statement
 * (which would fail because the widget is in /public/).
 */
const cacheBuster = new Date().getTime();
import(`./sisyphus-widget.js?v=${cacheBuster}`).then(({ createSisyphusGame }) => {
    window.SisyphusWidget = { createSisyphusGame };
    window.dispatchEvent(new Event('sisyphus-widget-ready'));
});
