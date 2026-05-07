import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getCertificateByCourse } from "../../services/certificateApi";
import "./certificate.css";

export default function CertificatePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const certRef = useRef(null);

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCertificateByCourse(courseId)
      .then((res) => setCertificate(res.data))
      .catch(() => setCertificate(null))
      .finally(() => setLoading(false));
  }, [courseId]);

  const downloadPDF = async () => {
    const canvas = await html2canvas(certRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#fffaf0",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "mm", "a4");

    pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
    pdf.save(`certificate-${certificate.certificate_code}.pdf`);
  };

  if (loading) {
    return <div className="cert-loading">Đang tải chứng nhận...</div>;
  }

  if (!certificate) {
    return (
      <div className="cert-empty">
        <h2>Chưa có chứng nhận</h2>
        <p>Bạn cần hoàn thành 100% khóa học để nhận chứng nhận.</p>
        <button onClick={() => navigate(`/learn/${courseId}`)}>
          Quay lại khóa học
        </button>
      </div>
    );
  }

  return (
    <div className="cert-page">
      <div className="cert-actions">
        <button onClick={() => navigate(`/learn/${courseId}`)}>
          ← Quay lại khóa học
        </button>

        <button className="download-btn" onClick={downloadPDF}>
          Tải chứng nhận PDF
        </button>
      </div>

      <div className="certificate-card" ref={certRef}>
        <div className="cert-inner">
          <div className="corner corner-left-top">❦</div>
          <div className="corner corner-right-top">❦</div>
          <div className="corner corner-left-bottom">❦</div>
          <div className="corner corner-right-bottom">❦</div>

          <div className="side-ribbon left-ribbon"></div>
          <div className="side-ribbon right-ribbon"></div>

          <div className="cert-emblem">
            <div className="emblem-circle">🎓</div>
          </div>

          <h1 className="cert-title">CERTIFICATE</h1>
          <p className="cert-subtitle">OF COMPLETION</p>

          <div className="gold-line">
            <span></span>
            <b>CHỨNG NHẬN HOÀN THÀNH KHÓA HỌC</b>
            <span></span>
          </div>

          <p className="cert-text">Chứng nhận rằng</p>

          <div className="student-name">
            {certificate.user_name}
          </div>

          <p className="cert-text">đã hoàn thành khóa học</p>

          <h2 className="course-name">{certificate.course_name}</h2>

          <div className="cert-meta">
            <div className="meta-item">
              <div className="meta-icon">🏅</div>
              <div>
                <p>Mã chứng nhận</p>
                <strong>{certificate.certificate_code}</strong>
              </div>
            </div>

            <div className="meta-divider"></div>

            <div className="meta-item">
              <div className="meta-icon">📅</div>
              <div>
                <p>Ngày cấp</p>
                <strong>
                  {new Date(certificate.issued_at).toLocaleDateString("vi-VN")}
                </strong>
              </div>
            </div>
          </div>

          <div className="cert-bottom">
            <div className="signature">
              <span>Elearning Platform</span>
              <div></div>
              <p>Đơn vị cấp chứng nhận</p>
            </div>

            <div className="seal">
              <div className="seal-inner">★</div>
            </div>

            <div className="signature">
              <span>Verified</span>
              <div></div>
              <p>Online Certificate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}