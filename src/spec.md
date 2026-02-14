# Specification

## Summary
**Goal:** Update the Backlog “Add Task” flow so users can manually create tasks and explicitly select one of the existing energy categories (DEEP, STEADY, LOW, NONE), with the selection saved and respected by backlog filtering.

**Planned changes:**
- Ensure the Backlog “Add Task” modal supports manual task entry (without requiring Brain Dump).
- Add a clear energy/category selector in the Add Task modal with the four existing categories (DEEP, STEADY, LOW, NONE).
- Persist the selected energy/category on newly created tasks in the existing client-side backlog storage.
- Display the new task in the backlog with its category indicated and ensure backlog energy filter chips include/exclude it appropriately.
- Ensure any user-facing text involved in this change remains in English.

**User-visible outcome:** Users can open Add Task from the Backlog, manually enter a task, choose DEEP/STEADY/LOW/NONE, save it to the backlog, see its category in the list, and have it correctly respond to the backlog energy filter chips.
