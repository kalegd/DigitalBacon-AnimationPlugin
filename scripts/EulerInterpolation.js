import { Interpolation, InterpolationHelper } from 'http://localhost:8000/scripts/Interpolation.js';

const { LibraryHandler, ProjectHandler, THREE } = window.DigitalBacon;

const workingEuler = new THREE.Euler();
const workingQuaternions = [new THREE.Quaternion(), new THREE.Quaternion()];

export default class EulerInterpolation extends Interpolation {
    constructor(params = {}) {
        params['assetId'] = EulerInterpolation.assetId;
        super(params);
    }

    _getDefaultName() {
        return EulerInterpolation.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        //params['something'] = this._something;
        return params;
    }

    _getLinearValue(time, nextKeyframe) {
        let interpolationFactor = (time - this._keyframe.time)
            / (nextKeyframe.time - this._keyframe.time);

        workingEulers[0].fromArray(this._keyframe[this._parameter]);
        workingEulers[1].fromArray(nextKeyframe[this._parameter]);
        workingQuaternions[0].setFromEuler(workingEulers[0]);
        workingQuaternions[1].setFromEuler(workingEulers[1]);
        workingQuaternions[0].slerp(workingQuaternions[1], interpolationFactor);
        workingEulers[0].setFromQuaternion(workingQuaternions[0]);

        return workingEulers[0].toArray();
    }

    static assetId = 'c8d59d21-88f1-4431-aefc-614b9ab58433';
    static assetName = 'Euler Interpolation';
    static isPrivate = true;
}

ProjectHandler.registerAsset(EulerInterpolation);
LibraryHandler.loadPrivate(EulerInterpolation);
