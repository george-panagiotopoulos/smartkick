#!/usr/bin/env python3
"""
Extract text content from PDF files for question generation.
"""
import PyPDF2
import os
from pathlib import Path

def extract_text_from_pdf(pdf_path):
    """Extract all text from a PDF file."""
    text = []
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                text.append(f"--- Page {page_num + 1} ---\n{page_text}")
        return "\n\n".join(text)
    except Exception as e:
        return f"Error reading {pdf_path}: {str(e)}"

def main():
    # Use the parent directory of scripts/ as the PDF folder
    script_dir = Path(__file__).parent
    pdf_folder = script_dir.parent
    
    all_content = {}
    
    for pdf_file in pdf_folder.glob("*.pdf"):
        print(f"Extracting content from: {pdf_file.name}")
        content = extract_text_from_pdf(pdf_file)
        all_content[pdf_file.name] = content
        print(f"Extracted {len(content)} characters from {pdf_file.name}\n")
    
    # Save extracted content to a text file for review
    output_file = pdf_folder / "extracted_content.txt"
    with open(output_file, 'w', encoding='utf-8') as f:
        for filename, content in all_content.items():
            f.write(f"\n{'='*80}\n")
            f.write(f"FILE: {filename}\n")
            f.write(f"{'='*80}\n\n")
            f.write(content)
            f.write("\n\n")
    
    print(f"\nAll content extracted and saved to: {output_file}")
    
    # Also print summary to console
    for filename, content in all_content.items():
        print(f"\n--- {filename} ---")
        print(content[:500] + "..." if len(content) > 500 else content)

if __name__ == "__main__":
    main()

