// src/utils/formatTimestamp.js

export const formatTimestamp = (timestamp, showTime = false, timeOnly = false) => {
    const defaultTimestamp = { seconds: 0, nanoseconds: 0 };
    const { seconds, nanoseconds } = timestamp || defaultTimestamp;

    const date = new Date(seconds * 1000 + nanoseconds / 1000000);

    const dateOptions = { day: "numeric", month: "short", year: "numeric" };
    // UPDATED: Added hour12: true for AM/PM format
    const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: true }; 

    const formattedTime = date.toLocaleTimeString("en-US", timeOptions);
    
    // NEW LOGIC: If timeOnly is true, return only the formatted time (e.g., 11:24 AM)
    if (timeOnly) {
        return formattedTime;
    }

    const formattedDate = date.toLocaleDateString("en-US", dateOptions);

    const day = date.getDate();
    const suffix = day >= 11 && day <= 13 ? "th" : day % 10 === 1 ? "st" : day % 10 === 2 ? "nd" : day % 10 === 3 ? "rd" : "th";

    const finalDate = formattedDate.replace(/(\d+)/, `$1${suffix}`);

    return showTime ? `${finalDate} · ${formattedTime}` : finalDate;
};