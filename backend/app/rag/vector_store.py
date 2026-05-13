"""
Vector store abstraction for different backends
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Tuple, Optional
from app.config import get_settings

settings = get_settings()


class VectorStore(ABC):
    """Abstract base class for vector stores"""

    @abstractmethod
    async def add_documents(self, documents: List[Dict], embeddings: List[List[float]]):
        """Add documents with embeddings"""
        pass

    @abstractmethod
    async def search(self, query_embedding: List[float], top_k: int = 5) -> List[Dict]:
        """Search for similar documents"""
        pass

    @abstractmethod
    async def delete_document(self, document_id: str):
        """Delete a document"""
        pass

    @abstractmethod
    async def clear(self):
        """Clear all documents"""
        pass


class PineconeVectorStore(VectorStore):
    """Pinecone vector store implementation"""

    def __init__(self):
        try:
            import pinecone
            self.pinecone = pinecone
            self.index = pinecone.Index(settings.PINECONE_INDEX_NAME)
        except ImportError:
            raise ImportError("pinecone-client is required for Pinecone support")

    async def add_documents(self, documents: List[Dict], embeddings: List[List[float]]):
        """Add documents to Pinecone"""
        vectors_to_upsert = []
        for doc, embedding in zip(documents, embeddings):
            vector = (
                doc.get("id", ""),
                embedding,
                {
                    "text": doc.get("text", ""),
                    "book": doc.get("book_name", ""),
                    "chapter": doc.get("chapter_name", ""),
                    "verse": doc.get("verse_number", ""),
                    "source_id": doc.get("source_id", ""),
                }
            )
            vectors_to_upsert.append(vector)

        if vectors_to_upsert:
            self.index.upsert(vectors=vectors_to_upsert)

    async def search(self, query_embedding: List[float], top_k: int = 5) -> List[Dict]:
        """Search in Pinecone"""
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True
        )
        return [
            {
                "id": match["id"],
                "score": match["score"],
                "metadata": match.get("metadata", {})
            }
            for match in results.get("matches", [])
        ]

    async def delete_document(self, document_id: str):
        """Delete from Pinecone"""
        self.index.delete(ids=[document_id])

    async def clear(self):
        """Clear Pinecone index"""
        self.index.delete(delete_all=True)


class ChromaDBVectorStore(VectorStore):
    """ChromaDB vector store implementation"""

    def __init__(self):
        try:
            import chromadb
            self.chromadb = chromadb
            self.client = chromadb.PersistentClient(path=settings.CHROMADB_PATH)
            self.collection = self.client.get_or_create_collection(
                name="ayurgpt",
                metadata={"hnsw:space": "cosine"}
            )
        except ImportError:
            raise ImportError("chromadb is required for ChromaDB support")

    async def add_documents(self, documents: List[Dict], embeddings: List[List[float]]):
        """Add documents to ChromaDB"""
        ids = [doc.get("id", "") for doc in documents]
        metadatas = [
            {
                "book": doc.get("book_name", ""),
                "chapter": doc.get("chapter_name", ""),
                "verse": doc.get("verse_number", ""),
                "source_id": doc.get("source_id", ""),
            }
            for doc in documents
        ]
        texts = [doc.get("text", "") for doc in documents]

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=texts
        )

    async def search(self, query_embedding: List[float], top_k: int = 5) -> List[Dict]:
        """Search in ChromaDB"""
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        return [
            {
                "id": meta.get("source_id", ""),
                "score": 1 - distance,  # Convert distance to similarity score
                "metadata": meta,
                "text": doc
            }
            for doc, meta, distance in zip(documents, metadatas, distances)
        ]

    async def delete_document(self, document_id: str):
        """Delete from ChromaDB"""
        self.collection.delete(ids=[document_id])

    async def clear(self):
        """Clear ChromaDB"""
        # Delete collection and recreate
        self.client.delete_collection(name="ayurgpt")
        self.collection = self.client.get_or_create_collection(
            name="ayurgpt",
            metadata={"hnsw:space": "cosine"}
        )


def get_vector_store() -> VectorStore:
    """Factory function to get appropriate vector store"""
    if settings.VECTOR_DB_TYPE == "pinecone":
        return PineconeVectorStore()
    elif settings.VECTOR_DB_TYPE == "chromadb":
        return ChromaDBVectorStore()
    else:
        raise ValueError(f"Unknown vector DB type: {settings.VECTOR_DB_TYPE}")
