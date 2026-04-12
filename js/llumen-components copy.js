(function registerLlumenComponents(globalScope) {
    if (!globalScope) return;

    function initializeNumberInput(inputId, options = {}) {
        const input = document.getElementById(inputId);
        if (!input || input.dataset.numberInputBound === 'true') return;

        const {
            min = null,
            max = null,
            step = '1',
            defaultValue = '',
            hint = null,
            hintElementId = null,
            autoHint = true
        } = options;
        const parseFiniteNumber = (rawValue) => {
            if (rawValue === null || rawValue === undefined) return null;
            const normalizedValue = String(rawValue).trim();
            if (normalizedValue === '') return null;
            const parsedValue = Number(normalizedValue);
            return Number.isFinite(parsedValue) ? parsedValue : null;
        };
        const optionMinProvided = min !== null && min !== undefined && String(min).trim() !== '';
        const optionMaxProvided = max !== null && max !== undefined && String(max).trim() !== '';
        const resolvedMin = optionMinProvided
            ? parseFiniteNumber(min)
            : parseFiniteNumber(input.getAttribute('min'));
        const resolvedMax = optionMaxProvided
            ? parseFiniteNumber(max)
            : parseFiniteNumber(input.getAttribute('max'));

        input.type = 'number';
        if (resolvedMin !== null) input.min = String(resolvedMin);
        if (resolvedMax !== null) input.max = String(resolvedMax);
        if (step !== null && step !== undefined) input.step = String(step);
        if (defaultValue !== null && defaultValue !== undefined && String(defaultValue) !== '' && input.value === '') {
            input.value = String(defaultValue);
        }

        const clampToBoundaries = (rawValue) => {
            const parsedValue = parseFiniteNumber(rawValue);
            if (parsedValue === null) return null;
            let clampedValue = parsedValue;
            if (resolvedMin !== null) clampedValue = Math.max(resolvedMin, clampedValue);
            if (resolvedMax !== null) clampedValue = Math.min(resolvedMax, clampedValue);
            return clampedValue;
        };

        const normalizeOnBlur = () => {
            if (resolvedMin === null && resolvedMax === null) return;
            const rawValue = String(input.value || '').trim();
            if (rawValue === '') {
                if (resolvedMin !== null) {
                    input.value = String(resolvedMin);
                } else if (resolvedMax !== null) {
                    input.value = String(resolvedMax);
                }
                return;
            }
            const clampedValue = clampToBoundaries(rawValue);
            if (clampedValue === null) {
                if (resolvedMin !== null) {
                    input.value = String(resolvedMin);
                } else if (resolvedMax !== null) {
                    input.value = String(resolvedMax);
                }
                return;
            }
            input.value = String(clampedValue);
        };

        const resolveHintElement = () => {
            if (hintElementId) {
                const explicitHintElement = document.getElementById(hintElementId);
                if (explicitHintElement) return explicitHintElement;
            }
            const fieldContainer = input.closest('.ll-field');
            if (fieldContainer) {
                const existingHint = fieldContainer.querySelector('.ll-form-control__hint');
                if (existingHint) return existingHint;
            }
            return null;
        };

        const hasExplicitHint = hint !== null && hint !== undefined;
        const normalizedHintText = hasExplicitHint ? String(hint).trim() : '';
        let computedHintText = normalizedHintText;
        if (!hasExplicitHint && autoHint && (resolvedMin !== null || resolvedMax !== null)) {
            if (resolvedMin !== null && resolvedMax !== null) {
                computedHintText = `Allowed range is ${resolvedMin} to ${resolvedMax}`;
            } else if (resolvedMin !== null) {
                computedHintText = `Allowed minimum is ${resolvedMin}`;
            } else if (resolvedMax !== null) {
                computedHintText = `Allowed maximum is ${resolvedMax}`;
            }
        }
        if (computedHintText) {
            let hintElement = resolveHintElement();
            if (!hintElement) {
                hintElement = document.createElement('div');
                hintElement.className = 'll-form-control__hint';
                input.insertAdjacentElement('afterend', hintElement);
            }
            hintElement.textContent = computedHintText;
        }

        input.addEventListener('blur', normalizeOnBlur);
        normalizeOnBlur();
        input.dataset.numberInputBound = 'true';
    }

    function initializeSearchInput(inputId, clearButtonOrOptions = null, maybeOptions = {}) {
        const options = typeof clearButtonOrOptions === 'string'
            ? { ...maybeOptions, clearButtonId: clearButtonOrOptions }
            : (clearButtonOrOptions && typeof clearButtonOrOptions === 'object' ? clearButtonOrOptions : {});
        const input = document.getElementById(inputId);
        if (!input) return;

        const {
            clearButtonId = null,
            datasetFlag = 'searchInputBound',
            onInput = null,
            onClear = null
        } = options;
        const clearButton = clearButtonId ? document.getElementById(clearButtonId) : null;
        if (input.dataset[datasetFlag] === 'true') return;

        const updateClearVisibility = () => {
            if (!clearButton) return;
            const hasValue = input.value.trim().length > 0;
            clearButton.classList.toggle('hidden', !hasValue);
        };

        input.addEventListener('input', () => {
            updateClearVisibility();
            if (typeof onInput === 'function') {
                onInput(input.value, input);
            }
        });

        if (clearButton) {
            clearButton.addEventListener('click', () => {
                input.value = '';
                updateClearVisibility();
                if (typeof onInput === 'function') {
                    onInput(input.value, input);
                }
                if (typeof onClear === 'function') {
                    onClear(input);
                }
                input.focus();
            });
        }

        updateClearVisibility();
        input.__syncSearchClearVisibility = updateClearVisibility;
        input.dataset[datasetFlag] = 'true';
    }

    function initializeTextCounter(inputId, counterId, options = {}) {
        const input = document.getElementById(inputId);
        const counter = document.getElementById(counterId);
        if (!input || !counter) return;

        const { datasetFlag = 'textCounterBound', maxLength = null } = options || {};
        if (input.dataset[datasetFlag] === 'true') return;

        const hasExplicitMaxLength = maxLength !== null
            && maxLength !== undefined
            && String(maxLength).trim() !== ''
            && Number.isFinite(Number(maxLength));
        const configuredMaxLength = hasExplicitMaxLength
            ? Number(maxLength)
            : Number.parseInt(input.getAttribute('maxlength') || '', 10);
        const normalizedMaxLength = Number.isFinite(configuredMaxLength) && configuredMaxLength > 0
            ? configuredMaxLength
            : null;

        const updateCounter = () => {
            const currentLength = String(input.value || '').length;
            counter.textContent = normalizedMaxLength === null
                ? String(currentLength)
                : `${currentLength}/${normalizedMaxLength}`;
        };

        input.addEventListener('input', updateCounter);
        updateCounter();
        input.dataset[datasetFlag] = 'true';
    }

    function closeAllPortaledDropdowns() {
        const dropdownRegistry = globalScope.__llumenPortaledDropdownRegistry;
        if (!dropdownRegistry || typeof dropdownRegistry.forEach !== 'function') return;
        dropdownRegistry.forEach((entry) => {
            if (!entry || typeof entry.close !== 'function') return;
            entry.close();
        });
    }

    function initializeToggleableFlatpickrOnInput(input, config = {}) {
        if (!input || typeof globalScope.flatpickr !== 'function') return null;
        const {
            timeOnlyClassName = 'flatpickr-time-only',
            ...flatpickrConfig
        } = config || {};
        const isInline = Boolean(flatpickrConfig && flatpickrConfig.inline);
        const pickerConfig = isInline
            ? { ...flatpickrConfig }
            : { ...flatpickrConfig, clickOpens: false };
        if (pickerConfig.enableTime) {
            if (!Number.isFinite(Number(pickerConfig.defaultHour))) {
                pickerConfig.defaultHour = 0;
            }
            if (!Number.isFinite(Number(pickerConfig.defaultMinute))) {
                pickerConfig.defaultMinute = 0;
            }
        }
        const pickerInstance = globalScope.flatpickr(input, pickerConfig);
        const isTimeOnlyPicker = Boolean(pickerConfig.enableTime && pickerConfig.noCalendar);
        if (
            isTimeOnlyPicker &&
            typeof timeOnlyClassName === 'string' &&
            timeOnlyClassName.trim() &&
            pickerInstance &&
            pickerInstance.calendarContainer
        ) {
            pickerInstance.calendarContainer.classList.add(timeOnlyClassName.trim());
        }
        if (!pickerInstance || isInline) return pickerInstance;
        if (pickerInstance.calendarContainer) {
            pickerInstance.calendarContainer.classList.add('ll-flatpickr-offset-enabled');
        }
        let suppressOpenUntil = 0;
        const originalOpen = pickerInstance.open.bind(pickerInstance);
        pickerInstance.open = (...args) => {
            if (Date.now() < suppressOpenUntil) return;
            return originalOpen(...args);
        };
        const togglePickerVisibility = (event) => {
            if (event.button !== undefined && event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            if (pickerInstance.isOpen) {
                suppressOpenUntil = Date.now() + 260;
                pickerInstance.close();
                return;
            }
            closeAllPortaledDropdowns();
            pickerInstance.open();
        };
        if (input.dataset.flatpickrToggleBound !== 'true') {
            input.addEventListener('click', togglePickerVisibility, true);
            input.dataset.flatpickrToggleBound = 'true';
        }
        return pickerInstance;
    }

    function initializeDatetimeInput(inputId, options = {}) {
        const input = document.getElementById(inputId);
        if (!input || input.dataset.datetimeInputBound === 'true') return;
        if (typeof globalScope.flatpickr !== 'function') return;
        input.readOnly = true;
        const datetimeField = input.closest('.ll-input-with-left-icon, .ll-datetime-field, .custom-field-with-left-element--datetime');
        if (datetimeField) {
            const iconElement = datetimeField.querySelector('.ll-input-with-left-icon__icon, .ll-datetime-field__icon, .calendar-icon, .ll-expression-field__fx-icon, .expression-editor-fx-icon');
            if (iconElement && iconElement.tagName !== 'DIV') {
                const iconText = String(iconElement.textContent || '').trim() || 'calendar_month';
                const wrapper = document.createElement('div');
                wrapper.className = datetimeField.classList.contains('ll-input-with-left-icon') || datetimeField.classList.contains('ll-datetime-field')
                    ? 'll-input-with-left-icon__left ll-input-with-left-icon__icon'
                    : 'left-element calendar-icon';
                const iconSpan = document.createElement('span');
                iconSpan.className = 'material-symbols-outlined';
                iconSpan.textContent = iconText;
                wrapper.appendChild(iconSpan);
                iconElement.replaceWith(wrapper);
            } else if (iconElement && !iconElement.querySelector('.material-symbols-outlined')) {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'material-symbols-outlined';
                iconSpan.textContent = 'calendar_month';
                iconElement.appendChild(iconSpan);
            }
        }

        const config = {
            enableTime: true,
            time_24hr: false,
            dateFormat: 'F j, Y \\a\\t h:i K',
            allowInput: true,
            ...options
        };
        initializeToggleableFlatpickrOnInput(input, config);
        input.dataset.datetimeInputBound = 'true';
    }

    globalScope.initializeNumberInput = initializeNumberInput;
    globalScope.initializeSearchInput = initializeSearchInput;
    globalScope.initializeTextCounter = initializeTextCounter;
    globalScope.closeAllPortaledDropdowns = closeAllPortaledDropdowns;
    globalScope.initializeToggleableFlatpickrOnInput = initializeToggleableFlatpickrOnInput;
    globalScope.initializeDatetimeInput = initializeDatetimeInput;
})(window);

(function initLlumenComponentsCore(windowScope) {
    if (!windowScope || !windowScope.document) return;

    const OPERATORS_DROPDOWN_DEFINITION = {
        groups: [
            {
                name: 'String',
                icon: 'title',
                defaultOperator: 'is equal to',
                operators: [
                    { name: 'exists', hasRightExpression: false, rightFixedType: '' },
                    { name: 'does not exist', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is empty', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is not empty', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is equal to', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'is equal to (case insensitive)', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'is not equal to', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'is not equal to (case insensitive)', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'contains', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'contains (case insensitive)', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'does not contain', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'does not contain (case insensitive)', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'starts with', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'starts with (case insensitive)', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'does not start with', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'does not start with (case insensitive)', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'ends with', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'ends with (case insensitive)', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'does not end with', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'does not end with (case insensitive)', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'matches regex', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'matches regex (case insensitive)', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'does not match regex', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'does not match regex (case insensitive)', hasRightExpression: true, rightFixedType: 'string' }
                ]
            },
            {
                name: 'Number',
                icon: 'numbers',
                defaultOperator: 'is equal to',
                operators: [
                    { name: 'exists', hasRightExpression: false, rightFixedType: '' },
                    { name: 'does not exist', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is empty', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is not empty', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is equal to', hasRightExpression: true, rightFixedType: 'number' },
                    { name: 'is not equal to', hasRightExpression: true, rightFixedType: 'number' },
                    { name: 'is greater than', hasRightExpression: true, rightFixedType: 'number' },
                    { name: 'is less than', hasRightExpression: true, rightFixedType: 'number' },
                    { name: 'is greater than or equal to', hasRightExpression: true, rightFixedType: 'number' },
                    { name: 'is less than or equal to', hasRightExpression: true, rightFixedType: 'number' }
                ]
            },
            {
                name: 'Date & Time',
                icon: 'calendar_month',
                defaultOperator: 'is equal to',
                operators: [
                    { name: 'exists', hasRightExpression: false, rightFixedType: '' },
                    { name: 'does not exist', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is empty', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is not empty', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is equal to', hasRightExpression: true, rightFixedType: 'datetime' },
                    { name: 'is not equal to', hasRightExpression: true, rightFixedType: 'datetime' },
                    { name: 'is after', hasRightExpression: true, rightFixedType: 'datetime' },
                    { name: 'is before', hasRightExpression: true, rightFixedType: 'datetime' },
                    { name: 'is after or equal to', hasRightExpression: true, rightFixedType: 'datetime' },
                    { name: 'is before or equal to', hasRightExpression: true, rightFixedType: 'datetime' }
                ]
            },
            {
                name: 'Boolean',
                icon: 'check_box',
                defaultOperator: 'is true',
                operators: [
                    { name: 'exists', hasRightExpression: false, rightFixedType: '' },
                    { name: 'does not exist', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is empty', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is not empty', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is true', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is false', hasRightExpression: false, rightFixedType: '' }
                ]
            },
            {
                name: 'Array',
                icon: 'data_array',
                defaultOperator: 'contains',
                operators: [
                    { name: 'exists', hasRightExpression: false, rightFixedType: '' },
                    { name: 'does not exist', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is empty', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is not empty', hasRightExpression: false, rightFixedType: '' },
                    { name: 'contains', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'does not contain', hasRightExpression: true, rightFixedType: 'string' },
                    { name: 'length equal to', hasRightExpression: true, rightFixedType: 'number' },
                    { name: 'length not equal to', hasRightExpression: true, rightFixedType: 'number' },
                    { name: 'length greater than', hasRightExpression: true, rightFixedType: 'number' },
                    { name: 'length less than', hasRightExpression: true, rightFixedType: 'number' },
                    { name: 'length greater than or equal to', hasRightExpression: true, rightFixedType: 'number' },
                    { name: 'length less than or equal to', hasRightExpression: true, rightFixedType: 'number' }
                ]
            },
            {
                name: 'Object',
                icon: 'data_object',
                defaultOperator: 'exists',
                operators: [
                    { name: 'exists', hasRightExpression: false, rightFixedType: '' },
                    { name: 'does not exist', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is empty', hasRightExpression: false, rightFixedType: '' },
                    { name: 'is not empty', hasRightExpression: false, rightFixedType: '' }
                ]
            }
        ]
    };
    let activeCustomTooltip = null;

        function initializeTabs({
            tabButtonSelector,
            tabContentSelector,
            tabValueDatasetKey,
            tabContentIdPrefix = '',
            tabContentIdSuffix = '',
            activeClassName = 'active',
            initialTab = '',
            onTabChange = null
        }) {
            if (!tabButtonSelector || !tabValueDatasetKey) return null;
            const tabButtons = Array.from(document.querySelectorAll(tabButtonSelector));
            const hasTabContentSelector = typeof tabContentSelector === 'string'
                && tabContentSelector.trim() !== '';
            const tabContents = hasTabContentSelector
                ? Array.from(document.querySelectorAll(tabContentSelector))
                : [];
            if (!tabButtons.length) return null;

            const switchTab = (tabName) => {
                const resolvedTabName = String(tabName || '').trim();
                if (!resolvedTabName) return;
                if (tabContents.length) {
                    tabContents.forEach((content) => {
                        content.classList.add('hidden');
                    });
                }
                tabButtons.forEach((button) => {
                    button.classList.remove(activeClassName);
                });

                let selectedTabContent = null;
                if (hasTabContentSelector) {
                    selectedTabContent = document.getElementById(`${tabContentIdPrefix}${resolvedTabName}${tabContentIdSuffix}`);
                    if (selectedTabContent) {
                        selectedTabContent.classList.remove('hidden');
                    }
                }
                const selectedTabButton = tabButtons.find((button) => {
                    return String(button.dataset[tabValueDatasetKey] || '') === resolvedTabName;
                }) || null;
                if (selectedTabButton) {
                    selectedTabButton.classList.add(activeClassName);
                }
                if (typeof onTabChange === 'function') {
                    onTabChange(resolvedTabName, {
                        selectedTabButton,
                        selectedTabContent
                    });
                }
            };

            tabButtons.forEach((button) => {
                if (button.dataset.reusableTabsBound === 'true') return;
                button.addEventListener('click', () => {
                    switchTab(button.dataset[tabValueDatasetKey]);
                });
                button.dataset.reusableTabsBound = 'true';
            });

            const fallbackInitialTab = tabButtons.length
                ? String(tabButtons[0].dataset[tabValueDatasetKey] || '')
                : '';
            switchTab(initialTab || fallbackInitialTab);
            return {
                switchTab
            };
        }

        function escapeHtml(rawValue) {
            const normalizedValue = rawValue === null || rawValue === undefined
                ? ''
                : String(rawValue);
            return normalizedValue
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function escapeHtmlPreserveLineBreaks(rawValue) {
            return escapeHtml(rawValue).replace(/\r\n|\r|\n/g, '<br>');
        }

        function getContenteditableSelectionOffsets(element) {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return null;
            const range = selection.getRangeAt(0);
            if (!element.contains(range.startContainer) || !element.contains(range.endContainer)) return null;

            const startRange = range.cloneRange();
            startRange.selectNodeContents(element);
            startRange.setEnd(range.startContainer, range.startOffset);

            const endRange = range.cloneRange();
            endRange.selectNodeContents(element);
            endRange.setEnd(range.endContainer, range.endOffset);

            return {
                start: startRange.toString().length,
                end: endRange.toString().length
            };
        }

        function setContenteditableCaretOffset(element, offset) {
            const selection = window.getSelection();
            if (!selection) return;

            const range = document.createRange();
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            let remaining = Math.max(0, offset);
            let foundNode = null;
            let foundOffset = 0;

            while (walker.nextNode()) {
                const currentNode = walker.currentNode;
                const nodeLength = currentNode.textContent.length;
                if (remaining <= nodeLength) {
                    foundNode = currentNode;
                    foundOffset = remaining;
                    break;
                }
                remaining -= nodeLength;
            }

            if (foundNode) {
                range.setStart(foundNode, foundOffset);
                range.collapse(true);
            } else {
                range.selectNodeContents(element);
                range.collapse(false);
            }

            selection.removeAllRanges();
            selection.addRange(range);
        }

        function normalizeDroppedExpressionJsonPath(rawPath) {
            let value = String(rawPath || '').trim();
            if (!value) return null;
            if (value.startsWith('{{') && value.endsWith('}}')) {
                value = value.slice(2, -2).trim();
            }
            const customRootMatch = value.match(/^\$\('((?:\\'|[^'])+)'\)([\s\S]*)$/);
            if (customRootMatch) {
                const rootLabel = String(customRootMatch[1] || '').replace(/'/g, "\\'");
                let tail = String(customRootMatch[2] || '')
                    .replace(/\s*\.\s*/g, '.')
                    .replace(/\[\s*(\d+)\s*\]/g, '[$1]')
                    .replace(/\s+/g, '')
                    .trim();
                if (tail && !/^(?:\.[A-Za-z_$][\w$]*|\[\d+\])+$/.test(tail)) {
                    return null;
                }
                return `$('${rootLabel}')${tail}`;
            }
            value = value
                .replace(/\s*\.\s*/g, '.')
                .replace(/\[\s*(\d+)\s*\]/g, '[$1]')
                .replace(/\s+/g, '')
                .trim();
            if (!value) return null;

            if (value.startsWith('json.')) {
                value = `$${value}`;
            } else if (value.startsWith('json[')) {
                value = `$${value}`;
            }
            const withSandboxPrefix = /^\$[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[\d+\])*$/;
            if (withSandboxPrefix.test(value)) {
                return value;
            }

            const withoutJsonPrefix = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[\d+\])*$/;
            if (withoutJsonPrefix.test(value)) {
                return `$json.${value}`;
            }
            return null;
        }

        function getDroppedExpressionJsonPath(dataTransfer) {
            if (!dataTransfer) return null;
            const preferredTypes = [
                'application/x-llumen-expression-path',
                'text/x-llumen-json-path',
                'text/plain'
            ];
            for (const type of preferredTypes) {
                const rawValue = dataTransfer.getData(type);
                const normalized = normalizeDroppedExpressionJsonPath(rawValue);
                if (normalized) return normalized;
            }
            return null;
        }

        function canAcceptDroppedExpressionPath(dataTransfer) {
            if (!dataTransfer) return false;
            const types = Array.from(dataTransfer.types || []);
            if (types.includes('application/x-llumen-expression-path')) return true;
            if (types.includes('text/x-llumen-json-path')) return true;
            if (types.includes('text/plain')) return true;
            // Some browsers do not expose custom/plain data during dragover;
            // allow drop when any drag payload exists and validate on drop.
            return types.length > 0;
        }

        function isCaretInsideExpressionTokenAtOffset(textValue, offset) {
            const text = String(textValue || '');
            const caretOffset = Number(offset);
            if (!Number.isFinite(caretOffset)) return false;
            const tokenRegex = /\{\{[\s\S]*?\}\}/g;
            let match = tokenRegex.exec(text);
            while (match) {
                const tokenStart = match.index;
                const tokenEnd = tokenStart + match[0].length;
                if (caretOffset > tokenStart && caretOffset < tokenEnd) {
                    return true;
                }
                match = tokenRegex.exec(text);
            }
            return false;
        }

        function getContenteditableNodeTextLength(node) {
            if (!node) return 0;
            if (node.nodeType === Node.TEXT_NODE) {
                return String(node.nodeValue || '').length;
            }
            if (node.nodeName === 'BR') {
                return 1;
            }
            let total = 0;
            const childNodes = Array.from(node.childNodes || []);
            childNodes.forEach((childNode) => {
                total += getContenteditableNodeTextLength(childNode);
            });
            return total;
        }

        function getContenteditableRawTextOffset(rootElement, targetNode, targetOffset) {
            if (!rootElement || !targetNode) return 0;
            let resolvedOffset = 0;
            let didResolve = false;
            const walk = (currentNode) => {
                if (didResolve || !currentNode) return;
                if (currentNode === targetNode) {
                    if (currentNode.nodeType === Node.TEXT_NODE) {
                        const rawText = String(currentNode.nodeValue || '');
                        resolvedOffset += Math.max(0, Math.min(rawText.length, Number(targetOffset) || 0));
                    } else {
                        const childNodes = Array.from(currentNode.childNodes || []);
                        const maxChildOffset = Math.max(0, Math.min(childNodes.length, Number(targetOffset) || 0));
                        for (let childIndex = 0; childIndex < maxChildOffset; childIndex += 1) {
                            resolvedOffset += getContenteditableNodeTextLength(childNodes[childIndex]);
                        }
                    }
                    didResolve = true;
                    return;
                }
                if (currentNode.nodeType === Node.TEXT_NODE) {
                    resolvedOffset += getContenteditableNodeTextLength(currentNode);
                    return;
                }
                const childNodes = Array.from(currentNode.childNodes || []);
                for (let childIndex = 0; childIndex < childNodes.length; childIndex += 1) {
                    walk(childNodes[childIndex]);
                    if (didResolve) return;
                }
            };
            walk(rootElement);
            return resolvedOffset;
        }

        function getContenteditableRawTextValue(rootElement) {
            if (!rootElement) return '';
            let output = '';
            const walk = (currentNode) => {
                if (!currentNode) return;
                if (currentNode.nodeType === Node.TEXT_NODE) {
                    output += String(currentNode.nodeValue || '').replace(/\u00a0/g, ' ');
                    return;
                }
                if (currentNode.nodeName === 'BR') {
                    // Keep extraction aligned with caret offset math: any <br> is a line break,
                    // except the empty-editor placeholder case handled below.
                    output += '\n';
                    return;
                }
                if (currentNode.nodeType !== Node.ELEMENT_NODE) {
                    return;
                }
                const childNodes = Array.from(currentNode.childNodes || []);
                childNodes.forEach((childNode) => walk(childNode));
            };
            walk(rootElement);
            const normalizedOutput = output.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            // Guard against empty-editor placeholder markup resolving to a phantom newline value.
            if (!normalizedOutput.trim()) {
                const onlyPlaceholderBreak = rootElement.childNodes.length === 1
                    && rootElement.firstChild
                    && rootElement.firstChild.nodeName === 'BR'
                    && !(rootElement.firstChild instanceof HTMLElement && rootElement.firstChild.hasAttribute('data-expression-editor-trailing-break'));
                if (onlyPlaceholderBreak) return '';
            }
            return normalizedOutput;
        }

        function getContenteditableRawSelectionOffsets(element) {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return null;
            const range = selection.getRangeAt(0);
            if (!element.contains(range.startContainer) || !element.contains(range.endContainer)) return null;
            return {
                start: getContenteditableRawTextOffset(element, range.startContainer, range.startOffset),
                end: getContenteditableRawTextOffset(element, range.endContainer, range.endOffset)
            };
        }

        function getContenteditableDropContext(element, clientX, clientY) {
            if (!element) return { caretOffset: null, insideToken: false };
            let range = null;
            if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(clientX, clientY);
            } else if (document.caretPositionFromPoint) {
                const caretPosition = document.caretPositionFromPoint(clientX, clientY);
                if (caretPosition) {
                    range = document.createRange();
                    range.setStart(caretPosition.offsetNode, caretPosition.offset);
                    range.collapse(true);
                }
            }

            if (!range || !element.contains(range.startContainer)) {
                const selectionOffsets = getContenteditableSelectionOffsets(element);
                return {
                    caretOffset: selectionOffsets ? selectionOffsets.end : null,
                    insideToken: false
                };
            }
            const caretOffset = getContenteditableRawTextOffset(element, range.startContainer, range.startOffset);
            return {
                caretOffset,
                insideToken: isCaretInsideExpressionTokenAtOffset(element.textContent || '', caretOffset)
            };
        }

        function estimateTextInputCaretOffsetFromClientX(inputElement, clientX) {
            if (!inputElement) return 0;
            const textValue = String(inputElement.value || '');
            if (!textValue) return 0;
            const inputRect = inputElement.getBoundingClientRect();
            const styles = window.getComputedStyle(inputElement);
            const paddingLeft = Number.parseFloat(styles.paddingLeft || '0') || 0;
            const paddingRight = Number.parseFloat(styles.paddingRight || '0') || 0;
            const contentWidth = Math.max(0, inputRect.width - paddingLeft - paddingRight);
            const relativeX = Math.max(0, Math.min(contentWidth, clientX - inputRect.left - paddingLeft));
            const canvas = estimateTextInputCaretOffsetFromClientX.__canvas || document.createElement('canvas');
            estimateTextInputCaretOffsetFromClientX.__canvas = canvas;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return textValue.length;
            }
            const resolvedFont = styles.font && String(styles.font).trim()
                ? styles.font
                : `${styles.fontStyle || 'normal'} ${styles.fontVariant || 'normal'} ${styles.fontWeight || '400'} ${styles.fontSize || '14px'} / ${styles.lineHeight || 'normal'} ${styles.fontFamily || 'sans-serif'}`;
            ctx.font = resolvedFont;
            let caretOffset = textValue.length;
            for (let index = 0; index <= textValue.length; index += 1) {
                const measuredWidth = ctx.measureText(textValue.slice(0, index)).width;
                if (measuredWidth >= relativeX) {
                    caretOffset = index;
                    break;
                }
            }
            return Math.max(0, Math.min(textValue.length, caretOffset));
        }

        function getTextareaCaretMetricsFromPoint(textareaElement, clientX, clientY) {
            if (!textareaElement) return null;
            const textareaRect = textareaElement.getBoundingClientRect();
            const styles = window.getComputedStyle(textareaElement);
            const mirror = document.createElement('div');
            mirror.style.position = 'fixed';
            mirror.style.left = `${textareaRect.left}px`;
            mirror.style.top = `${textareaRect.top}px`;
            mirror.style.width = `${textareaRect.width}px`;
            mirror.style.height = `${textareaRect.height}px`;
            mirror.style.padding = styles.padding;
            mirror.style.border = styles.border;
            mirror.style.boxSizing = styles.boxSizing;
            mirror.style.font = styles.font;
            mirror.style.lineHeight = styles.lineHeight;
            mirror.style.letterSpacing = styles.letterSpacing;
            mirror.style.textTransform = styles.textTransform;
            mirror.style.textIndent = styles.textIndent;
            mirror.style.textAlign = styles.textAlign;
            mirror.style.tabSize = styles.tabSize;
            mirror.style.whiteSpace = 'pre-wrap';
            mirror.style.wordBreak = 'break-word';
            mirror.style.overflow = 'hidden';
            mirror.style.pointerEvents = 'auto';
            mirror.style.opacity = '0';
            mirror.style.zIndex = '2147483647';
            const rawValue = String(textareaElement.value || '');
            mirror.textContent = rawValue || '\u200b';
            document.body.appendChild(mirror);
            mirror.scrollTop = textareaElement.scrollTop;
            mirror.scrollLeft = textareaElement.scrollLeft;
            let range = null;
            if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(clientX, clientY);
            } else if (document.caretPositionFromPoint) {
                const caretPosition = document.caretPositionFromPoint(clientX, clientY);
                if (caretPosition) {
                    range = document.createRange();
                    range.setStart(caretPosition.offsetNode, caretPosition.offset);
                    range.collapse(true);
                }
            }
            if (!range || !mirror.contains(range.startContainer)) {
                const fallbackOffset = typeof textareaElement.selectionStart === 'number'
                    ? textareaElement.selectionStart
                    : rawValue.length;
                mirror.remove();
                return {
                    caretOffset: Math.max(0, Math.min(rawValue.length, fallbackOffset)),
                    caretRect: null
                };
            }
            const caretOffset = getContenteditableRawTextOffset(mirror, range.startContainer, range.startOffset);
            const collapsedRange = range.cloneRange();
            collapsedRange.collapse(true);
            const caretRect = collapsedRange.getClientRects()[0] || null;
            mirror.remove();
            return {
                caretOffset: Math.max(0, Math.min(rawValue.length, caretOffset)),
                caretRect
            };
        }

        function getExpressionEditorDropContext(editor, dropTarget, clientX, clientY) {
            if (!editor) return { caretOffset: null, insideToken: false };
            const currentView = getExpressionEditorView(editor);
            if (currentView === 'expression') {
                return getContenteditableDropContext(editor, clientX, clientY);
            }
            const fixedMode = getExpressionEditorFixedMode(editor);
            const controls = ensureExpressionEditorFixedControls(editor);
            if (fixedMode === 'string' && controls.string) {
                if (controls.string instanceof HTMLInputElement || controls.string instanceof HTMLTextAreaElement) {
                    if (controls.string instanceof HTMLTextAreaElement) {
                        const textareaMetrics = getTextareaCaretMetricsFromPoint(controls.string, clientX, clientY);
                        const textareaOffset = textareaMetrics && Number.isFinite(textareaMetrics.caretOffset)
                            ? textareaMetrics.caretOffset
                            : (typeof controls.string.selectionStart === 'number' ? controls.string.selectionStart : String(controls.string.value || '').length);
                        return {
                            caretOffset: textareaOffset,
                            insideToken: false
                        };
                    }
                    return {
                        caretOffset: estimateTextInputCaretOffsetFromClientX(controls.string, clientX),
                        insideToken: false
                    };
                }
                return getContenteditableDropContext(controls.string, clientX, clientY);
            }
            if (fixedMode === 'number' && controls.number) {
                return {
                    caretOffset: estimateTextInputCaretOffsetFromClientX(controls.number, clientX),
                    insideToken: false
                };
            }
            return { caretOffset: null, insideToken: false };
        }

        function removeExpressionEditorDropCaret(editor) {
            if (!editor) return;
            const existingCaret = editor.__expressionEditorDropCaret;
            if (existingCaret && existingCaret.parentElement) {
                existingCaret.remove();
            }
            editor.__expressionEditorDropCaret = null;
        }

        function renderExpressionEditorDropCaret(editor, clientX, clientY, dropTarget = null) {
            if (!editor) {
                removeExpressionEditorDropCaret(editor);
                return;
            }
            const currentView = getExpressionEditorView(editor);
            const fixedMode = getExpressionEditorFixedMode(editor);
            let caretHost = editor;
            if (currentView === 'fixed') {
                const controls = ensureExpressionEditorFixedControls(editor);
                if (fixedMode === 'string' && controls.string) {
                    caretHost = controls.string;
                } else if (fixedMode === 'number' && controls.number) {
                    caretHost = controls.number;
                } else {
                    removeExpressionEditorDropCaret(editor);
                    return;
                }
            } else if (currentView !== 'expression') {
                removeExpressionEditorDropCaret(editor);
                return;
            }
            const field = editor.closest('.ll-expression-field, .custom-field-with-left-element, .expression-editor-field');
            if (!field) {
                removeExpressionEditorDropCaret(editor);
                return;
            }

            if (caretHost instanceof HTMLInputElement || caretHost instanceof HTMLTextAreaElement) {
                if (caretHost instanceof HTMLTextAreaElement) {
                    const textareaMetrics = getTextareaCaretMetricsFromPoint(caretHost, clientX, clientY);
                    const fieldRect = field.getBoundingClientRect();
                    const hostRect = caretHost.getBoundingClientRect();
                    const relativeHostLeft = hostRect.left - fieldRect.left;
                    const relativeHostRight = hostRect.right - fieldRect.left;
                    const relativeHostTop = hostRect.top - fieldRect.top;
                    const lineHeight = Number.parseFloat(window.getComputedStyle(caretHost).lineHeight || '0')
                        || Number.parseFloat(window.getComputedStyle(caretHost).fontSize || '14') * 1.2;
                    const caretLeft = textareaMetrics && textareaMetrics.caretRect
                        ? (textareaMetrics.caretRect.left - fieldRect.left)
                        : relativeHostLeft;
                    const caretTop = textareaMetrics && textareaMetrics.caretRect
                        ? (textareaMetrics.caretRect.top - fieldRect.top)
                        : relativeHostTop;
                    const caretHeight = textareaMetrics && textareaMetrics.caretRect && textareaMetrics.caretRect.height > 0
                        ? textareaMetrics.caretRect.height
                        : Math.max(12, lineHeight);
                    let caret = editor.__expressionEditorDropCaret;
                    if (!caret) {
                        caret = document.createElement('div');
                        caret.className = 'll-expression-drop-caret';
                        field.appendChild(caret);
                        editor.__expressionEditorDropCaret = caret;
                    }
                    caret.style.left = `${Math.max(relativeHostLeft, Math.min(caretLeft, relativeHostRight))}px`;
                    caret.style.top = `${Math.max(relativeHostTop, caretTop)}px`;
                    caret.style.height = `${caretHeight}px`;
                    return;
                }
                const hostRect = caretHost.getBoundingClientRect();
                const styles = window.getComputedStyle(caretHost);
                const paddingLeft = Number.parseFloat(styles.paddingLeft || '0') || 0;
                const lineHeight = Number.parseFloat(styles.lineHeight || '0') || Number.parseFloat(styles.fontSize || '14') * 1.2;
                const caretOffset = estimateTextInputCaretOffsetFromClientX(caretHost, clientX);
                const textPrefix = String(caretHost.value || '').slice(0, caretOffset);
                const canvas = renderExpressionEditorDropCaret.__canvas || document.createElement('canvas');
                renderExpressionEditorDropCaret.__canvas = canvas;
                const ctx = canvas.getContext('2d');
                let measuredPrefixWidth = 0;
                if (ctx) {
                    const resolvedFont = styles.font && String(styles.font).trim()
                        ? styles.font
                        : `${styles.fontStyle || 'normal'} ${styles.fontVariant || 'normal'} ${styles.fontWeight || '400'} ${styles.fontSize || '14px'} / ${styles.lineHeight || 'normal'} ${styles.fontFamily || 'sans-serif'}`;
                    ctx.font = resolvedFont;
                    measuredPrefixWidth = ctx.measureText(textPrefix).width;
                }
                const fieldRect = field.getBoundingClientRect();
                const relativeHostLeft = hostRect.left - fieldRect.left;
                const relativeHostTop = hostRect.top - fieldRect.top;
                const caretLeft = relativeHostLeft + paddingLeft + measuredPrefixWidth;
                const caretTop = relativeHostTop + Math.max(0, (hostRect.height - lineHeight) / 2);
                const caretHeight = Math.max(12, Math.min(hostRect.height - 4, lineHeight));
                let caret = editor.__expressionEditorDropCaret;
                if (!caret) {
                    caret = document.createElement('div');
                    caret.className = 'll-expression-drop-caret';
                    field.appendChild(caret);
                    editor.__expressionEditorDropCaret = caret;
                }
                caret.style.left = `${Math.max(relativeHostLeft, Math.min(caretLeft, relativeHostLeft + hostRect.width))}px`;
                caret.style.top = `${Math.max(relativeHostTop, caretTop)}px`;
                caret.style.height = `${caretHeight}px`;
                return;
            }

            let range = null;
            if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(clientX, clientY);
            } else if (document.caretPositionFromPoint) {
                const caretPosition = document.caretPositionFromPoint(clientX, clientY);
                if (caretPosition) {
                    range = document.createRange();
                    range.setStart(caretPosition.offsetNode, caretPosition.offset);
                    range.collapse(true);
                }
            }
            if (!range || !caretHost.contains(range.startContainer)) {
                removeExpressionEditorDropCaret(editor);
                return;
            }

            const collapsedRange = range.cloneRange();
            collapsedRange.collapse(true);
            const rangeRect = collapsedRange.getClientRects()[0];
            const fieldRect = field.getBoundingClientRect();
            const hostRect = caretHost.getBoundingClientRect();
            const hostStyles = window.getComputedStyle(caretHost);
            const relativeHostLeft = hostRect.left - fieldRect.left;
            const relativeHostRight = hostRect.right - fieldRect.left;
            const relativeHostTop = hostRect.top - fieldRect.top;
            const relativeHostBottom = hostRect.bottom - fieldRect.top;
            const lineHeight = Number.parseFloat(hostStyles.lineHeight) || 18;
            const fontSize = Number.parseFloat(hostStyles.fontSize) || 14;
            const paddingLeft = Number.parseFloat(hostStyles.paddingLeft) || 0;
            const paddingTop = Number.parseFloat(hostStyles.paddingTop) || 0;
            const fallbackCaretHeight = Math.max(12, Math.min(lineHeight, fontSize * 1.2));
            const caretLeft = rangeRect
                ? rangeRect.left - fieldRect.left
                : (relativeHostLeft + paddingLeft);
            const caretTop = rangeRect
                ? rangeRect.top - fieldRect.top
                : (relativeHostTop + paddingTop + Math.max(0, (lineHeight - fallbackCaretHeight) / 2));
            const caretHeight = rangeRect && rangeRect.height > 0 ? rangeRect.height : fallbackCaretHeight;
            const clampedLeft = Math.max(relativeHostLeft, Math.min(caretLeft, relativeHostRight));
            const clampedTop = Math.max(relativeHostTop, Math.min(caretTop, Math.max(relativeHostTop, relativeHostBottom - caretHeight)));

            let caret = editor.__expressionEditorDropCaret;
            if (!caret) {
                caret = document.createElement('div');
                caret.className = 'll-expression-drop-caret';
                field.appendChild(caret);
                editor.__expressionEditorDropCaret = caret;
            }
            caret.style.left = `${clampedLeft}px`;
            caret.style.top = `${clampedTop}px`;
            caret.style.height = `${caretHeight}px`;
        }

        function insertDroppedPathIntoExpressionEditor(editor, jsonPath, dropContext = {}, onChange = null) {
            if (!editor || !jsonPath) return;
            const currentText = editor.textContent || '';
            const shouldReplaceExisting = Boolean(dropContext && dropContext.replaceExisting === true);
            const hasNumericOffset = typeof dropContext.caretOffset === 'number' && Number.isFinite(dropContext.caretOffset);
            const fallbackSelection = hasNumericOffset ? null : getContenteditableSelectionOffsets(editor);
            const start = shouldReplaceExisting
                ? 0
                : (hasNumericOffset
                ? Math.max(0, Math.min(currentText.length, dropContext.caretOffset))
                : (fallbackSelection ? fallbackSelection.start : currentText.length));
            const end = shouldReplaceExisting
                ? currentText.length
                : (hasNumericOffset
                ? start
                : (fallbackSelection ? fallbackSelection.end : currentText.length));
            const insertText = dropContext.insideToken
                ? jsonPath
                : getExpressionEditorTokenFromJsonPath(jsonPath);
            const nextText = `${currentText.slice(0, start)}${insertText}${currentText.slice(end)}`;
            const nextCaretOffset = start + insertText.length;
            updateExpressionEditorContent(editor, nextText, nextCaretOffset, 'expression');
            syncExpressionEditorSelectLock(editor);
            syncExpressionEditorFixedValueFromExpression(editor);
            if (typeof onChange === 'function') {
                onChange(getExpressionEditorCurrentValue(editor));
            }
        }

        function handleExpressionEditorPathDrop(editor, jsonPath, dropContext = {}, onChange = null) {
            if (!editor || !jsonPath) return;
            const currentView = getExpressionEditorView(editor);
            const fixedMode = getExpressionEditorFixedMode(editor);
            const hasFixedSwitching = editor.__expressionEditorOptions && editor.__expressionEditorOptions.enableFixedSwitching === true;
            if (currentView === 'expression' || !hasFixedSwitching) {
                insertDroppedPathIntoExpressionEditor(editor, jsonPath, dropContext, onChange);
                return;
            }

            if (fixedMode === 'select') {
                const selectConfig = editor.__expressionEditorSelectConfig || null;
                const hasPathInSchema = Boolean(
                    selectConfig &&
                    selectConfig.pathTypeMap &&
                    typeof selectConfig.pathTypeMap.has === 'function' &&
                    selectConfig.pathTypeMap.has(jsonPath)
                );
                const controls = ensureExpressionEditorFixedControls(editor);
                if (hasPathInSchema && controls.selectButton && typeof controls.selectButton.__setPortaledDropdownValue === 'function') {
                    const didSet = controls.selectButton.__setPortaledDropdownValue(jsonPath, true);
                    if (didSet) {
                        editor.dataset.expressionSelectValue = jsonPath;
                        return;
                    }
                }
                if (hasPathInSchema) {
                    editor.dataset.expressionSelectValue = jsonPath;
                    const tokenText = getExpressionEditorTokenFromJsonPath(jsonPath);
                    updateExpressionEditorContent(editor, tokenText, null, 'expression');
                    syncExpressionEditorSelectControl(editor);
                    if (typeof onChange === 'function') {
                        onChange(getExpressionEditorCurrentValue(editor));
                    }
                    return;
                }
            }

            setExpressionEditorView(editor, 'expression', false);
            insertDroppedPathIntoExpressionEditor(
                editor,
                jsonPath,
                {
                    insideToken: Boolean(dropContext && dropContext.insideToken),
                    caretOffset: dropContext && Number.isFinite(dropContext.caretOffset) ? dropContext.caretOffset : null,
                    replaceExisting: false
                },
                onChange
            );
        }

        function normalizeExpressionEditorView(rawView) {
            return rawView === 'fixed' ? 'fixed' : 'expression';
        }

        function normalizeExpressionEditorFixedMode(rawMode) {
            if (rawMode === 'number' || rawMode === 'datetime' || rawMode === 'select' || rawMode === 'boolean') return rawMode;
            return 'string';
        }

        function isStrictDateLikeString(rawValue) {
            if (typeof rawValue !== 'string') return false;
            const normalizedValue = rawValue.trim();
            if (!normalizedValue) return false;
            const isoDateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
            const isoDateTimePattern = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/;
            if (!isoDateOnlyPattern.test(normalizedValue) && !isoDateTimePattern.test(normalizedValue)) {
                return false;
            }
            const parsedTimestamp = Date.parse(normalizedValue);
            if (Number.isNaN(parsedTimestamp)) return false;
            if (isoDateOnlyPattern.test(normalizedValue)) {
                const [yearText, monthText, dayText] = normalizedValue.split('-');
                const year = Number(yearText);
                const month = Number(monthText);
                const day = Number(dayText);
                const date = new Date(Date.UTC(year, month - 1, day));
                return date.getUTCFullYear() === year
                    && date.getUTCMonth() === month - 1
                    && date.getUTCDate() === day;
            }
            return true;
        }

        function getExpressionEditorPropertyType(value) {
            if (Array.isArray(value)) return 'array';
            if (value instanceof Date) return 'datetime';
            if (value && typeof value === 'object') return 'object';
            if (typeof value === 'boolean') return 'boolean';
            if (typeof value === 'number') return 'number';
            if (typeof value === 'string') {
                if (isStrictDateLikeString(value)) {
                    return 'datetime';
                }
                return 'string';
            }
            return 'string';
        }

        function getExpressionEditorPropertyTypeIcon(type) {
            if (type === 'number') return 'numbers';
            if (type === 'datetime') return 'calendar_month';
            if (type === 'boolean') return 'check_box';
            if (type === 'array') return 'data_array';
            if (type === 'object') return 'data_object';
            return 'title';
        }

        function getExpressionEditorGlobalSourceEntries() {
            const now = new Date();
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const today = new Date(todayStart);
            return [
                {
                    label: '$llumen',
                    sandboxPath: '$llumen',
                    data: {
                        now,
                        today,
                        currentMonth: now.getMonth(),
                        currentYear: now.getFullYear(),
                        userID: 'c4d6e9f2',
                        workspaceID: 'z9v2km7'
                    }
                },
                {
                    label: '$vars',
                    sandboxPath: '$vars',
                    data: {
                        orgName: 'Roads and Transport Authority',
                        orgDomain: 'rta.ae',
                        regionCode: 1
                    }
                }
            ];
        }

        function buildExpressionEditorSelectDropdownFromJson(sourceJsonArray) {
            const rawSources = Array.isArray(sourceJsonArray)
                ? sourceJsonArray.filter((item) => item && typeof item === 'object')
                : [];
            let userObjectIndex = 0;
            const normalizedSources = rawSources.map((source) => {
                if (
                    source &&
                    typeof source === 'object' &&
                    !Array.isArray(source) &&
                    source.data &&
                    typeof source.data === 'object' &&
                    typeof source.sandboxPath === 'string'
                ) {
                    const sandboxPath = source.sandboxPath.trim().startsWith('$')
                        ? source.sandboxPath.trim()
                        : `$${source.sandboxPath.trim()}`;
                    const label = String(source.label || sandboxPath).trim() || sandboxPath;
                    return {
                        label,
                        labelMeta: String(source.labelMeta || '').trim(),
                        icon: String(source.icon || '').trim(),
                        iconColorClass: String(source.iconColorClass || '').trim(),
                        alwaysShowSourceGroup: Boolean(source.alwaysShowSourceGroup),
                        sandboxPath,
                        data: source.data
                    };
                }
                userObjectIndex += 1;
                return {
                    label: `Object ${userObjectIndex}`,
                    labelMeta: '',
                    icon: '',
                    iconColorClass: '',
                    alwaysShowSourceGroup: false,
                    sandboxPath: '$json',
                    data: source
                };
            });
            const selectablePathSet = new Set();
            const pathLabelMap = new Map();
            const pathTypeMap = new Map();

            const toExpressionPath = (pathParts, sandboxPath = '$json') => {
                if (!Array.isArray(pathParts) || pathParts.length === 0) return sandboxPath;
                return `${sandboxPath}.${pathParts.join('.')}`;
            };
            const buildEntries = (value, expressionPath, displayPath, sandboxPath = '$json', sourceSelectionPrefix = '', depth = 0) => {
                const propertyType = getExpressionEditorPropertyType(value);
                const icon = getExpressionEditorPropertyTypeIcon(propertyType);
                pathTypeMap.set(expressionPath, propertyType);
                const selectedDisplayLabel = sourceSelectionPrefix
                    ? `${sourceSelectionPrefix}.${displayPath}`
                    : displayPath;

                if (propertyType === 'object') {
                    const children = Object.keys(value || {}).map((propertyKey) => {
                        const childValue = value[propertyKey];
                        const childExpressionPath = `${expressionPath}.${propertyKey}`;
                        const childDisplayPath = `${displayPath}.${propertyKey}`;
                        return buildEntries(childValue, childExpressionPath, childDisplayPath, sandboxPath, sourceSelectionPrefix, depth + 1);
                    });
                    selectablePathSet.add(expressionPath);
                    pathLabelMap.set(expressionPath, displayPath);
                    return {
                        label: displayPath.split('.').pop() || displayPath,
                        selectionLabel: displayPath,
                        selectedLabel: selectedDisplayLabel || displayPath,
                        value: expressionPath,
                        icon,
                        iconColorClass: 'accent',
                        children
                    };
                }

                if (propertyType === 'array') {
                    const rawArray = Array.isArray(value) ? value : [];
                    const children = rawArray.map((itemValue, itemIndex) => {
                        const itemExpressionPath = `${expressionPath}[${itemIndex}]`;
                        const itemDisplayPath = `${displayPath}[${itemIndex}]`;
                        return buildEntries(itemValue, itemExpressionPath, itemDisplayPath, sandboxPath, sourceSelectionPrefix, depth + 1);
                    });
                    selectablePathSet.add(expressionPath);
                    pathLabelMap.set(expressionPath, displayPath);
                    return {
                        label: displayPath.split('.').pop() || displayPath,
                        selectionLabel: displayPath,
                        selectedLabel: selectedDisplayLabel || displayPath,
                        value: expressionPath,
                        icon,
                        iconColorClass: 'accent',
                        children
                    };
                }

                selectablePathSet.add(expressionPath);
                pathLabelMap.set(expressionPath, displayPath.split('.').pop() || displayPath);
                return {
                    label: displayPath.split('.').pop() || displayPath,
                    selectionLabel: displayPath,
                    selectedLabel: selectedDisplayLabel || displayPath,
                    value: expressionPath,
                    icon,
                    iconColorClass: 'accent'
                };
            };

            const walk = (value, pathParts = [], sandboxPath = '$json', sourceSelectionPrefix = '') => {
                if (!value || typeof value !== 'object' || Array.isArray(value)) {
                    return [];
                }
                return Object.keys(value).map((propertyKey) => {
                    const propertyValue = value[propertyKey];
                    const propertyPathParts = pathParts.concat(propertyKey);
                    const expressionPath = toExpressionPath(propertyPathParts, sandboxPath);
                    const displayPath = propertyPathParts.join('.');
                    const entry = buildEntries(propertyValue, expressionPath, displayPath, sandboxPath, sourceSelectionPrefix, 0);
                    entry.label = propertyKey;
                    return entry;
                });
            };

            const renderableSources = normalizedSources
                .map((source) => ({
                    source,
                    children: walk(
                        source.data,
                        [],
                        source.sandboxPath,
                        source.sandboxPath === '$json' ? '' : source.label
                    )
                }))
                .filter((entry) => Array.isArray(entry.children) && entry.children.length > 0);
            const sourceGroups = renderableSources.map(({ source, children }) => {
                return {
                    label: source.label,
                    labelMeta: source.labelMeta || '',
                    icon: source.icon || 'data_object',
                    iconColorClass: source.iconColorClass || 'accent',
                    children,
                    isAccordionGroup: true
                };
            });
            const hasMultipleSources = renderableSources.length > 1
                || normalizedSources.some((source) => Boolean(source.alwaysShowSourceGroup));
            const singleSourceItems = hasMultipleSources
                ? []
                : (renderableSources[0] ? renderableSources[0].children : []);

            return {
                defaultValue: '',
                showTopLevelPrefixInSelection: false,
                showItemIconsAtAllLevels: true,
                rootAccordionMode: hasMultipleSources,
                items: hasMultipleSources ? sourceGroups : singleSourceItems,
                selectablePathSet,
                pathLabelMap,
                pathTypeMap
            };
        }

        function getOperatorGroupNameFromPropertyType(propertyType) {
            if (propertyType === 'number') return 'Number';
            if (propertyType === 'datetime') return 'Date & Time';
            if (propertyType === 'boolean') return 'Boolean';
            if (propertyType === 'array') return 'Array';
            if (propertyType === 'object') return 'Object';
            return 'String';
        }

        function getDefaultExpressionEditorSelectSourceJson() {
            return [
                {
                    user: {
                        name: 'Ramya',
                        id: 1024,
                        isActive: true,
                        createdAt: '2026-03-08T00:00:00Z'
                    },
                    order: {
                        total: 199.5,
                        createdAt: '2026-03-08T12:45:00Z'
                    },
                    tags: [
                        { label: 'vip', weight: 0.9, isPrimary: true },
                        { label: 'finance', weight: 0.7, isPrimary: false },
                        { label: 'internal', weight: 0.4, isPrimary: false }
                    ]
                },
                {
                    company: {
                        name: 'Lumen Labs',
                        id: 2048,
                        isPartner: true,
                        createdAt: '2026-04-12T09:15:00Z'
                    },
                    invoice: {
                        total: 752.35,
                        createdAt: '2026-04-13T11:30:00Z'
                    },
                    tags: [
                        { label: 'enterprise', weight: 0.95, isPrimary: true },
                        { label: 'priority', weight: 0.65, isPrimary: false },
                        { label: 'ops', weight: 0.45, isPrimary: false }
                    ]
                },
                {
                    account: {
                        name: 'Apex Trading',
                        id: 4096,
                        isActive: false,
                        createdAt: '2026-05-01T16:05:00Z'
                    },
                    shipment: {
                        total: 12,
                        createdAt: '2026-05-02T08:20:00Z'
                    },
                    metrics: {
                        score: 84,
                        updatedAt: '2026-05-03T10:10:00Z'
                    },
                    flags: {
                        requiresReview: true,
                        archived: false
                    },
                    owner: {
                        name: 'Ravi',
                        id: 7781
                    },
                    tags: [
                        { label: 'logistics', weight: 0.88, isPrimary: true },
                        { label: 'warehouse', weight: 0.52, isPrimary: false },
                        { label: 'audit', weight: 0.31, isPrimary: false }
                    ]
                }
            ];
        }
        function getExpressionSelectSourceJson() {
            const defaultSources = getDefaultExpressionEditorSelectSourceJson();
            return defaultSources.map((source, index) => ({
                label: `Object ${index + 1}`,
                sandboxPath: `$json.object_${index + 1}`,
                data: source
            }));
        }

        function extractExpressionEditorJsonPath(textValue) {
            const text = String(textValue || '')
                .replace(/[\u200B-\u200D\uFEFF]/g, '')
                .replace(/\u00A0/g, ' ')
                .trim();
            if (!text) return null;

            const normalized = text.replace(/\s+/g, ' ');
            const normalizePath = (rawPath) => {
                return String(rawPath || '')
                    .replace(/\s*\.\s*/g, '.')
                    .replace(/\[\s*(\d+)\s*\]/g, '[$1]')
                    .replace(/\s+/g, '')
                    .trim();
            };
            const pathWithOptionalSpacesRegex = /^\$[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*|\s*\[\s*\d+\s*\])+$/;
            const customRootPathWithOptionalSpacesRegex = /^\$\('(?:\\'|[^'])+'\)(?:\s*\.\s*[A-Za-z_$][\w$]*|\s*\[\s*\d+\s*\])*$/;

            if (normalized.startsWith('{{') && normalized.endsWith('}}')) {
                const innerExpression = normalized.slice(2, -2).trim();
                if (pathWithOptionalSpacesRegex.test(innerExpression)) {
                    return normalizePath(innerExpression);
                }
                if (customRootPathWithOptionalSpacesRegex.test(innerExpression)) {
                    return normalizeDroppedExpressionJsonPath(innerExpression);
                }
            }

            if (pathWithOptionalSpacesRegex.test(normalized)) {
                return normalizePath(normalized);
            }
            if (customRootPathWithOptionalSpacesRegex.test(normalized)) {
                return normalizeDroppedExpressionJsonPath(normalized);
            }
            return null;
        }

        function getExpressionEditorTokenFromJsonPath(jsonPath) {
            return `{{ ${jsonPath} }}`;
        }

        function getExpressionEditorDatetimeDynamicOptionItems() {
            return [
                { label: 'Now', value: 'dynamic_now' },
                { label: 'Today', value: 'dynamic_today' },
                { label: 'Yesterday', value: 'dynamic_yesterday' },
                { label: 'Tomorrow', value: 'dynamic_tomorrow' },
                { label: 'Current Week', value: 'dynamic_current_week' },
                { label: 'Previous Week', value: 'dynamic_previous_week' },
                { label: 'Next Week', value: 'dynamic_next_week' },
                { label: 'Current Month', value: 'dynamic_current_month' },
                { label: 'Previous Month', value: 'dynamic_previous_month' },
                { label: 'Next Month', value: 'dynamic_next_month' },
                { label: 'Current Quarter', value: 'dynamic_current_quarter' },
                { label: 'Previous Quarter', value: 'dynamic_previous_quarter' },
                { label: 'Next Quarter', value: 'dynamic_next_quarter' },
                { label: 'Current Year', value: 'dynamic_current_year' },
                { label: 'Previous Year', value: 'dynamic_previous_year' },
                { label: 'Next Year', value: 'dynamic_next_year' }
            ];
        }
        const EXPRESSION_EDITOR_DATETIME_SPECIFIC_SELECTION_VALUE = '__specific_datetime__';

        function formatExpressionEditorSpecificDatetimeLabel(rawValue) {
            if (!rawValue) return '';
            const parsedDate = new Date(rawValue);
            if (!Number.isFinite(parsedDate.getTime())) return String(rawValue);
            const monthName = parsedDate.toLocaleString('en-US', { month: 'long' });
            const day = parsedDate.getDate();
            const year = parsedDate.getFullYear();
            const hours24 = parsedDate.getHours();
            const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
            const period = hours24 >= 12 ? 'PM' : 'AM';
            const hours12 = (hours24 % 12) || 12;
            return `${monthName} ${day}, ${year} at ${hours12}:${minutes} ${period}`;
        }

        function restoreExpressionEditorDatetimeStoredValue(editor, rawValue) {
            if (!editor) return;
            const normalized = rawValue === null || rawValue === undefined ? '' : String(rawValue).trim();
            if (!normalized) return;
            if (!normalized.startsWith('dynamic_') && !normalized.startsWith('specific:')) return;
            editor.dataset.expressionDatetimeValue = normalized;
            if (normalized.startsWith('specific:')) {
                const specificRawValue = normalized.slice('specific:'.length);
                editor.dataset.expressionDatetimeLabel = formatExpressionEditorSpecificDatetimeLabel(specificRawValue);
            } else {
                editor.dataset.expressionDatetimeLabel = '';
            }
        }

        function getExpressionEditorFixedModeDefinition(mode) {
            const normalized = normalizeExpressionEditorFixedMode(mode);
            if (normalized === 'select') {
                return { mode: 'select', label: 'Select', icon: 'touch_app' };
            }
            if (normalized === 'number') {
                return { mode: 'number', label: 'Number', icon: 'numbers' };
            }
            if (normalized === 'datetime') {
                return { mode: 'datetime', label: 'Date & Time', icon: 'calendar_month' };
            }
            if (normalized === 'boolean') {
                return { mode: 'boolean', label: 'Boolean', icon: 'check_box' };
            }
            return { mode: 'string', label: 'String', icon: 'title' };
        }

        function normalizeExpressionEditorTextValue(rawValue, options = {}) {
            const allowLineBreaks = Boolean(options && options.allowLineBreaks === true);
            const trimWhenSingleLine = options && options.trimWhenSingleLine === false ? false : true;
            let normalized = rawValue === null || rawValue === undefined ? '' : String(rawValue);
            normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            if (!allowLineBreaks) {
                normalized = normalized
                    .replace(/<br\s*\/?>/gi, ' ')
                    .replace(/<br[^>]*>/gi, ' ')
                    .replace(/<\/?div[^>]*>/gi, ' ')
                    .replace(/<\/?p[^>]*>/gi, ' ');
                normalized = normalized.replace(/\n+/g, ' ');
                if (trimWhenSingleLine) {
                    normalized = normalized.trim();
                }
            }
            return normalized;
        }

        function doesExpressionEditorAllowLineBreaks(editor) {
            return Boolean(
                editor &&
                editor.__expressionEditorOptions &&
                editor.__expressionEditorOptions.allowLineBreaks === true
            );
        }

        function normalizeExpressionEditorOptions(options = {}) {
            const enableFixedSwitching = options.enableFixedSwitching === true;
            const mode = normalizeExpressionEditorFixedMode(options.mode);
            const includeGlobalSandboxDefinitions = options.includeGlobalSandboxDefinitions !== false;
            const minLines = normalizeExpressionEditorMinLines(options.minLines);
            const allowLineBreaks = options.allowLineBreaks === true;
            let initialView = (options.initialView === undefined || options.initialView === null)
                ? 'fixed'
                : normalizeExpressionEditorView(options.initialView);
            if (!enableFixedSwitching) {
                initialView = 'expression';
            }

            return {
                enableFixedSwitching,
                mode,
                initialView,
                minLines,
                allowLineBreaks,
                includeGlobalSandboxDefinitions,
                selectSourceJson: (() => {
                    const instanceSources = Array.isArray(options.selectSourceJson)
                        ? options.selectSourceJson.filter((item) => item && typeof item === 'object')
                        : [];
                    if (!includeGlobalSandboxDefinitions) {
                        return instanceSources;
                    }
                    const globalEntries = getExpressionEditorGlobalSourceEntries();
                    const hasGlobalSource = (sources, sandboxPath) => {
                        return sources.some((source) => {
                            if (!source || typeof source !== 'object') return false;
                            const sourceSandboxPath = typeof source.sandboxPath === 'string'
                                ? source.sandboxPath.trim()
                                : '';
                            return sourceSandboxPath === sandboxPath;
                        });
                    };
                    const nextSources = [...instanceSources];
                    globalEntries.forEach((entry) => {
                        if (!hasGlobalSource(nextSources, entry.sandboxPath)) {
                            nextSources.push(entry);
                        }
                    });
                    return nextSources;
                })()
            };
        }

        function getExpressionEditorView(editor) {
            return normalizeExpressionEditorView(editor ? editor.dataset.expressionView : 'expression');
        }

        function getExpressionEditorFixedMode(editor) {
            return normalizeExpressionEditorFixedMode(editor ? editor.dataset.expressionFixedMode : 'string');
        }

        function getExpressionEditorCurrentValue(editor) {
            if (!editor) return '';
            const view = getExpressionEditorView(editor);
            const allowLineBreaks = doesExpressionEditorAllowLineBreaks(editor);
            if (view === 'expression') {
                return normalizeExpressionEditorTextValue(editor.textContent || '', {
                    allowLineBreaks,
                    trimWhenSingleLine: !allowLineBreaks
                });
            }

            const fixedMode = getExpressionEditorFixedMode(editor);
            const controls = ensureExpressionEditorFixedControls(editor);
            const activeInput = controls[fixedMode];
            if (!activeInput) return '';
            if (fixedMode === 'number') {
                if (activeInput.value === '') return '';
                const parsed = Number(activeInput.value);
                return Number.isNaN(parsed) ? '' : parsed;
            }
            if (fixedMode === 'select') {
                return editor.dataset.expressionSelectValue || '';
            }
            if (fixedMode === 'datetime') {
                return editor.dataset.expressionDatetimeValue || '';
            }
            if (fixedMode === 'boolean') {
                const booleanValue = String(editor.dataset.expressionBooleanValue || '').trim().toLowerCase();
                if (booleanValue === 'false') return false;
                if (booleanValue === 'true') return true;
                return '';
            }
            if (fixedMode === 'string') {
                return getExpressionEditorFixedStringValue(activeInput);
            }
            return activeInput.value || '';
        }

        function getExpressionEditorInputClassName() {
            return 'll-expression-editor__input';
        }

        function normalizeExpressionEditorMinLines(rawValue) {
            const parsed = Number.parseInt(rawValue, 10);
            if (!Number.isFinite(parsed) || parsed < 1) return 1;
            return parsed;
        }

        function getExpressionEditorMinimumHeightPx(element, minLines = 1) {
            if (!element) return 0;
            const normalizedMinLines = normalizeExpressionEditorMinLines(minLines);
            const computedStyles = window.getComputedStyle(element);
            const fontSize = Number.parseFloat(computedStyles.fontSize) || 14;
            let lineHeight = Number.parseFloat(computedStyles.lineHeight);
            if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
                lineHeight = fontSize * 1.5;
            }
            const paddingTop = Number.parseFloat(computedStyles.paddingTop) || 0;
            const paddingBottom = Number.parseFloat(computedStyles.paddingBottom) || 0;
            const borderTop = Number.parseFloat(computedStyles.borderTopWidth) || 0;
            const borderBottom = Number.parseFloat(computedStyles.borderBottomWidth) || 0;
            return (lineHeight * normalizedMinLines) + paddingTop + paddingBottom + borderTop + borderBottom;
        }

        function applyExpressionEditorMinLines(editor, controlsInput = null) {
            if (!editor) return;
            const configuredMinLines = normalizeExpressionEditorMinLines(
                editor.__expressionEditorOptions && editor.__expressionEditorOptions.minLines
            );
            const hasFixedSwitching = Boolean(
                editor.__expressionEditorOptions &&
                editor.__expressionEditorOptions.enableFixedSwitching === true
            );
            const controls = controlsInput || (hasFixedSwitching ? ensureExpressionEditorFixedControls(editor) : null);
            const fixedStringControl = controls && controls.string ? controls.string : null;
            if (configuredMinLines <= 1) {
                editor.style.minHeight = '';
                if (fixedStringControl) fixedStringControl.style.minHeight = '';
                return;
            }
            const editorMinHeightPx = getExpressionEditorMinimumHeightPx(editor, configuredMinLines);
            if (editorMinHeightPx > 0) {
                editor.style.minHeight = `${editorMinHeightPx}px`;
            }
            if (fixedStringControl) {
                const fixedMinHeightPx = getExpressionEditorMinimumHeightPx(fixedStringControl, configuredMinLines);
                if (fixedMinHeightPx > 0) {
                    fixedStringControl.style.minHeight = `${fixedMinHeightPx}px`;
                }
            }
        }

        function getExpressionEditorFixedStringValue(stringControl) {
            if (!stringControl) return '';
            const ownerEditor = stringControl.__expressionEditorOwner || null;
            const allowLineBreaks = doesExpressionEditorAllowLineBreaks(ownerEditor);
            if (stringControl instanceof HTMLInputElement || stringControl instanceof HTMLTextAreaElement) {
                return normalizeExpressionEditorTextValue(stringControl.value || '', {
                    allowLineBreaks,
                    trimWhenSingleLine: !allowLineBreaks
                });
            }
            return normalizeExpressionEditorTextValue(getContenteditableRawTextValue(stringControl), {
                allowLineBreaks,
                trimWhenSingleLine: !allowLineBreaks
            });
        }

        function autoResizeExpressionEditorFixedStringControl(stringControl) {
            if (!stringControl) return;
            if (stringControl instanceof HTMLTextAreaElement) {
                stringControl.style.height = 'auto';
                stringControl.style.height = `${Math.max(0, stringControl.scrollHeight)}px`;
                return;
            }
            // Let input/contenteditable controls size naturally.
            stringControl.style.height = '';
        }

        function setExpressionEditorFixedStringValue(stringControl, value) {
            if (!stringControl) return;
            const ownerEditor = stringControl.__expressionEditorOwner || null;
            const allowLineBreaks = doesExpressionEditorAllowLineBreaks(ownerEditor);
            const normalizedValue = normalizeExpressionEditorTextValue(value, {
                allowLineBreaks,
                trimWhenSingleLine: !allowLineBreaks
            });
            if (stringControl instanceof HTMLInputElement || stringControl instanceof HTMLTextAreaElement) {
                stringControl.value = normalizedValue;
                autoResizeExpressionEditorFixedStringControl(stringControl);
                return;
            }
            if (allowLineBreaks) {
                stringControl.innerHTML = buildExpressionEditorHtml(normalizedValue, 'fixed', true);
            } else {
                stringControl.textContent = normalizedValue;
            }
            autoResizeExpressionEditorFixedStringControl(stringControl);
        }

        function applyTextEditWithSelection(rawValue, selectionStart, selectionEnd, insertedText = '') {
            const normalizedRaw = String(rawValue || '');
            const normalizedStart = Math.max(0, Math.min(normalizedRaw.length, Number(selectionStart) || 0));
            const normalizedEnd = Math.max(normalizedStart, Math.min(normalizedRaw.length, Number(selectionEnd) || normalizedStart));
            return `${normalizedRaw.slice(0, normalizedStart)}${String(insertedText || '')}${normalizedRaw.slice(normalizedEnd)}`;
        }

        function syncExpressionEditorExpressionValueFromFixed(editor) {
            if (!editor) return;
            const fixedMode = getExpressionEditorFixedMode(editor);
            if (fixedMode !== 'string' && fixedMode !== 'number' && fixedMode !== 'boolean') return;
            const controls = ensureExpressionEditorFixedControls(editor);
            if (fixedMode === 'string') {
                const nextText = getExpressionEditorFixedStringValue(controls.string);
                updateExpressionEditorContent(editor, nextText, null, 'expression');
                syncExpressionEditorSelectLock(editor);
                return;
            }
            if (fixedMode === 'boolean') {
                const booleanValue = String(editor.dataset.expressionBooleanValue || 'true').trim().toLowerCase() === 'false'
                    ? 'false'
                    : 'true';
                updateExpressionEditorContent(editor, booleanValue, null, 'expression');
                syncExpressionEditorSelectLock(editor);
                return;
            }
            if (!controls.number) return;
            const nextText = String(controls.number.value || '');
            updateExpressionEditorContent(editor, nextText, null, 'expression');
            syncExpressionEditorSelectLock(editor);
        }

        function syncExpressionEditorFixedValueFromExpression(editor) {
            if (!editor) return;
            const fixedMode = getExpressionEditorFixedMode(editor);
            if (fixedMode !== 'string' && fixedMode !== 'number' && fixedMode !== 'boolean') return;
            const controls = ensureExpressionEditorFixedControls(editor);
            const expressionText = String(editor.textContent || '');
            if (fixedMode === 'string') {
                setExpressionEditorFixedStringValue(controls.string, expressionText);
                return;
            }
            if (fixedMode === 'boolean') {
                const normalizedText = expressionText.trim().toLowerCase();
                editor.dataset.expressionBooleanValue = normalizedText === 'false' ? 'false' : 'true';
                syncExpressionEditorBooleanControl(editor, controls);
                return;
            }
            if (!controls.number) return;
            const normalizedText = expressionText.trim();
            if (!normalizedText) {
                controls.number.value = '';
                return;
            }
            const parsed = Number(normalizedText);
            controls.number.value = Number.isFinite(parsed) ? normalizedText : '';
        }

        function ensureExpressionEditorFixedControls(editor) {
            const field = editor.closest('.ll-expression-field, .custom-field-with-left-element, .expression-editor-field');
            if (!field) return {};
            let container = field.querySelector('[data-expression-editor-fixed-controls="true"]');
            const allowLineBreaks = doesExpressionEditorAllowLineBreaks(editor);
            if (container) {
                const existingStringControl = container.querySelector('[data-expression-editor-fixed-input="string"]');
                const isExpectedControlType = allowLineBreaks
                    ? (existingStringControl instanceof HTMLTextAreaElement)
                    : (existingStringControl instanceof HTMLInputElement);
                if (!isExpectedControlType) {
                    container.remove();
                    container = null;
                }
            }
            if (!container) {
                const baseClassName = getExpressionEditorInputClassName();
                container = document.createElement('div');
                container.dataset.expressionEditorFixedControls = 'true';
                container.className = 'hidden';
                const editorIdBase = (editor.id || 'expression-editor').replace(/[^a-zA-Z0-9_-]/g, '-');
                const fixedStringMarkup = allowLineBreaks
                    ? `<textarea id="${editorIdBase}-fixed-string" class="${baseClassName}" data-expression-editor-fixed-input="string" rows="4" placeholder="Enter text"></textarea>`
                    : `<input id="${editorIdBase}-fixed-string" type="text" class="${baseClassName}" data-expression-editor-fixed-input="string" placeholder="Enter text">`;
                container.innerHTML = `
                    ${fixedStringMarkup}
                    <input id="${editorIdBase}-fixed-number" type="number" class="${baseClassName} hidden" data-expression-editor-fixed-input="number" placeholder="Enter number">
                    <div class="hidden" data-expression-editor-fixed-input="datetime">
                        <button id="${editorIdBase}-fixed-datetime-btn" type="button"
                            class="${baseClassName} ll-expression-fixed-trigger">
                            <span class="ll-expression-fixed-datetime-selected ll-expression-fixed-selected">Select date and time</span>
                            <span class="material-symbols-outlined ll-expression-fixed-chevron">expand_more</span>
                        </button>
                        <div id="${editorIdBase}-fixed-datetime-menu" class="ll-dropdown__menu right-auto hidden overflow-y-auto"></div>
                    </div>
                    <div class="hidden" data-expression-editor-fixed-input="boolean">
                        <button id="${editorIdBase}-fixed-boolean-btn" type="button"
                            class="${baseClassName} ll-expression-fixed-trigger">
                            <span class="ll-expression-fixed-boolean-selected ll-expression-fixed-selected">True</span>
                            <span class="material-symbols-outlined ll-expression-fixed-chevron">expand_more</span>
                        </button>
                        <div id="${editorIdBase}-fixed-boolean-menu" class="ll-dropdown__menu right-auto hidden overflow-y-auto">
                            <button type="button" class="ll-dropdown__item ll-active" data-value="true">True</button>
                            <button type="button" class="ll-dropdown__item" data-value="false">False</button>
                        </div>
                    </div>
                    <div class="hidden" data-expression-editor-fixed-input="select">
                        <button id="${editorIdBase}-fixed-select-btn" type="button"
                            class="${baseClassName} ll-expression-fixed-trigger">
                            <span class="ll-expression-fixed-select-selected ll-expression-fixed-selected">Select property</span>
                            <span class="material-symbols-outlined ll-expression-fixed-chevron">expand_more</span>
                        </button>
                        <div id="${editorIdBase}-fixed-select-menu" class="ll-dropdown__menu right-auto hidden overflow-y-auto"></div>
                    </div>
                `;
                field.appendChild(container);
            }

            const inputs = {
                string: container.querySelector('[data-expression-editor-fixed-input="string"]'),
                number: container.querySelector('[data-expression-editor-fixed-input="number"]'),
                datetime: container.querySelector('[data-expression-editor-fixed-input="datetime"]'),
                boolean: container.querySelector('[data-expression-editor-fixed-input="boolean"]'),
                select: container.querySelector('[data-expression-editor-fixed-input="select"]'),
                container
            };
            if (inputs.string) {
                inputs.string.__expressionEditorOwner = editor;
            }
            if (inputs.string) {
                autoResizeExpressionEditorFixedStringControl(inputs.string);
            }
            applyExpressionEditorMinLines(editor, inputs);

            if (inputs.datetime) {
                const datetimeButton = inputs.datetime.querySelector('button[id$="-fixed-datetime-btn"]');
                const datetimeMenu = inputs.datetime.querySelector('div[id$="-fixed-datetime-menu"]');
                inputs.datetimeButton = datetimeButton;
                inputs.datetimeMenu = datetimeMenu;
                if (datetimeButton && datetimeMenu && datetimeButton.dataset.expressionEditorDatetimeDropdownBound !== 'true') {
                    initializePortaledDropdown({
                        buttonId: datetimeButton.id,
                        menuId: datetimeMenu.id,
                        selectedValueSelector: '.ll-expression-fixed-datetime-selected',
                        datasetFlag: 'expressionEditorDatetimeDropdownBound',
                        defaultValue: editor.dataset.expressionDatetimeValue || '',
                        emptySelectionLabel: 'Select date and time',
                        multiLevelConfig: {
                            allowEmptySelection: true,
                            enableSearch: false,
                            items: [
                                ...getExpressionEditorDatetimeDynamicOptionItems(),
                                {
                                    label: 'Specific Date & Time',
                                    value: EXPRESSION_EDITOR_DATETIME_SPECIFIC_SELECTION_VALUE,
                                    customSubmenuRenderer: ({ container, selectValue }) => {
                                        container.style.padding = '0';
                                        const wrapper = document.createElement('div');
                                        wrapper.className = 'datetimepicker-inmenu-container';
                                        container.appendChild(wrapper);
                                        const datetimeInput = document.createElement('input');
                                        datetimeInput.type = 'text';
                                        datetimeInput.className = 'absolute opacity-0 pointer-events-none w-0 h-0';
                                        wrapper.appendChild(datetimeInput);
                                        const calendarMount = document.createElement('div');
                                        calendarMount.className = '';
                                        wrapper.appendChild(calendarMount);
                                        const selectedValueSection = document.createElement('div');
                                        selectedValueSection.className = 'selection-preview';
                                        const selectedValueLabel = document.createElement('div');
                                        selectedValueLabel.className = 'text-xs text-gray-400';
                                        selectedValueLabel.textContent = 'Selected date and time:';
                                        const selectedValueText = document.createElement('div');
                                        selectedValueText.className = 'mt-1 text-sm text-gray-200 break-words';
                                        selectedValueSection.appendChild(selectedValueLabel);
                                        selectedValueSection.appendChild(selectedValueText);
                                        wrapper.appendChild(selectedValueSection);
                                        const currentValue = editor.dataset.expressionDatetimeValue || '';
                                        const currentSpecificRawValue = currentValue.startsWith('specific:')
                                            ? currentValue.slice('specific:'.length)
                                            : '';
                                        const updateSelectedValueText = (labelValue = '') => {
                                            const resolvedLabel = String(labelValue || '').trim();
                                            selectedValueText.textContent = resolvedLabel || 'No date selected';
                                        };
                                        const inlinePickerDefaultDate = (() => {
                                            if (currentSpecificRawValue) return currentSpecificRawValue;
                                            const now = new Date();
                                            now.setHours(0, 0, 0, 0);
                                            return now;
                                        })();
                                        updateSelectedValueText(
                                            currentSpecificRawValue
                                                ? formatExpressionEditorSpecificDatetimeLabel(currentSpecificRawValue)
                                                : ''
                                        );
                                        if (typeof window.flatpickr !== 'function') return;
                                        window.flatpickr(datetimeInput, {
                                            inline: true,
                                            appendTo: calendarMount,
                                            enableTime: true,
                                            time_24hr: false,
                                            dateFormat: 'F j, Y \\a\\t h:i K',
                                            defaultDate: inlinePickerDefaultDate,
                                            onChange: (selectedDates, selectedDateString) => {
                                                const selectedDate = selectedDates && selectedDates[0] ? selectedDates[0] : null;
                                                if (!selectedDate) return;
                                                const isoValue = selectedDate.toISOString();
                                                const value = `specific:${isoValue}`;
                                                const label = formatExpressionEditorSpecificDatetimeLabel(selectedDateString || isoValue);
                                                editor.dataset.expressionDatetimeValue = value;
                                                editor.dataset.expressionDatetimeLabel = label;
                                                updateSelectedValueText(label);
                                                selectValue(label, EXPRESSION_EDITOR_DATETIME_SPECIFIC_SELECTION_VALUE);
                                            }
                                        });
                                    }
                                }
                            ]
                        },
                        onValueChange: ({ value, label }) => {
                            const nextValue = String(value || '');
                            const nextLabel = String(label || '');
                            if (nextValue !== EXPRESSION_EDITOR_DATETIME_SPECIFIC_SELECTION_VALUE) {
                                editor.dataset.expressionDatetimeValue = nextValue;
                                editor.dataset.expressionDatetimeLabel = nextLabel;
                            }
                            if (typeof editor.__expressionEditorOnChange === 'function') {
                                editor.__expressionEditorOnChange(getExpressionEditorCurrentValue(editor));
                            }
                        }
                    });
                    datetimeButton.dataset.expressionEditorDatetimeDropdownBound = 'true';
                }
            }

            if (inputs.select) {
                const selectButton = inputs.select.querySelector('button[id$="-fixed-select-btn"]');
                const selectMenu = inputs.select.querySelector('div[id$="-fixed-select-menu"]');
                inputs.selectButton = selectButton;
                inputs.selectMenu = selectMenu;
                if (selectButton && selectMenu && selectButton.dataset.expressionEditorSelectDropdownBound !== 'true') {
                    const selectConfig = editor.__expressionEditorSelectConfig || buildExpressionEditorSelectDropdownFromJson([]);
                    initializePortaledDropdown({
                        buttonId: selectButton.id,
                        menuId: selectMenu.id,
                        selectedValueSelector: '.ll-expression-fixed-select-selected',
                        datasetFlag: 'expressionEditorSelectDropdownBound',
                        defaultValue: editor.dataset.expressionSelectValue || '',
                        emptySelectionLabel: 'Select property',
                        multiLevelConfig: {
                            showTopLevelPrefixInSelection: false,
                            showItemIconsAtAllLevels: true,
                            submenuTriggerMode: 'arrow',
                            rootAccordionMode: selectConfig.rootAccordionMode === true,
                            allowEmptySelection: true,
                            selectedValueClassName: 'll-expression-font',
                            menuItemClassName: 'll-expression-font',
                            enableSearch: true,
                            searchPlaceholder: 'Search property...',
                            items: selectConfig.items || []
                        },
                        onValueChange: ({ value }) => {
                            editor.dataset.expressionSelectValue = String(value || '');
                            editor.dataset.expressionSelectOrphanPath = '';
                            const tokenText = getExpressionEditorTokenFromJsonPath(editor.dataset.expressionSelectValue);
                            updateExpressionEditorContent(editor, tokenText, null, 'expression');
                            if (typeof editor.__expressionEditorOnChange === 'function') {
                                editor.__expressionEditorOnChange(getExpressionEditorCurrentValue(editor));
                            }
                        }
                    });
                    selectButton.dataset.expressionEditorSelectDropdownBound = 'true';
                }
                if (selectButton && selectButton.dataset.expressionEditorSelectSyncBound !== 'true') {
                    selectButton.addEventListener('click', () => {
                        // Always re-derive dropdown selection from current expression text
                        // right before opening the Select menu.
                        syncExpressionEditorSelectLock(editor);
                        syncExpressionEditorSelectControl(editor);
                    }, true);
                    selectButton.dataset.expressionEditorSelectSyncBound = 'true';
                }
            }
            if (inputs.boolean) {
                const booleanButton = inputs.boolean.querySelector('button[id$="-fixed-boolean-btn"]');
                const booleanMenu = inputs.boolean.querySelector('div[id$="-fixed-boolean-menu"]');
                inputs.booleanButton = booleanButton;
                inputs.booleanMenu = booleanMenu;
                if (booleanButton && booleanMenu && booleanButton.dataset.expressionEditorBooleanDropdownBound !== 'true') {
                    initializePortaledDropdown({
                        buttonId: booleanButton.id,
                        menuId: booleanMenu.id,
                        selectedValueSelector: '.ll-expression-fixed-boolean-selected',
                        datasetFlag: 'expressionEditorBooleanDropdownBound',
                        onValueChange: ({ value }) => {
                            const nextValue = String(value || 'true').trim().toLowerCase() === 'false'
                                ? 'false'
                                : 'true';
                            editor.dataset.expressionBooleanValue = nextValue;
                            syncExpressionEditorExpressionValueFromFixed(editor);
                            if (typeof editor.__expressionEditorOnChange === 'function') {
                                editor.__expressionEditorOnChange(getExpressionEditorCurrentValue(editor));
                            }
                        }
                    });
                    booleanButton.dataset.expressionEditorBooleanDropdownBound = 'true';
                }
            }
            if (inputs.booleanButton) {
                syncExpressionEditorBooleanControl(editor, inputs);
            }
            if (inputs.datetimeButton) {
                syncExpressionEditorDatetimeControl(editor, inputs);
            }
            return inputs;
        }

        function syncExpressionEditorBooleanControl(editor, controlsInput = null) {
            const controls = controlsInput || ensureExpressionEditorFixedControls(editor);
            if (!controls.booleanButton || !controls.booleanMenu) return;
            const selectedValue = String(editor.dataset.expressionBooleanValue || 'true').trim().toLowerCase() === 'false'
                ? 'false'
                : 'true';
            editor.dataset.expressionBooleanValue = selectedValue;
            if (typeof controls.booleanButton.__setPortaledDropdownValue === 'function') {
                controls.booleanButton.__setPortaledDropdownValue(selectedValue, false);
                return;
            }
            const span = controls.booleanButton.querySelector('.ll-expression-fixed-boolean-selected');
            if (span) {
                span.textContent = selectedValue === 'false' ? 'False' : 'True';
            }
        }

        function syncExpressionEditorSelectControl(editor) {
            const controls = ensureExpressionEditorFixedControls(editor);
            if (!controls.selectButton || !controls.selectMenu) return;
            const selectedValue = editor.dataset.expressionSelectValue || '';
            if (!selectedValue && typeof controls.selectButton.__clearPortaledDropdownSelection === 'function') {
                controls.selectButton.__clearPortaledDropdownSelection();
                return;
            }
            if (typeof controls.selectButton.__setPortaledDropdownValue === 'function') {
                const didSet = controls.selectButton.__setPortaledDropdownValue(selectedValue, false);
                if (!didSet) {
                    const selectConfig = editor.__expressionEditorSelectConfig || null;
                    const hasPathInSchema = Boolean(
                        selectConfig &&
                        selectConfig.pathTypeMap &&
                        typeof selectConfig.pathTypeMap.has === 'function' &&
                        selectConfig.pathTypeMap.has(selectedValue)
                    );
                    if (hasPathInSchema) {
                        const selectedSpan = controls.selectButton.querySelector('.ll-expression-fixed-select-selected');
                        if (selectedSpan) {
                            selectedSpan.textContent = selectedValue.replace(/^\$[A-Za-z_$][\w$]*\./, '');
                            selectedSpan.classList.remove('ll-dropdown__selected-value--placeholder');
                            selectedSpan.classList.add('ll-expression-font');
                        }
                    } else if (typeof controls.selectButton.__clearPortaledDropdownSelection === 'function') {
                        controls.selectButton.__clearPortaledDropdownSelection();
                    }
                }
                return;
            }
            const selectedSpan = controls.selectButton.querySelector('.ll-expression-fixed-select-selected');
            if (selectedSpan) {
                const fallbackLabel = selectedValue ? selectedValue.replace(/^\$[A-Za-z_$][\w$]*\./, '') : 'Select property';
                selectedSpan.textContent = fallbackLabel;
            }
        }

        function syncExpressionEditorDatetimeControl(editor, controlsInput = null) {
            const controls = controlsInput || ensureExpressionEditorFixedControls(editor);
            if (!controls.datetimeButton || !controls.datetimeMenu) return;
            const selectedValue = editor.dataset.expressionDatetimeValue || '';
            const selectedLabel = editor.dataset.expressionDatetimeLabel || '';
            if (!selectedValue) {
                if (typeof controls.datetimeButton.__clearPortaledDropdownSelection === 'function') {
                    controls.datetimeButton.__clearPortaledDropdownSelection();
                    return;
                }
                const span = controls.datetimeButton.querySelector('.ll-expression-fixed-datetime-selected');
                if (span) span.textContent = 'Select date and time';
                return;
            }
            if (typeof controls.datetimeButton.__setPortaledDropdownValue === 'function') {
                const dropdownSelectionValue = selectedValue.startsWith('specific:')
                    ? EXPRESSION_EDITOR_DATETIME_SPECIFIC_SELECTION_VALUE
                    : selectedValue;
                const didSet = controls.datetimeButton.__setPortaledDropdownValue(dropdownSelectionValue, false);
                if (didSet && selectedValue.startsWith('specific:')) {
                    const span = controls.datetimeButton.querySelector('.ll-expression-fixed-datetime-selected');
                    if (span) {
                        const rawValue = selectedValue.slice('specific:'.length);
                        span.textContent = selectedLabel || formatExpressionEditorSpecificDatetimeLabel(rawValue) || 'Specific Date & Time';
                        span.classList.remove('ll-dropdown__selected-value--placeholder');
                    }
                    return;
                }
                if (didSet) return;
            }
            const span = controls.datetimeButton.querySelector('.ll-expression-fixed-datetime-selected');
            if (span) {
                if (selectedValue.startsWith('specific:')) {
                    const rawValue = selectedValue.slice('specific:'.length);
                    span.textContent = selectedLabel || formatExpressionEditorSpecificDatetimeLabel(rawValue) || 'Specific Date & Time';
                } else {
                    span.textContent = selectedLabel || selectedValue;
                }
                span.classList.remove('ll-dropdown__selected-value--placeholder');
            }
        }

        function syncExpressionEditorSelectLock(editor) {
            if (!editor || editor.dataset.expressionHasSelectSupport !== 'true') return;
            const expressionText = editor.textContent || '';
            const extractedPath = extractExpressionEditorJsonPath(expressionText);
            const selectablePathSet = editor.__expressionEditorSelectConfig
                ? editor.__expressionEditorSelectConfig.selectablePathSet
                : new Set();
            const isMappedPath = extractedPath && selectablePathSet.has(extractedPath);
            const controls = ensureExpressionEditorFixedControls(editor);
            if (isMappedPath) {
                editor.dataset.expressionSelectValue = extractedPath;
                editor.dataset.expressionSelectOrphanPath = '';
                if (controls.selectButton && typeof controls.selectButton.__setPortaledDropdownValue === 'function') {
                    controls.selectButton.__setPortaledDropdownValue(extractedPath, false);
                } else {
                    syncExpressionEditorSelectControl(editor);
                }
                return;
            }
            editor.dataset.expressionSelectValue = '';
            if (extractedPath) {
                editor.dataset.expressionSelectOrphanPath = extractedPath;
            } else {
                editor.dataset.expressionSelectOrphanPath = '';
            }
            if (controls.selectButton && typeof controls.selectButton.__clearPortaledDropdownSelection === 'function') {
                controls.selectButton.__clearPortaledDropdownSelection();
            } else {
                syncExpressionEditorSelectControl(editor);
            }
        }

        function reconcileExpressionEditorSelectRestoreState(editor, options = {}) {
            if (!editor || getExpressionEditorFixedMode(editor) !== 'select') return null;
            const selectConfig = editor.__expressionEditorSelectConfig || null;
            const selectablePathSet = selectConfig && selectConfig.selectablePathSet instanceof Set
                ? selectConfig.selectablePathSet
                : new Set();
            const rawText = String(editor.textContent || '');
            const extractedPath = extractExpressionEditorJsonPath(rawText);
            const storedPath = String(editor.dataset.expressionSelectValue || '').trim();
            const orphanPath = String(editor.dataset.expressionSelectOrphanPath || '').trim();
            const candidatePath = storedPath || extractedPath || orphanPath || '';
            const normalizedRawText = rawText.trim();
            if (!candidatePath) {
                // Keep empty editors in Fixed Select mode.
                if (!normalizedRawText) return null;
                // Preserve non-single-property expressions in Expression mode.
                setExpressionEditorView(editor, 'expression', false);
                return 'expression';
            }

            const hasPathInSchema = selectablePathSet.has(candidatePath);
            if (hasPathInSchema) {
                editor.dataset.expressionSelectValue = candidatePath;
                editor.dataset.expressionSelectOrphanPath = '';
                syncExpressionEditorSelectControl(editor);
                if (options.preferFixedView !== false) {
                    setExpressionEditorView(editor, 'fixed', false);
                }
                return 'fixed';
            }

            editor.dataset.expressionSelectValue = '';
            editor.dataset.expressionSelectOrphanPath = candidatePath;
            updateExpressionEditorContent(editor, getExpressionEditorTokenFromJsonPath(candidatePath), null, 'expression');
            syncExpressionEditorSelectControl(editor);
            setExpressionEditorView(editor, 'expression', false);
            return 'expression';
        }

        function syncExpressionEditorFixedControls(editor) {
            const controls = ensureExpressionEditorFixedControls(editor);
            if (!controls.container) return;
            const view = getExpressionEditorView(editor);
            const fixedMode = getExpressionEditorFixedMode(editor);
            const allowLineBreaks = doesExpressionEditorAllowLineBreaks(editor);
            controls.container.classList.toggle('hidden', view !== 'fixed');
            editor.classList.toggle('hidden', view !== 'expression');
            editor.setAttribute('aria-multiline', allowLineBreaks ? 'true' : 'false');

            ['string', 'number', 'datetime', 'boolean', 'select'].forEach((mode) => {
                const input = controls[mode];
                if (!input) return;
                input.classList.toggle('hidden', !(view === 'fixed' && fixedMode === mode));
            });
            if (controls.string) {
                if (
                    !(controls.string instanceof HTMLInputElement) &&
                    !(controls.string instanceof HTMLTextAreaElement)
                ) {
                    controls.string.classList.toggle('whitespace-pre-wrap', allowLineBreaks);
                    controls.string.classList.toggle('break-words', allowLineBreaks);
                    controls.string.setAttribute('aria-multiline', allowLineBreaks ? 'true' : 'false');
                }
            }
            if (view === 'fixed' && fixedMode === 'string' && controls.string) {
                autoResizeExpressionEditorFixedStringControl(controls.string);
            }
            syncExpressionEditorStringControlHeight(editor, controls);
        }

        function syncExpressionEditorModeSwitcher(editor) {
            const field = editor.closest('.ll-expression-field, .custom-field-with-left-element, .expression-editor-field');
            if (!field) return;
            const switchRoot = field.querySelector('[data-expression-editor-mode-switch="true"]');
            if (!switchRoot) return;
            const currentView = getExpressionEditorView(editor);
            const fixedModeDef = getExpressionEditorFixedModeDefinition(getExpressionEditorFixedMode(editor));
            const menuId = editor.dataset.expressionModeSwitchMenuId || '';
            const menu = menuId ? document.getElementById(menuId) : null;
            const fixedOption = menu ? menu.querySelector('[data-expression-editor-switch-option="fixed"]') : null;
            if (fixedOption) {
                fixedOption.innerHTML = `
                    <span class="ll-dropdown__label-wrap">
                        <span class="material-symbols-outlined ll-dropdown__item-icon ll-dropdown__icon-color-muted">${escapeHtml(fixedModeDef.icon)}</span>
                        <span>${escapeHtml(fixedModeDef.label)}</span>
                    </span>
                `;
            }
            const expressionOption = menu ? menu.querySelector('[data-expression-editor-switch-option="expression"]') : null;
            if (fixedOption) {
                fixedOption.classList.toggle('ll-active', currentView === 'fixed');
            }
            if (expressionOption) {
                expressionOption.classList.toggle('ll-active', currentView === 'expression');
            }
            const trigger = switchRoot.querySelector('.ll-expression-mode-switch__trigger');
            if (trigger) {
                trigger.title = currentView === 'expression' ? 'Expression mode' : `${fixedModeDef.label} mode`;
            }
            const triggerIcon = switchRoot.querySelector('.ll-expression-mode-switch__selected .material-symbols-outlined');
            if (triggerIcon) {
                triggerIcon.textContent = currentView === 'expression' ? 'function' : fixedModeDef.icon;
            }
        }

        function ensureExpressionEditorFxIconStructure(field) {
            if (!field) return;
            const fxIcon = field.querySelector('.ll-expression-field__fx-icon, .expression-editor-fx-icon');
            if (!fxIcon) return;
            if (fxIcon.classList.contains('material-symbols-outlined') && fxIcon.tagName === 'SPAN') {
                fxIcon.classList.add('ll-expression-field__left', 'll-expression-field__fx-icon');
                return;
            }
            const iconNode = fxIcon.querySelector('.material-symbols-outlined');
            const iconText = String(iconNode ? iconNode.textContent : fxIcon.textContent || '').trim() || 'function';
            const wrapper = document.createElement('span');
            wrapper.className = 'll-expression-field__left ll-expression-field__fx-icon material-symbols-outlined';
            wrapper.textContent = iconText;
            fxIcon.replaceWith(wrapper);
        }

        function setExpressionEditorView(editor, view, triggerChange = false) {
            if (!editor) return;
            const previousView = getExpressionEditorView(editor);
            editor.dataset.expressionView = normalizeExpressionEditorView(view);
            const fixedMode = getExpressionEditorFixedMode(editor);
            if (previousView !== 'expression' && editor.dataset.expressionView === 'expression') {
                if (fixedMode === 'select') {
                    const rawText = String(editor.textContent || '');
                    const storedSelectPath = String(editor.dataset.expressionSelectValue || '').trim();
                    const extractedPath = extractExpressionEditorJsonPath(rawText);
                    const normalizedRawPath = normalizeDroppedExpressionJsonPath(rawText);
                    const selectedPath = storedSelectPath || extractedPath || normalizedRawPath || '';
                    if (selectedPath) {
                        const tokenText = getExpressionEditorTokenFromJsonPath(selectedPath);
                        updateExpressionEditorContent(editor, tokenText, null, 'expression');
                    }
                } else if (fixedMode === 'string' || fixedMode === 'number' || fixedMode === 'boolean') {
                    syncExpressionEditorExpressionValueFromFixed(editor);
                }
            }
            if (previousView === 'expression' && editor.dataset.expressionView === 'fixed') {
                if (fixedMode === 'string' || fixedMode === 'number' || fixedMode === 'boolean') {
                    syncExpressionEditorFixedValueFromExpression(editor);
                }
            }
            if (editor.dataset.expressionView === 'fixed' && fixedMode === 'select') {
                // Keep Select mode in sync even when only view changes (without mode change).
                syncExpressionEditorSelectLock(editor);
                syncExpressionEditorSelectControl(editor);
            }
            if (editor.dataset.expressionView === 'fixed' && fixedMode === 'datetime') {
                syncExpressionEditorDatetimeControl(editor);
            }
            if (editor.dataset.expressionView === 'fixed' && fixedMode === 'boolean') {
                syncExpressionEditorBooleanControl(editor);
            }
            syncExpressionEditorFixedControls(editor);
            syncExpressionEditorModeSwitcher(editor);
            if (triggerChange && typeof editor.__expressionEditorOnChange === 'function') {
                editor.__expressionEditorOnChange(getExpressionEditorCurrentValue(editor));
            }
            editor.dispatchEvent(new CustomEvent('expression-editor-mode-change', {
                detail: {
                    view: getExpressionEditorView(editor),
                    mode: getExpressionEditorFixedMode(editor)
                },
                bubbles: true
            }));
        }

        function setExpressionEditorMode(editorOrId, mode, triggerChange = false) {
            const editor = typeof editorOrId === 'string' ? document.getElementById(editorOrId) : editorOrId;
            if (!editor) return;
            const nextMode = normalizeExpressionEditorFixedMode(mode);
            const previousMode = getExpressionEditorFixedMode(editor);
            const previousView = getExpressionEditorView(editor);
            editor.dataset.expressionFixedMode = nextMode;
            if (previousMode !== nextMode && previousView === 'expression') {
                setExpressionEditorView(editor, 'fixed', false);
            }
            if (nextMode === 'select') {
                // Re-evaluate current expression before showing Select mode so
                // manual expression edits always sync with dropdown active item.
                syncExpressionEditorSelectLock(editor);
                syncExpressionEditorSelectControl(editor);
            } else if (nextMode === 'datetime') {
                syncExpressionEditorDatetimeControl(editor);
            } else if (nextMode === 'boolean') {
                syncExpressionEditorBooleanControl(editor);
                if (getExpressionEditorView(editor) === 'fixed') {
                    syncExpressionEditorFixedValueFromExpression(editor);
                }
            } else if ((nextMode === 'string' || nextMode === 'number') && getExpressionEditorView(editor) === 'fixed') {
                syncExpressionEditorFixedValueFromExpression(editor);
            }
            syncExpressionEditorFixedControls(editor);
            syncExpressionEditorModeSwitcher(editor);
            if (triggerChange && typeof editor.__expressionEditorOnChange === 'function') {
                editor.__expressionEditorOnChange(getExpressionEditorCurrentValue(editor));
            }
            editor.dispatchEvent(new CustomEvent('expression-editor-fixed-mode-change', {
                detail: {
                    mode: getExpressionEditorFixedMode(editor),
                    view: getExpressionEditorView(editor)
                },
                bubbles: true
            }));
        }

        function syncExpressionEditorStringControlHeight(editor, controlsInput = null) {
            if (!editor) return;
            const controls = controlsInput || ensureExpressionEditorFixedControls(editor);
            const stringControl = controls && controls.string ? controls.string : null;
            const configuredMinLines = normalizeExpressionEditorMinLines(
                editor.__expressionEditorOptions && editor.__expressionEditorOptions.minLines
            );
            if (stringControl instanceof HTMLTextAreaElement) {
                const controlHeight = stringControl.getBoundingClientRect().height;
                if (controlHeight > 0) {
                    const minHeightFromLines = configuredMinLines > 1
                        ? getExpressionEditorMinimumHeightPx(editor, configuredMinLines)
                        : 0;
                    editor.style.minHeight = `${Math.max(controlHeight, minHeightFromLines)}px`;
                }
                return;
            }
            if (configuredMinLines <= 1) {
                editor.style.minHeight = '';
            }
        }

        function bindExpressionEditorFixedControlHandlers(editor, controls, emitExpressionEditorChange = null) {
            if (!editor || !controls) return;
            ['string', 'number', 'datetime', 'boolean'].forEach((mode) => {
                const modeInput = controls[mode];
                if (!modeInput || modeInput.dataset.bound === 'true') return;
                const emitFixedControlChange = (reason = 'input') => {
                    if (mode === 'string') {
                        autoResizeExpressionEditorFixedStringControl(modeInput);
                        syncExpressionEditorStringControlHeight(editor, controls);
                    }
                    if (mode === 'string' || mode === 'number' || mode === 'boolean') {
                        syncExpressionEditorExpressionValueFromFixed(editor);
                    }
                    if (typeof emitExpressionEditorChange === 'function') {
                        emitExpressionEditorChange(reason);
                    }
                };
                if (mode === 'string') {
                    if (modeInput instanceof HTMLInputElement || modeInput instanceof HTMLTextAreaElement) {
                        modeInput.addEventListener('input', () => emitFixedControlChange('input'));
                        modeInput.addEventListener('change', () => emitFixedControlChange('input'));
                        modeInput.addEventListener('paste', (event) => {
                            const allowLineBreaks = doesExpressionEditorAllowLineBreaks(editor);
                            const rawPastedText = (event.clipboardData || window.clipboardData).getData('text') || '';
                            const pasteText = normalizeExpressionEditorTextValue(rawPastedText, {
                                allowLineBreaks,
                                trimWhenSingleLine: false
                            });
                            if (pasteText === rawPastedText) return;
                            event.preventDefault();
                            const selectionStart = modeInput.selectionStart === null ? modeInput.value.length : modeInput.selectionStart;
                            const selectionEnd = modeInput.selectionEnd === null ? selectionStart : modeInput.selectionEnd;
                            modeInput.setRangeText(pasteText, selectionStart, selectionEnd, 'end');
                            emitFixedControlChange('input');
                        });
                        if (modeInput instanceof HTMLInputElement) {
                            modeInput.addEventListener('keydown', (event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                }
                            });
                        }
                        modeInput.dataset.bound = 'true';
                        return;
                    }
                    modeInput.addEventListener('keydown', (event) => {
                        if (event.key !== 'Enter' || event.isComposing) return;
                        if (!doesExpressionEditorAllowLineBreaks(editor)) {
                            event.preventDefault();
                            return;
                        }
                        const selectionOffsets = getContenteditableRawSelectionOffsets(modeInput) || { start: 0, end: 0 };
                        const currentRawValue = getExpressionEditorFixedStringValue(modeInput);
                        const nextRawValue = applyTextEditWithSelection(
                            currentRawValue,
                            selectionOffsets.start,
                            selectionOffsets.end,
                            '\n'
                        );
                        event.preventDefault();
                        setExpressionEditorFixedStringValue(modeInput, nextRawValue);
                        setContenteditableCaretOffset(modeInput, selectionOffsets.start + 1);
                        emitFixedControlChange('input');
                    });
                    modeInput.addEventListener('input', () => emitFixedControlChange('input'));
                    modeInput.addEventListener('blur', () => emitFixedControlChange('blur'));
                    modeInput.addEventListener('paste', (event) => {
                        // Keep fixed-string editor plain text only.
                        event.preventDefault();
                        const allowLineBreaks = doesExpressionEditorAllowLineBreaks(editor);
                        const pasteText = normalizeExpressionEditorTextValue(
                            (event.clipboardData || window.clipboardData).getData('text') || '',
                            { allowLineBreaks, trimWhenSingleLine: false }
                        );
                        const selectionOffsets = getContenteditableRawSelectionOffsets(modeInput);
                        if (selectionOffsets) {
                            const currentRawValue = getExpressionEditorFixedStringValue(modeInput);
                            const nextRawValue = applyTextEditWithSelection(
                                currentRawValue,
                                selectionOffsets.start,
                                selectionOffsets.end,
                                pasteText
                            );
                            setExpressionEditorFixedStringValue(modeInput, nextRawValue);
                            setContenteditableCaretOffset(modeInput, selectionOffsets.start + pasteText.length);
                            emitFixedControlChange('input');
                            return;
                        }
                        document.execCommand('insertText', false, pasteText);
                    });
                } else {
                    modeInput.addEventListener('input', () => emitFixedControlChange('input'));
                    modeInput.addEventListener('change', () => emitFixedControlChange('input'));
                }
                modeInput.dataset.bound = 'true';
            });
            if (controls.select && controls.select.dataset.bound !== 'true') {
                syncExpressionEditorSelectControl(editor);
                controls.select.dataset.bound = 'true';
            }
        }

        function setExpressionEditorAllowLineBreaks(editorOrId, allowLineBreaks, triggerChange = false) {
            const editor = typeof editorOrId === 'string' ? document.getElementById(editorOrId) : editorOrId;
            if (!editor) return;
            const normalizedAllowLineBreaks = allowLineBreaks === true;
            const previousAllowLineBreaks = doesExpressionEditorAllowLineBreaks(editor);
            if (!editor.__expressionEditorOptions || typeof editor.__expressionEditorOptions !== 'object') {
                editor.__expressionEditorOptions = {};
            }
            const currentMinLines = normalizeExpressionEditorMinLines(editor.__expressionEditorOptions.minLines);
            if (normalizedAllowLineBreaks) {
                // Match workflow behavior for multiline fixed-string editors (e.g. Send Email Body):
                // expression and fixed modes should stay at a 4-line baseline unless explicitly configured.
                if (!editor.__expressionEditorOptions.__autoMultilineMinLines && currentMinLines <= 1) {
                    editor.__expressionEditorOptions.__autoMultilineMinLines = true;
                    editor.__expressionEditorOptions.__singleLineMinLines = currentMinLines;
                    editor.__expressionEditorOptions.minLines = 4;
                }
            } else if (editor.__expressionEditorOptions.__autoMultilineMinLines) {
                editor.__expressionEditorOptions.minLines = normalizeExpressionEditorMinLines(
                    editor.__expressionEditorOptions.__singleLineMinLines
                );
                delete editor.__expressionEditorOptions.__autoMultilineMinLines;
                delete editor.__expressionEditorOptions.__singleLineMinLines;
            }
            editor.__expressionEditorOptions.allowLineBreaks = normalizedAllowLineBreaks;
            if (previousAllowLineBreaks === normalizedAllowLineBreaks) return;

            const currentView = getExpressionEditorView(editor);
            const currentMode = getExpressionEditorFixedMode(editor);
            const currentValue = getExpressionEditorCurrentValue(editor);

            editor.classList.toggle('whitespace-pre-wrap', normalizedAllowLineBreaks);
            editor.classList.toggle('break-words', normalizedAllowLineBreaks);

            // Rebuild fixed controls when the string control type changes (input <-> textarea).
            const controls = ensureExpressionEditorFixedControls(editor);
            bindExpressionEditorFixedControlHandlers(editor, controls, editor.__expressionEditorEmitChange || null);
            if (currentMode === 'string' && controls.string) {
                setExpressionEditorFixedStringValue(controls.string, currentValue);
            }
            applyExpressionEditorMinLines(editor, controls);
            syncExpressionEditorStringControlHeight(editor, controls);
            updateExpressionEditorContent(editor, currentValue, null, currentView);
            syncExpressionEditorFixedControls(editor);
            syncExpressionEditorModeSwitcher(editor);
            if (triggerChange && typeof editor.__expressionEditorOnChange === 'function') {
                editor.__expressionEditorOnChange(getExpressionEditorCurrentValue(editor));
            }
            editor.dispatchEvent(new CustomEvent('expression-editor-linebreaks-change', {
                detail: {
                    allowLineBreaks: normalizedAllowLineBreaks,
                    mode: getExpressionEditorFixedMode(editor),
                    view: getExpressionEditorView(editor)
                },
                bubbles: true
            }));
        }

        function createExpressionEditorModeSwitcher(editor, onViewChange = null) {
            const field = editor.closest('.ll-expression-field, .custom-field-with-left-element, .expression-editor-field');
            if (!field) return;
            if (field.querySelector('[data-expression-editor-mode-switch="true"]')) return;

            field.querySelectorAll('.ll-expression-field__fx-icon, .expression-editor-fx-icon').forEach((icon) => {
                icon.remove();
            });

            const switchRoot = document.createElement('div');
            switchRoot.className = 'll-expression-mode-switch';
            switchRoot.dataset.expressionEditorModeSwitch = 'true';
            const editorIdBase = (editor.id || 'expression-editor').replace(/[^a-zA-Z0-9_-]/g, '-');
            const switchButtonId = `${editorIdBase}-mode-switch-btn`;
            const switchMenuId = `${editorIdBase}-mode-switch-menu`;
            editor.dataset.expressionModeSwitchButtonId = switchButtonId;
            editor.dataset.expressionModeSwitchMenuId = switchMenuId;
            const fixedModeDef = getExpressionEditorFixedModeDefinition(getExpressionEditorFixedMode(editor));
            const currentView = getExpressionEditorView(editor);
            switchRoot.innerHTML = `
                <button id="${switchButtonId}" type="button" class="ll-expression-mode-switch__trigger" aria-haspopup="menu" aria-expanded="false" title="Expression mode">
                    <span class="ll-expression-mode-switch__selected">
                        <span class="material-symbols-outlined">${currentView === 'expression' ? 'function' : escapeHtml(fixedModeDef.icon)}</span>
                    </span>
                    <span class="ll-expression-mode-switch__chevron material-symbols-outlined">expand_more</span>
                </button>
                <div id="${switchMenuId}" class="ll-dropdown__menu right-auto hidden overflow-y-auto">
                    <button type="button" class="ll-dropdown__item${currentView === 'fixed' ? ' ll-active' : ''}" data-expression-editor-switch-option="fixed" data-value="fixed">
                        <span class="ll-dropdown__label-wrap">
                            <span class="material-symbols-outlined ll-dropdown__item-icon ll-dropdown__icon-color-muted">${escapeHtml(fixedModeDef.icon)}</span>
                            <span>${escapeHtml(fixedModeDef.label)}</span>
                        </span>
                    </button>
                    <button type="button" class="ll-dropdown__item${currentView === 'expression' ? ' ll-active' : ''}" data-expression-editor-switch-option="expression" data-value="expression">
                        <span class="ll-dropdown__label-wrap">
                            <span class="material-symbols-outlined ll-dropdown__item-icon ll-dropdown__icon-color-muted">function</span>
                            <span>Expression</span>
                        </span>
                    </button>
                </div>
            `;
            field.appendChild(switchRoot);

            initializePortaledDropdown({
                buttonId: switchButtonId,
                menuId: switchMenuId,
                datasetFlag: 'expressionEditorModeSwitchBound',
                align: 'left',
                matchTriggerWidth: false,
                minMenuWidthPx: 170,
                onValueChange: ({ value }) => {
                    const nextView = normalizeExpressionEditorView(value);
                    const currentEditorView = getExpressionEditorView(editor);
                    if (nextView === currentEditorView) return;
                    if (typeof onViewChange === 'function') {
                        onViewChange(nextView);
                    }
                }
            });

            syncExpressionEditorModeSwitcher(editor);
        }

        function bindExpressionEditorBehavior(editor, onChangeOrOptions = null, maybeOptions = {}) {
            if (!editor || editor.dataset.bound === 'true') return;
            const onChange = typeof onChangeOrOptions === 'function' ? onChangeOrOptions : null;
            const optionsInput =
                onChange
                    ? maybeOptions
                    : (onChangeOrOptions && typeof onChangeOrOptions === 'object' ? onChangeOrOptions : {});
            const options = normalizeExpressionEditorOptions(optionsInput);
            editor.classList.toggle('whitespace-pre-wrap', Boolean(options.allowLineBreaks));
            editor.classList.toggle('break-words', Boolean(options.allowLineBreaks));
            editor.__expressionEditorOptions = options;
            editor.__expressionEditorSelectConfig = buildExpressionEditorSelectDropdownFromJson(options.selectSourceJson);
            editor.dataset.expressionHasSelectSupport = editor.__expressionEditorSelectConfig.items.length > 0 ? 'true' : 'false';
            editor.dataset.expressionFixedMode = options.mode;
            editor.dataset.expressionView = options.initialView;
            applyExpressionEditorMinLines(editor);
            const field = editor.closest('.ll-expression-field, .custom-field-with-left-element, .expression-editor-field');
            let lastObservedValue = getExpressionEditorCurrentValue(editor);
            const emitExpressionEditorChange = (reason = 'input', explicitValue = null) => {
                const nextValue = typeof explicitValue === 'string' ? explicitValue : getExpressionEditorCurrentValue(editor);
                const didValueChange = nextValue !== lastObservedValue;
                if (didValueChange) {
                    lastObservedValue = nextValue;
                }
                if (typeof onChange === 'function') {
                    onChange(nextValue);
                }
                if (!didValueChange || reason === 'blur') return;
                if (!editor.id) return;
                if (typeof windowScope.clearNodeConfigFieldValidationError === 'function') {
                    windowScope.clearNodeConfigFieldValidationError('', editor.id);
                }
            };
            editor.__expressionEditorEmitChange = emitExpressionEditorChange;
            editor.__expressionEditorOnChange = (nextValue = null) => {
                emitExpressionEditorChange('input', typeof nextValue === 'string' ? nextValue : null);
            };
            if (!options.enableFixedSwitching) {
                ensureExpressionEditorFxIconStructure(field);
            }
            if (field && field.dataset.expressionEditorFocusBound !== 'true') {
                field.addEventListener('focusin', () => {
                    field.classList.add('ring-2', 'ring-blue-500');
                });
                field.addEventListener('focusout', () => {
                    window.setTimeout(() => {
                        if (!field.contains(document.activeElement)) {
                            field.classList.remove('ring-2', 'ring-blue-500');
                        }
                    }, 0);
                });
                field.dataset.expressionEditorFocusBound = 'true';
            }

            const openToClose = {
                '(': ')',
                '[': ']',
                '{': '}'
            };

            if (options.enableFixedSwitching) {
                if (field) {
                    field.classList.remove('custom-field-with-left-element--expression');
                    field.classList.remove('custom-field-with-left-element--expression-switcher');
                    field.classList.add('ll-expression-field--switcher');
                }
                const controls = ensureExpressionEditorFixedControls(editor);
                bindExpressionEditorFixedControlHandlers(editor, controls, emitExpressionEditorChange);
                createExpressionEditorModeSwitcher(editor, (nextView) => {
                    setExpressionEditorView(editor, nextView, true);
                });
                syncExpressionEditorFixedControls(editor);
                applyExpressionEditorMinLines(editor, controls);
            } else {
                if (field) {
                    field.classList.remove('ll-expression-field--switcher');
                }
                setExpressionEditorView(editor, 'expression');
            }

            editor.addEventListener('keydown', (event) => {
                if (getExpressionEditorView(editor) !== 'expression') return;
                const currentText = editor.textContent || '';
                const allowLineBreaks = doesExpressionEditorAllowLineBreaks(editor);
                const selectionOffsets = getContenteditableSelectionOffsets(editor);
                const resolvedSelection = selectionOffsets || {
                    start: currentText.length,
                    end: currentText.length
                };
                const { start, end } = resolvedSelection;

                if (event.key === 'Enter') {
                    if (!allowLineBreaks) {
                        event.preventDefault();
                        return;
                    }
                    // Handle line breaks explicitly so they survive content normalization.
                    event.preventDefault();
                    const nextText = `${currentText.slice(0, start)}\n${currentText.slice(end)}`;
                    const nextCaretOffset = start + 1;
                    updateExpressionEditorContent(editor, nextText, nextCaretOffset);
                    syncExpressionEditorSelectLock(editor);
                    syncExpressionEditorFixedValueFromExpression(editor);
                    emitExpressionEditorChange('input');
                    return;
                }

                if ((event.key === 'Backspace' || event.key === 'Delete') && start === end) {
                    if (event.key === 'Backspace' && start > 0) {
                        const charBefore = currentText[start - 1] || '';
                        const charAfter = currentText[start] || '';
                        if (openToClose[charBefore] === charAfter) {
                            event.preventDefault();
                            const nextText = `${currentText.slice(0, start - 1)}${currentText.slice(start + 1)}`;
                            updateExpressionEditorContent(editor, nextText, start - 1);
                            syncExpressionEditorSelectLock(editor);
                            syncExpressionEditorFixedValueFromExpression(editor);
                            emitExpressionEditorChange('input');
                            return;
                        }
                    }

                    if (event.key === 'Delete' && start < currentText.length - 1) {
                        const charAtCursor = currentText[start] || '';
                        const charAfter = currentText[start + 1] || '';
                        if (openToClose[charAtCursor] === charAfter) {
                            event.preventDefault();
                            const nextText = `${currentText.slice(0, start)}${currentText.slice(start + 2)}`;
                            updateExpressionEditorContent(editor, nextText, start);
                            syncExpressionEditorSelectLock(editor);
                            syncExpressionEditorFixedValueFromExpression(editor);
                            emitExpressionEditorChange('input');
                            return;
                        }
                    }
                }

                const closeChar = openToClose[event.key];
                if (!closeChar) return;

                event.preventDefault();

                if (event.key === '{' && start === end && start > 0) {
                    const charBefore = currentText[start - 1] || '';
                    const charAfter = currentText[start] || '';
                    if (charBefore === '{' && charAfter === '}') {
                        const nextText = `${currentText.slice(0, start - 1)}{{  }}${currentText.slice(start + 1)}`;
                        const nextCaretOffset = start + 2;
                        updateExpressionEditorContent(editor, nextText, nextCaretOffset);
                        syncExpressionEditorSelectLock(editor);
                        syncExpressionEditorFixedValueFromExpression(editor);
                        emitExpressionEditorChange('input');
                        return;
                    }
                }

                const selectedText = currentText.slice(start, end);
                const nextText = `${currentText.slice(0, start)}${event.key}${selectedText}${closeChar}${currentText.slice(end)}`;
                const nextCaretOffset = start + 1 + selectedText.length;
                updateExpressionEditorContent(editor, nextText, nextCaretOffset);
                syncExpressionEditorSelectLock(editor);
                syncExpressionEditorFixedValueFromExpression(editor);
                emitExpressionEditorChange('input');
            });

            editor.addEventListener('paste', (event) => {
                if (getExpressionEditorView(editor) !== 'expression') return;
                event.preventDefault();
                const allowLineBreaks = doesExpressionEditorAllowLineBreaks(editor);
                const pasteText = normalizeExpressionEditorTextValue(
                    (event.clipboardData || window.clipboardData).getData('text') || '',
                    { allowLineBreaks, trimWhenSingleLine: false }
                );
                const selectionOffsets = getContenteditableSelectionOffsets(editor);
                if (!selectionOffsets) return;

                const currentText = editor.textContent || '';
                const nextText = `${currentText.slice(0, selectionOffsets.start)}${pasteText}${currentText.slice(selectionOffsets.end)}`;
                const nextCaretOffset = selectionOffsets.start + pasteText.length;
                updateExpressionEditorContent(editor, nextText, nextCaretOffset, getExpressionEditorView(editor));
                syncExpressionEditorSelectLock(editor);
                syncExpressionEditorFixedValueFromExpression(editor);
                emitExpressionEditorChange('input');
            });

            editor.addEventListener('input', () => {
                if (getExpressionEditorView(editor) !== 'expression') return;
                if (editor.dataset.isFormatting === 'true') return;
                const selectionOffsets = getContenteditableSelectionOffsets(editor);
                const allowLineBreaks = doesExpressionEditorAllowLineBreaks(editor);
                const currentText = normalizeExpressionEditorTextValue(editor.textContent || '', {
                    allowLineBreaks,
                    trimWhenSingleLine: false
                });
                const caretOffset = selectionOffsets ? selectionOffsets.end : currentText.length;
                updateExpressionEditorContent(editor, currentText, caretOffset, getExpressionEditorView(editor));
                syncExpressionEditorSelectLock(editor);
                syncExpressionEditorFixedValueFromExpression(editor);
                emitExpressionEditorChange('input');
            });

            const handleDropTargetDragOver = (event) => {
                if (!canAcceptDroppedExpressionPath(event.dataTransfer)) return;
                event.preventDefault();
                if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = 'move';
                }
                editor.__expressionEditorDropCaretPending = {
                    clientX: event.clientX,
                    clientY: event.clientY,
                    dropTarget: event.currentTarget
                };
                if (editor.__expressionEditorDropCaretRafId) return;
                editor.__expressionEditorDropCaretRafId = window.requestAnimationFrame(() => {
                    editor.__expressionEditorDropCaretRafId = null;
                    const pending = editor.__expressionEditorDropCaretPending || null;
                    editor.__expressionEditorDropCaretPending = null;
                    if (!pending) return;
                    editor.__expressionEditorLatestCaretDropContext = {
                        dropTarget: pending.dropTarget || null,
                        context: getExpressionEditorDropContext(
                            editor,
                            pending.dropTarget || null,
                            pending.clientX,
                            pending.clientY
                        )
                    };
                    renderExpressionEditorDropCaret(
                        editor,
                        pending.clientX,
                        pending.clientY,
                        pending.dropTarget || null
                    );
                });
            };
            const handleDropTargetDrop = (event) => {
                const droppedPath = getDroppedExpressionJsonPath(event.dataTransfer);
                if (!droppedPath) return;
                event.preventDefault();
                event.stopPropagation();
                if (editor.__expressionEditorDropCaretRafId) {
                    window.cancelAnimationFrame(editor.__expressionEditorDropCaretRafId);
                    editor.__expressionEditorDropCaretRafId = null;
                }
                editor.__expressionEditorDropCaretPending = null;
                removeExpressionEditorDropCaret(editor);
                const latestDropContext = editor.__expressionEditorLatestCaretDropContext
                    && editor.__expressionEditorLatestCaretDropContext.context
                    ? editor.__expressionEditorLatestCaretDropContext.context
                    : null;
                const dropContext = latestDropContext || getExpressionEditorDropContext(editor, event.currentTarget, event.clientX, event.clientY);
                editor.__expressionEditorLatestCaretDropContext = null;
                handleExpressionEditorPathDrop(editor, droppedPath, dropContext, () => {
                    emitExpressionEditorChange('input');
                });
            };
            const handleDropTargetDragLeave = (event) => {
                const nextTarget = event.relatedTarget;
                if (nextTarget && (event.currentTarget === nextTarget || event.currentTarget.contains(nextTarget))) {
                    return;
                }
                if (editor.__expressionEditorDropCaretRafId) {
                    window.cancelAnimationFrame(editor.__expressionEditorDropCaretRafId);
                    editor.__expressionEditorDropCaretRafId = null;
                }
                editor.__expressionEditorDropCaretPending = null;
                editor.__expressionEditorLatestCaretDropContext = null;
                removeExpressionEditorDropCaret(editor);
            };
            const bindDropTarget = (target) => {
                if (!target || target.dataset.expressionEditorDropBound === 'true') return;
                target.addEventListener('dragover', handleDropTargetDragOver);
                target.addEventListener('drop', handleDropTargetDrop);
                target.addEventListener('dragleave', handleDropTargetDragLeave);
                target.dataset.expressionEditorDropBound = 'true';
            };

            bindDropTarget(editor);
            bindDropTarget(field);

            if (options.enableFixedSwitching) {
                const controls = ensureExpressionEditorFixedControls(editor);
                bindDropTarget(controls.container);
                bindDropTarget(controls.string);
                bindDropTarget(controls.number);
                bindDropTarget(controls.datetime);
                bindDropTarget(controls.boolean);
                bindDropTarget(controls.booleanButton);
                bindDropTarget(controls.select);
                bindDropTarget(controls.selectButton);
            }

            if (editor.dataset.expressionEditorDropDocBound !== 'true') {
                document.addEventListener('drop', () => {
                    if (editor.__expressionEditorDropCaretRafId) {
                        window.cancelAnimationFrame(editor.__expressionEditorDropCaretRafId);
                        editor.__expressionEditorDropCaretRafId = null;
                    }
                    editor.__expressionEditorDropCaretPending = null;
                    editor.__expressionEditorLatestCaretDropContext = null;
                    removeExpressionEditorDropCaret(editor);
                });
                document.addEventListener('dragend', () => {
                    if (editor.__expressionEditorDropCaretRafId) {
                        window.cancelAnimationFrame(editor.__expressionEditorDropCaretRafId);
                        editor.__expressionEditorDropCaretRafId = null;
                    }
                    editor.__expressionEditorDropCaretPending = null;
                    editor.__expressionEditorLatestCaretDropContext = null;
                    removeExpressionEditorDropCaret(editor);
                });
                editor.dataset.expressionEditorDropDocBound = 'true';
            }

            editor.dataset.bound = 'true';
        }

        function buildExpressionEditorHtml(text, view = 'expression', allowLineBreaks = true) {
            if (!text) return allowLineBreaks ? '<br>' : '';
            if (view === 'fixed') {
                return escapeHtml(text);
            }
            const hasTrailingNewLine = Boolean(allowLineBreaks && typeof text === 'string' && text.endsWith('\n'));
            const expressionRegex = /\{\{[\s\S]*?\}\}/g;
            let html = '';
            let cursor = 0;
            let match = expressionRegex.exec(text);

            while (match) {
                const beforeText = text.slice(cursor, match.index);
                html += escapeHtml(beforeText);
                html += `<span class="ll-expression-editor__token">${escapeHtml(match[0])}</span>`;
                cursor = match.index + match[0].length;
                match = expressionRegex.exec(text);
            }

            html += escapeHtml(text.slice(cursor));
            return hasTrailingNewLine
                ? `${html}<br data-expression-editor-trailing-break="true">`
                : html;
        }

        function updateExpressionEditorContent(editor, text, caretOffset = null, view = null) {
            const resolvedView = normalizeExpressionEditorView(view || getExpressionEditorView(editor));
            const allowLineBreaks = doesExpressionEditorAllowLineBreaks(editor);
            const normalizedText = normalizeExpressionEditorTextValue(text, {
                allowLineBreaks,
                trimWhenSingleLine: false
            });
            editor.dataset.isFormatting = 'true';
            editor.innerHTML = buildExpressionEditorHtml(normalizedText, resolvedView, allowLineBreaks);
            editor.dataset.isFormatting = 'false';
            if (typeof caretOffset === 'number') {
                setContenteditableCaretOffset(editor, caretOffset);
            }
        }

        function initializeExpressionEditor(editorId, options = {}) {
            const editor = document.getElementById(editorId);
            if (!editor || editor.dataset.bound === 'true') return;
            const field = editor.closest('.ll-expression-field, .custom-field-with-left-element, .expression-editor-field');
            if (field && field.classList.contains('ll-expression-field')) {
                field.classList.add('ll-input');
            }
            const normalizedOptions = normalizeExpressionEditorOptions(options);
            bindExpressionEditorBehavior(editor, options);
            updateExpressionEditorContent(editor, '', null, normalizedOptions.initialView);
            setExpressionEditorMode(editor, normalizedOptions.mode);
            setExpressionEditorView(editor, normalizedOptions.initialView);
            if (normalizedOptions.mode === 'select') {
                const controls = ensureExpressionEditorFixedControls(editor);
                if (controls.selectButton && typeof controls.selectButton.__getPortaledDropdownValue === 'function') {
                    const selectedValue = controls.selectButton.__getPortaledDropdownValue();
                    if (selectedValue) {
                        editor.dataset.expressionSelectValue = selectedValue;
                        updateExpressionEditorContent(editor, getExpressionEditorTokenFromJsonPath(selectedValue), null, 'expression');
                    }
                }
            }
        }

        function toOperatorKey(rawLabel) {
            return String(rawLabel || '')
                .trim()
                .toLowerCase()
                .replace(/&/g, 'and')
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
        }

        function createOperatorsDropdownConfig(options = {}) {
            const groups = OPERATORS_DROPDOWN_DEFINITION.groups || [];
            const defaultGroupKey = options.defaultGroupKey || 'string';
            const defaultGroup = groups.find((group) => toOperatorKey(group.name) === defaultGroupKey) || groups[0] || null;
            const defaultOperatorName = defaultGroup
                ? (defaultGroup.defaultOperator || ((defaultGroup.operators || [])[0] && (defaultGroup.operators[0].name || defaultGroup.operators[0])) || '')
                : '';
            const defaultValue = options.defaultValue || (defaultGroup
                ? `${toOperatorKey(defaultGroup.name)}__${toOperatorKey(defaultOperatorName)}`
                : 'string__is_equal_to');
            const showTopLevelPrefixInSelection = options.showTopLevelPrefixInSelection !== false;

            const items = groups.map((group) => {
                const groupKey = toOperatorKey(group.name);
                return {
                    label: group.name,
                    icon: group.icon || 'category',
                    iconColorClass: 'muted',
                    children: (group.operators || []).map((operatorDefinition) => {
                        const operatorName = (operatorDefinition && typeof operatorDefinition === 'object')
                            ? operatorDefinition.name
                            : operatorDefinition;
                        const operatorKey = toOperatorKey(operatorName);
                        return {
                            label: operatorName,
                            value: `${groupKey}__${operatorKey}`,
                            operatorGroup: groupKey,
                            operatorKey,
                            hasRightExpression: Boolean(operatorDefinition && operatorDefinition.hasRightExpression),
                            rightFixedType: (operatorDefinition && operatorDefinition.rightFixedType) || ''
                        };
                    })
                };
            });

            return {
                defaultValue,
                showTopLevelPrefixInSelection,
                items
            };
        }

        function findOperatorDefinitionByValue(operatorValue) {
            if (!operatorValue) return null;
            const [groupKey, operatorKey] = String(operatorValue).split('__');
            if (!groupKey || !operatorKey) return null;
            const group = (OPERATORS_DROPDOWN_DEFINITION.groups || []).find((candidateGroup) => {
                return toOperatorKey(candidateGroup.name) === groupKey;
            });
            if (!group) return null;
            return (group.operators || []).find((operatorDefinition) => {
                return toOperatorKey(operatorDefinition.name) === operatorKey;
            }) || null;
        }

        function initializeExpressionDropSourceTree({
            treeRootIds = [],
            rootPathTransformers = {}
        } = {}) {
            const createDragGhost = (propertyLabel, propertyIcon) => {
                const ghost = document.createElement('div');
                ghost.dataset.expressionDragGhost = 'true';
                ghost.className = 'inline-flex items-center rounded-full border border-gray-600 bg-gray-900 text-gray-200 shadow-md ll-expression-font';
                ghost.style.position = 'fixed';
                ghost.style.top = '-9999px';
                ghost.style.left = '-9999px';
                ghost.style.pointerEvents = 'none';
                ghost.style.padding = '0.25rem 0.5rem';
                ghost.style.gap = '0.375rem';
                ghost.style.fontSize = '0.75rem';
                ghost.style.lineHeight = '1rem';
                ghost.style.whiteSpace = 'nowrap';
                ghost.innerHTML = `
                    <span class="material-symbols-outlined text-blue-300" style="font-size: 1rem; line-height: 1rem;">${escapeHtml(propertyIcon || 'title')}</span>
                    <span>${escapeHtml(propertyLabel || '')}</span>
                `;
                return ghost;
            };
            const treeRoots = treeRootIds
                .map((id) => document.getElementById(id))
                .filter(Boolean);
            if (!treeRoots.length) return;
            treeRoots.forEach((treeRoot) => {
                treeRoot.querySelectorAll('[data-expression-demo-path]').forEach((item) => {
                    if (item.dataset.expressionDropSourceBound === 'true') return;
                    item.classList.add('ll-expression-font');
                    item.draggable = true;
                    item.classList.add('cursor-grab');
                    item.addEventListener('dragstart', (event) => {
                        let path = normalizeDroppedExpressionJsonPath(item.dataset.expressionDemoPath || '');
                        const rootTransformer = rootPathTransformers[treeRoot.id];
                        if (typeof rootTransformer === 'function') {
                            path = normalizeDroppedExpressionJsonPath(rootTransformer(path, treeRoot, item));
                        }
                        if (!path || !event.dataTransfer) return;
                        const iconElement = item.querySelector('.material-symbols-outlined');
                        const labelElement = item.querySelector('.text-gray-300, .text-gray-200');
                        const propertyIcon = iconElement ? iconElement.textContent.trim() : 'title';
                        const propertyLabel = labelElement ? labelElement.textContent.trim() : path.replace(/^\$json\./, '');
                        const dragGhost = createDragGhost(propertyLabel, propertyIcon);
                        document.body.appendChild(dragGhost);
                        document.body.classList.add('ll-expression-property-dragging');
                        document.body.classList.remove('expression-property-dragging');
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('application/x-llumen-expression-path', path);
                        event.dataTransfer.setData('text/x-llumen-json-path', path);
                        event.dataTransfer.setData('text/plain', path);
                        // Keep ghost offset to bottom-right from cursor center for precise drop targeting.
                        event.dataTransfer.setDragImage(dragGhost, 0, 0);
                        window.setTimeout(() => {
                            dragGhost.remove();
                        }, 0);
                    });
                    item.addEventListener('dragend', () => {
                        document.querySelectorAll('[data-expression-drag-ghost="true"]').forEach((ghost) => ghost.remove());
                        document.body.classList.remove('ll-expression-property-dragging');
                        document.body.classList.remove('expression-property-dragging');
                    });
                    item.dataset.expressionDropSourceBound = 'true';
                });
            });
        }

        function initializeExpressionModeToggle({
            editorId,
            buttonIds
        } = {}) {
            const editor = document.getElementById(editorId);
            const buttonByMode = {
                string: document.getElementById(buttonIds.string),
                stringMultiline: document.getElementById(buttonIds.stringMultiline),
                number: document.getElementById(buttonIds.number),
                datetime: document.getElementById(buttonIds.datetime),
                select: document.getElementById(buttonIds.select)
            };
            if (!editor || !buttonByMode.string || !buttonByMode.number || !buttonByMode.datetime || !buttonByMode.select) return;
            if (editor.dataset.modeToggleBound === 'true') return;

            const syncModeButtons = () => {
                const activeMode = getExpressionEditorFixedMode(editor);
                const isStringMultiline = activeMode === 'string' && doesExpressionEditorAllowLineBreaks(editor);
                ['string', 'number', 'datetime', 'select'].forEach((mode) => {
                    const button = buttonByMode[mode];
                    if (!button) return;
                    const isActive = mode === activeMode && !(mode === 'string' && isStringMultiline);
                    button.classList.toggle('ll-active', isActive);
                });
                if (buttonByMode.stringMultiline) {
                    buttonByMode.stringMultiline.classList.toggle('ll-active', isStringMultiline);
                }
            };

            ['string', 'number', 'datetime', 'select'].forEach((mode) => {
                const button = buttonByMode[mode];
                if (!button) return;
                button.addEventListener('click', () => {
                    setExpressionEditorAllowLineBreaks(editor, false, false);
                    setExpressionEditorMode(editor, mode, true);
                    syncModeButtons();
                });
            });
            if (buttonByMode.stringMultiline) {
                buttonByMode.stringMultiline.addEventListener('click', () => {
                    setExpressionEditorAllowLineBreaks(editor, true, false);
                    setExpressionEditorMode(editor, 'string', true);
                    syncModeButtons();
                });
            }

            editor.addEventListener('expression-editor-fixed-mode-change', syncModeButtons);
            editor.addEventListener('expression-editor-linebreaks-change', syncModeButtons);
            editor.dataset.modeToggleBound = 'true';
            syncModeButtons();
        }

        function initializePortaledDropdown({
            buttonId,
            menuId,
            selectedValueSelector = null,
            datasetFlag = 'dropdownBound',
            align = 'left',
            matchTriggerWidth = true,
            multiLevelConfig = null,
            groupedOptions = null,
            defaultValue = '',
            emptySelectionLabel = '',
            onValueChange = null,
            minMenuWidthPx = 220,
            selectedPrefixWrapperClassName = '',
            containerClassName = ''
        }) {
            const dropdownButton = document.getElementById(buttonId);
            const escapedMenuId = typeof CSS !== 'undefined' && CSS.escape
                ? CSS.escape(menuId)
                : String(menuId || '').replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|/@])/g, '\\$1');
            const menuCandidates = menuId
                ? Array.from(document.querySelectorAll(`#${escapedMenuId}`))
                : [];
            let dropdownMenu = menuCandidates[0] || null;
            if (dropdownButton && menuCandidates.length > 1) {
                const dropdownRoot = dropdownButton.closest('.ll-dropdown') || dropdownButton.parentElement;
                const colocatedMenu = menuCandidates.find((candidate) => {
                    return candidate
                        && dropdownRoot
                        && dropdownRoot.contains(candidate)
                        && candidate.parentElement !== document.body;
                }) || menuCandidates.find((candidate) => {
                    return candidate
                        && candidate.parentElement
                        && candidate.parentElement.contains(dropdownButton);
                });
                if (colocatedMenu) {
                    dropdownMenu = colocatedMenu;
                }
                menuCandidates.forEach((candidate) => {
                    if (!candidate || candidate === dropdownMenu) return;
                    if (candidate.parentElement !== document.body) return;
                    if (!candidate.classList.contains('hidden')) return;
                    candidate.remove();
                });
            }
            const selectedValueSpan = selectedValueSelector
                ? (dropdownButton ? dropdownButton.querySelector(selectedValueSelector) : null)
                : null;
            if (!dropdownButton || !dropdownMenu || dropdownButton.dataset[datasetFlag] === 'true') return;
            const dropdownContainer = (() => {
                if (dropdownMenu.parentElement && dropdownMenu.parentElement.contains(dropdownButton)) {
                    return dropdownMenu.parentElement;
                }
                return dropdownButton.parentElement;
            })();
            if (dropdownContainer) {
                String(containerClassName || '')
                    .split(/\s+/)
                    .map((className) => className.trim())
                    .filter(Boolean)
                    .forEach((className) => {
                        dropdownContainer.classList.add(className);
                    });
            }
            dropdownButton.classList.add('ll-dropdown__trigger');
            if (dropdownButton.classList.contains('ll-dropdown__button')) {
                dropdownButton.classList.add('ll-input');
            }
            dropdownMenu.classList.add('ll-dropdown__menu');
            if (dropdownButton.id) {
                document.querySelectorAll(`label[for="${dropdownButton.id}"]`).forEach((labelElement) => {
                    if (!labelElement) return;
                    if (labelElement.dataset.dropdownLabelClickBound === dropdownButton.id) return;
                    labelElement.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        dropdownButton.click();
                    });
                    labelElement.dataset.dropdownLabelClickBound = dropdownButton.id;
                });
            }

            const isMultiLevel = Boolean(multiLevelConfig && Array.isArray(multiLevelConfig.items));
            const groupedOptionGroupsInput = Array.isArray(groupedOptions)
                ? groupedOptions
                : (groupedOptions && Array.isArray(groupedOptions.groups) ? groupedOptions.groups : null);
            const hasGroupedOptions = Boolean(!isMultiLevel && Array.isArray(groupedOptionGroupsInput));
            const allowEmptySelection = Boolean(multiLevelConfig && multiLevelConfig.allowEmptySelection === true);
            const resolvedDefaultValue = typeof defaultValue === 'string'
                ? defaultValue
                : String(defaultValue || '');
            const resolvedEmptySelectionLabel = typeof emptySelectionLabel === 'string'
                ? emptySelectionLabel
                : '';
            const enableSearch = Boolean(multiLevelConfig && multiLevelConfig.enableSearch === true);
            const searchPlaceholder = multiLevelConfig && typeof multiLevelConfig.searchPlaceholder === 'string'
                ? multiLevelConfig.searchPlaceholder
                : 'Search...';
            const submenuTriggerMode = multiLevelConfig && multiLevelConfig.submenuTriggerMode === 'arrow'
                ? 'arrow'
                : 'block';
            const selectedValueClassName = multiLevelConfig && typeof multiLevelConfig.selectedValueClassName === 'string'
                ? multiLevelConfig.selectedValueClassName.trim()
                : '';
            const menuItemClassName = multiLevelConfig && typeof multiLevelConfig.menuItemClassName === 'string'
                ? multiLevelConfig.menuItemClassName.trim()
                : '';
            const showItemIconsAtAllLevels = Boolean(multiLevelConfig && multiLevelConfig.showItemIconsAtAllLevels === true);
            const enableRootAccordion = Boolean(multiLevelConfig && multiLevelConfig.rootAccordionMode === true);
            const rootAccordionFixedWidthPx = enableRootAccordion ? 320 : null;
            const submenuLevelGap = 6;
            const openSubmenus = [];
            const resolveDropdownIconColorClass = (rawColorClass, fallbackVariant = 'muted') => {
                const normalizedValue = String(rawColorClass || '').trim().toLowerCase();
                if (normalizedValue.startsWith('ll-dropdown__icon-color-')) return normalizedValue;
                if (
                    normalizedValue === 'accent'
                    || normalizedValue === 'primary'
                    || normalizedValue === 'blue'
                    || normalizedValue.startsWith('text-blue')
                ) {
                    return 'll-dropdown__icon-color-accent';
                }
                if (
                    normalizedValue === 'muted'
                    || normalizedValue === 'default'
                    || normalizedValue === 'gray'
                    || normalizedValue.startsWith('text-gray')
                ) {
                    return 'll-dropdown__icon-color-muted';
                }
                return fallbackVariant === 'accent'
                    ? 'll-dropdown__icon-color-accent'
                    : 'll-dropdown__icon-color-muted';
            };
            let selectedLeafValue = null;
            let selectedLeafLabel = '';
            let selectedPrefixHtml = '';
            let selectedAncestorTriggerKeys = [];
            let suppressOnValueChange = false;
            let rootItemsContainer = null;
            let searchResultsContainer = null;
            let searchInput = null;
            const dropdownStackKey = `dropdown:${String(buttonId || menuId || 'unknown')}`;
            dropdownButton.dataset.portaledDropdownTrigger = 'true';
            dropdownButton.setAttribute('aria-expanded', 'false');
            const dropdownRegistry = (() => {
                if (!window.__llumenPortaledDropdownRegistry) {
                    window.__llumenPortaledDropdownRegistry = new Map();
                }
                return window.__llumenPortaledDropdownRegistry;
            })();

            const closeSubmenusFromLevel = (fromLevel = 1) => {
                while (openSubmenus.length > 0) {
                    const topRecord = openSubmenus[openSubmenus.length - 1];
                    const topLevel = Number(topRecord && topRecord.level);
                    if (!Number.isFinite(topLevel) || topLevel < fromLevel) {
                        break;
                    }
                    const submenuRecord = openSubmenus.pop();
                    if (!submenuRecord) continue;
                    submenuRecord.element.remove();
                    if (submenuRecord.trigger) {
                        submenuRecord.trigger.classList.remove('ll-dropdown__item--parent-active');
                    }
                }
            };

            const closeDropdown = () => {
                closeSubmenusFromLevel(1);
                if (searchInput) {
                    searchInput.value = '';
                    if (typeof searchInput.__syncSearchClearVisibility === 'function') {
                        searchInput.__syncSearchClearVisibility();
                    }
                }
                if (rootItemsContainer && searchResultsContainer) {
                    rootItemsContainer.classList.remove('hidden');
                    searchResultsContainer.classList.add('hidden');
                    searchResultsContainer.innerHTML = '';
                }
                dropdownMenu.classList.add('hidden');
                dropdownButton.setAttribute('aria-expanded', 'false');
                removeDropdownFromStack(dropdownStackKey);
            };

            const getOpenMenuContainers = () => {
                const containers = [dropdownMenu];
                openSubmenus.forEach((submenuRecord) => {
                    if (!submenuRecord || !submenuRecord.element) return;
                    containers.push(submenuRecord.element);
                });
                return containers.filter((container) => {
                    return container && !container.classList.contains('hidden');
                });
            };

            const registerDropdownAsOpen = () => {
                pushDropdownToStack({
                    key: dropdownStackKey,
                    trigger: dropdownButton,
                    close: closeDropdown,
                    isOpen: () => !dropdownMenu.classList.contains('hidden'),
                    getFocusContainers: getOpenMenuContainers
                });
            };

            const closeOtherDropdowns = () => {
                if (!dropdownRegistry || typeof dropdownRegistry.forEach !== 'function') return;
                dropdownRegistry.forEach((entry, key) => {
                    if (key === buttonId) return;
                    if (!entry || typeof entry.close !== 'function') return;
                    entry.close();
                });
            };

            const setSelectedPlaceholderState = (isPlaceholder) => {
                if (!selectedValueSpan) return;
                selectedValueSpan.classList.toggle('ll-dropdown__selected-value--placeholder', Boolean(isPlaceholder));
                if (selectedValueClassName) {
                    selectedValueSpan.classList.toggle(selectedValueClassName, !Boolean(isPlaceholder));
                }
            };

            const constrainMenuHeightToViewport = (menuElement, viewportPadding = 8) => {
                if (!menuElement) return;
                const availableHeight = Math.max(120, window.innerHeight - (viewportPadding * 2));
                menuElement.style.height = '';
                menuElement.style.maxHeight = '';

                const naturalHeight = menuElement.scrollHeight || 0;
                if ((naturalHeight + (viewportPadding * 2)) > window.innerHeight) {
                    menuElement.style.height = `${availableHeight}px`;
                    menuElement.style.maxHeight = `${availableHeight}px`;
                }
            };

            const positionDropdown = () => {
                const visualGap = 10;
                const viewportPadding = 8;
                const buttonRect = dropdownButton.getBoundingClientRect();
                const isFullWidthMenu = dropdownMenu.classList.contains('w-full');
                const hasInlineMinWidthOverride = typeof minMenuWidthPx === 'number' && Number.isFinite(minMenuWidthPx);
                const effectiveMinWidth = hasInlineMinWidthOverride ? Math.max(0, minMenuWidthPx) : 0;
                const maxAllowedWidth = Math.max(effectiveMinWidth, Math.min(420, window.innerWidth - (viewportPadding * 2)));
                const spaceBelow = window.innerHeight - buttonRect.bottom;
                dropdownMenu.style.position = 'absolute';
                dropdownMenu.style.right = 'auto';
                dropdownMenu.style.zIndex = '9999';
                if (isFullWidthMenu) {
                    dropdownMenu.style.width = `${buttonRect.width}px`;
                    dropdownMenu.style.minWidth = `${buttonRect.width}px`;
                    dropdownMenu.style.maxWidth = `${buttonRect.width}px`;
                } else if (typeof rootAccordionFixedWidthPx === 'number' && Number.isFinite(rootAccordionFixedWidthPx)) {
                    dropdownMenu.style.width = `${rootAccordionFixedWidthPx}px`;
                    dropdownMenu.style.minWidth = `${rootAccordionFixedWidthPx}px`;
                    dropdownMenu.style.maxWidth = `${rootAccordionFixedWidthPx}px`;
                } else {
                    dropdownMenu.style.width = 'max-content';
                    dropdownMenu.style.minWidth = hasInlineMinWidthOverride ? `${effectiveMinWidth}px` : '';
                    dropdownMenu.style.maxWidth = `${maxAllowedWidth}px`;
                }
                constrainMenuHeightToViewport(dropdownMenu, viewportPadding);

                const menuRect = dropdownMenu.getBoundingClientRect();
                const spaceAbove = buttonRect.top;
                const shouldOpenAbove = spaceBelow < (menuRect.height + visualGap) && spaceAbove >= (menuRect.height + visualGap);

                if (align === 'right') {
                    const rightAlignedLeft = (buttonRect.right + window.scrollX) - menuRect.width;
                    const clampedLeft = Math.max(viewportPadding + window.scrollX, rightAlignedLeft);
                    dropdownMenu.style.left = `${clampedLeft}px`;
                } else {
                    dropdownMenu.style.left = `${buttonRect.left + window.scrollX}px`;
                }

                if (shouldOpenAbove) {
                    const topWhenFlipped = buttonRect.top + window.scrollY - menuRect.height - visualGap;
                    dropdownMenu.style.top = `${Math.max(viewportPadding + window.scrollY, topWhenFlipped)}px`;
                } else {
                    dropdownMenu.style.top = `${buttonRect.bottom + window.scrollY + visualGap}px`;
                    const bottomEdge = buttonRect.bottom + menuRect.height + visualGap;
                    if (bottomEdge > window.innerHeight - viewportPadding) {
                        const clampedTop = Math.max(
                            viewportPadding + window.scrollY,
                            (window.innerHeight - viewportPadding + window.scrollY) - menuRect.height
                        );
                        dropdownMenu.style.top = `${clampedTop}px`;
                    }
                }
            };
            const repositionOpenMenus = () => {
                if (dropdownMenu.classList.contains('hidden')) return;
                positionDropdown();
                openSubmenus.forEach(({ element, trigger, anchor }) => {
                    positionSubmenu(element, anchor || trigger);
                });
            };

            const renderSelectedValue = (label, prefixHtml = '', isPlaceholder = false) => {
                if (!selectedValueSpan) return;
                setSelectedPlaceholderState(isPlaceholder);
                if (!isMultiLevel) {
                    if (isPlaceholder && resolvedEmptySelectionLabel) {
                        selectedValueSpan.textContent = resolvedEmptySelectionLabel;
                        return;
                    }
                    selectedValueSpan.textContent = label;
                    return;
                }
                selectedValueSpan.classList.add('ll-dropdown__selected-value');

                const shouldPrepend = Boolean(multiLevelConfig.showTopLevelPrefixInSelection);
                if (!shouldPrepend || !prefixHtml) {
                    if (isPlaceholder && resolvedEmptySelectionLabel) {
                        selectedValueSpan.textContent = resolvedEmptySelectionLabel;
                        return;
                    }
                    selectedValueSpan.textContent = label;
                    return;
                }

                selectedValueSpan.innerHTML = `
                    <span class="selection-icon ll-dropdown__selection-prefix ${escapeHtml(selectedPrefixWrapperClassName)}">${prefixHtml}</span>
                    <span class="truncate">${escapeHtml(label)}</span>
                `;
            };

            const markSelectedLeafClasses = () => {
                const applySelectionClasses = (menuElement) => {
                    if (!menuElement) return;
                    menuElement.querySelectorAll('[data-dropdown-leaf-value]').forEach((itemEl) => {
                        const isSelected = itemEl.dataset.dropdownLeafValue === selectedLeafValue;
                        itemEl.classList.toggle('ll-active', isSelected);
                    });
                    menuElement.querySelectorAll('[data-dropdown-trigger-key]').forEach((triggerEl) => {
                        const triggerKey = triggerEl.dataset.dropdownTriggerKey || '';
                        const isSelectedAncestor = selectedAncestorTriggerKeys.some((selectedKey) => {
                            if (selectedKey === triggerKey) return true;
                            if (!triggerKey) return false;
                            return String(selectedKey).startsWith(`${triggerKey}.`);
                        });
                        triggerEl.classList.toggle('ll-active', isSelectedAncestor);
                    });
                    menuElement.querySelectorAll('[data-dropdown-middle-parent-option="true"]').forEach((rowEl) => {
                        const triggerKey = rowEl.dataset.dropdownMiddleTriggerKey || '';
                        const parentButton = rowEl.querySelector('[data-dropdown-middle-parent-button="true"]');
                        const parentValue = parentButton ? (parentButton.dataset.dropdownLeafValue || '') : '';
                        const isSelectedAncestor = selectedAncestorTriggerKeys.some((selectedKey) => {
                            if (selectedKey === triggerKey) return true;
                            if (!triggerKey) return false;
                            return String(selectedKey).startsWith(`${triggerKey}.`);
                        });
                        const isDirectMiddleSelected = Boolean(parentValue) && selectedLeafValue === parentValue;
                        const isChildSelected = isSelectedAncestor && !isDirectMiddleSelected;
                        rowEl.classList.toggle('ll-active', isChildSelected);
                        if (parentButton) {
                            parentButton.classList.toggle('ll-active', isDirectMiddleSelected);
                        }
                    });
                };

                applySelectionClasses(dropdownMenu);
                openSubmenus.forEach(({ element }) => {
                    applySelectionClasses(element);
                });
            };

            const updateSelection = (label, value, prefixHtml = '', ancestorTriggerKeys = []) => {
                selectedLeafLabel = label;
                selectedLeafValue = value;
                selectedPrefixHtml = prefixHtml || '';
                selectedAncestorTriggerKeys = Array.isArray(ancestorTriggerKeys) ? ancestorTriggerKeys : [];
                renderSelectedValue(selectedLeafLabel, selectedPrefixHtml, false);
                markSelectedLeafClasses();
                if (!suppressOnValueChange && typeof onValueChange === 'function') {
                    onValueChange({
                        label: selectedLeafLabel,
                        value: selectedLeafValue,
                        prefixHtml: selectedPrefixHtml
                    });
                }
            };
            const selectValueDirect = (label, value, prefixHtml = '', ancestorTriggerKeys = []) => {
                updateSelection(label, value, prefixHtml, ancestorTriggerKeys);
            };

            const positionSubmenu = (submenuElement, triggerElement) => {
                if (!submenuElement || !triggerElement || !submenuElement.isConnected) return;
                const viewportPadding = 8;
                constrainMenuHeightToViewport(submenuElement, viewportPadding);
                const triggerRect = triggerElement.getBoundingClientRect();
                const menuRect = submenuElement.getBoundingClientRect();
                const roomRight = (window.innerWidth - viewportPadding) - triggerRect.right;
                const roomLeft = triggerRect.left - viewportPadding;
                const roomBelow = (window.innerHeight - viewportPadding) - triggerRect.top;
                const roomAboveFromBottomAnchor = triggerRect.bottom - viewportPadding;

                let horizontalDirection = 'right';
                if (roomRight < (menuRect.width + submenuLevelGap) && roomLeft >= (menuRect.width + submenuLevelGap)) {
                    horizontalDirection = 'left';
                }

                let verticalAnchor = 'top';
                let top = triggerRect.top;
                if (roomBelow < menuRect.height && roomAboveFromBottomAnchor >= menuRect.height) {
                    verticalAnchor = 'bottom';
                    top = triggerRect.bottom - menuRect.height;
                }

                let left = horizontalDirection === 'right'
                    ? triggerRect.right + submenuLevelGap
                    : triggerRect.left - menuRect.width - submenuLevelGap;

                left = Math.max(viewportPadding, Math.min(left, window.innerWidth - viewportPadding - menuRect.width));
                top = Math.max(viewportPadding, Math.min(top, window.innerHeight - viewportPadding - menuRect.height));

                submenuElement.style.left = `${left + window.scrollX}px`;
                submenuElement.style.top = `${top + window.scrollY}px`;
                submenuElement.dataset.openDirection = horizontalDirection;
                submenuElement.dataset.verticalAnchor = verticalAnchor;
            };

            const animateInSubmenu = (submenuElement) => {
                const openDirection = submenuElement.dataset.openDirection === 'left' ? 'left' : 'right';
                submenuElement.style.opacity = '0';
                submenuElement.style.transform = openDirection === 'right' ? 'translateX(-14px)' : 'translateX(14px)';
                submenuElement.style.willChange = 'transform, opacity';
                submenuElement.style.transition = 'none';
                // Force initial paint state so transition does not get skipped.
                void submenuElement.offsetHeight;
                submenuElement.style.transition = 'opacity 180ms ease, transform 220ms ease';
                requestAnimationFrame(() => {
                    submenuElement.style.opacity = '1';
                    submenuElement.style.transform = 'translateX(0)';
                    window.setTimeout(() => {
                        if (!submenuElement.isConnected) return;
                        submenuElement.style.willChange = '';
                    }, 240);
                });
            };
            const buildDropdownItemLabelHtml = (item) => {
                const labelText = escapeHtml(item && item.label ? item.label : '');
                const labelMeta = String(item && item.labelMeta ? item.labelMeta : '').trim();
                if (!labelMeta) {
                    return `<span class="truncate">${labelText}</span>`;
                }
                return `
                    <span class="ll-dropdown__label-wrap">
                        <span class="truncate">${labelText}</span>
                        <span class="ll-dropdown__label-meta">${escapeHtml(labelMeta)}</span>
                    </span>
                `;
            };

            const buildLeafItem = (item, topLevelPrefixHtml = '', level = 0, ancestorTriggerKeys = []) => {
                const itemButton = document.createElement('button');
                itemButton.type = 'button';
                itemButton.className = `ll-dropdown__item${menuItemClassName ? ` ${menuItemClassName}` : ''}`;
                const iconColorClass = resolveDropdownIconColorClass(item.iconColorClass, 'muted');
                const itemIconHtml = (((level === 0) || showItemIconsAtAllLevels) && item.icon)
                    ? `<span class="material-symbols-outlined ll-dropdown__item-icon ${escapeHtml(iconColorClass)}">${escapeHtml(item.icon)}</span>`
                    : '';
                itemButton.innerHTML = `
                    <span class="ll-dropdown__label-wrap">
                        ${itemIconHtml}
                        ${buildDropdownItemLabelHtml(item)}
                    </span>
                `;
                itemButton.dataset.dropdownLeafValue = item.value || item.label || '';
                itemButton.dataset.dropdownLeafLabel = item.label || '';
                itemButton.dataset.dropdownSelectedLabel = item.selectedLabel || item.selectionLabel || item.label || '';
                if (topLevelPrefixHtml) {
                    itemButton.dataset.dropdownTopPrefixHtml = topLevelPrefixHtml;
                }
                itemButton.dataset.dropdownAncestorTriggerKeys = JSON.stringify(ancestorTriggerKeys);
                itemButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    let parsedAncestorTriggerKeys = [];
                    try {
                        parsedAncestorTriggerKeys = JSON.parse(itemButton.dataset.dropdownAncestorTriggerKeys || '[]');
                    } catch (_error) {
                        parsedAncestorTriggerKeys = [];
                    }
                    updateSelection(
                        itemButton.dataset.dropdownSelectedLabel || itemButton.dataset.dropdownLeafLabel || item.label || '',
                        itemButton.dataset.dropdownLeafValue || item.value || item.label || '',
                        itemButton.dataset.dropdownTopPrefixHtml || '',
                        parsedAncestorTriggerKeys
                    );
                    closeDropdown();
                });
                return itemButton;
            };

            const buildTriggerItem = (item, level, topLevelPrefixHtml, openSubmenuForTrigger, triggerKey, ancestorTriggerKeys = []) => {
                const iconColorClass = resolveDropdownIconColorClass(item.iconColorClass, 'muted');
                const itemIconHtml = (((level === 0) || showItemIconsAtAllLevels) && item.icon)
                    ? `<span class="material-symbols-outlined ll-dropdown__item-icon ${escapeHtml(iconColorClass)}">${escapeHtml(item.icon)}</span>`
                    : '';
                const hasSelectableParentValue = String(item.value || '').trim() !== '';
                const customSubmenuRenderer = typeof item.customSubmenuRenderer === 'function'
                    ? item.customSubmenuRenderer
                    : null;

                if (submenuTriggerMode !== 'arrow') {
                    const triggerButton = document.createElement('button');
                    triggerButton.type = 'button';
                    triggerButton.className = `ll-dropdown__item ll-dropdown__item--submenu-trigger${menuItemClassName ? ` ${menuItemClassName}` : ''}`;
                    triggerButton.dataset.dropdownTriggerKey = triggerKey;
                    triggerButton.innerHTML = `
                        <span class="ll-dropdown__label-wrap">
                            ${itemIconHtml}
                            ${buildDropdownItemLabelHtml(item)}
                        </span>
                        <span class="material-symbols-outlined ll-dropdown__submenu-chevron">chevron_right</span>
                    `;
                    triggerButton.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openSubmenuForTrigger(triggerButton, item.children || [], level + 1, topLevelPrefixHtml, null, customSubmenuRenderer);
                    });
                    return triggerButton;
                }

                const row = document.createElement('div');
                row.className = `ll-dropdown__middle-parent-row${menuItemClassName ? ` ${menuItemClassName}` : ''}`;
                row.dataset.dropdownMiddleParentOption = 'true';
                row.dataset.dropdownMiddleTriggerKey = triggerKey;
                const selectionAncestorKeys = ancestorTriggerKeys.concat(triggerKey);
                if (hasSelectableParentValue) {
                    const parentSelectButton = document.createElement('button');
                    parentSelectButton.type = 'button';
                    parentSelectButton.className = 'll-dropdown__item ll-dropdown__parent-item';
                    parentSelectButton.dataset.dropdownMiddleParentButton = 'true';
                    parentSelectButton.dataset.dropdownLeafValue = item.value || '';
                    parentSelectButton.dataset.dropdownLeafLabel = item.label || '';
                    parentSelectButton.dataset.dropdownSelectedLabel = item.selectedLabel || item.selectionLabel || item.label || '';
                    if (topLevelPrefixHtml) {
                        parentSelectButton.dataset.dropdownTopPrefixHtml = topLevelPrefixHtml;
                    }
                    parentSelectButton.dataset.dropdownAncestorTriggerKeys = JSON.stringify(selectionAncestorKeys);
                    parentSelectButton.innerHTML = `
                        <span class="ll-dropdown__label-wrap">
                            ${itemIconHtml}
                            ${buildDropdownItemLabelHtml(item)}
                        </span>
                    `;
                    parentSelectButton.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        updateSelection(
                            parentSelectButton.dataset.dropdownSelectedLabel || parentSelectButton.dataset.dropdownLeafLabel || item.label || '',
                            parentSelectButton.dataset.dropdownLeafValue || item.value || item.label || '',
                            parentSelectButton.dataset.dropdownTopPrefixHtml || '',
                            selectionAncestorKeys
                        );
                        closeDropdown();
                    });
                    row.appendChild(parentSelectButton);
                } else {
                    const parentLabel = document.createElement('div');
                    parentLabel.className = 'll-dropdown__item ll-dropdown__parent-item';
                    parentLabel.dataset.dropdownMiddleParentLabel = 'true';
                    parentLabel.innerHTML = `
                        <span class="ll-dropdown__label-wrap">
                            ${itemIconHtml}
                            ${buildDropdownItemLabelHtml(item)}
                        </span>
                    `;
                    row.appendChild(parentLabel);
                }

                const divider = document.createElement('div');
                divider.className = 'll-dropdown__divider';
                row.appendChild(divider);

                const triggerButton = document.createElement('button');
                triggerButton.type = 'button';
                triggerButton.className = 'll-dropdown__submenu-icon-trigger';
                triggerButton.dataset.dropdownTriggerKey = triggerKey;
                triggerButton.innerHTML = '<span class="material-symbols-outlined ll-dropdown__submenu-chevron">chevron_right</span>';
                triggerButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openSubmenuForTrigger(triggerButton, item.children || [], level + 1, topLevelPrefixHtml, row, customSubmenuRenderer);
                });
                row.appendChild(triggerButton);
                return row;
            };

            const findLeafByValue = (items, targetValue, topLevelPrefixHtml = '', indexPath = [], ancestorTriggerKeys = []) => {
                for (let index = 0; index < items.length; index += 1) {
                    const item = items[index];
                    const nextIndexPath = indexPath.concat(index);
                    const triggerKey = nextIndexPath.join('.');
                    const iconColorClass = resolveDropdownIconColorClass(item.iconColorClass, 'muted');
                    const iconPrefixHtml = item.icon
                        ? `<span class="material-symbols-outlined ll-dropdown__item-icon--prefix ${escapeHtml(iconColorClass)}">${escapeHtml(item.icon)}</span>`
                        : '';
                    const nextTopLevelPrefixHtml = topLevelPrefixHtml || item.selectionPrefixHtml || iconPrefixHtml || '';
                    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                    const hasCustomSubmenu = typeof item.customSubmenuRenderer === 'function';
                    if (hasChildren || hasCustomSubmenu) {
                        const value = item.value || item.label;
                        if (value === targetValue) {
                            return {
                                label: item.label || '',
                                selectionLabel: item.selectionLabel || item.label || '',
                                selectedLabel: item.selectedLabel || item.selectionLabel || item.label || '',
                                value,
                                topLevelPrefixHtml: nextTopLevelPrefixHtml,
                                // Trigger-backed rows (including custom-submenu rows like
                                // "Specific Date & Time") are highlighted via ancestor keys.
                                ancestorTriggerKeys: ancestorTriggerKeys.concat(triggerKey)
                            };
                        }
                    }
                    if (hasChildren) {
                        const nestedMatch = findLeafByValue(
                            item.children,
                            targetValue,
                            nextTopLevelPrefixHtml,
                            nextIndexPath,
                            ancestorTriggerKeys.concat(triggerKey)
                        );
                        if (nestedMatch) return nestedMatch;
                        continue;
                    }
                    const value = item.value || item.label;
                    if (value === targetValue) {
                        return {
                            label: item.label || '',
                            selectionLabel: item.selectionLabel || item.label || '',
                            selectedLabel: item.selectedLabel || item.selectionLabel || item.label || '',
                            value,
                            topLevelPrefixHtml: nextTopLevelPrefixHtml,
                            ancestorTriggerKeys
                        };
                    }
                }
                return null;
            };

            const renderMenuItems = (container, items, level = 0, inheritedTopLevelPrefixHtml = '', openSubmenuForTrigger = null, indexPath = [], ancestorTriggerKeys = []) => {
                container.innerHTML = '';
                if (enableRootAccordion && level === 0) {
                    const rootTree = document.createElement('ul');
                    rootTree.className = 'text-sm';
                    rootTree.dataset.treeExpandMode = 'accordion';
                    rootTree.dataset.treeAnimate = 'false';
                    rootTree.dataset.treeChildIndentClass = 'ml-[1.875rem]';
                    const accordionIdBase = String(buttonId || 'dropdown').replace(/[^a-zA-Z0-9_-]/g, '-');
                    items.forEach((item, index) => {
                        const li = document.createElement('li');
                        const triggerKey = String(index);
                        const childListId = `${accordionIdBase}-accordion-root-${index}`;
                        const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                        const iconColorClass = resolveDropdownIconColorClass(item.iconColorClass, 'muted');
                        const itemIconHtml = item.icon
                            ? `<span class="material-symbols-outlined ll-dropdown__item-icon ${escapeHtml(iconColorClass)}">${escapeHtml(item.icon)}</span>`
                            : '';

                        if (hasChildren) {
                            const toggleButton = document.createElement('button');
                            toggleButton.type = 'button';
                            toggleButton.dataset.treeLevel = '1';
                            toggleButton.dataset.treeTriggerMode = 'block';
                            toggleButton.dataset.treeToggle = childListId;
                            toggleButton.dataset.dropdownTriggerKey = triggerKey;
                            toggleButton.className = `ll-dropdown__item${menuItemClassName ? ` ${menuItemClassName}` : ''}`;
                            toggleButton.innerHTML = `
                                <span class="ll-dropdown__label-wrap">
                                    <span data-tree-icon class="material-symbols-outlined ll-tree__icon">chevron_right</span>
                                    ${itemIconHtml}
                                    ${buildDropdownItemLabelHtml(item)}
                                </span>
                            `;
                            li.appendChild(toggleButton);

                            const childList = document.createElement('ul');
                            childList.id = childListId;
                            childList.className = 'ml-11 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out hidden';
                            childList.style.maxHeight = '0px';
                            childList.style.opacity = '0';

                            const childContent = document.createElement('div');
                            childContent.className = 'py-1';
                            const rootPrefix = inheritedTopLevelPrefixHtml || item.selectionPrefixHtml || '';
                            renderMenuItems(
                                childContent,
                                item.children || [],
                                1,
                                rootPrefix,
                                openSubmenuForTrigger,
                                [index],
                                [triggerKey]
                            );
                            childList.appendChild(childContent);
                            li.appendChild(childList);
                        } else {
                            const leafButton = buildLeafItem(item, inheritedTopLevelPrefixHtml || item.selectionPrefixHtml || '', 0, []);
                            li.appendChild(leafButton);
                        }
                        rootTree.appendChild(li);
                    });
                    container.appendChild(rootTree);
                    initializeTreeView();
                    rootTree.querySelectorAll('[data-tree-toggle]').forEach((toggleButton) => {
                        toggleButton.addEventListener('click', () => {
                            closeSubmenusFromLevel(1);
                            window.requestAnimationFrame(() => {
                                repositionOpenMenus();
                            });
                        });
                    });
                    rootTree.querySelectorAll('ul[id]').forEach((childList) => {
                        childList.addEventListener('transitionend', (event) => {
                            if (event.propertyName !== 'max-height') return;
                            repositionOpenMenus();
                        });
                    });
                    markSelectedLeafClasses();
                    return;
                }
                items.forEach((item, index) => {
                    const nextIndexPath = indexPath.concat(index);
                    const triggerKey = nextIndexPath.join('.');
                    const iconColorClass = resolveDropdownIconColorClass(item.iconColorClass, 'muted');
                    const iconPrefixHtml = item.icon
                        ? `<span class="material-symbols-outlined ll-dropdown__item-icon--prefix ${escapeHtml(iconColorClass)}">${escapeHtml(item.icon)}</span>`
                        : '';
                    const topLevelPrefixHtml = inheritedTopLevelPrefixHtml || item.selectionPrefixHtml || iconPrefixHtml || '';
                    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                    const hasCustomSubmenu = typeof item.customSubmenuRenderer === 'function';
                    if ((hasChildren || hasCustomSubmenu) && openSubmenuForTrigger) {
                        container.appendChild(buildTriggerItem(item, level, topLevelPrefixHtml, openSubmenuForTrigger, triggerKey, ancestorTriggerKeys));
                        return;
                    }
                    container.appendChild(buildLeafItem(item, topLevelPrefixHtml, level, ancestorTriggerKeys));
                });
            };

            const collectLeafItems = (items, pathParts = [], collected = []) => {
                items.forEach((item) => {
                    const currentPathParts = pathParts.concat(item.label || '');
                    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                    const value = item.value || item.label || '';
                    const selectionLabel = item.selectionLabel || currentPathParts.join('.');
                    const hasSelectableValue = String(value).trim().length > 0;
                    if (hasSelectableValue) {
                        collected.push({
                            label: item.label || '',
                            value,
                            selectionLabel,
                            rootLabel: currentPathParts[0] || '',
                            icon: item.icon || '',
                            iconColorClass: item.iconColorClass || 'accent'
                        });
                    }
                    if (hasChildren) {
                        collectLeafItems(item.children, currentPathParts, collected);
                        return;
                    }
                });
                return collected;
            };
            const normalizeDotNotationSearchValue = (rawValue) => {
                return String(rawValue || '')
                    .trim()
                    .toLowerCase()
                    .replace(/\{\{\s*/g, '')
                    .replace(/\s*\}\}/g, '')
                    .replace(/\s*\.\s*/g, '.')
                    .replace(/\[\s*(\d+)\s*\]/g, '[$1]')
                    .replace(/\s+/g, ' ');
            };

            const openRootDropdown = () => {
                if (dropdownMenu.parentElement !== document.body) {
                    document.body.appendChild(dropdownMenu);
                }
                dropdownMenu.style.marginTop = '0';
                dropdownMenu.classList.remove('hidden');
                dropdownMenu.style.visibility = 'hidden';
                positionDropdown();
                dropdownMenu.style.visibility = '';
                dropdownMenu.classList.remove('hidden');
                dropdownButton.setAttribute('aria-expanded', 'true');
                registerDropdownAsOpen();
                if (searchInput) {
                    window.requestAnimationFrame(() => {
                        searchInput.focus();
                    });
                }
            };

            if (isMultiLevel) {
                if (enableRootAccordion) {
                    dropdownMenu.classList.add('ll-dropdown__menu--root-submenu');
                } else {
                    dropdownMenu.classList.remove('ll-dropdown__menu--root-submenu');
                }
                const clearMultiLevelSelection = () => {
                    selectedLeafLabel = '';
                    selectedLeafValue = '';
                    selectedPrefixHtml = '';
                    selectedAncestorTriggerKeys = [];
                    renderSelectedValue('', '', true);
                    markSelectedLeafClasses();
                };

                const setMultiLevelValue = (value, emitChange = false) => {
                    const normalizedValue = String(value || '');
                    if (!normalizedValue) {
                        clearMultiLevelSelection();
                        return true;
                    }
                    const match = findLeafByValue(multiLevelConfig.items, value);
                    if (!match) return false;
                    suppressOnValueChange = !emitChange;
                    updateSelection(
                        match.selectedLabel || match.selectionLabel || match.label,
                        match.value,
                        match.topLevelPrefixHtml || '',
                        match.ancestorTriggerKeys || []
                    );
                    suppressOnValueChange = false;
                    return true;
                };

                if (enableSearch) {
                    const searchIdBase = String(buttonId || 'dropdown').replace(/[^a-zA-Z0-9_-]/g, '-');
                    const searchInputId = `${searchIdBase}-search-input`;
                    const searchClearId = `${searchIdBase}-search-clear`;
                    const searchShell = document.createElement('div');
                    searchShell.className = 'll-dropdown__search-shell';
                    searchShell.innerHTML = `
                        <div class="ll-input-with-left-icon">
                            <div class="ll-input-with-left-icon__left ll-input-with-left-icon__icon">
                                <span class="material-symbols-outlined">search</span>
                            </div>
                            <input id="${searchInputId}" type="text" placeholder="${escapeHtml(searchPlaceholder)}"
                                class="ll-input ll-input--search ll-input-with-left-icon__input">
                            <button id="${searchClearId}" type="button"
                                class="ll-search-clear-btn hidden"
                                data-tooltip="Clear Search">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    `;
                    const outerWrapper = document.createElement('div');
                    outerWrapper.className = 'flex flex-col h-full overflow-hidden';
                    const contentWrapper = document.createElement('div');
                    contentWrapper.className = 'flex-1 overflow-y-auto';
                    rootItemsContainer = document.createElement('div');
                    rootItemsContainer.className = 'py-2';
                    searchResultsContainer = document.createElement('div');
                    searchResultsContainer.className = 'hidden py-2';
                    dropdownMenu.innerHTML = '';
                    dropdownMenu.classList.remove('overflow-y-auto');
                    dropdownMenu.classList.add('ll-dropdown__menu--searchable');
                    contentWrapper.appendChild(rootItemsContainer);
                    contentWrapper.appendChild(searchResultsContainer);
                    outerWrapper.appendChild(searchShell);
                    outerWrapper.appendChild(contentWrapper);
                    dropdownMenu.appendChild(outerWrapper);
                    searchInput = searchShell.querySelector(`#${searchInputId}`);
                    initializeSearchInput(searchInputId, {
                        clearButtonId: searchClearId,
                        datasetFlag: 'dropdownSearchInputBound',
                        onInput: (rawValue) => {
                            const query = normalizeDotNotationSearchValue(rawValue);
                            closeSubmenusFromLevel(1);
                            if (!query) {
                                rootItemsContainer.classList.remove('hidden');
                                searchResultsContainer.classList.add('hidden');
                                searchResultsContainer.innerHTML = '';
                                repositionOpenMenus();
                                return;
                            }
                            const allLeafItems = collectLeafItems(multiLevelConfig.items || []);
                            const matchedLeafItems = allLeafItems.filter((item) => {
                                const itemLabel = normalizeDotNotationSearchValue(item.label || '');
                                const selectionLabel = normalizeDotNotationSearchValue(item.selectionLabel || '');
                                const rootLabel = normalizeDotNotationSearchValue(item.rootLabel || '');
                                const valuePath = normalizeDotNotationSearchValue(String(item.value || '').replace(/^\$[A-Za-z_$][\w$]*\./, ''));
                                const valuePathWithPrefix = normalizeDotNotationSearchValue(item.value || '');
                                const rootScopedSelection = normalizeDotNotationSearchValue(
                                    (item.rootLabel ? `${item.rootLabel}.` : '') + (item.selectionLabel || item.label || '')
                                );
                                return [
                                    itemLabel,
                                    selectionLabel,
                                    rootLabel,
                                    valuePath,
                                    valuePathWithPrefix,
                                    rootScopedSelection
                                ].some((candidate) => candidate.includes(query));
                            });
                            rootItemsContainer.classList.add('hidden');
                            searchResultsContainer.classList.remove('hidden');
                            searchResultsContainer.innerHTML = '';
                            if (matchedLeafItems.length === 0) {
                                searchResultsContainer.innerHTML = '<div class="ll-dropdown__search-empty">No matching properties</div>';
                                repositionOpenMenus();
                                return;
                            }
                            if (enableRootAccordion) {
                                const groupedByRoot = new Map();
                                matchedLeafItems.forEach((item) => {
                                    const rootLabel = String(item.rootLabel || '').trim() || 'Object';
                                    if (!groupedByRoot.has(rootLabel)) {
                                        groupedByRoot.set(rootLabel, []);
                                    }
                                    groupedByRoot.get(rootLabel).push(item);
                                });

                                const groupedTree = document.createElement('ul');
                                groupedTree.className = 'text-sm';
                                groupedTree.dataset.treeExpandMode = 'tree';
                                groupedTree.dataset.treeAnimate = 'false';
                                groupedTree.dataset.treeChildIndentClass = 'ml-[1.875rem]';
                                const searchTreeBase = `${searchIdBase}-search-group`;
                                let rootIndex = 0;
                                groupedByRoot.forEach((groupItems, rootLabel) => {
                                    const li = document.createElement('li');
                                    const childListId = `${searchTreeBase}-${rootIndex}`;

                                    const toggleButton = document.createElement('button');
                                    toggleButton.type = 'button';
                                    toggleButton.dataset.treeLevel = '1';
                                    toggleButton.dataset.treeTriggerMode = 'block';
                                    toggleButton.dataset.treeToggle = childListId;
                                    toggleButton.dataset.treeInitialExpanded = 'true';
                                    toggleButton.className = `ll-dropdown__item${menuItemClassName ? ` ${menuItemClassName}` : ''}`;
                                    toggleButton.innerHTML = `
                                        <span class="ll-dropdown__label-wrap">
                                            <span data-tree-icon class="material-symbols-outlined ll-tree__icon">chevron_right</span>
                                            <span class="material-symbols-outlined ll-dropdown__item-icon ll-dropdown__icon-color-accent">data_object</span>
                                            <span class="truncate">${escapeHtml(rootLabel)}</span>
                                        </span>
                                    `;
                                    li.appendChild(toggleButton);

                                    const childList = document.createElement('ul');
                                    childList.id = childListId;
                                    childList.className = 'ml-9 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out hidden';
                                    childList.style.maxHeight = '0px';
                                    childList.style.opacity = '0';

                                    groupItems.forEach((item) => {
                                        const resultLi = document.createElement('li');
                                        const resultButton = document.createElement('button');
                                        resultButton.type = 'button';
                                        resultButton.className = `ll-dropdown__item${menuItemClassName ? ` ${menuItemClassName}` : ''}`;
                                        resultButton.dataset.dropdownLeafValue = item.value || '';
                                        resultButton.dataset.dropdownLeafLabel = item.selectionLabel || item.label || '';
                                        resultButton.dataset.dropdownSelectedLabel = item.selectedLabel || item.selectionLabel || item.label || '';
                                        resultButton.dataset.dropdownAncestorTriggerKeys = '[]';
                                        resultButton.innerHTML = `
                                            <span class="ll-dropdown__label-wrap">
                                                <span class="material-symbols-outlined ll-dropdown__item-icon ${escapeHtml(resolveDropdownIconColorClass(item.iconColorClass, 'accent'))}">${escapeHtml(item.icon || 'title')}</span>
                                                <span class="truncate">${escapeHtml(item.selectionLabel || item.label || '')}</span>
                                            </span>
                                        `;
                                        resultButton.addEventListener('click', (event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            updateSelection(
                                                resultButton.dataset.dropdownSelectedLabel || '',
                                                resultButton.dataset.dropdownLeafValue || '',
                                                '',
                                                []
                                            );
                                            closeDropdown();
                                        });
                                        resultLi.appendChild(resultButton);
                                        childList.appendChild(resultLi);
                                    });

                                    li.appendChild(childList);
                                    groupedTree.appendChild(li);
                                    rootIndex += 1;
                                });
                                searchResultsContainer.appendChild(groupedTree);
                                initializeTreeView();
                            } else {
                                matchedLeafItems.forEach((item) => {
                                    const resultButton = document.createElement('button');
                                    resultButton.type = 'button';
                                    resultButton.className = `ll-dropdown__item${menuItemClassName ? ` ${menuItemClassName}` : ''}`;
                                    resultButton.dataset.dropdownLeafValue = item.value || '';
                                    resultButton.dataset.dropdownLeafLabel = item.selectionLabel || item.label || '';
                                    resultButton.dataset.dropdownSelectedLabel = item.selectedLabel || item.selectionLabel || item.label || '';
                                    resultButton.dataset.dropdownAncestorTriggerKeys = '[]';
                                    resultButton.innerHTML = `
                                        <span class="ll-dropdown__label-wrap">
                                            <span class="material-symbols-outlined ll-dropdown__item-icon ${escapeHtml(resolveDropdownIconColorClass(item.iconColorClass, 'accent'))}">${escapeHtml(item.icon || 'title')}</span>
                                            <span class="truncate">${escapeHtml(item.selectionLabel || item.label || '')}</span>
                                        </span>
                                    `;
                                    resultButton.addEventListener('click', (event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        updateSelection(
                                            resultButton.dataset.dropdownSelectedLabel || '',
                                            resultButton.dataset.dropdownLeafValue || '',
                                            '',
                                            []
                                        );
                                        closeDropdown();
                                    });
                                    searchResultsContainer.appendChild(resultButton);
                                });
                            }
                            markSelectedLeafClasses();
                            repositionOpenMenus();
                        }
                    });
                }

                const openSubmenuForTrigger = (triggerButton, children, level, topLevelPrefixHtml = '', positionAnchorElement = null, customSubmenuRenderer = null) => {
                    const existingAtLevel = openSubmenus.find((submenuRecord) => submenuRecord.level === level);
                    const isSameTriggerAlreadyOpen = Boolean(existingAtLevel && existingAtLevel.trigger === triggerButton);
                    closeSubmenusFromLevel(level);
                    if (isSameTriggerAlreadyOpen) {
                        return;
                    }
                    triggerButton.classList.add('ll-dropdown__item--parent-active');
                    const submenu = document.createElement('div');
                    submenu.className = 'll-dropdown__menu right-auto hidden overflow-y-auto';
                    submenu.style.position = 'absolute';
                    submenu.style.right = 'auto';
                    submenu.style.zIndex = '10000';
                    submenu.style.marginTop = '0';
                    submenu.style.width = 'max-content';
                    submenu.style.minWidth = '220px';
                    submenu.style.maxWidth = `${Math.max(220, Math.min(420, window.innerWidth - 16))}px`;

                    const submenuAncestorTriggerKeys = [];
                    const triggerKey = triggerButton.dataset.dropdownTriggerKey || '';
                    const submenuIndexPath = triggerKey ? triggerKey.split('.') : [];
                    if (triggerKey) {
                        submenuAncestorTriggerKeys.push(...triggerKey.split('.').map((_part, index, allParts) => allParts.slice(0, index + 1).join('.')));
                    }
                    if (typeof customSubmenuRenderer === 'function') {
                        customSubmenuRenderer({
                            container: submenu,
                            triggerButton,
                            closeDropdown,
                            closeSubmenusFromLevel,
                            level,
                            triggerKey,
                            topLevelPrefixHtml,
                            selectValue: (label, value, prefixHtml = topLevelPrefixHtml, ancestorKeys = submenuAncestorTriggerKeys) => {
                                selectValueDirect(label, value, prefixHtml, ancestorKeys);
                            }
                        });
                    } else {
                        renderMenuItems(submenu, children, level, topLevelPrefixHtml, openSubmenuForTrigger, submenuIndexPath, submenuAncestorTriggerKeys);
                    }
                    document.body.appendChild(submenu);
                    submenu.classList.remove('hidden');
                    submenu.addEventListener('click', (event) => {
                        event.stopPropagation();
                        const clickedActionableItem = event.target.closest('[data-dropdown-leaf-value], [data-dropdown-trigger-key], [data-value]');
                        if (!clickedActionableItem) {
                            closeSubmenusFromLevel(level + 1);
                        }
                    });
                    const anchorElement = positionAnchorElement || triggerButton;
                    positionSubmenu(submenu, anchorElement);
                    animateInSubmenu(submenu);

                    openSubmenus.push({
                        level,
                        element: submenu,
                        trigger: triggerButton,
                        anchor: anchorElement
                    });
                    markSelectedLeafClasses();
                };

                const menuItemsRoot = rootItemsContainer || dropdownMenu;
                renderMenuItems(menuItemsRoot, multiLevelConfig.items, 0, '', openSubmenuForTrigger);
                const fallbackLeaf = (resolvedDefaultValue
                    ? findLeafByValue(multiLevelConfig.items, resolvedDefaultValue)
                    : null) || (function findFirstLeaf(items, topLevelPrefixHtml = '') {
                    for (let index = 0; index < items.length; index += 1) {
                        const item = items[index];
                        const iconColorClass = resolveDropdownIconColorClass(item.iconColorClass, 'muted');
                        const iconPrefixHtml = item.icon
                            ? `<span class="material-symbols-outlined ll-dropdown__item-icon--prefix ${escapeHtml(iconColorClass)}">${escapeHtml(item.icon)}</span>`
                            : '';
                        const nextPrefix = topLevelPrefixHtml || item.selectionPrefixHtml || iconPrefixHtml || '';
                        if (Array.isArray(item.children) && item.children.length > 0) {
                            const nested = findFirstLeaf(item.children, nextPrefix);
                            if (nested) return nested;
                            continue;
                        }
                        return {
                            label: item.label || '',
                            value: item.value || item.label || '',
                            topLevelPrefixHtml: nextPrefix,
                            ancestorTriggerKeys: []
                        };
                    }
                    return null;
                }(multiLevelConfig.items));

                // Initial dropdown state should not emit change callbacks while controls are still mounting.
                suppressOnValueChange = true;
                if (fallbackLeaf && (resolvedDefaultValue || !allowEmptySelection)) {
                    updateSelection(
                        fallbackLeaf.selectionLabel || fallbackLeaf.label,
                        fallbackLeaf.value,
                        fallbackLeaf.topLevelPrefixHtml || '',
                        fallbackLeaf.ancestorTriggerKeys || []
                    );
                } else if (allowEmptySelection) {
                    clearMultiLevelSelection();
                }
                suppressOnValueChange = false;

                dropdownButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const isClosed = dropdownMenu.classList.contains('hidden');
                    if (isClosed) {
                        closeOtherDropdowns();
                        openRootDropdown();
                        closeSubmenusFromLevel(1);
                        markSelectedLeafClasses();
                    } else {
                        closeDropdown();
                    }
                });

                dropdownMenu.addEventListener('click', (event) => {
                    if (enableRootAccordion && event.target && event.target.closest('[data-tree-toggle]')) {
                        closeSubmenusFromLevel(1);
                        window.requestAnimationFrame(() => {
                            repositionOpenMenus();
                        });
                    }
                    const clickedActionableItem = event.target.closest('[data-dropdown-leaf-value], [data-dropdown-trigger-key], [data-value]');
                    if (!clickedActionableItem) {
                        closeSubmenusFromLevel(1);
                    }
                    event.stopPropagation();
                });

                document.addEventListener('click', (event) => {
                    const clickedInsideSubmenu = openSubmenus.some(({ element }) => element.contains(event.target));
                    if (!dropdownButton.contains(event.target) && !dropdownMenu.contains(event.target) && !clickedInsideSubmenu) {
                        closeDropdown();
                    }
                });

                window.addEventListener('resize', () => {
                    if (dropdownMenu.classList.contains('hidden')) return;
                    repositionOpenMenus();
                });

                dropdownRegistry.set(buttonId, {
                    key: dropdownStackKey,
                    trigger: dropdownButton,
                    close: closeDropdown,
                    isOpen: () => !dropdownMenu.classList.contains('hidden'),
                    getFocusContainers: getOpenMenuContainers
                });
                dropdownButton.__setPortaledDropdownValue = (value, emitChange = false) => setMultiLevelValue(value, emitChange);
                dropdownButton.__getPortaledDropdownValue = () => selectedLeafValue;
                dropdownButton.__clearPortaledDropdownSelection = () => clearMultiLevelSelection();
                dropdownButton.dataset[datasetFlag] = 'true';
                return;
            }

            const openDropdown = () => {
                if (dropdownMenu.parentElement !== document.body) {
                    document.body.appendChild(dropdownMenu);
                }
                dropdownMenu.style.marginTop = '0';
                dropdownMenu.classList.remove('hidden');
                dropdownMenu.style.visibility = 'hidden';
                positionDropdown();
                dropdownMenu.style.visibility = '';
                dropdownMenu.classList.remove('hidden');
                dropdownButton.setAttribute('aria-expanded', 'true');
                registerDropdownAsOpen();
            };

            const resolveSimpleItemLabel = (item) => {
                if (!item) return '';
                const explicitLabel = String(item.dataset.valueLabel || '').trim();
                if (explicitLabel) return explicitLabel;
                const primaryLabelElement = item.querySelector('[data-dropdown-label]');
                if (primaryLabelElement) {
                    return String(primaryLabelElement.textContent || '').trim();
                }
                if (item.classList.contains('ll-dropdown__item--with-description') && item.firstElementChild) {
                    return String(item.firstElementChild.textContent || '').trim();
                }
                return String(item.textContent || '').trim();
            };

            if (hasGroupedOptions) {
                const normalizeGroupedOption = (rawOption) => {
                    if (rawOption && typeof rawOption === 'object' && !Array.isArray(rawOption)) {
                        const optionLabel = String(
                            rawOption.label
                            || rawOption.name
                            || rawOption.title
                            || rawOption.value
                            || ''
                        ).trim();
                        const optionValue = rawOption.value !== undefined && rawOption.value !== null && String(rawOption.value).trim() !== ''
                            ? String(rawOption.value)
                            : optionLabel;
                        return {
                            label: optionLabel,
                            value: optionValue,
                            description: String(rawOption.description || rawOption.hint || '').trim(),
                            active: Boolean(rawOption.active)
                        };
                    }
                    const optionLabel = String(rawOption || '').trim();
                    return {
                        label: optionLabel,
                        value: optionLabel,
                        description: '',
                        active: false
                    };
                };

                const groupedOptionGroups = groupedOptionGroupsInput
                    .map((group) => {
                        if (!group || typeof group !== 'object' || Array.isArray(group)) {
                            return null;
                        }
                        const heading = String(group.heading || group.title || group.label || group.name || '').trim();
                        const rawOptions = Array.isArray(group.options)
                            ? group.options
                            : (Array.isArray(group.items)
                                ? group.items
                                : (Array.isArray(group.children) ? group.children : []));
                        const options = rawOptions
                            .map((rawOption) => normalizeGroupedOption(rawOption))
                            .filter((option) => option && option.label);
                        if (!options.length) return null;
                        return { heading, options };
                    })
                    .filter(Boolean);

                if (groupedOptionGroups.length > 0) {
                    dropdownMenu.innerHTML = '';
                    groupedOptionGroups.forEach((group) => {
                        const groupElement = document.createElement('div');
                        groupElement.className = 'll-dropdown__group';
                        if (group.heading) {
                            const headingElement = document.createElement('div');
                            headingElement.className = 'll-dropdown__group-heading';
                            headingElement.textContent = group.heading;
                            groupElement.appendChild(headingElement);
                        }
                        group.options.forEach((option) => {
                            const optionElement = document.createElement('button');
                            optionElement.type = 'button';
                            const hasDescription = Boolean(option.description);
                            optionElement.className = `ll-dropdown__item${hasDescription ? ' ll-dropdown__item--with-description' : ''}${option.active ? ' ll-active' : ''}`;
                            optionElement.dataset.value = option.value;
                            optionElement.innerHTML = hasDescription
                                ? `<div data-dropdown-label>${escapeHtml(option.label)}</div><div class="ll-dropdown__item-description">${escapeHtml(option.description)}</div>`
                                : `<span data-dropdown-label>${escapeHtml(option.label)}</span>`;
                            groupElement.appendChild(optionElement);
                        });
                        dropdownMenu.appendChild(groupElement);
                    });
                }
            }

            dropdownButton.addEventListener('click', (event) => {
                event.stopPropagation();
                if (dropdownMenu.classList.contains('hidden')) {
                    closeOtherDropdowns();
                    openDropdown();
                } else {
                    closeDropdown();
                }
            });

            dropdownMenu.addEventListener('click', (event) => {
                event.stopPropagation();
                const item = event.target.closest('[data-value]');
                if (!item || !dropdownMenu.contains(item)) return;
                event.preventDefault();
                dropdownMenu.querySelectorAll('[data-value]').forEach((otherItem) => {
                    otherItem.classList.remove('ll-active');
                });
                item.classList.add('ll-active');
                const selectedLabel = resolveSimpleItemLabel(item);
                if (selectedValueSpan) {
                    setSelectedPlaceholderState(false);
                    selectedValueSpan.textContent = selectedLabel;
                }
                if (typeof onValueChange === 'function') {
                    onValueChange({
                        label: selectedLabel,
                        value: item.dataset.value || selectedLabel,
                        prefixHtml: ''
                    });
                }
                closeDropdown();
            });

            document.addEventListener('click', (event) => {
                if (!dropdownButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
                    closeDropdown();
                }
            });
            window.addEventListener('resize', () => {
                if (!dropdownMenu.classList.contains('hidden')) {
                    positionDropdown();
                }
            });
            dropdownRegistry.set(buttonId, {
                key: dropdownStackKey,
                trigger: dropdownButton,
                close: closeDropdown,
                isOpen: () => !dropdownMenu.classList.contains('hidden'),
                getFocusContainers: getOpenMenuContainers
            });
            dropdownButton.__setPortaledDropdownValue = (value, emitChange = false) => {
                const targetValue = String(value || '');
                if (!targetValue) {
                    dropdownMenu.querySelectorAll('[data-value]').forEach((otherItem) => {
                        otherItem.classList.remove('ll-active');
                    });
                    if (selectedValueSpan) {
                        selectedValueSpan.textContent = resolvedEmptySelectionLabel || '';
                        setSelectedPlaceholderState(Boolean(resolvedEmptySelectionLabel));
                    }
                    return true;
                }
                const escapedTargetValue = typeof CSS !== 'undefined' && CSS.escape
                    ? CSS.escape(targetValue)
                    : targetValue.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|/@])/g, '\\$1');
                const targetItem = dropdownMenu.querySelector(`[data-value="${escapedTargetValue}"]`);
                if (!targetItem) return false;
                dropdownMenu.querySelectorAll('[data-value]').forEach((otherItem) => {
                    otherItem.classList.remove('ll-active');
                });
                targetItem.classList.add('ll-active');
                const selectedLabel = resolveSimpleItemLabel(targetItem);
                if (selectedValueSpan) {
                    setSelectedPlaceholderState(false);
                    selectedValueSpan.textContent = selectedLabel;
                }
                if (emitChange && typeof onValueChange === 'function') {
                    onValueChange({
                        label: selectedLabel,
                        value: targetItem.dataset.value || selectedLabel,
                        prefixHtml: ''
                    });
                }
                return true;
            };
            dropdownButton.__getPortaledDropdownValue = () => {
                const activeItem = dropdownMenu.querySelector('[data-value].ll-active');
                return activeItem ? (activeItem.dataset.value || activeItem.textContent.trim()) : '';
            };
            dropdownButton.__clearPortaledDropdownSelection = () => {
                dropdownMenu.querySelectorAll('[data-value]').forEach((otherItem) => {
                    otherItem.classList.remove('ll-active');
                });
                if (selectedValueSpan) {
                    selectedValueSpan.textContent = resolvedEmptySelectionLabel || '';
                    setSelectedPlaceholderState(Boolean(resolvedEmptySelectionLabel));
                }
            };
            const initialActiveItem = dropdownMenu.querySelector('[data-value].ll-active');
            if (resolvedDefaultValue) {
                const didSetDefault = dropdownButton.__setPortaledDropdownValue(resolvedDefaultValue, false);
                if (!didSetDefault) {
                    dropdownButton.__clearPortaledDropdownSelection();
                }
            } else if (initialActiveItem && selectedValueSpan) {
                setSelectedPlaceholderState(false);
                selectedValueSpan.textContent = resolveSimpleItemLabel(initialActiveItem);
            } else if (selectedValueSpan && resolvedEmptySelectionLabel) {
                selectedValueSpan.textContent = resolvedEmptySelectionLabel;
                setSelectedPlaceholderState(true);
            }
            dropdownButton.dataset[datasetFlag] = 'true';
        }

        function initializeScrollableTabs({
            tabsContainerId,
            leftOverlayId,
            rightOverlayId,
            leftButtonId,
            rightButtonId,
            tabButtonSelector = '.scrollable-tab-button'
        }) {
            const tabsContainer = document.getElementById(tabsContainerId);
            const leftOverlay = document.getElementById(leftOverlayId);
            const rightOverlay = document.getElementById(rightOverlayId);
            const leftButton = document.getElementById(leftButtonId);
            const rightButton = document.getElementById(rightButtonId);
            if (!tabsContainer || !leftOverlay || !rightOverlay || !leftButton || !rightButton) return;
            if (tabsContainer.dataset.scrollableTabsBound === 'true') {
                if (typeof tabsContainer.__updateScrollableTabs === 'function') {
                    tabsContainer.__updateScrollableTabs();
                }
                return;
            }

            const activeClasses = ['ll-btn--primary'];
            const inactiveClasses = ['ll-btn--outline-default'];
            const tolerancePx = 5;
            const scrollStepPx = 150;

            const allTabButtons = () => Array.from(tabsContainer.querySelectorAll(tabButtonSelector));

            const setActiveTab = (activeButton) => {
                allTabButtons().forEach((button) => {
                    const isActive = button === activeButton;
                    activeClasses.forEach((className) => button.classList.toggle(className, isActive));
                    inactiveClasses.forEach((className) => button.classList.toggle(className, !isActive));
                    button.classList.toggle('ll-active', isActive);
                });
            };

            const updateScrollButtons = () => {
                const { scrollLeft, scrollWidth, clientWidth } = tabsContainer;
                const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
                const isScrollable = scrollWidth > clientWidth;
                const atLeftEnd = scrollLeft <= tolerancePx;
                const atRightEnd = scrollLeft >= (maxScrollLeft - tolerancePx);

                leftOverlay.classList.toggle('hidden', !isScrollable || atLeftEnd);
                rightOverlay.classList.toggle('hidden', !isScrollable || atRightEnd);
                leftOverlay.style.pointerEvents = (!isScrollable || atLeftEnd) ? 'none' : 'all';
                rightOverlay.style.pointerEvents = (!isScrollable || atRightEnd) ? 'none' : 'all';
            };

            allTabButtons().forEach((button) => {
                button.addEventListener('click', () => {
                    setActiveTab(button);
                    button.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                });
            });
            const initialActiveTab = allTabButtons().find((button) => {
                return activeClasses.some((className) => button.classList.contains(className));
            }) || allTabButtons()[0];
            if (initialActiveTab) {
                setActiveTab(initialActiveTab);
            }

            leftButton.addEventListener('click', () => {
                tabsContainer.scrollBy({ left: -scrollStepPx, behavior: 'smooth' });
            });
            rightButton.addEventListener('click', () => {
                tabsContainer.scrollBy({ left: scrollStepPx, behavior: 'smooth' });
            });
            tabsContainer.addEventListener('scroll', updateScrollButtons);
            window.addEventListener('resize', updateScrollButtons);

            tabsContainer.__updateScrollableTabs = updateScrollButtons;
            tabsContainer.dataset.scrollableTabsBound = 'true';
            updateScrollButtons();
        }

        function initializeTreeView() {
            const toggleButtons = document.querySelectorAll('[data-tree-toggle]');
            const applyTreeTriggerStructure = (button) => {
                if (!button || button.dataset.treeStructureApplied === 'true') return;
                const triggerMode = button.dataset.treeTriggerMode === 'arrow' ? 'arrow' : 'block';
                const icon = button.querySelector('[data-tree-icon]');
                if (!icon) {
                    button.dataset.treeStructureApplied = 'true';
                    return;
                }

                icon.classList.add('ll-tree__icon');

                if (triggerMode === 'block') {
                    const existingIconWrapper = icon.parentElement;
                    const alreadyWrapped = existingIconWrapper && existingIconWrapper.dataset.treeIconWrapper === 'true';
                    if (!alreadyWrapped) {
                        const iconWrapper = document.createElement('div');
                        iconWrapper.className = 'flex items-center w-6 h-6 mr-1.5';
                        iconWrapper.dataset.treeIconWrapper = 'true';
                        icon.replaceWith(iconWrapper);
                        iconWrapper.appendChild(icon);
                    }
                } else {
                    button.classList.remove('w-5', 'h-5');
                    button.classList.add('w-6', 'h-6');
                    const wrapperRow = button.parentElement;
                    if (wrapperRow) {
                        wrapperRow.classList.remove('px-2', 'py-1');
                    }
                }

                button.dataset.treeStructureApplied = 'true';
            };
            const applyTreeTriggerSpacing = (button, target) => {
                if (!button || !target) return;
                target.classList.remove('mt-1', 'space-y-1');
                const triggerMode = button.dataset.treeTriggerMode;
                const hasBlockVariantClass = target.classList.contains('ll-tree__children--block');
                const hasArrowVariantClass = target.classList.contains('ll-tree__children--arrow');
                const rootList = button.closest('[data-tree-child-indent-class]');
                const customBlockChildIndentClass = rootList && rootList.dataset
                    ? String(rootList.dataset.treeChildIndentClass || '').trim()
                    : '';
                const blockChildIndentClass = customBlockChildIndentClass || 'ml-9';
                if (triggerMode === 'block') {
                    if (!hasBlockVariantClass && !hasArrowVariantClass) {
                        target.classList.remove('ml-6', 'ml-11', 'ml-9', 'ml-[1.875rem]');
                        target.classList.add(blockChildIndentClass);
                    }
                    target.querySelectorAll('li').forEach((item) => {
                        const hasChildList = Array.from(item.children).some((child) => child.tagName === 'UL');
                        item.classList.toggle('pl-4', !hasChildList);
                    });
                    return;
                }
                if (triggerMode === 'arrow') {
                    if (!hasBlockVariantClass && !hasArrowVariantClass) {
                        target.classList.remove('ml-6', 'ml-9');
                        target.classList.add('ml-11');
                    }
                }
            };
            const getTreeRootElement = (button, toggleTargetIdSet) => {
                let currentList = button.closest('ul');
                let candidateRoot = currentList;
                while (currentList) {
                    if (currentList.id && toggleTargetIdSet.has(currentList.id)) {
                        break;
                    }
                    candidateRoot = currentList;
                    const parentListItem = currentList.parentElement ? currentList.parentElement.closest('li') : null;
                    currentList = parentListItem ? parentListItem.closest('ul') : null;
                }
                return candidateRoot || document.body;
            };
            const getTreeExpandMode = (button, rootElement) => {
                const explicit = (button.dataset.treeExpandMode || '').trim().toLowerCase();
                if (explicit === 'accordion' || explicit === 'tree') return explicit;
                const rootMode = rootElement && rootElement.dataset
                    ? String(rootElement.dataset.treeExpandMode || '').trim().toLowerCase()
                    : '';
                if (rootMode === 'accordion' || rootMode === 'tree') return rootMode;
                return 'tree';
            };
            const getTreeAnimationEnabled = (button, rootElement) => {
                const explicit = String(button.dataset.treeAnimate || '').trim().toLowerCase();
                if (explicit === 'false' || explicit === '0' || explicit === 'off') return false;
                if (explicit === 'true' || explicit === '1' || explicit === 'on') return true;
                const rootValue = rootElement && rootElement.dataset
                    ? String(rootElement.dataset.treeAnimate || '').trim().toLowerCase()
                    : '';
                if (rootValue === 'false' || rootValue === '0' || rootValue === 'off') return false;
                return true;
            };
            const treeEntries = [];
            const toggleTargetIdSet = new Set(Array.from(toggleButtons).map((button) => button.dataset.treeToggle).filter(Boolean));

            toggleButtons.forEach((button) => {
                applyTreeTriggerStructure(button);
                const targetId = button.dataset.treeToggle;
                const target = targetId ? document.getElementById(targetId) : null;
                if (!target) return;
                applyTreeTriggerSpacing(button, target);
                const rootElement = getTreeRootElement(button, toggleTargetIdSet);
                if (rootElement && rootElement.classList) {
                    rootElement.classList.remove('space-y-1');
                }
                const expandMode = getTreeExpandMode(button, rootElement);
                const animationEnabled = getTreeAnimationEnabled(button, rootElement);
                if (button.dataset.treeBound === 'true') return;

                const treeLevel = Number(button.dataset.treeLevel || '2');
                const icon = button.querySelector('[data-tree-icon]');
                const entry = { button, target, treeLevel, rootElement, expandMode, animationEnabled };
                const setExpanded = (isExpanded, animated = false) => {
                    const currentlyExpanded = button.getAttribute('aria-expanded') === 'true';
                    if (currentlyExpanded === isExpanded && !animated) return;
                    if (!isExpanded && !currentlyExpanded && target.classList.contains('hidden')) return;

                    if (entry.collapseFinalizeTimer) {
                        clearTimeout(entry.collapseFinalizeTimer);
                        entry.collapseFinalizeTimer = null;
                    }
                    button.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
                    if (icon) {
                        icon.textContent = isExpanded ? 'expand_more' : 'chevron_right';
                    }

                    if (isExpanded) {
                        target.classList.remove('hidden');
                        if (!animated) {
                            target.style.maxHeight = 'none';
                            target.style.opacity = '1';
                            return;
                        }
                        const expandedHeight = target.scrollHeight;
                        target.style.maxHeight = '0px';
                        target.style.opacity = '0';
                        requestAnimationFrame(() => {
                            target.style.maxHeight = `${expandedHeight}px`;
                            target.style.opacity = '1';
                        });
                        return;
                    }

                    if (!animated) {
                        target.style.maxHeight = '0px';
                        target.style.opacity = '0';
                        target.classList.add('hidden');
                        return;
                    }

                    target.classList.remove('hidden');
                    target.style.maxHeight = `${target.scrollHeight}px`;
                    target.style.opacity = '1';
                    requestAnimationFrame(() => {
                        target.style.maxHeight = '0px';
                        target.style.opacity = '0';
                    });
                    // Fallback: transitionend can occasionally be skipped when collapsing
                    // programmatically; ensure hidden state is finalized.
                    entry.collapseFinalizeTimer = setTimeout(() => {
                        if (button.getAttribute('aria-expanded') !== 'true') {
                            target.classList.add('hidden');
                        }
                    }, 340);
                };
                entry.setExpanded = setExpanded;

                target.addEventListener('transitionend', (event) => {
                    if (event.propertyName !== 'max-height') return;
                    const isExpanded = button.getAttribute('aria-expanded') === 'true';
                    if (!isExpanded) {
                        target.classList.add('hidden');
                        if (entry.collapseFinalizeTimer) {
                            clearTimeout(entry.collapseFinalizeTimer);
                            entry.collapseFinalizeTimer = null;
                        }
                        return;
                    }
                    target.style.maxHeight = 'none';
                    target.style.opacity = '1';
                });

                button.addEventListener('click', () => {
                    const isExpanded = button.getAttribute('aria-expanded') === 'true';
                    const shouldExpand = !isExpanded;
                    const shouldAnimate = entry.animationEnabled;
                    if (shouldExpand && entry.expandMode === 'accordion') {
                        treeEntries.forEach((otherEntry) => {
                            if (otherEntry === entry) return;
                            if (otherEntry.rootElement !== entry.rootElement) return;
                            if (otherEntry.button.getAttribute('aria-expanded') !== 'true') return;
                            otherEntry.setExpanded(false, shouldAnimate);
                        });
                    }
                    setExpanded(shouldExpand, shouldAnimate);
                });

                button.dataset.treeBound = 'true';
                treeEntries.push(entry);
            });

            const rootToLevelOneEntries = new Map();
            treeEntries.forEach((entry) => {
                const rootElement = entry.rootElement || getTreeRootElement(entry.button, toggleTargetIdSet);
                if (!rootToLevelOneEntries.has(rootElement)) {
                    rootToLevelOneEntries.set(rootElement, []);
                }
                if (entry.treeLevel === 1) {
                    rootToLevelOneEntries.get(rootElement).push(entry);
                }
            });

            treeEntries.forEach((entry) => {
                const explicitInitial = entry.button.dataset.treeInitialExpanded;
                if (explicitInitial === 'true' || explicitInitial === 'false') {
                    entry.setExpanded(explicitInitial === 'true', false);
                    return;
                }

                if (entry.treeLevel > 1) {
                    entry.setExpanded(false, false);
                    return;
                }

                const rootElement = entry.rootElement || getTreeRootElement(entry.button, toggleTargetIdSet);
                const levelOneEntries = rootToLevelOneEntries.get(rootElement) || [];
                const firstLevelOneEntry = levelOneEntries[0];
                entry.setExpanded(entry === firstLevelOneEntry, false);
            });
            refreshExpandedTreeViewHeights(document);
        }

        function refreshExpandedTreeViewHeights(scopeElement = document) {
            const scope = scopeElement || document;
            if (!scope || typeof scope.querySelectorAll !== 'function') return;
            scope.querySelectorAll('[data-tree-toggle]').forEach((button) => {
                if (button.getAttribute('aria-expanded') !== 'true') return;
                const targetId = button.dataset.treeToggle;
                if (!targetId) return;
                const target = document.getElementById(targetId);
                if (!target) return;
                target.classList.remove('hidden');
                target.style.maxHeight = 'none';
                target.style.opacity = '1';
            });
        }

        function renderDragDropCardList({
            container,
            stateOwner,
            itemsKey,
            instanceId,
            listHeadingLabel = 'Items',
            itemHeadingLabel = 'Item',
            addButtonLabel = 'Add Item',
            createItem = () => ({ id: `item-${Date.now()}` }),
            renderHeadingRight = null,
            renderItemContent = null,
            allowEmptyItems = false,
            onRebuild = null
        }) {
            if (!container || !stateOwner || !itemsKey || !instanceId || typeof renderItemContent !== 'function') return;
            if (!Array.isArray(stateOwner[itemsKey])) {
                stateOwner[itemsKey] = allowEmptyItems ? [] : [createItem()];
            } else if (!allowEmptyItems && stateOwner[itemsKey].length === 0) {
                stateOwner[itemsKey] = [createItem()];
            }
            const items = stateOwner[itemsKey];
            const headerSlotId = `${instanceId}-list-heading-right-slot`;
            const cardsListId = `${instanceId}-cards-list`;
            const addButtonId = `${instanceId}-add-card-item`;

            container.innerHTML = `
                <div class="ll-dragdrop-card-list">
                    <div class="ll-form-control__label-row">
                        <label class="ll-form-control__label">${escapeHtml(listHeadingLabel)}</label>
                        <div id="${headerSlotId}"></div>
                    </div>
                    <div id="${cardsListId}" class="ll-dragdrop-card-list__cards"></div>
                    <button id="${addButtonId}" type="button"
                        class="ll-btn ll-btn--outline-default">
                        <span class="material-symbols-outlined ll-btn__icon">add</span>
                        <span>${escapeHtml(addButtonLabel)}</span>
                    </button>
                </div>
            `;

            const cardsList = document.getElementById(cardsListId);
            if (!cardsList) return;
            let draggedItemId = null;
            let draggedCardBlock = null;
            let dragPlaceholder = null;
            let dragGhostElement = null;
            let dragPointerOffsetX = 0;
            let dragPointerOffsetY = 0;
            let lastHoveredItemId = null;

            const moveItemToIndexByKey = (targetStateOwner, targetItemsKey, movedItemId, targetIndex) => {
                if (!targetStateOwner || !Array.isArray(targetStateOwner[targetItemsKey])) return;
                const fromIndex = targetStateOwner[targetItemsKey].findIndex((entry) => entry.id === movedItemId);
                if (fromIndex < 0) return;
                const boundedTargetIndex = Math.max(0, Math.min(targetIndex, targetStateOwner[targetItemsKey].length - 1));
                if (fromIndex === boundedTargetIndex) return;
                const [moved] = targetStateOwner[targetItemsKey].splice(fromIndex, 1);
                targetStateOwner[targetItemsKey].splice(boundedTargetIndex, 0, moved);
            };

            const rebuild = () => {
                if (typeof onRebuild === 'function') {
                    onRebuild();
                    return;
                }
                renderDragDropCardList({
                    container,
                    stateOwner,
                    itemsKey,
                    instanceId,
                    listHeadingLabel,
                    itemHeadingLabel,
                    addButtonLabel,
                    createItem,
                    renderHeadingRight,
                    renderItemContent,
                    allowEmptyItems,
                    onRebuild
                });
            };

            const ensureDragPlaceholder = (sourceBlock) => {
                if (dragPlaceholder) return dragPlaceholder;
                const sourceRect = sourceBlock ? sourceBlock.getBoundingClientRect() : { height: 72 };
                dragPlaceholder = sourceBlock ? sourceBlock.cloneNode(true) : document.createElement('div');
                dragPlaceholder.classList.add('node-config-condition-placeholder');
                dragPlaceholder.querySelectorAll('[id]').forEach((elementWithId) => {
                    elementWithId.removeAttribute('id');
                });
                dragPlaceholder.style.height = `${Math.max(56, Math.round(sourceRect.height || 72))}px`;
                dragPlaceholder.style.position = 'relative';
                dragPlaceholder.style.overflow = 'hidden';
                dragPlaceholder.style.pointerEvents = 'none';
                dragPlaceholder.style.userSelect = 'none';
                dragPlaceholder.style.transform = '';
                dragPlaceholder.style.transition = 'transform 170ms ease, opacity 170ms ease';
                dragPlaceholder.setAttribute('aria-hidden', 'true');
                const overlay = document.createElement('div');
                overlay.style.position = 'absolute';
                overlay.style.top = '0';
                overlay.style.right = '0';
                overlay.style.bottom = '0';
                overlay.style.left = '0';
                overlay.style.background = 'rgba(59, 130, 246, 0.24)';
                overlay.style.pointerEvents = 'none';
                overlay.style.margin = '0';
                dragPlaceholder.appendChild(overlay);
                return dragPlaceholder;
            };

            const clearDragPlaceholder = () => {
                if (!dragPlaceholder) return;
                dragPlaceholder.remove();
                dragPlaceholder = null;
            };

            const finalizeCardDrag = () => {
                if (draggedCardBlock) {
                    draggedCardBlock.style.display = '';
                    draggedCardBlock.classList.remove('opacity-60');
                }
                if (dragGhostElement) {
                    dragGhostElement.remove();
                    dragGhostElement = null;
                }
                clearDragPlaceholder();
                draggedItemId = null;
                draggedCardBlock = null;
                lastHoveredItemId = null;
            };

            const nextCardSibling = (element) => {
                if (!element) return null;
                let sibling = element.nextElementSibling;
                while (sibling) {
                    if (sibling.dataset && sibling.dataset.cardItemId) return sibling;
                    sibling = sibling.nextElementSibling;
                }
                return null;
            };

            const getCardBlocksExcludingDragged = () => {
                return Array.from(cardsList.querySelectorAll('[data-card-item-id]'))
                    .filter((cardBlock) => cardBlock.dataset.cardItemId !== draggedItemId);
            };

            const getCurrentPlaceholderSlot = () => {
                if (!dragPlaceholder) return -1;
                const children = Array.from(cardsList.children);
                let slot = 0;
                for (let index = 0; index < children.length; index += 1) {
                    const child = children[index];
                    if (child === dragPlaceholder) return slot;
                    if (child.dataset && child.dataset.cardItemId && child.dataset.cardItemId !== draggedItemId) {
                        slot += 1;
                    }
                }
                return slot;
            };

            const getHoveredCardBlockByPointerY = (pointerClientY) => {
                const cardBlocks = getCardBlocksExcludingDragged();
                for (let index = 0; index < cardBlocks.length; index += 1) {
                    const rect = cardBlocks[index].getBoundingClientRect();
                    if (pointerClientY >= rect.top && pointerClientY <= rect.bottom) {
                        return cardBlocks[index];
                    }
                }
                return null;
            };

            const getCardSlot = (targetCardBlock) => {
                if (!targetCardBlock) return -1;
                const cardBlocks = getCardBlocksExcludingDragged();
                return cardBlocks.findIndex((cardBlock) => cardBlock === targetCardBlock);
            };

            const getCardBlockById = (itemId) => {
                if (!itemId) return null;
                const cardBlocks = getCardBlocksExcludingDragged();
                return cardBlocks.find((cardBlock) => cardBlock.dataset.cardItemId === itemId) || null;
            };

            const animateCrossedCardBlock = (cardBlock, deltaY) => {
                if (!cardBlock) return;
                cardBlock.style.transition = 'none';
                cardBlock.style.transform = `translateY(${deltaY}px)`;
                requestAnimationFrame(() => {
                    cardBlock.style.transition = 'transform 170ms ease';
                    cardBlock.style.transform = '';
                });
                cardBlock.addEventListener('transitionend', () => {
                    cardBlock.style.transition = '';
                    cardBlock.style.transform = '';
                }, { once: true });
            };

            const getDropTargetIndex = () => {
                if (!dragPlaceholder) return -1;
                const children = Array.from(cardsList.children);
                let index = 0;
                for (let i = 0; i < children.length; i += 1) {
                    const child = children[i];
                    if (child === dragPlaceholder) return index;
                    if (child.dataset && child.dataset.cardItemId && child.dataset.cardItemId !== draggedItemId) {
                        index += 1;
                    }
                }
                return index;
            };

            const updateDragGhostPosition = (clientX, clientY) => {
                if (!dragGhostElement) return;
                dragGhostElement.style.left = `${clientX - dragPointerOffsetX}px`;
                dragGhostElement.style.top = `${clientY - dragPointerOffsetY}px`;
            };

            const startPointerDrag = (startEvent, itemId, cardBlock, totalCount) => {
                if (totalCount <= 1) return;
                startEvent.preventDefault();
                draggedItemId = itemId;
                draggedCardBlock = cardBlock;
                const blockRect = cardBlock.getBoundingClientRect();
                dragPointerOffsetX = Math.max(0, Math.min(blockRect.width - 1, startEvent.clientX - blockRect.left));
                dragPointerOffsetY = Math.max(0, Math.min(blockRect.height - 1, startEvent.clientY - blockRect.top));

                const placeholder = ensureDragPlaceholder(cardBlock);
                cardsList.insertBefore(placeholder, cardBlock);
                cardBlock.style.display = 'none';
                cardBlock.classList.add('opacity-60');

                dragGhostElement = cardBlock.cloneNode(true);
                dragGhostElement.style.position = 'fixed';
                dragGhostElement.style.left = `${blockRect.left}px`;
                dragGhostElement.style.top = `${blockRect.top}px`;
                dragGhostElement.style.width = `${Math.ceil(blockRect.width)}px`;
                dragGhostElement.style.display = 'block';
                dragGhostElement.style.pointerEvents = 'none';
                dragGhostElement.style.zIndex = '120';
                dragGhostElement.style.opacity = '0.95';
                dragGhostElement.style.boxShadow = '0 14px 28px rgba(0, 0, 0, 0.42)';
                document.body.appendChild(dragGhostElement);
                updateDragGhostPosition(startEvent.clientX, startEvent.clientY);

                const onPointerMove = (moveEvent) => {
                    updateDragGhostPosition(moveEvent.clientX, moveEvent.clientY);
                    const hoveredBlock = getHoveredCardBlockByPointerY(moveEvent.clientY);
                    if (hoveredBlock) {
                        const hoveredItemId = hoveredBlock.dataset.cardItemId;
                        if (hoveredItemId !== lastHoveredItemId) {
                            const currentSlot = getCurrentPlaceholderSlot();
                            const hoveredSlot = getCardSlot(hoveredBlock);
                            const placeholderHeight = Math.max(56, Math.round(draggedCardBlock.getBoundingClientRect().height || 72));
                            const existingPlaceholder = ensureDragPlaceholder(draggedCardBlock);

                            if (hoveredSlot >= 0 && currentSlot >= 0 && hoveredSlot >= currentSlot) {
                                const afterHoveredBlock = nextCardSibling(hoveredBlock);
                                if (afterHoveredBlock) {
                                    cardsList.insertBefore(existingPlaceholder, afterHoveredBlock);
                                } else {
                                    cardsList.appendChild(existingPlaceholder);
                                }
                                animateCrossedCardBlock(hoveredBlock, placeholderHeight);
                            } else if (hoveredSlot >= 0 && currentSlot >= 0 && hoveredSlot < currentSlot) {
                                cardsList.insertBefore(existingPlaceholder, hoveredBlock);
                                animateCrossedCardBlock(hoveredBlock, -placeholderHeight);
                            }
                            lastHoveredItemId = hoveredItemId;
                        }
                    } else if (lastHoveredItemId) {
                        const previousHoveredBlock = getCardBlockById(lastHoveredItemId);
                        if (!previousHoveredBlock) {
                            lastHoveredItemId = null;
                        } else {
                            const rect = previousHoveredBlock.getBoundingClientRect();
                            const rearmPadding = 6;
                            const stillNearPrevious =
                                moveEvent.clientY >= (rect.top - rearmPadding) &&
                                moveEvent.clientY <= (rect.bottom + rearmPadding);
                            if (!stillNearPrevious) {
                                lastHoveredItemId = null;
                            }
                        }
                    }
                };

                const onPointerUp = () => {
                    window.removeEventListener('mousemove', onPointerMove);
                    window.removeEventListener('mouseup', onPointerUp);
                    const targetIndex = getDropTargetIndex();
                    if (targetIndex >= 0 && draggedItemId) {
                        moveItemToIndexByKey(stateOwner, itemsKey, draggedItemId, targetIndex);
                        rebuild();
                        finalizeCardDrag();
                        return;
                    }
                    finalizeCardDrag();
                };

                window.addEventListener('mousemove', onPointerMove);
                window.addEventListener('mouseup', onPointerUp);
            };

            items.forEach((item, index) => {
                const itemId = item && item.id ? item.id : `${instanceId}-item-${index}`;
                const showDragAction = items.length > 1;
                const showDeleteAction = items.length > 1 || allowEmptyItems;
                const cardBlock = document.createElement('div');
                cardBlock.className = 'll-card ll-dragdrop-card-list__card';
                cardBlock.dataset.cardItemId = itemId;
                cardBlock.draggable = false;
                cardBlock.innerHTML = `
                    <div class="ll-dragdrop-card-list__card-header">
                        <span class="ll-dragdrop-card-list__card-heading node-config-card-heading">${escapeHtml(itemHeadingLabel)} ${index + 1}</span>
                        ${(showDragAction || showDeleteAction) ? `
                            <div class="ll-dragdrop-card-list__card-actions">
                                ${showDragAction ? `
                                    <button type="button"
                                        class="ll-icon-btn node-config-card-drag"
                                        data-drag-card-item-id="${escapeHtml(itemId)}">
                                        <span class="material-symbols-outlined ll-icon-btn__icon">drag_indicator</span>
                                    </button>
                                ` : ''}
                                ${showDeleteAction ? `
                                    <button type="button"
                                        class="ll-icon-btn node-config-card-delete"
                                        data-delete-card-item-id="${escapeHtml(itemId)}">
                                        <span class="material-symbols-outlined ll-icon-btn__icon">delete</span>
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <div data-card-item-body="true"></div>
                `;
                cardsList.appendChild(cardBlock);
                const bodyContainer = cardBlock.querySelector('[data-card-item-body="true"]');
                if (bodyContainer) {
                    renderItemContent({
                        item,
                        itemId,
                        index,
                        totalCount: items.length,
                        cardElement: cardBlock,
                        bodyContainer,
                        rebuild
                    });
                }
            });

            const headingRightSlot = document.getElementById(headerSlotId);
            if (headingRightSlot && typeof renderHeadingRight === 'function') {
                renderHeadingRight({ slotElement: headingRightSlot, items, rebuild });
            }

            cardsList.querySelectorAll('.node-config-card-delete').forEach((button) => {
                button.addEventListener('click', () => {
                    const targetItemId = button.dataset.deleteCardItemId;
                    stateOwner[itemsKey] = stateOwner[itemsKey].filter((item) => item.id !== targetItemId);
                    if (!allowEmptyItems && stateOwner[itemsKey].length === 0) {
                        stateOwner[itemsKey] = [createItem()];
                    }
                    rebuild();
                });
            });

            cardsList.querySelectorAll('.node-config-card-drag').forEach((dragHandleButton) => {
                dragHandleButton.addEventListener('mousedown', (event) => {
                    if (event.button !== 0) return;
                    const cardId = dragHandleButton.dataset.dragCardItemId;
                    if (!cardId) return;
                    const cardBlock = dragHandleButton.closest('[data-card-item-id]');
                    if (!cardBlock) return;
                    startPointerDrag(event, cardId, cardBlock, items.length);
                });
            });

            const addButton = document.getElementById(addButtonId);
            if (addButton) {
                addButton.addEventListener('click', () => {
                    stateOwner[itemsKey].push(createItem());
                    rebuild();
                });
            }
        }

        function hideCustomTooltip() {
            if (!activeCustomTooltip || !activeCustomTooltip.element) return;
            if (activeCustomTooltip.repositionTimeoutId) {
                clearTimeout(activeCustomTooltip.repositionTimeoutId);
            }
            if (activeCustomTooltip.triggerMonitorIntervalId) {
                clearInterval(activeCustomTooltip.triggerMonitorIntervalId);
            }
            activeCustomTooltip.element.classList.remove('ll-tooltip--visible');
            activeCustomTooltip.element.remove();
            activeCustomTooltip = null;
        }

        function showCustomTooltip(targetElement, options = {}) {
            hideCustomTooltip();
            if (!targetElement) return;

            const {
                contentHtml = '',
                position = 'top',
                offset = 8,
                maxWidthPx = null,
                trigger = 'hover'
            } = options;

            const tooltip = document.createElement('div');
            tooltip.className = 'll-tooltip';
            tooltip.innerHTML = contentHtml;
            if (trigger === 'click') {
                tooltip.classList.add('ll-tooltip--interactive', 'll-tooltip--with-close');
                const closeButton = document.createElement('button');
                closeButton.type = 'button';
                closeButton.className = 'll-icon-btn ll-icon-btn--sm ll-tooltip__close';
                closeButton.setAttribute('aria-label', 'Close tooltip');
                closeButton.innerHTML = '<span class="material-symbols-outlined ll-icon-btn__icon">close</span>';
                closeButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    hideCustomTooltip();
                });
                tooltip.appendChild(closeButton);
            }
            const fallbackMaxWidthPx = 280;
            const hasCustomMaxWidth = maxWidthPx !== null && maxWidthPx !== undefined && Number.isFinite(Number(maxWidthPx));
            const resolvedMaxWidthPx = hasCustomMaxWidth
                ? Math.max(120, Number(maxWidthPx))
                : fallbackMaxWidthPx;
            tooltip.style.maxWidth = `${resolvedMaxWidthPx}px`;

            const arrow = document.createElement('div');
            arrow.className = 'll-tooltip__arrow';
            tooltip.appendChild(arrow);
            document.body.appendChild(tooltip);
            const positionTooltip = () => {
                if (!tooltip.isConnected) return;
                if (!targetElement || !targetElement.isConnected || targetElement.getClientRects().length === 0) {
                    tooltip.remove();
                    return;
                }
                const targetRect = targetElement.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                const viewportPadding = 8;
                const arrowVisualHalf = 6;
                const availableLeft = targetRect.left - viewportPadding;
                const availableRight = (window.innerWidth - viewportPadding) - targetRect.right;
                const availableTop = targetRect.top - viewportPadding;
                const availableBottom = (window.innerHeight - viewportPadding) - targetRect.bottom;
                const neededHorizontal = tooltipRect.width + offset + arrowVisualHalf;
                const neededVertical = tooltipRect.height + offset + arrowVisualHalf;
                let effectivePosition = position;
                let left = 0;
                let top = 0;

                arrow.style.top = '';
                arrow.style.right = '';
                arrow.style.bottom = '';
                arrow.style.left = '';

                if (effectivePosition === 'left' && availableLeft < neededHorizontal && availableRight >= neededHorizontal) {
                    effectivePosition = 'right';
                } else if (effectivePosition === 'right' && availableRight < neededHorizontal && availableLeft >= neededHorizontal) {
                    effectivePosition = 'left';
                } else if (effectivePosition === 'top' && availableTop < neededVertical && availableBottom >= neededVertical) {
                    effectivePosition = 'bottom';
                } else if (effectivePosition === 'bottom' && availableBottom < neededVertical && availableTop >= neededVertical) {
                    effectivePosition = 'top';
                }

                if (effectivePosition === 'bottom') {
                    left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                    top = targetRect.bottom + offset + arrowVisualHalf;
                    arrow.style.top = '-6px';
                    arrow.style.left = '50%';
                    arrow.style.transform = 'translateX(-50%) rotate(45deg)';
                } else if (effectivePosition === 'left') {
                    left = targetRect.left - tooltipRect.width - offset - arrowVisualHalf;
                    top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                    arrow.style.right = '-6px';
                    arrow.style.top = '50%';
                    arrow.style.transform = 'translateY(-50%) rotate(135deg)';
                } else if (effectivePosition === 'right') {
                    left = targetRect.right + offset + arrowVisualHalf;
                    top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                    arrow.style.left = '-6px';
                    arrow.style.top = '50%';
                    arrow.style.transform = 'translateY(-50%) rotate(-45deg)';
                } else {
                    left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                    top = targetRect.top - tooltipRect.height - offset - arrowVisualHalf;
                    arrow.style.bottom = '-6px';
                    arrow.style.left = '50%';
                    arrow.style.transform = 'translateX(-50%) rotate(225deg)';
                }

                if (left < viewportPadding) left = viewportPadding;
                if (left + tooltipRect.width > window.innerWidth - viewportPadding) {
                    left = window.innerWidth - viewportPadding - tooltipRect.width;
                }
                if (top < viewportPadding) top = viewportPadding;
                if (top + tooltipRect.height > window.innerHeight - viewportPadding) {
                    top = window.innerHeight - viewportPadding - tooltipRect.height;
                }

                if (effectivePosition === 'top' || effectivePosition === 'bottom') {
                    const targetCenterX = targetRect.left + (targetRect.width / 2);
                    const arrowLeft = Math.max(12, Math.min(tooltipRect.width - 12, targetCenterX - left));
                    arrow.style.left = `${arrowLeft}px`;
                    arrow.style.transform = 'translateX(-50%) rotate(45deg)';
                    if (effectivePosition === 'top') {
                        arrow.style.transform = 'translateX(-50%) rotate(225deg)';
                    }
                } else {
                    const targetCenterY = targetRect.top + (targetRect.height / 2);
                    const arrowTop = Math.max(12, Math.min(tooltipRect.height - 12, targetCenterY - top));
                    arrow.style.top = `${arrowTop}px`;
                    if (effectivePosition === 'left') {
                        arrow.style.transform = 'translateY(-50%) rotate(135deg)';
                    } else {
                        arrow.style.transform = 'translateY(-50%) rotate(-45deg)';
                    }
                }

                tooltip.style.left = `${left + window.scrollX}px`;
                tooltip.style.top = `${top + window.scrollY}px`;
            };

            positionTooltip();
            requestAnimationFrame(() => tooltip.classList.add('ll-tooltip--visible'));
            requestAnimationFrame(positionTooltip);
            const repositionTimeoutId = window.setTimeout(positionTooltip, 80);
            const triggerMonitorIntervalId = window.setInterval(() => {
                if (!activeCustomTooltip || activeCustomTooltip.element !== tooltip) {
                    clearInterval(triggerMonitorIntervalId);
                    return;
                }
                const activeTrigger = activeCustomTooltip.trigger;
                if (!activeTrigger || !activeTrigger.isConnected || activeTrigger.getClientRects().length === 0) {
                    if (activeCustomTooltip.triggerMode !== 'click') {
                        hideCustomTooltip();
                    }
                }
            }, 120);
            activeCustomTooltip = {
                element: tooltip,
                trigger: targetElement,
                triggerMode: trigger === 'click' ? 'click' : 'hover',
                repositionTimeoutId,
                triggerMonitorIntervalId
            };
        }

        function initializeClickTriggeredTooltipGlobalDismiss() {
            if (document.body.dataset.clickTooltipDismissBound === 'true') return;
            const dismissHandler = (event) => {
                if (!activeCustomTooltip || activeCustomTooltip.triggerMode !== 'click') return;
                const tooltipElement = activeCustomTooltip.element;
                const triggerElement = activeCustomTooltip.trigger;
                const clickedInsideTooltip = Boolean(tooltipElement && tooltipElement.contains(event.target));
                const clickedInsideTrigger = Boolean(triggerElement && triggerElement.isConnected && triggerElement.contains(event.target));
                if (!clickedInsideTooltip && !clickedInsideTrigger) {
                    hideCustomTooltip();
                }
            };
            document.addEventListener('mousedown', dismissHandler, true);
            document.body.dataset.clickTooltipDismissBound = 'true';
        }

        function bindCustomTooltip(targetElement, options = {}) {
            if (!targetElement || targetElement.dataset.customTooltipBound === 'true') return;
            const triggerMode = options && options.trigger === 'click' ? 'click' : 'hover';

            if (triggerMode === 'click') {
                initializeClickTriggeredTooltipGlobalDismiss();
                targetElement.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const isSameOpenTooltip = Boolean(
                        activeCustomTooltip &&
                        activeCustomTooltip.trigger === targetElement &&
                        activeCustomTooltip.triggerMode === 'click'
                    );
                    if (isSameOpenTooltip) {
                        hideCustomTooltip();
                        return;
                    }
                    showCustomTooltip(targetElement, { ...options, trigger: 'click' });
                });
            } else {
                let suppressShowWhilePressed = false;
                const show = () => {
                    if (suppressShowWhilePressed) return;
                    showCustomTooltip(targetElement, { ...options, trigger: 'hover' });
                };

                targetElement.addEventListener('mousedown', () => {
                    suppressShowWhilePressed = true;
                    hideCustomTooltip();
                });
                targetElement.addEventListener('mouseup', () => {
                    requestAnimationFrame(() => {
                        suppressShowWhilePressed = false;
                    });
                });
                targetElement.addEventListener('mouseleave', () => {
                    suppressShowWhilePressed = false;
                });

                targetElement.addEventListener('mouseenter', show);
                targetElement.addEventListener('focus', show);
                targetElement.addEventListener('mouseleave', hideCustomTooltip);
                targetElement.addEventListener('blur', hideCustomTooltip);
            }
            targetElement.dataset.customTooltipBound = 'true';
        }

        function resolveLoadingButton(buttonOrId) {
            const buttonCandidate = typeof buttonOrId === 'string'
                ? document.getElementById(buttonOrId)
                : buttonOrId;
            if (!buttonCandidate) return null;
            if (buttonCandidate instanceof HTMLButtonElement) return buttonCandidate;
            if (buttonCandidate instanceof HTMLElement) {
                return buttonCandidate.closest('button');
            }
            return null;
        }

        function setButtonLoadingState(buttonOrId) {
            const button = resolveLoadingButton(buttonOrId);
            if (!button) return null;

            button.disabled = true;
            button.classList.add('ll-loading');

            let spinner = button.querySelector('.ll-btn__spinner--temporary');
            if (!spinner) {
                spinner = document.createElement('span');
                spinner.className = 'll-spinner ll-btn__spinner ll-btn__spinner--temporary';
                spinner.setAttribute('aria-hidden', 'true');
                const icon = button.querySelector('.ll-btn__icon');
                if (icon && icon.parentElement) {
                    icon.parentElement.insertBefore(spinner, icon);
                } else {
                    button.insertBefore(spinner, button.firstChild);
                }
            }
            return spinner;
        }

        function clearButtonLoadingState(buttonOrId) {
            const button = resolveLoadingButton(buttonOrId);
            if (!button) return;

            button.querySelectorAll('.ll-btn__spinner--temporary').forEach((spinner) => spinner.remove());
            button.classList.remove('ll-loading');
            button.disabled = false;
        }

        function dismissAlert(alertOrSelector) {
            const alertElement = typeof alertOrSelector === 'string'
                ? document.querySelector(alertOrSelector)
                : alertOrSelector;
            if (!(alertElement instanceof HTMLElement)) return false;

            alertElement.classList.add('hidden');
            alertElement.setAttribute('aria-hidden', 'true');
            alertElement.dispatchEvent(new CustomEvent('ll-alert-dismissed', {
                bubbles: true,
                detail: { alert: alertElement }
            }));
            return true;
        }

        function initializeDismissibleAlerts(root = document) {
            const scope = (root instanceof Document || root instanceof HTMLElement) ? root : document;
            scope.querySelectorAll('[data-ll-alert-dismiss]').forEach((closeButton) => {
                if (closeButton.dataset.llAlertDismissBound === 'true') return;

                closeButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    const targetSelector = closeButton.dataset.llAlertDismissTarget;
                    const alertElement = targetSelector
                        ? document.querySelector(targetSelector)
                        : closeButton.closest('.ll-alert');
                    dismissAlert(alertElement);
                });

                closeButton.dataset.llAlertDismissBound = 'true';
            });
        }

        const toastManagerState = {
            containers: new Map(),
            toasts: new Map(),
            focusBindingAttached: false,
            idCounter: 0
        };

        const toastPositionClassMap = {
            'top-left': 'll-toast-container--top-left',
            'top-center': 'll-toast-container--top-center',
            'top-right': 'll-toast-container--top-right',
            'bottom-left': 'll-toast-container--bottom-left',
            'bottom-center': 'll-toast-container--bottom-center',
            'bottom-right': 'll-toast-container--bottom-right'
        };

        const toastStateMap = {
            loading: { alertVariant: 'info', icon: 'spinner' },
            info: { alertVariant: 'info', icon: 'info' },
            positive: { alertVariant: 'positive', icon: 'check_circle' },
            warning: { alertVariant: 'warning', icon: 'warning' },
            negative: { alertVariant: 'negative', icon: 'error' }
        };

        function normalizeToastPosition(rawPosition) {
            const normalizedPosition = String(rawPosition || '').trim().toLowerCase();
            if (toastPositionClassMap[normalizedPosition]) return normalizedPosition;
            return 'bottom-left';
        }

        function normalizeToastState(rawState) {
            const normalizedState = String(rawState || '').trim().toLowerCase();
            if (toastStateMap[normalizedState]) return normalizedState;
            return 'info';
        }

        function getToastAnimationDirection(position) {
            if (position.endsWith('-left')) return 'left';
            if (position.endsWith('-right')) return 'right';
            if (position.startsWith('bottom-')) return 'bottom';
            return 'top';
        }

        function getToastEnterAnimationDirection(position) {
            if (position.startsWith('bottom-')) return 'bottom';
            return 'top';
        }

        function getOrCreateToastContainer(position) {
            const normalizedPosition = normalizeToastPosition(position);
            const existingContainer = toastManagerState.containers.get(normalizedPosition);
            if (existingContainer && existingContainer.isConnected) {
                return existingContainer;
            }

            const container = document.createElement('div');
            container.className = `ll-toast-container ${toastPositionClassMap[normalizedPosition]}`;
            container.dataset.llToastContainer = normalizedPosition;
            document.body.appendChild(container);
            toastManagerState.containers.set(normalizedPosition, container);
            return container;
        }

        function ensureToastFocusPauseHandlers() {
            if (toastManagerState.focusBindingAttached) return;
            const pauseAllToastTimers = () => {
                toastManagerState.toasts.forEach((toastController) => {
                    if (!toastController || typeof toastController.pause !== 'function') return;
                    toastController.pause();
                });
            };
            const resumeAllToastTimers = () => {
                toastManagerState.toasts.forEach((toastController) => {
                    if (!toastController || typeof toastController.resume !== 'function') return;
                    toastController.resume();
                });
            };
            window.addEventListener('blur', pauseAllToastTimers);
            window.addEventListener('focus', resumeAllToastTimers);
            toastManagerState.focusBindingAttached = true;
        }

        function removeToastContainerIfEmpty(position) {
            const normalizedPosition = normalizeToastPosition(position);
            const container = toastManagerState.containers.get(normalizedPosition);
            if (!container) return;
            if (container.childElementCount > 0) return;
            if (container.parentElement) {
                container.parentElement.removeChild(container);
            }
            toastManagerState.containers.delete(normalizedPosition);
        }

        const toastStackGapPx = 8;

        function getToastItemWrappers(container) {
            if (!(container instanceof HTMLElement)) return [];
            return Array.from(container.children).filter((child) => {
                return child instanceof HTMLElement && child.classList.contains('ll-toast-item');
            });
        }

        function syncToastItemMargins(container) {
            const items = getToastItemWrappers(container);
            items.forEach((item, index) => {
                item.style.marginTop = index === 0 ? '0px' : `${toastStackGapPx}px`;
            });
        }

        function parseCssTimeToMs(rawTimeValue) {
            const trimmed = String(rawTimeValue || '').trim();
            if (!trimmed) return 0;
            if (trimmed.endsWith('ms')) {
                const parsedMs = Number(trimmed.slice(0, -2));
                return Number.isFinite(parsedMs) ? parsedMs : 0;
            }
            if (trimmed.endsWith('s')) {
                const parsedS = Number(trimmed.slice(0, -1));
                return Number.isFinite(parsedS) ? parsedS * 1000 : 0;
            }
            const parsed = Number(trimmed);
            return Number.isFinite(parsed) ? parsed : 0;
        }

        function getMaxCssTotalTimeMs(durationValuesString, delayValuesString) {
            const durations = String(durationValuesString || '')
                .split(',')
                .map((entry) => parseCssTimeToMs(entry))
                .filter((value) => value >= 0);
            const delays = String(delayValuesString || '')
                .split(',')
                .map((entry) => parseCssTimeToMs(entry))
                .filter((value) => value >= 0);
            const durationCount = durations.length || 1;
            const delayCount = delays.length || 1;
            const pairCount = Math.max(durationCount, delayCount);
            let maxTotal = 0;
            for (let index = 0; index < pairCount; index += 1) {
                const durationMs = durations.length > 0
                    ? durations[Math.min(index, durations.length - 1)]
                    : 0;
                const delayMs = delays.length > 0
                    ? delays[Math.min(index, delays.length - 1)]
                    : 0;
                maxTotal = Math.max(maxTotal, durationMs + delayMs);
            }
            return maxTotal;
        }

        function createToast(options = {}) {
            ensureToastFocusPauseHandlers();
            const normalizedState = normalizeToastState(options.state);
            const stateConfig = toastStateMap[normalizedState];
            const position = normalizeToastPosition(options.position);
            const durationCandidate = Number(options.duration);
            const duration = Number.isFinite(durationCandidate) && durationCandidate >= 0 ? durationCandidate : 5000;
            const persistent = options.persistent === true;
            const dismissible = options.dismissible !== false;
            const title = String(options.title || '').trim();
            const message = String(options.message || options.body || '').trim();
            const toastId = options.id || `ll-toast-${++toastManagerState.idCounter}`;
            const enterAnimationDirection = getToastEnterAnimationDirection(position);
            const exitAnimationDirection = getToastAnimationDirection(position);
            const container = getOrCreateToastContainer(position);
            const hadExistingItems = getToastItemWrappers(container).length > 0;

            const toastElement = document.createElement('div');
            toastElement.className = `ll-alert ll-alert--${stateConfig.alertVariant} ll-alert--dismissible ll-toast ll-toast--enter-${enterAnimationDirection}`;
            toastElement.setAttribute('role', normalizedState === 'negative' || normalizedState === 'warning' ? 'alert' : 'status');
            toastElement.setAttribute('aria-live', normalizedState === 'loading' ? 'polite' : 'assertive');
            toastElement.dataset.llToastId = toastId;
            toastElement.dataset.llToastState = normalizedState;

            const iconMarkup = stateConfig.icon === 'spinner'
                ? '<span class="ll-spinner ll-spinner--sm ll-alert__icon ll-toast__spinner" aria-hidden="true"></span>'
                : `<span class="material-symbols-outlined ll-alert__icon">${escapeHtml(stateConfig.icon)}</span>`;

            const contentMarkup = title
                ? `<div class="ll-alert__content"><span class="ll-alert__title">${escapeHtml(title)}</span>${escapeHtml(message)}</div>`
                : `<div class="ll-alert__content">${escapeHtml(message)}</div>`;

            const closeButtonMarkup = dismissible
                ? '<button type="button" class="ll-icon-btn ll-icon-btn--sm ll-alert__close" aria-label="Dismiss toast"><span class="material-symbols-outlined ll-icon-btn__icon">close</span></button>'
                : '';

            const toastItem = document.createElement('div');
            toastItem.className = 'll-toast-item';
            toastElement.innerHTML = `${iconMarkup}${contentMarkup}${closeButtonMarkup}`;
            toastItem.appendChild(toastElement);
            container.appendChild(toastItem);

            const targetHeight = toastElement.offsetHeight;
            toastItem.style.height = '0px';
            toastItem.style.opacity = '0';
            toastItem.style.marginTop = '0px';
            void toastItem.offsetHeight;
            window.requestAnimationFrame(() => {
                toastItem.style.height = `${targetHeight}px`;
                toastItem.style.opacity = '1';
                if (hadExistingItems) {
                    toastItem.style.marginTop = `${toastStackGapPx}px`;
                }
            });
            const handleEnterTransitionEnd = (event) => {
                if (event.propertyName !== 'height') return;
                toastItem.style.height = 'auto';
                toastItem.removeEventListener('transitionend', handleEnterTransitionEnd);
            };
            toastItem.addEventListener('transitionend', handleEnterTransitionEnd);

            let timerId = null;
            let timerStartedAt = 0;
            let remainingMs = duration;
            let isHovered = false;
            let destroyed = false;

            const clearTimer = () => {
                if (timerId) {
                    window.clearTimeout(timerId);
                    timerId = null;
                }
                timerStartedAt = 0;
            };

            const pauseTimer = () => {
                if (persistent || normalizedState === 'loading') return;
                if (!timerId) return;
                const elapsed = Date.now() - timerStartedAt;
                remainingMs = Math.max(0, remainingMs - elapsed);
                clearTimer();
            };

            const startTimer = () => {
                if (persistent || normalizedState === 'loading') return;
                if (remainingMs <= 0) {
                    controller.close('duration');
                    return;
                }
                clearTimer();
                timerStartedAt = Date.now();
                timerId = window.setTimeout(() => {
                    controller.close('duration');
                }, remainingMs);
            };

            const handleMouseEnter = () => {
                isHovered = true;
                pauseTimer();
            };

            const handleMouseLeave = () => {
                isHovered = false;
                startTimer();
            };

            toastElement.addEventListener('mouseenter', handleMouseEnter);
            toastElement.addEventListener('mouseleave', handleMouseLeave);

            const closeButton = toastElement.querySelector('.ll-alert__close');
            const handleDismissClick = (event) => {
                event.preventDefault();
                controller.close('dismiss');
            };
            if (closeButton) {
                closeButton.addEventListener('click', handleDismissClick);
            }

            const controller = {
                id: toastId,
                element: toastElement,
                state: normalizedState,
                position,
                close: (reason = 'programmatic') => {
                    if (destroyed) return Promise.resolve(false);
                    destroyed = true;
                    clearTimer();
                    const wrapper = toastItem;
                    const measuredHeight = wrapper.offsetHeight;
                    wrapper.style.height = `${measuredHeight}px`;
                    wrapper.style.opacity = '1';
                    void wrapper.offsetHeight;
                    toastElement.classList.remove(`ll-toast--enter-${enterAnimationDirection}`);
                    toastElement.classList.add(`ll-toast--exit-${exitAnimationDirection}`);
                    if (!wrapper.previousElementSibling) {
                        const nextToastItem = wrapper.nextElementSibling;
                        if (nextToastItem instanceof HTMLElement && nextToastItem.classList.contains('ll-toast-item')) {
                            nextToastItem.style.marginTop = '0px';
                        }
                    }
                    requestAnimationFrame(() => {
                        wrapper.classList.add('ll-toast-item--collapsing');
                    });

                    return new Promise((resolve) => {
                        let finalized = false;
                        let fallbackTimerId = null;
                        const finalizeClose = () => {
                            if (finalized) return;
                            finalized = true;
                            wrapper.removeEventListener('transitionend', onWrapperTransitionEnd);
                            toastElement.removeEventListener('animationend', onToastAnimationEnd);
                            if (fallbackTimerId) {
                                window.clearTimeout(fallbackTimerId);
                            }
                            toastElement.removeEventListener('mouseenter', handleMouseEnter);
                            toastElement.removeEventListener('mouseleave', handleMouseLeave);
                            if (closeButton) {
                                closeButton.removeEventListener('click', handleDismissClick);
                            }
                            if (toastItem.parentElement) {
                                toastItem.parentElement.removeChild(toastItem);
                            }
                            toastManagerState.toasts.delete(toastId);
                            syncToastItemMargins(container);
                            removeToastContainerIfEmpty(position);
                            toastElement.dispatchEvent(new CustomEvent('ll-toast-dismissed', {
                                bubbles: true,
                                detail: { id: toastId, reason, toast: toastElement }
                            }));
                            resolve(true);
                        };

                        const onWrapperTransitionEnd = (event) => {
                            if (event.target !== wrapper) return;
                            if (event.propertyName !== 'height') return;
                            didFinishWrapperTransition = true;
                            maybeFinalizeClose();
                        };
                        const onToastAnimationEnd = (event) => {
                            if (event.target !== toastElement) return;
                            if (!String(event.animationName || '').startsWith('ll-toast-exit-')) return;
                            didFinishToastExitAnimation = true;
                            maybeFinalizeClose();
                        };

                        const wrapperStyles = window.getComputedStyle(wrapper);
                        const toastStyles = window.getComputedStyle(toastElement);
                        const maxWrapperDuration = getMaxCssTotalTimeMs(
                            wrapperStyles.transitionDuration,
                            wrapperStyles.transitionDelay
                        );
                        const maxToastAnimationDuration = getMaxCssTotalTimeMs(
                            toastStyles.animationDuration,
                            toastStyles.animationDelay
                        );
                        const synchronizedCollapseDurationMs = Math.max(maxWrapperDuration, maxToastAnimationDuration, 180);
                        wrapper.style.transitionDuration = `${synchronizedCollapseDurationMs}ms`;
                        wrapper.style.transitionDelay = '0ms';
                        const shouldWaitForWrapperTransition = maxWrapperDuration > 0;
                        const shouldWaitForToastExitAnimation = maxToastAnimationDuration > 0;
                        let didFinishWrapperTransition = !shouldWaitForWrapperTransition;
                        let didFinishToastExitAnimation = !shouldWaitForToastExitAnimation;
                        const maybeFinalizeClose = () => {
                            if (!didFinishWrapperTransition) return;
                            if (!didFinishToastExitAnimation) return;
                            finalizeClose();
                        };

                        if (shouldWaitForWrapperTransition) {
                            wrapper.addEventListener('transitionend', onWrapperTransitionEnd);
                        }
                        if (shouldWaitForToastExitAnimation) {
                            toastElement.addEventListener('animationend', onToastAnimationEnd);
                        }

                        maybeFinalizeClose();
                        const fallbackDelayMs = Math.max(maxWrapperDuration, maxToastAnimationDuration, 180) + 60;
                        fallbackTimerId = window.setTimeout(() => {
                            finalizeClose();
                        }, fallbackDelayMs);
                    });
                },
                pause: () => {
                    pauseTimer();
                },
                resume: () => {
                    if (isHovered) return;
                    startTimer();
                }
            };

            toastManagerState.toasts.set(toastId, controller);
            if (!persistent && normalizedState !== 'loading') {
                startTimer();
            }

            return controller;
        }

        function dismissToast(toastOrId) {
            if (!toastOrId) return Promise.resolve(false);
            if (typeof toastOrId === 'string') {
                const foundToast = toastManagerState.toasts.get(toastOrId);
                if (!foundToast) return Promise.resolve(false);
                return foundToast.close('programmatic');
            }
            if (toastOrId && typeof toastOrId.close === 'function') {
                return toastOrId.close('programmatic');
            }
            if (toastOrId instanceof HTMLElement) {
                const toastId = toastOrId.dataset.llToastId;
                if (toastId && toastManagerState.toasts.has(toastId)) {
                    return toastManagerState.toasts.get(toastId).close('programmatic');
                }
            }
            return Promise.resolve(false);
        }

        function createPromiseToast(promiseOrFactory, options = {}) {
            const promise = typeof promiseOrFactory === 'function'
                ? Promise.resolve().then(() => promiseOrFactory())
                : Promise.resolve(promiseOrFactory);
            const position = normalizeToastPosition(options.position);
            const loadingConfig = options.loading && typeof options.loading === 'object'
                ? options.loading
                : {};
            const successConfigOption = options.success;
            const errorConfigOption = options.error;
            const loadingToast = createToast({
                state: 'loading',
                position,
                persistent: true,
                dismissible: true,
                title: 'Loading',
                message: 'Please wait...',
                ...loadingConfig
            });

            return promise
                .then((result) => {
                    loadingToast.close('promise-resolved');
                    let successConfig = successConfigOption;
                    if (typeof successConfigOption === 'function') {
                        successConfig = successConfigOption(result);
                    }
                    if (successConfig !== false) {
                        createToast({
                            state: 'positive',
                            position,
                            title: 'Success',
                            message: 'Request completed successfully.',
                            ...(successConfig || {})
                        });
                    }
                    return result;
                })
                .catch((error) => {
                    loadingToast.close('promise-rejected');
                    let errorConfig = errorConfigOption;
                    if (typeof errorConfigOption === 'function') {
                        errorConfig = errorConfigOption(error);
                    }
                    if (errorConfig !== false) {
                        createToast({
                            state: 'negative',
                            position,
                            title: 'Failed',
                            message: 'Something went wrong.',
                            ...(errorConfig || {})
                        });
                    }
                    throw error;
                });
        }

        const modalManagerState = {
            stack: [],
            dropdownStack: [],
            keyboardBindingAttached: false,
            idCounter: 0
        };

        const focusableSelector = [
            'a[href]',
            'area[href]',
            'button:not([disabled])',
            'input:not([disabled]):not([type="hidden"])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'iframe',
            'object',
            'embed',
            '[contenteditable="true"]',
            '[tabindex]:not([tabindex="-1"])'
        ].join(', ');

        function normalizeModalMode(mode) {
            if (mode === 'persistent' || mode === 'seamless') return mode;
            return 'normal';
        }

        function normalizeModalPosition(position) {
            if (position === 'left' || position === 'right' || position === 'bottom' || position === 'center') {
                return position;
            }
            return 'top';
        }

        function resolveModalContent(content, controller) {
            return typeof content === 'function'
                ? content(controller)
                : content;
        }

        function appendModalContent(target, content) {
            if (!target) return;
            if (content === null || content === undefined || content === false) return;
            if (content instanceof windowScope.Node) {
                target.appendChild(content);
                return;
            }
            if (Array.isArray(content)) {
                content.forEach((item) => appendModalContent(target, item));
                return;
            }
            target.insertAdjacentHTML('beforeend', String(content));
        }

        function renderModalSlot(target, content, controller) {
            if (!target) return;
            target.innerHTML = '';
            appendModalContent(target, resolveModalContent(content, controller));
        }

        function renderModalHeaderActions(target, content, controller) {
            if (!target) return;
            target.innerHTML = '';
            const resolvedContent = resolveModalContent(content, controller);
            const actionItems = Array.isArray(resolvedContent) ? resolvedContent : [resolvedContent];
            actionItems.forEach((actionItem) => {
                if (actionItem === null || actionItem === undefined || actionItem === false) return;
                const actionWrapper = document.createElement('div');
                actionWrapper.className = 'll-modal__header-action';
                const actionContent = document.createElement('div');
                actionContent.className = 'll-modal__header-action-content';
                appendModalContent(actionContent, actionItem);
                if (!actionContent.hasChildNodes()) return;
                actionWrapper.appendChild(actionContent);
                target.appendChild(actionWrapper);
            });
        }

        function removeModalFromStack(controller) {
            const index = modalManagerState.stack.indexOf(controller);
            if (index >= 0) {
                modalManagerState.stack.splice(index, 1);
            }
            modalManagerState.stack.forEach((activeController, stackIndex) => {
                if (!activeController || !activeController.root) return;
                activeController.root.style.zIndex = String(120 + (stackIndex * 2));
            });
        }

        function pushModalToStack(controller) {
            removeModalFromStack(controller);
            modalManagerState.stack.push(controller);
            modalManagerState.stack.forEach((activeController, stackIndex) => {
                if (!activeController || !activeController.root) return;
                activeController.root.style.zIndex = String(120 + (stackIndex * 2));
            });
        }

        function removeDropdownFromStack(dropdownKey) {
            const normalizedKey = String(dropdownKey || '').trim();
            if (!normalizedKey) return;
            const index = modalManagerState.dropdownStack.findIndex((entry) => entry && entry.key === normalizedKey);
            if (index >= 0) {
                modalManagerState.dropdownStack.splice(index, 1);
            }
        }

        function pushDropdownToStack(dropdownEntry) {
            if (!dropdownEntry || !dropdownEntry.key) return;
            removeDropdownFromStack(dropdownEntry.key);
            modalManagerState.dropdownStack.push(dropdownEntry);
        }

        function getTopOpenDropdown() {
            for (let index = modalManagerState.dropdownStack.length - 1; index >= 0; index -= 1) {
                const entry = modalManagerState.dropdownStack[index];
                if (!entry || typeof entry.close !== 'function') continue;
                if (typeof entry.isOpen === 'function' && entry.isOpen() !== true) {
                    modalManagerState.dropdownStack.splice(index, 1);
                    continue;
                }
                return entry;
            }
            return null;
        }

        function getTopOpenModal() {
            for (let index = modalManagerState.stack.length - 1; index >= 0; index -= 1) {
                const entry = modalManagerState.stack[index];
                if (!entry || typeof entry.isOpen !== 'function') continue;
                if (entry.isOpen() !== true) continue;
                return entry;
            }
            return null;
        }

        function isFocusableElement(element) {
            if (!(element instanceof windowScope.HTMLElement)) return false;
            if (element.matches(':disabled')) return false;
            if (element.getAttribute('aria-hidden') === 'true') return false;
            if (element.closest('[hidden], [aria-hidden="true"], [inert]')) return false;
            const style = windowScope.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            return element.getClientRects().length > 0;
        }

        function getFocusTrapContainersForModal(modalController) {
            if (!modalController || !modalController.root) return [];
            const containers = [];
            if (modalController.content) {
                containers.push(modalController.content);
            } else {
                containers.push(modalController.root);
            }

            modalManagerState.dropdownStack.forEach((entry, stackIndex) => {
                if (!entry || typeof entry.isOpen !== 'function' || entry.isOpen() !== true) return;
                const triggerElement = entry.trigger;
                if (!(triggerElement instanceof windowScope.HTMLElement)) return;
                if (!modalController.root.contains(triggerElement)) return;
                if (stackIndex === -1) return;
                if (typeof entry.getFocusContainers === 'function') {
                    const dropdownContainers = entry.getFocusContainers();
                    if (Array.isArray(dropdownContainers)) {
                        dropdownContainers.forEach((container) => {
                            if (container) containers.push(container);
                        });
                    }
                    return;
                }
                if (entry.menu) {
                    containers.push(entry.menu);
                }
            });

            const uniqueContainers = [];
            const seenContainers = new Set();
            containers.forEach((container) => {
                if (!(container instanceof windowScope.HTMLElement)) return;
                if (seenContainers.has(container)) return;
                seenContainers.add(container);
                uniqueContainers.push(container);
            });
            return uniqueContainers;
        }

        function getFocusableElements(containers) {
            const focusableElements = [];
            const seenElements = new Set();
            containers.forEach((container) => {
                if (!(container instanceof windowScope.HTMLElement)) return;
                container.querySelectorAll(focusableSelector).forEach((element) => {
                    if (!isFocusableElement(element)) return;
                    if (seenElements.has(element)) return;
                    seenElements.add(element);
                    focusableElements.push(element);
                });
            });
            return focusableElements;
        }

        function trapModalTabFocus(event) {
            const topModal = getTopOpenModal();
            if (!topModal) return;
            if (topModal.options && topModal.options.mode === 'seamless') return;
            const containers = getFocusTrapContainersForModal(topModal);
            if (containers.length === 0) return;

            const focusableElements = getFocusableElements(containers);
            if (focusableElements.length === 0) {
                const fallbackElement = topModal.content || topModal.root;
                if (fallbackElement && typeof fallbackElement.focus === 'function') {
                    event.preventDefault();
                    fallbackElement.focus();
                }
                return;
            }

            event.preventDefault();
            const activeElement = document.activeElement;
            const activeIndex = focusableElements.indexOf(activeElement);
            const isShiftTab = Boolean(event.shiftKey);
            if (activeIndex === -1) {
                const target = isShiftTab ? focusableElements[focusableElements.length - 1] : focusableElements[0];
                target.focus();
                return;
            }
            const nextIndex = isShiftTab
                ? (activeIndex - 1 + focusableElements.length) % focusableElements.length
                : (activeIndex + 1) % focusableElements.length;
            focusableElements[nextIndex].focus();
        }

        function focusFirstElementInModal(modalController) {
            if (!modalController || !modalController.root) return;
            const autofocusCandidates = [];
            if (modalController.body) {
                autofocusCandidates.push(...modalController.body.querySelectorAll('[autofocus]'));
            }
            autofocusCandidates.push(...modalController.root.querySelectorAll('[autofocus]'));
            const seenAutofocusCandidates = new Set();
            const autofocusTarget = autofocusCandidates.find((candidate) => {
                if (!(candidate instanceof windowScope.HTMLElement)) return false;
                if (seenAutofocusCandidates.has(candidate)) return false;
                seenAutofocusCandidates.add(candidate);
                return typeof candidate.focus === 'function' && isFocusableElement(candidate);
            });
            if (autofocusTarget) {
                autofocusTarget.focus();
                return;
            }

            const containers = getFocusTrapContainersForModal(modalController);
            if (containers.length === 0) return;
            const focusableElements = getFocusableElements(containers);
            const targetElement = focusableElements[0] || modalController.content || modalController.root;
            if (!targetElement || typeof targetElement.focus !== 'function') return;
            if (!targetElement.hasAttribute('tabindex') && (targetElement === modalController.content || targetElement === modalController.root)) {
                targetElement.setAttribute('tabindex', '-1');
            }
            targetElement.focus();
        }

        function ensureGlobalModalEscHandler() {
            if (modalManagerState.keyboardBindingAttached) return;
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Tab') {
                    trapModalTabFocus(event);
                    return;
                }
                if (event.key !== 'Escape') return;
                const topDropdown = getTopOpenDropdown();
                if (topDropdown) {
                    event.preventDefault();
                    topDropdown.close();
                    return;
                }
                const topModal = modalManagerState.stack[modalManagerState.stack.length - 1];
                if (!topModal || typeof topModal.close !== 'function') return;
                if (!topModal.options || topModal.options.closeOnEsc !== true) return;
                event.preventDefault();
                topModal.close('escape');
            }, true);
            modalManagerState.keyboardBindingAttached = true;
        }

        function initializeModal(userOptions = {}) {
            ensureGlobalModalEscHandler();

            const mode = normalizeModalMode(userOptions.mode);
            const position = normalizeModalPosition(userOptions.position);
            const modeDefaults = {
                showBackdrop: mode !== 'seamless',
                closeOnBackdropClick: mode === 'normal',
                closeOnEsc: mode !== 'persistent'
            };
            const showBackdrop = userOptions.showBackdrop !== undefined
                ? Boolean(userOptions.showBackdrop)
                : modeDefaults.showBackdrop;
            const closeOnBackdropClick = userOptions.closeOnBackdropClick !== undefined
                ? Boolean(userOptions.closeOnBackdropClick)
                : modeDefaults.closeOnBackdropClick;
            const closeOnEsc = userOptions.closeOnEsc !== undefined
                ? Boolean(userOptions.closeOnEsc)
                : modeDefaults.closeOnEsc;

            const options = {
                id: userOptions.id || `ll-modal-${++modalManagerState.idCounter}`,
                mode,
                position,
                appendTo: userOptions.appendTo instanceof HTMLElement ? userOptions.appendTo : document.body,
                width: userOptions.width || '40rem',
                fullWidth: userOptions.width === 'full-width' || Boolean(userOptions.fullWidth),
                fullHeight: Boolean(userOptions.fullHeight),
                compactPadding: Boolean(userOptions.compactPadding),
                title: userOptions.title || '',
                titleIcon: userOptions.titleIcon || '',
                closeButton: userOptions.closeButton !== false,
                headerActions: userOptions.headerActions || null,
                bodyContent: userOptions.bodyContent || '',
                bodyPadding: userOptions.bodyPadding !== false,
                bodyScrollable: userOptions.bodyScrollable !== false,
                footerContent: userOptions.footerContent || null,
                openOnInit: userOptions.openOnInit !== false,
                top: (() => {
                    if (userOptions.top === null || userOptions.top === undefined) return '';
                    if (typeof userOptions.top === 'number' && Number.isFinite(userOptions.top)) {
                        return `${userOptions.top}px`;
                    }
                    return String(userOptions.top).trim();
                })(),
                showBackdrop,
                closeOnBackdropClick,
                closeOnEsc,
                onOpen: typeof userOptions.onOpen === 'function' ? userOptions.onOpen : null,
                onClose: typeof userOptions.onClose === 'function' ? userOptions.onClose : null,
                onRequestClose: typeof userOptions.onRequestClose === 'function' ? userOptions.onRequestClose : null
            };

            const root = document.createElement('div');
            root.id = options.id;
            root.className = `ll-modal ll-modal--${options.mode} ll-modal--pos-${options.position} hidden`;
            root.setAttribute('role', 'dialog');
            root.setAttribute('aria-hidden', 'true');
            root.setAttribute('data-ll-modal-instance', 'true');
            root.setAttribute('aria-modal', options.showBackdrop ? 'true' : 'false');
            if (options.compactPadding) {
                root.classList.add('ll-modal--compact-padding');
            }
            if (options.mode === 'seamless' && options.top) {
                root.classList.add('ll-modal--with-top-offset');
                root.style.top = options.top;
            }

            const frame = document.createElement('div');
            frame.className = 'll-modal__frame';
            root.appendChild(frame);

            let backdrop = null;
            if (options.showBackdrop) {
                backdrop = document.createElement('button');
                backdrop.type = 'button';
                backdrop.className = 'll-modal__backdrop';
                backdrop.setAttribute('aria-label', 'Close modal backdrop');
                frame.appendChild(backdrop);
            }

            const content = document.createElement('div');
            content.className = 'll-modal__content';
            if (options.fullWidth) {
                content.classList.add('ll-modal__content--full-width');
            } else if (options.width) {
                content.style.setProperty('--ll-modal-width', String(options.width));
            }
            if (options.fullHeight) {
                content.classList.add('ll-modal__content--full-height');
            }
            frame.appendChild(content);

            let header = null;
            let headerActionsSlot = null;
            let titleElement = null;
            let titleIconElement = null;
            let backSlotElement = null;
            let backButtonElement = null;
            let backButtonClickHandler = null;
            const hasTitle = Boolean(String(options.title || '').trim() || String(options.titleIcon || '').trim());
            const shouldRenderHeader = hasTitle || Boolean(options.headerActions);
            const updateHeaderActionClass = () => {
                if (!header) return;
                const hasInjectedActions = Boolean(
                    headerActionsSlot &&
                    (
                        headerActionsSlot.children.length > 0 ||
                        String(headerActionsSlot.textContent || '').trim() !== ''
                    )
                );
                const hasHeaderActions = Boolean(options.closeButton || hasInjectedActions);
                header.classList.toggle('ll-modal__header--with-actions', hasHeaderActions);
            };
            if (shouldRenderHeader) {
                header = document.createElement('div');
                header.className = 'll-modal__header';

                const titleSection = document.createElement('div');
                titleSection.className = 'll-modal__title-section';

                backSlotElement = document.createElement('div');
                backSlotElement.className = 'll-modal__back-slot';
                backButtonElement = document.createElement('button');
                backButtonElement.type = 'button';
                backButtonElement.className = 'll-icon-btn ll-icon-btn--circle ll-modal__back-btn';
                backButtonElement.setAttribute('aria-label', 'Back');
                backButtonElement.setAttribute('aria-hidden', 'true');
                backButtonElement.setAttribute('tabindex', '-1');
                backButtonElement.disabled = true;
                backButtonElement.innerHTML = '<span class="material-symbols-outlined ll-icon-btn__icon">arrow_back_ios_new</span>';
                backSlotElement.appendChild(backButtonElement);
                titleSection.appendChild(backSlotElement);

                const titleWrap = document.createElement('div');
                titleWrap.className = 'll-modal__title-wrap';
                if (options.titleIcon) {
                    titleIconElement = document.createElement('span');
                    titleIconElement.className = 'material-symbols-outlined ll-modal__title-icon';
                    titleIconElement.textContent = String(options.titleIcon);
                    titleWrap.appendChild(titleIconElement);
                }
                if (hasTitle) {
                    titleElement = document.createElement('h2');
                    titleElement.className = 'll-modal__title';
                    titleElement.textContent = String(options.title || '');
                    titleWrap.appendChild(titleElement);
                }
                titleSection.appendChild(titleWrap);
                header.appendChild(titleSection);

                const headerRight = document.createElement('div');
                headerRight.className = 'll-modal__header-controls';
                headerActionsSlot = document.createElement('div');
                headerActionsSlot.className = 'll-modal__header-actions';
                headerRight.appendChild(headerActionsSlot);

                if (options.closeButton) {
                    const closeButton = document.createElement('button');
                    closeButton.type = 'button';
                    closeButton.className = 'll-icon-btn ll-modal__close';
                    closeButton.setAttribute('aria-label', 'Close modal');
                    closeButton.innerHTML = '<span class="material-symbols-outlined ll-icon-btn__icon">close</span>';
                    headerRight.appendChild(closeButton);
                    closeButton.addEventListener('click', () => {
                        controller.close('close-button');
                    });
                }

                header.appendChild(headerRight);
                content.appendChild(header);
            }

            const body = document.createElement('div');
            body.className = 'll-modal__body';
            if (!options.bodyPadding) body.classList.add('ll-modal__body--no-padding');
            if (!options.bodyScrollable) body.classList.add('ll-modal__body--no-scroll');
            content.appendChild(body);

            let footer = null;
            if (options.footerContent !== null && options.footerContent !== undefined) {
                footer = document.createElement('div');
                footer.className = 'll-modal__footer';
                content.appendChild(footer);
            }

            let closeTimeoutId = null;
            let isOpen = false;
            let destroyed = false;

            const controller = {
                id: options.id,
                options,
                root,
                backdrop,
                frame,
                content,
                header,
                headerActionsSlot,
                body,
                footer,
                isOpen: () => isOpen,
                setTitle: (nextTitle = '', nextTitleIcon = '') => {
                    options.title = String(nextTitle || '');
                    options.titleIcon = String(nextTitleIcon || '');
                    if (!titleElement) {
                        titleElement = document.createElement('h2');
                        titleElement.className = 'll-modal__title';
                        const titleWrap = header ? header.querySelector('.ll-modal__title-wrap') : null;
                        if (titleWrap) {
                            titleWrap.appendChild(titleElement);
                        }
                    }
                    if (titleElement) {
                        titleElement.textContent = options.title;
                    }

                    if (options.titleIcon) {
                        if (!titleIconElement) {
                            titleIconElement = document.createElement('span');
                            titleIconElement.className = 'material-symbols-outlined ll-modal__title-icon';
                            const titleWrap = header ? header.querySelector('.ll-modal__title-wrap') : null;
                            if (titleWrap) {
                                titleWrap.insertBefore(titleIconElement, titleWrap.firstChild);
                            }
                        }
                        titleIconElement.textContent = options.titleIcon;
                    } else if (titleIconElement && titleIconElement.parentElement) {
                        titleIconElement.parentElement.removeChild(titleIconElement);
                        titleIconElement = null;
                    }
                },
                setBackButton: (config = null) => {
                    if (!backSlotElement || !backButtonElement) return;
                    const shouldShow = Boolean(config && config.visible);
                    backSlotElement.classList.toggle('ll-active', shouldShow);
                    if (!shouldShow) {
                        backButtonElement.disabled = true;
                        backButtonElement.setAttribute('aria-hidden', 'true');
                        backButtonElement.setAttribute('tabindex', '-1');
                        if (backButtonClickHandler) {
                            backButtonElement.removeEventListener('click', backButtonClickHandler);
                            backButtonClickHandler = null;
                        }
                        return;
                    }

                    const {
                        ariaLabel = 'Back',
                        icon = 'arrow_back_ios_new',
                        onClick = null
                    } = config;

                    backButtonElement.disabled = false;
                    backButtonElement.removeAttribute('aria-hidden');
                    backButtonElement.removeAttribute('tabindex');
                    backButtonElement.setAttribute('aria-label', String(ariaLabel || 'Back'));
                    const iconElement = backButtonElement.querySelector('.ll-icon-btn__icon');
                    if (iconElement) {
                        iconElement.textContent = String(icon || 'arrow_back_ios_new');
                    }

                    if (backButtonClickHandler) {
                        backButtonElement.removeEventListener('click', backButtonClickHandler);
                    }
                    backButtonClickHandler = (event) => {
                        event.preventDefault();
                        if (typeof onClick === 'function') onClick({ controller });
                    };
                    backButtonElement.addEventListener('click', backButtonClickHandler);
                },
                animateContent: (targetOrSelector, animationClassName = '') => {
                    if (!animationClassName) return;

                    let targetElement = null;
                    if (typeof targetOrSelector === 'string') {
                        if (targetOrSelector === 'body') {
                            targetElement = body;
                        } else {
                            targetElement = body ? body.querySelector(targetOrSelector) : null;
                        }
                    } else if (targetOrSelector instanceof HTMLElement) {
                        targetElement = targetOrSelector;
                    }
                    if (!targetElement) return;

                    targetElement.classList.remove('ll-modal__body-anim-slide-in-right', 'll-modal__body-anim-slide-in-left', 'll-modal__body-anim-fade-in');
                    void targetElement.offsetWidth;
                    targetElement.classList.add(animationClassName);
                    const cleanup = () => {
                        targetElement.classList.remove(animationClassName);
                        targetElement.removeEventListener('animationend', cleanup);
                    };
                    targetElement.addEventListener('animationend', cleanup);
                },
                open: () => {
                    if (destroyed) return controller;
                    if (closeTimeoutId) {
                        window.clearTimeout(closeTimeoutId);
                        closeTimeoutId = null;
                    }
                    if (isOpen) {
                        pushModalToStack(controller);
                        return controller;
                    }

                    root.classList.remove('hidden', 'll-modal--closing');
                    root.setAttribute('aria-hidden', 'false');
                    pushModalToStack(controller);
                    requestAnimationFrame(() => {
                        root.classList.add('ll-modal--open');
                        const activeElement = document.activeElement;
                        const focusInsideModal = activeElement instanceof windowScope.HTMLElement
                            && root.contains(activeElement);
                        if (!focusInsideModal) {
                            focusFirstElementInModal(controller);
                        }
                    });
                    isOpen = true;

                    if (options.onOpen) {
                        options.onOpen({ controller, reason: 'open' });
                    }
                    return controller;
                },
                close: (reason = 'programmatic') => {
                    if (destroyed || !isOpen) return Promise.resolve(false);
                    if (options.onRequestClose && options.onRequestClose({ controller, reason }) === false) {
                        return Promise.resolve(false);
                    }

                    isOpen = false;
                    root.classList.remove('ll-modal--open');
                    root.classList.add('ll-modal--closing');
                    root.setAttribute('aria-hidden', 'true');
                    removeModalFromStack(controller);

                    return new Promise((resolve) => {
                        closeTimeoutId = window.setTimeout(() => {
                            root.classList.remove('ll-modal--closing');
                            root.classList.add('hidden');
                            closeTimeoutId = null;
                            if (options.onClose) {
                                options.onClose({ controller, reason });
                            }
                            resolve(true);
                        }, 240);
                    });
                },
                destroy: () => {
                    if (destroyed) return;
                    if (closeTimeoutId) {
                        window.clearTimeout(closeTimeoutId);
                        closeTimeoutId = null;
                    }
                    removeModalFromStack(controller);
                    if (root.parentNode) {
                        root.parentNode.removeChild(root);
                    }
                    if (backButtonElement && backButtonClickHandler) {
                        backButtonElement.removeEventListener('click', backButtonClickHandler);
                        backButtonClickHandler = null;
                    }
                    destroyed = true;
                    isOpen = false;
                },
                setBodyContent: (nextBodyContent) => {
                    options.bodyContent = nextBodyContent;
                    renderModalSlot(body, options.bodyContent, controller);
                },
                setFooterContent: (nextFooterContent) => {
                    options.footerContent = nextFooterContent;
                    if (!footer && options.footerContent !== null && options.footerContent !== undefined) {
                        footer = document.createElement('div');
                        footer.className = 'll-modal__footer';
                        content.appendChild(footer);
                        controller.footer = footer;
                    }
                    if (footer) {
                        renderModalSlot(footer, options.footerContent, controller);
                    }
                },
                setHeaderActions: (nextHeaderActions) => {
                    options.headerActions = nextHeaderActions;
                    if (headerActionsSlot) {
                        renderModalHeaderActions(headerActionsSlot, options.headerActions, controller);
                        updateHeaderActionClass();
                    }
                }
            };

            if (backdrop && options.closeOnBackdropClick) {
                backdrop.addEventListener('click', () => {
                    controller.close('backdrop');
                });
            }

            renderModalSlot(body, options.bodyContent, controller);
            if (headerActionsSlot) {
                renderModalHeaderActions(headerActionsSlot, options.headerActions, controller);
                updateHeaderActionClass();
            }
            if (footer) {
                renderModalSlot(footer, options.footerContent, controller);
            }

            options.appendTo.appendChild(root);
            if (options.openOnInit) {
                controller.open();
            }
            return controller;
        }

        function initializeConfirmationDialog(options = {}) {
            const {
                title = '',
                titleIcon = '',
                bodyContent = options.message || 'Are you sure you want to continue?',
                cancelLabel = 'Cancel',
                confirmLabel = 'Yes',
                onCancel = null,
                onConfirm = null
            } = options;

            let modalController = null;
            const buildFooter = () => {
                const footer = document.createElement('div');
                footer.className = 'inline-flex items-center gap-3 ml-auto';

                const cancelButton = document.createElement('button');
                cancelButton.type = 'button';
                cancelButton.className = 'll-btn ll-btn--flat-default';
                cancelButton.textContent = String(cancelLabel || 'Cancel');

                const confirmButton = document.createElement('button');
                confirmButton.type = 'button';
                confirmButton.className = 'll-btn ll-btn--primary';
                confirmButton.textContent = String(confirmLabel || 'Yes');

                cancelButton.addEventListener('click', () => {
                    if (!modalController) return;
                    modalController.close('cancel').then((closed) => {
                        if (!closed) return;
                        if (typeof onCancel === 'function') onCancel({ controller: modalController });
                    });
                });

                confirmButton.addEventListener('click', () => {
                    if (!modalController) return;
                    modalController.close('confirm').then((closed) => {
                        if (!closed) return;
                        if (typeof onConfirm === 'function') onConfirm({ controller: modalController });
                    });
                });

                footer.appendChild(cancelButton);
                footer.appendChild(confirmButton);
                return footer;
            };

            modalController = initializeModal({
                ...options,
                mode: 'persistent',
                title,
                titleIcon,
                closeButton: false,
                bodyContent,
                footerContent: buildFooter,
                closeOnEsc: false,
                closeOnBackdropClick: false
            });
            return modalController;
        }

        function initializeAlertDialog(options = {}) {
            const {
                title = '',
                titleIcon = '',
                bodyContent = options.message || '',
                persistent = false,
                onOk = null
            } = options;

            let modalController = null;
            const buildFooter = () => {
                const footer = document.createElement('div');
                footer.className = 'inline-flex items-center gap-3 ml-auto';

                const okButton = document.createElement('button');
                okButton.type = 'button';
                okButton.className = 'll-btn ll-btn--primary';
                okButton.textContent = 'OK';
                okButton.addEventListener('click', () => {
                    if (!modalController) return;
                    modalController.close('ok').then((closed) => {
                        if (!closed) return;
                        if (typeof onOk === 'function') onOk({ controller: modalController });
                    });
                });

                footer.appendChild(okButton);
                return footer;
            };

            modalController = initializeModal({
                ...options,
                mode: persistent ? 'persistent' : 'normal',
                title,
                titleIcon,
                bodyContent,
                footerContent: buildFooter
            });
            return modalController;
        }

    windowScope.LlumenComponents = {
        initializeTabs,
        initializePortaledDropdown,
        initializeScrollableTabs,
        initializeTreeView,
        refreshExpandedTreeViewHeights,
        renderDragDropCardList,
        hideCustomTooltip,
        showCustomTooltip,
        bindCustomTooltip,
        initializeExpressionEditor,
        setExpressionEditorAllowLineBreaks,
        initializeExpressionModeToggle,
        initializeExpressionDropSourceTree,
        getExpressionSelectSourceJson,
        createOperatorsDropdownConfig,
        setButtonLoadingState,
        clearButtonLoadingState,
        dismissAlert,
        initializeDismissibleAlerts,
        createToast,
        dismissToast,
        createPromiseToast,
        initializeModal,
        initializeConfirmationDialog,
        initializeAlertDialog,
        initializeNumberInput: windowScope.initializeNumberInput,
        initializeSearchInput: windowScope.initializeSearchInput,
        initializeTextCounter: windowScope.initializeTextCounter,
        initializeDatetimeInput: windowScope.initializeDatetimeInput
    };
})(window);
