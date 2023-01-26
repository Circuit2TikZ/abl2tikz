/**
 * 
 * @param {string} netname 
 * @param {Wire[]} wires 
 * @param {*} pins 
 */
const Net = function(netname, wires=[], pins=[]) {
	this.netname = netname;
	this.wires = wires || [];
	this.pins = pins || [];
};

export { Net };