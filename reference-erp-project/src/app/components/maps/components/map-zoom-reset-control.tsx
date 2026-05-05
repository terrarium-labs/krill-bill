import ReactDOM from "react-dom/client";
import { Plus, Minus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Creates a Mapbox control with zoom in, zoom out, and reset view buttons.
 * Uses Lucide icons and map-ctrl-outline styling from globals.css.
 *
 * @param options.onReset - Called when the reset button is clicked. Use a ref callback (e.g. () => resetViewRef.current?.()) for dynamic reset logic.
 * @param options.t - Translation function for aria-labels, e.g. (key, fallback) => string (useTranslation's t)
 * @returns Mapbox IControl instance
 */
export function createMapZoomResetControl(options: {
    onReset?: () => void;
    t: (key: string, fallback?: unknown) => string;
}): mapboxgl.IControl {
    const { onReset, t } = options;
    let _container: HTMLDivElement;
    const _iconRoots: ReturnType<typeof ReactDOM.createRoot>[] = [];

    const addIcon = (btn: HTMLButtonElement, Icon: typeof Plus) => {
        const wrap = document.createElement("span");
        wrap.style.display = "flex";
        wrap.style.alignItems = "center";
        wrap.style.justifyContent = "center";
        btn.appendChild(wrap);
        const root = ReactDOM.createRoot(wrap);
        root.render(<Icon className="h-5 w-5 text-current" strokeWidth={2} />);
        _iconRoots.push(root);
    };

    return {
        onAdd(map: mapboxgl.Map) {
            _container = document.createElement("div");
            _container.className = cn("mapboxgl-ctrl mapboxgl-ctrl-group map-ctrl-outline");

            const zoomIn = document.createElement("button");
            zoomIn.type = "button";
            zoomIn.className = "mapboxgl-ctrl-icon mapboxgl-ctrl-zoom-in";
            zoomIn.setAttribute("aria-label", t("common.zoomIn", "Zoom in"));
            zoomIn.addEventListener("click", () => map.zoomIn());
            addIcon(zoomIn, Plus);

            const zoomOut = document.createElement("button");
            zoomOut.type = "button";
            zoomOut.className = "mapboxgl-ctrl-icon mapboxgl-ctrl-zoom-out";
            zoomOut.setAttribute("aria-label", t("common.zoomOut", "Zoom out"));
            zoomOut.addEventListener("click", () => map.zoomOut());
            addIcon(zoomOut, Minus);

            const reset = document.createElement("button");
            reset.type = "button";
            reset.className = "mapboxgl-ctrl-icon mapboxgl-ctrl-compass";
            reset.setAttribute("aria-label", t("common.resetMapView", "Reset map view"));
            reset.title = t("common.resetMapView", "Reset map view");
            reset.addEventListener("click", () => onReset?.());
            addIcon(reset, RotateCcw);

            _container.append(zoomIn, zoomOut, reset);
            return _container;
        },

        onRemove() {
            _iconRoots.forEach((root) => root.unmount());
            _iconRoots.length = 0;
            _container?.parentNode?.removeChild(_container);
        },
    };
}
