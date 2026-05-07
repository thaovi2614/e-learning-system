import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourseById } from "../../services/courseApi";
import { createChapter, removeChapter } from "../../services/chapterApi";
import { createLesson, updateLesson, deleteLesson as deleteLessonApi } from "../../services/lessonApi";
import ForumTab from "../learnCourse/ForumTab";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

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

  // Thêm state để quản lý tab chính (Nội dung vs Diễn đàn)
  const [mainTab, setMainTab] = useState("CONTENT"); 

  const [chapterForm, setChapterForm] = useState({
    title: "",
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    type: "SLIDE",
    timeLimit: 0,
    passScore: 0,
    url: "",
    file: null,
  });

  const [showChapterForm, setShowChapterForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);

  const loadCourse = async () => {
    try {
      const res = await getCourseById(courseId);
      const data = res.data;

      setCourse(data);

      const chapters = data.chapters || [];
      setChapters(chapters);

      if (chapters.length > 0) {
        setSelectedChapter(chapters[0]);
        setLessons(chapters[0].lessons || []);
      }

    } catch (error) {
      toast.error("Không tải được khóa học");
    }
  };

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const chooseChapter = (chapter) => {
    setSelectedChapter(chapter);
    setSelectedLessonId(null);
    setShowLessonForm(false);
    setEditingLessonId(null);
    setLessons(chapter.lessons || []);
  };

  const addChapter = async () => {
    try {
      if (!chapterForm.title.trim()) {
        toast.warning("Tên chương không được để trống");
        return;
      }

      const res = await createChapter(courseId, chapterForm);
      const newChapter = res.data.data;

      setChapters(prev => {
        const updated = [...prev, newChapter];
        return updated.sort((a, b) => a.order_index - b.order_index);
      });

      toast.success("Thêm chương thành công");

      setChapterForm({ title: "" });
      setShowChapterForm(false);

    } catch (error) {
      toast.error(error.response?.data?.message || "Không thêm được chương");
    }
  };

  const deleteChapter = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa chương này?",
      text: "Hành động này không thể hoàn tác",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#e11d48",
    })

    if (!result.isConfirmed) return;

    try {
      await removeChapter(courseId, id);

      setChapters(prev => {
        const deleted = prev.find(c => c.id === id);
        if (!deleted) return prev;

        return prev
          .filter(c => c.id !== id)
          .map(c =>
            c.order_index > deleted.order_index
              ? { ...c, order_index: c.order_index - 1 }
              : c
          )
          .sort((a, b) => a.order_index - b.order_index);
      });

      if (selectedChapter?.id === id) {
        setSelectedChapter(null);
        setLessons([]);
      }

      toast.success("Đã xoá chương");

    } catch (error) {
      toast.error(error.response?.data?.message || "Xóa chương thất bại");
    }
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: "",
      type: activeTab,
      url: "",
      file: null,
    });
    setEditingLessonId(null);
    setShowLessonForm(false);
  };

  const openCreateLessonForm = () => {
    setLessonForm({
      title: "",
      type: activeTab,
      url: "",
      file: null,
    });
    setEditingLessonId(null);
    setShowLessonForm(true);
  };

  const addLesson = async () => {
    try {
      if (!selectedChapter) {
        toast.warning("Chọn chương trước khi thêm nội dung");
        return;
      }

      if (!lessonForm.title.trim()) {
        toast.warning("Tên nội dung không được để trống");
        return;
      }

      if (activeTab === "QUIZ") {
        if (!lessonForm.timeLimit || lessonForm.timeLimit <= 0) {
          toast.warning("Thời gian thi phải lớn hơn 0");
          return;
        }

        if (!lessonForm.passScore || lessonForm.passScore < 0 || lessonForm.passScore > 10) {
          toast.warning("Điểm pass không hợp lệ");
          return;
        }
      }

      const formData = new FormData();
      formData.append("title", lessonForm.title);
      formData.append("type", activeTab);

      if (lessonForm.file) {
        formData.append("file", lessonForm.file);
      }

      if (activeTab === "QUIZ") {
        formData.append("timeLimit", lessonForm.timeLimit);
        formData.append("passScore", lessonForm.passScore);
      }

      if (editingLessonId) {
        const res = await updateLesson(editingLessonId, formData);
        const updatedLesson = res.data.data;

        setLessons(prev => {
          const updated = prev.map(l =>
            l.id === editingLessonId ? updatedLesson : l
          );

          return updated.sort((a, b) => a.order_index - b.order_index);
        });

        toast.success("Cập nhật nội dung thành công");
      } else {
        const res = await createLesson(selectedChapter.id, formData);
        const newLesson = res.data.data;

        setLessons(prev => {
          const updated = [...prev, newLesson];
          return updated.sort((a, b) => a.order_index - b.order_index);
        });

        toast.success("Thêm nội dung thành công");
      }

      resetLessonForm();

    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const deleteLesson = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xoá nội dung này?",
      text: "Hành động này không thể hoàn tác",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#e11d48",
    })

    if (!result.isConfirmed) return;

    try {
      await deleteLessonApi(id);

      setLessons(prev => {
        const deleted = prev.find(l => l.id === id);
        if (!deleted) return prev;

        const updated = prev
          .filter(l => l.id !== id)
          .map(l => {
            if (l.order_index > deleted.order_index) {
              return { ...l, order_index: l.order_index - 1 };
            }
            return l;
          });

        return updated.sort((a, b) => a.order_index - b.order_index);
      });

      setSelectedLessonId(null);

      toast.success("Đã xoá nội dung");

    } catch (error) {
      toast.error(error.response?.data?.message || "Xóa nội dung thất bại");
    }
  };

  const startEditLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setShowLessonForm(true);

    setLessonForm({
      title: lesson.title || "",
      type: lesson.type || activeTab,
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

    return source;
  };

  const openLesson = (lesson) => {
    setSelectedLessonId(lesson.id);

    const url = buildLessonUrl(lesson);

    if (!url) {
      toast.info("Nội dung này chưa có link hoặc file");
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

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSelectedLessonId(null);
    setEditingLessonId(null);
    setShowLessonForm(false);

    setLessonForm({
      title: "",
      type: tab,
      url: "",
      file: null,
    });
  };

  const filteredLessons = lessons.filter((lesson) => lesson.type === activeTab);

  return (
    <div style={page}>
      <div style={container}>
        <div style={topBar}>
          <h1 style={title}>Quản lý khóa học</h1>

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

        {/* Thanh Tab chính để chuyển đổi giữa Bài học và Diễn đàn[cite: 9] */}
        <div style={mainTabsContainer}>
            <button 
                style={mainTab === "CONTENT" ? activeMainTabBtn : mainTabBtn} 
                onClick={() => setMainTab("CONTENT")}
            >
                Nội dung bài học
            </button>
            <button 
                style={mainTab === "FORUM" ? activeMainTabBtn : mainTabBtn} 
                onClick={() => setMainTab("FORUM")}
            >
                Diễn đàn thảo luận
            </button>
        </div>

        <div style={{ marginTop: '20px' }}>
            {mainTab === "FORUM" ? (
                <div style={forumWrapper}>
                    <ForumTab courseId={courseId} /> {/* Render ForumTab y nguyên logic cũ[cite: 11] */}
                </div>
            ) : (
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
                                <button style={smallPrimaryBtn} onClick={addChapter}>Lưu</button>
                                <button
                                style={smallLightBtn}
                                onClick={() => {setShowChapterForm(false); setChapterForm({ title: "" });}}
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
                                style={selectedChapter?.id === chapter.id ? activeChapterItem : chapterItem}
                                onClick={() => chooseChapter(chapter)}
                            >
                                <span>Chương {chapter.order_index}: {chapter.title}</span>
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
                                Nội dung: {selectedChapter ? `Chương ${selectedChapter.order_index} - ${selectedChapter.title}` : "Chưa chọn chương"}
                            </h3>
                        </div>

                        <div style={tabs}>
                            <button style={activeTab === "SLIDE" ? activeTabBtn : tabBtn} onClick={() => changeTab("SLIDE")}>Slide</button>
                            <button style={activeTab === "VIDEO" ? activeTabBtn : tabBtn} onClick={() => changeTab("VIDEO")}>Video</button>
                            <button style={activeTab === "QUIZ" ? activeTabBtn : tabBtn} onClick={() => changeTab("QUIZ")}>Bài tập</button>
                        </div>

                        <div style={lessonActions}>
                            <button style={smallPrimaryBtn} onClick={openCreateLessonForm}>
                                + Thêm {activeTab === "SLIDE" ? "slide" : activeTab === "VIDEO" ? "video" : "bài tập"}
                            </button>
                        </div>

                        {showLessonForm && (
                            <div style={lessonFormBox}>
                                <input
                                    style={input}
                                    placeholder="Tên nội dung"
                                    value={lessonForm.title}
                                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                />
                                {activeTab==="QUIZ" && (
                                  <div>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                      <input
                                        style={{ ...input, flex: 1 }}
                                        type="number"
                                        placeholder="Thời gian thi (phút)"
                                        value={lessonForm.timeLimit || ""}
                                        onChange={(e) =>
                                          setLessonForm({
                                            ...lessonForm,
                                            timeLimit: e.target.value,
                                          })
                                        }
                                      />

                                      <input
                                        style={{ ...input, flex: 1 }}
                                        type="number"
                                        step="0.1"
                                        placeholder="Điểm pass"
                                        value={lessonForm.passScore || ""}
                                        onChange={(e) =>
                                          setLessonForm({
                                            ...lessonForm,
                                            passScore: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                )}
                                <input
                                    style={input}
                                    type="file"
                                    accept={activeTab === "VIDEO" ? "video/*": ( activeTab === "SLIDE" ? ".pdf" : ".csv")}
                                    onChange={(e) => setLessonForm({ ...lessonForm, file: e.target.files[0] })}
                                />
                                <button style={smallPrimaryBtn} onClick={addLesson}>
                                    {editingLessonId ? "Cập nhật nội dung" : "Lưu nội dung"}
                                </button>
                                <button style={smallLightBtn} onClick={resetLessonForm}>Hủy</button>
                            </div>
                        )}

                        <div style={tableWrap}>
                            <table style={table}>
                                <thead>
                                <tr>
                                    <th style={th}>#</th>
                                    <th style={th}>Tên nội dung</th>
                                    <th style={th}>Loại</th>
                                    {activeTab==="QUIZ" && (
                                      <>
                                        <th style={th}>Thời gian</th>
                                        <th style={th}>Điểm đạt</th>
                                      </>
                                    )}
                                    <th style={th}>Thứ tự</th>
                                    <th style={th}>Thao tác</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredLessons.length === 0 && (
                                    <tr><td style={emptyTd} colSpan="6">Chưa có nội dung nào.</td></tr>
                                )}
                                {filteredLessons.map((lesson, index) => (
                                    <tr key={lesson.id} style={selectedLessonId === lesson.id ? selectedLessonRow : {}}>
                                    <td style={td}>{index + 1}</td>
                                    <td style={td}>
                                        <span
                                        style={selectedLessonId === lesson.id ? selectedLessonTitle : clickableLessonTitle}
                                        onClick={() => openLesson(lesson)}
                                        >
                                        {lesson.title}
                                        </span>
                                    </td>
                                    <td style={td}><span style={badge}>{getFileType(lesson)}</span></td>
                                    {activeTab === "QUIZ" && (
                                      <>
                                        <td style={td}>
                                          <span>{lesson.quiz.timeLimit}</span>
                                        </td>
                                        <td style={td}>
                                          <span>{lesson.quiz.passScore}</span>
                                        </td>
                                      </>
                                    )}
                                    <td style={td}>{lesson.order_index}</td>
                                    <td style={td}>
                                        {activeTab !== "QUIZ" && (
                                          <button style={editBtn} onClick={() => startEditLesson(lesson)}>Sửa</button>
                                        )}
                                        <button style={deleteBtn} onClick={() => deleteLesson(lesson.id)}>Xóa</button>
                                    </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

const page = { background: "#f6f8fc", minHeight: "100vh", padding: "28px 0", fontFamily: "Arial, sans-serif" };
const container = { width: "1180px", maxWidth: "92%", margin: "0 auto" };
const topBar = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 };
const title = { margin: 0, color: "#0f172a", fontSize: 30 };
const subTitle = { margin: "6px 0 0", color: "#64748b" };
const courseCard = { background: "#fff", borderRadius: 16, padding: 18, display: "flex", alignItems: "center", gap: 14, marginBottom: 18, boxShadow: "0 8px 24px rgba(0,0,0,0.05)" };
const courseImg = { width: 58, height: 58, borderRadius: 12, objectFit: "cover" };
const courseName = { margin: 0, fontSize: 20 };
const layout = { display: "grid", gridTemplateColumns: "340px 1fr", gap: 18 };
const leftPanel = { background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(0,0,0,0.05)" };
const rightPanel = { background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 8px 24px rgba(0,0,0,0.05)" };
const panelHead = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 };
const chapterItem = { padding: "14px 12px", border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" };
const activeChapterItem = { ...chapterItem, border: "1px solid #2563eb", background: "#eff6ff", color: "#1d4ed8" };
const tabs = { display: "flex", gap: 22, borderBottom: "1px solid #e2e8f0", marginBottom: 14 };
const tabBtn = { borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "3px solid transparent", background: "transparent", padding: "12px 0", cursor: "pointer", color: "#475569", fontWeight: 700 };
const activeTabBtn = { ...tabBtn, color: "#2563eb", borderBottom: "3px solid #2563eb" };
const lessonActions = { marginBottom: 14 };
const tableWrap = { border: "1px solid #edf2f7", borderRadius: 14, overflow: "hidden" };
const table = { width: "100%", borderCollapse: "collapse" };
const th = { background: "#f8fafc", padding: 14, textAlign: "left", color: "#475569", fontSize: 13 };
const td = { padding: 14, borderTop: "1px solid #edf2f7" };
const emptyTd = { padding: 28, textAlign: "center", color: "#64748b" };
const emptyText = { color: "#64748b" };
const badge = { background: "#dbeafe", color: "#2563eb", padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 };
const input = { width: "100%", boxSizing: "border-box", padding: "11px 12px", marginBottom: 10, borderRadius: 10, border: "1px solid #dbe1ea" };
const miniForm = { border: "1px dashed #cbd5e1", padding: 12, borderRadius: 12, marginBottom: 12 };
const lessonFormBox = { border: "1px dashed #cbd5e1", padding: 14, borderRadius: 12, marginBottom: 14 };
const smallPrimaryBtn = { background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 700, marginRight: 8 };
const smallLightBtn = { background: "#f1f5f9", color: "#334155", border: "1px solid #dbe1ea", borderRadius: 8, padding: "8px 12px", cursor: "pointer" };
const lightBtn = { background: "#fff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontWeight: 700 };
const iconDeleteBtn = { border: "none", background: "transparent", cursor: "pointer" };
const editBtn = { background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 8, padding: "8px 12px", cursor: "pointer", marginRight: 8 };
const deleteBtn = { background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3", borderRadius: 8, padding: "8px 12px", cursor: "pointer" };
const clickableLessonTitle = { color: "#0f172a", cursor: "pointer", fontWeight: 700 };
const selectedLessonTitle = { color: "#2563eb", cursor: "pointer", fontWeight: 800, textDecoration: "underline" };
const selectedLessonRow = { background: "#eff6ff" };

// Style bổ sung cho Main Tab
const mainTabsContainer = { display: "flex", gap: "20px", borderBottom: "2px solid #e2e8f0", marginBottom: "10px" };
const mainTabBtn = { padding: "12px 24px", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "3px solid transparent", cursor: "pointer", fontSize: "16px", fontWeight: "600", color: "#64748b", position: "relative", bottom: "-2px" };
const activeMainTabBtn = { ...mainTabBtn, color: "#2563eb", borderBottom: "3px solid #2563eb" };
const forumWrapper = { background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 8px 24px rgba(0,0,0,0.05)" };