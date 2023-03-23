import { Component } from "./component.mjs";

/**
 * Base class for node-style TikZ components.
 *
 * @class NodeComponent
 * @extends Component
 */
class NodeComponent extends Component {
	/**
	 * For use in subclasses only.
	 *
	 * @param {number} [angle=0] - the angle to rotate the component
	 * @param {boolean} [mirrorX=false] - true to mirror on x axis
	 * @param {boolean} [mirrorY=false] - true to mirror on y axis
	 */
	constructor(angle = 0, mirrorX = false, mirrorY = false) {
		super(angle, mirrorX, mirrorY);
	}

	/**
	 * Serializes a component. The TikZ "source code" is returned.
	 *
	 * @param {number} [indent=0] - the indention (= amount of tabs) to use
	 * @returns {string} the serislized component
	 */
	serialize(indent = 0) {
		return (
			"\t".repeat(indent) +
			"\\node[color=blue, " +
			this.tikzComponentName +
			(this.mirrorX ? ", yscale=-1" : "") +
			(this.mirrorY ? ", xscale=-1" : "") +
			(this.angle ? ", rotate=" + this.angle : "") +
			"] " +
			(this.nodeName ? "(" + this.nodeName + ") " : "") + // <-- nodeName can be a var or a getter of a subclass
			"at " +
			this.coord.serializeName() +
			" {" +
			(this.nodeText || "") +
			"};"
		);
	}
}

export { NodeComponent };
