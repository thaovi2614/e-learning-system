import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, changePassword, updateAvatar } from '../../services/userApi';
import { AuthContext } from '../../context/AuthContext';
import './Profile.css';
import { toast } from 'react-toastify';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [passwords, setPasswords] = useState({ old_password: '', new_password: '' });
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const { setUser: setGlobalUser } = useContext(AuthContext);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setIsLoading(true);
            const res = await getProfile();
            setUser(res.data);
            if (setGlobalUser) setGlobalUser(res.data);
        } catch (err) {
            console.error("Lỗi lấy thông tin profile:", err);
            if (err.response?.status === 401) {
                toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
                navigate('/login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        if (!e.target.files[0]) return;
        const formData = new FormData();
        formData.append('avatar', e.target.files[0]);
        try {
            const res = await updateAvatar(formData);
            setUser({ ...user, avatar: res.data.avatar_url });
            toast.success("Cập nhật ảnh đại diện thành công!");
        } catch (err) {
            toast.error("Lỗi cập nhật ảnh: " + (err.response?.data?.message || "Lỗi hệ thống"));
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        try {
            await changePassword(passwords);
            toast.success("Đổi mật khẩu thành công!");
            setPasswords({ old_password: '', new_password: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || "Mật khẩu cũ không chính xác");
        }
    };

    if (isLoading) return <div style={{ padding: '100px', textAlign: 'center' }}>Đang tải thông tin...</div>;

    if (!user) return (
        <div style={{ padding: '100px', textAlign: 'center' }}>
            <p>Vui lòng đăng nhập để xem thông tin.</p>
            <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', cursor: 'pointer' }}>Đến trang Đăng nhập</button>
        </div>
    );

    return (
        <div className="profile-container">
            <h1>Thông tin cá nhân</h1>
            
            <div className="avatar-section">
                <img 
                    src={user.avatar || '/default-avatar.png'} 
                    alt="Avatar" 
                />
                {/* --- CHỈ SỬA Ở ĐÂY: Dùng label làm nút bấm thay thế input --- */}
                <label className="custom-file-upload">
                    Chọn ảnh mới
                    <input type="file" accept="image/*" onChange={handleAvatarChange} />
                </label>
            </div>
            
            <div className="info-section">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Tên người dùng:</strong> {user.username}</p>
                <p><strong>Vai trò:</strong> {user.role}</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="password-form">
                <h3>Đổi mật khẩu</h3>
                <input 
                    type="password" 
                    placeholder="Mật khẩu cũ" 
                    value={passwords.old_password}
                    onChange={(e) => setPasswords({...passwords, old_password: e.target.value})}
                    required
                />
                <input 
                    type="password" 
                    placeholder="Mật khẩu mới" 
                    value={passwords.new_password}
                    onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
                    required
                />
                <button type="submit">Cập nhật mật khẩu</button>
            </form>
        </div>
    );
};

export default Profile;