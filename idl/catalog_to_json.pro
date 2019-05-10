;+
;  Wrapper routine that converts IDL help catalog files to a condensed,
;  more organized, JSON file format for use with the IDL extension.
;  
;  To use this you should have ENVI + IDL and the ENVI Deep Learning Module
;  installed because they have all of the routines needed for creating the
;  JSON lookup table.
;
; :Author: Zachary Norman - GitHub: znorman-harris
;-




;init data structures for filtered information
condensed = orderedhash()
condensed['docs'] = list()
condensed['properties'] = orderedhash()
condensed['links'] = orderedhash()
condensed['functions'] = orderedhash()
condensed['procedures'] = orderedhash()

;track all of the names
allNames = orderedhash(/FOLD_CASE)

;search for the data catalog files
folder = !dir + path_sep() + 'help'
files = file_search(folder, '*_catalog.xml', COUNT = nFiles)

;make sure that we found file
if ~nFiles then begin
  message, 'No files found where expected!'
endif

;check if we have envi and idl, need to skip IDL if that is the case
if max(files.endswith('envi_catalog.xml')) then begin
  idxKeep = where(~files.endsWith('idl_catalog.xml'), countKeep)
  if (countKeep eq 0) then begin
    message, 'Problem with logic somewhere'
  endif
  files = files[idxKeep]
endif

;parse files if we have not already
;this is a main level program to store the results in memory
;because they are large XML files to parse
if ~isa(parsedFiles, 'hash') then begin
  parsedFiles = orderedhash()
endif

;track number of processed items
nProcessed = 0

;process each file
foreach file, files do begin
  ;did we parse the file already?
  if ~parsedFiles.hasKey(file) then begin
    print, 'Parsing XML:' +  file
    parsedFiles[file] = xml_parse(file)
  endif
  
  ;extract the useful information
  parsed = parsedFiles[file]
  
  ;get the catalog
  catalog = parsed['CATALOG']
  
  ;process the catalogs of routines into something much more useful
  foreach mainKey, ['SYSVAR', 'ROUTINE'] do begin
    ;skip if we don't have the key
    if ~catalog.hasKey(mainKey) then continue
    
    ;process each item we have
    foreach item, catalog[mainKey], idx do begin
      ;get the name and fix to lower case, this is not fortran
      name = item['%name']
      lowName = strlowcase(name)
      if strupcase(name) eq name then begin
        item['%name'] = strlowcase(name)
      endif

      ;skip if function
      if (name eq 'function') then continue

      ;skip bad names
      if name.contains('/') then begin
        print, 'Routine name indicates more than one routine definition: "' + name + '"'
        continue
      endif

      ;skip if not a valid name
      if ~idl_validname(name) then continue
      
      ;do something fancy here is we already processed this to remove duplicates?
      ;more for classes which have the same name as functions.
      if allNames.hasKey(name) then continue

      ;init data structure and information
      info = orderedhash()
      info['label'] = item['%name']
      info['data'] = nProcessed
      info['detail'] = ''
      info['documentation'] = ''
      
      ;make sure we have a link that is a non-empty string
      if item.hasKey('%link') then begin
        if item['%link'] then condensed['links', strtrim(nProcessed,2)] = item['%link']
      endif

      ;check if we have a description
      if item.hasKey('DESCRIPTION') then begin
        desc = item['DESCRIPTION']
        info['detail'] = desc['%name']
      endif

      ;check if we have syntax
      if item.hasKey('SYNTAX') then begin
        syntaxes = item['SYNTAX']

        ;check if we have a stupid list and we need to get the first
        if ~isa(syntaxes, 'list') then syntaxes = list(syntaxes)

        ;process each potential syntax
        foreach syntax, syntaxes, sIdx do begin
          ;TODO: how to handle more syntax information?
          ;check if a function or procedure, only do the first one
          if (sIdx eq 0) then begin
            ;save the name
            info['documentation'] = syntax['%name']

            if syntax['%type'] eq 'pro' then begin
              condensed['procedures', strtrim(nProcessed,2)] = !true
            endif else begin
              condensed['functions', strtrim(nProcessed,2)] = !true
            endelse
          endif
        endforeach
      endif

      ;check if we have property information, exclude when an object property
      if item.hasKey('FIELD') AND (mainKey ne 'CLASS') then begin
        field = item['FIELD']
        if ~isa(field, 'list') then field = list(field)
        properties = orderedhash()
        foreach property, field do begin
          ;fix the property name, this is not fortran
          pName = property['%name']
          if strupcase(pName) eq pName then begin
            property['%name'] = strlowcase(pName)
          endif
          properties[property['%name']] = property['%description']
        endforeach
        condensed['properties', strtrim(nProcessed,2)] = properties
      endif

      ;save the information
      condensed['docs'].add, info
      
      ;save that we processed this name
      allNames[name] = !true
      
      ;increment counter
      nProcessed++
    endforeach
  endforeach
endforeach

;write to a file on disk
print, 'exporting to disk'
tic
str = json_serialize(condensed)
toc
openw, lun, 'C:\Users\Traininglead\Documents\github\vscode-idl\server\routines\idl.json', lun, /GET_LUN
printf, lun, str
free_lun, lun

end