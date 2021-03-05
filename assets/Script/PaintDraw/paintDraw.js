cc.Class({
    extends: cc.Component,

    properties: {
        imgSp : {default: null, type: cc.Sprite},
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.imgSp.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
        this.material = this.imgSp.getMaterial(0);
    },

    onTouchMove : function (__touch) {
        let sp_w = this.imgSp.node.width
        let sp_h = this.imgSp.node.height
        let pos = __touch.getLocation() || cc.v2(0, 0)

        this.material.setProperty('p_pos', [pos.x/sp_w, (sp_h - pos.y)/sp_h]);
    }
    // update (dt) {},
});
