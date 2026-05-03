import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

export default function QuestionDetail() {
    const { user } = useAuth();
    const { id, questionId } = useParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState(null);
    const fileInputRef = useRef(null); // Dùng để reset ô chọn file
    
    // State Đăng câu hỏi / trả lời
    const [reply, setReply] = useState("");
    const [replyFile, setReplyFile] = useState(null); // File đính kèm cho phản hồi mới
    
    // State Sửa câu hỏi
    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [editQContent, setEditQContent] = useState("");
    const [editQFile, setEditQFile] = useState(null);

    // State Sửa câu trả lời
    const [editingAnsId, setEditingAnsId] = useState(null);
    const [editAnsContent, setEditAnsContent] = useState("");
    const [editAnsFile, setEditAnsFile] = useState(null); // File đính kèm khi sửa phản hồi

    const loadData = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/courses/questions/${questionId}`, {
                withCredentials: true
            });
            setData(res.data);
        } catch (err) { 
            console.error("Lỗi tải dữ liệu:", err); 
        }
    };

    useEffect(() => { loadData(); }, [questionId]);

    // --------- LOGIC CHO CÂU HỎI CHÍNH ---------
    const startEditingQuestion = () => {
        setIsEditingQuestion(true);
        setEditQContent(data.question.content);
        setEditQFile(null);
    };

    const handleUpdateQuestion = async () => {
        if (!editQContent.trim()) return;
        try {
            const formData = new FormData();
            formData.append("content", editQContent);
            if (editQFile) formData.append("file", editQFile);

            await axios.put(`http://localhost:5000/api/courses/questions/${questionId}`, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" }
            });
            
            setIsEditingQuestion(false);
            await loadData();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi cập nhật câu hỏi");
        }
    };

    const handleDeleteQuestion = async () => {
        if (!window.confirm("Xác nhận xóa câu hỏi này?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/courses/questions/${questionId}`, {
                withCredentials: true
            });
            navigate(`/learn/${id}`);
        } catch (err) {
            alert("Lỗi khi xóa");
        }
    };

    // --------- LOGIC CHO CÂU TRẢ LỜI ---------
    const handleSendReply = async () => {
        if (!reply.trim()) return;
        try {
            const formData = new FormData();
            formData.append("content", reply);
            if (replyFile) formData.append("file", replyFile); // Gửi kèm tệp

            await axios.post(`http://localhost:5000/api/courses/questions/${questionId}/answers`, 
                formData,
                { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
            );
            
            setReply("");
            setReplyFile(null);
            if(fileInputRef.current) fileInputRef.current.value = ""; // Reset input file
            await loadData();
        } catch (err) { alert("Lỗi khi gửi phản hồi"); }
    };

    const handleUpdateAns = async (ansId) => {
        if (!editAnsContent.trim()) return;
        try {
            const formData = new FormData();
            formData.append("content", editAnsContent);
            if (editAnsFile) formData.append("file", editAnsFile); // Gửi kèm tệp mới

            await axios.put(`http://localhost:5000/api/courses/answers/${ansId}`, 
                formData,
                { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
            );
            
            setEditingAnsId(null);
            setEditAnsFile(null);
            await loadData();
        } catch (err) { alert("Lỗi khi cập nhật"); }
    };

    const handleDeleteAns = async (ansId) => {
        if (!window.confirm("Xác nhận xóa phản hồi này?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/courses/answers/${ansId}`, { withCredentials: true });
            await loadData();
        } catch (err) { alert("Lỗi khi xóa"); }
    };

    if (!data) return <div style={{ padding: '20px' }}>Đang tải câu hỏi...</div>;

    const isQuestionOwner = user && data.question.username === user.username; 

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <button className="btn" onClick={() => navigate(`/learn/${id}`)} style={{ marginBottom: '20px', padding: '8px 15px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>
                ← Quay lại diễn đàn
            </button>
            
            {/* --- KHU VỰC CÂU HỎI CHÍNH --- */}
            <div style={{ border: '1px solid #e2e8f0', padding: '25px', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#2563eb', fontWeight: '600', margin: 0, fontSize: '15px' }}>
                        {user && data.question.username === user.username ? <span style={{ fontStyle: 'italic', color: '#555' }}>Tôi</span> : data.question.username}
                    </p>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{data.question.sentAt}</span>
                </div>
                
                {isEditingQuestion ? (
                    <div style={{ marginTop: '15px' }}>
                        <textarea 
                            style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '14px', marginBottom: '10px' }}
                            value={editQContent} 
                            onChange={(e) => setEditQContent(e.target.value)} 
                        />
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Đính kèm tệp mới (Tùy chọn):</label>
                            <input type="file" onChange={(e) => setEditQFile(e.target.files[0])} style={{ fontSize: '13px' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleUpdateQuestion} style={{ padding: '6px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lưu thay đổi</button>
                            <button onClick={() => setIsEditingQuestion(false)} style={{ padding: '6px 15px', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h2 style={{ margin: '15px 0', lineHeight: '1.5', fontSize: '20px', color: '#1e293b' }}>
                            {data.question.content}
                        </h2>
                        
                        {data.question.file_url && (
                            <a href={`http://localhost:5000/${data.question.file_url}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '15px' }}>
                                📎 Xem tệp đính kèm
                            </a>
                        )}

                        {isQuestionOwner && (
                            <div style={{ display: 'flex', gap: '15px', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                                <button onClick={startEditingQuestion} style={{ color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: '500' }}>Sửa câu hỏi</button>
                                <button onClick={handleDeleteQuestion} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: '500' }}>Xóa câu hỏi</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <h4 style={{ marginTop: '30px', color: '#475569', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                {data.answers.length} Phản hồi
            </h4>

            {/* --- KHU VỰC CÂU TRẢ LỜI --- */}
            <div style={{ marginTop: '20px' }}>
                {data.answers && data.answers.map(ans => (
                    <div key={ans.id} style={{ marginLeft: '30px', padding: '15px 20px', backgroundColor: '#f8fafc', borderRadius: '10px', borderLeft: '4px solid #cbd5e1', marginBottom: '15px' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <p style={{ margin: 0, fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                {user && ans.user_id === user.id ? <span style={{ fontStyle: 'italic', color: '#555' }}>Tôi</span> : ans.username}
                            </p>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{ans.sentAt}</span>
                        </div>

                        {editingAnsId === ans.id ? (
                            <div style={{ marginTop: '10px' }}>
                                <textarea 
                                    style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '14px', marginBottom: '10px' }}
                                    value={editAnsContent} onChange={(e) => setEditAnsContent(e.target.value)} 
                                />
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Đính kèm tệp mới (Tùy chọn):</label>
                                    <input type="file" onChange={(e) => setEditAnsFile(e.target.files[0])} style={{ fontSize: '13px' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button onClick={() => handleUpdateAns(ans.id)} style={{ padding: '6px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lưu thay đổi</button>
                                    <button onClick={() => { setEditingAnsId(null); setEditAnsFile(null); }} style={{ padding: '6px 15px', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p style={{ margin: 0, color: '#1e293b', fontSize: '15px', lineHeight: '1.5' }}>{ans.content}</p>
                                
                                {/* Hiển thị link tải tệp nếu câu trả lời có đính kèm */}
                                {ans.file_url && (
                                    <a href={`http://localhost:5000/${ans.file_url}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '10px' }}>
                                        📎 Xem tệp đính kèm
                                    </a>
                                )}

                                {user && Number(user.id) === Number(ans.user_id) && (
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
                                        <button onClick={() => { setEditingAnsId(ans.id); setEditAnsContent(ans.content); setEditAnsFile(null); }} style={{ color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: '500' }}>Sửa</button>
                                        <button onClick={() => handleDeleteAns(ans.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: '500' }}>Xóa</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Viết phản hồi mới */}
            <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <textarea 
                    placeholder="Viết phản hồi của bạn..."
                    style={{ width: '100%', minHeight: '100px', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', marginBottom: '10px' }}
                    value={reply} onChange={(e) => setReply(e.target.value)}
                />
                
                <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={(e) => setReplyFile(e.target.files[0])} 
                        style={{ fontSize: '13px', color: '#64748b' }} 
                    />
                    <button onClick={handleSendReply} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Gửi phản hồi</button>
                </div>
            </div>
        </div>
    );
}