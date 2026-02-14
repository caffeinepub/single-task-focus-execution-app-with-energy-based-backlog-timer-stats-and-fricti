# Specification

## Summary
**Goal:** Ensure tasks added from Brain Dump to the main backlog persist even after clearing/deleting the Brain Dump, and clarify this behavior in the UI.

**Planned changes:**
- Update Brain Dump clear/delete behavior so it only clears Brain Dump storage keys (`brain-dump-draft`, `brain-dump-items`) and never removes/overwrites tasks stored in `tasks-backlog`.
- Verify tasks added via “Add All to Backlog” / “Add Selected” remain in the Backlog after clearing Brain Dump and after a page reload.
- Add/adjust helper text in the Brain Dump view to state that clearing Brain Dump does not delete tasks already added to the backlog (keep “local” framing and English-only copy).

**User-visible outcome:** Users can clear the Brain Dump without losing any tasks they already added to the Backlog, and the Brain Dump UI clearly communicates that tasks will remain.
