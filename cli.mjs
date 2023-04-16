#! /usr/bin/env node

import * as fs from "node:fs";
import { Writable as writeableStream } from "node:stream";
import { promisify } from "node:util";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { Converter } from "./converter.mjs";
import { Schematic } from "./schematic.mjs";

/**
 * @file CLI for converting files from Keysight ADS to CircuiTikZ.
 * This is the main file and kicks of the conversion or lists cell and schematic names using {@link Converter}.
 * The conversion generates a {@link Schematic}, which is then serialized.
 *
 * If the package is properly installed, you can use `abl2tikz <args>` in any directory to start.
 * Otherwise, `npm run abl2tikz <args>` or `node cli.mjs <args>` work on any system. On a UNIX system, you can shorten
 * this to `cli.mjs <args>`.
 *
 * Functions in this file are for internal use only.
 */

/**
 * Opens a file for reading.
 *
 * @param {string} filename - the path to the file
 * @throws {Error} - if the file does not exist or is not accessible
 * @returns {number} the file descriptor
 */
function strToInFile(filename) {
	if (filename && typeof filename === "string" && filename !== "-") {
		// normal filename
		try {
			return fs.openSync(filename, "r");
		} catch (err) {
			switch (err.code) {
				case "EACCES":
					throw new Error('Error: Access to file "' + filename + '" denied.');
				// case "EADDRINUSE":
				// case "ECONNREFUSED":
				// case "ECONNRESET":
				// case "EEXIST":
				case "EISDIR":
					throw new Error('Error: Expected file path but got directory: "' + filename + '".');
				case "EMFILE":
					throw new Error("Error: Too many open files.");
				case "ENOENT":
					throw new Error('Error: File "' + filename + '" does not exist.');
				// case "ENOTDIR":
				// case "ENOTEMPTY":
				// case "ENOTFOUND":
				// case "EPERM":
				case "EPIPE":
					throw new Error("Error: Broken pipe");
				//case "ETIMEDOUT":
				default:
					throw new Error("Error: Unknown error: " + err.code);
			}
		}
	} else if (filename && (filename === "-" || typeof filename === "boolean")) {
		// stdin
		return process.stdin.fd; // <-- should always be 0
	} else {
		// empty --> error
		throw new Error("Error: sourcefile must be a path to a file or - for stdin");
	}
}

/**
 * Opens a file for reading.
 *
 * @param {string} filename - the path to the file
 * @param {boolean} [overwrite=false] - set to true to overwrite existing files
 * @throws {Error} - if the file does not exist or is not accessible
 * @returns {number} the file descriptor
 */
function strToOutFile(filename, overwrite = false) {
	if (filename && typeof filename === "string" && filename !== "-") {
		// normal filename
		try {
			return fs.openSync(filename, overwrite ? "w" : "wx");
		} catch (err) {
			switch (err.code) {
				case "EACCES":
					throw new Error('Error: Access to file "' + filename + '" denied.');
				// case "EADDRINUSE":
				// case "ECONNREFUSED":
				// case "ECONNRESET":
				case "EEXIST":
					throw new Error('Error: Could not create file "' + filename + '".');
				case "EISDIR":
					throw new Error('Error: Expected file path but got directory: "' + filename + '".');
				case "EMFILE":
					throw new Error("Error: Too many open files.");
				// case "ENOENT":
				// case "ENOTDIR":
				// case "ENOTEMPTY":
				// case "ENOTFOUND":
				// case "EPERM":
				case "EPIPE":
					throw new Error("Error: Broken pipe");
				//case "ETIMEDOUT":
				default:
					throw new Error("Error: Unknown error: " + err.code);
			}
		}
	} else if (filename && (filename === "-" || typeof filename === "boolean")) {
		// stdin
		return process.stdout.fd; // <-- should always be 1
	} else {
		// empty --> error
		throw new Error("Error: targetfile must be a path to a file or - for stdout");
	}
}

/**
 * Closes an file descriptor ignoring any errors. This also works if a file is allready closed.
 * The stdin, stdout and stderr file descriptors won't be closed.
 *
 * @param {number} fd
 */
function closeFD(fd) {
	if (![process.stdin.fd, process.stdout.fd, process.stderr.fd].includes(fd)) fs.close(fd);
}

/**
 * Parses the opens file descriptor, closes the file and returns the array of cells.
 *
 * @param {number} fd - the input file descriptor
 * @returns {Promise<Element[]>} the array of cells
 */
function getCellArrayForInputFD(fd) {
	return Converter.parseFile(fd).then(
		// close FD on success & on fail
		(val) => {
			closeFD(fd);
			return val;
		},
		(err) => {
			closeFD(fd);
			return Promise.reject(err);
		}
	);
}

yargs(hideBin(process.argv))
	.usage("$0 <command> [args]")
	.command(
		"convert <source file> [target file]",
		"Converts a Keysight ADS schematic from the XML/ABL (Advanced Board Link) to an CircuiTikZ schematic (.pgf).",
		function convertArgumentBuilder(yargs) {
			yargs
				.option("cellname", {
					alias: "c",
					type: "string",
					description: "The name of the cell to use (source file)",
					default: "",
					defaultDescription: "(Empty): Use first cell in file",
				})
				.option("schematicname", {
					alias: "s",
					type: "string",
					description: "The name of the schematic of the cell (source file)",
					default: "",
					defaultDescription: "(Empty): Use schematic in cell",
				})
				.option("force", {
					alias: "f",
					boolean: true,
					description: "Overwrite target file, if existing",
					default: false,
				})
				.positional("sourcefile", {
					describe: "The ABL/XML source file; - for stdin",
					coerce: strToInFile,
				})
				.positional("targetfile", {
					describe: "The CircuiTikZ/PGF target file",
					default: "-",
					defaultDescription: "Defaults to stdout",
					demandOption: false,
				})
				.check((options) => {
					// converting to file only here possible
					// coerce:     can't access other flags like options.force
					// middleware: can't throw error and show help
					options.targetfile = strToOutFile(options.targetfile, options.force);
					return true;
				}, false);
		},
		function convert(args) {
			getCellArrayForInputFD(args.sourcefile)
				.then((cellArray) => Converter.findCell(cellArray, args.cellname))
				.then((cell) => Converter.findSchematicView(Converter.getSchematicViews(cell), args.schematicname))
				.then((schematic) => Schematic.fromXML(schematic))
				.then((schematic) => {
					/** @type {writeableStream} */
					let writeStream;
					switch (args.targetfile) {
						case process.stdout.fd:
							writeStream = process.stdout;
							break;
						case process.stderr.fd:
							writeStream = process.stderr;
							break;

						default:
							writeStream = fs.createWriteStream(null, {
								encoding: "utf-8",
								autoClose: true,
								emitClose: true,
								fd: args.targetfile,
							});
							break;
					}
					return schematic
						.printToStream(writeStream)
						.then(() => promisify(writeStream.end).call(writeStream));
				})
				.catch((error) => console.error("Error: " + (error ? error.message || error : "unknown error")));
		}
	)
	.command(
		"list-cells <source file>",
		"List all cells in an ABL/XML source file",
		function listCellsArgumentBuilder(yargs) {
			yargs.positional("sourcefile", {
				describe: "The ABL/XML source file; - for stdin",
				coerce: strToInFile,
			});
		},
		function listCells(args) {
			getCellArrayForInputFD(args.sourcefile)
				.then((cells) => Converter.printNodeList(cells), "Cells: ")
				.catch((error) => console.error("Error: " + (error ? error.message || error : "unknown error")));
		}
	)
	.command(
		"list-schematics [(-c|--cellname) <cellname>] <source file>",
		"List all schematics of a selected cell in an ABL/XML source file",
		function listSchematicsArgumentBuilder(yargs) {
			yargs
				.option("cellname", {
					alias: "c",
					type: "string",
					description: "The name of the cell to use (source file)",
					default: "",
					defaultDescription: "(Empty): Use first cell in file",
				})
				.positional("sourcefile", {
					describe: "The ABL/XML source file; - for stdin",
					coerce: strToInFile,
				});
		},
		function listSchematics(args) {
			const cellArrayPromise = getCellArrayForInputFD(args.sourcefile);
			let printPromise;
			if (args.cellname) {
				// only one cell
				printPromise = cellArrayPromise
					.then((cellArray) => Converter.findCell(cellArray, args.cellname))
					.then((cell) => Converter.getSchematicViews(cell))
					.then((cell) => Converter.printNodeList(cell, "Schematics:"));
			} else {
				// all cells --> promise chain
				printPromise = cellArrayPromise.then((cells) =>
					cells.reduce((promise, cell) => {
						/** @type {string|undefined} */
						let cellName;
						if (cell && cell.getAttribute && (cellName = cell.getAttribute("name"))) {
							// is cell with non-empty name --> append to chain
							return promise.then(() => {
								const schematicViews = Converter.getSchematicViews(cell);
								Converter.printNodeList(schematicViews, "Schematics of " + cellName + ":");
							});
						} else return promise;
					}, Promise.resolve())
				);
			}
			printPromise.catch((error) =>
				console.error("Error: " + (error ? error.message || error : "unknown error"))
			);
		}
	)
	.demandCommand(1, 1, "Error: No command given", "Error: Only one command is allowed")
	.strict(true)
	.help(true).argv;
