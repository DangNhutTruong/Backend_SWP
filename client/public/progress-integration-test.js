// Test complete plan-based progress integration
// This script tests the full flow: select plan -> create checkin -> view history -> delete checkin

const API_BASE = 'http://localhost:5000/api';

// Test data
const testUserId = 1;
let testPlanId = null;
let testCheckinDate = null;

// Get auth token (modify as needed for your auth system)
const getAuthToken = () => {
    // Replace with your actual token retrieval logic
    return localStorage.getItem('token') || 'test-token';
};

// API call helper
const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
        ...options.headers
    };

    console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);
    if (options.body) {
        console.log('📤 Request body:', JSON.parse(options.body));
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json();
        console.log(`📨 Response (${response.status}):`, data);

        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        return { success: true, data: data.data || data, message: data.message };
    } catch (error) {
        console.error(`❌ API Error:`, error.message);
        return { success: false, error: error.message };
    }
};

// Test functions
const testGetUserPlans = async () => {
    console.log('\n🔍 === Testing: Get User Plans ===');

    const result = await apiCall(`/quit-plans/user/${testUserId}`);

    if (result.success && result.data.length > 0) {
        testPlanId = result.data[0].id;
        console.log(`✅ Found ${result.data.length} plans. Using plan ID: ${testPlanId}`);
        return true;
    } else {
        console.log('❌ No plans found or error occurred');
        return false;
    }
};

const testCreateCheckin = async () => {
    console.log('\n📝 === Testing: Create Checkin with Plan ID ===');

    if (!testPlanId) {
        console.log('❌ No plan ID available for testing');
        return false;
    }

    testCheckinDate = new Date().toISOString().split('T')[0];

    const checkinData = {
        date: testCheckinDate,
        urge_intensity: 7,
        mood_score: 8,
        stress_level: 4,
        sleep_quality: 7,
        exercise_minutes: 30,
        water_glasses: 8,
        notes: `Test checkin for plan ${testPlanId} - ${new Date().toLocaleString()}`
    };

    const result = await apiCall(`/progress/checkin/${testUserId}?plan_id=${testPlanId}`, {
        method: 'POST',
        body: JSON.stringify(checkinData)
    });

    if (result.success) {
        console.log('✅ Checkin created successfully');
        return true;
    } else {
        console.log('❌ Failed to create checkin');
        return false;
    }
};

const testGetProgressWithPlan = async () => {
    console.log('\n📊 === Testing: Get Progress with Plan ID ===');

    if (!testPlanId) {
        console.log('❌ No plan ID available for testing');
        return false;
    }

    const result = await apiCall(`/progress/user/${testUserId}?plan_id=${testPlanId}`);

    if (result.success) {
        console.log(`✅ Retrieved ${result.data.length} progress records for plan ${testPlanId}`);

        // Show latest few records
        const latest = result.data.slice(-3);
        latest.forEach(record => {
            console.log(`  📅 ${record.date}: Urge=${record.urge_intensity}, Mood=${record.mood_score}`);
        });

        return true;
    } else {
        console.log('❌ Failed to get progress data');
        return false;
    }
};

const testGetProgressWithoutPlan = async () => {
    console.log('\n🚫 === Testing: Get Progress WITHOUT Plan ID (Should Fail) ===');

    const result = await apiCall(`/progress/user/${testUserId}`);

    if (!result.success) {
        console.log('✅ Correctly rejected request without plan_id');
        return true;
    } else {
        console.log('❌ Request without plan_id should have failed but succeeded');
        return false;
    }
};

const testDeleteCheckin = async () => {
    console.log('\n🗑️ === Testing: Delete Checkin with Plan ID ===');

    if (!testPlanId || !testCheckinDate) {
        console.log('❌ No plan ID or checkin date available for testing');
        return false;
    }

    const result = await apiCall(`/progress/checkin/${testUserId}/${testCheckinDate}?plan_id=${testPlanId}`, {
        method: 'DELETE'
    });

    if (result.success) {
        console.log('✅ Checkin deleted successfully');
        return true;
    } else {
        console.log('❌ Failed to delete checkin');
        return false;
    }
};

const testDeleteWithoutPlan = async () => {
    console.log('\n🚫 === Testing: Delete Checkin WITHOUT Plan ID (Should Fail) ===');

    if (!testCheckinDate) {
        console.log('❌ No checkin date available for testing');
        return false;
    }

    const result = await apiCall(`/progress/checkin/${testUserId}/${testCheckinDate}`, {
        method: 'DELETE'
    });

    if (!result.success) {
        console.log('✅ Correctly rejected delete request without plan_id');
        return true;
    } else {
        console.log('❌ Delete without plan_id should have failed but succeeded');
        return false;
    }
};

const testProgressStats = async () => {
    console.log('\n📈 === Testing: Progress Stats with Plan ID ===');

    if (!testPlanId) {
        console.log('❌ No plan ID available for testing');
        return false;
    }

    const result = await apiCall(`/progress/stats/${testUserId}?plan_id=${testPlanId}`);

    if (result.success) {
        console.log('✅ Progress stats retrieved successfully');
        console.log('  📊 Stats:', result.data);
        return true;
    } else {
        console.log('❌ Failed to get progress stats');
        return false;
    }
};

// Main test runner
const runIntegrationTests = async () => {
    console.log('🚀 Starting Plan-based Progress Integration Tests');
    console.log('='.repeat(60));

    const tests = [
        { name: 'Get User Plans', fn: testGetUserPlans },
        { name: 'Create Checkin with Plan', fn: testCreateCheckin },
        { name: 'Get Progress with Plan', fn: testGetProgressWithPlan },
        { name: 'Get Progress without Plan (Should Fail)', fn: testGetProgressWithoutPlan },
        { name: 'Get Progress Stats', fn: testProgressStats },
        { name: 'Delete without Plan (Should Fail)', fn: testDeleteWithoutPlan },
        { name: 'Delete Checkin with Plan', fn: testDeleteCheckin }
    ];

    let passed = 0;
    let total = tests.length;

    for (const test of tests) {
        try {
            const success = await test.fn();
            if (success) {
                passed++;
                console.log(`✅ PASS: ${test.name}`);
            } else {
                console.log(`❌ FAIL: ${test.name}`);
            }
        } catch (error) {
            console.log(`💥 ERROR in ${test.name}:`, error.message);
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🏁 Test Results: ${passed}/${total} tests passed`);

    if (passed === total) {
        console.log('🎉 All tests passed! Plan-based progress system is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Please check the implementation.');
    }
};

// Export for use in browser console or Node.js
if (typeof window !== 'undefined') {
    // Browser environment
    window.runProgressIntegrationTests = runIntegrationTests;
    console.log('📝 To run tests, execute: runProgressIntegrationTests()');
} else {
    // Node.js environment
    module.exports = { runIntegrationTests };
}

// Auto-run if called directly
if (typeof window !== 'undefined' && window.location.href.includes('api-test')) {
    console.log('🔄 Auto-running integration tests...');
    setTimeout(runIntegrationTests, 1000);
}
