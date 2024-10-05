import { Interpolation, InterpolationHelper } from 'http://localhost:8000/scripts/Interpolation.js';

const { EditorHelpers, LibraryHandler, ProjectHandler } = window.DigitalBacon;
const { EditorHelperFactory } = EditorHelpers;

export default class TextInterpolation extends Interpolation {
    constructor(params = {}) {
        params['assetId'] = TextInterpolation.assetId;
        super(params);
        this._type = 'step';
    }

    _getDefaultName() {
        return TextInterpolation.assetName;
    }

    _getStepValue(time, nextKeyframe) {
        if(time < nextKeyframe.time)
            return this._keyframe[this._parameter];
        return nextKeyframe[this._parameter];
    }

    static assetId = '6599906d-6fdc-4a51-9468-7e5eb3401b97';
    static assetName = 'Text Interpolation';
    static isPrivate = true;
}

ProjectHandler.registerAsset(TextInterpolation);
LibraryHandler.loadPrivate(TextInterpolation);

class TextInterpolationHelper extends InterpolationHelper {
    constructor(asset) {
        super(asset);
    }

    static fields = [];
}

EditorHelperFactory.registerEditorHelper(TextInterpolationHelper,
    TextInterpolation);
