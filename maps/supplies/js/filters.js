let allSupplies = [];
let onFilterChange = null;

let elements = null;

/* --------------------------------------------------
Initialize
-------------------------------------------------- */

export function initializeFilters({
levelFilter,
searchInput,
onChange
}) {
elements = {
levelFilter,
searchInput
};

onFilterChange = onChange;

levelFilter.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);

return {
    setData,
    clear,
    getFiltered
};


}

/* --------------------------------------------------
Data
-------------------------------------------------- */

function setData(supplies) {
allSupplies = Array.isArray(supplies)
? [...supplies]
: [];

applyFilters();


}

/* --------------------------------------------------
Filtering
-------------------------------------------------- */

function applyFilters() {
const level = elements.levelFilter.value;
const search = elements.searchInput.value
.trim()
.toLowerCase();

let filtered = allSupplies;

/*
 * Level filter
 */
if (level !== "all") {
    const selectedLevel = Number(level);

    filtered = filtered.filter(
        supply => supply.level === selectedLevel
    );
}

/*
 * Coordinate search
 *
 * Examples:
 *   450
 *   450,300
 *   450 300
 *   x:450 y:300
 */
if (search) {
    const numbers = search.match(/\d+/g);

    if (numbers?.length >= 2) {
        const x = Number(numbers[0]);
        const y = Number(numbers[1]);

        filtered = filtered.filter(
            supply =>
                supply.x === x &&
                supply.y === y
        );
    } else if (numbers?.length === 1) {
        const number = Number(numbers[0]);

        filtered = filtered.filter(
            supply =>
                supply.x === number ||
                supply.y === number
        );
    } else {
        filtered = filtered.filter(supply => {
            const coordinate = `${supply.x},${supply.y}`;

            return coordinate.includes(search);
        });
    }
}

if (typeof onFilterChange === "function") {
    onFilterChange(filtered);
}


}

/* --------------------------------------------------
Clear
-------------------------------------------------- */

function clear() {
elements.levelFilter.value = "all";
elements.searchInput.value = "";

applyFilters();


}

/* --------------------------------------------------
Public helpers
-------------------------------------------------- */

function getFiltered() {
return [...allSupplies];
}
