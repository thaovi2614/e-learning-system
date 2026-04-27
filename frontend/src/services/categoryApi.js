import api from "./api";

export const getCategories = () => {
    return api.get("/categories");
};

export const getCategoryBySlug = (params) => {
    return api.get("/categories/by-slug", { params });
};