import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Typography, 
  Tag, 
  Tooltip, 
  Popconfirm,
  Select,
  Upload,
  message,
  Tabs,
  Avatar,
  List,
  Divider,
  Badge,
  Col,
  Row,
  Statistic
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  UserOutlined,
  UploadOutlined,
  SearchOutlined,
  UnlockOutlined,
  LockOutlined,
  InfoCircleOutlined,
  StarOutlined,
  CheckCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import './AdminCoaches.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

export default function AdminCoaches() {
  const [coaches, setCoaches] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [editingCoach, setEditingCoach] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [sessionHistories, setSessionHistories] = useState([]);
  
  useEffect(() => {
    // Mô phỏng API call để lấy dữ liệu huấn luyện viên
    fetchCoaches();
    fetchUsers();
    fetchAssignments();
  }, []);

  const fetchCoaches = () => {
    setTimeout(() => {
      const mockCoaches = [
        {
          id: 1,
          name: 'Nguyễn Văn A',
          email: 'coach.a@nosmoke.com',
          phone: '0901234567',
          specialization: 'Tư vấn tâm lý',
          experience: '5 năm',
          bio: 'Chuyên gia tư vấn tâm lý với 5 năm kinh nghiệm hỗ trợ cai nghiện thuốc lá.',
          rating: 4.8,
          totalSessions: 156,
          isActive: true,
          availableSlots: 5
        },
        {
          id: 2,
          name: 'Trần Thị B',
          email: 'coach.b@nosmoke.com',
          phone: '0912345678',
          specialization: 'Y tá cấp cứu',
          experience: '7 năm',
          bio: 'Y tá cấp cứu với chuyên môn về các vấn đề hô hấp và tim mạch liên quan đến hút thuốc.',
          rating: 4.5,
          totalSessions: 203,
          isActive: true,
          availableSlots: 3
        },
        {
          id: 3,
          name: 'Lê Văn C',
          email: 'coach.c@nosmoke.com',
          phone: '0898765432',
          specialization: 'Huấn luyện viên cá nhân',
          experience: '3 năm',
          bio: 'Huấn luyện viên cá nhân chuyên về phát triển thói quen lành mạnh thay thế việc hút thuốc.',
          rating: 4.2,
          totalSessions: 89,
          isActive: false,
          availableSlots: 0
        },
      ];
      setCoaches(mockCoaches);
      setLoading(false);
    }, 1000);
  };

  const fetchUsers = () => {
    setTimeout(() => {
      const mockUsers = [
        {
          id: 1,
          name: 'Phạm Văn X',
          email: 'user1@example.com',
          membershipStatus: 'premium',
          coachAssigned: false
        },
        {
          id: 2,
          name: 'Hoàng Thị Y',
          email: 'user2@example.com',
          membershipStatus: 'premium',
          coachAssigned: true
        },
        {
          id: 3,
          name: 'Đỗ Văn Z',
          email: 'user3@example.com',
          membershipStatus: 'premium',
          coachAssigned: false
        }
      ];
      setUsers(mockUsers);
    }, 1200);
  };

  const fetchAssignments = () => {
    setTimeout(() => {
      const mockAssignments = [
        {
          id: 1,
          userId: 2,
          userName: 'Hoàng Thị Y',
          coachId: 1,
          coachName: 'Nguyễn Văn A',
          startDate: '2023-07-01',
          status: 'active',
          sessionsCompleted: 4,
          nextSession: '2023-08-15'
        }
      ];
      setAssignments(mockAssignments);
    }, 1400);
  };

  const fetchSessionHistory = (coachId) => {
    // Mô phỏng API call để lấy lịch sử phiên tư vấn
    setTimeout(() => {
      const mockSessionHistories = [
        {
          id: 1,
          userId: 2,
          userName: 'Hoàng Thị Y',
          date: '2023-07-15',
          duration: 45, // phút
          notes: 'Thảo luận về chiến lược đối phó với cơn thèm thuốc.',
          rating: 5
        },
        {
          id: 2,
          userId: 2,
          userName: 'Hoàng Thị Y',
          date: '2023-07-22',
          duration: 30, // phút
          notes: 'Theo dõi tiến trình cai thuốc tuần đầu tiên.',
          rating: 4
        },
        {
          id: 3,
          userId: 2,
          userName: 'Hoàng Thị Y',
          date: '2023-07-29',
          duration: 40, // phút
          notes: 'Thảo luận về các thói quen thay thế và kỹ thuật thư giãn.',
          rating: 5
        },
        {
          id: 4,
          userId: 2,
          userName: 'Hoàng Thị Y',
          date: '2023-08-05',
          duration: 35, // phút
          notes: 'Đánh giá tiến độ và điều chỉnh kế hoạch cai thuốc.',
          rating: 4
        }
      ];
      setSessionHistories(mockSessionHistories);
    }, 500);
  };

  const showModal = (coach = null) => {
    setEditingCoach(coach);
    if (coach) {
      form.setFieldsValue({
        name: coach.name,
        email: coach.email,
        phone: coach.phone,
        specialization: coach.specialization,
        experience: coach.experience,
        bio: coach.bio,
        isActive: coach.isActive
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        isActive: true
      });
    }
    setIsModalVisible(true);
  };

  const showAssignModal = (coach) => {
    setSelectedCoach(coach);
    assignForm.resetFields();
    setIsAssignModalVisible(true);
  };

  const showViewModal = (coach) => {
    setSelectedCoach(coach);
    fetchSessionHistory(coach.id);
    setIsViewModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleAssignCancel = () => {
    setIsAssignModalVisible(false);
  };

  const handleViewCancel = () => {
    setIsViewModalVisible(false);
  };

  const handleSubmit = (values) => {
    if (editingCoach) {
      // Cập nhật huấn luyện viên hiện có
      setCoaches(coaches.map(c => 
        c.id === editingCoach.id 
          ? { ...c, ...values }
          : c
      ));
      message.success('Thông tin huấn luyện viên đã được cập nhật thành công!');
    } else {
      // Tạo huấn luyện viên mới
      const newCoach = {
        id: Date.now(),
        ...values,
        rating: 0,
        totalSessions: 0,
        availableSlots: 10
      };
      setCoaches([...coaches, newCoach]);
      message.success('Huấn luyện viên đã được thêm thành công!');
    }
    
    setIsModalVisible(false);
  };

  const handleAssignSubmit = (values) => {
    const user = users.find(u => u.id === values.userId);
    const newAssignment = {
      id: Date.now(),
      userId: values.userId,
      userName: user.name,
      coachId: selectedCoach.id,
      coachName: selectedCoach.name,
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
      sessionsCompleted: 0,
      nextSession: values.nextSession
    };
    
    setAssignments([...assignments, newAssignment]);
    
    // Cập nhật trạng thái người dùng
    setUsers(users.map(u => 
      u.id === values.userId 
        ? { ...u, coachAssigned: true }
        : u
    ));
    
    setIsAssignModalVisible(false);
    message.success('Đã phân công huấn luyện viên cho người dùng thành công!');
  };

  const handleDelete = (id) => {
    setCoaches(coaches.filter(c => c.id !== id));
    message.success('Huấn luyện viên đã được xóa thành công!');
  };

  const handleRemoveAssignment = (id) => {
    const assignment = assignments.find(a => a.id === id);
    
    setAssignments(assignments.filter(a => a.id !== id));
    
    // Cập nhật trạng thái người dùng
    setUsers(users.map(u => 
      u.id === assignment.userId 
        ? { ...u, coachAssigned: false }
        : u
    ));
    
    message.success('Đã hủy phân công huấn luyện viên!');
  };

  const handleToggleStatus = (id, currentStatus) => {
    setCoaches(coaches.map(c => 
      c.id === id ? { ...c, isActive: !currentStatus } : c
    ));
    message.success(`Huấn luyện viên đã được ${currentStatus ? 'khóa' : 'kích hoạt'}!`);
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const filteredCoaches = coaches.filter(
    (coach) =>
      coach.name.toLowerCase().includes(searchText.toLowerCase()) ||
      coach.email.toLowerCase().includes(searchText.toLowerCase()) ||
      coach.specialization.toLowerCase().includes(searchText.toLowerCase())
  );

  const coachColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: 'Họ tên',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} /> {text}
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Chuyên môn',
      dataIndex: 'specialization',
      key: 'specialization',
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      render: rating => (
        <Space>
          <StarOutlined style={{ color: '#faad14' }} /> {rating.toFixed(1)}
        </Space>
      ),
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: 'Phiên tư vấn',
      dataIndex: 'totalSessions',
      key: 'totalSessions',
      sorter: (a, b) => a.totalSessions - b.totalSessions,
    },
    {
      title: 'Slot trống',
      dataIndex: 'availableSlots',
      key: 'availableSlots',
      render: slots => (
        <Badge count={slots} style={{ backgroundColor: slots > 0 ? '#52c41a' : '#f5222d' }} />
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: isActive => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Đang hoạt động' : 'Đã khóa'}
        </Tag>
      ),
      filters: [
        { text: 'Đang hoạt động', value: true },
        { text: 'Đã khóa', value: false }
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
              icon={<InfoCircleOutlined />}
              onClick={() => showViewModal(record)}
            />
          </Tooltip>
          <Tooltip title="Phân công người dùng">
            <Button 
              type="primary" 
              ghost
              icon={<UserOutlined />}
              onClick={() => showAssignModal(record)}
              disabled={!record.isActive || record.availableSlots === 0}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => showModal(record)} 
            />
          </Tooltip>
          <Tooltip title={record.isActive ? 'Khóa tài khoản' : 'Mở khóa'}>
            <Button
              icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => handleToggleStatus(record.id, record.isActive)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa huấn luyện viên này?"
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

  const assignmentColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: 'Người dùng',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: 'Huấn luyện viên',
      dataIndex: 'coachName',
      key: 'coachName',
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      render: date => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Phiên hoàn thành',
      dataIndex: 'sessionsCompleted',
      key: 'sessionsCompleted',
    },
    {
      title: 'Phiên tiếp theo',
      dataIndex: 'nextSession',
      key: 'nextSession',
      render: date => date ? new Date(date).toLocaleDateString('vi-VN') : 'Chưa lên lịch'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        let color = 'default';
        let text = 'Không xác định';
        
        if (status === 'active') {
          color = 'green';
          text = 'Đang hoạt động';
        } else if (status === 'completed') {
          color = 'blue';
          text = 'Đã hoàn thành';
        } else if (status === 'cancelled') {
          color = 'red';
          text = 'Đã hủy';
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: 'Đang hoạt động', value: 'active' },
        { text: 'Đã hoàn thành', value: 'completed' },
        { text: 'Đã hủy', value: 'cancelled' }
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title="Bạn có chắc chắn muốn hủy phân công này?"
            onConfirm={() => handleRemoveAssignment(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
            >
              Hủy phân công
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const availableUsers = users.filter(user => 
    user.membershipStatus === 'premium' && !user.coachAssigned
  );

  return (
    <div className="admin-coaches-container">
      <Tabs defaultActiveKey="1">
        <TabPane tab="Huấn luyện viên" key="1">
          <Card>
            <div className="header-with-button">
              <Title level={3}>Quản lý huấn luyện viên</Title>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => showModal()}
              >
                Thêm huấn luyện viên
              </Button>
            </div>
            <Paragraph>
              Quản lý danh sách huấn luyện viên hỗ trợ cai thuốc lá.
            </Paragraph>

            <div className="search-container">
              <Input
                placeholder="Tìm kiếm theo tên, email hoặc chuyên môn"
                prefix={<SearchOutlined />}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 400, marginBottom: 16 }}
              />
            </div>

            <Table
              columns={coachColumns}
              dataSource={filteredCoaches}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Phân công người dùng" key="2">
          <Card>
            <Title level={3}>Phân công người dùng - huấn luyện viên</Title>
            <Paragraph>
              Quản lý việc phân công người dùng premium cho huấn luyện viên.
            </Paragraph>

            <Table
              columns={assignmentColumns}
              dataSource={assignments}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Modal thêm/sửa huấn luyện viên */}
      <Modal
        title={editingCoach ? "Chỉnh sửa thông tin huấn luyện viên" : "Thêm huấn luyện viên mới"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input placeholder="Họ tên huấn luyện viên" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          >
            <Input placeholder="Số điện thoại" />
          </Form.Item>

          <Form.Item
            name="specialization"
            label="Chuyên môn"
            rules={[{ required: true, message: 'Vui lòng nhập chuyên môn!' }]}
          >
            <Input placeholder="Ví dụ: Tư vấn tâm lý, Chuyên gia dinh dưỡng, ..." />
          </Form.Item>

          <Form.Item
            name="experience"
            label="Kinh nghiệm"
            rules={[{ required: true, message: 'Vui lòng nhập kinh nghiệm!' }]}
          >
            <Input placeholder="Ví dụ: 5 năm" />
          </Form.Item>

          <Form.Item
            name="bio"
            label="Giới thiệu"
            rules={[{ required: true, message: 'Vui lòng nhập giới thiệu!' }]}
          >
            <TextArea rows={4} placeholder="Giới thiệu ngắn về huấn luyện viên" />
          </Form.Item>

          <Form.Item 
            name="avatar" 
            label="Ảnh đại diện"
          >
            <Upload 
              listType="picture-card"
              beforeUpload={() => false}
              maxCount={1}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Tải lên</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item name="isActive" label="Trạng thái">
            <Select>
              <Option value={true}>Đang hoạt động</Option>
              <Option value={false}>Tạm khóa</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingCoach ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal phân công người dùng */}
      <Modal
        title="Phân công người dùng cho huấn luyện viên"
        visible={isAssignModalVisible}
        onCancel={handleAssignCancel}
        footer={null}
      >
        {selectedCoach && (
          <Form
            form={assignForm}
            layout="vertical"
            onFinish={handleAssignSubmit}
          >
            <Paragraph>
              <strong>Huấn luyện viên:</strong> {selectedCoach.name}
            </Paragraph>
            <Paragraph>
              <strong>Chuyên môn:</strong> {selectedCoach.specialization}
            </Paragraph>
            <Paragraph>
              <strong>Slot trống:</strong> {selectedCoach.availableSlots}
            </Paragraph>

            <Divider />

            <Form.Item
              name="userId"
              label="Chọn người dùng"
              rules={[{ required: true, message: 'Vui lòng chọn người dùng!' }]}
            >
              <Select placeholder="Chọn người dùng Premium">
                {availableUsers.map(user => (
                  <Option key={user.id} value={user.id}>{user.name} ({user.email})</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="nextSession"
              label="Ngày phiên đầu tiên"
              rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
            >
              <Input type="date" />
            </Form.Item>

            <Form.Item>
              <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleAssignCancel}>Hủy</Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  disabled={availableUsers.length === 0}
                >
                  Xác nhận phân công
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Modal xem chi tiết huấn luyện viên */}
      <Modal
        title="Chi tiết huấn luyện viên"
        visible={isViewModalVisible}
        onCancel={handleViewCancel}
        footer={[
          <Button key="edit" type="primary" onClick={() => {
            handleViewCancel();
            showModal(selectedCoach);
          }}>
            Chỉnh sửa
          </Button>,
          <Button key="close" onClick={handleViewCancel}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedCoach && (
          <div className="coach-detail">
            <div className="coach-header">
              <Avatar size={64} icon={<UserOutlined />} />
              <div className="coach-info">
                <Title level={4}>{selectedCoach.name}</Title>
                <Text>{selectedCoach.specialization} | {selectedCoach.experience}</Text>
              </div>
            </div>

            <Divider />
            
            <Paragraph>{selectedCoach.bio}</Paragraph>

            <Row gutter={16} className="stats-row">
              <Col span={8}>
                <Statistic
                  title="Đánh giá trung bình"
                  value={selectedCoach.rating}
                  precision={1}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<StarOutlined />}
                  suffix="/5"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Tổng số phiên"
                  value={selectedCoach.totalSessions}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Slot trống"
                  value={selectedCoach.availableSlots}
                  valueStyle={{ color: selectedCoach.availableSlots > 0 ? '#52c41a' : '#cf1322' }}
                />
              </Col>
            </Row>

            <Divider orientation="left">Thông tin liên hệ</Divider>
            
            <p><strong>Email:</strong> {selectedCoach.email}</p>
            <p><strong>Điện thoại:</strong> {selectedCoach.phone}</p>

            <Divider orientation="left">
              Lịch sử phiên tư vấn
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {sessionHistories.length} phiên
              </Tag>
            </Divider>
            
            <List
              itemLayout="horizontal"
              dataSource={sessionHistories}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<HistoryOutlined />} />}
                    title={
                      <Space>
                        <span>Phiên với {item.userName} - {new Date(item.date).toLocaleDateString('vi-VN')}</span>
                        <Tag color="gold">{item.rating} <StarOutlined /></Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <p><strong>Thời lượng:</strong> {item.duration} phút</p>
                        <p><strong>Ghi chú:</strong> {item.notes}</p>
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: "Chưa có phiên tư vấn nào" }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
