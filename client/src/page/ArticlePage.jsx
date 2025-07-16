import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaCalendarAlt, FaEye, FaHeart, FaComment, FaArrowLeft, FaTags } from 'react-icons/fa';
import './Blog.css';

export default function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Simulate fetching article data
    setTimeout(() => {
      // Find the article based on the slug
      const foundArticle = getArticleBySlug(slug);
      setArticle(foundArticle);
      
      // Get related articles
      if (foundArticle) {
        const related = getRelatedArticles(foundArticle.category, foundArticle.id);
        setRelatedArticles(related);
      }
      
      setLoading(false);
    }, 500);
  }, [slug]);

  if (loading) {
    return (
      <div className="article-page">
        <div className="container">
          <div className="loading-spinner">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="article-page">
        <div className="container">
          <div className="article-not-found">
            <h2>Không tìm thấy bài viết</h2>
            <p>Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <Link to="/blog" className="back-to-blog">
              <FaArrowLeft /> Quay lại trang Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="article-page">
      <div className="container">
        <div className="article-container">
          <div className="article-header">
            <img 
              src={article.image} 
              alt={article.title} 
              className="article-header-image" 
            />
            <div className="article-category">{getCategoryName(article.category)}</div>
          </div>
          
          <div className="article-content">
            <h1 className="article-title">{article.title}</h1>
            
            <div className="article-meta">
              <div className="article-author">
                <img 
                  src="/image/hero/quit-smoking-2.png" 
                  alt={article.author} 
                  className="article-author-avatar" 
                />
                <div className="article-author-info">
                  <h4>{article.author}</h4>
                  <div className="article-date">
                    <FaCalendarAlt /> {article.date}
                  </div>
                </div>
              </div>
              
              <div className="article-stats">
                <div className="article-stat">
                  <FaEye /> {article.views} lượt xem
                </div>
                <div className="article-stat">
                  <FaHeart /> {article.likes} lượt thích
                </div>
                <div className="article-stat">
                  <FaComment /> {article.comments} bình luận
                </div>
              </div>
            </div>
            
            <div className="article-body">
              {renderArticleContent(article.slug)}
            </div>
            
            <div className="article-footer">
              <div className="article-tags">
                <FaTags /> 
                {article.tags && article.tags.map((tag, index) => (
                  <span key={index} className="article-tag">{tag}</span>
                ))}
              </div>
              
              <Link to="/blog" className="back-to-blog">
                <FaArrowLeft /> Quay lại trang Blog
              </Link>
            </div>
          </div>
        </div>
        
        {relatedArticles.length > 0 && (
          <div className="related-articles">
            <h3 className="related-title">Bài viết liên quan</h3>
            <div className="related-articles-grid">
              {relatedArticles.map(relatedArticle => (
                <RelatedArticleCard key={relatedArticle.id} article={relatedArticle} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component for related article cards
const RelatedArticleCard = ({ article }) => {
  return (
    <Link to={article.url} className="related-article-card">
      <div className="related-article-image">
        <img src={article.image} alt={article.title} />
      </div>
      <div className="related-article-content">
        <h4>{article.title}</h4>
        <div className="related-article-meta">
          <span><FaCalendarAlt /> {article.date}</span>
          <span><FaEye /> {article.views}</span>
        </div>
      </div>
    </Link>
  );
};

// Helper function to get category name
function getCategoryName(category) {
  const categories = {
    health: "Sức khỏe",
    tips: "Mẹo hay",
    experience: "Kinh nghiệm",
    success: "Câu chuyện thành công",
    support: "Hỗ trợ cai thuốc",
  };
  return categories[category] || "Chung";
}

// Helper function to get article by slug
function getArticleBySlug(slug) {
  const articles = getAllArticles();
  return articles.find(article => article.slug === slug);
}

// Helper function to get related articles
function getRelatedArticles(category, currentId, limit = 3) {
  const articles = getAllArticles();
  return articles
    .filter(article => article.category === category && article.id !== currentId)
    .slice(0, limit);
}

// Helper function to get all articles
function getAllArticles() {
  return [
    {
      id: 1,
      slug: "7-ngay-dau",
      image: "/image/articles/OIP.jpg",
      title: "7 ngày đầu không thuốc lá – Làm thế nào để vượt qua?",
      excerpt:
        "Tuần đầu tiên luôn là giai đoạn khó khăn nhất. Hãy tìm hiểu những phương pháp hiệu quả để vượt qua cơn thèm thuốc và duy trì quyết tâm cai thuốc lá của bạn.",
      author: "BS. Nguyễn Minh",
      date: "22 tháng 5, 2023",
      views: "10.304",
      likes: "826",
      comments: "58",
      category: "experience",
      url: "/blog/7-ngay-dau",
      tags: ["Cai thuốc lá", "Giai đoạn đầu", "Khó khăn", "Quyết tâm"]
    },
    {
      id: 2,
      slug: "chia-se-1-nam",
      image: "/image/articles/r.jpg",
      title: "Chia sẻ từ một người đã bỏ thuốc 1 năm",
      excerpt:
        "Câu chuyện cảm động về hành trình 365 ngày không thuốc lá và những thay đổi tích cực trong cuộc sống, sức khỏe và mối quan hệ của một người đã thành công.",
      author: "Lê Thu Thảo",
      date: "3 tháng 4, 2023",
      views: "8.214",
      likes: "650",
      comments: "47",
      category: "success",
      url: "/blog/chia-se-1-nam",
      tags: ["Thành công", "1 năm", "Chia sẻ", "Kinh nghiệm"]
    },
    {
      id: 3,
      slug: "thoi-quen-thay-the",
      image: "/image/hero/quit-smoking-2.png",
      title: "Thói quen thay thế giúp bạn không tái nghiện",
      excerpt:
        "Khám phá 10 thói quen lành mạnh có thể thay thế việc hút thuốc và giúp bạn duy trì lối sống không khói thuốc trong thời gian dài.",
      author: "Trần An Nhiên",
      date: "20 tháng 3, 2023",
      views: "9.827",
      likes: "712",
      comments: "39",
      category: "tips",
      url: "/blog/thoi-quen-thay-the",
      tags: ["Thói quen", "Thay thế", "Lành mạnh", "Không tái nghiện"]
    },
    {
      id: 4,
      slug: "tac-hai-thuoc-la-dien-tu",
      image: "/image/articles/th.jpg",
      title: "Tác hại của thuốc lá điện tử - Sự thật bạn nên biết",
      excerpt:
        "Nhiều người nghĩ rằng thuốc lá điện tử an toàn hơn thuốc lá thông thường. Hãy cùng tìm hiểu sự thật về những tác hại của chúng.",
      author: "BS. Nguyễn Văn Chung",
      date: "15 tháng 3, 2023",
      views: "12.102",
      likes: "945",
      comments: "86",
      category: "health",
      url: "/blog/tac-hai-thuoc-la-dien-tu",
      tags: ["Thuốc lá điện tử", "Tác hại", "Sức khỏe", "Nghiên cứu"]
    },
    {
      id: 5,
      slug: "loi-ich-suc-khoe",
      image: "/image/articles/d.jpg",
      title: "Lợi ích sức khỏe khi bỏ thuốc lá - Từng ngày một",
      excerpt:
        "Cơ thể bạn bắt đầu hồi phục ngay từ 20 phút đầu tiên sau khi bỏ thuốc lá. Hãy xem những thay đổi tích cực qua từng mốc thời gian.",
      author: "BS. Lê Thị Mai",
      date: "1 tháng 3, 2023",
      views: "15.487",
      likes: "1.203",
      comments: "92",
      category: "health",
      url: "/blog/loi-ich-suc-khoe",
      tags: ["Lợi ích sức khỏe", "Hồi phục", "Thay đổi tích cực", "Từng ngày"]
    },
    {
      id: 6,
      slug: "ho-tro-nguoi-than",
      image: "/image/articles/c.jpg",
      title: "Hỗ trợ người thân cai thuốc - Điều bạn nên và không nên làm",
      excerpt:
        "Khi người thân đang cố gắng cai thuốc lá, sự hỗ trợ từ gia đình rất quan trọng. Bài viết này sẽ giúp bạn biết cách đồng hành hiệu quả.",
      author: "Phạm Hữu Phước",
      date: "15 tháng 2, 2023",
      views: "7.325",
      likes: "518",
      comments: "45",
      category: "support",
      url: "/blog/ho-tro-nguoi-than",
      tags: ["Hỗ trợ", "Gia đình", "Người thân", "Đồng hành"]
    },
    {
      id: 7,
      slug: "thien-yoga-cai-thuoc",
      image: "/image/articles/e.jpg",
      title: "Ứng dụng thiền và yoga trong quá trình cai thuốc lá",
      excerpt:
        "Thiền và yoga không chỉ giúp giảm stress mà còn hỗ trợ đáng kể trong việc kiểm soát cơn thèm thuốc. Tìm hiểu cách áp dụng hiệu quả.",
      author: "Nguyễn Minh Tùng",
      date: "28 tháng 1, 2023",
      views: "6.843",
      likes: "492",
      comments: "37",
      category: "tips",
      url: "/blog/thien-yoga-cai-thuoc",
      tags: ["Thiền", "Yoga", "Giảm stress", "Kiểm soát"]
    },
    {
      id: 8,
      slug: "dinh-duong-cai-thuoc",
      image: "/image/hero/quit-smoking-2.png",
      title: "Chế độ dinh dưỡng giúp giảm cơn thèm thuốc lá",
      excerpt:
        "Một số thực phẩm có thể giúp giảm cơn thèm thuốc và hỗ trợ cơ thể thải độc. Tìm hiểu chế độ ăn phù hợp cho người đang cai thuốc lá.",
      author: "BS. Trần Thị Hồng",
      date: "5 tháng 1, 2023",
      views: "9.123",
      likes: "756",
      comments: "63",
      category: "tips",
      url: "/blog/dinh-duong-cai-thuoc",
      tags: ["Dinh dưỡng", "Thải độc", "Thực phẩm", "Chế độ ăn"]
    },
  ];
}

// Helper function to render article content based on slug
function renderArticleContent(slug) {
  switch (slug) {
    case "7-ngay-dau":
      return (
        <>
          <p>Tuần đầu tiên khi cai thuốc lá luôn là giai đoạn khó khăn nhất mà bất kỳ ai cũng phải trải qua. Trong bài viết này, chúng ta sẽ tìm hiểu những phương pháp hiệu quả để vượt qua cơn thèm thuốc và duy trì quyết tâm cai thuốc lá của bạn.</p>
          
          <h2>Ngày 1-3: Đối mặt với triệu chứng cai thuốc</h2>
          <p>Trong 72 giờ đầu tiên, cơ thể bạn bắt đầu thải nicotine và các độc tố khác. Đây là giai đoạn khó khăn nhất với các triệu chứng như thèm thuốc dữ dội, cáu gắt, khó tập trung, đau đầu và mất ngủ.</p>
          
          <p><strong>Những điều nên làm:</strong></p>
          <ul>
            <li>Uống nhiều nước để đẩy nhanh quá trình thải độc</li>
            <li>Tránh xa những người hút thuốc và môi trường có thuốc lá</li>
            <li>Sử dụng kẹo cao su không đường khi cảm thấy thèm thuốc</li>
            <li>Tập các bài tập thở sâu khi cảm thấy căng thẳng</li>
            <li>Giữ tay bận rộn với các hoạt động như bóp bóng stress, xếp hình, vẽ...</li>
          </ul>
          
          <h2>Ngày 4-5: Vượt qua cơn thèm tâm lý</h2>
          <p>Sau khi cơ thể đã thải bớt nicotine, bạn sẽ phải đối mặt với thói quen và cơn thèm tâm lý. Đây là lúc bạn cần thay đổi thói quen hàng ngày để tránh những tình huống kích thích cơn thèm thuốc.</p>
          
          <p><strong>Chiến lược hiệu quả:</strong></p>
          <ul>
            <li>Thay đổi thói quen buổi sáng: nếu bạn thường hút thuốc sau khi thức dậy, hãy thay thế bằng một cốc nước ấm với chanh</li>
            <li>Tránh các đồ uống kích thích như cà phê, rượu bia trong những ngày đầu</li>
            <li>Tập thể dục nhẹ nhàng 15-30 phút mỗi ngày để giảm căng thẳng</li>
            <li>Sử dụng các ứng dụng theo dõi quá trình cai thuốc để duy trì động lực</li>
          </ul>
          
          <h2>Ngày 6-7: Xây dựng thói quen mới</h2>
          <p>Khi bạn đã vượt qua 5 ngày đầu tiên, đây là thời điểm tốt để xây dựng những thói quen lành mạnh mới, giúp bạn duy trì quyết tâm lâu dài.</p>
          
          <p><strong>Hành động cụ thể:</strong></p>
          <ul>
            <li>Thưởng cho bản thân bằng những món quà nhỏ từ số tiền tiết kiệm được khi không mua thuốc lá</li>
            <li>Tham gia các nhóm hỗ trợ cai thuốc lá trực tuyến hoặc offline</li>
            <li>Chia sẻ thành công của bạn với người thân, bạn bè để nhận được sự động viên</li>
            <li>Lập danh sách những lợi ích sức khỏe bạn đã cảm nhận được sau 1 tuần không hút thuốc</li>
          </ul>
          
          <p>Hãy nhớ rằng, mỗi ngày bạn không hút thuốc là một chiến thắng. Cơ thể bạn đang dần hồi phục và sức khỏe sẽ cải thiện đáng kể chỉ sau 7 ngày không hút thuốc. Hãy kiên trì và tin tưởng vào quyết định đúng đắn của mình!</p>
        </>
      );
      
    case "chia-se-1-nam":
      return (
        <>
          <p>Đã tròn một năm kể từ ngày tôi hút điếu thuốc cuối cùng. Một hành trình không dễ dàng nhưng đầy ý nghĩa và những thay đổi tích cực. Hôm nay, tôi muốn chia sẻ với các bạn câu chuyện của mình, những khó khăn đã trải qua và những thành quả đạt được sau 365 ngày không thuốc lá.</p>
          
          <h2>Quyết định thay đổi cuộc đời</h2>
          <p>Tôi đã hút thuốc suốt 15 năm, trung bình một gói mỗi ngày. Thuốc lá đã trở thành người bạn đồng hành trong mọi khoảnh khắc: lúc căng thẳng, khi vui vẻ, sau bữa ăn, trước khi đi ngủ... Tôi đã thử cai thuốc nhiều lần nhưng chưa bao giờ vượt qua được 2 tuần.</p>
          
          <p>Quyết định cai thuốc lần này đến khi tôi không thể chạy theo con trai 5 tuổi của mình quá 5 phút mà không cảm thấy khó thở. Ánh mắt thất vọng của con khi tôi phải dừng lại thở dốc là cú sốc lớn. Tôi nhận ra mình đang đánh mất những khoảnh khắc quý giá với gia đình vì thuốc lá.</p>
          
          <h2>Ba tháng đầu tiên - Giai đoạn khó khăn nhất</h2>
          <p>Tuần đầu tiên là địa ngục thực sự: đau đầu, cáu gắt, mất tập trung, thèm thuốc đến phát điên. Tôi đã sử dụng miếng dán nicotine để giảm bớt triệu chứng cai thuốc. Điều quan trọng nhất là sự hỗ trợ từ vợ và các con - họ kiên nhẫn với tôi ngay cả khi tôi trở nên khó chịu và cáu gắt.</p>
          
          <p>Tháng thứ hai và thứ ba, tôi phải đối mặt với những thói quen và tình huống xã hội. Cà phê sáng không có thuốc lá, họp nhóm mà không ra ngoài hút thuốc, gặp bạn bè mà không cùng chia sẻ điếu thuốc... Tôi đã thay thế những thói quen này bằng việc nhai kẹo cao su, uống trà xanh, và tập thở sâu.</p>
          
          <h2>Những thay đổi tích cực sau 6 tháng</h2>
          <p>Sau nửa năm không hút thuốc, những thay đổi tích cực bắt đầu rõ rệt:</p>
          
          <ul>
            <li>Tôi có thể chạy 3km mỗi sáng mà không cảm thấy khó thở</li>
            <li>Vị giác và khứu giác cải thiện đáng kể - thức ăn ngon hơn, mùi hương thơm hơn</li>
            <li>Da dẻ hồng hào, không còn vàng xỉn như trước</li>
            <li>Tiết kiệm được khoảng 15 triệu đồng từ việc không mua thuốc lá</li>
            <li>Không còn mùi thuốc lá trên quần áo, trong nhà và trên xe</li>
            <li>Các con không còn phải tránh xa khi tôi muốn ôm chúng</li>
          </ul>
          
          <h2>Một năm không thuốc lá - Nhìn lại hành trình</h2>
          <p>Hôm nay, kỷ niệm tròn một năm không thuốc lá, tôi tự hào nhìn lại hành trình của mình. Tôi đã hoàn thành một cuộc chạy bán marathon 21km - điều mà tôi chưa bao giờ nghĩ mình có thể làm được. Các chỉ số sức khỏe của tôi đều cải thiện: huyết áp ổn định, chức năng phổi tăng 30%, và không còn ho vào mỗi sáng.</p>
          
          <p>Quan trọng hơn cả, tôi đã lấy lại được sự tự tin và kiểm soát cuộc sống của mình. Không còn phụ thuộc vào thuốc lá, không còn phải lo lắng về việc tìm chỗ hút thuốc hay cảm giác tội lỗi khi hút thuốc trước mặt con cái.</p>
          
          <p>Với những ai đang cố gắng cai thuốc, tôi muốn nói rằng: nếu tôi làm được, bạn cũng có thể làm được. Hãy kiên trì, vượt qua từng ngày một, và tận hưởng những thay đổi tích cực đến với cuộc sống của bạn. Đó là món quà tuyệt vời nhất bạn có thể tặng cho bản thân và người thân yêu.</p>
        </>
      );
      
    default:
      return (
        <p>Nội dung bài viết đang được cập nhật. Vui lòng quay lại sau.</p>
      );
  }
} 