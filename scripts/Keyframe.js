import NumberInterpolation from 'http://localhost:8000/scripts/NumberInterpolation.js';
import PositionInterpolation from 'http://localhost:8000/scripts/PositionInterpolation.js';
import StepInterpolation from 'http://localhost:8000/scripts/StepInterpolation.js';

const { Assets, EditorHelpers, LibraryHandler, ProjectHandler, PubSub, THREE, getMenuController, isEditor, utils } = window.DigitalBacon;
const { CustomAssetEntity } = Assets;
const { CustomAssetEntityHelper, EditorHelperFactory } = EditorHelpers;
const { AssetSetField, ButtonField, CheckboxField, ColorField, EulerField, NumberField, Vector2Field, Vector3Field } = CustomAssetEntityHelper.FieldTypes;
const { numberOr } = utils;

const PiggyImageUrl = 'https://cdn.jsdelivr.net/gh/kalegd/digitalbacon-plugins@latest/textures/Digital_Bacon_Piggy.jpg';
var piggyTexture;

const vector3s = [new THREE.Vector3(), new THREE.Vector3()];
const supportedFields = new Set([CheckboxField, ColorField, EulerField, NumberField, Vector2Field, Vector3Field]);
const assetEntityParameters = ['position', 'rotation', 'scale', 'renderOrder'];

export default class Keyframe extends CustomAssetEntity {
    constructor(params = {}) {
        params['assetId'] = Keyframe.assetId;
        super(params);
        this._time = numberOr(params['time'], 1);
        this.parameters = {};
        this._interpolations = new Set();
        this._parameterInterpolations = {};
        if(params['parameters']) this.setParameters(params['parameters']);
        if(params['interpolations'])
            this.interpolations = params['interpolations'];
    }

    _createMesh() {
        if(!isEditor()) return;
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
        params['interpolations'] = this.interpolations;
        return params;
    }

    get interpolations() {
        let interpolationIds = [];
        for(let interpolation of this._interpolations) {
            interpolationIds.push(interpolation.id);
        }
        return interpolationIds;
    }

    get time() { return this._time; }

    set interpolations(interpolations) {
        for(let interpolationId of interpolations) {
            this.addInterpolation(interpolationId);
        }
    }

    set time(time) {
        this._time = time;
    }

    addInterpolation(interpolationId) {
        let interpolation = ProjectHandler.getAsset(interpolationId);
        if(!interpolation) return;
        this._interpolations.add(interpolation);
        interpolation.registerKeyframe(this);
        this._parameterInterpolations[interpolation.parameter] = interpolation;
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

    removeInterpolation(interpolationId) {
        this._interpolations.push(interpolationId);
        let interpolation = ProjectHandler.getAsset(interpolationId);
        if(!interpolation) return;
        this._interpolations.delete(interpolation);
    }

    setParameters(parameters) {
        for(let id in parameters) {
            this.addParameter(parameters[id], id);
        }
    }

    registerAnimationPath(animationPath) {
        this._object.visible = true;
        this._animationPath = animationPath;
        this.parentId = animationPath.id;
        this.visualEdit = animationPath.visualEdit;
    }

    unregisterAnimationPath(animationPath) {
        if(animationPath != this._animationPath) return;
        this._object.visible = false;
        this._animationPath = null;
        this.visualEdit = false;
    }

    interpolate(parameter, time, nextKeyframe) {
        let interpolation = this._parameterInterpolations[parameter];
        return interpolation.getValue(time, nextKeyframe);
    }

    static assetId = '401fcf91-49ef-480b-992d-e55ac0c65d4e';
    static assetName = 'Keyframe';
    static isPrivate = true;
}

ProjectHandler.registerAsset(Keyframe);
LibraryHandler.loadPrivate(Keyframe);

if(EditorHelpers) {
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
                    this._createInterpolation(field);
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

        _createInterpolation(field) {
            let assetId;
            let params = {
                parameter: field.parameter,
                name: field.name,
            };
            if(field.parameter == 'position') {
                assetId = PositionInterpolation.assetId;
            } else if(field.parameter == 'rotation') {
                assetId = StepInterpolation.assetId;
            } else if(field.type == 'NumberField') {
                assetId = NumberInterpolation.assetId;
            } else if(field.type == 'ColorField') {
                assetId = StepInterpolation.assetId;
            } else {
                assetId = StepInterpolation.assetId;
            }
            let interpolation = ProjectHandler.addNewAsset(assetId, params);
            this._asset.addInterpolation(interpolation.id);
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
            this._asset.parent.object.worldToLocal(this._asset.object.position);
        }

        static fields = [
            { "parameter": "time", "name": "Time", "min": 0,
                "type": NumberField },
            { "parameter": "interpolations", "name": "Interpolations",
                "addFunction": "addInterpolation",
                "removeFunction": "removeInterpolation",
                "type": AssetSetField },
            { "parameter": "addParameter", "name": "Add Parameter",
                "type": ButtonField },
        ];
    }

    EditorHelperFactory.registerEditorHelper(KeyframeHelper, Keyframe);
}
