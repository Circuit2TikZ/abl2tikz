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
const TWO_POLE_COMPONENT_PINS_MIRRORED = [TWO_POLE_SECOND_PIN, ZERO_PIN];

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
	C: new PathComponent("C", null, TWO_POLE_COMPONENT_PINS_MIRRORED),		// -| |-   capacitor
	cC: new PathComponent("cC", null, TWO_POLE_COMPONENT_PINS_MIRRORED),		// -| (-   curved/polarized capacitor
	eC: new PathComponent("eC", null, TWO_POLE_COMPONENT_PINS_MIRRORED),		// -+[]-   electrolyte capacitor
	vC: new PathComponent("vC", null, TWO_POLE_COMPONENT_PINS_MIRRORED),		// -|/^|-  variable capacitor
	sC: new PathComponent("sC", null, TWO_POLE_COMPONENT_PINS_MIRRORED),		// -|/|-   capacitive sensor
	PZ: new PathComponent("PZ", null, TWO_POLE_COMPONENT_PINS_MIRRORED),		// -|[]|-  piezoelectric element
	cpe: new PathComponent("cpe", null, TWO_POLE_COMPONENT_PINS_MIRRORED),	// -> >-   constant phase element
	feC: new PathComponent("feC", null, TWO_POLE_COMPONENT_PINS_MIRRORED),	// -||\||- ferroelectric capacitor

	// ## inductors
	L: new PathComponent("L", null, TWO_POLE_COMPONENT_PINS),					// inductor
	vL: new PathComponent("vL", null, TWO_POLE_COMPONENT_PINS),					// variable inductor
	sL: new PathComponent("sL", null, TWO_POLE_COMPONENT_PINS),					// inductive sensor
	sR: new PathComponent("sR", null, TWO_POLE_COMPONENT_PINS),					// resistive sensor
	cuteChoke: new PathComponent("cute choke", null, TWO_POLE_COMPONENT_PINS),	// (cute) choke
	cuteChokeTwoLine: new PathComponent("cute choke, twolineschoke", null, TWO_POLE_COMPONENT_PINS),	// (cute) choke

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
	amp: new PathComponent("amp", null, TWO_POLE_COMPONENT_PINS),



	// ## Transistors
	// ### BJTs
	npn: Transistor.fromStruct("npn", ["C", "E", "B"], {width: .6, connHeight: 0, height: 1.1}),
	pnp: Transistor.fromStruct("pnp", ["E", "C", "B"], {width: .6, connHeight: 0, height: 1.1}),

	// ### FETs
	nmos: Transistor.fromStruct("nmos", ["D", "S", "G"], {width: .7, connHeight: 0, height: 1.1}),
	pmos: Transistor.fromStruct("pmos", ["S", "D", "G"], {width: .7, connHeight: 0, height: 1.1}),
	nigfete: Transistor.fromStruct("nigfete", ["D", "S", "G"], {width: .7, connHeight: -.35, height: 1.1}),
	pigfete: Transistor.fromStruct("pigfete", ["S", "D", "G"], {width: .7, connHeight: .35, height: 1.1}),
	
	// ## Tubees

	// ## RF Components

	// ## Electro-Mechanical Devices

	// ## Double bipoles (transformers)

	// ## Amplifiers
	"op amp": new Transistor("op amp", null, [
		// x: pgfCircRlen * tripoles/op amp/width  * .5
		// y: pgfCircRlen * tripoles/op amp/height * tripoles/op amp/input height * .5
		new Pin(new Coordinate(-1.4*1.7*.5, +1.4*1.4*.5*.5), "-"),
		new Pin(new Coordinate(-1.4*1.7*.5, -1.4*1.4*.5*.5), "+"),
		new Pin(new Coordinate(+1.4*1.7*.5, 0), "out")
	], ["-", "+", "out"], null, ZERO_COORD),

	// ## Switches, buttons and jumpers

	// ## Logic gates

	// ## Flip-flops

	// ## Multiplexer and de-multiplexer

	// ## Chips (integrated circuits)

	// ## Seven segment displays
};

// prettier-ignore
/**
 * Enum/map-alike of mapper objects. These contain both an TikZ and an ADS component and are used for more complex
 * transformations.
 * 
 * @readonly
 * @enum {Component}
 */
const ADS_TIKZ_MAPPERS = {
	BJT: new ABLTransistorMapper(TIKZ_COMPONENTS.npn, [TRANSISTOR_TOP_PIN, TRANSISTOR_BOTTOM_PIN, TRANSISTOR_TAP_PIN], 2),
	SIMPLE_FETN: new ABLTransistorMapper(TIKZ_COMPONENTS.nmos, [TRANSISTOR_TOP_PIN, TRANSISTOR_BOTTOM_PIN, TRANSISTOR_TAP_PIN], 2),
};

/**
 * Maps an ABL component to a TikZ component stencil. The key is either just the cellName (e.g. "R"), or
 * libraryName:cellName for specific components.
 * 
 * @type {Map<string, Component>}
 */
const ADS_COMPONENTS_MAP = new Map([
	// Potentials
	["GROUND", TIKZ_COMPONENTS.ground], // ads_rflib
	// Voltage sources
	["V_AC", TIKZ_COMPONENTS.sV], // ads_simulation
	["V_DC", TIKZ_COMPONENTS.battery], // ads_simulation
	["VtPulse", TIKZ_COMPONENTS.sqV], // ads_simulation

	// #passive components
	// ##Capacitors
	["C", TIKZ_COMPONENTS.cC], // ads_rflib,
	["ads_rflib:CAPQ", TIKZ_COMPONENTS.cC], // capacitor + quality factor
	["ads_rflib:C_Pad1", TIKZ_COMPONENTS.cC], // ads_rflib, FET modelling
	["ads_rflib:C_Space", TIKZ_COMPONENTS.cC], // ads_rflib, FET modelling
	["ads_rflib:C_Conn", TIKZ_COMPONENTS.cC], // ads_rflib, FET modelling
	["ads_rflib:C_dxdy", TIKZ_COMPONENTS.cC], // ads_rflib, FET modelling
	["ads_rflib:CAPP2", TIKZ_COMPONENTS.cC], // ads_rflib, chip capacitor
	["ads_rflib:CAPP2_Pad1", TIKZ_COMPONENTS.cC], // ads_rflib, FET modelling
	["ads_rflib:CAPP2_Space", TIKZ_COMPONENTS.cC], // ads_rflib, FET modelling
	["ads_rflib:CAPP2_Conn", TIKZ_COMPONENTS.cC], // ads_rflib, FET modelling
	["ads_rflib:CQ_Pad1", TIKZ_COMPONENTS.cC], // ads_rflib, FET modelling
	["ads_rflib:CQ_Space", TIKZ_COMPONENTS.cC], // ads_rflib, FET modelling
	["ads_rflib:CQ_Conn", TIKZ_COMPONENTS.cC], // ads_rflib, FET modelling
	["ads_rflib:DICAP", TIKZ_COMPONENTS.cC], // ads_rflib, FET modelling
	["ads_rflib:DILABMLC", TIKZ_COMPONENTS.cC], // ads_rflib, FET modelling
	// ##Inductors
	["L", TIKZ_COMPONENTS.L], // ads_rflib
	["ads_rflib:CIND", TIKZ_COMPONENTS.cuteChokeTwoLine], // toroidal inductor --> choke
	["ads_rflib:RIND", TIKZ_COMPONENTS.L], // chip inductor
	["ads_rflib:INDQ", TIKZ_COMPONENTS.L], // inductor + quality factor
	["ads_rflib:INDQ2", TIKZ_COMPONENTS.L], // inductor + quality factor
	["ads_rflib:L_Pad1", TIKZ_COMPONENTS.L], // ads_rflib, FET modelling
	["ads_rflib:L_Space", TIKZ_COMPONENTS.L], // ads_rflib, FET modelling
	["ads_rflib:L_Conn", TIKZ_COMPONENTS.L], // ads_rflib, FET modelling
	["ads_rflib:LQ_Pad1", TIKZ_COMPONENTS.L], // ads_rflib, FET modelling
	["ads_rflib:LQ_Space", TIKZ_COMPONENTS.L], // ads_rflib, FET modelling
	["ads_rflib:LQ_Conn", TIKZ_COMPONENTS.L], // ads_rflib, FET modelling
	// ##Resistors
	["R", TIKZ_COMPONENTS.R], // ads_rflib
	["ads_rflib:R_Pad1", TIKZ_COMPONENTS.R], // ads_rflib, FET modelling
	["ads_rflib:R_Space", TIKZ_COMPONENTS.R], // ads_rflib, FET modelling
	["ads_rflib:R_Conn", TIKZ_COMPONENTS.R], // ads_rflib, FET modelling
	["ads_rflib:R_dxdy", TIKZ_COMPONENTS.R], // ads_rflib, FET modelling

	// #active components
	// ##Diodes
	["Diode", TIKZ_COMPONENTS.Do], // ads_rflib,
	["PIN", TIKZ_COMPONENTS.Do], // ads_rflib, PIN diode
	["PIN2", TIKZ_COMPONENTS.Do], // ads_rflib, PIN diode
	// ##Transistors
	// ###FETs
	["EE_MOS1", new ABLTransistorMapper(TIKZ_COMPONENTS.nigfete, [TRANSISTOR_TOP_PIN, TRANSISTOR_BOTTOM_PIN, TRANSISTOR_TAP_PIN], 2)],
	["ads_rflib:FET", ADS_TIKZ_MAPPERS.SIMPLE_FETN], // ads_rflib, Devices-Linear
	["ads_rflib:FET2", ADS_TIKZ_MAPPERS.SIMPLE_FETN], // ads_rflib, Devices-Linear
	["ads_rflib:FETN1", ADS_TIKZ_MAPPERS.SIMPLE_FETN], // ads_rflib, Devices-Linear
	["ads_rflib:FETN2", ADS_TIKZ_MAPPERS.SIMPLE_FETN], // ads_rflib, Devices-Linear
	["ads_rflib:FETN3", ADS_TIKZ_MAPPERS.SIMPLE_FETN], // ads_rflib, Devices-Linear
	["ads_rflib:FETN4", ADS_TIKZ_MAPPERS.SIMPLE_FETN], // ads_rflib, Devices-Linear
	["ads_rflib:FETN4a", ADS_TIKZ_MAPPERS.SIMPLE_FETN], // ads_rflib, Devices-Linear
	["ads_rflib:FETN5", ADS_TIKZ_MAPPERS.SIMPLE_FETN], // ads_rflib, Devices-Linear
	["ads_pelib:MOS_GENERIC_N", ADS_TIKZ_MAPPERS.SIMPLE_FETN],
	// ###BJTs
	["BJT_NPN", ADS_TIKZ_MAPPERS.BJT],
	["ads_rflib:BIP", ADS_TIKZ_MAPPERS.BJT],
	["ads_rflib:BIPB", ADS_TIKZ_MAPPERS.BJT],
	["ads_rflib:HYBPI", ADS_TIKZ_MAPPERS.BJT],
	
	// ###Hacky workaround for OpAmps
	["ads_behavioral:Amplifier2", TIKZ_COMPONENTS.amp], // generic amplifier
	[
		"OpAmp",
		new ABLTransistorMapper(
			TIKZ_COMPONENTS["op amp"],
			[
				new Pin(ZERO_COORD, "P__0", 1), // -
				new Pin(new Coordinate(0, -0.5), "P__2", 3), // +
				new Pin(new Coordinate(1, -0.25), "P__1", 2), // out
			],
			0 /* inv */
		),
	],
]);

export { ADS_COMPONENTS_MAP };
