import { Component } from "./component.mjs";
import { Pin } from "./pin.mjs";
import { Coordinate } from "./coordinate.mjs";
import { Net } from "./net.mjs";

/**
 * Class representing a path-style TikZ component.
 *
 * @extends Component
 */
class PathComponent extends Component {
	/**
	 * @property {string} tikzComponentName - the tikz component name, e.g. "R"
	 * @private
	 */
	#tikzComponentName;
	/** @property {string} instanceName - the instance name, e.g. "R1" */
	instanceName;
	/** @property {[Pin, Pin]} pins - a list of the corresponding pins */
	pins;

	/**
	 * Generate a PathComponent or -stencil.
	 *
	 * @param {string} tikzComponentName - the tikz component name, e.g. "R"
	 * @param {string} [instanceName=""] - the instance name, e.g. "R1"
	 * @param {[Pin, Pin]} pins - a list of the corresponding pins
	 * @param {number} [angle=0] - the angle to rotate the component
	 * @param {boolean} [mirrorX=false] - true to mirror on x axis
	 * @param {boolean} [mirrorY=false] - true to mirror on y axis
	 */
	constructor(tikzComponentName, instanceName, pins, angle = 0, mirrorX = false, mirrorY = false) {
		super(angle || 0, mirrorX, mirrorY);
		this.#tikzComponentName = tikzComponentName;
		this.instanceName = instanceName || "";
		this.pins = pins;
	}

	/**
	 * Getts the private tikzComponentName.
	 *
	 * @returns {string}
	 */
	get tikzComponentName() {
		return this.#tikzComponentName;
	}

	/**
	 * Serializes a component. The TikZ "source code" is returned.
	 *
	 * @param {number} [indent=0] - the indention (= amount of tabs) to use
	 * @returns {string} the serislized component
	 */
	serialize(indent = 0) {
		// C1 --> ${C}_{1}$
		let label = "";
		if (this.instanceName) {
			let [_fullMatch, name, index] = this.instanceName.match(/^([a-zA-Z]+)[_-]?([0-9]+)$/);

			if (name && !Number.isNaN((index = Number.parseInt(index)))) label = `\${${name}}_{${index}}\$`;
			else label = this.instanceName;

			label = ", l=" + label;
		}

		/** marks the first pin of the component. (1)-/--[R]---(2) */
		let pinmark = "\t".repeat(indent) + "\\draw[color=blue] " + this.pins[0].coord.serializeName() + " ";
		if (this.angle === 0 || this.angle === 180) {
			if (this.pins[0].coord.x < this.pins[1].coord.x)
				// -->
				pinmark += "++ (3pt,0) ++ (-1.25pt, -2.5pt) -- ++(2.5pt, 5pt);\n";
			// <--
			else pinmark += "++ (-3pt,0) ++ (-1.25pt, -2.5pt) -- ++(2.5pt, 5pt);\n";
		} else if (this.angle === 90 || this.angle === -90) {
			if (this.pins[0].coord.y < this.pins[1].coord.y)
				// up
				pinmark += "++ (0,3pt) ++ (-2.5pt, -1.25pt) -- ++(5pt, 2.5pt);\n";
			// down
			else pinmark += "++ (0,-3pt) ++ (-2.5pt, -1.25pt) -- ++(5pt, 2.5pt);\n";
		} else pinmark = ""; // unknown / diagonal

		return (
			pinmark +
			"\t".repeat(indent) +
			"\\draw[color=blue] " +
			this.pins[0].coord.serializeName() +
			" to[" +
			this.#tikzComponentName +
			label +
			"] " +
			this.pins[1].coord.serializeName() +
			";"
		);
	}

	/**
	 * Deep clone of this object.
	 *
	 * @returns {PathComponent} the cloned object
	 */
	deepClone() {
		return new PathComponent(this.#tikzComponentName, this.instanceName, this.pins.deepClone(), this.angle);
	}

	/**
	 * Generate a TikZ component using `this` as an stencil. The parameters are informations extracted from ABL.
	 *
	 * @param {string} libraryName - the ABL library name, e.g. "ads_rflib"
	 * @param {string} cellName - the librarys component name, e.g. "R"
	 * @param {string} instanceName - the instance/component name, e.g. "R1"
	 * @param {Map<string,string>} attributes - map of all (XML) attributes
	 * @param {Pin[]} pins - the pins with their name and number (position not yet set)
	 * @param {{x: number, y: number, angle: number, xScale: number, yScale: number, mirrorX: boolean, mirrorY: boolean, scaling: number}} placement - general component placement information
	 * @param {Wire[]} wires - list of all wires
	 * @param {Map<string,Net>} nets - list of all nets
	 * @param {Coordinate[]} coords - list of all coordinates
	 *
	 * @returns {PathComponent} the new PathComponent
	 */
	useAsStencil(libraryName, cellName, instanceName, attributes, pins, placement, wires, nets, coords) {
		// normalize angle --> -180 < angle <= 180
		while (placement.angle <= -180) placement.angle += 360;
		while (placement.angle > 180) placement.angle -= 360;

		// get coordinate
		let instanceCoord = new Coordinate(placement.x * placement.scaling, placement.y * placement.scaling);
		const oldCoord = coords.find((existingCoord) => instanceCoord.equals(existingCoord));
		if (oldCoord) instanceCoord = oldCoord;
		else coords.push(instanceCoord);

		// reorder
		pins = this.pins.map((ablPin) =>
			pins.find((pin) =>
				pin.name && ablPin.name ? pin.name == ablPin.name : pin.instTermNumber === ablPin.instTermNumber
			)
		);

		// set pins (+positions)
		pins.forEach((pin) => pin.findPosition(this.pins, placement, instanceCoord, wires, nets, coords));

		return new PathComponent(this.#tikzComponentName, instanceName, pins, placement.angle);
	}
}

export { PathComponent };
