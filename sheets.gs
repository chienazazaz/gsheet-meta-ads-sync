const ss = SpreadsheetApp.getActiveSpreadsheet()
const configSheet = ss.getSheetByName("Config")

const SHEET_CONFIGS = {
  "ad_accounts": {
    "mode": "replace",
    "e_col": "H",
    unique_col: [1]
  },
  "ad_insights": {
    "mode": "append",
    "e_col": "M",
    unique_col: [1, 2, 3, 4, 5, 6]
  },
  "ad_action_insights": {
    "mode": "append",
    "e_col": "K",
    unique_col: [1, 2, 3, 4, 5, 6,7]
  }
}

function getFirstDayOfWeek(date) {
  let sdate=new Date(date)
  const first = sdate.getDate() - sdate.getDay() + 1;
  return new Date(sdate.setDate(first)).toISOString().split("T")[0];
}

function getLastDayOfWeek(date) {
  const last = date.getDate() - date.getDay() + 7;
  return new Date(date.setDate(last)).toISOString().split("T")[0];
}

function getConfig() {
  const businessID = configSheet.getRange("B6").getValue()
  const accessToken = configSheet.getRange("B7").getValue()
  const latestDate = configSheet.getRange("B8").getValue()
  return { businessID, accessToken, latestDate }
}

function setData(sheetName, data) {
  const sheet = ss.getSheetByName(sheetName)
  let dataLength = data.length
  let range

  if (SHEET_CONFIGS[sheetName].mode === "replace") {
    sheet.clearContents().clearFormats()
    range = `A3:${SHEET_CONFIGS[sheetName].e_col}${dataLength + 2}`
  }

  if (SHEET_CONFIGS[sheetName].mode === "append") {
    const lastRow = sheet.getLastRow()
    range = `A${lastRow > 3 ? lastRow + 1 : 4}:${SHEET_CONFIGS[sheetName].e_col}${lastRow > 3 ? dataLength + lastRow : dataLength + 3}`
  }

  sheet.getRange(range).setValues(data).setNumberFormat("@STRING@")
  sheet.getRange("A1").setValue(new Date().toISOString())

  Logger.log(`Synced new data for sheet ${sheetName}. ${data.length} modified`)

  sheet.getDataRange().removeDuplicates(SHEET_CONFIGS[sheetName].unique_col)
  Logger.log("Removed duplicates data")
}