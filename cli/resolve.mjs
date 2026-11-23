// Lets a project import the engine by name, as it would once installed:
// `import ... from 'figurant'` resolves to this engine when the project has
// no copy of its own. Registered by the figurant command, for Node only (in
// the atelier's pages an import map does the same).

const ENGINE = new URL('../src/index.js', import.meta.url).href;

export async function resolve(specifier, context, next) {
    if (specifier !== 'figurant') return next(specifier, context);
    try { return await next(specifier, context); }
    catch { return { url: ENGINE, shortCircuit: true }; }
}
