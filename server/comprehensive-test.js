// Comprehensive API Test Suite
import fetch from 'node-fetch';

const baseURL = 'http://localhost:5000';
let authToken = '';
let testUserId = '';

const logTest = (testName, result, status = '✅') => {
    console.log(`${status} ${testName}:`, JSON.stringify(result, null, 2));
    console.log('─'.repeat(50));
};

const testAPIs = async () => {
    try {
        console.log('🚀 Starting Comprehensive API Test Suite\n');
        console.log('='.repeat(60));

        // 1. Test Health Endpoint
        console.log('\n1️⃣ TESTING HEALTH ENDPOINT');
        const healthResponse = await fetch(`${baseURL}/health`);
        const healthData = await healthResponse.json();
        logTest('Health Check', healthData);

        // 2. Test User Registration
        console.log('\n2️⃣ TESTING USER REGISTRATION');
        const registerData = {
            username: `testuser_${Date.now()}`,
            email: `test${Date.now()}@example.com`,
            password: 'password123',
            full_name: 'Test User',
            role: 'smoker'
        };

        const registerResponse = await fetch(`${baseURL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
        });
        
        const registerResult = await registerResponse.json();
        logTest('User Registration', registerResult);

        // 3. Test User Login
        console.log('\n3️⃣ TESTING USER LOGIN');
        const loginData = {
            email: registerData.email,
            password: registerData.password
        };

        const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });
        
        const loginResult = await loginResponse.json();
        if (loginResult.token) {
            authToken = loginResult.token;
            testUserId = loginResult.user?.id || loginResult.user?.UserID;
        }
        logTest('User Login', loginResult);

        // 4. Test Packages Endpoint
        console.log('\n4️⃣ TESTING PACKAGES');
        const packagesResponse = await fetch(`${baseURL}/api/packages`);
        const packagesData = await packagesResponse.json();
        logTest('Get Packages', packagesData);

        // 5. Test Achievements Endpoint
        console.log('\n5️⃣ TESTING ACHIEVEMENTS');
        const achievementsResponse = await fetch(`${baseURL}/api/achievements`);
        const achievementsData = await achievementsResponse.json();
        logTest('Get Achievements', achievementsData);

        // 6. Test User Profile (Protected Route)
        if (authToken) {
            console.log('\n6️⃣ TESTING USER PROFILE (PROTECTED)');
            const profileResponse = await fetch(`${baseURL}/api/users/profile`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const profileData = await profileResponse.json();
            logTest('User Profile', profileData);
        }

        // 7. Test Quit Plans
        console.log('\n7️⃣ TESTING QUIT PLANS');
        const quitPlansResponse = await fetch(`${baseURL}/api/quit-plans`);
        const quitPlansData = await quitPlansResponse.json();
        logTest('Get Quit Plans', quitPlansData);

        // 8. Test Progress Endpoint
        if (authToken) {
            console.log('\n8️⃣ TESTING PROGRESS (PROTECTED)');
            const progressResponse = await fetch(`${baseURL}/api/progress`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const progressData = await progressResponse.json();
            logTest('User Progress', progressData);
        }

        // 9. Test Coaches
        console.log('\n9️⃣ TESTING COACHES');
        const coachesResponse = await fetch(`${baseURL}/api/coaches`);
        const coachesData = await coachesResponse.json();
        logTest('Get Coaches', coachesData);

        // 10. Test Appointments
        if (authToken) {
            console.log('\n🔟 TESTING APPOINTMENTS (PROTECTED)');
            const appointmentsResponse = await fetch(`${baseURL}/api/appointments`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const appointmentsData = await appointmentsResponse.json();
            logTest('User Appointments', appointmentsData);
        }

        // 11. Test Notifications
        if (authToken) {
            console.log('\n1️⃣1️⃣ TESTING NOTIFICATIONS (PROTECTED)');
            const notificationsResponse = await fetch(`${baseURL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const notificationsData = await notificationsResponse.json();
            logTest('User Notifications', notificationsData);
        }

        // 12. Test Settings
        if (authToken) {
            console.log('\n1️⃣2️⃣ TESTING SETTINGS (PROTECTED)');
            const settingsResponse = await fetch(`${baseURL}/api/settings`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const settingsData = await settingsResponse.json();
            logTest('User Settings', settingsData);
        }

        console.log('\n🎉 API TEST SUITE COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ API Test Suite Error:', error.message);
        console.error('Stack:', error.stack);
    }
};

// Wait a moment for server to be ready, then run tests
setTimeout(() => {
    testAPIs();
}, 2000);
