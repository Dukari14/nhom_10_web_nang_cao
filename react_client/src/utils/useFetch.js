import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import { getErrorMessages, isCanceled } from './errors';

// Gọi GET và theo dõi trạng thái: data, loading, errors. Đổi url hoặc params thì tải lại,
// request cũ bị hủy. Tham số undefined bị bỏ qua; params = null nghĩa là chưa gọi (ví dụ form chưa hợp lệ).
// reload() để tải lại sau khi sửa dữ liệu.
export default function useFetch(url, params) {
    const [state, setState] = useState({ data: null, loading: true, errors: [] });
    const [tick, setTick] = useState(0);
    const paramsKey = JSON.stringify(params === undefined ? {} : params);

    useEffect(() => {
        if (paramsKey === 'null') {
            setState((previous) => ({ ...previous, loading: false, errors: [] }));
            return undefined;
        }

        const controller = new AbortController();
        setState((previous) => ({ ...previous, loading: true, errors: [] }));
        api.get(url, { params: JSON.parse(paramsKey), signal: controller.signal })
            .then((response) => setState({ data: response.data, loading: false, errors: [] }))
            .catch((error) => {
                if (isCanceled(error)) return;
                setState({ data: null, loading: false, errors: getErrorMessages(error) });
            });
        return () => controller.abort();
    }, [url, paramsKey, tick]);

    const reload = useCallback(() => setTick((value) => value + 1), []);
    return { ...state, reload };
}
