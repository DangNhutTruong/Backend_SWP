import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FaCalendarAlt,
  FaUser,
  FaClock,
  FaCheck,
  FaTimes,
  FaEdit,
  FaComments,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../../styles/CoachBookings.css";

function CoachBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all', 'pending', 'upcoming', 'completed', 'cancelled'
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);

  const loadBookings = useCallback(async () => {
    if (!user || user.role !== "coach") {
      setLoading(false);
      return;
    }

    try {
      // Call API to get coach appointments
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/auth/coach/appointments?coachId=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Coach appointments from API:", result);

        // Transform API data to match component structure
        const transformedBookings = result.data.map((appointment) => {
          return {
            id: appointment.id,
            coachId: appointment.coach_id,
            userId: appointment.user_id,
            userName: appointment.user_name,
            userEmail: appointment.user_email,
            date: appointment.date, // Already separate date field
            time: appointment.time, // Already separate time field
            status: appointment.status,
            createdAt: appointment.created_at,
            duration: appointment.duration_minutes || 60,
            notes: appointment.notes,
            rating: appointment.rating,
            reviewText: appointment.review_text,
          };
        });

        // Sắp xếp theo ngày tạo mới nhất
        const sortedBookings = transformedBookings.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setBookings(sortedBookings);
        setServerError(false);
      } else {
        console.error("Failed to fetch coach appointments");
        setBookings([]);
        setServerError(true);
      }
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi tải danh sách booking:", error);
      setBookings([]);
      setServerError(true);
      setLoading(false);
    }
  }, [user]);

  const filterBookings = useCallback(() => {
    let filtered = [...bookings];
    const now = new Date();

    switch (filter) {
      case "pending":
        filtered = bookings.filter((booking) => booking.status === "pending");
        break;
      case "upcoming":
        filtered = bookings.filter((booking) => {
          const bookingDate = new Date(booking.date);
          return bookingDate >= now && booking.status === "confirmed";
        });
        break;
      case "completed":
        filtered = bookings.filter(
          (booking) => booking.status === "completed" || booking.completed
        );
        break;
      case "cancelled":
        filtered = bookings.filter((booking) => booking.status === "cancelled");
        break;
      default:
        // 'all' - giữ nguyên
        break;
    }

    setFilteredBookings(filtered);
  }, [bookings, filter]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/auth/appointments/${bookingId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            notes: `Trạng thái được cập nhật thành ${newStatus} bởi coach`,
          }),
        }
      );

      if (response.ok) {
        console.log(`✅ Updated appointment ${bookingId} to ${newStatus}`);
        // Reload bookings after update
        await loadBookings();
      } else {
        console.error("❌ Failed to update appointment status");
        alert("Không thể cập nhật trạng thái cuộc hẹn. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("🚨 Error updating appointment status:", error);
      alert("Lỗi kết nối. Vui lòng kiểm tra server và thử lại.");
    }
  };

  const handleSendMessage = (booking) => {
    // Chuyển hướng đến trang chat với thông tin người dùng
    navigate("/coach/chat", {
      state: {
        userId: booking.userId,
        userName: booking.userName,
        userEmail: booking.userEmail,
      },
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    return time;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#ffc107"; // Màu vàng cho chờ xác nhận
      case "confirmed":
        return "#007bff";
      case "completed":
        return "#28a745";
      case "cancelled":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  if (!user || user.role !== "coach") {
    return (
      <div className="coach-bookings-container">
        <div className="access-denied">
          <h2>Không có quyền truy cập</h2>
          <p>Bạn cần đăng nhập với tài khoản coach để xem trang này.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="coach-bookings-container">
        <div className="loading">
          <p>Đang tải danh sách booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="coach-bookings-container">
      {serverError && (
        <div className="server-error-banner">
          <FaExclamationTriangle />
          <div>
            <strong>Lỗi kết nối server!</strong>
            <p>
              Không thể kết nối với server. Vui lòng khởi động server backend và
              làm mới trang.
            </p>
            <small>Lệnh: cd server && node server.js</small>
          </div>
        </div>
      )}

      <div className="bookings-header">
        <h1>
          <FaCalendarAlt className="header-icon" />
          Danh sách Booking
        </h1>
        <p>Chào {user.name}, đây là danh sách các cuộc hẹn của bạn</p>
      </div>

      <div className="bookings-filters">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          Tất cả ({bookings.length})
        </button>
        <button
          className={filter === "pending" ? "active" : ""}
          onClick={() => setFilter("pending")}
        >
          Chờ xác nhận ({bookings.filter((b) => b.status === "pending").length})
        </button>
        <button
          className={filter === "upcoming" ? "active" : ""}
          onClick={() => setFilter("upcoming")}
        >
          Sắp tới (
          {
            bookings.filter((b) => {
              const bookingDate = new Date(b.date);
              return bookingDate >= new Date() && b.status === "confirmed";
            }).length
          }
          )
        </button>
        <button
          className={filter === "completed" ? "active" : ""}
          onClick={() => setFilter("completed")}
        >
          Đã hoàn thành (
          {
            bookings.filter((b) => b.status === "completed" || b.completed)
              .length
          }
          )
        </button>
        <button
          className={filter === "cancelled" ? "active" : ""}
          onClick={() => setFilter("cancelled")}
        >
          Đã hủy ({bookings.filter((b) => b.status === "cancelled").length})
        </button>
      </div>

      <div className="bookings-list">
        {filteredBookings.length === 0 ? (
          <div className="empty-bookings">
            <FaCalendarAlt className="empty-icon" />
            <h3>Không có booking nào</h3>
            <p>
              {filter === "all"
                ? "Chưa có ai đặt lịch hẹn với bạn."
                : `Không có booking nào trong trạng thái "${getStatusText(
                    filter === "upcoming" ? "confirmed" : filter
                  )}".`}
            </p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-id">
                  <span>#{booking.id}</span>
                </div>
                <div
                  className="booking-status"
                  style={{ backgroundColor: getStatusColor(booking.status) }}
                >
                  {getStatusText(booking.status)}
                </div>
              </div>

              <div className="booking-content">
                <div className="booking-user">
                  <FaUser className="booking-icon" />
                  <div className="user-info">
                    <h4>{booking.userName || "Người dùng"}</h4>
                    <p>{booking.userEmail}</p>
                  </div>
                </div>

                <div className="booking-datetime">
                  <div className="booking-date">
                    <FaCalendarAlt className="booking-icon" />
                    <span>{formatDate(booking.date)}</span>
                  </div>
                  <div className="booking-time">
                    <FaClock className="booking-icon" />
                    <span>{formatTime(booking.time)}</span>
                  </div>
                </div>
              </div>

              <div className="booking-actions">
                {booking.status === "pending" && (
                  <>
                    <button
                      className="action-btn confirm-btn"
                      onClick={() =>
                        updateBookingStatus(booking.id, "confirmed")
                      }
                      title="Xác nhận lịch hẹn"
                    >
                      <FaCheck /> Xác nhận
                    </button>
                    <button
                      className="action-btn cancel-btn"
                      onClick={() =>
                        updateBookingStatus(booking.id, "cancelled")
                      }
                      title="Từ chối lịch hẹn"
                    >
                      <FaTimes /> Từ chối
                    </button>
                  </>
                )}
                {booking.status === "confirmed" && (
                  <>
                    <button
                      className="action-btn complete-btn"
                      onClick={() =>
                        updateBookingStatus(booking.id, "completed")
                      }
                      title="Đánh dấu hoàn thành"
                    >
                      <FaCheck /> Hoàn thành
                    </button>
                    <button
                      className="action-btn cancel-btn"
                      onClick={() =>
                        updateBookingStatus(booking.id, "cancelled")
                      }
                      title="Hủy cuộc hẹn"
                    >
                      <FaTimes /> Hủy
                    </button>
                    <button
                      className="action-btn message-btn"
                      onClick={() => handleSendMessage(booking)}
                      title="Gửi tin nhắn cho người dùng"
                    >
                      <FaComments /> Nhắn tin
                    </button>
                  </>
                )}
                {booking.status === "completed" && (
                  <button
                    className="action-btn message-btn"
                    onClick={() => handleSendMessage(booking)}
                    title="Gửi tin nhắn cho người dùng"
                  >
                    <FaComments /> Nhắn tin
                  </button>
                )}
                {booking.status === "cancelled" && (
                  <button
                    className="action-btn restore-btn"
                    onClick={() => updateBookingStatus(booking.id, "confirmed")}
                    title="Khôi phục cuộc hẹn"
                  >
                    <FaEdit /> Khôi phục
                  </button>
                )}
              </div>

              <div className="booking-footer">
                <small>
                  Đặt lịch:{" "}
                  {new Date(booking.createdAt).toLocaleString("vi-VN")}
                </small>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CoachBookings;
