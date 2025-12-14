function redirectToLogin(userType) {
    if (userType === "passenger") {
        window.location.href = "/login";
    } else if (userType === "captain") {
        window.location.href = "/captain_login";
    }
}

(function() {
    const authKey = localStorage.getItem('authKey');
    const homePagePath = '/home'; // আপনার হোম পেজের পাথ এখানে দিন (যেমন: '/home.html')
    const currentPage = window.location.pathname;

    // যদি authKey থাকে এবং ব্যবহারকারী হোম পেজে না থাকে,
    // তাহলে হোম পেজে রিডাইরেক্ট করুন
    if (authKey && currentPage !== homePagePath) {
        window.location.href = homePagePath;
    }
})();