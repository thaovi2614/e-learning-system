import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

export default function QuestionDetail() {
    const { user } = useAuth();
    const { id, questionId } = useParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState(null);
    const fileInputRef = useRef(null); 
    const replyInputRef = useRef(null);

    const [reply, setReply] = useState("");
    const [replyFile, setReplyFile] = useState(null); 
    const [replyToId, setReplyToId] = useState(null); 
    const [expandedIds, setExpandedIds] = useState({}); 

    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [editQContent, setEditQContent] = useState("");
    const [editQFile, setEditQFile] = useState(null);

    const [editingAnsId, setEditingAnsId] = useState(null);
    const [editAnsContent, setEditAnsContent] = useState("");
    const [editAnsFile, setEditAnsFile] = useState(null); 

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

    const startEditingQuestion = () => {
        setIsEditingQuestion(true);
        setEditQContent(data.question.content);
        setEditQFile(null);
    };

    const toggleExpand = (ansId) => {
        setExpandedIds(prev => ({ ...prev, [ansId]: !prev[ansId] }));
    };

    const handleReplyClick = (ansId) => {
        setReplyToId(ansId);
        replyInputRef.current?.focus();
        replyInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleMarkCorrect = async (ansId) => {
        try {
            await axios.put(`http://localhost:5000/api/courses/answers/${ansId}/correct`, {}, { withCredentials: true });
            await loadData();
        } catch (err) { alert("Lỗi khi đánh dấu"); }
    };

    const handleSendReply = async () => {
        if (!reply.trim()) return;
        try {
            const formData = new FormData();
            formData.append("content", reply);
            if (replyToId) formData.append("parent_id", replyToId);
            if (replyFile) formData.append("file", replyFile);

            await axios.post(`http://localhost:5000/api/courses/questions/${questionId}/answers`, 
                formData,
                { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
            );
            
            setReply("");
            setReplyFile(null);
            setReplyToId(null);
            if(fileInputRef.current) fileInputRef.current.value = ""; 
            
            alert("Đăng thành công"); 
            await loadData();
        } catch (err) { alert("Lỗi khi gửi phản hồi"); }
    };

    const handleUpdateQuestion = async () => {
        if (!editQContent.trim()) return;
        try {
            const formData = new FormData();
            formData.append("content", editQContent);
            if (editQFile) formData.append("file", editQFile);

            await axios.put(`http://localhost:5000/api/courses/questions/${questionId}`, formData, {
                withCredentials: true, headers: { "Content-Type": "multipart/form-data" }
            });
            
            setIsEditingQuestion(false);
            alert("Đã lưu thành công"); 
            await loadData();
        } catch (err) { alert("Lỗi cập nhật câu hỏi"); 
            alert("Lỗi từ Backend: " + (err.response?.data?.message || err.message)); 
            console.error("Chi tiết lỗi:", err);
        }
    };

    const handleDeleteQuestion = async () => {
        if (!window.confirm("Xác nhận xóa câu hỏi này?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/courses/questions/${questionId}`, { withCredentials: true });
            alert("Đã xóa thành công"); 
            navigate(`/learn/${id}/forum`);
        } catch (err) { alert("Lỗi khi xóa"); }
    };

    const handleUpdateAns = async (ansId) => {
        if (!editAnsContent.trim()) return;
        try {
            const formData = new FormData();
            formData.append("content", editAnsContent);
            if (editAnsFile) formData.append("file", editAnsFile);

            await axios.put(`http://localhost:5000/api/courses/answers/${ansId}`, 
                formData,
                { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
            );
            
            setEditingAnsId(null);
            setEditAnsFile(null);
            alert("Đã lưu thành công"); 
            await loadData();
        } catch (err) { 
            alert("Lỗi từ Backend: " + (err.response?.data?.message || err.message)); 
            console.error("Chi tiết lỗi:", err);
        }
    };

    const handleDeleteAns = async (ansId) => {
        if (!window.confirm("Xác nhận xóa phản hồi này?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/courses/answers/${ansId}`, { withCredentials: true });
            alert("Đã xóa thành công"); 
            await loadData();
        } catch (err) { alert("Lỗi khi xóa"); }
    };

    const renderAnswerTree = (parentId = null, level = 0) => {
        if (!data || !data.answers) return null;

        return data.answers
            .filter(ans => ans.parent_id === parentId)
            .map(ans => {
                const childAnswers = data.answers.filter(a => a.parent_id === ans.id);
                const isExpanded = expandedIds[ans.id];

                return (
                    <div key={ans.id} style={{ marginLeft: level > 0 ? '30px' : '0', marginTop: '10px' }}>
                        <div style={{ 
                            backgroundColor: '#fff', 
                            borderRadius: '12px', 
                            border: level > 0 ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
                            overflow: 'hidden', 
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}>
                            {/* 1. Banner Câu trả lời đúng */}
                            {ans.is_correct && (
                                <div style={{ 
                                    backgroundColor: '#ecfdf5', 
                                    padding: '6px 15px', 
                                    borderBottom: '1px solid #10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span style={{ fontSize: '14px' }}>✅</span>
                                    <span style={{ color: '#059669', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        Câu trả lời chính xác
                                    </span>
                                </div>
                            )}

                            <div style={{ padding: '15px 20px' }}>
                                {/* 2. Header: Tên + Role */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>
                                            {user && Number(ans.user_id) === Number(user.id) ? 'Tôi' : ans.username}
                                        </span>
                                        {ans.role === 'INSTRUCTOR' && (
                                            <span style={{ 
                                                backgroundColor: '#e0f2fe', 
                                                color: '#0369a1', 
                                                padding: '2px 8px', 
                                                borderRadius: '6px', 
                                                fontSize: '11px', 
                                                fontWeight: 'bold',
                                                border: '1px solid #bae6fd'
                                            }}>
                                                GIẢNG VIÊN
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{ans.sentAt}</span>
                                </div>

                                {/* BỔ SUNG LẠI LOGIC: NẾU ĐANG BẤM SỬA THÌ HIỆN KHUNG, KHÔNG THÌ HIỆN TEXT */}
                                {editingAnsId === ans.id ? (
                                    <div style={{ marginTop: '10px' }}>
                                        <textarea 
                                            style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '14px', marginBottom: '10px', fontFamily: 'inherit' }}
                                            value={editAnsContent} 
                                            onChange={(e) => setEditAnsContent(e.target.value)} 
                                        />
                                        <div style={{ marginBottom: '10px' }}>
                                            <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Đính kèm tệp mới (Tùy chọn):</label>
                                            <input type="file" onChange={(e) => setEditAnsFile(e.target.files[0])} style={{ fontSize: '13px' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleUpdateAns(ans.id)} style={{ padding: '6px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Lưu thay đổi</button>
                                            <button onClick={() => setEditingAnsId(null)} style={{ padding: '6px 15px', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Hủy</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {/* 3. Nội dung bình luận */}
                                        <p style={{ margin: '0 0 12px 0', color: '#334155', fontSize: '15px', lineHeight: '1.6' }}>
                                            {ans.content}
                                        </p>

                                        {/* 4. Tệp đính kèm & Thao tác (Hàng ngang dưới cùng) */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <button onClick={() => handleReplyClick(ans.id)} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: 0 }}>Phản hồi</button>
                                                
                                                {user && user.role === 'INSTRUCTOR' && (
                                                    <button onClick={() => handleMarkCorrect(ans.id)} style={{ color: ans.is_correct ? '#ef4444' : '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: 0 }}>
                                                        {ans.is_correct ? 'Hủy đánh dấu' : 'Đánh dấu đúng'}
                                                    </button>
                                                )}

                                                {user && Number(user.id) === Number(ans.user_id) && (
                                                    <>
                                                        <button onClick={() => { setEditingAnsId(ans.id); setEditAnsContent(ans.content); }} style={{ color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: 0 }}>Sửa</button>
                                                        <button onClick={() => handleDeleteAns(ans.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: 0 }}>Xóa</button>
                                                    </>
                                                )}
                                            </div>

                                            {ans.file_url && (
                                                <a href={ans.file_url} target="_blank" rel="noreferrer" style={{ 
                                                    color: '#64748b', 
                                                    textDecoration: 'none', 
                                                    fontSize: '14px', 
                                                    backgroundColor: '#f8fafc',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e2e8f0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}>
                                                    📎 Tệp đính kèm
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Nút Xem/Thu gọn */}
                        {childAnswers.length > 0 && (
                            <div 
                                onClick={() => toggleExpand(ans.id)} 
                                style={{ 
                                    color: '#2563eb', 
                                    fontSize: '12px', 
                                    cursor: 'pointer', 
                                    marginTop: '8px', 
                                    fontWeight: 'bold', 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '4px',
                                    padding: '2px 10px'
                                }}
                            >
                                {isExpanded ? '▲ Thu gọn phản hồi' : `▼ Xem ${childAnswers.length} phản hồi`}
                            </div>
                        )}

                        {isExpanded && renderAnswerTree(ans.id, level + 1)}
                    </div>
                );
            });
};
    if (!data) return <div style={{ padding: '20px' }}>Đang tải câu hỏi...</div>;

    const isQuestionOwner = user && data.question.username === user.username;

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            
            <button className="btn" onClick={() => navigate(`/learn/${id}/forum`)} style={{ marginBottom: '20px', padding: '8px 15px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>
                ← Quay lại diễn đàn
            </button>
            
            <div style={{ border: '1px solid #e2e8f0', padding: '25px', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p style={{ color: '#2563eb', fontWeight: '600', margin: 0, fontSize: '15px' }}>
                            {user && data.question.username === user.username ? <span style={{ fontStyle: 'italic', color: '#555' }}>Tôi</span> : data.question.username}
                        </p>
                        {data.question.role === 'INSTRUCTOR' && (
                            <span style={{ color: '#0ea5e9', fontSize: '14px', marginLeft: '6px', fontWeight: 'bold' }}>
                                [Giảng viên]
                            </span>
                        )}
                    </div>
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
                        <h2 style={{ margin: '15px 0', fontSize: '20px', color: '#1e293b' }}>{data.question.content}</h2>
                        
                        {data.question.file_url && (
                            <a href={data.question.file_url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '15px' }}>
                                📎 Xem tệp đính kèm
                            </a>
                        )}

                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                            <button onClick={() => handleReplyClick(null)} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: '500' }}>Phản hồi câu hỏi</button>
                            
                            {isQuestionOwner && (
                                <>
                                    <button onClick={startEditingQuestion} style={{ color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: '500' }}>Sửa</button>
                                    <button onClick={handleDeleteQuestion} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: '500' }}>Xóa</button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <h4 style={{ marginTop: '30px', color: '#475569', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                {data.answers.length} Phản hồi
            </h4>

            <div style={{ marginTop: '20px', marginBottom: '100px' }}>
                {renderAnswerTree(null, 0)}
            </div>

            <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fff', border: '2px solid #2563eb', borderRadius: '12px' }}>
                {replyToId && (
                    <div style={{ marginBottom: '10px', fontSize: '13px', color: '#2563eb', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Đang trả lời một bình luận bên trên...</span>
                        <button onClick={() => setReplyToId(null)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>[Hủy phản hồi người này]</button>
                    </div>
                )}
                <textarea 
                    ref={replyInputRef}
                    placeholder="Viết phản hồi của bạn..."
                    style={{ width: '100%', minHeight: '100px', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', marginBottom: '10px' }}
                    value={reply} onChange={(e) => setReply(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input type="file" ref={fileInputRef} onChange={(e) => setReplyFile(e.target.files[0])} style={{ fontSize: '13px' }} />
                    <button onClick={handleSendReply} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Gửi phản hồi</button>
                </div>
            </div>
        </div>
    );
}