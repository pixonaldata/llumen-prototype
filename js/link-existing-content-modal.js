(function initLinkExistingContentModalModule() {
    const STYLE_ID = 'link-existing-content-modal-style';
    const MODAL_ID = 'link-existing-content-modal';

    const modalTemplate = `
    <div id="link-existing-content-modal" class="fixed inset-0 bg-black bg-opacity-50 z-[150] hidden p-6 flex flex-col">
        <div class="bg-gray-900 rounded-xl shadow-xl flex flex-col flex-1 min-h-0 w-full">
            <!-- Persistent modal header (visible in both steps) -->
            <div id="link-content-modal-header" class="py-4 px-6 border-b border-gray-700 flex-shrink-0">
                <div class="flex items-center justify-between">
                    <h2 id="link-content-modal-title" class="text-xl font-semibold text-white">Select Content from Finance Workspace</h2>
                    <button type="button" id="link-content-modal-close" class="flex items-center text-gray-400 hover:text-white transition duration-200">
                        <span class="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>
            </div>
            <!-- Step 2: header (back + content name + metadata + section/page nav) -->
            <div id="link-content-step2-header" class="hidden py-3 px-6 border-b border-gray-700 flex-shrink-0 flex items-center gap-4">
                <button type="button" id="link-content-back-btn" class="flex items-center justify-center w-9 h-9 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition duration-200" title="Back to content">
                    <span class="material-symbols-outlined text-lg">arrow_back_ios_new</span>
                </button>
                <h2 id="link-content-step2-title" class="text-lg font-semibold text-white truncate min-w-0"></h2>
                <div id="link-content-step2-meta" class="flex items-center gap-4 flex-shrink-0">
                    <span id="link-content-step2-type" class="text-sm text-gray-400"></span>
                    <span id="link-content-step2-count" class="text-sm text-gray-400"></span>
                </div>
                <div class="flex items-center gap-3 ml-auto flex-shrink-0">
                    <button type="button" id="link-content-nav-prev" class="flex items-center justify-center w-9 h-9 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition disabled:opacity-40 disabled:cursor-not-allowed" title="Previous">
                        <span class="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>
                    <div class="relative">
                        <button type="button" id="link-content-nav-dropdown-btn" class="bg-gray-700 hover:bg-gray-600 text-white px-3 pr-2 py-1.5 w-64 text-sm font-medium rounded-lg transition duration-200 flex items-center space-x-2 max-w-80" title="Select section or page">
                            <span id="link-content-nav-current-label" class="whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left">—</span>
                            <span class="material-symbols-outlined text-md flex-shrink-0">expand_more</span>
                        </button>
                        <div id="link-content-nav-dropdown" class="options-dropdown-menu absolute right-0 top-full mt-2 w-64 max-h-64 overflow-y-auto hidden py-2 z-10"></div>
                    </div>
                    <button type="button" id="link-content-nav-next" class="flex items-center justify-center w-9 h-9 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition disabled:opacity-40 disabled:cursor-not-allowed" title="Next">
                        <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>
                </div>
            </div>
            <div class="flex flex-col flex-1 min-h-0 overflow-hidden">
                <!-- Step 1: Content browser -->
                <div id="link-content-step1" class="flex flex-col flex-1 min-h-0">
                    <div class="flex items-center gap-4 px-6 py-3 border-b border-gray-700 flex-shrink-0 flex-wrap">
                        <div class="flex items-center gap-4">
                            <button type="button" id="link-content-tab-all" class="link-content-tab px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white" data-tab="all">All</button>
                            <button type="button" id="link-content-tab-stories" class="link-content-tab px-4 py-2 rounded-md text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600" data-tab="stories">Stories</button>
                            <button type="button" id="link-content-tab-dashboards" class="link-content-tab px-4 py-2 rounded-md text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600" data-tab="dashboards">Dashboards</button>
                        </div>
                        <div class="flex items-center gap-3 ml-auto flex-shrink-0">
                            <div class="relative">
                                <input type="text" id="link-content-search" placeholder="Search..."
                                    class="bg-gray-700 text-white rounded-md p-2 pl-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                    style="width: 300px; padding-right: 3rem;" />
                                <button id="link-content-search-clear" type="button"
                                    class="absolute right-11 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none hidden"
                                    data-tooltip="Clear Search" title="Clear Search">
                                    <span class="material-symbols-outlined text-2xl">close</span>
                                </button>
                                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">search</span>
                            </div>
                            <div class="relative">
                                <button type="button" id="link-content-sort-btn" class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md transition duration-200 text-sm flex items-center">
                                    <span class="material-symbols-outlined mr-2">sort</span>
                                    <span class="link-content-sort-value mr-1">Sort</span>
                                    <span class="material-symbols-outlined text-[18px]">expand_more</span>
                                    <span id="link-content-sort-clear" class="ml-2 text-red-400 hover:text-red-300 hidden cursor-pointer flex items-center" title="Clear Sort"><span class="material-symbols-outlined text-[18px]">cancel</span></span>
                                </button>
                                <div id="link-content-sort-dropdown" class="options-dropdown-menu absolute right-0 top-full mt-2 w-40 hidden">
                                    <a href="#" class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition" data-sort="default">Default</a>
                                    <a href="#" class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition" data-sort="last-updated">Last Updated</a>
                                    <a href="#" class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition" data-sort="title-asc">Title (A-Z)</a>
                                    <a href="#" class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition" data-sort="title-desc">Title (Z-A)</a>
                                </div>
                            </div>
                            <div class="flex rounded-md overflow-hidden flex-shrink-0">
                                <button type="button" class="link-content-view-btn bg-red-600 text-white px-3 py-1.5 h-9 text-sm flex items-center" data-view="grid" title="Grid"><span class="material-symbols-outlined text-[20px]">grid_view</span></button>
                                <button type="button" class="link-content-view-btn bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 h-9 text-sm flex items-center" data-view="list" title="List"><span class="material-symbols-outlined text-[20px]">menu</span></button>
                            </div>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto">
                        <div id="link-content-body">
                            <div id="link-content-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
                                <div class="link-content-card bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-gray-600 cursor-pointer transition selectable-card" data-type="story" data-id="s1" data-name="Q2 Performance Review" data-sections="14">
                                    <img src="https://placehold.co/400x225/1a202c/e2e8f0?text=Screenshot+of+first+section" class="w-full h-40 object-cover" alt="">
                                    <div class="p-3">
                                        <h3 class="text-xl font-semibold text-white line-clamp-2">Q2 Performance Review: Deep Dive into Financial Metrics</h3>
                                        <div class="flex justify-between items-center mt-3 text-sm text-gray-400"><span>Story</span><span>14 Sections</span></div>
                                    </div>
                                </div>
                                <div class="link-content-card bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-gray-600 cursor-pointer transition selectable-card" data-type="story" data-id="s2" data-name="Employee Engagement Trends 2024" data-sections="17">
                                    <img src="https://placehold.co/400x225/2c5282/ffffff?text=Screenshot+of+first+section" class="w-full h-40 object-cover" alt="">
                                    <div class="p-3">
                                        <h3 class="text-xl font-semibold text-white line-clamp-2">Employee Engagement Trends 2024: Key Insights</h3>
                                        <div class="flex justify-between items-center mt-3 text-sm text-gray-400"><span>Story</span><span>17 Sections</span></div>
                                    </div>
                                </div>
                                <div class="link-content-card bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-gray-600 cursor-pointer transition selectable-card" data-type="dashboard" data-id="d1" data-name="Operations Dashboard" data-pages="4">
                                    <img src="https://placehold.co/400x225/2d3748/f7fafc?text=Screenshot+of+first+page" class="w-full h-40 object-cover" alt="">
                                    <div class="p-3">
                                        <h3 class="text-xl font-semibold text-white line-clamp-2">Operations Dashboard: Live KPIs and Supply Chain</h3>
                                        <div class="flex justify-between items-center mt-3 text-sm text-gray-400"><span>Dashboard</span><span>4 Pages</span></div>
                                    </div>
                                </div>
                                <div class="link-content-card bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-gray-600 cursor-pointer transition selectable-card" data-type="dashboard" data-id="d2" data-name="Monthly Sales Performance" data-pages="3">
                                    <img src="https://placehold.co/400x225/5f2120/ffffff?text=Screenshot+of+first+page" class="w-full h-40 object-cover" alt="">
                                    <div class="p-3">
                                        <h3 class="text-xl font-semibold text-white line-clamp-2">Monthly Sales Performance: Regional Breakdowns</h3>
                                        <div class="flex justify-between items-center mt-3 text-sm text-gray-400"><span>Dashboard</span><span>3 Pages</span></div>
                                    </div>
                                </div>
                            </div>
                            <div id="link-content-list" class="hidden overflow-x-auto">
                                <table class="w-full"><thead class="border-b border-gray-800"><tr><th class="px-6 py-3 text-left text-sm font-medium text-gray-300 w-full">Name</th><th class="px-6 py-3 text-left text-sm font-medium text-gray-300 whitespace-nowrap">Type</th><th class="px-6 py-3 text-left text-sm font-medium text-gray-300 whitespace-nowrap">Content</th></tr></thead><tbody id="link-content-tbody" class="divide-y divide-gray-800"></tbody></table>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Step 2: Preview + compact nav in header (no Preview title, no large list) -->
                <div id="link-content-step2" class="hidden flex flex-col flex-1 min-h-0">
                    <div id="link-content-preview-body" class="flex-1 overflow-y-auto p-6">
                        <div id="link-content-preview-placeholder" class="bg-gray-800 border border-gray-700 rounded-xl min-h-[680px] flex items-center justify-center text-gray-500 text-sm">Preview placeholder</div>
                    </div>
                </div>
            </div>
            <div class="py-4 px-6 border-t border-gray-700 flex items-center justify-between flex-shrink-0">
                <div id="link-content-footer-selection">No content selected</div>
                <div class="flex gap-3">
                    <button type="button" id="link-content-cancel" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition">Cancel</button>
                    <button type="button" id="link-content-confirm" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed" disabled>Select Content</button>
                </div>
            </div>
        </div>
    </div>
    `;

    const modalStyles = `
#link-content-sort-dropdown a.active {
    background-color: #4b5563;
    color: #ffffff;
}
#link-existing-content-modal .link-content-tab.bg-red-600:hover {
    background-color: #dc2626;
}
#link-existing-content-modal .link-content-view-btn.bg-red-600:hover {
    background-color: #dc2626;
}
#link-existing-content-modal .link-content-card.border-red-500:hover {
    border-color: #ef4444;
}
#link-existing-content-modal .link-content-list-row.link-content-row-selected:hover {
    background-color: rgb(153 27 27 / 0.4) !important;
}
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

    function ensureModalMarkup() {
        if (document.getElementById(MODAL_ID)) return;
        document.body.insertAdjacentHTML('beforeend', modalTemplate);
    }

    window.initLinkExistingContentModal = function initLinkExistingContentModal(options = {}) {
        const nextWorkspaceName = String(options.workspace_name || options.workspaceName || 'Finance').trim() || 'Finance';

        const applyWorkspaceTitle = (workspaceName) => {
            const titleEl = document.getElementById('link-content-modal-title');
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
        ensureModalMarkup();
        applyWorkspaceTitle(nextWorkspaceName);


                const modal = document.getElementById('link-existing-content-modal');
                const openBtn = document.getElementById('link-existing-content-button');
                const closeBtn = document.getElementById('link-content-modal-close');
                const cancelBtn = document.getElementById('link-content-cancel');
                const confirmBtn = document.getElementById('link-content-confirm');
                const sortBtn = document.getElementById('link-content-sort-btn');
                const sortDropdown = document.getElementById('link-content-sort-dropdown');
                const sortClearBtn = document.getElementById('link-content-sort-clear');
                const sortValueSpan = sortBtn ? sortBtn.querySelector('.link-content-sort-value') : null;
                const footerSelection = document.getElementById('link-content-footer-selection');
                const step1Body = document.getElementById('link-content-step1');
                const step2Header = document.getElementById('link-content-step2-header');
                const step2Body = document.getElementById('link-content-step2');
                const step2Title = document.getElementById('link-content-step2-title');
                const step2Type = document.getElementById('link-content-step2-type');
                const step2Count = document.getElementById('link-content-step2-count');
                const backBtn = document.getElementById('link-content-back-btn');
                const navPrevBtn = document.getElementById('link-content-nav-prev');
                const navNextBtn = document.getElementById('link-content-nav-next');
                const navCurrentLabel = document.getElementById('link-content-nav-current-label');
                const navDropdownBtn = document.getElementById('link-content-nav-dropdown-btn');
                const navDropdown = document.getElementById('link-content-nav-dropdown');

                let linkContentCurrentTab = 'all';
                let linkContentSubItems = [];
                let linkContentCurrentIndex = 1;
                let linkContentCurrentSort = 'default';
                let linkContentCurrentView = 'grid';
                let linkContentSelectedItem = null;
                let linkContentSelectedSub = null;
                let linkedContentSelection = null;
                let externalOnConfirm = typeof options.onConfirm === 'function' ? options.onConfirm : null;

                function showLinkContentStep(step) {
                    const isStep1 = step === 1;
                    if (step1Body) step1Body.classList.toggle('hidden', !isStep1);
                    if (step2Header) step2Header.classList.toggle('hidden', isStep1);
                    if (step2Body) step2Body.classList.toggle('hidden', isStep1);
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
                    if (modal) modal.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
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
                        showLinkContentStep(2);
                        if (step2Title) step2Title.textContent = linkContentSelectedItem.name;
                        if (step2Type) step2Type.textContent = linkContentSelectedItem.type === 'story' ? 'Story' : 'Dashboard';
                        if (step2Count) {
                            const n = linkContentSelectedItem.type === 'story' ? (linkContentSelectedItem.sections || 0) : (linkContentSelectedItem.pages || 0);
                            step2Count.textContent = linkContentSelectedItem.type === 'story' ? (n + ' Section' + (n !== 1 ? 's' : '')) : (n + ' Page' + (n !== 1 ? 's' : ''));
                        }
                        if (confirmBtn) confirmBtn.disabled = !linkContentSelectedSub;
                        updateLinkContentNavDisplay();
                        buildNavDropdown();
                        applySelectionToView();
                    } else {
                        linkContentSelectedItem = null;
                        linkContentSelectedSub = null;
                        showLinkContentStep(1);
                        updateLinkContentFooter();
                        if (confirmBtn) confirmBtn.disabled = true;
                        applySelectionToView();
                    }
                }

                function closeLinkContentModal() {
                    if (modal) modal.classList.add('hidden');
                    document.body.style.overflow = '';
                }

                const searchInput = document.getElementById('link-content-search');
                const searchClearBtn = document.getElementById('link-content-search-clear');
                function filterLinkContent() {
                    const q = (searchInput && searchInput.value) ? searchInput.value.trim().toLowerCase() : '';
                    const typeFilter = linkContentCurrentTab === 'stories' ? 'story' : (linkContentCurrentTab === 'dashboards' ? 'dashboard' : null);
                    const grid = document.getElementById('link-content-grid');
                    const tbody = document.getElementById('link-content-tbody');
                    if (grid) {
                        grid.querySelectorAll('.link-content-card').forEach(el => {
                            const matchType = !typeFilter || el.dataset.type === typeFilter;
                            const name = (el.dataset.name || '').toLowerCase();
                            const title = (el.querySelector('h3') && el.querySelector('h3').textContent || '').toLowerCase();
                            const matchSearch = !q || name.includes(q) || title.includes(q);
                            el.classList.toggle('hidden', !(matchType && matchSearch));
                        });
                    }
                    if (tbody) {
                        tbody.querySelectorAll('.link-content-list-row').forEach(el => {
                            const matchType = !typeFilter || el.dataset.type === typeFilter;
                            const text = (el.textContent || '').toLowerCase();
                            const matchSearch = !q || text.includes(q);
                            el.classList.toggle('hidden', !(matchType && matchSearch));
                        });
                    }
                }
                if (searchInput) {
                    searchInput.addEventListener('input', () => {
                        filterLinkContent();
                        if (searchClearBtn) {
                            if (searchInput.value.length > 0) {
                                searchClearBtn.classList.remove('hidden');
                            } else {
                                searchClearBtn.classList.add('hidden');
                            }
                        }
                    });
                }
                if (searchClearBtn) {
                    searchClearBtn.addEventListener('click', () => {
                        if (searchInput) {
                            searchInput.value = '';
                            searchInput.focus();
                        }
                        searchClearBtn.classList.add('hidden');
                        filterLinkContent();
                    });
                }

                if (openBtn) openBtn.addEventListener('click', openLinkContentModal);
                if (closeBtn) closeBtn.addEventListener('click', closeLinkContentModal);
                if (cancelBtn) cancelBtn.addEventListener('click', closeLinkContentModal);
                if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeLinkContentModal(); });

                document.querySelectorAll('.link-content-tab').forEach(tab => {
                    tab.addEventListener('click', () => {
                        linkContentCurrentTab = tab.dataset.tab;
                        document.querySelectorAll('.link-content-tab').forEach(t => {
                            t.classList.remove('bg-red-600', 'text-white');
                            t.classList.add('bg-gray-700', 'text-gray-300');
                            if (t.dataset.tab === linkContentCurrentTab) {
                                t.classList.remove('bg-gray-700', 'text-gray-300');
                                t.classList.add('bg-red-600', 'text-white');
                            }
                        });
                        filterLinkContent();
                    });
                });

                if (sortBtn && sortDropdown) {
                    sortBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        sortDropdown.classList.toggle('hidden');
                    });
                    sortDropdown.querySelectorAll('a[data-sort]').forEach(link => {
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                            linkContentCurrentSort = link.dataset.sort;
                            sortDropdown.querySelectorAll('a').forEach(l => l.classList.remove('active'));
                            link.classList.add('active');
                            if (sortValueSpan) sortValueSpan.textContent = linkContentCurrentSort === 'default' ? 'Sort' : link.textContent.trim();
                            if (sortClearBtn) sortClearBtn.classList.toggle('hidden', linkContentCurrentSort === 'default');
                            sortDropdown.classList.add('hidden');
                        });
                    });
                    if (sortClearBtn) {
                        sortClearBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            linkContentCurrentSort = 'default';
                            sortDropdown.querySelectorAll('a').forEach(l => l.classList.remove('active'));
                            const def = sortDropdown.querySelector('a[data-sort="default"]');
                            if (def) def.classList.add('active');
                            if (sortValueSpan) sortValueSpan.textContent = 'Sort';
                            sortClearBtn.classList.add('hidden');
                        });
                    }
                    const defLink = sortDropdown.querySelector('a[data-sort="default"]');
                    if (defLink) defLink.classList.add('active');
                }
                document.addEventListener('click', () => { if (sortDropdown) sortDropdown.classList.add('hidden'); });

                function applySelectionToView() {
                    document.querySelectorAll('.link-content-card, .link-content-list-row').forEach(e => {
                        e.classList.remove('border-red-500', 'ring-2', 'ring-red-500/50', 'border-l-red-500', 'bg-red-800/40', 'link-content-row-selected');
                        e.classList.add('border-transparent');
                    });
                    if (!linkContentSelectedItem) return;
                    const type = linkContentSelectedItem.type;
                    const id = linkContentSelectedItem.id;
                    document.querySelectorAll('.link-content-card').forEach(card => {
                        if (card.dataset.type === type && card.dataset.id === id) {
                            card.classList.remove('border-transparent');
                            card.classList.add('border-red-500', 'ring-2', 'ring-red-500/50');
                        }
                    });
                    document.querySelectorAll('.link-content-list-row').forEach(row => {
                        if (row.dataset.type === type && row.dataset.id === id) {
                            row.classList.remove('border-transparent');
                            row.classList.add('bg-red-800/40', 'link-content-row-selected');
                        }
                    });
                }

                function populateListViews() {
                    const grid = document.getElementById('link-content-grid');
                    const tbody = document.getElementById('link-content-tbody');
                    if (!grid || !tbody) return;
                    tbody.innerHTML = '';
                    grid.querySelectorAll('.link-content-card').forEach(card => {
                        const row = document.createElement('tr');
                        row.className = 'link-content-list-row hover:bg-gray-800 cursor-pointer transition selectable-card';
                        row.dataset.type = card.dataset.type;
                        row.dataset.id = card.dataset.id;
                        row.dataset.name = card.dataset.name;
                        row.dataset.sections = card.dataset.sections || '';
                        row.dataset.pages = card.dataset.pages || '';
                        const title = card.querySelector('h3') ? card.querySelector('h3').textContent : card.dataset.name;
                        const typeLabel = card.dataset.type === 'story' ? 'Story' : 'Dashboard';
                        const meta = card.dataset.sections ? card.dataset.sections + ' Sections' : (card.dataset.pages ? card.dataset.pages + ' Pages' : '');
                        row.innerHTML = '<td class="px-6 py-3 text-white">' + title + '</td><td class="px-6 py-3 text-gray-400 whitespace-nowrap">' + typeLabel + '</td><td class="px-6 py-3 text-gray-400 whitespace-nowrap">' + meta + '</td>';
                        row.addEventListener('click', () => selectLinkContentItem(row));
                        tbody.appendChild(row);
                    });
                    filterLinkContent();
                    applySelectionToView();
                }

                document.querySelectorAll('.link-content-view-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        linkContentCurrentView = btn.dataset.view;
                        document.querySelectorAll('.link-content-view-btn').forEach(b => {
                            b.classList.remove('bg-red-600');
                            b.classList.add('bg-gray-700');
                            if (b.dataset.view === linkContentCurrentView) {
                                b.classList.remove('bg-gray-700');
                                b.classList.add('bg-red-600');
                            }
                        });
                        const isGrid = linkContentCurrentView === 'grid';
                        const grid = document.getElementById('link-content-grid');
                        const list = document.getElementById('link-content-list');
                        if (grid) grid.classList.toggle('hidden', !isGrid);
                        if (list) list.classList.toggle('hidden', isGrid);
                        if (!isGrid) populateListViews();
                        else applySelectionToView();
                    });
                });

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

                function buildNavDropdown() {
                    populateSingleNavDropdown(navDropdown);
                    const linkedDropdown = document.getElementById('linked-existing-nav-dropdown');
                    populateSingleNavDropdown(linkedDropdown);
                }

                function selectLinkContentItem(el) {
                    linkContentSelectedItem = {
                        type: el.dataset.type,
                        id: el.dataset.id,
                        name: el.dataset.name,
                        sections: el.dataset.sections ? parseInt(el.dataset.sections, 10) : 0,
                        pages: el.dataset.pages ? parseInt(el.dataset.pages, 10) : 0
                    };
                    linkContentSubItems = buildSubItemsForContent();
                    linkContentCurrentIndex = 1;
                    linkContentSelectedSub = linkContentSubItems[0] ? { index: linkContentSubItems[0].index, label: linkContentSubItems[0].label } : null;
                    if (confirmBtn) confirmBtn.disabled = !linkContentSelectedSub;
                    showLinkContentStep(2);
                    if (step2Title) step2Title.textContent = linkContentSelectedItem.name;
                    if (step2Type) step2Type.textContent = linkContentSelectedItem.type === 'story' ? 'Story' : 'Dashboard';
                    if (step2Count) {
                        const n = linkContentSelectedItem.type === 'story' ? (linkContentSelectedItem.sections || 0) : (linkContentSelectedItem.pages || 0);
                        step2Count.textContent = linkContentSelectedItem.type === 'story' ? (n + ' Section' + (n !== 1 ? 's' : '')) : (n + ' Page' + (n !== 1 ? 's' : ''));
                    }
                    updateLinkContentNavDisplay();
                    buildNavDropdown();
                    applySelectionToView();
                }

                if (backBtn) {
                    backBtn.addEventListener('click', () => {
                        showLinkContentStep(1);
                        linkContentSelectedSub = null;
                        if (confirmBtn) confirmBtn.disabled = true;
                        updateLinkContentFooter();
                    });
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
                if (navDropdownBtn && navDropdown) {
                    navDropdownBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        navDropdown.classList.toggle('hidden');
                    });
                    document.addEventListener('click', () => {
                        navDropdown.classList.add('hidden');
                        const linkedDropdown = document.getElementById('linked-existing-nav-dropdown');
                        if (linkedDropdown) linkedDropdown.classList.add('hidden');
                        const linkedHeaderMenu = document.getElementById('linked-existing-header-menu');
                        if (linkedHeaderMenu) linkedHeaderMenu.classList.add('hidden');
                    });
                    navDropdown.addEventListener('click', (e) => e.stopPropagation());
                }

                function updateLinkContentFooter() {
                    if (!footerSelection) return;
                    if (!linkContentSelectedItem) {
                        footerSelection.textContent = 'No content selected';
                        return;
                    }
                    const sub = linkContentSelectedSub ? linkContentSelectedSub.label : (linkContentSelectedItem.type === 'story' ? '—' : '—');
                    footerSelection.textContent = linkContentSelectedItem.type === 'story'
                        ? 'Selection: ' + linkContentSelectedItem.name + ' → ' + sub
                        : 'Selection: ' + linkContentSelectedItem.name + ' → ' + sub;
                }

                document.querySelectorAll('.link-content-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        if (e.target.closest('button')) return;
                        selectLinkContentItem(card);
                    });
                });

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
