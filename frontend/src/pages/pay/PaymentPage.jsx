import { useState, useEffect } from "react";

const BASE_URL = "https://arena-italics-shrug.ngrok-free.dev";

export default function PaymentPage() {
  const [step, setStep] = useState("form"); // form | loading | qr | success | error
  const [token, setToken] = useState("");
  const [courseId, setCourseId] = useState("1");
  const [payData, setPayData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(300); // 5 phút

  useEffect(() => {
    let timer;
    if (step === "qr" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handlePay = async () => {
    if (!token) return setErrorMsg("Cần nhập JWT token");
    setStep("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`${BASE_URL}/api/payments/momo/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ course_id: parseInt(courseId) }),
      });
      const data = await res.json();
      if (data.payUrl) {
        setPayData(data);
        setCountdown(300);
        setStep("qr");
      } else {
        setErrorMsg(data.message || "Không tạo được link thanh toán");
        setStep("error");
      }
    } catch (e) {
      setErrorMsg("Không kết nối được backend: " + e.message);
      setStep("error");
    }
  };

  const handleConfirm = async () => {
    setStep("success");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.momoLogo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#A50064" />
              <text x="16" y="22" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">M</text>
            </svg>
            <span style={styles.headerTitle}>Thanh toán MoMo</span>
          </div>
          {step === "qr" && (
            <div style={{ ...styles.timer, color: countdown < 60 ? "#ef4444" : "#a50064" }}>
              ⏱ {fmt(countdown)}
            </div>
          )}
        </div>

        {/* STEP: FORM */}
        {step === "form" && (
          <div style={styles.body}>
            <p style={styles.label}>JWT Token</p>
            <input
              style={styles.input}
              type="text"
              placeholder="Paste access_token từ login..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p style={styles.label}>Course ID</p>
            <input
              style={{ ...styles.input, width: "80px" }}
              type="number"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            />
            <div style={styles.priceRow}>
              <span style={styles.priceLabel}>Tổng thanh toán</span>
              <span style={styles.price}>50.000 ₫</span>
            </div>
            <button style={styles.btnPrimary} onClick={handlePay}>
              <span>Thanh toán qua MoMo</span>
            </button>
            {errorMsg && <p style={styles.error}>{errorMsg}</p>}
          </div>
        )}

        {/* STEP: LOADING */}
        {step === "loading" && (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Đang tạo mã QR...</p>
          </div>
        )}

        {/* STEP: QR */}
        {step === "qr" && payData && (
          <div style={styles.body}>
            <p style={styles.qrDesc}>Mở app <strong>MoMo</strong> và quét mã QR bên dưới để thanh toán</p>
            <div style={styles.qrWrapper}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payData.payUrl)}`}
                alt="QR MoMo"
                style={styles.qrImg}
              />
              <div style={styles.qrCornerTL} />
              <div style={styles.qrCornerTR} />
              <div style={styles.qrCornerBL} />
              <div style={styles.qrCornerBR} />
            </div>
            <p style={styles.orText}>— hoặc —</p>
            <a href={payData.payUrl} target="_blank" rel="noreferrer" style={styles.linkBtn}>
              Mở trang thanh toán MoMo
            </a>
            <div style={styles.divider} />
            <p style={styles.confirmNote}>Đã chuyển khoản xong?</p>
            <button style={styles.btnConfirm} onClick={handleConfirm}>
              ✓ Tôi đã thanh toán
            </button>
            <button style={styles.btnCancel} onClick={() => setStep("form")}>
              Hủy
            </button>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {step === "success" && (
          <div style={styles.center}>
            <div style={styles.successCircle}>✓</div>
            <p style={styles.successTitle}>Thanh toán thành công!</p>
            <p style={styles.successSub}>Bạn đã được enroll vào khóa học</p>
            <button style={styles.btnPrimary} onClick={() => setStep("form")}>
              Quay lại
            </button>
          </div>
        )}

        {/* STEP: ERROR */}
        {step === "error" && (
          <div style={styles.center}>
            <div style={styles.errorCircle}>✕</div>
            <p style={styles.successTitle}>Có lỗi xảy ra</p>
            <p style={styles.errorDetail}>{errorMsg}</p>
            <button style={styles.btnPrimary} onClick={() => setStep("form")}>
              Thử lại
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
    width: "100%",
    maxWidth: "420px",
    overflow: "hidden",
    animation: "fadeIn 0.3s ease",
  },
  header: {
    background: "#a50064",
    padding: "18px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  momoLogo: { display: "flex", alignItems: "center", gap: "10px" },
  headerTitle: { color: "#fff", fontWeight: "600", fontSize: "16px" },
  timer: { fontWeight: "700", fontSize: "15px", background: "#fff", borderRadius: "8px", padding: "4px 10px" },
  body: { padding: "24px", animation: "fadeIn 0.3s ease" },
  label: { fontSize: "13px", color: "#666", marginBottom: "6px", marginTop: "14px" },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border 0.2s",
  },
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff5fb",
    borderRadius: "10px",
    padding: "14px 16px",
    marginTop: "20px",
    marginBottom: "8px",
    border: "1px solid #f0c0df",
  },
  priceLabel: { fontSize: "14px", color: "#555" },
  price: { fontSize: "20px", fontWeight: "700", color: "#a50064" },
  btnPrimary: {
    width: "100%",
    padding: "13px",
    background: "#a50064",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "12px",
    transition: "background 0.2s",
  },
  btnConfirm: {
    width: "100%",
    padding: "12px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
  },
  btnCancel: {
    width: "100%",
    padding: "11px",
    background: "transparent",
    color: "#888",
    border: "1.5px solid #e0e0e0",
    borderRadius: "10px",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "8px",
  },
  error: { color: "#dc2626", fontSize: "13px", marginTop: "10px", textAlign: "center" },
  center: { padding: "36px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  spinner: {
    width: "44px", height: "44px",
    border: "4px solid #f0c0df",
    borderTop: "4px solid #a50064",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { color: "#666", fontSize: "14px" },
  qrDesc: { fontSize: "14px", color: "#444", textAlign: "center", marginBottom: "20px" },
  qrWrapper: {
    position: "relative",
    width: "220px",
    margin: "0 auto",
    padding: "10px",
    background: "#fff",
    borderRadius: "12px",
    border: "2px solid #f0e0ea",
  },
  qrImg: { width: "200px", height: "200px", display: "block" },
  qrCornerTL: { position: "absolute", top: 4, left: 4, width: 20, height: 20, borderTop: "3px solid #a50064", borderLeft: "3px solid #a50064", borderRadius: "3px 0 0 0" },
  qrCornerTR: { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderTop: "3px solid #a50064", borderRight: "3px solid #a50064", borderRadius: "0 3px 0 0" },
  qrCornerBL: { position: "absolute", bottom: 4, left: 4, width: 20, height: 20, borderBottom: "3px solid #a50064", borderLeft: "3px solid #a50064", borderRadius: "0 0 0 3px" },
  qrCornerBR: { position: "absolute", bottom: 4, right: 4, width: 20, height: 20, borderBottom: "3px solid #a50064", borderRight: "3px solid #a50064", borderRadius: "0 0 3px 0" },
  orText: { textAlign: "center", color: "#aaa", fontSize: "13px", margin: "14px 0 10px" },
  linkBtn: {
    display: "block",
    textAlign: "center",
    padding: "10px",
    border: "1.5px solid #a50064",
    color: "#a50064",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
  },
  divider: { height: "1px", background: "#f0f0f0", margin: "18px 0 14px" },
  confirmNote: { fontSize: "13px", color: "#666", textAlign: "center", margin: 0 },
  successCircle: {
    width: "64px", height: "64px", borderRadius: "50%",
    background: "#dcfce7", color: "#16a34a",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "28px", fontWeight: "700",
  },
  errorCircle: {
    width: "64px", height: "64px", borderRadius: "50%",
    background: "#fee2e2", color: "#dc2626",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "28px", fontWeight: "700",
  },
  successTitle: { fontSize: "18px", fontWeight: "600", color: "#111", margin: 0 },
  successSub: { fontSize: "14px", color: "#666", margin: 0 },
  errorDetail: { fontSize: "13px", color: "#dc2626", textAlign: "center", maxWidth: "280px" },
};