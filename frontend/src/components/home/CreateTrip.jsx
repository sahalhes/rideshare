import { useState, useEffect } from "react";
import {
    faXmark,
    faInfoCircle,
    faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import useAuth from "../../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

const CreateTrip = ({ route, setCreateTripOpenFalse }) => {
    const [departureDate, setDepartureDate] = useState(
        new Date().toISOString().split("T")[0],
    );
    const [validDepartureDate, setValidDepartureDate] = useState(true);

    const [availableSeats, setAvailableSeats] = useState(1);
    const [validAvailableSeats, setValidAvailableSeats] = useState(true);

    const [maxDetour, setMaxDetour] = useState(15);
    const [validMaxDetour, setValidMaxDetour] = useState(true);

    const [errMsg, setErrMsg] = useState("");
    const [err, setErr] = useState(false);
    const [success, setSuccess] = useState(false);

    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setErr(false);
        setValidDepartureDate(validateDepartureDate());
    }, [departureDate]);

    useEffect(() => {
        setErr(false);
        setValidAvailableSeats(availableSeats >= 1);
    }, [availableSeats]);

    useEffect(() => {
        setErr(false);
        setValidMaxDetour(maxDetour >= 1);
    }, [maxDetour]);

    const validateDepartureDate = () => {
        const today = new Date().toISOString().split("T")[0];
        return departureDate.split("T")[0] >= today;
    };

    const handleCreateTrip = async (e) => {
        e.preventDefault();
        if (!auth?.username) {
            navigate("/login", { state: { from: location } });
            return;
        }
        if (!validateDepartureDate()) {
            setErrMsg("Invalid departure date");
            setErr(true);
            return;
        }
        if (availableSeats < 1) {
            setErrMsg("Invalid available seats");
            setErr(true);
            return;
        }
        if (maxDetour < 1) {
            setErrMsg("Invalid max detour");
            setErr(true);
            return;
        }

        try {
            const driver = auth?.username;
            const departure_date = departureDate.split("T")[0];
            await axiosPrivate.post("/api/trips", {
                driver,
                origin: route.origin.name,
                destination: route.destination.name,
                origin_coords: route.origin.coords,
                destination_coords: route.destination.coords,
                departure_date,
                seats_available: availableSeats,
                max_detour_minutes: maxDetour,
            });
            setSuccess(true);
        } catch (error) {
            if (!error?.response)
                setErrMsg("Network error. No server response.");
            else if (error.response?.status === 400) setErrMsg("Invalid trip.");
            else if (error.response?.status === 409)
                setErrMsg("Cannot create two trips on the same day.");
            else setErrMsg("Trip creation failed.");
            setErr(true);
        }
    };

    const handleClose = () => {
        setCreateTripOpenFalse();
        setSuccess(false);
    };

    return (
        /* ── Backdrop ── */
        <div
            className="absolute inset-0 flex justify-center items-center z-20"
            style={{
                top: 0,
                height: "calc(100vh - 48px)",
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
            }}
            onClick={handleClose}
        >
            {/* ── Card ── */}
            <div
                className="relative flex flex-col text-white mx-3 w-full"
                style={{
                    maxWidth: 420,
                    background: "#161616",
                    borderRadius: 20,
                    border: "1px solid #2a2a2a",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.85)",
                    overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 pt-5 pb-4"
                    style={{ borderBottom: "1px solid #2a2a2a" }}
                >
                    <h2 className="text-base font-semibold tracking-wide">
                        Plan your ride
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors"
                        style={{ background: "#2a2a2a" }}
                    >
                        <FontAwesomeIcon icon={faXmark} size="sm" />
                    </button>
                </div>

                {success ? (
                    /* ── Success ── */
                    <div className="flex flex-col items-center gap-4 px-6 py-10">
                        <div
                            className="flex items-center justify-center w-16 h-16 rounded-full"
                            style={{ background: "#0d2e0d" }}
                        >
                            <FontAwesomeIcon
                                icon={faCheckCircle}
                                size="2x"
                                color="#22c55e"
                            />
                        </div>
                        <p className="text-xl font-semibold">Trip Created!</p>
                        <p
                            className="text-sm text-center"
                            style={{ color: "#9e9e9e" }}
                        >
                            {route.origin.name} → {route.destination.name}
                        </p>
                        <button
                            className="mt-2 w-full py-3 rounded-xl font-semibold text-sm text-black hover:opacity-90 transition-opacity"
                            style={{ background: "#22c55e" }}
                            onClick={handleClose}
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <form
                        onSubmit={handleCreateTrip}
                        className="flex flex-col gap-5 px-6 py-5"
                    >
                        {/* Error banner */}
                        {err && (
                            <div
                                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                                style={{
                                    background: "#2d0f0f",
                                    border: "1px solid #7f1d1d",
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    color="#f87171"
                                />
                                <span style={{ color: "#f87171" }}>
                                    {errMsg}
                                </span>
                            </div>
                        )}

                        {/* Route card — circle / dotted line / square */}
                        <div
                            className="rounded-2xl overflow-hidden"
                            style={{
                                background: "#1e1e1e",
                                border: "1px solid #2a2a2a",
                            }}
                        >
                            {/* Origin row */}
                            <div
                                className="flex items-center gap-4 px-4 py-4"
                                style={{ borderBottom: "1px solid #2a2a2a" }}
                            >
                                <div
                                    className="relative flex-shrink-0 flex flex-col items-center"
                                    style={{ width: 12 }}
                                >
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ background: "#fff" }}
                                    />
                                    {/* Dotted connector */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "100%",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            width: 2,
                                            height: 28,
                                            background:
                                                "repeating-linear-gradient(to bottom,#555 0px,#555 4px,transparent 4px,transparent 8px)",
                                        }}
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p
                                        className="text-xs font-medium uppercase tracking-widest mb-0.5"
                                        style={{ color: "#9e9e9e" }}
                                    >
                                        From
                                    </p>
                                    <p className="text-sm font-medium truncate">
                                        {route.origin.name}
                                    </p>
                                </div>
                            </div>
                            {/* Destination row */}
                            <div className="flex items-center gap-4 px-4 py-4">
                                <div
                                    className="w-3 h-3 rounded-sm flex-shrink-0"
                                    style={{ background: "#fff" }}
                                />
                                <div className="min-w-0 flex-1">
                                    <p
                                        className="text-xs font-medium uppercase tracking-widest mb-0.5"
                                        style={{ color: "#9e9e9e" }}
                                    >
                                        To
                                    </p>
                                    <p className="text-sm font-medium truncate">
                                        {route.destination.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Departure date */}
                        <div className="flex flex-col gap-1">
                            <label
                                htmlFor="departureDate"
                                className="text-xs font-medium uppercase tracking-widest"
                                style={{ color: "#9e9e9e" }}
                            >
                                Departure Date
                            </label>
                            <input
                                id="departureDate"
                                name="departureDate"
                                type="date"
                                value={departureDate}
                                onChange={(e) =>
                                    setDepartureDate(e.target.value)
                                }
                                required
                                className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none"
                                style={{
                                    background: "#1e1e1e",
                                    border: `1px solid ${validDepartureDate ? "#2a2a2a" : "#7f1d1d"}`,
                                    color: "#fff",
                                    colorScheme: "dark",
                                }}
                            />
                            {!validDepartureDate && (
                                <p
                                    className="text-xs mt-0.5"
                                    style={{ color: "#f87171" }}
                                >
                                    <FontAwesomeIcon
                                        icon={faInfoCircle}
                                        className="mr-1"
                                    />
                                    Date has already passed
                                </p>
                            )}
                        </div>

                        {/* Seats stepper */}
                        <div className="flex flex-col gap-1">
                            <label
                                className="text-xs font-medium uppercase tracking-widest"
                                style={{ color: "#9e9e9e" }}
                            >
                                Seats Available
                            </label>
                            <div
                                className="flex items-center rounded-xl overflow-hidden"
                                style={{
                                    background: "#1e1e1e",
                                    border: `1px solid ${validAvailableSeats ? "#2a2a2a" : "#7f1d1d"}`,
                                }}
                            >
                                <button
                                    type="button"
                                    className="px-5 py-3 text-xl font-light hover:bg-white/10 transition-colors select-none"
                                    onClick={() =>
                                        setAvailableSeats((s) =>
                                            Math.max(1, Number(s) - 1),
                                        )
                                    }
                                >
                                    −
                                </button>
                                <span className="flex-1 text-center text-sm font-semibold">
                                    {availableSeats}
                                </span>
                                <button
                                    type="button"
                                    className="px-5 py-3 text-xl font-light hover:bg-white/10 transition-colors select-none"
                                    onClick={() =>
                                        setAvailableSeats((s) => Number(s) + 1)
                                    }
                                >
                                    +
                                </button>
                            </div>
                            {!validAvailableSeats && (
                                <p
                                    className="text-xs mt-0.5"
                                    style={{ color: "#f87171" }}
                                >
                                    <FontAwesomeIcon
                                        icon={faInfoCircle}
                                        className="mr-1"
                                    />
                                    Must be at least 1
                                </p>
                            )}
                        </div>

                        {/* Max detour stepper */}
                        <div className="flex flex-col gap-1">
                            <label
                                className="text-xs font-medium uppercase tracking-widest"
                                style={{ color: "#9e9e9e" }}
                            >
                                Max Detour (minutes)
                            </label>
                            <div
                                className="flex items-center rounded-xl overflow-hidden"
                                style={{
                                    background: "#1e1e1e",
                                    border: `1px solid ${validMaxDetour ? "#2a2a2a" : "#7f1d1d"}`,
                                }}
                            >
                                <button
                                    type="button"
                                    className="px-5 py-3 text-xl font-light hover:bg-white/10 transition-colors select-none"
                                    onClick={() =>
                                        setMaxDetour((s) =>
                                            Math.max(1, Number(s) - 5),
                                        )
                                    }
                                >
                                    −
                                </button>
                                <span className="flex-1 text-center text-sm font-semibold">
                                    {maxDetour} min
                                </span>
                                <button
                                    type="button"
                                    className="px-5 py-3 text-xl font-light hover:bg-white/10 transition-colors select-none"
                                    onClick={() =>
                                        setMaxDetour((s) => Number(s) + 5)
                                    }
                                >
                                    +
                                </button>
                            </div>
                            {!validMaxDetour && (
                                <p
                                    className="text-xs mt-0.5"
                                    style={{ color: "#f87171" }}
                                >
                                    <FontAwesomeIcon
                                        icon={faInfoCircle}
                                        className="mr-1"
                                    />
                                    Must be at least 1 minute
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="w-full py-3 rounded-xl font-semibold text-sm mt-1 transition-opacity"
                            style={{
                                background:
                                    validDepartureDate &&
                                    validAvailableSeats &&
                                    validMaxDetour
                                        ? "#22c55e"
                                        : "#1a3a1a",
                                color:
                                    validDepartureDate &&
                                    validAvailableSeats &&
                                    validMaxDetour
                                        ? "#000"
                                        : "#4a6a4a",
                                cursor:
                                    validDepartureDate &&
                                    validAvailableSeats &&
                                    validMaxDetour
                                        ? "pointer"
                                        : "not-allowed",
                            }}
                            disabled={
                                !validDepartureDate ||
                                !validAvailableSeats ||
                                !validMaxDetour
                            }
                        >
                            Create Trip
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreateTrip;
