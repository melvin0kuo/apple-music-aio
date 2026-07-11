// Global state tracking
let currentMedia = {
    title: "",
    artist: "",
    album: "",
    status: "stopped",
    duration: 0,
    position: 0,
    album_art: "",
    updated_at: 0,
    server_time: 0
};

let localTimeOffset = 0; // Offset between client and server time
let lastPollTime = 0;

// Detect NZXT CAM or circular screen layout
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('kraken') || urlParams.has('circle') || urlParams.has('fit')) {
    document.body.classList.add('circular-layout');
}

// DOM Elements
const ambientBg = document.getElementById('ambientBg');
const activeScreen = document.getElementById('activeScreen');
const standbyScreen = document.getElementById('standbyScreen');
const albumArt = document.getElementById('albumArt');
const albumArtGlow = document.getElementById('albumArtGlow');
const playbackIcon = document.getElementById('playbackIcon');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const progressBar = document.getElementById('progressBar');
const timeElapsed = document.getElementById('timeElapsed');
const timeDuration = document.getElementById('timeDuration');
const waveVisualizer = document.getElementById('waveVisualizer');
const clockTime = document.getElementById('clockTime');
const clockDate = document.getElementById('clockDate');

// Setup Canvas for Color Extraction
const colorCanvas = document.createElement('canvas');
colorCanvas.width = 5;
colorCanvas.height = 5;
const canvasCtx = colorCanvas.getContext('2d', { willReadFrequently: true });

// Fallback background colors (Apple Music classic gradient colors)
const defaultColors = [
    'rgba(142, 36, 170, 0.6)', // Deep Purple
    'rgba(229, 9, 20, 0.4)',   // Red
    'rgba(21, 101, 192, 0.5)'  // Dark Blue
];

/**
 * Format seconds to M:SS
 */
function formatTime(secs) {
    if (isNaN(secs) || secs < 0) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Setup a scrolling marquee if the text is wider than its container.
 */
function setupMarquee(element, container, text) {
    if (!text) {
        element.textContent = "";
        element.className = element.classList.contains('title') ? 'title' : 'artist';
        return;
    }

    // Reset styles
    element.textContent = text;
    element.className = element.classList.contains('title') ? 'title' : 'artist';
    
    const containerWidth = container.clientWidth;
    const textWidth = element.scrollWidth;

    if (textWidth > containerWidth) {
        // Double the text for seamless scrolling
        element.innerHTML = `<span>${text}</span><span style="margin-left: 50px;">${text}</span>`;
        element.classList.add('marquee-active');
    }
}

/**
 * Smoothly update the progress bar at 60fps using local time interpolation.
 */
function animateProgress() {
    if (currentMedia.status === "playing" && currentMedia.duration > 0) {
        const clientNow = Date.now() / 1000;
        
        // Calculate position based on elapsed client time since the last server update
        const elapsedSinceUpdate = clientNow - currentMedia.updated_at;
        let interpolatedPosition = currentMedia.position + elapsedSinceUpdate;
        
        // Clamp to duration
        if (interpolatedPosition > currentMedia.duration) {
            interpolatedPosition = currentMedia.duration;
        }

        // Update progress bar width
        const pct = (interpolatedPosition / currentMedia.duration) * 100;
        progressBar.style.width = `${pct}%`;
        
        // Update elapsed time text
        timeElapsed.textContent = formatTime(interpolatedPosition);
    }
    requestAnimationFrame(animateProgress);
}

/**
 * Extract dominant colors from the album art and update CSS variables for ambient background.
 */
function updateAmbientColors(imgSrc) {
    if (!imgSrc) {
        setThemeColors(defaultColors[0], defaultColors[1], defaultColors[2]);
        return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function() {
        try {
            canvasCtx.drawImage(img, 0, 0, 5, 5);
            const imgData = canvasCtx.getImageData(0, 0, 5, 5).data;
            
            // Extract colors from corners and center
            // Pixel indices: center (12), top-left (0), bottom-right (24)
            const colors = [];
            const pixelIndices = [12 * 4, 2 * 4, 22 * 4];
            
            pixelIndices.forEach(idx => {
                const r = imgData[idx];
                const g = imgData[idx + 1];
                const b = imgData[idx + 2];
                // Push slightly transparent color for modern look
                colors.push(`rgba(${r}, ${g}, ${b}, 0.5)`);
            });

            // Set styling
            setThemeColors(colors[0], colors[1], colors[2]);
        } catch (e) {
            // Draw failed (e.g. cross-origin base64 error - unlikely for data URIs)
            setThemeColors(defaultColors[0], defaultColors[1], defaultColors[2]);
        }
    };
    img.src = imgSrc;
}

function setThemeColors(c1, c2, c3) {
    document.documentElement.style.setProperty('--theme-color-1', c1);
    document.documentElement.style.setProperty('--theme-color-2', c2);
    document.documentElement.style.setProperty('--theme-color-3', c3);
    
    // Add subtle glow matching the dominant color
    progressBar.style.boxShadow = `0 0 8px ${c1}`;
}

/**
 * Updates the digital standby clock.
 */
function updateStandbyClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    clockTime.textContent = `${hours}:${minutes}`;

    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    clockDate.textContent = now.toLocaleDateString('en-US', options);
}

/**
 * Poll state from the local server.
 */
async function pollMediaStatus() {
    try {
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error("HTTP error");
        
        const data = await response.json();
        
        // Determine client-server latency and drift
        const clientNow = Date.now() / 1000;
        
        // Sync local media state
        const titleChanged = data.title !== currentMedia.title || data.artist !== currentMedia.artist;
        const artChanged = data.album_art !== currentMedia.album_art;
        
        currentMedia = {
            title: data.title,
            artist: data.artist,
            album: data.album,
            status: data.status,
            duration: data.duration,
            position: data.position,
            album_art: data.album_art,
            // Track local time of state update
            updated_at: clientNow,
            server_time: data.server_time
        };

        // If no active media or player is completely idle/stopped
        const hasActiveSong = currentMedia.title && (currentMedia.status === "playing" || currentMedia.status === "paused");
        
        if (!hasActiveSong) {
            // Show Standby Clock Screen
            if (activeScreen.classList.contains('active-screen')) {
                activeScreen.classList.remove('active-screen');
                standbyScreen.classList.add('active-screen');
                // Reset styling
                setThemeColors(defaultColors[0], defaultColors[1], defaultColors[2]);
            }
            return;
        }

        // Show Media Player Screen
        if (standbyScreen.classList.contains('active-screen')) {
            standbyScreen.classList.remove('active-screen');
            activeScreen.classList.add('active-screen');
        }

        // Update elements only if they actually changed (performance)
        if (titleChanged) {
            setupMarquee(trackTitle, trackTitle.parentElement, currentMedia.title);
            setupMarquee(trackArtist, trackArtist.parentElement, currentMedia.artist || "Unknown Artist");
        }

        if (artChanged) {
            if (currentMedia.album_art) {
                albumArt.src = currentMedia.album_art;
                albumArt.classList.add('loaded');
                updateAmbientColors(currentMedia.album_art);
            } else {
                albumArt.src = "";
                albumArt.classList.remove('loaded');
                updateAmbientColors(null);
            }
        }

        // Update timeline values directly if paused or as fallback
        if (currentMedia.status !== "playing") {
            const pct = currentMedia.duration > 0 ? (currentMedia.position / currentMedia.duration) * 100 : 0;
            progressBar.style.width = `${pct}%`;
            timeElapsed.textContent = formatTime(currentMedia.position);
        }
        timeDuration.textContent = formatTime(currentMedia.duration);

        // Update playback buttons and wave visualizer state
        if (currentMedia.status === "playing") {
            playbackIcon.className = "playback-icon state-playing";
            waveVisualizer.classList.add('playing-wave');
            if (albumArtGlow) albumArtGlow.classList.add('playing-glow');
        } else {
            playbackIcon.className = "playback-icon state-paused";
            waveVisualizer.classList.remove('playing-wave');
            if (albumArtGlow) albumArtGlow.classList.remove('playing-glow');
        }

    } catch (err) {
        // Connection error: Show standby screen with alert
        if (activeScreen.classList.contains('active-screen')) {
            activeScreen.classList.remove('active-screen');
            standbyScreen.classList.add('active-screen');
            setThemeColors(defaultColors[0], defaultColors[1], defaultColors[2]);
        }
        document.getElementById('standbyMsg').textContent = "Connecting to Widget Server...";
    }
}

// Initializations
function init() {
    // Start progress interpolation loop
    animateProgress();
    
    // Poll immediately
    pollMediaStatus();
    updateStandbyClock();
    
    // Set up polling intervals
    setInterval(pollMediaStatus, 800);
    setInterval(updateStandbyClock, 1000);
}

window.addEventListener('DOMContentLoaded', init);
