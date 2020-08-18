import MassSpringAssembler from "./MassSpringAssembler";
const {ccclass, property} = cc._decorator;

class MassPoint {
    public oldPos:cc.Vec2
    public newPos:cc.Vec2
    public force:cc.Vec2
    public isFix

    constructor(x:number, y:number, tmpF:cc.Vec2, isFix){
        this.oldPos = this.newPos = cc.v2(x, y)
        this.force = tmpF
        this.isFix = isFix || false
    }
}

@ccclass
export default class MassSpringSprite extends cc.Sprite {
    public pointsCount:number = 9
    @property({displayName:"弹性系数"})
    public spForceK:number = 1      //弹性系数
    @property({displayName:"衰减系数"})
    public dampK:number = 0.01           //衰减系数
    @property({displayName:"受力衰减系数"})
    public dampForceK:number = 0.92           //受力衰减系数
    @property({displayName:"外力"})
    public outForce:number = 200           //外力

    private _pointList = []

    onEnable () {
        super.onEnable();
        this.initParams()
        this.initPointList();
        this.draw();
    }

    public update(dt) {
        if (!CC_EDITOR) {
            this.calcAllForce(dt)
            this.calcNewPos(dt)
            this.draw()
        }
    }

    //两点之间的作用力
    public springForceAB(a, b, type){
        let segLen = this.m_segLen
        type = type || 1
        switch (type) {
            case 1:
                segLen = this.m_segLen                  //结构弹簧
                break;
            case 2:
                segLen = this.m_segLen*2                //弯曲弹簧
                break;
            case 3:
                segLen = this.m_segLen*1.414            //剪切弹簧
                break;
        
            default:
                break;
        }
        let vBA = b.newPos.sub(a.newPos)
        let lenBA = vBA.mag()
        let vNormBA = vBA.normalize()
        vBA = vNormBA.mul(lenBA-segLen).mul(this.spForceK)
        return vBA
    }
    //计算所有点的受力
    public calcAllForce(dt) {
        for (let i = 0; i < this.pointsCount; i++) {
            for (let j = 0; j < this.pointsCount; j++) {
                let tmpPoint = this._pointList[i][j]

                //结构弹簧
                let tmpPointL
                let tmpPointR
                let tmpPointB = this._pointList[i][j-1]
                let tmpPointU = this._pointList[i][j+1]
                //剪切弹簧
                let tmpPointRU
                let tmpPointRB
                let tmpPointLU
                let tmpPointLB
                //弯曲弹簧
                let tmpPoint2L
                let tmpPoint2R
                let tmpPoint2B = this._pointList[i][j-2]
                let tmpPoint2U = this._pointList[i][j+2]


                if (this._pointList[i-1]) {
                    tmpPointL = this._pointList[i-1][j]
                    tmpPointLU = this._pointList[i-1][j+1]
                    tmpPointLB = this._pointList[i-1][j-1]
                }
                if (this._pointList[i+1]) {
                    tmpPointR = this._pointList[i+1][j]
                    tmpPointRU = this._pointList[i+1][j+1]
                    tmpPointRB = this._pointList[i+1][j-1]
                }
                if (this._pointList[i-2]) {
                    tmpPoint2L = this._pointList[i-2][j]
                }
                if (this._pointList[i+2]) {
                    tmpPoint2R = this._pointList[i+2][j]
                }

                if (tmpPoint) {
                    let applyForce
                    if (tmpPointL) {
                        applyForce = this.springForceAB(tmpPoint, tmpPointL, 1)
                        tmpPoint.force.addSelf(applyForce)
                    }
                    if (tmpPointR) {
                        applyForce = this.springForceAB(tmpPoint, tmpPointR, 1)
                        tmpPoint.force.addSelf(applyForce)
                    }
                    if (tmpPointB) {
                        applyForce = this.springForceAB(tmpPoint, tmpPointB, 1)
                        tmpPoint.force.addSelf(applyForce)
                    }
                    if (tmpPointU) {
                        applyForce = this.springForceAB(tmpPoint, tmpPointU, 1)
                        tmpPoint.force.addSelf(applyForce)
                    }
                    if (tmpPoint2L) {
                        applyForce = this.springForceAB(tmpPoint, tmpPoint2L, 2)
                        tmpPoint.force.addSelf(applyForce)
                    }
                    if (tmpPoint2R) {
                        applyForce = this.springForceAB(tmpPoint, tmpPoint2R, 2)
                        tmpPoint.force.addSelf(applyForce)
                    }
                    if (tmpPoint2B) {
                        applyForce = this.springForceAB(tmpPoint, tmpPoint2B, 2)
                        tmpPoint.force.addSelf(applyForce)
                    }
                    if (tmpPoint2U) {
                        applyForce = this.springForceAB(tmpPoint, tmpPoint2U, 2)
                        tmpPoint.force.addSelf(applyForce)
                    }
                    if (tmpPointRU) {
                        applyForce = this.springForceAB(tmpPoint, tmpPointRU, 3)
                        tmpPoint.force.addSelf(applyForce)
                    }
                    if (tmpPointRB) {
                        applyForce = this.springForceAB(tmpPoint, tmpPointRB, 3)
                        tmpPoint.force.addSelf(applyForce)
                    }
                    if (tmpPointLU) {
                        applyForce = this.springForceAB(tmpPoint, tmpPointLU, 3)
                        tmpPoint.force.addSelf(applyForce)
                    }
                    if (tmpPointLB) {
                        applyForce = this.springForceAB(tmpPoint, tmpPointLB, 3)
                        tmpPoint.force.addSelf(applyForce)
                    }
                    
                }
            }
        }
    }

    //verlet计算所有点的新位置
    public calcNewPos(dt) {
        for (let i = 0; i < this.pointsCount; i++) {
            for (let j = 0; j < this.pointsCount; j++) {
                let tmpPoint = this._pointList[i][j]
                if (tmpPoint) {
                    if (tmpPoint.isFix) {
                        continue
                    }

                    let acc = tmpPoint.force.div(this.m_pointMass).mul(this.dampForceK)         
                    tmpPoint.force.mulSelf(this.dampForceK)         //受力衰减
                    let tmpNewPos = tmpPoint.newPos.sub(tmpPoint.oldPos).mul(this.dampK).add(tmpPoint.newPos).add(acc.mul(dt*dt))
                    tmpPoint.oldPos = tmpPoint.newPos
                    tmpPoint.newPos = tmpNewPos
                }
            }
        }
    }

    public initParams() {
        this.m_segLen = this.node.width/(this.pointsCount-1)        //每边长
        this.m_pointMass = 1/(this.pointsCount*this.pointsCount)    //点质量
    }
    
    //施加外力
    public applyOtherForce (__pos, __force) {
        let tmpForce = cc.v2(0, -this.outForce)
        tmpForce = __force || tmpForce
        let tmpPoint = this._pointList[__pos[0]][__pos[1]]
        if (tmpPoint) {
            tmpPoint.force.addSelf(tmpForce)
        }
    }

    // 初始化质点
    public initPointList() {
        for (let i = 0; i < this.pointsCount; i++) {
            if (!this._pointList[i]) {
                this._pointList[i] = []
            }
            let posY = i / (this.pointsCount - 1) * this.node.height
            for (let j = 0; j < this.pointsCount; j++) {
                let posX = j / (this.pointsCount - 1) * this.node.width
                this._pointList[i][j] = new MassPoint(posX, posY, cc.v2(0, 0), false)
            }
        }
        //四角定点
        this._pointList[0][0].isFix = true
        this._pointList[0][this.pointsCount-1].isFix = true
        this._pointList[this.pointsCount-1][0].isFix = true
        this._pointList[this.pointsCount-1][this.pointsCount-1].isFix = true
    }

    public getPointList() {
        let pointList = []
        for (let i = 0; i < this.pointsCount; i++) {
            if (!pointList[i]) {
                pointList[i] = []
            }
        }
        for (let i = 0; i < this.pointsCount; i++) {
            for (let j = 0; j < this.pointsCount; j++) {
                let point1 = this._pointList[i][j]
                pointList[i][j] = cc.v2(point1.newPos.x, point1.newPos.y)
            }
        }

        return pointList
    }

    _resetAssembler() {
        this.setVertsDirty();
        let assembler = this._assembler = new MassSpringAssembler();
        assembler.init(this);
    }

    draw() {
        this.setVertsDirty();
    }
}
