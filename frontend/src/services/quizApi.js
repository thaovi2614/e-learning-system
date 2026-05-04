import api from "./api";

export const getQuizById = (id) => {
    return api.get(`/quizzes/${id}`);
};

export const submitQuiz = (quizId, answers) => {
    return api.post(`/quizzes/${quizId}/submit`, { answers });
};

export const getBestScore = (quizId) => {
    return api.get(`/quizzes/${quizId}/best-score`);
}