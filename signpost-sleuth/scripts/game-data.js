// ==================== GAME CONTENT ====================
// Signpost Sleuth - Emma's 6th-grade ELA lesson "Notice & Note Strategy" (Mrs. Burda, 10/6/26, quiz Fri 10/9).
// Source: homework/emma/assignments/ela-notice-and-note/source/slides.txt (Notice & Note 2023.pptx).
// Everything after "window.PS_CONTENT = " must stay valid JSON: generate_assets.py parses it for voice lines.
window.PS_CONTENT = {
  "signposts": [
    {
      "id": "cc", "name": "Contrasts & Contradictions", "short": "Contrasts", "icon": "puzzle", "color": "#f59e0b",
      "when": "A character says or does something that is opposite (contradicts) what he has been saying or doing all along.",
      "ask": "Why is the character doing that?",
      "tells": "The answer could help you make a prediction or an inference about the plot and conflict.",
      "tellsShort": "A prediction or inference about the plot and conflict",
      "clues": ["acts out of character", "never ... but today", "always ... until"],
      "example": "In Frozen, Elsa hides her ice powers for years. Then, alone on the mountain, she shows them off on purpose."
    },
    {
      "id": "aha", "name": "Aha Moment", "short": "Aha", "icon": "bulb", "color": "#eab308",
      "when": "A character suddenly realizes, understands, or finally figures something out.",
      "ask": "How might this change things?",
      "tells": "If the character figured out a problem, you learned about the conflict. If the character understood a life lesson, you probably learned the theme.",
      "tellsShort": "The conflict (a problem solved) or the theme (a life lesson learned)",
      "clues": ["suddenly realized", "finally understood", "it hit me", "now I knew"],
      "example": "In Inside Out, Joy finally realizes that Riley needs Sadness, too."
    },
    {
      "id": "tq", "name": "Tough Questions", "short": "Tough Q's", "icon": "question", "color": "#ef4444",
      "when": "A character asks himself a really difficult question.",
      "ask": "What does this question make me wonder about?",
      "tells": "The answers tell you about the conflict and might give you ideas about what will happen later in the story.",
      "tellsShort": "The conflict and what might happen later",
      "clues": ["What should I do?", "How could I ever...?", "Should I...or...?"],
      "example": "A character lies awake asking, \"Should I tell the truth, even if my best friend gets in trouble?\""
    },
    {
      "id": "ww", "name": "Words of the Wiser", "short": "Wiser", "icon": "lips", "color": "#8b5cf6",
      "when": "A character (who is probably older and wiser) takes the main character aside and gives serious advice.",
      "ask": "What's the life lesson, and how might it affect the character?",
      "tells": "Whatever the lesson is, you've probably found a theme for the story.",
      "tellsShort": "The theme (the life lesson) of the story",
      "clues": ["grandparent, coach, or teacher", "pulls the character aside", "serious advice"],
      "example": "In The Lion King, Rafiki tells Simba, \"The past can hurt. But you can either run from it, or learn from it.\""
    },
    {
      "id": "aa", "name": "Again & Again", "short": "Again", "icon": "plus", "color": "#10b981",
      "when": "A word, phrase, object, or situation is mentioned over and over.",
      "ask": "Why does this keep showing up again and again?",
      "tells": "The answers tell you about the theme and conflict, or they might foreshadow what will happen later.",
      "tellsShort": "The theme and conflict, or foreshadowing of what will happen later",
      "clues": ["the same word or phrase", "the same object", "the same situation"],
      "example": "In Finding Nemo, Dory says \"Just keep swimming\" every time things get hard."
    },
    {
      "id": "mm", "name": "Memory Moment", "short": "Memory", "icon": "camera", "color": "#0ea5e9",
      "when": "The author interrupts the action to tell you a memory.",
      "ask": "Why might this memory be important?",
      "tells": "The answers tell you about the theme or conflict, or might foreshadow what will happen later in the story.",
      "tellsShort": "The theme or conflict, or foreshadowing of what will happen later",
      "clues": ["I remembered when...", "years ago...", "it reminded her of..."],
      "example": "In Up, the story flashes back to Carl's whole life with Ellie."
    }
  ],

  "goodReaders": {
    "steps": ["STOP", "NOTICE", "NOTE"],
    "why": "Good readers are alert to the signposts that authors provide. When they see a signpost, they stop, take notice, and make a note. Because of this, they understand what they read better, and they understand and appreciate the author's craft as a writer."
  },

  "school": {
    "tellsDistractors": [
      "The setting: where and when the story happens",
      "How many pages are left in the book",
      "The author's favorite color",
      "How old the main character is",
      "The title of the next chapter"
    ],
    "defDistractors": [
      "The author describes the weather in a lot of detail.",
      "A new chapter begins.",
      "The story ends with a happy ending.",
      "A character is introduced for the first time."
    ]
  },

  "quiz": {
    "identify": [
      { "id": "i1", "text": "Ms. Grant, the strictest teacher in school, burst out laughing and joined the students' snowball fight.", "answer": "cc" },
      { "id": "i2", "text": "As I stared at the broken vase, I finally realized why my cat had been hiding all afternoon.", "answer": "aha" },
      { "id": "i3", "text": "\"Listen, kiddo,\" Aunt Rosa said, sitting beside me on the steps. \"Being kind is never a waste of time, even when nobody notices.\"", "answer": "ww" },
      { "id": "i4", "text": "How could I choose between my two best friends when they both needed me on the same day?", "answer": "tq" },
      { "id": "i5", "text": "The silver whistle showed up again: first in Grandpa's drawer, then in the old photo, and now in Max's dream.", "answer": "aa" },
      { "id": "i6", "text": "The thunder made Owen think of the night his family lost power for a week and huddled together telling stories by candlelight.", "answer": "mm" },
      { "id": "i7", "text": "Kenji, who had quit piano three times, sat down at the keyboard on his own and practiced for two hours.", "answer": "cc" },
      { "id": "i8", "text": "Was it my fault the team lost? Could I have done something different?", "answer": "tq" }
    ],
    "understand": [
      { "id": "u1", "item": "ww_tells", "q": "When you notice Words of the Wiser, you have probably found the story's...", "a": "Theme (life lesson)", "wrong": ["Setting", "Title"] },
      { "id": "u2", "item": "aha_tells", "q": "An Aha Moment where a character figures out a problem tells you about the...", "a": "Conflict", "wrong": ["Setting", "Author"] },
      { "id": "u3", "item": "aa_tells", "q": "Again & Again and Memory Moments can foreshadow. Foreshadow means they...", "a": "Hint at what will happen later", "wrong": ["Tell what happened before the book", "Describe the setting"] },
      { "id": "u4", "item": "cc_tells", "q": "Contrasts & Contradictions help you make a ____ about the plot and conflict.", "a": "Prediction or inference", "wrong": ["Drawing", "Summary of the ending"] },
      { "id": "u5", "item": "why", "q": "When good readers see a signpost, they...", "a": "Stop, notice, and note", "wrong": ["Skip ahead to the ending", "Close the book and rest"] }
    ],
    "written": {
      "item": "why",
      "q": "Why is it important to stop and notice and take note while you read?",
      "checks": [
        { "label": "Helps you understand the story better", "any": ["understand", "comprehend", "make sense", "figure out", "follow", "remember"] },
        { "label": "Notices the author's signposts or craft", "any": ["author", "craft", "signpost", "sign", "clue", "writer"] },
        { "label": "Connects to theme, conflict, or predictions", "any": ["theme", "conflict", "predict", "lesson", "happen next", "inference", "infer", "foreshadow"] }
      ],
      "model": "Stopping to notice and note signposts helps me understand what I read better. Signposts are clues the author leaves on purpose, so noticing them helps me appreciate the author's craft and figure out the conflict, the theme, and what might happen next."
    }
  },

  "narration": {
    "welcome": "Hi, Detective Emma! I'm Sage. Authors hide signposts in their stories, and good readers stop, notice, and note them. Let's get you ready for Friday's quiz!",
    "school_intro": "Each signpost has a sign, a moment to watch for, and a question to ask. Learn all six to earn your badges.",
    "case_intro": "Read the story one paragraph at a time. When you spot a signpost, tap that sentence to stop. But careful, detective: false alarms cost points!",
    "missed": "Whoa, we drove right past a signpost! Let's take a look.",
    "false_stop": "Hmm, that's just the story moving along. Keep reading!",
    "speed_intro": "Signs are coming fast! Tap the right signpost for each moment. Build a combo for big points!",
    "quiz_intro": "This is just like Friday's quiz. Take your time and do your best!",
    "jot_intro": "This is your Stop and Jot notebook. When you notice a signpost in your own book, write it down here in your own words. Be ready to share!",
    "great": "Great detective work!",
    "oops": "Not quite. Let's look at the clues.",
    "victory": "Case closed! You found every kind of signpost. You're ready for Friday!"
  }
};
