# Specification

## Summary
**Goal:** Add creation timestamps, planned timelines, and completion timestamps to Backlog tasks and Brain Dump items, and present both sections in table views showing these fields.

**Planned changes:**
- Extend the client-side data models for Backlog tasks and Brain Dump items to include: created date/time, planned timeline, and completion time (with safe loading for previously persisted items missing these fields).
- Capture and store created-at timestamps automatically when creating new Backlog tasks (Add Task modal and Brain Dump → Add to Backlog) and when generating Brain Dump items from draft text; store planned timeline inputs when provided.
- Record and store a completion timestamp when a task is completed.
- Update Backlog UI to a table view with columns: Creation date, Creation time, Planned timeline, Completed time (placeholder when not completed); keep styling consistent with the warm theme and workable on mobile.
- Update Brain Dump UI to a table view for extracted items with the same columns and placeholders (noting Brain Dump items may not have completion, so show a consistent placeholder).

**User-visible outcome:** Backlog and Brain Dump now show items in tables with creation date/time and planned timeline fields, and Backlog tasks also show when they were completed (or a placeholder when not completed).
