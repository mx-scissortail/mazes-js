/**
* A sane mod operator
*/
function mod (a, b) {
	var m = a  % b;
	return m < 0 ? m + b : m;
}

// The various different algorithms use different ways of deciding which element to grab
var fetchers = [
	(max) => max,
	(max) => _.random(0, max),
	(max) => _.random(Math.max(0, max - 30), max),
	(max) => Math.random() < 0.5 ? 0 : max, //_.sample([0, max]),
	(max) => Math.random() < 0.5 ? 0 : max,
	(max) => max,
];

/**
* A factory that makes an object that tracks which grid positions are filled and draws to the canvas
*/
function makeBitmap (canvas, width, height, thickness, background, foreground) {
	var ctx = canvas.getContext("2d"),
		data = new Array(width);

	for (var i = 0; i < width; i++) {
		data[i] = new Array(height);
	}

	canvas.width  = width * thickness;
	canvas.height = height * thickness;

	ctx.fillStyle = background;
	ctx.fillRect(0, 0, width * thickness, height * thickness);
	ctx.fillStyle = foreground;

	return {
		'test': function (x, y) {
			return data[mod(x, width)][mod(y, height)];
		},

		'getExtensions': function (x, y) {
			var extensions = [
				[x + 1, y, x + 2, y],
				[x - 1, y, x - 2, y],
				[x, y + 1, x, y + 2],
				[x, y - 1, x, y - 2]
			];

			return extensions.filter( ([ox, oy, x, y]) => !data[mod(x, width)][mod(y, height)] );
		},

		'fill': function (x, y) {
			x = mod(x, width);
			y = mod(y, height);
			data[x][y] = true;
			ctx.fillRect(x * thickness, y * thickness, thickness, thickness);
		}
	};
}

/**
* Generate the maze (asynchronously)
*/
function makeMaze (canvas, width, height, thickness, speed, algorithm, background, foreground) {
	var bitmap = makeBitmap(canvas, width, height, thickness, background, foreground),
		ix = Math.floor(width/3),
		iy = Math.floor(height/3),
		periphery = bitmap.getExtensions(ix, iy),
		skip = 0,
		fetcher = fetchers[algorithm];

	// fill the initial position
	bitmap.fill(ix, iy);

	// expand the maze by one position
	function extend () {
		// loop until we find an empty space or the maze is finished
		do {
			if (periphery.length == 0) {
				return;
			}

			// select a position from the spaces we can expand into and remove it from the list
			var pos = fetcher(periphery.length - 1),
				[pt] = _.pullAt(periphery, [pos]),
				[ox, oy, x, y] = pt;

		} while (bitmap.test(x, y));

		bitmap.fill(x, y);	// fill in the selected space
		bitmap.fill(ox, oy);	// and the one that bridges it to the one it branched from

		// update the list of spaces that we can expand into

		var neighbors = _.shuffle(bitmap.getExtensions(x, y));

		if (algorithm > 3 && Math.random() < 0.5) {
			periphery = neighbors.concat(periphery);
		} else {
			periphery = periphery.concat(neighbors);
		}

		skip = (skip + 1) % speed;
		if (skip) {
			return extend(); // return means this won't break the stack in environments with tail call optimization
		} else {
			return window.requestAnimationFrame(extend);	// wait for a new frame every speed-th turn
		}
	}

	window.requestAnimationFrame(extend);
}
