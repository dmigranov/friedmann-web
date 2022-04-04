function DrawAxes(context2d) {
    context2d.save() ;
    context2d.lineWidth = 2 ;
    // +Y axis
    context2d.beginPath() ;
    context2d.moveTo(XC(0),YC(0)) ;
    context2d.lineTo(XC(0),YC(MaxY())) ;
    context2d.stroke() ;
   
    // -Y axis
    context2d.beginPath() ;
    context2d.moveTo(XC(0),YC(0)) ;
    context2d.lineTo(XC(0),YC(MinY())) ;
    context2d.stroke() ;
   
    // Y axis tick marks
    var delta = YTickDelta() ;
    for (var i = 1; (i * delta) < MaxY() ; ++i) {
     context2d.beginPath() ;
     context2d.moveTo(XC(0) - 5,YC(i * delta)) ;
     context2d.lineTo(XC(0) + 5,YC(i * delta)) ;
     context2d.stroke() ;  
    }
   
    var delta = YTickDelta() ;
    for (var i = 1; (i * delta) > MinY() ; --i) {
     context2d.beginPath() ;
     context2d.moveTo(XC(0) - 5,YC(i * delta)) ;
     context2d.lineTo(XC(0) + 5,YC(i * delta)) ;
     context2d.stroke() ;  
    }  
   
    // +X axis
    context2d.beginPath() ;
    context2d.moveTo(XC(0),YC(0)) ;
    context2d.lineTo(XC(MaxX()),YC(0)) ;
    context2d.stroke() ;
   
    // -X axis
    context2d.beginPath() ;
    context2d.moveTo(XC(0),YC(0)) ;
    context2d.lineTo(XC(MinX()),YC(0)) ;
    context2d.stroke() ;
   
    // X tick marks
    var delta = XTickDelta() ;
    for (var i = 1; (i * delta) < MaxX() ; ++i) {
     context2d.beginPath() ;
     context2d.moveTo(XC(i * delta),YC(0)-5) ;
     context2d.lineTo(XC(i * delta),YC(0)+5) ;
     context2d.stroke() ;  
    }
   
    var delta = XTickDelta() ;
    for (var i = 1; (i * delta) > MinX() ; --i) {
     context2d.beginPath() ;
     context2d.moveTo(XC(i * delta),YC(0)-5) ;
     context2d.lineTo(XC(i * delta),YC(0)+5) ;
     context2d.stroke() ;  
    }
    context2d.restore() ;
   }