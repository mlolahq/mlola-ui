/** Module hooks for tests that import component source: a stylesheet import is an empty module. */
export async function resolve(specifier, context, next) {
  if (specifier.endsWith(".css")) return { url: "data:text/javascript,export default {};", shortCircuit: true };
  return next(specifier, context);
}
