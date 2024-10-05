const { Assets, EditorHelpers } = window.DigitalBacon;
const { CustomAsset } = Assets;
const { CustomAssetHelper, EditorHelperFactory } = EditorHelpers;
const { EnumField } = CustomAssetHelper.FieldTypes;

const INTERPOLATION_TYPES = {
    Linear: 'linear',
    //Bezier: 'cubic-bezier',
    //'Ease-in': 'ease-in',
    //'Ease-out': 'ease-out',
    //'Ease-in-out': 'ease-in-out',
    Step: 'step',
};

class Interpolation extends CustomAsset {
    constructor(params = {}) {
        super(params);
        this._parameter = params['parameter'];
        this._type = params['type'] || 'linear';
    }

    _getDefaultName() {
        return Interpolation.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['parameter'] = this._parameter;
        params['type'] = this._type;
        return params;
    }

    get parameter() { return this._parameter; }
    get type() { return this._type; }

    set parameter(parameter) { this._parameter = parameter; }
    set type(type) { this._type = type; }

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
        } else if(this._type == 'linear') {
            return this._getLinearValue(time, nextKeyframe);
        } else {
            return this._getStepValue(time, nextKeyframe);
        }
    }

    _getLinearValue(time, nextKeyframe) {
        console.error('_getLinearValue(...) should be overwritten');
    }

    _getStepValue(time, nextKeyframe) {
        console.error('_getStepValue(...) should be overwritten');
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
    ];
}

EditorHelperFactory.registerEditorHelper(InterpolationHelper,Interpolation);

export { Interpolation };
export { InterpolationHelper };
