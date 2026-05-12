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
        if (input.dataset[datasetFlag] === 'true') return;
        let clearButton = clearButtonId ? document.getElementById(clearButtonId) : null;
        if (!clearButton) {
            const wrapper = input.closest('.ll-input-with-left-icon');
            if (wrapper) {
                clearButton = document.createElement('button');
                clearButton.type = 'button';
                clearButton.id = clearButtonId || `${inputId}-clear`;
                clearButton.className = 'll-icon-btn ll-clear-btn hidden';
                clearButton.setAttribute('aria-label', 'Clear search');
                clearButton.setAttribute('data-tooltip', 'Clear Search');
                clearButton.innerHTML = '<span class="material-symbols-outlined ll-icon-btn__icon">close</span>';
                wrapper.appendChild(clearButton);
            }
        }
        if (clearButton) {
            const normalizedClearButtonClasses = String(clearButton.className || '')
                .split(/\s+/)
                .filter((token) => token
                    && token !== 'll-icon-btn'
                    && token !== 'll-clear-btn'
                    && token !== 'll-search-clear-btn'
                    && token !== 'll-datetime-clear-btn'
                    && token !== 'll-dropdown__selection-clear');
            clearButton.className = ['ll-icon-btn', 'll-clear-btn', ...normalizedClearButtonClasses].join(' ');
            const clearIcon = clearButton.querySelector('.material-symbols-outlined');
            if (clearIcon) {
                clearIcon.classList.add('ll-icon-btn__icon');
            }
        }

        const updateClearVisibility = () => {
            const hasValue = input.value.trim().length > 0;
            if (clearButton) {
                clearButton.classList.toggle('hidden', !hasValue);
            }
            if (input.classList.contains('ll-input--search')) {
                input.classList.toggle('ll-input--search__has-value', Boolean(clearButton && hasValue));
            }
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
        const {
            clearable = false,
            onChange: userOnChange = null,
            onValueUpdate: userOnValueUpdate = null,
            ...flatpickrOptions
        } = options || {};
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

        let clearButton = null;
        const updateClearVisibility = () => {
            if (!clearButton) return;
            const hasValue = input.value.trim().length > 0;
            clearButton.classList.toggle('hidden', !hasValue);
            if (input.classList.contains('ll-input--datetime')) {
                input.classList.toggle('ll-input--datetime__has-value', hasValue);
            }
        };
        if (clearable && datetimeField) {
            clearButton = datetimeField.querySelector('.ll-clear-btn, .ll-datetime-clear-btn');
            if (!clearButton) {
                clearButton = document.createElement('button');
                clearButton.type = 'button';
                clearButton.id = `${inputId}-clear`;
                clearButton.className = 'll-icon-btn ll-clear-btn hidden';
                clearButton.setAttribute('aria-label', 'Clear date and time');
                clearButton.setAttribute('data-tooltip', 'Clear date and time');
                clearButton.innerHTML = '<span class="material-symbols-outlined ll-icon-btn__icon">close</span>';
                datetimeField.appendChild(clearButton);
            }
            const normalizedClearButtonClasses = String(clearButton.className || '')
                .split(/\s+/)
                .filter((token) => token
                    && token !== 'll-icon-btn'
                    && token !== 'll-clear-btn'
                    && token !== 'll-search-clear-btn'
                    && token !== 'll-datetime-clear-btn'
                    && token !== 'll-dropdown__selection-clear');
            clearButton.className = ['ll-icon-btn', 'll-clear-btn', ...normalizedClearButtonClasses].join(' ');
        }

        const runFlatpickrHook = (hook, selectedDates, dateStr, instance) => {
            if (typeof hook === 'function') {
                hook(selectedDates, dateStr, instance);
                return;
            }
            if (!Array.isArray(hook)) return;
            hook.forEach((callback) => {
                if (typeof callback === 'function') {
                    callback(selectedDates, dateStr, instance);
                }
            });
        };
        const config = {
            enableTime: true,
            time_24hr: false,
            dateFormat: 'F j, Y \\a\\t h:i K',
            allowInput: true,
            ...flatpickrOptions,
            onChange: (selectedDates, dateStr, instance) => {
                runFlatpickrHook(userOnChange, selectedDates, dateStr, instance);
                updateClearVisibility();
            },
            onValueUpdate: (selectedDates, dateStr, instance) => {
                runFlatpickrHook(userOnValueUpdate, selectedDates, dateStr, instance);
                updateClearVisibility();
            }
        };
        const pickerInstance = initializeToggleableFlatpickrOnInput(input, config);
        if (clearButton && pickerInstance && clearButton.dataset.datetimeClearBound !== 'true') {
            clearButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                pickerInstance.clear();
                updateClearVisibility();
                input.focus();
            });
            clearButton.dataset.datetimeClearBound = 'true';
            updateClearVisibility();
        }
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

        function getExpressionEditorTokenFromDatetimeValue(datetimeValue) {
            const normalized = datetimeValue === null || datetimeValue === undefined
                ? ''
                : String(datetimeValue).trim();
            if (!normalized) return '';
            if (normalized.startsWith('specific:')) {
                const specificRawValue = normalized.slice('specific:'.length).trim();
                if (!specificRawValue) return '';
                return `{{ new Date(${JSON.stringify(specificRawValue)}) }}`;
            }
            return `{{ ${normalized} }}`;
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
                        <div id="${editorIdBase}-fixed-datetime-menu" class="ll-dropdown__menu hidden"></div>
                    </div>
                    <div class="hidden" data-expression-editor-fixed-input="boolean">
                        <button id="${editorIdBase}-fixed-boolean-btn" type="button"
                            class="${baseClassName} ll-expression-fixed-trigger">
                            <span class="ll-expression-fixed-boolean-selected ll-expression-fixed-selected">True</span>
                            <span class="material-symbols-outlined ll-expression-fixed-chevron">expand_more</span>
                        </button>
                        <div id="${editorIdBase}-fixed-boolean-menu" class="ll-dropdown__menu hidden">
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
                        <div id="${editorIdBase}-fixed-select-menu" class="ll-dropdown__menu hidden"></div>
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
                        menuType: 'selection',
                        clearable: true,
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
                                        datetimeInput.className = 'll-expression-datetime-native-input';
                                        wrapper.appendChild(datetimeInput);
                                        const calendarMount = document.createElement('div');
                                        calendarMount.className = '';
                                        wrapper.appendChild(calendarMount);
                                        const selectedValueSection = document.createElement('div');
                                        selectedValueSection.className = 'selection-preview';
                                        const selectedValueLabel = document.createElement('div');
                                        selectedValueLabel.className = 'selection-label';
                                        selectedValueLabel.textContent = 'Selected date and time:';
                                        const selectedValueText = document.createElement('div');
                                        selectedValueText.className = 'selection-value';
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
                            const resolvedDatetimeValue = nextValue === EXPRESSION_EDITOR_DATETIME_SPECIFIC_SELECTION_VALUE
                                ? String(editor.dataset.expressionDatetimeValue || '')
                                : nextValue;
                            const resolvedDatetimeLabel = nextValue === EXPRESSION_EDITOR_DATETIME_SPECIFIC_SELECTION_VALUE
                                ? String(editor.dataset.expressionDatetimeLabel || nextLabel)
                                : nextLabel;
                            editor.dataset.expressionDatetimeValue = resolvedDatetimeValue;
                            editor.dataset.expressionDatetimeLabel = resolvedDatetimeLabel;
                            const tokenText = getExpressionEditorTokenFromDatetimeValue(resolvedDatetimeValue);
                            updateExpressionEditorContent(editor, tokenText, null, 'expression');
                            syncExpressionEditorSelectLock(editor);
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
                        menuType: 'selection',
                        clearable: true,
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
                            const tokenText = editor.dataset.expressionSelectValue
                                ? getExpressionEditorTokenFromJsonPath(editor.dataset.expressionSelectValue)
                                : '';
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
                        menuType: 'selection',
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
                <div id="${switchMenuId}" class="ll-dropdown__menu hidden">
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
                menuType: 'selection',
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
                    field.classList.add('ll-expression-field--focus');
                });
                field.addEventListener('focusout', () => {
                    window.setTimeout(() => {
                        if (!field.contains(document.activeElement)) {
                            field.classList.remove('ll-expression-field--focus');
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
                ghost.className = 'll-expression-drag-ghost ll-expression-font';
                ghost.innerHTML = `
                    <span class="material-symbols-outlined ll-expression-drag-ghost__icon">${escapeHtml(propertyIcon || 'title')}</span>
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
                    item.classList.add('ll-expression-drop-source-item');
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
            matchTriggerWidth = false,
            multiLevelConfig = null,
            groupedOptions = null,
            defaultValue = '',
            emptySelectionLabel = '',
            onValueChange = null,
            minMenuWidthPx = 128,
            selectedPrefixWrapperClassName = '',
            containerClassName = '',
            menuType = 'action',
            selectionType = 'single',
            clearable = false,
            dropdownIcon = '',
            dropdownLabel = '',
            showLabel = true
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
            const menuTypeNormalized = String(menuType == null ? '' : menuType).trim().toLowerCase();
            const isSelectionMenuType = menuTypeNormalized === 'selection';
            const selectionTypeNormalized = String(selectionType == null ? '' : selectionType).trim().toLowerCase() === 'multiple'
                ? 'multiple'
                : 'single';
            const isMultiSelection = isSelectionMenuType && selectionTypeNormalized === 'multiple';
            const isClearableSelection = isSelectionMenuType && (isMultiSelection || Boolean(clearable));
            const resolvedDropdownIcon = String(dropdownIcon || '').trim();
            const resolvedDropdownLabel = String(dropdownLabel || '').trim();
            const shouldShowDropdownLabel = Boolean(showLabel) && Boolean(resolvedDropdownLabel);
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
            const selectedSimpleValues = new Set();
            let clearSelectionButton = null;
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
                removeOverlayDropdownEntry(dropdownStackKey);
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
                pushOverlayDropdownEntry({
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
                const shouldMatchTriggerWidth = !isMultiLevel && Boolean(matchTriggerWidth);
                const isFullWidthMenu = shouldMatchTriggerWidth
                    || dropdownMenu.classList.contains('w-full');
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

            const clearAllPortaledSelectionHighlight = () => {
                const menuRoots = [dropdownMenu].concat(
                    openSubmenus.map((record) => (record && record.element) || null).filter(Boolean)
                );
                menuRoots.forEach((menuElement) => {
                    if (!menuElement || menuElement.nodeType !== 1) return;
                    menuElement.querySelectorAll('[data-dropdown-leaf-value], [data-dropdown-trigger-key], [data-dropdown-middle-parent-option="true"]').forEach((el) => {
                        el.classList.remove('ll-active');
                    });
                    menuElement.querySelectorAll('[data-dropdown-middle-parent-button="true"]').forEach((btn) => {
                        btn.classList.remove('ll-active');
                    });
                });
            };

            const markSelectedLeafClasses = () => {
                if (!isSelectionMenuType) {
                    clearAllPortaledSelectionHighlight();
                    return;
                }
                const applySelectionClasses = (menuElement) => {
                    if (!menuElement) return;
                    menuElement.querySelectorAll('[data-dropdown-leaf-value]').forEach((itemEl) => {
                        const isSelected = itemEl.dataset.dropdownLeafValue === selectedLeafValue;
                        itemEl.classList.toggle('ll-active', isSelected);
                    });
                    menuElement.querySelectorAll('[data-dropdown-trigger-key]').forEach((triggerEl) => {
                        if (triggerEl.classList.contains('ll-dropdown__submenu-icon-trigger')) {
                            triggerEl.classList.remove('ll-active');
                            return;
                        }
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
                if (isSelectionMenuType) {
                    renderSelectedValue(selectedLeafLabel, selectedPrefixHtml, false);
                    markSelectedLeafClasses();
                } else {
                    clearAllPortaledSelectionHighlight();
                }
                syncSharedClearButtonVisibility(Boolean(selectedLeafValue));
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
            const ensureSharedClearButton = () => {
                if (!isClearableSelection || !dropdownButton) return null;
                if (clearSelectionButton && clearSelectionButton.isConnected) return clearSelectionButton;
                let triggerShell = dropdownButton.parentElement;
                if (!triggerShell || !triggerShell.classList || !triggerShell.classList.contains('ll-dropdown__trigger-shell')) {
                    const shell = document.createElement('div');
                    shell.className = 'll-dropdown__trigger-shell';
                    if (dropdownButton.parentElement) {
                        dropdownButton.parentElement.insertBefore(shell, dropdownButton);
                    }
                    shell.appendChild(dropdownButton);
                    triggerShell = shell;
                }
                triggerShell.classList.add('ll-dropdown__trigger-shell');
                const shouldFillTriggerShell = dropdownButton.classList.contains('ll-dropdown__button')
                    || dropdownButton.classList.contains('ll-input')
                    || dropdownButton.classList.contains('w-full');
                triggerShell.classList.toggle('ll-dropdown__trigger-shell--fill', shouldFillTriggerShell);
                clearSelectionButton = document.createElement('button');
                clearSelectionButton.type = 'button';
                clearSelectionButton.className = 'll-icon-btn ll-clear-btn hidden';
                clearSelectionButton.setAttribute('aria-label', 'Clear selections');
                clearSelectionButton.innerHTML = '<span class="material-symbols-outlined ll-icon-btn__icon">close</span>';
                clearSelectionButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (typeof dropdownButton.__clearPortaledDropdownSelection === 'function') {
                        dropdownButton.__clearPortaledDropdownSelection();
                    }
                    if (typeof onValueChange === 'function') {
                        if (isMultiSelection) {
                            onValueChange({
                                label: '',
                                labels: [],
                                value: [],
                                values: [],
                                prefixHtml: ''
                            });
                        } else {
                            onValueChange({
                                label: '',
                                value: '',
                                prefixHtml: ''
                            });
                        }
                    }
                    closeDropdown();
                });
                if (triggerShell) {
                    triggerShell.appendChild(clearSelectionButton);
                }
                return clearSelectionButton;
            };
            const syncSharedClearButtonVisibility = (hasSelection) => {
                if (!isClearableSelection) return;
                const clearBtn = ensureSharedClearButton();
                if (!clearBtn) return;
                clearBtn.classList.toggle('hidden', !Boolean(hasSelection));
                dropdownButton.classList.toggle('ll-dropdown__trigger--clear-visible', Boolean(hasSelection));
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
                    rootTree.className = 'll-dropdown__tree-root';
                    rootTree.dataset.treeExpandMode = 'accordion';
                    rootTree.dataset.treeAnimate = 'false';
                    rootTree.dataset.treeChildIndentClass = 'll-dropdown__tree-child-indent';
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
                            childList.className = 'll-dropdown__tree-child-list ll-dropdown__tree-child-list--root hidden';
                            childList.style.maxHeight = '0px';
                            childList.style.opacity = '0';

                            const childContent = document.createElement('div');
                            childContent.className = 'll-dropdown__tree-child-content';
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
                    syncSharedClearButtonVisibility(false);
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
                                class="ll-icon-btn ll-clear-btn hidden"
                                data-tooltip="Clear Search">
                                <span class="material-symbols-outlined ll-icon-btn__icon">close</span>
                            </button>
                        </div>
                    `;
                    const outerWrapper = document.createElement('div');
                    outerWrapper.className = 'll-dropdown__search-layout';
                    const contentWrapper = document.createElement('div');
                    contentWrapper.className = 'll-dropdown__search-content';
                    rootItemsContainer = document.createElement('div');
                    rootItemsContainer.className = 'll-dropdown__search-root-items';
                    searchResultsContainer = document.createElement('div');
                    searchResultsContainer.className = 'll-dropdown__search-results hidden';
                    dropdownMenu.innerHTML = '';
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
                                groupedTree.className = 'll-dropdown__tree-root';
                                groupedTree.dataset.treeExpandMode = 'tree';
                                groupedTree.dataset.treeAnimate = 'false';
                                groupedTree.dataset.treeChildIndentClass = 'll-dropdown__tree-child-indent';
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
                                    childList.className = 'll-dropdown__tree-child-list ll-dropdown__tree-child-list--search hidden';
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
                    submenu.className = 'll-dropdown__menu hidden';
                    submenu.style.position = 'absolute';
                    submenu.style.right = 'auto';
                    submenu.style.zIndex = '10000';
                    submenu.style.marginTop = '0';
                    submenu.style.width = 'max-content';
                    submenu.style.minWidth = '128px';
                    submenu.style.maxWidth = `${Math.max(128, Math.min(420, window.innerWidth - 16))}px`;

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
                if (
                    isSelectionMenuType
                    && fallbackLeaf
                    && (resolvedDefaultValue || !allowEmptySelection)
                ) {
                    updateSelection(
                        fallbackLeaf.selectionLabel || fallbackLeaf.label,
                        fallbackLeaf.value,
                        fallbackLeaf.topLevelPrefixHtml || '',
                        fallbackLeaf.ancestorTriggerKeys || []
                    );
                } else if (allowEmptySelection || !isSelectionMenuType) {
                    clearMultiLevelSelection();
                }
                suppressOnValueChange = false;
                syncSharedClearButtonVisibility(Boolean(selectedLeafValue));

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
                const multiContentRoot = item.querySelector('.ll-dropdown__multi-content');
                if (multiContentRoot) {
                    const multiContentLabel = multiContentRoot.querySelector('[data-dropdown-label]');
                    if (multiContentLabel) {
                        return String(multiContentLabel.textContent || '').trim();
                    }
                    if (item.classList.contains('ll-dropdown__item--with-description') && multiContentRoot.firstElementChild) {
                        return String(multiContentRoot.firstElementChild.textContent || '').trim();
                    }
                    return String(multiContentRoot.textContent || '').trim();
                }
                const primaryLabelElement = item.querySelector('[data-dropdown-label]');
                if (primaryLabelElement) {
                    return String(primaryLabelElement.textContent || '').trim();
                }
                if (item.classList.contains('ll-dropdown__item--with-description') && item.firstElementChild) {
                    return String(item.firstElementChild.textContent || '').trim();
                }
                return String(item.textContent || '').trim();
            };

            const getSimpleMenuItems = () => Array.from(dropdownMenu.querySelectorAll('[data-value]'));
            const parseIncomingValues = (value) => {
                if (Array.isArray(value)) {
                    return value
                        .map((entry) => String(entry || '').trim())
                        .filter(Boolean);
                }
                if (value && typeof value === 'object' && Array.isArray(value.values)) {
                    return value.values
                        .map((entry) => String(entry || '').trim())
                        .filter(Boolean);
                }
                return String(value || '')
                    .split(',')
                    .map((entry) => entry.trim())
                    .filter(Boolean);
            };
            const syncSimpleClearButtonVisibility = () => {
                const activeSingleValue = isMultiSelection
                    ? ''
                    : String(selectedLeafValue || ((dropdownMenu.querySelector('[data-value].ll-active') || {}).dataset || {}).value || '').trim();
                const hasSelection = isMultiSelection
                    ? Array.from(selectedSimpleValues).length > 0
                    : Boolean(activeSingleValue);
                syncSharedClearButtonVisibility(hasSelection);
            };
            const renderSimpleSelectedValue = () => {
                if (!selectedValueSpan || !isSelectionMenuType) return;
                if (!isMultiSelection) return;
                const values = Array.from(selectedSimpleValues);
                const selectedLabels = values
                    .map((value) => {
                        const escapedValue = typeof CSS !== 'undefined' && CSS.escape
                            ? CSS.escape(value)
                            : value.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|/@])/g, '\\$1');
                        const item = dropdownMenu.querySelector(`[data-value="${escapedValue}"]`);
                        return resolveSimpleItemLabel(item || null);
                    })
                    .filter(Boolean);
                const hasSelection = selectedLabels.length > 0;
                const textValue = hasSelection
                    ? (shouldShowDropdownLabel
                        ? `${resolvedDropdownLabel}: ${selectedLabels.join(', ')}`
                        : selectedLabels.join(', '))
                    : (shouldShowDropdownLabel ? resolvedDropdownLabel : (resolvedEmptySelectionLabel || ''));
                const iconHtml = resolvedDropdownIcon
                    ? `<span class="material-symbols-outlined ll-dropdown__selection-leading-icon">${escapeHtml(resolvedDropdownIcon)}</span>`
                    : '';
                selectedValueSpan.innerHTML = `${iconHtml}<span class="truncate">${escapeHtml(textValue)}</span>`;
                setSelectedPlaceholderState(!hasSelection && !shouldShowDropdownLabel && Boolean(resolvedEmptySelectionLabel));
                syncSimpleClearButtonVisibility();
            };
            const renderSimpleSingleSelectedValue = (label, isPlaceholder = false) => {
                if (!selectedValueSpan || !isSelectionMenuType || isMultiSelection) return;
                const normalizedLabel = String(label || '').trim();
                const textValue = isPlaceholder
                    ? (shouldShowDropdownLabel ? resolvedDropdownLabel : (resolvedEmptySelectionLabel || ''))
                    : (shouldShowDropdownLabel
                        ? `${resolvedDropdownLabel}: ${normalizedLabel}`
                        : normalizedLabel);
                if (resolvedDropdownIcon) {
                    selectedValueSpan.innerHTML = `
                        <span class="material-symbols-outlined ll-dropdown__selection-leading-icon">${escapeHtml(resolvedDropdownIcon)}</span>
                        <span class="truncate">${escapeHtml(textValue)}</span>
                    `;
                } else {
                    selectedValueSpan.textContent = textValue;
                }
                setSelectedPlaceholderState(Boolean(isPlaceholder && !shouldShowDropdownLabel && resolvedEmptySelectionLabel));
            };
            const updateSimpleMenuSelectionState = () => {
                if (!isSelectionMenuType) return;
                const items = getSimpleMenuItems();
                if (isMultiSelection) {
                    items.forEach((item) => {
                        const isSelected = selectedSimpleValues.has(String(item.dataset.value || '').trim());
                        item.classList.toggle('ll-active', isSelected);
                        const checkbox = item.querySelector('[data-dropdown-multi-checkbox="true"]');
                        if (checkbox) {
                            checkbox.classList.toggle('ll-dropdown__multi-checkbox--checked', isSelected);
                        }
                    });
                    renderSimpleSelectedValue();
                    return;
                }
                items.forEach((item) => {
                    item.classList.toggle('ll-active', selectedLeafValue === String(item.dataset.value || '').trim());
                });
                syncSimpleClearButtonVisibility();
            };
            const ensureSimpleMultiSelectItemMarkup = () => {
                if (!isMultiSelection) return;
                getSimpleMenuItems().forEach((item) => {
                    if (item.dataset.dropdownMultiDecorated === 'true') return;
                    const existingHtml = item.innerHTML;
                    item.classList.add('ll-dropdown__item--multi-select');
                    item.innerHTML = `
                        <span class="ll-dropdown__multi-checkbox" data-dropdown-multi-checkbox="true" aria-hidden="true">
                            <span class="material-symbols-outlined ll-dropdown__multi-checkbox-icon">check</span>
                        </span>
                        <span class="ll-dropdown__multi-content">${existingHtml}</span>
                    `;
                    item.dataset.dropdownMultiDecorated = 'true';
                });
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
                            optionElement.className = `ll-dropdown__item${hasDescription ? ' ll-dropdown__item--with-description' : ''}${option.active && isSelectionMenuType ? ' ll-active' : ''}`;
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

            ensureSimpleMultiSelectItemMarkup();
            if (isMultiSelection && selectedValueSpan) {
                renderSimpleSelectedValue();
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
                if (isSelectionMenuType) {
                    const selectedValue = String(item.dataset.value || '').trim();
                    if (isMultiSelection) {
                        if (selectedSimpleValues.has(selectedValue)) {
                            selectedSimpleValues.delete(selectedValue);
                        } else if (selectedValue) {
                            selectedSimpleValues.add(selectedValue);
                        }
                    } else {
                        dropdownMenu.querySelectorAll('[data-value]').forEach((otherItem) => {
                            otherItem.classList.remove('ll-active');
                        });
                        item.classList.add('ll-active');
                    }
                } else if (typeof item.blur === 'function') {
                    try {
                        item.blur();
                    } catch (_e) {
                        /* ignore */
                    }
                }
                const selectedLabel = resolveSimpleItemLabel(item);
                if (selectedValueSpan && isSelectionMenuType && !isMultiSelection) {
                    renderSimpleSingleSelectedValue(selectedLabel, false);
                }
                if (isSelectionMenuType) {
                    if (isMultiSelection) {
                        updateSimpleMenuSelectionState();
                    } else {
                        selectedLeafValue = String(item.dataset.value || selectedLabel || '');
                        selectedLeafLabel = selectedLabel;
                        syncSimpleClearButtonVisibility();
                    }
                }
                if (typeof onValueChange === 'function') {
                    if (isMultiSelection) {
                        const values = Array.from(selectedSimpleValues);
                        const labels = getSimpleMenuItems()
                            .filter((menuItem) => values.includes(String(menuItem.dataset.value || '').trim()))
                            .map((menuItem) => resolveSimpleItemLabel(menuItem))
                            .filter(Boolean);
                        onValueChange({
                            label: labels.join(', '),
                            labels,
                            value: values,
                            values,
                            prefixHtml: ''
                        });
                    } else {
                        onValueChange({
                            label: selectedLabel,
                            value: item.dataset.value || selectedLabel,
                            prefixHtml: ''
                        });
                    }
                }
                if (!isMultiSelection) {
                    closeDropdown();
                }
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
                if (isMultiSelection) {
                    const targetValues = parseIncomingValues(value);
                    selectedSimpleValues.clear();
                    targetValues.forEach((entry) => {
                        selectedSimpleValues.add(entry);
                    });
                    updateSimpleMenuSelectionState();
                    if (emitChange && typeof onValueChange === 'function') {
                        const values = Array.from(selectedSimpleValues);
                        const labels = getSimpleMenuItems()
                            .filter((menuItem) => values.includes(String(menuItem.dataset.value || '').trim()))
                            .map((menuItem) => resolveSimpleItemLabel(menuItem))
                            .filter(Boolean);
                        onValueChange({
                            label: labels.join(', '),
                            labels,
                            value: values,
                            values,
                            prefixHtml: ''
                        });
                    }
                    return true;
                }
                const targetValue = String(value || '');
                if (!targetValue) {
                    dropdownMenu.querySelectorAll('[data-value]').forEach((otherItem) => {
                        otherItem.classList.remove('ll-active');
                    });
                    if (selectedValueSpan) {
                        renderSimpleSingleSelectedValue('', true);
                    }
                    selectedLeafValue = '';
                    selectedLeafLabel = '';
                    syncSimpleClearButtonVisibility();
                    return true;
                }
                const escapedTargetValue = typeof CSS !== 'undefined' && CSS.escape
                    ? CSS.escape(targetValue)
                    : targetValue.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|/@])/g, '\\$1');
                const targetItem = dropdownMenu.querySelector(`[data-value="${escapedTargetValue}"]`);
                if (!targetItem) return false;
                if (isSelectionMenuType) {
                    dropdownMenu.querySelectorAll('[data-value]').forEach((otherItem) => {
                        otherItem.classList.remove('ll-active');
                    });
                    targetItem.classList.add('ll-active');
                }
                const selectedLabel = resolveSimpleItemLabel(targetItem);
                if (selectedValueSpan && isSelectionMenuType) {
                    renderSimpleSingleSelectedValue(selectedLabel, false);
                }
                selectedLeafValue = String(targetItem.dataset.value || selectedLabel || '');
                selectedLeafLabel = selectedLabel;
                syncSimpleClearButtonVisibility();
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
                if (isMultiSelection) {
                    return Array.from(selectedSimpleValues);
                }
                const activeItem = dropdownMenu.querySelector('[data-value].ll-active');
                return activeItem ? (activeItem.dataset.value || activeItem.textContent.trim()) : '';
            };
            dropdownButton.__clearPortaledDropdownSelection = () => {
                if (isMultiSelection) {
                    selectedSimpleValues.clear();
                    updateSimpleMenuSelectionState();
                    syncSimpleClearButtonVisibility();
                    return;
                }
                dropdownMenu.querySelectorAll('[data-value]').forEach((otherItem) => {
                    otherItem.classList.remove('ll-active');
                });
                if (selectedValueSpan) {
                    renderSimpleSingleSelectedValue('', true);
                }
                selectedLeafValue = '';
                selectedLeafLabel = '';
                syncSimpleClearButtonVisibility();
            };
            const initialActiveItem = dropdownMenu.querySelector('[data-value].ll-active');
            if (isMultiSelection) {
                const defaultValues = parseIncomingValues(defaultValue);
                if (defaultValues.length > 0) {
                    dropdownButton.__setPortaledDropdownValue(defaultValues, false);
                } else {
                    dropdownButton.__clearPortaledDropdownSelection();
                }
            } else if (resolvedDefaultValue) {
                const didSetDefault = dropdownButton.__setPortaledDropdownValue(resolvedDefaultValue, false);
                if (!didSetDefault) {
                    dropdownButton.__clearPortaledDropdownSelection();
                }
            } else if (isSelectionMenuType && initialActiveItem && selectedValueSpan) {
                renderSimpleSingleSelectedValue(resolveSimpleItemLabel(initialActiveItem), false);
            } else if (selectedValueSpan && resolvedEmptySelectionLabel) {
                renderSimpleSingleSelectedValue('', true);
            }
            syncSimpleClearButtonVisibility();
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
                        iconWrapper.className = 'll-tree__icon-wrapper';
                        iconWrapper.dataset.treeIconWrapper = 'true';
                        icon.replaceWith(iconWrapper);
                        iconWrapper.appendChild(icon);
                    }
                }

                button.dataset.treeStructureApplied = 'true';
            };
            const applyTreeTriggerSpacing = (button, target) => {
                if (!button || !target) return;
                const triggerMode = button.dataset.treeTriggerMode;
                const hasBlockVariantClass = target.classList.contains('ll-tree__children--block');
                const hasArrowVariantClass = target.classList.contains('ll-tree__children--arrow');
                const rootList = button.closest('[data-tree-child-indent-class]');
                const customBlockChildIndentClass = rootList && rootList.dataset
                    ? String(rootList.dataset.treeChildIndentClass || '').trim()
                    : '';
                const blockChildIndentClass = customBlockChildIndentClass || 'll-tree__children--block';
                if (triggerMode === 'block') {
                    if (!hasBlockVariantClass && !hasArrowVariantClass) {
                        target.classList.remove('ll-tree__children--arrow');
                        target.classList.add(blockChildIndentClass);
                    }
                    target.querySelectorAll('li').forEach((item) => {
                        const hasChildList = Array.from(item.children).some((child) => child.tagName === 'UL');
                        item.classList.toggle('ll-tree__item--leaf-spaced', !hasChildList);
                    });
                    return;
                }
                if (triggerMode === 'arrow') {
                    if (!hasBlockVariantClass && !hasArrowVariantClass) {
                        target.classList.remove('ll-tree__children--block');
                        target.classList.add('ll-tree__children--arrow');
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

        let llumenActivePointerInteraction = null;

        function unregisterLlumenActivePointerInteraction(token) {
            if (llumenActivePointerInteraction === token) {
                if (token && typeof token === 'object') {
                    token.onEscape = null;
                }
                llumenActivePointerInteraction = null;
            }
        }

        function registerLlumenPointerDragInteraction() {
            if (llumenActivePointerInteraction) {
                return null;
            }
            const token = { kind: 'drag' };
            llumenActivePointerInteraction = token;
            return token;
        }

        function registerLlumenResizeInteraction() {
            if (llumenActivePointerInteraction) {
                return null;
            }
            const token = { kind: 'resize' };
            llumenActivePointerInteraction = token;
            return token;
        }

        function unregisterLlumenPointerDragInteraction(token) {
            unregisterLlumenActivePointerInteraction(token);
        }

        function sanitizeLlDragDropClone(root) {
            if (!root || !root.querySelectorAll) return;
            root.querySelectorAll('[id]').forEach((node) => {
                node.removeAttribute('id');
            });
        }

        function collectPointerDragScrollRoots(originElement) {
            const roots = [];
            let el = originElement;
            while (el && el !== document.body) {
                if (el === document.documentElement) break;
                const style = windowScope.getComputedStyle(el);
                const overflowY = style.overflowY;
                const overflowX = style.overflowX;
                const scrollableY = (overflowY === 'auto' || overflowY === 'scroll')
                    && el.scrollHeight > el.clientHeight + 1;
                const scrollableX = (overflowX === 'auto' || overflowX === 'scroll')
                    && el.scrollWidth > el.clientWidth + 1;
                if (scrollableY || scrollableX) {
                    roots.push(el);
                }
                el = el.parentElement;
            }
            roots.push(document.documentElement);
            return roots;
        }

        function applyPointerDragAutoScroll(scrollRoots, clientX, clientY, edgePx, maxSpeed) {
            if (!scrollRoots || !scrollRoots.length || !Number.isFinite(edgePx) || edgePx <= 0) return;
            scrollRoots.forEach((root) => {
                if (!root) return;
                if (root === document.documentElement) {
                    const vh = windowScope.innerHeight;
                    const vw = windowScope.innerWidth;
                    let dy = 0;
                    let dx = 0;
                    if (clientY < edgePx) {
                        dy = -maxSpeed * (1 - clientY / edgePx);
                    } else if (clientY > vh - edgePx) {
                        dy = maxSpeed * (1 - (vh - clientY) / edgePx);
                    }
                    if (clientX < edgePx) {
                        dx = -maxSpeed * (1 - clientX / edgePx);
                    } else if (clientX > vw - edgePx) {
                        dx = maxSpeed * (1 - (vw - clientX) / edgePx);
                    }
                    if (dy !== 0 || dx !== 0) {
                        windowScope.scrollBy(dx, dy);
                    }
                    return;
                }
                const rect = root.getBoundingClientRect();
                const scrollableY = root.scrollHeight > root.clientHeight + 1;
                const scrollableX = root.scrollWidth > root.clientWidth + 1;
                let dy = 0;
                let dx = 0;
                if (scrollableY) {
                    if (clientY < rect.top + edgePx) {
                        dy = -maxSpeed * (1 - (clientY - rect.top) / edgePx);
                    } else if (clientY > rect.bottom - edgePx) {
                        dy = maxSpeed * (1 - (rect.bottom - clientY) / edgePx);
                    }
                }
                if (scrollableX) {
                    if (clientX < rect.left + edgePx) {
                        dx = -maxSpeed * (1 - (clientX - rect.left) / edgePx);
                    } else if (clientX > rect.right - edgePx) {
                        dx = maxSpeed * (1 - (rect.right - clientX) / edgePx);
                    }
                }
                if (dy !== 0) {
                    root.scrollTop += dy;
                }
                if (dx !== 0) {
                    root.scrollLeft += dx;
                }
            });
        }

        /**
         * @returns {boolean} **true** when the session arms (listeners + capture); **false** if another
         *   pointer interaction is already active or arguments are invalid — callers that created UI
         *   before this call should clean up when **false**.
         */
        function runLlumenPointerDragSession({
            handleElement,
            pointerCaptureTarget = null,
            startEvent,
            scrollRootOriginElement,
            onMove,
            onCommit,
            onCancel,
            autoScroll = { edgePx: 28, maxSpeed: 18 },
            cancelOnEscape = true,
            onSessionEnd = null,
            onAfterStart = null
        }) {
            if (!handleElement || !startEvent || startEvent.isPrimary !== true) return false;
            const interactionToken = registerLlumenPointerDragInteraction();
            if (!interactionToken) return false;

            const captureElement = pointerCaptureTarget && pointerCaptureTarget.nodeType === 1
                ? pointerCaptureTarget
                : handleElement;

            const pointerId = startEvent.pointerId;
            let sessionEnded = false;
            let rafId = 0;
            const lastPointer = {
                x: startEvent.clientX,
                y: startEvent.clientY
            };
            const scrollRoots = scrollRootOriginElement
                ? collectPointerDragScrollRoots(scrollRootOriginElement)
                : [];
            const autoScrollEnabled = Boolean(autoScroll);
            const edgePx = autoScrollEnabled && autoScroll && typeof autoScroll === 'object'
                ? (Number(autoScroll.edgePx) || 28)
                : 28;
            const maxSpeed = autoScrollEnabled && autoScroll && typeof autoScroll === 'object'
                ? (Number(autoScroll.maxSpeed) || 18)
                : 18;

            const applyEndFocus = (reason) => {
                if (typeof onSessionEnd === 'function') {
                    onSessionEnd({ reason, handleElement });
                    return;
                }
                if (!handleElement || !handleElement.isConnected) return;
                try {
                    if (typeof handleElement.focus === 'function' && !handleElement.matches(':disabled')) {
                        handleElement.focus({ preventScroll: true });
                    }
                } catch (e) {
                    /* ignore */
                }
            };

            const cleanupCaptureAndClass = () => {
                handleElement.classList.remove('ll-dnd__capture-target--active');
                try {
                    if (captureElement.hasPointerCapture(pointerId)) {
                        captureElement.releasePointerCapture(pointerId);
                    }
                } catch (e) {
                    /* ignore */
                }
            };

            const detachListeners = () => {
                document.removeEventListener('visibilitychange', onVisibilityChange);
                captureElement.removeEventListener('pointermove', onPointerMove);
                captureElement.removeEventListener('pointerup', onPointerUp);
                captureElement.removeEventListener('pointercancel', onPointerCancel);
                captureElement.removeEventListener('lostpointercapture', onLostCapture);
            };

            const endSession = (kind, cancelReason) => {
                if (sessionEnded) return;
                sessionEnded = true;
                if (cancelOnEscape && interactionToken) {
                    interactionToken.onEscape = null;
                }
                if (rafId) {
                    windowScope.cancelAnimationFrame(rafId);
                    rafId = 0;
                }
                detachListeners();
                cleanupCaptureAndClass();
                try {
                    if (kind === 'commit') {
                        if (typeof onCommit === 'function') {
                            onCommit();
                        }
                    } else if (typeof onCancel === 'function') {
                        onCancel({ reason: cancelReason || 'cancel' });
                    }
                } finally {
                    unregisterLlumenPointerDragInteraction(interactionToken);
                    applyEndFocus(kind === 'commit' ? 'commit' : 'cancel');
                }
            };

            if (cancelOnEscape && interactionToken) {
                interactionToken.onEscape = () => {
                    if (sessionEnded) return;
                    endSession('cancel', 'escape');
                };
            }

            const onPointerMove = (ev) => {
                if (sessionEnded) return;
                if (ev.pointerId !== pointerId) return;
                lastPointer.x = ev.clientX;
                lastPointer.y = ev.clientY;
                if (typeof onMove === 'function') {
                    onMove({ clientX: ev.clientX, clientY: ev.clientY, event: ev });
                }
            };

            const onPointerUp = (ev) => {
                if (sessionEnded) return;
                if (ev.pointerId !== pointerId) return;
                endSession('commit');
            };

            const onPointerCancel = (ev) => {
                if (sessionEnded) return;
                if (ev.pointerId !== pointerId) return;
                endSession('cancel', 'pointercancel');
            };

            const onLostCapture = (ev) => {
                if (sessionEnded) return;
                if (ev.pointerId !== pointerId) return;
                endSession('cancel', 'lostpointercapture');
            };

            const onVisibilityChange = () => {
                if (sessionEnded) return;
                if (document.hidden) {
                    endSession('cancel', 'visibility');
                }
            };

            const tickAutoScroll = () => {
                if (sessionEnded || !autoScrollEnabled) return;
                applyPointerDragAutoScroll(scrollRoots, lastPointer.x, lastPointer.y, edgePx, maxSpeed);
                rafId = windowScope.requestAnimationFrame(tickAutoScroll);
            };

            try {
                captureElement.setPointerCapture(pointerId);
            } catch (e) {
                /* ignore */
            }
            handleElement.classList.add('ll-dnd__capture-target--active');
            captureElement.addEventListener('pointermove', onPointerMove);
            captureElement.addEventListener('pointerup', onPointerUp);
            captureElement.addEventListener('pointercancel', onPointerCancel);
            captureElement.addEventListener('lostpointercapture', onLostCapture);
            document.addEventListener('visibilitychange', onVisibilityChange);
            if (autoScrollEnabled) {
                rafId = windowScope.requestAnimationFrame(tickAutoScroll);
            }
            if (typeof onAfterStart === 'function') {
                try {
                    onAfterStart({
                        clientX: startEvent.clientX,
                        clientY: startEvent.clientY,
                        pointerId,
                        lastPointer
                    });
                } catch (e) {
                    /* ignore */
                }
            }
            return true;
        }

        function llumenSurfacePointerClientToLocalContent(surfaceElement, clientX, clientY) {
            if (!surfaceElement || surfaceElement.nodeType !== 1) {
                return { left: 0, top: 0 };
            }
            const br = surfaceElement.getBoundingClientRect();
            const sl = surfaceElement.scrollLeft || 0;
            const st = surfaceElement.scrollTop || 0;
            const cl = surfaceElement.clientLeft || 0;
            const ct = surfaceElement.clientTop || 0;
            return {
                left: sl + (clientX - br.left) - cl,
                top: st + (clientY - br.top) - ct
            };
        }

        function llumenSurfaceClampContentLocalBox(surfaceElement, left, top, width, height, padMin) {
            const pad = Math.max(0, padMin || 0);
            const w = Math.max(1, width);
            const h = Math.max(1, height);
            const maxX = Math.max(
                pad,
                surfaceElement.scrollWidth - w - pad
            );
            const maxY = Math.max(
                pad,
                surfaceElement.scrollHeight - h - pad
            );
            return {
                left: Math.max(pad, Math.min(maxX, left)),
                top: Math.max(pad, Math.min(maxY, top))
            };
        }

        /**
         * Pointer-driven **insert** onto a **position: relative** surface: a **`.ll-dnd__ghost`** follows the
         * cursor; on **commit** (pointer up) with the hotspot inside the surface’s viewport rect,
         * **`onDropCommit`** runs with **content-local** **`left` / `top`** (px), clamped with **`padMin`**.
         *
         * @param {object} options
         * @param {HTMLElement} options.surfaceElement
         * @param {(detail: { left: number, top: number, clientX: number, clientY: number, payload: unknown, sourceElement: HTMLElement|null }) => void} options.onDropCommit
         * @param {(detail: { left: number, top: number, clientX: number, clientY: number, payload: unknown, sourceElement: HTMLElement|null }) => boolean} [options.validateDrop]
         * @param {number} [options.padMin=8]
         * @param {number} [options.defaultGhostWidth=128]
         * @param {number} [options.defaultGhostHeight=48]
         * @param {HTMLElement|null} [options.scrollRootOriginElement=null]
         * @param {HTMLElement|null} [options.pointerCaptureTarget=null]
         * @param {HTMLElement|null} [options.ghostMountRoot=null]
         * @param {(source: HTMLElement|null, payload: unknown) => HTMLElement|null} [options.buildInsertGhost]
         */
        function initCanvasDropContext(options = {}) {
            const {
                surfaceElement,
                onDropCommit,
                validateDrop = null,
                padMin = 8,
                defaultGhostWidth = 128,
                defaultGhostHeight = 48,
                scrollRootOriginElement = null,
                pointerCaptureTarget = null,
                ghostMountRoot = null,
                buildInsertGhost = null
            } = options;

            const noopApi = {
                destroy() {},
                beginInsertPointerDrag() {}
            };

            if (!surfaceElement || surfaceElement.nodeType !== 1 || typeof onDropCommit !== 'function') {
                return noopApi;
            }

            const mountRoot = (ghostMountRoot && ghostMountRoot.nodeType === 1)
                ? ghostMountRoot
                : ((surfaceElement.ownerDocument && surfaceElement.ownerDocument.body) || surfaceElement);

            const scrollRoot = (scrollRootOriginElement && scrollRootOriginElement.nodeType === 1)
                ? scrollRootOriginElement
                : surfaceElement;

            let activeGhost = null;

            const removeGhost = (ghostEl) => {
                if (ghostEl && ghostEl.parentNode) {
                    ghostEl.parentNode.removeChild(ghostEl);
                }
            };

            const destroy = () => {
                removeGhost(activeGhost);
                activeGhost = null;
            };

            const beginInsertPointerDrag = (dragOpts) => {
                const {
                    startEvent,
                    sourceElement = null,
                    payload = null,
                    ghostWidth,
                    ghostHeight
                } = dragOpts || {};

                if (!startEvent || startEvent.isPrimary !== true) return;

                startEvent.preventDefault();
                startEvent.stopPropagation();

                const doc = surfaceElement.ownerDocument || document;
                const captureRoot = (pointerCaptureTarget && pointerCaptureTarget.nodeType === 1)
                    ? pointerCaptureTarget
                    : ((doc.body) || surfaceElement);

                let ghost = null;
                let gw = typeof ghostWidth === 'number' && ghostWidth > 0 ? ghostWidth : defaultGhostWidth;
                let gh = typeof ghostHeight === 'number' && ghostHeight > 0 ? ghostHeight : defaultGhostHeight;

                if (typeof buildInsertGhost === 'function') {
                    try {
                        const g = buildInsertGhost(sourceElement, payload);
                        if (g && g.nodeType === 1) {
                            ghost = g;
                        }
                    } catch (e) {
                        /* ignore */
                    }
                }
                if (!ghost) {
                    ghost = doc.createElement('div');
                    ghost.className = 'll-dnd__ghost';
                    const labelAttr = sourceElement && typeof sourceElement.getAttribute === 'function'
                        ? sourceElement.getAttribute('data-ll-insert-drag-label')
                        : null;
                    const label = labelAttr && String(labelAttr).trim()
                        ? String(labelAttr).trim().slice(0, 48)
                        : (sourceElement && sourceElement.textContent)
                            ? String(sourceElement.textContent).trim().slice(0, 48)
                            : 'Drop here';
                    ghost.textContent = label;
                    ghost.style.width = `${gw}px`;
                    ghost.style.height = `${gh}px`;
                    ghost.style.display = 'flex';
                    ghost.style.alignItems = 'center';
                    ghost.style.justifyContent = 'center';
                    ghost.style.padding = '8px';
                    ghost.style.fontSize = '12px';
                } else {
                    ghost.classList.add('ll-dnd__ghost');
                }

                mountRoot.appendChild(ghost);
                activeGhost = ghost;
                gw = Math.max(1, ghost.offsetWidth || gw);
                gh = Math.max(1, ghost.offsetHeight || gh);

                const ghostOffX = gw / 2;
                const ghostOffY = gh / 2;
                ghost.style.position = 'fixed';
                ghost.style.pointerEvents = 'none';
                ghost.style.left = `${startEvent.clientX - ghostOffX}px`;
                ghost.style.top = `${startEvent.clientY - ghostOffY}px`;

                const lastPointer = {
                    x: startEvent.clientX,
                    y: startEvent.clientY
                };

                const handleEl = (sourceElement && sourceElement.nodeType === 1) ? sourceElement : surfaceElement;

                const started = runLlumenPointerDragSession({
                    handleElement: handleEl,
                    pointerCaptureTarget: captureRoot,
                    startEvent,
                    scrollRootOriginElement: scrollRoot,
                    onMove: ({ clientX, clientY }) => {
                        lastPointer.x = clientX;
                        lastPointer.y = clientY;
                        if (ghost && ghost.parentNode) {
                            ghost.style.left = `${clientX - ghostOffX}px`;
                            ghost.style.top = `${clientY - ghostOffY}px`;
                        }
                    },
                    onCommit: () => {
                        const cx = lastPointer.x;
                        const cy = lastPointer.y;
                        const br = surfaceElement.getBoundingClientRect();
                        const inside = cx >= br.left && cx <= br.right && cy >= br.top && cy <= br.bottom;
                        if (!inside) return;

                        const pt = llumenSurfacePointerClientToLocalContent(surfaceElement, cx, cy);
                        const rawLeft = pt.left - ghostOffX;
                        const rawTop = pt.top - ghostOffY;
                        const clamped = llumenSurfaceClampContentLocalBox(
                            surfaceElement,
                            rawLeft,
                            rawTop,
                            gw,
                            gh,
                            padMin
                        );
                        const detail = {
                            left: clamped.left,
                            top: clamped.top,
                            clientX: cx,
                            clientY: cy,
                            payload,
                            sourceElement
                        };
                        if (typeof validateDrop === 'function') {
                            let ok = true;
                            try {
                                ok = validateDrop(detail) !== false;
                            } catch (e) {
                                ok = false;
                            }
                            if (!ok) return;
                        }
                        try {
                            onDropCommit(detail);
                        } catch (e) {
                            /* ignore */
                        }
                    },
                    onSessionEnd: ({ handleElement: he }) => {
                        removeGhost(ghost);
                        if (activeGhost === ghost) {
                            activeGhost = null;
                        }
                        ghost = null;
                        if (he && he.isConnected && typeof he.focus === 'function') {
                            try {
                                if (!he.matches(':disabled')) {
                                    he.focus({ preventScroll: true });
                                }
                            } catch (e2) {
                                /* ignore */
                            }
                        }
                    }
                });

                if (!started) {
                    removeGhost(ghost);
                    if (activeGhost === ghost) {
                        activeGhost = null;
                    }
                }
            };

            return { destroy, beginInsertPointerDrag };
        }

        const sortableListController = (typeof windowScope.LlumenSortableEngine !== 'undefined'
            && typeof windowScope.LlumenSortableEngine.createSortableListController === 'function')
            ? windowScope.LlumenSortableEngine.createSortableListController({
                windowScope,
                runPointerDragSession: runLlumenPointerDragSession,
                sanitizeClone: sanitizeLlDragDropClone,
                canStartSortableDrag: () => !llumenActivePointerInteraction
            })
            : null;

        function initSortableList(options = {}) {
            if (sortableListController) {
                return sortableListController.mountSortableList(options);
            }
            if (!windowScope.__llumenSortableEngineWarned) {
                windowScope.__llumenSortableEngineWarned = true;
                console.warn(
                    'LlumenComponents.initSortableList: load js/llumen-sortable-engine.js before js/llumen-components.js.'
                );
            }
            return { destroy() {} };
        }

        function initVerticalSortableList(options = {}) {
            const { onReorder, ...rest } = options;
            return initSortableList({
                ...rest,
                axis: 'vertical',
                onReorder: typeof onReorder === 'function'
                    ? (detail) => {
                        if (detail.fromContainer !== detail.toContainer) return;
                        onReorder(detail.id, detail.toIndex);
                    }
                    : null
            });
        }

        function ensureLlResizeHandleUnfocusable(handleEl) {
            if (!handleEl || handleEl.nodeType !== 1) return;
            handleEl.setAttribute('tabindex', '-1');
            if (handleEl.dataset.llResizeHandleNoFocusBound === 'true') return;
            handleEl.addEventListener('focus', () => {
                const doc = handleEl.ownerDocument;
                if (doc && doc.activeElement === handleEl && typeof handleEl.blur === 'function') {
                    try {
                        handleEl.blur();
                    } catch (e) {
                        /* ignore */
                    }
                }
            });
            handleEl.dataset.llResizeHandleNoFocusBound = 'true';
        }

        function parseLlumenCssLengthToPx(value, doc) {
            if (value == null) return null;
            const s = String(value).trim();
            if (!s || s === 'none' || s === 'auto') return null;
            const n = parseFloat(s);
            if (!Number.isFinite(n)) return null;
            if (/px$/i.test(s)) return n;
            if (/rem$/i.test(s)) {
                const root = doc && doc.documentElement;
                const rootFont = root ? parseFloat(windowScope.getComputedStyle(root).fontSize) || 16 : 16;
                return n * rootFont;
            }
            return null;
        }

        function parseLlumenGridAutoRowsMinPx(gridAutoRows, doc) {
            if (!gridAutoRows) return null;
            const s = String(gridAutoRows).trim();
            const mm = /minmax\(\s*([^,]+)\s*,/i.exec(s);
            if (mm) {
                return parseLlumenCssLengthToPx(mm[1].trim(), doc);
            }
            return parseLlumenCssLengthToPx(s, doc);
        }

        /**
         * Read column count, gaps, and a row step from a CSS grid container (repeat() columns + grid-auto-rows).
         * Used by grid span resize and optional placement helpers; metrics refresh each pointer frame.
         * `trackOriginViewportX/Y` is the top-left of the grid track area (inside border + padding).
         * `innerWidthPx` / `innerHeightPx` are the track-area dimensions (content box).
         */
        function readLlumenGridSurfaceLayout(gridSurface) {
            if (!gridSurface || gridSurface.nodeType !== 1) return null;
            const doc = gridSurface.ownerDocument;
            const cs = windowScope.getComputedStyle(gridSurface);
            const br = gridSurface.getBoundingClientRect();
            const borderL = parseFloat(cs.borderLeftWidth) || 0;
            const borderR = parseFloat(cs.borderRightWidth) || 0;
            const borderT = parseFloat(cs.borderTopWidth) || 0;
            const borderB = parseFloat(cs.borderBottomWidth) || 0;
            const padL = parseFloat(cs.paddingLeft) || 0;
            const padR = parseFloat(cs.paddingRight) || 0;
            const padT = parseFloat(cs.paddingTop) || 0;
            const padB = parseFloat(cs.paddingBottom) || 0;
            const innerWidthPx = Math.max(0, br.width - borderL - borderR - padL - padR);
            const innerHeightPx = Math.max(0, br.height - borderT - borderB - padT - padB);
            const trackOriginViewportX = br.left + borderL + padL;
            const trackOriginViewportY = br.top + borderT + padT;
            const templateCols = cs.gridTemplateColumns;
            let columnCount = 1;
            if (templateCols && templateCols !== 'none') {
                columnCount = Math.max(1, templateCols.split(/\s+/).filter(Boolean).length);
            }
            const gapCombined = cs.gap || '0px';
            const columnGapPx = parseFloat(cs.columnGap || gapCombined) || 0;
            const rowGapPx = parseFloat(cs.rowGap || gapCombined) || columnGapPx;
            const columnUnitWidthPx = columnCount > 0
                ? (innerWidthPx - Math.max(0, columnCount - 1) * columnGapPx) / columnCount
                : 0;
            const rowTrackPx = parseLlumenGridAutoRowsMinPx(cs.gridAutoRows, doc) || 80;
            return {
                rect: br,
                innerWidthPx,
                innerHeightPx,
                trackOriginViewportX,
                trackOriginViewportY,
                columnCount,
                columnGapPx,
                rowGapPx,
                columnUnitWidthPx,
                rowTrackPx
            };
        }

        function llumenGridPlaceFromClient(clientX, clientY, metrics, colSpan, rowSpan, maxGridRow) {
            if (!metrics || !Number.isFinite(metrics.columnUnitWidthPx) || colSpan < 1 || rowSpan < 1) {
                return null;
            }
            const maxR = Math.max(1, Number(maxGridRow) || 48);
            const colStride = metrics.columnUnitWidthPx + metrics.columnGapPx;
            const rowStride = metrics.rowTrackPx + metrics.rowGapPx;
            if (colStride <= 0 || rowStride <= 0) return null;
            const relX = clientX - metrics.trackOriginViewportX;
            const relY = clientY - metrics.trackOriginViewportY;
            if (relX < 0 || relY < 0 || relX > metrics.innerWidthPx) return null;
            const col0 = Math.floor(relX / colStride);
            const row0 = Math.floor(relY / rowStride);
            const maxColStart = Math.max(1, metrics.columnCount - colSpan + 1);
            const colStart = Math.max(1, Math.min(maxColStart, col0 + 1));
            const rowStart = Math.max(1, Math.min(maxR, row0 + 1));
            return { colStart, rowStart };
        }

        function llumenRectIntersectionArea(a, b) {
            if (!a || !b || !Number.isFinite(a.width) || !Number.isFinite(a.height)
                || !Number.isFinite(b.width) || !Number.isFinite(b.height)) {
                return 0;
            }
            const x1 = Math.max(a.left, b.left);
            const y1 = Math.max(a.top, b.top);
            const x2 = Math.min(a.left + a.width, b.left + b.width);
            const y2 = Math.min(a.top + a.height, b.top + b.height);
            const w = x2 - x1;
            const h = y2 - y1;
            return w > 0 && h > 0 ? w * h : 0;
        }

        /** `occupied` is a Set of `"col,row"` keys (1-based). True if the colSpan×rowSpan footprint uses none of them. */
        function llumenGridFootprintFreeOfOccupied(occupied, colStart, rowStart, colSpan, rowSpan) {
            if (!occupied || occupied.size === 0) return true;
            for (let rj = rowStart; rj < rowStart + rowSpan; rj++) {
                for (let ci = colStart; ci < colStart + colSpan; ci++) {
                    if (occupied.has(`${ci},${rj}`)) return false;
                }
            }
            return true;
        }

        /**
         * Shrink `(colSpan, rowSpan)` until the footprint at `(colStart, rowStart)` avoids `occupied`,
         * never going below `(minColSpan, minRowSpan)`. Prefers shrinking width first (stable, cheap).
         */
        function llumenGridClampSpansToOccupancy(occupied, colStart, rowStart, colSpan, rowSpan, minColSpan, minRowSpan) {
            if (!occupied || occupied.size === 0) {
                return { colSpan, rowSpan };
            }
            let c = colSpan;
            let r = rowSpan;
            while (!llumenGridFootprintFreeOfOccupied(occupied, colStart, rowStart, c, r)) {
                if (c > minColSpan) {
                    c -= 1;
                } else if (r > minRowSpan) {
                    r -= 1;
                } else {
                    break;
                }
            }
            return { colSpan: c, rowSpan: r };
        }

        /**
         * Pick `{ colStart, rowStart }` from the ghost viewport rect: maximize overlap with the
         * footprint (dnd-kit-style rectIntersection). On ties (or zero overlap over gaps), use closest
         * footprint center to the ghost center. Returns null if the ghost does not intersect the
         * grid track inner rect (caller keeps last sticky slot).
         * @param {Set<string>|null} occupiedCells — if non-empty, placements overlapping these cells are skipped.
         */
        function llumenGridPlaceFromGhostRect(gRect, metrics, colSpan, rowSpan, maxGridRow, preferPlace, occupiedCells) {
            if (!gRect || !metrics || colSpan < 1 || rowSpan < 1) return null;
            const colStride = metrics.columnUnitWidthPx + metrics.columnGapPx;
            const rowStride = metrics.rowTrackPx + metrics.rowGapPx;
            if (colStride <= 0 || rowStride <= 0) return null;
            const maxR = Math.max(1, Number(maxGridRow) || 48);
            const maxColStart = Math.max(1, metrics.columnCount - colSpan + 1);
            const trackRect = {
                left: metrics.trackOriginViewportX,
                top: metrics.trackOriginViewportY,
                width: metrics.innerWidthPx,
                height: metrics.innerHeightPx
            };
            if (llumenRectIntersectionArea(gRect, trackRect) <= 0) {
                return null;
            }
            const gcx = gRect.left + gRect.width / 2;
            const gcy = gRect.top + gRect.height / 2;
            const items = [];
            for (let rowStart = 1; rowStart <= maxR; rowStart++) {
                for (let colStart = 1; colStart <= maxColStart; colStart++) {
                    const fp = llumenGridFootprintViewportRect(metrics, colStart, rowStart, colSpan, rowSpan);
                    const area = llumenRectIntersectionArea(gRect, fp);
                    const fcx = fp.left + fp.width / 2;
                    const fcy = fp.top + fp.height / 2;
                    const dist = (gcx - fcx) * (gcx - fcx) + (gcy - fcy) * (gcy - fcy);
                    items.push({ colStart, rowStart, area, dist });
                }
            }
            if (!items.length) return null;
            const candidates = occupiedCells && occupiedCells.size
                ? items.filter((it) => llumenGridFootprintFreeOfOccupied(
                    occupiedCells,
                    it.colStart,
                    it.rowStart,
                    colSpan,
                    rowSpan
                ))
                : items;
            if (!candidates.length) return null;
            let maxArea = candidates[0].area;
            for (let i = 1; i < candidates.length; i++) {
                if (candidates[i].area > maxArea) maxArea = candidates[i].area;
            }
            const strong = candidates.filter((it) => it.area >= maxArea - 1e-6);
            let minDist = strong[0].dist;
            for (let i = 1; i < strong.length; i++) {
                if (strong[i].dist < minDist) minDist = strong[i].dist;
            }
            const narrowed = strong.filter((it) => it.dist <= minDist + 1e-6);
            if (preferPlace) {
                const hit = narrowed.find(
                    (it) => it.colStart === preferPlace.colStart && it.rowStart === preferPlace.rowStart
                );
                if (hit) {
                    return { colStart: hit.colStart, rowStart: hit.rowStart };
                }
            }
            narrowed.sort((x, y) => x.rowStart - y.rowStart || x.colStart - y.colStart);
            const pick = narrowed[0];
            return { colStart: pick.colStart, rowStart: pick.rowStart };
        }

        /**
         * Which cells are occupied by other tiles (excludes `excludeTile`, e.g. the one being dragged).
         * Ignores nodes inside `.ll-dnd__placeholder` (mirror clones reuse tile classes).
         */
        function collectLlumenGridOccupiedCells(gridSurface, tileSelector, excludeTile, metrics, maxGridRow) {
            if (!gridSurface || !tileSelector || !metrics) return null;
            const occupied = new Set();
            const nodes = gridSurface.querySelectorAll(tileSelector);
            for (let i = 0; i < nodes.length; i++) {
                const el = nodes[i];
                if (!el || el.nodeType !== 1 || el === excludeTile) continue;
                if (typeof el.closest === 'function' && el.closest('.ll-dnd__placeholder')) continue;
                const cs = Math.max(1, parseInt(el.dataset.colSpan, 10) || 1);
                const rs = Math.max(1, parseInt(el.dataset.rowSpan, 10) || 1);
                const br = el.getBoundingClientRect();
                const w = Math.max(1, br.width);
                const h = Math.max(1, br.height);
                const p = llumenGridPlaceFromGhostRect(
                    { left: br.left, top: br.top, width: w, height: h },
                    metrics,
                    cs,
                    rs,
                    maxGridRow,
                    null,
                    null
                );
                if (!p) continue;
                for (let rj = p.rowStart; rj < p.rowStart + rs; rj++) {
                    for (let ci = p.colStart; ci < p.colStart + cs; ci++) {
                        occupied.add(`${ci},${rj}`);
                    }
                }
            }
            return occupied;
        }

        function llumenGridFootprintViewportRect(metrics, colStart, rowStart, colSpan, rowSpan) {
            const cw = metrics.columnUnitWidthPx;
            const ch = metrics.rowTrackPx;
            const cg = metrics.columnGapPx;
            const rg = metrics.rowGapPx;
            const left = metrics.trackOriginViewportX + (colStart - 1) * (cw + cg);
            const top = metrics.trackOriginViewportY + (rowStart - 1) * (ch + rg);
            const width = colSpan * cw + Math.max(0, colSpan - 1) * cg;
            const height = rowSpan * ch + Math.max(0, rowSpan - 1) * rg;
            return { left, top, width, height };
        }

        /** `vRect` in viewport coordinates; `hostEl` is `position: relative` (absolute children use padding-box origin). */
        function llumenSyncResizeRubberBandFromViewportRect(previewEl, hostEl, vRect) {
            if (!previewEl || !hostEl || !vRect) return;
            const hr = hostEl.getBoundingClientRect();
            const padLeft = hr.left + (hostEl.clientLeft || 0);
            const padTop = hr.top + (hostEl.clientTop || 0);
            previewEl.style.left = `${vRect.left - padLeft}px`;
            previewEl.style.top = `${vRect.top - padTop}px`;
            previewEl.style.width = `${vRect.width}px`;
            previewEl.style.height = `${vRect.height}px`;
        }

        /**
         * Map the tile’s on-screen box to `{ colStart, rowStart }` (not pointer-based).
         * Uses the same overlap rule as drag preview: the tile center alone is wrong for tall/wide
         * multi-cell items (it can sit in a later row/column band than the item’s top-left anchor).
         */
        function llumenGridAnchorCellFromTile(tile, metrics, colSpan, rowSpan, maxGridRow) {
            if (!tile || !metrics) return null;
            const r = tile.getBoundingClientRect();
            const w = Math.max(1, r.width);
            const h = Math.max(1, r.height);
            let p = llumenGridPlaceFromGhostRect(
                { left: r.left, top: r.top, width: w, height: h },
                metrics,
                colSpan,
                rowSpan,
                maxGridRow,
                null,
                null
            );
            if (p) return p;
            p = llumenGridPlaceFromClient(r.left + 2, r.top + 2, metrics, colSpan, rowSpan, maxGridRow);
            if (p) return p;
            return llumenGridPlaceFromClient(
                r.left + r.width / 2,
                r.top + r.height / 2,
                metrics,
                colSpan,
                rowSpan,
                maxGridRow
            );
        }

        /** `grid-column` / `grid-row` like `3 / span 2` → starting line `3`; `span 2` only → null. */
        function llumenGridParseShorthandAxisStart(shorthand) {
            const s = String(shorthand || '').trim();
            if (!s) return null;
            const m = /^\s*([+-]?\d+)\s*\//.exec(s);
            if (!m) return null;
            const n = parseInt(m[1], 10);
            return Number.isFinite(n) && n > 0 ? n : null;
        }

        function llumenGridParseComputedAxisStart(computedValue) {
            const s = String(computedValue || '').trim();
            if (!s || /^auto$/i.test(s)) return null;
            const n = parseInt(s, 10);
            return Number.isFinite(n) && n > 0 ? n : null;
        }

        /** `startColSpan` / `startRowSpan` are the tile’s current span counts (not grid line indices). */
        function llumenGridSpansFromDelta(dx, dy, startColSpan, startRowSpan, metrics, maxColSpan, maxRowSpan) {
            if (!metrics) return { colSpan: startColSpan, rowSpan: startRowSpan };
            const colStride = metrics.columnUnitWidthPx + metrics.columnGapPx;
            const rowStride = metrics.rowTrackPx + metrics.rowGapPx;
            const addCol = colStride > 0 ? Math.round(dx / colStride) : 0;
            const addRow = rowStride > 0 ? Math.round(dy / rowStride) : 0;
            const maxC = Number.isFinite(maxColSpan) && maxColSpan > 0 ? maxColSpan : metrics.columnCount;
            const maxR = Number.isFinite(maxRowSpan) && maxRowSpan > 0 ? maxRowSpan : 6;
            const nextCol = Math.max(1, Math.min(maxC, startColSpan + addCol));
            const nextRow = Math.max(1, Math.min(maxR, startRowSpan + addRow));
            return { colSpan: nextCol, rowSpan: nextRow };
        }

        /**
         * Pointer-based SE resize for grid items: maps pointer delta to integer column/row spans.
         * Uses the same mutex as initResizableElement (registerLlumenResizeInteraction).
         *
         * When the tile’s **start column and row** are known, the default UX is a **rubber-band**
         * preview (`.ll-resize-rubber-band`) inside `gridSurface`: the tile’s **span** updates
         * only on **commit** so heavy content (charts/maps) is not relayouted every move. If anchors
         * cannot be resolved, falls back to **live** span updates on the tile (legacy behavior).
         */
        function initGridTileSpanResize(options = {}) {
            const {
                gridSurface,
                tile,
                resizeHandle,
                maxColSpan = null,
                maxRowSpan = 6,
                layoutMaxGridRow = 48,
                occupancyTileSelector = null,
                resolveMetrics = null,
                onSpanCommit = null,
                onSpanPreview = null,
                pointerCaptureTarget = null
            } = options;

            if (!gridSurface || !tile || !resizeHandle) {
                return { destroy() {} };
            }
            if (!gridSurface.contains(tile) || !tile.contains(resizeHandle)) {
                return { destroy() {} };
            }
            ensureLlResizeHandleUnfocusable(resizeHandle);

            const captureRoot = (pointerCaptureTarget && pointerCaptureTarget.nodeType === 1)
                ? pointerCaptureTarget
                : (tile.ownerDocument && tile.ownerDocument.body) || tile;

            const getMetrics = typeof resolveMetrics === 'function'
                ? () => resolveMetrics()
                : () => readLlumenGridSurfaceLayout(gridSurface);

            let activeEndSession = null;
            let detachAll = null;

            const applyEndFocus = (handleEl) => {
                if (!handleEl || !handleEl.isConnected) return;
                if (handleEl.classList && handleEl.classList.contains('ll-resize-handle--se')) return;
                try {
                    if (typeof handleEl.focus === 'function' && !handleEl.matches(':disabled')) {
                        handleEl.focus({ preventScroll: true });
                    }
                } catch (e) {
                    /* ignore */
                }
            };

            const pointerDownHandler = (startEvent) => {
                if (!startEvent.isPrimary) return;
                if (startEvent.pointerType === 'mouse' && startEvent.button !== 0) return;
                if (typeof detachAll === 'function') return;

                const token = registerLlumenResizeInteraction();
                if (!token) {
                    return;
                }

                startEvent.preventDefault();
                startEvent.stopPropagation();

                const pointerId = startEvent.pointerId;
                const startX = startEvent.clientX;
                const startY = startEvent.clientY;
                const startCol = Math.max(1, parseInt(tile.dataset.colSpan, 10) || 1);
                const startRow = Math.max(1, parseInt(tile.dataset.rowSpan, 10) || 1);
                const prevColSpan = tile.dataset.colSpan;
                const prevRowSpan = tile.dataset.rowSpan;
                const prevGridColumn = tile.style.gridColumn;
                const prevGridRow = tile.style.gridRow;

                const winForTile = (tile.ownerDocument && tile.ownerDocument.defaultView)
                    || windowScope;
                let resizeFixedColStart = llumenGridParseShorthandAxisStart(tile.style.gridColumn);
                let resizeFixedRowStart = llumenGridParseShorthandAxisStart(tile.style.gridRow);
                if (resizeFixedColStart == null || resizeFixedRowStart == null) {
                    const csp = winForTile.getComputedStyle(tile);
                    if (resizeFixedColStart == null) {
                        resizeFixedColStart = llumenGridParseComputedAxisStart(csp.gridColumnStart);
                    }
                    if (resizeFixedRowStart == null) {
                        resizeFixedRowStart = llumenGridParseComputedAxisStart(csp.gridRowStart);
                    }
                }
                if (resizeFixedColStart == null || resizeFixedRowStart == null) {
                    const m0 = getMetrics();
                    const ap0 = m0 && llumenGridAnchorCellFromTile(
                        tile,
                        m0,
                        startCol,
                        startRow,
                        layoutMaxGridRow
                    );
                    if (ap0) {
                        if (resizeFixedColStart == null) resizeFixedColStart = ap0.colStart;
                        if (resizeFixedRowStart == null) resizeFixedRowStart = ap0.rowStart;
                    }
                }

                const rubberBand = resizeFixedColStart != null && resizeFixedRowStart != null;
                const doc = tile.ownerDocument || document;
                let previewEl = null;
                let lastPreviewCol = startCol;
                let lastPreviewRow = startRow;
                let lastNotifiedCol = startCol;
                let lastNotifiedRow = startRow;

                const removeRubberBand = () => {
                    if (previewEl && previewEl.parentNode) {
                        previewEl.parentNode.removeChild(previewEl);
                    }
                    previewEl = null;
                };

                const syncRubberBand = (m, c, r) => {
                    if (!rubberBand || !previewEl || !m) return;
                    const vr = llumenGridFootprintViewportRect(
                        m,
                        resizeFixedColStart,
                        resizeFixedRowStart,
                        c,
                        r
                    );
                    llumenSyncResizeRubberBandFromViewportRect(previewEl, gridSurface, vr);
                };

                let sessionEnded = false;

                const restoreSpan = () => {
                    if (prevColSpan != null && prevColSpan !== '') {
                        tile.dataset.colSpan = prevColSpan;
                    } else {
                        tile.removeAttribute('data-col-span');
                    }
                    if (prevRowSpan != null && prevRowSpan !== '') {
                        tile.dataset.rowSpan = prevRowSpan;
                    } else {
                        tile.removeAttribute('data-row-span');
                    }
                    tile.style.gridColumn = prevGridColumn;
                    tile.style.gridRow = prevGridRow;
                };

                const applySpan = (col, row, opts) => {
                    const suppressPreview = opts && opts.suppressPreview;
                    tile.dataset.colSpan = String(col);
                    tile.dataset.rowSpan = String(row);
                    const gc = resizeFixedColStart != null
                        ? `${resizeFixedColStart} / span ${col}`
                        : `span ${col}`;
                    const gr = resizeFixedRowStart != null
                        ? `${resizeFixedRowStart} / span ${row}`
                        : `span ${row}`;
                    tile.style.gridColumn = gc;
                    tile.style.gridRow = gr;
                    if (!suppressPreview && typeof onSpanPreview === 'function') {
                        onSpanPreview({ colSpan: col, rowSpan: row, tile });
                    }
                };

                const cleanupCaptureAndClass = () => {
                    tile.classList.remove('ll-grid-span-tile--resizing');
                    resizeHandle.classList.remove('ll-dnd__capture-target--active');
                    try {
                        if (captureRoot.hasPointerCapture && captureRoot.hasPointerCapture(pointerId)) {
                            captureRoot.releasePointerCapture(pointerId);
                        }
                    } catch (e) {
                        /* ignore */
                    }
                };

                const endSession = (kind, cancelReason) => {
                    if (sessionEnded) return;
                    sessionEnded = true;
                    if (token) {
                        token.onEscape = null;
                    }
                    activeEndSession = null;
                    if (typeof detachAll === 'function') {
                        detachAll();
                        detachAll = null;
                    }
                    cleanupCaptureAndClass();
                    removeRubberBand();
                    try {
                        if (kind === 'commit') {
                            if (rubberBand) {
                                applySpan(lastPreviewCol, lastPreviewRow, { suppressPreview: true });
                            }
                            const col = Math.max(1, parseInt(tile.dataset.colSpan, 10) || startCol);
                            const row = Math.max(1, parseInt(tile.dataset.rowSpan, 10) || startRow);
                            if (typeof onSpanCommit === 'function') {
                                onSpanCommit({ colSpan: col, rowSpan: row, tile });
                            }
                        } else {
                            restoreSpan();
                        }
                    } finally {
                        unregisterLlumenPointerDragInteraction(token);
                        applyEndFocus(resizeHandle);
                    }
                };

                const onPointerMove = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    const m = getMetrics();
                    if (!m || !Number.isFinite(m.columnUnitWidthPx)) return;
                    let maxC = maxColSpan != null && Number.isFinite(maxColSpan) && maxColSpan > 0
                        ? maxColSpan
                        : m.columnCount;
                    let maxR = maxRowSpan != null && Number.isFinite(maxRowSpan) && maxRowSpan > 0
                        ? maxRowSpan
                        : 6;
                    if (resizeFixedColStart != null) {
                        maxC = Math.min(maxC, Math.max(1, m.columnCount - resizeFixedColStart + 1));
                    }
                    if (resizeFixedRowStart != null) {
                        maxR = Math.min(maxR, Math.max(1, layoutMaxGridRow - resizeFixedRowStart + 1));
                    }
                    let { colSpan, rowSpan } = llumenGridSpansFromDelta(
                        ev.clientX - startX,
                        ev.clientY - startY,
                        startCol,
                        startRow,
                        m,
                        maxC,
                        maxR
                    );
                    if (occupancyTileSelector && resizeFixedColStart != null && resizeFixedRowStart != null) {
                        const occ = collectLlumenGridOccupiedCells(
                            gridSurface,
                            occupancyTileSelector,
                            tile,
                            m,
                            layoutMaxGridRow
                        );
                        const clamped = llumenGridClampSpansToOccupancy(
                            occ,
                            resizeFixedColStart,
                            resizeFixedRowStart,
                            colSpan,
                            rowSpan,
                            startCol,
                            startRow
                        );
                        colSpan = clamped.colSpan;
                        rowSpan = clamped.rowSpan;
                    }
                    lastPreviewCol = colSpan;
                    lastPreviewRow = rowSpan;
                    if (rubberBand) {
                        if (colSpan !== lastNotifiedCol || rowSpan !== lastNotifiedRow) {
                            lastNotifiedCol = colSpan;
                            lastNotifiedRow = rowSpan;
                            if (typeof onSpanPreview === 'function') {
                                onSpanPreview({ colSpan, rowSpan, tile });
                            }
                        }
                        syncRubberBand(m, colSpan, rowSpan);
                    } else {
                        applySpan(colSpan, rowSpan);
                    }
                };

                const onPointerUp = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    endSession('commit');
                };

                const onPointerCancel = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    endSession('cancel', 'pointercancel');
                };

                const onLostCapture = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    endSession('cancel', 'lostpointercapture');
                };

                const onVisibilityChange = () => {
                    if (sessionEnded) return;
                    if (tile.ownerDocument.hidden) {
                        endSession('cancel', 'visibility');
                    }
                };

                detachAll = () => {
                    tile.ownerDocument.removeEventListener('visibilitychange', onVisibilityChange);
                    captureRoot.removeEventListener('pointermove', onPointerMove);
                    captureRoot.removeEventListener('pointerup', onPointerUp);
                    captureRoot.removeEventListener('pointercancel', onPointerCancel);
                    captureRoot.removeEventListener('lostpointercapture', onLostCapture);
                };

                if (rubberBand) {
                    previewEl = doc.createElement('div');
                    previewEl.className = 'll-resize-rubber-band';
                    previewEl.setAttribute('aria-hidden', 'true');
                    gridSurface.appendChild(previewEl);
                    syncRubberBand(getMetrics(), startCol, startRow);
                }

                tile.classList.add('ll-grid-span-tile--resizing');
                resizeHandle.classList.add('ll-dnd__capture-target--active');

                try {
                    captureRoot.setPointerCapture(pointerId);
                } catch (e) {
                    /* ignore */
                }

                captureRoot.addEventListener('pointermove', onPointerMove);
                captureRoot.addEventListener('pointerup', onPointerUp);
                captureRoot.addEventListener('pointercancel', onPointerCancel);
                captureRoot.addEventListener('lostpointercapture', onLostCapture);
                tile.ownerDocument.addEventListener('visibilitychange', onVisibilityChange);

                token.onEscape = () => {
                    if (sessionEnded) return;
                    endSession('cancel', 'escape');
                };

                activeEndSession = endSession;
            };

            resizeHandle.addEventListener('pointerdown', pointerDownHandler);

            return {
                destroy() {
                    if (typeof activeEndSession === 'function') {
                        activeEndSession('cancel', 'destroy');
                    }
                    activeEndSession = null;
                    resizeHandle.removeEventListener('pointerdown', pointerDownHandler);
                    tile.classList.remove('ll-grid-span-tile--resizing');
                }
            };
        }

        const LL_BAND_WIDTH_CLASS_RE = /^ll-band-c\d+-u\d+$/;

        /**
         * Apply a single **`.ll-band-c{context}-u{units}`** width token (see **`css/styles.tailwind.css`**).
         * Removes any prior **`ll-band-c*-u*`** class on **`widthElement`**, then adds **`ll-band-c${contextMaxUnits}-u${elementUnits}`**
         * (clamped). Use on **`ll-row-element-container`** (padded shell) or on the unit when no shell exists.
         *
         * @param {HTMLElement} widthElement
         * @param {number} contextMaxUnits — Row budget (must match shipped CSS tokens, typically **2–8**).
         * @param {number} elementUnits
         */
        function setLlumenBandWidthClass(widthElement, contextMaxUnits, elementUnits) {
            if (!widthElement || !widthElement.classList) return;
            const c = Math.max(1, Math.floor(Number(contextMaxUnits)) || 1);
            const u = Math.max(1, Math.min(c, Math.floor(Number(elementUnits)) || 1));
            const list = Array.from(widthElement.classList);
            for (let i = 0; i < list.length; i++) {
                if (LL_BAND_WIDTH_CLASS_RE.test(list[i])) {
                    widthElement.classList.remove(list[i]);
                }
            }
            widthElement.classList.add(`ll-band-c${c}-u${u}`);
        }

        /**
         * SE handle: resize a **flex-row width unit** by integer **units** (e.g. 1–4 columns of a
         * shared `maxUnits` budget). Uses **`registerLlumenResizeInteraction`** (same mutex as grid
         * span resize / `initResizableElement`). **Rubber-band** preview (`.ll-resize-rubber-band`)
         * inside `rowContainer`; **`applyUnits`** runs on **pointer-up** only so heavy content
         * (charts/maps) does not relayout every move.
         *
         * @param {object} options
         * @param {HTMLElement} options.rowContainer — Host for `position: absolute` preview; **`position: relative`**. With defaults, the row is a **flex** row (**no `gap`**); each unit sits in **`ll-row-element-container`** (horizontal padding for gutters). Width uses **`setLlumenBandWidthClass`** (**`ll-band-c{maxUnits}-u{units}`**).
         * @param {HTMLElement} options.unitElement — Inner **`ll-flex-band-unit`** (resize handle lives here).
         * @param {string} options.unitSelector — Query siblings for capacity (e.g. `'.ll-flex-band-unit'`).
         * @param {HTMLElement} [options.resizeHandle] — If omitted, `unitElement.querySelector(resizeHandleSelector)`.
         * @param {string} [options.resizeHandleSelector='.ll-resize-handle--se']
         * @param {number} [options.maxUnits=4]
         * @param {string|null} [options.widthShellSelector='.ll-row-element-container'] — Element that receives **`ll-band-c*-u*`**; **`closest()`** from **`unitElement`**. Pass **`null`** to apply width class on **`unitElement`** itself.
         * @param {(el: HTMLElement) => number} [options.readUnits]
         * @param {(el: HTMLElement, units: number, maxUnits: number) => void} [options.applyUnits] — Default: **`setLlumenBandWidthClass`** on the width shell (or unit), **`dataset.units`**, clears **`grid-column` / legacy flex**.
         * @param {(detail: { units: number, unitElement: HTMLElement }) => void} [options.onWidthPreview]
         * @param {(detail: { units: number, unitElement: HTMLElement }) => void} [options.onWidthCommit]
         * @param {HTMLElement} [options.pointerCaptureTarget]
         */
        function initLlumenFlexBandUnitResize(options = {}) {
            const {
                rowContainer,
                unitElement,
                unitSelector,
                resizeHandle: resizeHandleOpt = null,
                resizeHandleSelector = '.ll-resize-handle--se',
                maxUnits = 4,
                widthShellSelector = '.ll-row-element-container',
                readUnits = (el) => {
                    if (!el || !el.dataset) return 1;
                    return Math.max(1, parseInt(el.dataset.units, 10) || 1);
                },
                applyUnits = null,
                onWidthPreview = null,
                onWidthCommit = null,
                pointerCaptureTarget = null
            } = options;

            if (!rowContainer || !unitElement || !unitSelector) {
                return { destroy() {} };
            }
            if (!rowContainer.contains(unitElement)) {
                return { destroy() {} };
            }

            const resizeHandle = resizeHandleOpt
                || (typeof resizeHandleSelector === 'string'
                    ? unitElement.querySelector(resizeHandleSelector)
                    : resizeHandleSelector);
            if (!resizeHandle || !unitElement.contains(resizeHandle)) {
                return { destroy() {} };
            }
            ensureLlResizeHandleUnfocusable(resizeHandle);

            const resolveWidthElement = (el) => {
                if (widthShellSelector == null || widthShellSelector === '') {
                    return el;
                }
                return el.closest(widthShellSelector) || el;
            };

            const applyUnitsFn = typeof applyUnits === 'function'
                ? applyUnits
                : (el, u, maxU) => {
                    el.dataset.units = String(u);
                    el.style.gridColumn = '';
                    el.style.flex = '';
                    el.style.maxWidth = '';
                    el.style.minWidth = '0';
                    setLlumenBandWidthClass(resolveWidthElement(el), maxU, u);
                };

            const captureRoot = (pointerCaptureTarget && pointerCaptureTarget.nodeType === 1)
                ? pointerCaptureTarget
                : (unitElement.ownerDocument && unitElement.ownerDocument.body) || unitElement;

            let activeEndSession = null;
            let detachAll = null;

            const applyEndFocus = (handleEl) => {
                if (!handleEl || !handleEl.isConnected) return;
                if (handleEl.classList && handleEl.classList.contains('ll-resize-handle--se')) return;
                try {
                    if (typeof handleEl.focus === 'function' && !handleEl.matches(':disabled')) {
                        handleEl.focus({ preventScroll: true });
                    }
                } catch (e) {
                    /* ignore */
                }
            };

            const othersUsedExcluding = (exclude) => {
                const nodes = rowContainer.querySelectorAll(unitSelector);
                let s = 0;
                for (let i = 0; i < nodes.length; i++) {
                    const el = nodes[i];
                    if (!el || el.nodeType !== 1 || el === exclude) continue;
                    s += readUnits(el);
                }
                return s;
            };

            const pointerDownHandler = (startEvent) => {
                if (!startEvent.isPrimary) return;
                if (startEvent.pointerType === 'mouse' && startEvent.button !== 0) return;
                if (typeof detachAll === 'function') return;

                const token = registerLlumenResizeInteraction();
                if (!token) {
                    return;
                }

                startEvent.preventDefault();
                startEvent.stopPropagation();

                const pointerId = startEvent.pointerId;
                const startX = startEvent.clientX;
                const startUnits = readUnits(unitElement);
                const prevUnitsAttr = unitElement.dataset.units;
                const prevFlex = unitElement.style.flex;
                const prevMaxWidth = unitElement.style.maxWidth;
                const prevMinWidth = unitElement.style.minWidth;

                const doc = unitElement.ownerDocument || document;
                const shellEl = resolveWidthElement(unitElement);
                const startShellRect = shellEl.getBoundingClientRect();
                const startShellWidth = Math.max(1, startShellRect.width);
                const startUnitRect = unitElement.getBoundingClientRect();
                const startUnitWidth = Math.max(1, startUnitRect.width);
                /* Band width applies to the shell (border-box); inner unit ≈ shell width minus fixed
                 * horizontal padding. Linear scaling of the unit alone ignores that, so preview > post-commit. */
                const shellPadInlineTotalPx = Math.max(0, startShellWidth - startUnitWidth);
                let previewEl = null;
                let lastPreviewUnits = startUnits;
                let lastNotifiedUnits = startUnits;
                let sessionEnded = false;

                const removeRubberBand = () => {
                    if (previewEl && previewEl.parentNode) {
                        previewEl.parentNode.removeChild(previewEl);
                    }
                    previewEl = null;
                };

                const syncRubberBand = (previewUnits) => {
                    if (!previewEl) return;
                    const unitR = unitElement.getBoundingClientRect();
                    const shellW = startShellWidth * (previewUnits / startUnits);
                    const w = Math.max(1, shellW - shellPadInlineTotalPx);
                    llumenSyncResizeRubberBandFromViewportRect(previewEl, rowContainer, {
                        left: unitR.left,
                        top: unitR.top,
                        width: w,
                        height: unitR.height
                    });
                };

                const restoreUnits = () => {
                    if (prevUnitsAttr != null && prevUnitsAttr !== '') {
                        unitElement.dataset.units = prevUnitsAttr;
                    } else {
                        unitElement.removeAttribute('data-units');
                    }
                    unitElement.style.flex = prevFlex;
                    unitElement.style.maxWidth = prevMaxWidth;
                    unitElement.style.minWidth = prevMinWidth;
                    setLlumenBandWidthClass(resolveWidthElement(unitElement), maxUnits, startUnits);
                };

                const cleanupCaptureAndClass = () => {
                    unitElement.classList.remove('ll-flex-band-unit--resizing');
                    resizeHandle.classList.remove('ll-dnd__capture-target--active');
                    try {
                        if (captureRoot.hasPointerCapture && captureRoot.hasPointerCapture(pointerId)) {
                            captureRoot.releasePointerCapture(pointerId);
                        }
                    } catch (e) {
                        /* ignore */
                    }
                };

                const endSession = (kind) => {
                    if (sessionEnded) return;
                    sessionEnded = true;
                    if (token) {
                        token.onEscape = null;
                    }
                    activeEndSession = null;
                    if (typeof detachAll === 'function') {
                        detachAll();
                        detachAll = null;
                    }
                    cleanupCaptureAndClass();
                    removeRubberBand();
                    try {
                        if (kind === 'commit') {
                            applyUnitsFn(unitElement, lastPreviewUnits, maxUnits);
                            if (typeof onWidthCommit === 'function') {
                                onWidthCommit({ units: lastPreviewUnits, unitElement });
                            }
                        } else {
                            restoreUnits();
                        }
                    } finally {
                        unregisterLlumenActivePointerInteraction(token);
                        applyEndFocus(resizeHandle);
                    }
                };

                const onPointerMove = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    const rowR = rowContainer.getBoundingClientRect();
                    const rw = rowR.width || 1;
                    const unitPx = rw / maxUnits;
                    const deltaUnits = unitPx > 0 ? Math.round((ev.clientX - startX) / unitPx) : 0;
                    const cap = Math.max(1, maxUnits - othersUsedExcluding(unitElement));
                    const next = Math.max(1, Math.min(cap, startUnits + deltaUnits));
                    lastPreviewUnits = next;
                    if (next !== lastNotifiedUnits) {
                        lastNotifiedUnits = next;
                        if (typeof onWidthPreview === 'function') {
                            onWidthPreview({ units: next, unitElement });
                        }
                    }
                    syncRubberBand(next);
                };

                const onPointerUp = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    endSession('commit');
                };

                const onPointerCancel = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    endSession('cancel');
                };

                const onLostCapture = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    endSession('cancel');
                };

                const onVisibilityChange = () => {
                    if (sessionEnded) return;
                    if (unitElement.ownerDocument.hidden) {
                        endSession('cancel');
                    }
                };

                detachAll = () => {
                    unitElement.ownerDocument.removeEventListener('visibilitychange', onVisibilityChange);
                    captureRoot.removeEventListener('pointermove', onPointerMove);
                    captureRoot.removeEventListener('pointerup', onPointerUp);
                    captureRoot.removeEventListener('pointercancel', onPointerCancel);
                    captureRoot.removeEventListener('lostpointercapture', onLostCapture);
                };

                previewEl = doc.createElement('div');
                previewEl.className = 'll-resize-rubber-band';
                previewEl.setAttribute('aria-hidden', 'true');
                rowContainer.appendChild(previewEl);
                syncRubberBand(startUnits);

                unitElement.classList.add('ll-flex-band-unit--resizing');
                resizeHandle.classList.add('ll-dnd__capture-target--active');

                try {
                    captureRoot.setPointerCapture(pointerId);
                } catch (e) {
                    /* ignore */
                }

                captureRoot.addEventListener('pointermove', onPointerMove);
                captureRoot.addEventListener('pointerup', onPointerUp);
                captureRoot.addEventListener('pointercancel', onPointerCancel);
                captureRoot.addEventListener('lostpointercapture', onLostCapture);
                unitElement.ownerDocument.addEventListener('visibilitychange', onVisibilityChange);

                token.onEscape = () => {
                    if (sessionEnded) return;
                    endSession('cancel');
                };

                activeEndSession = endSession;
            };

            resizeHandle.addEventListener('pointerdown', pointerDownHandler);

            return {
                destroy() {
                    if (typeof activeEndSession === 'function') {
                        activeEndSession('cancel');
                    }
                    activeEndSession = null;
                    resizeHandle.removeEventListener('pointerdown', pointerDownHandler);
                    unitElement.classList.remove('ll-flex-band-unit--resizing');
                }
            };
        }

        /**
         * Map viewport rects / client points to coordinates for `position: absolute` children of
         * `mountRoot` (e.g. overflow panel). Use the mount's border-box origin in viewport space only —
         * do not add scrollLeft/scrollTop (absolute layers are anchored to the scrollport, not scrolled
         * document content offsets).
         */
        function llumenViewportRectToMountLocal(mountRoot, vRect) {
            const mr = mountRoot.getBoundingClientRect();
            return {
                left: vRect.left - mr.left,
                top: vRect.top - mr.top,
                width: vRect.width,
                height: vRect.height
            };
        }

        function llumenClientPointToMountLocal(mountRoot, clientX, clientY) {
            const mr = mountRoot.getBoundingClientRect();
            return {
                x: clientX - mr.left,
                y: clientY - mr.top
            };
        }

        function applyLlumenGhostLayoutFromSource(ghostEl, sourceEl) {
            if (!ghostEl || !sourceEl) return;
            const ghostComputed = windowScope.getComputedStyle(sourceEl);
            const disp = ghostComputed.display || 'block';
            ghostEl.style.display = disp;
            if (disp === 'flex' || disp === 'inline-flex') {
                ghostEl.style.flexDirection = ghostComputed.flexDirection;
                ghostEl.style.flexWrap = ghostComputed.flexWrap;
                ghostEl.style.alignItems = ghostComputed.alignItems;
                ghostEl.style.justifyContent = ghostComputed.justifyContent;
                ghostEl.style.gap = ghostComputed.gap;
            }
            ghostEl.style.boxSizing = 'border-box';
            ghostEl.style.minWidth = ghostComputed.minWidth && ghostComputed.minWidth !== '0px'
                ? ghostComputed.minWidth
                : '';
            ghostEl.style.minHeight = ghostComputed.minHeight && ghostComputed.minHeight !== '0px'
                ? ghostComputed.minHeight
                : '';
        }

        /**
         * Grid tile move: shared pointer session (capture, Escape, visibility, auto-scroll) + **ghost** on
         * `document.body` with **`position: fixed`** and viewport `left`/`top` (always cursor-anchored, never
         * clipped by the grid/panel overflow). **Placeholder** stays under **`previewMountRoot`** (default:
         * grid surface) with mirror + overlay; size is at least the snapped cell and at least the tile’s
         * start rect so the wash covers the clone. Source uses `.ll-grid-tile--move-source` (dim only).
         */
        function initGridTilePointerMove(options = {}) {
            const {
                gridSurface,
                tile,
                dragHandle,
                dragIgnoreWithinTileSelector = null,
                resolveMetrics = null,
                maxGridRow = 48,
                scrollRootOriginElement = null,
                previewMountRoot = null,
                pointerCaptureTarget = null,
                ghostStripSelector = null,
                buildGhost = null,
                onMoveCommit = null,
                occupancyTileSelector = null
            } = options;

            const handleEl = dragHandle;
            if (!gridSurface || !tile || !handleEl || !gridSurface.contains(tile) || !tile.contains(handleEl)) {
                return { destroy() {} };
            }

            const docBody = tile.ownerDocument && tile.ownerDocument.body;
            const mountRoot = (previewMountRoot && previewMountRoot.nodeType === 1
                && previewMountRoot.contains(gridSurface))
                ? previewMountRoot
                : gridSurface;

            const getMetrics = typeof resolveMetrics === 'function'
                ? () => resolveMetrics()
                : () => readLlumenGridSurfaceLayout(gridSurface);

            const captureRoot = (pointerCaptureTarget && pointerCaptureTarget.nodeType === 1)
                ? pointerCaptureTarget
                : (tile.ownerDocument && tile.ownerDocument.body) || tile;

            const pointerDownHandler = (startEvent) => {
                if (!startEvent.isPrimary) return;
                if (startEvent.pointerType === 'mouse' && startEvent.button !== 0) return;
                if (llumenActivePointerInteraction) return;
                if (dragIgnoreWithinTileSelector && startEvent.target.closest(dragIgnoreWithinTileSelector)) {
                    return;
                }

                startEvent.preventDefault();
                startEvent.stopPropagation();

                const colSpan = Math.max(1, parseInt(tile.dataset.colSpan, 10) || 1);
                const rowSpan = Math.max(1, parseInt(tile.dataset.rowSpan, 10) || 1);
                const startRect = tile.getBoundingClientRect();
                const ox = startEvent.clientX - startRect.left;
                const oy = startEvent.clientY - startRect.top;
                const ghostW = Math.max(1, Math.ceil(startRect.width));
                const ghostH = Math.max(1, Math.ceil(startRect.height));

                let ghost = null;
                let placeholder = null;
                let lastPointerX = startEvent.clientX;
                let lastPointerY = startEvent.clientY;
                const startClientX = startEvent.clientX;
                const startClientY = startEvent.clientY;
                /* Small move = tap vs drag; larger arm = keep preview on anchor until deliberate motion. */
                const GRID_DRAG_PLACEHOLDER_MOVE_PX = 6;
                const GRID_DRAG_PLACEHOLDER_ARM_PX = 14;
                const mAnchor = getMetrics();
                const anchorPlace = llumenGridAnchorCellFromTile(tile, mAnchor, colSpan, rowSpan, maxGridRow);
                let stickyPlace = anchorPlace;
                let lastPlaceholderPlace = anchorPlace;
                const ghostStartL = startEvent.clientX - ox;
                const ghostStartT = startEvent.clientY - oy;
                const teardownPreview = () => {
                    if (ghost && ghost.parentNode) {
                        ghost.parentNode.removeChild(ghost);
                    }
                    ghost = null;
                    if (placeholder && placeholder.parentNode) {
                        placeholder.parentNode.removeChild(placeholder);
                    }
                    placeholder = null;
                    tile.classList.remove('ll-grid-tile--move-source');
                };

                ghost = typeof buildGhost === 'function'
                    ? buildGhost(tile)
                    : tile.cloneNode(true);
                if (ghost) {
                    sanitizeLlDragDropClone(ghost);
                    if (typeof ghostStripSelector === 'string' && ghostStripSelector) {
                        ghost.querySelectorAll(ghostStripSelector).forEach((n) => n.remove());
                    }
                    ghost.classList.add('ll-dnd__ghost');
                    ghost.classList.remove('ll-dnd__ghost--scroll-mount');
                    applyLlumenGhostLayoutFromSource(ghost, tile);
                    ghost.style.width = `${ghostW}px`;
                    ghost.style.height = `${ghostH}px`;
                    /*
                     * Inline fixed + z-index so the ghost stays visible even if `.ll-dnd__ghost` is missing
                     * from a Tailwind build (class only appears from JS) or loses the cascade to utilities.
                     */
                    ghost.style.position = 'fixed';
                    ghost.style.pointerEvents = 'none';
                    ghost.style.zIndex = '260';
                    ghost.style.opacity = '0.95';
                    ghost.style.boxShadow = '0 14px 28px rgba(0, 0, 0, 0.42)';
                    ghost.style.left = `${startEvent.clientX - ox}px`;
                    ghost.style.top = `${startEvent.clientY - oy}px`;
                    const mountBody = docBody || (tile.ownerDocument && tile.ownerDocument.body);
                    if (mountBody) {
                        mountBody.appendChild(ghost);
                    }
                }

                const doc = tile.ownerDocument;
                placeholder = doc.createElement('div');
                placeholder.className = 'll-dnd__placeholder ll-dnd__placeholder--mirror ll-dnd__placeholder--grid-mount ll-dnd__wash-surface';
                placeholder.style.visibility = 'hidden';
                placeholder.setAttribute('aria-hidden', 'true');
                const mirror = tile.cloneNode(true);
                sanitizeLlDragDropClone(mirror);
                if (typeof ghostStripSelector === 'string' && ghostStripSelector) {
                    mirror.querySelectorAll(ghostStripSelector).forEach((n) => n.remove());
                }
                /*
                 * The live tile is sized by the parent grid; the clone is not a grid item here, so
                 * `grid-column` / `grid-row` would not stretch it — fill the placeholder box explicitly.
                 */
                mirror.style.gridColumn = 'auto';
                mirror.style.gridRow = 'auto';
                mirror.style.gridArea = 'auto';
                mirror.style.width = '100%';
                mirror.style.height = '100%';
                mirror.style.boxSizing = 'border-box';
                mirror.style.maxWidth = '100%';
                mirror.style.maxHeight = '100%';
                /* Clone copies tile inline `z-index` (stacking); wash must paint above the mirror. */
                mirror.style.removeProperty('z-index');
                applyLlumenGhostLayoutFromSource(mirror, tile);
                placeholder.appendChild(mirror);
                mountRoot.appendChild(placeholder);

                /* Dim source only; slot wash is `.ll-dnd__wash-surface::after` on the placeholder host (same as sortable). */
                tile.classList.add('ll-grid-tile--move-source');

                const paintPreview = (clientX, clientY) => {
                    lastPointerX = clientX;
                    lastPointerY = clientY;
                    if (ghost) {
                        ghost.style.left = `${clientX - ox}px`;
                        ghost.style.top = `${clientY - oy}px`;
                    }
                    const m = getMetrics();
                    if (!m || !placeholder || !anchorPlace) return;
                    const occupiedCells = occupancyTileSelector
                        ? collectLlumenGridOccupiedCells(
                            gridSurface,
                            occupancyTileSelector,
                            tile,
                            m,
                            maxGridRow
                        )
                        : null;
                    if (occupiedCells && occupiedCells.size && stickyPlace
                        && !llumenGridFootprintFreeOfOccupied(
                            occupiedCells,
                            stickyPlace.colStart,
                            stickyPlace.rowStart,
                            colSpan,
                            rowSpan
                        )) {
                        stickyPlace = anchorPlace;
                    }
                    /*
                     * Slot preview from ghost viewport rect: max overlap with each valid footprint,
                     * then closest footprint center among ties (not single-point grid floor).
                     */
                    let hasMoved = false;
                    let slotArmPassed = false;
                    let glNum = ghostStartL;
                    let gtNum = ghostStartT;
                    let gwGhost = ghostW;
                    let ghGhost = ghostH;
                    if (ghost && ghost.isConnected) {
                        const gl = parseFloat(ghost.style.left);
                        const gt = parseFloat(ghost.style.top);
                        gwGhost = parseFloat(ghost.style.width) || ghostW;
                        ghGhost = parseFloat(ghost.style.height) || ghostH;
                        glNum = Number.isFinite(gl) ? gl : ghostStartL;
                        gtNum = Number.isFinite(gt) ? gt : ghostStartT;
                        const movedSq = (glNum - ghostStartL) * (glNum - ghostStartL)
                            + (gtNum - ghostStartT) * (gtNum - ghostStartT);
                        const moveTh = GRID_DRAG_PLACEHOLDER_MOVE_PX * GRID_DRAG_PLACEHOLDER_MOVE_PX;
                        const armTh = GRID_DRAG_PLACEHOLDER_ARM_PX * GRID_DRAG_PLACEHOLDER_ARM_PX;
                        hasMoved = movedSq >= moveTh;
                        slotArmPassed = movedSq >= armTh;
                    }

                    let place = null;
                    let dispPlace = anchorPlace;
                    if (hasMoved && ghost && ghost.isConnected) {
                        if (slotArmPassed) {
                            const ghostRect = {
                                left: glNum,
                                top: gtNum,
                                width: gwGhost,
                                height: ghGhost
                            };
                            place = llumenGridPlaceFromGhostRect(
                                ghostRect,
                                m,
                                colSpan,
                                rowSpan,
                                maxGridRow,
                                stickyPlace,
                                occupiedCells
                            );
                            if (place) {
                                stickyPlace = place;
                            }
                            dispPlace = place || stickyPlace;
                        } else {
                            dispPlace = anchorPlace;
                            stickyPlace = anchorPlace;
                        }
                    } else {
                        stickyPlace = anchorPlace;
                    }
                    if (occupiedCells && occupiedCells.size && dispPlace
                        && !llumenGridFootprintFreeOfOccupied(
                            occupiedCells,
                            dispPlace.colStart,
                            dispPlace.rowStart,
                            colSpan,
                            rowSpan
                        )) {
                        dispPlace = llumenGridFootprintFreeOfOccupied(
                            occupiedCells,
                            anchorPlace.colStart,
                            anchorPlace.rowStart,
                            colSpan,
                            rowSpan
                        )
                            ? anchorPlace
                            : null;
                    }
                    if (!dispPlace) {
                        placeholder.style.visibility = 'hidden';
                        return;
                    }
                    const box = llumenGridFootprintViewportRect(
                        m,
                        dispPlace.colStart,
                        dispPlace.rowStart,
                        colSpan,
                        rowSpan
                    );
                    const vw = Math.max(box.width, Math.ceil(startRect.width));
                    const vh = Math.max(box.height, Math.ceil(startRect.height));
                    const expanded = {
                        left: box.left,
                        top: box.top,
                        width: vw,
                        height: vh
                    };
                    const local = llumenViewportRectToMountLocal(mountRoot, expanded);
                    placeholder.style.visibility = 'visible';
                    placeholder.style.left = `${local.left}px`;
                    placeholder.style.top = `${local.top}px`;
                    placeholder.style.width = `${local.width}px`;
                    placeholder.style.height = `${local.height}px`;
                    lastPlaceholderPlace = dispPlace;
                };

                paintPreview(startEvent.clientX, startEvent.clientY);

                const applyGridTileMovePlace = (m, finalPlace) => {
                    if (!finalPlace || !m) return;
                    if (typeof onMoveCommit === 'function') {
                        onMoveCommit({
                            tile,
                            columnStart: finalPlace.colStart,
                            rowStart: finalPlace.rowStart,
                            colSpan,
                            rowSpan
                        });
                    } else {
                        tile.style.gridColumn = `${finalPlace.colStart} / span ${colSpan}`;
                        tile.style.gridRow = `${finalPlace.rowStart} / span ${rowSpan}`;
                    }
                };

                const gridTileMoveSessionStarted = runLlumenPointerDragSession({
                    handleElement: handleEl,
                    pointerCaptureTarget: captureRoot,
                    startEvent,
                    scrollRootOriginElement: scrollRootOriginElement || gridSurface,
                    onMove: ({ clientX, clientY }) => {
                        paintPreview(clientX, clientY);
                    },
                    onCommit: () => {
                        const m = getMetrics();
                        const lastGl = lastPointerX - ox;
                        const lastGt = lastPointerY - oy;
                        const movedSq = (lastGl - ghostStartL) * (lastGl - ghostStartL)
                            + (lastGt - ghostStartT) * (lastGt - ghostStartT);
                        const hasMoved = movedSq >= GRID_DRAG_PLACEHOLDER_MOVE_PX * GRID_DRAG_PLACEHOLDER_MOVE_PX;
                        const armPassed = movedSq
                            >= GRID_DRAG_PLACEHOLDER_ARM_PX * GRID_DRAG_PLACEHOLDER_ARM_PX;
                        teardownPreview();
                        if (!hasMoved || !m || !armPassed) {
                            return;
                        }
                        const ghostAtCommit = {
                            left: lastGl,
                            top: lastGt,
                            width: ghostW,
                            height: ghostH
                        };
                        const occCommit = occupancyTileSelector
                            ? collectLlumenGridOccupiedCells(
                                gridSurface,
                                occupancyTileSelector,
                                tile,
                                m,
                                maxGridRow
                            )
                            : null;
                        const pickFreeCommit = (p) => (
                            p && (!occCommit || !occCommit.size
                                || llumenGridFootprintFreeOfOccupied(
                                    occCommit,
                                    p.colStart,
                                    p.rowStart,
                                    colSpan,
                                    rowSpan
                                ))
                                ? p
                                : null
                        );
                        const finalPlace = pickFreeCommit(llumenGridPlaceFromGhostRect(
                            ghostAtCommit,
                            m,
                            colSpan,
                            rowSpan,
                            maxGridRow,
                            stickyPlace,
                            occCommit
                        ))
                            || pickFreeCommit(stickyPlace)
                            || pickFreeCommit(lastPlaceholderPlace)
                            || pickFreeCommit(anchorPlace);
                        if (finalPlace) {
                            applyGridTileMovePlace(m, finalPlace);
                        }
                    },
                    onCancel: ({ reason } = {}) => {
                        const m = getMetrics();
                        const lastGl = lastPointerX - ox;
                        const lastGt = lastPointerY - oy;
                        const movedSq = (lastGl - ghostStartL) * (lastGl - ghostStartL)
                            + (lastGt - ghostStartT) * (lastGt - ghostStartT);
                        const hadMeaningfulMove = movedSq
                            >= GRID_DRAG_PLACEHOLDER_MOVE_PX * GRID_DRAG_PLACEHOLDER_MOVE_PX;
                        const armPassedCancel = movedSq
                            >= GRID_DRAG_PLACEHOLDER_ARM_PX * GRID_DRAG_PLACEHOLDER_ARM_PX;
                        teardownPreview();
                        /*
                         * Sortable-style: `pointercancel` / `lostpointercapture` often fire when the pointer
                         * leaves a scroll surface or capture is dropped even though the user intended to
                         * drop — commit the last preview slot. Escape / visibility stay a true cancel.
                         */
                        const commitLastPreview = reason === 'pointercancel' || reason === 'lostpointercapture';
                        if (!commitLastPreview || !hadMeaningfulMove || !armPassedCancel || !m || !lastPlaceholderPlace) {
                            return;
                        }
                        const occStale = occupancyTileSelector
                            ? collectLlumenGridOccupiedCells(
                                gridSurface,
                                occupancyTileSelector,
                                tile,
                                m,
                                maxGridRow
                            )
                            : null;
                        if (occStale && occStale.size
                            && !llumenGridFootprintFreeOfOccupied(
                                occStale,
                                lastPlaceholderPlace.colStart,
                                lastPlaceholderPlace.rowStart,
                                colSpan,
                                rowSpan
                            )) {
                            return;
                        }
                        applyGridTileMovePlace(m, lastPlaceholderPlace);
                    }
                });
                if (!gridTileMoveSessionStarted) {
                    teardownPreview();
                }
            };

            handleEl.addEventListener('pointerdown', pointerDownHandler);

            return {
                destroy() {
                    handleEl.removeEventListener('pointerdown', pointerDownHandler);
                }
            };
        }

        /**
         * Wire **SE span resize** and/or **pointer tile move** for tiles in a CSS grid surface.
         *
         * @param {Object} options
         * @param {HTMLElement} options.gridElement — Grid container (`display: grid`); metrics from
         *   `readLlumenGridSurfaceLayout(gridElement)` unless `resolveMetrics` is passed.
         * @param {string} options.tileSelector — Query selector for tile roots inside `gridElement`
         *   (also used as **`occupancyTileSelector`** for resize and move so footprints avoid other tiles).
         * @param {string} [options.resizeHandleSelector='.ll-resize-handle--se'] — Handle within each tile for span resize.
         * @param {string|null} [options.tileMoveHandleSelector=null] — If set, enables pointer move + ghost/placeholder.
         * @param {string|null} [options.tileMoveDragIgnoreSelector=null] — Subtree that should not start a tile drag.
         * @param {number} [options.tileMoveMaxGridRow=48] — Max 1-based row index for placement math (resize + move).
         * @param {string|null} [options.tileMoveGhostStripSelector=null] — Strip width from ghost for hit-tests.
         * @param {HTMLElement|null} [options.tileMoveScrollRoot=null] — Scrollport for auto-scroll during move.
         * @param {HTMLElement|null} [options.tileMovePreviewMountRoot=null] — Where the mirror placeholder mounts.
         * @param {HTMLElement|null} [options.tileMovePointerCaptureTarget=null] — Pointer capture root for move.
         * @param {function|null} [options.tileMoveBuildGhost=null] — Optional custom ghost builder.
         * @param {function|null} [options.tileMoveOnCommit=null] — Called when a tile move commits.
         * **Span resize** (passed through to `initGridTileSpanResize`):
         * @param {number|null} [options.maxColSpan=null] — Hard cap on column span (default: grid column count).
         * @param {number} [options.maxRowSpan=6] — Hard cap on row span (also clamped by `tileMoveMaxGridRow` − row start + 1).
         * @param {function|null} [options.resolveMetrics=null] — `() => metrics` override; default reads `gridElement`.
         * @param {function|null} [options.onSpanPreview=null] — Fires on each resize pointer move with `{ colSpan, rowSpan, tile }`.
         * @param {function|null} [options.onSpanCommit=null] — Fires on successful resize commit.
         * @param {HTMLElement|null} [options.pointerCaptureTarget=null] — Capture root for resize pointer session.
         *
         * **Resize rules:** Once the tile’s **start column/row** is resolved, span cannot extend past the grid
         * edge from that anchor. If other tiles occupy cells, span growth is clamped so the new footprint stays free.
         * With resolved anchors, resize uses a **`.ll-resize-rubber-band`** footprint inside `gridElement` until pointer-up.
         */
        function initGridDropContext(options = {}) {
            const {
                gridElement,
                tileSelector,
                resizeHandleSelector = '.ll-resize-handle--se',
                tileMoveHandleSelector = null,
                tileMoveDragIgnoreSelector = null,
                tileMoveMaxGridRow = 48,
                tileMoveGhostStripSelector = null,
                tileMoveScrollRoot = null,
                tileMovePreviewMountRoot = null,
                tileMovePointerCaptureTarget = null,
                tileMoveBuildGhost = null,
                tileMoveOnCommit = null,
                ...spanOpts
            } = options;

            if (!gridElement || !tileSelector || typeof tileSelector !== 'string') {
                return {
                    destroy() {},
                    wireTile() {}
                };
            }

            const disposers = new Map();

            const wireTile = (tile) => {
                if (!tile || tile.nodeType !== 1 || !gridElement.contains(tile)) return;
                if (disposers.has(tile)) {
                    disposers.get(tile).destroy();
                    disposers.delete(tile);
                }
                const parts = [];
                const rh = tile.querySelector(resizeHandleSelector);
                if (rh) {
                    parts.push(initGridTileSpanResize({
                        gridSurface: gridElement,
                        tile,
                        resizeHandle: rh,
                        ...spanOpts,
                        layoutMaxGridRow: tileMoveMaxGridRow,
                        occupancyTileSelector: tileSelector
                    }));
                }
                if (tileMoveHandleSelector) {
                    const mh = tile.querySelector(tileMoveHandleSelector);
                    if (mh) {
                        parts.push(initGridTilePointerMove({
                            gridSurface: gridElement,
                            tile,
                            dragHandle: mh,
                            dragIgnoreWithinTileSelector: tileMoveDragIgnoreSelector,
                            maxGridRow: tileMoveMaxGridRow,
                            ghostStripSelector: tileMoveGhostStripSelector,
                            scrollRootOriginElement: tileMoveScrollRoot || gridElement,
                            previewMountRoot: tileMovePreviewMountRoot,
                            pointerCaptureTarget: tileMovePointerCaptureTarget,
                            buildGhost: tileMoveBuildGhost,
                            onMoveCommit: tileMoveOnCommit,
                            occupancyTileSelector: tileSelector
                        }));
                    }
                }
                if (!parts.length) return;
                disposers.set(tile, {
                    destroy() {
                        parts.forEach((p) => {
                            if (p && typeof p.destroy === 'function') p.destroy();
                        });
                    }
                });
            };

            const destroy = () => {
                disposers.forEach((d) => {
                    if (d && typeof d.destroy === 'function') d.destroy();
                });
                disposers.clear();
            };

            gridElement.querySelectorAll(tileSelector).forEach(wireTile);

            return { destroy, wireTile };
        }

        /**
         * Reads each **grid tile** under **`gridElement`** into a serializable list (placement + spans).
         * **`columnCount`** mirrors **`readLlumenGridSurfaceLayout`**. Row/column starts prefer explicit
         * **`grid-column` / `grid-row`** shorthands, then computed line starts, then **`llumenGridAnchorCellFromTile`**.
         *
         * @param {HTMLElement} gridElement
         * @param {object} [config]
         * @param {string} config.tileSelector
         * @param {(el: HTMLElement) => string} [config.getTileId]
         * @param {(el: HTMLElement) => object|void} [config.readTileExtras]
         * @param {number} [config.maxGridRow=48]
         * @returns {{ columnCount: number, tiles: Array<{ tileId: string, colStart: number, rowStart: number, colSpan: number, rowSpan: number, zIndex?: number }> }}
         */
        function readLlumenGridTilesModelFromHost(gridElement, config = {}) {
            const {
                tileSelector,
                getTileId = (el) => (el.id != null && String(el.id).trim() ? String(el.id).trim() : ''),
                readTileExtras = null,
                maxGridRow = 48
            } = config;

            if (!gridElement || gridElement.nodeType !== 1 || typeof tileSelector !== 'string' || !tileSelector.trim()) {
                return { columnCount: 1, tiles: [] };
            }

            const metrics = readLlumenGridSurfaceLayout(gridElement);
            const columnCount = metrics && Number.isFinite(metrics.columnCount)
                ? Math.max(1, metrics.columnCount)
                : 1;

            const tiles = [];
            try {
                gridElement.querySelectorAll(tileSelector).forEach((el) => {
                    if (!el || el.nodeType !== 1) return;
                    if (typeof el.closest === 'function' && el.closest('.ll-dnd__placeholder')) return;
                    const colSpan = Math.max(1, parseInt(el.dataset.colSpan, 10) || 1);
                    const rowSpan = Math.max(1, parseInt(el.dataset.rowSpan, 10) || 1);
                    let colStart = llumenGridParseShorthandAxisStart(el.style.gridColumn);
                    let rowStart = llumenGridParseShorthandAxisStart(el.style.gridRow);
                    if (colStart == null || rowStart == null) {
                        try {
                            const csp = windowScope.getComputedStyle(el);
                            if (colStart == null) {
                                colStart = llumenGridParseComputedAxisStart(csp.gridColumnStart);
                            }
                            if (rowStart == null) {
                                rowStart = llumenGridParseComputedAxisStart(csp.gridRowStart);
                            }
                        } catch (e) {
                            /* ignore */
                        }
                    }
                    if ((colStart == null || rowStart == null) && metrics) {
                        const anchor = llumenGridAnchorCellFromTile(el, metrics, colSpan, rowSpan, maxGridRow);
                        if (anchor) {
                            if (colStart == null) colStart = anchor.colStart;
                            if (rowStart == null) rowStart = anchor.rowStart;
                        }
                    }
                    colStart = Math.max(1, colStart == null ? 1 : colStart);
                    rowStart = Math.max(1, rowStart == null ? 1 : rowStart);
                    const entry = {
                        tileId: (typeof getTileId === 'function' ? getTileId(el) : '') || '',
                        colStart,
                        rowStart,
                        colSpan,
                        rowSpan
                    };
                    const zi = parseInt(el.style.zIndex, 10);
                    if (Number.isFinite(zi)) entry.zIndex = zi;
                    if (typeof readTileExtras === 'function') {
                        try {
                            const ex = readTileExtras(el);
                            if (ex && typeof ex === 'object') {
                                Object.assign(entry, ex);
                            }
                        } catch (e2) {
                            /* ignore */
                        }
                    }
                    tiles.push(entry);
                });
            } catch (e3) {
                return { columnCount, tiles: [] };
            }
            return { columnCount, tiles };
        }

        /**
         * Adapts a **grid tiles** snapshot to a new **column count**: clamps spans, then places each tile in
         * **`(rowStart, colStart)`** order on a fresh occupancy map so **no two tiles share a cell**.
         * When the preferred anchor overlaps, scans **`1..maxGridRow`** × columns for the first free slot;
         * may shrink **`colSpan` / `rowSpan`** as a last resort (down to **1**).
         *
         * @param {{ columnCount?: number, tiles: object[] }} model
         * @param {number} nextColumnCount — Target column track count (**≥ 1**).
         * @param {{ maxGridRow?: number }} [options]
         * @returns {{ columnCount: number, tiles: object[] }}
         */
        function adaptLlumenGridTilesModelToColumnCount(model, nextColumnCount, options = {}) {
            const colCount = Math.max(1, parseInt(nextColumnCount, 10) || 1);
            const maxGridRow = Math.max(1, Number(options.maxGridRow) || 128);
            const tilesIn = Array.isArray(model && model.tiles) ? model.tiles.slice() : [];
            tilesIn.sort((a, b) => {
                const ra = (parseInt(a && a.rowStart, 10) || 1) - (parseInt(b && b.rowStart, 10) || 1);
                if (ra !== 0) return ra;
                return (parseInt(a && a.colStart, 10) || 1) - (parseInt(b && b.colStart, 10) || 1);
            });
            const occupied = new Set();
            const mark = (c0, r0, cs, rs) => {
                for (let rj = r0; rj < r0 + rs; rj += 1) {
                    for (let ci = c0; ci < c0 + cs; ci += 1) {
                        occupied.add(`${ci},${rj}`);
                    }
                }
            };
            const tryPlace = (t, cs, rs, c0, r0) => {
                if (cs < 1 || rs < 1) return null;
                if (c0 < 1 || r0 < 1) return null;
                if (c0 > colCount - cs + 1) return null;
                if (!llumenGridFootprintFreeOfOccupied(occupied, c0, r0, cs, rs)) return null;
                mark(c0, r0, cs, rs);
                return { ...t, colSpan: cs, rowSpan: rs, colStart: c0, rowStart: r0 };
            };
            const out = [];
            for (let ti = 0; ti < tilesIn.length; ti += 1) {
                const t = tilesIn[ti];
                if (!t || typeof t !== 'object') continue;
                let rs = Math.max(1, parseInt(t.rowSpan, 10) || 1);
                let cs = Math.max(1, parseInt(t.colSpan, 10) || 1);
                cs = Math.min(cs, colCount);
                const preferR = Math.max(1, parseInt(t.rowStart, 10) || 1);
                const preferC = Math.max(1, Math.min(parseInt(t.colStart, 10) || 1, colCount - cs + 1));
                let placed = tryPlace(t, cs, rs, preferC, preferR);
                if (!placed) {
                    outer: for (let r = 1; r <= maxGridRow; r += 1) {
                        for (let c = 1; c <= colCount - cs + 1; c += 1) {
                            placed = tryPlace(t, cs, rs, c, r);
                            if (placed) break outer;
                        }
                    }
                }
                if (!placed) {
                    let cTry = cs;
                    let rTry = rs;
                    while (cTry >= 1 && rTry >= 1 && !placed) {
                        for (let r = 1; r <= maxGridRow && !placed; r += 1) {
                            for (let c = 1; c <= colCount - cTry + 1; c += 1) {
                                placed = tryPlace(t, cTry, rTry, c, r);
                                if (placed) break;
                            }
                        }
                        if (!placed) {
                            if (cTry > 1) {
                                cTry -= 1;
                            } else if (rTry > 1) {
                                rTry -= 1;
                            } else {
                                break;
                            }
                        }
                    }
                }
                if (!placed) {
                    for (let r = 1; r <= maxGridRow; r += 1) {
                        for (let c = 1; c <= colCount; c += 1) {
                            placed = tryPlace(t, 1, 1, c, r);
                            if (placed) break;
                        }
                        if (placed) break;
                    }
                }
                if (placed) {
                    out.push(placed);
                }
            }
            return { columnCount: colCount, tiles: out };
        }

        /**
         * Removes every **`tileSelector`** match under **`gridElement`**, then appends **`renderGridTile`**
         * results for each **`model.tiles`** entry (in order). Does **not** re-wire **`initGridDropContext`** —
         * use **`initGridTileModelContext`** **`applyGridTilesModel`** or call **`initGridDropContext`** again afterward.
         *
         * @param {HTMLElement} gridElement
         * @param {{ tiles: object[] }} model
         * @param {object} config
         * @param {string} config.tileSelector
         * @param {function(object, number, Document): HTMLElement} config.renderGridTile
         * @returns {boolean}
         */
        function writeLlumenGridTilesModelToHost(gridElement, model, config = {}) {
            const { tileSelector, renderGridTile } = config;
            if (!gridElement || gridElement.nodeType !== 1) return false;
            if (typeof tileSelector !== 'string' || !tileSelector.trim()) return false;
            if (typeof renderGridTile !== 'function') return false;
            if (!model || typeof model !== 'object' || !Array.isArray(model.tiles)) return false;

            const doc = gridElement.ownerDocument || document;
            const sel = tileSelector.trim();
            try {
                gridElement.querySelectorAll(sel).forEach((n) => {
                    if (!n || n.nodeType !== 1) return;
                    if (typeof n.closest === 'function' && n.closest('.ll-dnd__placeholder')) return;
                    n.remove();
                });
            } catch (e) {
                return false;
            }

            const list = model.tiles;
            for (let i = 0; i < list.length; i += 1) {
                const entry = list[i];
                if (!entry || typeof entry !== 'object') continue;
                let el;
                try {
                    el = renderGridTile(entry, i, doc);
                } catch (e2) {
                    continue;
                }
                if (!el || el.nodeType !== 1) continue;
                gridElement.appendChild(el);
            }
            return true;
        }

        /**
         * Same options as **`initGridDropContext`**, plus optional **tile model** I/O. When **`renderGridTile`**
         * is set, **`applyGridTilesModel`** destroys the grid context, **`writeLlumenGridTilesModelToHost`**, and
         * re-initializes **`initGridDropContext`** (re-wires every tile).
         *
         * @param {object} options — Passed to **`initGridDropContext`** after removing **`getTileId`**, **`readTileExtras`**, **`renderGridTile`**, **`onAfterSync`**.
         * @param {(el: HTMLElement) => string} [options.getTileId]
         * @param {(el: HTMLElement) => object|void} [options.readTileExtras]
         * @param {function(object, number, Document): HTMLElement} [options.renderGridTile]
         * @param {function({ columnCount: number, tiles: object[] }): void} [options.onAfterSync]
         * @returns {{ destroy: function(): void, wireTile: function(HTMLElement): void, getGridTilesModel: function(): object, applyGridTilesModel: function((object))|null }}
         */
        function initGridTileModelContext(options = {}) {
            const {
                getTileId = (el) => (el.id != null && String(el.id).trim() ? String(el.id).trim() : ''),
                readTileExtras = null,
                renderGridTile = null,
                onAfterSync = null,
                ...dropOpts
            } = options;

            const {
                gridElement,
                tileSelector,
                tileMoveMaxGridRow = 48
            } = dropOpts;

            if (!gridElement || gridElement.nodeType !== 1 || typeof tileSelector !== 'string' || !tileSelector.trim()) {
                return {
                    destroy() {},
                    wireTile() {},
                    getGridTilesModel() {
                        return { columnCount: 1, tiles: [] };
                    },
                    applyGridTilesModel: null
                };
            }

            let core = initGridDropContext(dropOpts);

            const readCfg = () => ({
                tileSelector: tileSelector.trim(),
                getTileId,
                readTileExtras,
                maxGridRow: tileMoveMaxGridRow
            });

            const getGridTilesModel = () => readLlumenGridTilesModelFromHost(gridElement, readCfg());

            const destroy = () => {
                core.destroy();
            };

            const wireTile = (t) => {
                core.wireTile(t);
            };

            const applyGridTilesModel = (typeof renderGridTile === 'function')
                ? (model) => {
                    let restoreHandleTileId = '';
                    try {
                        const activeEl = gridElement.ownerDocument && gridElement.ownerDocument.activeElement;
                        if (activeEl instanceof windowScope.HTMLElement) {
                            const activeTile = activeEl.closest(tileSelector.trim());
                            if (activeTile && gridElement.contains(activeTile)) {
                                restoreHandleTileId = String(getTileId(activeTile) || '').trim();
                            }
                        }
                    } catch (e) {
                        restoreHandleTileId = '';
                    }
                    core.destroy();
                    writeLlumenGridTilesModelToHost(gridElement, model, {
                        tileSelector: tileSelector.trim(),
                        renderGridTile
                    });
                    core = initGridDropContext(dropOpts);
                    if (typeof onAfterSync === 'function') {
                        try {
                            onAfterSync(getGridTilesModel());
                        } catch (e) {
                            /* ignore */
                        }
                    }
                    if (
                        restoreHandleTileId
                        && typeof dropOpts.tileMoveHandleSelector === 'string'
                        && dropOpts.tileMoveHandleSelector.trim()
                    ) {
                        windowScope.requestAnimationFrame(() => {
                            const tiles = gridElement.querySelectorAll(tileSelector.trim());
                            for (let i = 0; i < tiles.length; i += 1) {
                                const tile = tiles[i];
                                if (String(getTileId(tile) || '').trim() !== restoreHandleTileId) continue;
                                const handle = tile.querySelector(dropOpts.tileMoveHandleSelector);
                                if (!handle || typeof handle.focus !== 'function') break;
                                try {
                                    if (!handle.matches(':disabled')) {
                                        handle.focus({ preventScroll: true });
                                    }
                                } catch (focusError) {
                                    /* ignore */
                                }
                                break;
                            }
                        });
                    }
                }
                : null;

            if (typeof onAfterSync === 'function') {
                try {
                    onAfterSync(getGridTilesModel());
                } catch (e2) {
                    /* ignore */
                }
            }

            return { destroy, wireTile, getGridTilesModel, applyGridTilesModel };
        }

        /**
         * SE corner resize with Pointer Events. Mutual exclusion with drag-sort: starting resize while a
         * drag session is active (or vice versa) is a no-op (Session invariant 8).
         */
        function initResizableElement(options = {}) {
            const {
                element,
                handleSelector = '.ll-resize-handle--se',
                minWidth = 1,
                maxWidth = Number.POSITIVE_INFINITY,
                minHeight = 1,
                maxHeight = Number.POSITIVE_INFINITY,
                snapX = null,
                snapY = null,
                transitionMs = 160,
                transitionEasing = 'ease-out',
                onResize = null,
                onSessionEnd = null,
                pointerCaptureTarget = null
            } = options;

            const el = element;
            if (!el || el.nodeType !== 1) {
                return { destroy() {} };
            }

            const handleEl = typeof handleSelector === 'string'
                ? el.querySelector(handleSelector)
                : handleSelector;
            if (!handleEl || !el.contains(handleEl)) {
                return { destroy() {} };
            }
            ensureLlResizeHandleUnfocusable(handleEl);

            const captureRoot = (pointerCaptureTarget && pointerCaptureTarget.nodeType === 1)
                ? pointerCaptureTarget
                : (el.ownerDocument && el.ownerDocument.body) || el;

            const clampDim = (v, minV, maxV) => {
                let x = v;
                if (typeof minV === 'number' && Number.isFinite(minV)) {
                    x = Math.max(minV, x);
                }
                if (typeof maxV === 'number' && Number.isFinite(maxV)) {
                    x = Math.min(maxV, x);
                }
                return x;
            };

            const snapDim = (v, snap) => {
                if (snap == null || !Number.isFinite(snap) || snap <= 0) {
                    return Math.round(v);
                }
                return Math.round(v / snap) * snap;
            };

            const prefersReducedMotion = () => {
                try {
                    return !!(
                        windowScope.matchMedia
                        && windowScope.matchMedia('(prefers-reduced-motion: reduce)').matches
                    );
                } catch (err) {
                    return false;
                }
            };

            const applyEndFocus = (reason) => {
                if (typeof onSessionEnd === 'function') {
                    onSessionEnd({ reason, handleElement: handleEl });
                    return;
                }
                if (!handleEl || !handleEl.isConnected) return;
                if (handleEl.classList && handleEl.classList.contains('ll-resize-handle--se')) return;
                try {
                    if (typeof handleEl.focus === 'function' && !handleEl.matches(':disabled')) {
                        handleEl.focus({ preventScroll: true });
                    }
                } catch (e) {
                    /* ignore */
                }
            };

            let sessionEnded = true;
            let activeEndSession = null;
            let detachAll = null;

            const pointerDownHandler = (startEvent) => {
                if (!startEvent.isPrimary) return;
                if (startEvent.pointerType === 'mouse' && startEvent.button !== 0) return;
                if (!sessionEnded) return;
                const token = registerLlumenResizeInteraction();
                if (!token) {
                    return;
                }
                startEvent.preventDefault();
                startEvent.stopPropagation();

                const pointerId = startEvent.pointerId;
                sessionEnded = false;

                const startX = startEvent.clientX;
                const startY = startEvent.clientY;
                const startRect = el.getBoundingClientRect();
                const startW = startRect.width;
                const startH = startRect.height;
                const prevInlineWidth = el.style.width;
                const prevInlineHeight = el.style.height;

                const restoreInlineSize = () => {
                    el.style.width = prevInlineWidth;
                    el.style.height = prevInlineHeight;
                };

                const applyPxSize = (w, h) => {
                    el.style.width = `${Math.round(w)}px`;
                    el.style.height = `${Math.round(h)}px`;
                };

                el.classList.add('ll-resizable--dragging');
                handleEl.classList.add('ll-dnd__capture-target--active');

                const cleanupCaptureAndClass = () => {
                    handleEl.classList.remove('ll-dnd__capture-target--active');
                    el.classList.remove('ll-resizable--dragging');
                    try {
                        if (captureRoot.hasPointerCapture && captureRoot.hasPointerCapture(pointerId)) {
                            captureRoot.releasePointerCapture(pointerId);
                        }
                    } catch (e) {
                        /* ignore */
                    }
                };

                const endSession = (kind, cancelReason) => {
                    if (sessionEnded) return;
                    sessionEnded = true;
                    if (token) {
                        token.onEscape = null;
                    }
                    activeEndSession = null;
                    if (typeof detachAll === 'function') {
                        detachAll();
                        detachAll = null;
                    }
                    cleanupCaptureAndClass();
                    try {
                        if (kind === 'commit') {
                            const r = el.getBoundingClientRect();
                            if (typeof onResize === 'function') {
                                onResize({
                                    width: Math.round(r.width),
                                    height: Math.round(r.height),
                                    element: el
                                });
                            }
                        } else {
                            restoreInlineSize();
                        }
                    } finally {
                        unregisterLlumenPointerDragInteraction(token);
                        applyEndFocus(kind === 'commit' ? 'commit' : 'cancel');
                    }
                };

                const onPointerMove = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    const dx = ev.clientX - startX;
                    const dy = ev.clientY - startY;
                    let w = clampDim(startW + dx, minWidth, maxWidth);
                    let h = clampDim(startH + dy, minHeight, maxHeight);
                    w = snapDim(w, snapX);
                    h = snapDim(h, snapY);
                    w = clampDim(w, minWidth, maxWidth);
                    h = clampDim(h, minHeight, maxHeight);
                    applyPxSize(w, h);
                };

                const onPointerUp = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    endSession('commit');
                };

                const onPointerCancel = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    endSession('cancel', 'pointercancel');
                };

                const onLostCapture = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    endSession('cancel', 'lostpointercapture');
                };

                const onVisibilityChange = () => {
                    if (sessionEnded) return;
                    if (el.ownerDocument.hidden) {
                        endSession('cancel', 'visibility');
                    }
                };

                detachAll = () => {
                    el.ownerDocument.removeEventListener('visibilitychange', onVisibilityChange);
                    captureRoot.removeEventListener('pointermove', onPointerMove);
                    captureRoot.removeEventListener('pointerup', onPointerUp);
                    captureRoot.removeEventListener('pointercancel', onPointerCancel);
                    captureRoot.removeEventListener('lostpointercapture', onLostCapture);
                };

                try {
                    captureRoot.setPointerCapture(pointerId);
                } catch (e) {
                    /* ignore */
                }

                captureRoot.addEventListener('pointermove', onPointerMove);
                captureRoot.addEventListener('pointerup', onPointerUp);
                captureRoot.addEventListener('pointercancel', onPointerCancel);
                captureRoot.addEventListener('lostpointercapture', onLostCapture);
                el.ownerDocument.addEventListener('visibilitychange', onVisibilityChange);

                token.onEscape = () => {
                    if (sessionEnded) return;
                    endSession('cancel', 'escape');
                };

                activeEndSession = endSession;
            };

            el.classList.add('ll-resizable');
            if (prefersReducedMotion()) {
                el.style.setProperty('--ll-resize-transition-duration', '0ms');
            } else {
                el.style.setProperty('--ll-resize-transition-duration', `${transitionMs}ms`);
            }
            el.style.setProperty('--ll-resize-transition-easing', transitionEasing);

            handleEl.addEventListener('pointerdown', pointerDownHandler);

            return {
                destroy() {
                    if (typeof activeEndSession === 'function') {
                        activeEndSession('cancel', 'destroy');
                    }
                    activeEndSession = null;
                    handleEl.removeEventListener('pointerdown', pointerDownHandler);
                    el.classList.remove('ll-resizable', 'll-resizable--dragging');
                    el.style.removeProperty('--ll-resize-transition-duration');
                    el.style.removeProperty('--ll-resize-transition-easing');
                }
            };
        }

        /**
         * SE **freeform** resize on a 2D surface (artboard / “canvas” context): **pixel** width and height,
         * optional snap (`snapX` / `snapY`), default **no** snap. Uses **`.ll-resize-rubber-band`** inside
         * `hostElement` during the gesture; **`targetElement`** size applies on **pointer-up** so heavy
         * content (charts/maps) does not relayout every move. `hostElement` should be **`position: relative`**.
         *
         * @param {object} options
         * @param {HTMLElement} options.hostElement — Mount for the rubber-band preview.
         * @param {HTMLElement} options.targetElement — Box whose `width` / `height` (px) are updated on commit.
         * @param {HTMLElement} [options.resizeHandle] — If omitted, `targetElement.querySelector(resizeHandleSelector)`.
         * @param {string} [options.resizeHandleSelector='.ll-resize-handle--se']
         * @param {number} [options.minWidth=1]
         * @param {number} [options.maxWidth]
         * @param {number} [options.minHeight=1]
         * @param {number} [options.maxHeight]
         * @param {number|null} [options.snapX=null]
         * @param {number|null} [options.snapY=null]
         * @param {(target: HTMLElement, width: number, height: number) => void} [options.applySize] — Default sets inline px `width` / `height`.
         * @param {(detail: { width: number, height: number, targetElement: HTMLElement }) => void} [options.onSizePreview]
         * @param {(detail: { width: number, height: number, targetElement: HTMLElement }) => void} [options.onSizeCommit]
         * @param {HTMLElement} [options.pointerCaptureTarget]
         */
        function initLlumenSurfaceFreeformResize(options = {}) {
            const {
                hostElement,
                targetElement,
                resizeHandle: resizeHandleOpt = null,
                resizeHandleSelector = '.ll-resize-handle--se',
                minWidth = 1,
                maxWidth = Number.POSITIVE_INFINITY,
                minHeight = 1,
                maxHeight = Number.POSITIVE_INFINITY,
                snapX = null,
                snapY = null,
                applySize = null,
                onSizePreview = null,
                onSizeCommit = null,
                pointerCaptureTarget = null
            } = options;

            if (!hostElement || !targetElement || !hostElement.contains(targetElement)) {
                return { destroy() {} };
            }

            const resizeHandle = resizeHandleOpt
                || (typeof resizeHandleSelector === 'string'
                    ? targetElement.querySelector(resizeHandleSelector)
                    : resizeHandleSelector);
            if (!resizeHandle || !targetElement.contains(resizeHandle)) {
                return { destroy() {} };
            }
            ensureLlResizeHandleUnfocusable(resizeHandle);

            const captureRoot = (pointerCaptureTarget && pointerCaptureTarget.nodeType === 1)
                ? pointerCaptureTarget
                : (targetElement.ownerDocument && targetElement.ownerDocument.body) || targetElement;

            const clampDim = (v, minV, maxV) => {
                let x = v;
                if (typeof minV === 'number' && Number.isFinite(minV)) {
                    x = Math.max(minV, x);
                }
                if (typeof maxV === 'number' && Number.isFinite(maxV)) {
                    x = Math.min(maxV, x);
                }
                return x;
            };

            const snapDim = (v, snap) => {
                if (snap == null || !Number.isFinite(snap) || snap <= 0) {
                    return Math.round(v);
                }
                return Math.round(v / snap) * snap;
            };

            const applySizeFn = typeof applySize === 'function'
                ? applySize
                : (el, w, h) => {
                    el.style.width = `${Math.round(w)}px`;
                    el.style.height = `${Math.round(h)}px`;
                };

            let activeEndSession = null;
            let detachAll = null;

            const applyEndFocus = (handleEl) => {
                if (!handleEl || !handleEl.isConnected) return;
                if (handleEl.classList && handleEl.classList.contains('ll-resize-handle--se')) return;
                try {
                    if (typeof handleEl.focus === 'function' && !handleEl.matches(':disabled')) {
                        handleEl.focus({ preventScroll: true });
                    }
                } catch (e) {
                    /* ignore */
                }
            };

            const pointerDownHandler = (startEvent) => {
                if (!startEvent.isPrimary) return;
                if (startEvent.pointerType === 'mouse' && startEvent.button !== 0) return;
                if (typeof detachAll === 'function') return;

                const token = registerLlumenResizeInteraction();
                if (!token) {
                    return;
                }

                startEvent.preventDefault();
                startEvent.stopPropagation();

                const pointerId = startEvent.pointerId;
                const startX = startEvent.clientX;
                const startY = startEvent.clientY;
                const startRect = targetElement.getBoundingClientRect();
                const startW = startRect.width;
                const startH = startRect.height;
                const startViewport = {
                    left: startRect.left,
                    top: startRect.top,
                    width: startW,
                    height: startH
                };
                const prevInlineWidth = targetElement.style.width;
                const prevInlineHeight = targetElement.style.height;

                const doc = targetElement.ownerDocument || document;
                let previewEl = null;
                let lastPreviewW = startW;
                let lastPreviewH = startH;
                let lastNotifiedW = startW;
                let lastNotifiedH = startH;
                let sessionEnded = false;

                const removeRubberBand = () => {
                    if (previewEl && previewEl.parentNode) {
                        previewEl.parentNode.removeChild(previewEl);
                    }
                    previewEl = null;
                };

                const syncRubberBand = (w, h) => {
                    if (!previewEl) return;
                    llumenSyncResizeRubberBandFromViewportRect(previewEl, hostElement, {
                        left: startViewport.left,
                        top: startViewport.top,
                        width: w,
                        height: h
                    });
                };

                const restoreSize = () => {
                    targetElement.style.width = prevInlineWidth;
                    targetElement.style.height = prevInlineHeight;
                };

                const cleanupCaptureAndClass = () => {
                    targetElement.classList.remove('ll-surface-item--resizing');
                    resizeHandle.classList.remove('ll-dnd__capture-target--active');
                    try {
                        if (captureRoot.hasPointerCapture && captureRoot.hasPointerCapture(pointerId)) {
                            captureRoot.releasePointerCapture(pointerId);
                        }
                    } catch (e) {
                        /* ignore */
                    }
                };

                const endSession = (kind) => {
                    if (sessionEnded) return;
                    sessionEnded = true;
                    if (token) {
                        token.onEscape = null;
                    }
                    activeEndSession = null;
                    if (typeof detachAll === 'function') {
                        detachAll();
                        detachAll = null;
                    }
                    cleanupCaptureAndClass();
                    removeRubberBand();
                    try {
                        if (kind === 'commit') {
                            applySizeFn(targetElement, lastPreviewW, lastPreviewH);
                            if (typeof onSizeCommit === 'function') {
                                onSizeCommit({
                                    width: Math.round(lastPreviewW),
                                    height: Math.round(lastPreviewH),
                                    targetElement
                                });
                            }
                        } else {
                            restoreSize();
                        }
                    } finally {
                        unregisterLlumenPointerDragInteraction(token);
                        applyEndFocus(resizeHandle);
                    }
                };

                const onPointerMove = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    const dx = ev.clientX - startX;
                    const dy = ev.clientY - startY;
                    let w = clampDim(startW + dx, minWidth, maxWidth);
                    let h = clampDim(startH + dy, minHeight, maxHeight);
                    w = snapDim(w, snapX);
                    h = snapDim(h, snapY);
                    w = clampDim(w, minWidth, maxWidth);
                    h = clampDim(h, minHeight, maxHeight);
                    lastPreviewW = w;
                    lastPreviewH = h;
                    if (w !== lastNotifiedW || h !== lastNotifiedH) {
                        lastNotifiedW = w;
                        lastNotifiedH = h;
                        if (typeof onSizePreview === 'function') {
                            onSizePreview({
                                width: Math.round(w),
                                height: Math.round(h),
                                targetElement
                            });
                        }
                    }
                    syncRubberBand(w, h);
                };

                const onPointerUp = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    endSession('commit');
                };

                const onPointerCancel = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    endSession('cancel');
                };

                const onLostCapture = (ev) => {
                    if (sessionEnded) return;
                    if (ev.pointerId !== pointerId) return;
                    endSession('cancel');
                };

                const onVisibilityChange = () => {
                    if (sessionEnded) return;
                    if (targetElement.ownerDocument.hidden) {
                        endSession('cancel');
                    }
                };

                detachAll = () => {
                    targetElement.ownerDocument.removeEventListener('visibilitychange', onVisibilityChange);
                    captureRoot.removeEventListener('pointermove', onPointerMove);
                    captureRoot.removeEventListener('pointerup', onPointerUp);
                    captureRoot.removeEventListener('pointercancel', onPointerCancel);
                    captureRoot.removeEventListener('lostpointercapture', onLostCapture);
                };

                previewEl = doc.createElement('div');
                previewEl.className = 'll-resize-rubber-band ll-resize-rubber-band--continuous';
                previewEl.setAttribute('aria-hidden', 'true');
                hostElement.appendChild(previewEl);
                syncRubberBand(startW, startH);

                targetElement.classList.add('ll-surface-item--resizing');
                resizeHandle.classList.add('ll-dnd__capture-target--active');

                try {
                    captureRoot.setPointerCapture(pointerId);
                } catch (e) {
                    /* ignore */
                }

                captureRoot.addEventListener('pointermove', onPointerMove);
                captureRoot.addEventListener('pointerup', onPointerUp);
                captureRoot.addEventListener('pointercancel', onPointerCancel);
                captureRoot.addEventListener('lostpointercapture', onLostCapture);
                targetElement.ownerDocument.addEventListener('visibilitychange', onVisibilityChange);

                token.onEscape = () => {
                    if (sessionEnded) return;
                    endSession('cancel');
                };

                activeEndSession = endSession;
            };

            resizeHandle.addEventListener('pointerdown', pointerDownHandler);

            return {
                destroy() {
                    if (typeof activeEndSession === 'function') {
                        activeEndSession('cancel');
                    }
                    activeEndSession = null;
                    resizeHandle.removeEventListener('pointerdown', pointerDownHandler);
                    targetElement.classList.remove('ll-surface-item--resizing');
                }
            };
        }

        /**
         * @param {HTMLElement|null|undefined} el
         * @param {(el: HTMLElement) => unknown} [getItemId]
         * @returns {string|null}
         */
        function readLlumenSurfacePlacedItemId(el, getItemId) {
            if (!el || el.nodeType !== 1) return null;
            if (typeof getItemId === 'function') {
                try {
                    const raw = getItemId(el);
                    const s = raw == null ? '' : String(raw).trim();
                    return s || null;
                } catch (e) {
                    return null;
                }
            }
            const attr = el.getAttribute('data-ll-surface-item-id');
            const s = attr == null ? '' : String(attr).trim();
            return s || null;
        }

        /**
         * @param {HTMLElement} itemElement
         * @param {HTMLElement[]} dragPeers
         * @param {(el: HTMLElement) => unknown} [getItemId]
         * @returns {{ ids: string[], id: string|null }}
         */
        function buildLlumenSurfacePlacedDragIdPayload(itemElement, dragPeers, getItemId) {
            const ids = [];
            const seen = new Set();
            for (let i = 0; i < dragPeers.length; i++) {
                const sid = readLlumenSurfacePlacedItemId(dragPeers[i], getItemId);
                if (!sid || seen.has(sid)) continue;
                seen.add(sid);
                ids.push(sid);
            }
            const id = readLlumenSurfacePlacedItemId(itemElement, getItemId);
            return { ids, id };
        }

        /**
         * **Pointer-drag** for an absolutely positioned item on a 2D surface (artboard / “canvas”):
         * **`runLlumenPointerDragSession`** (capture, Escape, visibility, edge auto-scroll). The **item
         * node** is moved live (**`style.left` / `style.top`**), matching workflow-style canvas UX (no
         * separate fixed ghost). **`.ll-dnd__source--dragging`** + **`.ll-surface-item--dragging`** on the
         * item during the gesture. Mutually exclusive with **resize** (`registerLlumenResizeInteraction`).
         *
         * @param {object} options
         * @param {HTMLElement} options.surfaceElement — Positioned ancestor (`position: relative` typical); `itemElement` lives inside it.
         * @param {HTMLElement} options.itemElement — `position: absolute`; `style.left` / `style.top` updated during move and on commit.
         * @param {string} [options.dragIgnoreWithinItemSelector='.ll-resize-handle--se'] — `closest()` guard on `pointerdown` target.
         * @param {HTMLElement|null} [options.scrollRootOriginElement=null] — Auto-scroll roots (default: `surfaceElement`).
         * @param {HTMLElement|null} [options.pointerCaptureTarget=null]
         * @param {number} [options.padMin=8] — Clamp inset from surface content edges.
         * @param {(primary: HTMLElement) => HTMLElement[]} [options.getDragPeers=null] — Return every surface item that should receive the **same** pointer delta (e.g. multi-select). Defaults to **`[itemElement]`**. Elements must stay inside **`surfaceElement`**.
         * @param {(el: HTMLElement) => unknown} [options.getItemId=null] — Map each placed item to a stable string id. When omitted, ids are read from **`data-ll-surface-item-id`** on each element. Used to populate **`ids`** / **`id`** on commit and cancel.
         * @param {(detail: { itemElement: HTMLElement, left: number, top: number, dragPeers: HTMLElement[], ids: string[], id: string|null }) => void} [options.onDragCommit] — **`dragPeers`** is every item that moved (including **`itemElement`**). **`ids`** lists each peer’s id once, in peer order (deduped). **`id`** is the primary **`itemElement`** id.
         * @param {(detail: { itemElement: HTMLElement, dragPeers: HTMLElement[], ids: string[], id: string|null }) => void} [options.onDragCancel]
         */
        function initLlumenSurfacePlacedItemDrag(options = {}) {
            const {
                surfaceElement,
                itemElement,
                dragIgnoreWithinItemSelector = '.ll-resize-handle--se',
                scrollRootOriginElement = null,
                pointerCaptureTarget = null,
                padMin = 8,
                getDragPeers = null,
                getItemId = null,
                onDragCommit = null,
                onDragCancel = null
            } = options;

            if (!surfaceElement || !itemElement || !surfaceElement.contains(itemElement)) {
                return { destroy() {} };
            }

            const captureRoot = (pointerCaptureTarget && pointerCaptureTarget.nodeType === 1)
                ? pointerCaptureTarget
                : (itemElement.ownerDocument && itemElement.ownerDocument.body) || itemElement;

            const scrollRoot = (scrollRootOriginElement && scrollRootOriginElement.nodeType === 1)
                ? scrollRootOriginElement
                : surfaceElement;

            const pointerDownHandler = (startEvent) => {
                if (!startEvent.isPrimary) return;
                if (startEvent.pointerType === 'mouse' && startEvent.button !== 0) return;
                if (dragIgnoreWithinItemSelector && startEvent.target.closest(dragIgnoreWithinItemSelector)) {
                    return;
                }

                startEvent.preventDefault();
                startEvent.stopPropagation();

                let dragPeers = [itemElement];
                if (typeof getDragPeers === 'function') {
                    try {
                        const raw = getDragPeers(itemElement);
                        if (Array.isArray(raw) && raw.length > 0) {
                            const seen = new Set();
                            dragPeers = [];
                            for (let i = 0; i < raw.length; i++) {
                                const el = raw[i];
                                if (!el || el.nodeType !== 1) continue;
                                if (!surfaceElement.contains(el)) continue;
                                if (seen.has(el)) continue;
                                seen.add(el);
                                dragPeers.push(el);
                            }
                        }
                    } catch (e) {
                        dragPeers = [itemElement];
                    }
                }
                if (dragPeers.length === 0) {
                    dragPeers = [itemElement];
                }
                let primaryInPeers = false;
                for (let j = 0; j < dragPeers.length; j++) {
                    if (dragPeers[j] === itemElement) {
                        primaryInPeers = true;
                        break;
                    }
                }
                if (!primaryInPeers) {
                    dragPeers = [itemElement];
                }

                const peerStarts = dragPeers.map((el) => ({
                    el,
                    startLeft: parseFloat(el.style.left) || 0,
                    startTop: parseFloat(el.style.top) || 0
                }));

                let lastClientX = startEvent.clientX;
                let lastClientY = startEvent.clientY;

                const clampToSurface = (el, nx, ny) => {
                    const maxX = Math.max(
                        padMin,
                        surfaceElement.scrollWidth - el.offsetWidth - padMin
                    );
                    const maxY = Math.max(
                        padMin,
                        surfaceElement.scrollHeight - el.offsetHeight - padMin
                    );
                    return {
                        left: Math.max(padMin, Math.min(maxX, nx)),
                        top: Math.max(padMin, Math.min(maxY, ny))
                    };
                };

                const applyPositionFromPointer = (clientX, clientY) => {
                    const dx = clientX - startEvent.clientX;
                    const dy = clientY - startEvent.clientY;
                    let primaryLeft = parseFloat(itemElement.style.left) || 0;
                    let primaryTop = parseFloat(itemElement.style.top) || 0;
                    for (let i = 0; i < peerStarts.length; i++) {
                        const { el, startLeft, startTop } = peerStarts[i];
                        const { left, top } = clampToSurface(el, startLeft + dx, startTop + dy);
                        el.style.left = `${left}px`;
                        el.style.top = `${top}px`;
                        if (el === itemElement) {
                            primaryLeft = left;
                            primaryTop = top;
                        }
                    }
                    return { left: primaryLeft, top: primaryTop };
                };

                const endDragClasses = () => {
                    for (let i = 0; i < dragPeers.length; i++) {
                        dragPeers[i].classList.remove('ll-dnd__source--dragging', 'll-surface-item--dragging');
                    }
                };

                runLlumenPointerDragSession({
                    handleElement: itemElement,
                    pointerCaptureTarget: captureRoot,
                    startEvent,
                    scrollRootOriginElement: scrollRoot,
                    onAfterStart: () => {
                        for (let i = 0; i < dragPeers.length; i++) {
                            dragPeers[i].classList.add('ll-dnd__source--dragging', 'll-surface-item--dragging');
                        }
                        applyPositionFromPointer(startEvent.clientX, startEvent.clientY);
                    },
                    onMove: ({ clientX, clientY }) => {
                        lastClientX = clientX;
                        lastClientY = clientY;
                        applyPositionFromPointer(clientX, clientY);
                    },
                    onCommit: () => {
                        endDragClasses();
                        const { left: nx, top: ny } = applyPositionFromPointer(lastClientX, lastClientY);
                        if (typeof onDragCommit === 'function') {
                            const { ids, id } = buildLlumenSurfacePlacedDragIdPayload(
                                itemElement,
                                dragPeers,
                                getItemId
                            );
                            onDragCommit({
                                itemElement,
                                left: nx,
                                top: ny,
                                dragPeers,
                                ids,
                                id
                            });
                        }
                    },
                    onCancel: () => {
                        endDragClasses();
                        for (let i = 0; i < peerStarts.length; i++) {
                            const { el, startLeft, startTop } = peerStarts[i];
                            el.style.left = `${startLeft}px`;
                            el.style.top = `${startTop}px`;
                        }
                        if (typeof onDragCancel === 'function') {
                            const { ids, id } = buildLlumenSurfacePlacedDragIdPayload(
                                itemElement,
                                dragPeers,
                                getItemId
                            );
                            onDragCancel({ itemElement, dragPeers, ids, id });
                        }
                    }
                });
            };

            itemElement.addEventListener('pointerdown', pointerDownHandler);

            return {
                destroy() {
                    itemElement.removeEventListener('pointerdown', pointerDownHandler);
                }
            };
        }

        /**
         * Reads **absolutely positioned** items under **`surfaceElement`** matching **`itemSelector`**
         * (typically **`position: absolute`** canvas nodes). Positions use **`style.left` / `style.top`** (px);
         * sizes use **`offsetWidth` / `offsetHeight`** at read time.
         *
         * @param {HTMLElement} surfaceElement
         * @param {object} config
         * @param {string} config.itemSelector
         * @param {(el: HTMLElement) => string} [config.getItemId] — Defaults to **`data-ll-surface-item-id`** when omitted.
         * @param {(el: HTMLElement) => object|void} [config.readItemExtras]
         * @returns {{ items: Array<{ id: string, left: number, top: number, width: number, height: number }> }}
         */
        function readLlumenSurfacePlacedItemsModelFromHost(surfaceElement, config = {}) {
            const {
                itemSelector,
                getItemId: getItemIdOpt = null,
                readItemExtras = null
            } = config;

            const getItemId = typeof getItemIdOpt === 'function'
                ? getItemIdOpt
                : (el) => {
                    if (!el || el.nodeType !== 1) return '';
                    const attr = el.getAttribute('data-ll-surface-item-id');
                    const s = attr == null ? '' : String(attr).trim();
                    return s;
                };

            if (!surfaceElement || surfaceElement.nodeType !== 1 || typeof itemSelector !== 'string' || !itemSelector.trim()) {
                return { items: [] };
            }

            const items = [];
            try {
                surfaceElement.querySelectorAll(itemSelector.trim()).forEach((el) => {
                    if (!el || el.nodeType !== 1) return;
                    const id = (typeof getItemId === 'function' ? getItemId(el) : '') || '';
                    const left = parseFloat(el.style.left) || 0;
                    const top = parseFloat(el.style.top) || 0;
                    const width = Math.max(1, el.offsetWidth || 1);
                    const height = Math.max(1, el.offsetHeight || 1);
                    const entry = { id, left, top, width, height };
                    if (typeof readItemExtras === 'function') {
                        try {
                            const ex = readItemExtras(el);
                            if (ex && typeof ex === 'object') {
                                Object.assign(entry, ex);
                            }
                        } catch (e) {
                            /* ignore */
                        }
                    }
                    items.push(entry);
                });
            } catch (e2) {
                return { items: [] };
            }
            return { items };
        }

        /**
         * Removes every **`itemSelector`** match under **`surfaceElement`**, then appends **`renderPlacedItem`**
         * results. Does **not** attach drag/resize — use **`applyLlumenSurfacePlacedItemsModel`** with **`afterApply`**
         * or wire **`initLlumenSurfacePlacedItemDrag`** yourself.
         *
         * @param {HTMLElement} surfaceElement
         * @param {{ items: object[] }} model
         * @param {object} config
         * @param {string} config.itemSelector
         * @param {function(object, number, Document): HTMLElement} config.renderPlacedItem
         * @returns {boolean}
         */
        function writeLlumenSurfacePlacedItemsModelToHost(surfaceElement, model, config = {}) {
            const { itemSelector, renderPlacedItem } = config;
            if (!surfaceElement || surfaceElement.nodeType !== 1) return false;
            if (typeof itemSelector !== 'string' || !itemSelector.trim()) return false;
            if (typeof renderPlacedItem !== 'function') return false;
            if (!model || typeof model !== 'object' || !Array.isArray(model.items)) return false;

            const doc = surfaceElement.ownerDocument || document;
            const sel = itemSelector.trim();
            try {
                surfaceElement.querySelectorAll(sel).forEach((n) => {
                    if (n && n.nodeType === 1) n.remove();
                });
            } catch (e) {
                return false;
            }

            const list = model.items;
            for (let i = 0; i < list.length; i += 1) {
                const entry = list[i];
                if (!entry || typeof entry !== 'object') continue;
                let el;
                try {
                    el = renderPlacedItem(entry, i, doc);
                } catch (e2) {
                    continue;
                }
                if (!el || el.nodeType !== 1) continue;
                surfaceElement.appendChild(el);
            }
            return true;
        }

        /**
         * **`writeLlumenSurfacePlacedItemsModelToHost`** then optional **`afterApply(surfaceElement)`** (e.g. re-run
         * **`initLlumenSurfacePlacedItemDrag`** / resize on each new node).
         *
         * @param {HTMLElement} surfaceElement
         * @param {{ items: object[] }} model
         * @param {object} config
         * @param {string} config.itemSelector
         * @param {function(object, number, Document): HTMLElement} config.renderPlacedItem
         * @param {function(HTMLElement): void} [config.afterApply]
         */
        function applyLlumenSurfacePlacedItemsModel(surfaceElement, model, config = {}) {
            const { afterApply, ...writeCfg } = config;
            const ok = writeLlumenSurfacePlacedItemsModelToHost(surfaceElement, model, writeCfg);
            if (ok && typeof afterApply === 'function') {
                try {
                    afterApply(surfaceElement);
                } catch (e) {
                    /* ignore */
                }
            }
            return ok;
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

            const moveItemToIndexByKey = (targetStateOwner, targetItemsKey, movedItemId, targetIndex) => {
                if (!targetStateOwner || !Array.isArray(targetStateOwner[targetItemsKey])) return;
                const fromIndex = targetStateOwner[targetItemsKey].findIndex((entry) => entry.id === movedItemId);
                if (fromIndex < 0) return;
                const boundedTargetIndex = Math.max(0, Math.min(targetIndex, targetStateOwner[targetItemsKey].length - 1));
                if (fromIndex === boundedTargetIndex) return;
                const [moved] = targetStateOwner[targetItemsKey].splice(fromIndex, 1);
                targetStateOwner[targetItemsKey].splice(boundedTargetIndex, 0, moved);
            };

            const syncCardListHeadings = () => {
                const headingEls = cardsList.querySelectorAll('.ll-dragdrop-card-list__card-heading');
                headingEls.forEach((headingEl, headingIndex) => {
                    headingEl.textContent = `${itemHeadingLabel} ${headingIndex + 1}`;
                });
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

            items.forEach((item, index) => {
                const itemId = item && item.id ? item.id : `${instanceId}-item-${index}`;
                const showDragAction = items.length > 1;
                const showDeleteAction = items.length > 1 || allowEmptyItems;
                const cardBlock = document.createElement('div');
                cardBlock.className = 'll-card';
                cardBlock.dataset.cardItemId = itemId;
                cardBlock.draggable = false;
                cardBlock.innerHTML = `
                    <div class="ll-card__header">
                        <div class="ll-card__title-section">
                            <div class="ll-card__title-wrap">
                                <span class="ll-card__title ll-dragdrop-card-list__card-heading">${escapeHtml(itemHeadingLabel)} ${index + 1}</span>
                            </div>
                        </div>
                        ${(showDragAction || showDeleteAction) ? `
                            <div class="ll-card__header-actions">
                                ${showDeleteAction ? `
                                    <div class="ll-card__header-action">
                                        <div class="ll-card__header-action-content">
                                            <button type="button"
                                                class="ll-icon-btn node-config-card-delete"
                                                data-delete-card-item-id="${escapeHtml(itemId)}">
                                                <span class="material-symbols-outlined ll-icon-btn__icon">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ` : ''}
                                ${showDragAction ? `
                                    <div class="ll-card__header-action">
                                        <div class="ll-card__header-action-content">
                                            <button type="button"
                                                class="ll-icon-btn ll-dragdrop-card-list__drag-handle"
                                                data-drag-card-item-id="${escapeHtml(itemId)}">
                                                <span class="material-symbols-outlined ll-icon-btn__icon">drag_indicator</span>
                                            </button>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <div class="ll-card__content" data-card-item-body="true"></div>
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

            initVerticalSortableList({
                container: cardsList,
                itemSelector: '[data-card-item-id]',
                handleSelector: '.ll-dragdrop-card-list__drag-handle',
                getItemId: (el) => el.dataset.cardItemId || '',
                minItemsForDrag: 2,
                onReorder: (movedId, targetIndex) => {
                    moveItemToIndexByKey(stateOwner, itemsKey, movedId, targetIndex);
                    syncCardListHeadings();
                }
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

        const llumenOverlayEscapeState = {
            modalStack: [],
            dropdownStack: [],
            inlineEditStack: [],
            escapeKeyListenerAttached: false,
            nextModalDomIdCounter: 0,
            nextInlineEditDomIdCounter: 0,
            bodyScrollLockActive: false,
            bodyScrollLockPreviousPaddingRight: ''
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

        function isPlainObject(value) {
            if (!value || typeof value !== 'object') return false;
            if (value instanceof windowScope.Node) return false;
            if (Array.isArray(value)) return false;
            return Object.prototype.toString.call(value) === '[object Object]';
        }

        function normalizeModalFooterConfig(resolvedFooterContent) {
            const fallback = {
                content: null,
                actions: resolvedFooterContent,
                spreadActions: false
            };
            if (!isPlainObject(resolvedFooterContent)) return fallback;
            const hasStructuredFooterKeys = (
                Object.prototype.hasOwnProperty.call(resolvedFooterContent, 'content')
                || Object.prototype.hasOwnProperty.call(resolvedFooterContent, 'nonActionContent')
                || Object.prototype.hasOwnProperty.call(resolvedFooterContent, 'actions')
                || Object.prototype.hasOwnProperty.call(resolvedFooterContent, 'startActions')
                || Object.prototype.hasOwnProperty.call(resolvedFooterContent, 'endActions')
                || Object.prototype.hasOwnProperty.call(resolvedFooterContent, 'layout')
                || Object.prototype.hasOwnProperty.call(resolvedFooterContent, 'spreadActions')
            );
            if (!hasStructuredFooterKeys) return fallback;

            const content = (
                Object.prototype.hasOwnProperty.call(resolvedFooterContent, 'content')
                    ? resolvedFooterContent.content
                    : resolvedFooterContent.nonActionContent
            );
            let actions = resolvedFooterContent.actions;
            if (
                actions === undefined
                && (
                    Object.prototype.hasOwnProperty.call(resolvedFooterContent, 'startActions')
                    || Object.prototype.hasOwnProperty.call(resolvedFooterContent, 'endActions')
                )
            ) {
                actions = {
                    start: resolvedFooterContent.startActions,
                    end: resolvedFooterContent.endActions
                };
            }
            const normalizedLayout = String(resolvedFooterContent.layout || '').trim().toLowerCase();
            const spreadActions = resolvedFooterContent.spreadActions === true
                || normalizedLayout === 'spread'
                || normalizedLayout === 'wizard';
            return {
                content: content === undefined ? null : content,
                actions: actions === undefined ? null : actions,
                spreadActions
            };
        }

        function renderModalFooterContent(footerRoot, footerActionsSlot, content, controller, footerContentSlotRef = null) {
            if (!footerRoot || !footerActionsSlot) return;
            footerRoot.classList.remove('ll-modal__footer--with-content', 'll-modal__footer--actions-spread');
            footerActionsSlot.innerHTML = '';

            const resolvedContent = resolveModalContent(content, controller);
            const footerConfig = normalizeModalFooterConfig(resolvedContent);
            let footerContentSlot = footerContentSlotRef && footerContentSlotRef.current
                ? footerContentSlotRef.current
                : null;

            if (footerContentSlot) {
                footerContentSlot.innerHTML = '';
            }
            if (footerConfig.content !== null && footerConfig.content !== undefined && footerConfig.content !== false) {
                if (!footerContentSlot) {
                    footerContentSlot = document.createElement('div');
                    footerContentSlot.className = 'll-modal__footer-content';
                    footerRoot.insertBefore(footerContentSlot, footerActionsSlot);
                    if (footerContentSlotRef) {
                        footerContentSlotRef.current = footerContentSlot;
                    }
                }
                appendModalContent(footerContentSlot, footerConfig.content);
                if (footerContentSlot.hasChildNodes()) {
                    footerRoot.classList.add('ll-modal__footer--with-content');
                } else {
                    footerContentSlot.remove();
                    if (footerContentSlotRef) footerContentSlotRef.current = null;
                    footerContentSlot = null;
                }
            } else if (footerContentSlot) {
                footerContentSlot.remove();
                if (footerContentSlotRef) footerContentSlotRef.current = null;
                footerContentSlot = null;
            }

            if (isPlainObject(footerConfig.actions) && (
                Object.prototype.hasOwnProperty.call(footerConfig.actions, 'start')
                || Object.prototype.hasOwnProperty.call(footerConfig.actions, 'end')
            )) {
                const startWrap = document.createElement('div');
                startWrap.className = 'll-modal__footer-actions-start';
                appendModalContent(startWrap, footerConfig.actions.start);

                const endWrap = document.createElement('div');
                endWrap.className = 'll-modal__footer-actions-end';
                appendModalContent(endWrap, footerConfig.actions.end);

                if (startWrap.hasChildNodes() || endWrap.hasChildNodes()) {
                    footerActionsSlot.appendChild(startWrap);
                    footerActionsSlot.appendChild(endWrap);
                }
            } else {
                appendModalContent(footerActionsSlot, footerConfig.actions);
            }

            if (footerConfig.spreadActions) {
                footerRoot.classList.add('ll-modal__footer--actions-spread');
            }
        }

        function syncOverlayModalStackLayout() {
            llumenOverlayEscapeState.modalStack.forEach((activeController, stackIndex) => {
                if (!activeController || !activeController.root) return;
                const root = activeController.root;
                root.style.zIndex = String(120 + (stackIndex * 2));
                root.style.setProperty('--ll-modal-stack-depth', String(stackIndex + 1));
            });
            syncOverlayBodyScrollLock();
        }

        function shouldLockBodyScrollForModal(controller) {
            if (!controller || !controller.options) return false;
            if (controller.options.lockBodyScroll !== true) return false;
            if (!(controller.options.appendTo instanceof windowScope.HTMLElement)) return false;
            if (controller.options.appendTo !== document.body) return false;
            if (!controller.root || controller.root.ownerDocument !== document) return false;
            return true;
        }

        function applyOverlayBodyScrollLock() {
            if (llumenOverlayEscapeState.bodyScrollLockActive) return;
            const body = document.body;
            const documentElement = document.documentElement;
            if (!(body instanceof windowScope.HTMLElement) || !(documentElement instanceof windowScope.HTMLElement)) return;
            llumenOverlayEscapeState.bodyScrollLockPreviousPaddingRight = body.style.paddingRight || '';
            body.classList.add('ll-body-scroll-locked');
            const scrollbarWidth = Math.max(0, windowScope.innerWidth - documentElement.clientWidth);
            if (scrollbarWidth > 0) {
                const computedPaddingRight = Number.parseFloat(windowScope.getComputedStyle(body).paddingRight || '0') || 0;
                body.style.paddingRight = `${computedPaddingRight + scrollbarWidth}px`;
            }
            llumenOverlayEscapeState.bodyScrollLockActive = true;
        }

        function releaseOverlayBodyScrollLock() {
            if (!llumenOverlayEscapeState.bodyScrollLockActive) return;
            const body = document.body;
            if (!(body instanceof windowScope.HTMLElement)) {
                llumenOverlayEscapeState.bodyScrollLockActive = false;
                llumenOverlayEscapeState.bodyScrollLockPreviousPaddingRight = '';
                return;
            }
            body.classList.remove('ll-body-scroll-locked');
            if (llumenOverlayEscapeState.bodyScrollLockPreviousPaddingRight) {
                body.style.paddingRight = llumenOverlayEscapeState.bodyScrollLockPreviousPaddingRight;
            } else {
                body.style.removeProperty('padding-right');
            }
            llumenOverlayEscapeState.bodyScrollLockActive = false;
            llumenOverlayEscapeState.bodyScrollLockPreviousPaddingRight = '';
        }

        function syncOverlayBodyScrollLock() {
            const hasScrollLockingModal = llumenOverlayEscapeState.modalStack.some((entry) => shouldLockBodyScrollForModal(entry));
            if (hasScrollLockingModal) {
                applyOverlayBodyScrollLock();
                return;
            }
            releaseOverlayBodyScrollLock();
        }

        function removeOverlayModalController(controller) {
            const index = llumenOverlayEscapeState.modalStack.indexOf(controller);
            if (index >= 0) {
                llumenOverlayEscapeState.modalStack.splice(index, 1);
            }
            syncOverlayModalStackLayout();
        }

        function pushOverlayModalController(controller) {
            removeOverlayModalController(controller);
            llumenOverlayEscapeState.modalStack.push(controller);
            syncOverlayModalStackLayout();
        }

        function removeOverlayDropdownEntry(dropdownKey) {
            const normalizedKey = String(dropdownKey || '').trim();
            if (!normalizedKey) return;
            const index = llumenOverlayEscapeState.dropdownStack.findIndex((entry) => entry && entry.key === normalizedKey);
            if (index >= 0) {
                llumenOverlayEscapeState.dropdownStack.splice(index, 1);
            }
        }

        function pushOverlayDropdownEntry(dropdownEntry) {
            if (!dropdownEntry || !dropdownEntry.key) return;
            removeOverlayDropdownEntry(dropdownEntry.key);
            llumenOverlayEscapeState.dropdownStack.push(dropdownEntry);
        }

        function removeOverlayInlineEditEntry(inlineEditKey) {
            const normalizedKey = String(inlineEditKey || '').trim();
            if (!normalizedKey) return;
            const index = llumenOverlayEscapeState.inlineEditStack.findIndex((entry) => entry && entry.key === normalizedKey);
            if (index >= 0) {
                llumenOverlayEscapeState.inlineEditStack.splice(index, 1);
            }
        }

        function pushOverlayInlineEditEntry(inlineEditEntry) {
            if (!inlineEditEntry || !inlineEditEntry.key) return;
            removeOverlayInlineEditEntry(inlineEditEntry.key);
            llumenOverlayEscapeState.inlineEditStack.push(inlineEditEntry);
        }

        function getTopOpenOverlayInlineEdit() {
            for (let index = llumenOverlayEscapeState.inlineEditStack.length - 1; index >= 0; index -= 1) {
                const entry = llumenOverlayEscapeState.inlineEditStack[index];
                if (!entry || typeof entry.cancel !== 'function') continue;
                if (typeof entry.isOpen === 'function' && entry.isOpen() !== true) {
                    llumenOverlayEscapeState.inlineEditStack.splice(index, 1);
                    continue;
                }
                return entry;
            }
            return null;
        }

        function getTopOpenOverlayDropdown() {
            for (let index = llumenOverlayEscapeState.dropdownStack.length - 1; index >= 0; index -= 1) {
                const entry = llumenOverlayEscapeState.dropdownStack[index];
                if (!entry || typeof entry.close !== 'function') continue;
                if (typeof entry.isOpen === 'function' && entry.isOpen() !== true) {
                    llumenOverlayEscapeState.dropdownStack.splice(index, 1);
                    continue;
                }
                return entry;
            }
            return null;
        }

        function getTopOpenOverlayModal() {
            for (let index = llumenOverlayEscapeState.modalStack.length - 1; index >= 0; index -= 1) {
                const entry = llumenOverlayEscapeState.modalStack[index];
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

        function getOverlayModalFocusTrapContainers(modalController) {
            if (!modalController || !modalController.root) return [];
            const containers = [];
            if (modalController.content) {
                containers.push(modalController.content);
            } else {
                containers.push(modalController.root);
            }

            llumenOverlayEscapeState.dropdownStack.forEach((entry, stackIndex) => {
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

        function trapTabFocusInTopOverlayModal(event) {
            const topModal = getTopOpenOverlayModal();
            if (!topModal) return;
            if (topModal.options && topModal.options.mode === 'seamless') return;
            const containers = getOverlayModalFocusTrapContainers(topModal);
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

        function focusFirstElementInOverlayModal(modalController) {
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

            const containers = getOverlayModalFocusTrapContainers(modalController);
            if (containers.length === 0) return;
            const focusableElements = getFocusableElements(containers);
            const targetElement = focusableElements[0] || modalController.content || modalController.root;
            if (!targetElement || typeof targetElement.focus !== 'function') return;
            if (!targetElement.hasAttribute('tabindex') && (targetElement === modalController.content || targetElement === modalController.root)) {
                targetElement.setAttribute('tabindex', '-1');
            }
            targetElement.focus();
        }

        function ensureLlumenOverlayEscapeKeyHandler() {
            if (llumenOverlayEscapeState.escapeKeyListenerAttached) return;
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Tab') {
                    trapTabFocusInTopOverlayModal(event);
                    return;
                }
                if (event.key !== 'Escape') return;
                const activePointer = llumenActivePointerInteraction;
                if (activePointer && typeof activePointer.onEscape === 'function') {
                    try {
                        activePointer.onEscape();
                    } catch (e) {
                        /* ignore */
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
                const topDropdown = getTopOpenOverlayDropdown();
                if (topDropdown) {
                    event.preventDefault();
                    event.stopPropagation();
                    topDropdown.close();
                    return;
                }
                const topInlineEdit = getTopOpenOverlayInlineEdit();
                if (topInlineEdit) {
                    event.preventDefault();
                    event.stopPropagation();
                    topInlineEdit.cancel();
                    return;
                }
                const topModal = getTopOpenOverlayModal();
                if (!topModal || typeof topModal.close !== 'function') return;
                if (!topModal.options || topModal.options.closeOnEsc !== true) return;
                event.preventDefault();
                event.stopPropagation();
                topModal.close('escape');
            }, true);
            llumenOverlayEscapeState.escapeKeyListenerAttached = true;
        }

        ensureLlumenOverlayEscapeKeyHandler();

        function initializeModal(userOptions = {}) {
            ensureLlumenOverlayEscapeKeyHandler();

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
                id: userOptions.id || `ll-modal-${++llumenOverlayEscapeState.nextModalDomIdCounter}`,
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
                lockBodyScroll: userOptions.lockBodyScroll !== undefined
                    ? Boolean(userOptions.lockBodyScroll)
                    : mode !== 'seamless',
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
            let footerContentSlotRef = { current: null };
            let footerActionsSlot = null;
            if (options.footerContent !== null && options.footerContent !== undefined) {
                footer = document.createElement('div');
                footer.className = 'll-modal__footer';
                footerActionsSlot = document.createElement('div');
                footerActionsSlot.className = 'll-modal__footer-actions';
                footer.appendChild(footerActionsSlot);
                content.appendChild(footer);
            }

            let closeTimeoutId = null;
            let isOpen = false;
            let destroyed = false;
            let closeDecisionPromise = null;

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
                footerContentSlotRef,
                footerActionsSlot,
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
                        pushOverlayModalController(controller);
                        return controller;
                    }

                    root.classList.remove('hidden', 'll-modal--closing');
                    root.setAttribute('aria-hidden', 'false');
                    pushOverlayModalController(controller);
                    requestAnimationFrame(() => {
                        root.classList.add('ll-modal--open');
                        const activeElement = document.activeElement;
                        const focusInsideModal = activeElement instanceof windowScope.HTMLElement
                            && root.contains(activeElement);
                        if (!focusInsideModal) {
                            focusFirstElementInOverlayModal(controller);
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
                    if (closeDecisionPromise) return Promise.resolve(false);

                    closeDecisionPromise = Promise.resolve().then(() => {
                        if (!options.onRequestClose) return true;
                        return options.onRequestClose({ controller, reason });
                    });

                    return closeDecisionPromise
                        .catch((error) => {
                            console.warn('[LlumenComponents.initializeModal] onRequestClose() failed:', error);
                            return false;
                        })
                        .then((requestCloseResult) => {
                            closeDecisionPromise = null;
                            if (requestCloseResult === false || destroyed || !isOpen) {
                                return false;
                            }

                            isOpen = false;
                            root.classList.remove('ll-modal--open');
                            root.classList.add('ll-modal--closing');
                            /*
                             * Avoid aria-hidden on an ancestor of the focused node (browser warning + a11y):
                             * e.g. seamless drawer closes from a click on a list row that still holds focus.
                             */
                            try {
                                const active = root.ownerDocument && root.ownerDocument.activeElement;
                                if (active && typeof active.blur === 'function' && root.contains(active)) {
                                    active.blur();
                                }
                            } catch (e) {
                                /* ignore */
                            }
                            root.setAttribute('aria-hidden', 'true');
                            removeOverlayModalController(controller);

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
                        });
                },
                destroy: () => {
                    if (destroyed) return;
                    if (closeTimeoutId) {
                        window.clearTimeout(closeTimeoutId);
                        closeTimeoutId = null;
                    }
                    closeDecisionPromise = null;
                    removeOverlayModalController(controller);
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
                        footerActionsSlot = document.createElement('div');
                        footerActionsSlot.className = 'll-modal__footer-actions';
                        footer.appendChild(footerActionsSlot);
                        content.appendChild(footer);
                        controller.footer = footer;
                        controller.footerContentSlotRef = footerContentSlotRef;
                        controller.footerActionsSlot = footerActionsSlot;
                    }
                    if (footer && footerActionsSlot) {
                        renderModalFooterContent(footer, footerActionsSlot, options.footerContent, controller, footerContentSlotRef);
                    }
                },
                setHeaderActions: (nextHeaderActions) => {
                    options.headerActions = nextHeaderActions;
                    if (headerActionsSlot) {
                        renderModalHeaderActions(headerActionsSlot, options.headerActions, controller);
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
            }
            if (footer && footerActionsSlot) {
                renderModalFooterContent(footer, footerActionsSlot, options.footerContent, controller, footerContentSlotRef);
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
                cancelButtonClassName = 'll-btn ll-btn--flat-default',
                confirmButtonClassName = 'll-btn ll-btn--primary',
                onCancel = null,
                onConfirm = null
            } = options;

            let modalController = null;
            const buildFooter = () => {
                const cancelButton = document.createElement('button');
                cancelButton.type = 'button';
                cancelButton.className = String(cancelButtonClassName || 'll-btn ll-btn--flat-default').trim() || 'll-btn ll-btn--flat-default';
                cancelButton.textContent = String(cancelLabel || 'Cancel');

                const confirmButton = document.createElement('button');
                confirmButton.type = 'button';
                confirmButton.className = String(confirmButtonClassName || 'll-btn ll-btn--primary').trim() || 'll-btn ll-btn--primary';
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
                return [cancelButton, confirmButton];
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
                return okButton;
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

        /* -------------------------------------------------------------------------- */
        /* 2D surface / freeform plane — overlap resolution (any placed items, not      */
        /* workflow-specific). Same math used by workflow graphs and future adapters. */
        /* -------------------------------------------------------------------------- */

        /**
         * Default visual overflow (px) for items that extend past their layout box (handles, labels).
         * Callers may override per item via `getVisualMetrics` / `llumenSurfaceRectVisualBounds`.
         */
        const LLUMEN_SURFACE_OVERLAP_DEFAULT_METRICS = {
            leftOverflow: 14,
            rightOverflow: 40,
            topOverflow: 18,
            bottomOverflow: 0
        };

        function llumenSurfaceNormalizeVisualMetrics(visualMetrics) {
            const m = visualMetrics && typeof visualMetrics === 'object' ? visualMetrics : {};
            return {
                leftOverflow: Number.isFinite(m.leftOverflow)
                    ? m.leftOverflow
                    : LLUMEN_SURFACE_OVERLAP_DEFAULT_METRICS.leftOverflow,
                rightOverflow: Number.isFinite(m.rightOverflow)
                    ? m.rightOverflow
                    : LLUMEN_SURFACE_OVERLAP_DEFAULT_METRICS.rightOverflow,
                topOverflow: Number.isFinite(m.topOverflow)
                    ? m.topOverflow
                    : LLUMEN_SURFACE_OVERLAP_DEFAULT_METRICS.topOverflow,
                bottomOverflow: Number.isFinite(m.bottomOverflow)
                    ? m.bottomOverflow
                    : LLUMEN_SURFACE_OVERLAP_DEFAULT_METRICS.bottomOverflow
            };
        }

        /**
         * Axis-aligned bounds including optional “visual” overflow beyond `{x,y,width,height}`.
         * @param {{ x: number, y: number, width: number, height: number }} layoutRect
         * @param {object} [visualMetrics] — `{ leftOverflow, rightOverflow, topOverflow, bottomOverflow }`; partial keys use defaults.
         */
        function llumenSurfaceRectVisualBounds(layoutRect, visualMetrics) {
            const x = layoutRect.x;
            const y = layoutRect.y;
            const w = layoutRect.width;
            const h = layoutRect.height;
            const m = llumenSurfaceNormalizeVisualMetrics(visualMetrics);
            return {
                left: x - m.leftOverflow,
                right: x + w + m.rightOverflow,
                top: y - m.topOverflow,
                bottom: y + h + m.bottomOverflow
            };
        }

        function llumenSurfaceBoundsOverlap(aBounds, bBounds, margin) {
            const mg = Number.isFinite(margin) ? margin : 0;
            return !(
                aBounds.right + mg <= bBounds.left
                || bBounds.right + mg <= aBounds.left
                || aBounds.bottom + mg <= bBounds.top
                || bBounds.bottom + mg <= aBounds.top
            );
        }

        function llumenSurfaceMoveLayoutAwayFromBase(baseLayout, baseMetrics, movingLayout, movingMetrics, opts) {
            const margin = opts && Number.isFinite(opts.margin) ? opts.margin : 28;
            const verticalShiftBonus = opts && Number.isFinite(opts.verticalShiftBonus)
                ? opts.verticalShiftBonus
                : 36;
            const minX = opts && Number.isFinite(opts.minX) ? opts.minX : 20;
            const minY = opts && Number.isFinite(opts.minY) ? opts.minY : 20;

            const baseBounds = llumenSurfaceRectVisualBounds(baseLayout, baseMetrics);
            const movingBounds = llumenSurfaceRectVisualBounds(movingLayout, movingMetrics);
            const mm = llumenSurfaceNormalizeVisualMetrics(movingMetrics);

            const baseCenterX = (baseBounds.left + baseBounds.right) / 2;
            const baseCenterY = (baseBounds.top + baseBounds.bottom) / 2;
            const movingCenterX = (movingBounds.left + movingBounds.right) / 2;
            const movingCenterY = (movingBounds.top + movingBounds.bottom) / 2;
            const dx = movingCenterX - baseCenterX;
            const dy = movingCenterY - baseCenterY;
            const horizontalPriority = Math.abs(dx) >= Math.abs(dy);

            if (horizontalPriority) {
                movingLayout.x = dx >= 0
                    ? baseBounds.right + margin + mm.leftOverflow
                    : baseBounds.left - margin - movingLayout.width - mm.rightOverflow;
            } else {
                movingLayout.y = dy >= 0
                    ? baseBounds.bottom + margin + verticalShiftBonus + mm.topOverflow
                    : baseBounds.top - margin - verticalShiftBonus - movingLayout.height - mm.bottomOverflow;
            }

            movingLayout.x = Math.max(minX, movingLayout.x);
            movingLayout.y = Math.max(minY, movingLayout.y);
        }

        /**
         * Queue-based overlap propagation: anchored items stay fixed; others are nudged when **visual**
         * bounds intersect. Mutates `x` / `y` on non-anchor entries in `items` (same objects the caller passes).
         *
         * @param {Array<object>} items — Each `{ id, x, y, width, height, ... }`.
         * @param {string[]} anchorIds — Anchors that do not move (e.g. the item the user dropped or resized).
         * @param {object} options
         * @param {(item: object) => object} options.getVisualMetrics — Required; per-item overflow metrics.
         * @param {number} [options.margin=28]
         * @param {number} [options.verticalShiftBonus=36]
         * @param {number} [options.minX=20]
         * @param {number} [options.minY=20]
         * @param {number} [options.maxIterations=1200]
         * @returns {{ iterations: number, abortedByMaxIterations: boolean }}
         */
        function resolveLlumenSurfaceRectOverlaps(items, anchorIds, options = {}) {
            const {
                getVisualMetrics,
                margin = 28,
                verticalShiftBonus = 36,
                minX = 20,
                minY = 20,
                maxIterations = 1200
            } = options;

            if (!Array.isArray(items) || !Array.isArray(anchorIds) || anchorIds.length === 0) {
                return { iterations: 0, abortedByMaxIterations: false };
            }
            if (typeof getVisualMetrics !== 'function') {
                return { iterations: 0, abortedByMaxIterations: false };
            }

            const byId = new Map();
            for (let i = 0; i < items.length; i++) {
                const n = items[i];
                if (n && n.id != null) byId.set(String(n.id), n);
            }

            const fixedNodeIds = new Set(anchorIds.map((id) => String(id)));
            const queue = anchorIds.map((id) => String(id));
            let safetyCounter = 0;
            let abortedByMaxIterations = false;

            const moveOpts = { margin, verticalShiftBonus, minX, minY };

            while (queue.length > 0 && safetyCounter < maxIterations) {
                safetyCounter += 1;
                const baseNodeId = queue.shift();
                const baseNode = byId.get(String(baseNodeId));
                if (!baseNode) continue;
                const baseMetrics = getVisualMetrics(baseNode);

                for (let i = 0; i < items.length; i++) {
                    const candidate = items[i];
                    if (!candidate || String(candidate.id) === String(baseNodeId)) continue;
                    if (fixedNodeIds.has(String(candidate.id))) continue;

                    const candMetrics = getVisualMetrics(candidate);
                    const ab = llumenSurfaceRectVisualBounds(baseNode, baseMetrics);
                    const bb = llumenSurfaceRectVisualBounds(candidate, candMetrics);
                    if (!llumenSurfaceBoundsOverlap(ab, bb, margin)) continue;

                    llumenSurfaceMoveLayoutAwayFromBase(
                        baseNode,
                        baseMetrics,
                        candidate,
                        candMetrics,
                        moveOpts
                    );
                    queue.push(String(candidate.id));
                }
            }

            if (safetyCounter >= maxIterations && queue.length > 0) {
                abortedByMaxIterations = true;
            }

            return { iterations: safetyCounter, abortedByMaxIterations };
        }

        /**
         * Ensures **gap rows** (empty **`.ll-row-band-row--gap`**) around **filled** band rows that are
         * **direct children** of `hostElement`. Resulting order: **`gap, row₀, gap, row₁, …, gap`**.
         * With **no** filled rows, a **single** gap row remains. Gap rows are real `.ll-row-band-row` nodes
         * (modifier class only); callers mount horizontal sortable + optional **`acceptPointerHoverMs`** on them.
         *
         * Steps: promote any gap row that already has tile shells (removes `--gap`), optionally drop empty
         * filled rows, remove remaining gap rows, detach filled rows, then re-append the interleaved pattern.
         *
         * @param {object} options
         * @param {HTMLElement} options.hostElement — Vertical stack parent (`flex` + `flex-col` typical; avoid `gap-*` on host if gaps provide spacing).
         * @param {string} options.filledRowSelector — Selector for **direct** filled rows only, e.g. **`.ll-row-band-row:not(.ll-row-band-row--gap)`**, used as **`:scope > ${filledRowSelector}`**.
         * @param {string} [options.gapRowClassNames] — Classes for created gap rows (default uses reusable row-context row classes).
         * @param {string} [options.promotedRowExtraClasses] — Added when a gap row becomes filled (first shell); optional extra layout classes (filled-row **min-height** lives in shared CSS, not here).
         * @param {boolean} [options.dropEmptyFilledRows=false] — Remove filled rows (matching **`filledRowSelector`**) with no **`filledRowContentSelector`** match.
         * @param {string} [options.filledRowContentSelector=':scope > .ll-row-element-container'] — Content probe inside each filled row.
         */
        function syncLlumenRowBandGapRows(options = {}) {
            const {
                hostElement,
                filledRowSelector,
                gapRowClassNames = 'll-row-band-row ll-row-band-row--gap ll-row-context__row ll-row-context__row--with-grip-offset',
                promotedRowExtraClasses = '',
                dropEmptyFilledRows = false,
                filledRowContentSelector = ':scope > .ll-row-element-container'
            } = options;

            if (!hostElement || typeof filledRowSelector !== 'string' || !filledRowSelector.trim()) {
                return;
            }

            const doc = hostElement.ownerDocument || document;
            const childSel = `:scope > ${filledRowSelector.trim()}`;

            /* Gap row received a tile: treat as filled (caller decorates row grip after sync if needed). */
            try {
                hostElement.querySelectorAll(':scope > .ll-row-band-row--gap').forEach((rowEl) => {
                    if (!rowEl || rowEl.nodeType !== 1) return;
                    const cs = typeof filledRowContentSelector === 'string' && filledRowContentSelector.trim()
                        ? filledRowContentSelector.trim()
                        : '';
                    if (cs && rowEl.querySelector(cs)) {
                        rowEl.classList.remove('ll-row-band-row--gap');
                        rowEl.removeAttribute('aria-hidden');
                        if (typeof promotedRowExtraClasses === 'string' && promotedRowExtraClasses.trim()) {
                            promotedRowExtraClasses.trim().split(/\s+/).forEach((c) => {
                                if (c) rowEl.classList.add(c);
                            });
                        }
                    }
                });
            } catch (e) {
                return;
            }

            if (dropEmptyFilledRows && typeof filledRowContentSelector === 'string' && filledRowContentSelector.trim()) {
                const cs = filledRowContentSelector.trim();
                let rowsForPrune;
                try {
                    rowsForPrune = Array.from(hostElement.querySelectorAll(childSel));
                } catch (e2) {
                    return;
                }
                rowsForPrune.forEach((rowEl) => {
                    if (!rowEl || rowEl.nodeType !== 1) return;
                    if (!rowEl.querySelector(cs)) {
                        rowEl.remove();
                    }
                });
            }

            let filled;
            try {
                filled = Array.from(hostElement.querySelectorAll(childSel));
            } catch (e3) {
                return;
            }

            hostElement.querySelectorAll(':scope > .ll-row-band-row--gap').forEach((n) => n.remove());

            const detached = filled.filter((el) => el && el.nodeType === 1);
            detached.forEach((el) => {
                if (el.parentNode === hostElement) {
                    el.remove();
                }
            });

            const createGapRow = () => {
                const row = doc.createElement('div');
                row.setAttribute('aria-hidden', 'true');
                gapRowClassNames.split(/\s+/).forEach((c) => {
                    if (c) row.classList.add(c);
                });
                return row;
            };

            const frag = doc.createDocumentFragment();
            frag.appendChild(createGapRow());
            for (let i = 0; i < detached.length; i += 1) {
                frag.appendChild(detached[i]);
                frag.appendChild(createGapRow());
            }
            hostElement.appendChild(frag);
        }

        /**
         * Reads a **serializable snapshot** of filled row-band rows under **`hostElement`** (gap strips are
         * omitted). Use after drag commits or with **`initRowBandContext`** **`onAfterSync`** for app state /
         * persistence — does not mutate the DOM.
         *
         * @param {HTMLElement} hostElement
         * @param {object} [config]
         * @param {string} [config.filledRowSelector='.ll-row-band-row:not(.ll-row-band-row--gap)']
         * @param {string} [config.bandShellSelector='.ll-row-element-container']
         * @param {string} [config.unitSelector='.ll-flex-band-unit']
         * @param {function(HTMLElement): string} [config.getRowId]
         * @param {function(HTMLElement): string} [config.getShellId]
         * @param {number} [config.maxUnits=4]
         * @param {function(HTMLElement): object|void} [config.readShellExtras] — Merge plain-object extras into each shell entry (e.g. **`dataset`** mirrors).
         * @returns {{ maxUnits: number, rows: Array<{ rowId: string, usedUnits: number, freeUnits: number, shells: Array<{ shellId: string, units: number }> }> }}
         * @see **`writeLlumenRowBandModelToHost`** — inverse (**model → DOM**); pair with **`initRowBandContext`** **`applyRowBandModel`** to re-mount sortables after a rebuild.
         */
        function readLlumenRowBandModelFromHost(hostElement, config = {}) {
            const {
                filledRowSelector = '.ll-row-band-row:not(.ll-row-band-row--gap)',
                bandShellSelector = '.ll-row-element-container',
                unitSelector = '.ll-flex-band-unit',
                getRowId = () => '',
                getShellId = () => '',
                maxUnits = 4,
                readShellExtras = null
            } = config;

            if (!hostElement || hostElement.nodeType !== 1) {
                return { maxUnits, rows: [] };
            }

            let rows = [];
            try {
                rows = Array.from(hostElement.querySelectorAll(`:scope > ${filledRowSelector}`)).map((rowEl) => {
                    const shells = Array.from(rowEl.querySelectorAll(`:scope > ${bandShellSelector}`)).map(
                        (shellEl) => {
                            const unitEl = shellEl.querySelector(unitSelector);
                            const units = Math.max(1, parseInt(unitEl && unitEl.dataset.units, 10) || 1);
                            const entry = {
                                shellId: (typeof getShellId === 'function' ? getShellId(shellEl) : '') || '',
                                units
                            };
                            if (typeof readShellExtras === 'function') {
                                try {
                                    const extra = readShellExtras(shellEl);
                                    if (extra && typeof extra === 'object') {
                                        Object.assign(entry, extra);
                                    }
                                } catch (e) {
                                    /* ignore */
                                }
                            }
                            return entry;
                        }
                    );
                    const usedUnits = shells.reduce((s, sh) => s + (Math.max(1, parseInt(sh.units, 10) || 1)), 0);
                    return {
                        rowId: (typeof getRowId === 'function' ? getRowId(rowEl) : '') || '',
                        usedUnits,
                        freeUnits: Math.max(0, maxUnits - usedUnits),
                        shells
                    };
                });
            } catch (e) {
                return { maxUnits, rows: [] };
            }
            return { maxUnits, rows };
        }

        /**
         * Returns a shallow copy of **`rowSnapshot`** whose **`shells`** array fits **`maxUnits`**
         * (drops trailing shells that would overflow).
         *
         * @param {object} rowSnapshot
         * @param {number} maxUnits
         * @returns {object}
         */
        function normalizeLlumenRowBandRowShellsForCapacity(rowSnapshot, maxUnits) {
            const cap = Math.max(1, parseInt(maxUnits, 10) || 1);
            const shellsIn = Array.isArray(rowSnapshot && rowSnapshot.shells)
                ? rowSnapshot.shells
                : [];
            const shells = [];
            let used = 0;
            for (let i = 0; i < shellsIn.length; i += 1) {
                const sh = shellsIn[i];
                if (!sh || typeof sh !== 'object') continue;
                const u = Math.max(1, parseInt(sh.units, 10) || 1);
                if (used + u > cap) break;
                shells.push(sh);
                used += u;
            }
            return { ...rowSnapshot, shells };
        }

        /**
         * Caps a shell’s **`units`** to **`nextMaxUnits`** only when **`units > nextMaxUnits`** (e.g. 3- or 4-wide
         * shells when shrinking a **4 → 2** host). Shells with **`units <= nextMaxUnits`** are unchanged.
         *
         * @param {number} units
         * @param {number} nextMaxUnits
         */
        function llumenRowBandShellUnitsForHostCapacity(units, nextMaxUnits) {
            const u = Math.max(1, parseInt(units, 10) || 1);
            const cap = Math.max(1, parseInt(nextMaxUnits, 10) || 1);
            if (u <= cap) return u;
            return cap;
        }

        /**
         * Rebuilds a **row-band** model for a new **`maxUnits`**: when **`nextMaxUnits`** is **≥** the current
         * **`model.maxUnits`**, only **`maxUnits`** on the snapshot changes (rows / shell **`units`** unchanged).
         * When **`nextMaxUnits`** is **smaller**, each shell’s **`units`** is capped with
         * **`llumenRowBandShellUnitsForHostCapacity`**, then **each original row is handled alone**: shells stay
         * in order; if **`sum(units) <= cap`** the row is kept as one row (same **`rowId`** when present).
         * If a row no longer fits, it is **split** into consecutive segments with **`sum(units) <= cap`** only
         * (no merging across different input rows — shells from row *B* never move up into free space on row *A*).
         * Split segments get fresh **`ll-rb-${ts}-${n}`** **`rowId`**s.
         *
         * @param {{ maxUnits?: number, rows: object[] }} model
         * @param {number} nextMaxUnits
         * @returns {{ maxUnits: number, rows: object[] }}
         */
        function reflowLlumenRowBandModelForMaxUnits(model, nextMaxUnits) {
            const cap = Math.max(1, parseInt(nextMaxUnits, 10) || 1);
            const prevCap = Math.max(
                1,
                parseInt(model && model.maxUnits, 10) || cap
            );
            const rowsIn = Array.isArray(model && model.rows) ? model.rows : [];

            if (cap >= prevCap) {
                return {
                    maxUnits: cap,
                    rows: rowsIn.map((row) => {
                        if (!row || typeof row !== 'object') return { rowId: '', shells: [] };
                        const shells = Array.isArray(row.shells)
                            ? row.shells.map((sh) => (sh && typeof sh === 'object' ? { ...sh } : {}))
                            : [];
                        return {
                            ...row,
                            shells
                        };
                    })
                };
            }

            const splitShellsIntoSegments = (shellsCapped) => {
                const segments = [];
                let cur = [];
                let used = 0;
                for (let i = 0; i < shellsCapped.length; i += 1) {
                    const sh = shellsCapped[i];
                    const u = Math.max(1, parseInt(sh.units, 10) || 1);
                    if (used + u > cap) {
                        if (cur.length > 0) {
                            segments.push(cur);
                        }
                        cur = [];
                        used = 0;
                    }
                    cur.push(sh);
                    used += u;
                }
                if (cur.length > 0) {
                    segments.push(cur);
                }
                return segments;
            };

            const ts = Date.now();
            let idSeq = 0;
            const rowsOut = [];

            for (let ri = 0; ri < rowsIn.length; ri += 1) {
                const row = rowsIn[ri];
                if (!row || typeof row !== 'object') continue;
                const shellsIn = Array.isArray(row.shells) ? row.shells : [];
                const shellsCapped = [];
                for (let si = 0; si < shellsIn.length; si += 1) {
                    const sh = shellsIn[si];
                    if (!sh || typeof sh !== 'object') continue;
                    const u0 = Math.max(1, parseInt(sh.units, 10) || 1);
                    const u = llumenRowBandShellUnitsForHostCapacity(u0, cap);
                    shellsCapped.push({ ...sh, units: u });
                }
                if (shellsCapped.length === 0) {
                    continue;
                }

                const segments = splitShellsIntoSegments(shellsCapped);
                const preserveId = row.rowId != null && String(row.rowId).trim() !== '';

                if (segments.length === 1) {
                    const rowId = preserveId
                        ? String(row.rowId).trim()
                        : `ll-rb-${ts}-${idSeq++}`;
                    rowsOut.push({ rowId, shells: segments[0] });
                } else {
                    for (let s = 0; s < segments.length; s += 1) {
                        rowsOut.push({
                            rowId: `ll-rb-${ts}-${idSeq++}`,
                            shells: segments[s]
                        });
                    }
                }
            }

            return { maxUnits: cap, rows: rowsOut };
        }

        /**
         * Replaces **all** direct children of **`hostElement`** with **filled** rows built by **`renderFilledRow`**
         * (no gap rows — call **`syncLlumenRowBandGapRows`** / **`initRowBandContext`’s `syncGapRows`** afterward).
         * Intended for **model → DOM** rebuild after **`readLlumenRowBandModelFromHost`** or persisted JSON.
         *
         * @param {HTMLElement} hostElement
         * @param {{ maxUnits?: number, rows: object[] }} model
         * @param {object} config
         * @param {function(object, number, Document, number): HTMLElement} config.renderFilledRow — Build one **filled** row element (`.ll-row-band-row` not `--gap`) including band shells and units. **4th argument** is the resolved host **`maxUnits`** (same value **`writeLlumenRowBandModelToHost`** uses for capacity); use it for **`setLlumenBandWidthClass`** / **`ll-band-c{maxUnits}-u*`** so tokens match the row context after capacity changes.
         * @param {number} [config.maxUnits=4] — Fallback when **`model.maxUnits`** is missing; also used for capacity trimming when **`validateCapacity`** is true.
         * @param {boolean} [config.validateCapacity=true] — Trim **`shells`** per row so **`sum(units) <= maxUnits`**.
         * @returns {boolean} Whether the write ran (**false** if arguments invalid).
         */
        function writeLlumenRowBandModelToHost(hostElement, model, config = {}) {
            const {
                renderFilledRow,
                maxUnits: maxUnitsCfg = 4,
                validateCapacity = true
            } = config;

            if (!hostElement || hostElement.nodeType !== 1) return false;
            if (typeof renderFilledRow !== 'function') return false;
            if (!model || typeof model !== 'object' || !Array.isArray(model.rows)) return false;

            const maxUnits = Math.max(
                1,
                parseInt(model.maxUnits, 10) || parseInt(maxUnitsCfg, 10) || 4
            );

            const doc = hostElement.ownerDocument || document;
            while (hostElement.firstChild) {
                hostElement.removeChild(hostElement.firstChild);
            }

            const rows = model.rows;
            for (let i = 0; i < rows.length; i += 1) {
                const raw = rows[i];
                if (!raw || typeof raw !== 'object') continue;
                const rowSnap = validateCapacity
                    ? normalizeLlumenRowBandRowShellsForCapacity(raw, maxUnits)
                    : { ...raw, shells: Array.isArray(raw.shells) ? raw.shells : [] };
                let rowEl;
                try {
                    rowEl = renderFilledRow(rowSnap, i, doc, maxUnits);
                } catch (e) {
                    continue;
                }
                if (!rowEl || rowEl.nodeType !== 1) continue;
                hostElement.appendChild(rowEl);
            }
            return true;
        }

        /**
         * Preferred entry point for **row-band** sortable wiring: same as **`initLlumenRowBandSortables`**, plus
         * optional **`getRowBandModel()`** and **`onAfterSync(snapshot)`** after each gap/sortable refresh
         * (initial mount and every **`syncGapRows`**). With **`renderFilledRow`**, also exposes **`applyRowBandModel`**
         * to **destroy sortables**, **rewrite** filled rows from a snapshot, and **re-mount** the row-band stack.
         *
         * @param {object} options — Same as **`initLlumenRowBandSortables`**, plus:
         * @param {function({ maxUnits: number, rows: object[] }): void} [options.onAfterSync] — Fired after **`syncGapRows`** completes (safe for persistence / UI).
         * @param {function(HTMLElement): object|void} [options.readShellExtras] — Passed through to **`readLlumenRowBandModelFromHost`**.
         * @param {function(object, number, Document, number): HTMLElement} [options.renderFilledRow] — When set, **`applyRowBandModel`** is returned and used to rebuild **filled** rows from a **`readLlumenRowBandModelFromHost`**-shaped snapshot. Receives **`maxUnits`** as the **4th** argument (host row budget for width tokens).
         * @param {boolean} [options.showEmptyTemplate=true] — Show an **`ll-empty`** template when row context has no shells.
         * @param {string} [options.emptyTemplateIcon='grid_view'] — Material icon for the empty template.
         * @param {string} [options.emptyTemplateMessage='No components added'] — Empty-state message copy.
         * @returns {{ syncGapRows: function(): void, destroy: function(): void, getRowBandModel: function(): { maxUnits: number, rows: object[] }, applyRowBandModel: (function((object)): void)|null, setRowBandMaxUnits: (function((number)): void)|null }}
         */
        function initRowBandContext(options = {}) {
            const {
                onAfterSync = null,
                readShellExtras = null,
                renderFilledRow = null,
                showEmptyTemplate = true,
                emptyTemplateIcon = 'grid_view',
                emptyTemplateMessage = 'No components added',
                ...sortableOptions
            } = options;

            const bandOpts = { ...sortableOptions };
            if (!bandOpts.hostElement || bandOpts.hostElement.nodeType !== 1) {
                return {
                    syncGapRows() {},
                    destroy() {},
                    getRowBandModel() {
                        return { maxUnits: 4, rows: [] };
                    },
                    applyRowBandModel: null,
                    setRowBandMaxUnits: null
                };
            }
            if (
                typeof bandOpts.rowVerticalHandleSelector !== 'string'
                || !String(bandOpts.rowVerticalHandleSelector).trim()
                || typeof bandOpts.tileHorizontalHandleSelector !== 'string'
                || !String(bandOpts.tileHorizontalHandleSelector).trim()
                || typeof bandOpts.getRowId !== 'function'
                || typeof bandOpts.getShellId !== 'function'
                || typeof bandOpts.decorateFilledRow !== 'function'
            ) {
                return {
                    syncGapRows() {},
                    destroy() {},
                    getRowBandModel() {
                        return { maxUnits: 4, rows: [] };
                    },
                    applyRowBandModel: null,
                    setRowBandMaxUnits: null
                };
            }
            if (typeof bandOpts.maxUnits !== 'number' || !Number.isFinite(bandOpts.maxUnits) || bandOpts.maxUnits < 1) {
                bandOpts.maxUnits = 4;
            }

            let core = initLlumenRowBandSortables(bandOpts);
            const rowsHost = bandOpts.hostElement;
            const rowContextRoot = rowsHost.closest('.ll-row-context');
            const shouldShowEmptyTemplate = showEmptyTemplate !== false;
            const resolvedEmptyTemplateIcon = String(emptyTemplateIcon || 'grid_view').trim() || 'grid_view';
            const resolvedEmptyTemplateMessage = String(emptyTemplateMessage || 'No components added').trim() || 'No components added';

            const readHostModelConfig = () => ({
                filledRowSelector: bandOpts.filledRowSelector,
                bandShellSelector: bandOpts.bandShellSelector,
                unitSelector: bandOpts.unitSelector,
                getRowId: bandOpts.getRowId,
                getShellId: bandOpts.getShellId,
                maxUnits: bandOpts.maxUnits,
                readShellExtras
            });

            const getRowBandModel = () => readLlumenRowBandModelFromHost(rowsHost, readHostModelConfig());
            const modelHasAnyShells = (model) => {
                const rows = Array.isArray(model && model.rows) ? model.rows : [];
                return rows.some((row) => {
                    const shells = Array.isArray(row && row.shells) ? row.shells : [];
                    return shells.length > 0;
                });
            };
            const ensureRowContextEmptyTemplate = () => {
                if (!rowContextRoot || !shouldShowEmptyTemplate) return null;
                let templateRoot = rowContextRoot.querySelector(':scope > .ll-row-context__empty-template');
                if (templateRoot) return templateRoot;
                templateRoot = document.createElement('div');
                templateRoot.className = 'll-row-context__empty-template';
                const emptyShell = document.createElement('div');
                emptyShell.className = 'll-empty';
                const emptyContent = document.createElement('div');
                emptyContent.className = 'll-empty__content';
                const iconEl = document.createElement('span');
                iconEl.className = 'material-symbols-outlined ll-empty__icon';
                iconEl.textContent = resolvedEmptyTemplateIcon;
                const messageEl = document.createElement('p');
                messageEl.className = 'll-empty__text';
                messageEl.textContent = resolvedEmptyTemplateMessage;
                emptyContent.appendChild(iconEl);
                emptyContent.appendChild(messageEl);
                emptyShell.appendChild(emptyContent);
                templateRoot.appendChild(emptyShell);
                rowContextRoot.appendChild(templateRoot);
                return templateRoot;
            };
            const syncRowContextEmptyModifier = (model) => {
                if (!rowContextRoot) return;
                const hasItems = modelHasAnyShells(model);
                rowContextRoot.classList.toggle('ll-row-context--empty', !hasItems);
                rowContextRoot.classList.toggle('ll-row-context--with-empty-template', shouldShowEmptyTemplate);
                if (shouldShowEmptyTemplate) {
                    const template = ensureRowContextEmptyTemplate();
                    if (template) {
                        template.classList.toggle('hidden', hasItems);
                    }
                }
            };
            // Start hidden by default; we'll remove this once we detect items in the initial model.
            if (rowContextRoot) {
                rowContextRoot.classList.add('ll-row-context--empty');
                rowContextRoot.classList.toggle('ll-row-context--with-empty-template', shouldShowEmptyTemplate);
                if (shouldShowEmptyTemplate) {
                    ensureRowContextEmptyTemplate();
                }
            }

            const syncGapRows = () => {
                core.syncGapRows();
                const model = getRowBandModel();
                syncRowContextEmptyModifier(model);
                if (typeof onAfterSync === 'function') {
                    try {
                        onAfterSync(model);
                    } catch (e) {
                        /* ignore */
                    }
                }
            };

            const destroy = () => {
                core.destroy();
            };

            const applyRowBandModel = (typeof renderFilledRow === 'function')
                ? (model) => {
                    if (!model || typeof model !== 'object') return;
                    const mu = Math.max(
                        1,
                        parseInt(model.maxUnits, 10) || bandOpts.maxUnits
                    );
                    bandOpts.maxUnits = mu;
                    core.destroy();
                    writeLlumenRowBandModelToHost(rowsHost, model, {
                        renderFilledRow,
                        maxUnits: mu,
                        validateCapacity: true
                    });
                    core = initLlumenRowBandSortables(bandOpts);
                    const nextModel = getRowBandModel();
                    syncRowContextEmptyModifier(nextModel);
                    if (typeof onAfterSync === 'function') {
                        try {
                            onAfterSync(nextModel);
                        } catch (e2) {
                            /* ignore */
                        }
                    }
                }
                : null;

            const setRowBandMaxUnits = (typeof renderFilledRow === 'function')
                ? (nextMax) => {
                    const mu = Math.max(1, parseInt(nextMax, 10) || 1);
                    const cur = readLlumenRowBandModelFromHost(rowsHost, readHostModelConfig());
                    const nextModel = reflowLlumenRowBandModelForMaxUnits(cur, mu);
                    bandOpts.maxUnits = mu;
                    core.destroy();
                    writeLlumenRowBandModelToHost(rowsHost, nextModel, {
                        renderFilledRow,
                        maxUnits: mu,
                        validateCapacity: false
                    });
                    core = initLlumenRowBandSortables(bandOpts);
                    const syncedModel = getRowBandModel();
                    syncRowContextEmptyModifier(syncedModel);
                    if (typeof onAfterSync === 'function') {
                        try {
                            onAfterSync(syncedModel);
                        } catch (e3) {
                            /* ignore */
                        }
                    }
                }
                : null;

            const initialModel = getRowBandModel();
            syncRowContextEmptyModifier(initialModel);
            if (typeof onAfterSync === 'function') {
                try {
                    onAfterSync(initialModel);
                } catch (e2) {
                    /* ignore */
                }
            }

            return { syncGapRows, destroy, getRowBandModel, applyRowBandModel, setRowBandMaxUnits };
        }

        /**
         * Wires **gap-row sync**, **vertical** row reorder (`initSortableList`), and **horizontal** shell/tile
         * sort across filled + gap rows (`acceptPointerHoverMs` on gaps, capacity **`accepts`**, sole-shell
         * adjacent-gap block, gap-squeeze visuals). Page-agnostic — pass selectors, id getters, and hooks.
         *
         * @param {object} options
         * @param {HTMLElement} options.hostElement — **`flex`** / **`flex-col`** stack (no **`gap-*`** if gaps provide rhythm).
         * @param {string} [options.filledRowSelector='.ll-row-band-row:not(.ll-row-band-row--gap)']
         * @param {string} [options.bandShellSelector='.ll-row-element-container']
         * @param {string} [options.unitSelector='.ll-flex-band-unit']
         * @param {string} options.rowVerticalHandleSelector — Vertical sortable handle (per filled row).
         * @param {string} options.tileHorizontalHandleSelector — Horizontal sortable handle (per shell).
         * @param {function(HTMLElement): string} options.getRowId
         * @param {function(HTMLElement): string} options.getShellId
         * @param {number} [options.maxUnits=4]
         * @param {number} [options.gapRowAcceptPointerHoverMs=200]
         * @param {boolean} [options.dropEmptyFilledRows=true]
         * @param {function(HTMLElement): void} options.decorateFilledRow — After each **`syncGapRows`**, run on each direct filled row (grip, padding, stable ids).
         * @param {function(HTMLElement, HTMLElement): void} [options.onWireBandUnit] — After a cross-row horizontal reorder, **`(rowContainer, unitElement)`** (e.g. **`initLlumenFlexBandUnitResize`**).
         * @param {number} [options.verticalMinItemsForDrag=2]
         * @param {HTMLElement|null} [options.verticalScrollRoot=hostElement]
         * @returns {{ syncGapRows: function(): void, destroy: function(): void }}
         * @see **`initRowBandContext`** — preferred entry when you want **`getRowBandModel()`** / **`onAfterSync`**.
         */
        function initLlumenRowBandSortables(options = {}) {
            const {
                hostElement: rowsHost,
                filledRowSelector = '.ll-row-band-row:not(.ll-row-band-row--gap)',
                bandShellSelector = '.ll-row-element-container',
                unitSelector = '.ll-flex-band-unit',
                rowVerticalHandleSelector,
                tileHorizontalHandleSelector,
                getRowId,
                getShellId,
                maxUnits = 4,
                gapRowAcceptPointerHoverMs = 200,
                dropEmptyFilledRows = true,
                decorateFilledRow,
                onWireBandUnit = null,
                verticalMinItemsForDrag = 2,
                verticalScrollRoot = null
            } = options;

            if (!rowsHost || rowsHost.nodeType !== 1) {
                return {
                    syncGapRows() {},
                    destroy() {}
                };
            }
            if (
                typeof rowVerticalHandleSelector !== 'string'
                || !rowVerticalHandleSelector.trim()
                || typeof tileHorizontalHandleSelector !== 'string'
                || !tileHorizontalHandleSelector.trim()
                || typeof getRowId !== 'function'
                || typeof getShellId !== 'function'
                || typeof decorateFilledRow !== 'function'
            ) {
                return {
                    syncGapRows() {},
                    destroy() {}
                };
            }

            const scrollRootVertical = verticalScrollRoot && verticalScrollRoot.nodeType === 1
                ? verticalScrollRoot
                : rowsHost;

            const rowHorizontalSortDestroy = new WeakMap();
            const rowBandSortableMounted = new WeakSet();
            const gapSqueezeClass = 'll-row-band-row--gap-squeeze';
            const emptyFilledRowDuringBandDragClass = 'll-row-band-row--empty-during-band-drag';

            const clearRowBandGapSqueeze = () => {
                rowsHost.querySelectorAll(`:scope > .ll-row-band-row--gap.${gapSqueezeClass}`).forEach((g) => {
                    g.classList.remove(gapSqueezeClass);
                });
                rowsHost.querySelectorAll(`:scope > .${emptyFilledRowDuringBandDragClass}`).forEach((r) => {
                    r.classList.remove(emptyFilledRowDuringBandDragClass);
                });
            };

            const updateRowBandGapSqueezeDuringTileDrag = () => {
                clearRowBandGapSqueeze();
                const wash = rowsHost.querySelector(`${bandShellSelector} ${unitSelector}.ll-dnd__source--dragging`);
                if (!wash) return;
                rowsHost.querySelectorAll(`:scope > ${filledRowSelector}`).forEach((row) => {
                    if (row.querySelector(`:scope > ${bandShellSelector}`)) return;
                    row.classList.add(emptyFilledRowDuringBandDragClass);
                    const prev = row.previousElementSibling;
                    const next = row.nextElementSibling;
                    if (prev && prev.classList.contains('ll-row-band-row--gap')) {
                        prev.classList.add(gapSqueezeClass);
                    }
                    if (next && next.classList.contains('ll-row-band-row--gap')) {
                        next.classList.add(gapSqueezeClass);
                    }
                });
            };

            const teardownRowHorizontalSortables = () => {
                rowsHost.querySelectorAll(':scope > .ll-row-band-row').forEach((row) => {
                    const d = rowHorizontalSortDestroy.get(row);
                    if (d) d();
                    rowHorizontalSortDestroy.delete(row);
                    rowBandSortableMounted.delete(row);
                });
            };

            const sumRowUnits = (rowEl) => Array.from(rowEl.querySelectorAll(unitSelector)).reduce(
                (s, el) => s + (parseInt(el.dataset.units, 10) || 1),
                0
            );

            const sumRowUnitsExcludingShell = (rowEl, excludeShell) => Array.from(rowEl.querySelectorAll(unitSelector)).reduce(
                (s, el) => {
                    if (excludeShell && excludeShell.contains(el)) return s;
                    return s + (parseInt(el.dataset.units, 10) || 1);
                },
                0
            );

            const findShellByPayloadId = (id) => {
                if (id == null || id === '') return null;
                const want = String(id);
                let found = null;
                try {
                    rowsHost.querySelectorAll(bandShellSelector).forEach((el) => {
                        if (found) return;
                        if (getShellId(el) === want) {
                            found = el;
                        }
                    });
                } catch (e) {
                    return null;
                }
                return found;
            };

            const syncGapRows = () => {
                clearRowBandGapSqueeze();
                teardownRowHorizontalSortables();
                syncLlumenRowBandGapRows({
                    hostElement: rowsHost,
                    filledRowSelector,
                    dropEmptyFilledRows,
                    filledRowContentSelector: `:scope > ${bandShellSelector}`
                });
                rowsHost.querySelectorAll(`:scope > ${filledRowSelector}`).forEach(decorateFilledRow);
                rowsHost.querySelectorAll(':scope > .ll-row-band-row').forEach(mountRowBandHorizontalSortable);
            };

            const mountRowBandHorizontalSortable = (rowEl) => {
                if (!rowEl || rowEl.nodeType !== 1) return;
                if (rowBandSortableMounted.has(rowEl)) return;
                const isGapRow = rowEl.classList.contains('ll-row-band-row--gap');
                const api = initSortableList({
                    container: rowEl,
                    axis: 'horizontal',
                    itemSelector: bandShellSelector,
                    handleSelector: tileHorizontalHandleSelector,
                    getItemId: (el) => getShellId(el) || '',
                    minItemsForDrag: 1,
                    scrollRootOriginElement: rowEl,
                    sourceWashSelector: unitSelector,
                    ghostMeasureSelector: unitSelector,
                    ghostCloneSelector: unitSelector,
                    acceptPointerHoverMs: isGapRow ? gapRowAcceptPointerHoverMs : 0,
                    buildDragPayload: (itemEl, sourceContainer) => {
                        let soleShellSourceRow = false;
                        try {
                            if (
                                rowsHost.contains(sourceContainer)
                                && sourceContainer.classList.contains('ll-row-band-row')
                            ) {
                                const n = sourceContainer.querySelectorAll(`:scope > ${bandShellSelector}`).length;
                                soleShellSourceRow = n === 1;
                            }
                        } catch (e) {
                            soleShellSourceRow = false;
                        }
                        return {
                            kind: 'reorder',
                            id: itemEl && typeof getShellId === 'function' ? (getShellId(itemEl) || '') : '',
                            sourceContainer,
                            itemSelector: bandShellSelector,
                            soleShellSourceRow
                        };
                    },
                    onPointerMoveExtra: () => {
                        updateRowBandGapSqueezeDuringTileDrag();
                    },
                    onSessionEnd: ({ handleElement }) => {
                        const shell = handleElement && handleElement.closest(bandShellSelector);
                        if (shell && rowsHost.contains(shell)) {
                            clearRowBandGapSqueeze();
                        }
                    },
                    accepts: (payload, ctx) => {
                        if (payload.itemSelector !== bandShellSelector || ctx.itemSelector !== bandShellSelector) {
                            return false;
                        }
                        if (!payload.id) return false;
                        const shell = findShellByPayloadId(payload.id);
                        if (!shell) return false;
                        const targetRow = ctx.container;
                        if (!targetRow || !targetRow.classList.contains('ll-row-band-row')) return false;
                        const unitEl = shell.querySelector(unitSelector);
                        const u = Math.max(1, parseInt(unitEl && unitEl.dataset.units, 10) || 1);
                        const used = sumRowUnitsExcludingShell(targetRow, shell);
                        if (targetRow.classList.contains('ll-row-band-row--gap')) {
                            if (payload.soleShellSourceRow && payload.sourceContainer) {
                                const src = payload.sourceContainer;
                                if (rowsHost.contains(src)) {
                                    const prev = src.previousElementSibling;
                                    const next = src.nextElementSibling;
                                    if (targetRow === prev || targetRow === next) {
                                        return false;
                                    }
                                }
                            }
                            return used + u <= maxUnits;
                        }
                        if (!targetRow.matches(filledRowSelector)) return false;
                        return used + u <= maxUnits;
                    },
                    onReorder: (detail) => {
                        if (detail.fromContainer !== detail.toContainer && typeof onWireBandUnit === 'function') {
                            const movedShell = findShellByPayloadId(detail.id);
                            const wrap = movedShell && movedShell.querySelector(unitSelector);
                            if (wrap && detail.toContainer) {
                                onWireBandUnit(detail.toContainer, wrap);
                            }
                        }
                        syncGapRows();
                        if (detail && detail.id) {
                            windowScope.requestAnimationFrame(() => {
                                const movedShell = findShellByPayloadId(detail.id);
                                if (!movedShell || !rowsHost.contains(movedShell)) return;
                                const handle = movedShell.querySelector(tileHorizontalHandleSelector);
                                if (!handle || typeof handle.focus !== 'function') return;
                                try {
                                    if (!handle.matches(':disabled')) {
                                        handle.focus({ preventScroll: true });
                                    }
                                } catch (focusError) {
                                    /* ignore */
                                }
                            });
                        }
                    }
                });
                if (api && typeof api.destroy === 'function') {
                    rowHorizontalSortDestroy.set(rowEl, api.destroy);
                }
                rowBandSortableMounted.add(rowEl);
            };

            let rowsHostVerticalSortableMounted = false;
            let verticalDestroy = null;

            const mountRowsHostVerticalSortable = () => {
                if (rowsHostVerticalSortableMounted) return;
                rowsHostVerticalSortableMounted = true;
                const vApi = initSortableList({
                    container: rowsHost,
                    axis: 'vertical',
                    itemSelector: filledRowSelector,
                    handleSelector: rowVerticalHandleSelector,
                    getItemId: (el) => getRowId(el) || '',
                    minItemsForDrag: verticalMinItemsForDrag,
                    scrollRootOriginElement: scrollRootVertical,
                    accepts: (payload, ctx) => (
                        payload.itemSelector === filledRowSelector
                        && ctx.itemSelector === filledRowSelector
                        && payload.sourceContainer === ctx.container
                    ),
                    onReorder: () => {
                        syncGapRows();
                    }
                });
                verticalDestroy = vApi && typeof vApi.destroy === 'function' ? vApi.destroy : null;
            };

            mountRowsHostVerticalSortable();
            syncGapRows();

            const destroy = () => {
                clearRowBandGapSqueeze();
                teardownRowHorizontalSortables();
                if (typeof verticalDestroy === 'function') {
                    verticalDestroy();
                    verticalDestroy = null;
                }
                rowsHostVerticalSortableMounted = false;
            };

            return { syncGapRows, destroy };
        }

        let llListingModuleCounter = 0;

        function initListingModule(options = {}) {
            const {
                rootElement = null,
                rootId = '',
                items = [],
                idKey = 'id',
                mode = 'uncontrolled',
                allowUnsafeHtml = false,
                table = {},
                grid = {},
                controls = {},
                nested = {},
                filters = [],
                sorts = [],
                itemActions = {},
                itemClick = null,
                search = {},
                onItemsChange = null,
                onRequestChange = null
            } = options;

            const resolveElement = (value) => {
                if (!value) return null;
                if (value && value.nodeType === 1) return value;
                const id = String(value || '').trim();
                if (!id) return null;
                return document.getElementById(id);
            };
            const rootEl = resolveElement(rootElement || rootId);
            if (!rootEl) {
                return {
                    setItems() {},
                    getState: () => ({}),
                    setState() {},
                    getSelectedItem: () => null,
                    clearSelection() {},
                    selectItem() {},
                    toggleItemExpanded() {},
                    setItemExpanded() {},
                    isItemExpanded: () => false,
                    destroy() {}
                };
            }

            const moduleId = `ll-listing-${Date.now()}-${llListingModuleCounter++}`;
            const toDatasetKey = (rawValue, fallback = 'llListingBound') => {
                const normalized = String(rawValue || '')
                    .replace(/[^a-zA-Z0-9]+(.)?/g, (_full, next) => (next ? next.toUpperCase() : ''))
                    .replace(/^[^a-zA-Z]+/, '');
                return normalized || fallback;
            };
            const moduleDatasetKey = toDatasetKey(moduleId, `llListing${Date.now()}Bound`);
            const isControlled = String(mode || '').trim().toLowerCase() === 'controlled';
            let internalItems = Array.isArray(items) ? items.slice() : [];

            const tableHost = resolveElement(table.containerElement || table.containerId);
            const gridEnabled = Boolean(grid && grid.enabled);
            const gridHost = gridEnabled ? resolveElement(grid.containerElement || grid.containerId) : null;
            const defaultEmptyStateInput = controls.emptyStateText || table.emptyStateText || (grid && grid.emptyStateText) || 'No matching items.';
            const emptyStateNoItemsInput = controls.emptyStateNoItemsText;
            const gridItemActionsHostSelector = String(grid && grid.itemActionsHostSelector ? grid.itemActionsHostSelector : '').trim();
            const nestedEnabled = Boolean(nested && nested.enabled);
            const nestedChildrenKey = String(nested && nested.childrenKey ? nested.childrenKey : 'children').trim() || 'children';
            const nestedDefaultTriggerMode = String(nested && nested.triggerMode ? nested.triggerMode : 'arrow').trim().toLowerCase() === 'block'
                ? 'block'
                : 'arrow';
            const nestedRootExpandableWithoutChildren = nested && Object.prototype.hasOwnProperty.call(nested, 'rootExpandableWithoutChildren')
                ? Boolean(nested.rootExpandableWithoutChildren)
                : true;
            const nestedEmptyChildrenLabel = String(nested && nested.emptyChildrenLabel ? nested.emptyChildrenLabel : 'No items yet.').trim() || 'No items yet.';
            const nestedAddActionsEnabled = Boolean(nested && nested.addActionsEnabled);
            const nestedAddItemButtonLabel = nested && Object.prototype.hasOwnProperty.call(nested, 'addItemButtonLabel')
                ? nested.addItemButtonLabel
                : 'Add Item';
            const nestedAddItemButtonClassName = String(nested && nested.addItemButtonClassName ? nested.addItemButtonClassName : 'll-btn ll-btn--sm ll-btn--outline-default').trim();
            const nestedCanAddItem = typeof (nested && nested.canAddItem) === 'function' ? nested.canAddItem : null;
            const nestedOnAddItemClick = typeof (nested && nested.onAddItemClick) === 'function' ? nested.onAddItemClick : null;
            const nestedAnimate = nested && Object.prototype.hasOwnProperty.call(nested, 'animate')
                ? Boolean(nested.animate)
                : true;
            const nestedAnimationDurationMs = Number(nested && nested.animationDurationMs) > 0
                ? Number(nested.animationDurationMs)
                : 220;
            const nestedDefaultExpandedIds = Array.isArray(nested && nested.defaultExpandedIds)
                ? new Set(nested.defaultExpandedIds.map((value) => String(value || '').trim()).filter(Boolean))
                : new Set();
            const defaultGridColumns = (grid && Number(grid.columns) === 6) ? 6 : 4;
            const defaultGridGap = (grid && Number(grid.gap) === 4) ? 4 : 6;
            const defaultView = gridEnabled
                ? (String(grid.defaultView || '').trim().toLowerCase() === 'list' ? 'list' : 'grid')
                : 'list';

            const resolveIdValue = (item, index) => {
                if (item && item[idKey] !== undefined && item[idKey] !== null && String(item[idKey]).trim()) {
                    return String(item[idKey]);
                }
                return `row-${index}`;
            };

            const resolveNestedIdValue = (item, index, parentId = '') => {
                if (item && item[idKey] !== undefined && item[idKey] !== null && String(item[idKey]).trim()) {
                    return String(item[idKey]);
                }
                const normalizedParentId = String(parentId || '').trim();
                if (normalizedParentId) {
                    return `${normalizedParentId}::${index}`;
                }
                return `row-${index}`;
            };

            const getValueAtPath = (item, path) => {
                if (!item || !path) return undefined;
                const segments = String(path).split('.');
                let current = item;
                for (let i = 0; i < segments.length; i += 1) {
                    const segment = segments[i];
                    if (!segment) continue;
                    if (current == null || typeof current !== 'object') return undefined;
                    current = current[segment];
                }
                return current;
            };

            const normalizeArrayValues = (value) => {
                if (Array.isArray(value)) {
                    return value
                        .map((entry) => String(entry || '').trim())
                        .filter(Boolean);
                }
                const normalized = String(value || '').trim();
                if (!normalized) return [];
                return normalized
                    .split(',')
                    .map((entry) => entry.trim())
                    .filter(Boolean);
            };

            const validationWarnings = [];

            const normalizeFilterConfig = (filter, index) => {
                const key = String(filter && filter.key ? filter.key : `filter-${index}`);
                const typeRaw = String(filter && filter.type ? filter.type : 'single').trim().toLowerCase();
                const type = typeRaw === 'multiple' || typeRaw === 'toggle' ? typeRaw : 'single';
                const optionsList = Array.isArray(filter && filter.options) ? filter.options : [];
                const normalizedOptions = optionsList
                    .map((option) => {
                        const value = String(option && option.value != null ? option.value : '').trim();
                        const label = String(option && option.label != null ? option.label : value).trim();
                        if (!value || !label) return null;
                        return {
                            value,
                            label,
                            buttonId: String(option && option.buttonId ? option.buttonId : '').trim()
                        };
                    })
                    .filter(Boolean);
                const defaultValues = type === 'multiple'
                    ? normalizeArrayValues(filter && (filter.defaultValues || filter.defaultValue))
                    : [String(filter && filter.defaultValue ? filter.defaultValue : '').trim()].filter(Boolean);
                return {
                    key,
                    label: String(filter && filter.label ? filter.label : key),
                    type,
                    property: String(filter && filter.property ? filter.property : '').trim(),
                    options: normalizedOptions,
                    predicate: typeof (filter && filter.predicate) === 'function' ? filter.predicate : null,
                    getValue: typeof (filter && filter.getValue) === 'function' ? filter.getValue : null,
                    dropdown: filter && filter.dropdown ? filter.dropdown : null,
                    toggle: filter && filter.toggle ? filter.toggle : null,
                    defaultValues
                };
            };

            const normalizeSortConfig = (sort, index) => {
                const value = String(sort && sort.value ? sort.value : `sort-${index}`);
                const propertyTypeRaw = String(sort && sort.propertyType ? sort.propertyType : 'string').trim().toLowerCase();
                const propertyType = propertyTypeRaw === 'number' || propertyTypeRaw === 'date' ? propertyTypeRaw : 'string';
                const order = String(sort && sort.order ? sort.order : 'asc').trim().toLowerCase() === 'desc' ? 'desc' : 'asc';
                if (!((sort && typeof sort.getValue === 'function') || (sort && sort.property))) {
                    validationWarnings.push(`Sort "${value}" has no property/getValue and will have no effect.`);
                }
                return {
                    value,
                    label: String(sort && sort.label ? sort.label : value),
                    description: String(sort && sort.description ? sort.description : '').trim(),
                    property: String(sort && sort.property ? sort.property : '').trim(),
                    propertyType,
                    order,
                    getValue: typeof (sort && sort.getValue) === 'function' ? sort.getValue : null
                };
            };

            const normalizedFilters = filters.map(normalizeFilterConfig);
            const normalizedSorts = sorts.map(normalizeSortConfig);
            const normalizeItemActionItem = (action, index) => {
                const typeRaw = String(action && action.type ? action.type : 'dropdown').trim().toLowerCase();
                const type = typeRaw === 'button' || typeRaw === 'custom' ? typeRaw : 'dropdown';
                const key = String(action && action.key ? action.key : `action-${index}`).trim();
                if (type === 'button') {
                    const resolvedLabel = Object.prototype.hasOwnProperty.call(action || {}, 'label')
                        ? String(action && action.label != null ? action.label : '').trim()
                        : '';
                    return {
                        key,
                        type: 'button',
                        label: resolvedLabel,
                        icon: String(action && action.icon ? action.icon : '').trim(),
                        className: String(action && action.className ? action.className : 'll-btn ll-btn--outline-default').trim(),
                        iconClassName: String(action && action.iconClassName ? action.iconClassName : 'll-btn__icon').trim(),
                        ariaLabel: String(action && action.ariaLabel ? action.ariaLabel : resolvedLabel || 'Action').trim(),
                        when: typeof (action && action.when) === 'function' ? action.when : null,
                        onClick: typeof (action && action.onClick) === 'function' ? action.onClick : null
                    };
                }
                if (type === 'custom') {
                    return {
                        key,
                        type: 'custom',
                        when: typeof (action && action.when) === 'function' ? action.when : null,
                        render: typeof (action && action.render) === 'function' ? action.render : null
                    };
                }
                const optionsList = Array.isArray(action && action.options) ? action.options : [];
                const normalizedOptions = optionsList
                    .map((option, optionIndex) => {
                        const value = String(option && option.value != null ? option.value : `option-${optionIndex}`).trim();
                        const label = String(option && option.label != null ? option.label : value).trim();
                        if (!value || !label) return null;
                        return {
                            value,
                            label,
                            danger: Boolean(option && option.danger),
                            when: typeof (option && option.when) === 'function' ? option.when : null,
                            onSelect: typeof (option && option.onSelect) === 'function' ? option.onSelect : null
                        };
                    })
                    .filter(Boolean);
                return {
                    key,
                    type: 'dropdown',
                    triggerIcon: String(action && action.triggerIcon ? action.triggerIcon : 'more_vert').trim(),
                    triggerLabel: String(action && action.triggerLabel ? action.triggerLabel : '').trim(),
                    triggerAriaLabel: String(action && action.triggerAriaLabel ? action.triggerAriaLabel : 'Item actions').trim(),
                    triggerClassName: String(action && action.triggerClassName ? action.triggerClassName : 'll-icon-btn ll-icon-btn--circle').trim(),
                    when: typeof (action && action.when) === 'function' ? action.when : null,
                    align: String(action && action.align ? action.align : 'right').trim() || 'right',
                    matchTriggerWidth: Boolean(action && action.matchTriggerWidth),
                    minMenuWidthPx: Number(action && action.minMenuWidthPx) > 0 ? Number(action.minMenuWidthPx) : 128,
                    options: normalizedOptions,
                    onSelect: typeof (action && action.onSelect) === 'function' ? action.onSelect : null
                };
            };
            const normalizedItemActions = (Array.isArray(itemActions && itemActions.items) ? itemActions.items : [])
                .map(normalizeItemActionItem)
                .filter((actionConfig) => {
                    if (actionConfig.type === 'dropdown') return actionConfig.options.length > 0;
                    if (actionConfig.type === 'custom') return typeof actionConfig.render === 'function';
                    return true;
                });
            const DEFAULT_SORT_VALUE = '__ll_listing_default_sort__';
            const defaultSortLabel = String(controls.defaultSortLabel || 'Default').trim() || 'Default';
            normalizedFilters.forEach((filterConfig) => {
                if (!(filterConfig.property || filterConfig.getValue || filterConfig.predicate)) {
                    validationWarnings.push(`Filter "${filterConfig.key}" has no property/getValue/predicate and will be ignored.`);
                }
                if ((filterConfig.type === 'single' || filterConfig.type === 'multiple') && !filterConfig.dropdown) {
                    validationWarnings.push(`Filter "${filterConfig.key}" is "${filterConfig.type}" but has no dropdown config.`);
                }
                if (filterConfig.type === 'toggle' && !filterConfig.toggle) {
                    validationWarnings.push(`Filter "${filterConfig.key}" is "toggle" but has no toggle button mapping.`);
                }
            });
            if (!normalizedItemActions.length && Array.isArray(itemActions && itemActions.options) && itemActions.options.length) {
                validationWarnings.push('itemActions.options is no longer supported. Use itemActions.items instead.');
            }
            if (validationWarnings.length) {
                console.warn('[LlumenComponents.initListingModule] configuration warnings:', validationWarnings);
            }

            const resolveFilterInitialState = (filterConfig) => {
                if (filterConfig.type === 'multiple') {
                    return new Set(filterConfig.defaultValues);
                }
                return filterConfig.defaultValues[0] || '';
            };

            const state = {
                view: defaultView,
                query: '',
                sortValue: DEFAULT_SORT_VALUE,
                filterValues: {},
                selectedItemId: '',
                expandedItemIds: new Set(nestedDefaultExpandedIds)
            };

            normalizedFilters.forEach((filterConfig) => {
                state.filterValues[filterConfig.key] = resolveFilterInitialState(filterConfig);
            });

            const runtime = {
                disposed: false,
                boundControls: [],
                dropdownButtons: new Map(),
                viewButtons: { list: null, grid: null },
                clearAllFiltersButton: resolveElement(controls.clearAllFiltersButtonId || controls.clearAllFiltersButtonElement),
                searchInput: resolveElement(controls.searchInputId || controls.searchInputElement),
                searchInputShell: rootEl.querySelector('.ll-listing-module-search-input'),
                headerToolbar: rootEl.querySelector('.ll-listing-module-header__toolbar'),
                emptyStateHost: null
            };
            if (runtime.searchInputShell) {
                runtime.searchInputShell.classList.add('hidden');
            }
            if (runtime.headerToolbar) {
                runtime.headerToolbar.classList.add('hidden');
            }
            let api = null;

            const interactiveSelector = [
                'a',
                'button',
                'input',
                'select',
                'textarea',
                '[role="button"]',
                '[data-listing-action]',
                '.ll-dropdown__menu',
                '.ll-dropdown__trigger'
            ].join(',');

            const isInteractiveTarget = (event) => {
                const target = event && event.target && event.target.closest
                    ? event.target.closest(interactiveSelector)
                    : null;
                return Boolean(target);
            };

            const hasConfiguredEmptyState = (value) => {
                if (value == null) return false;
                if (typeof value === 'string') return Boolean(value.trim());
                if (typeof value === 'object') return true;
                return false;
            };

            const normalizeEmptyStateButton = (value) => {
                if (!value) return null;
                if (typeof value === 'string') {
                    const label = String(value).trim();
                    if (!label) return null;
                    return {
                        label,
                        icon: '',
                        className: 'll-btn ll-btn--outline-default',
                        ariaLabel: label,
                        onClick: null
                    };
                }
                if (typeof value !== 'object') return null;
                const label = String(value.label || '').trim();
                if (!label) return null;
                return {
                    label,
                    icon: String(value.icon || '').trim(),
                    className: String(value.className || 'll-btn ll-btn--outline-default').trim() || 'll-btn ll-btn--outline-default',
                    ariaLabel: String(value.ariaLabel || label).trim() || label,
                    onClick: typeof value.onClick === 'function' ? value.onClick : null
                };
            };

            const normalizeEmptyStateConfig = (value, fallbackText) => {
                if (typeof value === 'string') {
                    const text = String(value || '').trim() || fallbackText;
                    return { text, icon: '', button: null };
                }
                if (!value || typeof value !== 'object') {
                    return { text: fallbackText, icon: '', button: null };
                }
                const text = String(value.text || '').trim() || fallbackText;
                const icon = String(value.icon || '').trim();
                const button = normalizeEmptyStateButton(value.button);
                return { text, icon, button };
            };

            const defaultNoResultsEmptyStateConfig = normalizeEmptyStateConfig(defaultEmptyStateInput, 'No matching items.');
            const noItemsEmptyStateConfig = hasConfiguredEmptyState(emptyStateNoItemsInput)
                ? normalizeEmptyStateConfig(emptyStateNoItemsInput, defaultNoResultsEmptyStateConfig.text)
                : defaultNoResultsEmptyStateConfig;

            const getTreeDepthClassName = (depth) => {
                const normalizedDepth = Math.max(0, Number(depth) || 0);
                const clampedDepth = Math.min(normalizedDepth, 8);
                return `ll-listing-table__tree-depth-${clampedDepth}`;
            };

            const compareValues = (left, right, type) => {
                if (type === 'number') {
                    const a = Number(left);
                    const b = Number(right);
                    const av = Number.isFinite(a) ? a : Number.NEGATIVE_INFINITY;
                    const bv = Number.isFinite(b) ? b : Number.NEGATIVE_INFINITY;
                    if (av < bv) return -1;
                    if (av > bv) return 1;
                    return 0;
                }
                if (type === 'date') {
                    const a = Date.parse(left);
                    const b = Date.parse(right);
                    const av = Number.isFinite(a) ? a : Number.NEGATIVE_INFINITY;
                    const bv = Number.isFinite(b) ? b : Number.NEGATIVE_INFINITY;
                    if (av < bv) return -1;
                    if (av > bv) return 1;
                    return 0;
                }
                return String(left || '').localeCompare(String(right || ''), undefined, { sensitivity: 'base', numeric: true });
            };

            const getFilterValueForItem = (filterConfig, item) => {
                if (filterConfig.getValue) return filterConfig.getValue(item);
                if (filterConfig.property) return getValueAtPath(item, filterConfig.property);
                return undefined;
            };

            const isFilterAtDefault = (filterConfig, value) => {
                if (filterConfig.type === 'multiple') {
                    const current = Array.from(value || []).map((entry) => String(entry).trim()).filter(Boolean).sort();
                    const defaults = filterConfig.defaultValues.map((entry) => String(entry).trim()).filter(Boolean).sort();
                    if (current.length !== defaults.length) return false;
                    for (let i = 0; i < current.length; i += 1) {
                        if (current[i] !== defaults[i]) return false;
                    }
                    return true;
                }
                return String(value || '') === String(filterConfig.defaultValues[0] || '');
            };

            const hasActiveFilters = () => {
                return normalizedFilters.some((filterConfig) => {
                    const filterValue = state.filterValues[filterConfig.key];
                    return !isFilterAtDefault(filterConfig, filterValue);
                });
            };

            const getCurrentItems = () => internalItems.slice();

            const getItemChildren = (item) => {
                if (!nestedEnabled || !item || typeof item !== 'object') return [];
                const children = item[nestedChildrenKey];
                return Array.isArray(children) ? children : [];
            };

            const forEachItemDeep = (itemsInput, callback, context = {}) => {
                if (!Array.isArray(itemsInput) || typeof callback !== 'function') return;
                const walk = (entries, parentId, depth) => {
                    entries.forEach((entry, index) => {
                        const itemId = resolveNestedIdValue(entry, index, parentId);
                        callback(entry, {
                            itemId,
                            parentId: parentId || '',
                            depth
                        });
                        const children = getItemChildren(entry);
                        if (children.length) {
                            walk(children, itemId, depth + 1);
                        }
                    });
                };
                walk(itemsInput, context.parentId || '', Number(context.depth) || 0);
            };

            const commitItems = (nextItems, reason, payload) => {
                if (!Array.isArray(nextItems)) return;
                if (isControlled) {
                    if (typeof onRequestChange === 'function') {
                        onRequestChange({
                            reason,
                            nextItems: nextItems.slice(),
                            payload: payload || null
                        });
                    }
                    return;
                }
                internalItems = nextItems.slice();
                if (typeof onItemsChange === 'function') {
                    onItemsChange({
                        reason,
                        items: internalItems.slice(),
                        payload: payload || null
                    });
                }
            };

            const applyTemplateOutput = (targetElement, output) => {
                if (!targetElement) return;
                if (output == null) return;
                if (output && output.nodeType === 1) {
                    targetElement.appendChild(output);
                    return;
                }
                if (typeof output === 'string') {
                    if (allowUnsafeHtml) {
                        targetElement.innerHTML = output;
                    } else {
                        targetElement.textContent = output;
                    }
                    return;
                }
                targetElement.textContent = String(output);
            };

            const resolveClickHref = (item) => {
                if (!itemClick || itemClick.type !== 'link') return '';
                if (typeof itemClick.getHref === 'function') {
                    return String(itemClick.getHref(item) || '').trim();
                }
                if (itemClick.hrefProperty) {
                    return String(getValueAtPath(item, itemClick.hrefProperty) || '').trim();
                }
                return String(itemClick.href || '').trim();
            };

            const getSelectedItem = () => {
                const selectedId = String(state.selectedItemId || '').trim();
                if (!selectedId) return null;
                const currentItems = getCurrentItems();
                let selectedItem = null;
                forEachItemDeep(currentItems, (item, context) => {
                    if (selectedItem) return;
                    if (context.itemId === selectedId) {
                        selectedItem = item;
                    }
                });
                if (selectedItem) return selectedItem;
                return null;
            };

            const emitSelectionChange = (reason, event) => {
                if (!itemClick || itemClick.type !== 'selection' || typeof itemClick.onSelectionChange !== 'function') {
                    return;
                }
                itemClick.onSelectionChange({
                    reason: String(reason || ''),
                    event: event || null,
                    selectedItemId: String(state.selectedItemId || ''),
                    selectedItem: getSelectedItem(),
                    items: getCurrentItems(),
                    api
                });
            };

            const setSelectionById = (nextId, context = {}) => {
                const normalizedId = String(nextId || '').trim();
                if (state.selectedItemId === normalizedId) return false;
                state.selectedItemId = normalizedId;
                emitSelectionChange(context.reason || 'selection-change', context.event || null);
                return true;
            };

            const syncSelectionState = () => {
                const selectedId = String(state.selectedItemId || '').trim();
                if (!selectedId) return;
                let selectedStillExists = false;
                forEachItemDeep(getCurrentItems(), (_item, context) => {
                    if (selectedStillExists) return;
                    if (context.itemId === selectedId) {
                        selectedStillExists = true;
                    }
                });
                if (!selectedStillExists) {
                    setSelectionById('', { reason: 'selection-removed' });
                }
            };

            const triggerItemClick = (item, event) => {
                if (!itemClick) return;
                if (itemClick.type === 'link') {
                    const href = resolveClickHref(item);
                    if (!href) return;
                    const target = String(itemClick.target || '').trim();
                    if (target === '_blank') {
                        window.open(href, '_blank', 'noopener');
                    } else {
                        window.location.href = href;
                    }
                    return;
                }
                if (itemClick.type === 'selection') {
                    const selectedItemId = resolveIdValue(item, 0);
                    const changed = setSelectionById(selectedItemId, { reason: 'item-click', event });
                    if (changed) {
                        applyState();
                    }
                    if (typeof itemClick.onSelect === 'function') {
                        itemClick.onSelect({
                            item,
                            event,
                            selectedItemId,
                            items: getCurrentItems(),
                            api
                        });
                    }
                    return;
                }
                if (typeof itemClick.onClick === 'function') {
                    itemClick.onClick({
                        item,
                        event,
                        items: getCurrentItems()
                    });
                }
            };

            const hasItemActions = () => normalizedItemActions.length > 0;

            const runWhenConnected = (element, callback) => {
                if (!element || typeof callback !== 'function') return;
                const run = () => {
                    if (!element.isConnected) return;
                    callback();
                };
                if (element.isConnected) {
                    run();
                    return;
                }
                if (typeof queueMicrotask === 'function') {
                    queueMicrotask(run);
                } else {
                    window.setTimeout(run, 0);
                }
            };

            const createItemActionContext = (item, viewMode, itemId, actionConfig, actionValue, event) => {
                return {
                    item,
                    viewMode,
                    action: actionConfig || null,
                    actionValue: String(actionValue || '').trim(),
                    event: event || null,
                    items: getCurrentItems(),
                    removeItem: () => {
                        const nextItems = getCurrentItems().filter((entry, index) => resolveIdValue(entry, index) !== itemId);
                        commitItems(nextItems, 'item-action-remove', { id: itemId, viewMode, actionValue: String(actionValue || '').trim() });
                        applyState();
                    },
                    api
                };
            };

            const buildActionEvalContext = (item, viewMode) => {
                const filtersSnapshot = {};
                normalizedFilters.forEach((filterConfig) => {
                    const value = state.filterValues[filterConfig.key];
                    filtersSnapshot[filterConfig.key] = filterConfig.type === 'multiple'
                        ? Array.from(value || [])
                        : String(value || '');
                });
                return {
                    item,
                    viewMode,
                    state: {
                        view: state.view,
                        query: state.query,
                        sortValue: state.sortValue,
                        selectedItemId: String(state.selectedItemId || ''),
                        filters: filtersSnapshot
                    },
                    items: getCurrentItems(),
                    api
                };
            };

            const shouldRenderAction = (when, evalContext) => {
                if (typeof when !== 'function') return true;
                try {
                    return Boolean(when(evalContext));
                } catch (error) {
                    console.warn('[LlumenComponents.initListingModule] item action when() failed:', error);
                    return false;
                }
            };

            const createActionWrapper = (viewMode) => {
                const actionElement = document.createElement('div');
                const actionContentElement = document.createElement('div');
                if (viewMode === 'grid') {
                    actionElement.className = 'll-card__header-action';
                    actionContentElement.className = 'll-card__header-action-content';
                } else {
                    actionElement.className = 'll-listing-table__action';
                    actionContentElement.className = 'll-listing-table__action-content';
                }
                actionElement.appendChild(actionContentElement);
                return { actionElement, actionContentElement };
            };

            const appendCustomActionContent = (host, output) => {
                if (!host || output == null) return;
                if (output && output.nodeType === 1) {
                    host.appendChild(output);
                    return;
                }
                if (typeof output === 'string') {
                    if (allowUnsafeHtml) {
                        host.innerHTML = output;
                    } else {
                        host.textContent = output;
                    }
                    return;
                }
                host.textContent = String(output);
            };

            const renderItemActions = (hostElement, item, viewMode, itemId) => {
                if (!hostElement || !hasItemActions()) return;
                normalizedItemActions.forEach((actionConfig, actionIndex) => {
                    const actionEvalContext = buildActionEvalContext(item, viewMode);
                    if (!shouldRenderAction(actionConfig.when, actionEvalContext)) return;
                    const { actionElement, actionContentElement } = createActionWrapper(viewMode);
                    if (actionConfig.type === 'button') {
                        const actionButton = document.createElement('button');
                        actionButton.type = 'button';
                        actionButton.className = actionConfig.className || 'll-btn ll-btn--outline-default';
                        actionButton.dataset.listingAction = 'button';
                        actionButton.setAttribute('aria-label', actionConfig.ariaLabel || actionConfig.label || 'Action');
                        if (actionConfig.icon) {
                            const icon = document.createElement('span');
                            icon.className = `material-symbols-outlined ${actionConfig.iconClassName || 'll-btn__icon'}`;
                            icon.textContent = actionConfig.icon;
                            actionButton.appendChild(icon);
                        }
                        if (actionConfig.label) {
                            actionButton.appendChild(document.createTextNode(actionConfig.label));
                        }
                        actionButton.addEventListener('click', (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            const actionContext = createItemActionContext(item, viewMode, itemId, actionConfig, actionConfig.key, event);
                            if (typeof actionConfig.onClick === 'function') {
                                actionConfig.onClick(actionContext);
                            }
                            if (typeof itemActions.onAction === 'function') {
                                itemActions.onAction(actionContext);
                            }
                        });
                        actionContentElement.appendChild(actionButton);
                    } else if (actionConfig.type === 'custom') {
                        const customContext = createItemActionContext(item, viewMode, itemId, actionConfig, actionConfig.key, null);
                        appendCustomActionContent(actionContentElement, actionConfig.render(customContext));
                    } else {
                        const visibleOptions = actionConfig.options.filter((option) => shouldRenderAction(option.when, actionEvalContext));
                        if (!visibleOptions.length) return;
                        const actionId = `${moduleId}-${viewMode}-${itemId}-${actionConfig.key || actionIndex}-${Math.floor(Math.random() * 100000)}`;
                        const triggerButton = document.createElement('button');
                        triggerButton.id = `${actionId}-btn`;
                        triggerButton.type = 'button';
                        const baseTriggerClassName = String(actionConfig.triggerClassName || 'll-icon-btn ll-icon-btn--circle').trim();
                        triggerButton.className = /\bll-icon-btn--outline\b/.test(baseTriggerClassName)
                            ? baseTriggerClassName
                            : `${baseTriggerClassName} ll-icon-btn--outline`;
                        triggerButton.dataset.listingAction = 'dropdown';
                        triggerButton.setAttribute('aria-label', actionConfig.triggerAriaLabel || 'Item actions');
                        if (actionConfig.triggerIcon) {
                            const icon = document.createElement('span');
                            icon.className = 'material-symbols-outlined ll-icon-btn__icon';
                            icon.textContent = actionConfig.triggerIcon;
                            triggerButton.appendChild(icon);
                        } else if (actionConfig.triggerLabel) {
                            triggerButton.textContent = actionConfig.triggerLabel;
                        }
                        const menu = document.createElement('div');
                        menu.id = `${actionId}-menu`;
                        menu.className = 'hidden';
                        visibleOptions.forEach((option) => {
                            const optionButton = document.createElement('button');
                            optionButton.type = 'button';
                            optionButton.className = `ll-dropdown__item${option.danger ? ' ll-text-negative' : ''}`;
                            optionButton.dataset.value = option.value;
                            optionButton.textContent = option.label;
                            menu.appendChild(optionButton);
                        });
                        actionContentElement.appendChild(triggerButton);
                        actionContentElement.appendChild(menu);
                        runWhenConnected(triggerButton, () => {
                            initializePortaledDropdown({
                                buttonId: triggerButton.id,
                                menuId: menu.id,
                                datasetFlag: toDatasetKey(`${moduleDatasetKey}-action-${actionId}`, `${moduleDatasetKey}ActionBound`),
                                align: actionConfig.align || 'right',
                                matchTriggerWidth: Boolean(actionConfig.matchTriggerWidth),
                                minMenuWidthPx: actionConfig.minMenuWidthPx || 180,
                                onValueChange: (detail) => {
                                    const actionValue = String(detail && detail.value != null ? detail.value : '').trim();
                                    const selectedOption = visibleOptions.find((option) => option.value === actionValue) || null;
                                    const actionContext = createItemActionContext(item, viewMode, itemId, actionConfig, actionValue, null);
                                    if (selectedOption && typeof selectedOption.onSelect === 'function') {
                                        selectedOption.onSelect(actionContext);
                                    }
                                    if (typeof actionConfig.onSelect === 'function') {
                                        actionConfig.onSelect({
                                            ...actionContext,
                                            option: selectedOption
                                        });
                                    }
                                    if (typeof itemActions.onAction === 'function') {
                                        itemActions.onAction({
                                            ...actionContext,
                                            option: selectedOption
                                        });
                                    }
                                }
                            });
                        });
                    }
                    hostElement.appendChild(actionElement);
                });
            };

            const resolveNestedTriggerMode = (item, context = {}) => {
                if (!nestedEnabled) return 'arrow';
                if (typeof (nested && nested.getTriggerMode) === 'function') {
                    try {
                        const computedMode = String(nested.getTriggerMode({
                            item,
                            depth: Number(context.depth) || 0,
                            parentId: String(context.parentId || ''),
                            hasChildren: Boolean(context.hasChildren),
                            viewMode: context.viewMode || 'list',
                            state: {
                                view: state.view,
                                query: state.query,
                                sortValue: state.sortValue
                            }
                        }) || '').trim().toLowerCase();
                        if (computedMode === 'block' || computedMode === 'arrow') {
                            return computedMode;
                        }
                    } catch (error) {
                        console.warn('[LlumenComponents.initListingModule] nested.getTriggerMode() failed:', error);
                    }
                }
                return nestedDefaultTriggerMode;
            };

            const buildNestedAddContext = (parentItem, context = {}) => {
                return {
                    parentItem,
                    depth: Number(context.depth) || 0,
                    parentId: String(context.parentId || ''),
                    itemId: String(context.itemId || ''),
                    viewMode: context.viewMode || 'list',
                    event: context.event || null,
                    state: {
                        view: state.view,
                        query: state.query,
                        sortValue: state.sortValue,
                        selectedItemId: String(state.selectedItemId || '')
                    },
                    items: getCurrentItems(),
                    api
                };
            };

            const canRenderNestedAddAction = (parentItem, context = {}) => {
                if (!nestedAddActionsEnabled) return false;
                if (typeof nestedCanAddItem !== 'function') return true;
                try {
                    return Boolean(nestedCanAddItem(buildNestedAddContext(parentItem, context)));
                } catch (error) {
                    console.warn('[LlumenComponents.initListingModule] nested.canAddItem() failed:', error);
                    return false;
                }
            };

            const resolveNestedAddButtonLabel = (parentItem, context = {}) => {
                if (typeof nestedAddItemButtonLabel === 'function') {
                    try {
                        const computed = nestedAddItemButtonLabel(buildNestedAddContext(parentItem, context));
                        return String(computed || 'Add Item').trim() || 'Add Item';
                    } catch (error) {
                        console.warn('[LlumenComponents.initListingModule] nested.addItemButtonLabel() failed:', error);
                        return 'Add Item';
                    }
                }
                return String(nestedAddItemButtonLabel || 'Add Item').trim() || 'Add Item';
            };

            const createNestedAddButton = (rowEntry, labelText) => {
                const addButton = document.createElement('button');
                addButton.type = 'button';
                addButton.className = nestedAddItemButtonClassName || 'll-btn ll-btn--sm ll-btn--outline-default';
                addButton.dataset.listingAction = 'nested-add-item';

                const icon = document.createElement('span');
                icon.className = 'material-symbols-outlined ll-btn__icon';
                icon.textContent = 'add';
                addButton.appendChild(icon);
                addButton.appendChild(document.createTextNode(String(labelText || 'Add Item')));

                addButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!nestedOnAddItemClick) return;
                    try {
                        nestedOnAddItemClick(buildNestedAddContext(rowEntry.parentItem || null, {
                            depth: Math.max(0, Number(rowEntry.depth || 0) - 1),
                            parentId: String(rowEntry.parentId || ''),
                            itemId: String(rowEntry.parentId || ''),
                            viewMode: 'list',
                            event
                        }));
                    } catch (error) {
                        console.warn('[LlumenComponents.initListingModule] nested.onAddItemClick() failed:', error);
                    }
                });
                return addButton;
            };

            const isExpanded = (itemId) => state.expandedItemIds.has(String(itemId || '').trim());

            const setExpanded = (itemId, shouldExpand) => {
                if (!nestedEnabled) return false;
                const normalizedId = String(itemId || '').trim();
                if (!normalizedId) return false;
                const nextExpand = Boolean(shouldExpand);
                const alreadyExpanded = state.expandedItemIds.has(normalizedId);
                if (alreadyExpanded === nextExpand) return false;
                if (nextExpand) {
                    state.expandedItemIds.add(normalizedId);
                } else {
                    state.expandedItemIds.delete(normalizedId);
                }
                return true;
            };

            const toggleExpanded = (itemId) => {
                if (!nestedEnabled) return false;
                const normalizedId = String(itemId || '').trim();
                if (!normalizedId) return false;
                if (state.expandedItemIds.has(normalizedId)) {
                    state.expandedItemIds.delete(normalizedId);
                    return true;
                }
                state.expandedItemIds.add(normalizedId);
                return true;
            };

            const animateRows = (rows, expand, onComplete) => {
                if (!nestedAnimate || !rows.length) {
                    if (typeof onComplete === 'function') onComplete();
                    return;
                }
                const runRowAnimation = (row) => {
                    return new Promise((resolve) => {
                        const cellShells = Array.from(row.querySelectorAll('.ll-listing-table__cell-shell'));
                        if (!cellShells.length) {
                            resolve();
                            return;
                        }
                        const durationMs = Math.max(120, nestedAnimationDurationMs);
                        const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
                        row.classList.add('ll-listing-table__row--animating');
                        let finished = false;
                        let completedCount = 0;
                        const finish = () => {
                            if (finished) return;
                            finished = true;
                            row.classList.remove('ll-listing-table__row--animating');
                            row.style.opacity = '';
                            row.style.transitionProperty = '';
                            row.style.transitionDuration = '';
                            row.style.transitionTimingFunction = '';
                            row.style.willChange = '';
                            cellShells.forEach((shell) => {
                                shell.removeEventListener('transitionend', onShellTransitionEnd);
                                shell.style.height = '';
                                shell.style.paddingTop = '';
                                shell.style.paddingBottom = '';
                                shell.style.opacity = '';
                                shell.style.transitionProperty = '';
                                shell.style.transitionDuration = '';
                                shell.style.transitionTimingFunction = '';
                                shell.style.willChange = '';
                            });
                            resolve();
                        };
                        const fallbackTimer = window.setTimeout(finish, durationMs + 120);
                        row.style.transitionProperty = 'opacity';
                        row.style.transitionDuration = `${durationMs}ms`;
                        row.style.transitionTimingFunction = easing;
                        row.style.willChange = 'opacity';
                        const completedShells = new WeakSet();
                        const onShellTransitionEnd = (event) => {
                            if (event.propertyName !== 'height') return;
                            const shell = event.currentTarget;
                            if (!shell || completedShells.has(shell)) return;
                            completedShells.add(shell);
                            completedCount += 1;
                            if (completedCount >= cellShells.length) {
                                window.clearTimeout(fallbackTimer);
                                finish();
                            }
                        };
                        const shellMetrics = cellShells.map((shell) => {
                            const computed = window.getComputedStyle(shell);
                            return {
                                shell,
                                height: shell.scrollHeight,
                                paddingTop: computed.paddingTop,
                                paddingBottom: computed.paddingBottom
                            };
                        });
                        cellShells.forEach((shell) => {
                            const metric = shellMetrics.find((entry) => entry.shell === shell);
                            const targetHeight = metric ? metric.height : shell.scrollHeight;
                            const targetPaddingTop = metric ? metric.paddingTop : '0px';
                            const targetPaddingBottom = metric ? metric.paddingBottom : '0px';
                            shell.style.transitionProperty = 'height, padding-top, padding-bottom, opacity';
                            shell.style.transitionDuration = `${durationMs}ms`;
                            shell.style.transitionTimingFunction = easing;
                            shell.style.willChange = 'height, padding-top, padding-bottom, opacity';
                            shell.removeEventListener('transitionend', onShellTransitionEnd);
                            shell.addEventListener('transitionend', onShellTransitionEnd);
                            if (expand) {
                                row.style.opacity = '0';
                                shell.style.height = '0px';
                                shell.style.paddingTop = '0px';
                                shell.style.paddingBottom = '0px';
                                shell.style.opacity = '0';
                            } else {
                                row.style.opacity = '1';
                                shell.style.height = `${targetHeight}px`;
                                shell.style.paddingTop = targetPaddingTop;
                                shell.style.paddingBottom = targetPaddingBottom;
                                shell.style.opacity = '1';
                            }
                        });
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                cellShells.forEach((shell) => {
                                    const metric = shellMetrics.find((entry) => entry.shell === shell);
                                    const targetHeight = metric ? metric.height : shell.scrollHeight;
                                    const targetPaddingTop = metric ? metric.paddingTop : '0px';
                                    const targetPaddingBottom = metric ? metric.paddingBottom : '0px';
                                    if (expand) {
                                        row.style.opacity = '1';
                                        shell.style.height = `${targetHeight}px`;
                                        shell.style.paddingTop = targetPaddingTop;
                                        shell.style.paddingBottom = targetPaddingBottom;
                                        shell.style.opacity = '1';
                                    } else {
                                        row.style.opacity = '0';
                                        shell.style.height = '0px';
                                        shell.style.paddingTop = '0px';
                                        shell.style.paddingBottom = '0px';
                                        shell.style.opacity = '0';
                                    }
                                });
                            });
                        });
                    });
                };
                Promise.all(rows.map((row) => runRowAnimation(row))).then(() => {
                    if (typeof onComplete === 'function') onComplete();
                });
            };

            const isNestedPathVisible = (path) => {
                const normalizedPath = String(path || '').trim();
                if (!normalizedPath) return true;
                const segments = normalizedPath.split('/').filter(Boolean);
                if (segments.length <= 1) return true;
                for (let index = 0; index < segments.length - 1; index += 1) {
                    if (!state.expandedItemIds.has(segments[index])) {
                        return false;
                    }
                }
                return true;
            };

            const syncNestedToggleUi = () => {
                if (!tableHost) return;
                const toggleButtons = Array.from(tableHost.querySelectorAll('.ll-listing-table__tree-toggle'));
                toggleButtons.forEach((button) => {
                    const row = button.closest('tr[data-listing-item-id]');
                    if (!row) return;
                    const itemId = String(row.dataset.listingItemId || '').trim();
                    const expanded = isExpanded(itemId);
                    button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
                    button.setAttribute('aria-label', expanded ? 'Collapse' : 'Expand');
                    const icon = button.querySelector('.ll-listing-table__tree-toggle-icon');
                    if (icon) {
                        icon.classList.toggle('ll-active', expanded);
                    }
                });
            };

            const syncNestedRowsVisibility = (options = {}) => {
                if (!nestedEnabled || !tableHost) return;
                const { animate = false, direction = '' } = options;
                const nestedRows = Array.from(tableHost.querySelectorAll('tbody tr[data-nested-path]'));
                if (!nestedRows.length) return;
                const toShow = [];
                const toHide = [];
                nestedRows.forEach((row) => {
                    const path = String(row.dataset.nestedPath || '').trim();
                    const nextVisible = isNestedPathVisible(path);
                    const currentVisible = !row.classList.contains('hidden');
                    if (nextVisible && !currentVisible) {
                        toShow.push(row);
                    } else if (!nextVisible && currentVisible) {
                        toHide.push(row);
                    }
                });
                if (!animate) {
                    toShow.forEach((row) => row.classList.remove('hidden'));
                    toHide.forEach((row) => row.classList.add('hidden'));
                    return;
                }
                if (direction === 'collapse' && toHide.length) {
                    animateRows(toHide, false, () => {
                        toHide.forEach((row) => {
                            const path = String(row.dataset.nestedPath || '').trim();
                            if (!isNestedPathVisible(path)) {
                                row.classList.add('hidden');
                            } else {
                                row.classList.remove('hidden');
                            }
                        });
                    });
                    return;
                }
                if (direction === 'expand' && toShow.length) {
                    toShow.forEach((row) => row.classList.remove('hidden'));
                    animateRows(toShow, true);
                    return;
                }
                toShow.forEach((row) => row.classList.remove('hidden'));
                toHide.forEach((row) => row.classList.add('hidden'));
            };

            const ensureEmptyStateHost = () => {
                const existingHost = runtime.emptyStateHost && runtime.emptyStateHost.isConnected
                    ? runtime.emptyStateHost
                    : rootEl.querySelector(`[data-ll-listing-empty-host="${moduleId}"]`);
                if (existingHost) {
                    runtime.emptyStateHost = existingHost;
                    return existingHost;
                }
                const host = document.createElement('div');
                host.className = 'll-empty hidden';
                host.dataset.llListingEmptyHost = moduleId;
                rootEl.appendChild(host);
                runtime.emptyStateHost = host;
                return host;
            };

            const setViewHostsEmptyState = (isEmpty) => {
                if (tableHost) {
                    tableHost.classList.toggle('ll-listing-module__view-host--empty', isEmpty);
                }
                if (gridHost) {
                    gridHost.classList.toggle('ll-listing-module__view-host--empty', isEmpty);
                }
            };

            const setHeaderEmptyDataState = (isSourceEmpty) => {
                if (runtime.searchInputShell) {
                    runtime.searchInputShell.classList.toggle('hidden', isSourceEmpty);
                }
                if (runtime.headerToolbar) {
                    runtime.headerToolbar.classList.toggle('hidden', isSourceEmpty);
                }
            };

            const syncSharedEmptyState = ({ isVisible = false, hasSourceItems = false } = {}) => {
                const emptyHost = ensureEmptyStateHost();
                if (!emptyHost) return;
                emptyHost.classList.toggle('hidden', !isVisible);
                emptyHost.innerHTML = '';
                if (isVisible) {
                    const emptyStateConfig = hasSourceItems
                        ? defaultNoResultsEmptyStateConfig
                        : noItemsEmptyStateConfig;
                    const content = document.createElement('div');
                    content.className = 'll-empty__content';
                    if (emptyStateConfig.icon) {
                        const icon = document.createElement('span');
                        icon.className = 'material-symbols-outlined ll-empty__icon';
                        icon.textContent = emptyStateConfig.icon;
                        content.appendChild(icon);
                    }
                    const text = document.createElement('p');
                    text.className = 'll-empty__text';
                    text.textContent = emptyStateConfig.text;
                    content.appendChild(text);
                    if (emptyStateConfig.button) {
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = emptyStateConfig.button.className;
                        button.setAttribute('aria-label', emptyStateConfig.button.ariaLabel);
                        if (emptyStateConfig.button.icon) {
                            const iconEl = document.createElement('span');
                            iconEl.className = 'material-symbols-outlined ll-btn__icon';
                            iconEl.textContent = emptyStateConfig.button.icon;
                            button.appendChild(iconEl);
                        }
                        button.appendChild(document.createTextNode(emptyStateConfig.button.label));
                        if (emptyStateConfig.button.onClick) {
                            button.addEventListener('click', (event) => {
                                emptyStateConfig.button.onClick({
                                    event,
                                    reason: hasSourceItems ? 'no-results' : 'no-items',
                                    api
                                });
                            });
                        }
                        content.appendChild(button);
                    }
                    emptyHost.appendChild(content);
                }
                setViewHostsEmptyState(isVisible);
            };

            const renderListTable = (visibleItems) => {
                if (!tableHost) return;
                const columns = Array.isArray(table.columns) ? table.columns : [];
                const hasExplicitMainColumn = columns.some((column) => Boolean(column && column.isMain));
                const isMainColumn = (column, columnIndex) => Boolean(column && column.isMain) || (!hasExplicitMainColumn && columnIndex === 0);
                const addClassNameTokens = (element, className) => {
                    if (!element || !className) return;
                    String(className)
                        .split(/\s+/)
                        .map((token) => token.trim())
                        .filter(Boolean)
                        .forEach((token) => element.classList.add(token));
                };
                tableHost.innerHTML = '';
                const tableEl = document.createElement('table');
                tableEl.className = 'll-listing-table';
                if (nestedEnabled) {
                    tableEl.classList.add('ll-listing-table--nested');
                }
                const thead = document.createElement('thead');
                const headRow = document.createElement('tr');
                columns.forEach((column, columnIndex) => {
                    const headingCell = document.createElement('th');
                    if (isMainColumn(column, columnIndex)) {
                        headingCell.classList.add('ll-listing-table__column-main');
                    }
                    addClassNameTokens(headingCell, column && column.headerClassName);
                    headingCell.textContent = String(column && column.heading ? column.heading : column && column.property ? column.property : 'Column');
                    headRow.appendChild(headingCell);
                });
                if (hasItemActions()) {
                    const actionHeadingCell = document.createElement('th');
                    actionHeadingCell.textContent = '';
                    headRow.appendChild(actionHeadingCell);
                }
                thead.appendChild(headRow);
                tableEl.appendChild(thead);
                const tbody = document.createElement('tbody');

                visibleItems.forEach((entry, index) => {
                    const rowEntry = nestedEnabled && entry && typeof entry === 'object' && Object.prototype.hasOwnProperty.call(entry, 'item')
                        ? entry
                        : null;
                    const item = rowEntry ? rowEntry.item : entry;
                    const isEmptyPlaceholderRow = Boolean(rowEntry && rowEntry.isEmptyPlaceholder);
                    const isAddActionRow = Boolean(rowEntry && rowEntry.isAddActionRow);
                    const isSpecialNestedRow = isEmptyPlaceholderRow || isAddActionRow;
                    const row = document.createElement('tr');
                    const itemId = rowEntry ? String(rowEntry.itemId || resolveIdValue(item, index)) : resolveIdValue(item, index);
                    const isSelected = itemClick && itemClick.type === 'selection' && itemId === String(state.selectedItemId || '');
                    if (isEmptyPlaceholderRow) {
                        row.className = 'll-listing-table__row--nested-empty';
                    } else if (isAddActionRow) {
                        row.className = 'll-listing-table__row--nested-add';
                    } else {
                        row.className = `ll-listing-table__row--clickable${isSelected ? ' ll-active' : ''}`;
                        if (nestedEnabled && rowEntry && rowEntry.canExpand) {
                            row.classList.add(rowEntry.triggerMode === 'block'
                                ? 'll-listing-table__row--tree-block-trigger'
                                : 'll-listing-table__row--tree-arrow-trigger');
                        }
                    }
                    row.dataset.listingItemId = itemId;
                    if (rowEntry && rowEntry.isVisible === false) {
                        row.classList.add('hidden');
                    }
                    if (rowEntry && rowEntry.path) {
                        row.dataset.nestedPath = String(rowEntry.path);
                    }
                    if (rowEntry && rowEntry.parentPath) {
                        row.dataset.nestedParentPath = String(rowEntry.parentPath);
                    }
                    if (!isSpecialNestedRow && itemClick && itemClick.type === 'selection') {
                        row.setAttribute('aria-selected', isSelected ? 'true' : 'false');
                    }
                    if (isSpecialNestedRow) {
                        const specialCell = document.createElement('td');
                        specialCell.className = 'll-listing-table__cell-colspan';
                        specialCell.colSpan = columns.length + (hasItemActions() ? 1 : 0);
                        const specialCellShell = document.createElement('div');
                        specialCellShell.className = 'll-listing-table__cell-shell';
                        const treeCell = document.createElement('div');
                        treeCell.className = 'll-listing-table__tree-cell';
                        treeCell.classList.add(getTreeDepthClassName(Math.max(0, Number(rowEntry.depth) || 0)));
                        const treeContent = document.createElement('div');
                        treeContent.className = 'll-listing-table__tree-content';
                        const specialContent = document.createElement('div');
                        specialContent.className = isEmptyPlaceholderRow
                            ? 'll-listing-table__nested-empty'
                            : 'll-listing-table__nested-add';
                        if (isEmptyPlaceholderRow) {
                            const emptyLabel = document.createElement('span');
                            emptyLabel.className = 'll-listing-table__tree-empty';
                            emptyLabel.textContent = String(rowEntry.emptyLabel || nestedEmptyChildrenLabel);
                            specialContent.appendChild(emptyLabel);
                            if (rowEntry.canAddItem) {
                                specialContent.appendChild(createNestedAddButton(rowEntry, rowEntry.addButtonLabel || 'Add Item'));
                            }
                        } else if (isAddActionRow) {
                            specialContent.appendChild(createNestedAddButton(rowEntry, rowEntry.addButtonLabel || 'Add Item'));
                        }
                        treeContent.appendChild(specialContent);
                        treeCell.appendChild(treeContent);
                        specialCellShell.appendChild(treeCell);
                        specialCell.appendChild(specialCellShell);
                        row.appendChild(specialCell);
                        tbody.appendChild(row);
                        return;
                    }
                    columns.forEach((column, columnIndex) => {
                        const cell = document.createElement('td');
                        const cellShell = document.createElement('div');
                        cellShell.className = 'll-listing-table__cell-shell';
                        cell.appendChild(cellShell);
                        const value = column && column.property ? getValueAtPath(item, column.property) : undefined;
                        const isMain = isMainColumn(column, columnIndex);
                        if (isMainColumn(column, columnIndex)) {
                            cell.classList.add('ll-listing-table__cell-main');
                            cell.classList.add('ll-listing-table__column-main');
                        }
                        addClassNameTokens(cell, column && column.cellClassName);
                        let contentTarget = cellShell;
                        if (nestedEnabled && rowEntry && isMain) {
                            const treeCell = document.createElement('div');
                            treeCell.className = 'll-listing-table__tree-cell';
                            treeCell.classList.add(getTreeDepthClassName(Math.max(0, Number(rowEntry.depth) || 0)));
                            if (!isEmptyPlaceholderRow && rowEntry.canExpand) {
                                const toggleButton = document.createElement('button');
                                toggleButton.type = 'button';
                                toggleButton.className = 'll-listing-table__tree-toggle';
                                toggleButton.dataset.listingAction = 'tree-toggle';
                                toggleButton.dataset.treeTriggerMode = rowEntry.triggerMode === 'block' ? 'block' : 'arrow';
                                toggleButton.setAttribute('aria-label', isExpanded(itemId) ? 'Collapse' : 'Expand');
                                toggleButton.setAttribute('aria-expanded', isExpanded(itemId) ? 'true' : 'false');
                                const toggleIcon = document.createElement('span');
                                toggleIcon.className = `material-symbols-outlined ll-tree__icon ll-listing-table__tree-toggle-icon${isExpanded(itemId) ? ' ll-active' : ''}`;
                                toggleIcon.textContent = 'chevron_right';
                                toggleButton.appendChild(toggleIcon);
                                toggleButton.addEventListener('click', (event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    const currentlyExpanded = isExpanded(itemId);
                                    if (!toggleExpanded(itemId)) return;
                                    syncNestedToggleUi();
                                    syncNestedRowsVisibility({
                                        animate: true,
                                        direction: currentlyExpanded ? 'collapse' : 'expand'
                                    });
                                });
                                treeCell.appendChild(toggleButton);
                            }
                            const treeContent = document.createElement('div');
                            treeContent.className = 'll-listing-table__tree-content';
                            treeCell.appendChild(treeContent);
                            contentTarget.appendChild(treeCell);
                            contentTarget = treeContent;
                        }
                        if (isEmptyPlaceholderRow) {
                            if (isMain) {
                                contentTarget.classList.add('ll-listing-table__tree-empty');
                                contentTarget.textContent = String(rowEntry.emptyLabel || nestedEmptyChildrenLabel);
                            } else {
                                contentTarget.textContent = '';
                            }
                        } else if (column && typeof column.renderCell === 'function') {
                            const output = column.renderCell(item, value, {
                                rowIndex: index,
                                column,
                                escapeHtml
                            });
                            applyTemplateOutput(contentTarget, output);
                        } else {
                            if (isMainColumn(column, columnIndex) && itemClick && itemClick.type === 'link') {
                                const href = resolveClickHref(item);
                                if (href) {
                                    const anchor = document.createElement('a');
                                    anchor.href = href;
                                    anchor.className = 'll-listing-table__link';
                                    anchor.textContent = String(value == null ? '' : value);
                                    contentTarget.appendChild(anchor);
                                } else {
                                    contentTarget.textContent = String(value == null ? '' : value);
                                }
                            } else {
                                contentTarget.textContent = String(value == null ? '' : value);
                            }
                        }
                        row.appendChild(cell);
                    });
                    if (!isEmptyPlaceholderRow && hasItemActions()) {
                        const actionCell = document.createElement('td');
                        actionCell.className = 'll-listing-table__cell-actions';
                        const actionCellShell = document.createElement('div');
                        actionCellShell.className = 'll-listing-table__cell-shell';
                        const actionsRoot = document.createElement('div');
                        actionsRoot.className = 'll-listing-table__actions';
                        renderItemActions(actionsRoot, item, 'list', itemId);
                        actionCellShell.appendChild(actionsRoot);
                        actionCell.appendChild(actionCellShell);
                        row.appendChild(actionCell);
                    }
                    row.addEventListener('click', (event) => {
                        if (isSpecialNestedRow) return;
                        if (isInteractiveTarget(event)) return;
                        if (nestedEnabled && rowEntry && rowEntry.canExpand && rowEntry.triggerMode === 'block') {
                            const currentlyExpanded = isExpanded(itemId);
                            if (!toggleExpanded(itemId)) return;
                            syncNestedToggleUi();
                            syncNestedRowsVisibility({
                                animate: true,
                                direction: currentlyExpanded ? 'collapse' : 'expand'
                            });
                            return;
                        }
                        triggerItemClick(item, event);
                    });
                    row.addEventListener('keydown', (event) => {
                        if (isSpecialNestedRow) return;
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        if (isInteractiveTarget(event)) return;
                        event.preventDefault();
                        if (nestedEnabled && rowEntry && rowEntry.canExpand && rowEntry.triggerMode === 'block') {
                            const currentlyExpanded = isExpanded(itemId);
                            if (!toggleExpanded(itemId)) return;
                            syncNestedToggleUi();
                            syncNestedRowsVisibility({
                                animate: true,
                                direction: currentlyExpanded ? 'collapse' : 'expand'
                            });
                            return;
                        }
                        triggerItemClick(item, event);
                    });
                    if (!isSpecialNestedRow) {
                        row.tabIndex = 0;
                    }
                    tbody.appendChild(row);
                });

                tableEl.appendChild(tbody);
                tableHost.appendChild(tableEl);
            };

            const getGridClassNames = () => {
                const columns = Number(state.gridColumns || defaultGridColumns) === 6 ? 'll-grid--cols-6' : 'll-grid--cols-4';
                const gap = Number(state.gridGap || defaultGridGap) === 4 ? 'll-grid--gap-4' : 'll-grid--gap-6';
                return `ll-grid ${columns} ${gap}`;
            };

            const renderGrid = (visibleItems) => {
                if (!gridEnabled || !gridHost) return;
                gridHost.innerHTML = '';
                if (state.view !== 'grid') {
                    gridHost.classList.add('hidden');
                    return;
                }
                gridHost.classList.remove('hidden');
                const gridContainer = document.createElement('div');
                gridContainer.className = 'll-listing-module-grid-container';
                const gridWrap = document.createElement('div');
                gridWrap.className = getGridClassNames();
                visibleItems.forEach((item, index) => {
                    const itemId = resolveIdValue(item, index);
                    const isSelected = itemClick && itemClick.type === 'selection' && itemId === String(state.selectedItemId || '');
                    const cardShell = document.createElement('div');
                    cardShell.className = `ll-listing-grid-item ll-card ll-card--linkable${isSelected ? ' ll-active' : ''}`;
                    const content = (grid && typeof grid.renderCard === 'function')
                        ? grid.renderCard(item, {
                            index,
                            escapeHtml
                        })
                        : `<div class="ll-card__content"><div class="ll-card__content-heading">${escapeHtml(String(item && item.title ? item.title : 'Item'))}</div></div>`;
                    applyTemplateOutput(cardShell, content);
                    if (hasItemActions()) {
                        const gridActionsHostSelector = gridItemActionsHostSelector || '.ll-card__header-actions';
                        const actionHost = cardShell.querySelector(gridActionsHostSelector);
                        if (actionHost) {
                            renderItemActions(actionHost, item, 'grid', itemId);
                        } else {
                            console.warn('[LlumenComponents.initListingModule] grid actions host was not found in rendered card:', gridActionsHostSelector);
                        }
                    }
                    if (itemClick) {
                        if (itemClick.type === 'link') {
                            const href = resolveClickHref(item);
                            if (href) {
                                const overlayLink = document.createElement('a');
                                overlayLink.href = href;
                                overlayLink.className = 'll-card__link-overlay';
                                overlayLink.setAttribute('aria-label', `Open item ${resolveIdValue(item, index)}`);
                                cardShell.appendChild(overlayLink);
                            }
                        } else {
                            const overlayButton = document.createElement('button');
                            overlayButton.type = 'button';
                            overlayButton.className = 'll-card__link-overlay';
                            overlayButton.setAttribute('aria-label', itemClick.type === 'selection'
                                ? `Select item ${itemId}`
                                : `Open item ${itemId}`);
                            overlayButton.addEventListener('click', (event) => {
                                triggerItemClick(item, event);
                            });
                            cardShell.appendChild(overlayButton);
                        }
                    }
                    gridWrap.appendChild(cardShell);
                });
                gridContainer.appendChild(gridWrap);
                gridHost.appendChild(gridContainer);
            };

            const matchesSearch = (item) => {
                const query = String(state.query || '').trim().toLowerCase();
                if (!query) return true;
                const searchFields = Array.isArray(search.fields) ? search.fields.map((entry) => String(entry || '').trim()).filter(Boolean) : [];
                if (typeof search.getText === 'function') {
                    return String(search.getText(item) || '').toLowerCase().includes(query);
                }
                if (searchFields.length) {
                    return searchFields.some((fieldPath) => String(getValueAtPath(item, fieldPath) || '').toLowerCase().includes(query));
                }
                return JSON.stringify(item || {}).toLowerCase().includes(query);
            };

            const applySearch = (itemsInput) => {
                return itemsInput.filter((item) => matchesSearch(item));
            };

            const matchesFilters = (item) => {
                for (let i = 0; i < normalizedFilters.length; i += 1) {
                    const filterConfig = normalizedFilters[i];
                    const filterValue = state.filterValues[filterConfig.key];
                    if (filterConfig.type === 'multiple') {
                        const values = Array.from(filterValue || []).filter(Boolean);
                        if (!values.length) continue;
                        if (filterConfig.predicate) {
                            if (!filterConfig.predicate(item, values, state)) return false;
                            continue;
                        }
                        const actualValue = getFilterValueForItem(filterConfig, item);
                        const actualArray = Array.isArray(actualValue) ? actualValue.map((entry) => String(entry || '').trim()) : [String(actualValue || '').trim()];
                        const matched = values.some((entry) => actualArray.includes(entry));
                        if (!matched) return false;
                        continue;
                    }
                    const value = String(filterValue || '').trim();
                    if (!value) continue;
                    if (filterConfig.predicate) {
                        if (!filterConfig.predicate(item, value, state)) return false;
                        continue;
                    }
                    const actualValue = String(getFilterValueForItem(filterConfig, item) || '').trim();
                    if (actualValue !== value) return false;
                }
                return true;
            };

            const applyFilters = (itemsInput) => {
                return itemsInput.filter((item) => matchesFilters(item));
            };

            const applySorting = (itemsInput) => {
                if (!normalizedSorts.length || !state.sortValue || state.sortValue === DEFAULT_SORT_VALUE) return itemsInput;
                const selectedSort = normalizedSorts.find((entry) => entry.value === state.sortValue) || normalizedSorts[0];
                if (!selectedSort) return itemsInput;
                const direction = selectedSort.order === 'desc' ? -1 : 1;
                return itemsInput
                    .map((item, index) => ({ item, index }))
                    .sort((left, right) => {
                        const leftValue = selectedSort.getValue
                            ? selectedSort.getValue(left.item)
                            : getValueAtPath(left.item, selectedSort.property);
                        const rightValue = selectedSort.getValue
                            ? selectedSort.getValue(right.item)
                            : getValueAtPath(right.item, selectedSort.property);
                        const compared = compareValues(leftValue, rightValue, selectedSort.propertyType) * direction;
                        if (compared !== 0) return compared;
                        return left.index - right.index;
                    })
                    .map((entry) => entry.item);
            };

            const hasActiveSearch = () => Boolean(String(state.query || '').trim());

            const syncExpandedState = () => {
                if (!nestedEnabled) return;
                const validIds = new Set();
                forEachItemDeep(getCurrentItems(), (_item, context) => {
                    validIds.add(context.itemId);
                });
                Array.from(state.expandedItemIds).forEach((expandedId) => {
                    if (!validIds.has(expandedId)) {
                        state.expandedItemIds.delete(expandedId);
                    }
                });
            };

            const buildNestedVisibleResult = (itemsInput) => {
                const resultRows = [];
                const hasQuery = hasActiveSearch();
                const hasFilters = hasActiveFilters();
                const shouldRestrictChildrenToMatches = hasQuery || hasFilters;

                const buildRows = (entries, parentId = '', depth = 0, parentPath = '') => {
                    const sortedEntries = applySorting(entries.slice());
                    sortedEntries.forEach((item, index) => {
                        const itemId = resolveNestedIdValue(item, index, parentId);
                        const itemPath = parentPath ? `${parentPath}/${itemId}` : itemId;
                        const children = getItemChildren(item);
                        const sortedChildren = applySorting(children.slice());
                        const parentMatches = matchesSearch(item) && matchesFilters(item);
                        const matchedChildren = sortedChildren.filter((child) => matchesSearch(child) && matchesFilters(child));
                        const includeParent = parentMatches || matchedChildren.length > 0 || (!hasQuery && !hasFilters);
                        if (!includeParent) return;
                        const visibleChildren = shouldRestrictChildrenToMatches ? matchedChildren : sortedChildren;
                        const hasChildren = visibleChildren.length > 0;
                        const canExpand = depth === 0
                            ? (nestedRootExpandableWithoutChildren || hasChildren)
                            : hasChildren;
                        const isVisible = depth === 0 || isNestedPathVisible(itemPath);
                        const triggerMode = resolveNestedTriggerMode(item, {
                            depth,
                            parentId,
                            hasChildren: canExpand,
                            viewMode: 'list'
                        });
                        resultRows.push({
                            item,
                            itemId,
                            depth,
                            parentId,
                            path: itemPath,
                            parentPath,
                            isVisible,
                            canExpand,
                            hasChildren,
                            triggerMode
                        });
                        if (canExpand) {
                            const addActionContext = {
                                depth,
                                parentId,
                                itemId,
                                viewMode: 'list'
                            };
                            const canAddItem = canRenderNestedAddAction(item, addActionContext);
                            const addButtonLabel = canAddItem ? resolveNestedAddButtonLabel(item, addActionContext) : '';
                            if (hasChildren) {
                                buildRows(visibleChildren, itemId, depth + 1, itemPath);
                                if (canAddItem) {
                                    resultRows.push({
                                        item: null,
                                        itemId: `${itemId}::add`,
                                        depth: depth + 1,
                                        parentId: itemId,
                                        path: `${itemPath}/__add__`,
                                        parentPath: itemPath,
                                        isVisible: isNestedPathVisible(`${itemPath}/__add__`),
                                        isAddActionRow: true,
                                        addButtonLabel,
                                        parentItem: item
                                    });
                                }
                            } else {
                                resultRows.push({
                                    item: null,
                                    itemId: `${itemId}::empty`,
                                    depth: depth + 1,
                                    parentId: itemId,
                                    path: `${itemPath}/__empty__`,
                                    parentPath: itemPath,
                                    isVisible: isNestedPathVisible(`${itemPath}/__empty__`),
                                    isEmptyPlaceholder: true,
                                    emptyLabel: nestedEmptyChildrenLabel,
                                    addButtonLabel: canAddItem ? addButtonLabel : '',
                                    canAddItem,
                                    parentItem: item
                                });
                            }
                        }
                    });
                };

                buildRows(itemsInput, '', 0, '');
                return {
                    rows: resultRows,
                    gridItems: applySorting(itemsInput.slice()).filter((item) => matchesSearch(item) && matchesFilters(item))
                };
            };

            const syncViewToggleUi = () => {
                const listBtn = runtime.viewButtons.list;
                const gridBtn = runtime.viewButtons.grid;
                if (listBtn) {
                    const active = state.view === 'list';
                    listBtn.classList.toggle('ll-btn--primary', active);
                    listBtn.classList.toggle('ll-btn--outline-default', !active);
                    listBtn.classList.toggle('ll-active', active);
                }
                if (gridBtn) {
                    const active = state.view === 'grid';
                    gridBtn.classList.toggle('ll-btn--primary', active);
                    gridBtn.classList.toggle('ll-btn--outline-default', !active);
                    gridBtn.classList.toggle('ll-active', active);
                }
                if (tableHost) {
                    tableHost.classList.toggle('hidden', state.view !== 'list');
                }
                if (gridHost) {
                    gridHost.classList.toggle('hidden', state.view !== 'grid');
                }
            };

            const syncClearAllFiltersButton = () => {
                if (!runtime.clearAllFiltersButton) return;
                runtime.clearAllFiltersButton.classList.toggle('hidden', !hasActiveFilters());
            };

            const syncToggleFilterUi = () => {
                normalizedFilters.forEach((filterConfig) => {
                    if (filterConfig.type !== 'toggle' || !filterConfig.toggle) return;
                    const buttonIdsByValue = filterConfig.toggle.buttonIdsByValue || {};
                    filterConfig.options.forEach((option) => {
                        const buttonId = String(buttonIdsByValue[option.value] || option.buttonId || '').trim();
                        const button = resolveElement(buttonId);
                        if (!button) return;
                        const isActive = String(state.filterValues[filterConfig.key] || '') === option.value;
                        button.classList.toggle('ll-btn--primary', isActive);
                        button.classList.toggle('ll-btn--outline-default', !isActive);
                        button.classList.toggle('ll-active', isActive);
                        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                    });
                });
            };

            const syncFilterDropdownUi = () => {
                normalizedFilters.forEach((filterConfig) => {
                    if (!filterConfig.dropdown) return;
                    const buttonId = String(filterConfig.dropdown.buttonId || '').trim();
                    const dropdownButton = runtime.dropdownButtons.get(`filter:${filterConfig.key}`) || resolveElement(buttonId);
                    if (!dropdownButton || typeof dropdownButton.__setPortaledDropdownValue !== 'function') return;
                    if (filterConfig.type === 'multiple') {
                        dropdownButton.__setPortaledDropdownValue(Array.from(state.filterValues[filterConfig.key] || []), false);
                    } else {
                        dropdownButton.__setPortaledDropdownValue(String(state.filterValues[filterConfig.key] || ''), false);
                    }
                });
            };

            const syncSortDropdownUi = () => {
                const sortDropdown = controls.sortDropdown || {};
                const sortButton = resolveElement(sortDropdown.buttonId || sortDropdown.buttonElement);
                if (!sortButton || typeof sortButton.__setPortaledDropdownValue !== 'function') return;
                sortButton.__setPortaledDropdownValue(String(state.sortValue || ''), false);
            };

            const applyState = () => {
                if (runtime.disposed) return;
                syncSelectionState();
                syncExpandedState();
                const sourceItems = getCurrentItems();
                let visibleItems = [];
                let visibleGridItems = [];
                if (nestedEnabled) {
                    const nestedVisibleResult = buildNestedVisibleResult(sourceItems);
                    visibleItems = nestedVisibleResult.rows;
                    visibleGridItems = nestedVisibleResult.gridItems;
                } else {
                    const searched = applySearch(sourceItems);
                    const filtered = applyFilters(searched);
                    visibleItems = applySorting(filtered);
                    visibleGridItems = visibleItems;
                }
                renderListTable(visibleItems);
                if (gridEnabled && gridHost) {
                    renderGrid(visibleGridItems);
                }
                syncViewToggleUi();
                const sourceItemsCount = sourceItems.length;
                const visibleItemsCount = nestedEnabled ? visibleGridItems.length : visibleItems.length;
                setHeaderEmptyDataState(sourceItemsCount === 0);
                syncSharedEmptyState({
                    isVisible: sourceItemsCount === 0 || visibleItemsCount === 0,
                    hasSourceItems: sourceItemsCount > 0
                });
                syncToggleFilterUi();
                syncClearAllFiltersButton();
            };

            const setFilterValue = (filterKey, nextValue) => {
                const filterConfig = normalizedFilters.find((entry) => entry.key === filterKey);
                if (!filterConfig) return;
                if (filterConfig.type === 'multiple') {
                    state.filterValues[filterConfig.key] = new Set(normalizeArrayValues(nextValue));
                } else {
                    state.filterValues[filterConfig.key] = String(nextValue || '').trim();
                }
                applyState();
            };

            const resetFiltersToDefault = () => {
                normalizedFilters.forEach((filterConfig) => {
                    state.filterValues[filterConfig.key] = resolveFilterInitialState(filterConfig);
                });
                syncFilterDropdownUi();
                syncToggleFilterUi();
                applyState();
            };

            const bindControls = () => {
                if (runtime.searchInput) {
                    const clearButtonId = controls.searchClearButtonId || controls.searchClearButtonElement;
                    initializeSearchInput(runtime.searchInput.id, {
                        clearButtonId: clearButtonId || null,
                        datasetFlag: toDatasetKey(`${moduleDatasetKey}-search-bound`, `${moduleDatasetKey}SearchBound`),
                        onInput: (value) => {
                            state.query = String(value || '');
                            applyState();
                        },
                        onClear: () => {
                            state.query = '';
                            applyState();
                        }
                    });
                }

                if (runtime.clearAllFiltersButton) {
                    const onClearClick = (event) => {
                        event.preventDefault();
                        resetFiltersToDefault();
                    };
                    runtime.clearAllFiltersButton.addEventListener('click', onClearClick);
                    runtime.boundControls.push(() => runtime.clearAllFiltersButton.removeEventListener('click', onClearClick));
                }

                const viewToggle = controls.viewToggle || {};
                runtime.viewButtons.list = resolveElement(viewToggle.listButtonId || viewToggle.listButtonElement);
                runtime.viewButtons.grid = resolveElement(viewToggle.gridButtonId || viewToggle.gridButtonElement);

                if (gridEnabled && runtime.viewButtons.list && runtime.viewButtons.grid) {
                    const listBtn = runtime.viewButtons.list;
                    const gridBtn = runtime.viewButtons.grid;
                    const sharedParent = listBtn.parentElement && listBtn.parentElement === gridBtn.parentElement
                        ? listBtn.parentElement
                        : null;
                    if (sharedParent) {
                        if (defaultView === 'grid') {
                            sharedParent.insertBefore(gridBtn, listBtn);
                        } else {
                            sharedParent.insertBefore(listBtn, gridBtn);
                        }
                    }
                    const onListClick = (event) => {
                        event.preventDefault();
                        state.view = 'list';
                        applyState();
                    };
                    const onGridClick = (event) => {
                        event.preventDefault();
                        state.view = 'grid';
                        applyState();
                    };
                    listBtn.addEventListener('click', onListClick);
                    gridBtn.addEventListener('click', onGridClick);
                    runtime.boundControls.push(() => listBtn.removeEventListener('click', onListClick));
                    runtime.boundControls.push(() => gridBtn.removeEventListener('click', onGridClick));
                }

                normalizedFilters.forEach((filterConfig) => {
                    if (filterConfig.type === 'toggle' && filterConfig.toggle) {
                        const buttonIdsByValue = filterConfig.toggle.buttonIdsByValue || {};
                        filterConfig.options.forEach((option) => {
                            const buttonId = String(buttonIdsByValue[option.value] || option.buttonId || '').trim();
                            const button = resolveElement(buttonId);
                            if (!button) return;
                            const onClick = (event) => {
                                event.preventDefault();
                                setFilterValue(filterConfig.key, option.value);
                            };
                            button.addEventListener('click', onClick);
                            runtime.boundControls.push(() => button.removeEventListener('click', onClick));
                        });
                        return;
                    }

                    if (!filterConfig.dropdown) return;
                    const dropdownButton = resolveElement(filterConfig.dropdown.buttonId || filterConfig.dropdown.buttonElement);
                    const dropdownMenu = resolveElement(filterConfig.dropdown.menuId || filterConfig.dropdown.menuElement);
                    if (!dropdownButton || !dropdownMenu) return;
                    dropdownMenu.innerHTML = '';
                    filterConfig.options.forEach((option) => {
                        const menuOption = document.createElement('button');
                        menuOption.type = 'button';
                        menuOption.className = 'll-dropdown__item';
                        menuOption.dataset.value = option.value;
                        menuOption.textContent = option.label;
                        dropdownMenu.appendChild(menuOption);
                    });
                    initializePortaledDropdown({
                        buttonId: dropdownButton.id,
                        menuId: dropdownMenu.id,
                        selectedValueSelector: filterConfig.dropdown.selectedValueSelector || '.ll-dropdown__selected-value',
                        datasetFlag: toDatasetKey(`${moduleDatasetKey}-filter-${filterConfig.key}-dropdown`, `${moduleDatasetKey}FilterDropdownBound`),
                        menuType: 'selection',
                        selectionType: filterConfig.type === 'multiple' ? 'multiple' : 'single',
                        clearable: Boolean(filterConfig.dropdown.clearable),
                        dropdownIcon: filterConfig.dropdown.dropdownIcon || '',
                        dropdownLabel: filterConfig.dropdown.dropdownLabel || filterConfig.label || '',
                        showLabel: filterConfig.dropdown.showLabel !== false,
                        emptySelectionLabel: filterConfig.dropdown.emptySelectionLabel || filterConfig.label || 'Select option',
                        onValueChange: (detail) => {
                            if (filterConfig.type === 'multiple') {
                                setFilterValue(filterConfig.key, detail && detail.values ? detail.values : []);
                            } else {
                                setFilterValue(filterConfig.key, detail && detail.value != null ? detail.value : '');
                            }
                        },
                        matchTriggerWidth: filterConfig.dropdown.matchTriggerWidth === true,
                        align: filterConfig.dropdown.align || 'left'
                    });
                    runtime.dropdownButtons.set(`filter:${filterConfig.key}`, dropdownButton);
                });

                const sortDropdown = controls.sortDropdown || {};
                const sortButton = resolveElement(sortDropdown.buttonId || sortDropdown.buttonElement);
                const sortMenu = resolveElement(sortDropdown.menuId || sortDropdown.menuElement);
                if (sortButton && sortMenu && normalizedSorts.length) {
                    sortMenu.innerHTML = '';
                    const defaultOption = document.createElement('button');
                    defaultOption.type = 'button';
                    defaultOption.className = 'll-dropdown__item';
                    defaultOption.dataset.value = DEFAULT_SORT_VALUE;
                    defaultOption.textContent = defaultSortLabel;
                    sortMenu.appendChild(defaultOption);
                    normalizedSorts.forEach((sortConfig) => {
                        const menuOption = document.createElement('button');
                        menuOption.type = 'button';
                        menuOption.className = 'll-dropdown__item';
                        menuOption.dataset.value = sortConfig.value;
                        const suffix = sortConfig.description ? ` (${sortConfig.description})` : '';
                        menuOption.textContent = `${sortConfig.label}${suffix}`;
                        sortMenu.appendChild(menuOption);
                    });
                    initializePortaledDropdown({
                        buttonId: sortButton.id,
                        menuId: sortMenu.id,
                        selectedValueSelector: sortDropdown.selectedValueSelector || '.ll-dropdown__selected-value',
                        datasetFlag: toDatasetKey(`${moduleDatasetKey}-sort-dropdown`, `${moduleDatasetKey}SortDropdownBound`),
                        menuType: 'selection',
                        dropdownIcon: sortDropdown.dropdownIcon || '',
                        dropdownLabel: sortDropdown.dropdownLabel || '',
                        showLabel: sortDropdown.showLabel !== false,
                        emptySelectionLabel: sortDropdown.emptySelectionLabel || 'Sort',
                        defaultValue: state.sortValue,
                        onValueChange: (detail) => {
                            const selectedValue = String(detail && detail.value ? detail.value : DEFAULT_SORT_VALUE).trim();
                            state.sortValue = selectedValue || DEFAULT_SORT_VALUE;
                            applyState();
                        },
                        matchTriggerWidth: sortDropdown.matchTriggerWidth === true,
                        align: sortDropdown.align || 'left'
                    });
                }
            };

            api = {
                setItems(nextItems) {
                    if (!Array.isArray(nextItems)) return;
                    internalItems = nextItems.slice();
                    applyState();
                },
                setState(partialState = {}) {
                    if (partialState && Object.prototype.hasOwnProperty.call(partialState, 'query')) {
                        state.query = String(partialState.query || '');
                    }
                    if (partialState && Object.prototype.hasOwnProperty.call(partialState, 'view') && gridEnabled) {
                        const nextView = String(partialState.view || '').trim().toLowerCase();
                        state.view = nextView === 'list' ? 'list' : 'grid';
                    }
                    if (partialState && Object.prototype.hasOwnProperty.call(partialState, 'sortValue')) {
                        state.sortValue = String(partialState.sortValue || state.sortValue);
                    }
                    if (partialState && Object.prototype.hasOwnProperty.call(partialState, 'selectedItemId')) {
                        setSelectionById(partialState.selectedItemId, { reason: 'state-update' });
                    }
                    if (partialState && Object.prototype.hasOwnProperty.call(partialState, 'expandedItemIds') && nestedEnabled) {
                        const nextExpanded = Array.isArray(partialState.expandedItemIds)
                            ? partialState.expandedItemIds.map((value) => String(value || '').trim()).filter(Boolean)
                            : [];
                        state.expandedItemIds = new Set(nextExpanded);
                    }
                    applyState();
                },
                getState() {
                    const filtersSnapshot = {};
                    normalizedFilters.forEach((filterConfig) => {
                        const value = state.filterValues[filterConfig.key];
                        filtersSnapshot[filterConfig.key] = filterConfig.type === 'multiple'
                            ? Array.from(value || [])
                            : String(value || '');
                    });
                    return {
                        view: state.view,
                        query: state.query,
                        sortValue: state.sortValue,
                        selectedItemId: String(state.selectedItemId || ''),
                        selectedItem: getSelectedItem(),
                        expandedItemIds: nestedEnabled ? Array.from(state.expandedItemIds) : [],
                        filters: filtersSnapshot,
                        items: getCurrentItems()
                    };
                },
                getSelectedItem() {
                    return getSelectedItem();
                },
                clearSelection() {
                    const changed = setSelectionById('', { reason: 'api-clear-selection' });
                    if (changed) {
                        applyState();
                    }
                },
                selectItem(itemOrId) {
                    let nextSelectedId = '';
                    if (itemOrId && typeof itemOrId === 'object') {
                        nextSelectedId = resolveIdValue(itemOrId, 0);
                    } else {
                        nextSelectedId = String(itemOrId || '').trim();
                    }
                    const changed = setSelectionById(nextSelectedId, { reason: 'api-select-item' });
                    if (changed) {
                        applyState();
                    }
                },
                toggleItemExpanded(itemOrId) {
                    if (!nestedEnabled) return;
                    const targetId = itemOrId && typeof itemOrId === 'object'
                        ? resolveIdValue(itemOrId, 0)
                        : String(itemOrId || '').trim();
                    if (toggleExpanded(targetId)) {
                        applyState();
                    }
                },
                setItemExpanded(itemOrId, shouldExpand) {
                    if (!nestedEnabled) return;
                    const targetId = itemOrId && typeof itemOrId === 'object'
                        ? resolveIdValue(itemOrId, 0)
                        : String(itemOrId || '').trim();
                    if (setExpanded(targetId, shouldExpand)) {
                        applyState();
                    }
                },
                isItemExpanded(itemOrId) {
                    if (!nestedEnabled) return false;
                    const targetId = itemOrId && typeof itemOrId === 'object'
                        ? resolveIdValue(itemOrId, 0)
                        : String(itemOrId || '').trim();
                    return isExpanded(targetId);
                },
                destroy() {
                    runtime.disposed = true;
                    runtime.boundControls.forEach((cleanup) => {
                        try {
                            cleanup();
                        } catch (_error) {
                            /* ignore */
                        }
                    });
                    runtime.boundControls = [];
                    if (runtime.emptyStateHost && runtime.emptyStateHost.parentNode) {
                        runtime.emptyStateHost.parentNode.removeChild(runtime.emptyStateHost);
                    }
                    runtime.emptyStateHost = null;
                }
            };

            const validatedSortValue = String(controls.defaultSortValue || controls.defaultSort || '').trim();
            if (validatedSortValue && normalizedSorts.some((sortConfig) => sortConfig.value === validatedSortValue)) {
                state.sortValue = validatedSortValue;
            } else {
                state.sortValue = DEFAULT_SORT_VALUE;
            }
            state.gridColumns = defaultGridColumns;
            state.gridGap = defaultGridGap;

            bindControls();
            syncFilterDropdownUi();
            syncSortDropdownUi();
            applyState();
            return api;
        }

        /**
         * Model-driven horizontal carousel: scroll chrome, tabs strip (optional editable / sortable / delete),
         * or card slots with a consistently flex-based track.
         *
         * Editable tabs: rename through a dedicated edit icon toggle (edit → check confirm). Reorder only
         * via `.ll-carousel__tab-drag`. Delete uses `.ll-carousel__tab-delete` + `initializeConfirmationDialog`.
         *
         * @param {object} options
         * @param {HTMLElement} options.root — Mount host; previous carousel markup under this root is replaced on (re)init.
         * @param {'tabs'|'cards'} [options.mode='tabs']
         * @param {'freeform'|'grid'} [options.sizing='freeform'] — Cards only; track is always flex.
         * @param {object[]} [options.items=[]]
         * @param {function(object): string} [options.getItemId]
         * @param {string} [options.tabLabelKey='label']
         * @param {string|null} [options.initialActiveId=null]
         * @param {object} [options.tabs] — `{ editable, editMode, defaultNewLabel, addButtonLabel, maxTitleLength, minTabsToKeep, confirmDeleteTitle, confirmDeleteBody, confirmDeleteConfirmLabel }` where `minTabsToKeep` supports `0|1` (default `0`).
         * @param {number} [options.gridColumns=4] — Grid card columns in viewport (`2|3|4|6`).
         * @param {number} [options.gridGap=6] — Grid card gap scale (`4|6`).
         * @param {string} [options.gridTrackClassName] — Legacy class passthrough; still parsed for `ll-grid--carousel-cols-*` / `ll-grid--gap-*`.
         * @param {number} [options.scrollStepPercent=40] — Tabs + freeform cards: scroll step as % of viewport width.
         * @param {number} [options.scrollStepPx=150] — Legacy px fallback step (used when % step does not apply).
         * @param {function(object, { index: number, activeId: string }): string|HTMLElement} [options.renderCard]
         * @param {function({ activeId: string, previousId: string|null }): void} [options.onActiveTabChange]
         * @param {function({ items: object[], reason: string }): void} [options.onItemsChange]
         */
        function initializeHorizontalCarousel(options = {}) {
            const root = options.root;
            if (!root || root.nodeType !== 1) {
                return {
                    destroy() {},
                    getItems() {
                        return [];
                    },
                    setItems() {},
                    getActiveId() {
                        return null;
                    },
                    setActiveId() {},
                    setEditMode() {},
                    scrollActiveIntoView() {}
                };
            }

            const mode = options.mode === 'cards' ? 'cards' : 'tabs';
            const sizing = options.sizing === 'grid' ? 'grid' : 'freeform';
            const tabLabelKey = String(options.tabLabelKey || 'label');
            const getItemId = typeof options.getItemId === 'function'
                ? options.getItemId
                : (item) => String(item && item.id != null ? item.id : '').trim();

            const tabsCfg = options.tabs && typeof options.tabs === 'object' ? options.tabs : {};
            const tabsEditable = tabsCfg.editable === true;
            let editMode = tabsCfg.editMode !== false;
            const defaultNewLabel = String(tabsCfg.defaultNewLabel || 'New Tab');
            const addButtonLabel = String(tabsCfg.addButtonLabel || 'Add Tab');
            const maxTitleLength = Math.max(1, parseInt(tabsCfg.maxTitleLength, 10) || 50);
            const parsedMinTabsToKeep = parseInt(tabsCfg.minTabsToKeep, 10);
            const minTabsToKeep = parsedMinTabsToKeep === 1 ? 1 : 0;
            const confirmDeleteTitle = String(tabsCfg.confirmDeleteTitle || 'Remove tab');
            const confirmDeleteBody = String(
                tabsCfg.confirmDeleteBody || 'Remove this tab? Content for this context may be lost.'
            );
            const confirmDeleteConfirmLabel = String(tabsCfg.confirmDeleteConfirmLabel || 'Remove');

            const onActiveTabChange = typeof options.onActiveTabChange === 'function'
                ? options.onActiveTabChange
                : null;
            const onItemsChange = typeof options.onItemsChange === 'function' ? options.onItemsChange : null;
            const renderCard = typeof options.renderCard === 'function' ? options.renderCard : null;

            const scrollStepPx = Math.max(40, parseInt(options.scrollStepPx, 10) || 150);
            const scrollStepPercent = Math.max(1, parseFloat(options.scrollStepPercent) || 40);
            const tolerancePx = Math.max(0, parseFloat(options.tolerancePx) || 0.5);
            const legacyGridTrackClassName = String(options.gridTrackClassName || '').trim();
            const resolveGridColumns = () => {
                const supported = [2, 3, 4, 6];
                const explicit = parseInt(options.gridColumns, 10);
                if (supported.includes(explicit)) return explicit;
                const legacyMatch = legacyGridTrackClassName.match(/ll-grid--carousel-cols-(2|3|4|6)\b/);
                if (legacyMatch) return parseInt(legacyMatch[1], 10);
                return 4;
            };
            const resolveGridGap = () => {
                const explicit = parseInt(options.gridGap, 10);
                if (explicit === 4 || explicit === 6) return explicit;
                const legacyMatch = legacyGridTrackClassName.match(/ll-grid--gap-(4|6)\b/);
                if (legacyMatch) return parseInt(legacyMatch[1], 10);
                return 6;
            };
            const gridColumns = resolveGridColumns();
            const gridGap = resolveGridGap();

            const TAB_SELECTOR = '.ll-carousel__tab';
            const HANDLE_SELECTOR = '.ll-carousel__tab-drag';
            const EDIT_SELECTOR = '.ll-carousel__tab-edit';
            const DELETE_SELECTOR = '.ll-carousel__tab-delete';

            let items = Array.isArray(options.items) ? options.items.slice() : [];
            let activeId = options.initialActiveId != null && String(options.initialActiveId).trim()
                ? String(options.initialActiveId).trim()
                : null;
            let editingTabId = null;
            const draftLabelById = {};
            const inlineEditEscapeKey = `inline-edit:carousel:${++llumenOverlayEscapeState.nextInlineEditDomIdCounter}`;

            const ensureActiveId = () => {
                if (items.length === 0) {
                    activeId = null;
                    return;
                }
                if (!activeId || !items.some((it) => getItemId(it) === activeId)) {
                    activeId = getItemId(items[0]);
                }
            };

            const emitItems = (reason) => {
                if (onItemsChange) {
                    try {
                        onItemsChange({ items: items.slice(), reason });
                    } catch (_e) {
                        /* ignore */
                    }
                }
            };

            const emitActive = (previousId) => {
                if (onActiveTabChange) {
                    try {
                        onActiveTabChange({ activeId, previousId: previousId == null ? null : String(previousId) });
                    } catch (_e) {
                        /* ignore */
                    }
                }
            };

            const syncInlineEditEscapeEntry = () => {
                if (!(mode === 'tabs' && tabsEditable && editMode && !!editingTabId)) {
                    removeOverlayInlineEditEntry(inlineEditEscapeKey);
                    return;
                }
                pushOverlayInlineEditEntry({
                    key: inlineEditEscapeKey,
                    cancel() {
                        if (disposed) return;
                        if (!editingTabId) return;
                        discardEditingTabAndExit();
                        renderTabs();
                    },
                    isOpen() {
                        return !disposed && mode === 'tabs' && tabsEditable && editMode && !!editingTabId;
                    }
                });
            };

            const sanitizeLabel = (value, fallbackValue) => {
                let next = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
                if (!next) {
                    next = String(fallbackValue == null ? '' : fallbackValue).trim();
                }
                if (!next) {
                    next = defaultNewLabel;
                }
                if (next.length > maxTitleLength) {
                    next = next.slice(0, maxTitleLength);
                }
                return next;
            };

            const setActiveIdInternal = (nextId, { silent } = {}) => {
                const prev = activeId;
                const resolved = nextId != null && String(nextId).trim() ? String(nextId).trim() : null;
                if (resolved && items.some((it) => getItemId(it) === resolved)) {
                    activeId = resolved;
                } else {
                    ensureActiveId();
                }
                syncTabActiveClasses();
                if (!silent && activeId !== prev) {
                    emitActive(prev);
                }
            };

            const getItemById = (id) => {
                const targetId = String(id || '');
                return items.find((it) => getItemId(it) === targetId) || null;
            };

            const commitTabRename = (tabId) => {
                const id = String(tabId || '');
                if (!id) return false;
                const item = getItemById(id);
                if (!item) return false;
                const previousLabel = String(item[tabLabelKey] != null ? item[tabLabelKey] : defaultNewLabel);
                const nextLabel = sanitizeLabel(draftLabelById[id], previousLabel);
                delete draftLabelById[id];
                if (nextLabel === previousLabel) return false;
                item[tabLabelKey] = nextLabel;
                emitItems('rename');
                return true;
            };

            const commitEditingTabAndExit = () => {
                if (!editingTabId) return false;
                const changed = commitTabRename(editingTabId);
                editingTabId = null;
                return changed;
            };

            const discardEditingTabAndExit = () => {
                if (!editingTabId) return false;
                const id = String(editingTabId);
                delete draftLabelById[id];
                editingTabId = null;
                return true;
            };

            const findTabElementById = (tabId) => {
                const targetId = String(tabId || '');
                if (!targetId) return null;
                const tabEls = track.querySelectorAll(TAB_SELECTOR);
                for (let i = 0; i < tabEls.length; i += 1) {
                    const el = tabEls[i];
                    if (el.dataset.llCarouselTabId === targetId) return el;
                }
                return null;
            };

            const applyNonEditingUiToTab = (tabEl, tabId) => {
                if (!tabEl) return;
                const id = String(tabId || '');
                const item = getItemById(id);
                const baseLabel = String(item && item[tabLabelKey] != null ? item[tabLabelKey] : defaultNewLabel);
                const label = tabEl.querySelector('.ll-carousel__tab-label');
                if (label) {
                    label.textContent = baseLabel;
                    label.contentEditable = 'false';
                    label.removeAttribute('spellcheck');
                }
                const editBtn = tabEl.querySelector('.ll-carousel__tab-edit');
                if (editBtn) {
                    editBtn.setAttribute('aria-label', 'Edit tab title');
                    editBtn.innerHTML = '<span class="material-symbols-outlined ll-icon-btn__icon">edit</span>';
                    editBtn.classList.remove('ll-icon-btn--outline', 'll-icon-btn--outline-positive');
                }
                const delBtn = tabEl.querySelector('.ll-carousel__tab-delete');
                if (delBtn) {
                    delBtn.setAttribute('aria-label', 'Delete tab');
                    delBtn.innerHTML = '<span class="material-symbols-outlined ll-icon-btn__icon">delete</span>';
                    delBtn.classList.remove('ll-icon-btn--outline', 'll-icon-btn--outline-negative');
                }
            };

            const discardEditingTabAndExitInPlace = () => {
                if (!editingTabId) return false;
                const id = String(editingTabId);
                delete draftLabelById[id];
                editingTabId = null;
                applyNonEditingUiToTab(findTabElementById(id), id);
                syncInlineEditEscapeEntry();
                return true;
            };

            root.innerHTML = '';
            root.classList.add('ll-carousel');

            const leftOverlay = document.createElement('div');
            leftOverlay.className = 'll-carousel__overlay ll-carousel__overlay--left ll-carousel__overlay--hidden';
            const leftBtn = document.createElement('button');
            leftBtn.type = 'button';
            leftBtn.className = 'll-icon-btn ll-icon-btn--circle ll-icon-btn--lg ll-carousel__scroll-btn';
            leftBtn.setAttribute('aria-label', 'Scroll left');
            leftBtn.innerHTML = '<span class="material-symbols-outlined ll-icon-btn__icon">chevron_left</span>';
            leftOverlay.appendChild(leftBtn);

            const track = document.createElement('div');
            if (mode === 'tabs') {
                track.className = 'll-carousel__track ll-carousel__track--tabs';
                track.setAttribute('role', 'tablist');
            } else if (sizing === 'grid') {
                const passthroughLegacyClasses = legacyGridTrackClassName
                    ? legacyGridTrackClassName
                        .split(/\s+/)
                        .filter(Boolean)
                        .filter(
                            (name) => name !== 'll-grid'
                                && name !== 'll-grid--carousel-track'
                                && !/^ll-grid--carousel-cols-(2|3|4|6)$/.test(name)
                                && !/^ll-grid--gap-(4|6)$/.test(name)
                        )
                        .join(' ')
                    : '';
                track.className = `ll-carousel__track ll-carousel__track--grid ll-carousel__track--cols-${gridColumns} ll-carousel__track--gap-${gridGap}${passthroughLegacyClasses ? ` ${passthroughLegacyClasses}` : ''}`;
            } else {
                track.className = 'll-carousel__track ll-carousel__track--freeform';
            }

            let addButton = null;
            if (mode === 'tabs' && tabsEditable) {
                addButton = document.createElement('button');
                addButton.type = 'button';
                addButton.className = 'll-btn ll-btn--outline-default ll-carousel__add-tab';
                addButton.setAttribute('aria-label', addButtonLabel);
                addButton.innerHTML = `<span class="material-symbols-outlined ll-btn__icon">add</span><span>${addButtonLabel}</span>`;
            }

            const rightOverlay = document.createElement('div');
            rightOverlay.className = 'll-carousel__overlay ll-carousel__overlay--right ll-carousel__overlay--hidden';
            const rightBtn = document.createElement('button');
            rightBtn.type = 'button';
            rightBtn.className = 'll-icon-btn ll-icon-btn--circle ll-icon-btn--lg ll-carousel__scroll-btn';
            rightBtn.setAttribute('aria-label', 'Scroll right');
            rightBtn.innerHTML = '<span class="material-symbols-outlined ll-icon-btn__icon">chevron_right</span>';
            rightOverlay.appendChild(rightBtn);

            root.appendChild(leftOverlay);
            root.appendChild(track);
            root.appendChild(rightOverlay);

            const scrollHost = track;

            const updateScrollOverlays = () => {
                const el = scrollHost;
                const { scrollLeft, scrollWidth, clientWidth } = el;
                const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
                const isScrollable = scrollWidth > clientWidth;
                const atLeft = scrollLeft <= tolerancePx;
                const atRight = (maxScrollLeft - scrollLeft) <= tolerancePx;
                leftOverlay.classList.toggle('ll-carousel__overlay--hidden', !isScrollable || atLeft);
                rightOverlay.classList.toggle('ll-carousel__overlay--hidden', !isScrollable || atRight);
            };

            const onScroll = () => updateScrollOverlays();
            const onResize = () => updateScrollOverlays();
            const onDocumentPointerDown = (event) => {
                if (mode !== 'tabs' || !tabsEditable || !editMode || !editingTabId || disposed) return;
                const target = event.target;
                if (!(target instanceof windowScope.HTMLElement)) return;
                const withinTab = target.closest(TAB_SELECTOR);
                if (withinTab && track.contains(withinTab)) return;
                commitEditingTabAndExit();
                renderTabs();
            };
            let carouselResizeObserver = null;
            let carouselVisibilityObserver = null;
            if (typeof windowScope.ResizeObserver === 'function') {
                carouselResizeObserver = new windowScope.ResizeObserver(() => {
                    updateScrollOverlays();
                });
                carouselResizeObserver.observe(root);
                carouselResizeObserver.observe(scrollHost);
            }
            if (typeof windowScope.IntersectionObserver === 'function') {
                carouselVisibilityObserver = new windowScope.IntersectionObserver((entries) => {
                    const becameVisible = entries.some((entry) => entry && entry.isIntersecting);
                    if (!becameVisible) return;
                    updateScrollOverlays();
                    requestAnimationFrame(() => updateScrollOverlays());
                }, { root: null, threshold: 0 });
                carouselVisibilityObserver.observe(root);
            }

            scrollHost.addEventListener('scroll', onScroll);
            windowScope.addEventListener('resize', onResize);
            document.addEventListener('pointerdown', onDocumentPointerDown, true);

            const resolveScrollStepPx = () => {
                if (mode === 'tabs') {
                    return (scrollHost.clientWidth * scrollStepPercent) / 100;
                }
                if (sizing === 'freeform') {
                    return (scrollHost.clientWidth * scrollStepPercent) / 100;
                }
                return scrollStepPx;
            };

            const resolveGridTargetScrollLeft = (direction) => {
                const tiles = Array.from(track.querySelectorAll('.ll-carousel__card-slot'));
                if (!tiles.length) return null;

                const hostRect = scrollHost.getBoundingClientRect();
                const leftEdge = hostRect.left + 1;
                const rightEdge = hostRect.right - 1;
                let firstVisibleIndex = -1;
                let lastVisibleIndex = -1;

                for (let i = 0; i < tiles.length; i += 1) {
                    const rect = tiles[i].getBoundingClientRect();
                    const isVisible = rect.right > leftEdge && rect.left < rightEdge;
                    if (!isVisible) continue;
                    if (firstVisibleIndex === -1) {
                        firstVisibleIndex = i;
                    }
                    lastVisibleIndex = i;
                }

                if (firstVisibleIndex < 0 || lastVisibleIndex < 0) {
                    return null;
                }

                const tilesPerStep = Math.max(1, gridColumns - 1);
                let targetIndex = 0;
                if (direction > 0) {
                    // Next: anchor from current left edge tile.
                    targetIndex = Math.min(tiles.length - 1, firstVisibleIndex + tilesPerStep);
                } else {
                    // Prev: anchor from current right edge tile, then shift backward by one viewport-step.
                    targetIndex = Math.max(0, lastVisibleIndex - (tilesPerStep * 2));
                }

                const targetTile = tiles[targetIndex];
                if (!targetTile) return null;
                const maxScrollLeft = Math.max(0, scrollHost.scrollWidth - scrollHost.clientWidth);
                const rawTargetLeft = targetTile.offsetLeft;
                return Math.max(0, Math.min(rawTargetLeft, maxScrollLeft));
            };

            const scrollByStep = (direction) => {
                if (mode === 'cards' && sizing === 'grid') {
                    const targetLeft = resolveGridTargetScrollLeft(direction);
                    if (typeof targetLeft === 'number' && Number.isFinite(targetLeft)) {
                        const currentLeft = scrollHost.scrollLeft;
                        if (Math.abs(targetLeft - currentLeft) <= 0.5) return;
                        scrollHost.scrollTo({ left: targetLeft, behavior: 'smooth' });
                        return;
                    }
                }
                const stepPx = Math.max(1, resolveScrollStepPx());
                const currentLeft = scrollHost.scrollLeft;
                const maxScrollLeft = Math.max(0, scrollHost.scrollWidth - scrollHost.clientWidth);
                if (direction > 0) {
                    const remaining = Math.max(0, maxScrollLeft - currentLeft);
                    const delta = Math.min(stepPx, remaining);
                    if (delta <= 0) return;
                    scrollHost.scrollTo({ left: currentLeft + delta, behavior: 'smooth' });
                    return;
                }
                const remaining = Math.max(0, currentLeft);
                const delta = Math.min(stepPx, remaining);
                if (delta <= 0) return;
                scrollHost.scrollTo({ left: currentLeft - delta, behavior: 'smooth' });
            };

            leftBtn.addEventListener('click', () => {
                scrollByStep(-1);
            });
            rightBtn.addEventListener('click', () => {
                scrollByStep(1);
            });

            let sortableDestroy = null;
            let disposed = false;

            const syncTabActiveClasses = () => {
                if (mode !== 'tabs') return;
                track.querySelectorAll(TAB_SELECTOR).forEach((el) => {
                    const id = el.dataset.llCarouselTabId || '';
                    const isActive = id && id === activeId;
                    el.classList.toggle('ll-active', !!isActive);
                    el.classList.toggle('ll-btn--primary', !!isActive);
                    el.classList.toggle('ll-btn--outline-default', !isActive);
                    el.setAttribute('aria-selected', isActive ? 'true' : 'false');
                });
            };

            const syncItemsOrderFromDom = () => {
                if (mode !== 'tabs') return;
                const ordered = Array.from(track.querySelectorAll(TAB_SELECTOR))
                    .map((el) => el.dataset.llCarouselTabId)
                    .filter(Boolean);
                if (!ordered.length) return;
                const map = new Map(items.map((it) => [getItemId(it), it]));
                const next = ordered.map((id) => map.get(id)).filter(Boolean);
                if (next.length === items.length) {
                    items = next;
                }
            };

            const mountSortable = () => {
                if (sortableDestroy) {
                    sortableDestroy.destroy();
                    sortableDestroy = null;
                }
                if (mode !== 'tabs' || !tabsEditable || !editMode || items.length < 2) return;
                sortableDestroy = initSortableList({
                    container: track,
                    axis: 'horizontal',
                    itemSelector: TAB_SELECTOR,
                    handleSelector: HANDLE_SELECTOR,
                    minItemsForDrag: 2,
                    getItemId: (el) => String(el.dataset.llCarouselTabId || ''),
                    onReorder: () => {
                        syncItemsOrderFromDom();
                        emitItems('reorder');
                    }
                });
            };

            const focusEditingLabel = (tabId) => {
                const tabEls = track.querySelectorAll(TAB_SELECTOR);
                const targetId = String(tabId || '');
                for (let i = 0; i < tabEls.length; i += 1) {
                    const tabEl = tabEls[i];
                    if (tabEl.dataset.llCarouselTabId !== targetId) continue;
                    const label = tabEl.querySelector('.ll-carousel__tab-label');
                    if (!label || label.contentEditable !== 'true') break;
                    try {
                        label.focus();
                        const range = label.ownerDocument.createRange();
                        range.selectNodeContents(label);
                        range.collapse(false);
                        const selection = label.ownerDocument.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } catch (_e) {
                        /* ignore */
                    }
                    break;
                }
            };

            const buildTabElement = (item) => {
                const id = getItemId(item);
                const wrap = document.createElement('div');
                wrap.className = 'll-btn ll-btn--outline-default ll-carousel__tab';
                wrap.dataset.llCarouselTabId = id;
                wrap.setAttribute('role', 'tab');
                wrap.setAttribute('tabindex', '-1');

                const dragBtn = document.createElement('button');
                dragBtn.type = 'button';
                dragBtn.className = 'll-carousel__tab-drag ll-icon-btn ll-icon-btn--sm';
                dragBtn.setAttribute('aria-label', 'Reorder tab');
                dragBtn.innerHTML = '<span class="material-symbols-outlined ll-icon-btn__icon">drag_indicator</span>';
                dragBtn.hidden = !tabsEditable || !editMode;

                const label = document.createElement('div');
                label.className = 'll-carousel__tab-label';
                const baseLabel = String(item[tabLabelKey] != null ? item[tabLabelKey] : defaultNewLabel);
                const isEditing = tabsEditable && editMode && editingTabId === id;
                const hasDraftLabel = Object.prototype.hasOwnProperty.call(draftLabelById, id);
                const visibleLabel = isEditing && hasDraftLabel ? String(draftLabelById[id]) : baseLabel;
                label.textContent = visibleLabel;
                label.contentEditable = isEditing ? 'true' : 'false';
                if (isEditing) {
                    label.setAttribute('spellcheck', 'false');
                }

                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'll-carousel__tab-edit ll-icon-btn ll-icon-btn--sm';
                editBtn.setAttribute('aria-label', isEditing ? 'Apply tab title' : 'Edit tab title');
                editBtn.innerHTML = isEditing
                    ? '<span class="material-symbols-outlined ll-icon-btn__icon">check</span>'
                    : '<span class="material-symbols-outlined ll-icon-btn__icon">edit</span>';
                editBtn.hidden = !tabsEditable || !editMode;
                editBtn.classList.toggle('ll-icon-btn--outline', isEditing);
                editBtn.classList.toggle('ll-icon-btn--outline-positive', isEditing);

                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'll-carousel__tab-delete ll-icon-btn ll-icon-btn--sm';
                delBtn.setAttribute('aria-label', isEditing ? 'Cancel tab edit' : 'Delete tab');
                delBtn.innerHTML = isEditing
                    ? '<span class="material-symbols-outlined ll-icon-btn__icon">close</span>'
                    : '<span class="material-symbols-outlined ll-icon-btn__icon">delete</span>';
                const canDeleteTab = items.length > minTabsToKeep;
                delBtn.hidden = !tabsEditable || !editMode || (!isEditing && !canDeleteTab);
                delBtn.classList.toggle('ll-icon-btn--outline', isEditing);
                delBtn.classList.toggle('ll-icon-btn--outline-negative', isEditing);

                const actionsWrap = document.createElement('div');
                actionsWrap.className = 'll-carousel__tab-actions';
                actionsWrap.hidden = !tabsEditable || !editMode;
                actionsWrap.appendChild(editBtn);
                actionsWrap.appendChild(delBtn);

                wrap.appendChild(dragBtn);
                wrap.appendChild(label);
                wrap.appendChild(actionsWrap);

                wrap.addEventListener('pointerdown', (ev) => {
                    if (ev.target.closest(HANDLE_SELECTOR)) {
                        if (activeId !== id) {
                            setActiveIdInternal(id, { silent: false });
                        }
                        if (editingTabId) {
                            discardEditingTabAndExitInPlace();
                        }
                        return;
                    }
                    if (ev.target.closest(DELETE_SELECTOR) || ev.target.closest(EDIT_SELECTOR)) {
                        return;
                    }
                    if (editingTabId && editingTabId !== id) {
                        discardEditingTabAndExit();
                        renderTabs();
                    }
                    setActiveIdInternal(id, { silent: false });
                });

                label.addEventListener('input', () => {
                    if (!(tabsEditable && editMode && editingTabId === id)) return;
                    const nextValue = String(label.textContent == null ? '' : label.textContent);
                    if (nextValue.length <= maxTitleLength) {
                        draftLabelById[id] = nextValue;
                        return;
                    }
                    const selectionOffsets = getContenteditableSelectionOffsets(label);
                    const trimmedValue = nextValue.slice(0, maxTitleLength);
                    draftLabelById[id] = trimmedValue;
                    label.textContent = trimmedValue;
                    const caretOffset = Math.min(
                        maxTitleLength,
                        selectionOffsets && Number.isFinite(selectionOffsets.start)
                            ? selectionOffsets.start
                            : maxTitleLength
                    );
                    setContenteditableCaretOffset(label, caretOffset);
                });

                label.addEventListener('beforeinput', (ev) => {
                    if (!(tabsEditable && editMode && editingTabId === id)) return;
                    const inputType = String(ev.inputType || '');
                    if (!inputType.startsWith('insert')) return;
                    if (inputType === 'insertFromPaste') return;
                    const currentValue = String(label.textContent == null ? '' : label.textContent);
                    const selectionOffsets = getContenteditableSelectionOffsets(label) || {
                        start: currentValue.length,
                        end: currentValue.length
                    };
                    const selectedLength = Math.max(0, (selectionOffsets.end || 0) - (selectionOffsets.start || 0));
                    const available = maxTitleLength - (currentValue.length - selectedLength);
                    if (available > 0) return;
                    ev.preventDefault();
                });

                label.addEventListener('paste', (ev) => {
                    if (!(tabsEditable && editMode && editingTabId === id)) return;
                    const rawText = ev.clipboardData ? ev.clipboardData.getData('text/plain') : '';
                    if (typeof rawText !== 'string') return;
                    ev.preventDefault();
                    const currentValue = String(label.textContent == null ? '' : label.textContent);
                    const selectionOffsets = getContenteditableSelectionOffsets(label) || {
                        start: currentValue.length,
                        end: currentValue.length
                    };
                    const start = Math.max(0, Math.min(currentValue.length, selectionOffsets.start));
                    const end = Math.max(start, Math.min(currentValue.length, selectionOffsets.end));
                    const available = maxTitleLength - (currentValue.length - (end - start));
                    const insertText = available > 0 ? rawText.slice(0, available) : '';
                    const nextValue = `${currentValue.slice(0, start)}${insertText}${currentValue.slice(end)}`;
                    draftLabelById[id] = nextValue;
                    label.textContent = nextValue;
                    setContenteditableCaretOffset(label, start + insertText.length);
                });

                label.addEventListener('keydown', (ev) => {
                    if (!(tabsEditable && editMode && editingTabId === id)) return;
                    if (ev.key === 'Enter') {
                        ev.preventDefault();
                        commitEditingTabAndExit();
                        renderTabs();
                        return;
                    }
                    if (ev.key === 'Escape') {
                        ev.preventDefault();
                        ev.stopPropagation();
                        discardEditingTabAndExit();
                        renderTabs();
                    }
                });

                editBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    if (!tabsEditable || !editMode) return;
                    setActiveIdInternal(id, { silent: false });
                    if (editingTabId && editingTabId !== id) {
                        discardEditingTabAndExit();
                    }
                    if (editingTabId === id) {
                        commitEditingTabAndExit();
                        renderTabs();
                        return;
                    }
                    const itemLabel = String(item[tabLabelKey] != null ? item[tabLabelKey] : defaultNewLabel);
                    draftLabelById[id] = itemLabel;
                    editingTabId = id;
                    renderTabs();
                    requestAnimationFrame(() => focusEditingLabel(id));
                });

                delBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    if (!tabsEditable || !editMode) return;
                    if (editingTabId === id) {
                        discardEditingTabAndExit();
                        renderTabs();
                        return;
                    }
                    if (items.length <= minTabsToKeep) return;
                    initializeConfirmationDialog({
                        title: confirmDeleteTitle,
                        bodyContent: `<p class="ll-carousel__confirm-copy">${confirmDeleteBody}</p>`,
                        confirmLabel: confirmDeleteConfirmLabel,
                        cancelLabel: 'Cancel',
                        onConfirm: () => {
                            const prevActive = activeId;
                            if (editingTabId === id) {
                                editingTabId = null;
                            }
                            delete draftLabelById[id];
                            items = items.filter((it) => getItemId(it) !== id);
                            if (prevActive === id) {
                                ensureActiveId();
                                emitActive(prevActive);
                            } else {
                                ensureActiveId();
                            }
                            renderTabs('remove');
                            updateScrollOverlays();
                        }
                    }).open();
                });

                return wrap;
            };

            const renderTabs = (itemsEmitReason) => {
                ensureActiveId();
                track.innerHTML = '';
                items.forEach((item) => {
                    track.appendChild(buildTabElement(item));
                });
                if (addButton) {
                    addButton.hidden = !tabsEditable || !editMode;
                    track.appendChild(addButton);
                }
                syncTabActiveClasses();
                mountSortable();
                syncInlineEditEscapeEntry();
                updateScrollOverlays();
                if (itemsEmitReason) {
                    emitItems(String(itemsEmitReason));
                }
            };

            const renderCards = (itemsEmitReason) => {
                track.innerHTML = '';
                items.forEach((item, index) => {
                    const slot = document.createElement('div');
                    slot.className = 'll-carousel__card-slot';
                    slot.dataset.llCarouselCardId = getItemId(item);
                    let node = null;
                    try {
                        node = renderCard(item, { index, activeId });
                    } catch (_e) {
                        node = null;
                    }
                    if (!node) return;
                    if (typeof node === 'string') {
                        slot.innerHTML = node;
                    } else if (node.nodeType === 1) {
                        slot.appendChild(node);
                    }
                    track.appendChild(slot);
                });
                updateScrollOverlays();
                if (itemsEmitReason) {
                    emitItems(String(itemsEmitReason));
                }
            };

            if (mode === 'tabs') {
                renderTabs('init');
                emitActive(null);
            } else {
                ensureActiveId();
                renderCards('init');
            }

            if (addButton) {
                addButton.addEventListener('click', () => {
                    if (!tabsEditable || !editMode || disposed) return;
                    if (editingTabId) {
                        discardEditingTabAndExit();
                    }
                    const newId = `tab-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                    const row = { id: newId, [tabLabelKey]: defaultNewLabel };
                    items.push(row);
                    setActiveIdInternal(newId, { silent: false });
                    renderTabs('add');
                    scrollHost.scrollTo({ left: scrollHost.scrollWidth, behavior: 'smooth' });
                });
            }

            const api = {
                destroy() {
                    if (disposed) return;
                    disposed = true;
                    scrollHost.removeEventListener('scroll', onScroll);
                    windowScope.removeEventListener('resize', onResize);
                    document.removeEventListener('pointerdown', onDocumentPointerDown, true);
                    if (carouselResizeObserver) {
                        carouselResizeObserver.disconnect();
                        carouselResizeObserver = null;
                    }
                    if (carouselVisibilityObserver) {
                        carouselVisibilityObserver.disconnect();
                        carouselVisibilityObserver = null;
                    }
                    if (sortableDestroy) {
                        sortableDestroy.destroy();
                        sortableDestroy = null;
                    }
                    removeOverlayInlineEditEntry(inlineEditEscapeKey);
                    root.innerHTML = '';
                    root.classList.remove('ll-carousel');
                },
                getItems() {
                    return items.slice();
                },
                setItems(nextItems) {
                    if (!Array.isArray(nextItems)) return;
                    items = nextItems.slice();
                    if (editingTabId && !items.some((it) => getItemId(it) === editingTabId)) {
                        editingTabId = null;
                    }
                    ensureActiveId();
                    if (mode === 'tabs') {
                        renderTabs('setItems');
                    } else {
                        renderCards('setItems');
                    }
                },
                getActiveId() {
                    return activeId;
                },
                setActiveId(id) {
                    if (editingTabId && editingTabId !== String(id || '')) {
                        discardEditingTabAndExit();
                        renderTabs();
                    }
                    setActiveIdInternal(id, { silent: false });
                },
                setEditMode(next) {
                    if (!tabsEditable) return;
                    if (!next) {
                        discardEditingTabAndExit();
                    }
                    editMode = !!next;
                    if (mode === 'tabs') {
                        renderTabs();
                    }
                },
                scrollActiveIntoView() {
                    if (mode !== 'tabs' || !activeId) return;
                    const tabEls = track.querySelectorAll(TAB_SELECTOR);
                    for (let i = 0; i < tabEls.length; i += 1) {
                        const el = tabEls[i];
                        if (el.dataset.llCarouselTabId === activeId) {
                            el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                            break;
                        }
                    }
                }
            };

            return api;
        }

        /** @deprecated Use **`syncLlumenRowBandGapRows`**; kept as an alias for existing call sites. */
        const syncLlumenRowBandPhantomRows = syncLlumenRowBandGapRows;

    windowScope.LlumenComponents = {
        initializeTabs,
        initializePortaledDropdown,
        initializeScrollableTabs,
        initializeHorizontalCarousel,
        initializeTreeView,
        refreshExpandedTreeViewHeights,
        renderDragDropCardList,
        initSortableList,
        initVerticalSortableList,
        readLlumenGridSurfaceLayout,
        readLlumenGridTilesModelFromHost,
        adaptLlumenGridTilesModelToColumnCount,
        writeLlumenGridTilesModelToHost,
        initGridTileModelContext,
        initGridTileSpanResize,
        initLlumenFlexBandUnitResize,
        setLlumenBandWidthClass,
        initGridTilePointerMove,
        initGridDropContext,
        initCanvasDropContext,
        createPointerDragSession: runLlumenPointerDragSession,
        initResizableElement,
        initLlumenSurfaceFreeformResize,
        initLlumenSurfacePlacedItemDrag,
        readLlumenSurfacePlacedItemsModelFromHost,
        writeLlumenSurfacePlacedItemsModelToHost,
        applyLlumenSurfacePlacedItemsModel,
        LLUMEN_SURFACE_OVERLAP_DEFAULT_METRICS,
        llumenSurfaceRectVisualBounds,
        llumenSurfaceBoundsOverlap,
        llumenSurfaceMoveLayoutAwayFromBase,
        resolveLlumenSurfaceRectOverlaps,
        syncLlumenRowBandGapRows,
        syncLlumenRowBandPhantomRows,
        initLlumenRowBandSortables,
        initRowBandContext,
        initListingModule,
        readLlumenRowBandModelFromHost,
        writeLlumenRowBandModelToHost,
        normalizeLlumenRowBandRowShellsForCapacity,
        reflowLlumenRowBandModelForMaxUnits,
        llumenRowBandShellUnitsForHostCapacity,
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
