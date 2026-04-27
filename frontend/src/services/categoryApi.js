import api from "./api";

export const getCategoryBySlug = (params) => {
    return api.get("/categories/by-slug", { params });
};