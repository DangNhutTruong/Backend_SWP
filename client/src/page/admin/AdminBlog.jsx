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
  Tabs
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  EyeOutlined,
  UploadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import './AdminBlog.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

export default function AdminBlog() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [editingArticle, setEditingArticle] = useState(null);
  
  useEffect(() => {
    // Mô phỏng API call để lấy dữ liệu bài viết và danh mục
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchArticles = () => {
    setTimeout(() => {
      const mockArticles = [
        {
          id: 1,
          title: 'Tác hại của thuốc lá với sức khỏe',
          category: 'health',
          author: 'Dr. Nguyễn Văn A',
          publishDate: '2023-06-15',
          status: 'published',
          views: 1256,
          featured: true,
        },
        {
          id: 2,
          title: '5 bước đầu tiên để cai thuốc lá thành công',
          category: 'tips',
          author: 'Lê Thị B',
          publishDate: '2023-07-02',
          status: 'published',
          views: 893,
          featured: false,
        },
        {
          id: 3,
          title: 'Lợi ích của việc cai thuốc lá sau 1 tháng',
          category: 'motivation',
          author: 'Dr. Trần Văn C',
          publishDate: '2023-07-20',
          status: 'draft',
          views: 0,
          featured: false,
        },
      ];
      setArticles(mockArticles);
      setLoading(false);
    }, 1000);
  };

  const fetchCategories = () => {
    setTimeout(() => {
      const mockCategories = [
        {
          id: 1,
          name: 'Sức khỏe',
          slug: 'health',
          count: 12
        },
        {
          id: 2,
          name: 'Mẹo cai thuốc',
          slug: 'tips',
          count: 8
        },
        {
          id: 3,
          name: 'Động lực',
          slug: 'motivation',
          count: 5
        },
      ];
      setCategories(mockCategories);
    }, 800);
  };

  const showModal = (article = null) => {
    setEditingArticle(article);
    if (article) {
      form.setFieldsValue({
        title: article.title,
        category: article.category,
        content: 'Nội dung bài viết sẽ hiển thị ở đây...',
        featured: article.featured,
        status: article.status
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const showCategoryModal = () => {
    categoryForm.resetFields();
    setIsCategoryModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleCategoryCancel = () => {
    setIsCategoryModalVisible(false);
  };

  const handleSubmit = (values) => {
    if (editingArticle) {
      // Cập nhật bài viết hiện có
      setArticles(articles.map(a => 
        a.id === editingArticle.id 
          ? { 
              ...a, 
              ...values, 
              publishDate: values.status === 'published' 
                ? new Date().toISOString().split('T')[0]
                : a.publishDate
            }
          : a
      ));
    } else {
      // Tạo bài viết mới
      const newArticle = {
        id: Date.now(),
        ...values,
        author: 'Admin',
        publishDate: values.status === 'published' 
          ? new Date().toISOString().split('T')[0] 
          : null,
        views: 0
      };
      setArticles([...articles, newArticle]);
    }
    
    setIsModalVisible(false);
    message.success(`Bài viết đã được ${editingArticle ? 'cập nhật' : 'tạo'} thành công!`);
  };

  const handleCategorySubmit = (values) => {
    const newCategory = {
      id: Date.now(),
      name: values.name,
      slug: values.slug || values.name.toLowerCase().replace(/\s+/g, '-'),
      count: 0
    };
    
    setCategories([...categories, newCategory]);
    setIsCategoryModalVisible(false);
    message.success('Danh mục đã được tạo thành công!');
  };

  const handleDelete = (id) => {
    setArticles(articles.filter(a => a.id !== id));
    message.success('Bài viết đã được xóa thành công!');
  };

  const handleCategoryDelete = (id) => {
    setCategories(categories.filter(c => c.id !== id));
    message.success('Danh mục đã được xóa thành công!');
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchText.toLowerCase()) ||
      article.author.toLowerCase().includes(searchText.toLowerCase())
  );

  const articleColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          {text}
          {record.featured && <Tag color="gold">Nổi bật</Tag>}
        </Space>
      )
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: category => {
        const foundCategory = categories.find(c => c.slug === category);
        return foundCategory ? foundCategory.name : category;
      },
      filters: categories.map(c => ({ text: c.name, value: c.slug })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      key: 'author'
    },
    {
      title: 'Ngày xuất bản',
      dataIndex: 'publishDate',
      key: 'publishDate',
      render: date => date ? new Date(date).toLocaleDateString('vi-VN') : 'Chưa xuất bản',
      sorter: (a, b) => {
        if (!a.publishDate) return 1;
        if (!b.publishDate) return -1;
        return new Date(a.publishDate) - new Date(b.publishDate);
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        let color = 'default';
        let text = 'Không xác định';
        
        if (status === 'published') {
          color = 'green';
          text = 'Đã xuất bản';
        } else if (status === 'draft') {
          color = 'gold';
          text = 'Bản nháp';
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: 'Đã xuất bản', value: 'published' },
        { text: 'Bản nháp', value: 'draft' }
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Lượt xem',
      dataIndex: 'views',
      key: 'views',
      sorter: (a, b) => a.views - b.views,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Xem">
            <Button 
              icon={<EyeOutlined />}
              onClick={() => message.info('Chức năng xem chi tiết đang phát triển')}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => showModal(record)} 
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa bài viết này?"
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

  const categoryColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Đường dẫn',
      dataIndex: 'slug',
      key: 'slug'
    },
    {
      title: 'Số bài viết',
      dataIndex: 'count',
      key: 'count'
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Xem bài viết">
            <Button 
              icon={<EyeOutlined />}
              onClick={() => handleSearch(record.slug)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa danh mục này?"
            onConfirm={() => handleCategoryDelete(record.id)}
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
    <div className="admin-blog-container">
      <Tabs defaultActiveKey="1">
        <TabPane tab="Bài viết" key="1">
          <Card>
            <div className="header-with-button">
              <Title level={3}>Quản lý bài viết</Title>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => showModal()}
              >
                Thêm bài viết
              </Button>
            </div>
            <Paragraph>
              Quản lý tất cả bài viết blog trên hệ thống NoSmoke.
            </Paragraph>

            <div className="search-container">
              <Input
                placeholder="Tìm kiếm bài viết theo tiêu đề hoặc tác giả"
                prefix={<SearchOutlined />}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 400, marginBottom: 16 }}
              />
            </div>

            <Table
              columns={articleColumns}
              dataSource={filteredArticles}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Danh mục" key="2">
          <Card>
            <div className="header-with-button">
              <Title level={3}>Quản lý danh mục</Title>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={showCategoryModal}
              >
                Thêm danh mục
              </Button>
            </div>
            <Paragraph>
              Quản lý danh mục bài viết trên hệ thống NoSmoke.
            </Paragraph>

            <Table
              columns={categoryColumns}
              dataSource={categories}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Modal thêm/sửa bài viết */}
      <Modal
        title={editingArticle ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'draft', featured: false }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề bài viết"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề bài viết!' }]}
          >
            <Input placeholder="Nhập tiêu đề bài viết" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
          >
            <Select placeholder="Chọn danh mục">
              {categories.map(category => (
                <Option key={category.slug} value={category.slug}>{category.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung bài viết"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung bài viết!' }]}
          >
            <TextArea rows={12} placeholder="Nhập nội dung bài viết ở đây..." />
          </Form.Item>

          <Form.Item 
            name="thumbnail" 
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

          <Form.Item name="featured" valuePropName="checked" label="Bài viết nổi bật">
            <Select>
              <Option value={false}>Không</Option>
              <Option value={true}>Có</Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" label="Trạng thái">
            <Select>
              <Option value="draft">Bản nháp</Option>
              <Option value="published">Xuất bản</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingArticle ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal thêm danh mục */}
      <Modal
        title="Thêm danh mục mới"
        visible={isCategoryModalVisible}
        onCancel={handleCategoryCancel}
        footer={null}
      >
        <Form
          form={categoryForm}
          layout="vertical"
          onFinish={handleCategorySubmit}
        >
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input placeholder="Ví dụ: Sức khỏe, Mẹo cai thuốc" />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Đường dẫn"
            tooltip="Sử dụng chữ thường, dấu gạch ngang, không dấu. Để trống để tạo tự động từ tên."
          >
            <Input placeholder="Ví dụ: suc-khoe, meo-cai-thuoc" />
          </Form.Item>

          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleCategoryCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                Tạo danh mục
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
