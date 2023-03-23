import { Component } from "./component.mjs";
import { PathComponent } from "./pathComponent.mjs";
import { PotentialComponent } from "./potentialComponent.mjs";
import { Coordinate } from "./coordinate.mjs";
import { Pin } from "./pin.mjs";
import { Transistor } from "./transistor.mjs";
import { ABLTransistorMapper } from "./ablTransistorMapper.mjs";

const TWO_POLE_COMPONENT_LENGTH = 1;

const ZERO_COORD = new Coordinate(0, 0);
const ZERO_PIN = new Pin(ZERO_COORD, null, 1, null);
const TRANSISTOR_TOP_PIN = new Pin(new Coordinate(.5, .5), null, 1, null);
const TRANSISTOR_TAP_PIN = new Pin(ZERO_COORD, null, 2, null);
const TRANSISTOR_BOTTOM_PIN = new Pin(new Coordinate(.5, -.5), null, 3, null);
const TWO_POLE_SECOND_PIN = new Pin(new Coordinate(TWO_POLE_COMPONENT_LENGTH, 0), null, 2, null);
const TWO_POLE_COMPONENT_PINS = [ZERO_PIN, TWO_POLE_SECOND_PIN];

// prettier-ignore
/**
 * Enum/map-alike of all (supported) TikZ components.
 * 
 * @readonly
 * @enum {Component}
 */
const TIKZ_COMPONENTS = {
	// # one poles
	// ## grounds:
	ground: new PotentialComponent(PotentialComponent.POTENTIAL_TYPE.GROUND, ZERO_COORD),		// generic ground
	tlground: new PotentialComponent(PotentialComponent.POTENTIAL_TYPE.TLGROUND, ZERO_COORD),	// tailless ground
	rground: new PotentialComponent(PotentialComponent.POTENTIAL_TYPE.RGROUND, ZERO_COORD),		// reference ground
	sground: new PotentialComponent(PotentialComponent.POTENTIAL_TYPE.SGROUND, ZERO_COORD),		// signal ground
	tground: new PotentialComponent(PotentialComponent.POTENTIAL_TYPE.TGROUND, ZERO_COORD),		// thick tailless reference ground
	nground: new PotentialComponent(PotentialComponent.POTENTIAL_TYPE.NGROUND, ZERO_COORD),		// noiseless ground
	pground: new PotentialComponent(PotentialComponent.POTENTIAL_TYPE.PGROUND, ZERO_COORD),		// protective ground
	cground: new PotentialComponent(PotentialComponent.POTENTIAL_TYPE.CGROUND, ZERO_COORD),		// chassis ground
	eground: new PotentialComponent(PotentialComponent.POTENTIAL_TYPE.EGROUND, ZERO_COORD),		// european ground
	eground2: new PotentialComponent(PotentialComponent.POTENTIAL_TYPE.EGROUND2, ZERO_COORD),	// european ground v2

	// # two poles
	// ## power supplies
	vcc: new PotentialComponent(PotentialComponent.POTENTIAL_TYPE.VCC, ZERO_COORD),				// arrow up
	vee: new PotentialComponent(PotentialComponent.POTENTIAL_TYPE.VEE, ZERO_COORD),				// arrow down

	// ## generics --> skip

	// ## resistors
	R: new PathComponent("R", null, TWO_POLE_COMPONENT_PINS),					// resistor
	vR: new PathComponent("vR", null, TWO_POLE_COMPONENT_PINS),					// variable resistor
	// TODO change poti to 3 term type
	pR: new PathComponent("pR", null, TWO_POLE_COMPONENT_PINS),					// potentiometer
	sR: new PathComponent("sR", null, TWO_POLE_COMPONENT_PINS),					// resistive sensor
	ldR: new PathComponent("ldR", null, TWO_POLE_COMPONENT_PINS),				// light dependant resistor
	varistor: new PathComponent("varistor", null, TWO_POLE_COMPONENT_PINS),		// varistor
	phR: new PathComponent("phR", null, TWO_POLE_COMPONENT_PINS),				// photoresistor
	thR: new PathComponent("thR", null, TWO_POLE_COMPONENT_PINS),				// thermistor
	thRp: new PathComponent("thRp", null, TWO_POLE_COMPONENT_PINS),				// thermistor (PTC)
	thRn: new PathComponent("thRn", null, TWO_POLE_COMPONENT_PINS),				// thermistor (NTC)

	// ## capacitors and similar components
	C: new PathComponent("C", null, TWO_POLE_COMPONENT_PINS),		// -| |-   capacitor
	cC: new PathComponent("cC", null, TWO_POLE_COMPONENT_PINS),		// -| (-   curved/polarized capacitor
	eC: new PathComponent("eC", null, TWO_POLE_COMPONENT_PINS),		// -+[]-   electrolyte capacitor
	vC: new PathComponent("vC", null, TWO_POLE_COMPONENT_PINS),		// -|/^|-  variable capacitor
	sC: new PathComponent("sC", null, TWO_POLE_COMPONENT_PINS),		// -|/|-   capacitive sensor
	PZ: new PathComponent("PZ", null, TWO_POLE_COMPONENT_PINS),		// -|[]|-  piezoelectric element
	cpe: new PathComponent("cpe", null, TWO_POLE_COMPONENT_PINS),	// -> >-   constant phase element
	feC: new PathComponent("feC", null, TWO_POLE_COMPONENT_PINS),	// -||\||- ferroelectric capacitor

	// ## inductors
	L: new PathComponent("L", null, TWO_POLE_COMPONENT_PINS),					// inductor
	vL: new PathComponent("vL", null, TWO_POLE_COMPONENT_PINS),					// variable inductor
	sL: new PathComponent("sL", null, TWO_POLE_COMPONENT_PINS),					// inductive sensor
	sR: new PathComponent("sR", null, TWO_POLE_COMPONENT_PINS),					// resistive sensor
	cuteChoke: new PathComponent("cute choke", null, TWO_POLE_COMPONENT_PINS),	// (cute) choke

	// ## diodes etc
	Do: new PathComponent("Do", null, TWO_POLE_COMPONENT_PINS),					// empty diode
	// TODO

	// ## sources
	battery: new PathComponent("battery", null, TWO_POLE_COMPONENT_PINS),			// battery (symbol: 2 cells)
	batteryCell1: new PathComponent("battery1", null, TWO_POLE_COMPONENT_PINS),		// single battery cell
	batteryCell2: new PathComponent("battery2", null, TWO_POLE_COMPONENT_PINS),		// single battery cell with fat negative pole

	vsource: new PathComponent("vsource", null, TWO_POLE_COMPONENT_PINS),			// generic voltage source (european)
	vsourceAM: new PathComponent("vsourceAM", null, TWO_POLE_COMPONENT_PINS),		// generic voltage source (american)
	vsourceC: new PathComponent("vsourceC", null, TWO_POLE_COMPONENT_PINS),			// generic voltage source (european, cute)

	isource: new PathComponent("isource", null, TWO_POLE_COMPONENT_PINS),			// generic current source (european)
	isourceAM: new PathComponent("isourceAM", null, TWO_POLE_COMPONENT_PINS),		// generic current source (american)
	isourceC: new PathComponent("isourceC", null, TWO_POLE_COMPONENT_PINS),			// generic current source (european, cute)

	sV: new PathComponent("sV", null, TWO_POLE_COMPONENT_PINS),						// sinusoidal voltage source
	sI: new PathComponent("sI", null, TWO_POLE_COMPONENT_PINS),						// sinusoidal current source

	dcvsource: new PathComponent("dcvsource", null, TWO_POLE_COMPONENT_PINS),		// dc voltage source
	dcisource: new PathComponent("dcisource", null, TWO_POLE_COMPONENT_PINS),		// dc current source
	

	// ## controlled sources
	// TODO

	// ## noise sources
	// TODO

	// ## special sources
	sqV: new PathComponent("sqV", null, TWO_POLE_COMPONENT_PINS),		// Square voltage source
	// TODO

	// ## Nullator and norator
	// TODO

	// ## instruments
	// TODO

	// ## mechanical analogy
	// --> ignore

	// ## misc bipoles
	// TODO

	// ## multiple wires / busses
	// TODO

	// ## crossings
	// TODO

	// ## currentarrow
	// --> ignore

	// ## poles
	// --> maybe

	// ## connectors
	// --> maybe more
	iecConnector: new Component("iec connector", null, TWO_POLE_COMPONENT_PINS),

	// ## block diagram components
	// --> BJTs
	npn: Transistor.fromStruct("npn", ["C", "E", "B"], {width: .6, connHeight: 0, height: 1.1}),
	pnp: Transistor.fromStruct("pnp", ["E", "C", "B"], {width: .6, connHeight: 0, height: 1.1}),

	nigfete: Transistor.fromStruct("nigfete", ["D", "S", "G"], {width: .7, connHeight: -.35, height: 1.1}),
	pigfete: Transistor.fromStruct("pigfete", ["S", "D", "G"], {width: .7, connHeight: .35, height: 1.1})
	//pigfete: new Transistor("pigfete", [new Pin(new Coordinate(0,1.1*.5*1.4)), new Pin(new Coordinate(-1.4*.7,.35*.5*1.1*1.4)), new Pin(new Coordinate(0,0.7*1.1)), ], ["D", "G", "S"], null, null, null, null, 0, false, false)
};

/**
 * Maps an ABL component to a TikZ component stencil. The key is either just the cellName (e.g. "R"), or
 * libraryName:cellName for specific components.
 * 
 * @type {Map<string, Component>}
 */
const ADS_COMPONENTS_MAP = new Map([
	["C", TIKZ_COMPONENTS.cC], // ads_rflib,
	["Diode", TIKZ_COMPONENTS.Do], // ads_rflib,
	["EE_MOS1", new ABLTransistorMapper(TIKZ_COMPONENTS.nigfete, [TRANSISTOR_TOP_PIN, TRANSISTOR_BOTTOM_PIN, TRANSISTOR_TAP_PIN], 2)],
	["GROUND", TIKZ_COMPONENTS.ground], // ads_rflib
	["R", TIKZ_COMPONENTS.R], // ads_rflib
	["L", TIKZ_COMPONENTS.L], // ads_rflib
	["BJT_NPN", new ABLTransistorMapper(TIKZ_COMPONENTS.npn, [TRANSISTOR_TOP_PIN, TRANSISTOR_BOTTOM_PIN, TRANSISTOR_TAP_PIN], 2)],
	["V_AC", TIKZ_COMPONENTS.sV], // ads_simulation
	["V_DC", TIKZ_COMPONENTS.vsource], // ads_simulation
	["VtPulse", TIKZ_COMPONENTS.sqV], // ads_simulation
	
]);

export { ADS_COMPONENTS_MAP };
