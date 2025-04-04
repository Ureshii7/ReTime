// icon logic
function injectToggle() {
    let settingsButton = document.querySelector(".ytp-settings-button");
    if (!settingsButton) return;

    let menu = document.querySelector(".ytp-panel-menu");
    if (!menu || document.querySelector("#retime-toggle")) return;

    let newButton = document.createElement("div");
    newButton.id = "retime-toggle";
    newButton.className = "ytp-menuitem";
    newButton.innerHTML = `
        <div class="ytp-menuitem-icon" id="retime-icon"></div>
        <div class="ytp-menuitem-label">ReTime: <span id="retime-status">OFF</span></div>
        <div class="ytp-menuitem-content"></div>
    `;

    newButton.addEventListener("click", () => {
        let enabled = localStorage.getItem("ReTimeEnabled") === "true";
        enabled = !enabled;
        localStorage.setItem("ReTimeEnabled", enabled);
        document.querySelector("#retime-status").textContent = enabled ? "ON" : "OFF";

        if (enabled) startTracking();
        else stopTracking();
    });

    menu.appendChild(newButton);

    // icon injection
    function isDarkMode() {
        return document.documentElement.getAttribute("dark") === "true";
    }

    function getReTimeIconPath() {
        return isDarkMode()
            ? chrome.runtime.getURL("setting-logo-dark.svg")
            : chrome.runtime.getURL("setting-logo-light.svg");
    }

    let iconContainer = document.querySelector("#retime-icon");
    if (iconContainer) {
        let icon = document.createElement("img");
        icon.src = getReTimeIconPath();
        icon.alt = "ReTime";
        icon.style.width = "28px";
        icon.style.height = "28px";
        icon.style.position = "relative";
        icon.style.left = "-2px";

        iconContainer.appendChild(icon);
    } else {
        console.error("ReTime icon container not found!");
    }

    // load previous
    if (localStorage.getItem("ReTimeEnabled") === "true") {
        document.querySelector("#retime-status").textContent = "ON";
        startTracking();
    }
}

let observer = null;
let interval = null;

function startTracking() {
    let video = document.querySelector("video");
    if (!video) return;

    const onReady = () => {
        updateDuration();

        // observer
        observer = new MutationObserver(updateDuration);
        observer.observe(video, { attributes: true, attributeFilter: ["playbackRate"] });

        // backup
        interval = setInterval(updateDuration, 1000);
    };

    if (isNaN(video.duration)) {
        video.addEventListener("loadedmetadata", onReady, { once: true });
    } else {
        onReady();
    }
}


function stopTracking() {
    if (observer) observer.disconnect();
    clearInterval(interval);
    let adjustedTimeElement = document.querySelector("#adjusted-time");
    if (adjustedTimeElement) adjustedTimeElement.remove();
}

// main logic
function updateDuration() {
    let video = document.querySelector("video");
    let durationContainer = document.querySelector(".ytp-time-display");

    if (!video || !durationContainer) {
        console.warn("Video or duration display not found!");
        return;
    }

    let speed = video.playbackRate;
    let originalDuration = video.duration;

    // checks
    if (!originalDuration || isNaN(originalDuration) || !speed || isNaN(speed)) {
        console.warn("Invalid duration or speed:", originalDuration, speed);
        return;
    }

    let adjustedDuration = originalDuration / speed;
    let minutes = Math.floor(adjustedDuration / 60);
    let seconds = Math.floor(adjustedDuration % 60);

    let adjustedTimeElement = document.querySelector("#adjusted-time");

    if (!adjustedTimeElement) {
        adjustedTimeElement = document.createElement("span");
        adjustedTimeElement.id = "adjusted-time";
        adjustedTimeElement.style.marginLeft = "3px";
        adjustedTimeElement.style.color = "#ff0";
        adjustedTimeElement.style.fontSize = "14px";
        adjustedTimeElement.style.fontWeight = "bold";
        durationContainer.appendChild(adjustedTimeElement);
    }

    // if not 1x
    adjustedTimeElement.textContent =
        speed === 1 ? "" : `(⏳ ${minutes}:${seconds.toString().padStart(2, "0")})`;
}


// inject toggle when settings menu opens
document.addEventListener("click", injectToggle);
