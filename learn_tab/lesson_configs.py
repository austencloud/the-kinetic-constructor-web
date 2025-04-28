from data.constants import LETTER


LESSON_CONFIGS = {
    "pictograph_to_letter": {
        "title": "Pictograph to Letter",
        "description": "Learn to identify the letter represented by a pictograph",
        "question_format": "pictograph",
        "answer_format": "button",
        "quiz_description": "pictograph_to_letter",
        "question_prompt": "Choose the letter for:",
        "options": {
            "num_options": 5,
            "randomize_options": True
        }
    },
    "letter_to_pictograph": {
        "title": "Letter to Pictograph",
        "description": "Learn to identify the pictograph that represents a given letter",
        "question_format": LETTER,
        "answer_format": "pictograph",
        "quiz_description": "letter_to_pictograph",
        "question_prompt": "Choose the pictograph for:",
        "options": {
            "num_options": 4,
            "randomize_options": True
        }
    },
    "valid_next_pictograph": {
        "title": "Valid Next Pictograph",
        "description": "Learn to identify which pictograph can logically follow another",
        "question_format": "pictograph",
        "answer_format": "pictograph",
        "quiz_description": "valid_next_pictograph",
        "question_prompt": "Which pictograph can follow?",
        "options": {
            "num_options": 4,
            "randomize_options": True
        }
    },
    "turns": {
        "title": "Turn Recognition",
        "description": "Learn to identify clockwise and counterclockwise turns in pictographs",
        "question_format": "pictograph",
        "answer_format": "button",
        "quiz_description": "turns",
        "question_prompt": "Identify the turn pattern:",
        "options": {
            "num_options": 3,
            "randomize_options": True
        }
    },
    "positions": {
        "title": "Position Recognition",
        "description": "Learn to recognize the positions represented in pictographs",
        "question_format": "pictograph",
        "answer_format": "button",
        "quiz_description": "positions",
        "question_prompt": "Identify the position:",
        "options": {
            "num_options": 4,
            "randomize_options": True
        }
    }
}
