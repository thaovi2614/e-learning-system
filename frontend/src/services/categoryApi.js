// import axios from "axios";

// const API_BASE = "http://localhost:5000/api/categories";

// function authHeader() {
//   const token = localStorage.getItem("access_token");
//   return token ? { Authorization: `Bearer ${token}` } : {};
// }

// export const getCategories = () => {
//   return axios.get(API_BASE, {
//     headers: authHeader(),
//   });
// };

// export const getCategoryBySlug = (params) => {
//   return axios.get(`${API_BASE}/by-slug`, {
//     params,
//   });
// };

// export const addCategory = (data) => {
//   return axios.post(API_BASE, data, {
//     headers: authHeader(),
//   });
// };

// export const updateCategory = (id, data) => {
//   return axios.put(`${API_BASE}/${id}`, data, {
//     headers: authHeader(),
//   });
// };


import api from "./api";

export const getCategories = () => {
    return api.get("/categories");
};

export const getCategoryBySlug = (params) => {
    return api.get("/categories/by-slug", { params });
};

export const addCategory = (data) => {
    return api.post("/categories", data);
};

export const updateCategory = (id, data) => {
    return api.put(`/categories/${id}`, data);
};