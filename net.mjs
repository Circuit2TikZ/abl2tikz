import { Wire } from "./wire.mjs";
import { Pin } from "./pin.mjs";

/**
 * Representation of a single potential/net.
 * 
 * @property {string} netname - the name of the net/potential
 * @property {Wire[]} wires - a list of corresponding wires
 * @property {Pin[]} pins - a list of corresponding pins
 */
class Net {
	netname;
	wires;
	pins;

	/**
	 * Generate a "network" / potential.
	 * 
	 * @param {string} netname - the name of the net/potential
	 * @param {Wire[]} [wires = []] - a list of corresponding wires
	 * @param {Pin[]} [pins = []] - a list of corresponding pins
	 */
	constructor(netname, wires = [], pins = []) {
		this.netname = netname;
		this.wires = wires || [];
		this.pins = pins || [];
	}
}

export { Net };
