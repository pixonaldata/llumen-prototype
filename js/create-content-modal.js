// Create Content Modal functionality
let selectedContentType = '';

function openCreateContentModal(contentType) {
    selectedContentType = contentType;
    const modal = document.getElementById('create-content-modal');
    const modalTitle = document.getElementById('create-content-modal-title');
    
    // Close the Create dropdown
    const createDropdownMenu = document.getElementById('create-dropdown-menu');
    if (createDropdownMenu) {
        createDropdownMenu.classList.add('hidden');
    }
    
    // Update modal title
    modalTitle.textContent = `Create ${contentType}`;
    
    // Generate workspace list
    generateWorkspaceList();
    
    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeCreateContentModal() {
    const modal = document.getElementById('create-content-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    selectedContentType = '';
}

function generateWorkspaceList() {
    const workspacesList = document.getElementById('workspaces-list');
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
        const workspaceLink = document.createElement('a');
        workspaceLink.href = '#';
        workspaceLink.className = 'block w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg p-3 transition duration-200 text-white flex items-center';
        
        // Create icon
        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined mr-3';
        icon.style.fontSize = '20px';
        icon.textContent = 'workspaces';
        
        // Create text
        const text = document.createElement('span');
        text.className = 'text-sm font-medium';
        text.textContent = workspaceName;
        
        workspaceLink.appendChild(icon);
        workspaceLink.appendChild(text);
        
        workspaceLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleWorkspaceSelection(workspaceName);
        });
        workspacesList.appendChild(workspaceLink);
    });
}

function handleWorkspaceSelection(workspaceName) {
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
    const closeModalButton = document.getElementById('close-create-content-modal');
    const cancelButton = document.getElementById('cancel-create-content');
    const privateLink = document.getElementById('private-workspace-link');
    
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeCreateContentModal);
    }
    
    if (cancelButton) {
        cancelButton.addEventListener('click', closeCreateContentModal);
    }
    
    if (privateLink) {
        privateLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleWorkspaceSelection('Private');
        });
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('create-content-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCreateContentModal();
            }
        });
    }
});

// Make functions globally available
window.openCreateContentModal = openCreateContentModal;
window.closeCreateContentModal = closeCreateContentModal;
