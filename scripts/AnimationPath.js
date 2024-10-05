import Keyframe from 'http://localhost:8000/scripts/Keyframe.js';

const { Assets, EditorHelpers, LibraryHandler, ProjectHandler, THREE, isEditor, isImmersionDisabled } = window.DigitalBacon;
const { CustomAssetEntity } = Assets;
const { CustomAssetEntityHelper, EditorHelperFactory } = EditorHelpers;
const { AssetSetField, CheckboxField } = CustomAssetEntityHelper.FieldTypes;

const workingEuler = new THREE.Euler();
const workingQuaternion = new THREE.Quaternion();
const workingVector3 = new THREE.Vector3();

var maxScrollTime = 0;

export default class AnimationPath extends CustomAssetEntity {
    constructor(params = {}) {
        params['assetId'] = AnimationPath.assetId;
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
        if(this._scrollBased && isImmersionDisabled()
                && this._orderedKeyframes?.length) {
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
        this._maxTime = Math.max(this._maxTime,
            this._orderedKeyframes[this._orderedKeyframes.length - 1].time);
        if(this._scrollBased) {
            maxScrollTime = Math.max(maxScrollTime, this._maxTime);
        }
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

    _setTime(time) {
        for(let parameter in this._orderedParameters) {
            let keyframes = this._orderedParameters[parameter];
            let keyframe = keyframes[0];
            let nextKeyframe;
            for(let i = 1; i < keyframes.length; i++) {
                nextKeyframe = keyframes[i];
                if(keyframe.time <= time && time <= nextKeyframe.time) break;
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
            if(parameter == 'position') {
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
            "position",
            "rotation",
            "scale",
        ];
    }

    EditorHelperFactory.registerEditorHelper(AnimationPathHelper,AnimationPath);
}
