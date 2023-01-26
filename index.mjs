//const { DOMParser, XMLSerializer } = require("@xmldom/xmldom");
//import * as XMLFeatures from 'common-xml-features';
//const { DOMParser } = require('@xmldom/xmldom');
//const { DOMParser, XMLSerializer, XPathResult } = require('common-xml-features');
import { DOMParser } from "common-xml-features";
//const fs = require('node:fs');
import * as fs from "node:fs";

import { Component } from "./component.mjs";
import { Coordinate } from "./coordinate.mjs";
import { Net } from "./net.mjs";
import { Pin } from "./pin.mjs";
import { Wire } from "./wire.mjs";

import { ADS_COMPONENTS_MAP } from "./components.mjs";

//onst FILENAME = "../MyFirstWorkspace_wrk/MyFirstWorkspace_lib.xml";
const FILENAME = "../C_Test/MyWorkspace_wrk/MyLibrary_lib.xml";

var BUFFER = fs.readFileSync(FILENAME, {
	encoding: "utf8",
});

const scale = 2.54;

/** @type {DOMParser} */
const parser = new DOMParser();
/** @type {Document} */
const parsed = parser.parseFromString(BUFFER, "text/xml");

/**
 * Searches a child node by name and by an additional filter if present.
 *
 * @param {Node} root the root node to find the child
 * @param {string} tagName the name of the xml tag to find
 * @param {(node: Node) => boolean} [additionalFilter] filter function returning true if node matches the criteria
 * @returns {Node|null} the found node or null if not found
 */
function getNamedTag(root, tagName, additionalFilter) {
	return Array.prototype.find.call(
		root.childNodes,
		(node) =>
			node.localName && node.localName.toLowerCase() == tagName && (!additionalFilter || additionalFilter(node))
	);
}

/**
 * Filters child nodes by name and by an additional filter if present.
 *
 * @param {Node} root the root node to find the childs
 * @param {string} tagName the name of the xml tag to filter
 * @param {(node: Node) => boolean} [additionalFilter] filter function returning true if node matches the criteria
 * @returns {Node[]} the filtered nodes (may be empty)
 */
function getNamedTags(root, tagName, additionalFilter) {
	return Array.prototype.filter.call(
		root.childNodes,
		(node) =>
			node.localName && node.localName.toLowerCase() == tagName && (!additionalFilter || additionalFilter(node))
	);
}

/*parsed.childNodes.__proto__.find = function find(predicate) {
    return Array.prototype.find.call(this, predicate);
}*/

const ABLRoot = parsed.documentElement;
const Library = getNamedTag(ABLRoot, "library");
const Cells = getNamedTag(Library, "cells");

const CellArray = getNamedTags(Cells, "cell");

const thisCell = CellArray[0];
const Views = getNamedTag(thisCell, "views");

const SchematicViewArray = getNamedTags(
	Views,
	"schematicview",
	(node) => node.attributes.getNamedItem("type").value == "schematic"
);

const thisSchematicView = SchematicViewArray[0];

const Shapes = getNamedTag(thisSchematicView, "shapes");
const WireArray = getNamedTags(Shapes, "wire");

const Instances = getNamedTag(thisSchematicView, "instances");
const InstanceArray = getNamedTags(Instances, "instance");

/** @type {Coordinate[]} */
let coords = [];

/** @type {Map<String, Net>} */
let nets = new Map();

/** @type {Wire[]} */
let wires = WireArray.map((wireXml) => {
	const netName = wireXml.getElementsByTagName("abl:Net")[0]?.getAttribute("name") || "gnd!";
	let net = nets.get(netName);
	if (!net) nets.set(netName, (net = new Net(netName)));

	const pathString =
		wireXml
			.getElementsByTagName("abl:GenPolyline")[0]
			?.getElementsByTagName("abl:CenterLine")[0]
			?.getElementsByTagName("abl:Points")[0]?.textContent || null;
	const coordStrings = pathString.split(" ");
	const wireCoords = coordStrings.map((coordString) => {
		/** @type {Coordinate[]} */
		let [x, y] = coordString.split(",");
		x = parseFloat(x);
		y = parseFloat(y);
		if (isFinite(x) && isFinite(y)) {
			let coord = new Coordinate(scale * x, scale * y);
			const oldCoord = coords.find((existingCoord) => coord.equals(existingCoord));
			if (!oldCoord) coords.push(coord);
			return oldCoord || coord;
		} else console.error("Couldn't parse coordinate", coordString);
	});

	const wire = new Wire(net, wireCoords);
	net.wires.push(wire);
	//wires.push(wire);

	return wire;
});

const instanceToTikzMap = new Map([
	["GROUND", "tlground"], // ads_rflib
	["R", "R"], // ads_rflib
	["C", "C"], // ads_rflib
	["V_AC", "sV"], // ads_simulation
]);

/** @type {Component[]} */
const components = InstanceArray.map((instanceXml) => {
	/** @type {Map<string,string>} */
	const attributes = new Map(
		Array.prototype.map.call(instanceXml.attributes, (attribute) => [attribute.name, attribute.value || null])
	);
	const libraryName = instanceXml.getAttribute("libraryName") || "";
	const cellName = instanceXml.getAttribute("cellName") || "";
	//const tikzComponentName = instanceToTikzMap.get(libraryName + ":" + cellName) || instanceToTikzMap.get(cellName);
	const componentStencil = ADS_COMPONENTS_MAP.get(libraryName + ":" + cellName) || ADS_COMPONENTS_MAP.get(cellName);
	if (!componentStencil)
		//throw new Error('Can not map component "' + libraryName + ":" + cellName + '"');
		return null;

	const instanceName = instanceXml.getAttribute("instanceName") || ""; // R1 etc
	//const parametersXml = instanceXml.getElementsByTagName("abl:Parameters")[0]?.getAttribute("name") || "gnd!";

	const parameters = new Map(
		Array.prototype.filter
			.call(
				instanceXml.getElementsByTagName("abl:Parameters")?.[0]?.childNodes || [],
				(param) => param.getAttribute && param.getAttribute("visible") == "true"
			)
			.map((param) => [param.getAttribute("name"), param.getAttribute("value")])
	);

	// <abl:PlacementTransform x="1.50000" y="-0.12500" angle="0.00000" xScale="1.00000" yScale="1.00000" mirrorX="false" mirrorY="false"/>
	const placementXml = instanceXml.getElementsByTagName("abl:PlacementTransform")[0];

	const placement = {
		x: parseFloat(placementXml?.getAttribute("x")) || 0,
		y: parseFloat(placementXml?.getAttribute("y")) || 0,
		angle: -parseFloat(placementXml?.getAttribute("angle")) || 0, // ADS: clock wise; tikz/math: counter clock wise
		xScale: parseFloat(placementXml?.getAttribute("xScale")) || 1,
		yScale: parseFloat(placementXml?.getAttribute("yScale")) || 1,
		mirrorX: placementXml?.getAttribute("mirrorX") == "true" || false,
		mirrorY: placementXml?.getAttribute("mirrorY") == "true" || false,
		scaling: scale,
	};

	const pinsXml = Array.prototype.filter.call(
		instanceXml.getElementsByTagName("abl:InstPins")[0].childNodes,
		(node) => node.localName && node.localName.toLowerCase() == "instpin"
	);

	const pins = pinsXml.map((pinXml) => {
		const instTermNumber = Number.parseInt(pinXml.getAttribute("instTermNumber")) || 0;
		const pinName = pinXml.getAttribute("pinName") || "";
		const netName = pinXml.getElementsByTagName("abl:Net")?.[0]?.getAttribute("name") || "";
		let net = nets.get(netName);
		if (!net) nets.set(netName, (net = new Net(netName)));

		return new Pin(null, pinName, instTermNumber, net);
	});

	return componentStencil.cloneToPosition(
		libraryName,
		cellName,
		instanceName,
		attributes,
		pins,
		placement,
		wires,
		nets,
		coords
	);
}).filter((component) => !!component); // Filter nulls

console.log("\\begin{tikzpicture}");
console.log(wires.map((wire) => wire.serialize(1)).join("\n") + "\n");
console.log(components.map((component) => component.serialize(1)).join("\n"));
console.log("\\end{tikzpicture}\n");

debugger;
