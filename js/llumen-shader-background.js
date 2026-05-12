(() => {
    const SHADER_HOST_ID = 'shader-canvas';
    const SHADER_MOUNT_KEY = '__llumenShaderMount';
    const scriptEl = document.currentScript;
    const scriptBaseUrl = scriptEl && scriptEl.src ? new URL('.', scriptEl.src) : null;
    const vendorUrl = scriptBaseUrl ? new URL('vendor/paper-shaders.iife.js', scriptBaseUrl).href : null;

    const ensureShaderHost = () => {
        let host = document.getElementById(SHADER_HOST_ID);
        if (!host) {
            host = document.createElement('div');
            host.id = SHADER_HOST_ID;
        }
        host.classList.add('ll-shader-canvas');

        if (document.body && host.parentElement !== document.body) {
            document.body.prepend(host);
        } else if (document.body && document.body.firstElementChild !== host) {
            document.body.prepend(host);
        }

        const appRoot = document.getElementById('crimson-app');
        if (appRoot) {
            if (!appRoot.style.position || appRoot.style.position === 'static') {
                appRoot.style.position = 'relative';
            }
            if (!appRoot.style.zIndex) {
                appRoot.style.zIndex = '1';
            }
        }

        return host;
    };

    const createMeshGradientShader = (host) => {
        if (!host || !window.PaperShaders || typeof window.PaperShaders.ShaderMount !== 'function') return;

        const previousMount = window[SHADER_MOUNT_KEY];
        if (previousMount && typeof previousMount.dispose === 'function') {
            previousMount.dispose();
        }

        const colors = ['#273364', '#182941', '#1F3049', '#122746', '#172C4B', '#28456F', '#28456F'];
        const uniforms = {
            u_fit: window.PaperShaders.ShaderFitOptions.cover,
            u_scale: 1,
            u_rotation: 0,
            u_originX: 0.5,
            u_originY: 0.5,
            u_offsetX: 0,
            u_offsetY: 0,
            u_worldWidth: 480,
            u_worldHeight: 270,
            u_colors: colors.map((color) => window.PaperShaders.getShaderColorFromString(color)),
            u_colorsCount: colors.length,
            u_distortion: 0.09,
            u_swirl: 0,
            u_grainMixer: 0,
            u_grainOverlay: 0
        };

        window[SHADER_MOUNT_KEY] = new window.PaperShaders.ShaderMount(
            host,
            window.PaperShaders.meshGradientFragmentShader,
            uniforms,
            undefined,
            0.1,
            457832.3249999223
        );
    };

    const loadVendorAndInit = () => {
        const host = ensureShaderHost();
        if (window.PaperShaders) {
            createMeshGradientShader(host);
            return;
        }
        if (!vendorUrl) return;

        const existingVendorScript = document.querySelector(`script[data-llumen-shader-vendor="true"][src="${vendorUrl}"]`);
        if (existingVendorScript) {
            existingVendorScript.addEventListener('load', () => createMeshGradientShader(host), { once: true });
            return;
        }

        const vendorScript = document.createElement('script');
        vendorScript.src = vendorUrl;
        vendorScript.dataset.llumenShaderVendor = 'true';
        vendorScript.addEventListener('load', () => createMeshGradientShader(host), { once: true });
        document.head.appendChild(vendorScript);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadVendorAndInit, { once: true });
    } else {
        loadVendorAndInit();
    }
})();
