/* eslint-disable react-hooks/rules-of-hooks */
import { Suspense, useRef, useLayoutEffect, useEffect, useMemo } from 'react';
import React from 'react';
import { Canvas, useFrame, useLoader, useThree, invalidate } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX, useProgress, Html, Environment, ContactShadows } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';

const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
const deg2rad = d => (d * Math.PI) / 180;
const DECIDE = 8;
const ROTATE_SPEED = 0.005;
const INERTIA = 0.925;

const Loader = ({ placeholderSrc }) => {
    const { progress, active } = useProgress();
    if (!active && placeholderSrc) return null;
    return (
        <Html center>
            {placeholderSrc ? (
                <img src={placeholderSrc} width={128} height={128} style={{ filter: 'blur(8px)', borderRadius: 8 }} />
            ) : (
                `${Math.round(progress)} %`
            )}
        </Html>
    );
};

const DesktopControls = ({ pivot, min, max, zoomEnabled }) => {
    const ref = useRef(null);
    useFrame(() => ref.current?.target.copy(pivot));
    return (
        <OrbitControls
            ref={ref}
            makeDefault
            enablePan={false}
            enableRotate={false}
            enableZoom={zoomEnabled}
            minDistance={min}
            maxDistance={max}
        />
    );
};

const ModelInner = ({
                        url,
                        pivot,
                        initYaw,
                        initPitch,
                        minZoom,
                        maxZoom,
                        enableManualRotation,
                        enableManualZoom,
                        autoFrame,
                        fadeIn,
                        onLoaded
                    }) => {
    const outer = useRef(null);
    const inner = useRef(null);
    const { camera, gl } = useThree();

    const vel = useRef({ x: 0, y: 0 });

    const ext = useMemo(() => url.split('.').pop().toLowerCase(), [url]);
    const content = useMemo(() => {
        if (ext === 'glb' || ext === 'gltf') return useGLTF(url).scene.clone();
        if (ext === 'fbx') return useFBX(url).clone();
        if (ext === 'obj') return useLoader(OBJLoader, url).clone();
        console.error('Unsupported format:', ext);
        return null;
    }, [url, ext]);

    const pivotW = useRef(new THREE.Vector3());
    useLayoutEffect(() => {
        if (!content) return;
        const g = inner.current;
        g.updateWorldMatrix(true, true);

        const sphere = new THREE.Box3().setFromObject(g).getBoundingSphere(new THREE.Sphere());
        const s = 1 / (sphere.radius * 2);
        g.position.set(-sphere.center.x, -sphere.center.y, -sphere.center.z);
        g.scale.setScalar(s);

        g.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                if (fadeIn) {
                    o.material.transparent = true;
                    o.material.opacity = 0;
                }
            }
        });

        g.getWorldPosition(pivotW.current);
        pivot.copy(pivotW.current);
        outer.current.rotation.set(initPitch, initYaw, 0);

        if (autoFrame && camera.isPerspectiveCamera) {
            const persp = camera;
            const fitR = sphere.radius * s;
            const d = (fitR * 1.2) / Math.sin((persp.fov * Math.PI) / 180 / 2);
            persp.position.set(pivotW.current.x, pivotW.current.y, pivotW.current.z + d);
            persp.near = d / 10;
            persp.far = d * 10;
            persp.updateProjectionMatrix();
        }

        if (fadeIn) {
            let t = 0;
            const id = setInterval(() => {
                t += 0.05;
                const v = Math.min(t, 1);
                g.traverse(o => {
                    if (o.isMesh) o.material.opacity = v;
                });
                invalidate();
                if (v === 1) {
                    clearInterval(id);
                    onLoaded?.();
                }
            }, 16);
            return () => clearInterval(id);
        } else onLoaded?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content]);

    useEffect(() => {
        if (!enableManualRotation || isTouch) return;
        const el = gl.domElement;
        let drag = false;
        let lx = 0,
            ly = 0;
        const down = e => {
            if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
            drag = true;
            lx = e.clientX;
            ly = e.clientY;
            window.addEventListener('pointerup', up);
        };
        const move = e => {
            if (!drag) return;
            const dx = e.clientX - lx;
            const dy = e.clientY - ly;
            lx = e.clientX;
            ly = e.clientY;
            outer.current.rotation.y += dx * ROTATE_SPEED;
            outer.current.rotation.x += dy * ROTATE_SPEED;
            vel.current = { x: dx * ROTATE_SPEED, y: dy * ROTATE_SPEED };
            invalidate();
        };
        const up = () => (drag = false);
        el.addEventListener('pointerdown', down);
        el.addEventListener('pointermove', move);
        return () => {
            el.removeEventListener('pointerdown', down);
            el.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
    }, [gl, enableManualRotation]);

    useEffect(() => {
        if (!isTouch) return;
        const el = gl.domElement;
        const pts = new Map();

        let mode = 'idle';
        let sx = 0,
            sy = 0,
            lx = 0,
            ly = 0,
            startDist = 0,
            startZ = 0;

        const down = e => {
            if (e.pointerType !== 'touch') return;
            pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pts.size === 1) {
                mode = 'decide';
                sx = lx = e.clientX;
                sy = ly = e.clientY;
            } else if (pts.size === 2 && enableManualZoom) {
                mode = 'pinch';
                const [p1, p2] = [...pts.values()];
                startDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                startZ = camera.position.z;
                e.preventDefault();
            }
            invalidate();
        };

        const move = e => {
            const p = pts.get(e.pointerId);
            if (!p) return;
            p.x = e.clientX;
            p.y = e.clientY;

            if (mode === 'decide') {
                const dx = e.clientX - sx;
                const dy = e.clientY - sy;
                if (Math.abs(dx) > DECIDE || Math.abs(dy) > DECIDE) {
                    if (enableManualRotation && Math.abs(dx) > Math.abs(dy)) {
                        mode = 'rotate';
                        el.setPointerCapture(e.pointerId);
                    } else {
                        mode = 'idle';
                        pts.clear();
                    }
                }
            }

            if (mode === 'rotate') {
                e.preventDefault();
                const dx = e.clientX - lx;
                const dy = e.clientY - ly;
                lx = e.clientX;
                ly = e.clientY;
                outer.current.rotation.y += dx * ROTATE_SPEED;
                outer.current.rotation.x += dy * ROTATE_SPEED;
                vel.current = { x: dx * ROTATE_SPEED, y: dy * ROTATE_SPEED };
                invalidate();
            } else if (mode === 'pinch' && pts.size === 2) {
                e.preventDefault();
                const [p1, p2] = [...pts.values()];
                const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                const ratio = startDist / d;
                camera.position.z = THREE.MathUtils.clamp(startZ * ratio, minZoom, maxZoom);
                invalidate();
            }
        };

        const up = e => {
            pts.delete(e.pointerId);
            if (mode === 'rotate' && pts.size === 0) mode = 'idle';
            if (mode === 'pinch' && pts.size < 2) mode = 'idle';
        };

        el.addEventListener('pointerdown', down, { passive: true });
        window.addEventListener('pointermove', move, { passive: false });
        window.addEventListener('pointerup', up, { passive: true });
        window.addEventListener('pointercancel', up, { passive: true });
        return () => {
            el.removeEventListener('pointerdown', down);
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gl, enableManualRotation, enableManualZoom, minZoom, maxZoom]);

    

    useFrame(() => {
        let need = false;
        outer.current.rotation.y += vel.current.x;
        outer.current.rotation.x += vel.current.y;
        vel.current.x *= INERTIA;
        vel.current.y *= INERTIA;
        if (Math.abs(vel.current.x) > 1e-4 || Math.abs(vel.current.y) > 1e-4) need = true;
        if (need) invalidate();
    });

    if (!content) return null;
    return (
        <group ref={outer}>
            <group ref={inner}>
                <primitive object={content} />
            </group>
        </group>
    );
};

const ModelViewer = ({
                         url,
                         width = 400,
                         height = 400,
                         defaultRotationX = -50,
                         defaultRotationY = 20,
                         defaultZoom = 0.5,
                         minZoomDistance = 0.5,
                         maxZoomDistance = 10,
                         enableManualRotation = true,
                         enableManualZoom = true,
                         ambientIntensity = 0.3,
                         keyLightIntensity = 1,
                         fillLightIntensity = 0.5,
                         rimLightIntensity = 0.8,
                         environmentPreset = 'forest',
                         autoFrame = false,
                         placeholderSrc,
                         fadeIn = false,
                         onModelLoaded,
                         onError
                     }) => {
    const ext = useMemo(() => (url || '').split('.').pop().toLowerCase(), [url]);
    useEffect(() => {
        if (!url) return;
        try {
            if (ext === 'glb' || ext === 'gltf') {
                useGLTF.preload(url);
            } else if (ext === 'fbx') {
                useFBX.preload(url);
            } else if (ext === 'obj') {
                useLoader.preload(OBJLoader, url);
            }
        } catch {
            // ignore preload errors; component will attempt load in ModelInner
        }
    }, [url, ext]);
    const pivot = useRef(new THREE.Vector3()).current;
    const contactRef = useRef(null);

    const initYaw = deg2rad(defaultRotationX);
    const initPitch = deg2rad(defaultRotationY);
    const camZ = Math.min(Math.max(defaultZoom, minZoomDistance), maxZoomDistance);

    

    class ErrorBoundary extends React.Component {
        constructor(props) {
            super(props);
            this.state = { hasError: false };
        }
        static getDerivedStateFromError() {
            return { hasError: true };
        }
        componentDidCatch() {
            if (onError) onError();
        }
        render() {
            if (this.state.hasError) {
                return (
                    <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div>
                            <p>Model cant be loaded</p>
                        </div>
                    </div>
                );
            }
            return this.props.children;
        }
    }

    return (
        <div
            style={{
                width,
                height,
                touchAction: 'pan-y pinch-zoom',
                position: 'relative'
            }}
        >
            <ErrorBoundary>
                <Canvas
                    shadows
                    frameloop="demand"
                    gl={{ preserveDrawingBuffer: true }}
                    onCreated={({ gl }) => {
                        gl.toneMapping = THREE.ACESFilmicToneMapping;
                        gl.outputColorSpace = THREE.SRGBColorSpace;
                    }}
                    camera={{ fov: 50, position: [0, 0, camZ], near: 0.01, far: 100 }}
                    style={{ touchAction: 'pan-y pinch-zoom' }}
                >
                    {environmentPreset !== 'none' && <Environment preset={environmentPreset} background={false} />}

                    <ambientLight intensity={ambientIntensity} />
                    <directionalLight position={[5, 5, 5]} intensity={keyLightIntensity} castShadow />
                    <directionalLight position={[-5, 2, 5]} intensity={fillLightIntensity} />
                    <directionalLight position={[0, 4, -5]} intensity={rimLightIntensity} />

                    <ContactShadows ref={contactRef} position={[0, -0.5, 0]} opacity={0.35} scale={10} blur={2} />

                    <Suspense fallback={<Loader placeholderSrc={placeholderSrc} />}>
                        <ModelInner
                            url={url}
                            pivot={pivot}
                            initYaw={initYaw}
                            initPitch={initPitch}
                            minZoom={minZoomDistance}
                            maxZoom={maxZoomDistance}
                            enableManualRotation={enableManualRotation}
                            enableManualZoom={enableManualZoom}
                            autoFrame={autoFrame}
                            fadeIn={fadeIn}
                            onLoaded={onModelLoaded}
                        />
                    </Suspense>

                    {!isTouch && (
                        <DesktopControls pivot={pivot} min={minZoomDistance} max={maxZoomDistance} zoomEnabled={enableManualZoom} />
                    )}
                </Canvas>
            </ErrorBoundary>
        </div>
    );
};

export default ModelViewer;
