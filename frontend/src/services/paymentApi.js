import api from "./api";

export const checkoutCart = () => {
    return api.post("/payments/momo/create", {});
};

export const createMomoPayment = (courseIds = []) => {
    return api.post("/payments/momo/create", { course_ids: courseIds });
};