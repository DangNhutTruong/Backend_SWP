import React, { useEffect, useRef } from 'react';
import '../styles/JitsiMeeting.css';

const JitsiMeeting = ({ roomName, style = {}, onLeave }) => {
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Ẩn thanh navigation và khóa màn hình khi vào cuộc gọi
    const lockScreenOrientation = async () => {
      try {
        // Chỉ áp dụng trên thiết bị di động
        if (window.screen && window.screen.orientation) {
          await window.screen.orientation.lock('landscape');
        }
        
        // Vào chế độ toàn màn hình nếu trình duyệt hỗ trợ
        const elem = containerRef.current;
        if (elem && elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem && elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem && elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
        } else if (elem && elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
        
        // Ẩn thanh navigation (nếu có)
        document.body.style.overflow = 'hidden';
      } catch (err) {
        console.log('Không thể khóa màn hình:', err);
      }
    };
    
    if (roomName) {
      lockScreenOrientation();
      document.body.classList.add('jitsi-meeting-active');
    }

    // Cleanup: leave call by removing iframe src and exit fullscreen
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = '';
      }
      
      // Thoát khỏi chế độ toàn màn hình
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      
      // Khôi phục thanh navigation
      document.body.style.overflow = '';
      document.body.classList.remove('jitsi-meeting-active');
      
      // Mở khóa màn hình
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.unlock();
      }
    };
  }, [roomName]);

  if (!roomName) return null;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        background: '#000',
        zIndex: 9999,
        overflow: 'hidden',
        ...style,
      }}
      className="jitsi-container"
    >
      <iframe
        ref={iframeRef}
        src={`https://meet.jit.si/${roomName}`}
        allow="camera; microphone; fullscreen; display-capture; screen-wake-lock"
        style={{
          width: '100%',
          height: '100%',
          border: 0,
        }}
        title="Jitsi Meeting"
        allowFullScreen
      />
      {/* {onLeave && (
        <button
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 10000,
            padding: '10px 20px',
            background: '#e74c3c',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 16,
            cursor: 'pointer',
          }}
          onClick={onLeave}
        >
          Rời khỏi cuộc gọi
        </button>
      )} */}
    </div>
  );
};

export default JitsiMeeting;
