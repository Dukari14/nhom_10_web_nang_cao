import axios from 'axios';

// Lỗi bị hủy chủ động (đổi trang khi đang tải) không cần báo cho người dùng
export function isCanceled(error) {
    return axios.isCancel(error);
}

// Server trả lỗi ở trường message (chuỗi hoặc mảng chuỗi). Luôn đổi thành mảng để hiển thị.
export function getErrorMessages(error) {
    if (error.response) {
        const message = error.response.data && error.response.data.message;
        if (Array.isArray(message) && message.length > 0) return message;
        if (typeof message === 'string' && message) return [message];
        return [`Có lỗi xảy ra (mã ${error.response.status}). Vui lòng thử lại.`];
    }
    return ['Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng và thử lại.'];
}
