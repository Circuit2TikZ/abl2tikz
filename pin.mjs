import { Coordinate } from "./coordinate.mjs";
import { Net } from "./net.mjs";

/**
 *
 * @param {Coordinate} coord
 * @param {string} name
 * @param {number} instTermNumber
 * @param {Net} net
 */
const Pin = function (coord, name, instTermNumber, net) {
	this.coord = coord;
	this.name = name;
	this.instTermNumber = instTermNumber || 0;
	this.net = net;

	/**
	 * Clones the instance.
	 *
	 * <em>This is not a deep clone. Neither coord nor net is cloned.</em>
	 *
	 * @returns {Pin} the new instance
	 */
	this.clone = function () {
		return new Pin(this.coord, this.name, this.instTermNumber, this.net);
	};

	/**
	 * Clones the insstance with the param coord.
	 *
	 * <em>The param net wlii not be cloned.</em>
	 *
	 * @returns {Pin} the cloned pin
	 */
	this.deepClone = function () {
		const clone = this.clone();
		clone.coord = clone.coord.clone();
		return clone;
	};
};

export { Pin };
