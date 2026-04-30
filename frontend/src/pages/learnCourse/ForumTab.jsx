import { useState } from "react";

export default function ForumTab() {
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState("");

    const handlePost = () => {
        if (!content.trim()) return;

        setPosts(prev => [
            ...prev,
            { id: Date.now(), user_name: "Bạn", content }
        ]);

        setContent("");
    };

    return (
        <div className="forum-container">
            <h3>Diễn đàn</h3>

            <div className="forum-input">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Viết câu hỏi..."
                />
                <button onClick={handlePost}>Đăng</button>
            </div>

            {posts.map(p => (
                <div key={p.id} className="post-item">
                    <div className="post-user">{p.user_name}</div>
                    <div className="post-content">{p.content}</div>
                </div>
            ))}
        </div>
    );
}