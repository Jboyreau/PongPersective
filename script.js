/*-----2D-----*/
var start = document.getElementById("start-id");
var canvas = document.getElementById("canvas-id");
var context = canvas.getContext("2d");
var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
var colorBuffer = imageData.data;
var gridColorBuffer = new Uint8ClampedArray(canvas.width * canvas.height * 4);
var BUFFER_SIZE = canvas.width * canvas.height * 4;
var RED_SIDE_SIZE = canvas.width / 2;
var GREEN_SIDE_SIZE = canvas.width;
/*-----PERSPECTIVE-----*/
var yOffset = 0;
var xOffset = 0;
var zOffset = 0;
var xBall = 0;
var zBall = 1.4;
var xPadelPlayer = 0;
var xPadelAntagonist = 0;
var scaler = 2;
var yGrid = 250;
var MID_WIDTH = canvas.width / 2;
var MID_HEIGHT = canvas.height / 2;
var MID_DEPTH = (1 + 0.15 * 21) / 2;
var grid3D = [];
var padel3D = [];
var ball3D = [];
/*-----Limites Terrain-----*/
var ZMAX = 1.3 + 0.2 * 21;
var ZMIN = 1.3;
var XMAX = 90 * 5;
var XMIN = -90 * 5;
/*-----Balle speed-----*/
var xVelocity = 4;
var zVelocity = 0.04;

/*-----------Functions----------*/
function putPixel(buffer, i, r, g, b, a)
{	
	buffer[i] = r;
	buffer[i + 1] = g;
	buffer[i + 2] = b;
	buffer[i + 3] = a;
}

function drawLineDDA(buffer, x0, y0, x1, y1, r, g, b, a)
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
		putPixel(buffer, index, r, g, b, a);
		// Incrémenter les coordonnées
		x += xIncrement;
		y += yIncrement;
	}
}


function make3Dgrid(SQUARE_SIZE)
{
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
			xPadelPlayer -= 25;
			if (xPadelPlayer < XMIN)
			{
				xPadelPlayer = XMIN;
				//console.log(xPadelPlayer);
			}
		}
		if (event.key === "ArrowRight")
		{
			xPadelPlayer += 25;
			if (xPadelPlayer > XMAX)
			{
				xPadelPlayer = XMAX;
				//console.log(xPadelPlayer);
			}
		}
		if (event.key === "PageUp")
		{
			zBall += 0.1;
		}
		if (event.key === "PageDown")
		{
			zBall -= 0.1;
		}
	});
}

function create3Dgrid(SQUARE_SIZE)
{
	make3Dgrid(SQUARE_SIZE);
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
		drawLineDDA(gridColorBuffer, x0, y0, x1, y1, 75, 0, 130, 255);
	}
}

function create3Dball()
{
	ball3D.push({ x: -20, y: -20 + yGrid - 50, z: -0.05});
	ball3D.push({ x: -20, y: 20 + yGrid - 50, z: -0.05});
	ball3D.push({ x: 20, y: 20 + yGrid - 50, z: -0.05});
	ball3D.push({ x: 20, y: -20 + yGrid - 50, z: -0.05});
	ball3D.push({ x: -20, y: -20 + yGrid - 50, z: 0.05});
	ball3D.push({ x: -20, y: 20 + yGrid - 50, z: 0.05});
	ball3D.push({ x: 20, y: 20 + yGrid - 50, z: 0.05});
	ball3D.push({ x: 20, y: -20 + yGrid - 50, z: 0.05});
}

function projectBallLine(i, j)
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;

	x0 = Math.floor(((ball3D[i].x + xBall) / (ball3D[i].z + zBall)) + MID_WIDTH);
	y0 = Math.floor((ball3D[i].y / (ball3D[i].z + zBall)) + MID_HEIGHT);	
	x1 = Math.floor(((ball3D[j].x + xBall) / (ball3D[j].z + zBall)) + MID_WIDTH);
	y1 = Math.floor((ball3D[j].y / (ball3D[j].z + zBall)) + MID_HEIGHT);
	if (x0 > 0 && x0 < canvas.width && y0 > 0 && y0 < canvas.height
			&& x1 > 0 && x1 < canvas.width && y1 > 0 && y1 < canvas.height)
		if (zBall < ZMIN)
			drawLineDDA(colorBuffer, x0, y0, x1, y1, 255, 0, 0, 255);
		else
			drawLineDDA(colorBuffer, x0, y0, x1, y1, 0, 255, 0, 255);
}

function drawBall(r, g, b)
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;

	projectBallLine(0, 1);
	projectBallLine(1, 2);
	projectBallLine(2, 3);
	projectBallLine(3, 0);

	projectBallLine(4, 5);
	projectBallLine(5, 6);
	projectBallLine(6, 7);
	projectBallLine(7, 4);
	
	projectBallLine(4, 0);
	projectBallLine(5, 1);
	projectBallLine(6, 2);
	projectBallLine(7, 3);
}

function create3Dpadel()
{
	padel3D.push({ x: -50, y: yGrid - 40 });
	padel3D.push({ x: 50, y: yGrid - 40 });
	padel3D.push({ x: -50, y: yGrid - 20 });
	padel3D.push({ x: 50, y: yGrid - 20 });
}

function projectPadelLine(buffer, i, j, z, r, g, b)
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;

	x0 = Math.floor(((padel3D[i].x + xPadelPlayer) / z) + MID_WIDTH);
	y0 = Math.floor((padel3D[i].y / z) + MID_HEIGHT);	
	x1 = Math.floor(((padel3D[j].x + xPadelPlayer) / z) + MID_WIDTH);
	y1 = Math.floor((padel3D[j].y / z) + MID_HEIGHT);
	drawLineDDA(buffer, x0, y0, x1, y1, r, g, b, 255);
}

function drawPadel(z, r, g, b)
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;
	//console.log(padel3D);
	for (i = 0; i < 4; i += 2)
		projectPadelLine(colorBuffer, i, i + 1, z, r, g, b);
	projectPadelLine(colorBuffer, 0, 3, z, r, g, b);
	projectPadelLine(colorBuffer, 1, 2, z, r, g, b);
	projectPadelLine(colorBuffer, 0, 2, z, r, g, b);
	projectPadelLine(colorBuffer, 1, 3, z, r, g, b);
}

function updateBallPosition() {
    // Mettre à jour la position de la balle en fonction de sa vitesse
    xBall += xVelocity;
    zBall += zVelocity;

    // Vérifier les limites du terrain sur l'axe X
    if (xBall < XMIN || xBall > XMAX) {
        // Inverser la direction sur X si on atteint les bords
        xVelocity = -xVelocity;
    }

    // Vérifier les limites du terrain sur l'axe Z
    if (zBall >= ZMAX || zBall <= ZMIN) {
        // Inverser la direction sur Z si on atteint les bords arrière
        zVelocity = -zVelocity;
    }
    else if (zBall <= 1.5 && zBall >= ZMIN && zVelocity < 0) { // Collision avec le paddle joueur
        if ((xBall > xPadelPlayer - 50 || xBall + 20 > xPadelPlayer - 50) && (xBall < xPadelPlayer + 50 || xBall - 20 < xPadelPlayer + 50)) {
            // Inverser la direction sur Z si la balle touche le paddle
            zVelocity = -zVelocity;
        }
    }

    // Vérification si la balle sort du terrain (Z < ZMIN) — ajouter un reset si souhaité.
}


function gameLoop()
{
	context.clearRect(0, 0, canvas.width, canvas.height);
	imageData = context.createImageData(canvas.width, canvas.height);
	colorBuffer = imageData.data;
	colorBuffer.set(gridColorBuffer);
	//TODO : mise jours des coordonnes du padel.
	//TODO : mise a jours des coordonee de la balle.
	updateBallPosition();
	//TODO : dessin du padel antagoniste.
	drawBall();
	drawPadel(1.3, 0, 255, 0);
	context.putImageData(imageData, 0, 0);
	requestAnimationFrame(gameLoop);
}

/*----------Main----------*/
create3Dgrid(90);
create3Dpadel();
create3Dball();
transformGrid();
start.onclick = gameLoop;
