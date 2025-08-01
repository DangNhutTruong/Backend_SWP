import React, { useState, useEffect } from 'react';

import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Typography,
  Tag,
  Tooltip,
  Popconfirm,
  Tabs,
  Statistic,
  Col,
  Row,
  DatePicker,
  Alert,
  Steps,
  Descriptions,
  Progress,
  Menu,
  Dropdown,
  notification,
  Badge
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  DollarOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AreaChartOutlined,
  UserOutlined,
  StarOutlined,
  TrophyOutlined,
  GiftOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  BellOutlined,
  LineChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import './AdminMemberships.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function AdminMemberships() {
  const [packages, setPackages] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingPackage, setEditingPackage] = useState(null);
  
  // New states for analytics and user management
  const [analyticsData, setAnalyticsData] = useState({});
  const [usersWithMembership, setUsersWithMembership] = useState([]);
  const [discountCodes, setDiscountCodes] = useState([]);
  const [expiringUsers, setExpiringUsers] = useState([]);
  const [realtimePayments, setRealtimePayments] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState('all');
  
  useEffect(() => {
    // Mô phỏng API call để lấy dữ liệu gói thành viên
    fetchPackages();
    fetchPayments();
    fetchAnalyticsData();
    fetchUsersWithMembership();
    fetchDiscountCodes();
    fetchExpiringUsers();
  }, []);

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      if (!token) {
        console.warn('No auth token found');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/packages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch packages data');
      }
      
      const data = await response.json();
      if (data.success) {
        // Transform database data to match component structure
        const transformedPackages = data.data.map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          price: pkg.price,
          duration: pkg.period === 'tháng' ? 30 : pkg.period === 'năm' ? 365 : 0,
          benefits: pkg.description ? pkg.description.split(',').map(b => b.trim()) : [],
          active: true // Assume all packages from DB are active
        }));
        setPackages(transformedPackages);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      // Fallback to empty array if API fails
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      if (!token) {
        console.warn('No auth token found');
        return;
      }

      const response = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments data');
      }
      
      const data = await response.json();
      if (data.success) {
        setPayments(data.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      // Fallback to empty array if API fails
      setPayments([]);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      if (!token) {
        console.warn('No auth token found');
        return;
      }

      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Fallback to empty data if API fails
      setAnalyticsData({
        userDistribution: { free: 0, pro: 0, premium: 0 },
        revenueByMonth: [],
        paymentMethods: [],
        packageStats: [],
        recentActivity: [],
        summary: {
          totalRevenue: 0,
          completedPayments: 0,
          pendingPayments: 0,
          failedPayments: 0,
          growthRate: 0
        }
      });
    }
  };

  const fetchUsersWithMembership = async () => {
    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      if (!token) {
        console.warn('No auth token found');
        return;
      }

      const response = await fetch('/api/admin/users/with-membership', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users data');
      }
      
      const data = await response.json();
      if (data.success) {
        setUsersWithMembership(data.data);
      }
    } catch (error) {
      console.error('Error fetching users with membership:', error);
      // Fallback to empty array if API fails
      setUsersWithMembership([]);
    }
  };

  const fetchDiscountCodes = () => {
    setTimeout(() => {
      const mockDiscounts = [
        {
          id: 1,
          code: 'WELCOME20',
          type: 'percentage',
          value: 20,
          applicablePackages: ['Pro', 'Premium'],
          usedCount: 15,
          maxUses: 100,
          expiryDate: '2024-12-31',
          active: true
        },
        {
          id: 2,
          code: 'SAVE50K',
          type: 'fixed',
          value: 50000,
          applicablePackages: ['Premium'],
          usedCount: 8,
          maxUses: 50,
          expiryDate: '2024-09-30',
          active: true
        }
      ];
      setDiscountCodes(mockDiscounts);
    }, 1300);
  };

  const fetchExpiringUsers = async () => {
    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      if (!token) {
        console.warn('No auth token found');
        return;
      }

      const response = await fetch('/api/admin/users/expiring', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch expiring users');
      }
      
      const data = await response.json();
      if (data.success) {
        setExpiringUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching expiring users:', error);
      // Fallback to empty array if API fails
      setExpiringUsers([]);
    }
  };

  const showModal = (pkg = null) => {
    setEditingPackage(pkg);
    if (pkg) {
      form.setFieldsValue({
        name: pkg.name,
        price: pkg.price,
        duration: pkg.duration,
        benefits: pkg.benefits.join('\n')
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = (values) => {
    const benefits = values.benefits.split('\n').filter(b => b.trim() !== '');
    
    if (editingPackage) {
      // Cập nhật gói hiện có
      setPackages(packages.map(p => 
        p.id === editingPackage.id 
          ? { ...p, ...values, benefits }
          : p
      ));
    } else {
      // Tạo gói mới
      const newPackage = {
        id: Date.now(),
        ...values,
        benefits,
        active: true
      };
      setPackages([...packages, newPackage]);
    }
    
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleDelete = (id) => {
    setPackages(packages.filter(p => p.id !== id));
  };

  const handleToggleStatus = (id, currentStatus) => {
    setPackages(packages.map(p => 
      p.id === id ? { ...p, active: !currentStatus } : p
    ));
  };

  // Utility functions for new features
  const extendMembership = async (userId) => {
    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      if (!token) {
        notification.error({ message: 'Không tìm thấy token xác thực' });
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/extend-membership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ days: 30 })
      });

      const data = await response.json();
      if (data.success) {
        notification.success({
          message: 'Thành công',
          description: data.message
        });
        // Refresh data
        fetchUsersWithMembership();
        fetchExpiringUsers();
      } else {
        notification.error({
          message: 'Lỗi',
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error extending membership:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể gia hạn membership'
      });
    }
  };

  const upgradeMembership = async (userId) => {
    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      if (!token) {
        notification.error({ message: 'Không tìm thấy token xác thực' });
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/upgrade-membership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPlan: 'premium' })
      });

      const data = await response.json();
      if (data.success) {
        notification.success({
          message: 'Thành công',
          description: data.message
        });
        // Refresh data
        fetchUsersWithMembership();
        fetchAnalyticsData();
      } else {
        notification.error({
          message: 'Lỗi',
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error upgrading membership:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể nâng cấp membership'
      });
    }
  };

  const cancelMembership = async (userId) => {
    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      if (!token) {
        notification.error({ message: 'Không tìm thấy token xác thực' });
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}/cancel-membership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        notification.success({
          message: 'Thành công',
          description: data.message
        });
        // Refresh data
        fetchUsersWithMembership();
        fetchAnalyticsData();
      } else {
        notification.error({
          message: 'Lỗi',
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error canceling membership:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể hủy membership'
      });
    }
  };

  const sendExpiryNotifications = async () => {
    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      if (!token) {
        notification.error({ message: 'Không tìm thấy token xác thực' });
        return;
      }

      const response = await fetch('/api/admin/notifications/send-expiry-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        notification.success({
          message: 'Thành công',
          description: data.message
        });
      } else {
        notification.error({
          message: 'Lỗi',
          description: data.message
        });
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Không thể gửi thông báo'
      });
    }
  };

  const exportPaymentReport = () => {
    notification.info({
      message: 'Đang xuất báo cáo',
      description: 'Báo cáo thanh toán sẽ được tải xuống trong giây lát'
    });
    // TODO: Generate and download report
  };

  const exportUserReport = () => {
    notification.info({
      message: 'Đang xuất báo cáo',
      description: 'Báo cáo người dùng sẽ được tải xuống trong giây lát'
    });
    // TODO: Generate and download report
  };

  const exportRevenueReport = () => {
    notification.info({
      message: 'Đang xuất báo cáo', 
      description: 'Báo cáo doanh thu sẽ được tải xuống trong giây lát'
    });
    // TODO: Generate and download report
  };

  const packageColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Tên gói',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Giá (VND)',
      dataIndex: 'price',
      key: 'price',
      render: (price) => price === 0 ? 'Miễn phí' : `${price.toLocaleString('vi-VN')} ₫`
    },
    {
      title: 'Thời hạn',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => duration === 0 ? 'Vĩnh viễn' : `${duration} ngày`
    },
    {
      title: 'Quyền lợi',
      dataIndex: 'benefits',
      key: 'benefits',
      render: (benefits) => (
        <ul style={{ paddingLeft: '20px', margin: 0 }}>
          {benefits.slice(0, 2).map((benefit, index) => (
            <li key={index}>{benefit}</li>
          ))}
          {benefits.length > 2 && <li>...và {benefits.length - 2} quyền lợi khác</li>}
        </ul>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Đang hoạt động' : 'Đã tắt'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => showModal(record)} 
            />
          </Tooltip>
          <Tooltip title={record.active ? 'Tắt gói' : 'Kích hoạt gói'}>
            <Button
              type={record.active ? 'default' : 'primary'}
              icon={record.active ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
              onClick={() => handleToggleStatus(record.id, record.active)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa gói này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button 
                danger 
                icon={<DeleteOutlined />} 
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // User Management Table Columns
  const userMembershipColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Người dùng',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          <div style={{ color: '#888', fontSize: '12px' }}>{record.email}</div>
        </div>
      )
    },
    {
      title: 'Membership',
      dataIndex: 'membership',
      key: 'membership',
      render: (membership) => {
        let color = 'default';
        if (membership === 'Premium') color = 'gold';
        else if (membership === 'Pro') color = 'blue';
        return <Tag color={color}>{membership}</Tag>;
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        let text = 'Hoạt động';
        if (status === 'expiring') {
          color = 'orange';
          text = 'Sắp hết hạn';
        } else if (status === 'expired') {
          color = 'red';
          text = 'Đã hết hạn';
        }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Ngày hết hạn',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Tổng thanh toán',
      dataIndex: 'totalPaid',
      key: 'totalPaid',
      render: (amount) => `${amount.toLocaleString('vi-VN')} ₫`
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Dropdown overlay={
          <Menu>
            <Menu.Item onClick={() => extendMembership(record.id)}>
              🔄 Gia hạn 30 ngày
            </Menu.Item>
            <Menu.Item onClick={() => upgradeMembership(record.id)}>
              ⬆️ Nâng cấp gói
            </Menu.Item>
            <Menu.Item onClick={() => cancelMembership(record.id)} danger>
              ❌ Hủy membership
            </Menu.Item>
          </Menu>
        }>
          <Button>Hành động <DownOutlined /></Button>
        </Dropdown>
      )
    }
  ];

  // Discount Codes Table Columns
  const discountColumns = [
    {
      title: 'Mã giảm giá',
      dataIndex: 'code',
      key: 'code',
      render: (code) => <strong>{code}</strong>
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'percentage' ? 'blue' : 'green'}>
          {type === 'percentage' ? 'Phần trăm' : 'Số tiền'}
        </Tag>
      )
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
      render: (value, record) => 
        record.type === 'percentage' ? `${value}%` : `${value.toLocaleString('vi-VN')} ₫`
    },
    {
      title: 'Áp dụng cho',
      dataIndex: 'applicablePackages',
      key: 'applicablePackages',
      render: (packages) => packages.join(', ')
    },
    {
      title: 'Đã sử dụng',
      dataIndex: 'usedCount',
      key: 'usedCount',
      render: (used, record) => `${used}/${record.maxUses}`
    },
    {
      title: 'Hạn sử dụng',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      )
    }
  ];

  const paymentColumns = [
    {
      title: 'Mã thanh toán',
      dataIndex: 'id',
      key: 'id',
      width: 100
    },
    {
      title: 'Transaction ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 150,
      render: (transactionId) => (
        <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>
          {transactionId || 'N/A'}
        </span>
      )
    },
    {
      title: 'Người dùng',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
      render: (userName, record) => (
        <div>
          <div><strong>{userName}</strong></div>
          <div style={{ color: '#888', fontSize: '12px' }}>{record.userEmail}</div>
        </div>
      )
    },
    {
      title: 'Gói dịch vụ',
      dataIndex: 'packageName',
      key: 'packageName',
      width: 120,
      render: (text) => {
        let color = 'default';
        if (text === 'Premium') color = 'gold';
        else if (text === 'Pro') color = 'purple';
        else if (text === 'Free') color = 'green';
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => (
        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
          {parseFloat(amount).toLocaleString('vi-VN')} ₫
        </span>
      )
    },
    {
      title: 'Phương thức',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 100,
      render: (method) => {
        let color = 'blue';
        let icon = '💳';
        if (method === 'zalopay') {
          color = 'cyan';
          icon = '💰';
        }
        return (
          <Tag color={color} icon={icon}>
            {method?.toUpperCase() || 'N/A'}
          </Tag>
        );
      }
    },
    {
      title: 'Ngày thanh toán',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        let color = 'default';
        let text = 'Không xác định';
        
        if (status === 'completed') {
          color = 'green';
          text = 'Hoàn thành';
        } else if (status === 'pending') {
          color = 'orange';
          text = 'Đang xử lý';
        } else if (status === 'failed') {
          color = 'red';
          text = 'Thất bại';
        } else if (status === 'refunded') {
          color = 'purple';
          text = 'Đã hoàn tiền';
        }
        
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Dropdown overlay={
          <Menu>
            <Menu.Item onClick={() => {
              notification.info({
                message: 'Chi tiết thanh toán ZaloPay',
                description: (
                  <div>
                    <div>Mã giao dịch: {record.transactionId || 'N/A'}</div>
                    <div>Người dùng: {record.userName}</div>
                    <div>Số tiền: {parseFloat(record.amount).toLocaleString('vi-VN')} ₫</div>
                    <div>Trạng thái: {record.status}</div>
                  </div>
                )
              });
            }}>
              📋 Chi tiết ZaloPay
            </Menu.Item>
            <Menu.Item onClick={() => {
              navigator.clipboard.writeText(record.transactionId || '');
              notification.success({
                message: 'Đã copy',
                description: 'Transaction ID đã được copy vào clipboard'
              });
            }}>
              📋 Copy Transaction ID
            </Menu.Item>
            <Menu.Item onClick={() => {
              notification.info({
                message: 'Liên hệ khách hàng',
                description: `Liên hệ với ${record.userName} (${record.userEmail})`
              });
            }}>
              💬 Liên hệ khách hàng
            </Menu.Item>
            {record.status === 'completed' && (
              <Menu.Item onClick={() => {
                notification.warning({
                  message: 'Hoàn tiền ZaloPay',
                  description: `Xử lý hoàn tiền cho giao dịch ${record.transactionId}`
                });
              }} danger>
                💰 Hoàn tiền ZaloPay
              </Menu.Item>
            )}
            <Menu.Item onClick={() => {
              notification.info({
                message: 'Gửi hóa đơn',
                description: `Gửi lại hóa đơn cho ${record.userName}`
              });
            }}>
              📧 Gửi lại hóa đơn
            </Menu.Item>
          </Menu>
        }>
          <Button size="small">Hành động <DownOutlined /></Button>
        </Dropdown>
      )
    }
  ];

  // Thống kê doanh thu từ dữ liệu thực
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

  const completedPayments = payments.filter(p => p.status === 'completed').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const failedPayments = payments.filter(p => p.status === 'failed').length;

  // Lấy phương thức thanh toán từ dữ liệu thực
  const paymentMethodStats = payments.reduce((acc, payment) => {
    const method = payment.paymentMethod || 'unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  const totalPayments = payments.length;
  const zalopayPercentage = totalPayments > 0 ? ((paymentMethodStats.zalopay || 0) / totalPayments * 100).toFixed(1) : 0;

  return (
    <div className="admin-memberships-container">
      <Tabs defaultActiveKey="1">
        <TabPane tab="Gói thành viên" key="1">
          <Card>
            <div className="header-with-button">
              <Title level={3}>Quản lý gói thành viên</Title>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => showModal()}
              >
                Thêm gói mới
              </Button>
            </div>
            <Paragraph>
              Quản lý các gói thành viên, thiết lập giá và quyền lợi của từng gói.
            </Paragraph>

            <Table
              columns={packageColumns}
              dataSource={packages}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane tab="Thanh toán" key="2">
          <Card>
            <div className="header-with-button">
              <Title level={3}>Quản lý thanh toán</Title>
              <Space>
                <Button icon={<DownloadOutlined />} onClick={exportPaymentReport}>
                  📊 Xuất báo cáo thanh toán
                </Button>
                <Button icon={<DownloadOutlined />} onClick={exportRevenueReport}>
                  💰 Xuất báo cáo doanh thu
                </Button>
              </Space>
            </div>

            <Row gutter={16} className="stats-row">
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Tổng doanh thu"
                    value={totalRevenue}
                    precision={0}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<DollarOutlined />}
                    suffix="₫"
                    formatter={(value) => `${value.toLocaleString('vi-VN')}`}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Số giao dịch thành công"
                    value={completedPayments}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Giao dịch đang chờ"
                    value={pendingPayments}
                    valueStyle={{ color: '#fa8c16' }}
                    prefix={<ExclamationCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <div className="filter-container">
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <RangePicker 
                    placeholder={['Từ ngày', 'Đến ngày']}
                    style={{ width: '100%' }}
                    onChange={(dates) => setSelectedDateRange(dates)}
                  />
                </Col>
                <Col span={4}>
                  <Select 
                    defaultValue="all" 
                    style={{ width: '100%' }}
                    onChange={(value) => setPaymentFilter(value)}
                  >
                    <Option value="all">Tất cả trạng thái</Option>
                    <Option value="completed">Hoàn thành</Option>
                    <Option value="pending">Đang xử lý</Option>
                    <Option value="failed">Thất bại</Option>
                  </Select>
                </Col>
                <Col span={4}>
                  <Select defaultValue="all" style={{ width: '100%' }}>
                    <Option value="all">Tất cả gói</Option>
                    <Option value="Pro">Pro</Option>
                    <Option value="Premium">Premium</Option>
                  </Select>
                </Col>
                <Col span={4}>
                  <Input.Search 
                    placeholder="Tìm theo tên user"
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={6}>
                  <Space>
                    <Button onClick={() => {
                      setSelectedDateRange(null);
                      setPaymentFilter('all');
                      notification.info({ message: 'Đã đặt lại bộ lọc' });
                    }}>
                      Đặt lại
                    </Button>
                    <Button type="primary">
                      Áp dụng
                    </Button>
                  </Space>
                </Col>
              </Row>
              
              {/* Quick Stats */}
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Giao dịch thất bại"
                      value={failedPayments}
                      valueStyle={{ color: '#cf1322' }}
                      prefix={<CloseCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Đang xử lý"
                      value={pendingPayments}
                      valueStyle={{ color: '#fa8c16' }}
                      prefix={<ExclamationCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" title="Phương thức thanh toán">
                    <div><strong>ZaloPay: {zalopayPercentage}%</strong></div>
                    <div style={{ color: '#888', fontSize: '12px' }}>
                      {paymentMethodStats.zalopay || 0} / {totalPayments} giao dịch
                    </div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Số tiền hoàn"
                      value={payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)}
                      suffix="₫"
                      valueStyle={{ color: '#722ed1' }}
                      formatter={(value) => value.toLocaleString('vi-VN')}
                    />
                  </Card>
                </Col>
              </Row>
            </div>

            <Table
              columns={paymentColumns}
              dataSource={payments}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><AreaChartOutlined />Phân tích</span>} key="3">
          <Card>
            <Title level={3}>Phân tích dữ liệu</Title>
            
            {/* Key Metrics */}
            <Row gutter={16}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Free Users"
                    value={analyticsData.userDistribution?.free || 0}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Premium Users"
                    value={analyticsData.userDistribution?.pro || 0}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<CrownOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Pro Users"
                    value={analyticsData.userDistribution?.premium || 0}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<StarOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Tổng doanh thu"
                    value={analyticsData.summary?.totalRevenue || 0}
                    suffix="₫"
                    precision={0}
                    formatter={(value) => `${value.toLocaleString('vi-VN')}`}
                    valueStyle={{ color: '#722ed1' }}
                    prefix={<TrophyOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Summary Stats */}
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Thanh toán hoàn thành"
                    value={analyticsData.summary?.completedPayments || 0}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Thanh toán đang xử lý"
                    value={analyticsData.summary?.pendingPayments || 0}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<ExclamationCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Thanh toán thất bại"
                    value={analyticsData.summary?.failedPayments || 0}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Tăng trưởng tháng này"
                    value={analyticsData.summary?.growthRate || 0}
                    suffix="%"
                    precision={1}
                    valueStyle={{ color: analyticsData.summary?.growthRate > 0 ? '#52c41a' : '#ff4d4f' }}
                    prefix={<LineChartOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Revenue by Package */}
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card title="💰 Doanh thu theo gói">
                  {analyticsData.packageStats?.map((pkg, index) => (
                    <div key={index} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{pkg.name}</span>
                        <Tag color={pkg.name === 'Premium' ? 'gold' : pkg.name === 'Pro' ? 'purple' : 'green'}>
                          {pkg.purchases} giao dịch ({pkg.percentage}%)
                        </Tag>
                      </div>
                      <Statistic
                        value={pkg.revenue}
                        suffix="₫"
                        precision={0}
                        formatter={(value) => `${value.toLocaleString('vi-VN')}`}
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </div>
                  )) || <Text type="secondary">Chưa có dữ liệu</Text>}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="📊 Phương thức thanh toán">
                  {analyticsData.paymentMethods?.map((method, index) => (
                    <div key={index} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{method.method?.toUpperCase()}</span>
                        <Tag color={method.method === 'zalopay' ? 'cyan' : method.method === 'momo' ? 'green' : 'blue'}>
                          {method.count} giao dịch
                        </Tag>
                      </div>
                      <Progress 
                        percent={method.percentage} 
                        format={percent => `${percent}%`}
                        strokeColor={method.method === 'zalopay' ? '#1890ff' : method.method === 'momo' ? '#52c41a' : '#faad14'}
                      />
                      <Text type="secondary">
                        {method.amount.toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                  )) || <Text type="secondary">Chưa có dữ liệu</Text>}
                </Card>
              </Col>
            </Row>

            {/* Conversion Funnel */}
            <Card title="🔄 Phễu chuyển đổi" style={{ marginTop: 16 }}>
              <Steps current={2} direction="horizontal">
                <Step 
                  title="Free Users" 
                  description={`${analyticsData.userDistribution?.free || 0} người`}
                  icon={<UserOutlined />}
                />
                <Step 
                  title="Premium" 
                  description={`${analyticsData.userDistribution?.pro || 0} người`}
                  icon={<CrownOutlined />}
                />
                <Step 
                  title="Pro" 
                  description={`${analyticsData.userDistribution?.premium || 0} người`}
                  icon={<StarOutlined />}
                />
              </Steps>
            </Card>

            {/* Recent Activity Chart */}
            <Card title="📈 Hoạt động gần đây (30 ngày)" style={{ marginTop: 16 }}>
              {analyticsData.recentActivity?.length > 0 ? (
                <div>
                  {analyticsData.recentActivity.slice(-7).map((activity, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: index < 6 ? '1px solid #f0f0f0' : 'none'
                    }}>
                      <span>{new Date(activity.date).toLocaleDateString('vi-VN')}</span>
                      <Tag color="blue">{activity.newUsers} người dùng mới</Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary">Chưa có dữ liệu hoạt động</Text>
              )}
            </Card>

            {/* Revenue by Month */}
            <Card title="📊 Doanh thu theo tháng" style={{ marginTop: 16 }}>
              {analyticsData.revenueByMonth?.length > 0 ? (
                <Row gutter={16}>
                  {analyticsData.revenueByMonth.map((month, index) => (
                    <Col span={4} key={index}>
                      <Card size="small">
                        <Statistic
                          title={month.month}
                          value={month.revenue}
                          suffix="₫"
                          precision={0}
                          formatter={(value) => `${value.toLocaleString('vi-VN')}`}
                          valueStyle={{ fontSize: '14px' }}
                        />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {month.transactions} giao dịch
                        </Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Text type="secondary">Chưa có dữ liệu doanh thu</Text>
              )}
            </Card>
          </Card>
        </TabPane>

        <TabPane tab={<span><UserOutlined />Người dùng</span>} key="4">
          <Card>
            <div className="header-with-button">
              <Title level={3}>Quản lý membership người dùng</Title>
              <Space>
                <Button icon={<DownloadOutlined />} onClick={exportUserReport}>
                  Xuất báo cáo
                </Button>
              </Space>
            </div>
            
            {/* Expiry Alerts */}
            {expiringUsers.length > 0 && (
              <Alert
                message={`${expiringUsers.length} người dùng sắp hết hạn membership trong 7 ngày tới`}
                type="warning"
                action={
                  <Button size="small" onClick={sendExpiryNotifications}>
                    <BellOutlined /> Gửi thông báo
                  </Button>
                }
                style={{ marginBottom: 16 }}
                showIcon
              />
            )}

            <Table 
              columns={userMembershipColumns}
              dataSource={usersWithMembership}
              rowKey="id"
              loading={loading}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '16px 0' }}>
                    <Descriptions title="Chi tiết membership" size="small" column={3}>
                      <Descriptions.Item label="Ngày đăng ký">
                        {new Date(record.joinDate).toLocaleDateString('vi-VN')}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày hết hạn">
                        {new Date(record.expiryDate).toLocaleDateString('vi-VN')}
                      </Descriptions.Item>
                      <Descriptions.Item label="Số lần gia hạn">
                        <Badge count={record.renewalCount} style={{ backgroundColor: '#52c41a' }} />
                      </Descriptions.Item>
                      <Descriptions.Item label="Tổng thanh toán">
                        {record.totalPaid.toLocaleString('vi-VN')} ₫
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái hiện tại">
                        <Tag color={record.status === 'active' ? 'green' : 'orange'}>
                          {record.status === 'active' ? 'Đang hoạt động' : 'Sắp hết hạn'}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                ),
                rowExpandable: (record) => true,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><GiftOutlined />Khuyến mãi</span>} key="5">
          <Card>
            <div className="header-with-button">
              <Title level={3}>Quản lý mã giảm giá</Title>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  notification.info({
                    message: 'Tính năng đang phát triển',
                    description: 'Chức năng tạo mã giảm giá đang được phát triển'
                  });
                }}
              >
                Tạo mã giảm giá
              </Button>
            </div>

            <Table 
              columns={discountColumns}
              dataSource={discountCodes}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={editingPackage ? "Chỉnh sửa gói" : "Thêm gói mới"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Tên gói"
            rules={[{ required: true, message: 'Vui lòng nhập tên gói!' }]}
          >
            <Input placeholder="Ví dụ: Premium" />
          </Form.Item>

          <Form.Item
            name="price"
            label="Giá (VND)"
            rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
          >
            <InputNumber
              min={0}
              step={10000}
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Ví dụ: 299000"
            />
          </Form.Item>

          <Form.Item
            name="duration"
            label="Thời hạn (ngày)"
            rules={[{ required: true, message: 'Vui lòng nhập thời hạn!' }]}
            tooltip="Nhập 0 nếu đây là gói vĩnh viễn"
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Ví dụ: 30" />
          </Form.Item>

          <Form.Item
            name="benefits"
            label="Quyền lợi"
            rules={[{ required: true, message: 'Vui lòng nhập quyền lợi!' }]}
            tooltip="Mỗi quyền lợi trên một dòng"
          >
            <Input.TextArea
              rows={5}
              placeholder="Ví dụ:&#10;Truy cập nội dung premium&#10;Huấn luyện viên 1:1&#10;Hỗ trợ 24/7"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingPackage ? "Cập nhật" : "Thêm mới"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
