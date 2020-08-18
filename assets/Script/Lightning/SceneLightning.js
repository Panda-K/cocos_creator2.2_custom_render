cc.Class({
    extends: cc.Component,

    properties: {
        label: {
            default: null,
            type: cc.Label
        },
        lightning1: {
            default: null,
            type: cc.Node
        },

        Node_light: {
            default: null,
            type: cc.Animation
        },
        // defaults, set visually when attaching this script to the Canvas
        text: 'Lightning'
    },

    // use this for initialization
    onLoad: function () {
        this.label.string = this.text;
        
        this.m_light1 = this.lightning1.getComponent("LightningSprite")

        this.Node_light.playAdditive("anim_clip_lightningFlash")
    },

    // called every frame
    update: function (dt) {

    },

    OnLight1Finish : function () {
        this.m_light1.FlushProperties()
    },
});
