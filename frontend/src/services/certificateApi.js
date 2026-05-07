import api from "./api";

export const getCertificateByCourse = (courseId) => {
  return api.get(`/certificates/course/${courseId}`);
};