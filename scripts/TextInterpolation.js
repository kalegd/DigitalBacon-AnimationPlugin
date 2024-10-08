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

    static assetId = '54593ea0-ace0-41d2-ac4a-4147a92356b7';
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
