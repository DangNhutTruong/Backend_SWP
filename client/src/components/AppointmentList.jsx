import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaUserAlt,
  FaClock,
  FaMapMarkerAlt,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaComments,
  FaExclamationTriangle,
  FaTrashAlt,
  FaStar as FaStarSolid,
  FaStar as FaStarRegular,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AppointmentList.css";
import ProtectedCoachChat from "./ProtectedCoachChat";
import RequireMembership from "./RequireMembership";
import api from "../utils/axiosConfig";

// Component hiển thị cho thẻ lịch hẹn đã hủy
const CancelledAppointmentCard = ({ appointment, onRebook, onDelete }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  };
  // Gọi hàm mở modal đặt lại lịch hẹn
  const handleRebookClick = () => {
    onRebook(appointment);
  };

  // Gọi hàm mở modal xóa lịch hẹn
  const handleDeleteClick = () => {
    onDelete(appointment);
  };

  return (
    <div className="cancelled-appointment-card">
      <div className="cancelled-header">
        <FaTimes className="cancelled-icon" />
        <div className="cancelled-status">
          <span className="cancelled-label">Đã hủy</span>
          <span className="cancelled-id">#{appointment.id}</span>
        </div>
      </div>
      <div className="cancelled-body">
        <img
          src={appointment.coachAvatar || '/image/default-user-avatar.svg'}
          alt={appointment.coachName}
          className="coach-avatar"
        />
        <div className="cancelled-info">
          <h3 className="coach-name">{appointment.coachName}</h3>
          <p className="coach-role">{appointment.coachRole}</p>
          <div className="cancelled-date">
            <FaCalendarAlt />
            {formatDate(appointment.date)}, {appointment.time}
            <span className="online-badge">Tư vấn trực tuyến</span>
          </div>
        </div>{" "}
      </div>{" "}
      <div className="cancelled-footer">
        <button className="delete-button" onClick={handleDeleteClick}>
          <FaTrashAlt /> Xóa lịch hẹn
        </button>
        <button className="rebook-button" onClick={handleRebookClick}>
          <FaCalendarAlt /> Đặt lại lịch hẹn
        </button>
      </div>
    </div>
  );
};

function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all', 'upcoming', 'past'
  const [loading, setLoading] = useState(true);
  const [newAppointmentId, setNewAppointmentId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [showRebookModal, setShowRebookModal] = useState(false);
  const [appointmentToRebook, setAppointmentToRebook] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [appointmentToRate, setAppointmentToRate] = useState(null);
  const [rating, setRating] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const { user } = useAuth(); // Lấy thông tin user từ AuthContext
  const navigate = useNavigate();

  // Function to refresh appointments list
  const refreshAppointments = async () => {
    setLoading(true);
    try {
      console.log("Refreshing appointments for user ID:", user?.id);
      
      const response = await api.get(`/api/auth/appointments?userId=${user?.id}`);

      if (response.data.success) {
        const result = response.data.data || response.data;
        console.log("✅ Refreshed Appointments:", result);
        const apiAppointments = result.data || result;
        
        // Transform và set lại danh sách lịch hẹn
        const coachMapping = {
          1: {
            name: "Lê Minh Gia Mẫn",
            role: "Coach tư vấn cai thuốc",
            avatar: "/image/default-user-avatar.svg",
          },
          2: {
            name: "Nguyễn Gia Mỹ",
            role: "Coach tư vấn cai thuốc",
            avatar: "/image/default-user-avatar.svg",
          },
          3: {
            name: "Trần Anh Tuấn",
            role: "Coach tư vấn cai thuốc",
            avatar: "/image/default-user-avatar.svg",
          },
          20: {
            name: "Nguyễn Văn A",
            role: "Coach cai thuốc chuyên nghiệp",
            avatar: "/image/default-user-avatar.svg",
          },
          21: {
            name: "Trần Thị B",
            role: "Chuyên gia tâm lý",
            avatar: "/image/default-user-avatar.svg",
          },
          22: {
            name: "Phạm Minh C",
            role: "Bác sĩ phục hồi chức năng",
            avatar: "/image/default-user-avatar.svg",
          },
        };

        const transformedAppointments = apiAppointments.map((appointment) => {
          console.log("Processing appointment:", appointment);
          const coach = coachMapping[appointment.coach_id] || {
            name: `Coach ${appointment.coach_id}`,
            role: "Coach cai thuốc",
            avatar: "/image/default-user-avatar.svg",
          };

          // Đảm bảo các trường quan trọng luôn có giá trị
          const status = appointment.status || "pending";
          const duration = appointment.duration_minutes || 120;

          return {
            id: appointment.id,
            userId: appointment.user_id,
            coachId: appointment.coach_id,
            coachName: coach.name,
            coachRole: coach.role,
            coachAvatar: coach.avatar,
            date: appointment.date, // Already in YYYY-MM-DD format
            time: appointment.time, // Already in HH:MM format
            status: status,
            duration: duration,
            notes: appointment.notes || "",
            rating: appointment.rating,
            reviewText: appointment.review_text,
            createdAt: appointment.created_at,
          };
        });

        console.log("Transformed appointments:", transformedAppointments);

        // Sort appointments by date (newest first)
        const sortedAppointments = transformedAppointments.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateB - dateA;
        });

        setAppointments(sortedAppointments);
      } else {
        const errorData = response.data;
        console.error("Error refreshing appointments:", errorData);
      }
    } catch (error) {
      console.error("🚨 Error refreshing appointments:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch appointments from API
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/auth/appointments?userId=${user?.id}`);

        if (response.data.success) {
          const result = response.data.data || response.data;
          console.log("✅ API Response:", result);
          const apiAppointments = result.data || result;

          // Coach mapping for display
          const coachMapping = {
            1: {
              name: "Lê Minh Gia Mẫn",
              role: "Coach tư vấn cai thuốc",
              avatar: "/image/default-user-avatar.svg",
            },
            2: {
              name: "Nguyễn Gia Mỹ",
              role: "Coach tư vấn cai thuốc",
              avatar: "/image/default-user-avatar.svg",
            },
            3: {
              name: "Trần Anh Tuấn",
              role: "Coach tư vấn cai thuốc",
              avatar: "/image/default-user-avatar.svg",
            },
            20: {
              name: "Nguyễn Văn A",
              role: "Coach cai thuốc chuyên nghiệp",
              avatar: "/image/default-user-avatar.svg",
            },
            21: {
              name: "Trần Thị B",
              role: "Chuyên gia tâm lý",
              avatar: "/image/default-user-avatar.svg",
            },
            22: {
              name: "Phạm Minh C",
              role: "Bác sĩ phục hồi chức năng",
              avatar: "/image/default-user-avatar.svg",
            },
          };

          // Transform API appointments to component format
          const transformedAppointments = apiAppointments.map((appointment) => {
            const coach = coachMapping[appointment.coach_id] || {
              name: `Coach ${appointment.coach_id}`,
              role: "Coach cai thuốc",
              avatar: "https://randomuser.me/api/portraits/men/32.jpg",
            };

            // Đảm bảo các trường quan trọng luôn có giá trị
            const status = appointment.status || "pending";
            const duration = appointment.duration_minutes || 30;

            return {
              id: appointment.id,
              userId: appointment.user_id,
              coachId: appointment.coach_id,
              coachName: coach.name,
              coachRole: coach.role,
              coachAvatar: coach.avatar,
              date: appointment.date, // Already in YYYY-MM-DD format
              time: appointment.time, // Already in HH:MM format
              status: status,
              duration: duration,
              notes: appointment.notes || "",
              rating: appointment.rating,
              reviewText: appointment.review_text,
              createdAt: appointment.created_at,
            };
          });

          // Log chi tiết từng lịch hẹn để debug
          console.log("=== DEBUG: CHI TIẾT LỊCH HẸN ===");
          transformedAppointments.forEach((appointment, index) => {
            const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
            console.log(`[${index}] ID: ${appointment.id}, Coach: ${appointment.coachName}`);
            console.log(`    Date: ${appointment.date}, Time: ${appointment.time}`);
            console.log(`    Status: ${appointment.status}, Duration: ${appointment.duration} phút`);
            console.log(`    Full DateTime: ${appointmentDate.toLocaleString()}`);
          });

          // Log ngày hiện tại để debug
          console.log("Ngày hiện tại:", new Date().toLocaleDateString("vi-VN"));
          console.log(
            "📊 Transformed appointments:",
            transformedAppointments.length
          );

          // Sort appointments by date (newest first)
          const sortedAppointments = transformedAppointments.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateB - dateA;
          });

          // Check if there's a new appointment (most recently added)
          if (sortedAppointments.length > 0) {
            setNewAppointmentId(sortedAppointments[0].id);

            // Set filter to "upcoming" to show the new appointment
            setFilter("upcoming");

            // After 5 seconds, remove the highlight
            setTimeout(() => {
              setNewAppointmentId(null);
            }, 5000);
          }

          setAppointments(sortedAppointments);
        } else {
          console.error("❌ API Failed:", response.data.message);
          // Fallback to localStorage for development
          const localAppointments = JSON.parse(
            localStorage.getItem("appointments") || "[]"
          );
          console.log(
            "📱 Fallback to localStorage:",
            localAppointments.length,
            "appointments"
          );
          setAppointments(localAppointments);
        }
      } catch (error) {
        console.error("🚨 API Error:", error.message);
        // Fallback to localStorage when API is down
        const localAppointments = JSON.parse(
          localStorage.getItem("appointments") || "[]"
        );
        console.log(
          "📱 Fallback to localStorage:",
          localAppointments.length,
          "appointments"
        );
        setAppointments(localAppointments);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user?.id]); // Add user.id as dependency

  // Thêm useEffect để refresh danh sách khi người dùng quay lại từ trang đặt lịch
  useEffect(() => {
    // Kiểm tra xem người dùng vừa đặt lịch thành công hay không
    const activeTab = localStorage.getItem("activeProfileTab");
    const shouldRefresh = activeTab === "appointments";
    
    if (shouldRefresh) {
      console.log("Refreshing appointments after booking...");
      // Xóa flag để không refresh liên tục
      localStorage.removeItem("activeProfileTab");
      
      // Fetch lại danh sách lịch hẹn
      const fetchAppointments = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/api/auth/appointments?userId=${user?.id}`);

          if (response.data.success) {
            const result = response.data.data || response.data;
            console.log("✅ Refreshed Appointments:", result);
            const apiAppointments = result.data || result;
            
            // Transform và set lại danh sách lịch hẹn
            // (Sử dụng code transform tương tự như trên)
            const coachMapping = {
              1: {
                name: "Lê Minh Gia Mẫn",
                role: "Coach tư vấn cai thuốc",
                avatar: "/image/default-user-avatar.svg",
              },
              2: {
                name: "Nguyễn Gia Mỹ",
                role: "Coach tư vấn cai thuốc",
                avatar: "/image/default-user-avatar.svg",
              },
              3: {
                name: "Trần Anh Tuấn",
                role: "Coach tư vấn cai thuốc",
                avatar: "/image/default-user-avatar.svg",
              },
              20: {
                name: "Nguyễn Văn A",
                role: "Coach cai thuốc chuyên nghiệp",
                avatar: "/image/default-user-avatar.svg",
              },
              21: {
                name: "Trần Thị B",
                role: "Chuyên gia tâm lý",
                avatar: "/image/default-user-avatar.svg",
              },
              22: {
                name: "Phạm Minh C",
                role: "Bác sĩ phục hồi chức năng",
                avatar: "/image/default-user-avatar.svg",
              },
            };

            const transformedAppointments = apiAppointments.map((appointment) => {
              const coach = coachMapping[appointment.coach_id] || {
                name: `Coach ${appointment.coach_id}`,
                role: "Coach cai thuốc",
                avatar: "/image/default-user-avatar.svg",
              };

              // Đảm bảo các trường quan trọng luôn có giá trị
              const status = appointment.status || "pending";
              const duration = appointment.duration_minutes || 30;

              return {
                id: appointment.id,
                userId: appointment.user_id,
                coachId: appointment.coach_id,
                coachName: coach.name,
                coachRole: coach.role,
                coachAvatar: coach.avatar,
                date: appointment.date, // Already in YYYY-MM-DD format
                time: appointment.time, // Already in HH:MM format
                status: status,
                duration: duration,
                notes: appointment.notes || "",
                rating: appointment.rating,
                reviewText: appointment.review_text,
                createdAt: appointment.created_at,
              };
            });

            // Log chi tiết từng lịch hẹn để debug
            console.log("=== DEBUG: CHI TIẾT LỊCH HẸN ===");
            transformedAppointments.forEach((appointment, index) => {
              const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
              console.log(`[${index}] ID: ${appointment.id}, Coach: ${appointment.coachName}`);
              console.log(`    Date: ${appointment.date}, Time: ${appointment.time}`);
              console.log(`    Status: ${appointment.status}, Duration: ${appointment.duration} phút`);
              console.log(`    Full DateTime: ${appointmentDate.toLocaleString()}`);
            });

            // Log ngày hiện tại để debug
            console.log("Ngày hiện tại:", new Date().toLocaleDateString("vi-VN"));
            console.log(
              "📊 Transformed appointments:",
              transformedAppointments.length
            );

            // Sort appointments by date (newest first)
            const sortedAppointments = transformedAppointments.sort((a, b) => {
              const dateA = new Date(`${a.date}T${a.time}`);
              const dateB = new Date(`${b.date}T${b.time}`);
              return dateB - dateA;
            });

            // Check if there's a new appointment (most recently added)
            if (sortedAppointments.length > 0) {
              setNewAppointmentId(sortedAppointments[0].id);

              // Set filter to "upcoming" to show the new appointment
              setFilter("upcoming");

              // After 5 seconds, remove the highlight
              setTimeout(() => {
                setNewAppointmentId(null);
              }, 5000);
            }

            setAppointments(sortedAppointments);

            // Tự động chuyển sang tab "Sắp tới" để hiển thị lịch hẹn mới
            setFilter("upcoming");
          }
        } catch (error) {
          console.error("🚨 Error refreshing appointments:", error.message);
        } finally {
          setLoading(false);
        }
      };
      
      fetchAppointments();
    }
  }, [user?.id]); // Dependency array
  // Sửa lại logic filter
  const filteredAppointments = appointments.filter((appointment) => {
    // Lấy ngày giờ hiện tại
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset giờ về 00:00:00 cho việc so sánh ngày

    // Lấy ngày giờ lịch hẹn
    const [hours, minutes] = appointment.time.split(":").map(Number);
    const appointmentDate = new Date(appointment.date);
    appointmentDate.setHours(hours, minutes, 0, 0);

    // Cũng tạo một bản sao ngày lịch hẹn với giờ reset để so sánh ngày
    const appointmentDay = new Date(appointmentDate);
    appointmentDay.setHours(0, 0, 0, 0);

    // Kiểm tra xem lịch hẹn đã hoàn thành chưa
    const isCompleted = appointment.status === "completed" || appointment.completed === true;
    const isCancelled = appointment.status === "cancelled";
    const isPending = appointment.status === "pending" || !appointment.status;
    const isConfirmed = appointment.status === "confirmed";

    // Log chi tiết filter để debug
    console.log(`Filter debug - ID: ${appointment.id}, Status: ${appointment.status}, Filter: ${filter}`);
    console.log(`  Date compare: appointmentDate (${appointmentDate.toLocaleString()}) vs now (${now.toLocaleString()})`);
    console.log(`  Is future: ${appointmentDate >= now}, Is today: ${appointmentDay.getTime() === today.getTime()}`);

    // Logic filter theo tab đã chọn
    if (filter === "upcoming") {
      // Nếu lịch hẹn đã hủy hoặc đã hoàn thành, không hiển thị trong "Sắp tới"
      if (isCancelled || isCompleted) {
        return false;
      }
      
      // Hiển thị tất cả lịch hẹn có status "pending" hoặc "confirmed"
      // và có ngày >= ngày hiện tại (bao gồm cả ngày hôm nay)
      const isToday = appointmentDay.getTime() === today.getTime();
      const isFuture = appointmentDay > today;
      
      // Hiển thị lịch hẹn nếu: là ngày hôm nay hoặc tương lai, và có status là confirmed hoặc pending
      return (isToday || isFuture) && (isConfirmed || isPending);
    } 
    else if (filter === "past") {
      // Hiển thị lịch hẹn đã qua (ngày < ngày hiện tại) hoặc đã hủy hoặc đã hoàn thành
      const isPast = appointmentDay < today;
      return isPast || isCancelled || isCompleted;
    }

    // Filter "all": hiển thị tất cả lịch hẹn
    return true;
  });
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  };

  // Get status class based on appointment status
  const getStatusClass = (appointment) => {
    if (appointment.status === "cancelled") {
      return "cancelled";
    } else if (appointment.status === "completed" || appointment.completed) {
      return "completed";
    } else if (appointment.status === "confirmed") {
      // Always return confirmed regardless of time
      return "confirmed";
    }

    return "";
  }; // Get status text based on appointment status
  const getStatusText = (appointment) => {
    if (appointment.status === "cancelled") {
      return "Đã hủy";
    } else if (appointment.status === "completed" || appointment.completed) {
      return "Đã hoàn thành";
    } else if (appointment.status === "confirmed") {
      // Lấy ngày hiện tại
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Lấy ngày lịch hẹn
      const appointmentDate = new Date(
        `${appointment.date.split("T")[0]}T${appointment.time}`
      );
      const appointmentDay = new Date(appointmentDate);
      appointmentDay.setHours(0, 0, 0, 0);

      return "Đã xác nhận";
    }

    return "Chờ xác nhận";
  };
  // Open cancel confirmation modal
  const openCancelModal = (id) => {
    setAppointmentToCancel(id);
    setShowCancelModal(true);
  };

  // Close cancel confirmation modal
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setAppointmentToCancel(null);
  };

  // Handle cancel appointment
  const handleCancelAppointment = async () => {
    if (appointmentToCancel) {
      try {
        console.log("Cancelling appointment ID:", appointmentToCancel);
        
        // Use the updateAppointmentStatus API with error handling
        const response = await api.put(`/api/auth/appointments/${appointmentToCancel}/status`, {
          status: "cancelled",
          userId: user?.id,
          notes: "Lịch hẹn đã bị hủy bởi người dùng"
        }).catch(error => {
          console.error("Error canceling appointment:", error);
          
          // Show detailed error message
          if (error.response) {
            console.error("Error response:", error.response.data);
            console.error("Status code:", error.response.status);
            
            // Show specific error message based on status code
            if (error.response.status === 404) {
              alert("Không tìm thấy lịch hẹn này trong hệ thống. Vui lòng làm mới trang và thử lại.");
            } else {
              alert(`Lỗi khi hủy lịch hẹn: ${error.response.data.message || "Vui lòng thử lại"}`);
            }
          } else if (error.request) {
            alert("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.");
          } else {
            alert("Lỗi khi hủy lịch hẹn. Vui lòng thử lại.");
          }
          
          return null;
        });
        
        if (response && response.data.success) {
          console.log("Appointment cancelled successfully");
          
          // Refresh appointments list to get updated data
          await refreshAppointments();
          
          closeCancelModal();
          
          // Show success toast
          setToastMessage("Lịch hẹn đã được hủy thành công!");
          setShowToast(true);

          // Hide toast after 3 seconds
          setTimeout(() => {
            setShowToast(false);
          }, 3000);
        }
      } catch (error) {
        console.error("Unexpected error canceling appointment:", error);
        alert("Lỗi không xác định khi hủy lịch hẹn. Vui lòng thử lại sau.");
      }
    }
  };
  // Handle reschedule or rebook appointment
  const handleRescheduleAppointment = (appointment) => {
    // Lưu thông tin lịch hẹn cần thay đổi vào localStorage
    localStorage.setItem(
      "appointmentToReschedule",
      JSON.stringify(appointment)
    );

    // Chuyển hướng đến trang đặt lịch với tham số reschedule=true
    navigate("/appointment?reschedule=true");
    
    // Không cần xóa lịch hẹn cũ vì chúng ta sẽ cập nhật nó thay vì tạo mới
  };
  // Open rebook confirmation modal
  const openRebookModal = (appointment) => {
    setAppointmentToRebook(appointment);
    setShowRebookModal(true);
  };

  // Close rebook confirmation modal
  const closeRebookModal = () => {
    setShowRebookModal(false);
    setAppointmentToRebook(null);
  };
  // Handle booking new appointment after completion or cancellation
  const handleRebookAppointment = () => {
    if (appointmentToRebook) {
      // For cancelled or completed appointments, we'll create a new booking
      // but pre-fill the coach information
      const rebookData = {
        coachId: appointmentToRebook.coachId,
        coachName: appointmentToRebook.coachName,
        coachAvatar: appointmentToRebook.coachAvatar,
        coachRole: appointmentToRebook.coachRole,
      };

      localStorage.setItem("rebookCoach", JSON.stringify(rebookData));

      // Đóng modal và chuyển trang
      closeRebookModal();
      navigate("/appointment?rebook=true");
    }
  };
  // Open delete confirmation modal
  const openDeleteModal = (appointment) => {
    setAppointmentToDelete(appointment);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setAppointmentToDelete(null);
  }; // Handle delete cancelled appointment
  const handleDeleteAppointment = async () => {
    if (appointmentToDelete) {
      // Set deleting state to true
      setIsDeleting(true);

      try {
        const token = localStorage.getItem("token");
        const response = await api.delete(`/appointments/${appointmentToDelete.id}`);

        if (response.data.success) {
          // Filter out the appointment to delete
          const updatedAppointments = appointments.filter(
            (appointment) => appointment.id !== appointmentToDelete.id
          );

          setAppointments(updatedAppointments);
          closeDeleteModal();

          // Show success toast
          setToastMessage("Lịch hẹn đã được xóa thành công!");
          setShowToast(true);

          // Hide toast after 3 seconds
          setTimeout(() => {
            setShowToast(false);
          }, 3000);
        } else {
          alert("Lỗi khi xóa lịch hẹn. Vui lòng thử lại.");
        }
      } catch (error) {
        console.error("Error deleting appointment:", error);
        alert("Lỗi khi xóa lịch hẹn. Vui lòng thử lại.");
      } finally {
        // Reset deleting state
        setIsDeleting(false);
      }
    }
  };

  // Handle opening chat with coach
  const handleOpenChat = (appointment) => {
    const coach = {
      name: appointment.coachName,
      avatar: appointment.coachAvatar,
      role: appointment.coachRole,
    };

    setSelectedCoach(coach);
    setSelectedAppointment(appointment);
    setShowChat(true);

    // Clear any unread messages when opening the chat
    const unreadKey = `unread_messages_${appointment.id}`;
    localStorage.setItem(unreadKey, "0");
  };
  // Handle closing chat
  const handleCloseChat = () => {
    setShowChat(false);
  };

  // Check if there are unread messages for an appointment
  const hasUnreadMessages = (appointmentId) => {
    const unreadKey = `unread_messages_${appointmentId}`;
    const unreadCount = localStorage.getItem(unreadKey);
    return unreadCount && parseInt(unreadCount) > 0;
  };

  // Open rating modal
  const openRatingModal = (appointment) => {
    setAppointmentToRate(appointment);
    setShowRatingModal(true);

    // Check if the appointment already has a rating
    const existingRating = appointment.rating;
    if (existingRating) {
      setRating(existingRating.stars);
      setRatingComment(existingRating.comment || "");
    } else {
      // Reset rating state if it's a new rating
      setRating(0);
      setRatingComment("");
    }
  };

  // Close rating modal
  const closeRatingModal = () => {
    setShowRatingModal(false);
    setAppointmentToRate(null);
    setRating(0);
    setRatingHover(0);
    setRatingComment("");
  };

  // Handle rating submission
  const handleRatingSubmit = () => {
    if (appointmentToRate && rating > 0) {
      setIsSubmittingRating(true);

      // Create rating object
      const ratingObj = {
        stars: rating,
        comment: ratingComment,
        date: new Date().toISOString(),
      };

      // Update the appointment with the rating
      const updatedAppointments = appointments.map((appointment) => {
        if (appointment.id === appointmentToRate.id) {
          return { ...appointment, rating: ratingObj };
        }
        return appointment;
      });

      // Update localStorage and state
      setAppointments(updatedAppointments);

      // Show success toast
      setToastMessage("Đánh giá của bạn đã được gửi thành công!");
      setShowToast(true);

      // Reset states
      setTimeout(() => {
        setIsSubmittingRating(false);
        setShowToast(false);
        closeRatingModal();
      }, 1000);
    }
  };

  // Handle complete appointment
  const handleCompleteAppointment = async (appointmentId) => {
    try {
      console.log("Completing appointment ID:", appointmentId);
      
      const response = await api.put(`/api/auth/appointments/${appointmentId}/status`, {
        status: "completed",
        userId: user?.id,
        notes: "Buổi tư vấn đã được hoàn thành"
      }).catch(error => {
        console.error("Error completing appointment:", error);
        
        // Show detailed error message
        if (error.response) {
          console.error("Error response:", error.response.data);
          console.error("Status code:", error.response.status);
          
          // Show specific error message based on status code
          if (error.response.status === 404) {
            alert("Không tìm thấy lịch hẹn này trong hệ thống. Vui lòng làm mới trang và thử lại.");
          } else {
            alert(`Lỗi khi cập nhật trạng thái lịch hẹn: ${error.response.data.message || "Vui lòng thử lại"}`);
          }
        } else if (error.request) {
          alert("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.");
        } else {
          alert("Lỗi khi cập nhật trạng thái lịch hẹn. Vui lòng thử lại.");
        }
        
        return null;
      });

      if (response && response.data.success) {
        console.log("Appointment marked as completed successfully");
        
        // Refresh appointments list to get updated data
        await refreshAppointments();

        // Show toast notification
        setToastMessage("Buổi tư vấn đã được xác nhận hoàn thành!");
        setShowToast(true);

        // Hide toast after 3 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Unexpected error completing appointment:", error);
      alert("Lỗi không xác định khi cập nhật trạng thái lịch hẹn. Vui lòng thử lại sau.");
    }
  };

  // Handle confirm appointment by user
  const handleConfirmAppointment = async (appointmentId) => {
    try {
      console.log("Confirming appointment ID:", appointmentId);
      
      const response = await api.put(`/api/auth/appointments/${appointmentId}/status`, {
        status: "confirmed",
        userId: user?.id,
        notes: "Lịch hẹn đã được xác nhận bởi người dùng"
      }).catch(error => {
        console.error("Error confirming appointment:", error);
        
        // Show detailed error message
        if (error.response) {
          console.error("Error response:", error.response.data);
          console.error("Status code:", error.response.status);
          
          // Show specific error message based on status code
          if (error.response.status === 404) {
            alert("Không tìm thấy lịch hẹn này trong hệ thống. Vui lòng làm mới trang và thử lại.");
          } else {
            alert(`Lỗi khi xác nhận lịch hẹn: ${error.response.data.message || "Vui lòng thử lại"}`);
          }
        } else if (error.request) {
          alert("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.");
        } else {
          alert("Lỗi khi xác nhận lịch hẹn. Vui lòng thử lại.");
        }
        
        return null;
      });

      if (response && response.data.success) {
        console.log("Appointment confirmed successfully");
        
        // Refresh appointments list to get updated data
        await refreshAppointments();

        // Show toast notification
        setToastMessage("Lịch hẹn đã được xác nhận!");
        setShowToast(true);

        // Hide toast after 3 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Unexpected error confirming appointment:", error);
      alert("Lỗi không xác định khi xác nhận lịch hẹn. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h2>
          <FaCalendarAlt /> Lịch hẹn Coach
        </h2>
        <div className="filter-controls">
          <button
            className={`filter-button ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Tất cả
          </button>
          <button
            className={`filter-button ${filter === "upcoming" ? "active" : ""}`}
            onClick={() => setFilter("upcoming")}
          >
            Sắp tới
          </button>
          <button
            className={`filter-button ${filter === "past" ? "active" : ""}`}
            onClick={() => setFilter("past")}
          >
            Đã qua
          </button>
        </div>
      </div>
      {loading ? (
        <div className="loading-message">
          <p>Đang tải lịch hẹn...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="empty-appointments">
          <FaInfoCircle />
          <p>
            Bạn chưa có lịch hẹn{" "}
            {filter === "upcoming"
              ? "sắp tới"
              : filter === "past"
              ? "đã qua"
              : "nào"}
            .
          </p>
          {filter !== "upcoming" && (
            <a href="/appointment" className="book-button">
              Đặt lịch hẹn ngay
            </a>
          )}
        </div>
      ) : (
        <div className="appointments-list">
          {" "}
          {filteredAppointments.map((appointment) =>
            appointment.status === "cancelled" ? (
              <CancelledAppointmentCard
                key={appointment.id}
                appointment={appointment}
                onRebook={openRebookModal}
                onDelete={openDeleteModal}
              />
            ) : (
              <div
                key={appointment.id}
                className={`appointment-card ${getStatusClass(appointment)} ${
                  newAppointmentId === appointment.id ? "new-appointment" : ""
                }`}
              >
                <div className="appointment-header">
                  <div
                    className={`appointment-status ${getStatusClass(
                      appointment
                    )}`}
                  >
                    {getStatusClass(appointment) === "confirmed" && <FaCheck />}
                    {getStatusClass(appointment) === "cancelled" && <FaTimes />}
                    {getStatusClass(appointment) === "completed" && <FaCheck />}
                    <span>{getStatusText(appointment)}</span>
                  </div>
                  <div className="appointment-id">
                    #{appointment.id}
                    {newAppointmentId === appointment.id && (
                      <span className="new-badge">Mới</span>
                    )}
                  </div>
                </div>
                <div className="appointment-body">
                  <div className="coach-info">
                    <img
                      src={appointment.coachAvatar || '/image/default-user-avatar.svg'}
                      alt={appointment.coachName}
                      className="coach-avatar"
                    />
                    <div className="coach-details">
                      <h3>{appointment.coachName}</h3>
                      <p>{appointment.coachRole}</p>
                    </div>
                  </div>

                  <div className="appointment-details">
                    <div className="status-badge">
                      {appointment.status === "confirmed" ? (
                        <><FaCheck className="status-icon confirmed" /> <span className="status-text confirmed">Đã xác nhận</span></>
                      ) : appointment.status === "completed" ? (
                        <><FaCheck className="status-icon completed" /> <span className="status-text completed">Đã hoàn thành</span></>
                      ) : appointment.status === "cancelled" ? (
                        <><FaTimes className="status-icon cancelled" /> <span className="status-text cancelled">Đã hủy</span></>
                      ) : (
                        <><span className="status-icon pending"></span> <span className="status-text pending">Chờ xác nhận</span></>
                      )}
                    </div>
                    <div className="detail-item">
                      <FaCalendarAlt />
                      <span>{formatDate(appointment.date)}</span>
                    </div>
                    <div className="detail-item">
                      <FaClock />
                      <span>{appointment.time}</span>
                    </div>
                    <div className="detail-item">
                      <FaMapMarkerAlt />
                      <span>Tư vấn trực tuyến</span>
                    </div>
                    {appointment.rating && (
                      <div className="detail-item rating-display">
                        <div className="stars-display">
                          {[...Array(5)].map((_, i) => (
                            <span key={i}>
                              {i < appointment.rating.stars ? (
                                <FaStarSolid className="star-small filled" />
                              ) : (
                                <FaStarRegular className="star-small" />
                              )}
                            </span>
                          ))}
                        </div>
                        <span className="rating-date">Đã đánh giá</span>
                      </div>
                    )}
                  </div>
                </div>{" "}
                <div className="appointment-footer">
                  {/* For confirmed appointments */}
                  {appointment.status === "confirmed" && (
                    <>
                      <button className="change-button" onClick={() => handleRescheduleAppointment(appointment)}>
                        Thay đổi lịch
                      </button>
                      <button className="cancel-button" onClick={() => openCancelModal(appointment.id)}>
                        Hủy lịch hẹn
                      </button>
                      <button className="chat-button" onClick={() => handleOpenChat(appointment)}>
                        <FaComments /> Nhắn tin
                      </button>
                      <button className="confirm-complete-button" onClick={() => handleCompleteAppointment(appointment.id)}>
                        <FaCheck /> Xác nhận hoàn thành
                      </button>
                    </>
                  )}
                  
                  {/* For pending appointments */}
                  {(!appointment.status || appointment.status === "pending") && (
                    <>
                      <button className="change-button" onClick={() => handleRescheduleAppointment(appointment)}>
                        Thay đổi lịch
                      </button>
                      <button className="cancel-button" onClick={() => openCancelModal(appointment.id)}>
                        Hủy lịch hẹn
                      </button>
                      <button className="chat-button" onClick={() => handleOpenChat(appointment)}>
                        <FaComments /> Nhắn tin
                      </button>
                      <button className="confirm-button" onClick={() => handleConfirmAppointment(appointment.id)}>
                        <FaCheck /> Xác nhận lịch hẹn
                      </button>
                    </>
                  )}
                  
                  {/* For completed appointments */}
                  {appointment.status === "completed" && (
                    <>
                      <button className="chat-button" onClick={() => handleOpenChat(appointment)}>
                        <FaComments /> Nhắn tin
                      </button>
                      <button className="feedback-button" onClick={() => openRatingModal(appointment)}>
                        {appointment.rating ? "Cập nhật đánh giá" : "Đánh giá Coach"}
                      </button>
                      <button className="rebook-button" onClick={() => openRebookModal(appointment)}>
                        Đặt lại lịch hẹn
                      </button>
                    </>
                  )}
                  
                  {/* For cancelled appointments */}
                  {appointment.status === "cancelled" && (
                    <button className="rebook-button" onClick={() => openRebookModal(appointment)}>
                      Đặt lại lịch hẹn
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}{" "}
      {/* Coach Chat Modal */}
      {showChat && selectedCoach && selectedAppointment && (
        <ProtectedCoachChat
          coach={selectedCoach}
          appointment={selectedAppointment}
          isOpen={showChat}
          onClose={handleCloseChat}
        />
      )}
      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="warning-icon">
              <FaExclamationTriangle />
            </div>
            <h3>Xác nhận hủy lịch hẹn</h3>
            {appointmentToCancel && (
              <p>
                Bạn có chắc chắn muốn hủy lịch hẹn vào{" "}
                <strong>
                  {appointments.find((a) => a.id === appointmentToCancel)?.time}{" "}
                  -{" "}
                  {formatDate(
                    appointments.find((a) => a.id === appointmentToCancel)?.date
                  )}
                </strong>
                ?
                <br />
                <span>Hành động này không thể hoàn tác.</span>
              </p>
            )}
            <div className="confirmation-actions">
              <button className="cancel-action" onClick={closeCancelModal}>
                Giữ lại
              </button>
              <button
                className="confirm-action"
                onClick={handleCancelAppointment}
              >
                Hủy lịch
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Rebook Confirmation Modal */}
      {showRebookModal && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="success-icon">
              <FaCalendarAlt />
            </div>
            <h3>Đặt lại lịch hẹn</h3>
            {appointmentToRebook && (
              <p>
                Bạn muốn đặt lại lịch hẹn với coach{" "}
                <strong>{appointmentToRebook.coachName}</strong>
                ?
                <br />
                <span>Bạn sẽ được chuyển đến trang đặt lịch.</span>
              </p>
            )}
            <div className="confirmation-actions">
              <button className="cancel-action" onClick={closeRebookModal}>
                Hủy bỏ
              </button>
              <button
                className="confirm-action rebook"
                onClick={handleRebookAppointment}
              >
                Đặt lịch
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="warning-icon">
              <FaExclamationTriangle />
            </div>
            <h3>Xác nhận xóa lịch hẹn</h3>
            {appointmentToDelete && (
              <p>
                Bạn có chắc chắn muốn xóa lịch hẹn với coach
                <strong> {appointmentToDelete.coachName} </strong>
                vào ngày{" "}
                <strong>
                  {appointmentToDelete.time} -{" "}
                  {formatDate(appointmentToDelete.date)}
                </strong>
                ?
                <br />
                <span>
                  Hành động này sẽ xóa vĩnh viễn lịch hẹn và không thể khôi
                  phục.
                </span>
              </p>
            )}
            <div className="confirmation-actions">
              {" "}
              <button
                className="cancel-action"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Quay lại
              </button>
              <button
                className="confirm-action delete"
                onClick={handleDeleteAppointment}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="deleting-text">Đang xóa...</span>
                ) : (
                  <>
                    <FaTrashAlt /> Xóa lịch hẹn
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Success Toast Notification */}
      {showToast && (
        <div className="toast-notification success">
          <div className="toast-icon">
            <FaCheck />
          </div>
          <div className="toast-message">{toastMessage}</div>
        </div>
      )}
      {/* Rating Modal */}
      {showRatingModal && appointmentToRate && (
        <div className="modal-overlay">
          <div className="confirmation-modal rating-modal">
            <h3>Đánh giá Coach</h3>
            <div className="coach-rating-info">
              <img
                src={appointmentToRate.coachAvatar}
                alt={appointmentToRate.coachName}
                className="coach-avatar-rating"
              />
              <div>
                <h4>{appointmentToRate.coachName}</h4>
                <p>
                  {formatDate(appointmentToRate.date)}, {appointmentToRate.time}
                </p>
              </div>
            </div>

            <div className="star-rating">
              {[...Array(5)].map((_, i) => {
                const ratingValue = i + 1;
                return (
                  <span
                    key={i}
                    className="star-wrapper"
                    onClick={() => setRating(ratingValue)}
                    onMouseEnter={() => setRatingHover(ratingValue)}
                    onMouseLeave={() => setRatingHover(0)}
                  >
                    {ratingValue <= (ratingHover || rating) ? (
                      <FaStarSolid className="star filled" />
                    ) : (
                      <FaStarRegular className="star" />
                    )}
                  </span>
                );
              })}
              {rating > 0 && (
                <span className="rating-label">
                  {rating === 1 && "Không hài lòng"}
                  {rating === 2 && "Tạm được"}
                  {rating === 3 && "Hài lòng"}
                  {rating === 4 && "Rất hài lòng"}
                  {rating === 5 && "Tuyệt vời"}
                </span>
              )}
            </div>

            <div className="rating-comment">
              <label htmlFor="comment">Ghi chú (tùy chọn):</label>
              <textarea
                id="comment"
                rows="4"
                placeholder="Chia sẻ trải nghiệm của bạn về buổi tư vấn này..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
              />
            </div>

            <div className="confirmation-actions">
              <button
                className="cancel-action"
                onClick={closeRatingModal}
                disabled={isSubmittingRating}
              >
                Hủy bỏ
              </button>
              <button
                className="confirm-action rating-submit"
                onClick={handleRatingSubmit}
                disabled={rating === 0 || isSubmittingRating}
              >
                {isSubmittingRating ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </div>{" "}
        </div>
      )}
      {/* Toast notification for completion confirmation */}
      {showToast && (
        <div className="toast-notification">
          <FaCheck />
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function ProtectedAppointmentList() {
  return (
    <RequireMembership allowedMemberships={["premium", "pro"]} showModal={true}>
      <AppointmentList />
    </RequireMembership>
  );
}
