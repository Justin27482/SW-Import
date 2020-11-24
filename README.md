# SW-Import

First of all I am standing on the shoulders of giants.  Thanks pelwar, Aaron and anyone else who's code went into this before I got my hands on it!  I took pelwar's statblock importer and adjusted to use objects and array's.  I also adjusted all the attributes to be compatible with the Official Savage Worlds sheet.

#How to Use
1.  Place the token you want to use for your character onto a map page.
2.  Copy the stat block you wish to use and paste it into a plain text editor like Notepad to remove any formatting.
3.  Paste plain text stat block into the GM Notes of the token you want to use for this character.
4.  With your token selected enter !SW-Import into the chat box to begin the Import.
5.  Wait until you see "SW Statblock Import Complete" before doing anything else, the script has some delays built in to allow the Sheet Calculations to take place.

#Version info
Current Version is 1.0.6

Currently it should do the following:

Read any SWADE Statblock placed in the GM Info section of a token and then:

Create Character Sheet
Import Attributes
Import Skills
Import Special Abilities (Also applies any consistant skill/stat/etc modifier)
Import Edges (Also applies any consistant skill/stat/etc modifier)
Import Hinderances (Also applies any consistant skill/stat/etc modifier)
Calculate and adjust Derived stats
Calculate modifiers due to:
  Special Abilities
  Edges
  Hinderances
Set Token used as Default Token
Set Token Image as Character Avatar Image
Add Weapons to the sheet


Next Tasks:
Processing Powers and adding to sheet in repeating section
