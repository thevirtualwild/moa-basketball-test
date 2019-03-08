var firstNames = ["Runny", "Happy", "Dinky", "Stinky", "Crusty",
  "Greasy", "Playful", "Smooth", "Lumpy", "Wacky", "Tiny", "Flunky",
  "Fluffy", "Zippy", "Gassy", "Slimy", "Grimy",
  "Oily", "Gross", "Bumpy", "Loopy", "Snotty"];

var lastNames = ["Snicker", "Buffalo", "Burrito", "Bubble", "Sheep",
  "Corset", "Toilet", "Lizard", "Waffle", "Kumquat", "Burger", "Chimp", "Liver",
  "Gorilla", "Rhino", "Emu", "Pizza", "Toad", "Gerbil", "Pickle", "Tofu",
  "Chicken", "Potato", "Hamster", "Lemur", "Vermin"];

function generateName()
{
    max = firstNames.length;
    var number = Math.floor((Math.random() * (-max) + max));
    var firstName = firstNames[number];
    max = lastNames.length;
    number = Math.floor((Math.random() * (-max) + max));
    var name = firstName + " " + lastNames[number];
    return name;
}

var primaryTeam =
{
    name: 'Red',
    colorHex: '#cc0000',
    colorRGB: new BABYLON.Color3(204,0,0),

    colorR: 204,
    colorG: 0,
    colorB: 0
}

var secondaryTeam =
{
    name: 'White',
    colorHex: '#ffffff',
    colorRGB: new BABYLON.Color3(255,255,255),

    colorR: 255,
    colorG: 255,
    colorB: 255
}
var tertiaryTeam =
{
    name: 'Blue',
    colorHex: '#4cc2eb',
    colorRGB: new BABYLON.Color3(76, 194, 235),

    colorR: 76,
    colorG: 194,
    colorB: 235
}

function generateTeam()
{
    max = 3;
    var number = Math.floor((Math.random() * (-max) + max));
    var randTeam;

    switch(number)
    {
        case 0:
            randTeam = primaryTeam;
            break;
        case 1:
            randTeam = secondaryTeam;
            break;
        case 2:
            randTeam = tertiaryTeam;
            break;
        default:
            randTeam = primaryTeam;
    }

    //Only Team is White Team for the Time being - David
    randTeam = secondaryTeam;

    return randTeam;
}
