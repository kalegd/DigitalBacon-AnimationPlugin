const { Assets, EditorHelpers, LibraryHandler, ProjectHandler, PubSub, THREE, getMenuController, isEditor, utils } = window.DigitalBacon;
const { CustomAssetEntity } = Assets;
const { CustomAssetEntityHelper, EditorHelperFactory } = EditorHelpers;
const { AssetSetField, ButtonField, CheckboxField, ColorField, EulerField, NumberField, TextField, Vector2Field, Vector3Field } = CustomAssetEntityHelper.FieldTypes;

const vector3s = [new THREE.Vector3(), new THREE.Vector3()];
var geometry, material;

export default class ControlPoint extends CustomAssetEntity {
    constructor(params = {}) {
        params['assetId'] = ControlPoint.assetId;
        super(params);
        if(!params['position']) this._setPositionFromMenu();
        if(isEditor()) {
            this._lastPosition = this.position;
            this.update = this._editorUpdate;
        }
    }

    _getDefaultName() {
        return ControlPoint.assetName;
    }

    exportParams() {
        let params = super.exportParams();
        params['parentId'] = null;
        return params;
    }

    _setPositionFromMenu() {
        let menuController = getMenuController();
        menuController.getPosition(vector3s[0]);
        menuController.getDirection(vector3s[1]).normalize()
            .divideScalar(4);
        vector3s[0].sub(vector3s[1]).roundWithPrecision(5);
        let position = vector3s[0].toArray();
        this.position = position;
        this.parent.object.worldToLocal(this.object.position);
    }

    registerInterpolation(interpolation) {
        this._object.visible = true;
        this._interpolation = interpolation;
        let animationPath = interpolation._keyframe?._animationPath;
        if(animationPath) this.addTo(animationPath);
    }

    _editorUpdate() {
        let position = this.position;
        for(let i = 0; i < 3; i++) {
            if(position[i] != this._lastPosition[i]) {
                this._lastPosition = position;
                if(this._interpolation) this._interpolation.updateCurve();
                true;
            }
        }
    }

    static assetId = 'dedf4341-660f-46aa-b8d1-2c3c2ea3d534';
    static assetName = 'Control Point';
    static isPrivate = true;
}

ProjectHandler.registerAsset(ControlPoint);
LibraryHandler.loadPrivate(ControlPoint);

if(EditorHelpers) {
    class ControlPointHelper extends CustomAssetEntityHelper {
        constructor(asset) {
            super(asset);
            this._createMesh();
        }

        _createMesh() {
            if(!geometry) {
                geometry = new THREE.SphereGeometry(0.025);
                material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            }
            this._mesh = new THREE.Mesh(geometry, material);
            if(this._asset.visualEdit) this._object.add(this._mesh);
        }

        updateVisualEdit(isVisualEdit) {
            if(isVisualEdit) {
                this._object.add(this._mesh);
            } else {
                this._object.remove(this._mesh);
            }
            super.updateVisualEdit(isVisualEdit);
        }

        static fields = [
            "visualEdit",
            "position"
        ];
    }

    EditorHelperFactory.registerEditorHelper(ControlPointHelper, ControlPoint);
}
