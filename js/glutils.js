var utils = {};

(function(gh){
    
    gh.currentViewport = {x:0,y:0};
    gh.lastViewport = {x:0,y:0};
    
    gh.plane = [-1,-1, 0,  -1, 1, 0,    1,-1, 0,  1,-1, 0,  -1, 1, 0,   1, 1, 0];
    gh.cubeVertices = [[-1,-1,-1,],[-1,-1,1,],[-1,1,-1,],[-1,1,1,],[1,-1,-1,],[1,-1,1,],[1,1,-1,],[1,1,1,]];
    gh.cubeIndices = [[2,1,0],[2,3,1],[4,0,6],[6,2,0],[6,4,5],[7,6,4],[3,5,1],[3,7,5],[1,4,0],[1,5,1],[6,3,7],[6,2,3]];
    
    //HELPER FUNCTION
    
    //returns a default value if given value is undefined, else return x.
    function d(x,n) { return x==undefined?(n==undefined?0:n):x; }
    
    gh.parseUniforms = function(shaderText)
    {
        shaderLines = shaderText.split("\n");
        var uniforms = [];
        for(var i = 0, l = shaderLines.length; i < l;i ++)
        {
            var line = shaderLines[i];
            var words = line.split(" ");
            var start = -1;
            for(var j = 0, k = words.length; j < k; j++)
                if(words[j] == "uniform"){ start = j; break;}
                                               
            if(start >= 0)
            {
                var unifName = words[start+2];
                unifName = unifName.slice(0,unifName.length-1);
                uniforms.push(unifName);
            }
        }
        return uniforms;
    };
                                                                               
    gh.aspectRatio = function() { return window.innerWidth/window.innerHeight; };
                                                                               
    gh.createCanvas = function()
    {
        var canvas = document.createElement("canvas");
        gh.canvas = canvas;
        document.body.appendChild(gh.canvas);
        gh.gl = canvas.getContext("webgl");
        
        if(!gh.gl)
            console.log("no webgl 4 u");
        else
            return canvas;
    };
                                    
    gh.setViewport = function(width,height)
    {
        gh.lastViewport.x = gh.currentViewport.x;
        gh.lastViewport.y = gh.currentViewport.y;
        gh.currentViewport.x = width;
        gh.currentViewport.y = height;
        gh.gl.viewport(0,0,width,height)
    }
                                    
    gh.revertViewport = function()
    {
        gh.setViewport(gh.lastViewport.x,gh.lastViewport.y);
    }
                                    
    gh.resize = function(w,h)
    {
        gh.gl.viewportWidth = window.innerWidth;
        gh.gl.viewportHeight = window.innerHeight;
                                                                               
        w = w==undefined?gh.gl.viewportWidth:w;
        h = h==undefined?gh.gl.viewportHeight:h;
        
        gh.setViewport(w,h);//gl.viewportWidth,gl.viewportHeight);
        
        gh.canvas.width = w;
        gh.canvas.height = h;
    };
    
                                    
    ////HELPER CLASSES
    //CONSTRUCTORS
    
    //VECTOR3 CONSTRUCTOR
    //x, y and z: floating point numbers
    gh.Vector3 = function(x,y,z)
    {
        //Floating point numbers
        this.x = d(x);
        this.y = d(y);
        this.z = d(z);
    };
    
    //MATRIX CONSTRUCTOR
    //data: a 1-dimensional array of floating point numbers, assigned by order in column-major distribution
    gh.Matrix4 = function(data)
    {
        this.values = data==undefined?[0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]:data;
    }
    
    //METHODS
    
    //VECTOR3 METHODS
    gh.Vector3.prototype.length2 = function() { return this.x*this.x+this.y*this.y+this.z*this.z; };
    gh.Vector3.prototype.length = function() { return Math.sqrt(this.length2()); };

    gh.Vector3.prototype.getPos = function() { return {'x':this.x,'y':this.y,'z':this.z}; };
    gh.Vector3.prototype.setPos = function(x,y,z) { this.x = x; this.y = y; this.z = z; };
    gh.Vector3.prototype.set = function(v) { this.setPos(v.x,v.y,v.z); };
    
    gh.Vector3.prototype.inverse = function() { return new gh.Vector3(-this.x,-this.y,-this.z); };

    gh.Vector3.prototype.add = function(v) { return new gh.Vector3(this.x+v.x, this.y+v.y, this.z+v.z); };
    gh.Vector3.prototype.sub = function(v) { return this.add(v.inverse()); };
    gh.Vector3.prototype.dot = function(v) { return this.x*v.x + this.y*v.y + this.z*v.z; };
    gh.Vector3.prototype.scalar = function(s) { return new gh.Vector3(this.x*s,this.y*s,this.z*s); };

    gh.Vector3.prototype.dist2 = function(v) { return this.sub(v).length2(); };
    gh.Vector3.prototype.dist = function(v) { return Math.sqrt(this.dist2(v)); };
    
    gh.Matrix4.prototype.setValue = function(px,py, value) { this.values[px*4 + py] = value; };
    gh.Matrix4.prototype.getValue = function(px,py) { return this.values[px*4 + py]; };
    
    gh.Matrix4.prototype.mul = function(m)
    {
        var newValues = [];
        for(var i = 0; i < 4; i++)
        {
            for(var j = 0; j < 4; j++)
            {
                var n = 0;
                for(var k = 0; k < 4; k++)n += this.getValue(k,j)*m.getValue(i,k);
                newValues.push(n);
            }
        }
        return new gh.Matrix4(newValues);
    };

    gh.Matrix4.prototype.setTranslation = function(v)
    { 
        this.setValue(0,0,1);
        this.setValue(1,1,1);
        this.setValue(2,2,1);
        this.setValue(3,3,1);
        this.setValue(0,3,v.x);
        this.setValue(1,3,v.y);
        this.setValue(2,3,v.z);
        
        return this;
    };
                                    
    gh.Matrix4.prototype.orthographic = function(t,b,l,r,zn,zf)
    {
        this.values[0] = 2.0/(r-l);
        this.values[5] = 2.0/(t-b);
        this.values[10] = -2.0/(zf-zn);
        this.values[12] = -(r+l)/(r-l);
        this.values[13] = -(t+b)/(t-b);
        this.values[14] = (zf+zn)/(zf-zn);
        this.values[15] = 1.0;
    
        return this;
    }
    
    gh.Matrix4.prototype.perspective = function(radFOV, ar, zn, zf)
    {
        var f = Math.tan((Math.PI * 0.5 - 0.5 * radFOV)/2.0);
        var inv = 1.0 / (zn-zf);
        
        this.values[0] = f / ar;
        this.values[5] = f;
        this.values[10] = (zn + zf) * inv;
        this.values[11] = -1;
        this.values[14] = zn * zf * inv * 2;
        
        return this;
    };

    gh.Matrix4.prototype.createBuffer = function()
    {
        return new Float32Array(this.values);
    }
})(utils);