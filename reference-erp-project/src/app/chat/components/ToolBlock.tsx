import { Icon } from "@iconify/react";
import { ToolUseContent } from "@/types/chat/chat";
import { getColorClasses } from "@/utils/miscelanea";
import {
    getToolIcon,
    getToolLabel,
    isSkillTool,
    extractSkillName,
    getSkillLabel,
    getSkillColor,
} from "../utils/tool-meta";

interface ToolBlockProps {
    item: ToolUseContent;
    index: number;
    generateChecksum: (str?: string) => string;
}

type ExtractDisplay = (input: string) => string;

const EXTRACT_COMMAND: ExtractDisplay = (input) => {
    try { return JSON.parse(input).command; } catch { return input; }
};

const EXTRACT_PATH: ExtractDisplay = (input) => {
    try { return JSON.parse(input).path.split("/").pop() || ""; } catch { return input; }
};

const EXTRACT_QUERY: ExtractDisplay = (input) => {
    try { return JSON.parse(input).query; } catch { return input; }
};

const EXTRACT_DEFAULT: ExtractDisplay = (input) => {
    if (!input || input.trim() === "") return "";
    try {
        const p = JSON.parse(input);
        return p.name || p.query || p.path || p.command || "";
    } catch {
        return input;
    }
};

const CUSTOM_DISPLAY: Record<string, { extract: ExtractDisplay; showCommand?: boolean }> = {
    bash:             { extract: EXTRACT_COMMAND, showCommand: true },
    read:             { extract: EXTRACT_PATH },
    write:            { extract: EXTRACT_PATH },
    edit:             { extract: EXTRACT_PATH },
    web_search:       { extract: EXTRACT_QUERY },
    internet_search:  { extract: EXTRACT_QUERY },
};

const ToolBlock = ({ item, index, generateChecksum }: ToolBlockProps) => {
    const uniqueKey = `tool-${item.name}-${index}-${generateChecksum(item.input || "")}-${item.id || ""}`;

    if (isSkillTool(item.name)) {

        console.log("Skill tool", item);

        const skillName = extractSkillName(item.input);
        const skillLabel = getSkillLabel(skillName);
        const colorClasses = getColorClasses(getSkillColor(skillName));

        return (
            <div key={uniqueKey} className="w-full py-1">
                <div className={`flex items-center border gap-1.5 ml-2 px-2.5 py-1 rounded-full w-fit ${colorClasses}`}>
                    <Icon icon="lucide:book-open" className="size-3.5" />
                    <p className="text-xs font-medium">
                        {skillLabel}
                    </p>
                </div>
            </div>
        );
    }

    const icon = getToolIcon(item.name);
    const label = getToolLabel(item.name);
    const custom = CUSTOM_DISPLAY[item.name];
    const extract = custom?.extract ?? EXTRACT_DEFAULT;
    const showCommand = custom?.showCommand ?? false;
    const displayText = extract(item.input);
    
    return (
        <div key={uniqueKey} className="w-full py-1">
            <div className="flex flex-col gap-1 ml-2">
                <div className="flex items-center gap-1 border border-border rounded-full p-1 px-2 w-fit">
                    <Icon icon={icon} className="size-4" />
                    <p className="text-xs font-normal">
                        {label}
                        {displayText && (
                            <span className="text-xs font-normal"> {displayText}</span>
                        )}
                    </p>
                </div>

                {showCommand && displayText && (
                    <div className="bg-muted rounded-lg p-2 font-mono text-xs">
                        $ {displayText}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToolBlock;
