const socket = io();

// সার্ভারে প্যাসেঞ্জার হিসেবে নিজেকে চিহ্নিত করুন
socket.emit("userType", "passenger");

let map;
let markers = {}; // To store markers by socket id
let passengerMarker; // Store the passenger's marker

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      console.log("Initial position received:", { latitude, longitude });
      initializeMap(latitude, longitude);
      socket.emit("send-location", { id: "my-device", latitude, longitude }); // Ensure a unique id for your device
      addPassengerMarker(latitude, longitude); // Add the passenger's marker
    },
    (error) => {
      console.error("Error getting initial location:", error);
      initializeMap(0, 0); // Fallback to default location if geolocation fails
    },
    {
      enableHighAccuracy: true,
      timeout: 1000,
      maximumAge: 0,
    }
  );

  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      console.log("Updated position received:", { latitude, longitude });
      socket.emit("send-location", { id: "my-device", latitude, longitude }); // Ensure a unique id for your device
      updatePassengerMarker(latitude, longitude); // Update the passenger's marker
    },
    (error) => {
      console.error("Error updating location:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 1000,
      maximumAge: 0,
    }
  );
} else {
  console.error("Geolocation is not supported by this browser.");
  initializeMap(0, 0); // Fallback to default location if geolocation is not supported
  addPassengerMarker(0, 0); // Add the marker at default location
}

function initializeMap(lat, lng) {
  console.log("Initializing map with latitude:", lat, "and longitude:", lng);
  map = L.map("map").setView([lat, lng], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "AutoRide"
  }).addTo(map);

  socket.on("receive-location", (data) => {
    console.log("Received location data:", data);
    const { id, latitude, longitude } = data;
    if (markers[id]) {
      // Update existing marker
      markers[id].setLatLng([latitude, longitude]);
      console.log(`Updated marker for id ${id}`);
    } else {
      // Create new marker
      const otherIcon = L.icon({
        iconUrl: '/img/passenger_marker.png', // Use passenger marker icon for others
        iconSize: [32, 32], // Adjust size as needed
        iconAnchor: [16, 16], // Adjust anchor if needed
        popupAnchor: [0, -16]  // Adjust popup anchor if needed
      });
      markers[id] = L.marker([latitude, longitude], { icon: otherIcon }).addTo(map);
      console.log(`Created new marker for id ${id}`);
    }
    map.setView([latitude, longitude], 17); // Update map center and zoom level
  });
}

function addPassengerMarker(lat, lng) {
  const passengerIcon = L.icon({
    iconUrl: '/img/passenger_marker.png',
    iconSize: [32, 32], // Adjust size as needed
    iconAnchor: [16, 16], // Adjust anchor if needed
    popupAnchor: [0, -16]  // Adjust popup anchor if needed
  });

  passengerMarker = L.marker([lat, lng], { icon: passengerIcon }).addTo(map);
}

function updatePassengerMarker(lat, lng) {
  if (passengerMarker) {
    passengerMarker.setLatLng([lat, lng]);
  } else {
    addPassengerMarker(lat, lng);
  }
}
// এই স্ক্রিপ্টটি প্রতিটি এইচটিএমএল পেজের জাভাস্ক্রিপ্ট ফাইলে যোগ করুন

(function() {
    const authKey = localStorage.getItem('authKey');
    const currentPage = window.location.pathname;
    const loginPagePath = '/login'; // আপনার লগইন পেজের পাথ এখানে দিন

    // যদি authKey না থাকে এবং ব্যবহারকারী লগইন পেজে না থাকে,
    // তাহলে লগইন পেজে রিডাইরেক্ট করুন
    if (!authKey && currentPage !== loginPagePath) {
        window.location.href = loginPagePath;
    }
})();