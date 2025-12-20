// public/js/loading.js
document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.getElementById('loading-overlay');

    const showLoading = () => loadingOverlay.classList.remove('hidden');
    const hideLoading = () => loadingOverlay.classList.add('hidden');

    // 1. BFCACHE (Back Button) handle korar jonno main fix
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            // Jodi page cache theke ashe (Back button), tobe loading screen hide koro
            hideLoading();
        } else {
            // Normal load holeo loading screen hide thakbe load sesh hole
            hideLoading();
        }
    });

    // Initial load hide
    window.addEventListener('load', hideLoading);

    // 2. Back button click korar sathe sathe jodi loading screen dekhaite chao
    window.addEventListener('popstate', () => {
        showLoading();
    });

    // Navigating away (Links)
    document.addEventListener('click', (e) => {
        const clickedElement = e.target.closest('a');
        if (clickedElement && clickedElement.href && 
            clickedElement.href.startsWith(window.location.origin) && 
            !clickedElement.getAttribute('target') &&
            !clickedElement.href.includes('#')) { // Anchor link check
            showLoading();
        }
    });

    // Form submissions
    document.addEventListener('submit', showLoading);

    // AJAX requests
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener('loadstart', showLoading);
        this.addEventListener('loadend', hideLoading);
        originalXHROpen.apply(this, arguments);
    };

    // Fetch API
    const originalFetch = window.fetch;
    window.fetch = function() {
        showLoading();
        return originalFetch.apply(this, arguments)
            .then(response => {
                hideLoading();
                return response;
            })
            .catch(error => {
                hideLoading();
                throw error;
            });
    };
});