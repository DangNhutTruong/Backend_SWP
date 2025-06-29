import React, { useState, useEffect } from "react";
import { FaSmile, FaMeh, FaFrown, FaTired, FaEdit } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import apiService from "../utils/apiService";

const MoodTracking = ({ onMoodUpdate }) => {
  const { user } = useAuth(); // Lấy thông tin user từ context
  const [moodData, setMoodData] = useState({
    date: new Date().toISOString().split("T")[0],
    mood: "",
    notes: "",
    challenges: [],
    achievements: [],
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Các lựa chọn tâm trạng
  const moodOptions = [
    {
      id: "easy",
      label: "Rất dễ dàng",
      icon: FaSmile,
      color: "#34a853",
      description: "Không có cảm giác thèm thuốc",
    },
    {
      id: "good",
      label: "Tốt",
      icon: FaSmile,
      color: "#4285f4",
      description: "Thỉnh thoảng nghĩ đến nhưng kiểm soát được",
    },
    {
      id: "challenging",
      label: "Hơi khó",
      icon: FaMeh,
      color: "#ff9800",
      description: "Có lúc muốn hút nhưng đã cưỡng lại",
    },
    {
      id: "difficult",
      label: "Khó khăn",
      icon: FaFrown,
      color: "#f44336",
      description: "Rất muốn hút, phải nỗ lực nhiều",
    },
    {
      id: "very-hard",
      label: "Rất khó",
      icon: FaTired,
      color: "#9c27b0",
      description: "Suýt tái nghiện, cần hỗ trợ",
    },
  ];

  // Các thách thức phổ biến
  const commonChallenges = [
    "Stress công việc",
    "Áp lực xã hội",
    "Sau bữa ăn",
    "Uống cà phê",
    "Gặp người hút thuốc",
    "Buồn chán",
    "Mệt mỏi",
    "Khác",
  ];

  // Các thành tựu hàng ngày
  const dailyAchievements = [
    "Từ chối lời mời hút thuốc",
    "Tập thể dục thay vì hút thuốc",
    "Uống nước thay vì hút thuốc",
    "Ăn kẹo/nhai kẹo cao su",
    "Hít thở sâu khi căng thẳng",
    "Tìm hoạt động thay thế",
    "Chia sẻ với người thân",
    "Đọc sách/nghe nhạc",
  ];

  // Kiểm tra xem hôm nay đã update mood chưa - sử dụng API
  useEffect(() => {
    if (!user || !user.UserID) return;

    const today = new Date().toISOString().split("T")[0];
    setIsLoading(true);
    setError(null);

    apiService.mood
      .getByDate(user.UserID, today)
      .then((response) => {
        if (response.success && response.data) {
          setMoodData(response.data);
          setIsSubmitted(true);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading mood data:", err);
        setError("Không thể tải dữ liệu tâm trạng");
        setIsLoading(false);

        // Fallback to localStorage
        const savedData = localStorage.getItem(`mood_${today}`);
        if (savedData) {
          try {
            const data = JSON.parse(savedData);
            setMoodData(data);
            setIsSubmitted(true);
          } catch (parseError) {
            console.error(
              "Error parsing mood data from localStorage:",
              parseError
            );
          }
        }
      });
  }, [user]);

  const handleInputChange = (field, value) => {
    setMoodData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChallengeToggle = (challenge) => {
    setMoodData((prev) => ({
      ...prev,
      challenges: prev.challenges.includes(challenge)
        ? prev.challenges.filter((c) => c !== challenge)
        : [...prev.challenges, challenge],
    }));
  };

  const handleAchievementToggle = (achievement) => {
    setMoodData((prev) => ({
      ...prev,
      achievements: prev.achievements.includes(achievement)
        ? prev.achievements.filter((a) => a !== achievement)
        : [...prev.achievements, achievement],
    }));
  };

  const handleSubmit = () => {
    if (!user || !user.UserID) {
      alert("Bạn cần đăng nhập để lưu thông tin tâm trạng");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Chuẩn bị dữ liệu để gửi lên API
    const moodDataToSubmit = {
      ...moodData,
      userId: user.UserID,
      date: moodData.date || new Date().toISOString().split("T")[0],
    };

    // Gọi API để lưu mood
    apiService.mood
      .save(moodDataToSubmit)
      .then((response) => {
        if (response.success) {
          setIsSubmitted(true);

          // Fallback: Lưu dữ liệu vào localStorage
          try {
            localStorage.setItem(
              `mood_${moodDataToSubmit.date}`,
              JSON.stringify(moodDataToSubmit)
            );
          } catch (storageError) {
            console.error("Error saving mood to localStorage:", storageError);
          }

          // Callback để cập nhật component cha
          if (onMoodUpdate) {
            onMoodUpdate(moodDataToSubmit);
          }

          // Hiển thị thông báo thành công
          alert("✅ Đã lưu thông tin tâm trạng hôm nay!");
        } else {
          setError("Có lỗi khi lưu dữ liệu tâm trạng");
          alert("❌ Lỗi: " + (response.message || "Không thể lưu dữ liệu"));
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error saving mood data:", err);
        setError("Không thể lưu dữ liệu tâm trạng");
        setIsLoading(false);

        // Fallback: Lưu vào localStorage nếu API lỗi
        try {
          localStorage.setItem(
            `mood_${moodDataToSubmit.date}`,
            JSON.stringify(moodDataToSubmit)
          );

          // Callback để cập nhật component cha
          if (onMoodUpdate) {
            onMoodUpdate(moodDataToSubmit);
          }

          setIsSubmitted(true);
          alert(
            "⚠️ Đã lưu tạm tâm trạng hôm nay! (dữ liệu sẽ được đồng bộ khi kết nối được với server)"
          );
        } catch (storageError) {
          console.error("Error saving mood to localStorage:", storageError);
          alert("❌ Lỗi: Không thể lưu dữ liệu tâm trạng");
        }
      });
  };

  const handleEdit = () => {
    setIsSubmitted(false);
  };

  const selectedMood = moodOptions.find((m) => m.id === moodData.mood);

  if (isLoading) {
    return (
      <div className="mood-tracking-container loading">
        <h3>Đang tải dữ liệu tâm trạng...</h3>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error && !isSubmitted) {
    return (
      <div className="mood-tracking-container error">
        <h3>Đã xảy ra lỗi</h3>
        <p>{error}</p>
        <button
          className="primary-button"
          onClick={() => {
            setError(null);
            const today = new Date().toISOString().split("T")[0];
            const savedData = localStorage.getItem(`mood_${today}`);
            if (savedData) {
              try {
                setMoodData(JSON.parse(savedData));
              } catch (error) {
                console.error("Error parsing saved mood data", error);
              }
            }
          }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="mood-tracking-container">
      <h3>Theo dõi tâm trạng hôm nay</h3>

      {isSubmitted ? (
        <div className="mood-submitted">
          <h4>
            Tâm trạng đã ghi nhận ngày{" "}
            {new Date(moodData.date).toLocaleDateString("vi-VN")}
          </h4>

          <div className="mood-summary">
            <div className="mood-item selected">
              {moodOptions.find((option) => option.id === moodData.mood) ? (
                <>
                  {React.createElement(
                    moodOptions.find((option) => option.id === moodData.mood)
                      .icon,
                    {
                      size: 24,
                      color: moodOptions.find(
                        (option) => option.id === moodData.mood
                      ).color,
                    }
                  )}
                  <span>
                    {
                      moodOptions.find((option) => option.id === moodData.mood)
                        .label
                    }
                  </span>
                </>
              ) : (
                <span>Chưa chọn tâm trạng</span>
              )}
            </div>
          </div>

          {moodData.notes && (
            <div className="mood-notes">
              <h5>Ghi chú:</h5>
              <p>{moodData.notes}</p>
            </div>
          )}

          {moodData.challenges && moodData.challenges.length > 0 && (
            <div className="mood-challenges">
              <h5>Thách thức gặp phải:</h5>
              <ul>
                {moodData.challenges.map((challenge, index) => (
                  <li key={index}>{challenge}</li>
                ))}
              </ul>
            </div>
          )}

          {moodData.achievements && moodData.achievements.length > 0 && (
            <div className="mood-achievements">
              <h5>Thành tựu đạt được:</h5>
              <ul>
                {moodData.achievements.map((achievement, index) => (
                  <li key={index}>{achievement}</li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={handleEdit} className="secondary-button">
            <FaEdit /> Chỉnh sửa
          </button>
        </div>
      ) : (
        // Form để nhập tâm trạng
        <div className="mood-form">
          <div className="form-group">
            <label>Hôm nay bạn cảm thấy thế nào về quá trình cai thuốc?</label>
            <div className="mood-options">
              {moodOptions.map((option) => (
                <div
                  key={option.id}
                  className={`mood-item ${
                    moodData.mood === option.id ? "selected" : ""
                  }`}
                  onClick={() => handleInputChange("mood", option.id)}
                >
                  {React.createElement(option.icon, {
                    size: 24,
                    color: option.color,
                  })}
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Ghi chú (tuỳ chọn):</label>
            <textarea
              value={moodData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Chia sẻ thêm về cảm xúc của bạn hôm nay..."
            />
          </div>

          <div className="form-group">
            <label>
              Bạn đối mặt với thách thức nào hôm nay? (chọn tất cả nếu có)
            </label>
            <div className="challenge-options">
              {commonChallenges.map((challenge, index) => (
                <div
                  key={index}
                  className={`challenge-item ${
                    moodData.challenges.includes(challenge) ? "selected" : ""
                  }`}
                  onClick={() => handleChallengeToggle(challenge)}
                >
                  <span>{challenge}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Thành tựu hôm nay (chọn tất cả nếu có):</label>
            <div className="achievement-options">
              {dailyAchievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`achievement-item ${
                    moodData.achievements.includes(achievement)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handleAchievementToggle(achievement)}
                >
                  <span>{achievement}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="primary-button"
            disabled={!moodData.mood || isLoading}
          >
            {isLoading ? "Đang lưu..." : "Lưu thông tin"}
          </button>
        </div>
      )}
    </div>
  );
};

export default MoodTracking;
