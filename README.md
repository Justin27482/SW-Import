# SW-Import

First of all I am standing on the shoulders of giants.  Thanks pelwar, Aaron and anyone else who's code went into this before I got my hands on it!  I took pelwar's statblock importer and adjusted to use objects and array's.  I also adjusted all the attributes to be compatible with this Official Savage Worlds sheet.



Currently it should do the following:

Read any SWADE Statblock placed in the GM Info section of a token and then:

Create Character Sheet
Import Attributes
Import Skills
Import Special Abilities
Import Edges (Only lists those that affect stats on the sheet)
Import Hinderances (Only lists those that affect stats on the sheet)
Calculate and adjust Derived stats
Calculate modifiers due to:
  Special Abilities
  Edges
  Hinderances
Set Token used as Default Token
Set Token Image as Character Avatar Image


I have hopes of adding the following:

Processing Weapons and adding to sheet in repeating section
Processing Powers and adding to sheet in repeating section
I am currently struggling with how to write Regex that will also grab text before the (12/24/48 Range.....) etc for ranged weapons or the (Str+2d6+1) melee damage indicators to allow the code to differentiate between items in the Gear section (Ranged, Melee, Thrown, or not a weapon).  Any help with that will help me get the weapons/powers section added, otherwise it might need some other method figured out.
