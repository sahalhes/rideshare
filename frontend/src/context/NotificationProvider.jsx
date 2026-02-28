import { createContext, useState, useCallback } from "react";

const NotificationContext = createContext({});

let idCounter = 0;

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = "info") => {
        const id = ++idCounter;
        setNotifications((prev) => [...prev, { id, message, type }]);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 10000);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}

            {/* Toast container - top left */}
            <div className="fixed top-14 left-4 z-50 flex flex-col gap-2 pointer-events-none">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm max-w-xs animate-slide-in ${
                            n.type === "success"
                                ? "bg-green-600/90"
                                : n.type === "error"
                                  ? "bg-red-600/90"
                                  : n.type === "warning"
                                    ? "bg-yellow-600/90"
                                    : "bg-gray-700/90"
                        } backdrop-blur-sm`}
                    >
                        <span className="flex-1">{n.message}</span>
                        <button
                            className="ml-1 p-0.5 rounded hover:bg-white/20 transition-colors"
                            onClick={() => removeNotification(n.id)}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
