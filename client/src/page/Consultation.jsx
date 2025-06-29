import React, { useState } from "react";
import {
  FaPhoneAlt,
  FaComments,
  FaVideo,
  FaCalendarAlt,
  FaUserMd,
  FaClock,
  FaCheckCircle,
  FaHeadset,
  FaWhatsapp,
} from "react-icons/fa";
import "./Consultation.css";

const Consultation = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [consultationForm, setConsultationForm] = useState({
    name: "",
    phone: "",
    email: "",
    serviceType: "",
    preferredTime: "",
    message: "",
    urgency: "normal",
  });

  // Dữ liệu các dịch vụ tư vấn
  const consultationServices = [
    {
      id: "hotline",
      title: "Hotline Hỗ trợ 24/7",
      description: "Gọi ngay để được tư vấn trực tiếp",
      phone: "1800-1098",
      icon: <FaPhoneAlt />,
      available: true,
      responseTime: "Ngay lập tức",
      features: [
        "Tư vấn miễn phí",
        "Hỗ trợ 24/7",
        "Chuyên gia có kinh nghiệm",
        "Bảo mật thông tin",
      ],
    },
    {
      id: "chat",
      title: "Chat Tư vấn Online",
      description: "Chat trực tiếp với chuyên gia",
      icon: <FaComments />,
      available: true,
      responseTime: "2-5 phút",
      features: [
        "Chat realtime",
        "Lưu lại lịch sử tư vấn",
        "Chia sẻ hình ảnh/tài liệu",
        "Tư vấn chuyên sâu",
      ],
    },
    {
      id: "video",
      title: "Video Call Tư vấn",
      description: "Gặp mặt trực tiếp qua video call",
      icon: <FaVideo />,
      available: true,
      responseTime: "Đặt lịch trước",
      features: [
        "Tương tác trực tiếp",
        "Đánh giá sức khỏe",
        "Tư vấn chi tiết",
        "Ghi lại buổi tư vấn",
      ],
    },
    {
      id: "appointment",
      title: "Đặt lịch Tư vấn",
      description: "Đặt lịch hẹn với chuyên gia",
      icon: <FaCalendarAlt />,
      available: true,
      responseTime: "Theo lịch hẹn",
      features: [
        "Chọn thời gian phù hợp",
        "Chuyên gia riêng biệt",
        "Tư vấn chuyên sâu",
        "Follow-up định kỳ",
      ],
    },
  ];

  // Danh sách chuyên gia
  const experts = [
    {
      id: 1,
      name: "BS. Nguyễn Văn A",
      specialty: "Chuyên gia cai thuốc lá",
      experience: "15 năm kinh nghiệm",
      image: "/image/experts/doctor1.jpg",
      rating: 4.9,
      reviews: 1250,
      available: true,
    },
    {
      id: 2,
      name: "BS. Trần Thị B",
      specialty: "Tâm lý học lâm sàng",
      experience: "12 năm kinh nghiệm",
      image: "/image/experts/doctor2.jpg",
      rating: 4.8,
      reviews: 890,
      available: true,
    },
    {
      id: 3,
      name: "Coach Lê Văn C",
      specialty: "Huấn luyện viên cá nhân",
      experience: "8 năm kinh nghiệm",
      image: "/image/experts/coach1.jpg",
      rating: 4.7,
      reviews: 560,
      available: false,
    },
  ];

  // Xử lý form tư vấn
  const handleFormChange = (e) => {
    setConsultationForm({
      ...consultationForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setConsultationForm({
      ...consultationForm,
      serviceType: service.id,
    });
  };

  const handleSubmitConsultation = (e) => {
    e.preventDefault();
    if (!consultationForm.name || !consultationForm.phone) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    // Simulate sending consultation request
    alert(
      `Đã gửi yêu cầu tư vấn thành công!\n\nChúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.\nDịch vụ: ${selectedService?.title}\nThời gian phản hồi: ${selectedService?.responseTime}`
    );
    setConsultationForm({
      name: "",
      phone: "",
      email: "",
      serviceType: "",
      preferredTime: "",
      message: "",
      urgency: "normal",
    });
    setSelectedService(null);
  };

  const handleCallNow = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = () => {
    const message = "Xin chào, tôi cần tư vấn về cai thuốc lá";
    const whatsappUrl = `https://wa.me/84901234567?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="consultation-container">
      {/* Hero Section */}
      <section className="consultation-hero">
        <div className="hero-content">
          <h1>Tư vấn Chuyên nghiệp</h1>
          <p>
            Được hỗ trợ bởi đội ngũ chuyên gia giàu kinh nghiệm trong việc cai
            thuốc lá
          </p>
          {/* Quick Actions */}
          <div className="quick-actions">
            <button
              className="quick-action-btn primary"
              onClick={() => handleCallNow("1800-1098")}
            >
              <FaPhoneAlt />
              <div>
                <span>Hotline 24/7</span>
                <strong>1800-1098</strong>
              </div>
            </button>
            <button
              className="quick-action-btn secondary"
              onClick={handleWhatsApp}
            >
              <FaWhatsapp />
              <div>
                <span>WhatsApp</span>
                <strong>Chat ngay</strong>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="consultation-services">
        <div className="container">
          <h2>Chọn Hình thức Tư vấn</h2>
          <p>
            Chúng tôi cung cấp nhiều hình thức tư vấn để phù hợp với nhu cầu của
            bạn
          </p>
          <div className="services-grid">
            {consultationServices.map((service) => (
              <div
                key={service.id}
                className={`service-card ${
                  selectedService?.id === service.id ? "selected" : ""
                }`}
                onClick={() => handleServiceSelect(service)}
              >
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <div className="service-info">
                  <div className="response-time">
                    <FaClock />
                    <span>{service.responseTime}</span>
                  </div>
                  <div
                    className={`availability ${
                      service.available ? "available" : "unavailable"
                    }`}
                  >
                    <FaCheckCircle />
                    <span>{service.available ? "Sẵn sàng" : "Bận"}</span>
                  </div>
                </div>
                <ul className="service-features">
                  {service.features.map((feature, index) => (
                    <li key={index}>
                      <FaCheckCircle />
                      {feature}
                    </li>
                  ))}
                </ul>
                {service.phone && (
                  <button
                    className="call-now-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCallNow(service.phone);
                    }}
                  >
                    <FaPhoneAlt />
                    Gọi ngay {service.phone}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experts Section */}
      <section className="consultation-experts">
        <div className="container">
          <h2>Đội ngũ Chuyên gia</h2>
          <div className="experts-grid">
            {experts.map((expert) => (
              <div key={expert.id} className="expert-card">
                <div className="expert-avatar">
                  <img src={expert.image} alt={expert.name} />
                  <div
                    className={`status-indicator ${
                      expert.available ? "online" : "offline"
                    }`}
                  >
                    {expert.available ? "●" : "○"}
                  </div>
                </div>
                <div className="expert-info">
                  <h3>{expert.name}</h3>
                  <p className="specialty">{expert.specialty}</p>
                  <p className="experience">{expert.experience}</p>
                  <div className="rating">
                    <span>⭐ {expert.rating}</span>
                    <span>({expert.reviews} đánh giá)</span>
                  </div>
                  <div className="expert-status">
                    {expert.available ? (
                      <span className="available">Sẵn sàng tư vấn</span>
                    ) : (
                      <span className="unavailable">Đang bận</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Consultation Form */}
      {selectedService && (
        <section className="consultation-form-section">
          <div className="container">
            <h2>Đăng ký Tư vấn - {selectedService.title}</h2>
            <form
              className="consultation-form"
              onSubmit={handleSubmitConsultation}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Họ và tên *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={consultationForm.name}
                    onChange={handleFormChange}
                    required
                    placeholder="Nhập họ và tên của bạn"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={consultationForm.phone}
                    onChange={handleFormChange}
                    required
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={consultationForm.email}
                    onChange={handleFormChange}
                    placeholder="Nhập email (tùy chọn)"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="preferredTime">Thời gian mong muốn</label>
                  <select
                    id="preferredTime"
                    name="preferredTime"
                    value={consultationForm.preferredTime}
                    onChange={handleFormChange}
                  >
                    <option value="">Chọn thời gian</option>
                    <option value="morning">Buổi sáng (8:00 - 12:00)</option>
                    <option value="afternoon">
                      Buổi chiều (13:00 - 17:00)
                    </option>
                    <option value="evening">Buổi tối (18:00 - 21:00)</option>
                    <option value="anytime">Bất kỳ lúc nào</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="urgency">Mức độ cấp thiết</label>
                  <select
                    id="urgency"
                    name="urgency"
                    value={consultationForm.urgency}
                    onChange={handleFormChange}
                  >
                    <option value="normal">Bình thường</option>
                    <option value="urgent">Cấp thiết</option>
                    <option value="emergency">Khẩn cấp</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label htmlFor="message">Mô tả vấn đề cần tư vấn</label>
                  <textarea
                    id="message"
                    name="message"
                    value={consultationForm.message}
                    onChange={handleFormChange}
                    rows="4"
                    placeholder="Chia sẻ về tình trạng hiện tại và những gì bạn cần hỗ trợ..."
                  ></textarea>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setSelectedService(null)}>
                  Quay lại
                </button>
                <button type="submit" className="submit-btn">
                  Gửi yêu cầu tư vấn
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Emergency Contact */}
      <section className="emergency-contact">
        <div className="container">
          <div className="emergency-card">
            <FaHeadset className="emergency-icon" />
            <div className="emergency-content">
              <h3>Cần hỗ trợ khẩn cấp?</h3>
              <p>
                Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7
              </p>
            </div>
            <div className="emergency-actions">
              <button
                className="emergency-btn"
                onClick={() => handleCallNow("1800-1098")}
              >
                <FaPhoneAlt />
                Gọi ngay 1800-1098
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Consultation;
