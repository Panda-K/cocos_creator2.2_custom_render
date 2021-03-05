// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        imgNoise: {
            // ATTRIBUTES:
            default: null, 
            type: cc.Sprite, 
        },

        btnSave : {default : null, type : cc.Node},
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.initImg()
    },

    start () {

    },

    //__len : 像素数量
    genImgData : function (__len) {
        let imgData = []

        for (let i = 0; i < __len; i++) {
        // for (let i = __len-1; i >= 0; i--) {
            let pixData = {}
            pixData.r = i%255
            pixData.g = i%255
            pixData.b = i%255
            pixData.a = 255
            imgData[imgData.length] = pixData
        }

        let i = 0;
        let data = new Uint8Array(__len*4);
        imgData.forEach((element)=>{
            data[i++] = element.r;
            data[i++] = element.g;
            data[i++] = element.b;
            data[i++] = element.a;
        });

        return data
    },
    //生成图片
    initImg : function () {
        let texture = new cc.RenderTexture();
        let w = this.imgNoise.node.width
        let h = this.imgNoise.node.height
        let real_w =  1024
        let real_h = 1024

        let data = this.genImgData(real_w*real_h)
        texture.initWithData(data, cc.Texture2D.PixelFormat.RGBA8888, real_w, real_h, cc.size(real_w, real_h));
        let spriteFrame = new cc.SpriteFrame();
        spriteFrame.setTexture(texture);
        this.imgNoise.spriteFrame = spriteFrame;
    },

    hash22(p){
        p = cc.v2(p.dot(cc.v2(127.1, 311.7)),
                  p.dot(cc.v2(269.5, 183.3))
                );

        let vRes = cc.v2(0, 0)
        vRes.x = -1.0 + 2.0 * this.fract(Math.sin(p.x)*43758.5453123);
        vRes.y = -1.0 + 2.0 * this.fract(Math.sin(p.y)*43758.5453123);
        return vRes
    },
    fract(__num){
        return __num - Math.floor(__num)
    },

    perlin_noise(p){
        let pi = floor(p);
        let pf = p - pi;

        let w = pf * pf * (3.0 - 2.0 * pf);

        return mix(mix(dot(hash22(pi + vec2(0.0, 0.0)), pf - vec2(0.0, 0.0)), 
                    dot(hash22(pi + vec2(1.0, 0.0)), pf - vec2(1.0, 0.0)), w.x), 
                mix(dot(hash22(pi + vec2(0.0, 1.0)), pf - vec2(0.0, 1.0)), 
                    dot(hash22(pi + vec2(1.0, 1.0)), pf - vec2(1.0, 1.0)), w.x),
                w.y);
    },
    // update (dt) {},

    onBtnClick : function (__event) {
        if (__event.target.name == "btnSave") {
            this.onSaveImg()
        }  
    },

    onSaveImg : function () {
        if (jsb) {
            let w = this.imgNoise.node.width
            let h = this.imgNoise.node.height
            let real_w = 1024
            let real_h = 1024
            
            var data = this.genImgData(real_w*real_h)
            var filePath = jsb.fileUtils.getWritablePath() + 'NoiseImage.png';
            console.log("onSaveImg === ", filePath)
            jsb.saveImageData(data, real_w, real_h, filePath)
        }
    }
});
