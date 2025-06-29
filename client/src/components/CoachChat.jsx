import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaPaperPlane, FaUser } from "react-icons/fa";
import "../styles/CoachChat.css";
import apiService from "../utils/apiService";

const CoachChat = ({ coach, appointment, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Load messages from API instead of localStorage
  useEffect(() => {
    if (isOpen && coach && coach.id) {
      setIsLoading(true);
      setError(null);

      apiService.messages
        .getConversation(coach.id)
        .then((response) => {
          if (response.success && response.data) {
            setMessages(
              response.data.map((msg) => ({
                id: msg.MessageID,
                text: msg.MessageText,
                sender: msg.SenderUserID === coach.id ? "coach" : "user",
                timestamp: new Date(msg.SentAt),
              }))
            );
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error loading messages:", err);
          setError("Không thể tải tin nhắn. Vui lòng thử lại sau.");
          setIsLoading(false);

          // Fallback to localStorage if API fails
          fallbackToLocalStorage();
        });
    }
  }, [isOpen, coach]);

  // Fallback function to use localStorage data if API fails
  const fallbackToLocalStorage = () => {
    try {
      if (appointment && appointment.id) {
        const chatKey = `coach_chat_${appointment.id}`;
        const savedMessagesString = localStorage.getItem(chatKey);

        if (savedMessagesString) {
          try {
            const savedMessages = JSON.parse(savedMessagesString);
            if (Array.isArray(savedMessages) && savedMessages.length > 0) {
              setMessages(savedMessages);
              return;
            }
          } catch (jsonError) {
            console.error(
              "Error parsing chat messages from localStorage:",
              jsonError
            );
          }
        }

        // If we get here, either there were no messages or parsing failed
        const welcomeMessage = {
          id: 1,
          text: `Xin chào! Tôi là ${
            coach?.name || "coach"
          }, coach hỗ trợ cai thuốc của bạn. Bạn có thể đặt câu hỏi hoặc chia sẻ trải nghiệm của mình về quá trình cai thuốc ở đây.`,
          sender: "coach",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error("Error in fallbackToLocalStorage:", error);
      // Display a minimal UI in worst case
      setMessages([
        {
          id: 1,
          text: "Xin chào! Bạn có thể đặt câu hỏi tại đây.",
          sender: "coach",
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim() === "" || !coach) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    // Send to API instead of just localStorage
    if (coach.id) {
      apiService.messages
        .send({
          receiverId: coach.id,
          text: input,
        })
        .catch((err) => {
          console.error("Error sending message:", err);
          // Could show an error toast here
        });
    }

    // Fallback to localStorage
    if (appointment) {
      const chatKey = `coach_chat_${appointment.id}`;
      localStorage.setItem(chatKey, JSON.stringify(newMessages));
    }

    // Simulate coach response after a delay (this would be handled by real-time notifications in production)
    setTimeout(() => {
      const autoResponses = [
        "Cảm ơn bạn đã chia sẻ! Tôi hiểu rằng quá trình cai thuốc có nhiều thách thức.",
        "Điều đó rất đáng khích lệ! Hãy tiếp tục kiên trì nhé.",
        "Tôi sẽ ghi nhận vấn đề này và hỗ trợ bạn trong buổi tư vấn tới.",
        "Đó là một tiến bộ đáng kể! Hãy duy trì động lực này bạn nhé.",
        "Đừng lo lắng, việc có khó khăn là điều bình thường. Chúng ta sẽ cùng vượt qua.",
        "Tôi ghi nhận ý kiến của bạn và sẽ cung cấp thêm thông tin trong buổi hẹn.",
      ];

      const randomResponse =
        autoResponses[Math.floor(Math.random() * autoResponses.length)];

      const coachMessage = {
        id: newMessages.length + 1,
        text: randomResponse,
        sender: "coach",
        timestamp: new Date(),
      };

      const updatedMessages = [...newMessages, coachMessage];
      setMessages(updatedMessages);

      // Save coach response to localStorage
      if (appointment) {
        const chatKey = `coach_chat_${appointment.id}`;
        localStorage.setItem(chatKey, JSON.stringify(updatedMessages));

        // Mark message as unread if chat is not visible
        markMessageAsUnread();
      }
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Function to mark a new message from coach as unread if chat is not open
  const markMessageAsUnread = () => {
    if (!isOpen && appointment) {
      const unreadKey = `unread_messages_${appointment.id}`;
      const currentUnreadCount = localStorage.getItem(unreadKey) || "0";
      const newUnreadCount = parseInt(currentUnreadCount) + 1;
      localStorage.setItem(unreadKey, newUnreadCount.toString());
    }
  };

  if (!isOpen || !appointment || !coach) {
    // Return null but log the reason
    if (!isOpen) console.log("Chat is not open");
    if (!appointment) console.log("Missing appointment data in CoachChat");
    if (!coach) console.log("Missing coach data in CoachChat");
    return null;
  }

  // Đảm bảo coach có đầy đủ thông tin hiển thị
  const safeCoach = {
    name: coach.name || "Coach",
    avatar: coach.avatar || "https://via.placeholder.com/40",
    role: coach.role || "Cố vấn cai thuốc",
    id: coach.id,
  };

  return (
    <div className="coach-chat-overlay">
      <div className="coach-chat-container">
        <div className="coach-chat-header">
          <div className="coach-chat-title">
            <div className="coach-avatar-small">
              <img src={safeCoach.avatar} alt={safeCoach.name} />
              <div className="coach-status online"></div>
            </div>
            <div>
              <h3>{safeCoach.name}</h3>
              <p>{safeCoach.role}</p>
            </div>
          </div>
          <button className="coach-chat-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="coach-chat-messages">
          {isLoading ? (
            <div className="chat-loading">Đang tải tin nhắn...</div>
          ) : error ? (
            <div className="chat-error">{error}</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">Chưa có tin nhắn nào</div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`message ${
                  message.sender === "coach" ? "coach-message" : "user-message"
                }`}
              >
                {message.sender === "coach" && (
                  <div className="coach-avatar-mini">
                    <img src={safeCoach.avatar} alt={safeCoach.name} />
                  </div>
                )}

                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">
                    {formatTime(message.timestamp)}
                  </span>
                </div>

                {message.sender === "user" && (
                  <div className="user-avatar">
                    <FaUser />
                  </div>
                )}
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="coach-chat-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn của bạn..."
          />
          <button className="send-button" onClick={handleSendMessage}>
            <FaPaperPlane />
          </button>
        </div>

        <div className="coach-chat-footer">
          <p>
            Thời gian phản hồi thông thường: <strong>15-30 phút</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoachChat;
