import api from "./api";

export const createChapter = (courseId, data) => {
    return api.post(`/courses/${courseId}/chapters`, data);
};

export const getChapterByCourseId = (courseId) => {
    return api.get(`/courses/${courseId}/chapters`);
};

export const removeChapter = (courseId, chapterId) => {
    return api.delete(`/courses/${courseId}/chapters/${chapterId}`);
};