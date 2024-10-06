import { Interpolation, InterpolationHelper } from 'http://localhost:8000/scripts/Interpolation.js';

const { EditorHelpers, LibraryHandler, ProjectHandler } = window.DigitalBacon;
const { EditorHelperFactory } = EditorHelpers;

export default class StepInterpolation extends Interpolation {
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

ProjectHandler.registerAsset(StepInterpolation);
LibraryHandler.loadPrivate(StepInterpolation);

class StepInterpolationHelper extends InterpolationHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [];
}

EditorHelperFactory.registerEditorHelper(StepInterpolationHelper,
    StepInterpolation);
