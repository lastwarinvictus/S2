let mapElement;
let gridElement;
let pointsElement;
let resetButton;

let currentSupplies = [];

const MAP_SIZE = 1000;
const GRID_SIZE = 13;

let scale = 1;
let offsetX = 0;
let offsetY = 0;

let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let initialOffsetX = 0;
let initialOffsetY = 0;

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
setupInteraction();
updateTransform();

resetButton?.addEventListener(
    "click",
    resetView
);


return {
    render,
    resetView,
    getTransform
};


}

/* --------------------------------------------------
Grid
-------------------------------------------------- */

function createGrid() {
gridElement.innerHTML = "";

for (let i = 0; i <= GRID_SIZE; i++) {
    const percentage =
        (i / GRID_SIZE) * 100;


    /*
     * Vertical line
     */
    const vertical =
        document.createElement("div");

    vertical.className =
        "grid-line grid-line-vertical";

    vertical.style.left =
        `${percentage}%`;

    gridElement.appendChild(vertical);


    /*
     * Horizontal line
     */
    const horizontal =
        document.createElement("div");

    horizontal.className =
        "grid-line grid-line-horizontal";

    horizontal.style.top =
        `${percentage}%`;

    gridElement.appendChild(horizontal);


    /*
     * Coordinate labels.
     *
     * We only need labels for the 13 grid divisions,
     * not the final duplicate line.
     */
    if (i < GRID_SIZE) {
        const xLabel =
            document.createElement("span");

        xLabel.className =
            "grid-label grid-label-x";

        xLabel.textContent =
            `${Math.round(
                (i / GRID_SIZE) * MAP_SIZE
            )}`;

        xLabel.style.left =
            `${percentage}%`;

        gridElement.appendChild(xLabel);


        const yLabel =
            document.createElement("span");

        yLabel.className =
            "grid-label grid-label-y";

        yLabel.textContent =
            `${Math.round(
                (i / GRID_SIZE) * MAP_SIZE
            )}`;

        yLabel.style.top =
            `${percentage}%`;

        gridElement.appendChild(yLabel);
    }
}


}

/* --------------------------------------------------
Render supplies
-------------------------------------------------- */

function render(supplies) {
currentSupplies =
Array.isArray(supplies)
? supplies
: [];

pointsElement.innerHTML = "";


for (const supply of currentSupplies) {
    const point =
        document.createElement("button");

    point.type = "button";

    point.className =
        "supply-point";


    point.dataset.x =
        String(supply.x);

    point.dataset.y =
        String(supply.y);

    point.dataset.level =
        String(supply.level);


    point.setAttribute(
        "aria-label",
        `Level ${supply.level} supply at ` +
        `${supply.x}, ${supply.y}`
    );


    /*
     * The API uses a 0–999 coordinate system.
     * Convert it to percentage positioning.
     */
    point.style.left =
        `${(supply.x / MAP_SIZE) * 100}%`;

    point.style.top =
        `${(supply.y / MAP_SIZE) * 100}%`;


    /*
     * Preserve the level colour supplied by the API.
     */
    if (supply.color) {
        point.style.setProperty(
            "--supply-color",
            supply.color
        );
    }


    /*
     * Some data structures may store the colour on
     * the level object rather than directly on supply.
     */
    if (!supply.color && supply.levelColor) {
        point.style.setProperty(
            "--supply-color",
            supply.levelColor
        );
    }


    pointsElement.appendChild(point);
}


updateTransform();


}

/* --------------------------------------------------
Pan / zoom
-------------------------------------------------- */

function setupInteraction() {

/*
 * Wheel zoom
 */
mapElement.addEventListener(
    "wheel",
    event => {
        event.preventDefault();

        const rect =
            mapElement.getBoundingClientRect();


        const mouseX =
            event.clientX - rect.left;

        const mouseY =
            event.clientY - rect.top;


        const zoomFactor =
            event.deltaY < 0
                ? 1.12
                : 0.89;


        const newScale =
            clamp(
                scale * zoomFactor,
                1,
                8
            );


        /*
         * Keep the point underneath the mouse
         * stationary while zooming.
         */
        const mapX =
            (mouseX - offsetX) / scale;

        const mapY =
            (mouseY - offsetY) / scale;


        offsetX =
            mouseX - mapX * newScale;

        offsetY =
            mouseY - mapY * newScale;


        scale = newScale;

        constrainPan();
        updateTransform();
    },
    { passive: false }
);


/*
 * Pan
 */
mapElement.addEventListener(
    "pointerdown",
    event => {

        /*
         * Only pan with the middle mouse button
         * or when holding Space.
         *
         * Left mouse remains available for
         * rectangle selection.
         */
        const panRequested =
            event.button === 1 ||
            event.button === 2 ||
            event.shiftKey ||
            event.altKey;


        if (!panRequested) {
            return;
        }


        event.preventDefault();

        dragging = true;

        dragStartX =
            event.clientX;

        dragStartY =
            event.clientY;

        initialOffsetX =
            offsetX;

        initialOffsetY =
            offsetY;


        mapElement.setPointerCapture(
            event.pointerId
        );

        mapElement.classList.add(
            "is-panning"
        );
    }
);


mapElement.addEventListener(
    "pointermove",
    event => {
        if (!dragging) {
            return;
        }


        offsetX =
            initialOffsetX +
            (event.clientX - dragStartX);

        offsetY =
            initialOffsetY +
            (event.clientY - dragStartY);


        constrainPan();
        updateTransform();
    }
);


mapElement.addEventListener(
    "pointerup",
    stopDragging
);

mapElement.addEventListener(
    "pointercancel",
    stopDragging
);


/*
 * Prevent the browser context menu when using
 * right-click to pan.
 */
mapElement.addEventListener(
    "contextmenu",
    event => {
        if (dragging) {
            event.preventDefault();
        }
    }
);


}

/* --------------------------------------------------
Stop panning
-------------------------------------------------- */

function stopDragging(event) {
if (!dragging) {
return;
}

dragging = false;

mapElement.classList.remove(
    "is-panning"
);


try {
    mapElement.releasePointerCapture(
        event.pointerId
    );
} catch {
    // Pointer capture may already be released.
}


}

/* --------------------------------------------------
Transform
-------------------------------------------------- */

function updateTransform() {
    /*
     * The grid and points share exactly the same transform.
     */
    const transform =
        `translate(${offsetX}px, ${offsetY}px) ` +
        `scale(${scale})`;

    gridElement.style.transform = transform;
    pointsElement.style.transform = transform;
}


/* --------------------------------------------------
Pan constraints
-------------------------------------------------- */

function constrainPan() {
const rect =
mapElement.getBoundingClientRect();

/*
 * At scale 1 the map fills the viewport.
 * Once zoomed, the scaled map may extend beyond
 * the viewport and can be panned.
 */
const mapWidth =
    rect.width * scale;

const mapHeight =
    rect.height * scale;


if (scale <= 1) {
    offsetX = 0;
    offsetY = 0;
    return;
}


const minX =
    rect.width - mapWidth;

const minY =
    rect.height - mapHeight;


offsetX =
    clamp(
        offsetX,
        minX,
        0
    );

offsetY =
    clamp(
        offsetY,
        minY,
        0
    );


}

/* --------------------------------------------------
Reset
-------------------------------------------------- */

function resetView() {
scale = 1;

offsetX = 0;
offsetY = 0;

updateTransform();


}

/* --------------------------------------------------
Helpers
-------------------------------------------------- */

function clamp(value, min, max) {
return Math.min(
Math.max(value, min),
max
);
}

/* --------------------------------------------------
Public transform information
-------------------------------------------------- */

function getTransform() {
return {
scale,
offsetX,
offsetY
};
}
