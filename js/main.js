(function(w,u){
    
    var running = false
    var shadersrc = {};
    
    var postCamera;
    var modelCamera;
    var postBatch;
    var modelBatch;
    
    function initGL()
    {
        w.initGL();
        
        w.createProgram("model")
        
        var res = [];
        for(var i = 0; i < utils.cubeIndices.length; i++)
        {
            for(var j = 0; j < 3; j++)
                for(var k = 0; k < 3; k++)
                    res.push(10*u.cubeVertices[utils.cubeIndices[i][j]][2-k]);
        }
        
        w.createModel("cube",res,[]);//name, vertices, textures, shaderID
        postCamera = "camfb";
        
        var pixelScale = 1;
        
        w.createFrameBuffer(postCamera,Math.floor(window.innerWidth/pixelScale),Math.floor(window.innerHeight/pixelScale));
        w.createCamera(postCamera, new u.Matrix4(), 90, 0.1, 100.0);
        
        w.createProgram('post');
        w.createModel('plane', u.plane, [w.frameBuffers[postCamera].renderTexture]);
        
        modelBatch = new w.Batch("model");
        modelBatch.renderables.push(new w.Renderable("cube"));
        
        modelCamera = "postCam";
        
        var camMat = new u.Matrix4();
        camMat.setTranslation(0,0,0);
        
        w.createCamera(modelCamera, camMat, 90, 1.0, 100.0,);
        postBatch = new w.Batch("post");
        
        postBatch.renderables.push(new w.Renderable("plane"));
    }
    
    var iii = 0;
    function main()
    {
        /*if(iii< 100)
        {console.log("before");iii++;}*/
        u.gl.clearColor(0.1,0.2,0.3,0.5);
        var t = w.renderToTexture(modelBatch, modelCamera,"camfb");
		//w.textures[t].bind();
        u.gl.clearColor(0.7,0.5,0.3,1.0);
        w.render(postBatch, postCamera);
        if(running)window.requestAnimationFrame(main);
    }
    
    function run()
    {
        u.createCanvas();
        initGL();
        
        running = true;
        main();
    }
    
    run();
})(webgl, utils);