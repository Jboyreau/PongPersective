/*-----2D-----*/
var start = document.getElementById("start-id");
var canvas = document.getElementById("canvas-id");
var context = canvas.getContext("2d");
var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
var colorBuffer = imageData.data;
var BUFFER_SIZE = canvas.width * canvas.height * 4;
var RED_SIDE_SIZE = canvas.width / 2;
var GREEN_SIDE_SIZE = canvas.width;
/*-----PERSPECTIVE-----*/
var yOffset = 0;
var xOffset = 0;
var zOffset = 0;
var scaler = 2;
var yGrid = 250;
var MID_WIDTH = canvas.width / 2;
var MID_HEIGHT = canvas.height / 2;
var MID_DEPTH = (1 + 0.15 * 21) / 2;
var grid3D = [];


/*-----------Functions----------*/
function putPixel(i, r, g, b, a)
{	
	colorBuffer[i] = r;
	colorBuffer[i + 1] = g;
	colorBuffer[i + 2] = b;
	colorBuffer[i + 3] = a;
}

function create2Dgrid(SQUARE_SIZE)
{
	for (z = 0; z < canvas.height; ++z)
	{
		if (z % SQUARE_SIZE == 0 || z == canvas.height - 1)
		{	
			for (x = 0; x < RED_SIDE_SIZE; ++x)
				putPixel((z * canvas.width + x) * 4, 255, 0, 0, 255);
			for (x = RED_SIDE_SIZE; x < canvas.width; ++x)
				putPixel((z * canvas.width + x) * 4, 0, 255, 0, 255);
			putPixel((z * canvas.width + x - 1) * 4, 0, 255, 0, 255);
		}
		else
		{	
			for (x = 0; x < RED_SIDE_SIZE; x += SQUARE_SIZE)
				putPixel((z * canvas.width + x) * 4, 255, 0, 0, 255);
			for (x = RED_SIDE_SIZE; x < canvas.width; x += SQUARE_SIZE)
				putPixel((z * canvas.width + x) * 4, 0, 255, 0, 255);
			putPixel((z * canvas.width + x - 1) * 4, 0, 255, 0, 255);
		}
	}
}

function drawLineDDA(x0, y0, x1, y1, r, g, b, a)
{
	let dx = x1 - x0;
	let dy = y1 - y0;
	let steps;

	// Calculer le nombre de pas en fonction du changement maximal (dx ou dy)
	if (Math.abs(dx) > Math.abs(dy)) {
		steps = Math.abs(dx);
	} else {
		steps = Math.abs(dy);
	}

	// Calculer l'incrément à chaque étape
	let xIncrement = dx / steps;
	let yIncrement = dy / steps;

	let x = x0;
	let y = y0;

	// Parcourir tous les pas et placer les pixels
	for (let i = 0; i <= steps; i++) {
		// Calculer l'index du pixel dans le color buffer
		let index = (Math.round(y) * canvas.width + Math.round(x)) * 4;
		// Dessiner le pixel
		putPixel(index, r, g, b, a);
		// Incrémenter les coordonnées
		x += xIncrement;
		y += yIncrement;
	}
}


function make3Dgrid(SQUARE_SIZE)
{
	let ZMAX = 1.3 + 0.2 * 21;
	let ZMIN =  1.3;
	let XMAX = SQUARE_SIZE * 5;
	let XMIN = SQUARE_SIZE * -5;
	let x = -5;
	let z = ZMIN;

	for (i = 0; i < 22; ++i)
	{
		if (i % 2 == 0)
		{
			let coord = {
				z: ZMIN,
				x: x * SQUARE_SIZE
			};
			grid3D.push(coord);
		}
		else
		{
			let coord = {
				z: ZMAX,
				x: x * SQUARE_SIZE
			};
			grid3D.push(coord);
			++x;
		}
	}
	
	for (i = 0; i < 44; ++i)
	{
		if (i % 2 == 0)
		{
			let coord = {
				z: z,
				x: XMIN
			};
			grid3D.push(coord);
		}
		else
		{
			let coord = {
				z: z,
				x: XMAX
			};
			grid3D.push(coord);
			z += 0.2;
		}
	}
}

function transformGrid()
{
	document.addEventListener('keydown', function(event){
		if (event.key === "ArrowUp")
		{
			yOffset -= 20;
		}
		if (event.key === "ArrowDown")
		{
			yOffset += 20;
		}
		if (event.key === "ArrowLeft")
		{
			xOffset -= 20;
		}
		if (event.key === "ArrowRight")
		{
			xOffset += 20;
		}	
		if (event.key === "PageUp")
		{
			zOffset += 0.1;
		}
		if (event.key === "PageDown")
		{
			zOffset -= 0.1;
		}
	});
}

function create3Dgrid(SQUARE_SIZE)
{
	make3Dgrid(SQUARE_SIZE);
	//console.log(grid3D);
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;

	for (i = 0; i < 66; i += 2)
	{
		x0 = Math.floor(((grid3D[i].x + xOffset) / (grid3D[i].z + zOffset)) + MID_WIDTH);
		y0 = Math.floor(((yGrid + yOffset) / (grid3D[i].z + zOffset)) + MID_HEIGHT);

		x1 = Math.floor(((grid3D[i + 1].x + xOffset) / (grid3D[i + 1].z + zOffset)) + MID_WIDTH);
		y1 = Math.floor(((yGrid + yOffset) / (grid3D[i + 1].z + zOffset)) + MID_HEIGHT);

		if (x0 > 0 && x0 < canvas.width && y0 > 0 && y0 < canvas.height
				&& x1 > 0 && x1 < canvas.width && y1 > 0 && y1 < canvas.height)
			drawLineDDA(x0, y0, x1, y1, 75, 0, 130, 255);
	}
}

function gameLoop()
{
	context.clearRect(0, 0, canvas.width, canvas.height);
	imageData = context.createImageData(canvas.width, canvas.height);
	colorBuffer = imageData.data;
	//create2Dgrid(40);
	create3Dgrid(100);
	context.putImageData(imageData, 0, 0);
	requestAnimationFrame(gameLoop);
}

/*----------Main----------*/
transformGrid();
start.onclick = gameLoop;
