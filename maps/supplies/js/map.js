const GRID_SIZE = 13;
const WORLD_SIZE = 1000;

let mapElement;
let gridElement;
let pointsElement;
let resetButton;

let supplies = [];

let view = {
scale: 1,
x: 0,
y: 0
};

let dragging = false;
let dragStart = null;
let dragOrigin = null;

/* --------------------------------------------------
Initialize
-------------------------------------------------- */

export function initializeMap({
mapElement: map,
gridElement: grid,
pointsElement: points,
resetButton: reset
}) {
mapElement = map;
gridElement = grid;
pointsElement = points;
resetButton = reset;

createGrid();
setupPan();
setupReset();

renderTransform();

return {
    render,
    reset,
    getView: () => ({ ...view })
};


}

/* --------------------------------------------------
Grid
-------------------------------------------------- */

function createGrid() {
gridElement.innerHTML = "";

for (let row = 0; row < GRID_SIZE; row++) {
    for (let column = 0; column < GRID_SIZE; column++) {
        const cell = document.createElement("div");

        cell.className = "grid-cell";

        cell.dataset.row = row;
        cell.dataset.column = column;

        gridElement.appendChild(cell);
    }
}


}

/* --------------------------------------------------
Rendering
-------------------------------------------------- */

function render(newSupplies) {
supplies = Array.isArray(newSupplies)
? newSupplies
: [];

pointsElement.innerHTML = "";

const fragment = document.createDocumentFragment();

for (const supply of supplies) {
    const point = document.createElement("div");

    point.className = "supply-point";

    point.dataset.x = supply.x;
    point.dataset.y = supply.y;
    point.dataset.level = supply.level;

    point.title =
        `${supply.label || `Level ${supply.level}`} — ` +
        `X: ${supply.x}, Y: ${supply.y}`;

    point.style.backgroundColor =
        supply.color || getDefaultLevelColor(supply.level);

    const position = coordinateToPercent(
        supply.x,
        supply.y
    );

    point.style.left = `${position.x}%`;
    point.style.top = `${position.y}%`;

    fragment.appendChild(point);
}

pointsElement.appendChild(fragment);


}

/* --------------------------------------------------
Coordinate conversion
-------------------------------------------------- */

/**

The API uses a 0–999 coordinate system.
The map itself is represented as a 13×13 grid.
The grid is visual; coordinates remain in the original
world coordinate system.
*/
function coordinateToPercent(x, y) {
return {
x: clamp((x / WORLD_SIZE) * 100, 0, 100),
y: clamp((y / WORLD_SIZE) * 100, 0, 100)
};
}

/* --------------------------------------------------
Pan
-------------------------------------------------- */

function setupPan() {
mapElement.addEventListener("pointerdown", event => {
/*
* Don't start panning when interacting with a supply.
*/
if (event.target.closest(".supply-point")) {
return;
}

    dragging = true;

    mapElement.setPointerCapture(event.pointerId);

    dragStart = {
        x: event.clientX,
        y: event.clientY
    };

    dragOrigin = {
        x: view.x,
        y: view.y
    };
});


mapElement.addEventListener("pointermove", event => {
    if (!dragging) {
        return;
    }

    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;

    view.x = dragOrigin.x + dx;
    view.y = dragOrigin.y + dy;

    renderTransform();
});


const stopDragging = event => {
    if (!dragging) {
        return;
    }

    dragging = false;

    try {
        mapElement.releasePointerCapture(event.pointerId);
    } catch {
        // Pointer capture may already have been released.
    }
};


mapElement.addEventListener("pointerup", stopDragging);
mapElement.addEventListener("pointercancel", stopDragging);
mapElement.addEventListener("pointerleave", event => {
    if (event.buttons === 0) {
        stopDragging(event);
    }
});


}

/* --------------------------------------------------
Zoom
-------------------------------------------------- */

mapElement?.addEventListener("wheel", event => {
event.preventDefault();

const direction = event.deltaY < 0 ? 1 : -1;

const factor = direction > 0
    ? 1.1
    : 0.9;

const oldScale = view.scale;

const newScale = clamp(
    oldScale * factor,
    0.5,
    5
);

/*
 * Zoom around the cursor instead of the center.
 */
const rect = mapElement.getBoundingClientRect();

const mouseX = event.clientX - rect.left;
const mouseY = event.clientY - rect.top;

view.x =
    mouseX -
    ((mouseX - view.x) / oldScale) * newScale;

view.y =
    mouseY -
    ((mouseY - view.y) / oldScale) * newScale;

view.scale = newScale;

renderTransform();


}, { passive: false });

/* --------------------------------------------------
Transform
-------------------------------------------------- */

function renderTransform() {
const transform =
translate(${view.x}px, ${view.y}px) scale(${view.scale});

/*
 * Transform the map contents together.
 *
 * The grid and points are both positioned in the same
 * coordinate space.
 */
gridElement.style.transform = transform;
pointsElement.style.transform = transform;

gridElement.style.transformOrigin = "0 0";
pointsElement.style.transformOrigin = "0 0";


}

/* --------------------------------------------------
Reset
-------------------------------------------------- */

function setupReset() {
resetButton?.addEventListener("click", reset);
}

function reset() {
view = {
scale: 1,
x: 0,
y: 0
};

renderTransform();


}

/* --------------------------------------------------
Helpers
-------------------------------------------------- */

function clamp(value, min, max) {
return Math.min(Math.max(value, min), max);
}

function getDefaultLevelColor(level) {
const colors = {
1: "#FF0000",
2: "#00FF00",
3: "#0000FF",
4: "#FFFF00",
5: "#FF00FF",
6: "#00FFFF",
7: "#FFA500"
};

return colors[level] || "#FFFFFF";


}
