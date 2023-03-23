import { Net } from "./net.mjs";
import { Coordinate } from "./coordinate.mjs";

/**
 * Class representing a wire.
 *
 * @param {Net[]} net - the corresponding net/potential
 * @param {Coordinate[]} coords - positions of wire "edges"
 */
class Wire {
	/**
	 * Generates a wire.
	 *
	 * @param {Net[]} net - the corresponding net/potential
	 * @param {Coordinate[]} coords - positions of wire "edges"
	 */
	constructor(net, coords) {
		this.net = net;
		this.coords = coords || [];
	}

	/**
	 * Serializes the wire. The TikZ "source code" is returned.
	 *
	 * @param {number} [indent=0] - the indention (= amount of tabs) to use
	 * @returns {string} the serislized wire
	 */
	serialize(indent = 0) {
		return (
			"\t".repeat(indent) +
			"\\draw[Rays-Rays,red] " +
			this.coords.map((coord) => coord.serializeName()).join(" -- ") +
			";"
		);
	}
}

export { Wire };
