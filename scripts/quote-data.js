// One shared collection for homepage.html and quotes.html.
// Existing text, credits, and attribution qualifications are preserved.
// Add Matthew's own explanation to each empty reason field when supplied.
const quotes = [
    {
        "text": "A man chooses. A slave obeys.",
        "author": "Andrew Ryan",
        "work": "BioShock (2007)",
        "credit": "",
        "id": "q01",
        "reason": ""
    },
    {
        "text": "I chose the impossible.",
        "author": "Andrew Ryan",
        "work": "BioShock (2007)",
        "credit": "Introductory recording",
        "id": "q02",
        "reason": ""
    },
    {
        "text": "What is better—to be born good, or to overcome your evil nature through great effort?",
        "author": "Paarthurnax",
        "work": "The Elder Scrolls V: Skyrim (2011)",
        "credit": "",
        "id": "q03",
        "reason": ""
    },
    {
        "text": "If not us, then who?",
        "author": "Spartan Rangers’ motto",
        "work": "Metro video-game series",
        "credit": "",
        "id": "q04",
        "reason": ""
    },
    {
        "text": "From the moment I understood the weakness of my flesh, it disgusted me. I craved the strength and certainty of steel.",
        "author": "Magos-Dominus Reditus",
        "work": "Warhammer 40,000: Mechanicus (2018)",
        "credit": "Teaser-trailer monologue",
        "id": "q05",
        "reason": ""
    },
    {
        "text": "Even the waves of fate can break upon the shores of will.",
        "author": "Elminster Aumar",
        "work": "Baldur’s Gate 3 (2023)",
        "credit": "",
        "id": "q06",
        "reason": ""
    },
    {
        "text": "Do not be sorry. Be better.",
        "author": "Kratos",
        "work": "God of War (2018)",
        "credit": "",
        "id": "q07",
        "reason": ""
    },
    {
        "text": "I came to this place to build the impossible.",
        "author": "Andrew Ryan",
        "work": "BioShock (2007)",
        "credit": "Arcadia radio message",
        "id": "q08",
        "reason": ""
    },
    {
        "text": "Life is not measured in years, but by the deeds of men.",
        "author": "Unattributed Imperial quotation",
        "work": "Warhammer 40,000: Rogue Trader (1987)",
        "credit": "Tabletop rulebook, p. 113",
        "id": "q09",
        "reason": ""
    },
    {
        "text": "Courage is to look your fear in the eye and know that it has no dominion over you!",
        "author": "Will Anthonio Zeppeli",
        "work": "JoJo’s Bizarre Adventure (2012), episode 4, “Overdrive”",
        "credit": "English dub",
        "id": "q10",
        "reason": ""
    },
    {
        "text": "The sheer impossibility of a quest is no reason to abandon it.",
        "author": "Ignace Karkasy",
        "work": "False Gods",
        "credit": "Graham McNeill",
        "note": "Excerpt from a longer sentence.",
        "id": "q11",
        "reason": ""
    },
    {
        "text": "Not because I can win, but because it is right.",
        "author": "Sanguinius",
        "work": "Echoes of Eternity",
        "credit": "Aaron Dembski-Bowden",
        "id": "q12",
        "reason": ""
    },
    {
        "text": "All we need do is make a good choice, see it through and accept the consequences.",
        "author": "Solomon Demeter",
        "work": "Fulgrim",
        "credit": "Graham McNeill",
        "id": "q13",
        "reason": ""
    },
    {
        "text": "Death comes for us all. What we do while it approaches is the only freedom we have.",
        "author": "Speaker not established",
        "work": "Belisarius Cawl: The Great Work",
        "credit": "Guy Haley",
        "note": "Provisional attribution: the book attribution has not been verified against the novel.",
        "id": "q14",
        "reason": ""
    },
    {
        "text": "Ten thousand victories have started with a retreat. The only dishonour is in not coming back.",
        "author": "Vorgha Khan, White Scars 8th Company",
        "work": "Codex Supplement: White Scars (8th edition)",
        "credit": "p. 19",
        "id": "q15",
        "reason": ""
    },
    {
        "text": "We cannot avoid risk, my friend, for if we do, we achieve nothing.",
        "author": "Horus Lupercal",
        "work": "False Gods",
        "credit": "Graham McNeill",
        "id": "q16",
        "reason": ""
    },
    {
        "text": "The only good is knowledge and the only evil is ignorance.",
        "author": "Ahzek Ahriman",
        "work": "A Thousand Sons",
        "credit": "Graham McNeill",
        "note": "Credited to Ahriman in the book’s epigraph.",
        "id": "q17",
        "reason": ""
    },
    {
        "text": "Cage your mind with the possible and you have stolen your own future.",
        "author": "Magnus the Red",
        "work": "Ahriman: Sorcerer",
        "credit": "John French",
        "id": "q18",
        "reason": ""
    },
    {
        "text": "Every experience is an opportunity to learn.",
        "author": "Ahzek Ahriman",
        "work": "A Thousand Sons",
        "credit": "Graham McNeill",
        "id": "q19",
        "reason": ""
    },
    {
        "text": "Hard-won knowledge is of no value unless it is put into practice.",
        "author": "Magnus the Red",
        "work": "A Thousand Sons",
        "credit": "Graham McNeill",
        "id": "q20",
        "reason": ""
    },
    {
        "text": "Were I to await perfection, my work would never be finished.",
        "author": "Ostian Delafour",
        "work": "Fulgrim",
        "credit": "Graham McNeill",
        "id": "q21",
        "reason": ""
    },
    {
        "text": "If I am guilty of anything, it is the simple pursuit of knowledge.",
        "author": "Magnus the Red",
        "work": "A Thousand Sons",
        "credit": "Graham McNeill",
        "id": "q22",
        "reason": ""
    },
    {
        "text": "It is not simplicity, … It is clarity of purpose.",
        "author": "Magnus the Red",
        "work": "A Thousand Sons",
        "credit": "Graham McNeill",
        "note": "The ellipsis omits intervening narration.",
        "id": "q23",
        "reason": ""
    },
    {
        "text": "Wicked phenomenon, yes? But, you know, it’s not any more \"evil\" than, say… fire. It all depends on your point of view. Try to get a better understanding of things before you make your judgement.",
        "author": "Khan",
        "work": "Metro 2033 (video game)",
        "credit": "“Anomaly” level",
        "id": "q24",
        "reason": ""
    }
];
