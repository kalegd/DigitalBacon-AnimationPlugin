const { Assets, EditorHelpers, LibraryHandler, ProjectHandler, PubSub, THREE, getMenuController, utils } = window.DigitalBacon;
const { CustomAssetEntity } = Assets;
const { CustomAssetHelper, CustomAssetEntityHelper, EditorHelperFactory } = EditorHelpers;
const { AssetSetField, ButtonField, CheckboxField, ColorField, EulerField, NumberField, Vector2Field, Vector3Field } = CustomAssetEntityHelper.FieldTypes;
const { numberOr } = utils;

const KEYFRAME_ID = '401fcf91-49ef-480b-992d-e55ac0c65d4e';
const INTERPOLATION_ID = '57a0b700-8fc1-455a-a6cf-fdba6967b1f1';
const PiggyImageUrl = 'https://cdn.jsdelivr.net/gh/kalegd/digitalbacon-plugins@latest/textures/Digital_Bacon_Piggy.jpg';
var piggyTexture;

const vector3s = [new THREE.Vector3(), new THREE.Vector3()];
const supportedFields = new Set([CheckboxField, ColorField, EulerField, NumberField, Vector2Field, Vector3Field]);
const assetEntityParameters = ['position', 'rotation', 'scale', 'renderOrder'];

export default class AnimationPath extends CustomAssetEntity {
    constructor(params = {}) {
        params['assetId'] = AnimationPath.assetId;
        super(params);
        this._animatedAssets = new Set();
        this._keyframes = new Set();
        this._interpolations = new Set();
        if(params['animatedAssets']) this.animatedAssets
            = params['animatedAssets'];
        if(params['keyframes']) this.keyframes = params['keyframes'];
        if(params['interpolations'])
            this.interpolations = params['interpolations'];
    }

    _getDefaultName() {
        return AnimationPath.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['animatedAssets'] = this.animatedAssets;
        params['keyframes'] = this.keyframes;
        params['interpolations'] = this.interpolations;
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

    get interpolations() {
        let interpolationIds = [];
        for(let interpolation of this._interpolations) {
            interpolationIds.push(interpolation.id);
        }
        return interpolationIds;
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

    set interpolations(interpolations) {
        for(let interpolationId of interpolations) {
            this.addInterpolation(interpolationId);
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

    addInterpolation(interpolationId) {
        let interpolation = ProjectHandler.getAsset(interpolationId);
        if(!interpolation) return;
        this._interpolations.add(interpolation);
        interpolation.registerAnimationPath(this);
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

    removeInterpolation(interpolationId) {
        this._interpolations.push(interpolationId);
        let interpolation = ProjectHandler.getAsset(interpolationId);
        if(!interpolation) return;
        this._interpolations.delete(interpolation);
    }

    static assetId = '2d227485-0b34-40a4-873d-2a0782d034c6';
    static assetName = 'Animation Path';
}

ProjectHandler.registerAsset(AnimationPath);

class Keyframe extends CustomAssetEntity {
    constructor(params = {}) {
        params['assetId'] = Keyframe.assetId;
        super(params);
        this._time = numberOr(params['time'], 1);
        this.parameters = {};
        if(params['parameters']) this.setParameters(params['parameters']);
    }

    _createMesh() {
        if(!piggyTexture) {
            piggyTexture = new THREE.TextureLoader().load(PiggyImageUrl);
            piggyTexture.repeat.x = 5;
            piggyTexture.repeat.y = 2.5;
            piggyTexture.offset.x = -3.25;
            piggyTexture.offset.y = -0.75;
            piggyTexture.colorSpace = THREE.SRGBColorSpace;
        }
        let geometry = new THREE.SphereGeometry(0.05);
        let material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: piggyTexture,
        });
        this._mesh = new THREE.Mesh(geometry, material);
        this._object.add(this._mesh);
    }

    _getDefaultName() {
        return Keyframe.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['time'] = this._time;
        params['parameters'] = this.parameters;
        return params;
    }

    get time() { return this._time; }

    set time(time) {
        this._time = time;
    }

    addParameter(field, id) {
        this.parameters[id] = field;
        if(assetEntityParameters.includes(field.parameter)) {
            if(!this._mesh) this._createMesh();
            return;
        }
        Object.defineProperty(this, field.parameter, {
            get: function() {
                return field.value;
            }, set: function(value) {
                field.value = value;
            }
        });
    }

    setParameters(parameters) {
        for(let id in parameters) {
            this.addParameter(parameters[id], id);
        }
    }

    registerAnimationPath(animationPath) {
        this._object.visible = true;
        this._animationPath = animationPath;
        this.visualEdit = animationPath.visualEdit;
    }

    unregisterAnimationPath(animationPath) {
        if(animationPath != this._animationPath) return;
        this._object.visible = false;
        this._animationPath = null;
        this.visualEdit = false;
    }

    static assetId = KEYFRAME_ID;
    static assetName = 'Keyframe';
    static isPrivate = true;
}

ProjectHandler.registerAsset(Keyframe);
LibraryHandler.loadPrivate(Keyframe);

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
                "newOptionsFunction": ()=>[KEYFRAME_ID],
                "type": AssetSetField },
            "position",
            "rotation",
            "scale",
        ];
    }

    class KeyframeHelper extends CustomAssetEntityHelper {
        constructor(asset) {
            super(asset);
            this._addParameterFields();
        }

        addParameter() {
            let animatedAssets = this._asset._animationPath?._animatedAssets;
            if(animatedAssets?.size) {
                let params = {};
                for(let asset of animatedAssets) {
                    let editorHelper = asset.editorHelper;
                    this._loadAssetParams(params, editorHelper.constructor);
                }
                let menuController = getMenuController();
                let page = menuController.getPage('ASSET_SELECT');
                page.setContent(params, (id) => {
                    let field = params[id];
                    if(field.parameter == 'position')
                        this._setPositionFromMenu();
                    this._asset.addParameter(field, id);
                    let input;
                    if(this._menuFieldsMap[field.parameter]) {
                        input = this._menuFieldsMap[field.parameter];
                    } else {
                        input = this._createStandardField(field);
                        this._menuFieldsMap[field.parameter] = input;
                    }
                    menuController.back();
                    let assetPage = menuController.getCurrentPage();
                    assetPage._removeCurrentFields();
                    this._menuFields.splice(this._menuFields.length -1,0,input);
                    assetPage.setAsset(this._asset, true);
                    let menuFieldsLength = this._menuFields.length;
                    while(assetPage._lastItemIndex + 1 != menuFieldsLength) {
                        assetPage._loadNextPage();
                    }
                });
                menuController.pushPage('ASSET_SELECT');
            } else {
                PubSub.publish(this._id, 'MENU_NOTIFICATION',
                    { text: 'Please add an asset to the animation path first'});
            }
        }

        _addParameterFields() {
            for(let id in this._asset.parameters) {
                let field = this._asset.parameters[id];
                if(!this._menuFields) this.getMenuFields();
                let input;
                if(this._menuFieldsMap[field.parameter]) {
                    input = this._menuFieldsMap[field.parameter];
                } else {
                    input = this._createStandardField(field);
                    this._menuFieldsMap[field.parameter] = input;
                }
                this._menuFields.splice(this._menuFields.length - 1, 0, input);
            }
        }

        _loadAssetParams(params, helperClass) {
            if(!helperClass) return;
            let parentClass = Object.getPrototypeOf(helperClass);
            this._loadAssetParams(params, parentClass);
            if(!helperClass.fields) return;
            for(let field of helperClass.fields) {
                if(typeof field == 'string' || !supportedFields.has(field.type)
                        || field.parameter == 'visualEdit') {
                    continue;
                }
                let id = field.type.name + ':' + field.parameter;
                if(id in params || id in this._asset.parameters) {
                    continue;
                } else {
                    params[id] = this._cloneField(field);
                }
            }
        }

        _cloneField(field) {
            let fieldCopy = {};
            for(let attribute in field) {
                fieldCopy[attribute] = field[attribute];
            }
            fieldCopy['Name'] = fieldCopy['name'];
            fieldCopy.type = fieldCopy.type.name;
            return fieldCopy;
        }

        _setPositionFromMenu() {
            let menuController = getMenuController();
            menuController.getPosition(vector3s[0]);
            menuController.getDirection(vector3s[1]).normalize()
                .divideScalar(4);
            vector3s[0].sub(vector3s[1]).roundWithPrecision(5);
            let position = vector3s[0].toArray();
            this._asset.position = position;
        }

        static fields = [
            { "parameter": "time", "name": "Time", "min": 0,
                "type": NumberField },
            { "parameter": "addParameter", "name": "Add Parameter",
                "type": ButtonField },
        ];
    }

    EditorHelperFactory.registerEditorHelper(AnimationPathHelper,
        AnimationPath);
    EditorHelperFactory.registerEditorHelper(KeyframeHelper,
        Keyframe);
}
