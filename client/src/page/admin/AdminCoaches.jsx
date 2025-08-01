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
import api from '../../utils/api';
import './AdminCoaches.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

// Temporary mock data until backend is ready
const MOCK_USERS = [
  { 
    id: 1, 
    name: 'Nguyễn Văn Anh', 
    email: 'user1@example.com',
    membershipStatus: 'premium',
    coachAssigned: false 
  },
  { 
    id: 2, 
    name: 'Trần Thị Bình', 
    email: 'user2@example.com',
    membershipStatus: 'premium',
    coachAssigned: true 
  },
  { 
    id: 3, 
    name: 'Lê Minh Công', 
    email: 'user3@example.com',
    membershipStatus: 'premium',
    coachAssigned: false 
  }
];

const MOCK_ASSIGNMENTS = [
  { 
    id: 1, 
    userId: 2, 
    coachId: 1,
    userName: 'Trần Thị Bình', 
    coachName: 'Nguyên Văn A',
    startDate: '2025-07-15',
    sessionsCompleted: 2,
    nextSession: '2025-08-05',
    status: 'active'
  }
];

const MOCK_SESSION_HISTORIES = [
  {
    id: 1,
    coachId: 1,
    userId: 2,
    userName: 'Trần Thị Bình',
    date: '2025-07-20',
    duration: 45,
    rating: 4.5,
    notes: 'Thảo luận về các chiến lược cai thuốc lá trong tháng đầu tiên'
  },
  {
    id: 2,
    coachId: 1,
    userId: 2,
    userName: 'Trần Thị Bình',
    date: '2025-07-28',
    duration: 30,
    rating: 4.8,
    notes: 'Theo dõi tiến độ và điều chỉnh kế hoạch cai thuốc'
  }
];

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
    // Fetch data from API
    const fetchData = async () => {
      await fetchCoaches();
      await fetchUsers();
      await fetchAssignments();
    };
    
    fetchData();
  }, []);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      console.log('Fetching coaches from API...');
      
      const data = await api.fetch('/api/admin/coaches');
      console.log('Received coaches data:', data);
      
      if (data.success && Array.isArray(data.data)) {
        // Map backend field names to frontend field names
        const mappedCoaches = data.data.map(coach => ({
          id: coach.id,
          name: coach.full_name || coach.name || 'Unknown',
          email: coach.email || '',
          phone: coach.phone || '',
          specialization: coach.specialization || '',
          experience: coach.experience || 0,
          bio: coach.bio || '',
          isActive: coach.is_active === 1 || coach.isActive || false,
          rating: coach.rating !== null && coach.rating !== undefined ? parseFloat(coach.rating) : 0,
          totalSessions: coach.appointment_count || coach.totalSessions || 0,
          availableSlots: coach.available_slots_count || (Array.isArray(coach.available_slots) ? coach.available_slots.length : 0) || coach.availableSlots || 0
        }));
        setCoaches(mappedCoaches);
      } else {
        console.error('Invalid response format from API:', data);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
      message.error('Không thể tải dữ liệu huấn luyện viên. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching premium users from API...');
      try {
        const data = await api.fetch('/api/admin/users/premium');
        console.log('Received premium users data:', data);
        
        if (data.success && Array.isArray(data.data)) {
          // Map backend field names to frontend field names
          const mappedUsers = data.data.map(user => ({
            id: user.id,
            name: user.name || user.full_name || 'Unknown',
            email: user.email || '',
            membershipStatus: user.membershipStatus || 'premium',
            coachAssigned: user.coachAssigned || false
          }));
          setUsers(mappedUsers);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (apiError) {
        // If API fails, use mock data temporarily
        console.warn('Using mock user data until backend endpoint is ready');
        setUsers(MOCK_USERS);
        // Don't show error to user for mock data
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      // Still use mock data as fallback
      setUsers(MOCK_USERS);
    }
  };

  const fetchAssignments = async () => {
    try {
      console.log('Fetching coach assignments from API...');
      
      try {
        const data = await api.fetch('/api/admin/coach-assignments');
        console.log('Received coach assignments data:', data);
        
        if (data.success && Array.isArray(data.data)) {
          // Map backend field names to frontend field names
          const mappedAssignments = data.data.map(assignment => ({
            id: assignment.id,
            userId: assignment.userId || assignment.user_id,
            coachId: assignment.coachId || assignment.coach_id,
            userName: assignment.userName || assignment.user_name || 'Unknown User',
            coachName: assignment.coachName || assignment.coach_name || 'Unknown Coach',
            startDate: assignment.startDate || assignment.start_date,
            sessionsCompleted: assignment.sessionsCompleted || assignment.sessions_completed || 0,
            nextSession: assignment.nextSession || assignment.next_session,
            status: assignment.status || 'active'
          }));
          setAssignments(mappedAssignments);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (apiError) {
        // If API fails, use mock data temporarily
        console.warn('Using mock assignment data until backend endpoint is ready');
        setAssignments(MOCK_ASSIGNMENTS);
        // Don't show error to user for mock data
      }
    } catch (error) {
      console.error('Error in fetchAssignments:', error);
      // Still use mock data as fallback
      setAssignments(MOCK_ASSIGNMENTS);
    }
  };

  const fetchSessionHistory = async (coachId) => {
    try {
      console.log(`Fetching session history for coach ${coachId} from API...`);
      try {
        // Sử dụng một URL có thể debug được
        const url = `/api/admin/coaches/${coachId}/sessions`;
        console.log(`API URL: ${url}`);
        
        const data = await api.fetch(url);
        console.log(`Received session history for coach ${coachId}:`, data);
        
        if (data.success && Array.isArray(data.data)) {
          console.log(`Found ${data.data.length} session records for coach ${coachId}`);
          
          // Map backend field names to frontend field names
          const mappedSessions = data.data.map(session => ({
            id: session.id,
            coachId: session.coachId || session.coach_id,
            userId: session.userId || session.user_id,
            userName: session.userName || session.user_name || 'Unknown User',
            date: session.date || session.session_date || new Date().toISOString().split('T')[0],
            time: session.time || '',
            duration: session.duration || session.duration_minutes || 0,
            rating: session.rating !== null && session.rating !== undefined ? parseFloat(session.rating) : 0,
            notes: '' // Không còn trường notes từ backend
          }));
          
          console.log('Mapped session data:', mappedSessions);
          setSessionHistories(mappedSessions);
        } else {
          console.warn('API returned success=false or data is not an array:', data);
          throw new Error(data.message || 'Invalid response format');
        }
      } catch (apiError) {
        console.warn('API error:', apiError);
        // If API fails, use mock data temporarily
        console.warn('Using mock session history data until backend endpoint is ready');
        // Filter mock data for this specific coach
        const filteredSessions = MOCK_SESSION_HISTORIES.filter(session => session.coachId === coachId);
        console.log(`Using ${filteredSessions.length} mock sessions for coach ${coachId}`);
        setSessionHistories(filteredSessions);
        // Don't show error to user for mock data
      }
    } catch (error) {
      console.error(`Error fetching session history for coach ${coachId}:`, error);
      message.error('Không thể tải lịch sử phiên tư vấn. Vui lòng thử lại sau.');
      setSessionHistories([]);
    }
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

  const handleSubmit = async (values) => {
    try {
      const url = editingCoach 
        ? `/api/admin/coaches/${editingCoach.id}` 
        : '/api/admin/coaches';
      
      const method = editingCoach ? 'PUT' : 'POST';
      
      console.log(`${editingCoach ? 'Updating' : 'Creating'} coach with API...`);
      const data = await api.fetch(url, {
        method,
        body: JSON.stringify(values),
      });
      
      console.log(`Coach ${editingCoach ? 'updated' : 'created'} successfully:`, data);
      
      if (data.success) {
        message.success(`Huấn luyện viên đã được ${editingCoach ? 'cập nhật' : 'thêm'} thành công!`);
        fetchCoaches(); // Refresh the coaches list
        setIsModalVisible(false);
      } else {
        throw new Error(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error(`Error ${editingCoach ? 'updating' : 'creating'} coach:`, error);
      message.error(`Không thể ${editingCoach ? 'cập nhật' : 'thêm'} huấn luyện viên. Vui lòng thử lại sau.`);
    }
  };

  const handleAssignSubmit = async (values) => {
    try {
      console.log('Assigning coach to user with API...');
      try {
        const data = await api.fetch('/api/admin/coach-assignments', {
          method: 'POST',
          body: JSON.stringify({
            userId: values.userId,
            coachId: selectedCoach.id,
            nextSession: values.nextSession
          }),
        });
        
        console.log('Coach assigned to user successfully:', data);
        
        if (data.success) {
          message.success('Đã phân công huấn luyện viên cho người dùng thành công!');
          setIsAssignModalVisible(false);
          fetchAssignments(); // Refresh the assignments list
          fetchUsers(); // Refresh the users list to update their coach assignment status
        } else {
          throw new Error(data.message || 'Assignment failed');
        }
      } catch (apiError) {
        console.warn('Using mock data for coach assignment as endpoint is not available');
        
        // Find the user in mock data
        const user = MOCK_USERS.find(u => u.id === values.userId);
        if (user) {
          // Update mock user status
          user.coachAssigned = true;
          
          // Create new mock assignment
          const newAssignment = {
            id: Date.now(), // Use timestamp as temporary ID
            userId: values.userId,
            coachId: selectedCoach.id,
            userName: user.name,
            coachName: selectedCoach.name,
            startDate: new Date().toISOString().split('T')[0],
            sessionsCompleted: 0,
            nextSession: values.nextSession,
            status: 'active'
          };
          
          // Add to mock data
          MOCK_ASSIGNMENTS.push(newAssignment);
          
          message.success('Đã phân công huấn luyện viên cho người dùng thành công! (Dữ liệu giả)');
          setIsAssignModalVisible(false);
          setAssignments([...MOCK_ASSIGNMENTS]);
          setUsers([...MOCK_USERS]);
        } else {
          throw new Error('User not found in mock data');
        }
      }
    } catch (error) {
      console.error('Error assigning coach to user:', error);
      message.error('Không thể phân công huấn luyện viên. Vui lòng thử lại sau.');
    }
  };

  const handleDelete = async (id) => {
    try {
      console.log(`Deleting coach ${id} with API...`);
      const data = await api.fetch(`/api/admin/coaches/${id}`, {
        method: 'DELETE',
      });
      
      console.log(`Coach ${id} deleted successfully:`, data);
      
      if (data.success) {
        message.success('Huấn luyện viên đã được xóa thành công!');
        fetchCoaches(); // Refresh the coaches list
      } else {
        throw new Error(data.message || 'Deletion failed');
      }
    } catch (error) {
      console.error(`Error deleting coach ${id}:`, error);
      message.error('Không thể xóa huấn luyện viên. Vui lòng thử lại sau.');
    }
  };

  const handleRemoveAssignment = async (id) => {
    try {
      console.log(`Removing coach assignment ${id} with API...`);
      try {
        const data = await api.fetch(`/api/admin/coach-assignments/${id}`, {
          method: 'DELETE',
        });
        
        console.log(`Coach assignment ${id} removed successfully:`, data);
        
        if (data.success) {
          message.success('Đã hủy phân công huấn luyện viên!');
          fetchAssignments(); // Refresh the assignments list
          fetchUsers(); // Refresh the users list to update their coach assignment status
        } else {
          throw new Error(data.message || 'Removal failed');
        }
      } catch (apiError) {
        // If API fails, update mock data temporarily
        console.warn('Using mock data for removing assignment until backend endpoint is ready');
        
        // Find the assignment in mock data
        const assignmentIndex = MOCK_ASSIGNMENTS.findIndex(a => a.id === id);
        if (assignmentIndex !== -1) {
          const assignment = MOCK_ASSIGNMENTS[assignmentIndex];
          
          // Find the user and update status
          const user = MOCK_USERS.find(u => u.id === assignment.userId);
          if (user) {
            user.coachAssigned = false;
          }
          
          // Remove the assignment from mock data
          MOCK_ASSIGNMENTS.splice(assignmentIndex, 1);
          
          message.success('Đã hủy phân công huấn luyện viên! (Dữ liệu giả)');
          setAssignments([...MOCK_ASSIGNMENTS]);
          setUsers([...MOCK_USERS]);
        } else {
          throw new Error('Assignment not found in mock data');
        }
      }
    } catch (error) {
      console.error(`Error removing coach assignment ${id}:`, error);
      message.error('Không thể hủy phân công huấn luyện viên. Vui lòng thử lại sau.');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      console.log(`Toggling status for coach ${id} with API...`);
      const data = await api.fetch(`/api/admin/coaches/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          isActive: !currentStatus
        }),
      });
      
      console.log(`Coach ${id} status toggled successfully:`, data);
      
      if (data.success) {
        message.success(`Huấn luyện viên đã được ${currentStatus ? 'khóa' : 'kích hoạt'}!`);
        fetchCoaches(); // Refresh the coaches list
      } else {
        throw new Error(data.message || 'Status toggle failed');
      }
    } catch (error) {
      console.error(`Error toggling status for coach ${id}:`, error);
      message.error(`Không thể ${currentStatus ? 'khóa' : 'kích hoạt'} huấn luyện viên. Vui lòng thử lại sau.`);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const filteredCoaches = coaches.filter(
    (coach) =>
      (coach.name || coach.full_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (coach.email || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (coach.specialization || '').toLowerCase().includes(searchText.toLowerCase())
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
      render: rating => {
        // Convert to number to handle SQL null, undefined, or string values
        const numericRating = rating !== null && rating !== undefined ? parseFloat(rating) : 0;
        return (
          <Space>
            <StarOutlined style={{ color: '#faad14' }} /> {numericRating.toFixed(1)}
          </Space>
        );
      },
      sorter: (a, b) => {
        const ratingA = a.rating !== null && a.rating !== undefined ? parseFloat(a.rating) : 0;
        const ratingB = b.rating !== null && b.rating !== undefined ? parseFloat(b.rating) : 0;
        return ratingA - ratingB;
      },
    },
    {
      title: 'Phiên tư vấn',
      dataIndex: 'totalSessions',
      key: 'totalSessions',
      render: totalSessions => totalSessions || 0,
      sorter: (a, b) => (a.totalSessions || 0) - (b.totalSessions || 0),
    },
    {
      title: 'Slot trống',
      dataIndex: 'availableSlots',
      key: 'availableSlots',
      render: slots => {
        const slotCount = slots || 0;
        return (
          <Badge count={slotCount} style={{ backgroundColor: slotCount > 0 ? '#52c41a' : '#f5222d' }} />
        );
      }
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
                  value={selectedCoach.rating !== null && selectedCoach.rating !== undefined ? parseFloat(selectedCoach.rating) : 0}
                  precision={1}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<StarOutlined />}
                  suffix="/5"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Tổng số phiên"
                  value={selectedCoach.totalSessions || 0}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Slot trống"
                  value={selectedCoach.availableSlots || 0}
                  valueStyle={{ color: (selectedCoach.availableSlots || 0) > 0 ? '#52c41a' : '#cf1322' }}
                />
              </Col>
            </Row>

            <Divider />
            
            <div>
              <Title level={5}>
                <HistoryOutlined /> Lịch sử phiên tư vấn
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {sessionHistories.length} phiên
                </Tag>
              </Title>
              
              <List
                itemLayout="horizontal"
                dataSource={sessionHistories}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>Phiên với {item.userName} - {new Date(item.date).toLocaleDateString('vi-VN')}</span>
                          <Tag color="gold">{item.rating !== null && item.rating !== undefined ? parseFloat(item.rating) : 0} <StarOutlined /></Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <p><strong>Thời lượng:</strong> {item.duration} phút</p>
                          <p><strong>Thời gian:</strong> {item.time || 'Không có thông tin'}</p>
                        </div>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: "Chưa có phiên tư vấn nào" }}
              />
            </div>

            <Divider />
            
            <div>
              <p><strong>Email:</strong> {selectedCoach.email}</p>
              <p><strong>Số điện thoại:</strong> {selectedCoach.phone}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
