import { useContext } from "react";
import NotificationContext from "../context/NotificationProvider";

const useNotification = () => {
    return useContext(NotificationContext);
};

export default useNotification;
