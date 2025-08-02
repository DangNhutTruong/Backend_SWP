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
  Popconfirm,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Avatar,
  message,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  LockOutlined, 
  UnlockOutlined, 
  InfoCircleOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../utils/api';
import './AdminUsers.css';

const { Title, Text } = Typography;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // Modal states
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize, searchText, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        role: roleFilter,
        status: statusFilter
      });

      const response = await api.fetch(`/api/admin/users?${params}`);
      
      if (response.success) {
        setUsers(response.data.users);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.totalUsers
        }));
      } else {
        message.error('Không thể tải danh sách người dùng');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Lỗi khi tải dữ liệu người dùng');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await api.fetch(`/api/admin/users/${userId}`);
      if (response.success) {
        setUserDetails(response.data);
      } else {
        message.error('Không thể tải chi tiết người dùng');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      message.error('Lỗi khi tải chi tiết người dùng');
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleRoleFilter = (value) => {
    setRoleFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleViewDetails = async (user) => {
    setSelectedUser(user);
    setIsDetailModalVisible(true);
    await fetchUserDetails(user.id);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      date_of_birth: user.date_of_birth ? moment(user.date_of_birth) : null,
      is_active: Boolean(user.is_active)
    });
    setIsEditModalVisible(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      role: 'user',
      is_active: true,
      gender: 'male'
    });
    setIsEditModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      const formData = {
        ...values,
        date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null,
        is_active: values.is_active ? 1 : 0
      };

      let response;
      if (editingUser) {
        response = await api.fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        response = await api.fetch('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }

      if (response.success) {
        message.success(editingUser ? 'Cập nhật người dùng thành công' : 'Tạo người dùng thành công');
        setIsEditModalVisible(false);
        fetchUsers();
      } else {
        message.error(response.message || 'Lỗi khi lưu thông tin người dùng');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      message.error('Lỗi khi lưu thông tin người dùng');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await api.fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PATCH'
      });

      if (response.success) {
        message.success(`${response.data.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} người dùng thành công`);
        fetchUsers();
      } else {
        message.error('Lỗi khi thay đổi trạng thái người dùng');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      message.error('Lỗi khi thay đổi trạng thái người dùng');
    }
  };

  const handleDelete = async (userId) => {
    try {
      const response = await api.fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        message.success('Xóa người dùng thành công');
        fetchUsers();
      } else {
        message.error('Lỗi khi xóa người dùng');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('Lỗi khi xóa người dùng');
    }
  };

  const handleTableChange = (paginationInfo) => {
    setPagination(prev => ({
      ...prev,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize
    }));
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Avatar',
      dataIndex: 'avatar_url',
      key: 'avatar',
      width: 80,
      render: (avatarUrl, record) => (
        <Avatar 
          src={avatarUrl || '/image/default-user-avatar.svg'} 
          icon={<UserOutlined />}
          size={40}
          className="user-avatar"
        />
      ),
    },
    {
      title: 'Họ tên',
      dataIndex: 'full_name',
      key: 'full_name',
      sorter: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        let color = 'default';
        if (role === 'admin') color = 'red';
        else if (role === 'coach') color = 'blue';
        else if (role === 'user') color = 'green';
        return <Tag color={color}>{role?.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'Coach', value: 'coach' },
        { text: 'User', value: 'user' },
        { text: 'Smoker', value: 'smoker' },
      ],
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: true,
      render: (date) => moment(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Bị khóa'}
        </Tag>
      ),
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Bị khóa', value: false },
      ],
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title={record.is_active ? "Khóa tài khoản này?" : "Mở khóa tài khoản này?"}
            onConfirm={() => handleToggleStatus(record.id, record.is_active)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Tooltip title={record.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}>
              <Button
                type={record.is_active ? "danger" : "primary"}
                size="small"
                icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />}
              />
            </Tooltip>
          </Popconfirm>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button
                type="danger"
                size="small"
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <Title level={2}>Quản lý người dùng</Title>

      </div>

        {/* Statistics */}
        <Row gutter={16} className="statistics-row">
          <Col span={6}>
            <Card size="small" className="statistics-card">
              <Statistic
                title="Tổng người dùng"
                value={pagination.total}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="statistics-card">
              <Statistic
                title="Đang hoạt động"
                value={users.filter(u => u.is_active).length}
                valueStyle={{ color: '#3f8600' }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="statistics-card">
              <Statistic
                title="Bị khóa"
                value={users.filter(u => !u.is_active).length}
                valueStyle={{ color: '#cf1322' }}
                prefix={<LockOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="statistics-card">
              <Statistic
                title="Huấn luyện viên"
                value={users.filter(u => u.role === 'coach').length}
                valueStyle={{ color: '#1890ff' }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Row gutter={16} className="filters-row">
          <Col span={8}>
            <Input
              placeholder="Tìm kiếm theo tên hoặc email"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Vai trò"
              value={roleFilter}
              onChange={handleRoleFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="coach">Coach</Select.Option>
              <Select.Option value="user">User</Select.Option>
              <Select.Option value="smoker">Smoker</Select.Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={handleStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="true">Hoạt động</Select.Option>
              <Select.Option value="false">Bị khóa</Select.Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              style={{ width: '100%' }}
            >
              Thêm người dùng
            </Button>
          </Col>
          <Col span={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchUsers}
              style={{ width: '100%' }}
            >
              Làm mới
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} người dùng`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />

        {/* Detail Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar 
                src={selectedUser?.avatar_url || '/image/default-user-avatar.svg'} 
                icon={<UserOutlined />}
                size={40}
                className="user-avatar"
              />
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>
                  Chi tiết người dùng - {selectedUser?.full_name}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  ID: {selectedUser?.id} | {selectedUser?.email}
                </div>
              </div>
            </div>
          }
          visible={isDetailModalVisible}
          onCancel={() => setIsDetailModalVisible(false)}
          footer={[
            <Button key="edit" type="primary" onClick={() => {
              setIsDetailModalVisible(false);
              handleEdit(selectedUser);
            }}>
              Chỉnh sửa
            </Button>,
            <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
              Đóng
            </Button>
          ]}
          width={1000}
        >
          {selectedUser && (
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane tab="Thông tin cơ bản" key="1">
                <Row gutter={24}>
                  <Col span={8}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <Avatar
                        size={120}
                        src={selectedUser.avatar_url || '/image/default-user-avatar.svg'}
                        icon={<UserOutlined />}
                        className="user-avatar"
                      />
                      <div style={{ marginTop: 16 }}>
                        <Title level={4}>{selectedUser.full_name}</Title>
                        <Tag color={
                          selectedUser.role === 'admin' ? 'red' :
                          selectedUser.role === 'coach' ? 'blue' :
                          selectedUser.role === 'smoker' ? 'orange' : 'green'
                        }>
                          {selectedUser.role?.toUpperCase()}
                        </Tag>
                        <br />
                        <Tag color={selectedUser.is_active ? 'green' : 'red'} style={{ marginTop: 8 }}>
                          {selectedUser.is_active ? 'Hoạt động' : 'Bị khóa'}
                        </Tag>
                      </div>
                    </div>
                  </Col>
                  <Col span={16}>
                    <div className="user-detail-info">
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Text strong>ID:</Text><br />
                          <Text>{selectedUser.id}</Text>
                        </Col>
                        <Col span={12}>
                          <Text strong>Username:</Text><br />
                          <Text>{selectedUser.username || 'Chưa có'}</Text>
                        </Col>
                        <Col span={12}>
                          <Text strong>Email:</Text><br />
                          <Text>{selectedUser.email}</Text>
                        </Col>
                        <Col span={12}>
                          <Text strong>Số điện thoại:</Text><br />
                          <Text>{selectedUser.phone || 'Chưa có'}</Text>
                        </Col>
                        <Col span={12}>
                          <Text strong>Giới tính:</Text><br />
                          <Text>{
                            selectedUser.gender === 'male' ? 'Nam' :
                            selectedUser.gender === 'female' ? 'Nữ' :
                            selectedUser.gender === 'other' ? 'Khác' : 'Chưa có'
                          }</Text>
                        </Col>
                        <Col span={12}>
                          <Text strong>Ngày sinh:</Text><br />
                          <Text>
                            {selectedUser.date_of_birth ? 
                              moment(selectedUser.date_of_birth).format('DD/MM/YYYY') : 
                              'Chưa có'
                            }
                          </Text>
                        </Col>
                        <Col span={12}>
                          <Text strong>Ngày đăng ký:</Text><br />
                          <Text>{moment(selectedUser.created_at).format('DD/MM/YYYY HH:mm')}</Text>
                        </Col>
                        <Col span={12}>
                          <Text strong>Cập nhật lần cuối:</Text><br />
                          <Text>
                            {selectedUser.updated_at ? 
                              moment(selectedUser.updated_at).format('DD/MM/YYYY HH:mm') : 
                              'Chưa có'
                            }
                          </Text>
                        </Col>
                      </Row>
                    </div>
                  </Col>
                </Row>
              </Tabs.TabPane>
              
              <Tabs.TabPane tab="Tiến trình cai thuốc" key="2">
                <div className="user-progress-chart">
                  {userDetails?.smokingProgress && userDetails.smokingProgress.length > 0 ? (
                    <div>
                      <Title level={5}>Lịch sử tiến trình cai thuốc</Title>
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {userDetails.smokingProgress.map((progress, index) => (
                          <Card key={index} size="small" style={{ marginBottom: 8 }}>
                            <Row gutter={16}>
                              <Col span={6}>
                                <Text strong>Ngày:</Text><br />
                                <Text>{moment(progress.date).format('DD/MM/YYYY')}</Text>
                              </Col>
                              <Col span={6}>
                                <Text strong>Số điếu thuốc:</Text><br />
                                <Text>{progress.cigarettes_smoked || 0}</Text>
                              </Col>
                              <Col span={6}>
                                <Text strong>Tiết kiệm:</Text><br />
                                <Text>{progress.money_saved || 0} VND</Text>
                              </Col>
                              <Col span={6}>
                                <Text strong>Ghi chú:</Text><br />
                                <Text>{progress.notes || 'Không có'}</Text>
                              </Col>
                            </Row>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Text type="secondary">Chưa có dữ liệu tiến trình cai thuốc</Text>
                    </div>
                  )}
                </div>
              </Tabs.TabPane>
              
              <Tabs.TabPane tab="Lịch hẹn" key="3">
                <div>
                  {userDetails?.appointments && userDetails.appointments.length > 0 ? (
                    <div>
                      <Title level={5}>Lịch sử cuộc hẹn</Title>
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {userDetails.appointments.map((appointment, index) => (
                          <Card key={index} size="small" style={{ marginBottom: 8 }}>
                            <Row gutter={16}>
                              <Col span={8}>
                                <Text strong>Ngày hẹn:</Text><br />
                                <Text>{moment(appointment.date).format('DD/MM/YYYY HH:mm')}</Text>
                              </Col>
                              <Col span={8}>
                                <Text strong>Huấn luyện viên:</Text><br />
                                <Text>{appointment.coach_name || 'Chưa có'}</Text>
                              </Col>
                              <Col span={8}>
                                <Text strong>Trạng thái:</Text><br />
                                <Tag color={
                                  appointment.status === 'completed' ? 'green' :
                                  appointment.status === 'pending' ? 'blue' :
                                  appointment.status === 'cancelled' ? 'red' : 'default'
                                }>
                                  {appointment.status || 'Chưa rõ'}
                                </Tag>
                              </Col>
                              {appointment.notes && (
                                <Col span={24} style={{ marginTop: 8 }}>
                                  <Text strong>Ghi chú:</Text><br />
                                  <Text>{appointment.notes}</Text>
                                </Col>
                              )}
                            </Row>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Text type="secondary">Chưa có lịch hẹn nào</Text>
                    </div>
                  )}
                </div>
              </Tabs.TabPane>
              
              <Tabs.TabPane tab="Thống kê" key="4">
                <Row gutter={16}>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic
                        title="Tổng số cuộc hẹn"
                        value={userDetails?.appointments?.length || 0}
                        prefix={<InfoCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic
                        title="Cuộc hẹn hoàn thành"
                        value={userDetails?.appointments?.filter(a => a.status === 'completed').length || 0}
                        valueStyle={{ color: '#3f8600' }}
                        prefix={<InfoCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic
                        title="Ngày tham gia"
                        value={selectedUser?.created_at ? moment().diff(moment(selectedUser.created_at), 'days') : 0}
                        suffix="ngày"
                        prefix={<InfoCircleOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>
                
                <Divider />
                
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">
                    Thêm biểu đồ và thống kê chi tiết sẽ được phát triển trong tương lai
                  </Text>
                </div>
              </Tabs.TabPane>
            </Tabs>
          )}
        </Modal>

        {/* Edit/Create Modal */}
        <Modal
          title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
          visible={isEditModalVisible}
          onCancel={() => setIsEditModalVisible(false)}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[{ required: true, message: 'Vui lòng nhập username' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' }
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="full_name"
                  label="Họ tên"
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            {!editingUser && (
              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
              >
                <Input.Password />
              </Form.Item>
            )}

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="role"
                  label="Vai trò"
                  rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                >
                  <Select>
                    <Select.Option value="user">User</Select.Option>
                    <Select.Option value="smoker">Smoker</Select.Option>
                    <Select.Option value="coach">Coach</Select.Option>
                    <Select.Option value="admin">Admin</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
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
              </Col>
              <Col span={8}>
                <Form.Item
                  name="date_of_birth"
                  label="Ngày sinh"
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="is_active"
              label="Trạng thái"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Hoạt động"
                unCheckedChildren="Bị khóa"
              />
            </Form.Item>

            <Divider />

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingUser ? 'Cập nhật' : 'Tạo mới'}
                </Button>
                <Button onClick={() => setIsEditModalVisible(false)}>
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
    </div>
  );
};

export default AdminUsers;
