cc.Class({
    extends: cc.Component,

    properties: {
        spPlayer : {
            default: null,        
            type: cc.Node, 
        },

        spFog : {
            default: null,        
            type: cc.Sprite, 
        },

        spBlocksArr : {
            default: [],        
            type: cc.Node, 
        },

        spEnemysArr : {
            default: [],        
            type: cc.Node, 
        },

        Node_all : {
            default: null,        
            type: cc.Node, 
        },
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.Node_all.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this)
        this.material = this.spFog.getMaterial(0);
    
        this.initParams()
    },

    initParams : function () {
        this.m_blocksPos = []
        this.m_speed = 500
        this.m_curDir = cc.v2(0, 0)
        this.m_endPos = this.m_prePos = this.m_curPos = cc.v2(480, 480)
        this.resetMaterial(this.m_curPos)
        this.checkEnemyVisible(this.m_curPos)
    },

    start () {

    },

    update (dt) {
        if (Math.abs(this.m_curPos.x-this.m_endPos.x) < 10 && Math.abs(this.m_curPos.y-this.m_endPos.y) < 10) {
            return
        }
        let deltDis = this.m_curDir.mul(this.m_speed*dt)
        this.m_prePos = this.m_curPos
        this.m_curPos.addSelf(deltDis)

        this.resetMaterial(this.m_curPos)
        this.checkEnemyVisible(this.m_curPos)
    },

    onTouchEnd : function (__event) {
        let curPos = __event.getLocation()
        this.m_endPos = curPos
        this.m_curDir = this.m_endPos.sub(this.m_curPos).normalize()
    },

    resetMaterial : function (curPos) {
        this.spPlayer.setPosition(curPos)

        let pX = curPos.x
        let pY = this.node.height - curPos.y

        this.material.setProperty('u_playerPos', [ pX / this.node.width, pY / this.node.height]);

        this.m_blocksPos = []
        for (let i = 0; i < 8; i++) {
            let dis2 = (this.spBlocksArr[i].x - curPos.x)*(this.spBlocksArr[i].x - curPos.x) + (this.spBlocksArr[i].y - curPos.y)*(this.spBlocksArr[i].y - curPos.y)
            if (dis2 < 195*195) {
                this.m_blocksPos[this.m_blocksPos.length] = this.spBlocksArr[i].x/this.node.width;
                this.m_blocksPos[this.m_blocksPos.length] = (this.node.height-this.spBlocksArr[i].y)/this.node.height;
            }
            else {
                this.m_blocksPos[this.m_blocksPos.length] = -1
                this.m_blocksPos[this.m_blocksPos.length] = -1
            }
        } 
        this.material.setProperty('u_blocksPos', new Float32Array(16));
        this.material.setProperty('u_blocksPos', this.m_blocksPos);
    },

    checkEnemyVisible : function (curPos) {
        for (let i = 0; i < 8; i++) {
            let dis2 = (this.spEnemysArr[i].x - curPos.x)*(this.spEnemysArr[i].x - curPos.x) + (this.spEnemysArr[i].y - curPos.y)*(this.spEnemysArr[i].y - curPos.y)
            if (dis2 < 195*195) {
                this.spEnemysArr[i].active = true
            }
            else {
                this.spEnemysArr[i].active = false
            }
        } 
    },
});
