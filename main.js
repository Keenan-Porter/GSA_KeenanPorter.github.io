// because gulls uses the await keyword, we have to wrap our
// code in an async function and call it. when we use js modules we
// don't have to do this, which is nice... but wrapping isn't that
// big of a deal.
async function run() {
  const sg = await gulls.init()

  await Mouse.init()
  await Video.init()

  const mouse_u = sg.uniform( [0,0,0] )

  // a simple vertex shader to make a quad
  const quadVertexShader = gulls.constants.vertex

  // our fragment shader, just returns blue
  const fragmentShader = `
  @group(0) @binding(0) var<uniform> res   : vec2f;
  @group(0) @binding(1) var<uniform> mouse : vec3f;
  @group(0) @binding(2) var<uniform> frame : f32;
  @group(0) @binding(3) var<uniform> slider: f32;
  @group(0) @binding(4) var videoSampler:   sampler;
  @group(0) @binding(5) var<uniform> slider2: f32;
  @group(0) @binding(6) var<uniform> button: i32;
  @group(1) @binding(0) var videoBuffer:    texture_external;
  
  fn random( uv: vec2f ) -> f32 {
    return fract( sin( dot( uv, vec2f(12.9898 + frame/240, 78.233 - frame/240) ) ) * 43758.5453 );
  }

  fn skew( uv: vec2f ) -> vec2f {
    var r = vec2(0.0);
    r.x = 1.1547*uv.x* sin(frame/240.0);
    r.y = uv.y+0.5*r.x * cos(frame/120.0);
    return r;
  }

  fn noise( uv: vec2f ) -> vec3f {
    var xyz = vec3(0.0);

    var pn = fract(skew(uv));
    if (pn.x > pn.y) {
        xyz.x = 1.0-pn.x;
        xyz.y = 1.0 - pn.y-pn.x;
        xyz.z = pn.y;
    } else {
        xyz.x = 1.0-pn.x;
        xyz.y = 1.0 - pn.y-pn.x;
        xyz.x = pn.x;
    }

    return fract(xyz);
  }

  @fragment
  fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
    let video = textureSampleBaseClampToEdge( videoBuffer, videoSampler, pos.xy / res);

    let p = (pos.xy / res) * 5.0;

    var n = noise( p ) * slider2;

    let bbutton = bool(button);

    if( bbutton ) {
      n = 1.0 - n;
    }

    let uv = pos.xy / (res * slider);
    return vec4f(mouse.x - video.x + n.x, sin(frame/60.) - mouse.y + video.y - n.y, uv.y + video.z - n.z, 1. );
  }
  `

  // our vertex + fragment shader together
  const shader = quadVertexShader + fragmentShader

  const slider = document.querySelector('#slider')
  const slider2 = document.querySelector('#slider2')
  const button = document.querySelector('#button')

  // create a render pass
  let frame_u  = sg.uniform( 0 )
  let slider_u = sg.uniform( slider.value )
  let slider2_u = sg.uniform( slider2.value )
  let button_u = sg.uniform( false )
  const renderPass = await sg.render({ 
    shader,
    data:[
      sg.uniform( [window.innerWidth, window.innerHeight] ),
      mouse_u,
      frame_u,
      slider_u,
      sg.sampler(),
      slider2_u,
      button_u,
      sg.video( Video.element )
    ],
    onframe() {
      frame_u.value++,
      mouse_u.value = Mouse.values
    }
  })

// our sliders value returns a string, so we'll convert it to a
// floating point number with parseFloat()
slider.oninput = ()=> slider_u.value = parseFloat( slider.value )
slider2.oninput = ()=> slider2_u.value = parseFloat( slider2.value )
button.onclick = () => button_u.value = !button_u.value

  // run our render pass
  sg.run( renderPass )
}

run()