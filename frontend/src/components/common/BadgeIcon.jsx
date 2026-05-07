import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"

export default function BadgeIcon({ icon, count, onClick, user }) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (!user) {
            navigate("/login");
            toast.info("Bạn cần đăng nhập trước")
            return;
        }
        onClick?.()
    }

    return (
        <div style={{ position: "relative", display: "inline-block", cursor: "pointer" }} onClick={handleClick}>
            <img src={icon} alt="" style={{ width: 24, height: 24, filter: "invert(1)" }}/>
            {count >= 0 && (
                <span
                    style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        background: "red",
                        color: "white",
                        borderRadius: "50%",
                        padding: "2px 6px",
                        fontSize: "12px",
                        lineHeight: 1
                    }}
                >
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </div>
    );
}