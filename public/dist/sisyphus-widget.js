//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = (n, r, a) => (a = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule ? t(a, "default", {
	value: n,
	enumerable: !0
}) : a, n));
//#endregion
//#region src/core/utils.js
function l(e, t, n) {
	return Math.max(t, Math.min(e, n));
}
//#endregion
//#region src/core/audio/audio-cue-profile.js
function u(e = 1.35, t = 2048) {
	let n = new Float32Array(t);
	for (let r = 0; r < t; r += 1) {
		let i = r * 2 / (t - 1) - 1;
		n[r] = Math.tanh(i * e);
	}
	return n;
}
function d(e) {
	let t = e.sampleRate, n = e.createBuffer(1, t * 2, t), r = n.getChannelData(0), i = 0;
	for (let e = 0; e < r.length; e += 1) {
		let t = Math.random() * 2 - 1;
		i = (i + .02 * t) / 1.02, r[e] = i * 3.2;
	}
	return n;
}
async function f(e, t) {
	let n = await fetch(t);
	if (!n.ok) throw Error(`Unable to load audio sample: ${t}`);
	let r = await n.arrayBuffer();
	return await e.decodeAudioData(r);
}
function p(e = {}) {
	return Object.freeze({
		masterGain: l(e.masterGain ?? .24, 0, 1),
		windGain: l(e.windGain ?? .16, 0, 1),
		frictionGain: l(e.frictionGain ?? .2, 0, 1),
		breathGain: l(e.breathGain ?? .14, 0, 1),
		impactGain: l(e.impactGain ?? .24, 0, 1),
		enableSampleLayer: !!e.enableSampleLayer,
		sampleBlend: l(e.sampleBlend ?? 0, 0, 1),
		samples: Object.freeze({
			wind: e.samples?.wind || "",
			friction: e.samples?.friction || ""
		})
	});
}
function m(e) {
	let t = {
		context: null,
		masterGainNode: null,
		compressorNode: null,
		windGainNode: null,
		windHighPassNode: null,
		windLowPassNode: null,
		frictionGainNode: null,
		frictionBandPassNode: null,
		frictionLowPassNode: null,
		frictionShaperNode: null,
		breathGainNode: null,
		breathFilterNode: null,
		impactGainNode: null,
		windSampleGainNode: null,
		frictionSampleGainNode: null,
		unlocked: !1,
		noiseSource: null,
		breathOsc: null,
		samplesReady: !1,
		sampleInitStarted: !1
	};
	function n(e, n, r = .08) {
		if (!e || !t.context) return;
		let i = t.context.currentTime;
		e.gain.setTargetAtTime(n, i, r);
	}
	function r() {
		if (t.context) return t.context;
		let e = window.AudioContext || window.webkitAudioContext;
		if (!e) return null;
		let n = new e(), r = n.createGain();
		r.gain.value = 0;
		let i = n.createDynamicsCompressor();
		i.threshold.value = -23, i.knee.value = 18, i.ratio.value = 2.8, i.attack.value = .004, i.release.value = .24, r.connect(i), i.connect(n.destination);
		let a = n.createGain();
		a.gain.value = 0;
		let o = n.createBiquadFilter();
		o.type = "highpass", o.frequency.value = 70;
		let s = n.createBiquadFilter();
		s.type = "lowpass", s.frequency.value = 360, a.connect(o), o.connect(s), s.connect(r);
		let c = n.createGain();
		c.gain.value = 0;
		let l = n.createBiquadFilter();
		l.type = "bandpass", l.frequency.value = 160, l.Q.value = 1.4;
		let f = n.createWaveShaper();
		f.curve = u(1.2), f.oversample = "2x";
		let p = n.createBiquadFilter();
		p.type = "lowpass", p.frequency.value = 600, c.connect(l), l.connect(f), f.connect(p), p.connect(r);
		let m = n.createGain();
		m.gain.value = 0;
		let h = n.createBiquadFilter();
		h.type = "lowpass", h.frequency.value = 260, m.connect(h), h.connect(r);
		let g = n.createGain();
		g.gain.value = 0, g.connect(r);
		let _ = n.createGain();
		_.gain.value = 0, _.connect(r);
		let v = n.createGain();
		v.gain.value = 0, v.connect(r);
		let y = d(n), b = n.createBufferSource();
		b.buffer = y, b.loop = !0, b.connect(a), b.connect(c), b.start();
		let x = n.createOscillator();
		return x.type = "triangle", x.frequency.value = 100, x.connect(m), x.start(), t.context = n, t.masterGainNode = r, t.compressorNode = i, t.windGainNode = a, t.windHighPassNode = o, t.windLowPassNode = s, t.frictionGainNode = c, t.frictionBandPassNode = l, t.frictionLowPassNode = p, t.frictionShaperNode = f, t.breathGainNode = m, t.breathFilterNode = h, t.impactGainNode = g, t.windSampleGainNode = _, t.frictionSampleGainNode = v, t.noiseSource = b, t.breathOsc = x, n;
	}
	async function i() {
		if (!e.enableSampleLayer || t.sampleInitStarted || !t.context) return;
		t.sampleInitStarted = !0;
		let n = [];
		if (e.samples.wind && n.push(f(t.context, e.samples.wind).then((e) => {
			let n = t.context.createBufferSource();
			n.buffer = e, n.loop = !0, n.connect(t.windSampleGainNode), n.start();
		})), e.samples.friction && n.push(f(t.context, e.samples.friction).then((e) => {
			let n = t.context.createBufferSource();
			n.buffer = e, n.loop = !0, n.connect(t.frictionSampleGainNode), n.start();
		})), n.length) try {
			await Promise.all(n), t.samplesReady = !0;
		} catch (e) {
			console.warn("Sample audio layer could not be initialized, using procedural fallback.", e);
		}
	}
	async function a() {
		let n = r();
		n && (n.state === "suspended" && await n.resume(), t.unlocked = !0, t.masterGainNode.gain.setTargetAtTime(e.masterGain, n.currentTime, .18), i());
	}
	function o(r) {
		if (!t.unlocked || !t.context) return;
		let i = l(r.rockSpeed ?? 0, 0, 4.5), a = l(r.ascentProgress ?? 0, 0, 1), o = !!r.isPushing, s = l(r.moodImpact ?? 0, 0, 1), c = !!r.isWindActive, u = l((i - .08) / 1.9, 0, 1), d = l((i - .08) / 1.55, 0, 1), f = o ? 1 : 0, p = l(e.masterGain * (.92 + f * .16 + s * .08), 0, 1), m = e.windGain * (.62 + a * .56) * (.9 + u * .34) * (o ? 1.08 : .92);
		c && (m *= 2.8);
		let h = e.frictionGain * ((o ? .3 : .06) + d * (o ? .9 : .44)), g = e.breathGain * (o ? .72 + d * .5 : .11), _ = e.enableSampleLayer && t.samplesReady ? e.sampleBlend : 0, v = 1 - _;
		n(t.masterGainNode, p, .24), n(t.windGainNode, m * v, .18), n(t.frictionGainNode, h * v, .12), n(t.breathGainNode, g, .16), n(t.windSampleGainNode, m * _, .22), n(t.frictionSampleGainNode, h * _, .16);
		let y = t.context.currentTime, b = c ? 800 + a * 600 : 260 + a * 420 + s * 130;
		t.windHighPassNode.frequency.setTargetAtTime(c ? 30 : 46 + a * 58, y, .2), t.windLowPassNode.frequency.setTargetAtTime(b, y, .2), t.frictionBandPassNode.frequency.setTargetAtTime(110 + i * 132, y, .12), t.frictionBandPassNode.Q.setTargetAtTime(1.08 + d * 2, y, .12), t.frictionLowPassNode.frequency.setTargetAtTime(430 + i * 210 + (o ? 50 : 0), y, .14), t.breathFilterNode.frequency.setTargetAtTime(170 + (o ? 180 : 90) + d * 110, y, .2), t.breathOsc && t.breathOsc.frequency.setTargetAtTime(90 + d * 38 + (o ? 16 : 0), y, .2);
	}
	function s(n) {
		if (!t.unlocked || !t.context || !t.impactGainNode) return;
		let r = l(n, 0, 1), i = t.context.currentTime, a = Math.max(.001, r * e.impactGain);
		t.impactGainNode.gain.cancelScheduledValues(i), t.impactGainNode.gain.setValueAtTime(a, i), t.impactGainNode.gain.exponentialRampToValueAtTime(.001, i + .14);
		let o = t.context.createOscillator(), s = t.context.createGain();
		o.type = "sine", o.frequency.setValueAtTime(120, i), o.frequency.exponentialRampToValueAtTime(48, i + .14), s.gain.setValueAtTime(a * .9, i), s.gain.exponentialRampToValueAtTime(.001, i + .16), o.connect(s), s.connect(t.masterGainNode), o.start(i), o.stop(i + .17);
	}
	return Object.freeze({
		unlock: a,
		update: o,
		triggerImpact: s
	});
}
//#endregion
//#region src/core/assets/asset-overlay.js
function h(e, t) {
	let n = Number(t);
	return Number.isFinite(n) ? n : e;
}
function g(e) {
	let t = new Image();
	return t.decoding = "async", t.src = e, new Promise((n, r) => {
		t.onload = () => n(t), t.onerror = () => r(/* @__PURE__ */ Error(`Unable to load overlay image: ${e}`));
	});
}
function _(e) {
	if (!e || typeof e != "object") throw TypeError("AssetOverlay must be an object.");
	if (typeof e.id != "string" || e.id.length === 0) throw TypeError("AssetOverlay requires a non-empty id.");
	let t = e.kind || "image";
	if (t !== "image" && t !== "sequence") throw TypeError(`AssetOverlay "${e.id}" has unsupported kind "${t}".`);
	if (t === "image" && (typeof e.src != "string" || e.src.length === 0)) throw TypeError(`AssetOverlay "${e.id}" requires a src path.`);
	if (t === "sequence" && (!Array.isArray(e.frames) || e.frames.length === 0)) throw TypeError(`AssetOverlay "${e.id}" requires non-empty "frames".`);
	return Object.freeze({
		id: e.id,
		kind: t,
		src: e.src,
		frames: Array.isArray(e.frames) ? Object.freeze([...e.frames]) : Object.freeze([]),
		layer: e.layer || "grade",
		blendMode: e.blendMode || "screen",
		opacity: l(e.opacity ?? 1, 0, 1),
		mobileOpacityMultiplier: l(e.mobileOpacityMultiplier ?? .85, 0, 1),
		parallaxX: Number(e.parallaxX || 0),
		parallaxY: Number(e.parallaxY || 0),
		pulseStrength: l(e.pulseStrength ?? 0, 0, 1),
		widthRatio: Number(e.widthRatio || 1),
		heightRatio: Number(e.heightRatio || 1),
		fps: l(h(10, e.fps), 1, 60),
		loop: e.loop !== !1,
		startOffsetMs: h(0, e.startOffsetMs)
	});
}
function v() {
	let e = [], t = /* @__PURE__ */ new Map();
	return {
		register(t) {
			e.push(t);
		},
		list() {
			return e;
		},
		setLoaded(e, n) {
			t.set(e, n);
		},
		getLoaded(e) {
			return t.get(e);
		}
	};
}
async function y(e, t) {
	let n = await fetch(t);
	if (!n.ok) throw Error(`Unable to load overlay manifest: ${t}`);
	let r = await n.json();
	if (!r || !Array.isArray(r.overlays)) throw Error("Overlay manifest requires an \"overlays\" array.");
	let i = new URL("./", t), a = r.overlays.map(async (t) => {
		let n = _(t);
		if (e.register(n), n.kind === "sequence") {
			let t = await Promise.all(n.frames.map((e) => g(new URL(e, i).toString())));
			e.setLoaded(n.id, {
				kind: "sequence",
				frames: t
			});
			return;
		}
		let r = await g(new URL(n.src, i).toString());
		e.setLoaded(n.id, {
			kind: "image",
			image: r
		});
	});
	await Promise.all(a);
}
function b(e, t, n) {
	if (!t) return null;
	if (t.kind === "image") return t.image || null;
	if (t.kind !== "sequence" || !Array.isArray(t.frames) || t.frames.length === 0) return null;
	let r = Math.max(0, n + e.startOffsetMs) / 1e3 * e.fps, i = Math.floor(r);
	return e.loop ? i %= t.frames.length : i = Math.min(i, t.frames.length - 1), t.frames[i] || null;
}
function x(e, t, n, r) {
	let i = t.list();
	if (!i.length) return;
	let a = r.height > r.width, o = r.overlayOpacityMultiplier ?? 1;
	if (!(o <= 0)) for (let s of i) {
		if (s.layer !== n) continue;
		let i = b(s, t.getLoaded(s.id), r.timeMs || 0);
		if (!i) continue;
		let c = a ? s.mobileOpacityMultiplier : 1, l = s.pulseStrength > 0 ? 1 + Math.sin(r.timeMs * .0014) * s.pulseStrength : 1, u = r.width * s.widthRatio * l, d = r.height * s.heightRatio * l, f = (r.width - u) * .5 - r.viewMinX * s.parallaxX, p = (r.height - d) * .5 - r.viewMinY * s.parallaxY;
		e.save(), e.globalCompositeOperation = s.blendMode, e.globalAlpha = s.opacity * c * o, e.drawImage(i, f, p, u, d), e.restore();
	}
}
//#endregion
//#region src/core/camera/camera-shot-preset.js
var S = [
	"id",
	"behavior",
	"followMode",
	"boundsResolver",
	"targetResolver",
	"lerpSpeed",
	"visualProfile",
	"zoomMinResolver",
	"zoomMaxResolver"
];
function C(e, t, n) {
	if (typeof e != "function") throw TypeError(`CameraShotPreset "${n}" requires function "${t}".`);
}
function w(e) {
	if (!e || typeof e != "object") throw TypeError("CameraShotPreset must be an object.");
	for (let t of S) if (!(t in e)) throw TypeError(`CameraShotPreset is missing key "${t}".`);
	if (typeof e.id != "string" || e.id.length === 0) throw TypeError("CameraShotPreset \"id\" must be a non-empty string.");
	if (typeof e.behavior != "string" || e.behavior.length === 0) throw TypeError(`CameraShotPreset "${e.id}" has invalid "behavior".`);
	if (typeof e.followMode != "string" || e.followMode.length === 0) throw TypeError(`CameraShotPreset "${e.id}" has invalid "followMode".`);
	if (C(e.boundsResolver, "boundsResolver", e.id), C(e.targetResolver, "targetResolver", e.id), C(e.zoomMinResolver, "zoomMinResolver", e.id), C(e.zoomMaxResolver, "zoomMaxResolver", e.id), typeof e.lerpSpeed != "number" || Number.isNaN(e.lerpSpeed)) throw TypeError(`CameraShotPreset "${e.id}" has invalid "lerpSpeed".`);
	if (!e.visualProfile || typeof e.visualProfile != "object") throw TypeError(`CameraShotPreset "${e.id}" requires a "visualProfile" object.`);
	return Object.freeze({ ...e });
}
function T(e, t) {
	if (!e || typeof e != "object") throw TypeError("CameraShotRegistry requires a preset map object.");
	if (typeof t != "string" || t.length === 0) throw TypeError("CameraShotRegistry requires a non-empty fallbackId.");
	if (!e[t]) throw TypeError(`CameraShotRegistry fallbackId "${t}" does not exist in presets.`);
	let n = Object.freeze({ ...e }), r = Object.freeze(Object.keys(n));
	return Object.freeze({
		fallbackId: t,
		ids: r,
		has(e) {
			return !!n[e];
		},
		get(e) {
			return n[e] || n[t];
		}
	});
}
//#endregion
//#region src/games/sisyphus/input-controller.js
var E = Object.freeze({
	PLAIN: "plain",
	SLOPE: "slope",
	WIND: "wind",
	FATIGUE: "fatigue",
	SUMMIT: "summit"
});
function D(e) {
	let { canvas: t, render: n, queryPoint: r, sisyphus: i, camera: a, cameraDrag: o, audioCueController: s, runtimeQualityController: c, GAME_STATE: l, CAMERA_BEHAVIOR: u, CAMERA_DRAG_THRESHOLD: d, CAMERA_PAN_SENSITIVITY: f, getIsPushing: p, setIsPushing: m, getGameState: h, setGameState: g, getFreePanZoom: _, setCameraBehavior: v, wakeBodies: y, beginCameraDrag: b, stopCameraDrag: x, storeFreePanTarget: S, cycleUserZoomInput: C, cycleVisualStyle: w, setQualityHintUntil: T, triggerStumble: D, getAscentProgress: O, isWindActive: k } = e, A = 0, ee = {
		x: 0,
		y: 0
	}, j = !1, te = !1, M = !1, N = 0, ne = 0, P = 0, F = 1, I = 1, L = 0, R = 0, re = 0, ie = 0, ae = null, oe = Math.PI / 2;
	Math.PI * .38;
	function se() {
		let e = typeof O == "function" ? O() : 0;
		return e < .15 ? E.PLAIN : e < .35 ? E.SLOPE : e < .55 ? E.WIND : e < .75 ? E.FATIGUE : E.SUMMIT;
	}
	function z(e, t, n) {
		return Math.max(t, Math.min(n, e));
	}
	function ce(e, t, n) {
		return e + (t - e) * n;
	}
	function le() {
		return M || j || te;
	}
	function ue() {
		j = !1, te = !1, M = !1;
	}
	function de() {
		N = 0, ne = 0, P = 0, F = 1, I = 1, L = 0, R = 0, M = !1, re = 0, ie = 0, m(!1);
	}
	function fe(e) {
		let t = h();
		if (t !== ae && (t === l.WAITING ? (ue(), de()) : t !== l.PLAYING && m(!1), ae = t), !(t !== l.PLAYING && t !== l.WAITING)) {
			if (!le()) {
				m(!1), R = 0, N = 0, ne = 0, P = 0, F = 1, I = 1, L = ce(L, 0, z(e * .004, 0, .16));
				return;
			}
			if (t === l.WAITING) {
				g(l.PLAYING);
				return;
			}
			t === l.PLAYING && (re += e, R += e, N = 0, ne = 0, P = 0, F = 1, I = 1, L = typeof k == "function" && k() ? .18 : .08, m(!0), y());
		}
	}
	function B(e) {
		return e.touches && e.touches[0] ? e.touches[0] : e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : e;
	}
	function pe(e) {
		let r = t.getBoundingClientRect(), i = B(e), a = (i.clientX - r.left) / r.width, o = (i.clientY - r.top) / r.height, s = n.bounds;
		return {
			x: s.min.x + a * (s.max.x - s.min.x),
			y: s.min.y + o * (s.max.y - s.min.y)
		};
	}
	function me(e, t) {
		return typeof r == "function" && r(e, t).length > 0;
	}
	function he(e) {
		let t = i.bounds;
		return e.x >= t.min.x - 34 && e.x <= t.max.x + 34 && e.y >= t.min.y - 34 && e.y <= t.max.y + 34;
	}
	function ge(e) {
		p() || o.active || (t.style.cursor = me([i], e) || he(e) ? "grab" : "default");
	}
	function _e(e) {
		if (!o.active || p()) return;
		e.preventDefault();
		let n = B(e), r = n.clientX - o.startClientX, i = n.clientY - o.startClientY;
		if (!o.moved && Math.hypot(r, i) < d) return;
		o.moved = !0, v(u.FREE_PAN);
		let a = Math.max(_(window.innerHeight > window.innerWidth), .001);
		S(o.startCameraX - r * f / a, o.startCameraY - i * f / a, _(window.innerHeight > window.innerWidth)), t.style.cursor = "grabbing";
	}
	function ve(e) {
		let n = t.getBoundingClientRect();
		z(((e.clientX - n.left) / n.width - .5) * 2, -1, 1) * oe * .86, M = !0;
	}
	function ye(e) {
		e && (ve(e), v(u.FOCUS_SISYPHUS), x(), s.unlock());
	}
	function V(e) {
		ye(e), h() === l.WAITING && g(l.PLAYING), y(), t.style.cursor = "grabbing";
	}
	function be(e) {
		e.preventDefault();
		let n = B(e), r = pe(e), o = h(), s = me([i], r) || he(r), c = o === l.PLAYING || o === l.WAITING;
		if (o === l.WAITING && s && i.render.opacity < .5) return;
		let u = Date.now(), d = Math.hypot(n.clientX - ee.x, n.clientY - ee.y);
		if (!s && A > 0 && u - A < 320 && d < 26) {
			A = 0, x(), C(), t.style.cursor = "default";
			return;
		}
		if (A = u, ee = {
			x: n.clientX,
			y: n.clientY
		}, c && s) {
			A = 0, V(n);
			return;
		}
		b(n.clientX, n.clientY), S(a.x, a.y, _(window.innerHeight > window.innerWidth));
	}
	function xe(e) {
		e.preventDefault(), ue(), m(!1), x(), ge(pe(e));
	}
	function H(e) {
		if (o.active && !p()) {
			_e(e);
			return;
		}
		if (M && (e.buttons > 0 || e.touches && e.touches.length > 0)) {
			ye(B(e));
			return;
		}
		ge(pe(e));
	}
	function Se(e) {
		if (e.repeat) return;
		let t = (e.key || "").toLowerCase();
		if ((t === "arrowleft" || t === "a" || t === "arrowright" || t === "d") && e.preventDefault(), t === "arrowleft" || t === "a" ? (j = !0, te = !1, v(u.FOCUS_SISYPHUS), x(), h() === l.WAITING && g(l.PLAYING), y(), s.unlock()) : (t === "arrowright" || t === "d") && (te = !0, j = !1, v(u.FOCUS_SISYPHUS), x(), h() === l.WAITING && g(l.PLAYING), y(), s.unlock()), t === "c" && C(), t === "v" && w(), t === "q") {
			let t = e.shiftKey ? `${c.getSnapshot().tier.toUpperCase()} (AUTO)` : `${c.cycleTier().toUpperCase()} (BLOQUEADA)`;
			e.shiftKey && c.clearForcedTier(), T(performance.now() + 1400), console.log(`%cCalidad visual: ${t}`, "color:#9bd1ff;font-weight:bold");
		}
	}
	function U(e) {
		let t = (e.key || "").toLowerCase();
		(t === "arrowleft" || t === "a" || t === "arrowright" || t === "d") && e.preventDefault(), (t === "arrowleft" || t === "a") && (j = !1), (t === "arrowright" || t === "d") && (te = !1), le() || m(!1);
	}
	function W() {
		t.addEventListener("mousedown", be), t.addEventListener("touchstart", be, { passive: !1 }), t.addEventListener("mousemove", H), t.addEventListener("touchmove", H, { passive: !1 }), t.addEventListener("mouseup", xe), t.addEventListener("touchend", xe, { passive: !1 }), t.addEventListener("touchcancel", xe), t.addEventListener("mouseleave", xe), window.addEventListener("keydown", Se), window.addEventListener("keyup", U);
	}
	function G() {
		t.removeEventListener("mousedown", be), t.removeEventListener("touchstart", be), t.removeEventListener("mousemove", H), t.removeEventListener("touchmove", H), t.removeEventListener("mouseup", xe), t.removeEventListener("touchend", xe), t.removeEventListener("touchcancel", xe), t.removeEventListener("mouseleave", xe), window.removeEventListener("keydown", Se), window.removeEventListener("keyup", U);
	}
	return Object.freeze({
		register: W,
		destroy: G,
		update: fe,
		getBalanceState: () => ({
			playerAngle: P,
			targetAngle: N,
			desiredTargetAngle: ne,
			alignmentScore: F,
			tractionScore: I,
			strainScore: L,
			isInputHeld: le(),
			isPushing: p(),
			phase: se(),
			recoveryGraceMs: ie
		}),
		getCurrentPhase: se,
		getComboCount: () => 0
	});
}
//#endregion
//#region src/games/sisyphus/scene-renderer.js
var O = {
	skyTop: "#171c31",
	skyMid: "#29314d",
	skyHaze: "#5d6874",
	moon: "#f0d8a2",
	moonGlow: "rgba(240, 216, 162, 0.18)",
	farMountain: "#394156",
	farMountainShadow: "#2c3345",
	mountainBase: "#7c8796",
	mountainLight: "#9aa6b6",
	mountainShadow: "#505a68",
	mountainDeep: "#3d4652",
	scree: "#606975",
	groundTop: "#707883",
	groundBottom: "#515862",
	haze: "rgba(208, 214, 224, 0.08)"
}, k = Math.PI * 2;
function A(e) {
	let { LOGICAL_W: t, LOGICAL_H: n, SURF_Y: r, PEAK_A_X: i, PEAK_A_Y: a, PEAK_B_X: o, PEAK_B_Y: s, RIGHT_DESCENT_MID_X: c, RIGHT_DESCENT_MID_Y: u, RIGHT_DESCENT_LOW_X: d, RIGHT_DESCENT_LOW_Y: f, RIGHT_FACE_BASE_X: p, slopeYAt: m, terrainYAt: h, TERRAIN_SURFACE_POINTS: g } = e, _ = [{
		x: 18,
		y: r + 16
	}, ...g], v = [
		{
			x: 220,
			y: n + 120
		},
		{
			x: 340,
			y: 382
		},
		{
			x: 528,
			y: 286
		},
		{
			x: i - 14,
			y: a + 20
		},
		{
			x: o + 12,
			y: s + 18
		},
		{
			x: c + 26,
			y: u + 70
		},
		{
			x: d + 22,
			y: f + 76
		},
		{
			x: p + 18,
			y: n + 130
		}
	], y = [
		{
			x: -84,
			y: n + 160
		},
		{
			x: -20,
			y: r + 46
		},
		..._,
		{
			x: p + 24,
			y: n + 140
		}
	], b = [
		{
			x: -20,
			y: r
		},
		{
			x: 150,
			y: r
		},
		{
			x: 370,
			y: r
		},
		{
			x: 620,
			y: r
		},
		{
			x: 920,
			y: r
		},
		{
			x: 920,
			y: n + 40
		},
		{
			x: -20,
			y: n + 40
		}
	], x = ee(), S = Array.from({ length: 72 }, (e, n) => ({
		x: -120 + x() * (t + 240),
		y: 18 + x() * 210,
		radius: .5 + x() * 1.5,
		alpha: .12 + x() * .55,
		phase: x() * k,
		pulse: .45 + x() * 1.4,
		glow: n % 7 == 0,
		cross: n % 13 == 0,
		hue: x() > .7 ? x() > .5 ? 220 : 30 : 0
	})), C = [
		{
			y: 124,
			height: 62,
			drift: 48,
			speed: 12e-5,
			alpha: .07,
			phase: x() * k,
			parallax: .1
		},
		{
			y: 214,
			height: 86,
			drift: 78,
			speed: 9e-5,
			alpha: .09,
			phase: x() * k,
			parallax: .16
		},
		{
			y: 324,
			height: 110,
			drift: 60,
			speed: 6e-5,
			alpha: .07,
			phase: x() * k,
			parallax: .22
		}
	], w = Array.from({ length: 28 }, () => ({
		x: 650 + x() * 260,
		y: 64 + x() * 150,
		radius: .7 + x() * 2.4,
		alpha: .018 + x() * .045,
		phase: x() * k,
		drift: 8 + x() * 24
	}));
	function T(e, t, n = !0) {
		e.beginPath(), e.moveTo(t[0].x, t[0].y);
		for (let n = 1; n < t.length; n += 1) e.lineTo(t[n].x, t[n].y);
		n && e.closePath();
	}
	function E(e, t, n, r = 1) {
		e.save(), e.globalAlpha = r, T(e, t), e.fillStyle = n, e.fill(), e.restore();
	}
	function D(e) {
		return e.map((e, t) => `${t === 0 ? "M" : "L"} ${e.x.toFixed(1)} ${e.y.toFixed(1)}`).join(" ") + " Z";
	}
	function A() {
		if (typeof Image > "u") return null;
		let e = D(y), t = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 160 1180 580">
  <defs>
    <linearGradient id="base" x1="170" y1="220" x2="900" y2="700" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#aeb9c7"/>
      <stop offset="0.42" stop-color="#778393"/>
      <stop offset="1" stop-color="#3f4855"/>
    </linearGradient>
    <linearGradient id="moonFace" x1="360" y1="260" x2="1010" y2="610" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#dce4ed" stop-opacity="0.20"/>
      <stop offset="0.55" stop-color="#a8b6c8" stop-opacity="0.13"/>
      <stop offset="1" stop-color="#232b38" stop-opacity="0.20"/>
    </linearGradient>
    <linearGradient id="shadowFace" x1="80" y1="420" x2="690" y2="600" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#111722" stop-opacity="0.34"/>
      <stop offset="0.68" stop-color="#202838" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#202838" stop-opacity="0"/>
    </linearGradient>
    <filter id="stoneGrain" x="-15%" y="-15%" width="130%" height="130%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018 0.055" numOctaves="3" seed="23"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.11"/>
      </feComponentTransfer>
    </filter>
    <clipPath id="mountainClip">
      <path d="${e}"/>
    </clipPath>
  </defs>
  <g clip-path="url(#mountainClip)">
    <path d="${e}" fill="url(#base)"/>
    <path d="M 346 402 L 548 322 L 842 222 L 1040 690 L 672 680 Z" fill="url(#moonFace)"/>
    <path d="M -80 684 L -20 566 L 238 478 L 388 508 L 276 690 Z" fill="url(#shadowFace)"/>
    <path d="M 800 226 L 952 224 L 1018 356 L 1038 692 L 828 680 Z" fill="#252e3b" opacity="0.20"/>
    <path d="M 400 386 L 614 298 L 782 236 L 650 515 Z" fill="#edf2f8" opacity="0.045"/>
    <path d="${e}" filter="url(#stoneGrain)" opacity="0.7"/>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 210 502 C 286 484 330 506 410 488" stroke="#eef3f8" stroke-opacity="0.035" stroke-width="2"/>
      <path d="M 370 428 C 452 398 520 410 610 372" stroke="#eef3f8" stroke-opacity="0.045" stroke-width="2"/>
      <path d="M 560 346 C 650 314 710 292 820 240" stroke="#f6f0df" stroke-opacity="0.052" stroke-width="2.4"/>
      <path d="M 686 486 C 780 456 874 452 1014 414" stroke="#101722" stroke-opacity="0.10" stroke-width="3"/>
    </g>
  </g>
  <path d="${_.map((e, t) => `${t === 0 ? "M" : "L"} ${e.x.toFixed(1)} ${e.y.toFixed(1)}`).join(" ")}" fill="none" stroke="#f0f4fa" stroke-opacity="0.20" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`, n = new Image();
		return n.decoding = "async", n.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(t)}`, n;
	}
	let j = A();
	function te(e, t) {
		e.save();
		for (let n of S) {
			let r = .52 + .48 * Math.sin(t * .0013 * n.pulse + n.phase), i = n.alpha * r, a = n.hue === 220 ? 200 : n.hue === 30 ? 255 : 244, o = n.hue === 220 ? 220 : n.hue === 30 ? 230 : 236, s = n.hue === 220 ? 255 : n.hue === 30 ? 200 : 212;
			if (e.fillStyle = `rgba(${a}, ${o}, ${s}, ${i.toFixed(3)})`, e.beginPath(), e.arc(n.x, n.y, n.radius, 0, k), e.fill(), n.cross) {
				let t = n.radius * 6;
				e.strokeStyle = `rgba(${a}, ${o}, ${s}, ${(i * .3).toFixed(3)})`, e.lineWidth = .6, e.beginPath(), e.moveTo(n.x - t, n.y), e.lineTo(n.x + t, n.y), e.moveTo(n.x, n.y - t), e.lineTo(n.x, n.y + t), e.stroke();
			}
			if (n.glow) {
				let t = e.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 5.5);
				t.addColorStop(0, `rgba(${a}, ${o}, ${s}, ${(i * .22).toFixed(3)})`), t.addColorStop(.5, `rgba(${a}, ${o}, ${s}, ${(i * .06).toFixed(3)})`), t.addColorStop(1, `rgba(${a}, ${o}, ${s}, 0)`), e.fillStyle = t, e.beginPath(), e.arc(n.x, n.y, n.radius * 5.5, 0, k), e.fill();
			}
		}
		e.restore();
	}
	function M(e, n, r, i, a, o = 0, s = !1) {
		e.save();
		let c = (s ? 6 : 1) + o * 1.5, u = 1 + o * .8 + (s ? .4 : 0);
		for (let o of C) {
			let d = Math.sin(a * o.speed * c + o.phase) * o.drift * (s ? 2 : 1), f = n * o.parallax, p = e.createLinearGradient(0, o.y, 0, o.y + o.height);
			p.addColorStop(0, "rgba(226, 231, 239, 0)");
			let m = o.alpha * r.mistAlphaMultiplier * (1 + i.sceneFx.hazeBoost) * u;
			p.addColorStop(.45, `rgba(226, 231, 239, ${l(m, 0, .4).toFixed(3)})`), p.addColorStop(1, "rgba(226, 231, 239, 0)"), e.fillStyle = p, e.fillRect(-1400 + d + f, o.y, t + 2800, o.height);
		}
		e.restore();
	}
	function N(e, t, n) {
		e.save(), e.globalCompositeOperation = "screen";
		for (let r of w) {
			let i = Math.sin(n * 18e-5 + r.phase) * r.drift, a = .65 + .35 * Math.sin(n * 42e-5 + r.phase * 1.7), o = r.alpha * a * (1 + t.sceneFx.glowBoost), s = e.createRadialGradient(r.x + i, r.y, 0, r.x + i, r.y, r.radius * 7);
			s.addColorStop(0, `rgba(224, 232, 242, ${o.toFixed(3)})`), s.addColorStop(1, "rgba(224, 232, 242, 0)"), e.fillStyle = s, e.beginPath(), e.arc(r.x + i, r.y, r.radius * 7, 0, k), e.fill();
		}
		let r = e.createLinearGradient(610, 72, 900, 252);
		r.addColorStop(0, "rgba(210, 224, 240, 0)"), r.addColorStop(.44, `rgba(210, 224, 240, ${(.035 + t.sceneFx.glowBoost * .045).toFixed(3)})`), r.addColorStop(1, "rgba(210, 224, 240, 0)"), e.fillStyle = r, e.fillRect(520, 42, 460, 250), e.restore();
	}
	function ne(e, r, i, a, o, s = 0, c = !1) {
		let l = Math.floor(s * 15), u = e.createLinearGradient(0, 0, 0, n);
		u.addColorStop(0, `rgb(${17 - l}, ${23 - l}, ${40 - l})`), u.addColorStop(.18, `rgb(${21 - l}, ${28 - l}, ${46 - l})`), u.addColorStop(.42, O.skyTop), u.addColorStop(.62, O.skyMid), u.addColorStop(1, O.skyHaze), e.fillStyle = u, e.fillRect(-1e3, 0, t + 2e3, n + 1e3), te(e, o);
		let d = i.moonRadius, f = 1 + a.sceneFx.glowBoost, p = e.createRadialGradient(840, 112, d * .5, 840, 112, 320 * i.moonGlowScale * f);
		p.addColorStop(0, `rgba(240, 216, 162, ${(.06 * i.moonGlowAlpha).toFixed(3)})`), p.addColorStop(.3, `rgba(230, 210, 170, ${(.03 * i.moonGlowAlpha).toFixed(3)})`), p.addColorStop(.7, `rgba(180, 200, 230, ${(.015 * i.moonGlowAlpha).toFixed(3)})`), p.addColorStop(1, "rgba(180, 200, 230, 0)"), e.fillStyle = p, e.fillRect(-1e3, -1e3, t + 2e3, n + 2e3);
		let m = e.createRadialGradient(840, 112, d * .8, 840, 112, 160 * i.moonGlowScale * f);
		m.addColorStop(0, `rgba(248, 228, 180, ${(.22 * i.moonGlowAlpha * f).toFixed(3)})`), m.addColorStop(.35, `rgba(240, 216, 162, ${(.1 * i.moonGlowAlpha).toFixed(3)})`), m.addColorStop(.7, `rgba(240, 216, 162, ${(.03 * i.moonGlowAlpha).toFixed(3)})`), m.addColorStop(1, "rgba(240, 216, 162, 0)"), e.fillStyle = m, e.fillRect(540, -188, 600, 600), N(e, a, o), e.save(), e.globalAlpha = i.moonAlpha, e.beginPath(), e.arc(840, 112, d, 0, k), e.clip();
		let h = e.createRadialGradient(840 - d * .3, 112 - d * .25, 0, 840, 112, d);
		h.addColorStop(0, "#fae8c4"), h.addColorStop(.5, "#f0d8a2"), h.addColorStop(.85, "#dfc78a"), h.addColorStop(1, "#c8b070"), e.fillStyle = h, e.fillRect(840 - d, 112 - d, d * 2, d * 2), e.globalAlpha = i.moonAlpha * .12, e.fillStyle = "#8a7a52", e.beginPath(), e.ellipse(840 - d * .15, 112 + d * .1, d * .3, d * .2, -.3, 0, k), e.fill(), e.beginPath(), e.ellipse(840 + d * .2, 112 - d * .2, d * .15, d * .18, .4, 0, k), e.fill(), e.globalAlpha = i.moonAlpha * .45;
		let g = d * .65, _ = e.createRadialGradient(840 + g, 112 + d * .1, d * .1, 840 + g, 112 + d * .1, d * 1.3);
		_.addColorStop(0, "rgba(15, 20, 35, 0.7)"), _.addColorStop(.5, "rgba(15, 20, 35, 0.3)"), _.addColorStop(1, "rgba(15, 20, 35, 0)"), e.fillStyle = _, e.fillRect(840 - d, 112 - d, d * 2, d * 2), e.restore();
		let v = e.createLinearGradient(0, 240, 0, n);
		if (v.addColorStop(0, "rgba(255, 255, 255, 0)"), v.addColorStop(1, O.haze), e.fillStyle = v, e.fillRect(-1e3, 240, t + 2e3, n), i.hazeAlphaBoost > 0) {
			let r = e.createLinearGradient(0, 210, 0, n);
			r.addColorStop(0, "rgba(246, 240, 224, 0)"), r.addColorStop(1, `rgba(246, 240, 224, ${(i.hazeAlphaBoost + a.sceneFx.hazeBoost).toFixed(3)})`), e.fillStyle = r, e.fillRect(-1e3, 210, t + 2e3, n);
		}
		M(e, r, i, a, o, s, c);
	}
	function P(e, r, i, a, o, s) {
		e.save(), e.translate(r * .18 * a.distantParallaxMultiplier, i * .04);
		let c = e.createLinearGradient(0, 230, 0, 460);
		c.addColorStop(0, "rgba(216, 226, 239, 0)"), c.addColorStop(.52, `rgba(216, 226, 239, ${(.055 + o.sceneFx.hazeBoost * .08).toFixed(3)})`), c.addColorStop(1, "rgba(216, 226, 239, 0)"), e.fillStyle = c, e.fillRect(-220, 230, t + 440, 240), E(e, [
			{
				x: -40,
				y: n + 20
			},
			{
				x: -40,
				y: 380
			},
			{
				x: 90,
				y: 320
			},
			{
				x: 200,
				y: 356
			},
			{
				x: 360,
				y: 270
			},
			{
				x: 520,
				y: 334
			},
			{
				x: 700,
				y: 246
			},
			{
				x: 940,
				y: 342
			},
			{
				x: 940,
				y: n + 20
			}
		], O.farMountain, a.distantMountainAlpha), E(e, [
			{
				x: -40,
				y: n + 20
			},
			{
				x: -40,
				y: 430
			},
			{
				x: 120,
				y: 372
			},
			{
				x: 280,
				y: 406
			},
			{
				x: 420,
				y: 344
			},
			{
				x: 580,
				y: 396
			},
			{
				x: 760,
				y: 330
			},
			{
				x: 940,
				y: 392
			},
			{
				x: 940,
				y: n + 20
			}
		], O.farMountainShadow, .9 * a.distantMountainAlpha);
		let l = e.createLinearGradient(0, 288, 0, 418);
		l.addColorStop(0, "rgba(230, 236, 244, 0)"), l.addColorStop(.5, `rgba(230, 236, 244, ${(.04 + o.sceneFx.hazeBoost * .07).toFixed(3)})`), l.addColorStop(1, "rgba(230, 236, 244, 0)"), e.fillStyle = l;
		let u = Math.sin(s * 8e-5) * 36;
		e.fillRect(-260 + u, 286, t + 520, 150), e.restore();
	}
	function F(e, l, d) {
		let f = e.createLinearGradient(640, 40, t, n);
		f.addColorStop(0, "#5a6473"), f.addColorStop(.52, "#465061"), f.addColorStop(1, "#2b3442"), E(e, v, f, .98);
		let m = e.createLinearGradient(140, 170, 640, n);
		m.addColorStop(0, O.mountainLight), m.addColorStop(.45, O.mountainBase), m.addColorStop(1, O.mountainShadow), E(e, y, m, j?.complete ? .34 : 1), e.save(), T(e, y), e.clip(), j?.complete && j.naturalWidth > 0 && e.drawImage(j, -100, 160, 1180, 580);
		let g = e.createLinearGradient(0, n, t * .78, 120);
		g.addColorStop(0, "rgba(26, 31, 41, 0.42)"), g.addColorStop(.55, "rgba(26, 31, 41, 0.12)"), g.addColorStop(1, "rgba(255, 255, 255, 0.08)"), e.fillStyle = g, e.fillRect(-60, 0, t + 120, n + 180);
		let b = e.createRadialGradient(i - 36, a + 18, 12, i - 36, a + 18, 168);
		b.addColorStop(0, "rgba(248, 233, 204, 0.16)"), b.addColorStop(.45, "rgba(248, 233, 204, 0.06)"), b.addColorStop(1, "rgba(248, 233, 204, 0)"), e.fillStyle = b, e.fillRect(i - 220, a - 140, 360, 280);
		let x = e.createLinearGradient(360, 260, 860, 520);
		x.addColorStop(0, "rgba(226, 234, 242, 0.13)"), x.addColorStop(.5, "rgba(202, 214, 228, 0.08)"), x.addColorStop(1, "rgba(92, 103, 118, 0.02)"), E(e, [
			{
				x: 364,
				y: h(364) + 8
			},
			{
				x: 548,
				y: h(548) - 8
			},
			{
				x: i - 18,
				y: a + 14
			},
			{
				x: p + 18,
				y: n + 118
			},
			{
				x: 694,
				y: n + 96
			}
		], x, 1);
		let S = e.createLinearGradient(180, 360, 760, 530);
		S.addColorStop(0, "rgba(18, 23, 34, 0.18)"), S.addColorStop(.62, "rgba(18, 23, 34, 0.08)"), S.addColorStop(1, "rgba(18, 23, 34, 0)"), E(e, [
			{
				x: -20,
				y: r + 46
			},
			{
				x: 236,
				y: h(236) + 12
			},
			{
				x: 382,
				y: h(382) + 34
			},
			{
				x: 276,
				y: n + 116
			},
			{
				x: -70,
				y: n + 150
			}
		], S, 1);
		let C = e.createLinearGradient(620, 210, 930, 460);
		C.addColorStop(0, "rgba(242, 235, 218, 0.10)"), C.addColorStop(.44, "rgba(174, 188, 204, 0.07)"), C.addColorStop(1, "rgba(35, 43, 56, 0.14)"), E(e, [
			{
				x: i - 34,
				y: a + 18
			},
			{
				x: o + 8,
				y: s + 20
			},
			{
				x: c + 18,
				y: u + 54
			},
			{
				x: p + 18,
				y: n + 126
			},
			{
				x: i - 4,
				y: n + 76
			}
		], C, 1), e.save(), e.globalAlpha = .22, e.lineCap = "round", e.lineJoin = "round", e.strokeStyle = `rgba(236, 241, 246, ${(.028 + l.sceneFx.hazeBoost * .018).toFixed(3)})`, e.lineWidth = 1.1;
		for (let t = 0; t < 9; t += 1) {
			let n = 210 + t * 72, r = h(n) + 28 + Math.sin(t * 1.7) * 10;
			e.beginPath(), e.moveTo(n, r), e.bezierCurveTo(n + 42, r - 10, n + 82, r + 18, n + 132, r + 4), e.stroke();
		}
		e.restore(), e.restore(), e.strokeStyle = "rgba(236, 240, 246, 0.16)", e.lineWidth = 1.8, T(e, _, !1), e.stroke(), e.save(), e.globalCompositeOperation = "screen", e.lineCap = "round", e.lineJoin = "round", e.strokeStyle = `rgba(216, 228, 238, ${(.035 + l.sceneFx.hazeBoost * .07).toFixed(3)})`, e.lineWidth = 18, e.setLineDash([90, 58]), e.lineDashOffset = -d * .006, e.beginPath();
		let w = _[0];
		e.moveTo(w.x, w.y + 18);
		for (let t = 1; t < _.length; t += 1) {
			let n = _[t];
			e.lineTo(n.x, n.y + 18);
		}
		e.stroke(), e.restore();
	}
	function I(e) {
		let i = e.createLinearGradient(0, r, 0, n + 1e3);
		i.addColorStop(0, O.groundTop), i.addColorStop(1, O.groundBottom), E(e, b, i), e.strokeStyle = "rgba(228, 233, 240, 0.08)", e.lineWidth = 1, e.beginPath(), e.moveTo(-1e3, r), e.lineTo(t + 1e3, r), e.stroke();
	}
	function L(e, t, n, r, i, a) {
		let o = h(t.position.x), s = l(o - t.bounds.max.y, -12, 90), c = (1 + l(s * .012, -.08, .75)) * a.contactShadow.spreadMul, u = i * a.contactShadow.alphaMul * (1 - l(s / 120, 0, .72));
		e.save(), e.translate(t.position.x + 16, o + 10), e.rotate(-.16), e.scale(c, 1 / c), e.fillStyle = `rgba(10, 14, 22, ${u.toFixed(3)})`, e.beginPath(), e.ellipse(0, 0, n + s * .1, r + s * .04, 0, 0, k), e.fill(), e.restore();
	}
	function R(e, r, i, a = 0, o = !1) {
		let s = (i ? i.fogAlphaMul : 1) * (1 + a * .6 + (o ? .3 : 0)), c = e.createLinearGradient(0, 172, 0, n + 80);
		c.addColorStop(0, `rgba(236, 228, 208, ${l(r.fog.nearAlpha * .4 * s, 0, 1).toFixed(3)})`), c.addColorStop(r.fog.depthBias, `rgba(228, 217, 196, ${l(r.fog.farAlpha * .55 * s, 0, 1).toFixed(3)})`), c.addColorStop(1, `rgba(30, 37, 52, ${l(r.fog.farAlpha * s, 0, 1).toFixed(3)})`), e.fillStyle = c, e.fillRect(-1200, 170, t + 2400, n);
	}
	function re(e, t) {
		e.save();
		for (let n of t) {
			let t = n.alpha * n.life;
			if (t <= 0) continue;
			let r = e.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
			r.addColorStop(0, `rgba(244, 232, 210, ${t.toFixed(3)})`), r.addColorStop(1, "rgba(244, 232, 210, 0)"), e.fillStyle = r, e.beginPath(), e.arc(n.x, n.y, n.radius, 0, k), e.fill();
		}
		e.restore();
	}
	function ie(e, t) {
		let { viewMinX: n, viewMinY: r, visualProfile: i, layerProfile: a, sceneTime: o, qualityProfile: s, rock: c, sisyphus: l, dustParticles: u, drawRock: d, drawSisyphus: f, ascentProgress: p = 0, windActive: m = !1 } = t, h = {
			sky: () => ne(e, n, i, a, o, p, m),
			distant: () => P(e, n, r, i, a, o),
			mountain: () => {
				F(e, a, o), I(e);
			},
			gameplay: () => {},
			fx: () => {
				L(e, c, 11.4, 3.2, .28, a), L(e, l, 5.7, 2.1, .18, a), d(e), f(e), re(e, u);
			},
			grade: () => {
				R(e, a, s, p, m);
			}
		};
		for (let e of a.stack) {
			let t = h[e];
			t && t();
		}
	}
	return {
		drawSceneLayers: ie,
		drawDepthFog: R,
		drawProjectedShadow: L,
		drawDustParticles: re
	};
}
function ee() {
	let e = 20260315;
	return function() {
		return e = e * 1664525 + 1013904223 >>> 0, e / 4294967296;
	};
}
//#endregion
//#region src/games/sisyphus/rock-renderer.js
var j = Math.PI * 2;
function te({ createSeededRandom: e }) {
	let t = null, n = null, r = null;
	function i(e) {
		if (n && r === e) return n;
		let t = new Path2D(), i = [
			{
				x: -.88,
				y: -.42
			},
			{
				x: -.62,
				y: -.76
			},
			{
				x: -.16,
				y: -.94
			},
			{
				x: .34,
				y: -.86
			},
			{
				x: .72,
				y: -.56
			},
			{
				x: .94,
				y: -.1
			},
			{
				x: .82,
				y: .42
			},
			{
				x: .46,
				y: .78
			},
			{
				x: -.05,
				y: .94
			},
			{
				x: -.58,
				y: .78
			},
			{
				x: -.9,
				y: .34
			},
			{
				x: -.98,
				y: -.08
			}
		].map((t) => ({
			x: t.x * e,
			y: t.y * e
		}));
		t.moveTo(i[0].x, i[0].y);
		for (let e = 1; e < i.length; e += 1) {
			let n = i[e], r = i[(e + 1) % i.length];
			t.quadraticCurveTo(n.x, n.y, (n.x + r.x) * .5, (n.y + r.y) * .5);
		}
		return t.closePath(), n = t, r = e, n;
	}
	function a(t) {
		let n = t * 2, r = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(n, n) : (() => {
			let e = document.createElement("canvas");
			return e.width = n, e.height = n, e;
		})(), i = r.getContext("2d"), a = e(42995), o = i.createRadialGradient(t * .62, t * .32, 0, t, t, t * 1.05);
		o.addColorStop(0, "#7a8d9e"), o.addColorStop(.2, "#657a8c"), o.addColorStop(.45, "#4d5e6c"), o.addColorStop(.7, "#3a4854"), o.addColorStop(1, "#1e2830"), i.fillStyle = o, i.beginPath(), i.arc(t, t, t, 0, j), i.fill(), i.save(), i.beginPath(), i.arc(t, t, t, 0, j), i.clip();
		let s = {
			x: t - 2.5,
			y: t + 1.5
		};
		for (let e = 0; e < 11; e++) {
			let n = -Math.PI * .95 + e / 11 * j + (a() - .5) * .16, r = -Math.PI * .95 + (e + 1) / 11 * j + (a() - .5) * .16, o = (n + r) * .5, c = t * (.17 + a() * .16), l = t * (.76 + a() * .2), u = t * (.76 + a() * .2), d = {
				x: t + Math.cos(n) * l,
				y: t + Math.sin(n) * l
			}, f = {
				x: t + Math.cos(r) * u,
				y: t + Math.sin(r) * u
			}, p = {
				x: s.x + Math.cos(o + (a() - .5) * .7) * c,
				y: s.y + Math.sin(o + (a() - .5) * .7) * c
			}, m = Math.cos(o + Math.PI * .72) * .5 + Math.sin(o + Math.PI * .68) * .5, h = Math.max(0, m) * .14, g = Math.max(0, -m) * .18, _ = i.createLinearGradient(d.x, d.y, p.x, p.y);
			_.addColorStop(0, `rgba(208, 226, 238, ${h.toFixed(3)})`), _.addColorStop(.55, `rgba(74, 91, 104, ${(.035 + a() * .04).toFixed(3)})`), _.addColorStop(1, `rgba(7, 11, 18, ${(.045 + g).toFixed(3)})`), i.fillStyle = _, i.beginPath(), i.moveTo(d.x, d.y), i.lineTo(f.x, f.y), i.lineTo(p.x, p.y), i.closePath(), i.fill(), i.strokeStyle = `rgba(210, 226, 238, ${(.025 + h * .35).toFixed(3)})`, i.lineWidth = .45, i.stroke();
		}
		i.restore();
		for (let e = 0; e < 18; e++) {
			let e = a() * j, n = a() * t * .8, r = t + Math.cos(e) * n, o = t + Math.sin(e) * n, s = 6 + a() * 14, c = a() > .4, l = i.createRadialGradient(r, o, 0, r, o, s);
			c ? (l.addColorStop(0, `rgba(18, 24, 32, ${(.08 + a() * .12).toFixed(2)})`), l.addColorStop(1, "rgba(18, 24, 32, 0)")) : (l.addColorStop(0, `rgba(140, 160, 180, ${(.04 + a() * .06).toFixed(2)})`), l.addColorStop(1, "rgba(140, 160, 180, 0)")), i.fillStyle = l, i.beginPath(), i.arc(r, o, s, 0, j), i.fill();
		}
		i.save(), i.beginPath(), i.arc(t, t, t, 0, j), i.clip();
		for (let e = 0; e < 14; e++) {
			let n = a() * j, r = a() * t * .85, o = t + Math.cos(n) * r, s = t + Math.sin(n) * r, c = 10 + a() * t * .9, l = n + (a() - .5) * 2.4, u = o + Math.cos(l) * c, d = s + Math.sin(l) * c, f = e % 3 == 0;
			i.beginPath(), i.moveTo(o, s);
			let p = o + (a() - .5) * 18, m = s + (a() - .5) * 18;
			i.quadraticCurveTo(p, m, u, d), f ? (i.strokeStyle = `rgba(10, 14, 22, ${(.35 + a() * .25).toFixed(2)})`, i.lineWidth = 1 + a() * 1.2) : e % 3 == 1 ? (i.strokeStyle = `rgba(160, 180, 200, ${(.06 + a() * .07).toFixed(2)})`, i.lineWidth = .4 + a() * .5) : (i.strokeStyle = `rgba(30, 38, 48, ${(.15 + a() * .15).toFixed(2)})`, i.lineWidth = .6 + a() * .7), i.stroke();
		}
		for (let e = 0; e < 5; e++) {
			let e = -Math.PI * .8 + a() * Math.PI * 1.55, n = t * (.15 + a() * .45), r = t + Math.cos(e) * n, o = t + Math.sin(e) * n, s = e + Math.PI * (.22 + a() * .42), c = 3 + Math.floor(a() * 3);
			i.beginPath(), i.moveTo(r, o);
			let l = [{
				x: r,
				y: o
			}];
			for (let e = 0; e < c; e++) {
				s += (a() - .5) * .75;
				let e = t * (.14 + a() * .19);
				r += Math.cos(s) * e, o += Math.sin(s) * e, l.push({
					x: r,
					y: o
				}), i.lineTo(r, o);
			}
			i.strokeStyle = `rgba(5, 9, 16, ${(.42 + a() * .22).toFixed(3)})`, i.lineWidth = 1.35 + a() * .7, i.lineCap = "round", i.lineJoin = "round", i.stroke(), i.beginPath(), i.moveTo(l[0].x - .7, l[0].y - .45);
			for (let e = 1; e < l.length; e++) i.lineTo(l[e].x - .7, l[e].y - .45);
			i.strokeStyle = `rgba(194, 214, 228, ${(.04 + a() * .035).toFixed(3)})`, i.lineWidth = .65, i.stroke();
			for (let e = 1; e < l.length - 1; e++) if (a() < .52) {
				let n = s + (a() > .5 ? 1 : -1) * (.8 + a() * .55), r = t * (.08 + a() * .11);
				i.beginPath(), i.moveTo(l[e].x, l[e].y), i.lineTo(l[e].x + Math.cos(n) * r, l[e].y + Math.sin(n) * r), i.strokeStyle = `rgba(6, 10, 18, ${(.24 + a() * .18).toFixed(3)})`, i.lineWidth = .65 + a() * .45, i.stroke();
			}
		}
		for (let e = 0; e < 13; e++) {
			let e = a() * j, n = t * (.82 + a() * .13), r = t + Math.cos(e) * n, o = t + Math.sin(e) * n, s = e + Math.PI * .5, c = 2.2 + a() * 3.2;
			i.save(), i.translate(r, o), i.rotate(s), i.fillStyle = `rgba(3, 6, 12, ${(.13 + a() * .18).toFixed(3)})`, i.beginPath(), i.moveTo(-c * .9, 0), i.lineTo(c * .7, -c * .42), i.lineTo(c * .5, c * .48), i.closePath(), i.fill(), a() > .42 && (i.strokeStyle = `rgba(205, 222, 235, ${(.035 + a() * .04).toFixed(3)})`, i.lineWidth = .55, i.beginPath(), i.moveTo(-c * .65, -c * .08), i.lineTo(c * .55, -c * .32), i.stroke()), i.restore();
		}
		let c = Math.round(t * t * 2.2);
		for (let e = 0; e < c; e++) {
			let e = a() * j, n = Math.sqrt(a()) * t * .97, r = t + Math.cos(e) * n, o = t + Math.sin(e) * n;
			i.fillStyle = a() > .55 ? `rgba(190, 210, 230, ${(.02 + a() * .04).toFixed(2)})` : `rgba(8, 12, 20, ${(.04 + a() * .07).toFixed(2)})`, i.fillRect(r, o, 1, 1);
		}
		let l = i.createRadialGradient(t, t, t * .55, t, t, t);
		return l.addColorStop(0, "rgba(0, 0, 0, 0)"), l.addColorStop(.7, "rgba(0, 0, 0, 0)"), l.addColorStop(1, "rgba(0, 0, 0, 0.3)"), i.fillStyle = l, i.beginPath(), i.arc(t, t, t, 0, j), i.fill(), i.restore(), r;
	}
	function o(e, n, r) {
		let o = r;
		t ||= a(o);
		let s = n.position.x, c = n.position.y, l = n.angle;
		e.save(), e.translate(s, c), e.save(), e.shadowColor = "rgba(4, 8, 16, 0.65)", e.shadowBlur = 14, e.shadowOffsetX = 4, e.shadowOffsetY = 5, e.beginPath(), e.arc(0, 0, o, 0, j), e.fillStyle = "#1e2830", e.fill(), e.restore(), e.save(), e.beginPath(), e.arc(0, 0, o, 0, j), e.clip(), e.rotate(l), e.drawImage(t, -o, -o, o * 2, o * 2), e.rotate(-l);
		let u = e.createRadialGradient(0, 0, o * .15, 0, 0, o);
		u.addColorStop(0, "rgba(0, 0, 0, 0)"), u.addColorStop(.5, "rgba(0, 0, 0, 0)"), u.addColorStop(.8, "rgba(0, 0, 0, 0.25)"), u.addColorStop(1, "rgba(0, 0, 0, 0.6)"), e.fillStyle = u, e.fillRect(-o, -o, o * 2, o * 2);
		let d = e.createLinearGradient(0, -o, 0, o);
		d.addColorStop(0, "rgba(0, 0, 0, 0)"), d.addColorStop(.6, "rgba(0, 0, 0, 0)"), d.addColorStop(1, "rgba(0, 0, 0, 0.35)"), e.fillStyle = d, e.fillRect(-o, -o, o * 2, o * 2);
		let f = -o * .42, p = -o * .48, m = e.createRadialGradient(f, p, 0, f, p, o * 1.15);
		m.addColorStop(0, "rgba(210, 230, 248, 0.28)"), m.addColorStop(.25, "rgba(200, 225, 248, 0.14)"), m.addColorStop(.55, "rgba(200, 225, 248, 0.04)"), m.addColorStop(1, "rgba(200, 225, 248, 0)"), e.fillStyle = m, e.fillRect(-o, -o, o * 2, o * 2);
		let h = -o * .32, g = -o * .36, _ = e.createRadialGradient(h, g, 0, h, g, o * .3);
		_.addColorStop(0, "rgba(240, 248, 255, 0.12)"), _.addColorStop(.5, "rgba(220, 235, 248, 0.04)"), _.addColorStop(1, "rgba(220, 235, 248, 0)"), e.fillStyle = _, e.fillRect(-o, -o, o * 2, o * 2), e.restore(), e.beginPath(), e.arc(0, 0, o - .5, 0, j), e.strokeStyle = "rgba(10, 16, 24, 0.2)", e.lineWidth = 1, e.stroke(), e.save(), e.rotate(l * .65);
		let v = i(o - 1.15);
		e.strokeStyle = "rgba(215, 230, 240, 0.085)", e.lineWidth = .85, e.stroke(v), e.globalCompositeOperation = "multiply", e.strokeStyle = "rgba(4, 8, 14, 0.26)", e.lineWidth = 1.25, e.stroke(v), e.restore(), e.restore();
	}
	return { drawRock: o };
}
//#endregion
//#region src/games/sisyphus/sisyphus-renderer.js
var M = Math.PI * 2, N = Object.freeze({
	fill: "#0f1520",
	shadow: "#080c14",
	skin: "#1a2536"
});
function ne({ GAME_STATE: e, PEAK_A_X: t }) {
	function n(e, t) {
		let { sisyphusBody: n, gameState: i, lastGameState: a, stateTransitionTimer: o, STATE_TRANSITION_MAX: s, isPushing: c, sceneTime: u, balanceState: d = null, windActive: f = !1 } = t, p = l(n.render.opacity, 0, 1);
		if (!(p <= .005)) if (o > 0 && a) {
			let t = l(o / s, 0, 1), m = 1 - t;
			t > .01 && r(e, a, p * t, n, c, u, d, f), m > .01 && r(e, i, p * m, n, c, u, d, f);
		} else r(e, i, p, n, c, u, d, f);
	}
	function r(t, n, r, i, a, o, s, c) {
		if (r <= .005) return;
		t.save(), t.globalAlpha = r, t.translate(i.position.x, i.position.y), t.scale(1 / 2.8, 1 / 2.8), t.lineCap = "round", t.lineJoin = "round";
		let l = i.position.x;
		n === e.PLAYING ? d(t, l, a, o, s, c) : n === e.SUMMIT || n === e.SIS_DESCENDING ? f(t, o) : p(t, o), t.restore();
	}
	function i(e, t, n, r) {
		if (!(t.length < 2)) {
			e.strokeStyle = N.shadow, e.lineWidth = n + 1.2, e.beginPath(), e.moveTo(t[0].x, t[0].y);
			for (let n = 1; n < t.length; n++) e.lineTo(t[n].x, t[n].y);
			e.stroke(), e.strokeStyle = N.fill, e.lineWidth = n, e.beginPath(), e.moveTo(t[0].x, t[0].y);
			for (let n = 1; n < t.length; n++) e.lineTo(t[n].x, t[n].y);
			e.stroke();
		}
	}
	function a(e, t) {
		e.fillStyle = N.fill, e.beginPath(), e.moveTo(t[0].x, t[0].y);
		for (let n = 1; n < t.length; n++) e.lineTo(t[n].x, t[n].y);
		e.closePath(), e.fill(), e.strokeStyle = N.shadow, e.lineWidth = 1, e.stroke();
	}
	function o(e, t, n, r, i) {
		e.save(), e.translate(t, n), e.rotate(i || 0), e.fillStyle = N.shadow, e.beginPath(), e.ellipse(.5, .8, r * .88, r * 1.05, 0, 0, M), e.fill(), e.fillStyle = N.fill, e.beginPath(), e.ellipse(0, 0, r * .8, r * .95, 0, 0, M), e.fill(), e.restore();
	}
	function s(e, t, n, r) {
		e.fillStyle = N.skin, e.beginPath(), e.arc(t, n, r, 0, M), e.fill();
	}
	function c(e, t, n, r) {
		e.save(), e.globalAlpha *= r, e.fillStyle = N.shadow, e.beginPath(), e.ellipse(t + 1.5, n, 4.5, 1.8, .08, 0, M), e.fill(), e.restore();
	}
	function u(e, t, n) {
		e.save(), e.fillStyle = "rgba(0,0,0,0.25)", e.beginPath(), e.ellipse(t, 22.5, n, 2, 0, 0, M), e.fill(), e.restore();
	}
	function d(e, n, r, d, f, p) {
		let m = r ? l(f?.strainScore ?? .22, 0, 1) : 0, h = l(f?.alignmentScore ?? 1, 0, 1), g = l(m + (p ? .18 : 0), 0, 1), _ = r ? 1 + (.004 + g * .01) * Math.sin(d * (.006 + g * .004)) : 1;
		e.scale(_, _), u(e, 0, 8);
		let v = l(Math.sin(n * .364) + Math.sin(n * .588) * .3, -1, 1), y = Math.abs(v), b = r ? .5 + .5 * Math.sin(d * (.011 + g * .006)) : 0, x = -y * (.45 + g * .35), S = v * (.18 + g * .1) - (1 - h) * .35, C = v * .008 - g * .035, w = -1 + v * .35 - g * .35, T = 1.5, E = 8 + x, D = Math.max(0, v), O = Math.max(0, -v), k = w + v * 3, A = 21 - D * T, ee = (w + k) * .5 + 2.5 + O * 1.5, j = (E + A) * .5 - D * 1.5, te = Math.max(0, -v), M = Math.max(0, v), N = w - v * 3, ne = 21 - te * T, P = (w + N) * .5 + 2.5 + M * 1.5, F = (E + ne) * .5 - te * 1.5;
		k < N ? (c(e, k, A + 1, .88), i(e, [
			{
				x: w,
				y: E
			},
			{
				x: ee,
				y: j
			},
			{
				x: k,
				y: A
			}
		], 4, !1), c(e, N, ne + 1, .92), i(e, [
			{
				x: w,
				y: E
			},
			{
				x: P,
				y: F
			},
			{
				x: N,
				y: ne
			}
		], 4, !1)) : (c(e, N, ne + 1, .88), i(e, [
			{
				x: w,
				y: E
			},
			{
				x: P,
				y: F
			},
			{
				x: N,
				y: ne
			}
		], 4, !1), c(e, k, A + 1, .92), i(e, [
			{
				x: w,
				y: E
			},
			{
				x: ee,
				y: j
			},
			{
				x: k,
				y: A
			}
		], 4, !1));
		let I = l(n / t, 0, 1), L = I * .08 + g * .08, R = I * 1.2 + g * 1.6, re = r ? 1 + I * 2 + g * 2.4 + b * g * .6 : 0;
		e.save(), e.translate(S, 0), e.rotate(L + C), a(e, [
			{
				x: 9,
				y: -12 + re + R * .4
			},
			{
				x: 3,
				y: -6 + R * .2
			},
			{
				x: -4 - I * 1.5,
				y: 6
			},
			{
				x: -2,
				y: 12
			},
			{
				x: 5,
				y: 5
			},
			{
				x: 11,
				y: -6.5 + re * .3 + R * .3
			}
		]), i(e, [
			{
				x: 2,
				y: 1 + g * .6
			},
			{
				x: 9 + g * 1.3,
				y: -2 - g * .6
			},
			{
				x: 14 + g * 1.6,
				y: -3.5 - g * .5
			}
		], 3.2, !1), s(e, 14.4 + g * 1.6, -3.7 - g * .5, 2), i(e, [
			{
				x: 6,
				y: -7 + g * .4
			},
			{
				x: 11 + g * 1.1,
				y: -11 - g * .9
			},
			{
				x: 14.5 + g * 1.8,
				y: -13 - g * 1
			}
		], 3.2, !1), s(e, 14.8 + g * 1.8, -13.2 - g * 1, 1.8), o(e, 9 + g * .6, -15 + R * .3 + (r ? .5 : 0) + g * .8, 6, -.28 - I * .06 - g * .08), e.restore();
	}
	function f(e, t) {
		let n = 1 + .008 * Math.sin(t * .0025);
		e.scale(n, n), u(e, 0, 7), c(e, -2.5, 22, .9), c(e, 3, 22, .9), i(e, [
			{
				x: -1,
				y: 6
			},
			{
				x: -2.5,
				y: 15
			},
			{
				x: -3,
				y: 21
			}
		], 4, !1), i(e, [
			{
				x: 1,
				y: 6
			},
			{
				x: 2.5,
				y: 15
			},
			{
				x: 3,
				y: 21
			}
		], 4, !1), a(e, [
			{
				x: -4.6,
				y: -12
			},
			{
				x: 4.7,
				y: -12.4
			},
			{
				x: 5.3,
				y: 6.8
			},
			{
				x: 1.6,
				y: 10.5
			},
			{
				x: -4.2,
				y: 7.4
			}
		]), i(e, [
			{
				x: -3,
				y: -6
			},
			{
				x: -5,
				y: 2
			},
			{
				x: -3.5,
				y: 9
			}
		], 3.2, !1), i(e, [
			{
				x: 3,
				y: -6
			},
			{
				x: 5,
				y: 2
			},
			{
				x: 4,
				y: 9.5
			}
		], 3.2, !1), o(e, -.6, -17.3, 6, .03);
	}
	function p(e, t) {
		let n = 1 + .006 * Math.sin(t * .0018);
		e.scale(n, n), u(e, 1, 7), c(e, -2, 22, .78), c(e, 3.5, 22, .82), i(e, [
			{
				x: -1,
				y: 7
			},
			{
				x: -2.5,
				y: 15.5
			},
			{
				x: -1.5,
				y: 21.6
			}
		], 4, !1), i(e, [
			{
				x: .5,
				y: 7
			},
			{
				x: 2.5,
				y: 16
			},
			{
				x: 3.5,
				y: 21.5
			}
		], 4, !1), a(e, [
			{
				x: -4.4,
				y: -10.8
			},
			{
				x: 4.6,
				y: -10.2
			},
			{
				x: 5,
				y: 6.3
			},
			{
				x: .2,
				y: 10.6
			},
			{
				x: -4.5,
				y: 7.4
			}
		]), i(e, [
			{
				x: 2.2,
				y: -4
			},
			{
				x: 4,
				y: 3
			},
			{
				x: 2.5,
				y: 10
			}
		], 3.2, !1), i(e, [
			{
				x: -1.8,
				y: -4
			},
			{
				x: -3,
				y: 3
			},
			{
				x: -2,
				y: 9.5
			}
		], 3.2, !1), o(e, 3.1, -15.3, 6, .08);
	}
	return { drawSisyphus: n };
}
//#endregion
//#region src/core/visual/visual-layer-profile.js
var P = Object.freeze({
	SKY: "sky",
	DISTANT: "distant",
	MOUNTAIN: "mountain",
	GAMEPLAY: "gameplay",
	FX: "fx",
	GRADE: "grade"
}), F = Object.freeze({
	SOBRIO: "sobrio_tragico",
	EXPRESIONISTA: "expresionista_absurdo"
}), I = Object.freeze({
	WAITING: "waiting",
	ASCENT: "ascent",
	IMPACT: "impact",
	DESCENT: "descent"
}), L = Object.freeze([
	P.SKY,
	P.DISTANT,
	P.MOUNTAIN,
	P.GAMEPLAY,
	P.FX,
	P.GRADE
]), R = [
	"id",
	"style",
	"mood",
	"stack",
	"grade",
	"fog",
	"grain",
	"contactShadow",
	"sceneFx"
];
function re(e) {
	if (!e || typeof e != "object") throw TypeError("VisualLayerProfile must be an object.");
	for (let t of R) if (!(t in e)) throw TypeError(`VisualLayerProfile missing key "${t}".`);
	if (!Array.isArray(e.stack) || e.stack.length === 0) throw TypeError(`VisualLayerProfile "${e.id}" needs a non-empty "stack".`);
	return Object.freeze({
		...e,
		stack: Object.freeze([...e.stack]),
		grade: Object.freeze({ ...e.grade }),
		fog: Object.freeze({ ...e.fog }),
		grain: Object.freeze({ ...e.grain }),
		contactShadow: Object.freeze({ ...e.contactShadow }),
		sceneFx: Object.freeze({ ...e.sceneFx })
	});
}
function ie(e, t) {
	if (!Array.isArray(e) || e.length === 0) throw TypeError("VisualLayerCatalog requires a non-empty profile array.");
	let n = /* @__PURE__ */ new Map();
	for (let t of e) n.set(t.id, t);
	if (!n.has(t)) throw TypeError(`VisualLayerCatalog fallback profile "${t}" is missing.`);
	let r = (e, t) => `${e}::${t}`;
	return Object.freeze({
		fallbackId: t,
		getById(e) {
			return n.get(e) || n.get(t);
		},
		getByStyleAndMood(e, i) {
			return n.get(r(e, i)) || n.get(t);
		}
	});
}
function ae(e, t) {
	return `${e}::${t}`;
}
//#endregion
//#region src/core/visual/runtime-quality-controller.js
var oe = Object.freeze({
	HIGH: "high",
	MEDIUM: "medium",
	LOW: "low"
}), se = Object.freeze([
	oe.HIGH,
	oe.MEDIUM,
	oe.LOW
]), z = Object.freeze({
	[oe.HIGH]: Object.freeze({
		fogAlphaMul: 1,
		grainDensityMul: 1,
		grainAlphaMul: 1,
		overlayOpacityMul: 1
	}),
	[oe.MEDIUM]: Object.freeze({
		fogAlphaMul: .86,
		grainDensityMul: .74,
		grainAlphaMul: .82,
		overlayOpacityMul: .9
	}),
	[oe.LOW]: Object.freeze({
		fogAlphaMul: .68,
		grainDensityMul: .48,
		grainAlphaMul: .64,
		overlayOpacityMul: .8
	})
});
function ce(e) {
	let t = se.indexOf(e);
	return t >= 0 ? t : 0;
}
function le(e = {}) {
	let t = !!e.isMobile, n = {
		tier: e.initialTier || (t ? oe.MEDIUM : oe.HIGH),
		fpsSmoothed: e.initialFps || 60,
		badMs: 0,
		goodMs: 0,
		lastTierChangeAt: performance.now(),
		forcedTier: null
	}, r = {
		smoothLerp: e.smoothLerp ?? .08,
		minHoldMs: e.minHoldMs ?? 800,
		demoteHoldMs: e.demoteHoldMs ?? 520,
		promoteHoldMs: e.promoteHoldMs ?? 1500,
		demoteThreshold: e.demoteThreshold ?? (t ? 44 : 47),
		promoteThreshold: e.promoteThreshold ?? (t ? 54 : 57)
	};
	function i(e) {
		return e - n.lastTierChangeAt >= r.minHoldMs;
	}
	function a() {
		let e = ce(n.tier);
		e < se.length - 1 && (n.tier = se[e + 1], n.lastTierChangeAt = performance.now());
	}
	function o() {
		let e = ce(n.tier);
		e > 0 && (n.tier = se[e - 1], n.lastTierChangeAt = performance.now());
	}
	function s(e, t = !1) {
		z[e] && (n.tier = e, n.badMs = 0, n.goodMs = 0, n.lastTierChangeAt = performance.now(), n.forcedTier = t ? e : null);
	}
	function c() {
		n.forcedTier = null, n.lastTierChangeAt = performance.now();
	}
	function u() {
		let e = se[(ce(n.tier) + 1) % se.length];
		return s(e, !0), e;
	}
	function d(e) {
		let t = Math.max(1, e || 16.6667), s = 1e3 / t;
		if (n.fpsSmoothed += (s - n.fpsSmoothed) * r.smoothLerp, n.forcedTier) return p();
		let c = performance.now(), u = n.fpsSmoothed;
		return u < r.demoteThreshold ? (n.badMs += t, n.goodMs = Math.max(0, n.goodMs - t * .5)) : u > r.promoteThreshold ? (n.goodMs += t, n.badMs = Math.max(0, n.badMs - t * .5)) : (n.badMs = Math.max(0, n.badMs - t * .35), n.goodMs = Math.max(0, n.goodMs - t * .35)), n.badMs >= r.demoteHoldMs && i(c) && (a(), n.badMs = 0, n.goodMs = 0), n.goodMs >= r.promoteHoldMs && i(c) && (o(), n.badMs = 0, n.goodMs = 0), n.fpsSmoothed = l(n.fpsSmoothed, 1, 240), p();
	}
	function f() {
		return z[n.tier];
	}
	function p() {
		return {
			tier: n.tier,
			fpsSmoothed: n.fpsSmoothed,
			forcedTier: n.forcedTier,
			profile: f()
		};
	}
	return Object.freeze({
		update: d,
		getProfile: f,
		getSnapshot: p,
		setTier: s,
		clearForcedTier: c,
		cycleTier: u
	});
}
//#endregion
//#region src/games/sisyphus/game.js
var ue = /* @__PURE__ */ c((/* @__PURE__ */ o(((e, t) => {
	(function(n, r) {
		typeof e == "object" && typeof t == "object" ? t.exports = r() : typeof define == "function" && define.amd ? define("Matter", [], r) : typeof e == "object" ? e.Matter = r() : n.Matter = r();
	})(e, function() {
		return (function(e) {
			var t = {};
			function n(r) {
				if (t[r]) return t[r].exports;
				var i = t[r] = {
					i: r,
					l: !1,
					exports: {}
				};
				return e[r].call(i.exports, i, i.exports, n), i.l = !0, i.exports;
			}
			return n.m = e, n.c = t, n.d = function(e, t, r) {
				n.o(e, t) || Object.defineProperty(e, t, {
					enumerable: !0,
					get: r
				});
			}, n.r = function(e) {
				typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e, "__esModule", { value: !0 });
			}, n.t = function(e, t) {
				if (t & 1 && (e = n(e)), t & 8 || t & 4 && typeof e == "object" && e && e.__esModule) return e;
				var r = Object.create(null);
				if (n.r(r), Object.defineProperty(r, "default", {
					enumerable: !0,
					value: e
				}), t & 2 && typeof e != "string") for (var i in e) n.d(r, i, function(t) {
					return e[t];
				}.bind(null, i));
				return r;
			}, n.n = function(e) {
				var t = e && e.__esModule ? function() {
					return e.default;
				} : function() {
					return e;
				};
				return n.d(t, "a", t), t;
			}, n.o = function(e, t) {
				return Object.prototype.hasOwnProperty.call(e, t);
			}, n.p = "", n(n.s = 20);
		})([
			(function(e, t) {
				var n = {};
				e.exports = n, (function() {
					n._baseDelta = 1e3 / 60, n._nextId = 0, n._seed = 0, n._nowStartTime = +/* @__PURE__ */ new Date(), n._warnedOnce = {}, n._decomp = null, n.extend = function(e, t) {
						var r, i;
						typeof t == "boolean" ? (r = 2, i = t) : (r = 1, i = !0);
						for (var a = r; a < arguments.length; a++) {
							var o = arguments[a];
							if (o) for (var s in o) i && o[s] && o[s].constructor === Object && (!e[s] || e[s].constructor === Object) ? (e[s] = e[s] || {}, n.extend(e[s], i, o[s])) : e[s] = o[s];
						}
						return e;
					}, n.clone = function(e, t) {
						return n.extend({}, t, e);
					}, n.keys = function(e) {
						if (Object.keys) return Object.keys(e);
						var t = [];
						for (var n in e) t.push(n);
						return t;
					}, n.values = function(e) {
						var t = [];
						if (Object.keys) {
							for (var n = Object.keys(e), r = 0; r < n.length; r++) t.push(e[n[r]]);
							return t;
						}
						for (var i in e) t.push(e[i]);
						return t;
					}, n.get = function(e, t, n, r) {
						t = t.split(".").slice(n, r);
						for (var i = 0; i < t.length; i += 1) e = e[t[i]];
						return e;
					}, n.set = function(e, t, r, i, a) {
						var o = t.split(".").slice(i, a);
						return n.get(e, t, 0, -1)[o[o.length - 1]] = r, r;
					}, n.shuffle = function(e) {
						for (var t = e.length - 1; t > 0; t--) {
							var r = Math.floor(n.random() * (t + 1)), i = e[t];
							e[t] = e[r], e[r] = i;
						}
						return e;
					}, n.choose = function(e) {
						return e[Math.floor(n.random() * e.length)];
					}, n.isElement = function(e) {
						return typeof HTMLElement < "u" ? e instanceof HTMLElement : !!(e && e.nodeType && e.nodeName);
					}, n.isArray = function(e) {
						return Object.prototype.toString.call(e) === "[object Array]";
					}, n.isFunction = function(e) {
						return typeof e == "function";
					}, n.isPlainObject = function(e) {
						return typeof e == "object" && e.constructor === Object;
					}, n.isString = function(e) {
						return toString.call(e) === "[object String]";
					}, n.clamp = function(e, t, n) {
						return e < t ? t : e > n ? n : e;
					}, n.sign = function(e) {
						return e < 0 ? -1 : 1;
					}, n.now = function() {
						if (typeof window < "u" && window.performance) {
							if (window.performance.now) return window.performance.now();
							if (window.performance.webkitNow) return window.performance.webkitNow();
						}
						return Date.now ? Date.now() : /* @__PURE__ */ new Date() - n._nowStartTime;
					}, n.random = function(t, n) {
						return t = t === void 0 ? 0 : t, n = n === void 0 ? 1 : n, t + e() * (n - t);
					};
					var e = function() {
						return n._seed = (n._seed * 9301 + 49297) % 233280, n._seed / 233280;
					};
					n.colorToNumber = function(e) {
						return e = e.replace("#", ""), e.length == 3 && (e = e.charAt(0) + e.charAt(0) + e.charAt(1) + e.charAt(1) + e.charAt(2) + e.charAt(2)), parseInt(e, 16);
					}, n.logLevel = 1, n.log = function() {
						console && n.logLevel > 0 && n.logLevel <= 3 && console.log.apply(console, ["matter-js:"].concat(Array.prototype.slice.call(arguments)));
					}, n.info = function() {
						console && n.logLevel > 0 && n.logLevel <= 2 && console.info.apply(console, ["matter-js:"].concat(Array.prototype.slice.call(arguments)));
					}, n.warn = function() {
						console && n.logLevel > 0 && n.logLevel <= 3 && console.warn.apply(console, ["matter-js:"].concat(Array.prototype.slice.call(arguments)));
					}, n.warnOnce = function() {
						var e = Array.prototype.slice.call(arguments).join(" ");
						n._warnedOnce[e] || (n.warn(e), n._warnedOnce[e] = !0);
					}, n.deprecated = function(e, t, r) {
						e[t] = n.chain(function() {
							n.warnOnce("🔅 deprecated 🔅", r);
						}, e[t]);
					}, n.nextId = function() {
						return n._nextId++;
					}, n.indexOf = function(e, t) {
						if (e.indexOf) return e.indexOf(t);
						for (var n = 0; n < e.length; n++) if (e[n] === t) return n;
						return -1;
					}, n.map = function(e, t) {
						if (e.map) return e.map(t);
						for (var n = [], r = 0; r < e.length; r += 1) n.push(t(e[r]));
						return n;
					}, n.topologicalSort = function(e) {
						var t = [], r = [], i = [];
						for (var a in e) !r[a] && !i[a] && n._topologicalSort(a, r, i, e, t);
						return t;
					}, n._topologicalSort = function(e, t, r, i, a) {
						var o = i[e] || [];
						r[e] = !0;
						for (var s = 0; s < o.length; s += 1) {
							var c = o[s];
							r[c] || t[c] || n._topologicalSort(c, t, r, i, a);
						}
						r[e] = !1, t[e] = !0, a.push(e);
					}, n.chain = function() {
						for (var e = [], t = 0; t < arguments.length; t += 1) {
							var n = arguments[t];
							n._chained ? e.push.apply(e, n._chained) : e.push(n);
						}
						var r = function() {
							for (var t, n = Array(arguments.length), r = 0, i = arguments.length; r < i; r++) n[r] = arguments[r];
							for (r = 0; r < e.length; r += 1) {
								var a = e[r].apply(t, n);
								a !== void 0 && (t = a);
							}
							return t;
						};
						return r._chained = e, r;
					}, n.chainPathBefore = function(e, t, r) {
						return n.set(e, t, n.chain(r, n.get(e, t)));
					}, n.chainPathAfter = function(e, t, r) {
						return n.set(e, t, n.chain(n.get(e, t), r));
					}, n.setDecomp = function(e) {
						n._decomp = e;
					}, n.getDecomp = function() {
						var e = n._decomp;
						try {
							!e && typeof window < "u" && (e = window.decomp), !e && typeof global < "u" && (e = global.decomp);
						} catch {
							e = null;
						}
						return e;
					};
				})();
			}),
			(function(e, t) {
				var n = {};
				e.exports = n, (function() {
					n.create = function(e) {
						var t = {
							min: {
								x: 0,
								y: 0
							},
							max: {
								x: 0,
								y: 0
							}
						};
						return e && n.update(t, e), t;
					}, n.update = function(e, t, n) {
						e.min.x = Infinity, e.max.x = -Infinity, e.min.y = Infinity, e.max.y = -Infinity;
						for (var r = 0; r < t.length; r++) {
							var i = t[r];
							i.x > e.max.x && (e.max.x = i.x), i.x < e.min.x && (e.min.x = i.x), i.y > e.max.y && (e.max.y = i.y), i.y < e.min.y && (e.min.y = i.y);
						}
						n && (n.x > 0 ? e.max.x += n.x : e.min.x += n.x, n.y > 0 ? e.max.y += n.y : e.min.y += n.y);
					}, n.contains = function(e, t) {
						return t.x >= e.min.x && t.x <= e.max.x && t.y >= e.min.y && t.y <= e.max.y;
					}, n.overlaps = function(e, t) {
						return e.min.x <= t.max.x && e.max.x >= t.min.x && e.max.y >= t.min.y && e.min.y <= t.max.y;
					}, n.translate = function(e, t) {
						e.min.x += t.x, e.max.x += t.x, e.min.y += t.y, e.max.y += t.y;
					}, n.shift = function(e, t) {
						var n = e.max.x - e.min.x, r = e.max.y - e.min.y;
						e.min.x = t.x, e.max.x = t.x + n, e.min.y = t.y, e.max.y = t.y + r;
					};
				})();
			}),
			(function(e, t) {
				var n = {};
				e.exports = n, (function() {
					n.create = function(e, t) {
						return {
							x: e || 0,
							y: t || 0
						};
					}, n.clone = function(e) {
						return {
							x: e.x,
							y: e.y
						};
					}, n.magnitude = function(e) {
						return Math.sqrt(e.x * e.x + e.y * e.y);
					}, n.magnitudeSquared = function(e) {
						return e.x * e.x + e.y * e.y;
					}, n.rotate = function(e, t, n) {
						var r = Math.cos(t), i = Math.sin(t);
						n ||= {};
						var a = e.x * r - e.y * i;
						return n.y = e.x * i + e.y * r, n.x = a, n;
					}, n.rotateAbout = function(e, t, n, r) {
						var i = Math.cos(t), a = Math.sin(t);
						r ||= {};
						var o = n.x + ((e.x - n.x) * i - (e.y - n.y) * a);
						return r.y = n.y + ((e.x - n.x) * a + (e.y - n.y) * i), r.x = o, r;
					}, n.normalise = function(e) {
						var t = n.magnitude(e);
						return t === 0 ? {
							x: 0,
							y: 0
						} : {
							x: e.x / t,
							y: e.y / t
						};
					}, n.dot = function(e, t) {
						return e.x * t.x + e.y * t.y;
					}, n.cross = function(e, t) {
						return e.x * t.y - e.y * t.x;
					}, n.cross3 = function(e, t, n) {
						return (t.x - e.x) * (n.y - e.y) - (t.y - e.y) * (n.x - e.x);
					}, n.add = function(e, t, n) {
						return n ||= {}, n.x = e.x + t.x, n.y = e.y + t.y, n;
					}, n.sub = function(e, t, n) {
						return n ||= {}, n.x = e.x - t.x, n.y = e.y - t.y, n;
					}, n.mult = function(e, t) {
						return {
							x: e.x * t,
							y: e.y * t
						};
					}, n.div = function(e, t) {
						return {
							x: e.x / t,
							y: e.y / t
						};
					}, n.perp = function(e, t) {
						return t = t === !0 ? -1 : 1, {
							x: t * -e.y,
							y: t * e.x
						};
					}, n.neg = function(e) {
						return {
							x: -e.x,
							y: -e.y
						};
					}, n.angle = function(e, t) {
						return Math.atan2(t.y - e.y, t.x - e.x);
					}, n._temp = [
						n.create(),
						n.create(),
						n.create(),
						n.create(),
						n.create(),
						n.create()
					];
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(2), a = n(0);
				(function() {
					r.create = function(e, t) {
						for (var n = [], r = 0; r < e.length; r++) {
							var i = e[r], a = {
								x: i.x,
								y: i.y,
								index: r,
								body: t,
								isInternal: !1
							};
							n.push(a);
						}
						return n;
					}, r.fromPath = function(e, t) {
						var n = /L?\s*([-\d.e]+)[\s,]*([-\d.e]+)*/gi, i = [];
						return e.replace(n, function(e, t, n) {
							i.push({
								x: parseFloat(t),
								y: parseFloat(n)
							});
						}), r.create(i, t);
					}, r.centre = function(e) {
						for (var t = r.area(e, !0), n = {
							x: 0,
							y: 0
						}, a, o, s, c = 0; c < e.length; c++) s = (c + 1) % e.length, a = i.cross(e[c], e[s]), o = i.mult(i.add(e[c], e[s]), a), n = i.add(n, o);
						return i.div(n, 6 * t);
					}, r.mean = function(e) {
						for (var t = {
							x: 0,
							y: 0
						}, n = 0; n < e.length; n++) t.x += e[n].x, t.y += e[n].y;
						return i.div(t, e.length);
					}, r.area = function(e, t) {
						for (var n = 0, r = e.length - 1, i = 0; i < e.length; i++) n += (e[r].x - e[i].x) * (e[r].y + e[i].y), r = i;
						return t ? n / 2 : Math.abs(n) / 2;
					}, r.inertia = function(e, t) {
						for (var n = 0, r = 0, a = e, o, s, c = 0; c < a.length; c++) s = (c + 1) % a.length, o = Math.abs(i.cross(a[s], a[c])), n += o * (i.dot(a[s], a[s]) + i.dot(a[s], a[c]) + i.dot(a[c], a[c])), r += o;
						return t / 6 * (n / r);
					}, r.translate = function(e, t, n) {
						n = n === void 0 ? 1 : n;
						var r = e.length, i = t.x * n, a = t.y * n, o;
						for (o = 0; o < r; o++) e[o].x += i, e[o].y += a;
						return e;
					}, r.rotate = function(e, t, n) {
						if (t !== 0) {
							var r = Math.cos(t), i = Math.sin(t), a = n.x, o = n.y, s = e.length, c, l, u, d;
							for (d = 0; d < s; d++) c = e[d], l = c.x - a, u = c.y - o, c.x = a + (l * r - u * i), c.y = o + (l * i + u * r);
							return e;
						}
					}, r.contains = function(e, t) {
						for (var n = t.x, r = t.y, i = e.length, a = e[i - 1], o, s = 0; s < i; s++) {
							if (o = e[s], (n - a.x) * (o.y - a.y) + (r - a.y) * (a.x - o.x) > 0) return !1;
							a = o;
						}
						return !0;
					}, r.scale = function(e, t, n, a) {
						if (t === 1 && n === 1) return e;
						a ||= r.centre(e);
						for (var o, s, c = 0; c < e.length; c++) o = e[c], s = i.sub(o, a), e[c].x = a.x + s.x * t, e[c].y = a.y + s.y * n;
						return e;
					}, r.chamfer = function(e, t, n, r, o) {
						typeof t == "number" ? t = [t] : t ||= [8], n = n === void 0 ? -1 : n, r ||= 2, o ||= 14;
						for (var s = [], c = 0; c < e.length; c++) {
							var l = e[c - 1 >= 0 ? c - 1 : e.length - 1], u = e[c], d = e[(c + 1) % e.length], f = t[c < t.length ? c : t.length - 1];
							if (f === 0) {
								s.push(u);
								continue;
							}
							var p = i.normalise({
								x: u.y - l.y,
								y: l.x - u.x
							}), m = i.normalise({
								x: d.y - u.y,
								y: u.x - d.x
							}), h = Math.sqrt(2 * f ** 2), g = i.mult(a.clone(p), f), _ = i.normalise(i.mult(i.add(p, m), .5)), v = i.sub(u, i.mult(_, h)), y = n;
							n === -1 && (y = f ** .32 * 1.75), y = a.clamp(y, r, o), y % 2 == 1 && (y += 1);
							for (var b = Math.acos(i.dot(p, m)) / y, x = 0; x < y; x++) s.push(i.add(i.rotate(g, b * x), v));
						}
						return s;
					}, r.clockwiseSort = function(e) {
						var t = r.mean(e);
						return e.sort(function(e, n) {
							return i.angle(t, e) - i.angle(t, n);
						}), e;
					}, r.isConvex = function(e) {
						var t = 0, n = e.length, r, i, a, o;
						if (n < 3) return null;
						for (r = 0; r < n; r++) if (i = (r + 1) % n, a = (r + 2) % n, o = (e[i].x - e[r].x) * (e[a].y - e[i].y), o -= (e[i].y - e[r].y) * (e[a].x - e[i].x), o < 0 ? t |= 1 : o > 0 && (t |= 2), t === 3) return !1;
						return t === 0 ? null : !0;
					}, r.hull = function(e) {
						var t = [], n = [], r, a;
						for (e = e.slice(0), e.sort(function(e, t) {
							var n = e.x - t.x;
							return n === 0 ? e.y - t.y : n;
						}), a = 0; a < e.length; a += 1) {
							for (r = e[a]; n.length >= 2 && i.cross3(n[n.length - 2], n[n.length - 1], r) <= 0;) n.pop();
							n.push(r);
						}
						for (a = e.length - 1; a >= 0; --a) {
							for (r = e[a]; t.length >= 2 && i.cross3(t[t.length - 2], t[t.length - 1], r) <= 0;) t.pop();
							t.push(r);
						}
						return t.pop(), n.pop(), t.concat(n);
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(3), a = n(2), o = n(7), s = n(0), c = n(1), l = n(11);
				(function() {
					r._timeCorrection = !0, r._inertiaScale = 4, r._nextCollidingGroupId = 1, r._nextNonCollidingGroupId = -1, r._nextCategory = 1, r._baseDelta = 1e3 / 60, r.create = function(t) {
						var n = {
							id: s.nextId(),
							type: "body",
							label: "Body",
							parts: [],
							plugin: {},
							angle: 0,
							vertices: i.fromPath("L 0 0 L 40 0 L 40 40 L 0 40"),
							position: {
								x: 0,
								y: 0
							},
							force: {
								x: 0,
								y: 0
							},
							torque: 0,
							positionImpulse: {
								x: 0,
								y: 0
							},
							constraintImpulse: {
								x: 0,
								y: 0,
								angle: 0
							},
							totalContacts: 0,
							speed: 0,
							angularSpeed: 0,
							velocity: {
								x: 0,
								y: 0
							},
							angularVelocity: 0,
							isSensor: !1,
							isStatic: !1,
							isSleeping: !1,
							motion: 0,
							sleepThreshold: 60,
							density: .001,
							restitution: 0,
							friction: .1,
							frictionStatic: .5,
							frictionAir: .01,
							collisionFilter: {
								category: 1,
								mask: 4294967295,
								group: 0
							},
							slop: .05,
							timeScale: 1,
							render: {
								visible: !0,
								opacity: 1,
								strokeStyle: null,
								fillStyle: null,
								lineWidth: null,
								sprite: {
									xScale: 1,
									yScale: 1,
									xOffset: 0,
									yOffset: 0
								}
							},
							events: null,
							bounds: null,
							chamfer: null,
							circleRadius: 0,
							positionPrev: null,
							anglePrev: 0,
							parent: null,
							axes: null,
							area: 0,
							mass: 0,
							inertia: 0,
							deltaTime: 1e3 / 60,
							_original: null
						}, r = s.extend(n, t);
						return e(r, t), r;
					}, r.nextGroup = function(e) {
						return e ? r._nextNonCollidingGroupId-- : r._nextCollidingGroupId++;
					}, r.nextCategory = function() {
						return r._nextCategory <<= 1, r._nextCategory;
					};
					var e = function(e, t) {
						t ||= {}, r.set(e, {
							bounds: e.bounds || c.create(e.vertices),
							positionPrev: e.positionPrev || a.clone(e.position),
							anglePrev: e.anglePrev || e.angle,
							vertices: e.vertices,
							parts: e.parts || [e],
							isStatic: e.isStatic,
							isSleeping: e.isSleeping,
							parent: e.parent || e
						}), i.rotate(e.vertices, e.angle, e.position), l.rotate(e.axes, e.angle), c.update(e.bounds, e.vertices, e.velocity), r.set(e, {
							axes: t.axes || e.axes,
							area: t.area || e.area,
							mass: t.mass || e.mass,
							inertia: t.inertia || e.inertia
						});
						var n = e.isStatic ? "#14151f" : s.choose([
							"#f19648",
							"#f5d259",
							"#f55a3c",
							"#063e7b",
							"#ececd1"
						]), o = e.isStatic ? "#555" : "#ccc", u = e.isStatic && e.render.fillStyle === null ? 1 : 0;
						e.render.fillStyle = e.render.fillStyle || n, e.render.strokeStyle = e.render.strokeStyle || o, e.render.lineWidth = e.render.lineWidth || u, e.render.sprite.xOffset += -(e.bounds.min.x - e.position.x) / (e.bounds.max.x - e.bounds.min.x), e.render.sprite.yOffset += -(e.bounds.min.y - e.position.y) / (e.bounds.max.y - e.bounds.min.y);
					};
					r.set = function(e, t, n) {
						for (var i in typeof t == "string" && (i = t, t = {}, t[i] = n), t) if (Object.prototype.hasOwnProperty.call(t, i)) switch (n = t[i], i) {
							case "isStatic":
								r.setStatic(e, n);
								break;
							case "isSleeping":
								o.set(e, n);
								break;
							case "mass":
								r.setMass(e, n);
								break;
							case "density":
								r.setDensity(e, n);
								break;
							case "inertia":
								r.setInertia(e, n);
								break;
							case "vertices":
								r.setVertices(e, n);
								break;
							case "position":
								r.setPosition(e, n);
								break;
							case "angle":
								r.setAngle(e, n);
								break;
							case "velocity":
								r.setVelocity(e, n);
								break;
							case "angularVelocity":
								r.setAngularVelocity(e, n);
								break;
							case "speed":
								r.setSpeed(e, n);
								break;
							case "angularSpeed":
								r.setAngularSpeed(e, n);
								break;
							case "parts":
								r.setParts(e, n);
								break;
							case "centre":
								r.setCentre(e, n);
								break;
							default: e[i] = n;
						}
					}, r.setStatic = function(e, t) {
						for (var n = 0; n < e.parts.length; n++) {
							var r = e.parts[n];
							t ? (r.isStatic || (r._original = {
								restitution: r.restitution,
								friction: r.friction,
								mass: r.mass,
								inertia: r.inertia,
								density: r.density,
								inverseMass: r.inverseMass,
								inverseInertia: r.inverseInertia
							}), r.restitution = 0, r.friction = 1, r.mass = r.inertia = r.density = Infinity, r.inverseMass = r.inverseInertia = 0, r.positionPrev.x = r.position.x, r.positionPrev.y = r.position.y, r.anglePrev = r.angle, r.angularVelocity = 0, r.speed = 0, r.angularSpeed = 0, r.motion = 0) : r._original &&= (r.restitution = r._original.restitution, r.friction = r._original.friction, r.mass = r._original.mass, r.inertia = r._original.inertia, r.density = r._original.density, r.inverseMass = r._original.inverseMass, r.inverseInertia = r._original.inverseInertia, null), r.isStatic = t;
						}
					}, r.setMass = function(e, t) {
						e.inertia = e.inertia / (e.mass / 6) * (t / 6), e.inverseInertia = 1 / e.inertia, e.mass = t, e.inverseMass = 1 / e.mass, e.density = e.mass / e.area;
					}, r.setDensity = function(e, t) {
						r.setMass(e, t * e.area), e.density = t;
					}, r.setInertia = function(e, t) {
						e.inertia = t, e.inverseInertia = 1 / e.inertia;
					}, r.setVertices = function(e, t) {
						t[0].body === e ? e.vertices = t : e.vertices = i.create(t, e), e.axes = l.fromVertices(e.vertices), e.area = i.area(e.vertices), r.setMass(e, e.density * e.area);
						var n = i.centre(e.vertices);
						i.translate(e.vertices, n, -1), r.setInertia(e, r._inertiaScale * i.inertia(e.vertices, e.mass)), i.translate(e.vertices, e.position), c.update(e.bounds, e.vertices, e.velocity);
					}, r.setParts = function(e, t, n) {
						var a;
						for (t = t.slice(0), e.parts.length = 0, e.parts.push(e), e.parent = e, a = 0; a < t.length; a++) {
							var o = t[a];
							o !== e && (o.parent = e, e.parts.push(o));
						}
						if (e.parts.length !== 1) {
							if (n = n === void 0 ? !0 : n, n) {
								var s = [];
								for (a = 0; a < t.length; a++) s = s.concat(t[a].vertices);
								i.clockwiseSort(s);
								var c = i.hull(s), l = i.centre(c);
								r.setVertices(e, c), i.translate(e.vertices, l);
							}
							var u = r._totalProperties(e);
							e.area = u.area, e.parent = e, e.position.x = u.centre.x, e.position.y = u.centre.y, e.positionPrev.x = u.centre.x, e.positionPrev.y = u.centre.y, r.setMass(e, u.mass), r.setInertia(e, u.inertia), r.setPosition(e, u.centre);
						}
					}, r.setCentre = function(e, t, n) {
						n ? (e.positionPrev.x += t.x, e.positionPrev.y += t.y, e.position.x += t.x, e.position.y += t.y) : (e.positionPrev.x = t.x - (e.position.x - e.positionPrev.x), e.positionPrev.y = t.y - (e.position.y - e.positionPrev.y), e.position.x = t.x, e.position.y = t.y);
					}, r.setPosition = function(e, t, n) {
						var r = a.sub(t, e.position);
						n ? (e.positionPrev.x = e.position.x, e.positionPrev.y = e.position.y, e.velocity.x = r.x, e.velocity.y = r.y, e.speed = a.magnitude(r)) : (e.positionPrev.x += r.x, e.positionPrev.y += r.y);
						for (var o = 0; o < e.parts.length; o++) {
							var s = e.parts[o];
							s.position.x += r.x, s.position.y += r.y, i.translate(s.vertices, r), c.update(s.bounds, s.vertices, e.velocity);
						}
					}, r.setAngle = function(e, t, n) {
						var r = t - e.angle;
						n ? (e.anglePrev = e.angle, e.angularVelocity = r, e.angularSpeed = Math.abs(r)) : e.anglePrev += r;
						for (var o = 0; o < e.parts.length; o++) {
							var s = e.parts[o];
							s.angle += r, i.rotate(s.vertices, r, e.position), l.rotate(s.axes, r), c.update(s.bounds, s.vertices, e.velocity), o > 0 && a.rotateAbout(s.position, r, e.position, s.position);
						}
					}, r.setVelocity = function(e, t) {
						var n = e.deltaTime / r._baseDelta;
						e.positionPrev.x = e.position.x - t.x * n, e.positionPrev.y = e.position.y - t.y * n, e.velocity.x = (e.position.x - e.positionPrev.x) / n, e.velocity.y = (e.position.y - e.positionPrev.y) / n, e.speed = a.magnitude(e.velocity);
					}, r.getVelocity = function(e) {
						var t = r._baseDelta / e.deltaTime;
						return {
							x: (e.position.x - e.positionPrev.x) * t,
							y: (e.position.y - e.positionPrev.y) * t
						};
					}, r.getSpeed = function(e) {
						return a.magnitude(r.getVelocity(e));
					}, r.setSpeed = function(e, t) {
						r.setVelocity(e, a.mult(a.normalise(r.getVelocity(e)), t));
					}, r.setAngularVelocity = function(e, t) {
						var n = e.deltaTime / r._baseDelta;
						e.anglePrev = e.angle - t * n, e.angularVelocity = (e.angle - e.anglePrev) / n, e.angularSpeed = Math.abs(e.angularVelocity);
					}, r.getAngularVelocity = function(e) {
						return (e.angle - e.anglePrev) * r._baseDelta / e.deltaTime;
					}, r.getAngularSpeed = function(e) {
						return Math.abs(r.getAngularVelocity(e));
					}, r.setAngularSpeed = function(e, t) {
						r.setAngularVelocity(e, s.sign(r.getAngularVelocity(e)) * t);
					}, r.translate = function(e, t, n) {
						r.setPosition(e, a.add(e.position, t), n);
					}, r.rotate = function(e, t, n, i) {
						if (!n) r.setAngle(e, e.angle + t, i);
						else {
							var a = Math.cos(t), o = Math.sin(t), s = e.position.x - n.x, c = e.position.y - n.y;
							r.setPosition(e, {
								x: n.x + (s * a - c * o),
								y: n.y + (s * o + c * a)
							}, i), r.setAngle(e, e.angle + t, i);
						}
					}, r.scale = function(e, t, n, a) {
						var o = 0, s = 0;
						a ||= e.position;
						for (var u = 0; u < e.parts.length; u++) {
							var d = e.parts[u];
							i.scale(d.vertices, t, n, a), d.axes = l.fromVertices(d.vertices), d.area = i.area(d.vertices), r.setMass(d, e.density * d.area), i.translate(d.vertices, {
								x: -d.position.x,
								y: -d.position.y
							}), r.setInertia(d, r._inertiaScale * i.inertia(d.vertices, d.mass)), i.translate(d.vertices, {
								x: d.position.x,
								y: d.position.y
							}), u > 0 && (o += d.area, s += d.inertia), d.position.x = a.x + (d.position.x - a.x) * t, d.position.y = a.y + (d.position.y - a.y) * n, c.update(d.bounds, d.vertices, e.velocity);
						}
						e.parts.length > 1 && (e.area = o, e.isStatic || (r.setMass(e, e.density * o), r.setInertia(e, s))), e.circleRadius && (t === n ? e.circleRadius *= t : e.circleRadius = null);
					}, r.update = function(e, t) {
						t = (t === void 0 ? 1e3 / 60 : t) * e.timeScale;
						var n = t * t, o = r._timeCorrection ? t / (e.deltaTime || t) : 1, u = 1 - e.frictionAir * (t / s._baseDelta), d = (e.position.x - e.positionPrev.x) * o, f = (e.position.y - e.positionPrev.y) * o;
						e.velocity.x = d * u + e.force.x / e.mass * n, e.velocity.y = f * u + e.force.y / e.mass * n, e.positionPrev.x = e.position.x, e.positionPrev.y = e.position.y, e.position.x += e.velocity.x, e.position.y += e.velocity.y, e.deltaTime = t, e.angularVelocity = (e.angle - e.anglePrev) * u * o + e.torque / e.inertia * n, e.anglePrev = e.angle, e.angle += e.angularVelocity;
						for (var p = 0; p < e.parts.length; p++) {
							var m = e.parts[p];
							i.translate(m.vertices, e.velocity), p > 0 && (m.position.x += e.velocity.x, m.position.y += e.velocity.y), e.angularVelocity !== 0 && (i.rotate(m.vertices, e.angularVelocity, e.position), l.rotate(m.axes, e.angularVelocity), p > 0 && a.rotateAbout(m.position, e.angularVelocity, e.position, m.position)), c.update(m.bounds, m.vertices, e.velocity);
						}
					}, r.updateVelocities = function(e) {
						var t = r._baseDelta / e.deltaTime, n = e.velocity;
						n.x = (e.position.x - e.positionPrev.x) * t, n.y = (e.position.y - e.positionPrev.y) * t, e.speed = Math.sqrt(n.x * n.x + n.y * n.y), e.angularVelocity = (e.angle - e.anglePrev) * t, e.angularSpeed = Math.abs(e.angularVelocity);
					}, r.applyForce = function(e, t, n) {
						var r = {
							x: t.x - e.position.x,
							y: t.y - e.position.y
						};
						e.force.x += n.x, e.force.y += n.y, e.torque += r.x * n.y - r.y * n.x;
					}, r._totalProperties = function(e) {
						for (var t = {
							mass: 0,
							area: 0,
							inertia: 0,
							centre: {
								x: 0,
								y: 0
							}
						}, n = e.parts.length === 1 ? 0 : 1; n < e.parts.length; n++) {
							var r = e.parts[n], i = r.mass === Infinity ? 1 : r.mass;
							t.mass += i, t.area += r.area, t.inertia += r.inertia, t.centre = a.add(t.centre, a.mult(r.position, i));
						}
						return t.centre = a.div(t.centre, t.mass), t;
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(0);
				(function() {
					r.on = function(e, t, n) {
						for (var r = t.split(" "), i, a = 0; a < r.length; a++) i = r[a], e.events = e.events || {}, e.events[i] = e.events[i] || [], e.events[i].push(n);
						return n;
					}, r.off = function(e, t, n) {
						if (!t) {
							e.events = {};
							return;
						}
						typeof t == "function" && (n = t, t = i.keys(e.events).join(" "));
						for (var r = t.split(" "), a = 0; a < r.length; a++) {
							var o = e.events[r[a]], s = [];
							if (n && o) for (var c = 0; c < o.length; c++) o[c] !== n && s.push(o[c]);
							e.events[r[a]] = s;
						}
					}, r.trigger = function(e, t, n) {
						var r, a, o, s, c = e.events;
						if (c && i.keys(c).length > 0) {
							n ||= {}, r = t.split(" ");
							for (var l = 0; l < r.length; l++) if (a = r[l], o = c[a], o) {
								s = i.clone(n, !1), s.name = a, s.source = e;
								for (var u = 0; u < o.length; u++) o[u].apply(e, [s]);
							}
						}
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(5), a = n(0), o = n(1), s = n(4);
				(function() {
					r.create = function(e) {
						return a.extend({
							id: a.nextId(),
							type: "composite",
							parent: null,
							isModified: !1,
							bodies: [],
							constraints: [],
							composites: [],
							label: "Composite",
							plugin: {},
							cache: {
								allBodies: null,
								allConstraints: null,
								allComposites: null
							}
						}, e);
					}, r.setModified = function(e, t, n, i) {
						if (e.isModified = t, t && e.cache && (e.cache.allBodies = null, e.cache.allConstraints = null, e.cache.allComposites = null), n && e.parent && r.setModified(e.parent, t, n, i), i) for (var a = 0; a < e.composites.length; a++) {
							var o = e.composites[a];
							r.setModified(o, t, n, i);
						}
					}, r.add = function(e, t) {
						var n = [].concat(t);
						i.trigger(e, "beforeAdd", { object: t });
						for (var o = 0; o < n.length; o++) {
							var s = n[o];
							switch (s.type) {
								case "body":
									if (s.parent !== s) {
										a.warn("Composite.add: skipped adding a compound body part (you must add its parent instead)");
										break;
									}
									r.addBody(e, s);
									break;
								case "constraint":
									r.addConstraint(e, s);
									break;
								case "composite":
									r.addComposite(e, s);
									break;
								case "mouseConstraint":
									r.addConstraint(e, s.constraint);
									break;
							}
						}
						return i.trigger(e, "afterAdd", { object: t }), e;
					}, r.remove = function(e, t, n) {
						var a = [].concat(t);
						i.trigger(e, "beforeRemove", { object: t });
						for (var o = 0; o < a.length; o++) {
							var s = a[o];
							switch (s.type) {
								case "body":
									r.removeBody(e, s, n);
									break;
								case "constraint":
									r.removeConstraint(e, s, n);
									break;
								case "composite":
									r.removeComposite(e, s, n);
									break;
								case "mouseConstraint":
									r.removeConstraint(e, s.constraint);
									break;
							}
						}
						return i.trigger(e, "afterRemove", { object: t }), e;
					}, r.addComposite = function(e, t) {
						return e.composites.push(t), t.parent = e, r.setModified(e, !0, !0, !1), e;
					}, r.removeComposite = function(e, t, n) {
						var i = a.indexOf(e.composites, t);
						if (i !== -1) {
							var o = r.allBodies(t);
							r.removeCompositeAt(e, i);
							for (var s = 0; s < o.length; s++) o[s].sleepCounter = 0;
						}
						if (n) for (var s = 0; s < e.composites.length; s++) r.removeComposite(e.composites[s], t, !0);
						return e;
					}, r.removeCompositeAt = function(e, t) {
						return e.composites.splice(t, 1), r.setModified(e, !0, !0, !1), e;
					}, r.addBody = function(e, t) {
						return e.bodies.push(t), r.setModified(e, !0, !0, !1), e;
					}, r.removeBody = function(e, t, n) {
						var i = a.indexOf(e.bodies, t);
						if (i !== -1 && (r.removeBodyAt(e, i), t.sleepCounter = 0), n) for (var o = 0; o < e.composites.length; o++) r.removeBody(e.composites[o], t, !0);
						return e;
					}, r.removeBodyAt = function(e, t) {
						return e.bodies.splice(t, 1), r.setModified(e, !0, !0, !1), e;
					}, r.addConstraint = function(e, t) {
						return e.constraints.push(t), r.setModified(e, !0, !0, !1), e;
					}, r.removeConstraint = function(e, t, n) {
						var i = a.indexOf(e.constraints, t);
						if (i !== -1 && r.removeConstraintAt(e, i), n) for (var o = 0; o < e.composites.length; o++) r.removeConstraint(e.composites[o], t, !0);
						return e;
					}, r.removeConstraintAt = function(e, t) {
						return e.constraints.splice(t, 1), r.setModified(e, !0, !0, !1), e;
					}, r.clear = function(e, t, n) {
						if (n) for (var i = 0; i < e.composites.length; i++) r.clear(e.composites[i], t, !0);
						return t ? e.bodies = e.bodies.filter(function(e) {
							return e.isStatic;
						}) : e.bodies.length = 0, e.constraints.length = 0, e.composites.length = 0, r.setModified(e, !0, !0, !1), e;
					}, r.allBodies = function(e) {
						if (e.cache && e.cache.allBodies) return e.cache.allBodies;
						for (var t = [].concat(e.bodies), n = 0; n < e.composites.length; n++) t = t.concat(r.allBodies(e.composites[n]));
						return e.cache && (e.cache.allBodies = t), t;
					}, r.allConstraints = function(e) {
						if (e.cache && e.cache.allConstraints) return e.cache.allConstraints;
						for (var t = [].concat(e.constraints), n = 0; n < e.composites.length; n++) t = t.concat(r.allConstraints(e.composites[n]));
						return e.cache && (e.cache.allConstraints = t), t;
					}, r.allComposites = function(e) {
						if (e.cache && e.cache.allComposites) return e.cache.allComposites;
						for (var t = [].concat(e.composites), n = 0; n < e.composites.length; n++) t = t.concat(r.allComposites(e.composites[n]));
						return e.cache && (e.cache.allComposites = t), t;
					}, r.get = function(e, t, n) {
						var i, a;
						switch (n) {
							case "body":
								i = r.allBodies(e);
								break;
							case "constraint":
								i = r.allConstraints(e);
								break;
							case "composite":
								i = r.allComposites(e).concat(e);
								break;
						}
						return i ? (a = i.filter(function(e) {
							return e.id.toString() === t.toString();
						}), a.length === 0 ? null : a[0]) : null;
					}, r.move = function(e, t, n) {
						return r.remove(e, t), r.add(n, t), e;
					}, r.rebase = function(e) {
						for (var t = r.allBodies(e).concat(r.allConstraints(e)).concat(r.allComposites(e)), n = 0; n < t.length; n++) t[n].id = a.nextId();
						return e;
					}, r.translate = function(e, t, n) {
						for (var i = n ? r.allBodies(e) : e.bodies, a = 0; a < i.length; a++) s.translate(i[a], t);
						return e;
					}, r.rotate = function(e, t, n, i) {
						for (var a = Math.cos(t), o = Math.sin(t), c = i ? r.allBodies(e) : e.bodies, l = 0; l < c.length; l++) {
							var u = c[l], d = u.position.x - n.x, f = u.position.y - n.y;
							s.setPosition(u, {
								x: n.x + (d * a - f * o),
								y: n.y + (d * o + f * a)
							}), s.rotate(u, t);
						}
						return e;
					}, r.scale = function(e, t, n, i, a) {
						for (var o = a ? r.allBodies(e) : e.bodies, c = 0; c < o.length; c++) {
							var l = o[c], u = l.position.x - i.x, d = l.position.y - i.y;
							s.setPosition(l, {
								x: i.x + u * t,
								y: i.y + d * n
							}), s.scale(l, t, n);
						}
						return e;
					}, r.bounds = function(e) {
						for (var t = r.allBodies(e), n = [], i = 0; i < t.length; i += 1) {
							var a = t[i];
							n.push(a.bounds.min, a.bounds.max);
						}
						return o.create(n);
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(4), a = n(5), o = n(0);
				(function() {
					r._motionWakeThreshold = .18, r._motionSleepThreshold = .08, r._minBias = .9, r.update = function(e, t) {
						for (var n = t / o._baseDelta, a = r._motionSleepThreshold, s = 0; s < e.length; s++) {
							var c = e[s], l = i.getSpeed(c), u = i.getAngularSpeed(c), d = l * l + u * u;
							if (c.force.x !== 0 || c.force.y !== 0) {
								r.set(c, !1);
								continue;
							}
							var f = Math.min(c.motion, d), p = Math.max(c.motion, d);
							c.motion = r._minBias * f + (1 - r._minBias) * p, c.sleepThreshold > 0 && c.motion < a ? (c.sleepCounter += 1, c.sleepCounter >= c.sleepThreshold / n && r.set(c, !0)) : c.sleepCounter > 0 && --c.sleepCounter;
						}
					}, r.afterCollisions = function(e) {
						for (var t = r._motionSleepThreshold, n = 0; n < e.length; n++) {
							var i = e[n];
							if (i.isActive) {
								var a = i.collision, o = a.bodyA.parent, s = a.bodyB.parent;
								if (!(o.isSleeping && s.isSleeping || o.isStatic || s.isStatic) && (o.isSleeping || s.isSleeping)) {
									var c = o.isSleeping && !o.isStatic ? o : s, l = c === o ? s : o;
									!c.isStatic && l.motion > t && r.set(c, !1);
								}
							}
						}
					}, r.set = function(e, t) {
						var n = e.isSleeping;
						t ? (e.isSleeping = !0, e.sleepCounter = e.sleepThreshold, e.positionImpulse.x = 0, e.positionImpulse.y = 0, e.positionPrev.x = e.position.x, e.positionPrev.y = e.position.y, e.anglePrev = e.angle, e.speed = 0, e.angularSpeed = 0, e.motion = 0, n || a.trigger(e, "sleepStart")) : (e.isSleeping = !1, e.sleepCounter = 0, n && a.trigger(e, "sleepEnd"));
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(3), a = n(9);
				(function() {
					var e = [], t = {
						overlap: 0,
						axis: null
					}, n = {
						overlap: 0,
						axis: null
					};
					r.create = function(e, t) {
						return {
							pair: null,
							collided: !1,
							bodyA: e,
							bodyB: t,
							parentA: e.parent,
							parentB: t.parent,
							depth: 0,
							normal: {
								x: 0,
								y: 0
							},
							tangent: {
								x: 0,
								y: 0
							},
							penetration: {
								x: 0,
								y: 0
							},
							supports: [null, null],
							supportCount: 0
						};
					}, r.collides = function(e, o, s) {
						if (r._overlapAxes(t, e.vertices, o.vertices, e.axes), t.overlap <= 0 || (r._overlapAxes(n, o.vertices, e.vertices, o.axes), n.overlap <= 0)) return null;
						var c = s && s.table[a.id(e, o)], l;
						c ? l = c.collision : (l = r.create(e, o), l.collided = !0, l.bodyA = e.id < o.id ? e : o, l.bodyB = e.id < o.id ? o : e, l.parentA = l.bodyA.parent, l.parentB = l.bodyB.parent), e = l.bodyA, o = l.bodyB;
						var u = t.overlap < n.overlap ? t : n, d = l.normal, f = l.tangent, p = l.penetration, m = l.supports, h = u.overlap, g = u.axis, _ = g.x, v = g.y, y = o.position.x - e.position.x, b = o.position.y - e.position.y;
						_ * y + v * b >= 0 && (_ = -_, v = -v), d.x = _, d.y = v, f.x = -v, f.y = _, p.x = _ * h, p.y = v * h, l.depth = h;
						var x = r._findSupports(e, o, d, 1), S = 0;
						if (i.contains(e.vertices, x[0]) && (m[S++] = x[0]), i.contains(e.vertices, x[1]) && (m[S++] = x[1]), S < 2) {
							var C = r._findSupports(o, e, d, -1);
							i.contains(o.vertices, C[0]) && (m[S++] = C[0]), S < 2 && i.contains(o.vertices, C[1]) && (m[S++] = C[1]);
						}
						return S === 0 && (m[S++] = x[0]), l.supportCount = S, l;
					}, r._overlapAxes = function(e, t, n, r) {
						var i = t.length, a = n.length, o = t[0].x, s = t[0].y, c = n[0].x, l = n[0].y, u = r.length, d = Number.MAX_VALUE, f = 0, p, m, h, g, _, v;
						for (_ = 0; _ < u; _++) {
							var y = r[_], b = y.x, x = y.y, S = o * b + s * x, C = c * b + l * x, w = S, T = C;
							for (v = 1; v < i; v += 1) g = t[v].x * b + t[v].y * x, g > w ? w = g : g < S && (S = g);
							for (v = 1; v < a; v += 1) g = n[v].x * b + n[v].y * x, g > T ? T = g : g < C && (C = g);
							if (m = w - C, h = T - S, p = m < h ? m : h, p < d && (d = p, f = _, p <= 0)) break;
						}
						e.axis = r[f], e.overlap = d;
					}, r._findSupports = function(t, n, r, i) {
						var a = n.vertices, o = a.length, s = t.position.x, c = t.position.y, l = r.x * i, u = r.y * i, d = a[0], f = d, p = l * (s - f.x) + u * (c - f.y), m, h, g;
						for (g = 1; g < o; g += 1) f = a[g], h = l * (s - f.x) + u * (c - f.y), h < p && (p = h, d = f);
						return m = a[(o + d.index - 1) % o], p = l * (s - m.x) + u * (c - m.y), f = a[(d.index + 1) % o], l * (s - f.x) + u * (c - f.y) < p ? (e[0] = d, e[1] = f, e) : (e[0] = d, e[1] = m, e);
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(16);
				(function() {
					r.create = function(e, t) {
						var n = e.bodyA, a = e.bodyB, o = {
							id: r.id(n, a),
							bodyA: n,
							bodyB: a,
							collision: e,
							contacts: [i.create(), i.create()],
							contactCount: 0,
							separation: 0,
							isActive: !0,
							isSensor: n.isSensor || a.isSensor,
							timeCreated: t,
							timeUpdated: t,
							inverseMass: 0,
							friction: 0,
							frictionStatic: 0,
							restitution: 0,
							slop: 0
						};
						return r.update(o, e, t), o;
					}, r.update = function(e, t, n) {
						var r = t.supports, i = t.supportCount, a = e.contacts, o = t.parentA, s = t.parentB;
						e.isActive = !0, e.timeUpdated = n, e.collision = t, e.separation = t.depth, e.inverseMass = o.inverseMass + s.inverseMass, e.friction = o.friction < s.friction ? o.friction : s.friction, e.frictionStatic = o.frictionStatic > s.frictionStatic ? o.frictionStatic : s.frictionStatic, e.restitution = o.restitution > s.restitution ? o.restitution : s.restitution, e.slop = o.slop > s.slop ? o.slop : s.slop, e.contactCount = i, t.pair = e;
						var c = r[0], l = a[0], u = r[1], d = a[1];
						(d.vertex === c || l.vertex === u) && (a[1] = l, a[0] = l = d, d = a[1]), l.vertex = c, d.vertex = u;
					}, r.setActive = function(e, t, n) {
						t ? (e.isActive = !0, e.timeUpdated = n) : (e.isActive = !1, e.contactCount = 0);
					}, r.id = function(e, t) {
						return e.id < t.id ? e.id.toString(36) + ":" + t.id.toString(36) : t.id.toString(36) + ":" + e.id.toString(36);
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(3), a = n(2), o = n(7), s = n(1), c = n(11), l = n(0);
				(function() {
					r._warming = .4, r._torqueDampen = 1, r._minLength = 1e-6, r.create = function(e) {
						var t = e;
						t.bodyA && !t.pointA && (t.pointA = {
							x: 0,
							y: 0
						}), t.bodyB && !t.pointB && (t.pointB = {
							x: 0,
							y: 0
						});
						var n = t.bodyA ? a.add(t.bodyA.position, t.pointA) : t.pointA, r = t.bodyB ? a.add(t.bodyB.position, t.pointB) : t.pointB, i = a.magnitude(a.sub(n, r));
						t.length = t.length === void 0 ? i : t.length, t.id = t.id || l.nextId(), t.label = t.label || "Constraint", t.type = "constraint", t.stiffness = t.stiffness || (t.length > 0 ? 1 : .7), t.damping = t.damping || 0, t.angularStiffness = t.angularStiffness || 0, t.angleA = t.bodyA ? t.bodyA.angle : t.angleA, t.angleB = t.bodyB ? t.bodyB.angle : t.angleB, t.plugin = {};
						var o = {
							visible: !0,
							lineWidth: 2,
							strokeStyle: "#ffffff",
							type: "line",
							anchors: !0
						};
						return t.length === 0 && t.stiffness > .1 ? (o.type = "pin", o.anchors = !1) : t.stiffness < .9 && (o.type = "spring"), t.render = l.extend(o, t.render), t;
					}, r.preSolveAll = function(e) {
						for (var t = 0; t < e.length; t += 1) {
							var n = e[t], r = n.constraintImpulse;
							n.isStatic || r.x === 0 && r.y === 0 && r.angle === 0 || (n.position.x += r.x, n.position.y += r.y, n.angle += r.angle);
						}
					}, r.solveAll = function(e, t) {
						for (var n = l.clamp(t / l._baseDelta, 0, 1), i = 0; i < e.length; i += 1) {
							var a = e[i], o = !a.bodyA || a.bodyA && a.bodyA.isStatic, s = !a.bodyB || a.bodyB && a.bodyB.isStatic;
							(o || s) && r.solve(e[i], n);
						}
						for (i = 0; i < e.length; i += 1) a = e[i], o = !a.bodyA || a.bodyA && a.bodyA.isStatic, s = !a.bodyB || a.bodyB && a.bodyB.isStatic, !o && !s && r.solve(e[i], n);
					}, r.solve = function(e, t) {
						var n = e.bodyA, i = e.bodyB, o = e.pointA, s = e.pointB;
						if (!(!n && !i)) {
							n && !n.isStatic && (a.rotate(o, n.angle - e.angleA, o), e.angleA = n.angle), i && !i.isStatic && (a.rotate(s, i.angle - e.angleB, s), e.angleB = i.angle);
							var c = o, l = s;
							if (n && (c = a.add(n.position, o)), i && (l = a.add(i.position, s)), !(!c || !l)) {
								var u = a.sub(c, l), d = a.magnitude(u);
								d < r._minLength && (d = r._minLength);
								var f = (d - e.length) / d, p = e.stiffness >= 1 || e.length === 0 ? e.stiffness * t : e.stiffness * t * t, m = e.damping * t, h = a.mult(u, f * p), g = (n ? n.inverseMass : 0) + (i ? i.inverseMass : 0), _ = g + ((n ? n.inverseInertia : 0) + (i ? i.inverseInertia : 0)), v, y, b, x, S;
								if (m > 0) {
									var C = a.create();
									b = a.div(u, d), S = a.sub(i && a.sub(i.position, i.positionPrev) || C, n && a.sub(n.position, n.positionPrev) || C), x = a.dot(b, S);
								}
								n && !n.isStatic && (y = n.inverseMass / g, n.constraintImpulse.x -= h.x * y, n.constraintImpulse.y -= h.y * y, n.position.x -= h.x * y, n.position.y -= h.y * y, m > 0 && (n.positionPrev.x -= m * b.x * x * y, n.positionPrev.y -= m * b.y * x * y), v = a.cross(o, h) / _ * r._torqueDampen * n.inverseInertia * (1 - e.angularStiffness), n.constraintImpulse.angle -= v, n.angle -= v), i && !i.isStatic && (y = i.inverseMass / g, i.constraintImpulse.x += h.x * y, i.constraintImpulse.y += h.y * y, i.position.x += h.x * y, i.position.y += h.y * y, m > 0 && (i.positionPrev.x += m * b.x * x * y, i.positionPrev.y += m * b.y * x * y), v = a.cross(s, h) / _ * r._torqueDampen * i.inverseInertia * (1 - e.angularStiffness), i.constraintImpulse.angle += v, i.angle += v);
							}
						}
					}, r.postSolveAll = function(e) {
						for (var t = 0; t < e.length; t++) {
							var n = e[t], l = n.constraintImpulse;
							if (!(n.isStatic || l.x === 0 && l.y === 0 && l.angle === 0)) {
								o.set(n, !1);
								for (var u = 0; u < n.parts.length; u++) {
									var d = n.parts[u];
									i.translate(d.vertices, l), u > 0 && (d.position.x += l.x, d.position.y += l.y), l.angle !== 0 && (i.rotate(d.vertices, l.angle, n.position), c.rotate(d.axes, l.angle), u > 0 && a.rotateAbout(d.position, l.angle, n.position, d.position)), s.update(d.bounds, d.vertices, n.velocity);
								}
								l.angle *= r._warming, l.x *= r._warming, l.y *= r._warming;
							}
						}
					}, r.pointAWorld = function(e) {
						return {
							x: (e.bodyA ? e.bodyA.position.x : 0) + (e.pointA ? e.pointA.x : 0),
							y: (e.bodyA ? e.bodyA.position.y : 0) + (e.pointA ? e.pointA.y : 0)
						};
					}, r.pointBWorld = function(e) {
						return {
							x: (e.bodyB ? e.bodyB.position.x : 0) + (e.pointB ? e.pointB.x : 0),
							y: (e.bodyB ? e.bodyB.position.y : 0) + (e.pointB ? e.pointB.y : 0)
						};
					}, r.currentLength = function(e) {
						var t = (e.bodyA ? e.bodyA.position.x : 0) + (e.pointA ? e.pointA.x : 0), n = (e.bodyA ? e.bodyA.position.y : 0) + (e.pointA ? e.pointA.y : 0), r = (e.bodyB ? e.bodyB.position.x : 0) + (e.pointB ? e.pointB.x : 0), i = (e.bodyB ? e.bodyB.position.y : 0) + (e.pointB ? e.pointB.y : 0), a = t - r, o = n - i;
						return Math.sqrt(a * a + o * o);
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(2), a = n(0);
				(function() {
					r.fromVertices = function(e) {
						for (var t = {}, n = 0; n < e.length; n++) {
							var r = (n + 1) % e.length, o = i.normalise({
								x: e[r].y - e[n].y,
								y: e[n].x - e[r].x
							}), s = o.y === 0 ? Infinity : o.x / o.y;
							s = s.toFixed(3).toString(), t[s] = o;
						}
						return a.values(t);
					}, r.rotate = function(e, t) {
						if (t !== 0) for (var n = Math.cos(t), r = Math.sin(t), i = 0; i < e.length; i++) {
							var a = e[i], o = a.x * n - a.y * r;
							a.y = a.x * r + a.y * n, a.x = o;
						}
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(3), a = n(0), o = n(4), s = n(1), c = n(2);
				(function() {
					r.rectangle = function(e, t, n, r, s) {
						s ||= {};
						var c = {
							label: "Rectangle Body",
							position: {
								x: e,
								y: t
							},
							vertices: i.fromPath("L 0 0 L " + n + " 0 L " + n + " " + r + " L 0 " + r)
						};
						if (s.chamfer) {
							var l = s.chamfer;
							c.vertices = i.chamfer(c.vertices, l.radius, l.quality, l.qualityMin, l.qualityMax), delete s.chamfer;
						}
						return o.create(a.extend({}, c, s));
					}, r.trapezoid = function(e, t, n, r, s, c) {
						c ||= {}, s >= 1 && a.warn("Bodies.trapezoid: slope parameter must be < 1."), s *= .5;
						var l = (1 - s * 2) * n, u = n * s, d = u + l, f = d + u, p = s < .5 ? "L 0 0 L " + u + " " + -r + " L " + d + " " + -r + " L " + f + " 0" : "L 0 0 L " + d + " " + -r + " L " + f + " 0", m = {
							label: "Trapezoid Body",
							position: {
								x: e,
								y: t
							},
							vertices: i.fromPath(p)
						};
						if (c.chamfer) {
							var h = c.chamfer;
							m.vertices = i.chamfer(m.vertices, h.radius, h.quality, h.qualityMin, h.qualityMax), delete c.chamfer;
						}
						return o.create(a.extend({}, m, c));
					}, r.circle = function(e, t, n, i, o) {
						i ||= {};
						var s = {
							label: "Circle Body",
							circleRadius: n
						};
						o ||= 25;
						var c = Math.ceil(Math.max(10, Math.min(o, n)));
						return c % 2 == 1 && (c += 1), r.polygon(e, t, c, n, a.extend({}, s, i));
					}, r.polygon = function(e, t, n, s, c) {
						if (c ||= {}, n < 3) return r.circle(e, t, s, c);
						for (var l = 2 * Math.PI / n, u = "", d = l * .5, f = 0; f < n; f += 1) {
							var p = d + f * l, m = Math.cos(p) * s, h = Math.sin(p) * s;
							u += "L " + m.toFixed(3) + " " + h.toFixed(3) + " ";
						}
						var g = {
							label: "Polygon Body",
							position: {
								x: e,
								y: t
							},
							vertices: i.fromPath(u)
						};
						if (c.chamfer) {
							var _ = c.chamfer;
							g.vertices = i.chamfer(g.vertices, _.radius, _.quality, _.qualityMin, _.qualityMax), delete c.chamfer;
						}
						return o.create(a.extend({}, g, c));
					}, r.fromVertices = function(e, t, n, r, l, u, d, f) {
						var p = a.getDecomp(), m = !!(p && p.quickDecomp), h, g, _, v, y, b, x, S, C, w;
						for (r ||= {}, g = [], l = l === void 0 ? !1 : l, u = u === void 0 ? .01 : u, d = d === void 0 ? 10 : d, f = f === void 0 ? .01 : f, a.isArray(n[0]) || (n = [n]), C = 0; C < n.length; C += 1) if (y = n[C], _ = i.isConvex(y), v = !_, v && !m && a.warnOnce("Bodies.fromVertices: Install the 'poly-decomp' library and use Common.setDecomp or provide 'decomp' as a global to decompose concave vertices."), _ || !m) y = _ ? i.clockwiseSort(y) : i.hull(y), g.push({
							position: {
								x: e,
								y: t
							},
							vertices: y
						});
						else {
							var T = y.map(function(e) {
								return [e.x, e.y];
							});
							p.makeCCW(T), u !== !1 && p.removeCollinearPoints(T, u), f !== !1 && p.removeDuplicatePoints && p.removeDuplicatePoints(T, f);
							var E = p.quickDecomp(T);
							for (b = 0; b < E.length; b++) {
								var D = E[b].map(function(e) {
									return {
										x: e[0],
										y: e[1]
									};
								});
								d > 0 && i.area(D) < d || g.push({
									position: i.centre(D),
									vertices: D
								});
							}
						}
						for (b = 0; b < g.length; b++) g[b] = o.create(a.extend(g[b], r));
						if (l) {
							var O = 5;
							for (b = 0; b < g.length; b++) {
								var k = g[b];
								for (x = b + 1; x < g.length; x++) {
									var A = g[x];
									if (s.overlaps(k.bounds, A.bounds)) {
										var ee = k.vertices, j = A.vertices;
										for (S = 0; S < k.vertices.length; S++) for (w = 0; w < A.vertices.length; w++) {
											var te = c.magnitudeSquared(c.sub(ee[(S + 1) % ee.length], j[w])), M = c.magnitudeSquared(c.sub(ee[S], j[(w + 1) % j.length]));
											te < O && M < O && (ee[S].isInternal = !0, j[w].isInternal = !0);
										}
									}
								}
							}
						}
						return g.length > 1 ? (h = o.create(a.extend({ parts: g.slice(0) }, r)), o.setPosition(h, {
							x: e,
							y: t
						}), h) : g[0];
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(0), a = n(8);
				(function() {
					r.create = function(e) {
						return i.extend({
							bodies: [],
							collisions: [],
							pairs: null
						}, e);
					}, r.setBodies = function(e, t) {
						e.bodies = t.slice(0);
					}, r.clear = function(e) {
						e.bodies = [], e.collisions = [];
					}, r.collisions = function(e) {
						var t = e.pairs, n = e.bodies, i = n.length, o = r.canCollide, s = a.collides, c = e.collisions, l = 0, u, d;
						for (n.sort(r._compareBoundsX), u = 0; u < i; u++) {
							var f = n[u], p = f.bounds, m = f.bounds.max.x, h = f.bounds.max.y, g = f.bounds.min.y, _ = f.isStatic || f.isSleeping, v = f.parts.length, y = v === 1;
							for (d = u + 1; d < i; d++) {
								var b = n[d], x = b.bounds;
								if (x.min.x > m) break;
								if (!(h < x.min.y || g > x.max.y) && !(_ && (b.isStatic || b.isSleeping)) && o(f.collisionFilter, b.collisionFilter)) {
									var S = b.parts.length;
									if (y && S === 1) {
										var C = s(f, b, t);
										C && (c[l++] = C);
									} else for (var w = v > 1 ? 1 : 0, T = S > 1 ? 1 : 0, E = w; E < v; E++) for (var D = f.parts[E], p = D.bounds, O = T; O < S; O++) {
										var k = b.parts[O], x = k.bounds;
										if (!(p.min.x > x.max.x || p.max.x < x.min.x || p.max.y < x.min.y || p.min.y > x.max.y)) {
											var C = s(D, k, t);
											C && (c[l++] = C);
										}
									}
								}
							}
						}
						return c.length !== l && (c.length = l), c;
					}, r.canCollide = function(e, t) {
						return e.group === t.group && e.group !== 0 ? e.group > 0 : (e.mask & t.category) !== 0 && (t.mask & e.category) !== 0;
					}, r._compareBoundsX = function(e, t) {
						return e.bounds.min.x - t.bounds.min.x;
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(0);
				(function() {
					r.create = function(e) {
						var t = {};
						return e || i.log("Mouse.create: element was undefined, defaulting to document.body", "warn"), t.element = e || document.body, t.absolute = {
							x: 0,
							y: 0
						}, t.position = {
							x: 0,
							y: 0
						}, t.mousedownPosition = {
							x: 0,
							y: 0
						}, t.mouseupPosition = {
							x: 0,
							y: 0
						}, t.offset = {
							x: 0,
							y: 0
						}, t.scale = {
							x: 1,
							y: 1
						}, t.wheelDelta = 0, t.button = -1, t.pixelRatio = parseInt(t.element.getAttribute("data-pixel-ratio"), 10) || 1, t.sourceEvents = {
							mousemove: null,
							mousedown: null,
							mouseup: null,
							mousewheel: null
						}, t.mousemove = function(e) {
							var n = r._getRelativeMousePosition(e, t.element, t.pixelRatio);
							e.changedTouches && (t.button = 0, e.preventDefault()), t.absolute.x = n.x, t.absolute.y = n.y, t.position.x = t.absolute.x * t.scale.x + t.offset.x, t.position.y = t.absolute.y * t.scale.y + t.offset.y, t.sourceEvents.mousemove = e;
						}, t.mousedown = function(e) {
							var n = r._getRelativeMousePosition(e, t.element, t.pixelRatio);
							e.changedTouches ? (t.button = 0, e.preventDefault()) : t.button = e.button, t.absolute.x = n.x, t.absolute.y = n.y, t.position.x = t.absolute.x * t.scale.x + t.offset.x, t.position.y = t.absolute.y * t.scale.y + t.offset.y, t.mousedownPosition.x = t.position.x, t.mousedownPosition.y = t.position.y, t.sourceEvents.mousedown = e;
						}, t.mouseup = function(e) {
							var n = r._getRelativeMousePosition(e, t.element, t.pixelRatio);
							e.changedTouches && e.preventDefault(), t.button = -1, t.absolute.x = n.x, t.absolute.y = n.y, t.position.x = t.absolute.x * t.scale.x + t.offset.x, t.position.y = t.absolute.y * t.scale.y + t.offset.y, t.mouseupPosition.x = t.position.x, t.mouseupPosition.y = t.position.y, t.sourceEvents.mouseup = e;
						}, t.mousewheel = function(e) {
							t.wheelDelta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail)), e.preventDefault(), t.sourceEvents.mousewheel = e;
						}, r.setElement(t, t.element), t;
					}, r.setElement = function(e, t) {
						e.element = t, t.addEventListener("mousemove", e.mousemove, { passive: !0 }), t.addEventListener("mousedown", e.mousedown, { passive: !0 }), t.addEventListener("mouseup", e.mouseup, { passive: !0 }), t.addEventListener("wheel", e.mousewheel, { passive: !1 }), t.addEventListener("touchmove", e.mousemove, { passive: !1 }), t.addEventListener("touchstart", e.mousedown, { passive: !1 }), t.addEventListener("touchend", e.mouseup, { passive: !1 });
					}, r.clearSourceEvents = function(e) {
						e.sourceEvents.mousemove = null, e.sourceEvents.mousedown = null, e.sourceEvents.mouseup = null, e.sourceEvents.mousewheel = null, e.wheelDelta = 0;
					}, r.setOffset = function(e, t) {
						e.offset.x = t.x, e.offset.y = t.y, e.position.x = e.absolute.x * e.scale.x + e.offset.x, e.position.y = e.absolute.y * e.scale.y + e.offset.y;
					}, r.setScale = function(e, t) {
						e.scale.x = t.x, e.scale.y = t.y, e.position.x = e.absolute.x * e.scale.x + e.offset.x, e.position.y = e.absolute.y * e.scale.y + e.offset.y;
					}, r._getRelativeMousePosition = function(e, t, n) {
						var r = t.getBoundingClientRect(), i = document.documentElement || document.body.parentNode || document.body, a = window.pageXOffset === void 0 ? i.scrollLeft : window.pageXOffset, o = window.pageYOffset === void 0 ? i.scrollTop : window.pageYOffset, s = e.changedTouches, c, l;
						return s ? (c = s[0].pageX - r.left - a, l = s[0].pageY - r.top - o) : (c = e.pageX - r.left - a, l = e.pageY - r.top - o), {
							x: c / (t.clientWidth / (t.width || t.clientWidth) * n),
							y: l / (t.clientHeight / (t.height || t.clientHeight) * n)
						};
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(0);
				(function() {
					r._registry = {}, r.register = function(e) {
						if (r.isPlugin(e) || i.warn("Plugin.register:", r.toString(e), "does not implement all required fields."), e.name in r._registry) {
							var t = r._registry[e.name], n = r.versionParse(e.version).number, a = r.versionParse(t.version).number;
							n > a ? (i.warn("Plugin.register:", r.toString(t), "was upgraded to", r.toString(e)), r._registry[e.name] = e) : n < a ? i.warn("Plugin.register:", r.toString(t), "can not be downgraded to", r.toString(e)) : e !== t && i.warn("Plugin.register:", r.toString(e), "is already registered to different plugin object");
						} else r._registry[e.name] = e;
						return e;
					}, r.resolve = function(e) {
						return r._registry[r.dependencyParse(e).name];
					}, r.toString = function(e) {
						return typeof e == "string" ? e : (e.name || "anonymous") + "@" + (e.version || e.range || "0.0.0");
					}, r.isPlugin = function(e) {
						return e && e.name && e.version && e.install;
					}, r.isUsed = function(e, t) {
						return e.used.indexOf(t) > -1;
					}, r.isFor = function(e, t) {
						var n = e.for && r.dependencyParse(e.for);
						return !e.for || t.name === n.name && r.versionSatisfies(t.version, n.range);
					}, r.use = function(e, t) {
						if (e.uses = (e.uses || []).concat(t || []), e.uses.length === 0) {
							i.warn("Plugin.use:", r.toString(e), "does not specify any dependencies to install.");
							return;
						}
						for (var n = r.dependencies(e), a = i.topologicalSort(n), o = [], s = 0; s < a.length; s += 1) if (a[s] !== e.name) {
							var c = r.resolve(a[s]);
							if (!c) {
								o.push("❌ " + a[s]);
								continue;
							}
							r.isUsed(e, c.name) || (r.isFor(c, e) || (i.warn("Plugin.use:", r.toString(c), "is for", c.for, "but installed on", r.toString(e) + "."), c._warned = !0), c.install ? c.install(e) : (i.warn("Plugin.use:", r.toString(c), "does not specify an install function."), c._warned = !0), c._warned ? (o.push("🔶 " + r.toString(c)), delete c._warned) : o.push("✅ " + r.toString(c)), e.used.push(c.name));
						}
						o.length > 0 && i.info(o.join("  "));
					}, r.dependencies = function(e, t) {
						var n = r.dependencyParse(e), a = n.name;
						if (t ||= {}, !(a in t)) {
							e = r.resolve(e) || e, t[a] = i.map(e.uses || [], function(t) {
								r.isPlugin(t) && r.register(t);
								var a = r.dependencyParse(t), o = r.resolve(t);
								return o && !r.versionSatisfies(o.version, a.range) ? (i.warn("Plugin.dependencies:", r.toString(o), "does not satisfy", r.toString(a), "used by", r.toString(n) + "."), o._warned = !0, e._warned = !0) : o || (i.warn("Plugin.dependencies:", r.toString(t), "used by", r.toString(n), "could not be resolved."), e._warned = !0), a.name;
							});
							for (var o = 0; o < t[a].length; o += 1) r.dependencies(t[a][o], t);
							return t;
						}
					}, r.dependencyParse = function(e) {
						return i.isString(e) ? (/^[\w-]+(@(\*|[\^~]?\d+\.\d+\.\d+(-[0-9A-Za-z-+]+)?))?$/.test(e) || i.warn("Plugin.dependencyParse:", e, "is not a valid dependency string."), {
							name: e.split("@")[0],
							range: e.split("@")[1] || "*"
						}) : {
							name: e.name,
							range: e.range || e.version
						};
					}, r.versionParse = function(e) {
						var t = /^(\*)|(\^|~|>=|>)?\s*((\d+)\.(\d+)\.(\d+))(-[0-9A-Za-z-+]+)?$/;
						t.test(e) || i.warn("Plugin.versionParse:", e, "is not a valid version or range.");
						var n = t.exec(e), r = Number(n[4]), a = Number(n[5]), o = Number(n[6]);
						return {
							isRange: !!(n[1] || n[2]),
							version: n[3],
							range: e,
							operator: n[1] || n[2] || "",
							major: r,
							minor: a,
							patch: o,
							parts: [
								r,
								a,
								o
							],
							prerelease: n[7],
							number: r * 1e8 + a * 1e4 + o
						};
					}, r.versionSatisfies = function(e, t) {
						t ||= "*";
						var n = r.versionParse(t), i = r.versionParse(e);
						if (n.isRange) {
							if (n.operator === "*" || e === "*") return !0;
							if (n.operator === ">") return i.number > n.number;
							if (n.operator === ">=") return i.number >= n.number;
							if (n.operator === "~") return i.major === n.major && i.minor === n.minor && i.patch >= n.patch;
							if (n.operator === "^") return n.major > 0 ? i.major === n.major && i.number >= n.number : n.minor > 0 ? i.minor === n.minor && i.patch >= n.patch : i.patch === n.patch;
						}
						return e === t || e === "*";
					};
				})();
			}),
			(function(e, t) {
				var n = {};
				e.exports = n, (function() {
					n.create = function(e) {
						return {
							vertex: e,
							normalImpulse: 0,
							tangentImpulse: 0
						};
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(7), a = n(18), o = n(13), s = n(19), c = n(5), l = n(6), u = n(10), d = n(0), f = n(4);
				(function() {
					r._deltaMax = 1e3 / 60, r.create = function(e) {
						e ||= {};
						var t = d.extend({
							positionIterations: 6,
							velocityIterations: 4,
							constraintIterations: 2,
							enableSleeping: !1,
							events: [],
							plugin: {},
							gravity: {
								x: 0,
								y: 1,
								scale: .001
							},
							timing: {
								timestamp: 0,
								timeScale: 1,
								lastDelta: 0,
								lastElapsed: 0,
								lastUpdatesPerFrame: 0
							}
						}, e);
						return t.world = e.world || l.create({ label: "World" }), t.pairs = e.pairs || s.create(), t.detector = e.detector || o.create(), t.detector.pairs = t.pairs, t.grid = { buckets: [] }, t.world.gravity = t.gravity, t.broadphase = t.grid, t.metrics = {}, t;
					}, r.update = function(e, t) {
						var n = d.now(), f = e.world, p = e.detector, m = e.pairs, h = e.timing, g = h.timestamp, _;
						t > r._deltaMax && d.warnOnce("Matter.Engine.update: delta argument is recommended to be less than or equal to", r._deltaMax.toFixed(3), "ms."), t = t === void 0 ? d._baseDelta : t, t *= h.timeScale, h.timestamp += t, h.lastDelta = t;
						var v = {
							timestamp: h.timestamp,
							delta: t
						};
						c.trigger(e, "beforeUpdate", v);
						var y = l.allBodies(f), b = l.allConstraints(f);
						for (f.isModified && (o.setBodies(p, y), l.setModified(f, !1, !1, !0)), e.enableSleeping && i.update(y, t), r._bodiesApplyGravity(y, e.gravity), t > 0 && r._bodiesUpdate(y, t), c.trigger(e, "beforeSolve", v), u.preSolveAll(y), _ = 0; _ < e.constraintIterations; _++) u.solveAll(b, t);
						u.postSolveAll(y);
						var x = o.collisions(p);
						s.update(m, x, g), e.enableSleeping && i.afterCollisions(m.list), m.collisionStart.length > 0 && c.trigger(e, "collisionStart", {
							pairs: m.collisionStart,
							timestamp: h.timestamp,
							delta: t
						});
						var S = d.clamp(20 / e.positionIterations, 0, 1);
						for (a.preSolvePosition(m.list), _ = 0; _ < e.positionIterations; _++) a.solvePosition(m.list, t, S);
						for (a.postSolvePosition(y), u.preSolveAll(y), _ = 0; _ < e.constraintIterations; _++) u.solveAll(b, t);
						for (u.postSolveAll(y), a.preSolveVelocity(m.list), _ = 0; _ < e.velocityIterations; _++) a.solveVelocity(m.list, t);
						return r._bodiesUpdateVelocities(y), m.collisionActive.length > 0 && c.trigger(e, "collisionActive", {
							pairs: m.collisionActive,
							timestamp: h.timestamp,
							delta: t
						}), m.collisionEnd.length > 0 && c.trigger(e, "collisionEnd", {
							pairs: m.collisionEnd,
							timestamp: h.timestamp,
							delta: t
						}), r._bodiesClearForces(y), c.trigger(e, "afterUpdate", v), e.timing.lastElapsed = d.now() - n, e;
					}, r.merge = function(e, t) {
						if (d.extend(e, t), t.world) {
							e.world = t.world, r.clear(e);
							for (var n = l.allBodies(e.world), a = 0; a < n.length; a++) {
								var o = n[a];
								i.set(o, !1), o.id = d.nextId();
							}
						}
					}, r.clear = function(e) {
						s.clear(e.pairs), o.clear(e.detector);
					}, r._bodiesClearForces = function(e) {
						for (var t = e.length, n = 0; n < t; n++) {
							var r = e[n];
							r.force.x = 0, r.force.y = 0, r.torque = 0;
						}
					}, r._bodiesApplyGravity = function(e, t) {
						var n = t.scale === void 0 ? .001 : t.scale, r = e.length;
						if (!(t.x === 0 && t.y === 0 || n === 0)) for (var i = 0; i < r; i++) {
							var a = e[i];
							a.isStatic || a.isSleeping || (a.force.y += a.mass * t.y * n, a.force.x += a.mass * t.x * n);
						}
					}, r._bodiesUpdate = function(e, t) {
						for (var n = e.length, r = 0; r < n; r++) {
							var i = e[r];
							i.isStatic || i.isSleeping || f.update(i, t);
						}
					}, r._bodiesUpdateVelocities = function(e) {
						for (var t = e.length, n = 0; n < t; n++) f.updateVelocities(e[n]);
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(3), a = n(0), o = n(1);
				(function() {
					r._restingThresh = 2, r._restingThreshTangent = Math.sqrt(6), r._positionDampen = .9, r._positionWarming = .8, r._frictionNormalMultiplier = 5, r._frictionMaxStatic = Number.MAX_VALUE, r.preSolvePosition = function(e) {
						var t, n, r, i = e.length;
						for (t = 0; t < i; t++) n = e[t], n.isActive && (r = n.contactCount, n.collision.parentA.totalContacts += r, n.collision.parentB.totalContacts += r);
					}, r.solvePosition = function(e, t, n) {
						var i, o, s, c, l, u, d, f, p = r._positionDampen * (n || 1), m = a.clamp(t / a._baseDelta, 0, 1), h = e.length;
						for (i = 0; i < h; i++) o = e[i], !(!o.isActive || o.isSensor) && (s = o.collision, c = s.parentA, l = s.parentB, u = s.normal, o.separation = s.depth + u.x * (l.positionImpulse.x - c.positionImpulse.x) + u.y * (l.positionImpulse.y - c.positionImpulse.y));
						for (i = 0; i < h; i++) o = e[i], !(!o.isActive || o.isSensor) && (s = o.collision, c = s.parentA, l = s.parentB, u = s.normal, f = o.separation - o.slop * m, (c.isStatic || l.isStatic) && (f *= 2), c.isStatic || c.isSleeping || (d = p / c.totalContacts, c.positionImpulse.x += u.x * f * d, c.positionImpulse.y += u.y * f * d), l.isStatic || l.isSleeping || (d = p / l.totalContacts, l.positionImpulse.x -= u.x * f * d, l.positionImpulse.y -= u.y * f * d));
					}, r.postSolvePosition = function(e) {
						for (var t = r._positionWarming, n = e.length, a = i.translate, s = o.update, c = 0; c < n; c++) {
							var l = e[c], u = l.positionImpulse, d = u.x, f = u.y, p = l.velocity;
							if (l.totalContacts = 0, d !== 0 || f !== 0) {
								for (var m = 0; m < l.parts.length; m++) {
									var h = l.parts[m];
									a(h.vertices, u), s(h.bounds, h.vertices, p), h.position.x += d, h.position.y += f;
								}
								l.positionPrev.x += d, l.positionPrev.y += f, d * p.x + f * p.y < 0 ? (u.x = 0, u.y = 0) : (u.x *= t, u.y *= t);
							}
						}
					}, r.preSolveVelocity = function(e) {
						var t = e.length, n, r;
						for (n = 0; n < t; n++) {
							var i = e[n];
							if (!(!i.isActive || i.isSensor)) {
								var a = i.contacts, o = i.contactCount, s = i.collision, c = s.parentA, l = s.parentB, u = s.normal, d = s.tangent;
								for (r = 0; r < o; r++) {
									var f = a[r], p = f.vertex, m = f.normalImpulse, h = f.tangentImpulse;
									if (m !== 0 || h !== 0) {
										var g = u.x * m + d.x * h, _ = u.y * m + d.y * h;
										c.isStatic || c.isSleeping || (c.positionPrev.x += g * c.inverseMass, c.positionPrev.y += _ * c.inverseMass, c.anglePrev += c.inverseInertia * ((p.x - c.position.x) * _ - (p.y - c.position.y) * g)), l.isStatic || l.isSleeping || (l.positionPrev.x -= g * l.inverseMass, l.positionPrev.y -= _ * l.inverseMass, l.anglePrev -= l.inverseInertia * ((p.x - l.position.x) * _ - (p.y - l.position.y) * g));
									}
								}
							}
						}
					}, r.solveVelocity = function(e, t) {
						var n = t / a._baseDelta, i = n * n * n, o = -r._restingThresh * n, s = r._restingThreshTangent, c = r._frictionNormalMultiplier * n, l = r._frictionMaxStatic, u = e.length, d, f, p, m;
						for (p = 0; p < u; p++) {
							var h = e[p];
							if (!(!h.isActive || h.isSensor)) {
								var g = h.collision, _ = g.parentA, v = g.parentB, y = g.normal.x, b = g.normal.y, x = g.tangent.x, S = g.tangent.y, C = h.inverseMass, w = h.friction * h.frictionStatic * c, T = h.contacts, E = h.contactCount, D = 1 / E, O = _.position.x - _.positionPrev.x, k = _.position.y - _.positionPrev.y, A = _.angle - _.anglePrev, ee = v.position.x - v.positionPrev.x, j = v.position.y - v.positionPrev.y, te = v.angle - v.anglePrev;
								for (m = 0; m < E; m++) {
									var M = T[m], N = M.vertex, ne = N.x - _.position.x, P = N.y - _.position.y, F = N.x - v.position.x, I = N.y - v.position.y, L = O - P * A, R = k + ne * A, re = ee - I * te, ie = j + F * te, ae = L - re, oe = R - ie, se = y * ae + b * oe, z = x * ae + S * oe, ce = h.separation + se, le = Math.min(ce, 1);
									le = ce < 0 ? 0 : le;
									var ue = le * w;
									z < -ue || z > ue ? (f = z > 0 ? z : -z, d = h.friction * (z > 0 ? 1 : -1) * i, d < -f ? d = -f : d > f && (d = f)) : (d = z, f = l);
									var de = ne * b - P * y, fe = F * b - I * y, B = D / (C + _.inverseInertia * de * de + v.inverseInertia * fe * fe), pe = (1 + h.restitution) * se * B;
									if (d *= B, se < o) M.normalImpulse = 0;
									else {
										var me = M.normalImpulse;
										M.normalImpulse += pe, M.normalImpulse > 0 && (M.normalImpulse = 0), pe = M.normalImpulse - me;
									}
									if (z < -s || z > s) M.tangentImpulse = 0;
									else {
										var he = M.tangentImpulse;
										M.tangentImpulse += d, M.tangentImpulse < -f && (M.tangentImpulse = -f), M.tangentImpulse > f && (M.tangentImpulse = f), d = M.tangentImpulse - he;
									}
									var ge = y * pe + x * d, _e = b * pe + S * d;
									_.isStatic || _.isSleeping || (_.positionPrev.x += ge * _.inverseMass, _.positionPrev.y += _e * _.inverseMass, _.anglePrev += (ne * _e - P * ge) * _.inverseInertia), v.isStatic || v.isSleeping || (v.positionPrev.x -= ge * v.inverseMass, v.positionPrev.y -= _e * v.inverseMass, v.anglePrev -= (F * _e - I * ge) * v.inverseInertia);
								}
							}
						}
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(9), a = n(0);
				(function() {
					r.create = function(e) {
						return a.extend({
							table: {},
							list: [],
							collisionStart: [],
							collisionActive: [],
							collisionEnd: []
						}, e);
					}, r.update = function(e, t, n) {
						var r = i.update, a = i.create, o = i.setActive, s = e.table, c = e.list, l = c.length, u = l, d = e.collisionStart, f = e.collisionEnd, p = e.collisionActive, m = t.length, h = 0, g = 0, _ = 0, v, y, b;
						for (b = 0; b < m; b++) v = t[b], y = v.pair, y ? (y.isActive && (p[_++] = y), r(y, v, n)) : (y = a(v, n), s[y.id] = y, d[h++] = y, c[u++] = y);
						for (u = 0, l = c.length, b = 0; b < l; b++) y = c[b], y.timeUpdated >= n ? c[u++] = y : (o(y, !1, n), y.collision.bodyA.sleepCounter > 0 && y.collision.bodyB.sleepCounter > 0 ? c[u++] = y : (f[g++] = y, delete s[y.id]));
						c.length !== u && (c.length = u), d.length !== h && (d.length = h), f.length !== g && (f.length = g), p.length !== _ && (p.length = _);
					}, r.clear = function(e) {
						return e.table = {}, e.list.length = 0, e.collisionStart.length = 0, e.collisionActive.length = 0, e.collisionEnd.length = 0, e;
					};
				})();
			}),
			(function(e, t, n) {
				var r = e.exports = n(21);
				r.Axes = n(11), r.Bodies = n(12), r.Body = n(4), r.Bounds = n(1), r.Collision = n(8), r.Common = n(0), r.Composite = n(6), r.Composites = n(22), r.Constraint = n(10), r.Contact = n(16), r.Detector = n(13), r.Engine = n(17), r.Events = n(5), r.Grid = n(23), r.Mouse = n(14), r.MouseConstraint = n(24), r.Pair = n(9), r.Pairs = n(19), r.Plugin = n(15), r.Query = n(25), r.Render = n(26), r.Resolver = n(18), r.Runner = n(27), r.SAT = n(28), r.Sleeping = n(7), r.Svg = n(29), r.Vector = n(2), r.Vertices = n(3), r.World = n(30), r.Engine.run = r.Runner.run, r.Common.deprecated(r.Engine, "run", "Engine.run ➤ use Matter.Runner.run(engine) instead");
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(15), a = n(0);
				(function() {
					r.name = "matter-js", r.version = "0.20.0", r.uses = [], r.used = [], r.use = function() {
						i.use(r, Array.prototype.slice.call(arguments));
					}, r.before = function(e, t) {
						return e = e.replace(/^Matter./, ""), a.chainPathBefore(r, e, t);
					}, r.after = function(e, t) {
						return e = e.replace(/^Matter./, ""), a.chainPathAfter(r, e, t);
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(6), a = n(10), o = n(0), s = n(4), c = n(12), l = o.deprecated;
				(function() {
					r.stack = function(e, t, n, r, a, o, c) {
						for (var l = i.create({ label: "Stack" }), u = e, d = t, f, p = 0, m = 0; m < r; m++) {
							for (var h = 0, g = 0; g < n; g++) {
								var _ = c(u, d, g, m, f, p);
								if (_) {
									var v = _.bounds.max.y - _.bounds.min.y, y = _.bounds.max.x - _.bounds.min.x;
									v > h && (h = v), s.translate(_, {
										x: y * .5,
										y: v * .5
									}), u = _.bounds.max.x + a, i.addBody(l, _), f = _, p += 1;
								} else u += a;
							}
							d += h + o, u = e;
						}
						return l;
					}, r.chain = function(e, t, n, r, s, c) {
						for (var l = e.bodies, u = 1; u < l.length; u++) {
							var d = l[u - 1], f = l[u], p = d.bounds.max.y - d.bounds.min.y, m = d.bounds.max.x - d.bounds.min.x, h = f.bounds.max.y - f.bounds.min.y, g = f.bounds.max.x - f.bounds.min.x, _ = {
								bodyA: d,
								pointA: {
									x: m * t,
									y: p * n
								},
								bodyB: f,
								pointB: {
									x: g * r,
									y: h * s
								}
							}, v = o.extend(_, c);
							i.addConstraint(e, a.create(v));
						}
						return e.label += " Chain", e;
					}, r.mesh = function(e, t, n, r, s) {
						var c = e.bodies, l, u, d, f, p;
						for (l = 0; l < n; l++) {
							for (u = 1; u < t; u++) d = c[u - 1 + l * t], f = c[u + l * t], i.addConstraint(e, a.create(o.extend({
								bodyA: d,
								bodyB: f
							}, s)));
							if (l > 0) for (u = 0; u < t; u++) d = c[u + (l - 1) * t], f = c[u + l * t], i.addConstraint(e, a.create(o.extend({
								bodyA: d,
								bodyB: f
							}, s))), r && u > 0 && (p = c[u - 1 + (l - 1) * t], i.addConstraint(e, a.create(o.extend({
								bodyA: p,
								bodyB: f
							}, s)))), r && u < t - 1 && (p = c[u + 1 + (l - 1) * t], i.addConstraint(e, a.create(o.extend({
								bodyA: p,
								bodyB: f
							}, s))));
						}
						return e.label += " Mesh", e;
					}, r.pyramid = function(e, t, n, i, a, o, c) {
						return r.stack(e, t, n, i, a, o, function(t, r, o, l, u, d) {
							var f = Math.min(i, Math.ceil(n / 2)), p = u ? u.bounds.max.x - u.bounds.min.x : 0;
							if (!(l > f)) {
								l = f - l;
								var m = l, h = n - 1 - l;
								if (!(o < m || o > h)) return d === 1 && s.translate(u, {
									x: (o + (n % 2 == 1 ? 1 : -1)) * p,
									y: 0
								}), c(e + (u ? o * p : 0) + o * a, r, o, l, u, d);
							}
						});
					}, r.newtonsCradle = function(e, t, n, r, o) {
						for (var s = i.create({ label: "Newtons Cradle" }), l = 0; l < n; l++) {
							var u = 1.9, d = c.circle(e + r * u * l, t + o, r, {
								inertia: Infinity,
								restitution: 1,
								friction: 0,
								frictionAir: 1e-4,
								slop: 1
							}), f = a.create({
								pointA: {
									x: e + r * u * l,
									y: t
								},
								bodyB: d
							});
							i.addBody(s, d), i.addConstraint(s, f);
						}
						return s;
					}, l(r, "newtonsCradle", "Composites.newtonsCradle ➤ moved to newtonsCradle example"), r.car = function(e, t, n, r, o) {
						var l = s.nextGroup(!0), u = 20, d = -n * .5 + u, f = n * .5 - u, p = 0, m = i.create({ label: "Car" }), h = c.rectangle(e, t, n, r, {
							collisionFilter: { group: l },
							chamfer: { radius: r * .5 },
							density: 2e-4
						}), g = c.circle(e + d, t + p, o, {
							collisionFilter: { group: l },
							friction: .8
						}), _ = c.circle(e + f, t + p, o, {
							collisionFilter: { group: l },
							friction: .8
						}), v = a.create({
							bodyB: h,
							pointB: {
								x: d,
								y: p
							},
							bodyA: g,
							stiffness: 1,
							length: 0
						}), y = a.create({
							bodyB: h,
							pointB: {
								x: f,
								y: p
							},
							bodyA: _,
							stiffness: 1,
							length: 0
						});
						return i.addBody(m, h), i.addBody(m, g), i.addBody(m, _), i.addConstraint(m, v), i.addConstraint(m, y), m;
					}, l(r, "car", "Composites.car ➤ moved to car example"), r.softBody = function(e, t, n, i, a, s, l, u, d, f) {
						d = o.extend({ inertia: Infinity }, d), f = o.extend({
							stiffness: .2,
							render: {
								type: "line",
								anchors: !1
							}
						}, f);
						var p = r.stack(e, t, n, i, a, s, function(e, t) {
							return c.circle(e, t, u, d);
						});
						return r.mesh(p, n, i, l, f), p.label = "Soft Body", p;
					}, l(r, "softBody", "Composites.softBody ➤ moved to softBody and cloth examples");
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(9), a = n(0), o = a.deprecated;
				(function() {
					r.create = function(e) {
						return a.extend({
							buckets: {},
							pairs: {},
							pairsList: [],
							bucketWidth: 48,
							bucketHeight: 48
						}, e);
					}, r.update = function(e, t, n, i) {
						var a, o, s, c = n.world, l = e.buckets, u, d, f = !1;
						for (a = 0; a < t.length; a++) {
							var p = t[a];
							if (!(p.isSleeping && !i) && !(c.bounds && (p.bounds.max.x < c.bounds.min.x || p.bounds.min.x > c.bounds.max.x || p.bounds.max.y < c.bounds.min.y || p.bounds.min.y > c.bounds.max.y))) {
								var m = r._getRegion(e, p);
								if (!p.region || m.id !== p.region.id || i) {
									(!p.region || i) && (p.region = m);
									var h = r._regionUnion(m, p.region);
									for (o = h.startCol; o <= h.endCol; o++) for (s = h.startRow; s <= h.endRow; s++) {
										d = r._getBucketId(o, s), u = l[d];
										var g = o >= m.startCol && o <= m.endCol && s >= m.startRow && s <= m.endRow, _ = o >= p.region.startCol && o <= p.region.endCol && s >= p.region.startRow && s <= p.region.endRow;
										!g && _ && _ && u && r._bucketRemoveBody(e, u, p), (p.region === m || g && !_ || i) && (u ||= r._createBucket(l, d), r._bucketAddBody(e, u, p));
									}
									p.region = m, f = !0;
								}
							}
						}
						f && (e.pairsList = r._createActivePairsList(e));
					}, o(r, "update", "Grid.update ➤ replaced by Matter.Detector"), r.clear = function(e) {
						e.buckets = {}, e.pairs = {}, e.pairsList = [];
					}, o(r, "clear", "Grid.clear ➤ replaced by Matter.Detector"), r._regionUnion = function(e, t) {
						var n = Math.min(e.startCol, t.startCol), i = Math.max(e.endCol, t.endCol), a = Math.min(e.startRow, t.startRow), o = Math.max(e.endRow, t.endRow);
						return r._createRegion(n, i, a, o);
					}, r._getRegion = function(e, t) {
						var n = t.bounds, i = Math.floor(n.min.x / e.bucketWidth), a = Math.floor(n.max.x / e.bucketWidth), o = Math.floor(n.min.y / e.bucketHeight), s = Math.floor(n.max.y / e.bucketHeight);
						return r._createRegion(i, a, o, s);
					}, r._createRegion = function(e, t, n, r) {
						return {
							id: e + "," + t + "," + n + "," + r,
							startCol: e,
							endCol: t,
							startRow: n,
							endRow: r
						};
					}, r._getBucketId = function(e, t) {
						return "C" + e + "R" + t;
					}, r._createBucket = function(e, t) {
						return e[t] = [];
					}, r._bucketAddBody = function(e, t, n) {
						var r = e.pairs, a = i.id, o = t.length, s;
						for (s = 0; s < o; s++) {
							var c = t[s];
							if (!(n.id === c.id || n.isStatic && c.isStatic)) {
								var l = a(n, c), u = r[l];
								u ? u[2] += 1 : r[l] = [
									n,
									c,
									1
								];
							}
						}
						t.push(n);
					}, r._bucketRemoveBody = function(e, t, n) {
						var r = e.pairs, o = i.id, s;
						t.splice(a.indexOf(t, n), 1);
						var c = t.length;
						for (s = 0; s < c; s++) {
							var l = r[o(n, t[s])];
							l && --l[2];
						}
					}, r._createActivePairsList = function(e) {
						var t, n = e.pairs, r = a.keys(n), i = r.length, o = [], s;
						for (s = 0; s < i; s++) t = n[r[s]], t[2] > 0 ? o.push(t) : delete n[r[s]];
						return o;
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(3), a = n(7), o = n(14), s = n(5), c = n(13), l = n(10), u = n(6), d = n(0), f = n(1);
				(function() {
					r.create = function(e, t) {
						var n = (e ? e.mouse : null) || (t ? t.mouse : null);
						n || (e && e.render && e.render.canvas ? n = o.create(e.render.canvas) : t && t.element ? n = o.create(t.element) : (n = o.create(), d.warn("MouseConstraint.create: options.mouse was undefined, options.element was undefined, may not function as expected")));
						var i = l.create({
							label: "Mouse Constraint",
							pointA: n.position,
							pointB: {
								x: 0,
								y: 0
							},
							length: .01,
							stiffness: .1,
							angularStiffness: 1,
							render: {
								strokeStyle: "#90EE90",
								lineWidth: 3
							}
						}), a = {
							type: "mouseConstraint",
							mouse: n,
							element: null,
							body: null,
							constraint: i,
							collisionFilter: {
								category: 1,
								mask: 4294967295,
								group: 0
							}
						}, c = d.extend(a, t);
						return s.on(e, "beforeUpdate", function() {
							var t = u.allBodies(e.world);
							r.update(c, t), r._triggerEvents(c);
						}), c;
					}, r.update = function(e, t) {
						var n = e.mouse, r = e.constraint, o = e.body;
						if (n.button === 0) {
							if (r.bodyB) a.set(r.bodyB, !1), r.pointA = n.position;
							else for (var l = 0; l < t.length; l++) if (o = t[l], f.contains(o.bounds, n.position) && c.canCollide(o.collisionFilter, e.collisionFilter)) for (var u = o.parts.length > 1 ? 1 : 0; u < o.parts.length; u++) {
								var d = o.parts[u];
								if (i.contains(d.vertices, n.position)) {
									r.pointA = n.position, r.bodyB = e.body = o, r.pointB = {
										x: n.position.x - o.position.x,
										y: n.position.y - o.position.y
									}, r.angleB = o.angle, a.set(o, !1), s.trigger(e, "startdrag", {
										mouse: n,
										body: o
									});
									break;
								}
							}
						} else r.bodyB = e.body = null, r.pointB = null, o && s.trigger(e, "enddrag", {
							mouse: n,
							body: o
						});
					}, r._triggerEvents = function(e) {
						var t = e.mouse, n = t.sourceEvents;
						n.mousemove && s.trigger(e, "mousemove", { mouse: t }), n.mousedown && s.trigger(e, "mousedown", { mouse: t }), n.mouseup && s.trigger(e, "mouseup", { mouse: t }), o.clearSourceEvents(t);
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(2), a = n(8), o = n(1), s = n(12), c = n(3);
				(function() {
					r.collides = function(e, t) {
						for (var n = [], r = t.length, i = e.bounds, s = a.collides, c = o.overlaps, l = 0; l < r; l++) {
							var u = t[l], d = u.parts.length, f = d === 1 ? 0 : 1;
							if (c(u.bounds, i)) for (var p = f; p < d; p++) {
								var m = u.parts[p];
								if (c(m.bounds, i)) {
									var h = s(m, e);
									if (h) {
										n.push(h);
										break;
									}
								}
							}
						}
						return n;
					}, r.ray = function(e, t, n, a) {
						a ||= 1e-100;
						for (var o = i.angle(t, n), c = i.magnitude(i.sub(t, n)), l = (n.x + t.x) * .5, u = (n.y + t.y) * .5, d = s.rectangle(l, u, c, a, { angle: o }), f = r.collides(d, e), p = 0; p < f.length; p += 1) {
							var m = f[p];
							m.body = m.bodyB = m.bodyA;
						}
						return f;
					}, r.region = function(e, t, n) {
						for (var r = [], i = 0; i < e.length; i++) {
							var a = e[i], s = o.overlaps(a.bounds, t);
							(s && !n || !s && n) && r.push(a);
						}
						return r;
					}, r.point = function(e, t) {
						for (var n = [], r = 0; r < e.length; r++) {
							var i = e[r];
							if (o.contains(i.bounds, t)) for (var a = i.parts.length === 1 ? 0 : 1; a < i.parts.length; a++) {
								var s = i.parts[a];
								if (o.contains(s.bounds, t) && c.contains(s.vertices, t)) {
									n.push(i);
									break;
								}
							}
						}
						return n;
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(4), a = n(0), o = n(6), s = n(1), c = n(5), l = n(2), u = n(14);
				(function() {
					var e, t;
					typeof window < "u" && (e = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || function(e) {
						window.setTimeout(function() {
							e(a.now());
						}, 1e3 / 60);
					}, t = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame), r._goodFps = 30, r._goodDelta = 1e3 / 60, r.create = function(e) {
						var t = {
							engine: null,
							element: null,
							canvas: null,
							mouse: null,
							frameRequestId: null,
							timing: {
								historySize: 60,
								delta: 0,
								deltaHistory: [],
								lastTime: 0,
								lastTimestamp: 0,
								lastElapsed: 0,
								timestampElapsed: 0,
								timestampElapsedHistory: [],
								engineDeltaHistory: [],
								engineElapsedHistory: [],
								engineUpdatesHistory: [],
								elapsedHistory: []
							},
							options: {
								width: 800,
								height: 600,
								pixelRatio: 1,
								background: "#14151f",
								wireframeBackground: "#14151f",
								wireframeStrokeStyle: "#bbb",
								hasBounds: !!e.bounds,
								enabled: !0,
								wireframes: !0,
								showSleeping: !0,
								showDebug: !1,
								showStats: !1,
								showPerformance: !1,
								showBounds: !1,
								showVelocity: !1,
								showCollisions: !1,
								showSeparations: !1,
								showAxes: !1,
								showPositions: !1,
								showAngleIndicator: !1,
								showIds: !1,
								showVertexNumbers: !1,
								showConvexHulls: !1,
								showInternalEdges: !1,
								showMousePosition: !1
							}
						}, n = a.extend(t, e);
						return n.canvas && (n.canvas.width = n.options.width || n.canvas.width, n.canvas.height = n.options.height || n.canvas.height), n.mouse = e.mouse, n.engine = e.engine, n.canvas = n.canvas || f(n.options.width, n.options.height), n.context = n.canvas.getContext("2d"), n.textures = {}, n.bounds = n.bounds || {
							min: {
								x: 0,
								y: 0
							},
							max: {
								x: n.canvas.width,
								y: n.canvas.height
							}
						}, n.controller = r, n.options.showBroadphase = !1, n.options.pixelRatio !== 1 && r.setPixelRatio(n, n.options.pixelRatio), a.isElement(n.element) && n.element.appendChild(n.canvas), n;
					}, r.run = function(t) {
						(function i(a) {
							t.frameRequestId = e(i), n(t, a), r.world(t, a), t.context.setTransform(t.options.pixelRatio, 0, 0, t.options.pixelRatio, 0, 0), (t.options.showStats || t.options.showDebug) && r.stats(t, t.context, a), (t.options.showPerformance || t.options.showDebug) && r.performance(t, t.context, a), t.context.setTransform(1, 0, 0, 1, 0, 0);
						})();
					}, r.stop = function(e) {
						t(e.frameRequestId);
					}, r.setPixelRatio = function(e, t) {
						var n = e.options, r = e.canvas;
						t === "auto" && (t = p(r)), n.pixelRatio = t, r.setAttribute("data-pixel-ratio", t), r.width = n.width * t, r.height = n.height * t, r.style.width = n.width + "px", r.style.height = n.height + "px";
					}, r.setSize = function(e, t, n) {
						e.options.width = t, e.options.height = n, e.bounds.max.x = e.bounds.min.x + t, e.bounds.max.y = e.bounds.min.y + n, e.options.pixelRatio === 1 ? (e.canvas.width = t, e.canvas.height = n) : r.setPixelRatio(e, e.options.pixelRatio);
					}, r.lookAt = function(e, t, n, r) {
						r = r === void 0 ? !0 : r, t = a.isArray(t) ? t : [t], n ||= {
							x: 0,
							y: 0
						};
						for (var i = {
							min: {
								x: Infinity,
								y: Infinity
							},
							max: {
								x: -Infinity,
								y: -Infinity
							}
						}, o = 0; o < t.length; o += 1) {
							var s = t[o], c = s.bounds ? s.bounds.min : s.min || s.position || s, l = s.bounds ? s.bounds.max : s.max || s.position || s;
							c && l && (c.x < i.min.x && (i.min.x = c.x), l.x > i.max.x && (i.max.x = l.x), c.y < i.min.y && (i.min.y = c.y), l.y > i.max.y && (i.max.y = l.y));
						}
						var d = i.max.x - i.min.x + 2 * n.x, f = i.max.y - i.min.y + 2 * n.y, p = e.canvas.height, m = e.canvas.width / p, h = d / f, g = 1, _ = 1;
						h > m ? _ = h / m : g = m / h, e.options.hasBounds = !0, e.bounds.min.x = i.min.x, e.bounds.max.x = i.min.x + d * g, e.bounds.min.y = i.min.y, e.bounds.max.y = i.min.y + f * _, r && (e.bounds.min.x += d * .5 - d * g * .5, e.bounds.max.x += d * .5 - d * g * .5, e.bounds.min.y += f * .5 - f * _ * .5, e.bounds.max.y += f * .5 - f * _ * .5), e.bounds.min.x -= n.x, e.bounds.max.x -= n.x, e.bounds.min.y -= n.y, e.bounds.max.y -= n.y, e.mouse && (u.setScale(e.mouse, {
							x: (e.bounds.max.x - e.bounds.min.x) / e.canvas.width,
							y: (e.bounds.max.y - e.bounds.min.y) / e.canvas.height
						}), u.setOffset(e.mouse, e.bounds.min));
					}, r.startViewTransform = function(e) {
						var t = e.bounds.max.x - e.bounds.min.x, n = e.bounds.max.y - e.bounds.min.y, r = t / e.options.width, i = n / e.options.height;
						e.context.setTransform(e.options.pixelRatio / r, 0, 0, e.options.pixelRatio / i, 0, 0), e.context.translate(-e.bounds.min.x, -e.bounds.min.y);
					}, r.endViewTransform = function(e) {
						e.context.setTransform(e.options.pixelRatio, 0, 0, e.options.pixelRatio, 0, 0);
					}, r.world = function(e, t) {
						var n = a.now(), i = e.engine, d = i.world, f = e.canvas, p = e.context, m = e.options, g = e.timing, _ = o.allBodies(d), v = o.allConstraints(d), y = m.wireframes ? m.wireframeBackground : m.background, b = [], x = [], S, C = { timestamp: i.timing.timestamp };
						if (c.trigger(e, "beforeRender", C), e.currentBackground !== y && h(e, y), p.globalCompositeOperation = "source-in", p.fillStyle = "transparent", p.fillRect(0, 0, f.width, f.height), p.globalCompositeOperation = "source-over", m.hasBounds) {
							for (S = 0; S < _.length; S++) {
								var w = _[S];
								s.overlaps(w.bounds, e.bounds) && b.push(w);
							}
							for (S = 0; S < v.length; S++) {
								var T = v[S], E = T.bodyA, D = T.bodyB, O = T.pointA, k = T.pointB;
								E && (O = l.add(E.position, T.pointA)), D && (k = l.add(D.position, T.pointB)), !(!O || !k) && (s.contains(e.bounds, O) || s.contains(e.bounds, k)) && x.push(T);
							}
							r.startViewTransform(e), e.mouse && (u.setScale(e.mouse, {
								x: (e.bounds.max.x - e.bounds.min.x) / e.options.width,
								y: (e.bounds.max.y - e.bounds.min.y) / e.options.height
							}), u.setOffset(e.mouse, e.bounds.min));
						} else x = v, b = _, e.options.pixelRatio !== 1 && e.context.setTransform(e.options.pixelRatio, 0, 0, e.options.pixelRatio, 0, 0);
						!m.wireframes || i.enableSleeping && m.showSleeping ? r.bodies(e, b, p) : (m.showConvexHulls && r.bodyConvexHulls(e, b, p), r.bodyWireframes(e, b, p)), m.showBounds && r.bodyBounds(e, b, p), (m.showAxes || m.showAngleIndicator) && r.bodyAxes(e, b, p), m.showPositions && r.bodyPositions(e, b, p), m.showVelocity && r.bodyVelocity(e, b, p), m.showIds && r.bodyIds(e, b, p), m.showSeparations && r.separations(e, i.pairs.list, p), m.showCollisions && r.collisions(e, i.pairs.list, p), m.showVertexNumbers && r.vertexNumbers(e, b, p), m.showMousePosition && r.mousePosition(e, e.mouse, p), r.constraints(x, p), m.hasBounds && r.endViewTransform(e), c.trigger(e, "afterRender", C), g.lastElapsed = a.now() - n;
					}, r.stats = function(e, t, n) {
						for (var r = e.engine, i = r.world, a = o.allBodies(i), s = 0, c = 55, l = 44, u = 0, d = 0, f = 0; f < a.length; f += 1) s += a[f].parts.length;
						var p = {
							Part: s,
							Body: a.length,
							Cons: o.allConstraints(i).length,
							Comp: o.allComposites(i).length,
							Pair: r.pairs.list.length
						};
						for (var m in t.fillStyle = "#0e0f19", t.fillRect(u, d, c * 5.5, l), t.font = "12px Arial", t.textBaseline = "top", t.textAlign = "right", p) {
							var h = p[m];
							t.fillStyle = "#aaa", t.fillText(m, u + c, d + 8), t.fillStyle = "#eee", t.fillText(h, u + c, d + 26), u += c;
						}
					}, r.performance = function(e, t) {
						var n = e.engine, i = e.timing, o = i.deltaHistory, s = i.elapsedHistory, c = i.timestampElapsedHistory, l = i.engineDeltaHistory, u = i.engineUpdatesHistory, f = i.engineElapsedHistory, p = n.timing.lastUpdatesPerFrame, m = n.timing.lastDelta, h = d(o), g = d(s), _ = d(l), v = d(u), y = d(f), b = d(c) / h || 0, x = Math.round(h / m), S = 1e3 / h || 0, C = 4, w = 12, T = 60, E = 34, D = 10, O = 69;
						t.fillStyle = "#0e0f19", t.fillRect(0, 50, w * 5 + T * 6 + 22, E), r.status(t, D, O, T, C, o.length, Math.round(S) + " fps", S / r._goodFps, function(e) {
							return o[e] / h - 1;
						}), r.status(t, D + w + T, O, T, C, l.length, m.toFixed(2) + " dt", r._goodDelta / m, function(e) {
							return l[e] / _ - 1;
						}), r.status(t, D + (w + T) * 2, O, T, C, u.length, p + " upf", a.clamp(v / x || 1, 0, 1) ** 4, function(e) {
							return u[e] / v - 1;
						}), r.status(t, D + (w + T) * 3, O, T, C, f.length, y.toFixed(2) + " ut", 1 - p * y / r._goodFps, function(e) {
							return f[e] / y - 1;
						}), r.status(t, D + (w + T) * 4, O, T, C, s.length, g.toFixed(2) + " rt", 1 - g / r._goodFps, function(e) {
							return s[e] / g - 1;
						}), r.status(t, D + (w + T) * 5, O, T, C, c.length, b.toFixed(2) + " x", b * b * b, function(e) {
							return (c[e] / o[e] / b || 0) - 1;
						});
					}, r.status = function(e, t, n, r, i, o, s, c, l) {
						e.strokeStyle = "#888", e.fillStyle = "#444", e.lineWidth = 1, e.fillRect(t, n + 7, r, 1), e.beginPath(), e.moveTo(t, n + 7 - i * a.clamp(.4 * l(0), -2, 2));
						for (var u = 0; u < r; u += 1) e.lineTo(t + u, n + 7 - (u < o ? i * a.clamp(.4 * l(u), -2, 2) : 0));
						e.stroke(), e.fillStyle = "hsl(" + a.clamp(25 + 95 * c, 0, 120) + ",100%,60%)", e.fillRect(t, n - 7, 4, 4), e.font = "12px Arial", e.textBaseline = "middle", e.textAlign = "right", e.fillStyle = "#eee", e.fillText(s, t + r, n - 5);
					}, r.constraints = function(e, t) {
						for (var n = t, r = 0; r < e.length; r++) {
							var i = e[r];
							if (!(!i.render.visible || !i.pointA || !i.pointB)) {
								var o = i.bodyA, s = i.bodyB, c = o ? l.add(o.position, i.pointA) : i.pointA, u;
								if (i.render.type === "pin") n.beginPath(), n.arc(c.x, c.y, 3, 0, 2 * Math.PI), n.closePath();
								else {
									if (u = s ? l.add(s.position, i.pointB) : i.pointB, n.beginPath(), n.moveTo(c.x, c.y), i.render.type === "spring") for (var d = l.sub(u, c), f = l.perp(l.normalise(d)), p = Math.ceil(a.clamp(i.length / 5, 12, 20)), m, h = 1; h < p; h += 1) m = h % 2 == 0 ? 1 : -1, n.lineTo(c.x + d.x * (h / p) + f.x * m * 4, c.y + d.y * (h / p) + f.y * m * 4);
									n.lineTo(u.x, u.y);
								}
								i.render.lineWidth && (n.lineWidth = i.render.lineWidth, n.strokeStyle = i.render.strokeStyle, n.stroke()), i.render.anchors && (n.fillStyle = i.render.strokeStyle, n.beginPath(), n.arc(c.x, c.y, 3, 0, 2 * Math.PI), n.arc(u.x, u.y, 3, 0, 2 * Math.PI), n.closePath(), n.fill());
							}
						}
					}, r.bodies = function(e, t, n) {
						var r = n;
						e.engine;
						var i = e.options, a = i.showInternalEdges || !i.wireframes, o, s, c, l;
						for (c = 0; c < t.length; c++) if (o = t[c], o.render.visible) {
							for (l = o.parts.length > 1 ? 1 : 0; l < o.parts.length; l++) if (s = o.parts[l], s.render.visible) {
								if (i.showSleeping && o.isSleeping ? r.globalAlpha = .5 * s.render.opacity : s.render.opacity !== 1 && (r.globalAlpha = s.render.opacity), s.render.sprite && s.render.sprite.texture && !i.wireframes) {
									var u = s.render.sprite, d = m(e, u.texture);
									r.translate(s.position.x, s.position.y), r.rotate(s.angle), r.drawImage(d, d.width * -u.xOffset * u.xScale, d.height * -u.yOffset * u.yScale, d.width * u.xScale, d.height * u.yScale), r.rotate(-s.angle), r.translate(-s.position.x, -s.position.y);
								} else {
									if (s.circleRadius) r.beginPath(), r.arc(s.position.x, s.position.y, s.circleRadius, 0, 2 * Math.PI);
									else {
										r.beginPath(), r.moveTo(s.vertices[0].x, s.vertices[0].y);
										for (var f = 1; f < s.vertices.length; f++) !s.vertices[f - 1].isInternal || a ? r.lineTo(s.vertices[f].x, s.vertices[f].y) : r.moveTo(s.vertices[f].x, s.vertices[f].y), s.vertices[f].isInternal && !a && r.moveTo(s.vertices[(f + 1) % s.vertices.length].x, s.vertices[(f + 1) % s.vertices.length].y);
										r.lineTo(s.vertices[0].x, s.vertices[0].y), r.closePath();
									}
									i.wireframes ? (r.lineWidth = 1, r.strokeStyle = e.options.wireframeStrokeStyle, r.stroke()) : (r.fillStyle = s.render.fillStyle, s.render.lineWidth && (r.lineWidth = s.render.lineWidth, r.strokeStyle = s.render.strokeStyle, r.stroke()), r.fill());
								}
								r.globalAlpha = 1;
							}
						}
					}, r.bodyWireframes = function(e, t, n) {
						var r = n, i = e.options.showInternalEdges, a, o, s, c, l;
						for (r.beginPath(), s = 0; s < t.length; s++) if (a = t[s], a.render.visible) for (l = a.parts.length > 1 ? 1 : 0; l < a.parts.length; l++) {
							for (o = a.parts[l], r.moveTo(o.vertices[0].x, o.vertices[0].y), c = 1; c < o.vertices.length; c++) !o.vertices[c - 1].isInternal || i ? r.lineTo(o.vertices[c].x, o.vertices[c].y) : r.moveTo(o.vertices[c].x, o.vertices[c].y), o.vertices[c].isInternal && !i && r.moveTo(o.vertices[(c + 1) % o.vertices.length].x, o.vertices[(c + 1) % o.vertices.length].y);
							r.lineTo(o.vertices[0].x, o.vertices[0].y);
						}
						r.lineWidth = 1, r.strokeStyle = e.options.wireframeStrokeStyle, r.stroke();
					}, r.bodyConvexHulls = function(e, t, n) {
						var r = n, i, a, o;
						for (r.beginPath(), a = 0; a < t.length; a++) if (i = t[a], !(!i.render.visible || i.parts.length === 1)) {
							for (r.moveTo(i.vertices[0].x, i.vertices[0].y), o = 1; o < i.vertices.length; o++) r.lineTo(i.vertices[o].x, i.vertices[o].y);
							r.lineTo(i.vertices[0].x, i.vertices[0].y);
						}
						r.lineWidth = 1, r.strokeStyle = "rgba(255,255,255,0.2)", r.stroke();
					}, r.vertexNumbers = function(e, t, n) {
						var r = n, i, a, o;
						for (i = 0; i < t.length; i++) {
							var s = t[i].parts;
							for (o = s.length > 1 ? 1 : 0; o < s.length; o++) {
								var c = s[o];
								for (a = 0; a < c.vertices.length; a++) r.fillStyle = "rgba(255,255,255,0.2)", r.fillText(i + "_" + a, c.position.x + (c.vertices[a].x - c.position.x) * .8, c.position.y + (c.vertices[a].y - c.position.y) * .8);
							}
						}
					}, r.mousePosition = function(e, t, n) {
						var r = n;
						r.fillStyle = "rgba(255,255,255,0.8)", r.fillText(t.position.x + "  " + t.position.y, t.position.x + 5, t.position.y - 5);
					}, r.bodyBounds = function(e, t, n) {
						var r = n;
						e.engine;
						var i = e.options;
						r.beginPath();
						for (var a = 0; a < t.length; a++) if (t[a].render.visible) for (var o = t[a].parts, s = o.length > 1 ? 1 : 0; s < o.length; s++) {
							var c = o[s];
							r.rect(c.bounds.min.x, c.bounds.min.y, c.bounds.max.x - c.bounds.min.x, c.bounds.max.y - c.bounds.min.y);
						}
						i.wireframes ? r.strokeStyle = "rgba(255,255,255,0.08)" : r.strokeStyle = "rgba(0,0,0,0.1)", r.lineWidth = 1, r.stroke();
					}, r.bodyAxes = function(e, t, n) {
						var r = n;
						e.engine;
						var i = e.options, a, o, s, c;
						for (r.beginPath(), o = 0; o < t.length; o++) {
							var l = t[o], u = l.parts;
							if (l.render.visible) if (i.showAxes) for (s = u.length > 1 ? 1 : 0; s < u.length; s++) for (a = u[s], c = 0; c < a.axes.length; c++) {
								var d = a.axes[c];
								r.moveTo(a.position.x, a.position.y), r.lineTo(a.position.x + d.x * 20, a.position.y + d.y * 20);
							}
							else for (s = u.length > 1 ? 1 : 0; s < u.length; s++) for (a = u[s], c = 0; c < a.axes.length; c++) r.moveTo(a.position.x, a.position.y), r.lineTo((a.vertices[0].x + a.vertices[a.vertices.length - 1].x) / 2, (a.vertices[0].y + a.vertices[a.vertices.length - 1].y) / 2);
						}
						i.wireframes ? (r.strokeStyle = "indianred", r.lineWidth = 1) : (r.strokeStyle = "rgba(255, 255, 255, 0.4)", r.globalCompositeOperation = "overlay", r.lineWidth = 2), r.stroke(), r.globalCompositeOperation = "source-over";
					}, r.bodyPositions = function(e, t, n) {
						var r = n;
						e.engine;
						var i = e.options, a, o, s, c;
						for (r.beginPath(), s = 0; s < t.length; s++) if (a = t[s], a.render.visible) for (c = 0; c < a.parts.length; c++) o = a.parts[c], r.arc(o.position.x, o.position.y, 3, 0, 2 * Math.PI, !1), r.closePath();
						for (i.wireframes ? r.fillStyle = "indianred" : r.fillStyle = "rgba(0,0,0,0.5)", r.fill(), r.beginPath(), s = 0; s < t.length; s++) a = t[s], a.render.visible && (r.arc(a.positionPrev.x, a.positionPrev.y, 2, 0, 2 * Math.PI, !1), r.closePath());
						r.fillStyle = "rgba(255,165,0,0.8)", r.fill();
					}, r.bodyVelocity = function(e, t, n) {
						var r = n;
						r.beginPath();
						for (var a = 0; a < t.length; a++) {
							var o = t[a];
							if (o.render.visible) {
								var s = i.getVelocity(o);
								r.moveTo(o.position.x, o.position.y), r.lineTo(o.position.x + s.x, o.position.y + s.y);
							}
						}
						r.lineWidth = 3, r.strokeStyle = "cornflowerblue", r.stroke();
					}, r.bodyIds = function(e, t, n) {
						var r = n, i, a;
						for (i = 0; i < t.length; i++) if (t[i].render.visible) {
							var o = t[i].parts;
							for (a = o.length > 1 ? 1 : 0; a < o.length; a++) {
								var s = o[a];
								r.font = "12px Arial", r.fillStyle = "rgba(255,255,255,0.5)", r.fillText(s.id, s.position.x + 10, s.position.y - 10);
							}
						}
					}, r.collisions = function(e, t, n) {
						var r = n, i = e.options, a, o, s, c;
						for (r.beginPath(), s = 0; s < t.length; s++) if (a = t[s], a.isActive) for (o = a.collision, c = 0; c < a.contactCount; c++) {
							var l = a.contacts[c].vertex;
							r.rect(l.x - 1.5, l.y - 1.5, 3.5, 3.5);
						}
						for (i.wireframes ? r.fillStyle = "rgba(255,255,255,0.7)" : r.fillStyle = "orange", r.fill(), r.beginPath(), s = 0; s < t.length; s++) if (a = t[s], a.isActive && (o = a.collision, a.contactCount > 0)) {
							var u = a.contacts[0].vertex.x, d = a.contacts[0].vertex.y;
							a.contactCount === 2 && (u = (a.contacts[0].vertex.x + a.contacts[1].vertex.x) / 2, d = (a.contacts[0].vertex.y + a.contacts[1].vertex.y) / 2), o.bodyB === o.supports[0].body || o.bodyA.isStatic === !0 ? r.moveTo(u - o.normal.x * 8, d - o.normal.y * 8) : r.moveTo(u + o.normal.x * 8, d + o.normal.y * 8), r.lineTo(u, d);
						}
						i.wireframes ? r.strokeStyle = "rgba(255,165,0,0.7)" : r.strokeStyle = "orange", r.lineWidth = 1, r.stroke();
					}, r.separations = function(e, t, n) {
						var r = n, i = e.options, a, o, s, c, l;
						for (r.beginPath(), l = 0; l < t.length; l++) if (a = t[l], a.isActive) {
							o = a.collision, s = o.bodyA, c = o.bodyB;
							var u = 1;
							!c.isStatic && !s.isStatic && (u = .5), c.isStatic && (u = 0), r.moveTo(c.position.x, c.position.y), r.lineTo(c.position.x - o.penetration.x * u, c.position.y - o.penetration.y * u), u = 1, !c.isStatic && !s.isStatic && (u = .5), s.isStatic && (u = 0), r.moveTo(s.position.x, s.position.y), r.lineTo(s.position.x + o.penetration.x * u, s.position.y + o.penetration.y * u);
						}
						i.wireframes ? r.strokeStyle = "rgba(255,165,0,0.5)" : r.strokeStyle = "orange", r.stroke();
					}, r.inspector = function(e, t) {
						e.engine;
						var n = e.selected, r = e.render, i = r.options, a;
						if (i.hasBounds) {
							var o = r.bounds.max.x - r.bounds.min.x, s = r.bounds.max.y - r.bounds.min.y, c = o / r.options.width, l = s / r.options.height;
							t.scale(1 / c, 1 / l), t.translate(-r.bounds.min.x, -r.bounds.min.y);
						}
						for (var u = 0; u < n.length; u++) {
							var d = n[u].data;
							switch (t.translate(.5, .5), t.lineWidth = 1, t.strokeStyle = "rgba(255,165,0,0.9)", t.setLineDash([1, 2]), d.type) {
								case "body":
									a = d.bounds, t.beginPath(), t.rect(Math.floor(a.min.x - 3), Math.floor(a.min.y - 3), Math.floor(a.max.x - a.min.x + 6), Math.floor(a.max.y - a.min.y + 6)), t.closePath(), t.stroke();
									break;
								case "constraint":
									var f = d.pointA;
									d.bodyA && (f = d.pointB), t.beginPath(), t.arc(f.x, f.y, 10, 0, 2 * Math.PI), t.closePath(), t.stroke();
									break;
							}
							t.setLineDash([]), t.translate(-.5, -.5);
						}
						e.selectStart !== null && (t.translate(.5, .5), t.lineWidth = 1, t.strokeStyle = "rgba(255,165,0,0.6)", t.fillStyle = "rgba(255,165,0,0.1)", a = e.selectBounds, t.beginPath(), t.rect(Math.floor(a.min.x), Math.floor(a.min.y), Math.floor(a.max.x - a.min.x), Math.floor(a.max.y - a.min.y)), t.closePath(), t.stroke(), t.fill(), t.translate(-.5, -.5)), i.hasBounds && t.setTransform(1, 0, 0, 1, 0, 0);
					};
					var n = function(e, t) {
						var n = e.engine, i = e.timing, a = i.historySize, o = n.timing.timestamp;
						i.delta = t - i.lastTime || r._goodDelta, i.lastTime = t, i.timestampElapsed = o - i.lastTimestamp || 0, i.lastTimestamp = o, i.deltaHistory.unshift(i.delta), i.deltaHistory.length = Math.min(i.deltaHistory.length, a), i.engineDeltaHistory.unshift(n.timing.lastDelta), i.engineDeltaHistory.length = Math.min(i.engineDeltaHistory.length, a), i.timestampElapsedHistory.unshift(i.timestampElapsed), i.timestampElapsedHistory.length = Math.min(i.timestampElapsedHistory.length, a), i.engineUpdatesHistory.unshift(n.timing.lastUpdatesPerFrame), i.engineUpdatesHistory.length = Math.min(i.engineUpdatesHistory.length, a), i.engineElapsedHistory.unshift(n.timing.lastElapsed), i.engineElapsedHistory.length = Math.min(i.engineElapsedHistory.length, a), i.elapsedHistory.unshift(i.lastElapsed), i.elapsedHistory.length = Math.min(i.elapsedHistory.length, a);
					}, d = function(e) {
						for (var t = 0, n = 0; n < e.length; n += 1) t += e[n];
						return t / e.length || 0;
					}, f = function(e, t) {
						var n = document.createElement("canvas");
						return n.width = e, n.height = t, n.oncontextmenu = function() {
							return !1;
						}, n.onselectstart = function() {
							return !1;
						}, n;
					}, p = function(e) {
						var t = e.getContext("2d");
						return (window.devicePixelRatio || 1) / (t.webkitBackingStorePixelRatio || t.mozBackingStorePixelRatio || t.msBackingStorePixelRatio || t.oBackingStorePixelRatio || t.backingStorePixelRatio || 1);
					}, m = function(e, t) {
						var n = e.textures[t];
						return n || (n = e.textures[t] = new Image(), n.src = t, n);
					}, h = function(e, t) {
						var n = t;
						/(jpg|gif|png)$/.test(t) && (n = "url(" + t + ")"), e.canvas.style.background = n, e.canvas.style.backgroundSize = "contain", e.currentBackground = t;
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(5), a = n(17), o = n(0);
				(function() {
					r._maxFrameDelta = 1e3 / 15, r._frameDeltaFallback = 1e3 / 60, r._timeBufferMargin = 1.5, r._elapsedNextEstimate = 1, r._smoothingLowerBound = .1, r._smoothingUpperBound = .9, r.create = function(e) {
						var t = o.extend({
							delta: 1e3 / 60,
							frameDelta: null,
							frameDeltaSmoothing: !0,
							frameDeltaSnapping: !0,
							frameDeltaHistory: [],
							frameDeltaHistorySize: 100,
							frameRequestId: null,
							timeBuffer: 0,
							timeLastTick: null,
							maxUpdates: null,
							maxFrameTime: 1e3 / 30,
							lastUpdatesDeferred: 0,
							enabled: !0
						}, e);
						return t.fps = 0, t;
					}, r.run = function(e, t) {
						return e.timeBuffer = r._frameDeltaFallback, (function n(i) {
							e.frameRequestId = r._onNextFrame(e, n), i && e.enabled && r.tick(e, t, i);
						})(), e;
					}, r.tick = function(t, n, s) {
						var c = o.now(), l = t.delta, u = 0, d = s - t.timeLastTick;
						if ((!d || !t.timeLastTick || d > Math.max(r._maxFrameDelta, t.maxFrameTime)) && (d = t.frameDelta || r._frameDeltaFallback), t.frameDeltaSmoothing) {
							t.frameDeltaHistory.push(d), t.frameDeltaHistory = t.frameDeltaHistory.slice(-t.frameDeltaHistorySize);
							var f = t.frameDeltaHistory.slice(0).sort();
							d = e(t.frameDeltaHistory.slice(f.length * r._smoothingLowerBound, f.length * r._smoothingUpperBound)) || d;
						}
						t.frameDeltaSnapping && (d = 1e3 / Math.round(1e3 / d)), t.frameDelta = d, t.timeLastTick = s, t.timeBuffer += t.frameDelta, t.timeBuffer = o.clamp(t.timeBuffer, 0, t.frameDelta + l * r._timeBufferMargin), t.lastUpdatesDeferred = 0;
						var p = t.maxUpdates || Math.ceil(t.maxFrameTime / l), m = { timestamp: n.timing.timestamp };
						i.trigger(t, "beforeTick", m), i.trigger(t, "tick", m);
						for (var h = o.now(); l > 0 && t.timeBuffer >= l * r._timeBufferMargin;) {
							i.trigger(t, "beforeUpdate", m), a.update(n, l), i.trigger(t, "afterUpdate", m), t.timeBuffer -= l, u += 1;
							var g = o.now() - c, _ = o.now() - h, v = g + r._elapsedNextEstimate * _ / u;
							if (u >= p || v > t.maxFrameTime) {
								t.lastUpdatesDeferred = Math.round(Math.max(0, t.timeBuffer / l - r._timeBufferMargin));
								break;
							}
						}
						n.timing.lastUpdatesPerFrame = u, i.trigger(t, "afterTick", m), t.frameDeltaHistory.length >= 100 && (t.lastUpdatesDeferred && Math.round(t.frameDelta / l) > p ? o.warnOnce("Matter.Runner: runner reached runner.maxUpdates, see docs.") : t.lastUpdatesDeferred && o.warnOnce("Matter.Runner: runner reached runner.maxFrameTime, see docs."), t.isFixed !== void 0 && o.warnOnce("Matter.Runner: runner.isFixed is now redundant, see docs."), (t.deltaMin || t.deltaMax) && o.warnOnce("Matter.Runner: runner.deltaMin and runner.deltaMax were removed, see docs."), t.fps !== 0 && o.warnOnce("Matter.Runner: runner.fps was replaced by runner.delta, see docs."));
					}, r.stop = function(e) {
						r._cancelNextFrame(e);
					}, r._onNextFrame = function(e, t) {
						if (typeof window < "u" && window.requestAnimationFrame) e.frameRequestId = window.requestAnimationFrame(t);
						else throw Error("Matter.Runner: missing required global window.requestAnimationFrame.");
						return e.frameRequestId;
					}, r._cancelNextFrame = function(e) {
						if (typeof window < "u" && window.cancelAnimationFrame) window.cancelAnimationFrame(e.frameRequestId);
						else throw Error("Matter.Runner: missing required global window.cancelAnimationFrame.");
					};
					var e = function(e) {
						for (var t = 0, n = e.length, r = 0; r < n; r += 1) t += e[r];
						return t / n || 0;
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(8), a = n(0).deprecated;
				(function() {
					r.collides = function(e, t) {
						return i.collides(e, t);
					}, a(r, "collides", "SAT.collides ➤ replaced by Collision.collides");
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r, n(1);
				var i = n(0);
				(function() {
					r.pathToVertices = function(e, t) {
						typeof window < "u" && !("SVGPathSeg" in window) && i.warn("Svg.pathToVertices: SVGPathSeg not defined, a polyfill is required.");
						var n, a, o, s, c, l, u, d, f, p, m = [], h, g, _ = 0, v = 0, y = 0;
						t ||= 15;
						var b = function(e, t, n) {
							var r = n % 2 == 1 && n > 1;
							if (!f || e != f.x || t != f.y) {
								f && r ? (h = f.x, g = f.y) : (h = 0, g = 0);
								var i = {
									x: h + e,
									y: g + t
								};
								(r || !f) && (f = i), m.push(i), v = h + e, y = g + t;
							}
						}, x = function(e) {
							var t = e.pathSegTypeAsLetter.toUpperCase();
							if (t !== "Z") {
								switch (t) {
									case "M":
									case "L":
									case "T":
									case "C":
									case "S":
									case "Q":
										v = e.x, y = e.y;
										break;
									case "H":
										v = e.x;
										break;
									case "V":
										y = e.y;
										break;
								}
								b(v, y, e.pathSegType);
							}
						};
						for (r._svgPathToAbsolute(e), o = e.getTotalLength(), l = [], n = 0; n < e.pathSegList.numberOfItems; n += 1) l.push(e.pathSegList.getItem(n));
						for (u = l.concat(); _ < o;) {
							if (p = e.getPathSegAtLength(_), c = l[p], c != d) {
								for (; u.length && u[0] != c;) x(u.shift());
								d = c;
							}
							switch (c.pathSegTypeAsLetter.toUpperCase()) {
								case "C":
								case "T":
								case "S":
								case "Q":
								case "A":
									s = e.getPointAtLength(_), b(s.x, s.y, 0);
									break;
							}
							_ += t;
						}
						for (n = 0, a = u.length; n < a; ++n) x(u[n]);
						return m;
					}, r._svgPathToAbsolute = function(e) {
						for (var t, n, r, i, a, o, s = e.pathSegList, c = 0, l = 0, u = s.numberOfItems, d = 0; d < u; ++d) {
							var f = s.getItem(d), p = f.pathSegTypeAsLetter;
							if (/[MLHVCSQTA]/.test(p)) "x" in f && (c = f.x), "y" in f && (l = f.y);
							else switch ("x1" in f && (r = c + f.x1), "x2" in f && (a = c + f.x2), "y1" in f && (i = l + f.y1), "y2" in f && (o = l + f.y2), "x" in f && (c += f.x), "y" in f && (l += f.y), p) {
								case "m":
									s.replaceItem(e.createSVGPathSegMovetoAbs(c, l), d);
									break;
								case "l":
									s.replaceItem(e.createSVGPathSegLinetoAbs(c, l), d);
									break;
								case "h":
									s.replaceItem(e.createSVGPathSegLinetoHorizontalAbs(c), d);
									break;
								case "v":
									s.replaceItem(e.createSVGPathSegLinetoVerticalAbs(l), d);
									break;
								case "c":
									s.replaceItem(e.createSVGPathSegCurvetoCubicAbs(c, l, r, i, a, o), d);
									break;
								case "s":
									s.replaceItem(e.createSVGPathSegCurvetoCubicSmoothAbs(c, l, a, o), d);
									break;
								case "q":
									s.replaceItem(e.createSVGPathSegCurvetoQuadraticAbs(c, l, r, i), d);
									break;
								case "t":
									s.replaceItem(e.createSVGPathSegCurvetoQuadraticSmoothAbs(c, l), d);
									break;
								case "a":
									s.replaceItem(e.createSVGPathSegArcAbs(c, l, f.r1, f.r2, f.angle, f.largeArcFlag, f.sweepFlag), d);
									break;
								case "z":
								case "Z":
									c = t, l = n;
									break;
							}
							(p == "M" || p == "m") && (t = c, n = l);
						}
					};
				})();
			}),
			(function(e, t, n) {
				var r = {};
				e.exports = r;
				var i = n(6);
				n(0), (function() {
					r.create = i.create, r.add = i.add, r.remove = i.remove, r.clear = i.clear, r.addComposite = i.addComposite, r.addBody = i.addBody, r.addConstraint = i.addConstraint;
				})();
			})
		]);
	});
})))(), 1), de = "./assets/";
function fe(e) {
	if (typeof e != "string" || e.trim().length === 0) return null;
	try {
		return new URL(e, document.baseURI).toString();
	} catch {
		return e;
	}
}
function B() {
	if (typeof document > "u") return de;
	let e = document.currentScript;
	if (e?.src) return new URL(de, e.src).toString();
	let t = Array.from(document.scripts || []).reverse().find((e) => {
		if (!e.src) return !1;
		try {
			let t = new URL(e.src, document.baseURI).pathname;
			return /sisyphus-widget(?:\.umd)?\.(?:cjs|js)$/.test(t);
		} catch {
			return e.src.includes("sisyphus-widget");
		}
	});
	return t?.src ? new URL(de, t.src).toString() : new URL(de, document.baseURI).toString();
}
function pe(e) {
	return fe(e.assetBaseUrl) || B();
}
function me(e, t = {}) {
	let { Engine: n, Render: r, Runner: i, Bodies: a, Body: o, Composite: s, Events: c, Query: l, Sleeping: u, Vertices: d } = ue.default, f = e.clientWidth || window.innerWidth, h = e.clientHeight || window.innerHeight, g = () => Math.min(window.devicePixelRatio || 1, 2), _ = 1e3, b = 1020, S = Math.hypot(700, 312);
	700 / S, -(312 / S);
	let C = Math.hypot(20, 80);
	20 / C, 80 / C;
	let E = .082, O = {
		bg: "transparent",
		rock: "#c79a68",
		rockEdge: "#8b6543",
		sisyphus: "#d36f53",
		sisyphusEdge: "#9c4635"
	};
	Math.PI * 2;
	function k(e, t, n) {
		return Math.max(t, Math.min(e, n));
	}
	function ee(e, t, n) {
		if (e === t) return n < e ? 0 : 1;
		let r = k((n - e) / (t - e), 0, 1);
		return r * r * (3 - 2 * r);
	}
	function j(e) {
		let t = e >>> 0;
		return function() {
			return t = t * 1664525 + 1013904223 >>> 0, t / 4294967296;
		};
	}
	let M = j(20260315), N = [], P = 0, R = 0, oe = 0, se = 0, z = 0, ce = 0, de = 0, fe = 0, B = !1, me = Object.freeze([
		Object.freeze({
			progress: .32,
			durationMs: 5200
		}),
		Object.freeze({
			progress: .62,
			durationMs: 5800
		}),
		Object.freeze({
			progress: .84,
			durationMs: 6500
		})
	]), he = 0, ge = 0, _e = [], ve = !1, ye = 0, V = Object.freeze({
		PLAYING: "playing",
		SUMMIT: "summit",
		SIS_DESCENDING: "sis_descending",
		WAITING: "waiting"
	}), be = null, xe = 0, H = Object.freeze({
		OVERVIEW: "overview",
		FREE_PAN: "free_pan",
		FOCUS_SISYPHUS: "focus_sisyphus"
	}), Se = Object.freeze({
		OVERVIEW: H.OVERVIEW,
		FOCUS_SISYPHUS: H.FOCUS_SISYPHUS
	}), U = {
		behavior: H.OVERVIEW,
		presetId: Se.OVERVIEW,
		freePanX: 900 / 2,
		freePanY: 560 / 2
	}, W = {
		x: 900 / 2,
		y: 560 / 2,
		zoom: 1
	}, G = {
		x: 900 / 2,
		y: 560 / 2,
		zoom: 1
	}, Ce = {
		active: !1,
		moved: !1,
		startClientX: 0,
		startClientY: 0,
		startCameraX: 900 / 2,
		startCameraY: 560 / 2
	}, we = Object.freeze({
		minX: -20,
		maxX: b + 24,
		minY: 24,
		maxY: 548
	}), Te = Object.freeze({
		moonGlowScale: 1,
		moonGlowAlpha: 1,
		moonAlpha: .9,
		moonRadius: 28,
		mistAlphaMultiplier: 1,
		hazeAlphaBoost: 0,
		distantParallaxMultiplier: 1,
		distantMountainAlpha: 1
	}), Ee = Object.freeze({
		moonGlowScale: 1.08,
		moonGlowAlpha: 1.2,
		moonAlpha: .92,
		moonRadius: 30,
		mistAlphaMultiplier: 1.2,
		hazeAlphaBoost: .06,
		distantParallaxMultiplier: 1.08,
		distantMountainAlpha: .95
	}), De = Object.freeze({
		moonGlowScale: .9,
		moonGlowAlpha: .84,
		moonAlpha: .78,
		moonRadius: 26,
		mistAlphaMultiplier: 1.1,
		hazeAlphaBoost: .03,
		distantParallaxMultiplier: .92,
		distantMountainAlpha: .82
	}), Oe = m(p({
		masterGain: .26,
		windGain: .15,
		frictionGain: .2,
		breathGain: .17,
		impactGain: .27,
		enableSampleLayer: !1,
		sampleBlend: 0,
		samples: {
			wind: "",
			friction: ""
		}
	})), ke = v(), Ae = 0, je = F.SOBRIO, Me = 0, Ne = 0, Pe = 0, Fe = 60, Ie = le({ isMobile: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) }), K = Object.freeze({
		FAR: "far",
		MID: "mid",
		CLOSE: "close"
	}), Le = { level: K.FAR }, Re = Object.freeze({ DEFAULT: "default" }), ze = Object.freeze({ [Re.DEFAULT]: Object.freeze({
		transform: "translate3d(0, 0, 0) scaleX(1) scaleY(1)",
		transformOrigin: "50% 50%"
	}) }), Be = Re.DEFAULT;
	function Ve(e) {
		if (e === H.OVERVIEW) {
			ct(Se.OVERVIEW);
			return;
		}
		if (e === H.FOCUS_SISYPHUS) {
			ct(Se.FOCUS_SISYPHUS);
			return;
		}
		U.behavior = e;
	}
	function He(e) {
		return We(e);
	}
	function Ue(e) {
		return e ? {
			[K.FAR]: 2.016,
			[K.MID]: 2.688,
			[K.CLOSE]: 3.64
		} : {
			[K.FAR]: 1.848,
			[K.MID]: 2.408,
			[K.CLOSE]: 3.248
		};
	}
	function We(e) {
		let t = Ue(e);
		return t[Le.level] || t[K.FAR];
	}
	function Ge(e) {
		let t = Ue(e), n = Object.values(t);
		return {
			min: Math.min(...n) - .06,
			max: Math.max(...n) + .18
		};
	}
	function Ke(e) {
		return e === K.FAR ? "LEJANO" : e === K.MID ? "MEDIO" : "CERCANO";
	}
	function qe() {
		if (Le.level === K.FAR) {
			Le.level = K.MID;
			return;
		}
		if (Le.level === K.MID) {
			Le.level = K.CLOSE;
			return;
		}
		Le.level = K.FAR;
	}
	function Je() {
		qe(), Ve(H.FREE_PAN);
		let e = We(window.innerHeight > window.innerWidth);
		Ze(W.x, W.y, e), fe = performance.now() + 1200, console.log(`%cZoom activo: ${Ke(Le.level)}`, "color:#a2d2ff;font-weight:bold");
	}
	function Ye(e, t = we) {
		let n = Math.max(e, .001), r = f / n, i = h / n, a = t.minX + r / 2, o = t.maxX - r / 2, s = t.minY + i / 2, c = t.maxY - i / 2;
		if (a > o) {
			let e = (t.minX + t.maxX) / 2;
			a = e, o = e;
		}
		if (s > c) {
			let e = (t.minY + t.maxY) / 2;
			s = e, c = e;
		}
		return {
			minX: a,
			maxX: o,
			minY: s,
			maxY: c
		};
	}
	function Xe(e, t, n, r = we) {
		let i = Ye(n, r);
		return {
			x: k(e, i.minX, i.maxX),
			y: k(t, i.minY, i.maxY)
		};
	}
	function Ze(e, t, n) {
		let r = Xe(e, t, n, we);
		return U.freePanX = r.x, U.freePanY = r.y, r;
	}
	function Qe(e, t) {
		Ce.active = !0, Ce.moved = !1, Ce.startClientX = e, Ce.startClientY = t, Ce.startCameraX = W.x, Ce.startCameraY = W.y;
	}
	function $e() {
		Ce.active = !1, Ce.moved = !1;
	}
	function et() {
		return k((X.position.x - wn) / Math.max(1, Cn - wn), 0, 1);
	}
	function tt() {
		let e = Z.position, t = X.position, n = window.innerHeight > window.innerWidth, r = (e.x + t.x) / 2, i = (e.y + t.y) / 2, a = Math.abs(t.x - e.x), o = Math.abs(t.y - e.y), s = et(), c = Math.max(nn(Z), nn(X)), l = Q === V.PLAYING && vn;
		return {
			sisCenter: e,
			rockCenter: t,
			portraitView: n,
			duoCenterX: r,
			duoCenterY: i,
			distanceX: a,
			distanceY: o,
			ascentProgress: s,
			duoSpeed: c,
			leadX: l ? oe : k(Z.velocity.x * 68 + X.velocity.x * 34, -90, 110),
			leadY: l ? se : k(Z.velocity.y * 24 + X.velocity.y * 16, -54, 62)
		};
	}
	function nt(e) {
		let t = We(e.portraitView);
		return Q === V.WAITING ? {
			x: wn + 100,
			y: 370,
			zoom: t
		} : {
			x: e.duoCenterX + 18 + e.leadX + e.ascentProgress * 10,
			y: e.duoCenterY - 30 + e.leadY * .15 - e.ascentProgress * 28,
			zoom: t
		};
	}
	function rt(e) {
		return {
			x: e.duoCenterX + e.leadX * .22,
			y: e.duoCenterY - 24 + e.leadY * .18,
			zoom: We(e.portraitView)
		};
	}
	let it = T({
		[Se.OVERVIEW]: w({
			id: Se.OVERVIEW,
			behavior: H.OVERVIEW,
			followMode: "duo_overview",
			boundsResolver: () => we,
			lerpSpeed: .08,
			targetResolver: nt,
			visualProfile: Te,
			zoomMinResolver: (e) => e.portraitView ? 1.736 : 1.568,
			zoomMaxResolver: (e) => e.portraitView ? 3.024 : 3.36
		}),
		[Se.FOCUS_SISYPHUS]: w({
			id: Se.FOCUS_SISYPHUS,
			behavior: H.FOCUS_SISYPHUS,
			followMode: "duo_focus",
			boundsResolver: () => we,
			lerpSpeed: .12,
			targetResolver: rt,
			visualProfile: Te,
			zoomMinResolver: (e) => e.portraitView ? 2.016 : 1.792,
			zoomMaxResolver: (e) => e.portraitView ? 4.424 : 4.2
		})
	}, Se.OVERVIEW), at = Object.freeze({
		[V.SUMMIT]: w({
			id: "state::summit",
			behavior: H.OVERVIEW,
			followMode: "state_summit",
			boundsResolver: () => we,
			lerpSpeed: .09,
			targetResolver: xt,
			visualProfile: Ee,
			zoomMinResolver: () => 1.568,
			zoomMaxResolver: () => 3.36
		}),
		[V.SIS_DESCENDING]: w({
			id: "state::descending",
			behavior: H.OVERVIEW,
			followMode: "state_descending",
			boundsResolver: () => we,
			lerpSpeed: .1,
			targetResolver: St,
			visualProfile: De,
			zoomMinResolver: () => 1.568,
			zoomMaxResolver: () => 3.08
		})
	}), ot = ie([
		re({
			id: ae(F.SOBRIO, I.WAITING),
			style: F.SOBRIO,
			mood: I.WAITING,
			stack: L,
			grade: {
				washAlpha: .08,
				vignetteAlpha: .36,
				contrastLift: .1
			},
			fog: {
				nearAlpha: .04,
				farAlpha: .1,
				depthBias: .6
			},
			grain: {
				baseAlpha: .028,
				motionBoost: .03,
				density: 22
			},
			contactShadow: {
				alphaMul: 1,
				spreadMul: 1
			},
			sceneFx: {
				hazeBoost: .04,
				glowBoost: .06
			}
		}),
		re({
			id: ae(F.SOBRIO, I.ASCENT),
			style: F.SOBRIO,
			mood: I.ASCENT,
			stack: L,
			grade: {
				washAlpha: .09,
				vignetteAlpha: .4,
				contrastLift: .14
			},
			fog: {
				nearAlpha: .05,
				farAlpha: .14,
				depthBias: .68
			},
			grain: {
				baseAlpha: .034,
				motionBoost: .05,
				density: 26
			},
			contactShadow: {
				alphaMul: 1.06,
				spreadMul: 1.04
			},
			sceneFx: {
				hazeBoost: .07,
				glowBoost: .1
			}
		}),
		re({
			id: ae(F.SOBRIO, I.IMPACT),
			style: F.SOBRIO,
			mood: I.IMPACT,
			stack: L,
			grade: {
				washAlpha: .12,
				vignetteAlpha: .5,
				contrastLift: .2
			},
			fog: {
				nearAlpha: .06,
				farAlpha: .18,
				depthBias: .74
			},
			grain: {
				baseAlpha: .046,
				motionBoost: .08,
				density: 30
			},
			contactShadow: {
				alphaMul: 1.18,
				spreadMul: 1.08
			},
			sceneFx: {
				hazeBoost: .11,
				glowBoost: .16
			}
		}),
		re({
			id: ae(F.SOBRIO, I.DESCENT),
			style: F.SOBRIO,
			mood: I.DESCENT,
			stack: L,
			grade: {
				washAlpha: .07,
				vignetteAlpha: .34,
				contrastLift: .08
			},
			fog: {
				nearAlpha: .045,
				farAlpha: .11,
				depthBias: .64
			},
			grain: {
				baseAlpha: .032,
				motionBoost: .03,
				density: 24
			},
			contactShadow: {
				alphaMul: .96,
				spreadMul: 1.02
			},
			sceneFx: {
				hazeBoost: .05,
				glowBoost: .05
			}
		}),
		re({
			id: ae(F.EXPRESIONISTA, I.WAITING),
			style: F.EXPRESIONISTA,
			mood: I.WAITING,
			stack: L,
			grade: {
				washAlpha: .11,
				vignetteAlpha: .44,
				contrastLift: .16
			},
			fog: {
				nearAlpha: .05,
				farAlpha: .15,
				depthBias: .7
			},
			grain: {
				baseAlpha: .05,
				motionBoost: .08,
				density: 28
			},
			contactShadow: {
				alphaMul: 1.2,
				spreadMul: 1.1
			},
			sceneFx: {
				hazeBoost: .1,
				glowBoost: .18
			}
		}),
		re({
			id: ae(F.EXPRESIONISTA, I.ASCENT),
			style: F.EXPRESIONISTA,
			mood: I.ASCENT,
			stack: L,
			grade: {
				washAlpha: .13,
				vignetteAlpha: .56,
				contrastLift: .26
			},
			fog: {
				nearAlpha: .06,
				farAlpha: .2,
				depthBias: .76
			},
			grain: {
				baseAlpha: .062,
				motionBoost: .1,
				density: 34
			},
			contactShadow: {
				alphaMul: 1.3,
				spreadMul: 1.14
			},
			sceneFx: {
				hazeBoost: .13,
				glowBoost: .24
			}
		}),
		re({
			id: ae(F.EXPRESIONISTA, I.IMPACT),
			style: F.EXPRESIONISTA,
			mood: I.IMPACT,
			stack: L,
			grade: {
				washAlpha: .16,
				vignetteAlpha: .64,
				contrastLift: .34
			},
			fog: {
				nearAlpha: .07,
				farAlpha: .24,
				depthBias: .82
			},
			grain: {
				baseAlpha: .074,
				motionBoost: .12,
				density: 38
			},
			contactShadow: {
				alphaMul: 1.38,
				spreadMul: 1.2
			},
			sceneFx: {
				hazeBoost: .16,
				glowBoost: .3
			}
		}),
		re({
			id: ae(F.EXPRESIONISTA, I.DESCENT),
			style: F.EXPRESIONISTA,
			mood: I.DESCENT,
			stack: L,
			grade: {
				washAlpha: .1,
				vignetteAlpha: .48,
				contrastLift: .16
			},
			fog: {
				nearAlpha: .052,
				farAlpha: .16,
				depthBias: .68
			},
			grain: {
				baseAlpha: .052,
				motionBoost: .06,
				density: 30
			},
			contactShadow: {
				alphaMul: 1.18,
				spreadMul: 1.12
			},
			sceneFx: {
				hazeBoost: .09,
				glowBoost: .14
			}
		})
	], ae(F.SOBRIO, I.ASCENT));
	function st(e) {
		return it.get(e);
	}
	function ct(e) {
		let t = st(e);
		U.presetId = t.id, U.behavior = t.behavior;
	}
	function lt() {
		return st(U.presetId);
	}
	function ut() {
		return at[Q] || null;
	}
	function dt() {
		return ut() || lt();
	}
	function ft(e) {
		if (U.behavior === H.FREE_PAN) return we;
		let t = dt();
		return t.boundsResolver ? t.boundsResolver(e) : we;
	}
	function pt() {
		return U.behavior === H.FREE_PAN ? Te : dt().visualProfile || Te;
	}
	function mt() {
		return Q === V.SUMMIT ? I.IMPACT : Q === V.SIS_DESCENDING ? I.DESCENT : Q === V.WAITING ? I.WAITING : Pe > .2 ? I.IMPACT : I.ASCENT;
	}
	function ht() {
		let e = mt();
		return ot.getByStyleAndMood(je, e);
	}
	function gt(e) {
		let t = Ge(e.portraitView), n = ut();
		if (n) {
			let t = n.zoomMinResolver(e), r = n.zoomMaxResolver(e);
			return {
				min: t,
				max: Math.max(t + .02, r)
			};
		}
		if (U.behavior === H.FREE_PAN) return t;
		let r = dt(), i = Math.max(t.min, r.zoomMinResolver(e)), a = Math.min(t.max, r.zoomMaxResolver(e));
		return {
			min: i,
			max: Math.max(i + .02, a)
		};
	}
	function _t() {
		return Re.DEFAULT;
	}
	function vt(e) {
		if (Be === e) return;
		let t = ze[e] || ze[Re.DEFAULT];
		Be = e;
		for (let e of [At, jt]) e.style.transformOrigin = t.transformOrigin, e.style.transform = t.transform;
	}
	function yt() {
		Je();
	}
	function bt() {
		je = je === F.SOBRIO ? F.EXPRESIONISTA : F.SOBRIO, Me = performance.now() + 1400, console.log(`%cEstilo visual: ${je}`, "color:#f9d29d;font-weight:bold");
	}
	function xt(e) {
		let t = nn(X);
		return e.rockCenter.x >= 932 ? {
			x: 912,
			y: 116,
			zoom: 2.128
		} : {
			x: e.rockCenter.x + k(X.velocity.x * 62, -120, 60),
			y: e.rockCenter.y - 118 + k(X.velocity.y * 18, -48, 42),
			zoom: k((e.portraitView ? 2.464 : 2.184) - t * .084, 1.624, 2.632)
		};
	}
	function St(e) {
		let t = ee(wn + 70, 820, e.sisCenter.x);
		return {
			x: Gt(wn + 96, e.sisCenter.x + 42, t),
			y: Gt(368, e.sisCenter.y - 110, t),
			zoom: Gt(e.portraitView ? 2.576 : 2.352, e.portraitView ? 2.8 : 2.52, t)
		};
	}
	function Ct() {
		let e = tt();
		if (U.behavior === H.FREE_PAN) {
			let t = He(e.portraitView), n = Ze(U.freePanX, U.freePanY, t);
			G.x = n.x, G.y = n.y, G.zoom = t;
		} else {
			let t = dt();
			Object.assign(G, t.targetResolver(e));
		}
		let t = gt(e);
		G.zoom = k(G.zoom, t.min, t.max);
		let n = Xe(G.x, G.y, G.zoom, ft(e));
		G.x = n.x, G.y = n.y, vt(_t());
	}
	function wt() {
		return Ce.active ? .34 : U.behavior === H.FREE_PAN ? .22 : dt().lerpSpeed;
	}
	function Tt(e) {
		let t = e / 16.6667, n = 1 - (1 - wt()) ** t;
		W.x += (G.x - W.x) * n, W.y += (G.y - W.y) * n, W.zoom += (G.zoom - W.zoom) * n;
		let i = 16 * R * R, a = P * .018, o = Math.sin(a * 1.7 + .6) * i, s = Math.cos(a * 2.1 + 1.1) * i * .68, c = f / W.zoom, l = h / W.zoom;
		r.lookAt(Y, {
			min: {
				x: W.x + o - c / 2,
				y: W.y + s - l / 2
			},
			max: {
				x: W.x + o + c / 2,
				y: W.y + s + l / 2
			}
		});
	}
	let q = Object.freeze({
		TERRAIN: 1,
		SISYPHUS: 2,
		ROCK: 4
	}), Et = q.SISYPHUS | q.ROCK, Dt = q.TERRAIN | q.ROCK, Ot = q.TERRAIN | q.SISYPHUS, kt = q.TERRAIN, At = document.createElement("canvas");
	At.id = "scene-canvas", At.setAttribute("aria-hidden", "true"), At.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%;z-index:0;pointer-events:none;", e.appendChild(At);
	let jt = document.createElement("canvas");
	jt.id = "game-canvas", jt.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%;z-index:1;background:transparent;", e.appendChild(jt);
	let Mt = At.getContext("2d");
	async function Nt() {
		try {
			let e = pe(t);
			if (!e) return;
			await y(ke, new URL("./overlays/manifest.json", e)), console.log("%cOverlays externos cargados", "color:#cfe8b3;font-weight:bold");
		} catch (e) {
			console.warn("No se pudo cargar el manifiesto de overlays externos.", e);
		}
	}
	for (let e of [At, jt]) e.style.transition = "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)", e.style.transform = "translate3d(0, 0, 0) scaleX(1) scaleY(1)", e.style.transformOrigin = "50% 50%";
	let J = n.create({ gravity: {
		x: 0,
		y: 1
	} }), Y = r.create({
		canvas: jt,
		engine: J,
		options: {
			width: f,
			height: h,
			wireframes: !1,
			background: O.bg,
			pixelRatio: g()
		}
	}), Pt = a.rectangle(900 / 2, 540, 1020, 40, {
		isStatic: !0,
		collisionFilter: {
			category: q.TERRAIN,
			mask: Et
		},
		render: { visible: !1 },
		label: "ground"
	}), Ft = a.rectangle(-60 / 2, 560 / 2, 60, 560, {
		isStatic: !0,
		restitution: .1,
		friction: .1,
		collisionFilter: {
			category: q.TERRAIN,
			mask: Et
		},
		render: { visible: !1 },
		label: "wall-left"
	}), It = a.rectangle(930, 560 / 2, 60, 560, {
		isStatic: !0,
		collisionFilter: {
			category: q.TERRAIN,
			mask: Et
		},
		render: { visible: !1 },
		label: "wall-right"
	}), Lt = a.rectangle(900 / 2, -60 / 2, 1020, 60, {
		isStatic: !0,
		collisionFilter: {
			category: q.TERRAIN,
			mask: Et
		},
		render: { visible: !1 },
		label: "wall-top"
	}), Rt = a.rectangle(40, 660, 150, 20, {
		isStatic: !0,
		angle: 0,
		restitution: 0,
		friction: 0,
		collisionFilter: {
			category: q.TERRAIN,
			mask: 0
		},
		render: { visible: !1 },
		label: "bumper"
	}), zt = [
		{
			x: 140,
			y: 520
		},
		{
			x: 170,
			y: Wt(170)
		},
		{
			x: 310,
			y: Wt(310)
		},
		{
			x: 470,
			y: Wt(470)
		},
		{
			x: 840,
			y: 208
		},
		{
			x: 940,
			y: 206
		},
		{
			x: 960,
			y: 220
		},
		{
			x: 980,
			y: 300
		},
		{
			x: _,
			y: 520
		},
		{
			x: b,
			y: 520
		}
	], Bt = [
		{
			x: 132,
			y: 780
		},
		...zt,
		{
			x: b + 28,
			y: 780
		}
	], Vt = d.centre(Bt), Ht = Bt.map((e) => ({
		x: e.x - Vt.x,
		y: e.y - Vt.y
	})), Ut = a.fromVertices(Vt.x, Vt.y, [Ht], {
		isStatic: !0,
		friction: .1,
		restitution: 0,
		collisionFilter: {
			category: q.TERRAIN,
			mask: Et
		},
		render: { visible: !1 },
		label: "mountain"
	}, !0);
	function Wt(e) {
		return 520 - (e - 140) / 700 * 312;
	}
	function Gt(e, t, n) {
		return e + (t - e) * n;
	}
	function Kt(e, t, n, r, i) {
		return r === t ? n : Gt(n, i, (e - t) / (r - t));
	}
	function qt(e) {
		let t = zt[0];
		if (e <= t.x) return t.y;
		for (let t = 1; t < zt.length; t += 1) {
			let n = zt[t - 1], r = zt[t];
			if (e <= r.x) return Kt(e, n.x, n.y, r.x, r.y);
		}
		return zt[zt.length - 1].y;
	}
	function Jt() {
		f = e.clientWidth || window.innerWidth, h = e.clientHeight || window.innerHeight;
		let t = g();
		At.width = f * t, At.height = h * t, At.style.width = `${f}px`, At.style.height = `${h}px`, Y.options.width = f, Y.options.height = h, Y.options.pixelRatio = t, Y.canvas.width = f * t, Y.canvas.height = h * t, Y.canvas.style.width = `${f}px`, Y.canvas.style.height = `${h}px`, Ze(U.freePanX, U.freePanY, He(h > f));
	}
	let Yt = A({
		LOGICAL_W: 900,
		LOGICAL_H: 560,
		SURF_Y: 520,
		PEAK_A_X: 840,
		PEAK_A_Y: 208,
		PEAK_B_X: 940,
		PEAK_B_Y: 206,
		RIGHT_DESCENT_MID_X: 980,
		RIGHT_DESCENT_MID_Y: 300,
		RIGHT_DESCENT_LOW_X: _,
		RIGHT_DESCENT_LOW_Y: 520,
		RIGHT_FACE_BASE_X: b,
		slopeYAt: Wt,
		terrainYAt: qt,
		TERRAIN_SURFACE_POINTS: zt
	}), Xt = te({ createSeededRandom: j });
	function Zt(e) {
		Xt.drawRock(e, X, pn);
	}
	let Qt = ne({
		GAME_STATE: V,
		PEAK_A_X: 840
	});
	function $t(e) {
		let t = typeof $?.getBalanceState == "function" ? $.getBalanceState() : null;
		Qt.drawSisyphus(e, {
			sisyphusBody: Z,
			gameState: Q,
			lastGameState: be,
			stateTransitionTimer: xe,
			STATE_TRANSITION_MAX: 450,
			isPushing: vn,
			sceneTime: P,
			balanceState: t,
			windActive: B
		});
	}
	function en() {
		let e = Y.bounds.min.x, t = Y.bounds.min.y, n = pt(), r = ht();
		Mt.save(), Mt.setTransform(1, 0, 0, 1, 0, 0), Mt.clearRect(0, 0, At.width, At.height);
		let i = g();
		Mt.setTransform(i, 0, 0, i, 0, 0), Mt.scale(W.zoom, W.zoom), Mt.translate(-e, -t), Yt.drawSceneLayers(Mt, {
			viewMinX: e,
			viewMinY: t,
			visualProfile: n,
			layerProfile: r,
			sceneTime: P,
			qualityProfile: Ie.getProfile(),
			rock: X,
			sisyphus: Z,
			dustParticles: N,
			drawRock: Zt,
			drawSisyphus: $t,
			ascentProgress: et(),
			windActive: B,
			balanceState: typeof $?.getBalanceState == "function" ? $.getBalanceState() : null
		}), Mt.restore();
	}
	function tn() {
		u.set(Z, !1), u.set(X, !1);
	}
	function nn(e) {
		return Math.hypot(e.velocity.x, e.velocity.y);
	}
	function rn(e) {
		o.setVelocity(e, {
			x: 0,
			y: 0
		}), o.setAngularVelocity(e, 0);
	}
	function an(e) {
		R = k(R + e, 0, 1);
	}
	function on(e, t, n, r = 1, i = {}) {
		let a = k(n, .08, .6), o = k(i.sizeScale ?? 1, .2, 1), s = k(i.densityScale ?? 1, .2, 1), c = k(i.alphaScale ?? 1, .2, 1), l = k(i.decayScale ?? 1, 1, 2), u = Math.max(i.minimumParticles ?? 3, Math.round((5 + a * 14) * s));
		for (let n = 0; n < u; n += 1) N.push({
			x: e,
			y: t - M() * 10 * o,
			vx: (r * (.18 + M() * 1.1) + (M() - .5) * .75) * o,
			vy: -(.3 + M() * 1.5) * a * 2.2 * o,
			radius: (3 + M() * 7 * a) * o,
			alpha: (.08 + M() * .14) * c,
			decay: (.012 + M() * .02) * l,
			life: 1
		});
	}
	function sn(e) {
		let t = e / 16.6667;
		for (let e = N.length - 1; e >= 0; --e) {
			let n = N[e];
			if (n.life -= n.decay * t, n.life <= 0) {
				N.splice(e, 1);
				continue;
			}
			n.x += n.vx * t, n.y += n.vy * t, n.vx *= .985, n.vy = n.vy * .97 + .02 * t, n.radius *= .994;
		}
	}
	function cn() {
		if (!vn) return;
		let e = J.timing.timestamp;
		if (e - z < 170) return;
		let t = Math.max(nn(Z), nn(X)), n = (typeof $?.getBalanceState == "function" ? $.getBalanceState() : null)?.strainScore ?? 0;
		t < .015 && n < .04 || (z = e, on(Z.position.x - 6, qt(Z.position.x) - 2, k(.08 + t * .45 + n * .08, .08, .18), -1, {
			sizeScale: .38,
			densityScale: .42,
			alphaScale: .55,
			decayScale: 1.35,
			minimumParticles: 2
		}));
	}
	function ln() {
		if (!vn || Q !== V.PLAYING) return;
		let e = J.timing.timestamp;
		if (e - ce < 150) return;
		ce = e;
		let t = Z.position.x - 4, n = qt(Z.position.x) - 1;
		for (let e = 0; e < 1; e += 1) N.push({
			x: t + (M() - .5) * 3,
			y: n,
			vx: -(.05 + M() * .18),
			vy: -(.03 + M() * .11),
			radius: .65 + M() * .7,
			alpha: .025 + M() * .025,
			decay: .038 + M() * .025,
			life: 1
		});
	}
	function un() {
		let e = (typeof $?.getBalanceState == "function" ? $.getBalanceState() : null)?.strainScore ?? 0;
		if (!vn || e < .42) return;
		let t = J.timing.timestamp, n = B ? 850 : 1350;
		if (t - de < n) return;
		de = t;
		let r = Z.position.x + 7, i = qt(Z.position.x) - 38;
		N.push({
			x: r + (M() - .5) * 3,
			y: i,
			vx: (M() - .5) * .18 - (B ? .12 : 0),
			vy: -(.08 + M() * .14),
			radius: 2.4 + M() * 2.6 + e * 1.2,
			alpha: .028 + M() * .025 + e * .018,
			decay: .008 + M() * .006,
			life: 1
		});
	}
	function dn(e, t) {
		let n = e.collision && e.collision.supports && e.collision.supports[0];
		return n ? {
			x: n.x,
			y: n.y
		} : {
			x: t.position.x,
			y: t.position.y
		};
	}
	function fn(e) {
		Z.collisionFilter.mask = e ? Dt : kt, X.collisionFilter.mask = e ? Ot : kt;
	}
	let pn = 10, mn = {
		x: 110,
		y: 509
	}, X = a.circle(mn.x, mn.y, 10, {
		restitution: 0,
		friction: .6,
		frictionStatic: 1,
		frictionAir: .006,
		density: .1,
		collisionFilter: {
			category: q.ROCK,
			mask: Ot
		},
		render: {
			fillStyle: "rgba(0,0,0,0)",
			strokeStyle: "rgba(0,0,0,0)",
			lineWidth: 0
		},
		label: "rock"
	}), hn = 7.8, gn = 15.7, _n = {
		x: Math.max(16, 100 - hn / 2 - 2),
		y: 520 - gn / 2 - 1
	}, Z = a.rectangle(_n.x, _n.y, hn, gn, {
		restitution: 0,
		friction: .8,
		frictionStatic: .8,
		density: .35,
		inertia: Infinity,
		chamfer: { radius: 2 },
		collisionFilter: {
			category: q.SISYPHUS,
			mask: Dt
		},
		render: {
			fillStyle: "rgba(0,0,0,0)",
			strokeStyle: "rgba(0,0,0,0)",
			lineWidth: 0,
			opacity: 1
		},
		label: "sisyphus"
	});
	s.add(J.world, [
		Pt,
		Ft,
		It,
		Lt,
		Rt,
		Ut,
		X,
		Z
	]);
	let vn = !1, yn = 0, Q = V.PLAYING, bn = 0, xn = 0, Sn = performance.now(), Cn = 830, wn = 170;
	function Tn() {
		let e = X.position.x < 200 && X.position.y > 498, t = nn(X) < .14 && Math.abs(X.angularVelocity) < .08;
		return e && t;
	}
	function En(e) {
		if (Q !== e) {
			if (be = Q, xe = 450, Q = e, e === V.PLAYING) {
				$e(), o.setStatic(Z, !1), o.setStatic(X, !1), fn(!0), bn = 0, he = 0, ge = 0, B = !1, Sn = performance.now(), tn();
				return;
			}
			if (e === V.SUMMIT) {
				vn = !1, $e(), jt.style.cursor = "default", fn(!1), o.setStatic(Z, !1), rn(Z), o.setStatic(Z, !0), o.setStatic(X, !1), o.setVelocity(X, {
					x: -1.25,
					y: -.18
				}), tn(), console.log("%cTope alcanzado: La roca regresa rodando por su peso", "color:#d4a373;font-weight:bold");
				return;
			}
			if (e === V.SIS_DESCENDING) {
				$e(), fn(!1), o.setStatic(Z, !1), tn(), bn = J.timing.timestamp + 4e3, console.log("%cSisifo desciende lentamente por 4s...", "color:#8d99ae");
				return;
			}
			if (e === V.WAITING) {
				if (vn = !1, $e(), Ve(H.OVERVIEW), jt.style.cursor = "default", xn += 1, typeof t.onCycleComplete == "function") try {
					t.onCycleComplete(xn);
				} catch (e) {
					console.warn("onCycleComplete error:", e);
				}
				fn(!1), o.setStatic(Z, !1), rn(Z);
				let e = X.position.x - 10 - hn / 2 - 2;
				if (e < 16) {
					e = 16;
					let t = e + hn / 2 + 2 + 10;
					o.setPosition(X, {
						x: t,
						y: X.position.y
					});
				}
				520 - gn / 2 - 1, o.setPosition(Z, {
					x: e,
					y: 511.15
				}), o.setAngle(Z, 0), o.setStatic(Z, !0), rn(X), tn(), console.log("%cHaz clic en Sisifo para subir de nuevo", "color:#e07a5f;font-weight:bold");
			}
		}
	}
	let $ = D({
		canvas: jt,
		render: Y,
		queryPoint: l.point,
		sisyphus: Z,
		camera: W,
		cameraDrag: Ce,
		audioCueController: Oe,
		runtimeQualityController: Ie,
		GAME_STATE: V,
		CAMERA_BEHAVIOR: H,
		CAMERA_DRAG_THRESHOLD: 5,
		CAMERA_PAN_SENSITIVITY: 1.08,
		getIsPushing: () => vn,
		setIsPushing: (e) => {
			vn = e, e || (yn = 0);
		},
		getGameState: () => Q,
		setGameState: En,
		getFreePanZoom: He,
		setCameraBehavior: Ve,
		wakeBodies: tn,
		beginCameraDrag: Qe,
		stopCameraDrag: $e,
		storeFreePanTarget: Ze,
		cycleUserZoomInput: yt,
		cycleVisualStyle: bt,
		setQualityHintUntil: (e) => {
			Ne = e;
		},
		triggerStumble: (e = {}) => {
			let t = k(e.strain ?? .55, 0, 1), n = e.windActive ? 1 : 0;
			o.setVelocity(Z, {
				x: Z.velocity.x * .18 - .018 * (.8 + n),
				y: Z.velocity.y
			}), o.setVelocity(X, {
				x: X.velocity.x * (.58 + n * .12),
				y: X.velocity.y
			}), on(Z.position.x - 4, qt(Z.position.x) - 2, .16 + t * .24, -1), Pe = Math.max(Pe, .18 + t * .24), an(.18 + t * .24 + n * .08);
		},
		getAscentProgress: et,
		isWindActive: () => B
	});
	$.register(), c.on(J, "collisionStart", (e) => {
		for (let t of e.pairs) {
			if (![t.bodyA.label, t.bodyB.label].includes("rock")) continue;
			let e = t.bodyA.label === "rock" ? t.bodyB : t.bodyA;
			if (![
				"ground",
				"mountain",
				"wall-left"
			].includes(e.label) || Q === V.PLAYING && e.label === "mountain") continue;
			let n = t.bodyA.label === "rock" ? t.bodyA : t.bodyB, r = k((Math.hypot(n.velocity.x - e.velocity.x, n.velocity.y - e.velocity.y) - 1.45) / 6, 0, 1);
			if (r < .08) continue;
			let i = dn(t, n), a = n.velocity.x < 0 ? -1 : 1;
			on(i.x, i.y, .16 + r * .32, a), an(r * (e.label === "wall-left" ? .18 : .11)), Pe = Math.max(Pe, r), Oe.triggerImpact(r);
		}
	});
	function Dn(e) {
		let t = Y.canvas.width, n = Y.canvas.height, r = ht(), i = Ie.getSnapshot(), a = i.profile, o = k((r.grade.washAlpha + r.grade.contrastLift * .1) * (.92 + a.fogAlphaMul * .08), .02, .26), s = k(r.grade.vignetteAlpha, .2, .75), c = Math.max(0, Math.round(r.grain.density * a.grainDensityMul)), l = k((r.grain.baseAlpha + Ae * r.grain.motionBoost) * a.grainAlphaMul, 0, .16);
		e.save(), e.setTransform(1, 0, 0, 1, 0, 0);
		let u = e.createLinearGradient(0, 0, 0, n);
		u.addColorStop(0, `rgba(252, 241, 212, ${(o * .5).toFixed(3)})`), u.addColorStop(.15, `rgba(252, 241, 212, ${(o * .2).toFixed(3)})`), u.addColorStop(.45, `rgba(252, 241, 212, ${(o * .08).toFixed(3)})`), u.addColorStop(1, `rgba(8, 10, 16, ${(o * .84).toFixed(3)})`), e.fillStyle = u, e.fillRect(0, 0, t, n);
		let d = e.createRadialGradient(t * .5, n * .45, Math.min(t, n) * .18, t * .5, n * .55, Math.max(t, n) * .72);
		if (d.addColorStop(0, "rgba(0, 0, 0, 0)"), d.addColorStop(.72, `rgba(7, 10, 16, ${(s * .34).toFixed(3)})`), d.addColorStop(1, `rgba(4, 6, 10, ${s.toFixed(3)})`), e.fillStyle = d, e.fillRect(0, 0, t, n), c > 0 && l > 0) {
			e.globalAlpha = l;
			for (let r = 0; r < c; r += 1) {
				let i = (r * 137 + Math.floor(P * .6)) % t, a = (r * 211 + Math.floor(P * .35)) % n, o = 1 + r % 3;
				e.fillStyle = r % 5 == 0 ? "rgba(255, 255, 255, 0.7)" : "rgba(12, 16, 24, 0.7)", e.fillRect(i, a, o, o);
			}
		}
		if (x(e, ke, "grade", {
			width: t,
			height: n,
			timeMs: P,
			viewMinX: Y.bounds.min.x,
			viewMinY: Y.bounds.min.y,
			overlayOpacityMultiplier: a.overlayOpacityMul
		}), performance.now() < fe) {
			let t = Ke(Le.level);
			e.globalAlpha = .9, e.fillStyle = "rgba(14, 18, 26, 0.64)", e.fillRect(24, 24, 168, 34), e.fillStyle = "rgba(226, 232, 242, 0.95)", e.font = "600 14px system-ui, sans-serif", e.textBaseline = "middle", e.fillText(`ZOOM: ${t}`, 36, 41);
		}
		performance.now() < Me && (e.globalAlpha = .9, e.fillStyle = "rgba(18, 22, 30, 0.64)", e.fillRect(24, 66, 290, 34), e.fillStyle = "rgba(246, 231, 203, 0.95)", e.font = "600 14px system-ui, sans-serif", e.textBaseline = "middle", e.fillText(`ESTILO: ${je.toUpperCase()}`, 36, 83)), performance.now() < Ne && (e.globalAlpha = .9, e.fillStyle = "rgba(18, 22, 30, 0.64)", e.fillRect(24, 108, 220, 34), e.fillStyle = "rgba(198, 231, 255, 0.95)", e.font = "600 14px system-ui, sans-serif", e.textBaseline = "middle", e.fillText(`CALIDAD: ${i.tier.toUpperCase()}`, 36, 125));
		let f = $.getComboCount();
		if (f > 5) {
			e.save(), e.setTransform(1, 0, 0, 1, 0, 0);
			let r = (.03 + k((f - 5) / 25, 0, 1) * .1).toFixed(3), i = e.createRadialGradient(t * .5, n * .5, Math.min(t, n) * .25, t * .5, n * .5, Math.max(t, n) * .7);
			i.addColorStop(0, "rgba(0, 0, 0, 0)"), i.addColorStop(.7, `rgba(212, 175, 55, ${(r * .4).toFixed(4)})`), i.addColorStop(1, `rgba(212, 175, 55, ${r})`), e.fillStyle = i, e.fillRect(0, 0, t, n), e.restore();
		}
		if (_e.length > 0) {
			e.save();
			let t = window.devicePixelRatio || 1;
			e.setTransform(t, 0, 0, t, 0, 0), e.scale(W.zoom, W.zoom), e.translate(-Y.bounds.min.x, -Y.bounds.min.y);
			for (let t of _e) e.globalAlpha = t.alpha * t.life, e.strokeStyle = "rgba(220, 230, 255, 0.85)", e.lineWidth = 1.2, e.beginPath(), e.moveTo(t.x, t.y), e.lineTo(t.x + t.length, t.y - .5), e.stroke();
			e.restore();
		}
		B && (e.save(), e.setTransform(1, 0, 0, 1, 0, 0), e.globalAlpha = .5 + Math.sin(P * .012) * .2, e.fillStyle = "rgba(160, 190, 240, 0.12)", e.fillRect(0, 0, t, n), e.restore()), e.restore();
	}
	c.on(J, "beforeUpdate", () => {
		let e = J.timing.lastDelta || 16.6667, t = performance.now(), n = k(t - Sn, 0, 250), r = n / 16.6667;
		Sn = t, P += n, R = Math.max(0, R - n * .0011), Pe = Math.max(0, Pe - n * .0014), xe > 0 && (xe = Math.max(0, xe - n)), sn(n), typeof $?.update == "function" && $.update(n, P), Fe = Ie.update(e).fpsSmoothed;
		let i = k(nn(X) / 2.2, 0, 1), a = k(nn(Z) / 2, 0, 1);
		Ae = Gt(Ae, k(Math.max(i, a) + Pe * .3, 0, 1), .1), Oe.update({
			rockSpeed: nn(X),
			ascentProgress: et(),
			isPushing: vn,
			moodImpact: Pe,
			isWindActive: B
		}), typeof An.onProgressUpdate == "function" && An.onProgressUpdate({
			progress: et(),
			gameState: Q,
			cycleCount: xn,
			isPushing: vn
		});
		let s = et(), c = me[he];
		c && vn && Q === V.PLAYING && s >= c.progress && (ge = t + c.durationMs, he += 1);
		let l = ve || t < ye;
		if (B = Q === V.PLAYING && (l || t < ge), B && Math.random() < Math.min(1, .75 * Math.max(1, r))) {
			let e = f / Math.max(W.zoom, .1), t = h / Math.max(W.zoom, .1);
			_e.push({
				x: W.x + e / 2 + 20,
				y: W.y - t / 2 + Math.random() * t,
				vx: -(8.5 + Math.random() * 6),
				vy: (Math.random() - .5) * 1.2,
				alpha: .15 + Math.random() * .25,
				life: 1,
				decay: .012 + Math.random() * .008,
				length: 40 + Math.random() * 60
			});
		}
		for (let e = _e.length - 1; e >= 0; e--) {
			let t = _e[e];
			if (t.life -= t.decay * (n / 16.667), t.life <= 0) {
				_e.splice(e, 1);
				continue;
			}
			t.x += t.vx * (n / 16.667), t.y += t.vy * (n / 16.667);
		}
		if (Ct(), Tt(n), X.position.x < 500 && X.position.y > 470 && X.velocity.y < -.1 && o.setVelocity(X, {
			x: X.velocity.x,
			y: X.velocity.y * .05
		}), X.position.x < 34 && X.velocity.x < -.07 && (o.setVelocity(X, {
			x: .21,
			y: X.velocity.y
		}), o.setAngularVelocity(X, .007)), Q !== V.PLAYING && Math.abs(X.velocity.x) < .1 && Math.abs(X.angularVelocity) > .018 && o.setAngularVelocity(X, X.angularVelocity * .85), Q !== V.PLAYING && X.position.y > 505 && X.position.x > 50 && Math.abs(X.velocity.x) < .05 && (o.setVelocity(X, {
			x: 0,
			y: X.velocity.y
		}), o.setAngularVelocity(X, 0)), Q === V.PLAYING) {
			if (Z.position.x >= 830) {
				En(V.SUMMIT);
				return;
			}
			if (!vn) return;
			function e(e, t) {
				let n = e.position.x, r = t / 2, i = qt(n - r), a = qt(n + r), o = r * 2, s = a - i, c = Math.hypot(o, s);
				return c === 0 ? {
					x: 1,
					y: 0
				} : {
					x: o / c,
					y: s / c
				};
			}
			let t = e(Z, hn), n = e(X, 20);
			{
				tn(), yn = Math.min(yn + r, 90);
				let e = .2 + yn / 90 * .8, i = et(), a = 1;
				i >= .35 && i < .55 ? a = .85 : i >= .55 && i < .75 ? a = .7 : i >= .75 && i < .94 && (a = .45);
				let s = .073 * e * a, c = .066 * e * a, l = J.gravity.y * (J.gravity.scale ?? .001), u = .95;
				o.applyForce(Z, Z.position, {
					x: 0,
					y: -Z.mass * l * u
				}), o.applyForce(X, X.position, {
					x: 0,
					y: -X.mass * l * u
				}), o.applyForce(Z, Z.position, {
					x: t.x * E * .08 * e * a,
					y: t.y * E * .08 * e * a
				}), cn(), ln(), un(), oe = k(t.x * s * 68 + n.x * c * 34, -90, 110), se = k(t.y * s * 24 + n.y * c * 16, -54, 62), o.setVelocity(Z, {
					x: t.x * s * r,
					y: t.y * s * r
				}), o.setVelocity(X, {
					x: n.x * c * r,
					y: n.y * c * r
				});
			}
		} else Q === V.SUMMIT ? Tn() ? bn === 0 ? (bn = J.timing.timestamp + 3e3, console.log("%c⏳ Roca en base. Sísifo contempla 3s...", "color:#8d99ae")) : J.timing.timestamp >= bn && (Z.render.opacity = Math.max(0, Z.render.opacity - .033), Z.render.opacity <= 0 && (rn(X), En(V.WAITING))) : bn = 0 : Q === V.WAITING && (Z.render.opacity < 1 && (Z.render.opacity = Math.min(1, Z.render.opacity + .006)), u.set(Z, !1));
	}), c.on(Y, "afterRender", () => {
		let e = Y.context;
		e.save(), e.setTransform(1, 0, 0, 1, 0, 0), e.clearRect(0, 0, Y.canvas.width, Y.canvas.height), e.restore(), en(), Dn(e);
	});
	let On = getComputedStyle(e).position;
	(On === "static" || On === "") && (e.style.position = "relative"), e.style.overflow = "hidden", Jt(), Ct(), W.x = G.x, W.y = G.y, W.zoom = G.zoom, Tt(0), window.addEventListener("resize", Jt), Nt();
	let kn = i.create();
	Sn = performance.now(), r.run(Y), i.run(kn, J), console.log("%c🪨 Sísifo — listo", "color:#e07a5f;font-size:14px;font-weight:bold"), console.log("Haz clic y mantén sobre Sísifo para empujar la roca.");
	let An = {
		destroy() {
			r.stop(Y), i.stop(kn), c.off(Y), c.off(J), typeof $?.destroy == "function" && $.destroy(), window.removeEventListener("resize", Jt), At.remove(), jt.remove(), s.clear(J.world), n.clear(J), console.log("%c🪨 Sísifo — destruido", "color:#999;font-size:12px");
		},
		getState: () => Q,
		getCycleCount: () => xn,
		getAscentProgress: et,
		getBalanceState: () => typeof $?.getBalanceState == "function" ? $.getBalanceState() : null,
		getPerformance: () => ({
			fpsApprox: Fe,
			motionIntensity: Ae,
			currentVisualMood: mt(),
			currentVisualStyle: je,
			qualityTier: Ie.getSnapshot().tier
		}),
		setWindState: (e) => {
			ve = !!e;
		},
		triggerWindEvent: (e = 5e3) => {
			ye = performance.now() + e;
		},
		onProgressUpdate: null
	};
	return An;
}
//#endregion
export { me as createSisyphusGame };
