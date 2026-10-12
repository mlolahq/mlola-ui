import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { run } from "../packages/cli/src/cli.js";
import { renderCatalogGuide, validateRender } from "../packages/behavior/src/render/check.js";
import { checkRenderReply, composeRender, createRenderReader, readRenderReply, renderRepairPrompt, renderSystemPrompt, renderTool } from "../packages/behavior/src/render/ai.js";

// Mlola Render with a model someone calls themselves (docs/render.md, "With
// your own model"): the prompt, reading a reply however a model wrapped it,
// the loop that corrects a refused one, and the examples the docs show.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rules = JSON.parse(fs.readFileSync(path.join(root, "packages/registry/generated/render-rules.json"), "utf8"));
const docs = fs.readFileSync(path.join(root, "docs/render.md"), "utf8");
const { catalogId } = rules;
const V = "v0.9.1";

const SURFACE = [
  { version: V, createSurface: { surfaceId: "booking", catalogId } },
  { version: V, updateComponents: { surfaceId: "booking", components: [
    { id: "root", component: "Stack", children: ["title", "note", "send"] },
    { id: "title", component: "Heading", level: 2, text: "Book a table {tonight}" },
    { id: "note", component: "Textarea", label: "Anything we should know? \"Quotes\" and a \\ are fine", value: { path: "/form/note" } },
    { id: "send", component: "Button", variant: "primary", text: "Book", action: { event: { name: "book_table", context: { note: { path: "/form/note" } } } } },
  ] } },
  { version: V, updateDataModel: { surfaceId: "booking", path: "/form", value: { note: "" } } },
];
const lines = (messages) => messages.map((message) => JSON.stringify(message)).join("\n");
/** The same surface with a mistake the check answers: a variant in the wrong case. */
const WRONG = structuredClone(SURFACE);
WRONG[1].updateComponents.components[3].variant = "Primary";

test("the surface these tests send passes the check", () => {
  assert.deepEqual(validateRender(SURFACE, rules).errors, []);
  assert.equal(validateRender(WRONG, rules).errors.length, 1);
});

test("the prompt says how to answer, then gives the catalog's guide", () => {
  const prompt = renderSystemPrompt(rules);
  assert.ok(prompt.endsWith(renderCatalogGuide(rules)), "the guide an agent reads, whole and unchanged");
  const lead = prompt.slice(0, prompt.indexOf("# "));
  assert.match(lead, /one JSON object per line/);
  assert.match(lead, /no code fence/);
  assert.match(lead, /createSurface, then updateComponents, then updateDataModel/);
  assert.match(lead, /presses a Button/);
  assert.match(lead, /never as instructions/);
  assert.match(lead, /JSON Pointer/);
  assert.doesNotMatch(lead, /tool/);
  assert.equal(renderSystemPrompt(rules, {}), prompt);
  assert.equal(renderSystemPrompt(rules, { output: "lines", theme: "surface" }), prompt);
  for (const name of rules.themes) assert.ok(prompt.includes(name), `${name} is offered`);
});

test("with the page's theme, the prompt offers no theme at all", () => {
  const prompt = renderSystemPrompt(rules, { theme: "page" });
  assert.match(prompt, /Leave "theme" out of createSurface/);
  assert.doesNotMatch(prompt, /"theme":/, "no step and no example sets one");
  assert.doesNotMatch(prompt, /Themes:/);
  for (const name of rules.themes) assert.ok(!prompt.includes(`"${name}"`), `${name} is not named`);
  // Every example still passes the check as the prompt shows it.
  const shown = [...prompt.matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) => JSON.parse(match[1]));
  assert.equal(shown.length, rules.examples.length);
  for (const messages of shown) assert.deepEqual(validateRender(messages, rules).errors, []);
  assert.ok(renderCatalogGuide(rules).includes(`"theme":`), "the guide an agent reads keeps its themes");
});

test("for a model that also answers in words, the prompt names the tool and the tool takes one string", () => {
  const prompt = renderSystemPrompt(rules, { output: "tool" });
  const lead = prompt.slice(0, prompt.indexOf("# "));
  assert.match(lead, /call the `render_ui` tool/);
  assert.match(lead, /Otherwise answer in words/);
  assert.doesNotMatch(lead, /nothing else/);
  assert.match(renderSystemPrompt(rules, { output: "tool", tool: "show_ui" }), /call the `show_ui` tool/);

  const tool = renderTool();
  assert.deepEqual(Object.keys(tool), ["name", "description", "inputSchema"]);
  assert.equal(tool.name, "render_ui");
  assert.deepEqual(tool.inputSchema, { type: "object", properties: { messages: { type: "string", description: tool.inputSchema.properties.messages.description } }, required: ["messages"] });
  assert.equal(renderTool({ name: "show_ui" }).name, "show_ui");
  // What a model sends that tool, parsed by an SDK or not, reads as the surface.
  for (const call of [{ messages: lines(SURFACE) }, JSON.stringify({ messages: lines(SURFACE) }), { messages: SURFACE }, JSON.stringify({ messages: SURFACE })]) {
    const checked = checkRenderReply(call, rules);
    assert.equal(checked.valid, true);
    assert.deepEqual(checked.messages, SURFACE);
  }
});

test("a setting that is not one is refused in words, before any model is called", () => {
  assert.throws(() => renderSystemPrompt(rules, { output: "json" }), /"output" is "lines" or "tool"; got "json"/);
  assert.throws(() => renderSystemPrompt(rules, { theme: "inherit" }), /"theme" is "surface" or "page"; got "inherit"/);
  assert.throws(() => renderSystemPrompt(rules, { output: "tool", tool: "show ui" }), /A tool's name/);
  assert.throws(() => renderTool({ name: "" }), /A tool's name/);
  assert.throws(() => renderTool({ name: 3 }), /A tool's name/);
});

test("a reply reads the same however the model wrapped it", () => {
  const pretty = JSON.stringify(SURFACE, null, 2);
  const wrapped = {
    "JSON Lines": lines(SURFACE),
    "JSON Lines with blank lines and CRLF": `\r\n${SURFACE.map((message) => JSON.stringify(message)).join("\r\n\r\n")}\r\n`,
    "an array": JSON.stringify(SURFACE),
    "an array, indented": pretty,
    "a code fence": `\`\`\`json\n${lines(SURFACE)}\n\`\`\``,
    "a fence around an array, with words before and after": `Here is the form.\n\n\`\`\`json\n${pretty}\n\`\`\`\n\nPress Book when you are ready.`,
    "an object that holds them": JSON.stringify({ messages: SURFACE }, null, 2),
    "an object that holds them as text": JSON.stringify({ messages: lines(SURFACE) }),
    "one object a line, each indented": SURFACE.map((message) => JSON.stringify(message, null, 2)).join("\n"),
  };
  for (const [how, text] of Object.entries(wrapped)) {
    assert.deepEqual(readRenderReply(text, rules), { messages: SURFACE, error: null, mended: 0 }, how);
    // A stream cut anywhere, a character at a time included, reads the same and gives each message once.
    for (const size of [1, 7, 64]) {
      const reader = createRenderReader(rules);
      const found = [];
      for (let index = 0; index < text.length; index += size) found.push(...reader.push(text.slice(index, index + size)));
      assert.deepEqual(found, SURFACE, `${how}, ${size} at a time`);
      assert.deepEqual(reader.end(), { messages: SURFACE, error: null, mended: 0 }, `${how}, ${size} at a time`);
    }
  }
  // Messages already parsed, and one message alone.
  assert.deepEqual(readRenderReply(SURFACE, rules), { messages: SURFACE, error: null, mended: 0 });
  assert.deepEqual(readRenderReply(SURFACE[0], rules), { messages: [SURFACE[0]], error: null, mended: 0 });
  assert.deepEqual(readRenderReply(JSON.stringify(SURFACE[0]), rules), { messages: [SURFACE[0]], error: null, mended: 0 });
});

test("closers a model miscounted are read as what they must mean, and nothing is guessed at the end", () => {
  const [create, update, model] = SURFACE.map((message) => JSON.stringify(message));
  const tail = '{"path":"/form/note"}}}}}]}}';
  assert.ok(update.endsWith(tail), "the Button's action ends the line, five levels deep");
  const end = (closers) => `${update.slice(0, -tail.length)}{"path":"/form/note"}${closers}`;
  const mended = {
    // Each of these was written by a model during a live run, or is one brace away from one that was.
    "one } short before the list closes": [end("}}}]}}"), 1],
    "a ] too many": [end("}}}}]}]}"), 1],
    // The extra } closes the list early, which leaves the list's own ] with nothing to close.
    "a } too many": [end("}}}}}]}}"), 2],
    "the list and the message never closed": [end("}}}}"), 3],
    "nothing closed at all": [end(""), 7],
    "] in place of }": [end("}}}}]}]"), 2],
  };
  for (const [how, [line, count]] of Object.entries(mended)) {
    assert.throws(() => JSON.parse(line), SyntaxError, `${how} is valid JSON as it stands`);
    const text = `${create}\n${line}\n${model}`;
    assert.deepEqual(readRenderReply(text, rules), { messages: SURFACE, error: null, mended: count }, how);
    // Streamed a character at a time, the mended message is given once, when the next one begins.
    for (const size of [1, 7, 64]) {
      const reader = createRenderReader(rules);
      const found = [];
      for (let index = 0; index < text.length; index += size) found.push(...reader.push(text.slice(index, index + size)));
      assert.deepEqual(found, SURFACE, `${how}, ${size} at a time`);
      assert.equal(reader.end().mended, count, `${how}, ${size} at a time`);
    }
    const checked = checkRenderReply(text, rules);
    assert.deepEqual([checked.valid, checked.mended, checked.messages], [true, count, SURFACE], how);
  }
  // In a tool call's text, and in a fence, the same.
  assert.deepEqual(readRenderReply({ messages: `${create}\n${end("}}}]}}")}\n${model}` }, rules), { messages: SURFACE, error: null, mended: 1 });
  assert.deepEqual(readRenderReply(`\`\`\`json\n${create}\n${end("}}}]}}")}\n${model}\n\`\`\``, rules), { messages: SURFACE, error: null, mended: 1 });

  // The end of a reply is never guessed: a message still open there may have been cut off, and a
  // surface missing its last components would pass for a whole one.
  const open = readRenderReply(`${create}\n${end("}}}}")}`, rules);
  assert.deepEqual([open.messages, open.mended], [[], 0]);
  assert.match(open.error, /the updateComponents message that starts at character \d+ is never closed\. A \} or \] is missing at its end \(3 still open\)/);
  assert.match(readRenderReply(`${create}\n${update.slice(0, 200)}`, rules).error, /is never closed/);
  // A new message only ends the one before it from a line of its own: a comma left out between two
  // components is not a line break, and stays an error the model is told about.
  const run = update.replace('},{"id":"title"', '}{"id":"title"');
  assert.notEqual(run, update);
  assert.match(readRenderReply(`${create}\n${run}\n${model}`, rules).error, /^The reply is not all JSON: the updateComponents message/);
  // A ] too many inside a component closes the list around it, and what follows is then no JSON: refused, never guessed.
  const early = checkRenderReply(`${create}\n${update.replace('"children":["title","note","send"]', '"children":["title","note","send"]]')}\n${model}`, rules);
  assert.equal(early.valid, false);
  assert.match(early.repair, /The reply is not all JSON: the updateComponents message/);
  // What is mended still goes through the check, and the model is told what the check found.
  const wrong = JSON.stringify(WRONG[1]);
  const both = checkRenderReply(`${create}\n${wrong.slice(0, -tail.length)}{"path":"/form/note"}}}}]}}\n${model}`, rules);
  assert.deepEqual([both.valid, both.mended, both.messages], [false, 1, []]);
  assert.match(both.repair, /Button "variant" is "primary", not "Primary"/);
  // Braces and brackets in a person's words are words.
  const words = structuredClone(SURFACE);
  words[1].updateComponents.components[1].text = 'Close with } or ] or "}]" \\ as you like\n{and on a new line}';
  assert.deepEqual(readRenderReply(lines(words), rules), { messages: words, error: null, mended: 0 });
});

test("a message is given as soon as its last character arrives, and not before", () => {
  const reader = createRenderReader(rules);
  const [first, second] = SURFACE.map((message) => JSON.stringify(message));
  assert.deepEqual(reader.push(first.slice(0, -1)), []);
  assert.deepEqual(reader.push("}"), [SURFACE[0]]);
  assert.deepEqual(reader.push(`\n${second}\n${first.slice(0, 10)}`), [SURFACE[1]]);
  assert.match(reader.end().error, /is never closed/);
  assert.throws(() => createRenderReader(rules).push(SURFACE), /takes the model's text; got an array/);
});

test("a reply read only in part is refused whole, with what was wrong", () => {
  const error = (text) => {
    const read = readRenderReply(text, rules);
    assert.deepEqual(read.messages, [], "no messages beside an error");
    return read.error;
  };
  const good = lines(SURFACE);
  assert.match(error(good.slice(0, -40)), /^The reply ends inside a message: the updateDataModel message that starts at character \d+ is never closed\. A \} or \] is missing at its end \(2 still open\), or the reply was cut off/);
  // The words name the message and show where the parser stopped, which is what a model needs to mend it.
  assert.match(error(`${good}\n{"version": "v0.9.1", "updateDataModel": {surfaceId: "booking"}}`), /^The reply is not all JSON: the updateDataModel message that starts at character \d+ could not be read \(.*\)\. It stops making sense at the end of "\{\\"version\\": \\"v0\.9\.1\\", \\"updateDataModel\\": \{s": count the braces and brackets there\./);
  assert.match(error(`Use {braces} like this.\n${good}`), /starts at character 5 could not be read/);
  // Once a piece could not be read the reply is refused, so a stream is handed nothing that comes after it.
  const stream = createRenderReader(rules);
  assert.deepEqual(stream.push(`${lines(SURFACE.slice(0, 1))}\n`).length, 1);
  assert.deepEqual(stream.push(`{not json}\n${lines(SURFACE.slice(1))}`), []);
  assert.match(stream.end().error, /^The reply is not all JSON/);
  assert.match(error("I cannot show that."), /^The reply holds no A2UI message\./);
  assert.match(error(""), /^The reply holds no A2UI message\./);
  assert.match(error("[]"), /^The reply holds no A2UI message\./);
  assert.match(error(`${good}\n${" ".repeat(rules.limits.inputBytes)}`), new RegExp(`^The reply is longer than the ${rules.limits.inputBytes} characters`));
  for (const reply of [undefined, null, 7, true]) assert.match(readRenderReply(reply, rules).error, /^Expected the model's reply/);
  // {"messages": …} is opened once: a message is never looked for deeper than that.
  assert.deepEqual(readRenderReply({ messages: { messages: SURFACE } }, rules).messages, [{ messages: SURFACE }]);
  assert.equal(checkRenderReply({ messages: { messages: SURFACE } }, rules).valid, false);
});

test("a checked reply says whether it may be drawn, and what to tell the model when it may not", () => {
  const good = checkRenderReply(lines(SURFACE), rules);
  assert.deepEqual({ valid: good.valid, messages: good.messages, repair: good.repair }, { valid: true, messages: SURFACE, repair: null });
  assert.deepEqual(good.result, validateRender(SURFACE, rules));

  const bad = checkRenderReply(lines(WRONG), rules);
  assert.equal(bad.valid, false);
  assert.deepEqual(bad.messages, [], "nothing to draw");
  assert.deepEqual(bad.result, validateRender(WRONG, rules));
  assert.equal(bad.repair, renderRepairPrompt(bad.result));
  assert.match(bad.repair, /^That did not pass the check, so nothing was shown\. Fix every error and send the whole surface again/);
  assert.match(bad.repair, /error \/1\/updateComponents\/components\/3\/variant \[booking\]: Button "variant" is "primary", not "Primary"/);

  const unread = checkRenderReply("Sorry, I cannot.", rules);
  assert.deepEqual(unread.result, { valid: false, errors: [{ code: "VALIDATION_FAILED", surfaceId: "", path: "", message: unread.result.errors[0].message }], advice: [], surfaces: [] });
  assert.match(unread.repair, /error \/: The reply holds no A2UI message/);

  // Messages that pass the check and draw nothing are no answer to a person.
  for (const empty of [[SURFACE[0]], [SURFACE[0], { version: V, deleteSurface: { surfaceId: "booking" } }], [...SURFACE, { version: V, deleteSurface: { surfaceId: "booking" } }]]) {
    assert.equal(validateRender(empty, rules).valid, true);
    const checked = checkRenderReply(empty, rules);
    assert.equal(checked.valid, false);
    assert.deepEqual(checked.messages, []);
    assert.match(checked.repair, /The reply shows nothing: no surface has components/);
  }
});

test("composeRender asks until a reply passes the check, and hands each refused one back with its errors", async () => {
  const calls = [];
  const replies = [lines(WRONG), "", `\`\`\`json\n${lines(SURFACE)}\n\`\`\``];
  const composed = await composeRender({
    rules,
    request: "A form to book a table",
    generate: async (call) => {
      calls.push(structuredClone(call));
      call.messages.push({ role: "user", content: "changed by the caller" });
      return replies[calls.length - 1];
    },
  });
  assert.equal(composed.valid, true);
  assert.deepEqual(composed.messages, SURFACE);
  assert.equal(composed.attempts, 3);
  assert.equal(composed.repair, null);
  assert.deepEqual(calls.map((call) => call.attempt), [1, 2, 3]);
  for (const call of calls) assert.equal(call.system, renderSystemPrompt(rules));
  assert.deepEqual(calls[0].messages, [{ role: "user", content: "A form to book a table" }]);
  // The refused reply went back with its errors; the empty one was asked for again as it was.
  const corrected = [{ role: "user", content: "A form to book a table" }, { role: "assistant", content: replies[0] }, { role: "user", content: checkRenderReply(replies[0], rules).repair }];
  assert.deepEqual(calls[1].messages, corrected);
  assert.deepEqual(calls[2].messages, corrected);
  assert.deepEqual(composed.turns, [...corrected, { role: "assistant", content: replies[2] }]);
  for (const call of calls) for (const turn of call.messages) assert.ok(turn.content.trim(), "no turn is empty");
});

test("composeRender stops at its attempts and says what was still wrong", async () => {
  let asked = 0;
  const composed = await composeRender({ rules, request: "A form", attempts: 2, generate: () => ((asked += 1), lines(WRONG)) });
  assert.equal(asked, 2);
  assert.equal(composed.valid, false);
  assert.deepEqual(composed.messages, []);
  assert.equal(composed.attempts, 2);
  assert.equal(composed.result.errors.length, 1);
  assert.equal(composed.turns.length, 3, "the request, the first reply and its correction; the last reply is in the result");
  assert.equal(composed.turns.at(-1).role, "user");

  // Left to itself it asks three times, which is the number the docs give.
  asked = 0;
  assert.equal((await composeRender({ rules, request: "A form", generate: () => ((asked += 1), lines(WRONG)) })).attempts, 3);
  assert.equal(asked, 3);
  assert.match(docs, /up to `attempts` times\s+\(3 when left out, 10 at most\)/);
  asked = 0;
  await composeRender({ rules, request: "A form", attempts: 10, generate: () => ((asked += 1), lines(WRONG)) });
  assert.equal(asked, 10);

  const first = await composeRender({ rules, request: "A form", generate: () => lines(SURFACE) });
  assert.equal(first.attempts, 1);
  assert.equal(first.turns.length, 2);
});

test("composeRender continues a conversation, with your own prompt or the page's theme", async () => {
  const first = await composeRender({ rules, request: "A form to book a table", generate: () => lines(SURFACE) });
  const action = { version: V, action: { name: "book_table", surfaceId: "booking", sourceComponentId: "send", timestamp: "2026-10-12T09:30:00Z", context: { note: "By the window" } } };
  const given = [...first.turns, { role: "user", content: JSON.stringify(action) }];
  let seen;
  const next = await composeRender({ rules, request: given, system: "Be brief.", generate: (call) => ((seen = call), lines(SURFACE)) });
  assert.equal(seen.system, "Be brief.");
  assert.deepEqual(seen.messages, given);
  assert.equal(next.turns.length, 4);
  assert.equal(given.length, 3, "the conversation passed in is left as it was");

  await composeRender({ rules, request: "A form", theme: "page", generate: (call) => ((seen = call), lines(SURFACE)) });
  assert.equal(seen.system, renderSystemPrompt(rules, { theme: "page" }));
});

test("composeRender refuses what it cannot work with, and lets a failed call through as it is", async () => {
  const generate = () => lines(SURFACE);
  const refuses = (options, words) => assert.rejects(() => composeRender(options), (error) => error instanceof TypeError && words.test(error.message));
  await refuses(undefined, /"rules" is the catalog/);
  await refuses({ generate, request: "A form" }, /"rules" is the catalog/);
  await refuses({ rules, request: "A form" }, /"generate" is your function/);
  await refuses({ rules, generate }, /"request" is what the person asked for/);
  await refuses({ rules, generate, request: "" }, /with words in it/);
  await refuses({ rules, generate, request: [] }, /"request" is what the person asked for/);
  await refuses({ rules, generate, request: [{ role: "system", content: "x" }] }, /Every turn/);
  await refuses({ rules, generate, request: [{ role: "user", content: "A form" }, { role: "assistant", content: "…" }] }, /The last turn/);
  for (const attempts of [0, 11, 1.5, "3", Number.NaN]) await refuses({ rules, generate, request: "A form", attempts }, /"attempts" is a whole number from 1 to 10/);
  await refuses({ rules, generate, request: "A form", system: " " }, /"system" is the system prompt/);
  await refuses({ rules, generate, request: "A form", theme: "inherit" }, /"theme" is "surface" or "page"/);
  await refuses({ rules, generate: () => SURFACE, request: "A form" }, /answers with the model's reply as text; got an array/);
  await assert.rejects(() => composeRender({ rules, request: "A form", generate: () => Promise.reject(new Error("The model's server answered 529.")) }), /answered 529/);
});

test("a hostile reply is read in time that grows with its length", () => {
  const size = rules.limits.inputBytes;
  const hostile = {
    "only opening braces": "{".repeat(size),
    "only empty objects": "{}".repeat(size / 2),
    "braces that never close, in strings": `{"a":"${"{\\\"".repeat(size / 4)}`,
    "deep brackets": `{"a":${"[".repeat(size / 2)}`,
    "deep brackets, closed": `{"a":${"[".repeat(size / 4)}${"]".repeat(size / 4)}}`,
    "backslashes": `{"a":"${"\\".repeat(size - 10)}"}`,
    "prose with a brace on every line": "{ not json }\n".repeat(size / 13),
    "one long string": `{"version":"${"x".repeat(size - 20)}"}`,
    "a wrapper around only opening braces": JSON.stringify({ messages: "{".repeat(size - 20) }),
    "wrappers inside a wrapper": JSON.stringify({ messages: JSON.stringify({ messages: JSON.stringify({ messages: lines(SURFACE) }) }) }),
    "closers nothing opened": `{"a":[${"}".repeat(size - 10)}`,
    "brackets closed by the wrong closer": `{"a":${"[".repeat(size / 4)}${"}".repeat(size / 4)}`,
    "objects closed by the wrong closer": `{"a":${'{"b":'.repeat(size / 12)}1${"]".repeat(size / 2)}`,
    "a new message on every line, none closed": '{"version":"v0.9.1","createSurface":{"surfaceId":"s"}\n'.repeat(size / 60),
    "past the limit": lines(SURFACE).repeat(Math.ceil((size * 2) / lines(SURFACE).length)),
  };
  for (const [what, text] of Object.entries(hostile)) {
    const started = performance.now();
    const checked = checkRenderReply(text, rules);
    const whole = performance.now() - started;
    assert.equal(checked.valid, false, what);
    assert.ok(whole < 1500, `${what}: ${Math.round(whole)} ms`);
    // The same text a little at a time, as a stream brings it.
    const reader = createRenderReader(rules);
    const begun = performance.now();
    for (let index = 0; index < text.length; index += 4096) reader.push(text.slice(index, index + 4096));
    reader.end();
    assert.ok(performance.now() - begun < 1500, `${what}, streamed: ${Math.round(performance.now() - begun)} ms`);
  }
  // Nothing is read past the limit, however much arrives after it.
  const reader = createRenderReader(rules);
  reader.push(" ".repeat(size));
  assert.deepEqual(reader.push(lines(SURFACE)), []);
  assert.match(reader.end().error, /longer than/);
});

/* The examples docs/render.md shows -------------------------------------- */

/** A fenced block under a `<!-- example: name -->` marker. */
function example(name) {
  const match = new RegExp(`<!-- example: ${name} -->\\n\`\`\`js\\n([\\s\\S]*?)\\n\`\`\``).exec(docs);
  assert.ok(match, `docs/render.md has the example "${name}"`);
  return match[1];
}

/** Runs an example's `generate` against a stand-in for the service it calls. */
async function runExample(name, env, answer) {
  const requests = [];
  const fetch = async (url, init) => {
    requests.push({ url: String(url), ...init, body: JSON.parse(init.body) });
    return answer.status ? { ok: false, status: answer.status } : { ok: true, status: 200, json: async () => answer };
  };
  const generate = new Function("fetch", "process", "MODEL", `${example(name)}\nreturn generate;`)(fetch, { env }, "a-model");
  const call = { system: "The system prompt.", messages: [{ role: "user", content: "A form" }, { role: "assistant", content: "{}" }, { role: "user", content: "Again" }], attempt: 2 };
  let reply;
  let failure;
  try {
    reply = await generate(call);
  } catch (error) {
    failure = error;
  }
  return { request: requests[0], reply, failure, requests };
}

test("the chat completions example sends the prompt as the system turn and reads the reply's text", async () => {
  const { request, reply } = await runExample("generate-chat-completions", { OPENAI_API_KEY: "key-for-this-test" }, { choices: [{ message: { role: "assistant", content: "the reply" } }] });
  assert.equal(request.url, "https://api.openai.com/v1/chat/completions");
  assert.equal(request.method, "POST");
  assert.deepEqual(request.headers, { "content-type": "application/json", authorization: "Bearer key-for-this-test" });
  assert.deepEqual(request.body, { model: "a-model", messages: [{ role: "system", content: "The system prompt." }, { role: "user", content: "A form" }, { role: "assistant", content: "{}" }, { role: "user", content: "Again" }] });
  assert.equal(reply, "the reply");
  assert.equal((await runExample("generate-chat-completions", {}, { choices: [{ message: { content: null } }] })).reply, "", "a reply with no text is an empty one, which is asked for again");
  assert.match((await runExample("generate-chat-completions", {}, { status: 429 })).failure.message, /answered 429/);
});

test("the Anthropic example sends the prompt as system and joins the reply's text blocks", async () => {
  const { request, reply } = await runExample("generate-anthropic", { ANTHROPIC_API_KEY: "key-for-this-test" }, { content: [{ type: "thinking", thinking: "…" }, { type: "text", text: "the " }, { type: "text", text: "reply" }] });
  assert.equal(request.url, "https://api.anthropic.com/v1/messages");
  assert.equal(request.method, "POST");
  assert.deepEqual(request.headers, { "content-type": "application/json", "x-api-key": "key-for-this-test", "anthropic-version": "2023-06-01" });
  assert.deepEqual(request.body, { model: "a-model", max_tokens: 8192, system: "The system prompt.", messages: [{ role: "user", content: "A form" }, { role: "assistant", content: "{}" }, { role: "user", content: "Again" }] });
  assert.equal(reply, "the reply");
  assert.equal((await runExample("generate-anthropic", {}, { content: [] })).reply, "");
  assert.match((await runExample("generate-anthropic", {}, { status: 529 })).failure.message, /answered 529/);
});

test("the Gemini example names the assistant's turns \"model\" and joins the reply's parts", async () => {
  const { request, reply } = await runExample("generate-gemini", { GEMINI_API_KEY: "key-for-this-test" }, { candidates: [{ content: { role: "model", parts: [{ text: "the " }, { text: "reply" }] } }] });
  assert.equal(request.url, "https://generativelanguage.googleapis.com/v1beta/models/a-model:generateContent");
  assert.equal(request.method, "POST");
  assert.deepEqual(request.headers, { "content-type": "application/json", "x-goog-api-key": "key-for-this-test" });
  assert.deepEqual(request.body, {
    systemInstruction: { parts: [{ text: "The system prompt." }] },
    contents: [{ role: "user", parts: [{ text: "A form" }] }, { role: "model", parts: [{ text: "{}" }] }, { role: "user", parts: [{ text: "Again" }] }],
  });
  assert.equal(reply, "the reply");
  assert.equal((await runExample("generate-gemini", {}, { candidates: [] })).reply, "", "a reply held back has no text");
  assert.match((await runExample("generate-gemini", {}, { status: 500 })).failure.message, /answered 500/);
});

test("each example carries a whole conversation through composeRender", async () => {
  const answers = {
    "generate-chat-completions": (text) => ({ choices: [{ message: { content: text } }] }),
    "generate-anthropic": (text) => ({ content: [{ type: "text", text }] }),
    "generate-gemini": (text) => ({ candidates: [{ content: { parts: [{ text }] } }] }),
  };
  for (const [name, answer] of Object.entries(answers)) {
    const replies = [lines(WRONG), lines(SURFACE)];
    const fetch = async () => ({ ok: true, status: 200, json: async () => answer(replies.shift()) });
    const generate = new Function("fetch", "process", "MODEL", `${example(name)}\nreturn generate;`)(fetch, { env: {} }, "a-model");
    const composed = await composeRender({ rules, request: "A form to book a table", generate });
    assert.equal(composed.valid, true, name);
    assert.equal(composed.attempts, 2, name);
  }
});

/* The CLI and the package ------------------------------------------------- */

test("render prompt prints the prompt a server that is not JavaScript sends", async () => {
  const printed = async (...args) => {
    const out = [];
    const code = await run(["render", "prompt", ...args], { output: { log: (line) => out.push(line), error: (line) => out.push(line) } });
    assert.equal(code, 0);
    return out.join("\n");
  };
  assert.equal(await printed(), renderSystemPrompt(rules));
  assert.equal(await printed("--tool"), renderSystemPrompt(rules, { output: "tool" }));
  assert.equal(await printed("--page-theme"), renderSystemPrompt(rules, { theme: "page" }));
  assert.equal(await printed("--tool", "--page-theme"), renderSystemPrompt(rules, { output: "tool", theme: "page" }));
});

test("mlola-ui/render/ai is the same module, reading the CLI's own copy of the check", async () => {
  const source = fs.readFileSync(path.join(root, "packages/behavior/src/render/ai.js"), "utf8");
  const copy = fs.readFileSync(path.join(root, "packages/cli/registry/render-ai.js"), "utf8");
  assert.equal(copy, source.replace('"./check.js"', '"./render.js"'));
  assert.equal(fs.readFileSync(path.join(root, "packages/cli/registry/render-ai.d.ts"), "utf8"), fs.readFileSync(path.join(root, "packages/behavior/src/render/ai.d.ts"), "utf8").replace('"./check.js"', '"./render.js"'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "packages/cli/package.json"), "utf8"));
  assert.deepEqual(manifest.exports["./render/ai"], { types: "./registry/render-ai.d.ts", default: "./registry/render-ai.js" });
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, "packages/behavior/package.json"), "utf8")).exports["./render/ai"], "./src/render/ai.js");
  const shipped = await import("../packages/cli/registry/render-ai.js");
  const declared = fs.readFileSync(path.join(root, "packages/behavior/src/render/ai.d.ts"), "utf8");
  for (const name of Object.keys(shipped)) assert.match(declared, new RegExp(`export function ${name}\\(`), `${name} has its type`);
  assert.deepEqual(Object.keys(shipped).sort(), ["checkRenderReply", "composeRender", "createRenderReader", "readRenderReply", "renderRepairPrompt", "renderSystemPrompt", "renderTool"]);
  assert.equal(shipped.checkRenderReply(lines(SURFACE), rules).valid, true);
});
