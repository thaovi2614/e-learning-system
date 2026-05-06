import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCoursesManage, createCourse, updateCourse, deleteCourse } from "../../services/courseApi";
import { getCategories } from "../../services/categoryApi";

export default function CourseManagePage() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    subtitle: "",
    type: "TU_CHON",
    price: "",
    description: "",
    thumbnail: "",
    thumbnailFile: null,
    category_id: "",
    active: true,
    level: "beginner",
  });

  const loadCourses = async () => {
    try {
      const res = await getCoursesManage();
      setCourses(res.data.items || []);
    } catch (error) {
      alert(error.response?.data?.message || "Không tải được khóa học");
    }
  };

  const loadCategories = async () => {
    try {
      const res = await getCategories();

      if (Array.isArray(res.data)) {
        setCategories(res.data);
      } else if (Array.isArray(res.data.items)) {
        setCategories(res.data.items);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.log("Không tải được danh mục:", error);

      setCategories([
        { id: 1, name: "AI & Công nghệ" },
        { id: 23, name: "Canva" },
        { id: 9, name: "Cơ sở dữ liệu" },
        { id: 14, name: "Digital Marketing" },
        { id: 22, name: "Google" },
        { id: 3, name: "Kinh doanh & Khởi nghiệp" },
        { id: 25, name: "Kỹ năng giao tiếp" },
        { id: 24, name: "Kỹ năng lãnh đạo" },
        { id: 6, name: "Kỹ năng mềm" },
        { id: 26, name: "Kỹ năng phỏng vấn – xin việc" },
        { id: 27, name: "Kỹ năng quản lý thời gian" },
        { id: 8, name: "Lập trình App" },
        { id: 7, name: "Lập trình Web" },
        { id: 10, name: "Mạng & bảo mật" },
        { id: 2, name: "Marketing & Bán hàng" },
        { id: 21, name: "Microsoft" },
        { id: 4, name: "Ngoại ngữ" },
        { id: 15, name: "Quản Trị Kinh Doanh" },
      ]);
    }
  };

  useEffect(() => {
    loadCourses();
    loadCategories();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) =>
      course.name?.toLowerCase().includes(keyword.toLowerCase())
    );
  }, [courses, keyword]);

  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (c) => Number(c.id) === Number(categoryId)
    );

    return category
      ? `${category.id} - ${category.name}`
      : `Danh mục ${categoryId}`;
  };

  const resetForm = () => {
    setForm({
      name: "",
      subtitle: "",
      type: "TU_CHON",
      price: "",
      description: "",
      thumbnail: "",
      category_id: "",
      active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submit = async () => {
    try {
      if (!form.name.trim()) {
        alert("Tên khóa học không được để trống");
        return;
      }

      if (!form.subtitle.trim()) {
        alert("Subtitle không được để trống");
        return;
      }

      if (!form.price) {
        alert("Giá không được để trống");
        return;
      }

      if (!form.category_id) {
        alert("Vui lòng chọn danh mục");
        return;
      }

      // const payload = {
      //   name: form.name,
      //   subtitle: form.subtitle,
      //   type: form.type,
      //   price: Number(form.price),
      //   category_id: Number(form.category_id),
      //   description: form.description,
      //   thumbnail: form.thumbnail,
      //   active: form.active,
      // };

      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("subtitle", form.subtitle);
      formData.append("type", form.type);
      formData.append("price", form.price);
      formData.append("category_id", form.category_id);
      formData.append("description", form.description);
      formData.append("active", form.active);
      formData.append("level", form.level);

      if (form.thumbnailFile) {
        formData.append("thumbnail", form.thumbnailFile);
      }

      if (editingId) {
        await updateCourse(editingId, formData);
        alert("Cập nhật khóa học thành công");
      } else {
        await createCourse(formData);
        alert("Tạo khóa học thành công");
      }

      resetForm();
      loadCourses();
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const editCourse = (course) => {
    setEditingId(course.id);
    setShowForm(true);


    setForm({
      name: course.name || "",
      subtitle: course.subtitle || "",
      type: course.type || "TU_CHON",
      price: course.price || "0",
      description: course.description || "",
      thumbnail: course.thumbnail || "",
      category_id: course.category_id || "",
      active: course.active ?? true,
      level: course.level || "beginner",
    });
  };

  const deleteCourse = async (id) => {
    if (!window.confirm("Xác nhận xóa khóa học này?")) return;

    try {
      await deleteCourse(id);
      alert("Đã xóa khóa học");
      loadCourses();
    } catch (error) {
      alert(error.response?.data?.message || "Xóa thất bại");
    }
  };

  const goToContent = (courseId) => {
    navigate(`/manage-course-content/${courseId}`);
  };

  return (
    <div style={page}>
      <div style={container}>
        <div style={topBar}>
          <div>
            <h1 style={title}>Quản lý khóa học</h1>
          </div>

          <button style={primaryBtn} onClick={openCreateForm}>
            + Thêm khóa học
          </button>
        </div>

        <div style={filterBox}>
          <input
            style={searchInput}
            placeholder="Tìm kiếm khóa học..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <button style={lightBtn} onClick={() => setKeyword("")}>
            Làm mới
          </button>
        </div>

        <div style={statsGrid}>
          <div style={statCard}>
            <p style={statLabel}>Tổng khóa học</p>
            <h2 style={statNumber}>{courses.length}</h2>
          </div>

          <div style={statCard}>
            <p style={statLabel}>Đang hoạt động</p>
            <h2 style={statNumber}>
              {courses.filter((c) => c.active).length}
            </h2>
          </div>

          <div style={statCard}>
            <p style={statLabel}>Tạm ẩn</p>
            <h2 style={statNumber}>
              {courses.filter((c) => !c.active).length}
            </h2>
          </div>
        </div>

        <div style={tableBox}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Tên khóa học</th>
                <th style={th}>Danh mục</th>
                <th style={th}>Giá</th>
                <th style={th}>Loại</th>
                <th style={th}>Trạng thái</th>
                <th style={th}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredCourses.length === 0 && (
                <tr>
                  <td style={emptyTd} colSpan="7">
                    Chưa có khóa học nào.
                  </td>
                </tr>
              )}

              {filteredCourses.map((course) => (
                <tr key={course.id}>
                  <td style={td}>{course.id}</td>

                  <td style={td}>
                    <div
                      style={courseInfo}
                      onClick={() => goToContent(course.id)}
                      title="Bấm để quản lý nội dung khóa học"
                    >
                      <img
                        style={thumb}
                        src={
                          course.thumbnail ||
                          "https://via.placeholder.com/80x80?text=Course"
                        }
                        alt=""
                      />

                      <div>
                        <b style={courseTitle}>{course.name}</b>
                        <p style={smallText}>{course.subtitle}</p>
                      </div>
                    </div>
                  </td>

                  <td style={td}>
                    <span style={categoryBadge}>
                      {getCategoryName(course.category_id)}
                    </span>
                  </td>

                  <td style={{ ...td, color: "#16a34a", fontWeight: 700 }}>
                    {Number(course.price).toLocaleString("vi-VN")} đ
                  </td>

                  <td style={td}>
                    {course.type === "BAT_BUOC" ? "Bắt buộc" : "Tự chọn"}
                  </td>

                  <td style={td}>
                    <span style={course.active ? activeBadge : inactiveBadge}>
                      {course.active ? "Hoạt động" : "Tạm ẩn"}
                    </span>
                  </td>

                  <td style={td}>
                    <button
                      style={editBtn}
                      onClick={() => editCourse(course)}
                    >
                      Sửa
                    </button>

                    {/* <button
                      style={deleteBtn}
                      onClick={() => deleteCourse(course.id)}
                    >
                      Xóa
                    </button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div style={modalOverlay}>
          <div style={modal}>
            <h2 style={modalTitle}>
              {editingId ? "Sửa khóa học" : "Thêm khóa học"}
            </h2>

            <input
              style={input}
              name="name"
              placeholder="Tên khóa học"
              value={form.name}
              onChange={handleChange}
            />

            <input
              style={input}
              name="subtitle"
              placeholder="Mô tả ngắn / subtitle"
              value={form.subtitle}
              onChange={handleChange}
            />

            <div style={row}>
              <select
                style={input}
                name="type"
                value={form.type}
                onChange={handleChange}
              >
                <option value="TU_CHON">Tự chọn</option>
                <option value="BAT_BUOC">Bắt buộc</option>
              </select>

              <select
                style={input}
                name="level"
                value={form.level}
                onChange={handleChange}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              <input
                style={input}
                name="price"
                type="price"
                placeholder="Giá"
                value={form.price}
                onChange={handleChange}
              />
            </div>

            <div style={row}>
              <select
                style={input}
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
              >
                <option value="">-- Chọn danh mục --</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.id} - {category.name}
                  </option>
                ))}
              </select>

              <select
                style={input}
                value={form.active ? "true" : "false"}
                onChange={(e) =>
                  setForm({ ...form, active: e.target.value === "true" })
                }
              >
                <option value="true">Hoạt động</option>
                <option value="false">Tạm ẩn</option>
              </select>
            </div>

            <div className="mb-3">
              <div className="d-flex align-items-center gap-3">
                <label htmlFor="formFile" className="form-label mb-0">Thumbnail:</label>

                <input
                  className="form-control"
                  type="file"
                  id="formFile"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setForm({ ...form, thumbnailFile: file });

                    if (file) {
                      setForm(prev => ({
                        ...prev,
                        thumbnailFile: file,
                        thumbnail: URL.createObjectURL(file)
                      }));
                    }
                  }}
                />
              </div>
            </div>

            {form.thumbnail && (
              <div style={previewBox}>
                <p style={previewText}>Xem trước ảnh:</p>
                <img src={form.thumbnail} alt="" style={previewImg} />
              </div>
            )}

            <textarea
              style={{ ...input, minHeight: 90 }}
              name="description"
              placeholder="Mô tả khóa học"
              value={form.description}
              onChange={handleChange}
            />

            <div style={modalActions}>
              <button style={primaryBtn} onClick={submit}>
                {editingId ? "Cập nhật" : "Tạo khóa học"}
              </button>

              <button style={lightBtn} onClick={resetForm}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
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
  background: "#fff",
  padding: "22px 26px",
  borderRadius: 16,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
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

const filterBox = {
  background: "#fff",
  padding: 18,
  borderRadius: 14,
  display: "flex",
  gap: 12,
  marginBottom: 18,
  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
};

const searchInput = {
  flex: 1,
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #dbe1ea",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 16,
  marginBottom: 18,
};

const statCard = {
  background: "#fff",
  padding: 20,
  borderRadius: 14,
  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
};

const statLabel = {
  color: "#64748b",
  margin: 0,
};

const statNumber = {
  margin: "8px 0 0",
  color: "#0f172a",
};

const tableBox = {
  background: "#fff",
  borderRadius: 16,
  overflow: "hidden",
  boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  textAlign: "left",
  padding: "16px",
  background: "#f8fafc",
  color: "#475569",
  fontSize: 14,
};

const td = {
  padding: "16px",
  borderTop: "1px solid #eef2f7",
  verticalAlign: "middle",
};

const emptyTd = {
  padding: 28,
  textAlign: "center",
  color: "#64748b",
};

const courseInfo = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  cursor: "pointer",
};

const courseTitle = {
  color: "#0f172a",
};

const thumb = {
  width: 58,
  height: 58,
  objectFit: "cover",
  borderRadius: 10,
  background: "#f1f5f9",
};

const smallText = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: 13,
};

const categoryBadge = {
  background: "#dbeafe",
  color: "#2563eb",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
};

const activeBadge = {
  background: "#dcfce7",
  color: "#15803d",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
};

const inactiveBadge = {
  background: "#fee2e2",
  color: "#b91c1c",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
};

const primaryBtn = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "11px 16px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const lightBtn = {
  background: "#f1f5f9",
  color: "#334155",
  border: "1px solid #dbe1ea",
  padding: "10px 15px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
};

const editBtn = {
  background: "#eff6ff",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
  padding: "8px 12px",
  borderRadius: 8,
  cursor: "pointer",
  marginRight: 8,
};

const deleteBtn = {
  background: "#fff1f2",
  color: "#e11d48",
  border: "1px solid #fecdd3",
  padding: "8px 12px",
  borderRadius: 8,
  cursor: "pointer",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.35)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const modal = {
  width: 720,
  maxWidth: "92%",
  background: "#fff",
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};

const modalTitle = {
  marginTop: 0,
  color: "#0f172a",
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  marginBottom: 12,
  borderRadius: 10,
  border: "1px solid #dbe1ea",
};

const row = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 12,
};

const previewBox = {
  marginBottom: 12,
};

const previewText = {
  margin: "0 0 8px",
  color: "#475569",
  fontWeight: 700,
};

const previewImg = {
  width: 130,
  height: 130,
  objectFit: "cover",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};


