// Test script to manually check appointment API
const testAppointment = async () => {
    try {
        console.log('Testing appointment API...');
        
        const response = await fetch('http://localhost:5000/api/auth/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify({
                coachId: 1,
                appointmentDate: '2025-07-14',
                appointmentTime: '13:30'
            })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
    } catch (error) {
        console.error('Error:', error);
    }
};

testAppointment();
