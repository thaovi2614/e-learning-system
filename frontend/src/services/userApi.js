import api from "./api";

export const getProfile = () => api.get("/user/profile");
export const changePassword = (data) => api.post("/user/change-password", data);
export const updateAvatar = (formData) => api.post("/user/update-avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" }
});