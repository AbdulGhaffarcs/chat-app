export const formatTimestamp = (timestamp, showTime = false) => {
    const defaultTimestamp = { seconds: 0, nanoseconds: 0 };
    const { seconds, nanoseconds } = timestamp || defaultTimestamp;

    const date = new Date(seconds * 1000 + nanoseconds / 1000000);

    const dateOptions = { day: "numeric", month: "short", year: "numeric" };
    const timeOptions = { hour: "2-digit", minute: "2-digit" };

    const formattedDate = date.toLocaleDateString("en-US", dateOptions);
    const formattedTime = date.toLocaleTimeString("en-US", timeOptions);

    const day = date.getDate();
    const suffix = day >= 11 && day <= 13 ? "th" : day % 10 === 1 ? "st" : day % 10 === 2 ? "nd" : day % 10 === 3 ? "rd" : "th";

    const finalDate = formattedDate.replace(/(\d+)/, `$1${suffix}`);

    return showTime ? `${finalDate} · ${formattedTime}` : finalDate;
};