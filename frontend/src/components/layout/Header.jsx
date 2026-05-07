import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useMessage } from "../../context/MessageContext";
import CategoryMenu from "../category/CategoryMenu"
import BadgeIcon from "../common/BadgeIcon";
import cartIcon from "../../assets/cart.png";
import searchIcon from "../../assets/search.png"
import messageIcon from "../../assets/messenger.png";
import "./layout.css"

export default function Header() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { conversations } = useMessage();
  const [openProfile, setOpenProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const wrapperRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?kw=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const unreadCount = conversations.reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0
  );

  useEffect(() => {
    if (location.pathname === "/") {
      setSearchQuery("");
    }
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpenProfile(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { label: "Thông tin cá nhân", onClick: () => navigate("/profile") },

    user?.role === "STUDENT" && {
      label: "Khóa học của tôi",
      onClick: () => navigate("/my-courses"),
    },

    user?.role === "INSTRUCTOR" && {
      label: "Quản lý khóa học",
      onClick: () => navigate("/manage-course"),
    },

    user?.role === "ADMIN" && {
      label: "Quản lý danh mục",
      onClick: () => navigate("/admin/categories"),
    },

    { label: "Đăng xuất", onClick: logout, danger: true },
  ].filter(Boolean);

  

  return (
    <nav className="navbar navbar-dark bg-dark">
      <div className="container header-container">
        <div className="header-left">
          <Link className="navbar-brand" to="/">
            Elearning
          </Link>

          <CategoryMenu />
        </div>

        <div className="header-center">
          <form className="header-search" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="Tìm khóa học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn">
              <img src={searchIcon} alt="" />
            </button>
          </form>
        </div>


        <div>
          <button
            type="button"
            className="recommend-nav-btn"
            onClick={() => {
              if (!user) {
                alert("Vui lòng đăng nhập để xem gợi ý khóa học");
                navigate("/login", { state: { from: "/recommendations" } });
                return;
              }

              navigate("/recommendations");
            }}
          >
            Gợi ý
          </button>
        </div>
        <div className="header-right">
          <BadgeIcon
            icon={messageIcon}
            count={unreadCount}
            onClick={() => navigate("/messages")}
            user={user}
          />

          <BadgeIcon
            icon={cartIcon}
            count={cartCount}
            onClick={() => navigate("/cart")}
            user={user}
          />

          {!user ? (
            <div className="header-auth">
              <Link className="btn btn-outline-light" to="/login">
                Đăng nhập
              </Link>
              <Link className="btn btn-warning" to="/register">
                Đăng ký
              </Link>
            </div>
          ) : (
            <div className="header-user" ref={wrapperRef}>
              <img
                src={user.avatar}
                alt=""
                className="avatar-image"
                onClick={() => setOpenProfile(!openProfile)}
              />

              {openProfile && (
                <div className="avatar-dropdown">
                  {menuItems.map((item, i) => (
                    <div key={i}>
                      {i > 0 && <div className="avatar-divider" />}
                      <div
                        className={`avatar-menu-item ${item.danger ? "danger" : ""}`}
                        onClick={() => { item.onClick(); setOpenProfile(false); }}
                      >
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}