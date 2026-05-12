/**
 * Llumen sortable engine — SortableJS-style drag-over indexing (swap thresholds,
 * invert rules, moving the real row in-document) with Pointer Events + fixed ghost.
 * Swap animation mirrors Sortable `Animation.js` + `_ignoreWhileAnimating`; hit-testing hides the
 * ghost during `elementFromPoint` like `_emulateDragOver` / `_hideGhostForTarget`. Cross-list moves
 * also FLIP the in-document row (`fromSortable.animateAll` includes `dragEl`, not only siblings).
 * MIT-style port of core ideas from SortableJS (Rubaxa / owenm); Llumen integration only.
 *
 * Loaded before llumen-components.js; exposes LlumenSortableEngine.createSortableListController.
 */
(function sortableEngineFactory(globalScope) {
    'use strict';

    if (!globalScope) return;

    function getRect(el) {
        return el.getBoundingClientRect();
    }

    function closestWithin(el, selector, root) {
        let cur = el;
        while (cur && cur !== root) {
            if (cur.matches && cur.matches(selector)) return cur;
            cur = cur.parentElement;
        }
        return null;
    }

    function depthOfDomNode(node) {
        let depth = 0;
        let n = node;
        while (n) {
            depth += 1;
            n = n.parentElement;
        }
        return depth;
    }

    function indexAmongChildren(parent, child) {
        if (!parent || !child) return -1;
        const ch = parent.children;
        for (let i = 0; i < ch.length; i += 1) {
            if (ch[i] === child) return i;
        }
        return -1;
    }

    /**
     * Sortable `_onDragOver`: first DOM neighbor of `dragEl` in the swap `direction` (skipping hidden /
     * ghost), used to no-op when `dragEl` is already beside `target` on that side — prevents oscillation
     * when row heights or flex stretch differ.
     */
    function walkSwapNeighborSibling(container, dragEl, direction, ghostEl, win) {
        let dragIndex = indexAmongChildren(container, dragEl);
        if (dragIndex < 0) return null;
        let sibling = null;
        do {
            dragIndex -= direction;
            sibling = container.children[dragIndex];
        } while (
            sibling
            && (
                (win && win.getComputedStyle(sibling).display === 'none')
                || (ghostEl && sibling === ghostEl)
            )
        );
        return sibling || null;
    }

    function indexInDraggables(container, itemSelector, el) {
        let i = 0;
        const ch = container.children;
        for (let j = 0; j < ch.length; j += 1) {
            const node = ch[j];
            if (!node.matches || !node.matches(itemSelector)) continue;
            if (node === el) return i;
            i += 1;
        }
        return -1;
    }

    function countDraggables(container, itemSelector) {
        let n = 0;
        const ch = container.children;
        for (let j = 0; j < ch.length; j += 1) {
            if (ch[j].matches && ch[j].matches(itemSelector)) n += 1;
        }
        return n;
    }

    function dragElInRowColumn(dragRect, targetRect, vertical) {
        if (vertical) {
            const dx = Math.abs((dragRect.left + dragRect.right) / 2 - (targetRect.left + targetRect.right) / 2);
            return dx > Math.min(dragRect.width, targetRect.width) * 0.5;
        }
        const dy = Math.abs((dragRect.top + dragRect.bottom) / 2 - (targetRect.top + targetRect.bottom) / 2);
        return dy > Math.min(dragRect.height, targetRect.height) * 0.5;
    }

    /**
     * Port of Sortable _getSwapDirection (param 7 = isCircumstantialInvert in Sortable call sites).
     */
    function getSwapDirection(
        evt,
        target,
        targetRect,
        vertical,
        swapThreshold,
        invertedSwapThreshold,
        circumstantialInvert,
        isLastTarget,
        session,
        dragEl,
        listEl,
        dragIdxDraggable,
        tgtIdxDraggable
    ) {
        const mouseOnAxis = vertical ? evt.clientY : evt.clientX;
        const targetLength = vertical ? targetRect.height : targetRect.width;
        const targetS1 = vertical ? targetRect.top : targetRect.left;
        const targetS2 = vertical ? targetRect.bottom : targetRect.right;
        let invert = false;

        if (!circumstantialInvert) {
            if (
                isLastTarget
                && session.targetMoveDistance < targetLength * swapThreshold
            ) {
                if (
                    !session.pastFirstInvertThresh
                    && (session.lastDirection === 1
                        ? mouseOnAxis > targetS1 + (targetLength * invertedSwapThreshold) / 2
                        : mouseOnAxis < targetS2 - (targetLength * invertedSwapThreshold) / 2)
                ) {
                    session.pastFirstInvertThresh = true;
                }
                if (!session.pastFirstInvertThresh) {
                    if (
                        session.lastDirection === 1
                            ? mouseOnAxis < targetS1 + session.targetMoveDistance
                            : mouseOnAxis > targetS2 - session.targetMoveDistance
                    ) {
                        return -session.lastDirection;
                    }
                } else {
                    invert = true;
                }
            } else if (
                mouseOnAxis > targetS1 + (targetLength * (1 - swapThreshold)) / 2
                && mouseOnAxis < targetS2 - (targetLength * (1 - swapThreshold)) / 2
            ) {
                /* Sortable `_getInsertDirection`: use **draggable-order** indices, not raw `children` indices
                 * (so gap rows / non-items between draggables do not flip the sign each swap). */
                if (dragIdxDraggable < 0 || tgtIdxDraggable < 0) return 0;
                return dragIdxDraggable < tgtIdxDraggable ? 1 : -1;
            }
        }

        invert = invert || circumstantialInvert;
        if (invert) {
            if (
                mouseOnAxis < targetS1 + (targetLength * invertedSwapThreshold) / 2
                || mouseOnAxis > targetS2 - (targetLength * invertedSwapThreshold) / 2
            ) {
                return (mouseOnAxis > targetS1 + targetLength / 2) ? 1 : -1;
            }
        }
        return 0;
    }

    function isScrolledPast(el, side) {
        if (!el) return null;
        const win = el.ownerDocument && el.ownerDocument.defaultView;
        if (!win) return null;
        const rect = el.getBoundingClientRect();
        if (side === 'top') {
            if (rect.top < 0) return win.document.scrollingElement || el.ownerDocument.documentElement;
        }
        return null;
    }

    function scrollByEl(el, dx, dy) {
        if (!el) return;
        if (el === el.ownerDocument.documentElement || el === el.ownerDocument.scrollingElement) {
            el.ownerDocument.defaultView.scrollBy(dx, dy);
        } else {
            el.scrollLeft += dx;
            el.scrollTop += dy;
        }
    }

    function prefersReducedMotion(win) {
        try {
            return !!(win && win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
        } catch (e) {
            return false;
        }
    }

    function captureSwapAnimationRects(container, itemSelector, dragEl) {
        if (!container || !itemSelector) return null;
        const map = new Map();
        Array.from(container.children).forEach((child) => {
            if (child === dragEl) return;
            if (!child.matches(itemSelector)) return;
            const cs = globalScope.getComputedStyle(child);
            if (cs.display === 'none') return;
            const r = child.getBoundingClientRect();
            map.set(child, { left: r.left, top: r.top });
        });
        return map;
    }

    function cancelLlumenSwapAnimation(el) {
        if (!el || typeof el.__llumenSwapAnimCancel !== 'function') return;
        el.__llumenSwapAnimCancel();
    }

    function cancelSwapAnimationsInContainer(parent, itemSelector) {
        if (!parent || !itemSelector) return;
        Array.from(parent.children).forEach((n) => {
            if (n.matches(itemSelector)) cancelLlumenSwapAnimation(n);
        });
    }

    /**
     * SortableJS `Animation.js` `animate`: translate3d(invert) → reflow → transition to identity.
     * Pairs with `_ignoreWhileAnimating === target` in Sortable `_onDragOver` so the swap partner is
     * ignored until `animateAll` completes (prevents pointer/hit-test thrash while transforms run).
     */
    function runSortableStyleSwapAnimation(win, container, itemSelector, dragEl, fromRects, durationMs, easing, onAllDone) {
        if (!fromRects || !fromRects.size || !win) {
            if (typeof onAllDone === 'function') onAllDone();
            return;
        }
        if (!durationMs || durationMs <= 0 || prefersReducedMotion(win)) {
            if (typeof onAllDone === 'function') onAllDone();
            return;
        }
        const ease = easing == null || easing === '' ? 'ease-in-out' : easing;
        let pending = 0;
        const doneOne = () => {
            pending -= 1;
            if (pending <= 0 && typeof onAllDone === 'function') {
                onAllDone();
            }
        };

        fromRects.forEach((from, el) => {
            if (!el || !el.isConnected || el.parentNode !== container || el === dragEl) return;
            if (!el.matches(itemSelector)) return;
            const cs = win.getComputedStyle(el);
            if (cs.display === 'none') return;
            const to = el.getBoundingClientRect();
            const dx = from.left - to.left;
            const dy = from.top - to.top;
            if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

            cancelLlumenSwapAnimation(el);
            pending += 1;
            el.llSwapAnimating = true;

            el.style.transition = 'none';
            el.style.transform = '';
            el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
            void el.offsetWidth;
            el.style.transition = `transform ${durationMs}ms ${ease}`;
            el.style.transform = 'translate3d(0, 0, 0)';

            let safetyId = 0;
            let cleaned = false;
            function cleanup() {
                if (cleaned) return;
                cleaned = true;
                if (safetyId) {
                    win.clearTimeout(safetyId);
                    safetyId = 0;
                }
                el.removeEventListener('transitionend', onEnd);
                el.style.transition = '';
                el.style.transform = '';
                el.llSwapAnimating = false;
                el.__llumenSwapAnimCancel = null;
                doneOne();
            }
            function onEnd(e) {
                if (e.propertyName !== 'transform') return;
                cleanup();
            }
            el.__llumenSwapAnimCancel = cleanup;
            el.addEventListener('transitionend', onEnd);
            safetyId = win.setTimeout(cleanup, durationMs + 50);
        });

        if (pending <= 0 && typeof onAllDone === 'function') {
            onAllDone();
        }
    }

    /**
     * Sortable cross-list behavior: `fromSortable.captureAnimationState()` includes `dragEl`, then
     * `fromSortable.animateAll()` FLIPs it from the old on-screen slot to the new (sibling map skips dragEl).
     */
    function runDragElCrossListFlipAnimation(win, dragEl, fromScreenRect, durationMs, easing, onDone) {
        if (!dragEl || !fromScreenRect || !win) {
            if (typeof onDone === 'function') onDone();
            return;
        }
        if (!durationMs || durationMs <= 0 || prefersReducedMotion(win)) {
            if (typeof onDone === 'function') onDone();
            return;
        }
        const toRect = dragEl.getBoundingClientRect();
        const dx = fromScreenRect.left - toRect.left;
        const dy = fromScreenRect.top - toRect.top;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
            if (typeof onDone === 'function') onDone();
            return;
        }
        const ease = easing == null || easing === '' ? 'ease-in-out' : easing;
        cancelLlumenSwapAnimation(dragEl);
        dragEl.llSwapAnimating = true;

        dragEl.style.transition = 'none';
        dragEl.style.transform = '';
        dragEl.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        void dragEl.offsetWidth;
        dragEl.style.transition = `transform ${durationMs}ms ${ease}`;
        dragEl.style.transform = 'translate3d(0, 0, 0)';

        let safetyId = 0;
        let cleaned = false;
        function cleanup() {
            if (cleaned) return;
            cleaned = true;
            if (safetyId) {
                win.clearTimeout(safetyId);
                safetyId = 0;
            }
            dragEl.removeEventListener('transitionend', onEnd);
            dragEl.style.transition = '';
            dragEl.style.transform = '';
            dragEl.llSwapAnimating = false;
            dragEl.__llumenSwapAnimCancel = null;
            if (typeof onDone === 'function') onDone();
        }
        function onEnd(e) {
            if (e.propertyName !== 'transform') return;
            cleanup();
        }
        dragEl.__llumenSwapAnimCancel = cleanup;
        dragEl.addEventListener('transitionend', onEnd);
        safetyId = win.setTimeout(cleanup, durationMs + 50);
    }

    /**
     * Sortable-style _onDragOver for one list (el = container).
     * Uses draggable-only DOM indices for adjacency (fixes first/last row + negative children[] index).
     * Returns true if dragEl was moved.
     * @param {Window} win — for `getComputedStyle` in sibling walk (Sortable parity).
     */
    function dragOverList(listEntry, dragEl, _ghostEl, evt, session, win) {
        const el = listEntry.container;
        const { itemSelector, axis } = listEntry;
        const vertical = axis !== 'horizontal';
        const swapThreshold = listEntry.swapThreshold;
        const invertedSwapThreshold = listEntry.invertedSwapThreshold == null
            ? listEntry.swapThreshold
            : listEntry.invertedSwapThreshold;
        const invertSwapOption = listEntry.invertSwap;

        let hit = evt.target;
        if (typeof document.elementFromPoint === 'function') {
            const h = document.elementFromPoint(evt.clientX, evt.clientY);
            if (h) hit = h;
        }
        const target = closestWithin(hit, itemSelector, el);
        if (!target || target === dragEl || dragEl.contains(target) || target === session.ignoreWhileAnimating) {
            return false;
        }
        if (target.llSwapAnimating) {
            return false;
        }
        if (dragEl.contains(hit)) return false;

        if (target.parentNode !== el) {
            return false;
        }

        const draggables = Array.from(el.children).filter((c) => c.matches(itemSelector));
        const dragIdx = draggables.indexOf(dragEl);
        const tgtIdx = draggables.indexOf(target);
        if (dragIdx < 0 || tgtIdx < 0) {
            return false;
        }

        const dragRect = getRect(dragEl);
        const targetRect = getRect(target);
        const differentLevel = dragEl.parentNode !== el;
        const differentRowCol = dragElInRowColumn(dragRect, targetRect, vertical);
        const side1 = vertical ? 'top' : 'left';
        const scrolledPastTop = isScrolledPast(target, 'top') || isScrolledPast(dragEl, 'top');
        const scrollBefore = scrolledPastTop ? scrolledPastTop.scrollTop : undefined;

        if (session.lastTarget !== target) {
            session.targetBeforeFirstSwap = targetRect[side1];
            session.pastFirstInvertThresh = false;
            session.isCircumstantialInvert = (!differentRowCol && invertSwapOption) || differentLevel;
        }

        const direction = getSwapDirection(
            evt,
            target,
            targetRect,
            vertical,
            differentRowCol ? 1 : swapThreshold,
            invertedSwapThreshold,
            session.isCircumstantialInvert,
            session.lastTarget === target,
            session,
            dragEl,
            el,
            dragIdx,
            tgtIdx
        );

        if (direction === 0) {
            return false;
        }

        /* Sortable: no insert if `dragEl` is already beside `target` on the swap side (stops oscillation). */
        const beside = walkSwapNeighborSibling(el, dragEl, direction, _ghostEl, win);
        if (beside === target) {
            return false;
        }

        const after = direction === 1;
        if (listEntry.onMoveRow(el, dragEl, dragRect, target, targetRect, evt, after) === false) {
            return false;
        }

        cancelSwapAnimationsInContainer(el, itemSelector);
        session.ignoreWhileAnimating = null;

        session.silent = true;
        globalScope.setTimeout(() => { session.silent = false; }, 30);

        const animMs = listEntry.animation;
        let snapRects = null;
        if (animMs > 0 && !prefersReducedMotion(globalScope)) {
            snapRects = captureSwapAnimationRects(el, itemSelector, dragEl);
        }

        const nextEl = target.nextElementSibling;
        if (after) {
            el.insertBefore(dragEl, nextEl);
        } else {
            el.insertBefore(dragEl, target);
        }
        if (scrolledPastTop && scrollBefore !== undefined) {
            scrollByEl(scrolledPastTop, 0, scrollBefore - scrolledPastTop.scrollTop);
        }
        /*
         * Sortable: keep `lastTarget` / `lastDirection` across swaps so `isLastTarget` + `targetMoveDistance`
         * can implement the “drag shadow / must leave placeholder zone before reversing” guard.
         */
        if (session.targetBeforeFirstSwap !== undefined && !session.isCircumstantialInvert) {
            const tr = getRect(target);
            session.targetMoveDistance = Math.abs(session.targetBeforeFirstSwap - tr[side1]);
        }
        session.lastTarget = target;
        session.lastDirection = direction;
        if (snapRects && snapRects.size && animMs > 0) {
            session.ignoreWhileAnimating = target;
            runSortableStyleSwapAnimation(
                globalScope,
                el,
                itemSelector,
                dragEl,
                snapRects,
                animMs,
                listEntry.animationEasing,
                () => {
                    session.ignoreWhileAnimating = null;
                }
            );
        }
        session.changed();
        return true;
    }

    function createSortableListController(deps) {
        const {
            windowScope,
            runPointerDragSession,
            sanitizeClone,
            canStartSortableDrag = null
        } = deps;

        const registry = [];

        /**
         * Picks which registered list "owns" the drag for cross-list reparenting.
         * When the pointer is not inside any list rect (gaps, parent chrome), falling back to
         * `sourceEntry` would yank `dragEl` back to the start list — prefer the list that already
         * contains `dragEl` if it still accepts the payload (Sortable-style stickiness).
         */
        function findTargetSortableListEntry(clientX, clientY, payload, sourceEntry, dragEl) {
            const pointer = { clientX, clientY };
            const candidates = registry.filter((entry) => {
                if (!entry || !entry.container || !entry.container.isConnected) return false;
                const r = entry.container.getBoundingClientRect();
                return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
            });
            candidates.sort((a, b) => depthOfDomNode(b.container) - depthOfDomNode(a.container));
            const makeCtx = (entry) => ({
                container: entry.container,
                itemSelector: entry.itemSelector,
                getItemId: entry.getItemId
            });
            for (let i = 0; i < candidates.length; i += 1) {
                const entry = candidates[i];
                if (entry.accepts(payload, makeCtx(entry), pointer)) return entry;
            }
            if (dragEl && dragEl.isConnected && dragEl.parentNode) {
                const hold = dragEl.parentNode;
                const holdEntry = registry.find((e) => e && e.container === hold);
                if (holdEntry) {
                    const ctx = makeCtx(holdEntry);
                    if (holdEntry.accepts(payload, ctx, pointer)) {
                        return holdEntry;
                    }
                }
            }
            return sourceEntry;
        }

        /**
         * First insert of dragEl into a foreign list (not append-only).
         * Uses midpoints **between** consecutive rows/columns (Sortable-style bands), not each row’s
         * own midpoint — row-mid logic put “upper half of first row” into slot 1 (second from top).
         * `dragEl` must not yet be a child of `entry.container`.
         */
        function insertDraggableAtPointerInContainer(entry, dragEl, clientX, clientY) {
            const container = entry.container;
            const itemSelector = entry.itemSelector;
            const vertical = entry.axis !== 'horizontal';
            const rows = Array.from(container.children).filter(
                (c) => c.matches(itemSelector) && c !== dragEl
            );
            if (!rows.length) {
                container.appendChild(dragEl);
                return;
            }
            if (vertical) {
                if (rows.length === 1) {
                    const r = rows[0].getBoundingClientRect();
                    const split = (r.top + r.bottom) / 2;
                    if (clientY < split) {
                        container.insertBefore(dragEl, rows[0]);
                    } else {
                        container.appendChild(dragEl);
                    }
                    return;
                }
                let insertIdx = rows.length;
                for (let i = 0; i < rows.length - 1; i += 1) {
                    const a = rows[i].getBoundingClientRect();
                    const b = rows[i + 1].getBoundingClientRect();
                    const split = (a.bottom + b.top) / 2;
                    if (clientY < split) {
                        insertIdx = i;
                        break;
                    }
                }
                if (insertIdx >= rows.length) {
                    container.appendChild(dragEl);
                } else {
                    container.insertBefore(dragEl, rows[insertIdx]);
                }
                return;
            }
            if (rows.length === 1) {
                const r = rows[0].getBoundingClientRect();
                const split = (r.left + r.right) / 2;
                if (clientX < split) {
                    container.insertBefore(dragEl, rows[0]);
                } else {
                    container.appendChild(dragEl);
                }
                return;
            }
            let insertIdx = rows.length;
            for (let i = 0; i < rows.length - 1; i += 1) {
                const a = rows[i].getBoundingClientRect();
                const b = rows[i + 1].getBoundingClientRect();
                const split = (a.right + b.left) / 2;
                if (clientX < split) {
                    insertIdx = i;
                    break;
                }
            }
            if (insertIdx >= rows.length) {
                container.appendChild(dragEl);
            } else {
                container.insertBefore(dragEl, rows[insertIdx]);
            }
        }

        function mountSortableList(options = {}) {
            const {
                container,
                axis = 'vertical',
                itemSelector,
                handleSelector,
                getItemId,
                minItemsForDrag = 2,
                onReorder = null,
                accepts = null,
                buildDragPayload = null,
                onSessionEnd = null,
                /* If it returns `true`, `onReorder` is skipped (caller handled commit, e.g. phantom drop). */
                onBeforeReorder = null,
                /* Called at end of each pointermove during a list drag (after hit-testing / ghost move). */
                onPointerMoveExtra = null,
                autoScroll = { edgePx: 28, maxSpeed: 18 },
                /* Sortable `animation` (ms); 0 disables sibling FLIP. See Sortable `_ignoreWhileAnimating` + ghost hide during hit-test. */
                animation = 150,
                animationEasing = null,
                /* Sortable defaults: threshold 1 + invertSwap false = swap as soon as pointer is in the
                   middle band over a sibling. Nested lists can override invertSwap / swapThreshold if needed. */
                swapThreshold = 1,
                invertSwap = false,
                invertedSwapThreshold = null,
                sort = true,
                /* Optional: apply `ll-dnd__source--dragging` / `ll-dnd__wash-surface` to this descendant of
                 * the dragged item (e.g. inner card when `itemSelector` is a padded shell). Must match
                 * inside `itemEl`; falls back to `itemEl` if absent. */
                sourceWashSelector = null,
                /**
                 * Optional selector for a **descendant** inside **`itemEl`** (e.g. inner tile). When it
                 * matches a node **other than** **`itemEl`**, the fixed ghost is still a **`cloneNode` of
                 * `itemEl`**, but its **box** uses **`itemEl` width** with a **vertical span** clipped to
                 * the overlap of **`itemEl`** and that descendant’s rects — so flex-**stretched** shells
                 * (short tile beside a tall one) do not produce a tall empty ghost. When unset or no
                 * match, the ghost tracks **`itemEl`** only.
                 */
                ghostMeasureSelector = null,
                /**
                 * Optional selector for a **descendant** inside **`itemEl`** to clone as the fixed ghost
                 * (for example, clone only the inner unit when `itemEl` is a padded shell). When present
                 * and matched, ghost size/position tracks the matched node rect.
                 */
                ghostCloneSelector = null,
                /**
                 * When > 0, reparenting **into** this list from another list waits for continuous hover
                 * (ms) before `insertDraggableAtPointerInContainer` runs — so placeholders / in-row dragOver
                 * for this list only appear after the delay. Default `0` = immediate (all existing lists).
                 */
                acceptPointerHoverMs = 0
            } = options;

            if (!container || !itemSelector || !handleSelector || typeof getItemId !== 'function') {
                return { destroy() {} };
            }

            const defaultAccepts = (payload, targetCtx) => payload.sourceContainer === targetCtx.container;
            const resolveAccepts = typeof accepts === 'function' ? accepts : defaultAccepts;
            const resolveBuildPayload = typeof buildDragPayload === 'function'
                ? buildDragPayload
                : (itemEl, sourceContainer) => ({
                    kind: 'reorder',
                    id: getItemId(itemEl),
                    sourceContainer,
                    itemSelector
                });

            const listEntry = {
                container,
                axis,
                itemSelector,
                handleSelector,
                getItemId,
                accepts: resolveAccepts,
                buildDragPayload: resolveBuildPayload,
                onReorder,
                minItemsForDrag,
                autoScroll,
                onSessionEnd,
                onBeforeReorder,
                onPointerMoveExtra,
                animation,
                animationEasing,
                swapThreshold,
                invertSwap,
                invertedSwapThreshold,
                sort,
                acceptPointerHoverMs: Math.max(0, Number(acceptPointerHoverMs) || 0),
                onMoveRow() {
                    return true;
                }
            };
            registry.push(listEntry);

            const pointerDownHandler = (startEvent) => {
                if (!startEvent.isPrimary) return;
                if (startEvent.pointerType === 'mouse' && startEvent.button !== 0) return;
                const handleEl = startEvent.target.closest(handleSelector);
                if (!handleEl || !container.contains(handleEl)) return;
                const itemEl = handleEl.closest(itemSelector);
                if (!itemEl) return;
                const movedId = getItemId(itemEl);
                if (!movedId) return;
                if (countDraggables(container, itemSelector) < minItemsForDrag) return;
                if (typeof canStartSortableDrag === 'function' && !canStartSortableDrag()) {
                    return;
                }
                startEvent.preventDefault();

                const dragEl = itemEl;
                const sourceEntry = listEntry;
                const payload = resolveBuildPayload(itemEl, container);
                let ghostEl = null;
                let dragPointerOffsetX = 0;
                let dragPointerOffsetY = 0;

                const dragOriginalParent = dragEl.parentNode;
                const dragOriginalNext = dragEl.nextSibling;

                const session = {
                    dragEl,
                    lastTarget: null,
                    lastDirection: null,
                    pastFirstInvertThresh: false,
                    isCircumstantialInvert: false,
                    targetMoveDistance: 0,
                    targetBeforeFirstSwap: undefined,
                    silent: false,
                    ignoreWhileAnimating: null,
                    /* After cross-list insert, skip dragOver until pointer moves (same-frame dragOver would re-swap using stale hit vs new index). */
                    postCrossListAnchor: null,
                    /* Row-band gap rows: defer reparenting until pointer dwells over the delayed-accept list. */
                    delayedPointerAccept: null,
                    changed() {}
                };

                const itemRect = getRect(itemEl);
                const cloneSourceEl = (typeof ghostCloneSelector === 'string' && ghostCloneSelector.trim())
                    ? (itemEl.querySelector(ghostCloneSelector.trim()) || itemEl)
                    : itemEl;
                const measureEl = (typeof ghostMeasureSelector === 'string' && ghostMeasureSelector.trim())
                    ? (itemEl.querySelector(ghostMeasureSelector.trim()) || null)
                    : null;
                let blockRect = itemRect;
                let hybridGhost = false;
                if (cloneSourceEl && cloneSourceEl !== itemEl) {
                    const cloneRect = getRect(cloneSourceEl);
                    blockRect = cloneRect;
                } else if (measureEl && measureEl !== itemEl) {
                    const measureRect = getRect(measureEl);
                    const hybridTop = Math.max(itemRect.top, measureRect.top);
                    const hybridBottom = Math.min(itemRect.bottom, measureRect.bottom);
                    let hybridH = hybridBottom - hybridTop;
                    if (hybridH < 1) {
                        hybridH = measureRect.height;
                    }
                    hybridGhost = true;
                    blockRect = {
                        left: itemRect.left,
                        top: hybridTop,
                        width: itemRect.width,
                        height: hybridH,
                        right: itemRect.right,
                        bottom: hybridTop + hybridH
                    };
                }
                dragPointerOffsetX = Math.max(0, Math.min(blockRect.width - 1, startEvent.clientX - blockRect.left));
                dragPointerOffsetY = Math.max(0, Math.min(blockRect.height - 1, startEvent.clientY - blockRect.top));

                ghostEl = cloneSourceEl.cloneNode(true);
                sanitizeClone(ghostEl);
                ghostEl.classList.add('ll-dnd__ghost');
                ghostEl.style.position = 'fixed';
                ghostEl.style.transition = 'none';
                ghostEl.style.transform = 'none';
                ghostEl.style.willChange = 'left, top';
                const ghostComputed = windowScope.getComputedStyle(cloneSourceEl);
                const disp = ghostComputed.display || 'block';
                ghostEl.style.display = disp;
                if (disp === 'flex' || disp === 'inline-flex') {
                    ghostEl.style.flexDirection = ghostComputed.flexDirection;
                    ghostEl.style.flexWrap = ghostComputed.flexWrap;
                    ghostEl.style.alignItems = hybridGhost ? 'flex-start' : ghostComputed.alignItems;
                    ghostEl.style.justifyContent = ghostComputed.justifyContent;
                    ghostEl.style.gap = ghostComputed.gap;
                }
                ghostEl.style.boxSizing = 'border-box';
                ghostEl.style.left = `${blockRect.left}px`;
                ghostEl.style.top = `${blockRect.top}px`;
                ghostEl.style.width = `${Math.ceil(blockRect.width)}px`;
                ghostEl.style.height = `${Math.ceil(blockRect.height)}px`;
                if (hybridGhost) {
                    ghostEl.style.minWidth = '0';
                    ghostEl.style.minHeight = '0';
                    ghostEl.style.overflow = 'hidden';
                } else {
                    ghostEl.style.minWidth = ghostComputed.minWidth && ghostComputed.minWidth !== '0px'
                        ? ghostComputed.minWidth
                        : '';
                    ghostEl.style.minHeight = ghostComputed.minHeight && ghostComputed.minHeight !== '0px'
                        ? ghostComputed.minHeight
                        : '';
                }
                document.body.appendChild(ghostEl);

                const updateGhost = (clientX, clientY) => {
                    if (!ghostEl) return;
                    ghostEl.style.left = `${clientX - dragPointerOffsetX}px`;
                    ghostEl.style.top = `${clientY - dragPointerOffsetY}px`;
                };
                updateGhost(startEvent.clientX, startEvent.clientY);

                const sourceWashEl = (typeof sourceWashSelector === 'string' && sourceWashSelector.trim())
                    ? (itemEl.querySelector(sourceWashSelector.trim()) || itemEl)
                    : itemEl;
                sourceWashEl.classList.add('ll-dnd__source--dragging', 'll-dnd__wash-surface');

                const fromIndex = indexInDraggables(sourceEntry.container, itemSelector, dragEl);

                let lastPointerX = startEvent.clientX;
                let lastPointerY = startEvent.clientY;

                let activeEntry = sourceEntry;

                const finalize = () => {
                    if (ghostEl) {
                        ghostEl.remove();
                        ghostEl = null;
                    }
                    if (dragEl && dragEl.parentNode) {
                        cancelSwapAnimationsInContainer(dragEl.parentNode, itemSelector);
                    }
                    session.ignoreWhileAnimating = null;
                    session.postCrossListAnchor = null;
                    session.delayedPointerAccept = null;
                    if (sourceWashEl && sourceWashEl.isConnected) {
                        sourceWashEl.classList.remove('ll-dnd__source--dragging', 'll-dnd__wash-surface');
                    }
                };

                const onCancel = () => {
                    try {
                        if (dragOriginalParent && dragEl.isConnected) {
                            dragOriginalParent.insertBefore(dragEl, dragOriginalNext);
                        }
                    } catch (e) {
                        /* ignore */
                    }
                    finalize();
                };

                const captureRoot = (handleEl.ownerDocument && handleEl.ownerDocument.body)
                    || (typeof document !== 'undefined' ? document.body : null);

                const pointerSessionStarted = runPointerDragSession({
                    handleElement: handleEl,
                    pointerCaptureTarget: captureRoot || handleEl,
                    startEvent,
                    scrollRootOriginElement: container,
                    onMove: ({ clientX, clientY }) => {
                        lastPointerX = clientX;
                        lastPointerY = clientY;
                        updateGhost(clientX, clientY);
                        const nextTarget = findTargetSortableListEntry(
                            clientX,
                            clientY,
                            payload,
                            sourceEntry,
                            dragEl
                        );
                        const wouldCross =
                            !!(nextTarget && dragEl.parentNode !== nextTarget.container);
                        let delayMs = nextTarget ? Number(nextTarget.acceptPointerHoverMs) || 0 : 0;
                        if (prefersReducedMotion(globalScope)) {
                            delayMs = 0;
                        }
                        const applyCrossListMove = () => {
                            if (!nextTarget || dragEl.parentNode === nextTarget.container) return;
                            const oldParent = dragEl.parentNode;
                            const oldEntry = activeEntry;
                            let oldSnap = null;
                            let newSnap = null;
                            const aOld = oldEntry.animation;
                            const aNew = nextTarget.animation;
                            if (aOld > 0 && !prefersReducedMotion(globalScope) && oldParent) {
                                cancelSwapAnimationsInContainer(oldParent, oldEntry.itemSelector);
                                oldSnap = captureSwapAnimationRects(oldParent, oldEntry.itemSelector, dragEl);
                            }
                            if (aNew > 0 && !prefersReducedMotion(globalScope)) {
                                cancelSwapAnimationsInContainer(nextTarget.container, nextTarget.itemSelector);
                                newSnap = captureSwapAnimationRects(
                                    nextTarget.container,
                                    nextTarget.itemSelector,
                                    dragEl
                                );
                            }
                            session.ignoreWhileAnimating = null;
                            const dragFromRect = getRect(dragEl);
                            insertDraggableAtPointerInContainer(nextTarget, dragEl, clientX, clientY);
                            session.postCrossListAnchor = { x: clientX, y: clientY };
                            activeEntry = nextTarget;
                            session.lastTarget = null;
                            session.lastDirection = null;
                            session.pastFirstInvertThresh = false;
                            session.targetMoveDistance = 0;
                            if (oldSnap && oldSnap.size && aOld > 0) {
                                runSortableStyleSwapAnimation(
                                    globalScope,
                                    oldParent,
                                    oldEntry.itemSelector,
                                    dragEl,
                                    oldSnap,
                                    aOld,
                                    oldEntry.animationEasing,
                                    null
                                );
                            }
                            if (newSnap && newSnap.size && aNew > 0) {
                                runSortableStyleSwapAnimation(
                                    globalScope,
                                    nextTarget.container,
                                    nextTarget.itemSelector,
                                    dragEl,
                                    newSnap,
                                    aNew,
                                    nextTarget.animationEasing,
                                    null
                                );
                            }
                            const crossListDragMs = aOld > 0 ? aOld : aNew;
                            if (crossListDragMs > 0) {
                                const crossEase = aOld > 0
                                    ? oldEntry.animationEasing
                                    : nextTarget.animationEasing;
                                runDragElCrossListFlipAnimation(
                                    globalScope,
                                    dragEl,
                                    dragFromRect,
                                    crossListDragMs,
                                    crossEase,
                                    null
                                );
                            }
                        };
                        if (wouldCross && delayMs > 0) {
                            const now =
                                globalScope.performance && typeof globalScope.performance.now === 'function'
                                    ? globalScope.performance.now()
                                    : Date.now();
                            const d = session.delayedPointerAccept;
                            if (d && d.entry === nextTarget) {
                                if (now - d.since >= delayMs) {
                                    session.delayedPointerAccept = null;
                                    applyCrossListMove();
                                }
                            } else {
                                session.delayedPointerAccept = { entry: nextTarget, since: now };
                            }
                        } else {
                            session.delayedPointerAccept = null;
                            if (wouldCross) {
                                applyCrossListMove();
                            }
                        }
                        if (listEntry.sort !== false) {
                            let runDragOver = true;
                            if (session.postCrossListAnchor) {
                                const ax = clientX - session.postCrossListAnchor.x;
                                const ay = clientY - session.postCrossListAnchor.y;
                                const armPx = 4;
                                if (ax * ax + ay * ay < armPx * armPx) {
                                    runDragOver = false;
                                } else {
                                    session.postCrossListAnchor = null;
                                }
                            }
                            if (runDragOver) {
                                let prevGhostVis = '';
                                if (ghostEl) {
                                    prevGhostVis = ghostEl.style.visibility;
                                    ghostEl.style.visibility = 'hidden';
                                }
                                try {
                                    const evtProxy = {
                                        clientX,
                                        clientY,
                                        target: document.elementFromPoint
                                            ? (document.elementFromPoint(clientX, clientY) || activeEntry.container)
                                            : activeEntry.container
                                    };
                                    dragOverList(activeEntry, dragEl, ghostEl, evtProxy, session, windowScope);
                                } finally {
                                    if (ghostEl) {
                                        ghostEl.style.visibility = prevGhostVis;
                                    }
                                }
                            }
                        }
                        if (typeof onPointerMoveExtra === 'function') {
                            try {
                                onPointerMoveExtra({
                                    clientX,
                                    clientY,
                                    dragEl,
                                    ghostEl,
                                    movedId,
                                    session,
                                    activeEntry,
                                    sourceEntry
                                });
                            } catch (e) {
                                /* ignore */
                            }
                        }
                    },
                    onCommit: () => {
                        const toContainer = dragEl.parentNode;
                        const idxReal = toContainer
                            ? indexInDraggables(toContainer, itemSelector, dragEl)
                            : -1;
                        let skipReorder = false;
                        if (typeof onBeforeReorder === 'function') {
                            try {
                                skipReorder = onBeforeReorder({
                                    dragEl,
                                    movedId,
                                    fromContainer: sourceEntry.container,
                                    toContainer,
                                    fromIndex,
                                    toIndex: idxReal,
                                    clientX: lastPointerX,
                                    clientY: lastPointerY,
                                    ghostEl,
                                    payload
                                }) === true;
                            } catch (e) {
                                /* ignore */
                            }
                        }
                        if (!skipReorder && typeof onReorder === 'function' && movedId && idxReal >= 0) {
                            onReorder({
                                id: movedId,
                                fromContainer: sourceEntry.container,
                                toContainer,
                                fromIndex,
                                toIndex: idxReal,
                                payload
                            });
                        }
                        finalize();
                    },
                    onCancel: () => {
                        onCancel();
                    },
                    autoScroll,
                    cancelOnEscape: true,
                    onSessionEnd
                });
                if (!pointerSessionStarted) {
                    finalize();
                }
            };

            container.addEventListener('pointerdown', pointerDownHandler);
            const destroy = () => {
                container.removeEventListener('pointerdown', pointerDownHandler);
                const idx = registry.indexOf(listEntry);
                if (idx >= 0) registry.splice(idx, 1);
            };
            listEntry.destroy = destroy;
            return { destroy };
        }

        return { mountSortableList };
    }

    globalScope.LlumenSortableEngine = {
        createSortableListController
    };
}(typeof window !== 'undefined' ? window : globalThis));
