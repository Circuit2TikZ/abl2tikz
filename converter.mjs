import { readFile } from "node:fs";
import { promisify } from "node:util";

import { DOMParser } from "common-xml-features";

/**
 * @class Class for parsing a XML file and extracting a schematic.
 * This static class contains many helper functions to extract information from the file. The extracted node of the
 * schematic view can than be passed to `Schematic.fromXML`.
 */
class Converter {
	/**
	 * Parses a file using its file handle. The file will be completely read and a list of cells will be returned.
	 *
	 * The file won't be closed.
	 *
	 * @param {number} inFileDescriptor - the file descriptor for the file to parse, e.g. 0 for stdin
	 * @param {string} cellName - the name of the cell to parse
	 * @param {number} [scale=2.54] - factor for scaling; ADS uses inch, TikZ uses cm, thus scale=2.54 is recommended
	 * @returns {Element[]} an array of cells
	 * @throws {Error} if an expected xml-tag does not exist
	 */
	static async parseFile(inFileDescriptor) {
		const promisifiedRead = promisify(readFile);

		let buffer = await promisifiedRead(inFileDescriptor).then((buff) =>
			buff instanceof Buffer ? buff.toString("utf-8") : buff
		);

		/** @type {DOMParser} */
		const parser = new DOMParser();
		/** @type {XMLDocument} */
		let parsed;
		try {
			parsed = parser.parseFromString(buffer, "text/xml");
		} catch (_error) {
			throw new Error("Syntax error in XML file.");
		}
		/** @type {Element} */
		const ABLRoot = parsed.documentElement;
		this.assertTagFound(ABLRoot, "The XML root tag");
		const Library = this.getNamedTag(ABLRoot, "library");
		this.assertTagFound(Library, "library");
		const Cells = this.getNamedTag(Library, "cells");
		this.assertTagFound(Cells, "cells");

		const CellArray = this.getNamedTags(Cells, "cell");
		return CellArray;
	}

	/**
	 * Filters a list of cell nodes by name.
	 *
	 * @param {Element[]} cellArray - the array of cells obtained from {@link parseFile}
	 * @param {string} cellname - the name of the cell to parse or `""` to use the first one
	 * @throws {Error} - if cell was not found
	 * @returns {Element} the wanted cell node
	 */
	static findCell(cellArray, cellname) {
		let thisCell;
		if (cellname == "") {
			thisCell = cellArray[0];
			if (!thisCell) throw new Error("No cells found");
		} else {
			thisCell = cellArray.find((node) => node.getAttribute("name") == cellname);
			if (!thisCell) throw new Error('Cell "' + cellname + '" not found');
		}
		return thisCell;
	}

	/**
	 * Finds the `schematicview`s of a cell.
	 *
	 * @param {Element} cell - the cell node to find the schematics in
	 * @returns {Element[]} an array of `schematicview`s
	 */
	static getSchematicViews(cell) {
		const views = this.getNamedTag(cell, "views");
		if (!views) return [];
		const schematicViewArray = this.getNamedTags(
			views,
			"schematicview",
			(node) => node.getAttribute("type") == "schematic"
		);
		return schematicViewArray;
	}

	/**
	 * Find a specific schematic in a list.
	 *
	 * @param {Element[]} schematicViewArray - the list of nodes to search in
	 * @param {string} schematicViewName - the name of the schematic or `""` to use the first one
	 * @throws {Error} - if the desired schematic can not be found
	 * @returns {Element} the found node
	 */
	static findSchematicView(schematicViewArray, schematicViewName) {
		let thisSchematicView;
		if (schematicViewName == "") {
			thisSchematicView = schematicViewArray[0];
			if (!thisSchematicView) throw new Error("Error: No schematic found");
		} else {
			thisSchematicView = Array.prototype.find.call(
				schematicViewArray,
				(node) => node.getAttribute("name") == schematicViewName
			);
			if (!thisSchematicView) throw new Error('Error: Schematic "' + schematicViewName + '" not found');
		}
		return thisSchematicView;
	}

	/**
	 * Prints the names of found cells or schematics.
	 *
	 * @param {Element[]} schematicViewArray - the list of nodes to search in
	 * @param {string} [heading] - heading to print
	 */
	static printNodeList(schematicViewArray, heading) {
		if (schematicViewArray && schematicViewArray.length > 0) {
			if (heading) console.log(heading);
			schematicViewArray.forEach((node) => console.log(" - " + (node.getAttribute("name") || "- unnamed -")));
		} else console.log((heading || "") + "none found.");
	}

	//-- Helper functions
	/**
	 * Searches a child node by name and by an additional filter if present.
	 *
	 * @private
	 * @param {Element} root - the root node to find the child
	 * @param {string} tagName  the name of the xml tag to find
	 * @param {function(Element): boolean} [additionalFilter] - filter function returning true if node matches the criteria
	 * @returns {Element|null} the found node or null if not found
	 */
	static getNamedTag(root, tagName, additionalFilter) {
		return Array.prototype.find.call(
			/** @type {NodeList} */ root.childNodes,
			(node) =>
				node.nodeType === 1 && // node instanceof Element
				node.localName &&
				node.localName.toLowerCase() == tagName &&
				(!additionalFilter || additionalFilter(node))
		);
	}

	/**
	 * Filters child nodes by name and by an additional filter if present.
	 *
	 * @private
	 * @param {Element} root - the root node to find the children
	 * @param {string} tagName - the name of the xml tag to filter
	 * @param {function(Element): boolean} [additionalFilter] - filter function returning true if node matches the criteria
	 * @returns {Element[]} the filtered nodes (may be empty)
	 */
	static getNamedTags(root, tagName, additionalFilter) {
		return Array.prototype.filter.call(
			/** @type {NodeList} */ root.childNodes,
			(node) =>
				node.nodeType === 1 && // node instanceof Element
				node.localName &&
				node.localName.toLowerCase() == tagName &&
				(!additionalFilter || additionalFilter(node))
		);
	}

	/**
	 * Internal helper function for checking if a variable is correctly set.
	 *
	 * The message of the thrown error depends on the data type.
	 * If an variable is falsy (`null`, `undefined`, etc.) a error with the message "XML-Tag not found: \<tagname\>" is
	 * thrown. If the variable is an empty array, the message is instead "Filtered list of tags is empty: \<tagname\>".
	 *
	 * @param {*} variable - the variable to check
	 * @param {string} tagname - the name of the variable for the error message
	 * @throws {Error} the Error if `variable` is falsy or an empty array
	 */
	static assertTagFound(variable, tagname) {
		if (!variable) throw new Error("XML-Tag not found: " + tagname);
		else if (Array.isArray(variable) && variable.length === 0)
			throw new Error("Filtered list of tags is empty: " + tagname);
	}
}

export { Converter };
