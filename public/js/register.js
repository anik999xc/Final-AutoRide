
    // ১. সার্ভার থেকে এনভায়রনমেন্ট ভেরিয়েবল গ্রহণ
    const { 
        SUPABASE_URL, 
        SUPABASE_KEY, 
        EMAILJS_PUBLIC_KEY, 
        EMAILJS_SERVICE_ID, 
        EMAILJS_TEMPLATE_ID 
    } = <%- JSON.stringify(env) %>;

    // ২. EmailJS ও Supabase Initialization
    emailjs.init(EMAILJS_PUBLIC_KEY);
    import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // এলিমেন্ট রেফারেন্স
    const nameInput = document.getElementById('name');
    const addressInput = document.getElementById('address');
    const emergencyInput = document.getElementById('emergency');
    const emailInput = document.getElementById('email');
    const otpInput = document.getElementById('otp');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const registerForm = document.getElementById('registerForm');
    const timerDisplay = document.getElementById('timerDisplay');

    let realOtp = null;
    let timer = null;

    // OTP পাঠানোর লজিক
    sendOtpBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        if (!name || !email || !addressInput.value || !emergencyInput.value) {
            return alert('All fields are required.');
        }

        try {
            // ইমেইল চেক (Existing User)
            const { data } = await supabase.from('users').select('email').eq('email', email);
            if (data && data.length > 0) {
                alert('Account already exists. Please login.');
                return window.location.href = '/login';
            }

            realOtp = Math.floor(100000 + Math.random() * 900000).toString();

            // EmailJS এরর ফিক্স (422 error solution)
            const templateParams = {
                to_email: email,    // EmailJS টেমপ্লেটে {{to_email}} ব্যবহার করুন
                recipient: email,   // ব্যাকআপ প্যারামিটার
                to_name: name,
                passcode: realOtp
            };

            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
            
            alert('OTP sent to ' + email);
            otpInput.disabled = false;
            otpInput.focus();
            
            // বাটন ডিজেবল ও টাইমার লজিক (অপরিবর্তিত)
            sendOtpBtn.disabled = true;
        } catch (error) {
            console.error("Email Error:", error);
            alert('Failed to send OTP. Check console.');
        }
    });

    // রেজিস্ট্রেশন সাবমিট (ডাটাবেস সেভ)
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (otpInput.value.trim() !== realOtp) return alert('Invalid OTP.');

        const authKey = crypto.randomUUID();

        // ডাটাবেসে নতুন কলাম অনুযায়ী ইনসার্ট
        const { error } = await supabase.from('users').insert([{
            name: nameInput.value.trim(),
            address: addressInput.value.trim(),
            emergency_number: emergencyInput.value.trim(),
            email: emailInput.value.trim(),
            auth_key: authKey
        }]);

        if (error) {
            console.error("DB Error:", error);
            return alert('Database save failed!');
        }

        localStorage.setItem('authKey', authKey);
        alert('Registration successful!');
        window.location.href = '/home';
    });