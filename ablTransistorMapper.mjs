import { Coordinate } from "./coordinate.mjs";
import { Pin } from "./pin.mjs";
import { Transistor } from "./transistor.mjs";

/**
 * Class for mapping and geometrical transforming of ABL transistors to TikZ. It contains position information both for
 * ABL and TikZ.
 *
 * @property {Transistor} tikzTransistor - the transistor used as stencil
 * @property {Pin[]} pins - top, bottom and tap pin (ABL)
 * @property {0 | 1 | 2} anchorNr - the selected anchor; 0=top, 1=bottom, 2=tap (ABL)
 */
class ABLTransistorMapper {
	tikzTransistor;
	pins;
	anchorNr;

	/**
	 * Generate the "converter" for an existing TikZ transistor stencil.
	 *
	 * @param {Transistor} tikzTransistor - the transistor used as stencil
	 * @param {Pin[]} pins - top, bottom and tap coordinate
	 * @param {0 | 1 | 2} anchorNr - the selected anchor; 0=top, 1=bottom, 2=tap
	 */
	constructor(tikzTransistor, pins, anchorNr) {
		this.tikzTransistor = tikzTransistor;
		this.pins = pins;
		this.anchorNr = anchorNr;
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

		const mirrorMid = this.pins[this.anchorNr].coord;

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
	}

	/**
	 * Move all pins/coordinates using a vector.
	 *
	 * @param {Coordinate} vector - vector to add to all coordinates
	 */
	translate(vector) {
		this.pins.forEach((pin) => pin.coord.add(vector));
	}

	/**
	 * Clones this instance. This is neither a shallow nor a deep clone. Only the pins are deeply cloned.
	 *
	 * @returns {ABLTransistorMapper} - the semi deep clone
	 */
	clone() {
		return new ABLTransistorMapper(
			this.tikzTransistor,
			this.pins.map((pin) => pin.deepClone()),
			this.anchorNr
		);
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
	 * @returns {Transistor} the new Transistor
	 */
	useAsStencil(libraryName, cellName, instanceName, attributes, pins, placement, wires, nets, coords) {
		// normalize angle --> -180 < angle <= 180
		while (placement.angle <= -180) placement.angle += 360;
		while (placement.angle > 180) placement.angle -= 360;

		// get coordinate
		let instanceCoord = new Coordinate(placement.x * placement.scaling, placement.y * placement.scaling);

		const scaling = {
			x: placement.xScale * placement.scaling,
			y: placement.yScale * placement.scaling,
		};
		const ablTransistorClone = this.clone();
		ablTransistorClone.pins.forEach((pin) => pin.coord.scale(scaling.x, scaling.y));
		ablTransistorClone.rotate(placement.angle);
		ablTransistorClone.mirror(placement.mirrorX, placement.mirrorY);
		ablTransistorClone.translate(instanceCoord);
		// scale

		const transistor = this.tikzTransistor.deepClone();
		transistor.rotate(placement.angle);
		transistor.mirror(placement.mirrorX, placement.mirrorY);
		transistor.translate(ablTransistorClone.lineCrossingCoord.clone().subtract(transistor.lineCrossingCoord));

		if (global.DEBUG) {
			// "Midpoint"
			console.error("\\draw[Gold3] " + transistor.lineCrossingCoord.serializeName() + " circle [radius=1.2pt];");

			// Initial pins of TikZ transistor (SearchHints)
			transistor.pins.forEach((pin) =>
				console.error("\\draw[Cornsilk4] " + pin.coord.serializeName() + " circle [radius=1.2pt];")
			);
		}

		if (transistor.anchorNr != null && transistor.anchorCoord) {
			const oldCoord = coords.find((existingCoord) => transistor.anchorCoord.equals(existingCoord));
			if (oldCoord) transistor.anchorCoord = oldCoord;
			else coords.push(transistor.anchorCoord);
		}

		// set pins (+positions)
		pins.forEach((pin) => pin.findPosition(ablTransistorClone.pins, null, null, wires, nets, coords, false));

		// reorder
		pins = ablTransistorClone.pins.map((ablPin) =>
			pins.find((pin) =>
				pin.name && ablPin.name ? pin.name == ablPin.name : pin.instTermNumber === ablPin.instTermNumber
			)
		);

		// Pins of ADS transistor
		if (global.DEBUG)
			pins.forEach((pin) =>
				console.error("\\draw[SpringGreen4] " + pin.coord.serializeName() + " circle [radius=1.2pt];")
			);

		for (let i = 0; i < transistor.pins.length && i < pins.length; i++) {
			pins[i].coord.x = transistor.pins[i].coord.x;
			pins[i].coord.y = transistor.pins[i].coord.y;
		}

		// Pins of final TikZ Transistor
		if (global.DEBUG)
			pins.forEach((pin) =>
				console.error(
					"\\node at " + pin.coord.serializeName() + " {\\color{Turquoise3}\\pgfuseplotmark{Mercedes star}};"
				)
			);

		transistor.pins = pins;
		transistor.instanceName = instanceName;

		return transistor;
	}
}

export { ABLTransistorMapper };
