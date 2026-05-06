import { useEffect } from "react";
import { useMessage } from "../../context/MessageContext";
import { useAuth } from "../../context/AuthContext";
import ChatBox from "../../components/chat/ChatBox";
import { useLocation } from "react-router-dom";
import "./messages.css";
import { markAsRead } from "../../services/messageApi";

export default function Messages() {
    const { user } = useAuth();
    const location = useLocation();

    const {
        conversations,
        setConversations,
        currentConversation,
        setCurrentConversation,
        messagesMap,
        fetchMessages,
        fetchConversations,
        setIsInChatPage
    } = useMessage();

    const userId = user?.id;

    // ================= CHECK USER IN CHAT PAGE =================
    useEffect(() => {
        setIsInChatPage(true);

        return () => {
            setIsInChatPage(false);
        };
    }, []);

    // ================= LOAD MESSAGES =================
    useEffect(() => {
        if (!currentConversation) return;

        fetchMessages(currentConversation);
    }, [currentConversation]);

    useEffect(() => {
      if (!currentConversation) return;

      markAsRead(currentConversation);

      setConversations(prev =>
        prev.map(c =>
          c.id === currentConversation
            ? { ...c, unread_count: 0 }
            : c
        )
      );
    }, [location.pathname]);

    useEffect(() => {
        fetchConversations();
    }, [location.pathname]);

    // ================= AUTO OPEN FROM URL =================
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const convoId = params.get("conversation");

        if (convoId) {
            fetchConversations().then(() => {
                setCurrentConversation(Number(convoId));
            });
        }
    }, [location.search]);

    const messages = messagesMap[currentConversation] || [];

    const formatRelativeTime = (time) => {
        if (!time) return "";

        const now = new Date();
        const past = new Date(time);

        const diff = Math.floor((now - past) / 1000); // seconds

        if (diff < 60) return "Vừa xong";
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        if (diff < 172800) return "Hôm qua";

        return past.toLocaleDateString("vi-VN");
    };

    return (
        <div className="messages-container">

            {/* LEFT */}
            <div className="messages-sidebar">
                <h4>Đoạn chat</h4>

                {conversations.map((c) => (
                    <div
                        key={c.id}
                        className={`conversation-item
                            ${currentConversation === c.id ? "active" : ""}
                            ${c.unread_count > 0 ? "has-unread" : ""}
                        `}
                        onClick={() => setCurrentConversation(c.id)}
                    >
                        <div className="conversation-row">

                            <div className="conversation-left">
                                <img src={c.avatar || "/default-avatar.png"} alt="" />

                                <div className="conversation-text">
                                    <div className="name">{c.name}</div>
                                    <div className="last-message">
                                        {c.last_sender_id === userId ? "Bạn: " : ""}
                                        {c.last_message || "Chưa có tin nhắn"}
                                    </div>
                                </div>
                            </div>

                            <div className="conversation-right">
                                {c.last_time && (
                                    <span className="time">
                                        {formatRelativeTime(c.last_time)}
                                    </span>
                                )}

                                {c.unread_count > 0 && (
                                    <span className="unread-badge">
                                        {c.unread_count}
                                    </span>
                                )}
                            </div>

                        </div>
                    </div>
                ))}
            </div>

            {/* RIGHT */}
            <div className="messages-chat">
                {currentConversation ? (
                    <ChatBox
                        conversationId={currentConversation}
                        userId={userId}
                        messages={messages}
                    />
                ) : (
                    <div className="empty-chat">
                        Chọn một đoạn chat để bắt đầu
                    </div>
                )}
            </div>
        </div>
    );
}