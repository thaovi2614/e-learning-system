import api from "./api"

export const getProgressDetail = (courseId) => {
    return api.get(`/progress/detail/${courseId}`);
};

export const getProgress = (course_id) => {
    return api.get(`/progress/${course_id}`);
}

export const startLesson = (lesson_id) => {
    return api.post(`/progress/start/${lesson_id}`);
}

export const completeLesson = (lesson_id) => {
    return api.post(`/progress/complete/${lesson_id}`);
}