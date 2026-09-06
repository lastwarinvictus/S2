const map = document.getElementById("map-container");
const status = document.getElementById("status");
const info = document.getElementById("info");

async function loadSupplies() {
    try {
        const response = await fetch("./data/test-data.json");

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
            );
        }

        const data = await response.json();

        let total = 0;

        data.strongholds.forEach(group => {

            group.coordinates.forEach(coordinate => {

                total++;

                const marker = document.createElement("div");

                marker.className = "coordinate";

                const left = coordinate.x / 10;
                const top = coordinate.y / 10;

                marker.style.left = `${left}%`;
                marker.style.top = `${top}%`;

                marker.style.backgroundColor = group.color;

                marker.title =
                    `${group.label}: (${coordinate.x}, ${coordinate.y})`;

                marker.addEventListener("click", () => {
                    info.textContent =
                        `${group.label} — X: ${coordinate.x}, Y: ${coordinate.y}`;
                });

                map.appendChild(marker);
            });
        });

        status.textContent =
            `Loaded ${total} supply coordinates.`;

    } catch (error) {

        status.textContent =
            `ERROR: ${error.message}`;

        console.error(error);
    }
}

loadSupplies();
