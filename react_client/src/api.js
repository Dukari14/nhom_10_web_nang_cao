import axios from 'axios';

// Backend dùng cookie JWT httpOnly nên phải gửi kèm cookie (withCredentials).
// Trình duyệt tự giữ cookie, ứng dụng không lưu token ở bất cứ đâu.
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
    withCredentials: true,
});

export default api;
