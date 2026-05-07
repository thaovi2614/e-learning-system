import api from "./api";

export const checkEnrollment = (course_id) => {
    return api.get(`/enrollments/check/${course_id}`);
}


export const createEnrollment = (course_id) => {
    return api.post(`/enrollments`, null , {
        params: {
            course_id: course_id
        }
    });
}