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
  InputNumber,
  Divider,
  List,
  message
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  EyeOutlined,
  CopyOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined
} from '@ant-design/icons';
import './AdminQuitPlans.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function AdminQuitPlans() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  
  useEffect(() => {
    // Mô phỏng API call để lấy dữ liệu kế hoạch mẫu
    fetchTemplates();
  }, []);

  const fetchTemplates = () => {
    setTimeout(() => {
      // Dữ liệu hard-code dựa trên JourneyStepper.jsx
      const mockTemplates = [
        // Light Smoker Plans (<10 điếu/ngày)
        {
          id: 1,
          name: 'Kế hoạch nhanh (người hút nhẹ)',
          description: 'Cai thuốc trong 4 tuần cho người hút ít thuốc',
          duration: 28, // 4 tuần = 28 ngày
          difficulty: 'hard', // Giảm 25% mỗi tuần
          weeklyReductionRate: 0.25,
          totalWeeks: 4,
          color: '#28a745',
          steps: [
            { day: 1, title: 'Bắt đầu theo dõi', content: 'Ghi lại số điếu thuốc hút hàng ngày và thời điểm hút' },
            { day: 7, title: 'Tuần 1 - Giảm 25%', content: 'Giảm 25% số lượng thuốc, tập trung vào việc bỏ những điếu thuốc không cần thiết' },
            { day: 14, title: 'Tuần 2 - Tiếp tục giảm', content: 'Tiếp tục giảm 25% so với tuần trước, thay thế bằng hoạt động khác' },
            { day: 21, title: 'Tuần 3 - Giai đoạn cuối', content: 'Chỉ còn vài điếu mỗi ngày, chuẩn bị cho tuần cuối' },
            { day: 28, title: 'Tuần 4 - Hoàn thành', content: 'Dừng hoàn toàn việc hút thuốc, tập trung vào duy trì' }
          ],
          targetUsers: ['light-smokers'],
          isPublished: true,
          usageCount: 0
        },
        {
          id: 2,
          name: 'Kế hoạch từ từ (người hút nhẹ)',
          description: 'Cai thuốc trong 6 tuần với cách tiếp cận thận trọng',
          duration: 42, // 6 tuần = 42 ngày
          difficulty: 'medium', // Giảm 20% mỗi tuần
          weeklyReductionRate: 0.20,
          totalWeeks: 6,
          color: '#6f42c1',
          steps: [
            { day: 1, title: 'Chuẩn bị tâm lý', content: 'Xác định động lực cai thuốc và viết ra danh sách lý do' },
            { day: 7, title: 'Tuần 1 - Giảm nhẹ', content: 'Giảm 20% số lượng thuốc, bắt đầu từ từ' },
            { day: 14, title: 'Tuần 2 - Thích nghi', content: 'Tiếp tục giảm, cơ thể bắt đầu thích nghi' },
            { day: 21, title: 'Tuần 3 - Ổn định', content: 'Duy trì nhịp độ giảm ổn định' },
            { day: 28, title: 'Tuần 4 - Tiến bộ', content: 'Thấy được tiến bộ rõ rệt' },
            { day: 35, title: 'Tuần 5 - Chuẩn bị', content: 'Chuẩn bị cho tuần cuối cùng' },
            { day: 42, title: 'Tuần 6 - Hoàn thành', content: 'Hoàn toàn dừng hút thuốc' }
          ],
          targetUsers: ['light-smokers', 'beginners'],
          isPublished: true,
          usageCount: 0
        },
        
        // Moderate Smoker Plans (10-20 điếu/ngày)
        {
          id: 3,
          name: 'Kế hoạch nhanh (người hút trung bình)',
          description: 'Cai thuốc trong 6 tuần cho người hút trung bình',
          duration: 42, // 6 tuần = 42 ngày
          difficulty: 'hard', // Giảm 20% mỗi tuần
          weeklyReductionRate: 0.20,
          totalWeeks: 6,
          color: '#ffc107',
          steps: [
            { day: 1, title: 'Quyết tâm cao', content: 'Cam kết nghiêm túc với kế hoạch cai thuốc' },
            { day: 7, title: 'Tuần 1 - Giảm mạnh', content: 'Giảm 20% ngay từ tuần đầu' },
            { day: 14, title: 'Tuần 2 - Duy trì', content: 'Tiếp tục giảm với quyết tâm cao' },
            { day: 21, title: 'Tuần 3 - Vượt khó', content: 'Vượt qua giai đoạn khó khăn nhất' },
            { day: 28, title: 'Tuần 4 - Ổn định', content: 'Thói quen mới bắt đầu hình thành' },
            { day: 35, title: 'Tuần 5 - Hoàn thiện', content: 'Gần như hoàn thành mục tiêu' },
            { day: 42, title: 'Tuần 6 - Thành công', content: 'Hoàn toàn cai thuốc thành công' }
          ],
          targetUsers: ['moderate-smokers'],
          isPublished: true,
          usageCount: 0
        },
        {
          id: 4,
          name: 'Kế hoạch từ từ (người hút trung bình)',
          description: 'Cai thuốc trong 8 tuần với cách tiếp cận ổn định',
          duration: 56, // 8 tuần = 56 ngày
          difficulty: 'medium', // Giảm 15% mỗi tuần
          weeklyReductionRate: 0.15,
          totalWeeks: 8,
          color: '#17a2b8',
          steps: [
            { day: 1, title: 'Bắt đầu hành trình', content: 'Thiết lập mục tiêu và kế hoạch chi tiết' },
            { day: 7, title: 'Tuần 1 - Khởi đầu', content: 'Giảm 15% một cách ổn định' },
            { day: 14, title: 'Tuần 2 - Thích nghi', content: 'Cơ thể bắt đầu thích nghi với việc giảm' },
            { day: 21, title: 'Tuần 3 - Tiến bộ', content: 'Thấy được những tiến bộ đầu tiên' },
            { day: 28, title: 'Tuần 4 - Ổn định', content: 'Duy trì nhịp độ ổn định' },
            { day: 35, title: 'Tuần 5 - Tự tin', content: 'Tăng thêm tự tin trong quá trình' },
            { day: 42, title: 'Tuần 6 - Tiến xa', content: 'Đã tiến được một chặng đường dài' },
            { day: 49, title: 'Tuần 7 - Chuẩn bị', content: 'Chuẩn bị cho tuần cuối cùng' },
            { day: 56, title: 'Tuần 8 - Hoàn thành', content: 'Hoàn thành mục tiêu cai thuốc' }
          ],
          targetUsers: ['moderate-smokers'],
          isPublished: true,
          usageCount: 2
        },
        
        // Heavy Smoker Plans (>20 điếu/ngày)
        {
          id: 5,
          name: 'Kế hoạch nhanh (người hút nặng)',
          description: 'Cai thuốc trong 8 tuần cho người hút nhiều thuốc',
          duration: 56, // 8 tuần = 56 ngày
          difficulty: 'hard', // Giảm 15% mỗi tuần
          weeklyReductionRate: 0.15,
          totalWeeks: 8,
          color: '#fd7e14',
          steps: [
            { day: 1, title: 'Ý chí mạnh mẽ', content: 'Cần có ý chí mạnh mẽ và quyết tâm cao' },
            { day: 7, title: 'Tuần 1 - Thích nghi', content: 'Giai đoạn thích nghi, giảm 15% từ từ' },
            { day: 14, title: 'Tuần 2 - Thích nghi', content: 'Tiếp tục thích nghi với lượng thuốc ít hơn' },
            { day: 21, title: 'Tuần 3 - Ổn định', content: 'Bước vào giai đoạn ổn định' },
            { day: 28, title: 'Tuần 4 - Ổn định', content: 'Duy trì sự ổn định trong quá trình' },
            { day: 35, title: 'Tuần 5 - Ổn định', content: 'Tiếp tục giai đoạn ổn định' },
            { day: 42, title: 'Tuần 6 - Hoàn thiện', content: 'Bước vào giai đoạn hoàn thiện' },
            { day: 49, title: 'Tuần 7 - Hoàn thiện', content: 'Gần hoàn thành mục tiêu' },
            { day: 56, title: 'Tuần 8 - Thành công', content: 'Hoàn thành việc cai thuốc' }
          ],
          targetUsers: ['heavy-smokers'],
          isPublished: true,
          usageCount: 0
        },
        {
          id: 6,
          name: 'Kế hoạch từ từ (người hút nặng)',
          description: 'Cai thuốc trong 12 tuần với cách tiếp cận thận trọng',
          duration: 84, // 12 tuần = 84 ngày
          difficulty: 'easy', // Giảm 10% mỗi tuần
          weeklyReductionRate: 0.10,
          totalWeeks: 12,
          color: '#dc3545',
          steps: [
            { day: 1, title: 'Cách tiếp cận thận trọng', content: 'Bắt đầu với cách tiếp cận từ từ và thận trọng' },
            { day: 7, title: 'Tuần 1 - Thích nghi', content: 'Giảm 10% một cách nhẹ nhàng' },
            { day: 14, title: 'Tuần 2 - Thích nghi', content: 'Tiếp tục giai đoạn thích nghi' },
            { day: 21, title: 'Tuần 3 - Thích nghi', content: 'Hoàn thành giai đoạn thích nghi' },
            { day: 28, title: 'Tuần 4 - Ổn định', content: 'Bước vào giai đoạn ổn định' },
            { day: 35, title: 'Tuần 5 - Ổn định', content: 'Duy trì sự ổn định' },
            { day: 42, title: 'Tuần 6 - Ổn định', content: 'Tiếp tục ổn định' },
            { day: 49, title: 'Tuần 7 - Ổn định', content: 'Giai đoạn ổn định kéo dài' },
            { day: 56, title: 'Tuần 8 - Ổn định', content: 'Hoàn thành giai đoạn ổn định' },
            { day: 63, title: 'Tuần 9 - Hoàn thiện', content: 'Bước vào giai đoạn hoàn thiện' },
            { day: 70, title: 'Tuần 10 - Hoàn thiện', content: 'Tiếp tục hoàn thiện' },
            { day: 77, title: 'Tuần 11 - Hoàn thiện', content: 'Gần hoàn thành mục tiêu' },
            { day: 84, title: 'Tuần 12 - Thành công', content: 'Hoàn thành việc cai thuốc sau 12 tuần' }
          ],
          targetUsers: ['heavy-smokers', 'beginners'],
          isPublished: true,
          usageCount: 4
        }
      ];
      setTemplates(mockTemplates);
      setLoading(false);
    }, 1000);
  };

  const showModal = (template = null) => {
    setEditingTemplate(template);
    if (template) {
      form.setFieldsValue({
        name: template.name,
        description: template.description,
        duration: template.duration,
        totalWeeks: template.totalWeeks,
        weeklyReductionRate: template.weeklyReductionRate * 100, // Convert to percentage
        color: template.color,
        difficulty: template.difficulty,
        targetUsers: template.targetUsers,
        steps: template.steps,
        isPublished: template.isPublished
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        steps: [{ day: 1, title: '', content: '' }],
        isPublished: false,
        difficulty: 'medium',
        targetUsers: ['beginners'],
        totalWeeks: 4,
        weeklyReductionRate: 20,
        color: '#28a745'
      });
    }
    setIsModalVisible(true);
  };

  const showViewModal = (template) => {
    setViewingTemplate(template);
    setIsViewModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleViewCancel = () => {
    setIsViewModalVisible(false);
  };

  const handleSubmit = (values) => {
    // Convert weeklyReductionRate from percentage to decimal
    const processedValues = {
      ...values,
      weeklyReductionRate: values.weeklyReductionRate / 100
    };

    if (editingTemplate) {
      // Cập nhật kế hoạch hiện có
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...processedValues, usageCount: t.usageCount }
          : t
      ));
      message.success('Kế hoạch mẫu đã được cập nhật thành công!');
    } else {
      // Tạo kế hoạch mới
      const newTemplate = {
        id: Date.now(),
        ...processedValues,
        usageCount: 0
      };
      setTemplates([...templates, newTemplate]);
      message.success('Kế hoạch mẫu đã được tạo thành công!');
    }
    
    setIsModalVisible(false);
  };

  const handleDelete = (id) => {
    setTemplates(templates.filter(t => t.id !== id));
    message.success('Kế hoạch mẫu đã được xóa thành công!');
  };

  const handleDuplicate = (template) => {
    const newTemplate = {
      ...template,
      id: Date.now(),
      name: `${template.name} (Bản sao)`,
      isPublished: false,
      usageCount: 0
    };
    setTemplates([...templates, newTemplate]);
    message.success('Kế hoạch mẫu đã được sao chép thành công!');
  };

  const handleToggleStatus = (id, currentStatus) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, isPublished: !currentStatus } : t
    ));
    message.success(`Kế hoạch mẫu đã được ${currentStatus ? 'ẩn' : 'xuất bản'}!`);
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'green';
      case 'medium': return 'blue';
      case 'hard': return 'red';
      default: return 'default';
    }
  };

  const getDifficultyText = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'Dễ';
      case 'medium': return 'Trung bình';
      case 'hard': return 'Khó';
      default: return 'Không xác định';
    }
  };

  const getUserTypeText = (type) => {
    switch(type) {
      case 'beginners': return 'Người mới bắt đầu';
      case 'moderate-smokers': return 'Người hút vừa phải';
      case 'heavy-smokers': return 'Người hút nhiều';
      case 'light-smokers': return 'Người hút ít';
      case 'experienced': return 'Đã từng cai thuốc';
      default: return type;
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: 'Tên kế hoạch',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => showViewModal(record)}>{text}</a>
      )
    },
    {
      title: 'Thời gian',
      dataIndex: 'duration',
      key: 'duration',
      render: (days, record) => (
        <div>
          <div>{days} ngày</div>
          <Text type="secondary">({record.totalWeeks} tuần)</Text>
        </div>
      ),
      sorter: (a, b) => a.duration - b.duration,
    },
    {
      title: 'Tỷ lệ giảm',
      dataIndex: 'weeklyReductionRate',
      key: 'weeklyReductionRate',
      render: rate => `${(rate * 100)}%/tuần`,
      sorter: (a, b) => a.weeklyReductionRate - b.weeklyReductionRate,
    },
    {
      title: 'Độ khó',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: difficulty => (
        <Tag color={getDifficultyColor(difficulty)}>
          {getDifficultyText(difficulty)}
        </Tag>
      ),
      filters: [
        { text: 'Dễ', value: 'easy' },
        { text: 'Trung bình', value: 'medium' },
        { text: 'Khó', value: 'hard' }
      ],
      onFilter: (value, record) => record.difficulty === value,
    },
    {
      title: 'Đối tượng',
      dataIndex: 'targetUsers',
      key: 'targetUsers',
      render: users => (
        <>
          {users.slice(0, 2).map(user => (
            <Tag key={user}>{getUserTypeText(user)}</Tag>
          ))}
          {users.length > 2 && <Tag>+{users.length - 2}</Tag>}
        </>
      )
    },
    {
      title: 'Số người dùng',
      dataIndex: 'usageCount',
      key: 'usageCount',
      sorter: (a, b) => a.usageCount - b.usageCount,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isPublished',
      key: 'isPublished',
      render: isPublished => (
        <Tag color={isPublished ? 'green' : 'orange'}>
          {isPublished ? 'Đã xuất bản' : 'Chưa xuất bản'}
        </Tag>
      ),
      filters: [
        { text: 'Đã xuất bản', value: true },
        { text: 'Chưa xuất bản', value: false }
      ],
      onFilter: (value, record) => record.isPublished === value,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button 
              icon={<EyeOutlined />}
              onClick={() => showViewModal(record)}
            />
          </Tooltip>
          <Tooltip title="Sao chép">
            <Button 
              icon={<CopyOutlined />}
              onClick={() => handleDuplicate(record)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => showModal(record)} 
            />
          </Tooltip>
          <Tooltip title={record.isPublished ? 'Ẩn kế hoạch' : 'Xuất bản'}>
            <Button
              type={record.isPublished ? 'default' : 'primary'}
              onClick={() => handleToggleStatus(record.id, record.isPublished)}
            >
              {record.isPublished ? 'Ẩn' : 'Xuất bản'}
            </Button>
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa kế hoạch này?"
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

  return (
    <div className="admin-quit-plans-container">
      <Card>
        <div className="header-with-button">
          <Title level={3}>Quản lý kế hoạch cai thuốc mẫu</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            Tạo kế hoạch mẫu mới
          </Button>
        </div>
        <Paragraph>
          Quản lý các kế hoạch cai thuốc mẫu mà người dùng có thể áp dụng.
        </Paragraph>

        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal xem chi tiết kế hoạch */}
      <Modal
        title="Chi tiết kế hoạch cai thuốc mẫu"
        visible={isViewModalVisible}
        onCancel={handleViewCancel}
        footer={[
          <Button key="edit" type="primary" onClick={() => {
            handleViewCancel();
            showModal(viewingTemplate);
          }}>
            Chỉnh sửa
          </Button>,
          <Button key="close" onClick={handleViewCancel}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {viewingTemplate && (
          <div className="template-detail">
            <Title level={4}>{viewingTemplate.name}</Title>
            <Paragraph>{viewingTemplate.description}</Paragraph>
            
            <div className="template-meta">
              <Space size="large" direction="vertical">
                <Space size="large">
                  <div><strong>Thời gian:</strong> {viewingTemplate.duration} ngày ({viewingTemplate.totalWeeks} tuần)</div>
                  <div>
                    <strong>Độ khó:</strong> 
                    <Tag color={getDifficultyColor(viewingTemplate.difficulty)} style={{ marginLeft: 8 }}>
                      {getDifficultyText(viewingTemplate.difficulty)}
                    </Tag>
                  </div>
                  <div><strong>Tỷ lệ giảm:</strong> {(viewingTemplate.weeklyReductionRate * 100)}% mỗi tuần</div>
                </Space>
                <Space size="large">
                  <div>
                    <strong>Màu kế hoạch:</strong> 
                    <Tag color={viewingTemplate.color} style={{ marginLeft: 8, color: 'white', backgroundColor: viewingTemplate.color }}>
                      {viewingTemplate.color}
                    </Tag>
                  </div>
                  <div>
                    <strong>Đối tượng:</strong> 
                    {viewingTemplate.targetUsers.map(user => (
                      <Tag key={user} style={{ marginLeft: 8 }}>{getUserTypeText(user)}</Tag>
                    ))}
                  </div>
                </Space>
              </Space>
            </div>
            
            <Divider orientation="left">Các bước thực hiện</Divider>
            
            <List
              itemLayout="horizontal"
              dataSource={viewingTemplate.steps}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={`Ngày ${item.day}: ${item.title}`}
                    description={item.content}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>

      {/* Modal thêm/sửa kế hoạch mẫu */}
      <Modal
        title={editingTemplate ? "Chỉnh sửa kế hoạch mẫu" : "Tạo kế hoạch mẫu mới"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Tên kế hoạch"
            rules={[{ required: true, message: 'Vui lòng nhập tên kế hoạch!' }]}
          >
            <Input placeholder="Ví dụ: Kế hoạch cai thuốc tiêu chuẩn" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả kế hoạch!' }]}
          >
            <TextArea rows={3} placeholder="Mô tả ngắn gọn về kế hoạch này" />
          </Form.Item>

          <Form.Item
            name="duration"
            label="Thời gian (ngày)"
            rules={[{ required: true, message: 'Vui lòng nhập thời gian!' }]}
          >
            <InputNumber min={1} max={365} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="totalWeeks"
            label="Số tuần"
            rules={[{ required: true, message: 'Vui lòng nhập số tuần!' }]}
          >
            <InputNumber min={1} max={52} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="weeklyReductionRate"
            label="Tỷ lệ giảm mỗi tuần (%)"
            rules={[{ required: true, message: 'Vui lòng nhập tỷ lệ giảm!' }]}
          >
            <InputNumber min={5} max={50} style={{ width: '100%' }} formatter={value => `${value}%`} parser={value => value.replace('%', '')} />
          </Form.Item>

          <Form.Item
            name="color"
            label="Màu sắc kế hoạch"
            rules={[{ required: true, message: 'Vui lòng nhập mã màu!' }]}
          >
            <Input placeholder="#fd7e14" />
          </Form.Item>

          <Form.Item
            name="difficulty"
            label="Độ khó"
            rules={[{ required: true, message: 'Vui lòng chọn độ khó!' }]}
          >
            <Select placeholder="Chọn độ khó">
              <Option value="easy">Dễ</Option>
              <Option value="medium">Trung bình</Option>
              <Option value="hard">Khó</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="targetUsers"
            label="Đối tượng phù hợp"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một đối tượng!' }]}
          >
            <Select mode="multiple" placeholder="Chọn đối tượng phù hợp">
              <Option value="beginners">Người mới bắt đầu</Option>
              <Option value="light-smokers">Người hút ít (&lt; 10 điếu/ngày)</Option>
              <Option value="moderate-smokers">Người hút vừa phải (10-20 điếu/ngày)</Option>
              <Option value="heavy-smokers">Người hút nhiều (&gt; 20 điếu/ngày)</Option>
              <Option value="experienced">Đã từng cai thuốc</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left">Các bước thực hiện</Divider>

          <Form.List
            name="steps"
            rules={[
              {
                validator: async (_, steps) => {
                  if (!steps || steps.length === 0) {
                    return Promise.reject(new Error('Vui lòng thêm ít nhất một bước!'));
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="step-form-item">
                    <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'day']}
                        label="Ngày"
                        rules={[{ required: true, message: 'Thiếu thông tin ngày!' }]}
                      >
                        <InputNumber min={1} max={365} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'title']}
                        label="Tiêu đề"
                        rules={[{ required: true, message: 'Thiếu tiêu đề!' }]}
                        style={{ width: '250px' }}
                      >
                        <Input placeholder="Tiêu đề của bước này" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'content']}
                        label="Nội dung"
                        rules={[{ required: true, message: 'Thiếu nội dung!' }]}
                        style={{ width: '350px' }}
                      >
                        <Input placeholder="Mô tả chi tiết bước này" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  </div>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm bước
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item
            name="isPublished"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Select>
              <Option value={false}>Chưa xuất bản</Option>
              <Option value={true}>Xuất bản</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingTemplate ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
