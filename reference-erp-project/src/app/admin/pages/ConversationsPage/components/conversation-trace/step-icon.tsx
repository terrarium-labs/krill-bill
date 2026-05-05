import { memo } from "react";
import { Icon } from "@iconify/react";
import type { TraceCall } from "./trace-types";
import { resolveStepIcon } from "./trace-misc";

const StepIcon = memo(function StepIcon({
    step,
    className,
}: {
    step: TraceCall;
    className?: string;
}) {
    const resolved = resolveStepIcon(step);
    if ("customIcon" in resolved && resolved.customIcon) {
        return (
            <img
                src={resolved.customIcon}
                alt=""
                className={`${className ?? ""} rounded-sm bg-white object-contain dark:bg-neutral-100`}
            />
        );
    }
    const icon =
        "icon" in resolved && resolved.icon
            ? resolved.icon
            : "lucide:box";
    return <Icon icon={icon} className={className} />;
});

export default StepIcon;
