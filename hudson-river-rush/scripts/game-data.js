// ==================== GAME CONTENT ====================
// Hudson River Rush - Liam's 4th-grade Social Studies Chapter 1 (New York) study guide.
// Source: homework/liam/assignments/social-studies-ch1/study-guide.md (test 10/1/26).
// Everything after "window.HRR_CONTENT = " must stay valid JSON: generate_assets.py parses it
// to build the voice lines (voice/q_<id>.mp3, voice/fact_<id>.mp3, voice/model_<id>.mp3, voice/n_<id>.mp3).
window.HRR_CONTENT = {
  "items": [
    { "id": "v_natural_resource", "kind": "vocab", "label": "Natural resource", "fact": "A natural resource is something found in nature that people can use." },
    { "id": "v_region", "kind": "vocab", "label": "Region", "fact": "A region is an area with common features that set it apart from other areas." },
    { "id": "v_conservation", "kind": "vocab", "label": "Conservation", "fact": "Conservation is the careful use of natural resources." },
    { "id": "v_precipitation", "kind": "vocab", "label": "Precipitation", "fact": "Precipitation is the moisture that falls as rain, snow, sleet, or hail." },
    { "id": "v_continent", "kind": "vocab", "label": "Continent", "fact": "A continent is one of Earth's seven great bodies of land." },

    { "id": "k_northeast", "kind": "fact", "label": "NY is in the Northeast", "fact": "New York is located in the Northeast." },
    { "id": "k_hudson", "kind": "fact", "label": "Longest river: Hudson", "fact": "The longest river in New York is the Hudson." },
    { "id": "k_metro", "kind": "fact", "label": "Most people: Metro NY & Long Island", "fact": "Metro New York and Long Island have the most people." },
    { "id": "k_salt", "kind": "fact", "label": "Syracuse: salt", "fact": "Salt gave Syracuse its nickname, the Salt City." },
    { "id": "k_lake_effect", "kind": "fact", "label": "Lake-effect snow", "fact": "Lake Erie and Lake Ontario produce lake-effect snow." },
    { "id": "k_trees", "kind": "fact", "label": "Trees are important", "fact": "Trees are an important natural resource in New York." },
    { "id": "k_weather_varies", "kind": "fact", "label": "Weather varies by region", "fact": "Weather and climate vary from region to region in New York." },
    { "id": "k_shipping", "kind": "fact", "label": "Early industries", "fact": "Early industries in New York were shipping and trading." },
    { "id": "k_niagara", "kind": "fact", "label": "Niagara Falls: Western NY", "fact": "Niagara Falls is located in Western New York." },
    { "id": "k_adirondacks", "kind": "fact", "label": "Largest region: Adirondacks", "fact": "The Adirondacks is the largest region in New York." },
    { "id": "k_erie", "kind": "fact", "label": "Western NY borders Lake Erie", "fact": "Western New York borders Lake Erie." },

    { "id": "c_location", "kind": "critical", "label": "Describe NY's location", "fact": "New York is in the Western Hemisphere, on the continent of North America, in the country of the United States, in the Northeast region." },
    { "id": "c_renewable", "kind": "critical", "label": "Are trees renewable? Why?", "fact": "Trees are renewable, because people plant young trees to replace the ones they cut down." },
    { "id": "c_weather_climate", "kind": "critical", "label": "Weather vs. climate", "fact": "Weather is the conditions from day to day. Climate is the pattern of weather over many years." },
    { "id": "c_resources", "kind": "critical", "label": "3 resources & the economy", "fact": "Trees, farmland, and water are three natural resources that help New York's economy." }
  ],

  "legs": [
    { "id": "harbor", "name": "New York Harbor", "region": "Metro New York & Long Island", "intro": "We start in New York Harbor, where more people live than anywhere else in the state. Let's sail north!", "goal": 7, "dock": "location" },
    { "id": "hudson", "name": "The Mighty Hudson", "region": "Hudson Valley", "intro": "This is the Hudson, the longest river in New York. Long ago, boats carried goods up and down it to trade.", "goal": 7, "dock": "resources" },
    { "id": "adirondacks", "name": "Into the Adirondacks", "region": "Adirondacks", "intro": "The river climbs into the Adirondacks, the biggest region in New York. Watch out for logs!", "goal": 7, "dock": "renewable" },
    { "id": "canal", "name": "Erie Canal to Syracuse", "region": "Central New York", "intro": "We turn west onto the Erie Canal and float past Syracuse, the Salt City, and lots of dairy farms.", "goal": 7, "dock": "weather" },
    { "id": "niagara", "name": "Lake Erie & Niagara Falls", "region": "Western New York", "intro": "Western New York! Lake Erie makes lake-effect snow, so watch for snow clouds. Niagara Falls is ahead!", "goal": 6, "dock": "boss" }
  ],

  "questions": [
    { "id": "h1", "leg": "harbor", "item": "k_metro", "q": "Which region of New York has the MOST people?", "a": "Metro NY & Long Island", "wrong": ["The Adirondacks", "Western New York"] },
    { "id": "h2", "leg": "harbor", "item": "k_northeast", "q": "New York is in which part of the United States?", "a": "The Northeast", "wrong": ["The Southwest", "The West Coast"] },
    { "id": "h3", "leg": "harbor", "item": "c_location", "q": "New York is in which hemisphere?", "a": "Western Hemisphere", "wrong": ["Eastern Hemisphere", "Southern Hemisphere"] },
    { "id": "h4", "leg": "harbor", "item": "c_location", "q": "New York is on which continent?", "a": "North America", "wrong": ["South America", "Europe"] },
    { "id": "h5", "leg": "harbor", "item": "c_location", "q": "New York is in which country?", "a": "United States", "wrong": ["Canada", "Mexico"] },
    { "id": "h6", "leg": "harbor", "item": "v_continent", "q": "A continent is one of Earth's seven great bodies of...", "a": "Land", "wrong": ["Water", "Ice"] },
    { "id": "h7", "leg": "harbor", "item": "v_continent", "q": "How many continents are on Earth?", "a": "Seven", "wrong": ["Five", "Twelve"] },
    { "id": "h8", "leg": "harbor", "item": "v_region", "q": "An area with common features that set it apart from other areas is a...", "a": "Region", "wrong": ["Continent", "Resource"] },
    { "id": "h9", "leg": "harbor", "item": "k_metro", "q": "New York City and Long Island have the greatest number of...", "a": "People", "wrong": ["Mountains", "Cows"] },

    { "id": "u1", "leg": "hudson", "item": "k_hudson", "q": "What is the LONGEST river in New York?", "a": "The Hudson River", "wrong": ["The Mohawk River", "The Genesee River"] },
    { "id": "u2", "leg": "hudson", "item": "k_shipping", "q": "What were New York's EARLY industries?", "a": "Shipping and trading", "wrong": ["Video games", "Space travel"] },
    { "id": "u3", "leg": "hudson", "item": "k_shipping", "q": "Why were rivers like the Hudson so important long ago?", "a": "Boats carried goods to trade", "wrong": ["They were only for swimming", "They made snow"], "fact": "Early industries in New York were shipping and trading, so boats on rivers were very important." },
    { "id": "u4", "leg": "hudson", "item": "v_natural_resource", "q": "Something found in nature that people can use is a...", "a": "Natural resource", "wrong": ["Region", "Continent"] },
    { "id": "u5", "leg": "hudson", "item": "v_natural_resource", "q": "Which one is a natural resource?", "a": "Water", "wrong": ["A plastic toy", "A video game"] },
    { "id": "u6", "leg": "hudson", "item": "c_resources", "q": "How have New York's lakes and rivers helped its economy?", "a": "They helped trade", "wrong": ["They stopped all trade", "They grew trees"], "fact": "New York's lakes and rivers have played a key role in trade throughout history." },
    { "id": "u7", "leg": "hudson", "item": "k_hudson", "q": "The Hudson is the ____ river in New York.", "a": "Longest", "wrong": ["Shortest", "Newest"] },

    { "id": "a1", "leg": "adirondacks", "item": "k_adirondacks", "q": "Which region of New York is the LARGEST in size?", "a": "The Adirondacks", "wrong": ["Long Island", "Western New York"] },
    { "id": "a2", "leg": "adirondacks", "item": "k_trees", "q": "Which is an important natural resource in New York?", "a": "Trees", "wrong": ["Volcanoes", "Deserts"] },
    { "id": "a3", "leg": "adirondacks", "item": "c_renewable", "q": "Are trees a renewable or nonrenewable resource?", "a": "Renewable", "wrong": ["Nonrenewable", "Not a resource"] },
    { "id": "a4", "leg": "adirondacks", "item": "c_renewable", "q": "WHY are trees a renewable resource?", "a": "Young trees are planted to replace them", "wrong": ["Trees last forever", "Trees can't be cut down"] },
    { "id": "a5", "leg": "adirondacks", "item": "c_resources", "q": "What is made from tree sap?", "a": "Maple syrup", "wrong": ["Cheese", "Salt"], "fact": "Tree sap is used to make maple syrup." },
    { "id": "a6", "leg": "adirondacks", "item": "c_resources", "q": "Logging companies cut down trees to build...", "a": "Houses and furniture", "wrong": ["Cars and trucks", "Glass windows"], "fact": "Logging companies cut down trees to build houses and furniture." },
    { "id": "a7", "leg": "adirondacks", "item": "v_conservation", "q": "The careful use of natural resources is called...", "a": "Conservation", "wrong": ["Precipitation", "Region"] },
    { "id": "a8", "leg": "adirondacks", "item": "v_conservation", "q": "Which one is an example of conservation?", "a": "Planting new trees", "wrong": ["Wasting water", "Cutting down every tree"] },
    { "id": "a9", "leg": "adirondacks", "item": "c_resources", "q": "Some woodlands are used for recreation, like...", "a": "Hiking", "wrong": ["Shopping", "Bowling"], "fact": "Some woodlands are used for recreation, such as hiking." },

    { "id": "c1", "leg": "canal", "item": "k_salt", "q": "Which natural resource gave Syracuse its nickname?", "a": "Salt", "wrong": ["Gold", "Oil"] },
    { "id": "c2", "leg": "canal", "item": "k_salt", "q": "Syracuse's nickname is the ____ City.", "a": "Salt", "wrong": ["Sugar", "Snow"] },
    { "id": "c3", "leg": "canal", "item": "v_precipitation", "q": "Rain, snow, sleet, or hail falling from the sky is called...", "a": "Precipitation", "wrong": ["Conservation", "Climate"] },
    { "id": "c4", "leg": "canal", "item": "v_precipitation", "q": "Which one is NOT a kind of precipitation?", "a": "Wind", "wrong": ["Sleet", "Hail"] },
    { "id": "c5", "leg": "canal", "item": "k_weather_varies", "q": "In New York, weather and climate...", "a": "Vary from region to region", "wrong": ["Are the same everywhere", "Never change"] },
    { "id": "c6", "leg": "canal", "item": "c_weather_climate", "q": "The temperature and conditions from DAY TO DAY is called...", "a": "Weather", "wrong": ["Climate", "A region"] },
    { "id": "c7", "leg": "canal", "item": "c_weather_climate", "q": "The pattern of weather over MANY YEARS is called...", "a": "Climate", "wrong": ["Weather", "Precipitation"] },
    { "id": "c8", "leg": "canal", "item": "c_resources", "q": "Dairy farms use farmland to graze cattle and produce...", "a": "Milk", "wrong": ["Maple syrup", "Lumber"], "fact": "Dairy farms use farmland to graze cattle and produce milk." },
    { "id": "c9", "leg": "canal", "item": "c_resources", "q": "Which foods are made from milk?", "a": "Cheese, butter, yogurt", "wrong": ["Bread, pasta, rice", "Apples, pears, grapes"], "fact": "Cheese, butter, and yogurt are made from milk." },

    { "id": "n1", "leg": "niagara", "item": "k_niagara", "q": "Where is Niagara Falls located?", "a": "Western New York", "wrong": ["Long Island", "The Adirondacks"] },
    { "id": "n2", "leg": "niagara", "item": "k_erie", "q": "Which lake does Western New York border?", "a": "Lake Erie", "wrong": ["Lake Michigan", "Lake Champlain"] },
    { "id": "n3", "leg": "niagara", "item": "k_lake_effect", "q": "Lake Erie and Lake Ontario produce...", "a": "Lake-effect snow", "wrong": ["Hurricanes", "Desert heat"] },
    { "id": "n4", "leg": "niagara", "item": "k_lake_effect", "q": "Which two lakes make lake-effect snow?", "a": "Lake Erie & Lake Ontario", "wrong": ["Lake George & Lake Placid", "Lake Tahoe & Lake Mead"] },
    { "id": "n5", "leg": "niagara", "item": "c_resources", "q": "What does the power of water at Niagara Falls make?", "a": "Electricity", "wrong": ["Maple syrup", "Salt"], "fact": "The power of water at Niagara Falls makes electricity." },
    { "id": "n6", "leg": "niagara", "item": "c_resources", "q": "Moving water can be used to create...", "a": "Electricity", "wrong": ["Lumber", "Milk"], "fact": "Water can create electricity." }
  ],

  "docks": {
    "location": {
      "type": "slots",
      "item": "c_location",
      "title": "Build New York's Address",
      "prompt": "Describe the location of New York using hemisphere, continent, country, and region.",
      "slots": [
        { "label": "Hemisphere", "answer": "Western Hemisphere" },
        { "label": "Continent", "answer": "North America" },
        { "label": "Country", "answer": "United States" },
        { "label": "Region", "answer": "Northeast" }
      ],
      "tiles": ["Western Hemisphere", "Eastern Hemisphere", "North America", "Europe", "United States", "Canada", "Northeast", "Southwest"],
      "model": "New York is located in the Western Hemisphere on the continent of North America, which is in the country of the United States in the Northeast Region."
    },
    "resources": {
      "type": "sort",
      "item": "c_resources",
      "title": "Resource Match-Up",
      "prompt": "Which natural resource does each one come from? Tap the right crate.",
      "bins": ["Trees", "Farmland", "Water"],
      "cards": [
        { "text": "Lumber to build houses and furniture", "bin": "Trees" },
        { "text": "Maple syrup", "bin": "Trees" },
        { "text": "Hiking in the woods", "bin": "Trees" },
        { "text": "Cows graze and make milk", "bin": "Farmland" },
        { "text": "Cheese, butter, and yogurt", "bin": "Farmland" },
        { "text": "Electricity at Niagara Falls", "bin": "Water" },
        { "text": "Boats trading on lakes and rivers", "bin": "Water" }
      ],
      "model": "Trees: woodlands are used for hiking, logging companies cut trees to build houses and furniture, and tree sap makes maple syrup. Farmland: dairy farms graze cattle and produce milk, and cheese, butter, and yogurt are made from milk. Water: the power of water at Niagara Falls makes electricity, and lakes and rivers have been important for trade."
    },
    "renewable": {
      "type": "steps",
      "item": "c_renewable",
      "title": "Renewable or Not?",
      "prompt": "Are trees a renewable or nonrenewable resource? Why?",
      "steps": [
        { "q": "Trees are a...", "a": "Renewable resource", "wrong": ["Nonrenewable resource"] },
        { "q": "How do people use trees?", "a": "Lumber for houses and furniture", "wrong": ["To make metal", "To make plastic"] },
        { "q": "Why are they renewable?", "a": "People plant young trees to replace them", "wrong": ["Trees never get cut down", "Trees grow back in one day"] }
      ],
      "model": "Trees are renewable resources because we use trees for lumber to build houses and make furniture. Afterward, they plant young trees to replace them."
    },
    "weather": {
      "type": "sort",
      "item": "c_weather_climate",
      "title": "Weather or Climate?",
      "prompt": "Is it WEATHER (day to day) or CLIMATE (the pattern over many years)?",
      "bins": ["Weather", "Climate"],
      "cards": [
        { "text": "It is raining in Syracuse today.", "bin": "Weather" },
        { "text": "Tomorrow will be sunny and 70 degrees.", "bin": "Weather" },
        { "text": "A thunderstorm this afternoon", "bin": "Weather" },
        { "text": "Buffalo gets lots of snow every winter, year after year.", "bin": "Climate" },
        { "text": "Summers in New York are usually warm.", "bin": "Climate" },
        { "text": "The pattern of weather over many years", "bin": "Climate" },
        { "text": "The temperature from day to day", "bin": "Weather" }
      ],
      "model": "Weather is the temperature and conditions in a certain place from day to day. Climate is the pattern of weather in a certain place over many years."
    }
  },

  "practice": {
    "vocab": [
      { "item": "v_natural_resource", "def": "Something found in nature that people can use.", "word": "Natural resource" },
      { "item": "v_region", "def": "An area with common features that set it apart from other areas.", "word": "Region" },
      { "item": "v_conservation", "def": "The careful use of natural resources.", "word": "Conservation" },
      { "item": "v_precipitation", "def": "The amount of moisture that falls as rain, snow, sleet, or hail.", "word": "Precipitation" },
      { "item": "v_continent", "def": "One of Earth's seven great bodies of land.", "word": "Continent" }
    ],
    "fill": [
      { "item": "k_northeast", "before": "New York is located in the", "after": ".", "answers": ["northeast"], "show": "Northeast" },
      { "item": "k_hudson", "before": "The longest river in New York is the", "after": ".", "answers": ["hudson", "hudson river"], "show": "Hudson" },
      { "item": "k_metro", "before": "The region of New York with the greatest number of people is", "after": "and Long Island.", "answers": ["metro new york", "metro ny", "metro", "new york city", "nyc"], "show": "Metro-New York" },
      { "item": "k_salt", "before": "The natural resource that gave Syracuse its nickname is", "after": ".", "answers": ["salt"], "show": "salt" },
      { "item": "k_lake_effect", "before": "Lake Erie and Lake Ontario produce", "after": "snow.", "answers": ["lake effect", "lakeeffect", "lake"], "show": "lake-effect" },
      { "item": "k_trees", "before": "", "after": "are an important natural resource in New York.", "answers": ["trees", "tree"], "show": "Trees" },
      { "item": "k_weather_varies", "before": "Weather and climate vary from", "after": "to region in New York.", "answers": ["region"], "show": "region" },
      { "item": "k_shipping", "before": "Early industries in New York were", "after": "and trading.", "answers": ["shipping"], "show": "shipping" },
      { "item": "k_niagara", "before": "Niagara Falls is located in", "after": "New York.", "answers": ["western"], "show": "Western" },
      { "item": "k_adirondacks", "before": "The region in New York largest in size is the", "after": ".", "answers": ["adirondacks", "adirondack", "adirondack mountains"], "show": "Adirondacks" },
      { "item": "k_erie", "before": "Western New York borders Lake", "after": ".", "answers": ["erie"], "show": "Erie" }
    ],
    "critical": [
      {
        "item": "c_location",
        "q": "Describe the location of New York, using the words hemisphere, continent, country, and region.",
        "checks": [
          { "label": "Western Hemisphere", "any": ["western"] },
          { "label": "Continent: North America", "any": ["north america"] },
          { "label": "Country: United States", "any": ["united states", "usa", "u s a", "u s"] },
          { "label": "Region: Northeast", "any": ["northeast", "north east"] }
        ],
        "model": "New York is located in the Western Hemisphere on the continent of North America, which is in the country of the United States in the Northeast Region."
      },
      {
        "item": "c_renewable",
        "q": "Are trees a renewable or nonrenewable resource? Why?",
        "checks": [
          { "label": "Says trees are renewable", "any": ["renewable"], "none": ["nonrenewable", "non renewable", "not renewable"] },
          { "label": "How we use them (lumber, houses, furniture)", "any": ["lumber", "house", "furniture", "wood", "build", "paper"] },
          { "label": "Why: young trees are planted to replace them", "any": ["plant", "replace", "grow"] }
        ],
        "model": "Trees are renewable resources because we use trees for lumber to build houses and make furniture. Afterward, they plant young trees to replace them."
      },
      {
        "item": "c_weather_climate",
        "q": "Explain the difference between weather and climate.",
        "checks": [
          { "label": "Weather is day to day", "any": ["day"] },
          { "label": "Climate is a pattern over many years", "any": ["year", "pattern", "long time"] },
          { "label": "Uses both words: weather and climate", "all": ["weather", "climate"] }
        ],
        "model": "Weather is the temperature and conditions in a certain place from day to day. Climate is the pattern of weather in a certain place over many years."
      },
      {
        "item": "c_resources",
        "q": "Describe three natural resources of New York and how each has helped the state's economy.",
        "checks": [
          { "label": "Trees", "any": ["tree", "wood", "forest", "lumber", "logging"] },
          { "label": "Farmland", "any": ["farm", "dairy", "cow", "cattle"] },
          { "label": "Water", "any": ["water", "lake", "river", "niagara"] },
          { "label": "How they help (syrup, furniture, milk, electricity, trade...)", "any": ["syrup", "furniture", "house", "hiking", "milk", "cheese", "butter", "yogurt", "electric", "trade", "trading"] }
        ],
        "model": "Trees: some woodlands are used for hiking, logging companies cut down trees to build houses and furniture, and tree sap is used to make maple syrup. Farmland: dairy farms use it to graze cattle and produce milk, and cheese, butter, and yogurt are made from milk. Water: the power of water at Niagara Falls makes electricity, and New York's lakes and rivers have played a key role in trade."
      }
    ]
  },

  "narration": {
    "welcome": "Ahoy, Captain! I'm Otis the otter. Let's sail across New York and get ready for your big test!",
    "leg_harbor": "We start in New York Harbor, where more people live than anywhere else in the state. Let's sail north!",
    "leg_hudson": "This is the Hudson, the longest river in New York. Long ago, boats carried goods up and down it to trade.",
    "leg_adirondacks": "The river climbs into the Adirondacks, the biggest region in New York. Watch out for logs!",
    "leg_canal": "We turn west onto the Erie Canal and float past Syracuse, the Salt City, and lots of dairy farms.",
    "leg_niagara": "Western New York! Lake Erie makes lake-effect snow, so watch for snow clouds. Niagara Falls is ahead!",
    "dock": "Time to dock! Let's practice a big test question.",
    "boss": "Here come the Niagara rapids! Answer fast to power up the falls and light up the city!",
    "victory": "You did it, Captain! You sailed all the way to Niagara Falls. You're ready for that test!",
    "great": "Great job!",
    "nice": "Nice steering!",
    "oops": "Oops! Let's remember this one.",
    "practice_intro": "This is just like the real test. Take your time and do your best!"
  }
};
