import api from "./api";

export const getCategories = () => {
  return api.get("/categories");
};

export const getCategoryBySlug = (params) => {
  return api.get("/categories/by-slug", {
    params,
  });
};

export const addCategory = (data) => {
  return api.post("/categories", data);
};

export const updateCategory = (id, data) => {
  return api.put(`/categories/${id}`, data);
};