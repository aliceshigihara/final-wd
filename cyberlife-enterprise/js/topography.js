/* Independent vanilla WebGL interpretation of React Bits Topography.
   Reference: https://reactbits.dev/backgrounds/topography */
(() => {
  const canvas = document.querySelector('#topography-home');
  if (!canvas) return;
  const section = canvas.closest('.landing-details');
  const reveal = section.querySelector('.landing-reveal');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const gl = canvas.getContext('webgl2', {alpha: true, antialias: false});
  const clamp = x => Math.max(0, Math.min(1, x));
  let visible = false, raf = 0, time = 0, last = 0, scroll = 0, fade = 1;
  let mouse = [0.5, 0.5], target = [0.5, 0.5], hover = 0, active = 0, click = [-10,-10], clickTime = -20;
  let program, uniforms;
  const vertex = `#version 300 es
  void main(){ vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2)); gl_Position=vec4(p*2.-1.,0.,1.); }`;
  const fragment = `#version 300 es
  precision highp float;
  uniform vec2 resolution, mouse, pulse;
  uniform float time, travel, hover, age;
  out vec4 color;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
  float terrain(vec2 p){return .65*noise(p)+.24*noise(p*2.07+7.)+.11*noise(p*4.13-3.);}
  void main(){
    vec2 uv=gl_FragCoord.xy/resolution;
    float aspect=resolution.x/resolution.y;
    vec2 p=(uv-.5)*vec2(aspect,1.);
    float depth=1.0+uv.y*1.6;
    vec2 q=vec2(p.x*6.*depth,uv.y*8.*depth+time*.12+travel*1.5);
    q+=vec2(sin(q.y*.7),cos(q.x*.55))*.65;
    vec2 delta=(uv-mouse)*vec2(aspect,1.);
    float lift=exp(-dot(delta,delta)*22.)*hover;
    float d=length((uv-pulse)*vec2(aspect,1.));
    float wave=exp(-pow((d-age*.35)*35.,2.))*exp(-max(age,0.)*1.5)*step(0.,age);
    float h=terrain(q)+.12*lift+.025*wave;
    float level=h*42.;
    float dist=abs(fract(level+.5)-.5);
    float aa=max(fwidth(level),.015);
    float line=1.-smoothstep(aa*.27,aa*1.2,dist);
    float glow=exp(-dist/max(aa*2.5,.045))*.22;
    float major=1.-step(.5,mod(floor(level+.5),5.));
    vec3 tint=mix(vec3(.10,.25,.75),vec3(.24,.85,1.),smoothstep(.25,.8,h));
    float light=(line*(.55+major*.4)+glow)*(1.+lift*.7+wave*1.8);
    float fog=smoothstep(0.,.14,uv.y)*(1.-smoothstep(.72,1.,uv.y)*.75);
    float vignette=1.-.45*smoothstep(.2,.85,length(uv-.5));
    vec3 base=vec3(.031,.082,.184);
    color=vec4(base+tint*light*fog*vignette,1.);
  }`;
  if (gl) {
    try {
      const compile = (type, source) => { const shader=gl.createShader(type); gl.shaderSource(shader,source); gl.compileShader(shader); if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader)); return shader; };
      program=gl.createProgram(); gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex)); gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment)); gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
      uniforms=Object.fromEntries(['resolution','mouse','pulse','time','travel','hover','age'].map(k=>[k,gl.getUniformLocation(program,k)]));
    } catch(error) { console.warn('Topography:',error); program=null; }
  }
  function resize(){const r=canvas.getBoundingClientRect(); const scale=Math.min(devicePixelRatio||1,1.5,1600/Math.max(1,r.width)); canvas.width=Math.max(1,Math.round(r.width*scale)); canvas.height=Math.max(1,Math.round(r.height*scale)); if(gl)gl.viewport(0,0,canvas.width,canvas.height); request();}
  function updateScroll(){const r=section.getBoundingClientRect(), vh=innerHeight; scroll=clamp((vh-r.top)/(vh+r.height)); fade=clamp((vh-r.top)/(vh*.65)); request();}
  function request(){if(!raf)raf=requestAnimationFrame(draw);}
  function draw(now){raf=0; const dt=last?Math.min(.05,(now-last)/1000):0; last=now; if(!reduced.matches)time+=dt; const opacity=reduced.matches?1:fade*fade*(3-2*fade); section.style.setProperty('--topography-opacity',opacity); reveal.style.setProperty('--reveal-opacity',opacity); reveal.style.setProperty('--reveal-offset',`${(1-opacity)*42}px`); mouse=mouse.map((v,i)=>v+(target[i]-v)*.08); hover+=(active-hover)*.06;
    if(program){gl.useProgram(program);gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);gl.uniform2fv(uniforms.mouse,mouse);gl.uniform2fv(uniforms.pulse,click);gl.uniform1f(uniforms.time,time);gl.uniform1f(uniforms.travel,reduced.matches?0:scroll);gl.uniform1f(uniforms.hover,reduced.matches?0:hover);gl.uniform1f(uniforms.age,time-clickTime);gl.drawArrays(gl.TRIANGLES,0,3);}
    if(visible&&!document.hidden&&!reduced.matches)request();else last=0;
  }
  function point(e){const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height];}
  section.addEventListener('pointermove',e=>{target=point(e);active=1;});section.addEventListener('pointerleave',()=>{active=0;});section.addEventListener('pointerdown',e=>{if(!reduced.matches){click=point(e);clickTime=time;request();}});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)request();}).observe(section);
  new ResizeObserver(resize).observe(canvas); window.addEventListener('scroll',updateScroll,{passive:true});window.addEventListener('resize',updateScroll,{passive:true}); document.addEventListener('visibilitychange',()=>{if(!document.hidden)request();});reduced.addEventListener('change',request);resize();updateScroll();
})();
