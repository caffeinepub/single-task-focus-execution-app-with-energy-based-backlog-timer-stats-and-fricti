# Specification

## Summary
**Goal:** Add a Brain Dump section on the home screen that converts freeform notes into editable items, auto-suggests an energy category, and lets users move items into the existing tasks backlog with local persistence.

**Planned changes:**
- Add a new top-level Brain Dump view/section accessible from the home screen alongside existing main/backlog views.
- Provide a large multiline input and an action to split/convert freeform text into discrete brain-dump items (e.g., newline/bullet separation).
- Display converted items in a Brain Dump list where each item can be edited or removed before conversion to tasks.
- Integrate the existing local deterministic energy categorization to suggest one of the four existing energy categories per item and allow user override using the same categories/labels/colors.
- Enable adding brain-dump items to the existing tasks backlog as Task objects matching the current Task shape, supporting single-item add and bulk add (all/selected), persisted to the existing `tasks-backlog` storage key.
- Persist Brain Dump draft text and/or item list locally so refresh restores state; handle missing/corrupted storage gracefully; provide an explicit clear action that resets UI and removes stored data.

**User-visible outcome:** From the home screen, the user can open Brain Dump, paste/type notes, convert them into individual items with suggested energy categories (editable), and move one or many items into the Backlog as tasks; the Brain Dump state survives page refresh and can be cleared intentionally.
