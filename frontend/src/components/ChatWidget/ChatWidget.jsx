import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'bot', text: 'Dạ em có thể hỗ trợ gì cho anh chị ạ?' }]);
    const [input, setInput] = useState("");
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

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

    const colors = {
        bgMain: "#1e1e1e",
        bgHeader: "#2d2d2d",
        userMsg: "#3b82f6", 
        botMsg: "#333333",
        textUser: "#ffffff",
        textBot: "#e5e7eb",
        accent: "#2563eb"
    };

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
            {/* Nút Toggle */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                style={{ 
                    width: '60px', height: '60px', borderRadius: '50%', 
                    backgroundColor: colors.accent, color: 'white', 
                    border: 'none', cursor: 'pointer', fontSize: '24px', 
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {/* Khung Chat */}
            {isOpen && (
                <div style={{ 
                    position: 'fixed', bottom: '90px', right: '20px', 
                    width: '360px', height: '500px', 
                    backgroundColor: colors.bgMain, borderRadius: '20px', 
                    display: 'flex', flexDirection: 'column', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)', 
                    border: '1px solid #333', overflow: 'hidden'
                }}>
                    
                    {/* Header */}
                    <div style={{ 
                        padding: '15px 20px', backgroundColor: colors.bgHeader, 
                        color: 'white', display: 'flex', alignItems: 'center', 
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '10px', height: '10px', backgroundColor: '#4ade80', borderRadius: '50%' }}></div>
                            <span style={{ fontWeight: '600' }}>Tư vấn viên thông minh</span>
                        </div>
                        <div style={{ opacity: 0.6, fontSize: '12px' }}></div>
                        <span style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)}>—</span>
                    </div>
                    
                    {/* Nội dung tin nhắn */}
                    <div 
                        ref={scrollRef}
                        style={{ 
                            flex: 1, padding: '15px', overflowY: 'auto', 
                            display: 'flex', flexDirection: 'column', gap: '12px'
                        }}
                    >
                        {messages.map((m, i) => (
                            <div key={i} style={{ 
                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '80%', display: 'flex', gap: '8px'
                            }}>
                                {m.role === 'bot' && (
                                    <div style={{ width: '24px', height: '24px', backgroundColor: colors.accent, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🤖</div>
                                )}
                                <div style={{ 
                                    backgroundColor: m.role === 'user' ? colors.userMsg : colors.botMsg, 
                                    color: m.role === 'user' ? colors.textUser : colors.textBot, 
                                    padding: '10px 14px', 
                                    borderRadius: m.role === 'user' ? '15px 15px 2px 15px' : '2px 15px 15px 15px', 
                                    fontSize: '14px', lineHeight: '1.4',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>{m.text}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Ô nhập liệu */}
                    <div style={{ padding: '15px', backgroundColor: colors.bgHeader }}>
                        <div style={{ 
                            display: 'flex', alignItems: 'center', 
                            backgroundColor: '#121212', borderRadius: '20px', 
                            padding: '5px 15px', border: '1px solid #444' 
                        }}>
                            <input 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                                placeholder="Nhập tin nhắn..." 
                                style={{ 
                                    flex: 1, border: 'none', backgroundColor: 'transparent', 
                                    color: 'white', outline: 'none', padding: '8px 0'
                                }} 
                            />
                            <button 
                                onClick={handleSend} 
                                style={{ 
                                    backgroundColor: 'transparent', color: colors.accent, 
                                    border: 'none', cursor: 'pointer', fontSize: '18px',
                                    marginLeft: '10px'
                                }}
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
