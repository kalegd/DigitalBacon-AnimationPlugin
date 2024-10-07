const { Assets, EditorHelpers } = window.DigitalBacon;
const { CustomAsset } = Assets;
const { CustomAssetHelper, EditorHelperFactory } = EditorHelpers;
const { EnumField } = CustomAssetHelper.FieldTypes;

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
const BACK_CONSTANT = 1.70158;
const BOUNCE_CONSTANT = 1.70158;
const ELASTIC_CONSTANT = 1.70158;

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
            "map": INTERPOLATION_TYPES, "type": EnumField },
        { "parameter": "easing", "name": "Easing",
            "map": EASING_TYPES, "type": EnumField },
    ];
}

EditorHelperFactory.registerEditorHelper(InterpolationHelper,Interpolation);

export { Interpolation };
export { InterpolationHelper };
