import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import "./home.css"

export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart } = useCart();

    function handleAddToCart() {
        if (!user) {
            navigate("/login");
            return;
        }

        addToCart();
    }

    function formattedPrice(price) {
        const formatted = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);

        return formatted
    }

    return (
        <div className="container">
            <button onClick={() => handleAddToCart()}>
                Test giỏ hàng
            </button>
            <h1>Các khóa học nổi bật</h1>

            <h1>Toàn bộ các khóa học</h1>
        </div>
    );
}