import { Coordinate } from "./coordinate.mjs";
import { NodeComponent } from "./nodeComponent.mjs";
import { Pin } from "./pin.mjs";

/**
 * Class representing a TikZ transistor.
 *
 * @extends NodeComponent
 * @property {string} instanceName - the instance name, e.g. "R1"
 * @property {[Pin, Pin, Pin]} pins - top, bottom and tap pin
 * @property {[string, string, string]} anchorNames - top, bottom and tap pin name
 * @property {0|1|2|null} anchorNr - the selected anchor; 0=top, 1=bottom, 2=tap; null=use mid
 * @property {string} nodeName - the name of the node
 */
class Transistor extends NodeComponent {
	#tikzComponentName;
	instanceName;
	pins;
	anchorNames;
	anchorNr;
	nodeName;
	anchorCoord;

	/**
	 * Generate a TikZ transistor (-stencil).
	 *
	 * @param {string} tikzComponentName - the tikz component name, e.g. "R"
	 * @param {string} [instanceName=""] - the instance name, e.g. "R1"
	 * @param {[Pin, Pin, Pin]} pins - top, bottom and tap pin
	 * @param {[string, string, string]} anchorNames - top, bottom and tap pin name
	 * @param {0|1|2|null} anchorNr - the selected anchor; 0=top, 1=bottom, 2=tap; null=use mid/bulk
	 * @param {Coordinate} [coord] - position if selected anchor == null
	 * @param {string} [nodeName=""] - the name of the node
	 * @param {number} [angle=0] - the angle to rotate the component
	 * @param {boolean} [mirrorX=false] - true to mirror on x axis
	 * @param {boolean} [mirrorY=false] - true to mirror on y axis
	 */
	constructor(
		tikzComponentName,
		instanceName = "",
		pins,
		anchorNames,
		anchorNr,
		coord = null,
		nodeName = "",
		angle = 0,
		mirrorX = false,
		mirrorY = false
	) {
		super(angle, mirrorX, mirrorY);
		this.#tikzComponentName = tikzComponentName;
		this.instanceName = instanceName;
		this.pins = pins;
		this.anchorNames = anchorNames;
		this.anchorNr = anchorNr;
		this.nodeName = nodeName;
		this.anchorCoord = this.anchorNr !== null ? null : coord || new Coordinate(0, 0);
	}

	/**
	 * @typedef {object} tikzTripolOptions
	 * @property {number} [pgfCircRlen=1.4]
	 * @property {number} [width=0.7]
	 * @property {number} [connHeight=0.5]
	 * @property {number} [height=1.1]
	 */

	/**
	 * Creates a new stencil from a TikZ pgfkeys alike object
	 *
	 * @param {string} tikzComponentName
	 * @param {[Pin, Pin, Pin]} pins - top, bottom and tap pin
	 * @param {tikzTripolOptions} options
	 * @param {string} [nodeName=""]
	 *
	 * @returns {Transistor} the created stencil
	 */
	static fromStruct(tikzComponentName, anchorNames, options, nodeName = "") {
		if (!Number.isFinite(options.pgfCircRlen)) options.pgfCircRlen = 1.4;
		if (!Number.isFinite(options.width)) options.width = 0.7;
		if (!Number.isFinite(options.connHeight)) options.connHeight = 0.5;
		if (!Number.isFinite(options.height)) options.height = 1.1;

		const halfHeight = options.pgfCircRlen * options.height * 0.5;
		const width = options.pgfCircRlen * options.width;
		const pins = [
			// top
			new Pin(new Coordinate(0, halfHeight)),
			// bottom
			new Pin(new Coordinate(0, -halfHeight)),
			// tap
			new Pin(new Coordinate(-width, halfHeight * options.connHeight)),
		];

		return new Transistor(tikzComponentName, "", pins, anchorNames, null, null, nodeName);
	}

	/**
	 * @returns {string} the read only TikZ component name
	 */
	get tikzComponentName() {
		return this.#tikzComponentName;
	}

	/**
	 * @returns {string} the node text generated from the instanceName
	 */
	get nodeText() {
		// EEMOS1 --> ${EEMOS}_{1}$
		if (this.instanceName) {
			let [_fullMatch, name, index] = this.instanceName.match(/^([a-zA-Z]+)[_-]?([0-9]+)$/);

			if (name && !Number.isNaN((index = Number.parseInt(index)))) return `\${${name}}_{${index}}\$`;
			else return this.instanceName;
		} else return "";
	}

	/**
	 * @returns {Coordinate} the component position
	 */
	get coord() {
		if (this.anchorNr == null) return this.anchorCoord;
		else return this.pins[this.anchorNr]?.coord;
	}

	/**
	 * Calculates the coordinate where the top-bottom line crosses the orthogonal tap line. This can but does not need
	 * to be the center point.
	 *
	 * @returns {Coordinate}
	 */
	get lineCrossingCoord() {
		return this.pins[2].coord.orthogonalProjection(this.pins[0].coord, this.pins[1].coord);
	}

	/**
	 * Mirror coords/pins around the anchor.
	 *
	 * @param {boolean} mirrorX - true to mirror
	 * @param {boolean} mirrorY - true to mirror
	 */
	mirror(mirrorX, mirrorY) {
		if (!(mirrorX || mirrorY)) return;

		// Update mirror flags (xor)
		this.mirrorX = this.mirrorX != mirrorX;
		this.mirrorY = this.mirrorY != mirrorY;

		const mirrorMid = this.coord;

		for (let i = 0; i < this.pins.length; i++) {
			if (i !== this.anchorCoord) {
				const mirrorCoord = this.pins[i].coord;
				mirrorCoord.subtract(mirrorMid);
				if (mirrorX) mirrorCoord.y = -mirrorCoord.y;

				if (mirrorY) mirrorCoord.x = -mirrorCoord.x;

				mirrorCoord.add(mirrorMid);
			}
		}
	}

	/**
	 * Rotate every coord around the anchor. The rotation is counter clockwise, like the default mathematical rotation.
	 *
	 * @param {number} angle
	 */
	rotate(angle) {
		if (!Number.isFinite(angle) || angle === 0) return;

		for (let i = 0; i < this.pins.length; i++) {
			if (i !== this.anchorNr) this.pins[i].coord.rotate(angle);
		}

		this.angle += angle;
		// normalize angle
		while (this.angle <= -180) this.angle += 360;
		while (this.angle > 180) this.angle -= 360;
	}

	/**
	 * Move all pins/coordinates using a vector.
	 *
	 * @param {Coordinate} vector - vector to add to all coordinates
	 */
	translate(vector) {
		[...this.pins.map((pin) => pin?.coord), this.anchorCoord].forEach((coord) => coord && coord.add(vector));
	}

	/**
	 * Deep clone of the object.
	 *
	 * @returns {Transistor} the cloned transistor
	 */
	deepClone() {
		return new Transistor(
			this.tikzComponentName,
			this.instanceName,
			this.pins.map((pin) => pin.deepClone()),
			[...this.anchorNames],
			this.anchorNr,
			this.coord ? this.coord.clone() : null,
			this.nodeText,
			this.nodeName,
			this.angle,
			this.mirrorX,
			this.mirrorY
		);
	}
}

export { Transistor };
