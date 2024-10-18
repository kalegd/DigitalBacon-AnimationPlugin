import ControlPoint from 'http://localhost:8000/scripts/ControlPoint.js';
import { Interpolation, InterpolationHelper } from 'http://localhost:8000/scripts/Interpolation.js';

const { EditorHelpers, LibraryHandler, ProjectHandler, THREE, isEditor } = window.DigitalBacon;
const { EditorHelperFactory } = EditorHelpers;
const { AssetSetField, EnumField } = InterpolationHelper.FieldTypes;

const CURVE_TYPES = {
    Line: 'line',
    Bezier: 'bezier',
    Spline: 'spline',
};
const workingVector3 = new THREE.Vector3();
var material;

export default class PositionInterpolation extends Interpolation {
    constructor(params = {}) {
        params['assetId'] = PositionInterpolation.assetId;
        super(params);
        this._curveType = params['curveType'] || 'line';
        this._controlPoints = [];
        if(params['controlPoints']) {
            this.controlPoints = params['controlPoints'];
        } else {
            this.updateCurve();
        }
    }

    _getDefaultName() {
        return PositionInterpolation.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['controlPoints'] = this.controlPoints;
        params['curveType'] = this.curveType;
        return params;
    }

    registerKeyframe(keyframe) {
        super.registerKeyframe(keyframe);
        for(let controlPoint of this._controlPoints) {
            controlPoint.registerInterpolation(this);
        }
        this.updateCurve();
    }

    getValue(time, nextKeyframe) {
        let value = super.getValue(time, nextKeyframe);
        if(!value) return value;
        workingVector3.fromArray(value);
        this._keyframe._animationPath.object.localToWorld(workingVector3);
        return workingVector3.toArray();
    }

    _getLinearValue(time, nextKeyframe) {
        if(this._curveType == 'line' || this._controlPoints.length == 0
                || time < 0 || time > 1 || !this._curve) {
            workingVector3.copy(nextKeyframe.object.position)
                .sub(this._keyframe.object.position)
                .multiplyScalar(time)
                .add(this._keyframe.object.position);
        } else {
            this._curve.getPointAt(time, workingVector3);
        }
        return workingVector3.toArray();
    }

    _getStepValue(time, nextKeyframe) {
        if(time < 1)
            return this._keyframe['position'];
        return nextKeyframe['position'];
    }

    get controlPoints() {
        let controlPointIds = [];
        for(let controlPoint of this._controlPoints) {
            controlPointIds.push(controlPoint.id);
        }
        return controlPointIds;
    }
    get curveType() { return this._curveType; }

    set controlPoints(controlPoints) {
        for(let controlPointId of controlPoints) {
            this.addControlPoint(controlPointId);
        }
    }

    set curveType(curveType) {
        this._curveType = curveType;
        this.updateCurve();
        window.pi = this;
    }

    addControlPoint(controlPointId) {
        let controlPoint = ProjectHandler.getAsset(controlPointId);
        if(!controlPoint) return;
        this._controlPoints.push(controlPoint);
        controlPoint.registerInterpolation(this);
        this.updateCurve();
    }

    removeControlPoint(controlPointId) {
        this._controlPoints.push(controlPointId);
        let controlPoint = ProjectHandler.getAsset(controlPointId);
        if(!controlPoint) return;
        let index = this._controlPoints.indexOf(controlPoint);
        if(index >= 0) this._controlPoints.splice(index, 1);
        this.updateCurve();
    }

    updateCurve() {
        let curve;
        let nextKeyframe = this._keyframe?._animationPath?.getNextKeyframeFor
            ?.('position', this._keyframe);
        let controlPointsQuantity = this._controlPoints.length;
        if(this._curveObject)
            this._curveObject.parent.remove(this._curveObject);
        if(!nextKeyframe) return;
        if(this._curveType == 'line' || controlPointsQuantity == 0) {
            this._curve = new THREE.LineCurve3(this._keyframe.object.position,
                nextKeyframe.object.position);
        } else if(this._curveType == 'bezier') {
            if(controlPointsQuantity == 1) {
                this._curve = new THREE.QuadraticBezierCurve3(
                    this._keyframe.object.position,
                    this._controlPoints[0].object.position,
                    nextKeyframe.object.position);
            } else {
                this._curve = new THREE.CubicBezierCurve3(
                    this._keyframe.object.position,
                    this._controlPoints[0].object.position,
                    this._controlPoints[1].object.position,
                    nextKeyframe.object.position);
            }
        } else if(this._curveType == 'spline') {
            let positions = [this._keyframe.object.position];
            for(let controlPoint of this._controlPoints) {
                positions.push(controlPoint.object.position);
            }
            positions.push(nextKeyframe.object.position);
            this._curve = new THREE.CatmullRomCurve3(positions);
        }
        if(!isEditor()) return;
        let points = this._curve.getPoints(50);
        let geometry = new THREE.BufferGeometry().setFromPoints(points);
        if(!material) material = new THREE.LineDashedMaterial({
            color: 0xffff00,
        });
        this._curveObject = new THREE.Line(geometry, material);
        this._keyframe._animationPath.object.add(this._curveObject);
    }

    static assetId = '3dcb0b91-80fc-4aaf-aac4-a991521c906c';
    static assetName = 'Position Interpolation';
    static isPrivate = true;
}

ProjectHandler.registerAsset(PositionInterpolation);
LibraryHandler.loadPrivate(PositionInterpolation);

class PositionInterpolationHelper extends InterpolationHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        "type",
        "easing",
        { "parameter": "curveType", "name": "Curve Type",
            "map": CURVE_TYPES, "type": EnumField },
        { "parameter": "controlPoints", "name": "Control Points",
            "addFunction": "addControlPoint",
            "removeFunction": "removeControlPoint",
            "newOptionsFunction": ()=>[ControlPoint.assetId],
            "type": AssetSetField },
    ];
}

EditorHelperFactory.registerEditorHelper(PositionInterpolationHelper,
    PositionInterpolation);
