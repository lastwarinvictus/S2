import { loadSuppliesData } from "./data.js";
import { initializeFilters } from "./filters.js";
import { initializeMap } from "./map.js";
import { initializeTable } from "./table.js";
import { initializeSelection } from "./selection.js";

let supplies = [];
let filteredSupplies = [];

/* --------------------------------------------------
DOM
-------------------------------------------------- */

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

clearFilters: document.getElementById("clearFilters"),

levelFilter: document.getElementById("levelFilter"),
searchInput: document.getElementById("searchInput"),

map: document.getElementById("map"),
mapGrid: document.getElementById("mapGrid"),
mapPoints: document.getElementById("mapPoints"),
selectionBox: document.getElementById("selectionBox"),

selectionInfo: document.getElementById("selectionInfo"),
selectionCount: document.getElementById("selectionCount"),
copySelection: document.getElementById("copySelection"),
clearSelection: document.getElementById("clearSelection"),

resetMap: document.getElementById("resetMap"),

tableBody: document.getElementById("tableBody")


};

/* --------------------------------------------------
Modules
-------------------------------------------------- */

const map = initializeMap({
mapElement: elements.map,
gridElement: elements.mapGrid,
pointsElement: elements.mapPoints,
resetButton: elements.resetMap
});

window.s2SuppliesMap = map;

const table = initializeTable({
tableBody: elements.tableBody
});

const selection = initializeSelection({
mapElement: elements.map,
pointsElement: elements.mapPoints,
selectionBoxElement: elements.selectionBox,
selectionInfoElement: elements.selectionInfo,
selectionCountElement: elements.selectionCount,
copyButton: elements.copySelection,
clearButton: elements.clearSelection
});

const filters = initializeFilters({
levelFilter: elements.levelFilter,
searchInput: elements.searchInput,
onChange: handleFilterChange
});

/* --------------------------------------------------
Data loading
-------------------------------------------------- */

async function loadData() {
try {
setStatus("Loading...", "loading");

    const result = await loadSuppliesData();

    supplies = result.supplies;
    filteredSupplies = [...supplies];

    /*
     * Give the filters their complete dataset.
     */
    filters.setData(supplies);

    /*
     * Selection needs to know which currently-visible
     * supplies it is allowed to select.
     */
    selection.setSupplies(filteredSupplies);

    render();

    setStatus(
        `${supplies.length.toLocaleString()} supplies loaded`,
        "success"
    );

    updateTimestamp(result.updatedAt);

} catch (error) {
    console.error(
        "Failed to load supplies data:",
        error
    );

    setStatus(
        "Failed to load supplies data",
        "error"
    );

    elements.footerStatus.textContent =
        "Unable to load data";

    elements.supplyCount.textContent =
        "Unable to load supplies";

    elements.tableCount.textContent =
        "Unable to load supplies";
}


}

/* --------------------------------------------------
Filtering
-------------------------------------------------- */

function handleFilterChange(filtered) {
filteredSupplies = [...filtered];

/*
 * A filter change should also clear any previous
 * selection because the selected coordinates may no
 * longer be visible.
 */
selection.setSupplies(filteredSupplies);

render();


}

/* --------------------------------------------------
Rendering
-------------------------------------------------- */

function render() {
const count = filteredSupplies.length;

elements.supplyCount.textContent =
    `${count.toLocaleString()} supplies`;

elements.tableCount.textContent =
    `${count.toLocaleString()} supplies`;

map.render(filteredSupplies);
table.render(filteredSupplies);


}

/* --------------------------------------------------
Status
-------------------------------------------------- */

function setStatus(message, state) {
elements.dataStatus.textContent = message;

elements.statusIndicator.className =
    "status-indicator";

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
elements.lastUpdated.textContent =
"Data updated: unknown";

    return;
}

const date = new Date(updatedAt);

if (Number.isNaN(date.getTime())) {
    elements.lastUpdated.textContent =
        "Data updated: unknown";

    return;
}

elements.lastUpdated.dataset.timestamp =
    date.toISOString();

updateRelativeTime();


}

function updateRelativeTime() {
const timestamp =
elements.lastUpdated.dataset.timestamp;

if (!timestamp) {
    return;
}

const date = new Date(timestamp);
const now = new Date();

const difference =
    Math.max(
        0,
        now.getTime() - date.getTime()
    );

const seconds =
    Math.floor(difference / 1000);

const minutes =
    Math.floor(seconds / 60);

const hours =
    Math.floor(minutes / 60);

const days =
    Math.floor(hours / 24);


let relative;

if (seconds < 60) {
    relative = "just now";
} else if (minutes < 60) {
    relative =
        `${minutes} min${minutes === 1 ? "" : "s"} ago`;
} else if (hours < 24) {
    relative =
        `${hours} hour${hours === 1 ? "" : "s"} ago`;
} else {
    relative =
        `${days} day${days === 1 ? "" : "s"} ago`;
}


/*
 * Game server time = UTC-2.
 *
 * Etc/GMT+2 is intentionally correct here:
 * the Etc/GMT identifiers use reversed signs.
 */
const gameTime =
    new Intl.DateTimeFormat("en-US", {
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
Tabs
-------------------------------------------------- */

function activateTab(tab) {
const mapActive =
tab === "map";

elements.mapTab.classList.toggle(
    "active",
    mapActive
);

elements.tableTab.classList.toggle(
    "active",
    !mapActive
);


elements.mapTab.setAttribute(
    "aria-selected",
    String(mapActive)
);

elements.tableTab.setAttribute(
    "aria-selected",
    String(!mapActive)
);


elements.mapView.classList.toggle(
    "active",
    mapActive
);

elements.tableView.classList.toggle(
    "active",
    !mapActive
);

elements.mapView.hidden = !mapActive;
elements.tableView.hidden = mapActive;   

}

elements.mapTab.addEventListener(
"click",
() => activateTab("map")
);

elements.tableTab.addEventListener(
"click",
() => activateTab("table")
);

/* --------------------------------------------------
Clear filters
-------------------------------------------------- */

elements.clearFilters.addEventListener(
"click",
() => filters.clear()
);

/* --------------------------------------------------
Start
-------------------------------------------------- */

loadData();

/*

Keep the relative time display fresh.
*/
setInterval(
updateRelativeTime,
30_000
);
