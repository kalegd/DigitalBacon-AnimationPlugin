import { Interpolation, InterpolationHelper } from 'http://localhost:8000/scripts/Interpolation.js';

const { LibraryHandler, ProjectHandler } = window.DigitalBacon;

export default class NumberInterpolation extends Interpolation {
    constructor(params = {}) {
        params['assetId'] = NumberInterpolation.assetId;
        super(params);
    }

    _getDefaultName() {
        return NumberInterpolation.assetName;
    }

    _getLinearValue(time, nextKeyframe) {
        let interpolationFactor = (time - this._keyframe.time)
            / (nextKeyframe.time - this._keyframe.time);
        return (nextKeyframe[this._parameter] - this._keyframe[this._parameter])
            * interpolationFactor + this._keyframe[this._parameter];
    }

    static assetId = 'e89be085-ee97-4702-bf2c-01ec0505a694';
    static assetName = 'Number Interpolation';
    static isPrivate = true;
}

ProjectHandler.registerAsset(NumberInterpolation);
LibraryHandler.loadPrivate(NumberInterpolation);
