// Updated CheckinHistory.jsx with plan_id support
import React, { useState, useEffect } from 'react';
import './CheckinHistory.css';

const CheckinHistory = ({
    selectedPlan,
    progressData,
    loading,
    onCheckinDelete,
    onCheckinUpdate
}) => {
    const [localProgressData, setLocalProgressData] = useState([]);
    const [editingDate, setEditingDate] = useState(null);
    const [editData, setEditData] = useState({});

    // Update local data when progressData changes
    useEffect(() => {
        setLocalProgressData(progressData || []);
    }, [progressData]);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN');
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return 'Không có';
        return timeStr.slice(0, 5); // Format HH:MM
    };

    const handleDeleteClick = async (checkinDate) => {
        if (!selectedPlan?.id) {
            alert('Không có kế hoạch được chọn');
            return;
        }

        console.log('🗑️ Delete checkin request:', {
            planId: selectedPlan.id,
            date: checkinDate
        });

        try {
            await onCheckinDelete(checkinDate);
            console.log('✅ Checkin deleted successfully');
        } catch (error) {
            console.error('❌ Failed to delete checkin:', error);
        }
    };

    const handleEditClick = (checkin) => {
        setEditingDate(checkin.date);
        setEditData({
            urge_intensity: checkin.urge_intensity || 0,
            mood_score: checkin.mood_score || 0,
            stress_level: checkin.stress_level || 0,
            sleep_quality: checkin.sleep_quality || 0,
            exercise_minutes: checkin.exercise_minutes || 0,
            water_glasses: checkin.water_glasses || 0,
            notes: checkin.notes || ''
        });
    };

    const handleSaveEdit = async () => {
        if (!selectedPlan?.id || !editingDate) {
            alert('Không có kế hoạch hoặc ngày được chọn');
            return;
        }

        console.log('💾 Update checkin request:', {
            planId: selectedPlan.id,
            date: editingDate,
            data: editData
        });

        try {
            await onCheckinUpdate(editingDate, editData);
            setEditingDate(null);
            setEditData({});
            console.log('✅ Checkin updated successfully');
        } catch (error) {
            console.error('❌ Failed to update checkin:', error);
        }
    };

    const handleCancelEdit = () => {
        setEditingDate(null);
        setEditData({});
    };

    if (!selectedPlan) {
        return (
            <div className="checkin-history">
                <h3>📋 Lịch sử Checkin</h3>
                <p className="no-plan-message">
                    Vui lòng chọn một kế hoạch để xem lịch sử checkin
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="checkin-history">
                <h3>📋 Lịch sử Checkin - {selectedPlan.name}</h3>
                <p className="loading-message">🔄 Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (!localProgressData || localProgressData.length === 0) {
        return (
            <div className="checkin-history">
                <h3>📋 Lịch sử Checkin - {selectedPlan.name}</h3>
                <p className="empty-message">
                    Chưa có lịch sử checkin nào cho kế hoạch này
                </p>
            </div>
        );
    }

    return (
        <div className="checkin-history">
            <h3>📋 Lịch sử Checkin - {selectedPlan.name}</h3>
            <p className="total-count">Tổng số checkin: {localProgressData.length}</p>

            <div className="checkin-list">
                {localProgressData.map((checkin, index) => (
                    <div key={checkin.id || `${checkin.date}-${index}`} className="checkin-item">
                        {editingDate === checkin.date ? (
                            // Edit mode
                            <div className="checkin-edit">
                                <div className="edit-header">
                                    <h4>✏️ Chỉnh sửa Checkin - {formatDate(checkin.date)}</h4>
                                    <div className="edit-actions">
                                        <button
                                            onClick={handleSaveEdit}
                                            className="save-btn"
                                        >
                                            💾 Lưu
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="cancel-btn"
                                        >
                                            ❌ Hủy
                                        </button>
                                    </div>
                                </div>

                                <div className="edit-fields">
                                    <div className="field-group">
                                        <label>Cường độ thèm (1-10):</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={editData.urge_intensity}
                                            onChange={(e) => setEditData({
                                                ...editData,
                                                urge_intensity: parseInt(e.target.value) || 0
                                            })}
                                        />
                                    </div>

                                    <div className="field-group">
                                        <label>Tâm trạng (1-10):</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={editData.mood_score}
                                            onChange={(e) => setEditData({
                                                ...editData,
                                                mood_score: parseInt(e.target.value) || 0
                                            })}
                                        />
                                    </div>

                                    <div className="field-group">
                                        <label>Mức stress (1-10):</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={editData.stress_level}
                                            onChange={(e) => setEditData({
                                                ...editData,
                                                stress_level: parseInt(e.target.value) || 0
                                            })}
                                        />
                                    </div>

                                    <div className="field-group">
                                        <label>Chất lượng giấc ngủ (1-10):</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={editData.sleep_quality}
                                            onChange={(e) => setEditData({
                                                ...editData,
                                                sleep_quality: parseInt(e.target.value) || 0
                                            })}
                                        />
                                    </div>

                                    <div className="field-group">
                                        <label>Thời gian tập thể dục (phút):</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editData.exercise_minutes}
                                            onChange={(e) => setEditData({
                                                ...editData,
                                                exercise_minutes: parseInt(e.target.value) || 0
                                            })}
                                        />
                                    </div>

                                    <div className="field-group">
                                        <label>Số ly nước:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editData.water_glasses}
                                            onChange={(e) => setEditData({
                                                ...editData,
                                                water_glasses: parseInt(e.target.value) || 0
                                            })}
                                        />
                                    </div>

                                    <div className="field-group">
                                        <label>Ghi chú:</label>
                                        <textarea
                                            value={editData.notes}
                                            onChange={(e) => setEditData({
                                                ...editData,
                                                notes: e.target.value
                                            })}
                                            rows="3"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // View mode
                            <div className="checkin-view">
                                <div className="checkin-header">
                                    <h4>📅 {formatDate(checkin.date)}</h4>
                                    <div className="checkin-actions">
                                        <button
                                            onClick={() => handleEditClick(checkin)}
                                            className="edit-btn"
                                            title="Chỉnh sửa"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(checkin.date)}
                                            className="delete-btn"
                                            title="Xóa"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <div className="checkin-details">
                                    <div className="detail-item">
                                        <span className="label">🎯 Cường độ thèm:</span>
                                        <span className="value">{checkin.urge_intensity || 0}/10</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="label">😊 Tâm trạng:</span>
                                        <span className="value">{checkin.mood_score || 0}/10</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="label">😰 Mức stress:</span>
                                        <span className="value">{checkin.stress_level || 0}/10</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="label">😴 Chất lượng ngủ:</span>
                                        <span className="value">{checkin.sleep_quality || 0}/10</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="label">🏃 Tập thể dục:</span>
                                        <span className="value">{checkin.exercise_minutes || 0} phút</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="label">💧 Nước uống:</span>
                                        <span className="value">{checkin.water_glasses || 0} ly</span>
                                    </div>

                                    {checkin.notes && (
                                        <div className="detail-item notes">
                                            <span className="label">📝 Ghi chú:</span>
                                            <span className="value">{checkin.notes}</span>
                                        </div>
                                    )}

                                    <div className="detail-item timestamp">
                                        <span className="label">⏰ Thời gian tạo:</span>
                                        <span className="value">
                                            {formatDate(checkin.created_at)} {formatTime(checkin.created_time)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CheckinHistory;
