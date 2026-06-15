import axiosInstance from "@/lib/axiosInstance";

export const fetchRoomTypes = (filter = {}, page = 0, size = 10) => {
  return axiosInstance
    .post(`/room-types/filter?page=${page}&size=${size}`, filter)
    .then((r) => r.data?.data ?? r.data);
};

export const createRoomType = (data) => {
  return axiosInstance
    .post("/room-types", data)
    .then((r) => r.data?.data ?? r.data);
};

export const updateRoomType = (id, data) => {
  return axiosInstance
    .put(`/room-types/${id}`, data)
    .then((r) => r.data?.data ?? r.data);
};

export const deleteRoomType = (id) => {
  return axiosInstance
    .delete(`/room-types/${id}`)
    .then((r) => r.data?.data ?? r.data);
};

export const activateRoomType = (id) => {
  return axiosInstance
    .patch(`/room-types/${id}/activate`)
    .then((r) => r.data?.data ?? r.data);
};

export const deactivateRoomType = (id) => {
  return axiosInstance
    .patch(`/room-types/${id}/deactivate`)
    .then((r) => r.data?.data ?? r.data);
};
