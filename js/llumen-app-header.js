(function (windowScope) {
    'use strict';

    const DEFAULT_OPTIONS = {
        logoText: 'Client Logo',
        userInitial: 'J'
    };

    function getPathParts() {
        return String(windowScope.location && windowScope.location.pathname || '')
            .split('/')
            .filter(Boolean);
    }

    function isInSubdirectory() {
        const pathParts = getPathParts();
        return pathParts.some((part) =>
            part === 'workspaces' || part === 'platform-settings' || part === 'dashboard'
        );
    }

    function withRootPrefix(path) {
        const normalized = String(path || '').trim();
        if (!normalized) return '';
        if (/^(https?:)?\/\//.test(normalized)) return normalized;
        if (normalized.startsWith('/')) return normalized;
        const prefix = isInSubdirectory() ? '../' : '';
        return `${prefix}${normalized}`;
    }

    function getCreateDropdownMarkup() {
        return `
            <button type="button" class="ll-dropdown__item" data-value="Briefing" data-create-content-type="Briefing">Briefing</button>
            <button type="button" class="ll-dropdown__item" data-value="Story" data-create-content-type="Story">Story</button>
            <button type="button" class="ll-dropdown__item" data-value="Dashboard" data-create-content-type="Dashboard">Dashboard</button>
            <button type="button" class="ll-dropdown__item" data-value="Whiteboard" data-create-content-type="Whiteboard">Whiteboard</button>
            <button type="button" class="ll-dropdown__item" data-value="Workspace" data-ui-action="create-workspace">Workspace</button>
        `;
    }

    function getUserDropdownMarkup() {
        return `
            <button type="button" class="ll-dropdown__item" data-value="account-settings" data-ui-action="account-settings">Account Settings</button>
            <a href="${withRootPrefix('platform-settings/overview.html')}" class="ll-dropdown__item">Platform Settings</a>
            <a href="${withRootPrefix('component-library.html')}" class="ll-dropdown__item">Component Library</a>
            <button type="button" class="ll-dropdown__item" data-value="help" data-ui-action="help">Help</button>
            <button type="button" class="ll-dropdown__item" data-value="logout" data-ui-action="logout">Logout</button>
        `;
    }

    function getHeaderInnerMarkup(options) {
        const logoHref = withRootPrefix('index.html');
        const userInitial = String(options.userInitial || 'J').trim() || 'J';
        const logoText = String(options.logoText || 'Client Logo').trim() || 'Client Logo';
        return `
            <div class="flex items-center">
                <a href="${logoHref}">
                    <div class="w-[2.375rem] h-[2.375rem]">
                        <svg viewBox="0 0 32 32" class="w-full h-full">
                            <circle cx="16" cy="16" r="16" fill="#dc2626"></circle>
                            <circle cx="16" cy="16" r="8" fill="#ffffff"></circle>
                        </svg>
                    </div>
                </a>
                <div class="h-[2.375rem] border-l ll-border-divider ml-4"></div>
                <a href="${logoHref}">
                    <div class="flex items-center justify-center px-3 py-1 rounded-lg bg-gray-950 text-white text-sm font-semibold h-[2.375rem] ml-4">
                        <span>${logoText}</span>
                    </div>
                </a>
                <div class="w-[20rem] ml-4">
                    <div class="ll-input-with-left-icon ll-listing-module-search-input">
                        <div class="ll-input-with-left-icon__left ll-input-with-left-icon__icon">
                            <span class="material-symbols-outlined">search</span>
                        </div>
                        <input id="app-header-search-input" type="text" placeholder="Search..." class="ll-input ll-input--search ll-input-with-left-icon__input">
                    </div>
                </div>
            </div>
            <div class="flex items-center">
                <div class="relative mr-4">
                    <button id="create-dropdown-button" type="button" class="ll-btn ll-btn--outline-default ll-dropdown__trigger">
                        <span class="material-symbols-outlined ll-btn__icon">add</span>
                        <span>Create</span>
                    </button>
                    <div id="create-dropdown-menu" class="ll-dropdown__menu hidden">
                        ${getCreateDropdownMarkup()}
                    </div>
                </div>
                <button type="button" class="ll-icon-btn ll-icon-btn--circle ll-icon-btn--outline ll-icon-btn--lg mr-4" aria-label="Notifications">
                    <span class="material-symbols-outlined ll-icon-btn__icon">notifications</span>
                </button>
                <div class="relative">
                    <button id="user-dropdown-button" type="button" class="ll-icon-btn ll-icon-btn--circle ll-icon-btn--outline ll-icon-btn--lg ll-dropdown__trigger" aria-label="User menu">
                        <span class="text-lg font-medium">${userInitial}</span>
                    </button>
                    <div id="user-dropdown-menu" class="ll-dropdown__menu hidden">
                        ${getUserDropdownMarkup()}
                    </div>
                </div>
            </div>
        `;
    }

    function initializeHeaderInteractions() {
        const components = windowScope.LlumenComponents;
        if (!components) return;

        if (typeof components.initializeSearchInput === 'function') {
            const searchInput = document.getElementById('app-header-search-input');
            if (searchInput) {
                components.initializeSearchInput('app-header-search-input', {
                    clearButtonId: 'app-header-search-clear',
                    datasetFlag: 'appHeaderSearchInputBound'
                });
            }
        }

        if (typeof components.initializePortaledDropdown === 'function') {
            const createButton = document.getElementById('create-dropdown-button');
            const createMenu = document.getElementById('create-dropdown-menu');
            if (createButton && createMenu) {
                components.initializePortaledDropdown({
                    buttonId: 'create-dropdown-button',
                    menuId: 'create-dropdown-menu',
                    align: 'right',
                    menuType: 'action',
                    showLabel: false,
                    dropdownLabel: 'Create',
                    onValueChange: (payload) => {
                        const selectedValue = String((payload && payload.value) || '').trim();
                        if (!selectedValue) return;
                        if (selectedValue === 'Workspace') return;
                        if (typeof windowScope.openCreateContentModal === 'function') {
                            windowScope.openCreateContentModal(selectedValue);
                        }
                    }
                });
            }

            const userButton = document.getElementById('user-dropdown-button');
            const userMenu = document.getElementById('user-dropdown-menu');
            if (userButton && userMenu) {
                components.initializePortaledDropdown({
                    buttonId: 'user-dropdown-button',
                    menuId: 'user-dropdown-menu',
                    align: 'right',
                    menuType: 'action',
                    showLabel: false,
                    dropdownLabel: 'User menu'
                });
            }
        }
    }

    function renderLlumenAppHeader(targetOrId, options = {}) {
        const target = typeof targetOrId === 'string'
            ? document.getElementById(targetOrId)
            : targetOrId;
        if (!target) return null;
        const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
        if (target.tagName && target.tagName.toLowerCase() === 'header') {
            target.classList.add('ll-header', 'll-app-header');
        }
        target.innerHTML = getHeaderInnerMarkup(resolvedOptions);
        initializeHeaderInteractions();
        return target.tagName && target.tagName.toLowerCase() === 'header'
            ? target
            : target.querySelector('header');
    }

    function autoRenderLlumenAppHeader() {
        const hosts = Array.from(document.querySelectorAll('[data-ll-app-header-host]'));
        hosts.forEach((host) => {
            if (host.dataset.llAppHeaderMounted === 'true') return;
            renderLlumenAppHeader(host, {
                logoText: host.dataset.logoText || DEFAULT_OPTIONS.logoText,
                userInitial: host.dataset.userInitial || DEFAULT_OPTIONS.userInitial
            });
            host.dataset.llAppHeaderMounted = 'true';
        });
    }

    windowScope.renderLlumenAppHeader = renderLlumenAppHeader;
    windowScope.autoRenderLlumenAppHeader = autoRenderLlumenAppHeader;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoRenderLlumenAppHeader, { once: true });
    } else {
        autoRenderLlumenAppHeader();
    }
})(window);
