// SWADE STAT BLOCK IMPORTER FOR ROLL20 API
// 
// Command Line: !SW-Import
//
//  pelwer - 12/28/18 
// 	Hacked to parse swade stat block from pdf
//  pelwer - 9/8/19
//    Upgraded the parser based on post from Aaron
//    https://wiki.roll20.net/API:Cookbook#decodeEditorText
//  pelwer - 2/16/2020
//    added parse for undead, construct to set combat reflex
//    added parse for Endurance to set Iron Jaw
//    turned on Wild die for everything - can decide in the game whether ot use it or whether the thing is a WC
//  ThatGuy - 10/25/2020
//    retooled attributes/skills/hindrances/edges to be an array of object for faster handling.
//    Fleshed out all Edges/Hindrances/Special Abilities that affect stats tracked on the sheet / rolls.
//    Updated to work with Official Savage Worlds Character Sheets.
//  ThatGuy - 10/28/2020
//    Small but very important fix to call SheetWorker after setting values to trigger autocalc fields and buttons!
// 	
// 	INSTRUCTIONS
// 	1. Find yourself a SW stat-block (doesn't have to be SWADE, SWD version works fine too)
// 	2. Copy the stat block from *Name* on down
//    2.2 Paste into a plain text editor. 
//    2.4 Prepend [WC!] in first column of first line to make the creature a wildcard
//    2.6 Select and copy the text again
// 	3. Paste the stat block into the GM Notes Section of a token in your roll20 campaign.
// 	4. Select the token 
//    5. In the chat box, type the command "!SW-Import".
// 
//---------------------------------------------------
//  Original Author Jason.P 18/1/2015 - ported from Version 2.25
//  Thread: https://app.roll20.net/forum/post/1517881/pathfinder-statblock-import-to-character-sheet-script/?pagenum=2
// ---------------------------------------------------------
// js beautify json options:   https://beautifier.io/
// {
//   "indent_size": "3",
//   "indent_char": " ",
//   "max_preserve_newlines": "2",
//   "preserve_newlines": true,
//   "keep_array_indentation": false,
//   "break_chained_methods": false,
//   "indent_scripts": "normal",
//   "brace_style": "end-expand",
//   "space_before_conditional": true,
//   "unescape_strings": false,
//   "jslint_happy": false,
//   "end_with_newline": false,
//   "wrap_line_length": "0",
//   "indent_inner_html": false,
//   "comma_first": false,
//   "e4x": false
// }

// New gmnotes parsing clean up from Aaron:  9/8/19
// Given the text from a Graphic's gmnotes property, or a Character's bio or gmnotes 
// property, or a Handout's notes or gmnotes property, this will return a version with 
// the auto-inserted editor formatting stripped out.
//
// Usage:
//  The first argument is the text to process.
//    const text = decodeEditorText(token.get('gmnotes'));
// By default, the lines of text will be separated by \r\n.
// The optional second argument is an object with options.
// separator -- specifies what to separate lines of text with. Default: \r\n
//    const text = decodeEditorText(token.get('gmnotes'),{separator:'<BR>'});
// asArray -- specifies to instead return the lines as an array. Default: false
//    const text = decodeEditorText(token.get('gmnotes'),{asArray:true});
var verboseMode = true;

log("-=> Savage Worlds SWADE Import v1.0.8 <=-");

const decodeEditorText = (t, o) => {
   let w = t;
   o = Object.assign({
      separator: '\r\n',
      asArray: false
   }, o);
   /* Token GM Notes */
   if (/^%3Cp%3E/.test(w)) {
      w = unescape(w);
   }
   if (/^<p>/.test(w)) {
      let lines = w.match(/<p>.*?<\/p>/g)
         .map(l => l.replace(/^<p>(.*?)<\/p>$/, '$1'));
      return o.asArray ? lines : lines.join(o.separator);
   }
   /* neither */
   return t;
};

const generateUUID = (() => {
	let a = 0;
	let b = [];

	return () => {
		let c = (new Date()).getTime() + 0;
		let f = 7;
		let e = new Array(8);
		let d = c === a;
		a = c;
		for (; 0 <= f; f--) {
			e[f] = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(c % 64);
			c = Math.floor(c / 64);
		}
		c = e.join("");
		if (d) {
			for (f = 11; 0 <= f && 63 === b[f]; f--) {
				b[f] = 0;
			}
			b[f]++;
		} else {
			for (f = 0; 12 > f; f++) {
				b[f] = Math.floor(64 * Math.random());
			}
		}
		for (f = 0; 12 > f; f++){
			c += "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(b[f]);
		}
		return c;
	};
})();

const generateRowID = () => generateUUID().replace(/_/g, "Z");


onSheetWorkerCompleted(function() {
   if (verboseMode) {
      log("Updated Char Sheet!");
   }
});


// Usage:

//Usage Type= Skill/Attribute, name = name, amount = steps up or down (+2, -1)
function AdjustDie(type, name, amount){
    
     var NewDie,
         DieMod,
         NewMod;
            
    switch(type.toLowerCase()){
        case 'attribute':
            NewDie = (Attributes.find(attribute => attribute.Name.toLowerCase() == name.toLowerCase()).Die) + (amount * 2); //In SW Die moves are by 2: 4, 6, 8, 10, 12
            if(NewDie > 12) { NewDie = 12; } else 
            if(NewDie <  4) {NewDie  =  4; DieMod = true; }
            
            Attributes.find(attribute => attribute.Name.toLowerCase() == name.toLowerCase()).Die = NewDie;
            if(DieMod){
                NewMod = Attributes.find(attribute => attribute.Name.toLowerCase() == name.toLowerCase()).Mod += -1;
                if(NewMod < 0){
                    Attributes.find(attribute => attribute.Name.toLowerCase() == name.toLowerCase()).Mod = Math.abs(NewMod);
                    Attributes.find(attribute => attribute.Name.toLowerCase() == name.toLowerCase()).Sign = '-';    
                } else {
                    Attributes.find(attribute => attribute.Name.toLowerCase() == name.toLowerCase()).Mod = Math.abs(NewMod);
                    Attributes.find(attribute => attribute.Name.toLowerCase() == name.toLowerCase()).Sign = '+';
                }
            }
            break;
        case 'skill':
            NewDie = (Skills.find(skill => skill.Name.toLowerCase() == name.toLowerCase()).Die) + (amount * 2); //In SW Die moves are by 2: 4, 6, 8, 10, 12
            if(NewDie > 12) { NewDie = 12; } else 
            if(NewDie <  4) {NewDie  =  4; DieMod = true; }
            
            Skills.find(skill => skill.Name.toLowerCase() == name.toLowerCase()).Die = NewDie;
            break;
        default:
            log("No valid Type (skill or attribute) provided!");
            return null;
    }
}

//Usage Type= Skill/Attribute, name = name, amount = steps up or down (+2, -1)
function AdjustMod(type, name, amount, reason){
     var NewDie,
         DieMod,
         NewMod;
    
    switch(type.toLowerCase()){
      case 'attribute':
            //log('AdjustMod! Type:' + type + ' | Name: ' + name + ' | Amount: ' + amount + ' | Reason: ' + reason );
            //log('ADJUSTMOD!!!!! - HERE!-------------------------------------------------------------------------------------');
            //return;
            NewMod = Attributes.find(attribute => attribute.Name.toLowerCase() == name.toLowerCase()).Mod += amount;
            if(NewMod < 0){
                Attributes.find(attribute => attribute.Name.toLowerCase() == name.toLowerCase()).Mod = Math.abs(NewMod);
                Attributes.find(attribute => attribute.Name == name.toLowerCase()).Sign = '-';    
            } else {
                Attributes.find(attribute => attribute.Name.toLowerCase() == name.toLowerCase()).Mod = Math.abs(NewMod);
                Attributes.find(attribute => attribute.Name.toLowerCase() == name.toLowerCase()).Sign = '+';
            }
            Attributes.find(attribute => attribute.Name.toLowerCase() == name.toLowerCase()).ModText += ' ' + reason;
            break;
        case 'skill':
            if (typeof Skills.find(skill => skill.Name.toLowerCase() == name.toLowerCase()) !== 'undefined') {
                NewMod = Skills.find(skill => skill.Name.toLowerCase() == name.toLowerCase()).Mod += amount;
                if(NewMod < 0){
                    Skills.find(skill => skill.Name.toLowerCase() == name.toLowerCase()).Mod = Math.abs(NewMod);
                    Skills.find(skill => skill.Name.toLowerCase() == name.toLowerCase()).Sign = '-';    
                } else {
                    Skills.find(skill => skill.Name.toLowerCase() == name.toLowerCase()).Mod = Math.abs(NewMod);
                    Skills.find(skill => skill.Name.toLowerCase() == name.toLowerCase()).Sign = '+';
                }
                Skills.find(skill => skill.Name.toLowerCase() == name.toLowerCase()).ModText += ' ' + reason;
            } else {
                var NewAmount = -2 + amount;
                var Sign = '';
                if(NewAmount > -1){ var Sign = '+'; }
                Skills.push(new Skill(name, name + " d4" + Sign + NewAmount.toString())); 
            }
            break;
        default:
            log("No valid Type (skill or attribute) provided!");
            return null;
    }
}

function FixFighting(charID){
    
    log(charID);

    staticFightingAttr = findObjs({ type: 'attribute', characterid: charID, name: 'staticFighting' })[0];
    FightingModAttr = findObjs({ type: 'attribute', characterid: charID, name: 'Fightingmod' })[0];

    log(FightingModAttr);
    log(staticFightingAttr);
    
       FightingModAttr.setWithWorker({
         current: '0',
         max: ''
      });

      staticFightingAttr.setWithWorker({
         current: 'on',
         max: ''
      });

      log('Fighting Mod Fix Done.');
      return;
}

//   AddAttribute("size",sizeNum,charID);
function AddAttribute(attr, value, max, charID) {
   if (value === undefined) {
      log(attr + " has returned an undefined value.");
      sendChat("Error on " + attr + " attribute", "This attribute has been ignored.");
   }
   else {
      
      let AttrObj = createObj("attribute", {
         name: attr,
         characterid: charID
      });
      
      AttrObj.setWithWorker({
         current: value,
         max: max
      });

      //use the line below for diagnostics!
      if (verboseMode) {
         log("Attribute: Value = " + attr + ": " + value);
      }
   }
   return;
}

function AddEdge(Edge, charID) {
   if (Edge === undefined) {
      log("edge has returned an undefined value.");
      sendChat("Error on Edge", "This attribute has been ignored.");
   }
   else {
       
      let AttrObj = createObj("attribute", {
         name: "repeating_edges_"+ Edge.rowid +"_edge",
         characterid: charID
      });
      AttrObj.setWithWorker({
         current: Edge.Name,
         max: "",
      });
      
      
      let AttrObj2 = createObj("attribute", {
         name: "repeating_edges_"+ Edge.rowid +"_tookat",
         characterid: charID
      });
      AttrObj2.setWithWorker({
         current: Edge.TookAt,
         max: "",
      });
      
      
      let AttrObj3 = createObj("attribute", {
         name: "repeating_edges_"+ Edge.rowid +"_edgedescription",
         characterid: charID
      });
      AttrObj3.setWithWorker({
         current: Edge.Desc,
         max: "",
      });
      
      
      let AttrObj4 = createObj("attribute", {
         name: "repeating_edges_"+ Edge.rowid +"_showEdgeDesc",
         characterid: charID
      });
      AttrObj4.setWithWorker({
         current: "0",
         max: "",
      });

      if (verboseMode) {
         log("Edge: Name = " + Edge.Name + ", id: " + Edge.rowid);
      }
   }
   return;
}

function AddSpecialAbility(SpecialAbility, charID) {
   if (SpecialAbility === undefined) {
      log("Special Ability has returned an undefined value.");
      sendChat("Error on Special Ability", "This attribute has been ignored.");
   }
   else {
       
      let AttrObj = createObj("attribute", {
         name: "repeating_specialabilities_"+ SpecialAbility.rowid +"_specialability",
         characterid: charID
      });
      AttrObj.setWithWorker({
         current: SpecialAbility.Name,
         max: "",
      });
      
      let AttrObj1 = createObj("attribute", {
         name: "repeating_specialabilities_"+ SpecialAbility.rowid +"_specialabilitydescription",
         characterid: charID
      });
      AttrObj1.setWithWorker({
         current: SpecialAbility.Desc,
         max: "",
      });
      let AttrObj2 = createObj("attribute", {
         name: "repeating_specialabilities_"+ SpecialAbility.rowid +"_showSpecAbilityDesc",
         characterid: charID
      });
      AttrObj2.setWithWorker({
         current: "0",
         max: "",
      });

      if (verboseMode) {
         log("Special Ability: Name = " + SpecialAbility.Name + ", id: " + SpecialAbility.rowid);
      }
   }
   return;
}

function AddHindrance(Hindrance, charID) {
   if (Hindrance === undefined) {
      log("Hindrance has returned an undefined value.");
      sendChat("Error on Hindrance", "This attribute has been ignored.");
   }
   else {
       
      let AttrObj = createObj("attribute", {
         name: "repeating_hindrances_"+ Hindrance.rowid +"_hindrance",
         characterid: charID
      });
      AttrObj.setWithWorker({
         current: Hindrance.Name,
         max: "",
      });
      let AttrObj2 = createObj("attribute", {
         name: "repeating_hindrances_"+ Hindrance.rowid +"_hindranceType",
         characterid: charID
      });
      AttrObj2.setWithWorker({
         current: Hindrance.Type,
         max: "",
      });
      let AttrObj3 = createObj("attribute", {
         name: "repeating_hindrances_"+ Hindrance.rowid +"_hindrancedescription",
         characterid: charID
      });
      AttrObj3.setWithWorker({
         current: Hindrance.Desc,
         max: "",
      });
      let AttrObj4 = createObj("attribute", {
         name: "repeating_hindrances_"+ Hindrance.rowid +"_showHindranceDesc",
         characterid: charID
      });
      AttrObj4.setWithWorker({
         current: "0",
         max: "",
      });
      let AttrObj5 = createObj("attribute", {
         name: "repeating_hindrances_"+ Hindrance.rowid +"_showHindraceDesc",
         characterid: charID
      });
      AttrObj5.setWithWorker({
         current: "0",
         max: "",
      });

      if (verboseMode) {
         log("Hindrance: Name = " + Hindrance.Name + ", id: " + Hindrance.rowid);
      }
   }
   return;
}


function AddWeapon(Weapon, charID){
    if (Weapon === undefined) {
      log("Weapon has returned an undefined value.");
      sendChat("Error on Weapon", "This attribute has been ignored.");
   }
   else {
        var weaponsbonusDie		= '{{bonus_die=[[@{weaponsbonusdmg}!]]}}';
        var weaponsbonusdmg		= '@{weaponsbdt}';
        var highlightdamage		= '0';
        var weaponroll			= '@{skillNDamage}';
        var multiattack			= '0';
        var rfightingname		= 'Fighting';
        var rathleticsname      = 'Athletics';
        var rshootingname       = 'Shooting';
        var rweirdsciencename   = 'Weird Science'; 
       
        //Create Static Weapon Attributes first:
        
        
        createObj("attribute", {name: "repeating_weapons_"+ Weapon.rowid +"_weaponsbonusDie",current: weaponsbonusDie,characterid: charID});
        createObj("attribute", {name: "repeating_weapons_"+ Weapon.rowid +"_weaponsbonusdmg",current: weaponsbonusdmg,characterid: charID});
        createObj("attribute", {name: "repeating_weapons_"+ Weapon.rowid +"_highlightdamage",current: highlightdamage,characterid: charID});
        if(Weapon.RoF > 1){
            createObj("attribute", {name: "repeating_weapons_"+ Weapon.rowid +"_weaponbutton",current: '2',characterid: charID});
        } else {
            createObj("attribute", {name: "repeating_weapons_"+ Weapon.rowid +"_weaponbutton",current: '0',characterid: charID});
        }
        createObj("attribute", {name: "repeating_weapons_"+ Weapon.rowid +"_weaponroll",current: weaponroll,characterid: charID});
        createObj("attribute", {name: "repeating_weapons_"+ Weapon.rowid +"_multiattack",current: multiattack,characterid: charID});
        createObj("attribute", {name: "repeating_weapons_"+ Weapon.rowid +"_rfightingname",current: rfightingname,characterid: charID});
        createObj("attribute", {name: "repeating_weapons_"+ Weapon.rowid +"_rathleticsname",current: rathleticsname,characterid: charID});
        createObj("attribute", {name: "repeating_weapons_"+ Weapon.rowid +"_rshootingname",current: rshootingname,characterid: charID});
        createObj("attribute", {name: "repeating_weapons_"+ Weapon.rowid +"_rweirdsciencename",current: rweirdsciencename,characterid: charID});
        createObj("attribute", {name: "repeating_weapons_"+ Weapon.rowid +"_showweaponconfig",current: '0',characterid: charID});
        
        //Create Weapon Attributes that don't change with type:
        
        if(typeof Weapon.Name != 'undefined') {
            createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_weapon',current: Weapon.Name.toString(),characterid: charID});
        }
                if(typeof Weapon.RoF != 'undefined') {
            createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_rof',current: Weapon.RoF.toString(),characterid: charID});
        }
        if(typeof Weapon.Range != 'undefined') {
            createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_range',current: Weapon.Range.toString(),characterid: charID});
        }
        if(typeof Weapon.AP != 'undefined') {
            createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_weaponap',current: Weapon.AP.toString(),characterid: charID});
        }
        if(typeof Weapon.Notes != 'undefined') {
            createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_weaponnotes',current: Weapon.Notes.toString(),characterid: charID});
        }
        if(typeof Weapon.DmgBonusNum != 'undefined') {
            createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_dmgbonusnum',current: Weapon.DmgBonusNum.toString(),characterid: charID});
        }
        if(typeof Weapon.DmgBonusType != 'undefined') {
            createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_weaponsbdt',current: Weapon.DmgBonusType.toString(),characterid: charID});
        }
        if(typeof Weapon.MinStr != 'undefined') {
            createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_minstrength',current: Weapon.MinStr.toString(),characterid: charID});
        }

        if(Weapon.MaxShots > 0 || Weapon.Shots > 0){
           createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_shots (current)',current: Weapon.Shots.toString(),max: Weapon.MaxShots.toString(), characterid: charID}); 
        }
        if(typeof Weapon.DmgDieNum != 'undefined') {
            createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_dmgnumdice',current: Weapon.DmgDieNum.toString(),characterid: charID});
        }
        if(typeof Weapon.DmgDieType != 'undefined') {
            
        let AttrObj = createObj("attribute", {
             name: 'repeating_weapons_'+ Weapon.rowid +'_dmgdietype',
             characterid: charID
          });
          AttrObj.setWithWorker({
             current: 'd' + Weapon.DmgDieType.toString() + '!',
             max: "",
          });
          //  createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_dmgdietype',current: 'd' + Weapon.DmgDieType.toString() + '!',characterid: charID});
        } 
        //(damageatt(blank if na)+dmgnumdice+dmgdietype+dmgbonusnum)
        
        _.delay((d)=>{
            switch( Weapon.Type.toLowerCase() ){
                case 'melee':
                    createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_weaponskill',current: 'fighting' ,characterid: charID});
                    var DMGAttrObj = createObj("attribute", {
                        name: 'repeating_weapons_'+ Weapon.rowid +'_damageatt',
                        characterid: charID
                    });
                    DMGAttrObj.setWithWorker({
                        current: 'strength',
                        max: "",
                    });
                    break;
                case 'ranged':
                    createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_weaponskill',current: 'shooting' ,characterid: charID});
                    var DMGAttrObj = createObj("attribute", {
                        name: 'repeating_weapons_'+ Weapon.rowid +'_damageatt',
                        characterid: charID
                    });
                    DMGAttrObj.setWithWorker({
                        current: 'na',
                        max: "",
                    });
                    break;
                case 'thrown':
                    //createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_damageatt',current: 'na' ,characterid: charID});
                    createObj('attribute', {name: 'repeating_weapons_'+ Weapon.rowid +'_weaponskill',current: 'athletics' ,characterid: charID});
                    var DMGAttrObj = createObj("attribute", {
                        name: 'repeating_weapons_'+ Weapon.rowid +'_damageatt',
                        characterid: charID
                    });
                    DMGAttrObj.setWithWorker({
                        current: 'na',
                        max: "",
                    });
                    break;
                default:
                    log("Bad Weapon Type!!!!");
                    break;
            }
            log("Delay Process Done!");
            if (verboseMode) {
                log("Weapon: Name = " + Weapon.Name + ", id: " + Weapon.rowid);
            }
        },2000,Weapon, charID);
   }
   return;
}


// convert SWADE die value to Roll20 exploding die format.  e.g. d12+2 --> d12!+2
function dieConvert(str) {
   var parsedDice = [];

   if (/d\d+(\+|-)\d+/.test(str)) { // d12+2
      parsedDice = str.match(/(d\d+)((\+|-)\d+)/); // [1] = d12;  [2] = +2;
      return (parsedDice[1].slice(1));
   }
   else { // d12
      return (str.slice(1)); // d12!
   }
}

function dieConvertMod(str) {
   var parsedDice = [];
    //log("Mod String: " + str);
   if (/d\d+(\+|-)\d+/.test(str)) { // d12+2
      parsedDice = parseInt(str.match(/(\+|-)\d+/)); // [1] = d12;  [2] = +2;
      return parsedDice + '';
   }
   else { // d12
      return (0); // d12!
   }
}

var RowIDs = [];

//------------------------------------  Create Objects  ------------------

SpecialAbility = function(Name, Desc){
    let rowid = generateRowID();
    if(RowIDs.indexOf(rowid) != -1){
        let rowid = generateRowID();
    }
   
    RowIDs.push(rowid);
   
    this.Name = Name;
    this.Desc = Desc;
    this.rowid = rowid;
}

var SpecialAbilities = [];

Edge = function(Name, TookAt, Desc){
    let rowid = generateRowID();
    if(RowIDs.indexOf(rowid) != -1){
        let rowid = generateRowID();
    }
   
    RowIDs.push(rowid);
   
    this.Name = Name;
    this.Desc = Desc;
    this.TookAt = TookAt;
    this.rowid = rowid;
}

var Edges = [];

Hindrance = function(Name, Type, Desc){
    if(Type.toLowerCase() != 'major' && Type.toLowerCase() != 'minor'){
        log("Invalid Type, must be Major or Minor")
        return null;
    }
    
    let rowid = generateRowID();
    if(RowIDs.indexOf(rowid) != -1){
        let rowid = generateRowID();
    }
   
    RowIDs.push(rowid);
   
    this.Name = Name;
    this.Desc = Desc;
    this.Type = Type;
    this.rowid = rowid;
}

var Hindrances = [];


function searchHindrances(nameValue){
    for (var i=0; i < Hindrances.length; i++) {
        if (Hindrances[i].Name === nameValue) {
            return true;
        }
    }
    return false;
}

function searchSpecialAbilities(nameValue){
    for (var i=0; i < SpecialAbilities.length; i++) {
        if (SpecialAbilities[i].Name === nameValue) {
            return true;
        }
    }
    return false;
}

Weapon = function(Type, Name, Notes, MinStr, Range, AP, RoF, Shots, MaxShots, DmgDieNum, DmgDieType, DmgBonusNum, DmgBonusType){
    if(Type.toLowerCase() != 'melee' && Type.toLowerCase() != 'ranged' && Type.toLowerCase() != 'thrown' ){
        log("Invalid Type, must be Melee, Ranged or Thrown")
        return null;
    }
    
    let rowid = generateRowID();
    if(RowIDs.indexOf(rowid) != -1){
        let rowid = generateRowID();
    }
   
    RowIDs.push(rowid);
    
    this.Name           = Name;
    this.Type           = Type;
    this.Notes          = Notes;
    this.MinStr         = MinStr;
    this.Range          = Range;
    this.AP             = AP;
    this.RoF            = RoF;
    this.Shots          = Shots;
    this.MaxShots       = MaxShots;
    this.DmgDieNum      = DmgDieNum;
    this.DmgDieType     = DmgDieType;
    this.DmgBonusNum    = DmgBonusNum;
    this.DmgBonusType   = DmgBonusType;
    this.rowid          = rowid;
}

var Weapons = [];

//Power = function(Name, Trappings, PP, Range, Duration, ButtonType, DmgAtt, DmgDieNum)

Attribute = function(attributeName, attributeDie) {
  this.Name     = attributeName;                                //skill Name e.g. Fighting 
  this.Die      = parseInt(dieConvert(attributeDie));           // numeric portion of Die       12 or 4
  var FullMod   = parseInt(dieConvertMod(attributeDie));        // Full Modifier                2 or -1
  this.Mod      = Math.abs(FullMod);                        // numeric portion of Mod       2 or 1   
  if(FullMod < 0){
      this.Sign = '-';                                      // Sign is - for negative mods.
  } else {
      this.Sign = '+'                                       // Sign is + for both Positive and 0 Mods
  }
  this.ModText  = '';
  
  if(verboseMode){
      log("Building Attribute: " + attributeName);
  }
}

var Attributes = [];

Skill = function(skillName, skillDie) {

  this.Name     = skillName;                                //skill Name e.g. Fighting 
  this.Die      = parseInt(dieConvert(skillDie));           // numeric portion of Die       12 or 4
  var FullMod   = parseInt(dieConvertMod(skillDie));        // Full Modifier                2 or -1
  this.Mod      = Math.abs(FullMod);                        // numeric portion of Mod       2 or 1   
  if(FullMod < 0){
      this.Sign = '-';                                      // Sign is - for negative mods.
  } else {
      this.Sign = '+'                                       // Sign is + for both Positive and 0 Mods
  }
  this.ModText  = '';
  
  if(verboseMode){
      log("Building Skill: " + skillName);
  }
  
}

var Skills = [];


//Build Skill List
{
var SkillList = [];

SkillList.push('Academics');
SkillList.push('Athletics');
SkillList.push('Battle');
SkillList.push('Boating');
SkillList.push('Common Knowledge');
SkillList.push('Driving');
SkillList.push('Electronics');
SkillList.push('Faith');
SkillList.push('Fighting');
SkillList.push('Focus');
SkillList.push('Gambling');
SkillList.push('Hacking');
SkillList.push('Healing');
SkillList.push('Intimidation');
SkillList.push('Language');
SkillList.push('Notice');
SkillList.push('Occult');
SkillList.push('Performance');
SkillList.push('Persuasion');
SkillList.push('Piloting');
SkillList.push('Psionics');
SkillList.push('Repair');
SkillList.push('Research');
SkillList.push('Riding');
SkillList.push('Science');
SkillList.push('Shooting');
SkillList.push('Spellcasting');
SkillList.push('Stealth');
SkillList.push('Survival');
SkillList.push('Taunt');
SkillList.push('Thievery');
SkillList.push('Weird Science');
}

//Build Edge List
{
var EdgeList = [];

    //Core Edges (139)
    {
        EdgeList.push({name:'Alertness', desc:'+2 to Notice rolls.'});
        EdgeList.push({name:'Ambidextrous', desc:'Ignore –2 penalty when making Trait rolls with off-hand.'});
        EdgeList.push({name:'Arcane Background (Gifted)', desc:'Access Gifted Powers. Skill: Faith, Starting: 1, PP:15'}); // Arane Backgrond (List?
        EdgeList.push({name:'Arcane Background (Magic)', desc:'Access Magic Powers. Skill: Spellcasting, Starting: 3, PP:10'}); // Arane Backgrond (List?
        EdgeList.push({name:'Arcane Background (Miracles)', desc:'Access Miracle Powers. Skill: Faith, Starting: 3, PP:10'}); // Arane Backgrond (List?
        EdgeList.push({name:'Arcane Background (Psionics)', desc:'Access Psionic Powers. Skill: Psionics, Starting: 3, PP:10'}); // Arane Backgrond (List?
        EdgeList.push({name:'Arcane Background (Weird Science)', desc:'Access Weird Science Powers. Skill: Weird Science, Starting: 2, PP:15'}); // Arane Backgrond (List?
        EdgeList.push({name:'Arcane Resistance', desc:'Arcane skills targeting the hero suffer a −2 penalty (even if cast by allies!); magical damage is reduced by 2.'});
        EdgeList.push({name:'Improved Arcane Resistance', desc:'As Arcane Resistance except penalty is increased to −4 and magical damage is reduced by 4.'});
        EdgeList.push({name:'Aristocrat', desc:'+2 to Common Knowledge and networking with upper class.'});
        EdgeList.push({name:'Attractive', desc:'+1 to Performance and Persuasion rolls.'});
        EdgeList.push({name:'Very Attractive', desc:'+2 to Performance and Persuasion rolls.'});
        EdgeList.push({name:'Berserk', desc:'After being Shaken or Wounded, melee attacks must be Wild Attacks, +1 die type to Strength, +2 to Toughness, ignore one level of Wound penalties, Critical Failure on Fighting roll hits random target. Take Fatigue after every five consecutive rounds, may choose to end rage with Smarts roll –2.'});
        EdgeList.push({name:'Brave', desc:'+2 to Fear checks and –2 to rolls on the Fear Table.'});
        EdgeList.push({name:'Brawny', desc:'Size (and therefore Toughness) +1. Treat Strength as one die type higher for Encumbrance and Minimum Strength to use weapons, armor, or equipment.'});
        EdgeList.push({name:'Brute', desc:'Link Athletics to Strength instead of Agility (including resistance). Short Range of any thrown item increased by +1. Double that for the adjusted Medium Range, and double again for Long Range.'});
        EdgeList.push({name:'Charismatic', desc:'Free reroll when using Persuasion'});
        EdgeList.push({name:'Elan', desc:'+2 when spending a Benny to reroll a Trait roll.'});
        EdgeList.push({name:'Fame', desc:'+1 Persuasion rolls when recognized (Common Knowledge), double usual fee for Performance.'});
        EdgeList.push({name:'Famous', desc:'+2 Persuasion when recognized, 5× or more usual fee for Performance.'});
        EdgeList.push({name:'Fast Healer', desc:'+2 Vigor when rolling for natural healing; check every 3 days.'});
        EdgeList.push({name:'Fleet-Footed', desc:'Pace +2, increase running die one step.'});
        EdgeList.push({name:'Linguist', desc:'Character has d6 in languages equal to half her Smarts die.'});
        EdgeList.push({name:'Luck', desc:'+1 Benny at the start of each session.'});
        EdgeList.push({name:'Great Luck', desc:'+2 Bennies at the start of each session.'});
        EdgeList.push({name:'Quick', desc:'The hero may discard and redraw Action Cards of 5 or lower.'});
        EdgeList.push({name:'Rich', desc:'Character starts with three times the starting funds and a $150K annual salary.'});
        EdgeList.push({name:'Filthy Rich', desc:'Five times starting funds and $500K average salary.'});
        EdgeList.push({name:'Block', desc:'+1 Parry, ignore 1 point of Gang Up bonus.'});
        EdgeList.push({name:'Improved Block', desc:'+2 Parry, ignore 2 points of Gang Up bonus.'});
        EdgeList.push({name:'Brawler', desc:'Toughness +1, add d4 to damage from fists; or increase it a die type if combined with Martial Artist, Claws, or similar abilities.'});
        EdgeList.push({name:'Bruiser', desc:'Increase unarmed Strength damage a die type and Toughness another +1.'});
        EdgeList.push({name:'Calculating', desc:'Ignore up to 2 points of penalties on one action with an Action Card of Five or less.'});
        EdgeList.push({name:'Combat Reflexes', desc:'+2 Spirit to recover from being Shaken or Stunned.'});
        EdgeList.push({name:'Counterattack', desc:'Free attack against one foe per turn who failed a Fighting roll.'});
        EdgeList.push({name:'Improved Counterattack', desc:'As Counterattack, but against three failed attacks per turn.'});
        EdgeList.push({name:'Dead Shot', desc:'First successful Athletics (throwing) or Shooting roll, double damage from when dealt a Joker.'});
        EdgeList.push({name:'Dodge', desc:'−2 to be hit by ranged attacks.'});
        EdgeList.push({name:'Improved Dodge', desc:'+2 to Evasion totals.'});
        EdgeList.push({name:'Double Tap', desc:'+1 to hit and damage when firing no more than RoF 1 per action.'});
        EdgeList.push({name:'Extraction', desc:'One adjacent foe doesn’t get a free attack when you withdraw from close combat.'});
        EdgeList.push({name:'Improved Extraction', desc:'Three adjacent foes don’t get free attacks when you withdraw from combat.'});
        EdgeList.push({name:'Feint', desc:'You may choose to make foe resist with Smarts instead of Agility during a Fighting Test.'});
        EdgeList.push({name:'First Strike ', desc:'Free Fighting attack once per round when foe moves within Reach.'});
        EdgeList.push({name:'Improved First Strike', desc:'Free Fighting attack against up to three foes when they move within Reach.'});
        EdgeList.push({name:'Free Runner', desc:'Ignore Difficult Ground and add +2 to Athletics in foot chases and Athletics (climbing).'});
        EdgeList.push({name:'Frenzy', desc:'Roll a second Fighting die with one melee attack per turn.'});
        EdgeList.push({name:'Improved Frenzy', desc:'Roll a second Fighting die with up to two melee attacks per turn.'});
        EdgeList.push({name:'Giant Killer ', desc:'+1d6 damage vs. creatures three Sizes larger or more.'});
        EdgeList.push({name:'Hard to Kill', desc:'Ignore Wound penalties when making Vigor rolls to avoid Bleeding Out.'});
        EdgeList.push({name:'Harder to Kill', desc:'Roll a die if the character perishes. Even if he’s Incapacitated, he survives somehow.'});
        EdgeList.push({name:'Improvisational Fighter', desc:'Ignore –2 penalty when attacking with improvised weapons.'});
        EdgeList.push({name:'Iron Jaw', desc:'+2 to Soak and Vigor rolls to avoid Knockout Blows.'});
        EdgeList.push({name:'Killer Instinct', desc:'The hero gets a free reroll in any opposed Test he initiates.'});
        EdgeList.push({name:'Level Headed', desc:'Draw an additional Action Card each round in combat and choose which one to use.'});
        EdgeList.push({name:'Improved Level Headed', desc:'Draw two additional Action Cards each round in combat and choose which one to use.'});
        EdgeList.push({name:'Marksman', desc:'Ignore up to 2 points of penalties from Range, Cover, Called Shot, Scale, or Speed; or add +1 to first Athletics (throwing) or Shooting roll. Character may not move or fire greater than RoF 1.'});
        EdgeList.push({name:'Martial Artist', desc:'Unarmed Fighting +1, fists and feet count as Natural Weapons, add d4 damage die to unarmed Fighting attacks (or increase die a step if you already have it).'});
        EdgeList.push({name:'Martial Warrior', desc:'Unarmed Fighting +2, increase damage die type a step.'});
        EdgeList.push({name:'Mighty Blow', desc:'On first successful Fighting roll, double damage when dealt a Joker'});
        EdgeList.push({name:'Nerves of Steel', desc:'Ignore one level of Wound penalties.'});
        EdgeList.push({name:'Improved Nerves of Steel', desc:'Ignore up to two levels of Wound penalties.'});
        EdgeList.push({name:'No Mercy', desc:'+2 damage when spending a Benny to reroll damage.'});
        EdgeList.push({name:'Rapid Fire', desc:'Increase RoF by 1 for one Shooting attack per turn'});
        EdgeList.push({name:'Improved Rapid Fire', desc:'Increase RoF by 1 for up to two Shooting attacks per turn.'});
        EdgeList.push({name:'Rock and Roll!', desc:'Ignore the Recoil penalty when firing weapons with a RoF of 2 or more. Character may not move.'});
        EdgeList.push({name:'Steady Hands', desc:'Ignore Unstable Platform penalty; reduce running penalty to –1.'});
        EdgeList.push({name:'Sweep', desc:'Fighting roll at –2 to hit all targets in weapon’s Reach, no more than once per turn.'});
        EdgeList.push({name:'Improved Sweep', desc:'As above, but ignore the –2 penalty.'});
        EdgeList.push({name:'Trademark Weapon', desc:'+1 to Athletics (throwing), Fighting, or Shooting total with a specific weapon; +1 Parry while weapon is readied.'});
        EdgeList.push({name:'Imp. Trademark Weapon', desc:'The attack and Parry bonus increases to +2.'});
        EdgeList.push({name:'Two-Fisted', desc:'Make one extra Fighting roll with a second melee weapon in the off-hand at no Multi-Action penalty.'});
        EdgeList.push({name:'Two-Gun Kid ', desc:'Make one extra Shooting (or Athletics (throwing) roll with a second ranged weapon in the off-hand at no Multi-Action penalty.'});
        EdgeList.push({name:'Command', desc:'+1 to Extras’ Shaken recovery rolls in Command Range.'});
        EdgeList.push({name:'Command Presence', desc:'Increase Command Range to 10″ (20 yards)'});
        EdgeList.push({name:'Fervor', desc:'Extras in range add +1 to their Fighting damage rolls.'});
        EdgeList.push({name:'Hold the Line', desc:'+1 to Extras’ Toughness in Command Range.'});
        EdgeList.push({name:'Inspire', desc:'Once per turn, the hero may roll his Battle skill to Support one type of Trait roll, and apply it to everyone in Command Range'});
        EdgeList.push({name:'Natural Leader', desc:'Leadership Edges now apply to Wild Cards.'});
        EdgeList.push({name:'Tactician', desc:'Draw an extra Action Card each turn that may be assigned to any allied Extra in Command Range.'});
        EdgeList.push({name:'Master Tactician', desc:'Draw and distribute two extra Action Cards instead of one.'});
        EdgeList.push({name:'Artificer', desc:'Allows user to create Arcane Devices.'});
        EdgeList.push({name:'Channeling', desc:'Reduce Power Point cost by 1 with a raise on the activation roll.'});
        EdgeList.push({name:'Concentration', desc:'Double Duration of non-Instant powers'});
        EdgeList.push({name:'Extra Effort ', desc:'Increase Focus by +1 for 1 Power Point or +2 for 3 Power Points.'});
        EdgeList.push({name:'Gadgeteer', desc:'Spend 3 Power Points to create a device that replicates another power.'});
        EdgeList.push({name:'Unholy Warrior', desc:'Add +1 to +4 to Soak rolls for each Power Point spent.'});
        EdgeList.push({name:'Holy Warrior', desc:'Add +1 to +4 to Soak rolls for each Power Point spent.'});
        EdgeList.push({name:'Holy/Unholy Warrior', desc:'Add +1 to +4 to Soak rolls for each Power Point spent.'});
        EdgeList.push({name:'Mentalist', desc:'+2 to opposed Psionics rolls'});
        EdgeList.push({name:'New Powers', desc:'Your character knows two new powers'});
        EdgeList.push({name:'Power Points', desc:'Gain 5 additional Power Points, no more than once per Rank'});
        EdgeList.push({name:'Power Surge', desc:'Recover 10 Power Points when dealt a Joker in combat.'});
        EdgeList.push({name:'Rapid Recharge', desc:'Recover 10 Power Points per hour'});
        EdgeList.push({name:'Improved Rapid Recharge', desc:'Recover 20 Power Points per hour.'});
        EdgeList.push({name:'Soul Drain', desc:'Recover 5 Power Points for a level of Fatigue.'});
        EdgeList.push({name:'Wizard', desc:'Spend 1 extra Power Point to change a spell’s Trapping'});
        EdgeList.push({name:'Ace', desc:'Character may spend Bennies to Soak damage for his vehicle and ignores up to 2 points of penalties.'});
        EdgeList.push({name:'Acrobat', desc:'Free reroll on acrobatic Athletics attempts.'});
        EdgeList.push({name:'Combat Acrobat', desc:'−1 to hit with ranged and melee attacks.'});
        EdgeList.push({name:'Assassin', desc:'+2 to damage foes when Vulnerable or assassin has The Drop.'});
        EdgeList.push({name:'Investigator', desc:'+2 to Research and certain types of Notice rolls.'});
        EdgeList.push({name:'Jack-of-all-Trades', desc:'Gain d4 in a skill (or d6 with a raise) until replaced.'});
        EdgeList.push({name:'McGyver', desc:'Quickly create improvised devices from scraps.'});
        EdgeList.push({name:'Mr. Fix It', desc:'+2 to Repair rolls, half the time required with a raise.'});
        EdgeList.push({name:'Scholar', desc:'+2 to any one “knowledge” skill.'});
        EdgeList.push({name:'Soldier', desc:'Strength is one die type higher for Encumbrance and Min Str. Reroll Vigor rolls when resisting environmental Hazards.'});
        EdgeList.push({name:'Thief', desc:'+1 Thievery, Athletics rolls made to climb, Stealth in urban environments.'});
        EdgeList.push({name:'Woodsman', desc:'+2 to Survival and Stealth in the wilds.'});
        EdgeList.push({name:'Bolster', desc:'May remove Distracted or Vulnerable state after a Test.'});
        EdgeList.push({name:'Common Bond', desc:'The hero may freely give her Bennies to others.'});
        EdgeList.push({name:'Connections', desc:'Contacts provide aid or other favors once per session.'});
        EdgeList.push({name:'Humiliate', desc:'Free reroll when making Taunt rolls.'});
        EdgeList.push({name:'Menacing', desc:'+2 to Intimidation.'});
        EdgeList.push({name:'Provoke', desc:'May “provoke” foes with a raise on a Taunt roll. See text.'});
        EdgeList.push({name:'Rabble-Rouser', desc:'Once per turn, affect all foes in a Medium Blast Template with an Intimidation or Taunt Test.'});
        EdgeList.push({name:'Reliable', desc:'Free reroll when making Support rolls.'});
        EdgeList.push({name:'Retort', desc:'A raise when resisting a Taunt or Intimidation attack makes the foe Distracted.'});
        EdgeList.push({name:'Streetwise', desc:'+2 to Common Knowledge and criminal networking.'});
        EdgeList.push({name:'Strong Willed', desc:'+2 to resist Smarts or Spirit-based Tests.'});
        EdgeList.push({name:'Iron Will ', desc:'The bonus (+2) now applies to resisting and recovery from powers.'});
        EdgeList.push({name:'Work the Room ', desc:'Once per turn, roll a second die when Supporting via Performance or Persuasion and apply result to additional ally.'});
        EdgeList.push({name:'Work the Crowd', desc:'Twice per turn, roll a second die when Supporting via Performance or Persuasion and apply result to additional ally.'});
        EdgeList.push({name:'Beast Bond', desc:'The hero may spend Bennies for animals under her control.'});
        EdgeList.push({name:'Beast Master', desc:'Animals like your hero and he has a pet of some sort. See text.'});
        EdgeList.push({name:'Champion', desc:'+2 damage vs. supernaturally evil creatures.'});
        EdgeList.push({name:'Chi', desc:'Once per combat, reroll failed attack, make enemy reroll successful attack, or add +d6 to unarmed Fighting attack.'});
        EdgeList.push({name:'Danger Sense', desc:'Notice roll at +2 to sense ambushes or similar events.'});
        EdgeList.push({name:'Healer', desc:'+2 to Healing rolls, magical or otherwise.'});
        EdgeList.push({name:'Liquid Courage', desc:'Alcohol increases Vigor a die type and ignores one level of Wound penalty; –1 to Agility, Smarts, and related skills.'});
        EdgeList.push({name:'Scavenger', desc:'May find a needed item once per encounter.'});
        EdgeList.push({name:'Followers', desc:'The hero has five followers.'});
        EdgeList.push({name:'Professional', desc:'The character’s Trait and its limit increases one step.'});
        EdgeList.push({name:'Expert', desc:'The character’s Trait and its limit increases one step.'});
        EdgeList.push({name:'Master', desc:'The character’s Wild Die is a d10 with a chosen Trait.'});
        EdgeList.push({name:'Sidekick', desc:'The character gains a Wild Card sidekick.'});
        EdgeList.push({name:'Tough as Nails', desc:'The hero can take four Wounds before being Incapacitated.'});
        EdgeList.push({name:'Tougher than Nails', desc:'The hero can take five Wounds before being Incapacitated.'});
        EdgeList.push({name:'Weapon Master', desc:'Parry increases by +1 and Fighting bonus damage die is d8.'});
        EdgeList.push({name:'Master of Arms', desc:'Parry increases another +1 and Fighting bonus damage die is d10.'});
        
    }
    // Deadlands List (29)
    {
        EdgeList.push({name:'Arcane Background (Blessed)', desc:'Access Blessed Powers, Skill: Faith, Starting: 3, PP:15'});
        EdgeList.push({name:'Arcane Background (Chi Master)', desc:'Access Chi Master Powers, Skill: Focus, Starting: 3, PP:15'});
        EdgeList.push({name:'Arcane Background (Huckster)', desc:'Access Huckster Powers, Skill: Spellcasting, Starting: 3, PP:10'});
        EdgeList.push({name:'Arcane Background (Mad Scientist)', desc:'Access Mad Scientist Powers. Skill: Weird Science, Starting: 2, PP:15'});
        EdgeList.push({name:'Arcane Background (Shaman)', desc:'Access Shaman Powers, Skill: Faith, Starting: 2, PP:15'});
        EdgeList.push({name:'Gallows Humor', desc:'May use Taunt skill instead of Spirit when making a Fear Check.  On a raise allies get +1 support to the same Fear Check.'}); 
        EdgeList.push({name:'Veteran O\' the Weird West', desc:'Begin Play at Seasoned, see text for price.'});
        EdgeList.push({name:'Don\'t Get \'im Riled!', desc:'Add current Wound Level to damage rolls.'});
        EdgeList.push({name:'Duelist', desc:'Recieve two extra Hole Cards at the start of a duel.'});
        EdgeList.push({name:'Fan the Hammer', desc:'Roll up to 6 shooting dice at -4.  See text.'});
        EdgeList.push({name:'Improve Fan the Hammer', desc:'Roll up to 6 shooting dice at -2.  See text.'});
        EdgeList.push({name:'Quick Draw', desc:'Get two cards when spending a Benny for an additional action card.  Also, add +2 to Athletics rolls made to interupt other\'s actions'});
        EdgeList.push({name:'Agent', desc:'Access to Agency resources.'});
        EdgeList.push({name:'Born in the Saddle', desc:'Free reroll on riding, mount has a +2 pace and increased running die one step.'});
        EdgeList.push({name:'Card Sharp', desc:'One free reroll on Gambling'});
        EdgeList.push({name:'Guts', desc:'One free reroll on Fear Checks'});
        EdgeList.push({name:'Scout', desc:'Ability to roll -2 to detect encounter first, +2 Common kn'});
        EdgeList.push({name:'Soldier', desc:'As SWADE, see Deadlands pg 21 for Ranks and pay.'});
        EdgeList.push({name:'Tale-Teller', desc:'+2 to Persuasion or Performance rolls to reduce local Fear Level.'});
        EdgeList.push({name:'Territorial Ranger', desc:'Access to Rangers resources, see text.'});
        EdgeList.push({name:'Reputation', desc:'+2 to Intimidation rolls against those who know.'});
        EdgeList.push({name:'Grit', desc:'Reduce Fear check penalties by 2.  Can stack with Brave.'});
        EdgeList.push({name:'Harrowed', desc:'You are a Harrowed Character, see text.'});
        EdgeList.push({name:'Knack', desc:'You have a special ability since birth, see text.'});
        EdgeList.push({name:'Behold a Pale Horse...', desc:'You have a powerful steed, see text.'});
        EdgeList.push({name:'Damned', desc:'You will return as Harrowed after death.'});
        EdgeList.push({name:'Fast as Lightning', desc:'You get a fourth action, increase multi-action penalty to -6 which can be reduced normally.'});
        EdgeList.push({name:'Right hand of the Devil', desc:'Your favored shooting iron does extra damage of it\'s highest die type'});
        EdgeList.push({name:'True Grit', desc:'Ignore all penalties to Fear Checks.'});
    }

}

//Build Hindrance List
{
var HindranceList = [];

    //Core Hindrances (57)
    {
        HindranceList.push({name:"All Thumbs", type:"Minor", desc:"–2 to use mechanical or electrical devices."});
        HindranceList.push({name:"Anemic", type:"Minor", desc:"–2 Vigor when resisting Fatigue."});
        HindranceList.push({name:"Arrogant", type:"Major", desc:"Likes to dominate his opponent, challenge the most powerful foe in combat."});
        HindranceList.push({name:"Bad Eyes", type:"Minor", desc:"–1 to all Trait rolls dependent on vision."});
        HindranceList.push({name:"Bad Eyes", type:"Major", desc:"–2 to all Trait rolls dependent on vision."});
        HindranceList.push({name:"Bad Luck", type:"Major", desc:"The characters starts with one less Benny per session."});
        HindranceList.push({name:"Big Mouth", type:"Minor", desc:"Unable to keep secrets and constantly gives away private information."});
        HindranceList.push({name:"Blind", type:"Major", desc:"–6 to all tasks that require vision (but choice of a free Edge to offset)."});
        HindranceList.push({name:"Bloodthirsty", type:"Major", desc:"Never takes prisoners."});
        HindranceList.push({name:"Can’t Swim", type:"Minor", desc:"–2 to swimming (Athletics) rolls; Each inch moved in water costs 3” of Pace."});
        HindranceList.push({name:"Cautious", type:"Minor", desc:"The character plans extensively and/or is overly careful."});
        HindranceList.push({name:"Clueless", type:"Major", desc:"–1 to Common Knowledge and Notice rolls."});
        HindranceList.push({name:"Clumsy", type:"Major", desc:"–2 to Athletics and Stealth rolls."});
        HindranceList.push({name:"Code of Honor", type:"Major", desc:"The character keeps his word and acts like a gentleman."});
        HindranceList.push({name:"Curious", type:"Major", desc:"The character wants to know about everything."});
        HindranceList.push({name:"Death Wish", type:"Minor", desc:"The hero wants to die after or while completing some epic task."});
        HindranceList.push({name:"Delusional", type:"Minor", desc:"The individual believes something strange that causes him occasional or frequent trouble."});
        HindranceList.push({name:"Delusional", type:"Major", desc:"The individual believes something strange that causes him occasional or frequent trouble."});
        HindranceList.push({name:"Doubting Thomas", type:"", desc:"The character doesn’t believe in the supernatural, often exposing him to unnecessary risks."});
        HindranceList.push({name:"Driven", type:"Minor", desc:"The hero’s actions are driven by some important goal or belief."});
        HindranceList.push({name:"Driven", type:"Major", desc:"The hero’s actions are driven by some important goal or belief."});
        HindranceList.push({name:"Elderly", type:"Major", desc:"–1 to Pace, running, Agility, Strength, and Vigor. Hero gets 5 extra skill points."});
        HindranceList.push({name:"Enemy", type:"Minor", desc:"The character has a recurring nemesis."});
        HindranceList.push({name:"Enemy", type:"Major", desc:"The character has a recurring nemesis."});
        HindranceList.push({name:"Greedy", type:"Minor", desc:"The individual is obsessed with wealth and material possessions."});
        HindranceList.push({name:"Greedy", type:"Major", desc:"The individual is obsessed with wealth and material possessions."});
        HindranceList.push({name:"Habit", type:"Minor", desc:"Addicted to something, suffers Fatigue if deprived."});
        HindranceList.push({name:"Habit", type:"Major", desc:"Addicted to something, suffers Fatigue if deprived."});
        HindranceList.push({name:"Hard of Hearing", type:"Minor", desc:"–4 to Notice sounds."});
        HindranceList.push({name:"Hard of Hearing", type:"Major", desc:"Automatic Failure to Notice sounds."});
        HindranceList.push({name:"Heroic", type:"Major", desc:"The character always helps those in need."});
        HindranceList.push({name:"Hesitant", type:"Minor", desc:"Draw two Action Cards and take the lowest (except Jokers, which may be kept)."});
        HindranceList.push({name:"Illiterate", type:"Minor", desc:"The character cannot read or write."});
        HindranceList.push({name:"Impulsive", type:"Major", desc:"The hero leaps before he looks."});
        HindranceList.push({name:"Jealous", type:"Minor", desc:"The individual covets what others have."});
        HindranceList.push({name:"Jealous", type:"Major", desc:"The individual covets what others have."});
        HindranceList.push({name:"Loyal", type:"Minor", desc:"The hero is loyal to his friends and allies."});
        HindranceList.push({name:"Mean", type:"Minor", desc:"–1 to Persuasion rolls."});
        HindranceList.push({name:"Mild Mannered", type:"Minor", desc:"–2 to Intimidation rolls."});
        HindranceList.push({name:"Mute", type:"Major", desc:"The hero cannot speak."});
        HindranceList.push({name:"Obese", type:"Minor", desc:"Size +1, Pace –1 and running die of d4. Treat Str as one die type lower for Min Str."});
        HindranceList.push({name:"Obligation", type:"Minor", desc:"The character has a weekly obligation of 20 hours."});
        HindranceList.push({name:"Obligation", type:"Major", desc:"The character has a weekly obligation of 40 hours."});
        HindranceList.push({name:"One Arm", type:"Major", desc:"–4 to tasks (such as Athletics) that require two hands."});
        HindranceList.push({name:"One Eye", type:"Major", desc:"–2 to actions at 5″ (10 yards) or more distance."});
        HindranceList.push({name:"Outsider", type:"Minor", desc:"The character doesn’t fit in to the local environment and subtracts 2 from Persuasion rolls."});
        HindranceList.push({name:"Outsider", type:"Major", desc:"The character doesn’t fit in to the local environment and subtracts 2 from Persuasion rolls. She also has no legal rights or other serious consequences."});
        HindranceList.push({name:"Overconfident", type:"Major", desc:"The hero believes she can do anything."});
        HindranceList.push({name:"Pacifist", type:"Minor", desc:"Fights only in self-defense."});
        HindranceList.push({name:"Pacifist", type:"Major", desc:"Will not fight at all, not even in self-defense."});
        HindranceList.push({name:"Phobia", type:"Minor", desc:"The character is afraid of something, and subtracts –1 from all Trait rolls in its presence."});
        HindranceList.push({name:"Phobia", type:"Major", desc:"The character is afraid of something, and subtracts –2 from all Trait rolls in its presence."});
        HindranceList.push({name:"Poverty", type:"Minor", desc:"Half starting funds and the character is always broke."});
        HindranceList.push({name:"Quirk", type:"Minor", desc:"The individual has some minor but persistent foible that often annoys others."});
        HindranceList.push({name:"Ruthless", type:"Minor", desc:"The character does what it takes to get her way."});
        HindranceList.push({name:"Ruthless", type:"Major", desc:"The character does what it takes to get her way."});
        HindranceList.push({name:"Secret", type:"Minor", desc:"The hero has a dark secret of some kind."});
        HindranceList.push({name:"Secret", type:"Major", desc:"The hero has a dark secret of some kind."});
        HindranceList.push({name:"Shamed", type:"Minor", desc:"The individual is haunted by some tragic event from her past."});
        HindranceList.push({name:"Shamed", type:"Major", desc:"The individual is haunted by some tragic event from her past."});
        HindranceList.push({name:"Slow", type:"Minor", desc:"Pace –1, reduce running die one step. May not take Fleet-Footed."});
        HindranceList.push({name:"Slow", type:"Major", desc:"Pace –2, reduce running die one step, –2 to Athletics and rolls to resist Athletics. May not take Fleet-Footed."});
        HindranceList.push({name:"Small", type:"Minor", desc:"Size and Toughness are reduced by 1. Size cannot be reduced below –1."});
        HindranceList.push({name:"Stubborn", type:"Minor", desc:"The character wants his way and rarely admits his mistakes."});
        HindranceList.push({name:"Suspicious", type:"Minor", desc:"The individual is paranoid."});
        HindranceList.push({name:"Suspicious", type:"Major", desc:"The individual is paranoid. Allies subtract 2 when rolling to Support him."});
        HindranceList.push({name:"Thin Skinned", type:"Minor", desc:"The character is particularly susceptible to personal attacks. -2 when resisting Taunt attacks."});
        HindranceList.push({name:"Thin Skinned", type:"Major", desc:"The character is particularly susceptible to personal attacks. -4 when resisting Taunt attacks."});
        HindranceList.push({name:"Tongue-Tied", type:"Major", desc:"The character often misspeaks or can’t get her words out. –1 to Intimidation, Persuasion, and Taunt rolls."});
        HindranceList.push({name:"Ugly", type:"Minor", desc:"The character is physically unattractive and subtracts 1 from Persuasion rolls."});
        HindranceList.push({name:"Ugly", type:"Major", desc:"The character is physically unattractive and subtracts 2 from Persuasion rolls."});
        HindranceList.push({name:"Vengeful", type:"Minor", desc:"The adventurer seeks payback for slights against her."});
        HindranceList.push({name:"Vengeful", type:"Major", desc:"The adventurer seeks payback for slights against her. She’ll cause physical harm to get it."});
        HindranceList.push({name:"Vow", type:"Minor", desc:"The individual has pledged himself to some cause."});
        HindranceList.push({name:"Vow", type:"Major", desc:"The individual has pledged himself to some cause."});
        HindranceList.push({name:"Wanted", type:"Minor", desc:"The character is wanted by the authorities."});
        HindranceList.push({name:"Wanted", type:"Major", desc:"The character is wanted by the authorities."});
        HindranceList.push({name:"Yellow", type:"Major", desc:"–2 to Fear checks and resisting Intimidation."});
        HindranceList.push({name:"Young", type:"Minor", desc:"Minor has 4 attribute points and 10 skill points, extra Benny per session."});
        HindranceList.push({name:"Young", type:"Major", desc:"Major has 3 attribute points, 10 skill points, and two extra Bennies per session."});
    }
}



//Build SpecialAbility List
{
var SpecialAbilityList = [];

    //Core Special Abilities (139)
    {
        SpecialAbilityList.push({name:'Aquatic', desc:'The creature is native to the water. It is a natural swimmer and cannot drown.'});
        SpecialAbilityList.push({name:'Armor', desc:'A creature’s Armor is written in parentheses next to its total Toughness'});
        SpecialAbilityList.push({name:'Bite', desc:'Natural Weapon'});
        SpecialAbilityList.push({name:'Breath', desc:'Dragons and other “fire breathers” use a Cone Template for their attacks (see Area Effect attacks on page 97). Breath attacks may be Evaded (page 100).'});
        SpecialAbilityList.push({name:'Burrow', desc:'Burrowers can tunnel underground and reappear elsewhere for devastating surprise attacks against their foes.'});
        SpecialAbilityList.push({name:'Claws', desc:'Natural Weapon'});
        SpecialAbilityList.push({name:'Construct', desc:'Robots, golems, and other animated objects are collectively called “constructs.”'});
        SpecialAbilityList.push({name:'Elemental', desc:'Air, earth, fire, and water form the basis of the elemental realms, wherein dwell strange, unfathomable creatures.'});
        SpecialAbilityList.push({name:'Environmental Resistance', desc:'The creature is resistant (but not immune) to a particular type of energy or substance, such as cold, heat, iron, etc.'});
        SpecialAbilityList.push({name:'Environmental Weakness', desc:'The creature is susceptible to a particular type of energy or substance, such as cold, heat, iron, etc.'});
        SpecialAbilityList.push({name:'Ethereal', desc:'Ghosts, shadows, will-o’-the-wisps, and similar intangible creatures have no form in the physical world (or can turn it on and off at will).'});
        SpecialAbilityList.push({name:'Fear', desc:'Particularly frightening monsters cause Fear checks to all who see them.'});
        SpecialAbilityList.push({name:'Fearless', desc:'Mindless creatures, some undead, robots, and the like don’t suffer from the weaknesses of the mortal mind.'});
        SpecialAbilityList.push({name:'Flight', desc:'The creature can fly at the listed Pace. It uses its Athletics to maneuver in chases or other situations.'});
        SpecialAbilityList.push({name:'Gargantuan', desc:'Gargantuan creatures are those that are at least Size 12 or higher. Classic movie monsters like Godzilla fall into this category.'});
        SpecialAbilityList.push({name:'Hardy', desc:'If the beast is Shaken, another Shaken result doesn’t cause a Wound.'});
        SpecialAbilityList.push({name:'Horns', desc:'Natural Weapon'});
        SpecialAbilityList.push({name:'Immunity', desc:'Creatures born in fire aren’t affected by heat, and a horror made of pure lightning won’t suffer from a bolt attack with an electrical trapping.'});
        SpecialAbilityList.push({name:'Infection', desc:'A character Shaken or Wounded by a creature with Infection must make a Vigor roll.'});
        SpecialAbilityList.push({name:'Infravision', desc:'Nocturnal beasts often see in the infrared spectrum—meaning they can “see” by detecting heat.'});
        SpecialAbilityList.push({name:'Invulnerability', desc:'Some Savage Tales feature invulnerable horrors that can only be defeated by discovering their weakness.'});
        SpecialAbilityList.push({name:'Illusion', desc:'A manitou can activate one illusion (per the power) as a free action once per turn. No roll required, as if a raise with Strong and Sound modifiers.  Can maintain as long as focus (-1 all other Trait rolls) is maintained.  May only have one illusion active at a time.'});
        SpecialAbilityList.push({name:'Low Light Vision', desc:'Low Light Vision ignores penalties for Dim and Dark Illumination (but not Pitch Darkness).'});
        SpecialAbilityList.push({name:'Paralysis', desc:'Victims who suffer damage or a Shaken result from such a creature must make a Vigor roll or be Stunned. They’re also paralyzed and incapable of any action— even speech—for 2d6 rounds (or longer if otherwise specified).'});
        SpecialAbilityList.push({name:'Poison', desc:'Snakes, spiders, and other creatures inject poisonous venom via bite or scratch. To do so, the thing must cause at least a Shaken result to the victim, who then makes a Vigor roll modified by the strength of the poison (listed in parentheses after the creature’s Poison ability). Effects of failure are described in more detail in the Hazards section (page 128).'});
        SpecialAbilityList.push({name:'Regeneration', desc:'Legend has it that trolls, vampires, and certain other types of legendary creatures can Regenerate damage caused to them.'});
        SpecialAbilityList.push({name:'Very Resilient', desc:'Very Resilient Extras can take two wounds. Wild Cards can’t be Resilient or Very Resilient.'});
        SpecialAbilityList.push({name:'Resilient', desc:'Resilient Extras can take one wound. Wild Cards can’t be Resilient or Very Resilient.'});
        SpecialAbilityList.push({name:'Size', desc:'Size grants a bonus to Toughness (or penalty for small creatures) and is a guide to the typical Strength of creatures in that general range.'});
        SpecialAbilityList.push({name:'Stun', desc:'creature with this ability often has an electrical attack, mild toxin, mind lash, or similar trapping.'});
        SpecialAbilityList.push({name:'Swat', desc:'The creature has learned how to deal with pesky creatures smaller than itself.'});
        SpecialAbilityList.push({name:'Tentacles', desc:'The creature has a number of “tentacle actions” specified in its description (usually 2 or 4).'});
        SpecialAbilityList.push({name:'Undead', desc:'Zombies, skeletons, and similar physical horrors are particularly difficult to destroy.'});
        SpecialAbilityList.push({name:'Wall Walker', desc:'Some creatures have the ability to walk on walls. They automatically walk on vertical or inverted surfaces just as a human walks on the earth.'});
        SpecialAbilityList.push({name:'Weakness', desc:'Some creatures suffer additional damage or can only be hurt by their Weakness.'});
    }
    
    //Horror at Headstone Hill Special Abilities
    {
        SpecialAbilityList.push({name:'Replicant', desc:'+2 Toughness; Called Shots do no extra damage; Environmental Weakness (Fire); Fearless; Hardy; Mimic.'});
    }
}
// -----------------------------------  START ----------------------------
// catch the invocation command (!SWADE-Import )
// start parsing the GM notes
on('chat:message', function(msg) {

   // Only run when message is an api type and contains "!PathfinderImport"
   if (msg.type === 'api' && msg.content.indexOf('!SW-Import') !== -1) {
       
      sendChat('', '/w gm SW Statblock Import Started');
      
      // Make sure Variables are clear
      Attributes.length = 0;
      Skills.length = 0;
      Hindrances.length = 0;
      Edges.length = 0;
      Weapons.length = 0;
      SpecialAbilities.length = 0;
      
      var paceMod = 0;
      var paceModText = '';
      var parryMod = 0;
      var parryModText = '';
      var toughnessMod = 0;
      var toughnessModText = "";
      var shakenMod = 0;
      var shakenModText = "";
      var woundPenaltyMod = 0;
      var woundPenaltyModText = "";
      var initEdges = '';
      var showSpecAbilities = '0';
      
      var pace = 6;
      var armor = 0;
      var size = 0;
      var runDie = 'd6';
      var unarmedDie = '';
      var fightingBonusDie = '';
      
      // Make sure there's a selected object
      if (!(msg.selected && msg.selected.length > 0)) {
         sendChat("ERROR", "No Token Selected.");
         return;
      }

      // Don't try to set up a drawing or card 
      var token = getObj('graphic', msg.selected[0]._id);
      if (token.get('subtype') !== 'token') {
         sendChat("ERROR", "Must select a Token, not a drawing or a card.");
         return;
      }

      //*************  START CREATING CHARACTER****************

      // get notes from token
      var originalGmNotes = token.get('gmnotes');
      const text = decodeEditorText(token.get('gmnotes'), {
         separator: '<BR>'
      });
      var gmNotes = text;
      if (!gmNotes) {
         sendChat("ERROR", "GM Notes is empty.");
         return;
      }
      // sendChat("","Post Decode gmNotes = [" + gmNotes + "]" );
      // return;

      //break the string down by line returns     
      var data = [];
      data = gmNotes.split('<BR>'); // post aaron change

      //clean any characters excepting text and hyperlinks
      
      // Progress: dieProgression[dieProgression.indexOf("d6")+1]
      var dieProgression = ['d4', 'd6', 'd8', 'd10', 'd12'];
      
      var charNameLine = "";
      var charName = "";
      var wildCard = 0;
      var skipLoop = 0;
      for (var i = 0; i < data.length; i++) {
         data[i] = data[i].trim();
         // grab the first line with text
         if (/[A-Z]+/.test(data[i]) && !skipLoop) {
            skipLoop = 1;
            charNameLine = data[i];

            // prepend [WC!] in first column of first line to make the creature a wildcard 
            if (charNameLine.match(/^\[WC\!\]/)) {
               wildCard = 1;
            }
            //Pick UP WW when Copy from SWADE Core Book, and L when Copy from Deadlands
            if (charNameLine.match(/^\[WC\!\]/)) {
               wildCard = 1;
            }
            
            // get the name of the monster to build the journal entry
            if (wildCard) {
               charName = charNameLine.match(/^\[WC\!\](.*)/)[1];
            }
            else {
               charName = charNameLine.match(/^(.*)/)[1];
            }
         }
      }
      if (verboseMode) {
         log('charName = [' + charName + ']');
         log("Wild Card: = [" + wildCard + "]");
      }

      // This javascript replaces all 3 types of line breaks with a space
      // This makes gmNotes 1 line of text
      gmNotes = gmNotes.replace(/([\r\n]+)/g, " ");

      //Replace all double white spaces with single spaces
      gmNotes = gmNotes.replace(/\s+/g, ' ');
      gmNotes = gmNotes.trim();

      //Replace unicode 8722 with Unicode 45
      gmNotes = gmNotes.replace(/\u2212/g, '-');
      
      gmNotes = gmNotes.replace(/ -/g, '');

//      if (verboseMode) {
         log("GM Notes: " + gmNotes.replace(/<BR>/g, ' '));
//      }

      // ------------------------------------------
      // ----- start extracting attributes --------
      // ------------------------------------------

      // Attributes

      if (!(/Agility/.test(gmNotes) && /Smarts/.test(gmNotes) && /Spirit/.test(gmNotes) && /Strength/.test(gmNotes) && /Vigor/.test(gmNotes))) {
         sendChat("ERROR", "Attributes (Agility, Strength, etc.) not found in GM Notes!");
         return;
      }

      Attributes[0] = new Attribute( 'agility',    gmNotes.replace(/<BR>/g, ' ').match(/\Agility\s+(d\d+\+?\d*)/)[1] );
      Attributes[1] = new Attribute( 'smarts',     gmNotes.replace(/<BR>/g, ' ').match(/\Smarts\s+(d\d+\+?\d*)/)[1] );
      Attributes[2] = new Attribute( 'spirit',     gmNotes.replace(/<BR>/g, ' ').match(/\Spirit\s+(d\d+\+?\d*)/)[1] );
      Attributes[3] = new Attribute( 'strength',   gmNotes.replace(/<BR>/g, ' ').match(/\Strength\s+(d\d+\+?\d*)/)[1] );
      Attributes[4] = new Attribute( 'vigor',      gmNotes.replace(/<BR>/g, ' ').match(/\Vigor\s+(d\d+\+?\d*)/)[1] );
      
      if (verboseMode) {
          log('-----------Attributes----------');
          Attributes.forEach((attribute)=> {
             log('-----------' + attribute.Name + '----------');
             log("Die: " + attribute.Die);
             log("Mod: " + attribute.Mod);
             log("Sign: " + attribute.Sign);
             log("ModText: " + attribute.ModText); 
          })
      }
      
      // Derived Stats
      
      if (/Pace:\s+(\d+)/.test(gmNotes.replace(/<BR>/g, ' '))) {
         pace = gmNotes.replace(/<BR>/g, ' ').match(/Pace:\s+(\d+)/)[1];
      }

      // Toughness: 12 (4) 
      if (/Toughness:\s+\d+\s*\((\d+)\)/.test(gmNotes.replace(/<BR>/g, ' '))) {
         armor = gmNotes.replace(/<BR>/g, ' ').match(/Toughness:\s+\d+\s*\((\d+)\)/)[1];
      }

      if (verboseMode) {
         log("-----Derived Stats-----");
         log("Pace: " + pace);
         log("Armor: " + armor);
      }
        
        
        
      // Skills

      SkillList.forEach((skillName)=> {
        var patt = new RegExp(skillName + "\\s+d(\\d+)", "");
        if (patt.test(gmNotes.replace(/<BR>/g, ' '))) {
            var patt2 =  new RegExp(skillName + "\\s+(d\\d+(\\+|-)?\\d*)", "");
            Skills.push(new Skill(skillName.replace("Common Knowledge", "commonknowledge").replace("Weird Science", "weirdscience"), gmNotes.replace(/<BR>/g, ' ').match(patt2)[1] ));
            log(Skills.find(skill => skill.Name == skillName.replace("Common Knowledge", "commonknowledge").replace("Weird Science", "weirdscience")));
        }
      })
     

      if (verboseMode) {
          log('-----------Skills----------');
          Skills.forEach((skill)=> {
             log('-----------' + skill.Name + '----------');
             log("Die: " + skill.Die);
             log("Mod: " + skill.Mod);
             log("Sign: " + skill.Sign);
             log("ModText: " + skill.ModText); 
          })
      }
      

    //Special Abilities
      SpecialAbilityList.forEach((SpecialAbilityObj)=> {
        if(SpecialAbilityObj.name != 'Resilient'){
            var patt = new RegExp("(Special Abilities):.*" + SpecialAbilityObj.name, "");
            if (patt.test(gmNotes.replace(/<BR>/g, ' '))) {
                SpecialAbilities.push(new SpecialAbility(SpecialAbilityObj.name, SpecialAbilityObj.desc));
            }
        } else {
            if(!searchSpecialAbilities('Very Resilient')) {
                var patt = new RegExp("(Special Abilities):.*" + SpecialAbilityObj.name, "");
                if (patt.test(gmNotes.replace(/<BR>/g, ' '))) {
                    SpecialAbilities.push(new SpecialAbility(SpecialAbilityObj.name, SpecialAbilityObj.desc));
                }
            }
        }
      })

      // Special Abilities Trait Mods
      
      
      if (wildCard) {
         maxWounds = 3;
      }
      else {
         maxWounds = 1;
      }
      
      if (/(Special Abilities):?/.test(gmNotes.replace(/<BR>/g, ' '))) {
          showSpecAbilities = '1';
      }
          
      if(/\sBite:\sStr\+(d\d*)/g.test(gmNotes.replace(/<BR>/g, ' '))){
          var BiteText = gmNotes.replace(/<BR>/g, ' ').match(/\sBite:\sStr\+(d\d*)/g);
          
          if(/d{1}\d\+?\d*(\s|,|$)/g.test(BiteText)){
              
              var wDmg            = BiteText.toString().match(/d{1}\d\+?\d*(\s|,|$)/g)[0]; 
              var wDmgDie         = BiteText.toString().match(/d{1}\d\+?\d*(\s|,|$)/g)[0].match(/(d)(\d*)/g)[0].match(/\d+/g)[0];
              var wDmgQty         = '1';
              
              if(/(\+|-)(\d)/g.test(BiteText.toString().match(/d{1}\d\+?\d*(\s|,|$)/g)[0])){
                var wDmgBonusNum    = BiteText.toString().match(/d{1}\d\+?\d*(\s|,|$)/g)[0].match(/(\+|-)(\d)/g)[0].match(/\d+/g)[0];  
              } else { var wDmgBonusNum = ''; }
                    
           } else { wDmg = ''; }

           Weapons.push(new Weapon('Melee', 'Bite', '', '', '', '', '', '', '', wDmgQty, wDmgDie, wDmgBonusNum))
      } 
      
      if(/\sBite\/Claws:\sStr\+(d\d*)/g.test(gmNotes.replace(/<BR>/g, ' '))){
          var BiteText = gmNotes.replace(/<BR>/g, ' ').match(/\sBite\/Claws:\sStr\+(d\d*)/g);
          
          if(/d{1}\d\+?\d*(\s|,|$)/g.test(BiteText)){
              
              var wDmg            = BiteText.toString().match(/d{1}\d\+?\d*(\s|,|$)/g)[0]; 
              var wDmgDie         = BiteText.toString().match(/d{1}\d\+?\d*(\s|,|$)/g)[0].match(/(d)(\d*)/g)[0].match(/\d+/g)[0];
              var wDmgQty         = '1';
              
              if(/(\+|-)(\d)/g.test(BiteText.toString().match(/d{1}\d\+?\d*(\s|,|$)/g)[0])){
                var wDmgBonusNum    = BiteText.toString().match(/d{1}\d\+?\d*(\s|,|$)/g)[0].match(/(\+|-)(\d)/g)[0].match(/\d+/g)[0];  
              } else { var wDmgBonusNum = ''; }
                    
           } else { wDmg = ''; }

           Weapons.push(new Weapon('Melee', 'Bite', '', '', '', '', '', '', '', wDmgQty, wDmgDie, wDmgBonusNum))
           Weapons.push(new Weapon('Melee', 'Claws', '', '', '', '', '', '', '', wDmgQty, wDmgDie, wDmgBonusNum))
      }

      if (/(Special Abilities):?.*Undead/.test(gmNotes.replace(/<BR>/g, ' '))) {
         toughnessMod += 2;
         toughnessModText += " undead";
         shakenMod += 2;
         shakenModText += " undead";
         woundPenaltyMod += 1;
         woundPenaltyModText += " undead";
      }
      if (/(Special Abilities):?.*Replicant/.test(gmNotes.replace(/<BR>/g, ' '))) {
         toughnessMod += 2;
         toughnessModText += " replicant";
         
         Edges.push(new Edge('Hardy', 'Creation', 'A second Shaken result does not cause a Wound'));
      }
      if (/(Special Abilities):?.*Construct/.test(gmNotes.replace(/<BR>/g, ' '))) {
         log('Construct');
         shakenMod += 2;
         shakenModText += " construct";
         woundPenaltyMod += 1;
         woundPenaltyModText += " construct";
      }
      if (/(Special Abilities):?.*Elemental/.test(gmNotes.replace(/<BR>/g, ' '))) {
         woundPenaltyMod += 1;
         woundPenaltyModText += " Elemental";
      }
      if (/(Special Abilities):?.*Resilient/.test(gmNotes.replace(/<BR>/g, ' '))) {
         maxWounds = 2;
      }
      if (/(Special Abilities):?.*Very Resilient/.test(gmNotes.replace(/<BR>/g, ' '))) {
         maxWounds = 3;
      }
      //    Size 1  Size +1 
      if (/Size:?\s?(\+|-)?(\d+)/.test(gmNotes.replace(/<BR>/g, ' '))) {
         size = parseInt(gmNotes.replace(/<BR>/g, ' ').match(/Size:?\s?(\+|-)?(\d+)/)[0].match(/-?(\d+)/)[0]);
      }
      
      if (verboseMode) {
         log("----- Special Abilities -----");
         log("Size: " + size);
         log("ToughnessMod: " + toughnessMod + " (" + toughnessModText + ")");
         log("ShakenMod: " + shakenMod + " (" + shakenModText + ")");
         log("WoundPenaltyMod: " + woundPenaltyMod + " (" + woundPenaltyModText + ")");
         log("Max Wounds: " + maxWounds);
      }
      
      //Edges
      EdgeList.forEach((EdgeObj)=> {
        var patt = new RegExp("(Edges):.*" + EdgeObj.name, "");
        if (patt.test(gmNotes.replace(/<BR>/g, ' '))) {
            if(EdgeObj.name == 'Quick'){
                var patt2 = new RegExp("(Edges):.*Quick(?! Draw)");
                if (patt2.test(gmNotes.replace(/<BR>/g, ' '))) {
                    Edges.push(new Edge(EdgeObj.name, 'Creation', EdgeObj.desc));
                }
                    
            } else {
                Edges.push(new Edge(EdgeObj.name, 'Creation', EdgeObj.desc));    
            }
        }
      })
      
      
      //Edge Stat Adjustments
      
      if (/(Edges):.*Quick/.test(gmNotes)) {
          var Quick = true;
//         Edges.push(new Edge('Quick', 'Creation', 'The hero may discard and redraw Action Cards of 5 or lower.'));
         initEdges = initEdges + 'Qui,';
      }
      if (/(Edges):.*Improved Level Head/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Level Headed', 'Creation', 'Draw an additional Action Card each round in combat and choose which one to use.'));
//          Edges.push(new Edge('Improved Level Headed', 'Creation', 'Draw two additional Action Cards each round in combat and choose which one to use.'));
          var ImprovedLevelHeaded = true;
         initEdges = initEdges + 'ILH,';
      }
      if (/(Edges):.*Level Head/.test(gmNotes.replace(/<BR>/g, ' '))) {
//         Edges.push(new Edge('Level Headed', 'Creation', 'Draw an additional Action Card each round in combat and choose which one to use.'));
          var LevelHeaded = true;
         initEdges = initEdges + 'LH,';
      }
      if (/(Edges):.*Tactician/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Tactician', 'Creation', 'Draw an extra Action Card each turn that may be assigned to any allied Extra in Command Range.'));
          var Tactician = true;
         initEdges = initEdges + 'TT,';
      }
      if (/(Edges):.*Master Tactician/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Master Tactician', 'Creation', 'Draw and distribute two extra Action Cards instead of one.'));
          var MasterTactician = true;
         initEdges = initEdges + 'MTT,';
      }
      if (/(Edges):.*Mighty Blow/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Mighty Blow', 'Creation', 'On first successful Fighting roll, double damage when dealt a Joker.'));
          var MightyBlow = true;
         initEdges = initEdges + 'WCE,';
      }
      if (/(Edges):.*Dead Shot/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Dead Shot', 'Creation', 'First successful Athletics (throwing) or Shooting roll, double damage from when dealt a Joker.'));
          var DeadShot = true;
         initEdges = initEdges + 'WCE,';
      }
      if (/(Edges):.*Alertness/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Alertness', 'Creation', '+2 to Notice rolls.'));
          var Alertness = true;
          AdjustMod('skill', 'Notice', 2, 'Alertness');
      }
      if (/(Edges):.*Very Attractive/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Attractive', 'Creation', '+1 to Performance and Persuasion rolls.'));
//          Edges.push(new Edge('Very Attractive', 'Creation', '+2 to Performance and Persuasion rolls.'));
         var VeryAttractive = true;
         AdjustMod('skill', 'Performance', 2, 'Very Attractive');
         AdjustMod('skill', 'Persuasion', 2, 'Very Attractive');
      }
      if (/(Edges):.*Attractive/.test(gmNotes.replace(/<BR>/g, ' ')) && !VeryAttractive ) {
//          log("Attractive!");
//          Edges.push(new Edge('Attractive', 'Creation', '+1 to Performance and Persuasion rolls.'));
          var Attractive = true;
          AdjustMod('skill', 'Performance', 1, 'Attractive');
          AdjustMod('skill', 'Persuasion', 1, 'Attractive');
      }
      if (/(Edges):.*Brawny/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Brawny', 'Creation', 'Size (and therefore Toughness) +1. Treat Strength as one die type higher for Encumbrance and Minimum Strength to use weapons, armor, or equipment.'));
          var Brawny = true;
        size = parseInt(size) + 1;
      }
      if (/(Edges):.*Brute/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Brute', 'Creation', 'Link Athletics to Strength instead of Agility (including resistance). Short Range of any thrown item increased by +1. Double that for the adjusted Medium Range, and double again for Long Range.'));
          var Brute = true;
      }
      if (/(Edges):.*Combat Reflex/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Combat Reflex', 'Creation', '+2 Spirit to recover from being Shaken or Stunned.'));
          var CombatReflexes = true;
         shakenMod += 2;
         shakenModText += " CombatReflex";
      }
      if (/(Edges):.*Fleet Footed/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Fleet Footed', 'Creation', 'Pace +2, increase running die one step.'));
        var FleetFooted = true;
        runDie = dieProgression[dieProgression.indexOf(runDie)+1]  //Check!
      }
      if (/(Edges):.*Improved Block/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Block', 'Creation', '+1 Parry, ignore 1 point of Gang Up bonus.'));
//          Edges.push(new Edge('Improved Block', 'Creation', '+2 Parry, ignore 2 points of Gang Up bonus.'));
        var ImprovedBlock = true;
        parryMod += 2;
      }
      if (/(Edges):.*Block/.test(gmNotes.replace(/<BR>/g, ' ')) && !ImprovedBlock) {
          Edges.push(new Edge('Block', 'Creation', '+1 Parry, ignore 1 point of Gang Up bonus.'));
        var Block = true;
        parryMod += 1;
      }
      if (/(Edges):.*Bruiser/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Brawler', 'Creation', 'Toughness +1, add d4 to damage from fists; or increase it a die type if combined with Martial Artist, Claws, or similar abilities.'));
//          Edges.push(new Edge('Bruiser', 'Creation', 'Increase unarmed Strength damage a die type and Toughness another +1.'));
        var Bruiser = true;
        toughnessMod += 2;
        if(unarmedDie != ''){
            unarmedDie = dieProgression[dieProgression.indexOf(unarmedDie)+2]  //Check!
        } else {
            unarmedDie = 'd6';
        }
      }
      if (/(Edges):.*Brawler/.test(gmNotes.replace(/<BR>/g, ' ')) && !Bruiser) {
//        Edges.push(new Edge('Brawler', 'Creation', 'Toughness +1, add d4 to damage from fists; or increase it a die type if combined with Martial Artist, Claws, or similar abilities.'));
        var Brawler = true;
        toughnessMod += 1;
        if(unarmedDie != ''){
            unarmedDie = dieProgression[dieProgression.indexOf(unarmedDie)+1]  //Check!
        } else {
            unarmedDie = 'd4';
        }
      }
      if (/(Edges):.*Improved Frenzy/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Frenzy', 'Creation', 'Roll a second Fighting die with one melee attack per turn.'));
//          Edges.push(new Edge('Improved Frenzy', 'Creation', 'Roll a second Fighting die with up to two melee attacks per turn.'));
        var ImprovedFrenzy = true;
      }
      if (/(Edges):.*Frenzy/.test(gmNotes.replace(/<BR>/g, ' ')) && !ImprovedFrenzy) {
//          Edges.push(new Edge('Frenzy', 'Creation', 'Roll a second Fighting die with one melee attack per turn.'));
        var Frenzy = true;
      }
      if (/(Edges):.*Martial Warrior/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Martial Artist', 'Creation', 'Unarmed Fighting +1, fists and feet count as Natural Weapons, add d4 damage die to unarmed Fighting attacks (or increase die a step if you already have it).'));
//          Edges.push(new Edge('Martial Warrior', 'Creation', 'Unarmed Fighting +2, increase damage die type a step.'));
        var MartialWarrior = true;
        if(unarmedDie != ''){
            unarmedDie = dieProgression[dieProgression.indexOf(unarmedDie)+2]  //Check!
        } else {
            unarmedDie = 'd6';
        }
      }
      if (/(Edges):.*Martial Artist/.test(gmNotes.replace(/<BR>/g, ' ')) && !MartialWarrior) {
//          Edges.push(new Edge('Martial Artist', 'Creation', 'Unarmed Fighting +1, fists and feet count as Natural Weapons, add d4 damage die to unarmed Fighting attacks (or increase die a step if you already have it).'));
        var MartialArtist = true;
        if(unarmedDie != ''){
            unarmedDie = dieProgression[dieProgression.indexOf(unarmedDie)+1]
        } else {
            unarmedDie = 'd4';
        }
      }
      if (/(Edges):.*Improved Nerves of Steel/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Nerves of Steel', 'Creation', 'Ignore one level of Wound penalties.'));
//          Edges.push(new Edge('Improved Nerves of Steel', 'Creation', 'Ignore up to two levels of Wound penalties.'));
        var ImprovedNervesofSteel = true;
        WoundPenaltyMod += 2;
        WoundPenaltyModText += ' Improved Nerves of Steel';
      } 
      if (/(Edges):.*Nerves of Steel/.test(gmNotes.replace(/<BR>/g, ' ')) && !ImprovedNervesofSteel) {
//          Edges.push(new Edge('Nerves of Steel', 'Creation', 'Ignore one level of Wound penalties.'));
        var NervesofSteel = true;
        WoundPenaltyMod += 1;
        WoundPenaltyModText += ' Nerves of Steel';
      }
      if (/(Edges):.*Investigator/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Investigator', 'Creation', '+2 to Research and certain types of Notice rolls.'));
          var Investigator = true;
          AdjustMod('skill', 'Research', 2, 'Investigator');
      }
      if (/(Edges):.*Mr\. Fix It/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Mr. Fix It', 'Creation', '+2 to Repair rolls, half the time required with a raise.'));
          var MrFixIt = true;
          AdjustMod('skill', 'Repair', 2, 'Mr. Fix It');
      }
      if (/(Edges):.*Thief/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Thief', 'Creation', '+1 Thievery, Athletics rolls made to climb, Stealth in urban environments.'));
          var Thief = true;
          AdjustMod('skill', 'Thievery', 2, 'Thief');
      }
      if (/(Edges):.*Menacing/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Menacing', 'Creation', '+2 to Intimidation.'));
          var Menacing = true;
          AdjustMod('skill', 'Intimidation', 2, 'Menacing');
      }
      if (/(Edges):.*Healer/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Healer', 'Creation', '+2 to Healing rolls, magical or otherwise.'));
          var Healer = true;
         AdjustMod('skill', 'Healing', 2, 'Healer');
      }
      if (/(Edges):.*Tough As Nails/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Tough As Nails', 'Creation', 'The hero can take four Wounds before being Incapacitated.'));
          var ToughAsNails = true;
         maxWounds = 4;
      }
      if (/(Edges):.*Master of Arms/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Edges.push(new Edge('Weapon Master', 'Creation', 'Parry increases by +1 and Fighting bonus damage die is d8.'));
//          Edges.push(new Edge('Master of Arms', 'Creation', 'Parry increases another +1 and Fighting bonus damage die is d10.'));
         var MasterOfArms = true;
         parryMod += 2;
         parryModText += ' Master of Arms';
         fightingBonusDie = 'd10';
      }
      if (/(Edges):.*Weapon Master/.test(gmNotes.replace(/<BR>/g, ' ')) && !MasterOfArms) {
//          Edges.push(new Edge('Weapon Master', 'Creation', 'Parry increases by +1 and Fighting bonus damage die is d8.'));
         var WeaponMaster = true;
         parryMod += 1;
         parryModText += ' Weapon Master';
         fightingBonusDie = 'd8';
      }
      
      if (verboseMode) {
         log('-----------Edges----------');
          Edges.forEach((edge)=> {
             log('-----------' + edge.Name + '----------');
             log("Desc: " + edge.Desc);
          })
      }
        
      //Hindrances
      HindranceList.forEach((HindranceObj)=> {
        var pattMinor = new RegExp("(Hindrances):.*" + HindranceObj.name + "\\s\\(Minor");
        var pattMajor = new RegExp("(Hindrances):.*" + HindranceObj.name + "\\s\\(Major");
        var patt = new RegExp("(Hindrances):.*" + HindranceObj.name);

        if(pattMajor.test(gmNotes.replace(/<BR>/g, ' ')) && !searchHindrances(HindranceObj.name)){
            if(HindranceObj.type === 'Major'){
                if (patt.test(gmNotes.replace(/<BR>/g, ' '))) {
                    Hindrances.push(new Hindrance(HindranceObj.name, HindranceObj.type, HindranceObj.desc));
                }
            }
        } else if (pattMinor.test(gmNotes.replace(/<BR/g, ' ')) && !searchHindrances(HindranceObj.name)) {
            if(HindranceObj.type === 'Minor'){
                if (patt.test(gmNotes.replace(/<BR>/g, ' '))) {
                    Hindrances.push(new Hindrance(HindranceObj.name, HindranceObj.type, HindranceObj.desc));
                }
            }
        } else {
            if (patt.test(gmNotes.replace(/<BR>/g, ' ')) && !searchHindrances(HindranceObj.name)) {
                Hindrances.push(new Hindrance(HindranceObj.name, HindranceObj.type, HindranceObj.desc));
            }
        }
      })
      
      //Hindrance Stat Mods
      if (/(Hindrances):.*Hesitant/.test(gmNotes.replace(/<BR>/g, ' '))) {
 //         Hindrances.push(new Hindrance("Hesitant", "Minor", "Draw two Action Cards and take the lowest (except Jokers, which may be kept)."));
         var Hesitant = true;
         initEdges = initEdges + 'HH,';
      }
      if (/(Hindrances):.*Clueless/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Hindrances.push(new Hindrance("Clueless", "Major", "–1 to Common Knowledge and Notice rolls."));
         var Clueless = true;
         AdjustMod('skill', 'Notice', -1, 'Clueless');
         AdjustMod('skill', 'CommonKnowledge', -1, 'Clueless');
      }
      if (/(Hindrances):.*Clumsy/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Hindrances.push(new Hindrance("Clumsy", "Major", "–2 to Athletics and Stealth rolls."));
         var Clumsy = true;
         AdjustMod('skill', 'Athletics', -2, 'Clumsy');
         AdjustMod('skill', 'Stealth', -2, 'Clumsy');
      }
      if (/(Hindrances):.*Elderly/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Hindrances.push(new Hindrance("Elderly", "Major", "–1 to Pace, running, Agility, Strength, and Vigor. Hero gets 5 extra skill points."));
         var Elderly = true;
         paceMod += -1;
         paceModText += ' Elderly';
         runDie = dieProgression[dieProgression.indexOf(runDie)-1]
         AdjustMod('attribute', 'agility', -1, 'Elderly');
         AdjustMod('attribute', 'strength', -1, 'Elderly');
         AdjustMod('attribute', 'vigor', -1, 'Elderly');
      }
      if (/(Hindrances):.*Mean/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Hindrances.push(new Hindrance("Mean", "Minor", "–1 to Persuasion rolls."));
         var Mean = true;
         AdjustMod('skill', 'Persuasion', -1, 'Mean');
      }
      if (/(Hindrances):.*Mild Mannered/.test(gmNotes)) {
//          Hindrances.push(new Hindrance("Mild Mannered", "Minor", "–2 to Intimidation rolls."));
         var MildMannered = true;
         AdjustMod('skill', 'Intimidation', -2, 'Mild Mannered');
      }
      if (/(Hindrances):.*Obese/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Hindrances.push(new Hindrance("Obese", "Minor", "Size +1, Pace –1 and running die of d4. Treat Str as one die type lower for Min Str."));
         var Obese = true;
         size = parseInt(size) + 1;
         paceMod += -1;
         paceModText += ' Obese';
         runDie = 'd4';
      }
      if (/(Hindrances):.*Outsider \(Major/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Hindrances.push(new Hindrance("Outsider", "Major", "The character doesn’t fit in to the local environment and subtracts 2 from Persuasion rolls. As a Major Hindrance she has no legal rights or other serious consequences."));
         var Outsider = true;
         AdjustMod('skill', 'Persuasion', -2, 'Outsider \(Major)');
      }
      if (/(Hindrances):.*Outsider \(Minor/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Hindrances.push(new Hindrance("Outsider", "Minor", "The character doesn’t fit in to the local environment and subtracts 2 from Persuasion rolls."));
         var Outsider = true;
         AdjustMod('skill', 'Persuasion', -2, 'Outsider \(Minor)');
      }
      if (/(Hindrances):.*Slow \(Major/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Hindrances.push(new Hindrance("Slow", "Major", "Pace –2, –2 to Athletics and rolls to resist Athletics.  May not take the Fleet-Footed Edge."));
         var MajorSlow = true;
         paceMod += -2;
         paceModText += ' Slow \(Major)';
         AdjustMod('skill', 'Athletics', -2, 'Slow \(Major)');
      }
      if (/(Hindrances):.*Slow/.test(gmNotes.replace(/<BR>/g, ' ')) && !MajorSlow) {
//          Hindrances.push(new Hindrance("Slow", "Minor", "Pace –1, reduce running die one step.  May not take the Fleet-Footed Edge."));
         var MinorSlow = true;
         paceMod += -1;
         paceModText += ' Slow \(Minor)';
         if(dieProgression.indexOf(runDie) > 0){
            runDie = dieProgression[dieProgression.indexOf(runDie)-1]    
         } else {
             runDie = 'd4-1';
         }
      }
      if (/(Hindrances):.*Small/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Hindrances.push(new Hindrance("Small", "Minor", "Size and Toughness are reduced by 1. Size cannot be reduced below –1."));
         var Small = true;
         if(parseInt(size) >= 0){ size = parseInt(size) - 1; }
         toughnessMod += -1;
         toughnessModText += ' small';
      }
      if (/(Hindrances):.*Tongue-Tied/.test(gmNotes.replace(/<BR>/g, ' '))) {
//          Hindrances.push(new Hindrance("Tongue-Tied", "Major", "The character often misspeaks or can’t get her words out. –1 to Intimidation, Persuasion, and Taunt rolls."));
         var TongueTied = true;
         AdjustMod('skill', 'Persuasion', -1, 'Tongue-Tied');
         AdjustMod('skill', 'Intimidation', -1, 'Tongue-Tied');
         AdjustMod('skill', 'Taunt', -1, 'Tongue-Tied');
      }  
       if (/(Hindrances):.*Ugly \(Major/.test(gmNotes.replace(/<BR>/g, ' '))) {
//           Hindrances.push(new Hindrance("Ugly", "Major", "The character is physically unattractive and subtracts 2 from Persuasion rolls."));
         var MajorUgly = true;
         AdjustMod('skill', 'Persuasion', -2, 'Ugly \(Major)');
      }
      if (/(Hindrances):.*Ugly \(Minor/.test(gmNotes.replace(/<BR>/g, ' ')) && !MajorUgly) {
//          Hindrances.push(new Hindrance("Ugly", "Minor", "The character is physically unattractive and subtracts 1 from Persuasion rolls."));
         var MinorUgly = true;
         AdjustMod('skill', 'Persuasion', -2, 'Ugly \(Minor)');
      }
      
      
     
     if (verboseMode) {
         log('-----------Hindrances----------');
          Hindrances.forEach((hindrance)=> {
             log('-----------' + hindrance.Name + '----------');
             log('Type: ' + hindrance.Type);
             log("Desc: " + hindrance.Desc);
          })
      }
      
      // Weapons / Gear  - ToDo
      if(/(Gear):(.*\))/.test(gmNotes.replace(/<BR>/g, ' '))){
          var FullGear = gmNotes.replace(/<BR>/g, ' ').match(/(?:Gear:?\s)(.*\))/g)[0].replace(/Gear:?\s?/g, '');
          var GearList = [];
          log(FullGear);
          GearList = FullGear.split(")");
          GearList.forEach((gear)=> {
             log(gear);
             if(gear.length > 4){
                 if(/\d*\/\d*\/\d*/.test(gear)){
                     if(/.*\(/g.test(gear)){
                        var wName = gear.match(/.*\(/g)[0].replace(/\(/g, "").replace(/,/g, "").trim();    
                     } else { var wName = ''; }
                     
                     if(/\d*\/\d*\/\d*/g.test(gear)){
                        var wRange = gear.match(/\d*\/\d*\/\d*/g)[0];    
                     } else { var wRange = ''; }
                     
                     if(/\d+d\d+\+?-?\d*/g.test(gear)){
                        //log("here!"); log(gear.match(/\d+d\d+\+?-?\d*/g)[0].match(/(d)(\d*)/g)[0]); return;
                        var wDmg            = gear.match(/\d+d\d+\+?-?\d*/g)[0]; 
                        var wDmgDie         = gear.match(/\d+d\d+\+?-?\d*/g)[0].match(/(d)(\d*)/g)[0].match(/\d+/g)[0];
                        var wDmgQty         = gear.match(/\d+d\d+\+?-?\d*/g)[0].match(/(\d*)(d)/g)[0].match(/\d+/g)[0];
                        if(/(\+|-)(\d)/g.test(gear.match(/\d+d\d+\+?-?\d*/g)[0])){
                          var wDmgBonusNum    = gear.match(/\d+d\d+\+?-?\d*/g)[0].match(/(\+|-)(\d)/g)[0].match(/\d*/g)[0];  
                        } else { var wDmgBonusNum = ''; }
                        
                     } else { var wDmg = ''; }

                     if(/shots\s?\d*/g.test(gear)){
                        var wShots = gear.match(/shots\s?\d*/g)[0].match(/\d*/g)[0].replace(/shots\s?/,"");
                     } else { wShots = ''; }
                     
                     if(/AP\s?\d*/g.test(gear)){
                        var wAP = gear.match(/AP\s?\d*/g)[0].replace(/AP\s?/,"");    
                     } else { wAP = ''; }
                     
                     if(/RoF\s?\d*/g.test(gear)){
                        var wRoF = gear.match(/RoF\s?\d*/g)[0].match(/(RoF\s)(\d*)/g)[0].replace(/RoF\s?/,"");    
                     } else { wRof = ''; }
                     
                     Weapons.push(new Weapon('Ranged', wName, '', '', wRange, wAP, wRoF, wShots, wShots, wDmgQty, wDmgDie, wDmgBonusNum));
                     
                 } else { 
                     if(/.*\(/g.test(gear)){
                        var wName = gear.match(/.*\(/g)[0].replace(/\(/g, "").replace(/,/g, "").trim();    
                     } else { wName = ''; }
                     
                     if(/d{1}\d\+?\d*(\s|,|$)/g.test(gear)){
                        //log("here!"); log(gear.match(/d{1}\d\+?\d*(\s|,|$)/g)[0]); return;
                        var wDmg            = gear.match(/d{1}\d\+?\d*(\s|,|$)/g)[0]; 
                        var wDmgDie         = gear.match(/d{1}\d\+?\d*(\s|,|$)/g)[0].match(/(d)(\d*)/g)[0].match(/\d+/g)[0];
                        var wDmgQty         = '1';
                        
                        
                        if(/(\+|-)(\d)/g.test(gear.match(/d{1}\d\+?\d*(\s|,|$)/g)[0])){
                          var wDmgBonusNum    = gear.match(/d{1}\d\+?\d*(\s|,|$)/g)[0].match(/(\+|-)(\d)/g)[0].match(/\d+/g)[0];  
                        } else { var wDmgBonusNum = ''; }
                        
                     } else { wDmg = ''; }
                     
                     if(/AP\s?\d*/g.test(gear)){
                        var wAP = gear.match(/AP\s?\d*/g)[0].replace(/AP\s?/,"");    
                     } else { wAP = ''; }
                     
                     var wRange = '';
                     var wRoF = '';
                     var wShots = '';
                     
                     Weapons.push(new Weapon('Melee', wName, '', '', wRange, wAP, wRoF, wShots, wShots, wDmgQty, wDmgDie, wDmgBonusNum))
                 }
             } 
          })
          
          if (verboseMode) {
             log('-----------Weapons----------');
              Weapons.forEach((weapon)=> {
                 log('-----------' + weapon.Name + '----------');
                 log('Type: ' + weapon.Type);
                 log('Range: ' + weapon.Range);
                 log('DmgDieNum: ' + weapon.DmgDieNum)
                 log('DmgDieType: ' + weapon.DmgDieType)
                 log('DmgBonus: ' + weapon.DmgBonusNum)
                 log('Shots: ' + weapon.Shots);
                 log('AP: ' + weapon.AP);
                 log('RoF: ' + weapon.RoF);
              })
          }
      }
      
      
      //Powers - ToDo
      
      
      //Clean Up Variable
      log("Clean Up Variables");
      parryModText = parryModText.trim();
      toughnessModText = toughnessModText.trim();
      shakenModText = shakenModText.trim();
      woundPenaltyModText = woundPenaltyModText.trim();
      
      size += '';
      parryMod += '';
      toughnessMod += '';
      shakenMod += '';
      //woundPenaltyMod += '';
      maxWounds += '';
      
      // Build the character sheet with attributes

      // check if the character sheet entry already exists, if so error and exit.
      var CheckSheet = findObjs({
         _type: "character",
         name: charName
      });
      if (CheckSheet.length > 0) {
         sendChat("ERROR", "This character already exists.");
         return;
      };
      

      // rename and configure the token
      var tokenName = charName;

      // sendChat("", "token name: " + tokenName);
      token.set("name", tokenName);
      token.set("showname", true);
      token.set("showplayers_name", true);


      //Create character entry in journal, token image = avatar image
      if(verboseMode){ log("Create Char"); }
      var character = createObj("character", {
         avatar: token.get("imgsrc"),
         name: charName,
         archived: false
      });

      // format GM notes for Bio
      gmNotes = gmNotes.replace(/\[WC\!\]/, '<b>[WC!]</b> ');
      gmNotes = gmNotes.replace(charName, '<b>' + charName + '</b><br>');
      gmNotes = gmNotes.replace('Attributes', '<br><b>Attributes </b>');
      gmNotes = gmNotes.replace('Skills', '<br><b>Skills </b>');
      gmNotes = gmNotes.replace('Edges', '<br><b>Edges </b>');
      gmNotes = gmNotes.replace('Harrowed Edges', '<br><b>Harrowed Edges </b>');
      gmNotes = gmNotes.replace('Special Abilities', '<br><b>Special Abilities </b>');
      gmNotes = gmNotes.replace('Pace', '<br><b>Pace</b>');
      gmNotes = gmNotes.replace('Gear', '<br><b>Gear </b>');
      gmNotes = gmNotes.replace('Powers', '<br><b>Powers </b>');

      log("Set Bio");
      character.set('bio', gmNotes);

      // assign token to represent character
      var charID = character.get('_id');
      token.set("represents", charID);

      //assign token to be default token
      // have to do this outside script for now
      setDefaultTokenForCharacter(character, token);

      // Assign all the attributes to the character sheet
      //Generic Default Attributes
      
      
      AddAttribute('useAlphaNum', 1, null, charID);
      if(wildCard == 1){
          AddAttribute('is_npc', "0", null, charID);
      } else {
          AddAttribute('is_npc', "1", null, charID);
      }  
        
      
      //Ability Scores
      
      if(verboseMode){ log("Assiging Attributes"); }
      Attributes.forEach((attribute)=> {
          var atMod = '';
             if(attribute.Sign = '+') { atMod = attribute.Mod + ''; } else { atMod = '-' + attribute.Mod; }
             AddAttribute(attribute.Name, attribute.Die, null, charID);
             AddAttribute(attribute.Name.substring(0,2).toLowerCase() + 'rollMod' , atMod, null, charID);
             AddAttribute(attribute.Name.substring(0,2).toLowerCase() +'ModType', attribute.ModText, null, charID);
       })
       
       
      //Skills
      if(verboseMode){ log("Assiging Skills");}
      Skills.forEach((skill)=> {
          var skMod = '';
          if(skill.Sign === '+') { 
              skMod = skill.Mod.toString() + ''; 
          } else { 
              skMod = '-' + skill.Mod.toString(); 
          }
          log("skill: " + skill.Name + ", Die: " + skill.Die + ", skMod: " + skMod + ", Orig Mod: " + skill.Mod);
          AddAttribute('static' + skill.Name, 'on', null, charID);
          AddAttribute(skill.Name, parseInt(skill.Die), null, charID);
          AddAttribute(skill.Name + 'skillMod' , skMod, null, charID);
          AddAttribute(skill.Name +'ModType', skill.ModText, null, charID);
          AddAttribute(skill.Name +'mod', skMod, null, charID);
       })
      
       //Special Abilities
       if(SpecialAbilities.length > 0){
           if(verboseMode){ log("Showing Spec Abilities"); }
           AddAttribute('showSpecAbilities', "1", null, charID);
           if(verboseMode){ log("Adding Special Abilities"); }
           SpecialAbilities.forEach((specialability)=> {
                 AddSpecialAbility(specialability, charID);
           })
       }
       
       //Hindrances
       if(verboseMode){ log("Adding Hindrances"); }
       Hindrances.forEach((hindrance)=> {
             AddHindrance(hindrance, charID);
       })
       
       //Edges
       if(verboseMode){ log("Adding Edges"); }
       Edges.forEach((edge)=> {
             AddEdge(edge, charID);
       })
       
       //Weapons
       if(verboseMode){ log("Adding Weapons"); }
       Weapons.forEach((weapon)=> {
             AddWeapon(weapon, charID);
       })
       
       
      //Calculated Fields and Mods:
      
      if(verboseMode){ log("Adding Calculated Fields / Mods"); }
      AddAttribute('wounds', '0', maxWounds, charID)
      AddAttribute('fatigue', '0', maxWounds, charID)
      AddAttribute('isShaken', '0', maxWounds, charID)
      AddAttribute('distracted', '0', maxWounds, charID)
      AddAttribute('vulnerable', '0', maxWounds, charID)
      AddAttribute('stunned', '0', maxWounds, charID)
      AddAttribute('size', size, null, charID);
      AddAttribute('pace', pace, null, charID);
//      AddAttribute('paceCur', pace, null, charID);
//      AddAttribute('parryCur', parry, null, charID);
//      AddAttribute('toughnessCur', toughness, null, charID);
      AddAttribute('toughnessArmor', armor, null, charID);
      AddAttribute('runningDie', runDie, null, charID);
      AddAttribute('InitEdges', initEdges, null, charID);
      
      
      
      if(woundPenaltyMod > -1){ AddAttribute('reducewoundsby', Math.abs(woundPenaltyMod), null, charID); }
      if(woundPenaltyMod < 0){ AddAttribute('increasewoundsby', Math.abs(woundPenaltyMod), null, charID); }
      
      //unshakemodtype
      log(shakenMod);
      if(shakenMod != ""){
         AddAttribute('unshakemod', shakenMod, null, charID);
         AddAttribute('unshakemodtype', shakenModText, null, charID);  
      }
      
      if(parryMod != ""){
//         AddAttribute('parryMod', parryMod, null, charID);
//         AddAttribute('parryModReason', parryModText, null, charID);
      }
      
      if(toughnessMod != "") {
         AddAttribute('tufnessMod', toughnessMod, null, charID);
         AddAttribute('toughnessModReason', toughnessModText, null, charID);
      }
      
      if(Brute){
          AddAttribute('linkedathleticsatt', 'str-u', null, charID);
      }

      if(verboseMode){ log("Char Created!"); }
      
      
      

      
          
        _.delay((d)=>{
            log("Delayed Processing to wait for Sheetworker to catch up!");
            if(typeof Skills.find(skill => skill.Name.toLowerCase() == 'fighting') !== 'undefined'){
                if(verboseMode) { log('Found Fighting!'); }
                FixFighting(charID);
            }
            Skills.forEach((skill)=> {
              var skMod = '';
              if(skill.Sign === '+') { 
                  skMod = skill.Mod.toString() + ''; 
              } else { 
                  skMod = '-' + skill.Mod.toString(); 
              }
              log("skill: " + skill.Name + ", Die: " + skill.Die + ", skMod: " + skMod + ", Orig Mod: " + skill.Mod);
           })
            
            
            sendChat('', '/w gm SW Statblock Import Complete');
            sendChat('', '/w gm Created: charName = [' + charName + '] Wild Card: = [' + wildCard + ']');
        },5000,charID);


        log('Async Done!');
      return;
   }
});
