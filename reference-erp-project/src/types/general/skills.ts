export interface Skill {
    id: string;
    type: "hard" | "soft";
    name: string;
    description: SkillDescription | null;
    level: number | null;
}

export interface SkillDescription {
    level_1: string;
    level_2: string;
    level_3: string;
    level_4: string;
    level_5: string;
}