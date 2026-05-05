import { laiaFetch } from "../0.core/basics"
import { baseApiUrl } from "@/api/0.core/url";

/**
 * Transcribe audio file to text
 * POST /orgs/{org_id}/transcribe
 */
export const transcribeAudio = async (
    orgId: string,
    audioBlob: Blob
): Promise<any> => {


    const url = new URL(`/orgs/${orgId}/stt`, baseApiUrl)

    const formData = new FormData()
    formData.append("file", audioBlob, "audio.webm")

    const response = await laiaFetch(url, {
        method: "POST",
        body: formData,
    })

    return response
}
