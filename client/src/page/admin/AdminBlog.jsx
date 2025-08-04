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

  // Gọi lại API khi filters thay đổi
  useEffect(() => {
    if (filters.page !== 1 || filters.search !== '') {
      fetchPosts();
    }
  }, [filters.page, filters.limit]);

  useEffect(() => {
    fetchPosts();
  }, [filters.page, filters.limit]); // Reload khi thay đổi page hoặc limit

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      console.log('🔍 Fetching blog posts...');
      
      // Tạo query parameters
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && { search: filters.search })
      });
      
      const response = await axios.get(`/api/admin/blog/posts?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Response received:', response.data);

      if (response.data.success) {
        const postsData = response.data.data.posts || [];
        const paginationData = response.data.data.pagination || {};
        
        setPosts(postsData);
        setPagination({
          current: paginationData.current || 1,
          pageSize: paginationData.pageSize || 10,
          total: paginationData.total || postsData.length
        });
        console.log(`📊 Loaded ${postsData.length} blog posts`);
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
      
      // Sử dụng bulk delete API thay vì xóa từng bài viết
      await axios.delete('/api/admin/blog/posts', {
        headers: { Authorization: `Bearer ${token}` },
        data: { ids: selectedRowKeys }
      });

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
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="primary" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEditPost(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa bài viết này?"
              description="Bạn có chắc muốn xóa bài viết này không?"
              onConfirm={() => handleDeletePost(record.id)}
              placement="left"
            >
              <Button 
                danger 
                size="small" 
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
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
          <Col span={16} style={{ textAlign: 'right' }}>
            <Space>
              <Popconfirm
                title="Xóa các bài viết đã chọn?"
                description={`Bạn có chắc muốn xóa ${selectedRowKeys.length} bài viết đã chọn?`}
                onConfirm={handleBulkDelete}
                disabled={selectedRowKeys.length === 0}
              >
                <Button 
                  danger 
                  disabled={selectedRowKeys.length === 0}
                  icon={<DeleteOutlined />}
                >
                  Xóa đã chọn ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreatePost}
              >
                Tạo bài viết mới
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
          rowSelection={rowSelection}
          onChange={handleTableChange}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng ${total} bài viết`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Modal form để tạo/chỉnh sửa bài viết */}
      <Modal
        title={editingPost ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingPost(null);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          preserve={false}
        >
          <Form.Item
            name="title"
            label="Tiêu đề bài viết"
            rules={[
              { required: true, message: 'Vui lòng nhập tiêu đề bài viết' },
              { min: 5, message: 'Tiêu đề phải có ít nhất 5 ký tự' }
            ]}
          >
            <Input placeholder="Nhập tiêu đề bài viết..." />
          </Form.Item>

          <Form.Item
            name="thumbnail_url"
            label="URL ảnh đại diện"
            rules={[
              { type: 'url', message: 'Vui lòng nhập URL hợp lệ' }
            ]}
          >
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung bài viết"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung bài viết' },
              { min: 10, message: 'Nội dung phải có ít nhất 10 ký tự' }
            ]}
          >
            <TextArea 
              rows={8} 
              placeholder="Nhập nội dung bài viết..."
              showCount
              maxLength={5000}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
                setEditingPost(null);
              }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPost ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminBlog;
