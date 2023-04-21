import { Writable as writeableStream } from "node:stream";

import { v4 as uuid } from "uuid";

import { Component } from "./component.mjs";
import { Coordinate } from "./coordinate.mjs";
import { Net } from "./net.mjs";
import { Pin } from "./pin.mjs";
import { Wire } from "./wire.mjs";

import { atoLaTex } from "./physQuantityParser.mjs";
import { ADS_COMPONENTS_MAP } from "./components.mjs";
import { Converter } from "./converter.mjs";

/**
 * @class
 * Class representing a schematic.
 * 
 * @example 
 * // node: the XML schematic view node
 * let schematic = Schematic.fromXML(node);	// parses the node
 * schematic.printToStream(process.stdout);	// serializes as TikZ code
 * @hideconstructor
 */
class Schematic {
	/** @type {Coordinate[]} */
	#coords;
	/** @type {Map<String, Net>} */
	#nets;
	/** @type {Wire[]} */
	#wires;
	/** @type {Component} */
	#components;

	/**
	 * @typedef {object} parameterParseSetting settings for parsing of component parameters.
	 * @property {boolean} parse - set to true to parse and "siunitx-ify"
	 * @property {string} [suggestedUnit] - if no unit can be found while parsing, `suggestedUnit` will be used
	 * @property {string} [forceUnit] - the unit will be replaced with `forceUnit`
	 */

	/**
	 * Settings for parsing components parameters.
	 * @constant
	 * @type {Map<string, parameterParseSetting>}
	 * */
	#parameterParserSettings = new Map([
		["C", { parse: true, suggestedUnit: "uF" }],
		["F", { parse: true, suggestedUnit: "Hz" }],
		["R", { parse: true, suggestedUnit: "Volt" }],
		["L", { parse: true, suggestedUnit: "nH" }],
	]);

	/**
	 * Use `fromXML `to create a schematic.
	 */
	constructor() {
		this.#coords = [];
		this.#nets = new Map();
		this.#wires = [];
		this.#components = [];
	}

	/**
	 * Parses a schematic view node and creates an instance of schematic.
	 *
	 * @param {Element} node - the node to parse
	 * @returns {Schematic} - the parsed schematic
	 */
	static fromXML(node) {
		let schematic = new Schematic();
		schematic.#parse(node);
		return schematic;
	}

	/**
	 * Internal parser function for an schematic view node.
	 *
	 * @param {Element} schematicView - the node to parse
	 * @param {number} [scale=2.54] - the scale factor (inch --> cm)
	 */
	#parse(schematicView, scale = 2.54) {
		//-- 1. get list of XML nodes to parse
		/** @type {Element} */
		const shapes = Converter.getNamedTag(schematicView, "shapes");
		Converter.assertTagFound(shapes, "shapes");
		/** @type {Element[]} */ // list of wire tags; may be empty
		const wireArray = Converter.getNamedTags(shapes, "wire");

		/** @type {Element} */
		const instances = Converter.getNamedTag(schematicView, "instances");
		Converter.assertTagFound(shapes, "instances");
		/** @type {Element[]} */ // list of components
		const instanceArray = Converter.getNamedTags(instances, "instance");

		//-- 2. parse wires -----------------------
		this.#wires = wireArray.map((wireXml) => {
			// Generate or get net
			const nameNode = Converter.getNamedTag(wireXml, "net");
			const netName = (nameNode ? nameNode.getAttribute("name") : "") || ""; // jsdoc doesn't like "?."
			let net = this.#nets.get(netName);
			if (!net) this.#nets.set(netName, (net = new Net(netName)));

			/** @type {Element} */ // node containing coordinates as a string
			const points = ["genpolyline", "centerline", "points"].reduce((node, tagname) => {
				node = Converter.getNamedTag(node, tagname);
				Converter.assertTagFound(node, tagname);
				return node;
			}, wireXml);

			// Parse coordinates
			const wireCoords = points.textContent.split(" ").reduce(
				/**
				 * @param {Coordinate[]} wireCoords
				 * @param {string} coordString
				 * @returns {Coordinate[]}
				 */
				(wireCoords, coordString) => {
					let [x, y] = coordString.split(",", 2);
					x = parseFloat(x);
					y = parseFloat(y);
					if (isFinite(x) && isFinite(y)) {
						let coord = new Coordinate(scale * x, scale * y);
						const oldCoord = this.#coords.find((existingCoord) => coord.equals(existingCoord));
						if (!oldCoord) this.#coords.push(coord);
						wireCoords.push(oldCoord || coord);
					} else {
						console.error("Couldn't parse wire coordinate: " + coordString);
					}
					return wireCoords;
				},
				[]
			);

			// Create wire
			const wire = new Wire(net, wireCoords);
			net.wires.push(wire);

			return wire;
		});

		// 3. Parse components -----------------------
		this.#components = instanceArray.reduce(
			/**
			 * @param {Component[]} components
			 * @param {Element} instanceXml
			 */
			(components, instanceXml) => {
				// get componentStencil
				/** @type {string} */
				const libraryName = instanceXml.getAttribute("libraryName") || "";
				/** @type {string} */
				const cellName = instanceXml.getAttribute("cellName") || "";
				/** @type {string} */ // R1 etc
				const instanceName = instanceXml.getAttribute("instanceName") || "";

				const componentStencil =
					ADS_COMPONENTS_MAP.get(libraryName + ":" + cellName) || ADS_COMPONENTS_MAP.get(cellName);
				if (!componentStencil) {
					console.error(
						"Skipping not identified component %s: %s:%s",
						instanceName.padStart(10),
						libraryName,
						cellName
					);
					return components; // <-- just skips this component
				}

				// extract attributes & parameters & name
				/** @type {Map<string,string>} */ // list/map of component attributes (inside instance <...>)
				const attributes = new Map(
					Array.prototype.map.call(instanceXml.attributes, (attribute) => [
						attribute.name,
						attribute.value || null,
					])
				);

				const parametersNode = Converter.getNamedTag(instanceXml, "parameters") || null;
				const parameterNodes = parametersNode
					? Converter.getNamedTags(
							parametersNode,
							"parameter",
							(param) => param.getAttribute && param.getAttribute("visible") == "true"
					  )
					: [];
				/** @type {Map<string,string>} */ // parameters, e.g. V for the voltage of a source
				const parameters = new Map(
					parameterNodes.map((param) => {
						const key = param.getAttribute("name");
						const parameterParserSetting = this.#parameterParserSettings.get(key);
						let value = param.getAttribute("value");
						if (parameterParserSetting && parameterParserSetting.parse)
							atoLaTex(value, parameterParserSetting.suggestedUnit, parameterParserSetting.forceUnit);
						return [key, value];
					})
				);

				// get placement
				// <abl:PlacementTransform x="1.50000" y="-0.12500" angle="0.00000" xScale="1.00000" yScale="1.00000" mirrorX="false" mirrorY="false"/>
				const placementXml = Converter.getNamedTag(instanceXml, "placementtransform");

				/** struct containing all placement information */
				const placement = placementXml
					? {
							x: parseFloat(placementXml.getAttribute("x")) || 0,
							y: parseFloat(placementXml.getAttribute("y")) || 0,
							angle: parseFloat(placementXml.getAttribute("angle")) || 0,
							xScale: parseFloat(placementXml.getAttribute("xScale")) || 1,
							yScale: parseFloat(placementXml.getAttribute("yScale")) || 1,
							mirrorX: placementXml.getAttribute("mirrorX") == "true",
							mirrorY: placementXml.getAttribute("mirrorY") == "true",
							scaling: scale,
					  }
					: {
							x: 0,
							y: 0,
							angle: 0,
							xScale: 1,
							yScale: 1,
							mirrorX: 1,
							mirrorY: 1,
							scaling: scale,
					  };

				// get pins (no coord yet)
				const instPinsXml = Converter.getNamedTag(instanceXml, "instpins");
				const instPinArray = instPinsXml ? Converter.getNamedTags(instPinsXml, "instpin") : [];
				const pins = instPinArray.map((pinXml) => {
					const instTermNumber = Number.parseInt(pinXml.getAttribute("instTermNumber")) || 0;
					const pinName = pinXml.getAttribute("pinName") || "";
					const netNameNode = Converter.getNamedTag(pinXml, "net");
					let netName = netNameNode ? netNameNode.getAttribute("name") || "" : "";
					if (!netName) netName = uuid();
					let net = this.#nets.get(netName);
					if (!net) this.#nets.set(netName, (net = new Net(netName)));

					return new Pin(null, pinName, instTermNumber, net);
				});

				// stencil --> component
				/** @type {Component | Component[] | null} */
				const component = componentStencil.useAsStencil(
					libraryName,
					cellName,
					instanceName,
					attributes,
					pins,
					placement,
					this.#wires,
					this.#nets,
					this.#coords
				);

				if (component) {
					if (Array.isArray(component)) component.forEach((item) => components.push(item));
					else components.push(component);
				}

				// still in reduce --> return array for next loop
				return components;
			},
			[]
		);
	}

	/**
	 * Serializes the schematic and prints it to an writeable stream. The stream won't be closed.
	 *
	 * @param {writeableStream} out - the stream to write to
	 * @throws {Error} on error writing to `out`
	 */
	async printToStream(out) {
		/**
		 * Prints a line to the output stream and returns a promise.
		 *
		 * @param {string} line - the line to write/print
		 * @returns {Promise<void>}
		 */
		const println = (line) =>
			new Promise((resolve, reject) => {
				out.once("error", reject);
				if (out.write(line + "\n")) {
					out.off("error", reject);
					resolve();
				} else
					out.once("drain", () => {
						// stream "full" --> wait for draining
						out.off("error", reject);
						resolve();
					});
			});

		await println("\\begin{tikzpicture}");
		for (const wire of this.#wires) await println(wire.serialize(1)); // indent 1 tab
		await println(""); // empty line
		for (const component of this.#components) await println(component.serialize(1)); // indent 1 tab
		await println("\\end{tikzpicture}");
	}
}

export { Schematic };