import { laiaFetch } from "@/api/0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";
import { ReportParameterValues } from "@/types/general/reports";

/**
 * GET /orgs/{org_id}/reports
 * Returns all report categories with their reports and parameter definitions.
 */
const getReports = async (org_id: string) => {
    const url = new URL(`/orgs/${org_id}/reports`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

/**
 * GET /orgs/{org_id}/reports/{report_id}
 * Returns a single report definition including its parameter schema.
 */
const getReport = async (org_id: string, report_id: string) => {
    const url = new URL(`/orgs/${org_id}/reports/${report_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

/**
 * POST /orgs/{org_id}/reports/{report_id}/run
 * Executes the report with the given parameters.
 * Returns a download URL or inline data depending on the report type.
 */
const runReport = async (org_id: string, report_id: string, parameters: ReportParameterValues) => {
    const url = new URL(`/orgs/${org_id}/reports/${report_id}/run`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parameters }),
    });
    return response;
};

export { getReports, getReport, runReport };
