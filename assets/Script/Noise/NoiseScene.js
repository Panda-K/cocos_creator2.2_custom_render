let DEFAULT_W = 512
let HASH_LEN = 512
cc.Class({
    extends: cc.Component,

    properties: {
        imgNoise: {
            // ATTRIBUTES:
            default: null, 
            type: cc.Sprite, 
        },

        btnSave     : {default : null, type : cc.Node},
        btnUpdate   : {default : null, type : cc.Node},     //刷新
        m_freq : 1/32,  //周期
        m_octs : 3,     //倍频
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.initHashData()
        this.initImg()
    },

    start () {

    },

    //__len : 像素数量
    genImgData : function (__size, __freq, __octs) {
        let imgData = []

        for (let y = 0; y < __size; y++) {
            for (let x = 0; x < __size; x++) {
                let noiseV = this.fBm(x*__freq, y*__freq, Math.floor(__size*__freq), __octs)
                let pixData = {}
                pixData.r = noiseV*255
                pixData.g = noiseV*255
                pixData.b = noiseV*255
                pixData.a = 255
                imgData[imgData.length] = pixData
            }
        }

        let i = 0;
        let data = new Uint8Array(__size*__size*4);
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

        let data = this.genImgData(DEFAULT_W, this.m_freq, this.m_octs)
        texture.initWithData(data, cc.Texture2D.PixelFormat.RGBA8888, DEFAULT_W, DEFAULT_W);
        let spriteFrame = new cc.SpriteFrame();
        spriteFrame.setTexture(texture);
        this.imgNoise.spriteFrame = spriteFrame;
    },

    // update (dt) {},

    onBtnClick : function (__event) {
        if (__event.target.name == "btnSave") {
            this.onSaveImg()
        } else if (__event.target.name == "btnUpdate") {
            this.onUpdateImg()
        } 
    },

    onSaveImg : function () {
        if (jsb) {
            let w = this.imgNoise.node.width
            let h = this.imgNoise.node.height
            
            var data = this.genImgData(DEFAULT_W, this.m_freq, this.m_octs)
            var filePath = jsb.fileUtils.getWritablePath() + 'NoiseImage.png';
            console.log("onSaveImg === ", filePath)
            jsb.saveImageData(data, DEFAULT_W, DEFAULT_W, filePath)
        }
    },

    onUpdateImg : function () {
        this.initHashData()
        this.initImg()
    },

    /////////////////////////////////////////////// Perlin_Noise ///////////////////////////////////////////////////
    //grid hash array
    initHashData : function () {
        let hashTbl = []
        this.m_gradArr = []
        for (let i = 0; i < HASH_LEN; i++) {
            hashTbl[i] = i

            let oneGrad = []
            oneGrad[0] = Math.cos(i * 2.0 * Math.PI/HASH_LEN)
            oneGrad[1] = Math.sin(i * 2.0 * Math.PI/HASH_LEN)
            this.m_gradArr[i] = oneGrad
        }
        hashTbl.sort(function () {
            return 0.5 - Math.random()
        })
        let cloneArr = hashTbl.slice(0)
        this.m_hashTbl = hashTbl.concat(cloneArr)
    },

    //perlin_noise
    perlinNoise : function (x, y, per) {
        let hashTbl = this.m_hashTbl
        let gradArr = this.m_gradArr
        let surflet = function (intX, intY) {
            let fX = Math.abs(x - intX)
            let fY = Math.abs(y - intY)
            let polyX = 1 - fX * fX * fX * (fX * (fX * 6 - 15) + 10)
            let polyY = 1 - fY * fY * fY * (fY * (fY * 6 - 15) + 10)
            let hashIndex = hashTbl[hashTbl[intX%per] + intY%per]
            let grad = (x - intX)*gradArr[hashIndex][0] + (y - intY)*gradArr[hashIndex][1]
            return polyX * polyY * grad
        }
        let iX = Math.floor(x) 
        let iY = Math.floor(y)
        let sumW = surflet(iX+0, iY+0) + surflet(iX+0, iY+1) + 
                    surflet(iX+1, iY+0) + surflet(iX+1, iY+1)
        return (sumW+1)/2.0
    },

    fBm : function (x, y, per, octs) {
        let res = 0
        for (let i = 0; i < octs; i++) {
            let powV = Math.pow(2, i)
            res += Math.pow(0.5, i) * this.perlinNoise(x * powV, y * powV, per * powV)
        }
        return res
    },


});
