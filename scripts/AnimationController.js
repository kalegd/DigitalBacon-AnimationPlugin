const { Assets, DigitalBaconUI, ProjectHandler, THREE, dynamicAssets, getMenuController, isEditor } = window.DigitalBacon;
const { CustomAssetEntity } = Assets;

const vector3s = [new THREE.Vector3(), new THREE.Vector3()];
const ANIMATION_PATH_ID = '2d227485-0b34-40a4-873d-2a0782d034c6';
const hoveredButtonStyle = new DigitalBaconUI.Style({ materialColor: 0x63666b});

export default class AnimationController extends CustomAssetEntity {
    constructor(params = {}) {
        params['assetId'] = AnimationController.assetId;
        super(params);
        if(!isEditor()) return;
        this._createMesh();
        this._speed = 1;
    }

    _getDefaultName() {
        return AnimationController.assetName;
    }

    _createMesh() {
        let body = new DigitalBaconUI.Body({
            height: 0.3,
            materialColor: 0x000000,
            width: 0.45,
        });
        let startButton = new DigitalBaconUI.Div({
            backgroundVisible: true,
            borderRadius: 0.01,
            height: 0.035,
            justifyContent: 'center',
            materialColor: 0x969696,
            width: 0.3,
        });
        let startText = new DigitalBaconUI.Text('Start Preview', {
            color: 0xffffff,
            fontSize: 0.019,
        });
        let seekRow = this._createNumberRow('Seek', (text) => {
            let assets = ProjectHandler.getAssets();
            let pathAssets = [];
            let value = Number.parseFloat(text);
            for(let id in assets) {
                if(assets[id].assetId == ANIMATION_PATH_ID)
                    assets[id]._setTime(value);
            }
        });
        let speedRow = this._createNumberRow('Speed', (text) => {
            let assets = ProjectHandler.getAssets();
            let pathAssets = [];
            let value = Number.parseFloat(text);
            this._speed = value || 1;
        });
        startButton.add(startText);
        body.add(startButton);
        body.add(seekRow);
        body.add(speedRow);
        this._object.add(body);
        startButton.onClickAndTouch = () => this._startPreview();
        startButton.pointerInteractable.addHoveredCallback((hovered) => {
            if(hovered) {
                startButton.addStyle(hoveredButtonStyle);
            } else {
                startButton.removeStyle(hoveredButtonStyle);
            }
        });
    }

    _createNumberRow(title, onChange) {
        let row = new DigitalBaconUI.Span();
        let label = new DigitalBaconUI.Text(title, {
            color: 0xffffff,
            fontSize: 0.019,
        });
        let numberInput = new DigitalBaconUI.NumberInput({
            fontSize: 0.019,
            height: 0.03,
            width: 0.17,
        });
        numberInput.onChange = onChange;
        numberInput.onEnter = () => numberInput.blur();
        row.add(label);
        row.add(numberInput);
        return row;
    }

    setPositionFromMenu() {
        let menuController = getMenuController();
        menuController.getPosition(vector3s[0]);
        menuController.getDirection(vector3s[1]).normalize()
            .divideScalar(4);
        vector3s[0].sub(vector3s[1]).roundWithPrecision(5);
        let position = vector3s[0].toArray();
        this.position = position;
        this.parent.object.worldToLocal(this.object.position);
    }

    registerAnimationPathClass(animationPathClass) {
        this._animationPathClass = animationPathClass;
    }

    _startPreview() {
        let assets = ProjectHandler.getAssets();
        this._pathAssets = [];
        this._maxTime = 0;
        for(let id in assets) {
            if(assets[id].assetId == ANIMATION_PATH_ID) {
                this._pathAssets.push(assets[id]);
                this._maxTime = Math.max(this._maxTime, assets[id]._maxTime);
            }
        }
        if(this._pathAssets.length == 0) return;
        this._time = 0;
        this._reverse = false;
        dynamicAssets.add(this);
    }

    update(timeDelta) {
        this._time += this._speed * ((this._reverse) ? -timeDelta : timeDelta);
        if(this._time > this._maxTime) {
            this._reverse = true;
        } else if(this._time < 0) {
            this._time = 0;
        }
        for(let asset of this._pathAssets) {
            asset._setTime(this._time);
        }
        if(this._time == 0) {
            dynamicAssets.delete(this);
        }
    }

    static assetId = 'd4706106-d21d-4933-a665-6c5f3b6cb383';
    static assetName = 'Animation Controller';
    static isPrivate = true;
}
