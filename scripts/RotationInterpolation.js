import { Interpolation, InterpolationHelper } from 'http://localhost:8000/scripts/Interpolation.js';

const { LibraryHandler, ProjectHandler, THREE } = window.DigitalBacon;

const workingEuler = new THREE.Euler();
const workingQuaternions = [new THREE.Quaternion(), new THREE.Quaternion()];

export default class RotationInterpolation extends Interpolation {
    constructor(params = {}) {
        params['assetId'] = RotationInterpolation.assetId;
        super(params);
    }

    _getDefaultName() {
        return RotationInterpolation.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        //params['something'] = this._something;
        return params;
    }

    getValue(time, nextKeyframe) {
        let value = super.getValue(time, nextKeyframe);
        if(!value) return value;

        workingEuler.fromArray(value);
        workingQuaternions[0].setFromEuler(workingEuler);

        this._keyframe._animationPath.object.getWorldQuaternion(
            workingQuaternions[1]).multiply(workingQuaternions[0]);
        workingEuler.setFromQuaternion(workingQuaternions[1]);

        return workingEuler.toArray();
    }

    _getLinearValue(time, nextKeyframe) {
        workingQuaternions[0].slerpQuaternions(this._keyframe.object.quaternion,
            nextKeyframe.object.quaternion, time).normalize();
        workingEuler.setFromQuaternion(workingQuaternions[0]);

        return workingEuler.toArray();
    }

    _getStepValue(time, nextKeyframe) {
        if(time < 1)
            return this._keyframe['rotation'];
        return nextKeyframe['rotation'];
    }

    static assetId = 'c8d59d21-88f1-4431-aefc-614b9ab58433';
    static assetName = 'Rotation Interpolation';
    static isPrivate = true;
}

ProjectHandler.registerAsset(RotationInterpolation);
LibraryHandler.loadPrivate(RotationInterpolation);
