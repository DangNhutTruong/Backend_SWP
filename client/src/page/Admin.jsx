import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, Alert, Progress, Space, Divider, List, Table, Tooltip, Avatar, Tag, Tabs, Modal, Button, Form, Input, Select, DatePicker, TimePicker, Badge, Switch } from 'antd';
import { UserAddOutlined, DollarOutlined, TeamOutlined, CalendarOutlined, FileAddOutlined, TrophyOutlined, MessageOutlined, ArrowUpOutlined, ArrowDownOutlined, CheckCircleOutlined, ClockCircleOutlined, FallOutlined, HeartOutlined, SolutionOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';
import api from '../utils/api';
import './Admin.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

export default function Admin() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    activeCoaches: 0,
    membershipCount: 0,
    blogPostsCount: 0,
    usersChange: 0,
    revenueChange: 0,
    newUsersThisWeek: 0,
    successfulQuitAttempts: 0,
    totalAppointments: 0,
    totalPayments: 0,
    communityPosts: 0,
    achievements: 0
  });
  
  const [monthlyGrowth, setMonthlyGrowth] = useState([]);
  const [membershipDistribution, setMembershipDistribution] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [paymentStats, setPaymentStats] = useState({});

  // Coach Management State
  const [coaches, setCoaches] = useState([]);
  const [coachStats, setCoachStats] = useState({
    totalCoaches: 0,
    activeCoaches: 0,
    avgRating: 0,
    totalAppointments: 0
  });
  const [coachAvailability, setCoachAvailability] = useState({});
  const [coachFeedback, setCoachFeedback] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isLoading, setIsLoading] = useState({
    coaches: false,
    availability: false,
    feedback: false
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); // 'view', 'edit', 'availability'

  useEffect(() => {
    // Simulate fetching data from API
    fetchMetrics();
    fetchMonthlyGrowth();
    fetchMembershipDistribution();
    fetchRecentActivities();
    fetchProgressData();
    fetchPaymentStats();
    
    // Fetch coach data
    fetchCoaches();
  }, []);

  const fetchMetrics = async () => {
    try {
      console.log('Fetching metrics from API...');
      const response = await api.fetch('/api/admin/metrics');
      
      if (response.success && response.data) {
        console.log('Received metrics data:', response.data);
        setMetrics(response.data);
      } else {
        console.error('Invalid response format from API:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      alert('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
    }
  };
  
  const fetchProgressData = async () => {
    try {
      console.log('Fetching progress data from API...');
      const response = await api.fetch('/api/admin/progress');
      
      if (response.success && response.data) {
        console.log('Received progress data:', response.data);
        setProgressData(response.data);
      } else {
        console.error('Invalid response format from API:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
      alert('Không thể tải dữ liệu tiến độ. Vui lòng thử lại sau.');
    }
  };

  const fetchPaymentStats = async () => {
    try {
      console.log('Fetching payment statistics from API...');
      const response = await api.fetch('/api/admin/payments/stats');
      
      if (response.success && response.data) {
        console.log('Received payment statistics:', response.data);
        setPaymentStats(response.data);
      } else {
        console.error('Invalid response format from API:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      alert('Không thể tải dữ liệu thống kê thanh toán. Vui lòng thử lại sau.');
    }
  };

  const fetchMonthlyGrowth = async () => {
    try {
      console.log('Fetching monthly growth data from API...');
      const response = await api.fetch('/api/admin/monthly-growth');
      
      if (response.success && Array.isArray(response.data)) {
        console.log('Received monthly growth data:', response.data);
        setMonthlyGrowth(response.data);
      } else {
        console.error('Invalid response format from API:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching monthly growth data:', error);
      alert('Không thể tải dữ liệu tăng trưởng hàng tháng. Vui lòng thử lại sau.');
    }
  };

  const fetchMembershipDistribution = async () => {
    try {
      console.log('Fetching membership distribution data from API...');
      const response = await api.fetch('/api/admin/membership-distribution');
      
      if (response.success && response.data) {
        console.log('Received membership distribution data:', response.data);
        setMembershipDistribution(response.data);
      } else {
        console.error('Invalid response format from API:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching membership distribution data:', error);
      alert('Không thể tải dữ liệu phân phối gói thành viên. Vui lòng thử lại sau.');
    }
  };

  const fetchRecentActivities = async () => {
    try {
      console.log('Fetching recent activities from API...');
      const response = await api.fetch('/api/admin/recent-activities');
      
      if (response.success && Array.isArray(response.data)) {
        console.log('Received recent activities:', response.data);
        
        // Map activity types to icons
        const activities = response.data.map(activity => {
          let icon;
          switch (activity.type) {
            case 'user':
              icon = <UserAddOutlined style={{ color: '#1890ff' }} />;
              break;
            case 'payment':
              icon = <DollarOutlined style={{ color: '#52c41a' }} />;
              break;
            case 'appointment':
              icon = <CalendarOutlined style={{ color: '#eb2f96' }} />;
              break;
            case 'blog':
              icon = <FileAddOutlined style={{ color: '#722ed1' }} />;
              break;
            case 'progress':
              icon = <TrophyOutlined style={{ color: '#faad14' }} />;
              break;
            case 'coach':
              icon = <TeamOutlined style={{ color: '#fa8c16' }} />;
              break;
            case 'community':
              icon = <MessageOutlined style={{ color: '#13c2c2' }} />;
              break;
            default:
              icon = <MessageOutlined style={{ color: '#1890ff' }} />;
          }
          return { ...activity, icon };
        });
        
        setRecentActivities(activities);
      } else {
        console.error('Invalid response format from API:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      alert('Không thể tải dữ liệu hoạt động gần đây. Vui lòng thử lại sau.');
    }
  };

  // Coach Management Functions
  const fetchCoaches = async () => {
    setIsLoading({...isLoading, coaches: true});
    try {
      // Fetch coaches from API
      console.log('Fetching coaches from API...');
      const response = await api.fetch('/api/coaches');
      
      if (response.success && Array.isArray(response.data)) {
        console.log('Received coaches data:', response.data);
        const coachesData = response.data.filter(coach => coach.role === 'coach');
        setCoaches(coachesData);
        
        // Calculate coach statistics
        const activeCoaches = coachesData.filter(coach => coach.is_active === 1).length;
        const totalRatings = coachesData.reduce((sum, coach) => sum + (parseFloat(coach.avg_rating) || 0), 0);
        const avgRating = coachesData.length > 0 ? (totalRatings / coachesData.length).toFixed(1) : 0;
        
        // Get total appointments and stats from admin API
        console.log('Fetching appointment stats...');
        const coachStatsResponse = await api.fetch('/api/admin/coaches/stats');
        const appointmentsResponse = await api.fetch('/api/admin/appointments/stats');
        
        const totalAppointments = appointmentsResponse.success ? appointmentsResponse.data.total : 0;
        
        setCoachStats({
          totalCoaches: coachesData.length,
          activeCoaches,
          avgRating: coachStatsResponse.success ? coachStatsResponse.data.avgRating : avgRating,
          totalAppointments
        });
        
        console.log('Coach data loaded successfully');
      } else {
        console.error('Invalid response format from API:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
      alert('Không thể tải dữ liệu huấn luyện viên. Vui lòng thử lại sau.');
    } finally {
      setIsLoading({...isLoading, coaches: false});
    }
  };
  
  const fetchCoachAvailability = async (coachId) => {
    setIsLoading({...isLoading, availability: true});
    try {
      console.log(`Fetching availability for coach ${coachId}`);
      const response = await api.fetch(`/api/coaches/${coachId}/availability`);
      
      if (response.success && response.data) {
        console.log(`Received availability data for coach ${coachId}:`, response.data);
        setCoachAvailability({
          ...coachAvailability,
          [coachId]: response.data
        });
      } else {
        console.error(`Failed to get availability data for coach ${coachId}:`, response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(`Error fetching availability for coach ${coachId}:`, error);
      alert(`Không thể tải lịch làm việc của huấn luyện viên. Vui lòng thử lại sau.`);
    } finally {
      setIsLoading({...isLoading, availability: false});
    }
  };
  
  const fetchCoachFeedback = async (coachId) => {
    setIsLoading({...isLoading, feedback: true});
    try {
      console.log(`Fetching feedback for coach ${coachId}`);
      const response = await api.fetch(`/api/coaches/${coachId}/reviews`);
      
      if (response.success && Array.isArray(response.data)) {
        console.log(`Received feedback data for coach ${coachId}:`, response.data);
        setCoachFeedback(response.data);
      } else {
        console.error(`Failed to get feedback data for coach ${coachId}:`, response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(`Error fetching feedback for coach ${coachId}:`, error);
      alert(`Không thể tải đánh giá của huấn luyện viên. Vui lòng thử lại sau.`);
    } finally {
      setIsLoading({...isLoading, feedback: false});
    }
  };

  const showCoachModal = (coach, type) => {
    setSelectedCoach(coach);
    setModalType(type);
    setIsModalVisible(true);
    
    if (type === 'view' || type === 'edit') {
      fetchCoachAvailability(coach.id);
      fetchCoachFeedback(coach.id);
    }
  };

  const handleModalOk = () => {
    // Handle modal OK action (e.g., save changes)
    setIsModalVisible(false);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };
  
  const handleCoachUpdate = async (values) => {
    try {
      console.log('Updating coach with values:', values);
      
      if (!selectedCoach) {
        // Creating a new coach
        console.log('Creating new coach');
        const response = await api.fetch('/api/admin/coaches', {
          method: 'POST',
          body: JSON.stringify({
            full_name: values.full_name,
            email: values.email,
            phone: values.phone,
            gender: values.gender,
            bio: values.bio,
            experience: values.experience,
            specialization: values.specialization,
            is_active: values.is_active ? 1 : 0,
            // For new coaches, you might want to set a default password
            password: 'defaultpassword123' // This should be changed by the coach later
          })
        });
        
        if (response.success) {
          alert('Thêm huấn luyện viên mới thành công!');
          // Refresh coach list
          fetchCoaches();
        } else {
          throw new Error(response.message || 'Failed to create coach');
        }
      } else {
        // Updating existing coach
        console.log('Updating existing coach:', selectedCoach.id);
        const response = await api.fetch(`/api/admin/coaches/${selectedCoach.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            full_name: values.full_name,
            email: values.email,
            phone: values.phone,
            gender: values.gender,
            bio: values.bio,
            experience: values.experience,
            specialization: values.specialization,
            is_active: values.is_active ? 1 : 0
          })
        });
        
        if (response.success) {
          // Update the coach in the local state to avoid refetching
          setCoaches(coaches.map(coach => 
            coach.id === selectedCoach.id ? {...coach, ...values} : coach
          ));
          alert('Cập nhật thông tin huấn luyện viên thành công!');
        } else {
          throw new Error(response.message || 'Failed to update coach');
        }
      }
      
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error updating/creating coach:', error);
      alert(`Lỗi: ${error.message || 'Không thể cập nhật thông tin huấn luyện viên'}`);
    }
  };
  
  const handleAvailabilityUpdate = async (values) => {
    try {
      console.log('Updating coach availability with values:', values);
      const slots = values.available_slots || [];
      
      if (!selectedCoach || !selectedCoach.id) {
        throw new Error('No coach selected');
      }
      
      // We'll need to create a new endpoint for this in the backend
      // For now, we'll assume the endpoint exists
      const response = await api.fetch(`/api/admin/coaches/${selectedCoach.id}/availability`, {
        method: 'PUT',
        body: JSON.stringify({
          available_slots: slots
        })
      });
      
      if (response.success) {
        // Update the availability in the local state
        setCoachAvailability({
          ...coachAvailability,
          [selectedCoach.id]: values
        });
        
        alert('Cập nhật lịch làm việc thành công!');
      } else {
        throw new Error(response.message || 'Failed to update availability');
      }
      
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error updating availability:', error);
      alert(`Lỗi: ${error.message || 'Không thể cập nhật lịch làm việc'}`);
    }
  };
  
  // Coach Table Columns
  const coachColumns = [
    {
      title: 'Họ và tên',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar src={record.avatar_url || '/image/default-user-avatar.svg'} />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Chuyên môn',
      dataIndex: 'specialization',
      key: 'specialization',
      render: (text) => text || 'Chưa cập nhật',
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      render: (text) => (
        <span>
          {text ? `${text} ★` : 'Chưa có'}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" onClick={() => handleViewCoach(record)}>
            Xem
          </Button>
          <Button onClick={() => handleEditClick(record)}>Sửa</Button>
          <Button onClick={() => handleAvailabilityClick(record)}>Lịch làm việc</Button>
        </Space>
      ),
    },
  ];

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-container">
        <Card>
          <Alert
            message="Quyền truy cập bị từ chối"
            description="Bạn cần có quyền quản trị để truy cập trang này."
            type="error"
            showIcon
          />
        </Card>
      </div>
    );
  }

  // No chart configs needed as we're using standard Ant Design components

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <Title level={2}>Bảng điều khiển</Title>
        <Paragraph>
          Tổng quan về dữ liệu và hoạt động của hệ thống NoSmoke.
        </Paragraph>
      </div>

      {/* Key Metrics Section */}
      <Row gutter={[16, 16]} className="key-metrics">
        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <Card className="metric-card">
            <Statistic
              title="👥 Tổng số người dùng"
              value={metrics.totalUsers}
              valueStyle={{ color: '#1890ff' }}
              prefix={metrics.usersChange > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix={`${Math.abs(metrics.usersChange)}%`}
            />
            <Text type="secondary">So với tháng trước</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <Card className="metric-card">
            <Statistic
              title="💰 Tổng doanh thu"
              value={metrics.totalRevenue}
              valueStyle={{ color: '#52c41a' }}
              prefix={metrics.revenueChange > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix={`${Math.abs(metrics.revenueChange)}%`}
              formatter={(value) => `${(value / 1000000).toFixed(2)} tr đ`}
            />
            <Text type="secondary">So với tháng trước</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <Card className="metric-card">
            <Statistic
              title="🧑‍💼 Số huấn luyện viên"
              value={metrics.activeCoaches}
              valueStyle={{ color: '#fa8c16' }}
            />
            <Text type="secondary">Đang hoạt động</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <Card className="metric-card">
            <Statistic
              title="📅 Cuộc hẹn"
              value={metrics.totalAppointments}
              valueStyle={{ color: '#eb2f96' }}
            />
            <Text type="secondary">Đã đặt lịch</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <Card className="metric-card">
            <Statistic
              title="🏆 Thành tựu"
              value={metrics.achievements}
              valueStyle={{ color: '#faad14' }}
            />
            <Text type="secondary">Loại huy hiệu</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6} xl={4}>
          <Card className="metric-card">
            <Statistic
              title="📝 Bài viết & Thảo luận"
              value={metrics.blogPostsCount + metrics.communityPosts}
              valueStyle={{ color: '#13c2c2' }}
            />
            <Text type="secondary">Blog ({metrics.blogPostsCount}) & Cộng đồng ({metrics.communityPosts})</Text>
          </Card>
        </Col>
      </Row>

      {/* Membership and Payment Stats */}
      <Row gutter={[16, 16]} className="data-visualization">
        <Col xs={24} md={12}>
          <Card 
            title={
              <Space>
                <DollarOutlined /> Thống kê giao dịch
              </Space>
            } 
            className="chart-card"
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="Giao dịch thành công"
                  value={paymentStats.completed || 0}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Giao dịch đang xử lý"
                  value={paymentStats.pending || 0}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Giao dịch thất bại"
                  value={(paymentStats.failed || 0) + (paymentStats.refunded || 0)}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<FallOutlined />}
                />
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Giá trị trung bình"
                  value={paymentStats.avgTransactionAmount || 0}
                  precision={0}
                  valueStyle={{ color: '#1890ff' }}
                  formatter={(value) => `${(value / 1000).toFixed(0)}k đ`}
                />
              </Col>
              <Col span={12}>
                <Tooltip title="ZaloPay, MoMo, Chuyển khoản ngân hàng">
                  <Statistic
                    title="Phương thức thanh toán"
                    value={3}
                    valueStyle={{ color: '#722ed1' }}
                    suffix="phương thức"
                  />
                </Tooltip>
              </Col>
            </Row>

            <Divider />
            
            <div>
              <Title level={5}>Phân bổ phương thức thanh toán</Title>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div style={{textAlign: 'center'}}>
                    <Progress 
                      type="circle" 
                      percent={Math.round((paymentStats.paymentMethods?.zalopay || 0) / metrics.totalPayments * 100)} 
                      size="small"
                      format={() => 'ZaloPay'}
                      strokeColor="#2673dd"
                    />
                    <div style={{marginTop: 10}}>{paymentStats.paymentMethods?.zalopay || 0} giao dịch</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{textAlign: 'center'}}>
                    <Progress 
                      type="circle" 
                      percent={Math.round((paymentStats.paymentMethods?.momo || 0) / metrics.totalPayments * 100)} 
                      size="small"
                      format={() => 'MoMo'}
                      strokeColor="#d82d8b"
                    />
                    <div style={{marginTop: 10}}>{paymentStats.paymentMethods?.momo || 0} giao dịch</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{textAlign: 'center'}}>
                    <Progress 
                      type="circle" 
                      percent={Math.round((paymentStats.paymentMethods?.banking || 0) / metrics.totalPayments * 100)} 
                      size="small"
                      format={() => 'Banking'}
                      strokeColor="#52c41a"
                    />
                    <div style={{marginTop: 10}}>{paymentStats.paymentMethods?.banking || 0} giao dịch</div>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card 
            title={
              <Space>
                <PieChartOutlined /> Phân bổ gói thành viên
              </Space>
            } 
            className="chart-card"
          >
            {Object.keys(membershipDistribution).length > 0 && (
              <>
                <div className="membership-distribution">
                  <div className="membership-item">
                    <div className="membership-color" style={{ backgroundColor: '#5B8FF9' }} />
                    <div className="membership-detail">
                      <div className="membership-name">Free</div>
                      <div className="membership-count">{membershipDistribution.free.count} người dùng</div>
                      <Progress 
                        percent={membershipDistribution.free.percentage}
                        strokeColor="#5B8FF9"
                        showInfo={false}
                      />
                    </div>
                  </div>
                  <div className="membership-item">
                    <div className="membership-color" style={{ backgroundColor: '#5CD65C' }} />
                    <div className="membership-detail">
                      <div className="membership-name">Basic</div>
                      <div className="membership-count">{membershipDistribution.basic.count} người dùng</div>
                      <Progress 
                        percent={membershipDistribution.basic.percentage}
                        strokeColor="#5CD65C"
                        showInfo={false}
                      />
                    </div>
                  </div>
                  <div className="membership-item">
                    <div className="membership-color" style={{ backgroundColor: '#FFBF00' }} />
                    <div className="membership-detail">
                      <div className="membership-name">Premium</div>
                      <div className="membership-count">{membershipDistribution.premium.count} người dùng</div>
                      <Progress 
                        percent={membershipDistribution.premium.percentage}
                        strokeColor="#FFBF00"
                        showInfo={false}
                      />
                    </div>
                  </div>
                </div>

                <Divider />

                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic
                      title="Người dùng Free"
                      value={membershipDistribution.free.count}
                      valueStyle={{ color: '#5B8FF9' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Người dùng Basic"
                      value={membershipDistribution.basic.count}
                      valueStyle={{ color: '#5CD65C' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Người dùng Premium"
                      value={membershipDistribution.premium.count}
                      valueStyle={{ color: '#FFBF00' }}
                    />
                  </Col>
                </Row>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* Monthly Growth Chart - No changes needed */}

      {/* Recent Activities Section */}
      <Card title="📊 Hoạt động gần đây" className="recent-activities">
        <List
          dataSource={recentActivities}
          renderItem={item => (
            <List.Item key={item.id}>
              <List.Item.Meta
                avatar={<Avatar icon={item.icon} />}
                title={item.description}
                description={item.time}
              />
            </List.Item>
          )}
        />
      </Card>

      {/* User Progress and Challenges - No changes needed */}

      {/* Coach Management Section */}
      <Card title="👨‍🏫 Quản lý huấn luyện viên" className="coach-management">
        <Button 
          type="primary" 
          icon={<UserAddOutlined />} 
          onClick={() => { setSelectedCoach(null); setIsModalVisible(true); setModalType('edit'); }}
          style={{ marginBottom: 16 }}
        >
          Thêm huấn luyện viên
        </Button>

        <Table
          dataSource={coaches}
          rowKey="id"
          loading={isLoading.coaches}
          pagination={false}
          bordered
          columns={coachColumns}
        />

        <Modal
          title={modalType === 'edit' ? (selectedCoach ? 'Chỉnh sửa huấn luyện viên' : 'Thêm huấn luyện viên') : 'Thông tin huấn luyện viên'}
          visible={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          footer={modalType === 'view' ? null : undefined}
          width={800}
        >
          {modalType !== 'view' && (
            <Form
              layout="vertical"
              initialValues={selectedCoach}
              onFinish={handleModalOk}
            >
              <Form.Item
                name="name"
                label="Tên"
                rules={[{ required: true, message: 'Vui lòng nhập tên huấn luyện viên' }]}
              >
                <Input placeholder="Nhập tên huấn luyện viên" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>

              <Form.Item
                name="specialization"
                label="Chuyên môn"
              >
                <Input placeholder="Ví dụ: Cai thuốc lá, Sức khỏe tinh thần, v.v." />
              </Form.Item>

              <Form.Item
                name="experience"
                label="Kinh nghiệm"
              >
                <Input placeholder="Ví dụ: 5 năm kinh nghiệm tư vấn" />
              </Form.Item>
              
              <Form.Item
                name="bio"
                label="Giới thiệu"
              >
                <Input.TextArea 
                  rows={4} 
                  placeholder="Giới thiệu về bản thân và kinh nghiệm làm việc" 
                />
              </Form.Item>

              <Form.Item
                name="isActive"
                label="Trạng thái"
                valuePropName="checked"
              >
                <Switch checkedChildren="Đang hoạt động" unCheckedChildren="Ngừng hoạt động" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={isLoading.coaches}>
                  {selectedCoach ? 'Cập nhật' : 'Thêm'} huấn luyện viên
                </Button>
              </Form.Item>
            </Form>
          )}

          {modalType === 'view' && selectedCoach && (
            <div>
              <p><strong>Tên:</strong> {selectedCoach.full_name}</p>
              <p><strong>Email:</strong> {selectedCoach.email}</p>
              <p><strong>Số điện thoại:</strong> {selectedCoach.phone}</p>
              <p><strong>Chuyên môn:</strong> {selectedCoach.expertise}</p>
              <p><strong>Trạng thái:</strong> {selectedCoach.is_active === 1 ? 'Đang hoạt động' : 'Ngừng hoạt động'}</p>
            </div>
          )}
        </Modal>
      </Card>

      {/* Progress Data */}
      <Row gutter={[16, 16]} className="progress-stats">
        <Col xs={24}>
          <Card title={<Space><TrophyOutlined /> Tiến độ cai thuốc</Space>} className="progress-card">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Giảm hút thuốc trung bình"
                  value={progressData.avgSmokingReduction}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
                <Progress percent={progressData.avgSmokingReduction} strokeColor="#52c41a" />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Tổng số ngày không hút thuốc"
                  value={progressData.daysWithoutSmoking}
                  valueStyle={{ color: '#1890ff' }}
                  formatter={(value) => value.toLocaleString()}
                />
                <Progress percent={85} status="active" strokeColor="#1890ff" />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Số tiền tiết kiệm mỗi ngày"
                  value={(progressData.moneyDailySaved / 1000000).toFixed(2)}
                  suffix="tr đ"
                  valueStyle={{ color: '#722ed1' }}
                />
                <Progress percent={78} status="active" strokeColor="#722ed1" />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Thử thách hoàn thành"
                  value={progressData.totalChallengesCompleted}
                  valueStyle={{ color: '#fa8c16' }}
                  formatter={(value) => value.toLocaleString()}
                />
                <Progress percent={65} status="active" strokeColor="#fa8c16" />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Coach Management Section */}
      <Row gutter={[16, 16]} className="coach-management">
        <Col xs={24}>
          <Card title={<Space><TeamOutlined /> Quản lý huấn luyện viên</Space>} className="coach-card">
            <Tabs defaultActiveKey="coaches">
              <TabPane tab="Danh sách huấn luyện viên" key="coaches">
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Tổng số huấn luyện viên"
                        value={coachStats.totalCoaches}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Đang hoạt động"
                        value={coachStats.activeCoaches}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Đánh giá trung bình"
                        value={coachStats.avgRating}
                        suffix="/5"
                        valueStyle={{ color: '#faad14' }}
                        prefix={<span style={{ marginRight: 8 }}>★</span>}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Cuộc hẹn"
                        value={coachStats.totalAppointments}
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Card>
                  </Col>
                </Row>
                
                <Table 
                  dataSource={coaches} 
                  columns={coachColumns} 
                  rowKey="id"
                  loading={isLoading.coaches}
                  pagination={{ pageSize: 5 }}
                />
              </TabPane>
              <TabPane tab="Thống kê cuộc hẹn" key="appointments">
                <Alert
                  message="Chức năng đang phát triển"
                  description="Phần thống kê chi tiết cuộc hẹn theo huấn luyện viên sẽ có trong phiên bản tiếp theo."
                  type="info"
                  showIcon
                />
              </TabPane>
              <TabPane tab="Đánh giá & Phản hồi" key="feedback">
                <Alert
                  message="Chức năng đang phát triển"
                  description="Phần thống kê chi tiết đánh giá và phản hồi từ người dùng sẽ có trong phiên bản tiếp theo."
                  type="info"
                  showIcon
                />
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* Coach Modals */}
      <Modal
        title={modalType === 'view' ? 'Chi tiết huấn luyện viên' : 
              modalType === 'edit' ? 'Chỉnh sửa thông tin huấn luyện viên' : 
              'Quản lý lịch làm việc'}
        visible={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={modalType === 'availability' ? 800 : 600}
      >
        {selectedCoach && modalType === 'view' && (
          <div className="coach-detail">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div className="coach-avatar">
                  <Avatar 
                    size={100} 
                    src={selectedCoach.avatar_url || '/image/default-user-avatar.svg'} 
                  />
                </div>
              </Col>
              <Col span={16}>
                <h2>{selectedCoach.full_name}</h2>
                <p><strong>Email:</strong> {selectedCoach.email}</p>
                <p><strong>SĐT:</strong> {selectedCoach.phone}</p>
                <p><strong>Giới tính:</strong> {selectedCoach.gender === 'male' ? 'Nam' : selectedCoach.gender === 'female' ? 'Nữ' : 'Khác'}</p>
                <p>
                  <strong>Trạng thái:</strong> {' '}
                  <Tag color={selectedCoach.is_active ? 'success' : 'error'}>
                    {selectedCoach.is_active ? 'Hoạt động' : 'Ngừng hoạt động'}
                  </Tag>
                </p>
                <p><strong>Đánh giá:</strong> {selectedCoach.rating || 'N/A'} {selectedCoach.rating && <span style={{ color: '#faad14' }}>★</span>}</p>
                <p><strong>Chuyên môn:</strong> {selectedCoach.specialization || 'Chưa cập nhật'}</p>
                <p><strong>Kinh nghiệm:</strong> {selectedCoach.experience || 'Chưa cập nhật'}</p>
              </Col>
            </Row>
            
            <Divider />
            <h3>Giới thiệu</h3>
            <p>{selectedCoach.bio || 'Chưa có thông tin giới thiệu.'}</p>
            
            <Divider />
            
            <h3>Lịch làm việc</h3>
            {isLoading.availability ? (
              <div>Đang tải...</div>
            ) : coachAvailability[selectedCoach.id] ? (
              <List
                dataSource={coachAvailability[selectedCoach.id].available_slots || []}
                renderItem={item => (
                  <List.Item>
                    <strong>{item.day_of_week}:</strong> {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                  </List.Item>
                )}
              />
            ) : (
              <p>Không có thông tin lịch làm việc.</p>
            )}
            
            <Divider />
            
            <h3>Đánh giá từ người dùng</h3>
            {isLoading.feedback ? (
              <div>Đang tải...</div>
            ) : coachFeedback.length > 0 ? (
              <List
                dataSource={coachFeedback}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          {item.user_name || item.smoker_name}
                          <span style={{ color: '#faad14' }}>
                            {item.rating} ★
                          </span>
                        </Space>
                      }
                      description={item.content || item.review_text}
                    />
                    <div>{moment(item.created_at).format('DD/MM/YYYY')}</div>
                  </List.Item>
                )}
              />
            ) : (
              <p>Chưa có đánh giá nào.</p>
            )}
          </div>
        )}
        
        {modalType === 'edit' && (
          <Form
            layout="vertical"
            initialValues={selectedCoach ? {
              full_name: selectedCoach.full_name,
              email: selectedCoach.email,
              phone: selectedCoach.phone,
              gender: selectedCoach.gender,
              expertise: selectedCoach.expertise,
              is_active: selectedCoach.is_active === 1
            } : {
              is_active: true,
              gender: 'male'
            }}
            onFinish={handleCoachUpdate}
          >
            <Form.Item
              name="full_name"
              label="Họ tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="phone"
              label="Số điện thoại"
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="gender"
              label="Giới tính"
            >
              <Select>
                <Select.Option value="male">Nam</Select.Option>
                <Select.Option value="female">Nữ</Select.Option>
                <Select.Option value="other">Khác</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="is_active"
              label="Trạng thái"
              valuePropName="checked"
            >
              <Select>
                <Select.Option value={true}>Hoạt động</Select.Option>
                <Select.Option value={false}>Ngừng hoạt động</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="specialization"
              label="Chuyên môn"
            >
              <Input placeholder="Ví dụ: Cai thuốc lá, Sức khỏe tinh thần, v.v." />
            </Form.Item>
            
            <Form.Item
              name="experience"
              label="Kinh nghiệm"
            >
              <Input placeholder="Ví dụ: 5 năm kinh nghiệm tư vấn" />
            </Form.Item>
            
            <Form.Item
              name="bio"
              label="Giới thiệu"
            >
              <Input.TextArea 
                rows={4} 
                placeholder="Giới thiệu về bản thân và kinh nghiệm làm việc" 
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Cập nhật
              </Button>
            </Form.Item>
          </Form>
        )}
        
        {selectedCoach && modalType === 'availability' && (
          <div className="coach-availability">
            <h3>Lịch làm việc của {selectedCoach.full_name}</h3>
            
            {isLoading.availability ? (
              <div>Đang tải...</div>
            ) : (
              <Table
                dataSource={coachAvailability[selectedCoach.id]?.available_slots || []}
                columns={[
                  {
                    title: 'Ngày',
                    dataIndex: 'day_of_week',
                    key: 'day_of_week',
                  },
                  {
                    title: 'Bắt đầu',
                    dataIndex: 'start_time',
                    key: 'start_time',
                    render: time => time.substring(0, 5)
                  },
                  {
                    title: 'Kết thúc',
                    dataIndex: 'end_time',
                    key: 'end_time',
                    render: time => time.substring(0, 5)
                  },
                  {
                    title: 'Thao tác',
                    key: 'action',
                    render: (_, record) => (
                      <Button size="small">Chỉnh sửa</Button>
                    ),
                  }
                ]}
                rowKey={(record, index) => `${record.day_of_week}-${index}`}
                pagination={false}
              />
            )}
            
            <Divider />
            
            <Button type="primary">Thêm khung giờ mới</Button>
          </div>
        )}
      </Modal>

      {/* Additional Statistics */}
    </div>
  );
}
