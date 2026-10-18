// ==================== GAME CONTENT ====================
// Beaker Blitz - Liam's 4th-grade Science Chapter 1 (How Scientists Work) study guide.
// Source: homework/liam/assignments/science-ch1/study-guide.md (test 10/22/26).
// Everything after "window.BB_CONTENT = " must stay valid JSON: generate_assets.py parses it
// to build the voice lines (voice/q_<id>.mp3, voice/fact_<id>.mp3, voice/bench_<key>.mp3, voice/n_<key>.mp3, ...).
window.BB_CONTENT = {
  "items": [
    { "id": "v_infer", "kind": "vocab", "label": "Infer", "fact": "To infer is to draw conclusions based on new information." },
    { "id": "v_evidence", "kind": "vocab", "label": "Evidence", "fact": "Evidence is information that comes from analyzing or finding patterns in observations and data, like numbers and measurements." },
    { "id": "v_observe", "kind": "vocab", "label": "Observe", "fact": "To observe is to use your senses to collect information about the world around you." },
    { "id": "v_model", "kind": "vocab", "label": "Model", "fact": "A model is a representation that can be used to explain or predict a natural system." },
    { "id": "v_hypothesis", "kind": "vocab", "label": "Hypothesis", "fact": "A hypothesis is an idea or explanation that can be tested by investigation." },
    { "id": "v_variable", "kind": "vocab", "label": "Variable", "fact": "A variable is a factor in an experiment that may change." },
    { "id": "v_experiment", "kind": "vocab", "label": "Experiment", "fact": "An experiment is a fair test where scientists control variables to test a hypothesis." },
    { "id": "v_investigation", "kind": "vocab", "label": "Investigation", "fact": "In an investigation, a scientist asks a question, plans a procedure to observe and collect data, and forms a conclusion." },

    { "id": "tf_lab_only", "kind": "tf", "label": "Scientists work ONLY in a lab (False)", "fact": "False! Scientists work in lots of places, not only in a lab or in books." },
    { "id": "tf_ancient", "kind": "tf", "label": "Ancient people used beliefs (True)", "fact": "True! Ancient people used their beliefs to explain what they observed." },
    { "id": "tf_methods", "kind": "tf", "label": "Different methods build evidence (True)", "fact": "True! Scientists use different methods to collect and analyze data to develop evidence." },
    { "id": "tf_class", "kind": "tf", "label": "An investigation called a class (False)", "fact": "False! A class is not a type of science investigation. Class is the trick word." },
    { "id": "tf_mixers", "kind": "tf", "label": "Experiments use mixers (False)", "fact": "False! Mixers is the trick word that makes this sentence false." },
    { "id": "tf_repeat", "kind": "tf", "label": "Scientists do NOT repeat tests (False)", "fact": "False! Scientists DO repeat their tests several times to make sure their results are accurate." },
    { "id": "tf_curious", "kind": "tf", "label": "Scientists are curious (True)", "fact": "True! Scientists are curious about the world around them." }
  ],

  "stages": [
    { "id": "observe", "name": "Observation Deck", "icon": "🔍", "focus": "Observe · Infer · Evidence", "intro": "Welcome to the Observation Deck! Scientists observe with their senses, and use evidence to infer.", "goal": 7, "bench": "observe" },
    { "id": "hypothesis", "name": "Idea Lab", "icon": "💡", "focus": "Hypothesis · Model · Investigation", "intro": "This is the Idea Lab. Here we make a hypothesis, build models, and plan an investigation.", "goal": 7, "bench": "steps" },
    { "id": "experiment", "name": "Test Chamber", "icon": "🧪", "focus": "Experiment · Variable", "intro": "The Test Chamber! An experiment is a fair test where scientists control the variables.", "goal": 7, "bench": "match" },
    { "id": "truefalse", "name": "True or False Lab", "icon": "⚖️", "focus": "7 True or False facts", "intro": "True or False Lab! Read every word carefully. One tricky word can make a sentence false.", "goal": 8, "bench": "trick" }
  ],

  "questions": [
    { "id": "o1", "stage": "observe", "item": "v_infer", "q": "To draw conclusions based on new information is to...", "a": "Infer", "wrong": ["Observe", "Model"] },
    { "id": "o2", "stage": "observe", "item": "v_infer", "q": "You see puddles and wet streets, so you decide it rained last night. What did you do?", "a": "Inferred", "wrong": ["Made a model", "Did an experiment"], "fact": "Seeing the puddles is observing. Deciding it rained is inferring: drawing a conclusion." },
    { "id": "o3", "stage": "observe", "item": "v_evidence", "q": "Information from finding patterns in observations and data is called...", "a": "Evidence", "wrong": ["A hypothesis", "A variable"] },
    { "id": "o4", "stage": "observe", "item": "v_evidence", "q": "Data such as numbers and measurements can become...", "a": "Evidence", "wrong": ["A model", "A guess"] },
    { "id": "o5", "stage": "observe", "item": "v_observe", "q": "Using your senses to collect information is to...", "a": "Observe", "wrong": ["Infer", "Predict"] },
    { "id": "o6", "stage": "observe", "item": "v_observe", "q": "Which one is OBSERVING?", "a": "Smelling a flower", "wrong": ["Guessing why it grew", "Making up a story"], "fact": "Smelling uses one of your senses, so it is observing." },
    { "id": "o7", "stage": "observe", "item": "v_observe", "q": "When you observe, you use your...", "a": "Senses", "wrong": ["Imagination", "Dreams"] },
    { "id": "o8", "stage": "observe", "item": "v_infer", "q": "Which word means to draw a conclusion?", "a": "Infer", "wrong": ["Observe", "Variable"] },

    { "id": "h1", "stage": "hypothesis", "item": "v_hypothesis", "q": "An idea or explanation that can be tested by investigation is a...", "a": "Hypothesis", "wrong": ["Model", "Variable"] },
    { "id": "h2", "stage": "hypothesis", "item": "v_hypothesis", "q": "Which one is a HYPOTHESIS?", "a": "Plants grow taller with more sunlight", "wrong": ["The plant is green", "I like plants"], "fact": "A hypothesis is an idea you can test. You can test if plants grow taller with more sunlight." },
    { "id": "h3", "stage": "hypothesis", "item": "v_hypothesis", "q": "A hypothesis is an idea that can be...", "a": "Tested", "wrong": ["Eaten", "Never checked"] },
    { "id": "h4", "stage": "hypothesis", "item": "v_model", "q": "A representation used to explain or predict a natural system is a...", "a": "Model", "wrong": ["Variable", "Hypothesis"] },
    { "id": "h5", "stage": "hypothesis", "item": "v_model", "q": "Which one is a MODEL?", "a": "A globe of Earth", "wrong": ["A real ocean", "A real mountain"], "fact": "A globe is a model. It represents the real Earth so we can learn about it." },
    { "id": "h6", "stage": "hypothesis", "item": "v_model", "q": "Scientists use models to explain or ____ a natural system.", "a": "Predict", "wrong": ["Destroy", "Paint"] },
    { "id": "h7", "stage": "hypothesis", "item": "v_investigation", "q": "Asking a question, planning a procedure, collecting data, and forming a conclusion is an...", "a": "Investigation", "wrong": ["Inference", "Observation"] },
    { "id": "h8", "stage": "hypothesis", "item": "v_investigation", "q": "In an investigation, what does a scientist do FIRST?", "a": "Asks a question", "wrong": ["Forms a conclusion", "Collects data"] },
    { "id": "h9", "stage": "hypothesis", "item": "v_investigation", "q": "At the END of an investigation, a scientist...", "a": "Forms a conclusion", "wrong": ["Asks a question", "Plans a procedure"] },

    { "id": "e1", "stage": "experiment", "item": "v_variable", "q": "A factor in an experiment that may change is a...", "a": "Variable", "wrong": ["Model", "Conclusion"] },
    { "id": "e2", "stage": "experiment", "item": "v_variable", "q": "You test if plants grow better with more water. The amount of water is the...", "a": "Variable", "wrong": ["Hypothesis", "Model"], "fact": "The amount of water is the factor that changes, so it is the variable." },
    { "id": "e3", "stage": "experiment", "item": "v_experiment", "q": "A fair test where scientists control variables to test a hypothesis is an...", "a": "Experiment", "wrong": ["Observation", "Inference"] },
    { "id": "e4", "stage": "experiment", "item": "v_experiment", "q": "An experiment is a ____ test.", "a": "Fair", "wrong": ["Silly", "Secret"] },
    { "id": "e5", "stage": "experiment", "item": "v_experiment", "q": "In an experiment, scientists test a...", "a": "Hypothesis", "wrong": ["Conclusion", "Sense"] },
    { "id": "e6", "stage": "experiment", "item": "v_experiment", "q": "In an experiment, scientists ____ the variables.", "a": "Control", "wrong": ["Ignore", "Lose"] },
    { "id": "e7", "stage": "experiment", "item": "v_variable", "q": "Which one could be a VARIABLE in a plant experiment?", "a": "How much light it gets", "wrong": ["The word plant", "The day of the week you write it down"], "fact": "How much light a plant gets is a factor that can change, so it can be a variable." },
    { "id": "e8", "stage": "experiment", "item": "v_evidence", "q": "The measurements you collect in an experiment become...", "a": "Evidence", "wrong": ["A variable", "A hypothesis"] },
    { "id": "e9", "stage": "experiment", "item": "v_hypothesis", "q": "First you make a hypothesis. Then you test it with an...", "a": "Experiment", "wrong": ["Inference", "Opinion"] },

    { "id": "t1", "stage": "truefalse", "item": "tf_lab_only", "q": "Scientists work ONLY in a lab or studying facts in books.", "a": "False", "wrong": ["True"] },
    { "id": "t2", "stage": "truefalse", "item": "tf_ancient", "q": "Ancient people used their beliefs to explain what they observed.", "a": "True", "wrong": ["False"] },
    { "id": "t3", "stage": "truefalse", "item": "tf_methods", "q": "Scientists use different methods to collect and analyze data to develop evidence.", "a": "True", "wrong": ["False"] },
    { "id": "t4", "stage": "truefalse", "item": "tf_class", "q": "Scientists may carry out a type of investigation called a class.", "a": "False", "wrong": ["True"] },
    { "id": "t5", "stage": "truefalse", "item": "tf_mixers", "q": "Experiments may involve the use of mixers.", "a": "False", "wrong": ["True"] },
    { "id": "t6", "stage": "truefalse", "item": "tf_repeat", "q": "Scientists do not repeat their tests several times to make sure they have accurate results.", "a": "False", "wrong": ["True"] },
    { "id": "t7", "stage": "truefalse", "item": "tf_curious", "q": "Scientists are curious about the world around them.", "a": "True", "wrong": ["False"] },
    { "id": "t8", "stage": "truefalse", "item": "tf_repeat", "q": "Scientists repeat their tests several times to get accurate results.", "a": "True", "wrong": ["False"], "fact": "True! Scientists DO repeat their tests. Watch out: on the test, the sentence says they do NOT, so that one is false." },
    { "id": "t9", "stage": "truefalse", "item": "tf_lab_only", "q": "Scientists can work outside, not just in a lab.", "a": "True", "wrong": ["False"], "fact": "True! Scientists work in lots of places. That's why ONLY in a lab is false." },
    { "id": "t10", "stage": "truefalse", "item": "tf_curious", "q": "Scientists do not care about the world around them.", "a": "False", "wrong": ["True"], "fact": "False! Scientists are curious about the world around them." },
    { "id": "t11", "stage": "truefalse", "item": "tf_ancient", "q": "Long ago, people used their beliefs to explain what they saw.", "a": "True", "wrong": ["False"], "fact": "True! Ancient people used their beliefs to explain what they observed." },
    { "id": "t12", "stage": "truefalse", "item": "tf_methods", "q": "Scientists use only one method to collect data.", "a": "False", "wrong": ["True"], "fact": "False! Scientists use different methods to collect and analyze data." }
  ],

  "benches": {
    "observe": {
      "type": "sort",
      "items": ["v_observe", "v_infer"],
      "title": "Observe or Infer?",
      "prompt": "Is it OBSERVING (using your senses) or INFERRING (drawing a conclusion)? Tap the right jar.",
      "bins": ["Observe", "Infer"],
      "cards": [
        { "text": "The leaf is green.", "bin": "Observe" },
        { "text": "The cookie smells sweet.", "bin": "Observe" },
        { "text": "The ice feels cold.", "bin": "Observe" },
        { "text": "I hear a dog barking.", "bin": "Observe" },
        { "text": "The ground is wet, so it must have rained.", "bin": "Infer" },
        { "text": "The dog is barking, so someone is at the door.", "bin": "Infer" },
        { "text": "Mom's car is in the driveway, so she is home.", "bin": "Infer" }
      ],
      "model": "To observe is to use your senses to collect information. To infer is to draw conclusions based on new information."
    },
    "steps": {
      "type": "order",
      "items": ["v_investigation"],
      "title": "Steps of an Investigation",
      "prompt": "Put the steps of an investigation in order. Tap the FIRST step first.",
      "steps": ["Ask a question", "Plan a procedure", "Observe and collect data", "Form a conclusion"],
      "model": "In an investigation, a scientist asks a question, plans a procedure to observe and collect data, and forms a conclusion."
    },
    "match": {
      "type": "match",
      "items": ["v_infer", "v_evidence", "v_observe", "v_model", "v_hypothesis", "v_variable", "v_experiment", "v_investigation"],
      "title": "Word Lab Match-Up",
      "prompt": "Read the meaning, then tap the vocabulary word that matches.",
      "model": "Great work! Those are all 8 vocabulary words on your test."
    },
    "trick": {
      "type": "trick",
      "items": ["tf_lab_only", "tf_class", "tf_mixers", "tf_repeat"],
      "title": "Spot the Trick Word",
      "prompt": "Each sentence is FALSE. Tap the word that makes it false.",
      "sentences": [
        { "item": "tf_lab_only", "text": "Scientists work ONLY in a lab or studying facts in books.", "trick": ["only"], "why": "Scientists work in lots of places, not ONLY in a lab." },
        { "item": "tf_class", "text": "Scientists may carry out a type of investigation called a class.", "trick": ["class"], "why": "A class is where you learn. It is not a type of investigation." },
        { "item": "tf_mixers", "text": "Experiments may involve the use of mixers.", "trick": ["mixers"], "why": "Mixers is the word that makes this sentence false." },
        { "item": "tf_repeat", "text": "Scientists do not repeat their tests several times to make sure they have accurate results.", "trick": ["not", "do"], "why": "Scientists DO repeat their tests to make sure their results are accurate." }
      ],
      "model": "Test tip: in a true or false question, look for one word that makes the sentence wrong, like only, not, or a word that doesn't belong."
    }
  },

  "practice": {
    "fill": [
      { "item": "v_infer", "before": "To draw conclusions based on new information is to", "after": ".", "answers": ["infer"], "show": "infer" },
      { "item": "v_evidence", "before": "Information that comes from analyzing or finding patterns in observations and data such as numbers and measurements is called", "after": ".", "answers": ["evidence"], "show": "evidence" },
      { "item": "v_observe", "before": "To", "after": "is called using your senses to collect information about the world around you.", "answers": ["observe"], "show": "observe" },
      { "item": "v_model", "before": "A", "after": "is a representation that can be used to explain or predict a natural system.", "answers": ["model"], "show": "model" },
      { "item": "v_hypothesis", "before": "A", "after": "is an idea or explanation that can be tested by investigation.", "answers": ["hypothesis"], "show": "hypothesis" },
      { "item": "v_variable", "before": "A factor in an experiment that may change is called a", "after": ".", "answers": ["variable"], "show": "variable" },
      { "item": "v_experiment", "before": "A fair test, or process in which scientists control variables to test a hypothesis is called an", "after": ".", "answers": ["experiment"], "show": "experiment" },
      { "item": "v_investigation", "before": "A scientist asks a question, plans a procedure to observe and collect data, and forms a conclusion. This is called an", "after": ".", "answers": ["investigation"], "show": "investigation" }
    ],
    "tf": [
      { "item": "tf_lab_only", "text": "Scientists work ONLY in a lab or studying facts in books.", "answer": false },
      { "item": "tf_ancient", "text": "Ancient people used their beliefs to explain what they observed.", "answer": true },
      { "item": "tf_methods", "text": "Scientists use different methods to collect and analyze data to develop evidence.", "answer": true },
      { "item": "tf_class", "text": "Scientists may carry out a type of investigation called a class.", "answer": false },
      { "item": "tf_mixers", "text": "Experiments may involve the use of mixers.", "answer": false },
      { "item": "tf_repeat", "text": "Scientists do not repeat their tests several times to make sure they have accurate results.", "answer": false },
      { "item": "tf_curious", "text": "Scientists are curious about the world around them.", "answer": true }
    ]
  },

  "narration": {
    "welcome": "Hi, scientist! I'm Doctor Fizz. Let's catch the right answers and get ready for your science test!",
    "stage_observe": "Welcome to the Observation Deck! Scientists observe with their senses, and use evidence to infer.",
    "stage_hypothesis": "This is the Idea Lab. Here we make a hypothesis, build models, and plan an investigation.",
    "stage_experiment": "The Test Chamber! An experiment is a fair test where scientists control the variables.",
    "stage_truefalse": "True or False Lab! Read every word carefully. One tricky word can make a sentence false.",
    "boss": "It's time for the Big Experiment! Catch the right answers to fuel the rocket and blast off!",
    "victory": "Blast off! You launched the rocket, scientist! You're ready for that science test!",
    "practice_intro": "This is just like the real test. Take your time and do your best!"
  }
};
