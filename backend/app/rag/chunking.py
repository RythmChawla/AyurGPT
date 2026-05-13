"""
Text chunking and preprocessing utilities
"""

import re
from typing import List, Dict
from app.config import get_settings

settings = get_settings()


class TextChunker:
    """Handles intelligent text chunking"""

    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    def chunk_text(
        self,
        text: str,
        metadata: Dict = None,
        preserve_chapters: bool = True
    ) -> List[Dict]:
        """
        Chunk text intelligently, preserving structure
        
        Args:
            text: Text to chunk
            metadata: Metadata to attach to each chunk
            preserve_chapters: Try to split at chapter boundaries
            
        Returns:
            List of chunk dictionaries with metadata
        """
        chunks = []

        # Try to detect and preserve chapter boundaries
        if preserve_chapters:
            sections = self._split_by_chapters(text)
        else:
            sections = [text]

        for section in sections:
            section_chunks = self._chunk_section(section)
            for i, chunk in enumerate(section_chunks):
                chunk_dict = {
                    "text": chunk,
                    "chunk_id": i,
                    **(metadata or {})
                }
                chunks.append(chunk_dict)

        return chunks

    def _split_by_chapters(self, text: str) -> List[str]:
        """Split text by common chapter patterns"""
        # Patterns for detecting chapter boundaries
        chapter_patterns = [
            r"(?i)chapter\s+\d+",
            r"(?i)sthana\s+\d+",
            r"(?i)adhyaya\s+\d+",
            r"(?i)part\s+\d+",
        ]

        for pattern in chapter_patterns:
            if re.search(pattern, text):
                sections = re.split(f"({pattern})", text)
                # Recombine pattern with text
                result = []
                for i in range(1, len(sections), 2):
                    if i + 1 < len(sections):
                        result.append(sections[i] + sections[i + 1])
                return result if result else [text]

        return [text]

    def _chunk_section(self, text: str) -> List[str]:
        """Chunk a section using sliding window"""
        sentences = self._sentence_split(text)
        chunks = []
        current_chunk = []
        current_length = 0

        for sentence in sentences:
            sentence_length = len(sentence.split())

            if current_length + sentence_length > self.chunk_size:
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                    # Overlap
                    current_chunk = current_chunk[-self._get_overlap_sentences(current_chunk):]
                    current_length = sum(len(s.split()) for s in current_chunk)

            current_chunk.append(sentence)
            current_length += sentence_length

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks

    def _sentence_split(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip()]

    def _get_overlap_sentences(self, sentences: List[str]) -> int:
        """Calculate how many sentences to overlap"""
        total_words = sum(len(s.split()) for s in sentences)
        overlap_words = min(self.chunk_overlap, int(total_words * 0.2))
        
        overlap_count = 0
        word_count = 0
        for sentence in reversed(sentences):
            word_count += len(sentence.split())
            overlap_count += 1
            if word_count >= overlap_words:
                break
        return overlap_count


class MetadataExtractor:
    """Extract metadata from Ayurvedic texts"""

    @staticmethod
    def extract_metadata(text: str, source_name: str = "") -> Dict:
        """Extract metadata like book, chapter, verse from text"""
        metadata = {
            "book_name": source_name,
            "chapter_name": None,
            "verse_number": None,
        }

        # Try to extract chapter
        chapter_match = re.search(r"(?:Chapter|Sthana|Adhyaya)\s*(?:No\.?|#)?(?:\s*)(\d+)", text, re.IGNORECASE)
        if chapter_match:
            metadata["chapter_name"] = chapter_match.group(1)

        # Try to extract verse
        verse_match = re.search(r"(?:Verse|Shloka|Sutra)\s*(?:No\.?|#)?(?:\s*)(\d+\.?\d*)", text, re.IGNORECASE)
        if verse_match:
            metadata["verse_number"] = verse_match.group(1)

        return metadata


class TextCleaner:
    """Clean and normalize text"""

    @staticmethod
    def clean_text(text: str) -> str:
        """Clean text for processing"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep spaces and punctuation
        text = re.sub(r'[^\w\s.\,\!\?\(\)\-]', '', text)
        
        # Remove standalone numbers that might be page numbers
        text = re.sub(r'\b\d+\b', '', text)
        
        return text.strip()

    @staticmethod
    def normalize_sanskrit(text: str) -> str:
        """Normalize Sanskrit text variations"""
        # Common Sanskrit transliteration variations
        replacements = {
            'ā': 'a',
            'ī': 'i',
            'ū': 'u',
            'ē': 'e',
            'ō': 'o',
            'ñ': 'n',
            'ṁ': 'm',
            'ḥ': 'h',
        }
        
        for original, replacement in replacements.items():
            text = text.replace(original, replacement)
        
        return text
