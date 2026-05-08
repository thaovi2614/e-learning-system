import { useEffect, useRef, useState } from "react";
import {
  getCategories,
  addCategory,
  updateCategory,
} from "../../services/categoryApi";
import "./AdminCategory.css";
import { toast } from "react-toastify"

export default function AdminCategory() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    parent_id: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [keyword, setKeyword] = useState("");
  const formRef = useRef(null);

  async function fetchCategories() {
    const res = await getCategories();
    setCategories(res.data);
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(keyword.toLowerCase())
  );

  function resetForm() {
    setForm({
      name: "",
      parent_id: "",
    });
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const payload = {
        name: form.name,
        parent_id: form.parent_id
          ? Number(form.parent_id)
          : null,
      };

      if (editingId) {
        await updateCategory(editingId, payload);
        toast.success("Cập nhật thành công");
      } else {
        await addCategory(payload);
        toast.success("Thêm thành công");
      }

      resetForm();
      await fetchCategories();

    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  }

  function handleEdit(category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      parent_id: category.parent_id || "",
    });

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function handleToggleActive(category) {
    try {
      await updateCategory(category.id, {
        active: !category.active,
      });

      await fetchCategories();

    } catch (err) {
      console.error(err);
      alert("Không thể cập nhật trạng thái");
    }
  }

  return (
    <div className="admin-category-page">
      <div className="admin-category-hero">

        <h1>Quản lý danh mục</h1>
        <span>
          Thêm, chỉnh sửa và bật/tắt danh mục khóa học trong hệ thống.
        </span>
      </div>

      <div className="admin-category-layout">
        <div className="admin-category-form-card" ref={formRef}>
          <h2>{editingId ? "Cập nhật danh mục" : "Thêm danh mục mới"}</h2>

          <form onSubmit={handleSubmit}>
            <label>Tên danh mục</label>
            <input
              type="text"
              placeholder="Nhập tên danh mục..."
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />

            <label>Danh mục cha</label>
            <select
              value={form.parent_id}
              onChange={(e) =>
                setForm({ ...form, parent_id: e.target.value })
              }
            >
              <option value="">Không có danh mục cha</option>

              {categories
                .filter((c) => c.id !== editingId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>

            <div className="admin-category-actions">
              <button type="submit" className="primary-btn">
                {editingId ? "Lưu thay đổi" : "Thêm danh mục"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetForm}
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-category-table-card">
          <div className="table-header">
            <h2>Danh sách danh mục</h2>
            <span>{categories.length} danh mục</span>
          </div>

          <div className="category-search">
            <input
              type="text"
              placeholder="Tìm kiếm danh mục..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {keyword && (
              <button onClick={() => setKeyword("")}>✕</button>
            )}
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên danh mục</th>
                <th>Slug</th>
                <th>Danh mục cha</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredCategories.map((category) => {
                const parent = categories.find(
                  (c) => c.id === category.parent_id
                );

                return (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td className="category-name">{category.name}</td>
                    <td>{category.slug}</td>
                    <td>{parent ? parent.name : "—"}</td>
                    <td>
                      <span
                        className={
                          category.active
                            ? "status active"
                            : "status inactive"
                        }
                      >
                        {category.active ? "Đang hiển thị" : "Đã ẩn"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => handleEdit(category)}>
                          Sửa
                        </button>
                        <button
                          className="danger"
                          onClick={() => handleToggleActive(category)}
                        >
                          {category.active ? "Ẩn" : "Hiện"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="empty-category">
              Chưa có danh mục nào trong hệ thống.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}