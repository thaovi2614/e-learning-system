
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const API_BASE_URL = "http://localhost:5000";

export default function CourseContentPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activeTab, setActiveTab] = useState("SLIDE");
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);

  const [chapterForm, setChapterForm] = useState({
    title: "",
    order_index: "",
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    type: "SLIDE",
    order_index: "",
    videoUrl: "",
    slideFile: "",
    quizFile: "",
    file: null,
  });

  const [showChapterForm, setShowChapterForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);

  const loadCourse = async () => {
    try {
      const res = await api.get(`/courses/${courseId}`);
      setCourse(res.data);
    } catch (error) {
      alert("Không tải được khóa học");
    }
  };

  const loadChapters = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/chapters`);
      const data = Array.isArray(res.data) ? res.data : [];
      setChapters(data);

      if (data.length > 0) {
        setSelectedChapter(data[0]);
        loadLessons(data[0].id);
      }
    } catch (error) {
      alert("Không tải được chương");
    }
  };

  const loadLessons = async (chapterId) => {
    try {
      const res = await api.get(`/chapters/${chapterId}/lessons`);
      setLessons(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      alert("Không tải được nội dung bài học");
    }
  };

  useEffect(() => {
    if (courseId) {
      loadCourse();
      loadChapters();
    }
  }, [courseId]);

  const chooseChapter = (chapter) => {
    setSelectedChapter(chapter);
    setSelectedLessonId(null);
    setShowLessonForm(false);
    setEditingLessonId(null);
    loadLessons(chapter.id);
  };

  const addChapter = async () => {
    try {
      if (!chapterForm.title.trim()) {
        alert("Tên chương không được để trống");
        return;
      }

      await api.post(`/courses/${courseId}/chapters`, {
        title: chapterForm.title,
        order_index: Number(chapterForm.order_index || 1),
      });

      alert("Thêm chương thành công");
      setChapterForm({ title: "", order_index: "" });
      setShowChapterForm(false);
      loadChapters();
    } catch (error) {
      alert(error.response?.data?.message || "Không thêm được chương");
    }
  };

  const deleteChapter = async (id) => {
    if (!window.confirm("Xác nhận xoá chương này?")) return;

    try {
      await api.delete(`/chapters/${id}`);
      setSelectedChapter(null);
      setSelectedLessonId(null);
      setLessons([]);
      loadChapters();
    } catch (error) {
      alert(error.response?.data?.message || "Xóa chương thất bại");
    }
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: "",
      type: activeTab,
      order_index: "",
      videoUrl: "",
      slideFile: "",
      quizFile: "",
      file: null,
    });
    setEditingLessonId(null);
    setShowLessonForm(false);
  };

  const openCreateLessonForm = () => {
    setLessonForm({
      title: "",
      type: activeTab,
      order_index: "",
      videoUrl: "",
      slideFile: "",
      quizFile: "",
      file: null,
    });
    setEditingLessonId(null);
    setShowLessonForm(true);
  };

  const addLesson = async () => {
    try {
      if (!selectedChapter) {
        alert("Chọn chương trước khi thêm nội dung");
        return;
      }

      if (!lessonForm.title.trim()) {
        alert("Tên nội dung không được để trống");
        return;
      }

      const formData = new FormData();
      formData.append("title", lessonForm.title);
      formData.append("type", activeTab);
      formData.append("order_index", lessonForm.order_index || 1);

      if (activeTab === "VIDEO") {
        formData.append("videoUrl", lessonForm.videoUrl || "");
      }

      if (activeTab === "SLIDE") {
        formData.append("slideFile", lessonForm.slideFile || "");
      }

      if (activeTab === "QUIZ") {
        formData.append("quizFile", lessonForm.quizFile || "");
      }

      if (lessonForm.file) {
        formData.append("file", lessonForm.file);
      }

      if (editingLessonId) {
        await api.put(`/lessons/${editingLessonId}`, formData);
        alert("Cập nhật nội dung thành công");
      } else {
        await api.post(`/chapters/${selectedChapter.id}/lessons`, formData);
        alert("Thêm nội dung thành công");
      }

      resetLessonForm();
      loadLessons(selectedChapter.id);
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const deleteLesson = async (id) => {
    if (!window.confirm("Xác nhận xoá nội dung này?")) return;

    try {
      await api.delete(`/lessons/${id}`);
      setSelectedLessonId(null);
      loadLessons(selectedChapter.id);
    } catch (error) {
      alert(error.response?.data?.message || "Xóa nội dung thất bại");
    }
  };

  const startEditLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setShowLessonForm(true);

    setLessonForm({
      title: lesson.title || "",
      type: lesson.type || activeTab,
      order_index: lesson.order_index || "",
      videoUrl: lesson.videoUrl || "",
      slideFile: lesson.slideFile || "",
      quizFile: lesson.quizFile || "",
      file: null,
    });
  };

  const getLessonSource = (lesson) => {
    if (lesson.type === "VIDEO") return lesson.videoUrl || "";
    if (lesson.type === "SLIDE") return lesson.slideFile || "";
    if (lesson.type === "QUIZ") return lesson.quizFile || "";
    return "";
  };

  const buildLessonUrl = (lesson) => {
    const source = getLessonSource(lesson);
    if (!source) return "";

    if (source.startsWith("http://") || source.startsWith("https://")) {
      return source;
    }

    return `${API_BASE_URL}/${source}`;
  };

  const openLesson = (lesson) => {
    setSelectedLessonId(lesson.id);

    const url = buildLessonUrl(lesson);

    if (!url) {
      alert("Nội dung này chưa có link hoặc file");
      return;
    }

    window.open(url, "_blank");
  };

  const getFileType = (lesson) => {
    const source = getLessonSource(lesson);

    if (!source) return lesson.type;

    if (source.startsWith("http://") || source.startsWith("https://")) {
      if (lesson.type === "VIDEO") return "LINK VIDEO";
      if (lesson.type === "QUIZ") return "LINK BÀI TẬP";
      return "LINK";
    }

    const cleanSource = source.split("?")[0];
    const ext = cleanSource.split(".").pop()?.toUpperCase();

    return ext || lesson.type;
  };

  const getSourceLabel = (lesson) => {
    const source = getLessonSource(lesson);

    if (!source) return "Không có";

    if (source.startsWith("http://") || source.startsWith("https://")) {
      return "Link ngoài";
    }

    return `File ${getFileType(lesson)}`;
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSelectedLessonId(null);
    setEditingLessonId(null);
    setShowLessonForm(false);

    setLessonForm({
      title: "",
      type: tab,
      order_index: "",
      videoUrl: "",
      slideFile: "",
      quizFile: "",
      file: null,
    });
  };

  const filteredLessons = lessons.filter((lesson) => lesson.type === activeTab);

  return (
    <div style={page}>
      <div style={container}>
        <div style={topBar}>
          <h1 style={title}>Quản lý nội dung bài học</h1>

          <button style={lightBtn} onClick={() => navigate("/manage-course")}>
            ← Quay lại khóa học
          </button>
        </div>

        <div style={courseCard}>
          <img
            src={course?.thumbnail || "https://placehold.co/80x80"}
            alt=""
            style={courseImg}
          />

          <div>
            <h2 style={courseName}>{course?.name || "Khóa học"}</h2>
            <p style={subTitle}>{course?.subtitle || "Chưa có mô tả"}</p>
          </div>
        </div>

        <div style={layout}>
          <div style={leftPanel}>
            <div style={panelHead}>
              <h3>Danh sách chương</h3>

              <button
                style={smallPrimaryBtn}
                onClick={() => setShowChapterForm(true)}
              >
                + Thêm chương
              </button>
            </div>

            {showChapterForm && (
              <div style={miniForm}>
                <input
                  style={input}
                  placeholder="Tên chương"
                  value={chapterForm.title}
                  onChange={(e) =>
                    setChapterForm({ ...chapterForm, title: e.target.value })
                  }
                />

                <input
                  style={input}
                  type="number"
                  placeholder="Thứ tự"
                  value={chapterForm.order_index}
                  onChange={(e) =>
                    setChapterForm({
                      ...chapterForm,
                      order_index: e.target.value,
                    })
                  }
                />

                <button style={smallPrimaryBtn} onClick={addChapter}>
                  Lưu
                </button>

                <button
                  style={smallLightBtn}
                  onClick={() => setShowChapterForm(false)}
                >
                  Hủy
                </button>
              </div>
            )}

            {chapters.length === 0 && (
              <p style={emptyText}>Chưa có chương nào.</p>
            )}

            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                style={
                  selectedChapter?.id === chapter.id
                    ? activeChapterItem
                    : chapterItem
                }
                onClick={() => chooseChapter(chapter)}
              >
                <span>
                  Chương {chapter.order_index}: {chapter.title}
                </span>

                <button
                  style={iconDeleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChapter(chapter.id);
                  }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>

          <div style={rightPanel}>
            <div style={panelHead}>
              <h3>
                Nội dung:{" "}
                {selectedChapter
                  ? `Chương ${selectedChapter.order_index} - ${selectedChapter.title}`
                  : "Chưa chọn chương"}
              </h3>
            </div>

            <div style={tabs}>
              <button
                style={activeTab === "SLIDE" ? activeTabBtn : tabBtn}
                onClick={() => changeTab("SLIDE")}
              >
                Slide
              </button>

              <button
                style={activeTab === "VIDEO" ? activeTabBtn : tabBtn}
                onClick={() => changeTab("VIDEO")}
              >
                Video
              </button>

              <button
                style={activeTab === "QUIZ" ? activeTabBtn : tabBtn}
                onClick={() => changeTab("QUIZ")}
              >
                Bài tập
              </button>
            </div>

            <div style={lessonActions}>
              <button style={smallPrimaryBtn} onClick={openCreateLessonForm}>
                + Thêm{" "}
                {activeTab === "SLIDE"
                  ? "slide"
                  : activeTab === "VIDEO"
                  ? "video"
                  : "bài tập"}
              </button>
            </div>

            {showLessonForm && (
              <div style={lessonFormBox}>
                <input
                  style={input}
                  placeholder="Tên nội dung"
                  value={lessonForm.title}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, title: e.target.value })
                  }
                />

                <input
                  style={input}
                  type="number"
                  placeholder="Thứ tự"
                  value={lessonForm.order_index}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      order_index: e.target.value,
                    })
                  }
                />

                {activeTab === "VIDEO" && (
                  <input
                    style={input}
                    placeholder="Link video hoặc upload file"
                    value={lessonForm.videoUrl}
                    onChange={(e) =>
                      setLessonForm({
                        ...lessonForm,
                        videoUrl: e.target.value,
                      })
                    }
                  />
                )}

                {activeTab === "SLIDE" && (
                  <input
                    style={input}
                    placeholder="Link slide hoặc upload file"
                    value={lessonForm.slideFile}
                    onChange={(e) =>
                      setLessonForm({
                        ...lessonForm,
                        slideFile: e.target.value,
                      })
                    }
                  />
                )}

                {activeTab === "QUIZ" && (
                  <input
                    style={input}
                    placeholder="Link bài tập hoặc upload file"
                    value={lessonForm.quizFile}
                    onChange={(e) =>
                      setLessonForm({
                        ...lessonForm,
                        quizFile: e.target.value,
                      })
                    }
                  />
                )}

                <input
                  style={input}
                  type="file"
                  accept={
                    activeTab === "VIDEO"
                      ? "video/*"
                      : ".pdf,.ppt,.pptx,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  }
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      file: e.target.files[0],
                    })
                  }
                />

                <button style={smallPrimaryBtn} onClick={addLesson}>
                  {editingLessonId ? "Cập nhật nội dung" : "Lưu nội dung"}
                </button>

                <button style={smallLightBtn} onClick={resetLessonForm}>
                  Hủy
                </button>
              </div>
            )}

            <div style={tableWrap}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>#</th>
                    <th style={th}>Tên nội dung</th>
                    <th style={th}>Loại</th>
                    <th style={th}>Nguồn</th>
                    <th style={th}>Thứ tự</th>
                    <th style={th}>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLessons.length === 0 && (
                    <tr>
                      <td style={emptyTd} colSpan="6">
                        Chưa có nội dung nào.
                      </td>
                    </tr>
                  )}

                  {filteredLessons.map((lesson, index) => (
                    <tr
                      key={lesson.id}
                      style={
                        selectedLessonId === lesson.id ? selectedLessonRow : {}
                      }
                    >
                      <td style={td}>{index + 1}</td>

                      <td style={td}>
                        <span
                          style={
                            selectedLessonId === lesson.id
                              ? selectedLessonTitle
                              : clickableLessonTitle
                          }
                          onClick={() => openLesson(lesson)}
                          title="Bấm để mở nội dung"
                        >
                          {lesson.title}
                        </span>
                      </td>

                      <td style={td}>
                        <span style={badge}>{getFileType(lesson)}</span>
                      </td>

                      <td style={td}>
                        {getLessonSource(lesson) ? (
                          <span
                            style={fileLinkText}
                            onClick={() => openLesson(lesson)}
                          >
                            {getSourceLabel(lesson)}
                          </span>
                        ) : (
                          "Không có"
                        )}
                      </td>

                      <td style={td}>{lesson.order_index}</td>

                      <td style={td}>
                        <button
                          style={editBtn}
                          onClick={() => startEditLesson(lesson)}
                        >
                          Sửa
                        </button>

                        <button
                          style={deleteBtn}
                          onClick={() => deleteLesson(lesson.id)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const page = {
  background: "#f6f8fc",
  minHeight: "100vh",
  padding: "28px 0",
  fontFamily: "Arial, sans-serif",
};

const container = {
  width: "1180px",
  maxWidth: "92%",
  margin: "0 auto",
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
};

const title = {
  margin: 0,
  color: "#0f172a",
  fontSize: 30,
};

const subTitle = {
  margin: "6px 0 0",
  color: "#64748b",
};

const courseCard = {
  background: "#fff",
  borderRadius: 16,
  padding: 18,
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 18,
  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
};

const courseImg = {
  width: 58,
  height: 58,
  borderRadius: 12,
  objectFit: "cover",
};

const courseName = {
  margin: 0,
  fontSize: 20,
};

const layout = {
  display: "grid",
  gridTemplateColumns: "340px 1fr",
  gap: 18,
};

const leftPanel = {
  background: "#fff",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
};

const rightPanel = {
  background: "#fff",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
};

const panelHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
};

const chapterItem = {
  padding: "14px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  marginBottom: 10,
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const activeChapterItem = {
  ...chapterItem,
  border: "1px solid #2563eb",
  background: "#eff6ff",
  color: "#1d4ed8",
};

const tabs = {
  display: "flex",
  gap: 22,
  borderBottom: "1px solid #e2e8f0",
  marginBottom: 14,
};

const tabBtn = {
  border: "none",
  background: "transparent",
  padding: "12px 0",
  cursor: "pointer",
  color: "#475569",
  fontWeight: 700,
};

const activeTabBtn = {
  ...tabBtn,
  color: "#2563eb",
  borderBottom: "3px solid #2563eb",
};

const lessonActions = {
  marginBottom: 14,
};

const tableWrap = {
  border: "1px solid #edf2f7",
  borderRadius: 14,
  overflow: "hidden",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  background: "#f8fafc",
  padding: 14,
  textAlign: "left",
  color: "#475569",
  fontSize: 13,
};

const td = {
  padding: 14,
  borderTop: "1px solid #edf2f7",
};

const emptyTd = {
  padding: 28,
  textAlign: "center",
  color: "#64748b",
};

const emptyText = {
  color: "#64748b",
};

const badge = {
  background: "#dbeafe",
  color: "#2563eb",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  marginBottom: 10,
  borderRadius: 10,
  border: "1px solid #dbe1ea",
};

const miniForm = {
  border: "1px dashed #cbd5e1",
  padding: 12,
  borderRadius: 12,
  marginBottom: 12,
};

const lessonFormBox = {
  border: "1px dashed #cbd5e1",
  padding: 14,
  borderRadius: 12,
  marginBottom: 14,
};

const smallPrimaryBtn = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700,
  marginRight: 8,
};

const smallLightBtn = {
  background: "#f1f5f9",
  color: "#334155",
  border: "1px solid #dbe1ea",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
};

const lightBtn = {
  background: "#fff",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
  borderRadius: 10,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 700,
};

const iconDeleteBtn = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

const editBtn = {
  background: "#eff6ff",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
  marginRight: 8,
};

const deleteBtn = {
  background: "#fff1f2",
  color: "#e11d48",
  border: "1px solid #fecdd3",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
};

const clickableLessonTitle = {
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 700,
};

const selectedLessonTitle = {
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: 800,
  textDecoration: "underline",
};

const selectedLessonRow = {
  background: "#eff6ff",
};

const fileLinkText = {
  color: "#2563eb",
  cursor: "pointer",
  textDecoration: "underline",
  fontWeight: 700,
};