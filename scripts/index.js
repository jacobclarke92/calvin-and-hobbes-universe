import $ from 'jquery'
import { 
	autoDetectRenderer, 
	filters, 
	loader,
	Container, 
	Graphics, 
	Sprite, 
	Point, 
	WRAP_MODES,
} from 'pixi.js'
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

const { BlurFilter, DisplacementFilter } = filters;

// :')
const auroraColors = [
	0x3b2e54, 
	0x0e7763, 
	0x944568, 
	0x00ee6d,
	0xCA5589,
	0xe594e7
];

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
const aurorasContainer = new Container();

// Create particle arrays
const stars = [];
const shootingStars = [];
const auroras = [];

function init() {
	loader.once('complete', (loader, resources) => initScene());
	loader.add('aurora1', 'assets/aurora1.png');
	loader.add('noise', 'assets/noise.jpg');
	loader.load();
}

// Called once assets are loaded
function initScene() {

	// Init fade in
	$('#overlay').addClass('hide');

	// Add stage to wrapper
	stage.addChild(aurorasContainer);
	stageWrapper.addChild(stage);

	// Init aurora patches
	for(let i=0; i<3; i ++) {
		const aurora = createAurora();
		aurorasContainer.addChild(aurora);
		auroras.push(aurora);
	}

	// Create blur filter for auroras container
	aurorasContainer.blurFilter = new BlurFilter();
	aurorasContainer.blurFilter.blurX = 0;
	aurorasContainer.blurFilter.blurY = 8 * (screenWidth / 720);

	// Create displacement map filter for auroras container
	aurorasContainer.displacementSprite = new Sprite(loader.resources['noise'].texture);
	aurorasContainer.displacementSprite.texture.baseTexture.wrapMode = WRAP_MODES.REPEAT;
	aurorasContainer.displacementSprite.anchor.set(0.5);
	stage.addChild(aurorasContainer.displacementSprite); // it doesn't appear just has to happen
	aurorasContainer.displacementFilter = new DisplacementFilter(aurorasContainer.displacementSprite);
	aurorasContainer.displacementFilter.scale.x = 50;
	aurorasContainer.displacementFilter.scale.y = 50;
	aurorasContainer.displacementFilter.padding = 100;

	// Apply filters
	aurorasContainer.filters = [
		aurorasContainer.displacementFilter, 
		aurorasContainer.blurFilter,
	];


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
	star.fallSpeed = randomFloat(0.2, 2) * (screenHeight/720);
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

function createAurora(aurora = new Container()) {

	const tint = getRandomValueFromArray(auroraColors);

	// Generate aurora sprites if new
	if(!aurora.sprites) {
		
		aurora.sprites = [];
		let scale = 0.5;
		let pos = {x: -250, y: -20};

		for(let i=0; i<8; i++) {
			// Increment sprite position and scale
			pos.x += randomFloat(20, 70);
			pos.y += randomFloat(-3, 3);
			scale += Math.cos(i/5)*0.2;

			// Create sprite and apply properties
			const sprite = new Sprite(loader.resources['aurora1'].texture);
			sprite.position = {x: pos.x, y: pos.y};
			sprite.scale.set(scale, 1 - (screenWidth/1000));
			sprite.alpha = 0;
			sprite.tint = tint;

			// Store other variables
			sprite.originalPos = {x: pos.x, y: pos.y};
			sprite.fadeIn = true;
			sprite.fadeSpeed = randomFloat(0.005, 0.02);
			sprite.drift = {x: randomFloat(0, 10), y: randomFloat(0, 30)};
			sprite.driftSpeed = {x: randomFloat(0, 1), y: randomFloat(0, 1)};

			aurora.addChild(sprite);
			aurora.sprites.push(sprite);
		}

	// Otherwise retint and reset fade for all existing sprites
	}else{
		for(let sprite of aurora.sprites) {
			sprite.tint = tint;
			sprite.alpha = 0;
			sprite.fadeIn = true;
		}
	}

	// Generate fresh aurora variables
	aurora.position = {x: randomInt(0, screenWidth), y: randomInt(50, screenHeight/1.6)};
	aurora.scale.set(screenWidth/1000)
	aurora.fadeIn = true;
	aurora.alpha = 0;
	aurora.showCounter = randomInt(500,800);
	aurora.hideCounter = randomInt(100,300);
	return aurora;
}

// Checks if co-ordinate is offstage
function isOutside(pos, minX, maxX, minY, maxY) {
	return (pos.x < minX || pos.x > maxX || pos.y < minY || pos.y > maxY);
}

// Animation station baby
function animate(t) {
	const time = (t/500);

	// This is used to scale some filter effects to account for mobile etc.
	const widthModifier = Math.max((screenWidth / 1000), 0.8);

	// Keep that shit warblin'
	aurorasContainer.displacementFilter.scale.x = (Math.cos(time/4)*100 + 150) * widthModifier;
	aurorasContainer.displacementFilter.scale.y = (Math.sin(time/6)*100 + 150) * widthModifier;
	aurorasContainer.displacementSprite.position.x += 0.5;

	// Iterate over aurora patches
	for(let aurora of auroras) {

		// Fade in an out entire patch
		if(aurora.fadeIn) {
			if(aurora.alpha < 0.75) aurora.alpha += 0.005;
			else if(--aurora.showCounter <= 0) aurora.fadeIn = false;
		}else{
			if(aurora.alpha > 0) aurora.alpha -= 0.005;
			else if(--aurora.hideCounter <= 0) createAurora(aurora);
		}

		// Iterate over aurora patch sprites to fade and move them around a bit
		for(let sprite of aurora.sprites) {
			sprite.position.x = sprite.originalPos.x + Math.cos(time*sprite.driftSpeed.x) * sprite.drift.x;
			sprite.position.y = sprite.originalPos.y + Math.sin(time*sprite.driftSpeed.y) * sprite.drift.y;
			if(sprite.fadeIn) {
				if(sprite.alpha < 1) sprite.alpha += sprite.fadeSpeed;
				else sprite.fadeIn = false;
			}else{
				if(sprite.alpha > 0.5) sprite.alpha -= sprite.fadeSpeed;
				else sprite.fadeIn = true;
			}
		}
	}

	// Iterate over regular stars and animate
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