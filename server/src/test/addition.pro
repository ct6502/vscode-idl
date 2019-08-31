;+
; :Description:
;    Addition task example
;
; :Examples:
;    http://<hostname>:9191/ese/IDL/addition/execute?a=2&b=2
;
; :Params:
;    a: first number input
;    b: second number input
;    c: optional third number input
;       
; :Returns:
;    answer: result number
;       
;-
pro addition, ;A=a, $ ;comments in here like you know whats up
              B=b, $
              RESULT=result, $
              C=c
  compile_opt idl2
  some$thing
  data = sin(2.0*findgen(200)*!PI/25.0)*EXP(exponent*FINDGEN(200))
  if (c eq !NULL) then begin
    result = a + b
  endif else begin
    result = a + b + c
  endelse
  if (c eq !null) then result = 5 else result = 6
    
end