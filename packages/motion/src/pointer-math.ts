export interface PointerKinetics {
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  velocityX: number;
  velocityY: number;
  speed: number;
  angle: number;
  timestamp: number;
  pointerType: string;
  active: boolean;
}

export const idlePointerKinetics: PointerKinetics = Object.freeze({
  x: 0,
  y: 0,
  deltaX: 0,
  deltaY: 0,
  velocityX: 0,
  velocityY: 0,
  speed: 0,
  angle: 0,
  timestamp: 0,
  pointerType: "",
  active: false,
});

export function calculatePointerKinetics(
  previous: PointerKinetics,
  point: Pick<PointerKinetics, "x" | "y" | "timestamp" | "pointerType">,
  smoothing = 0.25
): PointerKinetics {
  const deltaX = previous.active ? point.x - previous.x : 0;
  const deltaY = previous.active ? point.y - previous.y : 0;
  const elapsed = previous.active
    ? Math.max(1, Math.min(64, point.timestamp - previous.timestamp))
    : 16;
  const instantX = (deltaX / elapsed) * 1000;
  const instantY = (deltaY / elapsed) * 1000;
  const blend = Math.max(0, Math.min(1, smoothing));
  const velocityX = previous.velocityX + (instantX - previous.velocityX) * blend;
  const velocityY = previous.velocityY + (instantY - previous.velocityY) * blend;
  return {
    ...point,
    deltaX,
    deltaY,
    velocityX,
    velocityY,
    speed: Math.hypot(velocityX, velocityY),
    angle: Math.atan2(velocityY, velocityX),
    active: true,
  };
}
