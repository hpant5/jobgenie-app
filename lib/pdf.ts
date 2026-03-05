// import * as pdfParse from "pdf-parse";

/* eslint-disable @typescript-eslint/no-require-imports */
const pdfParse = require("pdf-parse");

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text.trim();
}