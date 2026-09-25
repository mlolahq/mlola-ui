/** Work statuses and their names, kept apart from the icon so plain logic can use them. */
export type WorkStatus = "backlog" | "todo" | "in-progress" | "in-review" | "done" | "canceled";

/** Every status in workflow order, for menus and grouping. */
export const WORK_STATUSES: WorkStatus[] = ["backlog", "todo", "in-progress", "in-review", "done", "canceled"];

export const STATUS_LABELS: Record<WorkStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  "in-progress": "In progress",
  "in-review": "In review",
  done: "Done",
  canceled: "Canceled",
};
