import api from "./api"

export const createOrGetConversation = (user_id) => {
    return api.post(`/conversations/with/${user_id}`);
}

export const getAllUserConversations = () => {
    return api.get(`/conversations`);
}