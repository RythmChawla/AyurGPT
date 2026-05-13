"""
Embedding generation and management
"""

from typing import List, Optional
from app.config import get_settings

settings = get_settings()


class EmbeddingService:
    """Service for generating and managing embeddings"""

    def __init__(self):
        self.model = self._load_model()
        self.fallback_dimension = 384

    def _load_model(self):
        """Load embedding model"""
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer(settings.EMBEDDING_MODEL)
            return model
        except ImportError:
            raise ImportError("sentence-transformers is required for embeddings")
        except Exception as exc:
            print(f"Warning: embedding model unavailable: {exc}")
            return None

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        if self.model is None:
            return [0.0] * self.fallback_dimension

        embedding = self.model.encode(text, convert_to_tensor=False)
        return embedding.tolist() if hasattr(embedding, 'tolist') else list(embedding)

    def embed_texts(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        if self.model is None:
            return [[0.0] * self.fallback_dimension for _ in texts]

        embeddings = self.model.encode(texts, batch_size=batch_size, show_progress_bar=True)
        return [e.tolist() if hasattr(e, 'tolist') else list(e) for e in embeddings]

    def get_embedding_dimension(self) -> int:
        """Get embedding dimension"""
        if self.model is None:
            return self.fallback_dimension

        return self.model.get_sentence_embedding_dimension()


class HybridRetriever:
    """Hybrid retrieval combining semantic and BM25 search"""

    def __init__(self, vector_store, embedding_service):
        self.vector_store = vector_store
        self.embedding_service = embedding_service

    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        semantic_weight: float = 0.7,
        use_bm25: bool = False
    ) -> List[dict]:
        """
        Retrieve documents using hybrid search
        
        Args:
            query: Search query
            top_k: Number of results
            semantic_weight: Weight for semantic search (0-1)
            use_bm25: Whether to use BM25
            
        Returns:
            List of retrieved documents with scores
        """
        results = []

        # Semantic search
        query_embedding = self.embedding_service.embed_text(query)
        semantic_results = await self.vector_store.search(query_embedding, top_k=top_k)

        # Combine results (BM25 would be added here in production)
        results = semantic_results

        # Sort by score
        results = sorted(results, key=lambda x: x.get("score", 0), reverse=True)

        return results[:top_k]


class RerankerService:
    """Rerank retrieved documents for better relevance"""

    def __init__(self):
        self.model = self._load_reranker()

    def _load_reranker(self):
        """Load cross-encoder reranking model"""
        try:
            from sentence_transformers import CrossEncoder
            model = CrossEncoder('cross-encoder/qnli-distilroberta-base')
            return model
        except ImportError:
            # Fallback to no reranking
            return None
        except Exception as exc:
            print(f"Warning: reranker unavailable: {exc}")
            return None

    def rerank(
        self,
        query: str,
        documents: List[dict],
        top_k: int = 5
    ) -> List[dict]:
        """
        Rerank documents based on query relevance
        
        Args:
            query: Search query
            documents: Documents to rerank
            top_k: Number of results to return
            
        Returns:
            Reranked documents
        """
        if self.model is None:
            return documents[:top_k]

        # Prepare pairs for reranking
        pairs = [[query, doc.get("metadata", {}).get("text", doc.get("text", ""))] for doc in documents]

        # Get scores
        scores = self.model.predict(pairs)

        # Add scores to documents
        for doc, score in zip(documents, scores):
            doc["rerank_score"] = float(score)

        # Sort by rerank score
        reranked = sorted(documents, key=lambda x: x.get("rerank_score", 0), reverse=True)

        return reranked[:top_k]
