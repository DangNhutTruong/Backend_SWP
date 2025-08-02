import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Input, 
  Modal, 
  Form, 
  Switch, 
  Card, 
  Tabs, 
  Typography, 
  Tag, 
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  UserOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  LockOutlined, 
  UnlockOutlined, 
  InfoCircleOutlined
} from '@ant-design/icons';
import './AdminUsers.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    // Mô phỏng API call để lấy dữ liệu người dùng
    const fetchUsers = () => {
      // API Call giả lập
      setTimeout(() => {
        const mockUsers = [
          {
            id: 1,
            name: 'Nguyễn Văn A',
            email: 'nguyenvana@example.com',
            registeredDate: '2023-01-15',
            membershipStatus: 'premium',
            isActive: true,
          },
          {
            id: 2,
            name: 'Trần Thị B',
            email: 'tranthib@example.com',
            registeredDate: '2023-02-20',
            membershipStatus: 'basic',
            isActive: true,
          },
          {
            id: 3,
            name: 'Lê Văn C',
            email: 'levanc@example.com',
            registeredDate: '2023-03-10',
            membershipStatus: 'free',
            isActive: false,
          },
        ];
        setUsers(mockUsers);
        setLoading(false);
      }, 1000);
    };

    fetchUsers();
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const handleToggleStatus = (userId, currentStatus) => {
    // API call giả lập để khóa/mở tài khoản
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, isActive: !currentStatus } : user
      )
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Họ tên',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'registeredDate',
      key: 'registeredDate',
      sorter: (a, b) => new Date(a.registeredDate) - new Date(b.registeredDate),
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Gói thành viên',
      dataIndex: 'membershipStatus',
      key: 'membershipStatus',
      render: (status) => {
        let color = 'default';
        if (status === 'premium') color = 'gold';
        else if (status === 'basic') color = 'blue';
        else if (status === 'free') color = 'green';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Premium', value: 'premium' },
        { text: 'Basic', value: 'basic' },
        { text: 'Free', value: 'free' },
      ],
      onFilter: (value, record) => record.membershipStatus === value,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Bị khóa'}
        </Tag>
      ),
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Bị khóa', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              icon={<InfoCircleOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Popconfirm
            title={record.isActive ? "Khóa tài khoản này?" : "Mở khóa tài khoản này?"}
            onConfirm={() => handleToggleStatus(record.id, record.isActive)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Tooltip title={record.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}>
              <Button
                type={record.isActive ? "danger" : "primary"}
                icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-users-container">
      <Card>
        <Title level={2}>Quản lý người dùng</Title>
        <Text type="secondary">
          Xem và quản lý tất cả người dùng trong hệ thống NoSmoke.
        </Text>

        <div className="search-container">
          <Input
            placeholder="Tìm kiếm theo tên hoặc email"
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300, marginBottom: 16 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />

        <Modal
          title="Chi tiết người dùng"
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={800}
        >
          {selectedUser && (
            <Tabs defaultActiveKey="1">
              <TabPane tab="Thông tin cơ bản" key="1">
                <div className="user-info">
                  <p><strong>ID:</strong> {selectedUser.id}</p>
                  <p><strong>Họ tên:</strong> {selectedUser.name}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Ngày đăng ký:</strong> {new Date(selectedUser.registeredDate).toLocaleDateString('vi-VN')}</p>
                  <p><strong>Gói thành viên:</strong> {selectedUser.membershipStatus.toUpperCase()}</p>
                  <p><strong>Trạng thái:</strong> {selectedUser.isActive ? 'Hoạt động' : 'Bị khóa'}</p>
                </div>
              </TabPane>
              <TabPane tab="Tiến trình cai thuốc" key="2">
                <p>Đây sẽ hiển thị biểu đồ và dữ liệu tiến trình cai thuốc của người dùng.</p>
              </TabPane>
              <TabPane tab="Kế hoạch" key="3">
                <p>Đây sẽ hiển thị thông tin kế hoạch cai thuốc của người dùng.</p>
              </TabPane>
              <TabPane tab="Huy hiệu" key="4">
                <p>Đây sẽ hiển thị các huy hiệu mà người dùng đã đạt được.</p>
              </TabPane>
            </Tabs>
          )}
        </Modal>
      </Card>
    </div>
  );
}
