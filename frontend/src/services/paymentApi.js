import api from "./api";

export const createPayment = () => {
    return api.post("/payments/momo/create");
};