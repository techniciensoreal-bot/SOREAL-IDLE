/*
 * Resource 3 Name Randomizer (Boutique AP, 100 000 AP). Wiki NGU Idle, page « Resource 3 Name Randomizer » (ngu-idle.fandom.com/wiki/Resource_3_Name_Randomizer, vérifiée le 2026-10-12) :
 * « an option that enables to change the name of your Resource 3 every time you rebirth, it will randomly pick an incredibly smart and witty name from a pool of over 200 names! »
 * La page publie la liste complète (« The Witty Names », 235 noms, fournie par l'utilisateur Sancdar) : elle est reprise telle quelle (vérifiée nom par nom le 2026-10-12), SAUF les noms à connotation sexuelle explicite
 * ou trop crus (liste IDLE_R3_NOMS_EXCLUS_V1), écartés pour un jeu de bureau sur demande de Norman ; il en reste plus de 200, comme annoncé par le wiki (« a pool of over 200 names »).
 */
export const IDLE_R3_NOMS_EXCLUS_V1 = Object.freeze([
  /* à connotation sexuelle explicite */
  "Bonerfart", "Boob", "Libido", "Lewd", "Lube", "MILF", "Myanus", "Orgy", "Prostate", "Queef", "Rectum", "Sexy", "Wenis", "Sixty Nine", "Uranus",
  /* trop crus : toilettes, drogue, grossièretés (Norman, 2026-10-12 : « laisse les noms trop crus de côté ») */
  "Butt", "Baby Poop", "Barf", "Bong", "Weed", "Vape", "Balls On A Cliff", "Beaver", "Your Mom", "Crappier Energy", "Crappier Magic", "Body Odor", "Stank"
]);

const NOMS_WIKI = [
  "AllanDeleteThis", "Amish", "Angst", "Anime", "Anti", "Antimatter", "Ape", "Austin", "Baba", "Baby Poop", "Bacon", "Balls On A Cliff", "Banana", "Bananana", "Banananana", "Barber", "Barf",
  "Beaver", "Bepis", "Billy", "Bloodydoops", "Bob", "Body Odor", "Bonerfart", "Bong", "Boob", "Boy", "Brain", "Breakout", "Brian", "Burger", "Butt", "BUY AP PLZ", "Camel", "Canadian",
  "Capitalism", "Caramel", "Cheeseburger", "Chocolate", "Cockroach", "Communism", "Conspiracy", "Cookie", "Copyright", "Cosmos", "Crank", "Crappier Energy", "Crappier Magic", "Crusade",
  "Crystal", "Dankness", "Denial", "Depression", "Dice", "Dictionary", "Dimension", "Disco", "Dive", "Doge", "Dork", "Dust", "Dweeb", "Earth", "Edgy", "Egg", "Endless", "ERROR", "Ethereal",
  "Factory", "Feminine", "Fez", "Fire", "Fish", "Flea", "Float", "Flower", "Foo", "Frank", "Friendship", "Fusion", "Garbage", "Gasoline", "Geothermal", "GGGG", "Ginger", "Ginormo", "Girl",
  "Glaive Guisarme", "Glitter", "Godly", "Gold", "Goth", "Grammar", "Granola", "Grease", "Great", "Groovy", "Gun", "Gusto", "Hard", "Hero", "Hexagon", "High", "Horse", "Hydroelectric",
  "Idiot", "I Have The", "Imaginary", "Iron", "Japan", "Jaunty", "Jeff", "Jerk", "Keyboard Goop", "Kidney", "Kitten", "Kitty", "Knee", "Krunk", "Lawyer", "Lewd", "Libido", "Low", "Lube",
  "MagicalEnergy", "Maple Syrup", "Market", "Masculine", "Max", "Meat", "Meat Shoes", "Mediocre", "Mega", "Meme", "MILF", "Minion", "Mintemdo", "MMMMMultipass", "Monkey", "Moose", "Mosquito",
  "Moxie", "Myanus", "Nacho", "Nerd", "Nerf", "NGU", "Noob", "Not", "Nuclear", "Nyan", "Orgy", "Over", "paC", "Paperclip", "Party", "Political", "Potato", "Prostate", "Psi", "Puppy", "Quark",
  "Queef", "raB", "Random", "Raw", "Rectum", "Recursive", "Reference", "Resource", "Resource Three", "rewoP", "Rocket", "Rubber", "Rune", "Sellout", "Sexy", "SharkGame", "Shmeerp", "Shower",
  "Sin", "Sixty Nine", "Skull", "Smarm", "Smash", "Sneaker", "Soda", "Soft", "Solar", "Space", "Square", "Squat", "Stairs", "Stank", "Star", "Steam", "Steamed Hams", "Steel", "Sugar", "Super",
  "Supermega", "Superstar", "Swag", "Swarm", "Sweat", "Taco", "Tap", "Tax", "Tear", "Thesaurus", "Thinking", "Tick", "Tim", "Tool", "Triangle", "Trimp", "Troll", "Typo", "Under", "UNLIMITED",
  "Uranus", "Vape", "Veto", "Water", "Weak", "Weeaboo", "Weed", "Wenis", "Whine", "Wind", "Wizard", "Wombat", "Yolo", "Your Mom", "Zsdgasgdfh"
];

export const IDLE_R3_NOMS_V1 = Object.freeze(
  Array.from(new Set(NOMS_WIKI)).filter((n) => !IDLE_R3_NOMS_EXCLUS_V1.includes(n))
);
