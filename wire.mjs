import { Net } from "./net.mjs";
import { Coordinate } from "./coordinate.mjs";

/**
 *
 * @param {Net[]} net
 * @param {Coordinate[]} coords
 */
const Wire = function (net, coords) {
	this.net = net;
	this.coords = coords || [];

	this.serialize = function (indent = 0) {
		return "\t".repeat(indent) + "\\draw[Rays-Rays,red] " + coords.map((coord) => coord.serializeName()).join(" -- ") + ";";
	};
};

export { Wire };
