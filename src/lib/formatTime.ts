/**
 * Converts a Unix-ms timestamp, ISO string, or pre-formatted time string into
 * a clean "8:15 AM" display. Returns "" for garbage / missing values so
 * renderers can safely concatenate.
 */
export function formatTime(
    value: number | string | undefined | null
): string {
    if (value === undefined || value === null) return "";

    if (typeof value === "string") {
        // Already formatted like "8:15 AM"? Pass through.
        if (/^\d{1,2}:\d{2}\s?(AM|PM)?$/i.test(value.trim())) return value;
        const parsed = new Date(value);
        if (isNaN(parsed.getTime())) return "";
        return parsed.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        });
    }

    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return "";
    return parsed.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
}