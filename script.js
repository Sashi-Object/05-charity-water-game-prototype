const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const dropsLayer = document.getElementById('dropsLayer');
const scoreValue = document.getElementById('scoreValue');
const livesValue = document.getElementById('livesValue');
const statusMessage = document.getElementById('statusMessage');
const leftButton = document.getElementById('leftButton');
const upButton = document.getElementById('upButton');
const downButton = document.getElementById('downButton');
const rightButton = document.getElementById('rightButton');
const restartButton = document.getElementById('restartButton');

const gameState = {
	score: 0,
	lives: 3,
	stepSize: 56,
	drops: [],
	lastSpawnTime: 0,
	spawnDelay: 900,
	running: true
};

// The player only moves up and down in this version.
const playerPosition = {
	x: gameArea.clientWidth / 2 - 12,
	y: gameArea.clientHeight - 28
};

function updateHud() {
	scoreValue.textContent = `${gameState.score}`;
	livesValue.textContent = `${gameState.lives}`;
}

function placePlayer() {
	player.style.left = `${playerPosition.x}px`;
	player.style.top = `${playerPosition.y}px`;
}

function movePlayer(direction) {
	if (!gameState.running) {
		return;
	}

	const maxY = gameArea.clientHeight - player.offsetHeight;
	const maxX = gameArea.clientWidth - player.offsetWidth;

	if (direction === 'left') {
		playerPosition.x = Math.max(0, playerPosition.x - gameState.stepSize);
	}

	if (direction === 'right') {
		playerPosition.x = Math.min(maxX, playerPosition.x + gameState.stepSize);
	}

	if (direction === 'up') {
		playerPosition.y = Math.max(0, playerPosition.y - gameState.stepSize);
	}

	if (direction === 'down') {
		playerPosition.y = Math.min(maxY, playerPosition.y + gameState.stepSize);
	}

	placePlayer();
	checkIfPlayerOnLog();
}

function getPlayerRect() {
	return player.getBoundingClientRect();
}

function isOverlapping(rectA, rectB) {
	return !(
		rectA.right < rectB.left ||
		rectA.left > rectB.right ||
		rectA.bottom < rectB.top ||
		rectA.top > rectB.bottom
	);
}

function loseLife(reasonText) {
	gameState.lives -= 1;
	updateHud();

	if (gameState.lives <= 0) {
		gameState.running = false;
		statusMessage.textContent = 'Game Over';
		restartButton.classList.add('visible');
		return;
	}

	statusMessage.textContent = reasonText;
	setTimeout(() => {
		statusMessage.textContent = '';
	}, 750);

	// Reset the player to the bottom to keep the game readable for beginners.
	playerPosition.x = gameArea.clientWidth / 2 - player.offsetWidth / 2;
	playerPosition.y = gameArea.clientHeight - 28;
	placePlayer();
}

function clearAllDrops() {
	for (const dropData of gameState.drops) {
		dropData.element.remove();
	}

	gameState.drops = [];
}

function restartGame() {
	clearAllDrops();
	gameState.score = 0;
	gameState.lives = 3;
	gameState.lastSpawnTime = 0;
	gameState.running = true;

	playerPosition.x = gameArea.clientWidth / 2 - player.offsetWidth / 2;
	playerPosition.y = gameArea.clientHeight - 28;
	placePlayer();
	updateHud();

	statusMessage.textContent = 'New round started!';
	restartButton.classList.remove('visible');

	setTimeout(() => {
		statusMessage.textContent = '';
	}, 900);

	requestAnimationFrame(gameLoop);
}

function checkIfPlayerOnLog() {
	const playerRect = getPlayerRect();
	const logs = document.querySelectorAll('.log');
	let touchingLog = false;

	for (const log of logs) {
		if (isOverlapping(playerRect, log.getBoundingClientRect())) {
			touchingLog = true;
			break;
		}
	}

	if (!touchingLog) {
		loseLife('You fell in the river!');
	}
}

function createDrop() {
	const drop = document.createElement('div');
	const isToxic = Math.random() < 0.35;
	drop.className = `drop ${isToxic ? 'toxic' : 'good'}`;

	const maxLeft = gameArea.clientWidth - 24;
	const x = Math.floor(Math.random() * maxLeft);

	drop.style.left = `${x}px`;
	drop.style.top = '-24px';
	dropsLayer.appendChild(drop);

	gameState.drops.push({
		element: drop,
		x,
		y: -24,
		speed: 2 + Math.random() * 1.5,
		toxic: isToxic
	});
}

function updateDrops() {
	const playerRect = getPlayerRect();

	gameState.drops = gameState.drops.filter((dropData) => {
		dropData.y += dropData.speed;
		dropData.element.style.top = `${dropData.y}px`;

		if (dropData.y > gameArea.clientHeight + 30) {
			dropData.element.remove();
			return false;
		}

		const dropRect = dropData.element.getBoundingClientRect();
		const hitPlayer = isOverlapping(playerRect, dropRect);

		if (hitPlayer) {
			if (dropData.toxic) {
				loseLife('Toxic drop hit you!');
			} else {
				gameState.score += 1;
				updateHud();
			}

			dropData.element.remove();
			return false;
		}

		return true;
	});
}

function gameLoop(timestamp) {
	if (!gameState.running) {
		return;
	}

	if (timestamp - gameState.lastSpawnTime > gameState.spawnDelay) {
		createDrop();
		gameState.lastSpawnTime = timestamp;
	}

	updateDrops();
	requestAnimationFrame(gameLoop);
}

function handleKeyPress(event) {
	if (event.key === 'ArrowLeft') {
		movePlayer('left');
	}

	if (event.key === 'ArrowRight') {
		movePlayer('right');
	}

	if (event.key === 'ArrowUp') {
		movePlayer('up');
	}

	if (event.key === 'ArrowDown') {
		movePlayer('down');
	}
}

function startGame() {
	updateHud();
	placePlayer();
	statusMessage.textContent = 'Use Up and Down to move';

	setTimeout(() => {
		statusMessage.textContent = '';
	}, 1200);

	document.addEventListener('keydown', handleKeyPress);
	leftButton.addEventListener('click', () => movePlayer('left'));
	upButton.addEventListener('click', () => movePlayer('up'));
	downButton.addEventListener('click', () => movePlayer('down'));
	rightButton.addEventListener('click', () => movePlayer('right'));
	restartButton.addEventListener('click', restartGame);
	window.addEventListener('resize', () => {
		const maxX = gameArea.clientWidth - player.offsetWidth;
		const maxY = gameArea.clientHeight - player.offsetHeight;
		playerPosition.x = Math.min(Math.max(playerPosition.x, 0), maxX);
		playerPosition.y = Math.min(playerPosition.y, maxY);
		placePlayer();
	});

	requestAnimationFrame(gameLoop);
}

startGame();
