/**
 * Parses an string and converts it to siunitx syntax.
 *
 * E.g. "1k1Ohm" --> "\si{1.1}{\kilo\ohm}}". If a value can't be parsed, its original value is returned.
 *
 * @param {string} str - the string to parse
 * @param {string} [suggestedUnit] - unit to use if `str` does not contain a unit
 * @param {string} [forceUnit] - overwrites any foud unit
 * @returns {string}
 */
function atoLaTex(str, suggestedUnit, forceUnit) {
	const regex = /^\s*(\d*)\s*([a-zA-Z\,\.]?)\s*(\d+)\s*([a-zA-Z]*)\s*$/;
	const SI_UNIT_MAP = [
		["A", "\\ampere"],
		["Ampere", "\\ampere"],
		["C", "\\coulomb"],
		["Coulomb", "\\coulomb"],
		["F", "\\farad"],
		["Farad", "\\farad"],
		["Hz", "\\hertz"],
		["Hertz", "\\hertz"],
		["H", "\\henry"],
		["Henry", "\\henry"],
		["Ω", "\\ohm"],
		["Ohm", "\\ohm"],
		["S", "\\siemens"],
		["Siemens", "\\siemens"],
		//["T", "\\tesla"],	// could also mean tera
		["Tesla", "\\tesla"],
		["V", "\\volt"],
		["Volt", "\\volt"],
		["W", "\\watt"],
		["Watt", "\\watt"],
	];
	const SI_PREFIX_MAP = [
		["f", "\\femto"],
		["p", "\\pico"],
		["n", "\\nano"],
		["µ", "\\micro"],
		["u", "\\micro"],
		["m", "\\milli"],

		["K", "\\kilo"],
		["k", "\\kilo"],
		["M", "\\mega"],
		["G", "\\giga"],
		["T", "\\tera"],
	];

	let num = Number(str);
	let unit = "";

	if (Number.isNaN(num)) {
		// not just a number --> parse with regex
		const result = regex.exec(str);
		if (!result) return str;

		const fullDigits = result[1] || "0";
		const delimiterOrUnit = result[2];
		const decimalPlaces = result[3] || "0";
		const maybeUnit = result[4];

		if (delimiterOrUnit) num = Number(fullDigits + "." + decimalPlaces);
		else num = Number(decimalPlaces);

		// units
		if (delimiterOrUnit && [",", "."].includes(delimiterOrUnit)) unit = maybeUnit; // "1.1 kOhm" --> 1.1 "kOhm"
		else unit = delimiterOrUnit + maybeUnit; // "1k1 Ohm" --> 1.1 "kOhm"; "3 Ohm" --> 3 "Ohm"
	}

	unit = forceUnit ? forceUnit : unit || suggestedUnit || "";

	// parse unit
	let siunitxUnit = "";
	for (let unitMatch = []; unitMatch && unit.length > 0; ) {
		unitMatch = SI_UNIT_MAP.find(([key, _val]) => unit.endsWith(key));
		if (unitMatch) {
			const [key, val] = unitMatch;
			siunitxUnit = val + siunitxUnit;

			// remove found item
			unit = unit.slice(0, -key.length);
		}
	}

	for (let prefixMatch = []; prefixMatch && unit.length > 0; ) {
		prefixMatch = SI_PREFIX_MAP.find(([key, _val]) => unit.endsWith(key));
		if (prefixMatch) {
			const [key, val] = prefixMatch;
			siunitxUnit = val + siunitxUnit;

			// remove found item
			unit = unit.slice(0, -key.length);
		}
	}

	if (unit.length > 0) return str; // could not fully parse unit

	if (siunitxUnit) return "\\si{" + num + "}{" + siunitxUnit + "}";
	else return "\\qty{" + num + "}";
}

export { atoLaTex };
