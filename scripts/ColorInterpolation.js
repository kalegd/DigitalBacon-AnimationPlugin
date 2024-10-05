import { Interpolation, InterpolationHelper } from 'http://localhost:8000/scripts/Interpolation.js';

const { LibraryHandler, ProjectHandler } = window.DigitalBacon;

export default class ColorInterpolation extends Interpolation {
    constructor(params = {}) {
        params['assetId'] = ColorInterpolation.assetId;
        super(params);
    }

    _getDefaultName() {
        return ColorInterpolation.assetName;
    }

    _getLinearValue(time, nextKeyframe) {
        let interpolationFactor = (time - this._keyframe.time)
            / (nextKeyframe.time - this._keyframe.time);

        let {r:r1, g:g1, b:b1} =this._hexToRGB(this._keyframe[this._parameter]);
        let {r:r2, g:g2, b:b2} = this._hexToRGB(nextKeyframe[this._parameter]);

        let r = Math.round(r1 + (r2 - r1) * interpolationFactor);
        let g = Math.round(g1 + (g2 - g1) * interpolationFactor);
        let b = Math.round(b1 + (b2 - b1) * interpolationFactor);

        return this._rgbToHex(r, g, b);
    }

    _getStepValue(time, nextKeyframe) {
        if(time < nextKeyframe.time)
            return this._keyframe[this._parameter];
        return nextKeyframe[this._parameter];
    }

    _hexToRGB(hex) {
        let r = (hex >> 16) & 0xFF;
        let g = (hex >> 8) & 0xFF;
        let b = hex & 0xFF;
        return { r, g, b };
    }

    _rgbToHex(r, g, b) {
        return (r << 16) | (g << 8) | b;
    }

    static assetId = '2889a453-7a29-465f-9542-f8ad01156cb8';
    static assetName = 'Color Interpolation';
    static isPrivate = true;
}

ProjectHandler.registerAsset(ColorInterpolation);
LibraryHandler.loadPrivate(ColorInterpolation);
