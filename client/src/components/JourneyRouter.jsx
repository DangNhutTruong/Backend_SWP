import React, { useState, useEffect } from 'react';
import { getUserPlans } from '../services/quitPlanService';
import { logDebug } from '../utils/debugHelpers';
import JourneyStepper from './JourneyStepper';
import QuitPlanList from './QuitPlanList';

const JourneyRouter = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkUserPlans();

        // Lắng nghe sự kiện khi có kế hoạch mới được tạo
        const handlePlanCreated = () => {
            console.log('🔄 JourneyRouter - Nhận event kế hoạch mới được tạo, refresh...');
            checkUserPlans();
        };

        // Lắng nghe sự kiện khi kế hoạch bị xóa
        const handlePlanDeleted = () => {
            console.log('🗑️ JourneyRouter - Nhận event kế hoạch bị xóa, refresh...');
            checkUserPlans();
        };

        window.addEventListener('planCreated', handlePlanCreated);
        window.addEventListener('planDeleted', handlePlanDeleted);

        return () => {
            window.removeEventListener('planCreated', handlePlanCreated);
            window.removeEventListener('planDeleted', handlePlanDeleted);
        };
    }, []);

    const checkUserPlans = async () => {
        try {
            setLoading(true);
            setError(null);

            logDebug('JourneyRouter', '🔍 Checking if user has existing plans...');
            const userPlans = await getUserPlans();

            if (userPlans && Array.isArray(userPlans)) {
                setPlans(userPlans);
                logDebug('JourneyRouter', `✅ Found ${userPlans.length} existing plans`);
            } else {
                setPlans([]);
                logDebug('JourneyRouter', 'ℹ️ No existing plans found');
            }

            setLoading(false);
        } catch (err) {
            console.error('Error checking user plans:', err);
            logDebug('JourneyRouter', '❌ Error checking plans, defaulting to stepper', err, true);
            setError(err.message);
            setPlans([]); // Default to empty plans (show stepper)
            setLoading(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                padding: '40px',
                color: '#666'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid rgba(46, 125, 50, 0.1)',
                    borderLeft: '4px solid #2e7d32',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '20px'
                }}></div>
                <p>Đang kiểm tra kế hoạch của bạn...</p>
                <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    // If there's an error but we can still show something, show QuitPlanList để xử lý empty state
    if (error && plans.length === 0) {
        logDebug('JourneyRouter', 'ℹ️ Error occurred but no plans found, showing QuitPlanList for empty state');
        return <QuitPlanList />;
    }

    // Luôn hiển thị QuitPlanList - nó sẽ tự xử lý trường hợp có kế hoạch hay không có kế hoạch
    logDebug('JourneyRouter', `✅ Showing QuitPlanList with ${plans.length} plans`);
    return <QuitPlanList />;
};

export default JourneyRouter;
