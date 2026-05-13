"""
Chatbot service with RAG integration
"""

from typing import List, Dict, Optional
from app.rag.pipeline import get_rag_pipeline
from app.config import get_settings

settings = get_settings()


class ChatbotService:
    """Service for chatbot responses with RAG"""

    def __init__(self):
        self.rag_pipeline = None
        self.llm_client = self._init_llm()

    def _init_llm(self):
        """Initialize Groq through the OpenAI-compatible client."""
        if not settings.GROQ_API_KEY:
            print("Warning: GROQ_API_KEY is not set; chatbot will use fallback responses")
            return None

        try:
            from openai import OpenAI
            return OpenAI(
                api_key=settings.GROQ_API_KEY,
                base_url=settings.GROQ_BASE_URL,
            )
        except ImportError:
            raise ImportError("openai is required for Groq OpenAI-compatible LLM support")
        except Exception as e:
            print(f"Warning: Groq LLM initialization failed: {e}")
            return None

    async def generate_response(
        self,
        query: str,
        user_context: Optional[Dict] = None,
        use_rag: bool = True
    ) -> Dict:
        """
        Generate chatbot response
        
        Args:
            query: User query
            user_context: User context (Dosha profile, etc.)
            use_rag: Whether to use RAG
            
        Returns:
            Response with content and sources
        """
        response = {
            "content": "",
            "sources": [],
            "confidence": 0.0
        }

        # Retrieve context if RAG enabled
        sources = []
        if use_rag and settings.RAG_ENABLED:
            try:
                if self.rag_pipeline is None:
                    self.rag_pipeline = get_rag_pipeline()
                sources = await self.rag_pipeline.retrieve_context(query)
            except Exception as e:
                print(f"RAG retrieval error: {e}")
                sources = []

        # If no LLM client, return educational message
        if not self.llm_client:
            response["content"] = (
                "Thanks for your interest in Ayurvedic wellness! "
                "This AyurGPT platform provides educational information about Ayurvedic concepts, "
                "herbs, doshas, and wellness approaches. "
                "For medical concerns, please consult a qualified Ayurvedic practitioner or healthcare professional."
            )
            return response

        # Build system prompt
        system_prompt = self._build_system_prompt(user_context)

        # Build context for LLM
        context_str = self._format_context(sources)

        # Build messages
        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": f"{context_str}\n\nUser Query: {query}"
            }
        ]

        # Call LLM
        try:
            completion = self.llm_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                temperature=settings.TEMPERATURE,
                max_tokens=settings.MAX_TOKENS,
                stream=False
            )

            response["content"] = completion.choices[0].message.content
            response["sources"] = sources
            response["confidence"] = min(1.0, len(sources) * 0.2 + 0.5)  # Rough estimate

        except Exception as e:
            response["content"] = (
                "I encountered an issue generating a response. "
                "Please try rephrasing your question or try again in a moment."
            )
            print(f"Groq LLM error: {e}")

        return response

    async def stream_response(
        self,
        query: str,
        user_context: Optional[Dict] = None
    ):
        """
        Stream chatbot response
        
        Args:
            query: User query
            user_context: User context
            
        Yields:
            Response chunks
        """
        # Retrieve context
        sources = []
        if settings.RAG_ENABLED:
            try:
                if self.rag_pipeline is None:
                    self.rag_pipeline = get_rag_pipeline()
                sources = await self.rag_pipeline.retrieve_context(query)
            except Exception as e:
                print(f"RAG retrieval error: {e}")
                sources = []

        if not self.llm_client:
            yield (
                "Thanks for your interest in Ayurvedic wellness! "
                "This AyurGPT platform provides educational information."
            )
            return

        # Build prompts
        system_prompt = self._build_system_prompt(user_context)
        context_str = self._format_context(sources)

        # Build messages
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"{context_str}\n\nUser Query: {query}"}
        ]

        # Stream from LLM
        try:
            with self.llm_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                temperature=settings.TEMPERATURE,
                max_tokens=settings.MAX_TOKENS,
                stream=True
            ) as response:
                for chunk in response:
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content

                # Yield sources at the end
                if sources:
                    yield f"\n\n**Sources:**\n{self._format_sources(sources)}"

        except Exception as e:
            yield f"Error: {str(e)}"

    def _build_system_prompt(self, user_context: Optional[Dict] = None) -> str:
        """Build system prompt for chatbot"""
        base_prompt = """You are AyurGPT, an AI-powered Ayurvedic wellness assistant. 

Your role is to provide educational information about Ayurvedic wellness concepts from classical texts.

IMPORTANT RULES:
1. ONLY answer based on the provided context from Ayurvedic texts
2. Always cite sources for your information
3. NEVER diagnose diseases or replace medical advice
4. NEVER prescribe medications or dosages
5. Be conversational and helpful
6. If information is not in the context, say "I could not find this information in the Ayurvedic knowledge base"
7. Always include a disclaimer that this is for educational purposes only

SAFETY:
- For serious symptoms (chest pain, seizures, severe bleeding), immediately recommend professional help
- Never claim absolute certainty about medical conditions
- Encourage consulting with qualified Ayurvedic practitioners
"""

        if user_context and user_context.get("primary_dosha"):
            dosha = user_context.get("primary_dosha", "")
            base_prompt += f"\n\nUser's Primary Dosha: {dosha}\nTailor recommendations to this constitution when relevant."

        return base_prompt

    def _format_context(self, sources: List[Dict]) -> str:
        """Format retrieved context for LLM"""
        if not sources:
            return "No context found in knowledge base."

        context = "CONTEXT FROM AYURVEDIC TEXTS:\n\n"
        for i, source in enumerate(sources[:5], 1):
            metadata = source.get("metadata", {})
            text = source.get("text", "")
            score = source.get("score", 0)

            context += f"{i}. {metadata.get('book', 'Unknown Source')}"
            if metadata.get("chapter"):
                context += f" - {metadata.get('chapter')}"
            if metadata.get("verse"):
                context += f", Verse {metadata.get('verse')}"
            context += f" (Confidence: {score:.2%})\n"
            context += f"   {text[:200]}...\n\n"

        return context

    def _format_sources(self, sources: List[Dict]) -> str:
        """Format sources for display"""
        if not sources:
            return "No sources found"

        result = ""
        for source in sources:
            metadata = source.get("metadata", {})
            result += f"- {metadata.get('book', 'Unknown')}"
            if metadata.get("chapter"):
                result += f" ({metadata.get('chapter')})"
            if metadata.get("verse"):
                result += f" - Verse {metadata.get('verse')}"
            result += "\n"

        return result
