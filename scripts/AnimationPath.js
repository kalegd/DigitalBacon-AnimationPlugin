import AnimationController from 'http://localhost:8000/scripts/AnimationController.js';
import Keyframe from 'http://localhost:8000/scripts/Keyframe.js';

const { Assets, EditorHelpers, LibraryHandler, ProjectHandler, Scene, THREE, isEditor, isImmersionDisabled } = window.DigitalBacon;
const { AssetEntity, CustomAssetEntity } = Assets;
const { CustomAssetEntityHelper, EditorHelperFactory } = EditorHelpers;
const { AssetSetField, ButtonField, CheckboxField } = CustomAssetEntityHelper.FieldTypes;

const workingEuler = new THREE.Euler();
const workingQuaternion = new THREE.Quaternion();
const workingVector3 = new THREE.Vector3();

var maxScrollTime = 0;
var animationController;

export default class AnimationPath extends CustomAssetEntity {
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
            this.addKeyframe(keyframeId, true);
        }
        this.updateKeyframes();
    }

    set scrollBased(scrollBased) { this._scrollBased = scrollBased; }

    addAnimatedAsset(animatedAssetId) {
        let animatedAsset = ProjectHandler.getAsset(animatedAssetId);
        if(!animatedAsset) return;
        this._animatedAssets.add(animatedAsset);
    }

    addKeyframe(keyframeId, ignoreKeyframesUpdate) {
        let keyframe = ProjectHandler.getAsset(keyframeId);
        if(!keyframe) return;
        this._keyframes.add(keyframe);
        keyframe.registerAnimationPath(this);
        if(!ignoreKeyframesUpdate) this.updateKeyframes();
    }

    removeAnimatedAsset(animatedAssetId) {
        let animatedAsset = ProjectHandler.getSessionAsset(animatedAssetId);
        if(!animatedAsset) return;
        this._animatedAssets.delete(animatedAsset);
    }

    removeKeyframe(keyframeId) {
        let keyframe = ProjectHandler.getSessionAsset(keyframeId);
        this._keyframes.delete(keyframe);
        this.updateKeyframes();
        if(keyframe.editorHelper) keyframe.editorHelper.hideMesh();
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

    onKeyframePositionUpdate(keyframe) {
        let keyframes = this._orderedParameters['position'];
        if(!keyframes) return;
        let index = keyframes.indexOf(keyframe);
        if(keyframes < 0) return;
        let interpolation = keyframe._parameterInterpolations['position'];
        if(interpolation) interpolation.updateCurve();
        if(index > 0) {
            keyframe = keyframes[index - 1];
            interpolation = keyframe._parameterInterpolations['position'];
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
