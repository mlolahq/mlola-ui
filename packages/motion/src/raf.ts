export type FrameTask = (timestamp: number) => void;

const queue = new Map<FrameTask, FrameTask>();
let frameId: number | null = null;

function flush(timestamp: number): void {
  frameId = null;
  const tasks = Array.from(queue.values());
  queue.clear();
  for (const task of tasks) task(timestamp);
}

export function scheduleFrame(task: FrameTask): () => void {
  queue.set(task, task);
  if (frameId === null) {
    if (typeof requestAnimationFrame === "undefined") {
      flush(typeof performance === "undefined" ? Date.now() : performance.now());
    } else {
      frameId = requestAnimationFrame(flush);
    }
  }
  return () => {
    queue.delete(task);
    if (queue.size === 0 && frameId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  };
}

export function createRafBatcher<T>(apply: (value: T, timestamp: number) => void) {
  let latest: T;
  let queued = false;
  let cancel = () => {};

  return {
    schedule(value: T) {
      latest = value;
      if (queued) return;
      queued = true;
      const task = (timestamp: number) => {
        queued = false;
        apply(latest, timestamp);
      };
      cancel = scheduleFrame(task);
    },
    cancel() {
      queued = false;
      cancel();
    },
  };
}
