// Create Content Modal functionality
let selectedContentType = '';
let createContentModalController = null;
const createContentModalBodyMarkup = `
    <div id="create-content-modal-content">
        <p id="create-content-modal-description" class="font-semibold mb-4">Select a Workspace to proceed</p>

        <div id="create-content-private-section" class="mb-4">
            <div class="ll-block-links">
                <button type="button" id="private-workspace-link" class="ll-block-link">
                    <div class="ll-block-link__main">
                        <span class="material-symbols-outlined ll-block-link__icon">lock</span>
                        <div class="ll-block-link__body">
                            <div class="ll-block-link__title">Private</div>
                        </div>
                    </div>
                </button>
            </div>
            <div class="border-t ll-border-divider my-4"></div>
        </div>

        <div>
            <div id="workspaces-list" class="ll-block-links ll-grid ll-grid--cols-2 ll-grid--gap-4">
                <!-- Workspace block links will be dynamically generated here -->
            </div>
        </div>
    </div>
`;
const createContentModalFooterMarkup = `
    <div class="flex items-center justify-end space-x-3 w-full">
        <button type="button" id="cancel-create-content" class="ll-btn ll-btn--outline-default">
            Cancel
        </button>
    </div>
`;

function ensureCreateContentModal() {
    if (createContentModalController) return createContentModalController;
    const components = window.LlumenComponents;
    if (!components || typeof components.initializeModal !== 'function') return null;

    createContentModalController = components.initializeModal({
        id: 'create-content-modal',
        title: 'Create',
        width: '42.5rem',
        bodyPadding: true,
        bodyScrollable: true,
        openOnInit: false,
        bodyContent: createContentModalBodyMarkup,
        footerContent: createContentModalFooterMarkup,
        onOpen: ({ controller }) => {
            if (controller.root.dataset.createContentModalBound === 'true') return;

            const cancelButton = controller.footer.querySelector('#cancel-create-content');
            const privateLink = controller.body.querySelector('#private-workspace-link');

            if (cancelButton) {
                cancelButton.addEventListener('click', () => closeCreateContentModal());
            }
            if (privateLink) {
                privateLink.addEventListener('click', (event) => {
                    event.preventDefault();
                    handleWorkspaceSelection('Private');
                });
            }

            controller.root.dataset.createContentModalBound = 'true';
        }
    });

    return createContentModalController;
}

function getCreateContentModalScopedElement(selector) {
    const modal = ensureCreateContentModal();
    if (!modal || !modal.body) return null;
    return modal.body.querySelector(selector);
}

function updatePrivateWorkspaceVisibility() {
    const privateSection = getCreateContentModalScopedElement('#create-content-private-section');
    if (!privateSection) return;
    const shouldHide = selectedContentType === 'Briefing';
    privateSection.classList.toggle('hidden', shouldHide);
}

function openCreateContentModal(contentType) {
    selectedContentType = contentType;
    const modal = ensureCreateContentModal();
    if (!modal) return;
    
    // Close the Create dropdown
    const createDropdownMenu = document.getElementById('create-dropdown-menu');
    if (createDropdownMenu) {
        createDropdownMenu.classList.add('hidden');
    }
    
    // Update modal title
    modal.setTitle(`Create ${contentType}`);

    // Briefings skip the Private workspace option in this picker.
    updatePrivateWorkspaceVisibility();
    
    // Generate workspace list
    generateWorkspaceList();
    
    // Show modal
    modal.open();
}

function closeCreateContentModal() {
    const modal = ensureCreateContentModal();
    if (modal) modal.close('cancel');
    selectedContentType = '';
    updatePrivateWorkspaceVisibility();
}

function generateWorkspaceList() {
    const workspacesList = getCreateContentModalScopedElement('#workspaces-list');
    if (!workspacesList) return;
    
    // Clear existing content
    workspacesList.innerHTML = '';
    
    // Hardcoded list of workspaces from index.html (excluding "All", "Private", and "Shared with Me")
    const workspaces = [
        'Finance',
        'Operations',
        'HR',
        'Sales',
        'Marketing',
        'IT',
        'Product',
        'Engineering',
        'Customer Success'
    ];
    
    // Create block links for each workspace
    workspaces.forEach(workspaceName => {
        const workspaceLink = document.createElement('button');
        workspaceLink.type = 'button';
        workspaceLink.className = 'll-block-link';

        const mainWrap = document.createElement('div');
        mainWrap.className = 'll-block-link__main';

        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined ll-block-link__icon';
        icon.textContent = 'workspaces';

        const bodyWrap = document.createElement('div');
        bodyWrap.className = 'll-block-link__body';

        const title = document.createElement('div');
        title.className = 'll-block-link__title';
        title.textContent = workspaceName;

        bodyWrap.appendChild(title);
        mainWrap.appendChild(icon);
        mainWrap.appendChild(bodyWrap);
        workspaceLink.appendChild(mainWrap);

        workspaceLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleWorkspaceSelection(workspaceName);
        });
        workspacesList.appendChild(workspaceLink);
    });
}

function handleWorkspaceSelection(workspaceName) {
    // If content type is Briefing, launch the dedicated Briefings create modal.
    if (selectedContentType === 'Briefing' && window.Briefings && typeof window.Briefings.openCreateModal === 'function') {
        closeCreateContentModal();
        window.Briefings.openCreateModal({ workspace: workspaceName });
        return;
    }

    // If content type is Dashboard, navigate to the dashboard page
    if (selectedContentType === 'Dashboard') {
        // Calculate relative path based on current page location
        const currentPath = window.location.pathname;
        const pathParts = currentPath.split('/').filter(part => part);
        
        // Check if we're in a subdirectory
        const isInSubdirectory = pathParts.some(part => 
            part === 'workspaces' || part === 'platform-settings' || part === 'dashboard'
        );
        
        // Determine the relative path to dashboard
        let dashboardPath;
        if (isInSubdirectory && !pathParts.includes('dashboard')) {
            // We're in workspaces/ or platform-settings/ directory
            dashboardPath = '../dashboard/68ee2d555a24aca8065fbfa1.html';
        } else {
            // We're in the root directory or in dashboard/ directory
            dashboardPath = 'dashboard/68ee2d555a24aca8065fbfa1.html';
        }
        
        window.location.href = dashboardPath;
        return;
    }
    
    // Handle other content types
    if (typeof alertMessage === 'function') {
        alertMessage(`Creating ${selectedContentType} in ${workspaceName}...`, 'info');
    }
    closeCreateContentModal();
}

// Event listeners for modal
document.addEventListener('DOMContentLoaded', () => {
    ensureCreateContentModal();

    document.querySelectorAll('[data-create-content-type]').forEach((link) => {
        if (link.dataset.createContentBound === 'true') return;
        link.addEventListener('click', (event) => {
            event.preventDefault();
            openCreateContentModal(link.getAttribute('data-create-content-type') || '');
        });
        link.dataset.createContentBound = 'true';
    });
});

// Make functions globally available
window.openCreateContentModal = openCreateContentModal;
window.closeCreateContentModal = closeCreateContentModal;
