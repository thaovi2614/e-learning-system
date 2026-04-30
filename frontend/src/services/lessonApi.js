import api from "./api";

export const getLessonById = (id) => {
    return api.get(`/lessons/${id}`);
};

export const createLesson = (chapterId, data) => {
    return api.post(`/chapters/${chapterId}/lessons`, data, {
        headers: {
        "Content-Type": "multipart/form-data",
        },
    });
};

export const updateLesson = (id, data) => {
    return api.put(`/lessons/${id}`, data, {
        headers: {
        "Content-Type": "multipart/form-data",
        },
    });
};

export const deleteLesson = (id) => {
    return api.delete(`/lessons/${id}`);
};