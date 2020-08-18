import WJAssembler2D from "../WJAssembler2D";
let temp_uvs = [];

export default class MassSpringAssembler extends WJAssembler2D {

    initData (sprite) {
        let pointNum = sprite.pointsCount
        this.verticesCount = pointNum*pointNum
        this.indicesCount = (pointNum-1)*(pointNum-1)*6

        if (this._renderData.meshCount > 0) return;
        this._renderData.createData(0, this.verticesFloats, this.indicesCount);

        let indices = this._renderData.iDatas[0];
        let indexOffset = 0;
        for (let r = 0; r < (pointNum-1); ++r) {
            for (let c = 0; c < (pointNum-1); ++c) {
                let start = r * pointNum + c;
                indices[indexOffset++] = start;
                indices[indexOffset++] = start + 1;
                indices[indexOffset++] = start + pointNum;
                indices[indexOffset++] = start + 1;
                indices[indexOffset++] = start + pointNum+1;
                indices[indexOffset++] = start + pointNum;
            }
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
        let offsetInfo = buffer.request(this.verticesCount, this.indicesCount);

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

    updateVerts (sprite) {
        let pointNum = sprite.pointsCount
        if (sprite) {
            let local  = this._local
            let index = 0
            let pointList = sprite.getPointList()
            for (let i = 0; i < pointNum; i++) {
                for (let j = 0; j < pointNum; j++) {
                    local[index] = pointList[i][j]
                    index++
                }
            }
        }

        this.updateWorldVerts(sprite);
    }

    calcSlicedUV (__pointNum) {
        let uvSliced = [];
        uvSliced.length = 0;
        // if (this._rotated) {
        //     temp_uvs[0].u = (rect.x) / atlasWidth;
        //     temp_uvs[1].u = (rect.x + bottomHeight) / atlasWidth;
        //     temp_uvs[2].u = (rect.x + bottomHeight + centerHeight) / atlasWidth;
        //     temp_uvs[3].u = (rect.x + rect.height) / atlasWidth;
        //     temp_uvs[3].v = (rect.y) / atlasHeight;
        //     temp_uvs[2].v = (rect.y + leftWidth) / atlasHeight;
        //     temp_uvs[1].v = (rect.y + leftWidth + centerWidth) / atlasHeight;
        //     temp_uvs[0].v = (rect.y + rect.width) / atlasHeight;

        //     for (let row = 0; row < 4; ++row) {
        //         let rowD = temp_uvs[row];
        //         for (let col = 0; col < 4; ++col) {
        //             let colD = temp_uvs[3 - col];
        //             uvSliced.push({
        //                 u: rowD.u,
        //                 v: colD.v
        //             });
        //         }
        //     }
        // }
        // else {
            for (let i = 0; i < __pointNum; i++) {       //均分
                if (!temp_uvs[i]) {
                    temp_uvs[i] = {u:0, v:0}
                }
                temp_uvs[i].u = i/(__pointNum-1)
                temp_uvs[i].v = (__pointNum-1-i)/(__pointNum-1)
            }

            for (let row = 0; row < __pointNum; ++row) {
                let rowD = temp_uvs[row];
                for (let col = 0; col < __pointNum; ++col) {
                    let colD = temp_uvs[col];
                    uvSliced.push({
                        u: colD.u,
                        v: rowD.v
                    });
                }
            }
        // }
        return uvSliced
    }

    updateUVs (sprite) {
        let pointNum = sprite.pointsCount
        let verts = this._renderData.vDatas[0];
        // let uvSliced = sprite.spriteFrame.uvSliced;
        let uvSliced = this.calcSlicedUV(pointNum)

        let uvOffset = this.uvOffset;
        let floatsPerVert = this.floatsPerVert;
        for (let row = 0; row < pointNum; ++row) {
            for (let col = 0; col < pointNum; ++col) {
                let vid = row * pointNum + col;
                let uv = uvSliced[vid];
                let voffset = vid * floatsPerVert;
                verts[voffset + uvOffset] = uv.u;
                verts[voffset + uvOffset + 1] = uv.v;
            }
        }
    }

    updateWorldVertsWebGL (sprite) {
        let matrix = sprite.node._worldMatrix;
        let matrixm = matrix.m,
            a = matrixm[0], b = matrixm[1], c = matrixm[4], d = matrixm[5],
            tx = matrixm[12], ty = matrixm[13];

        let worldIndex = 0
        let local = this._local;
        let world = this._renderData.vDatas[0];

        let floatsPerVert = this.floatsPerVert;
        for (let i = 0; i < this.verticesCount; i++) {
            let p0 = local[i]
            world[worldIndex] = p0.x * a + p0.y * c + tx;
            world[worldIndex + 1] = p0.x * b + p0.y * d + ty;
            worldIndex += floatsPerVert;
        }
    }

    updateWorldVertsNative(sprite) {
        let worldIndex = 0
        let local = this._local;
        let world = this._renderData.vDatas[0];

        let floatsPerVert = this.floatsPerVert;
        for (let i = 0; i < this.verticesCount; i++) {
            let p0 = local[i]
            world[worldIndex] = p0.x
            world[worldIndex + 1] = p0.y
            worldIndex += floatsPerVert;
        }
    }
}
