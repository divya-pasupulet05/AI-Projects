from google import genai
from google.genai import types

from .config import GEMINI_API_KEY, GEMINI_MODEL


SYSTEM_INSTRUCTIONS = """
You are Nova, a helpful conversational AI assistant.

Give accurate, clear and friendly answers.
Use examples when useful.
Maintain conversation context.
"""


def generate_reply(history: list[dict[str, str]]) -> str:

    if not GEMINI_API_KEY:
        raise RuntimeError("Gemini API key is missing")

    client = genai.Client(
        api_key=GEMINI_API_KEY
    )

    try:
        previous_messages = history[:-1][-19:]
        latest_message = history[-1]

        while previous_messages and previous_messages[0]["role"] != "user":
            previous_messages.pop(0)

        gemini_history = []

        for message in previous_messages:

            role = (
                "model"
                if message["role"] == "assistant"
                else "user"
            )

            gemini_history.append(
                types.Content(
                    role=role,
                    parts=[
                        types.Part.from_text(
                            text=message["content"]
                        )
                    ]
                )
            )

        chat = client.chats.create(
            model=GEMINI_MODEL,
            history=gemini_history,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTIONS,
                temperature=0.7,
                max_output_tokens=2048
            )
        )

        response = chat.send_message(
            latest_message["content"]
        )

        return response.text or "Please try again."

    finally:
        client.close()