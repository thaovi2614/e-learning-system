import api from "./api";

export const getCartApi = () => {
    return api.get("/cart");
};

export const addCartApi = (data) => {
    return api.post("/cart", data);
};

export const deleteCartApi = (course_id) => {
    return api.delete(`/cart/${course_id}`);
};

export const clearCartApi = () => {
    return api.delete("/cart/clear");
};