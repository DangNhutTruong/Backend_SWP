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
  Tooltip,
  Popconfirm,
  notification,
  Row,
  Col,
  Statistic,
  Image,
  message
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { TextArea } = Input;

const AdminBlog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchPosts();
  }, []); // Chỉ load 1 lần khi component mount

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      console.log('🔍 Fetching blog posts...');
      
      const response = await axios.get('/api/admin/blog/posts', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Response received:', response.data);

      if (response.data.success) {
        const posts = response.data.data.posts || [];
        setPosts(posts);
        setPagination({
          current: 1,
          pageSize: 10,
          total: posts.length
        });
        console.log(`📊 Loaded ${posts.length} blog posts`);
      }
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      notification.error({
        message: 'Lỗi',
        description: `Không thể tải danh sách bài viết: ${error.response?.status || 'Network error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    setEditingPost(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    form.setFieldsValue({
      title: post.title,
      content: post.content,
      thumbnail_url: post.thumbnail_url
    });
    setIsModalVisible(true);
  };

  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      await axios.delete(`/api/admin/blog/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      notification.success({
        message: 'Thành công',
        description: 'Đã xóa bài viết'
      });
      
      fetchPosts();
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: 'Không thể xóa bài viết'
      });
    }
  };

  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      
      if (editingPost) {
        await axios.put(`/api/admin/blog/posts/${editingPost.id}`, values, {
          headers: { Authorization: `Bearer ${token}` }
        });
        notification.success({
          message: 'Thành công',
          description: 'Đã cập nhật bài viết'
        });
      } else {
        await axios.post('/api/admin/blog/posts', values, {
          headers: { Authorization: `Bearer ${token}` }
        });
        notification.success({
          message: 'Thành công',
          description: 'Đã tạo bài viết mới'
        });
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchPosts();
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: editingPost ? 'Không thể cập nhật bài viết' : 'Không thể tạo bài viết'
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một bài viết');
      return;
    }

    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      
      for (const postId of selectedRowKeys) {
        await axios.delete(`/api/admin/blog/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      notification.success({
        message: 'Thành công',
        description: `Đã xóa ${selectedRowKeys.length} bài viết`
      });

      setSelectedRowKeys([]);
      fetchPosts();
    } catch (error) {
      notification.error({
        message: 'Lỗi',
        description: 'Không thể xóa bài viết'
      });
    }
  };

  const handleTableChange = (newPagination) => {
    setFilters({
      ...filters,
      page: newPagination.current,
      limit: newPagination.pageSize
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: 'Ảnh đại diện',
      dataIndex: 'thumbnail_url',
      key: 'thumbnail_url',
      width: 100,
      render: (url) => (
        <Image
          width={60}
          height={40}
          src={url || 'https://via.placeholder.com/60x40'}
          fallback="https://via.placeholder.com/60x40"
          style={{ objectFit: 'cover', borderRadius: 4 }}
        />
      )
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text strong>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Tác giả (Smoker ID)',
      dataIndex: 'smoker_id',
      key: 'smoker_id',
      width: 120,
      render: (smokerId) => (
        <Text type="secondary">#{smokerId}</Text>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => new Date(date).toLocaleString('vi-VN')
    },
    {
      title: 'Ngày cập nhật',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      render: (date) => new Date(date).toLocaleString('vi-VN')
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div className="admin-blog">
      <div className="admin-blog-header" style={{ marginBottom: 24 }}>
        <Title level={2}>
          <FileTextOutlined /> Quản lý bài viết
        </Title>
        
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng bài viết"
              value={posts.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Bài viết đã chọn"
              value={selectedRowKeys.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng trang"
              value={Math.ceil(pagination.total / pagination.pageSize)}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input.Search
              placeholder="Tìm kiếm bài viết..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              onSearch={fetchPosts}
            />
          </Col>
          <Col span={16}>
            <Space>
              <Button disabled>
                Tạo bài viết (Coming soon)
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={posts}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showQuickJumper: false,
            showTotal: (total) => `Tổng ${total} bài viết`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default AdminBlog;
