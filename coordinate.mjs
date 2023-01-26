/**
 *
 * @param {Number} x
 * @param {Number} y
 */
const Coordinate = function Coordinate(x, y) {
	this.x = x;
	this.y = y;

	/**
	 * Compares the position of this to an given coordinate.
	 *
	 * @param {Coordinate} other the coordinate to compare against
	 * @returns {boolean} true if coordinates have the same position
	 */
	this.equals = function equals(other) {
		return !!other && this.x === other.x && this.y === other.y;
	};

	/**
	 * Serializes the coordinate for TikZ.
	 *
	 * @returns {String} the serialized coordinate
	 */
	this.serializeName = function () {
		return "(" + this.x + ", " + this.y + ")";
	};

	/**
	 * Calculates the distance of two points.
	 *
	 * @param {Coordinate} other the other coordinate
	 * @returns {number} the distance
	 */
	this.getDistance = function (other) {
		return Math.sqrt((x - other.x) ** 2 + (this.y - other.y) ** 2);
	};

	/**
	 * Add other coordinate (x and y) to this coordinate.
	 *
	 * @example
	 * const a = new Coordinate(2,2);
	 * const b = new Coordinate(1,1);
	 * a.subtract(b);	// a += b
	 * // a is now (3,3)
	 *
	 * @param {Coordinate} other the coordinate to add
	 * @returns {Coordinate} this coordinate
	 */
	this.add = function (other) {
		this.x += other.x;
		this.y += other.y;
		return this;
	};

	/**
	 * Subtract other coordinate (x and y) from this coordinate.
	 *
	 * @example
	 * const a = new Coordinate(2,2);
	 * const b = new Coordinate(1,1);
	 * a.subtract(b);	// a -= b
	 * // a is now (1,1)
	 *
	 * @param {Coordinate} other the coordinate to subtract
	 * @returns {Coordinate} this coordinate
	 */
	this.subtract = function (other) {
		this.x -= other.x;
		this.y -= other.y;
		return this;
	};

	/**
	 * Calculates the sum of this and other given coordinates. This coordinate will not be altered, instead a new
	 * coordinate will bw returned.
	 *
	 * @param  {...Coordinate} others other coordinates to sum up
	 * @returns {Coordinate} the new Coordinate (sum)
	 */
	this.sum = function (...others) {
		const coordSum = new Coordinate(this.x, this.y);
		others.forEach(coordSum.add);
		return coordSum;
	};

	/**
	 *
	 * @param {number} angle rotation angle in degrees
	 * @param {Coordinate} [centerCoord] center of rotation
	 */
	this.rotate = function (angle, centerCoord) {
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
				this.x = this.y;
				this.y = -oldX;
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
				this.x = -this.y;
				this.y = oldX;
				break;
			}

			default: {
				const oldX = this.x;
				const oldY = this.y;
				const radians = (Math.PI / 180) * angle,
					cos = Math.cos(radians),
					sin = Math.sin(radians);

				this.x = cos * oldX + sin * oldY;
				this.y = cos * oldY - sin * oldX;
				break;
			}
		}

		if (!!centerCoord) this.add(centerCoord);
	};

	/**
	 * Scale the coordinate with one or two factors.
	 *
	 * @param {number} [scaleX=1] factor for the x coordinate
	 * @param {number,true} [scaleY=1] factor for the y coordinate or true to use scaleX
	 */
	this.scale = function scale(scaleX = 1, scaleY = 1) {
		if (Number.isFinite(scaleX)) this.x *= scaleX;
		if (Number.isFinite(scaleY)) this.y *= scaleY;
		else if (Number.isFinite(scaleX) && scaleY === true) this.y *= scaleX;
	};

	/**
	 * Creates a new instance with the same coordinates.
	 *
	 * @returns {Coordinate} a new instance of this coordinate
	 */
	this.clone = function () {
		return new Coordinate(this.x, this.y);
	};

	/**
	 * Mirrors the coordinate on the x axis (inverts y).
	 */
	this.mirrorX = function mirrorX() {
		this.y = -this.y;
	};

	/**
	 * Mirrors the coordinate on the y axis (inverts x).
	 */
	this.mirrorY = function mirrorY() {
		this.x = -this.x;
	};
};

export { Coordinate };
