import axios from '../api/axios';
import useAuth from './useAuth';

const useRefreshToken = () => {
    const { setAuth } = useAuth();

    const refresh = async () => {
        const response = await axios.get('/auth/refresh', {
            withCredentials: true,
        });
        setAuth({
            accessToken: response.data.accessToken,
            username: response.data.username,
        });
        return response.data.accessToken;
    };

    return refresh;
};

export default useRefreshToken;