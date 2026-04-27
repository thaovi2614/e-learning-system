import { useEffect, useState } from "react";
import api from "../../services/api";

export default function ForumTab({ courseId }) {
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState("");

    useEffect(() => {
        api.get(`/courses/${courseId}/posts`)
            .then(res => setPosts(res.data));
    }, [courseId]);

    const handlePost = async () => {
        if (!content.trim()) return;

        await api.post(`/courses/${courseId}/posts`, { content });
        setContent("");

        const res = await api.get(`/courses/${courseId}/posts`);
        setPosts(res.data);
    };

    return (
        <div>
            <h3>Diễn đàn</h3>

            {/* INPUT */}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Viết câu hỏi..."
            />
            <button onClick={handlePost}>Đăng</button>

            {/* LIST */}
            {posts.map(p => (
                <div key={p.id}>
                    <b>{p.user_name}</b>: {p.content}
                </div>
            ))}
        </div>
    );
}