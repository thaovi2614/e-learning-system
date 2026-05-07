import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { checkoutCart } from "../../services/paymentApi";
import "./cart.css";
import { toast } from "react-toastify";

export default function Cart() {
    const { user } = useAuth();
    const [params] = useSearchParams();
    const { loadingCart, cartItems, totalPrice, cartCount, fetchCart, deleteFromCart, clearCart } = useCart();
    const navigate = useNavigate();
    const hasHandledPayment = useRef(false);

    useEffect(() => {
        const resultCode = params.get("resultCode");
        if (!resultCode || hasHandledPayment.current) return;

        hasHandledPayment.current = true;

        if (resultCode === "0") {
            clearCart();
        }
    }, []);

    function formattedPrice(price) {
        const formatted = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);

        return formatted
    }

    const handleCheckout = async () => {
        try {
            const res = await checkoutCart();
            const data = res.data;

            if (!data.payUrl) {
                toast.error("Không tạo được link thanh toán");
                return;
            }

            window.location.href = data.payUrl;

        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message;

            if (status === 400 && message?.includes("Đã mua")) {
                toast.warning("Giỏ hàng có khóa học bạn đã mua rồi, vui lòng kiểm tra lại");
            } else {
                toast.error(message || "Có lỗi xảy ra khi thanh toán");
            }
        }
    };
    
    if (loadingCart) return <div>Loading...</div>;

    return (
        <div className="container">
            <h1 className="section-title">Giỏ hàng</h1>
            <div className="cart-container">
                <div className="left-container">
                    <p className="quantity-item">{cartCount} khóa học trong giỏ hàng</p>
                    <div className="cart-list">
                        {cartItems.map(item => (
                            <div 
                                key={item.id}
                                className="cart-card"
                            >
                                <div className="thumbnail">
                                    <img src={item.thumbnail} alt="" />
                                </div>
                                <div className="cart-content">
                                    <h3>{item.name}</h3>
                                    <p>{item.subtitle}</p>
                                    <p>{formattedPrice(item.price)}</p>
                                </div>
                                <div className="cart-feature">
                                    <button onClick={() => deleteFromCart(item.id)}>Xóa</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="right-container">
                    <span>Tổng thanh toán</span>
                    <h1>{formattedPrice(totalPrice)}</h1>

                    <button 
                        className="button-payment"
                        disabled={cartCount === 0}
                        onClick={() => handleCheckout()}
                    >
                        Thanh toán
                    </button>
                </div>
            </div>
        </div>
    );
}