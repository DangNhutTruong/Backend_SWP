import React, { useState, useEffect } from "react";
import "./DailyProgressInput.css";
import apiService from "../utils/apiService";
import { useAuth } from "../context/AuthContext";

const DailyProgressInput = ({ onSubmit, todayTarget = 0 }) => {
  const [actualCigarettes, setActualCigarettes] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userPlans, setUserPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [cravingLevel, setCravingLevel] = useState(5); // Mức độ thèm thuốc (1-10)
  const [status, setStatus] = useState("Neutral"); // Good, Neutral, Struggling
  const { user } = useAuth();

  const today = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString("vi-VN");

  // Lấy danh sách các kế hoạch của người dùng
  useEffect(() => {
    const fetchUserPlans = async () => {
      if (user && user.UserID) {
        try {
          const plans = await apiService.plans.getAll();
          if (plans && plans.data && plans.data.length > 0) {
            setUserPlans(plans.data);
            // Tự động chọn kế hoạch đầu tiên
            setSelectedPlanId(plans.data[0].PlanID);
          }
        } catch (error) {
          console.error("Lỗi khi tải kế hoạch cai thuốc:", error);
        }
      }
    };

    fetchUserPlans();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedPlanId === "") {
      alert("Vui lòng chọn kế hoạch cai thuốc");
      return;
    }

    setIsSubmitting(true);

    // Xác định trạng thái dựa trên số điếu thuốc đã hút
    let calculatedStatus = status;
    if (actualCigarettes !== "") {
      const actual = parseInt(actualCigarettes);
      if (actual <= todayTarget) {
        calculatedStatus = "Good";
      } else if (actual > todayTarget * 1.5) {
        calculatedStatus = "Struggling";
      } else {
        calculatedStatus = "Neutral";
      }
    }

    // Dữ liệu gửi đến API
    const progressData = {
      planId: parseInt(selectedPlanId),
      status: calculatedStatus,
      note: notes.trim(),
      cravingLevel: cravingLevel,
      actualCigarettes: actualCigarettes
        ? parseInt(actualCigarettes)
        : undefined,
    };

    try {
      // Gọi API cập nhật tiến trình
      await apiService.progress.create(progressData);

      // Gọi callback nếu được cung cấp
      if (onSubmit) {
        onSubmit({
          ...progressData,
          date: today,
          timestamp: new Date().toISOString(),
        });
      }

      // Reset form sau khi gửi thành công
      setActualCigarettes("");
      setNotes("");
      setCravingLevel(5);
      setStatus("Neutral");

      alert("Đã cập nhật tiến trình hôm nay thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật tiến trình:", error);
      alert("Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressMessage = () => {
    if (actualCigarettes === "") return "";

    const actual = parseInt(actualCigarettes);
    const target = todayTarget;

    if (actual <= target) {
      return {
        message: `Tuyệt vời! Bạn đã đạt mục tiêu hôm nay! 🎉`,
        type: "success",
      };
    } else {
      return {
        message: `Đừng lo lắng, ngày mai sẽ tốt hơn! Hãy cố gắng nhé! 💪`,
        type: "warning",
      };
    }
  };

  const progressMessage = getProgressMessage();

  return (
    <div className="daily-progress-input">
      <div className="input-header">
        <h3>📊 Cập nhật tiến trình hôm nay</h3>
        <p className="date-display">Ngày: {todayFormatted}</p>
        <p className="target-display">
          Mục tiêu hôm nay: <strong>{todayTarget} điếu</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="progress-form">
        {userPlans.length > 0 ? (
          <div className="form-group">
            <label htmlFor="planSelection">📋 Chọn kế hoạch cai thuốc:</label>
            <select
              id="planSelection"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              required
              className="plan-select"
            >
              <option value="">-- Chọn kế hoạch --</option>
              {userPlans.map((plan) => (
                <option key={plan.PlanID} value={plan.PlanID}>
                  {plan.Title || `Kế hoạch #${plan.PlanID}`}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="no-plans-message">
            <p>Bạn chưa có kế hoạch cai thuốc nào. Hãy tạo kế hoạch trước.</p>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="actualCigarettes">
            🚬 Số điếu thuốc đã hút hôm nay:
          </label>
          <input
            type="number"
            id="actualCigarettes"
            value={actualCigarettes}
            onChange={(e) => setActualCigarettes(e.target.value)}
            min="0"
            max="100"
            placeholder="Nhập số điếu (ví dụ: 5)"
            className="number-input"
          />

          {progressMessage && (
            <div className={`progress-message ${progressMessage.type}`}>
              {progressMessage.message}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="cravingLevel">
            🔥 Mức độ thèm thuốc hôm nay (1-10):
          </label>
          <div className="slider-container">
            <input
              type="range"
              id="cravingLevel"
              value={cravingLevel}
              onChange={(e) => setCravingLevel(parseInt(e.target.value))}
              min="1"
              max="10"
              className="craving-slider"
            />
            <div className="slider-value">{cravingLevel}</div>
          </div>
          <div className="slider-labels">
            <span>Ít</span>
            <span>Nhiều</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="status">😊 Cảm nhận hôm nay:</label>
          <div className="status-options">
            <label
              className={`status-option ${status === "Good" ? "active" : ""}`}
            >
              <input
                type="radio"
                name="status"
                value="Good"
                checked={status === "Good"}
                onChange={() => setStatus("Good")}
              />
              <span>Tốt 😊</span>
            </label>
            <label
              className={`status-option ${
                status === "Neutral" ? "active" : ""
              }`}
            >
              <input
                type="radio"
                name="status"
                value="Neutral"
                checked={status === "Neutral"}
                onChange={() => setStatus("Neutral")}
              />
              <span>Bình thường 😐</span>
            </label>
            <label
              className={`status-option ${
                status === "Struggling" ? "active" : ""
              }`}
            >
              <input
                type="radio"
                name="status"
                value="Struggling"
                checked={status === "Struggling"}
                onChange={() => setStatus("Struggling")}
              />
              <span>Khó khăn 😣</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">📝 Ghi chú (tùy chọn):</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Chia sẻ cảm nghĩ, khó khăn, hoặc thành tựu của bạn hôm nay..."
            rows="3"
            maxLength="500"
            className="notes-textarea"
          />
          <div className="char-count">{notes.length}/500</div>
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={isSubmitting || userPlans.length === 0}
        >
          {isSubmitting ? (
            <>
              <span className="loading-spinner"></span>
              Đang lưu...
            </>
          ) : (
            <>💾 Lưu tiến trình hôm nay</>
          )}
        </button>
      </form>

      <div className="tips-section">
        <h4>💡 Mẹo nhỏ:</h4>
        <ul>
          <li>Hãy trung thực với số liệu để theo dõi tiến trình chính xác</li>
          <li>Nếu vượt mục tiêu, đừng nản chí - ngày mai là cơ hội mới</li>
          <li>
            Ghi chú giúp bạn nhận ra các yếu tố ảnh hưởng đến việc cai thuốc
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DailyProgressInput;
