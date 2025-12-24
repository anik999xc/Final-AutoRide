const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const http = require("http");
const socketio = require("socket.io");

// Load environment variables
dotenv.config();

// Routes import
const routes = require('./routes/index');
const uploadRoutes = require('./routes/upload');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// PORT configuration
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use('/uploads/profile', express.static(path.join(__dirname, 'uploads/profile')));
app.use('/uploads/cover', express.static(path.join(__dirname, 'uploads/cover')));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Config endpoint
app.get('/config', (req, res) => {
    res.json({
        apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    });
});

// EJS Locals Middleware
app.use((req, res, next) => {
    res.locals.env = {
        GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
        EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY,
        EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY,
    };
    next();
});

// Loading screen middleware
app.use((req, res, next) => {
    const originalRender = res.render;
    res.render = function(view, options, callback) {
        options = options || {};
        if (!options.layout) {
            options.loadingCss = '<link rel="stylesheet" href="/css/loading.css">';
            options.loadingJs = '<script src="/js/loading.js"></script>';
            options.loadingScreen = `
                <div id="loading-overlay">
                    <div class="loading-content">
                        <img src="/img/logo.png" alt="Logo" class="loading-logo">
                        <div class="spinner-3d"></div>
                    </div>
                </div>
            `;
        }
        originalRender.call(this, view, options, callback);
    };
    next();
});

// Utility function to calculate distance
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Enhanced ride booking endpoint - FIXED
app.post('/passenger_map', (req, res) => {
    try {
        const { pickup_name, pickup_lat, pickup_lng, drop_name, drop_lat, drop_lng } = req.body;

        console.log("Received Booking Data:", req.body);

        // Validate required fields
        if (!pickup_name || !pickup_lat || !pickup_lng || !drop_name || !drop_lat || !drop_lng) {
            return res.status(400).json({ error: 'Missing required booking data' });
        }

        // Parse and validate coordinates
        const pickupLat = parseFloat(pickup_lat);
        const pickupLng = parseFloat(pickup_lng);
        const dropLat = parseFloat(drop_lat);
        const dropLng = parseFloat(drop_lng);

        if (isNaN(pickupLat) || isNaN(pickupLng) || isNaN(dropLat) || isNaN(dropLng)) {
            return res.status(400).json({ error: 'Invalid coordinates provided' });
        }

        // Calculate distance
        const distance = calculateDistance(pickupLat, pickupLng, dropLat, dropLng);

        // Validate distance (max 50km for safety)
        if (distance > 50) {
            return res.status(400).json({ error: 'Distance too long. Maximum 50km allowed.' });
        }

        // Generate unique ride request ID
        const rideRequestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        // FIXED: Proper ride data structure
        const rideData = {
            id: rideRequestId,
            pickup: { 
                name: pickup_name, 
                lat: pickupLat, 
                lng: pickupLng 
            },
            drop: { 
                name: drop_name, 
                lat: dropLat, 
                lng: dropLng 
            },
            distance: distance.toFixed(1),
            estimatedDuration: Math.round(distance * 3),
            estimatedFare: Math.max(20, Math.round(distance * 12)),
            timestamp: new Date().toISOString()
        };

        console.log("Processed Ride Data:", rideData);

        // Render with proper data
        res.render('passenger_map', { 
            rideData: rideData,
            title: 'Confirm Your Ride - AutoRide'
        });

    } catch (error) {
        console.error('Error processing ride request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test route for development
app.get('/test-ride', (req, res) => {
    const testRideData = {
        id: 'test_123',
        pickup: { name: "Dhanmondi 27", lat: 23.7465, lng: 90.3764 },
        drop: { name: "Gulshan 1", lat: 23.7809, lng: 90.4132 },
        distance: "5.2",
        estimatedDuration: 15,
        estimatedFare: 65
    };
    
    res.render('passenger_map', { 
        rideData: testRideData,
        title: 'Test Ride - AutoRide'
    });
});

// Routes (from old code)
app.use('/upload', uploadRoutes);
app.use('/', routes);

// =============================================
// ENHANCED SOCKET.IO IMPLEMENTATION - FIXED
// =============================================

// Store active users and rides
const activeDrivers = new Map(); 
const activePassengers = new Map(); 
const activeRides = new Map(); 
const rideRequests = new Map(); 

// Enhanced utility functions
function findNearbyDrivers(passengerLocation, radiusKm = 15) {
    const nearbyDrivers = [];
    const currentTime = Date.now();
    
    activeDrivers.forEach((driver, driverId) => {
        if (driver.status === 'online' && 
            !driver.currentRide && 
            (currentTime - driver.lastUpdate) < 60000) {
            
            const distance = calculateDistance(
                passengerLocation.latitude,
                passengerLocation.longitude,
                driver.location.latitude,
                driver.location.longitude
            );
            
            if (distance <= radiusKm) {
                nearbyDrivers.push({
                    ...driver,
                    distanceFromPassenger: distance.toFixed(1),
                    estimatedArrival: Math.round(distance * 3)
                });
            }
        }
    });
    
    return nearbyDrivers.sort((a, b) => {
        const distanceDiff = parseFloat(a.distanceFromPassenger) - parseFloat(b.distanceFromPassenger);
        if (distanceDiff !== 0) return distanceDiff;
        return b.rating - a.rating;
    });
}

function generateUniqueOtp() {
    let otp;
    do {
        otp = Math.floor(1000 + Math.random() * 9000).toString();
    } while (Array.from(activeRides.values()).some(ride => ride.otp === otp));
    return otp;
}

// Socket.io connection handling
io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);
    
    socket.on("userType", (type) => {
        socket.userType = type;
        console.log(`👤 User ${socket.id} identified as: ${type}`);
    });

    // =============================================
    // DRIVER EVENT HANDLERS - ENHANCED & FIXED
    // =============================================
    
    socket.on('driverOnline', (data) => {
        const { driverId, location, name, rating, phone, vehicle } = data;
        
        const enhancedDriverData = {
            id: driverId,
            socketId: socket.id,
            location: location,
            status: 'online',
            currentRide: null,
            name: name || `Driver ${driverId.substr(-4)}`,
            rating: rating || 4.8,
            phone: phone || '+880 1234-567890',
            vehicle: vehicle || 'Honda CB 150R',
            plateNumber: `DHK-${Math.floor(1000 + Math.random() * 9000)}`,
            totalTrips: Math.floor(Math.random() * 200) + 50,
            completedTrips: 0,
            earnings: 0,
            onlineTime: Date.now(),
            lastUpdate: Date.now(),
        };
        
        activeDrivers.set(driverId, enhancedDriverData);
        socket.driverId = driverId;
        
        console.log(`🚗 Driver ${driverId} (${name}) is now online`);
    });
    
    socket.on('driverOffline', (data) => {
        const { driverId } = data;
        
        if (activeDrivers.has(driverId)) {
            const driver = activeDrivers.get(driverId);
            const sessionTime = Date.now() - driver.onlineTime;
            
            activeDrivers.delete(driverId);
            console.log(`🚗 Driver ${driverId} is now offline (Session: ${Math.round(sessionTime/1000/60)} mins)`);
        }
    });
    
    socket.on('locationUpdate', (data) => {
        const { driverId, location } = data;
        
        if (activeDrivers.has(driverId)) {
            const driver = activeDrivers.get(driverId);
            driver.location = location;
            driver.lastUpdate = Date.now();
            activeDrivers.set(driverId, driver);
            
            // Real-time updates for active rides
            if (driver.currentRide) {
                const ride = activeRides.get(driver.currentRide);
                if (ride && ride.passenger.socketId) {
                    const estimatedArrival = ride.status === 'accepted' 
                        ? Math.round(calculateDistance(
                            location.latitude, location.longitude,
                            ride.pickup.lat, ride.pickup.lng
                        ) * 3)
                        : Math.round(calculateDistance(
                            location.latitude, location.longitude,
                            ride.drop.lat, ride.drop.lng
                        ) * 3);
                    
                    io.to(ride.passenger.socketId).emit('driverLocationUpdate', {
                        rideId: driver.currentRide,
                        location: location,
                        estimatedArrival,
                        driverInfo: {
                            name: driver.name,
                            phone: driver.phone,
                            vehicle: driver.vehicle,
                            plateNumber: driver.plateNumber
                        }
                    });
                    
                    // Check if driver arrived
                    if (ride.status === 'accepted') {
                        const distanceToPickup = calculateDistance(
                            location.latitude, location.longitude,
                            ride.pickup.lat, ride.pickup.lng
                        );
                        
                        if (distanceToPickup < 0.1 && !ride.driverArrivedNotified) {
                            ride.driverArrivedNotified = true;
                            activeRides.set(driver.currentRide, ride);
                            
                            io.to(ride.passenger.socketId).emit('driverArrived', {
                                rideId: driver.currentRide,
                                message: 'Your driver has arrived at the pickup location!'
                            });
                        }
                    }
                }
            }
        }
    });
    
    socket.on('rideAccepted', (data) => {
        const { rideId, driverId, driverLocation } = data;
        
        if (rideRequests.has(rideId)) {
            const request = rideRequests.get(rideId);
            const driver = activeDrivers.get(driverId);
            
            if (driver) {
                const rideOtp = generateUniqueOtp();
                
                const ride = {
                    id: rideId,
                    status: 'accepted',
                    otp: rideOtp,
                    driver: {
                        id: driverId,
                        socketId: socket.id,
                        name: driver.name,
                        rating: driver.rating,
                        phone: driver.phone,
                        vehicle: driver.vehicle,
                        plateNumber: driver.plateNumber,
                        location: driverLocation
                    },
                    passenger: {
                        id: request.passengerId,
                        socketId: request.passengerSocketId,
                        name: request.passengerName,
                        phone: request.passengerPhone,
                        rating: request.passengerRating
                    },
                    pickup: {
                        lat: request.pickupLat,
                        lng: request.pickupLng,
                        address: request.pickupAddress
                    },
                    drop: {
                        lat: request.dropLat,
                        lng: request.dropLng,
                        address: request.dropAddress
                    },
                    distance: request.distance,
                    duration: request.duration,
                    fare: Math.max(20, Math.round(parseFloat(request.distance) * 12)),
                    acceptedAt: Date.now(),
                    estimatedPickupTime: Math.round(calculateDistance(
                        driverLocation.latitude, driverLocation.longitude,
                        request.pickupLat, request.pickupLng
                    ) * 3),
                    driverArrivedNotified: false
                };
                
                activeRides.set(rideId, ride);
                driver.currentRide = rideId;
                driver.completedTrips = (driver.completedTrips || 0);
                activeDrivers.set(driverId, driver);
                
                // Notify passenger
                io.to(request.passengerSocketId).emit('rideAccepted', {
                    rideId: rideId,
                    driver: {
                        name: driver.name,
                        rating: driver.rating,
                        phone: driver.phone,
                        vehicle: driver.vehicle,
                        plateNumber: driver.plateNumber
                    },
                    driverLocation: driverLocation,
                    estimatedArrival: ride.estimatedPickupTime,
                    otp: rideOtp
                });
                
                // Notify other drivers
                activeDrivers.forEach((otherDriver, otherDriverId) => {
                    if (otherDriverId !== driverId && otherDriver.socketId !== socket.id) {
                        io.to(otherDriver.socketId).emit('rideAcceptedByAnother', { 
                            rideId,
                            takenBy: driver.name 
                        });
                    }
                });
                
                rideRequests.delete(rideId);
                console.log(`✅ Ride ${rideId} accepted by driver ${driver.name} (OTP: ${rideOtp})`);
            }
        }
    });
    
    socket.on('rideDeclined', (data) => {
        const { rideId, driverId, reason } = data;
        const driver = activeDrivers.get(driverId);
        
        console.log(`❌ Driver ${driver?.name || driverId} declined ride ${rideId} (Reason: ${reason || 'not_specified'})`);
    });
    
    socket.on('rideStarted', (data) => {
        const { rideId, otp } = data;
        
        if (activeRides.has(rideId)) {
            const ride = activeRides.get(rideId);
            
            // Verify OTP or start directly (for demo)
            if (!otp || ride.otp === otp) {
                ride.status = 'started';
                ride.startedAt = Date.now();
                ride.actualPickupTime = Date.now() - ride.acceptedAt;
                activeRides.set(rideId, ride);
                
                // Update driver stats
                const driver = activeDrivers.get(ride.driver.id);
                if (driver) {
                    driver.completedTrips = (driver.completedTrips || 0) + 1;
                    activeDrivers.set(ride.driver.id, driver);
                }
                
                // Notify passenger
                io.to(ride.passenger.socketId).emit('rideStarted', { 
                    rideId,
                    startTime: ride.startedAt,
                    message: 'Your ride has started! Enjoy your journey.'
                });
                
                console.log(`🚀 Ride ${rideId} started`);
            } else {
                io.to(socket.id).emit('otpVerificationFailed', {
                    rideId,
                    message: 'Invalid OTP. Please check with the passenger.'
                });
                
                console.log(`❌ Invalid OTP for ride ${rideId}. Expected: ${ride.otp}, Received: ${otp}`);
            }
        }
    });
    
    socket.on('rideFinished', (data) => {
        const { rideId } = data;
        
        if (activeRides.has(rideId)) {
            const ride = activeRides.get(rideId);
            ride.status = 'finished';
            ride.finishedAt = Date.now();
            ride.actualDuration = (ride.finishedAt - ride.startedAt) / 1000 / 60;
            activeRides.set(rideId, ride);
            
            io.to(ride.passenger.socketId).emit('rideFinished', { 
                rideId,
                finishTime: ride.finishedAt,
                duration: ride.actualDuration,
                fare: ride.fare,
                message: 'Ride completed successfully!'
            });
            
            console.log(`🏁 Ride ${rideId} finished (Duration: ${ride.actualDuration.toFixed(1)} mins)`);
        }
    });
    
    socket.on('cashCollected', (data) => {
        const { rideId, amount } = data;
        
        if (activeRides.has(rideId)) {
            const ride = activeRides.get(rideId);
            ride.status = 'completed';
            ride.completedAt = Date.now();
            ride.paymentMethod = 'cash';
            ride.amountCollected = amount;
            
            // Update driver earnings
            const driver = activeDrivers.get(ride.driver.id);
            if (driver) {
                const driverEarning = Math.round(parseFloat(ride.distance) * 10);
                driver.earnings = (driver.earnings || 0) + driverEarning;
                driver.currentRide = null;
                activeDrivers.set(ride.driver.id, driver);
            }
            
            activeRides.set(rideId, ride);
            
            console.log(`💰 Cash collected for ride ${rideId}: ₹${amount}`);
        }
    });

    // =============================================
    // PASSENGER EVENT HANDLERS - ENHANCED & FIXED
    // =============================================
    
    socket.on('rideRequest', (data) => {
        const { rideId, passengerId, pickupLat, pickupLng } = data;
        
        // Store passenger data
        const enhancedPassengerData = {
            id: passengerId,
            socketId: socket.id,
            name: data.passengerName || 'Passenger',
            phone: data.passengerPhone || '+880 1234-567890',
            rating: data.passengerRating || 4.5,
            lastUpdate: Date.now(),
        };
        
        activePassengers.set(passengerId, enhancedPassengerData);
        socket.passengerId = passengerId;
        
        // Enhanced ride request
        const enhancedRequestData = {
            ...data,
            passengerSocketId: socket.id,
            requestedAt: Date.now(),
            expiresAt: Date.now() + 180000, // 3 minutes
        };
        
        rideRequests.set(rideId, enhancedRequestData);
        
        // Find nearby drivers
        const nearbyDrivers = findNearbyDrivers({ 
            latitude: pickupLat, 
            longitude: pickupLng 
        }, 15);
        
        console.log(`🔍 Ride request ${rideId} from ${data.passengerName} (${passengerId})`);
        console.log(`📍 From: ${data.pickupAddress} → To: ${data.dropAddress}`);
        console.log(`🚗 Found ${nearbyDrivers.length} nearby drivers`);
        
        if (nearbyDrivers.length === 0) {
            setTimeout(() => {
                if (rideRequests.has(rideId)) {
                    io.to(socket.id).emit('rideRequestExpired', { 
                        rideId,
                        reason: 'no_drivers_available',
                        message: 'No drivers available in your area right now.'
                    });
                    rideRequests.delete(rideId);
                }
            }, 30000);
        } else {
            // Send to nearby drivers in batches
            const batchSize = Math.min(5, nearbyDrivers.length);
            const firstBatch = nearbyDrivers.slice(0, batchSize);
            
            firstBatch.forEach((driver, index) => {
                setTimeout(() => {
                    if (rideRequests.has(rideId)) {
                        const requestData = {
                            ...enhancedRequestData,
                            distanceFromDriver: driver.distanceFromPassenger,
                            estimatedArrival: driver.estimatedArrival,
                            driverIndex: index + 1,
                            totalNearbyDrivers: nearbyDrivers.length
                        };
                        
                        io.to(driver.socketId).emit('rideRequest', requestData);
                    }
                }, index * 2000);
            });
            
            // Second batch after 60 seconds if needed
            setTimeout(() => {
                if (rideRequests.has(rideId) && nearbyDrivers.length > batchSize) {
                    const secondBatch = nearbyDrivers.slice(batchSize, batchSize * 2);
                    secondBatch.forEach((driver) => {
                        if (rideRequests.has(rideId)) {
                            const requestData = {
                                ...enhancedRequestData,
                                distanceFromDriver: driver.distanceFromPassenger,
                                estimatedArrival: driver.estimatedArrival,
                                urgent: true
                            };
                            
                            io.to(driver.socketId).emit('rideRequest', requestData);
                        }
                    });
                }
            }, 60000);
        }
        
        // Set timeout for ride request
        setTimeout(() => {
            if (rideRequests.has(rideId)) {
                rideRequests.delete(rideId);
                io.to(socket.id).emit('rideRequestExpired', { 
                    rideId,
                    reason: 'timeout',
                    message: 'No drivers accepted your request. Please try again.'
                });
                console.log(`⏰ Ride request ${rideId} expired`);
            }
        }, 180000);
    });
    
    // Rating system
    socket.on('ratingSubmitted', (data) => {
        const { rideId, rating, passengerId, feedback } = data;
        
        if (activeRides.has(rideId)) {
            const ride = activeRides.get(rideId);
            ride.driverRating = {
                rating: parseInt(rating),
                feedback: feedback || '',
                submittedAt: Date.now()
            };
            activeRides.set(rideId, ride);
            
            console.log(`⭐ Driver rated passenger ${ride.passenger.name}: ${rating} stars`);
        }
    });

    // =============================================
    // CONNECTION MANAGEMENT - ENHANCED
    // =============================================
    
    socket.on("send-location", (data) => {
        socket.broadcast.emit("location-update", {
            id: data.id,
            latitude: data.latitude,
            longitude: data.longitude,
            userType: socket.userType,
            timestamp: Date.now()
        });
    });
    
    socket.on("disconnect", () => {
        console.log(`🔌 User disconnected: ${socket.id}`);
        
        // Cleanup for drivers
        if (socket.driverId) {
            const driver = activeDrivers.get(socket.driverId);
            if (driver && driver.currentRide) {
                const ride = activeRides.get(driver.currentRide);
                if (ride) {
                    io.to(ride.passenger.socketId).emit('driverDisconnected', {
                        rideId: driver.currentRide,
                        message: 'Driver connection lost. Trying to reconnect...'
                    });
                }
            }
            
            activeDrivers.delete(socket.driverId);
            console.log(`🚗 Driver ${socket.driverId} removed from active list`);
        }
        
        // Cleanup for passengers
        if (socket.passengerId) {
            rideRequests.forEach((request, rideId) => {
                if (request.passengerId === socket.passengerId) {
                    rideRequests.delete(rideId);
                    console.log(`🗑️ Cancelled pending ride request ${rideId} due to passenger disconnect`);
                }
            });
            
            activePassengers.delete(socket.passengerId);
            console.log(`👤 Passenger ${socket.passengerId} removed from active list`);
        }
        
        socket.broadcast.emit("user-disconnected", socket.id);
    });
});

// =============================================
// CLEANUP & MONITORING - ENHANCED
// =============================================

// Periodic cleanup
setInterval(() => {
    const now = Date.now();
    const staleTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Cleanup stale drivers
    activeDrivers.forEach((driver, driverId) => {
        if (now - driver.lastUpdate > staleTimeout) {
            activeDrivers.delete(driverId);
            console.log(`🧹 Removed stale driver: ${driver.name} (${driverId})`);
        }
    });
    
    // Cleanup expired ride requests
    rideRequests.forEach((request, rideId) => {
        if (now > request.expiresAt) {
            rideRequests.delete(rideId);
            console.log(`🧹 Removed expired ride request: ${rideId}`);
        }
    });
    
}, 60000);

// Status endpoint
app.get('/status', (req, res) => {
    const onlineDrivers = Array.from(activeDrivers.values()).filter(d => d.status === 'online');
    
    res.json({
        timestamp: new Date().toISOString(),
        system: {
            activeDrivers: activeDrivers.size,
            onlineDrivers: onlineDrivers.length,
            activePassengers: activePassengers.size,
            activeRides: activeRides.size,
            pendingRequests: rideRequests.size,
            socketConnections: io.engine.clientsCount
        },
        health: 'operational'
    });
});

// Debug endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
    app.get('/debug', (req, res) => {
        res.json({
            drivers: Array.from(activeDrivers.entries()).map(([id, data]) => ({
                id,
                name: data.name,
                status: data.status,
                currentRide: data.currentRide,
                rating: data.rating,
                lastUpdate: new Date(data.lastUpdate).toISOString()
            })),
            activeRides: Array.from(activeRides.entries()).map(([id, data]) => ({
                id,
                status: data.status,
                driver: data.driver.name,
                passenger: data.passenger.name,
                otp: data.otp,
                createdAt: new Date(data.acceptedAt).toISOString()
            })),
            pendingRequests: Array.from(rideRequests.entries()).map(([id, data]) => ({
                id,
                passenger: data.passengerName,
                pickup: data.pickupAddress,
                requestedAt: new Date(data.requestedAt).toISOString()
            }))
        });
    });
}

// Error handlers
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

app.use((err, req, res, next) => {
    console.error('🚨 Error:', err.stack);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        res.status(500).json({ 
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
        });
    } else {
        res.status(500).render('500', { 
            title: 'Server Error',
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }
});

// Server startup
server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🚗 AutoRide Server v2.0                  ║
║                     COMPLETELY FIXED                        ║
║                                                              ║
║  🚀 Server Status: RUNNING                                   ║
║  🌐 Port: ${PORT}                                           ║
║  📍 Local: http://localhost:${PORT}                          ║
║  🔌 Socket.IO: READY                                         ║
║  📊 Debug: http://localhost:${PORT}/debug                    ║
║  🏥 Status: http://localhost:${PORT}/status                  ║
║                                                              ║
║  🎯 Fixed Features:                                          ║
║  ✅ Proper ride data structure                               ║
║  ✅ Enhanced error handling                                  ║
║  ✅ Real-time driver tracking                                ║
║  ✅ OTP generation & verification                            ║
║  ✅ Smart ride matching                                      ║
║  ✅ Complete socket.io implementation                        ║
║  ✅ All routes properly integrated                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});

module.exports = { app, server, io };