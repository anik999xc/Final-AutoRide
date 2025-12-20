// Main JavaScript file for client-side functionality

document.addEventListener('DOMContentLoaded', () => {
  console.log('Application initialized');

  // Flash message handling
  const flashMessages = document.querySelectorAll('.alert');
  if (flashMessages.length > 0) {
    flashMessages.forEach(message => {
      // Auto-dismiss flash messages after 5 seconds
      setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => {
          message.remove();
        }, 300);
      }, 5000);
    });
  }

  // Form validation
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const requiredFields = form.querySelectorAll('[required]');
      let valid = true;

      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          valid = false;
          field.classList.add('error');
          
          const errorMessage = document.createElement('div');
          errorMessage.className = 'error-message';
          errorMessage.textContent = 'This field is required';
          
          // Remove any existing error message first
          const existingError = field.parentNode.querySelector('.error-message');
          if (existingError) {
            existingError.remove();
          }
          
          field.parentNode.appendChild(errorMessage);
        } else {
          field.classList.remove('error');
          const existingError = field.parentNode.querySelector('.error-message');
          if (existingError) {
            existingError.remove();
          }
        }
      });

      if (!valid) {
        e.preventDefault();
      }
    });

    // Clear error messages on input
    form.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('error');
        const errorMessage = input.parentNode.querySelector('.error-message');
        if (errorMessage) {
          errorMessage.remove();
        }
      });
    });
  });

  // Theme toggle (if exists)
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('change', () => {
      document.body.classList.toggle('dark-mode');
      
      // Save preference to localStorage
      const isDarkMode = document.body.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
    });
    
    // Check for saved preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
      themeToggle.checked = true;
    }
  }

  // Notification system
  const notification = {
    container: document.getElementById('notificationContainer'),
    show: function(message, type = 'info', duration = 5000) {
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'notificationContainer';
        document.body.appendChild(this.container);
      }
      
      const notificationElement = document.createElement('div');
      notificationElement.className = `notification ${type}`;
      notificationElement.textContent = message;
      
      const closeButton = document.createElement('button');
      closeButton.className = 'close-notification';
      closeButton.innerHTML = '&times;';
      closeButton.addEventListener('click', () => {
        notificationElement.classList.add('hiding');
        setTimeout(() => {
          notificationElement.remove();
        }, 300);
      });
      
      notificationElement.appendChild(closeButton);
      this.container.appendChild(notificationElement);
      
      setTimeout(() => {
        notificationElement.classList.add('show');
      }, 10);
      
      if (duration > 0) {
        setTimeout(() => {
          notificationElement.classList.add('hiding');
          setTimeout(() => {
            notificationElement.remove();
          }, 300);
        }, duration);
      }
      
      return notificationElement;
    }
  };
  
  // Make notification available globally
  window.showNotification = notification.show.bind(notification);
  
  // Handle logout if logout button exists
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        const response = await fetch('/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          window.location.href = '/login';
        } else {
          showNotification(data.message || 'Logout failed', 'error');
        }
      } catch (error) {
        console.error('Logout error:', error);
        showNotification('An error occurred during logout', 'error');
      }
    });
  }
  
  // Initialize any tooltips
  const tooltips = document.querySelectorAll('[data-tooltip]');
  tooltips.forEach(tooltip => {
    tooltip.addEventListener('mouseenter', () => {
      const tooltipText = tooltip.getAttribute('data-tooltip');
      const tooltipElement = document.createElement('div');
      tooltipElement.className = 'tooltip';
      tooltipElement.textContent = tooltipText;
      document.body.appendChild(tooltipElement);
      
      const rect = tooltip.getBoundingClientRect();
      tooltipElement.style.top = `${rect.top - tooltipElement.offsetHeight - 10}px`;
      tooltipElement.style.left = `${rect.left + (rect.width / 2) - (tooltipElement.offsetWidth / 2)}px`;
      tooltipElement.classList.add('show');
      
      tooltip.addEventListener('mouseleave', () => {
        tooltipElement.remove();
      });
    });
  });
});
