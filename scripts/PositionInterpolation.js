import { Interpolation, InterpolationHelper } from 'http://localhost:8000/scripts/Interpolation.js';

const { LibraryHandler, ProjectHandler, THREE } = window.DigitalBacon;

const workingVector3 = new THREE.Vector3();

export default class PositionInterpolation extends Interpolation {
    constructor(params = {}) {
        params['assetId'] = PositionInterpolation.assetId;
        super(params);
    }

    _getDefaultName() {
        return PositionInterpolation.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        //params['something'] = this._something;
        return params;
    }

    getValue(time, nextKeyframe) {
        let value = super.getValue(time, nextKeyframe);
        if(!value) return value;
        workingVector3.fromArray(value);
        this._keyframe._animationPath.object.localToWorld(workingVector3);
        return workingVector3.toArray();
    }

    _getLinearValue(time, nextKeyframe) {
        let interpolationFactor = (time - this._keyframe.time)
            / (nextKeyframe.time - this._keyframe.time);

        workingVector3.copy(nextKeyframe.object.position)
            .sub(this._keyframe.object.position)
            .multiplyScalar(interpolationFactor)
            .add(this._keyframe.object.position);
        return workingVector3.toArray();
    }

    _getStepValue(time, nextKeyframe) {
        if(time < nextKeyframe.time)
            return this._keyframe['position'];
        return nextKeyframe['position'];
    }

    static assetId = '3dcb0b91-80fc-4aaf-aac4-a991521c906c';
    static assetName = 'Position Interpolation';
    static isPrivate = true;
}

ProjectHandler.registerAsset(PositionInterpolation);
LibraryHandler.loadPrivate(PositionInterpolation);
