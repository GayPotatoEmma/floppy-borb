// Get DOM elements
const gameWindow = document.querySelector('.game-window');
const gameWindowHeight = gameWindow.offsetHeight;
const bird = document.querySelector('.bird');
const startButton = document.querySelector('.start-button');
const scoreDisplay = document.querySelector('.score');
const floor = document.createElement('div'); // Create floor element
floor.classList.add('floor');
gameWindow.appendChild(floor);

// Game Variables
let birdTop = 380;
let gravity = 0.4;
let birdVelocity = 0;
let isGameOver = true;
let score = 0;
let gap = 100; // Initial gap between pipes
let pipeSpawnTimer;
let currentHighScore = loadHighScore();
const highScoreDisplay = document.getElementById('high-score');
updateHighScoreDisplay();
let highScoreBannerShown = false;
let soundsEnabled = loadSoundState();

const changeThemeButton = document.getElementById('change-theme-button');
let isDarkTheme = loadTheme();

changeThemeButton.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    changeTheme();
    saveTheme();
    changeThemeButton.blur();
});

const toggleSoundButton = document.getElementById('toggle-sound-button');
toggleSoundButton.addEventListener('click', toggleSound);
toggleSoundButton.textContent = soundsEnabled ? "Disable Sounds" : "Enable Sounds";

function toggleSound() {
    soundsEnabled = !soundsEnabled;
    toggleSoundButton.textContent = soundsEnabled ? "Disable Sounds" : "Enable Sounds";
    saveSoundState();
    toggleSoundButton.blur(); // Move the blur() inside
}

function loadSoundState() {
    const storedState = localStorage.getItem('soundsEnabled');
    return storedState === null ? true : storedState === 'true';
}

function saveSoundState() {
    localStorage.setItem('soundsEnabled', soundsEnabled);
}

function addStars() {
    const gameWindow = document.querySelector('.game-window');
    const gameWindowHeight = gameWindow.offsetHeight;
    const numStars = 200; // Adjust the number of stars

    for (let i = 0; i < numStars; i += 1) {
        const star = document.createElement('div');
        star.classList.add('star');

        // Random position (top half only)
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * (gameWindowHeight / 1) + 'px';
        // Vary animation duration slightly
        const animationDuration = (Math.random() * 0.5 + 0.8) + 's'; // Between 0.8s and 1.3s
        star.style.animationDuration = animationDuration;

        gameWindow.appendChild(star);
    }
}

function moveStarsAndFloor() {
    if (!isGameOver) {
        // Move Stars
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            let leftPos = parseFloat(star.style.left);
            leftPos -= 0.17; // Slow movement speed
            if (leftPos < -5) {
                leftPos = 105;
            }
            star.style.left = leftPos + '%';
        });

        // Move Floor
        const floor = document.querySelector('.floor');
        let floorPos = parseFloat(floor.style.backgroundPositionX) || 0; // Get current position
        floorPos -= 1.2; // Match star movement speed

        if (floorPos <= -128) { // Assuming your floor image is twice the viewport width
            floorPos = 0; // Reset floor position
        }
        floor.style.backgroundPositionX = floorPos + '%';
    }
}

setInterval(moveStarsAndFloor, 30);

function removeStars() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => star.remove());
}

function changeTheme() {
    if (isDarkTheme) {
        document.body.style.backgroundColor = '#434343';
        document.querySelector('.game-window').style.backgroundColor = '#352C78';
        addStars();
    } else {
        document.body.style.backgroundColor = '#e0e0e0';
        document.querySelector('.game-window').style.backgroundColor = '#72C4CF';
        removeStars();
    }
}

function loadTheme() {
    const storedTheme = localStorage.getItem('theme');
    return storedTheme === 'dark'; // Return true if the stored theme is 'dark'
}

function saveTheme() {
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
}

// Initial Theme Setting
changeTheme();

// Start the game
function startGame() {
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        pipeSpawnTimer = setInterval(createPipes, 1300);
        isGameOver = false;
        gameLoop();
    });
}

// Bird jump
function jump() {
    birdVelocity = -10;
    birdTop > 0 && (birdTop -= 0); // Unchanged from before

    // Play the jump sound effect
    const wingSound = document.getElementById('wingSound');
    wingSound.currentTime = 0;
    if (soundsEnabled) {
        wingSound.play();
    }

    // Prevent flying out of the top (Always execute this)
    birdTop = Math.max(0, birdTop);
    bird.style.top = birdTop + 'px';

    if (birdTop < 10) {
        birdTop = 10;
        birdVelocity = 0.1;
    }
}

// Game loop
function gameLoop() {
    if (isGameOver) {
        return;
    }

    // Bird physics (smoother with velocity)
    birdVelocity += gravity;
    birdTop += birdVelocity;
    bird.style.top = birdTop + 'px';

    // Bird rotation
    const angle = Math.max(-45, Math.min(45, birdVelocity * 3));
    bird.style.transform = `rotate(${angle}deg)`;

    // Collision detection
    checkCollisions();

    // Update score and difficulty
    updateScore();

    requestAnimationFrame(gameLoop);

    function checkCoinPipeCollisions() {
        const coins = document.querySelectorAll('.coin');
        const pipes = document.querySelectorAll('.pipe'); // Assuming you have a 'pipe' class

        coins.forEach(coin => {
            pipes.forEach(pipe => {
                if (isCollision(coin, pipe)) {
                    gameWindow.removeChild(coin);
                }
            });
        });
    }

    // Basic rectangular collision detection
    function isCollision(object1, object2) {
        const rect1 = object1.getBoundingClientRect();
        const rect2 = object2.getBoundingClientRect();
        return !(
            (rect1.right < rect2.left ||
                rect1.left > rect2.right ||
                rect1.bottom < rect2.top || rect1.top > rect2.bottom)
        );
    }
}

// Create pipes
function createPipes() {
    let pipeTop = Math.random() * 400; // Randomize top pipe height
    let pipeBottom = pipeTop + gap + 150; // Calculate bottom pipe height
    createCoins(); // Create coins along with pipes

    // Ensure minimum difference of 50px
    if (pipeBottom > gameWindowHeight - 100) {
        pipeBottom = gameWindowHeight - 100; // Limit bottom pipe
        pipeTop = pipeBottom - gap - 150; // Recalculate top pipe
    }

    const topPipe = document.createElement('div');
    const bottomPipe = document.createElement('div');
    topPipe.classList.add('pipe', 'pipe-top');
    bottomPipe.classList.add('pipe', 'pipe-bottom');

    topPipe.style.height = (pipeTop) + 'px';
    bottomPipe.style.height = 800 - pipeBottom + 'px';

    topPipe.style.left = 600 + 'px';
    bottomPipe.style.left = 600 + 'px';

    gameWindow.appendChild(topPipe);
    gameWindow.appendChild(bottomPipe);

    movePipes(topPipe, bottomPipe);
}

// Move pipes
function movePipes(topPipe, bottomPipe) {
    let leftPos = 600;

    setInterval(() => {
        if (!isGameOver) {
            leftPos -= 3;
            topPipe.style.left = leftPos + 'px';
            bottomPipe.style.left = leftPos + 'px';

            if (leftPos === -60) {
                if (gameWindow.contains(topPipe)) {
                    gameWindow.removeChild(topPipe);
                }
                if (gameWindow.contains(bottomPipe)) {
                    gameWindow.removeChild(bottomPipe);
                }
                // Reset scored flag:
                topPipe.scored = false;
                bottomPipe.scored = false;
            }
        }
    }, 15);
}

// Coin System
let coinCount = loadCoins();
const coinCountDisplay = document.getElementById('coin-count');
updatecoinCountDisplay();
const notEnoughCoinsBanner = document.getElementById('not-enough-coins-banner');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Other initialization code (if needed)
    const gameWindow = document.querySelector('.game-window');
    // ... more initialization

    // 2. Code for birdBoxes and lock states
    const birdBoxes = Array.from(document.querySelectorAll('.bird-box'));

    // Initial Setup - Adjusted Loop
    for (let i = 1; i <= 9; i += 1) { // Start the loop at index 1
        if (i !== 1) { // Keep other birds locked
            birdBoxes[i - 1].dataset.locked = 'true';
        }
    }

    // Define loadBirdUnlocks here, inside the listener
    function loadBirdUnlocks() {
        // ... Your existing loadBirdUnlocks function code
    }

    // Load saved bird lock states (include bird1 as unlocked)
    let birdLockStates = loadBirdUnlocks();

    // Ensure bird1 is unlocked in birdLockStates
    birdLockStates[0] = false;

    birdBoxes.forEach((box, index) => {
        const locked = birdLockStates[index]; // Get the lock state
        box.dataset.locked = locked.toString(); // Set dataset property

        if (!locked) {
            const img = box.querySelector('img');
            img.src = `assets/textures/bird${index + 1}.png`; // Update image if unlocked
        }

        // Event Listener for Clicks on Bird Boxes (inside DOMContentLoaded)
        box.addEventListener('click', () => {
            console.log('Bird clicked!');
            const birdId = box.dataset.birdId;

            if (box.dataset.locked === 'true') {
                if (coinCount >= 50) {
                    coinCount -= 50;
                    coinCountDisplay.textContent = coinCount;
                    unlockBird(birdId);
                } else {
                    showNotEnoughCoinsBanner();
                }
            } else {
                changeBirdSprite(index + 1);
            }
        });
    });

    // 3. Additional initialization that depends on birdBoxes being ready

    // Define your functions within the DOMContentLoaded listener:
    function unlockBird(birdId) {
        const box = document.querySelector(`[data-bird-id="${birdId}"]`);
        const img = box.querySelector('img');
        img.src = `assets/textures/bird${birdId}.png`;
        box.dataset.locked = 'false';
        saveCoins();   // Save the updated coin count
        saveBirdUnlocks();
    }

    function saveBirdUnlocks() {
        const birdLockStates = [];
        birdBoxes.forEach(box => {
            birdLockStates.push(box.dataset.locked === 'true'); // true if locked, false if unlocked
        });

        localStorage.setItem('birdLockStates', JSON.stringify(birdLockStates));
    }

    function loadBirdUnlocks() {
        const savedLockStates = localStorage.getItem('birdLockStates');
        if (savedLockStates) {
            const loadedStates = JSON.parse(savedLockStates);

            // Ensure bird1 is unlocked in loaded states
            loadedStates[0] = false;

            return loadedStates;
        } else {
            // Initialize default states if nothing is saved (e.g., all locked)
            return birdBoxes.map(() => true);
        }
    }

    // ... (rest of your code using birdLockStates)
});
function changeBirdSprite(birdId) {
    const birdElement = document.querySelector('.bird');
    birdElement.style.backgroundImage = `url('assets/textures/bird${birdId}.png')`;
}

function showNotEnoughCoinsBanner() {
    const banner = document.getElementById('not-enough-coins-banner');
    banner.style.display = "block"; // Make the banner visible
    banner.style.top = "20px";

    setTimeout(() => {
        banner.style.top = "-60px";
    }, 2000);
}

function generateCoin(pipeTop, pipeBottom) {
    const minY = pipeTop.bottom + coinHeight;
    const maxY = pipeBottom.top - coinHeight;

    const coin = document.createElement('div');
    coin.classList.add('coin');

    // Positions with respect to the pipe edges
    coin.style.left = pipeTop.left + pipeTop.width + 'px';
    coin.style.top = getRandomInt(minY, maxY) + 'px';

    gameWindow.appendChild(coin);
}

// Helper function to get a random integer within a range
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createCoins() {
    if (Math.random() < 0.05) { // 5% chance to spawn a coin
        const coin = document.createElement('div');
        coin.classList.add('coin');

        const coinY = Math.random() * (gameWindowHeight - gap - 200) + 100;
        coin.style.top = coinY + 'px';
        coin.style.left = 600 + 'px';

        gameWindow.appendChild(coin);
    }
}

function moveCoins() {
    if (!isGameOver) {
        const coins = document.querySelectorAll('.coin');
        coins.forEach(coin => {
            let leftPos = parseFloat(coin.style.left);
            leftPos -= 3;

            if (leftPos <= -40) {
                gameWindow.removeChild(coin);
            } else {
                coin.style.left = leftPos + 'px';
            }
        });
    }
}

function isCollision(object1, object2) {
    // Implement your collision detection logic here
    // Example:
    const rect1 = object1.getBoundingClientRect();
    const rect2 = object2.getBoundingClientRect();
    return !(
        (rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top || rect1.top > rect2.bottom)
    );
}

// Check collisions
function checkCollisions() {
    const pipes = document.querySelectorAll('.pipe');
    pipes.forEach(pipe => {
        const pipeRect = pipe.getBoundingClientRect();
        const birdRect = bird.getBoundingClientRect();

        // Accurate collision detection
        const hitboxShrinkage = 10; // Adjust this value as needed

        if (
            pipeRect.left + hitboxShrinkage < birdRect.right - hitboxShrinkage &&
            pipeRect.right - hitboxShrinkage > birdRect.left + hitboxShrinkage &&
            pipeRect.left < birdRect.right &&
            pipeRect.right > birdRect.left &&
            (pipeRect.bottom > birdRect.top && pipeRect.top < birdRect.bottom)
        ) {
            gameOver();
        }
    });

    // Coin Collision
    const coins = document.querySelectorAll('.coin');
    coins.forEach(coin => {
        if (isCollision(bird, coin)) {
            gameWindow.removeChild(coin);
            incrementCoins();
        }
    });

    // Check with floor
    if (birdTop >= 730) {
        gameOver();
    }
}

function incrementCoins() {
    coinCount += 1;
    updatecoinCountDisplay();
    saveCoins();
}

function loadCoins() {
    const savedCoins = localStorage.getItem('coins');
    return savedCoins ? parseInt(savedCoins, 10) : 0;
}

function saveCoins() {
    localStorage.setItem('coins', coinCount);
}

function updatecoinCountDisplay() {
    coinCountDisplay.textContent = coinCount;
}

setInterval(moveCoins, 15); // Move coins regularly

function updateScore() {
    const pipes = document.querySelectorAll('.pipe');
    pipes.forEach(pipe => {
        const pipeRect = pipe.getBoundingClientRect();
        const birdRect = bird.getBoundingClientRect();

        // Calculate the approximate center of the pipe
        const pipeCenterX = pipeRect.left + pipeRect.width / 2;

        if (pipeCenterX < birdRect.right && !pipe.scored) {
            pipe.scored = true;
            score += 0.5;
            scoreDisplay.textContent = score;

            // Play the sound effect
            if (soundsEnabled) { // Check the flag before playing sound
                const pointSound = document.getElementById('pointSound');
                pointSound.currentTime = 0;
                pointSound.play();
            }

            // Update high score tracking
            if (score > currentHighScore) {
                currentHighScore = score;
                updateHighScoreDisplay();
                saveHighScore(currentHighScore);

                if (!highScoreBannerShown) {
                    showNewHighScoreBanner();
                    highScoreBannerShown = true;
                }
            }
        }
    });

    // Difficulty adjustment
    if (score > 5) {
        gap = Math.max(100, gap - 3);
    }
}

function showNewHighScoreBanner() {
    const banner = document.getElementById('new-high-score-banner');
    banner.style.top = '20px'; // Slide in

    setTimeout(() => {
        banner.style.top = '-60px'; // Slide out
    }, 2000); // 2 second delay
}

// Game over
function gameOver() {
    isGameOver = true;

    // Play the hit sound effect
    if (soundsEnabled) {
        const hitSound = document.getElementById('hitSound');
        hitSound.currentTime = 0;
        hitSound.play();
    }

    // Clear pipe timers
    const pipes = document.querySelectorAll('.pipe');
    pipes.forEach(pipe => {
        clearInterval(pipe.moveTimer);
    });

    // Button display logic
    const gameOverButton = document.querySelector('.game-over-button');
    gameOverButton.style.display = 'block';

    const restartButton = document.querySelector('.restart-button');
    restartButton.style.display = 'block';
    restartButton.addEventListener('click', resetGame);

    const quitButton = document.querySelector('.quit-button');
    quitButton.style.display = 'block';
    quitButton.addEventListener('click', () => {
        window.close();
    });

    // Flash effect (with additional logging)
    const flashOverlay = document.getElementById('flash-overlay');

    if (flashOverlay) {
        flashOverlay.style.backgroundColor = isDarkTheme ? 'black' : 'white';
        flashOverlay.style.opacity = '1';
        flashOverlay.style.display = 'block';

        setTimeout(() => {
            // Fade out the flash
            const fadeInterval = setInterval(() => {
                let opacity = parseFloat(flashOverlay.style.opacity);
                opacity -= 0.05;
                flashOverlay.style.opacity = opacity;

                if (opacity <= 0) {
                    clearInterval(fadeInterval);
                    flashOverlay.style.display = 'none';
                }
            }, 20);
        }, 50);
    } else {
        console.error("Flash overlay element not found!");
    }
}

function resetGame() {
    // Remove existing pipes
    const pipes = document.querySelectorAll('.pipe');
    pipes.forEach(pipe => gameWindow.removeChild(pipe));

    // Reset bird position & velocity
    birdTop = 380;
    bird.style.top = birdTop + 'px';
    birdVelocity = 0;

    // Reset bird rotation
    bird.style.transform = 'rotate(0deg)';

    // Reset score
    score = 0;
    scoreDisplay.textContent = score;

    // Hide buttons & restart game state
    document.querySelector('.game-over-button').style.display = 'none';
    document.querySelector('.restart-button').style.display = 'none';
    document.querySelector('.quit-button').style.display = 'none';
    document.querySelector('.start-button').style.display = 'block';

    // Clear any existing timers
    clearInterval(pipeSpawnTimer);

    // Reset the new high score flag
    highScoreBannerShown = false;

    // Reset Jump Strength Variable (if applicable)
    jumpBoost = -8; // Or your initial jump strength value
}

// Load high score from localStorage (or initializes zero)
function loadHighScore() {
    const savedScore = localStorage.getItem('highScore');
    const score = savedScore ? parseInt(savedScore, 10) : 0;
    console.log("Loaded Score:", score); // Check console
    return score;
}

// Save high score to localStorage
function saveHighScore(score) {
    localStorage.setItem('highScore', score);
}

// Updates the high score display
function updateHighScoreDisplay() {
    highScoreDisplay.textContent = currentHighScore;
}

// KEY CHANGE: Event listener is added outside of startGame
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && isGameOver === false) { // Add game state check
        jump();
    }
});

document.addEventListener('mousedown', (e) => {
    if (e.button === 0 && isGameOver === false && !isButtonClicked(e)) {
        jump();
    }
});

// Helper function to check if a button was clicked
function isButtonClicked(e) {
    // Adjust the selectors to accurately target your button elements
    const buttons = document.querySelectorAll('.game-over-button, .restart-button, .action-button, .start-button, #change-theme-button, #toggle-sound-button, #bird-selection');

    for (let i = 0; i < buttons.length; i += 1) {
        if (buttons[i].contains(e.target)) {
            return true;
        }
    }
    return false;
}

startGame(); // Start the game at the end to ensure everything is ready