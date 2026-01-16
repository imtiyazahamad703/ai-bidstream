package com.bidstream.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

/**
 * Extracts text from PDF, DOC, and DOCX files.
 */
@Service
public class DocExtractionService {

    private static final Logger logger = LoggerFactory.getLogger(DocExtractionService.class);

    /**
     * Extracts text from a MultipartFile based on its content type.
     */
    public String extractText(MultipartFile file) {
        String contentType = file.getContentType();
        String fileName = file.getOriginalFilename();
        
        if (fileName == null) {
            throw new IllegalArgumentException("File name is required");
        }
        
        String lowerName = fileName.toLowerCase();
        
        try {
            if ("application/pdf".equals(contentType) || lowerName.endsWith(".pdf")) {
                return extractFromPdf(file.getInputStream());
            } else if ("application/msword".equals(contentType) || lowerName.endsWith(".doc")) {
                return extractFromDoc(file.getInputStream());
            } else if ("application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(contentType) 
                        || lowerName.endsWith(".docx")) {
                return extractFromDocx(file.getInputStream());
            } else {
                throw new IllegalArgumentException(
                    "Unsupported file type: " + contentType + ". Only PDF, DOC, and DOCX are supported.");
            }
        } catch (IOException e) {
            logger.error("Failed to extract text from file: {}", fileName, e);
            throw new RuntimeException("Failed to extract text from file: " + fileName, e);
        }
    }

    private String extractFromPdf(InputStream inputStream) throws IOException {
        try (PDDocument document = org.apache.pdfbox.Loader.loadPDF(inputStream.readAllBytes())) {
            if (document.isEncrypted()) {
                throw new RuntimeException("Cannot extract text from encrypted PDF");
            }
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        }
    }

    private String extractFromDoc(InputStream inputStream) throws IOException {
        try (HWPFDocument document = new HWPFDocument(inputStream)) {
            WordExtractor extractor = new WordExtractor(document);
            String text = extractor.getText();
            extractor.close();
            return text;
        }
    }

    private String extractFromDocx(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            StringBuilder sb = new StringBuilder();
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                sb.append(paragraph.getText()).append("\n");
            }
            return sb.toString();
        }
    }
}
