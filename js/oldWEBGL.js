var webgl = {   'v':0.0,
            'gl':undefined,
            'canvas':undefined,
            'shaders':undefined,
            'models':{}};

(function(w){
    
    var shaderPrograms = {};
    var currentShaderID = -1;
    
    var models = {};
    
    var gl = undefined;
    
    var textures = [];
    
    w.getShader = function(name) { return shaderPrograms[name]; };
    
    ////WEBGL CLASSES
    //CONSTRUCTORS
    
    function Shader(shaderName, program)
    {
        this.name = shaderName;
        this.program = program;
    }
    Shader.prototype.bind = function(){ gl.useProgram(this.program); }
    
    function Model(shaderID, modelName, textures)
    {
        this.modelName = modelName;
        this.data = [];
        this.shader = shaderID;
        this.dataLength = 0;
        this.dataBuffer;
        this.textures = textures==undefined?[]:textures;
    }
    
    w.Renderable = function(model, transform)
    {
        this.model = model;//name id
        this.transform = transform;
        this.textures = [];
    }
    
    w.Camera = function(transform, fov, near, far)
    {
        this.transform = transform;
        this.fov = 90.0;
        this.near = near;
        this.far = far;
        
        this.projectionMatrix = new utils.Matrix4().perspective(fov/180*Math.PI,utils.aspectRatio(),this.near,this.far);
    }
    
    w.Batch = function(shaderID)
    {
        this.renderables = [];
        this.shader = shaderID;
        this.textures = []
    }
    
    w.Texture = function(width, height)
    {
        this.width = width;
        this.height = height;
        this.t = gl.createTexture();
        
        this.id = this.texID++;
        
        //gl.activeTexture(gl.TEXTURE0+this.id);
        gl.bindTexture(gl.TEXTURE_2D, this.t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        
        
        textures.push(this);
    }
    w.Texture.prototype.texID = 0;
    
    w.FrameBuffer = function(width, height)
    {
        this.width = width;
        this.height = height;
        this.fb = gl.createFramebuffer();
        this.t = new w.Texture(width, height);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
        this.fb.width = 512;
        this.fb.height = 512;
        
        t.unbind();
        
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.t.t, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    //MODEL
    Model.prototype.bindTextures = function()
    {
        //console.log(shaderPrograms[this.shader].name);
        for(var i = 0; i < this.textures.length; i++)
        {
            //textures[this.textures[i]].bind(i);
            var shader = shaderPrograms[this.shader];
            //var texloc = gl.getUniformLocation(shader.program,'u_tex'+i)
            //gl.uniform1i(texloc,i);
        }
    }
    Model.prototype.bind = function(){ gl.bindBuffer(gl.ARRAY_BUFFER, this.dataBuffer); this.bindTextures()}
    Model.prototype.setData = function(data)
    {
        shader = shaderPrograms[this.shader]
        
        var posAttrib = gl.getAttribLocation(shader.program,"a_position");
        this.dataBuffer = gl.createBuffer();
        this.bind();
    
        this.data = data;
        this.dataLength = data.length;
        
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    }
    
    //RENDERABLE
    w.Renderable.prototype.render = function(camera)
    {
        var model = models[this.model];
        var shader = shaderPrograms[model.shader];
        
        //console.log(model.modelName + " : " + model.textures);
        
        var posAttrib = gl.getAttribLocation(shader.program,"a_position");
        
        gl.enableVertexAttribArray(posAttrib);
        gl.vertexAttribPointer(posAttrib, shader.attParam, gl.FLOAT, false, 0, 0);
        
        model.bind();
        
        //model.setUniforms();
        
        gl.drawArrays(gl.TRIANGLES,0,model.dataLength/shader.attParam);
    }
    
    //TEXTURE
    w.Texture.prototype.bind = function(active) { gl.activeTexture(gl.TEXTURE0+active);gl.bindTexture(gl.TEXTURE_2D,this.t);console.log(this.id)};
    
    //FRAMEBUFFER
    w.FrameBuffer.prototype.bind = function() { gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb); }
    
    w.FrameBuffer.prototype.unbind = function() { gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    
    ////WEBGL HELPER FUNCTIONS 
    
    w.createCanvas = function()
    {
        var canvas = document.createElement("canvas");
        w.canvas = canvas;
        document.body.appendChild(w.canvas);
        w.gl = canvas.getContext("webgl");
        
        gl = w.gl;
        
        if(!w.gl)
            console.log("no webgl 4 u");
        else
            return canvas;
    };
    
    w.createShader = function(type, src)
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
    
    w.createProgram = function(shaderName,attParam)
    {
        var vst = document.getElementById("vs"+shaderName).text;
        var fst = document.getElementById("fs"+shaderName).text;
        
        var vs = w.createShader(gl.VERTEX_SHADER,vst);
        var fs = w.createShader(gl.FRAGMENT_SHADER,fst);
        
        var program = gl.createProgram();
        gl.attachShader(program,vs);
        gl.attachShader(program,fs);
        gl.linkProgram(program);
        
        var s = gl.getProgramParameter(program, gl.LINK_STATUS);
        if(s)
        {
            var ns = new Shader(shaderName,program);
            ns.attParam = attParam;
            shaderPrograms[shaderName] = ns;
            
            ns.bind();
            
            return;
        }
        
        console.log("failed to compile shader program of " + vs + " and " + fs);
        gl.deleteProgram(program);
    };
    
    w.createModel = function(data, shaderName, modelName,textures)
    {
        var m = new Model(shaderName, modelName,textures);
        m.setData(data);
        models[modelName] = m;
    }
    
    w.initGL = function()
    {
        gl.clearColor(0,0.2,0,0.5);
        gl.enable(gl.DEPTH_TEST);
        w.resize();
    }
    
    
    w.updateUniforms = function(shader, camera)
    {
        //Updating uniforms
        var viewHandle = gl.getUniformLocation(shader.program,"u_view");
        var projHandle = gl.getUniformLocation(shader.program,"u_proj");
        gl.uniformMatrix4fv(viewHandle,false,new Float32Array(camera.transform.values));
        gl.uniformMatrix4fv(projHandle,false,new Float32Array(camera.projectionMatrix.values));
    }
    
    
    //A batch is a collection of renderables
    w.render = function(batch, camera)
    {
        var shader = shaderPrograms[batch.shader];
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        shader.bind();
        
        w.updateUniforms(shader, camera);
        
        for(var i = 0, l = batch.renderables.length; i < l; i++)
        {
            var renderable = batch.renderables[i];
            renderable.render(camera);
        }
    }
            
    w.renderToTexture = function(batch, camera)
    {
        var fb = camera.frameBuffer;
        
        fb.bind();
        gl.clearColor(0,0,0,0.5);
        gl.viewport(0,0,fb.width,fb.height);
        w.render(batch,camera);
        fb.unbind();
        
        gl.viewport(0,0,gl.viewportWidth,gl.viewportHeight);
        return fb.t;
    }
    
})(h);