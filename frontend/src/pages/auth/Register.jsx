import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import userIcon from "../../assets/user.png"
import lockIcon from "../../assets/lock.png"
import eyeIcon from "../../assets/eye.png"
import eyeOffIcon from "../../assets/eye-off.png"
import emailIcon from "../../assets/email.png"
import studentIcon from "../../assets/student.png"
import instructorIcon from "../../assets/instructor.png"
import "../auth/auth.css"
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify"; 

export default function Register() {
    const { register } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({
        username: "",
        fullname: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "STUDENT"
    });
    const [showPasswordMap, setShowPasswordMap] = useState({
        password: false,
        confirmPassword: false,
    });

    const fields = [
        {
            name: "username",
            placeholder: "Tên đăng nhập",
            type: "text",
            icon: userIcon
        },
        {
            name: "fullname",
            placeholder: "Họ và tên",
            type: "text",
            icon: userIcon 
        },
        {
            name: "email",
            placeholder: "Email",
            type: "email",
            icon: emailIcon
        },
        {
            name: "password",
            placeholder: "Mật khẩu",
            type: "password",
            icon: lockIcon
        },
        {
            name: "confirmPassword",
            placeholder: "Xác nhận mật khẩu",
            type: "password",
            icon: lockIcon
        }
    ];

    const roles = [
        { label: "Học viên", icon: studentIcon, value: "STUDENT"},
        { label: "Giảng viên", icon: instructorIcon, value: "INSTRUCTOR"},
    ]

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const handleRegister = async (e) => {
        e.preventDefault();
        
        const res = await register(form);

        if (res.success) {
            navigate("/");
            toast.success("Đăng ký thành công");
        } else {
            toast.error(res.message);
        }
    }
    
    return(
        <div className="auth-container">
            <div className="auth-box">
                <div className="auth-left">
                    <h4 className="mb-4 text-center">E-learning</h4>

                    <form onSubmit={handleRegister}>
                        {fields.map((field) => (
                            <div className="input-group-custom" key={field.name}>
                                <label className="input-icon">
                                    <img src={field.icon} alt=""/>
                                </label>
                                <input
                                    name={field.name}
                                    className="form-control"
                                    placeholder={field.placeholder}
                                    type={
                                        field.name === "password"
                                        ? (showPasswordMap[field.name] ? "text" : "password")
                                        : field.name === "confirmPassword"
                                        ? (showPasswordMap[field.name] ? "text" : "password")
                                        : field.type
                                    }
                                    value={form[field.name]}
                                    onChange={handleChange}
                                    required
                                />
                                {(field.name === "password" || field.name === "confirmPassword") && (
                                    <span 
                                        className="input-icon-right"
                                        onClick={() => 
                                            setShowPasswordMap({
                                                ...showPasswordMap,
                                                [field.name]: !showPasswordMap[field.name],
                                            })
                                        }
                                    >
                                        <img
                                            src={showPasswordMap[field.name] ? eyeOffIcon : eyeIcon}
                                            alt=""
                                        />
                                    </span>
                                )}
                            </div>
                        ))}

                        <div className="mb-3">
                            <label className="form-label fw-bold">Vai trò</label>
                            <div className="d-flex justify-content-center align-items-center gap-3">
                                {roles.map((role) => (
                                    <div className="" key={role.value}>
                                        <input
                                            type="radio"
                                            className="btn-check"
                                            name="role"
                                            id={role.value}
                                            value={role.value}
                                            checked={form.role === role.value}
                                            onChange={handleChange}
                                        />
                                        <label className="btn btn-outline-dark d-flex align-items-center gap-2" htmlFor={role.value}>
                                            <img src={role.icon} alt="" />
                                            <span>{role.label}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="btn btn-dark w-100">
                            Đăng ký
                        </button>
                    </form>

                    <p className="text-center">
                        Bạn đã có tài khoản?{" "}
                        <Link to="/login" className="change-link">
                            Đăng nhập ngay
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