import { Interpolation, InterpolationHelper } from 'http://localhost:8000/scripts/Interpolation.js';

const { LibraryHandler, ProjectHandler } = window.DigitalBacon;

export default class VectorInterpolation extends Interpolation {
    constructor(params = {}) {
        params['assetId'] = VectorInterpolation.assetId;
        super(params);
    }

    _getDefaultName() {
        return VectorInterpolation.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        //params['something'] = this._something;
        return params;
    }

    _getLinearValue(time, nextKeyframe) {
        let interpolationFactor = (time - this._keyframe.time)
            / (nextKeyframe.time - this._keyframe.time);

        let firstValue = this._keyframe[this._parameter].slice();
        let nextValue = nextKeyframe[this._parameter].slice();
        for(let i = 0; i < firstValue.length; i++) {
            firstValue[i] = (nextValue[i] - firstValue[i]) * interpolationFactor
                + firstValue[i];
        }
        return firstValue;
    }

    static assetId = '3dcb0b91-80fc-4aaf-aac4-a991521c906c';
    static assetName = 'Vector Interpolation';
    static isPrivate = true;
}

ProjectHandler.registerAsset(VectorInterpolation);
LibraryHandler.loadPrivate(VectorInterpolation);
