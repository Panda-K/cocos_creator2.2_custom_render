import WJMultiAssembler from "./WJMultiAssembler";
const {ccclass, property} = cc._decorator;

@ccclass
export default class LightningSprite extends cc.Sprite {
    @property
    set EndPos(value) {
        this._EndPos = value;
        this.FlushProperties();
    }
    get EndPos() {
        return this._EndPos;
    }
    @property
    _EndPos = cc.v2(800, 0);      //闪电长度


    public FlushProperties() {
        //@ts-ignore
        let assembler = this._assembler;
        if (!assembler)
            return;

        assembler.m_endPos = this._EndPos;
        assembler.genSegs()
        this.setVertsDirty();
    }

    onEnable () {
        super.onEnable();
    }

    _resetAssembler() {
        this.setVertsDirty();
        let assembler = this._assembler = new WJMultiAssembler();
        this.FlushProperties();

        assembler.init(this);

        //@ts-ignore
        this._updateColor();
    }
}
