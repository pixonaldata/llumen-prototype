(function (windowScope) {
    'use strict';

    const DEFAULT_NAV_ITEMS = [
        { id: 'all', label: 'All', href: 'index.html' },
        { id: 'private', label: 'Private', href: 'workspaces/private.html' },
        { id: 'shared-with-me', label: 'Shared with Me', href: 'workspaces/shared.html' },
        { id: 'finance', label: 'Finance', href: 'workspaces/finance.html' },
        { id: 'operations', label: 'Operations', href: 'workspaces/finance.html' },
        { id: 'hr', label: 'HR', href: 'workspaces/finance.html' },
        { id: 'sales', label: 'Sales', href: 'workspaces/finance.html' },
        { id: 'marketing', label: 'Marketing', href: 'workspaces/finance.html' },
        { id: 'it', label: 'IT', href: 'workspaces/finance.html' },
        { id: 'product', label: 'Product', href: 'workspaces/finance.html' },
        { id: 'engineering', label: 'Engineering', href: 'workspaces/finance.html' },
        { id: 'customer-success', label: 'Customer Success', href: 'workspaces/finance.html' }
    ];

    const DEFAULT_OPTIONS = {
        selectedId: 'auto',
        selectedHref: '',
        separatorsAfter: ['shared-with-me'],
        items: DEFAULT_NAV_ITEMS,
        ariaLabel: 'Main app navigation',
        hideWithScroll: true,
        hiddenClass: 'll-hidden',
        offsetSelector: '.ll-app-header',
        cssVarName: '--header-height'
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

    function normalizeHrefForMatch(hrefValue) {
        return String(hrefValue || '')
            .trim()
            .replace(/^[./]+/, '')
            .toLowerCase();
    }

    function normalizeItems(items) {
        const sourceItems = Array.isArray(items) && items.length ? items : DEFAULT_NAV_ITEMS;
        return sourceItems
            .map((item, index) => {
                const label = String(item && item.label != null ? item.label : '').trim();
                if (!label) return null;
                const fallbackId = `nav-item-${index + 1}`;
                const id = String(item && item.id != null ? item.id : fallbackId).trim() || fallbackId;
                const href = withRootPrefix(String(item && item.href != null ? item.href : '').trim());
                return { id, label, href };
            })
            .filter(Boolean);
    }

    function resolveSelectedId(items, selectedId, selectedHref) {
        if (!Array.isArray(items) || !items.length) return null;

        const explicitId = String(selectedId || '').trim();
        if (explicitId && explicitId.toLowerCase() !== 'auto') {
            const match = items.find((item) => item.id === explicitId);
            if (match) return match.id;
        }

        const explicitHref = normalizeHrefForMatch(selectedHref);
        if (explicitHref) {
            const hrefMatch = items.find((item) => normalizeHrefForMatch(item.href).endsWith(explicitHref));
            if (hrefMatch) return hrefMatch.id;
        }

        const pathname = normalizeHrefForMatch(windowScope.location && windowScope.location.pathname || '');
        const pathMatch = items.find((item) => {
            const itemHref = normalizeHrefForMatch(item.href);
            return itemHref && pathname.endsWith(itemHref);
        });
        return pathMatch ? pathMatch.id : items[0].id;
    }

    function parseSeparatorIds(value) {
        return String(value || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    function renderLlumenAppNav(targetOrId, options = {}) {
        const target = typeof targetOrId === 'string'
            ? document.getElementById(targetOrId)
            : targetOrId;
        if (!target) return null;

        const selectedId = options.selectedId != null ? options.selectedId : target.dataset.selectedNavId;
        const selectedHref = options.selectedHref != null ? options.selectedHref : target.dataset.selectedNavHref;
        const parsedSeparatorsFromDataset = parseSeparatorIds(target.dataset.navSeparatorsAfter);
        const separatorsAfter = options.separatorsAfter != null
            ? options.separatorsAfter
            : (parsedSeparatorsFromDataset.length ? parsedSeparatorsFromDataset : null);
        const hideWithScroll = options.hideWithScroll != null
            ? options.hideWithScroll
            : target.dataset.hideWithScroll !== 'false';
        const hiddenClass = options.hiddenClass != null ? options.hiddenClass : target.dataset.hiddenClass;
        const ariaLabel = options.ariaLabel != null ? options.ariaLabel : target.dataset.ariaLabel;
        const offsetSelector = options.offsetSelector != null ? options.offsetSelector : target.dataset.offsetSelector;
        const cssVarName = options.cssVarName != null ? options.cssVarName : target.dataset.cssVarName;

        const resolvedOptions = {
            ...DEFAULT_OPTIONS,
            ...options,
            selectedId,
            selectedHref,
            separatorsAfter,
            hideWithScroll,
            hiddenClass,
            ariaLabel,
            offsetSelector,
            cssVarName
        };

        const navItems = normalizeItems(resolvedOptions.items);
        const activeId = resolveSelectedId(navItems, resolvedOptions.selectedId, resolvedOptions.selectedHref);

        if (target.tagName && target.tagName.toLowerCase() === 'nav') {
            target.classList.add('ll-header', 'll-app-header-secondary', 'll-header--hide-with-scroll');
        }

        target.innerHTML = `<div data-ll-app-nav-carousel-root class="ll-carousel" aria-label="${String(resolvedOptions.ariaLabel || DEFAULT_OPTIONS.ariaLabel)}"></div>`;
        const root = target.querySelector('[data-ll-app-nav-carousel-root]');
        const components = windowScope.LlumenComponents;
        if (root && components && typeof components.initializeHorizontalCarousel === 'function') {
            components.initializeHorizontalCarousel({
                root,
                mode: 'tabs',
                items: navItems,
                getItemId: (item) => String(item && item.id != null ? item.id : ''),
                tabLabelKey: 'label',
                tabHrefKey: 'href',
                tabsAsLinks: true,
                tabSeparatorsAfter: Array.isArray(resolvedOptions.separatorsAfter)
                    ? resolvedOptions.separatorsAfter
                    : DEFAULT_OPTIONS.separatorsAfter,
                initialActiveId: activeId
            });
        }

        if (target.__llAppNavHideWithScrollController && typeof target.__llAppNavHideWithScrollController.destroy === 'function') {
            target.__llAppNavHideWithScrollController.destroy();
            target.__llAppNavHideWithScrollController = null;
        }
        if (resolvedOptions.hideWithScroll && components && typeof components.initializeHideWithScroll === 'function') {
            const offsetElement = document.querySelector(String(resolvedOptions.offsetSelector || DEFAULT_OPTIONS.offsetSelector))
                || document.querySelector('header');
            target.__llAppNavHideWithScrollController = components.initializeHideWithScroll({
                targetElement: target,
                offsetElement,
                cssVarName: String(resolvedOptions.cssVarName || DEFAULT_OPTIONS.cssVarName),
                cssVarHost: document.documentElement,
                hiddenClass: String(resolvedOptions.hiddenClass || DEFAULT_OPTIONS.hiddenClass)
            });
        }

        return target;
    }

    function autoRenderLlumenAppNav() {
        const hosts = Array.from(document.querySelectorAll('[data-ll-app-nav-host]'));
        hosts.forEach((host) => {
            if (host.dataset.llAppNavMounted === 'true') return;
            renderLlumenAppNav(host);
            host.dataset.llAppNavMounted = 'true';
        });
    }

    windowScope.renderLlumenAppNav = renderLlumenAppNav;
    windowScope.autoRenderLlumenAppNav = autoRenderLlumenAppNav;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoRenderLlumenAppNav, { once: true });
    } else {
        autoRenderLlumenAppNav();
    }
})(window);
