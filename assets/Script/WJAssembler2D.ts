export default class WJAssembler2D extends cc.Assembler {
    verticesCount = 4;
    indicesCount = 6;
    floatsPerVert = 5;

    // vdata offset info
    uvOffset = 2;
    colorOffset = 4;
    
    _renderData = null;
    _local = null;

    init(comp) {
        super.init(comp);
        this._renderData = new cc.RenderData();
        this._renderData.init(this);

        this.initLocal();
        this.initData(comp);
    }

    get verticesFloats() {
        return this.verticesCount * this.floatsPerVert;
    }

    initData(comp) {
        let data = this._renderData;
        data.createQuadData(0, this.verticesFloats, this.indicesCount);
    }

    initLocal() {
        this._local = [];
        this._local.length = 4;
    }

    updateColor(comp, color) {
        let uintVerts = this._renderData.uintVDatas[0];
        if (!uintVerts) return;
        color = color != null ? color : comp.node.color._val;
        let floatsPerVert = this.floatsPerVert;
        let colorOffset = this.colorOffset;
        for (let i = colorOffset, l = uintVerts.length; i < l; i += floatsPerVert) {
            uintVerts[i] = color;
        }
    }

    getBuffer() {
        //@ts-ignore
        return cc.renderer._handle._meshBuffer;
    }

    updateWorldVerts(comp) {
        if (CC_NATIVERENDERER) {
            this.updateWorldVertsNative(comp);
        } else {
            this.updateWorldVertsWebGL(comp);
        }
    }

    updateWorldVertsWebGL(comp) {
        let local = this._local;
        let verts = this._renderData.vDatas[0];

        let matrix = comp.node._worldMatrix;
        let matrixm = matrix.m,
            a = matrixm[0], b = matrixm[1], c = matrixm[4], d = matrixm[5],
            tx = matrixm[12], ty = matrixm[13];

        let vl = local[0], vr = local[2],
            vb = local[1], vt = local[3];
        
        let justTranslate = a === 1 && b === 0 && c === 0 && d === 1;

        let index = 0;
        let floatsPerVert = this.floatsPerVert;
        if (justTranslate) {
            // left bottom
            verts[index] = vl + tx;
            verts[index+1] = vb + ty;
            index += floatsPerVert;
            // right bottom
            verts[index] = vr + tx;
            verts[index+1] = vb + ty;
            index += floatsPerVert;
            // left top
            verts[index] = vl + tx;
            verts[index+1] = vt + ty;
            index += floatsPerVert;
            // right top
            verts[index] = vr + tx;
            verts[index+1] = vt + ty;
        } else {
            let al = a * vl, ar = a * vr,
            bl = b * vl, br = b * vr,
            cb = c * vb, ct = c * vt,
            db = d * vb, dt = d * vt;

            // left bottom
            verts[index] = al + cb + tx;
            verts[index+1] = bl + db + ty;
            index += floatsPerVert;
            // right bottom
            verts[index] = ar + cb + tx;
            verts[index+1] = br + db + ty;
            index += floatsPerVert;
            // left top
            verts[index] = al + ct + tx;
            verts[index+1] = bl + dt + ty;
            index += floatsPerVert;
            // right top
            verts[index] = ar + ct + tx;
            verts[index+1] = br + dt + ty;
        }
    }

    updateWorldVertsNative(comp) {
        let local = this._local;
        let verts = this._renderData.vDatas[0];
        let floatsPerVert = this.floatsPerVert;
      
        let vl = local[0],
            vr = local[2],
            vb = local[1],
            vt = local[3];
      
        let index = 0;
        // left bottom
        verts[index] = vl;
        verts[index+1] = vb;
        index += floatsPerVert;
        // right bottom
        verts[index] = vr;
        verts[index+1] = vb;
        index += floatsPerVert;
        // left top
        verts[index] = vl;
        verts[index+1] = vt;
        index += floatsPerVert;
        // right top
        verts[index] = vr;
        verts[index+1] = vt;
    }

    packToDynamicAtlas(comp, frame) {
        if (CC_TEST) return;
        
        if (!frame._original && cc.dynamicAtlasManager && frame._texture.packable) {
            let packedFrame = cc.dynamicAtlasManager.insertSpriteFrame(frame);
            //@ts-ignore
            if (packedFrame) {
                frame._setDynamicAtlasFrame(packedFrame);
            }
        }
        let material = comp._materials[0];
        if (!material) return;
        
        if (material.getProperty('texture') !== frame._texture) {
            // texture was packed to dynamic atlas, should update uvs
            comp._vertsDirty = true;
            comp._activateMaterial();
        }
    }

    updateUVs(comp) {
        let uv = [0, 0, 1, 0, 0, 1, 1, 1];
        let uvOffset = this.uvOffset;
        let floatsPerVert = this.floatsPerVert;
        let verts = this._renderData.vDatas[0];

        for (let i = 0; i < 4; i++) {
            let srcOffset = i * 2;
            let dstOffset = floatsPerVert * i + uvOffset;
            verts[dstOffset] = uv[srcOffset];
            verts[dstOffset + 1] = uv[srcOffset + 1];
        }
    }

    updateVerts(comp) {
        let node = comp.node,
            cw = node.width,
            ch = node.height,
            appx = node.anchorX * cw,
            appy = node.anchorY * ch,
            l,
            b, 
            r,
            t;

        l = - appx;
        b = - appy;
        r = cw - appx;
        t = ch - appy;

        let local = this._local;
        local[0] = l;
        local[1] = b;
        local[2] = r;
        local[3] = t;
        this.updateWorldVerts(comp);
    }

    updateRenderData(comp) {
        if (comp._vertsDirty) {
            this.updateUVs(comp);
            this.updateVerts(comp);
            comp._vertsDirty = false;
        }
    }
}
