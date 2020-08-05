import WJAssembler2D from "./WJAssembler2D";

export default class WJMultiAssembler extends WJAssembler2D {
    segCount = 1;       //切分次数
    m_segList = []      //渲染单元
    m_mainSegLen = 13       //渲染单元实线部分长度
    m_lightningLen = 800    //闪电长度
    m_endPos = cc.v2(800, 0)    //闪电终点
    offset_factor = 0.3    //偏移因子

    get verticesFloats() {
        return this.verticesCount * this.floatsPerVert * this.segCount;
    }

    initData() {
        this.genSegs()
        let data = this._renderData;
        let _verticesFloats = this.verticesCount * this.floatsPerVert * this.m_segList.length
        data.createQuadData(0, _verticesFloats, this.indicesCount * this.m_segList.length);
    }

    initLocal () {
        this._local = [];
        this._local.length = this.segCount*4;
    }

    updateRenderData (sprite) {
        let frame = sprite._spriteFrame;
        if (!frame) return;
        this.packToDynamicAtlas(sprite, frame);

        if (sprite._vertsDirty) {
            
            this.updateUVs(sprite);
            this.updateVerts(sprite);
            sprite._vertsDirty = false;
        }
    }

    fillBuffers(comp, renderer) {
        if (renderer.worldMatDirty) {
            this.updateWorldVerts(comp);
        }

        let renderData = this._renderData;
        let vData = renderData.vDatas[0];
        let iData = renderData.iDatas[0];

        let buffer = this.getBuffer(/*renderer*/);
        let offsetInfo = buffer.request(this.verticesCount* this.m_segList.length, this.indicesCount* this.m_segList.length);

        // buffer data may be realloc, need get reference after request.

        // fill vertices
        let vertexOffset = offsetInfo.byteOffset >> 2,
            vbuf = buffer._vData;

        if (vData.length + vertexOffset > vbuf.length) {
            vbuf.set(vData.subarray(0, vbuf.length - vertexOffset), vertexOffset);
        } else {
            vbuf.set(vData, vertexOffset);
        }

        // fill indices
        let ibuf = buffer._iData,
            indiceOffset = offsetInfo.indiceOffset,
            vertexId = offsetInfo.vertexOffset;
        for (let i = 0, l = iData.length; i < l; i++) {
            ibuf[indiceOffset++] = vertexId + iData[i];
        }
    }

    //计算渲染顶点数据
    genVerts () {
        let local = this._local;
        
        for (let i = 0; i < this.m_segList.length; i++) {
            let segInfo = this.m_segList[i];
            
            let segVec = segInfo[1].sub(segInfo[0])
            let segMidPoint = cc.v2((segInfo[0].x+segInfo[1].x)*0.5, (segInfo[0].y+segInfo[1].y)*0.5)
            let outNormal = cc.v2(segVec.y, -segVec.x).normalize()
            let segWidth = this.m_mainSegLen

            let p0 = segInfo[0].add(outNormal.mul(segWidth/2))
            let p1 = segInfo[1].add(outNormal.mul(segWidth/2))
            let p2 = segInfo[0].add(outNormal.mul(-segWidth/2)) 
            let p3 = segInfo[1].add(outNormal.mul(-segWidth/2))

            local[i*4]   = segMidPoint.add(p0.sub(segMidPoint).mul(8.05))
            local[i*4+1] = segMidPoint.add(p1.sub(segMidPoint).mul(8.05))
            local[i*4+2] = segMidPoint.add(p2.sub(segMidPoint).mul(8.05))
            local[i*4+3] = segMidPoint.add(p3.sub(segMidPoint).mul(8.05))
        }
    }

    //计算需要渲染单元个数
    calcSegCount () {
        let count = 0
        this.m_lightningLen = this.m_endPos.mag()
        let totalLen = this.m_lightningLen
        while (totalLen > this.m_mainSegLen) {
            totalLen /= 2
            count++
        }
        this.segCount = count
    }

    //生成渲染单元
    genSegs () {
        this.calcSegCount()
        this.m_segList = []
        let segInfo = [cc.v2(0, 0), this.m_endPos]  //startPos, endPos
        this.m_segList[this.m_segList.length] = segInfo

        if (this.segCount == 0) {
            return
        }
        this.m_segList = this.genSegsFromBranch(segInfo, this.segCount)
    }

    genSegsFromBranch (__branchSeg, __count) {
        let segList = []
        if (__branchSeg) {
            segList[segList.length] = __branchSeg
        }

        for (let i = 1; i < __count+1; i++) {
            let tmpList = []
            for (let j = 0; j < segList.length; j++) {
                let segInfo = segList[j];
                if (segInfo) {
                    let subSegs = this.splitSeg(segInfo, i)
                    for (let k = 0; k < subSegs.length; k++) {
                        tmpList[tmpList.length] = subSegs[k]
                    }
                }
            }
            segList = tmpList
        }

        return segList
    }

    splitSeg (__seg, __createID) {
        let segList = []

        let segVec = __seg[1].sub(__seg[0])
        let segLen = segVec.mag()
        let maxOffest = segLen * this.offset_factor
        let offSet = Math.random()*maxOffest - maxOffest/2

        let outNormal = cc.v2(segVec.y, -segVec.x).normalize().mul(offSet)
        let segMidPoint = cc.v2((__seg[0].x+__seg[1].x)*0.5, (__seg[0].y+__seg[1].y)*0.5)
        let midPos = segMidPoint.add(outNormal)

        let seg0 = [__seg[0], midPos]
        let seg1 = [midPos, __seg[1]]

        segList[segList.length] = seg0
        segList[segList.length] = seg1

        return segList
    }

    updateVerts (sprite) {
        // let node = sprite.node,
        //     cw = node.width,
        //     ch = node.height,
        //     appx = node.anchorX * cw,
        //     appy = node.anchorY * ch,
        //     l,
        //     b, 
        //     r,
        //     t;

        // l = - appx;
        // b = - appy;
        // r = cw - appx;
        // t = ch - appy;

        // // update local
        // let local = this._local;

        // for (let i = 0; i < this.segCount*4; i++) {
        //     if (i % 4 == 0) {           //left
        //         local[i] = l + cw*Math.floor(i/4) - 340*Math.floor(i/4)/2
        //     }
        //     else if (i % 4 == 2) {      //right
        //         local[i] = r + cw*Math.floor(i/4) - 340*Math.floor(i/4)/2
        //     }
        //     else if (i % 4 == 1) {      //bottom
        //         local[i] = b //+ ch*Math.floor(i/4)
        //     }
        //     else if (i % 4 == 3) {      //top
        //         local[i] = t //+ ch*Math.floor(i/4)
        //     }
        // }
        this.genVerts()

        this.updateWorldVerts(sprite);
    }

    updateUVs(comp) {
        // let uv = [0, 0, 1, 0, 0, 1, 1, 1];
        let uv = comp._spriteFrame.uv;
        let uvOffset = this.uvOffset;
        let floatsPerVert = this.floatsPerVert;
        let verts = this._renderData.vDatas[0];

        for (let i = 0; i < this.m_segList.length*4; i++) {
            let srcOffset = (i * 2) % 8;
            let dstOffset = floatsPerVert * i + uvOffset;
            verts[dstOffset] = uv[srcOffset];
            verts[dstOffset + 1] = uv[srcOffset + 1];
        }
    }

    updateWorldVerts(comp) {
        if (CC_NATIVERENDERER) {
            this.updateWorldVertsNative(comp);
        } else {
            this.updateWorldVertsWebGL(comp);
        }
    }

    updateWorldVertsWebGL(comp) {
        let matrix = comp.node._worldMatrix;
        let matrixm = matrix.m,
            a = matrixm[0], b = matrixm[1], c = matrixm[4], d = matrixm[5],
            tx = matrixm[12], ty = matrixm[13];

        let worldIndex = 0
        let local = this._local;
        let world = this._renderData.vDatas[0];

        let floatsPerVert = this.floatsPerVert;
        for (let count = 0; count < this.m_segList.length; count++) {
            
            // for (let row = 0; row < 2; ++row) {
            //     let localRowY = local[row * 2 + 1 + count*4];
            //     for (let col = 0; col < 2; ++col) {
            //         let localColX = local[col*2 + count*4];
    
            //         world[worldIndex] = localColX * a + localRowY * c + tx;
            //         world[worldIndex + 1] = localColX * b + localRowY * d + ty;
            //         worldIndex += floatsPerVert;
            //     }
            // }
            for (let i = 0; i < 4; i++) {
                let p0 = local[count*4 + i]
                world[worldIndex] = p0.x * a + p0.y * c + tx;
                world[worldIndex + 1] = p0.x * b + p0.y * d + ty;
                worldIndex += floatsPerVert;
            }
        }
    }

    updateWorldVertsNative(comp) {
        let local = this._local;
        let world = this._renderData.vDatas[0];
        let floatsPerVert = this.floatsPerVert;

        let worldIndex = 0
      
        for (let count = 0; count < this.m_segList.length; count++) {
            
            // for (let row = 0; row < 2; ++row) {
            //     let localRowY = local[row * 2 + 1 + count*4];
            //     for (let col = 0; col < 2; ++col) {
            //         let localColX = local[col*2 + count*4];
    
            //         world[worldIndex] = localColX
            //         world[worldIndex + 1] = localRowY;
            //         worldIndex += floatsPerVert;
            //     }
            // }
            for (let i = 0; i < 4; i++) {
                let p0 = local[count*4 + i]
                world[worldIndex] = p0.x
                world[worldIndex + 1] = p0.y
                worldIndex += floatsPerVert;
            }
        }
    }
}
