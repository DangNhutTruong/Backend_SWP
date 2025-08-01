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
  DatePicker
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  DollarOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AreaChartOutlined
} from '@ant-design/icons';
import './AdminMemberships.css';

const { Title, Text, Paragraph } = Typography;
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
  
  useEffect(() => {
    // Mô phỏng API call để lấy dữ liệu gói thành viên
    fetchPackages();
    fetchPayments();
  }, []);

  const fetchPackages = () => {
    // API call giả lập để lấy danh sách gói
    setTimeout(() => {
      const mockPackages = [
        {
          id: 1,
          name: 'Free',
          price: 0,
          duration: 0, // Vĩnh viễn
          benefits: ['Truy cập cơ bản', 'Kế hoạch cai thuốc cơ bản', 'Theo dõi tiến trình'],
          active: true
        },
        {
          id: 2,
          name: 'Basic',
          price: 99000,
          duration: 30, // 30 ngày
          benefits: ['Tất cả tính năng Free', 'Hỗ trợ cộng đồng', 'Công cụ nâng cao', 'Bài viết premium'],
          active: true
        },
        {
          id: 3,
          name: 'Premium',
          price: 299000,
          duration: 90, // 90 ngày
          benefits: ['Tất cả tính năng Basic', 'Huấn luyện viên 1:1', 'Huy hiệu đặc biệt', 'Hỗ trợ 24/7'],
          active: true
        }
      ];
      setPackages(mockPackages);
      setLoading(false);
    }, 1000);
  };

  const fetchPayments = () => {
    // API call giả lập để lấy danh sách thanh toán
    setTimeout(() => {
      const mockPayments = [
        {
          id: 'PAY001',
          userId: 1,
          userName: 'Nguyễn Văn A',
          packageName: 'Premium',
          amount: 299000,
          date: '2023-07-15',
          status: 'completed'
        },
        {
          id: 'PAY002',
          userId: 2,
          userName: 'Trần Thị B',
          packageName: 'Basic',
          amount: 99000,
          date: '2023-07-20',
          status: 'completed'
        },
        {
          id: 'PAY003',
          userId: 3,
          userName: 'Lê Văn C',
          packageName: 'Premium',
          amount: 299000,
          date: '2023-07-25',
          status: 'pending'
        }
      ];
      setPayments(mockPayments);
    }, 1500);
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

  const paymentColumns = [
    {
      title: 'Mã thanh toán',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Người dùng',
      dataIndex: 'userName',
      key: 'userName'
    },
    {
      title: 'Gói dịch vụ',
      dataIndex: 'packageName',
      key: 'packageName',
      render: (text) => {
        let color = 'default';
        if (text === 'Premium') color = 'gold';
        else if (text === 'Basic') color = 'blue';
        else if (text === 'Free') color = 'green';
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `${amount.toLocaleString('vi-VN')} ₫`
    },
    {
      title: 'Ngày thanh toán',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
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
        }
        
        return <Tag color={color}>{text}</Tag>;
      }
    }
  ];

  // Thống kê doanh thu
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const completedPayments = payments.filter(p => p.status === 'completed').length;

  const activeUsers = {
    premium: 25,
    basic: 58,
    free: 217
  };

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
            <Title level={3}>Quản lý thanh toán</Title>

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
                    title="Người dùng Premium"
                    value={activeUsers.premium}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<CrownOutlined />}
                    suffix={`/${activeUsers.premium + activeUsers.basic + activeUsers.free} người dùng`}
                  />
                </Card>
              </Col>
            </Row>

            <div className="filter-container">
              <RangePicker style={{ marginRight: 16 }} />
              <Select defaultValue="all" style={{ width: 200 }}>
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="completed">Hoàn thành</Option>
                <Option value="pending">Đang xử lý</Option>
                <Option value="failed">Thất bại</Option>
              </Select>
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
