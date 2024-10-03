const { Assets, EditorHelpers, LibraryHandler, ProjectHandler } = window.DigitalBacon;
const { CustomAssetEntity } = Assets;
const { CustomAssetEntityHelper, EditorHelperFactory } = EditorHelpers;
const { EnumField } = CustomAssetEntityHelper.FieldTypes;

export default class StepInterpolation extends CustomAssetEntity {
    constructor(params = {}) {
        params['assetId'] = StepInterpolation.assetId;
        super(params);
        this._parameter = params['parameter'];
    }

    _getDefaultName() {
        return StepInterpolation.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['parameter'] = this._parameter;
        params['type'] = this._type;
        return params;
    }

    get parameter() { return this._parameter; }

    set parameter(parameter) { this._parameter = parameter; }

    registerKeyframe(keyframe) {
        this._keyframe = keyframe;
    }

    getValue(time, nextKeyframe) {
        if(!this._keyframe) return;
        if(!nextKeyframe || time < nextKeyframe.time)
            return this._keyframe[this._parameter];
        return nextKeyframe[this._parameter];
    }

    static assetId = '6599906d-6fdc-4a51-9468-7e5eb3401b97';
    static assetName = 'Step Interpolation';
    static isPrivate = true;
}

ProjectHandler.registerAsset(StepInterpolation);
LibraryHandler.loadPrivate(StepInterpolation);

if(EditorHelpers) {
    class StepInterpolationHelper extends CustomAssetEntityHelper {
        constructor(asset) {
            super(asset);
        }

        static fields = [];
    }

    EditorHelperFactory.registerEditorHelper(StepInterpolationHelper,
        StepInterpolation);
}
