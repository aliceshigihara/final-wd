/* CyberLife: standalone WebGL2 interpretation of React Bits Aurora and Plasma.
   Aurora: layered luminous curtains. Plasma: twisted volumetric light folds.
   A scroll-driven crossfade runs in a single shader to avoid competing contexts. */
(() => {
  const canvas = document.getElementById('services-effects');
  const gallery = document.querySelector('.gallery-section');
  if (!canvas || !gallery) return;
  const gl = canvas.getContext('webgl2', {alpha:false, antialias:false, depth:false});
  if (!gl) { canvas.hidden = true; return; }
  const vertex = `#version 300 es
  in vec2 pos;
  void main(){gl_Position=vec4(pos,0.,1.);}`;
  const fragment = `#version 300 es
  precision highp float;
  uniform vec2 resolution, pointer;
  uniform float time, blend;
  out vec4 color;
  const vec3 base=vec3(.0314,.0824,.1843);
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
  vec3 aurora(vec2 uv){
    float x=(uv.x-.5)*resolution.x/resolution.y;
    float y=1.-uv.y;
    float t=time*.24;
    vec3 light=vec3(0.);
    for(int i=0;i<3;i++){
      float k=float(i);
      float warp=noise(vec2(x*1.1+t*.21+k*7.,t*.17));
      float wave=noise(vec2(x*1.8+warp*.65-t*.15+k*5.,t*.23+k*3.))-.5;
      float hem=.30+k*.085+wave*.48+.07*sin(x*3.2+t+k);
      hem+=.10*exp(-pow((uv.x-pointer.x)*5.,2.))*(.4+pointer.y*.6);
      float curtain=(1.-smoothstep(hem-.19,hem+.20,y));
      float rim=exp(-pow((y-hem)/(.085+k*.025),2.));
      vec3 tint=mix(vec3(.06,.20,.78),vec3(.10,.67,.95),.5+.5*sin(x*2.4+t*.4+k));
      light+=tint*(curtain*.24+rim*.13)/(1.+k*.65);
    }
    return base+light;
  }
  vec3 plasma(vec2 uv){
    vec2 p=(uv-.5)*vec2(resolution.x/resolution.y,1.);
    p+=(pointer-.5)*.12;
    float t=time*.30;
    vec3 ray=normalize(vec3(p,1.65));
    vec3 origin=vec3(0.,0.,-4.);
    float travel=0.,density=0.,band=0.;
    for(int i=0;i<48;i++){
      vec3 q=origin+ray*travel;
      float phase=q.y*1.15+t;
      q.x+=.65*sin(phase+q.z*.55)*cos(phase*.46);
      float a=q.y*1.25-t*.6;
      q.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*q.xz;
      float shell=abs(length(q.xz*vec2(1.,1.45))-(.85+.18*sin(q.y*2.+t)));
      float stepSize=max(.035,shell*.52);
      float w=exp(-shell*7.)*stepSize;
      density+=w;band+=w*(.5+.5*sin(q.y*2.7+q.z*1.5+t));
      travel+=stepSize;
      if(travel>9.)break;
    }
    float energy=1.-exp(-density*1.7);
    vec3 tint=mix(vec3(.045,.16,.63),vec3(.12,.58,.88),band/max(density,.001));
    float edge=1.-smoothstep(.2,1.25,length(p*vec2(.58,1.)));
    return base+tint*energy*edge*.67+vec3(.10,.20,.30)*energy*energy*edge*.35;
  }
  void main(){vec2 uv=gl_FragCoord.xy/resolution;vec3 c;if(blend<.001)c=aurora(uv);else if(blend>.999)c=plasma(uv);else c=mix(aurora(uv),plasma(uv),blend);color=vec4(c+(hash(gl_FragCoord.xy)-.5)/255.,1.);}`;
  function shader(type, source) {const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  try {
    const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    const vao=gl.createVertexArray();gl.bindVertexArray(vao);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'pos');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const u=Object.fromEntries(['resolution','pointer','time','blend'].map(k=>[k,gl.getUniformLocation(program,k)]));
    const reduce=matchMedia('(prefers-reduced-motion: reduce)');let target=[.5,.5], mouse=[.5,.5], mix=0, desired=0, frame=0, start=performance.now();
    function resize(){const scale=Math.min(1,900/innerHeight,1600/innerWidth);canvas.width=Math.max(1,Math.round(innerWidth*scale));canvas.height=Math.max(1,Math.round(innerHeight*scale));gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(u.resolution,canvas.width,canvas.height);}
    function scroll(){const y=gallery.getBoundingClientRect().top;const t=Math.max(0,Math.min(1,(innerHeight*.95-y)/(innerHeight*.70)));desired=t*t*(3-2*t);}
    function draw(now){frame=0;mouse=mouse.map((v,i)=>v+(target[i]-v)*.045);mix=reduce.matches?desired:mix+(desired-mix)*.055;gl.uniform2f(u.pointer,...mouse);gl.uniform1f(u.time,reduce.matches?0:(now-start)/1000);gl.uniform1f(u.blend,mix);gl.drawArrays(gl.TRIANGLES,0,3);if(!document.hidden)frame=requestAnimationFrame(draw);}
    window.addEventListener('resize',()=>{resize();scroll();});window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('pointermove',e=>{if(!reduce.matches)target=[e.clientX/innerWidth,1-e.clientY/innerHeight];},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else if(!frame)frame=requestAnimationFrame(draw);});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);canvas.style.visibility='hidden';});resize();scroll();mix=desired;frame=requestAnimationFrame(draw);
  } catch(error) {canvas.style.visibility='hidden';console.warn('Background Serviços indisponível:',error);}
})();
