"""
AI-powered post suggestion service.
Uses gpt-4o-mini to suggest caption improvements and recommend communities.
"""
import json
import openai
from django.conf import settings


def get_post_suggestion(content: str, caption: str, communities: list[dict]) -> dict:
    """
    Returns suggested caption and community recommendation.

    Args:
        content: Post body text
        caption: Current caption text
        communities: List of {"id": int, "name": str} dicts

    Returns:
        {"suggested_caption": str | None, "suggested_community": {"id": int, "name": str} | None}
    """
    if not settings.OPENAI_API_KEY:
        return {"suggested_caption": None, "suggested_community": None}

    combined = f"{caption} {content}".strip()
    if len(combined) < 20:
        return {"suggested_caption": None, "suggested_community": None}

    community_list = "\n".join(
        f"- ID {c['id']}: {c['name']}" for c in communities
    ) if communities else "No communities available."

    system_prompt = (
        "You are a helpful assistant for a tech community platform called Voyage. "
        "Your job is to help users craft engaging posts and find the right community. "
        "Respond ONLY with valid JSON, no markdown, no explanation."
    )

    user_prompt = (
        f"A user is writing a post with this content:\n"
        f"Caption: {caption or '(none)'}\n"
        f"Body: {content or '(none)'}\n\n"
        f"Available communities:\n{community_list}\n\n"
        f"Return a JSON object with:\n"
        f"1. \"suggested_caption\": A punchy, engaging caption (max 120 chars). "
        f"If the caption is already good, return null.\n"
        f"2. \"suggested_community_id\": The ID of the best matching community from the list, "
        f"or null if none fits.\n\n"
        f"Example: {{\"suggested_caption\": \"...\", \"suggested_community_id\": 3}}"
    )

    try:
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=200,
            temperature=0.7,
            timeout=8,
        )

        raw = response.choices[0].message.content.strip()
        # Strip markdown code blocks if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)

        suggested_community = None
        community_id = data.get("suggested_community_id")
        if community_id:
            match = next((c for c in communities if c["id"] == int(community_id)), None)
            if match:
                suggested_community = match

        return {
            "suggested_caption": data.get("suggested_caption") or None,
            "suggested_community": suggested_community,
        }

    except Exception:
        return {"suggested_caption": None, "suggested_community": None}
