import { SkillDescription } from "@/types/general/skills";

/** Get the description text for a given level (1-5) from SkillDescription. */
export function getSkillDescriptionForLevel(
    description: SkillDescription | null | undefined,
    level: number
): string {
    if (!description) return "";
    const key = `level_${level}` as keyof SkillDescription;
    const value = description[key];
    return typeof value === "string" ? value : "";
}

/** Default empty SkillDescription for form initialization. */
export const EMPTY_SKILL_DESCRIPTION: SkillDescription = {
    level_1: "",
    level_2: "",
    level_3: "",
    level_4: "",
    level_5: "",
};
