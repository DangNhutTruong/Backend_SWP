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
      const mockTemplates = [
        {
          id: 1,
          name: 'Kế hoạch cai thuốc tiêu chuẩn',
          description: 'Kế hoạch cai thuốc từng bước dành cho người mới bắt đầu',
          duration: 30, // 30 ngày
          difficulty: 'medium', // Trung bình
          steps: [
            { day: 1, title: 'Chuẩn bị tâm lý', content: 'Xác định lý do cai thuốc và viết ra' },
            { day: 2, title: 'Thông báo với mọi người', content: 'Cho bạn bè và gia đình biết về quyết định của bạn' },
            { day: 3, title: 'Chuẩn bị thay thế', content: 'Chuẩn bị kẹo cao su, snack lành mạnh' },
            // ...các bước khác
          ],
          targetUsers: ['beginners', 'moderate-smokers'],
          isPublished: true,
          usageCount: 245
        },
        {
          id: 2,
          name: 'Cai thuốc cấp tốc',
          description: 'Kế hoạch cai thuốc nhanh trong 7 ngày',
          duration: 7, // 7 ngày
          difficulty: 'hard', // Khó
          steps: [
            { day: 1, title: 'Quyết định dừng hẳn', content: 'Vứt bỏ tất cả thuốc lá và bật lửa' },
            { day: 2, title: 'Đối mặt với cơn thèm', content: 'Tập trung vào việc khác khi có cơn thèm thuốc' },
            // ...các bước khác
          ],
          targetUsers: ['experienced', 'heavy-smokers'],
          isPublished: true,
          usageCount: 87
        },
        {
          id: 3,
          name: 'Cai thuốc từ từ',
          description: 'Kế hoạch giảm dần số lượng thuốc lá trong 60 ngày',
          duration: 60, // 60 ngày
          difficulty: 'easy', // Dễ
          steps: [
            { day: 1, title: 'Theo dõi thói quen', content: 'Ghi chép lại số điếu thuốc hút mỗi ngày' },
            { day: 7, title: 'Giảm 20%', content: 'Giảm số điếu thuốc đi 20% so với mức trung bình' },
            // ...các bước khác
          ],
          targetUsers: ['beginners', 'light-smokers'],
          isPublished: false,
          usageCount: 0
        },
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
        targetUsers: ['beginners']
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
    if (editingTemplate) {
      // Cập nhật kế hoạch hiện có
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...values, usageCount: t.usageCount }
          : t
      ));
      message.success('Kế hoạch mẫu đã được cập nhật thành công!');
    } else {
      // Tạo kế hoạch mới
      const newTemplate = {
        id: Date.now(),
        ...values,
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
      render: days => `${days} ngày`,
      sorter: (a, b) => a.duration - b.duration,
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
              <Space size="large">
                <div><strong>Thời gian:</strong> {viewingTemplate.duration} ngày</div>
                <div>
                  <strong>Độ khó:</strong> 
                  <Tag color={getDifficultyColor(viewingTemplate.difficulty)} style={{ marginLeft: 8 }}>
                    {getDifficultyText(viewingTemplate.difficulty)}
                  </Tag>
                </div>
                <div>
                  <strong>Đối tượng:</strong> 
                  {viewingTemplate.targetUsers.map(user => (
                    <Tag key={user} style={{ marginLeft: 8 }}>{getUserTypeText(user)}</Tag>
                  ))}
                </div>
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
