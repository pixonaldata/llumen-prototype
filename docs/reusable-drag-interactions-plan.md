# Reusable drag, sort, resize, and drop — design and execution plan

This document describes how to evolve **one coherent interaction layer** across the product: draggable items, sortable lists (including nesting), resizable elements, and **droppable contexts** with different layout rules. It maps what already exists, what to extract, and how to land it in `js/llumen-components.js` and `css/styles.tailwind.css` without hardcoding page-specific behavior in the shared library.

---

## Goals

1. **Single source of truth** for pointer-driven drag UX: ghost (follows cursor), placeholder (shows drop slot), optional “crossed item” animation — aligned with the behavior already proven in the Drag & Drop Card List.
2. **Composable primitives** that pages configure (selectors, payloads, callbacks, accept rules) rather than baking in IDs like `component-library-*` or one-off class names tied to a single screen.
3. **Context adapters** for grid-based, row-based (nested + phantom rows), and canvas-based drop targets, each enforcing its own geometry and validity rules.
4. **CSS-first presentation** for ghost, placeholder, resize handle, and drag states so tokens and shadows stay consistent and easy to tune.

Non-goals for the first milestone: replacing every legacy implementation in one PR; changing product behavior before the abstraction is covered by at least one migrated consumer (the card list).

---

## Architecture overview

Think in **layers**:

| Layer | Responsibility | Lives in |
| --- | --- | --- |
| **Pointer drag core** | Start / move / end; ghost + placeholder lifecycle; pointer offset; global listeners cleanup | `llumen-components.js` (exported helpers) |
| **Sortable list** | Axis (vertical / horizontal), hit-testing, DOM reorder of placeholder, sibling animation, optional nested containers | Same module, built on core |
| **Resizable** | SE handle only; min/max; optional snap (grid units or arbitrary step) | Same module; snap policy injected |
| **Droppable context** | Interprets pointer position → logical cell / row / canvas coordinates; validates accept rules; commits model + DOM | Context modules + page wiring |
| **Styling** | Ghost, placeholder, dragging source, resize handle, context highlights | `styles.tailwind.css` (new section) |

**Payload model (conceptual):** each drag session carries a small descriptor, for example `{ type: 'workflow-node' | 'dashboard-component' | 'generic', id, sourceContextId, dimensions, meta }`. Droppable contexts use `type` (and optional custom predicates) to decide whether to show a placeholder and whether drop is allowed.

---

## Current implementation inventory

### 1. Drag & Drop Card List (canonical pointer-sort UX)

`renderDragDropCardList` in `js/llumen-components.js` implements the desired **pointer** drag (not HTML5 `dragstart` / `drop`):

- **Handle:** dedicated drag button (`.node-config-card-drag`) with `mousedown` → `startPointerDrag`.
- **Placeholder:** `cloneNode` of the card, IDs stripped, extra overlay for tint, inserted in the list; source hidden (`display: none`) and dimmed class.
- **Ghost:** second `cloneNode`, `position: fixed`, follows cursor with stored pointer offset.
- **Reorder feedback:** `getHoveredCardBlockByPointerY`, placeholder `insertBefore` / `appendChild`, `animateCrossedCardBlock` with `translateY` and 170ms easing.
- **Commit:** `moveItemToIndexByKey` then full `rebuild()`.

Reference:

```4991:5292:js/llumen-components.js
        function renderDragDropCardList({
            container,
            stateOwner,
            itemsKey,
            instanceId,
            // ...
        }) {
            // ...
            const ensureDragPlaceholder = (sourceBlock) => {
                // clone, strip ids, inline overlay + dimensions
            };
            const startPointerDrag = (startEvent, itemId, cardBlock, totalCount) => {
                // ghost + placeholder + mousemove/mouseup
            };
            // ...
        }
```

**CSS today:** list chrome lives under “Drag & Drop: Card List” (`.ll-dragdrop-card-list*`). Ghost and placeholder styling are still **mostly inline** in JS (box shadow, overlay `rgba`, dimensions).

**Naming debt:** placeholder uses `node-config-condition-placeholder` — that name is **node-config–centric** and should become a **generic** class (for example `.ll-dnd__placeholder`) when extracted, per reusable-component boundary rules.

### 2. Workflow HTML — canvas + overlap resolution

`workflow/979669f6a773bc14ee5e3b19.html` contains:

- **Free canvas** node positioning (`workflow-canvas-*`, pan/zoom state, absolute nodes).
- **Overlap avoidance:** `getNodeVisualBounds`, `areNodesOverlappingWithMargin`, `moveNodeAwayFromBase`, `resolveNodeOverlaps(anchorNodeIds, margin)` — a queue-based propagation that nudges non-anchor nodes when they intersect anchored nodes.

Reference:

```16780:16850:workflow/979669f6a773bc14ee5e3b19.html
        function getNodeVisualBounds(node) { /* ... */ }

        function areNodesOverlappingWithMargin(a, b, margin = NODE_MARGIN) { /* ... */ }

        function moveNodeAwayFromBase(baseNode, movingNode, margin = NODE_MARGIN) { /* ... */ }

        function resolveNodeOverlaps(anchorNodeIds, margin = NODE_MARGIN) {
            // queue fixed anchors, push overlapping movable nodes, iterate
        }
```

The same file also **duplicates** card-list-style drag code for node config (e.g. `renderReusableDragDropCardList` usage and local `ensureDragPlaceholder` patterns around the grep hits for `dragGhostElement`). Long term, those paths should call the **shared** primitive.

### 3. Dashboard HTML — grid-based layout, header drag, SE resize

`dashboard/68ee2d555a24aca8065fbfa1.html` implements:

- CSS grid with configurable column count (`grid-cols-*`), row packing, `dataset.colSpan` / `dataset.rowSpan`.
- **Draggable handle:** component **header** with `draggable = true` (HTML5 DnD), while the shell is not draggable.
- **Resize:** `.resize-handle` SE-only; grid reflow and `updateComponentTransforms` / `captureAndFixComponentPositions` for animation.
- View vs edit modes, guide overlays.

Reference (add component + header as drag handle):

```919:992:dashboard/68ee2d555a24aca8065fbfa1.html
        function addComponentToGrid(componentType) {
            // ...
            componentDiv.draggable = false;
            const header = document.createElement('div');
            header.className = 'dashboard-component-header ... cursor-move';
            header.draggable = true;
            // ...
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle resize-handle-se ...';
```

The dashboard uses **two different interaction technologies** today (HTML5 drag for grid + pointer sort in card list). The reusable plan should **prefer pointer-based drag** for consistency with the card list, unless a context *requires* native DnD (e.g. cross-window); grid hit-testing can still be pointer-driven.

### 4. Row-based context (specified behavior, not yet a single extracted file)

Product requirement (from product brief):

- **Outer sortable:** rows inside a main container.
- **Inner sortable:** components within a row; components may move **between** rows.
- **Phantom rows:** invisible empty rows before, between, and after filled rows; hovering while dragging shows placeholder in an empty row; after drop, regenerate phantoms.
- **Sizing:** max **width units** per row (e.g. 4 units → each unit 25% row width); height content-fit; resize only width in unit steps.

This likely becomes a **dedicated context module** once the sortable + accept API exists.

---

## Proposed shared API (sketch)

All names are illustrative; final names should match existing `ll-*` conventions in `llumen-components.js`.

### Pointer drag core

- `createPointerDragSession(options)`  
  - `getDragSourceElement()` / `rootElement`  
  - `resolveHandle(eventTarget)` → element that starts drag (header, icon button, or root)  
  - `onMove(session, pointer)`  
  - `onEnd(session, pointer)`  
  - `buildGhost(sourceElement)` → optional override; default shallow clone + strip `id` + `aria-*` duplicates  
  - `buildPlaceholder(sourceElement)` → same  
  - `ghostMount: 'body' | (el => void)`  
  - **CSS classes** applied to ghost/placeholder instead of inline visual styles where possible.

### Sortable list (1D)

- `initSortableList({ container, axis: 'vertical' | 'horizontal', itemSelector, handleSelector | null, accepts, onReorder })`  
  - `accepts(dragPayload, listContext)` → boolean (for nested trees / cross-list).  
  - Emits **logical** `fromIndex` / `toIndex` or stable IDs; DOM rebuild may still be caller-owned (as card list does with `rebuild()`).

### Resizable

- `initResizableElement({ element, minWidth, maxWidth, minHeight, maxHeight, snapX, snapY, onResize })`  
  - **Handle:** always SE; single shared class `.ll-resize-handle--se` in CSS.  
  - **Snap:** `null` (free) or number (px) or `(size) => snappedSize` for grid-unit contexts.

### Droppable contexts (adapters)

- **Grid:** `initGridDropContext({ gridElement, columnCountGetter, cellMetrics, onLayoutChange })` — port math from dashboard: span, collision with occupied cells, optional animation hook.  
- **Canvas:** `initCanvasDropContext({ surfaceElement, state, setPosition, onDrop })` + reuse **extracted** `resolveNodeOverlaps` logic as a pure helper over rectangles / node metrics.  
- **Row:** `initRowBandContext({ ... })` — phantom row DOM, unit sum validation, horizontal sort within row.

Each adapter **does not** know business nouns (“Chapter”, “Slide”); it only sees payload types and dimensions.

---

## CSS plan (`css/styles.tailwind.css`)

Add a dedicated section (per `styles-tailwind-organization.mdc`), for example **“Interaction: Drag, drop, resize”**, placed near related layout/tooling sections.

| Class role | Purpose |
| --- | --- |
| `.ll-dnd__ghost` | Fixed layer, elevated shadow, reduced opacity, `pointer-events: none` |
| `.ll-dnd__ghost--dragging` | Optional modifier while active |
| `.ll-dnd__placeholder` | Outline / dashed border / tokenized tint via `--ll-color-*` |
| `.ll-dnd__placeholder-overlay` | Absolutely positioned wash (replaces inline `rgba` overlay) |
| `.ll-dnd__source--dragging` | Opacity / transition for hidden-or-dimmed source |
| `.ll-sortable__item--shift` | Transition for translate animation (or reuse a single utility transition) |
| `.ll-resize-handle--se` | SE handle geometry, hover, `cursor: nwse-resize` (migrate from dashboard inline styles) |
| Context hooks | `.ll-drop-context--hover`, `.ll-grid-cell--preview`, etc., as needed **without** page-specific prefixes |

**Migration step:** move inline styles from `renderDragDropCardList` (ghost box shadow, placeholder overlay) into these classes; keep only **dynamic** values in JS (width/height matching source rect, positions).

---

## Execution plan (phased)

### Phase A — Extract pointer-drag core from the card list

1. **Identify** the minimal closed set of functions inside `renderDragDropCardList`: placeholder factory, ghost factory, pointer move/up, slot index helpers, crossed animation, `moveItemToIndexByKey` (stays caller-side or becomes optional callback).
2. **Extract** to named exports, e.g. `initVerticalSortableCards` + internal `createPointerDragController`, parameterized by:
   - container element  
   - item selector / id dataset key  
   - handle selector  
   - `onCommitReorder(fromId, toIndex)`  
3. **Replace** inline ghost/placeholder styles with `.ll-dnd__*` classes; rename `node-config-condition-placeholder` → generic class.
4. **Re-wire** `renderDragDropCardList` to use the extracted helper so behavior is unchanged.
5. **Search** `llumen-components.js` (and later workflow) for duplicated placeholder/ghost blocks and schedule deletion in favor of the helper.

**Exit criteria:** Card list identical UX; new CSS classes in use; no new page-specific strings in the shared export surface.

### Phase B — Generalize axis and hit-testing

1. Add `axis: 'horizontal'` branch (pointer X instead of Y, `translateX` animation).  
2. Add **nested list** support: `closestSortableContainer`, bubbling of drag payload, `accepts()` to allow / deny cross-parent moves.  
3. Document **payload registration** for nested “Index → Chapter → Section” scenarios.

**Exit criteria:** Demo in `component-library.html` (page wiring only) showing two nested vertical lists with cross-parent drop — without polluting shared library with `component-library-*` hooks beyond initialization config.

### Phase C — Resizable primitive + grid adapter (dashboard extraction)

1. Implement `initResizableElement` with SE handle and optional snap.  
2. Port dashboard grid logic into `initGridDropContext` + helpers (column count, span, cell hit test).  
3. Optionally unify drag **technology** on the dashboard (pointer vs native DnD) — only if it does not regress browser behavior; otherwise document the exception.

**Exit criteria:** Dashboard page could import from `llumen-components.js` for grid interactions (even if the HTML file is not switched immediately, the functions exist and are covered by a small harness or story in the component library).

### Phase D — Canvas adapter + overlap helper (workflow extraction)

1. Copy `resolveNodeOverlaps` and dependencies into shared **pure** helpers (no `state.nodes` globals — pass arrays of `{ id, x, y, width, height, metrics }`).  
2. Wire workflow to call shared helper (thin wrapper passes nodes).  
3. Canvas drag uses same pointer ghost pattern as sortable where applicable.

**Exit criteria:** Overlap behavior unchanged; workflow file shrinks or delegates to shared module.

### Phase E — Row-band context (phantom rows + units)

1. Data model: rows array, each with `components` and `maxUnits`.  
2. DOM: phantom row slots; placeholder only when `accepts` and `sum(units) + draggedUnits <= max`.  
3. Regenerate phantoms after each successful drop.

**Exit criteria:** Component-library demo + one real product surface adopting it.

---

## Risks and decisions

| Topic | Decision |
| --- | --- |
| Pointer vs HTML5 DnD | Default **pointer** for in-app precision (card list parity). Use native DnD only where required. |
| `rebuild()` full re-render | Acceptable for config cards; for large lists, consider **DOM-only reorder** + callback — document perf follow-up. |
| Touch | Card list uses mouse events; plan **Pointer Events** (`pointerdown` / `move` / `up`) in a later sub-phase for mobile parity. |
| Accessibility | Preserve keyboard reorder (future) or announce drag via `aria-grabbed` / live region — not in Phase A. |
| Z-index | Centralize ghost z-index in CSS variable if needed (e.g. `--ll-z-dnd-ghost`). |

---

## File touch map (expected)

| File | Changes |
| --- | --- |
| `js/llumen-components.js` | New exports: pointer drag controller, sortable init, resizable init, grid/canvas/row adapters over time; `renderDragDropCardList` becomes a thin consumer. |
| `css/styles.tailwind.css` | New “Interaction: Drag, drop, resize” section; ghost, placeholder, handle, modifiers using `--ll-color-*`. |
| `dashboard/68ee2d555a24aca8065fbfa1.html` | Later: delegate to shared grid + resize (optional migration). |
| `workflow/979669f6a773bc14ee5e3b19.html` | Later: delegate overlap + optionally DnD card duplication. |
| `component-library.html` | Demos and wiring only (`init*` calls with selectors). |

---

## Summary

The **Drag & Drop Card List** already encodes the gold-standard **pointer + ghost + placeholder + animated siblings** pattern; Phase A lifts that into reusable, configurable primitives and moves visuals into `styles.tailwind.css`. **Grid**, **canvas + overlap resolution**, and **row-band** behaviors are well-specified in existing pages and become **context adapters** on top of the same payload and drag session model, keeping `llumen-components.js` instance-agnostic and pages responsible for wiring and business types.
