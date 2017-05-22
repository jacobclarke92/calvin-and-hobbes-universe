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
const renderer = autoDetectRenderer(
	screenWidth, 
	screenHeight, 
	{
		resolution: getPixelDensity(),
		transparent: false,
		backgroundColor: 0x010006,
		antialias: true,
	}
);
const canvas = renderer.view;
$app.append(canvas);


const stageWrapper = new Container();
const stage = new Container();

const stars = [];
const shootingStars = [];

function init() {

	$('#overlay').addClass('hide');
	stageWrapper.addChild(stage);

	for(let i=0; i<500; i++) {
		const star = createStar();
		stage.addChild(star);
		stars.push(star);
	}

	for(let i=0; i<2; i++) {
		const shootingStar = createShootingStar();
		stage.addChild(shootingStar);
		shootingStars.push(shootingStar);
	}

	animate();
}

function createStar(star = new Container()) {
	if(!star.graphics) {
		star.graphics = new Graphics();
		star.addChild(star.graphics);
	}
	star.radius = randomFloat(1, 10);
	star.aimAlpha = randomFloat(0.5, 1);
	star.alpha = 0;
	star.fadeIn = true;
	star.scale.set(0.2 / getPixelDensity());
	star.fallSpeed = randomFloat(0.2, 2);
	star.position = {x: randomInt(0, screenWidth), y: randomInt(-50, screenHeight)};
	star.graphics.cacheAsBitmap = false;
	star.graphics.clear();
	star.graphics.lineStyle(0, 0xFFFFFF, 1);
	star.graphics.beginFill(0xFFFFFF);
	star.graphics.drawCircle(star.radius, 0, star.radius);
	star.graphics.endFill();
	star.graphics.cacheAsBitmap = true;
	return star;
}

function createShootingStar(star = new Container()) {
	if(!star.graphics) {
		star.graphics = new Graphics();
		star.addChild(star.graphics);
	}
	star.counter = 0;
	star.resetTime = randomInt(100, 500);
	star.speed = randomFloat(10, 15);
	star.rotation = randomFloat(0, Math.PI);
	star.position = {
		y: randomInt(-50, screenHeight), 
		x: star.rotation > Math.PI/2 ? screenWidth : 0,
	};

	// draw gradient line
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

function isOutside(pos, minX, maxX, minY, maxY) {
	return (pos.x < minX || pos.x > maxX || pos.y < minY || pos.y > maxY);
}

function animate() {

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

	for(let star of shootingStars) {
		star.position.x += Math.cos(star.rotation) * star.speed;
		star.position.y += Math.sin(star.rotation) * star.speed;
		if(star.counter > 0 || isOutside(star.position, -100, screenWidth + 100, -100, screenHeight + 100)) {
			if(++star.counter >= star.resetTime) {
				createShootingStar(star);
			}
		}
	}

	renderer.render(stageWrapper);
	window.requestAnimationFrame(animate);
}

function handleResize(width, height) {
	screenWidth = width/getPixelDensity();
	screenHeight = height/getPixelDensity();
	renderer.resize(screenWidth, screenHeight);
}

addResizeCallback(handleResize);
$(window).ready(init);