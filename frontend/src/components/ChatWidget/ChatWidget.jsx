import { useState } from "react";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'; 

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'bot', text: 'Dạ em có thể hỗ trợ gì cho anh chị ạ?' }]);
    const [input, setInput] = useState("");

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = { role: 'user', text: input };
        const updatedMessages = [...messages, userMsg];
        setMessages(prev => [...prev, userMsg]);
        setInput("");

        try {
            const res = await axios.post("http://localhost:5000/api/chatbot/ask", { 
                message: input,
                history: updatedMessages 
            });
            setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', text: "Lỗi kết nối!" }]);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
            {/* Nút bấm tròn để mở Chat */}
            <button onClick={() => setIsOpen(!isOpen)} style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontSize: '24px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                {isOpen ? '✕' : '💬'}
            </button>

            {/* Khung Chat */}
            {isOpen && (
                <div style={{ position: 'absolute', bottom: '80px', right: '0', width: '350px', height: '450px', backgroundColor: 'white', borderRadius: '15px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #eee' }}>
                    <div style={{ padding: '15px', backgroundColor: '#2563eb', color: 'white', borderRadius: '15px 15px 0 0', fontWeight: 'bold' }}>Tư vấn viên AI</div>
                    
                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', backgroundColor: m.role === 'user' ? '#2563eb' : '#f1f5f9', color: m.role === 'user' ? 'white' : '#334155', padding: '8px 12px', borderRadius: '12px', fontSize: '14px', maxWidth: '80%' }}>
                                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{m.text}</ReactMarkdown>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '10px', borderTop: '1px solid #eee', display: 'flex', gap: '5px' }}>
                        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Hỏi về khóa học..." style={{ flex: 1, border: '1px solid #ddd', borderRadius: '20px', padding: '8px 15px', outline: 'none' }} />
                        <button onClick={handleSend} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer' }}>➤</button>
                    </div>
                </div>
            )}
        </div>
    );
}