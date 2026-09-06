import { loadSuppliesData } from "./data.js";
import { initializeFilters } from "./filters.js";
import { initializeMap } from "./map.js";
import { initializeTable } from "./table.js";
import { initializeSelection } from "./selection.js";

let supplies = [];
let filteredSupplies = [];

const elements = {
dataStatus: document.getElementById("dataStatus"),
statusIndicator: document.getElementById("statusIndicator"),
lastUpdated: document.getElementById("lastUpdated"),
footerStatus: document.getElementById("footerStatus"),

mapTab: document.getElementById("mapTab"),
tableTab: document.getElementById("tableTab"),

mapView: document.getElementById("mapView"),
tableView: document.getElementById("tableView"),

supplyCount: document.getElementById("supplyCount"),
tableCount: document.getElementById("tableCount"),

clearFilters: document.getElementById("clearFilters")


};

/* --------------------------------------------------
Data loading
-------------------------------------------------- */

async function loadData() {
try {
setStatus("Loading...", "loading");

    const result = await loadSuppliesData();

    supplies = result.supplies;
    filteredSupplies = [...supplies];

    setStatus(
        `${supplies.length.toLocaleString()} supplies loaded`,
        "success"
    );

    updateTimestamp(result.updatedAt);

    render();

} catch (error) {
    console.error("Failed to load supplies data:", error);

    setStatus("Failed to load supplies data", "error");

    elements.footerStatus.textContent = "Unable to load data";
    elements.supplyCount.textContent = "Unable to load supplies";
    elements.tableCount.textContent = "Unable to load supplies";
}


}

/* --------------------------------------------------
Status
-------------------------------------------------- */

function setStatus(message, state) {
elements.dataStatus.textContent = message;

elements.statusIndicator.className = "status-indicator";

if (state === "success") {
    elements.statusIndicator.classList.add("success");
}

if (state === "error") {
    elements.statusIndicator.classList.add("error");
}

if (state === "success") {
    elements.footerStatus.textContent = message;
}


}

/* --------------------------------------------------
Timestamp
-------------------------------------------------- */

function updateTimestamp(updatedAt) {
if (!updatedAt) {
elements.lastUpdated.textContent = "Data updated: unknown";
return;
}

const date = new Date(updatedAt);

if (Number.isNaN(date.getTime())) {
    elements.lastUpdated.textContent = "Data updated: unknown";
    return;
}

elements.lastUpdated.dataset.timestamp = date.toISOString();

updateRelativeTime();


}

function updateRelativeTime() {
const timestamp = elements.lastUpdated.dataset.timestamp;

if (!timestamp) {
    return;
}

const date = new Date(timestamp);
const now = new Date();

const difference = Math.max(0, now.getTime() - date.getTime());

const seconds = Math.floor(difference / 1000);
const minutes = Math.floor(seconds / 60);
const hours = Math.floor(minutes / 60);
const days = Math.floor(hours / 24);

let relative;

if (seconds < 60) {
    relative = "just now";
} else if (minutes < 60) {
    relative = `${minutes} min${minutes === 1 ? "" : "s"} ago`;
} else if (hours < 24) {
    relative = `${hours} hour${hours === 1 ? "" : "s"} ago`;
} else {
    relative = `${days} day${days === 1 ? "" : "s"} ago`;
}

/*
 * Game server time is UTC-2.
 *
 * We display the actual timestamp in that timezone while
 * keeping the stored timestamp in UTC.
 */
const gameTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "Etc/GMT+2",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
}).format(date);

elements.lastUpdated.textContent =
    `Data updated: ${gameTime} (UTC−2) · ${relative}`;


}

/* --------------------------------------------------
Rendering
-------------------------------------------------- */

function render() {
elements.supplyCount.textContent =
${filteredSupplies.length.toLocaleString()} supplies;

elements.tableCount.textContent =
    `${filteredSupplies.length.toLocaleString()} supplies`;

window.suppliesMap?.render(filteredSupplies);
window.suppliesTable?.render(filteredSupplies);


}

/* --------------------------------------------------
Filtering
-------------------------------------------------- */

function applyFilters(result) {
filteredSupplies = result;
render();
}

/* --------------------------------------------------
Tabs
-------------------------------------------------- */

function activateTab(tab) {
const mapActive = tab === "map";

elements.mapTab.classList.toggle("active", mapActive);
elements.tableTab.classList.toggle("active", !mapActive);

elements.mapTab.setAttribute("aria-selected", String(mapActive));
elements.tableTab.setAttribute("aria-selected", String(!mapActive));

elements.mapView.classList.toggle("active", mapActive);
elements.tableView.classList.toggle("active", !mapActive);


}

elements.mapTab.addEventListener("click", () => {
activateTab("map");
});

elements.tableTab.addEventListener("click", () => {
activateTab("table");
});

/* --------------------------------------------------
Clear filters
-------------------------------------------------- */

elements.clearFilters.addEventListener("click", () => {
window.suppliesFilters?.clear();
});

/* --------------------------------------------------
Initialize modules
-------------------------------------------------- */

const map = initializeMap({
mapElement: document.getElementById("map"),
gridElement: document.getElementById("mapGrid"),
pointsElement: document.getElementById("mapPoints"),
selectionBoxElement: document.getElementById("selectionBox"),
resetButton: document.getElementById("resetMap")
});

window.suppliesMap = map;

const table = initializeTable({
tableBody: document.getElementById("tableBody")
});

window.suppliesTable = table;

const selection = initializeSelection({
mapElement: document.getElementById("map"),
pointsElement: document.getElementById("mapPoints"),
selectionBoxElement: document.getElementById("selectionBox"),
selectionInfoElement: document.getElementById("selectionInfo"),
selectionCountElement: document.getElementById("selectionCount"),
copyButton: document.getElementById("copySelection")
});

window.suppliesSelection = selection;

const filters = initializeFilters({
levelFilter: document.getElementById("levelFilter"),
searchInput: document.getElementById("searchInput"),
onChange: applyFilters
});

window.suppliesFilters = filters;

/* --------------------------------------------------
Start
-------------------------------------------------- */

loadData();

/*

Keep the relative timestamp fresh without reloading data.
*/
setInterval(updateRelativeTime, 30_000);
