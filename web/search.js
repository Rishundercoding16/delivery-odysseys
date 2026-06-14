console.log("SEARCH JS WORKING");

let startCoords = null;
let endCoords = null;

document.addEventListener("DOMContentLoaded", () => {

    async function fetchSuggestions(
        query,
        containerId,
        inputId,
        type
    ) {

        if (query.length < 2) {

            document.getElementById(
                containerId
            ).innerHTML = "";

            return;
        }

        const url =
`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`;

        const response =
            await fetch(url);

        const data =
            await response.json();
            console.log(data);

        const container =
            document.getElementById(
                containerId
            );

        container.innerHTML = "";

        data.forEach(place => {

            const div =
                document.createElement("div");

            div.className =
                "suggestion-item";

            div.innerText =
                place.display_name;

            div.onclick = () => {

                document.getElementById(
                    inputId
                ).value =
                    place.display_name;

                const coords = [

                    parseFloat(place.lat),

                    parseFloat(place.lon)
                ];

                if (type === "start") {

                    startCoords = coords;

                } else {

                    endCoords = coords;
                }

                container.innerHTML = "";
            };

            container.appendChild(div);
        });
    }

    /* START */

    document.getElementById("start")
    .addEventListener("input", e => {

        fetchSuggestions(
            e.target.value,
            "startSuggestions",
            "start",
            "start"
        );
    });

    /* END */

    document.getElementById("end")
    .addEventListener("input", e => {

        fetchSuggestions(
            e.target.value,
            "endSuggestions",
            "end",
            "end"
        );
    });
});