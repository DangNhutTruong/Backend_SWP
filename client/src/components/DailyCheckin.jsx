import React, { useState, useEffect } from 'react';
import { FaCalendarCheck, FaSave, FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';
import CalendarPicker from './CalendarPicker';

const DailyCheckin = ({ onProgressUpdate, currentPlan }) => {
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [todayData, setTodayData] = useState({
        date: new Date().toISOString().split('T')[0],
        targetCigarettes: 12, // Sẽ được tính từ kế hoạch
        actualCigarettes: 0,
        notes: ''
    });

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [currentWeek, setCurrentWeek] = useState(1); // Tuần hiện tại
    const [streakDays, setStreakDays] = useState(0); // Số ngày liên tiếp đạt mục tiêu
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // Thông báo dạng toast    // Tính target cigarettes dựa trên kế hoạch và ngày hiện tại
    const calculateTodayTarget = () => {
        // Kiểm tra kỹ các trường hợp null/undefined
        if (!currentPlan) return 12;
        if (!currentPlan.weeks || !Array.isArray(currentPlan.weeks) || currentPlan.weeks.length === 0) return 12;
        if (!currentPlan.startDate) return currentPlan.weeks[0]?.amount || 12;
        
        try {
            const today = new Date();
            const startDate = new Date(currentPlan.startDate);
            
            // Kiểm tra ngày bắt đầu hợp lệ
            if (isNaN(startDate.getTime())) return currentPlan.weeks[0]?.amount || 12;
            
            const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            const currentWeekNumber = Math.floor(daysDiff / 7) + 1;
            
            setCurrentWeek(currentWeekNumber);
            
            // Tìm tuần hiện tại trong plan
            const currentWeekPlan = currentPlan.weeks.find(w => w.week === currentWeekNumber);
            if (currentWeekPlan) {
                // Lấy target của tuần trước nếu có
                const prevWeekPlan = currentPlan.weeks.find(w => w.week === currentWeekNumber - 1);
                if (prevWeekPlan && prevWeekPlan.amount > currentWeekPlan.amount) {
                    const reduction = prevWeekPlan.amount - currentWeekPlan.amount;
                    const percentReduction = Math.round((reduction / prevWeekPlan.amount) * 100);
                    
                    // Lưu thông tin tiến độ so với tuần trước
                    setTodayData(prev => ({
                        ...prev,
                        weeklyProgress: {
                            reduction,
                            percentReduction,
                            prevAmount: prevWeekPlan.amount
                        }
                    }));
                }
                
                return currentWeekPlan.amount;
            }
            
            // Nếu đã qua hết kế hoạch, target = 0
            if (currentWeekNumber > currentPlan.weeks.length) {
                return 0;
            }
            
            // Fallback
            return currentPlan.weeks[0]?.amount || 12;
        } catch (error) {
            console.error("Lỗi khi tính toán mục tiêu hôm nay:", error);
            return 12; // Fallback an toàn nếu có lỗi
        }
    };

    // Tính streak days
    const calculateStreakDays = () => {
        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            const savedData = localStorage.getItem(`checkin_${dateStr}`);
            if (savedData) {
                const data = JSON.parse(savedData);
                if (data.actualCigarettes <= data.targetCigarettes) {
                    streak++;
                } else {
                    break; // Streak bị phá
                }
            } else {
                break; // Không có dữ liệu
            }
        }

        setStreakDays(streak);
    };    // Load dữ liệu cho ngày được chọn
    const loadDataForDate = (dateStr) => {
        const target = calculateTargetForDate(dateStr);
        const savedData = localStorage.getItem(`checkin_${dateStr}`);

        if (savedData) {
            const data = JSON.parse(savedData);
            setTodayData({
                ...data,
                targetCigarettes: target
            });
            setIsSubmitted(true);
        } else {
            setTodayData({
                date: dateStr,
                targetCigarettes: target,
                actualCigarettes: 0,
                notes: ''
            });
            setIsSubmitted(false);
        }

        // Cập nhật current week
        const targetDate = new Date(dateStr);
        const startDate = new Date(currentPlan?.startDate || new Date());
        const daysDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));
        const weekNumber = Math.floor(daysDiff / 7) + 1;
        setCurrentWeek(weekNumber);
    };

    // Xử lý chọn ngày từ calendar
    const handleDateSelect = (dateStr) => {
        setSelectedDate(dateStr);
        loadDataForDate(dateStr);
        setShowCalendar(false);
    };

    // Cập nhật target khi component mount hoặc plan thay đổi
    useEffect(() => {
        if (currentPlan) {
            loadDataForDate(selectedDate);
            calculateStreakDays();
        }
    }, [currentPlan, selectedDate]);// Kiểm tra xem hôm nay đã checkin chưa
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const savedData = localStorage.getItem(`checkin_${today}`);
        if (savedData) {
            const data = JSON.parse(savedData);
            setTodayData(data);
            setIsSubmitted(true);
        }
    }, []); const handleInputChange = (field, value) => {
        setTodayData(prev => ({
            ...prev,
            [field]: value
        }));
    }; const handleSubmit = () => {
        // Lưu dữ liệu vào localStorage
        const today = new Date().toISOString().split('T')[0];
        const isUpdate = localStorage.getItem(`checkin_${today}`) !== null;
        localStorage.setItem(`checkin_${today}`, JSON.stringify(todayData));

        // Cập nhật streak bằng cách tính toán lại từ dữ liệu đã lưu
        // thay vì tăng giá trị hiện tại
        calculateStreakDays();

        setIsSubmitted(true);

        // Callback để cập nhật component cha
        if (onProgressUpdate) {
            onProgressUpdate({
                week: currentWeek,
                amount: todayData.actualCigarettes,
                achieved: todayData.actualCigarettes <= todayData.targetCigarettes
            });
        }

        // Hiển thị thông báo toast thay vì alert
        if (isUpdate) {
            setToast({ 
                show: true, 
                message: '✅ Đã cập nhật thông tin checkin hôm nay!', 
                type: 'success' 
            });
        } else {
            setToast({ 
                show: true, 
                message: '✅ Đã lưu thông tin checkin hôm nay!', 
                type: 'success' 
            });
        }
        
        // Auto hide toast sau 5 giây
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 5000);
    };const handleEdit = () => {
        setIsSubmitted(false);
        // Đảm bảo input field được kích hoạt
        setTimeout(() => {
            const inputField = document.querySelector('.actual-input');
            if (inputField) {
                inputField.disabled = false;
                inputField.focus();
            }
        }, 100);
        
        // Hiển thị toast thông báo thay vì alert
        setToast({ 
            show: true, 
            message: '📝 Bạn có thể cập nhật số điếu thuốc đã hút hôm nay', 
            type: 'info' 
        });
        
        // Auto hide toast sau 4 giây
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 4000);
    };const isTargetAchieved = todayData.actualCigarettes <= todayData.targetCigarettes;    // Hàm đóng toast notification
    const closeToast = () => {
        // Thêm class để animation chạy trước khi ẩn
        const toastElement = document.querySelector('.toast-notification');
        if (toastElement) {
            toastElement.classList.add('toast-exit');
            setTimeout(() => {
                setToast({ ...toast, show: false });
            }, 300); // Đợi animation kết thúc
        } else {
            setToast({ ...toast, show: false });
        }
    };
    
    return (
        <div className="daily-checkin">
            <div className="checkin-header">
                <div className="header-content">
                    <FaCalendarCheck className="header-icon" />                    <div className="header-text">
                        <h2>{isToday ? 'Checkin hôm nay' : 'Checkin ngày đã chọn'}</h2>
                        <p>Ghi nhận tiến trình cai thuốc ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
                        {currentPlan && (
                            <p className="plan-week-info">
                                Tuần {currentWeek} - Mục tiêu: {todayData.targetCigarettes} điếu/ngày
                            </p>
                        )}
                    </div>
                </div>

                <div className="header-actions">
                    {/* Calendar button */}
                    <button
                        className="calendar-button"
                        onClick={() => setShowCalendar(true)}
                        title="Chọn ngày khác"
                    >
                        <FaCalendarAlt />
                    </button>

                    {/* Streak counter */}
                    <div className="streak-badge">
                        <span className="streak-number">{streakDays}</span>
                        <span className="streak-text">ngày liên tiếp</span>
                    </div>
                </div>
            </div>
            
            {/* Toast Notification */}
            {toast.show && (
                <div className={`toast-notification ${toast.type}`}>
                    <span className="toast-message">{toast.message}</span>
                    <button className="toast-close" onClick={closeToast}>&times;</button>
                </div>
            )}

            <div className="checkin-content">
                {/* Target vs Actual */}
                <div className="progress-section">                    <div className="target-card">
                        <h3>Mục tiêu hôm nay</h3>
                        <div className="target-amount">{todayData.targetCigarettes} điếu</div>
                        <p>Tuần {currentWeek} - Kế hoạch của bạn</p>
                        
                        {todayData.weeklyProgress && (
                            <div className="progress-badge">
                                <span>-{todayData.weeklyProgress.reduction} điếu ({todayData.weeklyProgress.percentReduction}%)</span>
                                <p>so với tuần trước</p>
                            </div>
                        )}
                    </div>

                    <div className="vs-divider">VS</div>                    <div className="actual-card">
                        <h3>Thực tế đã hút</h3>
                        <div className="number-input-container">
                            <button 
                                type="button" 
                                className="number-decrement" 
                                onClick={() => !isSubmitted && handleInputChange('actualCigarettes', Math.max(0, todayData.actualCigarettes - 1))}
                                disabled={isSubmitted || todayData.actualCigarettes <= 0}
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={todayData.actualCigarettes}
                                onChange={(e) => handleInputChange('actualCigarettes', parseInt(e.target.value) || 0)}
                                className="actual-input"
                                disabled={isSubmitted}
                                placeholder="0"
                            />
                            <button 
                                type="button" 
                                className="number-increment" 
                                onClick={() => !isSubmitted && handleInputChange('actualCigarettes', Math.min(50, todayData.actualCigarettes + 1))}
                                disabled={isSubmitted || todayData.actualCigarettes >= 50}
                            >
                                +
                            </button>
                        </div>
                        <p className={`result ${isTargetAchieved ? 'success' : 'warning'}`}>
                            {isTargetAchieved ? '✅ Đạt mục tiêu!' : '⚠️ Vượt mục tiêu'}
                        </p>
                    </div></div>                {/* Action Buttons */}
                <div className="checkin-actions">
                    {!isSubmitted ? (
                        <button
                            onClick={handleSubmit}
                            className="submit-btn"
                        >
                            <FaSave className="btn-icon" />
                            {isToday ? 'Lưu checkin hôm nay' : `Lưu checkin ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}`}
                        </button>
                    ) : (
                        <button
                            onClick={handleEdit}
                            className="edit-btn"
                        >
                            <FaSave className="btn-icon" />
                            Cập nhật số điếu hôm nay
                        </button>
                    )}

                    {isSubmitted && (
                        <button
                            onClick={handleEdit}
                            className="edit-btn"
                        >
                            Chỉnh sửa
                        </button>
                    )}
                </div>                {/* Summary Card */}
                {isSubmitted && (
                    <div className="checkin-summary">
                        <h3>Tóm tắt ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}</h3>
                        <div className="summary-grid">
                            <div className="summary-item">
                                <span className="label">Mục tiêu:</span>
                                <span className="value">{todayData.targetCigarettes} điếu</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Thực tế:</span>
                                <span className="value">{todayData.actualCigarettes} điếu</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Kết quả:</span>
                                <span className={`value ${isTargetAchieved ? 'success' : 'warning'}`}>
                                    {isTargetAchieved ? 'Đạt mục tiêu' : 'Chưa đạt'}
                                </span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Tuần:</span>
                                <span className="value">Tuần {currentWeek}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyCheckin;
