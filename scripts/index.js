import { autoDetectRenderer, Container, Graphics } from 'pixi.js'
import $ from 'jquery'
import { 
	addResizeCallback, 
	getPixelDensity, 
	getScreenWidth, 
	getScreenHeight 
} from './utils/screenUtils'
import {
	radToDeg,
	degToRad,
	randomInt,
	randomFloat,
	getRandomValueFromArray,
} from './utils/mathUtils'

// Set screen size
let screenWidth = getScreenWidth()/getPixelDensity();
let screenHeight = getScreenHeight()/getPixelDensity();

// Init PIXI renderer
const $app = $('#background');
const renderer = autoDetectRenderer({
	width: screenWidth, 
	height: screenHeight, 
	resolution: getPixelDensity(),
	transparent: false,
	backgroundColor: 0x010006,
	antialias: true,
	// forceCanvas: true, // my laptop gpu is fucked
});
const canvas = renderer.view;
$app.append(canvas);

// Create stage containers
const stageWrapper = new Container();
const stage = new Container();

// Create particle arrays
const stars = [];
const shootingStars = [];

// Called on page load
function init() {

	// Init fade in
	$('#overlay').addClass('hide');

	// Add stage to wrapper
	stageWrapper.addChild(stage);

	// Init regular stars
	for(let i=0; i<500; i++) {
		const star = createStar();
		stage.addChild(star);
		stars.push(star);
	}

	// Init shooting stars
	for(let i=0; i<2; i++) {
		const shootingStar = createShootingStar();
		stage.addChild(shootingStar);
		shootingStars.push(shootingStar);
	}

	// Start animation
	animate();
}

// Creates a new star or reassigns an old one
function createStar(star = new Container()) {

	// Init graphics object if not created
	if(!star.graphics) {
		star.graphics = new Graphics();
		star.addChild(star.graphics);
		// Draw circle
		star.graphics.lineStyle(0, 0xFFFFFF, 1);
		star.graphics.beginFill(0xFFFFFF);
		star.graphics.drawCircle(10, 0, 10);
		star.graphics.endFill();
		star.graphics.cacheAsBitmap = true;
	}

	// Create fresh vars
	star.aimAlpha = randomFloat(0.5, 1);
	star.alpha = 0;
	star.fadeIn = true;
	star.scale.set(randomFloat(0.1, 1)*0.2 / getPixelDensity());
	star.fallSpeed = randomFloat(0.2, 2);
	star.position = {x: randomInt(0, screenWidth), y: randomInt(-50, screenHeight)};
	
	return star;
}

// Creates a new shooting star or reassigns an old one
function createShootingStar(star = new Container()) {

	// Init graphics object if not created
	if(!star.graphics) {
		star.graphics = new Graphics();
		star.addChild(star.graphics);
	}

	// Create fresh vars
	star.counter = 0;
	star.resetTime = randomInt(200, 800);
	star.speed = randomFloat(10, 15);
	star.rotation = randomFloat(0, Math.PI);
	star.position = {
		y: randomInt(-50, screenHeight), 
		x: star.rotation > Math.PI/2 ? screenWidth : 0,
	};

	// Draw gradient line
	star.graphics.cacheAsBitmap = false;
	star.graphics.clear();
	const dist = randomInt(-5, -25);
	let currentDist = 0;
	for(let i=0; i<10; i++) {
		star.graphics.lineStyle(1, 0xFFFFFF, (1 - (i/10)) / 2);
		star.graphics.moveTo(currentDist, 0);
		currentDist += dist;
		star.graphics.lineTo(currentDist, 0);
	}
	star.graphics.cacheAsBitmap = true;
	return star;
}

// Checks if co-ordinate is outside offstage
function isOutside(pos, minX, maxX, minY, maxY) {
	return (pos.x < minX || pos.x > maxX || pos.y < minY || pos.y > maxY);
}

// Animation station baby
function animate() {

	// Iterative over regular stars and animate
	for(let star of stars) {
		star.position.y += star.fallSpeed;
		if(star.fadeIn) {
			if(star.alpha < star.aimAlpha) star.alpha += 0.05;
			else star.fadeIn = false;
		}else{
			if(star.alpha > 0) star.alpha -= 0.02;
			else createStar(star);
		}
	}

	// Iterate over shooting stars and animate
	for(let star of shootingStars) {
		star.position.x += Math.cos(star.rotation) * star.speed;
		star.position.y += Math.sin(star.rotation) * star.speed;
		if(star.counter > 0 || isOutside(star.position, -100, screenWidth + 100, -100, screenHeight + 100)) {
			if(++star.counter >= star.resetTime) {
				createShootingStar(star);
			}
		}
	}

	// Render and repeat animation
	renderer.render(stageWrapper);
	window.requestAnimationFrame(animate);
}

// Called upon window resize, updates vars and renderer size
function handleResize(width, height) {
	screenWidth = width/getPixelDensity();
	screenHeight = height/getPixelDensity();
	renderer.resize(screenWidth, screenHeight);
}

// Add resize and onload callbacks
addResizeCallback(handleResize);
$(window).ready(init);