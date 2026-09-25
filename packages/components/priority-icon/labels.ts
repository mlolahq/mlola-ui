/** Work priorities and their names, kept apart from the icon so plain logic can use them. */
export type WorkPriority = "none" | "urgent" | "high" | "medium" | "low";

/** Every priority, most pressing first, for menus and sorting. */
export const WORK_PRIORITIES: WorkPriority[] = ["urgent", "high", "medium", "low", "none"];

export const PRIORITY_LABELS: Record<WorkPriority, string> = {
  none: "No priority",
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};
