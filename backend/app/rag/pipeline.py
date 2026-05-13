"""
RAG pipeline orchestration
"""

from typing import List, Dict, Optional
from app.rag.vector_store import get_vector_store
from app.rag.embeddings import EmbeddingService, HybridRetriever, RerankerService
from app.rag.chunking import TextChunker, MetadataExtractor, TextCleaner


class RAGPipeline:
    """Main RAG pipeline orchestrator"""

    def __init__(self):
        self.vector_store = get_vector_store()
        self.embedding_service = EmbeddingService()
        self.retriever = HybridRetriever(self.vector_store, self.embedding_service)
        self.reranker = RerankerService()
        self.chunker = TextChunker()
        self.metadata_extractor = MetadataExtractor()
        self.text_cleaner = TextCleaner()

    async def ingest_document(
        self,
        document_text: str,
        source_name: str,
        metadata: Dict = None
    ) -> List[str]:
        """
        Ingest and process a document
        
        Args:
            document_text: Full document text
            source_name: Name of the source (book, chapter, etc.)
            metadata: Additional metadata
            
        Returns:
            List of document IDs created
        """
        # Clean text
        cleaned_text = self.text_cleaner.clean_text(document_text)

        # Extract metadata
        doc_metadata = self.metadata_extractor.extract_metadata(cleaned_text, source_name)
        if metadata:
            doc_metadata.update(metadata)

        # Chunk text
        chunks = self.chunker.chunk_text(cleaned_text, metadata=doc_metadata)

        # Generate embeddings
        chunk_texts = [chunk["text"] for chunk in chunks]
        embeddings = self.embedding_service.embed_texts(chunk_texts)

        # Add to vector store
        await self.vector_store.add_documents(chunks, embeddings)

        # Return document IDs
        return [chunk.get("id", f"{source_name}_{i}") for i, chunk in enumerate(chunks)]

    async def retrieve_context(
        self,
        query: str,
        top_k: int = 5,
        threshold: float = None
    ) -> List[Dict]:
        """
        Retrieve relevant context for a query
        
        Args:
            query: User query
            top_k: Number of results
            threshold: Minimum similarity threshold
            
        Returns:
            List of relevant documents
        """
        threshold = threshold or 0.5

        # Retrieve using hybrid method
        results = await self.retriever.retrieve(query, top_k=top_k * 2)

        # Filter by threshold
        results = [r for r in results if r.get("score", 0) >= threshold]

        # Rerank for better relevance
        reranked = self.reranker.rerank(query, results, top_k=top_k)

        return reranked

    async def clear_vector_store(self):
        """Clear all documents from vector store"""
        await self.vector_store.clear()

    def get_embedding_dimension(self) -> int:
        """Get embedding dimension"""
        return self.embedding_service.get_embedding_dimension()


# Global RAG pipeline instance
_rag_pipeline: Optional[RAGPipeline] = None


def get_rag_pipeline() -> RAGPipeline:
    """Get or create RAG pipeline instance"""
    global _rag_pipeline
    if _rag_pipeline is None:
        _rag_pipeline = RAGPipeline()
    return _rag_pipeline


def initialize_rag_pipeline():
    """Initialize RAG pipeline"""
    get_rag_pipeline()
