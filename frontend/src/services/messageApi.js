import api from "./api"

export const getMessages = (conversation_id) => {
    return api.get(`/messages/${conversation_id}`);
}

export const markAsRead = (conversation_id) => {
    return api.put(`/messages/read/${conversation_id}`);
}

export const uploadMessageImage = (formData) => {
    return api.post(`/messages/upload-image`, formData);
}