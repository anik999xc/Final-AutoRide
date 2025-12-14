document.addEventListener('DOMContentLoaded', function() {
  // Get form elements
  const fullNameInput = document.getElementById('fullName');
  const phoneInput = document.getElementById('phoneNumber');
  const addressInput = document.getElementById('address');
  const ageInput = document.getElementById('age');
  const emergencyContactInput = document.getElementById('emergencyContact');
  const registerForm = document.getElementById('registerForm');

  // Error message elements
  const fullNameError = document.getElementById('fullNameError');
  const addressError = document.getElementById('addressError');
  const ageError = document.getElementById('ageError');
  const emergencyContactError = document.getElementById('emergencyContactError');

  // Validation functions
  function validateFullName() {
    if (fullNameInput.value.trim().length < 3) {
      fullNameError.textContent = 'Name must be at least 3 characters long';
      fullNameInput.classList.add('error');
      return false;
    } else {
      fullNameError.textContent = '';
      fullNameInput.classList.remove('error');
      return true;
    }
  }

  function validateAddress() {
    if (addressInput.value.trim().length < 5) {
      addressError.textContent = 'Please enter a valid address';
      addressInput.classList.add('error');
      return false;
    } else {
      addressError.textContent = '';
      addressInput.classList.remove('error');
      return true;
    }
  }

  function validateAge() {
    const age = parseInt(ageInput.value);
    if (isNaN(age) || age < 18 || age > 100) {
      ageError.textContent = 'Age must be between 18 and 100';
      ageInput.classList.add('error');
      return false;
    } else {
      ageError.textContent = '';
      ageInput.classList.remove('error');
      return true;
    }
  }

  function validateEmergencyContact() {
    const emergencyContact = emergencyContactInput.value.trim();
    // Simple phone validation - adjust as needed
    if (!/^\+?\d{10,15}$/.test(emergencyContact)) {
      emergencyContactError.textContent = 'Please enter a valid emergency contact number';
      emergencyContactInput.classList.add('error');
      return false;
    } else {
      emergencyContactError.textContent = '';
      emergencyContactInput.classList.remove('error');
      return true;
    }
  }

  // Add event listeners for validation
  if (fullNameInput) {
    fullNameInput.addEventListener('blur', validateFullName);
    fullNameInput.addEventListener('input', () => {
      fullNameInput.classList.remove('error');
      fullNameError.textContent = '';
    });
  }

  if (addressInput) {
    addressInput.addEventListener('blur', validateAddress);
    addressInput.addEventListener('input', () => {
      addressInput.classList.remove('error');
      addressError.textContent = '';
    });
  }

  if (ageInput) {
    ageInput.addEventListener('blur', validateAge);
    ageInput.addEventListener('input', () => {
      ageInput.classList.remove('error');
      ageError.textContent = '';
    });
  }

  if (emergencyContactInput) {
    emergencyContactInput.addEventListener('blur', validateEmergencyContact);
    emergencyContactInput.addEventListener('input', () => {
      emergencyContactInput.classList.remove('error');
      emergencyContactError.textContent = '';
    });
  }

  // Form submission
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      // Only validate form fields if they're enabled (OTP has been verified)
      if (!fullNameInput.disabled) {
        const isFullNameValid = validateFullName();
        const isAddressValid = validateAddress();
        const isAgeValid = validateAge();
        const isEmergencyContactValid = validateEmergencyContact();
        
        if (!(isFullNameValid && isAddressValid && isAgeValid && isEmergencyContactValid)) {
          e.preventDefault();
        }
      }
    });
  }
});
