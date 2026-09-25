export interface SpringOptions {
  stiffness?: number;
  damping?: number;
  mass?: number;
  restSpeed?: number;
  restDelta?: number;
  maxDelta?: number;
}

export interface SpringState {
  value: number;
  velocity: number;
}

export interface SpringStep extends SpringState {
  done: boolean;
}

export const springPresets = {
  gentle: { stiffness: 170, damping: 26, mass: 1 },
  snappy: { stiffness: 320, damping: 28, mass: 0.9 },
  bouncy: { stiffness: 260, damping: 18, mass: 1 },
} as const satisfies Record<string, SpringOptions>;

export function integrateSpring(
  state: SpringState,
  target: number,
  deltaMs: number,
  {
    stiffness = 240,
    damping = 26,
    mass = 1,
    restSpeed = 0.01,
    restDelta = 0.01,
    maxDelta = 32,
  }: SpringOptions = {}
): SpringStep {
  const safeMass = Math.max(0.001, mass);
  let remaining = Math.max(0, Math.min(maxDelta, deltaMs)) / 1000;
  let value = state.value;
  let velocity = state.velocity;

  // Fixed substeps make the semi-implicit Euler integration stable after slow frames.
  while (remaining > 0) {
    const step = Math.min(remaining, 1 / 120);
    const springForce = -stiffness * (value - target);
    const dampingForce = -damping * velocity;
    velocity += ((springForce + dampingForce) / safeMass) * step;
    value += velocity * step;
    remaining -= step;
  }

  const done = Math.abs(velocity) <= restSpeed && Math.abs(target - value) <= restDelta;
  return done
    ? { value: target, velocity: 0, done: true }
    : { value, velocity, done: false };
}

export interface SpringAnimation {
  setTarget(target: number): void;
  set(value: number): void;
  stop(): void;
  get(): SpringState & { target: number; running: boolean };
}

export function createSpringAnimation({
  from = 0,
  to = from,
  options,
  onUpdate,
  onComplete,
}: {
  from?: number;
  to?: number;
  options?: SpringOptions;
  onUpdate: (value: number, state: SpringState) => void;
  onComplete?: (value: number) => void;
}): SpringAnimation {
  let state: SpringState = { value: from, velocity: 0 };
  let target = to;
  let running = false;
  let frame: number | null = null;
  let previousTime = 0;

  const stop = () => {
    if (frame !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(frame);
    }
    frame = null;
    running = false;
    previousTime = 0;
  };

  const tick = (timestamp: number) => {
    const delta = previousTime === 0 ? 1000 / 60 : timestamp - previousTime;
    previousTime = timestamp;
    const next = integrateSpring(state, target, delta, options);
    state = { value: next.value, velocity: next.velocity };
    onUpdate(state.value, state);
    if (next.done) {
      stop();
      onComplete?.(state.value);
    } else {
      frame = requestAnimationFrame(tick);
    }
  };

  const start = () => {
    if (running || Object.is(state.value, target)) return;
    running = true;
    if (typeof requestAnimationFrame === "undefined") {
      state = { value: target, velocity: 0 };
      onUpdate(target, state);
      running = false;
      onComplete?.(target);
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  return {
    setTarget(nextTarget) {
      target = nextTarget;
      start();
    },
    set(value) {
      stop();
      state = { value, velocity: 0 };
      onUpdate(value, state);
    },
    stop,
    get: () => ({ ...state, target, running }),
  };
}
