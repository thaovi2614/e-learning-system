import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { socket } from "../lib/socket";
import { getAllUserConversations } from "../services/conversationApi";
import { getMessages, markAsRead } from "../services/messageApi";

const MessageContext = createContext();

export function MessageProvider({ children }) {
    const { user } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [messagesMap, setMessagesMap] = useState({});
    const [currentConversation, setCurrentConversation] = useState(null);

    const currentConversationRef = useRef(null);
    const isInChatPageRef = useRef(false);

    // ================= FETCH CONVERSATIONS =================
    const fetchConversations = async () => {
        if (!user) {
            setConversations([]);
            return;
        }

        try {
            const res = await getAllUserConversations();
            setConversations(res.data.data);
            return res.data.data;
        } catch (err) {
            console.error(err);
        }
    };

    // ================= FETCH MESSAGES =================
    const fetchMessages = async (conversationId) => {
        try {
            const res = await getMessages(conversationId);

            setMessagesMap((prev) => ({
                ...prev,
                [conversationId]: res.data.data
            }));
        } catch (err) {
            console.error(err);
        }
    };

    // ================= SEND MESSAGE =================
    const sendMessage = (conversationId, content) => {
        socket.emit("send_message", {
            conversation_id: conversationId,
            sender_id: user.id,
            message: content,
        });
    };

    // ================= SOCKET =================
    useEffect(() => {
        if (!user) return;

        socket.connect();

        const handleReceive = async (msg) => {
            const convoId = msg.conversation_id;

            // 1. add message
            setMessagesMap((prev) => {
                const oldMessages = prev[convoId] || [];
                return {
                    ...prev,
                    [convoId]: [...oldMessages, msg],
                };
            });

            // 2. update sidebar (🔥 QUAN TRỌNG)
            setConversations((prev) => {
                const updated = prev.map((c) => {
                    if (c.id !== convoId) return c;

                    const isMe = msg.sender_id === user.id;

                    return {
                        ...c,
                        last_message: msg.content,
                        last_time: msg.sentAt,
                        last_sender_id: msg.sender_id,
                        unread_count: isMe
                            ? c.unread_count
                            : (
                                isInChatPageRef.current &&
                                currentConversationRef.current === convoId
                            )
                                ? 0
                                : (c.unread_count || 0) + 1,
                    };
                });

                // 3. sort giống Zalo (tin mới lên đầu)
                return updated.sort(
                    (a, b) => new Date(b.last_time) - new Date(a.last_time)
                );
            });

            // 3. mark read nếu đang mở
            if (
                msg.sender_id !== user.id &&
                isInChatPageRef.current &&
                currentConversationRef.current === convoId
            ) {
                try {
                    await markAsRead(convoId);
                } catch (err) {
                    console.error(err);
                }
            }
        };

        socket.on("receive_message", handleReceive);

        return () => {
            socket.off("receive_message", handleReceive);
        };
    }, [user]);

    // ================= JOIN ROOM + MARK READ =================
    useEffect(() => {
        if (!currentConversation) return;

        currentConversationRef.current = currentConversation;

        socket.emit("join_conversation", {
            conversation_id: currentConversation,
        });

        // mark read khi click vào
        markAsRead(currentConversation);

        setConversations(prev =>
            prev.map(c =>
                c.id === currentConversation
                    ? { ...c, unread_count: 0 }
                    : c
            )
        );
    }, [currentConversation]);

    // ================= JOIN ALL ROOMS =================
    useEffect(() => {
        if (!conversations.length) return;

        conversations.forEach(c => {
            socket.emit("join_conversation", {
                conversation_id: c.id
            });
        });
    }, [conversations]);

    // ================= TAB FOCUS =================
    useEffect(() => {
        const handleFocus = () => {
            if (
                currentConversationRef.current &&
                isInChatPageRef.current
            ) {
                markAsRead(currentConversationRef.current);

                setConversations(prev =>
                    prev.map(c =>
                        c.id === currentConversationRef.current
                            ? { ...c, unread_count: 0 }
                            : c
                    )
                );
            }
        };

        window.addEventListener("focus", handleFocus);

        return () => window.removeEventListener("focus", handleFocus);
    }, []);

    // ================= FETCH LIST =================
    useEffect(() => {
        fetchConversations();
    }, [user]);

    return (
        <MessageContext.Provider
            value={{
                conversations,
                setConversations,
                messagesMap,
                currentConversation,
                setCurrentConversation,
                fetchMessages,
                fetchConversations,
                sendMessage,
                setIsInChatPage: (val) => {
                    isInChatPageRef.current = val;
                }
            }}
        >
            {children}
        </MessageContext.Provider>
    );
}

export function useMessage() {
    return useContext(MessageContext);
}