export default function BadgeIcon({ icon, count, onClick }) {
    return (
        <div style={{ position: "relative", display: "inline-block", cursor: "pointer" }} onClick={onClick}>
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