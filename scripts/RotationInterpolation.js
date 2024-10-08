import { Interpolation, InterpolationHelper } from 'http://localhost:8000/scripts/Interpolation.js';

const { EditorHelpers, LibraryHandler, ProjectHandler, THREE } = window.DigitalBacon;
const { EditorHelperFactory } = EditorHelpers;
const { CheckboxField, NumberField } = InterpolationHelper.FieldTypes;

const workingEuler = new THREE.Euler();
const workingQuaternions = [new THREE.Quaternion(), new THREE.Quaternion()];

export default class RotationInterpolation extends Interpolation {
    constructor(params = {}) {
        params['assetId'] = RotationInterpolation.assetId;
        super(params);
        this._useLongPath = params['useLongPath'] || false;
        this._revolutions = params['revolutions'] || 0;
    }

    _getDefaultName() {
        return RotationInterpolation.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['useLongPath'] = this._useLongPath;
        params['revolutions'] = this._revolutions;
        return params;
    }

    get useLongPath() { return this._useLongPath; }
    get revolutions() { return this._revolutions; }

    set useLongPath(useLongPath) { this._useLongPath = useLongPath; }
    set revolutions(revolutions) { this._revolutions = revolutions; }

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
        workingQuaternions[0].fromArray(this._slerpQuaternions(
            this._keyframe.object.quaternion, nextKeyframe.object.quaternion,
            time));

        workingQuaternions[0].normalize();
        workingEuler.setFromQuaternion(workingQuaternions[0]);

        return workingEuler.toArray();
    }

    _slerpQuaternions(quat1, quat2, time) {
        let A = quat1.normalize().toArray();
        let B = quat2.normalize().toArray();

        let dot = A[0] * B[0] + A[1] * B[1] + A[2] * B[2] + A[3] * B[3];

        let sign = dot < 0 ? -1 : 1;
        if(this._revolutions % 2 == 1) sign *= -1;
        let adjustedB = sign === -1 ? [-B[0], -B[1], -B[2], -B[3]] : B;

        // Calculate the angle between the quaternions
        let angle = Math.acos(dot);

        let totalAngle = angle;
        if(this._revolutions) {
            totalAngle = (this._revolutions % 2 == 0)
                ? this._revolutions * Math.PI + angle
                : -this._revolutions * Math.PI - angle;
        }

        // Calculate the sine of the angle for the coefficients
        let sinTotalAngle = Math.sin(totalAngle);
        if (Math.abs(sinTotalAngle) < 1e-6) {
            // If totalAngle is very small, we return A directly
            return A;
        }
        let coeffA = Math.sin((1 - time) * totalAngle);
        let coeffB = Math.sin(time * totalAngle);

        return [
            coeffA * A[0] + coeffB * adjustedB[0],
            coeffA * A[1] + coeffB * adjustedB[1],
            coeffA * A[2] + coeffB * adjustedB[2],
            coeffA * A[3] + coeffB * adjustedB[3],
        ];
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

class RotationInterpolationHelper extends InterpolationHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        "type",
        "easing",
        { "parameter": "useLongPath", "name": "Long Path",
            "type": CheckboxField },
        { "parameter": "revolutions", "name": "Revolutions",
            "min": 0, "type": NumberField },
    ];
}

EditorHelperFactory.registerEditorHelper(RotationInterpolationHelper,
    RotationInterpolation);
