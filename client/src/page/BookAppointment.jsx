import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RequireMembership from "../components/RequireMembership";
import "./BookAppointment.css";

// Mock data for coaches - Using database IDs
const coaches = [
  {
    id: 20, // Match database ID
    name: "Nguyễn Văn A",
    role: "Coach cai thuốc chuyên nghiệp",
    rating: 4.8,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    available: true,
  },
  {
    id: 21, // Match database ID
    name: "Trần Thị B",
    role: "Chuyên gia tâm lý",
    rating: 4.9,
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    available: true,
  },
  {
    id: 22, // Match database ID
    name: "Phạm Minh C",
    role: "Bác sĩ phục hồi chức năng",
    rating: 4.7,
    avatar: "https://randomuser.me/api/portraits/men/64.jpg",
    available: true,
  },
];

function BookAppointment() {
  const [step, setStep] = useState(1); // 1: Choose coach, 2: Select date, 3: Select time
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showSuccess, setShowSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're rescheduling an appointment
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const isRescheduling = searchParams.get("reschedule") === "true";

    if (isRescheduling) {
      // Get the appointment to reschedule from localStorage
      const appointmentToReschedule = JSON.parse(
        localStorage.getItem("appointmentToReschedule")
      );

      if (appointmentToReschedule) {
        setIsRescheduling(true);
        setAppointmentId(appointmentToReschedule.id);

        // Find and preselect the coach
        const coach = coaches.find(
          (c) => c.id === appointmentToReschedule.coachId
        );
        if (coach) {
          setSelectedCoach(coach);
          setStep(2); // Move to date selection step

          // Set the current month to the appointment date month
          const appointmentDate = new Date(appointmentToReschedule.date);
          setCurrentMonth(
            new Date(
              appointmentDate.getFullYear(),
              appointmentDate.getMonth(),
              1
            )
          );

          // Preselect the date
          setSelectedDate(appointmentDate);
        }
      }
    }
  }, [location]);

  // Remove duplicate coaches definition  // Custom time selection
  const [customTime, setCustomTime] = useState("");

  // Helper functions for calendar
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const today = new Date();
    const currentDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const days = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const isDisabled = dayDate < currentDate;
      days.push({ day: i, disabled: isDisabled });
    }

    return days;
  };

  const goToPrevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);

    // Không cho phép chọn tháng trong quá khứ
    const today = new Date();
    const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);

    if (newMonth >= currentMonthDate) {
      setCurrentMonth(newMonth);
    }
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const formatMonth = (date) => {
    const options = { month: "long", year: "numeric" };
    return date.toLocaleDateString("vi-VN", options);
  };

  const handleSelectCoach = (coach) => {
    setSelectedCoach(coach);
    setStep(2);
  };

  const handleSelectDate = (dayObj) => {
    if (!dayObj || !dayObj.day || dayObj.disabled) return;

    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      dayObj.day
    );
    setSelectedDate(selectedDate);
    setStep(3);
  };
  const handleSelectTime = async (time) => {
    setSelectedTime(time);

    try {
      // Tạo đối tượng lịch hẹn mới
      const appointmentData = {
        userId: user?.id, // Add userId for API call
        coachId: selectedCoach.id,
        appointmentDate: selectedDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
        appointmentTime: time, // Format: HH:MM
      };

      // Gọi API để tạo lịch hẹn mới
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/auth/appointments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(appointmentData),
        }
      );

      if (response.ok) {
        const appointment = await response.json();
        setAppointmentId(appointment.id);

        // Cập nhật thông tin coach cho user nếu chưa có
        if (user && !user.assignedCoachId) {
          const updatedUser = {
            ...user,
            assignedCoachId: selectedCoach.id,
            assignedCoachName: selectedCoach.name,
          };

          // Cập nhật user trong localStorage
          const users = JSON.parse(
            localStorage.getItem("nosmoke_users") || "[]"
          );
          const updatedUsers = users.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  assignedCoachId: selectedCoach.id,
                  assignedCoachName: selectedCoach.name,
                }
              : u
          );
          localStorage.setItem("nosmoke_users", JSON.stringify(updatedUsers));
          localStorage.setItem("nosmoke_user", JSON.stringify(updatedUser));
        }

        // Hiển thị thông báo thành công
        setShowSuccess(true);

        // Lưu trạng thái tab trong localStorage để Profile page hiển thị tab lịch hẹn
        localStorage.setItem("activeProfileTab", "appointments");

        // Sau 3 giây chuyển hướng đến trang hồ sơ
        setTimeout(() => {
          navigate("/profile");
        }, 3000);
      } else {
        const errorData = await response.json();
        alert(`Lỗi khi đặt lịch hẹn: ${errorData.error || "Vui lòng thử lại"}`);
      }
    } catch (error) {
      console.error("Lỗi khi đặt lịch hẹn:", error);
      alert("Lỗi khi đặt lịch hẹn. Vui lòng thử lại.");
    }
  };

  const renderCoachSelection = () => {
    return (
      <div className="coach-selection-container">
        <h2>Chọn Coach</h2>
        <div className="coaches-list">
          {coaches.map((coach) => (
            <div
              key={coach.id}
              className={`coach-card ${
                selectedCoach?.id === coach.id ? "selected" : ""
              }`}
              onClick={() => handleSelectCoach(coach)}
            >
              <div className="coach-avatar">
                <img src={coach.avatar} alt={coach.name} />
                {coach.available && (
                  <div className="coach-status available"></div>
                )}
              </div>
              <div className="coach-info">
                <h3>{coach.name}</h3>
                <p>{coach.role}</p>
                <div className="coach-rating">
                  <span className="stars">
                    {"★".repeat(Math.floor(coach.rating))}
                    {coach.rating % 1 > 0 ? "☆" : ""}
                  </span>
                  <span className="rating-value">{coach.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  const renderDateSelection = () => {
    const days = generateCalendarDays();
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    return (
      <div className="date-selection-container">
        <div className="selection-header">
          <h2>Chọn ngày & giờ</h2>
        </div>

        <div className="selected-coach">
          <img
            src={selectedCoach.avatar}
            alt={selectedCoach.name}
            className="small-avatar"
          />
          <span>{selectedCoach.name}</span>
        </div>

        <div className="calendar-container">
          <div className="calendar-header">
            <button
              onClick={goToPrevMonth}
              className="month-nav"
              disabled={
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear()
              }
            >
              <FaArrowLeft />
            </button>
            <h3>{formatMonth(currentMonth)}</h3>
            <button onClick={goToNextMonth} className="month-nav">
              <FaArrowRight />
            </button>
          </div>

          <div className="calendar">
            {dayNames.map((day) => (
              <div key={day} className="day-header">
                {day}
              </div>
            ))}

            {days.map((dayObj, index) => (
              <div
                key={index}
                className={`calendar-day ${
                  !dayObj || !dayObj.day ? "empty" : ""
                } ${dayObj && dayObj.disabled ? "disabled" : ""} ${
                  dayObj &&
                  dayObj.day === new Date().getDate() &&
                  currentMonth.getMonth() === new Date().getMonth() &&
                  currentMonth.getFullYear() === new Date().getFullYear()
                    ? "today"
                    : ""
                }`}
                onClick={() => handleSelectDate(dayObj)}
              >
                {dayObj && dayObj.day}
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setStep(1)} className="back-button">
          <FaArrowLeft /> Quay lại
        </button>
      </div>
    );
  };
  const renderTimeSelection = () => {
    // Tạo danh sách thời gian dropdown từ 8:00 đến 22:00 (mỗi 30 phút)
    const timeSlots = [];
    for (let hour = 8; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 22 && minute > 0) break; // Dừng ở 22:00
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        timeSlots.push(timeString);
      }
    }

    return (
      <div className="time-selection-container">
        <div className="selection-header">
          <h2>Chọn thời gian</h2>
        </div>

        <div className="selection-details">
          <div className="selected-coach">
            <img
              src={selectedCoach.avatar}
              alt={selectedCoach.name}
              className="small-avatar"
            />
            <span>{selectedCoach.name}</span>
          </div>
          <div className="selected-date">
            <FaCalendarAlt />
            <span>
              {selectedDate.toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="time-slots-container">
          <div className="custom-time-container">
            <p>Chọn giờ hẹn:</p>
            <div className="time-dropdown-container">
              <select
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="time-dropdown"
                required
              >
                <option value="">-- Chọn giờ --</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => customTime && handleSelectTime(customTime)}
                className="btn-submit-time"
                disabled={!customTime}
              >
                Xác nhận giờ hẹn
              </button>
            </div>
            <small className="time-helper-text">
              Giờ làm việc: 8:00 - 22:00
            </small>
          </div>
        </div>

        <button onClick={() => setStep(2)} className="back-button">
          <FaArrowLeft /> Quay lại
        </button>
      </div>
    );
  };

  // Rendu de la confirmation du rendez-vous
  const renderSuccess = () => {
    return (
      <div className="appointment-success">
        <div className="success-icon">
          <FaCheck />
        </div>
        <h2>
          {isRescheduling
            ? "Thay đổi lịch thành công!"
            : "Đặt lịch thành công!"}
        </h2>{" "}
        <p>
          Bạn đã {isRescheduling ? "thay đổi lịch hẹn" : "đặt lịch hẹn"} với{" "}
          <strong>{selectedCoach.name}</strong>
        </p>
        <p>
          Vào ngày <strong>{selectedDate.toLocaleDateString("vi-VN")}</strong>{" "}
          lúc <strong>{selectedTime}</strong>
        </p>
        <p>
          Mã cuộc hẹn: <strong>#{appointmentId}</strong>
        </p>
        <div className="pending-status-info">
          <p>
            <strong>⏳ Trạng thái:</strong> Đang chờ coach xác nhận
          </p>
          <p className="status-note">
            Coach sẽ xem xét và xác nhận lịch hẹn của bạn. Bạn sẽ nhận được
            thông báo khi lịch được xác nhận.
          </p>
        </div>
        <p className="redirect-message">
          Bạn sẽ được chuyển đến trang hồ sơ cá nhân để xem lịch hẹn của bạn...
        </p>
      </div>
    );
  };
  return (
    <section className="appointment-section">
      <div className="container">
        {" "}
        <div className="appointment-header">
          <h1>
            <FaCalendarAlt className="appointment-icon" />
            <span>Đặt lịch hẹn với Coach</span>
          </h1>
        </div>
        {showSuccess ? (
          renderSuccess()
        ) : (
          <RequireMembership
            allowedMemberships={["premium", "pro"]}
            showModal={true}
          >
            <div className="appointment-stepper">
              <div
                className={`stepper-step ${step >= 1 ? "active" : ""} ${
                  selectedCoach ? "clickable" : ""
                }`}
                onClick={() => selectedCoach && setStep(1)}
              >
                <div className="step-number">1</div>
                <div className="step-label">Chọn Coach</div>
              </div>
              <div className="stepper-line"></div>
              <div
                className={`stepper-step ${step >= 2 ? "active" : ""} ${
                  selectedDate ? "clickable" : ""
                }`}
                onClick={() => selectedDate && setStep(2)}
              >
                <div className="step-number">2</div>
                <div className="step-label">Chọn ngày</div>
              </div>
              <div className="stepper-line"></div>
              <div
                className={`stepper-step ${step >= 3 ? "active" : ""} ${
                  selectedTime ? "clickable" : ""
                }`}
                onClick={() => selectedTime && setStep(3)}
              >
                <div className="step-number">3</div>
                <div className="step-label">Chọn giờ</div>
              </div>
            </div>

            <div className="appointment-content">
              {step === 1 && renderCoachSelection()}
              {step === 2 && renderDateSelection()}
              {step === 3 && renderTimeSelection()}{" "}
            </div>
          </RequireMembership>
        )}
      </div>
    </section>
  );
}

// Export the component wrapped with membership requirement
export default BookAppointment;
