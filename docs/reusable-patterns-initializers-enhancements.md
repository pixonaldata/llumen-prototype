# Reusable Patterns & Initializers Enhancements

Backlog of reusable API/pattern improvements discovered while refactoring `platform-settings/components.html`.

## Enhancements

1. Add first-class thumbnail/prefix rendering to `initializePortaledDropdown` (for both options and selected trigger value).
   - **Problem**: pages currently need custom DOM patching to show icon/swatch visuals (for example Color Palette), which is fragile and easy to regress.
   - **Enhancement**: support declarative option visuals and built-in selected-value rendering (thumbnail/icon + label) inside the initializer.
   - **Outcome**: consistent behavior across pages and less page-specific dropdown code.

2. Add reusable rich option-row templates and disabled-state handling for `initializePortaledDropdown`.
   - **Problem**: feature menus such as Add Filter need richer rows (icon + display name + namespace + type chip + status like "Already added"), and this currently requires page-specific DOM post-processing.
   - **Enhancement**: support declarative per-option metadata and renderer slots (for menu rows and selected state), plus built-in non-selectable/disabled option behavior.
   - **Outcome**: preserves UX richness during refactors while keeping dropdown behavior fully reusable and consistent.

