import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Alert, 
  Statistic, 
  Space, 
  Typography, 
  Divider,
  Progress,
  List,
  Table,
  Tooltip
} from 'antd';
import { 
  UserOutlined, 
  DollarOutlined, 
  TeamOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileAddOutlined,
  MessageOutlined,
  UserAddOutlined,
  LineChartOutlined,
  PieChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  HeartOutlined,
  SolutionOutlined
} from '@ant-design/icons';
import './Admin.css';

const { Title, Text, Paragraph } = Typography;

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

  useEffect(() => {
    // Simulate fetching data from API
    fetchMetrics();
    fetchMonthlyGrowth();
    fetchMembershipDistribution();
    fetchRecentActivities();
    fetchProgressData();
    fetchPaymentStats();
  }, []);

  const fetchMetrics = () => {
    // Simulated API response
    setTimeout(() => {
      setMetrics({
        totalUsers: 2487,
        totalRevenue: 58760000,
        activeCoaches: 12,
        membershipCount: 633,
        blogPostsCount: 24,
        usersChange: 8.5,
        revenueChange: 12.3,
        newUsersThisWeek: 47,
        successfulQuitAttempts: 156,
        totalAppointments: 328,
        totalPayments: 642,
        communityPosts: 156,
        achievements: 18
      });
    }, 800);
  };
  
  const fetchProgressData = () => {
    // Simulated API response for user progress data
    setTimeout(() => {
      setProgressData({
        avgSmokingReduction: 72,
        daysWithoutSmoking: 12846, // Total across all users
        moneyDailySaved: 8750000,
        totalChallengesCompleted: 3648
      });
    }, 1000);
  };

  const fetchPaymentStats = () => {
    // Simulated API response for payment statistics
    setTimeout(() => {
      setPaymentStats({
        completed: 582,
        pending: 43,
        failed: 17,
        refunded: 5,
        totalAmount: 58760000,
        avgTransactionAmount: 95000,
        paymentMethods: {
          zalopay: 325,
          momo: 213,
          banking: 104
        }
      });
    }, 900);
  };

  const fetchMonthlyGrowth = () => {
    // Simulated API response for monthly user growth
    setTimeout(() => {
      setMonthlyGrowth([
        { month: 'Tháng 1', users: 1850, growth: 0, payments: 48750000 },
        { month: 'Tháng 2', users: 1950, growth: 5.4, payments: 50120000 },
        { month: 'Tháng 3', users: 2050, growth: 5.1, payments: 51830000 },
        { month: 'Tháng 4', users: 2150, growth: 4.9, payments: 53550000 },
        { month: 'Tháng 5', users: 2250, growth: 4.7, payments: 55350000 },
        { month: 'Tháng 6', users: 2350, growth: 4.4, payments: 56980000 },
        { month: 'Tháng 7', users: 2487, growth: 5.8, payments: 58760000 }
      ]);
    }, 1000);
  };

  const fetchMembershipDistribution = () => {
    // Simulated API response for membership distribution based on packages
    setTimeout(() => {
      setMembershipDistribution({
        free: { count: 1854, percentage: 74.5 },
        basic: { count: 456, percentage: 18.3, revenue: 22800000 },
        premium: { count: 177, percentage: 7.2, revenue: 35960000 }
      });
    }, 1200);
  };

  const fetchRecentActivities = () => {
    // Simulated API response for recent activities
    setTimeout(() => {
      const activities = [
        { 
          id: 1, 
          type: 'user', 
          description: 'Nguyễn Văn A đăng ký mới', 
          time: '10 phút trước',
          icon: <UserAddOutlined style={{ color: '#1890ff' }} />
        },
        { 
          id: 2, 
          type: 'payment', 
          description: 'Trần Thị B nâng cấp lên Premium', 
          time: '30 phút trước',
          icon: <DollarOutlined style={{ color: '#52c41a' }} />
        },
        { 
          id: 3, 
          type: 'appointment', 
          description: 'Lịch hẹn mới với HLV Phạm D', 
          time: '45 phút trước',
          icon: <CalendarOutlined style={{ color: '#eb2f96' }} />
        },
        { 
          id: 4, 
          type: 'blog', 
          description: 'Bài viết mới "5 thói quen thay thế thuốc lá"', 
          time: '1 giờ trước',
          icon: <FileAddOutlined style={{ color: '#722ed1' }} />
        },
        { 
          id: 5, 
          type: 'progress', 
          description: 'Hoàng E đã đạt 30 ngày không hút thuốc', 
          time: '2 giờ trước',
          icon: <TrophyOutlined style={{ color: '#faad14' }} />
        },
        { 
          id: 6, 
          type: 'coach', 
          description: 'HLV Lê C hoàn thành 3 phiên tư vấn', 
          time: '3 giờ trước',
          icon: <TeamOutlined style={{ color: '#fa8c16' }} />
        },
        { 
          id: 7, 
          type: 'community', 
          description: 'Bài đăng mới trong cộng đồng cai thuốc', 
          time: '4 giờ trước',
          icon: <MessageOutlined style={{ color: '#13c2c2' }} />
        }
      ];
      setRecentActivities(activities);
    }, 1500);
  };

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
                        showInfo={false} 
                        strokeColor="#5B8FF9" 
                      />
                      <div className="membership-percentage">{membershipDistribution.free.percentage}%</div>
                    </div>
                  </div>
                  
                  <div className="membership-item">
                    <div className="membership-color" style={{ backgroundColor: '#5AD8A6' }} />
                    <div className="membership-detail">
                      <div className="membership-name">Basic</div>
                      <div className="membership-count">{membershipDistribution.basic.count} người dùng</div>
                      <Progress 
                        percent={membershipDistribution.basic.percentage} 
                        showInfo={false} 
                        strokeColor="#5AD8A6" 
                      />
                      <div className="membership-percentage">{membershipDistribution.basic.percentage}%</div>
                    </div>
                  </div>
                  
                  <div className="membership-item">
                    <div className="membership-color" style={{ backgroundColor: '#F6BD16' }} />
                    <div className="membership-detail">
                      <div className="membership-name">Premium</div>
                      <div className="membership-count">{membershipDistribution.premium.count} người dùng</div>
                      <Progress 
                        percent={membershipDistribution.premium.percentage} 
                        showInfo={false} 
                        strokeColor="#F6BD16" 
                      />
                      <div className="membership-percentage">{membershipDistribution.premium.percentage}%</div>
                    </div>
                  </div>
                </div>

                <Divider />

                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic 
                      title="Tổng người dùng có gói" 
                      value={metrics.membershipCount} 
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="Phần trăm người dùng trả phí" 
                      value={((membershipDistribution.basic.count + membershipDistribution.premium.count) / metrics.totalUsers * 100).toFixed(1)}
                      suffix="%"
                      precision={1}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                </Row>
              </>
            )}
          </Card>
        </Col>
      </Row>
      
      {/* User Growth Chart */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card 
            title={
              <Space>
                <LineChartOutlined /> Tăng trưởng người dùng và doanh thu theo tháng
              </Space>
            } 
            className="chart-card"
          >
            <Table 
              dataSource={monthlyGrowth} 
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Thời gian',
                  dataIndex: 'month',
                  key: 'month',
                },
                {
                  title: 'Số người dùng',
                  dataIndex: 'users',
                  key: 'users',
                },
                {
                  title: 'Tăng trưởng',
                  dataIndex: 'growth',
                  key: 'growth',
                  render: (growth) => (
                    <span style={{ color: growth > 0 ? '#52c41a' : '#f5222d' }}>
                      {growth > 0 ? '+' : ''}{growth}%
                    </span>
                  ),
                },
                {
                  title: 'Doanh thu (triệu đ)',
                  dataIndex: 'payments',
                  key: 'payments',
                  render: (payments) => (
                    <span>{(payments / 1000000).toFixed(2)}</span>
                  ),
                }
              ]}
            />
            <div className="growth-visual">
              {monthlyGrowth.map((month, index) => (
                <div key={index} className="month-column">
                  <div 
                    className="month-bar" 
                    style={{ 
                      height: month.users ? `${(month.users / 3000) * 150}px` : '0px',
                      backgroundColor: '#1890ff' 
                    }}
                  />
                  <div className="month-label">{month.month.split(' ')[1]}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
      
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

      {/* Additional Statistics */}
      <Row gutter={[16, 16]} className="additional-stats">
        <Col xs={24} md={8}>
          <Card className="stat-highlight-card">
            <Statistic
              title={<span><UserAddOutlined /> Người dùng mới tuần này</span>}
              value={metrics.newUsersThisWeek}
              valueStyle={{ color: '#1890ff', fontSize: '32px' }}
            />
            <Progress percent={75} status="active" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="stat-highlight-card">
            <Statistic
              title={<span><HeartOutlined /> Người cai thuốc thành công</span>}
              value={metrics.successfulQuitAttempts}
              valueStyle={{ color: '#52c41a', fontSize: '32px' }}
            />
            <Progress percent={62} status="active" strokeColor="#52c41a" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<Space><SolutionOutlined /> Hoạt động gần đây</Space>} className="activity-card">
            <List
              itemLayout="horizontal"
              dataSource={recentActivities}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={item.icon}
                    title={item.description}
                    description={item.time}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
