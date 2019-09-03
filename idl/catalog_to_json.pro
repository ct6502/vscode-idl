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


pro catalog_to_json_extract_items, mainKey, item, nProcessed, condensed, allNames, METHOD = method
  compile_opt idl2, hidden
  
  ;flag if we can use this routine or not
  flag = !true
  
  ;get the name and fix to lower case, this is not fortran
  name = item['%name']
  lowName = strlowcase(name)
  if strupcase(name) eq name then begin
    item['%name'] = strlowcase(name)
  endif

  ;skip if function
  if (lowName eq 'function') then return

  ;skip bad names
  if name.contains('/') then begin
    print, 'Routine name indicates more than one routine definition: "' + name + '"'
    return
  endif

  ;skip if not a valid name
  if ~idl_validname(name) AND ~keyword_set(method) then flag = !false

  ;do something fancy here is we already processed this to remove duplicates?
  ;more for classes which have the same name as functions.
  if allNames.hasKey(name) then begin
    ; there are some duplicates, only skip the envi ones because those are probably weird
    ; things that might be routines and classes, but duplicates? not quite sure
    if name.startsWith('ENVI') or name.startsWith('IDL') then flag = !false
  endif

  ; skip if ENVI task
;  if lowName.startsWith('envi') AND lowName.endsWith('task') then flag = !false

  ; skip if eniv task parameter
  if lowName.startsWith('enviparameter') then flag = !false
  if lowName.startsWith('idlparameter') then flag = !false

;  if lowName eq strlowcase('ENVIDeepLearningRaster::CreateTileIterator') then stop

  ;only process this item if we can
  if flag then begin
    ;init data structure and information
    info = orderedhash()
    info['label'] = item['%name']
    info['data'] = nProcessed
    info['detail'] = ''
    info['documentation'] = ''

    ;make sure we have a link that is a non-empty string
    if item.hasKey('%link') then begin
      if keyword_set(method) then begin
        tmp = item['%link']
        
        ; check if we dont have a link, then make it an anchor
        ; this does not always work, but we should at least have a parent page to go to
        ; in case this doesnt work
        if ~item['%link'].endsWith('.htm') then begin
          condensed['links', strtrim(nProcessed,2)] = method['%link'] + 'l#' + item['%link']
        endif else begin
          condensed['links', strtrim(nProcessed,2)] = item['%link']  + 'l'
        endelse
      endif else begin
        condensed['links', strtrim(nProcessed,2)] = item['%link'] + 'l'
      endelse
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

      ; store information about the different syntaxes that we can use
      docsExamples = list()

      ;process each potential syntax
      foreach syntax, syntaxes, sIdx do begin
        ; save syntax ifnormation
        docsExamples.add, syntax['%name']

        ;TODO: how to handle more syntax information?
        ;check if a function or procedure, only do the first one
        if (sIdx eq 0) then begin
          if syntax['%type'] eq 'pro' then begin
            condensed['procedures', strtrim(nProcessed,2)] = !true
          endif else begin
            condensed['functions', strtrim(nProcessed,2)] = !true
          endelse
          
          ; check if we are a method
          if keyword_set(method) then begin
            condensed['methods', strtrim(nProcessed,2)] = !true
          endif
        endif
      endforeach

      ; save the documentation
      info['documentation'] = docsExamples
    endif

    ;check if we have property information, exclude when an object property
    if item.hasKey('FIELD') then begin
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

    ; check if we have a class that we inherit from
    if item.hasKey('SUPERCLASS') then begin
      field = item['SUPERCLASS']
      if ~isa(field, 'list') then field = list(field)
      parents = list()
      foreach super, field do begin
        ;fix the super name, this is not fortran
        pName = super['%name']
        if strupcase(pName) eq pName then begin
          super['%name'] = strlowcase(pName)
        endif
        parents.add, super['%name']
      endforeach
      condensed['inherits', strtrim(nProcessed,2)] = parents
    endif

    ;save the information
    condensed['docs'].add, info

    ;save that we processed this name
    allNames[name] = !true

    ;increment counter
    nProcessed++
  endif
  
  ;check if we have methods to process, we can have a class with a routine of the same name, but still need to save information about the routine
  ; for example, ENVIRaster is a function and a class
  ; stop if class and new
  if item.hasKey('METHOD') then begin
    ; make sure we have a list
    methods = item['METHOD']
    if ~isa(methods, 'list') then methods = list(methods)
    
    ; recurse!
    foreach method, methods do begin
      catalog_to_json_extract_items, mainKey, method, nProcessed, condensed, allNames, METHOD = item
    endforeach
  endif
end


; get this deirectory
thisDir = file_dirname(routine_filepath())

; build the output directory
outDir = strjoin([file_dirname(thisdir), 'server', 'routines'], path_sep())

;init data structures for filtered information
condensed = orderedhash()
condensed['docs'] = list()
condensed['properties'] = orderedhash()
condensed['links'] = orderedhash()
condensed['functions'] = orderedhash()
condensed['procedures'] = orderedhash()
condensed['methods'] = orderedhash()
condensed['inherits'] = orderedhash()

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
    print, 'Parsing XML: ' +  file
    parsedFiles[file] = xml_parse(file)
  endif
  
  ;extract the useful information
  parsed = parsedFiles[file]
  
  ;get the catalog
  catalog = parsed['CATALOG']
  
  ;process the catalogs of routines into something much more useful
  foreach mainKey, ['SYSVAR', 'ROUTINE', 'CLASS'] do begin
    ;skip if we don't have the key
    if ~catalog.hasKey(mainKey) then continue
    
    ;process each item we have
    foreach item, catalog[mainKey], idx do begin
      ; extract items from our catalog entry
      catalog_to_json_extract_items, mainKey, item, nProcessed, condensed, allNames
    endforeach
  endforeach
endforeach

;write to a file on disk
print, 'exporting to disk'
tic
str = json_serialize(condensed)
toc
openw, lun, outDir + path_sep() + 'idl.json', lun, /GET_LUN
printf, lun, str
free_lun, lun

end