// tri-gl.js

var TriVertexShader = 
'attribute vec4 a_coord;\n' +
'attribute float a_epoch_1;\n' +
'attribute float a_epoch_2;\n' +
'attribute float a_pbt_crc_1;\n' +
'attribute float a_pbt_total_1;\n' +
'attribute float a_pbt_crc_2;\n' +
'attribute float a_pbt_total_2;\n' +
'attribute float a_tri_crc_1;\n' +
'attribute float a_tri_total_1;\n' +
'attribute float a_tri_crc_2;\n' +
'attribute float a_tri_total_2;\n' +
'uniform mat4 u_map_matrix;\n' +
'uniform float u_epoch;\n' +
'uniform float u_alpha;\n' +
'uniform float u_show_tri;\n' +
'uniform float u_show_pbt;\n' +
'uniform bool u_show_crc;\n' +
'varying float v_pbt_crc;\n' + 
'varying float v_tri_crc;\n' + 
'void main() {\n' +
'    vec4 position;\n' +
'    if (u_epoch < a_epoch_1) {\n' +
'        position = vec4(-1,-1,-1,-1);\n' +
'    } else if (u_epoch > a_epoch_2) {\n' +
'        position = vec4(-1,-1,-1,-1);\n' +
'    } else {\n' +
'        position = u_map_matrix * a_coord;\n' +
'    }\n' + 
'    gl_Position = position;\n' +
'    float pbt_delta = (a_pbt_total_2 - a_pbt_total_1) * u_alpha + a_pbt_total_1;\n' +
'    float tri_delta = (a_tri_total_2 - a_tri_total_1) * u_alpha + a_tri_total_1;\n' +
'    bool pbt_crc = a_pbt_crc_1 == 1.0 || a_pbt_crc_2 == 1.0;\n' + 
'    bool tri_crc = a_tri_crc_1 == 1.0 || a_tri_crc_2 == 1.0;\n' + 
'    if (u_show_crc) {\n' +
'      if (pbt_delta * u_show_pbt > 0.) {\n' +
'         if (pbt_crc) {\n' +
'           v_pbt_crc = 1.0;\n'+
'         } else {\n' +
'           v_pbt_crc = 0.0;\n'+
'         }\n' +
'      } else {\n' +
'        v_pbt_crc = 0.0;\n' +
'      }\n' +
'      if (tri_delta * u_show_tri > 0.) {\n' +
'         if (tri_crc) {\n' +
'           v_tri_crc = 1.0;\n'+
'         } else {\n' +
'           v_tri_crc = 0.0;\n'+
'         }\n' +
'      } else {\n' +
'        v_tri_crc = 0.0;\n' +
'      }\n' +
'    } else {\n' +
'        v_pbt_crc = 0.0;\n' +
'        v_tri_crc = 0.0;\n' +
'    }\n' +
'    gl_PointSize = clamp(sqrt(pbt_delta/1000. + tri_delta/1000.), 0.0, 50.0);\n' +
'    float pointSize = 100. * smoothstep(0.0, 500., sqrt(pbt_delta*u_show_pbt + tri_delta*u_show_tri));\n' +
'    gl_PointSize = pointSize;\n' +
'}\n';

var TriFragmentShader = 
'#extension GL_OES_standard_derivatives : enable\n' +
'precision mediump float;\n' +
'varying float v_pbt_crc;\n' + 
'varying float v_tri_crc;\n' + 
'void main() {\n' +
'    vec4 color = vec4(205./255.,133./255.,63./255.,1.0);\n' +
'  if (v_pbt_crc == 1.0 || v_tri_crc == 1.0) {\n' +
'    color = vec4(128./255.,0.,0.,1.);\n' +
'  }\n' +
'  float dist = length(gl_PointCoord.xy - vec2(.5,.5));\n' +
'  dist = 1. - (dist * 2.);\n' +
'  dist = max(0., dist);\n' +
'  gl_FragColor = color * dist;\n' +
'}\n';

var TriGl = function TriGl(gl) {
    this.gl = gl;
    this.program = createProgram(gl, TriVertexShader, TriFragmentShader);
    this.buffer = {
        'numAttributes': 12,
        'count': 0,
        'buffer': null,
        'ready': false
    };
    this.showTri = true;
    this.showPbt = true;
    this.highlightCarcinogens = false;

}

TriGl.prototype.getBin = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.open('get', url, true);
    xhr.onload = function () {
      var float32Array = new Float32Array(this.response);
      callback(float32Array);
    };
    xhr.send();
}


TriGl.prototype.setBuffer = function(data) {
    this.data = data;
    this.buffer.count = data.length / this.buffer.numAttributes;
    this.buffer.buffer = createBuffer(gl, data);   
    this.buffer.ready = true;
}

TriGl.prototype.draw = function draw(transform, options) {
    if (this.buffer.ready) {
        var options = options || {};
        var gl = this.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
        var program = this.program;
        var buffer = this.buffer;
        gl.useProgram(program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
        bindAttribute(gl, program.program, 'a_coord', 2, gl.FLOAT, false, this.buffer.numAttributes*4, 0);    
        bindAttribute(gl, program.program, 'a_epoch_1', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 8);    
        bindAttribute(gl, program.program, 'a_epoch_2', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 12);    
        bindAttribute(gl, program.program, 'a_pbt_crc_1', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 16);    
        bindAttribute(gl, program.program, 'a_pbt_total_1', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 20);    
        bindAttribute(gl, program.program, 'a_pbt_crc_2', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 24);    
        bindAttribute(gl, program.program, 'a_pbt_total_2', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 28);    
        bindAttribute(gl, program.program, 'a_tri_crc_1', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 32);    
        bindAttribute(gl, program.program, 'a_tri_total_1', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 36);    
        bindAttribute(gl, program.program, 'a_tri_crc_2', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 40);    
        bindAttribute(gl, program.program, 'a_tri_total_2', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 44);    

        gl.uniformMatrix4fv(program.u_map_matrix, false, transform);
        //gl.uniform1f(program.u_point_size, pointSize);

        var currentEpoch = options.currentYear;
        gl.uniform1f(program.u_epoch, currentEpoch);

        var alpha = options.alpha;
        gl.uniform1f(program.u_alpha, alpha);

        gl.uniform1f(program.u_show_tri, this.showTri ? 1.0 : 0.0);
        gl.uniform1f(program.u_show_pbt, this.showPbt ? 1.0 : 0.0);
        gl.uniform1f(program.u_show_crc, this.highlightCarcinogens);

        gl.drawArrays(gl.POINTS, 0, buffer.count);
        gl.disable(gl.BLEND);
    }
};