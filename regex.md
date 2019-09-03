
routine comments
(?<=^\s*;\+.*\n)(^\s*;.*\n)*(?=^\s*;-.*\n^\s*pro |^\s*;-.*\n^\s*function )

comment blocks
(?<=^\s*;\+.*\n)(^\s*;.*\n)*(?=^\s*;-.*\n)


replace ';' ' '

comment tags
(?<=^ *:)[a-z_0-9-\b ]+(?=:)

comment tags and content as capture group
((?<=^ *:)[a-z_0-9- ]+):(.*\n?(?!^ *:[a-z_0-9- ]+:))*

get start, split all lines, substring lines by start of the first line

for parameters, args and keywords with descriptions
((?<=^ *)[a-z_0-9- ]+):(.*\n?(?!^ *[a-z_0-9- ]+:))*

if we have no empty lines, we can find all code blocks that are one line
(.+\$.*\n)((?<=.+,.*\$.*\n).*\n)*