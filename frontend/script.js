/* =========================================================
   CITY TRAFFIC INTELLIGENCE
   Frontend ↔ FastAPI Backend
   ========================================================= */

// ---------------------------------------------------------
// BACKEND URL
// ---------------------------------------------------------

const API_BASE_URL = "http://localhost:8000";


// ---------------------------------------------------------
// GLOBAL VARIABLES
// ---------------------------------------------------------

let map;
let trajectoryMap;

let cameraMarkers = [];
let trajectoryLine = null;


// ---------------------------------------------------------
// PAGE NAVIGATION
// ---------------------------------------------------------

const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

navItems.forEach(item => {

    item.addEventListener("click", () => {

        const pageName = item.dataset.page;

        showPage(pageName);

    });

});


function showPage(pageName) {

    pages.forEach(page => {
        page.classList.remove("active");
    });

    navItems.forEach(item => {
        item.classList.remove("active");
    });

    const selectedPage = document.getElementById(pageName);

    if (selectedPage) {
        selectedPage.classList.add("active");
    }

    const selectedNav = document.querySelector(
        `.nav-item[data-page="${pageName}"]`
    );

    if (selectedNav) {
        selectedNav.classList.add("active");
    }

    updatePageTitle(pageName);

    // Load page-specific data
    if (pageName === "cameras") {
        loadAllCameras();
    }

    if (pageName === "analytics") {
        loadAnalytics();
    }

    if (pageName === "congestion") {
        loadCongestion();
    }

    if (pageName === "trajectory") {

        setTimeout(() => {

            if (trajectoryMap) {
                trajectoryMap.invalidateSize();
            }

        }, 200);

    }

}


// ---------------------------------------------------------
// PAGE TITLES
// ---------------------------------------------------------

function updatePageTitle(pageName) {

    const title = document.getElementById("page-title");
    const subtitle = document.getElementById("page-subtitle");

    const pageInfo = {

        dashboard: {
            title: "City Traffic Dashboard",
            subtitle: "Real-time AI-powered urban traffic intelligence"
        },

        vehicles: {
            title: "Vehicle Intelligence",
            subtitle: "Global vehicle identification and journey analysis"
        },

        anpr: {
            title: "ANPR / OCR",
            subtitle: "Automatic Number Plate Recognition"
        },

        trajectory: {
            title: "Vehicle Trajectories",
            subtitle: "Multi-camera vehicle movement tracking"
        },

        cameras: {
            title: "Camera Network",
            subtitle: "City-wide traffic camera locations"
        },

        analytics: {
            title: "Traffic Analytics",
            subtitle: "City-wide traffic statistics"
        },

        congestion: {
            title: "Congestion Monitoring",
            subtitle: "AI-based city congestion status"
        }

    };

    if (pageInfo[pageName]) {

        title.textContent = pageInfo[pageName].title;

        subtitle.textContent = pageInfo[pageName].subtitle;

    }

}


// =========================================================
// BACKEND CONNECTION TEST
// =========================================================

async function checkBackendConnection() {

    const status = document.getElementById("connection-status");

    try {

        const response = await fetch(`${API_BASE_URL}/`);

        if (!response.ok) {
            throw new Error("Backend unavailable");
        }

        const data = await response.json();

        console.log("Backend:", data);

        status.textContent = "Backend Connected";

    } catch (error) {

        console.error("Backend connection failed:", error);

        status.textContent = "Backend Offline";

    }

}


// =========================================================
// LOAD ANALYTICS
// =========================================================

async function loadAnalytics() {

    try {

        const response =
            await fetch(`${API_BASE_URL}/analytics`);

        if (!response.ok) {
            throw new Error("Analytics API failed");
        }

        const data = await response.json();

        console.log("Analytics data:", data);


        // Dashboard cards

        setText(
            "total-vehicles",
            data.total_vehicles
        );

        setText(
            "total-detections",
            data.total_detections
        );

        setText(
            "total-cameras",
            data.total_cameras
        );

        setText(
            "average-speed",
            data.average_speed
        );


        // Overview

        setText(
            "overview-vehicles",
            data.total_vehicles
        );

        setText(
            "overview-detections",
            data.total_detections
        );

        setText(
            "overview-cameras",
            data.total_cameras
        );

        setText(
            "overview-speed",
            data.average_speed
        );


        // Analytics page

        setText(
            "analytics-vehicles",
            data.total_vehicles
        );

        setText(
            "analytics-detections",
            data.total_detections
        );

        setText(
            "analytics-cameras",
            data.total_cameras
        );

        setText(
            "analytics-speed",
            data.average_speed
        );

    } catch (error) {

        console.error(
            "Could not load analytics:",
            error
        );

    }

}


// =========================================================
// LOAD CONGESTION
// =========================================================

async function loadCongestion() {

    try {

        const response =
            await fetch(`${API_BASE_URL}/congestion`);

        if (!response.ok) {
            throw new Error("Congestion API failed");
        }

        const data = await response.json();

        console.log("Congestion data:", data);


        const level =
            String(data.congestion_level || "UNKNOWN")
                .toUpperCase();

        const speed =
            Number(data.average_speed || 0);


        // Dashboard

        setText(
            "congestion-level",
            level
        );

        setText(
            "congestion-title",
            `${level} CONGESTION`
        );

        setText(
            "congestion-speed",
            speed
        );


        // Large congestion page

        setText(
            "congestion-level-large",
            level
        );

        setText(
            "congestion-title-large",
            `${level} CONGESTION`
        );

        setText(
            "congestion-speed-large",
            speed
        );


        // Circle colours

        updateCongestionCircle(
            "congestion-circle",
            level
        );

        updateCongestionCircle(
            "congestion-circle-large",
            level
        );

    } catch (error) {

        console.error(
            "Could not load congestion:",
            error
        );

    }

}


// =========================================================
// CONGESTION CIRCLE
// =========================================================

function updateCongestionCircle(
    elementId,
    level
) {

    const element =
        document.getElementById(elementId);

    if (!element) return;

    element.classList.remove(
        "low",
        "medium",
        "high"
    );

    const normalized =
        level.toLowerCase();

    if (
        normalized === "low" ||
        normalized === "medium" ||
        normalized === "high"
    ) {

        element.classList.add(normalized);

    }

}


// =========================================================
// LOAD CAMERAS
// =========================================================

async function loadCameras() {

    try {

        const response =
            await fetch(`${API_BASE_URL}/cameras`);

        if (!response.ok) {
            throw new Error("Camera API failed");
        }

        const cameras = await response.json();

        console.log("Cameras:", cameras);


        displayCameraList(cameras);

        displayAllCameras(cameras);

        displayCamerasOnMap(cameras);

    } catch (error) {

        console.error(
            "Could not load cameras:",
            error
        );

        showCameraError();

    }

}


// =========================================================
// CAMERA LIST ON DASHBOARD
// =========================================================

function displayCameraList(cameras) {

    const container =
        document.getElementById("camera-list");

    if (!container) return;


    if (!cameras.length) {

        container.innerHTML = `
            <div class="empty-state">
                <span>📹</span>
                <h3>No cameras found</h3>
                <p>
                    The backend currently has no
                    registered cameras.
                </p>
            </div>
        `;

        return;
    }


    const limitedCameras =
        cameras.slice(0, 5);


    container.innerHTML =
        limitedCameras.map(camera => `

            <div class="camera-row">

                <div class="camera-info">

                    <div class="camera-icon">
                        📹
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(
                                camera.camera_id
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                camera.location || "Unknown location"
                            )}
                        </small>

                    </div>

                </div>

                <div class="camera-status">
                    ONLINE
                </div>

            </div>

        `).join("");

}


// =========================================================
// ALL CAMERAS PAGE
// =========================================================

function displayAllCameras(cameras) {

    const container =
        document.getElementById("all-cameras");

    if (!container) return;


    if (!cameras.length) {

        container.innerHTML = `
            <div class="panel">
                <div class="empty-state">
                    <span>📹</span>
                    <h3>No cameras available</h3>
                    <p>
                        No cameras have been registered
                        in the backend database yet.
                    </p>
                </div>
            </div>
        `;

        return;
    }


    container.innerHTML =
        cameras.map(camera => `

            <div class="camera-card">

                <div class="camera-card-icon">
                    📹
                </div>

                <h3>
                    ${escapeHTML(
                        camera.camera_id
                    )}
                </h3>

                <p>
                    Camera monitoring point
                </p>

                <div class="camera-location">
                    📍
                    ${escapeHTML(
                        camera.location || "Unknown location"
                    )}
                </div>

                <div class="camera-coordinates">
                    Lat:
                    ${camera.latitude ?? "--"}
                    &nbsp; | &nbsp;
                    Lng:
                    ${camera.longitude ?? "--"}
                </div>

            </div>

        `).join("");

}


// =========================================================
// CAMERA ERROR
// =========================================================

function showCameraError() {

    const list =
        document.getElementById("camera-list");

    const all =
        document.getElementById("all-cameras");


    if (list) {

        list.innerHTML = `
            <div class="loading">
                Unable to connect to camera API.
            </div>
        `;

    }


    if (all) {

        all.innerHTML = `
            <div class="panel">
                <div class="empty-state">
                    <span>⚠️</span>
                    <h3>Backend unavailable</h3>
                    <p>
                        Start the FastAPI backend
                        and refresh the page.
                    </p>
                </div>
            </div>
        `;

    }

}


// =========================================================
// LOAD ALL CAMERAS PAGE
// =========================================================

async function loadAllCameras() {

    await loadCameras();

}


// =========================================================
// DISPLAY CAMERAS ON MAP
// =========================================================

function displayCamerasOnMap(cameras) {

    if (!map) return;


    // Remove previous markers

    cameraMarkers.forEach(marker => {

        map.removeLayer(marker);

    });

    cameraMarkers = [];


    cameras.forEach(camera => {

        const lat =
            Number(camera.latitude);

        const lng =
            Number(camera.longitude);


        if (
            Number.isNaN(lat) ||
            Number.isNaN(lng)
        ) {
            return;
        }


        const marker =
            L.marker([lat, lng])
                .addTo(map);


        marker.bindPopup(`

            <strong>
                📹 ${escapeHTML(
                    camera.camera_id
                )}
            </strong>

            <br>

            ${escapeHTML(
                camera.location || "Unknown location"
            )}

            <br>

            <small>
                ${lat.toFixed(5)},
                ${lng.toFixed(5)}
            </small>

        `);


        cameraMarkers.push(marker);

    });


    // Fit map to cameras

    if (cameraMarkers.length > 0) {

        const group =
            L.featureGroup(cameraMarkers);

        map.fitBounds(
            group.getBounds().pad(0.2)
        );

    }

}


// =========================================================
// INITIALIZE MAIN MAP
// =========================================================

function initializeMap() {

    map = L.map("map").setView(
        [12.9716, 77.5946],
        12
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);

}


// =========================================================
// INITIALIZE TRAJECTORY MAP
// =========================================================

function initializeTrajectoryMap() {

    trajectoryMap =
        L.map("trajectory-map")
            .setView(
                [12.9716, 77.5946],
                12
            );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(trajectoryMap);

}


// =========================================================
// SEARCH VEHICLE
// =========================================================

async function searchVehicle() {

    const input =
        document.getElementById("vehicle-search");

    const result =
        document.getElementById("vehicle-result");


    if (!input || !result) return;


    const plate =
        input.value.trim();


    if (!plate) {

        result.innerHTML = `
            <div class="empty-state">
                <span>⚠️</span>
                <h3>Enter a plate number</h3>
                <p>
                    Example: KA01AB1234
                </p>
            </div>
        `;

        return;
    }


    result.innerHTML = `
        <div class="loading">
            Searching vehicle...
        </div>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/trajectories/${encodeURIComponent(plate)}`
            );


        if (response.status === 404) {

            result.innerHTML = `
                <div class="empty-state">
                    <span>🚗</span>
                    <h3>Vehicle not found</h3>
                    <p>
                        No trajectory was found for
                        <strong>${escapeHTML(plate)}</strong>.
                    </p>
                </div>
            `;

            return;
        }


        if (!response.ok) {
            throw new Error(
                "Vehicle search failed"
            );
        }


        const trajectories =
            await response.json();


        displayVehicleResult(
            trajectories,
            result
        );


        displayTrajectory(
            trajectories
        );


    } catch (error) {

        console.error(
            "Vehicle search error:",
            error
        );


        result.innerHTML = `
            <div class="empty-state">
                <span>⚠️</span>
                <h3>Unable to search vehicle</h3>
                <p>
                    Check whether the backend
                    is running.
                </p>
            </div>
        `;

    }

}


// =========================================================
// VEHICLE SEARCH - VEHICLE PAGE
// =========================================================

async function searchVehicleFromPage() {

    const input =
        document.getElementById(
            "vehicle-search-2"
        );

    const result =
        document.getElementById(
            "vehicle-result-2"
        );


    if (!input || !result) return;


    const plate =
        input.value.trim();


    if (!plate) {

        result.innerHTML = `
            <div class="empty-state">
                <span>⚠️</span>
                <h3>Enter a plate number</h3>
            </div>
        `;

        return;
    }


    result.innerHTML = `
        <div class="loading">
            Searching...
        </div>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/trajectories/${encodeURIComponent(plate)}`
            );


        if (response.status === 404) {

            result.innerHTML = `
                <div class="empty-state">
                    <span>🚗</span>
                    <h3>Vehicle not found</h3>
                </div>
            `;

            return;
        }


        if (!response.ok) {
            throw new Error(
                "Vehicle search failed"
            );
        }


        const trajectories =
            await response.json();


        displayVehicleResult(
            trajectories,
            result
        );


        displayTrajectory(
            trajectories
        );


    } catch (error) {

        console.error(error);

        result.innerHTML = `
            <div class="empty-state">
                <span>⚠️</span>
                <h3>Backend unavailable</h3>
            </div>
        `;

    }

}


// =========================================================
// DISPLAY VEHICLE RESULT
// =========================================================

function displayVehicleResult(
    trajectories,
    container
) {

    if (!trajectories.length) {

        container.innerHTML = `
            <div class="empty-state">
                <span>🚗</span>
                <h3>No trajectory found</h3>
            </div>
        `;

        return;
    }


    const first =
        trajectories[0];


    const totalDistance =
        trajectories.reduce(
            (sum, item) =>
                sum +
                Number(item.total_distance || 0),
            0
        );


    const averageSpeed =
        first.average_speed ?? 0;


    const detections =
        trajectories.flatMap(
            item => item.detections || []
        );


    container.innerHTML = `

        <div class="vehicle-result">

            <div class="vehicle-summary">

                <div class="vehicle-stat">

                    <p>LICENSE PLATE</p>

                    <strong>
                        ${escapeHTML(
                            first.plate_number
                        )}
                    </strong>

                </div>


                <div class="vehicle-stat">

                    <p>TOTAL DISTANCE</p>

                    <strong>
                        ${totalDistance}
                    </strong>

                </div>


                <div class="vehicle-stat">

                    <p>AVERAGE SPEED</p>

                    <strong>
                        ${averageSpeed} km/h
                    </strong>

                </div>

            </div>


            <h3 style="margin-bottom: 12px;">
                Camera Detections
            </h3>


            <div class="detection-list">

                ${
                    detections.length
                    ?
                    detections.map(
                        detection => `

                            <div class="detection-item">

                                <div>
                                    <span>Camera</span>
                                    <strong>
                                        ${escapeHTML(
                                            detection.camera_id || "--"
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>Location</span>
                                    <strong>
                                        ${escapeHTML(
                                            detection.location || "--"
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>Speed</span>
                                    <strong>
                                        ${detection.speed ?? "--"} km/h
                                    </strong>
                                </div>

                                <div>
                                    <span>Direction</span>
                                    <strong>
                                        ${escapeHTML(
                                            detection.direction || "--"
                                        )}
                                    </strong>
                                </div>

                            </div>

                        `
                    ).join("")
                    :
                    `
                        <div class="loading">
                            No detections available.
                        </div>
                    `
                }

            </div>

        </div>

    `;

}


// =========================================================
// DISPLAY TRAJECTORY
// =========================================================

function displayTrajectory(
    trajectories
) {

    if (
        !trajectoryMap ||
        !trajectories ||
        !trajectories.length
    ) {
        return;
    }


    // Remove previous trajectory

    if (trajectoryLine) {

        trajectoryMap.removeLayer(
            trajectoryLine
        );

        trajectoryLine = null;

    }


    const points = [];


    trajectories.forEach(
        trajectory => {

            (trajectory.detections || [])
                .forEach(
                    detection => {

                        if (
                            detection.gps &&
                            detection.gps.lat !== undefined &&
                            detection.gps.lng !== undefined
                        ) {

                            points.push([
                                Number(
                                    detection.gps.lat
                                ),
                                Number(
                                    detection.gps.lng
                                )
                            ]);

                        }

                    }
                );

        }
    );


    if (!points.length) {

        return;

    }


    trajectoryLine =
        L.polyline(
            points,
            {
                weight: 5
            }
        ).addTo(
            trajectoryMap
        );


    // Add detection markers

    points.forEach(
        (point, index) => {

            L.circleMarker(
                point,
                {
                    radius: 6
                }
            )
            .addTo(trajectoryMap)
            .bindPopup(
                `Detection ${index + 1}`
            );

        }
    );


    trajectoryMap.fitBounds(
        trajectoryLine
            .getBounds()
            .pad(0.2)
    );


    displayTrajectoryDetails(
        trajectories
    );


    // Open trajectory page

    showPage("trajectory");

}


// =========================================================
// TRAJECTORY DETAILS
// =========================================================

function displayTrajectoryDetails(
    trajectories
) {

    const container =
        document.getElementById(
            "trajectory-details"
        );


    if (!container) return;


    const trajectory =
        trajectories[0];


    const detections =
        trajectory.detections || [];


    container.innerHTML = `

        <div class="trajectory-header">

            <h3>
                Vehicle:
                ${escapeHTML(
                    trajectory.plate_number
                )}
            </h3>

            <p>
                Trajectory ID:
                ${escapeHTML(
                    trajectory.trajectory_id
                )}
            </p>

        </div>


        <div class="trajectory-detections">

            <div class="vehicle-summary">

                <div class="vehicle-stat">
                    <p>TOTAL DISTANCE</p>
                    <strong>
                        ${trajectory.total_distance ?? "--"}
                    </strong>
                </div>

                <div class="vehicle-stat">
                    <p>AVERAGE SPEED</p>
                    <strong>
                        ${trajectory.average_speed ?? "--"}
                        km/h
                    </strong>
                </div>

                <div class="vehicle-stat">
                    <p>CAMERA DETECTIONS</p>
                    <strong>
                        ${detections.length}
                    </strong>
                </div>

            </div>


            <h3 style="margin-bottom: 12px;">
                Journey
            </h3>


            <div class="detection-list">

                ${
                    detections.length
                    ?
                    detections.map(
                        detection => `

                            <div class="detection-item">

                                <div>
                                    <span>Camera</span>
                                    <strong>
                                        ${escapeHTML(
                                            detection.camera_id || "--"
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>Location</span>
                                    <strong>
                                        ${escapeHTML(
                                            detection.location || "--"
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>Speed</span>
                                    <strong>
                                        ${detection.speed ?? "--"} km/h
                                    </strong>
                                </div>

                                <div>
                                    <span>Direction</span>
                                    <strong>
                                        ${escapeHTML(
                                            detection.direction || "--"
                                        )}
                                    </strong>
                                </div>

                            </div>

                        `
                    ).join("")
                    :
                    `
                        <div class="loading">
                            No detections available.
                        </div>
                    `
                }

            </div>

        </div>

    `;

}


// =========================================================
// UTILITY - SET TEXT
// =========================================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(elementId);

    if (element) {

        element.textContent =
            value ?? "--";

    }

}


// =========================================================
// SECURITY / HTML ESCAPE
// =========================================================

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =========================================================
// LOAD EVERYTHING
// =========================================================

async function loadDashboardData() {

    console.log(
        "Loading dashboard data..."
    );


    await Promise.all([
        checkBackendConnection(),
        loadAnalytics(),
        loadCongestion(),
        loadCameras()
    ]);

}


// =========================================================
// START APPLICATION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "City Traffic frontend started"
        );


        initializeMap();

        initializeTrajectoryMap();

        loadDashboardData();

    }
);