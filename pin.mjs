import { Coordinate } from "./coordinate.mjs";
import { Net } from "./net.mjs";

/**
 * Class representing a component pin.
 *
 * @property {Coordinate} coord - the coresponding coordinate
 * @property {string} name - name of the pin, e.g. "gate"
 * @property {number} instTermNumber - number for matching with ADS pins
 * @property {Net} net - the correspondind net/potential
 */
class Pin {
	coord;
	name;
	instTermNumber;
	net;

	/**
	 * Generates a pin.
	 *
	 * @param {Coordinate} coord - the coresponding coordinate
	 * @param {string} name - name of the pin, e.g. "gate"
	 * @param {number} instTermNumber - number for matching with ADS pins
	 * @param {Net} net - the correspondind net/potential
	 */
	constructor(coord, name, instTermNumber, net) {
		this.coord = coord;
		this.name = name;
		this.instTermNumber = instTermNumber || 0;
		this.net = net;
	}

	/**
	 * Clones the instance.
	 *
	 * <em>This is not a deep clone. Neither coord nor net is cloned.</em>
	 *
	 * @returns {Pin} the new instance
	 */
	clone() {
		return new Pin(this.coord, this.name, this.instTermNumber, this.net);
	}

	/**
	 * Clones the insstance with the param coord.
	 *
	 * <em>The param net will not be cloned.</em>
	 *
	 * @returns {Pin} the cloned pin
	 */
	deepClone() {
		const clone = this.clone();
		clone.coord = clone.coord.clone();
		return clone;
	}

	/**
	 * Search the position of this pin using hints from existing wires, coordinates and the main coordinate of the
	 * component.
	 *
	 * Creates a new coordinate if no existing one is found in a certin distance.
	 *
	 * @param {{x: number, y: number, angle: number, xScale: number, yScale: number, mirrorX: boolean, mirrorY: boolean, scaling: number}} placement - general component placement information
	 * @param {Pin[]} [pins=[]] - list of all pins
	 * @param {Coordinate} instanceCoord - the component position
	 * @param {Wire[]} wires - list of all wires
	 * @param {Net[]} _nets - list of all nets
	 * @param {Coordinate[]} coords - list of all coordinates
	 * @param {boolean} [relativeCoords=true] - set to false if the pin should not be scaled, mirrored, etc.
	 * @returns {Pin} the new pin
	 */
	findPosition(pins = [], placement, instanceCoord, wires, _nets, coords, relativeCoords = true) {
		// set pin placement hints
		this.coord = pins?.find((stencilPin) => stencilPin.instTermNumber == this.instTermNumber)?.coord?.clone();

		if (relativeCoords) {
			if (this.coord) {
				// found --> scale
				this.coord.scale(placement.xScale * placement.scaling, placement.yScale * placement.scaling);
				this.coord.rotate(placement.angle);
				if (placement.mirrorX) this.coord.mirrorX();
				if (placement.mirrorY) this.coord.mirrorY();
				this.coord.add(instanceCoord); // relative -> absolute position
			} else {
				this.coord = instanceCoord; // no search hint found -> use component position
			}
		}

		// search real position
		const possibleCoords =
			(this.net &&
				wires
					.filter((wire) => wire.net == this.net)
					.map((wire) =>
						wire.coords.reduce(
							(prevVal, coord) => {
								const distance = this.coord.getDistance(coord);
								if (prevVal.distance < distance) return prevVal;
								else return { distance: distance, coord: coord };
							},
							{ distance: 1 /* max search distance */, coord: null }
						)
					)) ||
			[];
		let coord = possibleCoords.sort((a, b) => a.distance - b.distance)?.[0]?.coord;
		if (coord) {
			this.coord = coord;
			// DEBUG:
			// console.log("found");
		} else {
			// no existing wire coord found -> create new one

			// DEBUG:
			// console.log("not found");

			const existingCoord = coords.find((existingCoord) => this.coord.equals(existingCoord));
			if (existingCoord) this.coord = existingCoord;
			else coords.push(this.coord);
		}
		return this;
	}
}

export { Pin };
