import { Net } from "./net.mjs";
import { Coordinate } from "./coordinate.mjs";
import { Pin } from "./pin.mjs";
import { Wire } from "./wire.mjs";

/**
 * @property {string} tikzComponentName
 * @property {string} instanceName
 * @property {Pin[]} [pins]
 * @property {Coordinate} coord
 * @property {number} [angle]
 *
 * @property {{}} [values]
 * @property {number} [voltage]
 * @property {number} [current]
 */
class Component {
	tikzComponentName;
	instanceName;
	pins;
	coord;
	angle;

	values = {};
	voltage;
	current;

	/**
	 *
	 * @param {string} tikzComponentName
	 * @param {string} instanceName
	 * @param {Pin[]} [pins]
	 * @param {Coordinate} coord
	 * @param {number} [angle]
	 */
	constructor(tikzComponentName, instanceName, pins = [], coord, angle) {
		this.tikzComponentName = tikzComponentName;
		this.instanceName = instanceName || "";
		this.pins = pins || [];
		this.coord = coord;
		this.angle = angle || 0;

		this.serialize = function (indent = 0) {
			let label = "";
			if (this.instanceName) {
				let [_fullMatch, name, index] = this.instanceName.match(/^([a-zA-Z]+)[_-]?([0-9]+)$/);

				if (name && !Number.isNaN((index = Number.parseInt(index)))) label = `\${${name}}_{${index}}\$`;
				else label = this.instanceName;

				label = ", l=" + label;
			}
			switch (this.pins.length) {
				case 1:
					return (
						"\t".repeat(indent) +
						"\\node[color=blue," +
						tikzComponentName +
						"] at " +
						pins[0].coord.serializeName() +
						" {};"
					);
				case 2: {
					let pinmark =
						"\t".repeat(indent) + "\\draw[color=blue] " + this.pins[0].coord.serializeName() + " ";
					if ((this.angle == 0 && !this.mirrorY) || (this.angle == 180 && this.mirrorY))
						// angle = 0 -->
						pinmark += "++ (3pt,0) ++ (-1.25pt, -2.5pt) -- ++(2.5pt, 5pt);\n";
					else if ((this.angle == 180 && !this.mirrorY) || (this.angle == 0 && this.mirrorY))
						// angle = 180 <--
						pinmark += "++ (-3pt,0) ++ (-1.25pt, -2.5pt) -- ++(2.5pt, 5pt);\n";
					else if ((this.angle == -90 && !this.mirrorX) || (this.angle == 90 && this.mirrorX))
						// angle = 270 (down)
						pinmark += "++ (0,3pt) ++ (-2.5pt, -1.25pt) -- ++(5pt, 2.5pt);\n";
					else if ((this.angle == 90 && !this.mirrorX) || (this.angle == -90 && this.mirrorX))
						// angle = 90 (up)
						pinmark += "++ (0,-3pt) ++ (-2.5pt, -1.25pt) -- ++(5pt, 2.5pt);\n";
					else pinmark = "";
					return (
						pinmark +
						"\t".repeat(indent) +
						"\\draw[color=blue] " +
						this.pins[0].coord.serializeName() +
						" to[" +
						this.tikzComponentName +
						label +
						"] " +
						this.pins[1].coord.serializeName() +
						";"
					);
				}

				default:
					return (
						"\t".repeat(indent) +
						'% Component "' +
						this.tikzComponentName +
						'" with pincount ' +
						this.pins.length +
						" is not supported"
					);
			}
		};

		this.deepClone = function () {
			const pins = this.pins.map((pin) => pin.deepClone());
			const clone = new Component(
				this.tikzComponentName,
				this.instanceName,
				pins,
				this.coord.clone(),
				this.angle
			);
			return clone;
		};

		/**
		 *
		 * @param {string} libraryName
		 * @param {string} cellName
		 * @param {string} instanceName
		 * @param {Map<string,string>} attributes
		 * @param {Pin[]} pins
		 * @param {{x: number, y: number, angle: number, xScale: number, yScale: number, mirrorX: boolean, mirrorY: boolean, scaling: number}} placement
		 * @param {Wire[]} wires
		 * @param {Map<string,Net>} nets
		 * @param {Coordinate[]} coords
		 *
		 * @returns {Component} the new component
		 */
		this.cloneToPosition = function (
			libraryName,
			cellName,
			instanceName,
			attributes,
			pins,
			placement,
			wires,
			nets,
			coords
		) {
			// normalize angle --> -180 < angle <= 180
			while (placement.angle <= -180) placement.angle += 360;
			while (placement.angle > 180) placement.angle -= 360;

			// get coordinate
			let instanceCoord = new Coordinate(placement.x * placement.scaling, placement.y * placement.scaling);
			const oldCoord = coords.find((existingCoord) => instanceCoord.equals(existingCoord));
			if (oldCoord) instanceCoord = oldCoord;
			else coords.push(instanceCoord);

			// set pins (+positions)
			pins.forEach((pin) => {
				// set pin placement hints
				pin.coord = this.pins
					?.find((stencilPin) => stencilPin.instTermNumber == pin.instTermNumber)
					?.coord?.clone();
				if (pin.coord) {
					// found --> scale
					pin.coord.scale(placement.xScale * placement.scaling, placement.yScale * placement.scaling);
					pin.coord.rotate(placement.angle);
					if (placement.mirrorX) pin.coord.mirrorX();
					if (placement.mirrorY) pin.coord.mirrorY();
					pin.coord.add(instanceCoord); // relative -> absolute position
				} else {
					pin.coord = instanceCoord; // no search hint found -> use comp. position
				}

				// search real position
				const possibleCoords =
					(pin.net &&
						wires
							.filter((wire) => wire.net == pin.net)
							.map((wire) =>
								wire.coords.reduce(
									(prevVal, coord) => {
										const distance = pin.coord.getDistance(coord);
										if (prevVal.distance < distance) return prevVal;
										else return { distance: distance, coord: coord };
									},
									{ distance: Number.MAX_VALUE, coord: null }
								)
							)) ||
					[];
				let coord = possibleCoords.sort((a, b) => a.distance - b.distance)?.[0]?.coord;
				if (coord) pin.coord = coord;
				else {
					// no existing wire coord found -> create new one
					const existingCoord = coords.find((existingCoord) => pin.coord.equals(existingCoord));
					if (existingCoord) pin.coord = existingCoord;
					else coords.push(pin.coord);
				}
			});

			const component = new Component(this.tikzComponentName, instanceName, pins, instanceCoord, placement.angle);

			component.instanceName = attributes.get("instanceName") || null;
			component.mirrorX = placement.mirrorX;
			component.mirrorY = placement.mirrorY;

			return component;
		};
	}
}

export { Component };
