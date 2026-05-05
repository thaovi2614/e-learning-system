import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; 

export default function ForumTab({ courseId }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState("");
    const [file, setFile] = useState(null);

    const fetchQuestions = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/courses/${courseId}/questions`, {
                withCredentials: true 
            });
            setPosts(res.data);
        } catch (err) {
            console.error("Lỗi lấy câu hỏi:", err);
        }
    };

    useEffect(() => {
        if (courseId) fetchQuestions();
    }, [courseId]);

    const handlePost = async () => {
        if (!content.trim()) return;
        try {
            const formData = new FormData();
            formData.append("content", content);
            formData.append("course_id", courseId);
            if (file) formData.append("file", file);

            await axios.post("http://localhost:5000/api/courses/questions", formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" }
            });
            
            setContent("");
            setFile(null); 
            alert("Đã đăng thành công");
            fetchQuestions();
        } catch (err) {
            alert("Không thể đăng câu hỏi!");
        }
    };

    const handleDelete = async (qId) => {
        if (!window.confirm("Bạn có chắc muốn xóa câu hỏi này?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/courses/questions/${qId}`, {
                withCredentials: true
            });
            fetchQuestions();
        } catch (err) {
            alert("Lỗi khi xóa! Bạn không có quyền.");
        }
    };

    return (
        <div className="forum-container">
            <h3>Diễn đàn</h3>
            
            <div className="forum-input" style={{ marginBottom: '50px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Viết câu hỏi..."
                    style={{ width: '100%', minHeight: '120px', padding: '10px', marginBottom: '10px', border: '1px solid #eee' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input 
                        type="file" 
                        onChange={(e) => setFile(e.target.files[0])}
                        style={{ fontSize: '14px' }}
                    />
                    <button onClick={handlePost} className="btn" style={{ padding: '8px 25px' }}>Đăng</button>
                </div>
            </div>

            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Danh sách câu hỏi</h2>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd' }}>
                        <th style={{ padding: '15px', textAlign: 'left', width: '45%' }}>Câu hỏi</th>
                        <th style={{ padding: '15px', textAlign: 'left', width: '20%' }}>Người gửi</th>
                        <th style={{ padding: '15px', textAlign: 'left', width: '20%' }}>Hành động</th>
                        <th style={{ padding: '15px', textAlign: 'left', width: '15%' }}>Ngày gửi</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '15px' }}>
                                <div 
                                    style={{ textDecoration: 'underline', cursor: 'pointer', color: '#333' }}
                                    onClick={() => navigate(`/learn/${courseId}/forum/${p.id}`)}
                                >
                                    {p.content}
                                </div>
                            </td>
                            
                            {/* Cột hiển thị tên người gửi hoặc "Tôi" */}
                            <td style={{ padding: '15px' }}>
                                {user && Number(user.id) === Number(p.student_id) ? (
                                    <span style={{ color: '#555', fontWeight: '500' }}>Tôi</span>
                                ) : (
                                    p.username
                                )}
                            </td>

                            <td style={{ padding: '15px' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <span 
                                        style={{ color: 'blue', cursor: 'pointer' }}
                                        onClick={() => navigate(`/learn/${courseId}/forum/${p.id}`)}
                                    >
                                        Trả lời
                                    </span>
                                    
                                    {/* Nút Sửa & Xóa */}
                                    {user && Number(user.id) === Number(p.student_id) && (
                                        <div style={{ display: 'flex', gap: '10px', borderLeft: '1px solid #ccc', paddingLeft: '10px' }}>
                                            <button 
                                                onClick={() => navigate(`/learn/${courseId}/forum/${p.id}`)} 
                                                style={{ color: 'orange', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                            >
                                                Sửa
                                            </button>

                                            <button 
                                                onClick={() => handleDelete(p.id)} 
                                                style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td style={{ padding: '15px' }}>{p.sentAt}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}