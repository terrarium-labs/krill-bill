/** On call config: id, resting_time_after_call, requirements, execution_error. */
export interface OnCallConfig {
  id: string;
  resting_time_after_call: number;
  requirements: string;
  execution_error?: string | null;
}

/** Payload for creating or updating an on call config. */
export interface OnCallConfigPayload {
  resting_time_after_call: number;
  requirements: string;
}
