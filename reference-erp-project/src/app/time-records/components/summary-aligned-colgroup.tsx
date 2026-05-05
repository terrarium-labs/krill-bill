/**
 * Shared `<colgroup>` for the expandable summary table and the nested detail rows table
 * so `table-fixed` column widths line up (expand | …data… | actions).
 */
export function SummaryAlignedColGroup({ columnCount }: { columnCount: number }) {
    if (columnCount < 2) return null;

    const middleCount = columnCount - 2;

    return (
        <colgroup>
            <col style={{ width: "1.75rem" }} />
            {Array.from({ length: middleCount }).map((_, i) => (
                <col key={i} />
            ))}
            <col style={{ width: "120px" }} />
        </colgroup>
    );
}
