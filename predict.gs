function checkPredict(){
  let dataH = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SPY HISTORY');
  if(dataH.getRange('C2').getValue() == ''){
    console.log("The user has already enter today's predictions");
  }
  else{
    console.log("The trigger will upload today's predictions");
    predict();
  }
}

function predict(){
  let dataH = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SPY HISTORY');
  let pred = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Predictions');
  
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/SPY`; 
  const res = UrlFetchApp.fetch(url, {muteHttpExceptions: true}); 
  const contentText = res.getContentText(); 
  const info = JSON.parse(contentText);

  //checks if data is uploaded
  if(checkData(info)) 
  {
    //get open price (new day)
    dataH.insertRowBefore(2);
    let date = new Date().toLocaleDateString();
    dataH.getRange('A2').setValue(date);
    let newOpen = getOpen(info);
    dataH.getRange('B2').setValue(Math.round(newOpen*100)/100);

    let calcMax = [method1('high', dataH, newOpen),method2('high', dataH, 30),method2('high', dataH, 365)];
    let calcMin = [method1('low', dataH, newOpen),method2('low', dataH, 30),method2('low', dataH, 365)];

    //upper and lower range
    let maxBounds = getBounds(calcMax);
    let minBounds = getBounds(calcMin);

    //suggestions for when to buy for the day
    let buy = getBuy(dataH, newOpen);

    let percentages = [pctChange(dataH, 1.01), pctChange(dataH, 1.02), pctChange(dataH, 1.03), pctChange(dataH, 0.99), pctChange(dataH, 0.98), pctChange(dataH, 0.97)]
    
    //places values into history
    dataH.getRange('M2').setValue(Math.round(calcMax[0]*100)/100);
    dataH.getRange('O2').setValue(Math.round(calcMax[1]*100)/100);
    dataH.getRange('Q2').setValue(Math.round(calcMax[2]*100)/100);
    dataH.getRange('N2').setValue(Math.round(calcMin[0]*100)/100);
    dataH.getRange('P2').setValue(Math.round(calcMin[1]*100)/100);
    dataH.getRange('R2').setValue(Math.round(calcMin[2]*100)/100);
    
    //places values into 'additional refrence information' section
    pred.getRange('C15').setValue(Math.round(calcMax[0]*100)/100);
    pred.getRange('D15').setValue(Math.round(calcMax[1]*100)/100);
    pred.getRange('E15').setValue(Math.round(calcMax[2]*100)/100);
    pred.getRange('C16').setValue(Math.round(calcMin[0]*100)/100);
    pred.getRange('D16').setValue(Math.round(calcMin[1]*100)/100);
    pred.getRange('E16').setValue(Math.round(calcMin[2]*100)/100);
    
    //places previous close and vwap
    pred.getRange('B5').setValue(dataH.getRange('C3').getValue())
    pred.getRange('B6').setValue(dataH.getRange('G3').getValue())

    //places today's open
    pred.getRange('B7').setValue(Math.round(newOpen*100)/100);

    //places high and low ranges
    pred.getRange('B15').setValue(Math.round(maxBounds[0]*100)/100 + "-" + Math.round(maxBounds[1]*100)/100);
    pred.getRange('B16').setValue(Math.round(minBounds[0]*100)/100 + "-" + Math.round(minBounds[1]*100)/100);

    //places buy and sell suggestions
    pred.getRange('B9').setValue(Math.round(buy*100)/100);
    pred.getRange('B10').setValue(Math.round(maxBounds[1]*100)/100);

    //places new prices based on open pct change
    pred.getRange('B19').setValue(Math.round(percentages[0]*100)/100);
    pred.getRange('B20').setValue(Math.round(percentages[1]*100)/100);
    pred.getRange('B21').setValue(Math.round(percentages[2]*100)/100);
    pred.getRange('D19').setValue(Math.round(percentages[3]*100)/100);
    pred.getRange('D20').setValue(Math.round(percentages[4]*100)/100);
    pred.getRange('D21').setValue(Math.round(percentages[5]*100)/100);

    //places rolling VWAPs
    pred.getRange('B24').setValue(dataH.getRange('H3').getValue())
    pred.getRange('B25').setValue(dataH.getRange('I3').getValue())
    pred.getRange('B26').setValue(dataH.getRange('J3').getValue())
    pred.getRange('B27').setValue(dataH.getRange('K3').getValue())
    pred.getRange('B28').setValue(dataH.getRange('L3').getValue())
  }
}

//open and high/low relationship
function method1(type, ss, currentO){  
  let histO = ss.getRange('B3:B367').getValues();
  if(type === 'high'){
    let histH = ss.getRange('D3:D367').getValues();
    let avgDiffHO = 0;
    for(let i=0;i<365;i++){
      avgDiffHO += histH[i]-histO[i];
    }
    avgDiffHO /= 365;
    return currentO + avgDiffHO;
  }

  else{
    let histL = ss.getRange('E3:E397').getValues();
    let avgDiffLO = 0;
    for(let i=0;i<365;i++){
      avgDiffLO += histL[i]-histO[i];
    }
    avgDiffLO /= 365;
    return currentO + avgDiffLO;
  }
}

//past VWAP and high/low relationship
function method2(type, ss, days){
  let index = days + 3; //get n+1 size because H/O and VWAP use diff index
  
  if(type === 'high'){
    let histWVAP = ss.getRange('G3:G'+index).getValues();
    let histH = ss.getRange('D3:D'+index).getValues();
    let avgDiffHWVAP = 0;
    for(let i=0;i<days;i++){
      avgDiffHWVAP += histH[i]-histWVAP[i+1];
    }
    avgDiffHWVAP/= days;
    return histWVAP[0][0]+avgDiffHWVAP;
    
  }

  else{
    let histC = ss.getRange('C3:C'+index).getValues();
    let histL = ss.getRange('E3:E'+index).getValues();
    let avgDiffLC = 0;
    for(let i=0;i<days;i++){
       avgDiffLC += histL[i]-histC[i+1];
    }
    avgDiffLC /= days;
    return histC[0][0]+avgDiffLC;
  }
}

function getBounds(array){
  let upBound = array.reduce((accumulator, currentValue) => {
    if(accumulator < currentValue){
      return currentValue;
    }
    return accumulator;
  })

  let lowBound = array.reduce((accumulator, currentValue) => {
    if(accumulator > currentValue){
      return currentValue;
    }
    return accumulator;
  })
  return [upBound, lowBound];
}

function getBuy(ss, currentO){
  let choices = [ss.getRange('C3').getValue(), ss.getRange('G3').getValue(), currentO];
  return choices.reduce((accumulator, currentValue) => {
    if(accumulator > currentValue){
      return currentValue;
    }
    return accumulator;
  })-2;
}

function pctChange(ss, amount){
  prevClose = ss.getRange('C3').getValue();
  return prevClose*amount;
}







