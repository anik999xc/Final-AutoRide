document.addEventListener("DOMContentLoaded", function () {
    // Header elements
    const menuIcon = document.getElementById("menuIcon");
    const sideMenu = document.getElementById("sideMenu");
    const closeMenu = document.getElementById("closeMenu");
    const backButton = document.getElementById("backButton");
    const searchBar = document.getElementById("searchBar");
    const searchInput = document.getElementById("searchInput");
    const menuTitle = document.getElementById("menuTitle");

    // Toggle menu function
    function toggleMenu(open) {
        if (open) {
            sideMenu.classList.add("show");
            menuIcon.style.display = "none";
            backButton.style.display = "block";
            searchBar.style.display = "none";
            menuTitle.style.display = "block";
            document.body.style.overflow = "hidden"; // Prevent scrolling
        } else {
            sideMenu.classList.remove("show");
            menuIcon.style.display = "block";
            backButton.style.display = "none";
            searchBar.style.display = "flex";
            menuTitle.style.display = "none";
            document.body.style.overflow = "auto"; // Re-enable scrolling
        }
    }

    // Event listeners for menu toggling
    menuIcon.addEventListener("click", () => toggleMenu(true));
    closeMenu.addEventListener("click", () => toggleMenu(false));
    backButton.addEventListener("click", () => toggleMenu(false));

    // Close menu when clicking outside
    document.addEventListener("click", function(event) {
        const isClickInsideMenu = sideMenu.contains(event.target);
        const isClickOnMenuIcon = menuIcon.contains(event.target);
        
        if (sideMenu.classList.contains("show") && !isClickInsideMenu && !isClickOnMenuIcon) {
            toggleMenu(false);
        }
    });

    // Handle service card selections
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove active class from all cards
            serviceCards.forEach(c => c.classList.remove('active'));
            // Add active class to clicked card
            this.classList.add('active');
        });
    });

    // Add smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId !== '#') {
                document.querySelector(targetId).scrollIntoView({
                    behavior: 'smooth'
                });
            }
            // Close menu after navigation on mobile
            if (window.innerWidth < 768) {
                toggleMenu(false);
            }
        });
    });

    // Add animation when elements come into view
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.service-card, .offer-card, .destination-card, .feature-card');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenHeight = window.innerHeight;
            
            if (elementPosition < screenHeight - 100) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    // Initialize animations
    window.addEventListener('scroll', animateOnScroll);
    
    // Set initial opacity and transform for animation elements
    document.querySelectorAll('.service-card, .offer-card, .destination-card, .feature-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Trigger initial animation check
    setTimeout(animateOnScroll, 100);

    // Location input focus effects
    const locationInputs = document.querySelectorAll('.location-field input');
    locationInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.borderColor = 'var(--primary-color)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.borderColor = '';
        });
    });

    // Ride now button animation
    const rideNowBtn = document.querySelector('.ride-now-btn');
    if (rideNowBtn) {
        rideNowBtn.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.96)';
        });
        
        rideNowBtn.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });
        
        rideNowBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }

    // Refer button animation
    const referBtn = document.querySelector('.refer-btn');
    if (referBtn) {
        referBtn.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(-2px) scale(0.96)';
        });
        
        referBtn.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-2px) scale(1)';
        });
        
        referBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-2px)';
        });
    }

    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.ride-now-btn, .refer-btn, .complete-profile-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.width = '1px';
            ripple.style.height = '1px';
            ripple.style.background = 'rgba(255, 255, 255, 0.7)';
            ripple.style.borderRadius = '50%';
            ripple.style.transform = 'translate(-50%, -50%)';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.animation = 'ripple 0.6s linear';
            
            button.style.overflow = 'hidden';
            button.style.position = 'relative';
            
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add keyframes for ripple animation
    if (!document.querySelector('#rippleStyle')) {
        const style = document.createElement('style');
        style.id = 'rippleStyle';
        style.textContent = `
            @keyframes ripple {
                0% {
                    width: 0;
                    height: 0;
                    opacity: 0.5;
                }
                100% {
                    width: 400px;
                    height: 400px;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Add sticky header effect
    let lastScrollTop = 0;
    const header = document.querySelector('.fixed-header');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down and not at the top
            header.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up or at the top
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Add transition to header
    header.style.transition = 'transform 0.3s ease';

    // Initialize page
    animateOnScroll();
    
    // Simulate loading state
    document.body.classList.add('loading');
    
    // Remove loading state
    window.addEventListener('load', function() {
        setTimeout(function() {
            document.body.classList.remove('loading');
        }, 500);
    });
});
