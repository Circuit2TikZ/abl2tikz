/**
 * Class representing a single 2D point (x and y).
 *
 * @property {number} x
 * @property {number} y
 */
class Coordinate {
	x;
	y;

	/**
	 * Generate a coordninate from x and y numbers.
	 *
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	/**
	 * Compares the position of this to an given coordinate.
	 *
	 * @param {Coordinate} other - the coordinate to compare against
	 * @returns {boolean} - true if coordinates have the same position
	 */
	equals(other) {
		return !!other && this.x === other.x && this.y === other.y;
	}

	/**
	 * Serializes the coordinate for TikZ.
	 *
	 * @example new Coordinate(1, 2).serializeName();
	 * // returns (1, 2)
	 *
	 * @returns {String} the serialized coordinate
	 */
	serializeName() {
		return "(" + this.x + ", " + this.y + ")";
	}

	/**
	 * Alias for `serializeName()`.
	 * @see {@link serializeName} for details
	 *
	 * @returns {String} the serialized coordinate
	 */
	toString() {
		return this.serializeName();
	}

	/**
	 * Calculates the distance of two points.
	 *
	 * @param {Coordinate} other - the other coordinate
	 * @returns {number} the distance
	 */
	getDistance(other) {
		return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
	}

	/**
	 * Add other coordinate (x and y) to this coordinate.
	 *
	 * @example
	 * const a = new Coordinate(2,2);
	 * const b = new Coordinate(1,1);
	 * a.add(b);	// a += b
	 * // a is now (3,3)
	 *
	 * @param {Coordinate} other the coordinate to add
	 * @returns {Coordinate} this coordinate
	 */
	add(other) {
		this.x += other.x;
		this.y += other.y;
		return this;
	}

	/**
	 * Subtract other coordinate (x and y) from this coordinate.
	 *
	 * @example
	 * const a = new Coordinate(2,2);
	 * const b = new Coordinate(1,1);
	 * a.subtract(b);	// a -= b
	 * // a is now (1,1)
	 *
	 * @param {Coordinate} other - the coordinate to subtract
	 * @returns {Coordinate} `this`
	 */
	subtract(other) {
		this.x -= other.x;
		this.y -= other.y;
		return this;
	}

	/**
	 * Calculates the sum of this and other given coordinates. This coordinate will not be altered, instead a new
	 * coordinate will bw returned.
	 *
	 * @param  {...Coordinate} others - other coordinates to sum up
	 * @returns {Coordinate} the new Coordinate (sum)
	 */
	sum(...others) {
		const coordSum = new Coordinate(this.x, this.y);
		others.forEach(coordSum.add);
		return coordSum;
	}

	/**
	 * Rotate the Coordinate around `centerCoord`. The rotation is counter clockwise, like the default mathematical
	 * rotation.
	 * 
	 * @param {number} angle - rotation angle in degrees
	 * @param {Coordinate} [centerCoord] - center of rotation
	 * @returns {Coordinate} `this`
	 */
	rotate(angle, centerCoord) {
		// normalize angle --> -180 < angle <= 180
		while (angle <= -180) angle += 360;
		while (angle > 180) angle -= 360;

		if (!!centerCoord) this.subtract(centerCoord);

		switch (angle) {
			case 0:
				// case 360:
				break;

			// case -270:
			case 90: {
				const oldX = this.x;
				this.x = -this.y;
				this.y = oldX;
				break;
			}

			// case -180:
			case 180:
				this.x = -this.x;
				this.y = -this.y;
				break;

			case -90: {
				//case 270:
				const oldX = this.x;
				this.x = this.y;
				this.y = -oldX;
				break;
			}

			default: {
				const oldX = this.x;
				const oldY = this.y;
				const radians = (Math.PI / 180) * angle,
					cos = Math.cos(radians),
					sin = Math.sin(radians);

				this.x = cos * oldX - sin * oldY;
				this.y = sin * oldX + cos * oldY;
				break;
			}
		}

		if (!!centerCoord) this.add(centerCoord);

		return this;
	}

	/**
	 * Projects a point perpendicular on a line.
	 *
	 * @param {Coordinate} lineStart - first coord of the line
	 * @param {Coordinate} lineEnd - second coord of the line
	 * @returns {Coordinate} the Coordinate on the line (new instance)
	 */
	orthogonalProjection(lineStart, lineEnd) {
		const lineVector = lineEnd.clone().subtract(lineStart); // lineEnd - lineStart
		const helpVector = this.clone().subtract(lineStart); // this - lineStart

		const lambda =
			(lineVector.x * helpVector.x + lineVector.y * helpVector.y) / (lineVector.x ** 2 + lineVector.y ** 2);

		return lineVector.scale(lambda, true).add(lineStart);
	}

	/**
	 * Scale the coordinate with one or two factors.
	 *
	 * @param {number} [scaleX=1] - factor for the x coordinate
	 * @param {number,true} [scaleY=1] - factor for the y coordinate or true to use scaleX
	 * @returns {Coordinate} `this`
	 */
	scale(scaleX = 1, scaleY = 1) {
		if (Number.isFinite(scaleX)) this.x *= scaleX;
		if (Number.isFinite(scaleY)) this.y *= scaleY;
		else if (Number.isFinite(scaleX) && scaleY === true) this.y *= scaleX;
		return this;
	}

	/**
	 * Creates a new instance with the same coordinates.
	 *
	 * @returns {Coordinate} a new instance of this coordinate
	 */
	clone() {
		return new Coordinate(this.x, this.y);
	}

	/**
	 * Mirrors the coordinate on the x axis (inverts y).
	 * 
	 * @returns {Coordinate} `this`
	 */
	mirrorX() {
		this.y = -this.y;
		return this;
	}

	/**
	 * Mirrors the coordinate on the y axis (inverts x).
	 * 
	 * @returns {Coordinate} `this`
	 */
	mirrorY() {
		this.x = -this.x;
		return this;
	}
}

export { Coordinate };
