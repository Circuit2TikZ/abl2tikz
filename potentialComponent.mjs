import { NodeComponent } from "./nodeComponent.mjs";
import { Pin } from "./pin.mjs";
import { Coordinate } from "./coordinate.mjs";
import { Net } from "./net.mjs";

/**
 * Class representing a potential, e.g. GND.
 *
 * @param {Pin} pin - the one and only pin
 * @param {PotentialComponent.POTENTIAL_TYPE} potentialType - the selected type, e.g. `POTENTIAL_TYPE.ground`
 */
class PotentialComponent extends NodeComponent {
	pin;
	potentialType;

	/**
	 * Enum/map-alike of available potentials.
	 *
	 * @readonly
	 * @enum {{tikzComponentName: string, printNetName: boolean}} */
	static /* const */ POTENTIAL_TYPE = {
		GROUND: { tikzComponentName: "ground", printNetName: false },
		TLGROUND: { tikzComponentName: "tlground", printNetName: false },
		RGROUND: { tikzComponentName: "rground", printNetName: false },
		SGROUND: { tikzComponentName: "sground", printNetName: false },
		TGROUND: { tikzComponentName: "tground", printNetName: false },
		NGROUND: { tikzComponentName: "nground", printNetName: false },
		PGROUND: { tikzComponentName: "pground", printNetName: false },
		CGROUND: { tikzComponentName: "cground", printNetName: false },
		EGROUND: { tikzComponentName: "eground", printNetName: false },
		EGROUND2: { tikzComponentName: "eground2", printNetName: false },

		VCC: { tikzComponentName: "vcc", printNetName: true }, // arrow up
		VEE: { tikzComponentName: "vee", printNetName: true }, // arrow down
	};

	/**
	 * Generate a potential (-stencil).
	 *
	 * @param {POTENTIAL_TYPE} potentialType - the selected type, e.g. `POTENTIAL_TYPE.ground`
	 * @param {Pin} pin - the one and only pin
	 * @param {number} [angle=0] - the angle to rotate the component
	 * @param {boolean} [mirrorX=false] - true to mirror on x axis
	 * @param {boolean} [mirrorY=false] - true to mirror on y axis
	 */
	constructor(potentialType, pin, angle = 0, mirrorX = false, mirrorY = false) {
		super(angle || 0, mirrorX, mirrorY);
		this.potentialType = potentialType;
		this.pin = pin;
	}

	/**
	 * @returns {[Pin]} list of pins (allways one)
	 */
	get pins() {
		return [this.pin];
	}

	/**
	 * @returns {string} - the TikZ component name
	 */
	get tikzComponentName() {
		return this.potentialType.tikzComponentName;
	}

	/**
	 * @returns {Coordinate} the component coordinate
	 */
	get coord() {
		return this.pin.coord;
	}

	/**
	 * @returns {Net} the corresponding net
	 */
	get net() {
		return this.pin.net;
	}

	/**
	 * @returns {string} the node text generated from the net name
	 */
	get nodeText() {
		return this.potentialType.printNetName ? (this.pin?.net?.getPrettyName() || "") : "";
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
	 * @returns {NodeComponent} the new NodeComponent
	 */
	useAsStencil(libraryName, cellName, instanceName, attributes, pins, placement, wires, nets, coords) {
		// normalize angle --> -180 < angle <= 180
		placement.angle += 90; // ADS: grounds etc. are horizontal --|
		while (placement.angle <= -180) placement.angle += 360;
		while (placement.angle > 180) placement.angle -= 360;

		// get coordinate
		let instanceCoord = new Coordinate(placement.x * placement.scaling, placement.y * placement.scaling);
		const oldCoord = coords.find((existingCoord) => instanceCoord.equals(existingCoord));
		if (oldCoord) instanceCoord = oldCoord;
		else coords.push(instanceCoord);

		// set pins (+positions)
		pins[0].findPosition([this.pin], placement, instanceCoord, wires, nets, coords);

		return new PotentialComponent(
			this.potentialType,
			pins[0],
			placement.angle,
			placement.mirrorX,
			placement.mirrorY
		);
	}
}

export { PotentialComponent };
