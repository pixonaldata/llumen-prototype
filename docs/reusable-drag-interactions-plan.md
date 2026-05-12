# Reusable drag, sort, resize, and drop — design and execution plan

This document describes how to evolve **one coherent interaction layer** across the product: draggable items, sortable lists (including nesting), resizable elements, and **droppable contexts** with different layout rules. It maps what already exists, what to extract, and how to land it in `js/llumen-components.js` and `css/styles.tailwind.css` without hardcoding page-specific behavior in the shared library.

---

## Goals

1. **Single source of truth** for drag UX: ghost (follows pointer), placeholder (shows drop slot), optional “crossed item” animation — aligned with the behavior already proven in the Drag & Drop Card List.
2. **Pointer Events** (`pointerdown` / `pointermove` / `pointerup` / `pointercancel`) as the default transport so **mouse, pen, and touch** share one code path (replacing mouse-only listeners in extracted code).
3. **Auto-scroll while dragging** near scrollable container edges — **in scope for Phase A** alongside the first extraction.
4. **Composable primitives** that pages configure (selectors, payloads, callbacks, accept rules) rather than baking in IDs like `component-library-*` or one-off class names tied to a single screen.
5. **Context adapters** for grid-based, row-based (nested + phantom rows), and canvas-based drop targets, each enforcing its own geometry and validity rules.
6. **CSS-first presentation** for ghost, placeholder, resize handle, and drag states so tokens, shadows, and stacking stay consistent and easy to tune.
7. **Extension-ready foundation** for (a) **insertion drag** from a palette or modal into a canvas/grid (**`initCanvasDropContext`** / **`beginInsertPointerDrag`** in the shared bundle; Component Library canvas demo), as in `workflow/979669f6a773bc14ee5e3b19.html`, and (b) later **true cross-context** moves (e.g. between two simple lists) without redesigning the payload/session model.
8. **Symmetric snapshot I/O where product needs it:** row-band **`read` / `write` / `applyRowBandModel`** is the reference pattern; **grid** uses **`readLlumenGridTilesModelFromHost`**, **`writeLlumenGridTilesModelToHost`**, **`initGridTileModelContext`** (**`applyGridTilesModel`** + **`renderGridTile`**); **canvas** uses **`readLlumenSurfacePlacedItemsModelFromHost`**, **`writeLlumenSurfacePlacedItemsModelToHost`**, **`applyLlumenSurfacePlacedItemsModel`** (**`renderPlacedItem`** + **`afterApply`**). Tile/node innards stay **page-supplied** — without requiring **workflow** / **dashboard** file migrations.

**Status — Phase A sortable path shipped:** **`js/llumen-sortable-engine.js`** (load before **`js/llumen-components.js`**) plus **`initSortableList`** / **`initVerticalSortableList`** provide Pointer Events sortable reorder with fixed ghost, **`.ll-dnd__source--dragging`**, auto-scroll, Escape cancel, and FLIP **`animation`**. **`renderDragDropCardList`** already uses **`initVerticalSortableList`** as its consumer; Component Library drag-and-drop demos exercise vertical, horizontal, and nested cross-list cases. **Phase A #10** (dedup legacy card-drag in **workflow** and similar) remains a **future** cleanup when those files are edited—it is **not** part of the **current** implementation scope (see **Current scope boundary** below).

Non-goals for **remaining** rollout: replacing every legacy implementation in one PR; **gating** new surfaces on **workflow** file dedup (the **card list** and component-library demos already prove the shared sortable + pointer session path).

### Current scope boundary (explicit descope)

**In scope for “next work” right now:** changes confined to **shared library** (`js/llumen-components.js`, **`js/llumen-sortable-engine.js`**), **`css/styles.tailwind.css`**, **Component Library** wiring (`component-library.html`, **`js/component-library-drag-drop-demos.js`**), and this plan doc.

**Explicitly descoped until reconsidered:** edits that **only** exist to migrate or deduplicate **workflow** HTML (`workflow/*.html`), **dashboard** HTML (`dashboard/*.html`), or other **existing product pages**—including Phase A **#10** workflow drag dedup, **dashboard → shared grid** migration, and **workflow** overlap/drag refactors. Those items stay documented below as **deferred** reference, not as mandatory next steps.

### Implementation status snapshot (resume here)

| Area | Shipped in repo | Next up (priority) |
| --- | --- | --- |
| **Phase A** | Sortable + pointer session + card list consumer (drag handle **`.ll-dragdrop-card-list__drag-handle`**) | **#10 deferred:** workflow / other legacy card-drag dedup (out of current scope). **Workflow** still uses the older **`node-config-card-drag`** hook until those files are migrated |
| **Phase B** | Horizontal + nested sortable + `accepts` / payload docs | **—** |
| **Phase C** | … same as shipped, plus **`readLlumenGridTilesModelFromHost`**, **`writeLlumenGridTilesModelToHost`**, **`initGridTileModelContext`** (**`getGridTilesModel`** / **`applyGridTilesModel`** + **`renderGridTile`**) + Component Library **Load sample tiles** / **Re-apply from snapshot** | **Deferred:** **dashboard** migration to shared grid APIs (out of current scope) |
| **Phase D** | … same as shipped, plus **`readLlumenSurfacePlacedItemsModelFromHost`**, **`writeLlumenSurfacePlacedItemsModelToHost`**, **`applyLlumenSurfacePlacedItemsModel`**, **`initCanvasDropContext`** (palette insert in Component Library) + **Load sample nodes** / **Re-apply from snapshot** | **Deferred:** further **workflow**-only rewires |
| **Phase E** | Same as shipped, plus **`writeLlumenRowBandModelToHost`**, **`normalizeLlumenRowBandRowShellsForCapacity`**, **`initRowBandContext`** **`applyRowBandModel`** (destroy → write → re-mount sortables) when **`renderFilledRow`** is provided; Component Library row demo exercises **Load sample rows** + **Re-apply from snapshot** | **Deferred:** wiring into **workflow/dashboard** until scope expands |

**Suggested order for the next implementation slice (current scope):** **Do not** treat **workflow** or **dashboard** file migrations as blockers for this track.

---

## Scope boundaries

| In scope (near term) | Out of scope until the pointer story is stable |
| --- | --- |
| Pointer Events, ghost/placeholder, auto-scroll, transactional commit/cancel | **Keyboard** reordering, **screen reader** announcements (`aria-grabbed`, live regions), and other **accessibility** enhancements for drag |
| Same-context reorder; **cross-list reorder** between registered sortables with `accepts`; insertion from external source; foundation for richer cross-context | Full **ad-hoc cross-surface** drag-and-drop across arbitrary unregistered targets (grid/canvas without adapters — can follow once primitives + payload are proven in those contexts) |

---

## Architecture overview

Think in **layers**:

| Layer | Responsibility | Lives in |
| --- | --- | --- |
| **Pointer drag core** | Start / move / end / cancel; **Pointer Events**; ghost + placeholder lifecycle; pointer offset; capture + cleanup; **edge auto-scroll** | `llumen-components.js` (exported helpers) |
| **Sortable list** | SortableJS-style drag-over (`swapThreshold` / invert), **moves the real row in-document** during the gesture; fixed ghost + pointer session from core; FLIP sibling animation + cross-list insert rules live in the engine | `js/llumen-sortable-engine.js` (engine) + `initSortableList` bridge in `js/llumen-components.js` — load **engine script before** components |
| **Resizable** | SE handle only; min/max; optional snap (grid units or arbitrary step) | Same module; snap policy injected |
| **Droppable context** | Interprets pointer position → logical cell / row / canvas coordinates; validates accept rules; commits model + DOM | Context modules + page wiring |
| **Styling** | Ghost, placeholder, dragging source, resize handle, context highlights, **z-index tokens** | `styles.tailwind.css` (new section) |

---

## Session invariants

These rules apply to every drag session implemented on top of the shared core:

1. **At most one active session** globally (or explicitly scoped per “interaction root” if we later need parallel modals — default is one).
2. **Ghost** is mounted under `document.body` (or caller-provided mount) with `pointer-events: none` so it never steals hits. **Clone depth (v1):** build the ghost with **`cloneNode(true)`** (full subtree), then **sanitize** (strip `id`, duplicate `aria-*`, etc.) — see invariant **10**.
3. **Placeholder** stays inside the DOM subtree controlled by the active sortable/context adapter (never orphaned without teardown).
4. **Listeners** use Pointer Events; prefer **`setPointerCapture`** on the drag handle (or source) so moves/cancel are reliable when the pointer leaves the element; handle **`lostpointercapture`**, **`pointercancel`**, and **`visibilitychange`** (hidden tab) the same as an aborted drag.
5. **Teardown** on end/cancel always removes ghost, removes or restores placeholder, restores source visibility/styles, clears auto-scroll timers / animation frames, removes temporary **touch-action** overrides on the drag handle/root (see below), and removes global listeners (including **Escape** listener when used).
6. **Commit semantics** — see next section: **no partial commits mid-gesture**; the **data model is not mutated** until a single validated commit at successful drop end.
7. **Touch / scroll contention:** while a session is active, the element that owns the gesture (the **handle**, or the **whole item** when the entire row is draggable) gets **`touch-action: none`** (via a shared CSS class such as `.ll-dnd__capture-target--active`) so the browser does not treat the pointer trajectory as **page scroll** instead of drag. Remove that class on teardown so normal scrolling returns.
8. **Drag vs resize mutex (ignore second):** a **drag-reorder/move** session and an **SE resize** session must not run at the same time (same default **global** scope as invariant **1**). Whichever starts **first** keeps control until it ends or cancels. If a **drag** is active, **`pointerdown`** on a **resize handle** is a **no-op**. If a **resize** is active, **starting a drag** is a **no-op**. We do **not** auto-cancel the active session when the user tries the other gesture.
9. **Focus after drag ends:** on **commit** or **cancel** (including Escape), the shared core **returns focus** to the **drag handle** that started the gesture, if that element is still **`connected`**, not **`disabled`**, and can receive focus (e.g. a `button` handle). Use **`focus({ preventScroll: true })`** when available to avoid jarring scroll jumps. If the handle is gone (e.g. list **`rebuild()`** removed the DOM) or is not focusable, **skip** focus restoration silently. Callers may pass **`onSessionEnd({ reason: 'commit' | 'cancel', handleElement })`** to move focus elsewhere (e.g. first field inside a rebuilt card).
10. **Ghost and placeholder clone depth (v1):** use **`cloneNode(true)`** on the source element for both **ghost** and **placeholder** (when the placeholder is a clone of the item), matching the current Drag & Drop Card List, then run **sanitization** on the clones. **Shallow-only** or **simplified** ghosts are **out of scope for v1**; optional **`buildGhost` / `buildPlaceholder`** overrides remain in the API for a **future** perf pass if a surface needs a lightweight visual.

---

## Commit and cancel semantics

**Hard rules:**

1. **No partial commits mid-gesture (authoritative model).** Nothing in the **caller-owned data model** may change during `pointermove` — only **ephemeral** UI (ghost position, highlights) **unless** the interaction is an **in-document sortable**: the engine may **reorder real list nodes** while dragging so hit-testing matches what the user sees; the shared **`onReorder` / `onCommit`** path still applies **one** durable model update at **pointer-up** (or restores DOM on cancel). Card-list style flows may keep the source in place and use a **placeholder clone** until commit — both are valid consumers of the pointer core.
2. **Single commit point.** The model (and any durable DOM) updates **once**, when **`validateDrop`** has passed and **`commit`** runs at the end of a successful drop gesture.
3. **Always snap back with no model change** when:
   - **`validateDrop` fails** on release (wrong target, over capacity, incompatible type, etc.),
   - the user releases **outside** any valid drop target,
   - the user presses **Escape**,
   - or the session is **canceled** (`pointercancel`, `lostpointercapture`, `visibilitychange` / hidden tab, etc.).

In all cancel paths the UI returns to the pre-drag state: ghost removed, placeholder removed, source element visibility/styles restored — **no model update**.

**Escape in the shared core:** the extracted drag controller should register a **`keydown`** listener (e.g. on `window`, with **`Escape`** only) while a session is active, and treat it like **`onCancel`** — unless explicitly disabled via a rare option for embedded edge cases. Pages must not need to wire Escape themselves for the default sortable/card behavior.

**Focus:** after commit or cancel, default to **focus on the drag handle** (Session invariant **9**). Full keyboard reorder patterns remain **out of scope** until later; this rule still improves UX after Escape and after pointer-driven completion.

---

## Adapter contract (droppable / sortable contexts)

Each context adapter should implement the same conceptual operations so grid, row-band, canvas, and simple lists stay interchangeable at the API boundary:

| Operation | Responsibility |
| --- | --- |
| **`hitTest(pointer, session)`** | Map client coordinates to a logical target (slot index, cell, row id, canvas coords) or `null` if not over this context. |
| **`previewLayout(session, hitResult)`** | Update placeholder / highlights only; **no** durable model change. |
| **`validateDrop(session, hitResult)`** | Return whether commit is allowed (`accepts`, capacity, units sum, etc.). |
| **`commit(session, hitResult)`** | Apply model + DOM changes atomically from the adapter’s perspective. |
| **`cancel(session)`** | Remove previews; release any adapter-local state. |

Sortable-only surfaces can implement the same contract where `hitTest` reduces to “index before/after this sibling.”

---

## Cross-context, insertion drag, and payload shape

**Today:** we do **not** rely on generic “drag from list A into list B” across arbitrary contexts. We **do** rely on **insertion drag**: e.g. in `workflow/979669f6a773bc14ee5e3b19.html`, a node is added from the nodes panel by **click** or by **dragging** into the canvas. The same pattern will appear elsewhere (e.g. dragging a **Component** from a seamless **modal** into a **grid**).

**Foundation requirements:**

- Payload distinguishes at least: **`{ kind: 'reorder', id, … }`** (existing item in a list/canvas) vs **`{ kind: 'insert', templateKey | itemRef, … }`** (catalog / modal source — no existing layout id until commit).
- **`sourceContextId`** (or equivalent) tags where the gesture started so adapters can refuse incompatible drops without knowing product nouns.
- Optional **`ids: string[]`** for **multi-select** moves on canvas (see below); single-id remains the common case.

**Implemented:** multiple **`initSortableList`** instances register with a shared controller in **`js/llumen-sortable-engine.js`**. **`accepts(payload, context, pointer?)`** plus a **`buildDragPayload`** (defaults to `{ kind: 'reorder', id, sourceContainer, itemSelector }`) enable **cross-list reorder** between lists that agree on the payload (see Component Library: Simple, Nested sections, Horizontal). **Hit-target stickiness:** if the pointer leaves every list’s bounding rect (e.g. gaps between chapter cards) but the item already lives in another list, resolution **sticks to the current parent list** when it still `accepts` — avoids snapping back to the source list mid-gesture.

---

## Payload model (conceptual)

Each drag session carries a small descriptor, for example:

```ts
// Conceptual — not necessarily TypeScript in repo
type DragPayload =
  | { kind: 'reorder'; type: string; id: string; ids?: string[]; sourceContextId?: string; dimensions?: Rect; meta?: unknown }
  | { kind: 'insert'; type: string; templateKey: string; sourceContextId?: string; dimensions?: Rect; meta?: unknown };
```

- **`kind: 'reorder'`** — moving an existing item; **`ids`** optional: when multiple canvas nodes are selected and dragged together (see workflow today), **`ids`** lists every participant; single-item drags use **`id`** only or `ids.length === 1`.
- **`kind: 'insert'`** — palette/modal → canvas/grid; commit creates new element(s) at the hit location.
- Droppable contexts use **`type`**, **`kind`**, and optional **`accepts(payload, context)`** to decide preview + commit.

---

## Current implementation inventory

### 1. Drag & Drop Card List (canonical sort UX — now on pointer + sortable engine)

`renderDragDropCardList` in `js/llumen-components.js` reorders cards with **`initVerticalSortableList`** (Pointer Events session from **`runLlumenPointerDragSession`** via **`llumen-sortable-engine.js`**), not HTML5 `dragstart` / `drop` and not a legacy **`mousedown` / mousemove** card loop.

- **Handle:** dedicated drag button (`.ll-dragdrop-card-list__drag-handle`); behavior is pointer-driven.
- **Placeholder / ghost:** sortable engine pattern — **fixed ghost** + **`.ll-dnd__source--dragging`** on the card row during drag (see API table under **Sortable list**); no separate placeholder clone in-list for reorder.
- **Commit:** `moveItemToIndexByKey` then full `rebuild()` on **`onReorder`**.

Reference:

```5286:5432:js/llumen-components.js
        function renderDragDropCardList({
            // ...
        }) {
            // ... rebuild paints cards, then:
            initVerticalSortableList({
                container: cardsList,
                itemSelector: '[data-card-item-id]',
                handleSelector: '.ll-dragdrop-card-list__drag-handle',
                getItemId: (el) => el.dataset.cardItemId || '',
                minItemsForDrag: 2,
                onReorder: (movedId, targetIndex) => {
                    moveItemToIndexByKey(stateOwner, itemsKey, movedId, targetIndex);
                    rebuild();
                }
            });
        }
```

**CSS:** list chrome under “Drag & Drop: Card List” (`.ll-dragdrop-card-list*`); shared **`.ll-dnd__*`** tokens apply to ghost / dragging source via the engine.

### 2. Workflow HTML — canvas, insertion drag, multi-select, overlap resolution

`workflow/979669f6a773bc14ee5e3b19.html` contains:

- **Free canvas** node positioning (`workflow-canvas-*`, pan/zoom state, absolute nodes).
- **Insertion** from the node catalog (click or drag into canvas) — the pattern to generalize with `kind: 'insert'` payloads.
- **Multi-select drag** on the canvas (multiple selected nodes moving together) — **`initLlumenSurfacePlacedItemDrag`** surfaces **`ids`** / **`id`** on commit and cancel (via **`getItemId`** or **`data-ll-surface-item-id`**); workflow extraction can align when in scope.
- **Overlap avoidance:** queue-based **`resolveNodeOverlaps(anchorNodeIds, margin)`** delegates to **`LlumenComponents.resolveLlumenSurfaceRectOverlaps(state.nodes, …)`** with **`getVisualMetrics: getNodeVisualMetrics`**; **`getNodeVisualBounds`** uses **`LlumenComponents.llumenSurfaceRectVisualBounds`** when present (fallback keeps inline math if the bundle is missing).

Reference:

Shared exports (see **`js/llumen-components.js`**): **`resolveLlumenSurfaceRectOverlaps`**, **`llumenSurfaceRectVisualBounds`**, **`llumenSurfaceBoundsOverlap`**, **`llumenSurfaceMoveLayoutAwayFromBase`**, **`LLUMEN_SURFACE_OVERLAP_DEFAULT_METRICS`**, **`initLlumenSurfaceFreeformResize`**. Workflow keeps **`getNodeVisualMetrics`** (output-label width) and thin **`getNodeVisualBounds` / `resolveNodeOverlaps`** wrappers.

The same file also **duplicates** card-list-style drag code for node config (e.g. `renderReusableDragDropCardList` usage and local `ensureDragPlaceholder` / `dragGhostElement` patterns). **Deferred:** removal of that duplication is **out of current scope** (see **Current scope boundary**); track as Phase A **#10** when **`workflow/*.html`** work is explicitly in scope.

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

The dashboard uses **two different interaction technologies** today (HTML5 drag for grid + pointer sort in card list). The reusable plan should **prefer pointer-based drag** (Pointer Events) for consistency with the card list, unless a context *requires* native DnD (e.g. cross-window); grid hit-testing can still be pointer-driven.

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

- `createPointerDragSession(options)` (**exported** on **`LlumenComponents`** as an **alias** of **`runLlumenPointerDragSession`**)  
  - **`pointerdown`** on handle (or delegated source); **`setPointerCapture`** as appropriate.  
  - `getDragSourceElement()` / `rootElement`  
  - `resolveHandle(eventTarget)` → element that starts drag (header, icon button, or root)  
  - `onMove(session, pointer)`  
  - `onEnd(session, pointer)` / `onCancel(session)` — **`onCancel`** runs for Escape, failed validation, invalid release, and pointer/capture loss; **never** calls `commit`.  
  - **`cancelOnEscape: true`** (default) — global Escape during active session → same as cancel; snap back, no model change.  
  - **Touch:** apply **`touch-action: none`** to the capture target (handle or drag root) for the session lifetime (shared class); see Session invariant **7**.  
  - **`autoScroll: { scrollRoots: Element | Element[], edgePx, maxSpeed }`** — scroll scrollable ancestors when the pointer sits within **`edgePx`** of the visible edge; **Phase A**.  
  - `buildGhost(sourceElement)` → optional override for **future** lightweight ghosts; **v1 default:** **`cloneNode(true)`** + sanitization (strip `id`, fix duplicate `aria-*`, etc.) — Session invariant **10**.  
  - `buildPlaceholder(sourceElement)` → same contract; **v1 default** full clone + sanitization when placeholder mirrors the item.  
  - `ghostMount: 'body' | (el => void)` — default **`body`** with **`--ll-z-dnd-ghost`** above modals; override only for rare stacking-context needs (see **Z-index and modals** under CSS plan).  
  - **CSS classes** on ghost/placeholder (visuals); JS keeps only **dynamic** geometry (width/height/position) where necessary.
  - **Mutex:** if a **resize** session is active (see `initResizableElement`), do not start a drag — **no-op** until resize ends (Session invariant **8**).  
  - **Focus:** after commit/cancel, restore focus to the starting handle when possible; optional **`onSessionEnd({ reason, handleElement })`** for overrides (Session invariant **9**).

### Sortable list (1D)

- `initSortableList({ container, axis: 'vertical' | 'horizontal', itemSelector, handleSelector | null, accepts, buildDragPayload, onReorder, ... })`  
  - `accepts(dragPayload, listContext, pointer?)` → boolean (nested trees / cross-list). Optional **`pointer: { clientX, clientY }`** during target picking.  
  - `onReorder({ id, fromContainer, toContainer, fromIndex, toIndex, payload })` — fires on **commit** (pointer-up); caller may mirror state with **`rebuild()`** or patch DOM only.  
  - **Engine options (Sortable-aligned):** `animation` / `animationEasing` (sibling FLIP; `0` disables), `swapThreshold`, `invertSwap`, `invertedSwapThreshold`, `sort: false` to disable in-list reordering, `minItemsForDrag`, `onMoveRow(container, dragEl, dragRect, target, targetRect, evt, after)` (return `false` to veto a swap), `onSessionEnd`, `autoScroll`.  
- `initVerticalSortableList(...)` — convenience wrapper for `axis: 'vertical'` and same-container-only `(id, toIndex)` callbacks.

**Engine behavior (`llumen-sortable-engine.js`) — summary for integrators:**

| Topic | Behavior |
| --- | --- |
| **Ghost + hit-test** | Floating **`cloneNode`** ghost under `body` (`.ll-dnd__ghost`); ghost is **hidden** while calling `document.elementFromPoint` during drag-over so the cursor sees “through” the ghost (Sortable `_hideGhostForTarget` idea). |
| **Source row** | Dragged item stays in layout with **`.ll-dnd__source--dragging`** + **`.ll-dnd__wash-surface`** (blue wash via **`::after`** on the wash host), not a separate placeholder node. |
| **Swap animation** | After each in-list insert, siblings animate with **FLIP** `translate3d` (`animation` ms); **`llSwapAnimating`** / **`ignoreWhileAnimating`** guard the swap partner during the transition (Sortable `Animation.js` + `_ignoreWhileAnimating`). |
| **Cross-list insert** | First entry into a foreign list uses **midpoint bands** between consecutive items on the sort axis (not “pointer inside which row bbox”), so tight / spaced stacks stay stable. |
| **Cross-list + same frame** | After reparenting, a short **pointer-move gate** avoids running in-list `dragOver` until the cursor moves a few pixels — prevents an immediate second swap from stale geometry. |
| **Cross-list visual** | **`runDragElCrossListFlipAnimation`**: the in-document row **FLIPs** from its old screen rect to the new slot (Sortable includes `dragEl` in `fromSortable.animateAll()`). |
| **`lastTarget` policy** | **Llumen deviation:** after each **committed in-list** swap, **`lastTarget` / `lastDirection` are cleared** so the next pass uses the permissive **middle-band** direction logic. Stock Sortable keeps the same sibling paired across swaps, which can make **forward → back → forward** oscillations in one drag require extra pointer travel; clearing restores symmetric sensitivity. |

**Load order:** include **`js/llumen-sortable-engine.js`** before **`js/llumen-components.js`** so `LlumenSortableEngine` is available to `initSortableList`.

### Resizable

- `initResizableElement({ element, minWidth, maxWidth, minHeight, maxHeight, snapX, snapY, onResize })`  
  - **Handle:** always SE; single shared class `.ll-resize-handle--se` in CSS.  
  - **Snap:** `null` (free) or number (px) or `(size) => snappedSize` for grid-unit contexts.  
  - **Smooth sizing (Phase C):** snapped or min/max-limited size changes should **animate** (CSS transition/keyframes on the resizing axis), not jump instantly—see Phase C, item **2**.  
  - **Mutex:** if a **drag** session is active, **`pointerdown`** on the resize handle is a **no-op** until the drag ends (Session invariant **8**). Symmetrically, while resizing, drag starts are ignored.

### Droppable contexts (adapters)

- **Grid (shipped):** **`initGridDropContext(options)`** in **`js/llumen-components.js`** → **`{ destroy, wireTile }`**. Required: **`gridElement`**, **`tileSelector`**. Optional: **`resizeHandleSelector`** (default **`.ll-resize-handle--se`**), **`maxColSpan`**, **`maxRowSpan`**, **`resolveMetrics`**, **`onSpanPreview`**, **`onSpanCommit`**, **`pointerCaptureTarget`** for SE **span resize**; **`tileMoveHandleSelector`**, **`tileMoveDragIgnoreSelector`**, **`tileMoveMaxGridRow`**, **`tileMoveGhostStripSelector`**, **`tileMoveScrollRoot`**, **`tileMovePreviewMountRoot`**, **`tileMovePointerCaptureTarget`**, **`tileMoveBuildGhost`**, **`tileMoveOnCommit`** for **pointer tile move** (ghost + placeholder, occupancy-aware placement). **Resize:** span is capped by the tile’s resolved **start column/row** so it cannot extend past the grid; growth is clamped against **other tiles’** occupied cells (same occupancy set as move). With resolved anchors, **`.ll-resize-rubber-band`** previews the target footprint until **pointer-up** (then the tile span applies once). **Reference:** Component Library → Drag & Drop → Grid (`initGridDropContext` + **`js/component-library-drag-drop-demos.js`**; slot outlines: **`.ll-grid-edit-guides`**).  
- **2D surface (artboard / “canvas”):** **`initCanvasDropContext({ … })`** (**`beginInsertPointerDrag`** for palette-style insert; uses **`runLlumenPointerDragSession`**) + **`LlumenComponents.resolveLlumenSurfaceRectOverlaps(items, anchorIds, { getVisualMetrics, margin, … })`** for overlap propagation; **`initLlumenSurfaceFreeformResize`** for **unsnapped** SE resize with **`.ll-resize-rubber-band`**; support **multi-id** commits on the surface drag path.  
- **Row:** `initRowBandContext({ ... })` — phantom row DOM, unit sum validation, horizontal sort within row.  
- **Row width (units, shipped):** **`initLlumenFlexBandUnitResize(options)`** in **`js/llumen-components.js`** — SE handle, integer **units** against a shared **`maxUnits`** budget (siblings via **`unitSelector`**, e.g. **`.ll-flex-band-unit`**). Default sizing uses **`setLlumenBandWidthClass`** → **`ll-band-c{maxUnits}-u{units}`** on **`ll-row-element-container`** (padded shell; flex row **without** **`gap`**). CSS ships context **2–8**; responsive layouts can swap tokens at breakpoints. Same **`.ll-resize-rubber-band`** preview + **pointer-up commit**; **`rowContainer`** is **`position: relative`**. **Reference:** Component Library → Drag & Drop → Row (`initRowContextDemo`).

Each adapter **does not** know business nouns (“Chapter”, “Slide”); it only sees payload types and dimensions.

---

## CSS plan (`css/styles.tailwind.css`)

Add a dedicated section (per `styles-tailwind-organization.mdc`), for example **“Interaction: Drag, drop, resize”**, placed near related layout/tooling sections.

### Z-index tokens

Define CSS variables so ghosts, placeholders, and context highlights do not fight modals/tooltips unpredictably, for example:

- `--ll-z-dnd-context` — optional drop-target chrome (rings, cell preview); **above** normal page content, **below** modals if modals must stay visually “on top” of highlights when not dragging.  
- `--ll-z-dnd-placeholder` — placeholder slot; **above** scroll/surface clipping where possible, **below** the ghost.  
- `--ll-z-dnd-ghost` — floating ghost; **above the highest modal / dialog / seamless overlay layer** in the product.

**Modals and seamless overlays:** many drags happen **inside** modals (and from seamless panels). If `--ll-z-dnd-ghost` is lower than the modal layer, the ghost can slip **under** the backdrop or the modal shell and look broken. **Recommendation (default):** treat **`--ll-z-dnd-ghost`** (and usually **`--ll-z-dnd-placeholder`**) as part of an **“interaction overlay” band** that sits **above** modal/dialog tokens (e.g. `--ll-z-modal`, `--ll-z-modal-backdrop` — names align with whatever the design system already defines). **Order (low → high):** page content → **drop-target chrome** → modal backdrop → modal surface → **placeholder** → **ghost** (top). The ghost keeps **`pointer-events: none`** so it does not block clicks to real UI underneath except as a visual; hit-testing still uses pointer coordinates against real DOM.

**Trade-off:** while dragging, the ghost may **paint over** modal headers or chrome. That is acceptable because the gesture is short-lived; **Escape** cancels and restores focus (invariant **9**). If a future surface needs the ghost **clipped to the modal** (same stacking context only), the API already allows a custom **`ghostMount`** / mount root; that is an **escape hatch**, not the default.

Concrete numeric values: pick numbers so **`--ll-z-dnd-ghost` > max(modal z-indices)** in `styles.tailwind.css`; do not reuse the legacy **`120`** from the card list if it falls under modals in real layouts.

### Class roles

| Class role | Purpose |
| --- | --- |
| `.ll-dnd__ghost` | Fixed layer, elevated shadow, reduced opacity, `pointer-events: none`, `z-index: var(--ll-z-dnd-ghost)` |
| `.ll-dnd__ghost--dragging` | Optional modifier while active |
| `.ll-dnd__placeholder` | Outline / dashed border / tokenized tint via `--ll-color-*`, `z-index: var(--ll-z-dnd-placeholder)` |
| `.ll-dnd__wash-surface` | Host for the slot/source blue wash: **`position: relative`**, **`isolation: isolate`**, tint on **`::after`** — **`rgb(...)`** fallback and **`@supports`**-scoped **`color-mix(..., var(--ll-color-primary-hover) 40%, transparent)`** (no extra overlay `div`) |
| `.ll-grid-edit-guides` | Host for edit-mode slot outlines: **`position: absolute; inset: 0`**, **`pointer-events: none`** — children **`.ll-grid-edit-guides__cell`** are positioned by JS to match grid columns, **`gap`**, and row track size |
| `.ll-resize-rubber-band` | Discrete resize footprint preview (grid **span**, flex-band **width units**, …): dashed border, translucent fill, **`transition`** on box geometry; real layout commits on **pointer-up** |
| `.ll-flex-band-unit--resizing` | Flex-row unit while a rubber-band width resize is active (`transition: none`, subtle ring) |
| `.ll-dnd__source--dragging` | Opacity / transition for hidden-or-dimmed source |
| `.ll-dnd__capture-target--active` | Applied only for the active drag session on the **handle** or **drag root**: `touch-action: none` so touch pointers are not interpreted as **vertical scroll**; removed on teardown |
| `.ll-sortable__item--shift` | Transition for translate animation (or reuse a single utility transition) |
| `.ll-resize-handle--se` | SE handle geometry, hover, `cursor: nwse-resize` (migrate from dashboard inline styles) |
| Context hooks | `.ll-drop-context--hover`, `.ll-grid-cell--preview`, etc., as needed **without** page-specific prefixes |

**Migration step:** move inline styles from `renderDragDropCardList` (ghost box shadow, wash) into these classes; keep only **dynamic** values in JS (width/height matching source rect, positions).

---

## Performance: full `rebuild()` vs DOM-only reorder

The card list today calls **`rebuild()`** (full re-render) after reorder, which is acceptable for **small** config lists. For **large** trees or high-frequency updates, adapters should support a **`domOnly: true`** (or separate `commitReorderDom`) path: reorder nodes or patch minimal subtrees, then call a cheap **`onReorder(ids, newOrder)`** without blowing away inner editor state.

Document this in the **sortable** API as an optional mode so product surfaces can opt in without a second refactor.

**Ghost cost:** v1 uses a **full DOM clone** for ghost (and placeholder when cloned) per invariant **10**. If a surface proves too heavy, the first optimization is optional **`buildGhost`** / **`buildPlaceholder`** overrides — not a change to the default contract.

---

## Manual test matrix (baseline: pointer sortable + card list path)

Run through this matrix when touching drag core or adapters (expand per new context).

| Scenario | Chrome | Safari | Firefox |
| --- | --- | --- | --- |
| Vertical sortable: reorder, cancel (release outside), `pointercancel` | ☐ | ☐ | ☐ |
| Sortable: **same-drag oscillation** (e.g. swap down → swap back → swap down again) stays sensitive without extra half-row travel | ☐ | ☐ | ☐ |
| Cross-list: pointer crosses **gaps** between lists — item does not snap to source until pointer enters another accepting list or cancel | ☐ | ☐ | ☐ |
| Cross-list: **placeholder row** animates from old list slot to new (if `animation` > 0) | ☐ | ☐ | ☐ |
| **Escape** during drag: cancel, snap back, **no** model change | ☐ | ☐ | ☐ |
| Failed **`validateDrop`** on release: snap back, **no** model change | ☐ | ☐ | ☐ |
| Touch / pen: same flow, no stuck ghost; **list scroll does not steal** the drag (touch-action / capture) | ☐ | ☐ | ☐ |
| Auto-scroll: list inside `overflow: auto` parent, drag near top/bottom edges | ☐ | ☐ | ☐ |
| Horizontal strip: reorder + edge scroll left/right | ☐ | ☐ | ☐ |
| Nested lists: child list only vs cross-parent | ☐ | ☐ | ☐ |
| RTL / mirrored layout (if product supports): placeholder index correct | ☐ | ☐ | ☐ |
| Canvas (Phase D+): pan/zoom while dragging; multi-select move | ☐ | ☐ | ☐ |
| **`resolveLlumenSurfaceRectOverlaps`** (workflow + surface harness): stacked items separate after drag; no runaway when anchors missing | ☐ | ☐ | ☐ |
| **`initLlumenSurfaceFreeformResize`**: SE resize rubber-band + commit; drag body does not start from handle | ☐ | ☐ | ☐ |
| Grid (Phase C+): resize + drag; resize **capped** from column/row anchor; resize **blocked** into occupied cells; **rubber-band** preview + commit-time span apply (charts/maps) | ☐ | ☐ | ☐ |
| Row flex band: **`initLlumenFlexBandUnitResize`** — rubber-band width (units) + commit; capacity vs other **`.ll-flex-band-unit`** siblings | ☐ | ☐ | ☐ |
| **Mutex:** resize handle `pointerdown` during active drag → **ignored**; drag handle during active resize → **ignored** | ☐ | ☐ | ☐ |
| After commit/cancel: **focus returns** to drag handle when still in DOM and focusable | ☐ | ☐ | ☐ |

---

## Execution plan (phased)

### Phase A — Pointer-drag core + card-list consumer (**split status**)

Phase A was written as “extract everything from the card list first.” In practice the **pointer-drag session** and **sortable** behavior were implemented as **`runLlumenPointerDragSession`** (inside `llumen-components.js`) + **`js/llumen-sortable-engine.js`**, and **`renderDragDropCardList`** now reorders via **`initVerticalSortableList`** (same stack as the Component Library sortable demos). The bullets below record **done vs remaining** for that split.

| # | Goal | Status |
| --- | --- | --- |
| 1 | **Identify / collapse** card-list drag into a single sortable + pointer path | **Done** — card list no longer owns a separate mousemove card-reorder loop; it delegates to **`initVerticalSortableList`**. |
| 2 | **Shared pointer API** for start / move / end / cancel, parameterized by container, selectors, callbacks | **Done** for sortable — **`LlumenSortableEngine`** consumes **`runPointerDragSession`** from the components bundle; **`LlumenComponents.createPointerDragSession`** is an **alias** of **`runLlumenPointerDragSession`** (returns **`false`** when a session cannot start because another pointer interaction is active). |
| 3 | **Pointer Events** + **`setPointerCapture`**, **`lostpointercapture`** / **`pointercancel`** | **Done** on the sortable / engine path (**`llumen-sortable-engine.js` before `llumen-components.js`**; controller receives **`runPointerDragSession`** from components at init). |
| 4 | **Touch `touch-action: none`** via **`.ll-dnd__capture-target--active`** during drag | **Done** on sortable sessions (Session invariant **7**). |
| 5 | **Escape** → cancel, snap back, no model commit | **Done** on sortable (`cancelOnEscape` in engine mount). |
| 6 | **Auto-scroll** near scrollable ancestor edges | **Done** on sortable (`autoScroll` option; card list inherits via `initVerticalSortableList`). |
| 7 | **`.ll-dnd__*`** + **`--ll-z-dnd-*`**; generic placeholder / ghost presentation | **Done** for the shared card list — drag handle **`ll-dragdrop-card-list__drag-handle`** (+ **`touch-action: none`** / grab cursor in **`styles.tailwind.css`**). **Workflow** may still use legacy handle class names until migrated. |
| 8 | **`renderDragDropCardList`** uses shared stack | **Done** — **`initVerticalSortableList`** + `moveItemToIndexByKey` + `rebuild()`. |
| 9 | **Focus** after commit/cancel (Invariant **9**) + optional **`onSessionEnd`** | **Done** — **`runLlumenPointerDragSession`** calls **`handleElement.focus({ preventScroll: true })`** on end unless **`onSessionEnd`** handles it; sortable mounts use that session. |
| 10 | **Dedup** workflow / other **duplicated** card-list-style ghost/placeholder blocks | **Deferred** — out of **current scope** (see **Current scope boundary**); revisit when editing **`workflow/*.html`** is in scope |

**Exit criteria (revised):** **Sortable + card list** path: Pointer-driven reorder, auto-scroll, Escape cancel, touch contention handled, **`.ll-dnd__*`** in use for ghost/source styling, **`renderDragDropCardList`** on **`initVerticalSortableList`** without a parallel legacy reorder implementation, generic **`.ll-dragdrop-card-list__drag-handle`** on the card template. **Deferred (not required for current track):** workflow (and any other) **duplicate** drag/placeholder blocks removed or delegated; **workflow** migration off **`node-config-card-drag`** when those files are in scope.

### Phase B — Generalize axis and hit-testing

1. **`axis: 'horizontal'`** (pointer X, horizontal strip reorder) — **Done** (engine + Component Library demo).  
2. **Nested lists** + **`accepts()`** cross-parent — **Done** (chapters vs sections; pointer-aware `accepts` for outer list).  
3. **Payload + nested docs** — **Done** (this doc + nested demo); “two simple lists” cross-drop is covered by nested sections and/or horizontal/simple demos as needed.

**Implemented (`initSortableList` + `llumen-sortable-engine.js`):**

- **`initSortableList({ container, axis: 'vertical' | 'horizontal', itemSelector, handleSelector, getItemId, ... })`** — shared registry picks the **deepest** sortable under the pointer whose **`accepts`** returns true; if none match, the engine may **stick to the list that currently contains the dragged node** when that list still accepts (gap / chrome between lists). Otherwise it falls back to the **source** list.  
- **Default payload** (when `buildDragPayload` omitted): `{ kind: 'reorder', id, sourceContainer, itemSelector }` where `itemSelector` is the **source list’s** selector string (useful in `accepts` to distinguish chapter rows vs section rows).  
- **`accepts(payload, context, pointer?)`** — `context` is `{ container, itemSelector, getItemId }`. Optional third argument **`pointer: { clientX, clientY }`** is passed during hit-testing so pages can reject targets (e.g. chapter reorder must not “win” while the cursor is over a nested section list — see Component Library nested demo).  
- **`onReorder({ id, fromContainer, toContainer, fromIndex, toIndex, payload })`** — `initVerticalSortableList` remains a thin wrapper that only forwards same-container moves to `(id, toIndex)` for backward compatibility.  
- **Demos:** `js/component-library-drag-drop-demos.js` wires Simple list, **Nested** (chapters + cross-chapter sections), and Horizontal strip — all page-local; no `component-library-*` hooks in the engine.

**Exit criteria:** Demo in `component-library.html` (page wiring only) showing nested vertical lists with cross-parent drop and the behaviors in the engine summary table — without polluting shared library with page-prefixed class hooks beyond initialization config.

### Phase C — Resizable primitive + grid adapter (dashboard extraction)

| # | Goal | Status |
| --- | --- | --- |
| 1 | **`initResizableElement`** (SE handle, snap, min/max) + **drag vs resize mutex** with grid move/resize | **Done** |
| 2 | **Discrete resize rubber-band:** **`initGridTileSpanResize`** + **`initLlumenFlexBandUnitResize`** share **`.ll-resize-rubber-band`**; commit on **pointer-up**; **`prefers-reduced-motion`** on preview | **Done** |
| 3 | **Grid adapter:** **`initGridDropContext`**, **`readLlumenGridSurfaceLayout`**, occupancy-aware resize + optional tile move | **Done** (Component Library harness); dashboard migration **optional** |
| 4 | **Grid tile pointer move** + ghost/placeholder/wash — **`initGridTilePointerMove`**, wired via **`initGridDropContext`** | **Done** (see Component Library grid demo) |
| 5 | **Edit-mode slot guides:** **`.ll-grid-edit-guides`** / **`__cell`** + demo **`syncClDndGridEditGuides`** | **Done** |
| 6 | Dashboard / product pages switch to shared grid drag tech | **Not required** for plan exit; do when migrating surfaces |
| 7 | **Snapshot round-trip:** **`readLlumenGridTilesModelFromHost`** / **`writeLlumenGridTilesModelToHost`** / **`initGridTileModelContext`** (**`applyGridTilesModel`** + **`renderGridTile`**) — teardown → replace tiles → **`initGridDropContext`** remounts move/resize | **Done** (shared + Component Library harness) |

**Narrative (unchanged behavior reference):** Grid move is **not** routed through **`llumen-sortable-engine.js`**. It reuses **`runLlumenPointerDragSession`**, **`.ll-dnd__ghost`**, **`.ll-grid-tile--move-source`**, mirror placeholder (**`cloneNode` + `.ll-dnd__placeholder--mirror` + `.ll-dnd__wash-surface`**), last-cell stickiness, **`document.body`** fixed ghost, **`previewMountRoot`** for placeholder, commit on valid cell at pointer-up — **`initGridTilePointerMove`** + **`initGridDropContext`**.

**Exit criteria:** Shared APIs exist and the component library exercises grid + resize + move + guides; **resize demos** use transitions for snapped/discrete targets; grid **model↔DOM** round-trip (**`readLlumenGridTilesModelFromHost`**, **`initGridTileModelContext`**) in harness. Dashboard import remains a **follow-on migration**, not a blocker for closing Phase C in the shared library sense.

### Phase D — 2D surface adapter + overlap (workflow extraction)

| # | Goal | Status |
| --- | --- | --- |
| 1 | Pure overlap helpers + **`resolveLlumenSurfaceRectOverlaps`** in **`js/llumen-components.js`** (generic **items**, not node-specific) | **Done** |
| 2 | Workflow **`resolveNodeOverlaps`** / **`getNodeVisualBounds`** delegate to **`LlumenComponents`** | **Done** |
| 2b | **`initLlumenSurfaceFreeformResize`**: unsnapped SE px resize, **`.ll-resize-rubber-band`**, commit on pointer-up | **Done** (Component Library surface demo) |
| 3 | Surface drag uses shared **pointer** session where applicable (workflow-style **direct** item move on canvas; grid/list may still use **ghost**); **multi-select** + **`ids[]`** | **Done:** **`getDragPeers`** + **`getItemId`**; **`onDragCommit` / `onDragCancel`** include deduped **`ids`** (peer order) and primary **`id`**. Component Library canvas passes **`getItemId`** from **`dataset.clDndCanvasNodeId`** and uses **`ids`** for multi-anchor overlap |
| 4 | **Snapshot round-trip:** **`readLlumenSurfacePlacedItemsModelFromHost`** / **`writeLlumenSurfacePlacedItemsModelToHost`** / **`applyLlumenSurfacePlacedItemsModel`** — page **`renderPlacedItem`** + **`afterApply`** re-wires **`initLlumenSurfacePlacedItemDrag`** / **`initLlumenSurfaceFreeformResize`** | **Done** (shared + Component Library harness) |

**Exit criteria (revised):** Overlap math and freeform rubber-band resize live in shared module; workflow behavior unchanged when **`llumen-components.js`** is loaded; catalog **insert** drag unchanged. Component Library surface move uses **pointer session + direct item geometry** (aligned with workflow canvas UX), not a floating ghost; canvas **model↔DOM** round-trip helpers exported and exercised in harness.

### Phase E — Row-band context (phantom rows + units)

**Already in shared code (partial):** **`initLlumenFlexBandUnitResize`** — SE resize for **one** flex-row unit against a **`maxUnits`** budget (siblings via **`unitSelector`**, e.g. **`.ll-flex-band-unit`**), same **`.ll-resize-rubber-band`** + pointer-up commit as grid span resize. Does **not** implement multi-row layout, phantoms, or insertion from an external catalog.

| # | Goal | Status |
| --- | --- | --- |
| 1 | Data model: rows array, each with `components` and `maxUnits` | **Done (shared + harness):** **`readLlumenRowBandModelFromHost`** (DOM→snapshot); **`writeLlumenRowBandModelToHost`** + **`initRowBandContext`** **`applyRowBandModel`** with page-supplied **`renderFilledRow`** (snapshot→DOM + sortable remount). Component Library: **Load sample rows** / **Re-apply from snapshot** |
| 2 | DOM: gap row slots; placeholder when **`accepts`** and **`sum(units) + draggedUnits <= max`** (dwell on gap via **`acceptPointerHoverMs`**) | **Done** in **`initLlumenRowBandSortables`** + **`syncLlumenRowBandGapRows`** + Component Library row demo |
| 3 | Regenerate phantoms after each successful drop | **Done** via **`syncGapRows`** after horizontal / vertical reorder and catalog insert |
| — | Horizontal **reorder within row** via **`initSortableList`** (`axis: 'horizontal'`) | **Done** inside **`initLlumenRowBandSortables`** |

**Exit criteria (revised):** **`initLlumenRowBandSortables`**, **`initRowBandContext`**, **`readLlumenRowBandModelFromHost`**, **`writeLlumenRowBandModelToHost`**, and **`normalizeLlumenRowBandRowShellsForCapacity`** exported; Component Library row demo uses **`initRowBandContext`** with **`applyRowBandModel`**. Optional: product adoption beyond the harness. **`initLlumenFlexBandUnitResize`** stays the low-level **per-unit resize** hook (**`onWireBandUnit`**).

---

## Risks and decisions

| Topic | Decision |
| --- | --- |
| Input | **Pointer Events** everywhere for drag core (mouse + pen + touch); **`setPointerCapture`** + cancel paths documented in invariants. |
| Touch vs scroll | **`touch-action: none`** on the active handle or drag root during the session (class **`.ll-dnd__capture-target--active`**); removed on teardown so normal scroll is unchanged. |
| Drag vs resize | **Mutex, ignore second:** only one of drag-move or SE-resize active globally (default); second gesture is **no-op** until the first finishes — **no** auto-cancel of the first session. |
| Resize motion | **Smooth by default (Phase C):** snapped or clamped size changes **transition** (CSS or equivalent); avoid **instant** jumps between sizes unless **`prefers-reduced-motion`** (or an explicit opt-out) dictates otherwise. |
| Focus after drag | **Default:** `focus({ preventScroll: true })` on the **drag handle** after commit/cancel if still connected and focusable; otherwise skip. Optional **`onSessionEnd`** for pages (e.g. post-`rebuild()` focus). |
| Ghost / placeholder clone | **v1:** always **`cloneNode(true)`** + sanitization; shallow/simplified ghosts **deferred**; optional **`buildGhost` / `buildPlaceholder`** reserved for a later perf pass. |
| Pointer vs HTML5 DnD | Default **Pointer Events** for in-app precision (card list parity). Use native DnD only where required (e.g. cross-window). |
| Auto-scroll | **Required** in spec; **Phase A** for scrollable ancestors during drag. |
| Cross-context | **Insertion** drag (palette/modal → canvas/grid) remains the primary cross-surface story; payload supports **`kind: 'reorder' | 'insert'`** and optional **`ids[]`** for multi-select. **Cross-list reorder** between registered **`initSortableList`** surfaces with shared **`accepts`** is **implemented** in the engine; arbitrary grid/canvas “cross-context” without sortable registration stays **later**. |
| Sortable `lastTarget` | **Llumen:** cleared after each in-list commit for predictable oscillation (see API section). **Stock SortableJS:** keeps `lastTarget` across swaps for threshold pairing — not replicated 1:1. |
| `rebuild()` full re-render | Acceptable for small config cards; document **DOM-only / minimal patch** option for large lists (see Performance section). |
| Accessibility | **Explicitly out of scope** until pointer + auto-scroll + commit semantics are stable; then keyboard + live region work as a dedicated phase. |
| Commit / cancel | **Single transactional commit** for the **caller model** at end of gesture (`onReorder` / `validateDrop` patterns); **no partial model writes** mid-move. Sortable **DOM** may reorder live during drag; **cancel** restores the dragged node to its start parent/position. Failed validation, invalid release, Escape, and pointer cancel **snap back** with **no** durable model change. |
| Z-index / modals | **CSS variables** `--ll-z-dnd-*`; **ghost (and usually placeholder) above modal/dialog layer** so in-modal drags never disappear under backdrop; optional **`ghostMount`** for rare clipping/stacking cases (see CSS plan). |
| Pointer lock | **Out of scope:** do not use **`requestPointerLock`** for the shared drag/sort/resize layer (see **Out of scope / optional polish**). |
| Coalesced pointer moves | **Optional polish:** **`getCoalescedEvents()`** on `PointerEvent` if profiling shows benefit (same section). |

---

## Out of scope / optional polish

Items here are **not** part of Phase A–E unless explicitly pulled in later.

### `requestPointerLock` — **out of scope**

**What it is:** the Pointer Lock API hides the system cursor and delivers **unbounded** relative movement (common in games and some 3D/drawing tools).

**Why we exclude it from the shared DnD layer:**

- **Escape collision:** pointer lock is often exited with **Escape**, which already means **cancel drag** in this plan; combining the two creates ambiguous UX and extra state machines.
- **Wrong affordance:** list reorder, modal inserts, and grid moves expect a **visible cursor** and direct manipulation, not a captured “mouse look” mode.
- **Trust and a11y:** lock feels trapping; the roadmap already defers deep keyboard/a11y work for drag — pointer lock adds another class of platform quirks.

**If a specialized surface** (e.g. a game-like viewport) ever needs pointer lock, it should be a **separate, explicit** integration — not the default **`createPointerDragSession`** path.

### Coalesced pointer events — **optional polish**

**What it is:** on some browsers, rapid `pointermove` updates may be **merged** between frames. **`PointerEvent.prototype.getCoalescedEvents?.()`** returns the intermediate positions that were folded into the delivered event.

**When it helps:** slightly smoother **ghost** tracking and more responsive **edge auto-scroll** on high refresh-rate devices when the main event alone looks “jumpy” or late.

**How to treat it:** **feature-detect**; in `pointermove`, if `getCoalescedEvents` exists, iterate those events in order and apply ghost position (and auto-scroll sampling) for each; otherwise use the single event. **Not required for Phase A** — add only if measurement shows a real issue.

---

## File touch map (expected)

| File | Changes |
| --- | --- |
| `js/llumen-components.js` | … **`readLlumenGridSurfaceLayout`**, **`readLlumenGridTilesModelFromHost`**, **`writeLlumenGridTilesModelToHost`**, **`initGridTileModelContext`**, **`initGridDropContext`**, … **`readLlumenSurfacePlacedItemsModelFromHost`**, **`writeLlumenSurfacePlacedItemsModelToHost`**, **`applyLlumenSurfacePlacedItemsModel`**, **`resolveLlumenSurfaceRectOverlaps`**, **`initLlumenSurfaceFreeformResize`**, **`initLlumenSurfacePlacedItemDrag`**, **`initCanvasDropContext`**, **`createPointerDragSession`** (alias of **`runLlumenPointerDragSession`**), … **`syncLlumenRowBandGapRows`** (alias **`syncLlumenRowBandPhantomRows`**), **`initLlumenRowBandSortables`**, **`initRowBandContext`**, **`readLlumenRowBandModelFromHost`**, **`writeLlumenRowBandModelToHost`**, **`normalizeLlumenRowBandRowShellsForCapacity`**, **`llumenSurfaceRectVisualBounds`**, …. **`renderDragDropCardList`** is a thin sortable consumer. |
| `js/llumen-sortable-engine.js` | **Sortable engine:** registry, drag-over, FLIP **`animation`**, ghost hide during hit-test, cross-list insert + target resolution + post-reparent gate, cross-list row FLIP; **`LlumenSortableEngine.createSortableListController`** — load **before** `llumen-components.js`. |
| `js/component-library-drag-drop-demos.js` | Page-only wiring for Drag & Drop tab demos (simple / nested / horizontal sortable, grid/canvas where present). |
| `css/styles.tailwind.css` | New “Interaction: Drag, drop, resize” section; ghost, placeholder, handle, modifiers, **`--ll-z-dnd-*`**, using `--ll-color-*`. |
| `dashboard/68ee2d555a24aca8065fbfa1.html` | **Deferred (out of current scope):** delegate to shared grid + resize when dashboard migration is scheduled. |
| `workflow/979669f6a773bc14ee5e3b19.html` | **Deferred (out of current scope):** overlap + dedup card-list drag/placeholder when workflow edits are in scope. |
| `component-library.html` | Demos and wiring only (`init*` calls with selectors). |

---

## Summary

The **Drag & Drop Card List** already encodes the gold-standard **ghost + placeholder + animated siblings** pattern; **Phase A** lifts that into reusable primitives using **Pointer Events** (mouse, pen, touch), **`touch-action: none`** on the capture target during drag so touch does not devolve into **scroll**, **`setPointerCapture`**-safe teardown, **auto-scroll near edges**, **Escape-to-cancel** in the shared core, **default focus return to the drag handle** after end/cancel when possible, and **CSS + z-index tokens** for presentation. **`js/llumen-sortable-engine.js`** implements **SortableJS-like** in-document reorder (thresholds, invert, FLIP **`animation`**, ghost-hide during hit-test, cross-list midpoint insert + stickiness + short post-reparent gate, cross-list row FLIP), bridged by **`initSortableList`** / **`initVerticalSortableList`**, with a documented **`lastTarget` clear** after each swap for oscillation UX. **Payload** distinguishes **reorder** vs **insertion** and supports **multi-id** canvas drags. **Adapter contract** (`hitTest` / `previewLayout` / `validateDrop` / `commit` / `cancel`) keeps **grid**, **canvas + overlap resolution**, and **row-band** behaviors aligned. **Cancel is strict:** failed validation, invalid drop, Escape, and pointer loss **always snap back** with **no model change** at the **caller model** layer; sortable DOM is restored on cancel. **Drag vs resize** use an **ignore-second** mutex (first gesture wins). **Ghosts** use **full subtree clones** in v1 (invariant **10**). **Z-index:** ghost sits **above modals** so in-modal drag stays visible. **Keyboard and screen-reader** drag affordances stay **out of scope** until the pointer layer is stable. **`rebuild()`** vs **DOM-only** reorder is documented for performance. **Workflow** duplication of card-list drag logic is explicitly targeted for removal once the shared helper is available.
