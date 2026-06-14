/* MAP */

const map = L.map('map').setView(
    [20.5937, 78.9629],
    5
);

/* TILES */

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution:
            '&copy; OpenStreetMap contributors'
    }
).addTo(map);

/* USER LOCATION */

navigator.geolocation.getCurrentPosition(

    position => {

        const userLat =
            position.coords.latitude;

        const userLng =
            position.coords.longitude;

        map.setView(
            [userLat, userLng],
            14
        );
        generateDrivers(userLat, userLng);
        userMarker = L.marker([userLat, userLng])
    .addTo(map)
    .bindPopup("You are here");

userMarker.openPopup();

        generateOrders(userLat, userLng);
        console.log("Orders:", orders);
console.log("Order count:", orders.length);
        displayOrders();
        drawDemandHeatmap();
        setInterval(() => {

    addNewOrder();

}, 15000);
        visualizeAssignments();
        updateFleetDashboard();
        updateFleetStats();
        updateAnalytics();
    }
);

/* GLOBALS */

let startCoords = null;
let endCoords = null;

let routeLayer = null;
let drivers = [];
let orders = [];
let userMarker;
let orderMarkers = [];
let driverMarkers = [];
let driverMarkerMap = {};
let assignmentLines = [];
let heatmapCircles = [];
let assignedDriverMarker = null;
let animationInterval = null;
let totalCompletedOrders = 0;

let totalDistanceCovered = 0;

let totalDeliveryTime = 0;

let debounceTimer;

const driverIcon = L.icon({

    iconUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',

    shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',

    iconSize: [25, 41],

    iconAnchor: [12, 41]
});


const orderIcon = L.icon({

    iconUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',

    shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',

    iconSize: [25, 41],

    iconAnchor: [12, 41]
});

/* FETCH SUGGESTIONS */

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

    try {

        const url =
`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`;

        const response =
    await fetch(url);



const data =
    await response.json();



        const container =
            document.getElementById(
                containerId
            );

        container.innerHTML = "";

        data.forEach(place => {

            const item =
                document.createElement("div");

            item.className =
                "suggestion-item";

            item.innerText =
                place.display_name;

            item.onclick = () => {

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

            container.appendChild(item);
        });

    } catch(error) {

        console.log(error);
    }
}

/* START INPUT */

document.getElementById("start")
.addEventListener("input", e => {

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {

        fetchSuggestions(
            e.target.value,
            "startSuggestions",
            "start",
            "start"
        );

    }, 500);
});

/* END INPUT */

document.getElementById("end")
.addEventListener("input", e => {

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {

        fetchSuggestions(
            e.target.value,
            "endSuggestions",
            "end",
            "end"
        );

    }, 500);
});

/* ROUTE */

async function findRoute() {
    console.log("Optimize Route Clicked");
    console.log("findRoute called");


    if (!startCoords || !endCoords) {

        alert(
            "Please select locations from suggestions"
        );

        return;
    }

    const apiKey =
        "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImQ1OGI4NWNiZTJjMjQyZjk5ZTY4OGE1MDc3NzIzYmU0IiwiaCI6Im11cm11cjY0In0=";

    const url =
`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startCoords[1]},${startCoords[0]}&end=${endCoords[1]},${endCoords[0]}`;

    console.log(url);
    console.log("Start:", startCoords);
console.log("End:", endCoords);
console.log("URL:", url);
    const response =
        await fetch(url);

    const data =
        await response.json();

    const coords =
        data.features[0].geometry.coordinates;

    /* ASSIGN DRIVER */

const assignedDriver =
    assignNearestDriver(

        startCoords[0],
        startCoords[1]
    );

    assignedDriver.status =
    "Assigned";

   document.getElementById(
    "driverName"
).innerText =
    `Rider #${assignedDriver.id}`;

document.getElementById(
    "driverRating"
).innerText =
    `⭐ ${assignedDriver.rating}`;

document.getElementById(
    "driverVehicle"
).innerText =
    assignedDriver.vehicle; 

document.getElementById(
    "driverStatus"
).innerText =
    `Driver ${assignedDriver.id} Assigned`;

/* HIGHLIGHT DRIVER */

if (assignedDriverMarker) {

    map.removeLayer(
        assignedDriverMarker
    );
}

assignedDriverMarker = L.circleMarker(

    [
        assignedDriver.lat,
        assignedDriver.lng
    ],

    {

        radius: 12,

        color: 'lime',

        fillColor: 'lime',

        fillOpacity: 1
    }

).addTo(map);



assignedDriverMarker.bindPopup(

    `Assigned Driver ${assignedDriver.id}`
);

document.getElementById(
    "driverStatus"
).innerText =
    "Driver Assigned";

animateDriver(

    assignedDriver.lat,
    assignedDriver.lng,

    startCoords[0],
    startCoords[1],

    () => {

        document.getElementById(
            "driverStatus"
        ).innerText =
            "Picked Up Order";

        assignedDriver.status =
    "Delivering";  

        setTimeout(() => {

            document.getElementById(
                "driverStatus"
            ).innerText =
                "Out For Delivery";

            animateDriver(

                startCoords[0],
                startCoords[1],

                endCoords[0],
                endCoords[1],

                () => {

                    document.getElementById(
                        "driverStatus"
                    ).innerText =
                        "Order Delivered";

                        assignedDriver.status ="Available";
                        assignedDriver.completedOrders++;

totalCompletedOrders++;

updateFleetDashboard();

updateAnalytics();
    
    ;
                }

            );

        }, 1500);

    }

);

    const route =
        coords.map(coord => [

            coord[1],
            coord[0]
        ]);

    if (routeLayer) {

        map.removeLayer(routeLayer);
    }

    routeLayer = L.polyline(route, {

        color: '#60a5fa',

        weight: 6,

        opacity: 0.9

    }).addTo(map);

    map.fitBounds(routeLayer.getBounds());

    const summary =
        data.features[0].properties.summary;

    document.getElementById("distance")
        .innerText =
`${(summary.distance / 1000).toFixed(2)} km`;

    document.getElementById("duration")
        .innerText =
`${Math.ceil(summary.duration / 60)} mins`;
}
/* GENERATE DRIVERS */

function generateDrivers(userLat, userLng) {

    /* CLEAR OLD DRIVERS */

    driverMarkers.forEach(marker => {

        map.removeLayer(marker);
    });

    drivers = [];
    driverMarkers = [];

    /* CREATE 5 DRIVERS */

    for (let i = 0; i < 5; i++) {

        /* RANDOM OFFSET */

        const latOffset =
            (Math.random() - 0.5) * 0.02;

        const lngOffset =
            (Math.random() - 0.5) * 0.02;

        const driverLat =
            userLat + latOffset;

        const driverLng =
            userLng + lngOffset;

        const driver = {

    id: i + 1,

    lat: driverLat,

    lng: driverLng,

    rating: (
        4 + Math.random()
    ).toFixed(1),

    vehicle:
        Math.random() > 0.5
            ? "Bike"
            : "Scooter",
            status:"Available",
            completedOrders: 0,
            distanceCovered: 0
};

        drivers.push(driver);

        /* DRIVER MARKER */

        const marker = L.marker(
    [driverLat, driverLng],
    {
        icon: driverIcon
    }
).addTo(map);

        marker.bindPopup(

    `
    <b>Driver #${driver.id}</b>
    <br>
    ⭐ ${driver.rating}
    <br>
    ${driver.vehicle}
    `
);

        driverMarkers.push(marker);
        driverMarkerMap[driver.id] = marker;
    }
}

function generateOrders(userLat, userLng) {

    orders = [];

    const locations = [

        "Restaurant",
        "Grocery Store",
        "Pharmacy",
        "Electronics Store",
        "Bakery",
        "Flower Shop",
        "Cafe",
        "Supermarket"
    ];



    for (let i = 1; i <= 5; i++) {

        const latOffset =
            (Math.random() - 0.5) * 0.06;

        const lngOffset =
            (Math.random() - 0.5) * 0.06;

        orders.push({

            id: i,

            name:
    locations[
        Math.floor(
            Math.random() *
            locations.length
        )
    ],

    priority:
    ["High", "Medium", "Low"][
        Math.floor(Math.random() * 3)
    ],

            lat:
                userLat +
                latOffset,

            lng:
                userLng +
                lngOffset
        });
    }
}

function displayOrders() {

    orderMarkers.forEach(marker => {

        map.removeLayer(marker);
    });

    orderMarkers = [];

    orders.forEach(order => {

        const marker = L.marker(
    [
        order.lat,
        order.lng
    ],
    {
        icon: orderIcon
    }
)
.addTo(map);

    marker.bindPopup(
`
<b>Order #${order.id}</b>
<br>
${order.name}
<br>
Priority: ${order.priority}
<br>
📦 Pending
`
);

        orderMarkers.push(marker);
    });
}

function drawDemandHeatmap() {

    heatmapCircles.forEach(circle => {

        map.removeLayer(circle);
    });

    heatmapCircles = [];

    orders.forEach(order => {

        let color = "green";

        if (order.priority === "Medium") {

            color = "orange";
        }

        if (order.priority === "High") {

            color = "red";
        }

        const circle = L.circle(

            [order.lat, order.lng],

            {
                radius: 500,

                color: color,

                fillColor: color,

                fillOpacity: 0.25
            }

        ).addTo(map);

        heatmapCircles.push(circle);
    });
}


/* DISTANCE CALCULATION */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371;

    const dLat =
        (lat2 - lat1) * Math.PI / 180;

    const dLon =
        (lon2 - lon1) * Math.PI / 180;

    const a =

        Math.sin(dLat / 2) *
        Math.sin(dLat / 2)

        +

        Math.cos(lat1 * Math.PI / 180)

        *

        Math.cos(lat2 * Math.PI / 180)

        *

        Math.sin(dLon / 2)

        *

        Math.sin(dLon / 2);

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}

function assignOrdersToDrivers() {

    const assignments = [];

    const availableDrivers =
        [...drivers];

    const sortedOrders =
    [...orders].sort((a, b) => {

        const priorityRank = {

            High: 3,

            Medium: 2,

            Low: 1
        };

        return (
            priorityRank[b.priority] -
            priorityRank[a.priority]
        );
    });

    sortedOrders.forEach(order => {

        let nearestDriver = null;

        let minDistance = Infinity;

        availableDrivers.forEach(driver => {

            const distance =
                calculateDistance(

                    driver.lat,
                    driver.lng,

                    order.lat,
                    order.lng
                );

            if (distance < minDistance) {

                minDistance =
                    distance;

                nearestDriver =
                    driver;
            }
        });

        if (nearestDriver) {

            assignments.push({

                driverId:
                    nearestDriver.id,

                orderId:
                    order.id,

                destination:
                    order.name,

                distance:
                    minDistance.toFixed(2)
            });

            const index =
                availableDrivers.findIndex(

                    d =>
                        d.id ===
                        nearestDriver.id
                );

            availableDrivers.splice(
                index,
                1
            );
        }
    });

    return assignments;
}
/* FIND NEAREST DRIVER */

function assignNearestDriver(
    destinationLat,
    destinationLng
) {

    let nearestDriver = null;

    let minimumDistance =
        Infinity;

    drivers.forEach(driver => {

        const distance =
            calculateDistance(

                driver.lat,
                driver.lng,

                destinationLat,
                destinationLng
            );

        if (distance < minimumDistance) {

            minimumDistance =
                distance;

            nearestDriver =
                driver;
        }
    });

    return nearestDriver;
}

function updateFleetDashboard() {

    const dashboard =
        document.getElementById(
            "fleetDashboard"
        );

    dashboard.innerHTML = "";

    drivers.forEach(driver => {

        dashboard.innerHTML += `

        <div>

            Rider #${driver.id}

            | ${driver.vehicle}

            | ⭐ ${driver.rating}

            | ${driver.status}

        </div>

        `;
    });
}

function updateAnalytics() {

    const panel =
        document.getElementById(
            "analyticsPanel"
        );

    if (!panel) return;

    const topDriver =
        drivers.reduce(
            (best, current) =>

                current.completedOrders >
                best.completedOrders

                    ? current
                    : best
        );

    panel.innerHTML = `

        <div>
            📦 Orders Completed:
            ${totalCompletedOrders}
        </div>

        <div>
            🚚 Active Drivers:
            ${drivers.length}
        </div>

        <div>
            🏆 Top Driver:
            Rider #${topDriver.id}
        </div>

    `;
}

function visualizeAssignments() {

    assignmentLines.forEach(line => {

        map.removeLayer(line);
    });

    assignmentLines = [];

    const assignments =
        assignOrdersToDrivers();

    assignments.forEach(
        assignment => {

            const driver =
                drivers.find(

                    d =>
                        d.id ===
                        assignment.driverId
                );

            const order =
                orders.find(

                    o =>
                        o.id ===
                        assignment.orderId
                );

            if (
                !driver ||
                !order
            ) return;

            const line =
                L.polyline(

                    [

                        [
                            driver.lat,
                            driver.lng
                        ],

                        [
                            order.lat,
                            order.lng
                        ]

                    ],

                    {

                        color: "#00ff88",

                        weight: 3,

                        dashArray:
                            "10,10"

                    }

                ).addTo(map);

            assignmentLines.push(
                line
            );
        }
    );
}


function animateDriver(
    startLat,
    startLng,
    endLat,
    endLng,
    onComplete
) {

    if (animationInterval) {

        clearInterval(animationInterval);
    }

    let progress = 0;

    animationInterval = setInterval(() => {

        progress += 0.02;

        if (progress >= 1) {

            assignedDriverMarker.setLatLng([
                endLat,
                endLng
            ]);

            clearInterval(animationInterval);

            if (onComplete) {

                onComplete();
            }

            return;
        }

        const currentLat =
            startLat +
            (endLat - startLat) * progress;

        const currentLng =
            startLng +
            (endLng - startLng) * progress;

        assignedDriverMarker.setLatLng([
            currentLat,
            currentLng
        ]);

    }, 50);
}

setTimeout(() => {

    console.log(

        assignOrdersToDrivers()

    );

}, 3000);

function addNewOrder() {

    console.log("addNewOrder running");
    console.log("userMarker =", userMarker);

    if (!userMarker) return;

    const userPos =
        userMarker.getLatLng();

    const latOffset =
        (Math.random() - 0.5) * 0.04;

    const lngOffset =
        (Math.random() - 0.5) * 0.04;

    const areaNames = [

        "Food Order",

        "Medicine Delivery",

        "Express Delivery",

        "Courier Pickup",

        "Grocery Order"
    ];

    const newOrder = {

        id: Date.now(),

        name:
            areaNames[
                Math.floor(
                    Math.random() *
                    areaNames.length
                )
            ],

        priority:
            ["High","Medium","Low"][
                Math.floor(
                    Math.random() * 3
                )
            ],

        lat:
            userPos.lat +
            latOffset,

        lng:
            userPos.lng +
            lngOffset
    };

    orders.push(newOrder);

    const notification =
    document.getElementById(
        "notification"
    );

notification.innerText =
    `📦 New ${newOrder.priority} Priority Order`;

notification.style.display =
    "block";

setTimeout(() => {

    notification.style.display =
        "none";

}, 3000);

    console.log(
    "New Order:",
    newOrder.name
);

    displayOrders();

    drawDemandHeatmap();

    updateAnalytics();
}

function moveDriverToOrder(
    assignedDriver,
    destinationLat,
    destinationLng
) {

    const marker =
        driverMarkerMap[
            assignedDriver.id
        ];

    if (!marker) return;

    let currentLat =
        assignedDriver.lat;

    let currentLng =
        assignedDriver.lng;

    const steps = 50;

    const latStep =
        (destinationLat - currentLat)
        / steps;

    const lngStep =
        (destinationLng - currentLng)
        / steps;

    let currentStep = 0;

    const interval =
        setInterval(() => {

            currentLat += latStep;
            currentLng += lngStep;

            marker.setLatLng([
                currentLat,
                currentLng
            ]);

            assignedDriver.lat =
                currentLat;

            assignedDriver.lng =
                currentLng;

            currentStep++;

            if (
                currentStep >= steps
            ) {

                clearInterval(
                    interval
                );

                document.getElementById(
                    "driverStatus"
                ).innerText =
                    "Order Delivered";

                assignedDriver.status =
                    "Available";

                assignedDriver.completedOrders++;

                totalCompletedOrders++;

                updateFleetDashboard();

                updateAnalytics();
            }

        }, 200);
}

function updateFleetStats() {

    const availableDrivers =
        drivers.filter(

            driver =>
                driver.status ===
                "Available"

        ).length;

    const busyDrivers =
        drivers.filter(

            driver =>
                driver.status !==
                "Available"

        ).length;

    const pendingOrders =
        orders.length -
        totalCompletedOrders;

    const utilization =
        drivers.length > 0

            ? (
                busyDrivers /
                drivers.length
              ) * 100

            : 0;

    const fleetStats =
        document.getElementById(
            "fleetStats"
        );

    if (!fleetStats) return;

    fleetStats.innerHTML = `

        <div>
            🟢 Available Drivers:
            ${availableDrivers}
        </div>

        <div>
            🟠 Busy Drivers:
            ${busyDrivers}
        </div>

        <div>
            📦 Pending Orders:
            ${pendingOrders}
        </div>

        <div>
            ✅ Completed Orders:
            ${totalCompletedOrders}
        </div>

        <div>
            ⚡ Fleet Utilization:
            ${utilization.toFixed(0)}%
        </div>

    `;
}

