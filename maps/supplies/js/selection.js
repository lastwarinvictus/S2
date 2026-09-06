let mapElement = null;
let pointsElement = null;
let selectionBoxElement = null;
let selectionInfoElement = null;
let selectionCountElement = null;
let copyButton = null;

let supplies = [];
let selectedSupplies = [];

let selecting = false;
let startPoint = null;

/* --------------------------------------------------
Initialize
-------------------------------------------------- */

export function initializeSelection({
mapElement: map,
pointsElement: points,
selectionBoxElement: selectionBox,
selectionInfoElement: selectionInfo,
selectionCountElement: selectionCount,
copyButton: copy
}) {
mapElement = map;
pointsElement = points;
selectionBoxElement = selectionBox;

selectionInfoElement = selectionInfo;
selectionCountElement = selectionCount;
copyButton = copy;

setupPointerSelection();
setupCopyButton();

return {
    setSupplies,
    clearSelection,
    getSelected: () => [...selectedSupplies]
};


}

/* --------------------------------------------------
Supplies
-------------------------------------------------- */

function setSupplies(newSupplies) {
supplies = Array.isArray(newSupplies)
? newSupplies
: [];

clearSelection();


}

/* --------------------------------------------------
Pointer selection
-------------------------------------------------- */

function setupPointerSelection() {
mapElement.addEventListener("pointerdown", event => {

    /*
     * Only begin a rectangle selection with the primary
     * mouse button.
     */
    if (event.button !== 0) {
        return;
    }

    /*
     * Clicking directly on a supply is reserved for
     * point interaction.
     */
    if (event.target.closest(".supply-point")) {
        return;
    }

    const rect = mapElement.getBoundingClientRect();

    startPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    selecting = true;

    selectionBoxElement.classList.add("active");

    selectionBoxElement.style.left =
        `${startPoint.x}px`;

    selectionBoxElement.style.top =
        `${startPoint.y}px`;

    selectionBoxElement.style.width = "0px";
    selectionBoxElement.style.height = "0px";

    mapElement.setPointerCapture(event.pointerId);
});


mapElement.addEventListener("pointermove", event => {
    if (!selecting) {
        return;
    }

    const rect = mapElement.getBoundingClientRect();

    const currentPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    updateSelectionBox(currentPoint);
});


mapElement.addEventListener("pointerup", event => {
    if (!selecting) {
        return;
    }

    const rect = mapElement.getBoundingClientRect();

    const endPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    finishSelection(endPoint);

    try {
        mapElement.releasePointerCapture(event.pointerId);
    } catch {
        // Pointer capture may already have been released.
    }
});


mapElement.addEventListener("pointercancel", cancelSelection);


}

/* --------------------------------------------------
Selection rectangle
-------------------------------------------------- */

function updateSelectionBox(point) {
const bounds = getBounds(startPoint, point);

selectionBoxElement.style.left =
    `${bounds.left}px`;

selectionBoxElement.style.top =
    `${bounds.top}px`;

selectionBoxElement.style.width =
    `${bounds.width}px`;

selectionBoxElement.style.height =
    `${bounds.height}px`;


}

function getBounds(a, b) {
const left = Math.min(a.x, b.x);
const top = Math.min(a.y, b.y);

const right = Math.max(a.x, b.x);
const bottom = Math.max(a.y, b.y);

return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top
};


}

/* --------------------------------------------------
Finish selection
-------------------------------------------------- */

function finishSelection(endPoint) {
selecting = false;

const bounds = getBounds(
    startPoint,
    endPoint
);

/*
 * Ignore accidental clicks where the rectangle is
 * effectively zero-sized.
 */
if (
    bounds.width < 4 &&
    bounds.height < 4
) {
    cancelSelection();
    return;
}

selectedSupplies = [];

const mapRect = mapElement.getBoundingClientRect();

/*
 * Convert each supply's screen position into map-local
 * coordinates and test whether it falls inside the
 * selection rectangle.
 */
for (const supply of supplies) {
    const point = getSupplyScreenPosition(
        supply,
        mapRect
    );

    if (
        point.x >= bounds.left &&
        point.x <= bounds.right &&
        point.y >= bounds.top &&
        point.y <= bounds.bottom
    ) {
        selectedSupplies.push(supply);
    }
}

applySelectionState();


}

/* --------------------------------------------------
Coordinate → screen position
-------------------------------------------------- */

function getSupplyScreenPosition(supply, mapRect) {
/*
* The current map uses a 0–999 coordinate system.
*/
const x =
(supply.x / 1000) * mapRect.width;

const y =
    (supply.y / 1000) * mapRect.height;

return {
    x,
    y
};


}

/* --------------------------------------------------
Visual selection state
-------------------------------------------------- */

function applySelectionState() {
const selectedKeys = new Set(
selectedSupplies.map(
supply => ${supply.x},${supply.y},${supply.level}
)
);

pointsElement
    .querySelectorAll(".supply-point")
    .forEach(point => {
        const key =
            `${point.dataset.x},` +
            `${point.dataset.y},` +
            `${point.dataset.level}`;

        point.classList.toggle(
            "selected",
            selectedKeys.has(key)
        );
    });

updateSelectionInfo();


}

/* --------------------------------------------------
Selection information
-------------------------------------------------- */

function updateSelectionInfo() {
const count = selectedSupplies.length;

if (count === 0) {
    selectionInfoElement.classList.add("hidden");
    copyButton.disabled = true;

    selectionCountElement.textContent =
        "0 supplies selected";

    return;
}

selectionInfoElement.classList.remove("hidden");

copyButton.disabled = false;

selectionCountElement.textContent =
    `${count.toLocaleString()} ` +
    `supply${count === 1 ? "" : "ies"} selected`;


}

/* --------------------------------------------------
Clear
-------------------------------------------------- */

function clearSelection() {
selectedSupplies = [];

selectionBoxElement.classList.remove("active");

selectionBoxElement.style.width = "0px";
selectionBoxElement.style.height = "0px";

applySelectionState();


}

function cancelSelection() {
selecting = false;

selectionBoxElement.classList.remove("active");

selectionBoxElement.style.width = "0px";
selectionBoxElement.style.height = "0px";


}

/* --------------------------------------------------
Copy coordinates
-------------------------------------------------- */

function setupCopyButton() {
copyButton.addEventListener("click", async () => {
if (selectedSupplies.length === 0) {
return;
}

    const text = createShareText();

    try {
        await navigator.clipboard.writeText(text);

        const originalText =
            copyButton.textContent;

        copyButton.textContent = "Copied!";

        setTimeout(() => {
            copyButton.textContent =
                originalText;
        }, 1500);

    } catch (error) {
        console.error(
            "Unable to copy coordinates:",
            error
        );

        /*
         * Clipboard API may be unavailable in some
         * browser/security contexts.
         */
        fallbackCopy(text);
    }
});


}

/* --------------------------------------------------
Share format
-------------------------------------------------- */

function createShareText() {
const grouped = new Map();

for (const supply of selectedSupplies) {
    const level =
        supply.label || `Level ${supply.level}`;

    if (!grouped.has(level)) {
        grouped.set(level, []);
    }

    grouped.get(level).push(
        `(${supply.x}, ${supply.y})`
    );
}

const lines = [
    `S2 Supplies — ${selectedSupplies.length} selected`,
    ""
];

for (const [level, coordinates] of grouped) {
    lines.push(level);
    lines.push(coordinates.join(" "));
    lines.push("");
}

return lines.join("\n").trim();


}

/* --------------------------------------------------
Clipboard fallback
-------------------------------------------------- */

function fallbackCopy(text) {
const textarea =
document.createElement("textarea");

textarea.value = text;

textarea.style.position = "fixed";
textarea.style.left = "-9999px";

document.body.appendChild(textarea);

textarea.select();

try {
    document.execCommand("copy");

    copyButton.textContent = "Copied!";

    setTimeout(() => {
        copyButton.textContent =
            "Copy selection";
    }, 1500);

} catch (error) {
    console.error(
        "Clipboard fallback failed:",
        error
    );

    copyButton.textContent =
        "Copy failed";

    setTimeout(() => {
        copyButton.textContent =
            "Copy selection";
    }, 1500);

} finally {
    textarea.remove();
}


}
