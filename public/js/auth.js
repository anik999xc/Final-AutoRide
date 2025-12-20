document.addEventListener('DOMContentLoaded', function() {
  // Get all the elements we need
  const phoneInput = document.getElementById('phoneNumber');
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  const otpGroup = document.getElementById('otpGroup');
  const resendOtpBtn = document.getElementById('resendOtpBtn');
  const timerElement = document.getElementById('timer');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn') || document.getElementById('createAccountBtn');
  const loginForm = document.getElementById('loginForm') || document.getElementById('registerForm');
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notificationMessage');

  // OTP input elements
  const otpInputs = Array.from({ length: 6 }, (_, i) => document.getElementById(`digit${i+1}`));
  const fullOtpInput = document.getElementById('fullOtp');

  // Timer variables
  let timerInterval;
  let secondsLeft = 60;

  // Function to show notification
  function showNotification(message, isError = false) {
    notificationMessage.textContent = message;
    notification.classList.remove('hidden');
    notification.classList.remove('success', 'error');
    notification.classList.add(isError ? 'error' : 'success');
    
    setTimeout(() => {
      notification.classList.add('hidden');
    }, 5000);
  }

  // Function to start the timer
  function startTimer() {
    clearInterval(timerInterval);
    secondsLeft = 60;
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
      secondsLeft--;
      updateTimerDisplay();
      
      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        resendOtpBtn.disabled = false;
      }
    }, 1000);
  }

  // Function to update the timer display
  function updateTimerDisplay() {
    timerElement.textContent = `${secondsLeft}s`;
  }

  // Function to handle input focus for OTP
  function setupOTPInputs() {
    otpInputs.forEach((input, index) => {
      input.addEventListener('keyup', (e) => {
        if (e.key >= '0' && e.key <= '9') {
          input.value = e.key;
          
          // Combine all inputs into the hidden full OTP field
          fullOtpInput.value = otpInputs.map(input => input.value).join('');
          
          // Auto focus next input
          if (index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
          } else {
            // If last input, take focus away
            input.blur();
          }
        } else if (e.key === 'Backspace') {
          input.value = '';
          
          // Update the hidden full OTP input
          fullOtpInput.value = otpInputs.map(input => input.value).join('');
          
          // Focus previous input
          if (index > 0) {
            otpInputs[index - 1].focus();
          }
        }
      });

      // Handle paste event on any OTP input
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        
        // Check if pasted data is a 6-digit number
        if (/^\d{6}$/.test(pastedData)) {
          // Fill all inputs
          otpInputs.forEach((input, i) => {
            input.value = pastedData[i] || '';
          });
          
          // Update the hidden full OTP input
          fullOtpInput.value = pastedData;
          
          // Move focus to last input
          otpInputs[otpInputs.length - 1].focus();
        }
      });
    });
  }

  // Function to send OTP
  async function sendOTP() {
    if (!phoneInput.value) {
      showNotification('Please enter a valid phone number', true);
      return;
    }

    try {
      const response = await fetch('/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phoneInput.value }),
      });

      const data = await response.json();

      if (data.success) {
        // Show OTP input group
        otpGroup.classList.remove('hidden');
        // Disable the phone input and send button
        phoneInput.disabled = true;
        sendOtpBtn.disabled = true;
        // Show resend button but disable it for 60 seconds
        resendOtpBtn.disabled = true;
        // Start the timer
        startTimer();
        
        showNotification(data.message);
        
        // If in development and OTP is returned, autofill it
        if (data.otp) {
          const otpString = data.otp.toString();
          otpInputs.forEach((input, i) => {
            if (i < otpString.length) {
              input.value = otpString[i];
            }
          });
          fullOtpInput.value = otpString;
        }
        
        // Focus on first OTP input
        if (otpInputs[0]) {
          otpInputs[0].focus();
        }
      } else {
        showNotification(data.message, true);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      showNotification('Failed to send OTP. Please try again.', true);
    }
  }

  // Function to resend OTP
  async function resendOTP() {
    resendOtpBtn.disabled = true;
    await sendOTP();
  }

  // Function to verify OTP
  async function verifyOTP() {
    const otp = fullOtpInput.value;
    if (!otp || otp.length !== 6) {
      showNotification('Please enter a valid 6-digit OTP', true);
      return;
    }

    try {
      const verifyEndpoint = loginForm.id === 'loginForm' ? '/login/verify' : '/auth/verify-otp';
      const response = await fetch(verifyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber: phoneInput.value,
          otp
        }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(data.message);
        
        // If on login page and verification successful, redirect
        if (loginForm.id === 'loginForm' && data.redirect) {
          window.location.href = data.redirect;
        } else if (loginForm.id === 'registerForm') {
          // If on register page, enable the register form fields
          document.querySelectorAll('#registerForm input:not([id^="digit"])').forEach(input => {
            if (input.id !== 'phoneNumber' && input.id !== 'fullOtp') {
              input.disabled = false;
            }
          });
          document.getElementById('createAccountBtn').classList.remove('hidden');
          document.getElementById('verifyOtpBtn').classList.add('hidden');
        }
      } else {
        showNotification(data.message, true);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      showNotification('Failed to verify OTP. Please try again.', true);
    }
  }

  // Initialize OTP input behaviors if they exist
  if (otpInputs.length > 0 && otpInputs[0]) {
    setupOTPInputs();
  }

  // Event listeners
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', sendOTP);
  }

  if (resendOtpBtn) {
    resendOtpBtn.addEventListener('click', resendOTP);
  }

  if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // If this is the register form's create account button
      if (this.id === 'createAccountBtn') {
        // Submit the form
        loginForm.submit();
      } else {
        // Verify OTP
        verifyOTP();
      }
    });
  }

  // If this is the registration form, set up form submission
  if (loginForm && loginForm.id === 'registerForm') {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(loginForm);
      const userData = Object.fromEntries(formData.entries());
      
      try {
        const response = await fetch('/register/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (data.success) {
          showNotification(data.message);
          if (data.redirect) {
            window.location.href = data.redirect;
          }
        } else {
          showNotification(data.message, true);
        }
      } catch (error) {
        console.error('Error creating account:', error);
        showNotification('Failed to create account. Please try again.', true);
      }
    });
  }
});
