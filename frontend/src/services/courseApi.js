import api from "./api";

export const getCourses = (params) => {
    return api.get("/courses", { params });
};

export const getMyCourses = (params) => {
    return api.get("/courses/my-courses", { params });
};

export const getCoursesByCategory = (categoryId, excludeId) => {
    return api.get(`/courses/by-category/${categoryId}`, {
        params: {
            exclude_id: excludeId
        }
    });
};

export const getCoursesManage = () => {
    return api.get("/courses/manage");
};

export const getCourseById = (id) => {
    return api.get(`/courses/${id}`);
};

export const createCourse = (data) => {
    return api.post("/courses", data, {
        headers: {
        "Content-Type": "multipart/form-data",
        },
    });
};

export const updateCourse = (id, data) => {
    return api.put(`/courses/${id}`, data, {
        headers: {
        "Content-Type": "multipart/form-data",
        },
    });
};

export const deleteCourse = (id) => {
    return api.delete(`/courses/${id}`);
};