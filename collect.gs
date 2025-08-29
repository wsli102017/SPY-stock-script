function formatData(){
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SPY HISTORY');
  let headers = sheet.getRange('A1:Y1');
  let table = sheet.getDataRange();

  headers.setFontWeight('bold');
  headers.setFontColor('white');
  headers.setBackground('blue');
    
  table.setFontFamily('Roboto');
  table.setHorizontalAlignment('center');
  table.setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID);
}
function formatPrediction(){
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Predictions');
  let table = sheet.getRange('A1:E28');
  
  sheet.setColumnWidths(1, 5, 370);
  sheet.setRowHeights(1, 28, 75);
  sheet.setRowHeight(2, 25);
  sheet.setRowHeight(8, 25);
  sheet.setRowHeight(13, 25);
  sheet.setRowHeight(17, 25);
  sheet.setRowHeight(22, 25);
  sheet.setHiddenGridlines(true);

  table.setBackgroundColor('white');
  table.setFontSize(28);
  table.setFontWeight('bold');
  table.setFontFamily('Exo');
  table.setFontColor('white');
  table.setHorizontalAlignment('center');
  table.setVerticalAlignment('middle');

  let disclaimer = sheet.getRange('A1');
  disclaimer.setFontSize(22);
  disclaimer.setFontColor('red'); 
  disclaimer.setHorizontalAlignment('left');
  
  sheet.getRange('A3:B7').setBackgroundColor('black');

  sheet.getRange('A9:B12').setBackgroundColor('blue');

  sheet.getRange('A14:E14').setBackgroundColor('black');
  sheet.getRange('A15:E16').setBackgroundColor('gray');

  sheet.getRange('A18:D18').setBackgroundColor('black');
  sheet.getRange('A19:D21').setBackgroundColor('gray');
  sheet.getRange('A18').setHorizontalAlignment('left');
  
  sheet.getRange('A23:B23').setBackgroundColor('black');
  sheet.getRange('A24:B28').setBackgroundColor('gray');
}

function onOpen(){
  let ui = SpreadsheetApp.getUi();
  let item = ui.createMenu('Options')
  item.addItem('Format Data', 'formatData').addToUi();
  item.addItem('Format Predictions', 'formatPrediction').addToUi();
  item.addItem("Predict Today's range", 'predict').addToUi()
  item.addItem("Add Today's data", 'collect').addToUi();
}
