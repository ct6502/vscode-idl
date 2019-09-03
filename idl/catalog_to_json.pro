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


;+
; :Private:
;
; :Description:
;    Updates the contents of the IDL SAVE file that
;    contains the routines for tooltips and documentation
;    by reading from a file called idl_routines.csv in this
;    directory.
;
;
;
;-
function catalog_to_json_get_tooltips
  compile_opt idl2, hidden

  ;get the current directory
  thisdir = file_dirname(routine_filepath())

  ;check for the CSV file
  routines = thisdir + path_sep() + 'idl_routines.csv'

  ; read in the strings
  nLines = file_lines(routines)
  toolDatabase = strarr(nLines)
  openr, lun, routines, /GET_LUN
  readf, lun, toolDatabase
  free_lun, lun

  ;track duplicate objects
  duplicates = list()

  ;create a hash with our tooltips
  tooltips = orderedhash(/FOLD_CASE)

  ;process and validate we can ingest
  foreach line, toolDatabase, idx do begin
    ;split our line
    split = strsplit(line, ';', /EXTRACT)

    ;skip if not enough splits for routines
    if (n_elements(split) ne 6) then continue

    ;extract our information
    name = strlowcase(strmid(split[1], 1, strlen(split[1])-2))
    tt = strmid(split[2], 1, strlen(split[2])-2)
    link = strmid(split[4], 1, strlen(split[4])-2)

    ;create our hash lookup
    lookup = {tooltip: tt, link: link}

    ;save to our hash
    tooltips[name] = lookup

    ;check if we have an object name
    pos = strpos(name, '::')
    if (pos ne -1) then begin
      ;get our method name
      method = strmid(name, pos)

      ;check if we need to skip
      if (duplicates.where(strlowcase(method)) ne !NULL) then continue

      ;check if we have a key already and remove as there are two methods
      ;with the same name meaning we cant correctly identify it
      if tooltips.hasKey(method) then begin
        ;preserve duplicate tooltips if the tooltips are the same
        if (strlowcase(tooltips[method].tooltip) eq strlowcase(tt)) then begin
          ;if two tooltips, blast the method links!
          if (strlowcase(tooltips[method].tooltip) ne strlowcase(link)) then begin
            s = tooltips[method]
            s.link = ''
            tooltips[method] = s
          endif
        endif else begin
          ;conflicting tooltips, so throw them out
          duplicates.add, strlowcase(method)
          tooltips.remove, method
        endelse
      endif else begin
        tooltips[method] = {tooltip: tt, link: link}
      endelse
    endif

    ;check if we have a control statement
    pos = strpos(name, '...')
    if (pos ne -1) then begin
      ;extract the start of the control statement
      control = strmid(name, 0, pos + 3)

      ;make a new entry in our hash
      tooltips[control] = {tooltip: tt, link: link}
    endif
  endforeach
  
  ; return the tooltips that we have created
  return, tooltips
end

pro catalog_to_json_extract_items, mainKey, item, nProcessed, condensed, allNames, tooltips, METHOD = method, TYPE = type
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

  ; skip if envi task parameter, no need for these right now
  if lowName.startsWith('enviparameter') then flag = !false
  if lowName.startsWith('idlparameter') then flag = !false

  ; if (lowName eq 'idl_idlbridge') then stop

  ;only process this item if we can
  if flag then begin
    ;init data structure and information
    info = orderedhash()
    info['label'] = item['%name']
    info['data'] = nProcessed
    info['detail'] = ''
    info['documentation'] = ''
    
    ; check if we have a tooltip for the detail
    if tooltips.hasKey(name) then begin
      info['detail'] = tooltips[name].tooltip
    endif

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
      
      ; placeholder for the type
      if ~keyword_set(type) then type = ''

      ;process each potential syntax
      foreach syntax, syntaxes, sIdx do begin
        ; save syntax ifnormation
        docsExamples.add, syntax['%name']
        
        ;check if a function or procedure
        ; if we have pro, then we need to keep checking if we have a func syntax
        ; no idea why the help is so confusing and mix + matches the func/pro
        if (type eq 'pro') or (sIdx eq 0) then begin
          ; get the trimmed syntax
          trimmed = strlowcase(strcompress(syntax['%name'], /REMOVE_ALL))
          if (syntax['%type'] eq 'pro') AND (type ne 'func') then begin
            ; cant revert from function
            type = 'pro'
          endif else begin
            type = 'func'
          endelse
        endif
      endforeach

      ; check if we are a method
      if keyword_set(method) AND ~item.hasKey('%object creation') then begin
        condensed['methods', strtrim(nProcessed,2)] = !true
      endif

      ;save the things and stuff
      if keyword_set(type) then begin
        if (type eq 'pro') then begin
          condensed['procedures', strtrim(nProcessed,2)] = !true
        endif else begin
          condensed['functions', strtrim(nProcessed,2)] = !true
        endelse
      endif

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
      condensed['properties', lowname] = properties
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

    ; ony save if we are not a class and a method
    if (mainKey ne 'CLASS') OR keyword_set(method) then begin
      ;save the information
      condensed['docs'].add, info

      ;save that we processed this name
      allNames[name] = !true

      ;increment counter
      nProcessed++
    endif

    ; check if we have an object init method and need to re-run with a function placeholder
    if lowName.endswith('::init') then begin
      ; copy our item and make a new name as a function call
      init_method = json_parse(json_serialize(item))
      init_method['%name'] = (init_method['%name'].split('::'))[0]
      init_method['%object creation'] = !true
      
      ; add new item for this
      catalog_to_json_extract_items, mainKey, init_method, nProcessed, condensed, allNames, tooltips, TYPE = 'func', METHOD = method
    endif
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
      catalog_to_json_extract_items, mainKey, method, nProcessed, condensed, allNames, tooltips, METHOD = item
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

; load our tooltips
if ~isa(tooltips, 'orderedhash()') then begin
  print, 'Loading tooltips...'
  tooltips = catalog_to_json_get_tooltips()
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
      catalog_to_json_extract_items, mainKey, item, nProcessed, condensed, allNames, toolTips
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