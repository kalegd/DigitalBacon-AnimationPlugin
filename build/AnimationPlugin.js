const { Assets: Assets$4, DigitalBaconUI, ProjectHandler: ProjectHandler$c, THREE: THREE$7, dynamicAssets, getMenuController: getMenuController$2, isEditor: isEditor$4 } = window.DigitalBacon;
const { CustomAssetEntity: CustomAssetEntity$3 } = Assets$4;

const vector3s$1 = [new THREE$7.Vector3(), new THREE$7.Vector3()];
const ANIMATION_PATH_ID = '2d227485-0b34-40a4-873d-2a0782d034c6';
const hoveredButtonStyle = new DigitalBaconUI.Style({ materialColor: 0x63666b});

class AnimationController extends CustomAssetEntity$3 {
    constructor(params = {}) {
        params['assetId'] = AnimationController.assetId;
        super(params);
        if(!isEditor$4()) return;
        this._createMesh();
        this._speed = 1;
    }

    _getDefaultName() {
        return AnimationController.assetName;
    }

    _createMesh() {
        let body = new DigitalBaconUI.Body({
            height: 0.3,
            materialColor: 0x000000,
            width: 0.45,
        });
        let startButton = new DigitalBaconUI.Div({
            backgroundVisible: true,
            borderRadius: 0.01,
            height: 0.035,
            justifyContent: 'center',
            materialColor: 0x969696,
            width: 0.3,
        });
        let startText = new DigitalBaconUI.Text('Start Preview', {
            color: 0xffffff,
            fontSize: 0.019,
        });
        let seekRow = this._createNumberRow('Seek', (text) => {
            let assets = ProjectHandler$c.getAssets();
            let value = Number.parseFloat(text);
            for(let id in assets) {
                if(assets[id].assetId == ANIMATION_PATH_ID)
                    assets[id]._setTime(value);
            }
        });
        let speedRow = this._createNumberRow('Speed', (text) => {
            ProjectHandler$c.getAssets();
            let value = Number.parseFloat(text);
            this._speed = value || 1;
        });
        startButton.add(startText);
        body.add(startButton);
        body.add(seekRow);
        body.add(speedRow);
        this._object.add(body);
        startButton.onClickAndTouch = () => this._startPreview();
        startButton.pointerInteractable.addHoveredCallback((hovered) => {
            if(hovered) {
                startButton.addStyle(hoveredButtonStyle);
            } else {
                startButton.removeStyle(hoveredButtonStyle);
            }
        });
    }

    _createNumberRow(title, onChange) {
        let row = new DigitalBaconUI.Span();
        let label = new DigitalBaconUI.Text(title, {
            color: 0xffffff,
            fontSize: 0.019,
        });
        let numberInput = new DigitalBaconUI.NumberInput({
            fontSize: 0.019,
            height: 0.03,
            width: 0.17,
        });
        numberInput.onChange = onChange;
        numberInput.onEnter = () => numberInput.blur();
        row.add(label);
        row.add(numberInput);
        return row;
    }

    setPositionFromMenu() {
        let menuController = getMenuController$2();
        menuController.getPosition(vector3s$1[0]);
        menuController.getDirection(vector3s$1[1]).normalize()
            .divideScalar(4);
        vector3s$1[0].sub(vector3s$1[1]).roundWithPrecision(5);
        let position = vector3s$1[0].toArray();
        this.position = position;
        this.parent.object.worldToLocal(this.object.position);
    }

    registerAnimationPathClass(animationPathClass) {
        this._animationPathClass = animationPathClass;
    }

    _startPreview() {
        let assets = ProjectHandler$c.getAssets();
        this._pathAssets = [];
        this._maxTime = 0;
        for(let id in assets) {
            if(assets[id].assetId == ANIMATION_PATH_ID) {
                this._pathAssets.push(assets[id]);
                this._maxTime = Math.max(this._maxTime, assets[id]._maxTime);
            }
        }
        if(this._pathAssets.length == 0) return;
        this._time = 0;
        this._reverse = false;
        dynamicAssets.add(this);
    }

    update(timeDelta) {
        this._time += this._speed * ((this._reverse) ? -timeDelta : timeDelta);
        if(this._time > this._maxTime) {
            this._reverse = true;
        } else if(this._time < 0) {
            this._time = 0;
        }
        for(let asset of this._pathAssets) {
            asset._setTime(this._time);
        }
        if(this._time == 0) {
            dynamicAssets.delete(this);
        }
    }

    static assetId = 'd4706106-d21d-4933-a665-6c5f3b6cb383';
    static assetName = 'Animation Controller';
    static isPrivate = true;
}

const { Assets: Assets$3, EditorHelpers: EditorHelpers$7 } = window.DigitalBacon;
const { CustomAsset } = Assets$3;
const { CustomAssetHelper, EditorHelperFactory: EditorHelperFactory$7 } = EditorHelpers$7;
const { EnumField: EnumField$1 } = CustomAssetHelper.FieldTypes;

const INTERPOLATION_TYPES = {
    Linear: 'linear',
    //Bezier: 'cubic-bezier',
    Sinusoidal: 'sinusoidal',
    Quadratic: 'quadratic',
    Cubic: 'cubic',
    Quartic: 'quartic',
    Quintic: 'quintic',
    Exponential: 'exponential',
    Circular: 'circular',
    Back: 'back',
    Bounce: 'bounce',
    Elastic: 'elastic',
    Step: 'step',
};
const EASING_TYPES = {
    'Ease In': 'easeIn',
    'Ease Out': 'easeOut',
    'Ease In & Out': 'easeInOut',
};

class Interpolation extends CustomAsset {
    constructor(params = {}) {
        super(params);
        this._parameter = params['parameter'];
        this._type = params['type'] || 'linear';
        this._easing = params['easing'] || 'easeInOut';
    }

    _getDefaultName() {
        return Interpolation.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['parameter'] = this._parameter;
        params['type'] = this._type;
        params['easing'] = this._easing;
        return params;
    }

    get parameter() { return this._parameter; }
    get type() { return this._type; }
    get easing() { return this._easing; }

    set parameter(parameter) { this._parameter = parameter; }
    set type(type) { this._type = type; }
    set easing(easing) { this._easing = easing; }

    registerKeyframe(keyframe) {
        this._keyframe = keyframe;
    }

    getValue(time, nextKeyframe) {
        if(!this._keyframe) {
            return;
        } else if(!nextKeyframe || time <= this._keyframe.time) {
            return this._keyframe[this._parameter];
        } else if(time >= nextKeyframe.time) {
            return nextKeyframe[this._parameter];
        }
        let normalizedTime = (time - this._keyframe.time)
            / (nextKeyframe.time - this._keyframe.time);
        if(this._type == 'sinusoidal') {
            normalizedTime = this._getSinusoidalTime(normalizedTime);
        } else if(this._type == 'quadratic') {
            normalizedTime = this._getPolynomialTime(normalizedTime, 2);
        } else if(this._type == 'cubic') {
            normalizedTime = this._getPolynomialTime(normalizedTime, 3);
        } else if(this._type == 'quartic') {
            normalizedTime = this._getPolynomialTime(normalizedTime, 4);
        } else if(this._type == 'quintic') {
            normalizedTime = this._getPolynomialTime(normalizedTime, 5);
        } else if(this._type == 'exponential') {
            normalizedTime = this._getExponentialTime(normalizedTime);
        } else if(this._type == 'circular') {
            normalizedTime = this._getCircularTime(normalizedTime);
        } else if(this._type == 'back') {
            normalizedTime = this._getBackTime(normalizedTime);
        } else if(this._type == 'bounce') {
            normalizedTime = this._getBounceTime(normalizedTime);
        } else if(this._type == 'elastic') {
            normalizedTime = this._getElasticTime(normalizedTime);
        } else if(this._type != 'linear') {
            return this._getStepValue(normalizedTime, nextKeyframe);
        }
        return this._getLinearValue(normalizedTime, nextKeyframe);
    }

    _getSinusoidalTime(time) {
        if(this._easing == 'easeIn') {
            return 1 - Math.cos(time * Math.PI / 2);
        } else if(this._easing == 'easeOut') {
            return Math.sin(time * Math.PI / 2);
        } else {
            return 0.5 * (1 - Math.cos(time * Math.PI));
        }
    }

    _getPolynomialTime(time, degree) {
        if(this._easing == 'easeIn') {
            return time ** degree;
        } else if(this._easing == 'easeOut') {
            return 1 - (1 - time) ** degree;
        } else if(time < 0.5) {
            return 2 ** (degree - 1) * (time ** degree);
        } else {
            return 1 - ((-2 * time + 2) ** degree) / 2;
        }
    }

    _getExponentialTime(time) {
        if(time == 0) {
            return 0;
        } else if(time == 1) {
            return 1;
        } else if(this._easing == 'easeIn') {
            return 2 ** (10 * (time - 1));
        } else if(this._easing == 'easeOut') {
            return 1 - 2 ** (-10 * time);
        } else if(time < 0.5) {
            return 0.5 * 2 ** (10 * (2 * time - 1));
        } else {
            return 1 - 0.5 * 2 ** (-10 * (2 * time - 1));
        }
    }

    _getCircularTime(time) {
        if(this._easing == 'easeIn') {
            return 1 - Math.sqrt(1 - time * time);
        } else if(this._easing == 'easeOut') {
            return Math.sqrt(time * (2 - time));
        } else if(time < 0.5) {
            return (1 - Math.sqrt(1 - 4 * time ** 2)) / 2;
        } else {
            return (Math.sqrt(1 - (-2 * time + 2) ** 2) + 1) / 2;
        }
    }

    _getBackTime(time) {
        let c1 = 1.70158;
        if(this._easing == 'easeIn') {
            let c2 = c1 + 1;
            return c2 * time ** 3 - c1 * time ** 2;
        } else if(this._easing == 'easeOut') {
            let c2 = c1 + 1;
            return 1 + c2 * (time - 1) ** 3 + c1 * (time - 1) ** 2;
        } else if(time < 0.5) {
            let c2 = c1 * 1.525;
            return ((2 * time) ** 2 * ((c2 + 1) * 2 * time - c2)) / 2;
        } else {
            let c2 = c1 * 1.525;
            return ((2 * time - 2) ** 2 * ((c2 + 1) * (2 * time - 2) + c2)+2)/2;
        }
    }

    _getBounceTime(time) {
        if(this._easing == 'easeIn') {
            return 1 - this._getEaseOutBounce(1 - time);
        } else if(this._easing == 'easeOut') {
            return this._getEaseOutBounce(time);
        } else if(time < 0.5) {
            return (1 - this._getEaseOutBounce(1 - 2 * time)) / 2;
        } else {
            return (1 + this._getEaseOutBounce(2 * time - 1)) / 2;
        }
    }

    _getEaseOutBounce(time) {
        let n1 = 7.5625;
        let d1 = 2.75;
        if (time < 1 / d1) {
            return n1 * time * time;
        } else if (time < 2 / d1) {
            return n1 * (time - 1.5 / d1) ** 2 + 0.75;
        } else if (time < 2.5 / d1) {
            return n1 * (time - 2.25 / d1) ** 2 + 0.9375;
        } else {
            return n1 * (time - 2.625 / d1) ** 2 + 0.984375;
        }
    }

    _getElasticTime(time) {
        let c1 = (2 * Math.PI) / 3;
        let c2 = (2 * Math.PI) / 4.5;
        if(time == 0) {
            return 0;
        } else if(time == 1) {
            return 1;
        } else if(this._easing == 'easeIn') {
            return -(2 ** (10 * time - 10)) * Math.sin((time * 10 - 10.75) *c1);
        } else if(this._easing == 'easeOut') {
            return 2 ** (-10 * time) * Math.sin((time * 10 - 0.75) * c1) + 1;
        } else if(time < 0.5) {
            return 2 ** (20 * time - 10) * Math.sin((20 * time - 11.125) * c2)
                / -2;
        } else {
            return 2 ** (-20 * time + 10) * Math.sin((20 * time - 11.125) * c2)
                / 2 + 1;
        }
    }

    _getLinearValue(time, nextKeyframe) {
        console.error('_getLinearValue(...) should be overwritten');
    }

    _getStepValue(time) {
        if(time < 1)
            return this._keyframe[this._parameter];
        return nextKeyframe[this._parameter];
    }

    static assetName = 'Interpolation';
    static isPrivate = true;
}

class InterpolationHelper extends CustomAssetHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        { "parameter": "type", "name": "Interpolation Type",
            "map": INTERPOLATION_TYPES, "type": EnumField$1 },
        { "parameter": "easing", "name": "Easing",
            "map": EASING_TYPES, "type": EnumField$1 },
    ];
}

EditorHelperFactory$7.registerEditorHelper(InterpolationHelper,Interpolation);

const { LibraryHandler: LibraryHandler$b, ProjectHandler: ProjectHandler$b } = window.DigitalBacon;

class ColorInterpolation extends Interpolation {
    constructor(params = {}) {
        params['assetId'] = ColorInterpolation.assetId;
        super(params);
    }

    _getDefaultName() {
        return ColorInterpolation.assetName;
    }

    _getLinearValue(time, nextKeyframe) {
        let {r:r1, g:g1, b:b1} =this._hexToRGB(this._keyframe[this._parameter]);
        let {r:r2, g:g2, b:b2} = this._hexToRGB(nextKeyframe[this._parameter]);

        let r = Math.round(r1 + (r2 - r1) * time);
        let g = Math.round(g1 + (g2 - g1) * time);
        let b = Math.round(b1 + (b2 - b1) * time);

        return this._rgbToHex(r, g, b);
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

ProjectHandler$b.registerAsset(ColorInterpolation);
LibraryHandler$b.loadPrivate(ColorInterpolation);

const { LibraryHandler: LibraryHandler$a, ProjectHandler: ProjectHandler$a, THREE: THREE$6 } = window.DigitalBacon;

new THREE$6.Euler();
const workingQuaternions$1 = [new THREE$6.Quaternion(), new THREE$6.Quaternion()];

class EulerInterpolation extends Interpolation {
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
        workingEulers[0].fromArray(this._keyframe[this._parameter]);
        workingEulers[1].fromArray(nextKeyframe[this._parameter]);
        workingQuaternions$1[0].setFromEuler(workingEulers[0]);
        workingQuaternions$1[1].setFromEuler(workingEulers[1]);
        workingQuaternions$1[0].slerp(workingQuaternions$1[1], time);
        workingEulers[0].setFromQuaternion(workingQuaternions$1[0]);

        return workingEulers[0].toArray();
    }

    static assetId = '02fc385c-c981-445f-a448-4ea2b5729953';
    static assetName = 'Euler Interpolation';
    static isPrivate = true;
}

ProjectHandler$a.registerAsset(EulerInterpolation);
LibraryHandler$a.loadPrivate(EulerInterpolation);

const { LibraryHandler: LibraryHandler$9, ProjectHandler: ProjectHandler$9 } = window.DigitalBacon;

class NumberInterpolation extends Interpolation {
    constructor(params = {}) {
        params['assetId'] = NumberInterpolation.assetId;
        super(params);
    }

    _getDefaultName() {
        return NumberInterpolation.assetName;
    }

    _getLinearValue(time, nextKeyframe) {
        return (nextKeyframe[this._parameter] - this._keyframe[this._parameter])
            * time + this._keyframe[this._parameter];
    }

    static assetId = 'e89be085-ee97-4702-bf2c-01ec0505a694';
    static assetName = 'Number Interpolation';
    static isPrivate = true;
}

ProjectHandler$9.registerAsset(NumberInterpolation);
LibraryHandler$9.loadPrivate(NumberInterpolation);

const { Assets: Assets$2, EditorHelpers: EditorHelpers$6, LibraryHandler: LibraryHandler$8, ProjectHandler: ProjectHandler$8, PubSub: PubSub$1, THREE: THREE$5, getMenuController: getMenuController$1, isEditor: isEditor$3, utils: utils$1 } = window.DigitalBacon;
const { CustomAssetEntity: CustomAssetEntity$2 } = Assets$2;
const { CustomAssetEntityHelper: CustomAssetEntityHelper$2, EditorHelperFactory: EditorHelperFactory$6 } = EditorHelpers$6;
CustomAssetEntityHelper$2.FieldTypes;

const vector3s = [new THREE$5.Vector3(), new THREE$5.Vector3()];
var geometry, material$1;

class ControlPoint extends CustomAssetEntity$2 {
    constructor(params = {}) {
        params['assetId'] = ControlPoint.assetId;
        super(params);
        this._createMesh();
        if(!params['position']) this._setPositionFromMenu();
        if(isEditor$3()) {
            this._lastPosition = this.position;
            this.update = this._editorUpdate;
        }
    }

    _createMesh() {
        if(!isEditor$3()) return;
        if(!geometry) {
            geometry = new THREE$5.SphereGeometry(0.025);
            material$1 = new THREE$5.MeshBasicMaterial({ color: 0xff0000 });
        }
        this._mesh = new THREE$5.Mesh(geometry, material$1);
        this._object.add(this._mesh);
    }

    _getDefaultName() {
        return ControlPoint.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['parentId'] = null;
        return params;
    }

    _setPositionFromMenu() {
        let menuController = getMenuController$1();
        menuController.getPosition(vector3s[0]);
        menuController.getDirection(vector3s[1]).normalize()
            .divideScalar(4);
        vector3s[0].sub(vector3s[1]).roundWithPrecision(5);
        let position = vector3s[0].toArray();
        this.position = position;
        this.parent.object.worldToLocal(this.object.position);
    }

    registerInterpolation(interpolation) {
        this._object.visible = true;
        this._interpolation = interpolation;
        let animationPath = interpolation._keyframe?._animationPath;
        if(animationPath) this.addTo(animationPath);
        this.visualEdit = interpolation._keyframe?.visualEdit;
    }

    unregisterInterpolation(interpolation) {
        if(interpolation != this._interpolation) return;
        this._object.visible = false;
        this._interpolation = null;
        this.visualEdit = false;
    }

    _editorUpdate() {
        let position = this.position;
        for(let i = 0; i < 3; i++) {
            if(position[i] != this._lastPosition[i]) {
                this._lastPosition = position;
                if(this._interpolation) this._interpolation.updateCurve();
            }
        }
    }

    static assetId = 'dedf4341-660f-46aa-b8d1-2c3c2ea3d534';
    static assetName = 'Control Point';
    static isPrivate = true;
}

ProjectHandler$8.registerAsset(ControlPoint);
LibraryHandler$8.loadPrivate(ControlPoint);

if(EditorHelpers$6) {
    class ControlPointHelper extends CustomAssetEntityHelper$2 {
        constructor(asset) {
            super(asset);
        }

        static fields = [
            "position"
        ];
    }

    EditorHelperFactory$6.registerEditorHelper(ControlPointHelper, ControlPoint);
}

const { EditorHelpers: EditorHelpers$5, LibraryHandler: LibraryHandler$7, ProjectHandler: ProjectHandler$7, THREE: THREE$4, isEditor: isEditor$2 } = window.DigitalBacon;
const { EditorHelperFactory: EditorHelperFactory$5 } = EditorHelpers$5;
const { AssetSetField: AssetSetField$2, EnumField } = InterpolationHelper.FieldTypes;

const CURVE_TYPES = {
    Line: 'line',
    Bezier: 'bezier',
    Spline: 'spline',
};
const workingVector3$1 = new THREE$4.Vector3();
var material;

class PositionInterpolation extends Interpolation {
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
        workingVector3$1.fromArray(value);
        this._keyframe._animationPath.object.localToWorld(workingVector3$1);
        return workingVector3$1.toArray();
    }

    _getLinearValue(time, nextKeyframe) {
        if(this._curveType == 'line' || this._controlPoints.length == 0
                || time < 0 || time > 1 || !this._curve) {
            workingVector3$1.copy(nextKeyframe.object.position)
                .sub(this._keyframe.object.position)
                .multiplyScalar(time)
                .add(this._keyframe.object.position);
        } else {
            this._curve.getPointAt(time, workingVector3$1);
        }
        return workingVector3$1.toArray();
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
        let controlPoint = ProjectHandler$7.getAsset(controlPointId);
        if(!controlPoint) return;
        this._controlPoints.push(controlPoint);
        controlPoint.registerInterpolation(this);
        this.updateCurve();
    }

    removeControlPoint(controlPointId) {
        this._controlPoints.push(controlPointId);
        let controlPoint = ProjectHandler$7.getAsset(controlPointId);
        if(!controlPoint) return;
        let index = this._controlPoints.indexOf(controlPoint);
        if(index >= 0) this._controlPoints.splice(index, 1);
        this.updateCurve();
    }

    updateCurve() {
        let nextKeyframe = this._keyframe?._animationPath?.getNextKeyframeFor
            ?.('position', this._keyframe);
        let controlPointsQuantity = this._controlPoints.length;
        if(this._curveObject)
            this._curveObject.parent.remove(this._curveObject);
        if(!nextKeyframe) return;
        if(this._curveType == 'line' || controlPointsQuantity == 0) {
            this._curve = new THREE$4.LineCurve3(this._keyframe.object.position,
                nextKeyframe.object.position);
        } else if(this._curveType == 'bezier') {
            if(controlPointsQuantity == 1) {
                this._curve = new THREE$4.QuadraticBezierCurve3(
                    this._keyframe.object.position,
                    this._controlPoints[0].object.position,
                    nextKeyframe.object.position);
            } else {
                this._curve = new THREE$4.CubicBezierCurve3(
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
            this._curve = new THREE$4.CatmullRomCurve3(positions);
        }
        if(!isEditor$2()) return;
        let points = this._curve.getPoints(50);
        let geometry = new THREE$4.BufferGeometry().setFromPoints(points);
        if(!material) material = new THREE$4.LineDashedMaterial({
            color: 0xffff00,
        });
        this._curveObject = new THREE$4.Line(geometry, material);
        this._keyframe._animationPath.object.add(this._curveObject);
    }

    static assetId = '3dcb0b91-80fc-4aaf-aac4-a991521c906c';
    static assetName = 'Position Interpolation';
    static isPrivate = true;
}

ProjectHandler$7.registerAsset(PositionInterpolation);
LibraryHandler$7.loadPrivate(PositionInterpolation);

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
            "type": AssetSetField$2 },
    ];
}

EditorHelperFactory$5.registerEditorHelper(PositionInterpolationHelper,
    PositionInterpolation);

const { EditorHelpers: EditorHelpers$4, LibraryHandler: LibraryHandler$6, ProjectHandler: ProjectHandler$6, THREE: THREE$3 } = window.DigitalBacon;
const { EditorHelperFactory: EditorHelperFactory$4 } = EditorHelpers$4;
const { CheckboxField: CheckboxField$2, NumberField: NumberField$1 } = InterpolationHelper.FieldTypes;

const workingEuler = new THREE$3.Euler();
const workingQuaternions = [new THREE$3.Quaternion(), new THREE$3.Quaternion()];

class RotationInterpolation extends Interpolation {
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
        if(this._useLongPath) sign *= -1;
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

ProjectHandler$6.registerAsset(RotationInterpolation);
LibraryHandler$6.loadPrivate(RotationInterpolation);

class RotationInterpolationHelper extends InterpolationHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [
        "type",
        "easing",
        { "parameter": "useLongPath", "name": "Long Path",
            "type": CheckboxField$2 },
        { "parameter": "revolutions", "name": "Revolutions",
            "min": 0, "type": NumberField$1 },
    ];
}

EditorHelperFactory$4.registerEditorHelper(RotationInterpolationHelper,
    RotationInterpolation);

const { LibraryHandler: LibraryHandler$5, ProjectHandler: ProjectHandler$5, THREE: THREE$2 } = window.DigitalBacon;

const workingVector3s = [new THREE$2.Vector3(), new THREE$2.Vector3()];

class ScaleInterpolation extends Interpolation {
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
        workingVector3s[0].copy(nextKeyframe.object.scale)
            .sub(this._keyframe.object.scale)
            .multiplyScalar(time)
            .add(this._keyframe.object.scale);
        return workingVector3s[0].toArray();
    }

    _getStepValue(time, nextKeyframe) {
        if(time < 1)
            return this._keyframe['scale'];
        return nextKeyframe['scale'];
    }

    static assetId = 'ede2dc59-168a-4753-be2d-62530fcf7d67';
    static assetName = 'Scale Interpolation';
    static isPrivate = true;
}

ProjectHandler$5.registerAsset(ScaleInterpolation);
LibraryHandler$5.loadPrivate(ScaleInterpolation);

const { EditorHelpers: EditorHelpers$3, LibraryHandler: LibraryHandler$4, ProjectHandler: ProjectHandler$4 } = window.DigitalBacon;
const { EditorHelperFactory: EditorHelperFactory$3 } = EditorHelpers$3;

class StepInterpolation extends Interpolation {
    constructor(params = {}) {
        params['assetId'] = StepInterpolation.assetId;
        super(params);
        this._type = 'step';
    }

    _getDefaultName() {
        return StepInterpolation.assetName;
    }

    static assetId = '6599906d-6fdc-4a51-9468-7e5eb3401b97';
    static assetName = 'Step Interpolation';
    static isPrivate = true;
}

ProjectHandler$4.registerAsset(StepInterpolation);
LibraryHandler$4.loadPrivate(StepInterpolation);

class StepInterpolationHelper extends InterpolationHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [];
}

EditorHelperFactory$3.registerEditorHelper(StepInterpolationHelper,
    StepInterpolation);

const { EditorHelpers: EditorHelpers$2, LibraryHandler: LibraryHandler$3, ProjectHandler: ProjectHandler$3 } = window.DigitalBacon;
const { EditorHelperFactory: EditorHelperFactory$2 } = EditorHelpers$2;

class TextInterpolation extends Interpolation {
    constructor(params = {}) {
        params['assetId'] = TextInterpolation.assetId;
        super(params);
        this._type = 'step';
    }

    _getDefaultName() {
        return TextInterpolation.assetName;
    }

    static assetId = '54593ea0-ace0-41d2-ac4a-4147a92356b7';
    static assetName = 'Text Interpolation';
    static isPrivate = true;
}

ProjectHandler$3.registerAsset(TextInterpolation);
LibraryHandler$3.loadPrivate(TextInterpolation);

class TextInterpolationHelper extends InterpolationHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [];
}

EditorHelperFactory$2.registerEditorHelper(TextInterpolationHelper,
    TextInterpolation);

const { LibraryHandler: LibraryHandler$2, ProjectHandler: ProjectHandler$2 } = window.DigitalBacon;

class VectorInterpolation extends Interpolation {
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
        let firstValue = this._keyframe[this._parameter].slice();
        let nextValue = nextKeyframe[this._parameter].slice();
        for(let i = 0; i < firstValue.length; i++) {
            firstValue[i] = (nextValue[i] - firstValue[i]) * time+firstValue[i];
        }
        return firstValue;
    }

    static assetId = '2ab2e72d-14ae-4f89-8b0b-ae23e7f7259b';
    static assetName = 'Vector Interpolation';
    static isPrivate = true;
}

ProjectHandler$2.registerAsset(VectorInterpolation);
LibraryHandler$2.loadPrivate(VectorInterpolation);

const { Assets: Assets$1, EditorHelpers: EditorHelpers$1, LibraryHandler: LibraryHandler$1, ProjectHandler: ProjectHandler$1, PubSub, THREE: THREE$1, getMenuController, isEditor: isEditor$1, utils } = window.DigitalBacon;
const { CustomAssetEntity: CustomAssetEntity$1 } = Assets$1;
const { CustomAssetEntityHelper: CustomAssetEntityHelper$1, EditorHelperFactory: EditorHelperFactory$1 } = EditorHelpers$1;
const { AssetSetField: AssetSetField$1, ButtonField: ButtonField$1, CheckboxField: CheckboxField$1, ColorField, EulerField, NumberField, TextField, Vector2Field, Vector3Field } = CustomAssetEntityHelper$1.FieldTypes;
const { numberOr } = utils;

const PiggyImageUrl = 'https://cdn.jsdelivr.net/gh/kalegd/digitalbacon-plugins@latest/textures/Digital_Bacon_Piggy.jpg';
var piggyTexture;

[new THREE$1.Vector3(), new THREE$1.Vector3()];
const supportedFields = new Set([CheckboxField$1, ColorField, EulerField, NumberField, TextField, Vector2Field, Vector3Field]);
const assetEntityParameters = ['position', 'rotation', 'scale', 'renderOrder'];
const parameterToAssetId = {
    position: PositionInterpolation.assetId,
    rotation: RotationInterpolation.assetId,
    scale: ScaleInterpolation.assetId,
};
const fieldToAssetId = {
    ColorField: ColorInterpolation.assetId,
    EulerField: EulerInterpolation.assetId,
    NumberField: NumberInterpolation.assetId,
    TextField: TextInterpolation.assetId,
    Vector2Field: VectorInterpolation.assetId,
    Vector3Field: VectorInterpolation.assetId,
};

class Keyframe extends CustomAssetEntity$1 {
    constructor(params = {}) {
        params['assetId'] = Keyframe.assetId;
        super(params);
        this._time = numberOr(params['time'], 0);
        this.parameters = {};
        this._interpolations = new Set();
        this._parameterInterpolations = {};
        if(params['parameters']) this.setParameters(params['parameters']);
        if(params['interpolations'])
            this.interpolations = params['interpolations'];
    }

    _createMesh() {
        if(!isEditor$1()) return;
        if(!piggyTexture) {
            piggyTexture = new THREE$1.TextureLoader().load(PiggyImageUrl);
            piggyTexture.repeat.x = 5;
            piggyTexture.repeat.y = 2.5;
            piggyTexture.offset.x = -3.25;
            piggyTexture.offset.y = -0.75;
            piggyTexture.colorSpace = THREE$1.SRGBColorSpace;
        }
        let geometry = new THREE$1.SphereGeometry(0.05);
        let material = new THREE$1.MeshBasicMaterial({
            color: 0xffffff,
            map: piggyTexture,
        });
        this._mesh = new THREE$1.Mesh(geometry, material);
        this._object.add(this._mesh);
    }

    _getDefaultName() {
        return Keyframe.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['time'] = this._time;
        params['parameters'] = this.parameters;
        params['interpolations'] = this.interpolations;
        params['parentId'] = null;
        return params;
    }

    get interpolations() {
        let interpolationIds = [];
        for(let interpolation of this._interpolations) {
            interpolationIds.push(interpolation.id);
        }
        return interpolationIds;
    }

    get time() { return this._time; }

    set interpolations(interpolations) {
        for(let interpolationId of interpolations) {
            this.addInterpolation(interpolationId);
        }
    }

    set time(time) {
        this._time = time;
        if(this._animationPath) this._animationPath.updateKeyframes();
    }

    addInterpolation(interpolationId) {
        let interpolation = ProjectHandler$1.getAsset(interpolationId);
        if(!interpolation) return;
        this._interpolations.add(interpolation);
        interpolation.registerKeyframe(this);
        this._parameterInterpolations[interpolation.parameter] = interpolation;
    }

    addParameter(field, id) {
        this.parameters[id] = field;
        if(this._animationPath) this._animationPath.updateKeyframes();
        if(assetEntityParameters.includes(field.parameter)) {
            if(field.parameter == 'position' && !this._mesh) this._createMesh();
            if(isEditor$1() && this._animationPath) {
                let asset = this._animationPath._animatedAssets.values().next()
                    .value;
                if(asset)
                    this[field.parameter] = asset[field.parameter];
            }
            return;
        }
        Object.defineProperty(this, field.parameter, {
            get: function() {
                return field.value;
            }, set: function(value) {
                field.value = value;
            }
        });
    }

    removeInterpolation(interpolationId) {
        let interpolation = ProjectHandler$1.getAsset(interpolationId);
        if(!interpolation) return;
        this._interpolations.delete(interpolation);
    }

    setParameters(parameters) {
        for(let id in parameters) {
            this.addParameter(parameters[id], id);
        }
    }

    registerAnimationPath(animationPath) {
        this._object.visible = true;
        this._animationPath = animationPath;
        this.addTo(animationPath);
        this.visualEdit = animationPath.visualEdit;
        for(let interpolation of this._interpolations) {
            interpolation.registerKeyframe(this);
        }
    }

    unregisterAnimationPath(animationPath) {
        if(animationPath != this._animationPath) return;
        this._object.visible = false;
        this._animationPath = null;
        this.visualEdit = false;
    }

    interpolate(parameter, time, nextKeyframe) {
        let interpolation = this._parameterInterpolations[parameter];
        return interpolation.getValue(time, nextKeyframe);
    }

    static assetId = '401fcf91-49ef-480b-992d-e55ac0c65d4e';
    static assetName = 'Keyframe';
    static isPrivate = true;
}

ProjectHandler$1.registerAsset(Keyframe);
LibraryHandler$1.loadPrivate(Keyframe);

if(EditorHelpers$1) {
    class KeyframeHelper extends CustomAssetEntityHelper$1 {
        constructor(asset) {
            super(asset);
            this._addParameterFields();
        }

        addParameter() {
            let animatedAssets = this._asset._animationPath?._animatedAssets;
            if(animatedAssets?.size) {
                let params = {};
                for(let asset of animatedAssets) {
                    let editorHelper = asset.editorHelper;
                    this._loadAssetParams(params, editorHelper.constructor);
                }
                let menuController = getMenuController();
                let page = menuController.getPage('ASSET_SELECT');
                page.setContent(params, (id) => {
                    let field = params[id];
                    this._asset.addParameter(field, id);
                    let input;
                    if(this._menuFieldsMap[field.parameter]) {
                        input = this._menuFieldsMap[field.parameter];
                    } else {
                        input = this._createStandardField(field);
                        this._menuFieldsMap[field.parameter] = input;
                    }
                    menuController.back();
                    let assetPage = menuController.getCurrentPage();
                    assetPage._removeCurrentFields();
                    this._menuFields.splice(this._menuFields.length -1,0,input);
                    assetPage.setAsset(this._asset, true);
                    let menuFieldsLength = this._menuFields.length;
                    while(assetPage._lastItemIndex + 1 != menuFieldsLength) {
                        assetPage._loadNextPage();
                    }
                    this._createInterpolation(field);
                });
                menuController.pushPage('ASSET_SELECT');
            } else {
                PubSub.publish(this._id, 'MENU_NOTIFICATION',
                    { text: 'Please add an asset to the animation path first'});
            }
        }

        _addParameterFields() {
            for(let id in this._asset.parameters) {
                let field = this._asset.parameters[id];
                if(!this._menuFields) this.getMenuFields();
                let input;
                if(this._menuFieldsMap[field.parameter]) {
                    input = this._menuFieldsMap[field.parameter];
                } else {
                    input = this._createStandardField(field);
                    this._menuFieldsMap[field.parameter] = input;
                }
                this._menuFields.splice(this._menuFields.length - 1, 0, input);
            }
        }

        _createInterpolation(field) {
            let assetId;
            let params = {
                parameter: field.parameter,
                name: field.name,
            };
            if(field.parameter in parameterToAssetId) {
                assetId = parameterToAssetId[field.parameter];
            } else if(field.type in fieldToAssetId) {
                assetId = fieldToAssetId[field.type];
            } else {
                assetId = StepInterpolation.assetId;
            }
            let interpolation = ProjectHandler$1.addNewAsset(assetId, params);
            this._asset.addInterpolation(interpolation.id);
        }

        _loadAssetParams(params, helperClass) {
            if(!helperClass) return;
            let parentClass = Object.getPrototypeOf(helperClass);
            this._loadAssetParams(params, parentClass);
            if(!helperClass.fields) return;
            for(let field of helperClass.fields) {
                if(typeof field == 'string' || !supportedFields.has(field.type)
                        || field.parameter == 'visualEdit') {
                    continue;
                }
                let id = field.type.name + ':' + field.parameter;
                if(id in params || id in this._asset.parameters) {
                    continue;
                } else {
                    params[id] = this._cloneField(field);
                }
            }
        }

        _cloneField(field) {
            let fieldCopy = {};
            for(let attribute in field) {
                fieldCopy[attribute] = field[attribute];
            }
            fieldCopy['Name'] = fieldCopy['name'];
            fieldCopy.type = fieldCopy.type.name;
            return fieldCopy;
        }

        static fields = [
            { "parameter": "time", "name": "Time", "min": 0,
                "type": NumberField },
            { "parameter": "interpolations", "name": "Interpolations",
                "addFunction": "addInterpolation",
                "removeFunction": "removeInterpolation",
                "type": AssetSetField$1 },
            { "parameter": "addParameter", "name": "Add Parameter",
                "type": ButtonField$1 },
        ];
    }

    EditorHelperFactory$1.registerEditorHelper(KeyframeHelper, Keyframe);
}

const { Assets, EditorHelpers, LibraryHandler, ProjectHandler, Scene, THREE, isEditor, isImmersionDisabled } = window.DigitalBacon;
const { AssetEntity, CustomAssetEntity } = Assets;
const { CustomAssetEntityHelper, EditorHelperFactory } = EditorHelpers;
const { AssetSetField, ButtonField, CheckboxField } = CustomAssetEntityHelper.FieldTypes;

new THREE.Euler();
const workingQuaternion = new THREE.Quaternion();
const workingVector3 = new THREE.Vector3();

var maxScrollTime = 0;
var animationController;

class AnimationPath extends CustomAssetEntity {
    constructor(params = {}) {
        params['assetId'] = AnimationPath.assetId;
        params['position'] = params['rotation'] = [0,0,0];
        super(params);
        this._animatedAssets = new Set();
        this._keyframes = new Set();
        this._orderedKeyframes = [];
        this._orderedParameters = {};
        this._maxTime = 0;
        this._scrollBased = params['scrollBased'] || false;
        if(params['animatedAssets']) this.animatedAssets
            = params['animatedAssets'];
        if(params['keyframes']) this.keyframes = params['keyframes'];
        if(isEditor()) return;
        if(this._scrollBased && isImmersionDisabled()) {
            this.update = this._updateScrollBased;
        }
    }

    _getDefaultName() {
        return AnimationPath.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['animatedAssets'] = this.animatedAssets;
        params['keyframes'] = this.keyframes;
        params['scrollBased'] = this.scrollBased;
        return params;
    }

    get animatedAssets() {
        let animatedAssetIds = [];
        for(let animatedAsset of this._animatedAssets) {
            animatedAssetIds.push(animatedAsset.id);
        }
        return animatedAssetIds;
    }

    get keyframes() {
        let keyframeIds = [];
        for(let keyframe of this._keyframes) {
            keyframeIds.push(keyframe.id);
        }
        return keyframeIds;
    }

    get scrollBased() { return this._scrollBased; }

    set animatedAssets(animatedAssets) {
        for(let animatedAssetId of animatedAssets) {
            this.addAnimatedAsset(animatedAssetId);
        }
    }

    set keyframes(keyframes) {
        for(let keyframeId of keyframes) {
            this.addKeyframe(keyframeId);
        }
        this.updateKeyframes();
    }

    set scrollBased(scrollBased) { this._scrollBased = scrollBased; }

    addAnimatedAsset(animatedAssetId) {
        let animatedAsset = ProjectHandler.getAsset(animatedAssetId);
        if(!animatedAsset) return;
        this._animatedAssets.add(animatedAsset);
    }

    addKeyframe(keyframeId) {
        let keyframe = ProjectHandler.getAsset(keyframeId);
        if(!keyframe) return;
        this._keyframes.add(keyframe);
        keyframe.registerAnimationPath(this);
    }

    removeAnimatedAsset(animatedAssetId) {
        let animatedAsset = ProjectHandler.getAsset(animatedAssetId);
        if(!animatedAsset) return;
        this._animatedAssets.delete(animatedAsset);
    }

    removeKeyframe(keyframeId) {
        let keyframe = ProjectHandler.getAsset(keyframeId);
        if(!keyframe) return;
        this._keyframes.delete(keyframe);
        keyframe.unregisterAnimationPath(this);
    }

    getNextKeyframeFor(parameter, previousKeyframe) {
        let keyframes = this._orderedParameters[parameter];
        if(!keyframes) return;
        for(let i = 0; i < keyframes.length; i++) {
            let keyframe = keyframes[i];
            if(keyframe == previousKeyframe) {
                if(i == keyframes.length - 1) return;
                return keyframes[i + 1];
            }
        }
    }

    updateKeyframes() {
        this._orderedParameters = {};
        this._orderedKeyframes = Array.from(this._keyframes);
        this._orderedKeyframes = this._orderedKeyframes.sort(
            (a, b) => a.time - b.time);
        if(!this._orderedKeyframes.length) return;
        for(let keyframe of this._orderedKeyframes) {
            for(let id in keyframe.parameters) {
                let parameter = keyframe.parameters[id].parameter;
                if(!this._orderedParameters[parameter])
                    this._orderedParameters[parameter] = [];
                this._orderedParameters[parameter].push(keyframe);
            }
        }
        this._maxTime = Math.max(0,
            this._orderedKeyframes[this._orderedKeyframes.length - 1].time);
        if(this._scrollBased) {
            maxScrollTime = Math.max(maxScrollTime, this._maxTime);
        }
        this._updatePositionInterpolationCurves();
    }

    _updatePositionInterpolationCurves() {
        let keyframes = this._orderedParameters['position'];
        if(!keyframes) return;
        for(let keyframe of keyframes) {
            let interpolation = keyframe._parameterInterpolations['position'];
            if(interpolation) interpolation.updateCurve();
        }
    }

    _setTime(time) {
        for(let parameter in this._orderedParameters) {
            let keyframes = this._orderedParameters[parameter];
            let keyframe = keyframes[0];
            let nextKeyframe;
            for(let i = 1; i < keyframes.length; i++) {
                nextKeyframe = keyframes[i];
                if(time <= nextKeyframe.time) break;
                keyframe = nextKeyframe;
                nextKeyframe = null;
            }
            let value = keyframe.interpolate(parameter, time, nextKeyframe);
            this._updateAssets(parameter, value);
        }
    }

    _updateAssets(parameter, value) {
        for(let asset of this._animatedAssets) {
            asset[parameter] = value;
            if(asset instanceof AssetEntity == false) {
                continue;
            } else if(parameter == 'position') {
                asset._object.parent.worldToLocal(asset._object.position);
            } else if(parameter == 'rotation') {
                let quaternion = asset._object.quaternion;
                quaternion.setFromEuler(asset._object.rotation);
                asset._object.parent.getWorldQuaternion(workingQuaternion);
                quaternion.premultiply(workingQuaternion.invert());
            } else if(parameter == 'scale') {
                asset._object.parent.getWorldScale(workingVector3);
                asset._object.scale.divide(workingVector3);
            }
        }
    }

    _updateScrollBased() {
        let maxHeight = document.body.scrollHeight - window.innerHeight;
        let scrollPosition = window.scrollY;
        let scrollPercent = Math.min(Math.max(scrollPosition / maxHeight, 0),1);
        if(scrollPercent == this._lastScrollPercent) return;
        this._lastScrollPercent = scrollPercent;
        let time = scrollPercent * maxScrollTime;
        this._setTime(time);
    }

    static assetId = '2d227485-0b34-40a4-873d-2a0782d034c6';
    static assetName = 'Animation Path';
    static getMaxTime() {
        return maxScrollTime;
    }
}

ProjectHandler.registerAsset(AnimationPath);

if(EditorHelpers) {
    function getAssets() {
        let assets = ProjectHandler.getAssets();
        let ids = [];
        for(let assetId in assets) {
            let asset = assets[assetId];
            if(asset.constructor.name == 'InternalAssetEntity') continue;
            if(asset.isPrivate || asset.constructor.isPrivate) continue;
            ids.push(assetId);
        }
        return ids;
    }

    class AnimationPathHelper extends CustomAssetEntityHelper {
        constructor(asset) {
            super(asset);
        }

        preview() {
            if(!animationController) {
                animationController = new AnimationController();
                animationController.registerAnimationPathClass(AnimationPath);
                Scene.object.add(animationController.object);
                EditorHelperFactory.addEditorHelperTo(
                    animationController);
                animationController.editorHelper.updateVisualEdit(true);
            } else {
                Scene.object.add(animationController.object);
            }
            animationController.setPositionFromMenu();
        }

        static fields = [
            "visualEdit",
            { "parameter": "scrollBased", "name": "Scroll Based",
                "type": CheckboxField },
            { "parameter": "animatedAssets", "name": "Assets",
                "addFunction": "addAnimatedAsset",
                "removeFunction": "removeAnimatedAsset",
                "optionsFunction": getAssets,
                "type": AssetSetField },
            { "parameter": "keyframes", "name": "Keyframes",
                "addFunction": "addKeyframe",
                "removeFunction": "removeKeyframe",
                "newOptionsFunction": ()=>[Keyframe.assetId],
                "type": AssetSetField },
            { "parameter": "preview", "name": "Preview",
                "type": ButtonField },
            "parentId",
            "position",
            "rotation",
            "scale",
        ];
    }

    EditorHelperFactory.registerEditorHelper(AnimationPathHelper,AnimationPath);
}

export { AnimationPath as default };
