const DATA_URL = "./data/test-data.json";
const TIMESTAMP_URL = "./data/last-updated.json";

/**
 * Load the supplies data and timestamp.
 */
export async function loadSuppliesData() {
    const [dataResponse, timestampResponse] = await Promise.all([
        fetch(DATA_URL, {
            cache: "no-store"
        }),
        fetch(TIMESTAMP_URL, {
            cache: "no-store"
        })
    ]);

    if (!dataResponse.ok) {
        throw new Error(
            `Failed to load supplies data: HTTP ${dataResponse.status}`
        );
    }

    if (!timestampResponse.ok) {
        throw new Error(
            `Failed to load timestamp: HTTP ${timestampResponse.status}`
        );
    }

    const data = await dataResponse.json();
    const timestamp = await timestampResponse.json();

    return {
        supplies: normalizeSupplies(data),
        updatedAt: extractTimestamp(timestamp)
    };
}

/**
 * Convert the API response into the simple structure
 * used by the map, table, filters and selection system.
 */
function normalizeSupplies(data) {
    if (!data || !Array.isArray(data.strongholds)) {
        throw new Error("Invalid supplies data format.");
    }

    const supplies = [];

    for (const level of data.strongholds) {
        if (!Array.isArray(level.coordinates)) {
            continue;
        }

        for (const coordinate of level.coordinates) {
            if (
                typeof coordinate?.x !== "number" ||
                typeof coordinate?.y !== "number"
            ) {
                continue;
            }

            supplies.push({
                x: coordinate.x,
                y: coordinate.y,
                level: level.level,
                label: level.label,
                color: level.color
            });
        }
    }

    return supplies;
}

/**
 * The workflow may store the timestamp in slightly different
 * formats. Keep the frontend tolerant of those formats.
 */
function extractTimestamp(timestamp) {
    if (!timestamp) {
        return null;
    }

    if (typeof timestamp === "string") {
        return timestamp;
    }

    if (typeof timestamp === "object") {
        return (
            timestamp.timestamp ??
            timestamp.updatedAt ??
            timestamp.lastUpdated ??
            null
        );
    }

    return null;
}
