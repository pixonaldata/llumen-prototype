(function initLinkExistingContentModalModule() {
    const STYLE_ID = 'link-existing-content-modal-style';
    const MODAL_ID = 'link-existing-content-modal';
    const LINK_CONTENT_LISTING_ROOT_ID = 'link-content-listing-root';

    const linkContentItems = [
        {
            id: 's1',
            type: 'story',
            name: 'Q2 Performance Review',
            title: 'Q2 Performance Review: Deep Dive into Financial Metrics',
            sections: 14,
            pages: 0,
            updatedRank: 4,
            thumbnail: 'https://placehold.co/400x225/1a202c/e2e8f0?text=Screenshot+of+first+section'
        },
        {
            id: 's2',
            type: 'story',
            name: 'Employee Engagement Trends 2024',
            title: 'Employee Engagement Trends 2024: Key Insights',
            sections: 17,
            pages: 0,
            updatedRank: 3,
            thumbnail: 'https://placehold.co/400x225/2c5282/ffffff?text=Screenshot+of+first+section'
        },
        {
            id: 'd1',
            type: 'dashboard',
            name: 'Operations Dashboard',
            title: 'Operations Dashboard: Live KPIs and Supply Chain',
            sections: 0,
            pages: 4,
            updatedRank: 2,
            thumbnail: 'https://placehold.co/400x225/2d3748/f7fafc?text=Screenshot+of+first+page'
        },
        {
            id: 'd2',
            type: 'dashboard',
            name: 'Monthly Sales Performance',
            title: 'Monthly Sales Performance: Regional Breakdowns',
            sections: 0,
            pages: 3,
            updatedRank: 1,
            thumbnail: 'https://placehold.co/400x225/5f2120/ffffff?text=Screenshot+of+first+page'
        }
    ];

    const modalBodyTemplate = `
        <div id="link-content-step-shell" class="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div id="link-content-step1" class="flex flex-col flex-1 min-h-0">
                <div id="${LINK_CONTENT_LISTING_ROOT_ID}" class="ll-listing-module ll-listing-module--in-modal">
                    <div class="ll-listing-module-header">
                        <div class="ll-listing-module-header__toolbar">
                            <div class="ll-listing-module-header__toolbar-start">
                                <div class="ll-btn-group" role="group" aria-label="Content type filter">
                                    <button id="link-content-filter-all-btn" type="button" class="ll-btn ll-btn--outline-default">All Content</button>
                                    <button id="link-content-filter-stories-btn" type="button" class="ll-btn ll-btn--outline-default">Stories</button>
                                    <button id="link-content-filter-dashboards-btn" type="button" class="ll-btn ll-btn--outline-default">Dashboards</button>
                                </div>
                            </div>
                            <div class="ll-listing-module-header__toolbar-end">
                                <div class="ll-input-with-left-icon ll-listing-module-search-input">
                                    <div class="ll-input-with-left-icon__left ll-input-with-left-icon__icon">
                                        <span class="material-symbols-outlined">search</span>
                                    </div>
                                    <input id="link-content-search-input" type="text" class="ll-input ll-input--search ll-input-with-left-icon__input" placeholder="Search content...">
                                </div>
                                <div class="ll-btn-group" role="group" aria-label="Listing view toggle">
                                    <button id="link-content-view-list-btn" type="button" class="ll-btn ll-btn--outline-default ll-btn--icon-only" title="List view" aria-label="List view">
                                        <span class="material-symbols-outlined ll-btn__icon">menu</span>
                                    </button>
                                    <button id="link-content-view-grid-btn" type="button" class="ll-btn ll-btn--outline-default ll-btn--icon-only" title="Grid view" aria-label="Grid view">
                                        <span class="material-symbols-outlined ll-btn__icon">grid_view</span>
                                    </button>
                                </div>
                                <button id="link-content-sort-btn" class="ll-btn ll-btn--outline-default">
                                    <span class="ll-dropdown__selected-value">Sort</span>
                                    <span class="material-symbols-outlined ll-dropdown__button-chevron">expand_more</span>
                                </button>
                                <div id="link-content-sort-menu" class="ll-dropdown__menu hidden right-auto overflow-y-auto"></div>
                            </div>
                        </div>
                    </div>
                    <div id="link-content-grid-host" class="ll-listing-module-content-host ll-listing-module-grid-host"></div>
                    <div id="link-content-table-host" class="ll-listing-module-content-host ll-listing-module-table-host"></div>
                </div>
            </div>
            <div id="link-content-step2" class="hidden flex flex-col flex-1 min-h-0">
                <div id="link-content-step2-header" class="ll-modal__header">
                    <div class="ll-modal__title-section">
                        <div class="ll-modal__back-slot ll-active">
                            <button type="button" id="link-content-back-btn" class="ll-icon-btn ll-icon-btn--circle ll-modal__back-btn" aria-label="Back to content list">
                                <span class="material-symbols-outlined ll-icon-btn__icon">arrow_back_ios_new</span>
                            </button>
                        </div>
                        <div class="ll-modal__title-wrap">
                            <h3 id="link-content-step2-title" class="ll-modal__title"></h3>
                        </div>
                        <div id="link-content-step2-meta" class="ll-modal__title__meta">
                            <span id="link-content-step2-type" class="ll-modal__title__meta__item ll-text-muted text-sm"></span>
                            <span id="link-content-step2-count" class="ll-modal__title__meta__item ll-text-muted text-sm"></span>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 ml-4 flex-shrink-0">
                        <button type="button" id="link-content-nav-prev" class="ll-icon-btn ll-icon-btn--circle ll-icon-btn--outline" title="Previous">
                            <span class="material-symbols-outlined ll-icon-btn__icon">arrow_back</span>
                        </button>
                            <div class="w-56">
                            <button type="button" id="link-content-nav-dropdown-btn" class="ll-input ll-dropdown__button" title="Select section or page">
                                <span id="link-content-nav-current-label" class="ll-dropdown__selected-value">-</span>
                                <span class="material-symbols-outlined ll-dropdown__button-chevron">expand_more</span>
                            </button>
                            <div id="link-content-nav-dropdown" class="ll-dropdown__menu hidden right-auto max-h-64 overflow-y-auto"></div>
                        </div>
                        <button type="button" id="link-content-nav-next" class="ll-icon-btn ll-icon-btn--circle ll-icon-btn--outline" title="Next">
                            <span class="material-symbols-outlined ll-icon-btn__icon">arrow_forward</span>
                        </button>
                    </div>
                </div>
                <div id="link-content-preview-body" class="flex-1 overflow-y-auto p-6">
                    <div id="link-content-preview-placeholder" class="bg-gray-800 border border-gray-700 rounded-xl min-h-[680px] flex items-center justify-center text-gray-500 text-sm">Preview placeholder</div>
                </div>
            </div>
        </div>
    `;

    const modalFooterSelectionTemplate = `
        <div id="link-content-footer-selection">
            <div class="text-sm ll-text-muted">No content selected</div>
        </div>
    `;

    const modalFooterActionsTemplate = `
        <div class="flex gap-3">
            <button type="button" id="link-content-cancel" class="ll-btn ll-btn--outline-default">Cancel</button>
            <button type="button" id="link-content-confirm" class="ll-btn ll-btn--primary" disabled>Select Content</button>
        </div>
    `;

    const modalStyles = `
#content-tab-existing .resize-handle,
#content-tab-existing .command-room-nav {
    display: none;
}
    `;

    function ensureModalStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = modalStyles;
        document.head.appendChild(style);
    }


    window.initLinkExistingContentModal = function initLinkExistingContentModal(options = {}) {
        const nextWorkspaceName = String(options.workspace_name || options.workspaceName || 'Finance').trim() || 'Finance';

        const applyWorkspaceTitle = (workspaceName) => {
            const modalRoot = document.getElementById(MODAL_ID);
            const titleEl = modalRoot ? modalRoot.querySelector('.ll-modal__title') : null;
            if (!titleEl) return;
            titleEl.textContent = `Select Content from ${workspaceName} Workspace`;
        };

        if (window.__linkExistingContentModalInitialized) {
            if (window.__linkExistingContentModalApi && window.__linkExistingContentModalApi.setWorkspaceName) {
                window.__linkExistingContentModalApi.setWorkspaceName(nextWorkspaceName);
                if (Object.prototype.hasOwnProperty.call(options, 'onConfirm') && window.__linkExistingContentModalApi.setOnConfirm) {
                    window.__linkExistingContentModalApi.setOnConfirm(options.onConfirm);
                }
            }
            return window.__linkExistingContentModalApi;
        }

        ensureModalStyles();
        const llComponents = window.LlumenComponents;
        let modalController = window.__linkExistingContentModalController || null;
        if (!modalController && llComponents && typeof llComponents.initializeModal === 'function') {
            modalController = llComponents.initializeModal({
                id: MODAL_ID,
                width: '100rem',
                fullHeight: true,
                bodyPadding: false,
                bodyScrollable: false,
                title: `Select Content from ${nextWorkspaceName} Workspace`,
                bodyContent: modalBodyTemplate,
                footerContent: {
                    nonActionContent: modalFooterSelectionTemplate,
                    actions: modalFooterActionsTemplate
                },
                openOnInit: false
            });
            window.__linkExistingContentModalController = modalController;
        }
        applyWorkspaceTitle(nextWorkspaceName);

        const modal = modalController ? modalController.root : document.getElementById(MODAL_ID);
        const cancelBtn = modal ? modal.querySelector('#link-content-cancel') : null;
        const confirmBtn = modal ? modal.querySelector('#link-content-confirm') : null;
        const footerSelection = modal ? modal.querySelector('#link-content-footer-selection') : null;
        const step1Body = modal ? modal.querySelector('#link-content-step1') : null;
        const step2Body = modal ? modal.querySelector('#link-content-step2') : null;
        const step2Header = modal ? modal.querySelector('#link-content-step2-header') : null;
        const backBtn = modal ? modal.querySelector('#link-content-back-btn') : null;
        const step2Title = modal ? modal.querySelector('#link-content-step2-title') : null;
        const step2Type = modal ? modal.querySelector('#link-content-step2-type') : null;
        const step2Count = modal ? modal.querySelector('#link-content-step2-count') : null;
        const navPrevBtn = modal ? modal.querySelector('#link-content-nav-prev') : null;
        const navNextBtn = modal ? modal.querySelector('#link-content-nav-next') : null;
        let navCurrentLabel = modal ? modal.querySelector('#link-content-nav-current-label') : null;
        let navDropdownBtn = modal ? modal.querySelector('#link-content-nav-dropdown-btn') : null;
        let navDropdown = modal ? modal.querySelector('#link-content-nav-dropdown') : null;
        let linkContentListingApi = null;
        let linkContentSubItems = [];
        let linkContentCurrentIndex = 1;
        let linkContentSelectedItem = null;
        let linkContentSelectedSub = null;
        let linkedContentSelection = null;
        let externalOnConfirm = typeof options.onConfirm === 'function' ? options.onConfirm : null;
        let navDropdownSelectionSignature = '';

        const escapeHtml = (value) => String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        function showLinkContentStep(step, direction = 'forward') {
            const isStep1 = step === 1;
            if (step1Body) step1Body.classList.toggle('hidden', !isStep1);
            if (step2Body) step2Body.classList.toggle('hidden', isStep1);
            if (step2Header) step2Header.classList.toggle('hidden', isStep1);
            if (modalController) {
                modalController.animateContent(
                    isStep1 ? step1Body : step2Body,
                    direction === 'backward'
                        ? 'll-modal__body-anim-slide-in-left'
                        : 'll-modal__body-anim-slide-in-right'
                );
            }
        }

        function selectLinkContentItemFromModel(item) {
            if (!item) return;
            linkContentSelectedItem = {
                type: item.type,
                id: item.id,
                name: item.name,
                sections: item.sections ? parseInt(item.sections, 10) : 0,
                pages: item.pages ? parseInt(item.pages, 10) : 0
            };
            linkContentSubItems = buildSubItemsForContent();
            linkContentCurrentIndex = 1;
            linkContentSelectedSub = linkContentSubItems[0]
                ? { index: linkContentSubItems[0].index, label: linkContentSubItems[0].label }
                : null;
            /*
             * Always reset nav dropdown init cache on new item selection.
             * Without this, a prior dropdown instance can be reused and become stale
             * when users go back and pick a different item.
             */
            navDropdownSelectionSignature = '';
            if (navDropdownBtn) {
                delete navDropdownBtn.dataset.linkContentNavDropdownBound;
            }
            if (navDropdown) {
                navDropdown.innerHTML = '';
                navDropdown.classList.add('hidden');
            }
            if (confirmBtn) confirmBtn.disabled = !linkContentSelectedSub;
            if (step2Type) step2Type.textContent = linkContentSelectedItem.type === 'story' ? 'Story' : 'Dashboard';
            if (step2Title) step2Title.textContent = linkContentSelectedItem.name || '';
            if (step2Count) {
                const n = linkContentSelectedItem.type === 'story'
                    ? (linkContentSelectedItem.sections || 0)
                    : (linkContentSelectedItem.pages || 0);
                step2Count.textContent = linkContentSelectedItem.type === 'story'
                    ? `${n} Section${n !== 1 ? 's' : ''}`
                    : `${n} Page${n !== 1 ? 's' : ''}`;
            }
            showLinkContentStep(2, 'forward');
            updateLinkContentNavDisplay();
            buildNavDropdown();
        }

        function ensureListingInitialized() {
            if (linkContentListingApi || !llComponents || typeof llComponents.initListingModule !== 'function') return;
            linkContentListingApi = llComponents.initListingModule({
                rootId: LINK_CONTENT_LISTING_ROOT_ID,
                allowUnsafeHtml: true,
                items: linkContentItems.slice(),
                idKey: 'id',
                table: {
                    containerId: 'link-content-table-host',
                    columns: [
                        {
                            property: 'title',
                            heading: 'Name',
                            isMain: true,
                            headerClassName: 'll-listing-table__column-main',
                            cellClassName: 'll-listing-table__column-main',
                            renderCell: (item) => `
                                <div class="ll-listing-table__main">
                                    <div class="ll-listing-table__main-thumbnail">
                                        <div class="ll-aspect-box ll-aspect-box--16-9">
                                            <img src="${escapeHtml(item.thumbnail)}" alt="" class="ll-aspect-box__content ll-listing-table__main-thumbnail-image">
                                        </div>
                                    </div>
                                    <div class="ll-listing-table__main-body">
                                        <div class="ll-listing-table__main-heading">${escapeHtml(item.title)}</div>
                                    </div>
                                </div>
                            `
                        },
                        {
                            property: 'type',
                            heading: 'Type',
                            renderCell: (item) => `<span>${item.type === 'story' ? 'Story' : 'Dashboard'}</span>`
                        },
                        {
                            property: 'contentCount',
                            heading: 'Content',
                            renderCell: (item) => item.type === 'story'
                                ? `<span>${escapeHtml(String(item.sections || 0))} Sections</span>`
                                : `<span>${escapeHtml(String(item.pages || 0))} Pages</span>`
                        }
                    ]
                },
                grid: {
                    enabled: true,
                    containerId: 'link-content-grid-host',
                    columns: 4,
                    gap: 6,
                    defaultView: 'grid',
                    renderCard: (item) => `
                        <div class="ll-aspect-box ll-aspect-box--16-9">
                            <img src="${escapeHtml(item.thumbnail)}" alt="" class="ll-aspect-box__content ll-card__thumbnail">
                        </div>
                        <div class="ll-card__content">
                            <div class="ll-card__content-heading">${escapeHtml(item.title)}</div>
                            <div class="ll-card__meta-row">
                                <div class="ll-card__meta-group">
                                        <span class="ll-chip ll-chip--outline-default"><span class="ll-chip__label">${item.type === 'story' ? 'Story' : 'Dashboard'}</span></span>
                                </div>
                                <div class="ll-card__meta-group">
                                    <span class="ll-card__meta-item">${item.type === 'story' ? `${escapeHtml(String(item.sections || 0))} Sections` : `${escapeHtml(String(item.pages || 0))} Pages`}</span>
                                </div>
                            </div>
                        </div>
                    `
                },
                controls: {
                    searchInputId: 'link-content-search-input',
                    sortDropdown: {
                        buttonId: 'link-content-sort-btn',
                        menuId: 'link-content-sort-menu',
                        selectedValueSelector: '.ll-dropdown__selected-value',
                        align: 'right',
                        dropdownIcon: 'sort',
                        showLabel: false,
                        dropdownLabel: 'Sort',
                        emptySelectionLabel: 'Sort'
                    },
                    viewToggle: {
                        listButtonId: 'link-content-view-list-btn',
                        gridButtonId: 'link-content-view-grid-btn'
                    },
                    emptyStateText: {
                        text: 'No matching content found.',
                        icon: 'search_off'
                    }
                },
                search: {
                    fields: ['name', 'title', 'type']
                },
                filters: [
                    {
                        key: 'content-type',
                        label: 'Content type',
                        type: 'toggle',
                        property: 'type',
                        predicate: (item, value) => {
                            const selected = String(value || '').trim();
                            if (!selected || selected === 'all') return true;
                            return String(item && item.type ? item.type : '').trim() === selected;
                        },
                        options: [
                            { value: 'all', label: 'All' },
                            { value: 'story', label: 'Stories' },
                            { value: 'dashboard', label: 'Dashboards' }
                        ],
                        toggle: {
                            buttonIdsByValue: {
                                all: 'link-content-filter-all-btn',
                                story: 'link-content-filter-stories-btn',
                                dashboard: 'link-content-filter-dashboards-btn'
                            },
                            activeClassName: 'll-btn--primary',
                            inactiveClassName: 'll-btn--outline-default'
                        },
                        defaultValue: 'all'
                    }
                ],
                sorts: [
                    { value: 'last-updated', label: 'Last Updated', property: 'updatedRank', propertyType: 'number', order: 'desc' },
                    { value: 'title-asc', label: 'Title', property: 'title', propertyType: 'string', order: 'asc', description: 'A-Z' },
                    { value: 'title-desc', label: 'Title', property: 'title', propertyType: 'string', order: 'desc', description: 'Z-A' }
                ],
                itemClick: {
                    type: 'selection',
                    onSelectionChange: ({ selectedItem } = {}) => {
                        if (!selectedItem) return;
                        selectLinkContentItemFromModel(selectedItem);
                    }
                }
            });
        }

                function renderExistingEmptyState() {
                    const contentTabExisting = document.getElementById('content-tab-existing');
                    if (!contentTabExisting) return;
                    contentTabExisting.innerHTML = `
                        <div class="text-center space-y-6">
                            <span class="material-symbols-outlined text-gray-600 opacity-30 block" style="font-size: 80px;">link</span>
                            <p class="text-gray-400 text-base">Link an existing Story or Dashboard from your workspace.</p>
                            <div class="flex justify-center">
                                <button id="link-existing-content-button" class="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200">
                                    <span class="material-symbols-outlined text-lg">link</span>
                                    <span>Link Existing Content</span>
                                </button>
                            </div>
                        </div>
                    `;
                    const linkBtn = contentTabExisting.querySelector('#link-existing-content-button');
                    if (linkBtn) linkBtn.addEventListener('click', () => openLinkContentModal(false));
                }

                function bindLinkedStateActionButtons(contentTabExisting) {
                    const changeBtn = contentTabExisting.querySelector('#link-existing-content-button');
                    const removeBtn = contentTabExisting.querySelector('#remove-linked-content-button');
                    const headerOptionsBtn = contentTabExisting.querySelector('.linked-existing-header-options-btn');
                    const headerMenu = contentTabExisting.querySelector('#linked-existing-header-menu');
                    if (changeBtn) changeBtn.addEventListener('click', () => openLinkContentModal(true));
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => {
                            linkedContentSelection = null;
                            renderExistingEmptyState();
                        });
                    }
                    if (headerOptionsBtn && headerMenu) {
                        headerOptionsBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            headerMenu.classList.toggle('hidden');
                        });
                        headerMenu.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const actionLink = e.target.closest('a[data-action]');
                            if (!actionLink) return;
                            e.preventDefault();
                            const action = actionLink.dataset.action;
                            headerMenu.classList.add('hidden');
                            if (action === 'change-linked-content') {
                                openLinkContentModal(true);
                            } else if (action === 'remove-linked-content') {
                                linkedContentSelection = null;
                                renderExistingEmptyState();
                            }
                        });
                    }
                }

                function bindLinkedExistingNavEvents(contentTabExisting) {
                    const linkedPrevBtn = contentTabExisting.querySelector('#linked-existing-nav-prev');
                    const linkedNextBtn = contentTabExisting.querySelector('#linked-existing-nav-next');
                    const linkedDropdownBtn = contentTabExisting.querySelector('#linked-existing-nav-dropdown-btn');
                    const linkedDropdown = contentTabExisting.querySelector('#linked-existing-nav-dropdown');

                    if (linkedPrevBtn) {
                        linkedPrevBtn.addEventListener('click', () => {
                            if (linkContentCurrentIndex > 1) {
                                linkContentCurrentIndex--;
                                updateLinkContentNavDisplay();
                                buildNavDropdown();
                            }
                        });
                    }
                    if (linkedNextBtn) {
                        linkedNextBtn.addEventListener('click', () => {
                            if (linkContentCurrentIndex < linkContentSubItems.length) {
                                linkContentCurrentIndex++;
                                updateLinkContentNavDisplay();
                                buildNavDropdown();
                            }
                        });
                    }
                    if (linkedDropdownBtn && linkedDropdown) {
                        linkedDropdownBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            linkedDropdown.classList.toggle('hidden');
                        });
                        linkedDropdown.addEventListener('click', (e) => e.stopPropagation());
                    }
                }

                function initLinkedExistingDashboard() {
                    const grid = document.getElementById('linked-existing-dashboard-grid');
                    const themeDarkBtn = document.getElementById('linked-existing-theme-dark-button');
                    const themeLightBtn = document.getElementById('linked-existing-theme-light-button');
                    const gridUnitBtns = document.querySelectorAll('.linked-existing-grid-unit-toggle-button');
                    const filtersVisibilityToggle = document.getElementById('linked-existing-filters-visibility-toggle');
                    const filtersSection = document.getElementById('linked-existing-filters-section');
                    const addComponentBtn = document.getElementById('linked-existing-add-component-button');
                    if (!grid) return;

                    function setLinkedTheme(theme) {
                        if (!themeDarkBtn || !themeLightBtn) return;
                        if (theme === 'dark') {
                            themeDarkBtn.classList.add('active', 'bg-red-600');
                            themeDarkBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                            themeLightBtn.classList.remove('active', 'bg-red-600');
                            themeLightBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
                        } else {
                            themeLightBtn.classList.add('active', 'bg-red-600');
                            themeLightBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                            themeDarkBtn.classList.remove('active', 'bg-red-600');
                            themeDarkBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
                        }
                    }

                    if (themeDarkBtn && themeLightBtn) {
                        themeDarkBtn.addEventListener('click', () => setLinkedTheme('dark'));
                        themeLightBtn.addEventListener('click', () => setLinkedTheme('light'));
                    }

                    function getDefaultCols() {
                        const width = window.innerWidth;
                        if (width < 768) return 1;
                        if (width < 1024) return 2;
                        return 6;
                    }

                    function getGridColumnCount() {
                        for (let i = 1; i <= 12; i++) {
                            if (grid.classList.contains(`grid-cols-${i}`)) return i;
                        }
                        return 6;
                    }

                    function calculateGridUnitSize(gridWidth, gap) {
                        const cols = getGridColumnCount();
                        return (gridWidth - (cols - 1) * gap) / cols;
                    }

                    function updateComponentHeights() {
                        const rect = grid.getBoundingClientRect();
                        const gridWidth = rect.width;
                        if (!gridWidth) return;
                        const gap = 24;
                        const gridUnitSize = calculateGridUnitSize(gridWidth, gap);
                        grid.style.gridAutoRows = `${gridUnitSize}px`;
                        grid.querySelectorAll('.screen-view-dashboard-component').forEach(comp => {
                            const colSpan = parseInt(comp.dataset.colSpan, 10) || 2;
                            const rowSpan = parseInt(comp.dataset.rowSpan, 10) || 1;
                            const h = (gridUnitSize * rowSpan) + (gap * (rowSpan - 1));
                            comp.style.height = `${h}px`;
                            comp.style.gridColumn = `span ${colSpan}`;
                            comp.style.gridRow = `span ${rowSpan}`;
                        });
                        updateLinkedGuideBoxes();
                    }

                    function updateLinkedGuideBoxes() {
                        const guideContainer = document.getElementById('linked-existing-grid-guide-boxes-container');
                        if (!guideContainer) return;
                        const rect = grid.getBoundingClientRect();
                        const gridWidth = rect.width;
                        if (!gridWidth) return;
                        const gap = 24;
                        const gridUnitSize = calculateGridUnitSize(gridWidth, gap);
                        const cols = getGridColumnCount();
                        const minRows = Math.max(4, Math.ceil((window.innerHeight - rect.top) / (gridUnitSize + gap)));
                        guideContainer.innerHTML = '';
                        for (let row = 0; row < minRows; row++) {
                            for (let col = 0; col < cols; col++) {
                                const box = document.createElement('div');
                                box.className = 'screen-view-grid-guide-box rounded-lg';
                                box.style.left = `${col * (gridUnitSize + gap)}px`;
                                box.style.top = `${row * (gridUnitSize + gap)}px`;
                                box.style.width = `${gridUnitSize}px`;
                                box.style.height = `${gridUnitSize}px`;
                                guideContainer.appendChild(box);
                            }
                        }
                        guideContainer.style.height = `${(minRows * gridUnitSize) + ((minRows - 1) * gap) + 96}px`;
                    }

                    function setActiveGridUnit(cols) {
                        grid.classList.remove('grid-cols-1', 'grid-cols-2', 'grid-cols-4', 'grid-cols-6', 'grid-cols-8', 'grid-cols-10', 'grid-cols-12');
                        grid.classList.add(`grid-cols-${cols}`);
                        gridUnitBtns.forEach(btn => {
                            const btnCols = parseInt(btn.dataset.gridCols, 10);
                            btn.classList.toggle('bg-red-600', btnCols === cols);
                            btn.classList.toggle('active', btnCols === cols);
                            btn.classList.toggle('bg-gray-700', btnCols !== cols);
                            btn.classList.toggle('hover:bg-gray-600', btnCols !== cols);
                        });
                        updateComponentHeights();
                    }

                    gridUnitBtns.forEach(btn => {
                        btn.addEventListener('click', () => {
                            setActiveGridUnit(parseInt(btn.dataset.gridCols, 10));
                        });
                    });

                    if (filtersVisibilityToggle && filtersSection) {
                        filtersVisibilityToggle.checked = false;
                        const updateFilters = () => filtersSection.classList.toggle('hidden', !filtersVisibilityToggle.checked);
                        updateFilters();
                        filtersVisibilityToggle.addEventListener('change', updateFilters);
                    }

                    let linkedComponentCounter = grid.querySelectorAll('.screen-view-dashboard-component').length;
                    if (addComponentBtn) {
                        addComponentBtn.addEventListener('click', () => {
                            linkedComponentCounter += 1;
                            const comp = document.createElement('div');
                            comp.className = 'screen-view-dashboard-component bg-gray-800 rounded-lg border border-gray-700 relative';
                            comp.dataset.colSpan = '2';
                            comp.dataset.rowSpan = '1';
                            comp.style.gridColumn = 'span 2';
                            comp.style.gridRow = 'span 1';
                            comp.innerHTML = `
                                <div class="dashboard-component-header flex items-center justify-between border-b border-gray-700">
                                    <h3 class="text-white font-semibold text-sm">Component ${linkedComponentCounter}</h3>
                                </div>
                                <div class="dashboard-component-body text-gray-400 text-sm">Placeholder component body</div>
                                <div class="resize-handle border-solid"></div>
                            `;
                            grid.appendChild(comp);
                            updateComponentHeights();
                        });
                    }

                    setLinkedTheme('dark');
                    setActiveGridUnit(getDefaultCols());
                }

                function initLinkedExistingStory() {
                    const themeDarkBtn = document.getElementById('linked-existing-story-theme-dark-button');
                    const themeLightBtn = document.getElementById('linked-existing-story-theme-light-button');
                    const filtersVisibilityToggle = document.getElementById('linked-existing-story-filters-visibility-toggle');
                    const filtersSection = document.getElementById('linked-existing-story-filters-section');

                    function setStoryTheme(theme) {
                        if (!themeDarkBtn || !themeLightBtn) return;
                        if (theme === 'dark') {
                            themeDarkBtn.classList.add('active', 'bg-red-600');
                            themeDarkBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                            themeLightBtn.classList.remove('active', 'bg-red-600');
                            themeLightBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
                        } else {
                            themeLightBtn.classList.add('active', 'bg-red-600');
                            themeLightBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                            themeDarkBtn.classList.remove('active', 'bg-red-600');
                            themeDarkBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
                        }
                    }

                    if (themeDarkBtn && themeLightBtn) {
                        themeDarkBtn.addEventListener('click', () => setStoryTheme('dark'));
                        themeLightBtn.addEventListener('click', () => setStoryTheme('light'));
                        setStoryTheme('dark');
                    }

                    if (filtersVisibilityToggle && filtersSection) {
                        filtersVisibilityToggle.checked = false;
                        const updateFiltersVisibility = () => {
                            filtersSection.classList.toggle('hidden', !filtersVisibilityToggle.checked);
                        };
                        updateFiltersVisibility();
                        filtersVisibilityToggle.addEventListener('change', updateFiltersVisibility);
                    }
                }

                function renderExistingLinkedState() {
                    const contentTabExisting = document.getElementById('content-tab-existing');
                    if (!contentTabExisting) return;
                    if (!linkedContentSelection || !linkedContentSelection.item || !linkedContentSelection.sub) {
                        renderExistingEmptyState();
                        return;
                    }
                    const item = linkedContentSelection.item;
                    const sub = linkedContentSelection.sub;

                    if (item.type === 'dashboard') {
                        contentTabExisting.innerHTML = `
                            <div class="flex flex-col w-full h-full min-h-0">
                                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                                    <div class="flex items-center space-x-4">
                                        <div class="text-white text-lg font-semibold">${item.name}</div>
                                        <div class="text-gray-400 text-xs mt-0.5 flex items-center space-x-2">
                                            <span>Dashboard</span>
                                            <span>•</span>
                                            <span>${sub.label}</span>
                                        </div>
                                        <div class="relative">
                                            <button type="button" class="linked-existing-header-options-btn options-dropdown-button">
                                                <span class="material-symbols-outlined text-lg">more_vert</span>
                                            </button>
                                            <div id="linked-existing-header-menu" class="options-dropdown-menu absolute right-0 top-full mt-2 hidden">
                                                <a href="#" class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition duration-150" data-action="change-linked-content">Change linked content</a>
                                                <a href="#" class="block px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition duration-150" data-action="remove-linked-content">Remove</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-4">
                                        <div class="flex items-center gap-2">
                                            <div class="flex items-center gap-2 flex-shrink-0">
                                                <button type="button" id="linked-existing-nav-prev" class="flex items-center justify-center w-9 h-9 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition disabled:opacity-40 disabled:cursor-not-allowed" title="Previous">
                                                    <span class="material-symbols-outlined text-[20px]">arrow_back</span>
                                                </button>
                                                <div class="relative">
                                                    <button type="button" id="linked-existing-nav-dropdown-btn" class="bg-gray-700 hover:bg-gray-600 text-white px-3 pr-2 py-1.5 w-64 text-sm font-medium rounded-lg transition duration-200 flex items-center space-x-2 max-w-80" title="Select page">
                                                        <span id="linked-existing-nav-current-label" class="whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left">${sub.label}</span>
                                                        <span class="material-symbols-outlined text-md flex-shrink-0">expand_more</span>
                                                    </button>
                                                    <div id="linked-existing-nav-dropdown" class="options-dropdown-menu absolute right-0 top-full mt-2 w-64 max-h-64 overflow-y-auto hidden py-2 z-10"></div>
                                                </div>
                                                <button type="button" id="linked-existing-nav-next" class="flex items-center justify-center w-9 h-9 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition disabled:opacity-40 disabled:cursor-not-allowed" title="Next">
                                                    <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-6 shrink-0 px-6 py-4 border-b border-gray-800">
                                    <div class="flex items-center space-x-4">
                                        <span class="material-symbols-outlined text-gray-400" style="font-size: 20px;">dark_mode</span>
                                        <div class="flex items-center">
                                            <button id="linked-existing-theme-dark-button" class="bg-red-600 active text-white px-3 py-1.5 text-sm font-medium rounded-l-lg transition duration-200">Dark</button>
                                            <button id="linked-existing-theme-light-button" class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 text-sm font-medium rounded-r-lg transition duration-200">Light</button>
                                        </div>
                                    </div>
                                    <div class="h-8 border-l border-gray-800"></div>
                                    <div class="flex items-center space-x-4">
                                        <span class="material-symbols-outlined text-gray-400" style="font-size: 20px;">view_module</span>
                                        <div class="flex items-center">
                                            <button class="linked-existing-grid-unit-toggle-button bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 text-sm font-medium rounded-l-lg transition duration-200" data-grid-cols="1">1</button>
                                            <button class="linked-existing-grid-unit-toggle-button bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 text-sm font-medium transition duration-200" data-grid-cols="2">2</button>
                                            <button class="linked-existing-grid-unit-toggle-button bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 text-sm font-medium transition duration-200" data-grid-cols="4">4</button>
                                            <button class="linked-existing-grid-unit-toggle-button bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 text-sm font-medium transition duration-200" data-grid-cols="6">6</button>
                                            <button class="linked-existing-grid-unit-toggle-button bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 text-sm font-medium transition duration-200" data-grid-cols="8">8</button>
                                            <button class="linked-existing-grid-unit-toggle-button bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 text-sm font-medium transition duration-200" data-grid-cols="10">10</button>
                                            <button class="linked-existing-grid-unit-toggle-button bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 text-sm font-medium rounded-r-lg transition duration-200" data-grid-cols="12">12</button>
                                        </div>
                                    </div>
                                    <div class="h-8 border-l border-gray-800"></div>
                                    <label class="flex items-center gap-2 cursor-pointer select-none" for="linked-existing-filters-visibility-toggle">
                                        <span class="toggle-switch">
                                            <input type="checkbox" id="linked-existing-filters-visibility-toggle">
                                            <span class="toggle-slider"></span>
                                        </span>
                                        <span class="text-sm text-gray-300">Enable Screen Filters</span>
                                    </label>
                                </div>
                                <div class="flex-grow min-h-0 flex flex-col p-6 overflow-auto">
                                    <div id="linked-existing-filters-section" class="hidden w-full mx-auto mb-6 pb-6 border-b border-gray-800">
                                        <div class="flex justify-center">
                                            <button class="text-sm bg-gray-700 text-white hover:bg-gray-600 py-1.5 px-3 pl-2 rounded-md transition duration-200 flex items-center space-x-1.5">
                                                <span class="material-symbols-outlined" style="font-size: 20px;">add</span>
                                                <span>Filter</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div id="linked-existing-dashboard-grid" class="flex-grow min-h-0 w-full">
                                        <div id="linked-existing-grid-guide-boxes-container"></div>
                                        <div class="screen-view-dashboard-component bg-gray-800 rounded-lg border border-gray-700 relative" data-col-span="2" data-row-span="1" style="grid-column: span 2; grid-row: span 1;">
                                            <div class="dashboard-component-header flex items-center justify-between border-b border-gray-700">
                                                <h3 class="text-white font-semibold text-sm">Revenue Trend</h3>
                                            </div>
                                            <div class="dashboard-component-body rounded flex items-center justify-center">
                                                <div class="text-center">
                                                    <span class="material-symbols-outlined text-gray-500" style="font-size: 48px;">bar_chart</span>
                                                    <p class="text-gray-500 text-sm mt-2">Chart Placeholder</p>
                                                </div>
                                            </div>
                                            <div class="resize-handle border-solid"></div>
                                        </div>
                                        <div class="screen-view-dashboard-component bg-gray-800 rounded-lg border border-gray-700 relative" data-col-span="2" data-row-span="1" style="grid-column: span 2; grid-row: span 1;">
                                            <div class="dashboard-component-header flex items-center justify-between border-b border-gray-700">
                                                <h3 class="text-white font-semibold text-sm">Top Regions</h3>
                                            </div>
                                            <div class="dashboard-component-body rounded flex items-center justify-center">
                                                <div class="text-center">
                                                    <span class="material-symbols-outlined text-gray-500" style="font-size: 48px;">table_chart</span>
                                                    <p class="text-gray-500 text-sm mt-2">Chart Placeholder</p>
                                                </div>
                                            </div>
                                            <div class="resize-handle border-solid"></div>
                                        </div>
                                        <div class="screen-view-dashboard-component bg-gray-800 rounded-lg border border-gray-700 relative" data-col-span="2" data-row-span="1" style="grid-column: span 2; grid-row: span 1;">
                                            <div class="dashboard-component-header flex items-center justify-between border-b border-gray-700">
                                                <h3 class="text-white font-semibold text-sm">Conversion KPI</h3>
                                            </div>
                                            <div class="dashboard-component-body rounded flex items-center justify-center">
                                                <div class="text-center">
                                                    <span class="material-symbols-outlined text-gray-500" style="font-size: 48px;">analytics</span>
                                                    <p class="text-gray-500 text-sm mt-2">Chart Placeholder</p>
                                                </div>
                                            </div>
                                            <div class="resize-handle border-solid"></div>
                                        </div>
                                    </div>
                                    <div class="command-room-nav bg-gray-700 rounded-lg flex items-center space-x-2 p-2 mt-4">
                                        <button id="linked-existing-add-component-button" class="text-sm bg-gray-700 text-white hover:bg-gray-600 py-1.5 px-3 pl-2 rounded-md transition duration-200 flex items-center space-x-1.5">
                                            <span class="material-symbols-outlined" style="font-size: 20px;">add</span>
                                            <span>Component</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                        linkContentSelectedItem = {
                            type: item.type,
                            id: item.id,
                            name: item.name,
                            sections: item.sections || 0,
                            pages: item.pages || 0
                        };
                        linkContentSubItems = buildSubItemsForContent();
                        linkContentCurrentIndex = Math.min(Math.max(1, sub.index || 1), Math.max(1, linkContentSubItems.length));
                        linkContentSelectedSub = linkContentSubItems[linkContentCurrentIndex - 1] || null;
                        bindLinkedStateActionButtons(contentTabExisting);
                        bindLinkedExistingNavEvents(contentTabExisting);
                        updateLinkContentNavDisplay();
                        buildNavDropdown();
                        initLinkedExistingDashboard();
                        return;
                    }

                    contentTabExisting.innerHTML = `
                        <div class="flex flex-col w-full h-full min-h-0">
                            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                                <div class="flex items-center space-x-4">
                                    <div class="text-white text-lg font-semibold">${item.name}</div>
                                    <div class="text-gray-400 text-xs mt-0.5 flex items-center space-x-2">
                                        <span>Story</span>
                                        <span>•</span>
                                        <span>${sub.label}</span>
                                    </div>
                                    <div class="relative">
                                        <button type="button" class="linked-existing-header-options-btn options-dropdown-button">
                                            <span class="material-symbols-outlined text-lg">more_vert</span>
                                        </button>
                                        <div id="linked-existing-header-menu" class="options-dropdown-menu absolute right-0 top-full mt-2 hidden">
                                            <a href="#" class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition duration-150" data-action="change-linked-content">Change linked content</a>
                                            <a href="#" class="block px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition duration-150" data-action="remove-linked-content">Remove</a>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <div class="flex items-center gap-2">
                                        <div class="flex items-center gap-2 flex-shrink-0">
                                            <button type="button" id="linked-existing-nav-prev" class="flex items-center justify-center w-9 h-9 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition disabled:opacity-40 disabled:cursor-not-allowed" title="Previous">
                                                <span class="material-symbols-outlined text-[20px]">arrow_back</span>
                                            </button>
                                            <div class="relative">
                                                <button type="button" id="linked-existing-nav-dropdown-btn" class="bg-gray-700 hover:bg-gray-600 text-white px-3 pr-2 py-1.5 w-64 text-sm font-medium rounded-lg transition duration-200 flex items-center space-x-2 max-w-80" title="Select section">
                                                    <span id="linked-existing-nav-current-label" class="whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left">${sub.label}</span>
                                                    <span class="material-symbols-outlined text-md flex-shrink-0">expand_more</span>
                                                </button>
                                                <div id="linked-existing-nav-dropdown" class="options-dropdown-menu absolute right-0 top-full mt-2 w-64 max-h-64 overflow-y-auto hidden py-2 z-10"></div>
                                            </div>
                                            <button type="button" id="linked-existing-nav-next" class="flex items-center justify-center w-9 h-9 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition disabled:opacity-40 disabled:cursor-not-allowed" title="Next">
                                                <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center space-x-6 shrink-0 px-6 py-4 border-b border-gray-800">
                                <div class="flex items-center space-x-4">
                                    <span class="material-symbols-outlined text-gray-400" style="font-size: 20px;">dark_mode</span>
                                    <div class="flex items-center">
                                        <button id="linked-existing-story-theme-dark-button" class="bg-red-600 active text-white px-3 py-1.5 text-sm font-medium rounded-l-lg transition duration-200">Dark</button>
                                        <button id="linked-existing-story-theme-light-button" class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 text-sm font-medium rounded-r-lg transition duration-200">Light</button>
                                    </div>
                                </div>
                                <div class="h-8 border-l border-gray-800"></div>
                                <label class="flex items-center gap-2 cursor-pointer select-none" for="linked-existing-story-filters-visibility-toggle">
                                    <span class="toggle-switch">
                                        <input type="checkbox" id="linked-existing-story-filters-visibility-toggle">
                                        <span class="toggle-slider"></span>
                                    </span>
                                    <span class="text-sm text-gray-300">Enable Screen Filters</span>
                                </label>
                            </div>
                            <div class="flex-grow min-h-0 flex flex-col p-6 overflow-auto">
                                <div id="linked-existing-story-filters-section" class="hidden w-full mx-auto mb-6 pb-6 border-b border-gray-800">
                                    <div class="flex justify-center">
                                        <button class="text-sm bg-gray-700 text-white hover:bg-gray-600 py-1.5 px-3 pl-2 rounded-md transition duration-200 flex items-center space-x-1.5">
                                            <span class="material-symbols-outlined" style="font-size: 20px;">add</span>
                                            <span>Filter</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="flex-grow min-h-0">
                                    <div class="w-full h-full flex items-center justify-center">
                                        <div class="text-center text-gray-400">
                                            <span class="material-symbols-outlined text-5xl opacity-60 mb-3 block">description</span>
                                            <p class="text-base text-gray-300">Story linked content placeholder</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    linkContentSelectedItem = {
                        type: item.type,
                        id: item.id,
                        name: item.name,
                        sections: item.sections || 0,
                        pages: item.pages || 0
                    };
                    linkContentSubItems = buildSubItemsForContent();
                    linkContentCurrentIndex = Math.min(Math.max(1, sub.index || 1), Math.max(1, linkContentSubItems.length));
                    linkContentSelectedSub = linkContentSubItems[linkContentCurrentIndex - 1] || null;
                    bindLinkedStateActionButtons(contentTabExisting);
                    bindLinkedExistingNavEvents(contentTabExisting);
                    updateLinkContentNavDisplay();
                    buildNavDropdown();
                    initLinkedExistingStory();
                }

                function openLinkContentModal(openWithLinkedSelection = false) {
                    ensureListingInitialized();
                    let openWithExisting = false;
                    if (typeof openWithLinkedSelection === 'object' && openWithLinkedSelection) {
                        openWithExisting = Boolean(openWithLinkedSelection.openWithLinkedSelection);
                        if (openWithLinkedSelection.selection && openWithLinkedSelection.selection.item && openWithLinkedSelection.selection.sub) {
                            linkedContentSelection = {
                                item: { ...openWithLinkedSelection.selection.item },
                                sub: { ...openWithLinkedSelection.selection.sub }
                            };
                        }
                    } else {
                        openWithExisting = Boolean(openWithLinkedSelection);
                    }
                    if (modalController) modalController.open();
                    if (openWithExisting && linkedContentSelection && linkedContentSelection.item && linkedContentSelection.sub) {
                        linkContentSelectedItem = {
                            type: linkedContentSelection.item.type,
                            id: linkedContentSelection.item.id,
                            name: linkedContentSelection.item.name,
                            sections: linkedContentSelection.item.sections || 0,
                            pages: linkedContentSelection.item.pages || 0
                        };
                        linkContentSubItems = buildSubItemsForContent();
                        const requestedIndex = linkedContentSelection.sub.index || 1;
                        const boundedIndex = Math.min(Math.max(1, requestedIndex), Math.max(1, linkContentSubItems.length));
                        linkContentCurrentIndex = boundedIndex;
                        linkContentSelectedSub = linkContentSubItems[boundedIndex - 1] || null;
                        if (linkContentListingApi) {
                            linkContentListingApi.selectItem(linkContentSelectedItem.id);
                        }
                        if (step2Title) step2Title.textContent = linkContentSelectedItem.name || '';
                        if (step2Type) step2Type.textContent = linkContentSelectedItem.type === 'story' ? 'Story' : 'Dashboard';
                        if (step2Count) {
                            const n = linkContentSelectedItem.type === 'story' ? (linkContentSelectedItem.sections || 0) : (linkContentSelectedItem.pages || 0);
                            step2Count.textContent = linkContentSelectedItem.type === 'story' ? (n + ' Section' + (n !== 1 ? 's' : '')) : (n + ' Page' + (n !== 1 ? 's' : ''));
                        }
                        showLinkContentStep(2, 'forward');
                        if (confirmBtn) confirmBtn.disabled = !linkContentSelectedSub;
                        updateLinkContentNavDisplay();
                        buildNavDropdown();
                    } else {
                        linkContentSelectedItem = null;
                        linkContentSelectedSub = null;
                        showLinkContentStep(1, 'backward');
                        updateLinkContentFooter();
                        if (confirmBtn) confirmBtn.disabled = true;
                        if (linkContentListingApi) linkContentListingApi.clearSelection();
                    }
                }

                function closeLinkContentModal() {
                    if (modalController) {
                        modalController.close('programmatic');
                        return;
                    }
                    if (modal) modal.classList.add('hidden');
                }

                if (cancelBtn) cancelBtn.addEventListener('click', closeLinkContentModal);
                ensureListingInitialized();

                function buildSubItemsForContent() {
                    if (!linkContentSelectedItem) return [];
                    const count = linkContentSelectedItem.type === 'story' ? linkContentSelectedItem.sections : linkContentSelectedItem.pages;
                    const n = Math.max(1, count || 1);
                    const prefix = linkContentSelectedItem.type === 'story' ? 'Section' : 'Page';
                    const items = [];
                    for (let i = 1; i <= n; i++) {
                        items.push({ index: i, label: prefix + ' ' + i });
                    }
                    return items;
                }

                function buildStoryChapters(sectionCount) {
                    const sectionsPerChapter = 4;
                    const chapters = [];
                    let s = 1;
                    while (s <= sectionCount) {
                        const end = Math.min(s + sectionsPerChapter - 1, sectionCount);
                        chapters.push({ chapterNum: chapters.length + 1, start: s, end, labels: [] });
                        for (let i = s; i <= end; i++) {
                            chapters[chapters.length - 1].labels.push({ index: i, label: 'Section ' + i });
                        }
                        s = end + 1;
                    }
                    return chapters;
                }

                function updateLinkContentNavDisplay() {
                    const item = linkContentSubItems[linkContentCurrentIndex - 1];
                    if (navCurrentLabel) navCurrentLabel.textContent = item ? item.label : '—';
                    if (navPrevBtn) navPrevBtn.disabled = linkContentCurrentIndex <= 1;
                    if (navNextBtn) navNextBtn.disabled = linkContentCurrentIndex >= linkContentSubItems.length;
                    const linkedNavCurrentLabel = document.getElementById('linked-existing-nav-current-label');
                    const linkedNavPrevBtn = document.getElementById('linked-existing-nav-prev');
                    const linkedNavNextBtn = document.getElementById('linked-existing-nav-next');
                    if (linkedNavCurrentLabel) linkedNavCurrentLabel.textContent = item ? item.label : '—';
                    if (linkedNavPrevBtn) linkedNavPrevBtn.disabled = linkContentCurrentIndex <= 1;
                    if (linkedNavNextBtn) linkedNavNextBtn.disabled = linkContentCurrentIndex >= linkContentSubItems.length;
                    linkContentSelectedSub = item ? { index: item.index, label: item.label } : null;
                    if (linkedContentSelection && linkedContentSelection.item && linkContentSelectedItem &&
                        linkedContentSelection.item.id === linkContentSelectedItem.id &&
                        linkedContentSelection.item.type === linkContentSelectedItem.type &&
                        linkContentSelectedSub) {
                        linkedContentSelection.sub = { index: linkContentSelectedSub.index, label: linkContentSelectedSub.label };
                    }
                    updateLinkContentFooter();
                    if (confirmBtn) confirmBtn.disabled = !linkContentSelectedSub;
                    if (navDropdownBtn && typeof navDropdownBtn.__setPortaledDropdownValue === 'function' && item) {
                        navDropdownBtn.__setPortaledDropdownValue(String(item.index), false);
                    }
                }

                function populateSingleNavDropdown(dropdownEl) {
                    if (!dropdownEl || !linkContentSelectedItem) return;
                    dropdownEl.innerHTML = '';
                    if (linkContentSelectedItem.type === 'story') {
                        const chapters = buildStoryChapters(linkContentSelectedItem.sections || 1);
                        chapters.forEach(ch => {
                            const chapterHead = document.createElement('div');
                            chapterHead.className = 'px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-700 first:border-t-0';
                            chapterHead.textContent = 'Chapter ' + ch.chapterNum;
                            dropdownEl.appendChild(chapterHead);
                            ch.labels.forEach(({ index, label }) => {
                                const a = document.createElement('button');
                                a.type = 'button';
                                a.className = 'link-content-dropdown-item w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition block';
                                a.dataset.index = String(index);
                                a.dataset.label = label;
                                a.textContent = label;
                                if (index === linkContentCurrentIndex) a.classList.add('bg-gray-700', 'text-red-400');
                                a.addEventListener('click', () => {
                                    linkContentCurrentIndex = index;
                                    updateLinkContentNavDisplay();
                                    const linkedDropdown = document.getElementById('linked-existing-nav-dropdown');
                                    if (navDropdown) navDropdown.classList.add('hidden');
                                    if (linkedDropdown) linkedDropdown.classList.add('hidden');
                                    buildNavDropdown();
                                });
                                dropdownEl.appendChild(a);
                            });
                        });
                    } else {
                        linkContentSubItems.forEach(({ index, label }) => {
                            const a = document.createElement('button');
                            a.type = 'button';
                            a.className = 'link-content-dropdown-item w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition block';
                            a.dataset.index = String(index);
                            a.dataset.label = label;
                            a.textContent = label;
                            if (index === linkContentCurrentIndex) a.classList.add('bg-gray-700', 'text-red-400');
                            a.addEventListener('click', () => {
                                linkContentCurrentIndex = index;
                                updateLinkContentNavDisplay();
                                const linkedDropdown = document.getElementById('linked-existing-nav-dropdown');
                                if (navDropdown) navDropdown.classList.add('hidden');
                                if (linkedDropdown) linkedDropdown.classList.add('hidden');
                                buildNavDropdown();
                            });
                            dropdownEl.appendChild(a);
                        });
                    }
                }

                function buildNavGroupedOptions() {
                    if (!linkContentSelectedItem) return [];
                    if (linkContentSelectedItem.type === 'story') {
                        const chapters = buildStoryChapters(linkContentSelectedItem.sections || 1);
                        return chapters.map((chapter) => ({
                            heading: `Chapter ${chapter.chapterNum}`,
                            options: chapter.labels.map(({ index, label }) => ({
                                value: String(index),
                                label
                            }))
                        }));
                    }
                    return [
                        {
                            heading: 'Pages',
                            options: linkContentSubItems.map(({ index, label }) => ({
                                value: String(index),
                                label
                            }))
                        }
                    ];
                }

                function ensureModalNavDropdownInitialized() {
                    if (!llComponents || typeof llComponents.initializePortaledDropdown !== 'function') return;
                    if (!navDropdownBtn || !navDropdown || !linkContentSelectedItem) return;
                    const nextSignature = `${linkContentSelectedItem.type}:${linkContentSubItems.length}`;
                    if (navDropdownSelectionSignature === nextSignature && navDropdownBtn.dataset.linkContentNavDropdownBound === 'true') {
                        return;
                    }
                    navDropdownSelectionSignature = nextSignature;
                    /*
                     * Replacing trigger/menu nodes prevents stacked click listeners when
                     * switching selections repeatedly (which caused intermittent dropdown failure).
                     */
                    const nextBtn = navDropdownBtn.cloneNode(true);
                    const nextMenu = navDropdown.cloneNode(false);
                    nextMenu.innerHTML = '';
                    if (navDropdownBtn.parentNode) {
                        navDropdownBtn.parentNode.replaceChild(nextBtn, navDropdownBtn);
                    }
                    if (navDropdown.parentNode) {
                        navDropdown.parentNode.replaceChild(nextMenu, navDropdown);
                    }
                    navDropdownBtn = nextBtn;
                    navDropdown = nextMenu;
                    navCurrentLabel = navDropdownBtn.querySelector('#link-content-nav-current-label');

                    llComponents.initializePortaledDropdown({
                        buttonId: 'link-content-nav-dropdown-btn',
                        menuId: 'link-content-nav-dropdown',
                        selectedValueSelector: '.ll-dropdown__selected-value',
                        datasetFlag: 'linkContentNavDropdownBound',
                        menuType: 'selection',
                        defaultValue: String(Math.max(1, linkContentCurrentIndex || 1)),
                        matchTriggerWidth: true,
                        emptySelectionLabel: 'Select section or page',
                        groupedOptions: buildNavGroupedOptions(),
                        onValueChange: ({ value }) => {
                            const parsedIndex = Number.parseInt(String(value || ''), 10);
                            if (!Number.isFinite(parsedIndex)) return;
                            if (parsedIndex < 1 || parsedIndex > linkContentSubItems.length) return;
                            linkContentCurrentIndex = parsedIndex;
                            updateLinkContentNavDisplay();
                            const linkedDropdown = document.getElementById('linked-existing-nav-dropdown');
                            populateSingleNavDropdown(linkedDropdown);
                        }
                    });
                    if (typeof navDropdownBtn.__setPortaledDropdownValue === 'function') {
                        navDropdownBtn.__setPortaledDropdownValue(String(Math.max(1, linkContentCurrentIndex || 1)), false);
                    }
                }

                function buildNavDropdown() {
                    ensureModalNavDropdownInitialized();
                    const linkedDropdown = document.getElementById('linked-existing-nav-dropdown');
                    populateSingleNavDropdown(linkedDropdown);
                }

                if (navPrevBtn) {
                    navPrevBtn.addEventListener('click', () => {
                        if (linkContentCurrentIndex > 1) {
                            linkContentCurrentIndex--;
                            updateLinkContentNavDisplay();
                            buildNavDropdown();
                        }
                    });
                }
                if (navNextBtn) {
                    navNextBtn.addEventListener('click', () => {
                        if (linkContentCurrentIndex < linkContentSubItems.length) {
                            linkContentCurrentIndex++;
                            updateLinkContentNavDisplay();
                            buildNavDropdown();
                        }
                    });
                }
                if (backBtn) {
                    backBtn.addEventListener('click', () => {
                        showLinkContentStep(1, 'backward');
                        linkContentSelectedSub = null;
                        if (confirmBtn) confirmBtn.disabled = true;
                        updateLinkContentFooter();
                    });
                }

                function updateLinkContentFooter() {
                    if (!footerSelection) return;
                    if (!linkContentSelectedItem) {
                        footerSelection.innerHTML = `
                            <div class="text-sm ll-text-muted">No content selected</div>
                        `;
                        return;
                    }
                    const sub = linkContentSelectedSub ? linkContentSelectedSub.label : '—';
                    footerSelection.innerHTML = `
                        <div class="text-sm ll-text-muted">Selection:</div>
                        <div class="flex gap-3">
                            <span class="font-semibold">${escapeHtml(linkContentSelectedItem.name || '')}</span>
                            <span>→</span>
                            <span class="font-semibold">${escapeHtml(sub || '—')}</span>
                        </div>
                    `;
                }

                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => {
                        if (!linkContentSelectedItem || !linkContentSelectedSub) return;
                        const selectedPayload = {
                            item: {
                                type: linkContentSelectedItem.type,
                                id: linkContentSelectedItem.id,
                                name: linkContentSelectedItem.name,
                                sections: linkContentSelectedItem.sections || 0,
                                pages: linkContentSelectedItem.pages || 0
                            },
                            sub: {
                                index: linkContentSelectedSub.index,
                                label: linkContentSelectedSub.label
                            }
                        };
                        closeLinkContentModal();
                        linkedContentSelection = selectedPayload;
                        if (typeof externalOnConfirm === 'function') {
                            externalOnConfirm({
                                item: { ...selectedPayload.item },
                                sub: { ...selectedPayload.sub }
                            });
                        }
                        if (document.getElementById('content-tab-existing')) {
                            renderExistingLinkedState();
                        }
                    });
                }


        window.__linkExistingContentModalInitialized = true;
        window.__linkExistingContentModalApi = {
            openLinkContentModal,
            closeLinkContentModal,
            renderExistingLinkedState,
            renderExistingEmptyState,
            setWorkspaceName: (workspaceName) => {
                const nextName = String(workspaceName || '').trim() || 'Finance';
                applyWorkspaceTitle(nextName);
            },
            setOnConfirm: (callback) => {
                externalOnConfirm = typeof callback === 'function' ? callback : null;
            },
            setSelection: (selection) => {
                if (selection && selection.item && selection.sub) {
                    linkedContentSelection = {
                        item: { ...selection.item },
                        sub: { ...selection.sub }
                    };
                    return;
                }
                linkedContentSelection = null;
            },
            getSelection: () => {
                if (!linkedContentSelection) return null;
                return {
                    item: { ...linkedContentSelection.item },
                    sub: { ...linkedContentSelection.sub }
                };
            },
            clearSelection: () => {
                linkedContentSelection = null;
            },
        };
        return window.__linkExistingContentModalApi;
    };
})();
