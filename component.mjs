/**
 * Base class for all TikZ components.
 *
 * @property {number} angle - the angle to rotate the component
 * @property {boolean} mirrorX - true to mirror on x axis
 * @property {boolean} mirrorY - true to mirror on y axis
 *
 * @property {{}} [values] - a list of values to display
 */
class Component {
	angle;
	mirrorX;
	mirrorY;

	values = {};

	/**
	 * For use in subclasses only.
	 *
	 * @param {number} [angle=0] - the angle to rotate the component
	 * @param {boolean} [mirrorX=false] - true to mirror on x axis
	 * @param {boolean} [mirrorY=false] - true to mirror on y axis
	 */
	constructor(angle = 0, mirrorX = false, mirrorY = false) {
		this.angle = angle || 0;
		this.mirrorX = mirrorX;
		this.mirrorY = mirrorY;
	}
}

export { Component };
