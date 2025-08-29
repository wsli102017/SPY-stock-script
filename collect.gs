function checkCollect(){
  let dataH = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SPY HISTORY');
  if(dataH.getRange('C2').getValue() !== ''){
    console.log("The user has already collected today's data");
  }
  else{
    console.log("The trigger will upload today's data");
    collect();
  }
}

function collect(){
  //setup
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SPY HISTORY');
  
  //get data from yahoo finance
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/SPY`; 
  const res = UrlFetchApp.fetch(url, {muteHttpExceptions: true}); 
  const contentText = res.getContentText(); 
  const info = JSON.parse(contentText);
  
  //makes sure data is uploaded
  if(checkData(info)){ 
    let closeV = getClose(info);
    let highV = getHigh(info);
    let lowV = getLow(info);
    let volumeV = getVolume(info);
    let vwap = calcVWAP(info, volumeV);

    //places values into history
    sheet.getRange('C2').setValue(Math.round(closeV*100)/100);
    sheet.getRange('D2').setValue(Math.round(highV*100)/100);
    sheet.getRange('E2').setValue(Math.round(lowV*100)/100);
    sheet.getRange('F2').setValue(Math.round(volumeV*100)/100);
    sheet.getRange('G2').setValue(Math.round(vwap*100)/100);
    
    //rolling VWAPs
    let rollingYTD = getRollingVWAP(sheet, ytd(new Date()));
    let rolling5 = getRollingVWAP(sheet, 5);
    let rolling20 = getRollingVWAP(sheet, 20);
    let rolling50 = getRollingVWAP(sheet, 50);
    let rolling200 = getRollingVWAP(sheet, 200);
    
    //places values into history
    sheet.getRange('H2').setValue(Math.round(rolling5*100)/100);
    sheet.getRange('I2').setValue(Math.round(rolling20*100)/100);
    sheet.getRange('J2').setValue(Math.round(rolling50*100)/100);
    sheet.getRange('K2').setValue(Math.round(rolling200*100)/100);
    sheet.getRange('L2').setValue(Math.round(rollingYTD*100)/100);
    
  }
}

//finds amount of days since beginning of year
function ytd(dt) { 
  let current = new Date(dt.getTime()); //time since Jan 1
  let previous = new Date(dt.getFullYear(), 0, 1); //Jan 1
  return Math.ceil((current - previous + 1) / 86400000); //rounds up to next day if decimal 
}

//checks data from yahoo finance
function checkData(data) { 
  if (data && data.chart && data.chart.result && data.chart.result.length > 0) { 
    return true;
  }
  else { 
    console.log("Error: Unable to retrieve info."); 
    return false; 
  } 
}

function getOpen(data){
  return data.chart.result[0].indicators.quote[0].open[0];
}

function getClose(data){
  return data.chart.result[0].indicators.quote[0].close[390];
}

function getHigh(data){
  return data.chart.result[0].indicators.quote[0].high.reduce((accumulator, currentValue) =>{
      if(currentValue == null){    //if price at minute isn't documted
        return accumulator;
      }
      if(accumulator < currentValue){   //checks if next value is array is higher
        return currentValue;
      }
      return accumulator;
    });
}

function getLow(data){
  return data.chart.result[0].indicators.quote[0].low.reduce((accumulator, currentValue) =>{
    if(currentValue == null){    //if price at minute isn't documted
      return accumulator;
    }
    if(accumulator > currentValue){   //checks if next value is array is lower
      return currentValue;
    }
    return accumulator;
    });
}

function getVolume(data){
  let v = 0
  data.chart.result[0].indicators.quote[0].volume.forEach(num =>{  //total volume for the day
    v+=num;
  });
  return v;
}

//find vwap
function calcVWAP(data, vol){
  let sumPV = 0;

  //arrays of prices
  let h = data.chart.result[0].indicators.quote[0].high;
  let l = data.chart.result[0].indicators.quote[0].low;
  let c = data.chart.result[0].indicators.quote[0].close;
  let v = data.chart.result[0].indicators.quote[0].volume;

  for(let i=0;i<391;i++){
    pv = (h[i]+l[i]+c[i])/3*v[i];  //price volume every minute
    sumPV += pv;
  }
  return sumPV/vol;
   
}

function getRollingVWAP(ss, days){
  let index = days+1; 
  let vArray = ss.getRange('F2:F'+index).getValues();
  let vwapArray = ss.getRange('G2:G'+index).getValues();
  let rollingVWAP = 0;
  
  for(let i=0;i<days;i++){
    rollingVWAP += vwapArray[i][0]*vArray[i][0]; //weights the vwap based on the volume
  }
  
  let totalVolume = vArray.reduce((accumulator, currentValue) =>{
    return accumulator += currentValue[0]; //finds total volume from n days
  }, 0);
  
  return rollingVWAP/totalVolume;
}
