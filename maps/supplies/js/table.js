let tableBody = null;
let currentSupplies = [];

/* --------------------------------------------------
Initialize
-------------------------------------------------- */

export function initializeTable({
tableBody: body
}) {
tableBody = body;

return {
    render,
    getSupplies: () => [...currentSupplies]
};


}

/* --------------------------------------------------
Render
-------------------------------------------------- */

function render(supplies) {
currentSupplies = Array.isArray(supplies)
? supplies
: [];

tableBody.innerHTML = "";

if (currentSupplies.length === 0) {
    renderEmptyState();
    return;
}

const fragment = document.createDocumentFragment();

currentSupplies.forEach((supply, index) => {
    const row = document.createElement("tr");

    row.dataset.index = index;
    row.dataset.x = supply.x;
    row.dataset.y = supply.y;

    const levelCell = document.createElement("td");
    const xCell = document.createElement("td");
    const yCell = document.createElement("td");

    levelCell.textContent =
        supply.label || `Level ${supply.level}`;

    xCell.textContent = supply.x;
    yCell.textContent = supply.y;

    /*
     * Give the level cell the same color as its
     * corresponding map marker.
     */
    levelCell.style.color =
        supply.color || "#ffffff";

    levelCell.style.fontWeight = "600";

    row.appendChild(levelCell);
    row.appendChild(xCell);
    row.appendChild(yCell);

    /*
     * Clicking a row will eventually focus the map
     * on that coordinate.
     *
     * For now we dispatch a custom event so this
     * module doesn't need to know anything about
     * the map implementation.
     */
    row.addEventListener("click", () => {
        window.dispatchEvent(
            new CustomEvent("supply-selected", {
                detail: {
                    supply
                }
            })
        );
    });

    fragment.appendChild(row);
});

tableBody.appendChild(fragment);


}

/* --------------------------------------------------
Empty state
-------------------------------------------------- */

function renderEmptyState() {
const row = document.createElement("tr");
const cell = document.createElement("td");

cell.colSpan = 3;
cell.textContent = "No supplies match the current filters.";

cell.style.textAlign = "center";
cell.style.padding = "30px";
cell.style.color = "var(--muted)";

row.appendChild(cell);
tableBody.appendChild(row);


}
