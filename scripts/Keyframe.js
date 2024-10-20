import ColorInterpolation from 'http://localhost:8000/scripts/ColorInterpolation.js';
import EulerInterpolation from 'http://localhost:8000/scripts/EulerInterpolation.js';
import NumberInterpolation from 'http://localhost:8000/scripts/NumberInterpolation.js';
import PositionInterpolation from 'http://localhost:8000/scripts/PositionInterpolation.js';
import RotationInterpolation from 'http://localhost:8000/scripts/RotationInterpolation.js';
import ScaleInterpolation from 'http://localhost:8000/scripts/ScaleInterpolation.js';
import StepInterpolation from 'http://localhost:8000/scripts/StepInterpolation.js';
import TextInterpolation from 'http://localhost:8000/scripts/TextInterpolation.js';
import VectorInterpolation from 'http://localhost:8000/scripts/VectorInterpolation.js';

const { Assets, EditorHelpers, LibraryHandler, ProjectHandler, PubSub, THREE, getMenuController, isEditor, utils } = window.DigitalBacon;
const { CustomAssetEntity } = Assets;
const { CustomAssetEntityHelper, EditorHelperFactory } = EditorHelpers;
const { AssetSetField, ButtonField, CheckboxField, ColorField, EulerField, NumberField, TextField, Vector2Field, Vector3Field } = CustomAssetEntityHelper.FieldTypes;
const { numberOr } = utils;

const PiggyImageUrl = 'https://cdn.jsdelivr.net/gh/kalegd/digitalbacon-plugins@latest/textures/Digital_Bacon_Piggy.jpg';
var piggyTexture, geometry, material;

const vector3s = [new THREE.Vector3(), new THREE.Vector3()];
const supportedFields = new Set([CheckboxField, ColorField, EulerField, NumberField, TextField, Vector2Field, Vector3Field]);
const assetEntityParameters = ['position', 'rotation', 'scale', 'renderOrder'];
const parameterToAssetId = {
    position: PositionInterpolation.assetId,
    rotation: RotationInterpolation.assetId,
    scale: ScaleInterpolation.assetId,
};
const fieldToAssetId = {
    ColorField: ColorInterpolation.assetId,
    EulerField: EulerInterpolation.assetId,
    NumberField: NumberInterpolation.assetId,
    TextField: TextInterpolation.assetId,
    Vector2Field: VectorInterpolation.assetId,
    Vector3Field: VectorInterpolation.assetId,
};

export default class Keyframe extends CustomAssetEntity {
    constructor(params = {}) {
        params['assetId'] = Keyframe.assetId;
        super(params);
        this._time = numberOr(params['time'], 0);
        this.parameters = {};
        this._interpolations = new Set();
        this._parameterInterpolations = {};
        if(params['parameters']) this.setParameters(params['parameters']);
        if(params['interpolations'])
            this.interpolations = params['interpolations'];
    }

    _getDefaultName() {
        return Keyframe.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['time'] = this._time;
        params['parameters'] = this.parameters;
        params['interpolations'] = this.interpolations;
        params['parentId'] = null;
        return params;
    }

    get interpolations() {
        let interpolationIds = [];
        for(let interpolation of this._interpolations) {
            interpolationIds.push(interpolation.id);
        }
        return interpolationIds;
    }

    get position() { return super.position; }
    get time() { return this._time; }

    set interpolations(interpolations) {
        for(let interpolationId of interpolations) {
            this.addInterpolation(interpolationId);
        }
    }

    set position(position) {
        super.position = position;
        if(this._animationPath)
            this._animationPath.onKeyframePositionUpdate(this);
    }

    set time(time) {
        this._time = time;
        if(this._animationPath) this._animationPath.updateKeyframes();
    }

    addInterpolation(interpolationId) {
        let interpolation = ProjectHandler.getAsset(interpolationId);
        if(!interpolation) return;
        this._interpolations.add(interpolation);
        interpolation.registerKeyframe(this);
        this._parameterInterpolations[interpolation.parameter] = interpolation;
        if(this.editorHelper && !(interpolation.parameter in this.parameters)) {
            this.editorHelper.addParameter(interpolation.parameter);
            if(this._animationPath) this._animationPath.updateKeyframes();
        }
    }

    addParameter(field, id) {
        this.parameters[id] = field;
        if(this._animationPath) this._animationPath.updateKeyframes();
        if(assetEntityParameters.includes(field.parameter)) {
            if(isEditor() && this._animationPath) {
                let asset = this._animationPath._animatedAssets.values().next()
                    .value;
                if(asset) this[field.parameter] = asset[field.parameter];
            }
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
        let interpolation = ProjectHandler.getSessionAsset(interpolationId);
        this._interpolations.delete(interpolation);
        if(!interpolation) return;
        let parameter = interpolation.parameter;
        delete this.parameters[parameter];
        if(this.editorHelper) this.editorHelper.deleteParameter(parameter);
        if(parameter == 'position') {
            interpolation.hideCurve();
            if(this._animationPath) this._animationPath.updateKeyframes();
        }
    }

    setParameters(parameters) {
        for(let id in parameters) {
            this.addParameter(parameters[id], id);
        }
    }

    registerAnimationPath(animationPath) {
        if(this.editorHelper)
            this.editorHelper.updateVisualEdit(this.visualEdit);
        this._animationPath = animationPath;
        this.addTo(animationPath);
        for(let interpolation of this._interpolations) {
            interpolation.registerKeyframe(this);
        }
    }

    interpolate(parameter, time, nextKeyframe) {
        let interpolation = this._parameterInterpolations[parameter];
        return interpolation.getValue(time, nextKeyframe);
    }

    onAddToProject() {
        if(this._animationPath) this._animationPath.addKeyframe(this._id);
    }

    onRemoveFromProject() {
        super.onRemoveFromProject();
        this._animationPath.removeKeyframe(this._id);
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
            this._createMesh();
        }

        _addParameter() {
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
                    this._asset.addParameter(field, id);
                    if(id == 'position' && this._asset.visualEdit)
                        this._object.add(this._mesh);
                    let input;
                    if(this._menuFieldsMap[field.parameter]) {
                        input = this._menuFieldsMap[field.parameter];
                    } else {
                        input = this._createStandardField(field);
                        this._menuFieldsMap[field.parameter] = input;
                    }
                    menuController.back();
                    let assetPage = menuController.getCurrentPage();
                    assetPage._setFields([]);
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

        addParameter(parameter) {
            let animatedAssets = this._asset._animationPath?._animatedAssets;
            if(!animatedAssets?.size) return;
            let params = {};
            for(let asset of animatedAssets) {
                let editorHelper = asset.editorHelper;
                this._loadAssetParams(params, editorHelper.constructor);
            }
            let field = params[parameter];
            if(!field) return;
            this._asset.parameters[parameter] = field;
            let menuController = getMenuController();
            let assetPage = menuController.getPage('CUSTOM_ASSET');
            let pageUpdate = menuController.getCurrentPage() == assetPage
                && assetPage._asset == this._asset;
            if(pageUpdate) assetPage._setFields([]);
            let input;
            if(this._menuFieldsMap[parameter]) {
                input = this._menuFieldsMap[parameter];
            } else {
                input = this._createStandardField(field);
                this._menuFieldsMap[field.parameter] = input;
            }
            if(input)
                this._menuFields.splice(this._menuFields.length - 1, 0, input);
            if(pageUpdate) assetPage.setAsset(this._asset, true);
            if(parameter == 'position')
                this.updateVisualEdit(this._asset.visualEdit);
        }

        deleteParameter(parameter) {
            let menuController = getMenuController();
            let assetPage = menuController.getPage('CUSTOM_ASSET');
            let pageUpdate = menuController.getCurrentPage() == assetPage
                && assetPage._asset == this._asset;
            if(pageUpdate) assetPage._setFields([]);
            let input = this._menuFieldsMap[parameter];
            let index = this._menuFields.indexOf(input);
            if(input && index >= 0) this._menuFields.splice(index, 1);
            if(pageUpdate) assetPage.setAsset(this._asset, true);
            if(parameter == 'position')
                this.updateVisualEdit(this._asset.visualEdit);
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
            if(field.parameter in parameterToAssetId) {
                assetId = parameterToAssetId[field.parameter];
            } else if(field.type in fieldToAssetId) {
                assetId = fieldToAssetId[field.type];
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
                let id = field.parameter;
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

        _createMesh() {
            if(!piggyTexture) {
                piggyTexture = new THREE.TextureLoader().load(PiggyImageUrl);
                piggyTexture.repeat.x = 5;
                piggyTexture.repeat.y = 2.5;
                piggyTexture.offset.x = -3.25;
                piggyTexture.offset.y = -0.75;
                piggyTexture.colorSpace = THREE.SRGBColorSpace;
                geometry = new THREE.SphereGeometry(0.05);
                material = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    map: piggyTexture,
                });
            }
            this._mesh = new THREE.Mesh(geometry, material);
            if(this._asset.visualEdit && this._asset.parameters['position'])
                this._object.add(this._mesh);
        }

        updateVisualEdit(isVisualEdit) {
            if(isVisualEdit && this._asset.parameters['position']){
                this._object.add(this._mesh);
            } else {
                this._object.remove(this._mesh);
            }
            super.updateVisualEdit(isVisualEdit);
        }

        hideMesh() {
            this._object.remove(this._mesh);
            let interpolation =this._asset._parameterInterpolations['position'];
            if(interpolation) interpolation.hideCurve();
        }

        static fields = [
            "visualEdit",
            { "parameter": "time", "name": "Time", "min": 0,
                "type": NumberField },
            { "parameter": "interpolations", "name": "Interpolations",
                "addFunction": "addInterpolation",
                "removeFunction": "removeInterpolation",
                "type": AssetSetField },
            { "parameter": "_addParameter", "name": "Add Parameter",
                "type": ButtonField },
        ];
    }

    EditorHelperFactory.registerEditorHelper(KeyframeHelper, Keyframe);
}
