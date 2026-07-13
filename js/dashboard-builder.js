(function initDashboardBuilderPage(windowScope) {
    'use strict';

    const llc = windowScope.LlumenComponents;
    if (!llc) return;

    const createToast = typeof llc.createToast === 'function' ? llc.createToast : null;

    const componentTypeCatalog = [
        { type: 'metric', label: 'Metric', icon: 'analytics', description: 'Display a single KPI value.' },
        { type: 'bar-chart', label: 'Bar Chart', icon: 'bar_chart', description: 'Compare values across categories.' },
        { type: 'line-chart', label: 'Line Chart', icon: 'show_chart', description: 'Track trends over time.' },
        { type: 'table', label: 'Table', icon: 'table_chart', description: 'Present structured records.' },
        { type: 'pie-chart', label: 'Pie Chart', icon: 'pie_chart', description: 'Show proportional distributions.' },
        { type: 'map', label: 'Map', icon: 'map', description: 'Render geographic context and overlays.' }
    ];

    const componentMetaByType = componentTypeCatalog.reduce((acc, entry) => {
        acc[entry.type] = entry;
        return acc;
    }, {});

    function getDefaultTileSpanByType(componentType) {
        const type = String(componentType || '');
        if (type === 'table') return { colSpan: 2, rowSpan: 2 };
        if (type === 'metric' || type === 'bar-chart') return { colSpan: 1, rowSpan: 1 };
        return { colSpan: 1, rowSpan: 1 };
    }

    const builderState = {
        model: {
            mode: 'edit',
            content: {
                title: 'Global Operations Dashboard',
                ownerWorkspace: 'Finance',
                statusLabel: 'Draft',
                statusVariant: 'outline-default'
            },
            subContent: {
                label: 'Page',
                activeId: 'page-overview',
                items: [
                    { id: 'page-overview', label: 'Overview', contextType: 'grid' },
                    { id: 'page-risk', label: 'Risk & Alerts', contextType: 'grid' },
                    { id: 'page-ops', label: 'Operations', contextType: 'grid' }
                ]
            },
            controls: {
                theme: 'dark',
                columnCount: 6,
                filtersEnabled: false,
                adaptMode: false
            }
        },
        pageGridModels: {
            'page-overview': {
                columnCount: 6,
                tiles: [
                    { tileId: 'dash-overview-1', componentType: 'metric', colStart: 1, rowStart: 1, colSpan: 1, rowSpan: 1, zIndex: 1 },
                    { tileId: 'dash-overview-2', componentType: 'bar-chart', colStart: 3, rowStart: 1, colSpan: 1, rowSpan: 1, zIndex: 2 },
                    { tileId: 'dash-overview-3', componentType: 'table', colStart: 5, rowStart: 1, colSpan: 2, rowSpan: 2, zIndex: 3 }
                ]
            },
            'page-risk': {
                columnCount: 6,
                tiles: [
                    { tileId: 'dash-risk-1', componentType: 'line-chart', colStart: 1, rowStart: 1, colSpan: 3, rowSpan: 2, zIndex: 1 },
                    { tileId: 'dash-risk-2', componentType: 'metric', colStart: 4, rowStart: 1, colSpan: 3, rowSpan: 2, zIndex: 2 }
                ]
            },
            'page-ops': {
                columnCount: 6,
                tiles: [
                    { tileId: 'dash-ops-1', componentType: 'map', colStart: 1, rowStart: 1, colSpan: 4, rowSpan: 3, zIndex: 1 },
                    { tileId: 'dash-ops-2', componentType: 'metric', colStart: 5, rowStart: 1, colSpan: 2, rowSpan: 1, zIndex: 2 },
                    { tileId: 'dash-ops-3', componentType: 'table', colStart: 5, rowStart: 2, colSpan: 2, rowSpan: 2, zIndex: 3 }
                ]
            }
        },
        activeGridModelApi: null
    };

    function cloneModel(value) {
        try {
            return JSON.parse(JSON.stringify(value || {}));
        } catch (_e) {
            return {};
        }
    }

    function toast(title, message, state) {
        if (!createToast) return;
        createToast({
            title: String(title || ''),
            message: String(message || ''),
            state: state || 'info'
        });
    }

    function getCurrentPageId() {
        return String(builderState.model.subContent.activeId || '').trim();
    }

    function ensurePageModel(pageId) {
        const id = String(pageId || '').trim();
        if (!id) return null;
        if (!builderState.pageGridModels[id]) {
            builderState.pageGridModels[id] = {
                columnCount: Math.max(1, parseInt(builderState.model.controls.columnCount, 10) || 6),
                tiles: []
            };
        }
        return builderState.pageGridModels[id];
    }

    function renderGridTileFromModel(entry, index, doc) {
        const componentType = entry && entry.componentType ? String(entry.componentType) : 'metric';
        const meta = componentMetaByType[componentType] || componentMetaByType.metric;
        const tileId = entry && entry.tileId ? String(entry.tileId) : `dashboard-grid-${Date.now()}-${index}`;
        const defaultSpan = getDefaultTileSpanByType(componentType);
        const colSpan = Math.max(1, parseInt(entry && entry.colSpan, 10) || defaultSpan.colSpan);
        const rowSpan = Math.max(1, parseInt(entry && entry.rowSpan, 10) || defaultSpan.rowSpan);
        const colStart = Math.max(1, parseInt(entry && entry.colStart, 10) || 1);
        const rowStart = Math.max(1, parseInt(entry && entry.rowStart, 10) || 1);
        const title = String(entry && entry.title ? entry.title : meta.label);

        const tile = doc.createElement('article');
        tile.className = 'll-card ll-content-builder__grid-tile relative flex flex-col min-h-0';
        tile.id = tileId;
        tile.dataset.dashboardGridTileId = tileId;
        tile.dataset.dashboardGridComponentType = componentType;
        tile.dataset.colSpan = String(colSpan);
        tile.dataset.rowSpan = String(rowSpan);
        tile.style.gridColumn = `${colStart} / span ${colSpan}`;
        tile.style.gridRow = `${rowStart} / span ${rowSpan}`;
        if (entry && entry.zIndex != null && Number.isFinite(Number(entry.zIndex))) {
            tile.style.zIndex = String(entry.zIndex);
        }

        const menuButtonId = `${tileId}-menu-button`;
        const menuId = `${tileId}-menu`;
        tile.innerHTML = `
            <div class="ll-card__header">
                <div class="ll-card__title-section">
                    <div class="ll-card__title-wrap">
                        <span class="material-symbols-outlined ll-card__title-icon">${meta.icon}</span>
                        <h3 class="ll-card__title">${title}</h3>
                    </div>
                </div>
                <div class="ll-card__header-actions" data-dashboard-tile-actions>
                    <div class="ll-card__header-action">
                        <div class="ll-card__header-action-content">
                            <button type="button" class="ll-icon-btn" data-dashboard-grid-drag-handle aria-label="Drag component">
                                <span class="material-symbols-outlined ll-icon-btn__icon">drag_indicator</span>
                            </button>
                        </div>
                    </div>
                    <div class="ll-card__header-action">
                        <div class="ll-card__header-action-content">
                            <button type="button" class="ll-icon-btn" id="${menuButtonId}" data-dashboard-tile-menu-trigger aria-label="Component actions">
                                <span class="material-symbols-outlined ll-icon-btn__icon">more_vert</span>
                            </button>
                            <div id="${menuId}" class="hidden" data-dashboard-tile-menu data-dashboard-tile-id="${tileId}">
                                <button type="button" class="ll-dropdown__item ll-dropdown__item--dismiss-mouse-focus" data-value="configure">Configure</button>
                                <button type="button" class="ll-dropdown__item ll-dropdown__item--dismiss-mouse-focus" data-value="duplicate">Duplicate</button>
                                <button type="button" class="ll-dropdown__item ll-dropdown__item--dismiss-mouse-focus ll-dropdown__item--danger" data-value="remove">Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="ll-card__content flex-1 min-h-0">
                <div class="flex flex-col gap-2 items-center justify-center h-full">
                    <span class="material-symbols-outlined ll-empty__icon">${meta.icon}</span>
                    <p class="ll-empty__text">${meta.description}</p>
                </div>
            </div>
            <button type="button" class="ll-resize-handle--se" aria-label="Resize component"></button>
        `;
        return tile;
    }

    function wireTileMenus(surface, modelApi) {
        if (!surface || !modelApi) return;
        surface.querySelectorAll('[data-dashboard-tile-menu]').forEach((menuEl) => {
            const trigger = menuEl.parentElement ? menuEl.parentElement.querySelector('[data-dashboard-tile-menu-trigger]') : null;
            if (!trigger || menuEl.dataset.dropdownInit === 'true') return;
            menuEl.dataset.dropdownInit = 'true';
            if (!trigger.id) {
                trigger.id = `dashboard-tile-menu-trigger-${Math.floor(Math.random() * 1000000)}`;
            }
            if (!menuEl.id) {
                menuEl.id = `dashboard-tile-menu-${Math.floor(Math.random() * 1000000)}`;
            }
            llc.initializePortaledDropdown({
                buttonId: trigger.id,
                menuId: menuEl.id,
                align: 'right',
                menuType: 'action',
                onValueChange: ({ value }) => {
                    const action = String(value || '');
                    if (!action) return;
                    const tileId = String(menuEl.getAttribute('data-dashboard-tile-id') || '');
                    if (!tileId) return;
                    if (action === 'remove') {
                        const current = modelApi.getGridTilesModel();
                        const nextTiles = (current.tiles || []).filter((tile) => String(tile.tileId || '') !== tileId);
                        modelApi.applyGridTilesModel({ columnCount: current.columnCount, tiles: nextTiles });
                        const pageModel = ensurePageModel(getCurrentPageId());
                        if (pageModel) {
                            pageModel.tiles = nextTiles;
                        }
                        toast('Component removed', 'Tile was removed from this page.', 'info');
                        return;
                    }
                    if (action === 'duplicate') {
                        const current = modelApi.getGridTilesModel();
                        const source = (current.tiles || []).find((tile) => String(tile.tileId || '') === tileId);
                        if (!source) return;
                        const duplicate = {
                            ...source,
                            tileId: `${source.tileId}-copy-${Math.floor(Math.random() * 1000)}`,
                            rowStart: Math.max(1, parseInt(source.rowStart, 10) || 1) + 1
                        };
                        const nextTiles = (current.tiles || []).concat([duplicate]);
                        modelApi.applyGridTilesModel({ columnCount: current.columnCount, tiles: nextTiles });
                        const pageModel = ensurePageModel(getCurrentPageId());
                        if (pageModel) {
                            pageModel.tiles = nextTiles;
                        }
                        return;
                    }
                    toast('Simulated action', `${action} is not implemented in this prototype.`, 'info');
                }
            });
        });
    }

    function initializeGridContext() {
        const surface = document.getElementById('dashboard-grid-surface');
        const host = document.getElementById('dashboard-grid-host');
        if (!surface) return;

        const modelApi = llc.initGridTileModelContext({
            gridElement: surface,
            tileSelector: '.ll-content-builder__grid-tile',
            resizeHandleSelector: '.ll-resize-handle--se',
            tileMoveHandleSelector: '[data-dashboard-grid-drag-handle]',
            tileMoveDragIgnoreSelector: '.ll-resize-handle--se',
            tileMoveGhostStripSelector: '.ll-resize-handle--se',
            tileMoveMaxGridRow: 64,
            tileMoveScrollRoot: host || surface,
            maxRowSpan: 6,
            getTileId: (el) => String(el.getAttribute('data-dashboard-grid-tile-id') || el.id || ''),
            readTileExtras: (el) => {
                const type = el.getAttribute('data-dashboard-grid-component-type');
                return type ? { componentType: String(type) } : {};
            },
            renderGridTile: renderGridTileFromModel,
            onAfterSync: (syncModel) => {
                wireTileMenus(surface, modelApi);
                const pageModel = ensurePageModel(getCurrentPageId());
                if (pageModel) {
                    pageModel.columnCount = Math.max(1, parseInt(syncModel.columnCount, 10) || 6);
                    pageModel.tiles = Array.isArray(syncModel.tiles) ? syncModel.tiles.slice() : [];
                }
            }
        });

        builderState.activeGridModelApi = modelApi;
        wireTileMenus(surface, modelApi);
    }

    function syncGridColumnButtonState(colCount) {
        const group = document.getElementById('dashboard-grid-col-count-group');
        if (!group) return;
        group.querySelectorAll('[data-dashboard-grid-cols]').forEach((btn) => {
            const value = parseInt(btn.getAttribute('data-dashboard-grid-cols'), 10);
            const isActive = Number.isFinite(value) && value === colCount;
            btn.classList.toggle('ll-btn--primary', isActive);
            btn.classList.toggle('ll-btn--outline-default', !isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    function applyGridColumnCount(nextCols) {
        const surface = document.getElementById('dashboard-grid-surface');
        const modelApi = builderState.activeGridModelApi;
        const colCount = Math.max(1, parseInt(nextCols, 10) || 6);
        if (!surface || !modelApi) return;

        const current = modelApi.getGridTilesModel();
        const adapted = llc.adaptLlumenGridTilesModelToColumnCount(current, colCount, { maxGridRow: 64 });
        surface.style.gridTemplateColumns = `repeat(${colCount}, minmax(0, 1fr))`;
        surface.setAttribute('data-dashboard-grid-cols', String(colCount));
        modelApi.applyGridTilesModel(adapted);
        syncGridColumnButtonState(colCount);

        builderState.model.controls.columnCount = colCount;
        const pageModel = ensurePageModel(getCurrentPageId());
        if (pageModel) {
            pageModel.columnCount = colCount;
            pageModel.tiles = Array.isArray(adapted.tiles) ? adapted.tiles.slice() : [];
        }
    }

    function loadActivePageGridModel() {
        const pageModel = ensurePageModel(getCurrentPageId());
        const surface = document.getElementById('dashboard-grid-surface');
        const modelApi = builderState.activeGridModelApi;
        if (!pageModel || !surface || !modelApi) return;
        const colCount = Math.max(1, parseInt(pageModel.columnCount, 10) || 6);
        surface.style.gridTemplateColumns = `repeat(${colCount}, minmax(0, 1fr))`;
        surface.setAttribute('data-dashboard-grid-cols', String(colCount));
        modelApi.applyGridTilesModel({
            columnCount: colCount,
            tiles: Array.isArray(pageModel.tiles) ? pageModel.tiles.slice() : []
        });
        syncGridColumnButtonState(colCount);
        builderState.model.controls.columnCount = colCount;
    }

    function addGridComponent(componentType) {
        const modelApi = builderState.activeGridModelApi;
        const activeSub = builderState.model.subContent.items.find((item) => item.id === builderState.model.subContent.activeId);
        if (!modelApi || !activeSub || String(activeSub.contextType || '') !== 'grid') {
            toast('Unavailable', 'Components can be added only in grid-based context.', 'warning');
            return;
        }
        const type = componentMetaByType[componentType] ? componentType : 'metric';
        const defaultSize = getDefaultTileSpanByType(type);
        const current = modelApi.getGridTilesModel();
        const tiles = Array.isArray(current.tiles) ? current.tiles.slice() : [];
        const nextId = `dash-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const columnCount = Math.max(1, parseInt(current.columnCount, 10) || 6);
        const colSpan = Math.max(1, parseInt(defaultSize.colSpan, 10) || 1);
        const rowSpan = Math.max(1, parseInt(defaultSize.rowSpan, 10) || 1);
        const occupied = new Set();
        let maxOccupiedRow = 1;
        tiles.forEach((tile) => {
            const colStart = Math.max(1, parseInt(tile && tile.colStart, 10) || 1);
            const rowStart = Math.max(1, parseInt(tile && tile.rowStart, 10) || 1);
            const tColSpan = Math.max(1, parseInt(tile && tile.colSpan, 10) || 1);
            const tRowSpan = Math.max(1, parseInt(tile && tile.rowSpan, 10) || 1);
            maxOccupiedRow = Math.max(maxOccupiedRow, rowStart + tRowSpan - 1);
            for (let r = rowStart; r < rowStart + tRowSpan; r += 1) {
                for (let c = colStart; c < colStart + tColSpan; c += 1) {
                    occupied.add(`${c},${r}`);
                }
            }
        });
        const maxColStart = Math.max(1, columnCount - colSpan + 1);
        const canPlaceAt = (colStart, rowStart) => {
            for (let r = rowStart; r < rowStart + rowSpan; r += 1) {
                for (let c = colStart; c < colStart + colSpan; c += 1) {
                    if (occupied.has(`${c},${r}`)) return false;
                }
            }
            return true;
        };
        let placeColStart = 1;
        let placeRowStart = maxOccupiedRow + 1;
        let placed = false;
        const scanRowLimit = Math.max(64, maxOccupiedRow + 8);
        for (let row = 1; row <= scanRowLimit && !placed; row += 1) {
            for (let col = 1; col <= maxColStart; col += 1) {
                if (!canPlaceAt(col, row)) continue;
                placeColStart = col;
                placeRowStart = row;
                placed = true;
                break;
            }
        }
        tiles.push({
            tileId: nextId,
            componentType: type,
            colStart: placeColStart,
            rowStart: placeRowStart,
            colSpan,
            rowSpan,
            zIndex: tiles.length + 1
        });
        modelApi.applyGridTilesModel({
            columnCount,
            tiles
        });
    }

    function initializeComponentBrowser() {
        const openButtons = Array.from(document.querySelectorAll('[data-dashboard-action="open-component-browser"]'));
        if (!openButtons.length || typeof llc.initializeModal !== 'function') return;

        let activeController = null;
        const browserCardsMarkup = componentTypeCatalog.map((entry) => `
            <div class="cl-dnd-component-card ll-card ll-card--linkable" data-dashboard-component-type="${entry.type}">
                <div class="ll-card__content cl-dnd-component-card__content">
                    <div class="cl-dnd-component-card__header">
                        <span class="material-symbols-outlined cl-dnd-component-card__icon">${entry.icon}</span>
                        <h3 class="cl-dnd-component-card__title">${entry.label}</h3>
                    </div>
                    <p class="cl-dnd-component-card__description">${entry.description}</p>
                </div>
                <button type="button" class="ll-card__link-overlay" aria-label="Add ${entry.label} component"></button>
            </div>
        `).join('');

        const open = () => {
            if (activeController) return;
            const listId = `dashboard-component-browser-list-${Date.now()}`;
            const cancelId = `dashboard-component-browser-cancel-${Date.now()}`;

            activeController = llc.initializeModal({
                title: 'Component Browser',
                width: '56rem',
                bodyContent: `
                    <div id="${listId}" class="cl-dnd-component-browser-list">
                        ${browserCardsMarkup}
                    </div>
                `,
                footerContent: `<button type="button" id="${cancelId}" class="ll-btn ll-btn--outline-default">Cancel</button>`,
                onOpen: ({ controller: openController }) => {
                    const list = openController.body ? openController.body.querySelector(`#${listId}`) : null;
                    const cancelButton = openController.footer ? openController.footer.querySelector(`#${cancelId}`) : null;
                    if (cancelButton && cancelButton.dataset.dashboardBound !== 'true') {
                        cancelButton.addEventListener('click', () => {
                            openController.close('cancel');
                        });
                        cancelButton.dataset.dashboardBound = 'true';
                    }
                    if (!list) return;
                    list.querySelectorAll('[data-dashboard-component-type]').forEach((card) => {
                        const trigger = card.querySelector('.ll-card__link-overlay');
                        if (!trigger || trigger.dataset.dashboardBound === 'true') return;
                        trigger.addEventListener('click', () => {
                            const type = String(card.getAttribute('data-dashboard-component-type') || '');
                            if (type) addGridComponent(type);
                            openController.close('picked-component');
                        });
                        trigger.dataset.dashboardBound = 'true';
                    });
                },
                onClose: ({ controller: closingController }) => {
                    activeController = null;
                    closingController.destroy();
                }
            });
        };

        openButtons.forEach((btn) => btn.addEventListener('click', open));
    }

    function initializeControls(builderApi) {
        const themeButtons = Array.from(document.querySelectorAll('[data-dashboard-theme]'));
        const gridButtons = Array.from(document.querySelectorAll('[data-dashboard-grid-cols]'));
        const filterToggle = document.getElementById('dashboard-filters-visibility-toggle');
        const filtersSection = document.getElementById('dashboard-filters-section');
        const simActionButtons = Array.from(document.querySelectorAll('[data-dashboard-sim-action]'));

        const applyThemeState = () => {
            const isDark = String(builderState.model.controls.theme || 'dark') === 'dark';
            themeButtons.forEach((btn) => {
                const value = String(btn.getAttribute('data-dashboard-theme') || '');
                const active = (value === 'dark' && isDark) || (value === 'light' && !isDark);
                btn.classList.toggle('ll-btn--primary', active);
                btn.classList.toggle('ll-btn--outline-default', !active);
                btn.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
            const root = document.getElementById('dashboard-builder-root');
            if (root) {
                root.classList.toggle('ll-content-builder--light-theme', !isDark);
            }
        };

        const applyFilterVisibility = () => {
            const enabled = builderState.model.controls.filtersEnabled === true;
            if (filterToggle) {
                filterToggle.checked = enabled;
            }
            if (filtersSection) {
                const isEdit = builderApi.getMode() === 'edit';
                filtersSection.hidden = !(enabled && isEdit);
            }
        };

        themeButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const value = String(btn.getAttribute('data-dashboard-theme') || 'dark');
                builderState.model.controls.theme = value === 'light' ? 'light' : 'dark';
                applyThemeState();
                toast('Theme switched', `Page theme set to ${builderState.model.controls.theme}.`, 'info');
            });
        });

        gridButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const value = parseInt(btn.getAttribute('data-dashboard-grid-cols'), 10);
                if (!Number.isFinite(value)) return;
                applyGridColumnCount(value);
            });
        });

        if (filterToggle) {
            filterToggle.addEventListener('change', () => {
                builderState.model.controls.filtersEnabled = !!filterToggle.checked;
                applyFilterVisibility();
            });
        }

        builderState.__syncBuilderControlUi = () => {
            applyThemeState();
            applyFilterVisibility();
        };

        simActionButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const action = String(btn.getAttribute('data-dashboard-sim-action') || '').trim();
                if (!action) return;
                if (action === 'share') {
                    toast('Share simulated', 'Sharing is not implemented in this prototype.', 'info');
                    return;
                }
                toast('Simulated action', `${action} is not implemented in this prototype.`, 'info');
            });
        });

        builderState.__syncBuilderControlUi();
    }

    function initializeRibbonMenuDropdown() {
        const trigger = document.getElementById('dashboard-ribbon-menu-trigger');
        const menu = document.getElementById('dashboard-ribbon-menu');
        if (!trigger || !menu) return;
        llc.initializePortaledDropdown({
            buttonId: trigger.id,
            menuId: menu.id,
            align: 'right',
            menuType: 'action'
        });
    }

    function initializeEditableTitleBridges() {
        const titleEditor = document.querySelector('[data-dashboard-title-editor]');
        const titleInput = document.querySelector('[data-ll-builder-title-input]');

        let syncingTitleEditor = false;

        const syncFromModel = () => {
            const nextTitle = String(builderState.model && builderState.model.content && builderState.model.content.title ? builderState.model.content.title : '');
            if (titleInput && titleInput.value !== nextTitle) {
                titleInput.value = nextTitle;
            }
            if (titleEditor && titleEditor.textContent !== nextTitle) {
                syncingTitleEditor = true;
                titleEditor.textContent = nextTitle;
                syncingTitleEditor = false;
            }
        };

        if (titleEditor && titleInput) {
            titleEditor.addEventListener('input', () => {
                if (syncingTitleEditor) return;
                const next = String(titleEditor.textContent || '').replace(/\s+/g, ' ').trim();
                titleInput.value = next;
                titleInput.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }

        builderState.__syncEditableTitleUi = syncFromModel;
        syncFromModel();
    }

    function start() {
        const root = document.getElementById('dashboard-builder-root');
        if (!root) return;

        initializeGridContext();
        initializeComponentBrowser();
        initializeRibbonMenuDropdown();

        const builderApi = llc.initializeContentBuilder({
            root,
            model: builderState.model,
            subContentNav: {
                renameEnabled: true
            },
            onModelChange: ({ model }) => {
                builderState.model = model;
                if (typeof builderState.__syncBuilderControlUi === 'function') {
                    builderState.__syncBuilderControlUi();
                }
                if (typeof builderState.__syncEditableTitleUi === 'function') {
                    builderState.__syncEditableTitleUi();
                }
            },
            onModeChange: ({ mode }) => {
                root.classList.toggle('view-mode', mode === 'view');
                root.classList.toggle('edit-mode', mode === 'edit');
                if (typeof builderState.__syncBuilderControlUi === 'function') {
                    builderState.__syncBuilderControlUi();
                }
                if (typeof builderState.__syncEditableTitleUi === 'function') {
                    builderState.__syncEditableTitleUi();
                }
            },
            onSubContentChange: ({ activeId, reason, model }) => {
                builderState.model = model;
                ensurePageModel(activeId);
                if (String(reason || '').toLowerCase().includes('items')) {
                    model.subContent.items.forEach((item) => ensurePageModel(item.id));
                    const validIds = new Set(model.subContent.items.map((item) => String(item.id)));
                    Object.keys(builderState.pageGridModels).forEach((pageId) => {
                        if (!validIds.has(pageId)) delete builderState.pageGridModels[pageId];
                    });
                }
                loadActivePageGridModel();
                if (typeof builderState.__syncBuilderControlUi === 'function') {
                    builderState.__syncBuilderControlUi();
                }
                if (typeof builderState.__syncEditableTitleUi === 'function') {
                    builderState.__syncEditableTitleUi();
                }
            },
            onHeaderAction: ({ action }) => {
                if (action === 'publish') {
                    toast('Publish simulated', 'Publishing is not implemented in this prototype.', 'info');
                    return;
                }
                if (action === 'share') {
                    toast('Share simulated', 'Sharing is not implemented in this prototype.', 'info');
                    return;
                }
                if (action === 'configure') {
                    toast('Configure simulated', 'Configuration will be added in a later pass.', 'info');
                    return;
                }
                if (action === 'delete') {
                    toast('Delete blocked', 'Delete is disabled in prototype mode.', 'warning');
                }
            }
        });

        initializeControls(builderApi);
        initializeEditableTitleBridges();
        loadActivePageGridModel();
        if (typeof builderState.__syncBuilderControlUi === 'function') {
            builderState.__syncBuilderControlUi();
        }
        if (typeof builderState.__syncEditableTitleUi === 'function') {
            builderState.__syncEditableTitleUi();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})(window);
