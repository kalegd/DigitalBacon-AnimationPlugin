import Keyframe from 'http://localhost:8000/Keyframe.js';

const { Assets, EditorHelpers, LibraryHandler, ProjectHandler } = window.DigitalBacon;
const { CustomAssetEntity } = Assets;
const { CustomAssetEntityHelper, EditorHelperFactory } = EditorHelpers;
const { AssetSetField } = CustomAssetEntityHelper.FieldTypes;

export default class AnimationPath extends CustomAssetEntity {
    constructor(params = {}) {
        params['assetId'] = AnimationPath.assetId;
        super(params);
        this._animatedAssets = new Set();
        this._keyframes = new Set();
        if(params['animatedAssets']) this.animatedAssets
            = params['animatedAssets'];
        if(params['keyframes']) this.keyframes = params['keyframes'];
    }

    _getDefaultName() {
        return AnimationPath.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['animatedAssets'] = this.animatedAssets;
        params['keyframes'] = this.keyframes;
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

    set animatedAssets(animatedAssets) {
        for(let animatedAssetId of animatedAssets) {
            this.addAnimatedAsset(animatedAssetId);
        }
    }

    set keyframes(keyframes) {
        for(let keyframeId of keyframes) {
            this.addKeyframe(keyframeId);
        }
    }

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

    static assetId = '2d227485-0b34-40a4-873d-2a0782d034c6';
    static assetName = 'Animation Path';
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

        static fields = [
            "visualEdit",
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
            "position",
            "rotation",
            "scale",
        ];
    }

    EditorHelperFactory.registerEditorHelper(AnimationPathHelper,AnimationPath);
}
