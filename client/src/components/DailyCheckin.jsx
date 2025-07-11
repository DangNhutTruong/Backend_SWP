import React, { useState, useEffect, useCallback } from "react";
import { FaCalendarCheck, FaSave, FaSpinner } from "react-icons/fa";
import {
  createCheckin,
  updateCheckin,
  getProgressByDate,
  createCheckinData,
} from "../services/progressService";

const DailyCheckin = ({ onProgressUpdate, currentPlan }) => {
  const [todayData, setTodayData] = useState({
    date: new Date().toISOString().split("T")[0],
    targetCigarettes: 12, // Sẽ được tính từ kế hoạch
    actualCigarettes: 0,
    notes: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1); // Tuần hiện tại
  const [streakDays, setStreakDays] = useState(0); // Số ngày liên tiếp đạt mục tiêu
  const [activePlanId, setActivePlanId] = useState(null); // ID của kế hoạch active
  const [isLoading, setIsLoading] = useState(false); // Loading state cho API calls
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  }); // Thông báo dạng toast    // Tính target cigarettes dựa trên kế hoạch và ngày hiện tại
  const calculateTodayTarget = useCallback(() => {
    // Kiểm tra kỹ các trường hợp null/undefined
    if (!currentPlan) return 12;
    if (
      !currentPlan.weeks ||
      !Array.isArray(currentPlan.weeks) ||
      currentPlan.weeks.length === 0
    )
      return 12;
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
      const currentWeekPlan = currentPlan.weeks.find(
        (w) => w.week === currentWeekNumber
      );
      if (currentWeekPlan) {
        // Lấy target của tuần trước nếu có
        const prevWeekPlan = currentPlan.weeks.find(
          (w) => w.week === currentWeekNumber - 1
        );
        if (prevWeekPlan && prevWeekPlan.amount > currentWeekPlan.amount) {
          const reduction = prevWeekPlan.amount - currentWeekPlan.amount;
          const percentReduction = Math.round(
            (reduction / prevWeekPlan.amount) * 100
          );

          // Lưu thông tin tiến độ so với tuần trước
          setTodayData((prev) => ({
            ...prev,
            weeklyProgress: {
              reduction,
              percentReduction,
              prevAmount: prevWeekPlan.amount,
            },
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
  }, [currentPlan]);

  // Tính streak days
  const calculateStreakDays = () => {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

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
  };

  // Cập nhật target khi component mount hoặc plan thay đổi
  // Load data từ backend khi component mount
  useEffect(() => {
    const loadTodayData = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];

        // Tìm planId từ currentPlan hoặc localStorage
        let planId = currentPlan?.id || activePlanId;
        if (!planId) {
          // Thử lấy từ localStorage
          const savedPlan = localStorage.getItem("activePlan");
          if (savedPlan) {
            const parsedPlan = JSON.parse(savedPlan);
            planId = parsedPlan.id;
            setActivePlanId(planId);
          }
        }

        if (planId) {
          // Kiểm tra xem đã có checkin hôm nay chưa
          const existingCheckin = await getProgressByDate(today);
          if (existingCheckin && existingCheckin.length > 0) {
            const todayCheckin = existingCheckin[0];
            setTodayData((prev) => ({
              ...prev,
              actualCigarettes: todayCheckin.cigarettes_smoked || 0,
              notes: todayCheckin.note || "",
            }));
            setIsSubmitted(true);
          }
        }
      } catch (error) {
        console.error("Error loading today data:", error);
        // Fallback to localStorage
        const today = new Date().toISOString().split("T")[0];
        const savedData = localStorage.getItem(`checkin_${today}`);
        if (savedData) {
          const data = JSON.parse(savedData);
          setTodayData(data);
          setIsSubmitted(true);
        }
      }
    };

    loadTodayData();
  }, [currentPlan, activePlanId]);

  useEffect(() => {
    const target = calculateTodayTarget();
    setTodayData((prev) => ({
      ...prev,
      targetCigarettes: target,
    }));
    calculateStreakDays();
  }, [currentPlan, calculateTodayTarget]);

  const handleInputChange = (field, value) => {
    setTodayData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      // Tìm planId
      let planId = currentPlan?.id || activePlanId;
      if (!planId) {
        const savedPlan = localStorage.getItem("activePlan");
        if (savedPlan) {
          const parsedPlan = JSON.parse(savedPlan);
          planId = parsedPlan.id;
          setActivePlanId(planId);
        }
      }

      if (!planId) {
        throw new Error("Không tìm thấy kế hoạch cai thuốc active");
      }

      // Tạo dữ liệu checkin
      const checkinData = createCheckinData(
        planId,
        today,
        todayData.actualCigarettes,
        todayData.targetCigarettes,
        todayData.actualCigarettes <= todayData.targetCigarettes
          ? "good"
          : "bad",
        todayData.notes
      );

      // Kiểm tra xem đã có checkin hôm nay chưa
      const existingCheckin = await getProgressByDate(today);

      if (existingCheckin && existingCheckin.length > 0) {
        // Cập nhật checkin hiện tại
        await updateCheckin(today, checkinData);
      } else {
        // Tạo checkin mới
        await createCheckin(checkinData);
      }

      // Lưu vào localStorage để backup
      localStorage.setItem(`checkin_${today}`, JSON.stringify(todayData));

      setIsSubmitted(true);
      calculateStreakDays();

      // Callback để cập nhật component cha
      if (onProgressUpdate) {
        onProgressUpdate({
          week: currentWeek,
          amount: todayData.actualCigarettes,
          achieved: todayData.actualCigarettes <= todayData.targetCigarettes,
        });
      }

      // Hiển thị thông báo thành công
      setToast({
        show: true,
        message: "✅ Đã lưu thông tin checkin hôm nay!",
        type: "success",
      });

      // Auto hide toast sau 5 giây
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 5000);
    } catch (error) {
      console.error("Error saving checkin:", error);

      // Fallback: Lưu vào localStorage
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem(`checkin_${today}`, JSON.stringify(todayData));
      setIsSubmitted(true);

      setToast({
        show: true,
        message: "⚠️ Đã lưu offline. Sẽ đồng bộ khi có kết nối mạng.",
        type: "warning",
      });

      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsSubmitted(false);
    // Đảm bảo input field được kích hoạt
    setTimeout(() => {
      const inputField = document.querySelector(".actual-input");
      if (inputField) {
        inputField.disabled = false;
        inputField.focus();
      }
    }, 100);

    // Hiển thị toast thông báo thay vì alert
    setToast({
      show: true,
      message: "📝 Bạn có thể cập nhật số điếu thuốc đã hút hôm nay",
      type: "info",
    });

    // Auto hide toast sau 4 giây
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };
  const isTargetAchieved =
    todayData.actualCigarettes <= todayData.targetCigarettes; // Hàm đóng toast notification
  const closeToast = () => {
    // Thêm class để animation chạy trước khi ẩn
    const toastElement = document.querySelector(".toast-notification");
    if (toastElement) {
      toastElement.classList.add("toast-exit");
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
        {" "}
        <div className="header-content">
          <div className="header-icon">
            <FaCalendarCheck />
          </div>
          <div className="header-text">
            <h2>Ghi nhận hôm nay</h2>
            <p>
              Ghi nhận tiến trình cai thuốc ngày{" "}
              {new Date().toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>
        {/* Streak counter */}{" "}
        <div className="streak-badge">
          <span className="streak-number">{streakDays}</span>
          <span className="streak-text">ngày liên tiếp</span>
        </div>
      </div>

      <div className="checkin-separator"></div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={closeToast}>
            &times;
          </button>
        </div>
      )}

      <div className="checkin-content">
        {/* Target vs Actual */}
        <div className="progress-section">
          {" "}
          <div className="target-card">
            <h3>Mục tiêu hôm nay</h3>
            <div className="target-amount">
              {todayData.targetCigarettes} điếu
            </div>
            <p>Tuần {currentWeek} - Kế hoạch của bạn</p>

            {todayData.weeklyProgress && (
              <div className="progress-badge">
                <span>
                  -{todayData.weeklyProgress.reduction} điếu (
                  {todayData.weeklyProgress.percentReduction}%)
                </span>
                <p>so với tuần trước</p>
              </div>
            )}
          </div>
          <div className="vs-divider">VS</div>{" "}
          <div className="actual-card">
            <h3>Thực tế đã hút</h3>
            <div className="number-input-container">
              <button
                type="button"
                className="number-decrement"
                onClick={() =>
                  !isSubmitted &&
                  handleInputChange(
                    "actualCigarettes",
                    Math.max(0, todayData.actualCigarettes - 1)
                  )
                }
                disabled={isSubmitted || todayData.actualCigarettes <= 0}
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="50"
                value={todayData.actualCigarettes}
                onChange={(e) =>
                  handleInputChange(
                    "actualCigarettes",
                    parseInt(e.target.value) || 0
                  )
                }
                className="actual-input"
                disabled={isSubmitted}
                placeholder="0"
              />
              <button
                type="button"
                className="number-increment"
                onClick={() =>
                  !isSubmitted &&
                  handleInputChange(
                    "actualCigarettes",
                    Math.min(50, todayData.actualCigarettes + 1)
                  )
                }
                disabled={isSubmitted || todayData.actualCigarettes >= 50}
              >
                +
              </button>
            </div>
            <p className={`result ${isTargetAchieved ? "success" : "warning"}`}>
              {isTargetAchieved ? "✅ Đạt mục tiêu!" : "⚠️ Vượt mục tiêu"}
            </p>
          </div>
        </div>{" "}
        {/* Action Buttons */}
        <div className="checkin-actions">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="btn-icon spinning" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <FaSave className="btn-icon" />
                  Lưu checkin hôm nay
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleEdit}
              className="edit-btn"
              disabled={isLoading}
            >
              <FaSave className="btn-icon" />
              Cập nhật số điếu hôm nay
            </button>
          )}
        </div>
        {/* Summary Card đã được xóa vì dư thừa */}
      </div>
    </div>
  );
};

export default DailyCheckin;
