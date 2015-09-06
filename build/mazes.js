/**
* A sane mod operator
*/
'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function mod(a, b) {
	var m = a % b;
	return m < 0 ? m + b : m;
}

// The various different algorithms use different ways of deciding which element to grab
var fetchers = [function (max) {
	return max;
}, function (max) {
	return _.random(0, max);
}, function (max) {
	return _.random(Math.max(0, max - 30), max);
}, function (max) {
	return Math.random() < 0.5 ? 0 : max;
}, //_.sample([0, max]),
function (max) {
	return Math.random() < 0.5 ? 0 : max;
}, function (max) {
	return max;
}];

/**
* A factory that makes an object that tracks which grid positions are filled and draws to the canvas
*/
function makeBitmap(canvas, width, height, thickness, background, foreground) {
	var ctx = canvas.getContext("2d"),
	    data = new Array(width);

	for (var i = 0; i < width; i++) {
		data[i] = new Array(height);
	}

	canvas.width = width * thickness;
	canvas.height = height * thickness;

	ctx.fillStyle = background;
	ctx.fillRect(0, 0, width * thickness, height * thickness);
	ctx.fillStyle = foreground;

	return {
		'test': function test(x, y) {
			return data[mod(x, width)][mod(y, height)];
		},

		'getExtensions': function getExtensions(x, y) {
			var extensions = [[x + 1, y, x + 2, y], [x - 1, y, x - 2, y], [x, y + 1, x, y + 2], [x, y - 1, x, y - 2]];

			return extensions.filter(function (_ref) {
				var _ref2 = _slicedToArray(_ref, 4);

				var ox = _ref2[0];
				var oy = _ref2[1];
				var x = _ref2[2];
				var y = _ref2[3];
				return !data[mod(x, width)][mod(y, height)];
			});
		},

		'fill': function fill(x, y) {
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
function makeMaze(canvas, width, height, thickness, speed, algorithm, background, foreground) {
	var bitmap = makeBitmap(canvas, width, height, thickness, background, foreground),
	    ix = Math.floor(width / 3),
	    iy = Math.floor(height / 3),
	    periphery = bitmap.getExtensions(ix, iy),
	    skip = 0,
	    fetcher = fetchers[algorithm];

	// fill the initial position
	bitmap.fill(ix, iy);

	// expand the maze by one position
	function extend() {
		var _again = true;

		_function: while (_again) {
			pos = _$pullAt = _$pullAt2 = pt = _pt = ox = oy = x = y = neighbors = undefined;
			_again = false;

			// loop until we find an empty space or the maze is finished
			do {
				if (periphery.length == 0) {
					return;
				}

				// select a position from the spaces we can expand into and remove it from the list
				var pos = fetcher(periphery.length - 1);

				var _$pullAt = _.pullAt(periphery, [pos]);

				var _$pullAt2 = _slicedToArray(_$pullAt, 1);

				var pt = _$pullAt2[0];

				var _pt = _slicedToArray(pt, 4);

				var ox = _pt[0];
				var oy = _pt[1];
				var x = _pt[2];
				var y = _pt[3];
			} while (bitmap.test(x, y));

			bitmap.fill(ox, oy); // fill the space that bridges the selected space to the one it branched from
			bitmap.fill(x, y); // and fill in the selected space

			// update the list of spaces that we can expand into

			var neighbors = _.shuffle(bitmap.getExtensions(x, y));

			if (algorithm > 3 && Math.random() < 0.5) {
				periphery = neighbors.concat(periphery);
			} else {
				periphery = periphery.concat(neighbors);
			}

			skip = (skip + 1) % speed;
			if (skip) {
				_again = true;
				continue _function;
				// return means this won't break the stack in environments with tail call optimization
			} else {
					return window.requestAnimationFrame(extend); // wait for a new frame every speed-th turn
				}
		}
	}

	window.requestAnimationFrame(extend);
}
