var webgl = {}

(function(w,u){
    
    var gl = u.gl;
    
    var webglData = {
        shaders:{},
        models:{},
        textures:{},
        frameBuffers:{},
        cameras:{}
    };
    
    ////Wrapper Objects
    
    //Private
    function Model(name,bufferData){};
    function Texture(width, height, source, textureID)
    {
        this.width = width;
        this.height = height;
        this.textureID = textureID;
        this.glTexture = gl.createTexture();
    };
    
    Texture.prototype.bind() { gl.bindTexture(gl.TEXTURE_2D, this.glTexture); }
    
    Texture.prototype.unbind() { gl.bindTexture(gl.TEXTURE_2D, null); }
    
    //A framebuffer wrapper to write renders to textures
    function FrameBuffer(width, height, frameBufferID)
    {
        this.width = width;//texture and viewport size
        this.height = height;
        this.frameBuffer = gl.createFramebuffer();//Native webgl object
        this.renderTextureID = frameBufferID + "rtex";//ID of the texture the framebuffer renders to
        
        w.createTexture(width,height,this.renderTextureID);
        
        var renderTex = webglData.textures[this.renderTextureID];
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        this.frameBuffer.width = width;
        this.frameBuffer.height = height;
        
        renderTex.bind();
        
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.t.t, 0);
        
        renderTex.unbind();
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    
    //A shader program wrapper that allows binding and setting of uniforms
    function Shader(shaderID, program)
    {
        this.shaderID = shaderID;//Shader ID to access the shader in the Data hashes
        this.program = program;//Native webGL shader program
        this.uniformLocations = {};//Hashmap of uniform name IDs vf and gpu uniform locations
    };
    
    Shader.prototype.bind = function() { gl.useProgram(this.program); }
    
    Shader.prototype.unbind = function() { gl.useProgram(null); }
    
    Shader.prototype.setUniform = function(uniformID, value, typeExtension)
    {
        gl["uniform" + typeExtension](this.uniformLocations[uniformID],value)
    };
    
    //Factory functions
    w.createModel = function(){};
    w.createTexture = function(){};
    w.createFrameBuffer = function(width, height, frameBufferID)
    {
        var fb = new FrameBuffer(width,height,frameBufferID);
        webglData.frameBuffers[frameBufferID] = fb;
    };
    
    function createShaderComponent(type, src)
    {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        var s = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
        if(s)
            return shader;
        
        console.log("could not load " + type + " shader " + src);
        gl.deleteShader(shader);
    };
    
    w.createShader = function(shaderID)
    {
        var vst = document.getElementById("vs"+shaderName).text;
        var fst = document.getElementById("fs"+shaderName).text;
        
        var vs = w.createShaderComponent(gl.VERTEX_SHADER,vst);
        var fs = w.createShaderComponent(gl.FRAGMENT_SHADER,fst);
        
        var program = gl.createProgram();
        gl.attachShader(program,vs);
        gl.attachShader(program,fs);
        gl.linkProgram(program);
        
        var s = gl.getProgramParameter(program, gl.LINK_STATUS);
        if(s)
        {
            var ns = new Shader(shaderName,program);
            shaderPrograms[shaderName] = ns;
            return;
        }
        
        console.log("failed to compile shader program of " + vs + " and " + fs);
        gl.deleteProgram(program);
    };
    
    //Public Classes
    function Renderable(transform, renderableID, modelID)
    {
        this.transform = transform;
        this.renderableID = renderableID;
        this.modelID = modelID;
    };
    
    function Batch(shaderID)
    {
        this.renderables = [];
        this.shaderID = shaderID;
    };
    
    Batch.prototype.addRenderable = function(renderable){ renderables.push(renderable); };              
    /**TODO fix this horror ASAP**/
    Batch.prototype.removeRenderable = function(renderable) { var index = this.renderables.indexOf(renderable);if(index >= 0)this.renderables[index] = undefined; };
    
    function Camera(transform, fov, near, far, cameraID)
    {
        this.transform = transform;
        this.fov = fov;
        this.near = near;
        this.far = far;
        this.cameraID = cameraID;
        
        this.projectionMatrix = new utils.Matrix4().perspective(fov/180*Math.PI,u.aspectRatio(),this.near,this.far);
    }
    
    ////Webgl framework function
    w.render = function(batch,camera)
    {
    
    };
    
    w.renderToTexture = function(batch,camera,frameBuffer)
    {
    
    };
})(webgl,utils);