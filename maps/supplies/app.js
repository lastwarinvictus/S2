const DATA_URL = "./data/test-data.json";
const METADATA_URL = "./data/last-updated.json";

let supplies = [];
let updateTimestamp = null;

document.addEventListener("DOMContentLoaded", loadData);

async function loadData() {
    const output = document.getElementById("map");

    try {
        const [dataResponse, metadataResponse] = await Promise.all([
            fetch(DATA_URL),
            fetch(METADATA_URL)
        ]);

        if (!dataResponse.ok) {
            throw new Error(
                `Failed to load supplies data: ${dataResponse.status}`
            );
        }

        if (!metadataResponse.ok) {
            throw new Error(
                `Failed to load update metadata: ${metadataResponse.status}`
            );
        }

        const data = await dataResponse.json();
        const metadata = await metadataResponse.json();

        updateTimestamp = metadata.updatedAt;

        processSupplies(data);
        populateLevelFilter();
        renderMap();
        renderTable();
        updateTimestampDisplay();

        // Update relative time without making additional requests.
        setInterval(updateTimestampDisplay, 10000);

    } catch (error) {
        console.error(error);

        output.textContent = "Failed to load supplies data.";
        output.classList.add("error");
    }
}

function processSupplies(data) {
    supplies = [];

    if (!Array.isArray(data.strongholds)) {
        return;
    }

    for (const levelGroup of data.strongholds) {
        const level = levelGroup.level;
        const color = levelGroup.color;
        const label = levelGroup.label;

        if (!Array.isArray(levelGroup.coordinates)) {
            continue;
        }

        for (const coordinate of levelGroup.coordinates) {
            supplies.push({
                level,
                color,
                label,
                x: coordinate.x,
                y: coordinate.y
            });
        }
    }

    const countElement = document.getElementById("supplyCount");

    if (countElement) {
        countElement.textContent = supplies.length.toLocaleString();
    }
}

function populateLevelFilter() {
    const filter = document.getElementById("levelFilter");

    if (!filter) {
        return;
    }

    const levels = [...new Set(supplies.map(supply => supply.level))]
        .sort((a, b) => a - b);

    filter.innerHTML = '<option value="all">All Levels</option>';

    for (const level of levels) {
        const option = document.createElement("option");

        option.value = level;
        option.textContent = `Level ${level}`;

        filter.appendChild(option);
    }

    filter.addEventListener("change", renderTable);

    document
        .getElementById("searchInput")
        .addEventListener("input", renderTable);
}

function getFilteredSupplies() {
    const searchInput = document.getElementById("searchInput");
    const levelFilter = document.getElementById("levelFilter");

    const search = searchInput.value.trim().toLowerCase();
    const selectedLevel = levelFilter.value;

    return supplies.filter(supply => {
        const matchesLevel =
            selectedLevel === "all" ||
            String(supply.level) === selectedLevel;

        const matchesSearch =
            !search ||
            String(supply.x).includes(search) ||
            String(supply.y).includes(search) ||
            String(supply.level).includes(search);

        return matchesLevel && matchesSearch;
    });
}

function renderTable() {
    const tbody = document.getElementById("supplyTableBody");

    if (!tbody) {
        return;
    }

    const filtered = getFilteredSupplies();

    tbody.innerHTML = "";

    for (const supply of filtered) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <span
                    class="level-dot"
                    style="background-color: ${escapeHtml(supply.color)}"
                ></span>
                Level ${supply.level}
            </td>
            <td>${supply.x}</td>
            <td>${supply.y}</td>
        `;

        tbody.appendChild(row);
    }
}

function renderMap() {
    const map = document.getElementById("map");

    if (!map) {
        return;
    }

    map.innerHTML = "";

    for (const supply of supplies) {
        const marker = document.createElement("div");

        marker.className = "supply-marker";
        marker.style.left = `${supply.x / 10}%`;
        marker.style.top = `${supply.y / 10}%`;
        marker.style.backgroundColor = supply.color;

        marker.title =
            `${supply.label} — X: ${supply.x}, Y: ${supply.y}`;

        map.appendChild(marker);
    }
}

function updateTimestampDisplay() {
    const element = document.getElementById("dataUpdated");

    if (!element || !updateTimestamp) {
        return;
    }

    const date = new Date(updateTimestamp);

    if (Number.isNaN(date.getTime())) {
        element.textContent = "Data update time unavailable";
        return;
    }

    element.textContent =
        `Updated ${formatRelativeTime(date)} • ` +
        `${formatGameTime(date)} (UTC−2)`;
}

function formatGameTime(date) {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: "Etc/GMT+2",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(date);
}

function formatRelativeTime(date) {
    const difference = Math.max(0, Date.now() - date.getTime());

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 10) {
        return "just now";
    }

    if (seconds < 60) {
        return `${seconds} seconds ago`;
    }

    if (minutes < 60) {
        return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }

    if (hours < 24) {
        return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }

    return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
