export function formatSessionMaterialFileSize(
    bytes: number | null | undefined
): string {
    if (bytes == null) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getSessionMaterialFileLabel(
    fileType: string | null | undefined
): string {
    if (fileType?.includes("pdf")) return "PDF";
    if (fileType?.includes("presentation") || fileType?.includes("pptx"))
        return "PPTX";
    if (fileType?.includes("word") || fileType?.includes("docx")) return "DOCX";
    if (fileType?.includes("spreadsheet") || fileType?.includes("xlsx"))
        return "XLSX";
    return "FILE";
}
