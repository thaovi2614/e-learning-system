import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
    const { user } = useAuth();

    const getCartKey = () => user ? `cart_${user.id}` : "cart_guest";

    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const key = getCartKey();
        const saved = localStorage.getItem(key);
        setCartCount(saved ? parseInt(saved) : 0);
    }, [user]);

    const addToCart = () => {
        setCartCount(prev => {
            const next = prev + 1;
            localStorage.setItem(getCartKey(), next);
            return next;
        });
    };

    const removeFromCart = () => {
        setCartCount(prev => {
            const next = Math.max(0, prev - 1);
            localStorage.setItem(getCartKey(), next);
            return next;
        });
    };

    const clearCart = () => {
        localStorage.removeItem(getCartKey());
        setCartCount(0);
    };

    // const [cartItems, setCartItems] = useState(
    //     () => JSON.parse(localStorage.getItem("cartItems")) || []
    // );

    // const cartCount = cartItems.length;

    // const addToCart = (item) => {
    //     // Không thêm nếu đã có
    //     if (cartItems.find(i => i.id === item.id)) return;

    //     setCartItems(prev => {
    //         const next = [...prev, item];
    //         localStorage.setItem("cartItems", JSON.stringify(next));
    //         return next;
    //     });
    // };

    // const removeFromCart = (itemId) => {
    //     setCartItems(prev => {
    //         const next = prev.filter(i => i.id !== itemId);
    //         localStorage.setItem("cartItems", JSON.stringify(next));
    //         return next;
    //     });
    // };

    // const clearCart = () => {
    //     setCartItems([]);
    //     localStorage.removeItem("cartItems");
    // };

    return (
        <CartContext.Provider value={{ cartCount, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    return useContext(CartContext);
}