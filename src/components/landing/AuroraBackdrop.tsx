import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'

/**
 * Animated aurora backdrop for the hero.
 *
 * Layers, back to front:
 *   1. The generated still (`/brand/hero-backdrop.webp`) — the premium base.
 *   2. A lightweight WebGL canvas drawing flowing aurora bands in the brand
 *      palette, blended additively so it reads as living light over the still.
 *   3. Gradient + vignette overlays so foreground copy stays legible.
 *
 * Degrades safely: if the user prefers reduced motion, or WebGL is missing,
 * only the still + overlays render (no canvas, no animation loop).
 */

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;

// Hash / value-noise / fbm — cheap flowing field.
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i+vec2(0.0,0.0)), hash(i+vec2(1.0,0.0)), u.x),
             mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y;

  float t = u_time * 0.045;

  // Vertical aurora curtains drifting sideways over time.
  float flow = fbm(vec2(p.x * 1.6 + t, p.y * 0.7 - t * 0.6));
  float bands = fbm(vec2(p.x * 3.4 - t * 0.8, p.y * 1.2 + flow * 1.4));

  // Brand palette: purple -> blue -> cyan.
  vec3 purple = vec3(0.427, 0.231, 0.957);
  vec3 blue   = vec3(0.169, 0.549, 0.973);
  vec3 cyan   = vec3(0.184, 0.773, 0.937);

  vec3 col = mix(purple, blue, smoothstep(0.2, 0.8, flow));
  col = mix(col, cyan, smoothstep(0.5, 1.0, bands) * 0.7);

  // Intensity: brightest in a lower-centre arc, fading up and to the edges.
  float vert = smoothstep(0.05, 0.85, bands) * smoothstep(1.05, 0.25, uv.y);
  float edge = smoothstep(0.0, 0.35, uv.x) * smoothstep(1.0, 0.65, uv.x);
  float intensity = vert * (0.55 + 0.45 * edge);

  gl_FragColor = vec4(col * intensity, intensity);
}
`

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh)
    return null
  }
  return sh
}

export function AuroraBackdrop({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      (canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: true }) as
        | WebGLRenderingContext
        | null) ?? null
    if (!gl) return

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return
    const prog = gl.createProgram()
    if (!prog) return
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    // Fullscreen triangle.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'u_res')
    const uTime = gl.getUniformLocation(prog, 'u_time')

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    function resize() {
      if (!canvas) return false
      const w = Math.floor(canvas.clientWidth * dpr)
      const h = Math.floor(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl!.viewport(0, 0, w, h)
      }
      return true
    }

    let raf = 0
    let running = true
    const start = performance.now()

    function frame(now: number) {
      if (!running) return
      if (resize()) {
        gl!.uniform2f(uRes, canvas!.width, canvas!.height)
        gl!.uniform1f(uTime, (now - start) / 1000)
        gl!.clearColor(0, 0, 0, 0)
        gl!.clear(gl!.COLOR_BUFFER_BIT)
        gl!.drawArrays(gl!.TRIANGLES, 0, 3)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // Pause when the tab is hidden — no point burning GPU off-screen.
    const onVis = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!running) {
        running = true
        raf = requestAnimationFrame(frame)
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVis)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
    }
  }, [reduce])

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {/* 1. Generated still. */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: 'url(/brand/hero-backdrop.webp)' }}
      />
      {/* 2. Animated aurora (skipped under reduced-motion). */}
      {!reduce && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full mix-blend-screen opacity-80" />
      )}
      {/* 3. Legibility overlays: darken the top where copy lives, fade to page bg. */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink-900/85 via-ink-900/55 to-ink-900" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, transparent 35%, rgba(11,11,20,0.65) 100%)',
        }}
      />
    </div>
  )
}
