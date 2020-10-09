// Andrew Pratt 2020

// How long it takes to heal in milliseconds
const HEAL_TIME = 209196864
// Speed of the ground in pixels/millisecond. Negative values move left
const GROUND_SPEED = -0.5;

// Name of localStorage key for when the player will be healed.
// Absent if player isn't injured
const STORAGE_KEY_HEAL_DATE = "mobile_bike_sim_heal_date";


// Pracache sounds
var sndJump = new Audio("res/jump.mp3");
var sndCrash = new Audio("res/crash.mp3");
var sndGameMusic = new Audio("res/game_music.mp3");



// Structure for the player (the bike)
function Bike_Player()
{
	// Height of ground from bottom of screen in pixels
	this.groundHeight = 5;
	// Height from the ground in pixels
	this.yPos = 0;
	// Upwards speed in pixels/step
	this.speed = 0;
	// Initial upwards speed in pixels/step when jumping
	this.jumpSpeed = 30;
	// True when jumping, false when on ground
	this.bIsJumping = false;
	// Acceleration due to gravity in pixels/step^2
	this.gravity = -1;
	// X Position of obstacle in pixels
	this.obstacleXPos = 0;
	// Player's current score
	this.score = 0;
}



// Returns true if player is injured
function isPlayerInjured()
{
	return (getHealDate() != null);
}


// Returns when the player who was injured right this moment will be healed
function generateHealDate()
{
	return Date.now() + HEAL_TIME;
}


// Returns when the player will be healed
function getHealDate()
{
	return localStorage.getItem(STORAGE_KEY_HEAL_DATE);
}
// Set when the player will be healed, or null if they aren't injured
function setHealDate(date)
{
	localStorage.setItem(STORAGE_KEY_HEAL_DATE, date);
}


// Returns how long until the player will be healed
function getHealTimeLeft()
{
	return getHealDate() - Date.now();
}


// Call to injure player
function injurePlayer()
{
	setHealDate(generateHealDate())
}

// Call to heal player
function healPlayer()
{
	localStorage.removeItem(STORAGE_KEY_HEAL_DATE);
}


// Called every step of the game
// startTime is the time the game started as a Date object
// ply is the player as a Bike_Player object
function onGameStep(startTime, ply)
{
	// Offset the sidewalk texture, based on how much time has passed
	$("#sidewalkImg").css("background-position-x", (GROUND_SPEED * (Date.now() - startTime) ) + "px");
	
	// Update player physics
	if (ply.bIsJumping)
	{
		ply.speed += ply.gravity;
		ply.yPos += ply.speed;
	}
	
	if (ply.yPos < 0)
	{
		ply.yPos = 0;
		ply.speed = 0;
		ply.bIsJumping = false;
	}
	
	// Update player img
	$("#bikeImg").css("bottom", (ply.groundHeight + ply.yPos) + "px");
	
	// Update score text
	$("#scoreTextVal").text(ply.score);
	
	// Update obstacle
	ply.obstacleXPos += GROUND_SPEED * 20;
	
	if (ply.obstacleXPos < -$("#obstacleImg").width())
		placeObstacle(ply, true)
	
	// Update obstacleImg
	$("#obstacleImg").css("left", (ply.obstacleXPos) + "px");
	
	// Collision detection
	if
	(
		parseInt( ply.obstacleXPos, 10 ) <= parseInt( $("#bikeImg").position().left + $("#bikeImg").width(), 10 ) - 30 // -30 at the end to avoid weird hitbox shit
		&& parseInt( ply.yPos, 10 ) <= parseInt( $("#obstacleImg").height(), 10 )
	)
	{
		onPlayerCollide();
	}
}

// Called every step of the injured screen
function onInjuredStep(startTime, ply)
{
	// Get timer value
	let timeLeft = getHealTimeLeft();
	
	// Refresh page and heal if timer hit zero
	if (timeLeft < 0)
	{
		healPlayer();
		location.reload();
		return;
	}
	
	// Calculate formatted time
	let hoursLeft	= Math.floor( timeLeft / 3600000	);
	let minLeft		= Math.floor( timeLeft / 60000		) - (hoursLeft * 60);
	let secLeft		= Math.floor( timeLeft / 1000		) - (hoursLeft * 3600) - (minLeft * 60);
	// Update timer
	$("#injuredCounterValue").text(hoursLeft + "hr : " + minLeft + "min : " + secLeft + "sec");
}

// Event handler for when player collides with obstacle
function onPlayerCollide()
{
	// Injure player
	injurePlayer();
	// Stop music
	sndGameMusic.pause();
	// Play sound effect
	sndCrash.play();
	// Go to injured screen
	startScreenInjured();
}


// Call to make player (argument ply) jump
function doJump(ply)
{
	// Bail if already jumping
	if (ply.bIsJumping) return;
	
	ply.bIsJumping = true;
	ply.speed = ply.jumpSpeed;
	
	// Play sound
	sndJump.play();
}

// Call to place next obstacle
function placeObstacle(ply, incScore)
{
	ply.obstacleXPos = 30 + window.screen.width + $("#obstacleImg").width();
	if (incScore) ply.score += 1;
}


// Call to start in-game screen
// ply is the player as a Bike_Player object
function startScreenInGame(ply)
{
	// Stop current loop
	window.clearInterval(g_intervalFunc);
	// Hide other screens
	$("#container_start").hide();
	$("#container_injured").hide();
	// Show in-game screen
	$("#container_inGame").show();
	
	// Setup input handler
	$("#container_inGame").click( function() {doJump(ply);} );

	// Start music
	sndGameMusic.play();
	
	// Place initial obstacle
	placeObstacle(ply);
	// Setup obstacle image y position
	$("#obstacleImg").css("bottom", ply.groundHeight);
	
	// Get the current time
	let startTime = Date.now();
	// Start game loop
	g_intervalFunc = window.setInterval(function() { onGameStep(startTime, ply); }, 20);
	
}

// Call to start injured screen
function startScreenInjured()
{
	// Stop current loop
	window.clearInterval(g_intervalFunc);
	// Hide other screens
	$("#container_start").hide();
	$("#container_inGame").hide();
	// Show injured screen
	$("#container_injured").show();
	
	// Start injured screen loop
	g_intervalFunc = window.setInterval(function() { onInjuredStep(); }, 20);
}


// Global var holding the game's current interval function
var g_intervalFunc = null
// Main
function main()
{
	// Make sure only the start screen is visible
	$("#container_inGame").hide();
	$("#container_injured").hide();
	
	// Go right to injured screen if player is injured
	if (isPlayerInjured()) startScreenInjured();
	
	// Init player
	let ply = new Bike_Player();
	
	// Setup handler for start button press
	$("#startBtn").click( function() {startScreenInGame(ply);} );
}

// Run main when ready
$(document).ready(main);