import React, { useState, useEffect } from "react";
import {
  FaUserAlt,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaTransgender,
  FaCalendarAlt,
  FaLock,
  FaEdit,
  FaSave,
  FaTimes,
  FaCrown,
  FaImage,
  FaCheckCircle,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "../styles/User.css";
import "../styles/DatePicker.css";
import apiService from "../services/apiService";

const UserProfile = ({ isStandalone = false }) => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    if (user) {
      setUserData({ ...user });

      if (user.date_of_birth) {
        try {
          const date = new Date(user.date_of_birth);
          if (!isNaN(date.getTime())) {
            setSelectedDay(date.getDate().toString());
            setSelectedMonth((date.getMonth() + 1).toString());
            setSelectedYear(date.getFullYear().toString());
          }
        } catch (error) {
          console.error("Lỗi khi parse ngày sinh:", error);
        }
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (type, value) => {
    if (type === "day") {
      setSelectedDay(value);
    } else if (type === "month") {
      setSelectedMonth(value);
    } else if (type === "year") {
      setSelectedYear(value);
    }

    if (
      (selectedDay && selectedMonth && selectedYear) ||
      (type === "day" && value && selectedMonth && selectedYear) ||
      (type === "month" && selectedDay && value && selectedYear) ||
      (type === "year" && selectedDay && selectedMonth && value)
    ) {
      const day = type === "day" ? value : selectedDay;
      const month = type === "month" ? value : selectedMonth;
      const year = type === "year" ? value : selectedYear;

      const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;

      setUserData((prev) => ({
        ...prev,
        date_of_birth: formattedDate,
      }));
    }
  };

  const isValidDate = (day, month, year) => {
    if (!day || !month || !year) return true;

    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    const isLeapYear = (year) => {
      return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    };

    const daysInMonth = [
      0,
      31,
      isLeapYear(y) ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];

    return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth[m];
  };

  const generateDays = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(
        <option key={i} value={i.toString()}>
          {i}
        </option>
      );
    }
    return days;
  };

  const generateMonths = () => {
    const months = [];
    const monthNames = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ];

    for (let i = 1; i <= 12; i++) {
      months.push(
        <option key={i} value={i.toString()}>
          {monthNames[i - 1]}
        </option>
      );
    }
    return months;
  };

  const generateYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();

    for (let i = currentYear; i >= 1925; i--) {
      years.push(
        <option key={i} value={i.toString()}>
          {i}
        </option>
      );
    }
    return years;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "Chưa cập nhật";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Định dạng không hợp lệ";

      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Lỗi khi format ngày:", error);
      return "Định dạng không hợp lệ";
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserData((prev) => ({
          ...prev,
          avatar: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleEditMode = () => {
    if (isEditing) {
      setUserData({ ...user });

      if (user.date_of_birth) {
        try {
          const date = new Date(user.date_of_birth);
          setSelectedDay(date.getDate().toString());
          setSelectedMonth((date.getMonth() + 1).toString());
          setSelectedYear(date.getFullYear().toString());
        } catch (error) {
          setSelectedDay("");
          setSelectedMonth("");
          setSelectedYear("");
        }
      } else {
        setSelectedDay("");
        setSelectedMonth("");
        setSelectedYear("");
      }
    }
    setIsEditing(!isEditing);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const saveChanges = async () => {
    try {
      if (selectedDay && selectedMonth && selectedYear) {
        if (!isValidDate(selectedDay, selectedMonth, selectedYear)) {
          setErrorMessage("Ngày tháng không hợp lệ. Vui lòng kiểm tra lại.");
          return;
        }
      }

      const dataToUpdate = { ...userData };
      console.log("Dữ liệu gửi đi:", dataToUpdate);

      const result = await updateUser(dataToUpdate);
      console.log("Kết quả từ updateUser:", result);

      if (result && result.success) {
        // Cập nhật userData với dữ liệu mới từ result
        if (result.user) {
          setUserData({ ...result.user });
        }

        setSuccessMessage("Thông tin đã được cập nhật thành công.");
        setIsEditing(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        throw new Error(result.error || "Lỗi khi cập nhật dữ liệu");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      setErrorMessage(`Có lỗi xảy ra: ${error.message}`);
    }
  };

  if (!user) {
    return <div className="loading-container">Đang tải...</div>;
  }

  return (
    <div className="user-profile-container">
      <div className="user-profile-header">
        <h1>Thông tin cá nhân</h1>
        {!isEditing ? (
          <button className="edit-button" onClick={toggleEditMode}>
            <FaEdit /> Chỉnh sửa
          </button>
        ) : (
          <div className="editing-buttons">
            <button className="save-button" onClick={saveChanges}>
              <FaSave /> Lưu
            </button>
            <button className="cancel-button" onClick={toggleEditMode}>
              <FaTimes /> Hủy
            </button>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="success-message">
          <FaCheckCircle /> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="error-message">
          <FaTimes /> {errorMessage}
        </div>
      )}

      <div className="avatar-info-layout">
        <div className="avatar-section">
          <div className="avatar-container">
            {userData.avatar ? (
              <img
                src={userData.avatar}
                alt="Ảnh đại diện"
                className="user-avatar"
              />
            ) : (
              <div className="user-avatar-placeholder">
                <FaUserAlt />
              </div>
            )}
            {isEditing && (
              <div className="avatar-edit">
                <label htmlFor="avatar-input" className="avatar-edit-button">
                  <FaImage />
                </label>
                <input
                  type="file"
                  id="avatar-input"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </div>
            )}

            <div className="user-id">
              ID: {userData._id || userData.id || "N/A"}
            </div>

            {userData.membershipType && userData.membershipType !== "free" && (
              <div className={`membership-badge ${userData.membershipType}`}>
                <FaCrown />{" "}
                {userData.membershipType === "premium" ? "Premium" : "Pro"}
              </div>
            )}
          </div>
        </div>
        <div className="info-section">
          <div className="profile-section basic-info">
            <h2>Thông tin cơ bản</h2>

            {/* Tên người dùng - chỉ đọc */}
            <div className="info-field">
              <label>
                <FaUserAlt /> Tên người dùng
              </label>
              <p className="username-display">
                {userData.username || "Chưa có"}
              </p>
            </div>

            {/* Tên hiển thị - có thể chỉnh sửa */}
            <div className="info-field">
              <label>
                <FaUserAlt /> Tên hiển thị
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={userData.name || ""}
                  onChange={handleChange}
                  placeholder="Nhập tên hiển thị của bạn"
                />
              ) : (
                <p>{userData.name || "Chưa cập nhật"}</p>
              )}
            </div>

            <div className="info-field">
              <label>
                <FaCalendarAlt /> Ngày sinh
              </label>
              {isEditing ? (
                <div className="date-picker-container">
                  <select
                    value={selectedDay}
                    onChange={(e) => handleDateChange("day", e.target.value)}
                    className="date-select day-select"
                  >
                    <option value="">Ngày</option>
                    {generateDays()}
                  </select>

                  <select
                    value={selectedMonth}
                    onChange={(e) => handleDateChange("month", e.target.value)}
                    className="date-select month-select"
                  >
                    <option value="">Tháng</option>
                    {generateMonths()}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => handleDateChange("year", e.target.value)}
                    className="date-select year-select"
                  >
                    <option value="">Năm</option>
                    {generateYears()}
                  </select>
                </div>
              ) : (
                <p>
                  {userData.date_of_birth
                    ? formatDateForDisplay(userData.date_of_birth)
                    : "Chưa cập nhật"}
                </p>
              )}
            </div>

            <div className="info-field">
              <label>
                <FaTransgender /> Giới tính
              </label>
              {isEditing ? (
                <select 
                  name="gender" 
                  value={userData.gender || ""} 
                  onChange={handleChange}
                >
                  <option value="">-- Chọn giới tính --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              ) : (
                <p>
                  {userData.gender === "male"
                    ? "Nam"
                    : userData.gender === "female"
                    ? "Nữ"
                    : userData.gender === "other"
                    ? "Khác"
                    : "Chưa cập nhật"}
                </p>
              )}
            </div>
          </div>

          <div className="profile-section contact-section">
            <h2>Thông tin liên hệ</h2>
            
            <div className="info-field">
              <label>
                <FaMapMarkerAlt /> Địa chỉ
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={userData.address || ""}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ"
                />
              ) : (
                <p>{userData.address || "Chưa cập nhật"}</p>
              )}
            </div>
            
            <div className="info-field">
              <label>
                <FaEnvelope /> Email
              </label>
              <p>
                <strong>{userData.email}</strong>
              </p>
              <small className="field-note">Email không thể thay đổi</small>
            </div>

            <div className="info-field">
              <label>
                <FaPhone /> Số điện thoại
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone || ""}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                />
              ) : (
                <p>{userData.phone || "Chưa cập nhật"}</p>
              )}
            </div>
          </div>

          <div className="profile-section security-section">
            <h2>Bảo mật</h2>
            
            <div className="info-field">
              <label>
                <FaLock /> Mật khẩu
              </label>
              {isEditing ? (
                <input
                  type="password"
                  name="password"
                  value={userData.password || ""}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu mới"
                />
              ) : (
                <p className="censored-field">••••••••</p>
              )}
            </div>
          </div>
          <div className="profile-section quit-reason-section">
            <h2>Lý do cai thuốc</h2>
            
            <div className="info-field quit-reason-field">
              {isEditing ? (
                <textarea
                  name="quitReason"
                  value={userData.quitReason || ""}
                  onChange={handleChange}
                  placeholder="Nhập lý do bạn muốn cai thuốc lá"
                  rows={3}
                />
              ) : (
                <p className="quit-reason-text">
                  {userData.quitReason || "Chưa cập nhật"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
