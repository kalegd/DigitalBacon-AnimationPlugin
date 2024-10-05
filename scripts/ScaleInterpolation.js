import { Interpolation, InterpolationHelper } from 'http://localhost:8000/scripts/Interpolation.js';

const { LibraryHandler, ProjectHandler, THREE } = window.DigitalBacon;

const workingVector3s = [new THREE.Vector3(), new THREE.Vector3()];

export default class ScaleInterpolation extends Interpolation {
    constructor(params = {}) {
        params['assetId'] = ScaleInterpolation.assetId;
        super(params);
    }

    _getDefaultName() {
        return ScaleInterpolation.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        //params['something'] = this._something;
        return params;
    }

    getValue(time, nextKeyframe) {
        let value = super.getValue(time, nextKeyframe);
        if(!value) return value;
        workingVector3s[0].fromArray(value);
        this._keyframe._animationPath.object.getWorldScale(workingVector3s[1]);
        workingVector3s[0].multiply(workingVector3s[1]);
        return workingVector3s[0].toArray();
    }

    _getLinearValue(time, nextKeyframe) {
        let interpolationFactor = (time - this._keyframe.time)
            / (nextKeyframe.time - this._keyframe.time);

        workingVector3s[0].copy(nextKeyframe.object.scale)
            .sub(this._keyframe.object.scale)
            .multiplyScalar(interpolationFactor)
            .add(this._keyframe.object.scale);
        return workingVector3s[0].toArray();
    }

    _getStepValue(time, nextKeyframe) {
        if(time < nextKeyframe.time)
            return this._keyframe['scale'];
        return nextKeyframe['scale'];
    }

    static assetId = 'ede2dc59-168a-4753-be2d-62530fcf7d67';
    static assetName = 'Scale Interpolation';
    static isPrivate = true;
}

ProjectHandler.registerAsset(ScaleInterpolation);
LibraryHandler.loadPrivate(ScaleInterpolation);
