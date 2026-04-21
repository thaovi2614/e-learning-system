import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import userIcon from "../../assets/user.png"
import lockIcon from "../../assets/lock.png"
import eyeIcon from "../../assets/eye.png"
import eyeOffIcon from "../../assets/eye-off.png"
import "../auth/auth.css"
import { useAuth } from "../../context/AuthContext";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from || "/";
    
    const [form, setForm] = useState({
        username: "",
        password: "",
    })
    const [showPassword, setShowPassword] = useState(false);

    const fields = [
        {
            name: "username",
            placeholder: "Tên đăng nhập",
            type: "text",
            icon: userIcon
        },
        {
            name: "password",
            placeholder: "Mật khẩu",
            type: "password",
            icon: lockIcon
        }
    ];

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const res = await login(form);
        if (res.success) {
            navigate(from);
        } else {
            alert(res.message);
        }
    };
    
    return(
        <div className="auth-container">
            <div className="auth-box">
                <div className="auth-left">
                    <h4 className="mb-4 text-center">E-learning</h4>

                    <form onSubmit={handleLogin}>
                        {fields.map((field) => (
                            <div className="input-group-custom" key={field.name}>
                                <span className="input-icon">
                                    <img src={field.icon} alt=""/>
                                </span>
                                <input
                                    name={field.name}
                                    className="form-control"
                                    placeholder={field.placeholder}
                                    type={
                                        field.name === "password" 
                                        ? showPassword 
                                            ? "text" : "password" 
                                        : field.type
                                    }
                                    value={form[field.name]}
                                    onChange={handleChange}
                                    required
                                />
                                {field.name === "password" && (
                                    <span 
                                        className="input-icon-right"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <img src={showPassword ? eyeOffIcon : eyeIcon}/>
                                    </span>
                                )}
                            </div>
                        ))}

                        <button className="btn btn-dark w-100">
                            Đăng nhập
                        </button>
                    </form>

                    <p className="text-center">
                        Bạn chưa có tài khoản?{" "}
                        <Link to="/register" className="change-link">
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>

                <div className="auth-right">
                    <h1>ELearning</h1>
                </div>
            </div>
        </div>
    );
}