cc.Class({
    extends: cc.Component,

    properties: {
        btnForce: {
            default: null,
            type: cc.Button
        },

        imgMass: {
            default: null,
            type: cc.Node
        },
        
        // defaults, set visually when attaching this script to the Canvas
        text: 'Hello, World!'
    },

    // use this for initialization
    onLoad: function () {
        this.m_massObj = this.imgMass.getComponent("MassSpringSprite")
        this.imgMass.on(cc.Node.EventType.TOUCH_END, this.onBtnClick, this)
    },

    // called every frame
    update: function (dt) {

    },

    onBtnClick : function () {
        let MaxI = this.m_massObj.pointsCount-1
        let index = Math.floor(this.m_massObj.pointsCount/2)

        let forceNum = this.m_massObj.outForce
        let offSetIndex = 1
        let points = [[0, index], [index, 0], [MaxI, index], [index, MaxI]]
        let points1 = [[index-offSetIndex, index], 
                        [index, index-offSetIndex], 
                        [index+offSetIndex, index], 
                        [index, index+offSetIndex],
                        [index-offSetIndex, index-offSetIndex], 
                        [index+offSetIndex, index-offSetIndex], 
                        [index+offSetIndex, index+offSetIndex], 
                        [index-offSetIndex, index+offSetIndex]]
        let forces = [cc.v2(0, -1*forceNum), cc.v2(-1*forceNum, 0), cc.v2(0, 1*forceNum), cc.v2(1*forceNum, 0)]
        forces[4] = forces[0].add(forces[1]).mul(0.5)
        forces[5] = forces[1].add(forces[2]).mul(0.5)
        forces[6] = forces[2].add(forces[3]).mul(0.5)
        forces[7] = forces[3].add(forces[0]).mul(0.5)

        for (let i = 0; i < 8; i++) {
            let element = points1[i];
            let force = forces[i].neg()
            this.m_massObj.applyOtherForce(element, force)
        }
    },
});
