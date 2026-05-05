import * as pdfjsLib from "pdfjs-dist";
import pdfjsDistPackage from "pdfjs-dist/package.json";

/** Worker URL uses the version from the installed `pdfjs-dist` package (lockfile-resolved). */
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsDistPackage.version}/build/pdf.worker.min.mjs`;

export { pdfjsLib };
