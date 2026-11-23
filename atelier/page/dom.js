// The page's small tools: finding and making elements, what is remembered from
// one visit to the next, and calls to the atelier's server.

export const $ = id => document.getElementById(id);
export const el = (tag, props = {}, ...children) => {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
};
export const remember = (key, fallback) => { try { return localStorage.getItem('figurant.' + key) ?? fallback; } catch { return fallback; } };
export const keep = (key, value) => { try { localStorage.setItem('figurant.' + key, value); } catch { /* private window */ } };

/** A call to the atelier's server (cli/server.js): the answer as an object, or an error with what the server said. */
export const api = async (path, init) => {
    const response = await fetch('/__figurant/api/' + path, init);
    if (!response.ok) throw new Error(await response.text());
    return response.json();
};
