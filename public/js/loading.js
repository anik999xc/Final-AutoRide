// public/js/loading.js
document.addEventListener('DOMContentLoaded', () => {
    // Show loading screen initially
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Hide loading screen when page is fully loaded
    window.addEventListener('load', () => {
        loadingOverlay.classList.add('hidden');
    });
    
    // Show loading screen when navigating away from the page
    document.addEventListener('click', (e) => {
        // Check if the clicked element is an internal link
        const clickedElement = e.target.closest('a');
        if (clickedElement && clickedElement.href && 
            clickedElement.href.startsWith(window.location.origin) && 
            !clickedElement.getAttribute('target')) {
            loadingOverlay.classList.remove('hidden');
        }
    });
    
    // Show loading screen for form submissions
    document.addEventListener('submit', () => {
        loadingOverlay.classList.remove('hidden');
    });
    
    // For AJAX requests
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener('loadstart', () => {
            loadingOverlay.classList.remove('hidden');
        });
        this.addEventListener('loadend', () => {
            loadingOverlay.classList.add('hidden');
        });
        originalXHROpen.apply(this, arguments);
    };
    
    // For fetch API
    const originalFetch = window.fetch;
    window.fetch = function() {
        loadingOverlay.classList.remove('hidden');
        return originalFetch.apply(this, arguments).then(response => {
            loadingOverlay.classList.add('hidden');
            return response;
        }).catch(error => {
            loadingOverlay.classList.add('hidden');
            throw error;
        });
    };
});
