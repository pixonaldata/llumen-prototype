/**
 * Generic Carousel Plugin
 * Handles horizontal scrolling with gradient overlays and scroll buttons
 * 
 * Usage:
 * - Add class "carousel-container" to the scrollable container
 * - Add class "carousel-scroll-container" to the actual scrollable element (or it will use the container)
 * - Add classes "scroll-gradient-overlay left" to the left gradient overlay
 * - Add classes "scroll-gradient-overlay right" to the right gradient overlay
 * - Add classes "scroll-button left" to the left scroll button
 * - Add classes "scroll-button right" to the right scroll button
 */

(function() {
    'use strict';

    // Configuration
    const SCROLL_STEP_PERCENTAGE = 0.75; // Percentage of container width to scroll per arrow click (75%)
    const SCROLL_END_TOLERANCE = 5; // Pixels from end to consider it "at the end" for hiding overlays

    /**
     * Initialize a single carousel
     * @param {HTMLElement} carouselContainer - The carousel container element
     */
    function initCarousel(carouselContainer) {
        // Find elements within this carousel container
        const scrollContainer = carouselContainer.querySelector('.carousel-scroll-container') || carouselContainer;
        const leftGradientOverlay = carouselContainer.querySelector('.scroll-gradient-overlay.left');
        const rightGradientOverlay = carouselContainer.querySelector('.scroll-gradient-overlay.right');
        const scrollLeftButton = carouselContainer.querySelector('.scroll-button.left');
        const scrollRightButton = carouselContainer.querySelector('.scroll-button.right');

        // Validate required elements
        if (!scrollContainer) {
            console.warn('Carousel: Scroll container not found');
            return;
        }

        /**
         * Update gradient overlays and button states based on scroll position
         */
        function updateCarouselScrollButtons() {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
            const maxScrollLeft = scrollWidth - clientWidth;
            const isScrollable = scrollWidth > clientWidth;

            const atLeftEnd = scrollLeft <= SCROLL_END_TOLERANCE;
            const atRightEnd = scrollLeft >= (maxScrollLeft - SCROLL_END_TOLERANCE);

            // Update left gradient overlay
            if (leftGradientOverlay) {
                leftGradientOverlay.classList.toggle('hidden', !isScrollable || atLeftEnd);
                leftGradientOverlay.style.pointerEvents = (!isScrollable || atLeftEnd) ? 'none' : 'all';
            }

            // Update right gradient overlay
            if (rightGradientOverlay) {
                rightGradientOverlay.classList.toggle('hidden', !isScrollable || atRightEnd);
                rightGradientOverlay.style.pointerEvents = (!isScrollable || atRightEnd) ? 'none' : 'all';
            }
        }

        // Event listener for left scroll button
        if (scrollLeftButton) {
            scrollLeftButton.addEventListener('click', () => {
                const scrollStep = scrollContainer.clientWidth * SCROLL_STEP_PERCENTAGE;
                scrollContainer.scrollBy({
                    left: -scrollStep,
                    behavior: 'smooth'
                });
            });
        }

        // Event listener for right scroll button
        if (scrollRightButton) {
            scrollRightButton.addEventListener('click', () => {
                const scrollStep = scrollContainer.clientWidth * SCROLL_STEP_PERCENTAGE;
                scrollContainer.scrollBy({
                    left: scrollStep,
                    behavior: 'smooth'
                });
            });
        }

        // Add scroll event listener to update buttons when scrolling
        scrollContainer.addEventListener('scroll', updateCarouselScrollButtons);

        // Add scroll event listener to close open dropdowns on scroll (if global openDropdownMenu exists)
        scrollContainer.addEventListener('scroll', () => {
            if (typeof window.openDropdownMenu !== 'undefined' && window.openDropdownMenu && !window.openDropdownMenu.classList.contains('hidden')) {
                window.openDropdownMenu.classList.add('hidden');
                window.openDropdownMenu = null;
            }
        });

        // Initial update
        updateCarouselScrollButtons();
    }

    /**
     * Initialize all carousels on the page
     */
    function initAllCarousels() {
        const carouselContainers = document.querySelectorAll('.carousel-container');
        carouselContainers.forEach(container => {
            initCarousel(container);
        });
    }

    // Initialize on DOM content loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllCarousels);
    } else {
        // DOM is already loaded
        initAllCarousels();
    }

    // Re-initialize on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Re-check all carousels on resize
            const carouselContainers = document.querySelectorAll('.carousel-container');
            carouselContainers.forEach(container => {
                const scrollContainer = container.querySelector('.carousel-scroll-container') || container;
                if (scrollContainer) {
                    // Trigger update by dispatching a scroll event
                    scrollContainer.dispatchEvent(new Event('scroll'));
                }
            });
        }, 100);
    });

    // Export for manual initialization if needed
    window.Carousel = {
        init: initAllCarousels,
        initCarousel: initCarousel
    };

})();

