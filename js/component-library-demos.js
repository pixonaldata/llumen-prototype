/**
 * Component Library only: drag-and-drop tab demos (not exported from LlumenComponents).
 * Depends on window.LlumenComponents and openManagedModal from the host page.
 */
(function () {
    'use strict';

    function stripIds(root) {
        if (!root || !root.querySelectorAll) return;
        root.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    }

    function componentTypeMeta(type) {
        const map = {
            'bar-chart': { label: 'Bar Chart', icon: 'bar_chart' },
            'line-chart': { label: 'Line Chart', icon: 'show_chart' },
            'pie-chart': { label: 'Pie Chart', icon: 'pie_chart' },
            table: { label: 'Table', icon: 'table_chart' },
            metric: { label: 'Metric', icon: 'analytics' },
            gauge: { label: 'Gauge', icon: 'speed' },
            text: { label: 'Text', icon: 'article' }
        };
        return map[type] || { label: type, icon: 'widgets' };
    }

    function clDndEscapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function clDndTileHeaderActionIds(prefix) {
        const base = String(prefix || 'tile').replace(/[^a-zA-Z0-9_-]/g, '-');
        return {
            btnId: `${base}-tileMoreBtn`,
            menuId: `${base}-tileMoreMenu`
        };
    }

    function buildClDndCardChromeHeaderHtml(meta, ids, rowBandDrag) {
        const { btnId, menuId } = ids;
        const dragClass = rowBandDrag ? 'll-icon-btn ll-row-context__tile-drag-handle' : 'll-icon-btn';
        const dragAttr = rowBandDrag ? '' : ' data-cl-dnd-grid-drag-handle';
        return `
                <div class="ll-card__header">
                    <div class="ll-card__title-section">
                        <div class="ll-card__title-wrap">
                            <span class="material-symbols-outlined ll-card__title-icon">${meta.icon}</span>
                            <h3 class="ll-card__title">${clDndEscapeHtml(meta.label)}</h3>
                        </div>
                    </div>
                    <div class="ll-card__header-actions">
                        <div class="ll-card__header-action">
                            <div class="ll-card__header-action-content" data-cl-dnd-tile-dropdown-root>
                                <button type="button" class="ll-icon-btn" id="${btnId}" data-cl-dnd-tile-more-trigger aria-label="Component actions">
                                    <span class="material-symbols-outlined ll-icon-btn__icon">more_vert</span>
                                </button>
                                <div id="${menuId}" class="hidden" data-cl-dnd-tile-more-menu>
                                    <button type="button" class="ll-dropdown__item ll-dropdown__item--dismiss-mouse-focus" data-value="configure">Configure</button>
                                    <button type="button" class="ll-dropdown__item ll-dropdown__item--dismiss-mouse-focus" data-value="remove">Remove</button>
                                </div>
                            </div>
                        </div>
                        <div class="ll-card__header-action">
                            <div class="ll-card__header-action-content">
                                <button type="button" class="${dragClass}"${dragAttr} aria-label="Drag">
                                    <span class="material-symbols-outlined ll-icon-btn__icon">drag_indicator</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
    }

    function buildClDndPlaceholderBodyHtml(type, meta) {
        if (type === 'text') {
            return `<p class="text-sm flex-1 min-h-0 w-full">${CL_DND_ROW_TEXT_DUMMY}</p>`;
        }
        return `<span class="material-symbols-outlined text-gray-500 text-3xl">${meta.icon}</span>`;
    }

    function buildClDndCardContentPlaceholderHtml(type, meta, options = {}) {
        const { isRowContext = false } = options;
        const textMod = type === 'text' ? ' ll-cl-dnd-component-placeholder--text' : ' ll-cl-dnd-component-placeholder--chart';
        const contentClassName = isRowContext
            ? 'll-card__content'
            : 'll-card__content flex-1 flex flex-col min-h-0';
        return `
                <div class="${contentClassName}">
                    <div class="ll-cl-dnd-component-placeholder${textMod}">${buildClDndPlaceholderBodyHtml(type, meta)}</div>
                </div>`;
    }

    function clDndHandleTileMenuValueChange(menuButton, detail) {
        if (!menuButton || !detail) return;
        const v = String(detail.value || '');
        if (v === 'configure') {
            return;
        }
        if (v !== 'remove') {
            return;
        }
        const gridTile = menuButton.closest('.ll-cl-dnd-grid-tile');
        if (gridTile) {
            const tid = String(gridTile.dataset.clDndGridTileId || gridTile.id || '');
            const api = window.__clDndGridModelApi;
            if (
                api
                && typeof api.getGridTilesModel === 'function'
                && typeof api.applyGridTilesModel === 'function'
            ) {
                const m = api.getGridTilesModel() || { tiles: [] };
                const tiles = Array.isArray(m.tiles)
                    ? m.tiles.filter((t) => String(t && t.tileId) !== tid)
                    : [];
                api.applyGridTilesModel({ ...m, tiles });
            } else {
                gridTile.remove();
            }
            return;
        }
        const wrap = menuButton.closest('.ll-row-context__unit');
        const shell = wrap && typeof wrap.closest === 'function' ? wrap.closest('.ll-row-element-container') : null;
        if (!wrap || !shell) {
            return;
        }
        const shellId = String(shell.dataset && shell.dataset.clDndRowShellId ? shell.dataset.clDndRowShellId : '');
        const api = window.__clDndRowBandModelApi;
        if (
            shellId
            && api
            && typeof api.getRowBandModel === 'function'
            && typeof api.applyRowBandModel === 'function'
        ) {
            const snap = api.getRowBandModel() || { maxUnits: 4, rows: [] };
            const rows = (Array.isArray(snap.rows) ? snap.rows : [])
                .map((row) => ({
                    ...row,
                    shells: (Array.isArray(row.shells) ? row.shells : []).filter(
                        (sh) => String(sh && sh.shellId) !== shellId
                    )
                }))
                .filter((row) => Array.isArray(row.shells) && row.shells.length > 0);
            api.applyRowBandModel({ ...snap, rows });
        } else {
            shell.remove();
            if (api && typeof api.syncGapRows === 'function') {
                api.syncGapRows();
            }
        }
    }

    function clDndWireTileHeaderDropdowns(rootEl, components) {
        if (!rootEl || !components || typeof components.initializePortaledDropdown !== 'function') return;
        rootEl.querySelectorAll('[data-cl-dnd-tile-dropdown-root]').forEach((slot) => {
            const btn = slot.querySelector('[data-cl-dnd-tile-more-trigger]');
            const menu = slot.querySelector('[data-cl-dnd-tile-more-menu]');
            if (!btn || !menu || !btn.id || !menu.id) return;
            if (String(btn.dataset.clDndTileMoreDropdownBound) === 'true') return;
            components.initializePortaledDropdown({
                buttonId: btn.id,
                menuId: menu.id,
                datasetFlag: 'clDndTileMoreDropdownBound',
                align: 'right',
                matchTriggerWidth: false,
                onValueChange: (detail) => {
                    clDndHandleTileMenuValueChange(btn, detail);
                }
            });
        });
    }

    const CL_DND_ROW_TEXT_DUMMY =
        'Row width is set by the band; height follows this content. Lorem ipsum dolor sit amet, '
        + 'consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et '
        + 'malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, '
        + 'tempor sit amet, ante.';

    function setupComponentBrowserModal(components) {
        if (!components || typeof components.initializeModal !== 'function') return;
        const modalTemplate = document.getElementById('cl-dnd-component-browser-modal');
        const listTemplate = document.getElementById('cl-dnd-component-browser-list');
        if (!modalTemplate || !listTemplate) return;

        const browserCardsMarkup = listTemplate.innerHTML;
        // Remove legacy static modal shell once its content has been harvested.
        modalTemplate.remove();

        window.__clDndOpenComponentBrowser = (target) => {
            window.__clDndBrowserTarget = target;
            const listId = `cl-dnd-component-browser-list-${Date.now()}`;
            const cancelId = `cl-dnd-component-browser-cancel-${Date.now()}`;
            const controller = components.initializeModal({
                title: 'Component Browser',
                width: '56rem',
                bodyContent: `
                    <div id="${listId}" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${browserCardsMarkup}
                    </div>
                `,
                footerContent: `<button type="button" id="${cancelId}" class="ll-btn ll-btn--outline-default">Cancel</button>`,
                onOpen: ({ controller: openController }) => {
                    const list = openController.body ? openController.body.querySelector(`#${listId}`) : null;
                    const cancelButton = openController.footer ? openController.footer.querySelector(`#${cancelId}`) : null;
                    if (cancelButton && cancelButton.dataset.clDndBound !== 'true') {
                        cancelButton.addEventListener('click', () => {
                            openController.close('cancel');
                        });
                        cancelButton.dataset.clDndBound = 'true';
                    }
                    if (!list) return;
                    list.querySelectorAll('.cl-dnd-component-card').forEach((card) => {
                        const selectTrigger = card.querySelector('.ll-card__link-overlay');
                        if (!selectTrigger || selectTrigger.dataset.clDndBound === 'true') return;
                        const commitSelection = () => {
                            const type = card.getAttribute('data-component-type') || '';
                            const activeTarget = window.__clDndBrowserTarget;
                            if (activeTarget === 'grid' && typeof window.__clDndAddGridComponent === 'function') {
                                window.__clDndAddGridComponent(type);
                            } else if (activeTarget === 'row' && typeof window.__clDndAddRowComponent === 'function') {
                                window.__clDndAddRowComponent(type);
                            }
                            openController.close('picked-component');
                        };
                        selectTrigger.addEventListener('click', commitSelection);
                        selectTrigger.dataset.clDndBound = 'true';
                    });
                },
                onClose: ({ controller: closingController }) => {
                    window.__clDndBrowserTarget = null;
                    closingController.destroy();
                }
            });
            return controller;
        };
    }

    function clDndGetGridColumnCount(surface) {
        if (!surface || surface.nodeType !== 1) return 6;
        return Math.max(1, parseInt(surface.getAttribute('data-cl-grid-cols'), 10) || 6);
    }

    function syncClDndGridColCountButtons(activeCols) {
        const group = document.getElementById('cl-dnd-grid-col-count-group');
        if (!group) return;
        const n0 = Math.max(1, parseInt(activeCols, 10) || 6);
        group.querySelectorAll('button[data-cl-grid-cols]').forEach((b) => {
            const n = parseInt(b.getAttribute('data-cl-grid-cols'), 10);
            const on = n === n0;
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('ll-btn--primary', on);
            b.classList.toggle('ll-btn--outline-default', !on);
        });
    }

    function syncClDndRowBandMaxUnitButtons(activeMu) {
        const group = document.getElementById('cl-dnd-row-max-units-group');
        if (!group) return;
        const mu = Math.max(1, parseInt(activeMu, 10) || 4);
        group.querySelectorAll('button[data-cl-row-max-units]').forEach((b) => {
            const n = parseInt(b.getAttribute('data-cl-row-max-units'), 10);
            const on = n === mu;
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('ll-btn--primary', on);
            b.classList.toggle('ll-btn--outline-default', !on);
        });
    }

    function bindGridTileLegacyResize(surface, tile) {
        const resizeEl = tile.querySelector('.ll-resize-handle--se');
        if (!resizeEl || resizeEl.dataset.clDndLegacyResize === 'true') return;
        resizeEl.dataset.clDndLegacyResize = 'true';

        const startResize = (ev) => {
            if (ev.button !== 0) return;
            ev.preventDefault();
            ev.stopPropagation();
            const startX = ev.clientX;
            const startY = ev.clientY;
            const startCol = parseInt(tile.dataset.colSpan, 10) || 2;
            const startRow = parseInt(tile.dataset.rowSpan, 10) || 1;
            const gridRect = surface.getBoundingClientRect();
            const cols = clDndGetGridColumnCount(surface);
            const gap = 16;
            const cellW = (gridRect.width - (cols - 1) * gap) / cols;
            const rowBase = 80;

            const onMove = (e) => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                const addCol = Math.round(dx / (cellW + gap));
                const addRow = Math.round(dy / (rowBase + gap));
                const nextCol = Math.max(1, Math.min(cols, startCol + addCol));
                const nextRow = Math.max(1, Math.min(6, startRow + addRow));
                tile.dataset.colSpan = String(nextCol);
                tile.dataset.rowSpan = String(nextRow);
                tile.style.gridColumn = `span ${nextCol}`;
                tile.style.gridRow = `span ${nextRow}`;
            };
            const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        };

        resizeEl.addEventListener('mousedown', startResize);
    }

    /** Fallback when `initGridDropContext` is missing: mouse-only move, no live placeholder. */
    function bindGridTileLegacyHeaderDrag(surface, tile) {
        const header = tile.querySelector('[data-cl-dnd-grid-drag-handle]');
        if (!header || tile.dataset.clDndGridLegacyHeaderInit === 'true') return;
        tile.dataset.clDndGridLegacyHeaderInit = 'true';
        let ghost = null;
        let ox = 0;
        let oy = 0;
        header.addEventListener('mousedown', (ev) => {
            if (ev.button !== 0) return;
            if (ev.target.closest('.ll-resize-handle--se')) return;
            ev.preventDefault();
            const r = tile.getBoundingClientRect();
            ox = ev.clientX - r.left;
            oy = ev.clientY - r.top;
            ghost = tile.cloneNode(true);
            ghost.classList.add('ll-cl-dnd-ghost');
            stripIds(ghost);
            ghost.querySelectorAll('.ll-resize-handle--se').forEach((n) => n.remove());
            ghost.style.position = 'fixed';
            ghost.style.width = `${r.width}px`;
            ghost.style.height = `${r.height}px`;
            ghost.style.left = `${r.left}px`;
            ghost.style.top = `${r.top}px`;
            ghost.style.pointerEvents = 'none';
            ghost.style.zIndex = '120';
            ghost.style.opacity = '0.92';
            tile.style.opacity = '0.35';
            document.body.appendChild(ghost);
            const move = (e) => {
                ghost.style.left = `${e.clientX - ox}px`;
                ghost.style.top = `${e.clientY - oy}px`;
            };
            const up = (upEv) => {
                window.removeEventListener('mousemove', move);
                window.removeEventListener('mouseup', up);
                ghost.remove();
                ghost = null;
                tile.style.opacity = '';
                const gr = surface.getBoundingClientRect();
                const cx = upEv.clientX;
                const cy = upEv.clientY;
                if (cx >= gr.left && cx <= gr.right && cy >= gr.top && cy <= gr.bottom) {
                    const relX = cx - gr.left;
                    const relY = cy - gr.top;
                    const cols = clDndGetGridColumnCount(surface);
                    const gap = 16;
                    const cellW = (gr.width - (cols - 1) * gap) / cols;
                    const col = Math.max(0, Math.min(cols - 1, Math.floor(relX / (cellW + gap))));
                    const row = Math.max(1, Math.floor(relY / 100));
                    const cs = parseInt(tile.dataset.colSpan, 10) || 2;
                    const rs = parseInt(tile.dataset.rowSpan, 10) || 1;
                    tile.style.gridColumn = `${col + 1} / span ${cs}`;
                    tile.style.gridRow = `${row} / span ${rs}`;
                }
            };
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
        });
    }

    function initGridContextDemo(components) {
        const surface = document.getElementById('cl-dnd-grid-surface');
        const btn = document.getElementById('cl-dnd-open-grid-browser');
        if (!surface || !btn || surface.dataset.clDndGridDemoInit) return;
        surface.dataset.clDndGridDemoInit = 'true';
        btn.addEventListener('click', () => {
            if (typeof window.__clDndOpenComponentBrowser === 'function') window.__clDndOpenComponentBrowser('grid');
        });

        const gridScrollPanel = document.getElementById('cl-dnd-subtab-grid-panel');

        const renderGridTileFromModel = (entry, _index, doc) => {
            const type = entry && entry.componentType ? String(entry.componentType) : 'metric';
            const meta = componentTypeMeta(type);
            const cs = Math.max(1, parseInt(entry && entry.colSpan, 10) || 2);
            const rs = Math.max(1, parseInt(entry && entry.rowSpan, 10) || 1);
            const c0 = Math.max(1, parseInt(entry && entry.colStart, 10) || 1);
            const r0 = Math.max(1, parseInt(entry && entry.rowStart, 10) || 1);
            const tile = doc.createElement('div');
            tile.className = 'll-card ll-cl-dnd-grid-tile relative flex flex-col min-h-0';
            const tid = entry && entry.tileId ? String(entry.tileId) : `cl-grid-${Date.now()}`;
            tile.id = tid;
            tile.dataset.clDndGridTileId = tid;
            tile.dataset.clDndGridComponentType = type;
            tile.dataset.colSpan = String(cs);
            tile.dataset.rowSpan = String(rs);
            tile.style.gridColumn = `${c0} / span ${cs}`;
            tile.style.gridRow = `${r0} / span ${rs}`;
            if (entry && entry.zIndex != null && Number.isFinite(Number(entry.zIndex))) {
                tile.style.zIndex = String(entry.zIndex);
            }
            const ids = clDndTileHeaderActionIds(tid);
            tile.innerHTML = `${buildClDndCardChromeHeaderHtml(meta, ids, false)}${buildClDndCardContentPlaceholderHtml(type, meta)}
                <button type="button" class="ll-resize-handle--se" aria-label="Resize"></button>`;
            return tile;
        };

        /** Sample layout is authored for this many column tracks (see tile colStart / colSpan). */
        const GRID_SAMPLE_COLUMN_COUNT = 6;

        const gridSampleModel = {
            tiles: [
                {
                    tileId: 'cl-grid-demo-a',
                    componentType: 'bar-chart',
                    colStart: 1,
                    rowStart: 1,
                    colSpan: 2,
                    rowSpan: 2,
                    zIndex: 1
                },
                {
                    tileId: 'cl-grid-demo-b',
                    componentType: 'table',
                    colStart: 3,
                    rowStart: 1,
                    colSpan: 2,
                    rowSpan: 2,
                    zIndex: 2
                },
                {
                    tileId: 'cl-grid-demo-c',
                    componentType: 'metric',
                    colStart: 5,
                    rowStart: 2,
                    colSpan: 2,
                    rowSpan: 2,
                    zIndex: 3
                }
            ]
        };

        const dropOptsBase = {
            gridElement: surface,
            tileSelector: '.ll-cl-dnd-grid-tile',
            resizeHandleSelector: '.ll-resize-handle--se',
            maxRowSpan: 6,
            tileMoveHandleSelector: '[data-cl-dnd-grid-drag-handle]',
            tileMoveDragIgnoreSelector: '.ll-resize-handle--se',
            tileMoveGhostStripSelector: '.ll-resize-handle--se',
            tileMoveMaxGridRow: 64,
            tileMoveScrollRoot: gridScrollPanel || surface
        };

        let spanCtx = null;
        if (components && typeof components.initGridTileModelContext === 'function') {
            spanCtx = components.initGridTileModelContext({
                ...dropOptsBase,
                getTileId: (el) => el.dataset.clDndGridTileId || el.id || '',
                readTileExtras: (el) => {
                    const t = el.dataset && el.dataset.clDndGridComponentType;
                    return t ? { componentType: String(t) } : {};
                },
                renderGridTile: renderGridTileFromModel,
                onAfterSync: () => {
                    surface.querySelectorAll('.ll-cl-dnd-grid-tile').forEach((t) => {
                        clDndWireTileHeaderDropdowns(t, components);
                    });
                }
            });
        } else if (components && typeof components.initGridDropContext === 'function') {
            spanCtx = components.initGridDropContext(dropOptsBase);
        }

        if (
            spanCtx
            && typeof spanCtx.getGridTilesModel === 'function'
            && typeof spanCtx.applyGridTilesModel === 'function'
        ) {
            window.__clDndGridModelApi = {
                getGridTilesModel: () => spanCtx.getGridTilesModel(),
                applyGridTilesModel: (model) => spanCtx.applyGridTilesModel(model)
            };
        } else {
            window.__clDndGridModelApi = null;
        }

        const syncGridSurfaceTemplateColumns = (n) => {
            const cols = Math.max(1, parseInt(n, 10) || 6);
            surface.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
            surface.setAttribute('data-cl-grid-cols', String(cols));
            syncClDndGridColCountButtons(cols);
        };

        const wireTile = (tile) => {
            if (spanCtx) {
                spanCtx.wireTile(tile);
                clDndWireTileHeaderDropdowns(tile, components);
            } else {
                bindGridTileLegacyHeaderDrag(surface, tile);
                bindGridTileLegacyResize(surface, tile);
                clDndWireTileHeaderDropdowns(tile, components);
            }
        };

        let z = 10;
        window.__clDndAddGridComponent = (type) => {
            const meta = componentTypeMeta(type);
            const id = `cl-grid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const tile = document.createElement('div');
            tile.className = 'll-card ll-cl-dnd-grid-tile relative flex flex-col min-h-0';
            tile.id = id;
            tile.dataset.clDndGridTileId = id;
            tile.dataset.clDndGridComponentType = type;
            tile.dataset.colSpan = '2';
            tile.dataset.rowSpan = '1';
            tile.style.gridColumn = 'span 2';
            tile.style.gridRow = 'span 1';
            tile.style.zIndex = String(z++);
            const ids = clDndTileHeaderActionIds(id);
            tile.innerHTML = `${buildClDndCardChromeHeaderHtml(meta, ids, false)}${buildClDndCardContentPlaceholderHtml(type, meta)}
                <button type="button" class="ll-resize-handle--se" aria-label="Resize"></button>`;
            surface.appendChild(tile);
            wireTile(tile);
        };

        const sampleBtn = document.getElementById('cl-dnd-grid-load-sample');
        const roundTripBtn = document.getElementById('cl-dnd-grid-round-trip');
        if (
            spanCtx
            && typeof spanCtx.applyGridTilesModel === 'function'
            && typeof spanCtx.getGridTilesModel === 'function'
        ) {
            if (sampleBtn) {
                sampleBtn.addEventListener('click', () => {
                    syncGridSurfaceTemplateColumns(GRID_SAMPLE_COLUMN_COUNT);
                    spanCtx.applyGridTilesModel(JSON.parse(JSON.stringify(gridSampleModel)));
                });
            }
            if (roundTripBtn) {
                roundTripBtn.addEventListener('click', () => {
                    const snap = spanCtx.getGridTilesModel();
                    spanCtx.applyGridTilesModel(JSON.parse(JSON.stringify(snap)));
                });
            }
        }

        const colGroup = document.getElementById('cl-dnd-grid-col-count-group');
        if (colGroup && components && typeof components.adaptLlumenGridTilesModelToColumnCount === 'function') {
            const applyGridColumnCount = (colCount) => {
                const n = Math.max(1, parseInt(colCount, 10) || 6);
                let adapted = null;
                if (
                    spanCtx
                    && typeof spanCtx.getGridTilesModel === 'function'
                    && typeof spanCtx.applyGridTilesModel === 'function'
                ) {
                    const snap = spanCtx.getGridTilesModel();
                    adapted = components.adaptLlumenGridTilesModelToColumnCount(snap, n, { maxGridRow: 64 });
                }
                syncGridSurfaceTemplateColumns(n);
                if (adapted && spanCtx && typeof spanCtx.applyGridTilesModel === 'function') {
                    spanCtx.applyGridTilesModel(adapted);
                }
            };
            colGroup.querySelectorAll('button[data-cl-grid-cols]').forEach((b) => {
                b.addEventListener('click', () => {
                    const v = parseInt(b.getAttribute('data-cl-grid-cols'), 10);
                    if (Number.isFinite(v)) applyGridColumnCount(v);
                });
            });
        }
        syncClDndGridColCountButtons(clDndGetGridColumnCount(surface));

        surface.querySelectorAll('.ll-cl-dnd-grid-tile').forEach((t) => wireTile(t));
    }

    function initRowContextDemo(components) {
        const root = document.getElementById('cl-dnd-row-band');
        const btn = document.getElementById('cl-dnd-open-row-browser');
        if (!root || !btn || btn.dataset.bound) return;
        btn.dataset.bound = 'true';
        btn.addEventListener('click', () => {
            if (typeof window.__clDndOpenComponentBrowser === 'function') window.__clDndOpenComponentBrowser('row');
        });

        const rowBandDemoState = { maxUnits: 4 };
        const unitSelector = '.ll-flex-band-unit';
        const bandShellSelector = '.ll-row-element-container';
        const filledRowSelector = '.ll-row-band-row:not(.ll-row-band-row--gap)';
        const rowsHost = root.querySelector('[data-cl-dnd-row-rows-host]');
        if (!rowsHost) return;

        const clc = components || (typeof window !== 'undefined' ? window.LlumenComponents : null);

        const initBandResize = components && typeof components.initLlumenFlexBandUnitResize === 'function'
            ? components.initLlumenFlexBandUnitResize
            : null;

        const bandResizeByWrap = new WeakMap();

        const wireBandUnit = (rowEl, wrap) => {
            if (!initBandResize || !wrap) return;
            const prev = bandResizeByWrap.get(wrap);
            if (prev && typeof prev.destroy === 'function') {
                prev.destroy();
            }
            const rw = initBandResize({
                rowContainer: rowEl,
                unitElement: wrap,
                unitSelector,
                maxUnits: rowBandDemoState.maxUnits
            });
            bandResizeByWrap.set(wrap, rw);
        };

        /** Stable id + left-edge row grip (vertical sortable handle); (re-)wires flex-band resize on each unit. */
        const decorateRowBandRowEl = (rowEl) => {
            if (!rowEl || rowEl.nodeType !== 1) return;
            if (rowEl.classList.contains('ll-row-band-row--gap')) return;
            if (!rowEl.dataset.clDndRowBandId) {
                rowEl.dataset.clDndRowBandId = `cl-rb-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            }
            if (!rowEl.classList.contains('ll-row-context__row--with-grip-offset')) {
                rowEl.classList.add('ll-row-context__row--with-grip-offset');
            }
            if (!rowEl.querySelector(':scope > .ll-row-context__row-drag-handle')) {
                const rowDrag = document.createElement('button');
                rowDrag.type = 'button';
                rowDrag.className = 'll-icon-btn ll-row-context__row-drag-handle';
                rowDrag.setAttribute('aria-label', 'Reorder row');
                rowDrag.innerHTML = '<span class="material-symbols-outlined ll-icon-btn__icon ll-row-context__row-drag-icon">drag_handle</span>';
                rowEl.insertBefore(rowDrag, rowEl.firstChild);
            }
            rowEl.querySelectorAll(unitSelector).forEach((wrap) => {
                wireBandUnit(rowEl, wrap);
                clDndWireTileHeaderDropdowns(wrap, clc);
            });
        };

        const createClDndRowBandShell = (doc, type, units, shellId, contextMaxUnits) => {
            const meta = componentTypeMeta(type);
            const u = Math.max(1, parseInt(units, 10) || 1);
            const shell = doc.createElement('div');
            shell.className = 'll-row-element-container';
            if (shellId) {
                shell.dataset.clDndRowShellId = String(shellId);
            }
            const muHost = contextMaxUnits != null
                ? Math.max(1, parseInt(contextMaxUnits, 10) || rowBandDemoState.maxUnits)
                : rowBandDemoState.maxUnits;
            if (clc && typeof clc.setLlumenBandWidthClass === 'function') {
                clc.setLlumenBandWidthClass(shell, muHost, u);
            } else {
                shell.classList.add(`ll-band-c${muHost}-u${u}`);
            }
            const wrap = doc.createElement('div');
            wrap.className = 'll-row-context__unit ll-flex-band-unit ll-card';
            wrap.dataset.units = String(u);
            wrap.dataset.clDndRowComponentType = type;
            const ids = clDndTileHeaderActionIds(shellId || `cl-rs-${Date.now()}`);
            wrap.innerHTML = `${buildClDndCardChromeHeaderHtml(meta, ids, true)}${buildClDndCardContentPlaceholderHtml(type, meta, { isRowContext: true })}
                <button type="button" class="ll-resize-handle--se" aria-label="Resize width (units)"></button>`;
            shell.appendChild(wrap);
            return { shell, wrap };
        };

        if (!components || typeof components.initRowBandContext !== 'function') {
            return;
        }

        const renderFilledRowFromSnapshot = (rowSnap, _index, doc, hostMaxUnits) => {
            const rowEl = doc.createElement('div');
            rowEl.className = 'll-row-band-row ll-row-context__row';
            if (rowSnap.rowId) {
                rowEl.dataset.clDndRowBandId = String(rowSnap.rowId);
            }
            const bandCap = Math.max(1, parseInt(hostMaxUnits, 10) || rowBandDemoState.maxUnits);
            const shells = Array.isArray(rowSnap.shells) ? rowSnap.shells : [];
            for (let si = 0; si < shells.length; si += 1) {
                const sh = shells[si];
                const type = sh && sh.componentType ? String(sh.componentType) : 'metric';
                const sid = sh && sh.shellId
                    ? String(sh.shellId)
                    : `cl-rs-${Date.now()}-${si}`;
                const u = Math.max(1, parseInt(sh && sh.units, 10) || 1);
                const { shell } = createClDndRowBandShell(doc, type, u, sid, bandCap);
                rowEl.appendChild(shell);
            }
            return rowEl;
        };

        const rowBandSampleModel = {
            maxUnits: 4,
            rows: [
                {
                    rowId: 'cl-rb-sample-a',
                    shells: [
                        { shellId: 'cl-rs-sample-1', units: 2, componentType: 'bar-chart' },
                        { shellId: 'cl-rs-sample-2', units: 2, componentType: 'table' }
                    ]
                },
                {
                    rowId: 'cl-rb-sample-b',
                    shells: [
                        { shellId: 'cl-rs-sample-3', units: 1, componentType: 'metric' },
                        { shellId: 'cl-rs-sample-4', units: 3, componentType: 'text' }
                    ]
                }
            ]
        };

        const { syncGapRows, getRowBandModel, applyRowBandModel, setRowBandMaxUnits } = components.initRowBandContext({
            hostElement: rowsHost,
            filledRowSelector,
            bandShellSelector,
            unitSelector,
            maxUnits: rowBandDemoState.maxUnits,
            rowVerticalHandleSelector: '.ll-row-context__row-drag-handle',
            tileHorizontalHandleSelector: '.ll-row-context__tile-drag-handle',
            getRowId: (el) => el.dataset.clDndRowBandId || '',
            getShellId: (el) => el.dataset.clDndRowShellId || '',
            decorateFilledRow: decorateRowBandRowEl,
            onWireBandUnit: wireBandUnit,
            readShellExtras: (shellEl) => {
                const wrap = shellEl.querySelector(unitSelector);
                const t = wrap && wrap.dataset && wrap.dataset.clDndRowComponentType;
                return t ? { componentType: String(t) } : {};
            },
            renderFilledRow: renderFilledRowFromSnapshot
        });

        window.__clDndRowBandModelApi = {
            getRowBandModel,
            applyRowBandModel,
            syncGapRows
        };

        const roundTripBtn = document.getElementById('cl-dnd-row-band-round-trip');
        if (roundTripBtn && typeof applyRowBandModel === 'function') {
            roundTripBtn.addEventListener('click', () => {
                const snap = getRowBandModel();
                rowBandDemoState.maxUnits = Math.max(
                    1,
                    parseInt(snap && snap.maxUnits, 10) || rowBandDemoState.maxUnits
                );
                syncClDndRowBandMaxUnitButtons(rowBandDemoState.maxUnits);
                applyRowBandModel(JSON.parse(JSON.stringify(snap)));
                const after = getRowBandModel();
                rowBandDemoState.maxUnits = Math.max(
                    1,
                    parseInt(after && after.maxUnits, 10) || rowBandDemoState.maxUnits
                );
                syncClDndRowBandMaxUnitButtons(rowBandDemoState.maxUnits);
            });
        }
        const sampleBtn = document.getElementById('cl-dnd-row-band-load-sample');
        if (sampleBtn && typeof applyRowBandModel === 'function') {
            sampleBtn.addEventListener('click', () => {
                rowBandDemoState.maxUnits = 4;
                syncClDndRowBandMaxUnitButtons(4);
                applyRowBandModel(JSON.parse(JSON.stringify(rowBandSampleModel)));
            });
        }

        const muGroup = document.getElementById('cl-dnd-row-max-units-group');
        if (muGroup && typeof setRowBandMaxUnits === 'function') {
            muGroup.querySelectorAll('button[data-cl-row-max-units]').forEach((b) => {
                b.addEventListener('click', () => {
                    const v = parseInt(b.getAttribute('data-cl-row-max-units'), 10);
                    if (!Number.isFinite(v) || v < 1) return;
                    rowBandDemoState.maxUnits = v;
                    setRowBandMaxUnits(v);
                    syncClDndRowBandMaxUnitButtons(v);
                });
            });
        }
        syncClDndRowBandMaxUnitButtons(rowBandDemoState.maxUnits);

        const sumRowUnits = (rowEl) => Array.from(rowEl.querySelectorAll(unitSelector)).reduce(
            (s, el) => s + (parseInt(el.dataset.units, 10) || 1),
            0
        );

        /** Last filled row that can accept **`minFree`** units without exceeding **`maxUnits`** (else `null`). */
        const pickLastRowWithAtLeastFreeUnits = (minFree) => {
            const rows = Array.from(rowsHost.querySelectorAll(`:scope > ${filledRowSelector}`));
            for (let i = rows.length - 1; i >= 0; i -= 1) {
                const row = rows[i];
                if (rowBandDemoState.maxUnits - sumRowUnits(row) >= minFree) return row;
            }
            return null;
        };

        window.__clDndAddRowComponent = (type) => {
            /* Demo default width; real apps pass per-component defaults from metadata. */
            const defaultInsertUnits = 2;
            let rowEl = pickLastRowWithAtLeastFreeUnits(defaultInsertUnits);
            if (!rowEl) {
                rowEl = document.createElement('div');
                rowEl.className = 'll-row-band-row ll-row-context__row';
                decorateRowBandRowEl(rowEl);
                rowsHost.appendChild(rowEl);
            }
            const shellId = `cl-rs-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            const { shell, wrap } = createClDndRowBandShell(document, type, defaultInsertUnits, shellId);
            rowEl.appendChild(shell);
            wireBandUnit(rowEl, wrap);
            clDndWireTileHeaderDropdowns(wrap, clc);
            syncGapRows();
        };
    }

    /**
     * Next insert position for the surface demo — mirrors workflow `nextCanvasPosition` idea:
     * to the **right** of the right-most item with a gap; if that would overflow the surface content
     * box, start a **new row** below the lowest bottom (same pattern as placing “under” when no room).
     */
    function computeClDndSurfaceInsertPosition(surface) {
        const PAD = 8;
        const GAP_H = 32;
        const GAP_V = 24;
        const EST_W = 128;
        const EST_H = 48;

        if (!surface) return { x: PAD, y: PAD };

        const nodes = Array.from(surface.querySelectorAll('.ll-cl-dnd-canvas-node'));
        const contentW = Math.max(surface.scrollWidth, surface.clientWidth, 1);
        const contentH = Math.max(surface.scrollHeight, surface.clientHeight, 1);

        if (nodes.length === 0) {
            const sl = surface.scrollLeft;
            const st = surface.scrollTop;
            const cx = sl + Math.max(0, surface.clientWidth / 2 - EST_W / 2);
            const cy = st + Math.max(0, surface.clientHeight / 2 - EST_H / 2);
            return {
                x: Math.max(PAD, Math.min(cx, contentW - EST_W - PAD)),
                y: Math.max(PAD, Math.min(cy, contentH - EST_H - PAD))
            };
        }

        let rightMostEl = null;
        let maxRight = -Infinity;
        for (let i = 0; i < nodes.length; i++) {
            const el = nodes[i];
            const left = parseFloat(el.style.left) || 0;
            const right = left + el.offsetWidth;
            if (right > maxRight) {
                maxRight = right;
                rightMostEl = el;
            }
        }

        const rmLeft = parseFloat(rightMostEl.style.left) || 0;
        const rmTop = parseFloat(rightMostEl.style.top) || 0;
        let nx = rmLeft + rightMostEl.offsetWidth + GAP_H;
        let ny = rmTop;

        if (nx + EST_W > contentW - PAD) {
            let maxBottom = 0;
            for (let j = 0; j < nodes.length; j++) {
                const el = nodes[j];
                const top = parseFloat(el.style.top) || 0;
                maxBottom = Math.max(maxBottom, top + el.offsetHeight);
            }
            nx = PAD;
            ny = maxBottom + GAP_V;
        }

        nx = Math.max(PAD, Math.min(nx, contentW - EST_W - PAD));
        ny = Math.max(PAD, Math.min(ny, contentH - EST_H - PAD));

        return { x: nx, y: ny };
    }

    function initCanvasContextDemo(components, openManagedModal) {
        const surface = document.getElementById('cl-dnd-canvas-surface');
        const btn = document.getElementById('cl-dnd-open-canvas-add-node');
        if (!surface || !btn || surface.dataset.clDndCanvasDemoInit) return;
        surface.dataset.clDndCanvasDemoInit = 'true';

        const lc = components || (typeof window !== 'undefined' ? window.LlumenComponents : null);

        if (!surface.__clDndCanvasSelectionIds) {
            surface.__clDndCanvasSelectionIds = new Set();
        }
        const syncClDndCanvasSelectionVisual = () => {
            surface.querySelectorAll('.ll-cl-dnd-canvas-node').forEach((el) => {
                const id = el.dataset.clDndCanvasNodeId;
                el.classList.toggle(
                    'll-surface-item--selected',
                    Boolean(id && surface.__clDndCanvasSelectionIds.has(id))
                );
            });
        };
        if (!surface.dataset.clDndCanvasSelectCapture) {
            surface.dataset.clDndCanvasSelectCapture = 'true';
            surface.addEventListener(
                'pointerdown',
                (ev) => {
                    if (!ev.isPrimary) return;
                    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
                    if (!surface.contains(ev.target)) return;
                    if (ev.target.closest('.ll-resize-handle--se')) return;

                    const node = ev.target.closest('.ll-cl-dnd-canvas-node');
                    const sel = surface.__clDndCanvasSelectionIds;

                    if (!node) {
                        sel.clear();
                        syncClDndCanvasSelectionVisual();
                        return;
                    }

                    const id = node.dataset.clDndCanvasNodeId;
                    if (!id) return;

                    const multi = ev.shiftKey || ev.metaKey || ev.ctrlKey;
                    if (multi) {
                        if (sel.has(id)) {
                            sel.delete(id);
                        } else {
                            sel.add(id);
                        }
                        syncClDndCanvasSelectionVisual();
                        ev.preventDefault();
                        ev.stopPropagation();
                        return;
                    }

                    if (!sel.has(id)) {
                        sel.clear();
                        sel.add(id);
                        syncClDndCanvasSelectionVisual();
                    }
                },
                true
            );
        }

        const palette = document.getElementById('cl-dnd-canvas-palette');
        const canvasViewport = surface.closest('.ll-cl-dnd-canvas-viewport');
        if (
            palette
            && lc
            && typeof lc.initCanvasDropContext === 'function'
            && !surface.dataset.clDndCanvasDropPaletteInit
        ) {
            surface.dataset.clDndCanvasDropPaletteInit = 'true';
            const dropCtx = lc.initCanvasDropContext({
                surfaceElement: surface,
                scrollRootOriginElement: canvasViewport && canvasViewport.nodeType === 1 ? canvasViewport : null,
                pointerCaptureTarget: document.body,
                padMin: 8,
                defaultGhostWidth: 168,
                defaultGhostHeight: 44,
                onDropCommit(detail) {
                    const name = typeof detail.payload === 'string' && detail.payload.trim()
                        ? detail.payload.trim()
                        : 'Node';
                    const node = document.createElement('div');
                    node.className = 'll-cl-dnd-canvas-node absolute bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 pr-6 shadow-lg cursor-grab select-none min-w-[7rem] min-h-[2.75rem]';
                    node.style.left = `${Math.round(detail.left)}px`;
                    node.style.top = `${Math.round(detail.top)}px`;
                    const span = document.createElement('span');
                    span.className = 'text-sm text-white pointer-events-none';
                    span.textContent = name;
                    node.appendChild(span);
                    const rb = document.createElement('button');
                    rb.type = 'button';
                    rb.className = 'll-resize-handle--se';
                    rb.setAttribute('aria-label', 'Resize');
                    node.appendChild(rb);
                    node.dataset.clDndCanvasNodeId = `cl-canvas-${Date.now()}`;
                    surface.appendChild(node);
                    wireCanvasPlacedItem(surface, node, components);
                    runClDndSurfaceOverlapAvoidance(surface, node, components);
                    try {
                        node.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
                    } catch (e) {
                        /* ignore */
                    }
                }
            });
            palette.querySelectorAll('[data-cl-canvas-palette-drag]').forEach((btn) => {
                btn.addEventListener('pointerdown', (ev) => {
                    if (!ev.isPrimary) return;
                    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
                    const label = (btn.getAttribute('data-ll-insert-drag-label') || '').trim()
                        || (btn.textContent || '').trim()
                        || 'Item';
                    dropCtx.beginInsertPointerDrag({
                        startEvent: ev,
                        sourceElement: btn,
                        payload: label
                    });
                });
            });
        }

        const nodeCatalog = [
            { category: 'Triggers', name: 'Manual Trigger', description: 'Start manually.' },
            { category: 'Triggers', name: 'Webhook Trigger', description: 'Start from webhook.' },
            { category: 'Data & Flow', name: 'If / Else', description: 'Branch on condition.' },
            { category: 'Actions', name: 'Send Chat Message', description: 'Send a message.' }
        ];
        const categoryDescriptions = {
            Triggers: 'Start workflow execution.',
            'Data & Flow': 'Transform and route data.',
            Actions: 'Execute side effects.'
        };

        btn.addEventListener('click', () => {
            const searchInputId = `cl-dnd-canvas-nav-search-${Date.now()}`;
            const searchClearId = `cl-dnd-canvas-nav-clear-${Date.now()}`;
            const listContainerId = `cl-dnd-canvas-nav-list-${Date.now()}`;

            const navigationModal = openManagedModal({
                title: 'Add to surface',
                mode: 'seamless',
                position: 'right',
                width: '26rem',
                fullHeight: true,
                compactPadding: true,
                top: 'var(--component-library-header-height, 0px)',
                bodyPadding: false,
                bodyContent: `
                    <div class="p-4 border-b border-gray-700">
                        <div class="ll-input-with-left-icon">
                            <div class="ll-input-with-left-icon__left ll-input-with-left-icon__icon">
                                <span class="material-symbols-outlined">search</span>
                            </div>
                            <input id="${searchInputId}" type="text" class="ll-input ll-input--search ll-input-with-left-icon__input" placeholder="Search items…">
                            <button id="${searchClearId}" type="button" class="ll-icon-btn ll-search-clear-btn hidden" data-tooltip="Clear Search">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                    <div id="${listContainerId}" class="p-4 space-y-3"></div>
                `
            });

            const searchInput = navigationModal.body.querySelector(`#${searchInputId}`);
            const listContainer = navigationModal.body.querySelector(`#${listContainerId}`);
            if (!searchInput || !listContainer) return;

            let activeCategory = null;
            let activeQuery = '';

            const addNodeToCanvas = (name) => {
                const node = document.createElement('div');
                node.className = 'll-cl-dnd-canvas-node absolute bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 pr-6 shadow-lg cursor-grab select-none min-w-[7rem] min-h-[2.75rem]';
                const pos = computeClDndSurfaceInsertPosition(surface);
                node.style.left = `${Math.round(pos.x)}px`;
                node.style.top = `${Math.round(pos.y)}px`;
                node.innerHTML = `
                    <span class="text-sm text-white pointer-events-none">${name}</span>
                    <button type="button" class="ll-resize-handle--se" aria-label="Resize"></button>
                `;
                node.dataset.clDndCanvasNodeId = `cl-canvas-${Date.now()}`;
                surface.appendChild(node);
                wireCanvasPlacedItem(surface, node, components);
                runClDndSurfaceOverlapAvoidance(surface, node, components);
                try {
                    node.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
                } catch (e) {
                    /* ignore */
                }
            };

            const setHeaderState = () => {
                const hasSearch = Boolean(activeQuery.trim());
                if (hasSearch) navigationModal.setTitle('Search Results');
                else if (activeCategory) navigationModal.setTitle(activeCategory);
                else navigationModal.setTitle('Add to surface');
                const shouldShowBack = hasSearch || Boolean(activeCategory);
                navigationModal.setBackButton(
                    shouldShowBack
                        ? {
                              visible: true,
                              ariaLabel: 'Back',
                              onClick: () => {
                                  if (activeQuery.trim()) {
                                      activeQuery = '';
                                      searchInput.value = '';
                                      renderList();
                                      return;
                                  }
                                  if (activeCategory) {
                                      activeCategory = null;
                                      renderList();
                                  }
                              }
                          }
                        : null
                );
            };

            const renderCategoryButtons = () => {
                const categories = Array.from(new Set(nodeCatalog.map((e) => e.category)));
                listContainer.innerHTML = categories
                    .map(
                        (cat) => `
                    <button type="button" class="ll-block-link" data-cl-canvas-nav-cat="${cat}">
                        <div class="ll-block-link__main">
                            <div class="ll-block-link__body">
                                <div class="ll-block-link__title">${cat}</div>
                                <div class="ll-block-link__description">${categoryDescriptions[cat] || ''}</div>
                            </div>
                        </div>
                        <span class="material-symbols-outlined ll-block-link__chevron">chevron_right</span>
                    </button>`
                    )
                    .join('');
                listContainer.querySelectorAll('[data-cl-canvas-nav-cat]').forEach((b) => {
                    b.addEventListener('click', () => {
                        activeCategory = String(b.getAttribute('data-cl-canvas-nav-cat') || '');
                        renderList();
                    });
                });
            };

            const renderNodes = (nodes) => {
                if (nodes.length === 0) {
                    listContainer.innerHTML = '<div class="text-sm text-gray-400">No nodes match.</div>';
                    return;
                }
                listContainer.innerHTML = nodes
                    .map(
                        (n) => `
                    <button type="button" class="ll-block-link" data-cl-canvas-add="${n.name.replace(/"/g, '&quot;')}">
                        <div class="ll-block-link__main">
                            <div class="ll-block-link__body">
                                <div class="ll-block-link__title">${n.name}</div>
                                <div class="ll-block-link__description">${n.description}</div>
                            </div>
                        </div>
                    </button>`
                    )
                    .join('');
                listContainer.querySelectorAll('[data-cl-canvas-add]').forEach((b) => {
                    b.addEventListener('click', () => {
                        addNodeToCanvas(b.getAttribute('data-cl-canvas-add') || 'Node');
                        navigationModal.close('picked-node');
                    });
                });
            };

            const renderList = () => {
                const q = activeQuery.trim().toLowerCase();
                if (q) {
                    renderNodes(
                        nodeCatalog.filter(
                            (n) => n.name.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
                        )
                    );
                } else if (activeCategory) {
                    renderNodes(nodeCatalog.filter((n) => n.category === activeCategory));
                } else {
                    renderCategoryButtons();
                }
                setHeaderState();
            };

            components.initializeSearchInput(searchInputId, {
                clearButtonId: searchClearId,
                datasetFlag: 'clDndCanvasNavSearch',
                onInput: () => {
                    activeQuery = searchInput.value;
                    renderList();
                }
            });
            renderList();
        });

        const teardownClDndCanvasNodes = () => {
            surface.querySelectorAll('.ll-cl-dnd-canvas-node').forEach((node) => {
                if (node.__clDndSurfaceDragDestroy) {
                    try {
                        node.__clDndSurfaceDragDestroy();
                    } catch (e) {
                        /* ignore */
                    }
                    node.__clDndSurfaceDragDestroy = null;
                }
                if (node.__clDndSurfaceFreeformResizeDestroy) {
                    try {
                        node.__clDndSurfaceFreeformResizeDestroy();
                    } catch (e2) {
                        /* ignore */
                    }
                    node.__clDndSurfaceFreeformResizeDestroy = null;
                }
            });
        };

        const renderPlacedCanvasNodeFromModel = (entry, _index, doc) => {
            const node = doc.createElement('div');
            node.className = 'll-cl-dnd-canvas-node absolute bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 pr-6 shadow-lg cursor-grab select-none min-w-[7rem] min-h-[2.75rem]';
            node.style.left = `${Math.round(Number(entry && entry.left) || 0)}px`;
            node.style.top = `${Math.round(Number(entry && entry.top) || 0)}px`;
            const w = Number(entry && entry.width);
            const h = Number(entry && entry.height);
            if (Number.isFinite(w) && w > 0) {
                node.style.width = `${Math.round(w)}px`;
            }
            if (Number.isFinite(h) && h > 0) {
                node.style.height = `${Math.round(h)}px`;
            }
            const label = entry && entry.label != null ? String(entry.label) : 'Item';
            const span = doc.createElement('span');
            span.className = 'text-sm text-white pointer-events-none';
            span.textContent = label;
            node.appendChild(span);
            const rb = doc.createElement('button');
            rb.type = 'button';
            rb.className = 'll-resize-handle--se';
            rb.setAttribute('aria-label', 'Resize');
            node.appendChild(rb);
            node.dataset.clDndCanvasNodeId = (entry && entry.id) ? String(entry.id) : `cl-canvas-${Date.now()}`;
            return node;
        };

        const canvasSampleModel = {
            items: [
                { id: 'cl-canvas-demo-a', left: 40, top: 40, width: 160, height: 72, label: 'Sample A' },
                { id: 'cl-canvas-demo-b', left: 240, top: 56, width: 176, height: 80, label: 'Sample B' },
                { id: 'cl-canvas-demo-c', left: 120, top: 160, width: 200, height: 72, label: 'Sample C' }
            ]
        };

        const getCanvasPlacedModel = () => {
            if (!lc || typeof lc.readLlumenSurfacePlacedItemsModelFromHost !== 'function') {
                return { items: [] };
            }
            return lc.readLlumenSurfacePlacedItemsModelFromHost(surface, {
                itemSelector: '.ll-cl-dnd-canvas-node',
                getItemId: (el) => el.dataset.clDndCanvasNodeId || '',
                readItemExtras: (el) => {
                    const lab = el.querySelector('.text-sm.text-white');
                    const t = lab && lab.textContent ? lab.textContent.trim() : '';
                    return t ? { label: t } : {};
                }
            });
        };

        const applyCanvasPlacedModel = (model) => {
            if (!lc || typeof lc.applyLlumenSurfacePlacedItemsModel !== 'function') return;
            teardownClDndCanvasNodes();
            lc.applyLlumenSurfacePlacedItemsModel(surface, model, {
                itemSelector: '.ll-cl-dnd-canvas-node',
                renderPlacedItem: renderPlacedCanvasNodeFromModel,
                afterApply() {
                    surface.querySelectorAll('.ll-cl-dnd-canvas-node').forEach((n) => {
                        wireCanvasPlacedItem(surface, n, components);
                    });
                    surface.__clDndCanvasSelectionIds.clear();
                    syncClDndCanvasSelectionVisual();
                }
            });
        };

        const canvasSampleBtn = document.getElementById('cl-dnd-canvas-load-sample');
        if (canvasSampleBtn) {
            canvasSampleBtn.addEventListener('click', () => {
                applyCanvasPlacedModel(JSON.parse(JSON.stringify(canvasSampleModel)));
            });
        }
        const canvasRoundTripBtn = document.getElementById('cl-dnd-canvas-round-trip');
        if (canvasRoundTripBtn) {
            canvasRoundTripBtn.addEventListener('click', () => {
                const snap = getCanvasPlacedModel();
                applyCanvasPlacedModel(JSON.parse(JSON.stringify(snap)));
            });
        }

        surface.querySelectorAll('.ll-cl-dnd-canvas-node').forEach((n) => wireCanvasPlacedItem(surface, n, components));
    }

    /** Demo harness: propagate overlaps on a 2D surface after move or resize; `anchorIds` (or `anchorEl`) stay fixed. */
    function runClDndSurfaceOverlapAvoidance(surface, anchorEl, components, anchorIds = null) {
        if (!surface || !anchorEl) return;
        const lc = components || (typeof window !== 'undefined' ? window.LlumenComponents : null);
        if (!lc || typeof lc.resolveLlumenSurfaceRectOverlaps !== 'function') return;
        const sr = surface.getBoundingClientRect();
        const models = Array.from(surface.querySelectorAll('.ll-cl-dnd-canvas-node')).map((el) => ({
            id: el.dataset.clDndCanvasNodeId || el.getAttribute('data-cl-dnd-canvas-node-id'),
            x: parseFloat(el.style.left) || 0,
            y: parseFloat(el.style.top) || 0,
            width: el.offsetWidth,
            height: el.offsetHeight,
            _el: el
        }));
        let anchorIdList = Array.isArray(anchorIds) && anchorIds.length > 0
            ? anchorIds.map((id) => String(id)).filter(Boolean)
            : null;
        if (!anchorIdList || anchorIdList.length === 0) {
            const single = anchorEl.dataset.clDndCanvasNodeId || anchorEl.getAttribute('data-cl-dnd-canvas-node-id');
            if (!single) return;
            anchorIdList = [String(single)];
        }
        lc.resolveLlumenSurfaceRectOverlaps(models, anchorIdList, {
            getVisualMetrics: () => ({
                leftOverflow: 0,
                rightOverflow: 0,
                topOverflow: 0,
                bottomOverflow: 0
            }),
            margin: 10,
            verticalShiftBonus: 0,
            minX: 8,
            minY: 8
        });
        models.forEach((m) => {
            if (!m._el) return;
            const nx = Math.max(8, Math.min(sr.width - m.width - 8, m.x));
            const ny = Math.max(8, Math.min(sr.height - m.height - 8, m.y));
            m._el.style.left = `${nx}px`;
            m._el.style.top = `${ny}px`;
        });
    }

    function wireCanvasPlacedItem(surface, node, components) {
        const lc = components || (typeof window !== 'undefined' ? window.LlumenComponents : null);
        if (node.__clDndSurfaceDragDestroy) {
            try {
                node.__clDndSurfaceDragDestroy();
            } catch (e) {
                /* ignore */
            }
            node.__clDndSurfaceDragDestroy = null;
        }
        if (lc && typeof lc.initLlumenSurfacePlacedItemDrag === 'function') {
            if (!node.dataset.clDndCanvasNodeId) {
                node.dataset.clDndCanvasNodeId = `cl-canvas-${Date.now()}`;
            }
            const scrollRoot = surface.closest('.ll-cl-dnd-canvas-viewport') || surface.parentElement || surface;
            const dragApi = lc.initLlumenSurfacePlacedItemDrag({
                surfaceElement: surface,
                itemElement: node,
                scrollRootOriginElement: scrollRoot,
                getItemId: (el) => el.dataset.clDndCanvasNodeId || null,
                getDragPeers: (primary) => {
                    if (!surface.__clDndCanvasSelectionIds) {
                        surface.__clDndCanvasSelectionIds = new Set();
                    }
                    const sel = surface.__clDndCanvasSelectionIds;
                    if (!sel || sel.size === 0) return [primary];
                    const pid = primary.dataset.clDndCanvasNodeId;
                    if (!pid || !sel.has(pid)) return [primary];
                    const peers = Array.from(surface.querySelectorAll('.ll-cl-dnd-canvas-node')).filter(
                        (n) => sel.has(n.dataset.clDndCanvasNodeId)
                    );
                    return peers.length ? peers : [primary];
                },
                onDragCommit: ({ ids }) => {
                    runClDndSurfaceOverlapAvoidance(surface, node, lc, ids.length ? ids : null);
                }
            });
            node.__clDndSurfaceDragDestroy = dragApi.destroy;
        }
        if (!lc || typeof lc.initLlumenSurfaceFreeformResize !== 'function') return;
        if (node.__clDndSurfaceFreeformResizeDestroy) {
            try {
                node.__clDndSurfaceFreeformResizeDestroy();
            } catch (e) {
                /* ignore */
            }
            node.__clDndSurfaceFreeformResizeDestroy = null;
        }
        const rw = lc.initLlumenSurfaceFreeformResize({
            hostElement: surface,
            targetElement: node,
            minWidth: 96,
            minHeight: 44,
            maxWidth: Math.max(200, (surface.clientWidth || 400) - 16),
            maxHeight: Math.max(160, (surface.clientHeight || 320) - 16),
            onSizeCommit: () => {
                runClDndSurfaceOverlapAvoidance(surface, node, lc);
            }
        });
        node.__clDndSurfaceFreeformResizeDestroy = rw.destroy;
    }

    function initNestedIndexDemo(components) {
        if (!components || typeof components.initSortableList !== 'function') return;
        const root = document.getElementById('cl-dnd-nested-index');
        if (!root || root.dataset.bound) return;
        root.dataset.bound = 'true';

        const renderNestedSectionRow = (sec, chapterIdAttr) => `
                        <div class="ll-card"
                            data-sort-item-id="${sec.id}" data-section-id="${sec.id}" data-chapter-id="${chapterIdAttr}">
                            <div class="ll-card__header ll-card__header--no-border">
                                <div class="ll-card__title-section">
                                    <div class="ll-card__title-wrap">
                                        <h3 class="ll-card__title">${sec.title}</h3>
                                    </div>
                                </div>
                                <div class="ll-card__header-actions">
                                    <div class="ll-card__header-action">
                                        <div class="ll-card__header-action-content">
                                            <button type="button" class="ll-icon-btn cl-dnd-nested-section-drag" aria-label="Drag section">
                                                <span class="material-symbols-outlined ll-icon-btn__icon">drag_indicator</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;

        const state = {
            chapters: [
                {
                    id: 'ch1',
                    title: 'Chapter 1',
                    sections: [
                        { id: 'ch1-s1', title: 'Section 1.1' },
                        { id: 'ch1-s2', title: 'Section 1.2' },
                        { id: 'ch1-s3', title: 'Section 1.3' },
                        { id: 'ch1-s4', title: 'Section 1.4' }
                    ]
                },
                {
                    id: 'ch2',
                    title: 'Chapter 2',
                    sections: [
                        { id: 'ch2-s1', title: 'Section 2.1' },
                        { id: 'ch2-s2', title: 'Section 2.2' },
                        { id: 'ch2-s3', title: 'Section 2.3' },
                        { id: 'ch2-s4', title: 'Section 2.4' }
                    ]
                },
                {
                    id: 'ch3',
                    title: 'Chapter 3',
                    sections: [
                        { id: 'ch3-s1', title: 'Section 3.1' },
                        { id: 'ch3-s2', title: 'Section 3.2' },
                        { id: 'ch3-s3', title: 'Section 3.3' },
                        { id: 'ch3-s4', title: 'Section 3.4' }
                    ]
                }
            ]
        };

        let sortableDisposers = [];

        const render = () => {
            sortableDisposers.forEach((d) => {
                if (d && typeof d.destroy === 'function') d.destroy();
            });
            sortableDisposers = [];

            const chaptersHtml = state.chapters
                .map((ch) => {
                    const secHtml = ch.sections.map((sec) => renderNestedSectionRow(sec, ch.id)).join('');
                    return `
                    <div class="ll-card" data-sort-item-id="${ch.id}" data-chapter-id="${ch.id}">
                        <div class="ll-card__header">
                            <div class="ll-card__title-section">
                                <div class="ll-card__title-wrap">
                                    <h3 class="ll-card__title">${ch.title}</h3>
                                </div>
                            </div>
                            <div class="ll-card__header-actions">
                                <div class="ll-card__header-action">
                                    <div class="ll-card__header-action-content">
                                        <button type="button" class="ll-icon-btn cl-dnd-nested-chapter-drag" aria-label="Drag chapter">
                                            <span class="material-symbols-outlined ll-icon-btn__icon">drag_indicator</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="ll-card__content">
                            <div class="cl-dnd-section-list space-y-4" data-chapter-list="${ch.id}">
                                ${secHtml}
                            </div>
                        </div>
                    </div>`;
                })
                .join('');

            root.innerHTML = chaptersHtml;

            sortableDisposers.push(
                components.initSortableList({
                    container: root,
                    axis: 'vertical',
                    itemSelector: '[data-sort-item-id][data-chapter-id].ll-card',
                    handleSelector: '.cl-dnd-nested-chapter-drag',
                    getItemId: (el) => el.dataset.chapterId || el.dataset.sortItemId || '',
                    accepts: (payload, ctx, pt) => {
                        if (payload.sourceContainer !== ctx.container) return false;
                        if (pt && typeof document.elementFromPoint === 'function') {
                            const hit = document.elementFromPoint(pt.clientX, pt.clientY);
                            if (hit && hit.closest('.cl-dnd-section-list')) return false;
                        }
                        return true;
                    },
                    onReorder: (detail) => {
                        const i = state.chapters.findIndex((c) => c.id === detail.id);
                        if (i < 0) return;
                        if (i === detail.toIndex) return;
                        const [ch] = state.chapters.splice(i, 1);
                        state.chapters.splice(detail.toIndex, 0, ch);
                    }
                })
            );

            root.querySelectorAll('.cl-dnd-section-list').forEach((listEl) => {
                sortableDisposers.push(
                    components.initSortableList({
                        container: listEl,
                        axis: 'vertical',
                        itemSelector: '[data-section-id]',
                        handleSelector: '.cl-dnd-nested-section-drag',
                        getItemId: (el) => el.dataset.sectionId || '',
                        minItemsForDrag: 1,
                        accepts: (payload, ctx) => {
                            return payload.itemSelector === '[data-section-id]'
                                && ctx.itemSelector === '[data-section-id]';
                        },
                        onReorder: (detail) => {
                            const fromCid = detail.fromContainer.getAttribute('data-chapter-list');
                            const toCid = detail.toContainer.getAttribute('data-chapter-list');
                            const chapterFrom = state.chapters.find((c) => c.id === fromCid);
                            const chapterTo = state.chapters.find((c) => c.id === toCid);
                            if (!chapterFrom || !chapterTo) return;
                            const si = chapterFrom.sections.findIndex((s) => s.id === detail.id);
                            if (si < 0) return;
                            if (chapterFrom === chapterTo && si === detail.toIndex) return;
                            const [sec] = chapterFrom.sections.splice(si, 1);
                            chapterTo.sections.splice(detail.toIndex, 0, sec);
                        }
                    })
                );
            });
        };

        render();
    }

    function initSimpleListDemo(components) {
        if (!components || typeof components.initVerticalSortableList !== 'function') return;
        const list = document.getElementById('cl-dnd-simple-list');
        if (!list || list.dataset.bound) return;
        list.dataset.bound = 'true';
        const items = [
            { id: 'a', label: 'Alpha' },
            { id: 'b', label: 'Bravo' },
            { id: 'c', label: 'Charlie' },
            { id: 'd', label: 'Delta' }
        ];

        let listDisposer = null;

        const paint = () => {
            if (listDisposer && typeof listDisposer.destroy === 'function') {
                listDisposer.destroy();
            }
            listDisposer = null;
            list.innerHTML = items
                .map(
                    (it) => `
                <div class="ll-card" data-sort-item-id="${it.id}">
                    <div class="ll-card__header ll-card__header--no-border">
                        <div class="ll-card__title-section">
                            <div class="ll-card__title-wrap">
                                <h3 class="ll-card__title">${it.label}</h3>
                            </div>
                        </div>
                        <div class="ll-card__header-actions">
                            <div class="ll-card__header-action">
                                <div class="ll-card__header-action-content">
                                    <button type="button" class="ll-icon-btn" data-sort-drag aria-label="Drag ${it.label}">
                                        <span class="material-symbols-outlined ll-icon-btn__icon">drag_indicator</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
                )
                .join('');
            listDisposer = components.initVerticalSortableList({
                container: list,
                itemSelector: '[data-sort-item-id]',
                handleSelector: '[data-sort-drag]',
                getItemId: (el) => el.dataset.sortItemId || '',
                onReorder: (id, index) => {
                    const from = items.findIndex((x) => x.id === id);
                    if (from < 0) return;
                    if (from === index) return;
                    const [it] = items.splice(from, 1);
                    items.splice(index, 0, it);
                }
            });
        };
        paint();
    }

    function initHorizontalStripDemo(components) {
        if (!components || typeof components.initSortableList !== 'function') return;
        const strip = document.getElementById('cl-dnd-horizontal-strip');
        if (!strip || strip.dataset.bound) return;
        strip.dataset.bound = 'true';
        const items = [
            { id: 'cut', label: 'Cut' },
            { id: 'copy', label: 'Copy' },
            { id: 'paste', label: 'Paste' },
            { id: 'find', label: 'Find' },
            { id: 'replace', label: 'Replace' },
            { id: 'format', label: 'Format' }
        ];
        let stripDisposer = null;

        const paint = () => {
            if (stripDisposer && typeof stripDisposer.destroy === 'function') {
                stripDisposer.destroy();
            }
            stripDisposer = null;
            strip.innerHTML = items
                .map(
                    (it) => `
                <div class="ll-card shrink-0" data-sort-h-item="${it.id}">
                    <div class="ll-card__header ll-card__header--no-border">
                        <div class="ll-card__title-section">
                            <div class="ll-card__title-wrap">
                                <h3 class="ll-card__title whitespace-nowrap">${it.label}</h3>
                            </div>
                        </div>
                        <div class="ll-card__header-actions">
                            <div class="ll-card__header-action">
                                <div class="ll-card__header-action-content">
                                    <button type="button" class="ll-icon-btn" data-sort-h-drag aria-label="Drag ${it.label}">
                                        <span class="material-symbols-outlined ll-icon-btn__icon">drag_indicator</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
                )
                .join('');
            stripDisposer = components.initSortableList({
                container: strip,
                axis: 'horizontal',
                itemSelector: '[data-sort-h-item]',
                handleSelector: '[data-sort-h-drag]',
                getItemId: (el) => el.getAttribute('data-sort-h-item') || '',
                minItemsForDrag: 2,
                onReorder: (detail) => {
                    const fromIdx = items.findIndex((x) => x.id === detail.id);
                    if (fromIdx < 0) return;
                    if (fromIdx === detail.toIndex) return;
                    const [row] = items.splice(fromIdx, 1);
                    items.splice(detail.toIndex, 0, row);
                }
            });
        };
        paint();
    }

    window.setupComponentLibraryDragDropDemos = function setupComponentLibraryDragDropDemos(components, openManagedModal) {
        const tab = document.getElementById('component-library-drag-drop-tab');
        if (!tab || tab.dataset.clDndDemosBound === 'true') return;
        tab.dataset.clDndDemosBound = 'true';

        setupComponentBrowserModal(components);
        initSimpleListDemo(components);
        initNestedIndexDemo(components);
        initHorizontalStripDemo(components);
        initGridContextDemo(components);
        initRowContextDemo(components);
        if (typeof openManagedModal === 'function') {
            initCanvasContextDemo(components, openManagedModal);
        }

        if (typeof components.initializeTabs === 'function') {
            components.initializeTabs({
                tabButtonSelector: '#component-library-drag-drop-tab .ll-tab-btn[data-cl-dnd-subtab]',
                tabContentSelector: '#component-library-drag-drop-tab .cl-dnd-subtab-panel',
                tabValueDatasetKey: 'clDndSubtab',
                tabContentIdPrefix: 'cl-dnd-subtab-',
                tabContentIdSuffix: '-panel',
                activeClassName: 'll-active',
                initialTab: 'simple',
                onTabChange: () => {
                    document.querySelectorAll('#component-library-drag-drop-tab .ll-tab-btn[data-cl-dnd-subtab]').forEach((button) => {
                        const isActive = button.classList.contains('ll-active');
                        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
                    });
                }
            });
            document.querySelectorAll('#component-library-drag-drop-tab .ll-tab-btn[data-cl-dnd-subtab]').forEach((button) => {
                button.setAttribute('role', 'tab');
                button.setAttribute('aria-selected', button.classList.contains('ll-active') ? 'true' : 'false');
            });
        }

        const dragDropDemoContainer = document.getElementById('component-library-dragdrop-card-list-demo');
        if (dragDropDemoContainer && components && typeof components.renderDragDropCardList === 'function') {
            const dragDropDemoState = window.__componentLibraryDragDropDemoState || {
                cards: [
                    { id: 'dragdrop-demo-card-1', title: 'Lead Intake', description: 'Collect payload from forms and chat.' },
                    { id: 'dragdrop-demo-card-2', title: 'Validation', description: 'Validate required fields and data types.' },
                    { id: 'dragdrop-demo-card-3', title: 'Routing', description: 'Route to downstream handler by channel.' }
                ]
            };
            window.__componentLibraryDragDropDemoState = dragDropDemoState;
            const renderDragDropDemo = () => {
                components.renderDragDropCardList({
                    container: dragDropDemoContainer,
                    stateOwner: dragDropDemoState,
                    itemsKey: 'cards',
                    instanceId: 'component-library-dragdrop-demo',
                    listHeadingLabel: 'Drag & Drop Card List',
                    itemHeadingLabel: 'Card',
                    addButtonLabel: 'Add Card',
                    createItem: () => ({
                        id: `dragdrop-demo-card-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        title: 'New Card',
                        description: ''
                    }),
                    onRebuild: renderDragDropDemo,
                    renderItemContent: ({ item, itemId, bodyContainer }) => {
                        const titleInputId = `component-library-dragdrop-title-${itemId}`;
                        const descriptionInputId = `component-library-dragdrop-description-${itemId}`;
                        bodyContainer.innerHTML = `
                            <div class="ll-field-group">
                                <div class="ll-field">
                                    <div class="ll-form-control__label-row">
                                        <label for="${titleInputId}" class="ll-form-control__label">Title</label>
                                    </div>
                                    <input id="${titleInputId}" type="text" class="ll-input" placeholder="Card title">
                                </div>
                                <div class="ll-field">
                                    <div class="ll-form-control__label-row">
                                        <label for="${descriptionInputId}" class="ll-form-control__label">Description</label>
                                    </div>
                                    <div class="ll-textarea-container">
                                        <textarea id="${descriptionInputId}" rows="2" class="ll-input ll-input--textarea" placeholder="Card description"></textarea>
                                    </div>
                                </div>
                            </div>`;
                        const titleInput = document.getElementById(titleInputId);
                        const descriptionInput = document.getElementById(descriptionInputId);
                        if (titleInput) {
                            titleInput.value = String(item.title || '');
                            titleInput.addEventListener('input', () => {
                                item.title = titleInput.value;
                            });
                        }
                        if (descriptionInput) {
                            descriptionInput.value = String(item.description || '');
                            descriptionInput.addEventListener('input', () => {
                                item.description = descriptionInput.value;
                            });
                        }
                    }
                });
            };
            renderDragDropDemo();
        }
    };
})();

        function setupComponentLibraryTabsAndTogglesDemo() {
            const indentedToggle = document.getElementById('component-library-indented-toggle');
            const indentedSection = document.getElementById('component-library-indented-fields-section');
            if (indentedToggle && indentedSection && indentedToggle.dataset.indentedSectionBound !== 'true') {
                const syncIndentedSectionState = () => {
                    indentedSection.classList.toggle('hidden', !Boolean(indentedToggle.checked));
                };
                indentedToggle.addEventListener('change', syncIndentedSectionState);
                indentedToggle.dataset.indentedSectionBound = 'true';
                syncIndentedSectionState();
            }
        }

        function setupComponentLibraryHorizontalCarouselDemos(components) {
            if (!components || typeof components.initializeHorizontalCarousel !== 'function') return;

            const scrollableTabsRoot = document.getElementById('component-library-scrollable-tabs-root');
            if (scrollableTabsRoot && scrollableTabsRoot.dataset.hcScrollableTabsDemoBound !== 'true') {
                components.initializeHorizontalCarousel({
                    root: scrollableTabsRoot,
                    mode: 'tabs',
                    items: [
                        { id: 'overview', label: 'Overview' },
                        { id: 'performance', label: 'Performance' },
                        { id: 'revenue', label: 'Revenue' },
                        { id: 'acquisition', label: 'Acquisition' },
                        { id: 'retention', label: 'Retention' },
                        { id: 'campaigns', label: 'Campaigns' },
                        { id: 'roadmap', label: 'Roadmap' },
                        { id: 'experiments', label: 'Experiments' },
                        { id: 'integrations', label: 'Integrations' },
                        { id: 'forecast', label: 'Forecast' },
                        { id: 'benchmarks', label: 'Benchmarks' },
                        { id: 'exports', label: 'Exports' },
                        { id: 'goals', label: 'Goals' },
                        { id: 'attribution', label: 'Attribution' },
                        { id: 'channels', label: 'Channels' },
                        { id: 'cohorts', label: 'Cohorts' },
                        { id: 'pricing', label: 'Pricing' },
                        { id: 'churn', label: 'Churn' },
                        { id: 'upsell', label: 'Upsell' },
                        { id: 'pipeline', label: 'Pipeline' },
                        { id: 'alerts', label: 'Alerts' },
                        { id: 'audiences', label: 'Audiences' },
                        { id: 'segments', label: 'Segments' },
                        { id: 'billing', label: 'Billing' }
                    ],
                    initialActiveId: 'overview',
                    getItemId: (item) => String(item && item.id != null ? item.id : ''),
                    tabLabelKey: 'label'
                });
                scrollableTabsRoot.dataset.hcScrollableTabsDemoBound = 'true';
            }

            const tabRoot = document.getElementById('component-library-hc-tabs-root');
            const panelsHost = document.getElementById('component-library-hc-tab-panels');
            if (tabRoot && panelsHost && tabRoot.dataset.hcTabsDemoBound !== 'true') {
                const panelNodes = {};
                let activePanelId = 'alpha';
                let carouselApi = null;
                ['alpha', 'beta', 'gamma'].forEach((id) => {
                    const el = panelsHost.querySelector(`[data-hc-tab-panel="${id}"]`);
                    if (el) panelNodes[id] = el;
                });
                const ensurePanelNode = (item) => {
                    const id = String(item && item.id != null ? item.id : '').trim();
                    if (!id) return null;
                    let panel = panelNodes[id] || panelsHost.querySelector(`[data-hc-tab-panel="${id}"]`);
                    if (!panel) {
                        panel = document.createElement('div');
                        panel.dataset.hcTabPanel = id;
                        panelNodes[id] = panel;
                        panelsHost.appendChild(panel);
                    } else {
                        panelNodes[id] = panel;
                    }
                    const label = String(item && item.label != null ? item.label : id).trim() || id;
                    panel.textContent = `Panel content: ${label}`;
                    return panel;
                };
                const syncPanelsFromItems = (items, activeId) => {
                    const modelItems = Array.isArray(items) ? items : [];
                    const keep = new Set();
                    modelItems.forEach((item) => {
                        const id = String(item && item.id != null ? item.id : '').trim();
                        if (!id) return;
                        keep.add(id);
                        const panel = ensurePanelNode(item);
                        if (panel) panel.classList.toggle('hidden', id !== activeId);
                    });
                    Object.keys(panelNodes).forEach((id) => {
                        if (keep.has(id)) return;
                        const panel = panelNodes[id];
                        if (panel && panel.parentNode === panelsHost) {
                            panelsHost.removeChild(panel);
                        }
                        delete panelNodes[id];
                    });
                };
                carouselApi = components.initializeHorizontalCarousel({
                    root: tabRoot,
                    mode: 'tabs',
                    items: [
                        { id: 'alpha', label: 'Alpha' },
                        { id: 'beta', label: 'Beta' },
                        { id: 'gamma', label: 'Gamma' }
                    ],
                    initialActiveId: 'alpha',
                    tabLabelKey: 'label',
                    tabs: {
                        editable: true,
                        editMode: true,
                        defaultNewLabel: 'New tab',
                        addButtonLabel: 'Add Tab'
                    },
                    onActiveTabChange: ({ activeId }) => {
                        activePanelId = String(activeId || '');
                        const items = carouselApi && typeof carouselApi.getItems === 'function'
                            ? carouselApi.getItems()
                            : [];
                        syncPanelsFromItems(items, activePanelId);
                    },
                    onItemsChange: ({ items }) => {
                        syncPanelsFromItems(items, activePanelId);
                    }
                });
                syncPanelsFromItems(carouselApi.getItems(), activePanelId);
                tabRoot.dataset.hcTabsDemoBound = 'true';
            }

            const freeRoot = document.getElementById('component-library-hc-cards-free-root');
            if (freeRoot && freeRoot.dataset.hcCardsFreeDemoBound !== 'true') {
                const esc = (s) => String(s == null ? '' : s)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
                components.initializeHorizontalCarousel({
                    root: freeRoot,
                    mode: 'cards',
                    sizing: 'freeform',
                    items: [
                        { id: 'b1', title: 'North region' },
                        { id: 'b2', title: 'East region' },
                        { id: 'b3', title: 'South region' },
                        { id: 'b4', title: 'West region' },
                        { id: 'b5', title: 'Central region' },
                        { id: 'b6', title: 'Northeast region' },
                        { id: 'b7', title: 'Northwest region' },
                        { id: 'b8', title: 'Southeast region' },
                        { id: 'b9', title: 'Southwest region' },
                        { id: 'b10', title: 'Global region' }
                    ],
                    getItemId: (it) => String(it && it.id != null ? it.id : ''),
                    renderCard: (item) => {
                        const t = esc(item.title);
                        return `<div class="ll-card cl-carousel-demo-card-freeform"><div class="ll-card__content cl-carousel-demo-card-content"><div class="cl-carousel-demo-card-title">${t}</div><div class="cl-carousel-demo-card-meta">Freeform-width card slot</div></div></div>`;
                    }
                });
                freeRoot.dataset.hcCardsFreeDemoBound = 'true';
            }

            const gridRoot = document.getElementById('component-library-hc-cards-grid-root');
            if (gridRoot && gridRoot.dataset.hcCardsGridDemoBound !== 'true') {
                components.initializeHorizontalCarousel({
                    root: gridRoot,
                    mode: 'cards',
                    sizing: 'grid',
                    gridColumns: 4,
                    gridGap: 6,
                    items: [
                        { id: 's1' },
                        { id: 's2' },
                        { id: 's3' },
                        { id: 's4' },
                        { id: 's5' },
                        { id: 's6' },
                        { id: 's7' },
                        { id: 's8' },
                        { id: 's9' },
                        { id: 's10' },
                        { id: 's11' },
                        { id: 's12' }
                    ],
                    getItemId: (it) => String(it && it.id != null ? it.id : ''),
                    renderCard: (_item, ctx) => {
                        const n = (ctx && Number.isFinite(ctx.index) ? ctx.index : 0) + 1;
                        return `<div class="ll-card cl-carousel-demo-card-grid"><div class="ll-card__content cl-carousel-demo-card-content--compact"><div class="cl-carousel-demo-card-title">Card ${n}</div></div></div>`;
                    }
                });
                gridRoot.dataset.hcCardsGridDemoBound = 'true';
            }

            const grid6Root = document.getElementById('component-library-hc-cards-grid-6-root');
            if (grid6Root && grid6Root.dataset.hcCardsGridDemoBound !== 'true') {
                components.initializeHorizontalCarousel({
                    root: grid6Root,
                    mode: 'cards',
                    sizing: 'grid',
                    gridColumns: 6,
                    gridGap: 6,
                    items: [
                        { id: 'g1' },
                        { id: 'g2' },
                        { id: 'g3' },
                        { id: 'g4' },
                        { id: 'g5' },
                        { id: 'g6' },
                        { id: 'g7' },
                        { id: 'g8' },
                        { id: 'g9' },
                        { id: 'g10' },
                        { id: 'g11' },
                        { id: 'g12' }
                    ],
                    getItemId: (it) => String(it && it.id != null ? it.id : ''),
                    renderCard: (_item, ctx) => {
                        const n = (ctx && Number.isFinite(ctx.index) ? ctx.index : 0) + 1;
                        return `<div class="ll-card cl-carousel-demo-card-grid"><div class="ll-card__content cl-carousel-demo-card-content--compact"><div class="cl-carousel-demo-card-title">Card ${n}</div></div></div>`;
                    }
                });
                grid6Root.dataset.hcCardsGridDemoBound = 'true';
            }
        }

        function setupComponentLibraryTooltipDemos(components) {
            [
                { id: 'component-library-tooltip-hover-top', contentHtml: '<strong>Top</strong><div class="mt-1 text-gray-300">Hover trigger, position: top, offset: 8px</div>', position: 'top', offset: 8 },
                { id: 'component-library-tooltip-hover-left', contentHtml: '<strong>Left</strong><div class="mt-1 text-gray-300">Hover trigger, position: left, offset: 8px</div>', position: 'left', offset: 8 },
                { id: 'component-library-tooltip-hover-right', contentHtml: '<strong>Right</strong><div class="mt-1 text-gray-300">Hover trigger, position: right, offset: 8px</div>', position: 'right', offset: 8 },
                { id: 'component-library-tooltip-hover-bottom', contentHtml: '<strong>Bottom</strong><div class="mt-1 text-gray-300">Hover trigger, position: bottom, offset: 8px</div>', position: 'bottom', offset: 8 },
                { id: 'component-library-tooltip-click-top', contentHtml: '<strong>Top</strong><div class="mt-1 text-gray-300">Click trigger, position: top, offset: 8px</div>', position: 'top', offset: 8, trigger: 'click' },
                { id: 'component-library-tooltip-click-left', contentHtml: '<strong>Left</strong><div class="mt-1 text-gray-300">Click trigger, position: left, offset: 8px</div>', position: 'left', offset: 8, trigger: 'click' },
                { id: 'component-library-tooltip-click-right', contentHtml: '<strong>Right</strong><div class="mt-1 text-gray-300">Click trigger, position: right, offset: 8px</div>', position: 'right', offset: 8, trigger: 'click' },
                { id: 'component-library-tooltip-click-bottom', contentHtml: '<strong>Bottom</strong><div class="mt-1 text-gray-300">Click trigger, position: bottom, offset: 8px</div>', position: 'bottom', offset: 8, trigger: 'click' }
            ].forEach((config) => {
                const button = document.getElementById(config.id);
                if (button) components.bindCustomTooltip(button, config);
            });
        }

        function setupComponentLibrarySpinnerDemos(components) {
            const spinnerDemoPairs = [
                {
                    startButtonId: 'component-library-spinner-loading-btn-default',
                    stopButtonId: 'component-library-spinner-stop-btn-default'
                },
                {
                    startButtonId: 'component-library-spinner-loading-btn-sm',
                    stopButtonId: 'component-library-spinner-stop-btn-sm'
                }
            ];

            spinnerDemoPairs.forEach(({ startButtonId, stopButtonId }) => {
                const startButton = document.getElementById(startButtonId);
                const stopButton = document.getElementById(stopButtonId);
                if (!startButton || !stopButton) return;
                if (startButton.dataset.spinnerDemoBound === 'true') return;

                startButton.addEventListener('click', () => {
                    components.setButtonLoadingState(startButton);
                    stopButton.classList.remove('hidden');
                });

                stopButton.addEventListener('click', () => {
                    components.clearButtonLoadingState(startButton);
                    stopButton.classList.add('hidden');
                });

                startButton.dataset.spinnerDemoBound = 'true';
            });
        }

        function setupComponentLibraryAlertDemos(components) {
            const alertsTab = document.getElementById('component-library-alert-tab');
            if (!alertsTab) return;
            if (alertsTab.dataset.alertDemosBound === 'true') return;

            components.initializeDismissibleAlerts(alertsTab);

            const resetButton = document.getElementById('component-library-alerts-reset');
            if (resetButton) {
                resetButton.addEventListener('click', () => {
                    alertsTab.querySelectorAll('.ll-alert.hidden').forEach((alertElement) => {
                        alertElement.classList.remove('hidden');
                        alertElement.removeAttribute('aria-hidden');
                    });
                });
            }

            alertsTab.dataset.alertDemosBound = 'true';
        }

        function setupComponentLibraryToastDemos(components) {
            const toastTab = document.getElementById('component-library-toast-tab');
            if (!toastTab) return;
            if (toastTab.dataset.toastDemosBound === 'true') return;

            const bindToastDemoButton = (buttonId, handler) => {
                const button = document.getElementById(buttonId);
                if (!button) return;
                button.addEventListener('click', handler);
            };

            bindToastDemoButton('component-library-toast-info', () => {
                components.createToast({
                    state: 'info',
                    title: 'Info',
                    message: 'This is an informational toast message.'
                });
            });
            bindToastDemoButton('component-library-toast-positive', () => {
                components.createToast({
                    state: 'positive',
                    title: 'Success',
                    message: 'Changes saved successfully.'
                });
            });
            bindToastDemoButton('component-library-toast-warning', () => {
                components.createToast({
                    state: 'warning',
                    title: 'Warning',
                    message: 'Some fields may require additional review.'
                });
            });
            bindToastDemoButton('component-library-toast-negative', () => {
                components.createToast({
                    state: 'negative',
                    title: 'Error',
                    message: 'Unable to complete this action.'
                });
            });
            bindToastDemoButton('component-library-toast-loading', () => {
                components.createToast({
                    state: 'loading',
                    title: 'Syncing',
                    message: 'Sync in progress. Dismiss when ready.',
                    persistent: true
                });
            });
            bindToastDemoButton('component-library-toast-persistent', () => {
                components.createToast({
                    state: 'info',
                    title: 'Persistent Message',
                    message: 'This toast does not auto-dismiss.',
                    persistent: true
                });
            });

            const positionButtons = [
                { id: 'component-library-toast-top-left', position: 'top-left', label: 'Top Left' },
                { id: 'component-library-toast-top-center', position: 'top-center', label: 'Top Center' },
                { id: 'component-library-toast-top-right', position: 'top-right', label: 'Top Right' },
                { id: 'component-library-toast-bottom-left', position: 'bottom-left', label: 'Bottom Left' },
                { id: 'component-library-toast-bottom-center', position: 'bottom-center', label: 'Bottom Center' },
                { id: 'component-library-toast-bottom-right', position: 'bottom-right', label: 'Bottom Right' }
            ];
            positionButtons.forEach(({ id, position, label }) => {
                bindToastDemoButton(id, () => {
                    components.createToast({
                        state: 'info',
                        position,
                        title: `${label} Queue`,
                        message: 'Queued in this position container.'
                    });
                });
            });

            bindToastDemoButton('component-library-toast-promise-success', () => {
                components.createPromiseToast(
                    new Promise((resolve) => {
                        window.setTimeout(() => resolve({ requestId: Date.now() }), 3000);
                    }),
                    {
                        loading: {
                            title: 'Saving',
                            message: 'Saving your changes...'
                        },
                        success: () => ({
                            title: 'Saved',
                            message: 'Changes saved successfully.',
                            state: 'positive'
                        })
                    }
                );
            });
            bindToastDemoButton('component-library-toast-promise-error', () => {
                components.createPromiseToast(
                    new Promise((_resolve, reject) => {
                        window.setTimeout(() => reject(new Error('Request failed')), 3000);
                    }).catch((error) => {
                        throw error;
                    }),
                    {
                        loading: {
                            title: 'Publishing',
                            message: 'Publishing update...'
                        },
                        error: () => ({
                            title: 'Publish Failed',
                            message: 'The API request failed. Please retry.',
                            state: 'negative'
                        })
                    }
                ).catch(() => {
                    // Swallow demo rejection so console stays clean during showcase.
                });
            });

            toastTab.dataset.toastDemosBound = 'true';
        }

        function createComponentLibraryManagedModalOpener(components) {
            return (config) => {
                const userOnClose = config && typeof config.onClose === 'function' ? config.onClose : null;
                return components.initializeModal({
                    ...config,
                    onClose: (context) => {
                        if (userOnClose) userOnClose(context);
                        if (context && context.controller && typeof context.controller.destroy === 'function') {
                            context.controller.destroy();
                        }
                    }
                });
            };
        }

        function setupComponentLibraryModalDemos(components, openManagedModal) {
            const modalsTab = document.getElementById('component-library-modal-tab');
            if (!modalsTab || modalsTab.dataset.modalDemosBound === 'true') return;

            const buildSampleBody = (titleText) => `
                <div class="ll-field-group">
                    <div class="ll-field">
                        <div class="ll-form-control__label-row">
                            <label class="ll-form-control__label">${titleText}</label>
                        </div>
                        <input type="text" class="ll-input" placeholder="Enter value" autofocus>
                    </div>
                    <div class="ll-field">
                        <div class="ll-form-control__label-row">
                            <label class="ll-form-control__label">Description</label>
                        </div>
                        <div class="ll-textarea-container">
                            <textarea rows="4" class="ll-input ll-input--textarea" placeholder="Add details"></textarea>
                        </div>
                    </div>
                </div>
            `;

            const bindClick = (buttonId, handler) => {
                const button = document.getElementById(buttonId);
                if (!button) return;
                button.addEventListener('click', handler);
            };

            bindClick('component-library-modal-open-default', () => {
                const modalActionsButtonId = `component-library-modal-actions-btn-${Date.now()}`;
                const modalActionsMenuId = `component-library-modal-actions-menu-${Date.now()}`;
                const modalRunActionId = `component-library-modal-run-action-${Date.now()}`;
                openManagedModal({
                    title: 'Edit Content',
                    titleIcon: 'edit_square',
                    position: 'top',
                    width: '40rem',
                    headerActions: [
                        `<button id="${modalRunActionId}" type="button" class="ll-btn ll-btn--sm ll-btn--primary">Execute</button>`,
                        `
                            <button id="${modalActionsButtonId}" type="button" class="ll-icon-btn" aria-label="Modal actions">
                                <span class="material-symbols-outlined ll-icon-btn__icon">more_vert</span>
                            </button>
                            <div id="${modalActionsMenuId}" class="hidden">
                                <a href="#" class="ll-dropdown__item" data-value="configure">Configure</a>
                                <a href="#" class="ll-dropdown__item" data-value="duplicate">Duplicate</a>
                                <a href="#" class="ll-dropdown__item" data-value="delete">Delete</a>
                            </div>
                        `
                    ],
                    bodyContent: buildSampleBody('Content Name'),
                    footerContent: `
                        <button type="button" class="ll-btn ll-btn--flat-default" data-ll-demo-modal-close>Cancel</button>
                        <button type="button" class="ll-btn ll-btn--primary" data-ll-demo-modal-close>Save</button>
                    `,
                    onOpen: ({ controller }) => {
                        const runButton = controller.headerActionsSlot.querySelector(`#${modalRunActionId}`);
                        if (runButton && runButton.dataset.modalRunActionBound !== 'true') {
                            runButton.addEventListener('click', () => {
                                const feedback = components.initializeAlertDialog({
                                    title: 'Run Action',
                                    bodyContent: 'Run action clicked from injected header actions.'
                                });
                                const originalOnClose = feedback.options.onClose;
                                feedback.options.onClose = (context) => {
                                    if (typeof originalOnClose === 'function') originalOnClose(context);
                                    context.controller.destroy();
                                };
                            });
                            runButton.dataset.modalRunActionBound = 'true';
                        }
                        components.initializePortaledDropdown({
                            buttonId: modalActionsButtonId,
                            menuId: modalActionsMenuId,
                            datasetFlag: 'modalActionsDropdownBound',
                            align: 'right',
                            matchTriggerWidth: false
                        });
                        controller.root.querySelectorAll(`#${modalActionsMenuId} [data-value]`).forEach((item) => {
                            if (item.dataset.modalActionBound === 'true') return;
                            item.addEventListener('click', (event) => {
                                event.preventDefault();
                            });
                            item.dataset.modalActionBound = 'true';
                        });
                        controller.footer.querySelectorAll('[data-ll-demo-modal-close]').forEach((button) => {
                            button.addEventListener('click', () => controller.close('footer-action'));
                        });
                    }
                });
            });

            bindClick('component-library-modal-open-custom-width', () => {
                openManagedModal({
                    title: 'Configure Workspace',
                    titleIcon: 'tune',
                    width: '56rem',
                    bodyContent: buildSampleBody('Workspace Name')
                });
            });

            bindClick('component-library-modal-open-full-width', () => {
                openManagedModal({
                    title: 'Full Width Modal',
                    titleIcon: 'width_full',
                    width: 'full-width',
                    bodyContent: '<div class="ll-alert ll-alert--warning">This modal content spans the available width.</div>'
                });
            });

            bindClick('component-library-modal-open-full-height', () => {
                openManagedModal({
                    title: 'Full Height Modal',
                    titleIcon: 'fit_screen',
                    width: '40rem',
                    fullHeight: true,
                    bodyContent: buildSampleBody('Full Height Configuration')
                });
            });

            bindClick('component-library-modal-open-pos-top', () => {
                openManagedModal({ title: 'Top Position', position: 'top', bodyContent: buildSampleBody('Top Positioned Modal') });
            });
            bindClick('component-library-modal-open-pos-left', () => {
                openManagedModal({ title: 'Left Position', position: 'left', fullHeight: true, width: '30rem', bodyContent: buildSampleBody('Left Drawer Style') });
            });
            bindClick('component-library-modal-open-pos-right', () => {
                openManagedModal({ title: 'Right Position', position: 'right', fullHeight: true, width: '30rem', bodyContent: buildSampleBody('Right Drawer Style') });
            });
            bindClick('component-library-modal-open-pos-bottom', () => {
                openManagedModal({ title: 'Bottom Position', position: 'bottom', width: '48rem', bodyContent: buildSampleBody('Bottom Positioned Modal') });
            });
            bindClick('component-library-modal-open-pos-center', () => {
                openManagedModal({ title: 'Center Position', position: 'center', width: '40rem', bodyContent: buildSampleBody('Center Positioned Modal') });
            });

            bindClick('component-library-modal-open-mode-normal', () => {
                openManagedModal({
                    title: 'Normal Mode Modal',
                    mode: 'normal',
                    bodyContent: '<p class="text-sm text-gray-300">Dismissable by backdrop click or ESC key.</p>'
                });
            });
            bindClick('component-library-modal-open-mode-persistent', () => {
                openManagedModal({
                    title: 'Persistent Mode Modal',
                    mode: 'persistent',
                    bodyContent: '<p class="text-sm text-gray-300">Not dismissable by backdrop click or ESC key.</p>',
                    footerContent: '<button type="button" class="ll-btn ll-btn--primary" data-ll-demo-modal-close>Close</button>',
                    onOpen: ({ controller }) => {
                        const closeButton = controller.footer.querySelector('[data-ll-demo-modal-close]');
                        if (closeButton) closeButton.addEventListener('click', () => controller.close('footer-action'));
                    }
                });
            });
            bindClick('component-library-modal-open-mode-seamless', () => {
                openManagedModal({
                    title: 'Seamless Mode Modal',
                    mode: 'seamless',
                    position: 'right',
                    width: '26rem',
                    fullHeight: true,
                    top: 'var(--ll-app-header-height)',
                    bodyContent: buildSampleBody('Seamless Drawer')
                });
            });
            bindClick('component-library-modal-open-scroll-lock-on', () => {
                openManagedModal({
                    title: 'Body Scroll Lock Enabled',
                    mode: 'normal',
                    lockBodyScroll: true,
                    bodyContent: `
                        <div class="ll-field-group">
                            <div class="ll-alert ll-alert--positive">This modal enables viewport/body scroll lock.</div>
                            <p class="ll-form-control__hint">Try scrolling the page behind the modal; background scroll should stay locked.</p>
                        </div>
                    `,
                    footerContent: '<button type="button" class="ll-btn ll-btn--primary" data-ll-demo-modal-close>Close</button>',
                    onOpen: ({ controller }) => {
                        const closeButton = controller.footer.querySelector('[data-ll-demo-modal-close]');
                        if (closeButton) closeButton.addEventListener('click', () => controller.close('footer-action'));
                    }
                });
            });
            bindClick('component-library-modal-open-scroll-lock-off', () => {
                openManagedModal({
                    title: 'Body Scroll Lock Disabled',
                    mode: 'normal',
                    lockBodyScroll: false,
                    bodyContent: `
                        <div class="ll-field-group">
                            <div class="ll-alert ll-alert--warning">This modal disables viewport/body scroll lock.</div>
                            <p class="ll-form-control__hint">Try scrolling the page behind the modal; background scroll should remain available.</p>
                        </div>
                    `,
                    footerContent: '<button type="button" class="ll-btn ll-btn--primary" data-ll-demo-modal-close>Close</button>',
                    onOpen: ({ controller }) => {
                        const closeButton = controller.footer.querySelector('[data-ll-demo-modal-close]');
                        if (closeButton) closeButton.addEventListener('click', () => controller.close('footer-action'));
                    }
                });
            });

            bindClick('component-library-modal-open-navigation', () => {
                const searchInputId = `component-library-modal-nav-search-${Date.now()}`;
                const searchClearId = `component-library-modal-nav-search-clear-${Date.now()}`;
                const listContainerId = `component-library-modal-nav-list-${Date.now()}`;
                const nodeCatalog = [
                    { category: 'Triggers', name: 'Manual Trigger', description: 'Start manually from the workflow listing.' },
                    { category: 'Triggers', name: 'Webhook Trigger', description: 'Start execution from an incoming webhook.' },
                    { category: 'Data & Flow', name: 'If / Else', description: 'Branch execution based on a condition.' },
                    { category: 'Data & Flow', name: 'Edit Fields', description: 'Transform incoming fields and values.' },
                    { category: 'Analysis Agents', name: 'General Agent', description: 'Perform broad reasoning tasks.' },
                    { category: 'Analysis Agents', name: 'Insight Generator Agent', description: 'Generate insights from data patterns.' },
                    { category: 'Actions', name: 'Send Chat Message', description: 'Send a message back to chat.' }
                ];
                const categoryDescriptions = {
                    'Triggers': 'Initiate workflow execution from a start point.',
                    'Data & Flow': 'Fetch, transform, and route data through the workflow.',
                    'Analysis Agents': 'Run AI-powered reasoning and enrichment.',
                    'Actions': 'Execute side effects such as messaging and notifications.'
                };

                const navigationModal = openManagedModal({
                    title: 'Add Node',
                    mode: 'seamless',
                    position: 'right',
                    width: '26rem',
                    fullHeight: true,
                    compactPadding: true,
                    top: 'var(--ll-app-header-height)',
                    bodyPadding: false,
                    bodyContent: `
                        <div class="p-4 border-b border-gray-700">
                            <div class="ll-input-with-left-icon">
                                <div class="ll-input-with-left-icon__left ll-input-with-left-icon__icon">
                                    <span class="material-symbols-outlined">search</span>
                                </div>
                                <input id="${searchInputId}" type="text" class="ll-input ll-input--search ll-input-with-left-icon__input" placeholder="Search nodes..." autofocus>
                            </div>
                        </div>
                        <div id="${listContainerId}" class="p-4 space-y-3"></div>
                    `
                });

                const searchInput = navigationModal.body.querySelector(`#${searchInputId}`);
                const listContainer = navigationModal.body.querySelector(`#${listContainerId}`);
                if (!searchInput || !listContainer) return;

                let activeCategory = null;
                let activeQuery = '';

                const setHeaderState = () => {
                    const hasSearch = Boolean(activeQuery.trim());
                    if (hasSearch) {
                        navigationModal.setTitle('Search Results');
                    } else if (activeCategory) {
                        navigationModal.setTitle(activeCategory);
                    } else {
                        navigationModal.setTitle('Add Node');
                    }

                    const shouldShowBack = hasSearch || Boolean(activeCategory);
                    navigationModal.setBackButton(shouldShowBack ? {
                        visible: true,
                        ariaLabel: 'Back',
                        onClick: () => {
                            if (activeQuery.trim()) {
                                activeQuery = '';
                                searchInput.value = '';
                                renderList('ll-modal__body-anim-fade-in');
                                return;
                            }
                            if (activeCategory) {
                                activeCategory = null;
                                renderList('ll-modal__body-anim-slide-in-left');
                            }
                        }
                    } : null);
                };

                const renderCategoryButtons = () => {
                    const categories = Array.from(new Set(nodeCatalog.map((entry) => entry.category)));
                    listContainer.innerHTML = categories.map((category) => `
                        <button type="button" class="ll-block-link" data-modal-nav-category="${category}">
                            <div class="ll-block-link__main">
                                <div class="ll-block-link__body">
                                    <div class="ll-block-link__title">${category}</div>
                                    <div class="ll-block-link__description">${categoryDescriptions[category] || ''}</div>
                                </div>
                            </div>
                            <span class="material-symbols-outlined ll-block-link__chevron">chevron_right</span>
                        </button>
                    `).join('');
                    listContainer.querySelectorAll('[data-modal-nav-category]').forEach((button) => {
                        if (button.dataset.modalNavBound === 'true') return;
                        button.addEventListener('click', () => {
                            activeCategory = String(button.getAttribute('data-modal-nav-category') || '');
                            renderList('ll-modal__body-anim-slide-in-right');
                        });
                        button.dataset.modalNavBound = 'true';
                    });
                };

                const renderNodeButtons = (nodes) => {
                    if (nodes.length === 0) {
                        listContainer.innerHTML = '<div class="text-sm text-gray-400">No nodes match this search.</div>';
                        return;
                    }
                    listContainer.innerHTML = nodes.map((node) => `
                        <button type="button" class="ll-block-link">
                            <div class="ll-block-link__main">
                                <div class="ll-block-link__body">
                                    <div class="ll-block-link__title">${node.name}</div>
                                    <div class="ll-block-link__description">${node.description}</div>
                                </div>
                            </div>
                        </button>
                    `).join('');
                };

                const renderList = (animationClassName = 'll-modal__body-anim-fade-in') => {
                    const query = activeQuery.trim().toLowerCase();
                    if (query) {
                        const searchResults = nodeCatalog.filter((node) => {
                            return node.name.toLowerCase().includes(query) || node.description.toLowerCase().includes(query);
                        });
                        renderNodeButtons(searchResults);
                    } else if (activeCategory) {
                        renderNodeButtons(nodeCatalog.filter((node) => node.category === activeCategory));
                    } else {
                        renderCategoryButtons();
                    }
                    setHeaderState();
                    navigationModal.animateContent(listContainer, animationClassName);
                };

                components.initializeSearchInput(searchInputId, {
                    clearButtonId: searchClearId,
                    datasetFlag: 'modalNavSearchBound',
                    onInput: () => {
                        activeQuery = searchInput.value;
                        renderList('ll-modal__body-anim-fade-in');
                    }
                });

                renderList('ll-modal__body-anim-fade-in');
            });

            bindClick('component-library-modal-open-multistep-flow', () => {
                const stepTabsId = `component-library-modal-step-tabs-${Date.now()}`;
                const stepPanelsId = `component-library-modal-step-panels-${Date.now()}`;
                const stepOnePanelId = `component-library-modal-step-one-${Date.now()}`;
                const stepTwoPanelId = `component-library-modal-step-two-${Date.now()}`;
                const stepThreePanelId = `component-library-modal-step-three-${Date.now()}`;
                const stepPrevButtonId = `component-library-modal-step-prev-${Date.now()}`;
                const stepCancelButtonId = `component-library-modal-step-cancel-${Date.now()}`;
                const stepNextButtonId = `component-library-modal-step-next-${Date.now()}`;
                const stepCreateButtonId = `component-library-modal-step-create-${Date.now()}`;

                const stepFlowModal = openManagedModal({
                    title: 'Create Content',
                    width: '44rem',
                    bodyPadding: false,
                    bodyContent: `
                        <div>
                            <div id="${stepTabsId}" class="ll-tab-nav ll-tab-nav--stepped border-b border-gray-700 px-6">
                                <button type="button" class="ll-tab-btn ll-tab-btn--stepped ll-active" data-step-index="0" data-step-number="1">Workspace</button>
                                <button type="button" class="ll-tab-btn ll-tab-btn--stepped" data-step-index="1" data-step-number="2" disabled>Configuration</button>
                                <button type="button" class="ll-tab-btn ll-tab-btn--stepped" data-step-index="2" data-step-number="3" disabled>Review</button>
                            </div>
                            <div id="${stepPanelsId}" class="p-6 space-y-0">
                                <div id="${stepOnePanelId}" class="space-y-4">
                                    <div class="text-sm text-gray-300">Step 1: Select a workspace to continue.</div>
                                    <div class="ll-block-links">
                                        <button type="button" class="ll-block-link" data-step-one-selection="Private Workspace">
                                            <div class="ll-block-link__main">
                                                <span class="material-symbols-outlined ll-block-link__icon">lock</span>
                                                <div class="ll-block-link__body">
                                                    <div class="ll-block-link__title">Private Workspace</div>
                                                    <div class="ll-block-link__description">Only visible to your team.</div>
                                                </div>
                                            </div>
                                            <span class="material-symbols-outlined ll-block-link__chevron">chevron_right</span>
                                        </button>
                                        <button type="button" class="ll-block-link" data-step-one-selection="Shared Workspace">
                                            <div class="ll-block-link__main">
                                                <span class="material-symbols-outlined ll-block-link__icon">groups</span>
                                                <div class="ll-block-link__body">
                                                    <div class="ll-block-link__title">Shared Workspace</div>
                                                    <div class="ll-block-link__description">Collaborative content and permissions.</div>
                                                </div>
                                            </div>
                                            <span class="material-symbols-outlined ll-block-link__chevron">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                                <div id="${stepTwoPanelId}" class="space-y-4 hidden">
                                    <div class="text-sm text-gray-300">Step 2: Configure basic details.</div>
                                    <div class="ll-field">
                                        <div class="ll-form-control__label-row">
                                            <label class="ll-form-control__label">Content Name</label>
                                        </div>
                                        <input type="text" class="ll-input" placeholder="Enter content name">
                                    </div>
                                    <div class="ll-field">
                                        <div class="ll-form-control__label-row">
                                            <label class="ll-form-control__label">Description</label>
                                        </div>
                                        <div class="ll-textarea-container">
                                            <textarea rows="3" class="ll-input ll-input--textarea" placeholder="Add description"></textarea>
                                        </div>
                                    </div>
                                </div>
                                <div id="${stepThreePanelId}" class="space-y-4 hidden">
                                    <div class="text-sm text-gray-300">Step 3: Review and create.</div>
                                    <div class="ll-alert ll-alert--info">
                                        <span class="material-symbols-outlined ll-alert__icon">info</span>
                                        <div class="ll-alert__content">
                                            <span class="ll-alert__title">Ready to Create</span>
                                            Final step is now enabled after completing previous steps.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `,
                    footerContent: {
                        layout: 'spread',
                        actions: {
                            start: `<button id="${stepPrevButtonId}" type="button" class="ll-btn ll-btn--default hidden">Previous</button>`,
                            end: `
                                <button id="${stepCancelButtonId}" type="button" class="ll-btn ll-btn--default">Cancel</button>
                                <button id="${stepNextButtonId}" type="button" class="ll-btn ll-btn--primary hidden">Next</button>
                                <button id="${stepCreateButtonId}" type="button" class="ll-btn ll-btn--primary hidden">Create</button>
                            `
                        }
                    },
                    onOpen: ({ controller }) => {
                        const tabsContainer = controller.body.querySelector(`#${stepTabsId}`);
                        const panelsContainer = controller.body.querySelector(`#${stepPanelsId}`);
                        const stepPanels = [
                            controller.body.querySelector(`#${stepOnePanelId}`),
                            controller.body.querySelector(`#${stepTwoPanelId}`),
                            controller.body.querySelector(`#${stepThreePanelId}`)
                        ];
                        const stepButtons = tabsContainer ? Array.from(tabsContainer.querySelectorAll('[data-step-index]')) : [];
                        const previousButton = controller.footer ? controller.footer.querySelector(`#${stepPrevButtonId}`) : null;
                        const cancelButton = controller.footer ? controller.footer.querySelector(`#${stepCancelButtonId}`) : null;
                        const nextButton = controller.footer ? controller.footer.querySelector(`#${stepNextButtonId}`) : null;
                        const createButton = controller.footer ? controller.footer.querySelector(`#${stepCreateButtonId}`) : null;
                        const stepOneSelections = controller.body.querySelectorAll('[data-step-one-selection]');
                        let highestEnabledStep = 0;
                        let activeStep = 0;

                        const syncState = () => {
                            stepButtons.forEach((button, index) => {
                                const isEnabled = index <= highestEnabledStep;
                                const isActive = index === activeStep;
                                button.disabled = !isEnabled;
                                button.classList.toggle('opacity-50', !isEnabled);
                                button.classList.toggle('cursor-not-allowed', !isEnabled);
                                button.classList.toggle('ll-active', isActive);
                            });
                            if (previousButton) {
                                previousButton.classList.toggle('hidden', activeStep === 0);
                            }
                            if (cancelButton) {
                                cancelButton.classList.toggle('hidden', activeStep !== 0);
                            }
                            if (nextButton) {
                                nextButton.classList.toggle('hidden', activeStep === 0 || activeStep >= 2);
                            }
                            if (createButton) {
                                createButton.classList.toggle('hidden', activeStep !== 2);
                            }
                        };

                        const showStep = (nextStep, animationClassName) => {
                            if (nextStep < 0 || nextStep > highestEnabledStep) return;
                            stepPanels.forEach((panel, panelIndex) => {
                                if (!panel) return;
                                panel.classList.toggle('hidden', panelIndex !== nextStep);
                            });
                            activeStep = nextStep;
                            syncState();
                            if (panelsContainer) {
                                controller.animateContent(panelsContainer, animationClassName);
                            }
                        };

                        stepButtons.forEach((button) => {
                            if (button.dataset.multistepTabBound === 'true') return;
                            button.addEventListener('click', () => {
                                if (button.disabled) return;
                                const nextStep = Number(button.getAttribute('data-step-index'));
                                if (!Number.isFinite(nextStep)) return;
                                const animationClassName = nextStep > activeStep
                                    ? 'll-modal__body-anim-slide-in-right'
                                    : 'll-modal__body-anim-slide-in-left';
                                showStep(nextStep, animationClassName);
                            });
                            button.dataset.multistepTabBound = 'true';
                        });

                        stepOneSelections.forEach((selectionButton) => {
                            if (selectionButton.dataset.multistepSelectionBound === 'true') return;
                            selectionButton.addEventListener('click', () => {
                                highestEnabledStep = Math.max(highestEnabledStep, 1);
                                showStep(1, 'll-modal__body-anim-slide-in-right');
                            });
                            selectionButton.dataset.multistepSelectionBound = 'true';
                        });

                        if (previousButton && previousButton.dataset.multistepPrevBound !== 'true') {
                            previousButton.addEventListener('click', () => {
                                if (activeStep <= 0) return;
                                showStep(activeStep - 1, 'll-modal__body-anim-slide-in-left');
                            });
                            previousButton.dataset.multistepPrevBound = 'true';
                        }

                        if (cancelButton && cancelButton.dataset.multistepCancelBound !== 'true') {
                            cancelButton.addEventListener('click', () => controller.close('cancel'));
                            cancelButton.dataset.multistepCancelBound = 'true';
                        }
                        if (nextButton && nextButton.dataset.multistepNextBound !== 'true') {
                            nextButton.addEventListener('click', () => {
                                if (activeStep === 1) {
                                    highestEnabledStep = Math.max(highestEnabledStep, 2);
                                    showStep(2, 'll-modal__body-anim-slide-in-right');
                                    return;
                                }
                                if (activeStep < highestEnabledStep) {
                                    showStep(activeStep + 1, 'll-modal__body-anim-slide-in-right');
                                }
                            });
                            nextButton.dataset.multistepNextBound = 'true';
                        }
                        if (createButton && createButton.dataset.multistepCreateBound !== 'true') {
                            createButton.addEventListener('click', () => controller.close('create'));
                            createButton.dataset.multistepCreateBound = 'true';
                        }

                        syncState();
                        showStep(0, 'll-modal__body-anim-fade-in');
                    }
                });
            });

            bindClick('component-library-modal-open-footer-with-content', () => {
                openManagedModal({
                    title: 'Footer Content + Actions',
                    titleIcon: 'info',
                    width: '44rem',
                    bodyContent: '<p class="text-sm text-gray-300">This example shows non-action footer content on the left and grouped actions on the right.</p>',
                    footerContent: {
                        nonActionContent: '<span class="text-xs text-gray-400">Autosave every 30 seconds</span>',
                        actions: `
                            <button type="button" class="ll-btn ll-btn--flat-default" data-ll-demo-modal-close>Cancel</button>
                            <button type="button" class="ll-btn ll-btn--primary" data-ll-demo-modal-close>Continue</button>
                        `
                    },
                    onOpen: ({ controller }) => {
                        controller.footer.querySelectorAll('[data-ll-demo-modal-close]').forEach((button) => {
                            button.addEventListener('click', () => controller.close('footer-action'));
                        });
                    }
                });
            });

            bindClick('component-library-modal-open-alert-dialog', () => {
                const controller = components.initializeAlertDialog({
                    title: 'Alert Dialog',
                    titleIcon: 'info',
                    bodyContent: 'This is a reusable alert dialog using the modal initializer.'
                });
                const onClose = controller.options.onClose;
                controller.options.onClose = (context) => {
                    if (typeof onClose === 'function') onClose(context);
                    context.controller.destroy();
                };
            });

            bindClick('component-library-modal-open-alert-persistent-dialog', () => {
                const controller = components.initializeAlertDialog({
                    title: 'Persistent Alert Dialog',
                    titleIcon: 'warning',
                    persistent: true,
                    bodyContent: 'This alert dialog is persistent and closes only with the OK button.'
                });
                const onClose = controller.options.onClose;
                controller.options.onClose = (context) => {
                    if (typeof onClose === 'function') onClose(context);
                    context.controller.destroy();
                };
            });

            bindClick('component-library-modal-open-confirmation-dialog', () => {
                const controller = components.initializeConfirmationDialog({
                    title: 'Delete Item?',
                    titleIcon: 'delete',
                    bodyContent: 'Do you want to delete this item? This action cannot be undone.',
                    cancelLabel: 'Cancel',
                    confirmLabel: 'Yes',
                    onCancel: () => {
                        components.createToast({
                            state: 'info',
                            title: 'Decision',
                            message: 'You canceled this action.'
                        });
                    },
                    onConfirm: () => {
                        components.createToast({
                            state: 'positive',
                            title: 'Decision',
                            message: 'You confirmed this action.'
                        });
                    }
                });
                const onClose = controller.options.onClose;
                controller.options.onClose = (context) => {
                    if (typeof onClose === 'function') onClose(context);
                    context.controller.destroy();
                };
            });

            bindClick('component-library-modal-open-async-close-confirm', () => {
                const modalBodyId = `component-library-modal-async-guard-body-${Date.now()}`;
                const titleInputId = `component-library-modal-async-guard-title-${Date.now()}`;
                const notesInputId = `component-library-modal-async-guard-notes-${Date.now()}`;
                const statusLabelId = `component-library-modal-async-guard-status-${Date.now()}`;
                const saveButtonId = `component-library-modal-async-guard-save-${Date.now()}`;
                const closeButtonId = `component-library-modal-async-guard-close-${Date.now()}`;
                let hasUnsavedChanges = true;

                const updateDirtyStateLabel = (rootElement) => {
                    if (!rootElement) return;
                    const statusLabel = rootElement.querySelector(`#${statusLabelId}`);
                    if (!statusLabel) return;
                    statusLabel.textContent = hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved';
                    statusLabel.className = hasUnsavedChanges
                        ? 'll-chip ll-chip--warning'
                        : 'll-chip ll-chip--positive';
                };

                const requestDiscardConfirmation = () => {
                    return new Promise((resolve) => {
                        let settled = false;
                        const settle = (value, delayMs = 0) => {
                            if (settled) return;
                            settled = true;
                            const complete = () => resolve(Boolean(value));
                            if (delayMs > 0) {
                                window.setTimeout(complete, delayMs);
                                return;
                            }
                            complete();
                        };
                        const confirmController = components.initializeConfirmationDialog({
                            title: 'Discard unsaved changes?',
                            titleIcon: 'warning',
                            width: '36rem',
                            bodyContent: 'You have unsaved changes. If you close now, your edits will be lost.',
                            cancelLabel: 'Keep Editing',
                            confirmLabel: 'Discard Changes',
                            confirmButtonClassName: 'll-btn ll-btn--negative',
                            onCancel: () => settle(false),
                            onConfirm: () => settle(true)
                        });
                        const originalOnRequestClose = confirmController.options.onRequestClose;
                        confirmController.options.onRequestClose = async (context) => {
                            const requestContext = context || {};
                            let shouldClose = true;
                            if (typeof originalOnRequestClose === 'function') {
                                shouldClose = (await originalOnRequestClose(requestContext)) !== false;
                            }
                            if (shouldClose && !settled) {
                                const didConfirmDiscard = requestContext.reason === 'confirm';
                                settle(didConfirmDiscard, didConfirmDiscard ? 100 : 0);
                            }
                            return shouldClose;
                        };
                        const originalOnClose = confirmController.options.onClose;
                        confirmController.options.onClose = (context) => {
                            if (typeof originalOnClose === 'function') originalOnClose(context);
                            if (context && context.controller && typeof context.controller.destroy === 'function') {
                                context.controller.destroy();
                            }
                            if (!settled) {
                                settle(context && context.reason === 'confirm');
                            }
                        };
                    });
                };

                openManagedModal({
                    title: 'Unsaved Changes Guard',
                    titleIcon: 'edit_note',
                    width: '40rem',
                    bodyContent: `
                        <div id="${modalBodyId}" class="ll-field-group">
                            <div class="ll-field">
                                <div class="ll-form-control__label-row">
                                    <label class="ll-form-control__label">Draft Title</label>
                                </div>
                                <input id="${titleInputId}" type="text" class="ll-input" placeholder="Enter title" autofocus>
                            </div>
                            <div class="ll-field">
                                <div class="ll-form-control__label-row">
                                    <label class="ll-form-control__label">Notes</label>
                                </div>
                                <div class="ll-textarea-container">
                                    <textarea id="${notesInputId}" rows="4" class="ll-input ll-input--textarea" placeholder="Type changes to mark as dirty"></textarea>
                                </div>
                            </div>
                            <div class="ll-field">
                                <span id="${statusLabelId}" class="ll-chip ll-chip--warning">Unsaved changes</span>
                            </div>
                        </div>
                    `,
                    footerContent: `
                        <button id="${closeButtonId}" type="button" class="ll-btn ll-btn--flat-default">Close</button>
                        <button id="${saveButtonId}" type="button" class="ll-btn ll-btn--primary">Save</button>
                    `,
                    onOpen: ({ controller }) => {
                        const bodyRoot = controller.body ? controller.body.querySelector(`#${modalBodyId}`) : null;
                        const titleInput = controller.body ? controller.body.querySelector(`#${titleInputId}`) : null;
                        const notesInput = controller.body ? controller.body.querySelector(`#${notesInputId}`) : null;
                        const saveButton = controller.footer ? controller.footer.querySelector(`#${saveButtonId}`) : null;
                        const closeButton = controller.footer ? controller.footer.querySelector(`#${closeButtonId}`) : null;
                        updateDirtyStateLabel(bodyRoot);

                        const markDirty = () => {
                            hasUnsavedChanges = true;
                            updateDirtyStateLabel(bodyRoot);
                        };
                        if (titleInput) titleInput.addEventListener('input', markDirty);
                        if (notesInput) notesInput.addEventListener('input', markDirty);

                        if (saveButton) {
                            saveButton.addEventListener('click', () => {
                                hasUnsavedChanges = false;
                                updateDirtyStateLabel(bodyRoot);
                                components.createToast({
                                    state: 'positive',
                                    title: 'Saved',
                                    message: 'Changes were saved. Closing is now allowed without confirmation.'
                                });
                            });
                        }
                        if (closeButton) {
                            closeButton.addEventListener('click', () => {
                                controller.close('footer-close');
                            });
                        }
                    },
                    onRequestClose: async ({ reason }) => {
                        if (!hasUnsavedChanges) return true;
                        const shouldDiscard = await requestDiscardConfirmation();
                        if (!shouldDiscard) {
                            components.createToast({
                                state: 'info',
                                title: 'Continue Editing',
                                message: `Close request "${reason}" was cancelled.`
                            });
                            return false;
                        }
                        return true;
                    }
                });
            });

            bindClick('component-library-modal-open-nested-parent', () => {
                const nestedChildTriggerId = `component-library-open-child-modal-${Date.now()}`;
                const parentModal = openManagedModal({
                    title: 'Parent Modal',
                    titleIcon: 'view_in_ar',
                    bodyContent: `
                        <div class="ll-field-group">
                            <div class="ll-field">
                                <p class="text-sm text-gray-300 mb-3">Open a child modal, then press ESC. The child should close before this parent modal.</p>
                                <button id="${nestedChildTriggerId}" type="button" class="ll-btn ll-btn--outline-default">
                                    Open Child Modal
                                </button>
                            </div>
                        </div>
                    `
                });
                const childTrigger = parentModal.body.querySelector(`#${nestedChildTriggerId}`);
                if (!childTrigger) return;
                childTrigger.addEventListener('click', () => {
                    openManagedModal({
                        title: 'Child Modal',
                        titleIcon: 'layers',
                        width: '28rem',
                        bodyContent: '<p class="text-sm text-gray-300">Press ESC to close this child modal first.</p>'
                    });
                });
            });

            modalsTab.dataset.modalDemosBound = 'true';
        }

        function setupComponentLibraryListingModuleDemos(components) {
            if (!components || typeof components.initListingModule !== 'function') return;
            const listingTab = document.getElementById('component-library-listing-tab');
            if (!listingTab || listingTab.dataset.listingModuleDemosBound === 'true') return;

            const statusChipClassMap = {
                draft: 'll-chip--outline-default',
                published: 'll-chip--outline-positive',
                unpublished: 'll-chip--outline-warning'
            };
            const briefingTypeChipClassMap = {
                Alert: 'll-chip--negative',
                Report: 'll-chip--warning',
                Feedback: 'll-chip--positive',
                Update: 'll-chip--primary'
            };
            const briefingTypeIconMap = {
                Alert: 'warning',
                Report: 'description',
                Feedback: 'feedback',
                Update: 'notifications'
            };
            const formatDate = (isoDateString) => {
                const date = new Date(isoDateString);
                if (!Number.isFinite(date.getTime())) return '';
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            };
            const escapeHtmlText = (value) => String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

            const storyItems = [
                { id: 'story-1', title: 'Q2 Performance Review: Deep Dive into Financial Metrics Across All Departments', status: 'Published', statusFilter: 'published', sectionsCount: 14, updatedLabel: '2 hours ago', updatedRank: 8, thumbnail: 'https://placehold.co/400x225/1a202c/e2e8f0?text=Screenshot+of+first+section', href: 'workspaces/finance.html#story-1' },
                { id: 'story-2', title: 'Employee Engagement Trends 2024: Key Insights and Retention Strategies', status: 'Published', statusFilter: 'published', sectionsCount: 17, updatedLabel: '1 day ago', updatedRank: 7, thumbnail: 'https://placehold.co/400x225/2c5282/ffffff?text=Screenshot+of+first+section', href: 'workspaces/finance.html#story-2' },
                { id: 'story-3', title: '2025 Marketing Strategy Overview: Key Initiatives and Anticipated Impact Analysis', status: 'Unpublished', statusFilter: 'unpublished', sectionsCount: 14, updatedLabel: '3 days ago', updatedRank: 6, thumbnail: 'https://placehold.co/400x225/38a169/ffffff?text=Screenshot+of+first+section', href: 'workspaces/finance.html#story-3' },
                { id: 'story-4', title: 'Q2 Performance Review: Deep Dive into Financial Metrics Across All Departments', status: 'Draft', statusFilter: 'draft', sectionsCount: 12, updatedLabel: '1 week ago', updatedRank: 4, thumbnail: 'https://placehold.co/400x225/1a202c/e2e8f0?text=Screenshot+of+first+section', href: 'workspaces/finance.html#story-4' },
                { id: 'story-5', title: 'Customer Satisfaction Analysis: Q1 Survey Results and Actionable Recommendations', status: 'Published', statusFilter: 'published', sectionsCount: 9, updatedLabel: '5 hours ago', updatedRank: 5, thumbnail: 'https://placehold.co/400x225/7c2d12/ffffff?text=Screenshot+of+first+section', href: 'workspaces/finance.html#story-5' },
                { id: 'story-6', title: 'Technology Infrastructure Modernization: Roadmap and Implementation Timeline', status: 'Unpublished', statusFilter: 'unpublished', sectionsCount: 21, updatedLabel: '2 days ago', updatedRank: 3, thumbnail: 'https://placehold.co/400x225/1e3a8a/ffffff?text=Screenshot+of+first+section', href: 'workspaces/finance.html#story-6' },
                { id: 'story-7', title: 'Product Launch Strategy: Market Entry Plan and Competitive Positioning', status: 'Published', statusFilter: 'published', sectionsCount: 16, updatedLabel: '4 days ago', updatedRank: 2, thumbnail: 'https://placehold.co/400x225/065f46/ffffff?text=Screenshot+of+first+section', href: 'workspaces/finance.html#story-7' },
                { id: 'story-8', title: 'Risk Assessment and Mitigation: Comprehensive Analysis of Operational Vulnerabilities', status: 'Draft', statusFilter: 'draft', sectionsCount: 19, updatedLabel: '5 days ago', updatedRank: 1, thumbnail: 'https://placehold.co/400x225/4c1d95/ffffff?text=Screenshot+of+first+section', href: 'workspaces/finance.html#story-8' }
            ];

            const briefingItems = [
                { id: 'briefing-1', title: 'Supply Chain Alert: Critical Component Shortage', state: 'active', type: 'Alert', slidesCount: 2, updatedLabel: '2 hours ago', updatedRank: 10, thumbnail: 'https://placehold.co/192x256/7f1d1d/ffffff?text=Briefing+Thumbnail', href: 'workspaces/finance.html#briefing-1' },
                { id: 'briefing-2', title: 'Market Volatility Impact on Q3 Forecasts', state: 'active', type: 'Report', slidesCount: 1, updatedLabel: '1 day ago', updatedRank: 9, thumbnail: 'https://placehold.co/192x256/172554/ffffff?text=Briefing+Thumbnail', href: 'workspaces/finance.html#briefing-2' },
                { id: 'briefing-3', title: 'Employee Feedback: Key Takeaways & Action Plans', state: 'active', type: 'Feedback', slidesCount: 1, updatedLabel: '3 days ago', updatedRank: 7, thumbnail: 'https://placehold.co/192x256/064e3b/ffffff?text=Briefing+Thumbnail', href: 'workspaces/finance.html#briefing-3' },
                { id: 'briefing-4', title: 'Q1 Lead Generation: Performance & Strategy', state: 'active', type: 'Report', slidesCount: 1, updatedLabel: '4 days ago', updatedRank: 6, thumbnail: 'https://placehold.co/192x256/78350f/ffffff?text=Briefing+Thumbnail', href: 'workspaces/finance.html#briefing-4' },
                { id: 'briefing-5', title: 'System Upgrade: Upcoming Changes and Benefits', state: 'active', type: 'Update', slidesCount: 1, updatedLabel: '2 days ago', updatedRank: 8, thumbnail: 'https://placehold.co/192x256/222/fff?text=Briefing+Thumbnail', href: 'workspaces/finance.html#briefing-5' },
                { id: 'briefing-6', title: 'Campaign Performance: Deep Dive into Q1 Results', state: 'active', type: 'Report', slidesCount: 1, updatedLabel: '4 days ago', updatedRank: 5, thumbnail: 'https://placehold.co/192x256/222/fff?text=Briefing+Thumbnail', href: 'workspaces/finance.html#briefing-6' },
                { id: 'briefing-7', title: 'Warehouse Saturation Incident Retrospective', state: 'expired', type: 'Alert', slidesCount: 1, updatedLabel: '5 days ago', updatedRank: 4, thumbnail: 'https://placehold.co/192x256/7f1d1d/ffffff?text=Briefing+Thumbnail', href: 'workspaces/finance.html#briefing-7' },
                { id: 'briefing-8', title: 'Weekly Revenue Pulse: End-of-Month Snapshot', state: 'expired', type: 'Report', slidesCount: 2, updatedLabel: '6 days ago', updatedRank: 3, thumbnail: 'https://placehold.co/192x256/78350f/ffffff?text=Briefing+Thumbnail', href: 'workspaces/finance.html#briefing-8' },
                { id: 'briefing-9', title: 'Employee Pulse Follow-up: Coaching Outcomes', state: 'expired', type: 'Feedback', slidesCount: 1, updatedLabel: '1 week ago', updatedRank: 2, thumbnail: 'https://placehold.co/192x256/064e3b/ffffff?text=Briefing+Thumbnail', href: 'workspaces/finance.html#briefing-9' },
                { id: 'briefing-10', title: 'CRM Downtime Communication Summary', state: 'expired', type: 'Update', slidesCount: 1, updatedLabel: '8 days ago', updatedRank: 1, thumbnail: 'https://placehold.co/192x256/1e3a8a/ffffff?text=Briefing+Thumbnail', href: 'workspaces/finance.html#briefing-10' }
            ];

            const listingOnlyItems = [
                { id: 'row-1', name: 'North America Plan', category: 'Planning', owner: 'Maya Ali', status: 'Open', updatedAt: '2026-04-06', hasManualTrigger: true, thumbnail: 'https://placehold.co/400x225/1e3a8a/ffffff?text=Workflow' },
                { id: 'row-2', name: 'Q2 Risk Register', category: 'Risk', owner: 'Jon Park', status: 'In Review', updatedAt: '2026-04-01', hasManualTrigger: false, thumbnail: 'https://placehold.co/400x225/7c2d12/ffffff?text=Workflow' },
                { id: 'row-3', name: 'Weekly Executive Snapshot', category: 'Reporting', owner: 'Ari Chen', status: 'Open', updatedAt: '2026-03-28', hasManualTrigger: true, thumbnail: 'https://placehold.co/400x225/065f46/ffffff?text=Workflow' },
                { id: 'row-4', name: 'Campaign Cost Variance', category: 'Planning', owner: 'Priya Das', status: 'Closed', updatedAt: '2026-03-17', hasManualTrigger: true, thumbnail: 'https://placehold.co/400x225/4c1d95/ffffff?text=Workflow' },
                { id: 'row-5', name: 'Pricing Sensitivity Matrix', category: 'Analysis', owner: 'Kai Morgan', status: 'Open', updatedAt: '2026-03-09', hasManualTrigger: false, thumbnail: 'https://placehold.co/400x225/1a202c/e2e8f0?text=Workflow' }
            ];
            const apiCollectionsItems = [
                {
                    id: 'api-collection-1',
                    itemType: 'collection',
                    name: 'Weather Services',
                    description: 'Real-time weather data and forecasts',
                    status: 'Active',
                    updatedLabel: '2 hours ago',
                    children: [
                        {
                            id: 'api-request-1-1',
                            itemType: 'request',
                            name: 'Get Current Weather',
                            description: 'Retrieve current weather conditions',
                            method: 'GET',
                            status: 'Active',
                            updatedLabel: '1 hour ago'
                        },
                        {
                            id: 'api-request-1-2',
                            itemType: 'request',
                            name: 'Get Weather Forecast',
                            description: 'Get 7-day weather forecast for location',
                            method: 'POST',
                            status: 'Active',
                            updatedLabel: '45 mins ago'
                        }
                    ]
                },
                {
                    id: 'api-collection-2',
                    itemType: 'collection',
                    name: 'Traffic Services',
                    description: 'Real-time traffic data and route optimization',
                    status: 'Active',
                    updatedLabel: '1 day ago',
                    children: [
                        {
                            id: 'api-request-2-1',
                            itemType: 'request',
                            name: 'Get Traffic Flow',
                            description: 'Retrieve real-time traffic flow data',
                            method: 'POST',
                            status: 'Active',
                            updatedLabel: '3 hours ago'
                        }
                    ]
                },
                {
                    id: 'api-collection-3',
                    itemType: 'collection',
                    name: 'Payments Services',
                    description: 'Transaction validation and settlement APIs',
                    status: 'Active',
                    updatedLabel: 'Just now',
                    children: []
                }
            ];
            const listingSelectionItems = [
                { id: 'selection-1', title: 'Revenue Forecast Q3', status: 'Draft', owner: 'Ari Chen', category: 'Planning', updatedAt: '2026-04-10', thumbnail: 'https://placehold.co/400x225/1e3a8a/ffffff?text=Q3+Forecast' },
                { id: 'selection-2', title: 'Regional Risk Summary', status: 'In Review', owner: 'Priya Das', category: 'Risk', updatedAt: '2026-04-08', thumbnail: 'https://placehold.co/400x225/7c2d12/ffffff?text=Risk+Summary' },
                { id: 'selection-3', title: 'Pipeline Weekly Snapshot', status: 'Published', owner: 'Maya Ali', category: 'Reporting', updatedAt: '2026-04-05', thumbnail: 'https://placehold.co/400x225/065f46/ffffff?text=Pipeline+Snapshot' },
                { id: 'selection-4', title: 'Margin Stress Test', status: 'Draft', owner: 'Kai Morgan', category: 'Analysis', updatedAt: '2026-03-30', thumbnail: 'https://placehold.co/400x225/4c1d95/ffffff?text=Stress+Test' },
                { id: 'selection-5', title: 'Budget Reallocation Plan', status: 'Published', owner: 'Jon Park', category: 'Planning', updatedAt: '2026-03-26', thumbnail: 'https://placehold.co/400x225/1a202c/e2e8f0?text=Budget+Plan' }
            ];

            const LISTING_IN_MODAL_DB_ROOT_ID = 'cl-listing-in-modal-db-root';
            const LISTING_IN_MODAL_DB_TABLE_HOST_ID = 'cl-listing-in-modal-db-table-host';
            const LISTING_IN_MODAL_DB_SEARCH_ID = 'cl-listing-in-modal-db-search';
            const LISTING_IN_MODAL_DB_FILTER_BTN_ID = 'cl-listing-in-modal-db-filter-btn';
            const LISTING_IN_MODAL_DB_FILTER_MENU_ID = 'cl-listing-in-modal-db-filter-menu';
            const LISTING_IN_MODAL_DB_SORT_BTN_ID = 'cl-listing-in-modal-db-sort-btn';
            const LISTING_IN_MODAL_DB_SORT_MENU_ID = 'cl-listing-in-modal-db-sort-menu';
            const LISTING_IN_MODAL_DB_CLEAR_FILTERS_BTN_ID = 'cl-listing-in-modal-db-clear-filters-btn';
            const LISTING_IN_MODAL_DB_CREATE_BTN_ID = 'cl-listing-in-modal-db-create-btn';
            const LISTING_IN_MODAL_DB_CANCEL_BTN_ID = 'cl-listing-in-modal-db-cancel-btn';
            const LISTING_IN_MODAL_DB_CONFIRM_BTN_ID = 'cl-listing-in-modal-db-confirm-btn';

            const listingInModalDatabaseItems = [
                { id: 'cl-db-1', name: 'Primary Analytics', type: 'postgresql', host: 'analytics.llumen.internal', port: '5432', dbname: 'analytics', description: 'Primary reporting warehouse', lastUpdated: '2 hours ago', updatedRank: 11 },
                { id: 'cl-db-2', name: 'Customer Events', type: 'mysql', host: 'events.llumen.internal', port: '3306', dbname: 'events', description: 'Real-time event stream store', lastUpdated: 'Today, 11:15 AM', updatedRank: 15 },
                { id: 'cl-db-3', name: 'Financial Archive', type: 'sqlserver', host: 'fin-archive.llumen.internal', port: '1433', dbname: 'fin_archive', description: 'Finance and audit historical data', lastUpdated: 'Yesterday', updatedRank: 7 },
                { id: 'cl-db-4', name: 'Workflow Cache', type: 'sqlite', host: 'local-cache', port: '', dbname: 'workflow_cache', description: 'Local cache for workflow previews', lastUpdated: '4 days ago', updatedRank: 4 },
                { id: 'cl-db-5', name: 'Sales Operations', type: 'postgresql', host: 'salesops.llumen.internal', port: '5432', dbname: 'sales_ops', description: 'Sales dashboards and quota tracking', lastUpdated: '3 hours ago', updatedRank: 10 },
                { id: 'cl-db-6', name: 'Identity Profiles', type: 'mysql', host: 'identity.llumen.internal', port: '3306', dbname: 'profiles', description: 'User and tenant profile service', lastUpdated: 'Today, 9:40 AM', updatedRank: 13 },
                { id: 'cl-db-7', name: 'Audit Ledger', type: 'sqlserver', host: 'audit.llumen.internal', port: '1433', dbname: 'audit_ledger', description: 'Regulatory audit event records', lastUpdated: 'Today, 8:12 AM', updatedRank: 12 },
                { id: 'cl-db-8', name: 'Forecast Sandbox', type: 'oracle', host: 'forecast.llumen.internal', port: '1521', dbname: 'forecast_sbx', description: 'Scenario forecasting experiments', lastUpdated: '1 day ago', updatedRank: 8 },
                { id: 'cl-db-9', name: 'Content Metadata', type: 'postgresql', host: 'content.llumen.internal', port: '5432', dbname: 'content_meta', description: 'Story and briefing metadata index', lastUpdated: '5 hours ago', updatedRank: 9 },
                { id: 'cl-db-10', name: 'Partner Integrations', type: 'mysql', host: 'partners.llumen.internal', port: '3306', dbname: 'partner_hub', description: 'Third-party sync and webhook staging', lastUpdated: '2 days ago', updatedRank: 6 },
                { id: 'cl-db-11', name: 'Telemetry Stream', type: 'sqlserver', host: 'telemetry.llumen.internal', port: '1433', dbname: 'telemetry', description: 'Platform telemetry aggregates', lastUpdated: 'Today, 1:05 PM', updatedRank: 16 },
                { id: 'cl-db-12', name: 'Learning Lab Cache', type: 'sqlite', host: 'edge-node-01', port: '', dbname: 'lab_cache', description: 'Edge cache used for learning demos', lastUpdated: '6 days ago', updatedRank: 3 },
                { id: 'cl-db-13', name: 'Marketing Warehouse', type: 'postgresql', host: 'mktg-wh.llumen.internal', port: '5432', dbname: 'marketing_wh', description: 'Campaign attribution warehouse', lastUpdated: 'Yesterday', updatedRank: 7 },
                { id: 'cl-db-14', name: 'Support Ops', type: 'mysql', host: 'support.llumen.internal', port: '3306', dbname: 'support_ops', description: 'Support SLAs and ticket metrics', lastUpdated: '3 days ago', updatedRank: 5 },
                { id: 'cl-db-15', name: 'Compliance Archive', type: 'oracle', host: 'compliance.llumen.internal', port: '1521', dbname: 'compliance_arc', description: 'Retention and compliance snapshots', lastUpdated: '1 week ago', updatedRank: 1 },
                { id: 'cl-db-16', name: 'Experiment Registry', type: 'postgresql', host: 'experiments.llumen.internal', port: '5432', dbname: 'experiment_registry', description: 'Feature-flag experiment registry', lastUpdated: 'Today, 7:22 AM', updatedRank: 14 }
            ];
            const listingInModalTypeClassMap = {
                mysql: 'll-chip--primary',
                postgresql: 'll-chip--warning',
                sqlserver: 'll-chip--negative',
                oracle: 'll-chip--default',
                sqlite: 'll-chip--positive'
            };

            let listingInModalDatabaseController = null;
            let listingInModalDatabaseInstance = null;
            let listingInModalSelectedDatabase = null;
            let listingInModalTempSelectedDatabase = null;

            const buildListingInModalDatabaseItems = () => listingInModalDatabaseItems.map((dbItem) => ({
                ...dbItem,
                connectionSummary: `${dbItem.host}:${dbItem.port || ''} - ${dbItem.dbname}`
            }));
            const updateListingInModalConfirmButton = () => {
                const confirmButton = document.getElementById(LISTING_IN_MODAL_DB_CONFIRM_BTN_ID);
                if (!confirmButton) return;
                confirmButton.disabled = !listingInModalTempSelectedDatabase;
            };
            const ensureListingInModalDatabaseListing = () => {
                if (listingInModalDatabaseInstance) return listingInModalDatabaseInstance;
                listingInModalDatabaseInstance = components.initListingModule({
                    rootId: LISTING_IN_MODAL_DB_ROOT_ID,
                    allowUnsafeHtml: true,
                    items: buildListingInModalDatabaseItems(),
                    idKey: 'id',
                    table: {
                        containerId: LISTING_IN_MODAL_DB_TABLE_HOST_ID,
                        columns: [
                            {
                                property: 'name',
                                heading: 'Database Connections',
                                isMain: true,
                                headerClassName: 'll-listing-table__column-main',
                                cellClassName: 'll-listing-table__column-main',
                                renderCell: (item) => `
                                    <div class="ll-listing-table__main">
                                        <div class="ll-listing-table__main-body">
                                            <div class="ll-listing-table__main-heading">${escapeHtmlText(item.name || '')}</div>
                                            <div class="ll-listing-table__main-meta-row">
                                                <span class="ll-chip ${listingInModalTypeClassMap[item.type] || 'll-chip--default'}"><span class="ll-chip__label">${escapeHtmlText(String(item.type || '').toUpperCase())}</span></span>
                                                <span class="ll-listing-table__main-meta-item">${escapeHtmlText(item.description || '')}</span>
                                                <span class="ll-listing-table__main-meta-item">${escapeHtmlText(item.connectionSummary || '')}</span>
                                            </div>
                                        </div>
                                    </div>
                                `
                            },
                            { property: 'lastUpdated', heading: 'Last Updated' }
                        ]
                    },
                    controls: {
                        searchInputId: LISTING_IN_MODAL_DB_SEARCH_ID,
                        clearAllFiltersButtonId: LISTING_IN_MODAL_DB_CLEAR_FILTERS_BTN_ID,
                        sortDropdown: {
                            buttonId: LISTING_IN_MODAL_DB_SORT_BTN_ID,
                            menuId: LISTING_IN_MODAL_DB_SORT_MENU_ID,
                            selectedValueSelector: '.ll-dropdown__selected-value',
                            align: 'right',
                            dropdownIcon: 'sort',
                            showLabel: false,
                            dropdownLabel: 'Sort',
                            emptySelectionLabel: 'Sort'
                        }
                    },
                    search: {
                        fields: ['name', 'description', 'type', 'host', 'dbname']
                    },
                    filters: [
                        {
                            key: 'type',
                            label: 'Type',
                            type: 'multiple',
                            property: 'type',
                            dropdown: {
                                buttonId: LISTING_IN_MODAL_DB_FILTER_BTN_ID,
                                menuId: LISTING_IN_MODAL_DB_FILTER_MENU_ID,
                                selectedValueSelector: '.ll-dropdown__selected-value',
                                dropdownLabel: 'Type',
                                emptySelectionLabel: 'Type'
                            },
                            options: [
                                { value: 'mysql', label: 'MySQL' },
                                { value: 'postgresql', label: 'PostgreSQL' },
                                { value: 'sqlserver', label: 'SQL Server' },
                                { value: 'oracle', label: 'Oracle' },
                                { value: 'sqlite', label: 'SQLite' }
                            ]
                        }
                    ],
                    sorts: [
                        { value: 'last-updated', label: 'Last Updated', property: 'updatedRank', propertyType: 'number', order: 'desc' },
                        { value: 'name-asc', label: 'Name', property: 'name', propertyType: 'string', order: 'asc', description: 'A-Z' },
                        { value: 'name-desc', label: 'Name', property: 'name', propertyType: 'string', order: 'desc', description: 'Z-A' }
                    ],
                    itemClick: {
                        type: 'selection',
                        onSelectionChange: ({ selectedItem }) => {
                            listingInModalTempSelectedDatabase = selectedItem ? selectedItem.id : null;
                            updateListingInModalConfirmButton();
                        }
                    },
                    itemActions: {
                        items: [
                            {
                                type: 'button',
                                className: 'll-icon-btn ll-icon-btn--circle ll-icon-btn--outline',
                                icon: 'visibility',
                                iconClassName: 'll-icon-btn__icon',
                                ariaLabel: 'View connection details',
                                onClick: ({ item }) => {
                                    console.log('Database listing modal demo item action:', item && item.id ? item.id : '');
                                }
                            }
                        ]
                    }
                });
                return listingInModalDatabaseInstance;
            };
            const getListingInModalBodyMarkup = () => `
                <div id="${LISTING_IN_MODAL_DB_ROOT_ID}" class="ll-listing-module ll-listing-module--in-modal">
                    <div class="ll-listing-module-header">
                        <div class="ll-listing-module-header__top">
                            <div class="ll-listing-module-header__title-wrap">
                                <div class="ll-listing-module-header__title">Database Connections</div>
                            </div>
                            <div class="ll-listing-module-header__actions">
                                <div class="ll-input-with-left-icon ll-listing-module-search-input">
                                    <div class="ll-input-with-left-icon__left ll-input-with-left-icon__icon"><span class="material-symbols-outlined">search</span></div>
                                    <input id="${LISTING_IN_MODAL_DB_SEARCH_ID}" type="text" class="ll-input ll-input--search ll-input-with-left-icon__input" placeholder="Search connections...">
                                </div>
                                <button id="${LISTING_IN_MODAL_DB_CREATE_BTN_ID}" type="button" class="ll-btn ll-btn--outline-default">
                                    <span class="material-symbols-outlined ll-btn__icon">add</span>
                                    New Connection
                                </button>
                            </div>
                        </div>
                        <div class="ll-listing-module-header__toolbar">
                            <div class="ll-listing-module-header__toolbar-start">
                                <button id="${LISTING_IN_MODAL_DB_FILTER_BTN_ID}" class="ll-btn ll-btn--outline-default">
                                    <span class="ll-dropdown__selected-value">Type</span>
                                    <span class="material-symbols-outlined ll-dropdown__button-chevron">expand_more</span>
                                </button>
                                <div id="${LISTING_IN_MODAL_DB_FILTER_MENU_ID}" class="ll-dropdown__menu hidden"></div>
                                <button id="${LISTING_IN_MODAL_DB_CLEAR_FILTERS_BTN_ID}" type="button" class="ll-btn ll-btn--outline-negative ll-listing-module__clear-filters hidden">Clear All Filters</button>
                            </div>
                            <div class="ll-listing-module-header__toolbar-end">
                                <button id="${LISTING_IN_MODAL_DB_SORT_BTN_ID}" class="ll-btn ll-btn--outline-default">
                                    <span class="ll-dropdown__selected-value">Sort</span>
                                    <span class="material-symbols-outlined ll-dropdown__button-chevron">expand_more</span>
                                </button>
                                <div id="${LISTING_IN_MODAL_DB_SORT_MENU_ID}" class="ll-dropdown__menu hidden"></div>
                            </div>
                        </div>
                    </div>
                    <div id="${LISTING_IN_MODAL_DB_TABLE_HOST_ID}" class="ll-listing-module-content-host ll-listing-module-table-host"></div>
                </div>
            `;
            const ensureListingInModalDatabaseController = () => {
                if (listingInModalDatabaseController) return listingInModalDatabaseController;
                if (typeof components.initializeModal !== 'function') return null;
                listingInModalDatabaseController = components.initializeModal({
                    id: 'component-library-listing-in-modal-database-selection-modal',
                    title: 'Select Database Connection',
                    width: '64rem',
                    bodyPadding: false,
                    bodyScrollable: false,
                    openOnInit: false,
                    bodyContent: getListingInModalBodyMarkup(),
                    footerContent: {
                        actions: `
                            <button id="${LISTING_IN_MODAL_DB_CANCEL_BTN_ID}" type="button" class="ll-btn ll-btn--flat-default">Cancel</button>
                            <button id="${LISTING_IN_MODAL_DB_CONFIRM_BTN_ID}" type="button" class="ll-btn ll-btn--primary" disabled>Select Connection</button>
                        `
                    },
                    onOpen: ({ controller }) => {
                        if (controller.root.dataset.listingInModalDatabaseBound !== 'true') {
                            const createButton = controller.body.querySelector(`#${LISTING_IN_MODAL_DB_CREATE_BTN_ID}`);
                            const cancelButton = controller.footer ? controller.footer.querySelector(`#${LISTING_IN_MODAL_DB_CANCEL_BTN_ID}`) : null;
                            const confirmButton = controller.footer ? controller.footer.querySelector(`#${LISTING_IN_MODAL_DB_CONFIRM_BTN_ID}`) : null;
                            if (createButton) {
                                createButton.addEventListener('click', () => {
                                    const infoDialog = components.initializeAlertDialog({
                                        title: 'Create Connection',
                                        bodyContent: 'In platform settings, this button opens the Create Database Connection modal.'
                                    });
                                    if (infoDialog && infoDialog.options) {
                                        const originalOnClose = infoDialog.options.onClose;
                                        infoDialog.options.onClose = (context) => {
                                            if (typeof originalOnClose === 'function') originalOnClose(context);
                                            if (context && context.controller && typeof context.controller.destroy === 'function') {
                                                context.controller.destroy();
                                            }
                                        };
                                    }
                                });
                            }
                            if (cancelButton) {
                                cancelButton.addEventListener('click', () => controller.close('cancel'));
                            }
                            if (confirmButton) {
                                confirmButton.addEventListener('click', () => {
                                    if (!listingInModalTempSelectedDatabase) return;
                                    listingInModalSelectedDatabase = listingInModalTempSelectedDatabase;
                                    controller.close('confirm');
                                });
                            }
                            controller.root.dataset.listingInModalDatabaseBound = 'true';
                        }
                        ensureListingInModalDatabaseListing();
                        if (listingInModalDatabaseInstance) {
                            listingInModalDatabaseInstance.setItems(buildListingInModalDatabaseItems());
                            if (listingInModalSelectedDatabase) {
                                listingInModalDatabaseInstance.selectItem(listingInModalSelectedDatabase);
                            } else {
                                listingInModalDatabaseInstance.clearSelection();
                            }
                        }
                        listingInModalTempSelectedDatabase = listingInModalSelectedDatabase;
                        updateListingInModalConfirmButton();
                    },
                    onClose: () => {
                        listingInModalTempSelectedDatabase = listingInModalSelectedDatabase;
                    }
                });
                return listingInModalDatabaseController;
            };

            components.initListingModule({
                rootId: 'cl-listing-story-module',
                allowUnsafeHtml: true,
                items: storyItems,
                idKey: 'id',
                table: {
                    containerId: 'cl-listing-story-table-host',
                    columns: [
                        {
                            property: 'title',
                            heading: 'Story',
                            isMain: true,
                            headerClassName: 'll-listing-table__column-main',
                            cellClassName: 'll-listing-table__column-main',
                            renderCell: (item) => `
                                <div class="ll-listing-table__main">
                                    <div class="ll-listing-table__main-thumbnail">
                                        <div class="ll-aspect-box ll-aspect-box--16-9">
                                            <img src="${escapeHtmlText(item.thumbnail)}" alt="" class="ll-aspect-box__content ll-listing-table__main-thumbnail-image">
                                        </div>
                                    </div>
                                    <div class="ll-listing-table__main-body">
                                        <div class="ll-listing-table__main-heading">${escapeHtmlText(item.title)}</div>
                                    </div>
                                </div>
                            `
                        },
                        {
                            property: 'status',
                            heading: 'Status',
                            renderCell: (item) => `<span class="ll-chip ${statusChipClassMap[item.statusFilter] || 'll-chip--outline-default'}"><span class="ll-chip__label">${escapeHtmlText(item.status)}</span></span>`
                        },
                        {
                            property: 'sectionsCount',
                            heading: 'Content',
                            renderCell: (item) => `<span>${escapeHtmlText(String(item.sectionsCount))} Sections</span>`
                        },
                        {
                            property: 'updatedLabel',
                            heading: 'Last Updated',
                            renderCell: (item) => `<span>${escapeHtmlText(item.updatedLabel)}</span>`
                        }
                    ]
                },
                grid: {
                    enabled: true,
                    containerId: 'cl-listing-story-grid-host',
                    columns: 4,
                    gap: 6,
                    defaultView: 'grid',
                    renderCard: (item) => `
                        <div class="ll-aspect-box ll-aspect-box--16-9">
                            <img src="${escapeHtmlText(item.thumbnail)}" alt="" class="ll-aspect-box__content ll-card__thumbnail">
                            <div class="ll-card__header ll-card__header--media-overlay">
                                <div class="ll-card__header-actions"></div>
                            </div>
                        </div>
                        <div class="ll-card__content">
                            <div class="ll-card__content-heading">${escapeHtmlText(item.title)}</div>
                            <div class="ll-card__meta-row">
                                <div class="ll-card__meta-group">
                                    <span class="ll-chip ${statusChipClassMap[item.statusFilter] || 'll-chip--outline-default'}"><span class="ll-chip__label">${escapeHtmlText(item.status)}</span></span>
                                </div>
                                <div class="ll-card__meta-group">
                                    <span class="ll-card__meta-item">${escapeHtmlText(String(item.sectionsCount))} Sections</span>
                                </div>
                            </div>
                        </div>
                    `
                },
                controls: {
                    searchInputId: 'cl-listing-story-search-input',
                    searchClearButtonId: 'cl-listing-story-search-clear',
                    clearAllFiltersButtonId: 'cl-listing-story-clear-filters-btn',
                    sortDropdown: {
                        buttonId: 'cl-listing-story-sort-btn',
                        menuId: 'cl-listing-story-sort-menu',
                        selectedValueSelector: '.ll-dropdown__selected-value',
                        align: 'right',
                        dropdownIcon: 'sort',
                        showLabel: false,
                        dropdownLabel: 'Sort',
                        emptySelectionLabel: 'Sort'
                    },
                    viewToggle: {
                        listButtonId: 'cl-listing-story-view-list-btn',
                        gridButtonId: 'cl-listing-story-view-grid-btn'
                        },
                    emptyStateText: {
                        text: 'No matching Stories.',
                        icon: 'auto_stories'
                    }
                },
                search: {
                    fields: ['title', 'status', 'updatedLabel']
                },
                filters: [
                    {
                        key: 'status',
                        label: 'Status',
                        type: 'multiple',
                        property: 'statusFilter',
                        dropdown: {
                            buttonId: 'cl-listing-story-filter-btn',
                            menuId: 'cl-listing-story-filter-menu',
                            selectedValueSelector: '.ll-dropdown__selected-value',
                            dropdownLabel: 'Status',
                            emptySelectionLabel: 'Status'
                        },
                        options: [
                            { value: 'draft', label: 'Draft' },
                            { value: 'published', label: 'Published' },
                            { value: 'unpublished', label: 'Unpublished' }
                        ]
                    }
                ],
                sorts: [
                    { value: 'last-updated', label: 'Last Updated', property: 'updatedRank', propertyType: 'number', order: 'desc' },
                    { value: 'title-asc', label: 'Title', property: 'title', propertyType: 'string', order: 'asc', description: 'A-Z' },
                    { value: 'title-desc', label: 'Title', property: 'title', propertyType: 'string', order: 'desc', description: 'Z-A' }
                ],
                itemClick: {
                    type: 'link',
                    getHref: (item) => item.href
                },
                itemActions: {
                    items: [
                        {
                            type: 'dropdown',
                            options: [
                                { value: 'view-details', label: 'View Details' },
                                { value: 'share', label: 'Share' },
                                {
                                    value: 'delete',
                                    label: 'Delete',
                                    danger: true,
                                    onSelect: ({ removeItem }) => removeItem()
                                }
                            ]
                        }
                    ]
                }
            });

            components.initListingModule({
                rootId: 'cl-listing-api-module',
                allowUnsafeHtml: true,
                items: apiCollectionsItems,
                idKey: 'id',
                nested: {
                    enabled: true,
                    childrenKey: 'children',
                    rootExpandableWithoutChildren: true,
                    emptyChildrenLabel: 'No API requests in this collection yet.',
                    defaultExpandedIds: [],
                    triggerMode: 'arrow',
                    addActionsEnabled: true,
                    addItemButtonLabel: 'Add Request',
                    onAddItemClick: ({ parentItem }) => {
                        if (!parentItem || parentItem.itemType !== 'collection') return;
                        console.log('Open Add API Request modal for collection:', parentItem);
                    },
                    canAddItem: ({ parentItem }) => Boolean(parentItem && parentItem.itemType === 'collection')
                },
                table: {
                    containerId: 'cl-listing-api-table-host',
                    columns: [
                        {
                            property: 'name',
                            heading: 'API Collections & Requests',
                            isMain: true,
                            headerClassName: 'll-listing-table__column-main',
                            cellClassName: 'll-listing-table__column-main',
                            renderCell: (item) => {
                                const methodChip = item.itemType === 'request'
                                    ? `<span class="ll-chip ll-chip--outline-default"><span class="ll-chip__label">${escapeHtmlText(item.method || 'API')}</span></span>`
                                    : '';
                                const requestIcon = item.itemType === 'request'
                                    ? `<div class="ll-listing-table__main-icon"><span class="material-symbols-outlined ll-listing-table__main-icon-symbol">api</span></div>`
                                    : '';
                                return `
                                    <div class="ll-listing-table__main">
                                        ${requestIcon}
                                        <div class="ll-listing-table__main-body">
                                            <div class="ll-listing-table__main-heading">${escapeHtmlText(item.name)}</div>
                                            <div class="ll-listing-table__main-meta-row">
                                                ${methodChip}
                                                <span class="ll-listing-table__main-meta-item">${escapeHtmlText(item.description || '')}</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }
                        },
                        { property: 'status', heading: 'Status' },
                        { property: 'updatedLabel', heading: 'Last Updated' }
                    ]
                },
                controls: {
                    searchInputId: 'cl-listing-api-search-input',
                    searchClearButtonId: 'cl-listing-api-search-clear',
                    clearAllFiltersButtonId: 'cl-listing-api-clear-filters-btn',
                    sortDropdown: {
                        buttonId: 'cl-listing-api-sort-btn',
                        menuId: 'cl-listing-api-sort-menu',
                        selectedValueSelector: '.ll-dropdown__selected-value',
                        align: 'right',
                        dropdownIcon: 'sort',
                        showLabel: false,
                        dropdownLabel: 'Sort',
                        emptySelectionLabel: 'Sort'
                    },
                    emptyStateText: {
                        text: 'No matching API Collections or Requests.',
                        icon: 'api'
                    }
                },
                search: {
                    fields: ['name', 'description', 'status', 'itemType', 'method']
                },
                filters: [
                    {
                        key: 'status',
                        label: 'Status',
                        type: 'multiple',
                        property: 'status',
                        dropdown: {
                            buttonId: 'cl-listing-api-status-filter-btn',
                            menuId: 'cl-listing-api-status-filter-menu',
                            selectedValueSelector: '.ll-dropdown__selected-value',
                            dropdownLabel: 'Status',
                            emptySelectionLabel: 'Status'
                        },
                        options: [
                            { value: 'Active', label: 'Active' }
                        ]
                    }
                ],
                sorts: [
                    { value: 'updated-desc', label: 'Last Updated', property: 'updatedLabel', propertyType: 'string', order: 'desc' },
                    { value: 'name-asc', label: 'Name', property: 'name', propertyType: 'string', order: 'asc', description: 'A-Z' },
                    { value: 'name-desc', label: 'Name', property: 'name', propertyType: 'string', order: 'desc', description: 'Z-A' }
                ],
                itemClick: {
                    type: 'callback',
                    onClick: ({ item }) => {
                        if (!item) return;
                        if (item.itemType === 'collection') {
                            console.log('Open API Collection details modal:', item);
                        } else {
                            console.log('Open API Request details modal:', item);
                        }
                    }
                },
                itemActions: {
                    items: [
                        {
                            type: 'dropdown',
                            options: [
                                {
                                    value: 'add-request',
                                    label: 'Add Request',
                                    when: ({ item }) => Boolean(item && item.itemType === 'collection')
                                },
                                {
                                    value: 'open-request',
                                    label: 'Open Request',
                                    when: ({ item }) => Boolean(item && item.itemType === 'request')
                                },
                                {
                                    value: 'duplicate',
                                    label: 'Duplicate',
                                    when: ({ item }) => Boolean(item && item.itemType === 'request')
                                },
                                {
                                    value: 'delete',
                                    label: 'Delete',
                                    danger: true
                                }
                            ]
                        }
                    ]
                }
            });

            components.initListingModule({
                rootId: 'cl-listing-nested-selection-module',
                allowUnsafeHtml: true,
                items: apiCollectionsItems,
                idKey: 'id',
                nested: {
                    enabled: true,
                    childrenKey: 'children',
                    rootExpandableWithoutChildren: true,
                    emptyChildrenLabel: 'No API requests in this collection yet.',
                    defaultExpandedIds: [],
                    triggerMode: 'block',
                    addActionsEnabled: false
                },
                table: {
                    containerId: 'cl-listing-nested-selection-table-host',
                    columns: [
                        {
                            property: 'name',
                            heading: 'API Collections & Requests',
                            isMain: true,
                            headerClassName: 'll-listing-table__column-main',
                            cellClassName: 'll-listing-table__column-main',
                            renderCell: (item) => {
                                const methodChip = item.itemType === 'request'
                                    ? `<span class="ll-chip ll-chip--outline-default"><span class="ll-chip__label">${escapeHtmlText(item.method || 'API')}</span></span>`
                                    : '';
                                const requestIcon = item.itemType === 'request'
                                    ? `<div class="ll-listing-table__main-icon"><span class="material-symbols-outlined ll-listing-table__main-icon-symbol">api</span></div>`
                                    : '';
                                return `
                                    <div class="ll-listing-table__main">
                                        ${requestIcon}
                                        <div class="ll-listing-table__main-body">
                                            <div class="ll-listing-table__main-heading">${escapeHtmlText(item.name)}</div>
                                            <div class="ll-listing-table__main-meta-row">
                                                ${methodChip}
                                                <span class="ll-listing-table__main-meta-item">${escapeHtmlText(item.description || '')}</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }
                        },
                        { property: 'status', heading: 'Status' },
                        { property: 'updatedLabel', heading: 'Last Updated' }
                    ]
                },
                controls: {
                    searchInputId: 'cl-listing-nested-selection-search-input',
                    searchClearButtonId: 'cl-listing-nested-selection-search-clear',
                    clearAllFiltersButtonId: 'cl-listing-nested-selection-clear-filters-btn',
                    sortDropdown: {
                        buttonId: 'cl-listing-nested-selection-sort-btn',
                        menuId: 'cl-listing-nested-selection-sort-menu',
                        selectedValueSelector: '.ll-dropdown__selected-value',
                        align: 'right',
                        dropdownIcon: 'sort',
                        showLabel: false,
                        dropdownLabel: 'Sort',
                        emptySelectionLabel: 'Sort'
                    },
                    emptyStateText: {
                        text: 'No matching API Collections or Requests.',
                        icon: 'account_tree'
                    }
                },
                search: {
                    fields: ['name', 'description', 'status', 'itemType', 'method']
                },
                filters: [
                    {
                        key: 'status',
                        label: 'Status',
                        type: 'multiple',
                        property: 'status',
                        dropdown: {
                            buttonId: 'cl-listing-nested-selection-status-filter-btn',
                            menuId: 'cl-listing-nested-selection-status-filter-menu',
                            selectedValueSelector: '.ll-dropdown__selected-value',
                            dropdownLabel: 'Status',
                            emptySelectionLabel: 'Status'
                        },
                        options: [
                            { value: 'Active', label: 'Active' }
                        ]
                    }
                ],
                sorts: [
                    { value: 'updated-desc', label: 'Last Updated', property: 'updatedLabel', propertyType: 'string', order: 'desc' },
                    { value: 'name-asc', label: 'Name', property: 'name', propertyType: 'string', order: 'asc', description: 'A-Z' },
                    { value: 'name-desc', label: 'Name', property: 'name', propertyType: 'string', order: 'desc', description: 'Z-A' }
                ],
                itemClick: {
                    type: 'selection'
                },
                itemActions: {
                    items: [
                        {
                            type: 'button',
                            className: 'll-icon-btn ll-icon-btn--circle ll-icon-btn--outline',
                            icon: 'visibility',
                            iconClassName: 'll-icon-btn__icon',
                            ariaLabel: 'View item'
                        }
                    ]
                }
            });

            components.initListingModule({
                rootId: 'cl-listing-briefing-module',
                allowUnsafeHtml: true,
                items: briefingItems,
                idKey: 'id',
                table: {
                    containerId: 'cl-listing-briefing-table-host',
                    columns: [
                        {
                            property: 'title',
                            heading: 'Briefing',
                            isMain: true,
                            headerClassName: 'll-listing-table__column-main',
                            cellClassName: 'll-listing-table__column-main',
                            renderCell: (item) => `
                                <div class="ll-listing-table__main">
                                    <div class="ll-listing-table__main-thumbnail">
                                        <div class="ll-aspect-box ll-aspect-box--16-9">
                                            <img src="${escapeHtmlText(item.thumbnail)}" alt="" class="ll-aspect-box__content ll-listing-table__main-thumbnail-image">
                                        </div>
                                    </div>
                                    <div class="ll-listing-table__main-body">
                                        <div class="ll-listing-table__main-heading">${escapeHtmlText(item.title)}</div>
                                    </div>
                                </div>
                            `
                        },
                        {
                            property: 'type',
                            heading: 'Type',
                            renderCell: (item) => `<span class="ll-chip ${briefingTypeChipClassMap[item.type] || 'll-chip--default'}"><span class="material-symbols-outlined ll-chip__icon">${escapeHtmlText(briefingTypeIconMap[item.type] || 'label')}</span><span class="ll-chip__label">${escapeHtmlText(item.type)}</span></span>`
                        },
                        {
                            property: 'slidesCount',
                            heading: 'Content',
                            renderCell: (item) => `<span>${escapeHtmlText(String(item.slidesCount))} ${item.slidesCount === 1 ? 'Slide' : 'Slides'}</span>`
                        },
                        {
                            property: 'updatedLabel',
                            heading: 'Last Updated',
                            renderCell: (item) => `<span>${escapeHtmlText(item.updatedLabel)}</span>`
                        }
                    ]
                },
                grid: {
                    enabled: true,
                    containerId: 'cl-listing-briefing-grid-host',
                    itemActionsHostSelector: '.ll-card__header-actions',
                    columns: 6,
                    gap: 4,
                    defaultView: 'list',
                    renderCard: (item) => `
                        <div class="ll-aspect-box ll-aspect-box--9-16">
                            <img src="${escapeHtmlText(item.thumbnail)}" alt="" class="ll-aspect-box__content ll-card__thumbnail">
                            <div class="ll-card__media-scrim"></div>
                            <div class="ll-card__header ll-card__header--media-overlay">
                                <div class="ll-card__header-leading">
                                    <span class="ll-chip ${briefingTypeChipClassMap[item.type] || 'll-chip--default'}">
                                        <span class="material-symbols-outlined ll-chip__icon">${escapeHtmlText(briefingTypeIconMap[item.type] || 'label')}</span>
                                        <span class="ll-chip__label">${escapeHtmlText(item.type)}</span>
                                    </span>
                                </div>
                                <div class="ll-card__header-actions"></div>
                            </div>
                            <div class="ll-card__media-footer">
                                <div class="ll-card__media-title">${escapeHtmlText(item.title)}</div>
                                <div class="ll-card__media-meta">${item.state === 'expired' ? `Expired ${escapeHtmlText(item.updatedLabel)}` : escapeHtmlText(item.updatedLabel)}</div>
                            </div>
                        </div>
                    `
                },
                controls: {
                    searchInputId: 'cl-listing-briefing-search-input',
                    searchClearButtonId: 'cl-listing-briefing-search-clear',
                    clearAllFiltersButtonId: 'cl-listing-briefing-clear-filters-btn',
                    sortDropdown: {
                        buttonId: 'cl-listing-briefing-sort-btn',
                        menuId: 'cl-listing-briefing-sort-menu',
                        selectedValueSelector: '.ll-dropdown__selected-value',
                        align: 'right',
                        dropdownIcon: 'sort',
                        showLabel: false,
                        dropdownLabel: 'Sort',
                        emptySelectionLabel: 'Sort'
                    },
                    viewToggle: {
                        listButtonId: 'cl-listing-briefing-view-list-btn',
                        gridButtonId: 'cl-listing-briefing-view-grid-btn'
                        },
                    emptyStateText: {
                        text: 'No matching Briefings.',
                        icon: 'slideshow'
                    }
                },
                search: {
                    fields: ['title', 'type', 'state', 'updatedLabel']
                },
                filters: [
                    {
                        key: 'state',
                        label: 'State',
                        type: 'toggle',
                        property: 'state',
                        defaultValue: 'active',
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'expired', label: 'Expired' }
                        ],
                        toggle: {
                            buttonIdsByValue: {
                                active: 'cl-listing-briefing-state-active-btn',
                                expired: 'cl-listing-briefing-state-expired-btn'
                            }
                        }
                    },
                    {
                        key: 'type',
                        label: 'Type',
                        type: 'multiple',
                        property: 'type',
                        dropdown: {
                            buttonId: 'cl-listing-briefing-type-filter-btn',
                            menuId: 'cl-listing-briefing-type-filter-menu',
                            selectedValueSelector: '.ll-dropdown__selected-value',
                            dropdownLabel: 'Type',
                            emptySelectionLabel: 'Type'
                        },
                        options: [
                            { value: 'Alert', label: 'Alert' },
                            { value: 'Report', label: 'Report' },
                            { value: 'Feedback', label: 'Feedback' },
                            { value: 'Update', label: 'Update' }
                        ]
                    }
                ],
                sorts: [
                    { value: 'last-updated', label: 'Last Updated', property: 'updatedRank', propertyType: 'number', order: 'desc' },
                    { value: 'title-asc', label: 'Title', property: 'title', propertyType: 'string', order: 'asc', description: 'A-Z' },
                    { value: 'title-desc', label: 'Title', property: 'title', propertyType: 'string', order: 'desc', description: 'Z-A' }
                ],
                itemClick: {
                    type: 'link',
                    getHref: (item) => item.href
                },
                itemActions: {
                    items: [
                        {
                            type: 'dropdown',
                            options: [
                                { value: 'view-details', label: 'View Details' },
                                { value: 'share', label: 'Share' },
                                {
                                    value: 'delete',
                                    label: 'Delete',
                                    danger: true,
                                    onSelect: ({ removeItem }) => removeItem()
                                }
                            ]
                        }
                    ]
                }
            });

            components.initListingModule({
                rootId: 'cl-listing-only-module',
                allowUnsafeHtml: true,
                items: listingOnlyItems,
                idKey: 'id',
                table: {
                    containerId: 'cl-listing-only-table-host',
                    columns: [
                        {
                            property: 'name',
                            heading: 'Name',
                            isMain: true,
                            headerClassName: 'll-listing-table__column-main',
                            cellClassName: 'll-listing-table__column-main',
                            renderCell: (item) => `
                                <div class="ll-listing-table__main">
                                    <div class="ll-listing-table__main-body">
                                        <div class="ll-listing-table__main-heading">${escapeHtmlText(item.name)}</div>
                                        <div class="ll-listing-table__main-meta-row">
                                            <span class="ll-listing-table__main-meta-item">${escapeHtmlText(item.category)}</span>
                                            <span class="ll-listing-table__main-meta-item">${item.hasManualTrigger ? 'Manual Trigger' : 'Scheduled'}</span>
                                        </div>
                                    </div>
                                </div>
                            `
                        },
                        { property: 'owner', heading: 'Owner' },
                        { property: 'status', heading: 'Status' },
                        {
                            property: 'updatedAt',
                            heading: 'Last Updated',
                            renderCell: (item) => escapeHtmlText(formatDate(item.updatedAt))
                        }
                    ]
                },
                grid: {
                    enabled: true,
                    containerId: 'cl-listing-only-grid-host',
                    columns: 4,
                    gap: 6,
                    defaultView: 'list',
                    renderCard: (item) => `
                        <div class="ll-aspect-box ll-aspect-box--16-9">
                            <img src="${escapeHtmlText(item.thumbnail)}" alt="" class="ll-aspect-box__content ll-card__thumbnail">
                            <div class="ll-card__header ll-card__header--media-overlay">
                                <div class="ll-card__header-actions"></div>
                            </div>
                        </div>
                        <div class="ll-card__content">
                            <div class="ll-card__content-heading">${escapeHtmlText(item.name)}</div>
                            <div class="ll-card__meta-row">
                                <div class="ll-card__meta-group">
                                    <span class="ll-card__meta-item">${escapeHtmlText(item.owner)}</span>
                                </div>
                                <div class="ll-card__meta-group">
                                    <span class="ll-card__meta-item">${item.hasManualTrigger ? 'Manual Trigger' : 'Scheduled'}</span>
                                </div>
                            </div>
                        </div>
                    `
                },
                controls: {
                    searchInputId: 'cl-listing-only-search-input',
                    searchClearButtonId: 'cl-listing-only-search-clear',
                    clearAllFiltersButtonId: 'cl-listing-only-clear-filters-btn',
                    viewToggle: {
                        listButtonId: 'cl-listing-only-view-list-btn',
                        gridButtonId: 'cl-listing-only-view-grid-btn'
                    },
                    sortDropdown: {
                        buttonId: 'cl-listing-only-sort-btn',
                        menuId: 'cl-listing-only-sort-menu',
                        selectedValueSelector: '.ll-dropdown__selected-value',
                        align: 'right',
                        dropdownIcon: 'sort',
                        showLabel: false,
                        dropdownLabel: 'Sort',
                        emptySelectionLabel: 'Sort'
                        },
                    emptyStateText: {
                        text: 'No matching Workflows.',
                        icon: 'account_tree'
                    }
                },
                search: {
                    fields: ['name', 'category', 'owner', 'status']
                },
                filters: [
                    {
                        key: 'category',
                        label: 'Category',
                        type: 'multiple',
                        property: 'category',
                        dropdown: {
                            buttonId: 'cl-listing-only-category-filter-btn',
                            menuId: 'cl-listing-only-category-filter-menu',
                            selectedValueSelector: '.ll-dropdown__selected-value',
                            dropdownLabel: 'Category',
                            clearable: true,
                            emptySelectionLabel: 'Category'
                        },
                        options: [
                            { value: 'Planning', label: 'Planning' },
                            { value: 'Risk', label: 'Risk' },
                            { value: 'Reporting', label: 'Reporting' },
                            { value: 'Analysis', label: 'Analysis' }
                        ]
                    },
                    {
                        key: 'owner',
                        label: 'Owner',
                        type: 'multiple',
                        property: 'owner',
                        dropdown: {
                            buttonId: 'cl-listing-only-owner-filter-btn',
                            menuId: 'cl-listing-only-owner-filter-menu',
                            selectedValueSelector: '.ll-dropdown__selected-value',
                            dropdownLabel: 'Owner',
                            clearable: true,
                            emptySelectionLabel: 'Owner'
                        },
                        options: [
                            { value: 'Maya Ali', label: 'Maya Ali' },
                            { value: 'Jon Park', label: 'Jon Park' },
                            { value: 'Ari Chen', label: 'Ari Chen' },
                            { value: 'Priya Das', label: 'Priya Das' },
                            { value: 'Kai Morgan', label: 'Kai Morgan' }
                        ]
                    },
                    {
                        key: 'status',
                        label: 'Status',
                        type: 'multiple',
                        property: 'status',
                        dropdown: {
                            buttonId: 'cl-listing-only-status-filter-btn',
                            menuId: 'cl-listing-only-status-filter-menu',
                            selectedValueSelector: '.ll-dropdown__selected-value',
                            dropdownLabel: 'Status',
                            clearable: true,
                            emptySelectionLabel: 'Status'
                        },
                        options: [
                            { value: 'Open', label: 'Open' },
                            { value: 'In Review', label: 'In Review' },
                            { value: 'Closed', label: 'Closed' }
                        ]
                    }
                ],
                sorts: [
                    { value: 'updated-desc', label: 'Last Updated', property: 'updatedAt', propertyType: 'date', order: 'desc' },
                    { value: 'name-asc', label: 'Name', property: 'name', propertyType: 'string', order: 'asc', description: 'A-Z' },
                    { value: 'name-desc', label: 'Name', property: 'name', propertyType: 'string', order: 'desc', description: 'Z-A' }
                ],
                itemClick: {
                    type: 'callback',
                    onClick: ({ item }) => {
                        console.log('Workflow row clicked:', item);
                    }
                },
                itemActions: {
                    items: [
                        {
                            type: 'button',
                            label: 'Execute Workflow',
                            icon: 'play_arrow',
                            className: 'll-btn ll-btn--sm ll-btn--primary',
                            when: ({ item }) => Boolean(item && item.hasManualTrigger),
                            onClick: ({ item }) => {
                                console.log('Execute workflow:', item);
                            }
                        },
                        {
                            type: 'dropdown',
                            options: [
                                {
                                    value: 'execute',
                                    label: 'Execute Workflow',
                                    when: ({ item }) => Boolean(item && item.hasManualTrigger)
                                },
                                {
                                    value: 'open',
                                    label: 'Open Workflow'
                                },
                                { value: 'assign', label: 'Assign' },
                                {
                                    value: 'delete',
                                    label: 'Delete',
                                    danger: true,
                                    onSelect: ({ removeItem }) => removeItem()
                                }
                            ]
                        }
                    ]
                }
            });

            const selectionOutput = document.getElementById('cl-listing-selection-output');
            const renderSelectionOutput = (selectionApi, label = '') => {
                if (!selectionOutput) return;
                const selectedItem = selectionApi && typeof selectionApi.getSelectedItem === 'function'
                    ? selectionApi.getSelectedItem()
                    : null;
                if (!selectedItem) {
                    selectionOutput.textContent = 'No item selected.';
                    return;
                }
                const header = label ? `${label}\n` : '';
                selectionOutput.textContent = `${header}${JSON.stringify(selectedItem, null, 2)}`;
            };

            const listingSelectionApi = components.initListingModule({
                rootId: 'cl-listing-selection-module',
                allowUnsafeHtml: true,
                items: listingSelectionItems,
                idKey: 'id',
                table: {
                    containerId: 'cl-listing-selection-table-host',
                    columns: [
                        {
                            property: 'title',
                            heading: 'Item',
                            isMain: true,
                            headerClassName: 'll-listing-table__column-main',
                            cellClassName: 'll-listing-table__column-main',
                            renderCell: (item) => `
                                <div class="ll-listing-table__main">
                                    <div class="ll-listing-table__main-thumbnail">
                                        <div class="ll-aspect-box ll-aspect-box--16-9">
                                            <img src="${escapeHtmlText(item.thumbnail)}" alt="" class="ll-aspect-box__content ll-listing-table__main-thumbnail-image">
                                        </div>
                                    </div>
                                    <div class="ll-listing-table__main-body">
                                        <div class="ll-listing-table__main-heading">${escapeHtmlText(item.title)}</div>
                                        <div class="ll-listing-table__main-meta-row">
                                            <span class="ll-listing-table__main-meta-item">${escapeHtmlText(item.owner)}</span>
                                            <span class="ll-listing-table__main-meta-item">${escapeHtmlText(item.category)}</span>
                                        </div>
                                    </div>
                                </div>
                            `
                        },
                        { property: 'status', heading: 'Status' },
                        {
                            property: 'updatedAt',
                            heading: 'Last Updated',
                            renderCell: (item) => escapeHtmlText(formatDate(item.updatedAt))
                        }
                    ]
                },
                grid: {
                    enabled: true,
                    containerId: 'cl-listing-selection-grid-host',
                    columns: 4,
                    gap: 6,
                    defaultView: 'list',
                    renderCard: (item) => `
                        <div class="ll-aspect-box ll-aspect-box--16-9">
                            <img src="${escapeHtmlText(item.thumbnail)}" alt="" class="ll-aspect-box__content ll-card__thumbnail">
                        </div>
                        <div class="ll-card__content">
                            <div class="ll-card__content-heading">${escapeHtmlText(item.title)}</div>
                            <div class="ll-card__meta-row">
                                <div class="ll-card__meta-group">
                                    <span class="ll-card__meta-item">${escapeHtmlText(item.owner)}</span>
                                </div>
                                <div class="ll-card__meta-group">
                                    <span class="ll-card__meta-item">${escapeHtmlText(item.status)}</span>
                                </div>
                            </div>
                        </div>
                    `
                },
                controls: {
                    searchInputId: 'cl-listing-selection-search-input',
                    searchClearButtonId: 'cl-listing-selection-search-clear',
                    clearAllFiltersButtonId: 'cl-listing-selection-clear-filters-btn',
                    sortDropdown: {
                        buttonId: 'cl-listing-selection-sort-btn',
                        menuId: 'cl-listing-selection-sort-menu',
                        selectedValueSelector: '.ll-dropdown__selected-value',
                        align: 'right',
                        dropdownIcon: 'sort',
                        showLabel: false,
                        dropdownLabel: 'Sort',
                        emptySelectionLabel: 'Sort'
                    },
                    viewToggle: {
                        listButtonId: 'cl-listing-selection-view-list-btn',
                        gridButtonId: 'cl-listing-selection-view-grid-btn'
                    },
                    emptyStateText: {
                        text: 'No matching selectable items.',
                        icon: 'checklist'
                    }
                },
                search: {
                    fields: ['title', 'owner', 'category', 'status']
                },
                filters: [
                    {
                        key: 'status',
                        label: 'Status',
                        type: 'multiple',
                        property: 'status',
                        dropdown: {
                            buttonId: 'cl-listing-selection-status-filter-btn',
                            menuId: 'cl-listing-selection-status-filter-menu',
                            selectedValueSelector: '.ll-dropdown__selected-value',
                            dropdownLabel: 'Status',
                            emptySelectionLabel: 'Status'
                        },
                        options: [
                            { value: 'Draft', label: 'Draft' },
                            { value: 'In Review', label: 'In Review' },
                            { value: 'Published', label: 'Published' }
                        ]
                    }
                ],
                sorts: [
                    { value: 'updated-desc', label: 'Last Updated', property: 'updatedAt', propertyType: 'date', order: 'desc' },
                    { value: 'title-asc', label: 'Title', property: 'title', propertyType: 'string', order: 'asc', description: 'A-Z' },
                    { value: 'title-desc', label: 'Title', property: 'title', propertyType: 'string', order: 'desc', description: 'Z-A' }
                ],
                itemClick: {
                    type: 'selection',
                    onSelectionChange: ({ selectedItem }) => {
                        if (selectedItem) {
                            renderSelectionOutput(listingSelectionApi, 'Selection changed:');
                        } else {
                            renderSelectionOutput(listingSelectionApi);
                        }
                    }
                }
            });

            const readSelectionButton = document.getElementById('cl-listing-selection-read-btn');
            if (readSelectionButton && readSelectionButton.dataset.listingSelectionReadBound !== 'true') {
                readSelectionButton.addEventListener('click', () => {
                    renderSelectionOutput(listingSelectionApi, 'Read from instance:');
                });
                readSelectionButton.dataset.listingSelectionReadBound = 'true';
            }

            const clearSelectionButton = document.getElementById('cl-listing-selection-clear-btn');
            if (clearSelectionButton && clearSelectionButton.dataset.listingSelectionClearBound !== 'true') {
                clearSelectionButton.addEventListener('click', () => {
                    if (listingSelectionApi && typeof listingSelectionApi.clearSelection === 'function') {
                        listingSelectionApi.clearSelection();
                    }
                    renderSelectionOutput(listingSelectionApi);
                });
                clearSelectionButton.dataset.listingSelectionClearBound = 'true';
            }
            renderSelectionOutput(listingSelectionApi);

            components.initListingModule({
                rootId: 'cl-listing-empty-module',
                allowUnsafeHtml: true,
                items: [],
                idKey: 'id',
                table: {
                    containerId: 'cl-listing-empty-table-host',
                    columns: [
                        { property: 'title', heading: 'Item', isMain: true, headerClassName: 'll-listing-table__column-main', cellClassName: 'll-listing-table__column-main' },
                        { property: 'status', heading: 'Status' },
                        { property: 'updatedAt', heading: 'Last Updated', renderCell: (item) => escapeHtmlText(formatDate(item.updatedAt)) }
                    ]
                },
                grid: {
                    enabled: true,
                    containerId: 'cl-listing-empty-grid-host',
                    columns: 4,
                    gap: 6,
                    defaultView: 'grid',
                    renderCard: (item) => `
                        <div class="ll-card__content">
                            <div class="ll-card__content-heading">${escapeHtmlText(item.title || '')}</div>
                            <div class="ll-card__meta-row">
                                <div class="ll-card__meta-group">
                                    <span class="ll-card__meta-item">${escapeHtmlText(item.owner || '')}</span>
                                </div>
                                <div class="ll-card__meta-group">
                                    <span class="ll-card__meta-item">${escapeHtmlText(item.status || '')}</span>
                                </div>
                            </div>
                        </div>
                    `
                },
                controls: {
                    searchInputId: 'cl-listing-empty-search-input',
                    clearAllFiltersButtonId: 'cl-listing-empty-clear-filters-btn',
                    viewToggle: {
                        listButtonId: 'cl-listing-empty-view-list-btn',
                        gridButtonId: 'cl-listing-empty-view-grid-btn'
                    },
                    sortDropdown: {
                        buttonId: 'cl-listing-empty-sort-btn',
                        menuId: 'cl-listing-empty-sort-menu',
                        selectedValueSelector: '.ll-dropdown__selected-value',
                        align: 'right',
                        dropdownIcon: 'sort',
                        showLabel: false,
                        dropdownLabel: 'Sort',
                        emptySelectionLabel: 'Sort'
                    },
                    emptyStateText: {
                        text: 'No matching items.',
                        icon: 'search_off'
                    },
                    emptyStateNoItemsText: {
                        text: 'No items added.',
                        icon: 'inbox',
                        button: {
                            label: 'Create Item',
                            icon: 'add',
                            className: 'll-btn ll-btn--outline-default'
                        }
                    }
                },
                search: {
                    fields: ['title', 'owner', 'status']
                },
                filters: [
                    {
                        key: 'status',
                        label: 'Status',
                        type: 'multiple',
                        property: 'status',
                        dropdown: {
                            buttonId: 'cl-listing-empty-status-filter-btn',
                            menuId: 'cl-listing-empty-status-filter-menu',
                            selectedValueSelector: '.ll-dropdown__selected-value',
                            dropdownLabel: 'Status',
                            emptySelectionLabel: 'Status'
                        },
                        options: [
                            { value: 'Draft', label: 'Draft' },
                            { value: 'In Review', label: 'In Review' },
                            { value: 'Published', label: 'Published' }
                        ]
                    }
                ],
                sorts: [
                    { value: 'updated-desc', label: 'Last Updated', property: 'updatedAt', propertyType: 'date', order: 'desc' },
                    { value: 'title-asc', label: 'Title', property: 'title', propertyType: 'string', order: 'asc', description: 'A-Z' },
                    { value: 'title-desc', label: 'Title', property: 'title', propertyType: 'string', order: 'desc', description: 'Z-A' }
                ]
            });

            const openListingInModalButton = document.getElementById('cl-listing-in-modal-open-database-selection');
            if (openListingInModalButton && openListingInModalButton.dataset.listingInModalBound !== 'true') {
                openListingInModalButton.addEventListener('click', () => {
                    const listingInModalController = ensureListingInModalDatabaseController();
                    if (listingInModalController && typeof listingInModalController.open === 'function') {
                        listingInModalController.open();
                    }
                });
                openListingInModalButton.dataset.listingInModalBound = 'true';
            }

            listingTab.dataset.listingModuleDemosBound = 'true';
        }

        function initializeComponentLibraryDemoInstances() {
            const components = window.LlumenComponents;
            if (!components) return;
            const scrollComponentLibraryToTop = () => {
                window.scrollTo({ top: 0, behavior: 'auto' });
            };
            const resolveInitialComponentLibraryTabFromHash = () => {
                const hashTab = String(window.location.hash || '').replace(/^#/, '').trim();
                if (!hashTab) return '';
                const hasMatchingTab = Array.from(document.querySelectorAll('.ll-tabs-vertical [data-component-library-tab]'))
                    .some((button) => String(button.dataset.componentLibraryTab || '').trim() === hashTab);
                return hasMatchingTab ? hashTab : '';
            };
            const syncNoHoverForSelector = (selector, activeClassName) => {
                document.querySelectorAll(selector).forEach((button) => {
                    button.classList.toggle('ll-active', button.classList.contains(activeClassName));
                });
            };
            const syncVerticalTabButtonState = (selector, activeClassName) => {
                document.querySelectorAll(selector).forEach((button) => {
                    const isActive = button.classList.contains(activeClassName);
                    button.classList.toggle('ll-btn--flat-default', !isActive);
                    button.classList.toggle('ll-active', isActive);
                });
            };

            const componentLibraryTabsApi = components.initializeTabs({
                tabButtonSelector: '.ll-tabs-vertical [data-component-library-tab]',
                tabContentSelector: '.ll-tab-panel',
                tabValueDatasetKey: 'componentLibraryTab',
                tabContentIdPrefix: 'component-library-',
                tabContentIdSuffix: '-tab',
                activeClassName: 'll-btn--primary',
                initialTab: resolveInitialComponentLibraryTabFromHash(),
                onTabChange: (tabName) => {
                    if (String(tabName || '').trim()) {
                        const nextHash = `#${tabName}`;
                        if (window.location.hash !== nextHash) {
                            window.location.hash = tabName;
                        }
                    }
                    scrollComponentLibraryToTop();
                    syncVerticalTabButtonState('.ll-tabs-vertical [data-component-library-tab]', 'll-btn--primary');
                }
            });
            const syncComponentLibraryTabFromHash = () => {
                if (!componentLibraryTabsApi || typeof componentLibraryTabsApi.switchTab !== 'function') return;
                const hashTab = String(window.location.hash || '').replace(/^#/, '').trim();
                if (!hashTab) return;
                const matchingButton = document.querySelector(`.ll-tabs-vertical [data-component-library-tab="${hashTab}"]`);
                if (!matchingButton) return;
                componentLibraryTabsApi.switchTab(hashTab);
            };
            if (window.__componentLibraryHashSyncBound !== true) {
                window.addEventListener('hashchange', syncComponentLibraryTabFromHash);
                window.addEventListener('popstate', syncComponentLibraryTabFromHash);
                window.__componentLibraryHashSyncBound = true;
            }
            components.initializeTabs({
                tabButtonSelector: '.ll-tab-btn[data-normal-tabs-demo]',
                tabValueDatasetKey: 'normalTabsDemo',
                activeClassName: 'll-active',
                initialTab: 'option-1',
                onTabChange: () => {
                    syncNoHoverForSelector('.ll-tab-btn[data-normal-tabs-demo]', 'll-active');
                }
            });
            components.initializeTabs({
                tabButtonSelector: '.ll-segmented__btn[data-segmented-toggle-demo]',
                tabValueDatasetKey: 'segmentedToggleDemo',
                activeClassName: 'll-active',
                initialTab: 'option-1',
                onTabChange: () => {
                    syncNoHoverForSelector('.ll-segmented__btn[data-segmented-toggle-demo]', 'll-active');
                }
            });
            components.initializeTabs({
                tabButtonSelector: '.ll-segmented__btn[data-compact-segmented-toggle-demo]',
                tabValueDatasetKey: 'compactSegmentedToggleDemo',
                activeClassName: 'll-active',
                initialTab: 'option-1',
                onTabChange: () => {
                    syncNoHoverForSelector('.ll-segmented__btn[data-compact-segmented-toggle-demo]', 'll-active');
                }
            });
            components.initializeTabs({
                tabButtonSelector: '.ll-tabs-vertical [data-vertical-tabs-demo]',
                tabValueDatasetKey: 'verticalTabsDemo',
                activeClassName: 'll-btn--primary',
                initialTab: 'overview',
                onTabChange: () => {
                    syncVerticalTabButtonState('.ll-tabs-vertical [data-vertical-tabs-demo]', 'll-btn--primary');
                }
            });
            components.initializeTabs({
                tabButtonSelector: '.ll-tab-btn[data-cl-listing-subtab]',
                tabContentSelector: '.cl-listing-subtab-panel',
                tabValueDatasetKey: 'clListingSubtab',
                tabContentIdPrefix: 'cl-listing-subtab-',
                tabContentIdSuffix: '-panel',
                activeClassName: 'll-active',
                initialTab: 'story',
                onTabChange: () => {
                    syncNoHoverForSelector('.ll-tab-btn[data-cl-listing-subtab]', 'll-active');
                }
            });
            setupComponentLibraryTabsAndTogglesDemo();
            setupComponentLibraryHorizontalCarouselDemos(components);
            components.initializeTreeView();
            setupComponentLibraryTooltipDemos(components);
            setupComponentLibrarySpinnerDemos(components);
            setupComponentLibraryAlertDemos(components);
            setupComponentLibraryToastDemos(components);
            const openManagedModal = createComponentLibraryManagedModalOpener(components);
            setupComponentLibraryModalDemos(components, openManagedModal);
            if (typeof window.setupComponentLibraryDragDropDemos === 'function') {
                window.setupComponentLibraryDragDropDemos(components, openManagedModal);
            }
            setupComponentLibraryListingModuleDemos(components);

            components.initializeTextCounter(
                'component-library-input-text-single',
                'component-library-input-text-single-counter'
            );
            components.initializeTextCounter(
                'component-library-input-text-multiple',
                'component-library-input-text-multiple-counter'
            );

            components.initializeNumberInput('component-library-number-input', {
                step: '1',
                min: 0,
                max: 20
            });
            components.initializeSearchInput('component-library-search-input', 'component-library-search-clear');
            components.initializeDatetimeInput('component-library-datetime-input', {
                clearable: true
            });

            components.initializePortaledDropdown({
                buttonId: 'component-library-dropdown-btn',
                menuId: 'component-library-dropdown-menu',
                selectedValueSelector: '.ll-dropdown__selected-value',
                datasetFlag: 'dropdownBound',
                menuType: 'selection',
                matchTriggerWidth: true,
                emptySelectionLabel: 'Select option'
            });

            components.initializePortaledDropdown({
                buttonId: 'component-library-dropdown-preselected-btn',
                menuId: 'component-library-dropdown-preselected-menu',
                selectedValueSelector: '.ll-dropdown__selected-value',
                datasetFlag: 'preselectedDropdownBound',
                menuType: 'selection',
                defaultValue: 'Option 3',
                matchTriggerWidth: true,
                emptySelectionLabel: 'Select option'
            });

            components.initializePortaledDropdown({
                buttonId: 'component-library-dropdown-grouped-btn',
                menuId: 'component-library-dropdown-grouped-menu',
                selectedValueSelector: '.ll-dropdown__selected-value',
                datasetFlag: 'groupedDropdownBound',
                menuType: 'selection',
                matchTriggerWidth: true,
                emptySelectionLabel: 'Select option',
                groupedOptions: [
                    {
                        heading: 'Marketing',
                        options: [
                            { label: 'Newsletter', value: 'email_newsletter' },
                            { label: 'Re-engagement', value: 'email_reengagement' },
                            { label: 'Promotion', value: 'email_promotion', description: 'Limited-time campaigns' }
                        ]
                    },
                    {
                        heading: 'CRM',
                        options: [
                            { label: 'Import CSV', value: 'crm_import_csv' },
                            { label: 'Sync Segment', value: 'crm_sync_segment' }
                        ]
                    },
                    {
                        heading: 'Operations',
                        options: [
                            { label: 'Run Health Check', value: 'run_health_check' },
                            { label: 'Send Summary', value: 'ops_send_summary' }
                        ]
                    }
                ]
            });

            components.initializePortaledDropdown({
                buttonId: 'component-library-dropdown-filter-input-btn',
                menuId: 'component-library-dropdown-filter-input-menu',
                selectedValueSelector: '.ll-dropdown__selected-value',
                datasetFlag: 'filterInputDropdownBound',
                menuType: 'selection',
                selectionType: 'multiple',
                dropdownIcon: 'filter_alt',
                dropdownLabel: 'Status',
                matchTriggerWidth: true,
                emptySelectionLabel: 'Status'
            });

            components.initializePortaledDropdown({
                buttonId: 'component-library-dropdown-filter-button-btn',
                menuId: 'component-library-dropdown-filter-button-menu',
                selectedValueSelector: '.ll-dropdown__selected-value',
                datasetFlag: 'filterButtonDropdownBound',
                menuType: 'selection',
                selectionType: 'multiple',
                dropdownIcon: 'filter_alt',
                dropdownLabel: 'Status',
                emptySelectionLabel: 'Status',
                matchTriggerWidth: false
            });

            components.initializePortaledDropdown({
                buttonId: 'component-library-multi-dropdown-btn',
                menuId: 'component-library-multi-dropdown-menu',
                selectedValueSelector: '.ll-dropdown__selected-value',
                datasetFlag: 'multiLevelDropdownBound',
                menuType: 'selection',
                emptySelectionLabel: 'Select option',
                multiLevelConfig: {
                    allowEmptySelection: true,
                    showTopLevelPrefixInSelection: true,
                    items: [
                        {
                            label: 'Email',
                            icon: 'mail',
                            children: [
                                {
                                    label: 'Campaigns',
                                    children: [
                                        { label: 'Newsletter', value: 'email_newsletter' },
                                        { label: 'Re-engagement', value: 'email_reengagement' }
                                    ]
                                },
                                {
                                    label: 'Transactional',
                                    children: [
                                        { label: 'Order Confirmation', value: 'email_order_confirmation' },
                                        { label: 'Password Reset', value: 'email_password_reset' }
                                    ]
                                },
                                { label: 'Quick Send', value: 'email_quick_send' }
                            ]
                        },
                        {
                            label: 'CRM',
                            icon: 'database',
                            children: [
                                {
                                    label: 'Contacts',
                                    children: [
                                        { label: 'Import CSV', value: 'crm_import_csv' },
                                        { label: 'Sync Segment', value: 'crm_sync_segment' }
                                    ]
                                },
                                {
                                    label: 'Deals',
                                    children: [
                                        { label: 'Create Follow-up', value: 'crm_create_followup' },
                                        { label: 'Update Stage', value: 'crm_update_stage' }
                                    ]
                                }
                            ]
                        },
                        { label: 'Run Health Check', value: 'run_health_check', icon: 'health_and_safety' }
                    ]
                }
            });

            components.initializePortaledDropdown({
                buttonId: 'component-library-operators-dropdown-btn',
                menuId: 'component-library-operators-dropdown-menu',
                selectedValueSelector: '.ll-dropdown__selected-value',
                datasetFlag: 'operatorsDropdownBound',
                menuType: 'selection',
                defaultValue: 'string__is_equal_to',
                emptySelectionLabel: 'Select operator',
                multiLevelConfig: components.createOperatorsDropdownConfig({
                    showTopLevelPrefixInSelection: true
                })
            });

            const componentLibraryRadioSelectionInfoEl = document.getElementById('component-library-radio-selection-value');
            const componentLibraryRadioSelectionItems = [
                { value: 'overview', label: 'Overview', icon: 'space_dashboard' },
                { value: 'briefings', label: 'Briefings', icon: 'description' },
                { value: 'stories', label: 'Stories', icon: 'auto_stories' },
                { value: 'dashboards', label: 'Dashboards', icon: 'insights' }
            ];
            components.initializeRadioSelection({
                rootId: 'component-library-radio-selection-demo',
                items: componentLibraryRadioSelectionItems,
                value: 'overview',
                buttonBaseClassName: 'll-btn ll-radio-selection__btn',
                buttonInactiveClassName: 'll-btn--outline-default',
                buttonActiveClassName: 'll-btn--primary',
                onValueChange: (nextValue, meta = {}) => {
                    if (!componentLibraryRadioSelectionInfoEl) return;
                    const selectedItem = meta.item || componentLibraryRadioSelectionItems.find((item) => item.value === nextValue);
                    const selectedLabel = selectedItem ? selectedItem.label : nextValue;
                    componentLibraryRadioSelectionInfoEl.textContent = `Selected: ${selectedLabel}`;
                }
            });

            const componentLibraryResolutionSelectionInfoEl = document.getElementById('component-library-radio-selection-resolution-value');
            const componentLibraryResolutionItems = [
                { value: '8k', label: '8K', meta: '7680 × 4320' },
                { value: '6k', label: '6K', meta: '6144 × 3456' },
                { value: '5k', label: '5K', meta: '5120 × 2880' },
                { value: '4k', label: '4K UHD', meta: '3840 × 2160' },
                { value: 'qhd', label: 'QHD', meta: '2560 × 1440' },
                { value: 'fhd', label: 'Full HD', meta: '1920 × 1080' },
                { value: 'hd', label: 'HD', meta: '1280 × 720' },
                { value: 'custom', label: 'Custom', meta: 'Manual resolution entry' }
            ];
            components.initializeRadioSelection({
                rootId: 'component-library-radio-selection-resolution-demo',
                rootClassName: 'll-radio-selection--grid ll-radio-selection--grid-cols-4',
                items: componentLibraryResolutionItems,
                value: '8k',
                buttonBaseClassName: 'll-btn ll-radio-selection__btn ll-btn--auto-height',
                buttonInactiveClassName: 'll-btn--outline-default',
                buttonActiveClassName: 'll-btn--primary',
                itemButtonClassName: 'll-radio-selection__btn--metadata',
                itemTemplate: (item, context) => {
                    const escapedLabel = context.escapeHtml(item.label || '');
                    const escapedMeta = context.escapeHtml(item.meta || '');
                    return `
                        <span class="ll-radio-selection__option-content">
                            <span class="ll-radio-selection__option-title">${escapedLabel}</span>
                            <span class="ll-radio-selection__option-meta">${escapedMeta}</span>
                        </span>
                    `;
                },
                onValueChange: (nextValue, meta = {}) => {
                    if (!componentLibraryResolutionSelectionInfoEl) return;
                    const selectedItem = meta.item || componentLibraryResolutionItems.find((item) => item.value === nextValue);
                    const selectedLabel = selectedItem ? `${selectedItem.label} (${selectedItem.meta})` : nextValue;
                    componentLibraryResolutionSelectionInfoEl.textContent = `Selected: ${selectedLabel}`;
                }
            });

            components.initializePortaledDropdown({
                buttonId: 'component-library-dropdown-invalid-btn',
                menuId: 'component-library-dropdown-invalid-menu',
                selectedValueSelector: '.ll-dropdown__selected-value',
                datasetFlag: 'invalidDropdownBound',
                menuType: 'selection',
                matchTriggerWidth: true,
                emptySelectionLabel: 'Select option'
            });

            components.initializePortaledDropdown({
                buttonId: 'component-library-button-group-dropdown-btn',
                menuId: 'component-library-button-group-dropdown-menu',
                datasetFlag: 'buttonGroupDropdownBound',
                align: 'right',
                matchTriggerWidth: false
            });

            components.initializePortaledDropdown({
                buttonId: 'component-library-card-header-actions-btn',
                menuId: 'component-library-card-header-actions-menu',
                datasetFlag: 'cardHeaderActionsDropdownBound',
                align: 'right',
                matchTriggerWidth: false
            });

            components.initializePortaledDropdown({
                buttonId: 'component-library-media-briefing-hero-actions-btn',
                menuId: 'component-library-media-briefing-hero-actions-menu',
                datasetFlag: 'mediaBriefingHeroActionsDropdownBound',
                align: 'right',
                matchTriggerWidth: false
            });

            components.initializePortaledDropdown({
                buttonId: 'component-library-media-story-card-actions-btn',
                menuId: 'component-library-media-story-card-actions-menu',
                datasetFlag: 'mediaStoryCardActionsDropdownBound',
                align: 'right',
                matchTriggerWidth: false
            });

            components.initializeExpressionDropSourceTree({
                treeRootIds: [
                    'component-library-expression-drop-tree',
                    'node-config-input-content-schema',
                    'node-config-input-content-table',
                    'node-config-input-content-json',
                    'node-config-input-content-global-vars'
                ],
                rootPathTransformers: {
                    'component-library-expression-drop-tree': (path) => {
                        if (/^\$json(\.|\[)/.test(path) && !/^\$json\.object_\d+/.test(path)) {
                            return path.replace(/^\$json(?=\.|\[)/, '$json.object_1');
                        }
                        return path;
                    }
                }
            });

            const defaultSelectSourceJson = components.getExpressionSelectSourceJson();
            components.initializeExpressionEditor('component-library-expression-editor', {
                enableFixedSwitching: false
            });
            components.initializeExpressionEditor('component-library-expression-editor-validation', {
                enableFixedSwitching: false
            });
            components.initializeExpressionEditor('component-library-expression-editor-mode-switching', {
                enableFixedSwitching: true,
                mode: 'string',
                selectSourceJson: defaultSelectSourceJson
            });
            components.initializeExpressionEditor('component-library-expression-editor-single-object', {
                enableFixedSwitching: true,
                mode: 'string',
                includeGlobalSandboxDefinitions: false,
                selectSourceJson: defaultSelectSourceJson.slice(0, 1)
            });

            components.initializeExpressionModeToggle({
                editorId: 'component-library-expression-editor-mode-switching',
                buttonIds: {
                    string: 'component-library-expression-mode-string',
                    stringMultiline: 'component-library-expression-mode-string-multiline',
                    number: 'component-library-expression-mode-number',
                    datetime: 'component-library-expression-mode-datetime',
                    select: 'component-library-expression-mode-select'
                }
            });
            components.initializeExpressionModeToggle({
                editorId: 'component-library-expression-editor-single-object',
                buttonIds: {
                    string: 'component-library-expression-single-mode-string',
                    stringMultiline: 'component-library-expression-single-mode-string-multiline',
                    number: 'component-library-expression-single-mode-number',
                    datetime: 'component-library-expression-single-mode-datetime',
                    select: 'component-library-expression-single-mode-select'
                }
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeComponentLibraryDemoInstances, { once: true });
        } else {
            initializeComponentLibraryDemoInstances();
        }

    
