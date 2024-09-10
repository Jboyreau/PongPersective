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
var yGridOffset = 4.2;
var zGridOffset = 6;
var globaleScale = 310;
/*Ball*/
var ballSize = 0.15;
var xBall = 0;
var zBall = 2;
var ballScaler = 1; //experimental.
/*Padel*/
var padelSpeed = 0.2;
var padelHeigth = 0.2;
var padelWidth = 1;
var xPadelPlayer = 0;
var zPadel = 2;
var xAntagonist = 0;
var zAntagonist = 21;
/*Screen Space*/
var MID_WIDTH = canvas.width / 2;
var MID_HEIGHT = canvas.height / 2;
/*Model Space*/
var grid3D = [];
var padel3D = [];
var ball3D = [];
/*-----Limites Terrain-----*/
var ZMAX = 22;
var ZMIN = 1;
var XMAX = 7;
var XMIN = -7;
/*-----Balle speed-----*/
var xVelocity = 0.09;
var zVelocity = 0.15;
/*-----Input-----*/
var keysPressed = {};

/*-----------Functions----------*/
/*Display*/
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

/*Populate 3DModel*/
function make3Dgrid()
{
	let x = XMIN;
	let z = ZMIN;

	for (i = 0; i < XMAX * 4 + 2; ++i)
	{
		if (i % 2 == 0)
		{
			let coord = {
				z: ZMIN,
				x: x
			};
			grid3D.push(coord);
		}
		else
		{
			let coord = {
				z: ZMAX,
				x: x
			};
			grid3D.push(coord);
			++x;
		}
	}
	
	for (i = 0; i < ZMAX * 2; ++i)
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
			++z;
		}
	}
}

function create3Dpadel()
{
	padel3D.push({x: -padelWidth, y: padelHeigth});
	padel3D.push({x: padelWidth, y: padelHeigth});
	padel3D.push({x: -padelWidth, y: -padelHeigth});
	padel3D.push({x: padelWidth, y: -padelHeigth});
}

function create3Dball()
{
	ball3D.push({ x: -ballSize, y: -ballSize, z: -ballSize});
	ball3D.push({ x: -ballSize, y: ballSize, z: -ballSize});
	ball3D.push({ x: ballSize, y: ballSize, z: -ballSize});
	ball3D.push({ x: ballSize, y: -ballSize, z: -ballSize});
	ball3D.push({ x: -ballSize, y: -ballSize, z: ballSize});
	ball3D.push({ x: -ballSize, y: ballSize, z: ballSize});
	ball3D.push({ x: ballSize, y: ballSize, z: ballSize});
	ball3D.push({ x: ballSize, y: -ballSize, z: ballSize});
}

/*Projection*/
function projectBallLine(i, j)
{
	let x= 0;
	let y = 0;
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;

	x = ((ball3D[i].x + xBall) / (ball3D[i].z + zBall + zGridOffset)) * globaleScale;
	y = ((ball3D[i].y + yGridOffset - 0.15) / (ball3D[i].z + zBall + zGridOffset)) * globaleScale;
	x0 = Math.floor(x + MID_WIDTH);
	y0 = Math.floor(y + MID_HEIGHT);
	x = ((ball3D[j].x + xBall) / (ball3D[j].z + zBall + zGridOffset)) * globaleScale;
	y = ((ball3D[j].y + yGridOffset - 0.15) / (ball3D[j].z + zBall + zGridOffset)) * globaleScale;
	x1 = Math.floor(x + MID_WIDTH);
	y1 = Math.floor(y + MID_HEIGHT);
	if ((x0 > 0 && x0 < canvas.width && y0 > 0 && y0 < canvas.height
			&& x1 > 0 && x1 < canvas.width && y1 > 0 && y1 < canvas.height))
		if (zBall < ZMIN + 1 || zBall > ZMAX - 1)
			drawLineDDA(colorBuffer, x0, y0, x1, y1, 255, 0, 0, 255);
		else
			drawLineDDA(colorBuffer, x0, y0, x1, y1, 255, 255, 255, 255);
}

function projectPadelLine(buffer, i, j, z, r, g, b, xPadel)
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;
	let x = 0;
	let y = 0;

	x = ((padel3D[i].x + xPadel) / (z + zGridOffset)) * globaleScale;
	y = ((padel3D[i].y + yGridOffset - 0.1) / (z + zGridOffset)) * globaleScale;
	x0 = Math.floor(x + MID_WIDTH);
	y0 = Math.floor(y + MID_HEIGHT);
	x = ((padel3D[j].x + xPadel) / (z + zGridOffset)) * globaleScale;
	y = ((padel3D[j].y + yGridOffset - 0.1) / (z + zGridOffset)) * globaleScale;
	x1 = Math.floor(x + MID_WIDTH);
	y1 = Math.floor(y + MID_HEIGHT);
	drawLineDDA(buffer, x0, y0, x1, y1, r, g, b, 255);
}

/*Rotation*/
function rotateY(model, rad) {
    // Cosine et Sine de l'angle
    let cosTheta = Math.cos(rad);
    let sinTheta = Math.sin(rad);

    // Parcourir chaque point du modèle
    for (let i = 0; i < model.length; i++) {
        let x = model[i].x;
        let z = model[i].z;

        // Appliquer la rotation
        model[i].x = x * cosTheta - z * sinTheta;
        model[i].z = x * sinTheta + z * cosTheta;
    }
}

/*Draw*/
function create3Dgrid()
{
	make3Dgrid();
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;
	let x = 0;
	let y = 0;

	for (i = 0; i < ZMAX * 2 + XMAX * 4 + 1; i += 2)
	{
		x = (grid3D[i].x / (grid3D[i].z + zGridOffset)) * globaleScale;
		y = (yGridOffset / (grid3D[i].z + zGridOffset)) * globaleScale;
		x0 = Math.floor(x + MID_WIDTH);
		y0 = Math.floor(y + MID_HEIGHT);
		x = (grid3D[i + 1].x / (grid3D[i + 1].z + zGridOffset)) * globaleScale;
		y = (yGridOffset / (grid3D[i + 1].z + zGridOffset)) * globaleScale;
		x1 = Math.floor(x + MID_WIDTH);
		y1 = Math.floor(y + MID_HEIGHT);
		drawLineDDA(gridColorBuffer, x0, y0, x1, y1, 75, 0, 130, 255);
	}
}

function drawBall()
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;
	rotateY(ball3D, 0.1);
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

function drawAntagonist(r, g, b)
{

	for (i = 0; i < 4; i += 2)
		projectPadelLine(colorBuffer, i, i + 1, zAntagonist, r, g, b, xAntagonist);
	projectPadelLine(colorBuffer, 0, 3, zAntagonist, r, g, b, xAntagonist);
	projectPadelLine(colorBuffer, 1, 2, zAntagonist, r, g, b, xAntagonist);
	projectPadelLine(colorBuffer, 0, 2, zAntagonist, r, g, b, xAntagonist);
	projectPadelLine(colorBuffer, 1, 3, zAntagonist, r, g, b, xAntagonist);
}

function drawPadel(r, g, b)
{

	for (i = 0; i < 4; i += 2)
		projectPadelLine(colorBuffer, i, i + 1, zPadel, r, g, b, xPadelPlayer);
	projectPadelLine(colorBuffer, 0, 3, zPadel, r, g, b, xPadelPlayer);
	projectPadelLine(colorBuffer, 1, 2, zPadel, r, g, b, xPadelPlayer);
	projectPadelLine(colorBuffer, 0, 2, zPadel, r, g, b, xPadelPlayer);
	projectPadelLine(colorBuffer, 1, 3, zPadel, r, g, b, xPadelPlayer);
}

/*Position Update*/
function updateBallPosition()
{
    // Mettre à jour la position de la balle en fonction de sa vitesse
    xBall += xVelocity;
	if (xBall > XMAX)
		xBall = XMAX;
	if (xBall < XMIN)
		xBall = XMIN;
    zBall += zVelocity;
	if (zBall > ZMAX)
		zBall = ZMAX;
	if (zBall < ZMIN)
		zBall = ZMIN;

    // Vérifier les limites du terrain sur l'axe X
    if (xBall <= XMIN || xBall >= XMAX) {
        // Inverser la direction sur X si on atteint les bords
        xVelocity = -xVelocity;
    }

    // Vérifier les limites du terrain sur l'axe Z
    if (zBall >= ZMAX || zBall <= ZMIN)
	{
        // Inverser la direction sur Z si on atteint les bords arrière
        zVelocity = -zVelocity;
		xVelocity /= 5;
    }
    if (zBall <= zPadel && zBall >= ZMIN && zVelocity < 0)//Collision avec le paddle joueur
	{
        if ((xBall > xPadelPlayer - padelWidth || xBall + ballSize > xPadelPlayer - padelWidth)
			&& (xBall < xPadelPlayer + padelWidth || xBall - ballSize < xPadelPlayer + padelWidth))
		{
            //Inverser la direction sur Z si la balle touche le paddle
            zVelocity = -zVelocity;
			//Controle du rebond sur le padel
            xVelocity = (xBall - xPadelPlayer) / 4;
        }
    }
    if (zBall >= zAntagonist && zBall <= ZMAX && zVelocity > 0)//Collision avec l'Antagoniste
	{
		if ((xBall > xAntagonist - padelWidth || xBall + ballSize > xAntagonist - padelWidth)
			&& (xBall < xAntagonist + padelWidth || xBall - ballSize < xAntagonist + padelWidth))
		{
            //Inverser la direction sur Z si la balle touche le paddle
            zVelocity = -zVelocity;
			//Controle du rebond sur le padel
            xVelocity = (xBall - xAntagonist) / 2;
        }
	}
}

function updatePaddlePosition()
{
	if (xBall > xAntagonist)
		xAntagonist += padelSpeed;
	if (xBall < xAntagonist)
		xAntagonist -= padelSpeed;
    if (keysPressed["ArrowLeft"])
	{
        xPadelPlayer -= padelSpeed;
        if (xPadelPlayer < XMIN - 1) xPadelPlayer = XMIN - 1;
    }
    if (keysPressed["ArrowRight"])
	{
        xPadelPlayer += padelSpeed;
        if (xPadelPlayer > XMAX + 1) xPadelPlayer = XMAX + 1;
    }
}

/*Game loop*/
function gameLoop()
{
	context.clearRect(0, 0, canvas.width, canvas.height);
	imageData = context.createImageData(canvas.width, canvas.height);
	colorBuffer = imageData.data;
	colorBuffer.set(gridColorBuffer);
	updatePaddlePosition();
	updateBallPosition();
	drawAntagonist(255, 255, 255);
	drawBall();
	drawPadel(255, 255, 255);
	context.putImageData(imageData, 0, 0);
	requestAnimationFrame(gameLoop);
}

/*----------Main----------*/
create3Dgrid(90);
create3Dpadel();
create3Dball();
// Événement keydown : ajouter la touche enfoncée
document.addEventListener('keydown', function(event){
    keysPressed[event.key] = true;
});
// Événement keyup : supprimer la touche lorsqu'elle est relâchée
document.addEventListener('keyup', function(event) {
    keysPressed[event.key] = false;
})
start.onclick = gameLoop;
