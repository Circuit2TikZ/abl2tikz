import { Component } from "./component.mjs";
import { Coordinate } from "./coordinate.mjs";
import { Pin } from "./pin.mjs";

const TWO_POLE_COMPONENT_LENGTH = 1;

const ZERO_COORD = new Coordinate(0, 0);
const ZERO_PIN = new Pin(ZERO_COORD, null, 1, null);
const TWO_POLE_SECOND_PIN = new Pin(new Coordinate(TWO_POLE_COMPONENT_LENGTH, 0), null, 2, null);
const TWO_POLE_COMPONENT_PINS = [ZERO_PIN, TWO_POLE_SECOND_PIN];

// prettier-ignore
const TIKZ_COMPONENTS = {
	// # one poles
	// ## grounds:
	ground: new Component("ground", null, [ZERO_PIN], ZERO_COORD, 0),		// generic ground
	tlground: new Component("tlground", null, [ZERO_PIN], ZERO_COORD, 0),	// tailless ground
	rground: new Component("rground", null, [ZERO_PIN], ZERO_COORD, 0),		// reference ground
	sground: new Component("sground", null, [ZERO_PIN], ZERO_COORD, 0),		// signal ground
	tground: new Component("tground", null, [ZERO_PIN], ZERO_COORD, 0),		// thick tailless reference ground
	nground: new Component("nground", null, [ZERO_PIN], ZERO_COORD, 0),		// noiseless ground
	pground: new Component("pground", null, [ZERO_PIN], ZERO_COORD, 0),		// protective ground
	cground: new Component("cground", null, [ZERO_PIN], ZERO_COORD, 0),		// chassis ground
	eground: new Component("eground", null, [ZERO_PIN], ZERO_COORD, 0),		// european ground
	eground2: new Component("eground2", null, [ZERO_PIN], ZERO_COORD, 0),	// european ground v2

	// # two poles
	// ## power supplies
	vcc: new Component("vcc", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),				// arrow up
	vee: new Component("vee", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),				// arrow down

	// ## generics --> skip

	// ## resistors
	R: new Component("R", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),					// resistor
	vR: new Component("vR", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),					// variable resistor
	// todo change poti to 3 term type
	pR: new Component("pR", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),					// potentiometer
	sR: new Component("sR", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),					// resistive sensor
	ldR: new Component("ldR", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),				// light dependant resistor
	varistor: new Component("varistor", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),		// varistor
	phR: new Component("phR", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),				// photoresistor
	thR: new Component("thR", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),				// thermistor
	thRp: new Component("thRp", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),				// thermistor (PTC)
	thRn: new Component("thRn", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),				// thermistor (NTC)

	// ## capacitors and similar components
	C: new Component("C", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),		// -| |-   capacitor
	cC: new Component("cC", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),		// -| (-   curved/polarized capacitor
	eC: new Component("eC", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),		// -+[]-   electrolyte capacitor
	vC: new Component("vC", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),		// -|/^|-  variable capacitor
	sC: new Component("sC", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),		// -|/|-   capacitive sensor
	PZ: new Component("PZ", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),		// -|[]|-  piezoelectric element
	cpe: new Component("cpe", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),	// -> >-   constant phase element
	feC: new Component("feC", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),	// -||\||- ferroelectric capacitor

	// ## inductors
	L: new Component("L", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),					// inductor
	vL: new Component("vL", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),					// variable inductor
	sL: new Component("sL", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),					// inductive sensor
	sR: new Component("sR", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),					// resistive sensor
	cuteChoke: new Component("cute choke", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),	// (cute) choke

	// ## diodes etc
	// todo

	// ## sources
	battery: new Component("battery", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),			// battery (symbol: 2 cells)
	batteryCell1: new Component("battery1", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),		// single battery cell
	batteryCell2: new Component("battery2", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),		// single battery cell with fat negative pole

	vsource: new Component("vsource", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),			// generic voltage source (european)
	vsourceAM: new Component("vsourceAM", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),		// generic voltage source (american)
	vsourceC: new Component("vsourceC", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),			// generic voltage source (european, cute)

	isource: new Component("isource", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),			// generic current source (european)
	isourceAM: new Component("isourceAM", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),		// generic current source (american)
	isourceC: new Component("isourceC", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),			// generic current source (european, cute)

	sV: new Component("sV", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),						// sinusoidal voltage source
	sI: new Component("sI", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),						// sinusoidal current source

	dcvsource: new Component("dcvsource", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),		// dc voltage source
	dcisource: new Component("dcisource", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),		// dc current source

	// ## controlled sources
	// todo

	// ## noise sources
	// todo

	// ## special sources
	// todo

	// ## Nullator and norator
	// todo

	// ## instruments
	// todo

	// ## mechanical analogy
	// --> ignore

	// ## misc bipoles
	// todo

	// ## multiple wires / busses
	// todo

	// ## crossings
	// todo

	// ## currentarrow
	// --> ignore

	// ## poles
	// --> maybe

	// ## connectors
	// --> maybe more
	iecConnector: new Component("iec connector", null, TWO_POLE_COMPONENT_PINS, ZERO_COORD, 0),

	// ## block diagram components
	// --> ignore
};

const ADS_COMPONENTS_MAP = new Map([
	["GROUND", TIKZ_COMPONENTS.ground], // ads_rflib
	["R", TIKZ_COMPONENTS.R], // ads_rflib
	["C", TIKZ_COMPONENTS.cC], // ads_rflib
	["V_AC", TIKZ_COMPONENTS.sV], // ads_simulation
]);

export { ADS_COMPONENTS_MAP };
