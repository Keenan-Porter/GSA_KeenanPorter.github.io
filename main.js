import { default as gulls } from './gulls.js'

// start seagulls, by default it will use the first <canvas> element it
// finds in your HTML page
const sg   = await gulls.init()

// a simple vertex shader to make a quad
const quadVertexShader = gulls.constants.vertex

// our fragment shader, just returns blue
const fragmentShader = `
  @group(0) @binding(0) var<uniform> res   : vec2f;
  @group(0) @binding(1) var<uniform> frame : f32;
  
  @fragment
  fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
    let uv = pos.xy / res;
    return vec4f( uv.x, .5+sin(frame/60.)*.5, uv.y, 1. );
  }
`

// our vertex + fragment shader together
const shader = quadVertexShader + fragmentShader

// create a render pass
let frame = sg.uniform( 0 )
const renderPass = await sg.render({ 
  shader,
  // add a data array to specify uniforms / buffers / textures etc.
  data:[
    sg.uniform([ window.innerWidth, window.innerHeight ]),
    // make sure this is second so it gets bound to index 1
    frame
  ],
  onframe() { frame.value++ }
})

// run our render pass
sg.run( renderPass )