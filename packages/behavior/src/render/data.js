/**
 * What the check reads in a catalog with charts and a data grid (the Mlola
 * Render Pro catalog): a key that names a field of each row, a list of
 * numbers, and what a prop reads from the rows beside it. A module of its
 * own, so a page that draws only the free catalog never loads it: on import
 * it adds these kinds to the check (import "@mlola-ui/behavior/render/data").
 * Render Pro's rules import it, so a server that checks Pro surfaces with
 * them needs nothing more.
 *
 * Like the check, it reads what a model wrote in time that grows with its
 * length.
 */
import { addRenderKinds } from "./check.js";

addRenderKinds(({ failure, binding, pointer, quote, typeName, isObject, own, isKey }) => {
  function checkNumbers(rules, surfaceId, type, name, prop, value, at, issues) {
    if (binding(rules, surfaceId, value, at, issues)) return;
    const label = `${type} ${quote(name)}`;
    if (!Array.isArray(value)) {
      issues.errors.push(failure(surfaceId, at, `${label} is an array of numbers, or {"path": "/…"} to one in the data model; got ${typeName(value)}.`));
      return;
    }
    if (value.length < (prop.minItems ?? 0) || value.length > rules.limits.rows) {
      issues.errors.push(failure(surfaceId, at, `${label} holds ${prop.minItems ?? 0} to ${rules.limits.rows} numbers; this is ${value.length}.`));
      return;
    }
    const odd = value.findIndex((entry) => typeof entry !== "number" || !Number.isFinite(entry));
    if (odd !== -1) issues.errors.push(failure(surfaceId, pointer(at, odd), `${label} holds numbers only; this one is ${quote(value[odd])}.`));
  }

  /**
   * What a prop reads from the rows beside it (`rows` names that prop): a name
   * in every row, a number wherever one is drawn, and somewhere to write when
   * a person may edit. Rows in the data model are the renderer's to read with
   * care; rows written into the component are held here.
   */
  function checkRowsRead(surfaceId, type, definition, component, at, issues) {
    for (const [name, prop] of Object.entries(definition.props)) {
      const given = component[name];
      if (!prop.rows || given === undefined) continue;
      const rows = component[prop.rows];
      const entries = Array.isArray(given) ? given.filter(isObject) : [];
      const writes = Object.entries(prop.fields ?? {}).filter(([, field]) => field.writes).map(([field]) => field);
      const written = Array.isArray(given) && !(isObject(rows) && "path" in rows) ? given.findIndex((entry) => isObject(entry) && writes.some((field) => entry[field] === true)) : -1;
      if (written >= 0) issues.errors.push(failure(surfaceId, pointer(at, name, written), `What a person enters here is written to ${quote(prop.rows)}, so bind it to the data model: {"path": "/…"}, with the rows in updateDataModel.`));
      // A key names each row or holds its number; a list of them is read only where it is drawn as numbers.
      if (!Array.isArray(rows) || (prop.kind !== "key" && !prop.numeric)) continue;
      for (const key of prop.kind === "key" ? [given] : entries.map((entry) => entry.key)) {
        // A key that is no field name was reported where it was written.
        if (!isKey(key)) continue;
        const fits = (value) => (prop.numeric ? value === undefined || value === null || (typeof value === "number" && Number.isFinite(value) && value >= (prop.minimum ?? -Infinity)) : (typeof value === "string" && value.trim() !== "") || typeof value === "number");
        const odd = rows.findIndex((row) => isObject(row) && !fits(own(row, key)));
        if (odd === -1) continue;
        const value = own(rows[odd], key);
        issues.errors.push(failure(surfaceId, value === undefined ? pointer(at, prop.rows, odd) : pointer(at, prop.rows, odd, key), prop.numeric
          ? `${type} draws ${quote(key)} as a number${prop.minimum === undefined ? "" : ` of at least ${prop.minimum}`}; this row has ${quote(value)}. Write the number itself, or leave it out for a gap.`
          : `${type} names each row by its ${quote(key)}; this row has ${value === undefined ? "none" : quote(value)}.`));
      }
    }
  }

  return {
    kinds: {
      key: {
        check(rules, surfaceId, type, name, prop, value, at, issues) {
          if (isKey(value)) return;
          issues.errors.push(failure(surfaceId, at, `${type} ${quote(name)} names a field of each row: letters, digits, _ or -, like "month"; got ${quote(value)}.`));
        },
        describe: () => `the name of a field in each row, like "month"`,
      },
      numbers: {
        check: checkNumbers,
        describe: (spec) => `an array of numbers, or {"path"}${spec.minItems ? `, at least ${spec.minItems}` : ""}`,
      },
    },
    reads: checkRowsRead,
  };
});
