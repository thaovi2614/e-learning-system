import { useEffect, useRef, useState } from "react";
import { socket } from "../../lib/socket.js";
import { useMessage } from "../../context/MessageContext";
import sendIcon from "../../assets/send.png";
import { uploadMessageImage } from "../../services/messageApi.js";
import "./chatbox.css";

export default function ChatBox({ conversationId, userId, messages }) {
  const { sendMessage } = useMessage();

  const [typingUsers, setTypingUsers] = useState([]);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState(null); // { file, url }
  const [uploading, setUploading] = useState(false);

  const typingTimeout = useRef(null);
  const bottomRef = useRef();
  const scrollRef = useRef(null);
  const scrollTimeout = useRef(null);
  const fileInputRef = useRef(null);

  // ================= FORMAT TIME =================
  const formatTime = (time) => {
    if (!time) return "";
    const date = new Date(time);
    const now = new Date();
    const isSameDay =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    const timeStr = date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    if (isSameDay) return timeStr;
    if (isYesterday) return `Hôm qua ${timeStr}`;
    if (diffDays < 7) {
      const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
      return `${days[date.getDay()]} ${timeStr}`;
    }
    return date.toLocaleDateString("vi-VN");
  };

  // ================= SOCKET LISTEN =================
  useEffect(() => {
    const handleTyping = (data) => {
      if (data.conversation_id !== conversationId) return;
      setTypingUsers((prev) => prev.includes(data.user_id) ? prev : [...prev, data.user_id]);
    };
    const handleStopTyping = (data) => {
      if (data.conversation_id !== conversationId) return;
      setTypingUsers((prev) => prev.filter((id) => id !== data.user_id));
    };
    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);
    return () => {
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
    };
  }, [conversationId]);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      el.classList.add("show-scrollbar");
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => el.classList.remove("show-scrollbar"), 1200);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // ================= HANDLE TYPING =================
  const handleTyping = (value) => {
    setInput(value);
    if (!conversationId) return;
    socket.emit("typing", { conversation_id: conversationId, user_id: userId });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { conversation_id: conversationId, user_id: userId });
    }, 1000);
  };

  // ================= HANDLE IMAGE SELECT =================
  const handleImageSelect = (file) => {
    if (!file) return;
    setImagePreview({ file, url: URL.createObjectURL(file) });
  };

  const handleRemovePreview = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ================= SEND =================
  const handleSend = async () => {
    if (!input.trim() && !imagePreview) return;
    setUploading(true);
    try {
      let imageUrl = null;
      if (imagePreview) {
        const formData = new FormData();
        formData.append("image", imagePreview.file);
        formData.append("conversation_id", conversationId);
        const res = await uploadMessageImage(formData);
        imageUrl = res.data.image_url;
      }
      socket.emit("send_message", {
        conversation_id: conversationId,
        sender_id: userId,
        message: input || null,
        image_url: imageUrl,
      });
      socket.emit("stop_typing", { conversation_id: conversationId, user_id: userId });
      setInput("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="chatbox">

      {/* ================= MESSAGES ================= */}
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === userId;
          const prev = messages[index - 1];
          const next = messages[index + 1];
          const sameAsPrev = prev && prev.sender_id === msg.sender_id;
          const sameAsNext = next && next.sender_id === msg.sender_id;
          let position = "";
          if (!sameAsPrev && sameAsNext) position = "first";
          else if (sameAsPrev && sameAsNext) position = "middle";
          else if (sameAsPrev && !sameAsNext) position = "last";
          const isLast = !sameAsNext;
          const isFirst = !sameAsPrev;

          return (
            <div
              key={msg.id}
              className={`chat-message-wrapper ${isMe ? "me" : "other"} ${isFirst ? "group-start" : ""}`}
            >
              {!isMe && (
                isFirst
                  ? <img src={msg.avatar || "/default-avatar.png"} className="chat-avatar" alt="" />
                  : <div className="chat-avatar-placeholder" />
              )}
              <div className="chat-content">
                {msg.image_url && (
                  <img
                    src={msg.image_url}
                    alt=""
                    className="chat-image"
                    onClick={() => window.open(msg.image_url, "_blank")}
                  />
                )}

                {msg.content && (
                  <div className={`chat-bubble ${isMe ? "me" : "other"} ${position}`}>
                    {msg.content}
                  </div>
                )}

                {isLast && (
                  <div className="chat-time">
                    {formatTime(msg.sentAt || msg.created_at)}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* typing */}
        {typingUsers.length > 0 && (
          <div className="chat-typing">
            <div className="typing-bubble">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef}></div>
      </div>

      {/* ================= IMAGE PREVIEW ================= */}
      {imagePreview && (
        <div className="image-preview">
          <img src={imagePreview.url} alt="preview" />
          <button className="remove-preview" onClick={handleRemovePreview}>✕</button>
        </div>
      )}

      {/* ================= INPUT ================= */}
      <div className="chat-input">
        <label className="upload-image-btn">
          📎
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleImageSelect(e.target.files[0])}
          />
        </label>
        <input
          value={input}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Nhập tin nhắn..."
          disabled={uploading}
        />
        <button onClick={handleSend} disabled={uploading}>
          {uploading ? "..." : <img src={sendIcon} alt="send" />}
        </button>
      </div>
    </div>
  );
}