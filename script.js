// Get DOM elements
const timerDisplay = document.getElementById('timerDisplay');
const hoursInput = document.getElementById('hoursInput');
const minutesInput = document.getElementById('minutesInput');
const secondsInput = document.getElementById('secondsInput');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resetButton = document.getElementById('resetButton');
const chimeSound = document.getElementById('chimeSound');
const creature = document.getElementById('creature');
const chimeSelect = document.getElementById('chimeSelect');

// --- State Variables ---
let countdown; // Stores the interval ID for the timer
let timeRemaining; // Stores the remaining time in seconds
let isPaused = false;
let isRunning = false; // To track if timer is actively running
let currentCreatureAnimation = 'walking'; // Track creature's current animation
let initialSetDuration = 0; // Store the duration user initially sets

// --- Timer Functions ---

// Formats total seconds into HH:MM:SS string
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Updates the timer display on screen
function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timeRemaining);
}

// Gets the total duration in seconds from the input fields
function getTotalSecondsFromInputs() {
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;

    // Basic validation: ensure values are non-negative and minutes/seconds are within range
    if (hours < 0 || minutes < 0 || seconds < 0 || minutes > 59 || seconds > 59) {
        console.error('Invalid time values entered (minutes and seconds between 0-59).');
        return 0; // Return 0 to indicate invalid input
    }

    return (hours * 3600) + (minutes * 60) + seconds;
}

// Sets the input fields based on a total number of seconds (not strictly needed here but harmless)
function setInputsFromTotalSeconds(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    hoursInput.value = String(hours);
    minutesInput.value = String(minutes);
    secondsInput.value = String(seconds);
}

// Function to set creature's animation
function setCreatureAnimation(animationName) {
    if (!creature) return; // Ensure creature element exists
    if (currentCreatureAnimation === animationName) {
        return; // No change needed
    }
    // Remove previous animation class
    if (currentCreatureAnimation) {
        creature.classList.remove(`creature-${currentCreatureAnimation}`);
    }
    // Add new animation class
    creature.classList.add(`creature-${animationName}`);
    currentCreatureAnimation = animationName; // Update state
}

// Starts or resumes the timer
function startTimer() {
    if (isRunning && !isPaused) {
        return; // Already running
    }

    if (!isPaused) {
        // If not paused, this is a fresh start or a reset was just pressed
        const totalDuration = getTotalSecondsFromInputs();
        if (totalDuration <= 0) {
            timerDisplay.textContent = "Set a Time!";
            setTimeout(() => { // Revert message after a short delay
                updateTimerDisplay();
                resetTimer(); // Also reset state if invalid input
            }, 1500); // 1.5 seconds
            return;
        }
        timeRemaining = totalDuration;
        initialSetDuration = totalDuration; // Store for animation logic reference
    }

    isRunning = true;
    isPaused = false;
    updateButtonStates(); // Update button enable/disable status
    disableTimeInputs(); // Disable inputs when timer starts

    if (countdown) {
        clearInterval(countdown);
    }

    // Start creature animation when timer starts
    setCreatureAnimation('walking'); // Start walking

    countdown = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(countdown);
            isRunning = false;
            
            // Play chime sound immediately
            if (chimeSound) {
                chimeSound.play().catch(e => console.error("Error playing sound:", e));
            }
            
            // Display on-screen message
            timerDisplay.textContent = "Time is Up!"; 
            
            // REMOVED: The setTimeout that cleared this message.
            // It will now stay until resetTimer() is called.

            updateButtonStates();
            enableTimeInputs(); // Enable inputs after completion
            triggerCompletionAnimation(); // Visual feedback for completion (e.g., dimming fire)
            return;
        }

        timeRemaining--;
        updateTimerDisplay();
        updateVisualsBasedOnTime(); // Update pixel art scene (like fireplace and creature)
    }, 1000); // Update every second
}

// Pauses the timer
function pauseTimer() {
    if (!isRunning) {
        return; // Only pause if timer is currently running
    }
    clearInterval(countdown);
    isPaused = true;
    isRunning = false;
    updateButtonStates();
    enableTimeInputs(); // Enable inputs when paused to allow adjustment

    // Set creature to idle animation when paused
    setCreatureAnimation('idle');
}

// Resets the timer to initial state
function resetTimer() {
    clearInterval(countdown);
    isRunning = false;
    isPaused = false;

    // Set default values for inputs to 0
    hoursInput.value = "0";
    minutesInput.value = "0";
    secondsInput.value = "0";

    // Calculate initial timeRemaining based on these default values
    timeRemaining = getTotalSecondsFromInputs();
    updateTimerDisplay(); // Update display to show initial 00:00:00
    updateButtonStates(); // Ensure correct button states
    enableTimeInputs(); // Ensure inputs are enabled
    resetVisuals(); // Reset pixel art scene to initial state (full fire and walking creature)
    initialSetDuration = 0; // Clear initial duration on reset

    // Stop the chime sound if it's playing and rewind it
    if (chimeSound) {
        chimeSound.pause();
        chimeSound.currentTime = 0; // Rewind to the beginning
    }
}

// --- Input Enable/Disable Functions ---
function disableTimeInputs() {
    hoursInput.disabled = true;
    minutesInput.disabled = true;
    secondsInput.disabled = true;
}

function enableTimeInputs() {
    hoursInput.disabled = false;
    minutesInput.disabled = false;
    secondsInput.disabled = false;
}

// --- Visual & Animation Functions ---

// This function will be called every second to update your pixel art scene and creature
function updateVisualsBasedOnTime() {
    const fireplaceFire = document.querySelector('.fireplace .fire');
    if (!fireplaceFire) return;

    // Use initialSetDuration (stored at timer start) for consistent animation timing reference
    let referenceDuration = initialSetDuration;
    if (referenceDuration === 0) { // Fallback if initialSetDuration somehow not set or 0
        referenceDuration = getTotalSecondsFromInputs();
        if (referenceDuration === 0) referenceDuration = 1;
    }
    
    const fireProgress = (timeRemaining / referenceDuration);

    if (fireProgress > 0.1) {
        fireplaceFire.style.opacity = 0.3 + (fireProgress * 0.7);
    } else {
        fireplaceFire.style.opacity = 0.1;
    }

    // Creature animation logic based on timer state and progress
    if (isRunning) {
        // Implement walk-sit-walk cycle based on the initial set duration
        const segmentDuration = referenceDuration / 3; // Divide total time into 3 segments
        const timeElapsed = referenceDuration - timeRemaining; // Time elapsed since start

        if (timeElapsed < segmentDuration) {
            setCreatureAnimation('walking'); // First third: walking
        } else if (timeElapsed >= segmentDuration && timeElapsed < (segmentDuration * 2)) {
            setCreatureAnimation('sitting'); // Middle third: sitting
        } else {
            setCreatureAnimation('walking'); // Last third: walking again
        }
    } else if (isPaused) {
        setCreatureAnimation('idle'); // If paused, creature idles
    }
}

// Function to reset visuals to their initial state
function resetVisuals() {
    const fireplaceFire = document.querySelector('.fireplace .fire');
    if (fireplaceFire) {
        fireplaceFire.style.opacity = 1; // Full fire
    }
    // Reset creature animation to initial walking state
    setCreatureAnimation('walking');
}

// Function to trigger a final animation or visual change when time is up
function triggerCompletionAnimation() {
    const fireplaceFire = document.querySelector('.fireplace .fire');
    if (fireplaceFire) {
        fireplaceFire.style.opacity = 0.1; // Almost completely out
    }
    // Make creature idle when timer finishes
    setCreatureAnimation('idle');
}

// Updates which buttons are enabled/disabled based on current state
function updateButtonStates() {
    startButton.disabled = isRunning;
    pauseButton.disabled = !isRunning || isPaused;
    // Reset button disabled only when running AND time is not 0 (prevents reset when time is 0 and not running)
    resetButton.disabled = isRunning && timeRemaining > 0;
}

// --- Event Listeners ---
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);

// Event listener for chime selection
chimeSelect.addEventListener('change', () => {
    chimeSound.src = chimeSelect.value;
    localStorage.setItem('selectedChime', chimeSelect.value); // Save selection to local storage
});

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load saved chime preference
    const savedChime = localStorage.getItem('selectedChime');
    if (savedChime) {
        chimeSound.src = savedChime;
        chimeSelect.value = savedChime; // Set the dropdown to the saved value
    } else {
        // If no saved chime, default to the first option and save it
        chimeSelect.value = "assets/chime.mp3"; 
        localStorage.setItem('selectedChime', chimeSelect.value);
    }

    resetTimer(); // Set initial display and button states
});