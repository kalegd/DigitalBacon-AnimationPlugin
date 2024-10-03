const { Assets, EditorHelpers, LibraryHandler, ProjectHandler } = window.DigitalBacon;
const { CustomAssetEntity } = Assets;
const { CustomAssetEntityHelper, EditorHelperFactory } = EditorHelpers;
const { EnumField } = CustomAssetEntityHelper.FieldTypes;

const INTERPOLATION_TYPES = {
    Linear: 'linear',
    Bezier: 'cubic-bezier',
    'Ease-in': 'ease-in',
    'Ease-out': 'ease-out',
    'Ease-in-out': 'ease-in-out',
    Step: 'step',
};

export default class Interpolation extends CustomAssetEntity {
    constructor(params = {}) {
        params['assetId'] = Interpolation.assetId;
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
    set type(type) {
        this._type = type;
    }

    registerKeyframe(keyframe) {
        this._keyframe = keyframe;
    }

    static assetId = '57a0b700-8fc1-455a-a6cf-fdba6967b1f1';
    static assetName = 'Interpolation';
    static isPrivate = true;
}

ProjectHandler.registerAsset(Interpolation);
LibraryHandler.loadPrivate(Interpolation);

if(EditorHelpers) {
    class InterpolationHelper extends CustomAssetEntityHelper {
        constructor(asset) {
            super(asset);
        }

        static fields = [
            { "parameter": "type", "name": "Interpolation Type",
                "map": INTERPOLATION_TYPES, "type": EnumField },
        ];
    }

    EditorHelperFactory.registerEditorHelper(InterpolationHelper,Interpolation);
}
