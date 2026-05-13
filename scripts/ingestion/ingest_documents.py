"""
Main script for ingesting Ayurvedic texts into the vector database
"""

import os
import sys
import asyncio
from pathlib import Path
from typing import List
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.rag.pipeline import get_rag_pipeline
from app.rag.chunking import TextCleaner


class DocumentIngester:
    """Handles document ingestion into the RAG system"""

    def __init__(self):
        self.rag_pipeline = get_rag_pipeline()
        self.text_cleaner = TextCleaner()
        self.ingestion_log = []

    async def ingest_pdf(self, pdf_path: str, book_name: str):
        """Ingest a PDF document"""
        try:
            from PyPDF2 import PdfReader
            
            pdf_file = PdfReader(pdf_path)
            full_text = ""
            
            for page_num, page in enumerate(pdf_file.pages):
                text = page.extract_text()
                full_text += f"\n[Page {page_num + 1}]\n{text}"
            
            # Ingest the document
            doc_ids = await self.rag_pipeline.ingest_document(
                full_text,
                book_name,
                {"source_file": pdf_path, "type": "pdf"}
            )
            
            log_entry = {
                "status": "success",
                "file": pdf_path,
                "book": book_name,
                "doc_ids": doc_ids,
                "doc_count": len(doc_ids)
            }
            self.ingestion_log.append(log_entry)
            print(f"✅ Ingested {book_name}: {len(doc_ids)} documents")
            return doc_ids
            
        except Exception as e:
            log_entry = {
                "status": "error",
                "file": pdf_path,
                "book": book_name,
                "error": str(e)
            }
            self.ingestion_log.append(log_entry)
            print(f"❌ Error ingesting {pdf_path}: {str(e)}")
            return []

    async def ingest_text(self, text_path: str, book_name: str):
        """Ingest a plain text document"""
        try:
            with open(text_path, 'r', encoding='utf-8') as f:
                text_content = f.read()
            
            doc_ids = await self.rag_pipeline.ingest_document(
                text_content,
                book_name,
                {"source_file": text_path, "type": "text"}
            )
            
            log_entry = {
                "status": "success",
                "file": text_path,
                "book": book_name,
                "doc_ids": doc_ids,
                "doc_count": len(doc_ids)
            }
            self.ingestion_log.append(log_entry)
            print(f"✅ Ingested {book_name}: {len(doc_ids)} documents")
            return doc_ids
            
        except Exception as e:
            log_entry = {
                "status": "error",
                "file": text_path,
                "book": book_name,
                "error": str(e)
            }
            self.ingestion_log.append(log_entry)
            print(f"❌ Error ingesting {text_path}: {str(e)}")
            return []

    async def ingest_json(self, json_path: str):
        """Ingest a JSON file with document data"""
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if isinstance(data, list):
                for item in data:
                    await self.rag_pipeline.ingest_document(
                        item.get("text", ""),
                        item.get("book_name", "Unknown"),
                        item.get("metadata", {})
                    )
            else:
                await self.rag_pipeline.ingest_document(
                    data.get("text", ""),
                    data.get("book_name", "Unknown"),
                    data.get("metadata", {})
                )
            
            print(f"✅ Ingested JSON from {json_path}")
            return True
            
        except Exception as e:
            print(f"❌ Error ingesting {json_path}: {str(e)}")
            return False

    async def ingest_directory(self, dir_path: str, pattern: str = "*"):
        """Ingest all files from a directory"""
        directory = Path(dir_path)
        
        for file_path in directory.glob(pattern):
            if file_path.is_file():
                if file_path.suffix.lower() == ".pdf":
                    book_name = file_path.stem.replace("_", " ")
                    await self.ingest_pdf(str(file_path), book_name)
                elif file_path.suffix.lower() == ".txt":
                    book_name = file_path.stem.replace("_", " ")
                    await self.ingest_text(str(file_path), book_name)
                elif file_path.suffix.lower() == ".json":
                    await self.ingest_json(str(file_path))

    def save_ingestion_log(self, log_path: str = "ingestion_log.json"):
        """Save ingestion log to file"""
        with open(log_path, 'w') as f:
            json.dump(self.ingestion_log, f, indent=2)
        print(f"✅ Ingestion log saved to {log_path}")


async def main():
    """Main ingestion script"""
    ingester = DocumentIngester()
    
    print("🌿 AyurGPT Document Ingestion System")
    print("=" * 50)
    
    # Example: Ingest from sample data directory
    sample_dir = "/path/to/ayurvedic/texts"  # Replace with actual path
    
    if os.path.exists(sample_dir):
        print(f"\n📂 Ingesting documents from {sample_dir}...")
        await ingester.ingest_directory(sample_dir, "*.txt")
        await ingester.ingest_directory(sample_dir, "*.pdf")
    else:
        print(f"\n⚠️  Sample directory not found: {sample_dir}")
        print("   Create a directory with your Ayurvedic texts and update the path.")
    
    # Save log
    ingester.save_ingestion_log()
    
    # Print summary
    print("\n" + "=" * 50)
    successful = sum(1 for log in ingester.ingestion_log if log["status"] == "success")
    failed = sum(1 for log in ingester.ingestion_log if log["status"] == "error")
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")


if __name__ == "__main__":
    asyncio.run(main())
