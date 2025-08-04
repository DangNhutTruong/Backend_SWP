// Updated DailyCheckin.jsx with plan_id support
import React, { useState, useEffect } from 'react';

const DailyCheckin = ({ selectedPlan, onCheckinCreate }) => {
    const [checkinData, setCheckinData] = useState({
        date: new Date().toISOString().split('T')[0], // Today's date
        urge_intensity: 1,
        mood_score: 5,
        stress_level: 1,
        sleep_quality: 5,
        exercise_minutes: 0,
        water_glasses: 0,
        notes: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // Reset form when plan changes
    useEffect(() => {
        setValidationErrors({});
    }, [selectedPlan]);

    const validateForm = () => {
        const errors = {};

        if (!checkinData.date) {
            errors.date = 'Vui lòng chọn ngày';
        }

        if (checkinData.urge_intensity < 1 || checkinData.urge_intensity > 10) {
            errors.urge_intensity = 'Cường độ thèm phải từ 1-10';
        }

        if (checkinData.mood_score < 1 || checkinData.mood_score > 10) {
            errors.mood_score = 'Điểm tâm trạng phải từ 1-10';
        }

        if (checkinData.stress_level < 1 || checkinData.stress_level > 10) {
            errors.stress_level = 'Mức stress phải từ 1-10';
        }

        if (checkinData.sleep_quality < 1 || checkinData.sleep_quality > 10) {
            errors.sleep_quality = 'Chất lượng ngủ phải từ 1-10';
        }

        if (checkinData.exercise_minutes < 0) {
            errors.exercise_minutes = 'Thời gian tập không thể âm';
        }

        if (checkinData.water_glasses < 0) {
            errors.water_glasses = 'Số ly nước không thể âm';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field, value) => {
        setCheckinData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear validation error for this field
        if (validationErrors[field]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedPlan?.id) {
            alert('⚠️ Vui lòng chọn một kế hoạch trước khi checkin');
            return;
        }

        if (!validateForm()) {
            alert('❌ Vui lòng kiểm tra lại thông tin nhập');
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('🎯 Creating checkin:', {
                planId: selectedPlan.id,
                data: checkinData
            });

            await onCheckinCreate(checkinData);

            // Reset form after successful submission
            setCheckinData({
                date: new Date().toISOString().split('T')[0],
                urge_intensity: 1,
                mood_score: 5,
                stress_level: 1,
                sleep_quality: 5,
                exercise_minutes: 0,
                water_glasses: 0,
                notes: ''
            });

            console.log('✅ Checkin created successfully');

        } catch (error) {
            console.error('❌ Failed to create checkin:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!selectedPlan) {
        return (
            <div className="daily-checkin">
                <h3>📝 Checkin hằng ngày</h3>
                <div className="no-plan-message">
                    <p>⚠️ Vui lòng chọn một kế hoạch để thực hiện checkin</p>
                </div>
            </div>
        );
    }

    return (
        <div className="daily-checkin">
            <h3>📝 Checkin hằng ngày - {selectedPlan.name}</h3>

            <form onSubmit={handleSubmit} className="checkin-form">
                <div className="form-group">
                    <label htmlFor="date">📅 Ngày:</label>
                    <input
                        type="date"
                        id="date"
                        value={checkinData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        disabled={isSubmitting}
                        className={validationErrors.date ? 'error' : ''}
                    />
                    {validationErrors.date && (
                        <span className="error-message">{validationErrors.date}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="urge_intensity">
                        🎯 Cường độ thèm thuốc (1-10):
                        <span className="current-value">{checkinData.urge_intensity}</span>
                    </label>
                    <input
                        type="range"
                        id="urge_intensity"
                        min="1"
                        max="10"
                        value={checkinData.urge_intensity}
                        onChange={(e) => handleInputChange('urge_intensity', parseInt(e.target.value))}
                        disabled={isSubmitting}
                        className={validationErrors.urge_intensity ? 'error' : ''}
                    />
                    <div className="range-labels">
                        <span>Không thèm</span>
                        <span>Rất thèm</span>
                    </div>
                    {validationErrors.urge_intensity && (
                        <span className="error-message">{validationErrors.urge_intensity}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="mood_score">
                        😊 Tâm trạng (1-10):
                        <span className="current-value">{checkinData.mood_score}</span>
                    </label>
                    <input
                        type="range"
                        id="mood_score"
                        min="1"
                        max="10"
                        value={checkinData.mood_score}
                        onChange={(e) => handleInputChange('mood_score', parseInt(e.target.value))}
                        disabled={isSubmitting}
                        className={validationErrors.mood_score ? 'error' : ''}
                    />
                    <div className="range-labels">
                        <span>Rất tệ</span>
                        <span>Rất tốt</span>
                    </div>
                    {validationErrors.mood_score && (
                        <span className="error-message">{validationErrors.mood_score}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="stress_level">
                        😰 Mức độ stress (1-10):
                        <span className="current-value">{checkinData.stress_level}</span>
                    </label>
                    <input
                        type="range"
                        id="stress_level"
                        min="1"
                        max="10"
                        value={checkinData.stress_level}
                        onChange={(e) => handleInputChange('stress_level', parseInt(e.target.value))}
                        disabled={isSubmitting}
                        className={validationErrors.stress_level ? 'error' : ''}
                    />
                    <div className="range-labels">
                        <span>Không stress</span>
                        <span>Rất stress</span>
                    </div>
                    {validationErrors.stress_level && (
                        <span className="error-message">{validationErrors.stress_level}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="sleep_quality">
                        😴 Chất lượng giấc ngủ (1-10):
                        <span className="current-value">{checkinData.sleep_quality}</span>
                    </label>
                    <input
                        type="range"
                        id="sleep_quality"
                        min="1"
                        max="10"
                        value={checkinData.sleep_quality}
                        onChange={(e) => handleInputChange('sleep_quality', parseInt(e.target.value))}
                        disabled={isSubmitting}
                        className={validationErrors.sleep_quality ? 'error' : ''}
                    />
                    <div className="range-labels">
                        <span>Rất tệ</span>
                        <span>Rất tốt</span>
                    </div>
                    {validationErrors.sleep_quality && (
                        <span className="error-message">{validationErrors.sleep_quality}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="exercise_minutes">🏃 Thời gian tập thể dục (phút):</label>
                    <input
                        type="number"
                        id="exercise_minutes"
                        min="0"
                        value={checkinData.exercise_minutes}
                        onChange={(e) => handleInputChange('exercise_minutes', parseInt(e.target.value) || 0)}
                        disabled={isSubmitting}
                        className={validationErrors.exercise_minutes ? 'error' : ''}
                    />
                    {validationErrors.exercise_minutes && (
                        <span className="error-message">{validationErrors.exercise_minutes}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="water_glasses">💧 Số ly nước đã uống:</label>
                    <input
                        type="number"
                        id="water_glasses"
                        min="0"
                        value={checkinData.water_glasses}
                        onChange={(e) => handleInputChange('water_glasses', parseInt(e.target.value) || 0)}
                        disabled={isSubmitting}
                        className={validationErrors.water_glasses ? 'error' : ''}
                    />
                    {validationErrors.water_glasses && (
                        <span className="error-message">{validationErrors.water_glasses}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="notes">📝 Ghi chú (tùy chọn):</label>
                    <textarea
                        id="notes"
                        value={checkinData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        disabled={isSubmitting}
                        rows="3"
                        placeholder="Viết ghi chú về cảm giác, thách thức, thành tựu của bạn hôm nay..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || !selectedPlan}
                    className="submit-btn"
                >
                    {isSubmitting ? '🔄 Đang lưu...' : '✅ Lưu Checkin'}
                </button>
            </form>

            <div className="plan-info">
                <p><strong>📋 Kế hoạch hiện tại:</strong> {selectedPlan.name}</p>
                {selectedPlan.description && (
                    <p><strong>📄 Mô tả:</strong> {selectedPlan.description}</p>
                )}
            </div>
        </div>
    );
};

export default DailyCheckin;
