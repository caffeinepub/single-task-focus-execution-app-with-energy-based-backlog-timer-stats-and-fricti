# Specification

## Summary
**Goal:** Simplify the Brain Dump view by removing the Energy Assistant and providing a single offline action to split a brain dump into distinct task items.

**Planned changes:**
- Remove the “Energy Assistant” button/action from the Brain Dump view.
- Add a single primary action (e.g., “Convert to Tasks”) that converts the current Brain Dump draft text into multiple individual items using the existing local deterministic extraction logic (offline; no external AI/LLM calls).
- Update Brain Dump helper/description copy to remove any “Energy Assistant” references and explain that the draft will be split into individual tasks.

**User-visible outcome:** In Brain Dump, the user sees one primary “Convert to Tasks” action; clicking it splits common multi-task draft text (bullets, numbered lists, semicolons, multi-clause sentences) into multiple editable Brain Dump task items, with no Energy Assistant wording or button present.
